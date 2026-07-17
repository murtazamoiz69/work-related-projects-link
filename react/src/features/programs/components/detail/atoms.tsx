import { Icon } from '@/components/atoms/Icon'
import { useMiniTooltip } from '@/hooks/useMiniTooltip'
import type { WorkoutWeek, DietWeek } from '../../types'

// Overview / Analytics stat card — same info-tooltip pattern as the dashboard's
// KPI cards, so every stat explains what it measures on hover.
export function OvStatCard({
  icon,
  value,
  label,
  tooltip,
}: {
  icon: string
  value: string | number
  label: string
  tooltip: string
}) {
  const { show, hide, tooltip: tip } = useMiniTooltip()
  return (
    <div className="ov-stat-card">
      <button
        className="kpi-info"
        aria-label={`What is ${label}?`}
        onMouseEnter={(e) => show(e, tooltip)}
        onMouseLeave={hide}
      >
        <Icon name="info" />
      </button>
      <span className="ov-stat-icon">
        <Icon name={icon} />
      </span>
      <span className="ov-stat-value">{value}</span>
      <span className="ov-stat-label">{label}</span>
      {tip}
    </div>
  )
}

// A row of week chips (Workout / Diet plan tabs).
export function WeekRail({
  weeks,
  activeWeek,
  onSelect,
}: {
  weeks: Array<WorkoutWeek | DietWeek>
  activeWeek: number
  onSelect: (weekNum: number) => void
}) {
  return (
    <div className="prog-week-rail">
      {weeks.map((w) => (
        <button
          key={w.weekNum}
          className={`pw-week-chip${w.weekNum === activeWeek ? ' active' : ''}`}
          onClick={() => onSelect(w.weekNum)}
        >
          Week {w.weekNum}
        </button>
      ))}
    </div>
  )
}
