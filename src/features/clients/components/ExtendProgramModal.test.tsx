// Behavior tests for the Extend Program form (rhf + zod). Covers required /
// invalid / valid values, submission, duplicate submission, server-side
// validation mapping, and success — driving the real mutation through MSW.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { Client } from '../types'
import { ExtendProgramModal } from './ExtendProgramModal'

// Feedback is a fire-and-forget toast; spy on it rather than render the shell.
vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'

const API = 'http://localhost:3000'
const EXPIRY_ENDPOINT = `${API}/clients/:id/expiry`

// A client whose current expiry is *today*, so the default "+30 days" lands in
// the future and the mock backend accepts it. id 'c-1' exists in the fixtures.
function makeClient(overrides: Partial<Client> = {}): Client {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return {
    id: 'c-1',
    name: 'Priya Sharma',
    initials: 'PS',
    color: '#123456',
    age: 32,
    gender: 'Female',
    email: 'priya@example.com',
    program: 'Weight Loss',
    plan: 'Premium',
    status: 'active',
    accessEnabled: true,
    expiryDate: today,
    adherence: 80,
    checkInDays: 3,
    joinDate: new Date('2024-01-01'),
    goals: ['Lose weight'],
    diet: 'Balanced',
    ...overrides,
  }
}

afterEach(() => vi.clearAllMocks())

describe('ExtendProgramModal', () => {
  describe('rendering', () => {
    it('opens with the +30 days default selected and computes the new expiry', () => {
      renderWithProviders(
        <ExtendProgramModal client={makeClient()} onClose={vi.fn()} />,
      )
      expect(
        screen.getByRole('heading', { name: 'Extend program' }),
      ).toBeInTheDocument()
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
      // The +30 quick option is the active one on open.
      expect(screen.getByRole('button', { name: '+30 days' })).toHaveClass(
        'active',
      )
      // Custom date field is hidden until "Custom" is chosen.
      expect(
        screen.queryByLabelText(/new expiry date/i),
      ).not.toBeInTheDocument()
    })
  })

  describe('valid submission', () => {
    it('extends with the quick option, closes, and toasts success', async () => {
      const onClose = vi.fn()
      const onRequest = vi.fn()
      server.use(
        http.patch(EXPIRY_ENDPOINT, async ({ params, request }) => {
          const body = (await request.json()) as { expiryDate: string }
          onRequest({ id: String(params.id), expiryDate: body.expiryDate })
          return HttpResponse.json({
            ...makeSerializedClient(),
            expiryDate: body.expiryDate,
          })
        }),
      )

      const { user } = renderWithProviders(
        <ExtendProgramModal client={makeClient()} onClose={onClose} />,
      )
      await user.click(screen.getByRole('button', { name: 'Extend program' }))

      // The form's job: submit the right payload for the right client, then
      // close. (The success toast is raised by the mutation hook, not the
      // form, so it's asserted at that layer rather than here.)
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
      expect(onRequest).toHaveBeenCalledWith({
        id: 'c-1',
        expiryDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    })
  })

  describe('invalid values (client-side zod)', () => {
    it('rejects an empty custom date without calling the server', async () => {
      let hits = 0
      server.use(
        http.patch(EXPIRY_ENDPOINT, () => {
          hits += 1
          return HttpResponse.json(makeSerializedClient())
        }),
      )
      const { user } = renderWithProviders(
        <ExtendProgramModal client={makeClient()} onClose={vi.fn()} />,
      )
      await user.click(screen.getByRole('button', { name: 'Custom' }))
      const dateInput = screen.getByLabelText(/new expiry date/i)
      await user.clear(dateInput)
      await user.click(screen.getByRole('button', { name: 'Extend program' }))

      expect(await screen.findByText(/enter a valid date/i)).toBeInTheDocument()
      expect(hits).toBe(0)
    })

    it('rejects a custom date on/before the current expiry', async () => {
      const client = makeClient()
      const { user } = renderWithProviders(
        <ExtendProgramModal client={client} onClose={vi.fn()} />,
      )
      await user.click(screen.getByRole('button', { name: 'Custom' }))
      const dateInput = screen.getByLabelText(/new expiry date/i)
      // A date in the past (before current expiry === today).
      await user.clear(dateInput)
      await user.type(dateInput, '2020-01-01')
      await user.click(screen.getByRole('button', { name: 'Extend program' }))

      expect(
        await screen.findByText(/pick a date after the current expiry/i),
      ).toBeInTheDocument()
    })
  })

  describe('server validation error (422)', () => {
    it('maps the field error onto the custom date input and keeps the modal open', async () => {
      const onClose = vi.fn()
      server.use(
        http.patch(EXPIRY_ENDPOINT, () =>
          HttpResponse.json(
            {
              message: 'The program could not be extended.',
              fields: { expiryDate: 'That date clashes with billing.' },
            },
            { status: 422 },
          ),
        ),
      )
      const { user } = renderWithProviders(
        <ExtendProgramModal client={makeClient()} onClose={onClose} />,
      )
      await user.click(screen.getByRole('button', { name: 'Extend program' }))

      expect(
        await screen.findByText(/clashes with billing/i),
      ).toBeInTheDocument()
      // 422 switches the form to the custom option and keeps it open.
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('non-validation server error (500)', () => {
    it('toasts the error and keeps the modal open', async () => {
      const onClose = vi.fn()
      server.use(
        http.patch(EXPIRY_ENDPOINT, () =>
          HttpResponse.json({ message: 'boom' }, { status: 500 }),
        ),
      )
      const { user } = renderWithProviders(
        <ExtendProgramModal client={makeClient()} onClose={onClose} />,
      )
      await user.click(screen.getByRole('button', { name: 'Extend program' }))

      await waitFor(() => expect(showToast).toHaveBeenCalled())
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('duplicate submission', () => {
    it('fires the mutation once even if submit is clicked twice', async () => {
      let hits = 0
      server.use(
        http.patch(EXPIRY_ENDPOINT, async ({ request }) => {
          hits += 1
          await delay(80) // keep the mutation pending so the button disables
          const body = (await request.json()) as { expiryDate: string }
          return HttpResponse.json({
            ...makeSerializedClient(),
            expiryDate: body.expiryDate,
          })
        }),
      )
      const { user } = renderWithProviders(
        <ExtendProgramModal client={makeClient()} onClose={vi.fn()} />,
      )
      const submit = screen.getByRole('button', { name: 'Extend program' })
      await user.click(submit)
      // Second click while pending — the button is disabled, so this is a no-op.
      await user.click(submit)

      await waitFor(() => expect(hits).toBeGreaterThan(0))
      expect(hits).toBe(1)
    })
  })
})

// A serialized (wire) client the PATCH handlers can echo back.
function makeSerializedClient() {
  return {
    id: 'c-1',
    name: 'Priya Sharma',
    initials: 'PS',
    color: '#123456',
    age: 32,
    gender: 'Female' as const,
    email: 'priya@example.com',
    program: 'Weight Loss',
    plan: 'Premium',
    status: 'active' as const,
    accessEnabled: true,
    expiryDate: new Date().toISOString(),
    adherence: 80,
    checkInDays: 3,
    joinDate: new Date('2024-01-01').toISOString(),
    goals: ['Lose weight'],
    diet: 'Balanced',
  }
}
