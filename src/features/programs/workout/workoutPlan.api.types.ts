// Workout-plan API contracts — wire shapes (ISO dates) for the programme's days
// and the per-user copies. The api module maps these to the domain types in
// workoutPlan.types.ts.
import type {
  ClientWorkoutDay,
  WorkoutDay,
  WorkoutDayType,
} from './workoutPlan.types'

export type WorkoutDayDto = WorkoutDay

export type WorkoutPlanDto = {
  days: WorkoutDayDto[]
  updatedAt: string
}

export type ClientWorkoutDayDto = ClientWorkoutDay

export type ClientWorkoutPlanDto = {
  clientId: string
  days: ClientWorkoutDayDto[]
  updatedAt: string
}

// ---- Requests ----

/** Save one day's session to one or more days at once — the single Save,
 *  applied to the days the nutritionist picked. `type` and `body` are the
 *  edited day; every day in `days` is set to them (a copy across). */
export type SaveWorkoutDaysBody = {
  type: WorkoutDayType
  body: string
  days: number[]
}

/** Reset one of a user's days back to the programme's. */
export type ResetClientWorkoutDayBody = {
  day: number
}
