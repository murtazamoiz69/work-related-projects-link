import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { SWITCH_PROFILES } from '@/features/shell/data'
import { showToast } from '@/lib/toast'
import { useAuthStore } from '@/store/useAuthStore'

type ProfileDropdownProps = { onClose: () => void }

export function ProfileDropdown({ onClose }: ProfileDropdownProps) {
  const navigate = useNavigate()
  const activeProfile = useAuthStore((s) => s.activeProfile)
  const switchProfile = useAuthStore((s) => s.switchProfile)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div
      className="shell-dropdown profile-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="shell-dropdown-head">
        <span>Switch Profile</span>
      </div>
      <ul className="switch-profile-list">
        {SWITCH_PROFILES.map((p) => (
          <li key={p.name}>
            <button
              className={`switch-profile-row${
                p.name === activeProfile.name ? ' is-active' : ''
              }`}
              onClick={() => {
                switchProfile(p)
                showToast(`Switched to ${p.name}`)
              }}
            >
              <Avatar initials={p.initials} color={p.color} size="sm" />
              <span className="switch-profile-body">
                <span className="switch-profile-name">{p.name}</span>
                <span className="switch-profile-role">{p.role}</span>
              </span>
              <Icon name="check" className="switch-profile-check" />
            </button>
          </li>
        ))}
      </ul>
      <div className="shell-dropdown-divider" />
      <button
        className="shell-dropdown-action"
        onClick={() => {
          showToast('Opening your profile…')
          onClose()
        }}
      >
        <Icon name="user" />
        View Profile
      </button>
      <button
        className="shell-dropdown-action"
        onClick={() => {
          onClose()
          navigate({ to: '/settings' })
        }}
      >
        <Icon name="settings" />
        Settings
      </button>
      <button
        className="shell-dropdown-action shell-dropdown-danger"
        onClick={() => {
          logout()
          navigate({ to: '/login' })
        }}
      >
        <Icon name="log-out" />
        Log Out
      </button>
    </div>
  )
}
