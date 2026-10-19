// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Home",
  docs: "Docs",
  examples: "Examples",
  getStarted: "शुरू करें",
  menu: "Menu",
  main: "मुख्य navigation",
  openMenu: "Menu खोलें",
  closeMenu: "Menu बंद करें",
  nucloHome: "Nuclo Home",
  nucloOnGitHub: "GitHub पर Nuclo",
  opensInNewTab: " (नए टैब में खुलता है)",
  switchTheme: "Theme बदलें",
  language: "भाषा",
};

export const footer = {
  tagline: "Explicit UI runtime। Plain functions, mutable state, और आपके data से DOM तक बस एक call।",
  builtWith: "ये साइट भी Nuclo से ही बनी है।",
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
  failedToLoad: "पेज लोड नहीं हो पाया",
  loadingLanguage: "भाषा लोड हो रही है…",
  notFound: "पेज नहीं मिला (404)",
  notFoundHint: "इस address पर कुछ नहीं है।",
  goHome: "Home page पर वापस जाएँ",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Preview",
  code: "Code",
  copy: "Copy करें",
  copied: "✓ Copy हो गया",
  copyToClipboard: "Clipboard में copy करें",
  live: "Live",
  openFullScreen: "ये example full screen में खोलें",
  open: "खोलें ↗",
  readTheDocs: "Docs पढ़ें →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - explicit update वाला हल्का DOM framework",
      description: "Nuclo एक हल्की TypeScript DOM library है, zero dependencies के साथ। functions से UI बनाइए, plain state बदलिए और update() call कीजिए। न virtual DOM, न proxy, न signals।",
      keywords: "nuclo, DOM framework, explicit update, mutable state, javascript, typescript, UI framework, lightweight",
    },
    "apps/:id": {
      title: "Standalone app - Nuclo examples",
      description: "पूरी browser window में चलने वाले interactive Nuclo apps।",
    },
    desktop: {
      title: "Nuclo OS - डेस्कटॉप",
      description: "Working apps वाला एक standalone desktop: files, notes, terminal, calculator, timer, kanban board, charts, spreadsheet वाला finance app और calendar। Simulated file system आपके browser में ही save रहता है।",
    },
    docs: {
      title: "Nuclo Docs - guide और API reference",
      description: "Nuclo Docs: installation, tag builders, explicit update(), when() और list(), events, lifecycle, SSR और hydration, typed CSS-in-TS और पूरा API reference।",
      keywords: "nuclo docs, API reference, getting started, update, list, when, on",
    },
    examples: {
      title: "Nuclo Examples - counter, todo list, search और styling",
      description: "Source code के साथ Nuclo के live examples: counter, todo list, real-time search filter और typed CSS-in-TS styling।",
      keywords: "nuclo examples, counter, todo list, search filter, css-in-ts, live demo",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo example`,
  exampleDescription: (desc: string) => `${desc} Source code के साथ Nuclo का live example।`,
  exampleKeywords: (title: string) => `nuclo example, ${title.toLowerCase()}, live demo, source code`,
};
