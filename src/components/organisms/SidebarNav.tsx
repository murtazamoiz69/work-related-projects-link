import { useRouterState } from '@tanstack/react-router'
import { NavItem } from '@/components/molecules/NavItem'
import { isNavPathActive } from '@/lib/utils'

type NavLinkItem = { to: string; icon: string; label: string; badge?: string }

// One role, one nav. Every nutritionist can also manage other nutritionists,
// so the Nutritionists row is unconditional rather than role-gated.
const NAV_ITEMS: NavLinkItem[] = [
  { to: '/', icon: 'layout-dashboard', label: 'Dashboard' },
  { to: '/clients', icon: 'users', label: 'Users' },
  { to: '/chat', icon: 'message-square-text', label: 'Chat', badge: '31' },
  { to: '/programs', icon: 'clipboard-list', label: 'Programs' },
  { to: '/nutritionists', icon: 'stethoscope', label: 'Nutritionists' },
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
