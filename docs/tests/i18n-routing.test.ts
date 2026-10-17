import "nuclo/polyfill";
import "nuclo";
import { expect, test } from "bun:test";
import { appFetch, preferredLocale } from "../src/app-handler.ts";
import { isLocale, LOCALES, LOCALE_CODES, loadLocale, applyLocale, t } from "../src/i18n/index.ts";
import { ALL_EXAMPLES } from "../src/pages/examples/registry.ts";
import { resolveMeta } from "../src/seo.ts";

const request = (path: string) => appFetch(new Request(`http://localhost${path}`), async (html) => html);
const headOf = (html: string) => html.slice(0, html.indexOf("</head>"));
const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("'", "&#39;");

test("locale validation excludes inherited object properties", () => {
  for (const code of ["constructor", "toString", "__proto__", "hasOwnProperty", "xx", null]) {
    expect(isLocale(code)).toBe(false);
  }
  for (const code of LOCALE_CODES) expect(isLocale(code)).toBe(true);
});

test("language negotiation respects quality weights and an explicit locale cookie", () => {
  const pick = (language: string, cookie?: string) => preferredLocale(new Request("http://localhost/", {
    headers: { "Accept-Language": language, ...(cookie ? { Cookie: cookie } : {}) },
  }));
  expect(pick("fr;q=0.1, de;q=0.9, en;q=0.5")).toBe("de");
  expect(pick("fr;q=0, ja;q=0.8")).toBe("ja");
  expect(pick("pt-PT, en;q=0.5")).toBe("pt-br");
  expect(pick("zh-TW, en;q=0.5")).toBe("zh");
  expect(pick("fr", "nuclo-locale=ar")).toBe("ar");
  expect(pick("de", "nuclo-locale=constructor")).toBe("de");
  expect(pick("xx, fr;q=invalid")).toBe("en");
});

test("root and old URLs redirect without losing query parameters", async () => {
  const response = await appFetch(new Request("http://localhost/?from=docs", {
    headers: { "Accept-Language": "ja" },
  }), async (html) => html);
  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("/ja?from=docs");
  expect(response.headers.get("vary")).toBe("Cookie, Accept-Language");
  const old = await request("/examples/counter?from=old");
  expect(old.status).toBe(301);
  expect(old.headers.get("location")).toBe("/en/examples/counter?from=old");
});

for (const locale of LOCALE_CODES) {
  test(`${locale}: all localized page types use the correct language and canonical links`, async () => {
    for (const suffix of ["", "/docs", "/examples", "/examples/counter", "/docs/example-counter"]) {
      const path = `/${locale}${suffix}`;
      const response = await request(path);
      const html = await response.text();
      const head = headOf(html);
      expect(response.status).toBe(200);
      expect(html).toContain(`<html lang="${LOCALES[locale].lang}" dir="${LOCALES[locale].dir}"`);
      expect(head.match(/rel="canonical"/g)).toHaveLength(1);
      const canonical = `https://nuclo.dev/${locale}${suffix.replace("/docs/example-counter", "/examples/counter")}`;
      expect(head).toContain(`<link rel="canonical" href="${canonical}"`);
      expect(head.match(/rel="alternate" hreflang=/g)).toHaveLength(13);
      expect(head).toContain(`"inLanguage":"${LOCALES[locale].lang}"`);
      expect(head).toContain(`<meta property="og:locale" content="${LOCALES[locale].og}"`);
      expect(html).toContain(escape(t.footer.builtWith));
      if (suffix.endsWith("counter")) {
        expect(/class="[^"]*codeBlockFilename[^"]*">Counter\.ts</.test(html.replace(/<!--[\s\S]*?-->/g, ""))).toBe(true);
      }
    }
  });

  test(`${locale}: missing pages stay localized and are not indexed`, async () => {
    for (const suffix of ["/not-a-page", "/examples/not-an-example", "/docs/not-a-section"]) {
      const response = await request(`/${locale}${suffix}`);
      const html = await response.text();
      const head = headOf(html);
      expect(response.status).toBe(404);
      expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(html).toContain(`<html lang="${LOCALES[locale].lang}" dir="${LOCALES[locale].dir}"`);
      expect(head).toContain(`<title>${escape(t.app.notFound)} - Nuclo</title>`);
      expect(head).toContain('content="noindex, nofollow"');
      expect(head).not.toContain('hreflang=');
    }
  });
}

test("desktop source containing dollar replacement patterns cannot corrupt the HTML template", async () => {
  for (const locale of ["en", "ja", "ar"]) {
    const response = await request(`/${locale}/examples/desktop`);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html.match(/<link rel="canonical"/g)).toHaveLength(1);
    expect(html.match(/<html lang=/g)).toHaveLength(1);
    expect(html).not.toContain("{{html}}");
    expect(html).not.toContain("{{nucloStyles}}");
  }
});

test("unknown locale paths cannot render a successful English page", async () => {
  for (const locale of ["xx", "constructor", "toString", "__proto__"]) {
    expect((await request(`/${locale}`)).status).toBe(404);
    expect((await request(`/${locale}/docs`)).status).toBe(404);
    expect(resolveMeta({ pattern: "/:locale", path: `/${locale}`, params: { locale } }, null).url).toBe(`https://nuclo.dev/${locale}`);
  }
});

test("standalone app pages use English independently of the preceding locale", async () => {
  await loadLocale({ locale: "ar" });
  applyLocale("ar");
  for (const path of ["/desktop", ...ALL_EXAMPLES.filter((example) => example.layout === "app").map((example) => `/apps/${example.id}`)]) {
    const response = await request(path);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="en" dir="ltr"');
  }
});
