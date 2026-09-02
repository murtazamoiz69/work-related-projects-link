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
const STORAGE_KEY = 'nws_mock_program_v1'

function load(): TrainingProgramDto | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TrainingProgramDto) : null
  } catch {
    return null
  }
}

function persist(p: TrainingProgramDto): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable — edits just won't survive a reload */
  }
}

let program: TrainingProgramDto = load() ?? seed()

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
