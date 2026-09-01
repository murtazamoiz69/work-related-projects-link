// Validation schema for the Extend Program form. A factory, because the custom
// date is only valid when it lands after the user's current expiry — which is
// runtime data, not a static rule.
import { z } from 'zod'

export const EXTEND_OPTIONS = ['7', '14', '30', '90', 'custom'] as const
export type ExtendOption = (typeof EXTEND_OPTIONS)[number]

export type ExtendProgramForm = {
  option: ExtendOption
  customDate: string
}

export function makeExtendProgramSchema(currentExpiry: Date) {
  return z
    .object({
      option: z.enum(EXTEND_OPTIONS),
      customDate: z.string(),
    })
    .superRefine((value, ctx) => {
      if (value.option !== 'custom') return
      const parsed = new Date(`${value.customDate}T00:00:00`)
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({
          code: 'custom',
          path: ['customDate'],
          message: 'Enter a valid date.',
        })
        return
      }
      if (parsed.getTime() <= currentExpiry.getTime()) {
        ctx.addIssue({
          code: 'custom',
          path: ['customDate'],
          message: 'Pick a date after the current expiry.',
        })
      }
    })
}
