// MSW request handlers for the clients endpoints — the mock "backend". They
// serve from the same fixtures the api layer's contracts describe, and encode
// the same validation/not-found rules the real backend will. Registered via
// src/mocks/handlers.ts. See docs/api-guidelines.md.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type {
  BulkCreateClientsBody,
  ClientDto,
  ClientExpiryFilter,
  ClientStatusFilter,
  CreateClientBody,
  ExtendClientExpiryBody,
  UpdateClientAccessBody,
} from './clients.types'
import {
  bulkCreateClientDtos,
  createClientDto,
  filterClientFixtures,
  findClientDto,
  listClientPrograms,
  setClientAssignment,
  summarizeClientFixtures,
  validateNewClient,
} from './clients.mock'

const base = env.apiUrl

// Opening the new user's chat thread is the chat mock's job, but that module
// seeds 48 conversations at import time. Reaching it lazily keeps it out of the
// clients handlers' module graph — which `src/mocks/handlers.ts` pulls in on
// every app boot and every test file — so only an actual create pays for it.
async function openThreadFor(client: ClientDto): Promise<void> {
  const { createConversationForClient } =
    await import('@/features/chat/api/chat.mock')
  createConversationForClient(client)
}

// The caseload join. `memberIds` lives in the nutritionists mock, so a real
// backend would resolve this server-side and embed the result — which is what
// this does. Dynamic import for the same reason as above, and because a static
// one would close the loop nutritionists/data.ts -> @/features/clients ->
// clients.mock -> nutritionists.mock.
async function withAssignments(rows: ClientDto[]): Promise<ClientDto[]> {
  if (!rows.length) return rows
  const { assignmentsFor } =
    await import('@/features/nutritionists/api/nutritionists.mock')
  const byClient = assignmentsFor(rows.map((c) => c.id))
  return rows.map((c) => ({
    ...c,
    assignedNutritionist: byClient.get(c.id) ?? c.assignedNutritionist ?? null,
  }))
}

/** Put a newly created user on the least-loaded nutritionist's caseload and
 *  remember it, so the roster shows the assignment on the very next read. */
async function assignToNutritionist(client: ClientDto): Promise<ClientDto> {
  const { assignLeastLoaded } =
    await import('@/features/nutritionists/api/nutritionists.mock')
  const assigned = assignLeastLoaded(client.id)
  setClientAssignment(client.id, assigned)
  return { ...client, assignedNutritionist: assigned }
}

// Which validation reason belongs against which form field, so a rejected
// single-create comes back as inline field errors rather than one lumped
// message. Bulk import keeps the raw reason strings — its preview table has a
// column for them.
function fieldErrorsFor(reasons: string[]): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const reason of reasons) {
    if (reason.startsWith('Missing')) {
      for (const key of ['name', 'email', 'phone', 'program'] as const) {
        if (reason.includes(key)) fields[key] = 'This field is required.'
      }
    } else if (reason === 'Invalid email format') {
      fields.email = 'Enter a valid email address.'
    } else if (reason === 'Email already exists') {
      fields.email = 'A user with this email already exists.'
    } else if (reason.startsWith('Unrecognized plan')) {
      fields.program = 'Choose one of the available plans.'
    } else if (reason.startsWith('Weeks')) {
      fields.weeks = 'Weeks must be a positive number.'
    }
  }
  return fields
}

export const clientsHandlers = [
  // GET /clients — filtered, sorted, paginated.
  http.get(`${base}/clients`, async ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const pageSize = Number(url.searchParams.get('pageSize')) || 12
    const matched = filterClientFixtures({
      search: url.searchParams.get('search') ?? undefined,
      status: (url.searchParams.get('status') as ClientStatusFilter) ?? 'all',
      expiry: (url.searchParams.get('expiry') as ClientExpiryFilter) ?? 'all',
    })
    const start = (page - 1) * pageSize
    return HttpResponse.json({
      items: await withAssignments(matched.slice(start, start + pageSize)),
      total: matched.length,
      page,
      pageSize,
    })
  }),

  // GET /clients/summary — roster counts.
  http.get(`${base}/clients/summary`, () =>
    HttpResponse.json(summarizeClientFixtures()),
  ),

  // GET /clients/programs — the plans "Add User" can assign.
  http.get(`${base}/clients/programs`, () =>
    HttpResponse.json({ programs: listClientPrograms() }),
  ),

  // POST /clients — add one user.
  http.post(`${base}/clients`, async ({ request }) => {
    const body = (await request.json()) as CreateClientBody
    const reasons = validateNewClient(body)
    if (reasons.length) {
      return HttpResponse.json(
        {
          message: 'The user could not be added.',
          fields: fieldErrorsFor(reasons),
        },
        { status: 422 },
      )
    }
    const dto = await assignToNutritionist(createClientDto(body))
    await openThreadFor(dto)
    return HttpResponse.json(dto, { status: 201 })
  }),

  // POST /clients/bulk — import many (or, with dryRun, just report verdicts).
  http.post(`${base}/clients/bulk`, async ({ request }) => {
    const body = (await request.json()) as BulkCreateClientsBody
    if (!Array.isArray(body.users)) {
      return HttpResponse.json(
        { message: 'No users were submitted.' },
        { status: 422 },
      )
    }
    const result = bulkCreateClientDtos(body)
    if (!body.dryRun) {
      // Sequentially, so the "fewest users first" pick sees each previous
      // assignment and the batch spreads across the team instead of piling
      // every row onto whoever was lightest when the import started.
      const created: ClientDto[] = []
      for (const dto of result.created) {
        const assigned = await assignToNutritionist(dto)
        await openThreadFor(assigned)
        created.push(assigned)
      }
      result.created = created
    }
    return HttpResponse.json(result, { status: body.dryRun ? 200 : 201 })
  }),

  // PATCH /clients/:id/access — enable/disable.
  http.patch(`${base}/clients/:id/access`, async ({ params, request }) => {
    const dto = findClientDto(String(params.id))
    if (!dto) {
      return HttpResponse.json({ message: 'User not found.' }, { status: 404 })
    }
    const body = (await request.json()) as UpdateClientAccessBody
    return HttpResponse.json({ ...dto, accessEnabled: body.enabled })
  }),

  // PATCH /clients/:id/expiry — extend program (with validation).
  http.patch(`${base}/clients/:id/expiry`, async ({ params, request }) => {
    const dto = findClientDto(String(params.id))
    if (!dto) {
      return HttpResponse.json({ message: 'User not found.' }, { status: 404 })
    }
    const body = (await request.json()) as ExtendClientExpiryBody
    const next = new Date(body.expiryDate)
    if (Number.isNaN(next.getTime()) || next.getTime() <= Date.now()) {
      return HttpResponse.json(
        {
          message: 'The program could not be extended.',
          fields: { expiryDate: 'Expiry must be a valid date in the future.' },
        },
        { status: 422 },
      )
    }
    return HttpResponse.json({ ...dto, expiryDate: body.expiryDate })
  }),
]
