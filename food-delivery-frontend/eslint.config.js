import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    // Build/tooling config files run in Node, not the browser.
    files: ['*.config.js', '*.config.cjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // tailwind.config.js is the one config still written as CommonJS.
    files: ['tailwind.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Without this, core no-unused-vars does not see identifiers referenced from JSX
      // and reports every component and icon import as unused.
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
])
