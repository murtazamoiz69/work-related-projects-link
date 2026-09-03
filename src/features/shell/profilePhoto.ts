// Turns a picked image file into a small square data URL for the profile
// avatar.
//
// Why downscale rather than store the file as-is: the active profile is
// persisted to sessionStorage, which is capped at ~5 MB of *string* — and
// base64 inflates bytes by a third, so a single phone photo would blow the
// quota and take the whole profile with it. The avatar never renders larger
// than 64px, so a 256px JPEG is already more than it can show.

const MAX_BYTES = 5 * 1024 * 1024
const OUTPUT_PX = 256
const JPEG_QUALITY = 0.85
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(new Error('That file could not be read as an image.'))
    img.src = src
  })
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('That file could not be read.'))
    reader.readAsDataURL(file)
  })
}

/** Validate, centre-crop to a square and downscale. Rejects with a
 *  user-facing message; callers surface it next to the upload control. */
export async function readProfilePhoto(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP image.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('That image is over 5 MB. Choose a smaller one.')
  }

  const source = await readAsDataUrl(file)
  const img = await loadImage(source)

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_PX
  canvas.height = OUTPUT_PX
  const ctx = canvas.getContext('2d')
  // No canvas in this environment (jsdom, a locked-down browser) — the
  // original still displays correctly, it just isn't shrunk.
  if (!ctx) return source

  // Centre-crop the longer edge so the face isn't squashed into the circle.
  const side = Math.min(img.width, img.height)
  ctx.drawImage(
    img,
    (img.width - side) / 2,
    (img.height - side) / 2,
    side,
    side,
    0,
    0,
    OUTPUT_PX,
    OUTPUT_PX,
  )
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}
