import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { env } from './lib/api/env'
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
// (dev by default; controlled by VITE_USE_MOCKS). Dynamically imported so the
// worker and handlers are never bundled into a real-backend production build.
async function enableMocking(): Promise<void> {
  if (!env.useMocks) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
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
