import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import { dietDayTotals, formatTime12, mealById, newMealEntry } from '../../data'
import type {
  DietDay,
  Meal,
  MealEntry,
  NutritionTargets,
  TrainingProgram,
} from '../../types'
import { WeekRail } from './atoms'
import { resolveActiveWeek } from './weekUtils'
import { MealPickerModal } from './MealPickerModal'

type PickerTarget = { dayNum: number; entryUid: string | null }

const NUTRITION_FIELDS: Array<{ key: keyof NutritionTargets; label: string }> =
  [
    { key: 'calories', label: 'Daily Calories' },
    { key: 'protein', label: 'Protein (g)' },
    { key: 'carbs', label: 'Carbs (g)' },
    { key: 'fat', label: 'Fat (g)' },
    { key: 'water', label: 'Water (L)' },
  ]

export function DietPlanTab({
  program: p,
  activeWeek,
  setActiveWeek,
  flashSaved,
}: {
  program: TrainingProgram
  activeWeek: number
  setActiveWeek: (n: number) => void
  flashSaved: () => void
}) {
  const [picker, setPicker] = useState<PickerTarget | null>(null)

  const resolvedWeek = resolveActiveWeek(p.dietWeeks, activeWeek)
  const week = p.dietWeeks.find((w) => w.weekNum === resolvedWeek)

  const setTarget = (key: keyof NutritionTargets, value: string) => {
    p.nutritionTargets[key] = parseInt(value, 10) || 0
    flashSaved()
  }

  const handleMealAction = (
    action: 'edit' | 'duplicate' | 'delete',
    dayNum: number,
    entryUid: string,
  ) => {
    if (!week) return
    const day = week.days.find((d) => d.dayNum === dayNum)
    if (!day) return
    if (action === 'edit') {
      setPicker({ dayNum, entryUid })
      return
    }
    if (action === 'delete') {
      const entry = day.meals.find((e) => e.uid === entryUid)
      const meal = entry ? mealById(entry.mealId) : null
      day.meals = day.meals.filter((e) => e.uid !== entryUid)
      flashSaved()
      showToast(meal ? `${meal.name} removed` : 'Meal removed')
      return
    }
    if (action === 'duplicate') {
      const entry = day.meals.find((e) => e.uid === entryUid)
      if (!entry) return
      const idx = week.days.findIndex((d) => d.dayNum === dayNum)
      const nextDay = week.days[(idx + 1) % week.days.length]
      nextDay.meals.push(newMealEntry(entry.mealId, entry.slot, entry.time))
      flashSaved()
      showToast(`Duplicated to ${nextDay.label}`)
    }
  }

  const commitPicker = (meal: Meal, time: string) => {
    if (!picker || !week) return
    const day = week.days.find((d) => d.dayNum === picker.dayNum)
    if (!day) return
    const entry = picker.entryUid
      ? day.meals.find((e) => e.uid === picker.entryUid)
      : null
    if (entry) {
      entry.mealId = meal.id
      entry.slot = meal.category
      entry.time = time
      showToast(`Swapped to ${meal.name}`)
    } else {
      day.meals.push(newMealEntry(meal.id, meal.category, time))
      showToast(`${meal.name} added to ${day.label}`)
    }
    setPicker(null)
    flashSaved()
  }

  const pickerEntry: MealEntry | null =
    picker && picker.entryUid && week
      ? (week.days
          .find((d) => d.dayNum === picker.dayNum)
          ?.meals.find((e) => e.uid === picker.entryUid) ?? null)
      : null
  const pickerDay =
    picker && week ? week.days.find((d) => d.dayNum === picker.dayNum) : null

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Nutrition Summary</h2>
            <p className="panel-sub">
              Daily targets for every client on this program
            </p>
          </div>
        </div>
        <div className="nutrition-summary-grid">
          {NUTRITION_FIELDS.map((f) => (
            <label className="modal-field" key={f.key}>
              <span>{f.label}</span>
              <input
                type="number"
                value={p.nutritionTargets[f.key]}
                onChange={(e) => setTarget(f.key, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Diet Plan</h2>
            <p className="panel-sub">
              Organized by week — add, swap, or remove meals for each day
            </p>
          </div>
        </div>
        <WeekRail
          weeks={p.dietWeeks}
          activeWeek={resolvedWeek}
          onSelect={setActiveWeek}
        />
        <div className="prog-week-detail">
          <div className="prog-week-detail-head">
            <span className="pw-week-detail-title">Week {resolvedWeek}</span>
          </div>
          <div className="diet-day-list">
            {week
              ? week.days.map((day) => (
                  <DietDayCard
                    key={day.dayNum}
                    day={day}
                    onAddMeal={() =>
                      setPicker({ dayNum: day.dayNum, entryUid: null })
                    }
                    onMealAction={handleMealAction}
                  />
                ))
              : null}
          </div>
        </div>
      </div>

      {picker && pickerDay ? (
        <MealPickerModal
          weekNum={resolvedWeek}
          dayLabel={pickerDay.label}
          entry={pickerEntry}
          onCommit={commitPicker}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </>
  )
}

function DietDayCard({
  day,
  onAddMeal,
  onMealAction,
}: {
  day: DietDay
  onAddMeal: () => void
  onMealAction: (
    action: 'edit' | 'duplicate' | 'delete',
    dayNum: number,
    entryUid: string,
  ) => void
}) {
  const totals = dietDayTotals(day)
  const sorted = day.meals.slice().sort((a, b) => a.time.localeCompare(b.time))
  return (
    <div className="diet-day-card">
      <div className="diet-day-head">
        <span className="diet-day-label">{day.label}</span>
        <div className="diet-day-head-right">
          <span className="diet-day-totals">
            {totals.calories} kcal · P{totals.protein}g · C{totals.carbs}g · F
            {totals.fat}g
          </span>
          <button className="link-btn" onClick={onAddMeal}>
            <Icon name="plus" />
            Add meal
          </button>
        </div>
      </div>
      <div className="diet-meal-row">
        {sorted.length ? (
          sorted.map((entry) => {
            const meal = mealById(entry.mealId)
            if (!meal) return null
            return (
              <div className="meal-card" key={entry.uid}>
                <span className="meal-card-slot">
                  <span>{entry.slot}</span>
                  <span className="meal-card-time">
                    {formatTime12(entry.time)}
                  </span>
                </span>
                <span className="meal-card-thumb">
                  <Icon name="utensils" />
                </span>
                <span className="meal-card-name">{meal.name}</span>
                <span className="meal-card-macros">
                  {meal.calories} kcal · P{meal.protein} C{meal.carbs} F
                  {meal.fat}
                </span>
                <div className="meal-card-actions">
                  <button
                    className="icon-btn sm"
                    title="View / Swap"
                    onClick={() => onMealAction('edit', day.dayNum, entry.uid)}
                  >
                    <Icon name="pencil" />
                  </button>
                  <button
                    className="icon-btn sm"
                    title="Duplicate to tomorrow"
                    onClick={() =>
                      onMealAction('duplicate', day.dayNum, entry.uid)
                    }
                  >
                    <Icon name="copy" />
                  </button>
                  <button
                    className="icon-btn sm danger"
                    title="Remove"
                    onClick={() =>
                      onMealAction('delete', day.dayNum, entry.uid)
                    }
                  >
                    <Icon name="trash-2" />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <p className="pw-muted">No meals yet — add one.</p>
        )}
      </div>
    </div>
  )
}
