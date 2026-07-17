import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { useMiniTooltip } from '@/hooks/useMiniTooltip'
import { buildClientProgress } from '../data'

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
    const update = () => setContainerWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
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
  const data = useMemo(() => buildClientProgress(rangeDays), [rangeDays])

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Client Progress</h2>
          <p className="panel-sub">
            Cohort-wide trends across your {data.activeClients} active clients
          </p>
        </div>
        <div className="panel-head-actions">
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

      <div className="progress-chart-grid">
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
    </section>
  )
}
