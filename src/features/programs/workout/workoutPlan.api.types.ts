// Workout-plan API contracts — wire shapes (ISO dates) for the programme's
// weeks and the per-user copies. The api module maps these to the domain types
// in workoutPlan.types.ts.
import type { WorkoutDaySheet, WorkoutDayType } from './workoutPlan.types'

export type WorkoutDaySheetDto = WorkoutDaySheet

export type WorkoutWeekSheetDto = {
  weekNum: number
  days: WorkoutDaySheetDto[]
  updatedAt: string
}

export type ClientWorkoutWeekDto = WorkoutWeekSheetDto & {
  clientId: string
  edited: boolean
}

// ---- Requests ----

/** Save one day. The whole day travels — a rename, a type change and an edit to
 *  the session are the same operation as far as the nutritionist is concerned. */
export type SaveWorkoutDayBody = {
  weekNum: number
  dayNum: number
  label: string
  type: WorkoutDayType
  body: string
}

/** Swap two days within a week. Everything moves: name, type and session. */
export type SwapWorkoutDaysBody = {
  weekNum: number
  fromDay: number
  toDay: number
}

export type DuplicateWorkoutWeekBody = {
  fromWeek: number
  toWeeks: number[]
}

export type DuplicateWorkoutWeekResultDto = {
  /** Weeks actually written — out-of-range or self-targets are dropped. */
  weeks: number[]
}
