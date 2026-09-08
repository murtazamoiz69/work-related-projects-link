// Validation for the "Add individually" form. The same five fields the bulk
// importer reads out of a spreadsheet, so `CreateClientBody` (the request type)
// and this schema describe one shape — see docs/api-guidelines.md.
import { z } from 'zod'

export const DEFAULT_PROGRAM_WEEKS = 12

/** Matches the mobile app's own name field, so a user cannot be created here
 *  with a name they could never have entered themselves. */
export const NAME_MAX_LENGTH = 50

/** Users are Indian, so the number is captured in +91 form: the field carries
 *  the code as a fixed prefix rather than asking for it to be typed. */
export const PHONE_COUNTRY_CODE = '+91'
export const PHONE_NATIONAL_DIGITS = 10

/** Strips the country code and any spacing, leaving the national digits — what
 *  the length rule is applied to. */
export function phoneDigits(raw: string): string {
  return raw.replace(/^\+?91/, '').replace(/\D/g, '')
}

/** Store and display one canonical form, whatever was typed or imported. */
export function formatPhone(raw: string): string {
  return `${PHONE_COUNTRY_CODE} ${phoneDigits(raw)}`
}

export const addClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(
      NAME_MAX_LENGTH,
      `Name must be ${NAME_MAX_LENGTH} characters or fewer.`,
    ),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine((v) => phoneDigits(v).length === PHONE_NATIONAL_DIGITS, {
      message: `Enter a ${PHONE_NATIONAL_DIGITS}-digit mobile number.`,
    }),
  program: z.string().trim().min(1, 'Choose a plan.'),
  // The input registers with valueAsNumber, so an empty field arrives as NaN.
  weeks: z
    .number({ message: 'Enter the number of weeks.' })
    .int('Use whole weeks.')
    .min(1, 'Weeks must be a positive number.')
    .max(104, 'That seems too long.'),
})

export type AddClientValues = z.infer<typeof addClientSchema>
