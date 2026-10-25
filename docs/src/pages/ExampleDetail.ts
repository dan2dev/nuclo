/**
 * /examples/:id - one example, shown in a modal over whatever page is beneath.
 *
 * Also served as /docs/example-:id, so an example opened from the docs keeps
 * the docs in the address bar. In the app it is opened with router.push()
 * (examples/open.ts), so it is a layer: the docs or the grid stay mounted under
 * it, and Back or close() walk history back to exactly where the reader was. On
 * a direct load it is the parent page's child route instead. Either way the
 * page fills the app's modal frame (examples/frame.ts) with into(), so the
 * frame is built once and only its content changes from example to example.
 */
import type { DataLoader, Layer, PageProps, RouteContext } from "nuclo-router";
import { href, router } from "../router.ts";
import { applyLocale, loadLocale, localeOf, t } from "../i18n/index.ts";
import { cx } from "../styles.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { withCode } from "../components/inline-code.ts";
import { es } from "./examples/styles.ts";
import { ALL_EXAMPLES, allExamples, examplesText, findExample, type Example } from "./examples/registry.ts";
import { EXAMPLE_PREFIX, exampleHref, type ExampleSource } from "./examples/open.ts";
import { BAR_REGION, BODY_REGION } from "./examples/frame.ts";

/** Which parent the route sits under, from its pattern. */
const sourceOf = (ctx: RouteContext): ExampleSource => (ctx.pattern.includes("/docs") ? "docs" : "examples");

// Filenames belong to the source, not its translated display title.
const filenameOf = (ex: Example) =>
  `${(ALL_EXAMPLES.find((source) => source.id === ex.id)?.title ?? ex.id).replace(/[^a-zA-Z0-9]+/g, "")}.ts`;

/** The example id of either URL shape; null for /docs/<anything else>. */
function idOf(ctx: RouteContext): string | null {
  if (sourceOf(ctx) === "examples") return ctx.params.id;
  const seg = ctx.params.example;
  return seg.startsWith(EXAMPLE_PREFIX) ? seg.slice(EXAMPLE_PREFIX.length) : null;
}

// null means "no such example" (or no such locale): the server answers with a 404 (see app-handler.ts).
export const load: DataLoader<Example | null> = async (ctx) => {
  const locale = await loadLocale(ctx.params);
  if (locale === null) return null;
  applyLocale(locale); // findExample() reads the locale's titles
  const id = idOf(ctx);
  return (id ? findExample(id) : undefined) ?? null;
};

/** The first layer of examples, so a deeper one can close the whole stack at once. */
let firstLayer: Layer | undefined;

/** Closes every open example: back to the page beneath, or to the parent page on a direct load. */
function closeExamples(layer: Layer, from: ExampleSource) {
  if (layer.depth > 0) firstLayer?.close();
  else void router.go(href(from === "docs" ? "/docs" : "/examples"));
}

/** Prev/next: another layer when stacked (Back steps through them), a sibling route on a direct load. */
function stepTo(layer: Layer, from: ExampleSource, id: string) {
  if (layer.depth > 0) void layer.push(exampleHref(id, from));
  else void router.go(exampleHref(id, from));
}

/** The topmost example owns the keyboard: lower layers keep their modals but stay quiet. */
const isTop = (layer: Layer) => layer.depth === router.depth - 1;

let locks = 0;
function lockScroll() {
  if (locks++ === 0) document.documentElement.style.overflow = "hidden";
  return () => { if (--locks === 0) document.documentElement.style.overflow = ""; };
}

/**
 * Opens the example on StackBlitz as a project that runs. The code that builds the project, with the sources
 * it ships, is loaded when the button is clicked, never before. A fragment with no component to render
 * (css's createCss, router-match) gets no button; examples/stackblitz.ts applies the same rule.
 */
const StackBlitz = (ex: Example) =>
  ex.files || /^(?:export )?(?:function|const) [A-Z]/m.test(ex.code)
    ? button(es.standaloneLaunch, { type: "button", title: examplesText().LABELS.openInStackBlitzTitle(ex.title), onClick: () => void import("./examples/stackblitz.ts").then((m) => m.openExampleInStackBlitz(ex)) }, examplesText().LABELS.openInStackBlitz)
    : null;

function Icon(d: string) {
  return svgSvg(
    { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d }),
  );
}

/** A fixed-size icon button; the neighbor's title is its tooltip, so the pager never changes width. */
function PagerButton(layer: Layer, from: ExampleSource, target: Example | undefined, dir: "left" | "right") {
  const L = examplesText().LABELS;
  const label = dir === "left" ? L.previous : L.next;
  return a(
    es.pagerBtn,
    target
      ? { href: exampleHref(target.id), "aria-label": `${label}: ${target.title}`, title: `${label}: ${target.title}`, onClick: (e: MouseEvent) => { e.preventDefault(); stepTo(layer, from, target.id); } }
      : { "aria-disabled": "true", "aria-label": label },
    !target ? es.pagerBtnOff : null,
    Icon(dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"),
  );
}

function Nav(layer: Layer, from: ExampleSource, ex: Example, index: number) {
  const all = allExamples();
  return nav(
    es.nav,
    { "aria-label": examplesText().LABELS.examplesNavigation },
    div(
      es.pager,
      PagerButton(layer, from, all[index - 1], "left"),
      span(es.navPos, `${String(index + 1).padStart(2, "0")} / ${all.length}`),
      PagerButton(layer, from, all[index + 1], "right"),
    ),
    span(es.navCrumb, span(es.navCrumbPath, span(examplesText().LABELS.examples), span("/"), span(ex.group), span("/")), strong(ex.title)),
  );
}

// Keys and the scroll lock live as long as the modal: Esc closes, arrows step.
function dialogBehavior(layer: Layer, from: ExampleSource, index: number) {
  return on("mount", (el) => {
    if (layer.depth === 1) firstLayer = layer;
    const all = allExamples();
    const prev = index > 0 ? all[index - 1] : undefined;
    const next = index >= 0 ? all[index + 1] : undefined;
    const onKey = (e: KeyboardEvent) => {
      if (!isTop(layer) || e.defaultPrevented || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "Escape") closeExamples(layer, from);
      else if (e.key === "ArrowLeft" && prev) stepTo(layer, from, prev.id);
      else if (e.key === "ArrowRight" && next) stepTo(layer, from, next.id);
    };
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    el.parentElement?.scrollTo(0, 0); // the frame's body keeps its scroll between examples
    (el.querySelector("h2") as HTMLElement | null)?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  });
}

/** Fills the frame: the bar gets the nav and the close button, the body gets the example. */
function fillFrame(layer: Layer, from: ExampleSource, index: number, bar: NodeModLike, body: NodeModLike, fill = false) {
  const close = a(
    es.close,
    { href: href(from === "docs" ? "/docs" : "/examples"), "aria-label": examplesText().LABELS.closeExample, title: examplesText().LABELS.closeEsc, onClick: (e: MouseEvent) => { e.preventDefault(); closeExamples(layer, from); } },
    Icon("M6 6l12 12 M18 6L6 18"),
  );
  return into({
    [BAR_REGION]: [bar, close],
    [BODY_REGION]: div(fill ? es.appFill : null, dialogBehavior(layer, from, index), body),
  });
}

/**
 * The "app" layout: the preview fills the modal and every source file is a
 * tab beside it. The panes are built once and toggled, so switching to a file
 * and back finds the app exactly as it was left.
 */
function AppLayout(ex: Example) {
  const L = examplesText().LABELS;
  const files = ex.files ?? [{ name: filenameOf(ex), code: ex.code }];
  let active = 0; // 0 is the preview, then one per file
  let moreDesc = false; // phones: the full description, instead of its first lines

  const Tab = (name: string, i: number) =>
    button(
      { role: "tab", class: () => cx(es.appTab, i === active ? es.appTabActive : null).className, "aria-selected": () => String(i === active) },
      name,
      { onClick: () => { active = i; update(); } },
    );
  const Pane = (i: number, style: StyleResult, content: NodeModLike<"div">) =>
    div({ role: "tabpanel", class: () => cx(es.appPane, style, i === active ? es.appPaneShow : null).className }, content);

  return div(
    es.app,
    header(
      es.appHead,
      h2(es.appTitle, { tabindex: "-1" }, ex.title),
      p({ class: () => cx(es.appDesc, moreDesc ? null : es.appDescClamp).className }, ...withCode(ex.desc)),
      button(es.appMore, { type: "button", "aria-expanded": () => String(moreDesc), onClick: () => { moreDesc = !moreDesc; update(); } }, () => (moreDesc ? L.less : L.more)),
      div(
        es.appLinks,
        a(es.standaloneLaunch, { href: router.href(`/apps/${ex.id}`), target: "_blank", rel: "noopener", title: L.openInNewTab(ex.title), "aria-label": L.openStandaloneInNewTab(ex.title) }, L.openInStandalone, Icon("M14 3h7v7 M21 3l-9 9 M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5")),
        StackBlitz(ex),
        ex.docs ? a(es.appDocs, { href: href(`/docs#${ex.docs}`) }, t.common.readTheDocs) : null,
      ),
    ),
    div(es.appTabs, { role: "tablist" }, Tab(t.common.preview, 0), ...files.map((f, i) => Tab(f.name, i + 1))),
    Pane(0, es.appPreview, ex.preview()),
    ...files.map((f, i) => Pane(i + 1, es.appCode, CodeBlock({ code: f.code }))),
  );
}

export default function ExampleDetail(ctx: RouteContext, { data, layer }: PageProps<Example | null>) {
  const from = sourceOf(ctx);
  applyLocale(localeOf(ctx.params));
  const L = examplesText().LABELS;
  // The loaded example, in the current locale: data was resolved when the route was entered.
  const ex = data && findExample(data.id);
  if (!ex) {
    return fillFrame(layer, from, -1, span(), div(
      es.notFound,
      h2(es.detailTitle, { tabindex: "-1" }, L.notFound),
      p(L.noExampleCalled(idOf(ctx) ?? ctx.params.example)),
      p(a({ href: href("/examples") }, L.allExamples)),
    ));
  }

  const index = allExamples().findIndex((e) => e.id === ex.id);
  if (ex.layout === "app") return fillFrame(layer, from, index, Nav(layer, from, ex, index), AppLayout(ex), true);
  const file = filenameOf(ex);

  return fillFrame(layer, from, index, Nav(layer, from, ex, index), div(
    es.detail,
    header(
      es.detailHead,
      div(es.detailKicker, ex.group),
      h2(es.detailTitle, { tabindex: "-1" }, ex.title),
      p(es.detailDesc, ...withCode(ex.desc)),
      ex.install
        ? div(es.installNote, { role: "note" }, strong(L.separatePackage), span(code(ex.install), L.mustBeInstalled), code(`npm install nuclo ${ex.install}`))
        : null,
      div(es.detailLinks, StackBlitz(ex), ex.docs ? a(es.appDocs, { href: href(`/docs#${ex.docs}`) }, t.common.readTheDocs) : null),
    ),
    div(
      es.panes,
      section(es.previewPane, div(es.paneLabel, t.common.preview), div(es.previewBody, ex.preview())),
      section(es.codePane, CodeBlock({ filename: file, code: ex.code, files: ex.files })),
    ),
  ));
}
