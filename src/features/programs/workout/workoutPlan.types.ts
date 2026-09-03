// The workout-plan model for Diwali Glow.
//
// Deliberately the same shape as the diet plan next door: a week is authored as
// prose in a rich-text editor rather than assembled from a structured exercise
// library. The reason is the same one that drove the diet sheet — what a coach
// actually writes for a day is a mix of things a schema keeps fighting: a warm
// up, a superset, a note about form, a link to the video for a movement nobody
// can spell. HTML carries all of it, and it is what the AI engine reads.
//
// Unlike the diet plan there is no per-user filtering here. A user's copy
// starts as the programme's week and diverges only when a nutritionist edits it
// for them.

/** What a day is for. Drives the icon and the chip, nothing else — a "cardio"
 *  day is not structurally different from a "workout" one. */
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

/** Day 1 is Monday. The programme runs on calendar weeks, so the labels are
 *  fixed rather than "Day 1…Day 7". */
export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export function weekdayName(dayNum: number): string {
  return WEEKDAY_NAMES[dayNum - 1] ?? `Day ${dayNum}`
}

/** One day of a week. `label` is the coach's name for it ("Push Day", "Zone 2
 *  Cardio") and `body` is the rich-text session — exercises, sets and the video
 *  link for each movement. */
export type WorkoutDaySheet = {
  dayNum: number
  label: string
  type: WorkoutDayType
  body: string
}

export type WorkoutWeekSheet = {
  weekNum: number
  days: WorkoutDaySheet[]
  updatedAt: Date
}

/** A user's own copy of a week. `edited` flags a week the nutritionist has
 *  changed for this user, so the UI can say it no longer tracks the programme. */
export type ClientWorkoutWeek = WorkoutWeekSheet & {
  clientId: string
  edited: boolean
}

/** A day nobody has authored yet: no name, no session. Weeks 2-6 ship like this
 *  and are filled in directly or copied across with Duplicate. */
export function isBlankDay(day: WorkoutDaySheet): boolean {
  return !day.label.trim() && !day.body.trim()
}

export function isBlankWeek(week: { days: WorkoutDaySheet[] }): boolean {
  return week.days.every(isBlankDay)
}
