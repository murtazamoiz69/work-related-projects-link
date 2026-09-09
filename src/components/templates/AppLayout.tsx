import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/organisms/Sidebar'
import { useSyncActiveProfile } from '@/features/shell/hooks/useSyncActiveProfile'
import { hasUnsavedEdits } from '@/store/useUnsavedEdits'

/** The authed app shell: sidebar + main column. Pages render their own Topbar
 *  and `<main className="content">` into the Outlet. */
export function AppLayout() {
  // The browser's own close/reload prompt, for the same unsaved window the
  // in-app guards cover (OP-4). The wording is the browser's, not ours.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedEdits()) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

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
