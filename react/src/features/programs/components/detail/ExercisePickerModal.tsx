import { useMemo, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { EXERCISE_LIBRARY } from '../../data'
import type { Exercise, WorkoutSlot } from '../../types'

// Predefined exercise catalog, filterable by muscle group — used for both
// "Add exercise" (replaceUid null) and "Swap" (replaceUid set).
export function ExercisePickerModal({
  slots,
  replaceUid,
  onPick,
  onClose,
}: {
  slots: WorkoutSlot[]
  replaceUid: string | null
  onPick: (exerciseId: string) => void
  onClose: () => void
}) {
  const [filterMuscle, setFilterMuscle] = useState('all')
  const muscles = useMemo(
    () => [...new Set(EXERCISE_LIBRARY.map((e) => e.muscle))],
    [],
  )
  const list =
    filterMuscle && filterMuscle !== 'all'
      ? EXERCISE_LIBRARY.filter((e) => e.muscle === filterMuscle)
      : EXERCISE_LIBRARY

  const Row = ({ ex }: { ex: Exercise }) => {
    const alreadyIn = slots.some(
      (s) => s.exerciseId === ex.id && s.uid !== replaceUid,
    )
    return (
      <button
        className="pw-swap-opt"
        disabled={alreadyIn}
        onClick={() => onPick(ex.id)}
      >
        <span className="pw-swap-name">{ex.name}</span>
        <span className="pw-swap-macros">
          {ex.muscle} · {ex.equipment}
        </span>
        {alreadyIn ? (
          <span className="pw-swap-note">Already in this workout</span>
        ) : null}
      </button>
    )
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card pw-modal-card pw-swap">
        <div className="modal-head">
          <h3>{replaceUid ? 'Swap exercise' : 'Add exercise'}</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body pw-modal-body">
          <label className="pw-modal-field">
            Filter by muscle group
            <select
              value={filterMuscle}
              onChange={(e) => setFilterMuscle(e.target.value)}
            >
              <option value="all">All muscle groups</option>
              {muscles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <div className="pw-swap-list">
            {list.map((ex) => (
              <Row key={ex.id} ex={ex} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
