import { lazy, Suspense, type ReactNode } from 'react'
import { createRoute } from '@tanstack/react-router'
import { authedRoute } from './authed'

// Lazy-load each screen so heavy routes (Chat + Plan Workspace, Program
// Detail, etc.) become their own chunks and don't bloat the initial load.
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
const BroadcastsListPage = lazy(() =>
  import('@/pages/BroadcastsListPage').then((m) => ({
    default: m.BroadcastsListPage,
  })),
)
const BroadcastDetailPage = lazy(() =>
  import('@/pages/BroadcastDetailPage').then((m) => ({
    default: m.BroadcastDetailPage,
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
  component: () => (
    <Lazy>
      <ClientsPage />
    </Lazy>
  ),
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
  validateSearch: (
    search: Record<string, unknown>,
  ): { edit?: boolean; returnBroadcastId?: string } => ({
    edit:
      search.edit === true || search.edit === 'true' || search.edit === '1'
        ? true
        : undefined,
    returnBroadcastId:
      typeof search.returnBroadcastId === 'string'
        ? search.returnBroadcastId
        : undefined,
  }),
  component: () => {
    const { templateId } = templateDetailRoute.useParams()
    const { edit, returnBroadcastId } = templateDetailRoute.useSearch()
    return (
      <Lazy>
        <TemplateDetailPage
          templateId={templateId}
          initialEdit={!!edit}
          returnBroadcastId={returnBroadcastId}
        />
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

export const broadcastListRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/broadcast',
  component: () => (
    <Lazy>
      <BroadcastsListPage />
    </Lazy>
  ),
})

export const broadcastDetailRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/broadcast/$broadcastId',
  validateSearch: (
    search: Record<string, unknown>,
  ): { edit?: boolean; newTemplateId?: string } => ({
    edit:
      search.edit === true || search.edit === 'true' || search.edit === '1'
        ? true
        : undefined,
    newTemplateId:
      typeof search.newTemplateId === 'string'
        ? search.newTemplateId
        : undefined,
  }),
  component: () => {
    const { broadcastId } = broadcastDetailRoute.useParams()
    const { edit, newTemplateId } = broadcastDetailRoute.useSearch()
    return (
      <Lazy>
        <BroadcastDetailPage
          broadcastId={broadcastId}
          initialEdit={!!edit}
          newTemplateId={newTemplateId}
        />
      </Lazy>
    )
  },
})

export const authedChildren = [
  indexRoute,
  clientsRoute,
  chatRoute,
  programsRoute,
  programDetailRoute,
  templatesRoute,
  templateDetailRoute,
  settingsRoute,
  broadcastListRoute,
  broadcastDetailRoute,
]
