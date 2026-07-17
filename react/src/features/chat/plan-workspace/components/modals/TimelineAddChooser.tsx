import { Icon } from '@/components/atoms/Icon'
import { PwModalShell } from './PwModalShell'

export function TimelineAddChooser({
  dayLabel,
  weekNum,
  hasSession,
  onWorkout,
  onDiet,
  onClose,
}: {
  dayLabel: string
  weekNum: number
  hasSession: boolean
  onWorkout: () => void
  onDiet: () => void
  onClose: () => void
}) {
  return (
    <PwModalShell
      title={`Add to ${dayLabel} · Week ${weekNum}`}
      onClose={onClose}
      cardClassName="pw-tl-chooser-modal"
    >
      <div className="pw-tl-chooser">
        <button className="pw-tl-choice" onClick={onWorkout}>
          <span className="pw-tl-choice-icon">
            <Icon name="dumbbell" />
          </span>
          <span className="pw-tl-choice-body">
            <b>Add a workout</b>
            <span>
              {hasSession
                ? 'Pick another session from the catalog — you can schedule more than one workout a day.'
                : 'Pick from the workout catalog for this day.'}
            </span>
          </span>
        </button>
        <button className="pw-tl-choice" onClick={onDiet}>
          <span className="pw-tl-choice-icon">
            <Icon name="utensils" />
          </span>
          <span className="pw-tl-choice-body">
            <b>Add a diet item</b>
            <span>Search the recipe library and add a meal or snack at a specific time.</span>
          </span>
        </button>
      </div>
    </PwModalShell>
  )
}
