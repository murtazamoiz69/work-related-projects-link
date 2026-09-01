# Settings API

Covers the **Settings** page (the signed-in user's own settings). All under
`/me`. See [README.md](./README.md) for conventions.

## Page functionality
- Notification preferences (toggles, saved immediately).
- Security: change password; two-factor toggle.
- Practice details (name, timezone, working hours).
- Profile (name/email/avatar) — **not yet an endpoint**, see the note at the end.

---

## `GET /me/notification-preferences`
**Success `200`**
```json
{ "email": true, "push": true, "chatAlerts": true, "weekly": false, "twoFactor": false }
```
| Field | Type | Notes |
| --- | --- | --- |
| email | boolean | Daily email digest. |
| push | boolean | Browser push alerts. |
| chatAlerts | boolean | Chat hand-off alerts. |
| weekly | boolean | Weekly summary report. |
| twoFactor | boolean | Two-factor auth (toggled from the Security section). |

**Errors:** `401`; `500`.

## `PUT /me/notification-preferences`
Replace the full preferences object.

**Request body:** the full object above (all five booleans).
**Success `200`** — the updated object.
> The frontend updates optimistically (toggle flips instantly, rolls back on
> error). Return the saved object.
**Errors:** `401`; `422`; `500`.

---

## `GET /me/practice`
**Success `200`**
```json
{ "name": "Nourish with Nourish AI", "timezone": "America/New_York", "workingHours": "9-5" }
```
| Field | Type | Notes |
| --- | --- | --- |
| name | string | Practice name (shown on user-facing reports). |
| timezone | string | IANA tz. Client offers: `America/New_York`, `America/Chicago`, `America/Denver`, `America/Los_Angeles`. |
| workingHours | string | Client offers: `9-5`, `8-4`, `10-6`. |

**Errors:** `401`; `500`.

## `PUT /me/practice`
Replace practice details.

**Request body:** the full object above.
**Success `200`** — the updated object.
**Errors**
| Status | When | Body |
| --- | --- | --- |
| 422 | Empty `name` | `{ "message": "Practice details could not be saved.", "fields": { "name": "Practice name is required." } }` |
| 401 / 500 | — | |

---

## `PUT /me/password`
Change the signed-in user's password.

**Request body**
```json
{ "currentPassword": "•••", "newPassword": "••••••••" }
```
| Field | Type | Rules |
| --- | --- | --- |
| currentPassword | string | required; must match the stored password. |
| newPassword | string | required; **≥ 8 chars** (client also enforces a confirm field that isn't sent). |

**Success `200`**
```json
{ "ok": true }
```
**Errors**
| Status | When | Body |
| --- | --- | --- |
| 401 | Wrong current password | `{ "message": "Your current password is incorrect.", "fields": { "currentPassword": "Incorrect." } }` |
| 422 | Weak/missing new password | `{ "message": "…", "fields": { "currentPassword": "…" } }` |

> The frontend validates length + match client-side; the server should still
> verify the current password and re-check length. Field errors keyed
> `currentPassword` are mapped onto that field.

---

## Profile — NOT yet an API
The **Profile** section (name, role, email, phone, bio, avatar colour) currently
edits the **session profile in the client only** (it is not persisted to a
backend). It belongs with auth/identity. When productionised, expose:
- `GET /me/profile` → the user profile (hydrates the session user from [auth.md](./auth.md)).
- `PUT /me/profile` → update it.

Shape (matches the login `user` + phone/bio):
```json
{ "name": "Sarah Nolan", "role": "Nutritionist", "email": "sarah@nourishwithsim.com",
  "phone": "(555) 123-4567", "bio": "…", "initials": "SN", "color": "#2F5D50" }
```
Flag if you want this in the first backend cut and we'll wire it.
