import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { normalizeError } from './errors'

/** Build an AxiosError carrying a response body, the way the transport throws. */
function axiosResponse(status: number, data: unknown): AxiosError {
  const err = new AxiosError('request failed', 'ERR_BAD_RESPONSE')
  // Minimal response shape normalizeError reads.
  err.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: {} as never,
  }
  return err
}

describe('normalizeError — FastAPI shapes', () => {
  it('maps a validation detail array to field errors', () => {
    const e = normalizeError(
      axiosResponse(422, {
        detail: [
          {
            loc: ['body', 'email'],
            msg: 'value is not a valid email address',
            type: 'value_error',
          },
          {
            loc: ['body', 'weeks'],
            msg: 'Input should be greater than 0',
            type: 'greater_than',
          },
        ],
      }),
    )
    expect(e.kind).toBe('validation')
    expect(e.fields).toEqual({
      email: 'value is not a valid email address',
      weeks: 'Input should be greater than 0',
    })
  })

  it('takes the last string segment of a nested loc as the field name', () => {
    const e = normalizeError(
      axiosResponse(422, {
        detail: [
          {
            loc: ['body', 'users', 0, 'email'],
            msg: 'required',
            type: 'missing',
          },
        ],
      }),
    )
    expect(e.fields).toEqual({ email: 'required' })
  })

  it('uses a string detail as the message (e.g. a raised HTTPException)', () => {
    const e = normalizeError(
      axiosResponse(404, { detail: 'Client not found.' }),
    )
    expect(e.kind).toBe('not-found')
    expect(e.message).toBe('Client not found.')
  })

  it('surfaces a single validation message when there is one', () => {
    const e = normalizeError(
      axiosResponse(422, {
        detail: [
          {
            loc: ['body', 'email'],
            msg: 'A user with this email already exists.',
          },
        ],
      }),
    )
    expect(e.message).toBe('A user with this email already exists.')
    expect(e.fields).toEqual({
      email: 'A user with this email already exists.',
    })
  })

  it('still honours our own { message, fields } shape', () => {
    const e = normalizeError(
      axiosResponse(422, {
        message: 'The user could not be added.',
        fields: { email: 'Taken.' },
      }),
    )
    expect(e.message).toBe('The user could not be added.')
    expect(e.fields).toEqual({ email: 'Taken.' })
  })

  it('maps status codes with no body to a kind + default message', () => {
    expect(normalizeError(axiosResponse(401, null)).kind).toBe('unauthorized')
    expect(normalizeError(axiosResponse(500, null)).kind).toBe('server')
  })
})
