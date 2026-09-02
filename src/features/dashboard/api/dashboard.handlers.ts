// MSW handlers for the dashboard's read-only aggregate endpoints.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import {
  attentionFiltersDto,
  clientProgressDto,
  kpisDto,
  needsAttentionDto,
  programOptions,
  upcomingExpirationsDto,
} from './dashboard.mock'

const base = env.apiUrl

export const dashboardHandlers = [
  http.get(`${base}/dashboard/kpis`, () => HttpResponse.json(kpisDto())),

  // Step 1: chip metadata (defs + counts + default + week range).
  http.get(`${base}/dashboard/attention-filters`, () =>
    HttpResponse.json(attentionFiltersDto()),
  ),

  // Step 2: rows for one chip. `filter` is required — the client learns valid
  // keys from /attention-filters first, so a missing key is a client bug.
  http.get(`${base}/dashboard/needs-attention`, ({ request }) => {
    const filter = new URL(request.url).searchParams.get('filter')
    if (!filter) {
      return HttpResponse.json(
        { message: 'A filter key is required.' },
        { status: 422 },
      )
    }
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
