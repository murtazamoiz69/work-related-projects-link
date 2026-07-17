import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { showToast } from '@/lib/toast'
import { useAuthStore } from '@/store/useAuthStore'

// =====================================================================
// Settings — edits the currently active profile (shared with the app-shell
// profile dropdown via the auth store), plus notification preferences and
// practice details persisted to localStorage. Ported from V2 settings.js.
// =====================================================================

const AVATAR_COLOR_POOL = [
  '#2F5D50',
  '#3B6FA6',
  '#C7594A',
  '#7A5AA8',
  '#C77F3B',
  '#3F8F7A',
  '#B0598A',
  '#5B7FA6',
] as const

type SectionKey = 'profile' | 'notifications' | 'security' | 'practice'

type NotificationPrefs = {
  email: boolean
  push: boolean
  chatAlerts: boolean
  weekly: boolean
  twoFactor: boolean
}

type PracticeDetails = {
  name: string
  timezone: string
  workingHours: string
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  email: true,
  push: true,
  chatAlerts: true,
  weekly: false,
  twoFactor: false,
}

const DEFAULT_PRACTICE_DETAILS: PracticeDetails = {
  name: 'Nourish with Nourish AI',
  timezone: 'America/New_York',
  workingHours: '9-5',
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

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

export function SettingsPage() {
  const navigate = useNavigate()
  const activeProfile = useAuthStore((s) => s.activeProfile)
  const switchProfile = useAuthStore((s) => s.switchProfile)
  const logout = useAuthStore((s) => s.logout)

  const [section, setSection] = useState<SectionKey>('profile')

  // ---- Profile ----
  const [name, setName] = useState(activeProfile.name)
  const [role, setRole] = useState(activeProfile.role)
  const [email, setEmail] = useState(
    activeProfile.email ??
      `${activeProfile.name.split(' ')[0].toLowerCase()}@nourishwithsim.com`,
  )
  const [phone, setPhone] = useState(activeProfile.phone ?? '')
  const [bio, setBio] = useState(activeProfile.bio ?? '')
  const [color, setColor] = useState(activeProfile.color)
  const [profileSaved, setProfileSaved] = useState(false)

  // ---- Notifications / Security (shared prefs) ----
  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    loadJSON('nourishNotificationPrefs', DEFAULT_NOTIFICATION_PREFS),
  )
  const [notifSaved, setNotifSaved] = useState(false)

  // ---- Security ----
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordHint, setPasswordHint] = useState<{
    text: string
    error: boolean
  }>({ text: '', error: false })

  // ---- Practice ----
  const [practice, setPractice] = useState<PracticeDetails>(() =>
    loadJSON('nourishPracticeDetails', DEFAULT_PRACTICE_DETAILS),
  )
  const [practiceSaved, setPracticeSaved] = useState(false)

  const savedTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const flashSaved = (id: string, set: (v: boolean) => void) => {
    set(false)
    // re-trigger the CSS enter transition on the next frame
    requestAnimationFrame(() => set(true))
    clearTimeout(savedTimers.current[id])
    savedTimers.current[id] = setTimeout(() => set(false), 1800)
  }

  const previewInitials = activeProfile.initials

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
    flashSaved('profile', setProfileSaved)
    showToast('Profile updated')
  }

  const setNotificationPref = (
    key: keyof NotificationPrefs,
    value: boolean,
  ) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    saveJSON('nourishNotificationPrefs', next)
    flashSaved('notif', setNotifSaved)
    return next
  }

  const savePractice = () => {
    const next: PracticeDetails = {
      name: practice.name.trim() || DEFAULT_PRACTICE_DETAILS.name,
      timezone: practice.timezone,
      workingHours: practice.workingHours,
    }
    setPractice(next)
    saveJSON('nourishPracticeDetails', next)
    flashSaved('practice', setPracticeSaved)
    showToast('Practice details updated')
  }

  const updatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordHint({ text: 'Fill in all three fields.', error: true })
      return
    }
    if (newPassword.length < 8) {
      setPasswordHint({
        text: 'New password must be at least 8 characters.',
        error: true,
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordHint({
        text: "New password and confirmation don't match.",
        error: true,
      })
      return
    }
    setPasswordHint({ text: '', error: false })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showToast('Password updated')
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
                      This is how you appear to your team and clients
                    </p>
                  </div>
                </div>

                <div className="settings-avatar-row">
                  <Avatar initials={previewInitials} color={color} size="lg" />
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
                    placeholder="A short bio your clients might see…"
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

            {/* NOTIFICATIONS */}
            {section === 'notifications' && (
              <section className="panel settings-section">
                <div className="panel-head">
                  <div>
                    <h2>Notifications</h2>
                    <p className="panel-sub">
                      Choose what you get notified about
                    </p>
                  </div>
                </div>

                <div className="settings-toggle-list">
                  {(
                    [
                      {
                        key: 'email',
                        title: 'Email notifications',
                        desc: 'Daily digest of client activity sent to your inbox',
                      },
                      {
                        key: 'push',
                        title: 'Push notifications',
                        desc: 'Real-time alerts in your browser for urgent client flags',
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
                    ] as const
                  ).map((row) => (
                    <label key={row.key} className="settings-toggle-row">
                      <span>
                        <span className="settings-toggle-title">
                          {row.title}
                        </span>
                        <span className="settings-toggle-desc">{row.desc}</span>
                      </span>
                      <span className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={prefs[row.key]}
                          onChange={(e) =>
                            setNotificationPref(row.key, e.target.checked)
                          }
                        />
                        <span className="toggle-track" />
                      </span>
                    </label>
                  ))}
                </div>
                <div className="settings-section-foot">
                  <SavedIndicator show={notifSaved} />
                </div>
              </section>
            )}

            {/* SECURITY */}
            {section === 'security' && (
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
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </label>
                <div className="modal-field-row">
                  <label className="modal-field">
                    <span>New Password</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </label>
                  <label className="modal-field">
                    <span>Confirm New Password</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </label>
                </div>
                {passwordHint.text && (
                  <p
                    className={`settings-hint${
                      passwordHint.error ? ' is-error' : ''
                    }`}
                  >
                    {passwordHint.text}
                  </p>
                )}

                <div className="settings-section-foot">
                  <button className="btn-primary" onClick={updatePassword}>
                    Update Password
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
                      Require a verification code when logging in from a new
                      device
                    </span>
                  </div>
                  <span className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={prefs.twoFactor}
                      onChange={(e) => {
                        setNotificationPref('twoFactor', e.target.checked)
                        showToast(
                          e.target.checked
                            ? 'Two-factor authentication enabled'
                            : 'Two-factor authentication disabled',
                        )
                      }}
                    />
                    <span className="toggle-track" />
                  </span>
                </div>
              </section>
            )}

            {/* PRACTICE DETAILS */}
            {section === 'practice' && (
              <section className="panel settings-section">
                <div className="panel-head">
                  <div>
                    <h2>Practice Details</h2>
                    <p className="panel-sub">
                      Shown on client-facing reports and reminders
                    </p>
                  </div>
                </div>

                <label className="modal-field">
                  <span>Practice Name</span>
                  <input
                    type="text"
                    value={practice.name}
                    onChange={(e) =>
                      setPractice((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </label>
                <div className="modal-field-row">
                  <label className="modal-field">
                    <span>Timezone</span>
                    <select
                      value={practice.timezone}
                      onChange={(e) =>
                        setPractice((p) => ({ ...p, timezone: e.target.value }))
                      }
                    >
                      <option value="America/New_York">
                        Eastern Time (ET)
                      </option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">
                        Pacific Time (PT)
                      </option>
                    </select>
                  </label>
                  <label className="modal-field">
                    <span>Working Hours</span>
                    <select
                      value={practice.workingHours}
                      onChange={(e) =>
                        setPractice((p) => ({
                          ...p,
                          workingHours: e.target.value,
                        }))
                      }
                    >
                      <option value="9-5">9:00 AM – 5:00 PM</option>
                      <option value="8-4">8:00 AM – 4:00 PM</option>
                      <option value="10-6">10:00 AM – 6:00 PM</option>
                    </select>
                  </label>
                </div>
                <div className="settings-section-foot">
                  <SavedIndicator show={practiceSaved} />
                  <button className="btn-primary" onClick={savePractice}>
                    Save Changes
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
