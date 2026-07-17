import { createRoute } from '@tanstack/react-router'
import { HomePage } from '@/pages/HomePage'
import { rootRoute } from './root'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})
