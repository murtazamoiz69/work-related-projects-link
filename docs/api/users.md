# Users (Clients) API

Covers the **Users** page (labelled "Users" in the UI; the resource is
`clients`). See [README.md](./README.md) for conventions.

## Page functionality
- A paginated roster of users with **server-side** search, status filter, and
  plan-expiry filter; default sort is soonest-expiring first.
- Summary cards (total / active / expiring-soon / expired).
- Per-row actions: enable/disable program access (with confirm), extend the
  program to a new expiry, open the user's chat, open their plan.

All filtering, sorting, and pagination are **server-side** and reflected in the
URL, so a filtered view is shareable/reloadable.

---

## `GET /clients`
Filtered, sorted, paginated roster.

**Query params**
| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| search | string | — | Matches name, email, program, diet, and goals (case-insensitive substring). |
| status | `all` \| `active` \| `disabled` | `all` | `active` = access enabled; `disabled` = access disabled. |
| expiry | `all` \| `expiring-soon` \| `expired` \| `active` | `all` | Tiers by days-until-expiry: `expired` < 0; `expiring-soon` 0–14; `active` > 14. |
| page | integer (1-based) | 1 | |
| pageSize | integer | 12 | |
| sort | string | `expiry:asc` | Default orders soonest-expiring first. |

**Success `200`** — paginated envelope of `Client`:
```json
{
  "items": [
    {
      "id": "c-1",
      "name": "Priya Sharma",
      "initials": "PS",
      "color": "#C44F3F",
      "age": 34,
      "gender": "Female",
      "email": "priya.sharma@email.com",
      "program": "Weight Loss",
      "plan": "12-Week Weight Loss Kickstart",
      "status": "attention",
      "accessEnabled": true,
      "expiryDate": "2026-08-29T00:00:00.000Z",
      "adherence": 42,
      "checkInDays": 4,
      "joinDate": "2026-05-05T00:00:00.000Z",
      "goals": ["Lose fat", "Build discipline"],
      "diet": "Low carb",
      "conversationId": "c-1"
    }
  ],
  "total": 48, "page": 1, "pageSize": 12
}
```

**`Client` fields**
| Field | Type | Notes |
| --- | --- | --- |
| id | string | |
| name, initials, color | string | `color` is a hex avatar colour. |
| age | number | |
| gender | `"Female"` \| `"Male"` | |
| email | string | |
| program | string | Program name (e.g. "Weight Loss"). |
| plan | string | Plan name derived from the program. |
| status | `"active"` \| `"attention"` \| `"paused"` \| `"new"` | Engagement status (distinct from access). |
| accessEnabled | boolean | Program access on/off (the toggle). |
| expiryDate | ISO date | Drives the expiry column + tiering. |
| adherence | number \| **null** | 0–100; `null` for brand-new users with no data. |
| checkInDays | number \| **null** | Days since last check-in; `null` when unknown/paused. |
| joinDate | ISO date | |
| goals | string[] | |
| diet | string | |
| conversationId | string | The user's chat conversation. The UI opens chat / "at a glance" by this id; the client must not resolve it from any other resource. |

**Errors:** `401`; `500`.

---

## `GET /clients/summary`
Counts for the summary cards (over the **whole roster**, not the current page).

**Success `200`**
```json
{ "total": 48, "active": 45, "disabled": 3, "expiringSoon": 6, "expired": 4 }
```
| Field | Meaning |
| --- | --- |
| total | All users. |
| active / disabled | By `accessEnabled`. |
| expiringSoon | days-until-expiry in 0–14. |
| expired | days-until-expiry < 0. |

**Errors:** `401`; `500`.

---

## `PATCH /clients/:id/access`
Enable or disable a user's program access.

**Request body**
```json
{ "enabled": false }
```
**Success `200`** — the updated `Client` (same shape as above).
**Errors:** `401`; `403`; `404` `{ "message": "User not found." }`; `500`.

---

## `PATCH /clients/:id/expiry`
Extend (or change) a user's program expiry.

**Request body**
```json
{ "expiryDate": "2026-12-01T00:00:00.000Z" }
```
| Field | Type | Rules |
| --- | --- | --- |
| expiryDate | ISO date | Must be a **valid future date**. Recommend also enforcing "after the current expiry". |

**Success `200`** — the updated `Client`.
**Errors**
| Status | When | Body |
| --- | --- | --- |
| 422 | Missing/invalid/past date | `{ "message": "The program could not be extended.", "fields": { "expiryDate": "Expiry must be a valid date in the future." } }` |
| 404 | Unknown id | `{ "message": "User not found." }` |
| 401 / 403 / 500 | — | |

---

## `GET /clients/:id/detail`
The user's **"At a glance"** profile — the derived program-tracker view shown in
the Client 360 profile, the Chat "Program progress" modal, and the Plan
Workspace header. All adherence/journey/summary numbers are **backend-computed**
(like the dashboard); the client only renders them.

**Success `200`** — `ClientDetail`:
```json
{
  "heightCm": 170, "weightKg": 78, "targetWeightKg": 68,
  "bmi": "27.0", "activityLevel": "Moderately active", "weeklyCommitment": 4,
  "allergies": ["Peanuts"], "medicalConditions": [],
  "notes": [{ "author": "Sim", "text": "…", "days": 3, "attachment": null }],
  "timeline": [{ "text": "Joined the program", "days": 120 }],
  "aiSummary": ["…", "…", "…"],
  "programs": [
    {
      "id": "p-1", "name": "12-Week Weight Loss", "phase": "Cutting",
      "goal": "Lose fat", "coach": "Sim", "totalWeeks": 12, "currentWeek": 6,
      "startDate": "2026-07-03T18:30:00.000Z",
      "endDate": "2026-09-25T18:30:00.000Z",
      "status": "active", "weeksLogged": 5, "consistency": 83, "streak": 3,
      "startWeight": 82, "latestWeight": 78, "weightChange": -4, "waistChange": -3,
      "weeks": [
        {
          "week": 1, "date": "2026-07-03T18:30:00.000Z", "status": "done",
          "submitted": true, "weightKg": 82,
          "measurements": { "chest": 100, "waist": 90, "hips": 104 },
          "photos": { "front": true, "side": true, "back": false },
          "dietPct": 90, "workoutPct": 85, "coachNote": "Strong start."
        }
      ]
    }
  ]
}
```
Nested dates are ISO strings on the wire (`programs[].startDate`/`endDate`,
`programs[].weeks[].date`); the client maps them to `Date`. `consistency`,
`weightKg`, `measurements`, `photos`, `coachNote`, and the weight deltas are
nullable (no data yet). `photos` slot values are `true`/`false` or a photo URL.

**Errors:** `401`; `404` `{ "message": "User not found." }`; `500`.

---

## Not an API (this page)
- **Open chat / Manage plan** — client-side navigation to `/chat?c=<conversationId>`
  using the client's `conversationId` field (above). See [chat.md](./chat.md).
- **Call / Email** buttons — UI stubs (no request).
