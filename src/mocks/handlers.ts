// Aggregate MSW handlers across features. Each feature owns its handlers in
// features/<name>/api/<name>.handlers.ts; register them here.
//
// A feature named in VITE_LIVE_APIS has its handlers skipped, so its calls fall
// through MSW (onUnhandledRequest: 'bypass') to the real backend — the
// per-feature migration switch. With the flag empty (the default, and the
// offline demo) every feature stays mocked.
//
// The Programs page is split into per-resource flags so each can be flipped
// independently: `program` (GET/PUT /program + PATCH /program/availability),
// `program-workout` (/program/workout-plan*), `program-diet`
// (/program/diet-plan*), `libraries` (/libraries/calorie-bands).
//
// The Plan Workspace uses `plan-workspace` (GET/PUT /clients/:id/plan, plus the
// per-client /clients/:id/workout-plan* and /clients/:id/diet-plan* endpoints)
// and `client-detail` (GET /clients/:id/detail — the "At a glance" tracker).
import { env } from '@/lib/api/env'
import { clientsHandlers } from '@/features/clients/api/clients.handlers'
import { nutritionistsHandlers } from '@/features/nutritionists/api/nutritionists.handlers'
import { programHandlers } from '@/features/programs/api/programs.handlers'
import { calorieBandsHandlers } from '@/features/programs/api/libraries.handlers'
import { clientDetailHandlers } from '@/features/client-detail/api/detail.handlers'
import { dashboardHandlers } from '@/features/dashboard/api/dashboard.handlers'
import { authHandlers } from '@/features/auth/api/auth.handlers'
import { chatHandlers } from '@/features/chat/api/chat.handlers'
import { planHandlers } from '@/features/chat/plan-workspace/api/plan.handlers'
import {
  masterDietPlanHandlers,
  clientDietPlanHandlers,
} from '@/features/programs/diet/dietPlan.handlers'
import {
  masterWorkoutPlanHandlers,
  clientWorkoutPlanHandlers,
} from '@/features/programs/workout/workoutPlan.handlers'

const live = new Set(env.liveApis)
const forFeature = <T>(name: string, list: T[]): T[] =>
  live.has(name) ? [] : list

export const handlers = [
  ...forFeature('auth', authHandlers),
  ...forFeature('clients', clientsHandlers),
  ...forFeature('nutritionists', nutritionistsHandlers),
  ...forFeature('program', programHandlers),
  ...forFeature('program-workout', masterWorkoutPlanHandlers),
  ...forFeature('program-diet', masterDietPlanHandlers),
  ...forFeature('libraries', calorieBandsHandlers),
  ...forFeature('plan-workspace', planHandlers),
  ...forFeature('plan-workspace', clientWorkoutPlanHandlers),
  ...forFeature('plan-workspace', clientDietPlanHandlers),
  ...forFeature('client-detail', clientDetailHandlers),
  ...forFeature('dashboard', dashboardHandlers),
  ...chatHandlers,
]
