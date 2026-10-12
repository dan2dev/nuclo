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
  server: {
    watch: {
      ignored: ['!**/node_modules/nuclo/**']
    }
  },
  optimizeDeps: {
    // exclude: ['nuclo']
  },
  build: {
    outDir: './build/dist',
    emptyOutDir: true,
    manifest: true,
    rolldownOptions: {
      input: 'src/main.ts',
      output: {
        // Pages stay in their own chunks (the router import()s them on demand);
        // the framework gets a stable chunk so a docs edit does not invalidate it.
        codeSplitting: { groups: [{ name: 'nuclo', test: /\/packages\/nuclo-/ }] },
      },
    },
  },
})
