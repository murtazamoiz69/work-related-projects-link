import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { showToast } from '@/lib/toast'
import { STATUS_LABEL, formatJoinDate } from '@/features/clients'
import type { Client } from '@/features/clients'
import {
  deriveDetail,
  NotesTab,
  CurrentProgramLabel,
  ProgramTrackerDashboard,
  SavedTab,
  type InternalNote,
} from '@/features/client-detail'
import {
  AddFromLibraryDrawer,
  buildMealTemplate,
  SaveTemplateModal,
  useMealTemplatesStore,
} from '@/features/meal-templates'
import { CONVERSATIONS } from '../data'
import { ActivityFilterBar } from '../components/ActivityFilterBar'
import { ActivityLogList } from '../components/ActivityLogList'
import { useActivityFilters } from '../hooks/useActivityFilters'
import { deriveClinicalProfile } from './clinical'
import {
  applyMealTemplateToDay,
  applyMealTemplateToWeek,
  extractWeekAsTemplateDays,
  getWorkspace,
  resolveMeal,
} from './plan'
import { addDays } from './schedule'
import { getDay, getWorkoutRef } from './context'
import type { PwConfirm, PwCtx, PwModal } from './context'
import { PwContext } from './components/PwContext'
import { WorkoutTab } from './components/WorkoutTab'
import { DietTab } from './components/DietTab'
import { MealPickerModal } from './components/modals/MealPickerModal'
import { WorkoutTemplatePickerModal } from './components/modals/WorkoutTemplatePickerModal'
import { WorkoutEditorModal } from './components/modals/WorkoutEditorModal'
import { WorkoutPreviewModal } from './components/modals/WorkoutPreviewModal'
import { EditPlanModal } from './components/modals/EditPlanModal'
import { PublishReportModal } from './components/modals/PublishReportModal'
import { SaveWeekTemplateModal } from './components/modals/SaveWeekTemplateModal'
import type { ClinicalProfile, Workspace } from './types'

type PwTab = 'glance' | 'workout' | 'diet' | 'activity' | 'notes' | 'saved'

const PW_TABS: ReadonlyArray<{ key: PwTab; icon: string; label: string }> = [
  { key: 'glance', icon: 'layout-dashboard', label: 'At a glance' },
  { key: 'workout', icon: 'dumbbell', label: 'Workout Plan' },
  { key: 'diet', icon: 'utensils', label: 'Diet Plan' },
  { key: 'activity', icon: 'activity', label: 'Activity' },
  { key: 'notes', icon: 'notebook-text', label: 'Notes' },
  { key: 'saved', icon: 'bookmark', label: 'Saved' },
]

export function PlanWorkspaceOverlay({
  client,
  onClose,
}: {
  client: Client
  onClose: () => void
}) {
  // getWorkspace caches per client (mutated in place across opens), so the
  // profile it stores is the source of truth once built.
  const ws = useMemo<Workspace>(
    () => getWorkspace(client, deriveClinicalProfile(client)),
    [client],
  )
  const profile = ws.profile
  // The narrative half of the profile — AI summary, notes, saved items — which
  // the workspace now owns outright since there is no separate profile view.
  const detail = useMemo(() => deriveDetail(client), [client])

  const [activeTab, setActiveTab] = useState<PwTab>('glance')
  const [activeWeekOverride, setActiveWeekOverride] = useState<number | null>(
    null,
  )
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['profile', 'medical']),
  )
  const [notes, setNotes] = useState<InternalNote[]>(detail.notes)
  const [modal, setModal] = useState<PwModal | null>(null)
  const [confirm, setConfirm] = useState<PwConfirm | null>(null)
  const [, refresh] = useReducer((x: number) => x + 1, 0)

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

  const totalWeeks = ws.workoutWeeks.length
  const currentWeek = Math.min(Math.max(profile.currentWeek, 1), totalWeeks)
  const weekExists = (n: number | null): boolean =>
    n != null && ws.workoutWeeks.some((w) => w.weekNum === n)
  const activeWeek = weekExists(activeWeekOverride)
    ? (activeWeekOverride as number)
    : currentWeek

  // Read on each render rather than memoised: saving happens in the chat thread
  // and mutates the same CONVERSATIONS entry, so the badge — and the Activity
  // action below — has to reflect whatever the array holds at render time.
  const convo = CONVERSATIONS.find((c) => c.client.id === client.id)
  const savedCount = convo?.saved.length ?? 0
  const activityItems = convo?.activity ?? []
  const activityFirstName = client.name.split(' ')[0]
  const activityFilters = useActivityFilters(activityItems, activityFirstName)
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
                  {t.key === 'saved' && savedCount ? (
                    <span className="pw-tab-count">{savedCount}</span>
                  ) : null}
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
                    hideSwitcher
                  />
                </div>
              ) : null}
              {activeTab === 'workout' ? <WorkoutTab ctx={ctx} /> : null}
              {activeTab === 'diet' ? <DietTab ctx={ctx} /> : null}
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
                    notes={notes}
                    onAdd={(note) => setNotes((prev) => [note, ...prev])}
                  />
                </div>
              ) : null}
              {activeTab === 'saved' ? (
                <div className="pw-panel-scroll">
                  <SavedTab client={client} onChange={refresh} />
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
    case 'mealPicker':
      return (
        <MealPickerModal
          ws={ws}
          profile={profile}
          weekNum={modal.weekNum}
          dayNum={modal.dayNum}
          entryUid={modal.entryUid}
          enforceUpcoming={modal.enforceUpcoming}
          refresh={refresh}
          onClose={onClose}
        />
      )
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
    case 'librarySaveWeek':
      return (
        <SaveWeekTemplateModal
          ws={ws}
          weekNum={modal.weekNum}
          onClose={onClose}
        />
      )
    case 'librarySaveDay': {
      const { weekNum, dayNum } = modal
      return (
        <SaveTemplateModal
          dayCount={1}
          onClose={onClose}
          onSave={(name) => {
            const days = extractWeekAsTemplateDays(
              ws,
              weekNum,
              new Set([dayNum]),
            )
            if (!days.length) {
              onClose()
              return
            }
            const template = buildMealTemplate(name, 'Sarah Nolan', days, 'day')
            useMealTemplatesStore
              .getState()
              .setTemplates((prev) => [template, ...prev])
            showToast('✅ Meal template saved successfully.')
            onClose()
          }}
        />
      )
    }
    case 'libraryImportWeek': {
      const weekNum = modal.weekNum
      const week = ws.dietWeeks.find((w) => w.weekNum === weekNum)
      const hasConflict = week
        ? week.days.some((d) => d.meals.length > 0)
        : false
      return (
        <AddFromLibraryDrawer
          onClose={onClose}
          templateType="week"
          hasConflict={hasConflict}
          resolveMealName={(mealId) =>
            resolveMeal(ws, mealId)?.name ?? 'Unknown meal'
          }
          onUse={(template) => {
            applyMealTemplateToWeek(ws, weekNum, template)
            refresh()
            showToast(`Applied "${template.name}" to Week ${weekNum}`)
          }}
        />
      )
    }
    case 'libraryImportDay': {
      const { weekNum, dayNum } = modal
      const week = ws.dietWeeks.find((w) => w.weekNum === weekNum)
      const day = week?.days.find((d) => d.dayNum === dayNum)
      const hasConflict = day ? day.meals.length > 0 : false
      return (
        <AddFromLibraryDrawer
          onClose={onClose}
          templateType="day"
          hasConflict={hasConflict}
          resolveMealName={(mealId) =>
            resolveMeal(ws, mealId)?.name ?? 'Unknown meal'
          }
          onUse={(template) => {
            applyMealTemplateToDay(ws, weekNum, dayNum, template)
            refresh()
            showToast(`Applied "${template.name}"`)
          }}
        />
      )
    }
    default:
      return null
  }
}
