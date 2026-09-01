type BadgeProps = {
  value: string
  className?: string
}

/** Small numeric/text pill — the sidebar's unread/count indicator. */
export function Badge({ value, className }: BadgeProps) {
  const classes = ['nav-badge', className ?? ''].filter(Boolean).join(' ')
  return <span className={classes}>{value}</span>
}
