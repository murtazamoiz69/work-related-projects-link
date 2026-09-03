// MSW handlers for the workout-plan endpoints — the mock "backend" for the
// programme's weeks and the per-user copies. Registered via src/mocks/handlers.ts.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import { isWorkoutDayType } from './workoutPlan.types'
import {
  duplicateMasterWeek,
  getClientWeek,
  getMasterWeek,
  resetClientWeek,
  saveClientDay,
  saveMasterDay,
  swapClientDays,
  swapMasterDays,
} from './workoutPlan.mock'
import type {
  DuplicateWorkoutWeekBody,
  SaveWorkoutDayBody,
  SwapWorkoutDaysBody,
} from './workoutPlan.api.types'

const base = env.apiUrl

const notFound = (message: string) =>
  HttpResponse.json({ message }, { status: 404 })

/** The rules a saved day has to satisfy, shared by the global and per-user
 *  endpoints so the two can't drift. Returns null when the body is fine. */
function dayBodyError(body: SaveWorkoutDayBody): Response | null {
  if (!isWorkoutDayType(body.type)) {
    return HttpResponse.json(
      {
        message: 'The day could not be saved.',
        fields: { type: 'Unknown day type.' },
      },
      { status: 422 },
    )
  }
  if (!Number.isInteger(body.dayNum) || body.dayNum < 1 || body.dayNum > 7) {
    return HttpResponse.json(
      {
        message: 'The day could not be saved.',
        fields: { dayNum: 'A week has seven days.' },
      },
      { status: 422 },
    )
  }
  return null
}

const weekParam = (request: Request): number =>
  Number(new URL(request.url).searchParams.get('week')) || 1

export const workoutPlanHandlers = [
  // GET /program/workout-plan?week= — one week of the programme.
  http.get(`${base}/program/workout-plan`, ({ request }) => {
    const week = getMasterWeek(weekParam(request))
    return week ? HttpResponse.json(week) : notFound('No such week.')
  }),

  // PUT /program/workout-plan/day — save one day.
  http.put(`${base}/program/workout-plan/day`, async ({ request }) => {
    const body = (await request.json()) as SaveWorkoutDayBody
    const invalid = dayBodyError(body)
    if (invalid) return invalid
    const week = saveMasterDay(body)
    return week ? HttpResponse.json(week) : notFound('No such week.')
  }),

  // POST /program/workout-plan/swap — trade two days within a week.
  http.post(`${base}/program/workout-plan/swap`, async ({ request }) => {
    const body = (await request.json()) as SwapWorkoutDaysBody
    const week = swapMasterDays(body.weekNum, body.fromDay, body.toDay)
    if (!week) {
      return HttpResponse.json(
        {
          message: 'Those days could not be swapped.',
          fields: { toDay: 'Pick a different day of the same week.' },
        },
        { status: 422 },
      )
    }
    return HttpResponse.json(week)
  }),

  // POST /program/workout-plan/duplicate — copy a week onto other weeks.
  http.post(`${base}/program/workout-plan/duplicate`, async ({ request }) => {
    const body = (await request.json()) as DuplicateWorkoutWeekBody
    if (!Array.isArray(body.toWeeks) || !body.toWeeks.length) {
      return HttpResponse.json(
        {
          message: 'Choose at least one week to copy into.',
          fields: { toWeeks: 'Select one or more weeks.' },
        },
        { status: 422 },
      )
    }
    return HttpResponse.json({
      weeks: duplicateMasterWeek(body.fromWeek, body.toWeeks),
    })
  }),

  // GET /clients/:id/workout-plan?week= — the user's copy of a week.
  http.get(`${base}/clients/:id/workout-plan`, ({ params, request }) =>
    HttpResponse.json(getClientWeek(String(params.id), weekParam(request))),
  ),

  // PUT /clients/:id/workout-plan/day — the nutritionist's edit for one user.
  http.put(
    `${base}/clients/:id/workout-plan/day`,
    async ({ params, request }) => {
      const body = (await request.json()) as SaveWorkoutDayBody
      const invalid = dayBodyError(body)
      if (invalid) return invalid
      return HttpResponse.json(saveClientDay(String(params.id), body))
    },
  ),

  // POST /clients/:id/workout-plan/swap — trade two days for one user.
  http.post(
    `${base}/clients/:id/workout-plan/swap`,
    async ({ params, request }) => {
      const body = (await request.json()) as SwapWorkoutDaysBody
      const week = swapClientDays(
        String(params.id),
        body.weekNum,
        body.fromDay,
        body.toDay,
      )
      if (!week) {
        return HttpResponse.json(
          {
            message: 'Those days could not be swapped.',
            fields: { toDay: 'Pick a different day of the same week.' },
          },
          { status: 422 },
        )
      }
      return HttpResponse.json(week)
    },
  ),

  // POST /clients/:id/workout-plan/reset?week= — back to the programme's week.
  http.post(`${base}/clients/:id/workout-plan/reset`, ({ params, request }) =>
    HttpResponse.json(resetClientWeek(String(params.id), weekParam(request))),
  ),
]
