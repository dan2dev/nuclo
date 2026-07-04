/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, resetStyles } from '../../src/style';
import '../../src/bootstrap';

beforeEach(() => {
	resetStyles();
	document.body.innerHTML = '';
});

describe('styles applied through nuclo elements', () => {
	it('applies generated class names via the attributes object', () => {
		const { css } = createCss({});
		const style = css({ p: 16, color: 'red' });

		const el = (globalThis as any).div(style, 'hello')(document.body, 0);
		document.body.appendChild(el as Node);

		expect((el as HTMLElement).className).toBe(style.className);
		expect((el as HTMLElement).textContent).toBe('hello');
	});

	it('resolves computed styles from the injected stylesheet', () => {
		const { css } = createCss({});
		const style = css({ p: '16px', display: 'flex' });

		const el = (globalThis as any).div(style)(document.body, 0);
		document.body.appendChild(el as Node);

		const computed = getComputedStyle(el as HTMLElement);
		expect(computed.paddingTop).toBe('16px');
		expect(computed.display).toBe('flex');
	});

	it('merges generated classes with static className attributes', () => {
		const { css } = createCss({});
		const style = css({ p: 8 });

		const el = (globalThis as any).div({ className: 'static-class' }, style)(document.body, 0);
		document.body.appendChild(el as Node);

		const classes = (el as HTMLElement).className.split(' ');
		expect(classes).toContain('static-class');
		expect(classes).toContain(style.className);
	});

	it('exposes global styling helpers on globalThis', () => {
		const g = globalThis as any;
		expect(typeof g.createCss).toBe('function');
		expect(typeof g.css).toBe('function');
		expect(typeof g.cx).toBe('function');
		expect(typeof g.keyframes).toBe('function');
		expect(typeof g.globalStyle).toBe('function');
	});

	it('keeps hover rules targeting the same atom class', () => {
		const { css } = createCss({});
		const style = css({ color: 'black', hover: { color: 'red' } });
		const [baseAtom, hoverAtom] = style.className.split(' ');

		const el = document.getElementById('nuclo-styles') as HTMLStyleElement;
		const rules = Array.from(el.sheet!.cssRules) as CSSStyleRule[];
		expect(rules.some((r) => r.selectorText === `.${baseAtom}`)).toBe(true);
		expect(rules.some((r) => r.selectorText === `.${hoverAtom}:hover`)).toBe(true);
	});
});
