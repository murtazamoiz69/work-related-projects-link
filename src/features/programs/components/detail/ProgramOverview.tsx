import { Icon } from '@/components/atoms/Icon'
import { formatJoinDate } from '@/features/clients'
import type { Program } from '../../types'

// Read-only summary of the single global program — name, description,
// availability, duration, and the informational (non-manageable) enrolled
// count. No assignment control lives here; that's the Users section's job.
export function ProgramOverview({
  program: p,
  enrolledCount,
}: {
  program: Program
  enrolledCount: number
}) {
  return (
    <section className="panel prog-overview-card">
      <h1 className="prog-overview-name">{p.name}</h1>
      <p className="prog-overview-desc">{p.description}</p>
      <div className="prog-overview-status">
        <span className={`status-dot${p.enabled ? ' is-active' : ''}`} />
        <span>{p.enabled ? 'Active' : 'Disabled'}</span>
      </div>
      <div className="prog-overview-meta">
        <span>
          <Icon name="calendar-range" />
          Duration: {p.durationWeeks} weeks
        </span>
        <span>
          <Icon name="calendar-clock" />
          Last updated: {formatJoinDate(p.updatedAt)}
        </span>
        <span>
          <Icon name="users" />
          {enrolledCount} users enrolled
        </span>
      </div>
    </section>
  )
}
