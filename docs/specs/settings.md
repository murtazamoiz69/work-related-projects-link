# Page: Settings

## Route
`/settings`

## Purpose
Let the signed-in user manage their own profile, notification preferences, security, and practice details, and log out.

## User Role
Authenticated (Nutritionist + Super Admin). Edits the **active profile** (shared with the app-shell profile chip via the auth store).

## UI Sections
- **Settings nav**: Profile / Notifications / Security / Practice Details + **Log Out**.
- **Profile** panel: avatar + colour swatches, name, role, email, phone, bio.
- **Notifications** panel: toggle list (email, push, chat hand-off alerts, weekly summary).
- **Security** panel: change password + two-factor toggle.
- **Practice Details** panel: practice name, timezone, working hours.
- Per-section "Saved" indicators.

## Components
`SettingsPage`, `Avatar`, `Icon`, native inputs + toggles.

## User Actions
- **Switch** section.
- **Edit + Save** profile (name/role/email/phone/bio/colour).
- **Toggle** each notification preference (persisted immediately).
- **Change password** (current/new/confirm).
- **Toggle** two-factor.
- **Edit + Save** practice details.
- **Log Out** → clears session, navigates to `/login`.

## Data Requirements
**Server Data**
- Profile: `name, role, email, phone, bio, initials, color`.
- Notification prefs: `email, push, chatAlerts, weekly, twoFactor`.
- Practice details: `name, timezone, workingHours`.

**Client State**
- Active `section`, form field values, saved-pill flags, password fields + hint.

**URL State**
- Optional: `?section=profile|notifications|security|practice`.

## API Requirements
> All `PROPOSED`. Today: profile via auth store; prefs/practice via localStorage.

1. `GET` / `PUT` `/me/profile` `PROPOSED` — body `{ name, role, email, phone, bio, color }` → updated profile.
2. `GET` / `PUT` `/me/notification-preferences` `PROPOSED` — body `{ email, push, chatAlerts, weekly }` → updated prefs.
3. `PUT` `/me/password` `PROPOSED` — body `{ currentPassword, newPassword }` → `{ ok: true }`. Errors: `401` wrong current password, `422` weak/mismatch.
4. `PATCH` `/me/two-factor` `PROPOSED` — body `{ enabled: boolean }`.
5. `GET` / `PUT` `/me/practice` `PROPOSED` — body `{ name, timezone, workingHours }`.
   - Errors (all): `401`, `422`, `500`, network. Mutations show a "Saved" indicator / toast.

## Forms
**Profile**

| Field | Type | Req | Validation |
| --- | --- | --- | --- |
| name | string | ✅ | non-empty (falls back to previous if blank) |
| role | string | ✅ | non-empty |
| email | string | ✅ | valid email |
| phone | string | ❌ | phone format (lenient) |
| bio | string | ❌ | max length |
| color | enum (swatch) | ✅ | one of the pool |

**Security (password)**

| Field | Type | Req | Validation |
| --- | --- | --- | --- |
| currentPassword | string | ✅ | present |
| newPassword | string | ✅ | ≥ 8 chars |
| confirmPassword | string | ✅ | equals newPassword |

- **Dependent fields:** `confirmPassword` must equal `newPassword`; all three required together.
- **Submit:** PUT; on success clear fields + toast; on error inline hint (wrong current / weak / mismatch).

**Practice** — name (required), timezone (enum), workingHours (enum). Save → toast + "Saved".
**Notifications** — each toggle persists immediately (no explicit save), flashing "Saved".

## Loading States
Initial fetch of profile/prefs/practice → section skeletons. Save buttons show pending state.

## Empty States
None (always has a current profile). New/blank optional fields render as empty inputs with placeholders.

## Error States
- Save failures → inline hint + toast; fields retained.
- Password: wrong current password (401), weak/mismatch (422) → specific inline messages.

## Permissions
Authenticated; a user edits only their own profile. (Practice details may be Super-Admin-only in future.)

## Performance Considerations
Minimal. Small forms; no lists/charts. Persist toggles optimistically.

## Accessibility
- Every input has a `<label>`; toggles are labelled switches with descriptions.
- Section nav items are buttons with an active state; Log Out is clearly distinguished (danger).
- Password hint text is associated and announced; error vs. success styled and conveyed non-colour-only.

## Mock Data
```json
{
  "profile": { "name": "Sarah Nolan", "role": "Nutritionist",
    "email": "sarah@nourishwithsim.com", "phone": "", "bio": "", "initials": "SN", "color": "#2F5D50" },
  "notificationPreferences": { "email": true, "push": true, "chatAlerts": true, "weekly": false, "twoFactor": false },
  "practice": { "name": "Nourish with Nourish AI", "timezone": "America/New_York", "workingHours": "9-5" }
}
```

## Acceptance Criteria
- Editing and saving the profile updates the app-shell chip and shows "Saved" + toast.
- Toggling a notification preference persists immediately and flashes "Saved".
- Password change requires all three fields, enforces ≥8 chars and match, clears on success, and shows specific errors otherwise.
- Saving practice details persists and confirms.
- Log Out clears the session and redirects to `/login`.
- Switching sections preserves unsaved edits within the session view (or clearly discards on section change — define one behavior and test it).
