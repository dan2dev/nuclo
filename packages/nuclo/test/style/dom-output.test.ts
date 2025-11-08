import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/core/runtimeBootstrap';

describe('Style utilities - DOM Output', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	it('should apply className to div element when using breakpoint modifier as child', () => {
		const { div, h1 } = globalThis as any;

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

		// Create a div that applies the breakpoint modifier to itself
		const header = div(
			styles.header,
			'Header Content'
		)();

		// Verify the breakpoint className was applied to the header div
		expect(header.className).toMatch(/^nuclo-bp-\d+$/);
		expect(header.textContent).toContain('Header Content');

		// Verify CSS classes were created
		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();
		expect(styleSheet?.sheet?.cssRules.length).toBeGreaterThan(0);
	});

	it('should correctly render breakpoint className in the DOM', () => {
		const { div } = globalThis as any;
		const container = document.createElement('div');
		document.body.appendChild(container);

		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		const modifier = cn({
			small: bg('#FF0000').fontSize('20px')
		});

		const element = div(modifier, 'Test Content')();
		container.appendChild(element);

		// The element should have the generated className applied
		expect(element.className).toMatch(/^nuclo-bp-\d+$/);
		expect(element.textContent).toContain('Test Content');

		// Verify in the actual DOM HTML
		expect(container.innerHTML).toMatch(/class="nuclo-bp-\d+"/);
	});
});
