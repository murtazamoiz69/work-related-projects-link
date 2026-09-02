# Dashboard API

Covers the **Dashboard** (home). All endpoints are **read-only aggregates**.
Each panel loads independently. See [README.md](./README.md) for conventions.

## Page functionality
- KPI row (caseload snapshot).
- "Catch Up" (needs-attention) list: **server-side** chips + counts and rows
  (loaded in two steps — chip metadata, then rows for the active chip) plus a
  client-side search box and show-all toggle.
- Cohort "User Progress" chart with **server-side** range + program filters.
- Upcoming plan-expiry list.

---

## `GET /dashboard/kpis`
**Success `200`**
```json
{ "total": 48, "newToday": 1, "mealsLogged": 22, "workoutsLogged": 17 }
```
| Field | Meaning |
| --- | --- |
| total | Total users in the caseload. |
| newToday | Joined in the last 24h. |
| mealsLogged | Users who logged ≥1 meal today. |
| workoutsLogged | Users who logged a workout today. |

**Errors:** `401`; `500`.

---

The Catch Up panel loads in **two steps**: first the chip metadata (which chips
exist, their counts, and which one to open on), then the rows for the active
chip. This way the client never names a filter key it hasn't been told exists.

## `GET /dashboard/attention-filters`
Step 1 — the chip metadata, independent of which chip is active. The client
fetches this first and opens on `defaultKey`.

**Success `200`**
```json
{
  "filters": [
    { "key": "needs-attention", "label": "Needs Attention", "icon": "message-circle" }
    /* …one per chip */
  ],
  "counts": { "needs-attention": 26, "new-this-week": 6, "missed-workout-yesterday": 28,
              "missed-diet-yesterday": 31, "logged-meal-today": 11, "logged-workout-today": 12 },
  "defaultKey": "needs-attention",
  "weekRange": "Aug 24 – 30"
}
```
| Field | Type | Notes |
| --- | --- | --- |
| filters | array | The chip definitions (`key`, `label`, `icon`), server-driven and ordered for display. |
| counts | map | Count **per chip key** (the chip badges) — over the whole caseload, independent of the active chip. |
| defaultKey | string (chip key) | Which chip the client opens on. **Must** be one of `filters[].key`. |
| weekRange | string | Label for the current week (e.g. "Aug 24 – 30"). |

**Errors:** `401`; `500`.

---

## `GET /dashboard/needs-attention`
Step 2 — the users for one chip.

**Query params**
| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| filter | string (chip key) | **yes** | One of the `filters[].key` from `/dashboard/attention-filters`. **422** if missing (the client always sends a key it learned from step 1). |

**Success `200`**
```json
{
  "rows": [
    {
      "client": { /* full Client — see users.md */ },
      "icon": "message-circle",
      "text": "Sent a new message 3 hours ago — awaiting your reply",
      "week": [
        { "daysAgo": 6, "isToday": false, "tier": "done", "popover": "Mon, Aug 25\n…",
          "dayLabel": "Mon", "dateLabel": "Aug 25", "dateShort": "25" }
        /* …7 entries, Sun→Sat */
      ]
    }
  ]
}
```
| Field | Type | Notes |
| --- | --- | --- |
| rows[].client | `Client` | Full client object (see [users.md](./users.md)); embed it so the UI can render + navigate. |
| rows[].icon | string | Icon name for the reason. |
| rows[].text | string | Human-readable reason. |
| rows[].week | `WeekDay[]` | **7 entries** (Sun→Sat) of that user's weekly-progress dots. `tier`: `done` \| `partial` \| `missed` \| `empty` \| `not-joined` \| `joined-today`. `popover` is the hover text; `dayLabel`/`dateLabel`/`dateShort` are display strings. |

**Errors:** `422` (missing/blank `filter`) `{ "message": "A filter key is required." }`; `401`; `500`.

> The Catch-Up **search box** and **"show all / fewer"** are applied
> **client-side** to `rows` — no server param needed for those.

---

## `GET /dashboard/client-progress`
Cohort meal/workout adherence over time.

**Query params**
| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| range | integer (days) | 30 | Client sends `7`, `30`, or `90`. |
| program | string | `all` | `all` or a specific program name. Filters the cohort. |

**Success `200`**
```json
{
  "ticks": ["W1", "W2", "W3", "W4"],
  "tips":  ["Week 1", "Week 2", "Week 3", "Week 4"],
  "activeClients": 44,
  "meals":    { "values": [61, 64, 58, 67], "headline": 67 },
  "workouts": { "values": [55, 60, 52, 63], "headline": 63 }
}
```
| Field | Notes |
| --- | --- |
| ticks / tips | X-axis short labels / tooltip labels. For `range ≤ 7` these are days; otherwise weekly buckets. `ticks.length === values.length`. |
| activeClients | Non-paused users in the (program-filtered) cohort. |
| meals/workouts.values | Percentages (0–100) per bucket. |
| meals/workouts.headline | The latest bucket's percentage (the big number). |

**Errors:** `401`; `500`.

---

## `GET /dashboard/programs`
Distinct program names, for the "User Progress" program dropdown.

**Success `200`**
```json
{ "programs": ["Body Recomposition", "Cardiac Health", "Diabetes Management", "Weight Loss"] }
```
**Errors:** `401`; `500`.

---

## `GET /dashboard/upcoming-expirations`
Users whose plan expires within 7 days, soonest first (max ~8).

**Success `200`**
```json
[
  { "client": { /* full Client */ }, "daysLeft": 1 },
  { "client": { /* … */ }, "daysLeft": 3 }
]
```
| Field | Notes |
| --- | --- |
| client | Full `Client` (see [users.md](./users.md)). |
| daysLeft | Integer days until expiry (0–7). Sorted ascending. |

**Errors:** `401`; `500`.

---

## Not an API (this page)
- Row actions (open chat / message / call / email) — client-side nav + toast stubs.
- Catch-Up search + show-all, and the KPI info tooltips — client-side.
