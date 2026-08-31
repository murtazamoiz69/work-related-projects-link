# Page & Feature Inventory

Per-page specifications for every route in the app, produced **before** API integration to drive the Phase 2 (MSW + TanStack Query) migration. This is analysis, not implementation.

## How to read these specs

- **`PROPOSED`** marks every endpoint, request, and response shape. **None of these are confirmed backend contracts** — they are derived from the current in-memory `data.ts` shapes and the UI's needs. They become MSW handlers first, and must be reconciled with the real backend when it exists. Mark any assumption in code with `// ASSUMPTION:`.
- **Server / Client / URL state** are separated deliberately — that split *is* the migration plan (Server → React Query, URL → route search params, Client → local `useState`). See `../coding-standards.md` › State Management.
- **Mock JSON** blocks are the seed for MSW fixtures; they mirror the existing `features/*/types.ts` contracts.

## Role model (current)

Two switchable demo profiles drive authorization (`store/useAuthStore` + `features/shell/data.ts`):

| Role | Sees |
| --- | --- |
| **Nutritionist** (Sarah Nolan) | Dashboard, Users, Chat, Programs, Settings |
| **Super Admin** (Alex Rivera) | everything above **+ Nutritionists** |

Auth today is a demo flag (any password). Real auth/roles arrive with the API layer; these specs describe the **target** permission per page.

## Pages

| # | Page | Route | Role | Spec |
| --- | --- | --- | --- | --- |
| 1 | Login | `/login` | Public | [login.md](./login.md) |
| 2 | Dashboard | `/` | Authed | [dashboard.md](./dashboard.md) |
| 3 | Users (Clients) | `/clients` | Authed | [users.md](./users.md) |
| 4 | Chat + Plan Workspace | `/chat` | Authed | [chat.md](./chat.md) |
| 5 | Programs | `/programs` | Authed | [programs.md](./programs.md) |
| 6 | Settings | `/settings` | Authed | [settings.md](./settings.md) |
| 7 | Nutritionists | `/nutritionists` | Super Admin | [nutritionists.md](./nutritionists.md) |

## Suggested migration order (Phase 2)

Users → Nutritionists → Programs → Dashboard → Settings → Chat/Plan Workspace (hardest, last). Login pairs with the auth work. Rationale: start with the simplest list+mutation surface to establish the service → MSW → query → hook pattern, finish with the most stateful screen.
