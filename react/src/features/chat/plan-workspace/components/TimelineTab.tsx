import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatTime12, pushVersion, resolveMeal } from '../plan'
import {
  isDayInPast,
  isUpcoming,
  todayWeekDay,
  workoutDayDate,
} from '../schedule'
import { getDietDay } from '../context'
import type { PwCtx } from '../context'
import type { WsWorkoutDay, WsWorkoutWeek } from '../types'

type TimelineItem = {
  kind: 'workout' | 'extraWorkout' | 'meal'
  time: string
  title: string
  meta: string
  icon: string
  id?: string
  slot?: string
}

function itemsForDay(ctx: PwCtx, d: WsWorkoutDay): TimelineItem[] {
  const items: TimelineItem[] = []
  if (d.workout) {
    items.push({
      kind: 'workout',
      time: d.workout.time || '07:00',
      title: d.workout.name,
      meta: `${d.workout.exercises.length} exercises · ${d.workout.estimatedMinutes} min`,
      icon: 'dumbbell',
    })
  }
  ;(d.extraWorkouts || []).forEach((wk) => {
    items.push({
      kind: 'extraWorkout',
      id: wk.uid,
      time: wk.time || '07:00',
      title: wk.name,
      meta: `${wk.exercises.length} exercises · ${wk.estimatedMinutes} min`,
      icon: 'dumbbell',
    })
  })
  const dietDay = getDietDay(ctx.ws, ctx.activeWeek, d.dayNum)
  if (dietDay) {
    dietDay.meals.forEach((entry) => {
      const meal = resolveMeal(ctx.ws, entry.mealId)
      if (!meal) return
      items.push({
        kind: 'meal',
        id: entry.uid,
        slot: entry.slot,
        time: entry.time,
        title: meal.name,
        meta: `${entry.slot} · ${meal.calories} kcal`,
        icon: 'utensils',
      })
    })
  }
  items.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  return items
}

function ItemActions({
  ctx,
  week,
  d,
  item,
}: {
  ctx: PwCtx
  week: WsWorkoutWeek
  d: WsWorkoutDay
  item: TimelineItem
}) {
  if (item.kind === 'workout') {
    return (
      <>
        <button
          className="icon-btn xs"
          title="Edit workout"
          onClick={() =>
            ctx.openModal({
              kind: 'workoutEditor',
              weekNum: week.weekNum,
              dayNum: d.dayNum,
              wid: null,
            })
          }
        >
          <Icon name="pencil" />
        </button>
        <button
          className="icon-btn xs"
          title="View as client"
          onClick={() =>
            ctx.openModal({
              kind: 'workoutPreview',
              weekNum: week.weekNum,
              dayNum: d.dayNum,
              wid: null,
            })
          }
        >
          <Icon name="eye" />
        </button>
      </>
    )
  }
  if (item.kind === 'extraWorkout') {
    const removeExtra = () => {
      const day = ctx.ws.workoutWeeks
        .find((w) => w.weekNum === week.weekNum)
        ?.days.find((x) => x.dayNum === d.dayNum)
      if (!day) return
      const removed = (day.extraWorkouts || []).find((x) => x.uid === item.id)
      day.extraWorkouts = (day.extraWorkouts || []).filter(
        (x) => x.uid !== item.id,
      )
      pushVersion(
        ctx.ws,
        'Removed extra workout',
        'Sarah Nolan',
        `${day.label}: ${removed ? removed.name : 'session'} removed`,
      )
      ctx.refresh()
    }
    return (
      <>
        <button
          className="icon-btn xs"
          title="Edit workout"
          onClick={() =>
            ctx.openModal({
              kind: 'workoutEditor',
              weekNum: week.weekNum,
              dayNum: d.dayNum,
              wid: item.id ?? null,
            })
          }
        >
          <Icon name="pencil" />
        </button>
        <button
          className="icon-btn xs"
          title="View"
          onClick={() =>
            ctx.openModal({
              kind: 'workoutPreview',
              weekNum: week.weekNum,
              dayNum: d.dayNum,
              wid: item.id ?? null,
            })
          }
        >
          <Icon name="eye" />
        </button>
        <button
          className="icon-btn xs danger"
          title="Remove"
          onClick={removeExtra}
        >
          <Icon name="trash-2" />
        </button>
      </>
    )
  }
  const removeMeal = () => {
    const dietDay = getDietDay(ctx.ws, week.weekNum, d.dayNum)
    if (!dietDay) return
    const removed = dietDay.meals.find((e) => e.uid === item.id)
    const meal = removed ? resolveMeal(ctx.ws, removed.mealId) : null
    dietDay.meals = dietDay.meals.filter((e) => e.uid !== item.id)
    pushVersion(
      ctx.ws,
      `Removed ${removed ? removed.slot : 'meal'}`,
      'Sarah Nolan',
      `Wk${week.weekNum} ${d.label}: ${meal ? meal.name : 'meal'} removed`,
    )
    ctx.refresh()
  }
  return (
    <>
      <button
        className="icon-btn xs"
        title="View & swap meal"
        onClick={() =>
          ctx.openModal({
            kind: 'mealPicker',
            weekNum: week.weekNum,
            dayNum: d.dayNum,
            entryUid: item.id ?? null,
            enforceUpcoming: true,
          })
        }
      >
        <Icon name="repeat" />
      </button>
      <button
        className="icon-btn xs danger"
        title="Remove meal"
        onClick={removeMeal}
      >
        <Icon name="trash-2" />
      </button>
    </>
  )
}

function ItemRow({
  ctx,
  week,
  d,
  item,
}: {
  ctx: PwCtx
  week: WsWorkoutWeek
  d: WsWorkoutDay
  item: TimelineItem
}) {
  const upcoming = isUpcoming(
    ctx.profile.programStart,
    week.weekNum,
    d.dayNum,
    item.time,
  )
  return (
    <div className={`pw-tl-item${upcoming ? '' : ' done'}`}>
      {upcoming ? (
        <button
          className="pw-tl-time editable"
          title="Change time"
          onClick={() =>
            ctx.openModal({
              kind: 'timelineTimeEdit',
              itemKind: item.kind,
              weekNum: week.weekNum,
              dayNum: d.dayNum,
              itemId: item.id ?? null,
            })
          }
        >
          {formatTime12(item.time)}
          <Icon name="pencil" />
        </button>
      ) : (
        <span className="pw-tl-time">{formatTime12(item.time)}</span>
      )}
      <span className="pw-tl-item-icon">
        <Icon name={item.icon} />
      </span>
      <div className="pw-tl-item-body">
        <span className="pw-tl-item-title">{item.title}</span>
        <span className="pw-tl-item-meta">{item.meta}</span>
      </div>
      {upcoming ? (
        <span className="pw-tl-badge upcoming">
          <Icon name="clock" />
          Upcoming
        </span>
      ) : (
        <span className="pw-tl-badge completed">
          <Icon name="check" />
          Completed
        </span>
      )}
      <div className="pw-tl-item-actions">
        {upcoming ? (
          <ItemActions ctx={ctx} week={week} d={d} item={item} />
        ) : null}
      </div>
    </div>
  )
}

function DayCard({
  ctx,
  week,
  d,
  today,
  todayRef,
}: {
  ctx: PwCtx
  week: WsWorkoutWeek
  d: WsWorkoutDay
  today: { weekNum: number; dayNum: number }
  todayRef: React.MutableRefObject<HTMLDivElement | null>
}) {
  const items = itemsForDay(ctx, d)
  const isToday = week.weekNum === today.weekNum && d.dayNum === today.dayNum
  const addable = !isDayInPast(ctx.profile.programStart, week.weekNum, d.dayNum)
  return (
    <div
      className={`pw-tl-day${isToday ? ' is-today' : ''}`}
      ref={(el) => {
        if (isToday) todayRef.current = el
      }}
    >
      <div className="pw-tl-day-head">
        <span className="pw-tl-day-label">
          {d.label}
          {isToday ? <span className="pw-current-tag">Today</span> : null}
        </span>
        <span className="pw-tl-day-date">
          {workoutDayDate(ctx.profile.programStart, week.weekNum, d.dayNum)}
        </span>
        {addable ? (
          <button
            className="link-btn pw-tl-add"
            onClick={() =>
              ctx.openModal({
                kind: 'timelineAddChooser',
                weekNum: week.weekNum,
                dayNum: d.dayNum,
              })
            }
          >
            <Icon name="plus" />
            Add
          </button>
        ) : null}
      </div>
      <div className="pw-tl-item-list">
        {items.length ? (
          items.map((it, idx) => (
            <ItemRow
              key={`${it.kind}-${it.id ?? idx}`}
              ctx={ctx}
              week={week}
              d={d}
              item={it}
            />
          ))
        ) : addable ? (
          <div
            className="pw-tl-empty"
            onClick={() =>
              ctx.openModal({
                kind: 'timelineAddChooser',
                weekNum: week.weekNum,
                dayNum: d.dayNum,
              })
            }
          >
            <Icon name="calendar-x" />
            Nothing scheduled — click to add
          </div>
        ) : (
          <div className="pw-tl-empty">
            <Icon name="calendar-x" />
            Nothing scheduled
          </div>
        )}
      </div>
    </div>
  )
}

export function TimelineTab({ ctx }: { ctx: PwCtx }) {
  const week = ctx.ws.workoutWeeks.find((w) => w.weekNum === ctx.activeWeek)
  const today = todayWeekDay(ctx.profile, ctx.ws)
  const listRef = useRef<HTMLDivElement | null>(null)
  const todayRef = useRef<HTMLDivElement | null>(null)
  const [showJump, setShowJump] = useState(false)

  useEffect(() => {
    const todayCard = todayRef.current
    const list = listRef.current
    if (!list) return
    if (!todayCard) {
      setShowJump(true)
      return
    }
    setShowJump(false)
    todayCard.scrollIntoView({ block: 'start', behavior: 'smooth' })
    const observer = new IntersectionObserver(
      (entries) => setShowJump(!entries[0].isIntersecting),
      { root: list, threshold: 0.6 },
    )
    observer.observe(todayCard)
    return () => observer.disconnect()
  }, [ctx.activeWeek, ctx.ws])

  return (
    <>
      <div className="pw-week-rail">
        {ctx.ws.workoutWeeks.map((w) => (
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
          {showJump ? (
            <button
              className="link-btn pw-tl-jump"
              onClick={() => ctx.setActiveWeek(today.weekNum)}
            >
              <Icon name="calendar-check" />
              Jump to today
            </button>
          ) : null}
        </div>
        <div className="pw-tl-day-list" ref={listRef}>
          {week
            ? week.days.map((d) => (
                <DayCard
                  key={d.dayNum}
                  ctx={ctx}
                  week={week}
                  d={d}
                  today={today}
                  todayRef={todayRef}
                />
              ))
            : null}
        </div>
      </div>
    </>
  )
}
