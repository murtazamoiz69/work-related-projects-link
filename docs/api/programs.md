# Program API

Covers the **Programs** page. There is a **single global program** (no
list/create/delete) — this page views/edits it and toggles its availability.
See [README.md](./README.md) for conventions.

## Page functionality
- Load the program (overview + workout weeks + diet weeks + nutrition targets).
- Edit program details (name, description, goal, difficulty, duration).
- Edit workout content: add/edit/remove workouts and their exercise slots,
  duplicate a day, drag to swap days, apply a workout template.
- Edit diet content: add/edit meals per day/slot, apply meal templates.
- Toggle availability (Active/Disabled) — gated by a confirm dialog.
- **Autosave:** every edit persists the whole program (a `PUT`). The UI shows a
  transient "Saved" indicator.

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
| activeUsers / completionRate | number | Overview stats. |
| notes / activity / versionHistory | arrays | `days` = "N days ago" (integer), not a date. |

**`WorkoutWeek` → `WorkoutDay` → `Workout` → `WorkoutSlot`**
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
