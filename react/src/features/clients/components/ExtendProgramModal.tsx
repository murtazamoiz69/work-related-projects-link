import { useMemo, useState } from 'react'
import { Modal } from '@/components/molecules/Modal'
import { showToast } from '@/lib/toast'
import type { Client } from '../types'
import { formatFullDate, formatPeriodDate } from '../utils'

type QuickOption = '7' | '14' | '30' | '90' | 'custom'

const QUICK_OPTIONS: { key: QuickOption; label: string }[] = [
  { key: '7', label: '+7 days' },
  { key: '14', label: '+14 days' },
  { key: '30', label: '+30 days' },
  { key: '90', label: '+3 months' },
  { key: 'custom', label: 'Custom' },
]

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(d: Date, months: number): Date {
  const next = new Date(d)
  next.setMonth(next.getMonth() + months)
  return next
}

export function ExtendProgramModal({
  client,
  onClose,
  onExtended,
}: {
  client: Client
  onClose: () => void
  onExtended: (newExpiry: Date) => void
}) {
  const [option, setOption] = useState<QuickOption>('30')
  const [customDate, setCustomDate] = useState(() =>
    toInputDate(addDays(client.expiryDate, 30)),
  )

  const newExpiry = useMemo(() => {
    switch (option) {
      case '7':
        return addDays(client.expiryDate, 7)
      case '14':
        return addDays(client.expiryDate, 14)
      case '30':
        return addDays(client.expiryDate, 30)
      case '90':
        return addMonths(client.expiryDate, 3)
      case 'custom': {
        const parsed = new Date(`${customDate}T00:00:00`)
        return Number.isNaN(parsed.getTime()) ? client.expiryDate : parsed
      }
      default:
        return client.expiryDate
    }
  }, [option, customDate, client.expiryDate])

  const save = () => {
    onExtended(newExpiry)
    onClose()
    showToast(
      `Program extended successfully — ${client.name}'s program now ends on ${formatFullDate(newExpiry)}.`,
    )
  }

  return (
    <Modal
      title="Extend program"
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            Extend program
          </button>
        </>
      }
    >
      <p className="extend-modal-name">{client.name}</p>

      <div className="extend-modal-current">
        <span className="extend-modal-label">Current program expiry</span>
        <span className="extend-modal-value">
          {formatFullDate(client.expiryDate)}
        </span>
      </div>

      <div className="modal-field">
        <span>Extend by</span>
        <div className="extend-quick-options">
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`extend-quick-btn${option === opt.key ? ' active' : ''}`}
              onClick={() => setOption(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {option === 'custom' ? (
        <label className="modal-field">
          <span>New expiry date</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
          />
        </label>
      ) : null}

      <div className="extend-result-row">
        <div>
          <div className="extend-modal-label">New expiry</div>
          <div className="extend-result-value">{formatFullDate(newExpiry)}</div>
        </div>
        <div className="extend-result-dates">
          Program period
          <br />
          {formatPeriodDate(client.expiryDate)} → {formatPeriodDate(newExpiry)}
        </div>
      </div>
    </Modal>
  )
}
