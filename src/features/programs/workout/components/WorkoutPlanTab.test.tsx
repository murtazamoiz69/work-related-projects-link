// Cover for the workout plan's day-based tab: a flat run of Day N tabs, one
// rich-text session per day, "Add day" to extend the run, and a single Save
// that writes the day to the days chosen. Nothing is written on load or when
// switching days — only Add day and a confirmed Save reach the server.
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
const LOAD = { timeout: 5000 }

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))

// Every write to the plan, recorded by one listener attached for the whole file.
const writes: string[] = []
server.events.on('request:start', ({ request }) => {
  if (request.method !== 'GET' && request.url.includes('/workout-plan')) {
    writes.push(`${request.method} ${request.url}`)
  }
})

describe('WorkoutPlanTab', () => {
  beforeEach(() => {
    resetWorkoutPlanStore()
    writes.length = 0
  })

  it('shows Day 1–7 and opens Day 1 with its session', async () => {
    renderWithProviders(<WorkoutPlanTab />)
    expect(
      await screen.findByRole('button', { name: 'Day 1' }, LOAD),
    ).toBeInTheDocument()
    for (const n of [2, 3, 4, 5, 6, 7]) {
      expect(
        screen.getByRole('button', { name: `Day ${n}` }),
      ).toBeInTheDocument()
    }
    const editor = await screen.findByLabelText(
      /Day 1 workout/,
      undefined,
      EDITOR,
    )
    expect(within(editor).getByText('Barbell Bench Press')).toBeInTheDocument()
    expect(within(editor).queryByRole('link')).not.toBeInTheDocument()
  })

  it('does not write on load or when switching days', async () => {
    const { user } = renderWithProviders(<WorkoutPlanTab />)
    await screen.findByLabelText(/Day 1 workout/, undefined, EDITOR)
    writes.length = 0

    await user.click(screen.getByRole('button', { name: 'Day 3' }))
    await screen.findByLabelText(/Day 3 workout/, undefined, EDITOR)
    await new Promise((r) => setTimeout(r, 400))
    expect(writes).toHaveLength(0)
  })

  it('adds a day with Add day', async () => {
    const { user } = renderWithProviders(<WorkoutPlanTab />)
    await screen.findByRole('button', { name: 'Day 1' }, LOAD)

    await user.click(screen.getByRole('button', { name: /Add day/ }))
    expect(
      await screen.findByRole('button', { name: 'Day 8' }),
    ).toBeInTheDocument()
    expect(writes.some((w) => w.includes('/add-day'))).toBe(true)
  })

  it('writes only when Save is confirmed', async () => {
    const { user } = renderWithProviders(<WorkoutPlanTab />)
    await screen.findByLabelText(/Day 1 workout/, undefined, EDITOR)
    writes.length = 0

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(writes).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /Save to 1 day/ }))
    await waitFor(
      () => expect(writes.some((w) => w.startsWith('PUT'))).toBe(true),
      { timeout: 5000 },
    )
  })
})
