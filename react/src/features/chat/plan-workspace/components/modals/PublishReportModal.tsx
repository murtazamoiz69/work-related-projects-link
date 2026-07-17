import { Icon } from '@/components/atoms/Icon'
import { showToast } from '@/lib/toast'
import {
  autoFixDietConflicts,
  autoFixWorkoutConflicts,
  pushVersion,
  validatePlan,
} from '../../plan'
import { PwModalShell } from './PwModalShell'
import type { ClinicalProfile, PwWarning, Workspace } from '../../types'

function WarnItem({ w }: { w: PwWarning }) {
  return (
    <li className={`pw-guard-item ${w.level}`}>
      <Icon name={w.level === 'hard' ? 'shield-alert' : 'alert-triangle'} />
      <div>
        <span>{w.text}</span>
        <span className="pw-guard-fix">Suggested fix: {w.fix}</span>
      </div>
    </li>
  )
}

export function PublishReportModal({
  ws,
  profile,
  refresh,
  onClose,
}: {
  ws: Workspace
  profile: ClinicalProfile
  refresh: () => void
  onClose: () => void
}) {
  const warnings = validatePlan(profile, ws)
  const hard = warnings.filter((w) => w.level === 'hard')
  const soft = warnings.filter((w) => w.level === 'soft')
  const canPublish = hard.length === 0

  const autofix = () => {
    autoFixDietConflicts(ws, profile)
    autoFixWorkoutConflicts(ws, profile)
    refresh()
  }
  const publish = () => {
    ws.published = true
    pushVersion(ws, 'Published to client', 'Sarah Nolan', `Plan published to ${profile.name}`)
    showToast(`Plan published to ${profile.name}`)
    refresh()
    onClose()
  }

  return (
    <PwModalShell
      title="Safety check & publish"
      onClose={onClose}
      cardClassName="pw-guard-modal"
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" disabled={!canPublish} onClick={publish}>
            <Icon name="send" />
            {canPublish ? 'Publish to Client' : 'Resolve blockers first'}
          </button>
        </>
      }
    >
      {!warnings.length ? (
        <div className="pw-guard-clear">
          <Icon name="shield-check" />
          <p>All safety checks passed. This plan is clear to publish to {profile.name}.</p>
        </div>
      ) : (
        <>
          {hard.length ? (
            <div className="pw-guard-block">
              <Icon name="octagon-x" />
              {hard.length} blocking issue{hard.length > 1 ? 's' : ''} must be fixed before publishing.
            </div>
          ) : null}
          {hard.length ? (
            <>
              <span className="pw-sub-label">Blocking</span>
              <ul className="pw-guard-list">
                {hard.map((w, i) => (
                  <WarnItem key={`h-${i}`} w={w} />
                ))}
              </ul>
            </>
          ) : null}
          {soft.length ? (
            <>
              <span className="pw-sub-label">Warnings</span>
              <ul className="pw-guard-list">
                {soft.map((w, i) => (
                  <WarnItem key={`s-${i}`} w={w} />
                ))}
              </ul>
            </>
          ) : null}
          {hard.length ? (
            <button className="btn-secondary sm pw-guard-autofix" onClick={autofix}>
              <Icon name="wand-2" />
              Auto-fix all blocking issues
            </button>
          ) : null}
        </>
      )}
    </PwModalShell>
  )
}
