import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal'
import { showToast } from '@/lib/toast'
import type { Program } from '../../types'

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
      <p className="pw-muted">
        The number of weeks the diet plan is authored across. Shortening it
        hides the trailing weeks&apos; sheets; they are kept and come back if
        you extend again.
      </p>
    </Modal>
  )
}
