// Programs service — loads and persists the single global program through the
// shared HTTP client. Maps wire DTO (ISO dates) <-> domain Program (Date).
// See docs/api-guidelines.md.
import { get, patch, put } from '@/lib/api/client'
import type { Program } from '../types'
import type { ProgramDto, UpdateProgramBody } from './programs.types'

export function toProgram(dto: ProgramDto): Program {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    durationWeeks: dto.durationWeeks,
    // A backend that does not serve a start date yet falls back to the
    // programme's creation date, so the run is never undefined.
    startDate: new Date(dto.startDate ?? dto.createdAt),
    enabled: dto.enabled,
    enrolledCount: dto.enrolledCount,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  }
}

/** `GET /program` — the current global program. */
export async function getProgram(signal?: AbortSignal): Promise<Program> {
  const dto = await get<ProgramDto>('/program', { signal })
  return toProgram(dto)
}

/** `PUT /program` — persist the editable program details (autosave). */
export async function updateProgram(program: Program): Promise<Program> {
  const body: UpdateProgramBody = {
    name: program.name,
    description: program.description,
    durationWeeks: program.durationWeeks,
    startDate: program.startDate.toISOString(),
  }
  const dto = await put<ProgramDto>('/program', body)
  return toProgram(dto)
}

/** `PATCH /program/availability` — enable/disable the program. */
export async function updateProgramAvailability(
  enabled: boolean,
): Promise<Program> {
  const dto = await patch<ProgramDto>('/program/availability', { enabled })
  return toProgram(dto)
}
