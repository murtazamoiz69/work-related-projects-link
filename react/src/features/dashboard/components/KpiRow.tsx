import { Icon } from '@/components/atoms/Icon'
import { buildKpiCounts } from '../data'

type KpiCard = {
  accent: string
  icon: string
  value: string | number
  label: string
  tooltip: string
}

export function KpiRow() {
  const k = buildKpiCounts()
  const cards: KpiCard[] = [
    {
      accent: 'blue',
      icon: 'users',
      value: k.total,
      label: 'Total Users',
      tooltip: 'Every user currently assigned to your caseload.',
    },
    {
      accent: 'green',
      icon: 'user-plus',
      value: k.newToday,
      label: 'New Users (24h)',
      tooltip: 'Users who joined in the last 24 hours.',
    },
    {
      accent: 'amber',
      icon: 'utensils',
      value: `${k.mealsLogged} / ${k.total}`,
      label: 'Logged Meals Today',
      tooltip:
        "Users who've logged at least one meal today, out of your total caseload.",
    },
    {
      accent: 'coral',
      icon: 'dumbbell',
      value: `${k.workoutsLogged} / ${k.total}`,
      label: 'Logged Workouts Today',
      tooltip:
        "Users who've logged a workout today, out of your total caseload.",
    },
  ]

  return (
    <div className="dash-kpi-grid" aria-label="User roster snapshot">
      {cards.map((c) => (
        <div className={`dash-kpi-card accent-${c.accent}`} key={c.label}>
          <button
            className="kpi-info"
            data-tooltip={c.tooltip}
            aria-label={`What is ${c.label}?`}
          >
            <Icon name="info" />
          </button>
          <span className="dash-kpi-icon">
            <Icon name={c.icon} />
          </span>
          <span className="dash-kpi-body">
            <span className="dash-kpi-value">{c.value}</span>
            <span className="dash-kpi-label">{c.label}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
