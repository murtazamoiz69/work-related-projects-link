import { beforeEach, describe, expect, it } from 'vitest'
import { isApiError } from '@/lib/api/types'
import { getPlan, savePlan } from './plan.api'
import { resetPlanStore } from './plan.mock'

describe('plan.api', () => {
  beforeEach(() => resetPlanStore())

  it('loads a workspace with Date fields and weeks', async () => {
    const ws = await getPlan('c-1')
    expect(ws.profile.programStart).toBeInstanceOf(Date)
    expect(ws.versions[0].date).toBeInstanceOf(Date)
    expect(ws.workoutWeeks.length).toBeGreaterThan(0)
    expect(ws.dietWeeks.length).toBeGreaterThan(0)
    expect(ws.planName).toBeTruthy()
  })

  it('persists an edit across reloads', async () => {
    const ws = await getPlan('c-1')
    ws.planName = 'Renamed Plan'
    ws.hydrationGoal = 4
    const saved = await savePlan('c-1', ws)
    expect(saved.planName).toBe('Renamed Plan')

    const reloaded = await getPlan('c-1')
    expect(reloaded.planName).toBe('Renamed Plan')
    expect(reloaded.hydrationGoal).toBe(4)
  })

  it('carries notes on the workspace and persists an added note', async () => {
    const ws = await getPlan('c-1')
    expect(Array.isArray(ws.notes)).toBe(true)
    ws.notes = [{ author: 'Sarah Nolan', text: 'Prefers mornings', days: 0 }]
    await savePlan('c-1', ws)

    const reloaded = await getPlan('c-1')
    expect(reloaded.notes[0]?.text).toBe('Prefers mornings')
  })

  it('rejects saving a plan with no name (422)', async () => {
    const ws = await getPlan('c-1')
    await expect(
      savePlan('c-1', { ...ws, planName: '  ' }),
    ).rejects.toMatchObject({ kind: 'validation', status: 422 })
  })

  it('rejects an unknown client (404)', async () => {
    try {
      await getPlan('nope')
      throw new Error('expected rejection')
    } catch (e) {
      expect(isApiError(e)).toBe(true)
      if (isApiError(e)) expect(e.kind).toBe('not-found')
    }
  })
})
