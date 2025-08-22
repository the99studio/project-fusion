import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd()
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        NodeJS: 'readonly'
      }
    },
    plugins: {
      'import': importPlugin,
      'unicorn': unicorn
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        }
      }
    },
    rules: {
      // Additional TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',

      // General code quality
      'no-console': 'off', // CLI app needs console output
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'quote-props': ['error', 'as-needed'],
      'no-duplicate-imports': 'error',
      
      // Import rules with TypeScript resolver
      'import/order': [
        'error',
        {
          'groups': [
            'builtin',
            'external', 
            'internal',
            'parent',
            'sibling',
            'index'
          ],
          'newlines-between': 'never',
          'alphabetize': {
            'order': 'asc',
            'caseInsensitive': true
          }
        }
      ],
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'error',
      'import/extensions': [
        'error',
        'always',
        {
          'ts': 'never',
          'tsx': 'never'
        }
      ],

      // Unicorn rules for modern JS practices
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-ternary': 'warn',
      'unicorn/prefer-logical-operator-over-ternary': 'error',
      'unicorn/no-array-for-each': 'warn',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat': 'error',
      'unicorn/prefer-object-from-entries': 'error',
      'unicorn/prefer-set-has': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/numeric-separators-style': 'error',
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/custom-error-definition': 'error',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/filename-case': [
        'error',
        {
          'cases': {
            'camelCase': true,
            'pascalCase': true,
            'kebabCase': true
          }
        }
      ],
      'unicorn/new-for-builtins': 'error',
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-hex-escape': 'error',
      'unicorn/no-instanceof-array': 'error',
      'unicorn/no-new-buffer': 'error',
      'unicorn/no-unnecessary-await': 'error',
      'unicorn/no-useless-length-check': 'error',
      'unicorn/no-useless-spread': 'error',
      'unicorn/no-zero-fractions': 'error',
      'unicorn/number-literal-case': 'error',
      'unicorn/prefer-add-event-listener': 'error',
      'unicorn/prefer-array-index-of': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-default-parameters': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-math-trunc': 'error',
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-prototype-methods': 'error',
      'unicorn/prefer-reflect-apply': 'error',
      'unicorn/prefer-regexp-test': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-string-trim-start-end': 'error',
      'unicorn/prefer-switch': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/throw-new-error': 'error'
    }
  },
  {
    files: ['tests/**/*', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off'
    }
  }
];