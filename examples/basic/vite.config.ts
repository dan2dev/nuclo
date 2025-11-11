import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split nuclo into its own chunk
          'nuclo': ['nuclo'],
        },
      },
    },
  },
})