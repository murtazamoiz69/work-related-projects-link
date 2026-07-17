import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Avatar } from '@/components/atoms/Avatar'
import { formatCheckIn } from '@/features/clients'
import { dietDayTotals } from '../../data'
import type {
  DietWeek,
  ProgramNote,
  TrainingProgram,
  WorkoutWeek,
} from '../../types'
import { OvStatCard } from './atoms'

const MUSCLE_TONE: Record<string, string> = {
  Push: 'push',
  Pull: 'pull',
  Legs: 'legs',
  Core: 'core',
  'Full Body': 'fullbody',
  Cardio: 'cardio',
}
const MUSCLE_CHIP_LABEL: Record<string, string> = {
  Push: 'Push',
  Pull: 'Pull',
  Legs: 'Legs',
  Core: 'Core',
  'Full Body': 'Full',
  Cardio: 'Cardio',
}

function TrainingLegend() {
  return (
    <div className="ov-legend">
      {Object.keys(MUSCLE_TONE).map((m) => (
        <span className="ov-legend-item" key={m}>
          <span className={`ov-legend-dot tone-${MUSCLE_TONE[m]}`} />
          {m}
        </span>
      ))}
      <span className="ov-legend-item">
        <span className="ov-legend-dot is-rest" />
        Rest
      </span>
    </div>
  )
}

function TrainingWeekRow({ w }: { w: WorkoutWeek }) {
  return (
    <div className="ov-week-row">
      <span className="ov-week-num">
        Wk {w.weekNum}
        {w.isDeload ? <span className="ov-deload-tag">Deload</span> : null}
      </span>
      <span className="ov-week-days">
        {w.days.map((d) => {
          const tone = d.workout ? MUSCLE_TONE[d.workout.muscle] : null
          const chipLabel = d.workout
            ? MUSCLE_CHIP_LABEL[d.workout.muscle]
            : 'Rest'
          const detail = d.workout
            ? `${d.label}: ${d.workout.name}`
            : `${d.label}: Rest day`
          return (
            <span
              key={d.dayNum}
              className={`ov-day-chip${tone ? ` tone-${tone}` : ' is-rest'}`}
              title={detail}
            >
              {chipLabel}
            </span>
          )
        })}
      </span>
    </div>
  )
}

function dietWeekAverages(week: DietWeek) {
  const totals = week.days.map((d) => dietDayTotals(d))
  const n = totals.length || 1
  const avg = (key: 'calories' | 'protein' | 'carbs' | 'fat') =>
    Math.round(totals.reduce((sum, t) => sum + t[key], 0) / n)
  return {
    calories: avg('calories'),
    protein: avg('protein'),
    carbs: avg('carbs'),
    fat: avg('fat'),
  }
}

function DietWeekRow({ w }: { w: DietWeek }) {
  const avg = dietWeekAverages(w)
  const pCal = avg.protein * 4
  const cCal = avg.carbs * 4
  const fCal = avg.fat * 9
  const total = pCal + cCal + fCal || 1
  const pPct = Math.round((pCal / total) * 100)
  const cPct = Math.round((cCal / total) * 100)
  const fPct = Math.max(0, 100 - pPct - cPct)
  const detail = `Protein ${avg.protein}g · Carbs ${avg.carbs}g · Fat ${avg.fat}g`
  return (
    <div className="ov-week-row">
      <span className="ov-week-num">Wk {w.weekNum}</span>
      <span className="ov-diet-kcal">
        {avg.calories}
        <small>kcal</small>
      </span>
      <div className="ov-macro-col">
        <div className="ov-macro-bar" title={detail}>
          <span
            className="ov-macro-seg tone-protein"
            style={{ width: `${pPct}%` }}
          />
          <span
            className="ov-macro-seg tone-carbs"
            style={{ width: `${cPct}%` }}
          />
          <span
            className="ov-macro-seg tone-fat"
            style={{ width: `${fPct}%` }}
          />
        </div>
        <span className="ov-macro-text">
          P {avg.protein}g · C {avg.carbs}g · F {avg.fat}g
        </span>
      </div>
    </div>
  )
}

function ProgramNoteItem({ n }: { n: ProgramNote }) {
  const initials = n.author
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <li className="note-item">
      <Avatar initials={initials} color="#2F5D50" size="xs" />
      <div className="note-body">
        <div className="note-meta">
          <span className="note-author">{n.author}</span>
          <span className="note-time">{formatCheckIn(n.days)}</span>
        </div>
        <p className="note-text">{n.text}</p>
      </div>
    </li>
  )
}

export function OverviewTab({
  program: p,
  flashSaved,
}: {
  program: TrainingProgram
  flashSaved: () => void
}) {
  const [noteInput, setNoteInput] = useState('')

  const totalWorkouts = p.workoutWeeks.reduce(
    (a, w) => a + w.days.filter((d) => d.type === 'workout').length,
    0,
  )
  const allDietDays = p.dietWeeks.flatMap((w) => w.days)
  const totalMeals = Math.round(
    allDietDays.reduce((a, d) => a + d.meals.length, 0) / p.dietWeeks.length,
  )
  const avgCalories = Math.round(
    allDietDays.reduce((a, d) => a + dietDayTotals(d).calories, 0) /
      allDietDays.length,
  )
  const allWorkouts = p.workoutWeeks.flatMap((w) =>
    w.days.filter((d) => d.workout).map((d) => d.workout),
  )
  const avgWorkoutTime = allWorkouts.length
    ? Math.round(
        allWorkouts.reduce((a, w) => a + (w ? w.estimatedMinutes : 0), 0) /
          allWorkouts.length,
      )
    : 0

  const addNote = () => {
    const text = noteInput.trim()
    if (!text) return
    p.notes.unshift({ author: 'Sarah Nolan', text, days: 0 })
    setNoteInput('')
    flashSaved()
  }

  return (
    <>
      <div className="ov-summary-grid">
        <OvStatCard
          icon="calendar-range"
          value={p.durationWeeks}
          label="Weeks"
          tooltip="Total length of this program from start to finish."
        />
        <OvStatCard
          icon="dumbbell"
          value={totalWorkouts}
          label="Total Workouts"
          tooltip="Every workout scheduled across all weeks of the Workout Plan tab."
        />
        <OvStatCard
          icon="utensils"
          value={totalMeals}
          label="Meals / Week"
          tooltip="Breakfast, lunch, snack, and dinner across the 7-day Diet Plan pattern."
        />
        <OvStatCard
          icon="flame"
          value={avgCalories}
          label="Avg Daily Calories"
          tooltip="Average of each day's total calories in the current Diet Plan."
        />
        <OvStatCard
          icon="clock"
          value={`${avgWorkoutTime}m`}
          label="Avg Workout Time"
          tooltip="Average estimated duration across all scheduled workouts."
        />
        <OvStatCard
          icon="users"
          value={p.members.length}
          label="Assigned Users"
          tooltip="Clients currently assigned to this program, active or paused."
        />
        <OvStatCard
          icon="check-circle-2"
          value={`${p.completionRate}%`}
          label="Completion"
          tooltip="Average progress percentage across this program's assigned members."
        />
      </div>

      <div className="split-row split-row-alt ov-split">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Training Breakdown</h2>
              <p className="panel-sub">Workout type by day, week by week</p>
            </div>
          </div>
          <TrainingLegend />
          <div className="panel-scroll-body">
            {p.workoutWeeks.map((w) => (
              <TrainingWeekRow key={w.weekNum} w={w} />
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Diet Breakdown</h2>
              <p className="panel-sub">
                Avg daily calories & macro split, week by week
              </p>
            </div>
          </div>
          <div className="ov-legend">
            <span className="ov-legend-item">
              <span className="ov-legend-dot tone-protein" />
              Protein
            </span>
            <span className="ov-legend-item">
              <span className="ov-legend-dot tone-carbs" />
              Carbs
            </span>
            <span className="ov-legend-item">
              <span className="ov-legend-dot tone-fat" />
              Fat
            </span>
          </div>
          <div className="panel-scroll-body">
            {p.dietWeeks.map((w) => (
              <DietWeekRow key={w.weekNum} w={w} />
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent Activity</h2>
          </div>
        </div>
        <div className="panel-scroll-body">
          <ul className="timeline">
            {p.activity.length ? (
              p.activity.map((a, i) => (
                <li className="timeline-item" key={i}>
                  <span
                    className="avatar avatar-xs"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Icon name="activity" />
                  </span>
                  <div className="timeline-body">
                    <p>{a.text}</p>
                    <span className="timeline-time">
                      {formatCheckIn(a.days)}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <div className="checklist-rest">
                <Icon name="inbox" />
                <span>No activity yet</span>
              </div>
            )}
          </ul>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Program Notes</h2>
            <p className="panel-sub">
              Visible to any coach collaborating on this program
            </p>
          </div>
        </div>
        <ul className="notes-list">
          {p.notes.map((n, i) => (
            <ProgramNoteItem key={i} n={n} />
          ))}
        </ul>
        <div className="notes-add-row">
          <textarea
            className="notes-input"
            rows={2}
            placeholder="Add a program note…"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
          />
          <button className="btn-secondary" onClick={addNote}>
            Add
          </button>
        </div>
      </div>
    </>
  )
}
