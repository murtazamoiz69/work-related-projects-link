// Validation for the Add/Edit Nutritionist form.
import { z } from 'zod'
import {
  PHONE_NATIONAL_DIGITS,
  phoneDigits,
} from '@/features/clients/schemas/addClient.schema'

export const nutritionistFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email.'),
  // Same rule as the user form: the country code is fixed, 10 national digits.
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .refine((v) => phoneDigits(v).length === PHONE_NATIONAL_DIGITS, {
      message: `Enter a ${PHONE_NATIONAL_DIGITS}-digit mobile number.`,
    }),
  qualification: z.string().trim().min(1, 'Qualification is required.'),
  // The input registers with valueAsNumber, so an empty field arrives as NaN.
  experienceYears: z
    .number({ message: 'Enter the years of experience.' })
    .int('Use whole years.')
    .min(0, 'Cannot be negative.')
    .max(70, 'That seems too high.'),
})

export type NutritionistFormValues = z.infer<typeof nutritionistFormSchema>
