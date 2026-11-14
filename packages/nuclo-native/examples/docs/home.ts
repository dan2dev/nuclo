// The docs site's home page: hero, a live counter, the update() pipeline, philosophy, features,
// the comparison, the benchmark and the quick start, with the site's text.
import { c, card, codeBlock, columns, css, data, grid, heading, kicker, page, para, pill, txt } from "./ui";

const h = data.home;
const L = h.labels;

// The hero grows with the window, as the site's does.
const heroTitle = css({ color: c.text, fontSize: 36, fontWeight: "bold", medium: { fontSize: 48 }, large: { fontSize: 56 } });
const grow = css({ large: { flexGrow: 1, flexBasis: 0, minWidth: 0 } });
const aside = css({ large: { width: 460, flexShrink: 0 } });

/** A hero title line; the *marked* word gets the site's highlight behind it. */
const titleLine = (line: string) =>
  div(
    { style: { flexDirection: "row", flexWrap: "wrap" } },
    ...line.split(/(\*[^*]+\*)/).filter(Boolean).map((part) =>
      part.startsWith("*")
        ? span(heroTitle, { style: { backgroundColor: c.primaryMark, borderRadius: 8, paddingLeft: 6, paddingRight: 6 } }, part.slice(1, -1))
        : span(heroTitle, { style: { flexShrink: 1 } }, part.replace(/^ | $/g, "\u00a0")),
    ),
  );

const install = () =>
  div(
    { style: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: c.secondary, borderRadius: 14, padding: 14, alignSelf: "flex-start" } },
    txt("$", { color: c.muted, fontSize: 14 }),
    txt(h.install, { fontSize: 14 }),
  );

const Hero = (go: (path: string) => void) =>
  div(
    { style: { backgroundColor: c.card, borderRadius: 28, padding: 24, paddingTop: 32, paddingBottom: 32, gap: 18 } },
    div(
      { style: { flexDirection: "row", gap: 8, alignItems: "center", alignSelf: "flex-start", backgroundColor: c.primarySoft, borderRadius: 9999, paddingLeft: 12, paddingRight: 12, height: 30 } },
      div({ style: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary } }),
      txt(h.badge, { color: c.primaryInk, fontSize: 12, fontWeight: "bold" }),
    ),
    div({}, ...h.titleLines.map(titleLine)),
    para(h.desc, { fontSize: 17 }),
    install(),
    div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 10 } }, pill(L.getStarted, () => go("/docs"), true), pill(L.readTheDocs, () => go("/docs/overview"))),
    div(
      { style: { flexDirection: "row", flexWrap: "wrap", gap: 24, paddingTop: 18, borderTopWidth: 1, borderColor: c.border } },
      ...h.stats.map((stat) =>
        div(
          { style: { gap: 2 } },
          txt(stat.num + stat.sup, { fontSize: 28, fontWeight: "bold" }),
          txt(stat.label, { color: c.muted, fontSize: 13 }),
        ),
      ),
    ),
  );

// The hero card's counter teaser, live: these taps run nuclo's update() on the native widgets.
let count = 0;
const counterButton = (label: string, onClick: () => void) =>
  div(
    { style: { backgroundColor: c.secondary, borderRadius: 10, height: 40, minWidth: 48, paddingLeft: 14, paddingRight: 14, alignItems: "center", justifyContent: "center" }, onClick: () => { onClick(); update(); } },
    txt(label, { fontWeight: "bold" }),
  );

const Counter = () =>
  card(
    { gap: 14 },
    kicker("Live", "Counter.ts, running on this screen"),
    codeBlock("Counter.ts", h.counter),
    div(
      { style: { flexDirection: "row", gap: 8, alignItems: "center" } },
      txt(() => String(count), { fontSize: 32, fontWeight: "bold", minWidth: 64, color: c.primaryInk }),
      counterButton("-", () => count--),
      counterButton(L.reset, () => (count = 0)),
      counterButton("+", () => count++),
    ),
  );

const Pipeline = () =>
  div(
    {},
    heading(L.howItWorks, L.pipelineTitle, L.pipelineSub),
    grid(
      220,
      ...h.pipeline.map((step) =>
        card(
          { flexGrow: 1 },
          kicker(step.kicker),
          txt(step.title, { fontSize: 17, fontWeight: "bold" }),
          para(step.desc, { fontSize: 15 }),
          codeBlock("", step.code),
        ),
      ),
    ),
  );

const Philosophy = () =>
  div(
    { style: { gap: 16 } },
    heading(L.philosophy, ""),
    div(
      { style: { borderLeftWidth: 3, borderColor: c.primary, paddingLeft: 16, marginTop: -12 } },
      txt(`“${h.quote}”`, { fontSize: 22, fontWeight: "bold" }),
    ),
    ...h.philosophy.map((point) =>
      div(
        { style: { flexDirection: "row", gap: 16, paddingTop: 16, borderTopWidth: 1, borderColor: c.border } },
        txt(point.num, { color: c.primaryInk, fontSize: 15, fontWeight: "bold", width: 28 }),
        div({ style: { flex: 1, gap: 6 } }, txt(point.title, { fontSize: 17, fontWeight: "bold" }), para(point.desc)),
      ),
    ),
  );

const Features = () =>
  div(
    {},
    heading(L.features, L.featuresTitle, L.featuresSub),
    grid(
      240,
      ...h.features.map((feature) =>
        card({ flexGrow: 1 }, kicker(feature.num), txt(feature.title, { fontSize: 17, fontWeight: "bold" }), para(feature.desc)),
      ),
    ),
  );

const Comparison = () =>
  div(
    {},
    heading(L.comparison, h.comparison.title, h.comparison.sub),
    grid(
      220,
      ...h.comparison.cols.map((col) =>
        card(
          { flexGrow: 1, ...(col.featured ? { borderColor: c.primaryBorder, backgroundColor: c.primarySoft } : {}) },
          div(
            { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" } },
            txt(col.name, { fontSize: 17, fontWeight: "bold" }),
            col.featured ? txt(L.theNucloWay, { color: c.primaryInk, fontSize: 12, fontWeight: "bold" }) : null,
          ),
          txt(col.sub, { color: c.muted, fontSize: 13 }),
          ...col.items.map((item) =>
            div(
              { style: { flexDirection: "row", gap: 10 } },
              txt(item.good ? "✓" : "✕", { color: item.good ? c.primaryInk : c.muted, fontWeight: "bold", width: 14 }),
              para(item.text, { flex: 1, fontSize: 14 }),
            ),
          ),
        ),
      ),
    ),
  );

const Benchmark = () => {
  const b = h.benchmark;
  const max = Math.max(...b.entries.map((e) => e.score));
  return div(
    {},
    heading(L.benchmarks, b.title, b.sub),
    card(
      { gap: 12 },
      div(
        { style: { flexDirection: "row", justifyContent: "space-between" } },
        txt(b.source, { color: c.muted, fontSize: 13 }),
        txt(L.lowerIsBetter, { color: c.muted, fontSize: 13 }),
      ),
      ...b.entries.map((entry) =>
        div(
          { style: { gap: 4 } },
          div(
            { style: { flexDirection: "row", justifyContent: "space-between" } },
            txt(`${entry.name} ${entry.version}`, { fontSize: 14, fontWeight: entry.featured ? "bold" : "normal", color: entry.featured ? c.primaryInk : c.text }),
            txt(entry.score.toFixed(2), { fontSize: 14, fontWeight: "bold", color: entry.featured ? c.primaryInk : c.dim }),
          ),
          div(
            { style: { height: 8, borderRadius: 4, backgroundColor: c.light } },
            div({ style: { height: 8, borderRadius: 4, width: `${(entry.score / max) * 100}%`, backgroundColor: entry.featured ? c.primary : c.borderLight } }),
          ),
        ),
      ),
      para(b.note, { fontSize: 13, color: c.muted }),
    ),
  );
};

const QuickStart = (go: (path: string) => void) =>
  div(
    { style: { gap: 12 } },
    heading(L.quickStart, h.cta.title, h.cta.sub),
    ...h.cta.steps.map((step) =>
      card({}, kicker(step.num), txt(step.title, { fontSize: 17, fontWeight: "bold" }), para(step.desc), codeBlock(step.lang, step.code)),
    ),
    div({ style: { alignItems: "flex-start" } }, pill(L.readFullDocs, () => go("/docs"), true)),
  );

const Footer = () =>
  div(
    { style: { paddingTop: 24, borderTopWidth: 1, borderColor: c.border, flexDirection: "row", justifyContent: "space-between" } },
    txt("nuclo", { fontSize: 20, fontWeight: "bold" }),
    txt(`v${data.version} · MIT`, { color: c.muted, fontSize: 13 }),
  );

export const Home = (go: (path: string) => void) => () =>
  page(div(columns("large", 20), div(grow, Hero(go)), div(aside, Counter())), Pipeline(), Philosophy(), Features(), Comparison(), Benchmark(), QuickStart(go), Footer());
