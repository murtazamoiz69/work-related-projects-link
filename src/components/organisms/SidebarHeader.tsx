/** Logo mark, always centered on the collapsed rail; brand text fades in
 *  with the rest of the panel — the sidebar itself expands on hover/focus,
 *  there's no separate collapse control. */
export function SidebarHeader() {
  return (
    <div className="sidebar-header">
      <div className="sidebar-logo">N</div>
      <div className="sidebar-brand-text sidebar-label">
        <span className="sidebar-brand-name">Nourish</span>
        <span className="sidebar-brand-sub">with Nourish AI</span>
      </div>
    </div>
  )
}
