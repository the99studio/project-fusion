import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 4,
        minForks: 2
      }
    },
    testTimeout: 8000,
    hookTimeout: 3000,
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/cli.ts',
        'node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
});