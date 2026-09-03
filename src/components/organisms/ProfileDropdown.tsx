import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'

/** The menu behind the sidebar's profile chip. Profile Settings is its only
 *  entry — logging out lives on its own control in the sidebar footer, and
 *  there is no second account to switch to (one role, one session). */
export function ProfileDropdown({ onSelect }: { onSelect: () => void }) {
  return (
    // Container guard: swallows clicks so they don't reach the outside-click
    // handler that closes this menu. Not an interactive control itself.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="shell-dropdown profile-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      <Link to="/settings" className="profile-dropdown-item" onClick={onSelect}>
        <Icon name="user-round" />
        Profile Settings
      </Link>
    </div>
  )
}
