// Diet-plan service — the master sheets (global) and the per-user copies.
// Pure typed functions over the shared HTTP client; the DTO -> domain mapping
// (ISO string -> Date) is the only work done here. See docs/api-guidelines.md.
import { get, patch, post, put } from '@/lib/api/client'
import { toClient, type Client, type ClientDto } from '@/features/clients'
import type {
  CalorieBand,
  ClientDietPlan,
  DietPlanSheet,
  DietProfile,
} from './dietPlan.types'
import type {
  ClientDietPlanDto,
  DietPlanSheetDto,
  DuplicateSheetBody,
  DuplicateSheetResultDto,
  SaveClientPlanBody,
  SaveMasterSheetBody,
  UpdateClientBandBody,
} from './dietPlan.api.types'

function toSheet(dto: DietPlanSheetDto): DietPlanSheet {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}

function toClientPlan(dto: ClientDietPlanDto): ClientDietPlan {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}

/** `GET /program/diet-plan?week=&band=` — one master sheet. */
export async function getMasterSheet(
  weekNum: number,
  band: CalorieBand,
  signal?: AbortSignal,
): Promise<DietPlanSheet> {
  const dto = await get<DietPlanSheetDto>('/program/diet-plan', {
    params: { week: weekNum, band },
    signal,
  })
  return toSheet(dto)
}

/** `PUT /program/diet-plan` — save the master sheet for a week + band. */
export async function saveMasterSheet(
  body: SaveMasterSheetBody,
): Promise<DietPlanSheet> {
  const dto = await put<DietPlanSheetDto>('/program/diet-plan', body)
  return toSheet(dto)
}

/** `POST /program/diet-plan/duplicate` — copy one week onto others, same band. */
export async function duplicateMasterSheet(
  body: DuplicateSheetBody,
): Promise<DuplicateSheetResultDto> {
  return post<DuplicateSheetResultDto>('/program/diet-plan/duplicate', body)
}

/** `GET /clients/:id/diet-plan?week=` — the user's tailored copy. */
export async function getClientDietPlan(
  clientId: string,
  weekNum: number,
  signal?: AbortSignal,
): Promise<ClientDietPlan> {
  const dto = await get<ClientDietPlanDto>(`/clients/${clientId}/diet-plan`, {
    params: { week: weekNum },
    signal,
  })
  return toClientPlan(dto)
}

/** `PUT /clients/:id/diet-plan?week=` — the nutritionist's own edit. */
export async function saveClientDietPlan(
  clientId: string,
  weekNum: number,
  body: SaveClientPlanBody,
): Promise<ClientDietPlan> {
  const dto = await put<ClientDietPlanDto>(
    `/clients/${clientId}/diet-plan`,
    body,
    { params: { week: weekNum } },
  )
  return toClientPlan(dto)
}

/** `PATCH /clients/:id/diet-band` — move a user to a different daily target. */
export async function updateClientBand(
  clientId: string,
  body: UpdateClientBandBody,
): Promise<Client> {
  const dto = await patch<ClientDto>(`/clients/${clientId}/diet-band`, body)
  return toClient(dto)
}

export type { DietProfile }
