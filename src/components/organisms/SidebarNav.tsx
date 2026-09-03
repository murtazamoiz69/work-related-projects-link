import { useRouterState } from '@tanstack/react-router'
import { NavItem } from '@/components/molecules/NavItem'
import { isNavPathActive } from '@/lib/utils'
import { useConversationTabsQuery } from '@/features/chat/hooks/useConversations'

type NavLinkItem = { to: string; icon: string; label: string; badge?: string }

// One role, one nav. Every nutritionist can also manage other nutritionists,
// so the Nutritionists row is unconditional rather than role-gated.
const NAV_ITEMS: NavLinkItem[] = [
  { to: '/', icon: 'layout-dashboard', label: 'Dashboard' },
  { to: '/clients', icon: 'users', label: 'Users' },
  { to: '/chat', icon: 'message-square-text', label: 'Chat' },
  { to: '/programs', icon: 'clipboard-list', label: 'Programs' },
  { to: '/nutritionists', icon: 'stethoscope', label: 'Nutritionists' },
]

export function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // The Chat badge counts unread threads for real. It used to be a hardcoded
  // "31", which was already a fiction and became an obvious one once the roster
  // shrank to the ten-user cohort.
  const tabs = useConversationTabsQuery()
  const unread = tabs.data?.find((t) => t.id === 'inbox')?.unread ?? 0

  return (
    <nav className="sidebar-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          badge={
            item.to === '/chat' && unread > 0 ? String(unread) : item.badge
          }
          active={isNavPathActive(pathname, item.to)}
          onClick={onNavigate}
        />
      ))}
    </nav>
  )
}
