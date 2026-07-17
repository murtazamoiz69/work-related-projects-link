import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import { categoryIcon, highlightTemplateVariables } from '../data'
import { recordTemplateUsage, useTemplatesStore } from '../store'
import type { Template, UsageContext } from '../types'

type PickerTab = 'all' | 'recent' | 'favorites'

// Universal Template Picker Modal — ported from V2's openTemplatePickerModal.
// Shared by Chat and Broadcast. Preview keeps {{variables}} highlighted as
// chips (not substituted) so the nutritionist sees what still needs review.
export function TemplatePickerModal({
  context,
  onInsert,
  onClose,
}: {
  context: UsageContext
  onInsert: (template: Template) => void
  onClose: () => void
}) {
  const templates = useTemplatesStore((s) => s.templates)
  const categories = useTemplatesStore((s) => s.categories)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [tab, setTab] = useState<PickerTab>('all')
  const [activeIndex, setActiveIndex] = useState(0)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = templates.filter((t) => !t.trashed && t.status !== 'archived')
    if (tab === 'recent')
      out = out
        .filter((t) => t.usage.lastUsed)
        .sort(
          (a, b) =>
            (b.usage.lastUsed?.getTime() ?? 0) -
            (a.usage.lastUsed?.getTime() ?? 0),
        )
        .slice(0, 8)
    else if (tab === 'favorites') out = out.filter((t) => t.favorite)
    if (category !== 'all') out = out.filter((t) => t.category === category)
    if (q)
      out = out.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      )
    if (tab === 'all')
      out = [...out].sort(
        (a, b) => b.updatedDate.getTime() - a.updatedDate.getTime(),
      )
    return out
  }, [templates, query, category, tab])

  // Keep the active index within the current list bounds.
  const safeIndex =
    activeIndex >= list.length ? Math.max(0, list.length - 1) : activeIndex
  const active = list[safeIndex]

  const doInsert = () => {
    const t = list[safeIndex]
    if (!t) return
    recordTemplateUsage(t, context)
    onClose()
    onInsert(t)
    showToast(`Inserted “${t.title}”`)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, list.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (
        e.key === 'Enter' &&
        (document.activeElement as HTMLElement | null)?.id !== 'tplPickerSearch'
      ) {
        e.preventDefault()
        doInsert()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, safeIndex, context])

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card tpl-picker-card">
        <div className="modal-head">
          <h3>
            <Icon name="layout-template" className="inline-icon" /> Insert
            Template
          </h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        <div className="tpl-picker-toolbar">
          <div className="chat-list-search tpl-picker-search">
            <Icon name="search" />
            <input
              type="text"
              id="tplPickerSearch"
              placeholder="Search templates…"
              value={query}
              autoFocus
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
            />
          </div>
          <div className="chat-tabs tpl-picker-tabs" role="tablist">
            {(['all', 'recent', 'favorites'] as const).map((tk) => (
              <button
                key={tk}
                className={`chat-tab${tab === tk ? ' active' : ''}`}
                onClick={() => {
                  setTab(tk)
                  setActiveIndex(0)
                }}
              >
                {tk[0].toUpperCase() + tk.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="tpl-picker-chips">
          <button
            className={`prog-meta-chip tpl-cat-chip${category === 'all' ? ' is-active' : ''}`}
            onClick={() => {
              setCategory('all')
              setActiveIndex(0)
            }}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`prog-meta-chip tpl-cat-chip${category === c ? ' is-active' : ''}`}
              onClick={() => {
                setCategory(c)
                setActiveIndex(0)
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="tpl-picker-body">
          <ul className="tpl-picker-list">
            {list.length ? (
              list.map((t, i) => (
                <li key={t.id}>
                  <button
                    className={`tpl-picker-row${i === safeIndex ? ' is-active' : ''}`}
                    onClick={() => setActiveIndex(i)}
                    onDoubleClick={() => {
                      setActiveIndex(i)
                      doInsert()
                    }}
                  >
                    <span
                      className="tpl-picker-row-swatch"
                      style={{ background: t.cover.value }}
                    >
                      <Icon name={categoryIcon(t.category)} />
                    </span>
                    <span className="tpl-picker-row-body">
                      <span className="tpl-picker-row-title">
                        {t.title}
                        {t.favorite ? (
                          <>
                            {' '}
                            <Icon name="star" className="tpl-fav-star" />
                          </>
                        ) : null}
                      </span>
                      <span className="tpl-picker-row-sub">
                        {t.category} · Used {t.usage.timesUsed}×
                      </span>
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="assign-empty">No templates match</li>
            )}
          </ul>

          <div className="tpl-picker-preview">
            {active ? (
              <>
                <div
                  className="tpl-preview-cover"
                  style={{ background: active.cover.value }}
                >
                  <Icon name={categoryIcon(active.category)} />
                </div>
                <div className="tpl-preview-body">
                  <span className="tpl-meta-chip">{active.category}</span>
                  <h4>{active.title}</h4>
                  <div
                    className="tpl-preview-content"
                    dangerouslySetInnerHTML={{
                      __html: highlightTemplateVariables(active.content),
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="tpl-picker-empty-preview">
                <Icon name="mouse-pointer-click" />
                <span>Select a template to preview</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-foot">
          <span className="chat-mini-card-text" style={{ margin: 0 }}>
            Double-click a template, or select and press Enter
          </span>
          <button className="btn-primary" disabled={!active} onClick={doInsert}>
            Insert Template
          </button>
        </div>
      </div>
    </div>
  )
}
