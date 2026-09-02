# Meal Templates API

The nutritionist's reusable **meal template library** — the "Save to Library" /
"Add from Library" actions in the Plan Workspace's Diet Plan tab. A template is a
saved week or day of meals that can be applied to any client's plan later.

> **Status today:** client-side only. Templates live in a Zustand store backed by
> `localStorage` (`src/features/meal-templates/store.ts`), with **no backend and
> no MSW handlers**. This document is the proposed contract for the backend team
> — implementing it lets a nutritionist's library sync across devices/sessions.

Shared conventions (auth header, ISO dates, error envelope, status→behavior) are
in [README.md](./README.md). All dates are ISO strings on the wire.

Templates belong to the **authenticated nutritionist** (not a specific client) —
scope every endpoint to the caller; no client id in the path.

---

## `GET /meal-templates`
List the caller's saved templates (newest first).

**Success `200`** — `MealTemplate[]`:
```json
[
  {
    "id": "mtpl-1717000000000-482913",
    "name": "High-protein week",
    "type": "week",
    "createdBy": "Sarah Nolan",
    "createdDate": "2026-08-30T09:12:00.000Z",
    "avgDailyCalories": 1850,
    "days": [
      {
        "dayNum": 1,
        "label": "Monday",
        "meals": [
          { "uid": "me-1", "mealId": "m-oats-berries", "slot": "Breakfast", "time": "08:00" }
        ]
      }
    ]
  }
]
```

**Field reference**
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Server-assigned. |
| name | string | Required; nutritionist-chosen. |
| type | `'week' \| 'day'` | A full-week template or a single reusable day. |
| createdBy | string | Author's display name (from the session). |
| createdDate | string (ISO) | |
| avgDailyCalories | number | Server may recompute from `days`; the client derives it on create. |
| days | `TemplateDietDay[]` | Each: `{ dayNum, label, meals: MealEntry[] }`. `MealEntry` = `{ uid, mealId, slot, time }` — the same shape used in `dietWeeks` in [plan-workspace.md](./plan-workspace.md). `mealId` joins the meal library. |

---

## `POST /meal-templates`
Save a new template (from the current week or day in the workspace).

**Request body**
```json
{
  "name": "High-protein week",
  "type": "week",
  "days": [ { "dayNum": 1, "label": "Monday", "meals": [ /* MealEntry[] */ ] } ]
}
```
`createdBy`, `createdDate`, `id`, and `avgDailyCalories` are set by the server
(the client sends them today, but the server should own id/date/author).

**Success `201`** — the created `MealTemplate`.

**Errors**
| Status | When | Body |
| --- | --- | --- |
| 422 | Empty `name` or no `days` | `{ "message": "…", "fields": { "name": "Name is required." } }` |
| 401 | No/expired session | — |

---

## `DELETE /meal-templates/:id`
Remove a template from the library.

**Success `204`** — no body.

**Errors**
| Status | When | Body |
| --- | --- | --- |
| 404 | Unknown template (or not owned by caller) | `{ "message": "Template not found." }` |
| 401 | No/expired session | — |

---

## Not an API (this page)
- **Applying** a template to a client's plan ("Use Template") is **not** a
  template call — it edits the client's `Workspace` in place (copies the
  template's days into `dietWeeks`) and persists via
  `PUT /clients/:id/plan` (see [plan-workspace.md](./plan-workspace.md)). The
  template library is read-only during apply.
- The **meal library** itself (recipe reference data joined by `mealId`) is local
  reference data, not part of this resource.
