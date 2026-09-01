import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatJoinDate } from '@/features/clients'
import type { Program, ProgramWeek } from '../types'
import {
  JT_STATUS,
  deltaTone,
  jtCurrentWeek,
  weekChipDateRangeLabel,
} from '../data'
import { MiniBar, PhotoTriplet } from './atoms'

function WeekCard({ w, p }: { w: ProgramWeek; p: Program }) {
  const meta = JT_STATUS[w.status]
  const dateStr = formatJoinDate(w.date)
  const firstWaist = p.weeks[0].measurements
    ? p.weeks[0].measurements.waist
    : (w.measurements?.waist ?? 0)
  const waistTone = w.measurements
    ? deltaTone(Math.round((w.measurements.waist - firstWaist) * 10) / 10, true)
    : 'flat'
  return (
    <div className="jt-card standalone">
      <div className="jt-card-head">
        <span className="jt-week-title">
          Week {w.week}
          {w.week === p.totalWeeks ? ' · Final' : ''}
        </span>
        <span className="jt-week-date">{dateStr}</span>
        <span className={`jt-status-tag tone-${meta.tone}`}>{meta.label}</span>
      </div>
      {w.submitted ? (
        <>
          <div className="jt-stats-grid">
            <div className="alltime-stat">
              <span className="alltime-stat-value">
                {w.weightKg}
                <small>kg</small>
              </span>
              <span className="alltime-stat-label">Weight</span>
            </div>
            <div
              className={`alltime-stat${waistTone !== 'flat' ? ` tone-${waistTone}` : ''}`}
            >
              <span className="alltime-stat-value">
                {w.measurements ? w.measurements.waist : '—'}
                <small>cm</small>
              </span>
              <span className="alltime-stat-label">Waist</span>
            </div>
          </div>
          <div className="jt-section">
            <span className="jt-section-label">Adherence</span>
            <div className="jt-adherence-bars">
              <MiniBar pct={w.dietPct} kind="Diet" />
              <MiniBar pct={w.workoutPct} kind="Workout" />
            </div>
          </div>
          <div className="jt-section">
            <span className="jt-section-label">Progress photos</span>
            <PhotoTriplet photos={w.photos} size="sm" />
          </div>
          {w.coachNote ? (
            <div className="jt-note">
              <Icon name="stethoscope" />
              <p>
                <b>Coach note</b>
                {w.coachNote}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <p className="jt-empty">
          {w.status === 'current'
            ? "Awaiting this week's check-in."
            : w.status === 'missed'
              ? 'No submission for this week.'
              : 'Not started yet.'}
        </p>
      )}
    </div>
  )
}

/** Timeline sub-tab: pick a week from the rail, see that one week. */
export function JourneyTimeline({ program }: { program: Program }) {
  const currentWeek = jtCurrentWeek(program)
  // Only a still-active program gets the Today/Current tag — jtCurrentWeek's
  // fallback for a completed program isn't actually "today".
  const isCurrentReal = program.status === 'active'
  const [selected, setSelected] = useState<number | null>(null)
  const activeWeek =
    selected != null && program.weeks.some((w) => w.week === selected)
      ? selected
      : currentWeek
  const week = program.weeks.find((w) => w.week === activeWeek)

  return (
    <>
      <div className="pw-week-rail">
        {program.weeks.map((w) => (
          <button
            key={w.week}
            className={`pw-week-chip${w.week === activeWeek ? ' active' : ''}`}
            onClick={() => setSelected(w.week)}
          >
            Week {w.week}
            <span className="pw-week-chip-date">
              {weekChipDateRangeLabel(w.date)}
            </span>
            {isCurrentReal && w.week === currentWeek ? (
              <span className="pw-current-tag">Today</span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="pw-week-detail">
        <div className="pw-week-detail-head">
          <span className="pw-week-detail-title">
            Week {activeWeek}
            {isCurrentReal && activeWeek === currentWeek ? (
              <span className="pw-current-tag">Current</span>
            ) : null}
          </span>
        </div>
        {week ? <WeekCard w={week} p={program} /> : null}
      </div>
    </>
  )
}
