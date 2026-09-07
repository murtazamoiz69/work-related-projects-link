// MSW handler for the reference-library endpoints. Only calorie-bands is served
// (nothing else is fetched); the mock returns the same static list the frontend
// falls back to. Wired to the real backend under the `libraries` flag.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import { CALORIE_BANDS } from '../diet/dietPlan.types'

export const calorieBandsHandlers = [
  http.get(`${env.apiUrl}/libraries/calorie-bands`, () =>
    HttpResponse.json({ bands: [...CALORIE_BANDS] }),
  ),
]
