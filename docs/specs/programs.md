# Page: Programs

## Route
`/programs`

## Purpose
Manage the **single global program** available across the platform — its details, its week-by-week workout and diet content, and whether it is currently available to users. (There is no program list / create / delete; per-user assignment and progress live in Users/Chat.)

## User Role
Authenticated.

## UI Sections
- Topbar: title, **autosave "Saved" pill**, **Edit** button, **availability toggle** (Active/Disabled).
- **Program Overview** (name, description, goal, difficulty, duration, enrolled count, nutrition targets, version).
- **Tabs**: Workout Plan / Diet Plan.
- **Week rail** + **day cards** (workout). The Diet Plan tab is a week rail + a calorie-band picker + one rich-text sheet — see **Diet plan** below.
- Modals: **Edit Program**, **Exercise Picker**, **Meal Picker**, **Workout Editor**, **Workout Template Picker**; **Enable/Disable confirm**.

## Components
`ProgramOverview`, `WorkoutPlanTab`, `DietPlanTab`, `DuplicateSheetModal`, `RichTextEditor`, `EditProgramModal`, `ExercisePickerModal`, `WorkoutEditorModal`, `WorkoutTemplatePickerModal`, `ToggleSwitch`, `ConfirmDialog`, `Topbar`, week utils, `atoms`.

## User Actions
- **Edit** program details (modal).
- **Toggle availability** (Active/Disabled) — gated by confirm.
- **Switch** tab (Workout / Diet) and **week**.
- **Add / edit / remove** workouts and their exercise slots; **preview** a workout; apply a **workout template**.
- **Add / edit / remove** meals per day/slot; apply from library.
- **Autosave** — edits stamp `updatedDate`, persist, and flash the "Saved" pill.

## Data Requirements
**Server Data**
- Program: `id, name, description, goal, difficulty, durationWeeks, coach, enabled, createdDate, updatedDate, version, workoutWeeks[], dietWeeks[], nutritionTargets, members[], activeUsers, completionRate, notes[], activity[], versionHistory[]`.
- Enrolled count (currently `CLIENTS_DATA.length`).
- **Libraries**: exercises, meals, workout templates.

**Client State**
- `tab`, `activeWeek`, `saved` pill, modal open states, edit targets.

**URL State**
- Recommended: `?tab=workout|diet`, `?week=`.

## API Requirements
> All `PROPOSED`. Today: `TRAINING_PROGRAMS[0]` in a store, persisted to localStorage; edits mutate in place + `commit()`.

1. `GET` `/program` `PROPOSED` → the `TrainingProgram`.
2. `PUT` `/program` `PROPOSED` — full program (or granular `PATCH /program/weeks/:weekNum/...` for a day/slot) → saved program.
3. `PATCH` `/program/availability` `PROPOSED` — body `{ "enabled": boolean }` → updated program.
4. `GET` `/libraries/exercises` · `/libraries/meals` · `/libraries/workout-templates` `PROPOSED`.
   - Errors (all): `401`, `403`, `404`, `422`, `500`, network. Writes invalidate `['program']`. Autosave = debounced PUT/PATCH.

## Forms
**Edit Program modal**

| Field | Type | Req | Validation |
| --- | --- | --- | --- |
| name | string | ✅ | non-empty |
| description | string | ❌ | — |
| goal | enum (`Fat Loss`…) | ✅ | one of allowed |
| difficulty | enum (`Beginner|Intermediate|Advanced`) | ✅ | one of allowed |
| durationWeeks | number | ✅ | > 0 |
| nutritionTargets | numbers (cal/protein/carbs/fat/water) | ✅ | ≥ 0 |

**Workout Editor** — per exercise slot: `sets` (int>0), `reps` (string/range), `weight`, `rest`, `tempo`, `rpe` (0–10), `notes`. Session: name, muscle, minutes, difficulty, calories, warmup/cooldown.
- **Submit/Autosave:** persist + flash "Saved"; no explicit save button for inline edits.
- **Success:** "Saved" pill; toast for availability toggle.
- **Error:** modal-inline error; failed autosave surfaces a toast and does not silently drop the edit.

## Loading States
Overview skeleton; week/day card skeletons; library pickers loading list.

## Empty States
- "No program configured yet" (no program).
- A week with no workouts / a day with no meals → prompt to add.

## Error States
Fetch failure → page error + retry. Autosave failure → toast (edit retained locally). Availability toggle failure → revert toggle + toast.

## Permissions
Authenticated to view/edit.

## Performance Considerations
- Cache libraries (long staleTime).
- Debounce autosave writes; coalesce rapid edits.
- Lazy-load heavy editor modals.

## Accessibility
- Tabs use `role="tablist"`/`aria-selected`; availability toggle is a labelled switch.
- Modals trap focus and restore on close; confirm dialog for the destructive/impactful availability change.
- Numeric inputs have labels + helper/error text.

## Mock Data
```json
{
  "id": "prog-1", "name": "Body Recomposition Plan",
  "goal": "Fat Loss", "difficulty": "Intermediate", "durationWeeks": 12,
  "enabled": true, "version": "1.4",
  "nutritionTargets": { "calories": 2000, "protein": 160, "carbs": 180, "fat": 60, "water": 3 },
  "workoutWeeks": [
    { "weekNum": 1, "days": [
      { "dayNum": 1, "label": "Mon", "type": "workout",
        "workout": { "uid": "w1", "name": "Push A", "muscle": "Chest/Shoulders",
          "estimatedMinutes": 50, "difficulty": "Intermediate", "caloriesBurn": 350,
          "exercises": [ { "uid": "s1", "exerciseId": "ex-bench", "sets": 4, "reps": "8-10",
            "weight": "60kg", "rest": "90s", "tempo": "2-0-1", "rpe": 8, "notes": "" } ] } }
    ] }
  ],
  "dietWeeks": [ { "weekNum": 1, "days": [
    { "dayNum": 1, "label": "Mon", "meals": [ { "uid": "m1", "mealId": "meal-oats", "slot": "Breakfast", "time": "08:00" } ] }
  ] } ]
}
```

## Acceptance Criteria
- The program's overview, workout weeks, and diet weeks render from the fetched program.
- Toggling availability opens a confirm; on confirm the status flips, a toast shows, and it persists.
- Switching tab/week shows the corresponding content without a full reload.
- Editing a workout/exercise/meal persists and flashes "Saved"; a failed save notifies and retains the edit.
- "No program configured" appears only when no program exists.
- Editor modals validate numeric fields and trap focus.

---

## Diet plan

The programme is **Diwali Glow** — a six-week fat-loss programme, so the diet
runs on a calorie deficit and the plan is organised by **daily intake target**
rather than by dish.

### Calorie bands
A user is placed in one of **1200 / 1400 / 1600 / 1800 / 2000 kcal** at
onboarding, from their BMR and estimated burn. The band decides which master
sheet they follow. It is shown as a chip under their name in the Users roster
and is changed from their **Manage Plan → Diet Plan** tab as their burn changes.

### Master sheets (global)
One sheet per **week × band** (6 × 5 = 30). A sheet is not a menu of finished
dishes: it maps the day out slot by slot — waking up, pre-breakfast,
pre-workout, breakfast, mid-morning, lunch, evening snack, dinner, before bed —
and each slot carries a **must-have** plus **portion-based choices** that hit
the same macro target, so a protein requirement can be met by 150 g chicken *or*
200 g rajma *or* 150 g paneer. Portions scale with the band; the structure does
not.

The body is **rich text** (HTML, edited with TipTap) because that is what the AI
engine reads and because a plan needs headings, swap lists, emphasis on
non-negotiables, and links out to recipes. It **autosaves**.

**Duplicate** copies the open week's sheet onto any other weeks of the **same
band**, chosen with checkboxes. Same-band only: a 1200 kcal sheet's portions
mean nothing on an 1800 kcal week.

### Per-user plans
A user's plan is the master sheet for their week and band, narrowed by three
onboarding answers:

| Filter | Values | Effect |
| --- | --- | --- |
| Life stage | male / female / lactating | Notes only (lactating raises the target and floors it at 1800). |
| Medical conditions | Diabetes, PCOS, Thyroid, Hypertension, Uric Acid | Each adds a note and removes specific options (e.g. Thyroid limits soy). |
| Dietary preference | Non-veg / Veg / Vegan / Eggitarian | Removes whole ingredient groups from the choice lines. |

The engine **only ever narrows or annotates the master sheet — it never
introduces food the master plan doesn't contain** (asserted in
`dietPlan.api.test.ts`). The applied filters are shown as chips above the
editor so the tailoring is legible rather than magic.

The nutritionist can edit a user's copy directly; it is then flagged **Edited
for this user** and stops tracking the master. Changing a user's band
re-derives every week from the new band's sheets and drops those edits — an
edit written against 1400 kcal portions doesn't hold at 1800.
