/**
 * The web target: nuclo on the real DOM, with the same layout model as the
 * native hosts. Everything else the web offers (css(), any tag, any CSS
 * property, fetch…) keeps working.
 */
import "nuclo";

// Containers are flex columns, as on native. :where() keeps specificity at
// zero, so any app stylesheet or inline style wins.
const base = document.createElement("style");
base.textContent = `
html, body { height: 100%; margin: 0; }
body { font: 14px/1.35 system-ui, sans-serif; -webkit-text-size-adjust: 100%; }
:where(body, div, main, section, header, footer, nav, article, aside, form, ul, ol, li) {
  display: flex; flex-direction: column;
}
:where(body *) { box-sizing: border-box; flex-shrink: 0; min-width: 0; margin: 0; }
:where(h1) { font-size: 32px; } :where(h2) { font-size: 24px; } :where(h3) { font-size: 20px; }
:where(img) { display: block; object-fit: cover; }
:where(input, textarea, button) { font: inherit; border: 0; outline-offset: 2px; }
:where(input[type="checkbox"]) { width: 18px; height: 18px; }
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
