import React, { useEffect } from 'react'
import './Modal.css'

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export function Modal({ open, onClose, title, children, hideFooter, showCloseButton, modalBoxClassName }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className={['modal-box', modalBoxClassName].filter(Boolean).join(' ')} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          {title && <h3 className="modal-title">{title}</h3>}
          {(showCloseButton ?? true) && (
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Закрыть"
              aria-label="Закрыть"
            >
              <IconClose />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {!hideFooter && (
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
