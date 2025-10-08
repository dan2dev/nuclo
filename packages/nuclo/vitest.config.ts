/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
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