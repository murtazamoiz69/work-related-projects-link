import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ToggleSwitch } from '@/components/atoms/ToggleSwitch'
import { formatJoinDate } from '@/features/clients'
import type { Nutritionist } from '../types'

export function NutritionistTableRow({
  nutritionist: n,
  onCall,
  onEmail,
  onRequestToggle,
  onEdit,
  onViewMembers,
}: {
  nutritionist: Nutritionist
  onCall: (n: Nutritionist) => void
  onEmail: (n: Nutritionist) => void
  onRequestToggle: (n: Nutritionist) => void
  onEdit: (n: Nutritionist) => void
  onViewMembers: (n: Nutritionist) => void
}) {
  return (
    <tr>
      <td>
        <div className="ct-client">
          <Avatar initials={n.initials} color={n.color} size="sm" />
          <span className="ct-client-id">
            <span className="ct-name">{n.name}</span>
            <span className="ct-sub">{n.email}</span>
          </span>
        </div>
      </td>
      <td>{n.qualification}</td>
      <td>
        {n.experienceYears} {n.experienceYears === 1 ? 'yr' : 'yrs'}
      </td>
      <td>{formatJoinDate(n.joinDate)}</td>
      <td>
        <button
          type="button"
          className="link-btn members-link"
          onClick={() => onViewMembers(n)}
        >
          {n.memberIds.length} members
        </button>
      </td>
      <td>
        <span
          className={`status-pill ${n.accessEnabled ? 'status-active' : 'status-paused'}`}
        >
          {n.accessEnabled ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td>
        <div className="ct-actions">
          <button
            className="icon-btn sm"
            title="Call"
            aria-label={`Call ${n.name}`}
            onClick={() => onCall(n)}
          >
            <Icon name="phone" />
          </button>
          <button
            className="icon-btn sm"
            title="Email"
            aria-label={`Email ${n.name}`}
            onClick={() => onEmail(n)}
          >
            <Icon name="mail" />
          </button>
          <button
            className="icon-btn sm"
            title="Edit"
            aria-label={`Edit ${n.name}`}
            onClick={() => onEdit(n)}
          >
            <Icon name="pencil" />
          </button>
          <ToggleSwitch
            checked={n.accessEnabled}
            onChange={() => onRequestToggle(n)}
            ariaLabel={`${n.accessEnabled ? 'Disable' : 'Enable'} ${n.name}`}
          />
        </div>
      </td>
    </tr>
  )
}
