/// <reference path="../types/index.d.ts" />
/**
 * Type-level tests for the core public API.
 *
 * This file is compiled by `npm run typecheck` (tsconfig.typecheck.json) —
 * it has no runtime assertions. A wrong inference either fails to compile
 * directly or trips an `Expect<Equal<...>>` / `@ts-expect-error` probe.
 */
import "../src";
import { render, hydrate } from "../src/render";
import { renderToString, renderManyToString } from "../src/ssr/render-to-string";
import { on } from "../src/element/events";
import { when } from "../src/when";
import { list } from "../src/list";
import { update } from "../src/update/update";
import { scope } from "../src/update/scope";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

declare global {
  interface HTMLElementEventMap {
    "nuclo:ready": CustomEvent<{ ready: boolean }>;
  }

  interface HTMLElementEventAttributeNameMap {
    onNucloReady: "nuclo:ready";
  }
}

// Keep the explicit camel-case map exhaustive as lib.dom adds event names.
type _AllNativeEventsHaveAttributes = Expect<Equal<
  Exclude<
    NucloHTMLElementEventName,
    HTMLElementEventAttributeNameMap[keyof HTMLElementEventAttributeNameMap]
  >,
  never
>>;
type _AllMappedAttributesAreNativeEvents = Expect<Equal<
  Exclude<
    HTMLElementEventAttributeNameMap[keyof HTMLElementEventAttributeNameMap],
    NucloHTMLElementEventName
  >,
  never
>>;

// ─── Tag builders infer their tag ────────────────────────────────────────────

const _divFactory = div("hello");
type _DivFactory = Expect<Equal<typeof _divFactory, DetachedExpandedElementFactory<"div">>>;

const _inputFactory = input({ value: "x" });
type _InputFactory = Expect<Equal<typeof _inputFactory, DetachedExpandedElementFactory<"input">>>;

// Child factories are valid modifiers regardless of the parent element tag.
li(
  input({
    type: "checkbox",
    onChange(event) {
      type _NestedInputEvent = Expect<Equal<
        typeof event,
        Event & { currentTarget: HTMLInputElement }
      >>;
      void event.currentTarget.checked;
    },
  }),
  span("Nested child"),
);

// ─── render() / hydrate() return the concrete element type ──────────────────

const _renderedDiv = render(div("x"));
type _RenderDiv = Expect<Equal<typeof _renderedDiv, ExpandedElement<"div">>>;

const renderedButton = render(button("x"), document.body);
type _RenderButton = Expect<Equal<typeof renderedButton, ExpandedElement<"button">>>;

const _hydratedSection = hydrate(section(h1("x")), document.body);
type _HydrateSection = Expect<Equal<typeof _hydratedSection, ExpandedElement<"section">>>;

// Concrete element properties are reachable on the result
void renderedButton.disabled;
const anchorEl = render(a({ href: "/x" }));
void anchorEl.href;

// ─── renderToString accepts any tag's factory ────────────────────────────────

const htmlFromDiv: string = renderToString(div("x"));
const htmlFromSpan: string = renderToString(span("x"));
const htmlFromNull: string = renderToString(null);
const htmlMany: string[] = renderManyToString([div("a"), span("b"), undefined]);
void htmlFromDiv; void htmlFromSpan; void htmlFromNull; void htmlMany;

// ─── Attributes: known keys are typed, unknown keys are allowed ──────────────

div({ id: "ok", title: "ok", tabIndex: 1 });
div({ "data-test": "ok", "aria-label": "ok" });
input({ value: "text", disabled: true, maxLength: 10 });
img({ src: "/x.png", alt: "pic" });

div({
  // @ts-expect-error id must be a string (or a string factory), not a number
  id: 123,
});

// @ts-expect-error disabled is boolean, not string
input({ disabled: "yes" });

// Reactive attribute values (zero-arity factories)
div({ id: () => "computed" });
input({ disabled: () => true, value: () => "v" });

div({
  // @ts-expect-error reactive id factory must return a string
  id: () => 123,
});

// Style objects: camelCase keys, string | number values, whole-object factory
div({ style: { backgroundColor: "red", paddingTop: 4, zIndex: 10 } });
div({ style: () => ({ color: "blue" }) });

// CSSStyleObject rejects members of CSSStyleDeclaration that are not settable
// string properties (methods, readonly length/parentRule, numeric index)
// @ts-expect-error methods are not style properties
const _styleBadMethod: CSSStyleObject = { setProperty: "nope" };
// @ts-expect-error readonly non-string members (length) are not settable
const _styleBadLength: CSSStyleObject = { length: 5 };
void _styleBadMethod; void _styleBadLength;

// ─── Factory helper types ────────────────────────────────────────────────────

type _Factory0 = Expect<Equal<InferFactoryResult<() => string>, string>>;
type _Factory1 = Expect<Equal<InferFactoryResult<(x: number) => boolean>, boolean>>;
type _FactoryNot = Expect<Equal<InferFactoryResult<number>, never>>;

// ─── Text content: primitives and reactive primitives ───────────────────────

div("text", 42, true, null, undefined);
div(() => "reactive", () => 42);
span(() => `count: ${1 + 1}`);

// ─── on(): event type inference from the event name ─────────────────────────

button(
  on("click", (e) => {
    type _Click = Expect<Equal<typeof e.clientX, number>>;
    // The element type flows in from the surrounding builder via the
    // contextual return type (NodeModLike<"button">), not just the default.
    const _target: HTMLButtonElement = e.currentTarget;
    void _target;
    e.preventDefault();
  }),
);

input(
  on("focus", function (this: HTMLElement, e) {
    const _value: string = e.currentTarget.value;
    void _value;
  }),
);

input(
  on("input", (e) => {
    type _IsInputEvent = Expect<Equal<typeof e.inputType, string>>;
    void e;
  }),
);

const _mediaEventModifier = on("encrypted", (e) => {
  type _Encrypted = Expect<Equal<
    typeof e,
    MediaEncryptedEvent & {
      currentTarget: HTMLAudioElement | HTMLVideoElement;
    }
  >>;
  void e.initData;
});
type _MediaEventModifier = Expect<Equal<
  typeof _mediaEventModifier,
  NodeModFn<"audio" | "video">
>>;

const _videoEventModifier = on("enterpictureinpicture", (e) => {
  type _PictureInPicture = Expect<Equal<
    typeof e,
    PictureInPictureEvent & { currentTarget: HTMLVideoElement }
  >>;
  void e.pictureInPictureWindow;
});
type _VideoEventModifier = Expect<Equal<typeof _videoEventModifier, NodeModFn<"video">>>;

const _bodyEventModifier = on("online", (e) => {
  type _Online = Expect<Equal<typeof e, Event & { currentTarget: HTMLBodyElement }>>;
  void e.currentTarget;
});
type _BodyEventModifier = Expect<Equal<typeof _bodyEventModifier, NodeModFn<"body">>>;

// @ts-expect-error encrypted is only available on audio and video elements
on<"encrypted", "div">("encrypted", () => undefined);

// @ts-expect-error picture-in-picture events are only available on video
on<"enterpictureinpicture", "audio">("enterpictureinpicture", () => undefined);

// Event attributes use camelCase and infer both the event and concrete element.
button({
  onClick(event) {
    type _ClickEvent = Expect<Equal<typeof event, PointerEvent & { currentTarget: HTMLButtonElement }>>;
    type _ThisElement = Expect<Equal<typeof this, HTMLButtonElement>>;
    const _target: HTMLButtonElement = event.currentTarget;
    void _target; void this.disabled;
  },
});

input({
  onInput(event) {
    type _InputEvent = Expect<Equal<typeof event, InputEvent & { currentTarget: HTMLInputElement }>>;
    const _value: string = event.currentTarget.value;
    void _value;
  },
  onChange(event) {
    type _ChangeEvent = Expect<Equal<typeof event, Event & { currentTarget: HTMLInputElement }>>;
    void event;
  },
});

div({
  onNucloReady(event) {
    type _CustomAttributeEvent = Expect<Equal<
      typeof event,
      CustomEvent<{ ready: boolean }> & { currentTarget: HTMLDivElement }
    >>;
    void event.detail.ready;
  },
});

div({
  onKeyDown(event) {
    type _KeyboardEvent = Expect<Equal<typeof event, KeyboardEvent & { currentTarget: HTMLDivElement }>>;
    void event.key;
  },
  onDoubleClick(event) {
    type _DoubleClickEvent = Expect<Equal<typeof event, MouseEvent & { currentTarget: HTMLDivElement }>>;
    void event.clientX;
  },
});

video({
  onEncrypted(event) {
    type _EncryptedEvent = Expect<Equal<typeof event, MediaEncryptedEvent & { currentTarget: HTMLVideoElement }>>;
    void event.initData;
  },
  onEnterPictureInPicture(event) {
    type _PictureInPictureEvent = Expect<Equal<typeof event, PictureInPictureEvent & { currentTarget: HTMLVideoElement }>>;
    void event.pictureInPictureWindow;
  },
});

body({
  onOnline(event) {
    type _OnlineEvent = Expect<Equal<typeof event, Event & { currentTarget: HTMLBodyElement }>>;
    void event.currentTarget;
  },
});

div({
  // @ts-expect-error encrypted is only available on media elements
  onEncrypted: () => undefined,
});

button({ onClick: () => undefined });

// @ts-expect-error lowercase DOM event attributes are replaced by onClick
button({
  onclick: () => undefined,
});

button({
  // @ts-expect-error event attributes only accept event handlers
  onClick: "not a handler",
});

button({
  // @ts-expect-error onClick receives a pointer event, not a keyboard event
  onClick: (_event: KeyboardEvent) => undefined,
});

// Custom events with an explicit event type
div(
  on<"app:ready", CustomEvent<{ ok: boolean }>>("app:ready", (e) => {
    type _Detail = Expect<Equal<typeof e.detail.ok, boolean>>;
    void e;
  }),
);

// ─── when(): chainable builder usable as content ─────────────────────────────

const flag = true;
div(
  when(() => flag, span("a"))
    .when(false, span("b"))
    .else(p("c")),
);

const _whenBuilder = when(true, "x");
type _WhenChain = Expect<Equal<ReturnType<typeof _whenBuilder.else>, WhenBuilder>>;

// Conditional content tags do not constrain the parent that hosts the block.
ul(when(true, div("Empty state")));

// ─── list(): item type flows into the renderer ───────────────────────────────

interface Todo { id: number; label: string }
const todos: Todo[] = [];

div(
  list(
    () => todos,
    (todo, _index) => {
      type _Item = Expect<Equal<typeof todo, Todo>>;
      type _Index = Expect<Equal<typeof _index, number>>;
      return li(todo.label);
    },
  ),
);

// Readonly arrays and arbitrary iterables are accepted
const frozen = ["a", "b"] as const;
div(list(() => frozen, (item) => span(item)));
div(list(() => new Set([1, 2]), (n) => span(n.toFixed(0))));

// ─── update() / scope() ──────────────────────────────────────────────────────

update();
update("sidebar");
update("sidebar", "header");
// @ts-expect-error scope ids are strings
update(42);

div(scope("my-scope"), "content");

// ─── SVG builders (global names carry an Svg suffix) ─────────────────────────

svgSvg(
  { viewBox: "0 0 24 24" },
  pathSvg({ d: "M0 0h24v24H0z", fill: "none" }),
  circleSvg({ cx: 12, cy: 12, r: 10 }),
);

export {};
