// The web runtime for @nuclo/native-ts apps: the API of src/index.ts on the DOM.
//
// The web needs no compiler: `nuclo-native-ts build --target web` bundles the app with this module
// in place of src/index.ts. The model is the native runtimes': builders create elements once,
// `update()` re-runs the dynamic values (each dirty-checked before the DOM is touched) and
// reconciles list(), when() and region() in place.
//
// Layout is the browser's flexbox, set up to give the boxes the native `Flex` algorithm gives:
// every element is a border-box flex column that does not shrink, `flex: n` is `n 1 0%`.

import { expandStyle } from "../../styleAliases.ts";
import type * as API from "../../index.ts";

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

const FACTORY = Symbol("factory");
const MODIFIER = Symbol("modifier");
const CLASS = Symbol("class");

/** What a builder returns: the element is made when it is put in a parent, so a when() branch builds on open. */
interface Factory {
  [FACTORY]: () => Node;
}
interface Modifier {
  [MODIFIER]: (node: Node) => void;
}
interface StyleClass {
  [CLASS]: API.Style;
}
type Child = API.Child;
type Kind = "box" | "text" | "button" | "input" | "checkbox" | "textarea" | "image" | "native" | "fragment";

const modifier = (apply: (node: Node) => void): Modifier => ({ [MODIFIER]: apply });
const asApi = <T>(value: unknown) => value as T;

// ---------------------------------------------------------------------------
// Style → CSS
// ---------------------------------------------------------------------------

const px = (n: number) => `${n}px`;
const EASING: Record<string, string> = {
  linear: "linear",
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  // One overshoot, then settled: the response of a platform spring (damping ≈ 0.7).
  spring: "linear(0, 0.36 8%, 0.82 18%, 1.06 28%, 1.1 36%, 1.05 48%, 1 60%, 0.99 75%, 1)",
};
const TRANSITIONED = "opacity, transform, background-color, border-radius, width, height";

const CSS_PROPS: Record<string, (v: never, s: API.Style) => string> = {
  flexDirection: (v: string) => `flex-direction:${v}`,
  alignItems: (v: string) => `align-items:${v}`,
  alignSelf: (v: string) => `align-self:${v}`,
  justifyContent: (v: string) => `justify-content:${v}`,
  flexWrap: (v: string) => `flex-wrap:${v}`,
  flex: (v: number) => (v > 0 ? `flex:${v} 1 0%` : "flex:0 0 auto"),
  gap: (v: number) => `gap:${px(v)}`,
  margin: (v: number) => `margin:${px(v)}`,
  marginTop: (v: number) => `margin-top:${px(v)}`,
  marginRight: (v: number) => `margin-right:${px(v)}`,
  marginBottom: (v: number) => `margin-bottom:${px(v)}`,
  marginLeft: (v: number) => `margin-left:${px(v)}`,
  padding: (v: number) => `padding:${px(v)}`,
  paddingTop: (v: number) => `padding-top:${px(v)}`,
  paddingRight: (v: number) => `padding-right:${px(v)}`,
  paddingBottom: (v: number) => `padding-bottom:${px(v)}`,
  paddingLeft: (v: number) => `padding-left:${px(v)}`,
  // A box is at most as wide as its container, unless it says how wide it is.
  width: (v: number | string, s) => {
    const w = typeof v === "string" ? v : px(v);
    return s.maxWidth == null ? `width:${w};max-width:none` : `width:${w}`;
  },
  height: (v: number) => `height:${px(v)}`,
  minWidth: (v: number) => `min-width:${px(v)}`,
  maxWidth: (v: number) => `max-width:${px(v)}`,
  minHeight: (v: number) => `min-height:${px(v)}`,
  maxHeight: (v: number) => `max-height:${px(v)}`,
  aspectRatio: (v: number) => `aspect-ratio:${v}`,
  overflow: (v: string, s) =>
    v === "scroll"
      ? `${s.flexDirection === "row" ? "overflow-x:auto;overflow-y:hidden" : "overflow-y:auto;overflow-x:hidden"};scrollbar-width:none`
      : `overflow:${v}`,
  position: (v: string) => `position:${v}`,
  top: (v: number) => `top:${px(v)}`,
  right: (v: number) => `right:${px(v)}`,
  bottom: (v: number) => `bottom:${px(v)}`,
  left: (v: number) => `left:${px(v)}`,
  zIndex: (v: number) => `z-index:${v}`,
  display: (v: string) => (v === "none" ? "display:none" : ""),
  backgroundColor: (v: string) => `background-color:${v}`,
  color: (v: string) => `color:${v}`,
  opacity: (v: number) => `opacity:${v}`,
  borderRadius: (v: number) => `border-radius:${px(v)}`,
  borderWidth: (v: number) => `border-width:${px(v)}`,
  borderColor: (v: string) => `border-color:${v}`,
  fontSize: (v: number) => `font-size:${px(v)}`,
  fontWeight: (v: string) => `font-weight:${v}`,
  fontStyle: (v: string) => `font-style:${v}`,
  fontFamily: (v: string) => `font-family:${v === "sans-serif" ? "system-ui,sans-serif" : v === "monospace" ? "ui-monospace,monospace" : v}`,
  lineHeight: (v: number) => `line-height:${px(v)}`,
  letterSpacing: (v: number) => `letter-spacing:${px(v)}`,
  textAlign: (v: string) => `text-align:${v}`,
  textDecoration: (v: string) => `text-decoration:${v}`,
  numberOfLines: (v: number) =>
    v === 1
      ? "white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
      : `display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:${v};overflow:hidden`,
};

function toCss(style: API.Style): string {
  const s = expandStyle(style);
  const out: string[] = [];
  for (const key in s) {
    const value = (s as Record<string, unknown>)[key];
    const rule = value == null ? undefined : CSS_PROPS[key];
    if (rule) out.push(rule(value as never, s));
  }
  // A box is at most as wide as the space its margins leave (negative margins widen it), as natively.
  const sideMargins = (s.marginLeft ?? s.margin ?? 0) + (s.marginRight ?? s.margin ?? 0);
  if (sideMargins !== 0 && s.width == null && s.maxWidth == null) out.push(`max-width:calc(100% - ${px(sideMargins)})`);
  if (s.translateX != null || s.translateY != null || s.rotate != null || s.scale != null) {
    out.push(`transform:translate(${px(s.translateX ?? 0)},${px(s.translateY ?? 0)}) rotate(${s.rotate ?? 0}deg) scale(${s.scale ?? 1})`);
  }
  if (s.shadowRadius != null || s.shadowColor != null) {
    out.push(`box-shadow:${px(s.shadowOffsetX ?? 0)} ${px(s.shadowOffsetY ?? 0)} ${px(s.shadowRadius ?? 0)} ${s.shadowColor ?? "#00000040"}`);
  }
  if (s.transitionDuration != null) {
    out.push(`transition:${s.transitionDuration}ms ${EASING[s.transitionEasing ?? "ease"]} ${s.transitionDelay ?? 0}ms;transition-property:${TRANSITIONED}`);
  }
  return out.join(";");
}

/** `o`'s values win; a `padding` or `margin` shorthand resets the sides set before it, as in CSS. */
function merge(a0: API.Style, o0: API.Style): API.Style {
  const a = expandStyle(a0);
  const o = expandStyle(o0);
  const out: Record<string, unknown> = { ...a };
  for (const side of ["padding", "margin"]) {
    if ((o as Record<string, unknown>)[side] != null) for (const edge of ["Top", "Right", "Bottom", "Left"]) delete out[side + edge];
  }
  for (const key in o) {
    const value = (o as Record<string, unknown>)[key];
    if (value == null) continue;
    out[key] = key === "pressed" || key === "hover" || key === "focused" ? merge((out[key] as API.Style) ?? {}, value as API.Style) : value;
  }
  return out as API.Style;
}

const BASE_CSS = `
:root,:root>body{margin:0;height:100%;overflow:hidden;overscroll-behavior:none}
body{font:15px system-ui,sans-serif;color:#000;background:#fff;-webkit-text-size-adjust:100%}
.n{box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;flex:0 0 auto;position:relative;margin:0;padding:0;
border:0 solid #000;min-width:0;min-height:0;max-width:100%;list-style:none;background:none;font:inherit;color:inherit;text-align:inherit;
letter-spacing:inherit;outline:none;text-decoration:none;-webkit-tap-highlight-color:transparent}
.n.text{display:block;white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%}
.n.button{flex-direction:row;align-items:center;justify-content:center;text-align:center;cursor:pointer;padding:8px 14px;color:#2563eb;
appearance:none;user-select:none;-webkit-user-select:none;max-width:100%}
.n.button:disabled,.n.input:disabled{opacity:.4;cursor:default}
.n.input{padding:8px;appearance:none;border-radius:0;max-width:100%}
.n.textarea{padding:8px;resize:none;min-height:3em}
.n.checkbox{width:20px;height:20px;margin:0;accent-color:#4f46e5}
.n.image{height:120px;object-fit:cover;max-width:100%}
h1.n{font-size:32px;font-weight:bold}h2.n{font-size:22px;font-weight:bold}h3.n{font-size:19px;font-weight:bold}
h4.n{font-size:17px;font-weight:bold}h5.n{font-size:15px;font-weight:bold}h6.n{font-size:13px;font-weight:bold}
strong.n,b.n,th.n,dt.n{font-weight:bold}small.n,sub.n,sup.n{font-size:12px}em.n,i.n,cite.n,dfn.n,var.n{font-style:italic}
u.n,ins.n{text-decoration:underline}s.n,del.n{text-decoration:line-through}mark.n{background-color:#fef08a}
code.n,pre.n,kbd.n,samp.n{font-family:ui-monospace,monospace}a.n{color:#2563eb;cursor:pointer}
n-progress.n,n-meter.n{flex-direction:row;width:160px;height:16px;overflow:hidden;background-color:#e5e7eb;border-radius:8px}n-meter.n{width:80px}
select.n{padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font:inherit;color:inherit;appearance:auto;cursor:pointer}option.n,optgroup.n{display:block;padding:0}
tr.n{flex-direction:row}td.n,th.n{flex:1 1 0%}hr.n{height:1px;background-color:#cbd5e1}head.n,base.n,link.n,meta.n,script.n,style.n,title.n,template.n,noscript.n,datalist.n,area.n,source.n,track.n,wbr.n{display:none}
#nuclo{position:fixed;inset:0;display:flex;flex-direction:column;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.nuclo-main{flex:1;min-height:0;display:flex;flex-direction:column;position:relative}
.nuclo-screen{position:absolute;inset:0;overflow-y:auto;background:#fff;display:flex;flex-direction:column}
.nuclo-screen>.n{flex:1 0 auto}
.nuclo-layer{position:absolute;inset:0;pointer-events:none}
.nuclo-layer>.n{width:100%;height:100%}
.nuclo-layer .touch{pointer-events:auto}
.nuclo-bar{height:56px;flex:none;display:flex;align-items:center;background:#fff;box-shadow:0 1px 3px #0003;z-index:2;font-size:20px;font-weight:bold}
.nuclo-back{width:56px;height:56px;font:24px system-ui;background:none;border:0;cursor:pointer}
.nuclo-tabs{height:64px;flex:none;display:flex;background:#f8fafc;box-shadow:0 -1px 4px #0002;z-index:2}
.nuclo-tabs button{flex:1;border:0;background:none;font:12px system-ui;color:#64748b;white-space:pre-line;cursor:pointer}
.nuclo-tabs button.active{color:#4f46e5}
.nuclo-stack{flex:1;min-height:0;position:relative;overflow:hidden}
.nuclo-sheet{position:absolute;inset:0;z-index:3;background:#fff;display:flex;flex-direction:column}
`;

// ---------------------------------------------------------------------------
// Node
// ---------------------------------------------------------------------------

let generation = 0;
/** Set by forceUpdate(): bindings apply their value whether or not it changed. */
let forcing = false;

class Node {
  readonly el: HTMLElement | null;
  parent: Node | null = null;
  children: Node[] = [];
  readonly scopes = new Set<string>();
  readonly bindings: (() => void)[] = [];
  reconcile: (() => void) | null = null;
  readonly teardown: (() => void)[] = [];
  readonly mountCallbacks: ((el: HTMLElement) => void | (() => void))[] = [];
  readonly destroyCallbacks: ((el: HTMLElement) => void)[] = [];
  private mounted = false;
  destroyed = false;

  private readonly textParts: (() => string)[] = [];
  private textNode: Text | null = null;

  readonly classes: API.Style[] = [];
  dynamicClass: (() => StyleClass) | null = null;
  inline: API.Style = {};
  dynamicInline: (() => API.Style) | null = null;
  private painted: string | null = null;
  private pressed = false;
  private hovered = false;
  private focused = false;
  private watchingStates = false;
  private readonly born = generation;
  /** This box's direction and cross-axis alignment, which decide a child control's natural width. */
  private row = false;
  private align = "stretch";

  readonly kind: Kind;

  constructor(kind: Kind, tag: string, el?: HTMLElement) {
    this.kind = kind;
    this.el = kind === "fragment" ? null : (el ?? document.createElement(tag));
    if (this.el) {
      this.el.classList.add("n", kind);
      if (kind !== "box" && kind !== "text") this.el.classList.add("touch");
    }
  }

  append(child: Node) {
    child.parent = this;
    this.children.push(child);
  }

  add(children: readonly Child[]) {
    for (const child of children) this.addChild(child);
  }

  private addChild(child: Child) {
    if (child == null || child === false) return;
    if (typeof child === "string" || typeof child === "number") return this.addText(() => String(child));
    if (typeof child === "function") return this.addText(() => String((child as () => API.Primitive)()));
    const c = child as unknown as Partial<Factory & Modifier & StyleClass>;
    if (c[FACTORY]) this.append(c[FACTORY]());
    else if (c[MODIFIER]) c[MODIFIER](this);
    else if (c[CLASS]) this.classes.push(c[CLASS]);
    else applyAttributes(this, child as API.Attributes);
  }

  /** The nearest node with an element: where this node's elements are inserted. */
  private get host(): Node | null {
    let n = this.parent;
    while (n && !n.el) n = n.parent;
    return n;
  }

  flatElements(out: HTMLElement[]) {
    if (this.el) out.push(this.el);
    else for (const child of this.children) child.flatElements(out);
  }

  /** Makes the DOM children the nodes' elements in order, moving only what is out of place. */
  syncViews() {
    if (this.kind !== "box") return void this.host?.syncViews();
    const wanted: HTMLElement[] = [];
    for (const child of this.children) child.flatElements(wanted);
    const el = this.el!;
    const keep = new Set(wanted);
    for (const old of [...el.children]) if (!keep.has(old as HTMLElement)) old.remove();
    wanted.forEach((child, i) => {
      if (el.children[i] !== child) el.insertBefore(child, el.children[i] ?? null);
    });
    for (const child of this.children) child.mountDeep();
  }

  bind<T>(get: () => T, set: (value: T) => void) {
    let first = true;
    let last: T;
    const run = () => {
      const value = get();
      if (first || forcing || value !== last) {
        first = false;
        last = value;
        set(value);
      }
    };
    run();
    this.bindings.push(run);
  }

  addText(part: () => string) {
    if (this.kind === "text" || this.kind === "button") {
      if (!this.textParts.length) {
        this.textNode = document.createTextNode("");
        this.el!.append(this.textNode);
        this.bindings.push(() => this.renderText());
      }
      this.textParts.push(part);
      this.renderText();
    } else if (this.kind === "box") {
      const span = new Node("text", "span");
      span.addText(part);
      this.append(span);
    }
  }

  private renderText() {
    let text = "";
    for (const part of this.textParts) text += part();
    if (text !== this.textNode!.data) this.textNode!.data = text;
  }

  refresh() {
    if (this.destroyed || this.born === generation) return;
    this.reconcile?.();
    for (const binding of [...this.bindings]) binding();
    this.applyStyle();
    for (const child of [...this.children]) child.refresh();
  }

  applyStylesDeep() {
    this.applyStyle();
    for (const child of this.children) child.applyStylesDeep();
  }

  applyStyle() {
    const el = this.el;
    if (!el) return;
    let s: API.Style = {};
    for (const c of this.classes) s = merge(s, c);
    if (this.dynamicClass) s = merge(s, this.dynamicClass()[CLASS]);
    s = merge(s, this.inline);
    if (this.dynamicInline) s = merge(s, this.dynamicInline());
    if (s.pressed || s.hover || s.focused) this.watchStates();
    if (this.hovered && s.hover) s = merge(s, s.hover);
    if (this.focused && s.focused) s = merge(s, s.focused);
    if (this.pressed && s.pressed) s = merge(s, s.pressed);
    this.row = s.flexDirection === "row";
    this.align = s.alignItems ?? "stretch";
    let css = toCss(s);
    // A field or an image has a natural width (180, 120) unless its column stretches it, as the native Flex does.
    if ((this.kind === "input" || this.kind === "image") && s.width == null && !s.flex) {
      const host = this.host;
      if (!host || host.row || (s.alignSelf ?? host.align) !== "stretch") css += `;width:${this.kind === "input" ? 180 : 120}px`;
    }
    if (css === this.painted) return;
    this.painted = css;
    el.style.cssText = css;
    // An absolute box is an overlay: it takes the pointer over what is under it; so does a scroller.
    if (this.kind === "box") el.classList.toggle("touch", s.position === "absolute" || s.overflow === "scroll" || el.dataset.touch === "1");
  }

  private watchStates() {
    if (this.watchingStates) return;
    this.watchingStates = true;
    const el = this.el!;
    this.interactive();
    const set = (key: "pressed" | "hovered" | "focused", value: boolean) => () => {
      this[key] = value;
      this.applyStyle();
    };
    el.addEventListener("pointerdown", set("pressed", true));
    for (const type of ["pointerup", "pointercancel", "pointerleave"]) el.addEventListener(type, set("pressed", false));
    el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && set("hovered", true)());
    el.addEventListener("pointerleave", set("hovered", false));
    el.addEventListener("focus", set("focused", true));
    el.addEventListener("blur", set("focused", false));
  }

  /** The element receives the pointer, in an overlay layer too. */
  interactive() {
    const el = this.el!;
    el.dataset.touch = "1";
    el.classList.add("touch");
  }

  mountDeep() {
    if (this.el && !this.el.isConnected) return;
    if (!this.mounted && this.el && !this.destroyed) {
      this.mounted = true;
      for (const callback of this.mountCallbacks) {
        const cleanup = callback(this.el);
        if (cleanup) this.teardown.push(cleanup);
      }
    }
    for (const child of this.children) child.mountDeep();
  }

  /** Runs onDestroy and cleanups, children first; the elements are removed by whoever removed the node. */
  destroy() {
    if (this.destroyed) return;
    for (const child of this.children) child.destroy();
    this.destroyed = true;
    for (const t of this.teardown) t();
    if (this.el) for (const callback of this.destroyCallbacks) callback(this.el);
    this.bindings.length = 0;
    this.reconcile = null;
  }
}

// ---------------------------------------------------------------------------
// Attributes and events
// ---------------------------------------------------------------------------

const dynamic = <T>(value: API.Dynamic<T>): (() => T) => (typeof value === "function" ? (value as () => T) : () => value);

function applyAttributes(node: Node, attrs: API.Attributes) {
  const el = node.el;
  if (!el) return;
  const field = el as HTMLInputElement;
  for (const key in attrs) {
    const value = (attrs as Record<string, unknown>)[key];
    if (value == null) continue;
    switch (key) {
      case "style":
        if (typeof value === "function") node.dynamicInline = value as () => API.Style;
        else node.inline = merge(node.inline, value as API.Style);
        break;
      case "className":
        if (typeof value === "function") node.dynamicClass = value as () => StyleClass;
        else node.classes.push((value as StyleClass)[CLASS]);
        break;
      case "value":
        // Never reset what the user is typing to the same text (the caret would jump).
        node.bind(dynamic(value as string), (text) => field.value !== text && (field.value = text));
        break;
      case "placeholder":
        node.bind(dynamic(value as string), (text) => (field.placeholder = text));
        break;
      case "checked":
        node.bind(dynamic(value as boolean), (on) => (field.checked = on));
        break;
      case "disabled":
        node.bind(dynamic(value as boolean), (off) => {
          field.disabled = off;
          if (node.kind === "box" || node.kind === "text") el.style.pointerEvents = off ? "none" : "";
        });
        break;
      case "src":
        node.bind(dynamic(value as string), (url) => ((el as HTMLImageElement).src = url));
        break;
      case "href":
        node.bind(dynamic(value as string), (url) => ((el as HTMLAnchorElement).href = url));
        (el as HTMLAnchorElement).target = "_blank";
        (el as HTMLAnchorElement).rel = "noopener";
        node.interactive();
        break;
      case "ariaLabel":
        node.bind(dynamic(value as string), (text) => el.setAttribute("aria-label", text));
        break;
      case "label":
        node.bind(dynamic(value as string), (text) => ((el as HTMLOptGroupElement).label = text));
        break;
      case "type":
        if (value !== "checkbox") field.type = value as string;
        break;
      case "onMount":
        node.mountCallbacks.push(value as (el: HTMLElement) => void | (() => void));
        break;
      case "onDestroy":
        node.destroyCallbacks.push(value as (el: HTMLElement) => void);
        break;
      default:
        if (key.startsWith("on")) listen(node, key[2]!.toLowerCase() + key.slice(3), value as (event: never) => void);
    }
  }
}

function pointerOf(el: HTMLElement, e: PointerEvent | MouseEvent): API.PointerEvent {
  const rect = el.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top, pageX: e.clientX, pageY: e.clientY, pointerId: "pointerId" in e ? e.pointerId : 0 };
}

const SLOP = 8;

function listen(node: Node, type: string, handler: (event: never) => void) {
  const el = node.el!;
  const call = handler as (event: unknown) => void;
  node.interactive();
  switch (type) {
    case "click":
      if (node.kind === "box" || node.kind === "text") el.style.cursor = "pointer";
      return el.addEventListener("click", call);
    case "input":
    case "focus":
    case "blur":
      return el.addEventListener(type, call);
    case "change":
      // A field reports change when it is committed (Enter), as the native fields do; a switch when it flips.
      if (node.kind === "checkbox" || el instanceof HTMLSelectElement) return el.addEventListener("change", call);
      return el.addEventListener("keydown", (e) => e.key === "Enter" && !e.isComposing && call(e));
    case "keyDown":
      if (node.kind === "box") el.tabIndex = 0;
      return el.addEventListener("keydown", call);
    case "pointerDown":
    case "pointerMove":
    case "pointerUp":
    case "pointerCancel":
      return el.addEventListener(type.toLowerCase(), (e) => call(pointerOf(el, e as PointerEvent)));
    case "doubleClick":
      return el.addEventListener("dblclick", (e) => call(pointerOf(el, e)));
    case "scroll":
      return el.addEventListener(
        "scroll",
        () => call({ scrollTop: el.scrollTop, scrollLeft: el.scrollLeft, scrollHeight: el.scrollHeight, scrollWidth: el.scrollWidth, clientHeight: el.clientHeight, clientWidth: el.clientWidth }),
        { passive: true },
      );
    case "longPress":
      return longPress(el, call);
    case "pan":
      return pan(el, call);
    case "pinch":
      return pinch(el, call);
  }
}

function longPress(el: HTMLElement, call: (e: API.PointerEvent) => void) {
  let timer = 0;
  let startX = 0;
  let startY = 0;
  const cancel = () => window.clearTimeout(timer);
  el.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    cancel();
    timer = window.setTimeout(() => call(pointerOf(el, e)), 500);
  });
  el.addEventListener("pointermove", (e) => Math.hypot(e.clientX - startX, e.clientY - startY) > SLOP && cancel());
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) el.addEventListener(type, cancel);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}

/** A drag: it starts once the pointer has left the slop, then owns the pointer until it is released. */
function pan(el: HTMLElement, call: (e: API.PanEvent) => void) {
  el.style.touchAction = "none";
  let id = -1;
  let startX = 0;
  let startY = 0;
  let active = false;
  let samples: { t: number; x: number; y: number }[] = [];
  const emit = (state: API.GestureState, e: PointerEvent) => {
    const now = performance.now();
    samples.push({ t: now, x: e.clientX, y: e.clientY });
    samples = samples.filter((s) => now - s.t <= 100);
    const first = samples[0]!;
    const dt = (now - first.t) / 1000;
    const point = pointerOf(el, e);
    call({
      state,
      translationX: e.clientX - startX,
      translationY: e.clientY - startY,
      velocityX: dt > 0 ? (e.clientX - first.x) / dt : 0,
      velocityY: dt > 0 ? (e.clientY - first.y) / dt : 0,
      x: point.x,
      y: point.y,
    });
  };
  el.addEventListener("pointerdown", (e) => {
    if (id !== -1) return;
    id = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    active = false;
    samples = [];
  });
  el.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    if (!active) {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) < SLOP) return;
      active = true;
      el.setPointerCapture(id);
      // The translation counts from where the drag was recognized, so the view does not jump.
      startX = e.clientX;
      startY = e.clientY;
      return emit("start", e);
    }
    emit("move", e);
  });
  const end = (state: API.GestureState) => (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = -1;
    if (active) emit(state, e);
    active = false;
  };
  el.addEventListener("pointerup", end("end"));
  el.addEventListener("pointercancel", end("cancel"));
}

function pinch(el: HTMLElement, call: (e: API.PinchEvent) => void) {
  el.style.touchAction = "none";
  const points = new Map<number, PointerEvent>();
  let startDistance = 0;
  let scale = 1;
  const measure = () => {
    const [a, b] = [...points.values()];
    const rect = el.getBoundingClientRect();
    return { distance: Math.hypot(a!.clientX - b!.clientX, a!.clientY - b!.clientY), x: (a!.clientX + b!.clientX) / 2 - rect.left, y: (a!.clientY + b!.clientY) / 2 - rect.top };
  };
  el.addEventListener("pointerdown", (e) => {
    points.set(e.pointerId, e);
    if (points.size !== 2) return;
    el.setPointerCapture(e.pointerId);
    const m = measure();
    startDistance = m.distance || 1;
    scale = 1;
    call({ state: "start", scale, focalX: m.x, focalY: m.y });
  });
  el.addEventListener("pointermove", (e) => {
    if (!points.has(e.pointerId)) return;
    points.set(e.pointerId, e);
    if (points.size !== 2) return;
    const m = measure();
    scale = m.distance / startDistance;
    call({ state: "move", scale, focalX: m.x, focalY: m.y });
  });
  const end = (state: API.GestureState) => (e: PointerEvent) => {
    if (points.size === 2 && points.has(e.pointerId)) {
      const m = measure();
      call({ state, scale, focalX: m.x, focalY: m.y });
    }
    points.delete(e.pointerId);
  };
  el.addEventListener("pointerup", end("end"));
  el.addEventListener("pointercancel", end("cancel"));
  // A trackpad pinch (and ctrl + wheel) arrives as wheel events: each one is a whole small gesture.
  let wheelScale = 1;
  let wheelTimer = 0;
  el.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const point = pointerOf(el, e);
      const starting = wheelTimer === 0;
      if (starting) wheelScale = 1;
      wheelScale *= Math.exp(-e.deltaY / 100);
      call({ state: starting ? "start" : "move", scale: wheelScale, focalX: point.x, focalY: point.y });
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelTimer = 0;
        call({ state: "end", scale: wheelScale, focalX: point.x, focalY: point.y });
      }, 150);
    },
    { passive: false },
  );
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function builder(kind: Kind, tag: string): (...children: Child[]) => API.Node {
  return (...children) =>
    asApi<API.Node>({
      [FACTORY]: () => {
        const isCheckbox = kind === "input" && children.some((c) => c != null && typeof c === "object" && (c as API.Attributes).type === "checkbox");
        const node = new Node(isCheckbox ? "checkbox" : kind, tag);
        if (isCheckbox) (node.el as HTMLInputElement).type = "checkbox";
        node.add(children);
        node.syncViews();
        return node;
      },
    });
}

const box = (tag: string) => builder("box", tag);
const text = (tag: string) => builder("text", tag);

export const div = box("div");
export const section = box("section");
export const header = box("header");
export const footer = box("footer");
export const main = box("main");
export const nav = box("nav");
export const article = box("article");
export const aside = box("aside");
export const form = box("div");
export const ul = box("ul");
export const ol = box("ol");
export const li = box("li");
export const figure = box("figure");
export const fieldset = box("fieldset");
export const blockquote = box("blockquote");
export const address = box("address");
export const hgroup = box("hgroup");
export const menu = box("menu");
export const search = box("search");
export const dl = box("dl");
export const details = box("div");
export const dialog = box("div");
// Table tags are flex boxes here, as natively: real table elements would lay out as a table.
export const table = box("div");
export const thead = box("div");
export const tbody = box("div");
export const tfoot = box("div");
export const tr = builder("box", "tr");
export const td = builder("box", "td");
export const th = builder("box", "th");
export const hr = builder("box", "hr");

export const span = text("span");
export const p = text("p");
export const h1 = text("h1");
export const h2 = text("h2");
export const h3 = text("h3");
export const h4 = text("h4");
export const h5 = text("h5");
export const h6 = text("h6");
export const label = text("label");
export const strong = text("strong");
export const b = text("b");
export const small = text("small");
export const em = text("em");
export const i = text("i");
export const u = text("u");
export const s = text("s");
export const del = text("del");
export const ins = text("ins");
export const mark = text("mark");
export const code = text("code");
export const pre = text("pre");
export const kbd = text("kbd");
export const samp = text("samp");
export const var_ = text("var");
export const abbr = text("abbr");
export const cite = text("cite");
export const q = text("q");
export const dfn = text("dfn");
export const sub = text("sub");
export const sup = text("sup");
export const time = text("time");
export const legend = text("legend");
export const caption = text("caption");
export const figcaption = text("figcaption");
export const summary = text("summary");
export const dt = text("dt");
export const dd = text("dd");
export const a = text("a");
export const bdi = text("bdi");
export const bdo = text("bdo");
export const data = text("data");
export const output = text("output");
export const rt = text("rt");
export const rp = text("rp");
export const ruby = text("ruby");
export const body = box("body");
export const html = box("html");
export const colgroup = box("colgroup");
export const col = box("col");
export const map = box("map");
export const picture = box("picture");
export const slot = box("slot");
export const head = box("head");
export const base = box("base");
export const link = box("link");
export const meta = box("meta");
export const script = box("script");
export const style = box("style");
export const title = box("title");
export const template = box("template");
export const noscript = box("noscript");
export const datalist = box("datalist");
export const area = box("area");
export const source = box("source");
export const track = box("track");
export const wbr = box("wbr");
// A real <br> measures one pixel taller than the 16 points the native runtimes give it.
export const br = (...children: Child[]) => box("div")({ style: { height: 16 } }, ...children);

/**
 * `select`, `option` and `optgroup` are the browser's own: the other targets build the control from boxes (the
 * compiler does it, since a native select has no common look), and the browser has one. A select's `value` is
 * set once its options are in it, and again at every update: a `list()` may have made them since.
 */
export function select(...children: Child[]): API.Node {
  return asApi<API.Node>({
    [FACTORY]: () => {
      const node = new Node("box", "select");
      let value: API.Dynamic<string> | undefined;
      const rest = children.map((child) => {
        const c = child as Partial<Factory & Modifier & StyleClass> | null;
        if (!c || typeof c !== "object" || c[FACTORY] || c[MODIFIER] || c[CLASS]) return child;
        const { value: own, ...others } = c as API.Attributes;
        value ??= own;
        return others as API.Attributes;
      });
      node.add(rest);
      node.syncViews();
      if (value !== undefined) {
        const field = node.el as HTMLSelectElement;
        const read = dynamic(value);
        const apply = () => {
          const wanted = read();
          if (field.value !== wanted) field.value = wanted;
        };
        apply();
        node.bindings.push(apply);
      }
      return node;
    },
  });
}
export const option = text("option");
export const optgroup = box("optgroup");

/** `progress` and `meter` as the compiler lowers them: a track with a fill whose width follows the value. */
function gauge(tag: "progress" | "meter"): (...children: (Child | API.GaugeAttributes)[]) => API.Node {
  return (...children) => {
    const spec: API.GaugeAttributes = {};
    const rest = children.map((child) => {
      const c = child as Partial<Factory & Modifier & StyleClass> | null;
      if (!c || typeof c !== "object" || c[FACTORY] || c[MODIFIER] || c[CLASS]) return child as Child;
      const own: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(c)) (["value", "min", "max", "low", "high", "optimum"].includes(key) ? (spec as Record<string, unknown>) : own)[key] = value;
      return own as API.Attributes;
    });
    const min = spec.min ?? 0;
    const max = spec.max ?? 1;
    const low = Math.min(max, Math.max(min, spec.low ?? min));
    const high = Math.min(max, Math.max(low, spec.high ?? max));
    const optimum = Math.min(max, Math.max(min, spec.optimum ?? (min + max) / 2));
    const read = dynamic(spec.value ?? min);
    const fill = (): API.Style => {
      const value = read();
      const color =
        tag === "progress" ? "#2563eb"
        : optimum < low ? (value < low ? "#22c55e" : value > high ? "#ef4444" : "#eab308")
        : optimum > high ? (value > high ? "#22c55e" : value < low ? "#ef4444" : "#eab308")
        : value >= low && value <= high ? "#22c55e" : "#eab308";
      return { width: `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`, backgroundColor: color };
    };
    // Not a <progress>: the browser would draw its own bar and ignore the children.
    return box(`n-${tag}`)(...rest, div({ style: fill }));
  };
}
export const progress = gauge("progress");
export const meter = gauge("meter");

export const button = builder("button", "button");
export const input = builder("input", "input");
export const textarea = builder("textarea", "textarea");
export const img = builder("image", "img");

// ---------------------------------------------------------------------------
// update(), scope(), render()
// ---------------------------------------------------------------------------

const roots: Node[] = [];
let updating = false;
let queuedAll = false;
const queuedIds = new Set<string>();

function run(ids: readonly string[]) {
  generation++;
  if (!ids.length) {
    for (const node of [...roots]) node.refresh();
    return;
  }
  const wanted = new Set(ids);
  const found: Node[] = [];
  const visit = (node: Node) => {
    for (const id of node.scopes) if (wanted.has(id)) return void found.push(node);
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  for (const node of found) node.refresh();
}

export function update(...scopeIds: string[]): void {
  if (updating) {
    if (scopeIds.length) for (const id of scopeIds) queuedIds.add(id);
    else queuedAll = true;
    return;
  }
  updating = true;
  try {
    run(scopeIds);
    while (queuedAll || queuedIds.size) {
      const next = queuedAll ? [] : [...queuedIds];
      queuedAll = false;
      queuedIds.clear();
      run(next);
    }
  } finally {
    updating = false;
  }
}

export function forceUpdate(): void {
  forcing = true;
  try {
    update();
  } finally {
    forcing = false;
  }
}

export const scope = (...ids: string[]) => asApi<API.Modifier>(modifier((node) => ids.forEach((id) => node.scopes.add(id))));

function addRoot(node: Node) {
  roots.push(node);
  node.applyStylesDeep();
}

function removeRoot(node: Node) {
  const at = roots.indexOf(node);
  if (at >= 0) roots.splice(at, 1);
  node.destroy();
}

let app: HTMLElement | null = null;
let mainEl: HTMLElement | null = null;

function window_(): HTMLElement {
  if (app) return app;
  document.head.append(Object.assign(document.createElement("style"), { textContent: BASE_CSS }));
  app = Object.assign(document.createElement("div"), { id: "nuclo" });
  mainEl = Object.assign(document.createElement("div"), { className: "nuclo-main" });
  app.append(mainEl);
  document.body.append(app);
  return app;
}

const make = (view: API.Node): Node => (view as unknown as Factory)[FACTORY]();

/** A scrolling screen around a root node. */
function screen(node: Node): HTMLElement {
  const el = Object.assign(document.createElement("div"), { className: "nuclo-screen" });
  el.append(node.el!);
  return el;
}

export function render(view: (() => API.Node) | API.Outlet): void {
  window_();
  if (typeof view !== "function") {
    mainEl!.append((view as unknown as RouterImpl).makeView());
    return;
  }
  const node = make(view());
  addRoot(node);
  if (!mainEl!.children.length) {
    mainEl!.append(screen(node));
  } else {
    // A layer over the app, which lets the pointer through where it has no view.
    const layer = Object.assign(document.createElement("div"), { className: "nuclo-layer" });
    layer.append(node.el!);
    mainEl!.append(layer);
  }
  node.mountDeep();
}

export const hydrate = render;

// ---------------------------------------------------------------------------
// list(), when(), region(), into()
// ---------------------------------------------------------------------------

/** Rows keyed by identity: a row is rebuilt only when its item is new. */
export function list<T>(items: () => readonly T[], renderRow: (item: T, index: number) => API.Node | null): API.Modifier {
  return asApi<API.Modifier>(
    modifier((parent) => {
      const fragment = new Node("fragment", "list");
      parent.append(fragment);
      let rows: { item: T; node: Node | null }[] = [];
      fragment.reconcile = () => {
        const next = items();
        const byItem = new Map<T, number[]>();
        rows.forEach((row, at) => {
          const queue = byItem.get(row.item);
          if (queue) queue.push(at);
          else byItem.set(row.item, [at]);
        });
        const used = new Array<boolean>(rows.length).fill(false);
        const built: typeof rows = [];
        const fresh: Node[] = [];
        let changed = next.length !== rows.length;
        next.forEach((item, index) => {
          const at = byItem.get(item)?.shift();
          if (at !== undefined) {
            used[at] = true;
            if (at !== index) changed = true;
            built.push(rows[at]!);
          } else {
            const view = renderRow(item, index);
            const node = view ? make(view) : null;
            if (node) {
              node.parent = fragment;
              fresh.push(node);
            }
            built.push({ item, node });
            changed = true;
          }
        });
        rows.forEach((row, at) => !used[at] && row.node?.destroy());
        rows = built;
        if (changed) {
          fragment.children = built.flatMap((row) => (row.node ? [row.node] : []));
          for (const node of fresh) node.applyStylesDeep();
          fragment.syncViews();
        }
      };
      fragment.reconcile();
    }),
  );
}

type Condition = boolean | (() => boolean);

export function when(condition: Condition, ...content: Child[]): API.WhenBuilder {
  const branches: { test: () => boolean; content: Child[] }[] = [];
  let otherwise: Child[] | null = null;
  const builder = {
    when(test: Condition, ...children: Child[]) {
      branches.push({ test: typeof test === "function" ? test : () => test, content: children });
      return builder;
    },
    else(...children: Child[]) {
      otherwise = children;
      return builder;
    },
    [MODIFIER](parent: Node) {
      const fragment = new Node("fragment", "when");
      parent.append(fragment);
      let active = -2;
      fragment.reconcile = () => {
        const next = branches.findIndex((branch) => branch.test());
        if (next === active) return;
        active = next;
        for (const child of fragment.children) child.destroy();
        fragment.children = [];
        const shown = next >= 0 ? branches[next]!.content : otherwise;
        if (shown) fragment.add(shown);
        for (const child of fragment.children) child.applyStylesDeep();
        fragment.syncViews();
      };
      fragment.reconcile();
    },
  };
  builder.when(condition, ...content);
  return asApi<API.WhenBuilder>(builder);
}

interface IntoEntry {
  content: Child[];
  holder: Node | null;
}

class RegionState {
  readonly entries: IntoEntry[] = [];
  private emptyHolder: Node | null = null;
  readonly fragment: Node;
  private readonly stack: boolean;
  private readonly empty: Child | undefined;

  constructor(fragment: Node, stack: boolean, empty: Child | undefined) {
    this.fragment = fragment;
    this.stack = stack;
    this.empty = empty;
  }

  private hold(content: Child[]): Node {
    const holder = new Node("fragment", "into");
    holder.parent = this.fragment;
    holder.add(content);
    holder.applyStylesDeep();
    return holder;
  }

  /** Shows the newest entry (or all of them, stacked), building only those not shown yet. */
  render() {
    const shown = this.stack ? [...this.entries] : this.entries.slice(-1);
    for (const entry of this.entries) {
      if (!shown.includes(entry)) {
        entry.holder?.destroy();
        entry.holder = null;
      }
    }
    let children = shown.map((entry) => (entry.holder ??= this.hold(entry.content)));
    if (!children.length && this.empty != null) {
      children = [(this.emptyHolder ??= this.hold([this.empty]))];
    } else {
      this.emptyHolder?.destroy();
      this.emptyHolder = null;
    }
    this.fragment.children = children;
    this.fragment.syncViews();
  }
}

const regions = new Map<string, RegionState>();
const waiting = new Map<string, IntoEntry[]>();

export function region(options: API.RegionOptions): API.Modifier {
  return asApi<API.Modifier>(
    modifier((parent) => {
      const fragment = new Node("fragment", "region");
      parent.append(fragment);
      const state = new RegionState(fragment, options.type === "stack", options.empty);
      regions.set(options.id, state);
      state.entries.push(...(waiting.get(options.id) ?? []));
      waiting.delete(options.id);
      state.render();
      fragment.teardown.push(() => {
        // The region goes: its views wait for the next region with this id.
        for (const entry of state.entries) {
          entry.holder?.destroy();
          entry.holder = null;
        }
        if (regions.get(options.id) === state) regions.delete(options.id);
        waiting.set(options.id, [...(waiting.get(options.id) ?? []), ...state.entries]);
      });
    }),
  );
}

export function into(id: string, ...content: Child[]): API.Modifier {
  return asApi<API.Modifier>(
    modifier((parent) => {
      const anchor = new Node("fragment", "into-anchor");
      parent.append(anchor);
      const entry: IntoEntry = { content, holder: null };
      const target = regions.get(id);
      if (target) {
        target.entries.push(entry);
        target.render();
      } else {
        waiting.set(id, [...(waiting.get(id) ?? []), entry]);
      }
      anchor.teardown.push(() => {
        entry.holder?.destroy();
        entry.holder = null;
        const state = regions.get(id);
        const at = state ? state.entries.indexOf(entry) : -1;
        if (state && at >= 0) {
          state.entries.splice(at, 1);
          state.render();
        }
        const queue = waiting.get(id);
        if (queue?.includes(entry)) queue.splice(queue.indexOf(entry), 1);
      });
    }),
  );
}

export function on(type: string, listener: (event: never) => void): API.Modifier {
  return asApi<API.Modifier>(
    modifier((node) => {
      if (type === "mount") node.mountCallbacks.push(listener as never);
      else if (type === "destroy") node.destroyCallbacks.push(listener as never);
      else listen(node, type, listener);
    }),
  );
}

// ---------------------------------------------------------------------------
// Styling
// ---------------------------------------------------------------------------

export const css = (nameOrStyle: string | API.Style, style?: API.Style) => asApi<API.StyleClass>({ [CLASS]: style ?? (nameOrStyle as API.Style) });

export function cx(...classes: (API.StyleClass | null | undefined | false)[]): API.StyleClass {
  let style: API.Style = {};
  for (const c of classes) if (c) style = merge(style, (c as unknown as StyleClass)[CLASS]);
  return css(style);
}

type Selection = Record<string, string | boolean | undefined>;

/** base, then each selected value in declaration order, then the matching compounds. */
export function variants(config: {
  base?: API.Style;
  variants: Record<string, Record<string, API.Style>>;
  defaultVariants?: Selection;
  compoundVariants?: (Selection & { css: API.Style })[];
}) {
  const cache = new Map<string, API.StyleClass>();
  return (selection: Selection = {}): API.StyleClass => {
    const chosen: Record<string, string> = {};
    for (const group in config.variants) {
      const value = selection[group] ?? config.defaultVariants?.[group] ?? ("false" in config.variants[group]! ? "false" : undefined);
      if (value !== undefined) chosen[group] = String(value);
    }
    const key = JSON.stringify(chosen);
    let cls = cache.get(key);
    if (!cls) {
      let style = config.base ?? {};
      for (const group in chosen) {
        const picked = config.variants[group]![chosen[group]!];
        if (picked) style = merge(style, picked);
      }
      for (const { css: extra, ...match } of config.compoundVariants ?? []) {
        if (Object.keys(match).every((group) => chosen[group] === String(match[group]))) style = merge(style, extra);
      }
      cache.set(key, (cls = css(style)));
    }
    return cls;
  };
}

// ---------------------------------------------------------------------------
// Router: stacks per tab, the URL fragment as the address
// ---------------------------------------------------------------------------

type RouteOptions = { view: API.View; title?: string | ((params: API.Params) => string); presentation?: "push" | "modal"; header?: boolean };

interface Entry {
  path: string;
  node: Node;
  el: HTMLElement;
  title: string;
  modal: boolean;
  header: boolean;
}

const GLYPHS: Record<string, string> = { home: "⌂", list: "☰", cloud: "☁", star: "★", person: "◉", settings: "⚙", search: "⌕" };

class RouterImpl {
  private readonly routes: { parts: string[]; options: RouteOptions }[];
  private readonly tabs: API.Tab[];
  private readonly initial: string;
  private stacks: Entry[][] = [];
  private active = 0;
  private stackEl!: HTMLElement;
  private root!: HTMLElement;
  private bar!: HTMLElement;
  private titleEl!: HTMLElement;
  private backEl!: HTMLElement;
  private tabEls: HTMLElement[] = [];

  constructor(routes: Record<string, API.Route>, options: API.RouterOptions = {}) {
    this.routes = Object.entries(routes).map(([pattern, route]) => ({ parts: pattern.split("/"), options: typeof route === "function" ? { view: route } : route }));
    this.tabs = options.tabs ?? [];
    this.initial = options.initial ?? "/";
  }

  get outlet() {
    return asApi<API.Outlet>(this);
  }
  get path() {
    return this.stacks[this.active]?.at(-1)?.path ?? this.initial;
  }
  get canGoBack() {
    return (this.stacks[this.active]?.length ?? 0) > 1;
  }

  makeView(): HTMLElement {
    const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string) => Object.assign(document.createElement(tag), { className });
    // A deep link: the address the page was opened at.
    const start = location.hash.length > 1 ? decodeURI(location.hash.slice(1)) : this.initial;
    const tabRoots = this.tabs.length ? this.tabs.map((tab) => tab.path) : [this.initial];
    this.active = Math.max(0, this.tabOf(start));
    this.stacks = tabRoots.map((path, at) => (at === this.active && path !== start ? [this.entry(path), this.entry(start)] : [this.entry(path)]));
    this.root = make("div", "nuclo-main");
    this.bar = make("div", "nuclo-bar");
    this.backEl = Object.assign(make("button", "nuclo-back"), { textContent: "←", onclick: () => this.back() });
    this.backEl.setAttribute("aria-label", "Back");
    this.titleEl = make("div", "");
    this.bar.append(this.backEl, this.titleEl);
    this.stackEl = make("div", "nuclo-stack");
    this.root.append(this.bar, this.stackEl);
    if (this.tabs.length) {
      const bottom = make("div", "nuclo-tabs");
      this.tabs.forEach((tab, at) => {
        const item = Object.assign(make("button", ""), { textContent: `${GLYPHS[tab.icon ?? ""] ?? "●"}\n${tab.title}`, onclick: () => this.select(at) });
        this.tabEls.push(item);
        bottom.append(item);
      });
      this.root.append(bottom);
    }
    // The browser's back and forward buttons move through the same stack.
    addEventListener("popstate", () => {
      const path = decodeURI(location.hash.slice(1)) || this.tabs[this.active]?.path || this.initial;
      const stack = this.stacks[this.active]!;
      if (stack.length > 1 && stack.at(-2)!.path === path) this.pop();
      else if (stack.at(-1)!.path !== path) this.push(path);
    });
    history.replaceState(null, "", `#${encodeURI(this.path)}`);
    this.show(0);
    // The screens were built before the stacks existed: what they read from the router is refreshed.
    update();
    return this.root;
  }

  go(path: string) {
    history.pushState(null, "", `#${encodeURI(path)}`);
    this.push(path);
  }

  back() {
    if (this.canGoBack) history.back();
  }

  replace(path: string) {
    const stack = this.stacks[this.active]!;
    const gone = stack.pop()!;
    stack.push(this.entry(path));
    removeRoot(gone.node);
    history.replaceState(null, "", `#${encodeURI(path)}`);
    this.show(0);
    update();
  }

  reset(path: string) {
    const tab = this.tabOf(path);
    if (tab >= 0) this.active = tab;
    const stack = this.stacks[this.active]!;
    const keep = stack[0]!.path === path ? stack[0]! : this.entry(path);
    for (const entry of stack) if (entry !== keep) removeRoot(entry.node);
    this.stacks[this.active] = [keep];
    history.replaceState(null, "", `#${encodeURI(path)}`);
    this.show(0);
    update();
  }

  private push(path: string) {
    this.stacks[this.active]!.push(this.entry(path));
    this.show(1);
    update();
  }

  private pop() {
    const stack = this.stacks[this.active]!;
    if (stack.length < 2) return;
    this.show(-1, stack.pop()!);
    update();
  }

  private select(at: number) {
    if (at === this.active) return this.reset(this.stacks[at]![0]!.path);
    this.active = at;
    history.replaceState(null, "", `#${encodeURI(this.path)}`);
    this.show(0);
    update();
  }

  /** Shows the active stack's top screen: slid in on a push (+1), out on a pop (-1). */
  private show(direction: number, popped?: Entry) {
    const top = this.stacks[this.active]!.at(-1)!;
    const slide = (entry: Entry, from: string, to: string, done: () => void) => {
      const axis = entry.modal ? "Y" : "X";
      const animation = entry.el.animate([{ transform: `translate${axis}(${from})` }, { transform: `translate${axis}(${to})` }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
      // A timer, not the animation's end: a hidden tab does not run animations, and the stack must still settle.
      window.setTimeout(() => {
        animation.cancel();
        done();
      }, 240);
    };
    const host = (entry: Entry) => (entry.modal ? this.root : this.stackEl);
    const keepOnly = () => {
      for (const el of [...this.stackEl.children]) if (el !== top.el && !top.modal) el.remove();
    };
    if (direction > 0) {
      host(top).append(top.el);
      slide(top, "100%", "0", keepOnly);
    } else if (direction < 0 && popped) {
      if (!top.el.isConnected) this.stackEl.prepend(top.el);
      slide(popped, "0", "100%", () => {
        popped.el.remove();
        removeRoot(popped.node);
      });
    } else {
      for (const el of [...this.root.querySelectorAll(".nuclo-sheet")]) el.remove();
      this.stackEl.replaceChildren(top.el);
    }
    top.node.mountDeep();
    this.titleEl.textContent = top.title;
    this.bar.style.display = top.header ? "" : "none";
    this.backEl.style.visibility = this.canGoBack ? "visible" : "hidden";
    this.backEl.style.width = this.canGoBack ? "" : "20px";
    this.tabEls.forEach((el, at) => el.classList.toggle("active", at === this.active));
    document.title = top.title || document.title;
  }

  private entry(path: string): Entry {
    for (const route of this.routes) {
      const params = match(route.parts, path);
      if (!params) continue;
      const { view, title, presentation, header } = route.options;
      const node = make(view(params));
      addRoot(node);
      const el = screen(node);
      const modal = presentation === "modal";
      if (modal) el.classList.add("nuclo-sheet");
      return { path, node, el, title: typeof title === "function" ? title(params) : (title ?? ""), modal, header: header ?? true };
    }
    const node = make(p(`No route matches ${path}`));
    addRoot(node);
    return { path, node, el: screen(node), title: "Not found", modal: false, header: true };
  }

  private tabOf(path: string): number {
    let best = -1;
    this.tabs.forEach((tab, at) => {
      const owns = tab.path === "/" || path === tab.path || path.startsWith(`${tab.path}/`);
      if (owns && (best < 0 || tab.path.length > this.tabs[best]!.path.length)) best = at;
    });
    return best;
  }
}

function match(parts: string[], path: string): API.Params | null {
  const segments = path.split("/");
  if (segments.length !== parts.length) return null;
  const params: API.Params = {};
  for (let at = 0; at < parts.length; at++) {
    if (parts[at]!.startsWith(":")) params[parts[at]!.slice(1)] = segments[at]!;
    else if (parts[at] !== segments[at]) return null;
  }
  return params;
}

export const createRouter = (routes: Record<string, API.Route>, options?: API.RouterOptions) => asApi<API.Router>(new RouterImpl(routes, options));

// ---------------------------------------------------------------------------
// Native components
// ---------------------------------------------------------------------------

/** What native/web/ registers for a component: it makes an element, and applies props when one changed. */
export interface NativeComponent<P> {
  create(): HTMLElement;
  update(element: HTMLElement, props: P): void;
  destroy?(element: HTMLElement): void;
}

const components = new Map<string, () => NativeComponent<never>>();

export function registerNative<P>(name: string, component: () => NativeComponent<P>): void {
  components.set(name, component as () => NativeComponent<never>);
}

const ATTRIBUTES = new Set(["style", "className", "onMount", "onDestroy"]);

export function native<P>(name: string) {
  return (props: API.NativeProps<P>, ...children: Child[]) =>
    asApi<API.Node>({
      [FACTORY]: () => {
        const make = components.get(name);
        if (!make) throw new Error(`No native component "${name}" is registered for the web (native/web/).`);
        const component = make() as NativeComponent<Record<string, unknown>>;
        const el = component.create();
        const node = new Node("native", "", el);
        const values: Record<string, unknown> = {};
        const attrs: Record<string, unknown> = {};
        let dirty = true;
        for (const key in props) {
          const value = (props as Record<string, unknown>)[key];
          if (ATTRIBUTES.has(key)) attrs[key] = value;
          // A callback prop is named on…: it is passed through; other functions are dynamic values.
          else if (typeof value === "function" && !/^on[A-Z]/.test(key)) {
            node.bind(value as () => unknown, (now) => {
              values[key] = now;
              dirty = true;
            });
          } else values[key] = value;
        }
        const flush = () => {
          if (!dirty) return;
          dirty = false;
          component.update(el, values);
        };
        node.bindings.push(flush);
        flush();
        if (component.destroy) node.destroyCallbacks.push((element) => component.destroy!(element));
        node.add([attrs as API.Attributes, ...children]);
        return node;
      },
    });
}

// ---------------------------------------------------------------------------
// Async, timers, console
// ---------------------------------------------------------------------------

export const fetch = (url: string, init?: API.RequestInit) => globalThis.fetch(url, init) as unknown as Promise<API.Response>;
export const delay = (ms: number) => new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));
export const setTimeout = (callback: () => void, ms: number) => asApi<API.Timer>(globalThis.setTimeout(callback, ms));
export const setInterval = (callback: () => void, ms: number) => asApi<API.Timer>(globalThis.setInterval(callback, ms));
export const clearTimeout = (timer: API.Timer) => globalThis.clearTimeout(timer as unknown as number);
export const clearInterval = (timer: API.Timer) => globalThis.clearInterval(timer as unknown as number);
// `time` counts as Date.now() does, on every target.
export const requestAnimationFrame = (callback: (time: number) => void) => asApi<API.Frame>(globalThis.requestAnimationFrame(() => callback(Date.now())));
export const cancelAnimationFrame = (frame: API.Frame) => globalThis.cancelAnimationFrame(frame as unknown as number);
export const console = globalThis.console;
