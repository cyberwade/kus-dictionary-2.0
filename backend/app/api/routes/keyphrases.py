from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.db.repositories import (
    add_keyphrase,
    delete_keyphrase,
    get_keyphrases,
    get_keyphrases_total,
    update_keyphrase,
    update_keyphrase_hidden,
)


class KeyphraseHiddenBody(BaseModel):
    is_hidden: bool


class KeyphrasePatchBody(BaseModel):
    """Все поля опциональны. Передаются только те, что нужно обновить."""
    is_hidden: bool | None = None
    keyphrase_esp: str | None = None
    keyphrase_rus: str | None = None
    keyfrase_comment: str | None = None


class AddKeyphraseBody(BaseModel):
    chapter_id: int
    keyphrase_esp: str = ""
    keyphrase_rus: str = ""
    keyfrase_comment: str | None = None


router = APIRouter(prefix="/keyphrases", tags=["keyphrases"])


@router.get("")
def list_keyphrases(
    chapter_id: int = Query(..., description="ID раздела"),
    page: int = Query(1, ge=1),
    per_page: Optional[int] = Query(20, ge=0, le=10000),
    show_hidden: Optional[str] = Query(None, description="only — только скрытые, exclude — без скрытых"),
):
    hidden_filter = show_hidden if show_hidden in ("only", "exclude") else None
    total = get_keyphrases_total(chapter_id, hidden_filter=hidden_filter)
    total_hidden = get_keyphrases_total(chapter_id, hidden_filter="only")
    # per_page: 20, 50 or 0/None for "all"
    limit = None if per_page == 0 else per_page
    if limit is None:
        page = 1
        total_pages = 1
        items = get_keyphrases(chapter_id, page=1, per_page=None, hidden_filter=hidden_filter)
    else:
        total_pages = max(1, (total + limit - 1) // limit)
        items = get_keyphrases(chapter_id, page=page, per_page=limit, hidden_filter=hidden_filter)

    # Сквозной порядковый номер выражения в базовой сортировке раздела
    base = (page - 1) * (limit or total) if limit else 0
    return {
        "items": [
            {
                "keyphrase_id": r["keyphrase_id"],
                "chapter_id": r["chapter_id"],
                "keyfrase_comment": r["keyfrase_comment"] or "",
                "keyphrase_esp": r["keyphrase_esp"] or "",
                "keyphrase_rus": r["keyphrase_rus"] or "",
                "order_in_chapter": base + i + 1,
                "is_hidden": bool(r.get("is_hidden")),
            }
            for i, r in enumerate(items)
        ],
        "total": total,
        "total_hidden": total_hidden,
        "page": page,
        "per_page": limit,
        "total_pages": total_pages,
    }


@router.post("")
def create_keyphrase(body: AddKeyphraseBody):
    """Добавить карточку выражения в раздел."""
    keyphrase_id = add_keyphrase(
        body.chapter_id,
        body.keyphrase_esp,
        body.keyphrase_rus,
        body.keyfrase_comment,
    )
    return {"keyphrase_id": keyphrase_id}


@router.patch("/{keyphrase_id}")
def patch_keyphrase(keyphrase_id: int, body: KeyphrasePatchBody):
    """Обновить ключевую фразу: is_hidden и/или ключевые поля."""
    if body.is_hidden is not None:
        ok = update_keyphrase_hidden(keyphrase_id, body.is_hidden)
        if not ok:
            raise HTTPException(404, detail="keyphrase not found")
    if body.keyphrase_esp is not None or body.keyphrase_rus is not None or body.keyfrase_comment is not None:
        ok = update_keyphrase(
            keyphrase_id,
            keyphrase_esp=body.keyphrase_esp,
            keyphrase_rus=body.keyphrase_rus,
            keyfrase_comment=body.keyfrase_comment,
        )
        if not ok:
            raise HTTPException(404, detail="keyphrase not found")
    return {"keyphrase_id": keyphrase_id}


@router.delete("/{keyphrase_id}")
def delete_keyphrase_route(keyphrase_id: int):
    """Удалить карточку выражения и все её предложения."""
    ok = delete_keyphrase(keyphrase_id)
    if not ok:
        raise HTTPException(404, detail="keyphrase not found")
    return {"keyphrase_id": keyphrase_id}
