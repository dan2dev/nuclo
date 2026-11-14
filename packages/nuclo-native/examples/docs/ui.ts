// The docs site's design, as nuclo-native styles: its light palette (docs/src/styles/global.ts) and the
// blocks its pages are made of (code frames, cards, pills, the docs text).
import content from "./content.json";
import type { Line } from "./highlight";

export type { Line };
export type Block =
  | { t: "p" | "h3" | "callout"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "code"; file: string; lines: Line[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "live"; id: string };

export interface Example {
  id: string;
  title: string;
  desc: string;
  docs?: string;
  install?: string;
  files: { name: string; code: string }[];
}

export const data = content as unknown as Omit<typeof content, "sections" | "examples"> & {
  sections: { id: string; group: string; title: string; api?: string; sig?: Line[]; blocks: Block[] }[];
  examples: { labels: { examples: string; title: string; sub: string }; groups: { title: string; sub: string; examples: Example[] }[] };
};

/** The site's breakpoints, which the native hosts follow as the window resizes: a tablet and a desktop width. */
export const { css } = createCss({ screens: { medium: "(min-width: 700px)", large: "(min-width: 1024px)" } });

export const c = {
  primary: "#ff3f00",
  primaryInk: "#c42800",
  primarySoft: "rgba(255,63,0,0.08)",
  primaryMark: "rgba(255,63,0,0.19)",
  primaryBorder: "rgba(255,63,0,0.30)",
  bg: "#ffffff",
  card: "#fafafb",
  secondary: "#f7f7f8",
  light: "#eceef1",
  code: "#f4f5f7",
  text: "#0b0d12",
  dim: "#5e6673",
  muted: "#6b727d",
  border: "rgba(16,18,24,0.10)",
  borderLight: "rgba(16,18,24,0.16)",
};

/** The syntax colours of the docs' code blocks, by token class. */
const tokens: Record<string, string> = {
  kw: "#2563eb",
  st: "#15803d",
  fn: "#c2410c",
  cm: "#4b5563",
  nm: "#be123c",
  ty: "#b45309",
  pt: "#4b5563",
  pr: "#7e22ce",
};

type Text = string | (() => string);
type Style = Record<string, string | number>;

export const txt = (text: Text, style: Style = {}) => span(text, { style: { color: c.text, fontSize: 15, ...style } });

/** Body copy: the docs' dim paragraph. */
export const para = (text: Text, style: Style = {}) => txt(text, { color: c.dim, ...style });

/** "01 · Label": a mono-feeling number in the accent ink, then a muted label. */
export const kicker = (num: string, label = "") =>
  div(
    { style: { flexDirection: "row", gap: 10, alignItems: "center" } },
    txt(num, { color: c.primaryInk, fontSize: 13, fontWeight: "bold" }),
    label ? txt(label, { color: c.muted, fontSize: 13 }) : null,
  );

/** The home page's section heading: label, title, sub. */
export const heading = (label: string, title: string, sub = "") =>
  div(
    { style: { gap: 10, marginBottom: 20 } },
    txt(label, { color: c.primaryInk, fontSize: 14, fontWeight: "bold" }),
    txt(title, { fontSize: 30, fontWeight: "bold" }),
    sub ? para(sub, { fontSize: 16 }) : null,
  );

export const card = (style: Style, ...children: NodeModLike<"div">[]) =>
  div({ style: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 20, gap: 10, ...style } }, ...children);

/** A rounded pill button: filled in the accent, or the secondary grey. */
export const pill = (label: Text, onClick: () => void, filled = false) =>
  div(
    {
      style: { backgroundColor: filled ? c.primary : c.secondary, borderRadius: 9999, paddingLeft: 22, paddingRight: 22, height: 44, justifyContent: "center", alignItems: "center" },
      onClick,
    },
    txt(label, { color: filled ? "#ffffff" : c.text, fontSize: 14, fontWeight: "bold" }),
  );

/** A row of cards that wraps into columns as the screen narrows. */
export const grid = (min: number, ...children: NodeModLike<"div">[]) =>
  div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 12 } }, ...children.map((child) => div({ style: { flexGrow: 1, flexBasis: min, minWidth: min } }, child)));

const frame = css({ width: "100%", maxWidth: 1180, padding: 16, paddingBottom: 48, gap: 16, medium: { padding: 28, gap: 22 } });

/** The page frame: centred, no wider than the site's frame, with roomier gutters from a tablet width. */
export const page = (...children: NodeModLike<"div">[]) =>
  div({ style: { alignItems: "center", backgroundColor: c.bg } }, div(frame, ...children));

/** Columns from a tablet or desktop width (`at`), stacked below it. */
export const columns = (at: "medium" | "large", gap = 16) => {
  const cols = { flexDirection: "row", alignItems: "flex-start" } as const;
  return css(at === "medium" ? { gap, medium: cols } : { gap, large: cols });
};


const codeLine = (line: Line) =>
  div(
    { style: { flexDirection: "row", flexWrap: "wrap" } },
    ...(line.length ? line : [["", "\u00a0"]]).map(([cls, value]) =>
      span(value, { style: { color: tokens[cls] ?? c.text, fontSize: 13 } }),
    ),
  );

/** The docs' code frame: a filename bar over highlighted lines. */
export const codeBlock = (file: string, lines: Line[]) =>
  div(
    { style: { backgroundColor: c.code, borderWidth: 1, borderColor: c.border, borderRadius: 10, overflow: "hidden" } },
    file
      ? div(
          { style: { flexDirection: "row", justifyContent: "space-between", paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderColor: c.border } },
          txt(file, { color: c.muted, fontSize: 12 }),
          file === "terminal" ? txt("$", { color: c.muted, fontSize: 12 }) : null,
        )
      : null,
    div({ style: { padding: 16, gap: 2 } }, ...lines.map(codeLine)),
  );

const bullet = (mark: string, text: string) =>
  div(
    { style: { flexDirection: "row", gap: 10 } },
    txt(mark, { color: c.muted, width: 16 }),
    para(text, { flex: 1 }),
  );

const table = (head: string[], rows: string[][]) =>
  div(
    { style: { borderTopWidth: 1, borderColor: c.border } },
    ...[head, ...rows].map((cells, r) =>
      div(
        { style: { flexDirection: "row", gap: 14, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderColor: c.border } },
        ...cells.map((cell, i) =>
          txt(cell, { flex: i === cells.length - 1 && i > 1 ? 2 : 1, fontSize: 14, color: r === 0 || i === 0 ? c.text : c.dim, fontWeight: r === 0 ? "bold" : "normal" }),
        ),
      ),
    ),
  );

/** One block of the docs text. */
export function block(b: Block) {
  switch (b.t) {
    case "p":
      return para(b.text);
    case "h3":
      return txt(b.text, { fontSize: 17, fontWeight: "bold", marginTop: 16 });
    case "callout":
      return div(
        { style: { backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 16 } },
        para(b.text),
      );
    case "ul":
      return div({ style: { gap: 6 } }, ...b.items.map((item) => bullet("•", item)));
    case "ol":
      return div({ style: { gap: 6 } }, ...b.items.map((item, i) => bullet(`${i + 1}.`, item)));
    case "code":
      return codeBlock(b.file, b.lines);
    case "table":
      return table(b.head, b.rows);
  }
}

// ── The live demos' building blocks (the site's api-demos.ts styles) ──

export const stack = (...children: NodeModLike<"div">[]) => div({ style: { gap: 10, alignItems: "flex-start" } }, ...children);

export const row = (...children: NodeModLike<"div">[]) =>
  div({ style: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 } }, ...children);

/** The demos' outlined button; `pressed` gives it the accent border and ink, `disabled` dims it and ignores taps. */
export const btn = (label: Text, onClick: () => void, pressed: () => boolean = () => false, disabled: () => boolean = () => false) =>
  div(
    {
      style: () => ({
        height: 36,
        paddingLeft: 14,
        paddingRight: 14,
        justifyContent: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: pressed() ? c.primary : c.borderLight,
        backgroundColor: c.bg,
        opacity: disabled() ? 0.45 : 1,
      }),
      onClick: () => disabled() || onClick(),
    },
    span(label, { style: () => ({ fontSize: 14, fontWeight: "bold", color: pressed() ? c.primaryInk : c.text }) }),
  );

/** The demos' text field style. */
export const field = { height: 36, width: "100%", maxWidth: 320, paddingLeft: 12, paddingRight: 12, borderRadius: 8, borderWidth: 1, borderColor: c.borderLight, backgroundColor: c.bg, color: c.text, fontSize: 15 };

export const panel = { flexGrow: 1, flexBasis: 140, padding: 12, borderRadius: 8, backgroundColor: c.secondary };

export const muted = (text: Text, style: Style = {}) => txt(text, { color: c.muted, ...style });

/** Runs `fn` after `ms`, where the engine has timers (the bare native engines do not: it runs at once there). */
export const later = (fn: () => void, ms: number) => (typeof setTimeout === "function" ? setTimeout(fn, ms) : fn());
