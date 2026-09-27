import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const core = (path: string) => fileURLToPath(new URL(`../nuclo-core/src/${path}`, import.meta.url))

export default defineConfig({
  resolve: {
    // Test against nuclo-core's source: its built `nuclo/ssr` bundle keeps a
    // separate copy of the serialization flag, so SSR under jsdom would lose the
    // hydration text markers when running from dist.
    alias: [
      { find: /^nuclo\/ssr$/, replacement: core('ssr/index.ts') },
      { find: /^nuclo\/polyfill$/, replacement: core('polyfill/index.ts') },
      { find: /^nuclo$/, replacement: core('index.ts') },
    ],
  },
  test: {
    environment: 'jsdom',
  },
})
