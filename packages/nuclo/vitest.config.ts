/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '../types': path.resolve(__dirname, './types.ts'),
      '../../types': path.resolve(__dirname, './types.ts')
    }
  },
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