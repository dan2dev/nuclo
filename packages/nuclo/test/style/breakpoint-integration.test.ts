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
		// All breakpoints are in media queries (since default styles are separate now)
		const rules = Array.from(styleSheet?.sheet?.cssRules || []);
		const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);

		// Both small and large breakpoints should have media queries
		expect(mediaRules.length).toBe(2); // Media queries for both small and large breakpoints
		
		// Verify each media query contains the expected classes
		const smallMediaRule = mediaRules.find(rule => {
			const mr = rule as CSSMediaRule;
			return mr.media.mediaText === '(max-width: 600px)';
		}) as CSSMediaRule;
		const largeMediaRule = mediaRules.find(rule => {
			const mr = rule as CSSMediaRule;
			return mr.media.mediaText === '(min-width: 601px)';
		}) as CSSMediaRule;
		
		expect(smallMediaRule).toBeTruthy();
		expect(largeMediaRule).toBeTruthy();
		
		const smallStyleRules = Array.from(smallMediaRule.cssRules).filter(rule => rule.type === CSSRule.STYLE_RULE);
		const largeStyleRules = Array.from(largeMediaRule.cssRules).filter(rule => rule.type === CSSRule.STYLE_RULE);
		
		expect(smallStyleRules.length).toBeGreaterThanOrEqual(2); // Classes for small breakpoint
		expect(largeStyleRules.length).toBeGreaterThanOrEqual(2); // Classes for large breakpoint
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
		
		// Both small and large should have media queries
		expect(mediaRules.length).toBe(2);
		
		// Check the large breakpoint media query
		const largeMediaRule = mediaRules.find(rule => {
			const mr = rule as CSSMediaRule;
			return mr.media.mediaText === '(min-width: 601px)';
		}) as CSSMediaRule;
		
		expect(largeMediaRule).toBeTruthy();
		expect(largeMediaRule.media.mediaText).toBe('(min-width: 601px)');
		
		// The media query should contain prefixed classes (large-bg-0000ff, large-text-30px)
		const mediaStyleRules = Array.from(largeMediaRule.cssRules) as CSSStyleRule[];
		
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
		
		// Also check the small breakpoint media query
		const smallMediaRule = mediaRules.find(rule => {
			const mr = rule as CSSMediaRule;
			return mr.media.mediaText === '(max-width: 600px)';
		}) as CSSMediaRule;
		
		expect(smallMediaRule).toBeTruthy();
		const smallMediaStyleRules = Array.from(smallMediaRule.cssRules) as CSSStyleRule[];
		
		// Check that the prefixed class names exist in the small media query
		const smallBgRule = smallMediaStyleRules.find(rule => rule.selectorText === '.small-bg-ff0000');
		const smallFontSizeRule = smallMediaStyleRules.find(rule => rule.selectorText === '.small-text-20px');
		
		expect(smallBgRule).toBeTruthy();
		expect(smallFontSizeRule).toBeTruthy();
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

	describe('Two-argument signature: default styles + breakpoints', () => {
		it('should accept default styles as first argument and breakpoints as second', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)',
				large: '(min-width: 1025px)'
			});

			// Default styles (no media query) + breakpoint overrides
			const result = cn(
				bg('#00FF00').fontSize('16px'),
				{
					medium: fontSize('20px'),
					large: fontSize('24px')
				}
			);

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			
			// Should contain default styles (no prefix)
			expect(className).toContain('bg-00ff00');
			expect(className).toContain('text-16px');
			
			// Should contain prefixed breakpoint styles
			expect(className).toContain('medium-text-20px');
			expect(className).toContain('large-text-24px');
		});

		it('should apply default styles without media query', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			cn(
				bg('#FF0000').fontSize('16px'),
				{
					medium: fontSize('20px')
				}
			);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();

			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const styleRules = rules.filter(rule => rule.type === CSSRule.STYLE_RULE) as CSSStyleRule[];
			
			// Default styles should be created as regular style rules (not in media query)
			const bgRule = styleRules.find(rule => rule.selectorText === '.bg-ff0000');
			const fontRule = styleRules.find(rule => rule.selectorText === '.text-16px');
			
			expect(bgRule).toBeTruthy();
			expect(fontRule).toBeTruthy();
			
			if (bgRule) {
				expect(bgRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
			}
			if (fontRule) {
				expect(fontRule.style.fontSize).toBe('16px');
			}
		});

		it('should override default styles in breakpoints', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			cn(
				bg('#FF0000').fontSize('16px'),
				{
					medium: bg('#0000FF').fontSize('20px')
				}
			);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
			
			expect(mediaRules.length).toBe(1);
			
			const mediaRule = mediaRules[0] as CSSMediaRule;
			const mediaStyleRules = Array.from(mediaRule.cssRules) as CSSStyleRule[];
			
			// Check that the overridden values exist in media query
			const bgRule = mediaStyleRules.find(rule => rule.selectorText === '.medium-bg-0000ff');
			const fontRule = mediaStyleRules.find(rule => rule.selectorText === '.medium-text-20px');
			
			expect(bgRule).toBeTruthy();
			expect(fontRule).toBeTruthy();
			
			if (bgRule) {
				expect(bgRule.style.backgroundColor).toBe('rgb(0, 0, 255)');
			}
			if (fontRule) {
				expect(fontRule.style.fontSize).toBe('20px');
			}
		});

		it('should work with only default styles (no breakpoints)', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			const result = cn(bg('#FF0000').fontSize('16px'));

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			
			// Should contain default styles
			expect(className).toContain('bg-ff0000');
			expect(className).toContain('text-16px');
			
			// Should not have any prefixed classes
			expect(className).not.toContain('medium-');
		});

		it('should match user example: default width(100%) + breakpoint width(50%)', () => {
			const cn = createBreakpoints({
				small: "(min-width: 1px)",
				medium: "(min-width: 601px)",
				large: "(min-width: 1025px)",
			});

			// User's example: cn(width("100%").bg("#FF0000"), { medium: width("50%") })
			const result = cn(
				bg('#FF0000').width('100%'),
				{
					medium: width('50%')
				}
			);

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			
			// Default styles (no media query)
			expect(className).toContain('bg-ff0000');
			expect(className).toContain('w-100');
			
			// Breakpoint override
			expect(className).toContain('medium-w-50');

			// Verify CSS rules
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			
			// Default styles should be direct style rules
			const styleRules = rules.filter(rule => rule.type === CSSRule.STYLE_RULE) as CSSStyleRule[];
			const defaultWidthRule = styleRules.find(rule => rule.selectorText === '.w-100');
			expect(defaultWidthRule).toBeTruthy();
			if (defaultWidthRule) {
				expect(defaultWidthRule.style.width).toBe('100%');
			}

			// Medium breakpoint should be in media query
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
			const mediumMediaRule = mediaRules.find(rule => {
				const mr = rule as CSSMediaRule;
				return mr.media.mediaText === '(min-width: 601px)';
			}) as CSSMediaRule;

			expect(mediumMediaRule).toBeTruthy();
			
			const mediaStyleRules = Array.from(mediumMediaRule.cssRules) as CSSStyleRule[];
			const mediumWidthRule = mediaStyleRules.find(rule => rule.selectorText === '.medium-w-50');
			expect(mediumWidthRule).toBeTruthy();
			if (mediumWidthRule) {
				expect(mediumWidthRule.style.width).toBe('50%');
			}
		});

		it('should work with complex chaining in default styles', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			const result = cn(
				bg('#FF0000').width('100%').padding('10px').margin('5px'),
				{
					medium: width('50%').padding('20px')
				}
			);

			const className = (result as any).className;
			
			// All default styles should be present
			expect(className).toContain('bg-ff0000');
			expect(className).toContain('w-100');
			expect(className).toContain('p-10px');
			expect(className).toContain('m-5px');
			
			// Breakpoint overrides
			expect(className).toContain('medium-w-50');
			expect(className).toContain('medium-p-20px');
		});

		it('should handle empty breakpoints object with default styles', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			const result = cn(bg('#FF0000').fontSize('16px'), {});

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			
			// Should only have default styles
			expect(className).toContain('bg-ff0000');
			expect(className).toContain('text-16px');
			
			// No media query classes
			expect(className).not.toContain('medium-');
		});

		it('should handle undefined breakpoints with default styles', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			const result = cn(bg('#FF0000').fontSize('16px'), undefined);

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			
			// Should only have default styles
			expect(className).toContain('bg-ff0000');
			expect(className).toContain('text-16px');
		});
	});
});
