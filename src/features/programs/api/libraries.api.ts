// Reference-library service. Only the calorie-band list is used (the diet-plan
// Category dropdown); it maps 1:1 to the frontend's `CalorieBand` values.
import { get } from '@/lib/api/client'
import type { CalorieBandsDto } from './libraries.types'

/** `GET /libraries/calorie-bands` — the daily-intake targets the diet plan is
 *  organised by, e.g. `[1200, 1400, 1600, 1800, 2000]`. */
export async function getCalorieBands(signal?: AbortSignal): Promise<number[]> {
  const dto = await get<CalorieBandsDto>('/libraries/calorie-bands', { signal })
  return dto.bands
}
