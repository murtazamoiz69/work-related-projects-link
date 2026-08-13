import { create } from 'zustand'
import { NUTRITIONISTS_DATA } from './data'
import type { Nutritionist } from './types'

// Same rev-bump pattern as features/clients/store.ts.
type NutritionistsState = {
  nutritionists: Nutritionist[]
  rev: number
  commit: () => void
  setNutritionists: (
    next: Nutritionist[] | ((prev: Nutritionist[]) => Nutritionist[]),
  ) => void
}

export const useNutritionistsStore = create<NutritionistsState>((set) => ({
  nutritionists: NUTRITIONISTS_DATA,
  rev: 0,
  commit: () => set((s) => ({ rev: s.rev + 1 })),
  setNutritionists: (next) =>
    set((s) => ({
      nutritionists: typeof next === 'function' ? next(s.nutritionists) : next,
      rev: s.rev + 1,
    })),
}))
