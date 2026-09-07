import type { ClientStatus } from '@/features/clients'
import type { InternalNote } from '@/features/client-detail'
import type { Meal, MealEntry, Workout } from '@/features/programs'

// The Plan Workspace works on richer week/day shapes than the shared Programs
// model: a workout carries a scheduled time, a day can stack extra workouts,
// and a diet day can be flagged as a refeed/cheat day.
export type WsWorkout = Workout & { time?: string }

export type WsWorkoutDay = {
  dayNum: number
  label: string
  type: 'rest' | 'workout' | 'cardio'
  workout: WsWorkout | null
  extraWorkouts: WsWorkout[]
}

export type WsWorkoutWeek = {
  weekNum: number
  days: WsWorkoutDay[]
}

export type WsDietDay = {
  dayNum: number
  label: string
  meals: MealEntry[]
  cheat?: boolean
}

export type WsDietWeek = {
  weekNum: number
  days: WsDietDay[]
}

export type WsTargets = {
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
  phase: string
}

export type ClinicalProfile = {
  // Profile
  name: string
  initials: string
  color: string
  status: ClientStatus
  age: number
  gender: 'Female' | 'Male'
  heightCm: number
  weightKg: number
  bmi: number
  goal: string
  activityLevel: string
  targetWeightKg: number
  programStart: Date
  currentWeek: number
  program: string
  // Medical
  allergies: string[]
  foodIntolerances: string[]
  medicalConditions: string[]
  injuries: string[]
  pregnancy: string | null
  // Dietary preferences
  dietLabel: string
  isVegan: boolean
  isVegetarian: boolean
  isPescatarian: boolean
  isHalal: boolean
  isJain: boolean
  foodLikes: string[]
  foodDislikes: string[]
  cuisine: string
  budget: string
  mealTiming: string
  // Workout preferences
  location: string
  workoutDuration: string
  workoutDifficulty: string
  preferredTime: string
  physicalLimitations: string[]
  // Progress
  weightLog: number[]
  complianceScore: number | null
  missedCheckIns: number
  waistTrend: number
  photoCount: number
  tenureDays: number
  /** Mock-only: the deterministic RNG seed the prototype plan builders use. Not
   *  on the wire — the real-API mapper fills it with 0 (those builders never run
   *  on real data). */
  _seed: number
}

export type PlanSnapshot = {
  workoutWeeks: WsWorkoutWeek[]
  dietWeeks: WsDietWeek[]
  targets: WsTargets
  supplements: string[]
  hydrationGoal: number
}

export type PlanVersion = {
  id: string
  num: number
  label: string
  editedBy: string
  date: Date
  summary: string
  snapshot: PlanSnapshot
  isInitial: boolean
}

export type Workspace = {
  workoutWeeks: WsWorkoutWeek[]
  dietWeeks: WsDietWeek[]
  targets: WsTargets
  supplements: string[]
  hydrationGoal: number
  planName: string
  planDescription: string
  published: boolean
  versions: PlanVersion[]
  profile: ClinicalProfile
  customMeals?: Meal[]
  /** Nutritionist's private notes on this client, persisted with the plan
   *  (autosaved via PUT, like every other workspace edit). */
  notes: InternalNote[]
}

export type MealTotalsLike = {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export type ConflictLevel = 'hard' | 'soft'
export type Conflict = { level: ConflictLevel; reason: string }

export type PwWarning = {
  level: ConflictLevel
  kind: string
  text: string
  fix: string
  week?: number
  day?: number
  entryUid?: string
}
