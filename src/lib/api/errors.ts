// Centralized error normalization — turns whatever the transport threw (an
// axios error with a response, an aborted request, an offline network) into the
// single `ApiError` shape the whole app branches on. This is the ONLY place
// HTTP status codes are interpreted. See docs/api-guidelines.md.
import { AxiosError } from 'axios'
import type { ApiError, ApiErrorKind, FieldErrors } from './types'
import { isApiError } from './types'

function kindForStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status >= 500) return 'server'
  return 'unknown'
}

const DEFAULT_MESSAGE: Record<ApiErrorKind, string> = {
  validation: 'Please check the highlighted fields and try again.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: "You don't have permission to do that.",
  'not-found': 'We couldn’t find what you were looking for.',
  conflict: 'That action conflicts with the current state. Please refresh.',
  server: 'Something went wrong on our end. Please try again.',
  network: 'Could not reach the server. Check your connection and retry.',
  timeout: 'The request took too long. Please try again.',
  unknown: 'Something went wrong. Please try again.',
}

type FastApiDetailItem = { loc?: unknown[]; msg?: string; type?: string }

type ErrorBody = {
  message?: string
  fields?: FieldErrors
  errors?: FieldErrors
  // FastAPI (the real backend) puts errors here: a string for a raised
  // HTTPException, or an array of {loc, msg} for request validation.
  detail?: string | FastApiDetailItem[]
}

/** Turn FastAPI's validation `detail` array into our `{ fieldName: message }`
 *  map. `loc` is a path like `["body", "email"]` or `["body", "users", 0,
 *  "email"]`; the field is the last string segment past the body/query/path
 *  wrapper, so the form can attach the message to the right input. */
function fieldsFromDetail(
  detail: FastApiDetailItem[],
): FieldErrors | undefined {
  const out: FieldErrors = {}
  for (const item of detail) {
    const loc = item?.loc
    const msg = item?.msg
    if (!Array.isArray(loc) || typeof msg !== 'string') continue
    const key = [...loc]
      .reverse()
      .find(
        (seg): seg is string =>
          typeof seg === 'string' && !['body', 'query', 'path'].includes(seg),
      )
    if (key && !(key in out)) out[key] = msg
  }
  return Object.keys(out).length ? out : undefined
}

export function normalizeError(error: unknown): ApiError {
  // Already normalized (e.g. re-thrown up the stack) — pass through.
  if (isApiError(error)) return error

  if (error instanceof AxiosError) {
    const { response, code } = error

    if (response) {
      const kind = kindForStatus(response.status)
      const body = (response.data ?? {}) as ErrorBody

      // Our own mock/backends answer with { message, fields }; a FastAPI
      // backend answers with { detail }. Support both, preferring an explicit
      // message/fields when present.
      const detail = body.detail
      let message = body.message
      let fields =
        kind === 'validation' ? (body.fields ?? body.errors) : undefined
      if (typeof detail === 'string') {
        message = message ?? detail
      } else if (Array.isArray(detail)) {
        if (kind === 'validation' && !fields) fields = fieldsFromDetail(detail)
        if (
          !message &&
          detail.length === 1 &&
          typeof detail[0]?.msg === 'string'
        ) {
          message = detail[0].msg
        }
      }

      return {
        kind,
        message: message ?? DEFAULT_MESSAGE[kind],
        status: response.status,
        fields,
      }
    }

    // No response — the request never completed.
    const kind: ApiErrorKind = code === 'ECONNABORTED' ? 'timeout' : 'network'
    return { kind, message: DEFAULT_MESSAGE[kind] }
  }

  return { kind: 'unknown', message: DEFAULT_MESSAGE.unknown }
}

/** A user-facing message for any caught value — safe to hand straight to a toast. */
export function apiErrorMessage(error: unknown): string {
  return normalizeError(error).message
}
