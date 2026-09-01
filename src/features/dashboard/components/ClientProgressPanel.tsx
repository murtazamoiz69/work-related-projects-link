import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { apiErrorMessage } from '@/lib/api/errors'
import { useMiniTooltip } from '@/hooks/useMiniTooltip'
import {
  useClientProgressQuery,
  useDashboardProgramsQuery,
} from '../hooks/useDashboardQueries'

function roundedTopBarPath(
  x: number,
  w: number,
  top: number,
  bottom: number,
): string {
  const r = Math.min(6, w / 2, bottom - top)
  return `M${x.toFixed(1)},${bottom.toFixed(1)}
    L${x.toFixed(1)},${(top + r).toFixed(1)}
    Q${x.toFixed(1)},${top.toFixed(1)} ${(x + r).toFixed(1)},${top.toFixed(1)}
    L${(x + w - r).toFixed(1)},${top.toFixed(1)}
    Q${(x + w).toFixed(1)},${top.toFixed(1)} ${(x + w).toFixed(1)},${(top + r).toFixed(1)}
    L${(x + w).toFixed(1)},${bottom.toFixed(1)} Z`
}

type BarChartProps = {
  values: number[]
  ticks: string[]
  tips: string[]
  colorVar: string
}

function BarChart({ values, ticks, tips, colorVar }: BarChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const { show, hide, tooltip } = useMiniTooltip()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setContainerWidth(el.clientWidth)
    // Read the width the observer already measured (`contentRect`) instead of
    // re-querying `el.clientWidth` inside the callback: that forces a
    // synchronous reflow on every notification, and combined with a grid
    // track that could still grow to fit its content, turned into a runaway
    // resize -> re-render -> resize loop that visibly inflated the chart.
    const ro = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      setContainerWidth((prev) => (prev === width ? prev : width))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const chartH = 160
  const n = values.length
  const minSlot = 34
  const w = Math.max(containerWidth || 0, n * minSlot)
  const slot = w / n
  const gap = Math.min(slot * 0.32, 20)
  const barW = slot - gap

  return (
    <div className="progress-chart-scroll" ref={ref}>
      {containerWidth > 0 ? (
        <svg
          viewBox={`0 0 ${w.toFixed(1)} ${chartH + 28}`}
          width={w.toFixed(1)}
          height={chartH + 28}
          className="progress-chart-svg"
        >
          {values.map((v, i) => {
            const barH = Math.max(4, (v / 100) * chartH)
            const x = i * slot + gap / 2
            const path = roundedTopBarPath(x, barW, chartH - barH, chartH)
            return (
              <path
                key={i}
                className="progress-bar"
                tabIndex={0}
                d={path}
                fill={`var(${colorVar})`}
                onMouseEnter={(e) => show(e, `${tips[i]}: ${v}%`)}
                onMouseLeave={hide}
              />
            )
          })}
          {ticks.map((l, i) => {
            const x = i * slot + slot / 2
            return (
              <text
                key={i}
                x={x.toFixed(1)}
                y={chartH + 20}
                textAnchor="middle"
                className="progress-chart-tick"
              >
                {l}
              </text>
            )
          })}
        </svg>
      ) : null}
      {tooltip}
    </div>
  )
}

export function ClientProgressPanel() {
  const [rangeDays, setRangeDays] = useState(30)
  const [program, setProgram] = useState('all')
  const { data: programs = [] } = useDashboardProgramsQuery()
  const { data, isPending, isError, error, refetch, isFetching } =
    useClientProgressQuery(rangeDays, program)

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>User Progress</h2>
          <p className="panel-sub">
            Cohort-wide trends across your {data?.activeClients ?? 0} active
            users
          </p>
        </div>
        <div className="panel-head-actions">
          <select
            className="select-range"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            aria-label="Filter by program"
          >
            <option value="all">All Programs</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className="select-range"
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            aria-label="Date range"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {isError && !data ? (
        <div className="clients-empty is-error" role="alert">
          <Icon name="alert-triangle" />
          <p>{apiErrorMessage(error)}</p>
          <button
            className="link-btn clients-empty-retry"
            onClick={() => refetch()}
          >
            Try again
          </button>
        </div>
      ) : isPending || !data ? (
        <div className="progress-chart-grid" aria-busy="true">
          <div className="panel progress-card">
            <span className="skel skel-wide" style={{ height: '1.25rem' }} />
            <div style={{ height: 160 }} />
          </div>
          <div className="panel progress-card">
            <span className="skel skel-wide" style={{ height: '1.25rem' }} />
            <div style={{ height: 160 }} />
          </div>
        </div>
      ) : (
        <div
          className="progress-chart-grid"
          aria-busy={isFetching || undefined}
        >
          <div className="panel progress-card">
            <div className="progress-card-head">
              <span className="progress-card-icon tone-blue">
                <Icon name="utensils" />
              </span>
              <div className="progress-card-heading">
                <span className="progress-card-label">Meal Adherence</span>
                <span className="progress-card-headline">
                  {data.meals.headline}%
                  <span className="progress-card-sub"> on-plan this week</span>
                </span>
              </div>
            </div>
            <BarChart
              values={data.meals.values}
              ticks={data.ticks}
              tips={data.tips}
              colorVar="--blue"
            />
          </div>

          <div className="panel progress-card">
            <div className="progress-card-head">
              <span className="progress-card-icon tone-coral">
                <Icon name="dumbbell" />
              </span>
              <div className="progress-card-heading">
                <span className="progress-card-label">Workout Completion</span>
                <span className="progress-card-headline">
                  {data.workouts.headline}%
                  <span className="progress-card-sub"> completion rate</span>
                </span>
              </div>
            </div>
            <BarChart
              values={data.workouts.values}
              ticks={data.ticks}
              tips={data.tips}
              colorVar="--coral"
            />
          </div>
        </div>
      )}
    </section>
  )
}
