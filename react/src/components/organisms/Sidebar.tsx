import { Link, useRouterState } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { useShellStore } from '@/store/useShellStore'
import { useUiStore } from '@/store/useUiStore'

type NavItem = { to: string; icon: string; label: string; badge?: string }

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: 'layout-dashboard', label: 'Dashboard' },
  { to: '/clients', icon: 'users', label: 'Clients' },
  { to: '/chat', icon: 'message-square-text', label: 'Chat', badge: '31' },
  { to: '/programs', icon: 'clipboard-list', label: 'Programs' },
  { to: '/templates', icon: 'layout-template', label: 'Templates' },
]

function isActive(pathname: string, to: string): boolean {
  return to === '/' ? pathname === '/' : pathname.startsWith(to)
}

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const openHelp = useShellStore((s) => s.openHelp)
  const openBroadcast = useShellStore((s) => s.openBroadcast)

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">N</div>
        <div className="brand-text">
          <span className="brand-name">Nourish</span>
          <span className="brand-sub">with Nourish AI</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`nav-item${isActive(pathname, item.to) ? ' active' : ''}`}
            title={item.label}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.badge ? (
              <span className="nav-badge">{item.badge}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link
          to="/settings"
          className={`nav-item${isActive(pathname, '/settings') ? ' active' : ''}`}
          title="Settings"
        >
          <Icon name="settings" />
          <span>Settings</span>
        </Link>
        <button className="nav-item" onClick={openHelp} title="Help & Support">
          <Icon name="life-buoy" />
          <span>Help &amp; Support</span>
        </button>
        <button
          className="nav-item"
          onClick={openBroadcast}
          title="Broadcast Message"
        >
          <Icon name="megaphone" />
          <span>Broadcast Message</span>
        </button>
      </div>

      <button
        className="nav-item sidebar-collapse-btn"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name="chevron-left" />
        <span>{collapsed ? 'Expand' : 'Collapse'}</span>
      </button>
    </aside>
  )
}
