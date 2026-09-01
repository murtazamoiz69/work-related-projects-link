// Shared API contract primitives — the transport-agnostic shapes every
// feature's `api/` layer speaks, so error handling, pagination, and result
// typing stay consistent across the app. See docs/api-guidelines.md.

/** Every failure the UI must be able to branch on, normalized from whatever
 *  the transport produced (an HTTP status, an aborted fetch, an offline
 *  network). Feature code inspects `kind`, never a raw status code. */
export type ApiErrorKind =
  | 'validation' // 422 — field-level problems
  | 'unauthorized' // 401 — not signed in / token expired
  | 'forbidden' // 403 — signed in, but not allowed
  | 'not-found' // 404
  | 'conflict' // 409 — duplicate email, concurrent edit, …
  | 'server' // 5xx
  | 'network' // no response — offline / DNS / CORS
  | 'timeout' // request aborted on its time budget
  | 'unknown'

/** Field-level validation messages, keyed by request field name. */
export type FieldErrors = Record<string, string>

/** The single error shape the whole app catches and renders. */
export type ApiError = {
  kind: ApiErrorKind
  message: string
  /** HTTP status when there was a response (absent for network/timeout). */
  status?: number
  /** Present when `kind === 'validation'`. */
  fields?: FieldErrors
}

/** Standard envelope for paginated list endpoints. */
export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** Narrow a caught `unknown` to `ApiError` (transport rejects with this shape). */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'message' in value
  )
}
