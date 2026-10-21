import { LOCALE_PREFIX, routeName } from './route-definitions.ts';
import { NUCLO_VERSION } from './generated/nuclo-stats.ts';
import { DEFAULT_LOCALE, LOCALES, LOCALE_CODES, localeOf, t, type Locale } from './i18n/index.ts';

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  type?: "TechArticle" | "WebPage" | "ItemList" | "CollectionPage";
}

export const SEO_BASE_URL = "https://nuclo.dev/";

// The titles and descriptions are the locale's (i18n/<locale>/ui.ts); the schema type is the route's.
const routeTypes: Record<string, PageMeta["type"]> = { home: "WebPage", 'apps/:id': "WebPage", desktop: "WebPage", docs: "TechArticle", examples: "CollectionPage" };

function routeMeta(route: string): PageMeta {
  const text = t.seo.routes[route] ?? t.seo.routes.home;
  return { ...text, type: routeTypes[route] ?? "WebPage" };
}

/** What a matched route needs for its meta: the pattern, the path, the params and the page's load() result. */
export interface RouteInfo { pattern: string; path: string; params: Record<string, string> }

export interface ResolvedMeta {
  meta: PageMeta;
  /** The canonical URL: this page in its own locale. */
  url: string;
  /** The page's locale, null for the unlocalized standalone apps. */
  locale: Locale | null;
  /** The same page in every locale, for hreflang; empty for an unlocalized page. */
  alternates: { locale: Locale; url: string }[];
}

// The example page's load() returns the example (see pages/ExampleDetail.ts); SEO reads its title and text.
type ExampleData = { id: string; title: string; desc: string } | null | undefined;

/** The absolute URL of a section path, under a locale. */
const absolute = (locale: Locale | null, path: string): string => {
  const base = SEO_BASE_URL.replace(/\/$/, '');
  return locale ? `${base}/${locale}${path === '/' ? '' : path}` : `${base}${path}`;
};

export function resolveMeta(ctx: RouteInfo, data?: unknown): ResolvedMeta {
  const known = ctx.pattern !== '*' && data !== null;
  const route = routeName(ctx.pattern);
  const localized = ctx.pattern.startsWith(LOCALE_PREFIX);
  const locale = localized ? localeOf(ctx.params) : null;
  // The page's path without its locale: "/pt-br/docs" is "/docs".
  const path = localized && locale ? ctx.path.replace(/^\/[^/]+/, '') || '/' : ctx.path.replace(/\/+$/, '') || '/';
  const pattern = localized ? ctx.pattern.slice(LOCALE_PREFIX.length) : ctx.pattern;
  const example = pattern === '/examples/:id' || pattern === '/docs/:example' || pattern === '/apps/:id' ? (data as ExampleData) : undefined;
  // One canonical URL per example: /docs/example-<id> is the same page over the docs.
  const canonicalPath = example ? `/examples/${example.id}` : path;
  const meta: PageMeta = !known
    ? { title: `${t.app.notFound} - Nuclo`, description: t.app.notFoundHint, type: 'WebPage' }
    : example
    ? {
        title: t.seo.exampleTitle(example.title),
        description: t.seo.exampleDescription(example.desc),
        keywords: t.seo.exampleKeywords(example.title),
        type: 'TechArticle',
      }
    : routeMeta(route);
  return {
    meta,
    locale,
    url: absolute(example && !localized ? DEFAULT_LOCALE : locale, canonicalPath),
    alternates: known && localized ? LOCALE_CODES.map((code) => ({ locale: code, url: absolute(code, canonicalPath) })) : [],
  };
}

/** `<link rel="alternate" hreflang>` for every locale, plus x-default on the site's default locale. */
export function hreflangLinks(resolved: ResolvedMeta): { hreflang: string; href: string }[] {
  if (resolved.alternates.length === 0) return [];
  const byLocale = (code: Locale) => resolved.alternates.find((alt) => alt.locale === code)!.url;
  return [
    ...resolved.alternates.map((alt) => ({ hreflang: LOCALES[alt.locale].lang, href: alt.url })),
    { hreflang: 'x-default', href: byLocale(DEFAULT_LOCALE) },
  ];
}

export function updatePageMeta(ctx: RouteInfo, data?: unknown): void {
  const resolved = resolveMeta(ctx, data);
  const known = ctx.pattern !== '*' && data !== null;
  const language = LOCALES[resolved.locale ?? DEFAULT_LOCALE];
  const { meta, url: pageUrl } = resolved;
  document.title = meta.title;
  // Written only when they change: any write to <html lang|dir>, even the same value, restyles the whole page.
  const root = document.documentElement;
  if (root.lang !== language.lang) root.lang = language.lang;
  if (root.dir !== language.dir) root.dir = language.dir;

  function setMeta(name: string, content: string) {
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
    el.content = content;
  }
  function setOg(property: string, content: string) {
    let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
    el.content = content;
  }

  setMeta('title', meta.title);
  setMeta('description', meta.description);
  setMeta('language', language.lang);
  setMeta('robots', known ? 'index, follow' : 'noindex, nofollow');
  if (meta.keywords) setMeta('keywords', meta.keywords);
  else document.querySelector('meta[name="keywords"]')?.remove();
  setOg('og:type', meta.type === 'TechArticle' ? 'article' : 'website');
  setOg('og:title', meta.title);
  setOg('og:description', meta.description);
  setOg('og:url', pageUrl);
  setMeta('twitter:title', meta.title);
  setMeta('twitter:description', meta.description);
  setMeta('twitter:url', pageUrl);

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = pageUrl;

  // The language links follow the page: one per locale, none on an unlocalized page.
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  for (const { hreflang, href } of hreflangLinks(resolved)) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = href;
    document.head.appendChild(link);
  }
  setOg('og:locale', language.og);
  document.querySelectorAll('meta[property="og:locale:alternate"]').forEach((el) => el.remove());
  if (resolved.locale) {
    for (const code of LOCALE_CODES.filter((code) => code !== resolved.locale)) {
      const el = document.createElement('meta');
      el.setAttribute('property', 'og:locale:alternate');
      el.content = LOCALES[code].og;
      document.head.appendChild(el);
    }
  }

  let schema = document.head.querySelector('script[type="application/ld+json"]');
  if (!schema) {
    schema = document.createElement('script');
    schema.setAttribute('type', 'application/ld+json');
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify(known
    ? generateStructuredData(meta, pageUrl, resolved.locale)
    : [{ '@context': 'https://schema.org', '@type': 'WebPage', name: meta.title, description: meta.description, url: pageUrl, inLanguage: language.lang }]);
}

export function generateStructuredData(meta: PageMeta, pageUrl: string, locale: Locale | null): object[] {

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SEO_BASE_URL}#website`,
    name: "Nuclo",
    url: SEO_BASE_URL,
    description: t.seo.routes.home.description,
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": `${SEO_BASE_URL}#software`,
    name: "Nuclo",
    description: website.description,
    url: SEO_BASE_URL,
    codeRepository: "https://github.com/dan2dev/nuclo",
    programmingLanguage: ["TypeScript", "JavaScript"],
    runtimePlatform: ["Browser", "Node.js", "Bun"],
    license: "https://opensource.org/licenses/MIT",
    version: NUCLO_VERSION,
    author: { "@type": "Person", name: "Danilo Celestino de Castro", url: "https://github.com/dan2dev" },
    sameAs: ["https://github.com/dan2dev/nuclo", "https://www.npmjs.com/package/nuclo"],
  };

  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": meta.type ?? "WebPage",
    name: meta.title,
    description: meta.description,
    url: pageUrl,
    isPartOf: { "@id": `${SEO_BASE_URL}#website` },
    about: { "@id": `${SEO_BASE_URL}#software` },
    ...(locale ? { inLanguage: LOCALES[locale].lang } : {}),
  };

  return [website, software, page];
}
