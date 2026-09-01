import type { Client } from '@/features/clients'
import { formatJoinDate } from '@/features/clients'
import type { Program } from '../types'
import { deltaTone, fmtDelta } from '../data'

/** Every program the client has ever been on, each row with its own weight
 *  change. `programs` is [active, ...previous newest-first]. */
export function LifetimePrograms({
  client,
  programs,
}: {
  client: Client
  programs: Program[]
}) {
  const firstName = client.name.split(' ')[0]
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>All Programs</h2>
          <p className="panel-sub">
            Every plan {firstName} has been on with Nourish with Sim
          </p>
        </div>
      </div>
      <div className="clients-table-wrap">
        <table className="client-table measure-table">
          <thead>
            <tr>
              <th>Program</th>
              <th>Status</th>
              <th>Dates</th>
              <th>Duration</th>
              <th>Weight change</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => {
              const isActive = p.status === 'active'
              return (
                <tr key={p.id}>
                  <td>
                    <div className="cell-flex">
                      <span className="measure-week">{p.name}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${isActive ? 'status-active' : 'status-paused'}`}
                    >
                      {isActive ? 'Active' : 'Completed'}
                    </span>
                  </td>
                  <td>
                    {formatJoinDate(p.startDate)} –{' '}
                    {isActive ? 'Present' : formatJoinDate(p.endDate)}
                  </td>
                  <td>{p.totalWeeks} wks</td>
                  <td>
                    {p.weightChange != null ? (
                      <span
                        className={`delta-pill delta-${deltaTone(p.weightChange, true)}`}
                      >
                        {fmtDelta(p.weightChange, ' kg')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
