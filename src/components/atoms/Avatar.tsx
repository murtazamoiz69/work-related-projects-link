type AvatarProps = {
  initials: string
  color: string
  size?: 'xs' | 'sm' | 'lg'
  className?: string
}

/** Initials on a colored circle — the `.avatar` atom from V2. */
export function Avatar({ initials, color, size, className }: AvatarProps) {
  const classes = ['avatar', size ? `avatar-${size}` : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} style={{ background: color }}>
      {initials}
    </span>
  )
}
