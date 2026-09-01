// MSW handlers for a client's Plan Workspace. Stateful (see plan.mock.ts).
// The whole workspace is saved on each edit (autosave); publish is just a save
// with an added version + published flag, so no separate endpoint is needed.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type { WorkspaceDto } from './plan.types'
import { getPlanDto, setPlanDto } from './plan.mock'

const base = env.apiUrl
const notFound = () =>
  HttpResponse.json({ message: 'Plan not found.' }, { status: 404 })

export const planHandlers = [
  http.get(`${base}/clients/:id/plan`, ({ params }) => {
    const dto = getPlanDto(String(params.id))
    return dto ? HttpResponse.json(dto) : notFound()
  }),

  http.put(`${base}/clients/:id/plan`, async ({ params, request }) => {
    const body = (await request.json()) as WorkspaceDto
    if (!body?.planName?.trim()) {
      return HttpResponse.json(
        {
          message: 'The plan could not be saved.',
          fields: { planName: 'Plan name is required.' },
        },
        { status: 422 },
      )
    }
    return HttpResponse.json(setPlanDto(String(params.id), body))
  }),
]
