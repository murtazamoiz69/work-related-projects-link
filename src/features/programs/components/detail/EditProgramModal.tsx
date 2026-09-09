import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal'
import { showToast } from '@/lib/toast'
import { formatJoinDate } from '@/features/clients'
import { programEndDate } from '../../types'
import type { Program } from '../../types'

/** `<input type="date">` works in local yyyy-mm-dd, not ISO instants. */
function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function fromDateInput(v: string): Date | null {
  const [y, m, d] = v.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

const MIN_WEEKS = 1
const MAX_WEEKS = 24

// Header pencil -> Edit Program. Name, description, and the programme length in
// weeks. The workout and diet content are authored on their own tabs (a flat
// run of days / one sheet per week+band), so changing the length here is just a
// number — the diet tab's week rail follows it.
export function EditProgramModal({
  program: p,
  onClose,
  onSaved,
}: {
  program: Program
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(p.name)
  const [desc, setDesc] = useState(p.description)
  const [weeks, setWeeks] = useState(String(p.durationWeeks))
  // <input type="date"> wants yyyy-mm-dd in local time, not an ISO instant.
  const [start, setStart] = useState(toDateInput(p.startDate))

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      showToast('Give the program a name first')
      return
    }
    p.name = trimmed
    p.description = desc.trim() || p.description
    p.durationWeeks = Math.min(
      MAX_WEEKS,
      Math.max(MIN_WEEKS, Math.round(Number(weeks) || p.durationWeeks)),
    )
    const parsed = fromDateInput(start)
    if (!parsed) {
      showToast('Give the program a valid start date')
      return
    }
    p.startDate = parsed

    onClose()
    onSaved()
    showToast('Program updated')
  }

  return (
    <Modal
      title="Edit Program"
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            Save changes
          </button>
        </>
      }
    >
      <label className="modal-field">
        <span>Program Name</span>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="modal-field">
        <span>Description</span>
        <textarea
          className="notes-input"
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </label>
      <label className="modal-field">
        <span>Timeline (weeks)</span>
        <input
          type="number"
          min={MIN_WEEKS}
          max={MAX_WEEKS}
          value={weeks}
          onChange={(e) => setWeeks(e.target.value)}
        />
      </label>
      <label className="modal-field">
        <span>Start date</span>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </label>
      <p className="pw-muted">
        The number of weeks the diet plan is authored across. Shortening it
        hides the trailing weeks&apos; sheets; they are kept and come back if
        you extend again.
      </p>
      {/* The end date is derived, never typed, so it cannot contradict the
          start date and the length. */}
      <p className="pw-muted">
        Runs {formatJoinDate(fromDateInput(start) ?? p.startDate)} &ndash;{' '}
        {formatJoinDate(
          programEndDate({
            startDate: fromDateInput(start) ?? p.startDate,
            durationWeeks: Math.min(
              MAX_WEEKS,
              Math.max(MIN_WEEKS, Math.round(Number(weeks) || p.durationWeeks)),
            ),
          }),
        )}
        .
      </p>
    </Modal>
  )
}
