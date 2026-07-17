import { Leaf, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { useThemeStore } from '@/store/useThemeStore'

/** Placeholder landing page — proves the toolchain (router, tokens,
 *  Tailwind, zustand, sonner, lucide) is wired end-to-end. */
export function HomePage() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <main className="mx-auto flex min-h-screen max-w-[var(--max-content-width)] flex-col items-center justify-center gap-6 p-[var(--page-padding)] text-center">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Leaf size={24} />
        </span>
        <h1 className="text-3xl font-bold text-text-primary">
          NWS — Nutritionist Panel
        </h1>
      </div>

      <p className="max-w-md text-sm text-text-secondary">
        Nourish with Sim. Vite + React + TypeScript prototype scaffold — design
        tokens, TanStack Router/Query, Zustand, and sonner are all wired up.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>

        <button
          type="button"
          onClick={() => toast.success('Toolchain is working!')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
        >
          Test toast
        </button>
      </div>
    </main>
  )
}
