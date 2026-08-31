// Aggregate MSW handlers across features. Each feature owns its handlers in
// features/<name>/api/<name>.handlers.ts; register them here.
import { clientsHandlers } from '@/features/clients/api/clients.handlers'

export const handlers = [...clientsHandlers]
