// Cover for the per-user category display: it's read-only here (the band is
// set at onboarding and changed elsewhere, not from this tab), so there's no
// tab list, no click target, and no confirm dialog — just the fixed chip.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/renderWithProviders'
import { CLIENTS_DATA } from '@/features/clients'
import { resetClientStore } from '@/features/clients/api/clients.mock'
import { resetDietPlanStore } from '../dietPlan.mock'
import { ClientDietPlanTab } from './ClientDietPlanTab'

// The editor is code-split and mounts its view in an effect, so waiting for it
// needs more than findBy's 1s default.
const EDITOR = { timeout: 5000 }

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))

// Meera (c-14) is seeded at 1400 kcal — see dietPlan.api.test.ts.
function meera() {
  const c = CLIENTS_DATA.find((x) => x.id === 'c-14')
  if (!c) throw new Error('fixture c-14 missing')
  return c
}

function renderTab() {
  return renderWithProviders(
    <ClientDietPlanTab
      client={meera()}
      totalWeeks={6}
      activeWeek={1}
      setActiveWeek={() => {}}
    />,
  )
}

describe('ClientDietPlanTab — category is read-only', () => {
  beforeEach(() => {
    resetDietPlanStore()
    resetClientStore()
  })

  it('shows the user’s one band as plain text, not a control', async () => {
    renderTab()
    await screen.findByLabelText(/Week 1 diet plan for/, undefined, EDITOR)

    expect(screen.getByText('1400').closest('span')).toHaveClass(
      'diet-band-fixed',
    )
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.queryByRole('button', { name: /1800/ })).toBeNull()
  })
})
