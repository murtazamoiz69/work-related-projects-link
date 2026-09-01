// MSW request handlers for the nutritionists endpoints — the mock "backend".
// Reads/writes the stateful store in nutritionists.mock.ts. Registered via
// src/mocks/handlers.ts.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type {
  NutritionistFormBody,
  UpdateNutritionistAccessBody,
} from './nutritionists.types'
import {
  createNutritionist,
  filterNutritionists,
  findNutritionist,
  membersFor,
  updateNutritionist,
} from './nutritionists.mock'

const base = env.apiUrl

const notFound = () =>
  HttpResponse.json({ message: 'Nutritionist not found.' }, { status: 404 })

export const nutritionistsHandlers = [
  // GET /nutritionists — filtered, name-sorted, paginated.
  http.get(`${base}/nutritionists`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page')) || 1
    const pageSize = Number(url.searchParams.get('pageSize')) || 12
    const status = url.searchParams.get('status')
    const matched = filterNutritionists({
      search: url.searchParams.get('search') ?? undefined,
      status: status === 'active' || status === 'disabled' ? status : undefined,
    })
    const start = (page - 1) * pageSize
    return HttpResponse.json({
      items: matched.slice(start, start + pageSize),
      total: matched.length,
      page,
      pageSize,
    })
  }),

  // GET /nutritionists/:id/members — read-only member summaries.
  http.get(`${base}/nutritionists/:id/members`, ({ params }) => {
    const dto = findNutritionist(String(params.id))
    if (!dto) return notFound()
    return HttpResponse.json({ members: membersFor(dto.memberIds) })
  }),

  // POST /nutritionists — create.
  http.post(`${base}/nutritionists`, async ({ request }) => {
    const body = (await request.json()) as NutritionistFormBody
    if (!body.name?.trim() || !body.email?.trim()) {
      return HttpResponse.json(
        {
          message: 'Please complete the required fields.',
          fields: {
            ...(body.name?.trim() ? {} : { name: 'Name is required.' }),
            ...(body.email?.trim() ? {} : { email: 'Email is required.' }),
          },
        },
        { status: 422 },
      )
    }
    return HttpResponse.json(createNutritionist(body), { status: 201 })
  }),

  // PUT /nutritionists/:id — edit.
  http.put(`${base}/nutritionists/:id`, async ({ params, request }) => {
    const body = (await request.json()) as NutritionistFormBody
    const updated = updateNutritionist(String(params.id), body)
    if (!updated) return notFound()
    return HttpResponse.json(updated)
  }),

  // PATCH /nutritionists/:id/access — enable/disable.
  http.patch(
    `${base}/nutritionists/:id/access`,
    async ({ params, request }) => {
      const body = (await request.json()) as UpdateNutritionistAccessBody
      const updated = updateNutritionist(String(params.id), {
        accessEnabled: body.enabled,
      })
      if (!updated) return notFound()
      return HttpResponse.json(updated)
    },
  ),
]
