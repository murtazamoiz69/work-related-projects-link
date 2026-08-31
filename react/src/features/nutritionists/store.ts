import { create } from 'zustand'
import { NUTRITIONISTS_DATA } from './data'
import type { Nutritionist } from './types'

// Rev-bump store: mutate in place + `commit()` to re-render, or `setX()` to
// swap the array. (The clients feature has since moved to the API/Query layer;
// this pattern stays until nutritionists migrates too — see docs/api-guidelines.md.)
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
