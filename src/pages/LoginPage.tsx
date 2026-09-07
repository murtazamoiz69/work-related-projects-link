import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { apiErrorMessage } from '@/lib/api/errors'
import { isApiError } from '@/lib/api/types'
import { showToast } from '@/lib/toast'
import { useForgotPassword, useLogin } from '@/features/auth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(4, 'Password must be at least 4 characters.'),
  rememberMe: z.boolean(),
})

type LoginForm = z.infer<typeof loginSchema>

type LoginPageProps = { redirect?: string }

// "Remember me" persists the last-used email (never the password) so the login
// form prefills it next time. Cleared when a sign-in leaves the box unchecked.
const REMEMBERED_EMAIL_KEY = 'nws.rememberedEmail'
const DEMO_EMAIL = 'sarah@nourishwithsim.com'

function readRememberedEmail(): string | null {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY)
  } catch {
    return null
  }
}

function writeRememberedEmail(email: string | null): void {
  try {
    if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY)
  } catch {
    /* localStorage unavailable — remember-me just won't persist */
  }
}

export function LoginPage({ redirect }: LoginPageProps) {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const forgotPassword = useForgotPassword()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      // A remembered email (from a prior "Remember me" sign-in) wins; otherwise
      // fall back to the demo address as a first-run hint.
      email: readRememberedEmail() ?? DEMO_EMAIL,
      password: '',
      rememberMe: true,
    },
  })

  useEffect(() => {
    document.body.classList.add('auth-page')
    return () => document.body.classList.remove('auth-page')
  }, [])

  const firstError = errors.email?.message ?? errors.password?.message ?? ''

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        // Remember (or forget) the email for the next visit — password is never
        // stored.
        writeRememberedEmail(data.rememberMe ? data.email.trim() : null)
        navigate({ to: redirect ?? '/' })
      },
      onError: (error) => {
        setError('password', {
          message:
            isApiError(error) && error.kind === 'unauthorized'
              ? 'Invalid email or password.'
              : apiErrorMessage(error),
        })
      },
    })
  }

  const onForgotPassword = () => {
    const email = getValues('email').trim()
    if (!email || !email.includes('@')) {
      setError('email', {
        message: 'Enter your email above first, then we can send a reset link.',
      })
      return
    }
    clearErrors()
    forgotPassword.mutate(
      { email },
      { onSuccess: () => showToast(`Password reset link sent to ${email}`) },
    )
  }

  const submitting = loginMutation.isPending

  return (
    <>
      <div className="auth-bg-decor" aria-hidden="true">
        <span className="auth-blob auth-blob-1" />
        <span className="auth-blob auth-blob-2" />
        <span className="auth-blob auth-blob-3" />
        <span className="auth-blob auth-blob-4" />
        <span className="auth-grid-pattern" />
      </div>

      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark">N</div>
            <div className="brand-text">
              <span className="brand-name">Nourish</span>
              <span className="brand-sub">with Nourish AI</span>
            </div>
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to your nutritionist dashboard
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="modal-field">
              <span>Email</span>
              <input
                type="email"
                placeholder="sarah@nourishwithsim.com"
                autoComplete="username"
                {...register('email')}
              />
            </label>
            <label className="modal-field">
              <span>Password</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} />
                </button>
              </div>
            </label>

            <div className="auth-row">
              <label className="auth-remember">
                <input type="checkbox" {...register('rememberMe')} />
                Remember me
              </label>
              <button
                type="button"
                className="link-btn hidden"
                onClick={onForgotPassword}
              ></button>
            </div>

            {firstError ? (
              <p className="settings-hint is-error" role="alert">
                {firstError}
              </p>
            ) : null}

            <button
              type="submit"
              className="btn-primary full auth-submit"
              disabled={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
