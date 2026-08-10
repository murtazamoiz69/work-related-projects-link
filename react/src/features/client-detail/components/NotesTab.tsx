import { useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn } from '@/features/clients'
import { summarizeNotes } from '../data'
import type { InternalNote, NoteAttachment } from '../types'

const ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

function authorInitials(author: string): string {
  return author
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function attachmentTypeLabel(file: File): string {
  const ext = file.name.split('.').pop()?.toUpperCase()
  return ext || file.type || 'FILE'
}

/** Internal Notes tab: an AI-style digest of the thread, then the care-team-only
 *  notes themselves with an add-note composer that can attach a text/document/PDF
 *  file. The thread itself is marked no-print so notes never appear in the
 *  exported report. */
export function NotesTab({
  notes,
  onAdd,
}: {
  notes: InternalNote[]
  /** The list is owned by the Plan Workspace, which shares it with the rail's digest. */
  onAdd: (note: InternalNote) => void
}) {
  const [draft, setDraft] = useState('')
  const [draftAttachment, setDraftAttachment] = useState<NoteAttachment | null>(
    null,
  )
  const fileRef = useRef<HTMLInputElement>(null)

  const addNote = () => {
    const text = draft.trim()
    if (!text && !draftAttachment) return
    onAdd({ author: 'Sarah Nolan', text, days: 0, attachment: draftAttachment })
    setDraft('')
    setDraftAttachment(null)
  }

  return (
    <>
      <section className="pw-summary">
        <h3 className="pw-summary-title">
          <Icon name="sparkles" />
          Notes Summary
        </h3>
        <ul className="pw-summary-list">
          {summarizeNotes(notes).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>
      <section className="panel no-print">
        <div className="panel-head">
          <div>
            <h2>
              <Icon name="lock" className="inline-icon" /> Internal Notes
            </h2>
            <p className="panel-sub">
              Visible to your care team only — not shared with the user
            </p>
          </div>
        </div>
        <ul className="notes-list">
          {notes.map((n, i) => (
            <li className="note-item" key={i}>
              <span
                className="avatar avatar-xs"
                style={{
                  background:
                    n.author === 'Sarah Nolan' ? '#2F5D50' : '#55789D',
                }}
              >
                {authorInitials(n.author)}
              </span>
              <div className="note-body">
                <div className="note-meta">
                  <span className="note-author">{n.author}</span>
                  <span className="note-time">{formatCheckIn(n.days)}</span>
                </div>
                {n.text ? <p className="note-text">{n.text}</p> : null}
                {n.attachment ? (
                  <span className="note-attachment-chip">
                    <Icon name="file-text" />
                    {n.attachment.name}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <div className="notes-add-row">
          <div className="notes-input-wrap">
            <textarea
              className="notes-input"
              placeholder="Add a note for other nutritionists covering this user…"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            {draftAttachment ? (
              <span className="note-attachment-chip note-attachment-draft">
                <Icon name="file-text" />
                {draftAttachment.name}
                <button
                  type="button"
                  className="icon-btn sm"
                  title="Remove attachment"
                  onClick={() => setDraftAttachment(null)}
                >
                  <Icon name="x" />
                </button>
              </span>
            ) : null}
          </div>
          <input
            type="file"
            accept={ATTACHMENT_ACCEPT}
            hidden
            ref={fileRef}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                setDraftAttachment({
                  name: file.name,
                  type: attachmentTypeLabel(file),
                })
              }
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="icon-btn sm"
            title="Attach a text, document, or PDF file"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="paperclip" />
          </button>
          <button className="btn-secondary" onClick={addNote}>
            Add Note
          </button>
        </div>
      </section>
    </>
  )
}
