/**
 * Micro-benchmarks for SSR hot-path helpers — run with: bun bench/micro.bench.ts
 */
import { escapeHtml, escapeText, camelToKebab } from '../src/utility/stringUtils';

function bench(name: string, fn: () => void, iterations: number): void {
  for (let i = 0; i < 1000; i++) fn();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const ms = performance.now() - start;
  console.log(`${name}: ${((ms * 1e6) / iterations).toFixed(0)} ns/op`);
}

const cleanText = 'Product name without any special characters at all, just text';
const dirtyText = 'Product <5> & "special" with \'quotes\' and <markup>';
const cleanAttr = 'card product-card large';
const lowerName = 'class';
const camelName = 'ariaLabel';

bench('escapeText (clean)', () => { escapeText(cleanText); }, 200000);
bench('escapeText (dirty)', () => { escapeText(dirtyText); }, 200000);
bench('escapeHtml (clean attr)', () => { escapeHtml(cleanAttr); }, 200000);
bench('escapeHtml (dirty)', () => { escapeHtml(dirtyText); }, 200000);
bench('camelToKebab (lowercase)', () => { camelToKebab(lowerName); }, 200000);
bench('camelToKebab (camel)', () => { camelToKebab(camelName); }, 200000);
