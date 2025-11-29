import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate nuclo into its own chunk
          'nuclo': ['nuclo'],
        }
      }
    }
  }
})
