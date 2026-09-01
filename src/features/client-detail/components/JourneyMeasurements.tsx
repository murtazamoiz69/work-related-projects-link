import { useState } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { formatJoinDate } from '@/features/clients'
import type { JourneyMetric, Program } from '../types'
import { JOURNEY_METRIC_COLOR, deltaTone, fmtDelta } from '../data'
import { StatCard } from './atoms'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
)

const METRICS: Array<{ key: JourneyMetric; label: string }> = [
  { key: 'weight', label: 'Weight' },
  { key: 'waist', label: 'Waist' },
  { key: 'chest', label: 'Chest' },
  { key: 'hips', label: 'Hips' },
]

// A quiet, single-series line chart — no legend, muted axis, one accent color.
function MetricChart({
  program,
  metric,
}: {
  program: Program
  metric: JourneyMetric
}) {
  const labels = program.weeks.map((w) => `W${w.week}`)
  const series = program.weeks.map((w) => {
    if (!w.submitted) return null
    if (metric === 'weight') return w.weightKg
    return w.measurements ? w.measurements[metric] : null
  })
  const color = JOURNEY_METRIC_COLOR[metric]
  const unit = metric === 'weight' ? ' kg' : ' cm'

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.parsed.y}${unit}` },
      },
    },
    scales: {
      y: {
        ticks: { callback: (v) => `${v}${unit}` },
        grid: { color: '#EEF0EA' },
      },
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
      },
    },
  }

  return (
    <div className="chart-wrap">
      <Line
        data={{
          labels,
          datasets: [
            {
              data: series,
              borderColor: color,
              backgroundColor: `${color}22`,
              pointBackgroundColor: color,
              pointRadius: series.length > 20 ? 0 : 3,
              borderWidth: 2,
              tension: 0.3,
              spanGaps: true,
              fill: true,
            },
          ],
        }}
        options={options}
      />
    </div>
  )
}

/** Measurements sub-tab: summary stats, a metric-switchable trend chart, and the
 *  full weekly measurement table. */
export function JourneyMeasurements({ program }: { program: Program }) {
  const [metric, setMetric] = useState<JourneyMetric>('weight')
  const first = program.weeks.filter((w) => w.submitted)[0]

  return (
    <>
      <div className="measure-stats">
        <StatCard
          value={fmtDelta(program.weightChange, ' kg')}
          label="Weight change"
          tone={deltaTone(program.weightChange, true)}
        />
        <StatCard
          value={fmtDelta(program.waistChange, ' cm')}
          label="Waist change"
          tone={deltaTone(program.waistChange, true)}
        />
        <StatCard
          value={program.consistency != null ? `${program.consistency}%` : '—'}
          label="Consistency"
        />
        <StatCard value={program.weeksLogged} label="Weeks logged" />
      </div>

      <div className="measure-chart">
        <div className="measurement-chart-head">
          <span className="progress-title">
            Trend across {program.totalWeeks} weeks
          </span>
          <div
            className="view-toggle text-toggle"
            role="tablist"
            aria-label="Switch metric"
          >
            {METRICS.map((m) => (
              <button
                key={m.key}
                className={`view-toggle-btn${metric === m.key ? ' active' : ''}`}
                role="tab"
                aria-selected={metric === m.key}
                onClick={() => setMetric(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <MetricChart program={program} metric={metric} />
      </div>

      <div className="clients-table-wrap">
        <table className="client-table measure-table journey-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Date</th>
              <th>Weight</th>
              <th>Chest</th>
              <th>Waist</th>
              <th>Hips</th>
              <th>Δ Waist</th>
              <th>Coach note</th>
            </tr>
          </thead>
          <tbody>
            {program.weeks.map((w) => {
              const m = w.measurements
              const dWaist =
                m && first && first.measurements
                  ? Math.round((m.waist - first.measurements.waist) * 10) / 10
                  : null
              return (
                <tr key={w.week} className={w.submitted ? '' : 'row-muted'}>
                  <td>
                    <div className="cell-flex">
                      <span className="measure-week">Week {w.week}</span>
                    </div>
                  </td>
                  <td>{formatJoinDate(w.date)}</td>
                  <td>{w.weightKg != null ? `${w.weightKg} kg` : '—'}</td>
                  <td>{m ? m.chest : '—'}</td>
                  <td>{m ? m.waist : '—'}</td>
                  <td>{m ? m.hips : '—'}</td>
                  <td>
                    {dWaist != null ? (
                      <span
                        className={`delta-pill delta-${deltaTone(dWaist, true)}`}
                      >
                        {fmtDelta(dWaist, '')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="ct-text">{w.coachNote ? w.coachNote : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
