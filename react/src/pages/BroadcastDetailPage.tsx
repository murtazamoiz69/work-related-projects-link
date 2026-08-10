import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { showToast } from '@/lib/toast'
import { useTemplatesStore } from '@/features/templates'
import {
  AudienceSection,
  BroadcastActionsMenu,
  BroadcastConfirmDialog,
  BroadcastDetailsSection,
  BroadcastPreviewColumn,
  ScheduleSection,
  buildBlankBroadcast,
  clearDraftCache,
  deliverBroadcast,
  loadDraftCache,
  recipientCount,
  repeatUnitLabel,
  saveDraftCache,
  useBroadcastsStore,
} from '@/features/broadcasts'
import type {
  AudienceType,
  Broadcast,
  BroadcastMenuAction,
  RepeatUnit,
  ScheduleMode,
  SendTiming,
} from '@/features/broadcasts'

type Props = {
  broadcastId: string
  initialEdit?: boolean
  newTemplateId?: string
}

type InitialResolution = 'new' | 'existing' | 'resumed' | 'not-found'

export function BroadcastDetailPage({
  broadcastId,
  initialEdit = false,
  newTemplateId,
}: Props) {
  const navigate = useNavigate()
  const templates = useTemplatesStore((s) => s.templates)
  const broadcasts = useBroadcastsStore((s) => s.broadcasts)
  const setBroadcasts = useBroadcastsStore((s) => s.setBroadcasts)
  const commit = useBroadcastsStore((s) => s.commit)
  const rev = useBroadcastsStore((s) => s.rev)

  // Reading `rev` subscribes this page to the store's mutation nonce, so it
  // re-renders after in-place edits (publish now / cancel schedule).
  void rev

  const activeTemplates = useMemo(
    () =>
      [...templates]
        .filter((t) => !t.trashed && t.status !== 'archived')
        .sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime()),
    [templates],
  )

  const storeMatch = broadcasts.find((x) => x.id === broadcastId)

  // Resolved once per mount: a fresh 'new' draft, an existing saved record,
  // a draft resumed from the "Create Template" round trip (see
  // draftCache.ts), or a genuinely missing id. Doing this once (not on every
  // render) matters because the cache gets cleared once consumed below —
  // re-checking it later would flip a resumed draft into "not found".
  const [initial] = useState<{
    resolution: InitialResolution
    draft: Broadcast
  }>(() => {
    if (broadcastId === 'new') {
      return { resolution: 'new', draft: buildBlankBroadcast() }
    }
    if (storeMatch) {
      return { resolution: 'existing', draft: buildBlankBroadcast() }
    }
    const cached = loadDraftCache(broadcastId)
    if (cached) {
      const base = buildBlankBroadcast()
      return {
        resolution: 'resumed',
        draft: { ...base, ...cached, id: broadcastId },
      }
    }
    return { resolution: 'not-found', draft: buildBlankBroadcast() }
  })

  const isNew = initial.resolution === 'new' || initial.resolution === 'resumed'
  const draft = initial.draft
  const broadcast = storeMatch ?? (isNew ? draft : null)

  const [mode, setMode] = useState<'view' | 'edit'>(() =>
    isNew || initialEdit ? 'edit' : 'view',
  )

  const [title, setTitle] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [audienceType, setAudienceType] = useState<AudienceType>('all')
  const [program, setProgram] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [timing, setTiming] = useState<SendTiming>('now')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('datetime')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [repeatUnit, setRepeatUnit] = useState<RepeatUnit>('day')
  const [repeatCount, setRepeatCount] = useState(7)

  const [confirmDelete, setConfirmDelete] = useState(false)

  // Mount + navigation: set the mode and seed the fields from the target
  // broadcast (matching TemplateDetailPage's create/view/edit lifecycle).
  // Also applies a template just created via the "+" round trip, and clears
  // the resumed draft's cache entry now that it's been consumed.
  useEffect(() => {
    const editMode = isNew || initialEdit
    setMode(editMode ? 'edit' : 'view')

    const target = broadcast
    if (target) {
      setTitle(target.title)
      setTemplateId(
        newTemplateId || target.templateId || activeTemplates[0]?.id || '',
      )
      setAudienceType(target.audienceType)
      setProgram(target.program)
      setGoal(target.goal)
      setSelectedIds(new Set(target.selectedClientIds))
      setTiming(target.timing)
      setScheduleMode(target.scheduleMode)
      setScheduleDate(target.scheduleDate || draft.scheduleDate)
      setScheduleTime(target.scheduleTime || draft.scheduleTime)
      setRepeatUnit(target.repeatUnit)
      setRepeatCount(target.repeatCount)
    }

    if (initial.resolution === 'resumed') {
      clearDraftCache(broadcastId)
    }
    if (newTemplateId) {
      navigate({
        to: '/broadcast/$broadcastId',
        params: { broadcastId },
        search: { edit: true },
        replace: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastId, initialEdit, draft])

  useEffect(() => {
    if (broadcast)
      document.title = `${broadcast.title.trim() || 'Untitled Broadcast'} — Nourish with Nourish AI`
  }, [broadcast])

  if (!broadcast) {
    return (
      <>
        <Topbar
          back={{ to: '/broadcast', label: 'Back to Broadcast Messages' }}
        />
        <main className="content">
          <div className="clients-empty">
            <Icon name="megaphone" />
            <p>Broadcast not found</p>
            <Link className="link-btn" to="/broadcast">
              Back to Broadcast Messages
            </Link>
          </div>
        </main>
      </>
    )
  }

  const b = broadcast
  const template = templates.find((t) => t.id === templateId) ?? null
  const recipients = recipientCount({
    type: audienceType,
    program,
    goal,
    selectedIds,
  })
  const displayTitle = b.title.trim() || 'Untitled Broadcast'
  const canEdit = b.status !== 'published'

  const toggleClient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyFieldsInto = (target: Broadcast) => {
    target.title = title.trim()
    target.templateId = templateId
    target.audienceType = audienceType
    target.program = program
    target.goal = goal
    target.selectedClientIds = Array.from(selectedIds)
    target.recipientCount = recipients
    target.timing = timing
    target.scheduleMode = scheduleMode
    if (timing === 'later' && scheduleMode === 'datetime') {
      target.scheduleDate = scheduleDate
      target.scheduleTime = scheduleTime
    } else {
      target.scheduleDate = ''
      target.scheduleTime = ''
    }
    target.repeatUnit = repeatUnit
    target.repeatCount = repeatCount
    target.updatedDate = new Date()
  }

  const enterEditMode = () => {
    setTitle(b.title)
    setTemplateId(b.templateId)
    setAudienceType(b.audienceType)
    setProgram(b.program)
    setGoal(b.goal)
    setSelectedIds(new Set(b.selectedClientIds))
    setTiming(b.timing)
    setScheduleMode(b.scheduleMode)
    setScheduleDate(b.scheduleDate || draft.scheduleDate)
    setScheduleTime(b.scheduleTime || draft.scheduleTime)
    setRepeatUnit(b.repeatUnit)
    setRepeatCount(b.repeatCount)
    setMode('edit')
  }

  const publish = () => {
    applyFieldsInto(b)
    b.status = timing === 'later' ? 'scheduled' : 'published'
    if (b.status === 'published') deliverBroadcast(b)
    const name = b.title.trim() || 'Untitled Broadcast'
    if (isNew) {
      setBroadcasts((prev) => [b, ...prev])
    } else {
      commit()
    }
    const message =
      timing === 'later'
        ? scheduleMode === 'datetime'
          ? `“${name}” scheduled for ${scheduleDate} at ${scheduleTime}`
          : `“${name}” will send after ${repeatCount} ${repeatUnitLabel(repeatUnit, repeatCount)} from each user's Program Activation Date`
        : `“${name}” sent to ${recipients} recipient${recipients === 1 ? '' : 's'}`
    showToast(message)
    if (b.status === 'published') {
      navigate({ to: '/broadcast' })
    } else if (isNew) {
      navigate({
        to: '/broadcast/$broadcastId',
        params: { broadcastId: b.id },
        replace: true,
      })
    } else {
      setMode('view')
    }
  }

  const cancelEdit = () => {
    if (isNew) {
      navigate({ to: '/broadcast' })
      return
    }
    setMode('view')
  }

  const duplicate = () => {
    const copy = JSON.parse(JSON.stringify(b)) as Broadcast
    copy.id = `bc-copy-${Date.now()}`
    copy.title = `Copy of "${displayTitle}"`
    copy.status = 'draft'
    copy.timing = 'now'
    copy.scheduleDate = ''
    copy.scheduleTime = ''
    copy.createdDate = new Date()
    copy.updatedDate = new Date()
    setBroadcasts((prev) => [copy, ...prev])
    showToast(`Duplicated “${displayTitle}”`)
    navigate({
      to: '/broadcast/$broadcastId',
      params: { broadcastId: copy.id },
    })
  }

  const publishNow = () => {
    b.status = 'published'
    b.timing = 'now'
    b.updatedDate = new Date()
    deliverBroadcast(b)
    commit()
    showToast(`“${displayTitle}” published`)
    navigate({ to: '/broadcast' })
  }

  const cancelSchedule = () => {
    b.status = 'draft'
    b.timing = 'now'
    b.scheduleDate = ''
    b.scheduleTime = ''
    b.updatedDate = new Date()
    commit()
    showToast(`“${displayTitle}” schedule canceled — moved back to Draft`)
  }

  const handleMenuAction = (action: BroadcastMenuAction) => {
    if (action === 'edit') enterEditMode()
    else if (action === 'duplicate') duplicate()
    else if (action === 'delete') setConfirmDelete(true)
    else if (action === 'publish-now') publishNow()
    else if (action === 'cancel-schedule') cancelSchedule()
  }

  const onCreateTemplate = () => {
    saveDraftCache(b.id, {
      title,
      templateId,
      audienceType,
      program,
      goal,
      selectedClientIds: Array.from(selectedIds),
      timing,
      scheduleMode,
      scheduleDate,
      scheduleTime,
      repeatUnit,
      repeatCount,
    })
    navigate({
      to: '/templates/$templateId',
      params: { templateId: 'new' },
      search: { returnBroadcastId: b.id },
    })
  }

  const publishLabel = timing === 'later' ? 'Schedule Broadcast' : 'Publish'

  return (
    <>
      <Topbar
        back={{ to: '/broadcast', label: 'Back to Broadcast Messages' }}
      />
      <main className="content">
        <section className="panel broadcast-page-header">
          <div className="broadcast-header-top">
            <div>
              <div className="breadcrumb-trail">
                <Link to="/broadcast" className="breadcrumb-link">
                  Broadcast Messages
                </Link>
                <Icon name="chevron-right" />
                <span className="breadcrumb-current">
                  {isNew ? 'Create Broadcast' : displayTitle}
                </span>
              </div>
              <h1 className="broadcast-header-title">
                {isNew ? 'Create Broadcast' : displayTitle}
              </h1>
            </div>
            <div className="prog-detail-actions">
              {mode === 'edit' ? (
                <>
                  <button className="link-btn" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={publish}>
                    <Icon name="rocket" />
                    {publishLabel}
                  </button>
                </>
              ) : (
                <>
                  {canEdit ? (
                    <button className="btn-primary" onClick={enterEditMode}>
                      <Icon name="pencil" />
                      Edit
                    </button>
                  ) : null}
                  <BroadcastActionsMenu
                    broadcast={b}
                    onAction={handleMenuAction}
                  />
                </>
              )}
            </div>
          </div>
        </section>

        <div className="broadcast-layout">
          <div className="broadcast-form-col">
            <BroadcastDetailsSection
              title={title}
              onTitleChange={setTitle}
              templates={activeTemplates}
              templateId={templateId}
              onTemplateIdChange={setTemplateId}
              onCreateTemplate={onCreateTemplate}
              readOnly={mode === 'view'}
            />

            <AudienceSection
              audienceType={audienceType}
              onAudienceTypeChange={setAudienceType}
              program={program}
              onProgramChange={setProgram}
              goal={goal}
              onGoalChange={setGoal}
              selectedIds={selectedIds}
              onToggleClient={toggleClient}
              readOnly={mode === 'view'}
            />

            <ScheduleSection
              timing={timing}
              onTimingChange={setTiming}
              scheduleMode={scheduleMode}
              onScheduleModeChange={setScheduleMode}
              scheduleDate={scheduleDate}
              onScheduleDateChange={setScheduleDate}
              scheduleTime={scheduleTime}
              onScheduleTimeChange={setScheduleTime}
              repeatUnit={repeatUnit}
              onRepeatUnitChange={setRepeatUnit}
              repeatCount={repeatCount}
              onRepeatCountChange={setRepeatCount}
              readOnly={mode === 'view'}
            />
          </div>

          <BroadcastPreviewColumn template={template} />
        </div>
      </main>

      {mode === 'edit' ? (
        <div className="broadcast-footer-bar">
          <button className="link-btn" onClick={cancelEdit}>
            Cancel
          </button>
          <button className="btn-primary" onClick={publish}>
            <Icon name="rocket" />
            {publishLabel}
          </button>
        </div>
      ) : null}

      {confirmDelete ? (
        <BroadcastConfirmDialog
          title="Delete this broadcast?"
          message={`"${displayTitle}" will be permanently removed.`}
          confirmText="Delete"
          danger
          onConfirm={() => {
            setBroadcasts((prev) => prev.filter((x) => x.id !== b.id))
            showToast('Broadcast deleted')
            navigate({ to: '/broadcast' })
          }}
          onClose={() => setConfirmDelete(false)}
        />
      ) : null}
    </>
  )
}
