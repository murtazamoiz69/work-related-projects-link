import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mocks/server'

// Route every test's HTTP through MSW. `error` on unhandled requests surfaces
// missing handlers loudly instead of hanging.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
