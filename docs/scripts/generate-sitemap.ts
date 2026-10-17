// Writes public/sitemap.xml: every section and example page in every locale, each URL
// listing its translations as xhtml:link alternates (and x-default on English).
// Run: bun --tsconfig-override tsconfig.bun.json scripts/generate-sitemap.ts
import "nuclo/polyfill";
import "nuclo";
import { join, resolve } from "node:path";
import { ALL_EXAMPLES } from "../src/pages/examples/registry.ts";
import { DEFAULT_LOCALE, LOCALES, LOCALE_CODES } from "../src/i18n/index.ts";
import { SEO_BASE_URL } from "../src/seo.ts";

const outFile = join(resolve(import.meta.dir, ".."), "public", "sitemap.xml");
const base = SEO_BASE_URL.replace(/\/$/, "");

const pages: { path: string; changefreq: string; priority: string }[] = [
  { path: "", changefreq: "weekly", priority: "1.0" },
  { path: "/docs", changefreq: "weekly", priority: "0.9" },
  { path: "/examples", changefreq: "weekly", priority: "0.8" },
  ...ALL_EXAMPLES.map((ex) => ({ path: `/examples/${ex.id}`, changefreq: "monthly", priority: "0.6" })),
];

const url = (locale: string, path: string) => `${base}/${locale}${path}`;
const entries = pages.flatMap(({ path, changefreq, priority }) =>
  LOCALE_CODES.map((locale) => [
    "  <url>",
    `    <loc>${url(locale, path)}</loc>`,
    ...LOCALE_CODES.map((alt) => `    <xhtml:link rel="alternate" hreflang="${LOCALES[alt].lang}" href="${url(alt, path)}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(DEFAULT_LOCALE, path)}" />`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n")),
);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
await Bun.write(outFile, xml);
console.log(`sitemap.xml updated (${entries.length} urls)`);
