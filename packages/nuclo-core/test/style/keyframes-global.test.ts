/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, getCssText, resetStyles } from '../../src/style';

beforeEach(() => {
	resetStyles();
});

describe('keyframes()', () => {
	it('registers a @keyframes block and returns its name', () => {
		const { keyframes } = createCss({});
		const name = keyframes({
			from: { opacity: 0, transform: 'translateY(4px)' },
			to: { opacity: 1, transform: 'translateY(0)' },
		});
		expect(name).toMatch(/^nk[a-z0-9]+$/);
		const text = getCssText();
		expect(text).toContain(`@keyframes ${name}{`);
		expect(text).toContain('from{opacity:0;transform:translateY(4px)}');
		expect(text).toContain('to{opacity:1;transform:translateY(0)}');
	});

	it('dedupes identical frame sets to one name and one rule', () => {
		const { keyframes } = createCss({});
		const a = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
		const b = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
		expect(a).toBe(b);
		expect(getCssText().split('@keyframes').length - 1).toBe(1);
	});

	it('supports aliases and percentage stops in frames', () => {
		const { keyframes } = createCss({ colors: { primary: '#111' } });
		const name = keyframes({
			'0%': { bg: 'primary', p: 4 },
			'100%': { bg: '#fff', p: 8 },
		});
		const text = getCssText();
		expect(text).toContain(`@keyframes ${name}{0%{background:#111;padding:4px}100%{background:#fff;padding:8px}}`);
	});

	it('passes raw declarations through inside frames', () => {
		const { keyframes } = createCss({});
		const name = keyframes({
			from: { raw: { 'offset-distance': '0%' } },
			to: { raw: { 'offset-distance': '100%' } },
		});
		const text = getCssText();
		expect(text).toContain(`@keyframes ${name}{from{offset-distance:0%}to{offset-distance:100%}}`);
	});
});

describe('globalStyle()', () => {
	it('emits a rule for the given selector', () => {
		const { globalStyle } = createCss({ fonts: { body: 'system-ui' } });
		globalStyle('body', { m: 0, font: 'body' });
		expect(getCssText()).toContain('body{margin:0;font-family:system-ui}');
	});

	it('dedupes identical global rules', () => {
		const { globalStyle } = createCss({});
		globalStyle('body', { m: 0 });
		globalStyle('body', { m: 0 });
		expect(getCssText().split('body{').length - 1).toBe(1);
	});

	it('injects into the document stylesheet', () => {
		const { globalStyle } = createCss({});
		globalStyle('html', { boxSizing: 'border-box' });
		const el = document.getElementById('nuclo-styles') as HTMLStyleElement;
		const all = Array.from(el.sheet!.cssRules).map((r) => r.cssText).join('');
		expect(all).toContain('box-sizing: border-box');
	});

	it('expands composite utilities and raw blocks in global rules', () => {
		const { globalStyle } = createCss({});
		globalStyle('.flex-row', { row: true, raw: { '--gap': '8px' } });
		expect(getCssText()).toContain('.flex-row{display:flex;flex-direction:row;--gap:8px}');
	});
});
