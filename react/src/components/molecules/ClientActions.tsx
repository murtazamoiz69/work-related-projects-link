import { Link, useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import type { Client } from '@/features/clients'
import { showToast } from '@/lib/toast'

type ClientActionsProps = {
  client: Client
  /** The "view profile" icon — dashboard uses file-text, clients uses eye. */
  viewIcon?: string
}

/** Message / Call / View trio used in every client row across the app. */
export function ClientActions({
  client,
  viewIcon = 'file-text',
}: ClientActionsProps) {
  const navigate = useNavigate()
  return (
    <div className="ct-actions">
      <button
        className="icon-btn sm"
        title="Message"
        aria-label={`Open chat with ${client.name}`}
        onClick={() => navigate({ to: '/chat' })}
      >
        <Icon name="message-circle" />
      </button>
      <button
        className="icon-btn sm"
        title="Call"
        aria-label={`Call ${client.name}`}
        onClick={() => showToast(`Calling ${client.name}…`)}
      >
        <Icon name="phone" />
      </button>
      <Link
        className="icon-btn sm"
        to="/clients/$clientId"
        params={{ clientId: client.id }}
        aria-label={`Open ${client.name}'s profile`}
      >
        <Icon name={viewIcon} />
      </Link>
    </div>
  )
}
