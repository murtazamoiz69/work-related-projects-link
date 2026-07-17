import type { Client } from '@/features/clients'
import { formatCheckIn } from '@/features/clients'
import type { TimelineEntry } from '../types'

/** Activity tab: the cross-program event log, most recent first. */
export function ActivityTab({
  client,
  timeline,
}: {
  client: Client
  timeline: TimelineEntry[]
}) {
  const sorted = [...timeline].sort((a, b) => a.days - b.days)
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Recent Activity</h2>
          <p className="panel-sub">Everything logged for this client</p>
        </div>
      </div>
      <ul className="timeline">
        {sorted.map((t, i) => (
          <li className="timeline-item" key={i}>
            <span
              className="avatar avatar-xs"
              style={{ background: client.color }}
            >
              {client.initials}
            </span>
            <div className="timeline-body">
              <p>{t.text}</p>
              <span className="timeline-time">{formatCheckIn(t.days)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
