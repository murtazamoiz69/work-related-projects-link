// Plan Workspace service — load + save a client's workspace through the shared
// HTTP client. Maps the wire DTO (ISO dates) to the domain Workspace (Date).
import { get, put } from '@/lib/api/client'
import type { ClinicalProfile, PlanVersion, Workspace } from '../types'
import { toWorkspaceDto } from './plan.mock'
import type { WorkspaceDto } from './plan.types'

export function toWorkspace(dto: WorkspaceDto): Workspace {
  const profile: ClinicalProfile = {
    ...dto.profile,
    programStart: new Date(dto.profile.programStart),
  }
  const versions: PlanVersion[] = dto.versions.map((v) => ({
    ...v,
    date: new Date(v.date),
  }))
  return { ...dto, profile, versions }
}

export async function getPlan(
  clientId: string,
  signal?: AbortSignal,
): Promise<Workspace> {
  const dto = await get<WorkspaceDto>(`/clients/${clientId}/plan`, { signal })
  return toWorkspace(dto)
}

export async function savePlan(
  clientId: string,
  ws: Workspace,
): Promise<Workspace> {
  const dto = await put<WorkspaceDto>(
    `/clients/${clientId}/plan`,
    toWorkspaceDto(ws),
  )
  return toWorkspace(dto)
}
