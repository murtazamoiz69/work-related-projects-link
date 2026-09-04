// Settings › Profile API contracts (nutritionist portal). No date fields, so the
// wire and domain shapes are identical.

export type StaffProfile = {
  id: string
  displayId: string | null
  name: string
  role: string
  email: string
  phone: string | null
  bio: string | null
  initials: string
  color: string
  profileImageUrl: string | null
  profileImageKey: string | null
}

export type UpdateStaffProfileBody = {
  name: string
  email: string
  phone: string | null
  bio: string | null
  profileImageKey: string | null
  profileImageUrl: string | null
}

/** Result of POST /uploads. */
export type UploadedFile = {
  url: string
  key: string
  fileName: string
  contentType: string
  sizeBytes: number
  purpose: string
}
