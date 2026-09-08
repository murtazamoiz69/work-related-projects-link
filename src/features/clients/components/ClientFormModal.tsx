import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/molecules/Modal'
import { apiErrorMessage } from '@/lib/api/errors'
import { isApiError } from '@/lib/api/types'
import { showToast } from '@/lib/toast'
import { useClientProgramsQuery } from '../hooks/useClientsQuery'
import { useCreateClient } from '../hooks/useClientMutations'
import {
  DEFAULT_PROGRAM_WEEKS,
  NAME_MAX_LENGTH,
  PHONE_COUNTRY_CODE,
  PHONE_NATIONAL_DIGITS,
  addClientSchema,
  formatPhone,
  type AddClientValues,
} from '../schemas/addClient.schema'

const FIELDS = ['name', 'email', 'phone', 'program', 'weeks'] as const

/** "Add individually" — the form the nutritionist fills in for one user at a
 * time. Deliberately only the five fields the product ask named (name, email,
 * phone, plan, weeks); everything else the roster expects on a Client is
 * filled in by the backend at creation, so a new user shows up with `status:
 * 'new'` and no adherence history rather than with invented data. */
export function ClientFormModal({ onClose }: { onClose: () => void }) {
  const programsQuery = useClientProgramsQuery()
  const programs = programsQuery.data ?? []
  const create = useCreateClient()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AddClientValues>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      program: '',
      weeks: DEFAULT_PROGRAM_WEEKS,
    },
  })

  // The server owns the rules the form can't know on its own — chiefly whether
  // the email is already taken — so its `fields` land on the inputs they name,
  // and anything unmapped still reaches the user as a toast.
  const applyServerError = (error: unknown) => {
    if (isApiError(error) && error.fields) {
      const mapped = FIELDS.filter((f) => error.fields?.[f])
      for (const field of mapped) {
        setError(field, { message: error.fields[field] })
      }
      if (!mapped.length) showToast(apiErrorMessage(error))
    } else {
      showToast(apiErrorMessage(error))
    }
  }

  const onSubmit = (values: AddClientValues) => {
    // Normalise the number to one canonical +91 form before it is stored,
    // whatever spacing was typed.
    create.mutate(
      { ...values, phone: formatPhone(values.phone) },
      {
        onSuccess: () => onClose(),
        onError: applyServerError,
      },
    )
  }

  return (
    <Modal
      title="Add user"
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit(onSubmit)}
            disabled={create.isPending}
          >
            {create.isPending ? 'Adding…' : 'Add user'}
          </button>
        </>
      }
    >
      <label className="modal-field">
        <span>Full name</span>
        {/* Capped in the field as well as the schema, so the limit is felt
            while typing rather than only on submit. Same 50 as the app. */}
        <input
          type="text"
          autoFocus
          maxLength={NAME_MAX_LENGTH}
          placeholder="e.g. Jordan Lee"
          {...register('name')}
        />
        {errors.name ? (
          <span className="settings-hint is-error" role="alert">
            {errors.name.message}
          </span>
        ) : null}
      </label>
      <label className="modal-field">
        <span>Email</span>
        <input
          type="email"
          placeholder="jordan.lee@email.com"
          {...register('email')}
        />
        {errors.email ? (
          <span className="settings-hint is-error" role="alert">
            {errors.email.message}
          </span>
        ) : null}
      </label>
      <label className="modal-field">
        <span>Phone number</span>
        {/* The country code is fixed, not typed: users are Indian, so the
            field asks only for the 10 national digits. */}
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
      <div className="modal-field-row">
        <label className="modal-field">
          <span>Plan</span>
          <select disabled={programsQuery.isPending} {...register('program')}>
            <option value="">
              {programsQuery.isPending ? 'Loading plans…' : 'Select a plan'}
            </option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.program ? (
            <span className="settings-hint is-error" role="alert">
              {errors.program.message}
            </span>
          ) : programsQuery.isError ? (
            <span className="settings-hint is-error" role="alert">
              {apiErrorMessage(programsQuery.error)}
            </span>
          ) : null}
        </label>
        <label className="modal-field">
          <span>Weeks</span>
          <input
            type="number"
            min={1}
            {...register('weeks', { valueAsNumber: true })}
          />
          {errors.weeks ? (
            <span className="settings-hint is-error" role="alert">
              {errors.weeks.message}
            </span>
          ) : null}
        </label>
      </div>
    </Modal>
  )
}
