// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Home",
  docs: "Docs",
  examples: "Examples",
  getStarted: "Get started",
  menu: "Menu",
  main: "Main",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  nucloHome: "Nuclo home",
  nucloOnGitHub: "Nuclo on GitHub",
  opensInNewTab: " (opens in a new tab)",
  switchTheme: "Switch color theme",
  theme: "Theme",
  themes: { light: "Light", dark: "Dark", system: "System" },
  language: "Language",
};

export const footer = {
  tagline: "The explicit UI runtime. Plain functions, mutable state, and one call between your data and the DOM.",
  builtWith: "This site is built with Nuclo.",
  explore: "Explore",
  documentation: "Documentation",
  examples: "Examples",
  readme: "README",
  project: "Project",
  github: "GitHub",
  license: "MIT License",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "Failed to load page",
  loadingLanguage: "Loading language…",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Preview",
  code: "Code",
  copy: "Copy",
  copied: "✓ Copied",
  copyToClipboard: "Copy to clipboard",
  live: "Live",
  openFullScreen: "Open this example full screen",
  open: "Open ↗",
  readTheDocs: "Read the docs →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Lightweight DOM Framework with Explicit Updates",
      description: "Nuclo is a lightweight, zero-dependency TypeScript DOM library. Build UI with functions, mutate plain state, call update(). No virtual DOM, proxies or signals.",
      keywords: "nuclo, dom framework, state-dependent values, explicit updates, mutable state, javascript, typescript, ui framework, lightweight",
    },
    "apps/:id": {
      title: "Standalone Apps - Nuclo Examples",
      description: "Interactive Nuclo app examples in a full-browser workspace.",
    },
    desktop: {
      title: "Nuclo OS - Desktop",
      description: "A standalone desktop with working apps — Files, Notes, Terminal, Calculator, Timer, a Kanban board, Finance with charts and a spreadsheet, and a Calendar — and a simulated file system saved in your browser.",
    },
    docs: {
      title: "Nuclo Docs - Guide & API Reference",
      description: "Nuclo docs: install, tag builders, explicit update(), when() and list(), events, lifecycle, SSR and hydration, typed CSS-in-TS, and the full API reference.",
      keywords: "nuclo documentation, api reference, getting started, update, list, when, on",
    },
    examples: {
      title: "Nuclo Examples - Counter, Todo List, Search & Styling",
      description: "Live Nuclo examples with source code: a counter, a todo list, a real-time search filter, and typed CSS-in-TS styling.",
      keywords: "nuclo examples, counter, todo, search filter, css-in-ts, live demos",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo Examples`,
  exampleDescription: (desc: string) => `${desc} A live Nuclo example with its source code.`,
  exampleKeywords: (title: string) => `nuclo example, ${title.toLowerCase()}, live demo, source code`,
};
