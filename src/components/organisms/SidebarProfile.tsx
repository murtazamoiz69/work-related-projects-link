import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { useAuthStore } from '@/store/useAuthStore'
import { ProfileDropdown } from './ProfileDropdown'

/** Rail: just the circular avatar. Hovered/expanded: avatar + name + chevron.
 *  Same trigger both times — `.sidebar:hover`/`:focus-within` reshapes it,
 *  this component doesn't track which state it's in. Clicking opens the
 *  profile menu. */
export function SidebarProfile() {
  const activeProfile = useAuthStore((s) => s.activeProfile)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  return (
    <div className="sidebar-dd-wrap" ref={ref}>
      <button
        type="button"
        className="sidebar-profile"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar
          initials={activeProfile.initials}
          color={activeProfile.color}
          photo={activeProfile.photo}
          alt={activeProfile.name}
          size="sm"
        />
        <span className="sidebar-profile-meta sidebar-label">
          <span className="sidebar-profile-name">{activeProfile.name}</span>
        </span>
        <Icon
          name="chevron-down"
          className="sidebar-profile-chevron sidebar-label"
          size={14}
        />
      </button>
      {open ? <ProfileDropdown onSelect={() => setOpen(false)} /> : null}
    </div>
  )
}
