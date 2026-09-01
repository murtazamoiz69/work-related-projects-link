// Auth token seam — the single place the API client reads/writes the access
// token, so real auth can be dropped in later without touching features.
// Demo mode never sets a token, so the client's Authorization header is simply
// omitted; nothing else needs to know. See docs/api-guidelines.md.
const ACCESS_TOKEN_KEY = 'nws.accessToken'

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token)
    else localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    /* storage unavailable — nothing to persist */
  }
}

// --- Unauthorized (401) seam ---
// The HTTP client can't import the router/store without a cycle, so it notifies
// through this callback. The app registers a handler (main.tsx) that logs out
// and redirects to /login.
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn
}

export function notifyUnauthorized(): void {
  unauthorizedHandler?.()
}
