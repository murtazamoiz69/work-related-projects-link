import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import type { Client } from '@/features/clients'
import { formatJoinDate } from '@/features/clients'
import type { Program } from '../types'
import { fmtDelta } from '../data'
import { CurrentProgramLabel } from './ProgramTrackerDashboard'
import { JourneyTimeline } from './JourneyTimeline'
import { JourneyMeasurements } from './JourneyMeasurements'
import { JourneyPhotos } from './JourneyPhotos'
import { JourneyAdherence } from './JourneyAdherence'

type JourneyTab = 'timeline' | 'measurements' | 'photos' | 'adherence'

const JOURNEY_TABS: Array<{ key: JourneyTab; label: string }> = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'photos', label: 'Photos' },
  { key: 'adherence', label: 'Adherence' },
]

function JourneyHeader({ program }: { program: Program }) {
  const isActive = program.status === 'active'
  const pct = Math.round((program.currentWeek / program.totalWeeks) * 100)
  const ringLabel = isActive ? `${program.currentWeek}` : '✓'
  const ringSub = isActive ? `of ${program.totalWeeks}` : 'done'
  const remaining = Math.max(program.totalWeeks - program.currentWeek, 0)
  const statRow: Array<[string, string]> = isActive
    ? [
        [formatJoinDate(program.startDate), 'Started'],
        [formatJoinDate(program.endDate), 'Ends'],
        [`${remaining}`, remaining === 1 ? 'week left' : 'weeks left'],
      ]
    : [
        [formatJoinDate(program.startDate), 'Started'],
        [formatJoinDate(program.endDate), 'Ended'],
        [fmtDelta(program.weightChange, ' kg'), 'Weight change'],
      ]

  return (
    <div className="journey-header">
      <div
        className="journey-ring"
        style={{ '--pct': pct } as React.CSSProperties}
      >
        <span className="journey-ring-val">{ringLabel}</span>
        <span className="journey-ring-sub">{ringSub}</span>
      </div>
      <div className="journey-header-main">
        <span className="journey-phase">{program.phase}</span>
        <div className="journey-name-row">
          <span className="journey-name">{program.name}</span>
          <span
            className={`status-pill ${isActive ? 'status-active' : 'status-paused'}`}
          >
            {isActive ? 'Active' : 'Completed'}
          </span>
        </div>
        <span className="journey-coach">
          <Icon name="user-round" /> with {program.coach} · {program.goal}
        </span>
      </div>
      <div className="journey-statrow">
        {statRow.map(([v, l]) => (
          <div className="journey-stat" key={l}>
            <span className="journey-stat-val">{v}</span>
            <span className="journey-stat-label">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Program Journey: label + header + 4 scoped sub-tabs (Chart.js measurements). */
export function ProgramJourney({
  client,
  programs,
}: {
  client: Client
  programs: Program[]
}) {
  const [tab, setTab] = useState<JourneyTab>('timeline')
  const firstName = client.name.split(' ')[0]

  const program = programs[0]

  return (
    <section className="panel journey-panel">
      <div className="panel-head journey-panel-head">
        <div>
          <h2>Program Journey</h2>
          <p className="panel-sub">
            Everything {firstName} has done with you, program by program
          </p>
        </div>
        <CurrentProgramLabel program={program} />
      </div>

      <JourneyHeader program={program} />

      <div
        className="prog-tabs journey-tabs"
        role="tablist"
        aria-label="Journey views"
      >
        {JOURNEY_TABS.map((t) => (
          <button
            key={t.key}
            className={`prog-tab${tab === t.key ? ' active' : ''}`}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'timeline' ? (
          <JourneyTimeline key={program.id} program={program} />
        ) : tab === 'measurements' ? (
          <JourneyMeasurements key={program.id} program={program} />
        ) : tab === 'photos' ? (
          <JourneyPhotos program={program} />
        ) : (
          <JourneyAdherence key={program.id} program={program} />
        )}
      </div>
    </section>
  )
}
