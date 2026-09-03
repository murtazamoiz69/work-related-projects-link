# Page: Nutritionists

## Route
`/nutritionists` — authed, like every other page. There is one role, and managing the other nutritionists is part of it.

## Purpose
The roster of nutritionists: onboard them, edit their details, see how many users each oversees, and enable/disable their platform access. New users are assigned here automatically — the backend puts each one on the least-loaded nutritionist's caseload (see [users.md](./users.md)).

## User Role
Authenticated. Every nutritionist can manage the others.

## UI Sections
- Topbar: title + **Add nutritionist**.
- **Toolbar**: search + status filter.
- **Roster table**: Name / Qualification / Experience / Joined date / Members / Status / Actions.
- **Pagination**.
- Modals: **Add/Edit form**, **Members** (users overseen), **Enable/Disable confirm**.

## Components
`NutritionistTableRow`, `NutritionistFormModal`, `NutritionistMembersModal`, `ConfirmDialog`, `Topbar`, `Icon`, `Avatar`.

## User Actions
- **Add** a nutritionist (modal form).
- **Edit** a nutritionist.
- **View members** (the users they oversee — read-only here; assignment lives in Users).
- **Enable / Disable** access (confirm).
- **Search** (name/email/qualification) and **filter** by status.
- **Paginate**.
- **Call** / **Email** (toast stubs today).

## Data Requirements
**Server Data**
- Nutritionists: `id, name, initials, color, email, qualification, experienceYears, joinDate, memberIds[], accessEnabled`.
- Members: resolved user records for the `memberIds` (name/status/etc.), for the Members modal.

**Client State**
- Modal targets (`addOpen`, `editTarget`, `membersTarget`, `toggleTarget`).

**URL State** (currently local — should move to search params)
- `search`, `status`, `page`.

## API Requirements
> All `PROPOSED`. Today: `NUTRITIONISTS_DATA` seeded from client slices, in a Zustand store.

1. `GET` `/nutritionists` `PROPOSED` — query `search`, `status` (`all|active|disabled`), `page`, `pageSize` → `{ items: Nutritionist[], total, page, pageSize }`.
2. `POST` `/nutritionists` `PROPOSED` — body `{ name, email, qualification, experienceYears }` → created `Nutritionist`.
3. `PUT` `/nutritionists/:id` `PROPOSED` — body `{ name, email, qualification, experienceYears }` → updated.
4. `PATCH` `/nutritionists/:id/access` `PROPOSED` — body `{ enabled: boolean }` → updated.
5. `GET` `/nutritionists/:id/members` `PROPOSED` → `{ members: ClientSummary[] }`.
   - Errors (all): `401`, **`403` (non-admin — must be enforced server-side, not just client-guarded)**, `404`, `409` duplicate email, `422`, `500`, network. Mutations invalidate `['nutritionists']`.

## Forms
**Add / Edit Nutritionist**

| Field | Type | Req | Validation |
| --- | --- | --- | --- |
| name | string | ✅ | non-empty; drives initials |
| email | string | ✅ | valid email; unique |
| qualification | string | ✅ | non-empty |
| experienceYears | number | ✅ | integer ≥ 0 |

- **Submit:** POST (add) or PUT (edit) → prepend/replace row.
- **Success:** modal closes, row appears/updates, (toast recommended).
- **Error:** inline (e.g. duplicate email `409`), modal stays open.

**Enable/Disable confirm** — `ConfirmDialog` gating the access mutation (destructive styling when disabling).

## Loading States
Table skeleton; Members modal loading list.

## Empty States
- No nutritionists match filters → icon + message + **Clear all filters**.
- A nutritionist with zero members → "No users assigned yet" in the Members modal.

## Error States
- List fetch failure → table error + retry.
- Add/edit failure (esp. duplicate email) → inline modal error.
- Access toggle failure → revert + toast.
- **403** → redirect to `/` (matches the current guard behavior).

## Permissions
Authenticated — no extra role check, client- or server-side. Assigning users to nutritionists is out of scope here: it happens automatically when a user is added (owned by Users).

## Performance Considerations
- **Pagination** (`PAGE_SIZE = 12`) → server-side with the API.
- Debounce search; cache pages per query key.
- Members modal loads lazily on open.

## Accessibility
- `<table>` semantics; search + status filter labelled.
- Row action buttons labelled; toggle is a labelled control.
- Modals trap focus and restore on close; confirm for the impactful disable action.

## Mock Data
```json
{
  "items": [
    {
      "id": "nut-1", "name": "Dr. Priya Sharma", "initials": "PS", "color": "#2F5D50",
      "email": "priya.sharma@nourishwithsim.com",
      "qualification": "Registered Dietitian", "experienceYears": 12,
      "joinDate": "2025-03-29T00:00:00.000Z",
      "memberIds": ["c-1","c-2","c-3","c-4","c-5","c-6","c-7","c-8"],
      "accessEnabled": true
    }
  ],
  "total": 10, "page": 1, "pageSize": 12
}
```

## Acceptance Criteria
- The page is reachable by any signed-in nutritionist; a signed-out visitor goes to `/login` like on any other page.
- Search + status filter narrow the roster; count label + pagination update; page resets on filter change.
- Adding a nutritionist validates the form, prepends the new row, and closes the modal; a duplicate email is rejected with an inline error.
- Editing updates the row in place.
- Disabling opens a confirm; on confirm the status flips with a toast and persists.
- "View members" lists the overseen users (or an empty state), read-only.
- A failed list load shows a retry; failed mutations revert and notify.
