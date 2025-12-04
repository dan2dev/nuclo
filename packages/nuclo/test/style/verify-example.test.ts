import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/core/runtimeBootstrap';
import '../../types';

describe('Verify example pattern works correctly', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	it('should match the exact pattern from main.ts', () => {
		const { div, h1, input } = globalThis as any;

		const cn = createBreakpoints({
			small: '(max-width: 600px)',
			medium: '(min-width: 601px) and (max-width: 1024px)',
			large: '(min-width: 1025px)'
		});

		const styles = {
			header: cn({
				small: bg('#FF0000').fontSize('20px').flex().center().bold(),
				medium: bg('#00FF00').fontSize('40px').flex().center().bold(),
				large: bg('#0000FF').fontSize('50px').flex().center().bold()
			})
		};

		// Create the exact structure from the example
		const app = div(
			{ className: 'todo-app' },
			h1('Todo List'),
			styles.header,
			div(
				{ className: 'input-section' },
				cn(),
				input(
					cn({
						small: bg('#FF0000')
					}),
					{ type: 'text', placeholder: 'What needs to be done?' }
				)
			)
		)();

		// Verify parent has its className (and the breakpoint class from styles.header)
		expect(app.className).toContain('todo-app');
		const appClassName = app.className;
		// Should contain a single class name for all breakpoints
		expect(appClassName).toMatch(/n[a-f0-9]{8}/);
		expect(appClassName.split(' ').filter(c => c.startsWith('n')).length).toBe(1); // Only one nuclo class

		// Verify h1 exists
		const h1Element = app.querySelector('h1');
		expect(h1Element?.textContent).toBe('Todo List');

		// Verify input-section div exists
		const inputSection = app.querySelector('.input-section');
		expect(inputSection).toBeTruthy();

		// Verify input exists with breakpoint class (single class name)
		const inputElement = inputSection?.querySelector('input');
		expect(inputElement).toBeTruthy();
		expect(inputElement?.className).toMatch(/n[a-f0-9]{8}/);

		// Verify CSS rules were created
		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();
		const rules = Array.from(styleSheet?.sheet?.cssRules || []);
		const mediaRules = rules.filter(rule => rule.type === CSSRule.MEDIA_RULE);
		expect(mediaRules.length).toBeGreaterThan(0);

		// Verify that styles.header added a className to the parent div
		// Since styles.header is an object with className property, it should be applied to the div
		expect(app.className).toContain('todo-app');
	});
});
