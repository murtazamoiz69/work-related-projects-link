import { beforeEach, describe, expect, it } from 'vitest'
import { isApiError } from '@/lib/api/types'
import {
  addWorkoutDay,
  getClientWorkoutPlan,
  getWorkoutPlan,
  resetClientWorkoutDay,
  saveClientWorkoutDays,
  saveWorkoutDays,
} from './workoutPlan.api'
import { resetWorkoutPlanStore } from './workoutPlan.mock'
import { isBlankDay } from './workoutPlan.types'

describe('workout plan api', () => {
  beforeEach(() => {
    resetWorkoutPlanStore()
  })

  describe('the programme plan', () => {
    it('ships seven days, the first four authored and the rest blank', async () => {
      const plan = await getWorkoutPlan()
      expect(plan.days).toHaveLength(7)
      expect(plan.days.map((d) => d.dayNum)).toEqual([1, 2, 3, 4, 5, 6, 7])
      for (const day of plan.days.slice(0, 4)) {
        expect(isBlankDay(day)).toBe(false)
      }
      for (const day of plan.days.slice(4)) {
        expect(isBlankDay(day)).toBe(true)
      }
    })

    it('never ships a video link — exercises are plain text', async () => {
      const plan = await getWorkoutPlan()
      expect(plan.days[0].body).toContain('Barbell Bench Press')
      expect(plan.days[0].body).not.toContain('http')
      expect(plan.days[0].body).not.toContain('Watch demo')
    })

    it('covers all three day types in the seeded run', async () => {
      const plan = await getWorkoutPlan()
      const types = new Set(plan.days.map((d) => d.type))
      expect(types).toContain('workout')
      expect(types).toContain('cardio')
      expect(types).toContain('rest')
    })

    it('appends a blank day with Add day', async () => {
      const plan = await addWorkoutDay()
      expect(plan.days).toHaveLength(8)
      const day8 = plan.days[7]
      expect(day8.dayNum).toBe(8)
      expect(isBlankDay(day8)).toBe(true)
    })

    it('saves the edited day to the days chosen', async () => {
      const plan = await saveWorkoutDays({
        type: 'cardio',
        body: '<h2>Recovery ride</h2><p>40 min easy</p>',
        days: [2, 4, 6],
      })
      for (const dayNum of [2, 4, 6]) {
        const day = plan.days.find((d) => d.dayNum === dayNum)
        expect(day?.type).toBe('cardio')
        expect(day?.body).toContain('Recovery ride')
      }
      // Untargeted days are untouched.
      expect(plan.days.find((d) => d.dayNum === 1)?.body).not.toContain(
        'Recovery ride',
      )
    })

    it('rejects an unknown day type', async () => {
      try {
        await saveWorkoutDays({
          // @ts-expect-error — deliberately invalid to prove the contract.
          type: 'yoga',
          body: '<p>x</p>',
          days: [1],
        })
        throw new Error('expected rejection')
      } catch (e) {
        expect(isApiError(e)).toBe(true)
        if (isApiError(e)) expect(e.kind).toBe('validation')
      }
    })

    it('rejects a save with no days chosen', async () => {
      try {
        await saveWorkoutDays({ type: 'workout', body: '<p>x</p>', days: [] })
        throw new Error('expected rejection')
      } catch (e) {
        expect(isApiError(e)).toBe(true)
        if (isApiError(e)) expect(e.kind).toBe('validation')
      }
    })
  })

  describe('per-user copies', () => {
    it("reads through to the programme's day until someone edits it", async () => {
      const master = await getWorkoutPlan()
      const mine = await getClientWorkoutPlan('c-1')
      expect(mine.days.map((d) => d.dayNum)).toEqual(
        master.days.map((d) => d.dayNum),
      )
      expect(mine.days.every((d) => !d.edited)).toBe(true)
      expect(mine.days[0].body).toBe(master.days[0].body)
    })

    it("keeps a nutritionist's edit for that user and day only", async () => {
      const updated = await saveClientWorkoutDays('c-1', {
        type: 'workout',
        body: '<h2>Priya push day</h2>',
        days: [1],
      })
      const edited = updated.days.find((d) => d.dayNum === 1)
      expect(edited?.edited).toBe(true)
      expect(edited?.body).toContain('Priya push day')

      // Another user is unaffected; the programme is unaffected.
      const other = await getClientWorkoutPlan('c-2')
      expect(other.days[0].edited).toBe(false)
      const master = await getWorkoutPlan()
      expect(master.days[0].body).not.toContain('Priya push day')
    })

    it('resets one day back to the programme', async () => {
      await saveClientWorkoutDays('c-1', {
        type: 'rest',
        body: '<p>custom</p>',
        days: [2],
      })
      const reset = await resetClientWorkoutDay('c-1', 2)
      const day2 = reset.days.find((d) => d.dayNum === 2)
      expect(day2?.edited).toBe(false)
      expect(day2?.body).not.toContain('custom')
    })
  })
})
