import { createRootRoute, Outlet } from '@tanstack/react-router'
import { ErrorBoundary } from '@/components/organisms/ErrorBoundary'
import { ShellToast } from '@/components/organisms/ShellToast'

export const rootRoute = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ErrorBoundary>
      <Outlet />
      <ShellToast />
    </ErrorBoundary>
  )
}
