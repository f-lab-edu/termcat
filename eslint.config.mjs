import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import prettierConfig from 'eslint-config-prettier'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist/**', 'out/**', 'node_modules/**', '*.js', '*.mjs', '*.cjs'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,

      // import 정렬
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^node:'],          // Node.js 내장
            ['^@?\\w'],          // 외부 패키지
            ['^@/'],             // 내부 절대 경로
            ['^\\.\\./','^\\.'], // 상대 경로
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
    },
  },
]
