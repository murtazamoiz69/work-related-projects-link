import { createHashHistory, createRouter } from '@tanstack/react-router'
import { rootRoute } from '@/routes/root'
import { loginRoute } from '@/routes/login'
import { authedRoute } from '@/routes/authed'
import { authedChildren } from '@/routes/appRoutes'

const routeTree = rootRoute.addChildren([
  loginRoute,
  authedRoute.addChildren(authedChildren),
])

// Static hosts (the single-file demo build) serve one HTML file with no
// server-side rewrite, so path-based routes 404 on reload or deep link.
// Hash history keeps every route inside the fragment. Dev and normal builds
// keep the default browser history.
const useHashHistory = import.meta.env.VITE_HASH_ROUTER === 'true'

export const router = createRouter({
  routeTree,
  ...(useHashHistory ? { history: createHashHistory() } : {}),
})

// Register the router instance for full type-safety across the app.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
