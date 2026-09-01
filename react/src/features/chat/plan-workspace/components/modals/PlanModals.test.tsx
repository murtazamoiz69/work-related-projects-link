// Behavior tests for the two Plan Workspace modals with distinct (non-picker)
// logic: EditPlanModal (program settings, routed through a confirm step, with
// extend/shrink timeline branches) and PublishReportModal (safety-gated
// publish + auto-fix). Prop-driven, run against a real Workspace.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/renderWithProviders'
import { CLIENTS_DATA } from '@/features/clients'
import { deriveClinicalProfile } from '../../clinical'
import { getWorkspace } from '../../plan'
import type { PwConfirm } from '../../context'
import type { ClinicalProfile, Workspace } from '../../types'
import { EditPlanModal } from './EditPlanModal'
import { PublishReportModal } from './PublishReportModal'

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))
import { showToast } from '@/lib/toast'

const client = () => CLIENTS_DATA[0]
const makeWorkspace = (): Workspace =>
  getWorkspace(client(), deriveClinicalProfile(client()))

// A profile whose program starts today, so applySave's recomputed currentWeek
// is 1 and a shrink isn't clamped by tenure.
function freshProfile(): ClinicalProfile {
  return {
    ...deriveClinicalProfile(client()),
    programStart: new Date(),
    currentWeek: 1,
  }
}

let ws: Workspace
beforeEach(() => {
  ws = makeWorkspace()
  vi.clearAllMocks()
})

describe('EditPlanModal', () => {
  const render = () => {
    const refresh = vi.fn()
    const onClose = vi.fn()
    let captured: PwConfirm | null = null
    const confirm = vi.fn((c: PwConfirm) => {
      captured = c
    })
    const utils = renderWithProviders(
      <EditPlanModal
        ws={ws}
        profile={freshProfile()}
        refresh={refresh}
        confirm={confirm}
        onClose={onClose}
      />,
    )
    return { refresh, onClose, confirm, getCaptured: () => captured, ...utils }
  }

  it('opens prefilled with the plan name and timeline', () => {
    render()
    expect(screen.getByLabelText('Program name')).toHaveValue(ws.planName)
    expect(screen.getByLabelText('Timeline (weeks)')).toHaveValue(
      ws.workoutWeeks.length,
    )
    // End date is derived and read-only.
    expect(screen.getByLabelText('End date')).toBeDisabled()
  })

  it('routes Save through a confirm, then renames the plan', async () => {
    const { refresh, onClose, confirm, getCaptured, user } = render()
    const nameField = screen.getByLabelText('Program name')
    await user.clear(nameField)
    await user.type(nameField, 'Recovery Reboot')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    // Save asks for confirmation rather than applying immediately.
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(refresh).not.toHaveBeenCalled()

    getCaptured()?.onConfirm()
    expect(ws.planName).toBe('Recovery Reboot')
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('extends the timeline (adds weeks)', async () => {
    const { getCaptured, user } = render()
    const before = ws.workoutWeeks.length
    const target = Math.min(16, before + 2)
    const weeks = screen.getByLabelText('Timeline (weeks)')
    await user.clear(weeks)
    await user.type(weeks, String(target))
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    getCaptured()?.onConfirm()
    expect(ws.workoutWeeks.length).toBe(target)
  })

  it('shrinking the timeline is a danger confirm and drops weeks', async () => {
    const { getCaptured, user } = render()
    const before = ws.workoutWeeks.length
    expect(before).toBeGreaterThan(4)
    const weeks = screen.getByLabelText('Timeline (weeks)')
    await user.clear(weeks)
    await user.type(weeks, '4')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    const c = getCaptured()
    expect(c?.danger).toBe(true)
    c?.onConfirm()
    expect(ws.workoutWeeks.length).toBe(4)
    expect(ws.dietWeeks.length).toBe(4)
  })
})

describe('PublishReportModal', () => {
  it('publishes a clear plan (sets published, toasts, closes)', () => {
    const refresh = vi.fn()
    const onClose = vi.fn()
    // Validate against the same profile the plan was built safe for.
    renderWithProviders(
      <PublishReportModal
        ws={ws}
        profile={deriveClinicalProfile(client())}
        refresh={refresh}
        onClose={onClose}
      />,
    )
    const publish = screen.getByRole('button', { name: /publish to user/i })
    expect(publish).toBeEnabled()
    publish.click()

    expect(ws.published).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledWith(
      expect.stringMatching(/published to/i),
    )
  })

  it('blocks publishing when the plan hard-conflicts with the profile', async () => {
    const refresh = vi.fn()
    // A hostile profile the safe-built plan violates → hard warnings.
    const hostile: ClinicalProfile = {
      ...deriveClinicalProfile(client()),
      isVegan: true,
      isVegetarian: true,
      allergies: ['Dairy', 'Gluten', 'Eggs', 'Soy', 'Peanuts', 'Shellfish'],
    }
    const { user } = renderWithProviders(
      <PublishReportModal
        ws={ws}
        profile={hostile}
        refresh={refresh}
        onClose={vi.fn()}
      />,
    )
    // Publish is disabled; an auto-fix affordance is offered instead.
    expect(
      screen.getByRole('button', { name: /resolve blockers first/i }),
    ).toBeDisabled()
    await user.click(
      screen.getByRole('button', { name: /auto-fix all blocking issues/i }),
    )
    expect(refresh).toHaveBeenCalled()
  })
})
