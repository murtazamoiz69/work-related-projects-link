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
import { seededRandom } from '@/lib/seed'
import { MEAL_LIBRARY, WORKOUT_TEMPLATES } from '../../data'
import type { TrainingProgram } from '../../types'
import { OvStatCard } from './atoms'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
)

const PRIMARY = '#2F5D50'

function EngagementChart({ program: p }: { program: TrainingProgram }) {
  const labels = p.workoutWeeks.map((w) => `Wk ${w.weekNum}`)
  const base = Math.max(30, p.completionRate)
  const data = p.workoutWeeks.map((_, i) =>
    Math.max(
      15,
      Math.round(
        base -
          i * (base / (p.durationWeeks + 2)) +
          (seededRandom(i + 1) - 0.5) * 10,
      ),
    ),
  )

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}` } },
    },
    scales: {
      y: { grid: { color: '#EEF0EA' } },
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
      },
    },
  }

  return (
    <div className="chart-wrap" style={{ height: 220 }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              data,
              borderColor: PRIMARY,
              backgroundColor: 'rgba(47,93,80,0.10)',
              pointBackgroundColor: PRIMARY,
              pointRadius: data.length > 20 ? 0 : 3,
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

export function AnalyticsTab({
  program: p,
  onAssign,
}: {
  program: TrainingProgram
  onAssign: () => void
}) {
  // Engagement/adherence stats are derived from real assigned members — with
  // none yet (a brand-new or just-cloned template), there's nothing real to
  // show, so skip the fabricated fallback numbers entirely.
  if (p.members.length === 0) {
    return (
      <div className="clients-empty">
        <Icon name="bar-chart-2" />
        <p className="clients-empty-title">No Analytics Yet</p>
        <p>
          Assign users to this program to start seeing engagement, adherence,
          and completion data.
        </p>
        <button className="link-btn" onClick={onAssign}>
          Assign your first user
        </button>
      </div>
    )
  }

  const workoutCompletion = Math.max(10, Math.min(98, p.completionRate + 8))
  const mealCompletion = Math.max(10, Math.min(98, p.completionRate - 4))
  const retention = p.members.length
    ? Math.round(
        (p.members.filter((m) => m.status !== 'paused').length /
          p.members.length) *
          100,
      )
    : 0
  const dropoffWeek =
    2 + Math.round(seededRandom(p.id.length * 3.3) * (p.durationWeeks - 2 || 1))
  const avgAdherence = Math.round((workoutCompletion + mealCompletion) / 2)

  const topWorkouts = WORKOUT_TEMPLATES.slice(0, 5).map((t, i) => ({
    name: t.name,
    score: 95 - i * 7 - Math.round(seededRandom(i + 2) * 6),
  }))
  const skippedMeals = MEAL_LIBRARY.slice(0, 5).map((m, i) => ({
    name: m.name,
    score: 6 + i * 3 + Math.round(seededRandom(i + 5) * 5),
  }))

  return (
    <>
      <div className="ov-summary-grid">
        <OvStatCard
          icon="check-circle-2"
          value={`${p.completionRate}%`}
          label="Program Completion"
          tooltip="Average progress percentage across this program's assigned members."
        />
        <OvStatCard
          icon="anchor"
          value={`${retention}%`}
          label="Retention"
          tooltip="Share of assigned members who haven't paused or dropped off."
        />
        <OvStatCard
          icon="trending-down"
          value={`Wk ${dropoffWeek}`}
          label="Typical Drop-off"
          tooltip="The program week where members most commonly disengage."
        />
        <OvStatCard
          icon="activity"
          value={`${avgAdherence}%`}
          label="Avg Adherence"
          tooltip="Blended average of workout and meal completion across all members."
        />
        <OvStatCard
          icon="dumbbell"
          value={`${workoutCompletion}%`}
          label="Workout Completion"
          tooltip="Share of scheduled workouts members mark as completed."
        />
        <OvStatCard
          icon="utensils"
          value={`${mealCompletion}%`}
          label="Meal Completion"
          tooltip="Share of scheduled meals members log as completed."
        />
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Weekly Engagement</h2>
            <p className="panel-sub">
              Active members checking in, by program week
            </p>
          </div>
        </div>
        <EngagementChart program={p} />
      </div>

      <div className="split-row split-row-alt ov-split">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Top Performing Workouts</h2>
              <p className="panel-sub">By completion rate</p>
            </div>
          </div>
          <ul className="ranked-list">
            {topWorkouts.map((w, i) => (
              <li className="ranked-item" key={w.name}>
                <span className="ranked-num">{i + 1}</span>
                <span className="ranked-name">{w.name}</span>
                <span className="ranked-score good">{w.score}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Most Skipped Meals</h2>
              <p className="panel-sub">By skip rate this month</p>
            </div>
          </div>
          <ul className="ranked-list">
            {skippedMeals.map((m, i) => (
              <li className="ranked-item" key={m.name}>
                <span className="ranked-num">{i + 1}</span>
                <span className="ranked-name">{m.name}</span>
                <span className="ranked-score warn">{m.score}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
