/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, cx, resetStyles } from '../../src/style';

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

	it('resolves conflicts per property, keeping unrelated atoms', () => {
		const { css } = createCss({});
		const base = css({ color: 'red', p: 16 });
		const override = css({ color: 'blue' });
		const merged = cx(base, override).className.split(' ');

		const paddingAtom = css({ p: 16 }).className;
		const blueAtom = override.className;
		const redAtom = css({ color: 'red' }).className;

		expect(merged).toContain(paddingAtom);
		expect(merged).toContain(blueAtom);
		expect(merged).not.toContain(redAtom);
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
});
