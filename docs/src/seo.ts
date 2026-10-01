import type { RoutePath } from './route-definitions.ts';
import { NUCLO_VERSION } from './generated/nuclo-stats.ts';

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  type?: "TechArticle" | "WebPage" | "ItemList" | "CollectionPage";
}

export const SEO_BASE_URL = "https://nuclo.dev/";

export const routeMeta: Record<RoutePath, PageMeta> = {
  home: {
    title: "Nuclo - Lightweight DOM Framework with Explicit Updates",
    description:
      "Nuclo is a lightweight, zero-dependency TypeScript DOM library. Build UI with functions, mutate plain state, call update(). No virtual DOM, proxies or signals.",
    keywords: "nuclo, dom framework, state-dependent values, explicit updates, mutable state, javascript, typescript, ui framework, lightweight",
    type: "WebPage",
  },
  docs: {
    title: "Nuclo Docs - Guide & API Reference",
    description:
      "Nuclo docs: install, tag builders, explicit update(), when() and list(), events, lifecycle, SSR and hydration, typed atomic CSS, and the full API reference.",
    keywords: "nuclo documentation, api reference, getting started, update, list, when, on",
    type: "TechArticle",
  },
  examples: {
    title: "Nuclo Examples - Counter, Todo List, Search & Styling",
    description:
      "Live Nuclo examples with source code: a counter, a todo list, a real-time search filter, and typed atomic CSS styling.",
    keywords: "nuclo examples, counter, todo, search filter, css-in-ts, live demos",
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

  const pageUrl = route === 'home' ? SEO_BASE_URL : `${SEO_BASE_URL}${route}`;

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

export function generateStructuredData(route: string): object[] {
  const meta = getMetaForRoute(route);
  const pageUrl = route === 'home' ? SEO_BASE_URL : `${SEO_BASE_URL}${route}`;

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
    runtimePlatform: ["Browser", "Node.js", "Bun", "Deno"],
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
