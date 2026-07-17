import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import { NotificationsDropdown } from './NotificationsDropdown'
import { ProfileDropdown } from './ProfileDropdown'

type TopbarProps = {
  title?: ReactNode
  subtitle?: ReactNode
  back?: { to: string; label: string }
  /** Optional status node shown in the greeting row (e.g. an autosave pill). */
  status?: ReactNode
}

export function Topbar({ title, subtitle, back, status }: TopbarProps) {
  const [open, setOpen] = useState<'notif' | 'profile' | null>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const activeProfile = useAuthStore((s) => s.activeProfile)
  const hasUnread = useNotificationsStore((s) =>
    s.notifications.some((n) => !n.read),
  )

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!actionsRef.current?.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  return (
    <header className="topbar">
      <div className="topbar-greeting">
        {back ? (
          <Link to={back.to} className="back-link">
            <Icon name="arrow-left" />
            {back.label}
          </Link>
        ) : (
          <>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </>
        )}
        {status}
      </div>

      <div className="topbar-actions" ref={actionsRef}>
        <div className="topbar-dd-wrap">
          <button
            className="icon-btn"
            aria-label="Notifications"
            onClick={() => setOpen((o) => (o === 'notif' ? null : 'notif'))}
          >
            <Icon name="bell" />
            {hasUnread ? <span className="dot" /> : null}
          </button>
          {open === 'notif' ? <NotificationsDropdown /> : null}
        </div>

        <Link className="icon-btn" to="/chat" aria-label="Chat">
          <Icon name="mail" />
          <span className="dot" />
        </Link>

        <div className="divider-v" />

        <div className="topbar-dd-wrap">
          <button
            className="profile-chip"
            onClick={() => setOpen((o) => (o === 'profile' ? null : 'profile'))}
          >
            <Avatar
              initials={activeProfile.initials}
              color={activeProfile.color}
              size="sm"
            />
            <span className="profile-meta">
              <span className="profile-name">{activeProfile.name}</span>
              <span className="profile-role">{activeProfile.role}</span>
            </span>
            <Icon name="chevron-down" />
          </button>
          {open === 'profile' ? (
            <ProfileDropdown onClose={() => setOpen(null)} />
          ) : null}
        </div>
      </div>
    </header>
  )
}
