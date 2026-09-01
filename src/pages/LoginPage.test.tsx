// Behavior tests for the Login page (rhf + zod, the app's auth entry point).
// Covers rendering, every interaction, form validation, the API state matrix,
// the real "signed-in" side effect (token persisted + store flipped), edge-case
// inputs, and accessibility. Routing is faked via useNavigate; login runs
// through the real auth store so the persisted-session effect is exercised.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { useAuthStore } from '@/store/useAuthStore'
import { getAccessToken } from '@/lib/api/auth'
import { LoginPage } from './LoginPage'

const API = 'http://localhost:3000'
const LOGIN = `${API}/auth/login`
const FORGOT = `${API}/auth/forgot-password`

// --- Router seam: capture navigate() calls. ---
const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'

beforeEach(() => {
  navigateSpy.mockClear()
  vi.mocked(showToast).mockClear()
  // Start every test signed out with clean storage.
  useAuthStore.getState().logout()
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => server.resetHandlers())

const email = () => screen.getByLabelText('Email')
const password = () => screen.getByLabelText('Password')
const signIn = () => screen.getByRole('button', { name: 'Sign In' })

describe('LoginPage — rendering', () => {
  it('renders the form with demo email prefilled and password empty', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    expect(email()).toHaveValue('sarah@nourishwithsim.com')
    expect(password()).toHaveValue('')
    expect(screen.getByLabelText('Remember me')).toBeChecked()
    expect(signIn()).toBeEnabled()
  })
})

describe('LoginPage — form validation', () => {
  it('rejects a too-short password with a field message', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    await user.type(password(), 'ab')
    await user.click(signIn())
    expect(
      await screen.findByText(/password must be at least 4 characters/i),
    ).toBeInTheDocument()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('rejects an invalid email format', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    await user.clear(email())
    await user.type(email(), 'not-an-email')
    await user.type(password(), 'secret')
    await user.click(signIn())
    expect(
      await screen.findByText(/enter a valid email address/i),
    ).toBeInTheDocument()
    expect(navigateSpy).not.toHaveBeenCalled()
  })
})

describe('LoginPage — successful submission', () => {
  it('logs in: persists the token, flips the store, and navigates home', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    await user.type(password(), 'secret')
    await user.click(signIn())

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith({ to: '/' }))
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().activeProfile.email).toBe(
      'sarah@nourishwithsim.com',
    )
    expect(getAccessToken()).toBeTruthy()
  })

  it('honours the redirect target', async () => {
    const { user } = renderWithProviders(<LoginPage redirect="/programs" />)
    await user.type(password(), 'secret')
    await user.click(signIn())
    await waitFor(() =>
      expect(navigateSpy).toHaveBeenCalledWith({ to: '/programs' }),
    )
  })

  it('shows a pending label and disables submit while signing in', async () => {
    server.use(
      http.post(LOGIN, async () => {
        await delay(80)
        return HttpResponse.json({
          token: 't',
          refreshToken: 'r',
          user: {
            id: 'u-sarah',
            name: 'Sarah Nolan',
            role: 'Nutritionist',
            email: 'sarah@nourishwithsim.com',
            initials: 'SN',
            color: '#2F5D50',
          },
        })
      }),
    )
    const { user } = renderWithProviders(<LoginPage />)
    await user.type(password(), 'secret')
    await user.click(signIn())
    expect(
      await screen.findByRole('button', { name: /signing in/i }),
    ).toBeDisabled()
    // Let the in-flight login settle so it can't bleed into the next test.
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith({ to: '/' }))
  })
})

describe('LoginPage — API states', () => {
  it('401 shows an "invalid credentials" message and does not sign in', async () => {
    server.use(
      http.post(LOGIN, () =>
        HttpResponse.json({ message: 'nope' }, { status: 401 }),
      ),
    )
    const { user } = renderWithProviders(<LoginPage />)
    await user.type(password(), 'wrongpass')
    await user.click(signIn())

    expect(
      await screen.findByText('Invalid email or password.'),
    ).toBeInTheDocument()
    expect(navigateSpy).not.toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('500 surfaces the server error message', async () => {
    server.use(
      http.post(LOGIN, () =>
        HttpResponse.json({ message: 'Server is down.' }, { status: 500 }),
      ),
    )
    const { user } = renderWithProviders(<LoginPage />)
    await user.type(password(), 'secret')
    await user.click(signIn())
    expect(await screen.findByText('Server is down.')).toBeInTheDocument()
  })

  it('network failure surfaces a connection message', async () => {
    server.use(http.post(LOGIN, () => HttpResponse.error()))
    const { user } = renderWithProviders(<LoginPage />)
    await user.type(password(), 'secret')
    await user.click(signIn())
    expect(await screen.findByText(/could not reach the server/i)).toBeVisible()
  })

  it('does not fire a duplicate login while one is in flight', async () => {
    let hits = 0
    server.use(
      http.post(LOGIN, async () => {
        hits += 1
        await delay(80)
        return HttpResponse.json({
          token: 't',
          refreshToken: 'r',
          user: {
            id: 'u-sarah',
            name: 'Sarah Nolan',
            role: 'Nutritionist',
            email: 'sarah@nourishwithsim.com',
            initials: 'SN',
            color: '#2F5D50',
          },
        })
      }),
    )
    const { user } = renderWithProviders(<LoginPage />)
    await user.type(password(), 'secret')
    const btn = signIn() // capture before the label flips to "Signing in…"
    await user.click(btn)
    await user.click(btn) // disabled while pending — no-op
    await waitFor(() => expect(navigateSpy).toHaveBeenCalled())
    expect(hits).toBe(1)
  })
})

describe('LoginPage — interactions', () => {
  it('toggles password visibility', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    expect(password()).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password()).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toBeInTheDocument()
  })

  it('remember-me can be unchecked', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    const remember = screen.getByLabelText('Remember me')
    await user.click(remember)
    expect(remember).not.toBeChecked()
  })

  it('forgot-password with a valid email toasts a reset link', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    await user.click(screen.getByRole('button', { name: /forgot password/i }))
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/reset link sent to sarah@nourishwithsim\.com/i),
      ),
    )
  })

  it('forgot-password with no email prompts for one and sends nothing', async () => {
    let hits = 0
    server.use(
      http.post(FORGOT, () => {
        hits += 1
        return HttpResponse.json({ ok: true })
      }),
    )
    const { user } = renderWithProviders(<LoginPage />)
    await user.clear(email())
    await user.type(email(), 'bad-no-at-sign')
    await user.click(screen.getByRole('button', { name: /forgot password/i }))

    expect(
      await screen.findByText(/enter your email above first/i),
    ).toBeInTheDocument()
    expect(hits).toBe(0)
    expect(showToast).not.toHaveBeenCalled()
  })
})

describe('LoginPage — edge cases', () => {
  it('accepts an uppercase / padded email (server normalises it)', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    await user.clear(email())
    await user.type(email(), '  SARAH@NOURISHWITHSIM.COM  ')
    await user.type(password(), 'secret')
    await user.click(signIn())
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(true),
    )
  })

  it('accepts a long password with unusual characters', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    await user.type(password(), `pä$$w🚀rd-${'x'.repeat(80)}`)
    await user.click(signIn())
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith({ to: '/' }))
  })
})

describe('LoginPage — accessibility', () => {
  it('labels the email and password fields', () => {
    renderWithProviders(<LoginPage />)
    expect(email()).toBeInTheDocument()
    expect(password()).toBeInTheDocument()
  })

  it('submits via keyboard (Enter) from the password field', async () => {
    const { user } = renderWithProviders(<LoginPage />)
    await user.click(password())
    await user.keyboard('secret{Enter}')
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith({ to: '/' }))
  })

  it('keeps the password masked by default and exposes a toggle name', () => {
    renderWithProviders(<LoginPage />)
    expect(password()).toHaveAttribute('type', 'password')
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toBeInTheDocument()
  })
})
