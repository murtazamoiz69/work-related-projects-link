# NWS API Contracts — for the Backend Team

These documents specify the HTTP API the NWS nutritionist frontend expects. The
frontend currently runs against a **mock** implementation (MSW) built to these
exact shapes; this folder is the spec to build the **real** backend against. If
the real API matches these contracts, the frontend needs **zero changes** — it
switches over by pointing `VITE_API_URL` at the real server and disabling mocks
(`VITE_USE_MOCKS=false`).

> Endpoints, params, bodies, and response shapes below are **PROPOSED** — they
> were derived from the frontend's needs and the prototype's seed data, not from
> an existing backend. Treat them as the required contract; flag anything that
> conflicts with backend constraints so we can reconcile.

## One doc per page/feature

| Doc | Page / feature | Base resource |
| --- | --- | --- |
| [auth.md](./auth.md) | Login / session | `/auth/*` |
| [users.md](./users.md) | Users (Clients) roster | `/clients` |
| [nutritionists.md](./nutritionists.md) | Nutritionists (Super-Admin) | `/nutritionists` |
| [programs.md](./programs.md) | Program (single global) + reference libraries | `/program`, `/libraries` |
| [dashboard.md](./dashboard.md) | Dashboard | `/dashboard/*` |
| [settings.md](./settings.md) | Settings | `/me/*` |
| [chat.md](./chat.md) | Chat conversations | `/conversations` |
| [plan-workspace.md](./plan-workspace.md) | Plan Workspace | `/clients/:id/plan` |
| [meal-templates.md](./meal-templates.md) | Meal template library (proposed) | `/meal-templates` |

---

## Conventions (apply to every endpoint)

### Base URL
All paths are relative to the API base (`VITE_API_URL`), e.g. `GET /clients` →
`https://api.example.com/clients`.

### Content type
Requests and responses are `application/json; charset=utf-8`.

### Authentication
- `POST /auth/login` returns an **access token** (see [auth.md](./auth.md)).
- The frontend sends it on every request as `Authorization: Bearer <token>`.
- On **HTTP 401** from any endpoint the frontend clears the token and redirects
  to the login screen — so return 401 whenever the token is missing/expired/invalid.
- Role-gated endpoints (Super-Admin only, e.g. all of `/nutritionists`) must
  return **403** for authenticated-but-unauthorised users. Do **not** rely on the
  client to enforce roles — it guards the UI only.

### Dates
All timestamps on the wire are **ISO 8601 strings** (e.g.
`"2026-09-01T14:03:00.000Z"`). The frontend parses them to `Date`. Send dates as
ISO; accept ISO in request bodies.

### Pagination envelope
List endpoints that paginate return:
```json
{ "items": [ /* ... */ ], "total": 48, "page": 1, "pageSize": 12 }
```
- `page` is **1-based**. `pageSize` defaults to **12** if the client omits it.
- `total` is the count **after filters** (so the client can compute page count).
- Filtering and sorting are applied **server-side, before** pagination.

### Error format
On any non-2xx, return the appropriate **HTTP status code** and a JSON body:
```json
{ "message": "Human-readable summary.", "fields": { "email": "Email is required." } }
```
- `message` (required): shown to the user (toast) or as a form-level error.
- `fields` (optional): only for **validation** errors (400/422) — a map of
  `requestFieldName → message` the frontend attaches to that form field.
- The frontend maps status → an internal error "kind":

| HTTP status | Meaning (frontend behaviour) |
| --- | --- |
| 400 / 422 | validation — show `fields` on the form |
| 401 | unauthorized — clear token, go to login |
| 403 | forbidden — show "no permission" |
| 404 | not-found |
| 409 | conflict (e.g. duplicate email, concurrent edit) |
| 5xx | server error — generic retry |
| (no response) | network/timeout — retry affordance |

### Request cancellation
The frontend may abort in-flight GETs (navigation/superseding queries). Handle
client aborts gracefully; no special response needed.

### Caching / freshness
The frontend caches reads (React Query, ~60s stale) and refetches after
mutations. Mutations should return the **updated resource** so the client can
update its cache without an extra round-trip.

---

## What is NOT an API (built client-side / local — do not implement)

These are handled entirely in the frontend today; each page doc repeats the ones
relevant to it. Listed here so the backend scope is unambiguous:

- **Saved meal templates** ("Save to Library" / "Add from Library") — a Zustand
  store backed by `localStorage`, no MSW. Contract proposed in
  [meal-templates.md](./meal-templates.md) but **not yet wired**.
- **Chat AI suggestion chips** — currently a local pool; could become an endpoint.
- **Chat live updates** (typing indicator, incoming AI/client messages) — the
  frontend expects these via **websocket or polling**, not REST. See
  [chat.md](./chat.md) § Realtime.
- **Some list filtering/search is client-side** where noted (**Chat search** and
  active-tab row filtering, Dashboard "Catch Up" search, activity-log filters) —
  the server returns the full set and the client filters. Where filtering **or a
  count** is **server-side** (Users, Nutritionists, Dashboard cohort filters, the
  Dashboard Catch Up chips, and the **Chat tab counts** — `GET /conversations/tabs`)
  it is called out explicitly.
- **Call / Email** row actions are UI stubs.
- **Settings → Profile** (name/email/avatar) is not yet an endpoint (belongs with
  auth; see [settings.md](./settings.md) and [auth.md](./auth.md)).

> **Now served by an API (previously in this list):** the **reference catalogs**
> (exercise/meal/workout-template libraries) are `GET /libraries`
> ([programs.md](./programs.md)), and the **client-detail "At a glance" tracker /
> AI summary** is `GET /clients/:id/detail` ([users.md](./users.md)) —
> backend-computed, no longer derived in the client.
