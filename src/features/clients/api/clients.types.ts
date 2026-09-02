// Clients API contracts — request params and wire (DTO) response shapes.
// Kept separate from the domain model (`../types.ts`, which uses `Date`) and
// from UI-only types (filter unions used by the roster components). The `api.ts`
// mapper is the single boundary that turns a `ClientDto` (ISO strings) into a
// domain `Client` (Date objects).
import type { ClientStatus } from '../types'
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
}

export type ClientsSummaryDto = {
  total: number
  active: number
  disabled: number
  expiringSoon: number
  expired: number
}

export type PaginatedClientsDto = Paginated<ClientDto>
