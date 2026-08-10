import { useMemo, useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { CLIENTS_DATA } from '@/features/clients'
import {
  AUDIENCE_OPTIONS,
  distinctGoals,
  programNames,
  recipientClients,
} from '../data'
import type { AudienceType } from '../types'
import { RecipientsModal } from './RecipientsModal'

type Props = {
  audienceType: AudienceType
  onAudienceTypeChange: (v: AudienceType) => void
  program: string
  onProgramChange: (v: string) => void
  goal: string
  onGoalChange: (v: string) => void
  selectedIds: Set<string>
  onToggleClient: (id: string) => void
  readOnly?: boolean
}

export function AudienceSection({
  audienceType,
  onAudienceTypeChange,
  program,
  onProgramChange,
  goal,
  onGoalChange,
  selectedIds,
  onToggleClient,
  readOnly = false,
}: Props) {
  const [query, setQuery] = useState('')
  const [programQuery, setProgramQuery] = useState('')
  const [goalQuery, setGoalQuery] = useState('')
  const [recipientsOpen, setRecipientsOpen] = useState(false)
  const programs = useMemo(() => programNames(), [])
  const goals = useMemo(() => distinctGoals(), [])

  const recipients = useMemo(
    () => recipientClients({ type: audienceType, program, goal, selectedIds }),
    [audienceType, program, goal, selectedIds],
  )

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CLIENTS_DATA
    return CLIENTS_DATA.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.program.toLowerCase().includes(q),
    )
  }, [query])

  const filteredPrograms = useMemo(() => {
    const q = programQuery.trim().toLowerCase()
    if (!q) return programs
    return programs.filter((p) => p.toLowerCase().includes(q))
  }, [programs, programQuery])

  const filteredGoals = useMemo(() => {
    const q = goalQuery.trim().toLowerCase()
    if (!q) return goals
    return goals.filter((g) => g.toLowerCase().includes(q))
  }, [goals, goalQuery])

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Who should receive this broadcast?</h2>
        </div>
      </div>

      <label className="modal-field">
        <span>Audience</span>
        <select
          value={audienceType}
          disabled={readOnly}
          onChange={(e) => onAudienceTypeChange(e.target.value as AudienceType)}
        >
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {audienceType === 'program' && readOnly ? (
        <div className="modal-field">
          <span>Program</span>
          <div className="detail-chip-row">
            <span className="client-tag">{program || '—'}</span>
          </div>
        </div>
      ) : audienceType === 'program' ? (
        <div className="modal-field">
          <span>Program</span>
          <div className="clients-search broadcast-client-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Search programs…"
              value={programQuery}
              onChange={(e) => setProgramQuery(e.target.value)}
            />
          </div>
          <ul className="assign-client-list">
            {filteredPrograms.length ? (
              filteredPrograms.map((p) => (
                <li key={p}>
                  <label className="assign-client-row">
                    <input
                      type="radio"
                      name="broadcast-program"
                      checked={program === p}
                      onChange={() => onProgramChange(p)}
                    />
                    <span className="assign-client-body">
                      <span className="assign-client-name">{p}</span>
                    </span>
                  </label>
                </li>
              ))
            ) : (
              <li className="assign-empty">No programs match your search</li>
            )}
          </ul>
        </div>
      ) : null}

      {audienceType === 'goals' && readOnly ? (
        <div className="modal-field">
          <span>Goal</span>
          <div className="detail-chip-row">
            <span className="client-tag">{goal || '—'}</span>
          </div>
        </div>
      ) : audienceType === 'goals' ? (
        <div className="modal-field">
          <span>Goal</span>
          <div className="clients-search broadcast-client-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Search goals…"
              value={goalQuery}
              onChange={(e) => setGoalQuery(e.target.value)}
            />
          </div>
          <ul className="assign-client-list">
            {filteredGoals.length ? (
              filteredGoals.map((g) => (
                <li key={g}>
                  <label className="assign-client-row">
                    <input
                      type="radio"
                      name="broadcast-goal"
                      checked={goal === g}
                      onChange={() => onGoalChange(g)}
                    />
                    <span className="assign-client-body">
                      <span className="assign-client-name">{g}</span>
                    </span>
                  </label>
                </li>
              ))
            ) : (
              <li className="assign-empty">No goals match your search</li>
            )}
          </ul>
        </div>
      ) : null}

      {audienceType === 'selected' && readOnly ? (
        <div className="modal-field">
          <span>Selected Users</span>
          <div className="detail-chip-row">
            {CLIENTS_DATA.filter((c) => selectedIds.has(c.id)).map((c) => (
              <span className="client-tag" key={c.id}>
                {c.name}
              </span>
            ))}
          </div>
        </div>
      ) : audienceType === 'selected' ? (
        <div className="modal-field">
          <span>Select Users</span>
          <div className="clients-search broadcast-client-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Search users by name or program…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="assign-client-list">
            {filteredClients.length ? (
              filteredClients.map((c) => (
                <li key={c.id}>
                  <label className="assign-client-row">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => onToggleClient(c.id)}
                    />
                    <Avatar initials={c.initials} color={c.color} size="sm" />
                    <span className="assign-client-body">
                      <span className="assign-client-name">{c.name}</span>
                      <span className="assign-client-sub">{c.program}</span>
                    </span>
                  </label>
                </li>
              ))
            ) : (
              <li className="assign-empty">No users match your search</li>
            )}
          </ul>
        </div>
      ) : null}

      <div className="broadcast-recipients-row">
        <span>Recipients:</span>
        <button
          type="button"
          className="link-btn broadcast-recipients-link"
          onClick={() => setRecipientsOpen(true)}
        >
          {recipients.length}
        </button>
      </div>

      {recipientsOpen ? (
        <RecipientsModal
          clients={recipients}
          onClose={() => setRecipientsOpen(false)}
        />
      ) : null}
    </section>
  )
}
