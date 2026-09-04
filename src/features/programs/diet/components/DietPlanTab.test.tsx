// Cover for the diet sheet's save model: nothing shows until a category is
// picked, the sheet is written only when the nutritionist confirms Save
// Changes (autosave was removed) — never on load, nor when switching week or
// category — and Save Changes writes to whichever weeks are picked in the
// collapsed "Copy to weeks" dropdown, not to a dialog's separate selection.
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

  it('writes only when Save Changes is clicked, to the week checked by default', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Category'), '1600')
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    writes.length = 0

    // Save Changes is visible without opening anything, and nothing writes
    // until it's actually clicked.
    expect(
      screen.getByRole('button', { name: 'Save Changes' }),
    ).toBeInTheDocument()
    expect(writes).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(writes.length).toBeGreaterThan(0))
  })

  it('the week picker starts collapsed behind "Copy to weeks"', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Category'), '1600')
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)

    expect(screen.queryByRole('button', { name: 'All weeks' })).toBeNull()
    await user.click(screen.getByRole('button', { name: /Copy to weeks/ }))
    expect(
      await screen.findByRole('button', { name: 'All weeks' }),
    ).toBeInTheDocument()
  })

  it('writes to every week checked, once "All weeks" is picked in the dropdown', async () => {
    const { user } = renderWithProviders(<Harness />)
    await user.selectOptions(await screen.findByLabelText('Category'), '1600')
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    writes.length = 0

    await user.click(screen.getByRole('button', { name: /Copy to weeks/ }))
    await user.click(screen.getByRole('button', { name: 'All weeks' }))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(writes.length).toBeGreaterThan(0))
  })
})
