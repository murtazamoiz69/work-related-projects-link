// Workout-plan service — the programme's days (global) and the per-user copies.
// Pure typed functions over the shared HTTP client; the DTO -> domain mapping
// (ISO string -> Date) is the only work done here. See docs/api-guidelines.md.
import { get, post, put } from '@/lib/api/client'
import type { ClientWorkoutPlan, WorkoutPlan } from './workoutPlan.types'
import type {
  ClientWorkoutPlanDto,
  ResetClientWorkoutDayBody,
  SaveWorkoutDaysBody,
  WorkoutPlanDto,
} from './workoutPlan.api.types'

function toPlan(dto: WorkoutPlanDto): WorkoutPlan {
  return { days: dto.days, updatedAt: new Date(dto.updatedAt) }
}

function toClientPlan(dto: ClientWorkoutPlanDto): ClientWorkoutPlan {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}

/** `GET /program/workout-plan` — the whole run of days. */
export async function getWorkoutPlan(
  signal?: AbortSignal,
): Promise<WorkoutPlan> {
  const dto = await get<WorkoutPlanDto>('/program/workout-plan', { signal })
  return toPlan(dto)
}

/** `PUT /program/workout-plan/days` — save the edited day to the chosen days. */
export async function saveWorkoutDays(
  body: SaveWorkoutDaysBody,
): Promise<WorkoutPlan> {
  const dto = await put<WorkoutPlanDto>('/program/workout-plan/days', body)
  return toPlan(dto)
}

/** `POST /program/workout-plan/add-day` — append a blank day at the end. */
export async function addWorkoutDay(): Promise<WorkoutPlan> {
  const dto = await post<WorkoutPlanDto>('/program/workout-plan/add-day', {})
  return toPlan(dto)
}

/** `GET /clients/:id/workout-plan` — the user's copy of the run. */
export async function getClientWorkoutPlan(
  clientId: string,
  signal?: AbortSignal,
): Promise<ClientWorkoutPlan> {
  const dto = await get<ClientWorkoutPlanDto>(
    `/clients/${clientId}/workout-plan`,
    { signal },
  )
  return toClientPlan(dto)
}

/** `PUT /clients/:id/workout-plan/days` — the nutritionist's edit for one user. */
export async function saveClientWorkoutDays(
  clientId: string,
  body: SaveWorkoutDaysBody,
): Promise<ClientWorkoutPlan> {
  const dto = await put<ClientWorkoutPlanDto>(
    `/clients/${clientId}/workout-plan/days`,
    body,
  )
  return toClientPlan(dto)
}

/** `POST /clients/:id/workout-plan/reset` — one day back to the programme's. */
export async function resetClientWorkoutDay(
  clientId: string,
  day: number,
): Promise<ClientWorkoutPlan> {
  const body: ResetClientWorkoutDayBody = { day }
  const dto = await post<ClientWorkoutPlanDto>(
    `/clients/${clientId}/workout-plan/reset`,
    body,
  )
  return toClientPlan(dto)
}
