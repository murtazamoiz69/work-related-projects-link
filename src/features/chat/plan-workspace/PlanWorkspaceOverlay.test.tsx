// Integration tests for the Plan Workspace shell — it loads a client's plan,
// NOTE: the client's name appears twice now (workspace header + the Profile
// card of the User Context rail), so name lookups are anchored on the heading.
// shows the tab surface, and closes. The individual tab/modal edit flows are a
// much larger surface left for follow-up; the plan.api layer (load/save/publish)
// is already covered by plan.api.test. Routing/toast mocked; jsdom observers
// stubbed for the embedded charts + activity log; the stateful plan mock reset.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { CLIENTS_DATA } from '@/features/clients'
import { resetPlanStore } from './api/plan.mock'
import { PlanWorkspaceOverlay } from './PlanWorkspaceOverlay'

const API = 'http://localhost:3000'
const PLAN = `${API}/clients/:id/plan`

// jsdom stubs for the embedded ProgramTrackerDashboard + ActivityLogList.
Element.prototype.scrollIntoView =
  Element.prototype.scrollIntoView ?? (() => {})
window.scrollTo = window.scrollTo ?? (() => {})
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ObserverStub as never)
globalThis.IntersectionObserver =
  globalThis.IntersectionObserver ?? (ObserverStub as never)

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

const client = () => {
  const c = CLIENTS_DATA.find((x) => x.id === 'c-1')
  if (!c) throw new Error('fixture c-1 missing')
  return c
}

beforeEach(() => resetPlanStore())
afterEach(() => {
  server.resetHandlers()
  document.body.classList.remove('pw-open')
})

describe('PlanWorkspaceOverlay — load states', () => {
  it('shows a loading state while the plan loads', () => {
    renderWithProviders(
      <PlanWorkspaceOverlay client={client()} onClose={vi.fn()} />,
    )
    expect(screen.getByText('Loading plan…')).toBeInTheDocument()
  })

  it('shows an error with a retry that recovers', async () => {
    server.use(
      http.get(PLAN, () =>
        HttpResponse.json({ message: 'Plan is down.' }, { status: 500 }),
      ),
    )
    const { user } = renderWithProviders(
      <PlanWorkspaceOverlay client={client()} onClose={vi.fn()} />,
    )
    expect(await screen.findByText('Plan is down.')).toBeInTheDocument()

    server.resetHandlers()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(
      await screen.findByRole('heading', { name: client().name }),
    ).toBeInTheDocument()
  })
})

describe('PlanWorkspaceOverlay — loaded shell', () => {
  it('renders the client header and all tabs', async () => {
    renderWithProviders(
      <PlanWorkspaceOverlay client={client()} onClose={vi.fn()} />,
    )
    // The topbar names the client.
    expect(
      await screen.findByRole('heading', { name: client().name }),
    ).toBeInTheDocument()
    for (const label of [
      'At a glance',
      'Workout Plan',
      'Diet Plan',
      'Activity',
      'Notes',
    ]) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByRole('tab', { name: 'At a glance' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('switches to the Workout Plan tab', async () => {
    const { user } = renderWithProviders(
      <PlanWorkspaceOverlay client={client()} onClose={vi.fn()} />,
    )
    await screen.findByRole('heading', { name: client().name })
    await user.click(screen.getByRole('tab', { name: 'Workout Plan' }))
    expect(screen.getByRole('tab', { name: 'Workout Plan' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    // The workout tab shows the plan-duration summary.
    // The Onboarding card's weight-loss line also reads "… weeks · …", so
    // match the plan-duration pill specifically.
    expect(screen.getByText(/^\d+ weeks · \d+ days$/)).toBeInTheDocument()
  })

  it('switches to the Activity tab (its own search)', async () => {
    const { user } = renderWithProviders(
      <PlanWorkspaceOverlay client={client()} onClose={vi.fn()} />,
    )
    await screen.findByRole('heading', { name: client().name })
    await user.click(screen.getByRole('tab', { name: 'Activity' }))
    expect(screen.getByPlaceholderText(/search activity/i)).toBeInTheDocument()
  })

  it('switches to the Diet Plan tab', async () => {
    const { user } = renderWithProviders(
      <PlanWorkspaceOverlay client={client()} onClose={vi.fn()} />,
    )
    await screen.findByRole('heading', { name: client().name })
    await user.click(screen.getByRole('tab', { name: 'Diet Plan' }))
    expect(screen.getByRole('tab', { name: 'Diet Plan' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})

describe('PlanWorkspaceOverlay — closing', () => {
  it('closes via the close button', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(
      <PlanWorkspaceOverlay client={client()} onClose={onClose} />,
    )
    await screen.findByRole('heading', { name: client().name })
    await user.click(
      screen.getByRole('button', { name: /close plan workspace/i }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape when no modal is open', async () => {
    const onClose = vi.fn()
    const { user } = renderWithProviders(
      <PlanWorkspaceOverlay client={client()} onClose={onClose} />,
    )
    await screen.findByRole('heading', { name: client().name })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })
})
