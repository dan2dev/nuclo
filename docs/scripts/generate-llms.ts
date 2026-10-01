// Regenerates public/llms-full.txt (the whole docs page + examples as Markdown)
// from src/pages/docs/content.ts and src/content/examples.ts.
// Run via `bun run update:llms`. public/llms.txt is hand-written.
import "nuclo/polyfill";
import "nuclo";
import { join, resolve } from "node:path";
import { DOC_SECTIONS } from "../src/pages/docs/content.ts";
import { EXAMPLES } from "../src/content/examples.ts";
import { NUCLO_VERSION } from "../src/generated/nuclo-stats.ts";

const DOCS_URL = "https://nuclo.dev/docs";
const outFile = join(resolve(import.meta.dir, ".."), "public", "llms-full.txt");

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");
const fence = (lang: string, src: string) => "```" + lang + "\n" + src.trim() + "\n```";

function langOf(file: string): string {
  if (file === "terminal") return "bash";
  return file.split(".").pop() ?? "";
}

/** Converts the constrained HTML used in docs content to Markdown. */
function toMarkdown(html: string): string {
  // Pull code blocks out first so their contents never go through tag stripping.
  const blocks: string[] = [];
  const keep = (md: string) => `\u0000${blocks.push(md) - 1}\u0000`;

  let s = html.replace(
    /<div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">(.*?)<\/span><\/div><div class="code-block-body"><pre>([\s\S]*?)<\/pre><\/div><\/div>/g,
    (_, file: string, body: string) => {
      let src = decode(stripTags(body));
      if (file === "terminal") src = src.replace(/^\$ /gm, "");
      return "\n" + keep(fence(langOf(file), (file === "terminal" ? "" : `// ${file}\n`) + src)) + "\n";
    },
  );

  s = s
    .replace(/<ol>([\s\S]*?)<\/ol>/g, (_, items: string) => {
      let n = 0;
      return items.replace(/\s*<li>/g, () => `\n${++n}. `);
    })
    .replace(/\s*<li>/g, "\n- ")
    .replace(/<thead>\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>/g, (_, row: string) => {
      const cells = row.match(/<th>/g)?.length ?? 0;
      return `\n${row.replace(/<th>/g, "| ").replace(/<\/th>/g, " ")}|\n${"| --- ".repeat(cells)}|`;
    })
    .replace(/\s*<tr>([\s\S]*?)<\/tr>/g, (_, row: string) => `\n${row.replace(/<td>/g, "| ").replace(/<\/td>/g, " ")}|`)
    .replace(/<div class="docs-callout">([\s\S]*?)<\/div>/g, "\n\n> $1\n\n")
    .replace(/<h3>([\s\S]*?)<\/h3>/g, "\n\n#### $1\n\n")
    .replace(/<p>([\s\S]*?)<\/p>/g, "\n\n$1\n\n")
    .replace(/<\/?strong>/g, "**")
    .replace(/<\/?code>/g, "`")
    .replace(/<a href="#([^"]+)">([\s\S]*?)<\/a>/g, `[$2](${DOCS_URL}#$1)`)
    .replace(/\s*<\/?tbody>/g, "")
    .replace(/<\/?(ul|table)>/g, "\n");

  s = decode(stripTags(s))
    .split("\n").map((l) => l.trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[Number(i)]);
}

const parts: string[] = [
  "# Nuclo documentation",
  `> Complete Nuclo v${NUCLO_VERSION} documentation as a single Markdown file, generated from ${DOCS_URL}. ` +
    "Nuclo is a lightweight, zero-dependency, type-safe DOM library for JavaScript and TypeScript: " +
    "build UI with global tag builders, keep state in plain mutable variables, and call `update()` to sync the real DOM. " +
    "No virtual DOM, no compiler, no proxies, no signals.",
  "Index: https://nuclo.dev/llms.txt · Source: https://github.com/dan2dev/nuclo · npm: https://www.npmjs.com/package/nuclo",
];

let group = "";
for (const sec of DOC_SECTIONS) {
  if (sec.groupTitle !== group) {
    group = sec.groupTitle;
    parts.push(`## ${group}`);
  }
  parts.push(`### ${sec.title}`, `Source: ${DOCS_URL}#${sec.id}`);
  if (sec.apiSig) parts.push(fence("ts", decode(stripTags(sec.apiSig))));
  for (const html of [sec.content, sec.renderText, sec.afterContent]) {
    if (html) parts.push(toMarkdown(html));
  }
}

parts.push("## Examples", "Live versions: https://nuclo.dev/examples");
for (const ex of EXAMPLES) {
  parts.push(`### ${ex.title}`, ex.desc, fence("ts", ex.code));
}

const content = parts.join("\n\n") + "\n";

// Guard: outside code, no raw HTML tags or entities may survive the conversion.
const prose = content.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
const leak = prose.match(/<\/?[a-z][^>]*>|&[a-z#0-9]+;/i);
if (leak) {
  console.error(`llms-full.txt: unconverted HTML "${leak[0]}" - extend toMarkdown() in scripts/generate-llms.ts`);
  process.exit(1);
}

const existing = (await Bun.file(outFile).exists()) ? await Bun.file(outFile).text() : null;
if (existing === content) {
  console.log("llms-full.txt up to date");
} else {
  await Bun.write(outFile, content);
  console.log(`llms-full.txt updated (${content.length} chars)`);
}
