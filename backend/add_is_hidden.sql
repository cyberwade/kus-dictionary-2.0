-- Добавить колонку is_hidden в keyphrases (скрытие карточки).
-- Выполнить один раз: psql -f add_is_hidden.sql или через клиент БД.
ALTER TABLE keyphrases
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;
