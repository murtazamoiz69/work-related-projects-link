// Nutritionists service — the stable interface the UI (via React Query hooks)
// consumes. Calls the shared HTTP client; maps wire DTO (ISO dates) to the
// domain `Nutritionist` (Date). See docs/api-guidelines.md.
import { get, patch, post, put } from '@/lib/api/client'
import type { Paginated } from '@/lib/api/types'
import type { Nutritionist } from '../types'
import type {
  ListNutritionistsParams,
  NutritionistDto,
  NutritionistFormBody,
  NutritionistMemberDto,
  PaginatedNutritionistsDto,
  UpdateNutritionistAccessBody,
} from './nutritionists.types'

export function toNutritionist(dto: NutritionistDto): Nutritionist {
  return { ...dto, joinDate: new Date(dto.joinDate) }
}

/** `GET /nutritionists` — filtered, name-sorted, paginated roster. */
export async function listNutritionists(
  params: ListNutritionistsParams = {},
  signal?: AbortSignal,
): Promise<Paginated<Nutritionist>> {
  const dto = await get<PaginatedNutritionistsDto>('/nutritionists', {
    params,
    signal,
  })
  return { ...dto, items: dto.items.map(toNutritionist) }
}

/** `GET /nutritionists/:id/members` — the users a nutritionist oversees. */
export async function getNutritionistMembers(
  id: string,
  signal?: AbortSignal,
): Promise<NutritionistMemberDto[]> {
  const res = await get<{ members: NutritionistMemberDto[] }>(
    `/nutritionists/${id}/members`,
    { signal },
  )
  return res.members
}

/** `POST /nutritionists` — create. */
export async function createNutritionist(
  body: NutritionistFormBody,
): Promise<Nutritionist> {
  const dto = await post<NutritionistDto>('/nutritionists', body)
  return toNutritionist(dto)
}

/** `PUT /nutritionists/:id` — edit. */
export async function updateNutritionist(
  id: string,
  body: NutritionistFormBody,
): Promise<Nutritionist> {
  const dto = await put<NutritionistDto>(`/nutritionists/${id}`, body)
  return toNutritionist(dto)
}

/** `PATCH /nutritionists/:id/access` — enable/disable platform access. */
export async function updateNutritionistAccess(
  id: string,
  body: UpdateNutritionistAccessBody,
): Promise<Nutritionist> {
  const dto = await patch<NutritionistDto>(`/nutritionists/${id}/access`, body)
  return toNutritionist(dto)
}
