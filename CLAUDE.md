# CLAUDE.md — Engineering Rules (source of truth)

This file is the canonical rulebook for **everyone working in this repo — humans and AI coding agents alike**. `AGENTS.md` points here. If any other doc conflicts with this file, **this file wins**; if the *code* conflicts with this file, treat it as a bug to raise, not a licence to sprawl.

Read this fully before touching any file. It is intentionally short — the detail lives in `docs/`.

---

## What this project is (read this before assuming anything)

NWS ("Nourish with Sim") is a **nutritionist / super-admin dashboard**. It started as a **UI-only prototype** (ported from an older vanilla HTML/JS app) and is being progressively hardened into a production frontend.

**Stack:** Vite · React 18 · TypeScript (strict) · Tailwind 4 · TanStack Router · Zustand · zod · lucide-react.

**Current reality — do not assume otherwise:**

| Topic | Reality today | Where it's going |
| --- | --- | --- |
| Backend | None. Data is in-memory seeded mock arrays in `features/*/data.ts`. | Feature-scoped mock API services (network-realistic), then a real API. |
| Data fetching | Plain reads + Zustand stores. **No React Query in use yet** (it's installed and provided at the root). | **MSW mock → TanStack Query per feature → real API.** Decided. See `docs/api-guidelines.md`. |
| Effects | ~60 `useEffect` for real side effects (DOM class, timers, escape keys). This is fine. | Effects stay for side effects, not data fetching. **After Query lands, prune the effects it makes redundant** (data-refresh / rev-bump ones) — keep the DOM/timer/listener ones. |
| Forms | `react-hook-form` + `zod` in `LoginPage` only; everything else is hand-rolled `useState`. | New/edited forms use rhf + zod. See `docs/coding-standards.md`. |
| `services/` folders | Present but empty (`.gitkeep`). | Populated feature-by-feature. |
| `lib/axios.ts`, `lib/env.ts` | Written but imported by nothing (dormant). `env.ts` will throw at import if `.env` is missing — guard it before wiring. | Activated when the service layer lands. |
| Tests | One file (`lib/utils.test.ts`). | Grown alongside changes. See `docs/testing.md`. |

**Do not "fix" the whole app to match a target state in one pass.** Migrate the surface you're touching, leave the rest working.

---

## Golden rules (general — apply to every change)

1. **Analyze first, modify second.** Understand the code you're about to change and the code around it before editing.
2. **Do not modify unrelated files.** Keep each change scoped to its task. A drive-by refactor in an untouched file belongs in its own PR.
3. **Do not rewrite working code unnecessarily.** Preserve existing UI/UX and business flows unless there is a concrete technical reason or an explicit request. "I'd have written it differently" is not a reason.
4. **Prefer incremental changes.** Small, reviewable diffs over big-bang rewrites.
5. **Follow the existing architecture** (feature-based + atomic design). Don't invent a parallel structure. See `docs/architecture.md`.
6. **Avoid premature abstraction.** Duplicate twice before you extract. Build the abstraction the third caller actually needs, not the one you imagine.
7. **Never invent backend API shapes.** If a contract is unknown, define a typed mock contract and mark the assumption (`// ASSUMPTION:`), don't guess a real endpoint.
8. **No new dependencies without a clear, stated reason.** Prefer what's already here. If you believe a dep is warranted, propose it (name, why, what it replaces) before adding.

## Non-negotiables (enforced by lint/tsconfig — keep them true)

- **`strict` TypeScript.** `any` is banned, non-null assertion `!` is banned, `enum` is banned (use a union or `as const` object). These are ESLint errors, not preferences.
- **Design tokens are the single source of truth** for visual values — colours, spacing, radius, etc. live in `src/styles/tokens.css`. Never hardcode a hex/px that a token exists for.
- **`src/styles/app.css` and `tokens.css` are ported verbatim and are prettier-ignored.** Don't reformat or casually restructure them.
- **Use the `@/` path alias**, `useNavigate`/`<Link>` (never `window.location`), and the shared `cn()` util for class merging.

## Before you call a change done

Run and pass all of:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run format:check
npm run test:run    # vitest run
npm run build
```

Never claim work is complete without the relevant commands passing. Report failures honestly with their output.

---

## The rest of the rulebook

- `docs/architecture.md` — how the app is structured and why; layer boundaries.
- `docs/coding-standards.md` — React, TypeScript, naming, components, forms, state, error handling, accessibility, performance, security.
- `docs/api-guidelines.md` — the service layer, request/response/error types, React Query usage, mock strategy.
- `docs/testing.md` — what to test and how.
- `CONTRIBUTING.md` — branch/commit/PR workflow for humans.

When unsure: choose **consistency with the surrounding code** over cleverness, and ask rather than assume.
