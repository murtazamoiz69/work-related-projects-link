import { useState } from 'react'
import { Modal } from '@/components/molecules/Modal'
import { showToast } from '@/lib/toast'
import type { Nutritionist } from '../types'

export type NutritionistFormValues = {
  name: string
  email: string
  qualification: string
  experienceYears: number
}

// Shared by "Add nutritionist" (nutritionist: null) and the row's Edit
// action (nutritionist: existing record) — same fields, same viewport
// pop-up, just a different title/submit label and initial values.
export function NutritionistFormModal({
  nutritionist,
  onClose,
  onSave,
}: {
  nutritionist: Nutritionist | null
  onClose: () => void
  onSave: (values: NutritionistFormValues) => void
}) {
  const isEdit = nutritionist !== null
  const [name, setName] = useState(nutritionist?.name ?? '')
  const [email, setEmail] = useState(nutritionist?.email ?? '')
  const [qualification, setQualification] = useState(
    nutritionist?.qualification ?? '',
  )
  const [experience, setExperience] = useState(
    nutritionist ? String(nutritionist.experienceYears) : '',
  )

  const save = () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedQualification = qualification.trim()
    if (!trimmedName || !trimmedEmail || !trimmedQualification) {
      showToast('Name, email and qualification are required')
      return
    }
    onSave({
      name: trimmedName,
      email: trimmedEmail,
      qualification: trimmedQualification,
      experienceYears: Math.max(0, Math.round(Number(experience) || 0)),
    })
    onClose()
    showToast(isEdit ? `${trimmedName} updated` : `${trimmedName} added`)
  }

  return (
    <Modal
      title={isEdit ? 'Edit nutritionist' : 'Add nutritionist'}
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save}>
            {isEdit ? 'Save changes' : 'Add nutritionist'}
          </button>
        </>
      }
    >
      <label className="modal-field">
        <span>Full name</span>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="modal-field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="modal-field">
        <span>Qualification</span>
        <input
          type="text"
          placeholder="e.g. Registered Dietitian"
          value={qualification}
          onChange={(e) => setQualification(e.target.value)}
        />
      </label>
      <label className="modal-field">
        <span>Experience (years)</span>
        <input
          type="number"
          min={0}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        />
      </label>
    </Modal>
  )
}
