import { Icon } from '@/components/atoms/Icon'
import { formatJoinDate } from '@/features/clients'
import { PROGRAM_STATUS_LABEL } from '../../data'
import type { TrainingProgram } from '../../types'

export function ProgramDetailHeader({
  program: p,
  onEdit,
  onAssign,
  onDuplicate,
  onTogglePublish,
}: {
  program: TrainingProgram
  onEdit: () => void
  onAssign: () => void
  onDuplicate: () => void
  onTogglePublish: () => void
}) {
  return (
    <section className="panel prog-detail-header">
      <div className="prog-detail-header-top">
        <div className="prog-detail-title-row">
          <h1>{p.name}</h1>
          <span className={`prog-status-badge status-${p.status}`}>
            {PROGRAM_STATUS_LABEL[p.status]}
          </span>
          <button
            className="icon-btn sm"
            title="Edit Program"
            onClick={onEdit}
          >
            <Icon name="pencil" />
          </button>
        </div>
        <p className="prog-detail-desc">{p.description}</p>
        <div className="prog-detail-meta-row">
          <span>
            <Icon name="calendar-range" />
            <span>{p.durationWeeks} Weeks</span>
          </span>
          <span>
            <Icon name="users" />
            <span>{p.members.length} Assigned</span>
          </span>
          <span>
            <Icon name="calendar-plus" />
            <span>Created {formatJoinDate(p.createdDate)}</span>
          </span>
          <span>
            <Icon name="git-branch" />
            <span>{p.version}</span>
          </span>
        </div>
      </div>
      <div className="prog-detail-actions">
        <button className="btn-secondary" onClick={onAssign}>
          <Icon name="user-plus" />
          Assign Users
        </button>
        <button className="icon-btn" title="Duplicate" onClick={onDuplicate}>
          <Icon name="copy" />
        </button>
        <button className="btn-primary" onClick={onTogglePublish}>
          {p.status === 'published' ? (
            <>
              <Icon name="eye-off" />
              Unpublish
            </>
          ) : (
            <>
              <Icon name="rocket" />
              Publish
            </>
          )}
        </button>
      </div>
    </section>
  )
}
