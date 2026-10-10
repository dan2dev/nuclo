// Shared chrome: page layout, the titled feature panel, demo cards, code
// blocks and the badge/button primitives every section reuses.
import { css, cx, globalStyle, keyframes } from "./theme.ts";

globalStyle("*", { boxSizing: "border-box" });
globalStyle("body", {
  m: 0,
  font: "body",
  bg: "bg",
  color: "text",
  lineHeight: 1.5,
  raw: { "-webkit-font-smoothing": "antialiased" },
});
globalStyle("h1, h2, h3", { m: 0, lineHeight: 1.2 });
globalStyle("code", { font: "mono" });
// Smooth in-page jumps so the #hash scroll demo is visible rather than instant.
globalStyle("html", { raw: { "scroll-behavior": "smooth" } });

export const spin = keyframes({ from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } });
export const fadeIn = keyframes({
  from: { opacity: 0, transform: "translateY(6px)" },
  to: { opacity: 1, transform: "none" },
});

export const s = {
  shell: css({ maxW: 1100, mx: "auto", px: 20, py: 28 }),

  title: css({ text: 30, weight: 800, letterSpacing: "-0.02em" }),
  lead: css({ text: 16, color: "textDim", mt: 6, mb: 20, maxW: 760 }),

  panel: css({
    bg: "surface",
    border: "1px solid",
    borderColor: "border",
    rounded: "lg",
    p: 22,
    my: 18,
    shadow: "card",
  }),
  panelTitle: css({ text: 19, weight: 700, mb: 4 }),
  panelDesc: css({ text: 14, color: "textDim", mb: 16, maxW: 820 }),

  grid: css({ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }),
  cols2: css({ display: "grid", gap: 12, md: { gridTemplateColumns: "1fr 1fr" } }),

  cardBox: css({
    bg: "surfaceMuted",
    border: "1px solid",
    borderColor: "border",
    rounded: "md",
    p: 13,
    col: true,
    gap: 9,
  }),
  caption: css({ text: 12, color: "textMuted", font: "mono" }),

  code: css({
    font: "mono",
    text: 12,
    color: "textDim",
    bg: "bg",
    border: "1px solid",
    borderColor: "border",
    rounded: "md",
    p: 12,
    m: 0,
    overflow: "auto",
    raw: { "white-space": "pre" },
  }),

  row: css({ row: true, items: "center", gap: 8, flexWrap: "wrap" }),
  note: css({ text: 13, color: "textMuted", mt: 10 }),
  page: css({ animation: `${fadeIn} 0.25s ease backwards` }),
};

const badge = {
  base: css({ font: "mono", text: 11, px: 8, py: 3, rounded: "pill", border: "1px solid", display: "inline-block" }),
  neutral: css({ bg: "surfaceMuted", borderColor: "border", color: "textDim" }),
  good: css({ bg: "rgba(16,185,129,0.12)", borderColor: "success", color: "success" }),
  warn: css({ bg: "rgba(245,158,11,0.12)", borderColor: "warning", color: "warning" }),
  bad: css({ bg: "rgba(239,68,68,0.12)", borderColor: "danger", color: "danger" }),
  info: css({ bg: "rgba(99,102,241,0.14)", borderColor: "primary", color: "#c7cbff" }),
};

export type BadgeTone = "neutral" | "good" | "warn" | "bad" | "info";

/** A small pill. Used everywhere to label what a demo proves. */
export function pill(tone: BadgeTone, label: string) {
  return span(cx(badge.base, badge[tone]), label);
}

const btnBase = css({
  font: "body",
  text: 13,
  weight: 600,
  px: 12,
  py: 7,
  rounded: "md",
  border: "1px solid",
  borderColor: "border",
  bg: "surfaceMuted",
  color: "text",
  cursor: "pointer",
  hover: { borderColor: "primary", color: "#fff" },
  raw: { transition: "border-color .15s, background .15s, color .15s" },
});
const btnPrimary = css({ bg: "primary", borderColor: "primary", color: "#fff", hover: { bg: "primaryHover" } });
const btnDanger = css({ bg: "rgba(239,68,68,0.14)", borderColor: "danger", color: "#ffd9d9" });

export const btn = {
  base: btnBase,
  primary: cx(btnBase, btnPrimary),
  danger: cx(btnBase, btnDanger),
};

/**
 * A titled panel: heading + description + body. One per feature group.
 *
 * The body is typed for the *host* tag (`section`), not `div`: a built
 * element from any builder carries nuclo's any-parent marker and so is
 * assignable, while `NodeModLike<"div">` would also admit div-only attribute
 * objects that `section()` cannot take.
 */
export function feature(title: string, description: string, ...body: NodeModLike<"section">[]) {
  return section(s.panel, h2(s.panelTitle, title), p(s.panelDesc, description), ...body);
}

/** A demo tile: monospace caption above its demo children. */
export function card(caption: string, ...children: NodeModLike<"div">[]) {
  return div(s.cardBox, span(s.caption, caption), ...children);
}

/** A fenced code sample. */
export function code(text: string) {
  return pre(s.code, text);
}

/** The loading indicator used while a route's chunk is in flight. */
export function spinner(label = "loading chunk…") {
  return div(
    css({ row: true, items: "center", gap: 10, py: 30, justify: "center" }),
    div(
      css({
        size: 22,
        border: "2px solid",
        borderColor: "border",
        borderTopColor: "primary",
        rounded: "pill",
        animation: `${spin} 0.6s linear infinite`,
      }),
    ),
    span(css({ text: 13, color: "textMuted" }), label),
  );
}

/**
 * Shown when the very first `router.start()` fails. Deliberately built from
 * nothing but the theme: whatever broke, this must still render.
 */
export function bootFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return div(
    s.shell,
    div(
      cx(s.cardBox, css({ borderColor: "danger", gap: 12 })),
      span(css({ text: 17, weight: 700, color: "danger" }), "The first route failed to load"),
      span(
        css({ text: 14, color: "textDim" }),
        "router.start() rejected, so there is no Route to hang an error on yet — " +
          "an app has to handle this one itself. Every later navigation surfaces " +
          "its failure on router.error instead.",
      ),
      pre(s.code, message),
      a({ href: "/" }, css({ color: "accent", text: 13 }), "\u2190 back to the overview"),
    ),
  );
}

/**
 * Modal chrome for a stacked layer.
 *
 * The cascade offset is driven by `depth`, so an open stack reads as a pile of
 * windows rather than one dialog — which is the point of the feature: the
 * layers below are still mounted, still interactive, and never rebuilt.
 */
const modalStyles = {
  shade: css({
    position: "fixed",
    inset: 0,
    bg: "rgba(5,8,18,0.55)",
    raw: { "backdrop-filter": "blur(2px)" },
  }),
  frame: css({
    position: "fixed",
    top: "50%",
    left: "50%",
    w: "min(560px, calc(100vw - 32px))",
    maxH: "calc(100vh - 80px)",
    overflow: "auto",
    bg: "surface",
    border: "1px solid",
    borderColor: "primary",
    rounded: "lg",
    shadow: "card",
    p: 20,
    animation: `${fadeIn} 0.18s ease backwards`,
  }),
  head: css({ row: true, items: "center", justify: "space-between", gap: 12, mb: 12 }),
  title: css({ text: 17, weight: 700 }),
};

export function modal(
  layer: { depth: number; close(result?: unknown): void },
  title: string,
  /** Where to go when this route was opened cold, with nothing underneath. */
  backHref: string,
  ...body: NodeModLike<"div">[]
) {
  // depth 0 means nothing pushed this: the URL was opened directly, so there
  // is no layer to close and no caller to resolve. The dismiss controls have
  // to be ordinary navigation instead — a pushed route still has to work as a
  // page of its own.
  const standalone = layer.depth === 0;
  const offset = standalone ? 0 : (layer.depth - 1) * 26;

  const dismiss = standalone
    ? a({ href: backHref, "aria-label": "Close" }, btn.base, "\u2715")
    : button(btn.base, { onClick: () => layer.close(), "aria-label": "Close" }, "\u2715");

  // A layer is one more row of the outlet, so it shows over the page beneath.
  return div(
    // The shade belongs to this layer, so each one dims what is under it.
    standalone
      ? a({ href: backHref, tabindex: -1, "aria-hidden": "true" }, modalStyles.shade)
      : div(modalStyles.shade, { onClick: () => layer.close() }),
    div(
      modalStyles.frame,
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
        style: { transform: `translate(calc(-50% + ${offset}px), calc(-50% + ${offset}px))` },
      },
      div(
        modalStyles.head,
        div(
          css({ col: true, gap: 2 }),
          span(modalStyles.title, title),
          span(
            s.caption,
            standalone
              ? "opened directly — nothing underneath to resolve to"
              : `layer ${layer.depth} · the page underneath is still mounted`,
          ),
        ),
        dismiss,
      ),
      ...body,
    ),
  );
}

export const field = {
  label: css({ text: 12, weight: 600, color: "textDim", mb: 5, display: "block" }),
  input: css({
    font: "body",
    text: 14,
    w: "100%",
    px: 11,
    py: 8,
    rounded: "md",
    border: "1px solid",
    borderColor: "border",
    bg: "bg",
    color: "text",
    focus: { borderColor: "primary", outline: "none" },
  }),
  row: css({ mb: 14 }),
};

/**
 * Renders a page either inline or as a stacked modal, depending on how it was
 * reached.
 *
 * Navigated to as a child route it is a panel inside its parent's outlet;
 * opened with `push()` it is a layer floating over the page beneath. Same
 * content, same module, two presentations — which is the point of having both
 * nested routes and a layer stack.
 */
export function panelOrModal(
  layer: { depth: number; close(result?: unknown): void },
  title: string,
  backHref: string,
  ...body: NodeModLike<"div">[]
) {
  if (layer.depth > 0) return modal(layer, title, backHref, ...body);
  return div(
    cx(s.cardBox, css({ borderColor: "accent", gap: 12 })),
    div(
      css({ row: true, items: "center", justify: "space-between", gap: 12 }),
      div(
        css({ col: true, gap: 2 }),
        span(css({ text: 15, weight: 700 }), title),
        span(s.caption, "rendered inline, in the parent's outlet() — the parent is still mounted"),
      ),
      a({ href: backHref }, btn.base, "close"),
    ),
    ...body,
  );
}
