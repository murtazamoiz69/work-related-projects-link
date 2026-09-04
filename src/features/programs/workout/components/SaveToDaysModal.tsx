import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Modal } from '@/components/molecules/Modal'

/** "Save this day to…" — the single Save's companion. The nutritionist authors
 *  one day, then chooses which days it lands on: this day, all of them, or any
 *  hand-picked set. The day being edited is included and checked by default, so
 *  a plain Save (this day only) is one click. */
export function SaveToDaysModal({
  currentDay,
  totalDays,
  intro,
  pending,
  onClose,
  onConfirm,
}: {
  currentDay: number
  totalDays: number
  /** What is being saved, in the caller's words. */
  intro: ReactNode
  pending: boolean
  onClose: () => void
  onConfirm: (days: number[]) => void
}) {
  const allDays = Array.from({ length: totalDays }, (_, i) => i + 1)
  const [selected, setSelected] = useState<number[]>([currentDay])

  const toggle = (day: number) =>
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )

  const sameSet = (a: number[]) =>
    a.length === selected.length && a.every((d) => selected.includes(d))

  const presets: { key: string; label: string; days: number[] }[] = [
    { key: 'this', label: 'This day', days: [currentDay] },
    { key: 'all', label: 'All days', days: allDays },
  ]

  return (
    <Modal
      title="Save this day to…"
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!selected.length || pending}
            onClick={() => onConfirm(selected)}
          >
            {pending
              ? 'Saving…'
              : `Save to ${selected.length} day${selected.length === 1 ? '' : 's'}`}
          </button>
        </>
      }
    >
      <p className="dup-sheet-intro">{intro}</p>

      <div className="save-weeks-presets">
        {presets.map((p) => (
          <button
            key={p.key}
            className="save-weeks-preset"
            aria-pressed={sameSet(p.days)}
            onClick={() => setSelected(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="dup-sheet-weeks">
        {allDays.map((day) => {
          const checked = selected.includes(day)
          const isCurrent = day === currentDay
          return (
            <label
              key={day}
              className={`dup-sheet-week${checked ? ' is-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(day)}
              />
              <span className="dup-sheet-week-label">Day {day}</span>
              {isCurrent ? (
                <span className="save-weeks-editing">editing</span>
              ) : null}
              {checked ? (
                <Icon name="check" className="dup-sheet-week-check" />
              ) : null}
            </label>
          )
        })}
      </div>
    </Modal>
  )
}
