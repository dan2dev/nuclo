// Pure model for the class-rule subset of CSS: parse, serialize, tokenize,
// plus the value helpers the GUI controls share. No DOM in here, so it also
// runs under `bun src/css.check.ts`.

export type Decl = { prop: string; value: string; important: boolean };
export type Rule = { selector: string; decls: Decl[] };

export function getDecl(rule: Rule, prop: string) {
  return rule.decls.find((d) => d.prop === prop);
}

/** Set a declaration's value, or remove it when the value is empty. */
export function setDecl(rule: Rule, prop: string, value: string) {
  value = value.trim();
  const d = getDecl(rule, prop);
  if (!value) {
    if (d) rule.decls.splice(rule.decls.indexOf(d), 1);
  } else if (d) d.value = value;
  else rule.decls.push({ prop, value, important: false });
}

/** Later declaration wins, unless the earlier one is !important and the later is not. */
function putDecl(decls: Decl[], d: Decl) {
  const i = decls.findIndex((x) => x.prop === d.prop);
  if (i < 0) decls.push(d);
  else if (d.important || !decls[i].important) decls[i] = d;
}

export function serialize(rules: Rule[]) {
  return rules
    .map((r) => {
      const body = r.decls
        .filter((d) => d.prop.trim() && d.value.trim())
        .map((d) => `  ${d.prop}: ${d.value}${d.important ? " !important" : ""};\n`)
        .join("");
      return `${r.selector} {\n${body}}\n`;
    })
    .join("\n");
}

export type Parsed = { rules: Rule[]; error: string | null };

/**
 * Tolerant parser for `selector { prop: value; … }` blocks. Comments are
 * blanked (not removed) so error line numbers stay right. Strings and
 * parentheses are respected inside values (`url("a;b")`, `rgba(…)`).
 * Rules sharing a selector are merged. At-rules and nesting are errors.
 */
export function parse(text: string): Parsed {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  const lineOf = (i: number) => src.slice(0, i).split("\n").length;
  const fail = (at: number, msg: string): Parsed => ({ rules: [], error: `Line ${lineOf(at)}: ${msg}` });
  const rules: Rule[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\n" || c === "\t" || c === "\r") { i++; continue; }
    if (c === "@") return fail(i, "at-rules (@media, @keyframes…) aren't supported — class rules only");
    if (c === "}") return fail(i, 'unexpected "}"');
    const open = src.indexOf("{", i);
    if (open < 0) return fail(i, 'expected "{" after the selector');
    const selector = src.slice(i, open).trim().replace(/\s+/g, " ");
    if (!selector) return fail(open, 'missing selector before "{"');
    const bad = /[;}]/.exec(selector);
    if (bad) return fail(i, `unexpected "${bad[0]}" in selector "${selector}"`);

    const rule: Rule = { selector, decls: [] };
    let j = open + 1, start = j, depth = 0, quote = "";
    for (; ; j++) {
      if (j >= src.length) return fail(open, `missing closing "}" for "${selector}"`);
      const ch = src[j];
      if (quote) {
        if (ch === "\\") j++;
        else if (ch === quote) quote = "";
        continue;
      }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "(") depth++;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      else if (ch === "{") return fail(j, "nested rules aren't supported");
      else if (depth === 0 && (ch === ";" || ch === "}")) {
        const chunk = src.slice(start, j).trim();
        if (chunk) {
          const at = start + src.slice(start, j).search(/\S/);
          const colon = chunk.indexOf(":");
          const prop = colon < 0 ? chunk : chunk.slice(0, colon).trim();
          let value = colon < 0 ? "" : chunk.slice(colon + 1).trim();
          if (colon < 0 || !/^-?-?[a-zA-Z_][\w-]*$/.test(prop)) return fail(at, `expected "property: value", got "${chunk}"`);
          const important = /!\s*important$/i.test(value);
          if (important) value = value.replace(/\s*!\s*important$/i, "").trim();
          if (!value) return fail(at, `missing value for "${prop}"`);
          putDecl(rule.decls, { prop: prop.startsWith("--") ? prop : prop.toLowerCase(), value, important });
        }
        start = j + 1;
        if (ch === "}") break;
      }
    }
    const dup = rules.find((r) => r.selector === selector);
    if (dup) rule.decls.forEach((d) => putDecl(dup.decls, d));
    else rules.push(rule);
    i = j + 1;
  }
  return { rules, error: null };
}

// ── syntax highlighting ──────────────────────────────────────────────────────

export type Token = { text: string; kind: "sel" | "prop" | "val" | "punct" | "comment" | "ws" };

/** Lossless tokenizer: concatenating `text` gives the input back. */
export function tokenize(code: string): Token[] {
  const out: Token[] = [];
  const re = /\/\*[\s\S]*?\*\/|[{};:]|"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?|[^{};:"'/]+|\//g;
  let inBlock = false, inValue = false;
  for (const m of code.match(re) ?? []) {
    let kind: Token["kind"];
    if (m.startsWith("/*")) kind = "comment";
    else if (m === "{") { kind = "punct"; inBlock = true; inValue = false; }
    else if (m === "}") { kind = "punct"; inBlock = false; inValue = false; }
    else if (m === ";") { kind = "punct"; inValue = false; }
    else if (m === ":") {
      if (!inBlock) kind = "sel";
      else if (inValue) kind = "val";
      else { kind = "punct"; inValue = true; }
    } else if (!m.trim()) kind = "ws";
    else kind = !inBlock ? "sel" : inValue ? "val" : "prop";
    out.push({ text: m, kind });
  }
  return out;
}

// ── value helpers ────────────────────────────────────────────────────────────

export type Len = { n: number; unit: string };

/** "12px" → { n: 12, unit: "px" }; "1.5" → unit ""; keywords and calc() → null. */
export function parseLen(v: string | undefined): Len | null {
  const m = v && /^(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/i.exec(v.trim());
  return m ? { n: parseFloat(m[1]), unit: m[2].toLowerCase() } : null;
}

export const fmt = (n: number, unit: string) => `${+n.toFixed(3)}${unit}`;

/** Arrow-key style increment: keeps the unit, leaves non-numeric values alone. */
export function nudge(v: string, delta: number) {
  const l = parseLen(v);
  return l ? fmt(l.n + delta, l.unit) : v;
}

/** "12" → "12px" (on blur). "0", keywords and values that already have a unit pass through. */
export function withUnit(v: string, unit: string) {
  const l = parseLen(v);
  return l && !l.unit && l.n !== 0 && unit ? fmt(l.n, unit) : v.trim();
}

export type Sides = [string, string, string, string];

/** Expand a 1–4 value shorthand (margin, padding, inset, border-radius). null when it can't be edited per side. */
export function splitSides(v: string | undefined): Sides | null {
  if (!v) return ["", "", "", ""];
  const p = v.trim().split(/\s+/);
  if (p.length > 4 || p.some((x) => /[(/]/.test(x))) return null;
  const [a, b = a, c = a, d = b] = p;
  return [a, b, c, d];
}

/** Collapse four sides back to the shortest equivalent shorthand. */
export function joinSides(sides: Sides) {
  if (sides.every((x) => !x)) return "";
  const [t, r, b, l] = sides.map((x) => x || "0");
  if (t === r && r === b && b === l) return t;
  if (t === b && r === l) return `${t} ${r}`;
  if (r === l) return `${t} ${r} ${b}`;
  return `${t} ${r} ${b} ${l}`;
}

/** Class names in the first selector of a list, for the preview element: ".btn.primary:hover, .x" → "btn primary". */
export function classesOf(selector: string) {
  return (selector.split(",")[0].match(/\.[\w-]+/g) ?? []).map((c) => c.slice(1)).join(" ");
}

// ── matching & smart input (for the palettes) ────────────────────────────────

/** 0 = no match. Prefix beats substring beats subsequence; word starts and runs score higher, shorter wins ties. */
export function fuzzyScore(query: string, text: string) {
  query = query.toLowerCase();
  text = text.toLowerCase();
  if (!query) return 1;
  if (text.startsWith(query)) return 1000 - text.length;
  const at = text.indexOf(query);
  if (at >= 0) return 500 - at - text.length / 10;
  let qi = 0, score = 0, prev = -2;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] !== query[qi]) continue;
    score += i === 0 || text[i - 1] === "-" || text[i - 1] === " " ? 10 : prev === i - 1 ? 6 : 1;
    prev = i;
    qi++;
  }
  return qi === query.length ? score - text.length / 10 : 0;
}

const UNITLESS = new Set(["opacity", "z-index", "line-height", "font-weight", "flex", "flex-grow", "flex-shrink", "order", "zoom", "aspect-ratio", "scale", "column-count", "tab-size"]);

/** What a typed value means for a property: bare numbers get a unit unless the property is unitless. */
export function smartValue(prop: string, raw: string, unit = "px") {
  return UNITLESS.has(prop) || prop.startsWith("--") ? raw.trim() : withUnit(raw, unit);
}

/** What someone typed in the class switcher, as a selector: "btn" → ".btn", ":hover" → "<current>:hover", ".a .b" stays. */
export function toSelector(q: string, current?: string) {
  q = q.trim().replace(/\s+/g, " ");
  if (!q) return "";
  if (q.startsWith(":") && current) return current.split(",")[0].trim() + q;
  return /^[.#*:[]/.test(q) ? q : `.${q}`;
}
