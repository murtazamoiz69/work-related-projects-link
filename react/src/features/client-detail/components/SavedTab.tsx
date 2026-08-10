import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { PhotoLightbox } from '@/components/molecules/PhotoLightbox'
import type { Client } from '@/features/clients'
import { CONVERSATIONS, unsaveAttachment } from '@/features/chat'
import type { SavedItem } from '@/features/chat'

type Filter = 'all' | 'image' | 'file'

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Everything' },
  { key: 'image', label: 'Photos' },
  { key: 'file', label: 'Documents' },
]

function relativeDay(d: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const then = new Date(d)
  then.setHours(0, 0, 0, 0)
  const days = Math.round((today.getTime() - then.getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Saved tab: everything the nutritionist pinned out of this user's chat,
 * newest first, so a report or progress photo can be found later without
 * scrolling the whole conversation back. */
export function SavedTab({
  client,
  onChange,
}: {
  client: Client
  /** Lets the page re-render its tab count, which lives outside this panel. */
  onChange?: () => void
}) {
  const convo = CONVERSATIONS.find((c) => c.client.id === client.id)
  const [, force] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [viewing, setViewing] = useState<SavedItem | null>(null)

  const all = convo?.saved ?? []
  const items =
    filter === 'all' ? all : all.filter((s) => s.attachment.type === filter)
  const counts = {
    all: all.length,
    image: all.filter((s) => s.attachment.type === 'image').length,
    file: all.filter((s) => s.attachment.type === 'file').length,
  }

  const remove = (item: SavedItem) => {
    if (!convo) return
    unsaveAttachment(convo, item.attachment, item.sentAt)
    force((n) => n + 1)
    onChange?.()
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Saved Items</h2>
          <p className="panel-sub">
            Photos and documents you pinned from {client.name.split(' ')[0]}
            &apos;s chat
          </p>
        </div>
      </div>

      {all.length ? (
        <div className="saved-filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip-filter${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="chip-count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      ) : null}

      {items.length ? (
        <ul className="saved-grid">
          {items.map((item) => (
            <li className="saved-card" key={item.id}>
              <button
                type="button"
                className="saved-card-thumb"
                onClick={() => setViewing(item)}
                aria-label={`Open ${item.attachment.name}`}
              >
                {item.attachment.dataUrl ? (
                  <img src={item.attachment.dataUrl} alt="" />
                ) : (
                  <Icon name="file-text" />
                )}
                <span className="saved-card-kind">
                  <Icon
                    name={
                      item.attachment.type === 'image' ? 'image' : 'file-text'
                    }
                  />
                  {item.attachment.type === 'image' ? 'Photo' : 'Document'}
                </span>
              </button>
              <div className="saved-card-body">
                <span className="saved-card-name" title={item.attachment.name}>
                  {item.attachment.name}
                </span>
                <span className="saved-card-meta">
                  Sent {relativeDay(item.sentAt)}
                  {item.attachment.size ? ` · ${item.attachment.size}` : ''}
                </span>
                <span className="saved-card-meta">
                  Saved {relativeDay(item.savedAt)} by {item.savedBy}
                </span>
              </div>
              <div className="saved-card-actions">
                <Link
                  to="/chat"
                  search={{ c: client.id }}
                  className="link-btn"
                  title="Open the conversation this came from"
                >
                  Open chat <Icon name="arrow-right" />
                </Link>
                <button
                  type="button"
                  className="link-btn danger-link"
                  onClick={() => remove(item)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="clients-empty saved-empty">
          <Icon name="bookmark" />
          <p>
            {all.length
              ? `No saved ${filter === 'image' ? 'photos' : 'documents'} yet`
              : 'Nothing saved yet'}
          </p>
          <span className="saved-empty-hint">
            Open a photo or report in {client.name.split(' ')[0]}&apos;s chat
            and choose Save to keep it here for reference.
          </span>
          <Link to="/chat" search={{ c: client.id }} className="link-btn">
            Go to chat <Icon name="arrow-right" />
          </Link>
        </div>
      )}

      {viewing?.attachment.dataUrl ? (
        <PhotoLightbox
          photos={[viewing.attachment.dataUrl]}
          index={0}
          caption={viewing.attachment.name}
          onNavigate={() => {}}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </section>
  )
}
