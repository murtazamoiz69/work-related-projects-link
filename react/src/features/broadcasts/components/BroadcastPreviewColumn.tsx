import { Icon } from '@/components/atoms/Icon'
import { highlightTemplateVariables } from '@/features/templates'
import type { Template } from '@/features/templates'

type Props = {
  template: Template | null
}

export function BroadcastPreviewColumn({ template }: Props) {
  return (
    <div className="broadcast-preview-col">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Preview</h2>
            <p className="panel-sub">How this message will look to a user</p>
          </div>
        </div>
        {template ? (
          <div className="tpl-preview-broadcast-frame">
            <div className="tpl-preview-body tpl-preview-broadcast-body">
              <span className="tpl-meta-chip">{template.category}</span>
              <h4>{template.title}</h4>
              <div
                className="tpl-preview-content"
                dangerouslySetInnerHTML={{
                  __html: highlightTemplateVariables(template.content),
                }}
              />
            </div>
          </div>
        ) : (
          <div className="tpl-picker-empty-preview" style={{ minHeight: 220 }}>
            <Icon name="mouse-pointer-click" />
            <span>Select a template to preview</span>
          </div>
        )}
      </section>
    </div>
  )
}
