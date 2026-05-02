import type { RoutePath } from './route-definitions.ts';

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  type?: "TechArticle" | "WebPage" | "ItemList" | "CollectionPage";
}

export const SEO_BASE_URL = "https://nuclo.dan2.dev/";

export const routeMeta: Record<RoutePath, PageMeta> = {
  home: {
    title: "Nuclo — Lightweight Imperative DOM Framework",
    description:
      "A lightweight imperative DOM framework. Mutate plain state, call update()—Nuclo syncs the DOM. No proxies, no virtual DOM, no magic.",
    keywords: "nuclo, imperative dom framework, explicit updates, javascript, typescript, ui framework, lightweight",
    type: "WebPage",
  },
  docs: {
    title: "Docs — Nuclo",
    description:
      "Nuclo documentation — installation, core concepts, and full API reference.",
    keywords: "nuclo documentation, api reference, getting started, update, list, when, on",
    type: "TechArticle",
  },
  examples: {
    title: "Examples — Nuclo",
    description:
      "Interactive examples for Nuclo — counter, todo list, search filter, and async loading states.",
    keywords: "nuclo examples, counter, todo, search, async, live demos",
    type: "CollectionPage",
  },
};

export function getMetaForRoute(route: string): PageMeta {
  return Object.prototype.hasOwnProperty.call(routeMeta, route)
    ? routeMeta[route as RoutePath]
    : routeMeta["home"];
}

export function updatePageMeta(route: string): void {
  const meta = getMetaForRoute(route);
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

  const pageUrl = route === 'home' ? SEO_BASE_URL : `${SEO_BASE_URL}${route}`;
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = pageUrl;
}

export function generateStructuredData(route: string): object[] {
  const meta = getMetaForRoute(route);
  const pageUrl = route === 'home' ? SEO_BASE_URL : `${SEO_BASE_URL}${route}`;

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SEO_BASE_URL}#website`,
    name: "Nuclo",
    url: SEO_BASE_URL,
    description: "A lightweight imperative DOM framework",
  };

  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": meta.type ?? "WebPage",
    name: meta.title,
    description: meta.description,
    url: pageUrl,
    isPartOf: { "@id": `${SEO_BASE_URL}#website` },
  };

  return [website, page];
}
