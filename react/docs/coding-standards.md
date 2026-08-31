# Coding Standards

Practical rules a senior team can actually follow. Examples use this repo's style: **no semicolons, single quotes, `type` over `interface`, `@/` imports**. ESLint + Prettier are the final arbiters — don't fight them.

---

## React

### Component responsibility
- One component = one job. If a component both fetches/derives data **and** renders a complex tree **and** manages several unrelated pieces of state, split it.
- Keep components **thin at the edges**: pages compose, organisms arrange, molecules/atoms render. Push logic down into hooks/utils, not up into pages.
- Practical size signal: a component over ~250 lines or with 3+ unrelated `useState` groups is a refactor candidate — but split by **responsibility**, not to hit a line count. (Several files here are 500–1200 lines; when you touch one, carve out the piece you're changing, don't rewrite the whole file.)

### Hooks
- Custom hook when logic is (a) stateful or effectful **and** (b) reused, or (c) complex enough that extracting it clarifies the component. Name `useX`, return a typed object/tuple.
- Hooks obey the rules of hooks (top level, no conditionals). `react-hooks/exhaustive-deps` is on — satisfy it. A deliberate mount-only effect may disable it **with a one-line comment saying why**; that's the only accepted use of the disable.
- Don't build a hook for a one-off; inline it until there's a second caller.

### Effects
- `useEffect` is for **synchronising with something outside React**: DOM (`document.body.classList`), timers, event listeners, subscriptions, imperative focus. That's what the existing ~60 effects do — correct.
- **Do not use effects for:** deriving data from props/state (compute during render or `useMemo`), responding to user events (do it in the handler), or fetching data (that's React Query once services land — see `api-guidelines.md`).
- Always clean up: clear timers, remove listeners in the returned cleanup.

### State
- Derived values are **not state** — compute them. `const total = items.length`, not a `useState` you keep in sync via effect.
- Keep state minimal and colocated; lift only when a real sibling needs it. See the **State Management** section below for scope choice.

### Props
- Type every component's props with a local `type Props = { … }` (or inline). No implicit `any`.
- Prefer a handful of explicit props over one giant `config` object. Boolean props read as `isX`/`hasX`/`canX`.
- **Prop drilling:** 1–2 levels is fine. Beyond ~3 levels of passing the same prop untouched, reach for composition (`children`/slots) or a context/store — but don't add context speculatively.
- Don't spread unknown props (`{...rest}`) onto DOM elements unless the component is a deliberate primitive wrapper.

### Composition
- Compose with `children` and slot props before adding configuration flags. A component that has grown a dozen `showX`/`variantY` booleans wants to be split or made composable.
- Reuse the shared primitives (`Modal`, `ConfirmDialog`, `Icon`, `Avatar`, `Badge`) instead of re-implementing them. If you need a near-duplicate, extend the shared one via props rather than copy-pasting a second version.

### Rendering performance
- Correctness first; optimise on evidence. See the **Performance** section for `memo`/`useMemo`/`useCallback` rules — the short version: **don't memoise by default, memoise a proven hot path.**
- Stable, meaningful `key`s (entity id). Never array index as key for lists that reorder/filter/insert.
- Don't create new object/array/function literals in props of a memoised child in a hot render path.

---

## TypeScript

- **`strict` is on and stays on.** `any`, non-null `!`, and `enum` are ESLint **errors**. Use unions or `as const` objects instead of enums.
- Prefer **`type`** aliases (this codebase does). Use `interface` only when you specifically need declaration merging (rare here).
- **`unknown` over `any`** at untyped boundaries (JSON, `catch`), then narrow. Type guards (`v is Foo`) over assertions.
- **Type assertions (`as`)** are a last resort and only for cases the compiler genuinely can't see: DOM casts (`e.target as Node`), `as const`, `CSSProperties`. Never `as SomeDomainType` to paper over a mismatch — fix the type.
- **Domain types are contracts.** Each feature's `types.ts` is the source of truth for its entities. Reuse them; don't redeclare a near-copy in a component.
- **API types** (when the service layer lands): request and response types live with the service, response types match the mock/real payload exactly, and UI types derive from them — see `api-guidelines.md`.
- **Error types:** model expected failures as data. Prefer a discriminated union for known outcomes over throwing where the caller must branch (see **Error Handling**).
- **Null/undefined:** be explicit (`Foo | null`). Handle the empty/missing case at the boundary; don't let `undefined` leak into render as `NaN`/`"undefined"`.
- **Discriminated unions** for anything with a "kind" (the `PwModal`, activity items, message `from` already do this) — switch on the discriminant, let the compiler check exhaustiveness.

---

## Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Component | PascalCase | `ClientRosterViews`, `MessageThread` |
| Component file | PascalCase `.tsx` | `MessageThread.tsx` |
| Hook | `useCamelCase` | `useActivityFilters` |
| Hook file | matches hook name | `useActivityFilters.ts` |
| Function / variable | camelCase, verb-first for functions | `buildProgramTracker`, `daysUntil` |
| Boolean | `is/has/can/should` prefix | `isSuperAdmin`, `accessEnabled` |
| Constant (module-level, fixed) | UPPER_SNAKE_CASE | `PAGE_SIZE`, `SWITCH_PROFILES` |
| Type / union | PascalCase | `Client`, `ChatTab`, `ConflictLevel` |
| Union member (string literal) | match domain wording | `'waiting'`, `'active'` |
| Type file | `types.ts` per feature | |
| Utility file | `utils.ts` / `<thing>.ts` | `seed.ts`, `schedule.ts` |
| API service file | `<name>.service.ts` | `clients.service.ts` |
| Store | `useXStore` | `useClientsStore` |
| Store file | `store.ts` (feature) / `useXStore.ts` (global) | |
| Feature folder | plural, kebab-case, lowercase | `meal-templates`, `client-detail` |
| Generic UI folder | atomic level | `atoms/`, `molecules/` |

Name for the domain, not the mechanism (`expiryUrgency`, not `computeColorFlag`). Avoid magic strings/numbers — give them a named constant or a union type (thresholds like the expiry tiers already do this in `clients/utils.ts` — follow that).

---

## Components — when to create which

| Kind | Create when | Location | Constraints |
| --- | --- | --- | --- |
| **Atom** | A single, generic, reusable element with no domain meaning | `components/atoms/` | No child components, no business logic, no data access |
| **Molecule** | 2–3 atoms forming a small reusable unit | `components/molecules/` | Composes atoms; no data access |
| **Organism** | A composed, generic UI block reused across features | `components/organisms/` | May use hooks; no direct service calls |
| **Template** | A layout shell that arranges regions and renders `children`/`Outlet` | `components/templates/` | Layout only |
| **Feature component** | UI that is specific to one domain | `features/<name>/components/` | Owns its domain logic via hooks/services |
| **Page** | A route container | `pages/` | Thin: compose feature + layout, read route params, no business logic |

Decision shortcut: **domain-specific → feature; generic and reused (or clearly will be) → shared component at the right atomic level.** Don't promote something to `components/` until a second feature actually needs it.

---

## Forms

- **New or edited forms use `react-hook-form` + `zod`.** Don't add another hand-rolled `useState` form (the legacy ones in Settings/modals may stay until touched; when you touch one, migrate it).
- **Schema location:** colocate the zod schema with the form/feature (`features/<name>/schemas/<thing>.schema.ts`, or beside the component for a one-off). Derive the TS type with `z.infer`. The same schema validates the form and (later) the request payload.
- **Validation:** declare rules in the schema, wire with `zodResolver`. No ad-hoc `if (!value)` chains scattered through the submit handler.
- **Errors:** show inline, per-field, from `formState.errors`. Every input has a label, and an error message when invalid (see Accessibility).
- **Submit handling:** disable the submit control while pending; guard against double-submit. Do side effects (navigation, toast) after success.
- **Loading state:** reflect pending visually (`disabled` + label change, e.g. "Saving…"). Never leave the user unsure whether the click registered.
- **Server errors** (once APIs land): map them onto the form — field-level where the error is field-specific, a form-level banner otherwise. Show a toast for transient/unexpected failures. Never swallow a failure silently.

---

## State Management — where does this state belong?

| Put it in… | When | Here that's… |
| --- | --- | --- |
| **Local `useState`** | UI-ephemeral, not needed elsewhere | open/closed, active tab, input draft, current page |
| **URL (route search params)** | Should survive reload / be shareable / deep-linkable | selected conversation (`?c=`), "open plan" (`?plan=`) |
| **Server state (React Query)** | Data owned by the backend | *coming* — all fetched entities once services land |
| **Global store (Zustand)** | App-wide, cross-route, not server-owned | auth/session, theme, notifications, shell UI |
| **Feature store (Zustand)** | Mutable domain state shared across a feature's components, pre-API | clients/programs/nutritionists/meal-templates rosters |
| **Context** | Passing stable, rarely-changing values through a subtree to avoid deep drilling | Plan Workspace `PwContext` |

Guidance:
- **Default to local.** Promote to a wider scope only when a real second consumer exists.
- Don't put server data in a global store once React Query exists — that's Query's job (dedupe, cache, invalidation).
- Context is for **avoiding prop drilling of stable values**, not a general state bus. Don't put frequently-changing state in a context that wraps a large tree (re-render cost).
- Don't duplicate one source of truth across two stores.

---

## Error Handling

- **API errors** (4xx/5xx): handle at the service/query layer; surface a typed result to the UI (see `api-guidelines.md`). The UI decides copy; the service decides classification.
- **Network errors** (offline/timeout): treat as retryable; show a retry affordance, not a dead end.
- **Validation errors:** in-form via zod (see Forms). Never rely on the backend alone for UX-level validation.
- **Unexpected/render errors:** contained by `ErrorBoundary` around the route tree — keep it there; add a boundary around any independently-failing heavy widget if its failure shouldn't take the page down.
- **Empty states** are required for every async/list surface: icon + title + description + (where relevant) an action. The roster/chat empty states are the reference. No blank panels.
- **Loading states:** render a skeleton/placeholder, never a blank screen or a bare spinner as a whole page. (`Suspense fallback={null}` is a known gap — when you touch a lazy boundary, give it a real fallback.)
- **Retry states:** on a failed fetch, show the error + a "Try again" that re-runs the query. Don't auto-retry forever; React Query's bounded retry + a manual button is the pattern.
- **Never fail silently.** Every mutation reports success or failure (toast is the shared channel via `showToast`).

---

## Accessibility (minimum bar — WCAG 2.1 AA intent, applied pragmatically)

Required for any new or changed interactive UI:

- **Semantic HTML first.** A clickable thing is a `<button>`; a navigation is `<a>`/`<Link>`. Only use `role="button"` on a non-button when unavoidable, and then it **must** have `tabIndex={0}` and Enter/Space handlers (the convo card is the reference).
- **Keyboard:** everything operable without a mouse. Modals/overlays trap focus, restore focus to the opener on close, and close on `Escape` (existing modals do this — match them).
- **Labels:** every input has an associated `<label>`. Icon-only buttons have `aria-label`. Don't rely on placeholder as the only label.
- **Images:** meaningful `<img>` needs `alt`; decorative ones get `alt=""` / `aria-hidden`.
- **State:** reflect it (`aria-selected` on tabs, `aria-label` that changes with toggle state — as the sidebar/chat already do).
- **Contrast:** use the design tokens; don't introduce low-contrast text/foreground pairings. Don't encode meaning in colour alone — pair with icon/text.

Add `eslint-plugin-jsx-a11y` when convenient; until then these are review-enforced.

---

## Performance

Optimise on evidence, not reflex.

- **Lazy loading:** routes are code-split (`lazy` + `Suspense`). Lazy-load genuinely heavy, not-immediately-visible subtrees (large modals, chart-heavy panels) the same way. Give every lazy boundary a real fallback.
- **Memoisation:** `useMemo`/`useCallback`/`React.memo` are for **measured** hot paths or referential stability a memoised child needs — not decoration. Premature memoisation adds noise and its own cost. Memoise expensive derivations (the seeded builders, filtered/sorted lists) and callbacks passed to memoised children.
- **Re-renders:** subscribe to the **narrowest** store slice (`useStore(s => s.field)`), not the whole store. Avoid a broad `refresh()`/rev-bump where a scoped update works. Don't allocate new literals in the render path of a hot list.
- **Pagination:** client-side paginate long rosters (the Users/Nutritionists pages do — `PAGE_SIZE`). When the API lands, prefer server-side pagination for large sets.
- **Virtualisation:** not needed at current data sizes; introduce it only when a list is proven large (hundreds+ of simultaneously-rendered rows). Don't add it speculatively.
- **Images:** SVG/data-URI placeholders are used deliberately. For real images later: sized, lazy (`loading="lazy"`), and `max-width:100%`.
- **Caching:** React Query is the caching layer for server data (staleTime/gc). Don't hand-roll a parallel cache. See `api-guidelines.md`.
- **Icons:** add to the central `Icon` atom. Be aware it statically imports its set — don't balloon it needlessly; per-route subsetting is a future optimisation.

---

## Security (frontend)

- **Tokens:** when auth is real, store the access token in one place via the `lib/axios` interceptor; never scatter `localStorage` token reads through components. Don't log tokens. (Today's auth is a demo flag — don't build real-secret handling on top of it without the auth work.)
- **Storage:** `localStorage`/`sessionStorage` hold only non-sensitive UI/session data. No secrets, no PII beyond what the session already implies. Wrap access in try/catch (storage can throw/be blocked) — existing stores do this; match it.
- **XSS / unsafe HTML:** **no `dangerouslySetInnerHTML`** (currently zero — keep it that way). Render user/content data as text. If you ever must inject HTML, it must be sanitised and reviewed.
- **Data-URI/SVG:** the seeded SVG placeholders are built from controlled values — keep any dynamic SVG values encoded/escaped (as `placeholderPhotoDataUri` does).
- **Env vars:** only `VITE_`-prefixed vars reach the client, and **everything in the client bundle is public** — never put a secret in one. Validate env with the zod schema in `lib/env.ts` (and guard it so a missing var fails loudly at startup, not silently mid-render).
- **API usage:** no credentials in URLs/query strings; no user data sent to endpoints or third parties that weren't part of the intended request. Follow `api-guidelines.md`.
- **Dependencies:** keep the surface small; no new dep without justification; watch for known advisories on upgrades.
- **External links:** `rel="noopener noreferrer"` on any `target="_blank"`.
