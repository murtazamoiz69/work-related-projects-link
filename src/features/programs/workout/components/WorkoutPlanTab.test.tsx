// Regression cover for the workout plan's autosave, and for the day rows
// themselves.
//
// The autosave here has the same trap the diet sheet had: the editor
// re-serialises whatever it loads, so a stored session never comes back
// byte-for-byte identical, and a naive dirty flag would autosave on open —
// writing an empty day over a real one when the week changes. These tests pin
// the property that matters: nothing is written unless a person edits.
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { resetWorkoutPlanStore } from '../workoutPlan.mock'
import { WorkoutPlanTab } from './WorkoutPlanTab'

// The editor is code-split and mounts its view in an effect, so waiting for it
// needs more than findBy's 1s default. It's queried by its aria-label rather
// than by role: a contenteditable div has no implicit `textbox` role.
const EDITOR = { timeout: 5000 }

// The week itself only needs a fetch, but findBy's 1s default is tight enough
// that a full parallel suite run can outlast it. Everything that waits on the
// day list gets the same headroom, so these fail for real reasons only.
const LOAD = { timeout: 5000 }

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))

// Every write to the plan, recorded by one listener attached for the whole file.
// (Detaching per test with removeAllListeners() would also strip MSW's own
// internal listeners and silently break the mock server.)
const writes: string[] = []
server.events.on('request:start', ({ request }) => {
  if (request.method !== 'GET' && request.url.includes('/workout-plan')) {
    writes.push(`${request.method} ${request.url}`)
  }
})

function Harness() {
  const [week, setWeek] = useState(1)
  return (
    <WorkoutPlanTab totalWeeks={6} activeWeek={week} setActiveWeek={setWeek} />
  )
}

describe('WorkoutPlanTab', () => {
  beforeEach(() => {
    resetWorkoutPlanStore()
    writes.length = 0
  })

  it('lists the seven days of the week with their names and types', async () => {
    renderWithProviders(<Harness />)
    expect(
      await screen.findByText('Push Day', undefined, LOAD),
    ).toBeInTheDocument()
    for (const day of [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
    // Three lifting days, two cardio, two rest.
    expect(screen.getAllByText('Workout')).toHaveLength(3)
    expect(screen.getAllByText('Cardio')).toHaveLength(2)
    expect(screen.getAllByText('Rest')).toHaveLength(2)
  })

  it('opens a day into its editor, with the session inside', async () => {
    const { user } = renderWithProviders(<Harness />)
    const monday = await screen.findByRole('button', { name: /Monday/ }, LOAD)
    expect(monday).toHaveAttribute('aria-expanded', 'false')

    await user.click(monday)
    expect(monday).toHaveAttribute('aria-expanded', 'true')

    const editor = await screen.findByLabelText(
      /Monday session, week 1/,
      undefined,
      EDITOR,
    )
    expect(within(editor).getByText('Barbell Bench Press')).toBeInTheDocument()
    // The demo video rides along as a real link.
    expect(
      within(editor).getAllByRole('link', { name: 'Watch demo' }).length,
    ).toBeGreaterThan(0)
  })

  it('does not write anything on load, or on opening a day', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.click(
      await screen.findByRole('button', { name: /Monday/ }, LOAD),
    )
    await screen.findByLabelText(/Monday session/, undefined, EDITOR)
    // Comfortably past the autosave debounce.
    await new Promise((r) => setTimeout(r, 1400))
    expect(writes).toHaveLength(0)
  })

  it('does not write when the week changes under an open day', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.click(
      await screen.findByRole('button', { name: /Monday/ }, LOAD),
    )
    await screen.findByLabelText(/Monday session, week 1/, undefined, EDITOR)
    writes.length = 0

    await user.click(screen.getByRole('button', { name: 'Week 4' }))
    await screen.findByText(/No sessions for this week yet/)
    await new Promise((r) => setTimeout(r, 1400))
    expect(writes).toHaveLength(0)
  })

  it('renames a day and saves it', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.click(
      await screen.findByRole('button', { name: /Monday/ }, LOAD),
    )
    await screen.findByLabelText(/Monday session/, undefined, EDITOR)
    writes.length = 0

    const name = screen.getByDisplayValue('Push Day')
    await user.clear(name)
    await user.type(name, 'Upper Body')

    // The summary reflects it straight away; the PUT follows the debounce.
    await screen.findByText('Upper Body', undefined, { timeout: 5000 })
    await waitFor(
      () =>
        expect(writes.filter((w) => w.startsWith('PUT'))).not.toHaveLength(0),
      { timeout: 5000 },
    )
  })

  it('swaps two days from the picker', async () => {
    const { user } = renderWithProviders(<Harness />)
    await screen.findByText('Push Day', undefined, LOAD)

    // Every day carries its own picker, so the option has to be found inside
    // Monday's rather than anywhere on the page.
    const picker = screen.getByLabelText('Swap Monday with another day')
    await user.selectOptions(
      picker,
      within(picker).getByRole('option', { name: 'Friday — Leg Day' }),
    )

    // Monday now carries Friday's session, and Friday carries Monday's.
    expect(
      await screen.findByRole('button', { name: /Monday.*Leg Day/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Friday.*Push Day/ }),
    ).toBeInTheDocument()
  })

  // Typing into the editor body is not asserted here: ProseMirror ignores
  // jsdom's synthetic key events, so `user.keyboard` into it is a no-op and the
  // test would pass or fail for reasons unrelated to this component. The write
  // path is covered at the API level in workoutPlan.api.test.ts and was
  // verified in a browser.
})
