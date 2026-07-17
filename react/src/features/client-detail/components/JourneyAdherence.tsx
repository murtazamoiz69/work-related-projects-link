import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import type { ChecklistItem, Program, ProgramWeek } from '../types'
import { MEAL_ITEMS_BASE, WORKOUT_ITEMS, checklistDoneCount } from '../data'
import { MiniBar } from './atoms'

function Checklist({ pct, items }: { pct: number | null; items: ChecklistItem[] }) {
  const doneCount = checklistDoneCount(pct, items.length)
  return (
    <ul className="checklist">
      {items.map((it, i) => {
        const done = i < doneCount
        return (
          <li className={`checklist-item ${done ? 'done' : 'pending'}`} key={it.name}>
            <Icon name={done ? 'check-circle-2' : 'circle'} />
            <div>
              <span className="checklist-name">{it.name}</span>
              {it.detail ? <span className="checklist-detail">{it.detail}</span> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function AdherenceRow({ w }: { w: ProgramWeek }) {
  const [open, setOpen] = useState(false)
  const clickable = w.submitted
  return (
    <li className={`adh-row${clickable ? '' : ' is-muted'}${open ? ' is-open' : ''}`}>
      <div
        className="adh-row-head"
        onClick={clickable ? () => setOpen((o) => !o) : undefined}
      >
        <span className="adh-week">Week {w.week}</span>
        <div className="adh-bars">
          <MiniBar pct={w.dietPct} kind="Diet" />
          <MiniBar pct={w.workoutPct} kind="Workout" />
        </div>
        {clickable ? (
          <Icon name="chevron-down" className="adh-chev" />
        ) : (
          <span className="adh-week-status">
            {w.status === 'current'
              ? 'This week'
              : w.status === 'upcoming'
                ? 'Upcoming'
                : 'Missed'}
          </span>
        )}
      </div>
      <div className="adh-detail" hidden={!open}>
        {open ? (
          <div className="adh-detail-grid">
            <div>
              <span className="adh-detail-title">
                <Icon name="utensils" /> Diet · {w.dietPct}%
              </span>
              <Checklist pct={w.dietPct} items={MEAL_ITEMS_BASE} />
            </div>
            <div>
              <span className="adh-detail-title">
                <Icon name="dumbbell" /> Workout · {w.workoutPct}%
              </span>
              <Checklist pct={w.workoutPct} items={WORKOUT_ITEMS} />
            </div>
          </div>
        ) : null}
      </div>
    </li>
  )
}

/** Adherence sub-tab: weekly diet & workout bars; open a week for the checklist. */
export function JourneyAdherence({ program }: { program: Program }) {
  return (
    <>
      <p className="journey-tab-sub">
        Weekly diet &amp; workout adherence for this program — open a week to see what
        made up the %.
      </p>
      <ul className="adherence-strip">
        {program.weeks.map((w) => (
          <AdherenceRow w={w} key={w.week} />
        ))}
      </ul>
    </>
  )
}
