import { useNavigate } from '@tanstack/react-router'
import { templateById } from '@/features/templates'
import { audienceLabel, formatScheduledOn } from '../data'
import type { Broadcast } from '../types'
import {
  BroadcastActionsMenu,
  type BroadcastMenuAction,
} from './BroadcastActionsMenu'

const STATUS_LABEL: Record<Broadcast['status'], string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
}

type Props = {
  broadcast: Broadcast
  onAction: (action: BroadcastMenuAction, broadcast: Broadcast) => void
}

export function BroadcastTableRow({ broadcast: b, onAction }: Props) {
  const navigate = useNavigate()
  const template = templateById(b.templateId)

  return (
    <tr
      className="prog-table-row"
      onClick={() =>
        navigate({
          to: '/broadcast/$broadcastId',
          params: { broadcastId: b.id },
        })
      }
    >
      <td>
        <div className="ct-client">
          <span className="ct-client-id">
            <span className="ct-name">{b.title || 'Untitled Broadcast'}</span>
          </span>
        </div>
      </td>
      <td className="ct-text">{template?.title ?? '—'}</td>
      <td className="ct-text">{audienceLabel(b.audienceType)}</td>
      <td className="ct-text">{b.recipientCount} Users</td>
      <td className="ct-text">{formatScheduledOn(b)}</td>
      <td>
        <span className={`broadcast-status-badge status-${b.status}`}>
          {STATUS_LABEL[b.status]}
        </span>
      </td>
      <td className="ct-text">{b.createdBy}</td>
      <td>
        <div className="ct-actions" onClick={(e) => e.stopPropagation()}>
          <BroadcastActionsMenu
            broadcast={b}
            onAction={(a) => onAction(a, b)}
          />
        </div>
      </td>
    </tr>
  )
}
