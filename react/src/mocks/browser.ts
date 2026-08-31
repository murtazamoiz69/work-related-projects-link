// MSW worker for the browser (dev). Started from main.tsx only when
// env.useMocks is true. See docs/api-guidelines.md.
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
