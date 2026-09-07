// Cover for the diet sheet's save model: nothing shows until a category is
// picked, the sheet is written only when the nutritionist confirms the save
// (autosave was removed) — never on load, nor when switching week or category —
// and Save opens a modal to choose which weeks it writes to (the same
// single-Save model as the workout tab), defaulting to the current week.
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { resetDietPlanStore } from '../dietPlan.mock'
import { DietPlanTab } from './DietPlanTab'

// The editor is code-split and mounts its view in an effect, so waiting for it
// needs more than findBy's 1s default. It's queried by its aria-label rather
// than by role: a contenteditable div has no implicit `textbox` role.
const EDITOR = { timeout: 5000 }

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))

// Every write to the master sheet, recorded by one listener attached for the
// whole file. (Detaching per test with removeAllListeners() would also strip
// MSW's own internal listeners and silently break the mock server.)
const writes: string[] = []
server.events.on('request:start', ({ request }) => {
  if (request.method === 'PUT' && request.url.includes('/program/diet-plan')) {
    writes.push(request.url)
  }
})

function Harness() {
  const [week, setWeek] = useState(1)
  return (
    <DietPlanTab totalWeeks={6} activeWeek={week} setActiveWeek={setWeek} />
  )
}

describe('DietPlanTab saving', () => {
  beforeEach(() => {
    resetDietPlanStore()
    writes.length = 0
  })

  it('shows nothing until a category is picked', async () => {
    renderWithProviders(<Harness />)
    expect(await screen.findByText(/Pick a category above/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Week 1' })).toBeNull()
  })

  it('opens the editor once a category is picked', async () => {
    const { user } = renderWithProviders(<Harness />)
    await screen.findByText(/Pick a category above/)

    await user.selectOptions(screen.getByLabelText('Category'), '1600')
    expect(
      await screen.findByLabelText(
        /Week 1 diet plan, 1600 kcal/,
        undefined,
        EDITOR,
      ),
    ).toBeInTheDocument()
  })

  it('does not write anything on load', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Category'), '1600')
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    // Comfortably past the autosave debounce.
    await new Promise((r) => setTimeout(r, 1400))
    expect(writes).toHaveLength(0)
  })

  it('does not write when the calorie band changes', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Category'), '1600')
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    writes.length = 0

    await user.selectOptions(screen.getByLabelText('Category'), '1200')
    await screen.findByLabelText(/1200 kcal/, undefined, EDITOR)
    await new Promise((r) => setTimeout(r, 1400))
    expect(writes).toHaveLength(0)
  })

  it('does not write when the week changes', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Category'), '1600')
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    writes.length = 0

    await user.click(screen.getByRole('button', { name: 'Week 4' }))
    await screen.findByLabelText(/Week 4 diet plan/, undefined, EDITOR)
    await new Promise((r) => setTimeout(r, 1400))
    expect(writes).toHaveLength(0)
  })

  it('opens the Save modal and writes only after confirming, to this week by default', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Category'), '1600')
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    writes.length = 0

    // Opening the picker writes nothing; only confirming does.
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(writes).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /Save to 1 week/ }))
    await waitFor(() => expect(writes.length).toBeGreaterThan(0))
  })

  it('writes to every week once "All weeks" is picked in the modal', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Category'), '1600')
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    writes.length = 0

    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(screen.getByRole('button', { name: 'All weeks' }))
    await user.click(screen.getByRole('button', { name: /Save to 6 weeks/ }))
    await waitFor(() => expect(writes.length).toBeGreaterThan(0))
  })
})
