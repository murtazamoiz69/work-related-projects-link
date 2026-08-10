import { useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { newPollOption } from '../../data'
import type { PollContent, PollOptionType } from '../../types'

const MAX_QUESTION_LENGTH = 500
const MAX_OPTIONS = 10

const OPTION_TYPES: {
  value: PollOptionType
  icon: string
  title: string
  description: string
}[] = [
  {
    value: 'single',
    icon: 'list',
    title: 'Single Choice',
    description: 'Users can select only one option.',
  },
  {
    value: 'multiple',
    icon: 'check-square',
    title: 'Multiple Choice',
    description: 'Users can select more than one option.',
  },
  {
    value: 'text',
    icon: 'type',
    title: 'Text Box',
    description: 'Users can type their answer in a text box.',
  },
  {
    value: 'rating',
    icon: 'star',
    title: 'Star Rating',
    description: 'Users can rate by selecting stars.',
  },
]

const OPTION_TYPE_LABEL: Record<PollOptionType, string> = {
  single: 'Single Choice',
  multiple: 'Multiple Choice',
  text: 'Text Box',
  rating: 'Star Rating',
}

type Props = {
  poll: PollContent
  onChange: (updater: (prev: PollContent) => PollContent) => void
  onDirty: () => void
}

export function PollPreview({ poll }: { poll: PollContent }) {
  const question = poll.question.trim() || 'Your poll question will appear here'
  return (
    <div className="poll-preview-card">
      <span className="poll-preview-question">{question}</span>
      {poll.optionType === 'text' ? (
        <input
          className="notes-input"
          disabled
          placeholder="Users type their answer here…"
        />
      ) : poll.optionType === 'rating' ? (
        <div className="poll-preview-stars">
          {Array.from({ length: 5 }, (_, i) => (
            <Icon key={i} name="star" />
          ))}
        </div>
      ) : (
        <div className="poll-preview-choices">
          {poll.options.map((o) => (
            <label className="poll-preview-choice" key={o.id}>
              <span
                className={`poll-preview-input ${poll.optionType === 'multiple' ? 'is-checkbox' : 'is-radio'}`}
              />
              {o.text.trim() || 'Option'}
            </label>
          ))}
        </div>
      )}
      <button className="btn-secondary full" disabled>
        Vote
      </button>
    </div>
  )
}

export function PollEditor({ poll, onChange, onDirty }: Props) {
  const [previewOpen, setPreviewOpen] = useState(true)

  const update = (updater: (prev: PollContent) => PollContent) => {
    onChange(updater)
    onDirty()
  }

  const setQuestion = (question: string) =>
    update((p) => ({ ...p, question: question.slice(0, MAX_QUESTION_LENGTH) }))
  const setOptionType = (optionType: PollOptionType) =>
    update((p) => ({ ...p, optionType }))
  const setOptionText = (id: string, text: string) =>
    update((p) => ({
      ...p,
      options: p.options.map((o) => (o.id === id ? { ...o, text } : o)),
    }))
  const addOption = () =>
    update((p) => ({ ...p, options: [...p.options, newPollOption()] }))
  const removeOption = (id: string) =>
    update((p) => ({ ...p, options: p.options.filter((o) => o.id !== id) }))

  const showOptionsList =
    poll.optionType === 'single' || poll.optionType === 'multiple'

  return (
    <div className="panel tpl-editor-panel">
      <div className="drawer-section-head">
        <h4>
          <Icon name="bar-chart-2" />
          Poll Content
        </h4>
        <p className="panel-sub">
          Create your poll question and configure the options.
        </p>
      </div>

      <div className="poll-editor-grid">
        <div className="poll-editor-col">
          <label className="modal-field">
            <span>1. Poll Question</span>
            <textarea
              className="notes-input"
              rows={3}
              value={poll.question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <span className="poll-char-count">
              {poll.question.length} / {MAX_QUESTION_LENGTH}
            </span>
          </label>

          <div className="modal-field">
            <span>2. Option Type</span>
            <p className="panel-sub">Choose how users will answer this poll.</p>
            <div className="option-type-list">
              {OPTION_TYPES.map((ot) => (
                <button
                  type="button"
                  key={ot.value}
                  className={`option-type-card${poll.optionType === ot.value ? ' selected' : ''}`}
                  onClick={() => setOptionType(ot.value)}
                >
                  <span className="option-type-radio" />
                  <Icon name={ot.icon} />
                  <span className="option-type-copy">
                    <span className="option-type-title">{ot.title}</span>
                    <span className="option-type-desc">{ot.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="poll-editor-col">
          <div className="modal-field">
            <div className="poll-options-head">
              <span>
                {showOptionsList
                  ? `3. Options (for ${OPTION_TYPE_LABEL[poll.optionType]})`
                  : '3. Options'}
              </span>
              <button
                type="button"
                className="link-btn"
                onClick={() => setPreviewOpen((o) => !o)}
              >
                <Icon name={previewOpen ? 'eye-off' : 'eye'} />
                Preview
              </button>
            </div>

            {showOptionsList ? (
              <>
                {poll.options.map((o, i) => (
                  <div className="poll-option-row" key={o.id}>
                    <Icon name="grip-vertical" className="poll-option-grip" />
                    <span className="poll-option-index">{i + 1}</span>
                    <input
                      className="notes-input"
                      value={o.text}
                      placeholder={`Option ${i + 1}`}
                      onChange={(e) => setOptionText(o.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-btn sm danger"
                      title="Remove option"
                      onClick={() => removeOption(o.id)}
                    >
                      <Icon name="trash-2" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="link-btn"
                  onClick={addOption}
                  disabled={poll.options.length >= MAX_OPTIONS}
                >
                  <Icon name="plus" />
                  Add Option
                </button>
                <p className="poll-options-help">
                  You can add up to {MAX_OPTIONS} options.
                </p>
              </>
            ) : (
              <p className="chat-mini-card-text">
                {poll.optionType === 'text'
                  ? 'Users will type a free-text answer — no options needed.'
                  : 'Users will rate using stars (1–5) — no options needed.'}
              </p>
            )}
          </div>

          {previewOpen ? (
            <div className="poll-preview">
              <span className="detail-chip-label">Preview</span>
              <PollPreview poll={poll} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
