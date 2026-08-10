import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import { MEAL_LIBRARY, MEAL_SLOTS, newMealEntry } from '@/features/programs'
import type { MealSlot } from '@/features/programs'
import { mealConflicts } from '../../clinical'
import { DEFAULT_MEAL_TIMES, pushVersion, resolveMeal } from '../../plan'
import { isUpcoming, roundToNext15, todayWeekDay } from '../../schedule'
import { getDay, getDietDay } from '../../context'
import type { ClinicalProfile, Workspace } from '../../types'

export function MealPickerModal({
  ws,
  profile,
  weekNum,
  dayNum,
  entryUid,
  enforceUpcoming,
  refresh,
  onClose,
}: {
  ws: Workspace
  profile: ClinicalProfile
  weekNum: number
  dayNum: number
  entryUid: string | null
  enforceUpcoming: boolean
  refresh: () => void
  onClose: () => void
}) {
  const day = getDietDay(ws, weekNum, dayNum)
  const dayLabel = (getDay(ws, weekNum, dayNum) || day)?.label ?? ''
  const entry =
    entryUid && day ? day.meals.find((e) => e.uid === entryUid) : null
  const currentMeal = entry ? resolveMeal(ws, entry.mealId) : null
  const today = todayWeekDay(profile, ws)
  const isToday = today.weekNum === weekNum && today.dayNum === dayNum

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | MealSlot>(
    entry ? entry.slot : 'all',
  )
  const [activeId, setActiveId] = useState<string | null>(
    currentMeal ? currentMeal.id : null,
  )
  const [time, setTime] = useState(
    entry ? entry.time : isToday ? roundToNext15(new Date()) : '12:00',
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const q = query.trim().toLowerCase()
  const visible = MEAL_LIBRARY.filter((m) => {
    if (category !== 'all' && m.category !== category) return false
    if (q && !m.name.toLowerCase().includes(q)) return false
    return true
  })
  const active = MEAL_LIBRARY.find((m) => m.id === activeId)

  const commit = () => {
    if (activeId == null || !day) return
    const picked = MEAL_LIBRARY.find((m) => m.id === activeId)
    if (!picked) return
    const chosenTime =
      time || DEFAULT_MEAL_TIMES[picked.category.toLowerCase()] || '12:00'
    if (
      enforceUpcoming &&
      !isUpcoming(profile.programStart, weekNum, dayNum, chosenTime)
    ) {
      showToast('Pick a time later than now — meals must stay upcoming')
      return
    }
    if (entry) {
      const prevName = currentMeal ? currentMeal.name : 'meal'
      entry.mealId = picked.id
      entry.slot = picked.category
      entry.time = chosenTime
      pushVersion(
        ws,
        'Swapped meal',
        'Sarah Nolan',
        `Wk${weekNum} ${dayLabel}: ${prevName} → ${picked.name}`,
      )
    } else {
      day.meals.push(newMealEntry(picked.id, picked.category, chosenTime))
      pushVersion(
        ws,
        'Added meal',
        'Sarah Nolan',
        `Wk${weekNum} ${dayLabel}: ${picked.name} added`,
      )
    }
    refresh()
    onClose()
  }

  return (
    <div
      className="modal-overlay pw-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card tpl-picker-card pw-tpl-picker">
        <div className="modal-head">
          <h3>
            {entry ? `Swap ${entry.slot}` : 'Add a meal'} · {dayLabel}
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
              placeholder="Search recipes…"
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="pw-modal-field pw-picker-select">
            Time
            <input
              type="time"
              value={time}
              min={isToday ? roundToNext15(new Date()) : undefined}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <div className="tpl-picker-chips">
          <button
            className={`prog-meta-chip tpl-cat-chip${category === 'all' ? ' is-active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          {MEAL_SLOTS.map((c) => (
            <button
              key={c}
              className={`prog-meta-chip tpl-cat-chip${category === c ? ' is-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="tpl-picker-body">
          <ul className="tpl-picker-list">
            {visible.length ? (
              visible.map((m) => {
                const conflicts = mealConflicts(m, profile)
                return (
                  <li key={m.id}>
                    <button
                      className={`tpl-picker-row${m.id === activeId ? ' is-active' : ''}`}
                      onClick={() => setActiveId(m.id)}
                    >
                      <span className="tpl-picker-row-swatch">
                        <Icon name="utensils" />
                      </span>
                      <span className="tpl-picker-row-body">
                        <span className="tpl-picker-row-title">{m.name}</span>
                        <span className="tpl-picker-row-sub">
                          {m.category} · {m.calories} kcal
                          {conflicts.length
                            ? ` · ${conflicts.length} note${conflicts.length > 1 ? 's' : ''}`
                            : ''}
                        </span>
                      </span>
                      {conflicts.some((c) => c.level === 'hard') ? (
                        <span
                          className="tpl-picker-row-flag"
                          title="Conflicts with user profile — info only"
                        >
                          <Icon name="alert-triangle" size={14} />
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            ) : (
              <li className="assign-empty">No recipes match</li>
            )}
          </ul>
          <div className="tpl-picker-preview">
            {active ? (
              <MealPreview active={active} profile={profile} />
            ) : (
              <div className="tpl-picker-empty-preview">
                <Icon name="mouse-pointer-click" />
                <span>Select a recipe to preview</span>
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button
            className="btn-primary"
            disabled={activeId == null}
            onClick={commit}
          >
            {entry ? `Swap ${entry.slot}` : `Add to ${dayLabel}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function MealPreview({
  active,
  profile,
}: {
  active: (typeof MEAL_LIBRARY)[number]
  profile: ClinicalProfile
}) {
  const conflicts = mealConflicts(active, profile)
  return (
    <div className="pw-preview-body">
      <div className="meal-drawer-hero">
        <Icon name="image" />
      </div>
      <h4 className="meal-drawer-name">{active.name}</h4>
      <div className="pw-chip-row pw-meal-preview-chips">
        <span className="pw-chip">{active.category}</span>
        <span className="pw-chip">{active.servingSize}</span>
        <span className="pw-chip">{active.prepTime}</span>
      </div>
      <div className="meal-drawer-macros">
        <div>
          <span className="chat-insight-value">{active.calories}</span>
          <span className="chat-insight-label">kcal</span>
        </div>
        <div>
          <span className="chat-insight-value">{active.protein}g</span>
          <span className="chat-insight-label">Protein</span>
        </div>
        <div>
          <span className="chat-insight-value">{active.carbs}g</span>
          <span className="chat-insight-label">Carbs</span>
        </div>
        <div>
          <span className="chat-insight-value">{active.fat}g</span>
          <span className="chat-insight-label">Fat</span>
        </div>
        <div>
          <span className="chat-insight-value">{active.fiber || 0}g</span>
          <span className="chat-insight-label">Fiber</span>
        </div>
      </div>
      {conflicts.length ? (
        <div
          className={`pw-meal-conflict-note ${conflicts.some((c) => c.level === 'hard') ? 'hard' : 'soft'}`}
        >
          <Icon name="alert-triangle" />
          <div>
            <b>For {profile.name.split(' ')[0]}:</b>{' '}
            {conflicts.map((c) => c.reason).join(' · ')}
          </div>
        </div>
      ) : null}
      <div className="drawer-section-head">
        <h4>
          <Icon name="shopping-basket" />
          Ingredients
        </h4>
      </div>
      <ul className="meal-ingredient-list">
        {active.ingredients.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
      <div className="drawer-section-head">
        <h4>
          <Icon name="list-ordered" />
          Preparation steps
        </h4>
      </div>
      <ol className="meal-steps-list">
        {active.steps.map((s, idx) => (
          <li key={idx}>{s}</li>
        ))}
      </ol>
    </div>
  )
}
