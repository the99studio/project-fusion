import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';

// Shared configuration for all TypeScript files
const sharedRules = {
  // TypeScript strict rules
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
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/prefer-reduce-type-parameter': 'error',
  '@typescript-eslint/prefer-return-this-type': 'error',
  '@typescript-eslint/no-unnecessary-type-arguments': 'error',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/no-redundant-type-constituents': 'error',
  '@typescript-eslint/no-useless-empty-export': 'error',
  '@typescript-eslint/consistent-type-exports': 'error',
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
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
  'no-debugger': 'error',
  'no-alert': 'error',
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-arrow-callback': 'error',
  'prefer-template': 'error',
  'object-shorthand': 'error',
  'quote-props': ['error', 'as-needed'],
  'no-duplicate-imports': 'error',
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
  'no-nested-ternary': 'error',
  'no-unneeded-ternary': 'error',
  'no-mixed-operators': 'error',
  'yoda': ['error', 'never'],
  'curly': ['error', 'all'],
  'eqeqeq': ['error', 'always'],
  'no-else-return': ['error', { allowElseIf: true }],
  'no-lonely-if': 'error',
  'max-depth': ['error', 7],
  'max-lines': ['error', {
    max: 800,
    skipBlankLines: true,
    skipComments: true
  }],
  'max-lines-per-function': ['error', {
    max: 600,
    skipBlankLines: true,
    skipComments: true
  }],
  'complexity': ['error', 100],
  
  // Import rules
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

  // Unicorn rules
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-module': 'error',
  'unicorn/prefer-ternary': 'error',
  'unicorn/prefer-logical-operator-over-ternary': 'error',
  'unicorn/no-array-for-each': 'error',
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
  'unicorn/no-nested-ternary': 'error',
  'unicorn/no-typeof-undefined': 'error',
  'unicorn/prefer-export-from': 'error',
  'unicorn/prefer-at': 'error',
  'unicorn/no-unreadable-iife': 'error',
  'unicorn/prefer-modern-math-apis': 'error',
  'unicorn/prefer-native-coercion-functions': 'error',
  'unicorn/no-document-cookie': 'error',
  'unicorn/prefer-blob-reading-methods': 'error',
  'unicorn/no-anonymous-default-export': 'error',
  'unicorn/no-empty-file': 'error',
  'unicorn/no-invalid-fetch-options': 'error',
  'unicorn/no-magic-array-flat-depth': 'error'
};

// Shared globals for Node.js environment
const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  NodeJS: 'readonly'
};

// Shared plugins
const sharedPlugins = {
  'import': importPlugin,
  'unicorn': unicorn
};

// Base configuration for TypeScript files
const createTsConfig = (project) => ({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project,
      tsconfigRootDir: process.cwd()
    },
    globals: nodeGlobals
  },
  plugins: sharedPlugins,
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project
      }
    }
  },
  rules: sharedRules
});

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  
  // Source files configuration
  {
    files: ['src/**/*.ts'],
    ...createTsConfig('./tsconfig.json')
  },
  
  // Test files configuration with same base rules
  {
    files: ['tests/**/*.ts'],
    ...createTsConfig('./tsconfig.test.json')
  },
  
  // Test-specific overrides (relaxed rules)
  {
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Allow unsafe operations for mocks and test data
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      
      // Tests don't need explicit return types for readability
      '@typescript-eslint/explicit-function-return-type': 'off',
      
      // Allow unbound methods for mocking frameworks (vi.fn(), etc.)
      '@typescript-eslint/unbound-method': 'off',
      
      // Tests often use assertions that require non-null and forced conditions
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      
      // Test variable names can be more flexible (mockFs, testData, etc.)
      '@typescript-eslint/naming-convention': 'off',
      
      // Tests use magic numbers for test data and iterations
      'no-magic-numbers': 'off',
      
      // Test files can be long due to multiple test cases
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'complexity': 'off'
    }
  }
];