/** Retained conversion-cache memory after resetting generated rules: bun bench/style-memory.bench.ts */
import { gc } from 'bun';
import { createCss, resetStyles } from '../src/style';

const { css } = createCss();
function batch(start: number, count: number): void {
	for (let i = start; i < start + count; i++) {
		css({ [`--customToken${i}`]: i });
		if (i % 256 === 0) resetStyles();
	}
	resetStyles();
	gc(true);
}
batch(0, 2_000);
const initial = process.memoryUsage().heapUsed;
batch(2_000, 50_000);
console.log(`heap retained after 50,000 additional property conversions and registry resets: ${((process.memoryUsage().heapUsed - initial) / 1024).toFixed(0)} KiB`);
