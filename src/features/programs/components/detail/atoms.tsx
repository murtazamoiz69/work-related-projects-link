import type { WorkoutWeek, DietWeek } from '../../types'

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
