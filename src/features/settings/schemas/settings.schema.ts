import { z } from 'zod'

export const practiceSchema = z.object({
  name: z.string().trim().min(1, 'Practice name is required.'),
  timezone: z.string().min(1),
  workingHours: z.string().min(1),
})
export type PracticeForm = z.infer<typeof practiceSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: "New password and confirmation don't match.",
  })
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>
