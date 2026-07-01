/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, css as defaultCss, getCssText, resetStyles } from '../../src/style';

beforeEach(() => {
	resetStyles();
});

describe('css() — properties and values', () => {
	it('converts camelCase properties to kebab-case', () => {
		const { css } = createCss({});
		css({ alignItems: 'center', borderTopWidth: 2 } as Parameters<typeof css>[0]);
		const text = getCssText();
		expect(text).toContain('align-items:center');
		expect(text).toContain('border-top-width:2px');
	});

	it('converts numbers to px except unitless properties and zero', () => {
		const { css } = createCss({});
		css({ p: 16, m: 0, opacity: 0.5, z: 10, flex: 1, leading: 1.5 });
		const text = getCssText();
		expect(text).toContain('padding:16px');
		expect(text).toContain('margin:0');
		expect(text).toContain('opacity:0.5');
		expect(text).toContain('z-index:10');
		expect(text).toContain('flex:1');
		expect(text).toContain('line-height:1.5');
	});

	it('expands multi-property aliases', () => {
		const { css } = createCss({});
		css({ px: 8, my: 4, size: 20 });
		const text = getCssText();
		expect(text).toContain('padding-left:8px');
		expect(text).toContain('padding-right:8px');
		expect(text).toContain('margin-top:4px');
		expect(text).toContain('margin-bottom:4px');
		expect(text).toContain('width:20px');
		expect(text).toContain('height:20px');
	});

	it('expands composite utilities when true and skips them when false', () => {
		const { css } = createCss({});
		css({ row: true, truncate: true, center: false });
		const text = getCssText();
		expect(text).toContain('display:flex');
		expect(text).toContain('flex-direction:row');
		expect(text).toContain('text-overflow:ellipsis');
		expect(text).not.toContain('justify-content:center');
	});

	it('passes raw declarations through unchanged', () => {
		const { css } = createCss({});
		css({ raw: { '--custom-prop': '10px', 'mask-image': 'none' } });
		const text = getCssText();
		expect(text).toContain('--custom-prop:10px');
		expect(text).toContain('mask-image:none');
	});

	it('skips null and undefined values', () => {
		const { css } = createCss({});
		const result = css({ p: undefined, m: 4 } as Parameters<typeof css>[0]);
		expect(result.className.split(' ').length).toBe(1);
	});

	it('ignores unknown nested object keys instead of emitting them', () => {
		const { css } = createCss({});
		const result = css({ color: 'red', mystery: { color: 'blue' } } as Parameters<typeof css>[0]);
		expect(result.className.split(' ').length).toBe(1);
		const text = getCssText();
		expect(text).toContain('color:red');
		expect(text).not.toContain('color:blue');
	});

	it('memoizes results per style object reference', () => {
		const { css } = createCss({});
		const style = { p: 16 };
		expect(css(style)).toBe(css(style));
	});

	it('reuses atoms across different css() calls', () => {
		const { css } = createCss({});
		const a = css({ p: 16, color: 'red' });
		const b = css({ p: 16, color: 'blue' });
		const aClasses = a.className.split(' ');
		const bClasses = b.className.split(' ');
		expect(bClasses).toContain(aClasses[0]); // shared padding atom
		expect(bClasses[1]).not.toBe(aClasses[1]);
	});
});

describe('css() — theme tokens', () => {
	const { css } = createCss({
		colors: { primary: '#6366f1', surface: '#fff' },
		fonts: { body: 'system-ui, sans-serif' },
		shadows: { card: '0 10px 25px rgba(0,0,0,0.1)' },
		radii: { md: '8px' },
	});

	it('resolves color tokens on color-typed properties', () => {
		css({ bg: 'primary', color: 'surface', borderColor: 'primary' });
		const text = getCssText();
		expect(text).toContain('background:#6366f1');
		expect(text).toContain('color:#fff');
		expect(text).toContain('border-color:#6366f1');
	});

	it('resolves font, shadow and radius tokens', () => {
		css({ font: 'body', shadow: 'card', rounded: 'md' });
		const text = getCssText();
		expect(text).toContain('font-family:system-ui, sans-serif');
		expect(text).toContain('box-shadow:0 10px 25px rgba(0,0,0,0.1)');
		expect(text).toContain('border-radius:8px');
	});

	it('passes through raw values on token properties', () => {
		css({ bg: 'linear-gradient(#fff, #000)', rounded: 12 });
		const text = getCssText();
		expect(text).toContain('background:linear-gradient(#fff, #000)');
		expect(text).toContain('border-radius:12px');
	});

	it('does not resolve tokens on non-token properties', () => {
		css({ content: '"primary"' });
		expect(getCssText()).toContain('content:"primary"');
	});
});

describe('css() — variants', () => {
	it('generates pseudo-class and pseudo-element rules', () => {
		const { css } = createCss({});
		css({ hover: { bg: '#eee' }, before: { content: '""' }, placeholder: { color: 'gray' } });
		const text = getCssText();
		expect(text).toMatch(/\.n[a-z0-9]+:hover\{background:#eee\}/);
		expect(text).toMatch(/\.n[a-z0-9]+::before\{content:""\}/);
		expect(text).toMatch(/\.n[a-z0-9]+::placeholder\{color:gray\}/);
	});

	it('scopes screen variants to their media query', () => {
		const { css } = createCss({ screens: { md: '(min-width: 768px)' } });
		css({ p: 16, md: { p: 32 } });
		expect(getCssText()).toContain('@media (min-width: 768px){');
	});

	it('supports full at-rule preludes in screens (container queries)', () => {
		const { css } = createCss({ screens: { sidebar: '@container sidebar (min-width: 400px)' } });
		css({ sidebar: { p: 8 } });
		expect(getCssText()).toContain('@container sidebar (min-width: 400px){');
	});

	it('combines nested screen + pseudo variants', () => {
		const { css } = createCss({ screens: { md: '(min-width: 768px)' } });
		css({ md: { hover: { color: 'red' } } });
		const text = getCssText();
		expect(text).toMatch(/@media \(min-width: 768px\)\{\.n[a-z0-9]+:hover\{color:red\}/);
	});

	it('combines nested media conditions with "and"', () => {
		const { css } = createCss({
			screens: { md: '(min-width: 768px)', dark: '(prefers-color-scheme: dark)' },
		});
		css({ md: { dark: { color: 'white' } } });
		expect(getCssText()).toContain('@media (min-width: 768px) and (prefers-color-scheme: dark){');
	});

	it('supports arbitrary & selectors', () => {
		const { css } = createCss({});
		css({ '&:nth-child(2)': { bg: '#eee' }, '& > svg': { size: 16 } });
		const text = getCssText();
		expect(text).toMatch(/\.n[a-z0-9]+:nth-child\(2\)\{background:#eee\}/);
		expect(text).toMatch(/\.n[a-z0-9]+ > svg\{width:16px\}/);
	});

	it('supports inline @-rule keys without theme screens', () => {
		const { css } = createCss({});
		css({ '@media (min-width: 900px)': { p: 24 } });
		expect(getCssText()).toContain('@media (min-width: 900px){');
	});
});

describe('default themeless instance', () => {
	it('works without a theme', () => {
		const result = defaultCss({ p: 16, hover: { color: 'red' } });
		expect(result.className).toMatch(/^n[a-z0-9]+ n[a-z0-9]+$/);
		expect(getCssText()).toContain('padding:16px');
	});
});

describe('StyleResult shape', () => {
	it('exposes className and a non-enumerable toString', () => {
		const { css } = createCss({});
		const result = css({ p: 16 });
		expect(Object.keys(result)).toEqual(['className']);
		expect(`${result}`).toBe(result.className);
	});
});
