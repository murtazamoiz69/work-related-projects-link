import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn } from '@/features/clients'
import type { TrainingProgram } from '../../types'

export function SettingsTab({
  program: p,
  onDuplicate,
  onDelete,
}: {
  program: TrainingProgram
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2>Version History</h2>
        </div>
      </div>
      <ul className="timeline">
        {p.versionHistory
          .slice()
          .reverse()
          .map((v, i) => (
            <li className="timeline-item" key={i}>
              <span
                className="avatar avatar-xs"
                style={{ background: '#55789D' }}
              >
                <Icon name="git-branch" />
              </span>
              <div className="timeline-body">
                <p>
                  <strong>{v.version}</strong> — {v.text}
                </p>
                <span className="timeline-time">{formatCheckIn(v.days)}</span>
              </div>
            </li>
          ))}
      </ul>

      <div className="panel-head" style={{ marginTop: 22 }}>
        <div>
          <h2>Danger Zone</h2>
        </div>
      </div>
      <div className="qa-grid">
        <button className="qa-btn" onClick={onDuplicate}>
          <Icon name="copy" />
          <span>Duplicate Program</span>
        </button>
        <button className="qa-btn danger-qa" onClick={onDelete}>
          <Icon name="trash-2" />
          <span>Delete Program</span>
        </button>
      </div>
    </div>
  )
}
