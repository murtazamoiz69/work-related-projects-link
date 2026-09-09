// MSW handlers for Settings › Profile. Every other feature is mockable, so the
// panel runs offline end to end; without these the Settings screen was the one
// page that only rendered against a live backend (OP-6).
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type { StaffProfile, UpdateStaffProfileBody } from './settings.types'

const base = env.apiUrl

let profile: StaffProfile = {
  id: 'n-1',
  displayId: 'NUT-001',
  name: 'Sarah Mitchell',
  role: 'Nutritionist',
  email: 'sarah@nourishwithsim.com',
  phone: '+91 98765 43210',
  bio: 'Registered dietitian focused on metabolic health, PCOS and sustainable fat loss. Eight years supporting clients through habit-first nutrition.',
  initials: 'SM',
  color: '#1f5f4a',
  profileImageUrl: null,
  profileImageKey: null,
}

export const settingsHandlers = [
  http.get(`${base}/me/settings/profile`, () => HttpResponse.json(profile)),
  http.put(`${base}/me/settings/profile`, async ({ request }) => {
    const body = (await request.json()) as UpdateStaffProfileBody
    profile = { ...profile, ...body }
    return HttpResponse.json(profile)
  }),
]
