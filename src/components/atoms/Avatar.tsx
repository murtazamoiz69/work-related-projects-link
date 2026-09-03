type AvatarProps = {
  initials: string
  color: string
  size?: 'xs' | 'sm' | 'lg'
  className?: string
  /** Profile photo (data URL or src). Replaces the initials when present;
   *  the colored circle stays underneath as the loading/fallback ground. */
  photo?: string
  /** Describes the photo. Falls back to the initials, which are meaningless
   *  to a screen reader on their own. */
  alt?: string
}

/** Initials on a colored circle — the `.avatar` atom from V2 — or the person's
 *  uploaded photo once they have one. */
export function Avatar({
  initials,
  color,
  size,
  className,
  photo,
  alt,
}: AvatarProps) {
  const classes = [
    'avatar',
    size ? `avatar-${size}` : '',
    photo ? 'avatar-photo' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} style={{ background: color }}>
      {photo ? <img src={photo} alt={alt ?? ''} /> : initials}
    </span>
  )
}
