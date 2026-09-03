// Mock auth backend. A couple of demo accounts; any non-empty password is
// accepted for a known email, unknown emails get 401. Every account is a
// nutritionist with the same access — there is no second role.
import type { AuthUser } from './auth.types'

const USERS: Record<string, AuthUser> = {
  'sarah@nourishwithsim.com': {
    id: 'u-sarah',
    name: 'Sarah Nolan',
    email: 'sarah@nourishwithsim.com',
    initials: 'SN',
    color: '#2F5D50',
  },
  'alex@nourishwithsim.com': {
    id: 'u-alex',
    name: 'Alex Rivera',
    email: 'alex@nourishwithsim.com',
    initials: 'AR',
    color: '#7A5AA8',
  },
}

export function findUserByEmail(email: string): AuthUser | undefined {
  return USERS[email.trim().toLowerCase()]
}
