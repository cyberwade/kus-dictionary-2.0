from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.db.repositories import (
    add_historia,
    delete_historia,
    get_historias,
    get_historias_total,
    update_historia,
    update_historia_hidden,
)


class HistoriaHiddenBody(BaseModel):
    is_hidden: bool


class HistoriaPatchBody(BaseModel):
    is_hidden: bool | None = None
    historia_esp: str | None = None
    historia_rus: str | None = None
    historia_comment: str | None = None


class AddHistoriaBody(BaseModel):
    chapter_id: int
    historia_esp: str = ""
    historia_rus: str = ""
    historia_comment: str | None = None


router = APIRouter(prefix="/historias", tags=["historias"])


@router.get("")
def list_historias(
    chapter_id: int = Query(..., description="ID раздела"),
    page: int = Query(1, ge=1),
    per_page: Optional[int] = Query(20, ge=0, le=10000),
    show_hidden: Optional[str] = Query(
        None, description="only — только скрытые, exclude — без скрытых"
    ),
):
    hidden_filter = show_hidden if show_hidden in ("only", "exclude") else None
    total = get_historias_total(chapter_id, hidden_filter=hidden_filter)
    total_hidden = get_historias_total(chapter_id, hidden_filter="only")
    limit = None if per_page == 0 else per_page
    if limit is None:
        page = 1
        total_pages = 1
        items = get_historias(chapter_id, page=1, per_page=None, hidden_filter=hidden_filter)
    else:
        total_pages = max(1, (total + limit - 1) // limit)
        items = get_historias(chapter_id, page=page, per_page=limit, hidden_filter=hidden_filter)

    base = (page - 1) * (limit or total) if limit else 0
    return {
        "items": [
            {
                "historia_id": r["historia_id"],
                "chapter_id": r["chapter_id"],
                "historia_comment": r["historia_comment"] or "",
                "historia_esp": r["historia_esp"] or "",
                "historia_rus": r["historia_rus"] or "",
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
def create_historia(body: AddHistoriaBody):
    """Добавить карточку истории в раздел."""
    historia_id = add_historia(
        body.chapter_id,
        body.historia_esp,
        body.historia_rus,
        body.historia_comment,
    )
    return {"historia_id": historia_id}


@router.patch("/{historia_id}")
def patch_historia(historia_id: int, body: HistoriaPatchBody):
    """Обновить историю: is_hidden и/или поля карточки."""
    if body.is_hidden is not None:
        ok = update_historia_hidden(historia_id, body.is_hidden)
        if not ok:
            raise HTTPException(404, detail="historia not found")
    if body.historia_esp is not None or body.historia_rus is not None or body.historia_comment is not None:
        ok = update_historia(
            historia_id,
            historia_esp=body.historia_esp,
            historia_rus=body.historia_rus,
            historia_comment=body.historia_comment,
        )
        if not ok:
            raise HTTPException(404, detail="historia not found")
    return {"historia_id": historia_id}


@router.delete("/{historia_id}")
def delete_historia_route(historia_id: int):
    """Удалить карточку истории и все её предложения."""
    ok = delete_historia(historia_id)
    if not ok:
        raise HTTPException(404, detail="historia not found")
    return {"historia_id": historia_id}
