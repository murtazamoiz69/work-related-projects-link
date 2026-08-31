# AGENTS.md

Operating rules for AI coding agents (Claude Code, Cursor, Copilot Workspace, etc.) working in this repo.

## Canonical rules live in `CLAUDE.md`

**Read [`CLAUDE.md`](./CLAUDE.md) first — it is the single source of truth** for architecture, the current-vs-target reality, the golden rules, and the non-negotiables. Everything below is agent-specific behaviour on top of it; it does not repeat those rules.

## Agent working agreement

1. **Read before you write.** Open the file (and its neighbours) before editing it. Never edit a file you have not read in the current session.
2. **Match the surroundings.** Mirror the existing style: no semicolons, single quotes, `type` over `interface`, union types over enums, `@/` imports. Prettier + ESLint are the arbiters.
3. **Small, scoped diffs.** One task per change. Do not reformat, reorder imports, or "tidy" files you weren't asked to touch — it buries the real change and breaks blame.
4. **Verify, don't assert.** After a change, run `npm run typecheck && npm run lint && npm run test:run` (and `build` for anything non-trivial). Report actual results; never claim green without running it.
5. **Respect the current architecture.** Put code where the existing structure says it goes (`docs/architecture.md`). Don't introduce a new state library, router pattern, folder convention, or data-fetching approach on your own initiative.
6. **Don't touch the frozen files** without explicit instruction: `src/styles/app.css`, `src/styles/tokens.css` (ported verbatim, prettier-ignored) and any `vite.config.*` build plumbing.
7. **Dependencies:** never add, remove, or upgrade a package as a side effect. If a change seems to need one, stop and propose it.
8. **Backend is mock-only.** Do not wire real endpoints or invent API shapes. Follow `docs/api-guidelines.md`; mark every assumed contract with `// ASSUMPTION:`.
9. **Surface, don't silently decide.** When the task is ambiguous, or a "fix" would ripple beyond the stated scope, describe the options and ask — don't pick the largest interpretation.
10. **Preserve behaviour.** UI/UX and business flows stay identical unless the task is explicitly to change them.

## Definition of done for an agent change

- Scoped to the task; no unrelated edits.
- `typecheck`, `lint`, `format:check`, `test:run` pass; `build` passes for non-trivial changes.
- New logic has at least the tests `docs/testing.md` requires.
- The change is explainable in one paragraph: what, where, why.
