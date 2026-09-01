import { useEffect, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { Backdrop } from '@/components/molecules/Backdrop'

export function SaveTemplateModal({
  dayCount,
  onClose,
  onSave,
}: {
  dayCount: number
  onClose: () => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a template name.')
      return
    }
    onSave(trimmed)
  }

  return (
    <Backdrop className="modal-overlay pw-modal-overlay" onClose={onClose}>
      <div className="modal-card">
        <div className="modal-head">
          <h3>Save Meal Template</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          <label className="modal-field">
            <span>Template Name</span>
            <input
              type="text"
              placeholder="Enter template name"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
            />
          </label>
          {error ? <p className="modal-field-error">{error}</p> : null}
          <p className="pw-muted">
            {dayCount} day{dayCount > 1 ? 's' : ''} selected — meals, timings,
            calories, and macros will be saved to your Template Library.
          </p>
        </div>
        <div className="modal-foot">
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            Save Template
          </button>
        </div>
      </div>
    </Backdrop>
  )
}
