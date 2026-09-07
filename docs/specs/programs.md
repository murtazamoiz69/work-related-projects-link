# Page: Programs

## Route
`/programs`

## Purpose
Manage the **single global program** available across the platform — its
details, its workout and diet content (each authored as free rich text), and
whether it is currently available to users. (There is no program list / create /
delete; per-user assignment and progress live in Users/Chat.)

## User Role
Authenticated.

## UI Sections
- Topbar: title, **autosave "Saved" pill**, **Edit** button, **availability
  toggle** (Active/Disabled).
- **Program Overview** (name, description, availability, duration in weeks, last
  updated, enrolled count).
- **Tabs**: Workout Plan / Diet Plan. Both are a **rich-text editor** over a
  single `body`:
  - **Workout** — a flat run of **Day 1, Day 2, … tabs** with an **Add day**
    button; one editor for the active day.
  - **Diet** — a **Category** (calorie band) select, then **Week 1..N** chips,
    then one editor for that week's sheet.
- Modals: **Edit Program**; **Save to days** / **Save to weeks** pickers;
  **Enable/Disable confirm**.

## Components
`ProgramOverview`, `WorkoutPlanTab`, `DietPlanTab`, `SaveToDaysModal`,
`SaveToWeeksModal`, `LazyRichTextEditor`, `EditProgramModal`, `ToggleSwitch`,
`ConfirmDialog`, `Topbar`.

## User Actions
- **Edit** program details — name, description, timeline in weeks (modal).
- **Toggle availability** (Active/Disabled) — gated by confirm.
- **Switch** tab (Workout / Diet); pick a **day** (workout) or a **category +
  week** (diet).
- **Author** a workout day's session in the rich-text editor.
- **Author** a diet sheet for a category + week.
- **Save** — the workout tab writes the edited day to the days you pick (this
  day / all days / any set); the diet tab writes the edited sheet to the weeks
  you pick. Program-detail edits autosave and flash a "Saved" pill.

## Data Requirements
**Server Data**
- Program: `id, name, description, durationWeeks, enabled, enrolledCount,
  createdAt, updatedAt` (see [api/programs.md](../api/programs.md) — a small
  object, **no plan content**).
- Workout plan: `GET /program/workout-plan` → `{ updatedAt, days: [{ dayNum,
  body }] }`.
- Diet plan: `GET /program/diet-plan?week=&band=` → `{ weekNum, band, body,
  updatedAt }`.

**Client State**
- `tab`, `activeWeek`, selected diet `band`, `saved` pill, modal open states.

**URL State**
- Recommended: `?tab=workout|diet`, `?week=`.

## API Requirements
> All `PROPOSED`. Today: an in-session mock store per resource; the program is
> also mirrored to `localStorage` so edits survive a reload.

1. `GET /program` `PROPOSED` → the program object.
2. `PUT /program` `PROPOSED` — body `{ name, description, durationWeeks }` →
   the updated program.
3. `PATCH /program/availability` `PROPOSED` — body `{ enabled: boolean }` → the
   updated program.
4. `GET /program/workout-plan`, `PUT /program/workout-plan/days`,
   `POST /program/workout-plan/add-day` `PROPOSED` — see
   [api/programs.md](../api/programs.md) › Workout plan (plus the per-user
   variants).
5. `GET /program/diet-plan`, `PUT /program/diet-plan`,
   `POST /program/diet-plan/duplicate` `PROPOSED` — see
   [api/programs.md](../api/programs.md) › Diet plan (plus the per-user
   variants, `PATCH /clients/:id/diet-band`, `PATCH /clients/:id/diet-review`).

There is **no** `/libraries` endpoint: the plans are free rich text and carry no
exercise / meal ids. Errors (all): `401`, `403`, `404`, `422`, `500`, network.
Writes invalidate the relevant query key.

## Forms
**Edit Program modal**

| Field | Type | Req | Validation |
| --- | --- | --- | --- |
| name | string | ✅ | non-empty |
| description | string | ❌ | — |
| durationWeeks | number | ✅ | clamped to 1–24 |

**Workout / diet body** — a single rich-text `body` per day (workout) or per
week + band (diet). Program-detail edits autosave on a debounce; plan edits are
saved explicitly via the day/week picker.
- **Success:** "Saved" pill (program detail); toast for availability toggle.
- **Error:** modal-inline error; a failed save surfaces a toast and does not
  silently drop the edit.

## Loading States
Overview skeleton; the editor panel shows a skeleton while its `body` loads.

## Empty States
- "No program configured yet" (no program).
- A day / week nobody has authored → an inline note: "Write it here, then Save
  it to the days/weeks it applies to."

## Error States
Fetch failure → page error + retry. Save failure → toast (edit retained
locally). Availability toggle failure → revert toggle + toast.

## Permissions
Authenticated to view/edit.

## Performance Considerations
- Debounce autosave writes; coalesce rapid edits.
- Lazy-load the rich-text editor (`LazyRichTextEditor`).

## Accessibility
- Tabs use `role="tablist"`/`aria-selected`; availability toggle is a labelled switch.
- Modals trap focus and restore on close; confirm dialog for the destructive/impactful availability change.
- The editor has an `aria-label` naming the day / week + band it edits.

## Mock Data
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
The workout and diet content are served by their own endpoints — a run of
`{ dayNum, body }` and a per-week `{ weekNum, band, body }`, where `body` is an
HTML string.

## Acceptance Criteria
- The overview renders from the fetched program; the workout and diet plans
  render from their own endpoints.
- Toggling availability opens a confirm; on confirm the status flips, a toast
  shows, and it persists.
- Switching tab / day / week / category shows the corresponding content without
  a full reload.
- Editing a program detail autosaves and flashes "Saved"; a failed save notifies
  and retains the edit.
- **Opening** a day, switching week, or switching category writes nothing — only
  a confirmed **Save** (and **Add day**) reaches the server.
- "No program configured" appears only when no program exists.

---

## Workout plan

A flat, ordered run of **days** — Day 1, Day 2, … — not calendar weeks.
Programmes run different lengths and we don't know which weekday a user starts
on, so days are identified by **number**. Each day is **one rich-text session**.
Deliberately the same shape as the diet sheet: a nutritionist moving between the
two tabs shouldn't have to learn a second way of working.

### The day run
**Day tabs** run across the top with an **Add day** button that appends a blank
day at the end — the nutritionist adds days as far as the programme needs.
Selecting a day loads its `body` into the editor. The day's coach-facing name
lives **inside** the body (an `<h2>`), since the day is identified only by its
number.

The body is rich text because a session is a warm-up, a main set, a finisher and
a pile of coaching notes, and each exercise can carry a **demo video link**
beside it. Links are real anchors, so they survive the editor's round trip and
stay clickable. The toolbar has a link control for adding more.

**Save** writes the day you just edited to the days you pick — **this day**,
**all days**, or any set (`SaveToDaysModal`). Anything already on those days is
replaced. There is no autosave and no "Duplicate" button; the single Save with
its day picker does both jobs. Only **Day 1** ships authored; the rest start
blank and are filled by hand or copied forward with a Save.

### Per-user
There is **no filtering here** — unlike the diet plan, a user's day starts as
the programme's day verbatim and diverges only when a nutritionist edits it for
them (from **Manage Plan → Workout Plan**). Once it does, the day is flagged
**edited**, stops tracking the programme, and a **Reset to programme** button
undoes it. The day count follows the programme (no per-user Add day).

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
non-negotiables, and links out to recipes. It saves **explicitly**: **Save**
opens a week picker and can write the sheet to several weeks of the **same band**
at once (the client PUTs the first week, then `POST /program/diet-plan/duplicate`
fans it out). Same-band only: a 1200 kcal sheet's portions mean nothing on an
1800 kcal week.

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
