// Aggregate MSW handlers across features. Each feature owns its handlers in
// features/<name>/api/<name>.handlers.ts; register them here.
import { clientsHandlers } from '@/features/clients/api/clients.handlers'
import { nutritionistsHandlers } from '@/features/nutritionists/api/nutritionists.handlers'
import { programsHandlers } from '@/features/programs/api/programs.handlers'
import { dashboardHandlers } from '@/features/dashboard/api/dashboard.handlers'

export const handlers = [
  ...clientsHandlers,
  ...nutritionistsHandlers,
  ...programsHandlers,
  ...dashboardHandlers,
]
