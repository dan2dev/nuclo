/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, getCssText, resetStyles, setSSRCollector } from '../../src/style';
import { atom, hash } from '../../src/style/engine';

beforeEach(() => {
	resetStyles();
	setSSRCollector(null);
});

describe('hash', () => {
	it('is deterministic and content-based', () => {
		expect(hash('color:red')).toBe(hash('color:red'));
		expect(hash('color:red')).not.toBe(hash('color:blue'));
	});

	it('produces css-class-safe names', () => {
		expect('n' + hash('|x|padding:16px')).toMatch(/^n[a-z0-9]+$/);
	});
});

describe('atom', () => {
	it('dedupes identical declarations to one class and one rule', () => {
		const a = atom(undefined, '', 'padding', '16px');
		const b = atom(undefined, '', 'padding', '16px');
		expect(a).toBe(b);
		const occurrences = getCssText().split('padding:16px').length - 1;
		expect(occurrences).toBe(1);
	});

	it('mints distinct classes per variant and property', () => {
		const base = atom(undefined, '', 'color', 'red');
		const hovered = atom(undefined, ':hover', 'color', 'red');
		const scoped = atom('@media (min-width: 768px)', '', 'color', 'red');
		expect(new Set([base, hovered, scoped]).size).toBe(3);
	});

	it('injects rules into the document stylesheet', () => {
		const cls = atom(undefined, '', 'margin', '8px');
		const el = document.getElementById('nuclo-styles') as HTMLStyleElement;
		expect(el).toBeTruthy();
		const rules = Array.from(el.sheet!.cssRules);
		expect(rules.some((r) => r.cssText.includes(cls))).toBe(true);
	});
});

describe('rule ordering', () => {
	it('keeps base rules before media groups regardless of usage order', () => {
		const { css } = createCss({
			screens: { md: '(min-width: 768px)' },
		});
		// Media-scoped declaration first, base second.
		css({ md: { p: 32 } });
		css({ p: 16 });

		const el = document.getElementById('nuclo-styles') as HTMLStyleElement;
		const rules = Array.from(el.sheet!.cssRules);
		const baseIdx = rules.findIndex((r) => r instanceof CSSStyleRule && r.cssText.includes('padding'));
		const mediaIdx = rules.findIndex((r) => r.type === CSSRule.MEDIA_RULE);
		expect(baseIdx).toBeGreaterThanOrEqual(0);
		expect(mediaIdx).toBeGreaterThanOrEqual(0);
		expect(baseIdx).toBeLessThan(mediaIdx);
	});

	it('orders screen groups by theme declaration order, not usage order', () => {
		const { css } = createCss({
			screens: { sm: '(min-width: 640px)', md: '(min-width: 768px)' },
		});
		css({ md: { p: 32 }, sm: { p: 24 } }); // md used first

		const el = document.getElementById('nuclo-styles') as HTMLStyleElement;
		const media = Array.from(el.sheet!.cssRules).filter(
			(r): r is CSSMediaRule => r.type === CSSRule.MEDIA_RULE,
		);
		const smIdx = media.findIndex((r) => r.media.mediaText.includes('640px'));
		const mdIdx = media.findIndex((r) => r.media.mediaText.includes('768px'));
		expect(smIdx).toBeGreaterThanOrEqual(0);
		expect(smIdx).toBeLessThan(mdIdx);
	});

	it('serializes getCssText with base first then screens in theme order', () => {
		const { css } = createCss({
			screens: { sm: '(min-width: 640px)', md: '(min-width: 768px)' },
		});
		css({ md: { p: 32 }, sm: { p: 24 }, p: 16 });

		const text = getCssText();
		const baseIdx = text.indexOf('padding:16px');
		const smIdx = text.indexOf('padding:24px');
		const mdIdx = text.indexOf('padding:32px');
		expect(baseIdx).toBeGreaterThanOrEqual(0);
		expect(baseIdx).toBeLessThan(smIdx);
		expect(smIdx).toBeLessThan(mdIdx);
		expect(text).toContain('@media (min-width: 640px){');
		expect(text).toContain('@media (min-width: 768px){');
	});
});

describe('setSSRCollector', () => {
	it('receives every newly minted rule, wrapped in its at-rule', () => {
		const collected: string[] = [];
		setSSRCollector((rule) => collected.push(rule));

		const { css } = createCss({ screens: { md: '(min-width: 768px)' } });
		css({ p: 16, md: { p: 32 } });

		expect(collected.some((r) => r.includes('{padding:16px}'))).toBe(true);
		expect(collected.some((r) => r.startsWith('@media (min-width: 768px){') && r.includes('padding:32px'))).toBe(true);
	});

	it('fires once per unique declaration', () => {
		const collected: string[] = [];
		setSSRCollector((rule) => collected.push(rule));

		const { css } = createCss({});
		css({ p: 16 });
		css({ p: 16 });
		expect(collected.length).toBe(1);
	});
});

describe('document swap (test isolation)', () => {
	it('replays all known rules into a fresh stylesheet after the old one is removed', () => {
		const { css } = createCss({ screens: { md: '(min-width: 768px)' } });
		css({ p: 16, md: { p: 32 } });

		// Simulate a test runner wiping the document head.
		document.head.innerHTML = '';
		expect(document.getElementById('nuclo-styles')).toBeNull();

		// Any css() call rebinds and replays the registry.
		css({ m: 4 });

		const el = document.getElementById('nuclo-styles') as HTMLStyleElement;
		const all = Array.from(el.sheet!.cssRules).map((r) => r.cssText).join('');
		expect(all).toContain('padding: 16px');
		expect(all).toContain('margin: 4px');
		expect(all).toContain('padding: 32px');
	});
});

describe('resetStyles', () => {
	it('clears the registry and removes the style element', () => {
		const { css } = createCss({});
		css({ p: 16 });
		expect(getCssText()).toContain('padding:16px');

		resetStyles();
		expect(getCssText()).toBe('');
		expect(document.getElementById('nuclo-styles')).toBeNull();
	});
});
