import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ToggleSwitch } from '@/components/atoms/ToggleSwitch'
import { PLAN_REVIEW_LABEL } from '@/features/programs/diet/dietPlan.types'
import type { Client, ClientAccessState } from '../types'
import {
  adherenceTier,
  daysUntil,
  expiryLabel,
  expiryUrgency,
  formatFullDate,
} from '../utils'

/** Whether a nutritionist has read this user's filtered plan yet. In review is
 *  the state that matters — it's a to-do, so it carries the warm colour and
 *  Reviewed is the quiet one. */
function ReviewChip({ client }: { client: Client }) {
  const reviewed = client.dietReview === 'reviewed'
  return (
    <span
      className={`ct-review-chip${reviewed ? ' is-reviewed' : ''}`}
      title={
        reviewed
          ? `Diet plan signed off${client.dietReviewedAt ? ` on ${formatFullDate(client.dietReviewedAt)}` : ''}`
          : 'Filtered diet plan is waiting to be reviewed in Manage Plan'
      }
    >
      <Icon name={reviewed ? 'check' : 'clock'} />
      {PLAN_REVIEW_LABEL[client.dietReview]}
    </span>
  )
}

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

/** Which nutritionist carries this user. Assigned by the backend when the user
 *  is added, balanced across the team — nothing here picks it. Em dash when no
 *  one could take them, which only happens if every nutritionist is disabled. */
function AssignedCell({ client }: { client: Client }) {
  const assigned = client.assignedNutritionist
  if (!assigned) return <span className="ct-muted">—</span>
  return (
    <div className="ct-assigned">
      <Avatar initials={assigned.initials} color={assigned.color} size="xs" />
      <span className="ct-assigned-name">{assigned.name}</span>
    </div>
  )
}

const ACCESS_LABEL: Record<ClientAccessState, string> = {
  invited: 'Invited',
  active: 'Active',
  disabled: 'Disabled',
}
const ACCESS_PILL: Record<ClientAccessState, string> = {
  invited: 'status-new',
  active: 'status-active',
  disabled: 'status-paused',
}

export function ClientTableRow({
  client,
  onOpenChat,
  onManage,
  onExtend,
  onRequestToggle,
}: {
  client: Client
  onOpenChat: (client: Client) => void
  onManage: (client: Client) => void
  onExtend: (client: Client) => void
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
            <span className="ct-chip-row">
              {/* Which master diet sheet this user follows. Set at onboarding
                  from their BMR and estimated burn; fixed per user. */}
              {client.dietProfile ? (
                <span
                  className="ct-band-chip"
                  title="Meal category — set from onboarding"
                >
                  {client.dietProfile.band} kcal
                </span>
              ) : null}
              <ReviewChip client={client} />
            </span>
          </span>
        </div>
      </td>
      <td>
        <span
          className={`status-pill ${ACCESS_PILL[client.accessState]}`}
          title={
            client.accessState === 'invited'
              ? 'Invitation sent — this user has not signed in yet'
              : undefined
          }
        >
          {ACCESS_LABEL[client.accessState]}
        </span>
      </td>
      <td>
        <AssignedCell client={client} />
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
          {client.phone ? (
            <a
              className="icon-btn sm"
              href={`tel:${client.phone}`}
              title={`Call ${client.phone}`}
              aria-label={`Call ${client.name}`}
            >
              <Icon name="phone" />
            </a>
          ) : (
            <button
              type="button"
              className="icon-btn sm"
              disabled
              title="No phone number on file"
              aria-label={`No phone number for ${client.name}`}
            >
              <Icon name="phone" />
            </button>
          )}
          <a
            className="icon-btn sm"
            href={`mailto:${client.email}`}
            title={`Email ${client.email}`}
            aria-label={`Email ${client.name}`}
          >
            <Icon name="mail" />
          </a>
          {/* The toggle governs access, not onboarding: switching a disabled
              user back on returns them to Invited if they never signed in,
              never straight to Active. */}
          <ToggleSwitch
            checked={client.accessState !== 'disabled'}
            onChange={() => onRequestToggle(client)}
            ariaLabel={`${
              client.accessState === 'disabled' ? 'Enable' : 'Disable'
            } ${client.name}'s access`}
          />
        </div>
      </td>
    </tr>
  )
}
