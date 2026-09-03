# Page & Feature Inventory

Per-page specifications for every route in the app, produced **before** API integration to drive the Phase 2 (MSW + TanStack Query) migration. This is analysis, not implementation.

## How to read these specs

- **`PROPOSED`** marks every endpoint, request, and response shape. **None of these are confirmed backend contracts** — they are derived from the current in-memory `data.ts` shapes and the UI's needs. They become MSW handlers first, and must be reconciled with the real backend when it exists. Mark any assumption in code with `// ASSUMPTION:`.
- **Server / Client / URL state** are separated deliberately — that split *is* the migration plan (Server → React Query, URL → route search params, Client → local `useState`). See `../coding-standards.md` › State Management.
- **Mock JSON** blocks are the seed for MSW fixtures; they mirror the existing `features/*/types.ts` contracts.

## Role model (current)

**There is one role.** Every account is a nutritionist with the same full access, including managing other nutritionists — so no screen is role-gated, there is no profile switcher, and `Profile` (`features/shell/data.ts`) carries no `role` field. The signed-in profile lives in `store/useAuthStore`.

Auth today is a demo flag (any password). Real auth arrives with the API layer; these specs describe the **target** permission per page.

## Pages

| # | Page | Route | Role | Spec |
| --- | --- | --- | --- | --- |
| 1 | Login | `/login` | Public | [login.md](./login.md) |
| 2 | Dashboard | `/` | Authed | [dashboard.md](./dashboard.md) |
| 3 | Users (Clients) | `/clients` | Authed | [users.md](./users.md) |
| 4 | Chat + Plan Workspace | `/chat` | Authed | [chat.md](./chat.md) |
| 5 | Programs | `/programs` | Authed | [programs.md](./programs.md) |
| 6 | Profile Settings | `/settings` | Authed | — (profile form only; reached from the sidebar profile menu) |
| 7 | Nutritionists | `/nutritionists` | Authed | [nutritionists.md](./nutritionists.md) |

## Suggested migration order (Phase 2)

Users → Nutritionists → Programs → Dashboard → Chat/Plan Workspace (hardest, last). Login pairs with the auth work. Rationale: start with the simplest list+mutation surface to establish the service → MSW → query → hook pattern, finish with the most stateful screen.
