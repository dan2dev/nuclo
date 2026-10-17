// blocks.ts: the HTML and live blocks the docs text is written with (i18n/<locale>/docs.ts).
import { css, colors, s } from "../../styles.ts";
import { TabBlock } from "../../components/TabBlock.ts";
import { CopyIcon, CheckIcon } from "../../components/icons.ts";
import { copyText } from "../../components/clipboard.ts";
import { highlightCode } from "../../components/CodeBlock.ts";
import { t } from "../../i18n/index.ts";

export function TerminalCommand(command: string) {
  let copied = false;

  function handleCopy() {
    copyText(command).then((ok) => {
      if (!ok) return;
      copied = true;
      update();
      setTimeout(() => { copied = false; update(); }, 1800);
    });
  }

  return div(
    s.installCmd,
    span(css("docs-terminal-prompt", { color: colors.textMuted, fontFamily: "ui-monospace, monospace" }), "$"),
    span(command),
    button(
      css("docs-terminal-copy-button", { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "6px", color: colors.textMuted, backgroundColor: "transparent", border: "none", cursor: "pointer", hover: { color: colors.text, backgroundColor: colors.bgLight } }),
      { title: t.common.copyToClipboard, "aria-label": t.common.copy },
      when(() => copied, CheckIcon({ size: 14 })).else(CopyIcon({ size: 14 })),
      { onClick: handleCopy },
    ),
  );
}

export const quickStartTabsWrap = css("quickStartTabsWrap", { margin: "22px 0" });

export const CREATE_COMMANDS = {
  npm: "npm create nuclo@latest",
  bun: "bun create nuclo",
  pnpm: "pnpm create nuclo",
};

export function QuickStartTabs() {
  return div(
    quickStartTabsWrap,
    TabBlock({
      tabs: Object.entries(CREATE_COMMANDS).map(([id, cmd]) => ({ id, label: id, content: TerminalCommand(cmd) })),
    }),
  );
}

// ── HTML helpers for section content ─────────────────────────────────────
export function frame(file: string, body: string): string {
  return `<div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">${file}</span></div><div class="code-block-body"><pre>${body}</pre></div></div>`;
}

/** A syntax-highlighted code block. */
export const code = (file: string, src: string) => frame(file, highlightCode(src.trim()));

/** A terminal block, one command per argument. */
export const sh = (...commands: string[]) =>
  frame("terminal", commands.map((c) => {
    const [bin, ...rest] = c.split(" ");
    return `<span class="pt">$</span> <span class="fn">${bin}</span> ${rest.join(" ")}`;
  }).join("\n"));

/** A syntax-highlighted signature for `apiSig`. */
export const sig = (src: string) => highlightCode(src.trim());
