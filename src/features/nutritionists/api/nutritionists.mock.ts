// Mock backend for the nutritionists endpoints. Unlike the clients mock, this
// one is STATEFUL: create / edit / access changes mutate an in-session store so
// the roster behaves like a real backend (a newly added nutritionist stays
// after the list refetches). Reset between tests with resetNutritionistStore().
// Fixtures derive from the shared NUTRITIONISTS_DATA seed (Date -> ISO). MSW
// handlers (nutritionists.handlers.ts) serve from here.
import { CLIENTS_DATA } from '@/features/clients'
import { getInitials } from '@/lib/utils'
import { NUTRITIONISTS_DATA } from '../data'
import type { Nutritionist } from '../types'
import type {
  ListNutritionistsParams,
  NutritionistDto,
  NutritionistFormBody,
  NutritionistMemberDto,
} from './nutritionists.types'

const AVATAR_COLORS = [
  '#2F5D50',
  '#55789D',
  '#AF5688',
  '#8A5FBF',
  '#A3672E',
  '#3C8260',
  '#4A7A9D',
  '#786CA4',
  '#39816E',
  '#BE4F70',
]

function toDto(n: Nutritionist): NutritionistDto {
  return { ...n, joinDate: n.joinDate.toISOString() }
}

function seed(): NutritionistDto[] {
  return NUTRITIONISTS_DATA.map(toDto)
}

// In-session mutable store — the mock "database".
let store: NutritionistDto[] = seed()

/** Restore the store to its seeded state (call in test setup for isolation). */
export function resetNutritionistStore(): void {
  store = seed()
}

export function findNutritionist(id: string): NutritionistDto | undefined {
  return store.find((n) => n.id === id)
}

export function createNutritionist(
  body: NutritionistFormBody,
): NutritionistDto {
  const dto: NutritionistDto = {
    id: `nut-new-${Date.now()}`,
    name: body.name,
    initials: getInitials(body.name, 'N'),
    color: AVATAR_COLORS[store.length % AVATAR_COLORS.length] ?? '#2F5D50',
    email: body.email,
    phone: body.phone,
    qualification: body.qualification,
    experienceYears: body.experienceYears,
    joinDate: new Date().toISOString(),
    memberIds: [],
    accessEnabled: true,
  }
  store = [dto, ...store]
  return dto
}

export function updateNutritionist(
  id: string,
  patch: Partial<NutritionistDto>,
): NutritionistDto | undefined {
  const current = findNutritionist(id)
  if (!current) return undefined
  const next: NutritionistDto = {
    ...current,
    ...patch,
    initials: patch.name ? getInitials(patch.name, 'N') : current.initials,
  }
  store = store.map((n) => (n.id === id ? next : n))
  return next
}

// ---------------------------------------------------------------------------
// Caseload assignment. Every user belongs to exactly one nutritionist, and this
// module owns that relationship because it owns `memberIds`. The clients
// handlers reach these through a dynamic import — a static one would close the
// loop nutritionists/data.ts -> @/features/clients -> clients.mock and leave
// CLIENTS_DATA undefined while it's still initialising.
// ---------------------------------------------------------------------------

/** The nutritionist a user is assigned to, as the clients API embeds it. */
export type AssignedNutritionistDto = {
  id: string
  name: string
  initials: string
  color: string
}

function toAssignment(n: NutritionistDto): AssignedNutritionistDto {
  return { id: n.id, name: n.name, initials: n.initials, color: n.color }
}

/** Assignments for a page of users, keyed by client id. Built in one pass over
 *  the roster rather than a lookup per user, so listing a page stays O(n). */
export function assignmentsFor(
  clientIds: string[],
): Map<string, AssignedNutritionistDto> {
  const wanted = new Set(clientIds)
  const out = new Map<string, AssignedNutritionistDto>()
  for (const n of store) {
    for (const memberId of n.memberIds) {
      if (wanted.has(memberId)) out.set(memberId, toAssignment(n))
    }
  }
  return out
}

/** Round-robin by load: the next user goes to whoever currently has the fewest,
 *  ties broken by roster order. Balancing against the live count rather than a
 *  rotating cursor means it also pulls an already-lopsided roster back level as
 *  users are added, instead of preserving the imbalance. Disabled nutritionists
 *  are skipped — they can't take on a caseload. Returns null when nobody can. */
export function assignLeastLoaded(
  clientId: string,
): AssignedNutritionistDto | null {
  let target: NutritionistDto | null = null
  for (const n of store) {
    if (!n.accessEnabled) continue
    if (!target || n.memberIds.length < target.memberIds.length) target = n
  }
  if (!target) return null
  target.memberIds = [...target.memberIds, clientId]
  return toAssignment(target)
}

export function membersFor(memberIds: string[]): NutritionistMemberDto[] {
  return memberIds
    .map((id) => CLIENTS_DATA.find((c) => c.id === id))
    .filter((c): c is (typeof CLIENTS_DATA)[number] => Boolean(c))
    .map((c) => ({
      id: c.id,
      name: c.name,
      initials: c.initials,
      color: c.color,
      email: c.email,
    }))
}

function haystack(n: NutritionistDto): string {
  return `${n.name} ${n.email} ${n.qualification}`.toLowerCase()
}

/** Filtered + name-sorted view of the current store. */
export function filterNutritionists(
  params: ListNutritionistsParams,
): NutritionistDto[] {
  const { search, status = 'all' } = params
  const q = search?.trim().toLowerCase() ?? ''

  const filtered = store.filter((n) => {
    if (status === 'active' && !n.accessEnabled) return false
    if (status === 'disabled' && n.accessEnabled) return false
    if (q && !haystack(n).includes(q)) return false
    return true
  })

  return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
}
