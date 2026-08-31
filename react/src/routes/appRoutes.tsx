import { lazy, Suspense, type ReactNode } from 'react'
import { createRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/useAuthStore'
import type { ClientsSearch } from '@/features/clients/api/clients.types'
import { authedRoute } from './authed'

// Lazy-load each screen so heavy routes (Chat + Plan Workspace, Program,
// etc.) become their own chunks and don't bloat the initial load.
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ClientsPage = lazy(() =>
  import('@/pages/ClientsPage').then((m) => ({ default: m.ClientsPage })),
)
const ChatPage = lazy(() =>
  import('@/pages/ChatPage').then((m) => ({ default: m.ChatPage })),
)
const ProgramsPage = lazy(() =>
  import('@/pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const NutritionistsPage = lazy(() =>
  import('@/pages/NutritionistsPage').then((m) => ({
    default: m.NutritionistsPage,
  })),
)

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

export const indexRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/',
  component: () => (
    <Lazy>
      <DashboardPage />
    </Lazy>
  ),
})

export const clientsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/clients',
  validateSearch: (search: Record<string, unknown>): ClientsSearch => {
    const { status, expiry } = search
    const page = Number(search.page)
    return {
      q: typeof search.q === 'string' && search.q ? search.q : undefined,
      status: status === 'active' || status === 'disabled' ? status : undefined,
      expiry:
        expiry === 'expiring-soon' ||
        expiry === 'expired' ||
        expiry === 'active'
          ? expiry
          : undefined,
      page: Number.isFinite(page) && page > 1 ? page : undefined,
    }
  },
  component: () => {
    const search = clientsRoute.useSearch()
    return (
      <Lazy>
        <ClientsPage search={search} />
      </Lazy>
    )
  },
})

export const chatRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/chat',
  validateSearch: (
    search: Record<string, unknown>,
  ): { c?: string; plan?: boolean } => ({
    c: typeof search.c === 'string' && search.c ? search.c : undefined,
    // `?plan=1` is how "Manage Plan" asks for the workspace to be open on
    // arrival. Accepts the string form too, so a pasted URL behaves.
    plan:
      search.plan === true || search.plan === '1' || search.plan === 'true'
        ? true
        : undefined,
  }),
  component: () => {
    const { c, plan } = chatRoute.useSearch()
    return (
      <Lazy>
        <ChatPage initialConversationId={c} openPlanWorkspace={plan} />
      </Lazy>
    )
  },
})

export const programsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/programs',
  component: () => (
    <Lazy>
      <ProgramsPage />
    </Lazy>
  ),
})

export const settingsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/settings',
  component: () => (
    <Lazy>
      <SettingsPage />
    </Lazy>
  ),
})

// Super Admin's one added page — gated the same way authedRoute gates on
// isAuthenticated(): an outside-React store check in beforeLoad.
export const nutritionistsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/nutritionists',
  beforeLoad: () => {
    if (useAuthStore.getState().activeProfile.role !== 'Super Admin') {
      throw redirect({ to: '/' })
    }
  },
  component: () => (
    <Lazy>
      <NutritionistsPage />
    </Lazy>
  ),
})

export const authedChildren = [
  indexRoute,
  clientsRoute,
  chatRoute,
  programsRoute,
  settingsRoute,
  nutritionistsRoute,
]
