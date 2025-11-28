import type { Route } from "./router.ts";

interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  type?: "TechArticle" | "WebPage" | "ItemList" | "CollectionPage";
  datePublished?: string;
  dateModified?: string;
}

const routeMeta: Record<Route, PageMeta> = {
  "home": {
    title: "Nuclo - Simple Reactive DOM Library",
    description: "A simple, explicit DOM library for building reactive user interfaces. Lightweight, type-safe, and easy to learn - build modern web apps without the complexity.",
    keywords: "nuclo, reactive, DOM library, javascript, typescript, ui framework",
    type: "WebPage"
  },
  "getting-started": {
    title: "Getting Started - Nuclo",
    description: "Learn how to get started with Nuclo. Installation guide, basic concepts, and your first reactive application.",
    keywords: "nuclo tutorial, getting started, installation, setup, quick start",
    type: "TechArticle"
  },
  "core-api": {
    title: "Core API - Nuclo",
    description: "Explore Nuclo's core API including state management, reactive updates, and DOM manipulation utilities.",
    keywords: "nuclo api, core api, state management, reactive state",
    type: "TechArticle"
  },
  "tag-builders": {
    title: "Tag Builders - Nuclo",
    description: "Learn about Nuclo's tag builder functions for creating DOM elements with a clean, functional API.",
    keywords: "tag builders, dom creation, elements, nuclo tags",
    type: "TechArticle"
  },
  "styling": {
    title: "Styling - Nuclo",
    description: "Discover how to style your Nuclo applications with inline styles, CSS-in-JS, and external stylesheets.",
    keywords: "nuclo styling, css, inline styles, css-in-js",
    type: "TechArticle"
  },
  "pitfalls": {
    title: "Common Pitfalls - Nuclo",
    description: "Avoid common mistakes when working with Nuclo. Best practices and troubleshooting guide.",
    keywords: "nuclo pitfalls, common mistakes, best practices, troubleshooting",
    type: "TechArticle"
  },
  "examples": {
    title: "Examples - Nuclo",
    description: "Browse interactive examples showcasing Nuclo's capabilities - from simple counters to complex applications.",
    keywords: "nuclo examples, demos, sample code, tutorials",
    type: "CollectionPage"
  },
  "example-counter": {
    title: "Counter Example - Nuclo",
    description: "A simple counter example demonstrating Nuclo's reactive state management.",
    keywords: "counter example, reactive state, nuclo tutorial",
    type: "TechArticle"
  },
  "example-todo": {
    title: "Todo App Example - Nuclo",
    description: "Build a todo application with Nuclo. Learn about state, events, and list rendering.",
    keywords: "todo app, nuclo example, list rendering",
    type: "TechArticle"
  },
  "example-subtasks": {
    title: "Subtasks Example - Nuclo",
    description: "Advanced todo example with nested subtasks demonstrating complex state management.",
    keywords: "subtasks, nested state, complex example",
    type: "TechArticle"
  },
  "example-search": {
    title: "Search Example - Nuclo",
    description: "Implement a search interface with filtering using Nuclo's reactive state.",
    keywords: "search, filtering, reactive search",
    type: "TechArticle"
  },
  "example-async": {
    title: "Async Data Example - Nuclo",
    description: "Handle asynchronous data fetching and loading states in Nuclo applications.",
    keywords: "async, data fetching, loading states, promises",
    type: "TechArticle"
  },
  "example-forms": {
    title: "Forms Example - Nuclo",
    description: "Create interactive forms with validation using Nuclo.",
    keywords: "forms, validation, input handling",
    type: "TechArticle"
  },
  "example-nested": {
    title: "Nested Components Example - Nuclo",
    description: "Learn how to compose and nest components in Nuclo applications.",
    keywords: "components, composition, nested components",
    type: "TechArticle"
  },
  "example-animations": {
    title: "Animations Example - Nuclo",
    description: "Add smooth animations and transitions to your Nuclo applications.",
    keywords: "animations, transitions, effects",
    type: "TechArticle"
  },
  "example-routing": {
    title: "Routing Example - Nuclo",
    description: "Implement client-side routing in Nuclo applications.",
    keywords: "routing, navigation, spa",
    type: "TechArticle"
  },
  "example-styled-card": {
    title: "Styled Card Example - Nuclo",
    description: "Create beautiful styled components with Nuclo's styling capabilities.",
    keywords: "styled components, css, card design",
    type: "TechArticle"
  }
};

/**
 * Updates the page title and meta tags based on the current route
 */
export function updatePageMeta(route: Route) {
  const meta = routeMeta[route] || routeMeta["home"];
  const baseUrl = "https://nuclo.dan2.dev/";
  const routeUrl = route === "home" ? baseUrl : `${baseUrl}${route}`;

  // Update title
  document.title = meta.title;

  // Update or create meta tags
  updateMetaTag("name", "title", meta.title);
  updateMetaTag("name", "description", meta.description);
  if (meta.keywords) {
    updateMetaTag("name", "keywords", meta.keywords);
  }

  // Update Open Graph tags
  updateMetaTag("property", "og:title", meta.title);
  updateMetaTag("property", "og:description", meta.description);
  updateMetaTag("property", "og:url", routeUrl);

  // Update Twitter Card tags
  updateMetaTag("name", "twitter:title", meta.title);
  updateMetaTag("name", "twitter:description", meta.description);
  updateMetaTag("name", "twitter:url", routeUrl);

  // Update canonical URL
  updateLinkTag("canonical", routeUrl);

  // Update structured data (JSON-LD)
  updateStructuredData(route);
}

/**
 * Helper function to update or create a meta tag
 */
function updateMetaTag(attribute: string, name: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

/**
 * Helper function to update or create a link tag
 */
function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

/**
 * Generates comprehensive JSON-LD structured data for the page
 */
function generateStructuredData(route: Route): object[] {
  const baseUrl = "https://nuclo.dan2.dev/";
  const routeUrl = route === "home" ? baseUrl : `${baseUrl}${route}`;
  const meta = routeMeta[route] || routeMeta["home"];

  const schemas: object[] = [];

  // 1. WebSite Schema (for homepage and all pages)
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}#website`,
    "name": "Nuclo",
    "description": "A simple, explicit DOM library for building reactive user interfaces",
    "url": baseUrl,
    "inLanguage": "en-US",
    "publisher": {
      "@type": "Person",
      "@id": `${baseUrl}#author`,
      "name": "Danilo Castro",
      "url": "https://dan2.dev",
      "sameAs": [
        "https://github.com/dan2dev",
        "https://twitter.com/dan2dev"
      ]
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  });

  // 2. Organization/Author Schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}#author`,
    "name": "Danilo Castro",
    "givenName": "Danilo",
    "familyName": "Castro",
    "url": "https://dan2.dev",
    "sameAs": [
      "https://github.com/dan2dev",
      "https://twitter.com/dan2dev"
    ]
  });

  // 3. SoftwareApplication Schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}#software`,
    "name": "Nuclo",
    "description": "A simple, explicit DOM library for building reactive user interfaces",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@id": `${baseUrl}#author`
    },
    "url": baseUrl,
    "softwareVersion": "Latest",
    "programmingLanguage": {
      "@type": "ComputerLanguage",
      "name": "TypeScript",
      "url": "https://www.typescriptlang.org/"
    },
    "codeRepository": "https://github.com/dan2dev/nuclo",
    "license": "https://github.com/dan2dev/nuclo/blob/main/LICENSE"
  });

  // 4. BreadcrumbList Schema
  const breadcrumbs = generateBreadcrumbs(route);
  if (breadcrumbs.length > 1) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    });
  }

  // 5. WebPage/TechArticle Schema
  const pageType = meta.type || "WebPage";
  const pageSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": pageType,
    "@id": routeUrl,
    "url": routeUrl,
    "name": meta.title,
    "description": meta.description,
    "inLanguage": "en-US",
    "isPartOf": {
      "@id": `${baseUrl}#website`
    },
    "about": {
      "@id": `${baseUrl}#software`
    },
    "author": {
      "@id": `${baseUrl}#author`
    },
    "publisher": {
      "@id": `${baseUrl}#author`
    }
  };

  if (pageType === "TechArticle") {
    pageSchema.articleSection = route.startsWith("example-") ? "Examples" : "Documentation";
    pageSchema.keywords = meta.keywords?.split(", ") || [];
    pageSchema.mainEntityOfPage = routeUrl;
  }

  schemas.push(pageSchema);

  // 6. ItemList Schema for Examples page
  if (route === "examples") {
    const exampleRoutes = [
      "example-counter",
      "example-todo",
      "example-subtasks",
      "example-search",
      "example-async",
      "example-forms",
      "example-nested",
      "example-animations",
      "example-routing",
      "example-styled-card"
    ];

    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Nuclo Examples",
      "description": "Interactive examples showcasing Nuclo's capabilities",
      "numberOfItems": exampleRoutes.length,
      "itemListElement": exampleRoutes.map((exRoute, index) => {
        const exMeta = routeMeta[exRoute as Route];
        return {
          "@type": "ListItem",
          "position": index + 1,
          "url": `${baseUrl}${exRoute}`,
          "name": exMeta.title,
          "description": exMeta.description
        };
      })
    });
  }

  return schemas;
}

/**
 * Generates breadcrumb navigation based on the current route
 */
function generateBreadcrumbs(route: Route): Array<{ name: string; url: string }> {
  const baseUrl = "https://nuclo.dan2.dev/";
  const breadcrumbs = [{ name: "Home", url: baseUrl }];

  if (route === "home") {
    return breadcrumbs;
  }

  if (route.startsWith("example-")) {
    breadcrumbs.push({ name: "Examples", url: `${baseUrl}examples` });
    const meta = routeMeta[route];
    breadcrumbs.push({ name: meta.title.replace(" - Nuclo", ""), url: `${baseUrl}${route}` });
  } else if (route !== "home") {
    const meta = routeMeta[route];
    breadcrumbs.push({ name: meta.title.replace(" - Nuclo", ""), url: `${baseUrl}${route}` });
  }

  return breadcrumbs;
}

/**
 * Updates or creates the JSON-LD structured data script tag
 */
function updateStructuredData(route: Route) {
  const schemas = generateStructuredData(route);

  // Remove existing structured data script tags added by this function
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-dynamic="true"]');
  existingScripts.forEach(script => script.remove());

  // Add new structured data script tag
  const script = document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.setAttribute("data-dynamic", "true");
  script.textContent = JSON.stringify(schemas, null, 2);
  document.head.appendChild(script);
}
