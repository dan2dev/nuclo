// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Start",
  docs: "Dokumentation",
  examples: "Beispiele",
  getStarted: "Loslegen",
  menu: "Menü",
  main: "Hauptnavigation",
  openMenu: "Menü öffnen",
  closeMenu: "Menü schließen",
  nucloHome: "Nuclo-Startseite",
  nucloOnGitHub: "Nuclo auf GitHub",
  opensInNewTab: " (öffnet in einem neuen Tab)",
  switchTheme: "Farbschema wechseln",
  language: "Sprache",
};

export const footer = {
  tagline: "Die UI-Runtime mit expliziten Updates: schlichte Funktionen, veränderlicher State und ein einziger Aufruf zwischen deinen Daten und dem DOM.",
  builtWith: "Diese Seite ist mit Nuclo gebaut.",
  explore: "Entdecken",
  documentation: "Dokumentation",
  examples: "Beispiele",
  readme: "README",
  project: "Projekt",
  github: "GitHub",
  license: "MIT-Lizenz",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "Die Seite konnte nicht geladen werden",
  loadingLanguage: "Sprache wird geladen…",
  notFound: "Seite nicht gefunden",
  notFoundHint: "Unter dieser Adresse gibt es leider nichts zu sehen.",
  goHome: "Zur Startseite",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Vorschau",
  code: "Code",
  copy: "Kopieren",
  copied: "✓ Kopiert",
  copyToClipboard: "In die Zwischenablage kopieren",
  live: "Live",
  openFullScreen: "Dieses Beispiel im Vollbild öffnen",
  open: "Öffnen ↗",
  readTheDocs: "Zur Dokumentation →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Leichtgewichtiges DOM-Framework mit expliziten Updates",
      description: "Nuclo ist eine schlanke TypeScript-DOM-Bibliothek ohne Abhängigkeiten. UIs aus Funktionen, State einfach ändern, update() aufrufen. Kein Virtual DOM, keine Proxies, keine Signals.",
      keywords: "nuclo, dom framework, zustandsabhängige werte, explizite updates, veränderlicher state, javascript, typescript, ui framework, leichtgewichtig",
    },
    "apps/:id": {
      title: "Eigenständige Apps - Nuclo-Beispiele",
      description: "Interaktive Nuclo-App-Beispiele in einem Arbeitsbereich, der das ganze Browserfenster füllt.",
    },
    desktop: {
      title: "Nuclo OS - Desktop",
      description: "Ein eigenständiger Desktop mit funktionierenden Apps (Dateien, Notizen, Terminal, Rechner, Timer, Kanban-Board, Finanzen mit Diagrammen und Tabelle, Kalender) und einem simulierten Dateisystem, das lokal in deinem Browser liegt.",
    },
    docs: {
      title: "Nuclo-Dokumentation - Leitfaden & API-Referenz",
      description: "Nuclo-Dokumentation: Installation, Tag-Builder, explizites update(), when() und list(), Events, Lifecycle, SSR und Hydration, typisiertes CSS-in-TS und die komplette API-Referenz.",
      keywords: "nuclo dokumentation, api referenz, erste schritte, update, list, when, on",
    },
    examples: {
      title: "Nuclo-Beispiele - Zähler, Todo-Liste, Suche & Styling",
      description: "Nuclo live ausprobieren, inklusive Quellcode: Zähler, Todo-Liste, Suchfilter in Echtzeit und typisiertes CSS-in-TS-Styling.",
      keywords: "nuclo beispiele, zähler, todo, suchfilter, css-in-ts, live demos",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Nuclo-Beispiele`,
  exampleDescription: (desc: string) => `${desc} Ein Nuclo-Live-Beispiel mit Quellcode.`,
  exampleKeywords: (title: string) => `nuclo beispiel, ${title.toLowerCase()}, live demo, quellcode`,
};
