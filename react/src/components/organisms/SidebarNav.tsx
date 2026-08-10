import { useRouterState } from '@tanstack/react-router'
import { NavItem } from '@/components/molecules/NavItem'
import { isNavPathActive } from '@/lib/utils'

type NavLinkItem = { to: string; icon: string; label: string; badge?: string }

const NAV_ITEMS: NavLinkItem[] = [
  { to: '/', icon: 'layout-dashboard', label: 'Dashboard' },
  { to: '/clients', icon: 'users', label: 'Users' },
  { to: '/chat', icon: 'message-square-text', label: 'Chat', badge: '31' },
  { to: '/programs', icon: 'clipboard-list', label: 'Programs' },
  { to: '/templates', icon: 'layout-template', label: 'Templates' },
  { to: '/broadcast', icon: 'megaphone', label: 'Broadcast Message' },
]

export function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="sidebar-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          badge={item.badge}
          active={isNavPathActive(pathname, item.to)}
          onClick={onNavigate}
        />
      ))}
    </nav>
  )
}
