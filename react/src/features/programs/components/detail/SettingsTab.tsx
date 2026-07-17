import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn } from '@/features/clients'
import { showToast } from '@/lib/toast'
import { PROGRAM_STATUS_LABEL } from '../../data'
import type { ProgramStatus, TrainingProgram } from '../../types'

const VISIBILITY_OPTIONS: ProgramStatus[] = ['draft', 'published', 'archived']

export function SettingsTab({
  program: p,
  onStatusChange,
  onDuplicate,
  onDelete,
}: {
  program: TrainingProgram
  onStatusChange: (status: ProgramStatus) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="split-row split-row-alt ov-split">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Visibility</h2>
            <p className="panel-sub">
              Controls whether clients can be assigned to this program
            </p>
          </div>
        </div>
        <div className="settings-radio-group">
          {VISIBILITY_OPTIONS.map((s) => (
            <label className="settings-radio" key={s}>
              <input
                type="radio"
                name="pdVisibility"
                value={s}
                checked={p.status === s}
                onChange={() => onStatusChange(s)}
              />
              <span>{PROGRAM_STATUS_LABEL[s]}</span>
            </label>
          ))}
        </div>

        <div className="panel-head" style={{ marginTop: 22 }}>
          <div>
            <h2>Coach Collaboration</h2>
          </div>
        </div>
        <div className="profile-card-row" style={{ marginBottom: 0 }}>
          <Avatar initials="SN" color="#2F5D50" size="sm" />
          <div>
            <span className="profile-card-name">{p.coach}</span>
            <span className="profile-card-sub">Owner</span>
          </div>
        </div>
        <button
          className="link-btn"
          style={{ marginTop: 12 }}
          onClick={() => showToast('Collaborator invites coming soon')}
        >
          <Icon name="user-plus" />
          Add collaborator
        </button>

        <div className="panel-head" style={{ marginTop: 22 }}>
          <div>
            <h2>Import / Export</h2>
          </div>
        </div>
        <div className="qa-grid">
          <button
            className="qa-btn"
            onClick={() => showToast(`Exporting “${p.name}”…`)}
          >
            <Icon name="download" />
            <span>Export Program</span>
          </button>
          <button
            className="qa-btn"
            onClick={() => showToast('Import flow coming soon')}
          >
            <Icon name="upload" />
            <span>Import Program</span>
          </button>
        </div>
      </div>

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
                  style={{ background: '#5B7FA6' }}
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
    </div>
  )
}
