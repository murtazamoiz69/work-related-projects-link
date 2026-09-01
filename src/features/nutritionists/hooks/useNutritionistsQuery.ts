// Read hooks for the nutritionists roster + a nutritionist's members.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getNutritionistMembers,
  listNutritionists,
} from '../api/nutritionists.api'
import { nutritionistKeys } from '../api/nutritionists.keys'
import type { ListNutritionistsParams } from '../api/nutritionists.types'

export function useNutritionistsQuery(params: ListNutritionistsParams) {
  return useQuery({
    queryKey: nutritionistKeys.list(params),
    queryFn: ({ signal }) => listNutritionists(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useNutritionistMembersQuery(id: string) {
  return useQuery({
    queryKey: nutritionistKeys.members(id),
    queryFn: ({ signal }) => getNutritionistMembers(id, signal),
  })
}
