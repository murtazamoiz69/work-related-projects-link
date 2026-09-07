// Mock backend for the single global program. Stateful (like nutritionists):
// edits and the availability toggle persist in an in-session store, so autosave
// behaves like a real backend. Seeded from the TRAINING_PROGRAMS seed (mapped
// Date -> ISO, slimmed to the fields the UI uses). Reset with
// resetProgramStore() in tests.
//
// The program object carries only identity + timeline + availability + enrolled
// count. Workout and diet content live under their own rich-text endpoints
// (workoutPlan.*, dietPlan.*).
import { TRAINING_PROGRAMS } from '../store'
import type { ProgramDto, UpdateProgramBody } from './programs.types'

function seed(): ProgramDto {
  const p = TRAINING_PROGRAMS[0]
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    durationWeeks: p.durationWeeks,
    enabled: p.enabled,
    enrolledCount: p.enrolledCount,
    createdAt: p.createdDate.toISOString(),
    updatedAt: p.updatedDate.toISOString(),
  }
}

// The mock is backed by localStorage so program edits survive a page reload —
// matching the original prototype's behavior (the program was the one entity
// that persisted). The real backend will own persistence; this only makes the
// mock demo/dev experience faithful.
//
// The stored copy is stamped with a signature of the seed it came from. Change
// the programme's identity in data.ts — its name or length — and every
// browser's cached copy is recognised as stale and thrown away on the next
// load. Without this a machine that had run the app once kept showing the old
// programme forever, which is exactly what happened when Diwali Glow replaced
// the previous seed.
const STORAGE_KEY = 'nws_mock_program'

type StoredProgram = { seed: string; program: ProgramDto }

// Keys from before the cache was seed-versioned. A browser that ran the older
// build still holds them; they are ignored either way, so clear them rather
// than leave dead copies of a retired programme sitting in storage.
const LEGACY_KEYS = ['nws_mock_program_v1', 'nourish_training_programs']
try {
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
} catch {
  /* storage unavailable — nothing to clean up */
}

function seedSignature(p: ProgramDto): string {
  return `${p.name}|${p.durationWeeks}`
}

function load(currentSeed: ProgramDto): ProgramDto | null {
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

function persist(p: ProgramDto): void {
  try {
    const stored: StoredProgram = { seed: seedSignature(seed()), program: p }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    /* storage unavailable — edits just won't survive a reload */
  }
}

const seeded = seed()
let program: ProgramDto = load(seeded) ?? seeded

export function resetProgramStore(): void {
  program = seed()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function getProgramDto(): ProgramDto {
  return program
}

export function setProgramDto(body: UpdateProgramBody): ProgramDto {
  program = {
    ...program,
    name: body.name,
    description: body.description,
    durationWeeks: body.durationWeeks,
    updatedAt: new Date().toISOString(),
  }
  persist(program)
  return program
}

export function setProgramAvailability(enabled: boolean): ProgramDto {
  program = { ...program, enabled, updatedAt: new Date().toISOString() }
  persist(program)
  return program
}
