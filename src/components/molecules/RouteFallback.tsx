/** Shown while a lazy route chunk loads, instead of a blank flash. Renders a
 *  light skeleton in the content column so the shell stays put. */
export function RouteFallback() {
  return (
    <main className="content" aria-busy="true" aria-label="Loading page">
      <div className="panel" style={{ padding: 24 }}>
        <span
          className="skel skel-wide"
          style={{ height: '1.5rem', display: 'block' }}
        />
        <div style={{ height: 20 }} />
        <span className="skel" style={{ display: 'block' }} />
        <div style={{ height: 12 }} />
        <span className="skel skel-narrow" style={{ display: 'block' }} />
      </div>
    </main>
  )
}
