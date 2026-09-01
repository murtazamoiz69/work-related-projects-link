// MSW handlers for user settings. GET/PUT notification prefs + practice
// details (localStorage-backed); PUT password validates and acknowledges.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type {
  ChangePasswordBody,
  NotificationPrefs,
  PracticeDetails,
} from './settings.types'
import {
  getNotificationPrefs,
  getPracticeDetails,
  setNotificationPrefs,
  setPracticeDetails,
} from './settings.mock'

const base = env.apiUrl

export const settingsHandlers = [
  http.get(`${base}/me/notification-preferences`, () =>
    HttpResponse.json(getNotificationPrefs()),
  ),
  http.put(`${base}/me/notification-preferences`, async ({ request }) => {
    const body = (await request.json()) as NotificationPrefs
    return HttpResponse.json(setNotificationPrefs(body))
  }),

  http.get(`${base}/me/practice`, () =>
    HttpResponse.json(getPracticeDetails()),
  ),
  http.put(`${base}/me/practice`, async ({ request }) => {
    const body = (await request.json()) as PracticeDetails
    if (!body.name?.trim()) {
      return HttpResponse.json(
        {
          message: 'Practice details could not be saved.',
          fields: { name: 'Practice name is required.' },
        },
        { status: 422 },
      )
    }
    return HttpResponse.json(setPracticeDetails(body))
  }),

  http.put(`${base}/me/password`, async ({ request }) => {
    const body = (await request.json()) as ChangePasswordBody
    // Demo backend: any non-empty current password is accepted. Field-level
    // validation (length, match) is enforced client-side by the zod schema.
    if (!body.currentPassword) {
      return HttpResponse.json(
        {
          message: 'Enter your current password.',
          fields: { currentPassword: 'Enter your current password.' },
        },
        { status: 422 },
      )
    }
    return HttpResponse.json({ ok: true })
  }),
]
