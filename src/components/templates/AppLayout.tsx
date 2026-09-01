import { Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/organisms/Sidebar'
import { HelpModal } from '@/components/organisms/HelpModal'
import { useShellStore } from '@/store/useShellStore'

/** The authed app shell: sidebar + main column. Pages render their own Topbar
 *  and `<main className="content">` into the Outlet. */
export function AppLayout() {
  const helpOpen = useShellStore((s) => s.helpOpen)

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
      {helpOpen ? <HelpModal /> : null}
    </div>
  )
}
