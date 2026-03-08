import json
from pathlib import Path

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.db.repositories import add_sentence, delete_sentence, get_sentences, update_sentence
from app.openai_request_log import log_openai_request

router = APIRouter(prefix="/sentences", tags=["sentences"])


def _load_prompt_template() -> str:
    path = Path(__file__).resolve().parents[2] / "sentence_prompt.txt"
    return path.read_text(encoding="utf-8")


class GenerateSentenceRequest(BaseModel):
    keyphrase_id: int
    keyphrase_esp: str = ""
    keyphrase_rus: str = ""
    keyfrase_comment: str = ""
    additional_comment: str = ""


class GenerateSentenceResponse(BaseModel):
    sentence_esp: str
    sentence_rus: str


# Маршрут /generate регистрируем первым, чтобы POST /api/sentences/generate не путался с другими
@router.post("/generate", response_model=GenerateSentenceResponse)
def generate_sentence(body: GenerateSentenceRequest):
    if not settings.OPENAI_API_KEY:
        return JSONResponse(
            status_code=503,
            content={"detail": "OpenAI API не настроен (OPENAI_API_KEY отсутствует)."},
        )
    try:
        template = _load_prompt_template()
        prompt = template.format(
            keyphrase_id=body.keyphrase_id,
            keyphrase_rus=body.keyphrase_rus or "",
            keyphrase_esp=body.keyphrase_esp or "",
            keyfrase_comment=body.keyfrase_comment or "",
            additional_comment=body.additional_comment or "",
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
        # Убрать обёртку markdown code block если есть
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)
        # Лог запроса к OpenAI (успешный ответ)
        raw = {"content": text, "model": getattr(response, "model", None)}
        log_openai_request(
            source="sentences",
            input_params=input_params,
            prompt=prompt,
            openai_response=text,
            openai_raw=raw,
        )
        data = json.loads(text)
        sentence_esp = data.get("sentence_esp") or ""
        sentence_rus = data.get("sentence_rus") or ""
        return GenerateSentenceResponse(sentence_esp=sentence_esp, sentence_rus=sentence_rus)
    except json.JSONDecodeError as e:
        log_openai_request(
            source="sentences",
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
            source="sentences",
            input_params=input_params,
            prompt=prompt,
            openai_response=f"[Exception] {e!s}",
        )
        return JSONResponse(
            status_code=502,
            content={"detail": str(e)},
        )


@router.get("", summary="Список предложений по keyphrase_id (модуль Выражения)")
def list_sentences(keyphrase_id: int = Query(..., description="ID выражения")):
    rows = get_sentences(keyphrase_id)
    return [
        {
            "sentence_id": r["sentence_id"],
            "keyphrase_id": r["keyphrase_id"],
            "sentence_esp": r["sentence_esp"] or "",
            "sentence_rus": r["sentence_rus"] or "",
        }
        for r in rows
    ]


class AddSentenceRequest(BaseModel):
    keyphrase_id: int
    sentence_rus: str = ""
    sentence_esp: str = ""


@router.post("", status_code=201)
def add_sentence_route(body: AddSentenceRequest):
    add_sentence(
        keyphrase_id=body.keyphrase_id,
        sentence_rus=body.sentence_rus or "",
        sentence_esp=body.sentence_esp or "",
    )
    return {"ok": True}


class UpdateSentenceRequest(BaseModel):
    sentence_rus: str = ""
    sentence_esp: str = ""


@router.patch("/{sentence_id}", status_code=200)
def update_sentence_route(sentence_id: int, body: UpdateSentenceRequest):
    updated = update_sentence(
        sentence_id=sentence_id,
        sentence_rus=body.sentence_rus or "",
        sentence_esp=body.sentence_esp or "",
    )
    if not updated:
        return JSONResponse(
            status_code=404,
            content={"detail": "Предложение не найдено."},
        )
    return {"ok": True}


@router.delete("/{sentence_id}", status_code=200)
def delete_sentence_route(sentence_id: int):
    deleted = delete_sentence(sentence_id)
    if not deleted:
        return JSONResponse(
            status_code=404,
            content={"detail": "Предложение не найдено."},
        )
    return {"ok": True}
