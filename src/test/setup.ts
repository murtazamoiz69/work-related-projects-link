import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mocks/server'
import { primeLibraries } from '@/features/programs/library-store'
import {
  EXERCISE_LIBRARY,
  MEAL_LIBRARY,
  WORKOUT_TEMPLATES,
} from '@/features/programs/data'

// The reference libraries are API-populated at app load; unit/component tests
// call plan builders + pickers directly, so prime the cache from the seed once
// (the app itself fetches `GET /libraries`).
primeLibraries({
  exercises: EXERCISE_LIBRARY,
  meals: MEAL_LIBRARY,
  workoutTemplates: WORKOUT_TEMPLATES,
})

// Route every test's HTTP through MSW. `error` on unhandled requests surfaces
// missing handlers loudly instead of hanging.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
