import "nuclo/polyfill";
import "nuclo";
import { expect, test } from "bun:test";
import { ALL_EXAMPLES } from "../src/pages/examples/registry.ts";
import { DEFAULT_LOCALE, LOCALE_CODES } from "../src/i18n/index.ts";
import { routeDefinitions, isLocalized } from "../src/route-definitions.ts";
import { router } from "../src/router.ts";
import { SEO_BASE_URL, resolveMeta } from "../src/seo.ts";

const xml = await Bun.file(new URL("../public/sitemap.xml", import.meta.url)).text();
const base = SEO_BASE_URL.replace(/\/$/, "");
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
  url: match[1]!.match(/<loc>([^<]+)<\/loc>/)![1]!,
}));
const urls = new Set(entries.map((entry) => entry.url));

test("sitemap contains the main pages and every example in each locale, and static standalone pages", () => {
  const paths = ["", "/docs", "/examples", ...ALL_EXAMPLES.map((example) => `/examples/${example.id}`)];
  const standalone = routeDefinitions.filter((route) => !isLocalized(route) && !route.path.includes(":"));
  const expected = [
    ...LOCALE_CODES.flatMap((locale) => paths.map((path) => `${base}/${locale}${path}`)),
    ...standalone.map((route) => `${base}/${route.path}`),
  ];
  expect(entries.length).toBe(urls.size);
  expect([...urls].sort()).toEqual(expected.sort());
  expect(urls.has(`${base}/desktop`)).toBe(true);
});

test("sitemap entries contain only URL locations", () => {
  for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    expect(match[1]!.trim()).toMatch(/^<loc>https:\/\/nuclo\.dev\/[^<]*<\/loc>$/);
  }
  expect(xml).not.toContain("xmlns:xhtml");
});

test("every sitemap URL resolves directly to its own canonical page", async () => {
  for (const entry of entries) {
    const route = await router.start(entry.url);
    expect(route.pattern).not.toBe("*");
    expect(route.data).not.toBeNull();
    expect(resolveMeta(route, route.data).url).toBe(entry.url);
  }
});

test("standalone apps are left out and canonicalize to their listed example page", () => {
  for (const example of ALL_EXAMPLES.filter((example) => example.layout === "app")) {
    const meta = resolveMeta({ pattern: "/apps/:id", path: `/apps/${example.id}`, params: { id: example.id } }, example);
    expect(meta.url).toBe(`${base}/${DEFAULT_LOCALE}/examples/${example.id}`);
    expect(urls.has(`${base}/apps/${example.id}`)).toBe(false);
    expect(urls.has(meta.url)).toBe(true);
    expect(meta.alternates).toEqual([]);
  }
});
