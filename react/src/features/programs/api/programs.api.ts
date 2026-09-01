// Programs service — loads and persists the single global program through the
// shared HTTP client. Maps wire DTO (ISO dates) <-> domain TrainingProgram
// (Date). See docs/api-guidelines.md.
import { get, patch, put } from '@/lib/api/client'
import type { ProgramMember, TrainingProgram } from '../types'
import { toProgramDto } from './programs.mock'
import type { TrainingProgramDto } from './programs.types'

export function toProgram(dto: TrainingProgramDto): TrainingProgram {
  return {
    ...dto,
    createdDate: new Date(dto.createdDate),
    updatedDate: new Date(dto.updatedDate),
    members: dto.members.map((m): ProgramMember => ({
      ...m,
      assignedDate: new Date(m.assignedDate),
    })),
  }
}

/** `GET /program` — the current global program. */
export async function getProgram(
  signal?: AbortSignal,
): Promise<TrainingProgram> {
  const dto = await get<TrainingProgramDto>('/program', { signal })
  return toProgram(dto)
}

/** `PUT /program` — persist the whole program (autosave). */
export async function updateProgram(
  program: TrainingProgram,
): Promise<TrainingProgram> {
  const dto = await put<TrainingProgramDto>('/program', toProgramDto(program))
  return toProgram(dto)
}

/** `PATCH /program/availability` — enable/disable the program. */
export async function updateProgramAvailability(
  enabled: boolean,
): Promise<TrainingProgram> {
  const dto = await patch<TrainingProgramDto>('/program/availability', {
    enabled,
  })
  return toProgram(dto)
}
