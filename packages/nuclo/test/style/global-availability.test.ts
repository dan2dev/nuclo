import { describe, it, expect, beforeEach } from 'vitest';
import '../../src/core/runtimeBootstrap';

describe('Style utilities - global availability', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	it('should have createCSSClass available globally', () => {
		expect(typeof createCSSClass).toBe('function');
	});

	it('should have createBreakpoints available globally', () => {
		expect(typeof createBreakpoints).toBe('function');
	});

	it('should have bg available globally', () => {
		expect(typeof bg).toBe('function');
	});

	it('should have color available globally', () => {
		expect(typeof color).toBe('function');
	});

	it('should have fontSize available globally', () => {
		expect(typeof fontSize).toBe('function');
	});

	it('should have flex available globally', () => {
		expect(typeof flex).toBe('function');
	});

	it('should have center available globally', () => {
		expect(typeof center).toBe('function');
	});

	it('should have bold available globally', () => {
		expect(typeof bold).toBe('function');
	});

	it('should have padding available globally', () => {
		expect(typeof padding).toBe('function');
	});

	it('should have margin available globally', () => {
		expect(typeof margin).toBe('function');
	});

	it('should have width available globally', () => {
		expect(typeof width).toBe('function');
	});

	it('should have height available globally', () => {
		expect(typeof height).toBe('function');
	});

	it('should have border available globally', () => {
		expect(typeof border).toBe('function');
	});

	it('should have borderRadius available globally', () => {
		expect(typeof borderRadius).toBe('function');
	});

	it('should have textAlign available globally', () => {
		expect(typeof textAlign).toBe('function');
	});

	it('should have gap available globally', () => {
		expect(typeof gap).toBe('function');
	});

	it('should have flexDirection available globally', () => {
		expect(typeof flexDirection).toBe('function');
	});

	it('should have grid available globally', () => {
		expect(typeof grid).toBe('function');
	});

	it('should have position available globally', () => {
		expect(typeof position).toBe('function');
	});

	it('should have opacity available globally', () => {
		expect(typeof opacity).toBe('function');
	});

	it('should have cursor available globally', () => {
		expect(typeof cursor).toBe('function');
	});

	it('should work in the example pattern', () => {
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
		// Should contain single classes for each breakpoint
		expect(className).toMatch(/nuclo-small-\d+/);
		expect(className).toMatch(/nuclo-medium-\d+/);
		expect(className).toMatch(/nuclo-large-\d+/);
	});
});
