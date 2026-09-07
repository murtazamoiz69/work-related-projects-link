// Aggregate MSW handlers across features. Each feature owns its handlers in
// features/<name>/api/<name>.handlers.ts; register them here.
//
// A feature named in VITE_LIVE_APIS has its handlers skipped, so its calls fall
// through MSW (onUnhandledRequest: 'bypass') to the real backend — the
// per-feature migration switch. With the flag empty (the default, and the
// offline demo) every feature stays mocked.
import { env } from '@/lib/api/env'
import { clientsHandlers } from '@/features/clients/api/clients.handlers'
import { nutritionistsHandlers } from '@/features/nutritionists/api/nutritionists.handlers'
import { programsHandlers } from '@/features/programs/api/programs.handlers'
import { librariesHandlers } from '@/features/programs/api/libraries.handlers'
import { clientDetailHandlers } from '@/features/client-detail/api/detail.handlers'
import { dashboardHandlers } from '@/features/dashboard/api/dashboard.handlers'
import { authHandlers } from '@/features/auth/api/auth.handlers'
import { chatHandlers } from '@/features/chat/api/chat.handlers'
import { planHandlers } from '@/features/chat/plan-workspace/api/plan.handlers'
import { dietPlanHandlers } from '@/features/programs/diet/dietPlan.handlers'
import { workoutPlanHandlers } from '@/features/programs/workout/workoutPlan.handlers'

const live = new Set(env.liveApis)
const forFeature = <T>(name: string, list: T[]): T[] =>
  live.has(name) ? [] : list

export const handlers = [
  ...forFeature('auth', authHandlers),
  ...forFeature('clients', clientsHandlers),
  ...forFeature('nutritionists', nutritionistsHandlers),
  ...programsHandlers,
  ...librariesHandlers,
  ...forFeature('client-detail', clientDetailHandlers),
  ...forFeature('dashboard', dashboardHandlers),
  ...chatHandlers,
  ...planHandlers,
  ...dietPlanHandlers,
  ...workoutPlanHandlers,
]
