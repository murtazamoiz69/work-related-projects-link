# Page: Login

## Route
`/login` (public; redirects to `/` if already authenticated). Accepts `?redirect=<href>`.

## Purpose
Authenticate a nutritionist / super-admin into the dashboard and route them to their intended destination.

## User Role
Public / unauthenticated. An already-authenticated user hitting `/login` is redirected to `/`.

## UI Sections
- Decorative background (blobs + grid).
- Brand block (mark + name).
- Heading + subtitle ("Welcome back").
- Credential form: email, password (with show/hide), remember-me, forgot-password link.
- Inline error line.
- Demo-credentials hint.

## Components
`LoginPage`, `Icon`, native inputs via `react-hook-form` + `zodResolver`.

## User Actions
- Enter email / password.
- Toggle password visibility.
- Toggle "Remember me".
- **Submit** (Sign In).
- **Forgot password** (validates email is present, then confirms a reset link was sent).

## Data Requirements
**Server Data**
- Authenticated user profile + token (on successful login).

**Client State**
- `showPassword`, `submitting`, form field values (rhf), field errors.

**URL State**
- `redirect` — post-login destination (already implemented).

## API Requirements
> All `PROPOSED`. Current app fakes login (any password sets a session flag).

1. **Login** — `POST` `/auth/login` `PROPOSED`
   - Body: `{ "email": string, "password": string, "rememberMe": boolean }`
   - Response `200`: `{ "token": string, "refreshToken": string, "user": { "id": string, "name": string, "role": "Nutritionist" | "Super Admin", "email": string, "initials": string, "color": string } }`
   - Errors: `401` invalid credentials; `422` validation; `429` rate limited; network/timeout.
2. **Forgot password** — `POST` `/auth/forgot-password` `PROPOSED`
   - Body: `{ "email": string }`
   - Response `200`: `{ "ok": true }` (always generic, to avoid account enumeration)
   - Errors: `422` invalid email; `429`; network.

## Forms
**Sign-in form**

| Field | Type | Req | Validation | Notes |
| --- | --- | --- | --- | --- |
| email | string | ✅ | valid email | default prefilled in demo |
| password | string | ✅ | min length (demo: 4; **production: raise to ≥8**) | show/hide toggle |
| rememberMe | boolean | ❌ | — | affects token persistence |

- **Dependent fields:** Forgot-password requires a valid `email` first.
- **Submit:** disable button, show "Signing in…"; on success persist token + navigate to `redirect ?? '/'`.
- **Success:** redirect to intended page.
- **Error:** inline message (invalid credentials / validation); keep the form populated.

## Loading States
Submit button pending state ("Signing in…", disabled).

## Empty States
None.

## Error States
Invalid credentials (401), field validation, rate limit (429), network failure — all surfaced inline; never a blank/hung form.

## Permissions
None (public). The redirect-if-authed guard already exists.

## Performance Considerations
Trivial. Auth page CSS scoped via a body class. No lists/charts.

## Accessibility
- Labels on both inputs; password toggle has a state-aware `aria-label`.
- Error text associated with the form and announced.
- Full keyboard operation; visible focus.
- `autoComplete` set (`username` / `current-password`).

## Mock Data
```json
{
  "token": "mock.jwt.token",
  "refreshToken": "mock.refresh.token",
  "user": {
    "id": "u-1",
    "name": "Sarah Nolan",
    "role": "Nutritionist",
    "email": "sarah@nourishwithsim.com",
    "initials": "SN",
    "color": "#2F5D50"
  }
}
```

## Acceptance Criteria
- Valid credentials → user is authenticated and lands on `redirect` (or `/`).
- Invalid credentials → an inline error appears; no navigation; fields retained.
- Submitting is blocked while a request is in flight (no double-submit).
- Visiting `/login` while authenticated redirects to `/`.
- Forgot-password with an empty/invalid email shows a prompt to enter it first; with a valid email shows a generic confirmation.
- Password field defaults hidden; toggle reveals/hides and updates its `aria-label`.
