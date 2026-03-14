import "nuclo";
import { cn, s, colors } from "../styles.ts";
import { CopyIcon, CheckIcon } from "./icons.ts";

let copiedStates: Record<string, boolean> = {};

function setCopied(id: string, value: boolean) {
  copiedStates[id] = value;
  update();
}

function isCopied(id: string): boolean {
  return copiedStates[id] || false;
}

type SegmentKind = "text" | "string" | "comment";

type CodeSegment = {
  kind: SegmentKind;
  value: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tokenizeCode(code: string): CodeSegment[] {
  const segments: CodeSegment[] = [];
  let cursor = 0;
  let textStart = 0;

  function pushText(end: number) {
    if (end > textStart) {
      segments.push({ kind: "text", value: code.slice(textStart, end) });
    }
  }

  while (cursor < code.length) {
    const char = code[cursor];
    const next = code[cursor + 1];

    if (char === "/" && next === "/") {
      pushText(cursor);

      let end = cursor + 2;
      while (end < code.length && code[end] !== "\n") {
        end++;
      }

      segments.push({ kind: "comment", value: code.slice(cursor, end) });
      cursor = end;
      textStart = end;
      continue;
    }

    if (char === "/" && next === "*") {
      pushText(cursor);

      let end = cursor + 2;
      while (end < code.length && !(code[end] === "*" && code[end + 1] === "/")) {
        end++;
      }
      end = Math.min(end + 2, code.length);

      segments.push({ kind: "comment", value: code.slice(cursor, end) });
      cursor = end;
      textStart = end;
      continue;
    }

    if (char === "'" || char === "\"" || char === "`") {
      pushText(cursor);

      const quote = char;
      let end = cursor + 1;

      while (end < code.length) {
        if (code[end] === "\\") {
          end += 2;
          continue;
        }

        if (code[end] === quote) {
          end++;
          break;
        }

        end++;
      }

      segments.push({ kind: "string", value: code.slice(cursor, end) });
      cursor = end;
      textStart = end;
      continue;
    }

    cursor++;
  }

  pushText(code.length);
  return segments;
}

function highlightPlainText(code: string): string {
  return escapeHtml(code)
    .replace(
      /\b(import|export|from|const|let|var|function|return|if|else|for|while|type|interface|async|await|new|class|extends|implements|public|private|protected|static|readonly|typeof|keyof|in|of|true|false|null|undefined|this)\b/g,
      '<span class="tok-kw">$1</span>'
    )
    .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="tok-fn">$1</span>(')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-num">$1</span>')
    .replace(/:\s*([A-Z][a-zA-Z0-9_]*)/g, ': <span class="tok-type">$1</span>');
}

function highlightCode(code: string): string {
  return tokenizeCode(code)
    .map((segment) => {
      if (segment.kind === "string") {
        return `<span class="tok-str">${escapeHtml(segment.value)}</span>`;
      }

      if (segment.kind === "comment") {
        return `<span class="tok-comment">${escapeHtml(segment.value)}</span>`;
      }

      return highlightPlainText(segment.value);
    })
    .join("");
}

export function CodeBlock(codeContent: string, _language = "typescript", showCopy = true) {
  const id = `code-${Math.random().toString(36).slice(2, 9)}`;
  const highlighted = highlightCode(codeContent.trim());

  return div(
    cn(position("relative").width("100%").maxWidth("100%").boxSizing("border-box")),
    pre(
      s.codeBlock,
      code(
        cn(display("block").width("100%").maxWidth("100%").whiteSpace("pre").overflowX("auto")),
        { innerHTML: highlighted }
      )
    ),
    showCopy ? button(
      cn(
        position("absolute")
          .top("12px")
          .right("12px")
          .padding("6px 10px")
          .borderRadius("6px")
          .color(colors.textMuted)
          .fontSize("12px")
          .cursor("pointer")
          .display("flex")
          .alignItems("center")
          .gap("4px")
          .transition("all 0.2s")
          .backgroundColor(colors.bgSecondary)
          .border(`1px solid ${colors.border}`),
        {
          hover: border(`1px solid ${colors.borderLight}`).color(colors.text)
        }
      ),
      () => isCopied(id) ? CheckIcon() : CopyIcon(),
      () => isCopied(id) ? "Copied!" : "Copy",
      on("click", async () => {
        await navigator.clipboard.writeText(codeContent.trim());
        setCopied(id, true);
        setTimeout(() => setCopied(id, false), 2000);
      })
    ) : null
  );
}

export function InlineCode(codeText: string) {
  return code(s.codeInline, codeText);
}
