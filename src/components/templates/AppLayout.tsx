import { Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/organisms/Sidebar'
import { RouteFallback } from '@/components/molecules/RouteFallback'
import { RouteErrorFallback } from '@/components/molecules/RouteErrorFallback'
import { useLibrariesQuery } from '@/features/programs'
import { useSyncActiveProfile } from '@/features/shell/hooks/useSyncActiveProfile'

/** The authed app shell: sidebar + main column. Pages render their own Topbar
 *  and `<main className="content">` into the Outlet. */
export function AppLayout() {
  // Keep the sidebar profile chip in sync with the real signed-in user (name,
  // avatar) by hydrating it from the server — not the login snapshot.
  useSyncActiveProfile()

  // Load the reference libraries (exercises/meals/workout templates) once and
  // prime the cache before any page that resolves exercise/meal ids renders.
  // The shell stays visible; only the content area waits.
  const libraries = useLibrariesQuery()

  return (
    <div className="app">
      {/* The sidebar itself is position:fixed so it can float open over the
          page on hover without shifting anything — this spacer is the real
          flex item that reserves its collapsed-rail width in the layout. */}
      <div className="sidebar-rail-spacer" aria-hidden="true" />
      <Sidebar />
      <div className="main">
        {libraries.isError ? (
          <RouteErrorFallback />
        ) : libraries.isPending ? (
          <RouteFallback />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}
