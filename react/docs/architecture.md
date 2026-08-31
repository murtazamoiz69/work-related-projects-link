# Architecture

How the NWS frontend is structured, and the boundaries you must keep. This describes **what the code actually is today**, and flags where it is heading. When you add code, put it where this document says.

## Big picture

- **Client-side SPA.** Vite + React 18, TypeScript strict. No SSR, no server components, no API routes — everything runs in the browser.
- **Feature-based + Atomic design (mixed, on purpose).** Shared, generic UI lives in `components/` organised by atomic level. Everything domain-specific lives in a self-contained `features/<name>/`.
- **No backend yet.** Data is deterministic seeded mock data (`features/*/data.ts` + `lib/seed.ts`). It will move behind a mock API service layer, then a real API — feature by feature. See `api-guidelines.md`.

## Layers and dependency direction

```
pages/            route containers (thin) — compose features + layout
  └─ features/*   domain logic + domain UI (self-contained)
       └─ components/  shared generic UI (atoms → molecules → organisms → templates)
            └─ lib/, hooks/, store/, styles/   cross-cutting primitives
```

Rules of the arrows (imports point downward only):

- `components/*` (shared UI) must **not** import from `features/*` or `pages/*`. It stays generic.
- `features/*` may import shared `components/*`, `lib/*`, global `store/*`, and **its own** internals.
- A feature imports **another feature only through that feature's `index.ts` barrel** — never reach into its internal files.
- `pages/*` are thin: compose a `Topbar`, a `<main className="content">`, and feature exports. No business logic.

## Folder map

```
src/
  main.tsx, App.tsx            entry: QueryClientProvider + RouterProvider
  routes/                      TanStack Router tree (root, authed guard, login, appRoutes)
  pages/                       one thin component per route
  components/
    atoms/                     single-element UI (Icon, Avatar, Badge, ToggleSwitch)
    molecules/                 2–3 atoms (Modal, ConfirmDialog, NavItem, …)
    organisms/                 composed UI (Sidebar*, Topbar, ErrorBoundary, dropdowns)
    templates/                 layout shells (AppLayout)
  features/<name>/
    components/                feature UI (may itself use atoms/molecules/organisms)
    hooks/                     feature hooks
    api/                       data access: <name>.api.ts + .types.ts + .mock.ts (see api-guidelines.md)
    store.ts                   feature Zustand store (when the feature owns mutable state)
    data.ts                    seeded mock data + derivations (interim source of truth)
    types.ts                   feature domain types (the contract)
    utils.ts                   pure helpers
    index.ts                   public barrel — the ONLY entry other code may import
  hooks/                       app-wide hooks
  lib/                         axios (dormant), env, queryClient, router, seed, toast, utils
  store/                       global stores (auth, theme, shell, notifications)
  styles/                      tokens.css + app.css (frozen) + overrides.css
  test/                        vitest setup
```

## Routing

- **TanStack Router**, manually assembled tree (not file-based): `rootRoute → _authed (guard) → children`, plus a public `/login`.
- The `_authed` pathless layout route renders `AppLayout` and guards via `beforeLoad` reading the auth store. Role-gated routes (e.g. `/nutritionists`, Super Admin only) add their own `beforeLoad` redirect.
- Navigate with `useNavigate()` / `<Link>`. **Never** `window.location`.
- Search params are validated per route (`validateSearch`). Pages read them through the route's typed `useSearch()`.
- Routes are lazy-loaded (`lazy()` + `Suspense`) for code-splitting.

## State model (important — know this before changing state)

State lives in the narrowest scope that works. See `coding-standards.md` for the decision table. Today:

- **Global stores** (`store/*`): `useAuthStore` (session flag + active profile, sessionStorage), `useThemeStore`, `useShellStore`, `useNotificationsStore`.
- **Feature stores** (`features/*/store.ts`): Zustand holding a domain array plus a **`rev` nonce**. The prototype pattern is:
  - `commit()` — you mutated an object **in place**; it bumps `rev` to force a re-render (and persists, where the feature persists).
  - `setX(next)` — you're swapping the array reference (add/remove/reorder); it also bumps `rev`.
  - This "rev-bump / in-place mutation" pattern is a **known prototype smell**. Don't spread it further. When you migrate a feature to the service layer, replace it with immutable updates + React Query cache (see `api-guidelines.md`). Until then, follow the existing pattern within a feature rather than inventing a third way.
- **Local state** (`useState`): everything UI-ephemeral — open/closed, current tab, input drafts, pagination page.
- **Server state**: none yet; will be React Query once services land.

## Data & persistence (interim)

- `features/*/data.ts` generate deterministic data from `lib/seed.ts` off the base `CLIENTS_DATA` roster, so the same entity reads identically across screens. Treat these as the **mock source of truth** and the **shape of the eventual API response** — the `types.ts` are the contracts.
- Persistence is selective and localStorage-based (programs, meal-templates, settings); auth uses sessionStorage. Date fields are revived from JSON strings on load — keep that when you touch persisted shapes.

## Cross-cutting primitives

- `lib/utils.ts` → `cn()` (class merge) and route helpers. `lib/toast.ts` → `showToast()`. `components/atoms/Icon.tsx` → the single lucide wrapper (add icons here, don't import lucide elsewhere).
- Error containment: `ErrorBoundary` wraps the route tree. Async UI must render loading/empty/error states (see `coding-standards.md`), not blank screens.

## Where things go (quick reference)

| You're adding… | Put it in… |
| --- | --- |
| A new screen | `pages/` (thin) + a route in `routes/appRoutes.tsx` |
| Domain logic/UI for a feature | `features/<name>/…` |
| A generic reusable widget | `components/atoms|molecules|organisms/` |
| A layout shell | `components/templates/` |
| App-wide state | `store/` |
| Feature-owned mutable state | `features/<name>/store.ts` |
| Data access (API/mock) | `features/<name>/api/<name>.api.ts` (+ `.types.ts`, `.mock.ts`) |
| A pure helper | nearest `utils.ts` (feature) or `lib/` (app-wide) |
| A domain type | `features/<name>/types.ts` (or `src/types/` if truly shared) |
