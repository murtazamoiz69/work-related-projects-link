import { create } from 'zustand'
import {
  DEFAULT_TEMPLATE_CATEGORIES,
  TEMPLATES,
  saveTemplates,
} from './data'
import type { Template, UsageContext } from './types'

// V2 mutated the in-memory TEMPLATES array in place and re-rendered the page
// after each edit. React needs a re-render trigger, so this store holds the
// array plus a `rev` nonce: `commit()` persists + bumps the nonce after an
// in-place mutation (favorite/usage/edit), while `setTemplates()` swaps the
// array reference for add/duplicate/delete. `categories` is a mutable list the
// Create/Edit screen can extend (in-memory only, like V2).
type TemplatesState = {
  templates: Template[]
  categories: string[]
  rev: number
  /** Persist + force a re-render after mutating a template object in place. */
  commit: () => void
  /** Replace the template list (create / duplicate / delete), then persist. */
  setTemplates: (
    next: Template[] | ((prev: Template[]) => Template[]),
  ) => void
  /** Add a new category if it isn't already present. */
  addCategory: (name: string) => void
}

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: TEMPLATES,
  categories: [...DEFAULT_TEMPLATE_CATEGORIES],
  rev: 0,
  commit: () => {
    saveTemplates(get().templates)
    set((s) => ({ rev: s.rev + 1 }))
  },
  setTemplates: (next) =>
    set((s) => {
      const templates = typeof next === 'function' ? next(s.templates) : next
      saveTemplates(templates)
      return { templates, rev: s.rev + 1 }
    }),
  addCategory: (name) =>
    set((s) =>
      s.categories.includes(name)
        ? s
        : { categories: [...s.categories, name], rev: s.rev + 1 },
    ),
}))

// Universal usage tracker — mutates the template in place (matching V2's
// recordTemplateUsage) then commits so the change persists and every screen
// re-renders. Callable from Chat, Broadcast, and the detail "Copy" action.
export function recordTemplateUsage(
  template: Template,
  context: UsageContext,
): void {
  template.usage.timesUsed++
  template.usage.lastUsed = new Date()
  if (context === 'chat') template.usage.usedInChats++
  else if (context === 'broadcast') template.usage.usedInBroadcasts++
  const clientName =
    context === 'broadcast'
      ? 'Broadcast audience'
      : context === 'chat'
        ? 'Current conversation'
        : 'Copied to clipboard'
  template.recentUses.unshift({ context, clientName, days: 0 })
  useTemplatesStore.getState().commit()
}
