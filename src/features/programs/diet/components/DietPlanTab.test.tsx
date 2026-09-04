// Regression cover for the diet sheet's autosave.
//
// The editor re-serialises whatever it loads, so a stored sheet never comes
// back byte-for-byte identical. Twice during development that made "has the
// document changed?" answer yes on load — which autosaved, overwrote a master
// sheet with an empty document, and flagged untouched user plans as
// hand-edited. These tests pin the property that broke: nothing is written
// unless a person actually types.
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
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

describe('DietPlanTab autosave', () => {
  beforeEach(() => {
    resetDietPlanStore()
    writes.length = 0
  })

  it('loads the sheet for the selected week and band', async () => {
    renderWithProviders(<Harness />)
    expect(
      await screen.findByLabelText(
        /Week 1 diet plan, 1600 kcal/,
        undefined,
        EDITOR,
      ),
    ).toBeInTheDocument()
  })

  it('does not write anything on load', async () => {
    renderWithProviders(<Harness />)
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    // Comfortably past the autosave debounce.
    await new Promise((r) => setTimeout(r, 1400))
    expect(writes).toHaveLength(0)
  })

  it('does not write when the calorie band changes', async () => {
    const { user } = renderWithProviders(<Harness />)
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    writes.length = 0

    await user.click(screen.getByRole('tab', { name: /1200/ }))
    await screen.findByLabelText(/1200 kcal/, undefined, EDITOR)
    await new Promise((r) => setTimeout(r, 1400))
    expect(writes).toHaveLength(0)
  })

  it('does not write when the week changes', async () => {
    const { user } = renderWithProviders(<Harness />)
    await screen.findByLabelText(/Week 1 diet plan/, undefined, EDITOR)
    writes.length = 0

    await user.click(screen.getByRole('button', { name: 'Week 4' }))
    await screen.findByLabelText(/Week 4 diet plan/, undefined, EDITOR)
    await new Promise((r) => setTimeout(r, 1400))
    expect(writes).toHaveLength(0)
  })

  // The positive path — a real edit does reach the server — is covered in
  // dietPlan.api.test.ts ("saves an edit and reads it back") and verified in a
  // browser. It isn't asserted here because ProseMirror ignores jsdom's
  // synthetic key events, so `user.keyboard` into the editor is a no-op and the
  // test would pass or fail for reasons unrelated to the component.
})
