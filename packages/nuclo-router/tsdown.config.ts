import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { 'nuclo-router': 'src/index.ts' },
  format: ['esm', 'cjs'],
  outDir: 'dist',
  clean: true,
  dts: true,
  minify: true,
  sourcemap: true,
  banner: { dts: '/// <reference types="nuclo" />' },
})
