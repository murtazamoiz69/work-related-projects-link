import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Avatar } from '@/components/atoms/Avatar'
import { PhotoLightbox } from '@/components/molecules/PhotoLightbox'
import { showToast } from '@/lib/toast'
import {
  useClientDietPlanQuery,
  useUpdateClientReview,
} from '@/features/programs/diet/useDietPlan'
import {
  EMOJI_PICKER_POOL,
  formatDateSep,
  formatTime,
  randomSuggestions,
} from '../data'
import type { ChatAttachment, ChatMessage, Conversation } from '../types'
import type { SendMessageBody } from '../api/chat.types'
import { useHandoff, useSendMessage } from '../hooks/useConversations'
import { useConversationRealtime } from '../hooks/useConversationRealtime'

function Attachment({
  att,
  removable,
  onRemove,
  onOpen,
}: {
  att: ChatAttachment
  removable?: boolean
  onRemove?: () => void
  /** Opens the full-size viewer. Absent for the composer's pending draft. */
  onOpen?: () => void
}) {
  const removeBtn = removable ? (
    <button
      className="icon-btn sm chat-attachment-remove"
      title="Remove"
      onClick={onRemove}
    >
      <Icon name="x" />
    </button>
  ) : null

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
      {removeBtn}
    </div>
  )
}

function Bubble({
  m,
  onOpenAttachment,
}: {
  m: ChatMessage
  onOpenAttachment: (att: ChatAttachment) => void
}) {
  if (m.from === 'system') {
    return (
      <div className="chat-system-msg">
        <span>{m.text}</span>
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
}: {
  messages: ChatMessage[]
  typing: 'client' | 'ai' | null
  convo: Conversation
}) {
  const [viewing, setViewing] = useState<ChatAttachment | null>(null)

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
    nodes.push(<Bubble m={m} onOpenAttachment={setViewing} key={`msg-${i}`} />)
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
  onManagePlan,
  onViewProgram,
}: {
  convo: Conversation
  onManagePlan: () => void
  onViewProgram: () => void
}) {
  const c = convo.client
  const firstName = c.name.split(' ')[0]
  // The plan's sign-off state, read from the roster record the conversation
  // carries — the same field the Users roster shows as a chip.
  const inReview = c.dietReview !== 'reviewed'
  const reviewPlan = useUpdateClientReview(c.id)

  const [input, setInput] = useState('')
  const [pendingAttachment, setPendingAttachment] =
    useState<ChatAttachment | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    randomSuggestions(3),
  )
  const [emojiOpen, setEmojiOpen] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const sendMessageMutation = useSendMessage()
  const handoff = useHandoff()
  // Review status lives on the plan response, not on `convo.client` — that
  // client object is a snapshot taken when the conversation was seeded and
  // never refetches, so reading it here would show the review as pending
  // forever even after it's marked done. Week 1 is just a vehicle: the
  // sign-off is a per-user flag, stamped identically onto every week's plan.
  const dietPlanQuery = useClientDietPlanQuery(c.id, 1)
  const updateReview = useUpdateClientReview(c.id)
  const reviewPending = dietPlanQuery.data?.review === 'in-review'
  // Realtime source (client-side sim for the mock; websocket/poll later). It
  // appends inbound messages to the detail cache and owns the typing indicator.
  const { typing, triggerClientReply } = useConversationRealtime(
    convo.id,
    convo.handledBy,
    convo.status,
  )

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

  const sendMessage = () => {
    const text = input.trim()
    if ((!text && !pendingAttachment) || convo.handledBy !== 'nutritionist')
      return
    const body: SendMessageBody = { text, attachment: pendingAttachment }
    setInput('')
    setPendingAttachment(null)
    if (inputRef.current) inputRef.current.style.height = 'auto'
    // The message appears immediately (optimistic); once it's persisted the
    // client sends a simulated reply.
    sendMessageMutation.mutate(
      { id: convo.id, body },
      { onSuccess: () => triggerClientReply() },
    )
  }

  const takeOver = () => {
    handoff.mutate(
      { id: convo.id, handledBy: 'nutritionist' },
      { onSuccess: () => showToast(`You're now chatting live with ${c.name}`) },
    )
  }
  const handBack = () => {
    handoff.mutate(
      { id: convo.id, handledBy: 'ai' },
      { onSuccess: () => showToast(`Nourish AI is handling ${c.name} again`) },
    )
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
        <div className="chat-header-meta">
          <Avatar initials={c.initials} color={c.color} />
          <div className="chat-header-id">
            <span className="chat-header-name">{c.name}</span>
            <span className="chat-header-sub">
              <span className="chat-header-sub-text">
                {/* A user added through "Add User" has no profile yet — the
                    backend sends `age: 0` to mean "not collected". Show only
                    what's actually known rather than printing a placeholder. */}
                {[
                  c.age > 0 ? c.age : null,
                  c.age > 0 ? c.gender : null,
                  c.program,
                ]
                  .filter(Boolean)
                  .join(' · ')}
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
          {/* The review gate, where the nutritionist actually is. A user is not
              served their plan until this is marked — and any edit to the plan
              sends it back here. Reads as the state, not just the action, so a
              plan already signed off says so. */}
          <button
            className={`btn-secondary sm review-cta${inReview ? ' is-pending' : ' is-done'}`}
            onClick={() =>
              reviewPlan.mutate(inReview ? 'reviewed' : 'in-review')
            }
            disabled={reviewPlan.isPending}
            title={
              inReview
                ? `${firstName} can't see this plan until it's reviewed`
                : `Reviewed — ${firstName} can see this plan. Click to reopen.`
            }
          >
            <span
              className={`chat-header-action-icon ${inReview ? 'is-soft' : 'is-solid'}`}
            >
              <Icon name={inReview ? 'clipboard-check' : 'check'} size={15} />
            </span>
            {inReview ? 'Review Plan' : 'Reviewed'}
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

      {reviewPending ? (
        <div className="chat-handoff-banner is-review">
          <span className="chat-handoff-icon">
            <Icon name="clipboard-list" />
          </span>
          <span className="chat-handoff-text">
            <strong>{firstName}&apos;s</strong> meal and workout plan review is
            pending.
          </span>
          <button
            className="btn-primary sm"
            disabled={updateReview.isPending}
            onClick={() => updateReview.mutate('reviewed')}
          >
            {updateReview.isPending ? 'Saving…' : 'Review done'}
          </button>
        </div>
      ) : null}

      <div className="chat-scroll" id="chatScrollArea" ref={scrollRef}>
        <Thread messages={convo.messages} typing={typing} convo={convo} />
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
    </section>
  )
}
