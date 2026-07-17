import { Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/organisms/Sidebar'
import { HelpModal } from '@/components/organisms/HelpModal'
import { BroadcastModal } from '@/components/organisms/BroadcastModal'
import { useShellStore } from '@/store/useShellStore'

/** The authed app shell: sidebar + main column. Pages render their own Topbar
 *  and `<main className="content">` into the Outlet. */
export function AppLayout() {
  const helpOpen = useShellStore((s) => s.helpOpen)
  const broadcastOpen = useShellStore((s) => s.broadcastOpen)

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Outlet />
      </div>
      {helpOpen ? <HelpModal /> : null}
      {broadcastOpen ? <BroadcastModal /> : null}
    </div>
  )
}
