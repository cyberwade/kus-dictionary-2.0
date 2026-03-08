"""
Логирование запросов к OpenAI в текстовый файл.
Фиксирует: время, источник (sentences / historia_sentences), входные параметры, промпт, ответ API.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Файл лога в корне backend
_LOG_PATH = Path(__file__).resolve().parents[1] / "openai_requests.log"
_SEP = "\n" + "=" * 80 + "\n"


def _ensure_utf8(s: str) -> str:
    return s.encode("utf-8", errors="replace").decode("utf-8")


def log_openai_request(
    source: str,
    input_params: dict[str, Any],
    prompt: str,
    openai_response: str,
    openai_raw: Any = None,
) -> None:
    """
    Записать в лог один запрос к OpenAI.

    :param source: "sentences" или "historia_sentences"
    :param input_params: входные параметры метода (для сериализации в JSON)
    :param prompt: текст промпта, отправленный в OpenAI
    :param openai_response: извлечённый текст ответа (content)
    :param openai_raw: сырой объект ответа API (опционально, для отладки)
    """
    try:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        lines = [
            f"Время запроса: {timestamp}",
            f"Источник: {source}",
            "",
            "Входные параметры:",
            json.dumps(input_params, ensure_ascii=False, indent=2),
            "",
            "Промпт (отправлен в OpenAI):",
            "-" * 40,
            _ensure_utf8(prompt),
            "-" * 40,
            "",
            "Ответ OpenAI (content):",
            _ensure_utf8(openai_response),
        ]
        if openai_raw is not None:
            try:
                raw_str = json.dumps(openai_raw, ensure_ascii=False, indent=2, default=str)
            except Exception:
                raw_str = repr(openai_raw)
            lines.extend(["", "Ответ OpenAI (сырой объект):", raw_str])
        lines.append("")
        block = _SEP + "\n".join(lines)
        existing = _LOG_PATH.read_text(encoding="utf-8", errors="replace") if _LOG_PATH.exists() else ""
        _LOG_PATH.write_text(existing + block, encoding="utf-8")
    except Exception as e:
        # Не ломаем основной поток при ошибке записи лога
        try:
            existing = _LOG_PATH.read_text(encoding="utf-8", errors="replace") if _LOG_PATH.exists() else ""
            _LOG_PATH.write_text(
                existing + _SEP + f"Ошибка записи лога: {e!s}\n\n",
                encoding="utf-8",
            )
        except Exception:
            pass
