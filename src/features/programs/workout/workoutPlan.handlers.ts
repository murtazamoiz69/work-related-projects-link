// MSW handlers for the workout-plan endpoints — the mock "backend" for the
// programme's days and the per-user copies. Registered via src/mocks/handlers.ts.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import { isWorkoutDayType } from './workoutPlan.types'
import {
  addMasterDay,
  getClientPlan,
  getMasterPlan,
  resetClientDay,
  saveClientDays,
  saveMasterDays,
} from './workoutPlan.mock'
import type {
  ResetClientWorkoutDayBody,
  SaveWorkoutDaysBody,
} from './workoutPlan.api.types'

const base = env.apiUrl

/** The rules a Save has to satisfy, shared by the global and per-user endpoints
 *  so the two can't drift. Returns null when the body is fine. */
function saveBodyError(body: SaveWorkoutDaysBody): Response | null {
  if (!isWorkoutDayType(body.type)) {
    return HttpResponse.json(
      {
        message: 'The day could not be saved.',
        fields: { type: 'Unknown day type.' },
      },
      { status: 422 },
    )
  }
  if (!Array.isArray(body.days) || !body.days.length) {
    return HttpResponse.json(
      {
        message: 'Choose at least one day to save to.',
        fields: { days: 'Select one or more days.' },
      },
      { status: 422 },
    )
  }
  return null
}

export const workoutPlanHandlers = [
  // GET /program/workout-plan — the whole run of days.
  http.get(`${base}/program/workout-plan`, () =>
    HttpResponse.json(getMasterPlan()),
  ),

  // PUT /program/workout-plan/days — save the edited day to the chosen days.
  http.put(`${base}/program/workout-plan/days`, async ({ request }) => {
    const body = (await request.json()) as SaveWorkoutDaysBody
    const invalid = saveBodyError(body)
    if (invalid) return invalid
    return HttpResponse.json(saveMasterDays(body))
  }),

  // POST /program/workout-plan/add-day — append a blank day at the end.
  http.post(`${base}/program/workout-plan/add-day`, () =>
    HttpResponse.json(addMasterDay()),
  ),

  // GET /clients/:id/workout-plan — the user's copy (days flagged `edited`).
  http.get(`${base}/clients/:id/workout-plan`, ({ params }) =>
    HttpResponse.json(getClientPlan(String(params.id))),
  ),

  // PUT /clients/:id/workout-plan/days — the nutritionist's edit for one user.
  http.put(
    `${base}/clients/:id/workout-plan/days`,
    async ({ params, request }) => {
      const body = (await request.json()) as SaveWorkoutDaysBody
      const invalid = saveBodyError(body)
      if (invalid) return invalid
      return HttpResponse.json(saveClientDays(String(params.id), body))
    },
  ),

  // POST /clients/:id/workout-plan/reset — one day back to the programme's.
  http.post(
    `${base}/clients/:id/workout-plan/reset`,
    async ({ params, request }) => {
      const body = (await request.json()) as ResetClientWorkoutDayBody
      return HttpResponse.json(resetClientDay(String(params.id), body.day))
    },
  ),
]
