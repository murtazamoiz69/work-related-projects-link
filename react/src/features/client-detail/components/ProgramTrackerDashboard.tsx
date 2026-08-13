import { useEffect, useMemo, useState } from 'react'
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
import { Icon } from '@/components/atoms/Icon'
import type { Client } from '@/features/clients'
import { CONVERSATIONS } from '@/features/chat'
import type { ClientDetail, Program } from '../types'
import { clientSeed } from '../data'
import {
  buildProgramTracker,
  dateKey,
  MEALS_PER_DAY,
  numericStat,
  presenceStat,
  SESSIONS_PER_DAY,
  weightStat,
  type DailyLog,
  type MetricStatus,
  type ProgramTracker,
} from '../tracker'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
)

const STATUS_LABEL: Record<MetricStatus, string> = {
  good: 'Good',
  warn: 'Below target',
  bad: 'Way under',
  none: 'No logs',
}

// Weight is a distance-to-goal metric (can be over or under), so "Below
// target" / "Way under" don't fit — use a proximity-worded set instead.
const WEIGHT_STATUS_LABEL: Record<MetricStatus, string> = {
  good: 'On target',
  warn: 'Near target',
  bad: 'Off target',
  none: 'No logs',
}

// One colour per metric, shared by the stat cards, the trend charts and the
// daily log bars so a metric reads the same everywhere on the tab.
const METRIC_COLOR = {
  calEaten: '#BA2747',
  calBurned: '#7F29A7',
  steps: '#F46D2A',
  hydration: '#4A90D9',
  weight: '#2F5D50',
  workout: '#1C7A4E',
  cardio: '#0E7490',
} as const

// ===================== Header: stat row + program switcher =====================

/** A plain "Program" label — clients only ever have the one active program,
 *  so this just names it. Exported because the Plan Workspace renders it in
 *  its own topbar instead of above the tracker — see ProgramTrackerDashboard's
 *  `hideSwitcher`. */
export function CurrentProgramLabel({
  program,
  className,
}: {
  program: Program
  className?: string
}) {
  return (
    <div className={`journey-switcher${className ? ` ${className}` : ''}`}>
      <span className="journey-switch-label">Program</span>
      <span className="journey-select-btn">{program.name}</span>
    </div>
  )
}

// ===================== Stat row: whole-program KPI cards =====================

function TrackerStatCard({
  icon,
  label,
  value,
  unit,
  statusLabel,
  tone,
  targetText,
  adherencePct,
  daysText,
  color,
}: {
  icon: string
  label: string
  value: string
  unit?: string
  statusLabel: string
  tone: MetricStatus
  targetText: string
  adherencePct: number | null
  daysText: string
  color: string
}) {
  return (
    <div className="tracker-stat-card">
      <div className="tracker-stat-icon-row">
        <span
          className="tracker-stat-icon"
          style={{ background: `${color}1f`, color }}
        >
          <Icon name={icon} size={14} />
        </span>
        <span className="tracker-stat-label">{label}</span>
      </div>
      <div className="tracker-stat-value">
        {value}
        {unit ? <small>{unit}</small> : null}
      </div>
      <div className={`tracker-stat-status tone-${tone}`}>
        <span className="tracker-stat-status-dot" />
        {statusLabel}
      </div>
      <div className="tracker-stat-foot">
        <span className="tracker-stat-target">{targetText}</span>
        {adherencePct != null ? (
          <div className="tracker-stat-adherence">
            <div className="tracker-stat-adherence-track">
              <div
                className="tracker-stat-adherence-fill"
                style={{
                  width: `${Math.min(100, adherencePct)}%`,
                  background: color,
                }}
              />
            </div>
            <span className="tracker-stat-adherence-pct">{adherencePct}%</span>
          </div>
        ) : null}
        <span className="tracker-stat-days">{daysText}</span>
      </div>
    </div>
  )
}

function TrackerStatRow({
  tracker,
  fallbackWeightKg,
}: {
  tracker: ProgramTracker
  fallbackWeightKg: number
}) {
  const days = tracker.days
  const targets = tracker.targets

  const calEaten = numericStat(
    days.map((d) => d.calEaten),
    targets.calEaten,
  )
  const calBurned = numericStat(
    days.map((d) => d.calBurned),
    targets.calBurned,
  )
  const steps = numericStat(
    days.map((d) => d.steps),
    targets.steps,
  )
  const hydration = numericStat(
    days.map((d) => d.hydrationL),
    targets.hydrationL,
  )
  const weight = weightStat(tracker, fallbackWeightKg)
  const workout = presenceStat(days.map((d) => d.workout))
  const cardio = presenceStat(days.map((d) => d.cardio))

  return (
    <div className="tracker-stat-row">
      <TrackerStatCard
        icon="utensils"
        label="Avg. Calories Eaten"
        value={
          calEaten.average != null
            ? Math.round(calEaten.average).toLocaleString()
            : '—'
        }
        unit=" kcal"
        statusLabel={STATUS_LABEL[calEaten.status]}
        tone={calEaten.status}
        targetText={`Target ${targets.calEaten.toLocaleString()} kcal`}
        adherencePct={calEaten.consistencyPct}
        daysText={`${calEaten.daysLogged} of ${calEaten.totalDays} days logged`}
        color={METRIC_COLOR.calEaten}
      />
      <TrackerStatCard
        icon="flame"
        label="Avg. Calories Burned"
        value={
          calBurned.average != null
            ? Math.round(calBurned.average).toLocaleString()
            : '—'
        }
        unit=" kcal"
        statusLabel={STATUS_LABEL[calBurned.status]}
        tone={calBurned.status}
        targetText={`Target ${targets.calBurned.toLocaleString()} kcal`}
        adherencePct={calBurned.consistencyPct}
        daysText={`${calBurned.daysLogged} of ${calBurned.totalDays} days logged`}
        color={METRIC_COLOR.calBurned}
      />
      <TrackerStatCard
        icon="activity"
        label="Avg. Steps"
        value={
          steps.average != null
            ? Math.round(steps.average).toLocaleString()
            : '—'
        }
        statusLabel={STATUS_LABEL[steps.status]}
        tone={steps.status}
        targetText={`Target ${targets.steps.toLocaleString()}`}
        adherencePct={steps.consistencyPct}
        daysText={`${steps.daysLogged} of ${steps.totalDays} days logged`}
        color={METRIC_COLOR.steps}
      />
      <TrackerStatCard
        icon="droplet"
        label="Avg. Hydration"
        value={hydration.average != null ? hydration.average.toFixed(1) : '—'}
        unit=" L"
        statusLabel={STATUS_LABEL[hydration.status]}
        tone={hydration.status}
        targetText={`Target ${targets.hydrationL} L`}
        adherencePct={hydration.consistencyPct}
        daysText={`${hydration.daysLogged} of ${hydration.totalDays} days logged`}
        color={METRIC_COLOR.hydration}
      />
      <TrackerStatCard
        icon="scale"
        label="Weight"
        value={weight.latest != null ? weight.latest.toFixed(1) : '—'}
        unit=" kg"
        statusLabel={WEIGHT_STATUS_LABEL[weight.status]}
        tone={weight.status}
        targetText={`Goal ${weight.goal} kg`}
        adherencePct={null}
        daysText={`${weight.daysLogged} of ${weight.totalDays} days logged`}
        color={METRIC_COLOR.weight}
      />
      <TrackerStatCard
        icon="dumbbell"
        label="Workouts"
        value={`${workout.pct}`}
        unit="%"
        statusLabel={STATUS_LABEL[workout.status]}
        tone={workout.status}
        targetText="Target: every scheduled session"
        adherencePct={workout.pct}
        daysText={`${workout.daysLogged} of ${workout.totalDays} days logged`}
        color={METRIC_COLOR.workout}
      />
      <TrackerStatCard
        icon="heart-pulse"
        label="PW Cardio"
        value={`${cardio.pct}`}
        unit="%"
        statusLabel={STATUS_LABEL[cardio.status]}
        tone={cardio.status}
        targetText="Target: every scheduled session"
        adherencePct={cardio.pct}
        daysText={`${cardio.daysLogged} of ${cardio.totalDays} days logged`}
        color={METRIC_COLOR.cardio}
      />
    </div>
  )
}

// ===================== Trend charts =====================

type ChartRange = '30' | '60' | 'all'

// Draws a vertical guide line from the hovered point down to the x-axis, so
// it's obvious which date a tooltip belongs to on a dense 60-day series.
const crosshairPlugin = {
  id: 'trackerCrosshair',
  afterDatasetsDraw(chart: ChartJS) {
    const active = chart.getActiveElements()
    if (!active.length) return
    const { ctx, chartArea } = chart
    const { x, y } = active[0].element
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, chartArea.bottom)
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.strokeStyle = 'rgba(60,70,66,.45)'
    ctx.stroke()
    ctx.restore()
  },
}

function TrendChart({
  title,
  days,
  field,
  target,
  color,
  unit,
}: {
  title: string
  days: DailyLog[]
  field:
    | 'calEaten'
    | 'calBurned'
    | 'steps'
    | 'hydrationL'
    | 'mealsLogged'
    | 'workoutsLogged'
  target: number
  color: string
  unit: string
}) {
  const [range, setRange] = useState<ChartRange>('30')
  const sliced = range === 'all' ? days : days.slice(-parseInt(range, 10))
  const labels = sliced.map((d) =>
    d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  )
  const values = sliced.map((d) => d[field] as number | null)
  const loggedCount = values.filter((v) => v != null).length
  const logged = values.filter((v): v is number => v != null)
  const average = logged.length
    ? Math.round(logged.reduce((a, b) => a + b, 0) / logged.length)
    : null
  const dense = sliced.length > 34

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    // 'index' + intersect:false means anywhere in a day's vertical band
    // activates that day — no need to land precisely on the dot.
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: (item) => item.datasetIndex === 0,
        backgroundColor: '#1f2422',
        padding: 10,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        displayColors: false,
        caretPadding: 8,
        callbacks: {
          title: (items) =>
            sliced[items[0].dataIndex]?.date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }) ?? '',
          label: (ctx) =>
            ctx.parsed.y == null
              ? 'Not logged'
              : `${ctx.parsed.y.toLocaleString()}${unit}`,
          afterLabel: (ctx) => {
            if (ctx.parsed.y == null) return ''
            const diff = ctx.parsed.y - target
            const pct = Math.round((ctx.parsed.y / target) * 100)
            return `${diff >= 0 ? '+' : ''}${diff.toLocaleString()} vs target · ${pct}%`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#8a9490',
          maxTicksLimit: 6,
          padding: 8,
        },
        grid: { color: '#eef0ee' },
      },
      x: {
        border: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#8a9490',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: dense ? 8 : 12,
          padding: 6,
        },
        grid: { display: false },
      },
    },
  }

  return (
    <div className="panel tracker-chart-panel">
      <div className="tracker-chart-head">
        <div className="tracker-chart-headings">
          <h3 className="tracker-chart-title">{title}</h3>
          <p className="tracker-chart-sub">
            {loggedCount} of {values.length} days logged
            {average != null ? ` · avg ${average.toLocaleString()}${unit}` : ''}
          </p>
        </div>
        <div className="tracker-chart-head-right">
          <div className="tracker-chart-legend">
            <span className="tracker-legend-item">
              <span
                className="tracker-legend-dot"
                style={{ background: color }}
              />
              Actual
            </span>
            <span className="tracker-legend-item">
              <span className="tracker-legend-line" />
              Target {target.toLocaleString()}
            </span>
          </div>
          <select
            className="select-range tracker-range-select"
            value={range}
            onChange={(e) => setRange(e.target.value as ChartRange)}
          >
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>
      <div className="tracker-chart-wrap">
        <Line
          plugins={[crosshairPlugin]}
          data={{
            labels,
            datasets: [
              {
                data: values,
                borderColor: color,
                backgroundColor: (ctx) => {
                  const { chartArea, ctx: c } = ctx.chart
                  if (!chartArea) return `${color}1f`
                  const g = c.createLinearGradient(
                    0,
                    chartArea.top,
                    0,
                    chartArea.bottom,
                  )
                  g.addColorStop(0, `${color}38`)
                  g.addColorStop(1, `${color}05`)
                  return g
                },
                borderWidth: 2.5,
                pointRadius: dense ? 2.5 : 4,
                pointHoverRadius: 7,
                pointHoverBorderWidth: 3,
                pointHitRadius: 24,
                pointBackgroundColor: '#fff',
                pointBorderColor: color,
                pointBorderWidth: 2,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#fff',
                tension: 0.35,
                fill: true,
                spanGaps: true,
              },
              {
                data: sliced.map(() => target),
                borderColor: '#9aa5a0',
                borderDash: [6, 5],
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 0,
                pointHitRadius: 0,
                fill: false,
                spanGaps: true,
              },
            ],
          }}
          options={options}
        />
      </div>
    </div>
  )
}

// ===================== Daily log coverage calendar =====================

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function LogCoverageCalendar({
  days,
  selectedKey,
  onSelect,
}: {
  days: DailyLog[]
  selectedKey: string
  onSelect: (key: string) => void
}) {
  const byKey = useMemo(() => {
    const map = new Map<string, DailyLog>()
    days.forEach((d) => map.set(dateKey(d.date), d))
    return map
  }, [days])

  const last = days[days.length - 1]?.date ?? new Date()
  const first = days[0]?.date ?? new Date()
  const [view, setView] = useState(() => ({
    year: last.getFullYear(),
    month: last.getMonth(),
  }))

  // Jump back to the tracker's own last day whenever the underlying data
  // changes (switching client or switching program via the header dropdown)
  // — otherwise the calendar would keep showing whatever month/day was
  // selected for the *previous* program.
  useEffect(() => {
    setView({ year: last.getFullYear(), month: last.getMonth() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const shiftMonth = (delta: number) => {
    setView((v) => {
      let month = v.month + delta
      let year = v.year
      if (month > 11) {
        month = 0
        year++
      } else if (month < 0) {
        month = 11
        year--
      }
      return { year, month }
    })
  }

  const firstOfMonth = new Date(view.year, view.month, 1)
  let startOffset = firstOfMonth.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()

  const cells: React.ReactNode[] = []
  for (let i = 0; i < startOffset; i++) {
    cells.push(
      <div className="tracker-cal-cell tracker-cal-empty" key={`e${i}`} />,
    )
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(view.year, view.month, d)
    const outside = date < first || date > last
    if (outside) {
      cells.push(
        <div className="tracker-cal-cell tracker-cal-outside" key={d}>
          {d}
        </div>,
      )
      continue
    }
    const key = dateKey(date)
    const row = byKey.get(key)
    let filled = 0
    if (row) {
      if (row.calBurned != null) filled++
      if (row.steps != null) filled++
      if (row.calEaten != null) filled++
    }
    const status =
      filled === 3
        ? 'full'
        : filled === 2
          ? 'partial'
          : filled === 1
            ? 'calorieonly'
            : 'nodata'
    cells.push(
      <button
        type="button"
        key={d}
        className={`tracker-cal-cell tracker-cal-${status}${key === selectedKey ? ' selected' : ''}`}
        title={`${MONTH_NAMES[view.month]} ${d}, ${view.year} — ${filled}/3 core metrics logged`}
        onClick={() => onSelect(key)}
      >
        {d}
      </button>,
    )
  }

  return (
    <div className="tracker-cal-panel">
      <div className="tracker-cal-header">
        <span className="tracker-cal-title">Daily Log Coverage</span>
        <div className="tracker-cal-nav">
          <button
            type="button"
            className="icon-btn sm"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <Icon name="chevron-left" />
          </button>
          <span className="tracker-cal-month">
            {MONTH_NAMES[view.month]} {view.year}
          </span>
          <button
            type="button"
            className="icon-btn sm"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>
      <div className="tracker-cal-weekdays">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="tracker-cal-grid">{cells}</div>
      <div className="tracker-legend-row tracker-cal-legend">
        <span className="tracker-legend-item">
          <span className="tracker-legend-dot tracker-cal-full" />
          All 3 core metrics
        </span>
        <span className="tracker-legend-item">
          <span className="tracker-legend-dot tracker-cal-calorieonly" />
          Calories only
        </span>
        <span className="tracker-legend-item">
          <span className="tracker-legend-dot tracker-cal-partial" />
          Partial (2 of 3)
        </span>
        <span className="tracker-legend-item">
          <span className="tracker-legend-dot tracker-cal-nodata" />
          No entry
        </span>
      </div>
      <p className="tracker-cal-hint">
        Color reflects Calories Burned + Steps + Calories Eaten only. Click any
        day to see its full breakdown.
      </p>
    </div>
  )
}

// ===================== Daily log detail =====================

// Weight is a distance-to-goal metric, not a "more is better" one — the bar
// should read as full once the client is at (or essentially at) their
// target weight, then taper off the further away they are, in either
// direction. Full credit within 1kg of goal, none left by 10kg away.
function weightProgressPct(current: number, goal: number): number {
  const distance = Math.abs(current - goal)
  if (distance <= 1) return 100
  if (distance >= 10) return 0
  return Math.round(100 - ((distance - 1) / 9) * 100)
}

/** Each row now carries its whole story: what was logged, what it was measured
 *  against, and the gap between them — "2.0 of 2.9 L (0.9 L remaining)". That
 *  replaces the tile grid that used to repeat the same numbers underneath. */
function LogRow({
  label,
  value,
  target,
  delta,
  tone,
  pct,
  color,
  logged,
  note,
}: {
  label: string
  value: string
  /** Rendered as "of {target}" — the yardstick, shown whether or not it's met. */
  target?: string
  /** Rendered as "({delta})" — how far off the target this is. */
  delta?: string
  /** Colours the delta only; the value itself stays neutral so the row scans. */
  tone?: string
  pct: number
  color: string
  // Whether the day actually has a value — kept separate from `pct` because a
  // logged metric can legitimately compute to 0% (e.g. a weight far from
  // goal) and must still read as logged rather than greyed out.
  logged: boolean
  // Qualifier for values that are real but not logged *on this day* (the
  // carried-forward weight), so the row doesn't contradict the summary's
  // "not logged" chip below it.
  note?: string
}) {
  return (
    <div className="tracker-log-row">
      <div className="tracker-log-top">
        <span className="tracker-log-label">
          {label}
          {note ? <span className="tracker-log-note">{note}</span> : null}
        </span>
        <span className={`tracker-log-value${logged ? '' : ' missing'}`}>
          {value}
          {target ? (
            <span className="tracker-log-target"> of {target}</span>
          ) : null}
          {delta ? (
            <span className={`tracker-log-delta ${tone ?? ''}`}>({delta})</span>
          ) : null}
        </span>
      </div>
      <div className="tracker-log-bar-track">
        <div
          className="tracker-log-bar-fill"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: logged ? color : '#c7ccc8',
          }}
        />
      </div>
    </div>
  )
}

/** Works out the "of X (Y remaining)" half of a row against a numeric target.
 *  Carries over the rounding care from the tiles this replaced: the comparison
 *  is rounded to the displayed precision first, so a value that reads as
 *  exactly the target never reports "0.0 L remaining" off a hidden decimal. */
function targetStat({
  value,
  target,
  unit,
  decimals = 0,
  lowerIsBetter = false,
  pendingWord,
  overWord,
}: {
  value: number | null | undefined
  target: number
  unit?: string
  decimals?: number
  lowerIsBetter?: boolean
  pendingWord: string
  overWord: string
}): { target: string; delta?: string; tone?: string; pct: number } {
  const suffix = unit ? ` ${unit}` : ''
  const targetText = `${fmt(target, decimals)}${suffix}`
  if (value == null) return { target: targetText, pct: 0 }

  const step = decimals ? 10 ** -decimals : 1
  const remaining = Math.max(0, Math.round((target - value) / step) * step)
  const over = Math.max(0, Math.round((value - target) / step) * step)
  const pct = target > 0 ? (value / target) * 100 : 0

  let tone: string
  if (lowerIsBetter) tone = over > 0 ? 'tone-bad' : 'tone-good'
  else if (remaining === 0) tone = 'tone-good'
  else if (pct >= 70) tone = 'tone-warn'
  else tone = 'tone-bad'

  const delta =
    over > 0
      ? `${fmt(over, decimals)}${suffix} ${overWord}`
      : remaining > 0
        ? `${fmt(remaining, decimals)}${suffix} ${pendingWord}`
        : 'target met'

  return { target: targetText, delta, tone, pct }
}

function fmt(n: number, decimals: number): string {
  return decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString()
}

/** Rows counted in whole sessions rather than measured — meals against the
 *  day's slots, workouts against what was scheduled. */
function countStat(
  input:
    | false
    | undefined
    | null
    | {
        done: number
        planned: number
        unit: string
        allDone: string
        none?: string
      },
): { target?: string; delta?: string; tone?: string; pct: number } {
  if (!input) return { pct: 0 }
  const { done, planned, unit, allDone, none } = input
  if (planned === 0) {
    return { delta: none ?? 'nothing planned', tone: 'tone-good', pct: 0 }
  }
  const missed = Math.max(0, planned - done)
  return {
    target: `${planned} ${unit}`,
    delta: missed === 0 ? allDone : `${missed} missed`,
    tone: missed === 0 ? 'tone-good' : done > 0 ? 'tone-warn' : 'tone-bad',
    pct: (done / planned) * 100,
  }
}

/** The weight row's gap to goal, in whichever direction the goal sits. Named
 *  for the gap specifically — `weightStat` is already imported from ../tracker
 *  and answers a different question (adherence across the whole program). */
function weightGapStat(
  current: number | null | undefined,
  goal: number,
): { delta?: string; tone?: string } {
  if (current == null) return {}
  const diff = Math.round((current - goal) * 10) / 10
  if (diff === 0) return { delta: 'goal reached', tone: 'tone-good' }
  return {
    delta: `${fmt(Math.abs(diff), 1)} kg to ${diff > 0 ? 'lose' : 'gain'}`,
    tone: 'tone-warn',
  }
}

function DailyLogDetail({
  day,
  targets,
}: {
  day: DailyLog | undefined
  targets: ReturnType<typeof buildProgramTracker>['targets']
}) {
  const FIELDS_ALL = 7

  const FIELDS: Array<{ name: string; logged: boolean }> = day
    ? [
        { name: 'Calories Eaten', logged: day.calEaten != null },
        { name: 'Calories Burned', logged: day.calBurned != null },
        { name: 'Steps', logged: day.steps != null },
        { name: 'Hydration', logged: day.hydrationL != null },
        { name: 'Workout', logged: day.workout },
        { name: 'Cardio', logged: day.cardio },
        { name: 'Weight', logged: day.weightKg != null },
      ]
    : []
  const logged = FIELDS.filter((f) => f.logged).map((f) => f.name)
  const missing = FIELDS.filter((f) => !f.logged).map((f) => f.name)

  // Energy balance: intake minus TDEE. Negative is a deficit — the number
  // that actually drives weight change, and the one thing on this panel you
  // can't read straight off the rows above.
  const balance =
    day && day.calEaten != null && day.calBurned != null
      ? day.calEaten - day.calBurned
      : null

  // The same three metrics the coverage calendar colours a day by.
  const CORE = day
    ? [
        { name: 'Calories Eaten', ok: day.calEaten != null },
        { name: 'Calories Burned', ok: day.calBurned != null },
        { name: 'Steps', ok: day.steps != null },
      ]
    : []
  const coreDone = CORE.filter((c) => c.ok).length

  // Of the metrics that were logged and have a target, how many landed on the
  // right side of it — intake counts as met when at or *under* target, the
  // rest when at or over.
  const targetChecks: boolean[] = []
  if (day?.calEaten != null) targetChecks.push(day.calEaten <= targets.calEaten)
  if (day?.calBurned != null)
    targetChecks.push(day.calBurned >= targets.calBurned)
  if (day?.steps != null) targetChecks.push(day.steps >= targets.steps)
  if (day?.hydrationL != null)
    targetChecks.push(day.hydrationL >= targets.hydrationL)
  const targetsHit = targetChecks.filter(Boolean).length

  const isToday = day ? dateKey(day.date) === dateKey(new Date()) : false

  return (
    <div className="tracker-logdetail-panel">
      <div className="tracker-logdetail-head">
        <div className={`tracker-date-badge${isToday ? ' today' : ''}`}>
          <span className="tracker-date-weekday">
            {day
              ? day.date.toLocaleDateString('en-US', { weekday: 'short' })
              : '—'}
          </span>
          <span className="tracker-date-day">
            {day ? day.date.getDate() : '—'}
          </span>
        </div>
        <div className="tracker-logdetail-headings">
          <h3 className="tracker-logdetail-title">
            {day
              ? day.date.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : 'Daily Log Detail'}
            {isToday ? (
              <span className="tracker-date-today-tag">Today</span>
            ) : null}
          </h3>
          <p className="tracker-logdetail-sub">
            {day
              ? `${logged.length} of ${FIELDS_ALL} metrics logged`
              : 'Select a day to see its breakdown'}
          </p>
        </div>
      </div>
      <div className="tracker-log-list">
        <LogRow
          label="Calories Eaten"
          value={
            day?.calEaten != null
              ? `${day.calEaten.toLocaleString()} kcal`
              : 'Not logged'
          }
          color={METRIC_COLOR.calEaten}
          logged={day?.calEaten != null}
          {...targetStat({
            value: day?.calEaten,
            target: targets.calEaten,
            unit: 'kcal',
            // Eating *under* the intake target is the win, so what's left is an
            // allowance still available rather than a shortfall to chase.
            lowerIsBetter: true,
            pendingWord: 'left to eat',
            overWord: 'over target',
          })}
        />
        <LogRow
          label="Calories Burned"
          value={
            day?.calBurned != null
              ? `${day.calBurned.toLocaleString()} kcal`
              : 'Not logged'
          }
          color={METRIC_COLOR.calBurned}
          logged={day?.calBurned != null}
          {...targetStat({
            value: day?.calBurned,
            target: targets.calBurned,
            unit: 'kcal',
            pendingWord: 'still to burn',
            overWord: 'past target',
          })}
        />
        <LogRow
          label="Steps"
          value={day?.steps != null ? day.steps.toLocaleString() : 'Not logged'}
          color={METRIC_COLOR.steps}
          logged={day?.steps != null}
          {...targetStat({
            value: day?.steps,
            target: targets.steps,
            pendingWord: 'to go',
            overWord: 'past target',
          })}
        />
        <LogRow
          label="Hydration"
          // Shown to 1 decimal to match the target and delta beside it —
          // "2.03 L of 2.9 L" mixed precisions in a single sentence.
          value={
            day?.hydrationL != null
              ? `${fmt(day.hydrationL, 1)} L`
              : 'Not logged'
          }
          color={METRIC_COLOR.hydration}
          logged={day?.hydrationL != null}
          {...targetStat({
            value: day?.hydrationL,
            target: targets.hydrationL,
            unit: 'L',
            decimals: 1,
            pendingWord: 'remaining',
            overWord: 'past target',
          })}
        />
        <LogRow
          label="Meals"
          value={day ? `${day.mealsLogged}` : 'Not logged'}
          {...countStat(
            day && {
              done: day.mealsLogged,
              planned: day.mealsPlanned,
              unit: 'planned',
              allDone: 'all meals logged',
            },
          )}
          color={METRIC_COLOR.calEaten}
          logged={!!day && day.mealsLogged > 0}
        />
        <LogRow
          label="Workouts"
          // The count, not a bare "Done": the day can schedule two sessions and
          // have one of them logged, which "Done" flattened away.
          value={day ? `${day.workoutsLogged}` : 'Not logged'}
          {...countStat(
            day && {
              done: day.workoutsLogged,
              planned: day.workoutsPlanned,
              unit: 'scheduled',
              allDone: 'all sessions done',
              none: 'none scheduled',
            },
          )}
          color={METRIC_COLOR.workout}
          logged={!!day && day.workoutsLogged > 0}
        />
        <LogRow
          label="PW Cardio"
          value={day?.cardio ? 'Done' : 'Not logged'}
          pct={day?.cardio ? 100 : 0}
          color={METRIC_COLOR.cardio}
          logged={!!day?.cardio}
        />
        <LogRow
          label="Weight"
          value={
            day?.weightKgCarried != null
              ? `${day.weightKgCarried} kg`
              : 'Not logged'
          }
          target={`${targets.weightGoalKg} kg goal`}
          // Direction matters: a goal can sit above or below where they are, so
          // this reads the gap rather than assuming weight loss. An earlier cut
          // assumed "under goal = reached" and told a 69.1 kg user with an
          // 83.3 kg goal that they'd reached it.
          {...weightGapStat(day?.weightKgCarried, targets.weightGoalKg)}
          pct={
            day?.weightKgCarried != null
              ? weightProgressPct(day.weightKgCarried, targets.weightGoalKg)
              : 0
          }
          color={METRIC_COLOR.weight}
          logged={day?.weightKgCarried != null}
          note={
            day?.weightKgCarried != null && day.weightKg == null
              ? 'last weigh-in'
              : undefined
          }
        />
      </div>
      {/* The tile grid that used to sit here is gone: every number it held now
          reads inline on its own row, so the day was being stated twice. What
          stays is the part the rows can't say — the day's completeness and net
          energy balance. */}
      <div className="tracker-daysummary">
        {day ? (
          <div className="tracker-summary-footnote">
            <span>
              <strong>{coreDone}</strong> of 3 core metrics ·{' '}
              <strong>{logged.length}</strong> of {FIELDS_ALL} fields logged
              {targetChecks.length ? (
                <>
                  {' '}
                  · <strong>{targetsHit}</strong> of {targetChecks.length}{' '}
                  targets met
                </>
              ) : null}
            </span>
            {balance != null ? (
              <span className={balance <= 0 ? 'tone-good' : 'tone-bad'}>
                Net {balance > 0 ? '+' : ''}
                {balance.toLocaleString()} kcal{' '}
                {balance <= 0 ? 'deficit' : 'surplus'}
              </span>
            ) : null}
          </div>
        ) : null}

        {day && missing.length ? (
          <div className="tracker-summary-missing">
            <span className="tracker-summary-missing-label">Not logged</span>
            {missing.map((m) => (
              <span className="tracker-summary-chip" key={m}>
                {m}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ===================== Root =====================

export function ProgramTrackerDashboard({
  client,
  detail,
  hideSwitcher,
}: {
  client: Client
  detail: ClientDetail
  /** The Plan Workspace and the At-a-glance modal both show the program
   *  label up in their own header instead of above the tracker. */
  hideSwitcher?: boolean
}) {
  const program = detail.programs[0]

  // The same real activity log the Chat panel's "User Activity" tab reads —
  // so any day it already shows a meal, workout, or weigh-in for is used
  // as-is here instead of a second, independently-random guess.
  const activity = useMemo(
    () => CONVERSATIONS.find((c) => c.client.id === client.id)?.activity ?? [],
    [client.id],
  )

  const tracker = useMemo(
    () =>
      buildProgramTracker(
        client,
        detail,
        program,
        clientSeed(client),
        activity,
      ),
    [client, detail, program, activity],
  )
  const lastDay = tracker.days[tracker.days.length - 1]
  const [selectedKey, setSelectedKey] = useState(() =>
    lastDay ? dateKey(lastDay.date) : '',
  )

  // Re-default to the tracker's own most recent day whenever the tracker
  // itself changes (switching client) — otherwise the log detail could stay
  // stuck on a date that belonged to a different client.
  useEffect(() => {
    setSelectedKey(lastDay ? dateKey(lastDay.date) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracker])

  const byKey = useMemo(() => {
    const map = new Map<string, DailyLog>()
    tracker.days.forEach((d) => map.set(dateKey(d.date), d))
    return map
  }, [tracker.days])

  return (
    <>
      {/* Program label first because it scopes everything below it, then the
          whole-program stat row, then the day-by-day log, then the trends. */}
      <div className="panel tracker-overview-panel">
        {hideSwitcher ? null : (
          <div className="tracker-header-row">
            <CurrentProgramLabel
              program={program}
              className="tracker-header-switcher"
            />
          </div>
        )}
        <TrackerStatRow tracker={tracker} fallbackWeightKg={detail.weightKg} />
      </div>

      <div className="panel tracker-log-panel">
        <div className="tracker-log-panel-grid">
          <LogCoverageCalendar
            days={tracker.days}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
          <DailyLogDetail
            day={byKey.get(selectedKey)}
            targets={tracker.targets}
          />
        </div>
      </div>

      <TrendChart
        title="Calories Consumed"
        days={tracker.days}
        field="calEaten"
        target={tracker.targets.calEaten}
        color={METRIC_COLOR.calEaten}
        unit=" kcal"
      />
      <TrendChart
        title="Calories Burnt"
        days={tracker.days}
        field="calBurned"
        target={tracker.targets.calBurned}
        color={METRIC_COLOR.calBurned}
        unit=" kcal"
      />
      <TrendChart
        title="Steps"
        days={tracker.days}
        field="steps"
        target={tracker.targets.steps}
        color={METRIC_COLOR.steps}
        unit=" steps"
      />
      <TrendChart
        title="Water Intake"
        days={tracker.days}
        field="hydrationL"
        target={tracker.targets.hydrationL}
        color={METRIC_COLOR.hydration}
        unit=" L"
      />
      <TrendChart
        title="Meals Logged"
        days={tracker.days}
        field="mealsLogged"
        target={MEALS_PER_DAY}
        color={METRIC_COLOR.calEaten}
        unit=" meals"
      />
      <TrendChart
        title="Workouts Completed"
        days={tracker.days}
        field="workoutsLogged"
        target={SESSIONS_PER_DAY}
        color={METRIC_COLOR.workout}
        unit=" sessions"
      />
    </>
  )
}
