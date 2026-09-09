import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/molecules/Modal'
import { apiErrorMessage } from '@/lib/api/errors'
import { isApiError } from '@/lib/api/types'
import { showToast } from '@/lib/toast'
import {
  PHONE_COUNTRY_CODE,
  PHONE_NATIONAL_DIGITS,
  formatPhone,
} from '@/features/clients/schemas/addClient.schema'
import type { Nutritionist } from '../types'
import {
  useCreateNutritionist,
  useUpdateNutritionist,
} from '../hooks/useNutritionistMutations'
import {
  nutritionistFormSchema,
  type NutritionistFormValues,
} from '../schemas/nutritionistForm.schema'

// Shared by "Add nutritionist" (nutritionist: null) and the row's Edit action.
// Same fields, same viewport pop-up — just a different title/submit label,
// initial values, and which mutation runs.
export function NutritionistFormModal({
  nutritionist,
  onClose,
}: {
  nutritionist: Nutritionist | null
  onClose: () => void
}) {
  const isEdit = nutritionist !== null

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NutritionistFormValues>({
    resolver: zodResolver(nutritionistFormSchema),
    defaultValues: {
      name: nutritionist?.name ?? '',
      email: nutritionist?.email ?? '',
      phone: nutritionist?.phone ?? '',
      qualification: nutritionist?.qualification ?? '',
      experienceYears: nutritionist?.experienceYears ?? 0,
    },
  })

  const create = useCreateNutritionist()
  const update = useUpdateNutritionist()
  const pending = create.isPending || update.isPending

  const applyServerError = (error: unknown) => {
    if (isApiError(error) && error.fields) {
      for (const [field, message] of Object.entries(error.fields)) {
        if (
          field === 'name' ||
          field === 'email' ||
          field === 'qualification'
        ) {
          setError(field, { message })
        }
      }
      if (
        !error.fields.name &&
        !error.fields.email &&
        !error.fields.qualification
      ) {
        showToast(apiErrorMessage(error))
      }
    } else {
      showToast(apiErrorMessage(error))
    }
  }

  const onSubmit = (raw: NutritionistFormValues) => {
    // One canonical +91 form, whatever spacing was typed.
    const values = { ...raw, phone: formatPhone(raw.phone) }
    if (isEdit && nutritionist) {
      update.mutate(
        { id: nutritionist.id, body: values },
        { onSuccess: () => onClose(), onError: applyServerError },
      )
    } else {
      create.mutate(values, {
        onSuccess: () => onClose(),
        onError: applyServerError,
      })
    }
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
          <button
            className="btn-primary"
            onClick={handleSubmit(onSubmit)}
            disabled={pending}
          >
            {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add nutritionist'}
          </button>
        </>
      }
    >
      <label className="modal-field">
        <span>Full name</span>
        <input type="text" autoFocus {...register('name')} />
        {errors.name ? (
          <span className="settings-hint is-error" role="alert">
            {errors.name.message}
          </span>
        ) : null}
      </label>
      <label className="modal-field">
        <span>Email</span>
        <input type="email" {...register('email')} />
        {errors.email ? (
          <span className="settings-hint is-error" role="alert">
            {errors.email.message}
          </span>
        ) : null}
      </label>
      <label className="modal-field">
        <span>Phone number</span>
        {/* Same fixed +91 prefix as the user form, so one number format is
            stored across the platform. */}
        <div className="phone-field">
          <span className="phone-prefix" aria-hidden="true">
            {PHONE_COUNTRY_CODE}
          </span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={PHONE_NATIONAL_DIGITS}
            placeholder="98765 43210"
            aria-label={`Phone number, ${PHONE_COUNTRY_CODE}`}
            {...register('phone')}
          />
        </div>
        {errors.phone ? (
          <span className="settings-hint is-error" role="alert">
            {errors.phone.message}
          </span>
        ) : null}
      </label>
      <label className="modal-field">
        <span>Qualification</span>
        <input
          type="text"
          placeholder="e.g. Registered Dietitian"
          {...register('qualification')}
        />
        {errors.qualification ? (
          <span className="settings-hint is-error" role="alert">
            {errors.qualification.message}
          </span>
        ) : null}
      </label>
      <label className="modal-field">
        <span>Experience (years)</span>
        <input
          type="number"
          min={0}
          {...register('experienceYears', { valueAsNumber: true })}
        />
        {errors.experienceYears ? (
          <span className="settings-hint is-error" role="alert">
            {errors.experienceYears.message}
          </span>
        ) : null}
      </label>
    </Modal>
  )
}
