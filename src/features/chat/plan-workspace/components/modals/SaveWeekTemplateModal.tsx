import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Backdrop } from '@/components/molecules/Backdrop'
import { showToast } from '@/lib/toast'
import {
  buildMealTemplate,
  useMealTemplatesStore,
} from '@/features/meal-templates'
import { extractWeekAsTemplateDays, resolveMeal } from '../../plan'
import type { Workspace } from '../../types'

export function SaveWeekTemplateModal({
  ws,
  weekNum,
  onClose,
}: {
  ws: Workspace
  weekNum: number
  onClose: () => void
}) {
  const week = ws.dietWeeks.find((w) => w.weekNum === weekNum)
  const [checked, setChecked] = useState<Set<number>>(
    () => new Set((week?.days ?? []).map((d) => d.dayNum)),
  )
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!week) return null

  const toggleDay = (dayNum: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(dayNum)) next.delete(dayNum)
      else next.add(dayNum)
      return next
    })
  }

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a template name.')
      return
    }
    const days = extractWeekAsTemplateDays(ws, weekNum, checked)
    if (!days.length) {
      setError('Select at least one day.')
      return
    }
    // Forced 'week' regardless of how many days ended up checked — this
    // template can only be used via the week-level "Import from Library".
    const template = buildMealTemplate(trimmed, 'Sarah Nolan', days, 'week')
    useMealTemplatesStore.getState().setTemplates((prev) => [template, ...prev])
    showToast('✅ Meal template saved successfully.')
    onClose()
  }

  return (
    <Backdrop className="modal-overlay pw-modal-overlay" onClose={onClose}>
      <div className="modal-card save-week-tpl-modal">
        <div className="modal-head">
          <h3>Save Week {weekNum} to Library</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          <p className="pw-muted">
            Uncheck any days you don&rsquo;t want included in this template.
          </p>
          <div className="save-week-tpl-list">
            {week.days.map((d) => (
              <label key={d.dayNum} className="save-week-tpl-day">
                <input
                  type="checkbox"
                  checked={checked.has(d.dayNum)}
                  onChange={() => toggleDay(d.dayNum)}
                />
                <div className="save-week-tpl-day-info">
                  <span className="save-week-tpl-day-label">{d.label}</span>
                  <span className="save-week-tpl-day-meals">
                    {d.meals.length
                      ? d.meals
                          .slice()
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((m) => resolveMeal(ws, m.mealId)?.name ?? m.slot)
                          .join(', ')
                      : 'No meals'}
                  </span>
                </div>
              </label>
            ))}
          </div>
          <label className="modal-field">
            <span>Template Name</span>
            <input
              type="text"
              placeholder="Enter template name"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
            />
          </label>
          {error ? <p className="modal-field-error">{error}</p> : null}
        </div>
        <div className="modal-foot">
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            Save Template
          </button>
        </div>
      </div>
    </Backdrop>
  )
}
