// Client-side cache for the reference libraries (exercises, meals, workout
// templates), primed once from the API (`GET /libraries`) at app load.
//
// WHY: these catalogs are the source of truth for exercise/meal display data
// ("ex-1" → "Barbell Bench Press", its muscle, ingredients …), consumed by
// synchronous pure logic (pickers, clinical conflict checks) that can't become
// async. So the app fetches them once, primes this module, and every consumer
// reads it — the data comes from the API, not a bundled array.
//
// The exports are **live bindings**: `primeLibraries` reassigns them, and
// importers (directly or via the feature barrel) see the populated values at
// render time. The raw seed arrays in `data.ts` are the mock BACKEND's copy
// (served by the libraries handler, used by the mock's plan/program builders);
// a real backend serves `GET /libraries` and owns those builders.
import type { Exercise, Meal, MealSlot } from './types'
import type { WorkoutTemplate } from './data'

// Live bindings — reassigned by primeLibraries; importers see the populated
// values at render time.
export let EXERCISE_LIBRARY: Exercise[] = []
export let MEAL_LIBRARY: Meal[] = []
export let WORKOUT_TEMPLATES: WorkoutTemplate[] = []

export type Libraries = {
  exercises: Exercise[]
  meals: Meal[]
  workoutTemplates: WorkoutTemplate[]
}

/** Populate the cache from the API response (or the seed, in tests). */
export function primeLibraries(libs: Libraries): void {
  EXERCISE_LIBRARY = libs.exercises
  MEAL_LIBRARY = libs.meals
  WORKOUT_TEMPLATES = libs.workoutTemplates
}

/** True once the libraries have loaded — the authed shell gates on this. */
export function librariesReady(): boolean {
  return EXERCISE_LIBRARY.length > 0
}

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id)
}
export function mealById(id: string): Meal | undefined {
  return MEAL_LIBRARY.find((m) => m.id === id)
}
export function mealsByCategory(category: MealSlot): Meal[] {
  return MEAL_LIBRARY.filter((m) => m.category === category)
}
