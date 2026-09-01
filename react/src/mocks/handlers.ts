// Aggregate MSW handlers across features. Each feature owns its handlers in
// features/<name>/api/<name>.handlers.ts; register them here.
import { clientsHandlers } from '@/features/clients/api/clients.handlers'
import { nutritionistsHandlers } from '@/features/nutritionists/api/nutritionists.handlers'
import { programsHandlers } from '@/features/programs/api/programs.handlers'
import { dashboardHandlers } from '@/features/dashboard/api/dashboard.handlers'
import { settingsHandlers } from '@/features/settings/api/settings.handlers'
import { authHandlers } from '@/features/auth/api/auth.handlers'
import { chatHandlers } from '@/features/chat/api/chat.handlers'
import { planHandlers } from '@/features/chat/plan-workspace/api/plan.handlers'

export const handlers = [
  ...authHandlers,
  ...clientsHandlers,
  ...nutritionistsHandlers,
  ...programsHandlers,
  ...dashboardHandlers,
  ...settingsHandlers,
  ...chatHandlers,
  ...planHandlers,
]
