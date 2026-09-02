import { Icon } from '@/components/atoms/Icon'

/** Shown by each route's error boundary when a page crashes — scoped to the
 *  content column so the app shell (sidebar, topbar) stays usable and the user
 *  can navigate away. The boundary resets on navigation, since the route
 *  component unmounts. */
export function RouteErrorFallback() {
  return (
    <main className="content" role="alert">
      <div
        className="clients-empty is-error"
        style={{ margin: '56px auto', maxWidth: 460 }}
      >
        <Icon name="alert-triangle" />
        <p className="clients-empty-title">Something went wrong</p>
        <p>This page hit an unexpected error. Reloading usually fixes it.</p>
        <button
          type="button"
          className="btn-primary"
          style={{ maxWidth: 200 }}
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    </main>
  )
}
