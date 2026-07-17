import { createRouter } from '@tanstack/react-router'
import { rootRoute } from '@/routes/root'
import { loginRoute } from '@/routes/login'
import { authedRoute } from '@/routes/authed'
import { authedChildren } from '@/routes/appRoutes'

const routeTree = rootRoute.addChildren([
  loginRoute,
  authedRoute.addChildren(authedChildren),
])

export const router = createRouter({ routeTree })

// Register the router instance for full type-safety across the app.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
