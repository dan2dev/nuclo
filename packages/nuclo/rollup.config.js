import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
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
  plugins: [typescript(), terser()],
};
