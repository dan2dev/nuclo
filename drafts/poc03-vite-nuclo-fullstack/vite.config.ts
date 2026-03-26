import { defineConfig } from 'vite';
import { resolve } from 'path';

const nucloRoot = resolve(__dirname, '../../packages/v0.1');

export default defineConfig({
	resolve: {
		alias: {
			nuclo: resolve(nucloRoot, 'dist/nuclo.mjs'),
		},
	},
	build: {
		manifest: true,
		rollupOptions: {
			input: 'src/main.ts',
		},
	},
});
