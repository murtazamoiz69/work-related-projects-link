import { useMemo, useState } from 'react'
import { EXERCISE_LIBRARY } from '@/features/programs'
import type { WorkoutSlot } from '@/features/programs'
import { exerciseHardIssue, exerciseIssues } from '../../clinical'
import { PwModalShell } from './PwModalShell'
import type { ClinicalProfile } from '../../types'

// Predefined exercise catalog — used for both "Add exercise" (replaceIndex
// null) and "Swap" (replaceIndex set). Exercises that would injure the client
// are excluded entirely; equipment mismatches are shown with a note.
export function ExercisePickerModal({
  profile,
  slots,
  replaceIndex,
  onPick,
  onClose,
}: {
  profile: ClinicalProfile
  slots: WorkoutSlot[]
  replaceIndex: number | null
  onPick: (exId: string) => void
  onClose: () => void
}) {
  const pool = useMemo(
    () => EXERCISE_LIBRARY.filter((e) => !exerciseHardIssue(e, profile)),
    [profile],
  )
  const muscles = useMemo(() => [...new Set(pool.map((e) => e.muscle))], [pool])
  const [filter, setFilter] = useState('all')

  const list = filter === 'all' ? pool : pool.filter((e) => e.muscle === filter)

  return (
    <PwModalShell
      title={replaceIndex != null ? 'Swap exercise' : 'Add exercise'}
      onClose={onClose}
      cardClassName="pw-swap"
    >
      <label className="pw-modal-field">
        Filter by muscle group
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All muscle groups</option>
          {muscles.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <div className="pw-swap-list">
        {list.map((ex) => {
          const issues = exerciseIssues(ex, profile)
          const alreadyIn = slots.some(
            (s, idx) => s.exerciseId === ex.id && idx !== replaceIndex,
          )
          return (
            <button
              key={ex.id}
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
              ) : issues.length ? (
                <span className="pw-swap-note">
                  {issues.map((i) => i.reason).join(', ')}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </PwModalShell>
  )
}
