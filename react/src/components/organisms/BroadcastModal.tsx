import { useMemo, useState } from 'react'
import { Modal } from '@/components/molecules/Modal'
import { CLIENTS_DATA } from '@/features/clients'
import { showToast } from '@/lib/toast'
import { useShellStore } from '@/store/useShellStore'

// NOTE: the full template-picker wiring (openTemplatePickerModal /
// recordTemplateUsage) lands with the Templates phase. For now the broadcast
// composes a plain message to a client segment.
export function BroadcastModal() {
  const closeBroadcast = useShellStore((s) => s.closeBroadcast)
  const [segment, setSegment] = useState('all')
  const [message, setMessage] = useState('')

  const segments = useMemo(
    () => [
      { value: 'all', label: 'All clients', count: CLIENTS_DATA.length },
      {
        value: 'attention',
        label: 'Clients needing attention',
        count: CLIENTS_DATA.filter((c) => c.status === 'attention').length,
      },
      {
        value: 'active',
        label: 'Active clients',
        count: CLIENTS_DATA.filter((c) => c.status === 'active').length,
      },
      {
        value: 'new',
        label: 'New clients',
        count: CLIENTS_DATA.filter((c) => c.status === 'new').length,
      },
    ],
    [],
  )

  const footer = (
    <>
      <button className="link-btn" onClick={closeBroadcast}>
        Cancel
      </button>
      <button
        className="btn-primary"
        disabled={!message.trim()}
        onClick={() => {
          const seg = segments.find((s) => s.value === segment)
          closeBroadcast()
          if (seg) {
            showToast(
              `Broadcast sent to ${seg.count} ${seg.label.toLowerCase()}`,
            )
          }
        }}
      >
        Send Broadcast
      </button>
    </>
  )

  return (
    <Modal title="Broadcast Message" onClose={closeBroadcast} footer={footer}>
      <label className="modal-field">
        <span>Send to</span>
        <select value={segment} onChange={(e) => setSegment(e.target.value)}>
          {segments.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label} ({s.count})
            </option>
          ))}
        </select>
      </label>
      <label className="modal-field">
        <span>Message</span>
        <textarea
          className="notes-input"
          rows={3}
          placeholder="Write a message to send to this segment…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
    </Modal>
  )
}
