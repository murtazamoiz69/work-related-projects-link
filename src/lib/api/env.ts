// Validated, boot-safe public configuration. Everything here ships in the
// client bundle and is therefore PUBLIC — never put a secret in a VITE_ var
// (secrets belong on the backend). See docs/api-guidelines.md.
//
// Unlike the previous version, this never throws at import: a missing/invalid
// env falls back to safe development defaults, so the app boots and tests run
// without a .env file.
import { z } from 'zod'

const envSchema = z.object({
  // A full URL (real backend) or a same-origin path like "/api/v1" (used with
  // the dev proxy to avoid CORS) — so this is a plain non-empty string, not a
  // strict URL.
  VITE_API_URL: z.string().min(1).default('http://localhost:3000'),
  VITE_APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  // Optional explicit override for the mock switch; when unset the default is
  // derived from the build mode (mocks on in dev, off elsewhere).
  VITE_USE_MOCKS: z.enum(['true', 'false']).optional(),
  // Comma-separated feature names whose calls should hit the REAL backend even
  // while mocks are on for everything else — the per-feature migration switch
  // (e.g. "auth,clients,nutritionists"). Empty = every feature stays mocked,
  // which keeps the offline demo (build:single) working unchanged.
  VITE_LIVE_APIS: z.string().optional(),
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
  /** Features wired to the real backend (their MSW handlers are skipped). */
  liveApis: (values.VITE_LIVE_APIS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
} as const
