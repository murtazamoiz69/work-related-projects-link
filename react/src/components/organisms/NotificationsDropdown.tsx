import { Icon } from '@/components/atoms/Icon'
import { minutesAgoLabel } from '@/features/shell/data'
import { useNotificationsStore } from '@/store/useNotificationsStore'

export function NotificationsDropdown() {
  const notifications = useNotificationsStore((s) => s.notifications)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)

  return (
    // Container guard: swallows clicks so they don't reach the Topbar's
    // click-outside handler. Not an interactive control itself.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="shell-dropdown notif-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="shell-dropdown-head">
        <span>Notifications</span>
        <button className="link-btn" onClick={markAllRead}>
          Mark all read
        </button>
      </div>
      <ul className="notif-list">
        {notifications.map((n, i) => (
          // Clicking an item marks it read — a pointer convenience. Keyboard
          // users have the "Mark all read" button above, so the <li> stays a
          // list item rather than being forced into an interactive role.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
          <li
            key={i}
            className={`notif-item${n.read ? '' : ' unread'}`}
            onClick={() => markRead(i)}
          >
            <span className={`notif-icon notif-icon-${n.tone}`}>
              <Icon name={n.icon} />
            </span>
            <span className="notif-body">
              <span className="notif-title">{n.title}</span>
              <span className="notif-time">{minutesAgoLabel(n.time)}</span>
            </span>
            {n.read ? null : <span className="notif-dot" />}
          </li>
        ))}
      </ul>
    </div>
  )
}
