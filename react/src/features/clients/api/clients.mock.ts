// Mock backend fixtures + scenario responses for the clients endpoints.
// This is the ONLY place clients mock data lives — never inside a component.
// The fixtures are DERIVED from the shared CLIENTS_DATA seed (mapped to the
// wire shape: Date -> ISO string) so the Users page shows the same people as
// every other screen that still reads CLIENTS_DATA directly. MSW handlers
// (clients.handlers.ts) serve from these; unit tests exercise them too.
import type { ApiError } from '@/lib/api/types'
import { CLIENTS_DATA } from '../data'
import type { Client } from '../types'
import type {
  ClientDto,
  ClientsSummaryDto,
  ListClientsParams,
  PaginatedClientsDto,
} from './clients.types'

const DAY_MS = 86_400_000

/** Domain `Client` (Date fields) -> wire `ClientDto` (ISO strings). Exported so
 *  other features (e.g. dashboard) can embed a client in their own responses. */
export function toClientDto(c: Client): ClientDto {
  return {
    ...c,
    expiryDate: c.expiryDate.toISOString(),
    joinDate: c.joinDate.toISOString(),
  }
}

// The full seeded roster as the backend would send it. Already covers the edge
// cases the UI must handle — nullable adherence/checkInDays (new users),
// expired / expiring-soon / active expiries, disabled and paused users, and
// realistic program ↔ plan relationships — because CLIENTS_DATA does.
export const CLIENT_FIXTURES: ClientDto[] = CLIENTS_DATA.map(toClientDto)

// Calendar-day difference between now and an ISO date — negative once past.
// Mirrors features/clients/utils.ts `daysUntil`, on the wire (string) shape.
function daysUntilIso(iso: string): number {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - start.getTime()) / DAY_MS)
}

function haystack(c: ClientDto): string {
  return `${c.name} ${c.email} ${c.program} ${c.diet} ${c.goals.join(' ')}`.toLowerCase()
}

/** Apply the roster's search/status/expiry filters + default expiry sort to the
 *  fixtures — the same semantics the current ClientsPage computes client-side,
 *  moved to the (mock) server boundary. */
export function filterClientFixtures(params: ListClientsParams): ClientDto[] {
  const { search, status = 'all', expiry = 'all' } = params
  const q = search?.trim().toLowerCase() ?? ''

  const filtered = CLIENT_FIXTURES.filter((c) => {
    if (status === 'active' && !c.accessEnabled) return false
    if (status === 'disabled' && c.accessEnabled) return false
    if (expiry !== 'all') {
      const d = daysUntilIso(c.expiryDate)
      if (expiry === 'expiring-soon' && !(d >= 0 && d <= 14)) return false
      if (expiry === 'expired' && d >= 0) return false
      if (expiry === 'active' && d <= 14) return false
    }
    if (q && !haystack(c).includes(q)) return false
    return true
  })

  // Soonest-expiring first (default sort).
  return [...filtered].sort(
    (a, b) => daysUntilIso(a.expiryDate) - daysUntilIso(b.expiryDate),
  )
}

export function summarizeClientFixtures(): ClientsSummaryDto {
  let active = 0
  let disabled = 0
  let expiringSoon = 0
  let expired = 0
  for (const c of CLIENT_FIXTURES) {
    if (c.accessEnabled) active += 1
    else disabled += 1
    const d = daysUntilIso(c.expiryDate)
    if (d < 0) expired += 1
    else if (d <= 14) expiringSoon += 1
  }
  return {
    total: CLIENT_FIXTURES.length,
    active,
    disabled,
    expiringSoon,
    expired,
  }
}

// ---------------------------------------------------------------------------
// The nine canonical response scenarios for the clients endpoints — concrete,
// realistic examples used by tests and as living documentation of what each
// endpoint can return. (Success/empty are shaped by `filterClientFixtures`;
// the failures are the normalized ApiError the transport rejects with.)
// ---------------------------------------------------------------------------
export const clientsScenarios = {
  /** 2. Successful, populated page. */
  successPage: (): PaginatedClientsDto => ({
    items: CLIENT_FIXTURES.slice(0, 5),
    total: CLIENT_FIXTURES.length,
    page: 1,
    pageSize: 5,
  }),
  /** 3. Empty result set (valid query, nothing matches). */
  empty: (): PaginatedClientsDto => ({
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
  }),
  /** 4. Validation error (e.g. extend expiry with a past date). */
  validation: (): ApiError => ({
    kind: 'validation',
    status: 422,
    message: 'The request could not be processed.',
    fields: { expiryDate: 'Expiry must be a valid date in the future.' },
  }),
  /** 5. Unauthorized (no / expired session). */
  unauthorized: (): ApiError => ({
    kind: 'unauthorized',
    status: 401,
    message: 'Your session has expired. Please sign in again.',
  }),
  /** 6. Forbidden (signed in, not this caller's user). */
  forbidden: (): ApiError => ({
    kind: 'forbidden',
    status: 403,
    message: 'You do not have access to this user.',
  }),
  /** 7. Not found. */
  notFound: (): ApiError => ({
    kind: 'not-found',
    status: 404,
    message: 'User not found.',
  }),
  /** 8. Server error. */
  serverError: (): ApiError => ({
    kind: 'server',
    status: 500,
    message: 'Something went wrong on our end. Please try again.',
  }),
  /** 9. Network failure (no response — offline / DNS / CORS). */
  network: (): ApiError => ({
    kind: 'network',
    message: 'Could not reach the server. Check your connection and retry.',
  }),
}
