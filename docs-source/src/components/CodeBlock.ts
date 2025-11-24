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

// Simple syntax highlighting for TypeScript/JavaScript
function highlightCode(codeStr: string): string {
  let result = codeStr
    // Strings (single and double quotes)
    .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, `<span style="color: ${colors.codeString}">$&</span>`)
    // Comments (single line)
    .replace(/(\/\/.*$)/gm, `<span style="color: ${colors.codeComment}">$1</span>`)
    // Keywords
    .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|type|interface|async|await|new|class|extends|implements|public|private|protected|static|readonly|typeof|keyof|in|of|true|false|null|undefined|this)\b/g,
      `<span style="color: ${colors.codeKeyword}">$1</span>`)
    // Function calls
    .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, `<span style="color: ${colors.codeFunction}">$1</span>(`)
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, `<span style="color: ${colors.codeNumber}">$1</span>`)
    // Types after colon
    .replace(/:\s*([A-Z][a-zA-Z0-9_]*)/g, `: <span style="color: ${colors.codeKeyword}">$1</span>`);

  return result;
}

export function CodeBlock(codeContent: string, _language = "typescript", showCopy = true) {
  const id = `code-${Math.random().toString(36).slice(2, 9)}`;
  const highlighted = highlightCode(codeContent.trim());

  return div(
    cn(position("relative")),
    pre(
      s.codeBlock,
      code(
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
          .backgroundColor(colors.bgLight)
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
