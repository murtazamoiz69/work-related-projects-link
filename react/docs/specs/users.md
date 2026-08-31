# Page: Users (Clients)

## Route
`/clients`

## Purpose
The caseload roster. Lets the nutritionist find any user, see status / program access / plan expiry / progress at a glance, and act — message them, manage their plan, extend their program, or enable/disable access.

## User Role
Authenticated (Nutritionist + Super Admin).

## UI Sections
- Topbar (title + subtitle).
- **Summary cards** (counts by status/expiry).
- **Toolbar**: search box + status filter + plan-expiry filter.
- **Roster table**: User / Status / Plan expiry / Progress / Actions.
- **Pagination** (page info + prev/next).
- Modals: **Extend Program**, **Enable/Disable confirm**.

## Components
`UserSummaryCards`, `ClientTableRow` (from `ClientRosterViews`), `ExtendProgramModal`, `ConfirmDialog`, `Topbar`, `Icon`, `Avatar`, `Badge`, `WeekDots`.

## User Actions
- **Search** by name / email (and program/diet/goals — current haystack).
- **Filter** by status (all / active / disabled) and by expiry (all / expiring-soon / expired / active).
- **Sort** — implicit: soonest-expiring first (could become a user-controlled sort).
- **Paginate** (12/page).
- **View / Open chat** → `/chat?c=…`.
- **Manage** (plan) → `/chat?c=…&plan=1`.
- **Extend** program (modal → new expiry).
- **Enable / Disable** access (confirm dialog).
- **Call** / **Email** (currently toast stubs → real `tel:` / `mailto:` or CRM action later).
- **Clear filters** from the empty state.

## Data Requirements
**Server Data**
- Clients list: `id, name, initials, color, age, gender, email, program, plan, status, accessEnabled, expiryDate, adherence, checkInDays, joinDate, goals[], diet`.
- Summary counts (total / active / disabled / expiring / expired).

**Client State**
- Modal targets (`toggleTarget`, `extendTarget`).

**URL State** (currently local `useState` — should move to search params)
- `search`, `status`, `expiry`, `page`.

## API Requirements
> All `PROPOSED`. Today: in-memory `CLIENTS_DATA` + a Zustand store.

1. `GET` `/clients` `PROPOSED`
   - Query: `search`, `status` (`all|active|disabled`), `expiry` (`all|expiring-soon|expired|active`), `page`, `pageSize`, `sort` (default `expiry:asc`).
   - Response: `{ items: Client[], total: number, page: number, pageSize: number }`.
2. `GET` `/clients/summary` `PROPOSED`
   - Response: `{ total, active, disabled, expiringSoon, expired }`.
3. `PATCH` `/clients/:id/access` `PROPOSED`
   - Body: `{ "enabled": boolean }` → Response: updated `Client`.
4. `PATCH` `/clients/:id/expiry` (extend) `PROPOSED`
   - Body: `{ "expiryDate": string /* ISO */ }` → Response: updated `Client`.
   - Errors (all): `401`, `403`, `404`, `422`, `500`, network. Mutations invalidate `['clients']` + `['clients','summary']`.

## Forms
**Extend Program modal**

| Field | Type | Req | Validation | Notes |
| --- | --- | --- | --- | --- |
| duration / new expiry | date or preset (e.g. +30/+90 days) | ✅ | must be a future date, after current expiry | drives the resulting `expiryDate` |

- **Submit:** PATCH expiry; optimistic update acceptable with rollback.
- **Success:** toast, close modal, row reflects new expiry, list re-sorts.
- **Error:** inline error in modal; keep it open.

**Enable/Disable confirm** — not a form; a `ConfirmDialog` gating the access mutation (destructive styling when disabling).

## Loading States
Roster table skeleton rows; summary-card skeletons. Keep the toolbar interactive during load.

## Empty States
- No users match filters → icon + "No users match your filters" + **Clear all filters**.
- Genuinely empty roster (no clients at all) → distinct message.

## Error States
- List fetch failure → table-area error + retry.
- Mutation failure → toast + revert optimistic change; dialog/modal stays actionable.

## Permissions
Authenticated. (If per-nutritionist scoping is added later, the list is filtered server-side to the caller's assigned users; Super Admin sees all.)

## Performance Considerations
- **Pagination** already present (client-side, `PAGE_SIZE = 12`); move to **server-side pagination** with the API.
- Debounce the search input (~250ms) before refetch.
- Cache pages per query key; keep previous page visible while fetching next (`placeholderData`).
- Reset to page 1 on any filter change (already done).

## Accessibility
- Proper `<table>` semantics with header cells; column widths via `colgroup`.
- Search and both selects have accessible labels.
- Row action buttons have `aria-label`s; the toggle is a labelled control.
- Pagination buttons disabled correctly at bounds.

## Mock Data
```json
{
  "items": [
    {
      "id": "c-1", "name": "Priya Sharma", "initials": "PS", "color": "#C44F3F",
      "age": 34, "gender": "Female", "email": "priya@email.com",
      "program": "Weight Loss", "plan": "12-Week Weight Loss Kickstart",
      "status": "attention", "accessEnabled": true,
      "expiryDate": "2026-12-04T00:00:00.000Z",
      "adherence": 42, "checkInDays": 4,
      "joinDate": "2026-05-05T00:00:00.000Z",
      "goals": ["Lose fat", "Build discipline"], "diet": "Low carb"
    }
  ],
  "total": 48, "page": 1, "pageSize": 12
}
```

## Acceptance Criteria
- Search + both filters narrow the list; count label and pagination update; page resets to 1 on filter change.
- Rows are ordered soonest-expiring first by default.
- Disabling a user opens a confirm; on confirm the row shows disabled and a toast appears; data/progress are preserved.
- Extending a program updates the expiry, re-sorts the row, and shows a toast.
- "Open chat" and "Manage" navigate with the correct `?c=` (and `?plan=1` for Manage).
- No results shows the empty state with a working "Clear all filters".
- A failed list load shows a retry; a failed mutation reverts and notifies.
