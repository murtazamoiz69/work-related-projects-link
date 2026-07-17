import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Modal } from '@/components/molecules/Modal'
import { showToast } from '@/lib/toast'
import { useShellStore } from '@/store/useShellStore'

const FAQS = [
  {
    q: 'How do I assign a program to a client?',
    a: 'Open the program from the Programs page and use "Assign Users" to search, select, and confirm.',
  },
  {
    q: 'Can I take over a chat Nourish AI is handling?',
    a: 'Yes — open the conversation in Chat and click "Take over" in the banner under the header.',
  },
  {
    q: "Where do I edit a client's workout or meal plan?",
    a: "Inside a program's Workout Plan / Diet Plan tabs — changes autosave as you edit.",
  },
]

export function HelpModal() {
  const closeHelp = useShellStore((s) => s.closeHelp)
  const [message, setMessage] = useState('')

  const footer = (
    <>
      <button className="link-btn" onClick={closeHelp}>
        Close
      </button>
      <button
        className="btn-primary"
        onClick={() => {
          const text = message.trim()
          closeHelp()
          showToast(
            text
              ? "Message sent to support — we'll reply within a day"
              : 'Opening support chat…',
          )
        }}
      >
        Send Message
      </button>
    </>
  )

  return (
    <Modal
      title={
        <>
          <Icon name="life-buoy" className="inline-icon" /> Help &amp; Support
        </>
      }
      onClose={closeHelp}
      footer={footer}
      cardClassName="help-modal-card"
    >
      {FAQS.map((f) => (
        <div className="help-faq-item" key={f.q}>
          <span className="help-faq-q">{f.q}</span>
          <span className="help-faq-a">{f.a}</span>
        </div>
      ))}
      <label className="modal-field">
        <span>Still stuck? Message support</span>
        <textarea
          className="notes-input"
          rows={2}
          placeholder="Describe what you need help with…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
    </Modal>
  )
}
