// Mock backend fixtures + scenario responses for the clients endpoints.
// This is the ONLY place clients mock data lives — never inside a component.
// The fixtures are DERIVED from the shared CLIENTS_DATA seed (mapped to the
// wire shape: Date -> ISO string) so the Users page shows the same people as
// every other screen that still reads CLIENTS_DATA directly. MSW handlers
// (clients.handlers.ts) serve from these; unit tests exercise them too.
//
// Since "Add User" landed this mock is also STATEFUL (like nutritionists.mock):
// creates append to an in-session `store` so a newly added user survives the
// list refetch. `CLIENT_FIXTURES` stays the immutable *seed* — tests assert
// against it, so it must not grow. Reset between tests with resetClientStore().
import { getInitials } from '@/lib/utils'
import type { ApiError } from '@/lib/api/types'
import { CLIENTS_DATA, COLOR_POOL, PROGRAMS, PROGRAM_PLAN } from '../data'
import type { Client } from '../types'
import type {
  BulkCreateClientsBody,
  BulkCreateClientsDto,
  ClientDto,
  ClientsSummaryDto,
  CreateClientBody,
  ListClientsParams,
  PaginatedClientsDto,
  SkippedClientRow,
} from './clients.types'

const DAY_MS = 86_400_000
const EMAIL_RE = /^\S+@\S+\.\S+$/

/** Domain `Client` (Date fields) -> wire `ClientDto` (ISO strings). Exported so
 *  other features (e.g. dashboard) can embed a client in their own responses. */
export function toClientDto(c: Client): ClientDto {
  return {
    ...c,
    expiryDate: c.expiryDate.toISOString(),
    joinDate: c.joinDate.toISOString(),
    // Who a user is assigned to lives in the nutritionists mock (it owns
    // `memberIds`); the clients handlers join it on before responding.
    assignedNutritionist: c.assignedNutritionist ?? null,
  }
}

// The full seeded roster as the backend would send it. Already covers the edge
// cases the UI must handle — nullable adherence/checkInDays (new users),
// expired / expiring-soon / active expiries, disabled and paused users, and
// realistic program ↔ plan relationships — because CLIENTS_DATA does.
export const CLIENT_FIXTURES: ClientDto[] = CLIENTS_DATA.map(toClientDto)

// In-session mutable roster — the mock "database". Seeded from the fixtures;
// "Add User" appends to it. Everything that reads the roster reads this, never
// CLIENT_FIXTURES, so created users appear in the list, the summary counts and
// the per-id lookups alike.
let store: ClientDto[] = [...CLIENT_FIXTURES]

/** Restore the roster to its seeded state (call in test setup for isolation). */
export function resetClientStore(): void {
  store = [...CLIENT_FIXTURES]
}

export function findClientDto(id: string): ClientDto | undefined {
  return store.find((c) => c.id === id)
}

/** The plan names "Add User" may assign — served by `GET /clients/programs`. */
export function listClientPrograms(): string[] {
  return [...PROGRAMS]
}

/** Case-insensitive match against the known program names, tolerating the
 *  casing/spacing drift of a free-text "Plan Name" cell in an uploaded sheet.
 *  Returns the canonical name, or null when nothing matches. */
export function resolveProgramName(raw: string): string | null {
  const q = raw.trim().toLowerCase()
  if (!q) return null
  const exact = PROGRAMS.find((p) => p.toLowerCase() === q)
  if (exact) return exact
  const partial = PROGRAMS.find(
    (p) => p.toLowerCase().includes(q) || q.includes(p.toLowerCase()),
  )
  return partial ?? null
}

let sequence = 0

function addWeeks(from: Date, weeks: number): Date {
  const next = new Date(from)
  next.setDate(next.getDate() + weeks * 7)
  return next
}

/** Everything the roster needs that "Add User" doesn't ask for gets a neutral
 *  placeholder here: a brand-new user has no adherence or check-in history
 *  (hence `null`, which the table already renders as "no data yet") and
 *  `status: 'new'` is what the roster and the chat "New" tab key off. */
function buildClientDto(body: CreateClientBody): ClientDto {
  sequence += 1
  const id = `c-new-${Date.now()}-${sequence}`
  const program = resolveProgramName(body.program) ?? body.program
  return {
    id,
    // ASSUMPTION: the backend opens a thread with the user at creation and
    // returns its id. The seed roster derives it the same way (id === id).
    conversationId: id,
    name: body.name.trim(),
    initials: getInitials(body.name, '?'),
    color: COLOR_POOL[store.length % COLOR_POOL.length] ?? COLOR_POOL[0],
    age: 0,
    gender: 'Female',
    email: body.email.trim(),
    phone: body.phone.trim(),
    program,
    plan: PROGRAM_PLAN[program] ?? program,
    status: 'new',
    accessEnabled: true,
    expiryDate: addWeeks(new Date(), body.weeks).toISOString(),
    adherence: null,
    checkInDays: null,
    joinDate: new Date().toISOString(),
    goals: [],
    diet: '',
    // Filled in by the handler once a nutritionist has been picked for them.
    assignedNutritionist: null,
  }
}

/** Record the caseload the handler assigned this user to. */
export function setClientAssignment(
  id: string,
  assignment: ClientDto['assignedNutritionist'],
): void {
  store = store.map((c) =>
    c.id === id ? { ...c, assignedNutritionist: assignment } : c,
  )
}

/** The server-side rules for one submitted user, shared by the single-create
 *  endpoint and the bulk importer so both can never disagree about what counts
 *  as valid. `takenEmails` carries the emails claimed earlier in the same bulk
 *  payload, which is how duplicates *within one file* get caught. */
export function validateNewClient(
  body: CreateClientBody,
  takenEmails: Set<string> = new Set(),
): string[] {
  const reasons: string[] = []
  const missing = (['name', 'email', 'phone', 'program'] as const).filter(
    (k) => !String(body[k] ?? '').trim(),
  )
  if (missing.length) reasons.push(`Missing ${missing.join(', ')}`)

  const email = String(body.email ?? '').trim()
  if (email && !EMAIL_RE.test(email)) {
    reasons.push('Invalid email format')
  } else if (email) {
    const key = email.toLowerCase()
    const exists = store.some((c) => c.email.trim().toLowerCase() === key)
    if (exists || takenEmails.has(key)) reasons.push('Email already exists')
  }

  const program = String(body.program ?? '').trim()
  if (program && !resolveProgramName(program)) {
    reasons.push(`Unrecognized plan "${program}"`)
  }

  const weeks = Number(body.weeks)
  if (!Number.isFinite(weeks) || Math.round(weeks) < 1) {
    reasons.push('Weeks must be a positive number')
  }
  return reasons
}

/** `POST /clients` — append one user to the roster. Callers validate first. */
export function createClientDto(body: CreateClientBody): ClientDto {
  const dto = buildClientDto(body)
  store = [...store, dto]
  return dto
}

/** `POST /clients/bulk` — validate every row against the same rules, create the
 *  ones that pass, and report the rest with their reasons. With `dryRun` the
 *  verdicts are identical but nothing is persisted, which is what lets the
 *  importer's preview table promise exactly what the commit will do. */
export function bulkCreateClientDtos(
  body: BulkCreateClientsBody,
): BulkCreateClientsDto {
  const created: ClientDto[] = []
  const skipped: SkippedClientRow[] = []
  const takenEmails = new Set<string>()

  body.users.forEach((user, row) => {
    const reasons = validateNewClient(user, takenEmails)
    if (reasons.length) {
      skipped.push({ row, reasons })
      return
    }
    takenEmails.add(String(user.email).trim().toLowerCase())
    created.push(body.dryRun ? buildClientDto(user) : createClientDto(user))
  })

  return { created, skipped }
}

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

  const filtered = store.filter((c) => {
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
  for (const c of store) {
    if (c.accessEnabled) active += 1
    else disabled += 1
    const d = daysUntilIso(c.expiryDate)
    if (d < 0) expired += 1
    else if (d <= 14) expiringSoon += 1
  }
  return {
    total: store.length,
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
