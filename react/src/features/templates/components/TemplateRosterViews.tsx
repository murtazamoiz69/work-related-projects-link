import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn, formatJoinDate } from '@/features/clients'
import { stripHtmlToText } from '../data'
import type { Template } from '../types'
import { FixedMenu } from './FixedMenu'

export type TemplateAction =
  | 'view'
  | 'edit'
  | 'duplicate'
  | 'delete'
  | 'favorite'
  | 'toggle-status'
  | 'restore'
  | 'delete-forever'

function authorInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function daysAgoNum(date: Date): number {
  return Math.round((Date.now() - date.getTime()) / (24 * 3600 * 1000))
}

function statusLabel(t: Template): string {
  return t.trashed ? 'Trashed' : t.status[0].toUpperCase() + t.status.slice(1)
}

type ViewProps = {
  template: Template
  onAction: (action: TemplateAction, template: Template) => void
}

// Rendered through FixedMenu (portalled) rather than an inline absolutely-
// positioned box, since the card's cover uses overflow:hidden and would clip it.
function MenuItems({ template: t, onAction }: ViewProps) {
  return (
    <FixedMenu>
      {(close) =>
        t.trashed ? (
          <>
            <button
              onClick={() => {
                close()
                onAction('restore', t)
              }}
            >
              Restore
            </button>
            <button
              className="danger"
              onClick={() => {
                close()
                onAction('delete-forever', t)
              }}
            >
              Delete Permanently
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                close()
                onAction('edit', t)
              }}
            >
              Edit
            </button>
            <button
              onClick={() => {
                close()
                onAction('duplicate', t)
              }}
            >
              Duplicate
            </button>
            <button
              onClick={() => {
                close()
                onAction('favorite', t)
              }}
            >
              {t.favorite ? 'Remove Favorite' : 'Add to Favorites'}
            </button>
            <button
              onClick={() => {
                close()
                onAction('toggle-status', t)
              }}
            >
              {t.status === 'archived' ? 'Restore to Active' : 'Archive'}
            </button>
            <button
              className="danger"
              onClick={() => {
                close()
                onAction('delete', t)
              }}
            >
              Delete
            </button>
          </>
        )
      }
    </FixedMenu>
  )
}

export function TemplateCard({ template: t, onAction }: ViewProps) {
  const preview =
    t.templateType === 'poll'
      ? t.poll.question.trim() || 'No poll question added yet'
      : stripHtmlToText(t.content).slice(0, 92)
  return (
    <article
      className="prog-card prog-card-plain tpl-card"
      onClick={() => onAction('view', t)}
    >
      <div className="prog-card-head">
        <span
          className={`prog-status-badge status-${t.trashed ? 'archived' : t.status}`}
          style={{ position: 'static' }}
        >
          {statusLabel(t)}
        </span>
        <div
          className="tpl-card-head-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={`icon-btn sm tpl-fav-btn${t.favorite ? ' is-fav' : ''}`}
            title={t.favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => onAction('favorite', t)}
          >
            <Icon name="star" />
          </button>
          <MenuItems template={t} onAction={onAction} />
        </div>
      </div>
      <div className="prog-card-body">
        <h3 className="prog-card-title">{t.title}</h3>
        <p className="prog-card-desc">{preview}</p>
        <div className="prog-card-meta-row">
          <span className="prog-meta-chip">{t.category}</span>
        </div>
        <div className="prog-card-coach">
          <Avatar
            initials={authorInitials(t.createdBy)}
            color="#55789D"
            size="xs"
          />
          <span>{t.createdBy}</span>
        </div>
        <div className="prog-card-stats">
          <div className="prog-stat">
            <span className="prog-stat-value">{t.usage.timesUsed}</span>
            <span className="prog-stat-label">Times Used</span>
          </div>
          <div className="prog-stat">
            <span className="prog-stat-value">{t.usage.favoriteCount}</span>
            <span className="prog-stat-label">Favorited</span>
          </div>
          <div className="prog-stat">
            <span className="prog-stat-value">
              {t.usage.lastUsed
                ? formatCheckIn(daysAgoNum(t.usage.lastUsed))
                : '—'}
            </span>
            <span className="prog-stat-label">Last Used</span>
          </div>
        </div>
        <div className="prog-card-foot">
          <span className="prog-card-updated">
            Created {formatJoinDate(t.createdDate)} · Updated{' '}
            {formatCheckIn(daysAgoNum(t.updatedDate))}
          </span>
        </div>
      </div>
    </article>
  )
}

export function TemplateListRow({ template: t, onAction }: ViewProps) {
  return (
    <tr onClick={() => onAction('view', t)} style={{ cursor: 'pointer' }}>
      <td>
        <div className="ct-client">
          <span className="ct-client-id">
            <span className="ct-name">
              {t.title}
              {t.favorite ? (
                <>
                  {' '}
                  <Icon name="star" className="tpl-fav-star" />
                </>
              ) : null}
            </span>
            <span className="ct-sub">{t.category}</span>
          </span>
        </div>
      </td>
      <td className="ct-text">{t.createdBy}</td>
      <td>{formatJoinDate(t.createdDate)}</td>
      <td>{formatCheckIn(daysAgoNum(t.updatedDate))}</td>
      <td>{t.usage.timesUsed}</td>
      <td>
        <span
          className={`prog-status-badge status-${t.trashed ? 'archived' : t.status}`}
          style={{ position: 'static' }}
        >
          {statusLabel(t)}
        </span>
      </td>
      <td>
        <div className="ct-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="icon-btn sm"
            title="View"
            onClick={() => onAction('view', t)}
          >
            <Icon name="eye" />
          </button>
          <button
            className="icon-btn sm"
            title="Edit"
            onClick={() => onAction('edit', t)}
          >
            <Icon name="pencil" />
          </button>
          <button
            className="icon-btn sm"
            title="Duplicate"
            onClick={() => onAction('duplicate', t)}
          >
            <Icon name="copy" />
          </button>
          <button
            className="icon-btn sm danger"
            title="Delete"
            onClick={() => onAction('delete', t)}
          >
            <Icon name="trash-2" />
          </button>
        </div>
      </td>
    </tr>
  )
}
