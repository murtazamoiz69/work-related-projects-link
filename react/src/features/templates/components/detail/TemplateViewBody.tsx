import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn } from '@/features/clients'
import {
  extractTemplateVariables,
  highlightTemplateVariables,
} from '../../data'
import type { Template } from '../../types'
import { PollPreview } from './PollEditor'

export function TemplateViewBody({ template: t }: { template: Template }) {
  const vars = extractTemplateVariables(t.content)
  return (
    <div className="split-row split-row-alt ov-split">
      <div className="panel">
        {t.templateType === 'poll' ? (
          <>
            <div className="panel-head">
              <div>
                <h2>Poll</h2>
                <p className="panel-sub">
                  How this poll appears when sent to a user
                </p>
              </div>
            </div>
            <PollPreview poll={t.poll} />
          </>
        ) : (
          <>
            <div className="panel-head">
              <div>
                <h2>Content</h2>
                <p className="panel-sub">
                  Variables highlight as chips until they&apos;re filled in and
                  sent
                </p>
              </div>
            </div>
            <div
              className="tpl-content-display"
              dangerouslySetInnerHTML={{
                __html: highlightTemplateVariables(t.content),
              }}
            />
            <div className="drawer-section-head" style={{ marginTop: 18 }}>
              <h4>
                <Icon name="braces" />
                Variables Used
              </h4>
            </div>
            <div className="detail-chip-row">
              {vars.length ? (
                vars.map((v) => (
                  <span key={v} className="client-tag client-tag-diet">
                    {v}
                  </span>
                ))
              ) : (
                <span className="chat-mini-card-text" style={{ margin: 0 }}>
                  No variables used
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent Uses</h2>
          </div>
        </div>
        {t.recentUses.length ? (
          <ul className="timeline">
            {t.recentUses.slice(0, 8).map((u, i) => (
              <li key={i} className="timeline-item">
                <span
                  className="avatar avatar-xs"
                  style={{
                    background:
                      u.context === 'broadcast'
                        ? 'var(--purple)'
                        : 'var(--blue)',
                  }}
                >
                  <Icon
                    name={
                      u.context === 'broadcast'
                        ? 'megaphone'
                        : u.context === 'chat'
                          ? 'message-circle'
                          : 'clipboard-copy'
                    }
                  />
                </span>
                <div className="timeline-body">
                  <p>
                    {u.clientName}{' '}
                    <span
                      className="tag-flag"
                      style={{
                        background: 'var(--surface-alt)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {u.context}
                    </span>
                  </p>
                  <span className="timeline-time">{formatCheckIn(u.days)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="checklist-rest">
            <Icon name="inbox" />
            <span>Not used yet</span>
          </div>
        )}
      </div>
    </div>
  )
}
