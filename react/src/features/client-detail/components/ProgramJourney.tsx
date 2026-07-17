import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import type { Client } from '@/features/clients'
import { formatJoinDate } from '@/features/clients'
import type { Program } from '../types'
import { fmtDelta } from '../data'
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

// The program switcher — a themed dropdown (reusing the app's context-menu
// component) instead of a native <select>. Active first, previous grouped by
// end year.
function ProgramSwitcher({
  programs,
  activeId,
  onSelect,
}: {
  programs: Program[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const active = programs[0]
  const prev = programs.slice(1)

  const byYear = useMemo(() => {
    const map = new Map<number, Program[]>()
    prev.forEach((p) => {
      const y = p.endDate.getFullYear()
      const list = map.get(y) ?? []
      list.push(p)
      map.set(y, list)
    })
    return map
  }, [prev])
  const years = useMemo(
    () => [...byYear.keys()].sort((a, b) => b - a),
    [byYear],
  )

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  const selected = programs.find((p) => p.id === activeId) ?? active
  const triggerLabel =
    selected.id === active.id ? `Current · ${active.name}` : selected.name

  const itemHtml = (p: Program, tag?: string) => (
    <button
      key={p.id}
      type="button"
      className={`ctx-menu-item${p.id === activeId ? ' active' : ''}`}
      onClick={() => {
        onSelect(p.id)
        setOpen(false)
      }}
    >
      <span className="ctx-menu-item-label">
        {tag ? <span className="ctx-menu-item-tag">{tag}</span> : null}
        {p.name}
      </span>
      <span className="ctx-menu-item-meta">{p.totalWeeks} wks</span>
    </button>
  )

  return (
    <div className="journey-switcher" ref={wrapRef}>
      <label className="journey-switch-label">Viewing</label>
      <div className="topbar-dd-wrap">
        <button
          type="button"
          className="select-range journey-select-btn"
          aria-haspopup="listbox"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((o) => !o)
          }}
        >
          <span>{triggerLabel}</span>
          <Icon name="chevron-down" />
        </button>
        {open ? (
          <div className="context-menu program-switcher-menu">
            {itemHtml(active, 'Current')}
            {years.map((y) => (
              <div key={y}>
                <div className="ctx-menu-group-label">{y}</div>
                {(byYear.get(y) ?? []).map((p) => itemHtml(p))}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

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
      <div className="journey-ring" style={{ '--pct': pct } as React.CSSProperties}>
        <span className="journey-ring-val">{ringLabel}</span>
        <span className="journey-ring-sub">{ringSub}</span>
      </div>
      <div className="journey-header-main">
        <span className="journey-phase">{program.phase}</span>
        <div className="journey-name-row">
          <span className="journey-name">{program.name}</span>
          <span className={`status-pill ${isActive ? 'status-active' : 'status-paused'}`}>
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

/** Program Journey: switcher + header + 4 scoped sub-tabs (Chart.js measurements). */
export function ProgramJourney({
  client,
  programs,
}: {
  client: Client
  programs: Program[]
}) {
  const [activeId, setActiveId] = useState(programs[0].id)
  const [tab, setTab] = useState<JourneyTab>('timeline')
  const firstName = client.name.split(' ')[0]

  const program = programs.find((p) => p.id === activeId) ?? programs[0]

  const selectProgram = (id: string) => {
    setActiveId(id)
    setTab('timeline')
  }

  return (
    <section className="panel journey-panel">
      <div className="panel-head journey-panel-head">
        <div>
          <h2>Program Journey</h2>
          <p className="panel-sub">
            Everything {firstName} has done with you, program by program
          </p>
        </div>
        <ProgramSwitcher
          programs={programs}
          activeId={activeId}
          onSelect={selectProgram}
        />
      </div>

      <JourneyHeader program={program} />

      <div className="prog-tabs journey-tabs" role="tablist" aria-label="Journey views">
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
