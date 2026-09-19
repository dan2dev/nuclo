// @vitest-environment node
import { expect, it } from 'vitest';
import { createCss } from '../../src/style';

it('allocates the shared registry on first style, not import or an empty theme', () => {
	const key = Symbol.for('nuclo.style.engine.v1');
	const scope = globalThis as unknown as Record<symbol, unknown>;
	expect(scope[key]).toBeUndefined();
	const instance = createCss();
	expect(scope[key]).toBeUndefined();
	instance.css({ color: 'red' });
	expect(scope[key]).toBeDefined();
});
