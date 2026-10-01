/// <reference path="../types/index.d.ts" />
/**
 * Type-level scenario tests — compiled by `npm run typecheck`
 * (tsconfig.typecheck.json). No runtime assertions: a wrong inference either
 * fails to compile directly or trips an `Expect<Equal<...>>` /
 * `@ts-expect-error` probe.
 *
 * Where the other type-inference files cover one API at a time, this one
 * covers what the pieces infer when they are combined the way apps combine
 * them: component functions, nested list()/when(), reactive resolvers reading
 * item state, forceUpdate(), and the SSR entry points.
 */
import "../src";
import { render, hydrate, forceUpdate } from "../src/render";
import { renderToString, renderManyToString } from "../src/ssr/render-to-string";
import { on } from "../src/element/events";
import { when } from "../src/when";
import { list } from "../src/list";
import { scope } from "../src/update/scope";
import { css, cx, variants } from "../src/style";

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

// ─── Component functions keep their root tag through render/hydrate/forceUpdate ─

const Page = () => main(h1("Title"), p("Body"));
type _PageBuilds = Expect<Equal<ReturnType<typeof Page>, DetachedExpandedElementFactory<"main">>>;

const renderedPage = render(Page, document.body);
type _RenderedPage = Expect<Equal<typeof renderedPage, ExpandedElement<"main">>>;

const hydratedPage = hydrate(Page, document.body);
type _HydratedPage = Expect<Equal<typeof hydratedPage, ExpandedElement<"main">>>;

// The bare form refreshes every component root and returns nothing…
const bare = forceUpdate();
type _Bare = Expect<Equal<typeof bare, void>>;

// …the explicit form returns the rebuilt root, for a tree or a component.
const forcedTree = forceUpdate(Page(), document.body);
type _ForcedTree = Expect<Equal<typeof forcedTree, ExpandedElement<"main">>>;
const forcedComponent = forceUpdate(Page);
type _ForcedComponent = Expect<Equal<typeof forcedComponent, ExpandedElement<"main">>>;

// @ts-expect-error a parent must be an Element, not a selector string
forceUpdate(Page, "#app");

// @ts-expect-error a string is not a renderable root
render("text", document.body);

// The rendered element is a real, typed element.
renderedPage.tagName satisfies string;
const linkEl = render(a({ href: "/docs" }, "Docs"));
type _LinkHref = Expect<Equal<typeof linkEl.href, string | undefined>>;
type _LinkTag = Expect<Equal<typeof linkEl.tagName, string>>;

// ─── list(): item and index inference in nested structures ───────────────────

interface Task {
  readonly id: number;
  title: string;
  done: boolean;
  tags: readonly string[];
  subtasks: Task[];
}
declare const tasks: Task[];

const TaskRow = (task: Task, depth: number): DetachedExpandedElementFactory<"li"> =>
  li(
    { className: () => (task.done ? "done" : "open"), "data-depth": String(depth) },
    input({
      type: "checkbox",
      checked: () => task.done,
      onChange(event) {
        type _Event = Expect<Equal<typeof event, Event & { currentTarget: HTMLInputElement }>>;
        task.done = event.currentTarget.checked;
      },
    }),
    span(() => task.title),
    // A list of primitives inside the row: item is the element type of the
    // readonly array, index is a number.
    list(
      () => task.tags,
      (tag, index) => {
        type _Tag = Expect<Equal<typeof tag, string>>;
        type _Index = Expect<Equal<typeof index, number>>;
        return small(`#${tag}`);
      },
    ),
    // Recursion: the nested provider's item type is Task again.
    when(
      () => task.subtasks.length > 0,
      ul(list(() => task.subtasks, (sub) => {
        type _Sub = Expect<Equal<typeof sub, Task>>;
        return TaskRow(sub, depth + 1);
      })),
    ),
  );

ul(list(() => tasks, (task, index) => TaskRow(task, index)));

// Providers may return any iterable: Set, Map values, typed arrays, tuples.
declare const idSet: Set<number>;
declare const byName: Map<string, Task>;
declare const pairs: ReadonlyArray<readonly [string, number]>;
div(list(() => idSet, (id) => { type _Id = Expect<Equal<typeof id, number>>; return span(String(id)); }));
div(list(() => byName.values(), (task) => { type _T = Expect<Equal<typeof task, Task>>; return span(task.title); }));
div(list(() => pairs, ([label, count]) => {
  type _Label = Expect<Equal<typeof label, string>>;
  type _Count = Expect<Equal<typeof count, number>>;
  return span(label, ": ", count);
}));
div(list(() => new Uint8Array(4), (byte) => { type _Byte = Expect<Equal<typeof byte, number>>; return b(byte); }));

// Union item types narrow inside the renderer.
type Shape = { kind: "circle"; r: number } | { kind: "rect"; w: number; h: number };
declare const shapes: Shape[];
svgSvg(
  list(() => shapes, (shape) =>
    shape.kind === "circle"
      ? circleSvg({ r: String(shape.r) })
      : rectSvg({ width: String(shape.w), height: String(shape.h) })),
);

// @ts-expect-error the provider must be a function, not the array itself
div(list(tasks, (task) => li(task.title)));

div(
  list(
    () => tasks,
    // @ts-expect-error the renderer receives a Task, which has no `name`
    (task) => li(task.name),
  ),
);

// ─── when(): conditions and content in context ───────────────────────────────

declare const session: { user: { name: string; admin: boolean } | null; loading: boolean };

const header_ = header(
  when(() => session.loading, span("Loading…"))
    .when(() => session.user !== null, strong(() => session.user?.name ?? ""), when(() => session.user?.admin === true, em("admin")))
    .else(a({ href: "/login" }, "Sign in")),
);
type _Header = Expect<Equal<typeof header_, DetachedExpandedElementFactory<"header">>>;

// A when() builder is content for any parent — HTML or SVG — and for list rows.
const badge = when(() => session.user !== null, "●");
div(badge);
td(badge);
gSvg(when(() => session.loading, circleSvg({ r: "2" })));

// @ts-expect-error a nullable value is not a boolean condition
when(session.user, span("x"));

// @ts-expect-error a condition is required
when();

// @ts-expect-error a builder chains with .when()/.else(), there is no .otherwise()
when(true, "a").otherwise("b");

// ─── Reactive attribute resolvers are checked against the property type ─────

button({ disabled: () => session.loading, title: () => session.user?.name ?? "" }, "Save");
input({ value: () => session.user?.name ?? "", maxLength: () => 10 });
progress({ value: () => 0.5, max: 1 });

// @ts-expect-error disabled is a boolean property
button({ disabled: () => "yes" });

// @ts-expect-error maxLength is a number
input({ maxLength: "10" });

// style accepts an object or a resolver returning one; values are strings or numbers.
div({ style: { color: "red", opacity: 0.5 } });
div({ style: () => ({ display: session.loading ? "none" : "block" }) });

// @ts-expect-error not a CSS property
div({ style: { colour: "red" } });

// Custom and data-/aria- attributes stay open, with resolvers.
div({ "data-state": () => (session.loading ? "busy" : "idle"), "aria-busy": () => String(session.loading), role: "status" });

// ─── Events and lifecycle hooks infer their element from context ─────────────

select(
  on("change", (event) => {
    type _Change = Expect<Equal<typeof event, Event & { currentTarget: HTMLSelectElement }>>;
    void event.currentTarget.selectedIndex;
  }),
  option({ value: "a" }, "A"),
);

video(
  on("timeupdate", (event) => {
    type _Video = Expect<Equal<typeof event, Event & { currentTarget: HTMLVideoElement }>>;
    void event.currentTarget.videoWidth;
  }),
);

canvas({
  onMount(el) {
    type _Canvas = Expect<Equal<typeof el, HTMLCanvasElement>>;
    const context = el.getContext("2d");
    return () => { void context; };
  },
  onDestroy(el) {
    type _Canvas2 = Expect<Equal<typeof el, HTMLCanvasElement>>;
  },
});

// on("mount"/"destroy") pick the element type up from the builder they are passed to.
dialog(
  on("mount", (el) => {
    type _Dialog = Expect<Equal<typeof el, HTMLDialogElement>>;
    el.showModal();
  }),
  on("destroy", (el) => { el.close(); }),
);
input(on("mount", (el) => { el.value satisfies string; el.focus(); }));

// Outside a builder there is no context: the element is any HTML element.
const detachedHook = on("mount", (el) => {
  type _AnyElement = Expect<Equal<typeof el, HTMLElementTagNameMap[ElementTagName]>>;
});
type _DetachedHook = Expect<Equal<typeof detachedHook, NodeModFn<ElementTagName>>>;

// Listener options are the native ones.
div(on("scroll", () => {}, { passive: true, capture: true }), on("click", () => {}, true));

// @ts-expect-error not an AddEventListenerOptions key
div(on("click", () => {}, { passiv: true }));

// @ts-expect-error a mount callback may only return a cleanup function (or nothing)
div({ onMount: () => 42 });

// ─── scope() + styling inside builders ───────────────────────────────────────

const card = css({ p: 16, rounded: 8, hover: { shadow: "0 1px 2px #0003" } });
const active = css({ bg: "#eef" });
const pill = variants({
  base: { px: 8, rounded: 999 },
  variants: { tone: { info: { bg: "#def" }, warn: { bg: "#fed" } }, solid: { true: { weight: 700 } } },
  defaultVariants: { tone: "info" },
});

article(
  scope("card", "sidebar"),
  card,
  () => cx(card, session.loading && active),
  span(pill({ tone: "warn", solid: true }), "new"),
  footer({ className: () => cx(card, active).className }),
);

// @ts-expect-error "danger" is not a declared tone
pill({ tone: "danger" });

// @ts-expect-error scope ids are strings
scope(1);

// ─── SSR entry points accept trees, components and nodes ─────────────────────

const html: string = renderToString(Page);
const htmlTree: string = renderToString(Page());
const htmlNode: string = renderToString(document.createElement("div"));
const htmlNone: string = renderToString(null);
const many: string[] = renderManyToString([Page, Page(), null, undefined]);
void [html, htmlTree, htmlNode, htmlNone, many];

// @ts-expect-error a plain string is not renderable
renderToString("<div></div>");

export {};
