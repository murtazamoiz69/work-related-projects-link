# Page: Dashboard

## Route
`/`

## Purpose
Daily triage. Answers "who needs my attention right now, how is my caseload doing, and whose access is about to lapse" the moment the nutritionist signs in.

## User Role
Authenticated.

## UI Sections
- Greeting topbar (name + date).
- **KPI row** (total users, new today, meals logged today, workouts logged today).
- **Needs Attention** panel — filter chips + list of flagged users with a reason and a per-day activity dot strip.
- **Client Progress** panel — cohort meal/workout adherence over a time range, with range + program filters and a line chart.
- **Upcoming Expiry** panel — users whose access lapses soon.

## Components
`KpiRow`, `NeedsAttentionPanel`, `ClientProgressPanel`, `UpcomingExpiryPanel`, `WeekDots`, chart (chart.js/`react-chartjs-2`), `Topbar`, `Avatar`, `Icon`.

## User Actions
- **Filter** Needs-Attention by chips (multi-select: needs-attention, new-this-week, missed-workout/diet-yesterday, logged-meal/workout-today).
- **Change range** on Client Progress (e.g. 7 / 30 / 90 days).
- **Filter by program** on Client Progress.
- **Toggle** date labels under the weekly dots.
- **View / open** a flagged user → navigate to Chat (`/chat?c=…`) or their plan.
- **Hover** a day dot → popover with that day's detail.

## Data Requirements
**Server Data**
- KPI counts (total, new today, meals logged today, workouts logged today).
- Needs-attention rows (client ref, reason type, icon, text) + filter counts.
- Per-user weekly progress dots (7 days: tier + popover + labels).
- Client-progress series (ticks, tips, meal %, workout %, active client count) per range + program.
- Upcoming expirations (client ref + days left).

**Client State**
- Active filter-chip keys, selected chart range, selected program, date-label toggle, hovered dot.

**URL State**
- Recommended (not yet implemented): `?range=`, `?program=`, `?attn=` so a filtered view is shareable/reloadable.

## API Requirements
> All `PROPOSED`. Today everything is derived client-side from the clients roster.

1. `GET` `/dashboard/summary` `PROPOSED`
   - Query: none (or `?date=`).
   - Response: `{ kpis, needsAttention[], upcomingExpirations[] }`.
2. `GET` `/dashboard/client-progress` `PROPOSED`
   - Query: `range` (`7|30|90`), `program` (`all` | program name).
   - Response: `{ ticks[], tips[], activeClients, meals: { values[], headline }, workouts: { values[], headline } }`.
3. `GET` `/dashboard/needs-attention` `PROPOSED`
   - Query: `filters` (comma-separated keys).
   - Response: `{ rows: AttentionRow[], counts: Record<key, number> }`.
   - Errors (all): `401`, `500`, network/timeout — per panel.

Endpoints may be consolidated into one `summary` call; splitting keeps the filterable panels independently refetchable.

## Forms
None. Only filter controls.

## Loading States
Per-panel skeletons (KPI tiles, attention rows, chart, expiry rows). No blank panels; the chart area shows a skeleton, not an empty canvas.

## Empty States
- Needs Attention: "Nothing needs your attention" (icon + message) when no rows match.
- Upcoming Expiry: "No upcoming expirations".
- Client Progress: handle a cohort with no data for the range/program.

## Error States
Each panel fails independently with an error + retry; one panel's failure must not blank the page.

## Permissions
Authenticated. Same content for both roles.

## Performance Considerations
- Cache `summary` (staleTime ~60s) and progress series per `range+program` key.
- Lazy-load the chart library with the route (already code-split).
- Memoize derived series; avoid recomputing dot strips on every render.

## Accessibility
- Chart has a text alternative / summary; the headline numbers are readable without the chart.
- Day dots are keyboard-focusable with popovers reachable; meaning isn't colour-only (icons + text in tooltips).
- Filter chips are real buttons with pressed state.

## Mock Data
```json
{
  "kpis": { "total": 48, "newToday": 1, "mealsLogged": 22, "workoutsLogged": 17 },
  "needsAttention": [
    { "clientId": "c-1", "type": "chat-request", "icon": "message-circle",
      "text": "Sent a new message 3 hours ago — awaiting your reply" }
  ],
  "upcomingExpirations": [ { "clientId": "c-9", "daysLeft": 1 } ],
  "clientProgress": {
    "ticks": ["W1","W2","W3","W4"], "tips": ["Week 1","Week 2","Week 3","Week 4"],
    "activeClients": 44,
    "meals": { "values": [61,64,58,67], "headline": 67 },
    "workouts": { "values": [55,60,52,63], "headline": 63 }
  }
}
```

## Acceptance Criteria
- KPI tiles render four counts; each panel loads independently with its own skeleton.
- Selecting/deselecting attention chips filters the list and updates the counts.
- Changing range or program refetches and redraws the progress series without a full-page reload.
- Clicking a flagged user navigates to that user's chat/plan.
- Empty cohorts and empty panels show their empty state, never a blank box.
- A failed panel shows an error with a working retry, leaving other panels intact.
