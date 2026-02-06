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

function escapeText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttrValue(text: string): string {
  return escapeText(text).replaceAll('"', "&quot;");
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

function parseTagAndInlineSelectors(segment: string): {
  tag: string;
  id?: string;
  classes: string[];
} {
  const tagMatch = /^[a-zA-Z][a-zA-Z0-9-]*/.exec(segment);
  if (!tagMatch) {
    throw new Error(`Invalid tag segment: ${segment}`);
  }
  const tag = tagMatch[0];
  const rest = segment.slice(tag.length);
  const classes: string[] = [];
  let id: string | undefined;

  const re = /([.#])([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(rest))) {
    if (match[1] === ".") classes.push(match[2]);
    else id = match[2];
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

function renderNode(node: TplNode): string {
  const attrs: Record<string, string | true> = { ...node.attrs };
  if (node.classes.size > 0) {
    const existing = typeof attrs.class === "string" ? attrs.class : "";
    const merged = new Set<string>([
      ...existing.split(/\s+/).map((s) => s.trim()).filter(Boolean),
      ...node.classes,
    ]);
    attrs.class = Array.from(merged).join(" ");
  }
  const attrStr = Object.entries(attrs)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${escapeAttrValue(String(v))}"`))
    .join("");

  const open = `<${node.tag}${attrStr}>`;
  if (VOID_TAGS.has(node.tag.toLowerCase())) {
    return open;
  }
  const inner = node.children
    .map((c) => (typeof c === "string" ? escapeText(c) : renderNode(c)))
    .join("");
  return `${open}${inner}</${node.tag}>`;
}

export function renderTemplateToHtml(tpl: string): string {
  const lines = tpl
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const topLevel: TplNode[] = [];
  const pathToNode = new Map<string, TplNode>();

  for (const line of lines) {
    const { head, text } = splitLineText(line);

    // Extract attrs: { ... }
    let attrs: Record<string, string | true> = {};
    let headNoAttrs = head;
    const attrMatch = /\{([\s\S]*)\}/.exec(head);
    if (attrMatch) {
      attrs = parseAttrs(attrMatch[1].trim());
      headNoAttrs = head.replace(attrMatch[0], " ").trim();
    }

    // Split path + optional trailing selectors
    const parts = headNoAttrs.split(/\s+/).filter(Boolean);
    const pathStr = parts[0] ?? "";
    if (!pathStr) continue;
    const trailingSelectors = parts.slice(1);

    const segs = pathStr.split("/").filter(Boolean);
    const tagOnlyPath = segs.map((s) => parseTagAndInlineSelectors(s).tag);

    // Reuse the longest existing prefix, but NEVER reuse the full path.
    // This makes repeated leaf paths (e.g. `div/ul/li: ...`) append siblings.
    const maxReuseLen = Math.max(0, tagOnlyPath.length - 1);
    let reusePrefixLen = 0;
    for (let i = maxReuseLen; i >= 1; i--) {
      const key = tagOnlyPath.slice(0, i).join("/");
      if (pathToNode.has(key)) {
        reusePrefixLen = i;
        break;
      }
    }

    let current: TplNode | undefined;
    let startIndex = 0;
    if (reusePrefixLen >= 2) {
      const key = tagOnlyPath.slice(0, reusePrefixLen).join("/");
      current = pathToNode.get(key);
      startIndex = reusePrefixLen;
    }

    for (let i = startIndex; i < segs.length; i++) {
      const parsed = parseTagAndInlineSelectors(segs[i]);
      const node: TplNode = {
        tag: parsed.tag,
        attrs: {},
        classes: new Set(parsed.classes),
        children: [],
      };
      if (parsed.id) node.attrs.id = parsed.id;

      if (!current) {
        topLevel.push(node);
      } else {
        current.children.push(node);
      }
      current = node;

      const key = tagOnlyPath.slice(0, i + 1).join("/");
      pathToNode.set(key, node);
    }

    if (!current) continue;

    // Apply trailing selectors to the final node
    for (const sel of trailingSelectors) {
      if (sel.startsWith(".")) current.classes.add(sel.slice(1));
      else if (sel.startsWith("#")) current.attrs.id = sel.slice(1);
    }

    // Apply attrs (merge class/id when present)
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class" && typeof v === "string") {
        v.split(/\s+/).map((s) => s.trim()).filter(Boolean).forEach((c) => current!.classes.add(c));
        continue;
      }
      if (k === "id" && typeof v === "string") {
        current.attrs.id = v;
        continue;
      }
      current.attrs[k] = v;
    }

    if (text && text.length > 0) {
      current.children.push(text);
    }
  }

  return topLevel.map(renderNode).join("\n");
}

export const templateHtml = renderTemplateToHtml(template);
