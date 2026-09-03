import { describe, expect, it } from 'vitest'
import { isApiError } from '@/lib/api/types'
import { forgotPassword, login } from './auth.api'

describe('auth.api', () => {
  it('logs in a known demo user with any non-empty password', async () => {
    const res = await login({
      email: 'sarah@nourishwithsim.com',
      password: 'whatever',
      rememberMe: true,
    })
    expect(res.token).toBeTruthy()
    expect(res.user.name).toBe('Sarah Nolan')
    expect(res.user.email).toBe('sarah@nourishwithsim.com')
  })

  it('logs in the second demo account', async () => {
    const res = await login({
      email: 'alex@nourishwithsim.com',
      password: 'x',
      rememberMe: false,
    })
    expect(res.user.email).toBe('alex@nourishwithsim.com')
  })

  it('rejects an unknown email with 401', async () => {
    await expect(
      login({ email: 'nobody@example.com', password: 'x', rememberMe: false }),
    ).rejects.toMatchObject({ kind: 'unauthorized', status: 401 })
  })

  it('rejects an empty password with 401', async () => {
    try {
      await login({
        email: 'sarah@nourishwithsim.com',
        password: '',
        rememberMe: false,
      })
      throw new Error('expected rejection')
    } catch (e) {
      expect(isApiError(e)).toBe(true)
      if (isApiError(e)) expect(e.kind).toBe('unauthorized')
    }
  })

  it('acknowledges forgot-password generically', async () => {
    expect(await forgotPassword({ email: 'anyone@example.com' })).toEqual({
      ok: true,
    })
  })
})
