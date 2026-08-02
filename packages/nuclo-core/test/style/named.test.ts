/**
 * @vitest-environment jsdom
 *
 * css(name, style) — readable, stable class names.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCss, cx, getCssText, resetStyles } from '../../src/style';

beforeEach(() => {
	resetStyles();
	document.head.innerHTML = '';
});

describe('css(name, style)', () => {
	it('uses the name verbatim for the base context', () => {
		const { css } = createCss({});
		const root = css('app-root', { minHeight: '100vh' });
		expect(root.className).toBe('app-root');
		expect(getCssText()).toContain('.app-root{min-height:100vh}');
	});

	it('prefixes the name onto non-base contexts', () => {
		const { css } = createCss({ screens: { md: '(min-width: 768px)' } });
		const btn = css('btn', { p: 16, hover: { color: 'red' }, md: { p: 24 } });
		const [base, ...rest] = btn.className.split(' ');

		expect(base).toBe('btn');
		expect(rest.length).toBe(2);
		for (const name of rest) expect(name.startsWith('btn-')).toBe(true);

		const text = getCssText();
		expect(text).toContain(`.${rest[0]}:hover{color:red}`);
		expect(text).toContain(`.${rest[1]}{padding:24px}`);
	});

	it('is stable across calls — same name and style yield the same classes', () => {
		const { css } = createCss({});
		const a = css('card', { p: 16, hover: { color: 'red' } });
		const b = css('card', { p: 16, hover: { color: 'red' } });
		expect(a.className).toBe(b.className);
		expect(getCssText().split('padding:16px').length - 1).toBe(1);
	});

	it('keys by name as well as content, so different names never share a class', () => {
		const { css } = createCss({});
		const a = css('one', { p: 16 });
		const b = css('two', { p: 16 });
		const anon = css({ p: 16 });
		expect(new Set([a.className, b.className, anon.className]).size).toBe(3);
	});

	it('handles a named style with no base context', () => {
		const { css } = createCss({});
		const only = css('hoverable', { hover: { color: 'red' } });
		expect(only.className.startsWith('hoverable-')).toBe(true);
		expect(getCssText()).toContain(`.${only.className}:hover{color:red}`);
	});

	it('does not reuse a memoized result when the same object is recompiled under a different name', () => {
		const { css } = createCss({});
		const style = { p: 16 };
		expect(css(style).className).not.toBe(css('named', style).className);
		expect(css('named', style).className).toBe('named');
		expect(css(style).className).not.toBe('named');
	});
});

describe('css(name, style) — cx() composition', () => {
	it('merges into a prefixed class, keeping the base properties', () => {
		const { css } = createCss({});
		const base = css('btn', { p: 16, color: 'red' });
		const active = css({ color: 'blue' });
		const merged = cx(base, active).className;

		expect(merged.startsWith('btn-')).toBe(true);
		expect(getCssText()).toContain(`.${merged}{padding:16px;color:blue}`);
	});

	it('leaves a lone named class untouched when the toggle is off', () => {
		const { css } = createCss({});
		const base = css('btn', { p: 16 });
		expect(cx(base, null).className).toBe('btn');
	});
});

describe('css(name, style) — developer feedback', () => {
	let warn: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});
	afterEach(() => {
		warn.mockRestore();
	});

	it('warns and falls back to a generated name for an invalid class name', () => {
		const { css } = createCss({});
		const bad = css('has space', { p: 16 });
		expect(warn).toHaveBeenCalledOnce();
		expect(String(warn.mock.calls[0][0])).toContain('not a valid CSS class name');
		expect(bad.className).not.toContain(' ');
		expect(getCssText()).toContain(`.${bad.className}{padding:16px}`);
	});

	it('warns when one name is reused for two different styles', () => {
		const { css } = createCss({});
		css('dupe', { p: 16 });
		css('dupe', { p: 32 });
		expect(warn).toHaveBeenCalledOnce();
		expect(String(warn.mock.calls[0][0])).toContain('already used by a different style');
	});

	it('stays quiet for valid names, including leading underscores and hyphens', () => {
		const { css } = createCss({});
		expect(css('_private', { p: 1 }).className).toBe('_private');
		expect(css('-custom', { p: 2 }).className).toBe('-custom');
		expect(css('Btn2', { p: 3 }).className).toBe('Btn2');
		expect(warn).not.toHaveBeenCalled();
	});

	it('warns for a name starting with a digit', () => {
		const { css } = createCss({});
		css('2cool', { p: 16 });
		expect(warn).toHaveBeenCalledOnce();
	});

	it('warns and falls back for a lone hyphen', () => {
		const { css } = createCss({});
		const result = css('-', { p: 16 });
		expect(warn).toHaveBeenCalledOnce();
		expect(result.className).not.toBe('-');
		expect(getCssText()).toContain(`.${result.className}{padding:16px}`);
	});
});
