import { Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/organisms/Sidebar'
import { useSyncActiveProfile } from '@/features/shell/hooks/useSyncActiveProfile'

/** The authed app shell: sidebar + main column. Pages render their own Topbar
 *  and `<main className="content">` into the Outlet. */
export function AppLayout() {
  // Keep the sidebar profile chip in sync with the real signed-in user (name,
  // avatar) by hydrating it from the server — not the login snapshot.
  useSyncActiveProfile()

  return (
    <div className="app">
      {/* The sidebar itself is position:fixed so it can float open over the
          page on hover without shifting anything — this spacer is the real
          flex item that reserves its collapsed-rail width in the layout. */}
      <div className="sidebar-rail-spacer" aria-hidden="true" />
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
    </div>
  )
}
