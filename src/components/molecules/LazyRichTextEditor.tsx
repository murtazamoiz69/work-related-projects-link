import { lazy, Suspense, type ComponentProps } from 'react'

// TipTap and ProseMirror are ~120 KB gzipped — worth it for authoring the diet
// sheet, not worth it for every visit to Programs or Chat. Splitting the editor
// behind React.lazy keeps it out of both page chunks until a diet tab is
// actually opened.
const RichTextEditor = lazy(() =>
  import('./RichTextEditor').then((m) => ({ default: m.RichTextEditor })),
)

export function LazyRichTextEditor(
  props: ComponentProps<typeof RichTextEditor>,
) {
  return (
    <Suspense
      fallback={
        <div className="rte rte-loading" aria-busy="true">
          <span className="skel skel-wide" />
          <span className="skel" />
          <span className="skel" />
        </div>
      }
    >
      <RichTextEditor {...props} />
    </Suspense>
  )
}
