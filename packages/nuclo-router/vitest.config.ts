import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Expose global.gc so the memory tests can assert real collectability
    // (a stubbed WeakRef cannot detect strong-reference retention).
    execArgv: ['--expose-gc'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
})
