import { css, colors, cx } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";
import { hs } from "./styles.ts";
import { ex, EASE, type HeroExample } from "./examples.ts";
import { Draw, Fireworks, Waves, Sort, Chase, Reflex, Warp, Life } from "./examples.ts";
import { Paint } from "./playground.ts";

// The hero's card: nine live examples, one at a time. Arrows, dots, the arrow keys and a swipe
// move between them; on its own the card moves on every few seconds until someone touches it.
// Each example is a when() branch: built from its closures when it comes on (its state survives
// a round trip), torn down when it goes (its onMount cleanup runs). "Code" opens the example in
// a <dialog> beside its source: the card's branch goes and the dialog's comes on, so one
// instance runs at a time and its state carries over both ways.

export const EXAMPLES: HeroExample[] = [Paint, Draw, Fireworks, Waves, Sort, Chase, Reflex, Warp, Life];
const N = EXAMPLES.length;
const HERO = "hero-card";
const AUTO_MS = 9000; // per example, while the card plays on its own
const MONO = "ui-monospace, monospace";
const pad = (n: number) => String(n).padStart(2, "0");
const reduced = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } } as const;
const focus = { outline: `2px solid ${colors.primary}`, outlineOffset: "2px" } as const;
const WIDE = "@media (min-width: 901px)";

const cs = {
  // Hovering or focusing the card holds the autoplay's progress where it is
  card: css("pages-home-herocard-card", { "&:hover [data-dot] > span, &:focus-within [data-dot] > span": { raw: { "animation-play-state": "paused" } } }),
  head: css("pages-home-herocard-head", { display: "flex", alignItems: "center", gap: "6px", padding: "10px 10px 10px 16px", backgroundColor: colors.bgCard, borderBottom: `1px solid ${colors.border}`, medium: { gap: "10px", padding: "12px 12px 12px 18px" } }),
  titles: css("pages-home-herocard-titles", { display: "flex", flexDirection: "column", minWidth: "0", flex: "1 1 auto", gap: "1px" }),
  kicker: css("pages-home-herocard-kicker", { fontFamily: MONO, fontSize: "0.6875rem", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: colors.primaryInk, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
  title: css("pages-home-herocard-title", { fontSize: "0.9375rem", fontWeight: "600", color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }),
  // Hidden on phones, and so is the autoplay: it is driven by the active dot's fill
  dots: css("pages-home-herocard-dots", { display: "none", alignItems: "center", gap: "5px", padding: "0 4px", medium: { display: "flex" } }),
  dot: css("pages-home-herocard-dot", { position: "relative", overflow: "hidden", width: "7px", height: "7px", padding: "0", borderRadius: "999px", backgroundColor: colors.borderLight, transition: `width 0.35s ${EASE}, background-color 0.25s ${EASE}`, hover: { backgroundColor: colors.textMuted }, focusVisible: { outline: `2px solid ${colors.primary}`, outlineOffset: "3px" }, "& > span": { display: "none" } }),
  dotOn: css("pages-home-herocard-dotOn", { width: "26px", backgroundColor: colors.primary, hover: { backgroundColor: colors.primary } }),
  // The fill is the timer: when it reaches the end, the card moves on
  dotAuto: css("pages-home-herocard-dotAuto", { backgroundColor: colors.primaryAlpha19, hover: { backgroundColor: colors.primaryAlpha19 }, "& > span": { display: "block", position: "absolute", inset: "0", backgroundColor: colors.primary, transformOrigin: "left", animation: `${animations.draw} ${AUTO_MS}ms linear both`, ...reduced } }),
  codeBtn: css("pages-home-herocard-codeBtn", { display: "inline-flex", alignItems: "center", flexShrink: 0, gap: "6px", height: "34px", padding: "0 12px 0 10px", borderRadius: "999px", fontFamily: MONO, fontSize: "0.75rem", fontWeight: "700", color: colors.primaryInk, backgroundColor: colors.primaryAlpha13, boxShadow: `inset 0 0 0 1px ${colors.borderPrimary}`, transition: `color 0.2s ${EASE}, background-color 0.2s ${EASE}, transform 0.2s ${EASE}`, hover: { color: colors.text, backgroundColor: colors.primaryAlpha19 }, active: { transform: "scale(0.95)" }, focusVisible: focus }),
  arrows: css("pages-home-herocard-arrows", { display: "flex", flexShrink: 0 }),
  arrow: css("pages-home-herocard-arrow", { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, width: "34px", height: "34px", borderRadius: "10px", color: colors.textDim, transition: `color 0.2s ${EASE}, background-color 0.2s ${EASE}, transform 0.2s ${EASE}`, hover: { color: colors.text, backgroundColor: colors.bgSecondary }, active: { transform: "scale(0.9)" }, focusVisible: focus }),
  // The card sets --dir; a branch coming on slides in from that side, in the card and the dialog
  stage: css("pages-home-herocard-stage", { position: "relative", overflow: "hidden" }),
  fromRight: css("pages-home-herocard-fromRight", { raw: { "--dir": "1" } }),
  fromLeft: css("pages-home-herocard-fromLeft", { raw: { "--dir": "-1" } }),
  enter: css("pages-home-herocard-enter", { animation: `${animations.slideIn} 0.5s ${EASE} both`, ...reduced }),
};

// The code view
const ms = {
  dialog: css("pages-home-herocard-dialog", {
    width: "min(1120px, calc(100% - 24px))", maxWidth: "none", maxHeight: "calc(100dvh - 24px)", margin: "auto", padding: "0", overflow: "hidden",
    border: `1px solid ${colors.borderLight}`, borderRadius: "18px", backgroundColor: colors.bgCard, color: colors.text, boxShadow: "0 40px 120px -24px rgba(0, 0, 0, 0.7)",
    "&[open]": { display: "flex", flexDirection: "column", animation: `${animations.modalIn} 0.35s ${EASE} both`, ...reduced },
    "&::backdrop": { backgroundColor: "rgba(8, 8, 8, 0.66)", raw: { "backdrop-filter": "blur(6px)", "-webkit-backdrop-filter": "blur(6px)" } },
    "& [data-demo-pane='preview']": { height: "340px", medium: { height: "420px" } },
  }),
  head: css("pages-home-herocard-dialogHead", { display: "flex", alignItems: "center", flexShrink: 0, gap: "8px", padding: "12px 12px 12px 20px", borderBottom: `1px solid ${colors.border}` }),
  body: css("pages-home-herocard-dialogBody", { flex: "1 1 auto", minHeight: "0", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", overflowY: "auto", raw: { "overscroll-behavior": "contain" }, [WIDE]: { gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.08fr)", overflowY: "hidden" } }),
  live: css("pages-home-herocard-dialogLive", { display: "flex", flexDirection: "column", minWidth: "0", [WIDE]: { borderRight: `1px solid ${colors.border}` } }),
  note: css("pages-home-herocard-dialogNote", { margin: "0", padding: "16px 20px 20px", fontSize: "0.875rem", lineHeight: "1.65", color: colors.textDim, borderTop: `1px solid ${colors.border}` }),
  // Wide, the source scrolls inside its column and the example sets the height
  code: css("pages-home-herocard-dialogCode", { position: "relative", minWidth: "0", borderTop: `1px solid ${colors.border}`, "& > [data-demo-pane='code']": { minHeight: "0", raw: { "overscroll-behavior": "contain" } }, [WIDE]: { borderTop: "none", "& > [data-demo-pane='code']": { position: "absolute", inset: "0" } } }),
};

function Icon(d: string, size = 18) {
  return svgSvg(
    { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d }),
  );
}

export function HeroCard() {
  let active = 0;
  let dir: -1 | 1 = 1;
  let auto = true; // plays on its own until the first touch
  let open = false; // the code view
  let dialogEl: HTMLDialogElement | undefined;
  let swipe: { x: number; y: number } | null = null;
  const titleEls = new Set<HTMLElement>();
  const built = EXAMPLES.map((e) => e.build());

  function go(to: number, d: -1 | 1 = to > active ? 1 : -1) {
    if (to === active) return;
    dir = d;
    active = (to + N) % N;
    update(HERO);
    if (document.documentElement.hasAttribute("data-anim")) {
      for (const el of titleEls) el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 350, easing: EASE });
    }
  }
  const step = (d: -1 | 1) => go((active + d + N) % N, d);
  const stop = () => { if (auto) { auto = false; update(HERO); } };
  function openCode() {
    stop();
    open = true;
    update(HERO);
    dialogEl?.showModal();
  }

  const Titles = (id?: string) =>
    div(
      cs.titles,
      { "aria-live": () => (auto ? "off" : "polite"), onMount: (el: HTMLElement) => { titleEls.add(el); return () => titleEls.delete(el); } },
      div(cs.kicker, () => `${pad(active + 1)}/${pad(N)} · ${EXAMPLES[active].api}`),
      div(cs.title, id ? { id } : null, () => EXAMPLES[active].title),
    );
  const Arrows = () =>
    div(
      cs.arrows,
      button(cs.arrow, { type: "button", "aria-label": "Previous example", onClick: () => step(-1) }, Icon("M15 6l-6 6 6 6")),
      button(cs.arrow, { type: "button", "aria-label": "Next example", onClick: () => step(1) }, Icon("M9 6l6 6-6 6")),
    );

  function Preview(i: number) {
    const { preview, root = [] } = built[i];
    return div(cs.enter, ...root, div(ex.pane, { "data-demo-pane": "preview" }, ...preview));
  }
  function Detail(i: number) {
    const { preview, code, root = [] } = built[i];
    return div(
      ms.body, cs.enter, ...root,
      div(ms.live, div(ex.pane, { "data-demo-pane": "preview" }, ...preview), p(ms.note, EXAMPLES[i].note)),
      div(ms.code, code),
    );
  }
  let inCard = when(() => !open && active === 0, Preview(0));
  let inDialog = when(() => open && active === 0, Detail(0));
  for (let i = 1; i < N; i++) {
    inCard = inCard.when(() => !open && active === i, Preview(i));
    inDialog = inDialog.when(() => open && active === i, Detail(i));
  }

  return div(
    hs.heroDemoArea, cs.card,
    scope(HERO),
    {
      "data-hero-demo": "",
      "data-theme": "dark", // the card stays dark on the orange, like the install bar
      class: () => cx(hs.heroDemoArea, cs.card, dir > 0 ? cs.fromRight : cs.fromLeft).className,
      // Arrow keys anywhere in the card or its dialog, unless someone is typing or sliding
      onKeyDown: (e: KeyboardEvent) => {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        if (e.key === "ArrowRight") { e.preventDefault(); stop(); step(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); stop(); step(-1); }
      },
      // Any touch ends the autoplay. A swipe across the card moves it, outside the examples' own
      // canvases and controls, and outside the dialog
      onPointerDown: (e: PointerEvent) => {
        stop();
        swipe = (e.target as Element).closest("[data-grab], button, input, dialog") ? null : { x: e.clientX, y: e.clientY };
      },
      onPointerUp: (e: PointerEvent) => {
        if (!swipe) return;
        const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
        swipe = null;
        if (Math.abs(dx) > 48 && Math.abs(dy) < 40) step(dx < 0 ? 1 : -1);
      },
    },
    div(
      cs.head,
      Titles(),
      div(
        cs.dots,
        ...EXAMPLES.map((e, i) =>
          button(
            cs.dot,
            {
              type: "button", "data-dot": "",
              "aria-label": `Example ${i + 1}: ${e.title}`,
              "aria-current": () => (i === active ? "true" : "false"),
              class: () => cx(cs.dot, i === active ? cs.dotOn : null, auto && i === active ? cs.dotAuto : null).className,
              onClick: () => go(i),
              onAnimationEnd: () => { if (auto) step(1); },
            },
            span(),
          ),
        ),
      ),
      button(cs.codeBtn, { type: "button", "aria-haspopup": "dialog", onClick: openCode }, Icon("M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14", 16), "Code"),
      Arrows(),
    ),
    // While the example is in the dialog, an empty pane keeps the card's height
    div(cs.stage, inCard.else(div(ex.pane))),
    dialog(
      ms.dialog,
      {
        "aria-labelledby": "hero-code-title",
        onMount: (el: HTMLDialogElement) => { dialogEl = el; },
        onClose: () => { open = false; update(HERO); },
        onClick: (e: MouseEvent) => { if (e.target === dialogEl) dialogEl.close(); }, // the backdrop
      },
      div(
        ms.head,
        Titles("hero-code-title"),
        Arrows(),
        button(cs.arrow, { type: "button", "aria-label": "Close code view", onClick: () => dialogEl?.close() }, Icon("M6 6l12 12M18 6L6 18")),
      ),
      inDialog,
    ),
  );
}
