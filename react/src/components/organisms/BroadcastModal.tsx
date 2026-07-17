import { useMemo, useState } from 'react'
import { Modal } from '@/components/molecules/Modal'
import { CLIENTS_DATA } from '@/features/clients'
import { showToast } from '@/lib/toast'
import { useShellStore } from '@/store/useShellStore'
import {
  TemplatePickerModal,
  recordTemplateUsage,
  stripHtmlToText,
} from '@/features/templates'
import type { Template } from '@/features/templates'

// Broadcast composer — ported from V2's openBroadcastModal. Pick a template
// via the universal Template Picker, preview it, and send to a client segment.
export function BroadcastModal() {
  const closeBroadcast = useShellStore((s) => s.closeBroadcast)
  const [segment, setSegment] = useState('all')
  const [template, setTemplate] = useState<Template | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

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

  const preview = template ? stripHtmlToText(template.content) : ''

  const footer = (
    <>
      <button className="link-btn" onClick={closeBroadcast}>
        Cancel
      </button>
      <button
        className="btn-primary"
        disabled={!template}
        onClick={() => {
          if (!template) return
          recordTemplateUsage(template, 'broadcast')
          const seg = segments.find((s) => s.value === segment)
          closeBroadcast()
          if (seg)
            showToast(
              `Broadcast sent to ${seg.count} ${seg.label.toLowerCase()}`,
            )
        }}
      >
        Send Broadcast
      </button>
    </>
  )

  return (
    <>
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
          <span>Message template</span>
          <button
            className="btn-secondary full"
            type="button"
            onClick={() => setPickerOpen(true)}
          >
            {template ? template.title : 'Choose a template…'}
          </button>
        </label>
        {template ? (
          <p className="pw-muted">
            {preview.slice(0, 160)}
            {preview.length > 160 ? '…' : ''}
          </p>
        ) : null}
      </Modal>

      {pickerOpen ? (
        <TemplatePickerModal
          context="broadcast"
          onInsert={(t) => setTemplate(t)}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </>
  )
}
