// The daily-intake targets the diet plan is organised by, from
// `GET /libraries/calorie-bands`. Reference data — fetched once, cached for the
// session. Callers fall back to the static `CALORIE_BANDS` list while this
// loads or if it fails, so the Category dropdown never regresses.
import { useQuery } from '@tanstack/react-query'
import { getCalorieBands } from '../api/libraries.api'

export const calorieBandsKey = ['libraries', 'calorie-bands'] as const

export function useCalorieBandsQuery() {
  return useQuery({
    queryKey: calorieBandsKey,
    queryFn: ({ signal }) => getCalorieBands(signal),
    staleTime: Infinity,
  })
}
