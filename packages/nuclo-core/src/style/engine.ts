/**
 * Shared generated-CSS engine state.
 *
 * One stylesheet, one rule registry, shared by every `createCss` instance so
 * identical declarations dedupe globally and cascade order stays deterministic:
 * base rules first (insertion order), then one grouping rule per at-rule query
 * in registration order (theme `screens` order).
 *
 * Browser: rules are injected through CSSOM with O(1) appends — no rescans.
 * SSR: rules accumulate in the registry; `getCssText()` serializes them.
 *
 * The state below lives on `globalThis`, keyed by a `Symbol.for(...)` (the
 * global symbol registry, shared by every realm-local copy of this module).
 * `nuclo` publishes `.`, `./ssr`, and `./polyfill` as independently built
 * bundle files (see tsdown.config.ts) — a consumer that resolves them
 * through normal package resolution (any bundler/runtime that doesn't
 * alias every subpath to this same source file) loads two or three
 * separate copies of this module, each with its own module-scope
 * variables. Without a realm-wide singleton, `css()` (from `nuclo`) would
 * mint rules into one copy's registry while `getCssText()`/
 * `setSSRCollector()` (from `nuclo/ssr`) read an entirely different,
 * always-empty one — SSR output would render the right classes with no
 * matching CSS at all. Storing the registry on `globalThis` instead makes
 * every copy of this module share the same state regardless of how many
 * times it ends up bundled.
 */

// SSR collector — optional hook that receives every newly minted rule string
// (wrapped in its at-rule, if any). Installed once at server startup.
type SSRCollector = (rule: string) => void;

export interface BlockMeta {
	readonly query: string | undefined;
	readonly suffix: string;
	readonly decls: ReadonlyArray<readonly [string, string]>;
	/** Author-supplied identity from `css(name, …)`; inherited by cx() merges. */
	readonly name: string | undefined;
}

interface EngineState {
	ssrCollector: SSRCollector | null;

	// Registry — the source of truth for all generated CSS.
	// atomCache: declaration-block key -> class name (dedup)
	// atomMeta: class name -> what the class means (its selector context and its
	// declarations). This is what lets cx() merge two same-context classes at the
	// declaration level instead of guessing: the engine can always recover the
	// exact content of any class it minted.
	atomCache: Map<string, string>;
	atomMeta: Map<string, BlockMeta>;
	rawKeys: Set<string>;
	baseRules: string[];
	queryRules: Map<string, string[]>;
	styleEpoch: number;

	// Memoized getCssText() output. SSR calls getCssText() once per request, but the
	// rule set is stable after warmup — so the serialized sheet is recomputed only
	// when a new rule is actually recorded. Invalidated in record() and resetStyles().
	cssTextCache: string | null;

	// Browser CSSOM state. Base rules occupy [0, baseRuleCount); grouping rules
	// (one per query, created in registration order) live after them. CSSRule
	// references stay live when indices shift, so insertion never rescans.
	sheet: CSSStyleSheet | null;
	sheetDocument: Document | null;
	baseRuleCount: number;
	groupRules: Map<string, CSSGroupingRule>;

	// Normalized rules already sitting in a freshly-adopted stylesheet that this
	// module didn't insert itself — e.g. server-rendered CSS being hydrated.
	// Rebuilt on every fresh bind in ensureSheet(); null when there is nothing
	// external to guard against.
	externalRules: Map<string, Set<string>> | null;
	hasExternalGroups: boolean;
}

function createState(): EngineState {
	return {
		ssrCollector: null,
		atomCache: new Map(),
		atomMeta: new Map(),
		rawKeys: new Set(),
		baseRules: [],
		queryRules: new Map(),
		styleEpoch: 0,
		cssTextCache: null,
		sheet: null,
		sheetDocument: null,
		baseRuleCount: 0,
		groupRules: new Map(),
		externalRules: null,
		hasExternalGroups: false,
	};
}

const ENGINE_STATE_KEY = Symbol.for("nuclo.style.engine.v1");
const globalScope = globalThis as unknown as Record<symbol, EngineState>;
const state = globalScope[ENGINE_STATE_KEY] ?? (globalScope[ENGINE_STATE_KEY] = createState());

export function setSSRCollector(fn: SSRCollector | null): void {
	state.ssrCollector = fn;
}

/** Pre-register at-rule queries so their cascade order follows theme order. */
export function registerQueries(queries: Iterable<string>): void {
	for (const query of queries) {
		if (!state.queryRules.has(query)) state.queryRules.set(query, []);
	}
}

function createGroup(s: CSSStyleSheet, query: string): CSSGroupingRule | null {
	try {
		const idx = s.cssRules.length;
		s.insertRule(query + "{}", idx);
		const group = s.cssRules[idx] as CSSGroupingRule;
		state.groupRules.set(query, group);
		state.groupRules.set(groupQueryOf(group), group);
		return group;
	} catch {
		return null; // unsupported at-rule in this environment
	}
}

/** The at-rule prelude of a live grouping rule ("@media (min-width: 601px)"), reconstructed from its cssText. */
function groupQueryOf(rule: CSSRule): string {
	const text = rule.cssText;
	const brace = text.indexOf("{");
	return (brace === -1 ? text : text.slice(0, brace)).trim();
}

function ruleIdentity(rule: CSSRule): string {
	return rule instanceof CSSStyleRule ? rule.selectorText : groupQueryOf(rule);
}

function scopedRuleKey(query: string | undefined, identity: string): string {
	const scope = query === undefined ? "-" : "+" + query.length + ":" + query;
	return scope + identity.length + ":" + identity;
}

function rememberExternalRule(rule: CSSRule, query: string | undefined): void {
	if (!state.externalRules) return;
	const key = scopedRuleKey(query, ruleIdentity(rule));
	let texts = state.externalRules.get(key);
	if (!texts) {
		texts = new Set();
		state.externalRules.set(key, texts);
	}
	texts.add(rule.cssText);
}

function consumeExternalRule(rule: CSSRule, query: string | undefined): boolean {
	if (!state.externalRules) return false;
	const key = scopedRuleKey(query, ruleIdentity(rule));
	const texts = state.externalRules.get(key);
	if (!texts?.delete(rule.cssText)) return false;
	if (texts.size === 0) state.externalRules.delete(key);
	if (state.externalRules.size === 0) state.externalRules = null;
	return true;
}

/**
 * Index an already-populated stylesheet found on adopt (SSR output, most
 * commonly): every top-level conditional grouping rule (@media/@container/…)
 * is registered into groupRules (by its reconstructed at-rule text) so later
 * record() calls append into it instead of creating a sibling duplicate. The
 * other rules are indexed by scope, selector/prelude, and normalized cssText
 * so exact server/client matches can be skipped without hiding a changed
 * named or global rule that happens to reuse the same selector.
 */
function indexExternalRules(rules: CSSRuleList): void {
	for (let i = 0; i < rules.length; i++) {
		const rule = rules[i];
		if (rule instanceof CSSStyleRule) {
			rememberExternalRule(rule, undefined);
			continue;
		}
		const prelude = groupQueryOf(rule);
		if ("cssRules" in rule && !prelude.startsWith("@keyframes")) {
			const group = rule as CSSGroupingRule;
			state.hasExternalGroups = true;
			state.groupRules.set(prelude, group);
			for (let j = 0; j < group.cssRules.length; j++) {
				rememberExternalRule(group.cssRules[j], prelude);
			}
		} else {
			// @keyframes, @font-face, … — one-shot rules matched by prelude.
			rememberExternalRule(rule, undefined);
		}
	}
}

function insertBase(s: CSSStyleSheet, rule: string): void {
	try {
		s.insertRule(rule, state.baseRuleCount);
		const inserted = s.cssRules[state.baseRuleCount];
		if (consumeExternalRule(inserted, undefined)) {
			s.deleteRule(state.baseRuleCount);
			return;
		}
		state.baseRuleCount++;
	} catch {
		// Invalid value/selector: drop the declaration, like browsers do for bad CSS.
	}
}

function insertGrouped(group: CSSGroupingRule, rule: string): void {
	try {
		const index = group.cssRules.length;
		group.insertRule(rule, index);
		const inserted = group.cssRules[index];
		if (consumeExternalRule(inserted, groupQueryOf(group))) group.deleteRule(index);
	} catch {
		// Invalid value/selector: drop the declaration, like browsers do for bad CSS.
	}
}

function getOrCreateGroup(s: CSSStyleSheet, query: string): CSSGroupingRule | null {
	const direct = state.groupRules.get(query);
	if (direct) return direct;
	if (!state.hasExternalGroups) return createGroup(s, query);

	// CSSOM may normalize whitespace in an at-rule prelude. Normalize the
	// authored query through a temporary empty group before deciding that an
	// adopted SSR group is missing.
	try {
		const index = s.cssRules.length;
		s.insertRule(query + "{}", index);
		const normalized = groupQueryOf(s.cssRules[index]);
		s.deleteRule(index);
		const existing = state.groupRules.get(normalized);
		if (existing) {
			state.groupRules.set(query, existing);
			return existing;
		}
	} catch {
		return null;
	}
	return createGroup(s, query);
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
	if (
		state.sheet &&
		state.sheetDocument === document &&
		state.sheet.ownerNode &&
		(state.sheet.ownerNode as Element).isConnected
	) {
		return state.sheet;
	}
	const existing = document.getElementById("nuclo-styles");
	let el: HTMLStyleElement;
	if (existing?.tagName === "STYLE") {
		el = existing as HTMLStyleElement;
	} else {
		el = document.createElement("style");
		el.id = "nuclo-styles";
		if (existing) existing.replaceWith(el);
		else document.head.appendChild(el);
	}
	state.sheet = el.sheet;
	state.sheetDocument = document;
	state.groupRules.clear();
	state.baseRuleCount = 0;
	state.externalRules = null;
	state.hasExternalGroups = false;
	if (!state.sheet) return null;
	if (state.sheet.cssRules.length > 0) {
		// Leading top-level non-group rules (style rules, @keyframes — before
		// the first @media/@container group) are this element's existing
		// "base" region — count them so insertBase() keeps inserting new base
		// rules right after them, still ahead of every group.
		let i = 0;
		while (i < state.sheet.cssRules.length) {
			const r = state.sheet.cssRules[i];
			if (!(r instanceof CSSStyleRule) && "cssRules" in r && !groupQueryOf(r).startsWith("@keyframes")) break;
			i++;
		}
		state.baseRuleCount = i;
		state.externalRules = new Map();
		indexExternalRules(state.sheet.cssRules);
	}
	for (const rule of state.baseRules) insertBase(state.sheet, rule);
	for (const [query, rules] of state.queryRules) {
		const group = getOrCreateGroup(state.sheet, query);
		if (group) for (const rule of rules) insertGrouped(group, rule);
	}
	return state.sheet;
}

function record(rule: string, query: string | undefined): void {
	// Bind/replay *before* this rule joins the registry, so a fresh bind's
	// replay only ever covers previously-known rules — never this one twice.
	const s = ensureSheet();

	if (query === undefined) {
		state.baseRules.push(rule);
	} else {
		let bucket = state.queryRules.get(query);
		if (!bucket) {
			bucket = [];
			state.queryRules.set(query, bucket);
		}
		bucket.push(rule);
	}
	state.cssTextCache = null; // a new rule changes the serialized sheet

	if (s) {
		if (query === undefined) {
			insertBase(s, rule);
		} else {
			const group = getOrCreateGroup(s, query);
			if (group) insertGrouped(group, rule);
		}
	}
	state.ssrCollector?.(query === undefined ? rule : query + "{" + rule + "}");
}

/**
 * Content-addressed ~42-bit hash (two interleaved FNV-1a style passes). Class
 * names must match between server and client for SSR hydration, so a counter
 * is not an option; 42 bits keeps collision odds low (~1e-5 at 10k
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

function contextKeyOf(query: string | undefined, suffix: string): string {
	const queryPart = query === undefined ? "-" : "+" + query.length + ":" + query;
	return queryPart + suffix.length + ":" + suffix;
}

function appendKeyPart(key: string, value: string): string {
	return key + value.length + ":" + value;
}

export function expandAmpersands(input: string, replacement: string): string {
	let expanded = "";
	let quote = 0;
	for (let i = 0; i < input.length; i++) {
		const code = input.charCodeAt(i);
		if (code === 92 /* \\ */ && i + 1 < input.length) {
			expanded += input[i] + input[++i];
			continue;
		}
		if (quote !== 0) {
			expanded += input[i];
			if (code === quote) quote = 0;
			continue;
		}
		if (code === 34 /* " */ || code === 39 /* ' */) {
			quote = code;
			expanded += input[i];
		} else {
			expanded += code === 38 /* & */ ? replacement : input[i];
		}
	}
	return expanded;
}

function selectorFor(className: string, suffix: string): string {
	const selector = "." + className;
	return selector + expandAmpersands(suffix, selector);
}

/**
 * True for strings usable verbatim as an unescaped CSS class selector:
 * letters/digits/`-`/`_`, not starting with a digit or `-`+digit.
 * Char-code loop rather than a RegExp — this runs on the cold mint path but
 * stays allocation-free either way.
 */
function isValidClassName(name: string): boolean {
	if (name.length === 0 || name === "-") return false;
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
	let contextKey = contextKeyOf(query, suffix);
	for (const [prop, value] of decls) {
		body += (body ? ";" : "") + prop + ":" + value;
		contextKey = appendKeyPart(appendKeyPart(contextKey, prop), value);
	}
	if (name !== undefined && !isValidClassName(name)) {
		console.warn(
			`[nuclo] css() name ${JSON.stringify(name)} is not a valid CSS class name ` +
				"(letters, digits, - and _ only, not starting with a digit); falling back to a generated name.",
		);
		name = undefined;
	}
	const declKey = name === undefined ? "a" + contextKey : "n" + appendKeyPart("", name) + contextKey;
	let className = state.atomCache.get(declKey);
	if (className !== undefined) {
		// Touch the sheet so a swapped document (tests) gets the replayed rules.
		ensureSheet();
		return className;
	}

	if (name === undefined) {
		className = "n" + hash(declKey);
	} else {
		className = exactName ? name : name + "-" + hash(declKey);
		if (state.atomMeta.has(className)) {
			console.warn(
				`[nuclo] css() name ${JSON.stringify(className)} is already used by a different style. ` +
					"Both rules are emitted under the same class, so they will override each other — rename one.",
			);
		}
	}

	state.atomCache.set(declKey, className);
	state.atomMeta.set(className, { query, suffix, decls, name });
	record(selectorFor(className, suffix) + "{" + body + "}", query);
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
	const a = state.atomMeta.get(first);
	const b = state.atomMeta.get(second);
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
	const meta = state.atomMeta.get(className);
	return meta === undefined ? undefined : contextKeyOf(meta.query, meta.suffix);
}

/** Current registry generation, used to invalidate per-instance WeakMap hits after resetStyles(). */
export function getStyleEpoch(): number {
	return state.styleEpoch;
}

/** Register a non-atomic rule (keyframes, global styles) once per dedupe key. */
export function addRawRule(dedupeKey: string, rule: string): void {
	if (state.rawKeys.has(dedupeKey)) {
		ensureSheet();
		return;
	}
	state.rawKeys.add(dedupeKey);
	record(rule, undefined);
}

/** All generated CSS — base rules first, then at-rule groups in registration order. */
export function getCssText(): string {
	if (state.cssTextCache !== null) return state.cssTextCache;
	let out = state.baseRules.join("");
	for (const [query, rules] of state.queryRules) {
		if (rules.length > 0) out += query + "{" + rules.join("") + "}";
	}
	state.cssTextCache = out;
	return out;
}

/** Clear all engine state (test helper). Removes the injected style element. */
export function resetStyles(): void {
	state.atomCache.clear();
	state.atomMeta.clear();
	state.rawKeys.clear();
	state.baseRules.length = 0;
	state.queryRules.clear();
	state.groupRules.clear();
	state.cssTextCache = null;
	state.baseRuleCount = 0;
	state.sheet = null;
	state.sheetDocument = null;
	state.externalRules = null;
	state.hasExternalGroups = false;
	state.styleEpoch++;
	if (typeof document !== "undefined") {
		document.getElementById("nuclo-styles")?.remove();
	}
}
