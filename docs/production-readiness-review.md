# Production Readiness Review

A senior-frontend-architect review of the NWS nutritionist panel as it stands
after the prototype → production migration. Read-only assessment: scores,
findings by severity, and a prioritized remediation plan.

- **Reviewed:** 2026-09-01
- **Branch:** `feature-predevelopment`
- **Snapshot:** ~224 source files, ~23.5k LOC · 225 tests / 23 files · 15 runtime deps ·
  build clean · lint 0 errors (6 benign warnings) · `npm audit --omit=dev` 0
  vulnerabilities (full audit reports dev-tooling advisories only)

---

## Scores

| Domain | Score | Summary |
|---|---|---|
| Architecture | **8 / 10** | Clean feature + atomic layering, enforced no-cycle; a few cross-feature reaches |
| Code Quality | **8 / 10** | Strict TS enforced, low duplication; complexity concentrated in a few 550–600-line files |
| API Architecture | **9 / 10** | Centralized client, normalized errors, React Query caching/optimism/cancellation, swappable transport |
| Security | **5 / 10** | Token in `localStorage`, mock seed data present in prod build, no real auth yet |
| Performance | **6 / 10** | Route splitting present, but barrel imports drag seed data into chunks, no virtualization, ~150 kB gz entry |
| Accessibility | **6.5 / 10** | Real foundation (focus traps, keyboard cards, labels); ~44 interaction warnings deferred, a few gaps |
| Testing | **8 / 10** | Strong unit + integration + route + API-contract; no true E2E, no CI |
| Developer Experience | **7 / 10** | Excellent docs + scripts; the gate is run manually — no CI, no pre-commit hooks |

**Weighted overall: ~7.2 / 10** — solidly past prototype, not yet production-hardened.
Blockers are concentrated in Security and the missing automation/E2E layer, not in
the app's architecture (which is strong).

---

## Strengths (preserve)

- **API layer.** [`src/lib/api/client.ts`](../src/lib/api/client.ts) is the only
  axios consumer; [`errors.ts`](../src/lib/api/errors.ts) `normalizeError` maps 9
  error kinds; React Query provides dedup, `keepPreviousData`, optimistic updates +
  rollback (chat send, settings toggles), cache invalidation, and `AbortSignal`
  cancellation forwarded from queries. Mock ⇄ real swaps at the MSW transport.
- **Architecture.** Feature-based + atomic design; one-directional
  `component → hook → api → client`; DTO↔domain mappers at a single boundary;
  `import/no-cycle` enforced in lint.
- **Type safety.** `any`, non-null `!`, and `enum` are lint errors; zero
  `@ts-ignore` / `as any` in source.
- **Docs & DX baseline.** Architecture, coding-standards, API guidelines, testing,
  per-page API contracts, and specs — onboarding is well served.

---

## Findings by severity

### Critical (must fix before production)

1. **No real authentication.** Demo login accepts any password; the token is a mock
   string. Expected at this phase, but it is the #1 gate to "production".
2. **Access token in `localStorage`** ([`src/lib/api/auth.ts`](../src/lib/api/auth.ts)).
   XSS-readable. The real backend should issue an **httpOnly, Secure, SameSite**
   cookie; the seam is ready but the storage choice is unsafe for real tokens.
3. **No CI pipeline.** The full gate (`typecheck` / `lint` / `format:check` /
   `test:run` / `build`) is run by hand — nothing enforces it on push/PR.
4. **Mock backend ships in the production build.** MSW is correctly dynamic-imported
   (not loaded at runtime when `VITE_USE_MOCKS=false`), but the handler + seed-data
   chunks are still emitted to `dist/` (e.g. the MSW `browser` chunk ~306 kB, the
   `*.mock` chunks). A real deploy would serve seed data as dead, fetchable chunks.

### High priority

5. **No end-to-end tests.** Coverage is unit + integration (RTL + MSW) + a
   router-integration suite, but no Playwright/Cypress driving a real browser
   through login → roster → chat → publish.
6. **Barrel imports bundle large seed data.** `ActivityLogList` pulls
   `@/features/programs` and lands a ~192 kB (67 kB gz) chunk — the exercise/meal
   libraries dragged in via the barrel. Import from specific modules or split data
   from logic.
7. **No list virtualization.** Rosters paginate at 12 (fine), but the chat
   conversation list (48) and activity logs render every row. Fine now; grows worse.
8. **~44 interaction-pattern a11y items deferred to warnings** (drag-drop rows, some
   backdrops). Tracked and documented, but keyboard drag-reorder in the plan
   workspace is genuinely inaccessible.

### Medium priority

9. **Inline form errors aren't announced.** Login and Settings render errors as
   plain `<p class="is-error">`, not `role="alert"` / `aria-live`. (Roster/panel
   error states already use `role="alert"`.)
10. **2FA toggle has no accessible name** in [`SettingsPage`](../src/pages/SettingsPage.tsx)
    — a bare checkbox, unlike the labeled notification toggles.
11. **No error UI for failed GETs in Settings** — notification-prefs / practice
    failures silently degrade instead of an alert + retry like the roster pages.
12. **KPI panel swallows fetch errors** — degrades to `0`s with no error affordance
    (the other three dashboard panels retry).
13. **A few large files** — `PlanWorkspaceOverlay.tsx` (~598), `SettingsPage.tsx`
    (~557). Readable but at the edge; complexity concentrated in plan-workspace.

### Nice to have

14. Pre-commit hooks (husky + lint-staged) to run lint/format/typecheck locally.
15. Bundle-size budget / visualizer in CI to catch regressions.
16. CSP `<meta>` + security-header guidance for the deploy target.
17. 6 `react-refresh/only-export-components` warnings (structural, benign).
18. Remaining plan-workspace picker tests only if belt-and-suspenders is wanted
    (patterns already proven for the representative modals).
19. Per-route error boundaries (currently one root boundary).

---

## Remediation plan (prioritized)

### Phase A — Ship-blockers
- **A1.** Add **CI** (e.g. GitHub Actions / GitLab CI): run
  `typecheck → lint → format:check → test:run → build` on every PR.
- **A2.** Exclude mocks/seed data from the real production build (verify tree-shake
  or a `mode`-gated entry); keep them for the demo / single-file build.
- **A3.** Document + implement the **auth cutover contract**: real login endpoint,
  httpOnly-cookie token handling (switch `auth.ts` off `localStorage`), refresh flow.

### Phase B — Hardening
- **B1.** Add **E2E smoke** (Playwright): login → Users filter → open chat → send
  message → open plan workspace → publish.
- **B2.** Fix the **barrel-bloat** chunk (split `features/programs` data from its API
  surface); re-measure bundle.
- **B3.** A11y close-out: `role="alert"` / `aria-live` on inline form errors, label
  the 2FA toggle, and decide the interaction-pattern warnings (fix backdrops or
  formally accept them).

### Phase C — Polish
- **C1.** Error affordances for Settings GET failures + the KPI panel (match the
  roster retry pattern).
- **C2.** Pre-commit hooks; bundle-size budget in CI.
- **C3.** Virtualize the chat list + activity log; add per-route error boundaries.
- **C4.** Refactor the two largest files if they keep growing.

**Rough order of value:** A1 → A2 → A3 → B1 → B3 → B2 → C\*.

---

## Test coverage map

| Area | Coverage |
|---|---|
| Pages | Users, Login, Nutritionists, Dashboard, Settings, Chat |
| Forms | Extend program, Nutritionist create/edit, Login, change-password, practice |
| Chat panels | ClientOverview, ActivityLog, ProgramProgress |
| Plan Workspace | clinical engine (unit), overlay shell, meal-picker + workout-editor + edit-plan + publish modals |
| Routing | guards + `validateSearch` (real memory-router integration) |
| API layer | every feature (contract/behavior) |

Intentionally untested: redundant plan-workspace pickers/preview and tab
drag/duplicate/remove glue — they repeat patterns already proven.
