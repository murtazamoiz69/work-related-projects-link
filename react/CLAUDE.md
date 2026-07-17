# CLAUDE.md — Project Intelligence (Complete Final Version)

## Overview

This is a **React + Vite CSR project**.

There is:

* No Next.js
* No SSR
* No server components
* No API routes

Everything runs in the browser.

This file is the **source of truth** for architecture, coding standards, design system, and development workflow.

If this file conflicts with any other instruction, **this file wins**.

Read it fully before touching any file.

---

# Tech Stack

| Layer         | Technology                     |
| ------------- | ------------------------------ |
| Build Tool    | Vite                           |
| UI Framework  | React 18+                      |
| Language      | TypeScript 5 (strict)          |
| Styling       | Tailwind CSS 4                 |
| UI Components | shadcn/ui (CDN)                |
| Icons         | lucide-react                   |
| Routing       | TanStack Router                |
| Data Fetching | TanStack Query                 |
| Forms         | react-hook-form + zod          |
| Toasts        | sonner                         |
| State         | Zustand or Context             |
| Linting       | ESLint (Airbnb TS config)      |
| Formatting    | Prettier                       |
| Testing       | Vitest + React Testing Library |

---

# Folder Structure — Non‑Negotiable

Every file must go in the correct location.

Do not create folders outside this structure.

```
src/
  assets/

  components/
    atoms/
    molecules/
    organisms/
    templates/

  features/
    [feature-name]/
      components/
        atoms/
        molecules/
        organisms/
      hooks/
      services/
      types/
      utils/
      index.ts

  hooks/

  lib/
    queryClient.ts
    router.ts
    axios.ts
    utils.ts
    env.ts

  pages/

  routes/

  services/

  store/

  types/

  styles/
    tokens.css

  main.tsx
  App.tsx
```

---

# Atomic Design Rules

## Component Levels

| Level    | Responsibility  |
| -------- | --------------- |
| Atom     | Single element  |
| Molecule | 2–3 atoms       |
| Organism | Complex UI      |
| Template | Layout shell    |
| Page     | Route container |

---

## Hard Rules

Atoms:

* No child components
* No business logic
* No API calls

Molecules:

* Combine atoms
* No API calls

Organisms:

* Combine molecules
* May use hooks
* Must never call services directly

Templates:

* Layout only
* Accept children

Pages:

* Thin shells
* No business logic

---

# Feature Folder Rules

Every feature is self‑contained.

```
src/features/users/
  components/
  hooks/
  services/
  types/
  utils/
  index.ts
```

---

## Feature Import Rules

Never:

```
import from feature internals
```

Always:

```
import from feature index.ts
```

---

## Feature Naming Rules

Feature names must be:

* plural
* lowercase
* kebab-case

Examples:

users
orders
audit-logs
inventory-items

---

# TanStack Router Rules

Routes live in:

```
src/routes/
```

Pages live in:

```
src/pages/
```

---

## Router Rules

Never use:

```
window.location
```

Always use:

```
useNavigate
```

---

# TanStack Query Rules

## Data Fetching

Never use:

```
useEffect
```

Always use:

```
useQuery
```

---

## Mutation Rules

All mutations must:

* invalidate queries
* show toast

---

# API Service Rules

All API calls live in:

```
services/
```

Services must:

* be pure functions
* return typed data
* never contain hooks

---

# TypeScript Rules — Strict

## Non‑Negotiable

* any is banned
* non-null assertion (!) is banned
* enums are banned
* implicit any is banned
* object type is banned

---

## Naming Conventions

| Thing     | Convention           |
| --------- | -------------------- |
| Component | PascalCase           |
| Hook      | useCamelCase         |
| Service   | camelCase.service.ts |
| Type      | PascalCase           |
| Constant  | UPPER_SNAKE_CASE     |

---

# Form Rules

All forms use:

react-hook-form
zod

Never use:

```
useState
```

for form values.

---

# Design System — Design Tokens

Design tokens are the single source of truth.

Never hardcode visual values.

---

## Token File Location

```
src/styles/tokens.css
```

---

## Color Tokens

```
:root {

  --color-primary: 220 90% 56%;
  --color-primary-foreground: 0 0% 100%;

  --color-secondary: 215 16% 47%;
  --color-secondary-foreground: 0 0% 100%;

  --color-accent: 262 83% 58%;

  --color-success: 142 71% 45%;
  --color-warning: 38 92% 50%;
  --color-error: 0 84% 60%;
  --color-info: 199 89% 48%;

  --color-background: 0 0% 100%;
  --color-surface: 0 0% 100%;

  --color-text-primary: 222 47% 11%;
  --color-text-secondary: 215 20% 45%;

  --color-border: 214 32% 91%;
}
```

---

## Dark Mode Tokens

```
[data-theme="dark"] {

  --color-background: 222 47% 11%;
  --color-surface: 222 47% 14%;

  --color-text-primary: 210 40% 98%;

  --color-border: 217 33% 17%;
}
```

---

## Spacing Tokens

8px grid system.

```
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
```

---

## Typography Tokens

```
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;
--font-size-2xl: 1.5rem;
--font-size-3xl: 1.875rem;
--font-size-4xl: 2.25rem;
```

---

## Radius Tokens

```
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-2xl: 1.5rem;
```

---

## Shadow Tokens

```
--shadow-sm
--shadow-md
--shadow-lg
--shadow-xl
```

---

## Z‑Index Tokens

```
--z-dropdown: 1000
--z-sticky: 1020
--z-fixed: 1030
--z-modal: 1040
--z-popover: 1050
--z-tooltip: 1060
```

---

## Motion Tokens

```
--duration-fast: 150ms
--duration-normal: 250ms
--duration-slow: 350ms
```

---

# Style Guide

## Layout Rules

```
MAX_CONTENT_WIDTH = 1280px
PAGE_PADDING = 24px
SECTION_SPACING = 32px
CARD_PADDING = 16px
```

---

## Button Rules

Primary:

* main action

Secondary:

* optional action

Destructive:

* delete action

---

## Input Rules

All inputs must:

* have label
* have helper text
* have error message
* have focus state

---

## Table Rules

Tables must support:

* sorting
* pagination
* loading state
* empty state

---

## Empty State Rules

Must include:

* icon
* title
* description
* action

---

## Loading State Rules

All async UI must render skeleton loader.

Never:

* blank screen
* spinner-only page

---

## Accessibility Rules

All UI must comply with:

WCAG 2.1 AA

Required:

* keyboard navigation
* focus state
* aria labels

---

# Error Handling Rules

All route UI must be wrapped in:

```
ErrorBoundary
```

Location:

```
src/components/organisms/ErrorBoundary.tsx
```

---

# Toast Rules

All mutations must show feedback.

Success:

```
show success toast
```

Failure:

```
show error toast
```

Never silently fail.

---

# Authentication Rules

Handled in:

```
src/lib/axios.ts
```

Must:

* attach Authorization header
* refresh token
* redirect on 401

---

# Environment Variables

All env vars must start with:

```
VITE_
```

---

## Environment Validation

```
import { z } from 'zod'

export const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_APP_ENV: z.enum([
    'development',
    'staging',
    'production',
  ]),
})

export const env = envSchema.parse(
  import.meta.env,
)
```

---

# Testing Standards

Test stack:

* Vitest
* React Testing Library

Rules:

* hooks must be tested
* services mocked
* behavior tested

---

# Performance Rules

Targets:

Initial Load:

< 2 seconds

Bundle Size:

< 250 KB gzip

---

# Build Validation

Before any task is considered complete:

```
npx tsc --noEmit
npm run lint
npm run format:check
npm run build
```

All must pass.

---

# Final Rule

If unsure:

Choose consistency over cleverness.
