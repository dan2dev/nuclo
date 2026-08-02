/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, cx, getCssText, resetStyles } from '../../src/style';

beforeEach(() => {
	resetStyles();
});

describe('cx()', () => {
	it('keeps the last class when two inputs style the same property', () => {
		const { css } = createCss({});
		const red = css({ color: 'red' });
		const blue = css({ color: 'blue' });
		expect(cx(red, blue).className).toBe(blue.className);
		expect(cx(blue, red).className).toBe(red.className);
	});

	it('merges same-context classes per property, keeping unrelated declarations', () => {
		const { css } = createCss({});
		const base = css({ color: 'red', p: 16 });
		const override = css({ color: 'blue' });
		const merged = cx(base, override).className;

		// One combined class: base's padding survives, override's color wins.
		expect(merged.split(' ').length).toBe(1);
		expect(merged).not.toBe(base.className);
		expect(getCssText()).toContain(`.${merged}{padding:16px;color:blue}`);
	});

	it('collapses a full restatement back to the override class itself', () => {
		const { css } = createCss({});
		const red = css({ color: 'red' });
		const blue = css({ color: 'blue' });
		// Every property is restated, so the merged block is content-identical
		// to the override block and reuses its class.
		expect(cx(red, blue).className).toBe(blue.className);
	});

	it('merges chains left to right across three same-context inputs', () => {
		const { css } = createCss({});
		const a = css({ p: 16, color: 'red' });
		const b = css({ color: 'blue' });
		const c = css({ m: 4 });
		const merged = cx(a, b, c).className;
		expect(merged.split(' ').length).toBe(1);
		expect(getCssText()).toContain(`.${merged}{padding:16px;color:blue;margin:4px}`);
	});

	it('treats the same property under different variants as non-conflicting', () => {
		const { css } = createCss({ screens: { md: '(min-width: 768px)' } });
		const base = css({ color: 'red' });
		const hovered = css({ hover: { color: 'blue' } });
		const responsive = css({ md: { color: 'green' } });
		const merged = cx(base, hovered, responsive).className.split(' ');
		expect(merged.length).toBe(3);
	});

	it('ignores falsy inputs for conditional composition', () => {
		const { css } = createCss({});
		const a = css({ p: 16 });
		const b = css({ color: 'red' });
		const isActive = false;
		expect(cx(a, isActive && b, null, undefined).className).toBe(a.className);
	});

	it('passes through unknown external classes', () => {
		const { css } = createCss({});
		const a = css({ p: 16 });
		const merged = cx('external-class', a).className.split(' ');
		expect(merged).toContain('external-class');
		expect(merged).toContain(a.className);
	});

	it('dedupes repeated external classes', () => {
		expect(cx('x y', 'x').className).toBe('x y');
	});

	it('accepts raw class strings with multiple names', () => {
		const merged = cx('one two', 'three').className.split(' ');
		expect(merged).toEqual(['one', 'two', 'three']);
	});

	it('flattens nested arrays of inputs', () => {
		const { css } = createCss({});
		// Different selector contexts (base vs :hover) so both classes survive
		// composition — this test is about array flattening, not conflicts.
		const a = css({ p: 16 });
		const b = css({ hover: { color: 'red' } });
		const merged = cx([a, 'x'], [[b, 'y']]).className.split(' ');
		expect(merged).toContain(a.className);
		expect(merged).toContain(b.className);
		expect(merged).toContain('x');
		expect(merged).toContain('y');
	});

	it('ignores falsy entries inside arrays for conditional lists', () => {
		const { css } = createCss({});
		const a = css({ p: 16 });
		const b = css({ color: 'red' });
		const active = false;
		const merged = cx([a, active && b, null, undefined]).className;
		expect(merged).toBe(a.className);
	});

	it('resolves conflicts across array boundaries (last wins)', () => {
		const { css } = createCss({});
		const red = css({ color: 'red' });
		const blue = css({ color: 'blue' });
		expect(cx([red], blue).className).toBe(blue.className);
		expect(cx(red, [blue]).className).toBe(blue.className);
	});
});
