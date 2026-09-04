// Settings › Profile service — the signed-in nutritionist's own profile and the
// image upload behind it. See docs/api-guidelines.md.
import { get, put, upload } from '@/lib/api/client'
import type {
  StaffProfile,
  UpdateStaffProfileBody,
  UploadedFile,
} from './settings.types'

/** `GET /me/settings/profile` — the signed-in nutritionist's profile. */
export async function getStaffProfile(
  signal?: AbortSignal,
): Promise<StaffProfile> {
  return get<StaffProfile>('/me/settings/profile', { signal })
}

/** `PUT /me/settings/profile` — save the edited profile. */
export async function updateStaffProfile(
  body: UpdateStaffProfileBody,
): Promise<StaffProfile> {
  return put<StaffProfile>('/me/settings/profile', body)
}

/** `POST /uploads` — upload a profile photo (multipart). Returns the S3 URL +
 *  key; the key is what the profile save persists. */
export async function uploadProfileImage(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  form.append('purpose', 'nutritionist_profile')
  return upload<UploadedFile>('/uploads', form)
}
