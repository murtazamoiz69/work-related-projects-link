// React Query keys for the nutritionists feature.
import type { ListNutritionistsParams } from './nutritionists.types'

export const nutritionistKeys = {
  all: ['nutritionists'] as const,
  list: (params: ListNutritionistsParams) =>
    ['nutritionists', 'list', params] as const,
  members: (id: string) => ['nutritionists', id, 'members'] as const,
}
