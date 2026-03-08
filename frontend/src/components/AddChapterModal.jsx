import React, { useState, useCallback } from 'react'
import { Modal } from './Modal'
import { createChapter } from '../api'
import './AddSentenceModal.css'

/** Модалка «Добавить раздел»: ввод названия, создание в таблице chapters. */
export function AddChapterModal({ open, onClose, onChapterAdded }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const resetForm = useCallback(() => {
    setName('')
    setError(null)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleSubmit = useCallback(async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Введите название раздела')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const created = await createChapter(trimmed)
      resetForm()
      onChapterAdded?.(created)
      onClose()
    } catch (e) {
      setError(e.message || 'Ошибка добавления раздела')
    } finally {
      setLoading(false)
    }
  }, [name, onChapterAdded, onClose, resetForm])

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Добавить раздел"
      hideFooter
      showCloseButton
      modalBoxClassName="modal-box-wide"
    >
      <div className="add-sentence-modal">
        <div className="add-sentence-block">
          <label className="add-sentence-field-label">
            Название раздела
            <input
              type="text"
              className="add-sentence-textarea"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название раздела"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </label>
          {error && <p className="add-sentence-error">{error}</p>}
        </div>
        <div className="add-sentence-actions-row" style={{ gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={handleClose}>
            Отмена
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Добавление…' : 'Добавить раздел'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
