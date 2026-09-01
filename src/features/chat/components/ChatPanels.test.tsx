// Behavior tests for the smaller Chat surfaces: ClientOverview (Notes/Medical/
// Activity tabs + note composer), ActivityLogModal (client-side kind/search/
// range filtering), and ProgramProgressModal (dialog open/close). Routing and
// toast are mocked; the stateful chat mock is reset per test.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/mocks/server'
import { CONVERSATIONS } from '@/features/chat/data'
import { resetChatStore } from '@/features/chat/api/chat.mock'
import type { ChatActivityItem } from '@/features/chat/types'
import { ClientOverview } from './ClientOverview'
import { ActivityLogModal } from './ActivityLogModal'
import { ProgramProgressModal } from './ProgramProgressModal'

// jsdom implements neither of these; the activity log auto-scrolls to today
// and observes intersection for its sticky day headers.
Element.prototype.scrollIntoView =
  Element.prototype.scrollIntoView ?? (() => {})
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver =
  globalThis.IntersectionObserver ?? (IntersectionObserverStub as never)

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
  }
})

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'

const convo = () => CONVERSATIONS[0]

beforeEach(() => {
  vi.mocked(showToast).mockClear()
  resetChatStore()
})
afterEach(() => server.resetHandlers())

describe('ClientOverview', () => {
  it('opens on the Notes tab with the note composer', () => {
    renderWithProviders(<ClientOverview convo={convo()} />)
    expect(screen.getByText('Notes Summary')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/^Add a note about /),
    ).toBeInTheDocument()
  })

  it('switches to the Medical tab', async () => {
    const { user } = renderWithProviders(<ClientOverview convo={convo()} />)
    await user.click(screen.getByRole('tab', { name: 'Medical' }))
    expect(screen.getByText('Medical Information')).toBeInTheDocument()
    expect(screen.getByText('Allergies')).toBeInTheDocument()
  })

  it('opens the full activity log from the Activity tab', async () => {
    const { user } = renderWithProviders(<ClientOverview convo={convo()} />)
    await user.click(screen.getByRole('tab', { name: 'Activity' }))
    await user.click(screen.getByRole('button', { name: /view all activity/i }))
    expect(
      await screen.findByRole('button', { name: /close activity log/i }),
    ).toBeInTheDocument()
  })

  it('adds a note (posts, clears the field, toasts)', async () => {
    const { user } = renderWithProviders(<ClientOverview convo={convo()} />)
    const field = screen.getByPlaceholderText(/^Add a note about /)
    await user.type(field, 'Prefers morning check-ins')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Note added'))
    expect(field).toHaveValue('')
  })
})

describe('ActivityLogModal', () => {
  const now = new Date()
  const items: ChatActivityItem[] = [
    {
      kind: 'meal',
      category: 'Breakfast',
      icon: 'utensils',
      title: 'Logged breakfast',
      detail: 'Oatmeal and berries',
      time: now,
    },
    {
      kind: 'meal',
      category: 'Lunch',
      icon: 'utensils',
      title: 'Logged lunch',
      detail: 'Chicken salad',
      time: now,
    },
    {
      kind: 'workout',
      category: 'Push',
      icon: 'dumbbell',
      title: 'Completed workout',
      detail: 'Push day',
      time: now,
    },
    {
      kind: 'weight',
      icon: 'scale',
      title: 'Logged weight',
      detail: '72 kg',
      time: now,
    },
  ]

  const render = () =>
    renderWithProviders(
      <ActivityLogModal clientName="Priya" items={items} onClose={vi.fn()} />,
    )

  it('renders every activity entry', () => {
    render()
    expect(screen.getByText('Logged breakfast')).toBeInTheDocument()
    expect(screen.getByText('Completed workout')).toBeInTheDocument()
    expect(screen.getByText('Logged weight')).toBeInTheDocument()
  })

  it('filters to a single kind', async () => {
    const { user } = render()
    await user.click(screen.getByRole('button', { name: /^Meals/ }))
    expect(screen.getByText('Logged breakfast')).toBeInTheDocument()
    expect(screen.queryByText('Completed workout')).not.toBeInTheDocument()
  })

  it('narrows by search text', async () => {
    const { user } = render()
    await user.type(screen.getByPlaceholderText(/search activity/i), 'chicken')
    expect(screen.getByText('Logged lunch')).toBeInTheDocument()
    expect(screen.queryByText('Logged breakfast')).not.toBeInTheDocument()
  })

  it('shows an empty message when nothing matches the search', async () => {
    const { user } = render()
    await user.type(
      screen.getByPlaceholderText(/search activity/i),
      'zzz-no-match',
    )
    expect(await screen.findByText(/No results for/i)).toBeInTheDocument()
  })

  it('changes the date range', async () => {
    const { user } = render()
    const range = screen.getByLabelText('Date range')
    await user.selectOptions(range, '7')
    expect(range).toHaveValue('7')
  })

  it('closes via the Close button', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(
      <ActivityLogModal clientName="Priya" items={items} onClose={onClose} />,
    )
    await user.click(
      screen.getByRole('button', { name: /close activity log/i }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('ProgramProgressModal', () => {
  it('opens as a dialog and closes on Escape', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(
      <ProgramProgressModal client={convo().client} onClose={onClose} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
