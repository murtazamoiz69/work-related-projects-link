// Auth API contracts.
export type LoginBody = {
  email: string
  password: string
  rememberMe: boolean
}

/** The authenticated user as the backend returns it. */
export type AuthUser = {
  id: string
  name: string
  role: string
  email: string
  initials: string
  color: string
}

export type LoginResponse = {
  token: string
  refreshToken: string
  user: AuthUser
}

export type ForgotPasswordBody = {
  email: string
}
