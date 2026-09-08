# CLAUDE.md — Engineering Rules (source of truth)

This file is the canonical rulebook for **everyone working in this repo — humans and AI coding agents alike**. `AGENTS.md` points here. If any other doc conflicts with this file, **this file wins**; if the *code* conflicts with this file, treat it as a bug to raise, not a licence to sprawl.

Read this fully before touching any file. It is intentionally short — the detail lives in `docs/`.

---

## What this project is (read this before assuming anything)

NWS ("Nourish with Sim") is a **nutritionist dashboard** (one role — every account is a nutritionist and can also manage the other nutritionists). It started as a **UI-only prototype** (ported from an older vanilla HTML/JS app) and is being progressively hardened into a production frontend.

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

## The FRD is a running document

`NWS-FRD.html` is the signed-off description of what this product does. It is **not** a snapshot taken once at kickoff — it is a living document, and it is only true if it is updated in the same breath as the code.

**Where it lives**

| Thing | Path |
| --- | --- |
| The document | `<NWS working folder>/NWS-FRD.html` |
| Front matter (§1–4.4) | `<NWS working folder>/frd/content_front.py` |
| Web features (§4.5) | `<NWS working folder>/frd/content_web.py` |
| Mobile features (§5) | `<NWS working folder>/frd/content_mobile.py` |
| Renderer + styling | `<NWS working folder>/frd/render.py` |
| Build script | `<NWS working folder>/frd/build.py` |
| Snapshots | `<NWS working folder>/frd-shots/` (`web/`, `mobile/` raw; `opt/` embedded) |

Never hand-edit `NWS-FRD.html`. Edit the content module, then rebuild.

**When to update it — any change, however small**

If you add a feature, change an existing one, alter a validation message, rename a button, reorder a list, change a default, add or remove a field, change a status, or change a design — the FRD must reflect it in the same change. "Too small to document" is not a category that exists here; a renamed button is a changed acceptance criterion.

**What to update — all of it, not just the description**

For every affected feature, walk the whole block:

1. **Title, status badge and `roles`** — `built` / `partial` / `missing` must match reality. A feature you just finished moves to `built`.
2. **`desc`** — what the feature now is.
3. **`story`** — the `(as a, I want to, so that)` triple. If the reason a user wants it changed, the story changes.
4. **`uac`** — the acceptance criteria. Add criteria for new behaviour, edit the ones whose wording no longer matches, and **delete the ones that no longer hold**. Keep the house format: `<Actor> <does something> → System <responds>.` Cite any business rule you depend on by ID (`BR-n`).
5. **`note`** — the "Prototype note". Add one where the build now deviates from the spec; **remove it once the gap is closed**.
6. **`shots`** — recapture the screens the change is visible on and update the captions.
7. **Ripple outward** — if the change touches a rule, a status, a role or a count, update §4.4.6 (business rules), §4.4.7 (status reference), §4.1–4.3 (roles, module access, feature counts) and §6 (open points) to match. A new business rule gets a new `BR-n`; existing IDs are never renumbered.

A new feature is a new dict in the right module's `features` list, with every key populated — an FR block with no user story or no acceptance criteria is not finished.

**Snapshots**

Snapshots are captured from the running prototype, never mocked up. Run the app (`npm run dev`), drive it to the state the feature describes, capture at 2×, then re-run the optimiser so the embedded copy is refreshed. Put web captures in `frd-shots/web/` and phone captures in `frd-shots/mobile/`, named for what they show. A feature with no snapshot must say so through `nopic`, giving the reason — never leave it silently empty.

**Rebuild and verify**

```bash
python frd/build.py
```

The build prints the feature count, the snapshot count and the output size, and **fails loudly if a named snapshot file is missing**. Do not consider the change done until it builds clean and you have opened the result and looked at the section you changed.

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

And if the change altered anything a user or a stakeholder would notice — behaviour, copy, layout, a default, a status — update the FRD content module and re-run `python frd/build.py` before you call it done. See **The FRD is a running document** above.

---

## The rest of the rulebook

- `docs/architecture.md` — how the app is structured and why; layer boundaries.
- `docs/coding-standards.md` — React, TypeScript, naming, components, forms, state, error handling, accessibility, performance, security.
- `docs/api-guidelines.md` — the service layer, request/response/error types, React Query usage, mock strategy.
- `docs/testing.md` — what to test and how.
- `CONTRIBUTING.md` — branch/commit/PR workflow for humans.
- `<NWS working folder>/frd/` — the FRD content modules and build script. Update alongside any user-visible change; see **The FRD is a running document** above.

When unsure: choose **consistency with the surrounding code** over cleverness, and ask rather than assume.
