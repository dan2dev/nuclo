/**
 * /examples - the grid of every example, and the modal frame an open example
 * renders in. /examples/:id is a child route: it lands in router.outlet() inside
 * the frame, so opening one never rebuilds the grid. The frame's bar holds a
 * region the open example fills with into('example-nav', …).
 */
import type { PageProps, RouteContext } from "nuclo-router";
import { cx, s } from "../styles.ts";
import { router } from "../router.ts";
import { withCode } from "../components/inline-code.ts";
import { es } from "./examples/styles.ts";
import { EXAMPLE_GROUPS, type Example } from "./examples/registry.ts";

export const NAV_REGION = "example-nav";

function CloseIcon() {
  return svgSvg(
    { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "aria-hidden": "true" },
    pathSvg({ d: "M6 6l12 12 M18 6L6 18" }),
  );
}

function ArrowIcon() {
  return svgSvg(
    { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d: "M5 12h14 M13 6l6 6-6 6" }),
  );
}

function Card(ex: Example, index: number) {
  return a(
    es.card,
    { href: router.href(`/examples/${ex.id}`), style: { animationDelay: `${Math.min(index, 8) * 40}ms` } },
    span(es.cardNum, String(index + 1).padStart(2, "0")),
    h3(es.cardTitle, ex.title),
    p(es.cardDesc, ...withCode(ex.desc)),
    div(es.cardFoot, span(ex.group), span(es.cardArrow, { "data-arrow": "" }, ArrowIcon())),
  );
}

function Group(group: (typeof EXAMPLE_GROUPS)[number], offset: number) {
  return section(
    es.group,
    div(
      s.container,
      div(es.groupHead, h2(es.groupTitle, group.title), span(es.groupCount, `${group.examples.length}`)),
      p(es.groupSub, group.sub),
      div(es.grid, ...group.examples.map((ex, i) => Card(ex, offset + i))),
    ),
  );
}

const isOpen = () => router.pattern.startsWith("/examples/");

export function ExamplesPage(_ctx: RouteContext, { outlet }: PageProps) {
  let offset = 0;
  const groups = EXAMPLE_GROUPS.map((g) => {
    const node = Group(g, offset);
    offset += g.examples.length;
    return node;
  });

  return div(
    { id: "examples-page" },
    div(
      es.header,
      div(
        s.container,
        div(s.sectionLabel, "Examples"),
        h1(s.sectionTitle, "Practical examples. Live demos."),
        p(s.sectionSub, "Pick an example to open it full screen, with the live preview and its source side by side."),
      ),
    ),
    ...groups,
    // The frame: shown while a child route is active. The open example renders in the
    // outlet and fills the bar's region with its own navigation.
    div(
      es.overlay,
      { className: () => cx(es.overlay, isOpen() ? es.overlayOpen : null).className, "aria-hidden": () => String(!isOpen()) },
      div(
        es.panel,
        { role: "dialog", "aria-modal": "true", "aria-label": "Example" },
        div(
          es.bar,
          region({ id: NAV_REGION }),
          a(es.close, { href: router.href("/examples"), "aria-label": "Close example", title: "Close (Esc)" }, CloseIcon()),
        ),
        div(es.body, outlet()),
      ),
    ),
  );
}
