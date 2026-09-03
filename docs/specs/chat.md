# Page: Chat + Plan Workspace

## Route
`/chat` — accepts `?c=<conversationId>` (select a conversation) and `?plan=1` (open the Plan Workspace on arrival).

## Purpose
The nutritionist's live workspace with a user: watch/supervise the AI conversation, take it over to message directly, review the user's clinical profile / notes / activity, and manage their full workout + diet plan — without leaving the conversation.

## User Role
Authenticated.

## UI Sections
- **Conversation list** (left): search, tabs (All / Needs Attention / New / Active / Pinned), conversation cards (avatar, name, preview, time, AI/needs-nutritionist tag, unread dot, star).
- **Message thread** (center): header (user identity + "Manage Plan" / "At a glance"), AI/human handoff banner, message list (bubbles, date separators, attachments, system messages, typing indicator), AI suggestion chips, composer (attach, emoji, textarea, send) OR a locked composer with "Take over".
- **Client overview** (right rail): AI insights summary, section tabs (Notes / Medical / Activity), notes composer.
- **Plan Workspace overlay** (full-screen): tabs (At a glance / Workout / Diet / Activity / Notes), context sidebar (profile/medical/preferences), week rail, day cards, + a family of modals.
- **Program Progress modal** ("At a glance"): the tracker dashboard over the chat.
- **Activity Log modal**: full activity history with filters.

## Components
`ConversationList`, `MessageThread`, `ClientOverview`, `PlanWorkspaceOverlay` (+ `WorkoutTab`, `DietTab`, `PwContext`, and modals: `MealPickerModal`, `ExercisePickerModal`, `WorkoutTemplatePickerModal`, `WorkoutEditorModal`, `WorkoutPreviewModal`, `EditPlanModal`, `PublishReportModal`, `SaveWeekTemplateModal`), `ProgramProgressModal`, `ActivityLogModal`, `ActivityLogList`, `ActivityFilterBar`, `ProgramTrackerDashboard`, `PhotoLightbox`, `Avatar`, `Icon`. Hooks: `useActivityFilters`.

## User Actions
**List:** search conversations · switch tab · select conversation · pin/unpin (star).
**Thread:** send message · attach file (image/doc) · insert emoji · use an AI suggestion chip · refresh suggestions · **take over** conversation · **hand back** to AI · open attachment in lightbox.
**Overview rail:** switch Notes/Medical/Activity · add note (+ optional document attachment) · open "View all activity".
**Activity Log modal:** filter by kind (check-in/meal/workout/weight/photo) and sub-category · view photos.
**Plan Workspace:** switch tabs · switch week · edit plan details · **publish** plan (report) · add/edit/remove workouts and exercises · preview a workout · pick meals · import/save meal templates (week or day) · save a week as a workout template · edit notes · close (Escape).
**Program Progress modal:** view tracker · switch day · open photos · close.

## Data Requirements
**Server Data**
- Conversations: `id, client, status (waiting|active), handledBy (ai|nutritionist), messages[], unread, starred, insights, flags[], notes[], uploads[], activity[], chatSummary[]`.
- Per-user **clinical profile** (derived): demographics, medical, dietary + workout preferences, progress.
- **Plan workspace**: `workoutWeeks[], dietWeeks[], targets, supplements[], hydrationGoal, planName, planDescription, published, versions[]`.
- **Activity log** entries (kind, title, detail, time, photos, delta, category, upcoming).
- **Libraries**: meals, exercises, workout templates; **meal templates** (user-saved).
- **Program tracker** daily logs (for At-a-glance).

**Client State**
- `tab`, `query`, `selectedId`, `typing`, composer `input`, `pendingAttachment`, `emojiOpen`, `suggestions`, overview `section`, note draft, `planClient`, `programClient`, Plan Workspace `activeTab`, `activeWeek`, `openSections`, `modal`, `confirm`, refresh nonce.

**URL State**
- `c` (selected conversation), `plan` (workspace open) — already implemented. Could add `pwTab`, `week`.

## API Requirements
> All `PROPOSED`. Today: `CONVERSATIONS` singleton mutated in place; workspace cached per client; libraries seeded.

**Conversations & messaging**
1. `GET` `/conversations` `PROPOSED` — query `tab`, `search`, `page` → `{ items: ConversationSummary[], total }`.
2. `GET` `/conversations/:id` `PROPOSED` → full `Conversation` (messages, insights, notes, activity, summary).
3. `POST` `/conversations/:id/messages` `PROPOSED` — body `{ text?: string, attachment?: { type, name, size?, dataUrl? } }` → created `Message`.
4. `PATCH` `/conversations/:id` `PROPOSED` — body `{ starred?: boolean, unread?: 0, handledBy?: 'ai'|'nutritionist' }` (take over / hand back / read / pin) → updated summary.
5. `POST` `/conversations/:id/notes` `PROPOSED` — body `{ text, attachment? }` → created note.
6. `GET` `/conversations/:id/activity` `PROPOSED` — query `kind`, `category` → `ActivityItem[]`.
7. `GET` `/ai/suggestions` `PROPOSED` — query `conversationId` → `{ suggestions: string[] }`.

**Plan workspace**
8. `GET` `/clients/:id/plan` `PROPOSED` → `Workspace`.
9. `PUT` `/clients/:id/plan` `PROPOSED` — body `Workspace` (or granular PATCH of a week/day/entry) → saved `Workspace` + new version.
10. `POST` `/clients/:id/plan/publish` `PROPOSED` — body `{ summary, message }` → `{ version }`.
11. `GET` `/clients/:id/clinical-profile` `PROPOSED` → `ClinicalProfile`.

**Libraries & templates**
12. `GET` `/libraries/meals` · `/libraries/exercises` · `/libraries/workout-templates` `PROPOSED`.
13. `GET` / `POST` / `DELETE` `/meal-templates` `PROPOSED`.

Errors (all): `401`, `403`, `404`, `409` (concurrent plan edit), `422`, `500`, network. Message send should support optimistic append + rollback; plan writes should invalidate `['clients', id, 'plan']`.

## Forms
- **Message composer:** text (optional if attachment), attachment (image/doc). Enabled only when `handledBy === 'nutritionist'`. Submit appends message + triggers reply; clears input/attachment; disables send when empty.
- **Note composer:** text (optional if attachment), attachment (.pdf/.doc/.docx/.txt). Submit prepends note + toast.
- **Edit Plan modal:** plan name, description, targets (calories/protein/carbs/fat/water), supplements, hydration — numeric validation, required name.
- **Publish Report modal:** summary + message to the user — required, submit publishes a version.
- **Workout Editor / Meal Picker / etc.:** structured editors (sets/reps/weight/rest/tempo/rpe; meal slot/time) — numeric + enum validation, upcoming-only edit gating (a past-dated session is read-only).

## Loading States
- Conversation list skeleton; thread skeleton; right-rail summary skeleton.
- Plan Workspace: skeleton for profile/context + tab body; library pickers show a loading list.
- Program tracker: chart + stat-row skeleton.

## Empty States
- No conversations match search/tab ("No conversations match").
- Empty thread (new conversation).
- No notes yet / no activity yet / empty library / no meal templates.
- No plan configured for a user.

## Error States
- List/thread/workspace fetch failures → localized error + retry.
- Message/note/plan mutation failure → toast + rollback; composer stays usable.
- `409` concurrent plan edit → prompt to reload the plan before overwriting.

## Permissions
Authenticated. Take-over / publish are nutritionist actions. (Future: only the user's assigned nutritionist may manage their plan.)

## Performance Considerations
- **Virtualize** long conversation lists and long message threads (future; fine at current sizes).
- **Lazy-load** the Plan Workspace overlay + tracker (chart-heavy) — only when opened.
- **Cache** libraries and clinical profile (long staleTime); dedupe with React Query.
- **Debounce** conversation search.
- Avoid the broad `refresh()` re-render pattern once Query owns messages/plan.

## Accessibility
- Conversation cards are keyboard-operable (Enter/Space) with a visible selected state.
- Overlay + every modal trap focus, restore focus to the opener, and close on Escape (respect topmost-layer for the lightbox).
- New incoming messages should be announced (aria-live polite) for screen-reader users.
- Composer, star, and attachment controls are labelled; typing indicator is non-essential/decorative.
- Suggestion chips and tabs are real buttons with pressed/selected state.

## Mock Data
```json
{
  "id": "conv-c-1",
  "client": { "id": "c-1", "name": "Priya Sharma", "initials": "PS", "color": "#C44F3F" },
  "status": "waiting",
  "handledBy": "ai",
  "unread": 2,
  "starred": false,
  "insights": { "mealPct": 42, "workoutDone": false, "workoutsCompleted": 2, "workoutsTotal": 5 },
  "flags": ["low-adherence"],
  "chatSummary": ["Adherence down to 42%", "Missed evening meals this week"],
  "messages": [
    { "from": "client", "text": "I keep missing dinner logs", "time": "2026-08-31T14:02:00.000Z", "attachment": null },
    { "from": "ai", "text": "Let's set an 8pm reminder — want me to add it?", "time": "2026-08-31T14:03:00.000Z", "attachment": null }
  ],
  "notes": [ { "author": "Sarah Nolan", "text": "Prefers voice notes", "days": 3, "attachment": null } ],
  "activity": [
    { "kind": "meal", "icon": "utensils", "title": "Logged Lunch", "detail": "520 kcal",
      "time": "2026-08-31T12:30:00.000Z", "category": "Lunch" }
  ]
}
```

## Acceptance Criteria
- Selecting a conversation loads its thread and clears its unread state; `?c=` reflects the selection.
- While `handledBy === 'ai'`, the composer is locked and shows "Take over"; taking over unlocks it and posts a system message.
- Sending a message appends it immediately and the input/attachment clear; a failed send rolls back and notifies.
- Handing back to AI re-locks the composer and posts a system message.
- Pinning moves a conversation into the Pinned tab; the tab only appears when something is pinned.
- Adding a note prepends it to the list with a toast.
- "Manage Plan" opens the Plan Workspace for the selected user (also via `?plan=1` on load); Escape closes it (but closes an open picker/modal first).
- The Plan Workspace tracker on "At a glance" reflects the user's real logged activity.
- Every modal and the overlay trap focus and restore it on close.
