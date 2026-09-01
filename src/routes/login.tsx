import { createRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '@/pages/LoginPage'
import { isAuthenticated } from '@/store/useAuthStore'
import { rootRoute } from './root'

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: '/' })
  },
  component: LoginRouteComponent,
})

function LoginRouteComponent() {
  const { redirect: to } = loginRoute.useSearch()
  return <LoginPage redirect={to} />
}
