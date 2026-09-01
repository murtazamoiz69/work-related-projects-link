import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ToggleSwitch } from '@/components/atoms/ToggleSwitch'
import type { Client } from '../types'
import {
  adherenceTier,
  daysUntil,
  expiryLabel,
  expiryUrgency,
  formatFullDate,
} from '../utils'

function ProgressCell({ client }: { client: Client }) {
  if (client.adherence === null)
    return <span className="adherence-empty">—</span>
  const tier = adherenceTier(client.adherence)
  return (
    <div className="adherence-cell">
      <div className="adherence-bar">
        <div
          className={`adherence-fill adherence-${tier}`}
          style={{ width: `${client.adherence}%` }}
        />
      </div>
      <span className="adherence-pct">{client.adherence}%</span>
    </div>
  )
}

function PlanExpiryCell({ client }: { client: Client }) {
  const daysLeft = daysUntil(client.expiryDate)
  const urgency = expiryUrgency(daysLeft)
  const isExpired = urgency === 'expired'
  const isWarning = urgency === 'warning'
  return (
    <div className="expiry-cell">
      <span className="expiry-date">{formatFullDate(client.expiryDate)}</span>
      <span
        className={`expiry-sub${isExpired ? ' is-expired' : isWarning ? ' is-warning' : ''}`}
      >
        {isExpired ? 'Expired' : expiryLabel(daysLeft)}
      </span>
    </div>
  )
}

export function ClientTableRow({
  client,
  onOpenChat,
  onManage,
  onExtend,
  onCall,
  onEmail,
  onRequestToggle,
}: {
  client: Client
  onOpenChat: (client: Client) => void
  onManage: (client: Client) => void
  onExtend: (client: Client) => void
  onCall: (client: Client) => void
  onEmail: (client: Client) => void
  onRequestToggle: (client: Client) => void
}) {
  return (
    <tr>
      <td>
        <div className="ct-client">
          <Avatar initials={client.initials} color={client.color} size="sm" />
          <span className="ct-client-id">
            <span className="ct-name">{client.name}</span>
            <span className="ct-sub">{client.email}</span>
          </span>
        </div>
      </td>
      <td>
        <span
          className={`status-pill ${client.accessEnabled ? 'status-active' : 'status-paused'}`}
        >
          {client.accessEnabled ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td>
        <PlanExpiryCell client={client} />
      </td>
      <td>
        <ProgressCell client={client} />
      </td>
      <td>
        <div className="ct-actions">
          <button
            className="icon-btn sm"
            title="Manage"
            aria-label={`Manage ${client.name}`}
            onClick={() => onManage(client)}
          >
            <Icon name="clipboard-list" />
          </button>
          <button
            className="icon-btn sm"
            title="Extend"
            aria-label={`Extend ${client.name}'s program`}
            onClick={() => onExtend(client)}
          >
            <Icon name="calendar-plus" />
          </button>
          <button
            className="icon-btn sm"
            title="Chat"
            aria-label={`Open chat with ${client.name}`}
            onClick={() => onOpenChat(client)}
          >
            <Icon name="message-circle" />
          </button>
          <button
            className="icon-btn sm"
            title="Call"
            aria-label={`Call ${client.name}`}
            onClick={() => onCall(client)}
          >
            <Icon name="phone" />
          </button>
          <button
            className="icon-btn sm"
            title="Email"
            aria-label={`Email ${client.name}`}
            onClick={() => onEmail(client)}
          >
            <Icon name="mail" />
          </button>
          <ToggleSwitch
            checked={client.accessEnabled}
            onChange={() => onRequestToggle(client)}
            ariaLabel={`${client.accessEnabled ? 'Disable' : 'Enable'} ${client.name}'s access`}
          />
        </div>
      </td>
    </tr>
  )
}
