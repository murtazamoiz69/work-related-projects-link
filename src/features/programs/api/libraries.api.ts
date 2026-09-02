// Reference-library service. One call returns the exercise, meal, and
// workout-template catalogs; the client fetches it once and caches it
// (see library-store.ts). The plan/program endpoints return only ids
// (`exerciseId`, `mealId`) that join against these.
import { get } from '@/lib/api/client'
import type { Libraries } from '../library-store'
import type { LibrariesDto } from './libraries.types'

export async function getLibraries(signal?: AbortSignal): Promise<Libraries> {
  return get<LibrariesDto>('/libraries', { signal })
}
