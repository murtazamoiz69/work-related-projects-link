// Validation for Settings › Profile — the only settings form in the app.
import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  // Optional: the seeded demo profile has no phone, and a nutritionist
  // shouldn't be blocked from saving a bio because of it.
  phone: z.string().trim().max(32, 'That number looks too long.'),
  bio: z.string().trim().max(280, 'Keep the bio under 280 characters.'),
})

export type ProfileForm = z.infer<typeof profileSchema>
