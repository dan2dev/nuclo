// The docs site's syntax highlighter (docs/src/components/CodeBlock.ts: highlightCode), producing
// lines of [token class, text] runs instead of HTML, so the app highlights an example's source when it opens.

/** A line of code: [token class, text] runs. */
export type Line = string[][];

/**
 * Appends a run to a line. Spaces become non-breaking (native text collapses whitespace as CSS does, and code
 * keeps its indentation) and lead the run after them (hosts measure a run's leading spaces, not always its
 * trailing ones). Runs of one class join: fewer runs, fewer views.
 */
export function addRun(line: Line, cls: string, part: string) {
  const [, body, spaces] = part.replace(/ /g, "\u00a0").match(/^([\s\S]*?)(\u00a0*)$/)!;
  for (const [k, value] of [[cls, body], ["", spaces]]) {
    if (!value) continue;
    const last = line.at(-1);
    if (last && !last[1].trim()) line[line.length - 1] = [k, last[1] + value];
    else if (last && last[0] === k && value.trim()) last[1] += value;
    else line.push([k, value]);
  }
}

const keywords = new Set([
  "import", "export", "from", "const", "let", "var", "function", "return", "if", "else",
  "for", "while", "async", "await", "new", "typeof", "instanceof", "class", "extends",
  "default", "type", "interface", "enum", "void", "null", "undefined", "true", "false",
  "in", "of", "break", "continue", "switch", "case", "try", "catch", "finally", "throw",
  "this", "static", "public", "private", "protected", "readonly", "as", "keyof",
]);

const types = new Set([
  "string", "number", "boolean", "any", "never", "unknown", "object", "symbol", "bigint",
  "Array", "Promise", "Record", "Partial", "Required", "Readonly", "Map", "Set", "Date",
  "Error", "EventTarget", "HTMLElement", "Element", "Node", "Event", "MouseEvent",
  "KeyboardEvent", "HTMLInputElement", "HTMLButtonElement", "Document", "Window",
  "DocumentFragment", "Text", "Comment",
]);

function tokenize(text: string): Line {
  const line: Line = [];
  const add = (cls: string, part: string) => addRun(line, cls, part);
  if (text.trimStart().startsWith("//")) {
    add("cm", text);
    return line;
  }
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "/" && text[i + 1] === "/") {
      add("cm", text.slice(i));
      break;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === "\\") { j += 2; continue; }
        if (text[j++] === ch) break;
      }
      add("st", text.slice(i, j));
      i = j;
    } else if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z_$]/.test(text[i - 1]))) {
      let j = i;
      while (j < text.length && /[0-9._]/.test(text[j])) j++;
      add("nm", text.slice(i, j));
      i = j;
    } else if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < text.length && /[a-zA-Z0-9_$]/.test(text[j])) j++;
      const word = text.slice(i, j);
      const next = text[j] ?? "";
      add(
        keywords.has(word) ? "kw"
          : types.has(word) ? "ty"
          : next === "(" || next === "<" ? "fn"
          : /[A-Z]/.test(word[0]) ? "ty"
          : text[i - 1] === "." ? "pr"
          : "",
        word,
      );
      i = j;
    } else {
      add(/[{}()[\];,.:=><!+\-*/%&|^~?@]/.test(ch) ? "pt" : "", ch);
      i++;
    }
  }
  return line;
}

export const highlight = (code: string): Line[] => code.trim().split("\n").map(tokenize);
