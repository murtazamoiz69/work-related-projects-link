import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import { mealConflicts } from '../clinical'
import { formatTime12, pushVersion, resolveMeal, wsDailyTotals } from '../plan'
import { getDietDay } from '../context'
import type { PwCtx } from '../context'
import type { MealEntry } from '@/features/programs'
import type { WsDietDay } from '../types'

function MealCard({
  ctx,
  weekNum,
  day,
  entry,
}: {
  ctx: PwCtx
  weekNum: number
  day: WsDietDay
  entry: MealEntry
}) {
  const meal = resolveMeal(ctx.ws, entry.mealId)
  if (!meal) return null
  const conflicts = mealConflicts(meal, ctx.profile)
  const risky = conflicts.some((c) => c.level === 'hard')

  const clear = () => {
    const dietDay = getDietDay(ctx.ws, weekNum, day.dayNum)
    if (!dietDay) return
    dietDay.meals = dietDay.meals.filter((e) => e.uid !== entry.uid)
    pushVersion(
      ctx.ws,
      `Removed ${entry.slot}`,
      'Sarah Nolan',
      `Wk${weekNum} ${day.label}: ${meal.name} removed`,
    )
    ctx.refresh()
    showToast('Meal removed')
  }

  return (
    <div
      className={`meal-card${risky ? ' risk' : ''}`}
      title="View & swap"
      onClick={() =>
        ctx.openModal({
          kind: 'mealPicker',
          weekNum,
          dayNum: day.dayNum,
          entryUid: entry.uid,
          enforceUpcoming: false,
        })
      }
    >
      <span className="meal-card-slot">
        <span>
          {entry.slot}
          {conflicts.length ? (
            <span
              className="meal-card-flag"
              title={`${conflicts.map((c) => c.reason).join('; ')} — info only, not restricted`}
            >
              <Icon name="alert-triangle" size={11} />
            </span>
          ) : null}
        </span>
        <span className="meal-card-time">{formatTime12(entry.time)}</span>
      </span>
      <span className="meal-card-thumb">
        <Icon name="utensils" />
      </span>
      <span className="meal-card-name">{meal.name}</span>
      <span className="meal-card-macros">
        {meal.calories} kcal · P{meal.protein} C{meal.carbs} F{meal.fat}
      </span>
      <div className="meal-card-actions">
        <button
          className="icon-btn sm danger"
          title="Remove meal"
          onClick={(e) => {
            e.stopPropagation()
            clear()
          }}
        >
          <Icon name="trash-2" />
        </button>
      </div>
    </div>
  )
}

function DayRow({
  ctx,
  weekNum,
  day,
}: {
  ctx: PwCtx
  weekNum: number
  day: WsDietDay
}) {
  const totals = wsDailyTotals(ctx.ws, day)
  const sorted = day.meals.slice().sort((a, b) => a.time.localeCompare(b.time))
  return (
    <div className="diet-day-card">
      <div className="diet-day-head">
        <span className="diet-day-label">
          {day.label}
          {day.cheat ? <span className="pw-cheat-tag">Refeed</span> : null}
        </span>
        <div className="diet-day-head-right">
          <span className="diet-day-totals">
            {totals.calories} kcal · P{totals.protein}g · C{totals.carbs}g · F
            {totals.fat}g
          </span>
          <button
            className="link-btn"
            onClick={() =>
              ctx.openModal({
                kind: 'mealPicker',
                weekNum,
                dayNum: day.dayNum,
                entryUid: null,
                enforceUpcoming: false,
              })
            }
          >
            <Icon name="plus" />
            Add meal
          </button>
        </div>
      </div>
      <div className="diet-meal-row pw-diet-meal-row">
        {sorted.length ? (
          sorted.map((e) => (
            <MealCard
              key={e.uid}
              ctx={ctx}
              weekNum={weekNum}
              day={day}
              entry={e}
            />
          ))
        ) : (
          <p className="pw-muted">No meals yet — add one.</p>
        )}
      </div>
    </div>
  )
}

export function DietTab({ ctx }: { ctx: PwCtx }) {
  const week = ctx.ws.dietWeeks.find((w) => w.weekNum === ctx.activeWeek)
  return (
    <>
      <div className="pw-week-rail">
        {ctx.ws.dietWeeks.map((w) => (
          <button
            key={w.weekNum}
            className={`pw-week-chip${w.weekNum === ctx.activeWeek ? ' active' : ''}${w.weekNum === ctx.currentWeek ? ' current' : ''}`}
            onClick={() => ctx.setActiveWeek(w.weekNum)}
          >
            Week {w.weekNum}
          </button>
        ))}
      </div>
      <div className="pw-week-detail">
        <div className="pw-week-detail-head">
          <span className="pw-week-detail-title">
            Week {ctx.activeWeek}
            {ctx.activeWeek === ctx.currentWeek ? (
              <span className="pw-current-tag">Current</span>
            ) : null}
          </span>
        </div>
        <div className="pw-day-list">
          {week
            ? week.days.map((d) => (
                <DayRow
                  key={d.dayNum}
                  ctx={ctx}
                  weekNum={ctx.activeWeek}
                  day={d}
                />
              ))
            : null}
        </div>
      </div>
    </>
  )
}
