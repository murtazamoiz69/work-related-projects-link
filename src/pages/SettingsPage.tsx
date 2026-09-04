import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { apiErrorMessage } from '@/lib/api/errors'
import { showToast } from '@/lib/toast'
import { getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import {
  profileSchema,
  type ProfileForm,
} from '@/features/shell/schemas/profile.schema'
import {
  useStaffProfileQuery,
  useUpdateStaffProfile,
  useUploadProfileImage,
} from '@/features/settings'

// =====================================================================
// Settings — one section. Profile is loaded from and saved to the backend
// (GET/PUT /me/settings/profile); the photo is uploaded to /uploads and the
// returned key is persisted with the profile. On save the app-shell chip (auth
// store) is synced so the avatar/name update everywhere. Log Out is the only
// other entry.
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

  const profileQuery = useStaffProfileQuery()
  const updateMut = useUpdateStaffProfile()
  const uploadMut = useUploadProfileImage()

  // The photo isn't a form field — it's picked through a file dialog, uploaded,
  // and held here (url for preview, key for the save) until Save commits it.
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [photoKey, setPhotoKey] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '', bio: '' },
  })

  // Seed the form + photo once the profile loads (and if it refetches).
  const profile = profileQuery.data
  useEffect(() => {
    if (!profile) return
    reset({
      name: profile.name,
      email: profile.email,
      phone: profile.phone ?? '',
      bio: profile.bio ?? '',
    })
    setPhoto(profile.profileImageUrl ?? undefined)
    setPhotoKey(profile.profileImageKey ?? null)
  }, [profile, reset])

  // Preview the avatar against what's typed right now, so the initials update
  // as the name does rather than only after saving.
  const typedName = watch('name')

  const pickPhoto = async (file: File) => {
    setPhotoError(null)
    try {
      const uploaded = await uploadMut.mutateAsync(file)
      setPhoto(uploaded.url)
      setPhotoKey(uploaded.key)
    } catch (error) {
      setPhotoError(apiErrorMessage(error))
    }
  }

  const onSubmit = (values: ProfileForm) => {
    updateMut.mutate(
      {
        name: values.name,
        email: values.email,
        phone: values.phone.trim() || null,
        bio: values.bio.trim() || null,
        profileImageKey: photoKey,
        profileImageUrl: photo ?? null,
      },
      {
        onSuccess: (updated) => {
          // Sync the app-shell chip (name / initials / avatar) from the server's
          // canonical response.
          updateProfile({
            ...activeProfile,
            name: updated.name,
            email: updated.email,
            phone: updated.phone ?? undefined,
            bio: updated.bio ?? undefined,
            initials: updated.initials,
            color: updated.color,
            photo: updated.profileImageUrl ?? undefined,
          })
          setSaved(false)
          requestAnimationFrame(() => setSaved(true))
          clearTimeout(savedTimer.current)
          savedTimer.current = setTimeout(() => setSaved(false), 1800)
          showToast('Profile updated')
        },
      },
    )
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

              {profileQuery.isPending ? (
                <div className="diet-sheet-loading" aria-busy="true">
                  <span className="skel skel-wide" />
                  <span className="skel" />
                  <span className="skel" />
                  <span className="skel skel-narrow" />
                </div>
              ) : profileQuery.isError ? (
                <div className="clients-empty is-error" role="alert">
                  <Icon name="alert-triangle" />
                  <p>{apiErrorMessage(profileQuery.error)}</p>
                  <button
                    className="link-btn clients-empty-retry"
                    onClick={() => profileQuery.refetch()}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="settings-avatar-row">
                    <Avatar
                      initials={getInitials(typedName, '??')}
                      color={activeProfile.color}
                      photo={photo}
                      alt={typedName || activeProfile.name}
                      size="lg"
                    />
                    <div className="settings-avatar-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={uploadMut.isPending}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <Icon name="upload" />
                        {uploadMut.isPending
                          ? 'Uploading…'
                          : photo
                            ? 'Change photo'
                            : 'Upload photo'}
                      </button>
                      {photo ? (
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => {
                            setPhoto(undefined)
                            setPhotoKey(null)
                            setPhotoError(null)
                            if (photoInputRef.current)
                              photoInputRef.current.value = ''
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                      <p className="settings-hint">
                        JPG, PNG or WebP, up to 5 MB.
                      </p>
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
                      disabled={updateMut.isPending}
                      onClick={handleSubmit(onSubmit)}
                    >
                      {updateMut.isPending ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
