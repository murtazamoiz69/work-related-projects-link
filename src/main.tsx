import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { setUnauthorizedHandler } from './lib/api/auth'
import { router } from './lib/router'
import { useAuthStore } from './store/useAuthStore'
import './index.css'

// On any 401 the HTTP client clears the token and calls this: log out and send
// the user to /login. Registered outside React so the interceptor can trigger
// it without a store/router import cycle.
setUnauthorizedHandler(() => {
  useAuthStore.getState().logout()
  void router.navigate({ to: '/login' })
})

// Start the MSW mock worker before the app renders when mocks are enabled
// (dev by default; controlled by VITE_USE_MOCKS). The guard below reads
// `import.meta.env` directly (not the parsed `env.useMocks`) so it folds to a
// compile-time constant: a real-backend `vite build` sees `false` and Rollup
// drops the dynamic import, keeping MSW + all handlers out of that bundle.
// `build:single` bakes VITE_USE_MOCKS='true', so the demo still ships mocks.
const MSW_RELOAD_FLAG = 'nws-msw-reload'

async function enableMocking(): Promise<void> {
  const useMocks =
    import.meta.env.VITE_USE_MOCKS === 'true' ||
    (import.meta.env.VITE_USE_MOCKS == null && import.meta.env.DEV)
  if (!useMocks) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })

  // The worker must CONTROL this page before the app fires its first requests,
  // or they bypass MSW and hit the real backend (ERR_CONNECTION_REFUSED). A
  // first-ever registration doesn't control the current document, so:
  //   1. already controlled -> proceed;
  //   2. otherwise wait briefly for the worker to claim this client;
  //   3. still uncontrolled -> reload once (loop-guarded) so the reloaded page
  //      loads under the worker's control.
  if (navigator.serviceWorker?.controller) {
    sessionStorage.removeItem(MSW_RELOAD_FLAG)
    return
  }

  await new Promise<void>((resolve) => {
    navigator.serviceWorker?.addEventListener(
      'controllerchange',
      () => resolve(),
      { once: true },
    )
    setTimeout(resolve, 600)
  })

  if (navigator.serviceWorker?.controller) {
    sessionStorage.removeItem(MSW_RELOAD_FLAG)
    return
  }

  if (!sessionStorage.getItem(MSW_RELOAD_FLAG)) {
    sessionStorage.setItem(MSW_RELOAD_FLAG, '1')
    window.location.reload()
    // Halt rendering until the reload takes over.
    await new Promise<never>(() => {})
  }
}

function mount(): void {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element #root not found')
  }
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void enableMocking().then(mount)
