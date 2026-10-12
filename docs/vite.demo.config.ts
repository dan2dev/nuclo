// The routing demo (demos/router/index.html + src/demos/router) is its own app in an
// iframe, built separately so its chunks and the site's stay independent.
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      nuclo: fileURLToPath(new URL('../packages/nuclo-core/src/index.ts', import.meta.url)),
      'nuclo-router': fileURLToPath(new URL('../packages/nuclo-router/src/index.ts', import.meta.url)),
    },
  },
  build: {
    outDir: './build/dist',
    emptyOutDir: false, // after the main build
    rollupOptions: { input: 'demos/router/index.html' },
  },
})
