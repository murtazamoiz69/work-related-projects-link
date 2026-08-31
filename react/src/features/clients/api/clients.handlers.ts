// MSW request handlers for the clients endpoints — the mock "backend". They
// serve from the same fixtures the api layer's contracts describe, and encode
// the same validation/not-found rules the real backend will. Registered via
// src/mocks/handlers.ts. See docs/api-guidelines.md.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type {
  ClientExpiryFilter,
  ClientStatusFilter,
  ExtendClientExpiryBody,
  UpdateClientAccessBody,
} from './clients.types'
import {
  CLIENT_FIXTURES,
  filterClientFixtures,
  summarizeClientFixtures,
} from './clients.mock'

const base = env.apiUrl

export const clientsHandlers = [
  // GET /clients — filtered, sorted, paginated.
  http.get(`${base}/clients`, ({ request }) => {
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
      items: matched.slice(start, start + pageSize),
      total: matched.length,
      page,
      pageSize,
    })
  }),

  // GET /clients/summary — roster counts.
  http.get(`${base}/clients/summary`, () =>
    HttpResponse.json(summarizeClientFixtures()),
  ),

  // PATCH /clients/:id/access — enable/disable.
  http.patch(`${base}/clients/:id/access`, async ({ params, request }) => {
    const dto = CLIENT_FIXTURES.find((c) => c.id === params.id)
    if (!dto) {
      return HttpResponse.json({ message: 'User not found.' }, { status: 404 })
    }
    const body = (await request.json()) as UpdateClientAccessBody
    return HttpResponse.json({ ...dto, accessEnabled: body.enabled })
  }),

  // PATCH /clients/:id/expiry — extend program (with validation).
  http.patch(`${base}/clients/:id/expiry`, async ({ params, request }) => {
    const dto = CLIENT_FIXTURES.find((c) => c.id === params.id)
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
