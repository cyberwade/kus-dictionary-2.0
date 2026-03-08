import React, { useState, useEffect, useCallback } from 'react'
import { getChapters, getHistorias } from '../../api'
import { Card } from '../../components/Card'
import { AddCardModal } from '../../components/AddCardModal'
import { AddChapterModal } from '../../components/AddChapterModal'
import '../../App.css'

const PER_PAGE_OPTIONS = [
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 'all', label: 'Все' },
]

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function HistoriasModule({ onSwitchModule }) {
  const [chapters, setChapters] = useState([])
  const [chapterId, setChapterId] = useState(null)
  const [perPage, setPerPage] = useState(20)
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], total: 0, total_pages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shuffleOrder, setShuffleOrder] = useState(null)
  const [showSentences, setShowSentences] = useState(true)
  const [showHiddenOnly, setShowHiddenOnly] = useState(false)
  const [hiddenIdsInView, setHiddenIdsInView] = useState(() => new Set())
  const [displayedTotalHidden, setDisplayedTotalHidden] = useState(0)
  const [addCardOpen, setAddCardOpen] = useState(false)
  const [addChapterOpen, setAddChapterOpen] = useState(false)

  useEffect(() => {
    getChapters()
      .then(setChapters)
      .catch((e) => setError(e.message))
  }, [])

  const loadHistorias = useCallback(
    (chId, p, per, hiddenFilter) => {
      if (chId == null) {
        setData({ items: [], total: 0, total_pages: 1 })
        setDisplayedTotalHidden(0)
        return
      }
      setLoading(true)
      setError(null)
      const limit = per === 'all' ? 0 : per
      getHistorias(chId, p, limit, hiddenFilter)
        .then((res) => {
          const effectivePerPage = res.per_page > 0 ? res.per_page : res.total
          const base = (res.page - 1) * effectivePerPage
          const items = res.items.map((item, i) => ({
            ...item,
            order_in_chapter: item.order_in_chapter ?? base + i + 1,
          }))
          setData({ ...res, items })
          setDisplayedTotalHidden(typeof res.total_hidden === 'number' ? res.total_hidden : 0)
          setShuffleOrder(null)
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    },
    []
  )

  const hiddenFilter = showHiddenOnly ? 'only' : 'exclude'

  useEffect(() => {
    setHiddenIdsInView(new Set())
    loadHistorias(chapterId, page, perPage, hiddenFilter)
  }, [chapterId, page, perPage, hiddenFilter, loadHistorias])

  const onChapterChange = (e) => {
    const id = e.target.value ? Number(e.target.value) : null
    setChapterId(id)
    setPage(1)
    setShuffleOrder(null)
  }

  const onPerPageChange = (e) => {
    const v = e.target.value
    setPerPage(v === 'all' ? 'all' : Number(v))
    setPage(1)
    setShuffleOrder(null)
  }

  const onPageChange = (p) => {
    setPage(p)
    setShuffleOrder(null)
  }

  const onShuffle = () => {
    if (data.items.length === 0) return
    const indices = data.items.map((_, i) => i)
    setShuffleOrder(shuffleArray(indices))
  }

  const displayItems = (() => {
    const raw =
      shuffleOrder != null
        ? shuffleOrder.map((i) => data.items[i])
        : data.items
    return raw.filter((item) => !hiddenIdsInView.has(item.historia_id))
  })()

  return (
    <div className="app">
      <div className="app-header-row">
        <h1 className="app-title">Kus Dictionary 2.0 — Банк историй</h1>
        {onSwitchModule && (
          <button type="button" className="btn btn-ghost app-switch-module" onClick={onSwitchModule}>
            Сменить модуль
          </button>
        )}
      </div>

      <div className="filters-row">
        <section className="block block-1">
          <label htmlFor="chapter-h" className="block-label">
            Раздел
          </label>
          <div className="chapter-filter-inner">
            <select
              id="chapter-h"
              value={chapterId ?? ''}
              onChange={onChapterChange}
              className="select"
            >
              <option value="">Выберите раздел</option>
              {chapters.map((ch) => (
                <option key={ch.chapter_id} value={ch.chapter_id}>
                  {ch.chapter_name}
                </option>
              ))}
            </select>
            {chapterId == null && (
              <button
                type="button"
                className="btn btn-add-card"
                onClick={() => setAddChapterOpen(true)}
                title="Добавить раздел"
                aria-label="Добавить раздел"
              >
                <svg className="btn-add-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {chapterId != null && (
          <>
            <section className="block block-2">
              <label htmlFor="perpage-h" className="block-label">
                Карточек на странице
              </label>
              <select
                id="perpage-h"
                value={perPage}
                onChange={onPerPageChange}
                className="select"
              >
                {PER_PAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </section>

            <section className="block block-sentences-toggle">
              <label htmlFor="show-hidden-h" className="block-label">
                Скрытые карточки
              </label>
              <div className="toggle-control">
                <label htmlFor="show-hidden-h" className="toggle-label">
                  <input
                    id="show-hidden-h"
                    type="checkbox"
                    checked={showHiddenOnly}
                    onChange={(e) => {
                      setShowHiddenOnly(e.target.checked)
                      setPage(1)
                      setShuffleOrder(null)
                    }}
                    className="toggle-input"
                  />
                  <span className="toggle-switch" aria-hidden="true" />
                  <span className="toggle-text">
                    {`Только скрытые (${displayedTotalHidden})`}
                  </span>
                </label>
              </div>
            </section>

            <section className="block block-sentences-toggle">
              <label htmlFor="show-sentences-h" className="block-label">
                Предложения
              </label>
              <div className="toggle-control">
                <label htmlFor="show-sentences-h" className="toggle-label">
                  <input
                    id="show-sentences-h"
                    type="checkbox"
                    checked={showSentences}
                    onChange={(e) => setShowSentences(e.target.checked)}
                    className="toggle-input"
                  />
                  <span className="toggle-switch" aria-hidden="true" />
                  <span className="toggle-text">Показывать</span>
                </label>
              </div>
            </section>
          </>
        )}
      </div>

      <AddCardModal
        open={addCardOpen}
        onClose={() => setAddCardOpen(false)}
        chapterId={chapterId}
        isHistoria={true}
        onCardAdded={() => loadHistorias(chapterId, page, perPage, hiddenFilter)}
      />

      <AddChapterModal
        open={addChapterOpen}
        onClose={() => setAddChapterOpen(false)}
        onChapterAdded={(created) => {
          getChapters().then(setChapters).catch((e) => setError(e.message))
          if (created?.chapter_id != null) {
            setChapterId(created.chapter_id)
            setPage(1)
          }
        }}
      />

      {chapterId != null && (
        <>
          <section className="block block-3">
            <div className="pagination-wrap">
              <button
                type="button"
                className="btn btn-shuffle"
                onClick={onShuffle}
                disabled={data.items.length === 0}
              >
                Перемешать
              </button>
              <div className="pagination">
                {Array.from({ length: data.total_pages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pagination-btn ${p === page ? 'active' : ''}`}
                      onClick={() => onPageChange(p)}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                className="btn btn-add-card"
                onClick={() => setAddCardOpen(true)}
                title="Добавить карточку"
                aria-label="Добавить карточку"
              >
                <svg className="btn-add-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </section>

          <section className="block block-4">
            {error && <p className="app-error">{error}</p>}
            {loading && <p className="app-muted">Загрузка…</p>}
            {!loading && !error && (
              <>
                {displayItems.length === 0 ? (
                  <p className="app-muted">В этом разделе нет историй.</p>
                ) : (
                  displayItems.map((historia) => (
                    <Card
                      key={historia.historia_id}
                      orderNumber={historia.order_in_chapter}
                      historia={historia}
                      showSentences={showSentences}
                      onHiddenChange={(id, isNowHidden) => {
                      setHiddenIdsInView((prev) => new Set(prev).add(id))
                      setDisplayedTotalHidden((prev) => (isNowHidden ? prev + 1 : Math.max(0, prev - 1)))
                    }}
                      onCardUpdated={(updated) => {
                        setData((prev) => ({
                          ...prev,
                          items: prev.items.map((it) =>
                            it.historia_id === updated.historia_id ? { ...it, ...updated } : it
                          ),
                        }))
                      }}
                      onCardDeleted={() => loadHistorias(chapterId, page, perPage, hiddenFilter)}
                    />
                  ))
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
