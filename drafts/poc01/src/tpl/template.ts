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

function splitLineText(line: string): { head: string; text: string | undefined } {
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth = Math.max(0, depth - 1);
    else if (ch === ":" && depth === 0) {
      const head = line.slice(0, i).trim();
      const text = line.slice(i + 1).trim();
      return { head, text };
    }
  }
  return { head: line.trim(), text: undefined };
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
  const lines = tpl
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const topLevel: TplNode[] = [];
  const pathToNode = new Map<string, TplNode>();

  for (const line of lines) {
    const { head, text } = splitLineText(line);

    // Extract attrs: { ... } (fast path, no regex)
    let attrs: Record<string, string | true> = {};
    let headNoAttrs = head;
    const openBrace = head.indexOf("{");
    if (openBrace !== -1) {
      const closeBrace = head.lastIndexOf("}");
      if (closeBrace > openBrace) {
        attrs = parseAttrs(head.slice(openBrace + 1, closeBrace).trim());
        headNoAttrs = (head.slice(0, openBrace) + " " + head.slice(closeBrace + 1)).trim();
      }
    }

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
