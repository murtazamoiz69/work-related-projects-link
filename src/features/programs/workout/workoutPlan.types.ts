// The workout-plan model for Diwali Glow.
//
// A programme is a flat, ordered run of **days** — Day 1, Day 2, … — not
// calendar weeks. Different programmes run different lengths (20, 25, 30 days),
// and we don't know which weekday a user starts on, so the plan is authored as
// "day N" and the nutritionist adds days as far as the programme needs.
//
// Each day is authored as prose in a rich-text editor rather than assembled
// from a structured exercise library — a coach writes a warm-up, a superset, a
// form note, and HTML carries all of it (and it's what the AI engine reads). A
// small type chip (workout / cardio / rest) tags the day for scanning; it
// drives the icon and label, nothing structural.
//
// There is no per-user filtering here: a user's copy starts as the programme's
// day verbatim and diverges only when a nutritionist edits it for them.

/** What a day is for. Drives the icon and the chip, nothing else. */
export const WORKOUT_DAY_TYPES = ['workout', 'cardio', 'rest'] as const

export type WorkoutDayType = (typeof WORKOUT_DAY_TYPES)[number]

export function isWorkoutDayType(value: unknown): value is WorkoutDayType {
  return WORKOUT_DAY_TYPES.some((t) => t === value)
}

export const WORKOUT_DAY_TYPE_LABEL: Record<WorkoutDayType, string> = {
  workout: 'Workout',
  cardio: 'Cardio',
  rest: 'Rest',
}

export const WORKOUT_DAY_TYPE_ICON: Record<WorkoutDayType, string> = {
  workout: 'dumbbell',
  cardio: 'activity',
  rest: 'moon',
}

/** One day of the programme. `body` is the rich-text session — exercises,
 *  sets and coaching notes, or just a rest-day note. */
export type WorkoutDay = {
  dayNum: number
  type: WorkoutDayType
  body: string
}

export type WorkoutPlan = {
  days: WorkoutDay[]
  updatedAt: Date
}

/** A user's own copy. Each day carries `edited`: true once a nutritionist has
 *  changed it for this user, so it no longer tracks the programme's day. */
export type ClientWorkoutDay = WorkoutDay & { edited: boolean }

export type ClientWorkoutPlan = {
  clientId: string
  days: ClientWorkoutDay[]
  updatedAt: Date
}

/** A day nobody has authored yet: no session. Added days start blank and are
 *  filled in, so an empty day says which still need writing. */
export function isBlankDay(day: { body: string }): boolean {
  return !day.body.trim()
}
