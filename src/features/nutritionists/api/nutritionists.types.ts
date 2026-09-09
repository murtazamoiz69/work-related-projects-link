// Nutritionists API contracts — request params + wire (DTO) response shapes,
// separate from the domain model (`../types.ts`, which uses `Date`) and the
// UI-only filter/search types. The `api.ts` mapper converts DTO -> domain.
import type { Paginated } from '@/lib/api/types'

// ---- Request types ----

export type NutritionistStatusFilter = 'all' | 'active' | 'disabled'

export type ListNutritionistsParams = {
  search?: string
  status?: NutritionistStatusFilter
  page?: number
  pageSize?: number
}

export type NutritionistFormBody = {
  name: string
  email: string
  phone?: string
  qualification: string
  experienceYears: number
}

export type UpdateNutritionistAccessBody = {
  enabled: boolean
}

/** The roster filters as represented in the URL (route search params). */
export type NutritionistsSearch = {
  q?: string
  status?: NutritionistStatusFilter
  page?: number
}

// ---- Response (wire / DTO) types ----

export type NutritionistDto = {
  id: string
  name: string
  initials: string
  color: string
  email: string
  phone?: string
  qualification: string
  experienceYears: number
  joinDate: string // ISO
  memberIds: string[]
  accessEnabled: boolean
}

/** A member (user) overseen by a nutritionist — the read-only summary the
 *  members modal lists. */
export type NutritionistMemberDto = {
  id: string
  name: string
  initials: string
  color: string
  email: string
}

export type PaginatedNutritionistsDto = Paginated<NutritionistDto>
