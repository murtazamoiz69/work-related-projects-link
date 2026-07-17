import type { ReactNode } from 'react'
import { Topbar } from '@/components/organisms/Topbar'

type PlaceholderProps = {
  title?: ReactNode
  subtitle?: ReactNode
  back?: { to: string; label: string }
  phase: string
}

/** Temporary screen shell for routes not yet ported — keeps the shell fully
 *  navigable while each phase lands. */
export function Placeholder({ title, subtitle, back, phase }: PlaceholderProps) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} back={back} />
      <main className="content">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Coming soon</h2>
              <p className="panel-sub">
                This screen is being ported from the V2 prototype.
              </p>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Scheduled for {phase}.
          </p>
        </section>
      </main>
    </>
  )
}
