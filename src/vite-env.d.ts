/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API. */
  readonly VITE_API_URL?: string
  /** development | staging | production */
  readonly VITE_APP_ENV?: string
  /** 'true' | 'false'. Unset → on in dev, off in production. */
  readonly VITE_USE_MOCKS?: string
  /** 'true' bakes hash-history routing (single-file demo build). */
  readonly VITE_HASH_ROUTER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
