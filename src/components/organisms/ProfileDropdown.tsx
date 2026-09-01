import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { SWITCH_PROFILES } from '@/features/shell/data'
import { showToast } from '@/lib/toast'
import { useAuthStore } from '@/store/useAuthStore'

export function ProfileDropdown({ onSelect }: { onSelect: () => void }) {
  const activeProfile = useAuthStore((s) => s.activeProfile)
  const switchProfile = useAuthStore((s) => s.switchProfile)

  return (
    // Container guard: swallows clicks so they don't reach the Topbar's
    // click-outside handler. Not an interactive control itself.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
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
                onSelect()
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
    </div>
  )
}
