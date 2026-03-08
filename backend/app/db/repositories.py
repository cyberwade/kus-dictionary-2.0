from typing import Optional

from app.db.connection import get_connection


def get_keyphrases_total(chapter_id: int, hidden_filter: Optional[str] = None) -> int:
    """hidden_filter: 'only' — только скрытые, 'exclude' — только видимые, None — все."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            if hidden_filter == "only":
                cur.execute(
                    "SELECT COUNT(*) AS c FROM keyphrases WHERE chapter_id = %s AND is_hidden = true",
                    (chapter_id,),
                )
            elif hidden_filter == "exclude":
                cur.execute(
                    "SELECT COUNT(*) AS c FROM keyphrases WHERE chapter_id = %s AND (is_hidden IS NULL OR is_hidden = false)",
                    (chapter_id,),
                )
            else:
                cur.execute(
                    "SELECT COUNT(*) AS c FROM keyphrases WHERE chapter_id = %s",
                    (chapter_id,),
                )
            row = cur.fetchone()
            return row["c"] if row else 0


def get_keyphrases(
    chapter_id: int,
    page: int = 1,
    per_page: Optional[int] = 20,
    hidden_filter: Optional[str] = None,
):
    """hidden_filter: 'only' | 'exclude' | None."""
    where = "WHERE chapter_id = %s"
    params_base = [chapter_id]
    if hidden_filter == "only":
        where += " AND is_hidden = true"
    elif hidden_filter == "exclude":
        where += " AND (is_hidden IS NULL OR is_hidden = false)"

    offset = (page - 1) * per_page if per_page else 0
    with get_connection() as conn:
        with conn.cursor() as cur:
            cols = "keyphrase_id, chapter_id, keyfrase_comment, keyphrase_esp, keyphrase_rus, is_hidden"
            if per_page:
                cur.execute(
                    f"""
                    SELECT {cols}
                    FROM keyphrases
                    {where}
                    ORDER BY keyphrase_id
                    LIMIT %s OFFSET %s
                    """,
                    (*params_base, per_page, offset),
                )
            else:
                cur.execute(
                    f"""
                    SELECT {cols}
                    FROM keyphrases
                    {where}
                    ORDER BY keyphrase_id
                    """,
                    params_base,
                )
            return cur.fetchall()


def update_keyphrase_hidden(keyphrase_id: int, is_hidden: bool) -> bool:
    """Установить is_hidden для ключевой фразы. Возвращает True, если обновлено."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE keyphrases SET is_hidden = %s WHERE keyphrase_id = %s",
                (is_hidden, keyphrase_id),
            )
            return cur.rowcount > 0


def update_keyphrase(
    keyphrase_id: int,
    *,
    keyphrase_esp: Optional[str] = None,
    keyphrase_rus: Optional[str] = None,
    keyfrase_comment: Optional[str] = None,
) -> bool:
    """Обновить поля карточки выражения. Передавать только нужные поля (не None)."""
    sets = []
    params = []
    if keyphrase_esp is not None:
        sets.append("keyphrase_esp = %s")
        params.append(keyphrase_esp)
    if keyphrase_rus is not None:
        sets.append("keyphrase_rus = %s")
        params.append(keyphrase_rus)
    if keyfrase_comment is not None:
        sets.append("keyfrase_comment = %s")
        params.append(keyfrase_comment)
    if not sets:
        return False
    params.append(keyphrase_id)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE keyphrases SET " + ", ".join(sets) + " WHERE keyphrase_id = %s",
                params,
            )
            return cur.rowcount > 0


def delete_keyphrase(keyphrase_id: int) -> bool:
    """Удалить карточку выражения и все её предложения."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM sentences WHERE keyphrase_id = %s", (keyphrase_id,))
            cur.execute("DELETE FROM keyphrases WHERE keyphrase_id = %s", (keyphrase_id,))
            return cur.rowcount > 0


def add_keyphrase(
    chapter_id: int,
    keyphrase_esp: str,
    keyphrase_rus: str,
    keyfrase_comment: Optional[str] = None,
) -> int:
    """Добавить карточку выражения (keyphrase) в раздел."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO keyphrases (chapter_id, keyphrase_esp, keyphrase_rus, keyfrase_comment)
                VALUES (%s, %s, %s, %s)
                RETURNING keyphrase_id
                """,
                (chapter_id, keyphrase_esp or "", keyphrase_rus or "", keyfrase_comment or ""),
            )
            row = cur.fetchone()
            return row["keyphrase_id"] if row else None


def get_chapters():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT chapter_id, chapter_name FROM chapters ORDER BY chapter_id"
            )
            return cur.fetchall()


def create_chapter(chapter_name: str):
    """Создать раздел. Возвращает dict с chapter_id и chapter_name."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chapters (chapter_name) VALUES (%s) RETURNING chapter_id, chapter_name",
                (chapter_name.strip(),),
            )
            row = cur.fetchone()
            return dict(row) if row else None


# --- Historias (Банк историй) ---

def get_historias_total(chapter_id: int, hidden_filter: Optional[str] = None) -> int:
    """hidden_filter: 'only' — только скрытые, 'exclude' — только видимые, None — все."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            if hidden_filter == "only":
                cur.execute(
                    "SELECT COUNT(*) AS c FROM historias WHERE chapter_id = %s AND is_hidden = true",
                    (chapter_id,),
                )
            elif hidden_filter == "exclude":
                cur.execute(
                    "SELECT COUNT(*) AS c FROM historias WHERE chapter_id = %s AND (is_hidden IS NULL OR is_hidden = false)",
                    (chapter_id,),
                )
            else:
                cur.execute(
                    "SELECT COUNT(*) AS c FROM historias WHERE chapter_id = %s",
                    (chapter_id,),
                )
            row = cur.fetchone()
            return row["c"] if row else 0


def get_historias(
    chapter_id: int,
    page: int = 1,
    per_page: Optional[int] = 20,
    hidden_filter: Optional[str] = None,
):
    """hidden_filter: 'only' | 'exclude' | None."""
    where = "WHERE chapter_id = %s"
    params_base = [chapter_id]
    if hidden_filter == "only":
        where += " AND is_hidden = true"
    elif hidden_filter == "exclude":
        where += " AND (is_hidden IS NULL OR is_hidden = false)"

    offset = (page - 1) * per_page if per_page else 0
    with get_connection() as conn:
        with conn.cursor() as cur:
            cols = "historia_id, chapter_id, historia_comment, historia_esp, historia_rus, is_hidden"
            if per_page:
                cur.execute(
                    f"""
                    SELECT {cols}
                    FROM historias
                    {where}
                    ORDER BY historia_id
                    LIMIT %s OFFSET %s
                    """,
                    (*params_base, per_page, offset),
                )
            else:
                cur.execute(
                    f"""
                    SELECT {cols}
                    FROM historias
                    {where}
                    ORDER BY historia_id
                    """,
                    params_base,
                )
            return cur.fetchall()


def update_historia_hidden(historia_id: int, is_hidden: bool) -> bool:
    """Установить is_hidden для истории. Возвращает True, если обновлено."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE historias SET is_hidden = %s WHERE historia_id = %s",
                (is_hidden, historia_id),
            )
            return cur.rowcount > 0


def update_historia(
    historia_id: int,
    *,
    historia_esp: Optional[str] = None,
    historia_rus: Optional[str] = None,
    historia_comment: Optional[str] = None,
) -> bool:
    """Обновить поля карточки истории."""
    sets = []
    params = []
    if historia_esp is not None:
        sets.append("historia_esp = %s")
        params.append(historia_esp)
    if historia_rus is not None:
        sets.append("historia_rus = %s")
        params.append(historia_rus)
    if historia_comment is not None:
        sets.append("historia_comment = %s")
        params.append(historia_comment)
    if not sets:
        return False
    params.append(historia_id)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE historias SET " + ", ".join(sets) + " WHERE historia_id = %s",
                params,
            )
            return cur.rowcount > 0


def delete_historia(historia_id: int) -> bool:
    """Удалить карточку истории и все её предложения."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM historia_sentences WHERE historia_id = %s",
                (historia_id,),
            )
            cur.execute("DELETE FROM historias WHERE historia_id = %s", (historia_id,))
            return cur.rowcount > 0


def add_historia(
    chapter_id: int,
    historia_esp: str,
    historia_rus: str,
    historia_comment: Optional[str] = None,
) -> int:
    """Добавить карточку истории в раздел."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO historias (chapter_id, historia_esp, historia_rus, historia_comment)
                VALUES (%s, %s, %s, %s)
                RETURNING historia_id
                """,
                (chapter_id, historia_esp or "", historia_rus or "", historia_comment or ""),
            )
            row = cur.fetchone()
            return row["historia_id"] if row else None


# --- Sentences (только keyphrase_id, модуль Выражения) ---

def get_sentences(keyphrase_id: int):
    """Получить предложения по keyphrase_id (таблица sentences)."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT sentence_id, keyphrase_id, sentence_esp, sentence_rus
                FROM sentences
                WHERE keyphrase_id = %s
                ORDER BY sentence_id
                """,
                (keyphrase_id,),
            )
            return cur.fetchall()


def add_sentence(keyphrase_id: int, sentence_rus: str, sentence_esp: str) -> int:
    """Добавить предложение в sentences (привязка к keyphrase_id)."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sentences (keyphrase_id, sentence_rus, sentence_esp)
                VALUES (%s, %s, %s)
                RETURNING sentence_id
                """,
                (keyphrase_id, sentence_rus or "", sentence_esp or ""),
            )
            row = cur.fetchone()
            return row["sentence_id"] if row else None


# --- Historia sentences (модуль Банк историй) ---

def get_historia_sentences(historia_id: int):
    """Получить предложения по historia_id (таблица historia_sentences)."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT historia_sentence_id, historia_id, sentence_esp, sentence_rus
                FROM historia_sentences
                WHERE historia_id = %s
                ORDER BY historia_sentence_id
                """,
                (historia_id,),
            )
            return cur.fetchall()


def add_historia_sentence(historia_id: int, sentence_rus: str, sentence_esp: str) -> int:
    """Добавить предложение в historia_sentences."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO historia_sentences (historia_id, sentence_rus, sentence_esp)
                VALUES (%s, %s, %s)
                RETURNING historia_sentence_id
                """,
                (historia_id, sentence_rus or "", sentence_esp or ""),
            )
            row = cur.fetchone()
            return row["historia_sentence_id"] if row else None


def update_historia_sentence(
    historia_sentence_id: int, sentence_rus: str, sentence_esp: str
) -> bool:
    """Обновить предложение в historia_sentences."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE historia_sentences
                SET sentence_rus = %s, sentence_esp = %s
                WHERE historia_sentence_id = %s
                """,
                (sentence_rus or "", sentence_esp or "", historia_sentence_id),
            )
            return cur.rowcount > 0


def delete_historia_sentence(historia_sentence_id: int) -> bool:
    """Удалить предложение из historia_sentences."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM historia_sentences WHERE historia_sentence_id = %s",
                (historia_sentence_id,),
            )
            return cur.rowcount > 0


def update_sentence(sentence_id: int, sentence_rus: str, sentence_esp: str) -> bool:
    """Обновляет предложение по sentence_id. Возвращает True, если обновлено."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE sentences
                SET sentence_rus = %s, sentence_esp = %s
                WHERE sentence_id = %s
                """,
                (sentence_rus or "", sentence_esp or "", sentence_id),
            )
            return cur.rowcount > 0


def delete_sentence(sentence_id: int) -> bool:
    """Удаляет предложение по sentence_id. Возвращает True, если удалено."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM sentences WHERE sentence_id = %s",
                (sentence_id,),
            )
            return cur.rowcount > 0
