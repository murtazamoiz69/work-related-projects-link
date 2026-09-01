# Auth API

Covers the **Login** page and session lifecycle. See [README.md](./README.md)
for shared conventions (auth header, error format, dates).

## Page functionality
- Sign in with email + password (+ "remember me").
- On success: the frontend stores the access token and the user profile, then
  redirects to the originally requested page (or the dashboard).
- Invalid credentials show an inline "Invalid email or password." error.
- "Forgot password" requests a reset link for the entered email.
- A **401 from any endpoint** logs the user out and returns them here.

---

## `POST /auth/login`
Authenticate and issue an access token.

**Request body**
```json
{ "email": "sarah@nourishwithsim.com", "password": "•••••••", "rememberMe": true }
```
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| email | string | ✅ | |
| password | string | ✅ | |
| rememberMe | boolean | ✅ | If true, token should be long-lived; if false, session-only. (Frontend stores it either way today; honour server-side session length.) |

**Success `200`**
```json
{
  "token": "…jwt…",
  "refreshToken": "…",
  "user": {
    "id": "u-sarah",
    "name": "Sarah Nolan",
    "role": "Nutritionist",
    "email": "sarah@nourishwithsim.com",
    "initials": "SN",
    "color": "#2F5D50"
  }
}
```
| Field | Type | Notes |
| --- | --- | --- |
| token | string | Sent as `Authorization: Bearer <token>` on every subsequent request. |
| refreshToken | string | Not yet used by the client; include for forward-compat. |
| user.role | string | Drives client authorization. Current roles: `"Nutritionist"`, `"Super Admin"`. **Must also be enforced server-side** on role-gated endpoints. |
| user.initials / color | string | For the avatar chip; server may compute or store them. |

**Errors**
| Status | When | Body |
| --- | --- | --- |
| 401 | Unknown email or wrong password | `{ "message": "Invalid email or password." }` |
| 422 | Malformed body (missing email/password) | `{ "message": "...", "fields": { "email": "…" } }` |
| 429 | Rate limited | `{ "message": "Too many attempts. Try again shortly." }` |

> Mock behaviour today: two demo accounts (`sarah@nourishwithsim.com` →
> Nutritionist, `alex@nourishwithsim.com` → Super Admin); any non-empty password
> is accepted; unknown emails → 401.

---

## `POST /auth/forgot-password`
Request a password-reset link.

**Request body**
```json
{ "email": "sarah@nourishwithsim.com" }
```

**Success `200`**
```json
{ "ok": true }
```
> Return a **generic 200 regardless of whether the email exists** (avoid account
> enumeration). The frontend shows "Password reset link sent to <email>".

**Errors:** `422` invalid email; `429` rate limited.

---

## Session behaviour the backend must support
- **401 semantics:** any endpoint returning 401 triggers client logout + redirect
  to `/login`. Return 401 for missing/expired/invalid tokens (not 403).
- **Token refresh:** not implemented client-side yet. If you add refresh-token
  rotation, expose `POST /auth/refresh`; we'll wire it into the client's HTTP
  layer (single place, `lib/api/client.ts`).

## Related / not in this doc
- The **user profile edited in Settings → Profile** is currently client-only and
  not persisted. When productionised it should become `GET`/`PUT /me/profile`
  and hydrate the session user. See [settings.md](./settings.md).
