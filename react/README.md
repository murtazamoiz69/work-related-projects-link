# NWS — Nutritionist Panel (React)

The **Nourish with Nourish AI** nutritionist dashboard, ported from the V2
vanilla-HTML/JS prototype into React + TypeScript. Faithful to V2's green
"Nourish" design.

## Stack

Vite · React 18 · TypeScript (strict) · TanStack Router · TanStack Query ·
react-hook-form + zod · Zustand · Chart.js (react-chartjs-2) · lucide-react ·
ESLint + Prettier · Vitest. See [CLAUDE.md](CLAUDE.md) for conventions.

The design system is V2's, ported verbatim into `src/styles/tokens.css`
(design tokens) + `src/styles/app.css` (component styles). Screens emit the
same class names for pixel-faithful parity; Tailwind is configured for
incidental utility use.

## Commands

```bash
npm install       # first time
npm run dev       # dev server (http://localhost:5173)
npm run build     # tsc -b && vite build
npm run preview   # preview the production build

npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run format    # prettier --write
npm run test      # vitest (watch)  /  npm run test:run  (once)
```

Demo login: any valid email + a 4+ char password (e.g. `sarah@nourishwithsim.com`).

## Screens (routes)

| Route | Screen |
|---|---|
| `/login` | Sign in (auth-gated app) |
| `/` | Dashboard — KPIs, Catch Up, cohort charts, plan expiry |
| `/clients`, `/clients/:id` | Client roster + client detail (Program Journey, charts) |
| `/chat` | 3-column messaging + full-screen AI Plan Workspace |
| `/programs`, `/programs/:id` | Program library + program workspace (6 tabs) |
| `/templates`, `/templates/:id` | Message-template library + editor |
| `/settings` | Profile / Notifications / Security / Practice |

## Structure

`src/components/{atoms,molecules,organisms,templates}` — shared UI.
`src/features/<feature>` — per-feature data + components (clients, dashboard,
client-detail, programs, templates, chat, shell). `src/pages` — route
containers (lazy-loaded). `src/routes` — TanStack Router tree. `src/store` —
Zustand stores. `src/lib` — env, axios, query client, router, seed, toast.
Prototype state is in-memory + `localStorage`/`sessionStorage`; no backend.
