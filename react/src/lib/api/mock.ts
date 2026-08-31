// Mock transport harness — lets each feature's `api/` layer resolve or reject
// exactly like the real network will, so the frontend can be built and tested
// before any backend exists. When MSW + a real transport land (see
// docs/api-guidelines.md), the `*.api.ts` files swap their internals from these
// helpers to real requests without changing their signatures or any caller.
import type { ApiError, ApiErrorKind, FieldErrors } from './types'

const DEFAULT_MIN_MS = 200
const DEFAULT_MAX_MS = 600

type DelayOpts = { minMs?: number; maxMs?: number }

function delay({
  minMs = DEFAULT_MIN_MS,
  maxMs = DEFAULT_MAX_MS,
}: DelayOpts = {}) {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** Resolve with `data` after a realistic network delay. */
export async function mockOk<T>(data: T, opts?: DelayOpts): Promise<T> {
  await delay(opts)
  return data
}

// Status codes for the kinds that correspond to an HTTP response. `network`,
// `timeout`, and `unknown` intentionally have none — a real failed request of
// those kinds never produced a response to read a status from.
const STATUS_BY_KIND: Partial<Record<ApiErrorKind, number>> = {
  validation: 422,
  unauthorized: 401,
  forbidden: 403,
  'not-found': 404,
  conflict: 409,
  server: 500,
}

type MockErrorOpts = DelayOpts & { fields?: FieldErrors }

/** Reject with a normalized `ApiError` after a delay. Callers `return` this
 *  from an async function; its `Promise<never>` is assignable to any result. */
export async function mockError(
  kind: ApiErrorKind,
  message: string,
  opts?: MockErrorOpts,
): Promise<never> {
  await delay(opts)
  const error: ApiError = {
    kind,
    message,
    status: STATUS_BY_KIND[kind],
    fields: opts?.fields,
  }
  throw error
}

/** Force a rejection with no delay — handy in unit tests. */
export function makeApiError(
  kind: ApiErrorKind,
  message: string,
  fields?: FieldErrors,
): ApiError {
  return { kind, message, status: STATUS_BY_KIND[kind], fields }
}
