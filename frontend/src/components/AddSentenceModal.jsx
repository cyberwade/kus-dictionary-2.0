import React, { useState, useCallback } from 'react'
import { Modal } from './Modal'
import { generateSentence, addSentence, addHistoriaSentence } from '../api'
import './AddSentenceModal.css'

/** Контекст карточки: либо keyphrase (Выражения), либо historia (Банк историй). */
export function AddSentenceModal({ open, onClose, keyphrase, historia, onSentenceAdded }) {
  const isHistoria = !!historia
  const item = keyphrase ?? historia

  const [additionalComment, setAdditionalComment] = useState('')
  const [sentenceEsp, setSentenceEsp] = useState('')
  const [sentenceRus, setSentenceRus] = useState('')
  const [generateLoading, setGenerateLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const resetForm = useCallback(() => {
    setAdditionalComment('')
    setSentenceEsp('')
    setSentenceRus('')
    setError(null)
    setSuccessMessage(null)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const esp = isHistoria ? item.historia_esp : item.keyphrase_esp
  const rus = isHistoria ? item.historia_rus : item.keyphrase_rus
  const comment = isHistoria ? item.historia_comment : item.keyfrase_comment

  const insertPhrase = useCallback((phrase) => {
    setAdditionalComment((prev) => (prev.trim() ? `${prev.trim()} ${phrase}` : phrase))
  }, [])

  const insertQuestionHint = () => insertPhrase('Это должен быть вопрос.')
  const insertImperativoAffirmativo = () => insertPhrase('Используй Imperativo Affirmativo.')
  const insertImperativoNegativo = () => insertPhrase('Используй Imperativo Negativo.')
  const clearAdditionalComment = () => setAdditionalComment('')

  const handleGenerate = useCallback(async () => {
    if (!item) return
    setError(null)
    setSuccessMessage(null)
    setGenerateLoading(true)
    try {
      const data = await generateSentence({
        keyphrase_id: isHistoria ? 0 : item.keyphrase_id,
        keyphrase_esp: esp,
        keyphrase_rus: rus,
        keyfrase_comment: comment,
        additional_comment: additionalComment,
      })
      setSentenceEsp(data.sentence_esp ?? '')
      setSentenceRus(data.sentence_rus ?? '')
    } catch (e) {
      setError(e.message || 'Ошибка генерации предложения')
    } finally {
      setGenerateLoading(false)
    }
  }, [item, isHistoria, esp, rus, comment, additionalComment])

  const handleAddSentence = useCallback(async () => {
    if (!item) return
    setError(null)
    setSuccessMessage(null)
    setAddLoading(true)
    try {
      if (isHistoria) {
        await addHistoriaSentence(item.historia_id, sentenceRus, sentenceEsp)
      } else {
        await addSentence(item.keyphrase_id, sentenceRus, sentenceEsp)
      }
      setSuccessMessage('Предложение добавлено.')
      onSentenceAdded?.()
      setSentenceEsp('')
      setSentenceRus('')
    } catch (e) {
      setError(e.message || 'Ошибка добавления предложения')
    } finally {
      setAddLoading(false)
    }
  }, [item, isHistoria, sentenceRus, sentenceEsp, onSentenceAdded])

  if (!item) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Добавить предложение"
      hideFooter
      showCloseButton
      modalBoxClassName="modal-box-wide"
    >
      <div className="add-sentence-modal">
        <div className="add-sentence-block add-sentence-inputs">
          <div className="add-sentence-labels">
            <div className="add-sentence-label-row">
              <span className="add-sentence-label">{isHistoria ? 'historia_esp' : 'keyphrase_esp'}</span>
              <span className="add-sentence-value">{esp || '—'}</span>
            </div>
            <div className="add-sentence-label-row">
              <span className="add-sentence-label">{isHistoria ? 'historia_rus' : 'keyphrase_rus'}</span>
              <span className="add-sentence-value">{rus || '—'}</span>
            </div>
            <div className="add-sentence-label-row">
              <span className="add-sentence-label">{isHistoria ? 'historia_comment' : 'keyfrase_comment'}</span>
              <span className="add-sentence-value">{comment || '—'}</span>
            </div>
          </div>
          <label className="add-sentence-field-label">
            <span className="add-sentence-label-with-icon">
              additional_comment
              <button
                type="button"
                className="add-sentence-insert-icon"
                onClick={insertQuestionHint}
                title="Вставить: Это должен быть вопрос."
                aria-label="Вставить текст «Это должен быть вопрос.»"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
              <button
                type="button"
                className="add-sentence-insert-icon"
                onClick={insertImperativoAffirmativo}
                title="Вставить: Используй Imperativo Affirmativo."
                aria-label="Вставить текст «Используй Imperativo Affirmativo.»"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
              <button
                type="button"
                className="add-sentence-insert-icon"
                onClick={insertImperativoNegativo}
                title="Вставить: Используй Imperativo Negativo."
                aria-label="Вставить текст «Используй Imperativo Negativo.»"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
              <button
                type="button"
                className="add-sentence-insert-icon add-sentence-clear-icon"
                onClick={clearAdditionalComment}
                title="Очистить"
                aria-label="Очистить поле ввода"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            </span>
            <textarea
              className="add-sentence-textarea"
              value={additionalComment}
              onChange={(e) => setAdditionalComment(e.target.value)}
              placeholder="Дополнительный комментарий"
              rows={3}
            />
          </label>
          <div className="add-sentence-actions-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generateLoading}
            >
              {generateLoading ? 'Генерация…' : 'Создать предложение'}
            </button>
          </div>
        </div>

        <div className="add-sentence-block add-sentence-outputs">
          <label className="add-sentence-field-label">
            sentence_esp
            <textarea
              className="add-sentence-textarea"
              value={sentenceEsp}
              onChange={(e) => setSentenceEsp(e.target.value)}
              placeholder="Предложение на испанском"
              rows={2}
            />
          </label>
          <label className="add-sentence-field-label">
            sentence_rus
            <textarea
              className="add-sentence-textarea"
              value={sentenceRus}
              onChange={(e) => setSentenceRus(e.target.value)}
              placeholder="Предложение на русском"
              rows={2}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddSentence}
            disabled={addLoading || !sentenceEsp.trim() || !sentenceRus.trim()}
          >
            {addLoading ? 'Добавление…' : 'Добавить предложение'}
          </button>
        </div>

        {error && <p className="add-sentence-error">{error}</p>}
        {successMessage && <p className="add-sentence-success">{successMessage}</p>}
      </div>
    </Modal>
  )
}
