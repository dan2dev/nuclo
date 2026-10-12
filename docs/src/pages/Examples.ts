/**
 * /examples - the grid of every example. A card opens its example as a layer
 * (see examples/open.ts), so the grid stays mounted beneath the modal. A direct
 * load of /examples/:id renders the example as this page's child route instead:
 * it lands in outlet() and sends its modal to the app's region the same way.
 */
import type { PageProps, RouteContext } from "nuclo-router";
import { s } from "../styles.ts";
import { withCode } from "../components/inline-code.ts";
import { es } from "./examples/styles.ts";
import { EXAMPLE_GROUPS, type Example } from "./examples/registry.ts";
import { exampleHref, onOpenExample } from "./examples/open.ts";

function ArrowIcon() {
  return svgSvg(
    { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d: "M5 12h14 M13 6l6 6-6 6" }),
  );
}

function Card(ex: Example, index: number) {
  return a(
    es.card,
    { href: exampleHref(ex.id), style: { animationDelay: `${Math.min(index, 8) * 40}ms` }, onClick: onOpenExample(ex.id) },
    span(es.cardNum, String(index + 1).padStart(2, "0")),
    h3(es.cardTitle, ex.title),
    p(es.cardDesc, ...withCode(ex.desc)),
    div(
      es.cardFoot,
      span(ex.group, ex.install ? span(es.cardPkg, { title: `Needs the ${ex.install} package` }, `+ ${ex.install}`) : null),
      span(es.cardArrow, { "data-arrow": "" }, ArrowIcon()),
    ),
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
    outlet(),
  );
}
