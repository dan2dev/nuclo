const people = [{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }];
export const template = `
div: Hello, World!
div/h1 #main-title: Welcome to My Site
div
div/ul .item-list
${people.map(p => `div/ul/li: ${p.name}`).join("\n")}
div/div/a.link { href="https://example.com" target="_blank" }: Visit Example.com
`

type TplNode = {
  tag: string;
  attrs: Record<string, string | true>;
  classes: Set<string>;
  children: Array<TplNode | string>;
  id?: string;
  _open?: string;
  _close?: string;
  _isVoid?: boolean;
};

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const TEXT_ESCAPE_RE = /[&<>]/g;
function escapeText(text: string): string {
  return text.replace(TEXT_ESCAPE_RE, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      default:
        return ch;
    }
  });
}

const ATTR_ESCAPE_RE = /[&<>"]/g;
function escapeAttrValue(text: string): string {
  return text.replace(ATTR_ESCAPE_RE, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return ch;
    }
  });
}

function parseAttrs(attrBody: string): Record<string, string | true> {
  const attrs: Record<string, string | true> = {};
  const re = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrBody))) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4];
    attrs[key] = value === undefined ? true : value;
  }
  return attrs;
}

function isIdentStart(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    ch === "_"
  );
}
function isIdentChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    (code >= 48 && code <= 57) ||
    ch === "_" ||
    ch === "-"
  );
}

function parseTagAndInlineSelectors(segment: string): {
  tag: string;
  id?: string;
  classes: string[];
} {
  if (segment.length === 0) throw new Error("Empty tag segment");

  let i = 0;
  const first = segment[i];
  const isTagStart =
    (first >= "A" && first <= "Z") || (first >= "a" && first <= "z");
  if (!isTagStart) {
    throw new Error(`Invalid tag segment: ${segment}`);
  }
  i++;
  while (i < segment.length) {
    const ch = segment[i];
    const isTagChar =
      (ch >= "A" && ch <= "Z") ||
      (ch >= "a" && ch <= "z") ||
      (ch >= "0" && ch <= "9") ||
      ch === "-";
    if (!isTagChar) break;
    i++;
  }
  const tag = segment.slice(0, i);

  const classes: string[] = [];
  let id: string | undefined;

  while (i < segment.length) {
    const ch = segment[i];
    if (ch !== "." && ch !== "#") {
      i++;
      continue;
    }
    const kind = ch;
    i++;
    if (i >= segment.length || !isIdentStart(segment[i])) {
      continue;
    }
    const start = i;
    i++;
    while (i < segment.length && isIdentChar(segment[i])) i++;
    const value = segment.slice(start, i);
    if (kind === ".") classes.push(value);
    else id = value;
  }

  return { tag, id, classes };
}

type QuoteState = "\"" | "'" | null;

function normalizeHeadWhitespace(head: string): string {
  return head.replace(/\s+/g, " ").trim();
}

function normalizeTextBlock(text: string): string | undefined {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return undefined;
  return lines.join("\n");
}

function scanForColonOutsideBraces(source: string): number {
  let depth = 0;
  let quote: QuoteState = null;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "\"" || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") depth = Math.max(0, depth - 1);
    else if (ch === ":" && depth === 0) return i;
  }
  return -1;
}

function splitStatementHeadText(statement: string): {
  head: string;
  text: string | undefined;
} {
  const idx = scanForColonOutsideBraces(statement);
  if (idx === -1) return { head: normalizeHeadWhitespace(statement), text: undefined };
  const head = normalizeHeadWhitespace(statement.slice(0, idx));
  const text = normalizeTextBlock(statement.slice(idx + 1));
  return { head, text };
}

function extractFirstAttrBlock(head: string): {
  headNoAttrs: string;
  attrs: Record<string, string | true>;
} {
  let depth = 0;
  let quote: QuoteState = null;
  let start = -1;
  let end = -1;

  for (let i = 0; i < head.length; i++) {
    const ch = head[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "\"" || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "{") {
      if (depth === 0 && start === -1) start = i;
      depth++;
      continue;
    }
    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && start !== -1) {
        end = i;
        break;
      }
    }
  }

  if (start === -1 || end === -1 || end <= start) {
    return { headNoAttrs: normalizeHeadWhitespace(head), attrs: {} };
  }

  const attrsBody = head.slice(start + 1, end).trim();
  const attrs = attrsBody.length > 0 ? parseAttrs(attrsBody) : {};
  const headNoAttrs = normalizeHeadWhitespace(head.slice(0, start) + " " + head.slice(end + 1));
  return { headNoAttrs, attrs };
}

function scanLineStructure(
  line: string,
  braceDepth: number,
  quote: QuoteState,
): { braceDepth: number; quote: QuoteState; opensTextBlock: boolean } {
  let depth = braceDepth;
  let q = quote;
  let colonIndex = -1;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === q) q = null;
      continue;
    }
    if (ch === "\"" || ch === "'") {
      q = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") depth = Math.max(0, depth - 1);
    else if (ch === ":" && depth === 0) {
      colonIndex = i;
      break;
    }
  }

  const opensTextBlock =
    colonIndex !== -1 && line.slice(colonIndex + 1).trim().length === 0;
  return { braceDepth: depth, quote: q, opensTextBlock };
}

function looksLikeNewHeadStrong(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;

  // Tokenize by whitespace; template head allows extra tokens only for .class / #id selectors.
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const pathToken = tokens[0];
  if (/[="'`]/.test(pathToken)) return false;

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (!(t.startsWith(".") || t.startsWith("#") || t.startsWith("{"))) return false;
  }

  try {
    const segs = pathToken.split("/").filter(Boolean);
    if (segs.length === 0) return false;
    for (const seg of segs) parseTagAndInlineSelectors(seg);
  } catch {
    return false;
  }

  // Avoid ambiguous single-token lines (e.g. "Visit") while in text blocks.
  const isStrong =
    pathToken.includes("/") ||
    pathToken.includes(".") ||
    pathToken.includes("#") ||
    trimmed.includes("{") ||
    trimmed.includes(":") ||
    tokens.length > 1;
  return isStrong;
}

function toTemplateStatements(tpl: string): string[] {
  const rawLines = tpl.split(/\r?\n/);
  const statements: string[] = [];

  let buf: string[] = [];
  let braceDepth = 0;
  let quote: QuoteState = null;
  let inTextBlock = false;

  for (const rawLine of rawLines) {
    const line = rawLine;
    const isBlank = line.trim().length === 0;

    if (buf.length === 0) {
      if (isBlank) continue;
      buf.push(line);
    } else {
      if (inTextBlock && braceDepth === 0 && !isBlank && looksLikeNewHeadStrong(line)) {
        statements.push(buf.join("\n").trim());
        buf = [line];
        braceDepth = 0;
        quote = null;
        inTextBlock = false;
      } else {
        buf.push(line);
      }
    }

    if (!inTextBlock) {
      const scan = scanLineStructure(line, braceDepth, quote);
      braceDepth = scan.braceDepth;
      quote = scan.quote;
      if (scan.opensTextBlock) inTextBlock = true;
    }

    if (!inTextBlock && braceDepth === 0 && buf.length > 0) {
      statements.push(buf.join("\n").trim());
      buf = [];
      braceDepth = 0;
      quote = null;
      inTextBlock = false;
    }
  }

  if (buf.length > 0) statements.push(buf.join("\n").trim());
  return statements.filter((s) => s.length > 0);
}

function finalizeNode(node: TplNode): void {
  const isVoid = VOID_TAGS.has(node.tag.toLowerCase());
  node._isVoid = isVoid;

  let attrStr = "";
  if (node.id) {
    attrStr += ` id="${escapeAttrValue(node.id)}"`;
  }
  if (node.classes.size > 0) {
    attrStr += ` class="${escapeAttrValue(Array.from(node.classes).join(" "))}"`;
  }
  for (const [k, v] of Object.entries(node.attrs)) {
    if (v === true) attrStr += ` ${k}`;
    else attrStr += ` ${k}="${escapeAttrValue(String(v))}"`;
  }

  node._open = `<${node.tag}${attrStr}>`;
  node._close = isVoid ? "" : `</${node.tag}>`;

  for (const child of node.children) {
    if (typeof child !== "string") finalizeNode(child);
  }
}

function renderNode(node: TplNode): string {
  const open = node._open ?? `<${node.tag}>`;
  if (node._isVoid) return open;
  let inner = "";
  for (const child of node.children) {
    inner += typeof child === "string" ? escapeText(child) : renderNode(child);
  }
  return `${open}${inner}${node._close ?? `</${node.tag}>`}`;
}

function compileTemplate(tpl: string): TplNode[] {
  const statements = toTemplateStatements(tpl);

  const topLevel: TplNode[] = [];
  const pathToNode = new Map<string, TplNode>();

  for (const statement of statements) {
    const { head, text } = splitStatementHeadText(statement);

    const extracted = extractFirstAttrBlock(head);
    const attrs = extracted.attrs;
    const headNoAttrs = extracted.headNoAttrs;

    const parts = headNoAttrs.split(/\s+/).filter(Boolean);
    const pathStr = parts[0];
    if (!pathStr) continue;
    const trailingSelectors = parts.length > 1 ? parts.slice(1) : [];

    const segs = pathStr.split("/").filter(Boolean);
    const parsedSegs = new Array<{ tag: string; id?: string; classes: string[] }>(segs.length);
    const prefixKeys = new Array<string>(segs.length);
    let keyAcc = "";
    for (let i = 0; i < segs.length; i++) {
      const parsed = parseTagAndInlineSelectors(segs[i]);
      parsedSegs[i] = parsed;
      keyAcc = keyAcc ? `${keyAcc}/${parsed.tag}` : parsed.tag;
      prefixKeys[i] = keyAcc;
    }

    // Reuse the longest existing prefix, but NEVER reuse the full path.
    const maxReuseLen = Math.max(0, prefixKeys.length - 1);
    let reusePrefixLen = 0;
    for (let i = maxReuseLen; i >= 1; i--) {
      if (pathToNode.has(prefixKeys[i - 1])) {
        reusePrefixLen = i;
        break;
      }
    }

    let current: TplNode | undefined;
    let startIndex = 0;
    if (reusePrefixLen >= 1) {
      current = pathToNode.get(prefixKeys[reusePrefixLen - 1]);
      startIndex = reusePrefixLen;
    }

    for (let i = startIndex; i < parsedSegs.length; i++) {
      const parsed = parsedSegs[i];
      const node: TplNode = {
        tag: parsed.tag,
        id: parsed.id,
        attrs: {},
        classes: new Set(parsed.classes),
        children: [],
      };

      if (!current) topLevel.push(node);
      else current.children.push(node);

      current = node;
      pathToNode.set(prefixKeys[i], node);
    }

    if (!current) continue;

    for (const sel of trailingSelectors) {
      if (sel.startsWith(".")) current.classes.add(sel.slice(1));
      else if (sel.startsWith("#")) current.id = sel.slice(1);
    }

    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class" && typeof v === "string") {
        const pieces = v.split(/\s+/);
        for (let i = 0; i < pieces.length; i++) {
          const c = pieces[i].trim();
          if (c) current.classes.add(c);
        }
        continue;
      }
      if (k === "id" && typeof v === "string") {
        current.id = v;
        continue;
      }
      current.attrs[k] = v;
    }

    if (text && text.length > 0) current.children.push(text);
  }

  for (const node of topLevel) finalizeNode(node);
  return topLevel;
}

const MAX_CACHE_ENTRIES = 100;
const compiledCache = new Map<string, TplNode[]>();
const htmlCache = new Map<string, string>();

function lruGet<V>(cache: Map<string, V>, key: string): V | undefined {
  const value = cache.get(key);
  if (value === undefined) return undefined;
  cache.delete(key);
  cache.set(key, value);
  return value;
}

function lruSet<V>(cache: Map<string, V>, key: string, value: V): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
}

export function clearTemplateCache(): void {
  compiledCache.clear();
  htmlCache.clear();
}

export function renderTemplateToHtml(tpl: string): string {
  const cachedHtml = lruGet(htmlCache, tpl);
  if (cachedHtml !== undefined) return cachedHtml;

  let compiled = lruGet(compiledCache, tpl);
  if (!compiled) {
    compiled = compileTemplate(tpl);
    lruSet(compiledCache, tpl, compiled);
  }
  const html = compiled.map(renderNode).join("\n");
  lruSet(htmlCache, tpl, html);
  return html;
}

export const templateHtml = renderTemplateToHtml(template);
