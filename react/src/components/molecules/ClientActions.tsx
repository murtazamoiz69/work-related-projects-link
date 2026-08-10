import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import type { Client } from '@/features/clients'
import { CONVERSATIONS } from '@/features/chat'
import { showToast } from '@/lib/toast'

type ClientActionsProps = {
  client: Client
  /** Adds a "Manage Plan" action. Opt-in: the roster is where a plan is worked
   *  on, while the dashboard's tables are about triage. */
  showManagePlan?: boolean
}

/** Message / Call / Email trio used in every client row across the app. */
export function ClientActions({ client, showManagePlan }: ClientActionsProps) {
  const navigate = useNavigate()
  const conversationId = CONVERSATIONS.find(
    (c) => c.client.id === client.id,
  )?.id
  return (
    <div className="ct-actions">
      {showManagePlan ? (
        <button
          className="icon-btn sm"
          title="Manage Plan"
          aria-label={`Manage ${client.name}'s plan`}
          onClick={() =>
            navigate({
              to: '/chat',
              search: { c: conversationId, plan: true },
            })
          }
        >
          <Icon name="clipboard-list" />
        </button>
      ) : null}
      <button
        className="icon-btn sm"
        title="Message"
        aria-label={`Open chat with ${client.name}`}
        onClick={() => navigate({ to: '/chat', search: { c: conversationId } })}
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
      <button
        className="icon-btn sm"
        title="Email"
        aria-label={`Email ${client.name}`}
        onClick={() => showToast(`Emailing ${client.name}…`)}
      >
        <Icon name="mail" />
      </button>
    </div>
  )
}
