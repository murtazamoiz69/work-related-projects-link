// Workout-plan service — the programme's weeks (global) and the per-user
// copies. Pure typed functions over the shared HTTP client; the DTO -> domain
// mapping (ISO string -> Date) is the only work done here.
// See docs/api-guidelines.md.
import { get, post, put } from '@/lib/api/client'
import type { ClientWorkoutWeek, WorkoutWeekSheet } from './workoutPlan.types'
import type {
  ClientWorkoutWeekDto,
  DuplicateWorkoutWeekBody,
  DuplicateWorkoutWeekResultDto,
  SaveWorkoutDayBody,
  SwapWorkoutDaysBody,
  WorkoutWeekSheetDto,
} from './workoutPlan.api.types'

function toWeek(dto: WorkoutWeekSheetDto): WorkoutWeekSheet {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}

function toClientWeek(dto: ClientWorkoutWeekDto): ClientWorkoutWeek {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}

/** `GET /program/workout-plan?week=` — one week of the programme. */
export async function getWorkoutWeek(
  weekNum: number,
  signal?: AbortSignal,
): Promise<WorkoutWeekSheet> {
  const dto = await get<WorkoutWeekSheetDto>('/program/workout-plan', {
    params: { week: weekNum },
    signal,
  })
  return toWeek(dto)
}

/** `PUT /program/workout-plan/day` — save one day of the programme. */
export async function saveWorkoutDay(
  body: SaveWorkoutDayBody,
): Promise<WorkoutWeekSheet> {
  const dto = await put<WorkoutWeekSheetDto>('/program/workout-plan/day', body)
  return toWeek(dto)
}

/** `POST /program/workout-plan/swap` — trade two days within a week. */
export async function swapWorkoutDays(
  body: SwapWorkoutDaysBody,
): Promise<WorkoutWeekSheet> {
  const dto = await post<WorkoutWeekSheetDto>(
    '/program/workout-plan/swap',
    body,
  )
  return toWeek(dto)
}

/** `POST /program/workout-plan/duplicate` — copy one week onto others. */
export async function duplicateWorkoutWeek(
  body: DuplicateWorkoutWeekBody,
): Promise<DuplicateWorkoutWeekResultDto> {
  return post<DuplicateWorkoutWeekResultDto>(
    '/program/workout-plan/duplicate',
    body,
  )
}

/** `GET /clients/:id/workout-plan?week=` — the user's copy of a week. */
export async function getClientWorkoutWeek(
  clientId: string,
  weekNum: number,
  signal?: AbortSignal,
): Promise<ClientWorkoutWeek> {
  const dto = await get<ClientWorkoutWeekDto>(
    `/clients/${clientId}/workout-plan`,
    { params: { week: weekNum }, signal },
  )
  return toClientWeek(dto)
}

/** `PUT /clients/:id/workout-plan/day` — the nutritionist's edit for one user. */
export async function saveClientWorkoutDay(
  clientId: string,
  body: SaveWorkoutDayBody,
): Promise<ClientWorkoutWeek> {
  const dto = await put<ClientWorkoutWeekDto>(
    `/clients/${clientId}/workout-plan/day`,
    body,
  )
  return toClientWeek(dto)
}

/** `POST /clients/:id/workout-plan/swap` — trade two days for one user. */
export async function swapClientWorkoutDays(
  clientId: string,
  body: SwapWorkoutDaysBody,
): Promise<ClientWorkoutWeek> {
  const dto = await post<ClientWorkoutWeekDto>(
    `/clients/${clientId}/workout-plan/swap`,
    body,
  )
  return toClientWeek(dto)
}

/** `POST /clients/:id/workout-plan/reset?week=` — drop this user's version of a
 *  week and go back to the programme's. */
export async function resetClientWorkoutWeek(
  clientId: string,
  weekNum: number,
): Promise<ClientWorkoutWeek> {
  const dto = await post<ClientWorkoutWeekDto>(
    `/clients/${clientId}/workout-plan/reset`,
    {},
    { params: { week: weekNum } },
  )
  return toClientWeek(dto)
}
