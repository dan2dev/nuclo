/// <reference path="../../types/index.d.ts" />
/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/style/styleBuilder.ts:
 *
 *  Line 564         – registerStyleMethods: shorthand method body (isShorthand → add with defaultValue)
 *  Lines 582-583    – createStyleFunction for shorthand standalone functions
 *  Lines 584-585    – createStyleFunction for regular standalone functions
 *  Lines 600-601    – Special method exports: bold() and center() as standalone functions
 */

import { describe, it, expect } from 'vitest';
import {
	StyleBuilder,
	grid,
	display,
	bold,
	center,
	flex,
	bg,
	fontSize,
} from '../../src/style/styleBuilder';

// ── Unit: shorthand standalone function – grid() (lines 582-583) ────────────
describe('Standalone shorthand functions (createStyleFunction isShorthand)', () => {
	it('grid() returns a StyleBuilder with display:grid', () => {
		const sb = grid();
		expect(sb).toBeInstanceOf(StyleBuilder);
		expect(sb.getStyles()).toEqual({ 'display': 'grid' });
	});

	it('grid() ignores any argument (shorthand always uses defaultValue)', () => {
		// Shorthand signature is () => StyleBuilder, no value param
		const sb = grid();
		expect(sb.getStyles()['display']).toBe('grid');
	});
});

// ── Unit: shorthand method via chaining (line 564) ──────────────────────────
describe('StyleBuilder shorthand method chaining (registerStyleMethods isShorthand)', () => {
	it('grid() method on builder sets display:grid and returns this', () => {
		const sb = new StyleBuilder();
		const result = sb.grid();
		expect(result).toBe(sb); // returns this for chaining
		expect(sb.getStyles()['display']).toBe('grid');
	});

	it('grid() chains with other methods', () => {
		const styles = new StyleBuilder()
			.grid()
			.add('gap', '16px')
			.add('color', 'red')
			.getStyles();

		expect(styles['display']).toBe('grid');
		expect(styles['gap']).toBe('16px');
		expect(styles['color']).toBe('red');
	});
});

// ── Unit: regular standalone function – display(), fontSize() (lines 584-585)
describe('Standalone regular functions (createStyleFunction non-shorthand)', () => {
	it('display("flex") returns a StyleBuilder with display:flex', () => {
		const sb = display('flex');
		expect(sb).toBeInstanceOf(StyleBuilder);
		expect(sb.getStyles()).toEqual({ 'display': 'flex' });
	});

	it('display("block") sets display:block', () => {
		const sb = display('block');
		expect(sb.getStyles()['display']).toBe('block');
	});

	it('fontSize("18px") returns a StyleBuilder with font-size:18px', () => {
		const sb = fontSize('18px');
		expect(sb).toBeInstanceOf(StyleBuilder);
		expect(sb.getStyles()).toEqual({ 'font-size': '18px' });
	});

	it('bg("#ff0") sets background-color property', () => {
		const sb = bg('#ff0');
		expect(sb).toBeInstanceOf(StyleBuilder);
		const styles = sb.getStyles();
		expect(styles['background-color']).toBe('#ff0');
	});

	it('regular function with no argument defaults to empty string', () => {
		const sb = display();
		expect(sb.getStyles()['display']).toBe('');
	});
});

// ── Unit: special method exports – bold(), center(), flex() (lines 599-603) ─
describe('Special method standalone exports (lines 599-603)', () => {
	it('bold() returns a StyleBuilder with font-weight:bold', () => {
		const sb = bold();
		expect(sb).toBeInstanceOf(StyleBuilder);
		expect(sb.getStyles()).toEqual({ 'font-weight': 'bold' });
	});

	it('center() returns a StyleBuilder with flex centering styles', () => {
		const sb = center();
		expect(sb).toBeInstanceOf(StyleBuilder);
		const styles = sb.getStyles();
		expect(styles['justify-content']).toBe('center');
		expect(styles['align-items']).toBe('center');
	});

	it('flex() standalone with no argument sets display:flex', () => {
		const sb = flex();
		expect(sb).toBeInstanceOf(StyleBuilder);
		expect(sb.getStyles()['display']).toBe('flex');
	});

	it('flex("1 0 auto") standalone sets flex property', () => {
		const sb = flex('1 0 auto');
		expect(sb).toBeInstanceOf(StyleBuilder);
		expect(sb.getStyles()['flex']).toBe('1 0 auto');
	});
});

// ── Integration: combining standalone functions with chaining ────────────────
describe('Standalone functions compose with method chaining', () => {
	it('grid() standalone followed by method calls accumulates styles', () => {
		const styles = grid().add('gap', '8px').add('padding', '16px').getStyles();
		expect(styles['display']).toBe('grid');
		expect(styles['gap']).toBe('8px');
		expect(styles['padding']).toBe('16px');
	});

	it('bold() standalone followed by fontSize accumulates', () => {
		const styles = bold().add('font-size', '24px').getStyles();
		expect(styles['font-weight']).toBe('bold');
		expect(styles['font-size']).toBe('24px');
	});
});
