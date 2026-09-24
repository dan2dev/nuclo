/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    // Expose global.gc so memory tests can assert real collectability
    // (simulated WeakRef tests cannot detect strong-reference retention).
    execArgv: ['--expose-gc'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage'
    }
  }
})
