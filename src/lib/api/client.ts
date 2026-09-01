// The centralized HTTP client — the ONLY module that speaks axios. Feature
// `api/*.api.ts` files call these typed helpers; components never do. Base URL,
// auth header, timeout, cancellation, and error normalization all live here so
// they stay consistent. Swapping mock ⇄ real backend happens at the transport
// (MSW) layer, invisible to callers. See docs/api-guidelines.md.
import axios, { type AxiosRequestConfig } from 'axios'
import { env } from './env'
import { getAccessToken, notifyUnauthorized, setAccessToken } from './auth'
import { normalizeError } from './errors'

const TIMEOUT_MS = 15_000

const instance = axios.create({
  baseURL: env.apiUrl,
  timeout: TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the bearer token when there is one (demo mode has none, so this
// no-ops and the header is simply omitted).
instance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

// Normalize every failure to `ApiError`, and centralize the 401 side effect
// (clear the stale token). Route-level redirect is left to the auth phase —
// the UI already surfaces `kind: 'unauthorized'` to the user.
instance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeError(error)
    if (apiError.kind === 'unauthorized') {
      setAccessToken(null)
      notifyUnauthorized()
    }
    return Promise.reject(apiError)
  },
)

export type RequestConfig = {
  params?: Record<string, unknown>
  signal?: AbortSignal
  headers?: Record<string, string>
}

function toAxiosConfig(config?: RequestConfig): AxiosRequestConfig {
  return {
    params: config?.params,
    signal: config?.signal,
    headers: config?.headers,
  }
}

export async function get<T>(url: string, config?: RequestConfig): Promise<T> {
  const res = await instance.request<T>({
    ...toAxiosConfig(config),
    url,
    method: 'get',
  })
  return res.data
}

export async function post<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const res = await instance.request<T>({
    ...toAxiosConfig(config),
    url,
    method: 'post',
    data: body,
  })
  return res.data
}

export async function put<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const res = await instance.request<T>({
    ...toAxiosConfig(config),
    url,
    method: 'put',
    data: body,
  })
  return res.data
}

export async function patch<T>(
  url: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const res = await instance.request<T>({
    ...toAxiosConfig(config),
    url,
    method: 'patch',
    data: body,
  })
  return res.data
}

export async function del<T>(url: string, config?: RequestConfig): Promise<T> {
  const res = await instance.request<T>({
    ...toAxiosConfig(config),
    url,
    method: 'delete',
  })
  return res.data
}
