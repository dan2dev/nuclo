import { describe, it, expect, beforeEach } from 'vitest';
import { createStyleQueries, display, alignItems, padding, borderRadius, fontSize, fontWeight, transition, cursor, backgroundColor, color } from '../src/style';
import '../src/core/runtimeBootstrap';

describe('Pseudo-class example from user', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	it('should work with the exact user example', () => {
		const cn = createStyleQueries({
			small: "@media (min-width: 341px)",
			medium: "@media (min-width: 601px)",
			large: "@media (min-width: 1025px)",
		});

		const result = cn(
			display("flex")
				.alignItems("center")
				.padding("8px 14px")
				.borderRadius("8px")
				.fontSize("14px")
				.fontWeight("500")
				.transition("all 0.2s")
				.cursor("pointer"),
			{
				medium: backgroundColor("blue"),
				hover: color("red")
			}
		);

		expect(result).toHaveProperty('className');
		const className = (result as any).className;
		expect(className).toMatch(/^n[a-f0-9]{8}$/);

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();

		const rules = Array.from(styleSheet?.sheet?.cssRules || []);
		const styleRules = rules.filter(rule => rule instanceof CSSStyleRule) as CSSStyleRule[];
		const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE) as CSSMediaRule[];

		// Should have base style, hover pseudo-class, and media query
		expect(styleRules.length).toBeGreaterThanOrEqual(1);
		expect(mediaRules.length).toBe(1);

		// Find the hover rule
		const hoverRule = styleRules.find(rule => rule.selectorText.includes(':hover'));
		expect(hoverRule).toBeTruthy();
		expect(hoverRule?.selectorText).toContain(className);
		expect(hoverRule?.selectorText).toContain(':hover');
		
		// Verify hover has red color
		expect(hoverRule?.style.color).toBe('red');
	});
});

