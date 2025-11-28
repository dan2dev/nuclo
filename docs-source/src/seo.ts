import type { Route } from "./router.ts";

interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
}

const routeMeta: Record<Route, PageMeta> = {
  "home": {
    title: "Nuclo - Simple Reactive DOM Library",
    description: "A simple, explicit DOM library for building reactive user interfaces. Lightweight, type-safe, and easy to learn - build modern web apps without the complexity.",
    keywords: "nuclo, reactive, DOM library, javascript, typescript, ui framework"
  },
  "getting-started": {
    title: "Getting Started - Nuclo",
    description: "Learn how to get started with Nuclo. Installation guide, basic concepts, and your first reactive application.",
    keywords: "nuclo tutorial, getting started, installation, setup, quick start"
  },
  "core-api": {
    title: "Core API - Nuclo",
    description: "Explore Nuclo's core API including state management, reactive updates, and DOM manipulation utilities.",
    keywords: "nuclo api, core api, state management, reactive state"
  },
  "tag-builders": {
    title: "Tag Builders - Nuclo",
    description: "Learn about Nuclo's tag builder functions for creating DOM elements with a clean, functional API.",
    keywords: "tag builders, dom creation, elements, nuclo tags"
  },
  "styling": {
    title: "Styling - Nuclo",
    description: "Discover how to style your Nuclo applications with inline styles, CSS-in-JS, and external stylesheets.",
    keywords: "nuclo styling, css, inline styles, css-in-js"
  },
  "pitfalls": {
    title: "Common Pitfalls - Nuclo",
    description: "Avoid common mistakes when working with Nuclo. Best practices and troubleshooting guide.",
    keywords: "nuclo pitfalls, common mistakes, best practices, troubleshooting"
  },
  "examples": {
    title: "Examples - Nuclo",
    description: "Browse interactive examples showcasing Nuclo's capabilities - from simple counters to complex applications.",
    keywords: "nuclo examples, demos, sample code, tutorials"
  },
  "example-counter": {
    title: "Counter Example - Nuclo",
    description: "A simple counter example demonstrating Nuclo's reactive state management.",
    keywords: "counter example, reactive state, nuclo tutorial"
  },
  "example-todo": {
    title: "Todo App Example - Nuclo",
    description: "Build a todo application with Nuclo. Learn about state, events, and list rendering.",
    keywords: "todo app, nuclo example, list rendering"
  },
  "example-subtasks": {
    title: "Subtasks Example - Nuclo",
    description: "Advanced todo example with nested subtasks demonstrating complex state management.",
    keywords: "subtasks, nested state, complex example"
  },
  "example-search": {
    title: "Search Example - Nuclo",
    description: "Implement a search interface with filtering using Nuclo's reactive state.",
    keywords: "search, filtering, reactive search"
  },
  "example-async": {
    title: "Async Data Example - Nuclo",
    description: "Handle asynchronous data fetching and loading states in Nuclo applications.",
    keywords: "async, data fetching, loading states, promises"
  },
  "example-forms": {
    title: "Forms Example - Nuclo",
    description: "Create interactive forms with validation using Nuclo.",
    keywords: "forms, validation, input handling"
  },
  "example-nested": {
    title: "Nested Components Example - Nuclo",
    description: "Learn how to compose and nest components in Nuclo applications.",
    keywords: "components, composition, nested components"
  },
  "example-animations": {
    title: "Animations Example - Nuclo",
    description: "Add smooth animations and transitions to your Nuclo applications.",
    keywords: "animations, transitions, effects"
  },
  "example-routing": {
    title: "Routing Example - Nuclo",
    description: "Implement client-side routing in Nuclo applications.",
    keywords: "routing, navigation, spa"
  },
  "example-styled-card": {
    title: "Styled Card Example - Nuclo",
    description: "Create beautiful styled components with Nuclo's styling capabilities.",
    keywords: "styled components, css, card design"
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
