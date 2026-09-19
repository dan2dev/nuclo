/**
 * @vitest-environment node
 *
 * The engine's registry (atomCache/atomMeta/rawKeys/baseRules/queryRules —
 * see src/style/engine.ts's header) is a process-wide singleton with no
 * eviction: every genuinely-unique declaration block mints one class that
 * lives until resetStyles() runs (a manual test helper, never called in
 * production). This is the opposite contract from the rest of the runtime's
 * reactive registries (test/memory/ssr-no-leak.test.ts), which are
 * WeakRef/WeakMap-keyed and shrink on their own once nothing references the
 * tree that registered them.
 *
 * This file pins that intentional boundary down as a test, rather than
 * leaving it implicit: dropping every JS-side reference to a style call site
 * and forcing GC must NOT shrink the registry (unlike ssr-no-leak's trees),
 * and only resetStyles() may. A future change that quietly made growth
 * worse (or unsafely added GC-based eviction, which would risk deleting CSS
 * still backing visible elements — see engine.ts's header) has to break a
 * test to do it.
 */
import { describe, expect, it } from "vitest";
import { createCss, getCssText, resetStyles } from "../../src/style";

const hasGc = typeof (globalThis as { gc?: () => void }).gc === "function";
const itGc = hasGc ? it : it.skip;

async function collectGarbage(): Promise<void> {
	for (let i = 0; i < 5; i++) {
		(globalThis as { gc: () => void }).gc();
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
}

describe("style registry growth is unbounded except via resetStyles()", () => {
	itGc("dropping every reference to unique style calls does not shrink the registry", async () => {
		resetStyles();
		const { css } = createCss({});
		const count = 500;
		for (let i = 0; i < count; i++) css({ raw: { "--registry-growth": String(i) } });

		const beforeGc = getCssText();
		expect(beforeGc.split("--registry-growth:").length - 1).toBe(count);

		await collectGarbage();

		// No reference to any `css()` call site survives past the loop above —
		// unlike a reactive tree's registries, the atom registry keeps every
		// rule anyway. Growth is a design choice (content-addressed dedup
		// needs a durable record of what every class means), not a leak GC
		// can paper over.
		expect(getCssText()).toBe(beforeGc);
		expect(getCssText().split("--registry-growth:").length - 1).toBe(count);
	});
});
