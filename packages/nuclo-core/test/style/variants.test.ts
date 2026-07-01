/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, resetStyles } from '../../src/style';
import '../../src/core/runtimeBootstrap';

beforeEach(() => {
	resetStyles();
});

describe('variants() — composition', () => {
	it('applies base styles with no variants', () => {
		const { css, variants } = createCss({});
		const box = variants({ base: { p: 16 } });
		const base = css({ p: 16 });
		expect(box().className).toBe(base.className);
	});

	it('adds the selected variant on top of base', () => {
		const { css, variants } = createCss({});
		const button = variants({
			base: { rounded: 8 },
			variants: {
				size: { sm: { p: 8 }, lg: { p: 16 } },
			},
		});
		const classes = button({ size: 'lg' }).className.split(' ');
		expect(classes).toContain(css({ rounded: 8 }).className);
		expect(classes).toContain(css({ p: 16 }).className);
		expect(classes).not.toContain(css({ p: 8 }).className);
	});

	it('composes multiple variant groups in declaration order', () => {
		const { css, variants } = createCss({});
		const button = variants({
			variants: {
				intent: { primary: { color: 'white' } },
				size: { lg: { p: 16 } },
			},
		});
		const classes = button({ intent: 'primary', size: 'lg' }).className.split(' ');
		expect(classes).toContain(css({ color: 'white' }).className);
		expect(classes).toContain(css({ p: 16 }).className);
	});

	it('returns an empty className for an empty recipe', () => {
		const { variants } = createCss({});
		expect(variants({})().className).toBe('');
	});
});

describe('variants() — defaults', () => {
	it('applies defaultVariants when a prop is omitted', () => {
		const { css, variants } = createCss({});
		const button = variants({
			variants: { size: { sm: { px: 8 }, lg: { px: 16 } } },
			defaultVariants: { size: 'sm' },
		});
		expect(button().className).toBe(css({ px: 8 }).className);
	});

	it('lets an explicit prop override the default', () => {
		const { css, variants } = createCss({});
		const button = variants({
			variants: { size: { sm: { px: 8 }, lg: { px: 16 } } },
			defaultVariants: { size: 'sm' },
		});
		expect(button({ size: 'lg' }).className).toBe(css({ px: 16 }).className);
	});

	it('omits a group entirely when it has neither a prop nor a default', () => {
		const { variants } = createCss({});
		const button = variants({
			variants: { size: { sm: { px: 8 } } },
		});
		expect(button().className).toBe('');
	});
});

describe('variants() — boolean variants', () => {
	it('selects "true"/"false" value keys with real booleans', () => {
		const { css, variants } = createCss({});
		const box = variants({
			variants: {
				block: { true: { display: 'block' }, false: { display: 'inline' } },
			},
		});
		expect(box({ block: true }).className).toBe(css({ display: 'block' }).className);
		expect(box({ block: false }).className).toBe(css({ display: 'inline' }).className);
	});
});

describe('variants() — compound variants', () => {
	it('applies compound styles only when the whole combination matches', () => {
		const { css, variants } = createCss({});
		const button = variants({
			variants: {
				intent: { primary: { color: 'white' }, danger: { color: 'black' } },
				size: { sm: { px: 8 }, lg: { px: 16 } },
			},
			compoundVariants: [{ intent: 'danger', size: 'lg', css: { weight: 700 } }],
		});
		const bold = css({ weight: 700 }).className;

		expect(button({ intent: 'danger', size: 'lg' }).className.split(' ')).toContain(bold);
		expect(button({ intent: 'danger', size: 'sm' }).className.split(' ')).not.toContain(bold);
		expect(button({ intent: 'primary', size: 'lg' }).className.split(' ')).not.toContain(bold);
	});
});

describe('variants() — conflict resolution', () => {
	it('lets a variant override a conflicting base declaration (last wins)', () => {
		const { css, variants } = createCss({});
		const button = variants({
			base: { bg: '#000' },
			variants: { intent: { primary: { bg: '#fff' } } },
		});
		const classes = button({ intent: 'primary' }).className.split(' ');
		expect(classes).toContain(css({ bg: '#fff' }).className);
		expect(classes).not.toContain(css({ bg: '#000' }).className);
	});

	it('lets a compound variant override an earlier variant', () => {
		const { css, variants } = createCss({});
		const button = variants({
			variants: {
				intent: { danger: { color: 'red' } },
				size: { lg: {} },
			},
			compoundVariants: [{ intent: 'danger', size: 'lg', css: { color: 'crimson' } }],
		});
		const classes = button({ intent: 'danger', size: 'lg' }).className.split(' ');
		expect(classes).toContain(css({ color: 'crimson' }).className);
		expect(classes).not.toContain(css({ color: 'red' }).className);
	});
});

describe('variants() — caching and theming', () => {
	it('returns the same StyleResult reference for the same selection', () => {
		const { variants } = createCss({});
		const button = variants({ variants: { size: { sm: { px: 8 }, lg: { px: 16 } } } });
		expect(button({ size: 'sm' })).toBe(button({ size: 'sm' }));
		expect(button({ size: 'sm' })).not.toBe(button({ size: 'lg' }));
	});

	it('resolves theme tokens inside variant styles', () => {
		const { variants, css } = createCss({ colors: { brand: '#6366f1' } });
		const button = variants({ variants: { intent: { brand: { bg: 'brand' } } } });
		expect(button({ intent: 'brand' }).className).toBe(css({ bg: 'brand' }).className);
	});

	it('produces a result usable directly as element attributes', () => {
		const { variants } = createCss({});
		const button = variants({
			base: { p: 8 },
			variants: { intent: { primary: { color: 'white' } } },
		});
		const style = button({ intent: 'primary' });

		const el = (globalThis as any).div(style, 'Save')(document.body, 0);
		document.body.appendChild(el as Node);
		expect((el as HTMLElement).className).toBe(style.className);
		expect((el as HTMLElement).textContent).toBe('Save');
	});
});
