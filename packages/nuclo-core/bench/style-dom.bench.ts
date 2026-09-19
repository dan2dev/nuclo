/** Browser-like CSSOM startup/hydration scaling: bun bench/style-dom.bench.ts */
import { JSDOM } from 'jsdom';
import { createCss, getCssText, resetStyles } from '../src/style';

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
Object.assign(globalThis, {
	document: dom.window.document,
	CSSStyleRule: dom.window.CSSStyleRule,
});
for (const count of [500, 1_000, 2_000]) {
	resetStyles();
	const instance = createCss({ screens: { md: '(min-width: 768px)' } });
	const render = () => {
		for (let i = 0; i < count; i++) instance.css({ md: { raw: { '--index': String(i) } } });
	};
	let start = performance.now();
	render();
	const cold = performance.now() - start;
	const serverCss = getCssText();
	resetStyles();
	const style = document.createElement('style');
	style.id = 'nuclo-styles';
	style.textContent = serverCss;
	document.head.appendChild(style);
	start = performance.now();
	render();
	const hydrate = performance.now() - start;
	console.log(`${count} responsive rules: cold ${cold.toFixed(1)} ms; hydrate ${hydrate.toFixed(1)} ms`);
}
resetStyles();
dom.window.close();
