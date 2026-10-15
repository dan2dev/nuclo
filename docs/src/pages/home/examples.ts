import { css, colors, cx } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";
import { highlightCode, terminalCodeTokenStyle } from "../../components/CodeBlock.ts";
import { GRADIENT } from "../../components/brand-geometry.ts";
import { hs } from "./styles.ts";

// The hero's examples. Each one is a small app on Nuclo's own API: plain state, dynamic
// values, one update(). A build() returns the preview's nodes, the code pane, and what the
// example wants on its root (its scope, its lifecycle). The card in hero-card.ts frames them.

type Child = NodeModLike<any>; // anything div() accepts: nodes, modifiers, attributes
export type HeroExample = {
  api: string; // the feature on show, as written in code
  title: string;
  build: () => { preview: Child[]; code: Child; root?: Child[] };
};

const MONO = "ui-monospace, monospace";
export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const reduced = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } } as const;
const focus = { outline: `2px solid ${colors.primary}`, outlineOffset: "3px" } as const;

// Shared by every example: the preview pane, its toolbar, its status line, its buttons
export const ex = {
  pane: css("pages-home-examples-pane", { display: "flex", flexDirection: "column", gap: "14px", minHeight: "236px", padding: "18px 18px 14px", backgroundColor: colors.bgCard, medium: { minHeight: "272px", padding: "22px 24px 16px" } }),
  canvas: css("pages-home-examples-canvas", { display: "block", width: "100%", height: "auto", userSelect: "none", raw: { "touch-action": "none", "-webkit-user-select": "none" } }),
  bar: css("pages-home-examples-bar", { display: "flex", alignItems: "center", gap: "8px 12px", flexWrap: "wrap", marginTop: "auto" }),
  status: css("pages-home-examples-status", { marginLeft: "auto", fontFamily: MONO, fontSize: "0.75rem", color: colors.textMuted, fontVariantNumeric: "tabular-nums", "& b": { fontWeight: "600", color: colors.text } }),
  btn: css("pages-home-examples-btn", { display: "inline-flex", alignItems: "center", gap: "8px", height: "38px", padding: "0 14px", borderRadius: "10px", fontFamily: MONO, fontSize: "0.8125rem", fontWeight: "600", color: "#fff", backgroundColor: colors.primaryDark, transition: `transform 0.2s ${EASE}, filter 0.2s ${EASE}`, hover: { filter: "brightness(0.94)" }, active: { transform: "scale(0.96)" }, focusVisible: focus }),
  btnLive: css("pages-home-examples-btnLive", { animation: `${animations.ringPulse} 1.3s ${EASE} infinite`, ...reduced }),
  ghost: css("pages-home-examples-ghost", { height: "38px", padding: "0 12px", borderRadius: "10px", fontFamily: MONO, fontSize: "0.8125rem", fontWeight: "500", color: colors.textDim, border: `1px solid ${colors.borderLight}`, transition: `color 0.2s ${EASE}, background-color 0.2s ${EASE}, transform 0.2s ${EASE}`, hover: { color: colors.text, backgroundColor: colors.bgSecondary }, active: { transform: "scale(0.96)" }, focusVisible: focus }),
  // Anything inserted with this class rises in; the carousel also uses it for a fresh branch
  rise: css("pages-home-examples-rise", { animation: `${animations.riseIn} 0.5s ${EASE} both`, ...reduced }),
  pop: css("pages-home-examples-pop", { animation: `${animations.popIn} 0.45s ${EASE} both`, ...reduced }),
  code: css("pages-home-examples-code", { padding: "16px 20px", minHeight: "0", height: "calc(8 * 1.7em + 32px)", overflow: "auto", medium: { height: "calc(11 * 1.7em + 32px)" } }),
  codePre: css("pages-home-examples-codePre", { margin: "0", whiteSpace: "pre", minWidth: "max-content" }),
};

/** A static, highlighted code pane. */
export function StaticCode(code: string) {
  return div(hs.demoCodePane, ex.code, terminalCodeTokenStyle, { "data-demo-pane": "code", innerHTML: `<pre class="${ex.codePre.className}">${highlightCode(code)}</pre>` });
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// Pointer position in an SVG's viewBox units (uniform scale: the box keeps its aspect)
function svgPoint(e: PointerEvent, w: number): [number, number] {
  const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
  const k = w / box.width;
  return [(e.clientX - box.left) * k, (e.clientY - box.top) * k];
}

// ── Spring: every attribute can be a function; a frame loop calls update() ───────────────
const sp = {
  tether: css("pages-home-examples-tether", { raw: { stroke: "var(--c-border-light)", "stroke-width": "1.5", "stroke-dasharray": "4 4", fill: "none" } }),
  anchor: css("pages-home-examples-anchor", { raw: { fill: "none", stroke: "var(--c-border-light)", "stroke-width": "1.5" } }),
  ghost: css("pages-home-examples-ghostOrb", { raw: { fill: "var(--c-primary)" } }),
  orb: css("pages-home-examples-orb", { cursor: "grab", filter: "drop-shadow(0 8px 14px rgba(234, 63, 37, 0.35))", active: { cursor: "grabbing" } }),
  hint: css("pages-home-examples-hint", { fontFamily: MONO, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", raw: { fill: "var(--c-text-muted)" } }),
};

export const Spring: HeroExample = {
  api: "dynamic attributes",
  title: "Drag the orb, let go",
  build() {
    const W = 480, H = 190, REST = { x: W / 2, y: H / 2 - 6 };
    const orb = { x: REST.x, y: REST.y, vx: 0, vy: 0 };
    const trail = Array.from({ length: 5 }, () => ({ x: REST.x, y: REST.y }));
    const S = "hero-spring";
    let held = false, raf = 0, frames = 0;

    function tick() {
      frames++;
      if (!held) {
        orb.vx = (orb.vx + (REST.x - orb.x) * 0.085) * 0.86;
        orb.vy = (orb.vy + (REST.y - orb.y) * 0.085) * 0.86;
        orb.x += orb.vx;
        orb.y += orb.vy;
      }
      let px = orb.x, py = orb.y;
      for (const t of trail) { t.x += (px - t.x) * 0.42; t.y += (py - t.y) * 0.42; px = t.x; py = t.y; }
      update(S);
      const last = trail[trail.length - 1];
      const still = !held && Math.hypot(orb.vx, orb.vy) < 0.04 && Math.hypot(orb.x - REST.x, orb.y - REST.y) < 0.3 && Math.hypot(last.x - orb.x, last.y - orb.y) < 0.3;
      raf = still ? 0 : requestAnimationFrame(tick);
    }
    const run = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const canvas = svgSvg(
      ex.canvas,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "An orb on a spring: drag it and let go", "data-grab": "",
        onPointerDown: (e: PointerEvent) => {
          const [x, y] = svgPoint(e, W);
          if (Math.hypot(x - orb.x, y - orb.y) > 34) return;
          held = true;
          (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
          run();
        },
        onPointerMove: (e: PointerEvent) => {
          if (!held) return;
          const [x, y] = svgPoint(e, W);
          const nx = clamp(x, 20, W - 20), ny = clamp(y, 20, H - 20);
          orb.vx = (nx - orb.x) * 0.5; orb.vy = (ny - orb.y) * 0.5; // the fling it gets on release
          orb.x = nx; orb.y = ny;
        },
        onPointerUp: () => { held = false; run(); },
        onPointerCancel: () => { held = false; run(); },
        onDestroy: () => { cancelAnimationFrame(raf); raf = 0; },
      },
      defsSvg(radialGradientSvg({ id: "hero-orb", cx: "35%", cy: "30%", r: "75%" }, stopSvg({ offset: "0", "stop-color": GRADIENT.to }), stopSvg({ offset: "1", "stop-color": GRADIENT.from }))),
      textSvg(sp.hint, { x: 14, y: 16 }, "drag me"),
      circleSvg(sp.anchor, { cx: REST.x, cy: REST.y, r: 6 }),
      lineSvg(sp.tether, { x1: REST.x, y1: REST.y, x2: () => orb.x, y2: () => orb.y }),
      ...trail.map((t, i) => circleSvg(sp.ghost, { cx: () => t.x, cy: () => t.y, r: 14 - i * 2.2, opacity: 0.22 - i * 0.035 })),
      circleSvg(sp.orb, { cx: () => orb.x, cy: () => orb.y, r: 20, fill: "url(#hero-orb)" }),
    );

    return {
      preview: [canvas, div(ex.bar, div(ex.status, b(() => String(frames)), " frames · ", b("update('spring')"), " per frame"))],
      code: StaticCode(`let orb = { x: 240, y: 90, vx: 0, vy: 0 }   // plain object

const Orb = () => svgSvg(               // functions, not bindings
  lineSvg({ x1: 240, y1: 90, x2: () => orb.x, y2: () => orb.y }),
  circleSvg({ cx: () => orb.x, cy: () => orb.y, r: 20 }),
)

function tick() {
  orb.vx = (orb.vx + (240 - orb.x) * 0.085) * 0.86
  orb.x += orb.vx                       // mutate the numbers
  update('spring')                      // patch only what moved
  requestAnimationFrame(tick)
}`),
      root: [scope(S)],
    };
  },
};

// ── Shuffle: list() keeps a node per object; reordering moves nodes, it never rebuilds them ──
const sh = {
  tiles: css("pages-home-examples-tiles", { display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "112px", alignContent: "center" }),
  tile: css("pages-home-examples-tile", { display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "12px", fontFamily: MONO, fontSize: "1.0625rem", fontWeight: "700", color: colors.text, backgroundColor: colors.bgLight, boxShadow: `inset 0 0 0 1px ${colors.border}`, willChange: "transform", medium: { width: "52px", height: "52px" } }),
  tileHot: css("pages-home-examples-tileHot", { color: "#fff", backgroundColor: colors.primary, boxShadow: "none" }),
};

export const Shuffle: HeroExample = {
  api: "list()",
  title: "Same object, same node",
  build() {
    const S = "hero-shuffle";
    type Item = { n: number };
    let items: Item[] = [1, 2, 3, 4, 5, 6].map((n) => ({ n }));
    let next = 7, created = 0;
    const nodes = new Map<Item, HTMLElement>();

    // FLIP: measure, mutate, update(), then slide each surviving node from where it was
    function act(fn: () => void) {
      const before = new Map(items.map((it) => [it, nodes.get(it)?.getBoundingClientRect()]));
      fn();
      update(S);
      for (const [it, el] of nodes) {
        const was = before.get(it);
        if (!was) continue;
        const now = el.getBoundingClientRect();
        const dx = was.left - now.left, dy = was.top - now.top;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 480, easing: EASE });
      }
      update(S); // a new tile's onMount counted itself after the first pass; show the count
    }
    const shuffle = () => act(() => items.sort(() => Math.random() - 0.5));
    const sort = () => act(() => items.sort((a, b) => a.n - b.n));
    const reverse = () => act(() => items.reverse());
    const add = () => act(() => items.splice(Math.floor(Math.random() * (items.length + 1)), 0, { n: next++ }));
    const remove = () => act(() => { if (items.length) items.splice(Math.floor(Math.random() * items.length), 1); });

    const tiles = div(
      sh.tiles,
      { role: "list" },
      list(() => items, (it) =>
        div(
          sh.tile, ex.pop,
          { role: "listitem", class: () => cx(sh.tile, ex.pop, it.n % 3 === 0 ? sh.tileHot : null).className, onMount: (el: HTMLElement) => { nodes.set(it, el); created++; return () => nodes.delete(it); } },
          String(it.n),
        ),
      ),
    );

    return {
      preview: [
        tiles,
        div(
          ex.bar,
          button(ex.btn, { type: "button", onClick: shuffle }, "shuffle"),
          button(ex.ghost, { type: "button", onClick: sort }, "sort"),
          button(ex.ghost, { type: "button", onClick: reverse }, "reverse"),
          button(ex.ghost, { type: "button", "aria-label": "add an item", onClick: add }, "+"),
          button(ex.ghost, { type: "button", "aria-label": "remove an item", onClick: remove }, "−"),
          div(ex.status, b(() => String(items.length)), " items · ", b(() => String(created)), " nodes ever created"),
        ),
      ],
      code: StaticCode(`let items = [1, 2, 3, 4, 5, 6].map(n => ({ n }))   // plain array

const Tiles = () => div(
  list(() => items, item => div(item.n)),   // one node per object
)

items.sort(() => Math.random() - 0.5)   // reorder the array
update()                                // the nodes move. none is rebuilt

items.splice(2, 0, { n: 7 })            // a new object
update()                                // one new node, the rest untouched`),
      root: [scope(S)],
    };
  },
};

// ── Branches: when() shows one branch, and keeps its DOM while the branch holds ───────────
const br = {
  stage: css("pages-home-examples-brStage", { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "132px" }),
  card: css("pages-home-examples-userCard", { display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderRadius: "14px", backgroundColor: colors.bgSecondary, boxShadow: `inset 0 0 0 1px ${colors.border}` }),
  avatar: css("pages-home-examples-avatar", { display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "50%", fontWeight: "700", color: "#fff", backgroundImage: `linear-gradient(160deg, ${GRADIENT.from}, ${GRADIENT.to})` }),
  name: css("pages-home-examples-userName", { fontWeight: "600", fontSize: "0.9375rem" }),
  role: css("pages-home-examples-userRole", { fontSize: "0.8125rem", color: colors.textDim }),
  spinner: css("pages-home-examples-spinner", { animation: `${animations.spin} 0.9s linear infinite`, raw: { fill: "none", stroke: "var(--c-primary)", "stroke-width": "3", "stroke-linecap": "round", "stroke-dasharray": "40 80" } }),
  loading: css("pages-home-examples-loading", { display: "flex", alignItems: "center", gap: "12px", fontFamily: MONO, fontSize: "0.8125rem", color: colors.textDim }),
  error: css("pages-home-examples-error", { display: "flex", alignItems: "center", gap: "14px", padding: "12px 12px 12px 16px", borderRadius: "14px", fontSize: "0.875rem", color: colors.text, backgroundColor: colors.primaryAlpha08, boxShadow: `inset 0 0 0 1px ${colors.borderPrimary}` }),
  idle: css("pages-home-examples-idle", { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", fontSize: "0.875rem", color: colors.textDim }),
};

export const Branches: HeroExample = {
  api: "when()",
  title: "One branch at a time",
  build() {
    const S = "hero-when";
    const USERS = [["Ada Lovelace", "wrote the first program"], ["Grace Hopper", "found the first bug"], ["Linus Torvalds", "ships on a sunday"], ["Margaret Hamilton", "landed on the moon"]];
    let status: "idle" | "loading" | "ok" | "error" = "idle";
    let user = USERS[0];
    let switches = 0, timer = 0;

    function load() {
      status = "loading"; switches++; update(S);
      timer = window.setTimeout(() => {
        if (Math.random() < 0.7) { user = USERS[Math.floor(Math.random() * USERS.length)]; status = "ok"; }
        else status = "error";
        switches++; update(S);
      }, 900);
    }
    const reset = () => { status = "idle"; switches++; update(S); };

    const stage = div(
      br.stage,
      { onDestroy: () => clearTimeout(timer) },
      when(() => status === "loading",
        div(br.loading, ex.rise, svgSvg({ width: 22, height: 22, viewBox: "0 0 24 24" }, circleSvg(br.spinner, { cx: 12, cy: 12, r: 9 })), "fetching…"),
      ).when(() => status === "ok",
        div(br.card, ex.pop, div(br.avatar, () => user[0][0]), div(div(br.name, () => user[0]), div(br.role, () => user[1]))),
      ).when(() => status === "error",
        div(br.error, ex.rise, span("The request failed."), button(ex.btn, { type: "button", onClick: load }, "retry")),
      ).else(
        div(br.idle, ex.rise, span("Nothing loaded yet."), button(ex.btn, { type: "button", onClick: load }, "fetch user")),
      ),
    );

    return {
      preview: [
        stage,
        div(
          ex.bar,
          button(ex.ghost, { type: "button", onClick: load }, "fetch again"),
          button(ex.ghost, { type: "button", onClick: reset }, "reset"),
          div(ex.status, "status = ", b(() => `'${status}'`), " · ", b(() => String(switches)), " branch switches"),
        ),
      ],
      code: StaticCode(`let status = 'idle'      // 'loading' | 'ok' | 'error'
let user

async function load() {
  status = 'loading'; update()
  try { user = await fetchUser(); status = 'ok' }
  catch { status = 'error' }
  update()                           // the matching branch is shown
}

when(() => status === 'loading', Spinner())
  .when(() => status === 'ok', UserCard(() => user))
  .when(() => status === 'error', Retry(load))
  .else(button('fetch user', { onClick: load }))`),
      root: [scope(S)],
    };
  },
};

// ── Letters: a text input, and a word built from one node per letter ──────────────────────
const le = {
  input: css("pages-home-examples-input", { width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bgSecondary, color: colors.text, fontFamily: "system-ui, sans-serif", fontSize: "0.9375rem", outline: "none", transition: `border-color 0.2s ${EASE}, box-shadow 0.2s ${EASE}`, focus: { borderColor: colors.primary, boxShadow: `0 0 0 3px ${colors.primaryAlpha13}` } }),
  word: css("pages-home-examples-word", { display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "center", minHeight: "96px", padding: "8px 0", fontSize: "2.4rem", fontWeight: "700", letterSpacing: "-0.03em", lineHeight: "1", color: colors.text, medium: { fontSize: "3rem" } }),
  letter: css("pages-home-examples-letter", { display: "inline-block", whiteSpace: "pre" }),
  vowel: css("pages-home-examples-vowel", { color: colors.primary }),
  empty: css("pages-home-examples-empty", { fontSize: "1rem", fontWeight: "500", color: colors.textMuted, letterSpacing: "0" }),
};

export const Letters: HeroExample = {
  api: "state-dependent values",
  title: "Type, the DOM follows",
  build() {
    const S = "hero-letters";
    type Letter = { c: string };
    let name = "";
    let letters: Letter[] = []; // one object per letter, kept across edits
    const isVowel = (c: string) => "aeiouAEIOU".includes(c);

    function type(value: string) {
      letters = [...value].map((c, i) => (letters[i]?.c === c ? letters[i] : { c }));
      name = value;
      update(S);
    }

    return {
      preview: [
        input(le.input, { type: "text", placeholder: "Type your name…", "aria-label": "Your name", autocomplete: "off", "data-grab": "", onInput: (e: Event) => type((e.target as HTMLInputElement).value) }),
        div(
          le.word,
          when(() => letters.length > 0,
            list(() => letters, (l) => span(le.letter, ex.pop, { class: () => cx(le.letter, ex.pop, isVowel(l.c) ? le.vowel : null).className }, l.c === " " ? " " : l.c)),
          ).else(span(le.empty, ex.rise, "every letter you type becomes a node")),
        ),
        div(ex.bar, div(ex.status, b(() => String(name.length)), " letters · ", b(() => String([...name].filter(isVowel).length)), " vowels · ", b(() => String(name.trim().split(/\s+/).filter(Boolean).length)), " words")),
      ],
      code: StaticCode(`let name = ''
let letters = []        // one object per letter, kept across edits

function type(value) {
  letters = [...value].map((c, i) => letters[i]?.c === c ? letters[i] : { c })
  name = value
  update()              // new letters pop in. the old ones stay put
}

div(
  input({ placeholder: 'Type your name…', onInput: e => type(e.target.value) }),
  h2(list(() => letters, l => span(l.c))),
  p(() => \`\${name.length} letters\`),   // any value can be a function
)`),
      root: [scope(S)],
    };
  },
};

// ── Clock: onMount starts a loop and hands back its cleanup; unmounting runs it ───────────
const ck = {
  stage: css("pages-home-examples-ckStage", { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px" }),
  face: css("pages-home-examples-face", { raw: { fill: "var(--c-bg-secondary)", stroke: "var(--c-border-light)", "stroke-width": "2", "stroke-dasharray": "1", "stroke-dashoffset": "0" }, animation: `${animations.strokeDraw} 0.9s ${EASE} both`, ...reduced }),
  tick: css("pages-home-examples-ckTick", { raw: { stroke: "var(--c-text-muted)", "stroke-width": "2", "stroke-linecap": "round" } }),
  hand: css("pages-home-examples-hand", { raw: { stroke: "var(--c-text)", "stroke-width": "4", "stroke-linecap": "round" } }),
  second: css("pages-home-examples-second", { raw: { stroke: "var(--c-primary)", "stroke-width": "2", "stroke-linecap": "round" } }),
  pin: css("pages-home-examples-pin", { raw: { fill: "var(--c-primary)" } }),
  gone: css("pages-home-examples-gone", { fontSize: "0.875rem", color: colors.textDim, textAlign: "center" }),
};

export const Clock: HeroExample = {
  api: "onMount / onDestroy",
  title: "Mount, tick, clean up",
  build() {
    const S = "hero-clock";
    let mounted = true;
    let now = Date.now();
    let frames = 0, loops = 0, cleanups = 0;
    const R = 62, C = 70;
    const hand = (len: number, turns: () => number) =>
      lineSvg({ x1: C, y1: C, x2: () => C + len * Math.sin(turns() * 2 * Math.PI), y2: () => C - len * Math.cos(turns() * 2 * Math.PI) });
    const t = () => { const d = new Date(now); return { s: (d.getSeconds() + d.getMilliseconds() / 1000) / 60, m: (d.getMinutes() + d.getSeconds() / 60) / 60, h: ((d.getHours() % 12) + d.getMinutes() / 60) / 12 }; };

    const ClockFace = () => svgSvg(
      ex.canvas,
      {
        viewBox: "0 0 140 140", width: 140, height: 140, role: "img", "aria-label": "An analog clock",
        onMount: () => {
          loops++;
          let raf = requestAnimationFrame(function tick() { now = Date.now(); frames++; update(S); raf = requestAnimationFrame(tick); });
          return () => { cancelAnimationFrame(raf); loops--; cleanups++; }; // the cleanup, run on destroy
        },
      },
      circleSvg(ck.face, { cx: C, cy: C, r: R, pathLength: 1 }),
      ...Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 2 * Math.PI, r0 = i % 3 ? R - 8 : R - 12; return lineSvg(ck.tick, { x1: C + r0 * Math.sin(a), y1: C - r0 * Math.cos(a), x2: C + (R - 4) * Math.sin(a), y2: C - (R - 4) * Math.cos(a) }); }),
      gSvg(ck.hand, hand(30, () => t().h), hand(44, () => t().m)),
      gSvg(ck.second, hand(50, () => t().s)),
      circleSvg(ck.pin, { cx: C, cy: C, r: 3.5 }),
    );

    return {
      preview: [
        div(ck.stage, when(() => mounted, div(ex.pop, ClockFace())).else(div(ck.gone, ex.rise, "Unmounted. The loop is gone, and nothing leaks."))),
        div(
          ex.bar,
          button(ex.btn, { type: "button", onClick: () => { mounted = !mounted; update(S); } }, () => (mounted ? "unmount" : "mount")),
          div(ex.status, b(() => String(frames)), " frames · ", b(() => String(loops)), " loop running · ", b(() => String(cleanups)), " cleanups ran"),
        ),
      ],
      code: StaticCode(`let mounted = true
let now = Date.now()

const Clock = () => svgSvg(
  { onMount() {                                   // once it is in the document
      let raf = requestAnimationFrame(function tick() {
        now = Date.now(); update('clock'); raf = requestAnimationFrame(tick)
      })
      return () => cancelAnimationFrame(raf)      // and this, once it is removed
  } },
  lineSvg({ x2: () => 70 + 50 * Math.sin(seconds(now)) }),   // the hand
)

when(() => mounted, Clock()).else(p('Unmounted.'))`),
      root: [scope(S)],
    };
  },
};
