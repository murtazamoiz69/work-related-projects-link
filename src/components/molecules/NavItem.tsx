import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Badge } from '@/components/atoms/Badge'
import { Icon } from '@/components/atoms/Icon'

type NavItemBaseProps = {
  icon: string
  label: string
  badge?: string
  active?: boolean
  onClick?: () => void
}

type NavItemProps =
  (NavItemBaseProps & { to: string }) | (NavItemBaseProps & { to?: never })

/** One sidebar row — nav link, Settings, or Help. Reused as-is in both the
 *  76px rail (icon-only) and the 280px panel it expands into on hover
 *  (icon + label); which one it looks like is entirely driven by the
 *  ancestor `.sidebar`'s `is-expanded` state, not by a prop. `onClick` fires
 *  alongside navigation for `to` items too, so selecting a route can also
 *  collapse the rail. */
export function NavItem({
  to,
  onClick,
  icon,
  label,
  badge,
  active,
}: NavItemProps) {
  const className = `nav-item${active ? ' active' : ''}`
  const content: ReactNode = (
    <>
      <span className="nav-item-icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="nav-item-label sidebar-label">{label}</span>
      {badge ? <Badge value={badge} /> : null}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={className} aria-label={label} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={label}
    >
      {content}
    </button>
  )
}
