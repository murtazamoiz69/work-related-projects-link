import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn } from '@/features/clients'
import type { Template } from '../../types'

export function VersionHistoryModal({
  template,
  onClose,
}: {
  template: Template
  onClose: () => void
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card">
        <div className="modal-head">
          <h3>Version History — {template.title}</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <ul className="timeline">
          {[...template.versionHistory].reverse().map((v, i) => (
            <li key={i} className="timeline-item">
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
      </div>
    </div>
  )
}
