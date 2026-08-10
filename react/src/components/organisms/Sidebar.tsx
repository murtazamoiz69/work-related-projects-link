import { useState, type FocusEvent } from 'react'
import { SidebarFooter } from './SidebarFooter'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNav } from './SidebarNav'
import { SidebarProfile } from './SidebarProfile'

/** The app's navigation rail. A floating dock that rests as a 76px icon
 *  rail and expands to a 280px labeled panel on hover/focus. Expansion is
 *  JS-driven (mouseenter/mouseleave/focus/blur) rather than plain CSS
 *  `:hover`, so picking a nav item can force the rail closed immediately
 *  even while the pointer is still resting on it — collapsing on selection
 *  can't be expressed in CSS alone. */
export function Sidebar() {
  const [expanded, setExpanded] = useState(false)

  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setExpanded(false)
  }

  return (
    <aside
      className={`sidebar${expanded ? ' is-expanded' : ''}`}
      aria-label="Main navigation"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={handleBlur}
    >
      <SidebarHeader />
      <SidebarNav onNavigate={() => setExpanded(false)} />
      <div className="sidebar-bottom">
        <div className="sidebar-divider sidebar-label" />
        <SidebarProfile />
        <SidebarFooter onNavigate={() => setExpanded(false)} />
      </div>
    </aside>
  )
}
