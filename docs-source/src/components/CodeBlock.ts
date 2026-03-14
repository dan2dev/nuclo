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

// CSS-class-based syntax highlighting — safe against CSS variable name collisions
// Class names (.tok-kw, .tok-str, etc.) never contain JS keywords so regexes
// cannot corrupt previously highlighted spans.
function highlightCode(code: string): string {
  return code
    // strings (single/double/template quotes)
    .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="tok-str">$&</span>')
    // single-line comments
    .replace(/(\/\/[^\n]*)/g, '<span class="tok-comment">$1</span>')
    // keywords
    .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|type|interface|async|await|new|class|extends|implements|public|private|protected|static|readonly|typeof|keyof|in|of|true|false|null|undefined|this)\b/g,
      '<span class="tok-kw">$1</span>')
    // function / method calls
    .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="tok-fn">$1</span>(')
    // numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="tok-num">$1</span>')
    // types after colon
    .replace(/:\s*([A-Z][a-zA-Z0-9_]*)/g, ': <span class="tok-type">$1</span>');
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
