import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/atoms/Icon'
import { TEMPLATE_VARIABLES } from '../../data'

const EMOJI_POOL = [
  '👍', '🎉', '💪', '🙌', '❤️', '😊', '👏', '🔥',
  '✅', '😅', '🙏', '⭐', '🥗', '💧', '📅', '💰',
]

type RteCmd = {
  cmd: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList'
  icon: string
  title: string
}

const RTE_COMMANDS: RteCmd[] = [
  { cmd: 'bold', icon: 'bold', title: 'Bold' },
  { cmd: 'italic', icon: 'italic', title: 'Italic' },
  { cmd: 'underline', icon: 'underline', title: 'Underline' },
]

const RTE_LIST_COMMANDS: RteCmd[] = [
  { cmd: 'insertUnorderedList', icon: 'list', title: 'Bullet list' },
  { cmd: 'insertOrderedList', icon: 'list-ordered', title: 'Numbered list' },
]

type Props = {
  title: string
  onTitleChange: (v: string) => void
  category: string
  onCategoryChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  categories: string[]
  onNewCategory: () => void
  initialContent: string
  editorRef: RefObject<HTMLDivElement>
  onDirty: () => void
}

type PopupKind = 'emoji' | 'variable' | null

export function TemplateEditBody({
  title,
  onTitleChange,
  category,
  onCategoryChange,
  description,
  onDescriptionChange,
  categories,
  onNewCategory,
  initialContent,
  editorRef,
  onDirty,
}: Props) {
  const [popup, setPopup] = useState<PopupKind>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const variableBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!popup) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !emojiBtnRef.current?.contains(target) &&
        !variableBtnRef.current?.contains(target) &&
        !(target as HTMLElement).closest?.('.composer-popup')
      ) {
        setPopup(null)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [popup])

  const insertAtCursor = (html: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand('insertHTML', false, html)
    onDirty()
  }

  const runCmd = (cmd: string) => {
    editorRef.current?.focus()
    if (cmd === 'link') {
      const url = window.prompt('Link URL:', 'https://')
      if (url) document.execCommand('createLink', false, url)
    } else {
      document.execCommand(cmd, false)
    }
    onDirty()
  }

  const togglePopup = (
    kind: Exclude<PopupKind, null>,
    ref: RefObject<HTMLButtonElement>,
  ) => {
    if (popup === kind) {
      setPopup(null)
      return
    }
    const rect = ref.current?.getBoundingClientRect()
    if (rect) setPopupPos({ top: rect.bottom + 8, left: rect.left })
    setPopup(kind)
  }

  return (
    <div className="panel tpl-editor-panel">
      <label className="modal-field">
        <span>Template Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            onTitleChange(e.target.value)
            onDirty()
          }}
        />
      </label>
      <div className="modal-field-row">
        <label className="modal-field">
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => {
              onCategoryChange(e.target.value)
              onDirty()
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="modal-field">
          <span>&nbsp;</span>
          <button className="link-btn" type="button" onClick={onNewCategory}>
            <Icon name="plus" />
            New category
          </button>
        </label>
      </div>
      <label className="modal-field">
        <span>Description (optional)</span>
        <textarea
          className="notes-input"
          rows={2}
          value={description}
          onChange={(e) => {
            onDescriptionChange(e.target.value)
            onDirty()
          }}
        />
      </label>

      <div className="drawer-section-head">
        <h4>
          <Icon name="type" />
          Template Content
        </h4>
      </div>
      <div className="rte-toolbar">
        {RTE_COMMANDS.map((c) => (
          <button
            key={c.cmd}
            type="button"
            title={c.title}
            onClick={() => runCmd(c.cmd)}
          >
            <Icon name={c.icon} />
          </button>
        ))}
        <span className="rte-divider" />
        {RTE_LIST_COMMANDS.map((c) => (
          <button
            key={c.cmd}
            type="button"
            title={c.title}
            onClick={() => runCmd(c.cmd)}
          >
            <Icon name={c.icon} />
          </button>
        ))}
        <span className="rte-divider" />
        <button type="button" title="Insert link" onClick={() => runCmd('link')}>
          <Icon name="link" />
        </button>
        <button
          ref={emojiBtnRef}
          type="button"
          title="Emoji"
          onClick={() => togglePopup('emoji', emojiBtnRef)}
        >
          <Icon name="smile" />
        </button>
        <span className="rte-divider" />
        <button
          ref={variableBtnRef}
          type="button"
          className="rte-variable-btn"
          onClick={() => togglePopup('variable', variableBtnRef)}
        >
          <Icon name="braces" />
          Insert Variable
        </button>
      </div>
      <div
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        ref={editorRef}
        onInput={onDirty}
        dangerouslySetInnerHTML={{ __html: initialContent }}
      />

      {popup === 'emoji'
        ? createPortal(
            <div
              className="composer-popup emoji-popup"
              style={{ position: 'fixed', top: popupPos.top, left: popupPos.left }}
            >
              {EMOJI_POOL.map((em) => (
                <button
                  key={em}
                  className="emoji-popup-item"
                  onClick={() => {
                    insertAtCursor(em)
                    setPopup(null)
                  }}
                >
                  {em}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}

      {popup === 'variable'
        ? createPortal(
            <div
              className="composer-popup template-popup"
              style={{ position: 'fixed', top: popupPos.top, left: popupPos.left }}
            >
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  className="template-popup-item"
                  onClick={() => {
                    insertAtCursor(`${v.key}&nbsp;`)
                    setPopup(null)
                  }}
                >
                  {v.key}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
