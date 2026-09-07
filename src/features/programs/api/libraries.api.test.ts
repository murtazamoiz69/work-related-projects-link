import { describe, expect, it } from 'vitest'
import { getCalorieBands } from './libraries.api'
import { CALORIE_BANDS } from '../diet/dietPlan.types'

describe('libraries.api', () => {
  it('GET /libraries/calorie-bands returns the calorie-band list', async () => {
    const bands = await getCalorieBands()
    expect(bands).toEqual([...CALORIE_BANDS])
  })
})
