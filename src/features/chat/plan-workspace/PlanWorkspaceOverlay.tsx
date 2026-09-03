import { useEffect, useReducer, useState, type ReactNode } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { STATUS_LABEL, formatJoinDate } from '@/features/clients'
import type { Client } from '@/features/clients'
import {
  useClientDetailQuery,
  NotesTab,
  CurrentProgramLabel,
  ProgramTrackerDashboard,
} from '@/features/client-detail'
import { useConversationQuery } from '../hooks/useConversations'
import { ActivityFilterBar } from '../components/ActivityFilterBar'
import { ActivityLogList } from '../components/ActivityLogList'
import { useActivityFilters } from '../hooks/useActivityFilters'
import { apiErrorMessage } from '@/lib/api/errors'
import { usePlanQuery, useSavePlan } from './hooks/usePlan'
import { addDays } from './schedule'
import { getDay, getWorkoutRef } from './context'
import type { PwConfirm, PwCtx, PwModal } from './context'
import { PwContext } from './components/PwContext'
import { WorkoutTab } from './components/WorkoutTab'
import { ClientDietPlanTab } from '@/features/programs/diet/components/ClientDietPlanTab'
import { PROGRAM_DURATION_WEEKS } from '@/features/programs'
import { WorkoutTemplatePickerModal } from './components/modals/WorkoutTemplatePickerModal'
import { WorkoutEditorModal } from './components/modals/WorkoutEditorModal'
import { WorkoutPreviewModal } from './components/modals/WorkoutPreviewModal'
import { EditPlanModal } from './components/modals/EditPlanModal'
import { PublishReportModal } from './components/modals/PublishReportModal'
import type { ClinicalProfile, Workspace } from './types'

type PwTab = 'glance' | 'workout' | 'diet' | 'activity' | 'notes'

const PW_TABS: ReadonlyArray<{ key: PwTab; icon: string; label: string }> = [
  { key: 'glance', icon: 'layout-dashboard', label: 'At a glance' },
  { key: 'workout', icon: 'dumbbell', label: 'Workout Plan' },
  { key: 'diet', icon: 'utensils', label: 'Diet Plan' },
  { key: 'activity', icon: 'activity', label: 'Activity' },
  { key: 'notes', icon: 'notebook-text', label: 'Notes' },
]

export function PlanWorkspaceOverlay({
  client,
  onClose,
}: {
  client: Client
  onClose: () => void
}) {
  // The plan workspace is loaded from the API and then edited IN PLACE by the
  // tabs/modals (unchanged); refresh() persists it (below).
  const planQuery = usePlanQuery(client.id)
  const savePlan = useSavePlan(client.id)
  // The narrative half of the profile — AI summary, programs — served by the
  // client-detail API (derived server-side), not the plan.
  const detailQuery = useClientDetailQuery(client.id)
  const detail = detailQuery.data

  const [activeTab, setActiveTab] = useState<PwTab>('glance')
  const [activeWeekOverride, setActiveWeekOverride] = useState<number | null>(
    null,
  )
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['profile', 'medical']),
  )
  const [modal, setModal] = useState<PwModal | null>(null)
  const [confirm, setConfirm] = useState<PwConfirm | null>(null)
  const [, bump] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    document.body.classList.add('pw-open')
    return () => document.body.classList.remove('pw-open')
  }, [])

  // The "Back to conversation" button is gone, so Escape is now the primary
  // way out (the topbar close button is the visible one). Guarded on the
  // modal state so Escape dismisses a picker before it closes the workspace.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('.modal-overlay, .pw-modal-overlay')) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Activity + its filter hook must run unconditionally, before the loading
  // guard below. Activity comes from the client's conversation (the API).
  const convoQuery = useConversationQuery(client.conversationId)
  const activityItems = convoQuery.data?.activity ?? []
  const activityFirstName = client.name.split(' ')[0]
  const activityFilters = useActivityFilters(activityItems, activityFirstName)

  const ws = planQuery.data
  if (planQuery.isPending || !ws || detailQuery.isPending || !detail) {
    return (
      <div className="pw-overlay" id="planWorkspaceOverlay">
        <div className="pw-shell">
          <PwStatus
            onClose={onClose}
            busy={planQuery.isPending || detailQuery.isPending}
            message={
              planQuery.isError
                ? apiErrorMessage(planQuery.error)
                : detailQuery.isError
                  ? apiErrorMessage(detailQuery.error)
                  : 'Loading plan…'
            }
            onRetry={
              planQuery.isError
                ? () => void planQuery.refetch()
                : detailQuery.isError
                  ? () => void detailQuery.refetch()
                  : undefined
            }
          />
        </div>
      </div>
    )
  }

  const profile = ws.profile
  // Autosave: re-render now (the edit is already applied in place), then persist
  // the whole workspace. The cache object identity is preserved (savePlan does
  // not write back), so open editor modals holding refs into `ws` stay valid.
  const refresh = () => {
    bump()
    savePlan.mutate(ws)
  }

  const totalWeeks = ws.workoutWeeks.length
  const currentWeek = Math.min(Math.max(profile.currentWeek, 1), totalWeeks)
  const weekExists = (n: number | null): boolean =>
    n != null && ws.workoutWeeks.some((w) => w.weekNum === n)
  const activeWeek = weekExists(activeWeekOverride)
    ? (activeWeekOverride as number)
    : currentWeek

  const activitySubtitle = activityFilters.filterActive
    ? `${activityFilters.filtered.length} of ${activityFilters.total} ${activityFilters.total === 1 ? 'entry' : 'entries'}`
    : `${activityFilters.total} ${activityFilters.total === 1 ? 'entry' : 'entries'} logged for ${activityFirstName}, newest first`

  const ctx: PwCtx = {
    profile,
    ws,
    activeWeek,
    setActiveWeek: setActiveWeekOverride,
    currentWeek,
    refresh,
    openModal: setModal,
    confirm: setConfirm,
  }

  const closeModal = () => setModal(null)

  return (
    <div className="pw-overlay" id="planWorkspaceOverlay">
      <div className="pw-shell">
        <PwTopbar
          profile={profile}
          ws={ws}
          onClose={onClose}
          programLabel={
            // Only on At a glance — the other tabs show the current plan
            // regardless, so the label would be out of place there.
            activeTab === 'glance' ? (
              <CurrentProgramLabel program={detail.programs[0]} />
            ) : null
          }
        />
        <div className="pw-body">
          <aside className="pw-context" id="pwContext">
            <PwContext
              profile={profile}
              detail={detail}
              goals={client.goals}
              openSections={openSections}
              onToggle={(key) =>
                setOpenSections((prev) => {
                  const next = new Set(prev)
                  if (next.has(key)) next.delete(key)
                  else next.add(key)
                  return next
                })
              }
            />
          </aside>
          <section className="pw-center" id="pwCenter">
            <div className="pw-tabs" role="tablist">
              {PW_TABS.map((t) => (
                <button
                  key={t.key}
                  className={`pw-tab${activeTab === t.key ? ' active' : ''}`}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  onClick={() => setActiveTab(t.key)}
                >
                  <Icon name={t.icon} />
                  {t.label}
                </button>
              ))}
              {activeTab === 'workout' ? (
                <span className="pw-plan-duration">
                  <Icon name="calendar-range" />
                  {ws.workoutWeeks.length} weeks · ~{ws.workoutWeeks.length * 7}{' '}
                  days
                </span>
              ) : null}
            </div>
            <div className="pw-tab-body" id="pwTabBody">
              {activeTab === 'glance' ? (
                <div className="pw-panel-scroll">
                  <ProgramTrackerDashboard
                    client={client}
                    detail={detail}
                    activity={activityItems}
                    hideSwitcher
                  />
                </div>
              ) : null}
              {activeTab === 'workout' ? <WorkoutTab ctx={ctx} /> : null}
              {activeTab === 'diet' ? (
                <div className="pw-panel-scroll">
                  {/* The diet plan is authored per programme week, and the
                      programme runs six. The workout workspace still carries
                      its own longer week list, so bound the diet tab to the
                      programme rather than inheriting that count. */}
                  <ClientDietPlanTab
                    client={client}
                    totalWeeks={PROGRAM_DURATION_WEEKS}
                    activeWeek={Math.min(
                      Math.max(activeWeek, 1),
                      PROGRAM_DURATION_WEEKS,
                    )}
                    setActiveWeek={setActiveWeekOverride}
                  />
                </div>
              ) : null}
              {activeTab === 'activity' ? (
                <div className="pw-panel-scroll">
                  <section className="panel">
                    <div className="panel-head">
                      <div>
                        <h2>
                          <Icon name="activity" className="inline-icon" />{' '}
                          Activity
                        </h2>
                        <p className="panel-sub">{activitySubtitle}</p>
                      </div>
                      {/* Same placement as the Dashboard's Catch Up search:
                          opposite the title, centred on that block, rather
                          than sharing a row with the chips below. The date
                          range now lives down in that row instead, aligned
                          to the right of the chips it actually filters. */}
                      <div className="clients-search activity-head-search">
                        <Icon name="search" />
                        <input
                          type="text"
                          placeholder="Search activity…"
                          autoComplete="off"
                          value={activityFilters.search}
                          onChange={(e) =>
                            activityFilters.setSearch(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <ActivityFilterBar
                      items={activityItems}
                      activeKinds={activityFilters.activeKinds}
                      isKindActive={activityFilters.isKindActive}
                      onToggleKind={activityFilters.toggleKind}
                      onClearAll={activityFilters.clearAll}
                      categoriesByKind={activityFilters.categoriesByKind}
                      onToggleCategory={activityFilters.toggleCategory}
                      onClearCategories={activityFilters.clearCategories}
                      search={activityFilters.search}
                      rangeDays={activityFilters.rangeDays}
                      onRangeChange={activityFilters.setRangeDays}
                    />
                    {/* Same wrapper the Chat modal uses around this list — the
                        sticky day header's IntersectionObserver looks for an
                        ".activity-log-body" ancestor to know when it's resting,
                        so without it the header's shadow never turns off. */}
                    <div className="activity-tab-panel">
                      <div className="activity-log-body">
                        <ActivityLogList
                          items={activityFilters.filtered}
                          emptyMessage={activityFilters.emptyMessage}
                        />
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}
              {activeTab === 'notes' ? (
                <div className="pw-panel-scroll">
                  <NotesTab
                    notes={ws.notes}
                    onAdd={(note) => {
                      // Persist with the plan: mutate in place + autosave,
                      // the same pattern as every other workspace edit.
                      ws.notes = [note, ...ws.notes]
                      refresh()
                    }}
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <PwModals
        ws={ws}
        profile={profile}
        modal={modal}
        refresh={refresh}
        confirm={setConfirm}
        onClose={closeModal}
      />

      {/* One dialog instance for the whole workspace — every destructive or
          structural edit routes through ctx.confirm rather than each tab
          owning its own dialog state. */}
      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          note={`${profile.name} sees this plan live, so the change applies as soon as you confirm.`}
          confirmText={confirm.confirmText}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      ) : null}
    </div>
  )
}

/** Loading / error state shown inside the workspace shell while the plan
 *  loads (or if it fails), with a close button so the user is never trapped. */
function PwStatus({
  onClose,
  message,
  busy,
  onRetry,
}: {
  onClose: () => void
  message: string
  busy?: boolean
  onRetry?: () => void
}) {
  return (
    <div
      className="pw-status"
      aria-busy={busy || undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 48,
        minHeight: 240,
      }}
    >
      <p className="pw-muted">{message}</p>
      {onRetry ? (
        <button className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
      <button
        className="icon-btn sm pw-topbar-close"
        onClick={onClose}
        title="Close workspace (Esc)"
        aria-label="Close Plan Workspace and return to the conversation"
      >
        <Icon name="x" />
      </button>
    </div>
  )
}

/** The header IS the program card now: name, dates, progress, close. The plan
 *  is what this surface is about, so it identifies the surface — there is no
 *  separate title bar above it. */
function PwTopbar({
  profile,
  ws,
  onClose,
  programLabel,
}: {
  profile: ClinicalProfile
  ws: Workspace
  onClose: () => void
  /** Rendered at the far right, beside the close button. */
  programLabel?: ReactNode
}) {
  const totalWeeks = ws.workoutWeeks.length
  const totalDays = totalWeeks * 7
  const currentWeekClamped = Math.min(
    Math.max(profile.currentWeek, 1),
    totalWeeks,
  )
  return (
    <header className="pw-topbar">
      {/* The client is the header, not the plan. This used to name the plan
          ("Post-Surgery Recovery Nutrition") while the context rail named the
          client directly underneath — two headings for one screen. The plan's
          own dates survive on the client's detail line. */}
      <Avatar initials={profile.initials} color={profile.color} />
      <div className="pw-program-main">
        <h2 className="pw-program-name">{profile.name}</h2>
        <p className="pw-program-sub">
          {profile.program} · Week {currentWeekClamped} ·{' '}
          {formatJoinDate(profile.programStart)} –{' '}
          {formatJoinDate(addDays(profile.programStart, totalDays))}
          <span className={`status-pill status-${profile.status}`}>
            {STATUS_LABEL[profile.status]}
          </span>
        </p>
      </div>
      <div className="pw-topbar-actions">
        {programLabel}
        {/* Escape does the same thing; this is the visible way out now that
            "Back to conversation" is gone. */}
        <button
          className="icon-btn sm pw-topbar-close"
          onClick={onClose}
          title="Close workspace (Esc)"
          aria-label="Close Plan Workspace and return to the conversation"
        >
          <Icon name="x" />
        </button>
      </div>
    </header>
  )
}

function PwModals({
  ws,
  profile,
  modal,
  refresh,
  confirm,
  onClose,
}: {
  ws: Workspace
  profile: ClinicalProfile
  modal: PwModal | null
  refresh: () => void
  confirm: (c: PwConfirm) => void
  onClose: () => void
}) {
  if (!modal) return null
  switch (modal.kind) {
    case 'workoutTemplatePicker':
      return (
        <WorkoutTemplatePickerModal
          ws={ws}
          profile={profile}
          weekNum={modal.weekNum}
          dayNum={modal.dayNum}
          refresh={refresh}
          onClose={onClose}
        />
      )
    case 'workoutEditor':
      return (
        <WorkoutEditorModal
          ws={ws}
          profile={profile}
          weekNum={modal.weekNum}
          dayNum={modal.dayNum}
          wid={modal.wid}
          refresh={refresh}
          onClose={onClose}
        />
      )
    case 'workoutPreview': {
      const wk = getWorkoutRef(ws, modal.weekNum, modal.dayNum, modal.wid)
      const day = getDay(ws, modal.weekNum, modal.dayNum)
      if (!wk || !day) return null
      return (
        <WorkoutPreviewModal
          profile={profile}
          workout={wk}
          title={`${wk.name} · ${day.label}, Week ${modal.weekNum}`}
          onClose={onClose}
        />
      )
    }
    case 'editPlan':
      return (
        <EditPlanModal
          ws={ws}
          profile={profile}
          refresh={refresh}
          confirm={confirm}
          onClose={onClose}
        />
      )
    case 'publish':
      return (
        <PublishReportModal
          ws={ws}
          profile={profile}
          refresh={refresh}
          onClose={onClose}
        />
      )
    default:
      return null
  }
}
