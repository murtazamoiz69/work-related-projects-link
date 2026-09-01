import { Icon } from '@/components/atoms/Icon'
import { useKpisQuery } from '../hooks/useDashboardQueries'

type KpiCard = {
  accent: string
  icon: string
  value: string | number
  label: string
  tooltip: string
}

export function KpiRow() {
  const { data: k, isPending } = useKpisQuery()
  const dash = isPending && !k
  const total = k?.total ?? 0

  const cards: KpiCard[] = [
    {
      accent: 'blue',
      icon: 'users',
      value: dash ? '—' : total,
      label: 'Total Users',
      tooltip: 'Every user currently assigned to your caseload.',
    },
    {
      accent: 'green',
      icon: 'user-plus',
      value: dash ? '—' : (k?.newToday ?? 0),
      label: 'New Users (24h)',
      tooltip: 'Users who joined in the last 24 hours.',
    },
    {
      accent: 'amber',
      icon: 'utensils',
      value: dash ? '—' : `${k?.mealsLogged ?? 0} / ${total}`,
      label: 'Logged Meals Today',
      tooltip:
        "Users who've logged at least one meal today, out of your total caseload.",
    },
    {
      accent: 'coral',
      icon: 'dumbbell',
      value: dash ? '—' : `${k?.workoutsLogged ?? 0} / ${total}`,
      label: 'Logged Workouts Today',
      tooltip:
        "Users who've logged a workout today, out of your total caseload.",
    },
  ]

  return (
    <div
      className="dash-kpi-grid"
      aria-label="User roster snapshot"
      aria-busy={dash || undefined}
    >
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
