import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { useAuthStore } from '@/store/useAuthStore'

/** The rail's last row: log out. Shaped like a `NavItem` so it reads as part
 *  of the same stack — a circular icon in the 76px rail, icon + label once the
 *  sidebar expands — but it isn't one: it's a destructive action rather than a
 *  route, so it carries its own danger styling instead of an `active` state. */
export function SidebarFooter({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="sidebar-footer">
      <button
        type="button"
        className="nav-item nav-item-danger"
        aria-label="Log out"
        onClick={() => {
          onNavigate()
          logout()
          navigate({ to: '/login' })
        }}
      >
        <span className="nav-item-icon">
          <Icon name="log-out" size={20} />
        </span>
        <span className="nav-item-label sidebar-label">Logout</span>
      </button>
    </div>
  )
}
