// В разработке через Vite: /api проксируется на бэкенд. Можно задать явный URL в .env: VITE_API_BASE=http://127.0.0.1:8000/api
const BASE = import.meta.env.VITE_API_BASE || '/api';

export async function getChapters() {
  const r = await fetch(`${BASE}/chapters`);
  if (!r.ok) throw new Error('Ошибка загрузки разделов');
  return r.json();
}

/** Добавить новый раздел (chapter). */
export async function createChapter(chapterName) {
  const r = await fetch(`${BASE}/chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapter_name: (chapterName || '').trim() }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка добавления раздела');
  return data;
}

/**
 * @param {string} [showHidden] - 'only' только скрытые, 'exclude' без скрытых, иначе все
 */
export async function getKeyphrases(chapterId, page = 1, perPage = 20, showHidden = null) {
  const params = new URLSearchParams({
    chapter_id: String(chapterId),
    page: String(page),
    per_page: String(perPage === 'all' ? 0 : perPage),
  });
  if (showHidden === 'only' || showHidden === 'exclude') {
    params.set('show_hidden', showHidden);
  }
  const r = await fetch(`${BASE}/keyphrases?${params}`);
  if (!r.ok) throw new Error('Ошибка загрузки выражений');
  return r.json();
}

/** Банк историй: список историй по разделу. */
export async function getHistorias(chapterId, page = 1, perPage = 20, showHidden = null) {
  const params = new URLSearchParams({
    chapter_id: String(chapterId),
    page: String(page),
    per_page: String(perPage === 'all' ? 0 : perPage),
  });
  if (showHidden === 'only' || showHidden === 'exclude') {
    params.set('show_hidden', showHidden);
  }
  const r = await fetch(`${BASE}/historias?${params}`);
  if (!r.ok) throw new Error('Ошибка загрузки историй');
  return r.json();
}

/** Добавить карточку выражения в раздел (модуль Выражения). */
export async function addKeyphrase(chapterId, keyphraseEsp, keyphraseRus, keyphraseComment = null) {
  const r = await fetch(`${BASE}/keyphrases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chapter_id: chapterId,
      keyphrase_esp: keyphraseEsp ?? '',
      keyphrase_rus: keyphraseRus ?? '',
      keyfrase_comment: keyphraseComment ?? undefined,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка добавления карточки');
  return data;
}

/** Добавить карточку истории в раздел (модуль Банк историй). */
export async function addHistoria(chapterId, historiaEsp, historiaRus, historiaComment = null) {
  const r = await fetch(`${BASE}/historias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chapter_id: chapterId,
      historia_esp: historiaEsp ?? '',
      historia_rus: historiaRus ?? '',
      historia_comment: historiaComment ?? undefined,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка добавления карточки');
  return data;
}

/**
 * Установить скрытость карточки (keyphrase).
 */
export async function updateKeyphraseHidden(keyphraseId, isHidden) {
  const r = await fetch(`${BASE}/keyphrases/${keyphraseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_hidden: !!isHidden }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка обновления');
  return data;
}

/** Обновить карточку выражения (keyphrase_esp, keyphrase_rus, keyphrase_comment). */
export async function updateKeyphrase(keyphraseId, keyphraseEsp, keyphraseRus, keyphraseComment = null) {
  const r = await fetch(`${BASE}/keyphrases/${keyphraseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyphrase_esp: keyphraseEsp ?? '',
      keyphrase_rus: keyphraseRus ?? '',
      keyfrase_comment: keyphraseComment ?? undefined,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка обновления карточки');
  return data;
}

/** Удалить карточку выражения. */
export async function deleteKeyphrase(keyphraseId) {
  const r = await fetch(`${BASE}/keyphrases/${keyphraseId}`, { method: 'DELETE' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка удаления карточки');
  return data;
}

/** Установить скрытость карточки истории. */
export async function updateHistoriaHidden(historiaId, isHidden) {
  const r = await fetch(`${BASE}/historias/${historiaId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_hidden: !!isHidden }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка обновления');
  return data;
}

/** Обновить карточку истории (historia_esp, historia_rus, historia_comment). */
export async function updateHistoria(historiaId, historiaEsp, historiaRus, historiaComment = null) {
  const r = await fetch(`${BASE}/historias/${historiaId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      historia_esp: historiaEsp ?? '',
      historia_rus: historiaRus ?? '',
      historia_comment: historiaComment ?? undefined,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка обновления карточки');
  return data;
}

/** Удалить карточку истории. */
export async function deleteHistoria(historiaId) {
  const r = await fetch(`${BASE}/historias/${historiaId}`, { method: 'DELETE' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка удаления карточки');
  return data;
}

/** Список предложений по keyphrase_id (модуль Выражения). */
export async function getSentences(keyphraseId) {
  const r = await fetch(`${BASE}/sentences?keyphrase_id=${keyphraseId}`);
  if (!r.ok) throw new Error('Ошибка загрузки предложений');
  return r.json();
}

/** Список предложений по historia_id (модуль Банк историй, таблица historia_sentences). */
export async function getHistoriaSentences(historiaId) {
  const r = await fetch(`${BASE}/historia-sentences?historia_id=${historiaId}`);
  if (!r.ok) throw new Error('Ошибка загрузки предложений');
  return r.json();
}

/**
 * Генерация предложения через OpenAI по ключевой фразе и комментариям.
 * @returns {{ sentence_esp: string, sentence_rus: string }}
 */
export async function generateSentence(params) {
  const r = await fetch(`${BASE}/sentences/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyphrase_id: params.keyphrase_id,
      keyphrase_esp: params.keyphrase_esp ?? '',
      keyphrase_rus: params.keyphrase_rus ?? '',
      keyfrase_comment: params.keyfrase_comment ?? '',
      additional_comment: params.additional_comment ?? '',
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка генерации предложения');
  return data;
}

/** Добавить предложение к выражению (модуль Выражения). */
export async function addSentence(keyphraseId, sentenceRus, sentenceEsp) {
  const r = await fetch(`${BASE}/sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyphrase_id: keyphraseId,
      sentence_rus: sentenceRus ?? '',
      sentence_esp: sentenceEsp ?? '',
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка добавления предложения');
  return data;
}

/** Добавить предложение к истории (модуль Банк историй, таблица historia_sentences). */
export async function addHistoriaSentence(historiaId, sentenceRus, sentenceEsp) {
  const r = await fetch(`${BASE}/historia-sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      historia_id: historiaId,
      sentence_rus: sentenceRus ?? '',
      sentence_esp: sentenceEsp ?? '',
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка добавления предложения');
  return data;
}

/** Обновить предложение по ID (модуль Выражения). */
export async function updateSentence(sentenceId, sentenceRus, sentenceEsp) {
  const r = await fetch(`${BASE}/sentences/${sentenceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sentence_rus: sentenceRus ?? '',
      sentence_esp: sentenceEsp ?? '',
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка обновления предложения');
  return data;
}

/** Обновить предложение истории по ID (модуль Банк историй). */
export async function updateHistoriaSentence(historiaSentenceId, sentenceRus, sentenceEsp) {
  const r = await fetch(`${BASE}/historia-sentences/${historiaSentenceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sentence_rus: sentenceRus ?? '',
      sentence_esp: sentenceEsp ?? '',
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка обновления предложения');
  return data;
}

/** Удалить предложение по ID (модуль Выражения). */
export async function deleteSentence(sentenceId) {
  const r = await fetch(`${BASE}/sentences/${sentenceId}`, { method: 'DELETE' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка удаления предложения');
  return data;
}

/** Удалить предложение истории по ID (модуль Банк историй). */
export async function deleteHistoriaSentence(historiaSentenceId) {
  const r = await fetch(`${BASE}/historia-sentences/${historiaSentenceId}`, { method: 'DELETE' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || 'Ошибка удаления предложения');
  return data;
}
