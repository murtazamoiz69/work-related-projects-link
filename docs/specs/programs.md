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
- **Tabs**: Workout Plan / Diet Plan. Both are a **week rail** over a
  rich-text plan — see **Workout plan** and **Diet plan** below. The Workout
  tab is seven expanding day rows; the Diet tab is a meal-category picker over
  one sheet.
- Modals: **Edit Program**, **Duplicate weeks**; **Enable/Disable confirm**.

## Components
`ProgramOverview`, `WorkoutPlanTab`, `WorkoutDayRow`, `DietPlanTab`,
`DuplicateWeeksModal`, `RichTextEditor`, `EditProgramModal`, `ToggleSwitch`,
`ConfirmDialog`, `Topbar`.

## User Actions
- **Edit** program details (modal).
- **Toggle availability** (Active/Disabled) — gated by confirm.
- **Switch** tab (Workout / Diet) and **week**.
- **Author** a day's session — name it, set its type, write the exercises and
  their video links — and **swap** two days of a week.
- **Author** the diet sheet for a meal category.
- **Duplicate** a week onto other weeks (both tabs).
- **Autosave** — edits persist on a debounce and flash a "Saved" pill.

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

**Workout day** — `label` (free text, may be empty), `type`
(`workout|cardio|rest`), `body` (rich text). All three save together on one
debounce.
- **Submit/Autosave:** persist + flash "Saved"; no explicit save button for inline edits.
- **Success:** "Saved" pill; toast for availability toggle.
- **Error:** modal-inline error; failed autosave surfaces a toast and does not silently drop the edit.

## Loading States
Overview skeleton; week/day card skeletons; library pickers loading list.

## Empty States
- "No program configured yet" (no program).
- A week nobody has authored (weeks 2-6 ship blank in both tabs) → a note
  pointing at Duplicate. An unauthored day reads "Not set".

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
- The program's overview renders from the fetched program; the workout and diet
  plans render from their own endpoints.
- Toggling availability opens a confirm; on confirm the status flips, a toast shows, and it persists.
- Switching tab/week shows the corresponding content without a full reload.
- Editing a day or a sheet persists and flashes "Saved"; a failed save notifies and retains the edit.
- **Opening** a day, switching week, or switching meal category writes nothing.
- "No program configured" appears only when no program exists.

---

## Workout plan

Seven days a week, six weeks, one **rich-text session per day**. Deliberately
the same shape as the diet sheet: a nutritionist moving between the two tabs
shouldn't have to learn a second way of working.

### The week
A day row shows its **weekday** (Monday first — the programme runs on calendar
weeks), a **type chip** (`Workout` / `Cardio` / `Rest`), and the coach's **name**
for it ("Push Day", "Zone 2 Cardio"). Clicking the row expands it into the
editor for that session, where the name, the type and the body are all editable
and save together on one debounce.

The body is rich text for the same reason the diet sheet is: a session is a
warm-up, a main set, a finisher and a pile of coaching notes, and each exercise
carries a **demo video link** beside it. Links are real anchors, so they survive
the editor's round trip and stay clickable. The toolbar has a link control for
adding more.

**Swapping** two days is a picker on each row ("Swap with…"), not a drag. A week
is seven rows any of which may be open with an editor inside it; dragging over
that is fiddly and unreachable from a keyboard. The swap trades everything —
name, type and session — and the weekdays themselves stay put.

**Duplicate** copies all seven days of the open week onto any other weeks,
chosen with checkboxes. Only **week 1** ships authored; weeks 2-6 start blank
and are filled by hand or copied forward.

### Per-user
There is **no filtering here** — unlike the diet plan, a user's week starts as
the programme's week verbatim and diverges only when a nutritionist edits it for
them. Once it does, the week is flagged **Edited for this user**, stops tracking
the programme, and a **Reset to programme** button undoes it.

> **Legacy:** `TrainingProgram.workoutWeeks` / `.dietWeeks` are still on the
> program payload but nothing renders them any more — both plans are served by
> their own endpoints. The Plan Workspace's separate `ws.workoutWeeks` (a
> different type) is still load-bearing for its version history and publish
> checks.

---

## Diet plan

The programme is **Diwali Glow** — a six-week fat-loss programme, so the diet
runs on a calorie deficit and the plan is organised by **daily intake target**
rather than by dish.

### Meal categories (calorie bands)
A user is placed in one of **1200 / 1400 / 1600 / 1800 / 2000 kcal** at
onboarding, from their BMR and estimated burn. The category decides which master
sheet they follow. It is shown as a chip under their name in the Users roster
and is changed from their **Manage Plan → Diet Plan** tab as their burn changes.

The control is labelled **Meal Category** everywhere it appears. On the
**global** tab it switches which sheet you're authoring, so it takes effect
immediately. On a **user's** tab it is a *staged* edit behind a **Save changes**
button, with a warning of what the move costs — it re-derives all six weeks from
a different master sheet and drops anything hand-written for that user, which is
too much to happen on the way past a dropdown.

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
for this user** and stops tracking the master. Changing a user's meal category
re-derives every week from the new category's sheets and drops those edits — an
edit written against 1400 kcal portions doesn't hold at 1800.

### Review sign-off
A user's plan is filtered by the engine the moment they onboard, so *"there is a
plan"* and *"a person has read the plan"* are different facts. The second one is
the **review state**:

- **In review** — the default for every newly created user, and for anyone
  seeded inside the onboarding window. The plan is not considered ready.
- **Reviewed** — a nutritionist has opened Manage Plan → Diet Plan, read the
  filtered plan and clicked **Reviewed**. Stamped with the date.

The state shows as a **chip beside the user's name** in the Users roster and has
its own roster **filter** (`All plans / In review / Reviewed`), which is how a
nutritionist finds who is still waiting on them. **Reopen review** puts a plan
back, and **changing a user's meal category** does so automatically — what was
signed off is not what they're on any more.

The sign-off is carried on the **plan** response, not read off the client
record: the workspace is opened with whatever client object the calling surface
happened to hold, and that one doesn't refetch when the sign-off changes.

> Scope: this is the nutritionist side only. Nothing here gates what the
> end-user app actually serves.
