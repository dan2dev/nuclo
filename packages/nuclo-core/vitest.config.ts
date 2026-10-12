/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, '**/.claude/**'],
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
