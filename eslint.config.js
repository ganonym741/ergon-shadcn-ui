import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default defineConfig(
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/output/**',
    '.husky/_/**',
    '.playwright-cli/**',
    'public/r/**',
    'public/api/**',
    'src/generated/**',
  ]),
  {
    files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      // Dynamic registry parsing and adapted component APIs intentionally use explicit any.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'templates/*/src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      '*.{js,cjs,mjs,ts}',
      'scripts/**/*.{js,ts}',
      'packages/cli/**/*.{js,ts}',
      'src/test/**/*.{ts,tsx}',
      'templates/*/vite.config.ts',
    ],
    languageOptions: { globals: { ...globals.node, Bun: 'readonly' } },
  },
  prettier,
)
