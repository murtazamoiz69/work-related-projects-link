# Dashboard API

Covers the **Dashboard** (home). All endpoints are **read-only aggregates**.
Each panel loads independently. See [README.md](./README.md) for conventions.

## Page functionality
- KPI row (caseload snapshot).
- "Catch Up" (needs-attention) list with a **server-side** filter (chips) plus a
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

## `GET /dashboard/needs-attention`
Users needing attention, for the active filter chip.

**Query params**
| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| filter | string (chip key) | `needs-attention` | One of the chip keys returned in `filters[].key` (below). Server filters by it. |

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
  ],
  "counts": { "needs-attention": 26, "new-this-week": 6, "missed-workout-yesterday": 28,
              "missed-diet-yesterday": 31, "logged-meal-today": 11, "logged-workout-today": 12 },
  "filters": [
    { "key": "needs-attention", "label": "Needs Attention", "icon": "message-circle" }
    /* …one per chip */
  ],
  "weekRange": "Aug 24 – 30"
}
```
| Field | Type | Notes |
| --- | --- | --- |
| rows[].client | `Client` | Full client object (see [users.md](./users.md)); embed it so the UI can render + navigate. |
| rows[].icon | string | Icon name for the reason. |
| rows[].text | string | Human-readable reason. |
| rows[].week | `WeekDay[]` | **7 entries** (Sun→Sat) of that user's weekly-progress dots. `tier`: `done` \| `partial` \| `missed` \| `empty` \| `not-joined` \| `joined-today`. `popover` is the hover text; `dayLabel`/`dateLabel`/`dateShort` are display strings. |
| counts | map | Count **per chip key** (for the chip badges) — computed over the whole caseload, independent of the active filter. |
| filters | array | The chip definitions (`key`, `label`, `icon`), server-driven. |
| weekRange | string | Label for the current week (e.g. "Aug 24 – 30"). |

**Errors:** `401`; `500`.

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
