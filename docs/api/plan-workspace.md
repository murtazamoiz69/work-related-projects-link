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

## Backend wiring status (updated 2026-09-08)

> **LIVE.** The backend shipped the whole surface and the app is wired to it via
> the `plan-workspace` and `client-detail` flags:
>
> | Endpoint | Status |
> | --- | --- |
> | `GET`/`PUT /clients/:id/plan` → `Workspace` | **Live** |
> | `GET /clients/:id/detail` → `ClientDetail` | **Live** — the "At a glance" tracker |
> | `GET /clients/:id/workout-plan` + `PUT .../days` + `POST .../reset` | **Live** — Workout Plan tab |
> | `GET`/`PUT /clients/:id/diet-plan?week=` | **Live** — Diet Plan tab |
> | `PATCH /clients/:id/diet-band`, `PATCH /clients/:id/diet-review` → `Client` | **Live** |
>
> **How it opens:** the Users-page **Manage Plan** action navigates to
> `/chat?c=<conversationId>&plan=true`; ChatPage looks the **real** client up in
> the live `GET /clients` roster by `conversationId` (Chat itself is still
> mock), then the overlay drives all the above by that client's id.
>
> **Wire-shape notes:** `Workspace.profile.bmi` is a **string** on the wire (the
> app coerces to a number); `profile.age`/`heightCm`/`weightKg`/`targetWeightKg`/
> `gender` are **nullable** (a partly-onboarded client). `Workspace.workoutWeeks`
> / `dietWeeks` are still on the payload but the tabs render the rich-text
> `/clients/:id/workout-plan` and `/clients/:id/diet-plan` bodies instead — the
> structured arrays only back version-history snapshots.
>
> **Not live:** the **Activity** tab reads a conversation (`/conversations/:id`),
> which stays mock; against a real client it `404`s and the tab shows its empty
> state. A real per-day **metrics** endpoint would replace the seeded At-a-glance
> numbers `src/features/client-detail/tracker.ts` derives — still `PROPOSED`.

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
  "versions": [ /* PlanVersion[] — see below */ ],
  "notes": [ { "author": "Sarah Nolan", "text": "Prefers morning check-ins", "createdAt": "2026-09-05T09:12:00.000Z", "days": 2, "attachment": null } ]
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
| notes | `Note[]` | Nutritionist's private notes on the client. Each: `{ author: string, text: string, createdAt: string (ISO), days: number, attachment?: { name, type } \| null }`. `author` is the signed-in nutritionist. **`createdAt` (ISO) is the authoritative timestamp** — the frontend sends it on new notes and ages the "N days ago" label from it. **`days` is legacy/derived** — the frontend recomputes it from `createdAt` on every read and write, so a backend that only knows `days` still gets a valid value, but it must **persist and echo `createdAt`** for notes to age correctly (a note stored with only `days` stays frozen). Newest first. Persisted with the workspace via `PUT`. |

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
- **Meal templates** (the library behind "Save to Library" / "Add from Library")
  — a separate resource; see **[meal-templates.md](./meal-templates.md)** for the
  contract. Client-side store today, backend endpoints proposed there.
- **Exercise/meal/template libraries** — served by `GET /libraries` (see
  [programs.md](./programs.md)); the client caches them and resolves the
  `exerciseId`/`mealId` join keys in the plan.
- **At-a-glance tracker, AI summary** — derived/local (client-detail), not part of
  the plan resource.
- **Activity tab** — reads the conversation's `activity` (see [chat.md](./chat.md)),
  filtered client-side.

> **Notes tab** — **part of the `Workspace`** (`notes[]` above), persisted with
> the plan via `PUT`. `author` is the signed-in nutritionist; each note carries
> an ISO `createdAt` that the "N days ago" label ages from (`days` is a derived
> legacy field). **Backend: persist and echo `createdAt`** — without it notes
> freeze at the age they were saved. Distinct from the chat-side conversation
> notes (`POST /conversations/:id/notes`, see [chat.md](./chat.md)).
