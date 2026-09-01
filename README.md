# NWS — Nourish with Sim

Nutritionist / super-admin dashboard for **NWS (Nourish with Sim)**. Started as a
UI-only prototype (ported from an older vanilla HTML/JS app) and progressively
hardened into a production frontend with network-realistic mock APIs.

**Stack:** Vite · React 18 · TypeScript (strict) · Tailwind 4 · TanStack Router ·
TanStack Query · Zustand · zod · MSW · Vitest + Testing Library · lucide-react.

The application lives at the repository root (previously under `react/`; the old
standalone `html/` mockups have been removed).

## Getting started

```bash
npm install          # first time only
cp .env.example .env  # optional — safe dev defaults exist without it
npm run dev           # dev server (http://localhost:5173), MSW mocks on
npm run build         # production build -> dist/
npm run preview       # preview the production build
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with MSW mock backend (`VITE_USE_MOCKS` on in dev) |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run build:single` | Single-file demo build (`dist-single/`) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc -b` (no emit) |
| `npm run lint` | ESLint (strict: no `any`/`!`/`enum`, jsx-a11y, import/no-cycle) |
| `npm run format` / `format:check` | Prettier write / check |
| `npm run test` / `test:run` | Vitest (watch / once) |

Before calling a change done, run: `typecheck`, `lint`, `format:check`,
`test:run`, `build` — all should pass.

## Architecture at a glance

Feature-based + atomic design. Data flows one direction:

```
component → hook (TanStack Query) → features/<name>/api/*.api.ts → lib/api/client.ts → MSW mock ⇄ real backend
```

- `src/features/*` — feature modules (clients, nutritionists, dashboard, settings,
  auth, chat + plan-workspace), each owning its `api/`, `hooks/`, `components/`.
- `src/components/{atoms,molecules,organisms,templates}` — shared UI.
- `src/lib/api/*` — the single HTTP client, error normalization, env, auth seam.
- `src/mocks/*` — MSW worker + handlers (dev/test only; dynamically imported so
  they never load in a real-backend build).

## Documentation

| Doc | Purpose |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Canonical engineering rules (humans + AI agents) |
| [`AGENTS.md`](./AGENTS.md) | Pointer for coding agents |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Branch / commit / PR workflow |
| [`docs/architecture.md`](./docs/architecture.md) | Structure, layers, boundaries |
| [`docs/coding-standards.md`](./docs/coding-standards.md) | React / TS / naming / forms |
| [`docs/api-guidelines.md`](./docs/api-guidelines.md) | Service layer, error types, React Query, mocks |
| [`docs/testing.md`](./docs/testing.md) | What to test and how |
| [`docs/api/*`](./docs/api) | Per-page backend API contracts (for the real backend) |
| [`docs/specs/*`](./docs/specs) | Per-page functional specs |
| [`docs/production-readiness-review.md`](./docs/production-readiness-review.md) | Senior-architect review, scores, remediation plan |

## Status

Testing: **225 tests across 23 files** (unit + integration + route-guard +
API-contract), all green. See the
[production readiness review](./docs/production-readiness-review.md) for scores
and the remediation plan toward a real-backend production release.

## Repository

- Remote: `gitlab.siamcomputing.com/siamcomputing-projects/prototype/2026/nws/nws-app`
