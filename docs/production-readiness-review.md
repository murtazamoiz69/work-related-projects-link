# Production Readiness Review

A senior-frontend-architect review of the NWS nutritionist panel after the
prototype → production migration: scores, findings by severity, remediation
status, and a backend-integration readiness assessment.

- **First reviewed:** 2026-09-01
- **Revised:** 2026-09-02 — after Phase A/B/C frontend remediation (see
  [Remediation status](#remediation-status)).
- **Branch:** `feature-predevelopment`
- **Snapshot:** ~226 source files, ~23.6k LOC · **228 tests / 23 files** ·
  15 runtime deps · build clean · lint 0 errors (6 benign warnings) ·
  CI enforces the full gate · bundle within budget (entry ~146 KB gz,
  total ~280 KB gz) · `npm audit --omit=dev` 0 vulnerabilities (full audit
  reports dev-tooling advisories only).

---

## Scores

Two numbers where a score moved after remediation: **initial → current**.

| Domain | Score | Summary |
|---|---|---|
| Architecture | **8 / 10** | Clean feature + atomic layering, enforced no-cycle; a few cross-feature reaches and client-side seed derivations remain |
| Code Quality | **8 / 10** | Strict TS enforced, low duplication; complexity concentrated in a few 550–600-line files |
| API Architecture | **9 / 10** | Centralized client, normalized errors, React Query caching/optimism/cancellation, swappable transport |
| Security | 5 → **6 / 10** | Mocks now excluded from the prod build; still capped by no real auth + `localStorage` token + no CSP |
| Performance | 6 → **7 / 10** | Prod bundle 1.4M→1.1M (MSW dropped), programs data tree-shakeable, bundle budget in CI; virtualization deferred (premature at current scale) |
| Accessibility | 6.5 → **7.5 / 10** | Form errors now announced (`role="alert"`), 2FA labelled; interaction-pattern warnings formally accepted |
| Testing | 8 → **8.5 / 10** | 228 tests, CI now runs the gate on every push/MR; no true E2E (deferred) |
| Developer Experience | 7 → **9 / 10** | CI pipeline, pre-commit hooks (husky + lint-staged), bundle budget, integration runbook below |

**Weighted overall: ~7.2 → ~7.9 / 10.** The frontend is well past prototype and
the ship-blockers under frontend control are closed. The remaining gate to true
production is **backend-dependent**: real auth, and the backend owning the data
that is still derived client-side (see below).

---

## Remediation status

Seven frontend items shipped on `feature-predevelopment`, each its own commit,
full gate green each time.

| Item | Status | Commit |
|---|---|---|
| **A1** CI pipeline (typecheck/lint/format/test/build on push + MR) | ✅ shipped | `04e6ebe` |
| **A2** Exclude MSW mock backend from the production build | ✅ shipped | `898cb47` |
| **A3** Real auth cutover (httpOnly cookie, refresh) | ⛔ backend-blocked | — |
| **B1** E2E (Playwright) smoke flows | ⏸ deferred (decision) | — |
| **B2** Make programs data tree-shakeable (extract session store) | ✅ shipped | `46d2ed4` |
| **B3** Announce form errors (`role="alert"`) + label 2FA toggle | ✅ shipped | `4e86d96` |
| **C1** Error + retry affordances (KPI panel, Settings GETs) | ✅ shipped | `eb99ab0` |
| **C2** Pre-commit hooks + bundle-size budget | ✅ shipped | `b087fd6` |
| **C3** Per-route error boundaries | ✅ shipped | `51d956e` |
| C3 List virtualization | ⏸ deferred — premature at ~48 items + new dep | — |
| **C4** Refactor the two largest files | ⏸ deferred — files stable; conditional trigger unmet | — |

**Deferred, with rationale (not omission):** A3 needs the backend; B1 was a
deliberate scope decision; C3-virtualization and C4 would add churn/deps against
the project's own "no premature optimization / no unnecessary rewrites" rules.

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
- **Docs, tests & automation.** Architecture, coding-standards, API guidelines,
  testing, per-page API contracts, specs; 228 behavior tests; CI + pre-commit
  hooks now enforce the gate.

---

## Findings by severity

Status tags: ✅ resolved · ⛔ backend-blocked · ⏸ deferred (rationale) · ▫ open.

### Critical (must fix before production)

1. ⛔ **No real authentication.** Demo login accepts any password; the token is a
   mock string. The #1 gate to "production" — needs the backend (A3).
2. ⛔ **Access token in `localStorage`** ([`auth.ts`](../src/lib/api/auth.ts)).
   XSS-readable. The real backend should issue an **httpOnly, Secure, SameSite**
   cookie; the seam is ready, the storage choice is not safe for real tokens.
3. ✅ **No CI pipeline.** — Resolved (`04e6ebe`): `.gitlab-ci.yml` runs the full
   gate on every push and MR.
4. ✅ **Mock backend ships in the production build.** — Resolved (`898cb47`): a
   compile-time guard drops MSW + handlers from `vite build` (dist 1.4M→1.1M);
   the demo build keeps mocks. *Residual:* the seed data itself is still present
   via client-side derivations — bounded by finding #14, not the build config.

### High priority

5. ⏸ **No end-to-end tests.** Unit + integration (RTL + MSW) + router-integration
   are strong; a Playwright smoke layer (login → roster → chat → publish) is
   deferred as a separate task.
6. ✅ **Barrel imports bundle large seed data.** — Resolved (`46d2ed4`): a
   module-level side effect in `programs/data.ts` was defeating tree-shaking;
   moving the session store to `programs/store.ts` fixed it. The 192 kB duplicate
   chunk is gone; the libraries now live only where genuinely used.
7. ⏸ **No list virtualization.** Deferred — premature at ~48 conversations / small
   activity logs, and would add a dependency. Revisit if data volumes grow.
8. ⏸ **~44 interaction-pattern a11y items** (drag-drop rows, backdrop
   click-to-close). Formally accepted with documented rationale in
   `eslint.config.js` (Escape + sibling controls exist); a dedicated keyboard-DnD
   pass is out of scope.

### Medium priority

9.  ✅ **Inline form errors aren't announced.** — Resolved (`4e86d96`):
    `role="alert"` on every inline form error (login, settings, all form modals).
10. ✅ **2FA toggle has no accessible name.** — Resolved (`4e86d96`): `aria-label`
    added.
11. ✅ **No error UI for failed GETs in Settings.** — Resolved (`eb99ab0`):
    notification-prefs and practice now show an error + retry.
12. ✅ **KPI panel swallows fetch errors.** — Resolved (`eb99ab0`): shows the
    roster error + retry block instead of zeroed cards.
13. ⏸ **A few large files** — `PlanWorkspaceOverlay.tsx` (~598),
    `SettingsPage.tsx` (~600). Stable and cohesive; refactor only if they grow.

### Nice to have

14. ✅ Pre-commit hooks (husky + lint-staged) — shipped (`b087fd6`).
15. ✅ Bundle-size budget in CI — shipped (`b087fd6`, `scripts/check-bundle-size.mjs`).
16. ▫ CSP `<meta>` + security-header guidance for the deploy target — open.
17. ▫ 6 `react-refresh/only-export-components` warnings (structural, benign).
18. ⏸ Remaining plan-workspace picker tests — patterns already proven.
19. ✅ Per-route error boundaries — shipped (`51d956e`).

---

## Backend integration readiness

**Is the frontend ready to be pointed at a real backend? The integration seam is
built; it is an incremental, per-feature cutover — not a single flip-the-switch.**

### Ready — the seam is in place
- Central HTTP client (`baseURL` from `VITE_API_URL`, timeout, cancellation,
  auth header, error normalization).
- Per-feature typed API layer + DTO↔domain mappers — the integration surface;
  components never touch HTTP.
- React Query hooks (caching, optimism, invalidation) already consume it.
- Typed `ApiError` (9 kinds) + the 401 logout/redirect seam.
- Env switch: `VITE_USE_MOCKS=false` + `VITE_API_URL=<real>`; MSW excluded from
  the prod build.
- The spec to hand the backend: [`docs/api/`](./api) (one contract per page); the
  MSW handlers encode the same shapes and status codes; tests pin the behavior.

### Not ready — must happen for real integration
1. **The backend has to be built to the documented contracts.** The mock defines
   the shapes; nothing serves them for real yet.
2. **Client-side "backend logic" + direct seed reads** (largest remaining
   migration). Still computed in the browser from the 48-client seed: plan
   derivation (`getWorkspace` / `deriveClinicalProfile`), the clinical engine
   (`mealConflicts` / `computeTargets`), the dashboard builders, and chat
   conversation construction. Several components also read the seed **directly**
   (not via a hook) to resolve client→conversation mappings and narrative detail
   (`ClientActions`, `ClientsPage`, `ProgramProgressModal`, `PlanWorkspaceOverlay`,
   `NeedsAttentionPanel`). When the backend owns this data, these must move behind
   the API or be served pre-computed.
3. **Auth** (finding #1/#2) — real login + cookie token + refresh.
4. **Realtime + uploads are seams, not implementations.** Chat "live" messages are
   simulated timers ([`realtime.ts`](../src/features/chat/realtime.ts) has the
   websocket/poll swap point); attachments are in-browser `dataURL`s with no
   upload endpoint.
5. Optimistic mutations assume the server **echoes the full updated resource** —
   the backend must return those shapes.

### Recommended cutover path
1. **Auth first** — everything else is gated behind a session.
2. Integrate the **already-behind-the-API, read-heavy** features endpoint by
   endpoint (Users, Nutritionists, Dashboard, Settings): flip mocks off per
   feature, verify against `docs/api/`.
3. Migrate the **client-side derivations** (plan / dashboard / chat) so the
   backend owns that data.
4. Wire **realtime** (websocket/poll) and **file uploads** last.

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
