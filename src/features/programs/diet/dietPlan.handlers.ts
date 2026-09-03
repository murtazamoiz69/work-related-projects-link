// MSW handlers for the diet-plan endpoints — the mock "backend" for the master
// sheets and the per-user copies. Registered via src/mocks/handlers.ts.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import {
  isCalorieBand,
  isPlanReviewStatus,
  type CalorieBand,
  type PlanReviewStatus,
} from './dietPlan.types'
import {
  clearClientPlans,
  duplicateMasterSheet,
  getClientPlan,
  getMasterSheet,
  saveClientPlan,
  saveMasterSheet,
} from './dietPlan.mock'
import type {
  DuplicateSheetBody,
  SaveClientPlanBody,
  SaveMasterSheetBody,
  UpdateClientBandBody,
  UpdateClientReviewBody,
} from './dietPlan.api.types'

const base = env.apiUrl

const badBand = () =>
  HttpResponse.json(
    {
      message: 'The diet plan could not be loaded.',
      fields: { band: 'Unknown calorie band.' },
    },
    { status: 422 },
  )

/** A user's diet profile lives on the client record, so the plan endpoints read
 *  it from there. Reached lazily for the same reason the other cross-feature
 *  joins are — it keeps the clients module out of this one's import graph. */
async function profileFor(clientId: string) {
  const { findClientDto } = await import('@/features/clients/api/clients.mock')
  return findClientDto(clientId)
}

/** The sign-off, lifted off the client record onto the plan response. */
function signOff(dto: {
  dietReview: PlanReviewStatus
  dietReviewedAt: string | null
}) {
  return { review: dto.dietReview, reviewedAt: dto.dietReviewedAt }
}

export const dietPlanHandlers = [
  // GET /program/diet-plan?week=&band= — one master sheet.
  http.get(`${base}/program/diet-plan`, ({ request }) => {
    const url = new URL(request.url)
    const weekNum = Number(url.searchParams.get('week')) || 1
    const band = Number(url.searchParams.get('band'))
    if (!isCalorieBand(band)) return badBand()
    const sheet = getMasterSheet(weekNum, band)
    if (!sheet) {
      return HttpResponse.json(
        { message: 'No plan for that week.' },
        { status: 404 },
      )
    }
    return HttpResponse.json(sheet)
  }),

  // PUT /program/diet-plan — save a master sheet.
  http.put(`${base}/program/diet-plan`, async ({ request }) => {
    const body = (await request.json()) as SaveMasterSheetBody
    if (!isCalorieBand(body.band)) return badBand()
    return HttpResponse.json(
      saveMasterSheet(body.weekNum, body.band, body.body ?? ''),
    )
  }),

  // POST /program/diet-plan/duplicate — copy a week onto others, same band.
  http.post(`${base}/program/diet-plan/duplicate`, async ({ request }) => {
    const body = (await request.json()) as DuplicateSheetBody
    if (!isCalorieBand(body.band)) return badBand()
    if (!Array.isArray(body.toWeeks) || !body.toWeeks.length) {
      return HttpResponse.json(
        {
          message: 'Choose at least one week to copy into.',
          fields: { toWeeks: 'Select one or more weeks.' },
        },
        { status: 422 },
      )
    }
    const weeks = duplicateMasterSheet(body.fromWeek, body.band, body.toWeeks)
    return HttpResponse.json({ band: body.band, weeks })
  }),

  // GET /clients/:id/diet-plan?week= — the user's tailored copy.
  http.get(`${base}/clients/:id/diet-plan`, async ({ params, request }) => {
    const clientId = String(params.id)
    const dto = await profileFor(clientId)
    if (!dto?.dietProfile) {
      return HttpResponse.json(
        { message: 'This user has no diet profile yet.' },
        { status: 404 },
      )
    }
    const weekNum = Number(new URL(request.url).searchParams.get('week')) || 1
    return HttpResponse.json(
      getClientPlan(clientId, weekNum, dto.dietProfile, signOff(dto)),
    )
  }),

  // PUT /clients/:id/diet-plan?week= — the nutritionist's own edit.
  http.put(`${base}/clients/:id/diet-plan`, async ({ params, request }) => {
    const clientId = String(params.id)
    const dto = await profileFor(clientId)
    if (!dto?.dietProfile) {
      return HttpResponse.json(
        { message: 'This user has no diet profile yet.' },
        { status: 404 },
      )
    }
    const weekNum = Number(new URL(request.url).searchParams.get('week')) || 1
    const body = (await request.json()) as SaveClientPlanBody
    return HttpResponse.json(
      saveClientPlan(
        clientId,
        weekNum,
        dto.dietProfile,
        body.body ?? '',
        signOff(dto),
      ),
    )
  }),

  // PATCH /clients/:id/diet-band — move a user to a different daily target.
  http.patch(`${base}/clients/:id/diet-band`, async ({ params, request }) => {
    const clientId = String(params.id)
    const body = (await request.json()) as UpdateClientBandBody
    if (!isCalorieBand(body.band)) return badBand()

    const { findClientDto, setClientDietBand } =
      await import('@/features/clients/api/clients.mock')
    if (!findClientDto(clientId)) {
      return HttpResponse.json({ message: 'User not found.' }, { status: 404 })
    }
    const updated = setClientDietBand(clientId, body.band as CalorieBand)
    // Their hand-edited weeks were written against the old band's portions, so
    // they can't carry over — drop them and re-derive from the new master.
    // setClientDietBand also drops the sign-off: what was reviewed is not what
    // this user is on any more.
    clearClientPlans(clientId)
    return HttpResponse.json(updated)
  }),

  // PATCH /clients/:id/diet-review — sign the filtered plan off, or reopen it.
  http.patch(`${base}/clients/:id/diet-review`, async ({ params, request }) => {
    const clientId = String(params.id)
    const body = (await request.json()) as UpdateClientReviewBody
    if (!isPlanReviewStatus(body.status)) {
      return HttpResponse.json(
        {
          message: 'The review state could not be saved.',
          fields: { status: 'Unknown review state.' },
        },
        { status: 422 },
      )
    }

    const { findClientDto, setClientDietReview } =
      await import('@/features/clients/api/clients.mock')
    if (!findClientDto(clientId)) {
      return HttpResponse.json({ message: 'User not found.' }, { status: 404 })
    }
    return HttpResponse.json(setClientDietReview(clientId, body.status))
  }),
]
