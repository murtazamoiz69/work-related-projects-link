// Wire shape for the reference libraries. No date fields, so DTO === domain.
import type { Exercise, Meal } from '../types'
import type { WorkoutTemplate } from '../data'

export type LibrariesDto = {
  exercises: Exercise[]
  meals: Meal[]
  workoutTemplates: WorkoutTemplate[]
}
