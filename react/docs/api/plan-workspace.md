# Plan Workspace API

Covers the **Plan Workspace** (opened via "Manage Plan" in Chat). It's a
per-user editable training + nutrition plan. See [README.md](./README.md).

## Page functionality
- Load a user's full plan workspace (clinical profile + workout weeks + diet
  weeks + targets + supplements + hydration + version history).
- Edit everything: workout weeks/days/exercises, diet weeks/days/meals,
  nutrition targets, plan name/description, apply templates.
- Publish a new plan version.
- **Autosave:** every edit persists the whole workspace via `PUT`.

> One workspace per user, keyed by the **user (client) id**.

---

## `GET /clients/:id/plan`
Return the user's workspace (built from their profile + goals on first access).

**Success `200`** — a `Workspace`. Top-level shape:
```json
{
  "planName": "12-Week Fat Loss Reset",
  "planDescription": "…",
  "published": true,
  "hydrationGoal": 3,
  "supplements": ["Creatine", "Vitamin D"],
  "targets": { "calories": 1900, "protein": 150, "carbs": 170, "fat": 55, "water": 3, "phase": "Fat Loss" },
  "customMeals": [ /* Meal[] — optional, user-specific meals */ ],
  "profile": { /* ClinicalProfile — see below */ },
  "workoutWeeks": [ /* WsWorkoutWeek[] */ ],
  "dietWeeks": [ /* WsDietWeek[] */ ],
  "versions": [ /* PlanVersion[] — see below */ ]
}
```

**Field reference**
| Field | Type | Notes |
| --- | --- | --- |
| planName | string | Required (validated on save). |
| planDescription | string | |
| published | boolean | Whether the current plan is published to the user. |
| hydrationGoal | number | Litres/day. |
| supplements | string[] | |
| targets | object | `{ calories, protein, carbs, fat, water, phase }`. |
| customMeals | `Meal[]?` | Optional user-specific meals (same `Meal` shape the meal library uses). |
| profile | `ClinicalProfile` | The user's clinical snapshot (see below). Carries `programStart` (ISO). |
| workoutWeeks | `WsWorkoutWeek[]` | Week → days → workout → exercise slots (see below). |
| dietWeeks | `WsDietWeek[]` | Week → days → meal entries. |
| versions | `PlanVersion[]` | Version history; each has a `date` (ISO). |

**`ClinicalProfile`** (large; the only date is `programStart`). Key fields:
```json
{
  "name": "Priya Sharma", "initials": "PS", "color": "#C44F3F", "status": "attention",
  "age": 34, "gender": "Female", "heightCm": 160, "weightKg": 84, "bmi": 32.8,
  "goal": "Weight Loss", "activityLevel": "Lightly active", "targetWeightKg": 72,
  "programStart": "2026-05-06T00:00:00.000Z", "currentWeek": 17, "program": "Weight Loss",
  "allergies": ["Eggs"], "foodIntolerances": [], "medicalConditions": [], "injuries": [], "pregnancy": null,
  "dietLabel": "Low carb", "isVegan": false, "isVegetarian": false, "isPescatarian": false,
  "isHalal": false, "isJain": false, "foodLikes": [], "foodDislikes": [], "cuisine": "…",
  "budget": "…", "mealTiming": "…",
  "location": "…", "workoutDuration": "…", "workoutDifficulty": "…", "preferredTime": "…",
  "physicalLimitations": [],
  "weightLog": [84, 83.6, 83.1], "complianceScore": 42, "missedCheckIns": 3, "waistTrend": -1,
  "photoCount": 4, "tenureDays": 118, "_seed": 12.05
}
```
> `_seed` is a prototype artifact for deterministic generation — the real backend
> can omit it (the client tolerates its absence).

**`WsWorkoutWeek` → `WsWorkoutDay` → `WsWorkout`**
```json
{
  "weekNum": 1,
  "days": [
    {
      "dayNum": 1, "label": "Mon", "type": "workout",
      "workout": {
        "uid": "w1", "name": "Push Day", "muscle": "Chest", "description": "",
        "estimatedMinutes": 50, "difficulty": "Intermediate", "caloriesBurn": 350,
        "warmup": "…", "cooldown": "…", "time": "07:00",
        "exercises": [ { "uid": "s1", "exerciseId": "ex-bench", "sets": 4, "reps": "8-10",
          "weight": "60kg", "rest": "90s", "tempo": "2-0-1", "rpe": 8, "notes": "" } ]
      },
      "extraWorkouts": []
    },
    { "dayNum": 2, "label": "Tue", "type": "rest", "workout": null, "extraWorkouts": [] }
  ]
}
```
- Like the Program's workout shape, plus `workout.time` (scheduled time) and
  `day.extraWorkouts` (a day can stack extra sessions).

**`WsDietWeek` → `WsDietDay` → `MealEntry`**
```json
{ "weekNum": 1, "days": [
  { "dayNum": 1, "label": "Mon", "cheat": false,
    "meals": [ { "uid": "m1", "mealId": "meal-oats", "slot": "Breakfast", "time": "08:00" } ] }
] }
```
- `day.cheat` flags a refeed/cheat day. `slot`: `Breakfast`|`Lunch`|`Snack`|`Dinner`.

**`PlanVersion`**
```json
{ "id": "v1", "num": 1, "label": "Initial plan", "editedBy": "Sarah Nolan",
  "date": "2026-05-06T00:00:00.000Z", "summary": "Generated from user profile & goals",
  "isInitial": true, "snapshot": { /* PlanSnapshot: workoutWeeks, dietWeeks, targets, supplements, hydrationGoal */ } }
```
- `date` is ISO. `snapshot` is a frozen copy of the plan at that version (no dates inside).

**Errors:** `404` `{ "message": "Plan not found." }` (unknown user); `401`; `500`.

> **Build-on-first-access:** the mock generates the initial workspace (with an
> "Initial plan" version) from the user's profile + goals the first time it's
> requested. The real backend can either generate similarly or return a stored
> plan; the client only needs the shape above.

---

## `PUT /clients/:id/plan`
Save the whole workspace. Autosave sends the full object on **every** edit —
including workout/diet edits, target changes, and **publishing** (which just
sets `published` and appends a `PlanVersion`).

**Request body:** a full `Workspace` (same shape as `GET`).
**Success `200`** — the saved `Workspace`.
**Behaviour notes**
- The client sends the entire workspace and does not expect the response written
  back into its cache mid-edit (it keeps its in-memory copy), so returning the
  saved object is sufficient.
- **Publish** is not a separate endpoint today — it is a `PUT` with
  `published: true` and a new entry in `versions`. If you'd prefer an explicit
  `POST /clients/:id/plan/publish { summary }`, tell us and we'll split it.
- If you'd rather have granular edit endpoints instead of whole-object PUTs,
  flag it — the client currently PUTs the full workspace.

**Errors**
| Status | When | Body |
| --- | --- | --- |
| 422 | Empty `planName` (+ server validation) | `{ "message": "The plan could not be saved.", "fields": { "planName": "Plan name is required." } }` |
| 404 | Unknown user | `{ "message": "Plan not found." }` |
| 401 / 500 | — | |

---

## Not an API (this page)
- **Meal templates** (save/apply from the library) — local store today; would
  pair with `/meal-templates` (see [programs.md](./programs.md) reference note).
- **Exercise/meal libraries** — local reference data (join keys `exerciseId`/`mealId`).
- **At-a-glance tracker, AI summary, notes tab** — derived/local (client-detail),
  not part of the plan resource.
- **Activity tab** — reads the conversation's `activity` (see [chat.md](./chat.md)),
  filtered client-side.
