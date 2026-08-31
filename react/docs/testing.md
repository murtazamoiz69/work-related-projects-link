# Testing

Stack: **Vitest + React Testing Library + jsdom** (already configured; `src/test/setup.ts` loads jest-dom). Today there is one test (`lib/utils.test.ts`) — coverage grows **with the code you change**, not in a separate heroic pass.

## Philosophy

- **Test behaviour, not implementation.** Assert what a user or caller observes, not internal state or component internals.
- **Value over vanity.** Don't chase a coverage number. Cover the logic that would actually break: derivations, guards, filters, reducers, services. Skip trivial passthroughs.
- **Colocate** tests next to what they test: `foo.ts` → `foo.test.ts`, `Bar.tsx` → `Bar.test.tsx`.
- **Deterministic.** This app is full of seeded/date-derived data — freeze time (`vi.useFakeTimers`/`vi.setSystemTime`) and use the seed helpers so tests don't flake on "today".

## What to test, by layer

### Unit tests (highest priority here)
Pure logic — the biggest current risk surface and cheapest to cover:
- Feature `utils.ts` and derivations: `clients/utils.ts` (`daysUntil`, `expiryUrgency`, tiers), `tracker.ts` (`numericStat`, `presenceStat`, `weightStat`), `plan-workspace/schedule.ts`, `clinical.ts`, dashboard derivations.
- Store logic: the rev-bump/`setX` stores (filter/toggle/extend behaviour).
- `lib/` helpers.
Write these **before** refactoring a big file (characterisation tests), so the refactor is provably behaviour-preserving.

### Component tests
For components with real interaction/branching, not static presentational ones:
- States: loading (skeleton), empty, error+retry, success — the required set from `coding-standards.md`.
- Interaction: chat takeover/hand-back, roster search + filter + pagination, enable/disable confirm dialog, form validation (invalid → error shown, valid → submit called), role-gated nav visibility.
- Use RTL queries by role/label/text (accessible queries), `userEvent` for interaction. No querying by class name or test-id unless there's no accessible handle.

### Integration tests
A feature slice working together — page + store + (mocked) service — asserting a flow end to end within the app (e.g. "filter the roster, open a client's chat, deep-link param respected"). Mock the service/transport, not React Query itself.

### E2E tests
Not set up yet. When a real backend and critical user journeys exist, add Playwright (dev dependency, by proposal) for a **small** suite of the highest-value happy paths (login → dashboard, manage a client's plan, publish). E2E is for a handful of critical journeys, not broad coverage — keep it thin and stable.

## Services & mocking

- When the service layer lands, **mock at the service/transport boundary**, not React Query. Tests exercise the real hooks against a mock transport (MSW handlers or the promise mock).
- Provide a test `QueryClient` per test with retries off and a fresh cache, so tests are isolated and fast.
- Assert the required request states render, and that mutations invalidate/refetch and surface success/error feedback.

## Conventions

- Name tests by behaviour: `it('disables a client and shows a toast', …)`, not `it('works')`.
- Arrange–Act–Assert; one behaviour per test.
- No network, no real timers (fake them), no shared mutable state between tests — reset stores/mocks in `beforeEach`.
- A bug fix comes with a test that fails without the fix.

## Definition of done (testing)

- New pure logic (util/hook/store/service) has unit tests for its real branches and edge cases (null/empty/boundary).
- New interactive UI has at least its state-set and primary-interaction tests.
- `npm run test:run` passes; the suite stays deterministic.
