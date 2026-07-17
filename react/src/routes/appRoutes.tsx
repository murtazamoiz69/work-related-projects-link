import { createRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { ChatPage } from '@/pages/ChatPage'
import { ProgramsPage } from '@/pages/ProgramsPage'
import { ProgramDetailPage } from '@/pages/ProgramDetailPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { TemplateDetailPage } from '@/pages/TemplateDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { authedRoute } from './authed'

export const indexRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/',
  component: DashboardPage,
})

export const clientsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/clients',
  component: ClientsPage,
})

export const clientDetailRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/clients/$clientId',
  component: () => {
    const { clientId } = clientDetailRoute.useParams()
    return <ClientDetailPage clientId={clientId} />
  },
})

export const chatRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/chat',
  component: ChatPage,
})

export const programsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/programs',
  component: ProgramsPage,
})

export const programDetailRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/programs/$programId',
  component: () => {
    const { programId } = programDetailRoute.useParams()
    return <ProgramDetailPage programId={programId} />
  },
})

export const templatesRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/templates',
  component: TemplatesPage,
})

export const templateDetailRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/templates/$templateId',
  validateSearch: (
    search: Record<string, unknown>,
  ): { edit?: boolean } => ({
    edit:
      search.edit === true || search.edit === 'true' || search.edit === '1'
        ? true
        : undefined,
  }),
  component: () => {
    const { templateId } = templateDetailRoute.useParams()
    const { edit } = templateDetailRoute.useSearch()
    return <TemplateDetailPage templateId={templateId} initialEdit={!!edit} />
  },
})

export const settingsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/settings',
  component: SettingsPage,
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
