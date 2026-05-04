//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/test/**', 'src/shared/api/test-mutator.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/shared/api/test-generated/**',
                '**/shared/api/test-mutator',
                '#/shared/api/test-generated/**',
                '#/shared/api/test-mutator',
              ],
              message:
                'Test-only API client. Only importable from src/test/**.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/shared/api/generated/**',
      'src/shared/api/test-generated/**',
      '.rafita/**',
      '.flow/**',
    ],
  },
]
