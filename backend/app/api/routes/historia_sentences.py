import json
from pathlib import Path

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.db.repositories import (
    add_historia_sentence,
    delete_historia_sentence,
    get_historia_sentences,
    update_historia_sentence,
)
from app.openai_request_log import log_openai_request

router = APIRouter(prefix="/historia-sentences", tags=["historia-sentences"])


def _load_prompt_template() -> str:
    path = Path(__file__).resolve().parents[2] / "sentence_prompt.txt"
    return path.read_text(encoding="utf-8")


class GenerateHistoriaSentenceRequest(BaseModel):
    historia_id: int
    historia_esp: str = ""
    historia_rus: str = ""
    comment: str = ""


class GenerateHistoriaSentenceResponse(BaseModel):
    sentence_esp: str
    sentence_rus: str


@router.post("/generate", response_model=GenerateHistoriaSentenceResponse)
def generate_historia_sentence(body: GenerateHistoriaSentenceRequest):
    """Генерация предложения для истории через OpenAI. Запрос фиксируется в openai_requests.log."""
    if not settings.OPENAI_API_KEY:
        return JSONResponse(
            status_code=503,
            content={"detail": "OpenAI API не настроен (OPENAI_API_KEY отсутствует)."},
        )
    try:
        template = _load_prompt_template()
        prompt = template.format(
            keyphrase_id=body.historia_id,
            keyphrase_rus=body.historia_rus or "",
            keyphrase_esp=body.historia_esp or "",
            keyfrase_comment=body.comment or "",
            additional_comment="",
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Ошибка загрузки промпта: {e!s}"},
        )

    input_params = body.model_dump()
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
        )
        text = (response.choices[0].message.content or "").strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)
        raw = {"content": text, "model": getattr(response, "model", None)}
        log_openai_request(
            source="historia_sentences",
            input_params=input_params,
            prompt=prompt,
            openai_response=text,
            openai_raw=raw,
        )
        data = json.loads(text)
        sentence_esp = data.get("sentence_esp") or ""
        sentence_rus = data.get("sentence_rus") or ""
        return GenerateHistoriaSentenceResponse(sentence_esp=sentence_esp, sentence_rus=sentence_rus)
    except json.JSONDecodeError as e:
        log_openai_request(
            source="historia_sentences",
            input_params=input_params,
            prompt=prompt,
            openai_response=f"[JSONDecodeError] {e!s}",
        )
        return JSONResponse(
            status_code=502,
            content={"detail": f"Некорректный ответ модели (не JSON): {e!s}"},
        )
    except Exception as e:
        log_openai_request(
            source="historia_sentences",
            input_params=input_params,
            prompt=prompt,
            openai_response=f"[Exception] {e!s}",
        )
        return JSONResponse(
            status_code=502,
            content={"detail": str(e)},
        )


@router.get("", summary="Список предложений по historia_id (модуль Банк историй)")
def list_historia_sentences(historia_id: int = Query(..., description="ID истории")):
    rows = get_historia_sentences(historia_id)
    return [
        {
            "sentence_id": r["historia_sentence_id"],
            "historia_id": r["historia_id"],
            "sentence_esp": r["sentence_esp"] or "",
            "sentence_rus": r["sentence_rus"] or "",
        }
        for r in rows
    ]


class AddHistoriaSentenceRequest(BaseModel):
    historia_id: int
    sentence_rus: str = ""
    sentence_esp: str = ""


@router.post("", status_code=201)
def add_historia_sentence_route(body: AddHistoriaSentenceRequest):
    add_historia_sentence(
        historia_id=body.historia_id,
        sentence_rus=body.sentence_rus or "",
        sentence_esp=body.sentence_esp or "",
    )
    return {"ok": True}


class UpdateHistoriaSentenceRequest(BaseModel):
    sentence_rus: str = ""
    sentence_esp: str = ""


@router.patch("/{historia_sentence_id}", status_code=200)
def update_historia_sentence_route(historia_sentence_id: int, body: UpdateHistoriaSentenceRequest):
    updated = update_historia_sentence(
        historia_sentence_id=historia_sentence_id,
        sentence_rus=body.sentence_rus or "",
        sentence_esp=body.sentence_esp or "",
    )
    if not updated:
        return JSONResponse(
            status_code=404,
            content={"detail": "Предложение не найдено."},
        )
    return {"ok": True}


@router.delete("/{historia_sentence_id}", status_code=200)
def delete_historia_sentence_route(historia_sentence_id: int):
    deleted = delete_historia_sentence(historia_sentence_id)
    if not deleted:
        return JSONResponse(
            status_code=404,
            content={"detail": "Предложение не найдено."},
        )
    return {"ok": True}
