// Mock auth backend. Two demo accounts (matching the app's two profiles); any
// non-empty password is accepted for a known email, unknown emails get 401.
import type { AuthUser } from './auth.types'

const USERS: Record<string, AuthUser> = {
  'sarah@nourishwithsim.com': {
    id: 'u-sarah',
    name: 'Sarah Nolan',
    role: 'Nutritionist',
    email: 'sarah@nourishwithsim.com',
    initials: 'SN',
    color: '#2F5D50',
  },
  'alex@nourishwithsim.com': {
    id: 'u-alex',
    name: 'Alex Rivera',
    role: 'Super Admin',
    email: 'alex@nourishwithsim.com',
    initials: 'AR',
    color: '#7A5AA8',
  },
}

export function findUserByEmail(email: string): AuthUser | undefined {
  return USERS[email.trim().toLowerCase()]
}
