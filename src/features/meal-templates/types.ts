import type { MealEntry } from '@/features/programs'

// A single reusable day within a saved meal template — mirrors the shape of
// a client's WsDietDay minus the workspace-specific dayNum-in-a-live-week
// context, so it can be replayed onto any day sharing the same weekday.
export type TemplateDietDay = {
  dayNum: number
  label: string
  meals: MealEntry[]
}

// Set by which "Save to Library" entry point the nutritionist used — the
// week-level action always saves 'week' (even if some days were unchecked),
// the day-level action always saves 'day'.
export type MealTemplateType = 'week' | 'day'

export type MealTemplate = {
  id: string
  name: string
  type: MealTemplateType
  createdBy: string
  createdDate: Date
  days: TemplateDietDay[]
  avgDailyCalories: number
}
