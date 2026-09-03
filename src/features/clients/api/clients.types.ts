// Clients API contracts — request params and wire (DTO) response shapes.
// Kept separate from the domain model (`../types.ts`, which uses `Date`) and
// from UI-only types (filter unions used by the roster components). The `api.ts`
// mapper is the single boundary that turns a `ClientDto` (ISO strings) into a
// domain `Client` (Date objects).
import type { ClientStatus } from '../types'
import type { DietProfile } from '@/features/programs/diet/dietPlan.types'
import type { Paginated } from '@/lib/api/types'

// ---- Request types ----

export type ClientStatusFilter = 'all' | 'active' | 'disabled'
export type ClientExpiryFilter = 'all' | 'expiring-soon' | 'expired' | 'active'

export type ListClientsParams = {
  search?: string
  status?: ClientStatusFilter
  expiry?: ClientExpiryFilter
  page?: number
  pageSize?: number
  /** e.g. `'expiry:asc'` (default). */
  sort?: string
}

/** The roster filters as represented in the URL (route search params). Defaults
 *  (`status: 'all'`, `expiry: 'all'`, page 1) are omitted to keep URLs clean. */
export type ClientsSearch = {
  q?: string
  status?: ClientStatusFilter
  expiry?: ClientExpiryFilter
  page?: number
}

export type UpdateClientAccessBody = {
  enabled: boolean
}

export type ExtendClientExpiryBody = {
  /** ISO date string; must be in the future and after the current expiry. */
  expiryDate: string
}

/** What "Add User" actually collects — the same five fields whether the row
 *  came from the individual form or a spreadsheet cell. Everything else on a
 *  `Client` is filled in by the backend at creation time. */
export type CreateClientBody = {
  name: string
  email: string
  phone: string
  /** Must be one of `GET /clients/programs`. */
  program: string
  /** Program length; sets `expiryDate` to now + weeks. */
  weeks: number
}

// ASSUMPTION: bulk import is one round trip per intent, and `dryRun` lets the
// importer preview exactly what a real import would do (same server-side rules,
// nothing persisted) — so the preview table and the committed result can never
// disagree about which rows are valid.
export type BulkCreateClientsBody = {
  users: CreateClientBody[]
  /** Validate only; persist nothing. `created` then lists what *would* be made. */
  dryRun?: boolean
}

/** A row the backend refused, with the reasons to show against it. `row` is the
 *  0-based index into the submitted `users` array. */
export type SkippedClientRow = {
  row: number
  reasons: string[]
}

// ---- Response (wire / DTO) types ----

/** A client exactly as the backend would send it — dates are ISO strings. */
export type ClientDto = {
  id: string
  conversationId: string
  name: string
  initials: string
  color: string
  age: number
  gender: 'Female' | 'Male'
  email: string
  program: string
  plan: string
  status: ClientStatus
  accessEnabled: boolean
  expiryDate: string // ISO
  adherence: number | null
  checkInDays: number | null
  joinDate: string // ISO
  goals: string[]
  diet: string
  /** Only present on users created through "Add User". */
  phone?: string
  /** Onboarding answers that drive the diet plan: the calorie band the user was
   *  placed in, plus the filters the engine narrows the master sheet with. */
  dietProfile?: DietProfile
  /** The nutritionist who owns this user's caseload. Embedded rather than
   *  referenced by id so the roster can render the column without a second
   *  request. `null` only if no nutritionist could take them (all disabled). */
  assignedNutritionist: AssignedNutritionist | null
}

/** Just enough of a nutritionist to render an avatar and a name. */
export type AssignedNutritionist = {
  id: string
  name: string
  initials: string
  color: string
}

export type BulkCreateClientsDto = {
  created: ClientDto[]
  skipped: SkippedClientRow[]
}

export type ClientProgramsDto = {
  programs: string[]
}

export type ClientsSummaryDto = {
  total: number
  active: number
  disabled: number
  expiringSoon: number
  expired: number
}

export type PaginatedClientsDto = Paginated<ClientDto>
