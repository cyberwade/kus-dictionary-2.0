-- Таблица historias (Банк историй): те же разделы (chapters), атрибуты historia_*.
-- Выполнить один раз: psql -f add_historias.sql или через клиент БД.

CREATE TABLE IF NOT EXISTS historias (
  historia_id   SERIAL PRIMARY KEY,
  chapter_id    INT NOT NULL REFERENCES chapters(chapter_id),
  historia_comment TEXT,
  historia_esp  TEXT,
  historia_rus  TEXT,
  is_hidden     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_historias_chapter ON historias(chapter_id);

-- Связь предложений с историями (пока те же sentences).
ALTER TABLE sentences
  ADD COLUMN IF NOT EXISTS historia_id INT REFERENCES historias(historia_id);

CREATE INDEX IF NOT EXISTS idx_sentences_historia ON sentences(historia_id);
