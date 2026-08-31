import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/molecules/Modal'
import { apiErrorMessage } from '@/lib/api/errors'
import { isApiError } from '@/lib/api/types'
import { showToast } from '@/lib/toast'
import type { Client } from '../types'
import { formatFullDate, formatPeriodDate } from '../utils'
import { useExtendClientExpiry } from '../hooks/useClientMutations'
import {
  EXTEND_OPTIONS,
  makeExtendProgramSchema,
  type ExtendOption,
  type ExtendProgramForm,
} from '../schemas/extendProgram.schema'

const QUICK_LABELS: Record<ExtendOption, string> = {
  '7': '+7 days',
  '14': '+14 days',
  '30': '+30 days',
  '90': '+3 months',
  custom: 'Custom',
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(d: Date, months: number): Date {
  const next = new Date(d)
  next.setMonth(next.getMonth() + months)
  return next
}

export function ExtendProgramModal({
  client,
  onClose,
}: {
  client: Client
  onClose: () => void
}) {
  const schema = useMemo(
    () => makeExtendProgramSchema(client.expiryDate),
    [client.expiryDate],
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ExtendProgramForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      option: '30',
      customDate: toInputDate(addDays(client.expiryDate, 30)),
    },
  })

  const option = watch('option')
  const customDate = watch('customDate')

  const newExpiry = useMemo(() => {
    switch (option) {
      case '7':
        return addDays(client.expiryDate, 7)
      case '14':
        return addDays(client.expiryDate, 14)
      case '30':
        return addDays(client.expiryDate, 30)
      case '90':
        return addMonths(client.expiryDate, 3)
      case 'custom': {
        const parsed = new Date(`${customDate}T00:00:00`)
        return Number.isNaN(parsed.getTime()) ? client.expiryDate : parsed
      }
      default:
        return client.expiryDate
    }
  }, [option, customDate, client.expiryDate])

  const extend = useExtendClientExpiry()

  const onSubmit = (values: ExtendProgramForm) => {
    void values
    extend.mutate(
      { id: client.id, expiryDate: newExpiry.toISOString() },
      {
        onSuccess: () => onClose(),
        onError: (error) => {
          if (isApiError(error) && error.fields?.expiryDate) {
            setValue('option', 'custom')
            setError('customDate', { message: error.fields.expiryDate })
          } else {
            showToast(apiErrorMessage(error))
          }
        },
      },
    )
  }

  return (
    <Modal
      title="Extend program"
      onClose={onClose}
      footer={
        <>
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit(onSubmit)}
            disabled={extend.isPending}
          >
            {extend.isPending ? 'Extending…' : 'Extend program'}
          </button>
        </>
      }
    >
      <p className="extend-modal-name">{client.name}</p>

      <div className="extend-modal-current">
        <span className="extend-modal-label">Current program expiry</span>
        <span className="extend-modal-value">
          {formatFullDate(client.expiryDate)}
        </span>
      </div>

      <div className="modal-field">
        <span>Extend by</span>
        <div className="extend-quick-options">
          {EXTEND_OPTIONS.map((key) => (
            <button
              key={key}
              type="button"
              className={`extend-quick-btn${option === key ? ' active' : ''}`}
              onClick={() => setValue('option', key, { shouldValidate: true })}
            >
              {QUICK_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {option === 'custom' ? (
        <label className="modal-field">
          <span>New expiry date</span>
          <input type="date" {...register('customDate')} />
          {errors.customDate ? (
            <span className="settings-hint is-error">
              {errors.customDate.message}
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="extend-result-row">
        <div>
          <div className="extend-modal-label">New expiry</div>
          <div className="extend-result-value">{formatFullDate(newExpiry)}</div>
        </div>
        <div className="extend-result-dates">
          Program period
          <br />
          {formatPeriodDate(client.expiryDate)} → {formatPeriodDate(newExpiry)}
        </div>
      </div>
    </Modal>
  )
}
