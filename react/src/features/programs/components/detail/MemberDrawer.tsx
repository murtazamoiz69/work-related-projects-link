import { useEffect, useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn, formatJoinDate, type Client } from '@/features/clients'
import { showToast } from '@/lib/toast'
import { programStatCounts } from '../../data'
import type { ProgramMember, ProgramNote, TrainingProgram } from '../../types'

function noteInitials(author: string): string {
  return author
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function NoteItem({ n }: { n: ProgramNote }) {
  return (
    <li className="note-item">
      <Avatar initials={noteInitials(n.author)} color="#2F5D50" size="xs" />
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

export function MemberDrawer({
  program: p,
  member: m,
  client: c,
  onClose,
  flashSaved,
}: {
  program: TrainingProgram
  member: ProgramMember
  client: Client
  onClose: () => void
  flashSaved: () => void
}) {
  const [noteInput, setNoteInput] = useState('')
  const firstName = c.name.split(' ')[0]
  const statusClass = m.status === 'paused' ? 'status-paused' : 'status-active'
  const statusLabel = m.status[0].toUpperCase() + m.status.slice(1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const override = (type: 'workout' | 'meal' | 'skip' | 'restart') => {
    if (type === 'workout') {
      m.overrides.workouts++
      showToast(`Workout override added for ${c.name}`)
    } else if (type === 'meal') {
      m.overrides.meals++
      showToast(`Meal override added for ${c.name}`)
    } else if (type === 'skip') {
      m.currentWeek = Math.min(m.currentWeek + 1, p.durationWeeks)
      showToast(`${c.name} skipped ahead to Week ${m.currentWeek}`)
    } else {
      m.currentWeek = 1
      m.progressPct = 0
      showToast(`${c.name}'s program restarted from Week 1`)
    }
    programStatCounts(p)
    flashSaved()
  }

  const togglePause = () => {
    m.status = m.status === 'paused' ? 'active' : 'paused'
    programStatCounts(p)
    flashSaved()
    showToast(`${c.name} ${m.status === 'paused' ? 'paused' : 'resumed'}`)
  }

  const addNote = () => {
    const text = noteInput.trim()
    if (!text) return
    m.notes.unshift({ author: 'Sarah Nolan', text, days: 0 })
    setNoteInput('')
    flashSaved()
  }

  return (
    <div
      className="drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="drawer-panel">
        <div className="drawer-head">
          <div>
            <h3>Member Profile</h3>
            <p className="panel-sub">Assigned {formatJoinDate(m.assignedDate)}</p>
          </div>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="drawer-body">
          <div className="profile-card-row" style={{ marginBottom: 16 }}>
            <Avatar initials={c.initials} color={c.color} size="lg" />
            <div>
              <span className="profile-card-name">{c.name}</span>
              <span className="profile-card-sub">{c.program}</span>
              <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
            </div>
          </div>
          <div
            className="chat-insights-grid"
            style={{ border: 'none', padding: 0, marginBottom: 16 }}
          >
            <div className="chat-insight">
              <span className="chat-insight-value">
                Wk {m.currentWeek}/{p.durationWeeks}
              </span>
              <span className="chat-insight-label">Current Week</span>
            </div>
            <div className="chat-insight">
              <span className="chat-insight-value">{m.progressPct}%</span>
              <span className="chat-insight-label">Progress</span>
            </div>
            <div className="chat-insight">
              <span className="chat-insight-value">
                {m.currentWeight || '—'} kg
              </span>
              <span className="chat-insight-label">Weight</span>
            </div>
          </div>
          <div className="member-override-banner">
            <Icon name="shield-check" />
            Overrides only affect {firstName} — the original program stays
            unchanged for everyone else.
          </div>
          <div className="drawer-section-head">
            <h4>
              <Icon name="sliders-horizontal" />
              Overrides
            </h4>
          </div>
          <div className="member-override-grid">
            <button className="qa-btn" onClick={() => override('workout')}>
              <Icon name="dumbbell" />
              <span>Override Workout</span>
            </button>
            <button className="qa-btn" onClick={() => override('meal')}>
              <Icon name="utensils" />
              <span>Override Meal</span>
            </button>
            <button className="qa-btn" onClick={() => override('skip')}>
              <Icon name="skip-forward" />
              <span>Skip Week</span>
            </button>
            <button className="qa-btn" onClick={() => override('restart')}>
              <Icon name="rotate-ccw" />
              <span>Restart Program</span>
            </button>
          </div>
          {m.overrides.workouts || m.overrides.meals ? (
            <p className="chat-mini-card-text" style={{ marginTop: 10 }}>
              {m.overrides.workouts} workout override
              {m.overrides.workouts === 1 ? '' : 's'} · {m.overrides.meals} meal
              override{m.overrides.meals === 1 ? '' : 's'}
            </p>
          ) : null}
          <div className="drawer-section-head">
            <h4>
              <Icon name="notebook-pen" />
              Coach Notes
            </h4>
          </div>
          <ul className="notes-list">
            {m.notes.length ? (
              m.notes.map((n, i) => <NoteItem key={i} n={n} />)
            ) : (
              <li className="assign-empty">No notes yet</li>
            )}
          </ul>
          <div className="notes-add-row">
            <textarea
              className="notes-input"
              rows={2}
              placeholder="Add a note for this member…"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
            <button className="btn-secondary" onClick={addNote}>
              Add
            </button>
          </div>
        </div>
        <div className="drawer-foot">
          <button className="link-btn danger-link" onClick={togglePause}>
            {m.status === 'paused' ? 'Resume' : 'Pause'} Member
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
