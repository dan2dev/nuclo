/**
 * /examples - the grid of every example. A card opens its example as a layer
 * (see examples/open.ts), so the grid stays mounted beneath the modal. A direct
 * load of /examples/:id renders the example as this page's child route instead:
 * it lands in outlet() and sends its modal to the app's region the same way.
 */
import type { DataLoader, PageProps, RouteContext } from "nuclo-router";
import { applyLocale, loadLocale, type Locale } from "../i18n/index.ts";
import { s } from "../styles.ts";
import { withCode } from "../components/inline-code.ts";
import { es } from "./examples/styles.ts";
import { exampleGroups, examplesText, type Example, type ExampleGroup } from "./examples/registry.ts";
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
      span(ex.group, ex.install ? span(es.cardPkg, { title: examplesText().LABELS.needsPackage(ex.install) }, `+ ${ex.install}`) : null),
      span(es.cardArrow, { "data-arrow": "" }, ArrowIcon()),
    ),
  );
}

function Group(group: ExampleGroup, offset: number) {
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

export const load: DataLoader<Locale | null> = (ctx) => loadLocale(ctx.params);

export function ExamplesPage(_ctx: RouteContext, { outlet, data }: PageProps<Locale | null>) {
  applyLocale(data);
  const L = examplesText().LABELS;
  let offset = 0;
  const groups = exampleGroups().map((g) => {
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
        div(s.sectionLabel, L.examples),
        h1(s.sectionTitle, L.title),
        p(s.sectionSub, L.sub),
      ),
    ),
    ...groups,
    outlet(),
  );
}
