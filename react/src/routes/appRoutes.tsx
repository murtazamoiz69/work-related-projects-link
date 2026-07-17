import { lazy, Suspense, type ReactNode } from 'react'
import { createRoute } from '@tanstack/react-router'
import { authedRoute } from './authed'

// Lazy-load each screen so heavy routes (Chat + Plan Workspace, Program/Client
// Detail, etc.) become their own chunks and don't bloat the initial load.
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ClientsPage = lazy(() =>
  import('@/pages/ClientsPage').then((m) => ({ default: m.ClientsPage })),
)
const ClientDetailPage = lazy(() =>
  import('@/pages/ClientDetailPage').then((m) => ({
    default: m.ClientDetailPage,
  })),
)
const ChatPage = lazy(() =>
  import('@/pages/ChatPage').then((m) => ({ default: m.ChatPage })),
)
const ProgramsPage = lazy(() =>
  import('@/pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })),
)
const ProgramDetailPage = lazy(() =>
  import('@/pages/ProgramDetailPage').then((m) => ({
    default: m.ProgramDetailPage,
  })),
)
const TemplatesPage = lazy(() =>
  import('@/pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })),
)
const TemplateDetailPage = lazy(() =>
  import('@/pages/TemplateDetailPage').then((m) => ({
    default: m.TemplateDetailPage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
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
  component: () => (
    <Lazy>
      <ClientsPage />
    </Lazy>
  ),
})

export const clientDetailRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/clients/$clientId',
  component: () => {
    const { clientId } = clientDetailRoute.useParams()
    return (
      <Lazy>
        <ClientDetailPage clientId={clientId} />
      </Lazy>
    )
  },
})

export const chatRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/chat',
  validateSearch: (search: Record<string, unknown>): { c?: string } => ({
    c: typeof search.c === 'string' && search.c ? search.c : undefined,
  }),
  component: () => {
    const { c } = chatRoute.useSearch()
    return (
      <Lazy>
        <ChatPage initialConversationId={c} />
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

export const programDetailRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/programs/$programId',
  component: () => {
    const { programId } = programDetailRoute.useParams()
    return (
      <Lazy>
        <ProgramDetailPage programId={programId} />
      </Lazy>
    )
  },
})

export const templatesRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/templates',
  component: () => (
    <Lazy>
      <TemplatesPage />
    </Lazy>
  ),
})

export const templateDetailRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/templates/$templateId',
  validateSearch: (search: Record<string, unknown>): { edit?: boolean } => ({
    edit:
      search.edit === true || search.edit === 'true' || search.edit === '1'
        ? true
        : undefined,
  }),
  component: () => {
    const { templateId } = templateDetailRoute.useParams()
    const { edit } = templateDetailRoute.useSearch()
    return (
      <Lazy>
        <TemplateDetailPage templateId={templateId} initialEdit={!!edit} />
      </Lazy>
    )
  },
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

export const authedChildren = [
  indexRoute,
  clientsRoute,
  clientDetailRoute,
  chatRoute,
  programsRoute,
  programDetailRoute,
  templatesRoute,
  templateDetailRoute,
  settingsRoute,
]
