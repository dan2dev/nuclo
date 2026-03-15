/// <reference path="../../types/index.d.ts" />
import { beforeEach, describe, expect, it } from 'vitest';
import { bg, createBreakpoints, padding, width } from '../../src/style';

describe('named classNames with cn()', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	it('returns the provided class name when no styles are passed', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		expect(cn('named-only')).toEqual({ className: 'named-only' });
		expect(document.querySelector('#nuclo-styles')).toBeNull();
	});

	it('uses the provided class name for default styles', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		const result = cn('named-default-card', bg('#FF0000').padding('12px'));
		expect(result.className).toMatch(/^named-default-card_[0-9a-f]{8}$/);

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();

		const rules = Array.from(styleSheet.sheet?.cssRules || []) as CSSStyleRule[];
		const rule = rules.find((cssRule) => cssRule.selectorText === `.${result.className}`);
		expect(rule).toBeTruthy();

		if (rule) {
			expect(rule.style.backgroundColor).toBe('rgb(255, 0, 0)');
			expect(rule.style.padding).toBe('12px');
		}
	});

	it('uses the provided class name when only query styles are passed', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		const result = cn('named-hover-card', {
			hover: bg('#00FF00')
		});
		expect(result.className).toMatch(/^named-hover-card_[0-9a-f]{8}$/);

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();

		const rules = Array.from(styleSheet.sheet?.cssRules || []) as CSSStyleRule[];
		const rule = rules.find((cssRule) => cssRule.selectorText === `.${result.className}:hover`);
		expect(rule).toBeTruthy();

		if (rule) {
			expect(rule.style.backgroundColor).toBe('rgb(0, 255, 0)');
		}
	});

	it('uses the provided class name for default styles and media queries', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		const result = cn(
			'named-responsive-card',
			width('100%').padding('8px'),
			{
				small: width('50%')
			}
		);
		expect(result.className).toMatch(/^named-responsive-card_[0-9a-f]{8}$/);

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();

		const rules = Array.from(styleSheet.sheet?.cssRules || []);
		const baseRule = rules.find(
			(cssRule): cssRule is CSSStyleRule =>
				cssRule instanceof CSSStyleRule && cssRule.selectorText === `.${result.className}`
		);
		expect(baseRule).toBeTruthy();

		const mediaRule = rules.find(
			(cssRule): cssRule is CSSMediaRule =>
				cssRule instanceof CSSMediaRule && cssRule.media.mediaText === '(max-width: 600px)'
		);
		expect(mediaRule).toBeTruthy();

		const responsiveRule = mediaRule && Array.from(mediaRule.cssRules).find(
			(cssRule): cssRule is CSSStyleRule =>
				cssRule instanceof CSSStyleRule && cssRule.selectorText === `.${result.className}`
		);
		expect(responsiveRule).toBeTruthy();

		if (baseRule) {
			expect(baseRule.style.width).toBe('100%');
			expect(baseRule.style.padding).toBe('8px');
		}

		if (responsiveRule) {
			expect(responsiveRule.style.width).toBe('50%');
			expect(responsiveRule.style.padding).toBe('8px');
		}
	});

	it('avoids collisions when the same named class receives different styles', () => {
		const cn = createBreakpoints({
			small: '(max-width: 600px)'
		});

		const redTitle = cn('title', bg('#FF0000'));
		const blueTitle = cn('title', bg('#0000FF').border('1px solid #FF0000'));

		expect(redTitle.className).toMatch(/^title_[0-9a-f]{8}$/);
		expect(blueTitle.className).toMatch(/^title_[0-9a-f]{8}$/);
		expect(redTitle.className).not.toBe(blueTitle.className);

		const styleSheet = document.querySelector('#nuclo-styles') as HTMLStyleElement;
		expect(styleSheet).toBeTruthy();

		const rules = Array.from(styleSheet.sheet?.cssRules || []) as CSSStyleRule[];
		const redRule = rules.find((cssRule) => cssRule.selectorText === `.${redTitle.className}`);
		const blueRule = rules.find((cssRule) => cssRule.selectorText === `.${blueTitle.className}`);

		expect(redRule).toBeTruthy();
		expect(blueRule).toBeTruthy();

		if (redRule) {
			expect(redRule.style.backgroundColor).toBe('rgb(255, 0, 0)');
		}

		if (blueRule) {
			expect(blueRule.style.backgroundColor).toBe('rgb(0, 0, 255)');
			expect(blueRule.style.borderTopWidth).toBe('1px');
			expect(blueRule.style.borderTopStyle).toBe('solid');
			expect(blueRule.style.borderTopColor).toBe('rgb(255, 0, 0)');
		}
	});
});
