/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    // Expose global.gc so memory tests can assert real collectability
    // (simulated WeakRef tests cannot detect strong-reference retention).
    execArgv: ['--expose-gc'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    env: {
      NODE_ENV: 'test'
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'examples/**/*',
        'node_modules/**',
        'dist/**',
        'test/**',
        '**/*.d.ts',
        'src/**/*.types.ts' // Exclude type-only files
      ],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage'
    }
  }
})
