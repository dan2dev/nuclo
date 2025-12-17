import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const terserOptions = {
  compress: {
    passes: 3,
    pure_getters: true,
    unsafe: true,
    unsafe_comps: true,
    unsafe_math: true,
    unsafe_proto: true,
    drop_console: false,
    drop_debugger: true,
    ecma: 2020,
  },
  mangle: {
    properties: false,
  },
  format: {
    comments: false,
    ecma: 2020,
  },
};

// Main bundle configuration
const mainConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/nuclo.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/nuclo.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/nuclo.umd.js',
      format: 'umd',
      name: 'Nuclo',
      sourcemap: true,
    },
  ],
  plugins: [typescript(), terser(terserOptions)],
};

// SSR bundle configuration
const ssrConfig = {
  input: 'src/ssr/index.ts',
  output: [
    {
      file: 'dist/ssr/nuclo.ssr.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/ssr/nuclo.ssr.cjs',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      declaration: false,
      declarationDir: undefined,
      declarationMap: false,
    }),
    terser(terserOptions)
  ],
};

export default [mainConfig, ssrConfig];
