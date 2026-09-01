import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dist-single', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // Our toggle/checkbox rows wrap the <input> in a <label> and put the
      // visible text one level deeper than the rule's default scan (depth 2).
      // The association and text are genuinely present — just widen the scan.
      'jsx-a11y/label-has-associated-control': ['error', { depth: 3 }],
      // Modals/drawers focus their first field when opened by an explicit user
      // action — intended UX here, not a stray autofocus trap.
      'jsx-a11y/no-autofocus': 'off',
      // Backdrop/card click patterns (click-to-close, click-to-open-detail) are
      // pervasive in this ported UI and already offer Escape + sibling buttons.
      // Surfaced as warnings for a dedicated a11y pass rather than blocking, so
      // we don't rewrite ~15 working components under a no-UI-change mandate.
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Catch cross-module import cycles (the build warns too; this fails lint).
      'import/no-cycle': 'error',
      // CLAUDE.md — Strict TypeScript bans
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Enums are banned. Use a union type or `as const` object.',
        },
      ],
    },
  },
)
