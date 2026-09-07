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
// The reference catalogs (EXERCISE_LIBRARY / MEAL_LIBRARY / WORKOUT_TEMPLATES
// and their by-id helpers) live in ./data and are imported from there directly
// by the few modules that need them — they are static seed data, not an API,
// and are kept out of this barrel so unrelated routes don't pull them in.

// API layer
export {
  getProgram,
  updateProgram,
  updateProgramAvailability,
  toProgram,
} from './api/programs.api'
export type {
  ProgramDto,
  UpdateProgramBody,
  UpdateProgramAvailabilityBody,
} from './api/programs.types'

// Query / mutation hooks
export { useProgramQuery } from './hooks/useProgramQuery'
export {
  useUpdateProgram,
  useUpdateProgramAvailability,
} from './hooks/useProgramMutations'
