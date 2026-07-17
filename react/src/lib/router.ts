import { createRouter } from '@tanstack/react-router'
import { rootRoute } from '@/routes/root'
import { indexRoute } from '@/routes/index'

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({ routeTree })

// Register the router instance for full type-safety across the app.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
