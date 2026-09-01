// Build config for the self-contained demo bundle.
//
// Produces ONE html file with all JS, CSS and assets inlined, for hosts that
// serve a single static file and block external requests (no CDN, no chunk
// fetching, no server-side route rewriting). The normal `npm run build`
// output in vite.config.ts is untouched — use that for real deployments.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Folds the emitted JS/CSS assets into index.html and drops the now-dangling
// <script src>/<link href> tags plus the Google Fonts <link>s (external
// requests are blocked, so they would only stall the render).
function inlineEverything(): Plugin {
  return {
    name: 'inline-everything',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlAsset = Object.values(bundle).find(
        (f) => f.type === 'asset' && f.fileName.endsWith('.html'),
      )
      if (!htmlAsset || htmlAsset.type !== 'asset') return

      let html = String(htmlAsset.source)
      let inlineJs = ''
      let inlineCss = ''

      const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.html')) continue
        const namePattern = escapeRe(fileName)

        if (chunk.type === 'chunk') {
          // A script element ends at the first `</script`, whatever follows —
          // and `<!--` opens a comment. Neutralise both so minified code
          // containing those literals can't terminate the block early.
          //
          // `__VITE_PRELOAD__` is stubbed here rather than via `define`:
          // Vite injects it in its own build-import-analysis pass, which
          // runs long after define-time, so define never sees it. With the
          // dynamic imports inlined there is nothing to preload anyway, and
          // leaving the bare identifier in throws a ReferenceError as soon
          // as a lazy route mounts.
          const escaped = chunk.code
            .replace(/__VITE_PRELOAD__/g, 'void 0')
            .replace(/<\/script/gi, '<\\/script')
            .replace(/<!--/g, '<\\!--')
          inlineJs = escaped
          html = html.replace(
            new RegExp(`<script[^>]*src="[^"]*${namePattern}"[^>]*></script>`),
            // Replacer FUNCTION, not a string: `$&`, `` $` ``, `$'` in the
            // bundled code would otherwise be read as substitution
            // placeholders and splice the matched tag back into the output.
            () => `<script type="module">${escaped}</script>`,
          )
          delete bundle[fileName]
        } else if (fileName.endsWith('.css')) {
          const css = String(chunk.source)
          inlineCss = css
          html = html.replace(
            new RegExp(`<link[^>]*href="[^"]*${namePattern}"[^>]*>`),
            () => `<style>${css}</style>`,
          )
          delete bundle[fileName]
        }
      }

      // Strip external font requests — blocked by the host's CSP.
      html = html
        .replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, '')
        .replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/g, '')

      htmlAsset.source = html

      // Second output for hosts that supply their own document skeleton and
      // wrap whatever they're given (Claude Artifacts): same bundle, but
      // fragment-only — no doctype/html/head/body, which would otherwise
      // nest a full document inside theirs.
      this.emitFile({
        type: 'asset',
        fileName: 'artifact.html',
        source: [
          `<style>${inlineCss}</style>`,
          `<div id="root"></div>`,
          `<script type="module">${inlineJs}</script>`,
          '',
        ].join('\n'),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineEverything()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Baked in rather than read from the shell so the bundle always ships with
  // hash routing, whatever the caller's environment looks like.
  define: {
    'import.meta.env.VITE_HASH_ROUTER': '"true"',
  },
  build: {
    outDir: 'dist-single',
    cssCodeSplit: false,
    // With inlineDynamicImports there is nothing left to preload, and Vite
    // leaves its `__VITE_PRELOAD__` placeholder unsubstituted if this stays
    // on — which throws a ReferenceError the moment a lazy route renders.
    modulePreload: false,
    assetsInlineLimit: 100_000_000, // inline every asset as a data URI
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // collapse lazy routes into one chunk
      },
    },
  },
})
