import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { showToast } from '@/lib/toast'
import { getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import {
  profileSchema,
  type ProfileForm,
} from '@/features/shell/schemas/profile.schema'
import { readProfilePhoto } from '@/features/shell/profilePhoto'

// =====================================================================
// Settings — one section. Profile edits the active session profile (auth
// store, shared with the app-shell chip); it stays there until the auth phase
// owns /me/profile. Log Out is the only other entry.
// =====================================================================

/** Brief "Saved" pill next to the save button. */
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
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout = useAuthStore((s) => s.logout)

  // The photo isn't a form field — it's picked through a file dialog and held
  // here until Save Changes commits it alongside the text fields.
  const [photo, setPhoto] = useState(activeProfile.photo)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: activeProfile.name,
      email: activeProfile.email ?? '',
      phone: activeProfile.phone ?? '',
      bio: activeProfile.bio ?? '',
    },
  })

  // Preview the avatar against what's typed right now, so the initials update
  // as the name does rather than only after saving.
  const typedName = watch('name')

  const pickPhoto = async (file: File) => {
    setPhotoError(null)
    try {
      setPhoto(await readProfilePhoto(file))
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : 'Could not read that image.',
      )
    }
  }

  const onSubmit = (values: ProfileForm) => {
    updateProfile({
      ...activeProfile,
      name: values.name,
      email: values.email,
      phone: values.phone,
      bio: values.bio,
      initials: getInitials(values.name, '??'),
      photo,
    })
    setSaved(false)
    requestAnimationFrame(() => setSaved(true))
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1800)
    showToast('Profile updated')
  }

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <>
      <Topbar title="Settings" subtitle="Manage your profile" />
      <main className="content settings-content">
        <div className="settings-layout">
          <nav className="settings-nav">
            <button className="settings-nav-item active" type="button">
              <Icon name="user-round" />
              Profile
            </button>
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
                  initials={getInitials(typedName, '??')}
                  color={activeProfile.color}
                  photo={photo}
                  alt={activeProfile.name}
                  size="lg"
                />
                <div className="settings-avatar-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Icon name="upload" />
                    {photo ? 'Change photo' : 'Upload photo'}
                  </button>
                  {photo ? (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setPhoto(undefined)
                        setPhotoError(null)
                        if (photoInputRef.current)
                          photoInputRef.current.value = ''
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                  <p className="settings-hint">JPG, PNG or WebP, up to 5 MB.</p>
                  {photoError ? (
                    <span className="settings-hint is-error" role="alert">
                      {photoError}
                    </span>
                  ) : null}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void pickPhoto(file)
                    }}
                  />
                </div>
              </div>

              <div className="modal-field-row">
                <label className="modal-field">
                  <span>Full Name</span>
                  <input type="text" {...register('name')} />
                  {errors.name ? (
                    <span className="settings-hint is-error" role="alert">
                      {errors.name.message}
                    </span>
                  ) : null}
                </label>
                <label className="modal-field">
                  <span>Email</span>
                  <input
                    type="email"
                    placeholder="sarah@nourishwithsim.com"
                    {...register('email')}
                  />
                  {errors.email ? (
                    <span className="settings-hint is-error" role="alert">
                      {errors.email.message}
                    </span>
                  ) : null}
                </label>
              </div>
              <label className="modal-field">
                <span>Phone</span>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('phone')}
                />
                {errors.phone ? (
                  <span className="settings-hint is-error" role="alert">
                    {errors.phone.message}
                  </span>
                ) : null}
              </label>
              <label className="modal-field">
                <span>Bio</span>
                <textarea
                  className="notes-input"
                  rows={3}
                  placeholder="A short bio your users might see…"
                  {...register('bio')}
                />
                {errors.bio ? (
                  <span className="settings-hint is-error" role="alert">
                    {errors.bio.message}
                  </span>
                ) : null}
              </label>

              <div className="settings-section-foot">
                <SavedIndicator show={saved} />
                <button
                  className="btn-primary"
                  onClick={handleSubmit(onSubmit)}
                >
                  Save Changes
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
