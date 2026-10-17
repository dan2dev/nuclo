import { css, colors, cx, s } from "../styles.ts";
import { copyText } from "./clipboard.ts";
import { t } from "../i18n/index.ts";

// ── Simple tokenizer for TypeScript/JS syntax highlighting ─────────────────
export function highlightCode(code: string): string {
  const lines = code.split('\n');
  return lines.map(line => tokenizeLine(line)).join('\n');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenizeLine(line: string): string {
  if (!line.trim()) return '';

  // Full-line comment
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//')) {
    return `<span class="cm">${esc(line)}</span>`;
  }

  let out = '';
  let i = 0;

  const keywords = new Set([
    'import','export','from','const','let','var','function','return','if','else',
    'for','while','async','await','new','typeof','instanceof','class','extends',
    'default','type','interface','enum','void','null','undefined','true','false',
    'in','of','break','continue','switch','case','try','catch','finally','throw',
    'this','static','public','private','protected','readonly','as','keyof',
  ]);

  const types = new Set([
    'string','number','boolean','any','never','unknown','object','symbol','bigint',
    'Array','Promise','Record','Partial','Required','Readonly','Map','Set','Date',
    'Error','EventTarget','HTMLElement','Element','Node','Event','MouseEvent',
    'KeyboardEvent','HTMLInputElement','HTMLButtonElement','Document','Window',
    'Node','DocumentFragment','Text','Comment','void',
  ]);

  while (i < line.length) {
    const ch = line[i];

    // Comment from here
    if (ch === '/' && line[i+1] === '/') {
      out += `<span class="cm">${esc(line.slice(i))}</span>`;
      break;
    }

    // String (single or double or backtick)
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      const quote = ch;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === quote) { j++; break; }
        j++;
      }
      out += `<span class="st">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Number
    if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z_$]/.test(line[i-1]))) {
      let j = i;
      while (j < line.length && /[0-9._]/.test(line[j])) j++;
      out += `<span class="nm">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Identifier / keyword / type
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const next = j < line.length ? line[j] : '';

      let cls = '';
      if (keywords.has(word)) cls = 'kw';
      else if (types.has(word)) cls = 'ty';
      else if (next === '(' || next === '<') cls = 'fn';
      else if (/[A-Z]/.test(word[0])) cls = 'ty';
      else if (line[i-1] === '.') cls = 'pr';

      if (cls) out += `<span class="${cls}">${esc(word)}</span>`;
      else out += esc(word);
      i = j;
      continue;
    }

    // Punctuation/operators
    if (/[{}()[\];,.:=><!+\-*/%&|^~?@]/.test(ch)) {
      out += `<span class="pt">${esc(ch)}</span>`;
      i++;
      continue;
    }

    out += esc(ch);
    i++;
  }
  return out;
}

export interface CodeFile {
  name: string;
  code: string;
}

export interface CodeBlockOptions {
  filename?: string;
  code: string;
  files?: CodeFile[]; // more than one file: the header becomes IDE-style tabs, one per file
  showCopy?: boolean;
  preTokenized?: boolean;
}

export const codeTokenStyle = css("components-codeblock-codeTokenStyle", {
  color: colors.text,
  "& .kw": { color: "var(--c-tok-keyword)" },
  "& .st": { color: "var(--c-tok-string)" },
  "& .fn": { color: "var(--c-tok-fn)" },
  "& .cm": { color: "var(--c-tok-comment)", fontStyle: "italic" },
  "& .nm": { color: "var(--c-tok-number)" },
  "& .ty": { color: "var(--c-tok-type)" },
  "& .pt": { color: "var(--c-tok-punct)" },
  "& .pr": { color: "var(--c-tok-prop)" },
});

export const terminalCodeTokenStyle = css("components-codeblock-terminalCodeTokenStyle", {
  color: "var(--terminal-text)",
  "& .kw": { color: "var(--terminal-tok-keyword)" },
  "& .st": { color: "var(--terminal-tok-string)" },
  "& .fn": { color: "var(--terminal-tok-fn)" },
  "& .cm": { color: "var(--terminal-tok-comment)", fontStyle: "italic" },
  "& .nm": { color: "var(--terminal-tok-number)" },
  "& .ty": { color: "var(--terminal-tok-type)" },
  "& .pt": { color: "var(--terminal-tok-punct)" },
  "& .pr": { color: "var(--terminal-tok-prop)" },
});

export function CodeBlock({ filename, code, files, showCopy = true, preTokenized = false }: CodeBlockOptions) {
  let copied = false;
  let active = 0;

  const tabs = files && files.length > 1 ? files : null;
  const sources = tabs ? tabs.map((f) => f.code) : [code];
  const tokenized = sources.map((src) => (preTokenized ? src : highlightCode(src)));

  const copyBtn = css("components-codeblock-copyBtn", { display: "flex", alignItems: "center", height: "28px", padding: "0 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "500", color: colors.textMuted, hover: { color: colors.text, backgroundColor: colors.bgLight } });
  const preStyle = css("components-codeblock-preStyle", { margin: "0", whiteSpace: "pre", minWidth: "max-content" });

  function handleCopy() {
    copyText(sources[active]).then((ok) => {
      if (!ok) return;
      copied = true;
      update();
      setTimeout(() => { copied = false; update(); }, 1800);
    });
  }

  return div(
    s.codeBlockFrame,
    ...(tabs || filename || showCopy ? [
      div(
        s.codeBlockHeader,
        tabs
          ? div(
              s.codeBlockTabs,
              { role: "tablist" },
              ...tabs.map((f, i) =>
                button(
                  { role: "tab", class: () => cx(s.codeBlockTab, i === active ? s.codeBlockTabActive : null).className, "aria-selected": () => String(i === active) },
                  f.name,
                  { onClick: () => { active = i; update(); } },
                ),
              ),
            )
          : filename
          ? span(s.codeBlockFilename, filename)
          : span(),
        showCopy
          ? button(
              copyBtn,
              when(() => copied, () => t.common.copied).else(() => t.common.copy),
              { onClick: handleCopy },
            )
          : span(),
      ),
    ] : []),
    div(
      s.codeBlockBody,
      codeTokenStyle,
      { innerHTML: () => `<pre class="${preStyle.className}">${tokenized[active]}</pre>` },
    ),
  );
}
