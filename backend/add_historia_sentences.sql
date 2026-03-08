-- Таблица предложений для историй (аналог sentences, но привязка к historia_id).
-- Выполнить один раз: psql -f add_historia_sentences.sql или через клиент БД.

CREATE TABLE IF NOT EXISTS historia_sentences (
  historia_sentence_id SERIAL PRIMARY KEY,
  historia_id          INT NOT NULL REFERENCES historias(historia_id),
  sentence_esp         TEXT,
  sentence_rus         TEXT
);

CREATE INDEX IF NOT EXISTS idx_historia_sentences_historia ON historia_sentences(historia_id);
