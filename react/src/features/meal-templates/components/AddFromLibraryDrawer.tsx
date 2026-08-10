import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatJoinDate } from '@/features/clients'
import { useMealTemplatesStore } from '../store'
import type { MealTemplate, MealTemplateType } from '../types'
import { ConfirmDialog } from './ConfirmDialog'

// A single unconditional confirm before an apply that would overwrite
// existing meals — the target (a whole week or a single day) is already
// fixed by which hover action opened this drawer, so there's no picker step.
type Flow = { step: 'none' } | { step: 'confirm'; template: MealTemplate }

function MealTemplateCard({
  t,
  onUse,
  resolveMealName,
}: {
  t: MealTemplate
  onUse: () => void
  resolveMealName: (mealId: string) => string
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="meal-tpl-card">
      <div className="meal-tpl-card-top">
        <span className="meal-tpl-card-name">{t.name}</span>
        <span className={`meal-tpl-type-badge type-${t.type}`}>
          {t.type === 'week' ? 'Week' : 'Day'}
        </span>
      </div>
      <span className="meal-tpl-card-kcal">{t.avgDailyCalories} kcal</span>
      <div className="meal-tpl-card-meta-row">
        <span className="meal-tpl-card-meta">
          Created {formatJoinDate(t.createdDate)} · {t.days.length} day
          {t.days.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className={`meal-tpl-expand-btn${expanded ? ' is-open' : ''}`}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Hide meals' : 'View meals'}
          <Icon name="chevron-down" size={13} />
        </button>
      </div>
      {expanded ? (
        <div className="meal-tpl-card-days">
          {t.days.map((d) => (
            <div key={d.dayNum} className="meal-tpl-card-day">
              {/* A day template applies to whichever weekday it's used
                  against, not the one it happened to be saved from — so
                  unlike a week template, its single day isn't labeled here. */}
              {t.type === 'week' ? (
                <span className="meal-tpl-card-day-label">{d.label}</span>
              ) : null}
              <span className="meal-tpl-card-day-meals">
                {d.meals.length
                  ? d.meals
                      .slice()
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((m) => resolveMealName(m.mealId))
                      .join(', ')
                  : 'No meals'}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <button className="btn-secondary sm" onClick={onUse}>
        Use Template
      </button>
    </div>
  )
}

export function AddFromLibraryDrawer({
  onClose,
  templateType,
  hasConflict,
  onUse,
  resolveMealName,
}: {
  onClose: () => void
  templateType: MealTemplateType
  hasConflict: boolean
  onUse: (template: MealTemplate) => void
  resolveMealName: (mealId: string) => string
}) {
  // Select the raw (stable) array reference — filtering inside the selector
  // would return a new array identity on every render, which breaks
  // useSyncExternalStore's snapshot-equality check and causes an infinite
  // render loop ("Maximum update depth exceeded").
  const allTemplates = useMealTemplatesStore((s) => s.templates)
  const templates = allTemplates.filter((t) => t.type === templateType)
  const [query, setQuery] = useState('')
  const [flow, setFlow] = useState<Flow>({ step: 'none' })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()
  const visible = templates.filter(
    (t) => !q || t.name.toLowerCase().includes(q),
  )

  const handleUse = (t: MealTemplate) => {
    if (hasConflict) {
      setFlow({ step: 'confirm', template: t })
    } else {
      onUse(t)
      onClose()
    }
  }

  return (
    <>
      <div
        className="drawer-overlay pw-drawer-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="drawer-panel">
          <div className="drawer-head">
            <div>
              <h3>{templateType === 'week' ? 'Week' : 'Day'} Templates</h3>
              <p className="panel-sub">
                {templateType === 'week'
                  ? 'Replace this week with a saved template'
                  : 'Replace this day with a saved template'}
              </p>
            </div>
            <button
              className="icon-btn sm"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="drawer-body meal-tpl-drawer-body">
            {templates.length === 0 ? (
              <div className="clients-empty">
                <Icon name="library" />
                <p className="clients-empty-title">No Templates Yet</p>
                <p>
                  Hover a {templateType === 'week' ? 'week' : 'day'} on the Diet
                  Plan tab and use &ldquo;Save to Library&rdquo; to build your
                  first {templateType} template.
                </p>
              </div>
            ) : (
              <>
                <div className="chat-list-search">
                  <Icon name="search" />
                  <input
                    type="text"
                    placeholder="Search templates…"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="meal-tpl-grid">
                  {visible.length ? (
                    visible.map((t) => (
                      <MealTemplateCard
                        key={t.id}
                        t={t}
                        onUse={() => handleUse(t)}
                        resolveMealName={resolveMealName}
                      />
                    ))
                  ) : (
                    <p className="pw-muted">No templates match</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {flow.step === 'confirm' ? (
        <ConfirmDialog
          title={
            templateType === 'week'
              ? "Replace This Week's Meals?"
              : 'Replace Existing Meals?'
          }
          message={
            templateType === 'week'
              ? 'Applying this template will replace all meals from Monday through Sunday of the currently opened week. This action cannot be undone.'
              : 'Applying this template will replace the existing meals for this day. This action cannot be undone.'
          }
          confirmText="Replace"
          danger
          onConfirm={() => {
            onUse(flow.template)
            onClose()
          }}
          onClose={() => setFlow({ step: 'none' })}
        />
      ) : null}
    </>
  )
}
