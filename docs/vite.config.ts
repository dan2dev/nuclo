import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      'nuclo/styled': fileURLToPath(new URL('../packages/nuclo-core/src/styled/index.ts', import.meta.url)),
      nuclo: fileURLToPath(new URL('../packages/nuclo-core/src/index.ts', import.meta.url)),
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
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
