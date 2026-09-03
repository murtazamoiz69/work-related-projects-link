// Mock backend for the single global program. Stateful (like nutritionists):
// edits and the availability toggle persist in an in-session store, so autosave
// behaves like a real backend. Seeded from the TRAINING_PROGRAMS seed (mapped
// Date -> ISO). Reset with resetProgramStore() in tests.
//
// NOTE: the exercise / meal / workout-template LIBRARIES stay local reference
// data (features/programs/data.ts) — they are a static, non-editable catalog
// resolved synchronously all over the UI (macro totals, names). Moving them
// behind /libraries endpoints is a separate, larger step.
import { TRAINING_PROGRAMS } from '../store'
import type { TrainingProgram } from '../types'
import type { ProgramMemberDto, TrainingProgramDto } from './programs.types'

export function toProgramDto(p: TrainingProgram): TrainingProgramDto {
  return {
    ...p,
    createdDate: p.createdDate.toISOString(),
    updatedDate: p.updatedDate.toISOString(),
    members: p.members.map((m): ProgramMemberDto => ({
      ...m,
      assignedDate: m.assignedDate.toISOString(),
    })),
  }
}

function seed(): TrainingProgramDto {
  return toProgramDto(TRAINING_PROGRAMS[0])
}

// The mock is backed by localStorage so program edits survive a page reload —
// matching the original prototype's behavior (the program was the one entity
// that persisted). The real backend will own persistence; this only makes the
// mock demo/dev experience faithful.
//
// The stored copy is stamped with a signature of the seed it came from. Change
// the programme's identity in data.ts — its name, goal or length — and every
// browser's cached copy is recognised as stale and thrown away on the next
// load. Without this a machine that had run the app once kept showing the old
// programme forever, which is exactly what happened when Diwali Glow replaced
// the previous seed.
const STORAGE_KEY = 'nws_mock_program'

type StoredProgram = { seed: string; program: TrainingProgramDto }

// Keys from before the cache was seed-versioned. A browser that ran the older
// build still holds them; they are ignored either way, so clear them rather
// than leave dead copies of a retired programme sitting in storage.
const LEGACY_KEYS = ['nws_mock_program_v1', 'nourish_training_programs']
try {
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
} catch {
  /* storage unavailable — nothing to clean up */
}

function seedSignature(p: TrainingProgramDto): string {
  return `${p.name}|${p.goal}|${p.durationWeeks}`
}

function load(currentSeed: TrainingProgramDto): TrainingProgramDto | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as Partial<StoredProgram>
    if (!stored.program) return null
    if (stored.seed !== seedSignature(currentSeed)) return null
    return stored.program
  } catch {
    return null
  }
}

function persist(p: TrainingProgramDto): void {
  try {
    const stored: StoredProgram = { seed: seedSignature(seed()), program: p }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    /* storage unavailable — edits just won't survive a reload */
  }
}

const seeded = seed()
let program: TrainingProgramDto = load(seeded) ?? seeded

export function resetProgramStore(): void {
  program = seed()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function getProgramDto(): TrainingProgramDto {
  return program
}

export function setProgramDto(next: TrainingProgramDto): TrainingProgramDto {
  program = { ...next, updatedDate: new Date().toISOString() }
  persist(program)
  return program
}

export function setProgramAvailability(enabled: boolean): TrainingProgramDto {
  program = { ...program, enabled, updatedDate: new Date().toISOString() }
  persist(program)
  return program
}
