import { Icon } from '@/components/atoms/Icon'
import { minutesAgoLabel } from '@/features/shell/data'
import { useNotificationsStore } from '@/store/useNotificationsStore'

export function NotificationsDropdown() {
  const notifications = useNotificationsStore((s) => s.notifications)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)

  return (
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
