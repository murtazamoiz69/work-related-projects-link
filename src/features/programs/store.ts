// The seeded training program.
//
// Kept OUT of data.ts on purpose: this module is what the api layer imports, and
// data.ts (the exercise/workout libraries + builders) stays side-effect-free so
// importing a single small const from it doesn't drag the entire ~190 kB library
// into a lazy chunk.
//
// This used to mirror the program into localStorage and restore it on the next
// load. That is gone: the api mock (`api/programs.mock.ts`) owns persistence
// now, and having a second cache underneath it meant the *seed itself* went
// stale — a browser that had loaded the app once kept serving the old program
// name and duration forever, and no reset could reach it.
import type { TrainingProgram } from './types'
import { buildProgram } from './data'

// There is only ever one program.
export function seedTrainingPrograms(): TrainingProgram[] {
  return [buildProgram(0)]
}

export const TRAINING_PROGRAMS: TrainingProgram[] = seedTrainingPrograms()
