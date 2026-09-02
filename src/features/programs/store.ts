// Session persistence for the (mock) training program store.
//
// Kept OUT of data.ts on purpose: the eager `TRAINING_PROGRAMS` initializer
// reads localStorage at module load, which is a side effect that marks the
// whole module impure and disables tree-shaking. With it here, data.ts (the
// exercise/meal/workout libraries + builders) stays side-effect-free, so
// importing a single small const from it no longer drags the entire ~190 kB
// library into a lazy chunk.
//
// No backend — the seeded array would otherwise regenerate on every load, so it
// is mirrored into localStorage after every mutation and restored on the next.
import type { TrainingProgram } from './types'
import { buildProgram } from './data'

const PROGRAMS_STORAGE_KEY = 'nourish_training_programs'
const PROGRAM_DATE_KEYS = ['createdDate', 'updatedDate', 'assignedDate']

function reviveProgramDates(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(reviveProgramDates)
    return
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    Object.keys(obj).forEach((k) => {
      if (PROGRAM_DATE_KEYS.includes(k) && typeof obj[k] === 'string') {
        obj[k] = new Date(obj[k] as string)
      } else {
        reviveProgramDates(obj[k])
      }
    })
  }
}

export function saveTrainingPrograms(programs: TrainingProgram[]): void {
  try {
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs))
  } catch {
    /* storage unavailable — edits just won't survive a reload */
  }
}

function loadStoredPrograms(): TrainingProgram[] | null {
  try {
    const raw = localStorage.getItem(PROGRAMS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    reviveProgramDates(parsed)
    return parsed as TrainingProgram[]
  } catch {
    return null
  }
}

// There is only ever one program.
export function seedTrainingPrograms(): TrainingProgram[] {
  return [buildProgram(0)]
}

// The session's program — restored from localStorage or freshly seeded.
// Only the first entry is ever used; a browser that still has an old
// multi-program array (or a pre-`enabled` entry) falls back safely.
const restoredPrograms = loadStoredPrograms()
export const TRAINING_PROGRAMS: TrainingProgram[] = restoredPrograms?.length
  ? [{ ...restoredPrograms[0], enabled: restoredPrograms[0].enabled ?? true }]
  : seedTrainingPrograms()
