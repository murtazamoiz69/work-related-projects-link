import { useEffect } from 'react'
import { Icon } from '@/components/atoms/Icon'

// Full-size viewer for anything the user has sent in: progress photos, meal
// shots, screenshots, and the page previews standing in for documents.
// Shared by the chat thread and the activity log so a photo opens the same
// way wherever it is clicked.
export function PhotoLightbox({
  photos,
  index,
  caption,
  onNavigate,
  onClose,
}: {
  photos: string[]
  index: number
  caption?: string
  onNavigate: (index: number) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft')
        onNavigate((index - 1 + photos.length) % photos.length)
      else if (e.key === 'ArrowRight') onNavigate((index + 1) % photos.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, photos.length, onNavigate, onClose])

  return (
    <div
      className="photo-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={caption ?? 'Photo viewer'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        type="button"
        className="icon-btn sm photo-lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        <Icon name="x" />
      </button>
      {photos.length > 1 ? (
        <button
          type="button"
          className="icon-btn sm photo-lightbox-nav photo-lightbox-prev"
          onClick={() =>
            onNavigate((index - 1 + photos.length) % photos.length)
          }
          aria-label="Previous photo"
        >
          <Icon name="chevron-left" />
        </button>
      ) : null}
      <img
        className="photo-lightbox-img"
        src={photos[index]}
        alt={
          caption ??
          (photos.length > 1
            ? `Photo ${index + 1} of ${photos.length}`
            : 'Logged photo')
        }
      />
      {photos.length > 1 ? (
        <button
          type="button"
          className="icon-btn sm photo-lightbox-nav photo-lightbox-next"
          onClick={() => onNavigate((index + 1) % photos.length)}
          aria-label="Next photo"
        >
          <Icon name="chevron-right" />
        </button>
      ) : null}
      {caption ? (
        <span className="photo-lightbox-caption">{caption}</span>
      ) : null}
      {photos.length > 1 ? (
        <span className="photo-lightbox-count">
          {index + 1} / {photos.length}
        </span>
      ) : null}
    </div>
  )
}
