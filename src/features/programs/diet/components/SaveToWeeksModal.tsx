import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Modal } from '@/components/molecules/Modal'

/** "Save this week to…" — the diet plan's single Save, mirroring the workout
 *  tab's SaveToDaysModal. The nutritionist authors one week's sheet, then
 *  chooses which weeks it lands on: this week, all of them, or any hand-picked
 *  set. The week being edited is included and checked by default, so a plain
 *  Save (this week only) is one click. */
export function SaveToWeeksModal({
  currentWeek,
  totalWeeks,
  intro,
  pending,
  onClose,
  onConfirm,
}: {
  currentWeek: number
  totalWeeks: number
  /** What is being saved, in the caller's words. */
  intro: ReactNode
  pending: boolean
  onClose: () => void
  onConfirm: (weeks: number[]) => void
}) {
  const allWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1)
  const [selected, setSelected] = useState<number[]>([currentWeek])

  const toggle = (week: number) =>
    setSelected((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week],
    )

  const sameSet = (a: number[]) =>
    a.length === selected.length && a.every((w) => selected.includes(w))

  const presets: { key: string; label: string; weeks: number[] }[] = [
    { key: 'this', label: 'This week', weeks: [currentWeek] },
    { key: 'all', label: 'All weeks', weeks: allWeeks },
  ]

  return (
    <Modal
      title="Save this week to…"
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
              : `Save to ${selected.length} week${selected.length === 1 ? '' : 's'}`}
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
            aria-pressed={sameSet(p.weeks)}
            onClick={() => setSelected(p.weeks)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="dup-sheet-weeks">
        {allWeeks.map((week) => {
          const checked = selected.includes(week)
          const isCurrent = week === currentWeek
          return (
            <label
              key={week}
              className={`dup-sheet-week${checked ? ' is-checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(week)}
              />
              <span className="dup-sheet-week-label">Week {week}</span>
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
