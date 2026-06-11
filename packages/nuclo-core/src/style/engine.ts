/**
 * Shared atomic-CSS engine state.
 *
 * One stylesheet, one rule registry, shared by every `createCss` instance so
 * identical declarations dedupe globally and cascade order stays deterministic:
 * base rules first (insertion order), then one grouping rule per at-rule query
 * in registration order (theme `screens` order).
 *
 * Browser: rules are injected through CSSOM with O(1) appends — no rescans.
 * SSR: rules accumulate in the registry; `getCssText()` serializes them.
 */

// SSR collector — optional hook that receives every newly minted rule string
// (wrapped in its at-rule, if any). Installed once at server startup.
type SSRCollector = (rule: string) => void;
let ssrCollector: SSRCollector | null = null;

export function setSSRCollector(fn: SSRCollector | null): void {
	ssrCollector = fn;
}

// Registry — the source of truth for all generated CSS.
// atomCache: declaration key -> class name (dedup)
// atomOwner: class name -> conflict key (query|suffix|property), used by cx()
const atomCache = new Map<string, string>();
const atomOwner = new Map<string, string>();
const rawKeys = new Set<string>();
const baseRules: string[] = [];
const queryRules = new Map<string, string[]>();

// Browser CSSOM state. Base rules occupy [0, baseRuleCount); grouping rules
// (one per query, created in registration order) live after them. CSSRule
// references stay live when indices shift, so insertion never rescans.
let sheet: CSSStyleSheet | null = null;
let sheetDocument: Document | null = null;
let baseRuleCount = 0;
const groupRules = new Map<string, CSSGroupingRule>();

/** Pre-register at-rule queries so their cascade order follows theme order. */
export function registerQueries(queries: Iterable<string>): void {
	for (const query of queries) {
		if (!queryRules.has(query)) queryRules.set(query, []);
	}
}

function createGroup(s: CSSStyleSheet, query: string): CSSGroupingRule | null {
	try {
		const idx = s.cssRules.length;
		s.insertRule(query + "{}", idx);
		const group = s.cssRules[idx] as CSSGroupingRule;
		groupRules.set(query, group);
		return group;
	} catch {
		return null; // unsupported at-rule in this environment
	}
}

function insertBase(s: CSSStyleSheet, rule: string): void {
	try {
		s.insertRule(rule, baseRuleCount);
		baseRuleCount++;
	} catch {
		// Invalid value/selector: drop the declaration, like browsers do for bad CSS.
	}
}

/**
 * Returns the live stylesheet, (re)binding when the document changes — e.g.
 * fresh jsdom documents between tests. Rebinding replays the whole registry,
 * which replaces v1's per-call classExistsInDOM() DOM scans with a single
 * replay per document.
 */
function ensureSheet(): CSSStyleSheet | null {
	if (typeof document === "undefined") return null;
	// The nuclo SSR polyfill provides a document without getElementById — in
	// that context rules accumulate in the registry for getCssText() only.
	if (typeof document.getElementById !== "function") return null;
	if (sheet && sheetDocument === document && sheet.ownerNode && (sheet.ownerNode as Element).isConnected) {
		return sheet;
	}
	let el = document.getElementById("nuclo-styles") as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement("style");
		el.id = "nuclo-styles";
		document.head.appendChild(el);
	}
	sheet = el.sheet;
	sheetDocument = document;
	groupRules.clear();
	baseRuleCount = 0;
	if (!sheet) return null;
	for (const rule of baseRules) insertBase(sheet, rule);
	for (const [query, rules] of queryRules) {
		const group = createGroup(sheet, query);
		if (group) {
			for (const rule of rules) {
				try {
					group.insertRule(rule, group.cssRules.length);
				} catch { /* drop invalid rule */ }
			}
		}
	}
	return sheet;
}

function record(rule: string, query: string | undefined): void {
	if (query === undefined) {
		baseRules.push(rule);
	} else {
		let bucket = queryRules.get(query);
		if (!bucket) {
			bucket = [];
			queryRules.set(query, bucket);
		}
		bucket.push(rule);
	}
	ssrCollector?.(query === undefined ? rule : query + "{" + rule + "}");

	const s = ensureSheet();
	if (!s) return;
	if (query === undefined) {
		insertBase(s, rule);
	} else {
		const group = groupRules.get(query) ?? createGroup(s, query);
		if (group) {
			try {
				group.insertRule(rule, group.cssRules.length);
			} catch { /* drop invalid rule */ }
		}
	}
}

/**
 * Order-independent 53-bit content hash (two interleaved FNV-1a style passes).
 * Class names must match between server and client for SSR hydration, so a
 * counter is not an option; 53 bits keeps collision odds negligible (~1e-5 at
 * 10k unique declarations).
 */
export function hash(input: string): string {
	let a = 0x811c9dc5;
	let b = 0x7ee3623b;
	for (let i = 0; i < input.length; i++) {
		const c = input.charCodeAt(i);
		a = Math.imul(a ^ c, 0x01000193);
		b = Math.imul(b ^ c, 0x85ebca6b);
	}
	return (a >>> 0).toString(36) + ((b >>> 9) % 1296).toString(36);
}

/** One class per (query, selector-suffix, declaration) — the atomic core. */
export function atom(query: string | undefined, suffix: string, property: string, value: string): string {
	const declKey = (query ?? "") + "|" + suffix + "|" + property + ":" + value;
	let className = atomCache.get(declKey);
	if (className !== undefined) {
		// Touch the sheet so a swapped document (tests) gets the replayed rules.
		ensureSheet();
		return className;
	}
	className = "n" + hash(declKey);
	atomCache.set(declKey, className);
	atomOwner.set(className, (query ?? "") + "|" + suffix + "|" + property);
	record("." + className + suffix + "{" + property + ":" + value + "}", query);
	return className;
}

/** Conflict key for a generated class — lets cx() resolve overrides exactly. */
export function conflictKeyOf(className: string): string | undefined {
	return atomOwner.get(className);
}

/** Register a non-atomic rule (keyframes, global styles) once per dedupe key. */
export function addRawRule(dedupeKey: string, rule: string): void {
	if (rawKeys.has(dedupeKey)) {
		ensureSheet();
		return;
	}
	rawKeys.add(dedupeKey);
	record(rule, undefined);
}

/** All generated CSS — base rules first, then at-rule groups in registration order. */
export function getCssText(): string {
	let out = baseRules.join("");
	for (const [query, rules] of queryRules) {
		if (rules.length > 0) out += query + "{" + rules.join("") + "}";
	}
	return out;
}

/** Clear all engine state (test helper). Removes the injected style element. */
export function resetStyles(): void {
	atomCache.clear();
	atomOwner.clear();
	rawKeys.clear();
	baseRules.length = 0;
	queryRules.clear();
	groupRules.clear();
	baseRuleCount = 0;
	sheet = null;
	sheetDocument = null;
	if (typeof document !== "undefined") {
		document.getElementById("nuclo-styles")?.remove();
	}
}
