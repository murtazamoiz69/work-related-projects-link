// Unit tests for the clinical safety engine — the guard that stops a meal or
// exercise conflicting with a client's allergies, diet, or injuries from ever
// being proposed. Pure functions, so exercised directly with constructed
// profiles/meals/exercises.
import { describe, expect, it } from 'vitest'
import { CLIENTS_DATA } from '@/features/clients'
import { EXERCISE_LIBRARY, MEAL_LIBRARY } from '@/features/programs/data'
import type { Exercise, Meal } from '@/features/programs'
import type { ClinicalProfile } from './types'
import {
  computeTargets,
  deriveClinicalProfile,
  exerciseIssues,
  mealConflicts,
  pickSafeMeal,
} from './clinical'

const baseProfile = (): ClinicalProfile =>
  deriveClinicalProfile(CLIENTS_DATA[0])

const withProfile = (over: Partial<ClinicalProfile>): ClinicalProfile => ({
  ...baseProfile(),
  allergies: [],
  foodIntolerances: [],
  foodDislikes: [],
  injuries: [],
  isVegan: false,
  isVegetarian: false,
  isPescatarian: false,
  isHalal: false,
  isJain: false,
  ...over,
})

const meal = (ingredients: string[]): Meal => ({
  ...MEAL_LIBRARY[0],
  ingredients,
})
const exercise = (over: Partial<Exercise>): Exercise => ({
  ...EXERCISE_LIBRARY[0],
  ...over,
})

describe('mealConflicts', () => {
  it('flags an allergen as a hard conflict', () => {
    const conflicts = mealConflicts(
      meal(['peanut butter', 'banana']),
      withProfile({ allergies: ['Peanuts'] }),
    )
    expect(conflicts).toContainEqual({
      level: 'hard',
      reason: 'Contains Peanuts (allergy)',
    })
  })

  it('flags a non-vegan ingredient for a vegan client', () => {
    const conflicts = mealConflicts(
      meal(['grilled chicken', 'rice']),
      withProfile({ isVegan: true, isVegetarian: true }),
    )
    expect(
      conflicts.some((c) => c.level === 'hard' && c.reason === 'Not vegan'),
    ).toBe(true)
  })

  it('does not flag plant milk as dairy', () => {
    const conflicts = mealConflicts(
      meal(['almond milk', 'oats']),
      withProfile({ allergies: ['Dairy'] }),
    )
    expect(conflicts.some((c) => c.reason.includes('Dairy'))).toBe(false)
  })

  it('flags an intolerance as a soft conflict', () => {
    const conflicts = mealConflicts(
      meal(['greek yogurt', 'berries']),
      withProfile({ foodIntolerances: ['Lactose'] }),
    )
    expect(conflicts.some((c) => c.level === 'soft')).toBe(true)
  })

  it('returns no conflicts for a clean meal', () => {
    expect(mealConflicts(meal(['rice', 'spinach']), withProfile({}))).toEqual(
      [],
    )
  })
})

describe('exerciseIssues', () => {
  it('flags an exercise that could aggravate an injury (hard)', () => {
    const issues = exerciseIssues(
      exercise({ muscle: 'Legs', equipment: 'Barbell', id: 'ex-legs' }),
      withProfile({
        injuries: ['Left knee (meniscus)'],
        location: 'Gym',
      }),
    )
    expect(issues.some((i) => i.level === 'hard')).toBe(true)
  })

  it('flags unavailable equipment (soft)', () => {
    const issues = exerciseIssues(
      exercise({ muscle: 'Chest', equipment: 'Barbell', id: 'ex-bar' }),
      withProfile({ location: 'Home' }),
    )
    expect(issues.some((i) => i.level === 'soft')).toBe(true)
  })

  it('allows bodyweight anywhere', () => {
    const issues = exerciseIssues(
      exercise({ muscle: 'Core', equipment: 'Bodyweight', id: 'ex-bw' }),
      withProfile({ location: 'Home' }),
    )
    expect(issues.some((i) => i.reason.startsWith('Needs'))).toBe(false)
  })
})

describe('pickSafeMeal', () => {
  it('never returns a meal that hard-conflicts with the profile', () => {
    // A client allergic to several common allergens.
    const profile = withProfile({ allergies: ['Peanuts', 'Shellfish', 'Soy'] })
    for (const slot of ['Breakfast', 'Lunch', 'Dinner'] as const) {
      const picked = pickSafeMeal(slot, profile, null)
      expect(
        mealConflicts(picked, profile).some((c) => c.level === 'hard'),
      ).toBe(false)
    }
  })
})

describe('computeTargets', () => {
  it('adds calories and higher protein for muscle gain', () => {
    const profile = withProfile({
      goal: 'Muscle Gain',
      weightKg: 80,
      heightCm: 180,
      age: 30,
      gender: 'Male',
      activityLevel: 'Moderately active',
    })
    const t = computeTargets(profile)
    expect(t.protein).toBe(Math.round(80 * 2.0))
    expect(t.phase).toBe('Muscle Gain')
  })

  it('cuts calories for weight loss versus maintenance', () => {
    const shared = {
      weightKg: 80,
      heightCm: 180,
      age: 30,
      gender: 'Male' as const,
      activityLevel: 'Moderately active',
    }
    const loss = computeTargets(withProfile({ ...shared, goal: 'Weight Loss' }))
    const general = computeTargets(
      withProfile({ ...shared, goal: 'General Fitness' }),
    )
    expect(loss.calories).toBeLessThan(general.calories)
    expect(loss.phase).toBe('Fat Loss')
  })
})
