# Program API

Covers the **Programs** page. There is a **single global program** (no
list/create/delete) — this page views/edits it and toggles its availability.
See [README.md](./README.md) for conventions.

## Backend wiring status (updated 2026-09-07)

> **This page is mock-only.** The real backend has **no program-content
> resource**: no `GET /program`, no workout-plan or diet-plan endpoints, no
> reference libraries. The only program data the real backend exposes is
> `GET /clients/programs` → `{ "programs": string[] }` — a list of program
> **names**, already live and used by the "Plan" dropdown in Add User.
> Everything else specified below is **PROPOSED** for the backend to build; the
> page runs entirely on MSW mocks today.
>
> **The dropdowns on this page are static code arrays, not backend values** —
> `goal` (`PROGRAM_GOALS`), `difficulty` (`PROGRAM_DIFFICULTIES`), meal slots
> (`MEAL_SLOTS`), the exercise library, and the workout-type chip all live in
> `src/features/programs/data.ts`. They can only become backend-driven once the
> backend adds the enum/library endpoints listed next.

### Endpoints the backend must add for this page
- `GET` + `PUT /program` — the single global program (overview + targets).
- `PATCH /program/availability` (or a field on `PUT /program`) — enable/disable.
- `GET` + `PUT /program/workout-plan`, `POST /program/workout-plan/add-day`.
- `GET` + `PUT /program/diet-plan`.
- `GET /libraries/exercises`, `GET /libraries/meals`, and option enums (goals,
  difficulties, workout types, meal slots) — so the dropdowns above stop being
  hardcoded.

## Page functionality
- Load the program (overview + nutrition targets).
- Edit program details (name, description, goal, difficulty, duration).
- Toggle availability (Active/Disabled) — gated by a confirm dialog.
- **Autosave:** a detail edit persists the whole program (a `PUT`). The UI shows
  a transient "Saved" indicator.

The **workout plan** and the **diet plan** are served by their own endpoints —
see [Workout plan](#workout-plan) and [Diet plan](#diet-plan) below. They are not
part of the program payload.

---

## `GET /program`
Return the current global program.

**Success `200`** — a `TrainingProgram`. Top-level shape:
```json
{
  "id": "prog-1",
  "name": "12-Week Fat Loss Reset",
  "description": "…",
  "goal": "Fat Loss",
  "difficulty": "Intermediate",
  "durationWeeks": 12,
  "coach": "Sarah Nolan",
  "enabled": true,
  "createdDate": "2026-01-05T00:00:00.000Z",
  "updatedDate": "2026-08-26T00:00:00.000Z",
  "version": "1.4",
  "members": [ /* ProgramMember[] — see below */ ],
  "enrolledCount": 48,
  "activeUsers": 48,
  "completionRate": 62,
  "nutritionTargets": { "calories": 2000, "protein": 160, "carbs": 180, "fat": 60, "water": 3 },
  "workoutWeeks": [ /* WorkoutWeek[] */ ],
  "dietWeeks": [ /* DietWeek[] */ ],
  "notes": [ { "author": "Sarah Nolan", "text": "…", "days": 3 } ],
  "activity": [ { "text": "…", "days": 2 } ],
  "versionHistory": [ { "version": "1.4", "text": "…", "days": 5 } ]
}
```

**Field reference**
| Field | Type | Notes |
| --- | --- | --- |
| goal | enum | `Fat Loss` \| `Muscle Gain` \| `Bulk` \| `PCOS` \| `Diabetes` \| `General Fitness` |
| difficulty | enum | `Beginner` \| `Intermediate` \| `Advanced` |
| durationWeeks | number | Number of weeks; `workoutWeeks`/`dietWeeks` length should match. |
| enabled | boolean | Availability (the toggle). |
| createdDate / updatedDate | ISO date | Only date fields at top level. |
| nutritionTargets | object | `{ calories, protein, carbs, fat, water }` (numbers). |
| enrolledCount | number | Total users enrolled — the overview's "N users enrolled". Server-computed; the client must not count another resource for it. |
| activeUsers / completionRate | number | Overview stats. |
| notes / activity / versionHistory | arrays | `days` = "N days ago" (integer), not a date. |

> **Legacy.** `workoutWeeks` and `dietWeeks` are still on the payload but
> nothing renders them — the Programs page's two tabs read the workout-plan and
> diet-plan endpoints instead. They stay because the Plan Workspace's own
> (differently typed) week arrays are still used by its version history and
> publish checks. A real backend need not carry them.

**`WorkoutWeek` → `WorkoutDay` → `Workout` → `WorkoutSlot`** *(legacy)*
```json
{
  "weekNum": 1,
  "isDeload": false,
  "days": [
    {
      "dayNum": 1, "label": "Mon", "type": "workout",
      "workout": {
        "uid": "w1", "name": "Push Day", "muscle": "Chest/Shoulders",
        "description": "", "estimatedMinutes": 50, "difficulty": "Intermediate",
        "caloriesBurn": 350, "warmup": "…", "cooldown": "…",
        "exercises": [
          { "uid": "s1", "exerciseId": "ex-bench", "sets": 4, "reps": "8-10",
            "weight": "60kg", "rest": "90s", "tempo": "2-0-1", "rpe": 8, "notes": "" }
        ]
      }
    },
    { "dayNum": 2, "label": "Tue", "type": "rest", "workout": null }
  ]
}
```
- `WorkoutDay.type`: `"rest"` | `"workout"`; `workout` is `null` on rest days.
- `WorkoutSlot.exerciseId` references the exercise **library** (see note below).

**`DietWeek` → `DietDay` → `MealEntry`**
```json
{
  "weekNum": 1,
  "days": [
    { "dayNum": 1, "label": "Mon",
      "meals": [ { "uid": "m1", "mealId": "meal-oats", "slot": "Breakfast", "time": "08:00" } ] }
  ]
}
```
- `MealEntry.slot`: `Breakfast` | `Lunch` | `Snack` | `Dinner`.
- `MealEntry.mealId` references the meal **library** (see note below).

**`ProgramMember`**
```json
{
  "clientId": "c-4", "currentWeek": 6, "progressPct": 55, "currentWeight": 78,
  "assignedDate": "2026-06-01T00:00:00.000Z", "lastActive": 1, "status": "active",
  "notes": [ { "author": "…", "text": "…", "days": 2 } ], "overrides": { "workouts": 0, "meals": 0 }
}
```
- `assignedDate` is ISO. `status`: `active` | `paused` | `completed`. `lastActive` = days ago.

**Errors:** `401`; `500`. (`404`/empty is acceptable only if no program is configured — the UI shows "No program configured yet".)

---

## `PUT /program`
Save the whole program (autosave sends the full object on every edit, including
detail edits, workout/diet edits, and publishing a new version).

**Request body:** a full `TrainingProgram` (same shape as `GET`).
**Success `200`** — the saved `TrainingProgram` (server may stamp `updatedDate`).
**Behaviour notes**
- The client sends the entire program; the server should replace/persist it.
- Prefer accepting the full object. If you'd rather have granular endpoints
  (e.g. `PATCH /program/weeks/:weekNum/days/:dayNum`), tell us and we'll split
  the mutation — the current client PUTs the whole thing.
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
**Success `200`** — the updated `TrainingProgram`.
**Errors:** `401`; `500`.

---

## `GET /libraries` — reference catalogs
The program, plan, and template payloads carry only join keys (`exerciseId`,
`mealId`); the display data (name, muscle, equipment, ingredients, steps…) comes
from these read-only catalogs. The client fetches this **once at app load** and
caches it, then resolves ids locally — so a slot like
`{ "exerciseId": "ex-1", "sets": 3 }` becomes "Barbell Bench Press · Chest" from
the catalog, never a bundled assumption.

**Success `200`**
```json
{
  "exercises": [
    { "id": "ex-1", "name": "Barbell Bench Press", "muscle": "Chest",
      "equipment": "Barbell", "description": "Lower the bar to mid-chest…", "…": "…" }
  ],
  "meals": [
    { "id": "meal-oats", "name": "Overnight Oats", "category": "Breakfast",
      "calories": 380, "protein": 18, "ingredients": ["oats","…"], "steps": ["…"], "…": "…" }
  ],
  "workoutTemplates": [
    { "id": "tpl-push", "name": "Push", "muscle": "Chest", "…": "…" }
  ]
}
```

**Behaviour**
- Read-only, session-stable — the client caches with `staleTime: Infinity` and
  loads it before any library-dependent screen renders.
- `exercises[].id` / `meals[].id` are the join keys for every `exerciseId` /
  `mealId` in the program, plan, template, and activity payloads.
- May be split into `GET /libraries/{exercises,meals,workout-templates}` if you
  prefer independent caching; the client currently fetches all three in one call.

---

# Workout plan

A flat, ordered run of **days** — Day 1, Day 2, … — not calendar weeks.
Programmes run different lengths and we don't know which weekday a user starts
on, so days are identified by number and the nutritionist adds days as far as
the programme needs. Each day is one rich-text session tagged
`type: workout | cardio | rest` (drives the chip/icon, nothing structural). No
per-user filtering: a user's day starts as the programme's day verbatim. See
[specs/programs.md](../specs/programs.md) › Workout plan for the product rules.

The UI: **Day tabs** across the top with an **Add day** button, one editor for
the active day, a **type** chip, and a single **Save** that writes the day to
the days the nutritionist picks (this day, all days, or any set).

## `GET /program/workout-plan`
The whole run of days.

**Success `200`**
```json
{
  "updatedAt": "2026-09-03T…Z",
  "days": [
    { "dayNum": 1, "type": "workout",
      "body": "<h2>Push Day</h2><h3>Main set</h3><ul><li><strong>Barbell Bench Press</strong> — 4 x 8 · 90s rest · <a href=\"https://…\">Watch demo</a></li></ul>" },
    { "dayNum": 4, "type": "rest", "body": "<ul><li>8,000 steps…</li></ul>" }
  ]
}
```
The day's coach-facing name lives inside `body` (an `<h2>`), since the day is
identified only by its number. A freshly added day is `{ "type": "rest", "body": "" }`.

**Errors:** `401`; `500`.

---

## `PUT /program/workout-plan/days`
Save the edited day's `type` + `body` to one or more days at once — the single
Save's apply-to-days. Every day in `days` is set to the same `type`/`body`
(a copy across).

**Body** `{ "type": "workout", "body": "<h2>…</h2>", "days": [1, 3, 5] }`
**Success `200`** — the whole updated plan.
**Errors:** `422` `{ "fields": { "type": "Unknown day type." } }` or
`{ "fields": { "days": "Select one or more days." } }`; `401`; `500`.

---

## `POST /program/workout-plan/add-day`
Append a blank day (`type: rest`, empty `body`) at the end of the run.

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

The editor saves **explicitly** (no autosave), and one Save can write the sheet
to several weeks at once: the client PUTs the body to the first chosen week,
then calls `POST /program/diet-plan/duplicate` to fan it out to the rest.

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
