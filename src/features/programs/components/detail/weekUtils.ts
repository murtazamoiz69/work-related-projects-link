import type { DietWeek, WorkoutWeek } from '../../types'

// pdState.activeWeek is shared across the Workout and Diet Plan tabs; fall back
// to week 1 when the remembered week doesn't exist in the current plan.
export function resolveActiveWeek(
  weeks: Array<WorkoutWeek | DietWeek>,
  activeWeek: number,
): number {
  return activeWeek && weeks.some((w) => w.weekNum === activeWeek)
    ? activeWeek
    : 1
}
