import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { useAuthStore } from '@/store/useAuthStore'
import { clearUnsavedEdits, unsavedEditLabels } from '@/store/useUnsavedEdits'

/** The rail's last row: log out. Shaped like a `NavItem` so it reads as part
 *  of the same stack — a circular icon in the 76px rail, icon + label once the
 *  sidebar expands — but it isn't one: it's a destructive action rather than a
 *  route, so it carries its own danger styling instead of an `active` state.
 *
 *  Confirmed rather than immediate, and the copy hardens when plan edits are
 *  still unsaved, because a mis-click here used to discard them (OP-4). */
export function SidebarFooter({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [confirming, setConfirming] = useState(false)

  const unsaved = confirming ? unsavedEditLabels() : []

  const doLogout = () => {
    clearUnsavedEdits()
    setConfirming(false)
    onNavigate()
    logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="sidebar-footer">
      <button
        type="button"
        className="nav-item nav-item-danger"
        aria-label="Log out"
        onClick={() => setConfirming(true)}
      >
        <span className="nav-item-icon">
          <Icon name="log-out" size={20} />
        </span>
        <span className="nav-item-label sidebar-label">Logout</span>
      </button>

      {confirming ? (
        <ConfirmDialog
          title={unsaved.length ? 'Log out and discard changes?' : 'Log out?'}
          message={
            unsaved.length
              ? `${unsaved.join(' and ')} ${
                  unsaved.length === 1 ? 'has' : 'have'
                } changes that haven't saved yet. Logging out now discards them.`
              : 'You will be signed out and returned to the login screen.'
          }
          confirmText={unsaved.length ? 'Discard and log out' : 'Log out'}
          danger
          onConfirm={doLogout}
          onClose={() => setConfirming(false)}
        />
      ) : null}
    </div>
  )
}
