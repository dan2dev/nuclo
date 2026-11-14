/**
 * The web target: nuclo on the real DOM, laid out by the browser's CSS with
 * the same style contract as the native hosts (see layout.ts): the bundled
 * font, its line height, flex columns, `flex: n` from a basis of 0, the
 * control boxes. Everything else the web offers (css(), any tag, any CSS
 * property, fetch…) keeps working. The router's app shell (router-web.ts) is
 * styled here too.
 */
import "nuclo";

export { flatList, windowed } from "./windowed-web";

// Containers are flex columns, as on native. :where() keeps specificity at
// zero, so any app stylesheet or inline style wins.
const base = document.createElement("style");
base.textContent = `
@font-face { font-family: Inter; src: url(fonts/Inter-Regular.ttf); font-weight: 400; font-display: block; }
@font-face { font-family: Inter; src: url(fonts/Inter-Bold.ttf); font-weight: 700; font-display: block; }
html, body { height: 100%; margin: 0; }
/* The page scrolls like a feed: no scrollbar beside the content. */
html { scrollbar-width: none; }
body { font: 14px/1.35 Inter, system-ui, sans-serif; -webkit-text-size-adjust: 100%; }
:where(body, div, main, section, header, footer, nav, article, aside, form, ul, ol, li) {
  display: flex; flex-direction: column; position: relative;
}
:where(body *) { box-sizing: border-box; flex-shrink: 0; min-width: 0; min-height: 0; margin: 0; }
:where(h1) { font-size: 32px; } :where(h2) { font-size: 24px; } :where(h3) { font-size: 20px; }
:where(h1, h2, h3, strong, b) { font-weight: 700; }
:where(img) { display: block; object-fit: cover; }
:where(video) { display: block; aspect-ratio: 16 / 9; object-fit: contain; background: #000; }
:where(input, textarea, button) { font: inherit; line-height: 1.35; border: 0; padding: 8px; outline-offset: 2px; }
:where(button) { padding: 8px 16px; }
:where(input[type="checkbox"]) { width: 24px; height: 24px; padding: 0; }
/* A text field's content is 144 wide (160 with its padding) unless it is stretched or sized. */
:where(input:not([type="checkbox"]), textarea) { contain: inline-size; contain-intrinsic-inline-size: 144px; }

/* The router's app shell: bar, screen, tab bar. Colours: --nuclo-accent. */
.nuclo-app { min-height: 100%; }
.nuclo-bar, .nuclo-tabs {
  position: sticky; z-index: 1; flex-direction: row; align-items: center;
  background: rgb(255 255 255 / 72%); -webkit-backdrop-filter: saturate(180%) blur(20px); backdrop-filter: saturate(180%) blur(20px);
}
.nuclo-bar {
  top: 0; gap: 4px; min-height: 52px; padding: env(safe-area-inset-top) 12px 0;
  border-bottom: 1px solid rgb(0 0 0 / 6%); view-transition-name: nuclo-bar;
}
.nuclo-bar h1 { font-size: 17px; font-weight: 600; padding-left: 4px; }
.nuclo-back {
  display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
  border-radius: 20px; background: none; color: var(--nuclo-accent, #2563eb); cursor: pointer;
}
.nuclo-back:hover { background: rgb(0 0 0 / 5%); }
.nuclo-screen { flex: 1; view-transition-name: nuclo-screen; }
.nuclo-tabs {
  bottom: 0; padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid rgb(0 0 0 / 6%); view-transition-name: nuclo-tabs;
}
.nuclo-tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 0 6px;
  background: none; color: #6b7280; font-size: 11px; font-weight: 500; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.nuclo-tab[aria-current="page"] { color: var(--nuclo-accent, #2563eb); }
.nuclo-back svg, .nuclo-tab svg { width: 24px; height: 24px; fill: currentColor; }

/* Push slides the new screen in over the old one; pop reverses it. */
@keyframes nuclo-from-right { from { transform: translateX(100%); } }
@keyframes nuclo-to-right { to { transform: translateX(100%); } }
@keyframes nuclo-from-left { from { transform: translateX(-30%); opacity: .7; } }
@keyframes nuclo-to-left { to { transform: translateX(-30%); opacity: .7; } }
::view-transition-group(nuclo-screen) { animation-duration: 380ms; animation-timing-function: cubic-bezier(.2, .9, .3, 1); }
html:active-view-transition-type(push)::view-transition-old(nuclo-screen) { animation: 380ms cubic-bezier(.2, .9, .3, 1) both nuclo-to-left; }
html:active-view-transition-type(push)::view-transition-new(nuclo-screen) { animation: 380ms cubic-bezier(.2, .9, .3, 1) both nuclo-from-right; }
html:active-view-transition-type(pop)::view-transition-old(nuclo-screen) { animation: 380ms cubic-bezier(.2, .9, .3, 1) both nuclo-to-right; z-index: 1; }
html:active-view-transition-type(pop)::view-transition-new(nuclo-screen) { animation: 380ms cubic-bezier(.2, .9, .3, 1) both nuclo-from-left; }
`;
document.head.prepend(base);

// Native styles are unitless numbers (padding: 16). CSS wants a unit.
const UNITLESS = new Set(["opacity", "flex", "flexGrow", "flexShrink", "fontWeight", "lineHeight", "order", "zIndex"]);
const inline = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "style")!;
const proxies = new WeakMap<HTMLElement, CSSStyleDeclaration>();

Object.defineProperty(HTMLElement.prototype, "style", {
  ...inline,
  get(this: HTMLElement) {
    let proxy = proxies.get(this);
    if (!proxy) {
      proxy = new Proxy(inline.get!.call(this) as CSSStyleDeclaration, {
        get(style, key) {
          const value = Reflect.get(style, key);
          return typeof value === "function" ? value.bind(style) : value;
        },
        set(style, key, value) {
          // fontFamily "system": the OS font instead of the bundled one.
          if (key === "fontFamily" && value === "system") value = "system-ui, sans-serif";
          // A radius clips the children, as on the native hosts.
          if (key === "borderRadius") Reflect.set(style, "overflow", "hidden");
          const unit = typeof key === "string" && !UNITLESS.has(key) && /^-?\d+(\.\d+)?$/.test(String(value));
          return Reflect.set(style, key, unit ? `${value}px` : value);
        },
      });
      proxies.set(this, proxy);
    }
    return proxy;
  },
});

/** Native batches ops per update; the DOM needs no flush. */
export function flush() {}
