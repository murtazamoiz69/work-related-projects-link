// Stateful mock backend for the Plan Workspace. The workspace for a client is
// built lazily via the existing getWorkspace/deriveClinicalProfile logic (now
// server-side), then converted to DTO and held in-session so edits persist.
// The clinical profile + client-detail derivations stay local (like the
// Programs libraries) — only the plan itself is served here.
import { CLIENTS_DATA } from '@/features/clients'
import { deriveClinicalProfile } from '../clinical'
import { getWorkspace } from '../plan'
import type { Workspace } from '../types'
import type { WorkspaceDto } from './plan.types'

export function toWorkspaceDto(ws: Workspace): WorkspaceDto {
  return {
    ...ws,
    profile: {
      ...ws.profile,
      programStart: ws.profile.programStart.toISOString(),
    },
    versions: ws.versions.map((v) => ({ ...v, date: v.date.toISOString() })),
  }
}

const store = new Map<string, WorkspaceDto>()

function buildFor(clientId: string): WorkspaceDto | undefined {
  const client = CLIENTS_DATA.find((c) => c.id === clientId)
  if (!client) return undefined
  const ws = getWorkspace(client, deriveClinicalProfile(client))
  return structuredClone(toWorkspaceDto(ws)) as WorkspaceDto
}

export function getPlanDto(clientId: string): WorkspaceDto | undefined {
  if (!store.has(clientId)) {
    const built = buildFor(clientId)
    if (!built) return undefined
    store.set(clientId, built)
  }
  return store.get(clientId)
}

export function setPlanDto(clientId: string, dto: WorkspaceDto): WorkspaceDto {
  store.set(clientId, dto)
  return dto
}

export function resetPlanStore(): void {
  store.clear()
}
