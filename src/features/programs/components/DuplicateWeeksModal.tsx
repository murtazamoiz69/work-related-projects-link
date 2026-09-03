import { useState, type ReactNode } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Modal } from '@/components/molecules/Modal'

/** "Duplicate" — copy one week onto other weeks of the programme. Shared by the
 *  diet sheet and the workout plan: both are authored a week at a time and both
 *  are carried forward the same way, so the picker is one component and the
 *  caller supplies the sentence describing what is being copied. */
export function DuplicateWeeksModal({
  title,
  intro,
  fromWeek,
  totalWeeks,
  pending,
  onClose,
  onConfirm,
}: {
  title: string
  /** What gets copied, in the caller's own words. */
  intro: ReactNode
  fromWeek: number
  totalWeeks: number
  pending: boolean
  onClose: () => void
  onConfirm: (weeks: number[]) => void
}) {
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter(
    (w) => w !== fromWeek,
  )
  const [selected, setSelected] = useState<number[]>([])

  const toggle = (week: number) =>
    setSelected((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week],
    )

  const allSelected = selected.length === weeks.length

  return (
    <Modal
      title={title}
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
              ? 'Copying…'
              : `Copy to ${selected.length} week${selected.length === 1 ? '' : 's'}`}
          </button>
        </>
      }
    >
      <p className="dup-sheet-intro">{intro}</p>

      <div className="dup-sheet-head">
        <span className="dup-sheet-count">
          {selected.length} of {weeks.length} selected
        </span>
        <button
          className="link-btn"
          onClick={() => setSelected(allSelected ? [] : weeks)}
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>

      <div className="dup-sheet-weeks">
        {weeks.map((week) => {
          const checked = selected.includes(week)
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
