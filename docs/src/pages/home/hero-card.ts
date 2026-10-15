import { css, colors, cx } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";
import { hs } from "./styles.ts";
import { ex, EASE, type HeroExample } from "./examples.ts";
import { Spring, Shuffle, Branches, Letters, Clock } from "./examples.ts";
import { Paint } from "./playground.ts";

// The hero's card: six examples, one at a time. Arrows, dots, the keyboard's arrow keys and a
// swipe move between them. Each example is a when() branch: it is built from its closures when
// it comes on, so its state survives a round trip, and its onMount cleanup runs when it goes.

export const EXAMPLES: HeroExample[] = [Paint, Spring, Shuffle, Branches, Letters, Clock];
const N = EXAMPLES.length;
const HERO = "hero-card";
const pad = (n: number) => String(n).padStart(2, "0");
const reduced = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } } as const;

const cs = {
  head: css("pages-home-herocard-head", { display: "flex", alignItems: "center", gap: "8px", padding: "10px 10px 10px 12px", backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}`, medium: { gap: "12px", padding: "12px 12px 12px 14px" } }),
  arrow: css("pages-home-herocard-arrow", { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "38px", height: "38px", borderRadius: "10px", color: colors.textDim, transition: `color 0.2s ${EASE}, background-color 0.2s ${EASE}, transform 0.2s ${EASE}`, hover: { color: colors.text, backgroundColor: colors.bgSecondary }, active: { transform: "scale(0.9)" }, focusVisible: { outline: `2px solid ${colors.primary}`, outlineOffset: "2px" } }),
  // Kicker over title; the pair fades up on every switch
  titles: css("pages-home-herocard-titles", { display: "flex", flexDirection: "column", minWidth: "0", flex: "1 1 auto", gap: "1px" }),
  kicker: css("pages-home-herocard-kicker", { fontFamily: "ui-monospace, monospace", fontSize: "0.6875rem", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: colors.primaryInk, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
  title: css("pages-home-herocard-title", { fontSize: "0.9375rem", fontWeight: "600", color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }),
  dots: css("pages-home-herocard-dots", { display: "none", alignItems: "center", gap: "6px", padding: "0 4px", medium: { display: "flex" } }),
  dot: css("pages-home-herocard-dot", { width: "7px", height: "7px", padding: "0", borderRadius: "999px", backgroundColor: colors.borderLight, transition: `width 0.35s ${EASE}, background-color 0.25s ${EASE}`, hover: { backgroundColor: colors.textMuted }, focusVisible: { outline: `2px solid ${colors.primary}`, outlineOffset: "3px" } }),
  dotOn: css("pages-home-herocard-dotOn", { width: "22px", backgroundColor: colors.primary, hover: { backgroundColor: colors.primary } }),
  // The stage sets --dir; a branch coming on slides in from that side
  stage: css("pages-home-herocard-stage", { position: "relative", overflow: "hidden" }),
  fromRight: css("pages-home-herocard-fromRight", { raw: { "--dir": "1" } }),
  fromLeft: css("pages-home-herocard-fromLeft", { raw: { "--dir": "-1" } }),
  enter: css("pages-home-herocard-enter", { animation: `${animations.slideIn} 0.5s ${EASE} both`, ...reduced }),
};

function Chevron(dir: -1 | 1) {
  return svgSvg(
    { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d: dir > 0 ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6" }),
  );
}

export function HeroCard() {
  let active = 0;
  let dir: -1 | 1 = 1;
  let titlesEl: HTMLElement | undefined;
  let swipe: { x: number; y: number } | null = null;
  const built = EXAMPLES.map((e) => e.build());

  function go(to: number, d: -1 | 1 = to > active ? 1 : -1) {
    if (to === active) return;
    dir = d;
    active = (to + N) % N;
    update(HERO);
    if (titlesEl && document.documentElement.hasAttribute("data-anim")) {
      titlesEl.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 350, easing: EASE });
    }
  }
  const step = (d: -1 | 1) => go((active + d + N) % N, d);

  function Pane(i: number) {
    const { preview, code, root = [] } = built[i];
    return div(cs.enter, ...root, div(ex.pane, { "data-demo-pane": "preview" }, ...preview), code);
  }
  let branches = when(() => active === 0, Pane(0));
  for (let i = 1; i < N; i++) branches = branches.when(() => active === i, Pane(i));

  return div(
    hs.heroDemoArea,
    scope(HERO),
    {
      "data-hero-demo": "",
      // Arrow keys anywhere in the card, unless someone is typing
      onKeyDown: (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      },
      // A swipe across the card, outside the examples' own canvases and controls
      onPointerDown: (e: PointerEvent) => { swipe = (e.target as Element).closest("[data-grab], button, input") ? null : { x: e.clientX, y: e.clientY }; },
      onPointerUp: (e: PointerEvent) => {
        if (!swipe) return;
        const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
        swipe = null;
        if (Math.abs(dx) > 48 && Math.abs(dy) < 40) step(dx < 0 ? 1 : -1);
      },
    },
    div(
      cs.head,
      button(cs.arrow, { type: "button", "aria-label": "Previous example", onClick: () => step(-1) }, Chevron(-1)),
      div(
        cs.titles,
        { "aria-live": "polite", onMount: (el: HTMLElement) => { titlesEl = el; } },
        div(cs.kicker, () => `${pad(active + 1)} / ${pad(N)} · ${EXAMPLES[active].api}`),
        div(cs.title, () => EXAMPLES[active].title),
      ),
      div(
        cs.dots,
        ...EXAMPLES.map((e, i) => button(cs.dot, { type: "button", "aria-label": `Example ${i + 1}: ${e.title}`, class: () => cx(cs.dot, i === active ? cs.dotOn : null).className, onClick: () => go(i) })),
      ),
      button(cs.arrow, { type: "button", "aria-label": "Next example", onClick: () => step(1) }, Chevron(1)),
    ),
    div(cs.stage, { class: () => cx(cs.stage, dir > 0 ? cs.fromRight : cs.fromLeft).className }, branches),
  );
}
