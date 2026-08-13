// Programs module — shared data model for the Programs library and the
// Program Detail workspace (and, later, the Chat screen). Ported from V2's
// programs-data.js. Everything is generated once and mutated in place as the
// nutritionist creates/edits/assigns — there is no backend, this is the app's
// in-memory source of truth for the session, mirrored to localStorage.

export type ProgramGoal =
  'Fat Loss' | 'Muscle Gain' | 'Bulk' | 'PCOS' | 'Diabetes' | 'General Fitness'

export type ProgramDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type MemberStatus = 'active' | 'paused' | 'completed'

export type MealSlot = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'

export type Exercise = {
  id: string
  name: string
  muscle: string
  equipment: string
  instructions: string
}

export type WorkoutSlot = {
  uid: string
  exerciseId: string
  sets: number
  reps: string
  weight: string
  rest: string
  tempo: string
  rpe: number
  notes: string
}

export type Workout = {
  uid: string
  name: string
  muscle: string
  description: string
  estimatedMinutes: number
  // 'Beginner' | 'Intermediate' | 'Advanced' | 'Light' (deload weeks)
  difficulty: string
  caloriesBurn: number
  warmup: string
  cooldown: string
  exercises: WorkoutSlot[]
}

export type WorkoutDay = {
  dayNum: number
  label: string
  type: 'rest' | 'workout'
  workout: Workout | null
}

export type WorkoutWeek = {
  weekNum: number
  days: WorkoutDay[]
  isDeload?: boolean
}

export type Meal = {
  id: string
  category: MealSlot
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  servingSize: string
  prepTime: string
  ingredients: string[]
  steps: string[]
}

export type MealEntry = {
  uid: string
  mealId: string
  slot: MealSlot
  time: string
}

export type DietDay = {
  dayNum: number
  label: string
  meals: MealEntry[]
}

export type DietWeek = {
  weekNum: number
  days: DietDay[]
}

export type NutritionTargets = {
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
}

export type ProgramNote = {
  author: string
  text: string
  days: number
}

export type MemberOverrides = {
  workouts: number
  meals: number
}

export type ProgramMember = {
  clientId: string
  currentWeek: number
  progressPct: number
  currentWeight: number
  assignedDate: Date
  lastActive: number
  status: MemberStatus
  notes: ProgramNote[]
  overrides: MemberOverrides
}

export type ActivityItem = {
  text: string
  days: number
}

export type VersionHistoryItem = {
  version: string
  text: string
  days: number
}

export type MealTotals = {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export type TrainingProgram = {
  id: string
  name: string
  description: string
  goal: ProgramGoal
  difficulty: ProgramDifficulty
  durationWeeks: number
  coach: string
  /** Program availability — the single global program's Active/Disabled toggle. */
  enabled: boolean
  createdDate: Date
  updatedDate: Date
  version: string
  members: ProgramMember[]
  activeUsers: number
  completionRate: number
  workoutWeeks: WorkoutWeek[]
  dietWeeks: DietWeek[]
  nutritionTargets: NutritionTargets
  notes: ProgramNote[]
  activity: ActivityItem[]
  versionHistory: VersionHistoryItem[]
}
