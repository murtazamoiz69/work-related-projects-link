# Nutritionists API

Covers the **Nutritionists** page. **Super-Admin only** — every endpoint here
must return **403** for authenticated non-admins (see [README.md](./README.md)).

## Page functionality
- Paginated roster with **server-side** search + status filter, sorted by name.
- Add a nutritionist; edit one; enable/disable platform access (with confirm).
- View the users (members) a nutritionist oversees (read-only list).

---

## `GET /nutritionists`
Filtered, name-sorted, paginated roster.

**Query params**
| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| search | string | — | Matches name, email, qualification (case-insensitive). |
| status | `all` \| `active` \| `disabled` | `all` | By `accessEnabled`. |
| page | integer (1-based) | 1 | |
| pageSize | integer | 12 | |

Sort: **name ascending**.

**Success `200`** — paginated envelope of `Nutritionist`:
```json
{
  "items": [
    {
      "id": "nut-1",
      "name": "Dr. Priya Sharma",
      "initials": "PS",
      "color": "#2F5D50",
      "email": "priya.sharma@nourishwithsim.com",
      "qualification": "Registered Dietitian",
      "experienceYears": 12,
      "joinDate": "2025-03-29T00:00:00.000Z",
      "memberIds": ["c-1", "c-2", "c-3"],
      "accessEnabled": true
    }
  ],
  "total": 10, "page": 1, "pageSize": 12
}
```
| Field | Type | Notes |
| --- | --- | --- |
| id, name, initials, color, email, qualification | string | |
| experienceYears | number | Whole years. |
| joinDate | ISO date | |
| memberIds | string[] | Ids of users this nutritionist oversees (see members endpoint). |
| accessEnabled | boolean | Platform access on/off. |

**Errors:** `401`; `403`; `500`.

---

## `POST /nutritionists`
Create a nutritionist. Server assigns `id`, `initials`, `color`, `joinDate`,
`memberIds` (`[]`), `accessEnabled` (`true`).

**Request body**
```json
{ "name": "Dr. Test Person", "email": "test@nourishwithsim.com", "qualification": "Registered Dietitian", "experienceYears": 3 }
```
| Field | Type | Rules |
| --- | --- | --- |
| name | string | required, non-empty |
| email | string | required, valid, **unique** |
| qualification | string | required, non-empty |
| experienceYears | number | integer ≥ 0 (client validates ≤ 70) |

**Success `201`** — the created `Nutritionist`.
**Errors**
| Status | When | Body |
| --- | --- | --- |
| 422 | Missing/invalid fields | `{ "message": "...", "fields": { "name": "Name is required.", "email": "…" } }` |
| 409 | Duplicate email | `{ "message": "That email is already in use.", "fields": { "email": "Already in use." } }` |
| 401 / 403 | — | |

---

## `PUT /nutritionists/:id`
Edit a nutritionist (same fields as create).

**Request body:** same as `POST`.
**Success `200`** — the updated `Nutritionist` (server recomputes `initials`).
**Errors:** `422` (field map); `409` duplicate email; `404` `{ "message": "Nutritionist not found." }`; `401`/`403`.

---

## `PATCH /nutritionists/:id/access`
Enable/disable platform access.

**Request body**
```json
{ "enabled": false }
```
**Success `200`** — the updated `Nutritionist`.
**Errors:** `404`; `401`/`403`.

---

## `GET /nutritionists/:id/members`
The users overseen by a nutritionist (read-only; assignment is owned by the
Users section, not editable here).

**Success `200`**
```json
{
  "members": [
    { "id": "c-1", "name": "Priya Sharma", "initials": "PS", "color": "#C44F3F", "email": "priya.sharma@email.com" }
  ]
}
```
| Field | Notes |
| --- | --- |
| members[] | Lightweight summaries (`id, name, initials, color, email`) resolved from `memberIds`. Empty array if none. |

**Errors:** `404`; `401`/`403`.

---

## Not an API (this page)
- **Call / Email** buttons — UI stubs.
- Member **assignment** is not done here (out of scope for this page).
