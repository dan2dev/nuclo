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
// atomCache: declaration-block key -> class name (dedup)
// atomMeta: class name -> what the class means (its selector context and its
// declarations). This is what lets cx() merge two same-context classes at the
// declaration level instead of guessing: the engine can always recover the
// exact content of any class it minted.
export interface BlockMeta {
	readonly query: string | undefined;
	readonly suffix: string;
	readonly decls: ReadonlyArray<readonly [string, string]>;
	/** Author-supplied identity from `css(name, …)`; inherited by cx() merges. */
	readonly name: string | undefined;
}
const atomCache = new Map<string, string>();
const atomMeta = new Map<string, BlockMeta>();
const rawKeys = new Set<string>();
const baseRules: string[] = [];
const queryRules = new Map<string, string[]>();

// Memoized getCssText() output. SSR calls getCssText() once per request, but the
// rule set is stable after warmup — so the serialized sheet is recomputed only
// when a new rule is actually recorded. Invalidated in record() and resetStyles().
let cssTextCache: string | null = null;

// Browser CSSOM state. Base rules occupy [0, baseRuleCount); grouping rules
// (one per query, created in registration order) live after them. CSSRule
// references stay live when indices shift, so insertion never rescans.
let sheet: CSSStyleSheet | null = null;
let sheetDocument: Document | null = null;
let baseRuleCount = 0;
const groupRules = new Map<string, CSSGroupingRule>();

// Selectors already sitting in a freshly-adopted stylesheet that this module
// didn't insert itself — e.g. a server-rendered <style id="nuclo-styles">
// being hydrated. Class names are content-addressed, so a matching selector
// found here is guaranteed to hold the identical declaration: re-inserting
// it would only duplicate the rule in the live CSSOM. Rebuilt on every fresh
// bind in ensureSheet(); null when there's nothing external to guard against.
let externalSelectors: Set<string> | null = null;

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

/** The selector/prelude a generated rule string starts with — everything before its first "{". */
function selectorOf(rule: string): string {
	const brace = rule.indexOf("{");
	return brace === -1 ? rule : rule.slice(0, brace);
}

/** The at-rule prelude of a live grouping rule ("@media (min-width: 601px)"), reconstructed from its cssText. */
function groupQueryOf(rule: CSSRule): string {
	const text = rule.cssText;
	const brace = text.indexOf("{");
	return (brace === -1 ? text : text.slice(0, brace)).trim();
}

/**
 * Index an already-populated stylesheet found on adopt (SSR output, most
 * commonly): every top-level conditional grouping rule (@media/@container/…)
 * is registered into groupRules (by its reconstructed at-rule text) so later
 * record() calls append into it instead of creating a sibling duplicate, and
 * every other rule is recorded into `selectors` by its selector/prelude so
 * insertBase()/insertGrouped() can skip re-inserting it — style rules by
 * selectorText, @keyframes (and any other raw at-rule) by prelude, since
 * their names are content-addressed and identical between server and client.
 */
function indexExternalRules(rules: CSSRuleList, selectors: Set<string>): void {
	for (let i = 0; i < rules.length; i++) {
		const rule = rules[i];
		if (rule instanceof CSSStyleRule) {
			selectors.add(rule.selectorText);
			continue;
		}
		const prelude = groupQueryOf(rule);
		if ("cssRules" in rule && !prelude.startsWith("@keyframes")) {
			const group = rule as CSSGroupingRule;
			groupRules.set(prelude, group);
			for (let j = 0; j < group.cssRules.length; j++) {
				const nested = group.cssRules[j];
				if (nested instanceof CSSStyleRule) selectors.add(nested.selectorText);
			}
		} else {
			// @keyframes, @font-face, … — one-shot rules matched by prelude.
			selectors.add(prelude);
		}
	}
}

function insertBase(s: CSSStyleSheet, rule: string): void {
	if (externalSelectors?.has(selectorOf(rule))) return; // already present — e.g. SSR-rendered
	try {
		s.insertRule(rule, baseRuleCount);
		baseRuleCount++;
	} catch {
		// Invalid value/selector: drop the declaration, like browsers do for bad CSS.
	}
}

function insertGrouped(group: CSSGroupingRule, rule: string): void {
	if (externalSelectors?.has(selectorOf(rule))) return; // already present — e.g. SSR-rendered
	try {
		group.insertRule(rule, group.cssRules.length);
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
	externalSelectors = null;
	if (!sheet) return null;
	if (sheet.cssRules.length > 0) {
		// Leading top-level non-group rules (style rules, @keyframes — before
		// the first @media/@container group) are this element's existing
		// "base" region — count them so insertBase() keeps inserting new base
		// rules right after them, still ahead of every group.
		let i = 0;
		while (i < sheet.cssRules.length) {
			const r = sheet.cssRules[i];
			if (!(r instanceof CSSStyleRule) && "cssRules" in r && !groupQueryOf(r).startsWith("@keyframes")) break;
			i++;
		}
		baseRuleCount = i;
		externalSelectors = new Set();
		indexExternalRules(sheet.cssRules, externalSelectors);
	}
	for (const rule of baseRules) insertBase(sheet, rule);
	for (const [query, rules] of queryRules) {
		const group = groupRules.get(query) ?? createGroup(sheet, query);
		if (group) for (const rule of rules) insertGrouped(group, rule);
	}
	return sheet;
}

function record(rule: string, query: string | undefined): void {
	// Bind/replay *before* this rule joins the registry, so a fresh bind's
	// replay only ever covers previously-known rules — never this one twice.
	const s = ensureSheet();

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
	cssTextCache = null; // a new rule changes the serialized sheet
	ssrCollector?.(query === undefined ? rule : query + "{" + rule + "}");

	if (!s) return;
	if (query === undefined) {
		insertBase(s, rule);
	} else {
		const group = groupRules.get(query) ?? createGroup(s, query);
		if (group) insertGrouped(group, rule);
	}
}

/**
 * Content-addressed 53-bit hash (two interleaved FNV-1a style passes). Class
 * names must match between server and client for SSR hydration, so a counter
 * is not an option; 53 bits keeps collision odds negligible (~1e-5 at 10k
 * unique declaration blocks).
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

/**
 * True for strings usable verbatim as an unescaped CSS class selector:
 * letters/digits/`-`/`_`, not starting with a digit or `-`+digit.
 * Char-code loop rather than a RegExp — this runs on the cold mint path but
 * stays allocation-free either way.
 */
function isValidClassName(name: string): boolean {
	if (name.length === 0) return false;
	for (let i = 0; i < name.length; i++) {
		const c = name.charCodeAt(i);
		const ok =
			(c >= 97 && c <= 122) || // a-z
			(c >= 65 && c <= 90) || // A-Z
			c === 45 || c === 95 || // - _
			(i > 0 && c >= 48 && c <= 57); // 0-9, never leading
		if (!ok) return false;
	}
	// "-9foo" is not a valid identifier start either.
	if (name.charCodeAt(0) === 45 && name.length > 1) {
		const second = name.charCodeAt(1);
		if (second >= 48 && second <= 57) return false;
	}
	return true;
}

/**
 * Mint (or reuse) the class for a declaration block in a selector context.
 *
 * Declarations keep their authored order — CSS resolves shorthand/longhand
 * and repeated-property conflicts by declaration order, so reordering (e.g.
 * alphabetical sorting) would silently change what `{ pt: 20, p: 16 }` means.
 * The cost is that the same declarations authored in a different order mint a
 * second, content-identical class — harmless, and rare in practice.
 *
 * `name` is the author's identity for the style (`css("app-root", …)`). It
 * becomes part of the cache key, so two different names never share a class
 * even with identical declarations. With `exactName`, this block *is* the
 * named one and takes the name verbatim; otherwise the name is only a
 * readable prefix on a content-addressed prefix (`app-root-1a2b3c`), which is
 * how a named style's non-base contexts and its cx() merges stay identifiable
 * in devtools without ever colliding with the base class.
 */
function mintBlock(
	query: string | undefined,
	suffix: string,
	decls: ReadonlyArray<readonly [string, string]>,
	name?: string,
	exactName = false,
): string {
	let body = "";
	for (const [prop, value] of decls) body += (body ? ";" : "") + prop + ":" + value;
	const contextKey = (query ?? "") + "|" + suffix + "|" + body;
	const declKey = name === undefined ? contextKey : name + " " + contextKey;
	let className = atomCache.get(declKey);
	if (className !== undefined) {
		// Touch the sheet so a swapped document (tests) gets the replayed rules.
		ensureSheet();
		return className;
	}

	if (name === undefined) {
		className = "n" + hash(declKey);
	} else if (!isValidClassName(name)) {
		console.warn(
			`[nuclo] css() name ${JSON.stringify(name)} is not a valid CSS class name ` +
				"(letters, digits, - and _ only, not starting with a digit); falling back to a generated name.",
		);
		name = undefined;
		className = "n" + hash(contextKey);
	} else {
		className = exactName ? name : name + "-" + hash(declKey);
		if (atomMeta.has(className)) {
			console.warn(
				`[nuclo] css() name ${JSON.stringify(className)} is already used by a different style. ` +
					"Both rules are emitted under the same class, so they will override each other — rename one.",
			);
		}
	}

	atomCache.set(declKey, className);
	atomMeta.set(className, { query, suffix, decls, name });
	record("." + className + suffix + "{" + body + "}", query);
	return className;
}

/**
 * One class per (query, selector-suffix) — every declaration that shares that
 * context compiles into a single rule under a single generated class name,
 * rather than one class per individual property. Pass `name` to give the
 * style a stable, readable identity (see mintBlock).
 */
export function atomBlock(
	query: string | undefined,
	suffix: string,
	decls: ReadonlyArray<readonly [string, string]>,
	name?: string,
	exactName = false,
): string {
	return mintBlock(query, suffix, decls, name, exactName);
}

/**
 * Merge two same-context generated classes into one: `second`'s declarations
 * override `first`'s per exact property (shorthand/longhand interplay is left
 * to CSS order), and the combined block mints its own content-addressed class
 * — so cx(base, override) keeps base's untouched properties instead of
 * dropping the whole base class. Deterministic: the same pair always yields
 * the same class name, on server and client alike. A named base passes its
 * name down as a prefix, so `cx(appRoot, active)` reads as `app-root-1a2b3c`.
 */
export function mergeBlocks(first: string, second: string): string {
	const a = atomMeta.get(first);
	const b = atomMeta.get(second);
	if (!a || !b) return second; // unknown input — nothing to merge with
	const concat = [...a.decls, ...b.decls];
	// Keep only the last occurrence of each exact property, at its position —
	// so a later `padding` still fully resets an earlier `padding-top`.
	const lastIndex = new Map<string, number>();
	for (let i = 0; i < concat.length; i++) lastIndex.set(concat[i][0], i);
	const merged = concat.filter((decl, i) => lastIndex.get(decl[0]) === i);
	return mintBlock(a.query, a.suffix, merged, a.name ?? b.name);
}

/** Conflict key (query|suffix) for a generated class — lets cx() group classes by selector context. */
export function conflictKeyOf(className: string): string | undefined {
	const meta = atomMeta.get(className);
	return meta === undefined ? undefined : (meta.query ?? "") + "|" + meta.suffix;
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
	if (cssTextCache !== null) return cssTextCache;
	let out = baseRules.join("");
	for (const [query, rules] of queryRules) {
		if (rules.length > 0) out += query + "{" + rules.join("") + "}";
	}
	cssTextCache = out;
	return out;
}

/** Clear all engine state (test helper). Removes the injected style element. */
export function resetStyles(): void {
	atomCache.clear();
	atomMeta.clear();
	rawKeys.clear();
	baseRules.length = 0;
	queryRules.clear();
	groupRules.clear();
	cssTextCache = null;
	baseRuleCount = 0;
	sheet = null;
	sheetDocument = null;
	externalSelectors = null;
	if (typeof document !== "undefined") {
		document.getElementById("nuclo-styles")?.remove();
	}
}
