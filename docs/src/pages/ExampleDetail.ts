/**
 * /examples/:id - one example, rendered inside the frame the examples page
 * owns. The page returns its content for the outlet and an into() that puts
 * prev/next navigation in the frame's bar. Both leave with the page.
 */
import type { DataLoader, PageProps, RouteContext } from "nuclo-router";
import { router } from "../router.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { withCode } from "../components/inline-code.ts";
import { es } from "./examples/styles.ts";
import { ALL_EXAMPLES, findExample, type Example } from "./examples/registry.ts";
import { NAV_REGION } from "./Examples.ts";

// null means "no such example": the server answers with a 404 (see app-handler.ts).
export const load: DataLoader<Example | null> = (ctx) => findExample(ctx.params.id) ?? null;

function Chevron(dir: "left" | "right") {
  return svgSvg(
    { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d: dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6" }),
  );
}

function NavLink(target: Example | undefined, dir: "left" | "right") {
  const label = dir === "left" ? "Previous" : "Next";
  return a(
    es.navLink,
    target ? { href: router.href(`/examples/${target.id}`), "aria-label": `${label}: ${target.title}` } : { "aria-disabled": "true" },
    !target ? es.navLinkOff : null,
    ...(dir === "left" ? [Chevron("left"), span(target?.title ?? label)] : [span(target?.title ?? label), Chevron("right")]),
  );
}

/** Prev/next and position, placed in the frame's bar by the page below. */
function Nav(ex: Example, index: number) {
  return nav(
    es.nav,
    { "aria-label": "Examples navigation" },
    span(es.navCrumb, span("Examples"), span("/"), strong(ex.group)),
    NavLink(ALL_EXAMPLES[index - 1], "left"),
    span(es.navPos, `${String(index + 1).padStart(2, "0")} / ${ALL_EXAMPLES.length}`),
    NavLink(ALL_EXAMPLES[index + 1], "right"),
  );
}

// Keys and scroll lock live as long as the page: Esc closes, arrows step.
function dialogBehavior(index: number) {
  return on("mount", (el) => {
    const prev = ALL_EXAMPLES[index - 1];
    const next = index >= 0 ? ALL_EXAMPLES[index + 1] : undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") router.go("/examples");
      else if (e.key === "ArrowLeft" && prev) router.go(`/examples/${prev.id}`);
      else if (e.key === "ArrowRight" && next) router.go(`/examples/${next.id}`);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    el.parentElement?.scrollTo(0, 0);
    (el.querySelector("h2") as HTMLElement | null)?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = overflow;
    };
  });
}

export default function ExampleDetail(ctx: RouteContext, { data: ex }: PageProps<Example | null>) {
  if (!ex) {
    return div(
      es.notFound,
      dialogBehavior(-1),
      p(`There is no example called "${ctx.params.id}".`),
      p(a({ href: router.href("/examples") }, "Back to all examples")),
    );
  }

  const index = ALL_EXAMPLES.indexOf(ex);
  const file = `${ex.title.replace(/[^a-zA-Z0-9]+/g, "")}.ts`;

  return div(
    es.detail,
    dialogBehavior(index),
    into(NAV_REGION, Nav(ex, index)),
    header(
      es.detailHead,
      div(es.detailKicker, ex.group),
      h2(es.detailTitle, { tabindex: "-1" }, ex.title),
      p(es.detailDesc, ...withCode(ex.desc)),
      ex.docs ? a(es.detailDocs, { href: router.href(`/docs#${ex.docs}`) }, "Read the docs →") : null,
    ),
    div(
      es.panes,
      section(es.previewPane, div(es.paneLabel, "Preview"), div(es.previewBody, ex.preview())),
      section(es.codePane, CodeBlock({ filename: file, code: ex.code })),
    ),
  );
}
