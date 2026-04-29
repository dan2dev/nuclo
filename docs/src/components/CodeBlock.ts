import { cn, colors, s } from "../styles.ts";

// ── Simple tokenizer for TypeScript/JS syntax highlighting ─────────────────
function tokenize(code: string): string {
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

export interface CodeBlockOptions {
  filename?: string;
  code: string;
  showCopy?: boolean;
  preTokenized?: boolean;
}

export function CodeBlock({ filename, code, showCopy = true, preTokenized = false }: CodeBlockOptions) {
  let copied = false;

  const tokenized = preTokenized ? code : tokenize(code);

  const copyBtn = cn(
    display("flex").alignItems("center").gap("5px")
      .fontSize("0.75rem").fontWeight("500")
      .color(colors.textMuted).padding("4px 10px")
      .borderRadius("5px").transition("all 0.18s ease")
      .border(`1px solid transparent`)
      .backgroundColor("transparent").fontFamily("'Space Grotesk', system-ui, sans-serif"),
    { hover: color(colors.primary).borderColor("rgba(56,105,236,0.25)").backgroundColor(colors.primaryAlpha08) }
  );

  function handleCopy() {
    navigator.clipboard?.writeText(code).then(() => {
      copied = true;
      update();
      setTimeout(() => { copied = false; update(); }, 1800);
    });
  }

  return div(
    s.codeBlockFrame,
    ...(filename || showCopy ? [
      div(
        s.codeBlockHeader,
        filename
          ? span(s.codeBlockFilename, filename)
          : span(),
        showCopy
          ? button(
              copyBtn,
              when(() => copied, "✓ Copied").else("Copy"),
              on("click", handleCopy),
            )
          : span(),
      ),
    ] : []),
    div(
      s.codeBlockBody,
      cn(color(colors.text)),
      { innerHTML: () => `<pre style="margin:0;white-space:pre-wrap;word-break:break-word">${tokenized}</pre>` },
    ),
  );
}
