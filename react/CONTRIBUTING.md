# Contributing

How humans work in this repo. Agents: see [`AGENTS.md`](./AGENTS.md). Rules: see [`CLAUDE.md`](./CLAUDE.md).

## Prerequisites

- Node 20+ and npm.
- Work happens inside `react/`.

## Setup

```bash
cd react
npm install
cp .env.example .env   # then fill in values
npm run dev            # http://localhost:5173
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server. |
| `npm run build` | Type-check + production build. |
| `npm run build:single` | Self-contained single-file / artifact build. |
| `npm run preview` | Preview the production build. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint. |
| `npm run format` / `format:check` | Prettier write / check. |
| `npm run test` / `test:run` | Vitest watch / single run. |

## Branching

- Branch off the current integration branch, never commit directly to it.
- Names: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`, `docs/<short-desc>`.

## Commits

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`.
- One logical change per commit. Keep unrelated changes out.
- Write messages that explain **why**, not just what.

## Pull requests

Keep PRs small and single-purpose. A PR is ready when:

- [ ] Scope matches the description — no unrelated file changes.
- [ ] `typecheck`, `lint`, `format:check`, `test:run` all pass locally.
- [ ] `build` passes (for anything beyond docs/trivial).
- [ ] New logic (utils, hooks, stores, services) has tests per [`docs/testing.md`](./docs/testing.md).
- [ ] No new dependency added without it being called out and justified in the PR description.
- [ ] UI/UX and existing flows are unchanged, unless the PR is explicitly about changing them (include before/after for UI changes).
- [ ] Accessibility basics hold for any new interactive UI (see `docs/coding-standards.md`).
- [ ] Design tokens used instead of hardcoded visual values.

## Review

- Reviewers check scope discipline first: does the diff do only what it claims?
- Prefer "make this smaller" over "add more" — incrementalism is a feature.
- See [`docs/`](./docs) for the standards a review is held against.

## Don't

- Reformat or restructure `src/styles/app.css` / `tokens.css` (frozen, prettier-ignored).
- Rewrite working modules "for cleanliness" in an unrelated PR.
- Introduce a new state/router/data-fetching pattern unilaterally — raise it first.
