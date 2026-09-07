// MSW handlers for the single global program. Reads/writes the stateful store
// in programs.mock.ts. Registered via src/mocks/handlers.ts.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type {
  UpdateProgramAvailabilityBody,
  UpdateProgramBody,
} from './programs.types'
import {
  getProgramDto,
  setProgramAvailability,
  setProgramDto,
} from './programs.mock'

const base = env.apiUrl

/** `GET`/`PUT /program` and `PATCH /program/availability`. All three are wired
 *  to the real backend under the `program` flag (VITE_LIVE_APIS): `GET`/`PUT`
 *  speak `ProgramOverview`, `PUT` takes `{ name, description, durationWeeks }`,
 *  and the toggle returns `ProgramOverview` too. */
export const programHandlers = [
  // GET /program — the current global program.
  http.get(`${base}/program`, () => HttpResponse.json(getProgramDto())),

  // PUT /program — save the editable program details (autosave).
  http.put(`${base}/program`, async ({ request }) => {
    const body = (await request.json()) as UpdateProgramBody
    if (!body?.name?.trim()) {
      return HttpResponse.json(
        {
          message: 'The program could not be saved.',
          fields: { name: 'Program name is required.' },
        },
        { status: 422 },
      )
    }
    return HttpResponse.json(setProgramDto(body))
  }),

  // PATCH /program/availability — enable/disable.
  http.patch(`${base}/program/availability`, async ({ request }) => {
    const body = (await request.json()) as UpdateProgramAvailabilityBody
    return HttpResponse.json(setProgramAvailability(body.enabled))
  }),
]
