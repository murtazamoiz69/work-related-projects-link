import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { env } from './lib/api/env'
import './index.css'

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
