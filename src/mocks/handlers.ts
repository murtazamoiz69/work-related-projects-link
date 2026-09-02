// Aggregate MSW handlers across features. Each feature owns its handlers in
// features/<name>/api/<name>.handlers.ts; register them here.
import { clientsHandlers } from '@/features/clients/api/clients.handlers'
import { nutritionistsHandlers } from '@/features/nutritionists/api/nutritionists.handlers'
import { programsHandlers } from '@/features/programs/api/programs.handlers'
import { librariesHandlers } from '@/features/programs/api/libraries.handlers'
import { clientDetailHandlers } from '@/features/client-detail/api/detail.handlers'
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
  ...librariesHandlers,
  ...clientDetailHandlers,
  ...dashboardHandlers,
  ...settingsHandlers,
  ...chatHandlers,
  ...planHandlers,
]
