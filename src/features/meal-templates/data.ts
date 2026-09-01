import { mealById } from '@/features/programs'
import type { MealTemplate, MealTemplateType, TemplateDietDay } from './types'

// Computes the average daily calories across a template's days.
export function calcAvgDailyCalories(days: TemplateDietDay[]): number {
  if (!days.length) return 0
  const total = days.reduce((sum, d) => {
    const dayTotal = d.meals.reduce((acc, m) => {
      const meal = mealById(m.mealId)
      return acc + (meal ? meal.calories : 0)
    }, 0)
    return sum + dayTotal
  }, 0)
  return Math.round(total / days.length)
}

export function buildMealTemplate(
  name: string,
  createdBy: string,
  days: TemplateDietDay[],
  type: MealTemplateType,
): MealTemplate {
  return {
    id: `mtpl-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    name,
    type,
    createdBy,
    createdDate: new Date(),
    days,
    avgDailyCalories: calcAvgDailyCalories(days),
  }
}

// ===================== Persistence =====================
// _v2: the library used to ship with fabricated demo templates; it's now
// nutritionist-created content only, so the key was bumped to drop any
// stale seed data already sitting in localStorage from before.
const MEAL_TEMPLATES_STORAGE_KEY = 'nourish_meal_templates_v2'
const MEAL_TEMPLATE_DATE_KEYS = ['createdDate']

function reviveMealTemplateDates(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(reviveMealTemplateDates)
    return
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    Object.keys(obj).forEach((k) => {
      if (MEAL_TEMPLATE_DATE_KEYS.includes(k) && typeof obj[k] === 'string') {
        obj[k] = new Date(obj[k] as string)
      } else {
        reviveMealTemplateDates(obj[k])
      }
    })
  }
}

export function saveMealTemplates(templates: MealTemplate[]): void {
  try {
    localStorage.setItem(MEAL_TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
  } catch {
    /* storage unavailable — edits just won't survive a reload */
  }
}

function loadStoredMealTemplates(): MealTemplate[] | null {
  try {
    const raw = localStorage.getItem(MEAL_TEMPLATES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    reviveMealTemplateDates(parsed)
    return parsed as MealTemplate[]
  } catch {
    return null
  }
}

// The library only ever contains templates a nutritionist explicitly saved
// via "Save to Library" — there is no seed/demo content to fall back to.
export function seedMealTemplates(): MealTemplate[] {
  return []
}

export const MEAL_TEMPLATES: MealTemplate[] =
  loadStoredMealTemplates() ?? seedMealTemplates()

export function templateById(id: string): MealTemplate | undefined {
  return MEAL_TEMPLATES.find((t) => t.id === id)
}
