import { describe, it, expect, beforeEach } from 'vitest';
import { createBreakpoints, bg, fontSize, flex, center, bold } from '../../src/style';
import '../../src/core/runtimeBootstrap';

describe('Breakpoint Integration', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	it('should return an object with className property', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)',
			large: '(min-width: 601px)'
		});

		const result = cn({
			small: bg('#FF0000').fontSize('20px'),
			large: bg('#0000FF').fontSize('30px')
		});

		expect(result).toHaveProperty('className');
		expect(typeof result).toBe('object');
		const className = (result as any).className;
		// Should contain base (small) breakpoint classes
		expect(className).toContain('bg-ff0000');
		expect(className).toContain('text-20px');
		// Should contain prefixed large breakpoint classes
		expect(className).toContain('large-bg-0000ff');
		expect(className).toContain('large-text-30px');
	});

	it('should return className property', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		const result = cn({
			small: bg('#FF0000')
		});

		expect((result as any).className).toContain('bg-ff0000');
	});

	it('should work as a modifier when passed to an element', () => {
		// Import runtime to get div builder
		const { div } = globalThis as any;

		const cn = createBreakpoints({
			small: '(max-width: 600px)',
			large: '(min-width: 601px)'
		});

		const styles = {
			header: cn({
				small: bg('#FF0000').fontSize('20px').flex().center().bold(),
				large: bg('#0000FF').fontSize('50px').flex().center().bold()
			})
		};

		const element = div(styles.header, 'Test Content')();

		// Check that the className was applied
		const className = element.className;
		expect(className).toContain('bg-ff0000');
		expect(className).toContain('text-20px');
		expect(className).toContain('flex');
		expect(element.textContent).toContain('Test Content');
	});

	it('should create CSS rules in the style sheet', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)',
			large: '(min-width: 601px)'
		});

		cn({
			small: bg('#FF0000').fontSize('20px'),
			large: bg('#0000FF').fontSize('30px')
		});

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();
		expect(styleSheet?.sheet?.cssRules.length).toBeGreaterThan(0);

		// Check that media queries were created
		// First breakpoint (small) is base styles without media query
		// Subsequent breakpoints (large) get media queries for overrides
		const rules = Array.from(styleSheet?.sheet?.cssRules || []);
		const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
		const styleRules = rules.filter(rule => rule.type === CSSRule.STYLE_RULE);

		// Each utility property gets its own class, so we have 2 base classes (bg-ff0000, text-20px)
		// and 2 media query classes (bg-0000ff, text-30px)
		expect(styleRules.length).toBeGreaterThanOrEqual(2); // Base styles for small breakpoint
		expect(mediaRules.length).toBe(1); // Media query for large breakpoint
		// Verify the media query contains the expected classes
		const mediaRule = mediaRules[0] as CSSMediaRule;
		const mediaStyleRules = Array.from(mediaRule.cssRules).filter(rule => rule.type === CSSRule.STYLE_RULE);
		expect(mediaStyleRules.length).toBeGreaterThanOrEqual(2); // Classes for large breakpoint
	});

	it('should create media queries with prefixed class names', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)',
			large: '(min-width: 601px)'
		});

		cn({
			small: bg('#FF0000').fontSize('20px'),
			large: bg('#0000FF').fontSize('30px')
		});

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();

		const rules = Array.from(styleSheet?.sheet?.cssRules || []);
		const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
		
		expect(mediaRules.length).toBe(1);
		
		const mediaRule = mediaRules[0] as CSSMediaRule;
		expect(mediaRule.media.mediaText).toBe('(min-width: 601px)');
		
		// The media query should contain prefixed classes (large-bg-0000ff, large-text-30px)
		const mediaStyleRules = Array.from(mediaRule.cssRules) as CSSStyleRule[];
		
		// Check that the prefixed class names exist in the media query
		const bgRule = mediaStyleRules.find(rule => rule.selectorText === '.large-bg-0000ff');
		const fontSizeRule = mediaStyleRules.find(rule => rule.selectorText === '.large-text-30px');
		
		expect(bgRule).toBeTruthy();
		expect(fontSizeRule).toBeTruthy();
		
		// Verify the values
		if (bgRule) {
			expect(bgRule.style.backgroundColor).toBe('rgb(0, 0, 255)'); // #0000FF
		}
		if (fontSizeRule) {
			expect(fontSizeRule.style.fontSize).toBe('30px');
		}
	});

	it('should handle the exact user scenario with theme colors', () => {
		const theme = {
			colors: {
				primary: "#6366f1"
			},
			spacing: {
				xxl: "2rem",
				xl: "1.5rem",
				md: "0.75rem"
			},
			borderRadius: {
				lg: "16px"
			}
		};

		const cn = createBreakpoints({
			small: "(min-width: 1px)",
			medium: "(min-width: 601px)",
			large: "(min-width: 1025px)",
		});

		const headerStyle = cn({
			small: fontSize("2rem")
				.bg(theme.colors.primary)
				.fontWeight("700")
				.padding(`${theme.spacing.xxl} ${theme.spacing.xl}`)
				.borderRadius(theme.borderRadius.lg)
				.color("#ffffff")
				.textAlign("center")
				.margin(`0 0 ${theme.spacing.xxl} 0`)
				.boxShadow("0 8px 24px rgba(99, 102, 241, 0.35)")
				.letterSpacing("-0.5px")
				.display("flex")
				.alignItems("center")
				.justifyContent("center")
				.gap(theme.spacing.md),
			medium: bg("#FF0000").fontSize("2.25rem").padding(`${theme.spacing.xxl} ${theme.spacing.xxl}`),
			large: fontSize("2.5rem"),
		});

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();

		const rules = Array.from(styleSheet?.sheet?.cssRules || []);
		const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
		
		// Find the medium breakpoint media rule
		const mediumMediaRule = mediaRules.find(rule => {
			const mr = rule as CSSMediaRule;
			return mr.media.mediaText === '(min-width: 601px)';
		}) as CSSMediaRule;

		expect(mediumMediaRule).toBeTruthy();
		
		// Check that background-color has prefixed class in medium breakpoint
		const mediaStyleRules = Array.from(mediumMediaRule.cssRules) as CSSStyleRule[];
		const bgRule = mediaStyleRules.find(rule => 
			rule.selectorText.includes('medium-bg-') && rule.style.backgroundColor
		);
		
		expect(bgRule).toBeTruthy();
		if (bgRule) {
			// Should be red (#FF0000)
			expect(bgRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
		}
	});
});
