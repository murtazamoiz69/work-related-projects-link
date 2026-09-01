// Validated, boot-safe public configuration. Everything here ships in the
// client bundle and is therefore PUBLIC — never put a secret in a VITE_ var
// (secrets belong on the backend). See docs/api-guidelines.md.
//
// Unlike the previous version, this never throws at import: a missing/invalid
// env falls back to safe development defaults, so the app boots and tests run
// without a .env file.
import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3000'),
  VITE_APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  // Optional explicit override for the mock switch; when unset the default is
  // derived from the build mode (mocks on in dev, off elsewhere).
  VITE_USE_MOCKS: z.enum(['true', 'false']).optional(),
})

const parsed = envSchema.safeParse(import.meta.env)
const values = parsed.success ? parsed.data : envSchema.parse({})

export const env = {
  apiUrl: values.VITE_API_URL,
  appEnv: values.VITE_APP_ENV,
  /** Serve API calls from MSW mocks. Explicit flag wins; otherwise on in dev. */
  useMocks:
    values.VITE_USE_MOCKS != null
      ? values.VITE_USE_MOCKS === 'true'
      : Boolean(import.meta.env.DEV),
} as const
