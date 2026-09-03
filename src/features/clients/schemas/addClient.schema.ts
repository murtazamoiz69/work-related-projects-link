// Validation for the "Add individually" form. The same five fields the bulk
// importer reads out of a spreadsheet, so `CreateClientBody` (the request type)
// and this schema describe one shape — see docs/api-guidelines.md.
import { z } from 'zod'

export const DEFAULT_PROGRAM_WEEKS = 12

export const addClientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  phone: z.string().trim().min(1, 'Phone number is required.'),
  program: z.string().trim().min(1, 'Choose a plan.'),
  // The input registers with valueAsNumber, so an empty field arrives as NaN.
  weeks: z
    .number({ message: 'Enter the number of weeks.' })
    .int('Use whole weeks.')
    .min(1, 'Weeks must be a positive number.')
    .max(104, 'That seems too long.'),
})

export type AddClientValues = z.infer<typeof addClientSchema>
