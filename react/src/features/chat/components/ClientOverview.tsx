import { useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn, formatJoinDate } from '@/features/clients'
import { useAddNote } from '../hooks/useConversations'
import { deriveClinicalProfile } from '../plan-workspace'
import { formatTime, isToday, summarizeNotes } from '../data'
import { ActivityLogModal } from './ActivityLogModal'
import type {
  ChatNoteAttachment,
  Conversation,
  ProfileSectionId,
} from '../types'

const NOTE_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

function attachmentTypeLabel(file: File): string {
  const ext = file.name.split('.').pop()?.toUpperCase()
  return ext || file.type || 'FILE'
}

const PROFILE_SECTIONS: {
  id: ProfileSectionId
  label: string
  icon: string
}[] = [
  // One word each: these sit inside a single user's rail, so "User" in "User
  // Activity" only restated the context — and at 109px it was the label that
  // pushed the strip past its rail and into a scrollbar.
  { id: 'notes', label: 'Notes', icon: 'notebook-pen' },
  { id: 'medical', label: 'Medical', icon: 'stethoscope' },
  { id: 'activity', label: 'Activity', icon: 'activity' },
]
const UPLOADS_PREVIEW_MAX = 6

export function ClientOverview({ convo }: { convo: Conversation }) {
  const c = convo.client
  const [section, setSection] = useState<ProfileSectionId>('notes')
  const [noteText, setNoteText] = useState('')
  const [noteAttachment, setNoteAttachment] =
    useState<ChatNoteAttachment | null>(null)
  const noteFileRef = useRef<HTMLInputElement>(null)
  const addNoteMutation = useAddNote()

  const addNote = () => {
    const text = noteText.trim()
    if (!text && !noteAttachment) return
    // The note is prepended + a toast shown by the mutation's onSuccess.
    addNoteMutation.mutate({
      id: convo.id,
      body: { text, attachment: noteAttachment },
    })
    setNoteText('')
    setNoteAttachment(null)
  }

  return (
    <aside className="chat-right-col">
      <div className="chat-right-scroll" id="chatRightCol">
        <div className="profile-unified-card">
          {/* Summary first: the identity block moved to the thread header, and
              the weekly-progress row came out, so the rail opens on the one
              thing it uniquely offers. Tabs and their bodies follow. */}
          <div className="profile-summary-block">
            <span className="detail-chip-label">Nourish AI Insights</span>
            <div className="profile-chat-summary">
              <ul>
                {convo.chatSummary.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="profile-section-tabs" role="tablist">
            {PROFILE_SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`profile-section-tab${s.id === section ? ' active' : ''}`}
                role="tab"
                aria-selected={s.id === section}
                onClick={() => setSection(s.id)}
              >
                <Icon name={s.icon} />
                {s.label}
              </button>
            ))}
          </div>

          <div className="profile-section-body">
            {section === 'notes' ? (
              <NotesSection convo={convo} />
            ) : section === 'medical' ? (
              <MedicalSection convo={convo} />
            ) : (
              <ActivitySection convo={convo} />
            )}
          </div>

          {section === 'notes' ? (
            <div className="notes-add-row profile-notes-composer">
              {/* Attach and Add live inside the field rather than beside it, so
                  the composer reads as one control. The border and focus ring
                  move to the wrapper; the textarea itself goes borderless. */}
              <div className="notes-field">
                <textarea
                  className="notes-input"
                  rows={2}
                  placeholder={`Add a note about ${c.name.split(' ')[0]}…`}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                {noteAttachment ? (
                  <span className="note-attachment-chip note-attachment-draft">
                    <Icon name="file-text" />
                    {noteAttachment.name}
                    <button
                      type="button"
                      className="icon-btn sm"
                      title="Remove attachment"
                      onClick={() => setNoteAttachment(null)}
                    >
                      <Icon name="x" />
                    </button>
                  </span>
                ) : null}
                <input
                  type="file"
                  accept={NOTE_ATTACHMENT_ACCEPT}
                  hidden
                  ref={noteFileRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setNoteAttachment({
                        name: file.name,
                        type: attachmentTypeLabel(file),
                      })
                    }
                    e.target.value = ''
                  }}
                />
                <div className="notes-field-actions">
                  <button
                    type="button"
                    className="icon-btn sm"
                    title="Attach a text, document, or PDF file"
                    onClick={() => noteFileRef.current?.click()}
                  >
                    <Icon name="paperclip" />
                  </button>
                  <button className="btn-secondary" onClick={addNote}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

function NotesSection({ convo }: { convo: Conversation }) {
  return (
    <>
      <div className="profile-unified-section no-rule">
        <span className="detail-chip-label">Notes Summary</span>
        <div className="profile-boxed-summary">
          <ul>
            {summarizeNotes(convo.notes).map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="profile-unified-section" id="profileNotesSection">
        <span className="detail-chip-label">Notes</span>
        {convo.notes.length ? (
          <ul className="notes-list">
            {convo.notes.map((n, i) => (
              <li className="note-item" key={i}>
                <span
                  className="avatar avatar-xs"
                  style={{
                    background:
                      n.author === 'Sarah Nolan' ? '#2F5D50' : '#55789D',
                  }}
                >
                  {n.author
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
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
        ) : null}
      </div>
    </>
  )
}

function MedicalChipRow({
  arr,
  emptyText,
}: {
  arr: string[]
  emptyText: string
}) {
  if (!arr || !arr.length)
    return <span className="chat-mini-card-text">{emptyText}</span>
  return (
    <div className="detail-chip-row">
      {arr.map((a, i) => (
        <span className="client-tag client-tag-risk" key={i}>
          {a}
        </span>
      ))}
    </div>
  )
}

function MedicalSection({ convo }: { convo: Conversation }) {
  const p = deriveClinicalProfile(convo.client)
  return (
    <>
      <div className="profile-unified-section no-rule">
        <span className="detail-chip-label">Medical Information</span>
        <div className="medical-info-block">
          <span className="detail-chip-sublabel">Allergies</span>
          <MedicalChipRow arr={p.allergies} emptyText="No known allergies" />
          <span className="detail-chip-sublabel">Food Intolerances</span>
          <MedicalChipRow arr={p.foodIntolerances} emptyText="None reported" />
          <span className="detail-chip-sublabel">Medical Conditions</span>
          <MedicalChipRow arr={p.medicalConditions} emptyText="None reported" />
          <span className="detail-chip-sublabel">Injuries</span>
          <MedicalChipRow arr={p.injuries} emptyText="None reported" />
          {p.pregnancy ? (
            <>
              <span className="detail-chip-sublabel">
                Pregnancy / Breastfeeding
              </span>
              <MedicalChipRow arr={[p.pregnancy]} emptyText="" />
            </>
          ) : null}
        </div>
      </div>
      <div className="profile-unified-section">
        <span className="detail-chip-label">Flags</span>
        {convo.flags.length ? (
          <ul className="checklist">
            {convo.flags.map((f, i) => (
              <li className="checklist-item pending" key={i}>
                <Icon name="flag" />
                <div>
                  <span className="checklist-name">{f}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="checklist-rest">
            <Icon name="check-circle-2" />
            <span>No flags on this user</span>
          </div>
        )}
      </div>
    </>
  )
}

function ActivitySection({ convo }: { convo: Conversation }) {
  const shown = convo.uploads.slice(0, UPLOADS_PREVIEW_MAX)
  const todayActivity = convo.activity.filter((a) => isToday(a.time))
  const [logOpen, setLogOpen] = useState(false)
  return (
    <>
      <div className="profile-unified-section no-rule">
        <div className="activity-section-head">
          <span className="detail-chip-label">Recent Activity</span>
          <button
            type="button"
            className="link-btn"
            onClick={() => setLogOpen(true)}
          >
            View all activity <Icon name="arrow-right" />
          </button>
        </div>
        {todayActivity.length ? (
          <ul className="activity-list">
            {todayActivity.map((a, i) => (
              <li className="activity-row" key={i}>
                <span className="activity-time">{formatTime(a.time)}</span>
                <span className="activity-icon">
                  <Icon name={a.icon} />
                </span>
                <div className="activity-body">
                  <span className="activity-title">{a.title}</span>
                  {a.detail ? (
                    <span className="activity-detail-text">{a.detail}</span>
                  ) : null}
                </div>
                {a.delta ? (
                  <span className={`activity-delta ${a.delta.direction}`}>
                    {a.delta.text}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="checklist-rest">
            <Icon name="activity" />
            <span>No activity logged today</span>
          </div>
        )}
      </div>
      <div className="profile-unified-section">
        <span className="detail-chip-label">Uploads</span>
        {shown.length ? (
          <div className="upload-gallery">
            {shown.map((u, i) => (
              <div className="upload-item" key={i}>
                <div className="upload-thumb">
                  <Icon name="image" />
                </div>
                <span className="upload-date">{formatJoinDate(u.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="checklist-rest">
            <Icon name="image-off" />
            <span>No uploads yet</span>
          </div>
        )}
      </div>
      {logOpen ? (
        <ActivityLogModal
          clientName={convo.client.name.split(' ')[0]}
          items={convo.activity}
          onClose={() => setLogOpen(false)}
        />
      ) : null}
    </>
  )
}
