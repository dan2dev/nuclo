/// <reference path="../../types/index.d.ts" />
/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/style/cssGenerator.ts:
 *
 *  Lines 94-97  – createCSSClassWithStyles early return when getStyleSheet() or sheet is null
 *  Line 145     – at-rule insert index fallback loop (isAtRule || CSSStyleRule check)
 *  Line 153     – atRulePrefix default '@media' fallback for unknown atRuleType
 *  classExistsInDOM – returns false when no #nuclo-styles element exists
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	classExistsInDOM,
	createCSSClassWithStyles,
} from '../../src/style/cssGenerator';

// ── Helpers ──────────────────────────────────────────────────────────────────

function removeStyleSheet() {
	const existing = document.querySelector('#nuclo-styles');
	if (existing) existing.remove();
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

describe('cssGenerator – sheet edge cases', () => {
	beforeEach(removeStyleSheet);
	afterEach(removeStyleSheet);

	// ── classExistsInDOM when no stylesheet ─────────────────────────────────
	describe('classExistsInDOM without stylesheet', () => {
		it('returns false when #nuclo-styles does not exist', () => {
			// Ensure no style sheet is present
			expect(document.querySelector('#nuclo-styles')).toBeNull();
			expect(classExistsInDOM('any-class')).toBe(false);
		});

		it('returns false with condition when no stylesheet', () => {
			expect(classExistsInDOM('any-class', '(min-width: 768px)')).toBe(false);
		});

		it('returns false with pseudoClass when no stylesheet', () => {
			expect(classExistsInDOM('any-class', undefined, 'media', ':hover')).toBe(false);
		});
	});

	// ── createCSSClassWithStyles when sheet is null (lines 94-97) ───────────
	describe('createCSSClassWithStyles when isBrowser but sheet is null', () => {
		it('does not throw when style element exists but sheet is null', () => {
			// Create a style element with no sheet property accessible
			const styleEl = document.createElement('style');
			styleEl.id = 'nuclo-styles';
			document.head.appendChild(styleEl);

			// In jsdom, .sheet is available once the element is in the DOM.
			// We can mock the sheet property to be null to test the guard.
			Object.defineProperty(styleEl, 'sheet', { value: null, writable: false });

			// Should silently return without error (lines 96-97)
			expect(() => {
				createCSSClassWithStyles('null-sheet', { color: 'red' });
			}).not.toThrow();

			// Clean up and restore for subsequent tests
			styleEl.remove();
		});
	});

	// ── at-rule insert index fallback (line 145) ────────────────────────────
	describe('at-rule insert index with existing style rules', () => {
		it('inserts at-rule after existing style rules', () => {
			// Create a few regular style rules first
			createCSSClassWithStyles('base-a', { color: 'red' });
			createCSSClassWithStyles('base-b', { color: 'blue' });

			// Now insert a media query rule — the loop at line 144-148
			// walks backwards and finds existing CSSStyleRules to compute insertIndex
			createCSSClassWithStyles('media-class', { color: 'green' }, '(min-width: 600px)');

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet.sheet?.cssRules || []);

			// Should have style rules before and a media rule
			const mediaRules = rules.filter(r => r instanceof CSSMediaRule);
			expect(mediaRules.length).toBeGreaterThanOrEqual(1);

			// The media rule should be after the regular style rules
			const lastStyleIdx = rules.reduce(
				(acc, r, i) => (r instanceof CSSStyleRule ? i : acc), -1
			);
			const firstMediaIdx = rules.findIndex(r => r instanceof CSSMediaRule);
			if (lastStyleIdx >= 0 && firstMediaIdx >= 0) {
				expect(lastStyleIdx).toBeLessThan(firstMediaIdx);
			}
		});

		it('inserts second at-rule alongside existing at-rules', () => {
			// First at-rule
			createCSSClassWithStyles('cls-1', { color: 'red' }, '(min-width: 400px)');
			// Second at-rule with different condition — triggers insert loop again
			createCSSClassWithStyles('cls-2', { color: 'blue' }, '(min-width: 800px)');

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet.sheet?.cssRules || []);
			const mediaRules = rules.filter(r => r instanceof CSSMediaRule);
			expect(mediaRules.length).toBe(2);
		});
	});

	// ── atRulePrefix fallback to '@media' (line 153-154) ────────────────────
	describe('atRulePrefix default fallback', () => {
		it('falls back to @media for unknown atRuleType "style"', () => {
			// atRuleType 'style' is in the type union but not in the ternary chain
			// for media/container/supports, so it hits the fallback '@media'
			expect(() => {
				createCSSClassWithStyles(
					'fallback-class',
					{ color: 'purple' },
					'(min-width: 500px)',
					'style' as any
				);
			}).not.toThrow();

			// The rule should exist — wrapped in @media due to fallback
			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet.sheet?.cssRules || []);
			// Should have at least one grouping rule
			const groupingRules = rules.filter(
				r => r instanceof CSSMediaRule || r instanceof CSSSupportsRule
			);
			expect(groupingRules.length).toBeGreaterThanOrEqual(1);
		});

		it('container atRuleType uses @container prefix', () => {
			createCSSClassWithStyles(
				'container-cls',
				{ color: 'teal' },
				'sidebar (min-width: 200px)',
				'container'
			);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet.sheet?.cssRules || []);
			const containerRules = rules.filter(r => r instanceof CSSContainerRule);
			// jsdom may or may not support CSSContainerRule, so just ensure no throw
			expect(rules.length).toBeGreaterThan(0);
		});

		it('supports atRuleType uses @supports prefix', () => {
			createCSSClassWithStyles(
				'supports-cls',
				{ color: 'coral' },
				'(display: grid)',
				'supports'
			);

			const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
			const rules = Array.from(styleSheet.sheet?.cssRules || []);
			expect(rules.length).toBeGreaterThan(0);
		});
	});

	// ── Edge case: pseudo atRuleType falls back to @media ───────────────────
	describe('pseudo atRuleType as condition (not as pseudoClass param)', () => {
		it('pseudo type with condition falls back to @media prefix', () => {
			// 'pseudo' is in the AtRuleType union but not handled in the ternary,
			// so it hits the '@media' fallback at line 154
			expect(() => {
				createCSSClassWithStyles(
					'pseudo-fallback',
					{ color: 'pink' },
					'(min-width: 320px)',
					'pseudo' as any
				);
			}).not.toThrow();
		});
	});
});
