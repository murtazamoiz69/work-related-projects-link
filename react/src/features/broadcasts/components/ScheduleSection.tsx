import { Icon } from '@/components/atoms/Icon'
import { repeatCountOptions, repeatUnitLabel } from '../data'
import type { RepeatUnit, ScheduleMode, SendTiming } from '../types'

type Props = {
  timing: SendTiming
  onTimingChange: (v: SendTiming) => void
  scheduleMode: ScheduleMode
  onScheduleModeChange: (v: ScheduleMode) => void
  scheduleDate: string
  onScheduleDateChange: (v: string) => void
  scheduleTime: string
  onScheduleTimeChange: (v: string) => void
  repeatUnit: RepeatUnit
  onRepeatUnitChange: (v: RepeatUnit) => void
  repeatCount: number
  onRepeatCountChange: (v: number) => void
  readOnly?: boolean
}

export function ScheduleSection({
  timing,
  onTimingChange,
  scheduleMode,
  onScheduleModeChange,
  scheduleDate,
  onScheduleDateChange,
  scheduleTime,
  onScheduleTimeChange,
  repeatUnit,
  onRepeatUnitChange,
  repeatCount,
  onRepeatCountChange,
  readOnly = false,
}: Props) {
  const countOptions = repeatCountOptions(repeatUnit)
  const unitLabel = repeatUnitLabel(repeatUnit, repeatCount)

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>When to Send</h2>
        </div>
      </div>

      <div className="settings-radio-group">
        <label className="settings-radio">
          <input
            type="radio"
            name="broadcastTiming"
            checked={timing === 'now'}
            disabled={readOnly}
            onChange={() => onTimingChange('now')}
          />
          <span>Send Now</span>
        </label>
        <label className="settings-radio">
          <input
            type="radio"
            name="broadcastTiming"
            checked={timing === 'later'}
            disabled={readOnly}
            onChange={() => onTimingChange('later')}
          />
          <span>Schedule Later</span>
        </label>
      </div>

      {timing === 'later' ? (
        <div className="schedule-mode-block">
          <div className="settings-radio-group">
            <label className="settings-radio">
              <input
                type="radio"
                name="scheduleMode"
                checked={scheduleMode === 'datetime'}
                disabled={readOnly}
                onChange={() => onScheduleModeChange('datetime')}
              />
              <span>Date/Time</span>
            </label>
            <label className="settings-radio">
              <input
                type="radio"
                name="scheduleMode"
                checked={scheduleMode === 'rule'}
                disabled={readOnly}
                onChange={() => onScheduleModeChange('rule')}
              />
              <span>Rule</span>
            </label>
          </div>

          {scheduleMode === 'datetime' ? (
            <div className="modal-field-row">
              <label className="modal-field">
                <span>Schedule Date</span>
                <input
                  type="date"
                  value={scheduleDate}
                  disabled={readOnly}
                  onChange={(e) => onScheduleDateChange(e.target.value)}
                />
              </label>
              <label className="modal-field">
                <span>Schedule Time</span>
                <input
                  type="time"
                  value={scheduleTime}
                  disabled={readOnly}
                  onChange={(e) => onScheduleTimeChange(e.target.value)}
                />
              </label>
            </div>
          ) : (
            <>
              <div className="modal-field-row">
                <label className="modal-field">
                  <span>Repeat Based On</span>
                  <select
                    value={repeatUnit}
                    disabled={readOnly}
                    onChange={(e) => {
                      const unit = e.target.value as RepeatUnit
                      onRepeatUnitChange(unit)
                      onRepeatCountChange(1)
                    }}
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </label>
                <label className="modal-field">
                  <span>Count</span>
                  <select
                    value={repeatCount}
                    disabled={readOnly}
                    onChange={(e) =>
                      onRepeatCountChange(Number(e.target.value))
                    }
                  >
                    {countOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="info-banner">
                <Icon name="info" />
                <span>
                  This broadcast will be sent after {repeatCount} {unitLabel}{' '}
                  from each user&apos;s Program Activation Date.
                </span>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}
