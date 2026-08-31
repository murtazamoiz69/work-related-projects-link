// Mock backend fixtures + scenario responses for the clients endpoints.
// This is the ONLY place clients mock data lives — never inside a component.
// The `clients.api.ts` service reads from here through the mock transport, and
// MSW handlers will serve from the same fixtures once the network layer lands.
import type { ApiError } from '@/lib/api/types'
import type {
  ClientDto,
  ClientsSummaryDto,
  ListClientsParams,
  PaginatedClientsDto,
} from './clients.types'

// Dates are expressed relative to "now" at module load, as ISO strings, so the
// expiry tiers (expired / expiring-soon / active) stay meaningful whenever the
// mock runs — mirroring how a live backend's dates move with real time.
const DAY_MS = 86_400_000
function isoFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

// A curated roster covering the edge cases the UI must handle:
// - nullable adherence / checkInDays (a brand-new user)
// - expired, expiring-today, expiring-soon, and comfortably-active expiries
// - a disabled user, a paused user, and a long-tenure user
// - realistic program ↔ plan relationships
export const CLIENT_FIXTURES: ClientDto[] = [
  {
    id: 'c-1',
    name: 'Priya Sharma',
    initials: 'PS',
    color: '#C44F3F',
    age: 34,
    gender: 'Female',
    email: 'priya.sharma@email.com',
    program: 'Weight Loss',
    plan: '12-Week Weight Loss Kickstart',
    status: 'attention',
    accessEnabled: true,
    expiryDate: isoFromNow(-3), // expired
    adherence: 42,
    checkInDays: 4,
    joinDate: isoFromNow(-118),
    goals: ['Lose fat', 'Build discipline'],
    diet: 'Low carb',
  },
  {
    id: 'c-2',
    name: 'Marcus Chen',
    initials: 'MC',
    color: '#3B6FA6',
    age: 51,
    gender: 'Male',
    email: 'marcus.chen@email.com',
    program: 'Diabetes Management',
    plan: 'Diabetes-Friendly Meal Plan',
    status: 'attention',
    accessEnabled: true,
    expiryDate: isoFromNow(0), // expires today
    adherence: 58,
    checkInDays: 1,
    joinDate: isoFromNow(-210),
    goals: ['Improve health'],
    diet: 'Mediterranean',
  },
  {
    id: 'c-3',
    name: 'Elena Rodriguez',
    initials: 'ER',
    color: '#8A5FBF',
    age: 29,
    gender: 'Female',
    email: 'elena.rodriguez@email.com',
    program: 'Prenatal Nutrition',
    plan: 'Prenatal Nutrition Essentials',
    status: 'attention',
    accessEnabled: true,
    expiryDate: isoFromNow(5), // expiring soon (warning tier)
    adherence: 66,
    checkInDays: 2,
    joinDate: isoFromNow(-58),
    goals: ['Improve health', 'More energy'],
    diet: 'Vegetarian',
  },
  {
    id: 'c-4',
    name: 'James Okafor',
    initials: 'JO',
    color: '#3C8260',
    age: 26,
    gender: 'Male',
    email: 'james.okafor@email.com',
    program: 'Muscle Gain',
    plan: 'Muscle Gain Progressive Plan',
    status: 'active',
    accessEnabled: true,
    expiryDate: isoFromNow(12), // expiring soon (attention tier)
    adherence: 92,
    checkInDays: 0,
    joinDate: isoFromNow(-150),
    goals: ['Build muscle'],
    diet: 'High protein',
  },
  {
    id: 'c-6',
    name: 'Tom Wilson',
    initials: 'TW',
    color: '#5C6862',
    age: 61,
    gender: 'Male',
    email: 'tom.wilson@email.com',
    program: 'Post-Surgery Recovery',
    plan: 'Post-Surgery Recovery Nutrition',
    status: 'paused',
    accessEnabled: false, // disabled
    expiryDate: isoFromNow(-40),
    adherence: 75,
    checkInDays: null, // paused — no recent check-in data
    joinDate: isoFromNow(-380),
    goals: ['Improve health'],
    diet: 'Gluten-free',
  },
  {
    id: 'c-8',
    name: 'Robert Kim',
    initials: 'RK',
    color: '#4A7A9D',
    age: 55,
    gender: 'Male',
    email: 'robert.kim@email.com',
    program: 'Diabetes Management',
    plan: 'Diabetes-Friendly Meal Plan',
    status: 'active',
    accessEnabled: true,
    expiryDate: isoFromNow(64), // comfortably active
    adherence: 90,
    checkInDays: 0,
    joinDate: isoFromNow(-245),
    goals: ['Improve health'],
    diet: 'Low carb',
  },
  {
    id: 'c-11',
    name: 'Sofia Martins',
    initials: 'SM',
    color: '#457C89',
    age: 24,
    gender: 'Female',
    email: 'sofia.martins@email.com',
    program: 'General Wellness',
    plan: 'General Wellness Starter',
    status: 'new',
    accessEnabled: true,
    expiryDate: isoFromNow(90),
    adherence: null, // brand-new — no data yet
    checkInDays: null,
    joinDate: isoFromNow(0), // joined today
    goals: ['Improve health'],
    diet: 'Eats everything',
  },
  {
    id: 'c-15',
    name: 'Carlos Vega',
    initials: 'CV',
    color: '#55789D',
    age: 58,
    gender: 'Male',
    email: 'carlos.vega@email.com',
    program: 'Cardiac Health',
    plan: 'Cardiac Health Nutrition',
    status: 'attention',
    accessEnabled: false, // disabled + expired
    expiryDate: isoFromNow(-12),
    adherence: 38,
    checkInDays: 6,
    joinDate: isoFromNow(-420),
    goals: ['Improve health'],
    diet: 'Low sodium',
  },
]

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
// The nine canonical response scenarios for the clients endpoints. These are
// concrete, realistic examples used by tests and by the api layer's error
// paths — and they double as living documentation of what each endpoint can
// return. (Success/empty are shaped by `filterClientFixtures`; the failures
// are the normalized ApiError the transport rejects with.)
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
