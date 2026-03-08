import React, { useState, useEffect, useCallback } from 'react'
import {
  getSentences,
  getHistoriaSentences,
  deleteSentence,
  deleteHistoriaSentence,
  updateKeyphraseHidden,
  updateHistoriaHidden,
  deleteKeyphrase,
  deleteHistoria,
} from '../api'
import { Modal } from './Modal'
import { AddSentenceModal } from './AddSentenceModal'
import { EditSentenceModal } from './EditSentenceModal'
import { EditCardModal } from './EditCardModal'
import './AddSentenceModal.css'
import './Card.css'

function Showable({ rus, esp, label = 'Показать' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="showable">
      <span className="showable-rus">{rus}</span>
      <button
        type="button"
        className="showable-toggle"
        onClick={() => setShow((s) => !s)}
      >
        {show ? esp : label}
      </button>
    </div>
  )
}

const IconAdd = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

/** Карточка выражения или истории. keyphrase — для модуля Выражения, historia — для Банка историй. */
export function Card({ orderNumber, keyphrase, historia, showSentences = true, onHiddenChange, onCardUpdated, onCardDeleted }) {
  const isHistoria = !!historia
  const item = historia ?? keyphrase
  const itemId = isHistoria ? item.historia_id : item.keyphrase_id

  const [sentences, setSentences] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAdd, setModalAdd] = useState(false)
  const [modalDelete, setModalDelete] = useState(false)
  const [sentenceToDelete, setSentenceToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [sentenceToEdit, setSentenceToEdit] = useState(null)
  const [modalEdit, setModalEdit] = useState(false)
  const [modalEditCard, setModalEditCard] = useState(false)
  const [modalDeleteCard, setModalDeleteCard] = useState(false)
  const [deleteCardLoading, setDeleteCardLoading] = useState(false)
  const [deleteCardError, setDeleteCardError] = useState(null)
  const [hiddenLoading, setHiddenLoading] = useState(false)
  const isHidden = Boolean(item?.is_hidden)

  const fetchSentences = isHistoria ? getHistoriaSentences : getSentences

  const refetchSentences = useCallback(() => {
    fetchSentences(itemId).then(setSentences)
  }, [isHistoria, itemId])

  useEffect(() => {
    if (!showSentences) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchSentences(itemId).then((data) => {
      if (!cancelled) {
        setSentences(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [itemId, showSentences, isHistoria])

  const comment = isHistoria ? item.historia_comment : item.keyfrase_comment
  const rus = isHistoria ? item.historia_rus : item.keyphrase_rus
  const esp = isHistoria ? item.historia_esp : item.keyphrase_esp

  const handleHiddenToggle = async () => {
    if (hiddenLoading || !itemId) return
    setHiddenLoading(true)
    try {
      if (isHistoria) {
        await updateHistoriaHidden(itemId, !isHidden)
      } else {
        await updateKeyphraseHidden(itemId, !isHidden)
      }
      onHiddenChange?.(itemId, !isHidden)
    } finally {
      setHiddenLoading(false)
    }
  }

  return (
    <article className="card">
      <header className="card-header">
        <span className="card-header-left">
          <span className="card-number">{orderNumber ?? item?.order_in_chapter ?? '—'}</span>
          {comment && (
            <span className="card-comment">{comment}</span>
          )}
        </span>
        <div className="card-header-right">
          <label className="card-hide-toggle" title="Скрыть карточку">
            <input
              type="checkbox"
              checked={isHidden}
              disabled={hiddenLoading}
              onChange={handleHiddenToggle}
              className="toggle-input"
            />
            <span className="toggle-switch card-hide-switch" aria-hidden="true" />
          </label>
          <button
            type="button"
            className="btn btn-ghost card-action-icon"
            onClick={() => setModalEditCard(true)}
            title="Редактировать карточку"
            aria-label="Редактировать карточку"
          >
            <IconEdit />
          </button>
          <button
            type="button"
            className="btn btn-ghost card-action-icon"
            onClick={() => {
              setDeleteCardError(null)
              setModalDeleteCard(true)
            }}
            title="Удалить карточку"
            aria-label="Удалить карточку"
          >
            <IconTrash />
          </button>
        </div>
      </header>

      <div className="card-block card-block-expression">
        <div className="card-expression-row">
          <Showable
            rus={rus}
            esp={esp}
            label="Показать"
          />
          {showSentences && (
            <button
              type="button"
              className="btn btn-ghost card-add-icon"
              onClick={() => setModalAdd(true)}
              title="Добавить предложение"
              aria-label="Добавить предложение"
            >
              <IconAdd />
            </button>
          )}
        </div>
      </div>

      {showSentences && (
        <>
          <div className="card-divider" aria-hidden="true" />

          <div className="card-block card-block-sentences">
            {loading ? (
              <p className="card-muted">Загрузка…</p>
            ) : sentences.length === 0 ? (
              <p className="card-muted">Нет предложений</p>
            ) : (
              <ul className="sentence-list">
                {sentences.map((s) => (
                  <li key={s.sentence_id} className="sentence-item">
                    <Showable
                      rus={s.sentence_rus}
                      esp={s.sentence_esp}
                      label="Показать"
                    />
                    <span className="sentence-item-actions">
                      <button
                        type="button"
                        className="btn btn-ghost sentence-action-icon"
                        onClick={() => {
                          setSentenceToEdit(s)
                          setModalEdit(true)
                        }}
                        title="Редактировать предложение"
                        aria-label="Редактировать предложение"
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost sentence-action-icon"
                        onClick={() => {
                          setSentenceToDelete(s)
                          setDeleteError(null)
                          setModalDelete(true)
                        }}
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        <IconTrash />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <AddSentenceModal
        open={modalAdd}
        onClose={() => setModalAdd(false)}
        keyphrase={!isHistoria ? keyphrase : undefined}
        historia={isHistoria ? historia : undefined}
        onSentenceAdded={refetchSentences}
      />
      <EditCardModal
        open={modalEditCard}
        onClose={() => setModalEditCard(false)}
        keyphrase={!isHistoria ? item : undefined}
        historia={isHistoria ? item : undefined}
        onCardUpdated={onCardUpdated}
      />
      <Modal
        open={modalDeleteCard}
        onClose={() => {
          setModalDeleteCard(false)
          setDeleteCardError(null)
        }}
        title="Удалить карточку"
        hideFooter
        showCloseButton
        modalBoxClassName="modal-box-wide"
      >
        <div className="add-sentence-modal">
          <p className="add-sentence-warning">
            Вместе с карточкой будут удалены все предложения.
          </p>
          <div className="add-sentence-block">
            <label className="add-sentence-field-label">
              {isHistoria ? 'historia_esp' : 'keyphrase_esp'}
              <textarea
                className="add-sentence-textarea add-sentence-textarea-readonly"
                value={esp ?? ''}
                readOnly
                rows={2}
                tabIndex={-1}
                aria-readonly="true"
              />
            </label>
            <label className="add-sentence-field-label">
              {isHistoria ? 'historia_rus' : 'keyphrase_rus'}
              <textarea
                className="add-sentence-textarea add-sentence-textarea-readonly"
                value={rus ?? ''}
                readOnly
                rows={2}
                tabIndex={-1}
                aria-readonly="true"
              />
            </label>
          </div>
          {deleteCardError && <p className="add-sentence-error">{deleteCardError}</p>}
          <div className="modal-footer modal-footer-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setModalDeleteCard(false)
                setDeleteCardError(null)
              }}
              disabled={deleteCardLoading}
            >
              Отмена
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                setDeleteCardError(null)
                setDeleteCardLoading(true)
                try {
                  const deleteFn = isHistoria ? deleteHistoria : deleteKeyphrase
                  await deleteFn(itemId)
                  onCardDeleted?.(itemId)
                  setModalDeleteCard(false)
                } catch (e) {
                  setDeleteCardError(e.message || 'Ошибка удаления карточки')
                } finally {
                  setDeleteCardLoading(false)
                }
              }}
              disabled={deleteCardLoading}
            >
              {deleteCardLoading ? 'Удаление…' : 'Удалить карточку'}
            </button>
          </div>
        </div>
      </Modal>
      <EditSentenceModal
        open={modalEdit}
        onClose={() => {
          setModalEdit(false)
          setSentenceToEdit(null)
        }}
        sentence={sentenceToEdit}
        isHistoria={isHistoria}
        onSentenceUpdated={(updated) => {
          setSentences((prev) =>
            prev.map((s) =>
              s.sentence_id === updated.sentence_id
                ? { ...s, sentence_rus: updated.sentence_rus, sentence_esp: updated.sentence_esp }
                : s
            )
          )
        }}
      />
      <Modal
        open={modalDelete}
        onClose={() => {
          setModalDelete(false)
          setSentenceToDelete(null)
          setDeleteError(null)
        }}
        title="Удалить предложение"
        hideFooter
        showCloseButton
        modalBoxClassName="modal-box-wide"
      >
        {sentenceToDelete && (
          <div className="add-sentence-modal">
            <div className="add-sentence-block">
              <label className="add-sentence-field-label">
                sentence_esp
                <textarea
                  className="add-sentence-textarea add-sentence-textarea-readonly"
                  value={sentenceToDelete.sentence_esp ?? ''}
                  readOnly
                  rows={2}
                  tabIndex={-1}
                  aria-readonly="true"
                />
              </label>
              <label className="add-sentence-field-label">
                sentence_rus
                <textarea
                  className="add-sentence-textarea add-sentence-textarea-readonly"
                  value={sentenceToDelete.sentence_rus ?? ''}
                  readOnly
                  rows={2}
                  tabIndex={-1}
                  aria-readonly="true"
                />
              </label>
            </div>
            {deleteError && <p className="add-sentence-error">{deleteError}</p>}
            <div className="modal-footer modal-footer-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setModalDelete(false)
                  setSentenceToDelete(null)
                  setDeleteError(null)
                }}
                disabled={deleteLoading}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setDeleteError(null)
                  setDeleteLoading(true)
                  try {
                    const deleteFn = isHistoria ? deleteHistoriaSentence : deleteSentence
                    await deleteFn(sentenceToDelete.sentence_id)
                    setSentences((prev) => prev.filter((s) => s.sentence_id !== sentenceToDelete.sentence_id))
                    setModalDelete(false)
                    setSentenceToDelete(null)
                  } catch (e) {
                    setDeleteError(e.message || 'Ошибка удаления')
                  } finally {
                    setDeleteLoading(false)
                  }
                }}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Удаление…' : 'Удалить предложение'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </article>
  )
}
