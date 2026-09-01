// MSW server for tests (Node). Wired into src/test/setup.ts so unit/integration
// tests exercise the real client -> transport -> handler path.
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
