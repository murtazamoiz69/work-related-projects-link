import { useEffect, useRef } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { exerciseById } from '@/features/programs'
import { showToast } from '@/lib/toast'
import { exerciseIssues } from '../clinical'
import { pushVersion } from '../plan'
import { workoutDayDate } from '../schedule'
import type { PwCtx } from '../context'
import type { WsWorkout, WsWorkoutDay, WsWorkoutWeek } from '../types'

function WeekRail({ ctx, activeWeek }: { ctx: PwCtx; activeWeek: number }) {
  const railRef = useRef<HTMLDivElement>(null)

  // Land on the Workout Plan tab with the ongoing week already scrolled into
  // view — the rail can run to 13+ weeks, and nobody wants to hunt for the
  // one that's actually in progress.
  useEffect(() => {
    railRef.current
      ?.querySelector('.pw-week-chip.current')
      ?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  return (
    <div className="pw-week-rail" ref={railRef}>
      {ctx.ws.workoutWeeks.map((w) => (
        <button
          key={w.weekNum}
          className={`pw-week-chip${w.weekNum === activeWeek ? ' active' : ''}${w.weekNum === ctx.currentWeek ? ' current' : ''}`}
          onClick={() => ctx.setActiveWeek(w.weekNum)}
        >
          Week {w.weekNum}
        </button>
      ))}
    </div>
  )
}

function SessionCard({
  ctx,
  week,
  day,
  wk,
  wid,
  isPast,
}: {
  ctx: PwCtx
  week: WsWorkoutWeek
  day: WsWorkoutDay
  wk: WsWorkout
  wid: string | null
  isPast: boolean
}) {
  const riskReasons: string[] = []
  wk.exercises.forEach((s) => {
    const ex = exerciseById(s.exerciseId)
    if (ex)
      exerciseIssues(ex, ctx.profile).forEach((i) => {
        if (i.level === 'hard') riskReasons.push(`${ex.name}: ${i.reason}`)
      })
  })
  const risky = riskReasons.length > 0

  const duplicate = () => {
    const w = ctx.ws.workoutWeeks.find((x) => x.weekNum === week.weekNum)
    if (!w) return
    const src = w.days.find((d) => d.dayNum === day.dayNum)
    if (!src) return
    const source = wid
      ? (src.extraWorkouts || []).find((x) => x.uid === wid)
      : src.workout
    if (!source) return
    const rest = w.days.find((d) => d.type === 'rest')
    if (!rest) {
      showToast('No rest day this week to duplicate into')
      return
    }
    rest.type = 'workout'
    const clone = JSON.parse(JSON.stringify(source)) as WsWorkout
    clone.uid = 'wk-' + Math.round(Math.random() * 1e6)
    rest.workout = clone
    pushVersion(
      ctx.ws,
      `Duplicated ${src.label} workout`,
      'Sarah Nolan',
      `Copied into ${rest.label}`,
    )
    ctx.refresh()
  }

  // Removing a session takes training away from a plan the user is following,
  // so it asks first. Adding and editing stay immediate.
  const remove = () => {
    ctx.confirm({
      title: wid ? 'Remove this workout?' : `Clear ${day.label}?`,
      message: wid
        ? `"${wk.name}" will be taken off ${day.label} in Week ${week.weekNum}.`
        : `${day.label} in Week ${week.weekNum} becomes a rest day, and "${wk.name}" is removed.`,
      confirmText: wid ? 'Remove workout' : 'Make it a rest day',
      danger: true,
      onConfirm: applyRemove,
    })
  }

  const applyRemove = () => {
    const d = ctx.ws.workoutWeeks
      .find((x) => x.weekNum === week.weekNum)
      ?.days.find((x) => x.dayNum === day.dayNum)
    if (!d) return
    if (wid) {
      const removed = (d.extraWorkouts || []).find((x) => x.uid === wid)
      d.extraWorkouts = (d.extraWorkouts || []).filter((x) => x.uid !== wid)
      pushVersion(
        ctx.ws,
        'Removed extra workout',
        'Sarah Nolan',
        `${d.label}: ${removed ? removed.name : 'session'} removed`,
      )
    } else {
      d.type = 'rest'
      d.workout = null
      pushVersion(
        ctx.ws,
        `Cleared ${d.label}`,
        'Sarah Nolan',
        'Set as a rest day',
      )
    }
    ctx.refresh()
  }

  return (
    <div
      className={`workout-card${risky ? ' risk' : ''}`}
      title={risky ? riskReasons.join('; ') : undefined}
    >
      <div
        className="workout-card-body"
        onClick={() =>
          isPast
            ? ctx.openModal({
                kind: 'workoutPreview',
                weekNum: week.weekNum,
                dayNum: day.dayNum,
                wid,
              })
            : ctx.openModal({
                kind: 'workoutEditor',
                weekNum: week.weekNum,
                dayNum: day.dayNum,
                wid,
              })
        }
      >
        <span className="workout-card-name">{wk.name}</span>
        <div className="workout-card-meta">
          <span>
            <Icon name="list" />
            {wk.exercises.length} exercises
          </span>
          <span>
            <Icon name="clock" />
            {wk.estimatedMinutes} min
          </span>
        </div>
      </div>
      <div className="workout-card-actions">
        <button
          className="icon-btn sm"
          title="View as user"
          onClick={() =>
            ctx.openModal({
              kind: 'workoutPreview',
              weekNum: week.weekNum,
              dayNum: day.dayNum,
              wid,
            })
          }
        >
          <Icon name="eye" />
        </button>
        {isPast ? null : (
          <>
            <button
              className="icon-btn sm"
              title="Edit"
              onClick={() =>
                ctx.openModal({
                  kind: 'workoutEditor',
                  weekNum: week.weekNum,
                  dayNum: day.dayNum,
                  wid,
                })
              }
            >
              <Icon name="pencil" />
            </button>
            <button
              className="icon-btn sm"
              title="Duplicate to a rest day"
              onClick={duplicate}
            >
              <Icon name="copy" />
            </button>
            <button
              className="icon-btn sm danger"
              title={wid ? 'Remove' : 'Clear (make rest day)'}
              onClick={remove}
            >
              <Icon name="trash-2" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function DayRow({
  ctx,
  week,
  day,
  isPast,
}: {
  ctx: PwCtx
  week: WsWorkoutWeek
  day: WsWorkoutDay
  isPast: boolean
}) {
  const extras = day.extraWorkouts || []
  const hasAny = !!day.workout || extras.length > 0
  return (
    <div className="diet-day-card">
      <div className="diet-day-head">
        <span className="diet-day-label">
          {day.label}{' '}
          <span className="pw-day-label-date">
            {workoutDayDate(ctx.profile.programStart, week.weekNum, day.dayNum)}
          </span>
        </span>
        <div className="diet-day-head-right">
          {isPast ? null : (
            <button
              className="link-btn"
              onClick={() =>
                ctx.openModal({
                  kind: 'workoutTemplatePicker',
                  weekNum: week.weekNum,
                  dayNum: day.dayNum,
                })
              }
            >
              <Icon name="plus" />
              Add workout
            </button>
          )}
        </div>
      </div>
      <div className="wk-day-sessions">
        {hasAny ? (
          <>
            {day.workout ? (
              <SessionCard
                ctx={ctx}
                week={week}
                day={day}
                wk={day.workout}
                wid={null}
                isPast={isPast}
              />
            ) : null}
            {extras.map((wk) => (
              <SessionCard
                key={wk.uid}
                ctx={ctx}
                week={week}
                day={day}
                wk={wk}
                wid={wk.uid}
                isPast={isPast}
              />
            ))}
          </>
        ) : (
          <p className="pw-muted">
            {isPast ? 'Rest day.' : 'Rest day — add a workout to schedule one.'}
          </p>
        )}
      </div>
    </div>
  )
}

export function WorkoutTab({ ctx }: { ctx: PwCtx }) {
  const week = ctx.ws.workoutWeeks.find((w) => w.weekNum === ctx.activeWeek)
  const isPast = ctx.activeWeek < ctx.currentWeek
  return (
    <>
      <WeekRail ctx={ctx} activeWeek={ctx.activeWeek} />
      <div className="pw-week-detail">
        <div className="pw-week-detail-head">
          <span className="pw-week-detail-title">
            Week {ctx.activeWeek}
            {ctx.activeWeek === ctx.currentWeek ? (
              <span className="pw-current-tag">Current</span>
            ) : null}
          </span>
          <span className="pw-week-detail-meta">
            {week ? week.days.filter((d) => d.type === 'workout').length : 0}{' '}
            training days
          </span>
        </div>
        <div className="pw-day-list">
          {week
            ? week.days.map((d) => (
                <DayRow
                  key={d.dayNum}
                  ctx={ctx}
                  week={week}
                  day={d}
                  isPast={isPast}
                />
              ))
            : null}
        </div>
      </div>
    </>
  )
}
