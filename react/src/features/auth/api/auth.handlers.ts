// MSW handlers for auth. Demo: any non-empty password logs a known email in.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import type { LoginBody } from './auth.types'
import { findUserByEmail } from './auth.mock'

const base = env.apiUrl

export const authHandlers = [
  http.post(`${base}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginBody
    const user = findUserByEmail(body.email ?? '')
    if (!user || !body.password) {
      return HttpResponse.json(
        { message: 'Invalid email or password.' },
        { status: 401 },
      )
    }
    return HttpResponse.json({
      token: `mock-token-${user.id}`,
      refreshToken: `mock-refresh-${user.id}`,
      user,
    })
  }),

  // Always generic 200, to avoid leaking which emails have accounts.
  http.post(`${base}/auth/forgot-password`, () =>
    HttpResponse.json({ ok: true }),
  ),
]
