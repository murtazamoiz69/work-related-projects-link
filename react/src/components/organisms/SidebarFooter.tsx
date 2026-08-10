import { useRouterState } from '@tanstack/react-router'
import { NavItem } from '@/components/molecules/NavItem'
import { useShellStore } from '@/store/useShellStore'
import { isNavPathActive } from '@/lib/utils'

export function SidebarFooter({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const openHelp = useShellStore((s) => s.openHelp)

  return (
    <div className="sidebar-footer">
      <NavItem
        to="/settings"
        icon="settings"
        label="Settings"
        active={isNavPathActive(pathname, '/settings')}
        onClick={onNavigate}
      />
      <NavItem
        icon="life-buoy"
        label="Help & Support"
        onClick={() => {
          openHelp()
          onNavigate()
        }}
      />
    </div>
  )
}
