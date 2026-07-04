/**
 * Type-level tests for the `nuclo/ssr` and `nuclo/polyfill` subpath
 * declarations (types/ssr.d.ts, types/polyfill.d.ts) — the entries the
 * package.json exports map points at.
 *
 * Compiled by `npm run typecheck`, never executed. These files are
 * hand-written mirrors of src/ssr/index.ts and src/polyfill/index.ts; if the
 * runtime surface changes without the declarations, the runtime import block
 * at the bottom is the drift alarm (same names must exist in both).
 */
import {
  renderToString,
  renderManyToString,
  renderToStringWithContainer,
  setSSRCollector,
  getCssText,
  type RenderableInput,
} from "../types/ssr";
import {
  NucloNode,
  NucloText,
  NucloElement,
  NucloDocument,
  NucloEvent,
  NucloCustomEvent,
  document as polyfillDocument,
  Event as PolyfillEvent,
  CustomEvent as PolyfillCustomEvent,
  Node as PolyfillNode,
  Element as PolyfillElement,
  HTMLElement as PolyfillHTMLElement,
} from "../types/polyfill";

// Drift alarm: every declared name must also exist on the runtime modules.
import * as ssrRuntime from "../src/ssr";
import * as polyfillRuntime from "../src/polyfill";

// ─── nuclo/ssr ───────────────────────────────────────────────────────────────

// The user-facing shapes: builders, nodes and nullish inputs are accepted.
const html: string = renderToString(div("Hello"));
const htmlFromNothing: string = renderToString(null);
const many: string[] = renderManyToString([div("a"), span("b"), undefined]);
const wrapped: string = renderToStringWithContainer(div("x"), "main", { id: "app" });
void html; void htmlFromNothing; void many; void wrapped;

const input: RenderableInput = div("x");
void input;

setSSRCollector((rule) => { const _r: string = rule; void _r; });
setSSRCollector(null);
const sheet: string = getCssText();
void sheet;

// Declared SSR surface ⊆ runtime SSR surface (name + assignable signature).
const _ssrParity: {
  renderToString: typeof renderToString;
  renderManyToString: typeof renderManyToString;
  renderToStringWithContainer: typeof renderToStringWithContainer;
  setSSRCollector: typeof setSSRCollector;
  getCssText: typeof getCssText;
} = ssrRuntime;
void _ssrParity;

// ─── nuclo/polyfill ──────────────────────────────────────────────────────────

const el = new NucloElement("div");
el.setAttribute("id", "x");
const attr: string | null = el.getAttribute("id");
void attr;
el.className = "a b";
el.classList.add("c");
el.style.setProperty("color", "red");
const text = new NucloText("hi");
const data: string = text.data;
void data;
const doc = new NucloDocument();
const created: ExpandedElement = doc.createElement("section");
void created;
const ev = new NucloEvent("ping", { bubbles: true });
ev.preventDefault();
const custom = new NucloCustomEvent("app:ready", { detail: { ok: true } });
const ok: boolean = custom.detail.ok;
void ok;
void NucloNode;

// Constructor aliases are constructible.
new PolyfillEvent("x");
new PolyfillCustomEvent("y");
new PolyfillNode();
new PolyfillElement("div");
new PolyfillHTMLElement("span");
polyfillDocument.querySelector("#app");

// Declared polyfill value surface ⊆ runtime polyfill surface.
const _polyfillParity: {
  NucloNode: unknown;
  NucloText: unknown;
  NucloElement: unknown;
  NucloDocument: unknown;
  NucloEvent: unknown;
  NucloCustomEvent: unknown;
  document: unknown;
  Event: unknown;
  CustomEvent: unknown;
  Node: unknown;
  Element: unknown;
  HTMLElement: unknown;
} = polyfillRuntime;
void _polyfillParity;

export {};
