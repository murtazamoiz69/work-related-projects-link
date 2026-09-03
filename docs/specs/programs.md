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
- **Week rail** + **day cards** (workout days: sessions & exercises; diet days: meals by slot).
- Modals: **Edit Program**, **Exercise Picker**, **Meal Picker**, **Workout Editor**, **Workout Template Picker**; **Enable/Disable confirm**.

## Components
`ProgramOverview`, `WorkoutPlanTab`, `DietPlanTab`, `EditProgramModal`, `ExercisePickerModal`, `MealPickerModal`, `WorkoutEditorModal`, `WorkoutTemplatePickerModal`, `ToggleSwitch`, `ConfirmDialog`, `Topbar`, week utils, `atoms`.

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
