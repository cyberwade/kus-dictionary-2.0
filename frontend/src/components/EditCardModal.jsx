import React, { useState, useEffect, useCallback } from 'react'
import { Modal } from './Modal'
import { updateKeyphrase, updateHistoria } from '../api'
import './AddSentenceModal.css'

/** Модалка «Редактировать карточку»: Выражения (keyphrase) или Банк историй (historia). Валидация как у редактирования предложений. */
export function EditCardModal({ open, onClose, keyphrase, historia, onCardUpdated }) {
  const isHistoria = !!historia
  const item = keyphrase ?? historia
  const espLabel = isHistoria ? 'historia_esp' : 'keyphrase_esp'
  const rusLabel = isHistoria ? 'historia_rus' : 'keyphrase_rus'
  const commentLabel = isHistoria ? 'historia_comment' : 'keyphrase_comment'

  const initialEsp = isHistoria ? (item?.historia_esp ?? '') : (item?.keyphrase_esp ?? '')
  const initialRus = isHistoria ? (item?.historia_rus ?? '') : (item?.keyphrase_rus ?? '')
  const initialComment = isHistoria ? (item?.historia_comment ?? '') : (item?.keyfrase_comment ?? '')

  const [esp, setEsp] = useState(initialEsp)
  const [rus, setRus] = useState(initialRus)
  const [comment, setComment] = useState(initialComment)
  const [editLoading, setEditLoading] = useState(false)
  const [error, setError] = useState(null)

  const hasChanges =
    esp.trim() !== initialEsp.trim() ||
    rus.trim() !== initialRus.trim() ||
    (comment ?? '').trim() !== (initialComment ?? '').trim()
  const valid = esp.trim() !== '' && rus.trim() !== ''

  useEffect(() => {
    if (open && item) {
      setEsp(isHistoria ? (item.historia_esp ?? '') : (item.keyphrase_esp ?? ''))
      setRus(isHistoria ? (item.historia_rus ?? '') : (item.keyphrase_rus ?? ''))
      setComment(isHistoria ? (item.historia_comment ?? '') : (item.keyfrase_comment ?? ''))
      setError(null)
    }
  }, [open, item, isHistoria])

  const handleClose = useCallback(() => {
    setError(null)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(async () => {
    if (!item || !hasChanges || !valid) return
    setError(null)
    setEditLoading(true)
    try {
      const itemId = isHistoria ? item.historia_id : item.keyphrase_id
      if (isHistoria) {
        await updateHistoria(itemId, esp.trim(), rus.trim(), comment.trim() || null)
      } else {
        await updateKeyphrase(itemId, esp.trim(), rus.trim(), comment.trim() || null)
      }
      const updated = isHistoria
        ? { ...item, historia_esp: esp.trim(), historia_rus: rus.trim(), historia_comment: comment.trim() || '' }
        : { ...item, keyphrase_esp: esp.trim(), keyphrase_rus: rus.trim(), keyfrase_comment: comment.trim() || '' }
      onCardUpdated?.(updated)
      handleClose()
    } catch (e) {
      setError(e.message || 'Ошибка обновления карточки')
    } finally {
      setEditLoading(false)
    }
  }, [item, isHistoria, esp, rus, comment, hasChanges, valid, onCardUpdated, handleClose])

  if (!item) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Редактировать карточку"
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
        </div>
        {error && <p className="add-sentence-error">{error}</p>}
        <div className="modal-footer modal-footer-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleClose}
            disabled={editLoading}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={editLoading || !hasChanges || !valid}
          >
            {editLoading ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
