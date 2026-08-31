# API Guidelines

There is **no backend yet**. Data lives in `features/*/data.ts` as seeded mock arrays. This document defines how we introduce a **data-access layer** so that:

1. Components never talk to the network directly.
2. Swapping mock → real backend is a transport change, not a rewrite.
3. Every feature migrates independently and incrementally.

Until a feature is migrated, its existing `data.ts` + store pattern stays as-is. **Do not rewrite all features at once.**

---

## The layered contract

```
Component
  → feature hook          useClientsQuery() / useUpdateClientMutation()
      → React Query        cache, request states, retries, invalidation
          → api module     clients.api.ts   — pure typed functions, one per operation
              → transport  mock harness (now)  ⇄  apiClient/axios + MSW (later)  — same interface
```

Rules:
- **Components import hooks, never the api module or the transport.**
- **The api module holds pure typed async functions.** No React, no hooks, no toasts inside them. They take typed input, return typed domain output (or reject with a typed `ApiError`).
- The **transport is swappable**: today the mock harness (`lib/api/mock.ts`); later `lib/axios` with MSW. The api module depends on the transport, not on which one is wired.

---

## Where code goes

Each feature owns an `api/` folder (see `src/features/clients/api/` for the reference implementation):

| Piece | Location |
| --- | --- |
| Service functions (the interface) | `features/<name>/api/<name>.api.ts` |
| API request / response (DTO) types | `features/<name>/api/<name>.types.ts` |
| Mock fixtures + the 9 scenarios | `features/<name>/api/<name>.mock.ts` (MSW handlers wire from these) |
| Domain types | `features/<name>/types.ts` (unchanged; the `.api.ts` mapper converts DTO → domain) |
| UI-only types | with the component that uses them |
| Query/mutation hooks | `features/<name>/hooks/use<Name>Query.ts` / `use<Name>Mutation.ts` |
| Query keys | `features/<name>/api/<name>.keys.ts` (or top of the api module) |
| Shared API primitives | `lib/api/types.ts` (`ApiError`, `Paginated<T>`, …) + `lib/api/mock.ts` |
| Transport (real) | `lib/axios.ts` (already scaffolded — activate + guard `lib/env.ts` first) |

## Mock strategy (transport) — MSW

**Decided: MSW (Mock Service Worker).** The app calls a real transport (`fetch` / `axios`); MSW intercepts at the network layer and serves responses out of today's `data.ts`. This gives real status codes, latency, error/offline simulation, and DevTools visibility — and, crucially, means the same component → hook → service → transport code runs **unchanged** when a real API replaces the handlers. MSW is a **dev/test dependency**; add it when the first feature migrates (propose it in that PR).

The mock must stay **network-realistic**: artificial latency, the ability to return errors/empty results, and it must be toggleable (e.g. `VITE_USE_MOCKS`) so the same code path runs against a real backend later. Mark every assumed contract with `// ASSUMPTION:`.

**Sequence:** stand up MSW → adopt **TanStack Query** per feature (via the hooks below) → **then** remove the `useEffect`s that Query makes redundant (see the checklist). Do this feature by feature, not all at once.

---

## Endpoint & operation naming

- REST-ish, resource-plural, lowercase-kebab paths: `/clients`, `/clients/:id`, `/clients/:id/notes`, `/programs/:id`, `/nutritionists`.
- Service function names read as operations: `getClients`, `getClient`, `createClient`, `updateClient`, `setClientAccess`, `extendClientProgram`. Verb-first, domain-worded.
- Query keys are structured and stable: `['clients']`, `['clients', id]`, `['clients', id, 'notes']`.

## Request & response types

- **Response types match the payload exactly** and live with the service. Domain/UI types derive from them — don't hand-maintain a divergent copy.
- **Request types** are explicit (`type UpdateClientRequest = { … }`), reusing the zod form schema's `z.infer` where a form drives the call, so validation and payload share one shape.
- Dates: the mock/API boundary is where JSON strings become `Date`s (mirror the existing date-revival in `data.ts`). UI works with `Date`.

## Error handling

- Model expected outcomes as **typed errors**, not bare throws the caller must guess at:

  ```ts
  export type ApiError = {
    kind: 'network' | 'timeout' | 'unauthorized' | 'not-found' | 'validation' | 'server' | 'unknown'
    message: string
    status?: number
    fields?: Record<string, string>   // for 'validation'
  }
  ```
- The transport/service **normalises** raw failures (axios error, aborted fetch) into `ApiError`. Components/hooks branch on `kind`, not on `error.response?.status` scattered everywhere.
- `catch (e)` uses `unknown` and narrows. Never `catch (e: any)`.
- UI mapping: `validation` → field errors; `unauthorized` → the 401 flow (below); `network`/`timeout` → retry affordance; everything else → error state + toast. Never swallow.

## Authentication

- One place attaches the token: the `lib/axios` request interceptor (`Authorization: Bearer …`). Components never read the token.
- **401 flow:** the response interceptor clears the token and redirects to `/login` (scaffolded). Keep it centralised; don't duplicate 401 handling in features.
- Reconcile the current mismatch when activating: `axios.ts` expects a token in `localStorage`, while today's demo auth only sets a `sessionStorage` flag. Real auth work aligns these — don't half-wire it.

## Request states

Every data-driven surface renders all of: **loading (skeleton) · error (with retry) · empty · success**. This is not optional — see `coding-standards.md` › Error Handling. React Query gives you `isPending`/`isError`/`data`; map each to a state. No blank screens.

## Retries

- Reads: React Query bounded retry (the root `queryClient` sets `retry: 1`, `refetchOnWindowFocus: false`, `staleTime: 60s` — respect these defaults; override per-query only with reason).
- Mutations: **do not auto-retry** non-idempotent writes. Surface the failure and let the user retry deliberately.

## Cancellation

- Pass React Query's `signal` into the transport (`fetch(url, { signal })` / axios `signal`) so navigating away or a superseding query aborts in-flight requests. Don't leave orphaned requests updating unmounted UI.

## Caching & invalidation

- React Query is the **only** cache for server data — don't build a parallel Zustand cache for fetched entities.
- **Every mutation invalidates the queries it affects** and shows a success/error toast (this is a hard rule). Prefer `invalidateQueries` over manual cache surgery unless you have a measured reason (optimistic update) to do otherwise; if you do optimistic updates, roll back on error.
- Derive, don't duplicate: compute filtered/sorted views from cached data in selectors/`useMemo`, not by caching a second derived copy.

---

## Migration checklist (per feature)

1. Define/confirm response & request types from the current `data.ts` shapes (`types.ts` is the contract).
2. Write `<name>.api.ts` returning `Promise`s via the transport; back it with `<name>.mock.ts` fixtures (MSW serves them once wired).
3. Add query/mutation hooks with keys; wire loading/error/empty/success in the UI.
4. Replace direct `data.ts` reads and the store's rev-bump mutations with the hooks (immutable updates via cache).
5. **Prune now-redundant `useEffect`s** — ones that only fetched/refreshed data or forced a re-render (`refresh()`/rev-bump) become unnecessary once Query owns the data. **Keep** effects doing real side effects (DOM class toggles, timers, listeners, focus, `Escape` handling). Remove only what is genuinely dead.
6. Keep UI/behaviour identical; add tests per `docs/testing.md`.
7. Leave other features untouched.
