import React, { useState, useEffect, useCallback } from 'react'
import { Modal } from './Modal'
import { updateSentence, updateHistoriaSentence } from '../api'
import './AddSentenceModal.css'

export function EditSentenceModal({ open, onClose, sentence, isHistoria = false, onSentenceUpdated }) {
  const [sentenceEsp, setSentenceEsp] = useState('')
  const [sentenceRus, setSentenceRus] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [error, setError] = useState(null)

  const initialEsp = sentence?.sentence_esp ?? ''
  const initialRus = sentence?.sentence_rus ?? ''
  const hasChanges =
    sentenceEsp.trim() !== initialEsp.trim() || sentenceRus.trim() !== initialRus.trim()

  useEffect(() => {
    if (open && sentence) {
      setSentenceEsp(sentence.sentence_esp ?? '')
      setSentenceRus(sentence.sentence_rus ?? '')
      setError(null)
    }
  }, [open, sentence])

  const handleClose = useCallback(() => {
    setError(null)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(async () => {
    if (!sentence || !hasChanges) return
    setError(null)
    setEditLoading(true)
    try {
      const updateFn = isHistoria ? updateHistoriaSentence : updateSentence
      await updateFn(sentence.sentence_id, sentenceRus, sentenceEsp)
      onSentenceUpdated?.({ ...sentence, sentence_rus: sentenceRus, sentence_esp: sentenceEsp })
      handleClose()
    } catch (e) {
      setError(e.message || 'Ошибка обновления предложения')
    } finally {
      setEditLoading(false)
    }
  }, [sentence, sentenceRus, sentenceEsp, hasChanges, isHistoria, onSentenceUpdated, handleClose])

  if (!sentence) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Редактировать предложение"
      hideFooter
      showCloseButton
      modalBoxClassName="modal-box-wide"
    >
      <div className="add-sentence-modal">
        <div className="add-sentence-block">
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
            disabled={editLoading || !hasChanges}
          >
            {editLoading ? 'Сохранение…' : 'Редактировать предложение'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
