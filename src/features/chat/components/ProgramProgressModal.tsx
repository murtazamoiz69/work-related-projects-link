import { useEffect, useId, useRef } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Backdrop } from '@/components/molecules/Backdrop'
import type { Client } from '@/features/clients'
import {
  CurrentProgramLabel,
  ProgramTrackerDashboard,
  useClientDetailQuery,
} from '@/features/client-detail'
import { useConversationQuery } from '../hooks/useConversations'

/** The user's Program tab — the same progress dashboard the Client 360 profile
 * shows — opened in a big viewport over Chat so the nutritionist can read how
 * the plan is tracking without leaving the conversation. */
export function ProgramProgressModal({
  client,
  onClose,
}: {
  client: Client
  onClose: () => void
}) {
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // The tracker data (programs, journey, adherence) is derived server-side and
  // fetched from the client-detail API.
  const { data: detail } = useClientDetailQuery(client.id)
  // The user's real logged activity comes from their conversation (the API),
  // injected into the tracker (which is client-detail and must not import chat).
  const { data: conversation } = useConversationQuery(client.conversationId)
  const activity = conversation?.activity ?? []

  // Escape closes, focus starts inside and returns to the opener, Tab stays
  // within the card, and the page behind stops scrolling — same dialog
  // behaviour as ActivityLogModal.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // The photo lightbox can open on top of this modal and listens on the
        // same document node, so let the topmost layer take the key instead of
        // dismissing both at once.
        if (document.querySelector('.photo-lightbox-overlay')) return
        onClose()
        return
      }
      if (e.key !== 'Tab' || !cardRef.current) return
      const focusable = cardRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <Backdrop className="modal-overlay" onClose={onClose}>
      <div
        className="modal-card prog-progress-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={cardRef}
      >
        <div className="modal-head">
          <div className="prog-progress-headings">
            <h3 id={titleId}>
              <Icon name="activity" className="inline-icon" />
              {client.name} at a glance
            </h3>
            <p className="prog-progress-subtitle">{client.program}</p>
          </div>
          <div className="prog-progress-head-actions">
            {detail ? (
              <CurrentProgramLabel program={detail.programs[0]} />
            ) : null}
            <button
              className="icon-btn sm"
              onClick={onClose}
              aria-label="Close program progress"
              ref={closeRef}
            >
              <Icon name="x" />
            </button>
          </div>
        </div>
        <div className="prog-progress-body" aria-busy={!detail || undefined}>
          {detail ? (
            <ProgramTrackerDashboard
              client={client}
              detail={detail}
              activity={activity}
              hideSwitcher
            />
          ) : (
            <span className="skel skel-wide" style={{ height: 200 }} />
          )}
        </div>
      </div>
    </Backdrop>
  )
}
