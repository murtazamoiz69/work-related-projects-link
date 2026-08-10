import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { CLIENTS_DATA, STATUS_LABEL, type Client } from '@/features/clients'
import { showToast } from '@/lib/toast'
import { programStatCounts } from '../data'
import type { TrainingProgram } from '../types'

// Assign Users flow (2-step: pick → review) — ported from V2's openAssignModal.
// Mutates the program's members in place, then persists via onAssigned.
export function AssignUsersModal({
  program,
  onClose,
  onAssigned,
}: {
  program: TrainingProgram
  onClose: () => void
  onAssigned: () => void
}) {
  const [step, setStep] = useState<'pick' | 'review'>('pick')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [notify, setNotify] = useState(true)
  const [notes, setNotes] = useState('')
  const tomorrow = useMemo(
    () => new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
    [],
  )
  const [startDate, setStartDate] = useState(tomorrow)
  const [endDate, setEndDate] = useState('')

  const assignedIds = useMemo(
    () => new Set(program.members.map((m) => m.clientId)),
    [program],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CLIENTS_DATA.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.goals.join(' ').toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [query, statusFilter])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedClients = CLIENTS_DATA.filter((c) => selected.has(c.id))

  const confirm = () => {
    let added = 0
    selected.forEach((clientId) => {
      if (assignedIds.has(clientId)) return
      program.members.push({
        clientId,
        currentWeek: 1,
        progressPct: 0,
        currentWeight: 0,
        assignedDate: new Date(),
        lastActive: 0,
        status: 'active',
        notes: notes.trim()
          ? [{ author: 'Sarah Nolan', text: notes.trim(), days: 0 }]
          : [],
        overrides: { workouts: 0, meals: 0 },
      })
      added++
    })
    programStatCounts(program)
    program.updatedDate = new Date()
    program.activity.unshift({
      text: `${added} user${added === 1 ? '' : 's'} assigned to the program`,
      days: 0,
    })
    onClose()
    showToast(
      `Assigned ${added} user${added === 1 ? '' : 's'}${notify ? ' — notifications sent' : ''}`,
    )
    onAssigned()
  }

  const ClientRow = ({ c }: { c: Client }) => {
    const already = assignedIds.has(c.id)
    return (
      <li>
        <label className={`assign-client-row${already ? ' is-assigned' : ''}`}>
          <input
            type="checkbox"
            checked={selected.has(c.id)}
            disabled={already}
            onChange={() => toggle(c.id)}
          />
          <Avatar initials={c.initials} color={c.color} size="sm" />
          <span className="assign-client-body">
            <span className="assign-client-name">{c.name}</span>
            <span className="assign-client-sub">
              {c.program} · {c.goals.join(', ')}
            </span>
          </span>
          <span className={`status-pill status-${c.status}`}>
            {STATUS_LABEL[c.status]}
          </span>
          {already ? (
            <span className="assign-already-tag">Already assigned</span>
          ) : null}
        </label>
      </li>
    )
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {step === 'pick' ? (
        <div className="modal-card assign-modal-card">
          <div className="modal-head">
            <h3>Assign Users — {program.name}</h3>
            <button
              className="icon-btn sm"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="assign-search-row">
            <div className="chat-list-search assign-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search users by name or goal…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="select-range"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="attention">Needs Attention</option>
              <option value="paused">Paused</option>
              <option value="new">New</option>
            </select>
          </div>
          <ul className="assign-client-list">
            {filteredClients.length ? (
              filteredClients.map((c) => <ClientRow key={c.id} c={c} />)
            ) : (
              <li className="assign-empty">No users match your search</li>
            )}
          </ul>
          <div className="modal-foot">
            <span className="assign-selected-count">
              {selected.size} selected
            </span>
            <button
              className="btn-primary"
              disabled={selected.size === 0}
              onClick={() => setStep('review')}
            >
              Review &amp; Assign <Icon name="arrow-right" />
            </button>
          </div>
        </div>
      ) : (
        <div className="modal-card assign-modal-card">
          <div className="modal-head">
            <h3>Review Assignment</h3>
            <button
              className="icon-btn sm"
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="assign-review-body">
            <p className="chat-mini-card-text">
              Assigning <strong>{selectedClients.length}</strong> user
              {selectedClients.length === 1 ? '' : 's'} to{' '}
              <strong>{program.name}</strong>.
            </p>
            <div className="assign-review-chips">
              {selectedClients.map((c) => (
                <span className="client-tag" key={c.id}>
                  {c.name}
                </span>
              ))}
            </div>
            <div className="modal-field-row">
              <label className="modal-field">
                <span>Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="modal-field">
                <span>End Date (optional)</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            <label className="modal-field">
              <span>Notes (optional)</span>
              <textarea
                className="notes-input"
                rows={2}
                placeholder="Anything the coach covering this user should know…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <label className="assign-notify-row">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />{' '}
              Notify users when assigned
            </label>
          </div>
          <div className="modal-foot">
            <button className="link-btn" onClick={() => setStep('pick')}>
              <Icon name="arrow-left" /> Back
            </button>
            <button className="btn-primary" onClick={confirm}>
              Assign {selectedClients.length}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
