import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'

type TopbarProps = {
  title?: ReactNode
  subtitle?: ReactNode
  back?: { to: string; label: string; search?: Record<string, string> }
  /** Optional status node shown in the greeting row (e.g. an autosave pill). */
  status?: ReactNode
}

export function Topbar({ title, subtitle, back, status }: TopbarProps) {
  // With no greeting to hold, the bar shouldn't keep reserving the height a
  // two-line title needs — it would just be 44px of nothing above the content.
  const bare = !title && !subtitle && !back && !status

  return (
    <header className={`topbar${bare ? ' topbar-bare' : ''}`}>
      <div className="topbar-greeting">
        {back ? (
          <Link to={back.to} search={back.search} className="back-link">
            <Icon name="arrow-left" />
            {back.label}
          </Link>
        ) : (
          <>
            {/* Both optional: a screen whose own header already names it (Chat)
                passes neither, and an empty <h1> would still hold a line of
                height. */}
            {title ? <h1>{title}</h1> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </>
        )}
        {status}
      </div>
    </header>
  )
}
