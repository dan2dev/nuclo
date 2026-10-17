import { routeName } from './route-definitions.ts';
import { NUCLO_VERSION } from './generated/nuclo-stats.ts';
import { t } from './i18n/index.ts';

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

/** What a matched route needs for its meta: the pattern, the path and the page's load() result. */
export interface RouteInfo { pattern: string; path: string }

// The example page's load() returns the example (see pages/ExampleDetail.ts); SEO reads its title and text.
type ExampleData = { id: string; title: string; desc: string } | null | undefined;

export function resolveMeta(ctx: RouteInfo, data?: unknown): { meta: PageMeta; url: string } {
  const route = routeName(ctx.pattern);
  const url = route === 'home' ? SEO_BASE_URL : `${SEO_BASE_URL}${ctx.path.replace(/^\/|\/+$/g, '')}`;
  const example = ctx.pattern === '/examples/:id' || ctx.pattern === '/docs/:example' || ctx.pattern === '/apps/:id' ? (data as ExampleData) : undefined;
  if (example) {
    return {
      // One canonical URL per example: /docs/example-<id> is the same page over the docs.
      url: `${SEO_BASE_URL}examples/${example.id}`,
      meta: {
        title: t.seo.exampleTitle(example.title),
        description: t.seo.exampleDescription(example.desc),
        keywords: t.seo.exampleKeywords(example.title),
        type: 'TechArticle',
      },
    };
  }
  return { meta: routeMeta(route), url };
}

export function updatePageMeta(ctx: RouteInfo, data?: unknown): void {
  const { meta, url: pageUrl } = resolveMeta(ctx, data);
  document.title = meta.title;

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

  setMeta('description', meta.description);
  if (meta.keywords) setMeta('keywords', meta.keywords);
  setOg('og:title', meta.title);
  setOg('og:description', meta.description);
  setOg('og:url', pageUrl);
  setMeta('twitter:title', meta.title);
  setMeta('twitter:description', meta.description);
  setMeta('twitter:url', pageUrl);

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = pageUrl;
}

export function generateStructuredData(meta: PageMeta, pageUrl: string): object[] {

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SEO_BASE_URL}#website`,
    name: "Nuclo",
    url: SEO_BASE_URL,
    description: "A lightweight, type-safe DOM framework with plain mutable state and explicit updates",
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
  };

  return [website, software, page];
}
