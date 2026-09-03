// Integration tests for the route tree's guards — the layer the page-level
// unit tests deliberately skip by mocking useNavigate. Here the REAL router
// runs with an in-memory history, so beforeLoad redirects and validateSearch
// parsing are exercised end to end. Pages load through MSW; the auth store is
// driven directly to simulate session + role.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/renderWithProviders'
import { useAuthStore } from '@/store/useAuthStore'
import { resetNutritionistStore } from '@/features/nutritionists/api/nutritionists.mock'
import { rootRoute } from './root'
import { loginRoute } from './login'
import { authedRoute } from './authed'
import { authedChildren } from './appRoutes'

// jsdom lacks ResizeObserver, which the dashboard's progress chart constructs.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as never)
// jsdom doesn't implement scrollTo; the router calls it on navigation.
window.scrollTo = window.scrollTo ?? (() => {})

// Lazy route chunks + their first query can take a beat to resolve; give the
// awaits that land on a lazy page more room than the 1s default.
const LAZY = { timeout: 4000 }

// Build the real tree once; each test gets its own router + memory history.
const routeTree = rootRoute.addChildren([
  loginRoute,
  authedRoute.addChildren(authedChildren),
])

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const utils = renderWithProviders(<RouterProvider router={router as never} />)
  return { router, ...utils }
}

const NUTRITIONIST = {
  name: 'Sarah Nolan',
  initials: 'SN',
  color: '#2F5D50',
  email: 'sarah@nourishwithsim.com',
}

function signIn(profile = NUTRITIONIST) {
  useAuthStore.setState({ isAuthenticated: true, activeProfile: profile })
}
function signOut() {
  useAuthStore.setState({ isAuthenticated: false })
}

beforeEach(() => {
  resetNutritionistStore()
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => vi.clearAllMocks())

describe('authed guard', () => {
  it('redirects an unauthenticated visitor to /login, preserving the target', async () => {
    signOut()
    const { router } = renderAt('/clients')

    // Lands on the login screen (rendered synchronously, not lazy).
    expect(await screen.findByText('Welcome back')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(String(router.state.location.search.redirect)).toContain('/clients')
  })

  it('lets an authenticated visitor through to a protected route', async () => {
    signIn()
    const { router } = renderAt('/clients')

    expect(
      await screen.findByText('User Roster', undefined, LAZY),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/clients')
  })
})

describe('login guard', () => {
  it('bounces an already-authenticated visitor off /login to home', async () => {
    signIn()
    const { router } = renderAt('/login')

    expect(
      await screen.findByText(/good morning/i, undefined, LAZY),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows the login screen when signed out', async () => {
    signOut()
    const { router } = renderAt('/login')

    expect(await screen.findByText('Welcome back')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})

// One role: managing other nutritionists is part of every account, so
// /nutritionists sits behind the plain authed guard and nothing else.
describe('/nutritionists', () => {
  it('admits any signed-in nutritionist to the roster', async () => {
    signIn()
    const { router } = renderAt('/nutritionists')

    expect(
      await screen.findByText('Nutritionist Roster', undefined, LAZY),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/nutritionists')
  })

  it('sends a signed-out visitor to /login like any other authed route', async () => {
    signOut()
    const { router } = renderAt('/nutritionists')

    expect(await screen.findByText('Welcome back')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})

describe('validateSearch', () => {
  it('parses valid roster search params through to the page', async () => {
    signIn()
    renderAt('/clients?status=active&page=2')

    // The parsed status reaches the ClientsPage filter control.
    await waitFor(
      () =>
        expect(screen.getByLabelText('Filter by status')).toHaveValue('active'),
      LAZY,
    )
  })

  it('sanitises an unknown status param to the default', async () => {
    signIn()
    renderAt('/clients?status=bogus')

    await screen.findByText('User Roster', undefined, LAZY)
    expect(screen.getByLabelText('Filter by status')).toHaveValue('all')
  })
})
