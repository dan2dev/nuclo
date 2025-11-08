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
		it('should create a StyleBuilder with background-color', () => {
			const builder = bg('#FF0000');
			const styles = builder.getStyles();
			expect(styles['background-color']).toBe('#FF0000');
		});

		it('should support chaining', () => {
			const builder = bg('#FF0000').fontSize('20px');
			const styles = builder.getStyles();
			expect(styles['background-color']).toBe('#FF0000');
			expect(styles['font-size']).toBe('20px');
		});
	});

	describe('StyleBuilder - color()', () => {
		it('should create a StyleBuilder with color', () => {
			const builder = color('#00FF00');
			const styles = builder.getStyles();
			expect(styles['color']).toBe('#00FF00');
		});
	});

	describe('StyleBuilder - fontSize()', () => {
		it('should create a StyleBuilder with font-size', () => {
			const builder = fontSize('24px');
			const styles = builder.getStyles();
			expect(styles['font-size']).toBe('24px');
		});
	});

	describe('StyleBuilder - flex()', () => {
		it('should set display to flex', () => {
			const builder = flex();
			const styles = builder.getStyles();
			expect(styles['display']).toBe('flex');
		});
	});

	describe('StyleBuilder - center()', () => {
		it('should center content with flex', () => {
			const builder = center();
			const styles = builder.getStyles();
			expect(styles['justify-content']).toBe('center');
			expect(styles['align-items']).toBe('center');
		});
	});

	describe('StyleBuilder - bold()', () => {
		it('should set font-weight to bold', () => {
			const builder = bold();
			const styles = builder.getStyles();
			expect(styles['font-weight']).toBe('bold');
		});
	});

	describe('StyleBuilder - padding()', () => {
		it('should set padding', () => {
			const builder = padding('10px');
			const styles = builder.getStyles();
			expect(styles['padding']).toBe('10px');
		});
	});

	describe('StyleBuilder - margin()', () => {
		it('should set margin', () => {
			const builder = margin('20px');
			const styles = builder.getStyles();
			expect(styles['margin']).toBe('20px');
		});
	});

	describe('StyleBuilder - width()', () => {
		it('should set width', () => {
			const builder = width('100px');
			const styles = builder.getStyles();
			expect(styles['width']).toBe('100px');
		});
	});

	describe('StyleBuilder - height()', () => {
		it('should set height', () => {
			const builder = height('200px');
			const styles = builder.getStyles();
			expect(styles['height']).toBe('200px');
		});
	});

	describe('StyleBuilder - border()', () => {
		it('should set border', () => {
			const builder = border('1px solid black');
			const styles = builder.getStyles();
			expect(styles['border']).toBe('1px solid black');
		});
	});

	describe('StyleBuilder - borderRadius()', () => {
		it('should set border-radius', () => {
			const builder = borderRadius('8px');
			const styles = builder.getStyles();
			expect(styles['border-radius']).toBe('8px');
		});
	});

	describe('StyleBuilder - textAlign()', () => {
		it('should set text-align', () => {
			const builder = textAlign('center');
			const styles = builder.getStyles();
			expect(styles['text-align']).toBe('center');
		});
	});

	describe('StyleBuilder - gap()', () => {
		it('should set gap', () => {
			const builder = gap('10px');
			const styles = builder.getStyles();
			expect(styles['gap']).toBe('10px');
		});
	});

	describe('StyleBuilder - flexDirection()', () => {
		it('should set flex-direction', () => {
			const builder = flexDirection('column');
			const styles = builder.getStyles();
			expect(styles['flex-direction']).toBe('column');
		});
	});

	describe('StyleBuilder - grid()', () => {
		it('should set display to grid', () => {
			const builder = grid();
			const styles = builder.getStyles();
			expect(styles['display']).toBe('grid');
		});
	});

	describe('StyleBuilder - position()', () => {
		it('should set position', () => {
			const builder = position('absolute');
			const styles = builder.getStyles();
			expect(styles['position']).toBe('absolute');
		});
	});

	describe('StyleBuilder - opacity()', () => {
		it('should set opacity', () => {
			const builder = opacity('0.5');
			const styles = builder.getStyles();
			expect(styles['opacity']).toBe('0.5');
		});
	});

	describe('StyleBuilder - cursor()', () => {
		it('should set cursor', () => {
			const builder = cursor('pointer');
			const styles = builder.getStyles();
			expect(styles['cursor']).toBe('pointer');
		});
	});

	describe('StyleBuilder - chaining multiple properties', () => {
		it('should allow chaining multiple properties', () => {
			const builder = bg('#FF0000')
				.fontSize('20px')
				.flex()
				.center()
				.bold();

			const styles = builder.getStyles();
			expect(styles['background-color']).toBe('#FF0000');
			expect(styles['font-size']).toBe('20px');
			expect(styles['display']).toBe('flex');
			expect(styles['justify-content']).toBe('center');
			expect(styles['align-items']).toBe('center');
			expect(styles['font-weight']).toBe('bold');
		});

		it('should support complex chaining', () => {
			const builder = flex()
				.flexDirection('column')
				.gap('16px')
				.padding('24px')
				.borderRadius('12px')
				.bg('#F0F0F0');

			const styles = builder.getStyles();
			expect(styles['display']).toBe('flex');
			expect(styles['flex-direction']).toBe('column');
			expect(styles['gap']).toBe('16px');
			expect(styles['padding']).toBe('24px');
			expect(styles['border-radius']).toBe('12px');
			expect(styles['background-color']).toBe('#F0F0F0');
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
			expect((result as any).className).toMatch(/^nuclo-bp-\d+$/);
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

		it('should generate unique class names for each call', () => {
			const cn = createBreakpoints({
				small: '(max-width: 600px)'
			});

			const result1 = cn({ small: bg('#FF0000') });
			const result2 = cn({ small: bg('#00FF00') });

			expect((result1 as any).className).not.toBe((result2 as any).className);
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

			expect((result as any).className).toMatch(/^nuclo-bp-\d+$/);
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

			expect((result as any).className).toMatch(/^nuclo-bp-\d+$/);

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

			expect((result as any).className).toMatch(/^nuclo-bp-\d+$/);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			expect(styleSheet).toBeTruthy();
			expect(styleSheet?.sheet?.cssRules.length).toBe(3); // One for each breakpoint
		});
	});
});
