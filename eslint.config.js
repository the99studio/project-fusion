import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // Test file specific rules
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
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
      
      // State-of-the-art TypeScript rules (2025) - Balanced for practicality
      '@typescript-eslint/strict-boolean-expressions': 'off', // Too strict, causes too many changes
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warn instead of error
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/prefer-return-this-type': 'error',
      '@typescript-eslint/promise-function-async': 'off', // Too many false positives
      '@typescript-eslint/no-unnecessary-condition': 'warn', // Warn for now
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'off', // Causes too many changes
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase']
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase']
        },
        {
          selector: 'enum',
          format: ['PascalCase']
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE']
        }
      ],

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
      
      // Modern JavaScript best practices - Balanced
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message: 'Use for...of or Object.keys/entries/values instead'
        },
        {
          selector: 'WithStatement',
          message: 'With statements are not allowed'
        }
      ],
      'no-implicit-coercion': 'off', // Too many false positives
      'no-nested-ternary': 'warn', // Warn instead of error
      'no-unneeded-ternary': 'error',
      'no-mixed-operators': 'warn',
      'yoda': ['error', 'never'],
      'curly': 'off', // Too strict for simple statements
      'eqeqeq': ['error', 'always'],
      'no-else-return': ['error', { allowElseIf: true }], // Allow else-if
      'no-lonely-if': 'error',
      'no-magic-numbers': 'off', // Too many warnings
      'max-depth': ['warn', 5], // Increase to 5
      'max-lines': ['warn', {
        max: 600, // Increase limit
        skipBlankLines: true,
        skipComments: true
      }],
      'max-lines-per-function': ['warn', {
        max: 200, // Increase limit for complex functions
        skipBlankLines: true,
        skipComments: true
      }],
      'complexity': ['warn', 20], // Increase complexity limit
      
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
      'unicorn/throw-new-error': 'error',
      
      // Additional modern unicorn rules - Practical selection
      'unicorn/no-null': 'off', // Too restrictive
      'unicorn/prevent-abbreviations': 'off', // Too verbose
      'unicorn/no-nested-ternary': 'warn', // Warn instead
      'unicorn/no-typeof-undefined': 'error',
      'unicorn/no-useless-undefined': 'off', // Can be useful for clarity
      'unicorn/prefer-export-from': 'warn',
      'unicorn/prefer-at': 'warn', // Suggest but don't enforce
      'unicorn/prefer-string-raw': 'off', // Too many changes needed
      'unicorn/no-unreadable-iife': 'error',
      'unicorn/prefer-modern-math-apis': 'error',
      'unicorn/prefer-native-coercion-functions': 'error',
      'unicorn/no-document-cookie': 'error',
      'unicorn/prefer-blob-reading-methods': 'error',
      'unicorn/prefer-top-level-await': 'off', // Not applicable
      'unicorn/no-anonymous-default-export': 'error',
      'unicorn/no-empty-file': 'error',
      'unicorn/consistent-function-scoping': 'off', // Too strict for tests
      'unicorn/no-invalid-fetch-options': 'error',
      'unicorn/no-magic-array-flat-depth': 'error'
    }
  },
  {
    files: ['tests/**/*', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'no-console': 'off',
      'no-magic-numbers': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off'
    }
  }
];