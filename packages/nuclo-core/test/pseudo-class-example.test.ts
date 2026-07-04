/// <reference path="../types/index.d.ts" />
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, resetStyles } from '../src/style';
import '../src/bootstrap';

describe('Pseudo-class example from user', () => {
	beforeEach(() => {
		resetStyles();
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	it('should work with the exact user example', () => {
		const { css } = createCss({
			screens: {
				small: "(min-width: 341px)",
				medium: "(min-width: 601px)",
				large: "(min-width: 1025px)",
			},
		});

		const result = css({
			display: "flex",
			items: "center",
			py: 8,
			px: 14,
			rounded: 8,
			text: 14,
			weight: 500,
			transition: "all 0.2s",
			cursor: "pointer",
			medium: { bg: "blue" },
			hover: { color: "red" },
		});

		expect(result).toHaveProperty('className');
		const classNames = result.className.split(' ');
		expect(classNames.length).toBeGreaterThan(1);
		for (const name of classNames) {
			expect(name).toMatch(/^n[a-z0-9]+$/);
		}

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();

		const rules = Array.from(styleSheet?.sheet?.cssRules || []);
		const styleRules = rules.filter(rule => rule instanceof CSSStyleRule) as CSSStyleRule[];
		const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE) as CSSMediaRule[];

		// Should have base atoms, a hover pseudo-class rule, and the pre-registered media groups
		expect(styleRules.length).toBeGreaterThanOrEqual(1);
		expect(mediaRules.length).toBe(3);

		// Find the hover rule
		const hoverRule = styleRules.find(rule => rule.selectorText.includes(':hover'));
		expect(hoverRule).toBeTruthy();
		expect(classNames).toContain(hoverRule!.selectorText.replace(/^\./, '').replace(/:hover$/, ''));
		expect(hoverRule?.style.color).toBe('red');

		// The medium screen bucket holds the responsive background atom
		const mediumRule = mediaRules.find(rule => rule.media.mediaText.includes('601px'));
		expect(mediumRule).toBeTruthy();
		const inner = Array.from(mediumRule!.cssRules) as CSSStyleRule[];
		expect(inner.some(rule => rule.style.background === 'blue' || rule.style.backgroundColor === 'blue')).toBe(true);
	});
});
