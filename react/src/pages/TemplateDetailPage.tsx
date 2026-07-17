import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { showToast } from '@/lib/toast'
import {
  TEMPLATE_COVER_GRADIENTS,
  buildBlankTemplate,
  bumpVersion,
  recordTemplateUsage,
  renderTemplateWithSampleData,
  stripHtmlToText,
  useTemplatesStore,
} from '@/features/templates'
import type { Template } from '@/features/templates'
import { TemplateDetailHeader } from '@/features/templates/components/detail/TemplateDetailHeader'
import { TemplateViewBody } from '@/features/templates/components/detail/TemplateViewBody'
import { TemplateEditBody } from '@/features/templates/components/detail/TemplateEditBody'
import { CropCoverModal } from '@/features/templates/components/detail/CropCoverModal'
import { VersionHistoryModal } from '@/features/templates/components/detail/VersionHistoryModal'
import { ConfirmDialog } from '@/features/templates/components/ConfirmDialog'

type Props = { templateId: string; initialEdit?: boolean }

export function TemplateDetailPage({ templateId, initialEdit = false }: Props) {
  const navigate = useNavigate()
  const templates = useTemplatesStore((s) => s.templates)
  const categories = useTemplatesStore((s) => s.categories)
  const rev = useTemplatesStore((s) => s.rev)
  const commit = useTemplatesStore((s) => s.commit)
  const setTemplates = useTemplatesStore((s) => s.setTemplates)
  const addCategory = useTemplatesStore((s) => s.addCategory)

  // Reading `rev` subscribes this page to the store's mutation nonce, so it
  // re-renders (and re-runs the lookup) after in-place template edits.
  void rev

  const isNew = templateId === 'new'
  const [draft] = useState<Template>(() => buildBlankTemplate(categories))
  const template = isNew
    ? draft
    : (templates.find((t) => t.id === templateId) ?? null)

  const [mode, setMode] = useState<'view' | 'edit'>(() =>
    isNew || initialEdit ? 'edit' : 'view',
  )
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)

  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const [cropOpen, setCropOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Mount + navigation: set the mode and (when opening in edit) seed the fields.
  useEffect(() => {
    const nowNew = templateId === 'new'
    const editMode = nowNew || initialEdit
    setMode(editMode ? 'edit' : 'view')
    const target = nowNew
      ? draft
      : useTemplatesStore.getState().templates.find((t) => t.id === templateId)
    if (editMode && target) {
      setEditTitle(target.title)
      setEditCategory(target.category)
      setEditDescription(target.description)
    }
  }, [templateId, initialEdit, draft])

  useEffect(() => {
    if (template) document.title = `${template.title} — Nourish with Nourish AI`
  }, [template])

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    },
    [],
  )

  if (!template) {
    return (
      <>
        <Topbar back={{ to: '/templates', label: 'Back to Templates' }} />
        <main className="content">
          <div className="clients-empty">
            <Icon name="layout-template" />
            <p>Template not found</p>
            <Link className="link-btn" to="/templates">
              Back to Templates
            </Link>
          </div>
        </main>
      </>
    )
  }

  const t = template

  const flashSaved = () => {
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1600)
  }

  const saveEditorFieldsIntoTemplate = () => {
    t.title = editTitle.trim() || t.title
    t.category = editCategory
    t.description = editDescription.trim()
    t.content = editorRef.current?.innerHTML ?? t.content
    t.updatedDate = new Date()
  }

  const enterEditMode = () => {
    setEditTitle(t.title)
    setEditCategory(t.category)
    setEditDescription(t.description)
    setMode('edit')
  }

  const saveDraft = () => {
    saveEditorFieldsIntoTemplate()
    t.status = 'draft'
    t.versionHistory.push({
      version: bumpVersion(
        t.versionHistory[t.versionHistory.length - 1].version,
      ),
      text: 'Saved as draft',
      days: 0,
    })
    if (isNew) {
      setTemplates((prev) => [t, ...prev])
      navigate({
        to: '/templates/$templateId',
        params: { templateId: t.id },
        search: { edit: true },
        replace: true,
      })
    } else {
      commit()
    }
    flashSaved()
    showToast('Saved as draft')
  }

  const publish = () => {
    saveEditorFieldsIntoTemplate()
    t.status = 'active'
    t.versionHistory.push({
      version: bumpVersion(
        t.versionHistory[t.versionHistory.length - 1].version,
      ),
      text: 'Published',
      days: 0,
    })
    if (isNew) {
      setTemplates((prev) => [t, ...prev])
      navigate({
        to: '/templates/$templateId',
        params: { templateId: t.id },
        replace: true,
      })
    } else {
      commit()
      setMode('view')
    }
    flashSaved()
    showToast('Template published')
  }

  const cancelEdit = () => {
    if (isNew) {
      navigate({ to: '/templates' })
      return
    }
    setMode('view')
  }

  const toggleFav = () => {
    t.favorite = !t.favorite
    t.usage.favoriteCount += t.favorite ? 1 : -1
    commit()
  }

  const copyTemplate = () => {
    const plain = stripHtmlToText(renderTemplateWithSampleData(t.content))
    navigator.clipboard?.writeText(plain).catch(() => {})
    // recordTemplateUsage commits internally.
    recordTemplateUsage(t, 'copy')
    showToast('Copied to clipboard — paste it into any chat or broadcast')
  }

  const duplicate = () => {
    const copy = JSON.parse(JSON.stringify(t)) as Template
    copy.id = `tmpl-copy-${Date.now()}`
    copy.title = `Copy of "${t.title}"`
    copy.status = 'draft'
    copy.favorite = false
    copy.createdDate = new Date()
    copy.updatedDate = new Date()
    copy.usage = {
      timesUsed: 0,
      lastUsed: null,
      usedInChats: 0,
      usedInBroadcasts: 0,
      favoriteCount: 0,
    }
    copy.recentUses = []
    copy.versionHistory = [
      { version: 'v1.0', text: `Duplicated from "${t.title}"`, days: 0 },
    ]
    setTemplates((prev) => [copy, ...prev])
    showToast(`Duplicated “${t.title}”`)
    navigate({ to: '/templates/$templateId', params: { templateId: copy.id } })
  }

  const coverFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      t.cover = { type: 'image', value: String(reader.result) }
      commit()
      flashSaved()
    }
    reader.readAsDataURL(file)
  }

  const removeCover = () => {
    t.cover = {
      type: 'gradient',
      value:
        TEMPLATE_COVER_GRADIENTS[
          Math.floor(Math.random() * TEMPLATE_COVER_GRADIENTS.length)
        ],
    }
    commit()
    flashSaved()
  }

  const applyCrop = (focalPoint: string, zoom: number) => {
    t.coverFocalPoint = focalPoint
    t.coverZoom = zoom
    commit()
    setCropOpen(false)
    flashSaved()
    showToast('Cover image cropped')
  }

  const newCategory = () => {
    const name = window.prompt('New category name:')
    const trimmed = name?.trim()
    if (trimmed && !categories.includes(trimmed)) {
      addCategory(trimmed)
      setEditCategory(trimmed)
    }
  }

  const autosavePill = (
    <span className={`autosave-indicator${saved ? ' show' : ''}`}>
      <Icon name="check" />
      Saved
    </span>
  )

  return (
    <>
      <Topbar
        back={{ to: '/templates', label: 'Back to Templates' }}
        status={autosavePill}
      />
      <main className="content">
        <TemplateDetailHeader
          template={t}
          mode={mode}
          onEdit={enterEditMode}
          onCopy={copyTemplate}
          onToggleFav={toggleFav}
          onSaveDraft={saveDraft}
          onPublish={publish}
          onCancelEdit={cancelEdit}
          onCoverFile={coverFile}
          onCropCover={() => setCropOpen(true)}
          onRemoveCover={removeCover}
          onDuplicate={duplicate}
          onHistory={() => setHistoryOpen(true)}
          onDelete={() => setConfirmDelete(true)}
        />

        {mode === 'edit' ? (
          <TemplateEditBody
            key={t.id}
            title={editTitle}
            onTitleChange={setEditTitle}
            category={editCategory}
            onCategoryChange={setEditCategory}
            description={editDescription}
            onDescriptionChange={setEditDescription}
            categories={categories}
            onNewCategory={newCategory}
            initialContent={t.content}
            editorRef={editorRef}
            onDirty={flashSaved}
          />
        ) : (
          <TemplateViewBody template={t} />
        )}
      </main>

      {cropOpen && t.cover.type === 'image' ? (
        <CropCoverModal
          template={t}
          onApply={applyCrop}
          onClose={() => setCropOpen(false)}
        />
      ) : null}

      {historyOpen ? (
        <VersionHistoryModal
          template={t}
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          title="Delete this template?"
          message={`"${t.title}" will move to Trash and can be restored later.`}
          confirmText="Move to Trash"
          danger
          onConfirm={() => {
            t.trashed = true
            commit()
            showToast('Moved to Trash')
            navigate({ to: '/templates' })
          }}
          onClose={() => setConfirmDelete(false)}
        />
      ) : null}
    </>
  )
}
