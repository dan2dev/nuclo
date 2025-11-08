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
		it('should create a StyleBuilder with background-color class', () => {
			const builder = bg('#FF0000');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('bg-ff0000');
		});

		it('should support chaining', () => {
			const builder = bg('#FF0000').fontSize('20px');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('bg-ff0000');
			expect(classNames).toContain('text-20px');
		});
	});

	describe('StyleBuilder - color()', () => {
		it('should create a StyleBuilder with color class', () => {
			const builder = color('#00FF00');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('text-00ff00');
		});
	});

	describe('StyleBuilder - fontSize()', () => {
		it('should create a StyleBuilder with font-size class', () => {
			const builder = fontSize('24px');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('text-24px');
		});
	});

	describe('StyleBuilder - flex()', () => {
		it('should set display to flex class', () => {
			const builder = flex();
			const classNames = builder.getClassNames();
			expect(classNames).toContain('flex');
		});
	});

	describe('StyleBuilder - center()', () => {
		it('should center content with flex classes', () => {
			const builder = center();
			const classNames = builder.getClassNames();
			expect(classNames).toContain('justify-center');
			expect(classNames).toContain('items-center');
		});
	});

	describe('StyleBuilder - bold()', () => {
		it('should set font-weight to bold class', () => {
			const builder = bold();
			const classNames = builder.getClassNames();
			expect(classNames).toContain('font-bold');
		});
	});

	describe('StyleBuilder - padding()', () => {
		it('should set padding class', () => {
			const builder = padding('10px');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('p-10px');
		});
	});

	describe('StyleBuilder - margin()', () => {
		it('should set margin class', () => {
			const builder = margin('20px');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('m-20px');
		});
	});

	describe('StyleBuilder - width()', () => {
		it('should set width class', () => {
			const builder = width('100px');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('w-100px');
		});
	});

	describe('StyleBuilder - height()', () => {
		it('should set height class', () => {
			const builder = height('200px');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('h-200px');
		});
	});

	describe('StyleBuilder - border()', () => {
		it('should set border class', () => {
			const builder = border('1px solid black');
			const classNames = builder.getClassNames();
			expect(classNames.length).toBeGreaterThan(0);
			// Border values are complex, just check a class was created
			expect(classNames[0]).toMatch(/^border-/);
		});
	});

	describe('StyleBuilder - borderRadius()', () => {
		it('should set border-radius class', () => {
			const builder = borderRadius('8px');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('rounded-8px');
		});
	});

	describe('StyleBuilder - textAlign()', () => {
		it('should set text-align class', () => {
			const builder = textAlign('center');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('text-center');
		});
	});

	describe('StyleBuilder - gap()', () => {
		it('should set gap class', () => {
			const builder = gap('10px');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('gap-10px');
		});
	});

	describe('StyleBuilder - flexDirection()', () => {
		it('should set flex-direction class', () => {
			const builder = flexDirection('column');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('flex-col');
		});
	});

	describe('StyleBuilder - grid()', () => {
		it('should set display to grid class', () => {
			const builder = grid();
			const classNames = builder.getClassNames();
			expect(classNames).toContain('grid');
		});
	});

	describe('StyleBuilder - position()', () => {
		it('should set position class', () => {
			const builder = position('absolute');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('position-absolute');
		});
	});

	describe('StyleBuilder - opacity()', () => {
		it('should set opacity class', () => {
			const builder = opacity('0.5');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('opacity-0-5');
		});
	});

	describe('StyleBuilder - cursor()', () => {
		it('should set cursor class', () => {
			const builder = cursor('pointer');
			const classNames = builder.getClassNames();
			expect(classNames).toContain('cursor-pointer');
		});
	});

	describe('StyleBuilder - chaining multiple properties', () => {
		it('should allow chaining multiple properties', () => {
			const builder = bg('#FF0000')
				.fontSize('20px')
				.flex()
				.center()
				.bold();

			const classNames = builder.getClassNames();
			expect(classNames).toContain('bg-ff0000');
			expect(classNames).toContain('text-20px');
			expect(classNames).toContain('flex');
			expect(classNames).toContain('justify-center');
			expect(classNames).toContain('items-center');
			expect(classNames).toContain('font-bold');
		});

		it('should support complex chaining', () => {
			const builder = flex()
				.flexDirection('column')
				.gap('16px')
				.padding('24px')
				.borderRadius('12px')
				.bg('#F0F0F0');

			const classNames = builder.getClassNames();
			expect(classNames).toContain('flex');
			expect(classNames).toContain('flex-col');
			expect(classNames).toContain('gap-16px');
			expect(classNames).toContain('p-24px');
			expect(classNames).toContain('rounded-12px');
			expect(classNames).toContain('bg-f0f0f0');
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
			// Should contain base (small) breakpoint classes
			expect(className).toContain('bg-ff0000');
			expect(className).toContain('text-20px');
			// Should contain prefixed large breakpoint classes
			expect(className).toContain('large-bg-0000ff');
			expect(className).toContain('large-text-30px');
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

		it('should generate utility class names for each call', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)'
			});

			const result1 = cn({ small: bg('#FF0000') });
			const result2 = cn({ small: bg('#00FF00') });

			expect((result1 as any).className).toContain('bg-ff0000');
			expect((result2 as any).className).toContain('bg-00ff00');
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
			// Should contain base (small) breakpoint class
			expect(className).toContain('bg-ff0000');
			// Should contain prefixed large breakpoint class
			expect(className).toContain('large-bg-0000ff');
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
			expect(className).toContain('bg-ff0000');
			expect(className).toContain('text-20px');
			expect(className).toContain('flex');
			expect(className).toContain('justify-center');
			expect(className).toContain('items-center');
			expect(className).toContain('font-bold');

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();
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
			// Should contain base (small) breakpoint classes
			expect(className).toContain('bg-ff0000');
			expect(className).toContain('text-20px');
			expect(className).toContain('flex');
			expect(className).toContain('justify-center');
			expect(className).toContain('items-center');
			expect(className).toContain('font-bold');
			// Should contain prefixed medium/large breakpoint classes
			expect(className).toContain('medium-bg-00ff00');
			expect(className).toContain('medium-text-40px');
			expect(className).toContain('large-bg-0000ff');
			expect(className).toContain('large-text-50px');

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();
			// Check that media queries were created (base + 2 media queries)
			const rules = Array.from(styleSheet?.sheet?.cssRules || []);
			const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
			expect(mediaRules.length).toBeGreaterThanOrEqual(2); // At least 2 media queries
		});
	});
});
