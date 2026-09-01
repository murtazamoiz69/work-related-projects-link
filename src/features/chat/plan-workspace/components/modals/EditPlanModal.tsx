import { useState } from 'react'
import { generateEmptyWeek, pushVersion } from '../../plan'
import { addDays, toDateInputValue } from '../../schedule'
import { PwModalShell } from './PwModalShell'
import type { PwConfirm } from '../../context'
import type { ClinicalProfile, Workspace } from '../../types'

export function EditPlanModal({
  ws,
  profile,
  refresh,
  confirm,
  onClose,
}: {
  ws: Workspace
  profile: ClinicalProfile
  refresh: () => void
  confirm: (c: PwConfirm) => void
  onClose: () => void
}) {
  const initialWeeks = ws.workoutWeeks.length
  const [name, setName] = useState(ws.planName)
  const [description, setDescription] = useState(ws.planDescription || '')
  const [weeks, setWeeks] = useState(String(initialWeeks))
  const [start, setStart] = useState(toDateInputValue(profile.programStart))

  const weeksNum = Math.min(
    16,
    Math.max(4, parseInt(weeks, 10) || initialWeeks),
  )
  const startDate = start ? new Date(`${start}T00:00:00`) : profile.programStart
  const endValue = toDateInputValue(addDays(startDate, weeksNum * 7))

  // Program settings reshape the whole timeline — shortening the plan drops
  // whole weeks of it — so this one confirms even though ordinary content
  // edits do not.
  const save = () => {
    const shrinking = weeksNum < initialWeeks
    confirm({
      title: 'Update this program?',
      message: shrinking
        ? `The plan goes from ${initialWeeks} weeks to ${weeksNum}, so Weeks ${weeksNum + 1}–${initialWeeks} and everything scheduled in them are removed.`
        : `Program settings change to "${name.trim() || ws.planName}", ${weeksNum} weeks from ${start || toDateInputValue(profile.programStart)}.`,
      confirmText: shrinking ? 'Update and drop weeks' : 'Update program',
      danger: shrinking,
      onConfirm: applySave,
    })
  }

  const applySave = () => {
    ws.planName = name.trim() || ws.planName
    ws.planDescription = description.trim()

    if (start) {
      profile.programStart = new Date(`${start}T00:00:00`)
      profile.tenureDays = Math.max(
        1,
        Math.round(
          (Date.now() - profile.programStart.getTime()) / (24 * 3600 * 1000),
        ),
      )
      profile.currentWeek = Math.max(1, Math.ceil(profile.tenureDays / 7))
    }

    const requestedWeeks = Math.min(
      16,
      Math.max(4, Math.round(parseInt(weeks, 10) || ws.workoutWeeks.length)),
    )
    const currentLen = ws.workoutWeeks.length
    if (requestedWeeks > currentLen) {
      for (let i = currentLen; i < requestedWeeks; i++)
        generateEmptyWeek(ws, profile)
    } else if (requestedWeeks < currentLen) {
      const keep = Math.max(requestedWeeks, profile.currentWeek)
      ws.workoutWeeks.length = keep
      ws.dietWeeks.length = keep
    }

    pushVersion(
      ws,
      'Updated program',
      'Sarah Nolan',
      `“${ws.planName}” · ${ws.workoutWeeks.length}-week timeline`,
    )
    refresh()
    onClose()
  }

  return (
    <PwModalShell
      title="Edit program"
      onClose={onClose}
      cardClassName="pw-edit-plan"
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
      <label className="pw-modal-field">
        Program name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="pw-modal-field">
        Description
        <textarea
          rows={3}
          placeholder="Optional notes about this plan…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="pw-modal-field">
        Timeline (weeks)
        <input
          type="number"
          min={4}
          max={16}
          value={weeks}
          onChange={(e) => setWeeks(e.target.value)}
        />
      </label>
      <div className="modal-field-row">
        <label className="pw-modal-field">
          Start date
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="pw-modal-field">
          End date
          <input type="date" value={endValue} disabled />
        </label>
      </div>
      <p className="pw-muted">
        End date is calculated from the start date and timeline. Extending adds
        new weeks progressing from the last one; shortening removes weeks from
        the end (never past the user&apos;s current week).
      </p>
    </PwModalShell>
  )
}
