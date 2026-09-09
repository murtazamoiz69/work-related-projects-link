// Behavior tests for the Add/Edit Nutritionist form (rhf + zod). Covers required
// fields, invalid values, create vs edit submission, duplicate submission,
// server-side field errors, and non-field server errors. The real mutations run
// through MSW; the modal itself uses no router.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { resetNutritionistStore } from '../api/nutritionists.mock'
import type { Nutritionist } from '../types'
import { NutritionistFormModal } from './NutritionistFormModal'

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'

const API = 'http://localhost:3000'
const CREATE = `${API}/nutritionists`
const UPDATE = `${API}/nutritionists/:id`

const name = () => screen.getByLabelText('Full name')
const emailField = () => screen.getByLabelText('Email')
// The phone field is labelled with its country code, since the code is shown
// rather than typed.
const phoneField = () => screen.getByLabelText(/^Phone number, \+91/)
const qualification = () => screen.getByLabelText('Qualification')
const experience = () => screen.getByLabelText('Experience (years)')

function existingNutritionist(): Nutritionist {
  return {
    id: 'nut-1',
    name: 'Dr. Priya Sharma',
    initials: 'PS',
    color: '#2F5D50',
    email: 'priya@nourishwithsim.com',
    phone: '+91 9876543210',
    qualification: 'Registered Dietitian',
    experienceYears: 8,
    joinDate: new Date('2023-06-01'),
    memberIds: ['c-1', 'c-2'],
    accessEnabled: true,
  }
}

beforeEach(() => resetNutritionistStore())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

describe('NutritionistFormModal — rendering', () => {
  it('opens in add mode with empty fields', () => {
    renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={vi.fn()} />,
    )
    expect(
      screen.getByRole('heading', { name: 'Add nutritionist' }),
    ).toBeInTheDocument()
    expect(name()).toHaveValue('')
    expect(
      screen.getByRole('button', { name: 'Add nutritionist' }),
    ).toBeInTheDocument()
  })

  it('opens in edit mode prefilled from the nutritionist', () => {
    renderWithProviders(
      <NutritionistFormModal
        nutritionist={existingNutritionist()}
        onClose={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Edit nutritionist' }),
    ).toBeInTheDocument()
    expect(name()).toHaveValue('Dr. Priya Sharma')
    expect(emailField()).toHaveValue('priya@nourishwithsim.com')
    expect(experience()).toHaveValue(8)
    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toBeInTheDocument()
  })
})

describe('NutritionistFormModal — validation', () => {
  it('requires name, email and qualification', async () => {
    let hits = 0
    server.use(
      http.post(CREATE, () => {
        hits += 1
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    const { user } = renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: 'Add nutritionist' }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Qualification is required.')).toBeInTheDocument()
    expect(hits).toBe(0)
  })

  it('rejects an invalid email', async () => {
    const { user } = renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={vi.fn()} />,
    )
    await user.type(name(), 'Test Person')
    await user.type(emailField(), 'not-an-email')
    await user.type(phoneField(), '9876543210')
    await user.type(qualification(), 'RD')
    await user.click(screen.getByRole('button', { name: 'Add nutritionist' }))

    expect(await screen.findByText('Enter a valid email.')).toBeInTheDocument()
  })

  it('rejects a negative experience', async () => {
    const { user } = renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={vi.fn()} />,
    )
    await user.type(name(), 'Test Person')
    await user.type(emailField(), 'test@nourishwithsim.com')
    await user.type(phoneField(), '9876543210')
    await user.type(qualification(), 'RD')
    await user.clear(experience())
    await user.type(experience(), '-1')
    await user.click(screen.getByRole('button', { name: 'Add nutritionist' }))

    expect(await screen.findByText('Cannot be negative.')).toBeInTheDocument()
  })

  it('rejects an empty experience (NaN)', async () => {
    const { user } = renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={vi.fn()} />,
    )
    await user.type(name(), 'Test Person')
    await user.type(emailField(), 'test@nourishwithsim.com')
    await user.type(phoneField(), '9876543210')
    await user.type(qualification(), 'RD')
    await user.clear(experience())
    await user.click(screen.getByRole('button', { name: 'Add nutritionist' }))

    expect(
      await screen.findByText('Enter the years of experience.'),
    ).toBeInTheDocument()
  })
})

describe('NutritionistFormModal — create', () => {
  it('submits the new nutritionist and closes', async () => {
    const onClose = vi.fn()
    const onRequest = vi.fn()
    server.use(
      http.post(CREATE, async ({ request }) => {
        onRequest(await request.json())
        return HttpResponse.json(
          {
            id: 'nut-new',
            name: 'Test Person',
            initials: 'TP',
            color: '#000',
            email: 'test.person@nourishwithsim.com',
            qualification: 'Registered Dietitian',
            experienceYears: 3,
            joinDate: new Date().toISOString(),
            memberIds: [],
            accessEnabled: true,
          },
          { status: 201 },
        )
      }),
    )
    const { user } = renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={onClose} />,
    )
    await user.type(name(), 'Test Person')
    await user.type(emailField(), 'test.person@nourishwithsim.com')
    await user.type(phoneField(), '9876543210')
    await user.type(qualification(), 'Registered Dietitian')
    await user.clear(experience())
    await user.type(experience(), '3')
    await user.click(screen.getByRole('button', { name: 'Add nutritionist' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onRequest).toHaveBeenCalledWith({
      name: 'Test Person',
      email: 'test.person@nourishwithsim.com',
      // Normalised to one canonical +91 form on submit, whatever was typed.
      phone: '+91 9876543210',
      qualification: 'Registered Dietitian',
      experienceYears: 3,
    })
  })

  it('does not double-submit while the create is in flight', async () => {
    let hits = 0
    server.use(
      http.post(CREATE, async () => {
        hits += 1
        await delay(80)
        return HttpResponse.json({ id: 'x' }, { status: 201 })
      }),
    )
    const { user } = renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={vi.fn()} />,
    )
    await user.type(name(), 'Test Person')
    await user.type(emailField(), 'test@nourishwithsim.com')
    await user.type(phoneField(), '9876543210')
    await user.type(qualification(), 'RD')
    const submit = screen.getByRole('button', { name: 'Add nutritionist' })
    await user.click(submit)
    await user.click(submit) // disabled while pending
    await waitFor(() => expect(hits).toBeGreaterThan(0))
    expect(hits).toBe(1)
  })
})

describe('NutritionistFormModal — edit', () => {
  it('submits changes via PUT and closes', async () => {
    const onClose = vi.fn()
    const onRequest = vi.fn()
    server.use(
      http.put(UPDATE, async ({ params, request }) => {
        onRequest({ id: String(params.id), body: await request.json() })
        return HttpResponse.json({
          ...existingNutritionistDto(),
          name: 'Dr. Priya Nair',
        })
      }),
    )
    const { user } = renderWithProviders(
      <NutritionistFormModal
        nutritionist={existingNutritionist()}
        onClose={onClose}
      />,
    )
    await user.clear(name())
    await user.type(name(), 'Dr. Priya Nair')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onRequest).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'nut-1' }),
    )
  })
})

describe('NutritionistFormModal — server errors', () => {
  it('maps a 422 field error onto the email input and keeps the modal open', async () => {
    const onClose = vi.fn()
    server.use(
      http.post(CREATE, () =>
        HttpResponse.json(
          {
            message: 'Please fix the errors.',
            fields: { email: 'That email is already registered.' },
          },
          { status: 422 },
        ),
      ),
    )
    const { user } = renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={onClose} />,
    )
    await user.type(name(), 'Test Person')
    await user.type(emailField(), 'dupe@nourishwithsim.com')
    await user.type(phoneField(), '9876543210')
    await user.type(qualification(), 'RD')
    await user.click(screen.getByRole('button', { name: 'Add nutritionist' }))

    expect(
      await screen.findByText('That email is already registered.'),
    ).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('toasts a non-field server error and keeps the modal open', async () => {
    const onClose = vi.fn()
    server.use(
      http.post(CREATE, () =>
        HttpResponse.json({ message: 'Server on fire.' }, { status: 500 }),
      ),
    )
    const { user } = renderWithProviders(
      <NutritionistFormModal nutritionist={null} onClose={onClose} />,
    )
    await user.type(name(), 'Test Person')
    await user.type(emailField(), 'test@nourishwithsim.com')
    await user.type(phoneField(), '9876543210')
    await user.type(qualification(), 'RD')
    await user.click(screen.getByRole('button', { name: 'Add nutritionist' }))

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith('Server on fire.'),
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})

// A wire DTO for the edit handler to echo back.
function existingNutritionistDto() {
  return {
    id: 'nut-1',
    name: 'Dr. Priya Sharma',
    initials: 'PS',
    color: '#2F5D50',
    email: 'priya@nourishwithsim.com',
    qualification: 'Registered Dietitian',
    experienceYears: 8,
    joinDate: new Date('2023-06-01').toISOString(),
    memberIds: ['c-1', 'c-2'],
    accessEnabled: true,
  }
}
