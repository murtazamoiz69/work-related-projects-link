import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/atoms/Icon'
import { Topbar } from '@/components/organisms/Topbar'
import { showToast } from '@/lib/toast'
import {
  TEMPLATE_AUTHORS,
  stripHtmlToText,
  useTemplatesStore,
} from '@/features/templates'
import type { Template } from '@/features/templates'
import {
  TemplateListRow,
  type TemplateAction,
} from '@/features/templates'

type SortKey = 'updated' | 'recentlyUsed' | 'mostUsed' | 'name'

export function TemplatesPage() {
  const navigate = useNavigate()
  const templates = useTemplatesStore((s) => s.templates)
  const categories = useTemplatesStore((s) => s.categories)
  const commit = useTemplatesStore((s) => s.commit)
  const setTemplates = useTemplatesStore((s) => s.setTemplates)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [createdBy, setCreatedBy] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<SortKey>('updated')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = templates.filter((t) => {
      if (status === 'trash') {
        if (!t.trashed) return false
      } else {
        if (t.trashed) return false
        if (status !== 'all' && t.status !== status) return false
      }
      if (category !== 'all' && t.category !== category) return false
      if (createdBy !== 'all' && t.createdBy !== createdBy) return false
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !stripHtmlToText(t.content).toLowerCase().includes(q)
      )
        return false
      return true
    })
    const sorted = [...filtered]
    switch (sort) {
      case 'recentlyUsed':
        sorted.sort(
          (a, b) =>
            (b.usage.lastUsed?.getTime() || 0) -
            (a.usage.lastUsed?.getTime() || 0),
        )
        break
      case 'mostUsed':
        sorted.sort((a, b) => b.usage.timesUsed - a.usage.timesUsed)
        break
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        sorted.sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime())
    }
    return sorted
  }, [templates, query, category, createdBy, status, sort])

  const totalActive = templates.filter((t) => !t.trashed).length

  const handleAction = (action: TemplateAction, t: Template) => {
    if (action === 'view') {
      navigate({ to: '/templates/$templateId', params: { templateId: t.id } })
    } else if (action === 'edit') {
      navigate({
        to: '/templates/$templateId',
        params: { templateId: t.id },
        search: { edit: true },
      })
    } else if (action === 'duplicate') {
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
    } else if (action === 'favorite') {
      t.favorite = !t.favorite
      t.usage.favoriteCount += t.favorite ? 1 : -1
      commit()
    } else if (action === 'toggle-status') {
      t.status = t.status === 'archived' ? 'active' : 'archived'
      t.updatedDate = new Date()
      commit()
      showToast(
        t.status === 'archived'
          ? `“${t.title}” archived`
          : `“${t.title}” restored to active`,
      )
    } else if (action === 'delete') {
      t.trashed = true
      commit()
      showToast(`“${t.title}” moved to Trash`)
    } else if (action === 'restore') {
      t.trashed = false
      commit()
      showToast(`“${t.title}” restored`)
    } else if (action === 'delete-forever') {
      setTemplates((prev) => prev.filter((x) => x.id !== t.id))
      showToast(`“${t.title}” permanently deleted`)
    }
  }

  const emptyText =
    status === 'trash' ? 'Trash is empty' : 'No templates match your filters'

  return (
    <>
      <Topbar
        title="Templates"
        subtitle="Create once, reuse everywhere — Chat, Broadcasts, and beyond"
      />
      <main className="content">
        <section className="panel programs-toolbar">
          <div className="programs-toolbar-row">
            <div className="clients-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search templates by title or content…"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="clients-filters">
              <select
                className="select-range"
                aria-label="Filter by creator"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
              >
                <option value="all">Anyone</option>
                {TEMPLATE_AUTHORS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <select
                className="select-range"
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
                <option value="trash">Trash</option>
              </select>
              <select
                className="select-range"
                aria-label="Sort templates"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="updated">Recently updated</option>
                <option value="recentlyUsed">Recently used</option>
                <option value="mostUsed">Most used</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={() =>
                navigate({
                  to: '/templates/$templateId',
                  params: { templateId: 'new' },
                })
              }
            >
              <Icon name="plus" />
              Create Template
            </button>
          </div>

          <div className="tpl-category-chips">
            <button
              className={`prog-meta-chip tpl-cat-chip${category === 'all' ? ' is-active' : ''}`}
              onClick={() => setCategory('all')}
            >
              All templates
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={`prog-meta-chip tpl-cat-chip${category === c ? ' is-active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="panel programs-panel">
          <div className="panel-head">
            <div>
              <h2>Your Templates</h2>
              <p className="panel-sub">
                Showing {list.length} of {totalActive} templates
              </p>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="clients-empty">
              <Icon name="layout-template" />
              <p>{emptyText}</p>
              {status === 'trash' ? null : (
                <button
                  className="btn-primary"
                  onClick={() =>
                    navigate({
                      to: '/templates/$templateId',
                      params: { templateId: 'new' },
                    })
                  }
                >
                  Create Your First Template
                </button>
              )}
            </div>
          ) : (
            <div className="tpl-list-wrap">
              <div className="clients-table-wrap">
                <table className="client-table prog-table templates-table">
                  <colgroup>
                    <col style={{ width: '32%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '164px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Created By</th>
                      <th>Created</th>
                      <th>Updated</th>
                      <th>Times Used</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t) => (
                      <TemplateListRow
                        key={t.id}
                        template={t}
                        onAction={handleAction}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
