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
		expect((result as any).className).toMatch(/^nuclo-bp-\d+$/);
	});

	it('should return className property', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		const result = cn({
			small: bg('#FF0000')
		});

		expect((result as any).className).toMatch(/^nuclo-bp-\d+$/);
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
		expect(element.className).toMatch(/^nuclo-bp-\d+$/);
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
		const rules = Array.from(styleSheet?.sheet?.cssRules || []);
		const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
		expect(mediaRules.length).toBe(2); // One for small, one for large
	});
});
