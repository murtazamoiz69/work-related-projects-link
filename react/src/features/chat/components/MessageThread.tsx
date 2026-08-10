import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Avatar } from '@/components/atoms/Avatar'
import { PhotoLightbox } from '@/components/molecules/PhotoLightbox'
import { showToast } from '@/lib/toast'
import { TemplatePickerModal, stripHtmlToText } from '@/features/templates'
import type { Template } from '@/features/templates'
import {
  CLIENT_FOLLOWUPS,
  COACH_REPLIES,
  EMOJI_PICKER_POOL,
  formatDateSep,
  formatTime,
  randomSuggestions,
} from '../data'
import { isSaved, toggleSaved } from '../saved'
import type { ChatAttachment, ChatMessage, Conversation } from '../types'

function randOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function Attachment({
  att,
  removable,
  onRemove,
  onOpen,
  saved,
  onToggleSave,
}: {
  att: ChatAttachment
  removable?: boolean
  onRemove?: () => void
  /** Opens the full-size viewer. Absent for the composer's pending draft. */
  onOpen?: () => void
  /** Absent when the attachment cannot be pinned (the coach's own draft). */
  saved?: boolean
  onToggleSave?: () => void
}) {
  const saveBadge = onToggleSave ? (
    <button
      type="button"
      className={`chat-attachment-save${saved ? ' is-saved' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onToggleSave()
      }}
      aria-pressed={saved}
      title={saved ? 'Remove from saved' : 'Save for later'}
    >
      <Icon name={saved ? 'bookmark-check' : 'bookmark'} />
    </button>
  ) : null
  const removeBtn = removable ? (
    <button
      className="icon-btn sm chat-attachment-remove"
      title="Remove"
      onClick={onRemove}
    >
      <Icon name="x" />
    </button>
  ) : null

  // Documents get a compact, WhatsApp-style horizontal chip — a filled
  // icon tile plus name/size — instead of a fake page preview.
  if (att.type === 'file') {
    const ext = (att.name.match(/\.([a-z0-9]+)$/i)?.[1] ?? 'file').toUpperCase()
    return (
      <div className="chat-attachment chat-attachment-doc">
        <span className="chat-attachment-doc-tile">
          <Icon name="file-text" />
          <span className="chat-attachment-doc-ext">{ext}</span>
        </span>
        <span className="chat-attachment-doc-info">
          <span className="chat-attachment-name">{att.name}</span>
          {att.size ? (
            <span className="chat-attachment-size">{att.size}</span>
          ) : null}
        </span>
        {saveBadge}
        {removeBtn}
      </div>
    )
  }

  if (att.dataUrl) {
    return (
      <div className="chat-attachment chat-attachment-photo">
        <button
          type="button"
          className="chat-attachment-open"
          onClick={onOpen}
          disabled={!onOpen}
          aria-label={`Open ${att.name}`}
        >
          <img src={att.dataUrl} alt={att.name} />
        </button>
        {saveBadge}
        {removeBtn}
      </div>
    )
  }
  return (
    <div className="chat-attachment">
      <span className="chat-attachment-icon">
        <Icon name="image" />
      </span>
      <span className="chat-attachment-name">{att.name}</span>
      {saveBadge}
      {removeBtn}
    </div>
  )
}

function Bubble({
  m,
  convo,
  onOpenAttachment,
  onToggleSave,
}: {
  m: ChatMessage
  convo: Conversation
  onOpenAttachment: (att: ChatAttachment) => void
  onToggleSave: (att: ChatAttachment, sentAt: Date) => void
}) {
  if (m.from === 'system') {
    return (
      <div className="chat-system-msg">
        <span>{m.text}</span>
      </div>
    )
  }
  if (m.from === 'broadcast') {
    return (
      <div className="chat-bubble-row from-coach">
        <div className="chat-bubble broadcast-bubble">
          <span className="broadcast-bubble-label">
            <Icon name="megaphone" />
            Broadcast
          </span>
          {m.text ? <p>{m.text}</p> : null}
          <span className="chat-bubble-time">{formatTime(m.time)}</span>
        </div>
      </div>
    )
  }
  const isCoach = m.from === 'coach'
  const isAI = m.from === 'ai'
  const rowSide = isCoach || isAI ? 'from-coach' : 'from-client'
  return (
    <div className={`chat-bubble-row ${rowSide}`}>
      <div className={`chat-bubble${isAI ? ' ai-bubble' : ''}`}>
        {isAI ? (
          <span className="ai-bubble-label">
            <Icon name="bot" />
            Nourish AI
          </span>
        ) : null}
        {m.attachment ? (
          <Attachment
            att={m.attachment}
            onOpen={
              m.attachment.dataUrl
                ? () => onOpenAttachment(m.attachment as ChatAttachment)
                : undefined
            }
            // Only what the user sent is worth pinning; the coach's own
            // outgoing files are already theirs.
            saved={
              m.from === 'client'
                ? isSaved(convo, m.attachment, m.time)
                : undefined
            }
            onToggleSave={
              m.from === 'client'
                ? () => onToggleSave(m.attachment as ChatAttachment, m.time)
                : undefined
            }
          />
        ) : null}
        {m.text ? <p>{m.text}</p> : null}
        <span className="chat-bubble-time">
          {formatTime(m.time)}
          {isCoach ? (
            <>
              {' '}
              <Icon name="check-check" />
            </>
          ) : null}
        </span>
      </div>
    </div>
  )
}

function Thread({
  messages,
  typing,
  convo,
  refresh,
}: {
  messages: ChatMessage[]
  typing: 'client' | 'ai' | null
  convo: Conversation
  refresh: () => void
}) {
  const [viewing, setViewing] = useState<ChatAttachment | null>(null)

  const toggleSave = (att: ChatAttachment, sentAt: Date) => {
    const result = toggleSaved(convo, att, sentAt)
    refresh()
    showToast(
      result === 'saved'
        ? `Saved ${att.name} to ${convo.client.name.split(' ')[0]}'s file`
        : `Removed ${att.name} from saved`,
    )
  }

  const nodes: React.ReactNode[] = []
  let lastDateKey: string | null = null
  messages.forEach((m, i) => {
    const dateKey = m.time.toDateString()
    if (dateKey !== lastDateKey) {
      nodes.push(
        <div className="chat-date-sep" key={`sep-${i}`}>
          <span>{formatDateSep(m.time)}</span>
        </div>,
      )
      lastDateKey = dateKey
    }
    nodes.push(
      <Bubble
        m={m}
        convo={convo}
        onOpenAttachment={setViewing}
        onToggleSave={toggleSave}
        key={`msg-${i}`}
      />,
    )
  })
  return (
    <div className="chat-thread" id="chatThread">
      {nodes}
      {viewing?.dataUrl ? (
        <PhotoLightbox
          photos={[viewing.dataUrl]}
          index={0}
          caption={viewing.name}
          onNavigate={() => {}}
          onClose={() => setViewing(null)}
        />
      ) : null}
      {typing ? (
        <div className="chat-typing" id="chatTypingIndicator">
          {typing === 'ai' ? (
            <span className="avatar avatar-xs ai-avatar">
              <Icon name="bot" />
            </span>
          ) : (
            <Avatar
              initials={convo.client.initials}
              color={convo.client.color}
              size="xs"
            />
          )}
          <div className="typing-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function MessageThread({
  convo,
  refresh,
  onManagePlan,
  onViewProgram,
}: {
  convo: Conversation
  refresh: () => void
  onManagePlan: () => void
  onViewProgram: () => void
}) {
  const c = convo.client
  const firstName = c.name.split(' ')[0]

  const [input, setInput] = useState('')
  const [pendingAttachment, setPendingAttachment] =
    useState<ChatAttachment | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    randomSuggestions(3),
  )
  const [typing, setTyping] = useState<'client' | 'ai' | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const fileRef = useRef<HTMLInputElement | null>(null)

  const scrollToBottom = () => {
    const area = scrollRef.current
    if (area) area.scrollTop = area.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
  }, [convo.messages.length, typing])

  const autoGrow = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  // Clear all pending timers on unmount / conversation change.
  useEffect(() => {
    const list = timers.current
    return () => {
      list.forEach((t) => clearTimeout(t))
    }
  }, [])

  // A conversation Nourish AI is still handling keeps moving while the
  // nutritionist watches — one live exchange per view.
  useEffect(() => {
    if (
      convo.handledBy !== 'ai' ||
      convo.status !== 'active' ||
      convo.liveSimulated
    )
      return
    convo.liveSimulated = true
    const t1 = setTimeout(
      () => {
        convo.messages.push({
          from: 'client',
          text: randOf(CLIENT_FOLLOWUPS),
          time: new Date(),
          attachment: null,
        })
        refresh()
        setTyping('ai')
        const t2 = setTimeout(
          () => {
            setTyping(null)
            convo.messages.push({
              from: 'ai',
              text: randOf(COACH_REPLIES),
              time: new Date(),
              attachment: null,
            })
            refresh()
          },
          1300 + Math.random() * 1100,
        )
        timers.current.push(t2)
      },
      2600 + Math.random() * 2600,
    )
    timers.current.push(t1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const simulateClientReply = () => {
    setTyping('client')
    const delay = 1100 + Math.random() * 1300
    const t = setTimeout(() => {
      setTyping(null)
      convo.messages.push({
        from: 'client',
        text: randOf(CLIENT_FOLLOWUPS),
        time: new Date(),
        attachment: null,
      })
      refresh()
    }, delay)
    timers.current.push(t)
  }

  const sendMessage = () => {
    const text = input.trim()
    if ((!text && !pendingAttachment) || convo.handledBy !== 'nutritionist')
      return
    convo.messages.push({
      from: 'coach',
      text,
      time: new Date(),
      attachment: pendingAttachment,
    })
    setInput('')
    setPendingAttachment(null)
    convo.unread = 0
    refresh()
    if (inputRef.current) inputRef.current.style.height = 'auto'
    simulateClientReply()
  }

  const takeOver = () => {
    convo.handledBy = 'nutritionist'
    convo.messages.push({
      from: 'system',
      text: 'Sarah Nolan took over this conversation',
      time: new Date(),
      attachment: null,
    })
    showToast(`You're now chatting live with ${c.name}`)
    refresh()
  }
  const handBack = () => {
    convo.handledBy = 'ai'
    convo.messages.push({
      from: 'system',
      text: 'Handed the conversation back to Nourish AI',
      time: new Date(),
      attachment: null,
    })
    showToast(`Nourish AI is handling ${c.name} again`)
    refresh()
  }

  const insertTemplate = (template: Template) => {
    const plain = stripHtmlToText(template.content)
    setInput(`${template.title}\n\n${plain}`)
    if (template.cover.type === 'image') {
      setPendingAttachment({
        type: 'image',
        name: `${template.title} — cover image`,
      })
    }
    window.requestAnimationFrame(() => {
      autoGrow()
      inputRef.current?.focus()
    })
  }

  const onFile = (file: File) => {
    const isImage = /^image\//.test(file.type)
    const att: ChatAttachment = {
      type: isImage ? 'image' : 'file',
      name: file.name,
    }
    setPendingAttachment(att)
    if (isImage) {
      const reader = new FileReader()
      reader.onload = () => {
        setPendingAttachment((cur) =>
          cur && cur.name === file.name
            ? { ...cur, dataUrl: String(reader.result) }
            : cur,
        )
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <section className="chat-center-col" id="chatCenterCol">
      <div className="chat-header">
        {/* The thread header is now the only place the client is identified —
            the right rail used to repeat the same avatar, name and meta line
            directly opposite it. */}
        <div className="chat-header-meta">
          <Avatar initials={c.initials} color={c.color} />
          <div className="chat-header-id">
            <span className="chat-header-name">{c.name}</span>
            <span className="chat-header-sub">
              <span className="chat-header-sub-text">
                {c.age} · {c.gender} · {c.program}
              </span>
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className="btn-secondary sm"
            onClick={onManagePlan}
            title="Open the plan workspace"
          >
            <span className="chat-header-action-icon is-solid">
              <Icon name="clipboard-list" size={15} />
            </span>
            Manage Plan
          </button>
          <button
            className="btn-secondary sm"
            onClick={onViewProgram}
            title={`Open ${firstName}'s progress at a glance`}
          >
            <span className="chat-header-action-icon is-soft">
              <Icon name="activity" size={15} />
            </span>
            At a glance
          </button>
        </div>
      </div>

      {convo.handledBy === 'ai' ? (
        <div className="chat-handoff-banner is-ai">
          <span className="chat-handoff-icon">
            <Icon name="bot" />
          </span>
          <span className="chat-handoff-text">
            <strong>Nourish AI</strong> is chatting with {firstName} live —
            you&apos;re watching the conversation. Take over below to message
            them yourself.
          </span>
        </div>
      ) : (
        <div className="chat-handoff-banner is-human">
          <span className="chat-handoff-icon">
            <Icon name="user-check" />
          </span>
          <span className="chat-handoff-text">
            You&apos;re chatting live with {firstName}.
          </span>
          <button className="link-btn" onClick={handBack}>
            Hand back to Nourish AI
          </button>
        </div>
      )}

      <div className="chat-scroll" id="chatScrollArea" ref={scrollRef}>
        <Thread
          messages={convo.messages}
          typing={typing}
          convo={convo}
          refresh={refresh}
        />
      </div>

      {convo.handledBy === 'ai' ? (
        <div className="chat-composer chat-composer-locked">
          <div className="composer-locked-msg">
            <Icon name="lock" />
            <span>
              Nourish AI is handling this conversation. Take over to message{' '}
              {firstName} yourself.
            </span>
          </div>
          <button className="btn-primary" onClick={takeOver}>
            Take over conversation
          </button>
        </div>
      ) : (
        <>
          <div className="chat-suggestions" id="chatSuggestions">
            <span className="chat-suggestions-label">
              <Icon name="sparkles" />
              Nourish AI suggests
            </span>
            {suggestions.map((s, i) => (
              <button
                key={`${s}-${i}`}
                className="suggestion-chip"
                onClick={() => {
                  setInput(s)
                  window.requestAnimationFrame(() => {
                    autoGrow()
                    inputRef.current?.focus()
                  })
                }}
              >
                {s}
              </button>
            ))}
            <button
              className="icon-btn sm"
              title="More suggestions"
              onClick={() => setSuggestions(randomSuggestions(3))}
            >
              <Icon name="refresh-cw" />
            </button>
          </div>
          {pendingAttachment ? (
            <div className="chat-pending-attachment">
              <Attachment
                att={pendingAttachment}
                removable
                onRemove={() => setPendingAttachment(null)}
              />
            </div>
          ) : null}
          <div className="chat-composer">
            <div className="chat-composer-toolbar">
              <input
                type="file"
                hidden
                ref={fileRef}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onFile(file)
                  e.target.value = ''
                }}
              />
              <button
                className="icon-btn sm"
                title="Attach file"
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="paperclip" />
              </button>
              <div style={{ position: 'relative' }}>
                <button
                  className="icon-btn sm"
                  title="Emoji"
                  onClick={() => setEmojiOpen((o) => !o)}
                >
                  <Icon name="smile" />
                </button>
                {emojiOpen ? (
                  <div
                    className="composer-popup emoji-popup"
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: 0,
                    }}
                  >
                    {EMOJI_PICKER_POOL.map((em) => (
                      <button
                        key={em}
                        className="emoji-popup-item"
                        onClick={() => {
                          setInput((v) => v + em)
                          setEmojiOpen(false)
                          window.requestAnimationFrame(() => {
                            autoGrow()
                            inputRef.current?.focus()
                          })
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                className="icon-btn sm"
                title="Templates"
                onClick={() => setTemplatesOpen(true)}
              >
                <Icon name="notebook-text" />
              </button>
            </div>
            <textarea
              className="chat-composer-input"
              id="chatComposerInput"
              ref={inputRef}
              rows={1}
              placeholder={`Message ${firstName}…`}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                autoGrow()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <button
              className="chat-send-btn"
              aria-label="Send message"
              onClick={sendMessage}
            >
              <Icon name="send" />
            </button>
          </div>
        </>
      )}

      {templatesOpen ? (
        <TemplatePickerModal
          context="chat"
          onInsert={insertTemplate}
          onClose={() => setTemplatesOpen(false)}
        />
      ) : null}
    </section>
  )
}
