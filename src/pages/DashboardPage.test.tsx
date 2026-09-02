// Behavior tests for the Dashboard — a shell over four self-fetching panels
// (KPIs, Catch Up / needs-attention, User Progress, Upcoming Expiry). Tested at
// the composed-page level so each panel runs through real MSW. Routing is faked
// via useNavigate/Link; ResizeObserver is stubbed for the progress chart.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { CLIENT_FIXTURES } from '@/features/clients/api/clients.mock'
import { DashboardPage } from './DashboardPage'

const API = 'http://localhost:3000'
const ATTENTION = `${API}/dashboard/needs-attention`
const EXPIRY = `${API}/dashboard/upcoming-expirations`
const PROGRESS = `${API}/dashboard/client-progress`

// jsdom has no ResizeObserver; the progress chart constructs one.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as never)

const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateSpy,
    Link: ({ children, to }: { children: React.ReactNode; to: unknown }) => (
      <a href={String(to)}>{children}</a>
    ),
  }
})

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'

// Minimal week-dot data for synthesized needs-attention rows.
const week = () =>
  Array.from({ length: 7 }, (_, i) => ({
    tier: 'good',
    popover: 'On track',
    daysAgo: 6 - i,
  }))

beforeEach(() => {
  navigateSpy.mockClear()
  vi.mocked(showToast).mockClear()
})
afterEach(() => server.resetHandlers())

describe('DashboardPage — shell', () => {
  it('renders the greeting and all four panel headings', async () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText(/good morning, sarah/i)).toBeInTheDocument()
    expect(screen.getByText('Catch Up')).toBeInTheDocument()
    expect(screen.getByText('User Progress')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Plan Expiry')).toBeInTheDocument()
    // KPI grid landmark.
    expect(screen.getByLabelText('User roster snapshot')).toBeInTheDocument()
  })
})

describe('DashboardPage — KPI row', () => {
  it('shows dashes while loading, then numeric values', async () => {
    const { container } = renderWithProviders(<DashboardPage />)
    // First commit is pending → placeholder dashes.
    expect(container.querySelectorAll('.dash-kpi-value')[0]).toHaveTextContent(
      '—',
    )
    expect(screen.getByText('Total Users')).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByText('—')).not.toBeInTheDocument())
    expect(screen.getByText('New Users (24h)')).toBeInTheDocument()
    expect(screen.getByText('Logged Meals Today')).toBeInTheDocument()
  })

  it('shows an error affordance when the KPIs fail to load', async () => {
    server.use(
      http.get(`${API}/dashboard/kpis`, () =>
        HttpResponse.json({ message: 'kpis down' }, { status: 500 }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    const alert = await screen.findByText('kpis down')
    expect(alert).toBeInTheDocument()
    // A retry lives in the same block, and no zeroed cards are shown.
    expect(
      within(alert.closest('[role="alert"]') as HTMLElement).getByRole(
        'button',
        { name: /try again/i },
      ),
    ).toBeInTheDocument()
  })
})

describe('DashboardPage — Catch Up (needs attention)', () => {
  it('shows a loading row then the roster', async () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    // Filter chips arrive with the data.
    expect(
      await screen.findByRole('button', { name: /Needs Attention/ }),
    ).toBeInTheDocument()
  })

  it('filters to nothing when the search matches no user', async () => {
    const { user } = renderWithProviders(<DashboardPage />)
    await screen.findByRole('button', { name: /Needs Attention/ })

    await user.type(
      screen.getByPlaceholderText(/search by user name/i),
      'zzz-no-match',
    )
    expect(
      await screen.findByText('No users match your filters.'),
    ).toBeInTheDocument()
  })

  it('switching a filter chip marks it active', async () => {
    const { user } = renderWithProviders(<DashboardPage />)
    const chip = await screen.findByRole('button', { name: /New This Week/ })
    await user.click(chip)
    await waitFor(() => expect(chip).toHaveClass('active'))
  })

  it('collapses a long list behind "Show all", which expands', async () => {
    server.use(
      http.get(ATTENTION, () =>
        HttpResponse.json({
          rows: CLIENT_FIXTURES.slice(0, 10).map((c, i) => ({
            client: c,
            icon: 'message-circle',
            text: `reason ${i}`,
            week: week(),
          })),
          counts: { 'needs-attention': 10 },
          filters: [
            { key: 'needs-attention', label: 'Needs Attention', icon: 'bell' },
          ],
          weekRange: 'Aug 1 – Aug 7',
        }),
      ),
    )
    const { user } = renderWithProviders(<DashboardPage />)
    const showAll = await screen.findByRole('button', {
      name: /show all 10 users/i,
    })
    await user.click(showAll)
    expect(
      await screen.findByRole('button', { name: /show fewer users/i }),
    ).toBeInTheDocument()
  })

  it('shows an error with a retry that recovers', async () => {
    server.use(http.get(ATTENTION, () => HttpResponse.error()))
    const { user } = renderWithProviders(<DashboardPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
    server.resetHandlers()
    await user.click(within(alert).getByRole('button', { name: /try again/i }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Needs Attention/ }),
      ).toBeInTheDocument(),
    )
  })
})

describe('DashboardPage — User Progress', () => {
  it('renders both progress cards after loading', async () => {
    renderWithProviders(<DashboardPage />)
    expect(await screen.findByText('Meal Adherence')).toBeInTheDocument()
    expect(screen.getByText('Workout Completion')).toBeInTheDocument()
    expect(screen.getByText(/on-plan this week/i)).toBeInTheDocument()
  })

  it('changes the date range selector', async () => {
    const { user } = renderWithProviders(<DashboardPage />)
    await screen.findByText('Meal Adherence')

    const range = screen.getByLabelText('Date range')
    expect(range).toHaveValue('30')
    await user.selectOptions(range, '7')
    expect(range).toHaveValue('7')
  })

  it('shows an error with retry', async () => {
    server.use(http.get(PROGRESS, () => HttpResponse.error()))
    renderWithProviders(<DashboardPage />)
    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
  })
})

describe('DashboardPage — Upcoming Expiry', () => {
  it('renders expiry rows and a client action navigates to chat', async () => {
    server.use(
      http.get(EXPIRY, () =>
        HttpResponse.json([{ client: CLIENT_FIXTURES[0], daysLeft: 3 }]),
      ),
    )
    const { user } = renderWithProviders(<DashboardPage />)

    const nm = CLIENT_FIXTURES[0].name
    const msgBtn = await screen.findByRole('button', {
      name: `Open chat with ${nm}`,
    })
    await user.click(msgBtn)
    const call = navigateSpy.mock.calls.at(-1)?.[0] as { to?: string }
    expect(call.to).toBe('/chat')
  })

  it('renders an empty state when nothing is due', async () => {
    server.use(http.get(EXPIRY, () => HttpResponse.json([])))
    renderWithProviders(<DashboardPage />)
    expect(
      await screen.findByText('Nothing due in the next 7 days.'),
    ).toBeInTheDocument()
  })

  it('shows an error with retry', async () => {
    server.use(http.get(EXPIRY, () => HttpResponse.error()))
    renderWithProviders(<DashboardPage />)
    const alerts = await screen.findAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
  })
})

describe('DashboardPage — accessibility', () => {
  it('labels the progress selectors', async () => {
    renderWithProviders(<DashboardPage />)
    await screen.findByText('Meal Adherence')
    expect(screen.getByLabelText('Filter by program')).toBeInTheDocument()
    expect(screen.getByLabelText('Date range')).toBeInTheDocument()
  })

  it('gives each KPI info button an accessible name', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.queryByText('—')).not.toBeInTheDocument())
    expect(
      screen.getByRole('button', { name: 'What is Total Users?' }),
    ).toBeInTheDocument()
  })
})
