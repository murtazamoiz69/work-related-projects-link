export * from './types'
export {
  PROGRAM_GOALS,
  PROGRAM_DIFFICULTIES,
  PROGRAM_DURATIONS,
  MEAL_SLOTS,
  EXERCISE_LIBRARY,
  MEAL_LIBRARY,
  WORKOUT_TEMPLATES,
  exerciseById,
  mealById,
  mealsByCategory,
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
  saveTrainingPrograms,
  seedTrainingPrograms,
  TRAINING_PROGRAMS,
  type WorkoutTemplate,
} from './data'

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
