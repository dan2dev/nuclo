/**
 * @vitest-environment node
 *
 * Performance regression tests use bounded-growth invariants instead of
 * machine-dependent timing thresholds. The default Vitest timeout still
 * catches accidental quadratic or runaway behavior.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createCss, cx, getCssText, resetStyles } from '../../src/style';

beforeEach(() => {
	resetStyles();
});

describe('styling performance invariants', () => {
	it('reuses an object-identity css() result without growing the registry', () => {
		const { css } = createCss({});
		const input = { p: 8, color: 'red', hover: { color: 'blue' } } as const;
		const first = css(input);
		const initialCss = getCssText();
		let current = first;

		for (let i = 0; i < 100_000; i++) current = css(input);
		expect(current).toBe(first);
		expect(getCssText()).toBe(initialCss);
	});

	it('dedupes many structurally equal temporary style objects', () => {
		const { css } = createCss({});
		const classes = new Set<string>();
		for (let i = 0; i < 10_000; i++) classes.add(css({ p: 8, color: 'red' }).className);

		expect(classes.size).toBe(1);
		expect(getCssText().split('padding:8px').length - 1).toBe(1);
	});

	it('does not mint additional rules for repeated cx() composition', () => {
		const { css } = createCss({});
		const base = css({ p: 8, color: 'red', display: 'flex' });
		const active = css({ color: 'blue', opacity: 0.8 });
		const first = cx(base, active).className;
		const initialCss = getCssText();
		let current = first;

		for (let i = 0; i < 100_000; i++) current = cx(base, active).className;
		expect(current).toBe(first);
		expect(getCssText()).toBe(initialCss);
	});

	it('bounds variants() output by the number of reachable selections', () => {
		const { variants } = createCss({});
		const recipe = variants({
			base: { rounded: 4 },
			variants: {
				tone: { primary: { color: 'blue' }, danger: { color: 'red' } },
				size: { sm: { p: 4 }, lg: { p: 12 } },
			},
		});
		const selections = [
			{ tone: 'primary', size: 'sm' },
			{ tone: 'primary', size: 'lg' },
			{ tone: 'danger', size: 'sm' },
			{ tone: 'danger', size: 'lg' },
		] as const;
		const initial = selections.map((selection) => recipe(selection));
		const initialCss = getCssText();
		const observed = new Set<typeof initial[number]>();

		for (let i = 0; i < 25_000; i++) {
			const index = i % selections.length;
			observed.add(recipe(selections[index]));
		}
		expect(observed).toEqual(new Set(initial));
		expect(getCssText()).toBe(initialCss);
	});

	it('grows linearly for many genuinely unique declaration blocks', () => {
		const { css } = createCss({});
		const count = 2_000;
		const classes = new Set<string>();
		for (let i = 0; i < count; i++) classes.add(css({ raw: { '--index': String(i) } }).className);

		const text = getCssText();
		expect(classes.size).toBe(count);
		expect(text.split('--index:').length - 1).toBe(count);
		expect(text.length).toBeLessThan(count * 50);
	});

	it('resetStyles() releases all serialized output after a large registry', () => {
		const { css } = createCss({});
		for (let i = 0; i < 2_000; i++) css({ raw: { '--index': String(i) } });
		expect(getCssText().length).toBeGreaterThan(0);

		resetStyles();
		expect(getCssText()).toBe('');
	});
});
