import { beforeEach, describe, expect, it } from 'vitest'
import { resetClientStore } from '@/features/clients/api/clients.mock'
import {
  duplicateMasterSheet,
  getClientDietPlan,
  getMasterSheet,
  saveClientDietPlan,
  saveMasterSheet,
  updateClientBand,
  updateClientReview,
} from './dietPlan.api'
import { resetDietPlanStore } from './dietPlan.mock'
import { CALORIE_BANDS } from './dietPlan.types'

describe('diet plan api', () => {
  beforeEach(() => {
    resetDietPlanStore()
    resetClientStore()
  })

  describe('master sheets', () => {
    it('serves a sheet per week per calorie band', async () => {
      const sheet = await getMasterSheet(1, 1600)
      expect(sheet.weekNum).toBe(1)
      expect(sheet.band).toBe(1600)
      expect(sheet.updatedAt).toBeInstanceOf(Date)
      // Slot-by-slot rich text, not a list of dishes.
      expect(sheet.body).toContain('Breakfast')
      expect(sheet.body).toContain('Pre-workout')
      expect(sheet.body).toContain('1600 kcal')
    })

    it('scales portions with the band', async () => {
      const low = await getMasterSheet(1, 1200)
      const high = await getMasterSheet(1, 2000)
      expect(low.body).not.toBe(high.body)
      expect(low.body).toContain('1200 kcal')
      expect(high.body).toContain('2000 kcal')
    })

    it('ships only week 1 authored — the rest start blank', async () => {
      for (const band of CALORIE_BANDS) {
        expect((await getMasterSheet(1, band)).body).not.toBe('')
      }
      for (const week of [2, 3, 4, 5, 6]) {
        expect((await getMasterSheet(week, 1600)).body).toBe('')
      }
    })

    it('gives a user a blank plan for a week that has no master sheet', async () => {
      const plan = await getClientDietPlan('c-14', 4)
      expect(plan.body).toBe('')
      // No filter summary either — there is nothing to have filtered.
      expect(plan.appliedFilters).toEqual([])
    })

    it('rejects an unknown band with a field error', async () => {
      await expect(
        getMasterSheet(1, 1234 as (typeof CALORIE_BANDS)[number]),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })

    it('saves an edit and reads it back', async () => {
      const body = '<h2>Rewritten</h2><p>Two eggs.</p>'
      await saveMasterSheet({ weekNum: 2, band: 1400, body })
      expect((await getMasterSheet(2, 1400)).body).toBe(body)
      // Only that week and band changed.
      expect((await getMasterSheet(3, 1400)).body).not.toBe(body)
      expect((await getMasterSheet(2, 1600)).body).not.toBe(body)
    })
  })

  describe('duplicate', () => {
    it('copies one week onto the chosen weeks of the same band', async () => {
      const body = '<h2>Week 1 rewritten</h2>'
      await saveMasterSheet({ weekNum: 1, band: 1800, body })

      const result = await duplicateMasterSheet({
        fromWeek: 1,
        band: 1800,
        toWeeks: [3, 5],
      })
      expect(result.weeks).toEqual([3, 5])
      expect((await getMasterSheet(3, 1800)).body).toBe(body)
      expect((await getMasterSheet(5, 1800)).body).toBe(body)
      // Untouched weeks and other bands are unaffected.
      expect((await getMasterSheet(4, 1800)).body).not.toBe(body)
      expect((await getMasterSheet(3, 1200)).body).not.toBe(body)
    })

    it('ignores the source week and anything out of range', async () => {
      const result = await duplicateMasterSheet({
        fromWeek: 2,
        band: 1600,
        toWeeks: [2, 99, 4],
      })
      expect(result.weeks).toEqual([4])
    })

    it('rejects an empty week selection', async () => {
      await expect(
        duplicateMasterSheet({ fromWeek: 1, band: 1600, toWeeks: [] }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })
  })

  describe('per-user plans', () => {
    // Meera (c-14) is 1400 kcal, eggitarian, PCOS + Thyroid.
    it("derives a user's plan from the master sheet for their band", async () => {
      const plan = await getClientDietPlan('c-14', 1)
      expect(plan.profile.band).toBe(1400)
      expect(plan.edited).toBe(false)
      expect(plan.body).toContain('1400 kcal')
    })

    it('applies the dietary preference and condition filters', async () => {
      const plan = await getClientDietPlan('c-14', 1)
      // Eggitarian removes chicken and fish from the choice lines.
      expect(plan.body.toLowerCase()).not.toContain('chicken')
      expect(plan.body.toLowerCase()).not.toContain('fish')
      // Thyroid drops soy.
      expect(plan.body.toLowerCase()).not.toContain('tofu')
      expect(plan.appliedFilters.join(' ')).toMatch(/PCOS/)
      expect(plan.appliedFilters.join(' ')).toMatch(/Thyroid/)
    })

    it('only ever narrows the master sheet — never adds food to it', async () => {
      const master = await getMasterSheet(1, 1400)
      const plan = await getClientDietPlan('c-14', 1)

      // The engine may drop a whole option or trim options out of a "Protein —
      // a / b / c" line, so a plan line needn't match a master line verbatim.
      // The property that matters is finer: every individual food option the
      // user is offered was already written on the master sheet.
      const options = (s: string) =>
        (s.match(/<li>(.*?)<\/li>/gs) ?? [])
          .map((li) => li.replace(/<\/?li>/g, ''))
          .flatMap((inner) => {
            const [, rest] = inner.split(/ — (.+)/s)
            return (rest ?? inner).split(' / ')
          })
          .map((o) => o.trim())
          .filter(Boolean)

      // Everything after this heading is the engine's own summary, not food.
      const userFood = options(plan.body.split('Tailored for this user')[0])
      const masterFood = new Set(options(master.body))

      expect(userFood.length).toBeGreaterThan(0)
      for (const option of userFood) expect(masterFood.has(option)).toBe(true)
      // And it genuinely removed things, rather than passing by doing nothing.
      expect(userFood.length).toBeLessThan(masterFood.size)
    })

    it('notes a lactating profile rather than silently rescaling', async () => {
      // Elena (c-3) is lactating.
      const plan = await getClientDietPlan('c-3', 1)
      expect(plan.appliedFilters.join(' ')).toMatch(/Lactating/i)
    })

    it("keeps a nutritionist's edit for that user and week only", async () => {
      const body = '<p>Hand written for Meera.</p>'
      const saved = await saveClientDietPlan('c-14', 2, { body })
      expect(saved.edited).toBe(true)

      expect((await getClientDietPlan('c-14', 2)).body).toBe(body)
      expect((await getClientDietPlan('c-14', 1)).body).not.toBe(body)
      expect((await getClientDietPlan('c-1', 2)).body).not.toBe(body)
      // The master sheet is untouched by a per-user edit.
      expect((await getMasterSheet(2, 1400)).body).not.toBe(body)
    })
  })

  describe('changing a band', () => {
    it('moves the user and re-derives their plan', async () => {
      const updated = await updateClientBand('c-14', { band: 1800 })
      expect(updated.dietProfile?.band).toBe(1800)

      const plan = await getClientDietPlan('c-14', 1)
      expect(plan.profile.band).toBe(1800)
      expect(plan.body).toContain('1800 kcal')
    })

    it('drops edits made against the old band', async () => {
      const body = '<p>Written at 1400.</p>'
      await saveClientDietPlan('c-14', 1, { body })
      expect((await getClientDietPlan('c-14', 1)).body).toBe(body)

      await updateClientBand('c-14', { band: 2000 })
      const plan = await getClientDietPlan('c-14', 1)
      expect(plan.body).not.toBe(body)
      expect(plan.edited).toBe(false)
    })

    it('rejects a band that is not one of the five', async () => {
      await expect(
        updateClientBand('c-14', {
          band: 1500 as (typeof CALORIE_BANDS)[number],
        }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })

    it('sends the user back into review — the signed-off plan has changed', async () => {
      const signedOff = await updateClientReview('c-14', {
        status: 'reviewed',
      })
      expect(signedOff.dietReview).toBe('reviewed')

      const moved = await updateClientBand('c-14', { band: 1800 })
      expect(moved.dietReview).toBe('in-review')
      expect(moved.dietReviewedAt).toBeNull()
    })
  })

  describe('review sign-off', () => {
    it('marks a plan reviewed and stamps when', async () => {
      const updated = await updateClientReview('c-11', { status: 'reviewed' })
      expect(updated.dietReview).toBe('reviewed')
      expect(updated.dietReviewedAt).toBeInstanceOf(Date)
    })

    it('reopens a reviewed plan', async () => {
      await updateClientReview('c-11', { status: 'reviewed' })
      const reopened = await updateClientReview('c-11', {
        status: 'in-review',
      })
      expect(reopened.dietReview).toBe('in-review')
      expect(reopened.dietReviewedAt).toBeNull()
    })

    it('leaves the plan itself alone — it records only that someone read it', async () => {
      const before = await getClientDietPlan('c-11', 1)
      await updateClientReview('c-11', { status: 'reviewed' })
      const after = await getClientDietPlan('c-11', 1)
      expect(after.body).toBe(before.body)
      expect(after.edited).toBe(before.edited)
    })

    it('reports the sign-off on the plan itself, edited or not', async () => {
      // The plan carries it so a surface holding a stale client still shows
      // the truth — the bug this replaced was exactly that.
      expect((await getClientDietPlan('c-11', 1)).review).toBe('in-review')

      await saveClientDietPlan('c-11', 1, { body: '<p>Hand written.</p>' })
      await updateClientReview('c-11', { status: 'reviewed' })

      // Including on a week that has a stored, hand-edited copy.
      const edited = await getClientDietPlan('c-11', 1)
      expect(edited.edited).toBe(true)
      expect(edited.review).toBe('reviewed')
      expect(edited.reviewedAt).toBeInstanceOf(Date)
    })

    it('404s for a user who does not exist', async () => {
      await expect(
        updateClientReview('nobody', { status: 'reviewed' }),
      ).rejects.toMatchObject({ status: 404 })
    })

    it('rejects an unknown review state', async () => {
      await expect(
        updateClientReview('c-11', {
          status: 'maybe' as 'reviewed',
        }),
      ).rejects.toMatchObject({ kind: 'validation', status: 422 })
    })
  })
})
