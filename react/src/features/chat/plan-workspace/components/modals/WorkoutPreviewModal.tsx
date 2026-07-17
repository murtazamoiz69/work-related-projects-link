import { Icon } from '@/components/atoms/Icon'
import { exerciseById } from '@/features/programs'
import { PwModalShell } from './PwModalShell'
import type { ClinicalProfile, WsWorkout } from '../../types'

// Read-only workout view — roughly what the client sees in their app.
export function WorkoutPreviewModal({
  profile,
  workout,
  title,
  onClose,
}: {
  profile: ClinicalProfile
  workout: WsWorkout
  title: string
  onClose: () => void
}) {
  return (
    <PwModalShell
      title={title}
      onClose={onClose}
      cardClassName="pw-view-modal"
      footer={
        <button className="link-btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <p className="pw-muted">
        This is roughly what {profile.name.split(' ')[0]} will see in their app — read-only.
      </p>
      <div className="pw-view-list">
        {workout.exercises.map((slot) => {
          const ex = exerciseById(slot.exerciseId)
          if (!ex) return null
          return (
            <div className="pw-view-ex" key={slot.uid}>
              <div className="pw-view-ex-media">
                <Icon name="play-circle" />
              </div>
              <div className="pw-view-ex-body">
                <span className="pw-view-ex-name">{ex.name}</span>
                <div className="pw-ex-tags">
                  <span className="pw-ex-tag">{ex.muscle}</span>
                  <span className="pw-ex-tag alt">{ex.equipment}</span>
                </div>
                <p className="pw-view-ex-desc">{ex.instructions}</p>
                <div className="pw-view-ex-stats">
                  <span>
                    <b>{slot.sets}</b> sets
                  </span>
                  <span>
                    <b>{slot.reps}</b> reps
                  </span>
                  <span>
                    <b>{slot.rest}</b> rest
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </PwModalShell>
  )
}
