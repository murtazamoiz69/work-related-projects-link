import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/atoms/Icon'
import type { Template } from '../../types'

// Crop Cover Image — drag the image to reposition, adjust zoom. On apply it
// stores the focal point + zoom on the template (matching V2; the banner itself
// keeps a center/cover fit).
export function CropCoverModal({
  template,
  onApply,
  onClose,
}: {
  template: Template
  onApply: (focalPoint: string, zoom: number) => void
  onClose: () => void
}) {
  const [x, setX] = useState(50)
  const [y, setY] = useState(50)
  const [zoom, setZoom] = useState(100)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setX((prev) =>
        Math.min(100, Math.max(0, prev + (e.clientX - last.current.x) * -0.3)),
      )
      setY((prev) =>
        Math.min(100, Math.max(0, prev + (e.clientY - last.current.y) * -0.3)),
      )
      last.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card crop-modal-card">
        <div className="modal-head">
          <h3>Crop Cover Image</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div
          className="crop-frame"
          style={{
            backgroundImage: `url(${template.cover.value})`,
            backgroundPosition: `${x}% ${y}%`,
            backgroundSize: `${zoom}%`,
          }}
          onMouseDown={(e) => {
            dragging.current = true
            last.current = { x: e.clientX, y: e.clientY }
          }}
        />
        <p className="chat-mini-card-text">
          Drag the image to reposition, then adjust zoom.
        </p>
        <label className="modal-field">
          <span>Zoom</span>
          <input
            type="range"
            min={100}
            max={220}
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value, 10))}
          />
        </label>
        <div className="modal-foot">
          <button className="link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => onApply(`${x}% ${y}%`, zoom)}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  )
}
