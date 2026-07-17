import { useEffect, useMemo, useReducer, useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Icon } from '@/components/atoms/Icon'
import { STATUS_LABEL, formatJoinDate } from '@/features/clients'
import type { Client } from '@/features/clients'
import { deriveClinicalProfile } from './clinical'
import { getWorkspace, validatePlan } from './plan'
import { addDays } from './schedule'
import { getDay, getWorkoutRef } from './context'
import type { PwCtx, PwModal } from './context'
import { PwContext } from './components/PwContext'
import { TimelineTab } from './components/TimelineTab'
import { WorkoutTab } from './components/WorkoutTab'
import { DietTab } from './components/DietTab'
import { MealPickerModal } from './components/modals/MealPickerModal'
import { WorkoutTemplatePickerModal } from './components/modals/WorkoutTemplatePickerModal'
import { WorkoutEditorModal } from './components/modals/WorkoutEditorModal'
import { WorkoutPreviewModal } from './components/modals/WorkoutPreviewModal'
import { TimelineAddChooser } from './components/modals/TimelineAddChooser'
import { TimelineTimeEditModal } from './components/modals/TimelineTimeEditModal'
import { EditPlanModal } from './components/modals/EditPlanModal'
import { PublishReportModal } from './components/modals/PublishReportModal'
import type { ClinicalProfile, Workspace } from './types'

type PwTab = 'timeline' | 'workout' | 'diet'

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

  const [activeTab, setActiveTab] = useState<PwTab>('timeline')
  const [activeWeekOverride, setActiveWeekOverride] = useState<number | null>(null)
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['profile', 'medical']),
  )
  const [modal, setModal] = useState<PwModal | null>(null)
  const [, refresh] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    document.body.classList.add('pw-open')
    return () => document.body.classList.remove('pw-open')
  }, [])

  const totalWeeks = ws.workoutWeeks.length
  const currentWeek = Math.min(Math.max(profile.currentWeek, 1), totalWeeks)
  const weekExists = (n: number | null): boolean =>
    n != null && ws.workoutWeeks.some((w) => w.weekNum === n)
  const activeWeek = weekExists(activeWeekOverride) ? (activeWeekOverride as number) : currentWeek

  const ctx: PwCtx = {
    profile,
    ws,
    activeWeek,
    setActiveWeek: setActiveWeekOverride,
    currentWeek,
    refresh,
    openModal: setModal,
  }

  const closeModal = () => setModal(null)

  return (
    <div className="pw-overlay" id="planWorkspaceOverlay">
      <div className="pw-shell">
        <PwTopbar profile={profile} ws={ws} onClose={onClose} onPublish={() => setModal({ kind: 'publish' })} />
        <div className="pw-body">
          <aside className="pw-context" id="pwContext">
            <PwContext
              profile={profile}
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
            <ProgramHeader profile={profile} ws={ws} onEdit={() => setModal({ kind: 'editPlan' })} />
            <div className="pw-tabs">
              <button
                className={`pw-tab${activeTab === 'timeline' ? ' active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                <Icon name="calendar-clock" />
                Timeline
              </button>
              <button
                className={`pw-tab${activeTab === 'workout' ? ' active' : ''}`}
                onClick={() => setActiveTab('workout')}
              >
                <Icon name="dumbbell" />
                Workout Plan
              </button>
              <button
                className={`pw-tab${activeTab === 'diet' ? ' active' : ''}`}
                onClick={() => setActiveTab('diet')}
              >
                <Icon name="utensils" />
                Diet Plan
              </button>
              {activeTab === 'diet' ? (
                <div className="pw-target-pills">
                  <span className="pw-target-pill">{ws.targets.calories} kcal</span>
                  <span className="pw-target-pill">{ws.targets.protein}g protein</span>
                  <span className="pw-target-pill">
                    <Icon name="droplet" />
                    {ws.hydrationGoal} L water
                  </span>
                </div>
              ) : (
                <span className="pw-plan-duration">
                  <Icon name="calendar-range" />
                  {ws.workoutWeeks.length} weeks · ~{ws.workoutWeeks.length * 7} days
                </span>
              )}
            </div>
            <div className="pw-tab-body" id="pwTabBody">
              {activeTab === 'diet' ? (
                <DietTab ctx={ctx} />
              ) : activeTab === 'timeline' ? (
                <TimelineTab ctx={ctx} />
              ) : (
                <WorkoutTab ctx={ctx} />
              )}
            </div>
          </section>
        </div>
      </div>

      <PwModals ws={ws} profile={profile} modal={modal} setModal={setModal} refresh={refresh} onClose={closeModal} />
    </div>
  )
}

function PwTopbar({
  profile,
  ws,
  onClose,
  onPublish,
}: {
  profile: ClinicalProfile
  ws: Workspace
  onClose: () => void
  onPublish: () => void
}) {
  const warnings = validatePlan(profile, ws)
  const hard = warnings.filter((w) => w.level === 'hard').length
  const total = warnings.length
  return (
    <header className="pw-topbar">
      <button className="pw-back" onClick={onClose}>
        <Icon name="arrow-left" />
        Back to conversation
      </button>
      <div className="pw-topbar-id">
        <Avatar initials={profile.initials} color={profile.color} size="sm" />
        <div className="pw-topbar-meta">
          <span className="pw-topbar-name">{profile.name} · Plan Workspace</span>
          <span className="pw-topbar-sub">
            {profile.program} · Week {profile.currentWeek} ·{' '}
            <span className={`status-pill status-${profile.status}`}>
              {STATUS_LABEL[profile.status]}
            </span>
          </span>
        </div>
      </div>
      <div className="pw-topbar-actions">
        {hard ? (
          <button className="pw-guard-pill danger" onClick={onPublish}>
            <Icon name="shield-alert" />
            {hard} blocking
          </button>
        ) : total ? (
          <button className="pw-guard-pill warn" onClick={onPublish}>
            <Icon name="shield" />
            {total} warning{total > 1 ? 's' : ''}
          </button>
        ) : (
          <button className="pw-guard-pill ok" onClick={onPublish}>
            <Icon name="shield-check" />
            All clear
          </button>
        )}
        <button className="btn-primary sm" onClick={onPublish}>
          <Icon name="send" />
          Publish to Client
        </button>
      </div>
    </header>
  )
}

function ProgramHeader({
  profile,
  ws,
  onEdit,
}: {
  profile: ClinicalProfile
  ws: Workspace
  onEdit: () => void
}) {
  const totalWeeks = ws.workoutWeeks.length
  const totalDays = totalWeeks * 7
  const elapsedDays = Math.min(profile.tenureDays, totalDays)
  const currentWeekClamped = Math.min(Math.max(profile.currentWeek, 1), totalWeeks)
  const pct = totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 0
  return (
    <div className="pw-program-card">
      <span className="pw-program-icon">
        <Icon name="clipboard-list" />
      </span>
      <div className="pw-program-main">
        <span className="pw-program-name">{ws.planName}</span>
        <span className="pw-program-sub">
          {profile.program} · {formatJoinDate(profile.programStart)} –{' '}
          {formatJoinDate(addDays(profile.programStart, totalDays))}
          {ws.planDescription ? ` · ${ws.planDescription}` : ''}
        </span>
      </div>
      <div className="pw-program-progress">
        <span className="pw-program-progress-label">
          Week {currentWeekClamped} of {totalWeeks}{' '}
          <span className="pw-program-progress-days">
            {elapsedDays} / {totalDays} days
          </span>
        </span>
        <div className="pw-program-progress-bar">
          <div className="pw-program-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button className="icon-btn sm pw-program-edit" title="Edit program" onClick={onEdit}>
        <Icon name="pencil" />
      </button>
    </div>
  )
}

function PwModals({
  ws,
  profile,
  modal,
  setModal,
  refresh,
  onClose,
}: {
  ws: Workspace
  profile: ClinicalProfile
  modal: PwModal | null
  setModal: (m: PwModal | null) => void
  refresh: () => void
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
    case 'timelineAddChooser': {
      const day = getDay(ws, modal.weekNum, modal.dayNum)
      if (!day) return null
      const hasSession = !!day.workout || (day.extraWorkouts && day.extraWorkouts.length > 0)
      return (
        <TimelineAddChooser
          dayLabel={day.label}
          weekNum={modal.weekNum}
          hasSession={hasSession}
          onWorkout={() =>
            setModal({ kind: 'workoutTemplatePicker', weekNum: modal.weekNum, dayNum: modal.dayNum })
          }
          onDiet={() =>
            setModal({
              kind: 'mealPicker',
              weekNum: modal.weekNum,
              dayNum: modal.dayNum,
              entryUid: null,
              enforceUpcoming: true,
            })
          }
          onClose={onClose}
        />
      )
    }
    case 'timelineTimeEdit':
      return (
        <TimelineTimeEditModal
          ws={ws}
          profile={profile}
          itemKind={modal.itemKind}
          weekNum={modal.weekNum}
          dayNum={modal.dayNum}
          itemId={modal.itemId}
          refresh={refresh}
          onClose={onClose}
        />
      )
    case 'editPlan':
      return <EditPlanModal ws={ws} profile={profile} refresh={refresh} onClose={onClose} />
    case 'publish':
      return <PublishReportModal ws={ws} profile={profile} refresh={refresh} onClose={onClose} />
    default:
      return null
  }
}
