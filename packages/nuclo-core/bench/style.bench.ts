/** Styling hot-path benchmarks — run with: bun bench/style.bench.ts */
import { createCss, cx, getCssText, resetStyles } from '../src/style';

function bench(name: string, fn: () => void, iterations: number): void {
	for (let i = 0; i < Math.min(iterations, 2_000); i++) fn();
	const start = performance.now();
	for (let i = 0; i < iterations; i++) fn();
	const elapsed = performance.now() - start;
	console.log(`${name}: ${((elapsed * 1e6) / iterations).toFixed(0)} ns/op`);
}

resetStyles();
const instance = createCss({ screens: { md: '(min-width: 768px)' } });
const stableInput = { p: 8, color: 'red', hover: { color: 'blue' }, md: { p: 12 } } as const;
const base = instance.css({ p: 8, color: 'red', display: 'flex' });
const active = instance.css({ color: 'blue', opacity: 0.8 });
const recipe = instance.variants({
	base: { rounded: 4 },
	variants: {
		tone: { primary: { color: 'blue' }, danger: { color: 'red' } },
		size: { sm: { p: 4 }, lg: { p: 12 } },
	},
});

bench('css (same object)', () => { instance.css(stableInput); }, 500_000);
bench('css (equal temporary object)', () => { instance.css({ p: 8, color: 'red' }); }, 200_000);
bench('cx (two generated blocks)', () => { cx(base, active); }, 500_000);
bench('variants (cached selection)', () => { recipe({ tone: 'danger', size: 'lg' }); }, 500_000);

resetStyles();
let unique = 0;
bench('css (unique block)', () => {
	instance.css({ raw: { '--bench-index': String(unique++) } });
}, 20_000);
console.log(`unique stylesheet: ${getCssText().length} bytes`);
