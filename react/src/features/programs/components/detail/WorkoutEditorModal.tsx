import { useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Backdrop } from '@/components/molecules/Backdrop'
import { exerciseById, makeSlot } from '../../data'
import type { Workout, WorkoutSlot } from '../../types'
import { ExercisePickerModal } from './ExercisePickerModal'

// Centered workout editor — same fields and swap/remove/add flow as the AI Plan
// Workspace's editor. Edits a local draft; Save writes it back to the workout.
export function WorkoutEditorModal({
  workout,
  weekNum,
  dayLabel,
  onSave,
  onClose,
}: {
  workout: Workout
  weekNum: number
  dayLabel: string
  onSave: () => void
  onClose: () => void
}) {
  const [name, setName] = useState(workout.name)
  const [exercises, setExercises] = useState<WorkoutSlot[]>(() =>
    workout.exercises.map((s) => ({ ...s })),
  )
  const [picker, setPicker] = useState<{ replaceUid: string | null } | null>(
    null,
  )
  const dragUid = useRef<string | null>(null)

  const commit = () => {
    workout.name = name
    workout.exercises = exercises
    onSave()
  }

  const updateField = (
    uid: string,
    field: 'sets' | 'reps' | 'rest',
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((s) =>
        s.uid === uid
          ? {
              ...s,
              [field]: field === 'sets' ? parseInt(value, 10) || 0 : value,
            }
          : s,
      ),
    )
  }

  const removeExercise = (uid: string) =>
    setExercises((prev) => prev.filter((s) => s.uid !== uid))

  const handlePick = (exId: string) => {
    if (!picker) return
    if (picker.replaceUid) {
      const uid = picker.replaceUid
      setExercises((prev) =>
        prev.map((s) => (s.uid === uid ? { ...s, exerciseId: exId } : s)),
      )
    } else {
      const seed = Date.now() % 100000
      setExercises((prev) => [...prev, makeSlot(exId, seed, prev.length)])
    }
    setPicker(null)
  }

  const onDrop = (targetUid: string) => {
    const from = dragUid.current
    dragUid.current = null
    if (!from || from === targetUid) return
    setExercises((prev) => {
      const fromIdx = prev.findIndex((s) => s.uid === from)
      const toIdx = prev.findIndex((s) => s.uid === targetUid)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
  }

  return (
    <>
      <Backdrop className="modal-overlay" onClose={commit}>
        <div className="modal-card pw-modal-card pw-editor">
          <div className="modal-head">
            <h3>
              Edit {dayLabel} workout · Week {weekNum}
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
              <Icon name="grip-vertical" className="inline-icon" />
              Drag to reorder exercises.
            </p>
            <div className="pw-edit-list">
              {exercises.map((slot) => {
                const ex = exerciseById(slot.exerciseId)
                if (!ex) return null
                return (
                  // Drag-to-reorder is a pointer-only affordance; keyboard
                  // users reorder via the Swap/Remove controls in each row.
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <div
                    key={slot.uid}
                    className="pw-edit-row"
                    draggable
                    onDragStart={() => {
                      dragUid.current = slot.uid
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      onDrop(slot.uid)
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
                            onClick={() => setPicker({ replaceUid: slot.uid })}
                          >
                            <Icon name="repeat" />
                          </button>
                          <button
                            className="icon-btn xs danger"
                            title="Remove"
                            onClick={() => removeExercise(slot.uid)}
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
                            value={slot.sets}
                            onChange={(e) =>
                              updateField(slot.uid, 'sets', e.target.value)
                            }
                          />
                        </label>
                        <label className="pw-edit-field">
                          Reps
                          <input
                            type="text"
                            value={slot.reps}
                            onChange={(e) =>
                              updateField(slot.uid, 'reps', e.target.value)
                            }
                          />
                        </label>
                        <label className="pw-edit-field">
                          Rest
                          <input
                            type="text"
                            value={slot.rest}
                            onChange={(e) =>
                              updateField(slot.uid, 'rest', e.target.value)
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
              onClick={() => setPicker({ replaceUid: null })}
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
          slots={exercises}
          replaceUid={picker.replaceUid}
          onPick={handlePick}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </>
  )
}
