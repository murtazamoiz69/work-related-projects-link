import { Icon } from '@/components/atoms/Icon'
import type { Template } from '@/features/templates'

type Props = {
  title: string
  onTitleChange: (v: string) => void
  templates: Template[]
  templateId: string
  onTemplateIdChange: (v: string) => void
  onCreateTemplate: () => void
  readOnly?: boolean
}

export function BroadcastDetailsSection({
  title,
  onTitleChange,
  templates,
  templateId,
  onTemplateIdChange,
  onCreateTemplate,
  readOnly = false,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Broadcast Details</h2>
        </div>
      </div>
      <label className="modal-field">
        <span>
          Broadcast Title <span className="field-required">*</span>
        </span>
        <input
          type="text"
          value={title}
          placeholder="e.g. New Program Launch"
          disabled={readOnly}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </label>
      <div className="modal-field-row">
        <label className="modal-field broadcast-template-field">
          <span>Template</span>
          <select
            value={templateId}
            disabled={readOnly}
            onChange={(e) => onTemplateIdChange(e.target.value)}
          >
            <option value="">Select a template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        {readOnly ? null : (
          <div className="modal-field">
            <span>&nbsp;</span>
            <button
              type="button"
              className="icon-btn"
              title="Create a new template"
              onClick={onCreateTemplate}
            >
              <Icon name="plus" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
