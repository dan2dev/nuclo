import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: { nuclo: 'src/index.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    clean: true,
    dts: false,
    minify: true,
    sourcemap: true,
  },
  {
    entry: {
      'ssr/nuclo.ssr': 'src/ssr/index.ts',
      'polyfill/nuclo.polyfill': 'src/polyfill/index.ts',
    },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    dts: false,
    minify: true,
    sourcemap: true,
  },
])
