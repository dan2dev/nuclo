import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      nuclo: fileURLToPath(new URL('../packages/v0.1/src/index.ts', import.meta.url)),
    },
  },
  server: {
    watch: {
      ignored: ['!**/node_modules/nuclo/**']
    }
  },
  optimizeDeps: {
    exclude: ['nuclo']
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: 'src/main.ts',
    },
  },
})
