import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Icon } from '@/components/atoms/Icon'

// The diet sheet and the workout plan are authored here. HTML is the storage
// format on purpose: it is what the AI engine reads when it tailors a user's
// copy, and it carries the things these plans need — headings per slot or
// section, lists of swap options, emphasis on must-haves, and links out to
// recipes and exercise demo videos.

type ToolbarButton = {
  icon: string
  label: string
  isActive: (e: Editor) => boolean
  run: (e: Editor) => void
}

const BUTTONS: ToolbarButton[] = [
  {
    icon: 'heading-2',
    label: 'Heading',
    isActive: (e) => e.isActive('heading', { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    icon: 'heading-3',
    label: 'Subheading',
    isActive: (e) => e.isActive('heading', { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    icon: 'bold',
    label: 'Bold',
    isActive: (e) => e.isActive('bold'),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    icon: 'italic',
    label: 'Italic',
    isActive: (e) => e.isActive('italic'),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    icon: 'list',
    label: 'Bullet list',
    isActive: (e) => e.isActive('bulletList'),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    icon: 'list-ordered',
    label: 'Numbered list',
    isActive: (e) => e.isActive('orderedList'),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    icon: 'quote',
    label: 'Quote',
    isActive: (e) => e.isActive('blockquote'),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
]

export function RichTextEditor({
  value,
  onChange,
  onSeeded,
  editable = true,
  ariaLabel,
}: {
  value: string
  onChange: (html: string) => void
  /** Fires whenever a *document* is loaded into the editor (mount, or a new
   *  `value` from outside), reporting the editor's own serialisation of it.
   *  Callers use it as the "unchanged" baseline: comparing what the user has
   *  now against a stored string is not a valid test of whether they edited
   *  anything, because the editor re-serialises entities and empty nodes and
   *  so never round-trips a document byte-for-byte. Both sides of the
   *  comparison have to come from the editor. */
  onSeeded?: (html: string) => void
  editable?: boolean
  ariaLabel: string
}) {
  // The last HTML this editor emitted, so a `value` that is merely our own
  // change coming back round is not mistaken for a new document to load.
  const lastEmitted = useRef<string | null>(null)
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable,
    // TipTap v3 mounts the ProseMirror view during render by default. React
    // StrictMode double-invokes that, destroys the first view, and the second
    // render then reads through a null schema ("Cannot read properties of null
    // (reading 'cached')"). Deferring the mount to an effect is TipTap's own
    // remedy for StrictMode and SSR.
    immediatelyRender: false,
    // The toolbar reads isActive() during render, so it has to re-render as the
    // selection moves — v3 defaults this off.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { class: 'rte-surface', 'aria-label': ariaLabel },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      lastEmitted.current = html
      onChange(html)
    },
  })

  // Swapping week or calorie band swaps the document under the same editor
  // instance. A `value` we just emitted ourselves is skipped, so typing doesn't
  // re-enter setContent and stomp the cursor mid-word.
  useEffect(() => {
    if (!editor) return
    if (value === lastEmitted.current) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
    onSeededRef.current?.(editor.getHTML())
  }, [editor, value])

  // The link editor: a URL field that folds out of the toolbar. A browser
  // prompt() would be less code and is what most editors reach for, but it is
  // blocked in some embeddings and can't be styled or reached consistently.
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  // Held in a ref so a caller passing an inline function doesn't re-run the
  // seeding effect (and re-report a baseline) on every render.
  const onSeededRef = useRef(onSeeded)
  useEffect(() => {
    onSeededRef.current = onSeeded
  })

  useEffect(() => {
    editor?.setEditable(editable)
  }, [editor, editable])

  if (!editor) return <div className="rte" aria-busy="true" />

  const openLinkEditor = () => {
    setLinkUrl(String(editor.getAttributes('link').href ?? ''))
    setLinkOpen(true)
  }

  const applyLink = () => {
    const url = linkUrl.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setLinkOpen(false)
      return
    }
    // With nothing selected there is no text to turn into a link, so insert the
    // URL as its own linked text rather than silently doing nothing.
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: url,
          marks: [{ type: 'link', attrs: { href: url } }],
        })
        .run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
    setLinkOpen(false)
  }

  return (
    <div className={`rte${editable ? '' : ' is-readonly'}`}>
      {editable ? (
        <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
          {BUTTONS.map((b) => (
            <button
              key={b.label}
              type="button"
              className={`rte-tool${b.isActive(editor) ? ' is-active' : ''}`}
              title={b.label}
              aria-label={b.label}
              aria-pressed={b.isActive(editor)}
              onClick={() => b.run(editor)}
            >
              <Icon name={b.icon} size={15} />
            </button>
          ))}
          <span className="rte-toolbar-sep" />
          <button
            type="button"
            className={`rte-tool${editor.isActive('link') ? ' is-active' : ''}`}
            title="Link"
            aria-label="Link"
            aria-pressed={editor.isActive('link')}
            onClick={openLinkEditor}
          >
            <Icon name="link" size={15} />
          </button>
          <span className="rte-toolbar-sep" />
          <button
            type="button"
            className="rte-tool"
            title="Undo"
            aria-label="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Icon name="undo" size={15} />
          </button>
          <button
            type="button"
            className="rte-tool"
            title="Redo"
            aria-label="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Icon name="redo" size={15} />
          </button>
        </div>
      ) : null}
      {editable && linkOpen ? (
        <div className="rte-link-row">
          <label className="rte-link-field">
            <span>Link</span>
            <input
              type="url"
              value={linkUrl}
              autoFocus
              placeholder="https://…"
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyLink()
                }
                if (e.key === 'Escape') setLinkOpen(false)
              }}
            />
          </label>
          <button type="button" className="btn-primary" onClick={applyLink}>
            {linkUrl.trim() ? 'Apply' : 'Remove link'}
          </button>
          <button
            type="button"
            className="link-btn"
            onClick={() => setLinkOpen(false)}
          >
            Cancel
          </button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  )
}
