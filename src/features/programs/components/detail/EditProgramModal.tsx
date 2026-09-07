import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal'
import { showToast } from '@/lib/toast'
import { buildEmptyDietWeek, buildEmptyWorkoutWeek } from '../../data'
import type { TrainingProgram } from '../../types'

// Header pencil → Edit Program. Extending the timeline adds blank (rest-day,
// no-meal) weeks; shortening removes weeks from the end, never past an assigned
// member's current week.
export function EditProgramModal({
  program: p,
  onClose,
  onSaved,
}: {
  program: TrainingProgram
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

    const maxMemberWeek = p.members.reduce(
      (a, m) => Math.max(a, m.currentWeek),
      1,
    )
    const requestedWeeks = Math.min(
      24,
      Math.max(maxMemberWeek, Math.round(Number(weeks) || p.durationWeeks)),
    )
    const currentLen = p.workoutWeeks.length
    if (requestedWeeks > currentLen) {
      for (let i = currentLen; i < requestedWeeks; i++) {
        p.workoutWeeks.push(buildEmptyWorkoutWeek(i + 1))
        p.dietWeeks.push(buildEmptyDietWeek(i + 1))
      }
    } else if (requestedWeeks < currentLen) {
      p.workoutWeeks.length = requestedWeeks
      p.dietWeeks.length = requestedWeeks
    }
    p.durationWeeks = requestedWeeks

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
          min={1}
          max={24}
          value={weeks}
          onChange={(e) => setWeeks(e.target.value)}
        />
      </label>
      <p className="pw-muted">
        Extending adds new weeks with blank (rest-day, no-meal) days to build
        out; shortening removes weeks from the end.
      </p>
    </Modal>
  )
}
