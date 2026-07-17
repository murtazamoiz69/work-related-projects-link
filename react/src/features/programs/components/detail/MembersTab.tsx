import { useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import {
  CLIENTS_DATA,
  adherenceTier,
  formatCheckIn,
  formatJoinDate,
} from '@/features/clients'
import { showToast } from '@/lib/toast'
import { programStatCounts } from '../../data'
import type { ProgramMember, TrainingProgram } from '../../types'
import { MemberDrawer } from './MemberDrawer'

export function MembersTab({
  program: p,
  flashSaved,
  onAssign,
}: {
  program: TrainingProgram
  flashSaved: () => void
  onAssign: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openClientId, setOpenClientId] = useState<string | null>(null)

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(p.members.map((m) => m.clientId)) : new Set())
  }

  const bulkAction = (action: 'pause' | 'resume' | 'export' | 'remove') => {
    const ids = [...selected]
    if (!ids.length) return
    if (action === 'pause') {
      p.members.forEach((m) => {
        if (ids.includes(m.clientId)) m.status = 'paused'
      })
      showToast(`Paused ${ids.length} member${ids.length === 1 ? '' : 's'}`)
    } else if (action === 'resume') {
      p.members.forEach((m) => {
        if (ids.includes(m.clientId)) m.status = 'active'
      })
      showToast(`Resumed ${ids.length} member${ids.length === 1 ? '' : 's'}`)
    } else if (action === 'remove') {
      p.members = p.members.filter((m) => !ids.includes(m.clientId))
      setSelected(new Set())
      showToast(`Removed ${ids.length} member${ids.length === 1 ? '' : 's'}`)
    } else {
      showToast(`Exporting ${ids.length} member${ids.length === 1 ? '' : 's'}…`)
    }
    programStatCounts(p)
    flashSaved()
  }

  const openMember = openClientId
    ? p.members.find((m) => m.clientId === openClientId)
    : null
  const openClient = openClientId
    ? CLIENTS_DATA.find((c) => c.id === openClientId)
    : null

  const bulkVisible = selected.size > 0

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Members</h2>
            <p className="panel-sub">
              {p.members.length} assigned · {p.activeUsers} active
            </p>
          </div>
          <div className="panel-head-actions">
            <button className="btn-primary" onClick={onAssign}>
              <Icon name="user-plus" />
              Assign Users
            </button>
          </div>
        </div>
        {bulkVisible ? (
          <div className="member-bulk-bar">
            <span>{selected.size} selected</span>
            <div className="member-bulk-actions">
              <button onClick={() => bulkAction('pause')}>
                <Icon name="pause" />
                Pause
              </button>
              <button onClick={() => bulkAction('resume')}>
                <Icon name="play" />
                Resume
              </button>
              <button onClick={() => bulkAction('export')}>
                <Icon name="download" />
                Export
              </button>
              <button className="danger" onClick={() => bulkAction('remove')}>
                <Icon name="user-minus" />
                Remove
              </button>
            </div>
          </div>
        ) : null}
        {p.members.length ? (
          <div className="clients-table-wrap">
            <table className="client-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        selected.size > 0 && selected.size === p.members.length
                      }
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th>Client</th>
                  <th>Current Week</th>
                  <th>Progress</th>
                  <th>Weight</th>
                  <th>Assigned</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {p.members.map((m) => (
                  <MemberRow
                    key={m.clientId}
                    member={m}
                    durationWeeks={p.durationWeeks}
                    checked={selected.has(m.clientId)}
                    onToggle={() => toggle(m.clientId)}
                    onOpen={() => setOpenClientId(m.clientId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="clients-empty">
            <Icon name="user-x" />
            <p>No members assigned yet</p>
            <button className="link-btn" onClick={onAssign}>
              Assign your first client
            </button>
          </div>
        )}
      </div>

      {openMember && openClient ? (
        <MemberDrawer
          program={p}
          member={openMember}
          client={openClient}
          onClose={() => setOpenClientId(null)}
          flashSaved={flashSaved}
        />
      ) : null}
    </>
  )
}

function MemberRow({
  member: m,
  durationWeeks,
  checked,
  onToggle,
  onOpen,
}: {
  member: ProgramMember
  durationWeeks: number
  checked: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  const c = CLIENTS_DATA.find((cl) => cl.id === m.clientId)
  if (!c) return null
  const statusClass = m.status === 'paused' ? 'status-paused' : 'status-active'
  return (
    <tr>
      <td>
        <input
          type="checkbox"
          className="member-row-check"
          checked={checked}
          onChange={onToggle}
        />
      </td>
      <td>
        <div className="ct-client">
          <Avatar initials={c.initials} color={c.color} size="xs" />
          <span className="ct-name">{c.name}</span>
        </div>
      </td>
      <td>
        Week {m.currentWeek} / {durationWeeks}
      </td>
      <td>
        <div className="adherence-cell">
          <div className="adherence-bar">
            <div
              className={`adherence-fill adherence-${adherenceTier(m.progressPct)}`}
              style={{ width: `${m.progressPct}%` }}
            />
          </div>
          <span className="adherence-pct">{m.progressPct}%</span>
        </div>
      </td>
      <td>{m.currentWeight ? `${m.currentWeight} kg` : '—'}</td>
      <td>{formatJoinDate(m.assignedDate)}</td>
      <td>{formatCheckIn(m.lastActive)}</td>
      <td>
        <span className={`status-pill ${statusClass}`}>
          {m.status[0].toUpperCase() + m.status.slice(1)}
        </span>
      </td>
      <td>
        <button className="icon-btn sm" title="View member" onClick={onOpen}>
          <Icon name="chevron-right" />
        </button>
      </td>
    </tr>
  )
}
