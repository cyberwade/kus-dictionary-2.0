import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

from app.config import settings


@contextmanager
def get_connection():
    conn = psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        cursor_factory=RealDictCursor,
    )
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Optional: verify connection at startup."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
    return True
