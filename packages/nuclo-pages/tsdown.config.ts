import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    // One build for every runtime entry: shared modules (the `route` state, the
    // server-function registry) become shared chunks, so each exists exactly
    // once no matter which entry an app imports it through.
    entry: {
      index: 'src/index.ts',
      server: 'src/server/index.ts',
      client: 'src/client/index.ts',
      node: 'src/adapters/node.ts',
      bun: 'src/adapters/bun.ts',
    },
    format: ['esm'],
    outDir: 'dist',
    clean: true,
    dts: false,
    sourcemap: true,
    fixedExtension: true,
    platform: 'neutral',
    external: [/^node:/],
  },
  {
    entry: { vite: 'src/vite/index.ts' },
    format: ['esm'],
    outDir: 'dist',
    dts: false,
    sourcemap: true,
    fixedExtension: true,
    platform: 'node',
  },
])
