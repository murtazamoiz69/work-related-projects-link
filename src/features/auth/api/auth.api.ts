// Auth service — login + forgot-password through the shared HTTP client.
import { post } from '@/lib/api/client'
import type { Profile } from '@/features/shell/data'
import type {
  AuthUser,
  ForgotPasswordBody,
  LoginBody,
  LoginResponse,
} from './auth.types'

/** Map the backend's user onto the app's Profile (used by the auth store + shell). */
export function userToProfile(user: AuthUser): Profile {
  return {
    name: user.name,
    initials: user.initials,
    color: user.color,
    email: user.email,
  }
}

export async function login(body: LoginBody): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/login', body)
}

export async function forgotPassword(
  body: ForgotPasswordBody,
): Promise<{ ok: true }> {
  return post<{ ok: true }>('/auth/forgot-password', body)
}
