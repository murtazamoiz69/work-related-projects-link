// Auth mutation hooks. useLogin owns the "authenticated" side effect (persist
// token + set the session profile); the page owns navigation + error display.
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { forgotPassword, login, userToProfile } from '../api/auth.api'
import type { LoginBody } from '../api/auth.types'

export function useLogin() {
  const signIn = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: (body: LoginBody) => login(body),
    onSuccess: (res) => {
      signIn(userToProfile(res.user), res.token)
    },
  })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword })
}
