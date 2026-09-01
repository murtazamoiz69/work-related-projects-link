import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { apiErrorMessage } from '@/lib/api/errors'
import { isApiError } from '@/lib/api/types'
import { showToast } from '@/lib/toast'
import { useAuthStore } from '@/store/useAuthStore'
import {
  useChangePassword,
  useNotificationPrefsQuery,
  usePracticeQuery,
  useUpdateNotificationPrefs,
  useUpdatePractice,
  type NotificationPrefs,
  type PracticeDetails,
} from '@/features/settings'
import {
  changePasswordSchema,
  practiceSchema,
  type ChangePasswordForm,
  type PracticeForm,
} from '@/features/settings/schemas/settings.schema'

// =====================================================================
// Settings — Profile edits the active session profile (auth store, shared with
// the app-shell chip); notification prefs, security, and practice details are
// served by the settings API (React Query). Profile stays on the store until
// the auth phase owns /me/profile.
// =====================================================================

const AVATAR_COLOR_POOL = [
  '#2F5D50',
  '#3B6FA6',
  '#C44F3F',
  '#7A5AA8',
  '#A3672E',
  '#39816E',
  '#AF5688',
  '#55789D',
] as const

type SectionKey = 'profile' | 'notifications' | 'security' | 'practice'

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??'
  )
}

const NAV_ITEMS: { key: SectionKey; icon: string; label: string }[] = [
  { key: 'profile', icon: 'user-round', label: 'Profile' },
  { key: 'notifications', icon: 'bell', label: 'Notifications' },
  { key: 'security', icon: 'lock', label: 'Security' },
  { key: 'practice', icon: 'building-2', label: 'Practice Details' },
]

/** Brief "Saved" pill next to a section's save button. */
function SavedIndicator({ show }: { show: boolean }) {
  return (
    <span className={`settings-saved-indicator${show ? ' show' : ''}`}>
      <Icon name="check" />
      Saved
    </span>
  )
}

/** Shared "flash Saved for 1.8s" helper. */
function useSavedPill() {
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const flash = () => {
    setSaved(false)
    requestAnimationFrame(() => setSaved(true))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 1800)
  }
  return { saved, flash }
}

export function SettingsPage() {
  const navigate = useNavigate()
  const activeProfile = useAuthStore((s) => s.activeProfile)
  const switchProfile = useAuthStore((s) => s.switchProfile)
  const logout = useAuthStore((s) => s.logout)

  const [section, setSection] = useState<SectionKey>('profile')

  // ---- Profile (auth store — not migrated) ----
  const [name, setName] = useState(activeProfile.name)
  const [role, setRole] = useState(activeProfile.role)
  const [email, setEmail] = useState(
    activeProfile.email ??
      `${activeProfile.name.split(' ')[0].toLowerCase()}@nourishwithsim.com`,
  )
  const [phone, setPhone] = useState(activeProfile.phone ?? '')
  const [bio, setBio] = useState(activeProfile.bio ?? '')
  const [color, setColor] = useState(activeProfile.color)
  const { saved: profileSaved, flash: flashProfile } = useSavedPill()

  const saveProfile = () => {
    const nextName = name.trim() || activeProfile.name
    switchProfile({
      ...activeProfile,
      name: nextName,
      role: role.trim() || activeProfile.role,
      email: email.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      initials: initials(nextName),
      color,
    })
    flashProfile()
    showToast('Profile updated')
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Manage your profile, notifications, and practice details"
      />
      <main className="content settings-content">
        <div className="settings-layout">
          <nav className="settings-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`settings-nav-item${
                  section === item.key ? ' active' : ''
                }`}
                onClick={() => setSection(item.key)}
              >
                <Icon name={item.icon} />
                {item.label}
              </button>
            ))}
            <div className="settings-nav-divider" />
            <button
              className="settings-nav-item settings-nav-danger"
              onClick={handleLogout}
            >
              <Icon name="log-out" />
              Log Out
            </button>
          </nav>

          <div className="settings-panels">
            {/* PROFILE */}
            {section === 'profile' && (
              <section className="panel settings-section">
                <div className="panel-head">
                  <div>
                    <h2>Profile</h2>
                    <p className="panel-sub">
                      This is how you appear to your team and users
                    </p>
                  </div>
                </div>

                <div className="settings-avatar-row">
                  <Avatar
                    initials={activeProfile.initials}
                    color={color}
                    size="lg"
                  />
                  <div className="settings-avatar-swatches">
                    {AVATAR_COLOR_POOL.map((c) => (
                      <button
                        key={c}
                        className={`avatar-swatch${
                          c === color ? ' is-selected' : ''
                        }`}
                        style={{ background: c }}
                        title={c}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                </div>

                <div className="modal-field-row">
                  <label className="modal-field">
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label className="modal-field">
                    <span>Role</span>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </label>
                </div>
                <div className="modal-field-row">
                  <label className="modal-field">
                    <span>Email</span>
                    <input
                      type="email"
                      placeholder="sarah@nourishwithsim.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="modal-field">
                    <span>Phone</span>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                </div>
                <label className="modal-field">
                  <span>Bio</span>
                  <textarea
                    className="notes-input"
                    rows={3}
                    placeholder="A short bio your users might see…"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </label>

                <div className="settings-section-foot">
                  <SavedIndicator show={profileSaved} />
                  <button className="btn-primary" onClick={saveProfile}>
                    Save Changes
                  </button>
                </div>
              </section>
            )}

            {section === 'notifications' && <NotificationsSection />}
            {section === 'security' && <SecuritySection />}
            {section === 'practice' && <PracticeSection />}
          </div>
        </div>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------
const NOTIFICATION_ROWS: {
  key: keyof NotificationPrefs
  title: string
  desc: string
}[] = [
  {
    key: 'email',
    title: 'Email notifications',
    desc: 'Daily digest of user activity sent to your inbox',
  },
  {
    key: 'push',
    title: 'Push notifications',
    desc: 'Real-time alerts in your browser for urgent user flags',
  },
  {
    key: 'chatAlerts',
    title: 'Chat hand-off alerts',
    desc: 'Notify me when Nourish AI flags a conversation for takeover',
  },
  {
    key: 'weekly',
    title: 'Weekly summary report',
    desc: 'A Monday-morning recap of caseload adherence and outcomes',
  },
]

function NotificationsSection() {
  const { data: prefs, isPending } = useNotificationPrefsQuery()
  const updatePrefs = useUpdateNotificationPrefs()
  const { saved, flash } = useSavedPill()

  const setPref = (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) return
    updatePrefs.mutate({ ...prefs, [key]: value })
    flash()
  }

  return (
    <section className="panel settings-section">
      <div className="panel-head">
        <div>
          <h2>Notifications</h2>
          <p className="panel-sub">Choose what you get notified about</p>
        </div>
      </div>

      <div className="settings-toggle-list" aria-busy={isPending || undefined}>
        {NOTIFICATION_ROWS.map((row) => (
          <label key={row.key} className="settings-toggle-row">
            <span>
              <span className="settings-toggle-title">{row.title}</span>
              <span className="settings-toggle-desc">{row.desc}</span>
            </span>
            <span className="toggle-switch">
              <input
                type="checkbox"
                checked={prefs ? prefs[row.key] : false}
                disabled={!prefs}
                onChange={(e) => setPref(row.key, e.target.checked)}
              />
              <span className="toggle-track" />
            </span>
          </label>
        ))}
      </div>
      <div className="settings-section-foot">
        <SavedIndicator show={saved} />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// Security (password + two-factor)
// ---------------------------------------------------------------------
function SecuritySection() {
  const { data: prefs } = useNotificationPrefsQuery()
  const updatePrefs = useUpdateNotificationPrefs()
  const changePw = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const firstError =
    errors.currentPassword?.message ??
    errors.newPassword?.message ??
    errors.confirmPassword?.message ??
    ''

  const onSubmit = (values: ChangePasswordForm) => {
    changePw.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => {
          reset()
          showToast('Password updated')
        },
        onError: (error) => {
          if (isApiError(error) && error.fields?.currentPassword) {
            setError('currentPassword', {
              message: error.fields.currentPassword,
            })
          } else {
            showToast(apiErrorMessage(error))
          }
        },
      },
    )
  }

  const toggle2FA = (checked: boolean) => {
    if (!prefs) return
    updatePrefs.mutate({ ...prefs, twoFactor: checked })
    showToast(
      checked
        ? 'Two-factor authentication enabled'
        : 'Two-factor authentication disabled',
    )
  }

  return (
    <section className="panel settings-section">
      <div className="panel-head">
        <div>
          <h2>Security</h2>
          <p className="panel-sub">Update your password</p>
        </div>
      </div>

      <label className="modal-field">
        <span>Current Password</span>
        <input
          type="password"
          placeholder="••••••••"
          {...register('currentPassword')}
        />
      </label>
      <div className="modal-field-row">
        <label className="modal-field">
          <span>New Password</span>
          <input
            type="password"
            placeholder="••••••••"
            {...register('newPassword')}
          />
        </label>
        <label className="modal-field">
          <span>Confirm New Password</span>
          <input
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
        </label>
      </div>
      {firstError ? (
        <p className="settings-hint is-error">{firstError}</p>
      ) : null}

      <div className="settings-section-foot">
        <button
          className="btn-primary"
          onClick={handleSubmit(onSubmit)}
          disabled={changePw.isPending}
        >
          {changePw.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      <div
        className="settings-section-foot"
        style={{
          marginTop: 22,
          borderTop: '1px solid var(--border-soft)',
          paddingTop: 18,
        }}
      >
        <div>
          <span className="settings-toggle-title">
            Two-factor authentication
          </span>
          <span
            className="settings-toggle-desc"
            style={{ display: 'block', marginTop: 2 }}
          >
            Require a verification code when logging in from a new device
          </span>
        </div>
        <span className="toggle-switch">
          <input
            type="checkbox"
            checked={prefs ? prefs.twoFactor : false}
            disabled={!prefs}
            onChange={(e) => toggle2FA(e.target.checked)}
          />
          <span className="toggle-track" />
        </span>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------
// Practice details
// ---------------------------------------------------------------------
function PracticeSection() {
  const { data, isPending } = usePracticeQuery()

  if (isPending || !data) {
    return (
      <section className="panel settings-section" aria-busy="true">
        <div className="panel-head">
          <div>
            <h2>Practice Details</h2>
            <p className="panel-sub">
              Shown on user-facing reports and reminders
            </p>
          </div>
        </div>
        <span className="skel skel-wide" />
      </section>
    )
  }

  return <PracticeDetailsForm initial={data} />
}

function PracticeDetailsForm({ initial }: { initial: PracticeDetails }) {
  const update = useUpdatePractice()
  const { saved, flash } = useSavedPill()
  const { register, handleSubmit } = useForm<PracticeForm>({
    resolver: zodResolver(practiceSchema),
    defaultValues: initial,
  })

  const onSubmit = (values: PracticeForm) => {
    update.mutate(values, { onSuccess: () => flash() })
  }

  return (
    <section className="panel settings-section">
      <div className="panel-head">
        <div>
          <h2>Practice Details</h2>
          <p className="panel-sub">
            Shown on user-facing reports and reminders
          </p>
        </div>
      </div>

      <label className="modal-field">
        <span>Practice Name</span>
        <input type="text" {...register('name')} />
      </label>
      <div className="modal-field-row">
        <label className="modal-field">
          <span>Timezone</span>
          <select {...register('timezone')}>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
          </select>
        </label>
        <label className="modal-field">
          <span>Working Hours</span>
          <select {...register('workingHours')}>
            <option value="9-5">9:00 AM – 5:00 PM</option>
            <option value="8-4">8:00 AM – 4:00 PM</option>
            <option value="10-6">10:00 AM – 6:00 PM</option>
          </select>
        </label>
      </div>
      <div className="settings-section-foot">
        <SavedIndicator show={saved} />
        <button
          className="btn-primary"
          onClick={handleSubmit(onSubmit)}
          disabled={update.isPending}
        >
          {update.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </section>
  )
}
