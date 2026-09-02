// MSW handler for the reference libraries. Serves the seed catalogs (the mock
// backend's copy) — a real backend owns these. Registered in src/mocks/handlers.ts.
import { http, HttpResponse } from 'msw'
import { env } from '@/lib/api/env'
import { EXERCISE_LIBRARY, MEAL_LIBRARY, WORKOUT_TEMPLATES } from '../data'

export const librariesHandlers = [
  http.get(`${env.apiUrl}/libraries`, () =>
    HttpResponse.json({
      exercises: EXERCISE_LIBRARY,
      meals: MEAL_LIBRARY,
      workoutTemplates: WORKOUT_TEMPLATES,
    }),
  ),
]
