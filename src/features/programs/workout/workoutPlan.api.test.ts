import { beforeEach, describe, expect, it } from 'vitest'
import {
  duplicateWorkoutWeek,
  getClientWorkoutWeek,
  getWorkoutWeek,
  resetClientWorkoutWeek,
  saveClientWorkoutDay,
  saveWorkoutDay,
  swapClientWorkoutDays,
  swapWorkoutDays,
} from './workoutPlan.api'
import { resetWorkoutPlanStore } from './workoutPlan.mock'
import { isBlankWeek } from './workoutPlan.types'

const dayIn = (
  week: {
    days: { dayNum: number; label: string; type: string; body: string }[]
  },
  dayNum: number,
) => week.days.find((d) => d.dayNum === dayNum)

describe('workout plan api', () => {
  beforeEach(() => {
    resetWorkoutPlanStore()
  })

  describe('the programme week', () => {
    it('serves seven days, Monday first', async () => {
      const week = await getWorkoutWeek(1)
      expect(week.weekNum).toBe(1)
      expect(week.updatedAt).toBeInstanceOf(Date)
      expect(week.days.map((d) => d.dayNum)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it('ships week 1 authored, with a video link beside each exercise', async () => {
      const week = await getWorkoutWeek(1)
      const monday = dayIn(week, 1)
      expect(monday?.label).toBe('Push Day')
      expect(monday?.type).toBe('workout')
      expect(monday?.body).toContain('Barbell Bench Press')
      // The demo video is a real anchor, so it survives the editor's round trip.
      expect(monday?.body).toMatch(
        /<a href="https:\/\/[^"]+"[^>]*>Watch demo<\/a>/,
      )
    })

    it('covers all three day types in week 1', async () => {
      const week = await getWorkoutWeek(1)
      const types = new Set(week.days.map((d) => d.type))
      expect([...types].sort()).toEqual(['cardio', 'rest', 'workout'])
    })

    it('ships only week 1 authored — the rest start blank', async () => {
      expect(isBlankWeek(await getWorkoutWeek(1))).toBe(false)
      for (const w of [2, 3, 4, 5, 6]) {
        expect(isBlankWeek(await getWorkoutWeek(w))).toBe(true)
      }
    })

    it('saves a day and reads it back', async () => {
      const saved = await saveWorkoutDay({
        weekNum: 2,
        dayNum: 3,
        label: 'Upper Body',
        type: 'workout',
        body: '<p>Three sets of everything.</p>',
      })
      expect(dayIn(saved, 3)?.label).toBe('Upper Body')

      const reread = await getWorkoutWeek(2)
      expect(dayIn(reread, 3)?.body).toBe('<p>Three sets of everything.</p>')
      // Only that day, and only that week.
      expect(dayIn(reread, 4)?.label).toBe('')
      expect(dayIn(await getWorkoutWeek(3), 3)?.label).toBe('')
    })

    it('rejects an unknown day type', async () => {
      await expect(
        saveWorkoutDay({
          weekNum: 1,
          dayNum: 1,
          label: 'Push Day',
          type: 'yoga' as 'workout',
          body: '',
        }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })

    it('rejects a day outside the week', async () => {
      await expect(
        saveWorkoutDay({
          weekNum: 1,
          dayNum: 9,
          label: 'Push Day',
          type: 'workout',
          body: '',
        }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })
  })

  describe('swapping days', () => {
    it('trades two days without moving the weekdays themselves', async () => {
      const before = await getWorkoutWeek(1)
      const monday = dayIn(before, 1)
      const tuesday = dayIn(before, 2)

      const after = await swapWorkoutDays({
        weekNum: 1,
        fromDay: 1,
        toDay: 2,
      })
      // Monday is still day 1 — what it holds is Tuesday's session now.
      expect(dayIn(after, 1)?.dayNum).toBe(1)
      expect(dayIn(after, 1)?.label).toBe(tuesday?.label)
      expect(dayIn(after, 1)?.type).toBe(tuesday?.type)
      expect(dayIn(after, 2)?.label).toBe(monday?.label)
      // Everything else is untouched.
      expect(dayIn(after, 3)?.label).toBe(dayIn(before, 3)?.label)
    })

    it('refuses to swap a day with itself', async () => {
      await expect(
        swapWorkoutDays({ weekNum: 1, fromDay: 4, toDay: 4 }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })
  })

  describe('duplicate', () => {
    it('copies all seven days onto the chosen weeks', async () => {
      const source = await getWorkoutWeek(1)
      const result = await duplicateWorkoutWeek({
        fromWeek: 1,
        toWeeks: [3, 5],
      })
      expect(result.weeks).toEqual([3, 5])

      for (const w of [3, 5]) {
        const copy = await getWorkoutWeek(w)
        expect(copy.days.map((d) => d.label)).toEqual(
          source.days.map((d) => d.label),
        )
        expect(dayIn(copy, 1)?.body).toBe(dayIn(source, 1)?.body)
      }
      // Untouched weeks stay blank.
      expect(isBlankWeek(await getWorkoutWeek(4))).toBe(true)
    })

    it('ignores the source week and anything out of range', async () => {
      const result = await duplicateWorkoutWeek({
        fromWeek: 2,
        toWeeks: [2, 99, 4],
      })
      expect(result.weeks).toEqual([4])
    })

    it('rejects an empty week selection', async () => {
      await expect(
        duplicateWorkoutWeek({ fromWeek: 1, toWeeks: [] }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })
  })

  describe('per-user copies', () => {
    it("reads through to the programme's week until someone edits it", async () => {
      const master = await getWorkoutWeek(1)
      const mine = await getClientWorkoutWeek('c-14', 1)
      expect(mine.edited).toBe(false)
      expect(mine.days.map((d) => d.label)).toEqual(
        master.days.map((d) => d.label),
      )
    })

    it("keeps a nutritionist's edit for that user and week only", async () => {
      const saved = await saveClientWorkoutDay('c-14', {
        weekNum: 1,
        dayNum: 1,
        label: 'Physio Session',
        type: 'rest',
        body: '<p>Shoulder rehab only.</p>',
      })
      expect(saved.edited).toBe(true)
      expect(dayIn(saved, 1)?.label).toBe('Physio Session')

      // Another user, another week, and the programme itself are untouched.
      expect(dayIn(await getClientWorkoutWeek('c-1', 1), 1)?.label).toBe(
        'Push Day',
      )
      expect((await getClientWorkoutWeek('c-14', 2)).edited).toBe(false)
      expect(dayIn(await getWorkoutWeek(1), 1)?.label).toBe('Push Day')
    })

    it('swaps days for one user without touching the programme', async () => {
      const week = await swapClientWorkoutDays('c-14', {
        weekNum: 1,
        fromDay: 1,
        toDay: 5,
      })
      expect(week.edited).toBe(true)
      expect(dayIn(week, 1)?.label).toBe('Leg Day')
      expect(dayIn(await getWorkoutWeek(1), 1)?.label).toBe('Push Day')
    })

    it('resets a week back to the programme', async () => {
      await saveClientWorkoutDay('c-14', {
        weekNum: 1,
        dayNum: 1,
        label: 'Physio Session',
        type: 'rest',
        body: '<p>Shoulder rehab only.</p>',
      })
      const reset = await resetClientWorkoutWeek('c-14', 1)
      expect(reset.edited).toBe(false)
      expect(dayIn(reset, 1)?.label).toBe('Push Day')
    })
  })
})
