/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCss, cx, getCssText, resetStyles } from '../../src/style';

beforeEach(() => resetStyles());

describe('style cache correctness and CSSOM work', () => {
	it('merges conflicting generated tokens in a single string or class object', () => {
		const { css } = createCss();
		const a = css({ p: 8, color: 'red' });
		const b = css({ color: 'blue' });
		const expected = cx(a, b).className;
		expect(cx(`${a} ${b}`).className).toBe(expected);
		expect(cx({ className: `${a} ${b}` }).className).toBe(expected);
	});

	it('observes updated class names on reused input objects', () => {
		const a = { className: 'one' };
		const b = { className: 'two' };
		expect(cx(a, b).className).toBe('one two');
		b.className = 'three';
		expect(cx(a, b).className).toBe('one three');
	});

	it('recompiles an existing recipe after resetStyles', () => {
		const recipe = createCss().variants({ base: { p: 8 }, variants: { tone: { blue: { color: 'blue' } } } });
		const first = recipe({ tone: 'blue' });
		const text = getCssText();
		resetStyles();
		expect(recipe({ tone: 'blue' }).className).toBe(first.className);
		expect(getCssText()).toBe(text);
	});

	it.each(['css', 'cx', 'variants'] as const)('restores a removed sheet on a cached %s call', (kind) => {
		const instance = createCss();
		const input = { color: 'red' } as const;
		const a = instance.css(input);
		const b = instance.css({ p: 8 });
		const recipe = instance.variants({ base: { color: 'blue' } });
		const run = kind === 'css' ? () => instance.css(input) : kind === 'cx' ? () => cx(a, b) : () => recipe();
		const first = run();
		document.getElementById('nuclo-styles')!.remove();
		expect(run()).toBe(first);
		const sheet = (document.getElementById('nuclo-styles') as HTMLStyleElement).sheet!;
		expect(Array.from(sheet.cssRules).some(rule => rule.cssText.includes(`.${first.className}`))).toBe(true);
	});

	it.each([false, true])('does not serialize a growing media group on insertion (hydration: %s)', (hydrate) => {
		if (hydrate) {
			const style = document.createElement('style');
			style.id = 'nuclo-styles';
			// Keep an unmatched SSR rule in the external index throughout the test.
			style.textContent = '@media (min-width: 768px) { .external { color: red; } }';
			document.head.appendChild(style);
		}
		const { css } = createCss({ screens: { md: '(min-width: 768px)' } });
		css({ md: { p: 1 } });
		const sheet = (document.getElementById('nuclo-styles') as HTMLStyleElement).sheet!;
		const group = sheet.cssRules[0] as CSSMediaRule;
		const serialize = vi.spyOn(group, 'cssText', 'get');
		for (let i = 2; i <= 200; i++) css({ md: { p: i } });
		expect(serialize).not.toHaveBeenCalled();
		expect(group.cssRules.length).toBe(hydrate ? 201 : 200);
		serialize.mockRestore();
	});
});
