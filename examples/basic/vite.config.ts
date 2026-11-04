import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Split nuclo into its own chunk (workspace link resolves to packages/nuclo-core)
          groups: [{ name: 'nuclo', test: /[\\/](nuclo-core|node_modules[\\/]nuclo)[\\/]/ }],
        },
      },
    },
  },
})
