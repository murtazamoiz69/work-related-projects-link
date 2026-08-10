import { Icon } from '@/components/atoms/Icon'
import type { BroadcastSummary } from '../data'

const CARDS: { key: keyof BroadcastSummary; icon: string; label: string }[] = [
  { key: 'total', icon: 'megaphone', label: 'Total Broadcasts' },
  { key: 'scheduled', icon: 'calendar-clock', label: 'Scheduled' },
  { key: 'published', icon: 'check-circle-2', label: 'Published' },
]

export function BroadcastSummaryCards({
  summary,
}: {
  summary: BroadcastSummary
}) {
  return (
    <div className="dash-kpi-grid cols-3" aria-label="Broadcast summary">
      {CARDS.map((c) => (
        <div className="dash-kpi-card accent-green" key={c.key}>
          <span className="dash-kpi-icon">
            <Icon name={c.icon} />
          </span>
          <span className="dash-kpi-body">
            <span className="dash-kpi-value">{summary[c.key]}</span>
            <span className="dash-kpi-label">{c.label}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
