import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn } from '@/features/clients'
import type { InternalNote } from '../types'

function authorInitials(author: string): string {
  return author
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Internal Notes tab: care-team-only notes, with an add-note composer.
 *  Marked no-print so notes never appear in the exported report. */
export function NotesTab({ notes }: { notes: InternalNote[] }) {
  const [list, setList] = useState<InternalNote[]>(notes)
  const [draft, setDraft] = useState('')

  const addNote = () => {
    const text = draft.trim()
    if (!text) return
    setList((prev) => [{ author: 'Sarah Nolan', text, days: 0 }, ...prev])
    setDraft('')
  }

  return (
    <section className="panel no-print">
      <div className="panel-head">
        <div>
          <h2>
            <Icon name="lock" className="inline-icon" /> Internal Notes
          </h2>
          <p className="panel-sub">
            Visible to your care team only — not shared with the client
          </p>
        </div>
      </div>
      <ul className="notes-list">
        {list.map((n, i) => (
          <li className="note-item" key={i}>
            <span
              className="avatar avatar-xs"
              style={{
                background: n.author === 'Sarah Nolan' ? '#2F5D50' : '#5B7FA6',
              }}
            >
              {authorInitials(n.author)}
            </span>
            <div className="note-body">
              <div className="note-meta">
                <span className="note-author">{n.author}</span>
                <span className="note-time">{formatCheckIn(n.days)}</span>
              </div>
              <p className="note-text">{n.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="notes-add-row">
        <textarea
          className="notes-input"
          placeholder="Add a note for other nutritionists covering this client…"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn-secondary" onClick={addNote}>
          Add Note
        </button>
      </div>
    </section>
  )
}
