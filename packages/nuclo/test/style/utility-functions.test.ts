import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	createCSSClass,
	createBreakpoints,
	bg,
	color,
	fontSize,
	flex,
	center,
	bold,
	padding,
	margin,
	width,
	height,
	border,
	borderRadius,
	textAlign,
	gap,
	flexDirection,
	grid,
	position,
	opacity,
	cursor
} from '../../src/style';

describe('Style Utility Functions', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	describe('createCSSClass', () => {
		it('should create a CSS class with basic styles', () => {
			createCSSClass('test-class', {
				'color': 'red',
				'font-size': '16px'
			});

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();
			expect(styleSheet?.sheet?.cssRules.length).toBeGreaterThan(0);
		});

		it('should create style element if it does not exist', () => {
			expect(document.querySelector('#nuclo-styles')).toBeNull();
			createCSSClass('test-class', { 'color': 'blue' });
			expect(document.querySelector('#nuclo-styles')).toBeTruthy();
		});

		it('should reuse existing style element', () => {
			createCSSClass('class-1', { 'color': 'red' });
			const styleSheet1 = document.querySelector('#nuclo-styles');

			createCSSClass('class-2', { 'color': 'blue' });
			const styleSheet2 = document.querySelector('#nuclo-styles');

			expect(styleSheet1).toBe(styleSheet2);
		});
	});

	describe('StyleBuilder - bg()', () => {
		it('should create a StyleBuilder with a single class name', () => {
			const builder = bg('#FF0000');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			// Verify the CSS class has the correct property
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.backgroundColor).toBe('rgb(255, 0, 0)');
			}
		});

		it('should support chaining and create a single class', () => {
			const builder = bg('#FF0000').fontSize('20px');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			// Verify the CSS class has both properties
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.backgroundColor).toBe('rgb(255, 0, 0)');
				expect(rule.style.fontSize).toBe('20px');
			}
		});
	});

	describe('StyleBuilder - color()', () => {
		it('should create a StyleBuilder with a single class name', () => {
			const builder = color('#00FF00');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.color).toBe('rgb(0, 255, 0)');
			}
		});
	});

	describe('StyleBuilder - fontSize()', () => {
		it('should create a StyleBuilder with a single class name', () => {
			const builder = fontSize('24px');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.fontSize).toBe('24px');
			}
		});
	});

	describe('StyleBuilder - flex()', () => {
		it('should set display to flex in a single class', () => {
			const builder = flex();
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.display).toBe('flex');
			}
		});
	});

	describe('StyleBuilder - center()', () => {
		it('should center content with a single class', () => {
			const builder = center();
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.justifyContent).toBe('center');
				expect(rule.style.alignItems).toBe('center');
			}
		});
	});

	describe('StyleBuilder - bold()', () => {
		it('should set font-weight to bold in a single class', () => {
			const builder = bold();
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.fontWeight).toBe('bold');
			}
		});
	});

	describe('StyleBuilder - padding()', () => {
		it('should set padding in a single class', () => {
			const builder = padding('10px');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.padding).toBe('10px');
			}
		});
	});

	describe('StyleBuilder - margin()', () => {
		it('should set margin in a single class', () => {
			const builder = margin('20px');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.margin).toBe('20px');
			}
		});
	});

	describe('StyleBuilder - width()', () => {
		it('should set width in a single class', () => {
			const builder = width('100px');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.width).toBe('100px');
			}
		});
	});

	describe('StyleBuilder - height()', () => {
		it('should set height in a single class', () => {
			const builder = height('200px');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.height).toBe('200px');
			}
		});
	});

	describe('StyleBuilder - border()', () => {
		it('should set border in a single class', () => {
			const builder = border('1px solid black');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.border).toBe('1px solid black');
			}
		});
	});

	describe('StyleBuilder - borderRadius()', () => {
		it('should set border-radius in a single class', () => {
			const builder = borderRadius('8px');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.borderRadius).toBe('8px');
			}
		});
	});

	describe('StyleBuilder - textAlign()', () => {
		it('should set text-align in a single class', () => {
			const builder = textAlign('center');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.textAlign).toBe('center');
			}
		});
	});

	describe('StyleBuilder - gap()', () => {
		it('should set gap in a single class', () => {
			const builder = gap('10px');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.gap).toBe('10px');
			}
		});
	});

	describe('StyleBuilder - flexDirection()', () => {
		it('should set flex-direction in a single class', () => {
			const builder = flexDirection('column');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.flexDirection).toBe('column');
			}
		});
	});

	describe('StyleBuilder - grid()', () => {
		it('should set display to grid in a single class', () => {
			const builder = grid();
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.display).toBe('grid');
			}
		});
	});

	describe('StyleBuilder - position()', () => {
		it('should set position in a single class', () => {
			const builder = position('absolute');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.position).toBe('absolute');
			}
		});
	});

	describe('StyleBuilder - opacity()', () => {
		it('should set opacity in a single class', () => {
			const builder = opacity('0.5');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.opacity).toBe('0.5');
			}
		});
	});

	describe('StyleBuilder - cursor()', () => {
		it('should set cursor in a single class', () => {
			const builder = cursor('pointer');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.cursor).toBe('pointer');
			}
		});
	});

	describe('StyleBuilder - chaining multiple properties', () => {
		it('should allow chaining multiple properties into a single class', () => {
			const builder = bg('#FF0000')
				.fontSize('20px')
				.flex()
				.center()
				.bold();

			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			// Verify all properties are in the single class
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.backgroundColor).toBe('rgb(255, 0, 0)');
				expect(rule.style.fontSize).toBe('20px');
				expect(rule.style.display).toBe('flex');
				expect(rule.style.justifyContent).toBe('center');
				expect(rule.style.alignItems).toBe('center');
				expect(rule.style.fontWeight).toBe('bold');
			}
		});

		it('should support complex chaining in a single class', () => {
			const builder = flex()
				.flexDirection('column')
				.gap('16px')
				.padding('24px')
				.borderRadius('12px')
				.bg('#F0F0F0');

			const classNames = builder.getClassNames();
			expect(classNames.length).toBe(1);
			expect(classNames[0]).toMatch(/^nuclo-[a-f0-9]{8}$/);
			
			// Verify all properties are in the single class
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []) as CSSStyleRule[];
			const rule = rules.find(r => r.selectorText === `.${classNames[0]}`);
			expect(rule).toBeTruthy();
			if (rule) {
				expect(rule.style.display).toBe('flex');
				expect(rule.style.flexDirection).toBe('column');
				expect(rule.style.gap).toBe('16px');
				expect(rule.style.padding).toBe('24px');
				expect(rule.style.borderRadius).toBe('12px');
				expect(rule.style.backgroundColor).toBe('rgb(240, 240, 240)');
			}
		});

		it('should reuse the same class for identical style sets', () => {
			const builder1 = bg('#FF0000').fontSize('20px');
			const builder2 = bg('#FF0000').fontSize('20px');
			
			const className1 = builder1.getClassNames()[0];
			const className2 = builder2.getClassNames()[0];
			
			// Should reuse the same class
			expect(className1).toBe(className2);
		});
	});

	describe('createBreakpoints', () => {
		it('should create a breakpoint function', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)',
				large: '(min-width: 601px)'
			});

			expect(typeof cn).toBe('function');
		});

		it('should return empty string when no styles provided', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)'
			});

			const className = cn();
			expect(className).toBe('');
		});

		it('should return empty string when empty styles object provided', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)'
			});

			const className = cn({});
			expect(className).toBe('');
		});

		it('should generate an object with className property when styles provided', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)',
				large: '(min-width: 601px)'
			});

			const result = cn({
				small: bg('#FF0000').fontSize('20px'),
				large: bg('#0000FF').fontSize('30px')
			});

			expect(result).toHaveProperty('className');
			const className = (result as any).className;
			// Should contain a single class name for all breakpoints
			expect(className).toMatch(/^nuclo-[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name
			
			// Verify CSS properties are correct
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE) as CSSMediaRule[];
			
			// Find small breakpoint media rule
			const smallMediaRule = mediaRules.find(rule => rule.media.mediaText === '(max-width: 600px)');
			expect(smallMediaRule).toBeTruthy();
			if (smallMediaRule) {
				const smallStyleRules = Array.from(smallMediaRule.cssRules) as CSSStyleRule[];
				// The class name should be the same for all breakpoints
				const className = (result as any).className;
				const smallRule = smallStyleRules.find(r => r.selectorText === `.${className}`);
				expect(smallRule).toBeTruthy();
				if (smallRule) {
					expect(smallRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
					expect(smallRule.style.fontSize).toBe('20px');
				}
			}
		});

		it('should create CSS rules with media queries', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)',
				large: '(min-width: 601px)'
			});

			cn({
				small: bg('#FF0000'),
				large: bg('#0000FF')
			});

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();
			expect(styleSheet?.sheet?.cssRules.length).toBeGreaterThan(0);
		});

		it('should generate class names for each call', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)'
			});

			const result1 = cn({ small: bg('#FF0000') });
			const result2 = cn({ small: bg('#00FF00') });

			const className1 = (result1 as any).className;
			const className2 = (result2 as any).className;
			
			// Both should have single class names (without breakpoint prefix)
			expect(className1).toMatch(/^nuclo-[a-f0-9]{8}$/);
			expect(className2).toMatch(/^nuclo-[a-f0-9]{8}$/);
			// They should be different since they have different styles
			expect(className1).not.toBe(className2);
			
			// Verify CSS properties
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE) as CSSMediaRule[];
			const smallMediaRule = mediaRules.find(rule => rule.media.mediaText === '(max-width: 600px)');
			expect(smallMediaRule).toBeTruthy();
		});

		it('should handle partial breakpoint styles', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)',
				medium: '(min-width: 601px) and (max-width: 1024px)',
				large: '(min-width: 1025px)'
			});

			const result = cn({
				small: bg('#FF0000'),
				large: bg('#0000FF')
				// medium is intentionally omitted
			});

			const className = (result as any).className;
			// Should contain a single class name for all breakpoints
			expect(className).toMatch(/^nuclo-[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name
		});

		it('should work with complex style chains in breakpoints', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)',
				large: '(min-width: 601px)'
			});

			const result = cn({
				small: bg('#FF0000').fontSize('20px').flex().center().bold(),
				large: bg('#0000FF').fontSize('50px').flex().center().bold()
			});

			const className = (result as any).className;
			// Should have a single class name for all breakpoints
			expect(className).toMatch(/^nuclo-[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name

			// Verify CSS properties in media queries
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();
			
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE) as CSSMediaRule[];
			
			// Check small breakpoint (reuse className from above)
			const smallMediaRule = mediaRules.find(rule => rule.media.mediaText === '(max-width: 600px)');
			expect(smallMediaRule).toBeTruthy();
			if (smallMediaRule) {
				const smallStyleRules = Array.from(smallMediaRule.cssRules) as CSSStyleRule[];
				// The class name should be the same for all breakpoints
				const smallRule = smallStyleRules.find(r => r.selectorText === `.${className}`);
				expect(smallRule).toBeTruthy();
				if (smallRule) {
					expect(smallRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
					expect(smallRule.style.fontSize).toBe('20px');
					expect(smallRule.style.display).toBe('flex');
					expect(smallRule.style.justifyContent).toBe('center');
					expect(smallRule.style.alignItems).toBe('center');
					expect(smallRule.style.fontWeight).toBe('bold');
				}
			}
		});
	});

	describe('integration with example usage', () => {
		it('should support the example pattern from main.ts', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)',
				medium: '(min-width: 601px) and (max-width: 1024px)',
				large: '(min-width: 1025px)'
			});

			const result = cn({
				small: bg('#FF0000').fontSize('20px').flex().center().bold(),
				medium: bg('#00FF00').fontSize('40px').flex().center().bold(),
				large: bg('#0000FF').fontSize('50px').flex().center().bold()
			});

			const className = (result as any).className;
			// Should contain a single class name for all breakpoints
			expect(className).toMatch(/^nuclo-[a-f0-9]{8}$/);
			expect(className.split(' ').length).toBe(1); // Only one class name

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();
			// Check that media queries were created
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
			expect(mediaRules.length).toBeGreaterThanOrEqual(3); // At least 3 media queries (small, medium, large)
		});
	});
});
