/**
 * @vitest-environment jsdom
 *
 * Table-driven coverage for the complete documented styling vocabulary and
 * cross-feature combinations that are easy to miss in focused unit tests.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createCss, cx, getCssText, resetStyles } from '../../src/style';

beforeEach(() => {
	resetStyles();
	document.head.innerHTML = '';
});

describe('css() complete shorthand vocabulary', () => {
	const aliases: Array<[string, unknown, string[]]> = [
		['bg', 'red', ['background:red']],
		['p', 1, ['padding:1px']],
		['px', 2, ['padding-left:2px', 'padding-right:2px']],
		['py', 3, ['padding-top:3px', 'padding-bottom:3px']],
		['pt', 4, ['padding-top:4px']],
		['pr', 5, ['padding-right:5px']],
		['pb', 6, ['padding-bottom:6px']],
		['pl', 7, ['padding-left:7px']],
		['m', 8, ['margin:8px']],
		['mx', 9, ['margin-left:9px', 'margin-right:9px']],
		['my', 10, ['margin-top:10px', 'margin-bottom:10px']],
		['mt', 11, ['margin-top:11px']],
		['mr', 12, ['margin-right:12px']],
		['mb', 13, ['margin-bottom:13px']],
		['ml', 14, ['margin-left:14px']],
		['w', 15, ['width:15px']],
		['h', 16, ['height:16px']],
		['minW', 17, ['min-width:17px']],
		['maxW', 18, ['max-width:18px']],
		['minH', 19, ['min-height:19px']],
		['maxH', 20, ['max-height:20px']],
		['size', 21, ['width:21px', 'height:21px']],
		['text', 22, ['font-size:22px']],
		['font', 'serif', ['font-family:serif']],
		['weight', 600, ['font-weight:600']],
		['leading', 1.5, ['line-height:1.5']],
		['tracking', 2, ['letter-spacing:2px']],
		['align', 'center', ['text-align:center']],
		['items', 'center', ['align-items:center']],
		['justify', 'space-between', ['justify-content:space-between']],
		['z', 3, ['z-index:3']],
		['rounded', 4, ['border-radius:4px']],
		['shadow', 'none', ['box-shadow:none']],
		['select', 'none', ['user-select:none']],
	];

	it.each(aliases)('%s expands to its documented declarations', (key, value, declarations) => {
		const { css } = createCss({});
		css({ [key]: value } as never);
		const text = getCssText();
		for (const declaration of declarations) expect(text).toContain(declaration);
	});

	const composites: Array<[string, string[]]> = [
		['row', ['display:flex', 'flex-direction:row']],
		['col', ['display:flex', 'flex-direction:column']],
		['center', ['align-items:center', 'justify-content:center']],
		['truncate', ['overflow:hidden', 'text-overflow:ellipsis', 'white-space:nowrap']],
	];

	it.each(composites)('%s expands only when true', (key, declarations) => {
		const { css } = createCss({});
		css({ [key]: true } as never);
		const enabled = getCssText();
		for (const declaration of declarations) expect(enabled).toContain(declaration);

		resetStyles();
		expect(css({ [key]: false } as never).className).toBe('');
	});
});

describe('css() numeric and property conversion edges', () => {
	const unitless = [
		'zIndex', 'opacity', 'fontWeight', 'lineHeight', 'flex', 'flexGrow',
		'flexShrink', 'order', 'aspectRatio', 'zoom', 'scale', 'columnCount',
		'orphans', 'widows', 'tabSize', 'animationIterationCount', 'gridColumn', 'gridRow',
	];

	it.each(unitless)('%s keeps non-zero numbers unitless', (property) => {
		const { css } = createCss({});
		css({ [property]: 2 } as never);
		expect(getCssText()).toContain(':2}');
	});

	it('handles negative, fractional, zero, vendor-prefixed, and raw custom-property values', () => {
		const { css } = createCss({});
		css({
			marginTop: -1.5,
			width: 0,
			WebkitLineClamp: 2,
			raw: { '--count': 3, '--label': 'a:b;c' },
		} as never);
		const text = getCssText();
		expect(text).toContain('margin-top:-1.5px');
		expect(text).toContain('width:0');
		expect(text).toContain('-webkit-line-clamp:2px');
		expect(text).toContain('--count:3px');
		expect(text).toContain('--label:a:b;c');
	});

	it('returns an empty result for empty, null, and entirely omitted styles', () => {
		const { css } = createCss({});
		expect(css({}).className).toBe('');
		expect(css(null as never).className).toBe('');
		expect(css({ p: undefined, hover: {} } as never).className).toBe('');
	});

	it('dedupes equal resolved output across different themes and instances', () => {
		const first = createCss({ colors: { brand: '#123456' } }).css({ color: 'brand' });
		const second = createCss({ colors: { accent: '#123456' } }).css({ color: 'accent' });
		expect(second.className).toBe(first.className);
		expect(getCssText().split('color:#123456').length - 1).toBe(1);
	});
});

describe('css() complete pseudo-selector vocabulary', () => {
	const pseudos: Array<[string, string]> = [
		['hover', ':hover'], ['focus', ':focus'], ['focusVisible', ':focus-visible'],
		['focusWithin', ':focus-within'], ['active', ':active'], ['visited', ':visited'],
		['disabled', ':disabled'], ['enabled', ':enabled'], ['checked', ':checked'],
		['required', ':required'], ['invalid', ':invalid'], ['valid', ':valid'],
		['readOnly', ':read-only'], ['first', ':first-child'], ['last', ':last-child'],
		['only', ':only-child'], ['odd', ':nth-child(odd)'], ['even', ':nth-child(even)'],
		['empty', ':empty'], ['placeholderShown', ':placeholder-shown'],
		['placeholder', '::placeholder'], ['before', '::before'], ['after', '::after'],
		['selection', '::selection'], ['marker', '::marker'], ['firstLine', '::first-line'],
		['firstLetter', '::first-letter'],
	];

	it.each(pseudos)('%s emits %s', (key, selector) => {
		const { css } = createCss({});
		const result = css({ [key]: { color: 'red' } } as never);
		expect(getCssText()).toContain(`.${result.className}${selector}{color:red}`);
	});

	it('composes nested pseudo, arbitrary, and media contexts without merging them', () => {
		const { css } = createCss({ screens: { md: '(min-width: 700px)' } });
		const result = css({
			hover: { focus: { '& > span, & + &': { color: 'red' } } },
			md: { hover: { color: 'blue' } },
		});
		const [compound, responsive] = result.className.split(' ');
		const text = getCssText();
		expect(text).toContain(`.${compound}:hover:focus > span, .${compound}:hover:focus + .${compound}`);
		expect(text).toContain(`@media (min-width: 700px){.${responsive}:hover{color:blue}}`);
	});

	it('preserves escaped and quoted ampersands while expanding selector ampersands', () => {
		const { css } = createCss({});
		const result = css({ [String.raw`&[data-value='&'][data-escaped=\&] &`]: { color: 'red' } } as never);
		expect(getCssText()).toContain(
			`.${result.className}[data-value='&'][data-escaped=\\&] .${result.className}{color:red}`,
		);
	});
});

describe('cx() declaration-order and context edges', () => {
	it('preserves shorthand and longhand cascade semantics in both orders', () => {
		const { css } = createCss({});
		const paddingThenTop = cx(css({ p: 8 }), css({ pt: 20 })).className;
		const topThenPadding = cx(css({ pt: 20 }), css({ p: 8 })).className;
		const text = getCssText();
		expect(text).toContain(`.${paddingThenTop}{padding:8px;padding-top:20px}`);
		expect(text).toContain(`.${topThenPadding}{padding-top:20px;padding:8px}`);
	});

	it('merges generated classes independently in base, pseudo, and media contexts', () => {
		const { css } = createCss({ screens: { md: '(min-width: 700px)' } });
		const base = css({ color: 'red', hover: { color: 'orange' }, md: { color: 'purple' } });
		const override = css({ p: 2, hover: { color: 'blue' }, md: { m: 3 } });
		const classes = cx(base, override).className.split(' ');
		expect(classes).toHaveLength(3);
		const text = getCssText();
		expect(text).toContain(`.${classes[0]}{color:red;padding:2px}`);
		expect(text).toContain(`.${classes[1]}:hover{color:blue}`);
		expect(text).toContain(`.${classes[2]}{color:purple;margin:3px}`);
	});

	it('handles empty inputs, duplicate generated inputs, and multiline StyleResult values', () => {
		const { css } = createCss({});
		const style = css({ p: 1 });
		expect(cx().className).toBe('');
		expect(cx('', false, null, undefined, []).className).toBe('');
		expect(cx(style, style).className).toBe(style.className);
		expect(cx({ className: 'one\ntwo', toString: () => 'one two' }).className).toBe('one two');
	});
});

describe('variants() deep merge edges', () => {
	it('deep-merges pseudo, raw, and arbitrary-selector declarations', () => {
		const { css, variants } = createCss({});
		const recipe = variants({
			base: {
				hover: { color: 'red', p: 1 },
				raw: { '--tone': 'base', '--kept': 'yes' },
				'& > span': { color: 'gray', m: 1 },
			},
			variants: {
				active: {
					true: {
						hover: { color: 'blue' },
						raw: { '--tone': 'active' },
						'& > span': { color: 'black' },
					},
				},
			},
		});
		expect(recipe({ active: true }).className).toBe(css({
			hover: { color: 'blue', p: 1 },
			raw: { '--tone': 'active', '--kept': 'yes' },
			'& > span': { color: 'black', m: 1 },
		}).className);
	});

	it('applies matching compound variants in declaration order', () => {
		const { css, variants } = createCss({});
		const recipe = variants({
			variants: { tone: { danger: { color: 'red' } } },
			compoundVariants: [
				{ tone: 'danger', css: { color: 'orange', p: 1 } },
				{ tone: 'danger', css: { color: 'crimson', m: 2 } },
			],
		});
		expect(recipe({ tone: 'danger' }).className).toBe(css({ color: 'crimson', p: 1, m: 2 }).className);
	});

	it('supports false defaults and treats null like an omitted selection', () => {
		const { css, variants } = createCss({});
		const recipe = variants({
			variants: { enabled: { true: { opacity: 1 }, false: { opacity: 0.5 } } },
			defaultVariants: { enabled: false },
		});
		expect(recipe().className).toBe(css({ opacity: 0.5 }).className);
		expect(recipe({ enabled: null } as never)).toBe(recipe());
	});
});

describe('keyframes() and globalStyle() edges', () => {
	it('uses authored frame order as part of animation identity', () => {
		const { keyframes } = createCss({});
		const forward = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
		const reverse = keyframes({ to: { opacity: 1 }, from: { opacity: 0 } });
		expect(reverse).not.toBe(forward);
	});

	it('supports empty frames and comma-separated frame selectors', () => {
		const { keyframes } = createCss({});
		const name = keyframes({ '0%, 100%': {}, '50%': { opacity: 0.5 } });
		expect(getCssText()).toContain(`@keyframes ${name}{0%, 100%{}50%{opacity:0.5}}`);
	});

	it('keeps changed global rules with the same selector in authored order', () => {
		const { globalStyle } = createCss({});
		globalStyle('body', { color: 'red' });
		globalStyle('body', { color: 'blue' });
		const text = getCssText();
		expect(text.indexOf('body{color:red}')).toBeLessThan(text.indexOf('body{color:blue}'));
	});
});
