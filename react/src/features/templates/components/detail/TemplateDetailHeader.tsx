import { useRef } from 'react'
import { Icon } from '@/components/atoms/Icon'
import { formatCheckIn, formatJoinDate } from '@/features/clients'
import type { Template } from '../../types'
import { FixedMenu } from '../FixedMenu'

type Props = {
  template: Template
  mode: 'view' | 'edit'
  onEdit: () => void
  onCopy: () => void
  onToggleFav: () => void
  onSaveDraft: () => void
  onPublish: () => void
  onCancelEdit: () => void
  onCoverFile: (file: File) => void
  onCropCover: () => void
  onRemoveCover: () => void
  onDuplicate: () => void
  onHistory: () => void
  onDelete: () => void
}

export function TemplateDetailHeader({
  template: t,
  mode,
  onEdit,
  onCopy,
  onToggleFav,
  onSaveDraft,
  onPublish,
  onCancelEdit,
  onCoverFile,
  onCropCover,
  onRemoveCover,
  onDuplicate,
  onHistory,
  onDelete,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const isImage = t.cover.type === 'image'
  const coverBg = isImage
    ? `#000 url(${t.cover.value}) center/cover no-repeat`
    : t.cover.value
  const updatedDays = Math.round(
    (Date.now() - t.updatedDate.getTime()) / 86400000,
  )

  return (
    <section className="panel tpl-detail-header">
      <div className="tpl-detail-cover" style={{ background: coverBg }}>
        {mode === 'edit' ? (
          <div className="tpl-detail-cover-actions">
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileRef}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onCoverFile(file)
                e.target.value = ''
              }}
            />
            <button
              className="btn-secondary sm"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="image-plus" />
              Upload Image
            </button>
            {isImage ? (
              <button className="btn-secondary sm" onClick={onCropCover}>
                <Icon name="crop" />
                Crop
              </button>
            ) : null}
            {isImage ? (
              <button
                className="icon-btn sm danger"
                title="Remove image"
                onClick={onRemoveCover}
              >
                <Icon name="trash-2" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="tpl-detail-header-body">
        <div className="tpl-detail-title-row">
          <h1>{t.title}</h1>
          <span className={`prog-status-badge status-${t.status}`}>
            {t.status[0].toUpperCase() + t.status.slice(1)}
          </span>
          <button
            className={`icon-btn sm tpl-fav-btn${t.favorite ? ' is-fav' : ''}`}
            title="Favorite"
            onClick={onToggleFav}
          >
            <Icon name="star" />
          </button>
        </div>
        <p className="prog-detail-desc">
          {t.description || 'No description added yet.'}
        </p>
        <div className="prog-detail-meta-row">
          <span>
            <Icon name="tag" />
            <span>{t.category}</span>
          </span>
          <span>
            <Icon name="user" />
            <span>{t.createdBy}</span>
          </span>
          <span>
            <Icon name="calendar-plus" />
            <span>Created {formatJoinDate(t.createdDate)}</span>
          </span>
          <span>
            <Icon name="clock" />
            <span>Updated {formatCheckIn(updatedDays)}</span>
          </span>
        </div>
      </div>

      <div className="prog-detail-actions">
        {mode === 'edit' ? (
          <>
            <button className="btn-secondary" onClick={onSaveDraft}>
              <Icon name="save" />
              Save Draft
            </button>
            <button className="btn-primary" onClick={onPublish}>
              <Icon name="rocket" />
              Publish
            </button>
            <button className="icon-btn" title="Cancel" onClick={onCancelEdit}>
              <Icon name="x" />
            </button>
          </>
        ) : (
          <>
            <button className="btn-primary" onClick={onEdit}>
              <Icon name="pencil" />
              Edit
            </button>
            <button className="btn-secondary" onClick={onCopy}>
              <Icon name="clipboard-copy" />
              Copy Template
            </button>
            <FixedMenu icon="more-horizontal" className="icon-btn">
              {(close) => (
                <>
                  <button
                    onClick={() => {
                      close()
                      onDuplicate()
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      close()
                      onHistory()
                    }}
                  >
                    Version History
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      close()
                      onDelete()
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </FixedMenu>
          </>
        )}
      </div>
    </section>
  )
}
