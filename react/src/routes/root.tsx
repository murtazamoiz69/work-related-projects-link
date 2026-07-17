import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/organisms/ErrorBoundary'

export const rootRoute = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}
