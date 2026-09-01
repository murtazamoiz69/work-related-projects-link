// Behavior tests for the Settings page — Profile (auth store), Notifications
// (optimistic API), Security (change-password form + 2FA), and Practice
// details (API form). Only one section renders at a time, so tests navigate
// via the section nav first. Routing faked via useNavigate; toast spied; the
// localStorage-backed settings mock is reset per test.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { useAuthStore } from '@/store/useAuthStore'
import { resetSettingsStore } from '@/features/settings/api/settings.mock'
import { SettingsPage } from './SettingsPage'

const API = 'http://localhost:3000'
const PREFS = `${API}/me/notification-preferences`
const PRACTICE = `${API}/me/practice`
const PASSWORD = `${API}/me/password`

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

const PROFILE = {
  name: 'Sarah Nolan',
  role: 'Nutritionist',
  initials: 'SN',
  color: '#2F5D50',
  email: 'sarah@nourishwithsim.com',
}

const goTo = (user: UserEvent, label: string) =>
  user.click(screen.getByRole('button', { name: label }))

beforeEach(() => {
  navigateSpy.mockClear()
  vi.mocked(showToast).mockClear()
  resetSettingsStore()
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ isAuthenticated: true, activeProfile: PROFILE })
})
afterEach(() => server.resetHandlers())

describe('SettingsPage — nav & profile', () => {
  it('opens on the Profile section, prefilled from the active profile', () => {
    renderWithProviders(<SettingsPage />)
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toHaveValue('Sarah Nolan')
    expect(screen.getByLabelText('Email')).toHaveValue(
      'sarah@nourishwithsim.com',
    )
  })

  it('saves profile edits to the store and toasts', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    const nameField = screen.getByLabelText('Full Name')
    await user.clear(nameField)
    await user.type(nameField, 'Sarah Chen')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(useAuthStore.getState().activeProfile.name).toBe('Sarah Chen')
    expect(useAuthStore.getState().activeProfile.initials).toBe('SC')
    expect(showToast).toHaveBeenCalledWith('Profile updated')
  })

  it('applies a chosen avatar colour on save', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await user.click(screen.getByTitle('#3B6FA6'))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(useAuthStore.getState().activeProfile.color).toBe('#3B6FA6')
  })

  it('falls back to the current name when the field is blank', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    const nameField = screen.getByLabelText('Full Name')
    await user.clear(nameField)
    await user.type(nameField, '   ')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    expect(useAuthStore.getState().activeProfile.name).toBe('Sarah Nolan')
  })

  it('logs out and redirects to /login', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await user.click(screen.getByRole('button', { name: 'Log Out' }))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(navigateSpy).toHaveBeenCalledWith({ to: '/login' })
  })

  it('switches between sections', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Practice Details')
    expect(
      await screen.findByRole('heading', { name: 'Practice Details' }),
    ).toBeInTheDocument()
    // Profile section is no longer mounted.
    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument()
  })
})

describe('SettingsPage — notifications', () => {
  it('reflects the saved preferences once loaded', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Notifications')

    const email = await screen.findByRole('checkbox', {
      name: /Email notifications/,
    })
    await waitFor(() => expect(email).toBeEnabled())
    expect(email).toBeChecked() // default: email on
    expect(
      screen.getByRole('checkbox', { name: /Weekly summary/ }),
    ).not.toBeChecked() // default: weekly off
  })

  it('optimistically flips a toggle and persists it', async () => {
    let put: Record<string, unknown> | null = null
    server.use(
      http.put(PREFS, async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(put)
      }),
    )
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Notifications')
    const weekly = await screen.findByRole('checkbox', {
      name: /Weekly summary/,
    })
    await waitFor(() => expect(weekly).toBeEnabled())

    await user.click(weekly)
    expect(weekly).toBeChecked() // optimistic — flips immediately
    await waitFor(() => expect(put).toMatchObject({ weekly: true }))
  })

  it('rolls the toggle back and toasts when the save fails', async () => {
    server.use(
      http.put(PREFS, () =>
        HttpResponse.json({ message: 'nope' }, { status: 500 }),
      ),
    )
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Notifications')
    const weekly = await screen.findByRole('checkbox', {
      name: /Weekly summary/,
    })
    await waitFor(() => expect(weekly).toBeEnabled())

    await user.click(weekly) // optimistic on
    await waitFor(() => expect(weekly).not.toBeChecked()) // rolled back
    expect(showToast).toHaveBeenCalled()
  })
})

describe('SettingsPage — security (change password)', () => {
  const fill = async (
    user: UserEvent,
    current: string,
    next: string,
    confirm: string,
  ) => {
    if (current)
      await user.type(screen.getByLabelText('Current Password'), current)
    if (next) await user.type(screen.getByLabelText('New Password'), next)
    if (confirm)
      await user.type(screen.getByLabelText('Confirm New Password'), confirm)
  }

  it('requires the current password', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Security')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))
    expect(
      await screen.findByText('Enter your current password.'),
    ).toBeInTheDocument()
  })

  it('requires a new password of at least 8 characters', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Security')
    await fill(user, 'oldpass', 'short', 'short')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))
    expect(
      await screen.findByText(/at least 8 characters/i),
    ).toBeInTheDocument()
  })

  it('rejects a mismatched confirmation', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Security')
    await fill(user, 'oldpass', 'longenough1', 'longenough2')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))
    expect(await screen.findByText(/don.t match/i)).toBeInTheDocument()
  })

  it('submits a valid change, clears the form, and toasts', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Security')
    await fill(user, 'oldpass', 'longenough1', 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith('Password updated'),
    )
    expect(screen.getByLabelText('Current Password')).toHaveValue('')
  })

  it('maps a server 422 onto the current-password field', async () => {
    server.use(
      http.put(PASSWORD, () =>
        HttpResponse.json(
          {
            message: 'Wrong password.',
            fields: { currentPassword: 'That password is incorrect.' },
          },
          { status: 422 },
        ),
      ),
    )
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Security')
    await fill(user, 'wrongpass', 'longenough1', 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    expect(
      await screen.findByText('That password is incorrect.'),
    ).toBeInTheDocument()
  })

  it('toggles two-factor authentication', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Security')
    // The only checkbox in this section is the 2FA toggle.
    const twoFactor = await screen.findByRole('checkbox')
    await waitFor(() => expect(twoFactor).toBeEnabled())
    await user.click(twoFactor)
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Two-factor authentication enabled',
      ),
    )
  })
})

describe('SettingsPage — practice details', () => {
  it('loads the prefilled practice form', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Practice Details')
    expect(await screen.findByLabelText('Practice Name')).toHaveValue(
      'Nourish with Nourish AI',
    )
  })

  it('saves an edited practice name and toasts', async () => {
    let put: Record<string, unknown> | null = null
    server.use(
      http.put(PRACTICE, async ({ request }) => {
        put = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(put)
      }),
    )
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Practice Details')
    const nameField = await screen.findByLabelText('Practice Name')
    await user.clear(nameField)
    await user.type(nameField, 'Chen Nutrition')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith('Practice details updated'),
    )
    expect(put).toMatchObject({ name: 'Chen Nutrition' })
  })

  it('requires a practice name', async () => {
    let hits = 0
    server.use(
      http.put(PRACTICE, () => {
        hits += 1
        return HttpResponse.json({})
      }),
    )
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Practice Details')
    const nameField = await screen.findByLabelText('Practice Name')
    await user.clear(nameField)
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    // Client-side zod blocks the request.
    await waitFor(() => expect(hits).toBe(0))
  })
})

describe('SettingsPage — accessibility', () => {
  it('labels the password fields', async () => {
    const { user } = renderWithProviders(<SettingsPage />)
    await goTo(user, 'Security')
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
  })
})
