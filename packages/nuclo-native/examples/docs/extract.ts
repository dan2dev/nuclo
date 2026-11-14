// Regenerates content.json from the docs site's English text (docs/src/i18n/en), so this app
// shows the same documentation: `bun --tsconfig-override ../../docs/tsconfig.bun.json examples/docs/extract.ts`.
// The docs write their text as a small HTML subset; it becomes plain blocks the native app renders.
import "nuclo/polyfill";
import "nuclo";
import { DOC_SECTIONS } from "../../../../docs/src/pages/docs/content.ts";
import * as home from "../../../../docs/src/i18n/en/home.ts";
import { LABELS } from "../../../../docs/src/i18n/en/docs.ts";
import { NUCLO_GZIP_KB, NUCLO_VERSION } from "../../../../docs/src/generated/nuclo-stats.ts";
import { exampleGroups } from "../../../../docs/src/pages/examples/registry.ts";
import * as examples from "../../../../docs/src/i18n/en/examples.ts";
import { addRun, highlight, type Line } from "./highlight.ts";

type Block =
  | { t: "p" | "h3" | "callout"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "code"; file: string; lines: Line[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "live"; id: string };

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const text = (html: string) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const all = (html: string, tag: string) => [...html.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))].map((m) => m[1]);

/** Highlighted HTML (`<span class="kw">…</span>`) to lines of runs. */
function lines(html: string): Line[] {
  const runs: [string, string][] = [];
  for (const m of html.matchAll(/<span class="(\w+)">([\s\S]*?)<\/span>|([^<]+)/g)) {
    if (m[3] !== undefined || m[2] !== undefined) runs.push([m[1] ?? "", decode(m[2] ?? m[3])]);
  }
  const out: Line[] = [[]];
  for (const [cls, value] of runs) {
    value.split("\n").forEach((part, i) => {
      if (i) out.push([]);
      if (part) addRun(out.at(-1)!, cls, part);
    });
  }
  return out;
}

/** The top-level elements of a section's HTML, in order. */
function blocks(html: string): Block[] {
  const out: Block[] = [];
  const open = /<(p|h1|h3|ul|ol|table|div)( class="([^"]+)")?>/g;
  let m: RegExpExecArray | null;
  while ((m = open.exec(html))) {
    const tag = m[1];
    // The matching close tag, counting nested ones of the same name.
    const tags = new RegExp(`<${tag}[ >]|</${tag}>`, "g");
    tags.lastIndex = open.lastIndex;
    let depth = 1;
    let end = html.length;
    let t: RegExpExecArray | null;
    while ((t = tags.exec(html))) {
      depth += t[0].startsWith("</") ? -1 : 1;
      if (!depth) { end = t.index; break; }
    }
    const inner = html.slice(open.lastIndex, end);
    open.lastIndex = end + tag.length + 3;
    if (tag === "p") out.push({ t: "p", text: text(inner) });
    else if (tag === "h1" || tag === "h3") out.push({ t: "h3", text: text(inner) });
    else if (tag === "ul" || tag === "ol") out.push({ t: tag, items: all(inner, "li").map(text) });
    else if (tag === "table") {
      out.push({ t: "table", head: all(inner, "th").map(text), rows: all(inner, "tr").map((r) => all(r, "td").map(text)).filter((r) => r.length) });
    } else if (m[3] === "docs-callout") out.push({ t: "callout", text: text(inner) });
    else if (m[3] === "code-block-frame") {
      const file = inner.match(/code-block-filename">(.*?)</)?.[1] ?? "";
      out.push({ t: "code", file, lines: lines(inner.match(/<pre>([\s\S]*?)<\/pre>/)?.[1] ?? "") });
    }
  }
  return out;
}

const groups = exampleGroups();
const demoIds = new Set(groups.flatMap((g) => g.examples.map((ex) => ex.id)));

const sections = DOC_SECTIONS.map((sec) => ({
  id: sec.id,
  group: sec.groupTitle,
  title: sec.title,
  ...(sec.apiSig ? { api: sec.apiTag ?? "fn", sig: lines(sec.apiSig) } : {}),
  // A section's live part is the example of its id (api-demos.ts: Live(id)), or its text stand-in.
  blocks: [
    ...blocks(sec.content),
    ...(sec.render && demoIds.has(sec.id) ? [{ t: "live" as const, id: sec.id }] : blocks(sec.renderText ?? "")),
    ...blocks(sec.afterContent ?? ""),
  ],
}));

const content = {
  version: NUCLO_VERSION,
  gzip: NUCLO_GZIP_KB,
  docs: { documentation: LABELS.documentation, title: LABELS.title, lead: LABELS.lead, quickStart: LABELS.quickStart, quickStartLink: LABELS.quickStartLink, facts: LABELS.facts, filter: LABELS.filterSections, publicApi: LABELS.publicApi },
  home: {
    badge: home.HERO_BADGE,
    titleLines: home.HERO_TITLE_LINES,
    desc: home.HERO_DESC,
    install: home.INSTALL_CMD,
    stats: home.HERO_STATS,
    counter: highlight(home.COUNTER_TEASER_CODE),
    labels: home.LABELS,
    pipeline: home.PIPELINE_STEPS.map((s) => ({ ...s, code: lines(s.code) })),
    quote: home.PHILOSOPHY_QUOTE,
    philosophy: home.PHILOSOPHY_POINTS,
    features: home.FEATURES,
    comparison: { title: home.COMPARISON_TITLE, sub: home.COMPARISON_SUB, cols: home.COMPARISON_COLS },
    benchmark: { title: home.BENCHMARK_TITLE, sub: home.BENCHMARK_SUB, note: home.BENCHMARK_NOTE, source: home.BENCHMARK_SOURCE_LABEL, entries: home.BENCHMARK_ENTRIES },
    cta: { title: home.CTA_TITLE, sub: home.CTA_SUB, steps: home.QUICK_START_STEPS.map((s) => ({ ...s, code: lines(s.code) })) },
  },
  sections,
  examples: {
    labels: { examples: examples.LABELS.examples, title: examples.LABELS.title, sub: examples.LABELS.sub },
    groups: groups.map((g) => ({
      title: g.title,
      sub: g.sub,
      examples: g.examples.map((ex) => ({
        id: ex.id,
        title: ex.title,
        desc: ex.desc.replace(/`/g, ""),
        ...(ex.docs ? { docs: ex.docs } : {}),
        ...(ex.install ? { install: ex.install } : {}),
        // Raw source: the app highlights it when the example opens (highlight.ts).
        files: ex.files ?? [{ name: "main.ts", code: ex.code }],
      })),
    })),
  },
};

await Bun.write(new URL("content.json", import.meta.url), JSON.stringify(content));
console.log(`content.json: ${sections.length} sections, ${demoIds.size} examples`);
