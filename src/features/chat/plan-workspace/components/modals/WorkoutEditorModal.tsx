import { useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Backdrop } from '@/components/molecules/Backdrop'
import { exerciseById, makeSlot } from '@/features/programs'
import type { WorkoutSlot } from '@/features/programs'
import { exerciseIssues } from '../../clinical'
import { pushVersion } from '../../plan'
import { getDay, getWorkoutRef } from '../../context'
import { ExercisePickerModal } from './ExercisePickerModal'
import type { ClinicalProfile, Workspace } from '../../types'

export function WorkoutEditorModal({
  ws,
  profile,
  weekNum,
  dayNum,
  wid,
  refresh,
  onClose,
}: {
  ws: Workspace
  profile: ClinicalProfile
  weekNum: number
  dayNum: number
  wid: string | null
  refresh: () => void
  onClose: () => void
}) {
  const wk = getWorkoutRef(ws, weekNum, dayNum, wid)
  const day = getDay(ws, weekNum, dayNum)
  const [name, setName] = useState(wk ? wk.name : '')
  const [exercises, setExercises] = useState<WorkoutSlot[]>(() =>
    wk ? wk.exercises.map((s) => ({ ...s })) : [],
  )
  const [picker, setPicker] = useState<{ replaceIndex: number | null } | null>(
    null,
  )
  const dragIndex = useRef<number | null>(null)

  if (!wk) return null

  const commit = () => {
    wk.name = name.trim() || wk.name
    wk.exercises = exercises
    pushVersion(
      ws,
      `Edited ${day ? day.label : ''} workout`,
      'Sarah Nolan',
      `Week ${weekNum} ${day ? day.label : ''} updated`,
    )
    refresh()
    onClose()
  }

  const updateField = (
    i: number,
    field: 'sets' | 'reps' | 'rest',
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? {
              ...s,
              [field]:
                field === 'sets'
                  ? Math.max(1, parseInt(value, 10) || 1)
                  : value,
            }
          : s,
      ),
    )
  }
  const removeExercise = (i: number) =>
    setExercises((prev) => prev.filter((_, idx) => idx !== i))

  const handlePick = (exId: string) => {
    if (!picker) return
    if (picker.replaceIndex != null) {
      const i = picker.replaceIndex
      setExercises((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, exerciseId: exId } : s)),
      )
    } else {
      setExercises((prev) => [
        ...prev,
        makeSlot(exId, profile._seed + prev.length, prev.length),
      ])
    }
    setPicker(null)
  }

  const onDrop = (targetIndex: number) => {
    const from = dragIndex.current
    dragIndex.current = null
    if (from == null || from === targetIndex) return
    setExercises((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  return (
    <>
      <Backdrop className="modal-overlay pw-modal-overlay" onClose={commit}>
        <div className="modal-card pw-modal-card pw-editor">
          <div className="modal-head">
            <h3>
              Edit {day ? day.label : ''} workout · Week {weekNum}
            </h3>
            <button className="icon-btn sm" onClick={commit} aria-label="Close">
              <Icon name="x" />
            </button>
          </div>
          <div className="modal-body pw-modal-body">
            <label className="pw-modal-field">
              Workout name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <p className="pw-muted pw-edit-hint">
              Drag <Icon name="grip-vertical" className="inline-icon" /> to
              reorder exercises.
            </p>
            <div className="pw-edit-list">
              {exercises.map((slot, i) => {
                const ex = exerciseById(slot.exerciseId)
                if (!ex) return null
                const issues = exerciseIssues(ex, profile)
                return (
                  // Drag-to-reorder is a pointer-only affordance; keyboard
                  // users reorder via the Swap/Remove controls in each row.
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <div
                    key={slot.uid}
                    className={`pw-edit-row${issues.some((x) => x.level === 'hard') ? ' risk' : ''}`}
                    draggable
                    title={
                      issues.length
                        ? issues.map((x) => x.reason).join('; ')
                        : undefined
                    }
                    onDragStart={() => {
                      dragIndex.current = i
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      onDrop(i)
                    }}
                  >
                    <span className="drag-handle" title="Drag to reorder">
                      <Icon name="grip-vertical" />
                    </span>
                    <div className="pw-view-ex-media">
                      <Icon name="play-circle" />
                    </div>
                    <div className="pw-view-ex-body">
                      <div className="pw-edit-ex-head">
                        <span className="pw-view-ex-name">{ex.name}</span>
                        <div className="pw-edit-ops">
                          <button
                            className="icon-btn xs"
                            title="Swap for alternative"
                            onClick={() => setPicker({ replaceIndex: i })}
                          >
                            <Icon name="repeat" />
                          </button>
                          <button
                            className="icon-btn xs danger"
                            title="Remove"
                            onClick={() => removeExercise(i)}
                          >
                            <Icon name="trash-2" />
                          </button>
                        </div>
                      </div>
                      <div className="pw-ex-tags">
                        <span className="pw-ex-tag">{ex.muscle}</span>
                        <span className="pw-ex-tag alt">{ex.equipment}</span>
                      </div>
                      <p className="pw-view-ex-desc">{ex.instructions}</p>
                      <div className="pw-edit-ex-fields">
                        <label className="pw-edit-field">
                          Sets
                          <input
                            type="number"
                            min={1}
                            max={8}
                            value={slot.sets}
                            onChange={(e) =>
                              updateField(i, 'sets', e.target.value)
                            }
                          />
                        </label>
                        <label className="pw-edit-field">
                          Reps
                          <input
                            type="text"
                            value={slot.reps}
                            onChange={(e) =>
                              updateField(i, 'reps', e.target.value)
                            }
                          />
                        </label>
                        <label className="pw-edit-field">
                          Rest
                          <input
                            type="text"
                            value={slot.rest}
                            onChange={(e) =>
                              updateField(i, 'rest', e.target.value)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              className="btn-secondary sm"
              onClick={() => setPicker({ replaceIndex: null })}
            >
              <Icon name="plus" />
              Add exercise
            </button>
          </div>
          <div className="modal-foot">
            <button className="link-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" onClick={commit}>
              Save changes
            </button>
          </div>
        </div>
      </Backdrop>
      {picker ? (
        <ExercisePickerModal
          profile={profile}
          slots={exercises}
          replaceIndex={picker.replaceIndex}
          onPick={handlePick}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </>
  )
}
