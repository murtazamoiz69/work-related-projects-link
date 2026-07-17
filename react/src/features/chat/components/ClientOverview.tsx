import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Avatar } from '@/components/atoms/Avatar'
import {
  adherenceTier,
  formatCheckIn,
  formatJoinDate,
} from '@/features/clients'
import type { Client } from '@/features/clients'
import { showToast } from '@/lib/toast'
import { useMiniTooltip } from '@/hooks/useMiniTooltip'
import { Link } from '@tanstack/react-router'
import { deriveClinicalProfile } from '../plan-workspace'
import { chatPlanWeekForDay } from '../data'
import type { Conversation, ProfileSectionId, WeekDayStat } from '../types'

const PROFILE_SECTIONS: { id: ProfileSectionId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'target' },
  { id: 'medical', label: 'Medical', icon: 'stethoscope' },
  { id: 'activity', label: 'User Activity', icon: 'activity' },
]
const UPLOADS_PREVIEW_MAX = 6

function dayPopoverText(client: Client, day: WeekDayStat, noun: string): string {
  const week = chatPlanWeekForDay(client, day.daysAgo)
  const header = `Week ${week} — ${client.plan}`
  return day.tier === 'empty'
    ? `${header}\n${day.label} hasn't started yet`
    : `${header}\n${noun}: ${day.completed}/${day.scheduled}`
}

export function ClientOverview({
  convo,
  onManagePlan,
  refresh,
}: {
  convo: Conversation
  onManagePlan: () => void
  refresh: () => void
}) {
  const c = convo.client
  const [section, setSection] = useState<ProfileSectionId>('overview')
  const [noteText, setNoteText] = useState('')
  const { show, hide, tooltip } = useMiniTooltip()

  const addNote = () => {
    const text = noteText.trim()
    if (!text) return
    convo.notes.unshift({ author: 'Sarah Nolan', text, days: 0 })
    setNoteText('')
    refresh()
    showToast('Note added')
  }

  return (
    <aside className="chat-right-col">
      <div className="chat-right-scroll" id="chatRightCol">
        <div className="profile-unified-card">
          <div className="profile-unified-head">
            <Avatar initials={c.initials} color={c.color} size="lg" />
            <div className="profile-unified-id">
              <span className="profile-card-name">{c.name}</span>
              <span className="profile-card-sub">
                {c.age} · {c.gender} · {c.program}
              </span>
            </div>
            <Link
              to="/clients/$clientId"
              params={{ clientId: convo.id }}
              className="icon-btn sm"
              title="Expand full profile"
            >
              <Icon name="maximize-2" />
            </Link>
          </div>

          <p className="chat-mini-card-text profile-chat-summary">{convo.chatSummary}</p>

          <button className="btn-primary full" onClick={onManagePlan} title="Open the plan workspace">
            <Icon name="clipboard-list" />
            Manage Plan
          </button>

          <div className="profile-section-tabs" role="tablist">
            {PROFILE_SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`profile-section-tab${s.id === section ? ' active' : ''}`}
                role="tab"
                aria-selected={s.id === section}
                onClick={() => setSection(s.id)}
              >
                <Icon name={s.icon} />
                {s.label}
              </button>
            ))}
          </div>

          <div className="profile-section-body">
            {section === 'overview' ? (
              <OverviewSection
                convo={convo}
                noteText={noteText}
                setNoteText={setNoteText}
                addNote={addNote}
                onDotEnter={show}
                onDotLeave={hide}
              />
            ) : section === 'medical' ? (
              <MedicalSection convo={convo} />
            ) : (
              <ActivitySection convo={convo} />
            )}
          </div>
        </div>
      </div>
      {tooltip}
    </aside>
  )
}

function WeekDots({
  days,
  client,
  noun,
  onEnter,
  onLeave,
}: {
  days: WeekDayStat[]
  client: Client
  noun: string
  onEnter: (e: React.MouseEvent, text: string) => void
  onLeave: () => void
}) {
  return (
    <div className="week-dots">
      {days.map((d, i) => (
        <span
          key={i}
          className={`week-dot tier-${d.tier}${d.isToday ? ' is-today' : ''}`}
          onMouseEnter={(e) => onEnter(e, dayPopoverText(client, d, noun))}
          onMouseLeave={onLeave}
        />
      ))}
    </div>
  )
}

function OverviewSection({
  convo,
  noteText,
  setNoteText,
  addNote,
  onDotEnter,
  onDotLeave,
}: {
  convo: Conversation
  noteText: string
  setNoteText: (v: string) => void
  addNote: () => void
  onDotEnter: (e: React.MouseEvent, text: string) => void
  onDotLeave: () => void
}) {
  const c = convo.client
  const { dietWeek, workoutWeek } = convo.insights
  const pct = c.adherence
  const tone = pct === null ? 'empty' : adherenceTier(pct)
  return (
    <>
      <div className="profile-unified-section no-rule">
        <span className="detail-chip-label">This Week&apos;s Performance</span>
        <div className="week-perf-layout">
          <div className="week-perf">
            <div className="week-perf-row">
              <span className="week-perf-label">Weekly Diet</span>
              <WeekDots days={dietWeek} client={c} noun="Meals" onEnter={onDotEnter} onLeave={onDotLeave} />
            </div>
            <div className="week-perf-row">
              <span className="week-perf-label">Weekly Workout</span>
              <WeekDots days={workoutWeek} client={c} noun="Workouts" onEnter={onDotEnter} onLeave={onDotLeave} />
            </div>
          </div>
          <div className={`week-perf-pct tone-${tone}`}>
            <span className="week-perf-pct-value">{pct === null ? '—' : `${pct}%`}</span>
            <span className="week-perf-pct-label">Adherence</span>
          </div>
        </div>
      </div>
      <div className="profile-unified-section">
        <span className="detail-chip-label">Goals &amp; Diet</span>
        <div className="detail-chip-row">
          {c.goals.map((g, i) => (
            <span className="client-tag" key={i}>
              {g}
            </span>
          ))}
          <span className="client-tag client-tag-diet">{c.diet}</span>
        </div>
      </div>
      <div className="profile-unified-section" id="profileNotesSection">
        <span className="detail-chip-label">Notes</span>
        {convo.notes.length ? (
          <ul className="notes-list">
            {convo.notes.map((n, i) => (
              <li className="note-item" key={i}>
                <span
                  className="avatar avatar-xs"
                  style={{ background: n.author === 'Sarah Nolan' ? '#2F5D50' : '#5B7FA6' }}
                >
                  {n.author
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="note-body">
                  <div className="note-meta">
                    <span className="note-author">{n.author}</span>
                    <span className="note-time">{formatCheckIn(n.days)}</span>
                  </div>
                  <p className="note-text">{n.text}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="notes-add-row">
          <textarea
            className="notes-input"
            rows={2}
            placeholder={`Add a note about ${c.name.split(' ')[0]}…`}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <button className="btn-secondary" onClick={addNote}>
            Add
          </button>
        </div>
      </div>
    </>
  )
}

function MedicalChipRow({
  arr,
  emptyText,
}: {
  arr: string[]
  emptyText: string
}) {
  if (!arr || !arr.length) return <span className="chat-mini-card-text">{emptyText}</span>
  return (
    <div className="detail-chip-row">
      {arr.map((a, i) => (
        <span className="client-tag client-tag-risk" key={i}>
          {a}
        </span>
      ))}
    </div>
  )
}

function MedicalSection({ convo }: { convo: Conversation }) {
  const p = deriveClinicalProfile(convo.client)
  return (
    <>
      <div className="profile-unified-section no-rule">
        <span className="detail-chip-label">Medical Information</span>
        <div className="medical-info-block">
          <span className="detail-chip-sublabel">Allergies</span>
          <MedicalChipRow arr={p.allergies} emptyText="No known allergies" />
          <span className="detail-chip-sublabel">Food Intolerances</span>
          <MedicalChipRow arr={p.foodIntolerances} emptyText="None reported" />
          <span className="detail-chip-sublabel">Medical Conditions</span>
          <MedicalChipRow arr={p.medicalConditions} emptyText="None reported" />
          <span className="detail-chip-sublabel">Injuries</span>
          <MedicalChipRow arr={p.injuries} emptyText="None reported" />
          {p.pregnancy ? (
            <>
              <span className="detail-chip-sublabel">Pregnancy / Breastfeeding</span>
              <MedicalChipRow arr={[p.pregnancy]} emptyText="" />
            </>
          ) : null}
        </div>
      </div>
      <div className="profile-unified-section">
        <span className="detail-chip-label">Flags</span>
        {convo.flags.length ? (
          <ul className="checklist">
            {convo.flags.map((f, i) => (
              <li className="checklist-item pending" key={i}>
                <Icon name="flag" />
                <div>
                  <span className="checklist-name">{f}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="checklist-rest">
            <Icon name="check-circle-2" />
            <span>No flags on this client</span>
          </div>
        )}
      </div>
    </>
  )
}

function ActivitySection({ convo }: { convo: Conversation }) {
  const shown = convo.uploads.slice(0, UPLOADS_PREVIEW_MAX)
  return (
    <>
      <div className="profile-unified-section no-rule">
        <span className="detail-chip-label">Recent Activity</span>
        {convo.activity.length ? (
          <ul className="timeline">
            {convo.activity.map((a, i) => (
              <li className="timeline-item" key={i}>
                <span className="avatar avatar-xs" style={{ background: 'var(--primary)' }}>
                  <Icon name={a.icon} />
                </span>
                <div className="timeline-body">
                  <p>{a.text}</p>
                  <span className="timeline-time">{formatCheckIn(a.days)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="checklist-rest">
            <Icon name="activity" />
            <span>No recent activity</span>
          </div>
        )}
      </div>
      <div className="profile-unified-section">
        <span className="detail-chip-label">Uploads</span>
        {shown.length ? (
          <>
            <div className="upload-gallery">
              {shown.map((u, i) => (
                <div className="upload-item" key={i}>
                  <div className="upload-thumb">
                    <Icon name="image" />
                  </div>
                  <span className="upload-date">{formatJoinDate(u.date)}</span>
                </div>
              ))}
            </div>
            {convo.uploads.length > UPLOADS_PREVIEW_MAX ? (
              <Link
                to="/clients/$clientId"
                params={{ clientId: convo.id }}
                className="link-btn profile-view-more"
              >
                View all {convo.uploads.length} uploads <Icon name="arrow-right" />
              </Link>
            ) : null}
          </>
        ) : (
          <div className="checklist-rest">
            <Icon name="image-off" />
            <span>No uploads yet</span>
          </div>
        )}
      </div>
    </>
  )
}
