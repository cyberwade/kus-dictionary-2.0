import React, { useState, useCallback } from 'react'
import { Modal } from './Modal'
import { addKeyphrase, addHistoria } from '../api'
import './AddSentenceModal.css'

/** Модалка «Добавить карточку»: Выражения (keyphrase_*) или Банк историй (historia_*). */
export function AddCardModal({ open, onClose, chapterId, isHistoria, onCardAdded }) {
  const espLabel = isHistoria ? 'historia_esp' : 'keyphrase_esp'
  const rusLabel = isHistoria ? 'historia_rus' : 'keyphrase_rus'
  const commentLabel = isHistoria ? 'historia_comment' : 'keyphrase_comment'

  const [esp, setEsp] = useState('')
  const [rus, setRus] = useState('')
  const [comment, setComment] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const resetForm = useCallback(() => {
    setEsp('')
    setRus('')
    setComment('')
    setError(null)
    setSuccessMessage(null)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleAddCard = useCallback(async () => {
    if (chapterId == null) return
    setError(null)
    setSuccessMessage(null)
    setAddLoading(true)
    try {
      if (isHistoria) {
        await addHistoria(chapterId, esp.trim(), rus.trim(), comment.trim() || null)
      } else {
        await addKeyphrase(chapterId, esp.trim(), rus.trim(), comment.trim() || null)
      }
      setSuccessMessage('Карточка добавлена.')
      setError(null)
      setEsp('')
      setRus('')
      setComment('')
      onCardAdded?.()
    } catch (e) {
      setSuccessMessage(null)
      setError(e.message || 'Ошибка добавления карточки')
    } finally {
      setAddLoading(false)
    }
  }, [chapterId, isHistoria, esp, rus, comment, onCardAdded, resetForm])

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Добавить карточку"
      hideFooter
      showCloseButton
      modalBoxClassName="modal-box-wide"
    >
      <div className="add-sentence-modal">
        <div className="add-sentence-block">
          <label className="add-sentence-field-label">
            {espLabel}
            <textarea
              className="add-sentence-textarea"
              value={esp}
              onChange={(e) => setEsp(e.target.value)}
              placeholder={isHistoria ? 'Текст на испанском' : 'Ключевая фраза (исп.)'}
              rows={2}
            />
          </label>
          <label className="add-sentence-field-label">
            {rusLabel}
            <textarea
              className="add-sentence-textarea"
              value={rus}
              onChange={(e) => setRus(e.target.value)}
              placeholder={isHistoria ? 'Текст на русском' : 'Ключевая фраза (рус.)'}
              rows={2}
            />
          </label>
          <label className="add-sentence-field-label">
            {commentLabel} (опционально)
            <textarea
              className="add-sentence-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий"
              rows={2}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddCard}
            disabled={addLoading || !esp.trim() || !rus.trim()}
          >
            {addLoading ? 'Добавление…' : 'Добавить карточку'}
          </button>
        </div>
        {error && <p className="add-sentence-error">{error}</p>}
        {successMessage && <p className="add-sentence-success">{successMessage}</p>}
      </div>
    </Modal>
  )
}
