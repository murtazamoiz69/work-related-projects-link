// MSW handlers for the dashboard's read-only aggregate endpoints.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import {
  clientProgressDto,
  kpisDto,
  needsAttentionDto,
  programOptions,
  upcomingExpirationsDto,
} from './dashboard.mock'

const base = env.apiUrl

export const dashboardHandlers = [
  http.get(`${base}/dashboard/kpis`, () => HttpResponse.json(kpisDto())),

  http.get(`${base}/dashboard/needs-attention`, ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter') ?? 'needs-attention'
    return HttpResponse.json(needsAttentionDto(filter))
  }),

  http.get(`${base}/dashboard/upcoming-expirations`, () =>
    HttpResponse.json(upcomingExpirationsDto()),
  ),

  http.get(`${base}/dashboard/client-progress`, ({ request }) => {
    const url = new URL(request.url)
    const range = Number(url.searchParams.get('range')) || 30
    const program = url.searchParams.get('program') ?? 'all'
    return HttpResponse.json(clientProgressDto(range, program))
  }),

  http.get(`${base}/dashboard/programs`, () =>
    HttpResponse.json({ programs: programOptions() }),
  ),
]
