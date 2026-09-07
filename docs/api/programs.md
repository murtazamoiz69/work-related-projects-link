# Program API

Covers the **Programs** page. There is a **single global program** (no
list/create/delete) — this page views/edits it and toggles its availability.
See [README.md](./README.md) for conventions.

## Backend wiring status (updated 2026-09-08)

> **Fully LIVE.** The Programs page calls the real `programs v1 web` backend for
> everything it needs (per-resource `VITE_LIVE_APIS` flags: `program`,
> `program-workout`, `program-diet`, `libraries`):
>
> | Endpoint | Status |
> | --- | --- |
> | `GET /program` | **Live** — response is `ProgramOverview` |
> | `PUT /program` | **Live** — body `ProgramDetailsPut` `{ name, description?, durationWeeks }`, returns `ProgramOverview` |
> | `PATCH /program/availability` | **Live** — body `{ enabled }`, returns `ProgramOverview` |
> | `GET`/`PUT`/`POST /program/workout-plan*` | **Live** — shapes match |
> | `GET`/`PUT`/`POST /program/diet-plan*` | **Live** — shapes match |
> | `GET /libraries/calorie-bands` | **Live** — drives the diet **Category** dropdown |
>
> The workout and diet plans are **free rich text**: each workout day and each
> diet sheet is a single HTML `body` string. There is no structured week / day /
> exercise / meal model on the program, and the UI resolves no exercise/meal
> ids (so `GET /libraries/{exercises,meals,workout-templates}` exist on the
> backend but are **not consumed**).
>
> The per-client plan endpoints (`/clients/:id/workout-plan*`,
> `/clients/:id/diet-plan*`, `/clients/:id/diet-band`, `/clients/:id/diet-review`)
> belong to the **Plan Workspace**, not this page, and stay on the mock for now
> (their consumers are mock Chat clients).
>
> All date fields on `ProgramOverview` are `createdAt` / `updatedAt` (ISO).

## Page functionality
- Load the program (name, description, duration, availability, enrolled count).
- Edit program details (name, description, timeline in weeks) — a modal.
- Toggle availability (Active/Disabled) — gated by a confirm dialog.
- **Autosave:** an edit persists the program details (`PUT /program`); the
  toggle is a `PATCH`. The UI shows a transient "Saved" indicator.

The **workout plan** and the **diet plan** are separate resources with their own
endpoints — see [Workout plan](#workout-plan) and [Diet plan](#diet-plan) below.
They are **not** part of the program payload.

---

## `GET /program`
Return the current global program.

**Success `200`**
```json
{
  "id": "prog-1",
  "name": "Diwali Glow",
  "description": "Six weeks to your brightest Diwali yet…",
  "durationWeeks": 6,
  "enabled": true,
  "enrolledCount": 10,
  "createdAt": "2026-01-05T00:00:00.000Z",
  "updatedAt": "2026-09-07T00:00:00.000Z"
}
```

**Field reference**
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Stable id of the one program. |
| name | string | Shown as the page title; required (see `PUT`). |
| description | string | Free text under the title. |
| durationWeeks | number | Programme length. Drives the **diet** tab's week rail. The **workout** plan is a flat run of days and does **not** derive its length from this. |
| enabled | boolean | Availability — the Active/Disabled toggle. |
| enrolledCount | number | Users enrolled — the overview's "N users enrolled". **Server-computed**; the client must not count another resource for it. |
| createdAt / updatedAt | ISO date | The only date fields. |

**Errors:** `401`; `500`. (`404` / empty is acceptable only if no program is
configured — the UI shows "No program configured yet".)

---

## `PUT /program`
Save the editable program details. Autosave sends this on a name / description /
timeline change.

**Request body** (`ProgramDetailsPut`)
```json
{ "name": "Diwali Glow", "description": "…", "durationWeeks": 6 }
```
Only these three fields are editable here (`description` is optional, defaults to
`""`). `enabled` is owned by `PATCH /program/availability`; `id`,
`enrolledCount`, and the timestamps are server-owned.

**Success `200`** — the updated program as `ProgramOverview` (same shape as
`GET`; the server stamps `updatedAt`). The client writes this straight into the
`['program']` cache.

**Errors**
| Status | When | Body |
| --- | --- | --- |
| 422 | Empty `name` (and any server validation) | `{ "message": "The program could not be saved.", "fields": { "name": "Program name is required." } }` |
| 401 / 500 | — | |

---

## `PATCH /program/availability`
Toggle availability.

**Request body**
```json
{ "enabled": false }
```
**Success `200`** — the updated program as `ProgramOverview` (same shape as
`GET /program`).

**Errors:** `401`; `500`.

---

## `GET /libraries/calorie-bands`
The daily-intake targets the diet plan is organised by — drives the diet tab's
**Category** dropdown.

**Success `200`**
```json
{ "bands": [1200, 1400, 1600, 1800, 2000] }
```
Read-only reference data; the client caches it for the session and falls back to
the built-in list while it loads or if it fails, so the dropdown never changes
shape. **Errors:** `401`; `500`.

---

# Workout plan

A flat, ordered run of **days** — Day 1, Day 2, … — not calendar weeks.
Programmes run different lengths and we don't know which weekday a user starts
on, so days are identified by number and the nutritionist adds days as far as
the programme needs. Each day is one rich-text session. No per-user filtering:
a user's day starts as the programme's day verbatim. See
[specs/programs.md](../specs/programs.md) › Workout plan for the product rules.

The UI: **Day tabs** across the top with an **Add day** button, one editor for
the active day, and a single **Save** that writes the day to the days the
nutritionist picks (this day, all days, or any set).

## `GET /program/workout-plan`
The whole run of days.

**Success `200`**
```json
{
  "updatedAt": "2026-09-03T…Z",
  "days": [
    { "dayNum": 1,
      "body": "<h2>Push Day</h2><h3>Main set</h3><ul><li><strong>Barbell Bench Press</strong> — 4 x 8 · 90s rest</li></ul>" },
    { "dayNum": 4, "body": "<ul><li>8,000 steps…</li></ul>" }
  ]
}
```
The day's coach-facing name lives inside `body` (an `<h2>`), since the day is
identified only by its number. A freshly added day is `{ "body": "" }`.

**Errors:** `401`; `500`.

---

## `PUT /program/workout-plan/days`
Save the edited day's `body` to one or more days at once — the single Save's
apply-to-days. Every day in `days` is set to the same `body` (a copy across).

**Body** `{ "body": "<h2>…</h2>", "days": [1, 3, 5] }`
**Success `200`** — the whole updated plan.
**Errors:** `422` `{ "fields": { "days": "Select one or more days." } }`; `401`;
`500`.

---

## `POST /program/workout-plan/add-day`
Append a blank day (empty `body`) at the end of the run.

**Body** none. **Success `200`** — the whole updated plan (one day longer).
**Errors:** `401`; `500`.

---

## `GET /clients/:id/workout-plan`
The user's copy of the run — the programme's days, each flagged `edited`.

**Success `200`** — the same shape as the programme plan, plus `clientId`; each
day carries `edited`: `false` while the user reads straight through to the
programme's day, `true` once a nutritionist has changed it for them. The day
count follows the programme (no per-user Add day).

## `PUT /clients/:id/workout-plan/days`
Same body as the programme equivalent. Sets `edited: true` on the written days
and leaves the programme untouched.

## `POST /clients/:id/workout-plan/reset`
Drop this user's edit for one day and go back to the programme's.
**Body** `{ "day": 3 }` **Success `200`** — the plan, with that day `edited: false`.

---

# Diet plan

The programme's diet is organised by **meal category** (a calorie band), not by
dish. See [specs/programs.md](../specs/programs.md) › Diet plan for the product
rules.

Categories: `1200 | 1400 | 1600 | 1800 | 2000` (kcal). The wire field is `band`;
the UI label is "Category", shown as the **top-tier tabs** — category, then
week, then the sheet.

The editor saves **explicitly** (no autosave). **Save** opens a week-picker
modal (This week / All weeks / any set — the same single-Save model as the
workout tab; the old inline "Copy to weeks" dropdown is gone), and one Save can
write the sheet to several weeks at once: the client PUTs the body to the first
chosen week, then calls `POST /program/diet-plan/duplicate` to fan it out to the
rest.

## `GET /program/diet-plan?week=&band=`
One master sheet.

**Success `200`**
```json
{ "weekNum": 1, "band": 1600, "body": "<h2>…</h2>", "updatedAt": "2026-09-03T…Z" }
```
`body` is the rich-text document (HTML) the nutritionist authored.

**Errors:** `422` `{ "message": "…", "fields": { "band": "Unknown calorie band." } }`; `404` unknown week; `401`; `500`.

---

## `PUT /program/diet-plan`
Save one week's master sheet — sent when the nutritionist confirms **Save** (and
once per chosen week when a Save targets several, alongside the duplicate call
below).

**Body** `{ "weekNum": 1, "band": 1600, "body": "<h2>…</h2>" }`
**Success `200`** — the saved sheet. **Errors:** `422` bad band; `401`; `500`.

---

## `POST /program/diet-plan/duplicate`
Copy one week's sheet onto other weeks. Backs the **Save → apply to weeks** flow
(the old standalone "Duplicate" button is gone); the client calls it after
saving the edited week so a single Save can land on many weeks.

**Body** `{ "fromWeek": 1, "band": 1600, "toWeeks": [2, 3, 5] }`

ASSUMPTION: **same band only** — the band is taken from the source rather than
accepted per target, because portions don't carry across bands. The source week
and anything out of range are ignored rather than erroring.

**Success `200`** `{ "band": 1600, "weeks": [2, 3, 5] }` — the weeks actually written.
**Errors:** `422` empty `toWeeks` or bad band; `401`; `500`.

---

## `GET /clients/:id/diet-plan?week=`
The user's own copy: the master sheet for their band, narrowed by their
onboarding answers.

**Success `200`**
```json
{
  "clientId": "c-14", "weekNum": 1,
  "profile": { "band": 1400, "lifeStage": "female", "conditions": ["PCOS"], "preference": "Eggitarian" },
  "body": "<h2>…</h2>",
  "edited": false,
  "appliedFilters": ["Eggitarian — 2 ingredient group(s) removed from the choices."],
  "updatedAt": "2026-09-03T…Z",
  "review": "in-review",
  "reviewedAt": null
}
```
| Field | Notes |
| --- | --- |
| edited | `true` once a nutritionist has hand-adjusted this copy; it then stops tracking the master sheet. |
| appliedFilters | What the engine did, shown to the nutritionist so the tailoring is legible. |
| review | `in-review` \| `reviewed` — the sign-off, mirrored from the client record onto every plan read. Carried here (rather than left on the client) because the surfaces that render a plan don't all hold a freshly fetched client. |
| reviewedAt | ISO, or `null` while in review. |

The engine only ever **removes or annotates** content already on the master
sheet — it never introduces food the master plan doesn't have.

**Errors:** `404` `{ "message": "This user has no diet profile yet." }`; `401`; `500`.

---

## `PUT /clients/:id/diet-plan?week=`
The nutritionist's own edit for one user and week. **Body** `{ "body": "<h2>…</h2>" }`
Sent on **Save**; a Save that targets several of the user's weeks sends this once
per chosen week (per-user plans have no duplicate endpoint).
**Success `200`** — the updated plan with `edited: true`. **Errors:** as above.

---

## `PATCH /clients/:id/diet-band`
Move a user to a different daily intake target.

**Body** `{ "band": 1800 }`
**Success `200`** — the updated `Client` (its `dietProfile.band` drives the
roster chip). Every week of their plan is re-derived from the new band's master
sheets, and **hand-edited weeks are dropped** — an edit written against 1400 kcal
portions doesn't hold at 1800. The sign-off is also reset to `in-review`: what
was reviewed is not what this user is on any more.

**Errors:** `422` bad band; `404` unknown user; `401`; `500`.

---

## `PATCH /clients/:id/diet-review`
Sign a user's filtered plan off, or send it back into review. Records only that
a person has read it — the plan itself is untouched.

**Body** `{ "status": "reviewed" }` (`reviewed` | `in-review`)
**Success `200`** — the updated `Client`, whose `dietReview` / `dietReviewedAt`
drive the roster chip and filter.

**Errors:** `422` `{ "fields": { "status": "Unknown review state." } }`;
`404` unknown user; `401`; `500`.
