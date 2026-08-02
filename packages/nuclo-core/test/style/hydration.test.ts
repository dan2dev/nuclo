/**
 * @vitest-environment jsdom
 *
 * SSR → hydration: the server embeds getCssText() in <style id="nuclo-styles">;
 * the client re-runs the same style code against that pre-populated element.
 * Every rule the server already rendered must be recognized — not re-inserted —
 * and genuinely new client-only rules must still land in the right place.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createCss, getCssText, resetStyles } from '../../src/style';

const theme = { screens: { medium: '(min-width: 601px)' } } as const;

/** Render "server-side", capture the css text, then reset registries and plant the SSR <style> tag. */
function hydrateFrom(render: (instance: ReturnType<typeof createCss<typeof theme>>) => void): void {
	render(createCss(theme));
	const ssrText = getCssText();
	resetStyles();
	const el = document.createElement('style');
	el.id = 'nuclo-styles';
	el.textContent = ssrText;
	document.head.appendChild(el);
}

function countOccurrences(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

function sheetText(): string {
	const el = document.getElementById('nuclo-styles') as HTMLStyleElement;
	const flatten = (rules: CSSRuleList): string =>
		Array.from(rules).map((r) => r.cssText).join('\n');
	return flatten(el.sheet!.cssRules);
}

beforeEach(() => {
	resetStyles();
	document.head.innerHTML = '';
});

describe('hydration dedup', () => {
	it('does not re-insert base, pseudo, or media rules the server rendered', () => {
		const render = (i: ReturnType<typeof createCss<typeof theme>>): void => {
			i.css({ pt: 16, hover: { color: 'red' }, medium: { mb: 22 } });
		};
		hydrateFrom(render);
		render(createCss(theme));

		const text = sheetText();
		expect(countOccurrences(text, 'padding-top: 16px')).toBe(1);
		expect(countOccurrences(text, 'color: red')).toBe(1);
		expect(countOccurrences(text, 'margin-bottom: 22px')).toBe(1);
	});

	it('does not re-insert @keyframes or globalStyle rules the server rendered', () => {
		const render = (i: ReturnType<typeof createCss<typeof theme>>): void => {
			const anim = i.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
			i.globalStyle('body', { m: 0 });
			i.css({ raw: { animation: `${anim} 1s` } });
		};
		hydrateFrom(render);
		render(createCss(theme));

		const text = sheetText();
		expect(countOccurrences(text, '@keyframes')).toBe(1);
		expect(countOccurrences(text, 'body {')).toBe(1);
	});

	it('appends genuinely new client-only rules into the existing media group', () => {
		hydrateFrom((i) => {
			i.css({ medium: { mb: 22 } });
		});
		const client = createCss(theme);
		client.css({ medium: { mb: 22 } });
		client.css({ medium: { pb: 40 } }); // server never saw this

		const el = document.getElementById('nuclo-styles') as HTMLStyleElement;
		const mediaRules = Array.from(el.sheet!.cssRules).filter(
			(r): r is CSSMediaRule => r.type === CSSRule.MEDIA_RULE,
		);
		expect(mediaRules.length).toBe(1); // reused, not duplicated
		const inner = Array.from(mediaRules[0].cssRules).map((r) => r.cssText).join('');
		expect(countOccurrences(inner, 'margin-bottom: 22px')).toBe(1);
		expect(inner).toContain('padding-bottom: 40px');
	});
});
