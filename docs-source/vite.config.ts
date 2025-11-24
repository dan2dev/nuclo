import { defineConfig } from 'vite'

export default defineConfig({
  base: '/nuclo/',
  build: {
    outDir: '../docs',
    emptyOutDir: true
  }
})
