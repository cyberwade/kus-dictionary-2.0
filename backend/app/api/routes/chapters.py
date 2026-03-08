from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db.repositories import get_chapters, create_chapter

router = APIRouter(prefix="/chapters", tags=["chapters"])


class AddChapterBody(BaseModel):
    chapter_name: str


@router.get("")
def list_chapters():
    rows = get_chapters()
    return [{"chapter_id": r["chapter_id"], "chapter_name": r["chapter_name"]} for r in rows]


@router.post("")
def add_chapter(body: AddChapterBody):
    name = (body.chapter_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Укажите название раздела")
    row = create_chapter(name)
    if not row:
        raise HTTPException(status_code=500, detail="Не удалось создать раздел")
    return {"chapter_id": row["chapter_id"], "chapter_name": row["chapter_name"]}
