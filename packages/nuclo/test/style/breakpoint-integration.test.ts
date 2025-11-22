import { describe, it, expect, beforeEach } from 'vitest';
import { createStyleQueries, createBreakpoints, bg, fontSize, flex, center, bold, width, display } from '../../src/style';
import '../../src/core/runtimeBootstrap';

describe('Style Queries Integration', () => {
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
		// Should contain a single class name for all breakpoints
		expect(className).toMatch(/^n[a-f0-9]{8}$/);
		expect(className.split(' ').length).toBe(1); // Only one class name
	});

	it('should return className property', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		const result = cn({
			small: bg('#FF0000')
		});

		const className = (result as any).className;
		expect(className).toMatch(/^n[a-f0-9]{8}$/);
		expect(className.split(' ').length).toBe(1); // Only one class name
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

		// Check that the className was applied (should be a single class name)
		const className = element.className;
		expect(className).toMatch(/n[a-f0-9]{8}/);
		expect(className.split(' ').filter(c => c.startsWith('n')).length).toBe(1); // Only one nuclo class
		expect(element.textContent).toContain('Test Content');
	});

	it('should create CSS rules in the style sheet', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)',
			large: '(min-width: 601px)'
		});

		const result = cn({
			small: bg('#FF0000').fontSize('20px'),
			large: bg('#0000FF').fontSize('30px')
		});

		// Access className to ensure classes are created
		const className = (result as any).className;
		expect(className).toBeTruthy();

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
		
		expect(smallStyleRules.length).toBeGreaterThanOrEqual(1); // Single class for small breakpoint
		expect(largeStyleRules.length).toBeGreaterThanOrEqual(1); // Single class for large breakpoint
	});

	it('should create media queries with prefixed class names', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)',
			large: '(min-width: 601px)'
		});

		const result = cn({
			small: bg('#FF0000').fontSize('20px'),
			large: bg('#0000FF').fontSize('30px')
		});

		// Access className to ensure classes are created
		const className = (result as any).className;
		expect(className).toBeTruthy();

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
		
		// The media query should contain the same class name for all breakpoints
		const mediaStyleRules = Array.from(largeMediaRule.cssRules) as CSSStyleRule[];
		
		// Check that the class name exists in the media query
		const largeRule = mediaStyleRules.find(rule => rule.selectorText === `.${className}`);
		
		expect(largeRule).toBeTruthy();
		
		// Verify the values are in the single class
		if (largeRule) {
			expect(largeRule.style.backgroundColor).toBe('rgb(0, 0, 255)'); // #0000FF
			expect(largeRule.style.fontSize).toBe('30px');
		}
		
		// Also check the small breakpoint media query
		const smallMediaRule = mediaRules.find(rule => {
			const mr = rule as CSSMediaRule;
			return mr.media.mediaText === '(max-width: 600px)';
		}) as CSSMediaRule;
		
		expect(smallMediaRule).toBeTruthy();
		const smallMediaStyleRules = Array.from(smallMediaRule.cssRules) as CSSStyleRule[];
		
		// Check that the same class name exists in the small media query
		const smallRule = smallMediaStyleRules.find(rule => rule.selectorText === `.${className}`);
		
		expect(smallRule).toBeTruthy();
		if (smallRule) {
			expect(smallRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
			expect(smallRule.style.fontSize).toBe('20px');
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
		
		// Get the class name from the headerStyle result
		const className = (headerStyle as any).className;
		
		// Check that the same class name exists in medium breakpoint
		const mediaStyleRules = Array.from(mediumMediaRule.cssRules) as CSSStyleRule[];
		const mediumRule = mediaStyleRules.find(rule => 
			rule.selectorText === `.${className}`
		);
		
		expect(mediumRule).toBeTruthy();
		if (mediumRule) {
			// Should be red (#FF0000)
			expect(mediumRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
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
			
			// Should contain a single class name for all styles (default + breakpoints)
			expect(className).toMatch(/^n[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name
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
			const defaultRule = styleRules.find(rule => rule.selectorText.match(/^\.n[a-f0-9]{8}$/));
			
			expect(defaultRule).toBeTruthy();
			
			if (defaultRule) {
				expect(defaultRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
				expect(defaultRule.style.fontSize).toBe('16px');
			}
		});

		it('should override default styles in breakpoints', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			const result = cn(
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
			
			// Check that the overridden values exist in media query (single class)
			const className = (result as any).className;
			const mediumRule = mediaStyleRules.find(rule => rule.selectorText === `.${className}`);
			
			expect(mediumRule).toBeTruthy();
			
			if (mediumRule) {
				expect(mediumRule.style.backgroundColor).toBe('rgb(0, 0, 255)');
				expect(mediumRule.style.fontSize).toBe('20px');
			}
		});

		it('should work with only default styles (no breakpoints)', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			const result = cn(bg('#FF0000').fontSize('16px'));

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			
			// Should contain a single class name
			expect(className).toMatch(/^n[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name
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
			
			// Should be a single class name for all styles (default + breakpoints)
			expect(className).toMatch(/^n[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name

			// Verify CSS rules
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			
			// Default styles should be direct style rules
			const styleRules = rules.filter(rule => rule.type === CSSRule.STYLE_RULE) as CSSStyleRule[];
			const defaultRule = styleRules.find(rule => rule.selectorText === `.${className}`);
			expect(defaultRule).toBeTruthy();
			if (defaultRule) {
				expect(defaultRule.style.width).toBe('100%');
				expect(defaultRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
			}

			// Medium breakpoint should be in media query with the same class name
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
			const mediumMediaRule = mediaRules.find(rule => {
				const mr = rule as CSSMediaRule;
				return mr.media.mediaText === '(min-width: 601px)';
			}) as CSSMediaRule;

			expect(mediumMediaRule).toBeTruthy();
			
			const mediaStyleRules = Array.from(mediumMediaRule.cssRules) as CSSStyleRule[];
			const mediumRule = mediaStyleRules.find(rule => rule.selectorText === `.${className}`);
			expect(mediumRule).toBeTruthy();
			if (mediumRule) {
				expect(mediumRule.style.width).toBe('50%');
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
			
			// Should be a single class name for all styles
			expect(className).toMatch(/^n[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name
		});

		it('should handle empty breakpoints object with default styles', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			const result = cn(bg('#FF0000').fontSize('16px'), {});

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			
			// Should only have default styles (single class)
			expect(className).toMatch(/^n[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name
		});

		it('should handle undefined breakpoints with default styles', () => {
			const cn = createBreakpoints({
				medium: '(min-width: 601px)'
			});

			const result = cn(bg('#FF0000').fontSize('16px'), undefined);

			expect(result).toHaveProperty('className');
			const className = (result as any).className;

			// Should only have default styles (single class)
			expect(className).toMatch(/^n[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name
		});
	});

	describe('createStyleQueries with @media prefix', () => {
		it('should work with explicit @media prefix', () => {
			const cn = createStyleQueries({
				small: '@media (min-width: 341px)',
				medium: '@media (min-width: 601px)',
				large: '@media (min-width: 1025px)',
			});

			const result = cn({
				small: bg('#FF0000').fontSize('20px'),
				medium: bg('#00FF00').fontSize('25px'),
			});

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			expect(className).toMatch(/^n[a-f0-9]{8}$/);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();

			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);

			expect(mediaRules.length).toBe(2);
		});

		it('should work without prefix (backward compatibility)', () => {
			const cn = createStyleQueries({
				medium: '(min-width: 601px)',
			});

			const result = cn({
				medium: bg('#FF0000'),
			});

			expect(result).toHaveProperty('className');

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);

			expect(mediaRules.length).toBe(1);
		});
	});

	describe('createStyleQueries with @container prefix', () => {
		it('should create container queries with @container prefix', () => {
			const cn = createStyleQueries({
				containerSmall: '@container (min-width: 300px)',
				containerLarge: '@container (min-width: 600px)',
			});

			const result = cn({
				containerSmall: bg('#FF0000').fontSize('16px'),
				containerLarge: bg('#00FF00').fontSize('20px'),
			});

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			expect(className).toMatch(/^n[a-f0-9]{8}$/);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();

			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const containerRules = rules.filter(rule => rule instanceof CSSContainerRule);

			expect(containerRules.length).toBe(2);
		});
	});

	describe('createStyleQueries with @supports prefix', () => {
		it('should create feature queries with @supports prefix', () => {
			const cn = createStyleQueries({
				hasGrid: '@supports (display: grid)',
				hasFlex: '@supports (display: flex)',
			});

			const result = cn({
				hasGrid: bg('#FF0000'),
				hasFlex: bg('#00FF00'),
			});

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			expect(className).toMatch(/^n[a-f0-9]{8}$/);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();

			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const supportsRules = rules.filter(rule => rule instanceof CSSSupportsRule);

			expect(supportsRules.length).toBe(2);
		});
	});

	describe('createStyleQueries with mixed query types', () => {
		it('should support mixing @media, @container, and @supports queries', () => {
			const cn = createStyleQueries({
				small: '@media (min-width: 341px)',
				medium: '@media (min-width: 601px)',
				largeContainer: '@container (min-width: 400px)',
				hasGrid: '@supports (display: grid)',
			});

			const result = cn(
				bg('#000000').width('100%'),
				{
					small: bg('#FF0000'),
					medium: bg('#00FF00'),
					largeContainer: width('50%'),
					hasGrid: display('grid'),
				}
			);

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			expect(className).toMatch(/^n[a-f0-9]{8}$/);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();

			const rules = Array.from(styleSheet?.sheet?.cssRules || []);

			// Should have: 1 base style + 2 media + 1 container + 1 supports = 5 rules
			const styleRules = rules.filter(rule => rule.type === CSSRule.STYLE_RULE);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
			const containerRules = rules.filter(rule => rule instanceof CSSContainerRule);
			const supportsRules = rules.filter(rule => rule instanceof CSSSupportsRule);

			expect(styleRules.length).toBe(1); // Base styles
			expect(mediaRules.length).toBe(2); // @media queries
			expect(containerRules.length).toBe(1); // @container queries
			expect(supportsRules.length).toBe(1); // @supports queries
		});
	});

	describe('Backward compatibility with createBreakpoints', () => {
		it('createBreakpoints should be an alias for createStyleQueries', () => {
			expect(createBreakpoints).toBe(createStyleQueries);
		});

		it('should work with old-style breakpoint values (no prefix)', () => {
			const cn = createBreakpoints({
				small: '(min-width: 341px)',
				medium: '(min-width: 601px)',
				large: '(min-width: 1025px)',
			});

			const result = cn({
				small: bg('#FF0000'),
				medium: bg('#00FF00'),
				large: bg('#0000FF'),
			});

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			expect(className).toMatch(/^n[a-f0-9]{8}$/);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);

			expect(mediaRules.length).toBe(3);
		});
	});
});
