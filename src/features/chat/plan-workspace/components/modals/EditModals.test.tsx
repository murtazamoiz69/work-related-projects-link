// Behavior tests for the Plan Workspace edit modals — the pick-and-commit
// the edit-and-commit (WorkoutEditorModal) pattern that
// drive every in-place plan edit. Both are prop-driven, so they run against a
// real Workspace built from the same server-side logic the mock backend uses.
// `refresh` (autosave) is a spy; the modals mutate the passed `ws` in place.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/renderWithProviders'
import { CLIENTS_DATA } from '@/features/clients'
import { deriveClinicalProfile } from '../../clinical'
import { getWorkspace } from '../../plan'
import type { Workspace } from '../../types'
import { WorkoutEditorModal } from './WorkoutEditorModal'

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
  useToast: () => ({ message: '', visible: false }),
}))

function makeWorkspace(): Workspace {
  const client = CLIENTS_DATA[0]
  return getWorkspace(client, deriveClinicalProfile(client))
}
const profile = () => deriveClinicalProfile(CLIENTS_DATA[0])

// The first day that actually holds a workout.
function firstWorkoutDay(ws: Workspace) {
  for (const w of ws.workoutWeeks) {
    const d = w.days.find((day) => day.workout)
    if (d) return { weekNum: w.weekNum, dayNum: d.dayNum, wk: d.workout }
  }
  throw new Error('no workout day in fixture')
}

let ws: Workspace
beforeEach(() => {
  ws = makeWorkspace()
  vi.clearAllMocks()
})

describe('WorkoutEditorModal', () => {
  const render = () => {
    const { weekNum, dayNum } = firstWorkoutDay(ws)
    const refresh = vi.fn()
    const onClose = vi.fn()
    const utils = renderWithProviders(
      <WorkoutEditorModal
        ws={ws}
        profile={profile()}
        weekNum={weekNum}
        dayNum={dayNum}
        wid={null}
        refresh={refresh}
        onClose={onClose}
      />,
    )
    return { refresh, onClose, weekNum, dayNum, ...utils }
  }

  it('opens prefilled with the workout name', () => {
    const { weekNum, dayNum } = firstWorkoutDay(ws)
    const wk = ws.workoutWeeks
      .find((w) => w.weekNum === weekNum)
      ?.days.find((d) => d.dayNum === dayNum)?.workout
    render()
    expect(screen.getByDisplayValue(wk?.name ?? '')).toBeInTheDocument()
  })

  it('renames the workout and saves (commit -> refresh + close)', async () => {
    const { refresh, onClose, weekNum, dayNum, user } = render()
    const nameField = screen.getByDisplayValue(
      ws.workoutWeeks
        .find((w) => w.weekNum === weekNum)
        ?.days.find((d) => d.dayNum === dayNum)?.workout?.name ?? '',
    )
    await user.clear(nameField)
    await user.type(nameField, 'Renamed Session')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    const saved = ws.workoutWeeks
      .find((w) => w.weekNum === weekNum)
      ?.days.find((d) => d.dayNum === dayNum)?.workout
    expect(saved?.name).toBe('Renamed Session')
  })

  it('removes an exercise before saving', async () => {
    const { weekNum, dayNum, user } = render()
    const wk = ws.workoutWeeks
      .find((w) => w.weekNum === weekNum)
      ?.days.find((d) => d.dayNum === dayNum)?.workout
    const before = wk?.exercises.length ?? 0
    expect(before).toBeGreaterThan(0)

    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    const after = ws.workoutWeeks
      .find((w) => w.weekNum === weekNum)
      ?.days.find((d) => d.dayNum === dayNum)?.workout?.exercises.length
    expect(after).toBe(before - 1)
  })
})
