// Writes the main sections and every example (/examples/<id>, the canonical URL) in every locale,
// and static standalone pages. Language alternates are rendered in each page's HTML head.
// Run: bun --tsconfig-override tsconfig.bun.json scripts/generate-sitemap.ts
import "nuclo/polyfill";
import "nuclo";
import { join, resolve } from "node:path";
import { LOCALE_CODES } from "../src/i18n/index.ts";
import { SEO_BASE_URL } from "../src/seo.ts";
import { isLocalized, routeDefinitions } from "../src/route-definitions.ts";
import { ALL_EXAMPLES } from "../src/pages/examples/registry.ts";

const outFile = join(resolve(import.meta.dir, ".."), "public", "sitemap.xml");
const base = SEO_BASE_URL.replace(/\/$/, "");
const urls = [
  ...["", "/docs", "/examples", ...ALL_EXAMPLES.map((ex) => `/examples/${ex.id}`)].flatMap((path) =>
    LOCALE_CODES.map((locale) => `${base}/${locale}${path}`),
  ),
  ...routeDefinitions
    .filter((route) => !isLocalized(route) && !route.path.includes(":"))
    .map((route) => `${base}/${route.path}`),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;
await Bun.write(outFile, xml);
console.log(`sitemap.xml updated (${urls.length} urls)`);
