export * from './types'
export {
  PROGRAM_GOALS,
  PROGRAM_DIFFICULTIES,
  PROGRAM_DURATIONS,
  PROGRAM_DURATION_WEEKS,
  MEAL_SLOTS,
  makeSlot,
  buildWorkout,
  buildProgram,
  templateMuscles,
  templateEquipment,
  newMealEntry,
  formatTime12,
  dietDayTotals,
  buildEmptyWorkoutWeek,
  buildEmptyDietWeek,
  buildEmptyWorkoutWeeks,
  buildEmptyDietWeeks,
  type WorkoutTemplate,
} from './data'
export { seedTrainingPrograms, TRAINING_PROGRAMS } from './store'
// Reference libraries — API-populated cache (source of truth is `GET /libraries`,
// not a bundled array). Same names as before; the values are now the live cache.
export {
  EXERCISE_LIBRARY,
  MEAL_LIBRARY,
  WORKOUT_TEMPLATES,
  exerciseById,
  mealById,
  mealsByCategory,
  primeLibraries,
  librariesReady,
  type Libraries,
} from './library-store'
export { useLibrariesQuery } from './hooks/useLibraries'

// API layer
export {
  getProgram,
  updateProgram,
  updateProgramAvailability,
  toProgram,
} from './api/programs.api'
export type {
  TrainingProgramDto,
  ProgramMemberDto,
  UpdateProgramAvailabilityBody,
} from './api/programs.types'

// Query / mutation hooks
export { useProgramQuery } from './hooks/useProgramQuery'
export {
  useUpdateProgram,
  useUpdateProgramAvailability,
} from './hooks/useProgramMutations'
