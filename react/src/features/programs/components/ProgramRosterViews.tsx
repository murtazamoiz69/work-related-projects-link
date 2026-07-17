import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { formatCheckIn } from '@/features/clients'
import { PROGRAM_STATUS_LABEL } from '../data'
import type { TrainingProgram } from '../types'
import {
  ProgramActionsMenu,
  type ProgramMenuAction,
} from './ProgramActionsMenu'

function coachInitials(coach: string): string {
  return coach
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function updatedLabel(p: TrainingProgram): string {
  return formatCheckIn(
    Math.round((Date.now() - p.updatedDate.getTime()) / (24 * 3600 * 1000)),
  )
}

type ViewProps = {
  program: TrainingProgram
  onAction: (action: ProgramMenuAction, program: TrainingProgram) => void
  onAssign: (program: TrainingProgram) => void
}

export function ProgramCard({ program: p, onAction, onAssign }: ViewProps) {
  const navigate = useNavigate()
  return (
    <article
      className="prog-card prog-card-plain"
      onClick={() =>
        navigate({ to: '/programs/$programId', params: { programId: p.id } })
      }
    >
      <div className="prog-card-head">
        <span
          className={`prog-status-badge status-${p.status}`}
          style={{ position: 'static' }}
        >
          {PROGRAM_STATUS_LABEL[p.status]}
        </span>
        <div onClick={(e) => e.stopPropagation()}>
          <ProgramActionsMenu program={p} onAction={(a) => onAction(a, p)} />
        </div>
      </div>
      <div className="prog-card-body">
        <h3 className="prog-card-title">{p.name}</h3>
        <p className="prog-card-desc">{p.description}</p>
        <div className="prog-card-meta-row">
          <span className="prog-meta-chip">{p.goal}</span>
          <span className="prog-meta-chip">{p.durationWeeks} Weeks</span>
          <span className="prog-meta-chip">{p.difficulty}</span>
        </div>
        <div className="prog-card-coach">
          <Avatar initials={coachInitials(p.coach)} color="#5B7FA6" size="xs" />
          <span>{p.coach}</span>
        </div>
        <div className="prog-card-stats">
          <div className="prog-stat">
            <span className="prog-stat-value">{p.members.length}</span>
            <span className="prog-stat-label">Assigned</span>
          </div>
          <div className="prog-stat">
            <span className="prog-stat-value">{p.activeUsers}</span>
            <span className="prog-stat-label">Active</span>
          </div>
          <div className="prog-stat">
            <span className="prog-stat-value">{p.completionRate}%</span>
            <span className="prog-stat-label">Completion</span>
          </div>
        </div>
        <div className="prog-card-foot">
          <span className="prog-card-updated">Updated {updatedLabel(p)}</span>
          <button
            className="btn-secondary sm"
            onClick={(e) => {
              e.stopPropagation()
              onAssign(p)
            }}
          >
            Assign
          </button>
        </div>
      </div>
    </article>
  )
}

export function ProgramTableRow({ program: p, onAction, onAssign }: ViewProps) {
  const navigate = useNavigate()
  return (
    <tr
      className="prog-table-row"
      onClick={() =>
        navigate({ to: '/programs/$programId', params: { programId: p.id } })
      }
    >
      <td>
        <div className="ct-client">
          <span className="ct-client-id">
            <span className="ct-name">{p.name}</span>
            <span className="ct-sub">
              {p.goal} · {p.durationWeeks}w · {p.difficulty}
            </span>
          </span>
        </div>
      </td>
      <td>
        <span
          className={`prog-status-badge status-${p.status}`}
          style={{ position: 'static' }}
        >
          {PROGRAM_STATUS_LABEL[p.status]}
        </span>
      </td>
      <td>
        <div className="ct-client">
          <Avatar initials={coachInitials(p.coach)} color="#5B7FA6" size="xs" />
          <span className="ct-text">{p.coach}</span>
        </div>
      </td>
      <td>{p.members.length}</td>
      <td>{p.activeUsers}</td>
      <td>{p.completionRate}%</td>
      <td>{updatedLabel(p)}</td>
      <td>
        <div className="ct-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn-secondary sm" onClick={() => onAssign(p)}>
            Assign
          </button>
          <ProgramActionsMenu program={p} onAction={(a) => onAction(a, p)} />
        </div>
      </td>
    </tr>
  )
}
