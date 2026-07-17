import { useMemo, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { MEAL_LIBRARY, MEAL_SLOTS, mealById } from '../../data'
import type { Meal, MealEntry } from '../../types'

// Add meal / Swap meal — same picker shell as the AI Plan Workspace's meal
// picker. Calls onCommit with the chosen meal + time; the parent mutates.
export function MealPickerModal({
  weekNum,
  dayLabel,
  entry,
  onCommit,
  onClose,
}: {
  weekNum: number
  dayLabel: string
  entry: MealEntry | null
  onCommit: (meal: Meal, time: string) => void
  onClose: () => void
}) {
  const currentMeal = entry ? mealById(entry.mealId) : null
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>(entry ? entry.slot : 'all')
  const [activeId, setActiveId] = useState<string | null>(
    currentMeal ? currentMeal.id : null,
  )
  const [time, setTime] = useState(entry ? entry.time : '12:00')

  const visibleMeals = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MEAL_LIBRARY.filter((m) => {
      if (category !== 'all' && m.category !== category) return false
      if (q && !m.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, category])

  const active = MEAL_LIBRARY.find((m) => m.id === activeId)

  const commit = () => {
    if (!active) return
    onCommit(active, time)
  }

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
            {entry ? `Swap ${entry.slot}` : 'Add a meal'} · Week {weekNum},{' '}
            {dayLabel}
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
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="pw-modal-field pw-picker-select">
            Time
            <input
              type="time"
              value={time}
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
            {visibleMeals.length ? (
              visibleMeals.map((m) => (
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
                      </span>
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="assign-empty">No recipes match</li>
            )}
          </ul>
          <div className="tpl-picker-preview">
            {active ? (
              <MealPreview m={active} />
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

function MealPreview({ m }: { m: Meal }) {
  const stat = (value: string | number, label: string) => (
    <div>
      <span className="chat-insight-value">{value}</span>
      <span className="chat-insight-label">{label}</span>
    </div>
  )
  return (
    <div className="pw-preview-body">
      <div className="meal-drawer-hero">
        <Icon name="image" />
      </div>
      <h4 className="meal-drawer-name">{m.name}</h4>
      <div className="pw-chip-row pw-meal-preview-chips">
        <span className="prog-meta-chip">{m.category}</span>
        <span className="prog-meta-chip">{m.servingSize}</span>
        <span className="prog-meta-chip">{m.prepTime}</span>
      </div>
      <div className="meal-drawer-macros">
        {stat(m.calories, 'kcal')}
        {stat(`${m.protein}g`, 'Protein')}
        {stat(`${m.carbs}g`, 'Carbs')}
        {stat(`${m.fat}g`, 'Fat')}
        {stat(`${m.fiber || 0}g`, 'Fiber')}
      </div>
      <div className="drawer-section-head">
        <h4>
          <Icon name="shopping-basket" />
          Ingredients
        </h4>
      </div>
      <ul className="meal-ingredient-list">
        {m.ingredients.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <div className="drawer-section-head">
        <h4>
          <Icon name="list-ordered" />
          Preparation Steps
        </h4>
      </div>
      <ol className="meal-steps-list">
        {m.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  )
}
