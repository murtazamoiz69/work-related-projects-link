import { create } from 'zustand'
import { TRAINING_PROGRAMS, saveTrainingPrograms } from './data'
import type { TrainingProgram } from './types'

// V2 mutated the in-memory TRAINING_PROGRAMS array in place and re-rendered the
// whole page after each edit. React needs a re-render trigger, so this store
// holds the array plus a `rev` nonce: `commit()` persists + bumps the nonce
// after an in-place mutation (workout/diet/member edits), while `setPrograms()`
// swaps the array reference for add/duplicate/delete/reorder.
type ProgramsState = {
  programs: TrainingProgram[]
  rev: number
  /** Persist + force a re-render after mutating a program object in place. */
  commit: () => void
  /** Replace the program list (create / duplicate / delete), then persist. */
  setPrograms: (
    next: TrainingProgram[] | ((prev: TrainingProgram[]) => TrainingProgram[]),
  ) => void
}

export const useProgramsStore = create<ProgramsState>((set, get) => ({
  programs: TRAINING_PROGRAMS,
  rev: 0,
  commit: () => {
    saveTrainingPrograms(get().programs)
    set((s) => ({ rev: s.rev + 1 }))
  },
  setPrograms: (next) =>
    set((s) => {
      const programs =
        typeof next === 'function' ? next(s.programs) : next
      saveTrainingPrograms(programs)
      return { programs, rev: s.rev + 1 }
    }),
}))
