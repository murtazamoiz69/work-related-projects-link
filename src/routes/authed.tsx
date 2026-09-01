import { createRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/templates/AppLayout'
import { isAuthenticated } from '@/store/useAuthStore'
import { rootRoute } from './root'

/** Pathless layout route wrapping every authed screen in the app shell and
 *  guarding it behind the sessionStorage auth flag. */
export const authedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authed',
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AppLayout,
})
