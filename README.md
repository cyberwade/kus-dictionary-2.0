# Kus Dictionary 2.0

Веб-приложение для тренировки испанских выражений и историй: при входе выбирается модуль **«Выражения»** или **«Банк историй»**. Разделы (chapters) общие. В модуле «Выражения» — ключевые фразы (keyphrases) и предложения из таблицы **sentences**; в модуле «Банк историй» — истории (historias) и предложения из таблицы **historia_sentences**. Генерация примеров через OpenAI (опционально).

---

## Структура проекта

```
kus_dict2/
├── backend/                 # API на Python (FastAPI)
│   ├── app/
│   │   ├── main.py          # Точка входа, CORS, подключение роутов
│   │   ├── config.py        # Настройки из .env (БД, OpenAI)
│   │   ├── openai_request_log.py # Логирование запросов к OpenAI в backend/openai_requests.log
│   │   ├── sentence_prompt.txt   # Шаблон промпта для генерации предложений
│   │   ├── api/
│   │   │   └── routes/      # chapters, keyphrases, sentences, historias, historia_sentences
│   │   └── db/
│   │       ├── connection.py    # Контекстный менеджер подключения к PostgreSQL
│   │       └── repositories.py  # Запросы к БД (без ORM)
│   ├── add_historias.sql    # Миграция: таблица historias
│   ├── add_historia_sentences.sql  # Миграция: таблица historia_sentences
│   ├── openai_requests.log  # Лог запросов к OpenAI (создаётся при первом вызове генерации)
│   └── requirements.txt
├── frontend/                 # SPA на React (Vite)
│   ├── src/
│   │   ├── App.jsx          # Выбор модуля → ExpressionsModule или HistoriasModule
│   │   ├── api/index.js     # Вызовы к бэкенду (fetch)
│   │   ├── components/     # Card, Modal, AddSentenceModal, EditSentenceModal, AddCardModal, EditCardModal, AddChapterModal
│   │   ├── modules/        # ModuleChooser, expressions/, historias/
│   │   └── *.css
│   ├── index.html
│   └── vite.config.js       # Прокси /api → 127.0.0.1:8000
├── docs/                     # Документация и шаблоны
│   ├── ТЗ-шаблон.md
│   ├── Бизнес-требования-шаблон.md
│   ├── План-дорожная-карта-шаблон.md
│   └── Кто-заполняет-БТ-и-ТЗ.md
├── .env                     # Секреты и настройки (не коммитить)
└── README.md
```

---

## Запуск

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173. На главном экране выберите модуль **«Выражения»** или **«Банк историй»**. Запросы к `/api` проксируются на http://127.0.0.1:8000 (настраивается в `vite.config.js`).

### Модуль «Банк историй» (таблицы historias и historia_sentences)

Перед использованием модуля «Банк историй» выполните миграции (один раз):

```bash
cd backend
psql -f add_historias.sql
psql -f add_historia_sentences.sql
# или выполните SQL из этих файлов в клиенте БД
```

- **add_historias.sql** — таблица `historias` (chapter_id, historia_comment, historia_esp, historia_rus, is_hidden).
- **add_historia_sentences.sql** — таблица `historia_sentences` (historia_id, sentence_esp, sentence_rus); предложения для карточек-историй берутся из неё.

---

## Деплой в Google Cloud Run

Приложение деплоится как единый контейнер: фронтенд собирается в статику, FastAPI отдаёт и API, и статические файлы. Конфигурация — в `Dockerfile` (multi-stage build).

### Предварительные шаги

1. Создайте секреты в Google Secret Manager: `OPENAI_API_KEY`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
2. Выдайте сервис-аккаунту Cloud Run роль **Secret Manager Secret Accessor**:

```bash
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Деплой

```bash
gcloud run deploy <SERVICE_NAME> \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-secrets "OPENAI_API_KEY=OPENAI_API_KEY:latest,DB_HOST=DB_HOST:latest,DB_NAME=DB_NAME:latest,DB_USER=DB_USER:latest,DB_PASSWORD=DB_PASSWORD:latest"
```

Cloud Run собирает образ из `Dockerfile`, пушит в Artifact Registry и деплоит. Порт 8080 (стандартный для Cloud Run, задан в Dockerfile). Секреты из Secret Manager прокидываются как переменные окружения.

### Локальная проверка Docker-образа

```bash
docker build -t kus-dict .
docker run --rm -p 8080:8080 --env-file .env kus-dict
```

Приложение будет доступно на http://localhost:8080.

---

## Backend: что откуда вызывается

| Файл | Назначение |
|------|------------|
| `main.py` | Регистрирует роутеры: chapters, keyphrases, sentences, historias, historia_sentences; CORS для localhost:5173; `GET /api/health`. |
| `config.py` | Читает `.env` из корня проекта. Класс `Settings`: `DB_*`, `OPENAI_API_KEY`, `OPENAI_MODEL` (по умолчанию `gpt-4o-mini`). |
| `db/connection.py` | `get_connection()` — контекстный менеджер (commit/rollback/close). Курсор — `RealDictCursor`. |
| `db/repositories.py` | Функции для chapters, keyphrases, sentences (модуль Выражения); historias и historia_sentences (модуль Банк историй). Все через `get_connection()`. |
| `api/routes/chapters.py` | `GET /api/chapters` → список разделов; `POST /api/chapters` → создание раздела (body: `chapter_name`). |
| `api/routes/keyphrases.py` | `GET /api/keyphrases`, `POST`, `PATCH /api/keyphrases/{id}`, `DELETE` — выражения раздела (список, добавление, обновление, удаление карточки). |
| `api/routes/sentences.py` | Предложения по keyphrase_id: GET, POST /generate, POST, PATCH, DELETE. Генерация через OpenAI с записью в openai_requests.log. |
| `api/routes/historias.py` | `GET /api/historias`, `POST`, `PATCH /api/historias/{id}`, `DELETE` — истории раздела (список, добавление, обновление, удаление карточки). |
| `api/routes/historia_sentences.py` | Предложения по historia_id: GET, POST /generate (генерация через OpenAI, лог в openai_requests.log), POST, PATCH, DELETE (таблица historia_sentences). |
| `openai_request_log.py` | Функция `log_openai_request()`: запись в backend/openai_requests.log времени запроса, источника (sentences / historia_sentences), входных параметров, промпта и ответа OpenAI. |

---

## API (бэкенд)

Базовый URL: `http://127.0.0.1:8000` (или через прокси фронта — `/api`).

### Разделы

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/chapters` | Список разделов. Ответ: `[{ "chapter_id": int, "chapter_name": string }, ...]`. |
| POST | `/api/chapters` | Создать раздел. Body: `{ "chapter_name": string }`. Ответ: `{ "chapter_id": int, "chapter_name": string }`. 400 — пустое название. |

### Ключевые фразы (модуль Выражения)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/keyphrases?chapter_id=<int>&page=1&per_page=20&show_hidden=only\|exclude` | Выражения раздела. `per_page=0` — все. Ответ: `items`, `total`, `total_hidden` (число скрытых карточек раздела), `page`, `per_page`, `total_pages`. Элемент: `keyphrase_id`, `keyfrase_comment`, `keyphrase_esp`, `keyphrase_rus`, `order_in_chapter`, `is_hidden`. |
| POST | `/api/keyphrases` | Добавить карточку выражения. Body: `{ "chapter_id", "keyphrase_esp", "keyphrase_rus", "keyfrase_comment" }` (comment опционально). |
| PATCH | `/api/keyphrases/{keyphrase_id}` | Обновить карточку: скрытость и/или поля. Body: `{ "is_hidden" }` и/или `{ "keyphrase_esp", "keyphrase_rus", "keyfrase_comment" }` (все поля опциональны). |
| DELETE | `/api/keyphrases/{keyphrase_id}` | Удалить карточку выражения и все её предложения. |

### Предложения (модуль Выражения, таблица sentences)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/sentences?keyphrase_id=<int>` | Список предложений по выражению. |
| POST | `/api/sentences/generate` | Генерация примера через OpenAI. Body: `{ "keyphrase_id", "keyphrase_esp", "keyphrase_rus", "keyfrase_comment", "additional_comment" }`. 503 — нет `OPENAI_API_KEY`. Запрос фиксируется в openai_requests.log. |
| POST | `/api/sentences` | Добавить предложение. Body: `{ "keyphrase_id", "sentence_rus", "sentence_esp" }`. |
| PATCH | `/api/sentences/{sentence_id}` | Обновить предложение. Body: `{ "sentence_rus", "sentence_esp" }`. |
| DELETE | `/api/sentences/{sentence_id}` | Удалить предложение. |

### Истории (модуль Банк историй)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/historias?chapter_id=<int>&page=1&per_page=20&show_hidden=only\|exclude` | Список историй раздела. Ответ: `items`, `total`, `total_hidden` (число скрытых карточек раздела), `page`, `per_page`, `total_pages`. Элемент: `historia_id`, `historia_comment`, `historia_esp`, `historia_rus`, `order_in_chapter`, `is_hidden`. |
| POST | `/api/historias` | Добавить карточку истории. Body: `{ "chapter_id", "historia_esp", "historia_rus", "historia_comment" }` (comment опционально). |
| PATCH | `/api/historias/{historia_id}` | Обновить карточку: скрытость и/или поля. Body: `{ "is_hidden" }` и/или `{ "historia_esp", "historia_rus", "historia_comment" }` (все поля опциональны). |
| DELETE | `/api/historias/{historia_id}` | Удалить карточку истории и все её предложения. |

### Предложения историй (модуль Банк историй, таблица historia_sentences)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/historia-sentences?historia_id=<int>` | Список предложений по истории. |
| POST | `/api/historia-sentences/generate` | Генерация примера через OpenAI по контексту истории. Body: `{ "historia_id", "historia_esp", "historia_rus", "comment" }`. Ответ: `{ "sentence_esp", "sentence_rus" }`. 503 — нет OPENAI_API_KEY. Запрос фиксируется в openai_requests.log. |
| POST | `/api/historia-sentences` | Добавить предложение. Body: `{ "historia_id", "sentence_rus", "sentence_esp" }`. |
| PATCH | `/api/historia-sentences/{historia_sentence_id}` | Обновить предложение. Body: `{ "sentence_rus", "sentence_esp" }`. |
| DELETE | `/api/historia-sentences/{historia_sentence_id}` | Удалить предложение. |

### Служебный

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/health` | Проверка работы API. Ответ: `{ "status": "ok" }`. |

При ошибках бэкенд возвращает JSON с полем `detail` (строка).

---

## Логирование запросов к OpenAI

При каждом вызове генерации предложений (POST `/api/sentences/generate` и POST `/api/historia-sentences/generate`) бэкенд записывает в текстовый файл **`backend/openai_requests.log`**:

- время запроса (UTC);
- источник: `sentences` или `historia_sentences`;
- входные параметры метода (JSON);
- текст промпта, отправленного в OpenAI;
- ответ OpenAI (content и при необходимости сырой объект).

Файл создаётся при первом запросе; записи разделяются линией из символов `=`. Ошибки записи лога не прерывают основной запрос. Модуль логирования: `app/openai_request_log.py`.

---

## Сокрытие карточек

Пользователь может **скрывать** ключевые фразы (карточки), чтобы временно убрать их из тренировки. Данные хранятся в БД (поле `keyphrases.is_hidden`).

- **Переключатель на карточке:** при включении «Скрыть» карточка сохраняет состояние на сервере (PATCH `/api/keyphrases/:id`) и **сразу исчезает из текущего списка** — без перезагрузки страницы, без перезагрузки списка, без сброса перемешивания и без перерасчёта порядковых номеров остальных карточек.
- **Фильтр «Только скрытые»:** переключатель в шапке («Скрытые карточки»); рядом с подписью отображается количество скрытых карточек раздела, например «Только скрытые (34)». Это число **обновляется сразу** при сокрытии или отмене сокрытия карточки (без перезагрузки списка); при смене раздела, страницы, «карточек на странице» или переключении фильтра «Только скрытые» значение синхронизируется с сервером (поле `total_hidden` в ответе GET). По умолчанию показываются только нескрытые; при включении «Только скрытые» загружается список только скрытых карточек. При **переключении этого фильтра** выполняется полная перезагрузка списка с сервера, сбрасываются перемешивание и локальный список «скрытых в текущем виде».
- Итог: скрытие/показ одной карточки — только локальное исчезновение из списка и мгновенное обновление счётчика скрытых; перезагрузки и перерасчёты — только при смене раздела, страницы, «карточек на странице» или переключателя «Только скрытые».

---

## Разделы (chapters)

В обоих модулях при выборе «Выберите раздел» справа от выпадающего списка отображается кнопка «Добавить раздел» (та же по виду, что и кнопка добавления карточки). По нажатию открывается модальное окно с полем «Название раздела»; после сохранения новый раздел создаётся в таблице `chapters`, список разделов обновляется и новый раздел автоматически выбирается. Backend: `POST /api/chapters` с телом `{ "chapter_name": "..." }`; в БД поле `chapter_id` — автоинкрементное.

---

## Добавление, редактирование и удаление карточек

В обоих модулях («Выражения» и «Банк историй») пользователь может:

- **Добавить карточку:** кнопка с иконкой «+» справа в ряду пагинации; открывается модалка с полями esp, rus, comment (опционально). После успешного добавления внизу модалки отображается «Карточка добавлена.» (при ошибке — текст ошибки).
- **Редактировать карточку:** иконка карандаша справа от переключателя «Скрыть» на каждой карточке; модалка с теми же полями, валидация как у редактирования предложений (esp и rus обязательны).
- **Удалить карточку:** иконка корзины на карточке; в модалке подтверждения под заголовком выводится предупреждение «Вместе с карточкой будут удалены все предложения.»; после удаления список перезагружается.

Backend: POST/PATCH/DELETE для `/api/keyphrases` и `/api/historias`; при удалении карточки удаляются и все связанные предложения (sentences или historia_sentences).

---

## Frontend: методы и компоненты

### Модуль `src/api/index.js`

Базовый URL: `import.meta.env.VITE_API_BASE` или `/api`. Все функции при ошибке HTTP выбрасывают `Error` с текстом из `detail` или запасным сообщением.

| Функция | Вызов бэкенда |
|---------|----------------|
| `getChapters()` | GET `/chapters` |
| `createChapter(chapterName)` | POST `/chapters` (создание раздела) |
| `getKeyphrases(chapterId, page, perPage, showHidden)` | GET `/keyphrases` (модуль Выражения) |
| `addKeyphrase(chapterId, keyphraseEsp, keyphraseRus, keyphraseComment)` | POST `/keyphrases` |
| `updateKeyphrase(id, esp, rus, comment)` | PATCH `/keyphrases/:id` (поля карточки) |
| `deleteKeyphrase(keyphraseId)` | DELETE `/keyphrases/:id` |
| `updateKeyphraseHidden(keyphraseId, isHidden)` | PATCH `/keyphrases/:id` (is_hidden) |
| `getSentences(keyphraseId)` | GET `/sentences?keyphrase_id=` (модуль Выражения) |
| `generateSentence({ … })` | POST `/sentences/generate` |
| `addSentence(keyphraseId, sentenceRus, sentenceEsp)` | POST `/sentences` |
| `updateSentence(sentenceId, …)` | PATCH `/sentences/:id` |
| `deleteSentence(sentenceId)` | DELETE `/sentences/:id` |
| `getHistorias(chapterId, page, perPage, showHidden)` | GET `/historias` (модуль Банк историй) |
| `addHistoria(chapterId, historiaEsp, historiaRus, historiaComment)` | POST `/historias` |
| `updateHistoria(id, esp, rus, comment)` | PATCH `/historias/:id` (поля карточки) |
| `deleteHistoria(historiaId)` | DELETE `/historias/:id` |
| `updateHistoriaHidden(historiaId, isHidden)` | PATCH `/historias/:id` (is_hidden) |
| `getHistoriaSentences(historiaId)` | GET `/historia-sentences?historia_id=` |
| `addHistoriaSentence(historiaId, sentenceRus, sentenceEsp)` | POST `/historia-sentences` |
| `updateHistoriaSentence(id, …)` | PATCH `/historia-sentences/:id` |
| `deleteHistoriaSentence(id)` | DELETE `/historia-sentences/:id` |

### Компоненты

| Компонент | Роль |
|-----------|------|
| `App.jsx` | Экран выбора модуля («Выражения» / «Банк историй»); после выбора рендерит `ExpressionsModule` или `HistoriasModule`; кнопка «Сменить модуль» возвращает к выбору. |
| `modules/ModuleChooser.jsx` | Два варианта входа: «Выражения» и «Банк историй». |
| `modules/expressions/ExpressionsModule.jsx` | Модуль «Выражения»: разделы, keyphrases, пагинация, фильтры, карточки (Card с keyphrase). Логика как раньше в App. |
| `modules/historias/HistoriasModule.jsx` | Модуль «Банк историй»: те же разделы, historias из API, те же фильтры и пагинация, карточки (Card с historia); предложения из historia_sentences. |
| `Card.jsx` | Универсальная карточка: принимает `keyphrase` (Выражения) или `historia` (Банк историй). Номер, комментарий, текст (рус/исп), переключатель «Скрыть» (высота 16px), иконки «Редактировать карточку» и «Удалить карточку», блок предложений с добавлением/редактированием/удалением. Для выражений — API sentences; для историй — API historia-sentences. Иконки и переключатель выровнены по одной линии (24px) с иконками у предложений. |
| `Modal.jsx` | Универсальная модалка. |
| `AddSentenceModal.jsx` | «Добавить предложение»: поддерживает и keyphrase, и historia (поля comment/esp/rus подставляются из карточки); для выражений — `addSentence`, для историй — `addHistoriaSentence`; генерация через `generateSentence` (те же поля). Рядом с полем additional_comment — иконки в кружке: вставка «Это должен быть вопрос.» (?), «Используй Imperativo Affirmativo.» (+), «Используй Imperativo Negativo.» (−), справа — очистка поля (✕ в кружке). |
| `EditSentenceModal.jsx` | Редактирование предложения; при `isHistoria` вызывает `updateHistoriaSentence`, иначе `updateSentence`. |
| `AddCardModal.jsx` | «Добавить карточку»: поля keyphrase_esp/keyphrase_rus/keyphrase_comment (Выражения) или historia_esp/historia_rus/historia_comment (Банк историй); comment опционально. Внизу отображается результат: «Карточка добавлена» или сообщение об ошибке. |
| `AddChapterModal.jsx` | «Добавить раздел»: поле «Название раздела»; вызов `createChapter`, после успеха — обновление списка разделов и выбор нового раздела. |
| `EditCardModal.jsx` | «Редактировать карточку»: те же поля, валидация как у редактирования предложений (обязательны esp и rus). |

В ряду пагинации (справа от номеров страниц) в обоих модулях — квадратная кнопка с иконкой «+» и тултипом «Добавить карточку»; по нажатию открывается AddCardModal. При удалении карточки в модалке отображается предупреждение: «Вместе с карточкой будут удалены все предложения.»

Стили: `App.css`, `index.css`, `modules/ModuleChooser.css`, `Modal.css`, `Card.css`, `AddSentenceModal.css`.

---

## Переменные окружения

Файл `.env` в **корне проекта** (рядом с `backend/` и `frontend/`). Backend подхватывает его через `config.py` (путь `parents[2] / ".env"`).

### Backend

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DB_HOST` | Хост PostgreSQL | `localhost` |
| `DB_PORT` | Порт | `5432` |
| `DB_NAME` | Имя БД | — |
| `DB_USER` | Пользователь | — |
| `DB_PASSWORD` | Пароль | — |
| `OPENAI_API_KEY` | Ключ OpenAI (для генерации предложений) | пусто (генерация отключена) |
| `OPENAI_MODEL` | Модель OpenAI | `gpt-4o-mini` |

### Frontend (опционально)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `VITE_API_BASE` | Базовый URL API | `/api` (прокси Vite) |

---

## Требования к БД

PostgreSQL. Схема таблиц:

| Таблица | Поля | Примечание |
|---------|------|------------|
| **chapters** | `chapter_id` (PK, автоинкремент), `chapter_name` | Общие разделы для обоих модулей; создание раздела через UI (POST /api/chapters). |
| **keyphrases** | `keyphrase_id` (PK), `chapter_id` (FK), `keyfrase_comment`, `keyphrase_esp`, `keyphrase_rus`, `is_hidden` | Модуль «Выражения». Миграция: `add_is_hidden.sql`. |
| **sentences** | `sentence_id` (PK), `keyphrase_id` (FK → keyphrases), `sentence_esp`, `sentence_rus` | Предложения к выражениям. |
| **historias** | `historia_id` (PK), `chapter_id` (FK → chapters), `historia_comment`, `historia_esp`, `historia_rus`, `is_hidden` | Модуль «Банк историй». Миграция: `add_historias.sql`. |
| **historia_sentences** | `historia_sentence_id` (PK), `historia_id` (FK → historias), `sentence_esp`, `sentence_rus` | Предложения к историям. Миграция: `add_historia_sentences.sql`. |

Типы: ID — целые (SERIAL), текстовые — `TEXT`. Индексы: по `keyphrases.chapter_id`, `sentences.keyphrase_id`, `historias.chapter_id`, `historia_sentences.historia_id`. Полный список запросов — в `backend/app/db/repositories.py`.

---

## Документация

В папке **`docs/`** лежат образцовые документы по этому проекту; их можно использовать как шаблоны для следующих.

| Файл | Содержание |
|------|------------|
| [docs/ТЗ-шаблон.md](docs/ТЗ-шаблон.md) | **Техническое задание** — общие сведения, цели и границы, роли, функциональные и нефункциональные требования, стек, модель данных, контракт API, архитектура, критерии приёмки. |
| [docs/Бизнес-требования-шаблон.md](docs/Бизнес-требования-шаблон.md) | **Документ бизнес-требований** — бизнес-контекст, заинтересованные стороны, цели продукта, пользователи и сценарии, область проекта (scope), критерии успеха, ограничения и допущения, риски, глоссарий. Связь с ТЗ и README. |
| [docs/План-дорожная-карта-шаблон.md](docs/План-дорожная-карта-шаблон.md) | **План проекта / дорожная карта** — этапы и вехи, временная шкала, зависимости и риски, ответственные. Шаблон для планирования и отслеживания хода проекта. |
| [docs/Кто-заполняет-БТ-и-ТЗ.md](docs/Кто-заполняет-БТ-и-ТЗ.md) | **Кто что заполняет в БТ и ТЗ** — разбор разделов бизнес-требований и ТЗ по ответственным (PM, заказчик, аналитик, разработчик); порядок заполнения и краткая сводка по ролям. |

README (этот файл) — документация для разработчика: запуск, структура кода, вызовы API, переменные окружения, требования к БД.

