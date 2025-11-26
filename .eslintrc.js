module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // ============================================================================
    // STRICT: Code Quality Rules
    // ============================================================================

    // No unused variables (allow _prefix for intentionally unused)
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // No explicit any (enforce proper typing)
    '@typescript-eslint/no-explicit-any': 'error',

    // No console.log (must use logger)
    'no-console': [
      'error',
      {
        allow: ['warn', 'error'], // Allow console.warn/error for critical debugging
      },
    ],

    // No unused expressions
    '@typescript-eslint/no-unused-expressions': 'error',

    // Require consistent type imports
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
      },
    ],
  },
  overrides: [
    // Edge Functions - stricter rules
    {
      files: ['apps/api/src/functions/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/src/_shared/**', '../_shared/**', './_shared/**'],
                message:
                  '❌ DO NOT import from _shared. Move shared code to appropriate locations.',
              },
            ],
          },
        ],
      },
    },
    // Frontend - allow console in development
    {
      files: ['apps/web/**/*.{ts,tsx}', 'apps/design-system/**/*.{ts,tsx}'],
      rules: {
        'no-console': 'warn', // Warn instead of error for frontend
      },
    },
    // Test files - relax some rules
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '*.js', // Ignore JS files (we're TypeScript-first)
  ],
};
