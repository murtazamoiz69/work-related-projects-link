import { create } from 'zustand'
import { MEAL_TEMPLATES, saveMealTemplates } from './data'
import type { MealTemplate } from './types'

type MealTemplatesState = {
  templates: MealTemplate[]
  rev: number
  /** Persist + force a re-render after mutating a template object in place. */
  commit: () => void
  /** Replace the template list (save / delete), then persist. */
  setTemplates: (
    next: MealTemplate[] | ((prev: MealTemplate[]) => MealTemplate[]),
  ) => void
}

export const useMealTemplatesStore = create<MealTemplatesState>((set, get) => ({
  templates: MEAL_TEMPLATES,
  rev: 0,
  commit: () => {
    saveMealTemplates(get().templates)
    set((s) => ({ rev: s.rev + 1 }))
  },
  setTemplates: (next) =>
    set((s) => {
      const templates = typeof next === 'function' ? next(s.templates) : next
      saveMealTemplates(templates)
      return { templates, rev: s.rev + 1 }
    }),
}))
