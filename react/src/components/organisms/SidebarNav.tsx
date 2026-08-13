import { useRouterState } from '@tanstack/react-router'
import { NavItem } from '@/components/molecules/NavItem'
import { isNavPathActive } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

type NavLinkItem = { to: string; icon: string; label: string; badge?: string }

const NAV_ITEMS: NavLinkItem[] = [
  { to: '/', icon: 'layout-dashboard', label: 'Dashboard' },
  { to: '/clients', icon: 'users', label: 'Users' },
  { to: '/chat', icon: 'message-square-text', label: 'Chat', badge: '31' },
  { to: '/programs', icon: 'clipboard-list', label: 'Programs' },
]

// Super Admin sees everything a Nutritionist sees, plus this one extra row —
// same NavItem, same styling, just appended when the role calls for it.
const SUPER_ADMIN_NAV_ITEM: NavLinkItem = {
  to: '/nutritionists',
  icon: 'stethoscope',
  label: 'Nutritionists',
}

export function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isSuperAdmin =
    useAuthStore((s) => s.activeProfile.role) === 'Super Admin'
  const navItems = isSuperAdmin
    ? [...NAV_ITEMS, SUPER_ADMIN_NAV_ITEM]
    : NAV_ITEMS

  return (
    <nav className="sidebar-nav" aria-label="Main navigation">
      {navItems.map((item) => (
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
