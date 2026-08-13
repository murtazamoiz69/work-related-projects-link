type ToggleSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
  disabled?: boolean
}

/** The `.toggle-switch` atom, extracted from SettingsPage's inline markup. */
export function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
  disabled,
}: ToggleSwitchProps) {
  return (
    <span className="toggle-switch">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" />
    </span>
  )
}
