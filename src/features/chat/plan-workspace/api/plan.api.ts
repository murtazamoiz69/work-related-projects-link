// Plan Workspace service — load + save a client's workspace through the shared
// HTTP client. Maps the wire DTO (ISO dates, string `bmi`, nullable profile
// measurements) to the domain Workspace (Date, number, non-null).
import { get, put } from '@/lib/api/client'
import type { InternalNote } from '@/features/client-detail'
import type { ClinicalProfile, PlanVersion, Workspace } from '../types'
import type { ClinicalProfileDto, WorkspaceDto } from './plan.types'

const DAY_MS = 24 * 60 * 60 * 1000
const daysSince = (iso: string): number =>
  Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / DAY_MS))

/** Anchor every note to an absolute `createdAt` so its age keeps ticking. A
 *  legacy note that only has `days` is anchored from that; from then on it ages
 *  from its `createdAt`. `days` is refreshed to stay consistent on the way out. */
function toNote(n: InternalNote): InternalNote {
  const createdAt =
    n.createdAt ?? new Date(Date.now() - (n.days ?? 0) * DAY_MS).toISOString()
  return { ...n, createdAt, days: daysSince(createdAt) }
}

/** Wire profile -> domain profile. The backend models the measurements as
 *  nullable (a client mid-onboarding) and `bmi` as a string; the UI wants
 *  numbers, so coerce with sane fallbacks rather than widen every read site. */
function toProfile(dto: ClinicalProfileDto): ClinicalProfile {
  return {
    ...dto,
    programStart: new Date(dto.programStart),
    bmi: Number(dto.bmi ?? 0) || 0,
    age: dto.age ?? 0,
    gender: dto.gender ?? 'Female',
    heightCm: dto.heightCm ?? 0,
    weightKg: dto.weightKg ?? 0,
    targetWeightKg: dto.targetWeightKg ?? 0,
    // Absent on a real response; the prototype plan builders that read it never
    // run against real data.
    _seed: dto._seed ?? 0,
  }
}

/** Domain profile -> wire profile: Date back to ISO, `bmi` back to a string. */
function fromProfile(profile: ClinicalProfile): ClinicalProfileDto {
  return {
    ...profile,
    programStart: profile.programStart.toISOString(),
    bmi: String(profile.bmi),
  }
}

export function toWorkspace(dto: WorkspaceDto): Workspace {
  const versions: PlanVersion[] = dto.versions.map((v) => ({
    ...v,
    date: new Date(v.date),
  }))
  // `notes` default guards plans saved before the field existed.
  return {
    ...dto,
    profile: toProfile(dto.profile),
    versions,
    notes: (dto.notes ?? []).map(toNote),
  }
}

export function toWorkspaceDto(ws: Workspace): WorkspaceDto {
  return {
    ...ws,
    profile: fromProfile(ws.profile),
    versions: ws.versions.map((v) => ({ ...v, date: v.date.toISOString() })),
    // Send `createdAt` (the real anchor) plus a freshly computed `days` so the
    // wire stays valid for a backend that still only knows about `days`.
    notes: ws.notes.map(toNote),
  }
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
