// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Home",
  docs: "Documentazione",
  examples: "Esempi",
  getStarted: "Inizia ora",
  menu: "Menu",
  main: "Principale",
  openMenu: "Apri il menu",
  closeMenu: "Chiudi il menu",
  nucloHome: "Home di Nuclo",
  nucloOnGitHub: "Nuclo su GitHub",
  opensInNewTab: " (si apre in una nuova scheda)",
  switchTheme: "Cambia tema",
  language: "Lingua",
};

export const footer = {
  tagline: "Il runtime UI con aggiornamenti espliciti. Funzioni semplici, stato mutabile e una sola chiamata tra i tuoi dati e il DOM.",
  builtWith: "Questo sito è costruito con Nuclo.",
  explore: "Esplora",
  documentation: "Documentazione",
  examples: "Esempi",
  readme: "README",
  project: "Progetto",
  github: "GitHub",
  license: "Licenza MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · Licenza MIT",
};

export const app = {
  failedToLoad: "Impossibile caricare la pagina",
  loadingLanguage: "Caricamento della lingua…",
  notFound: "Pagina non trovata",
  notFoundHint: "A questo indirizzo non c'è niente.",
  goHome: "Torna alla home",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Anteprima",
  code: "Codice",
  copy: "Copia",
  copied: "✓ Copiato",
  copyToClipboard: "Copia negli appunti",
  live: "Live",
  openFullScreen: "Apri questo esempio a schermo intero",
  open: "Apri ↗",
  readTheDocs: "Leggi la documentazione →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Il framework DOM leggero con aggiornamenti espliciti",
      description: "Nuclo è una libreria DOM in TypeScript, leggera e senza dipendenze. Costruisci la UI con semplici funzioni, modifica lo stato e chiama update(). Niente virtual DOM, proxy o signal.",
      keywords: "nuclo, framework dom, valori dipendenti dallo stato, aggiornamenti espliciti, stato mutabile, javascript, typescript, framework ui, leggero",
    },
    "apps/:id": {
      title: "App standalone - Esempi Nuclo",
      description: "App Nuclo interattive, a tutta finestra: un workspace che occupa l'intero browser.",
    },
    desktop: {
      title: "Nuclo OS - Desktop",
      description: "Un desktop standalone con app che funzionano davvero: File, Note, Terminale, Calcolatrice, Timer, una bacheca Kanban, Finanze con grafici e foglio di calcolo, Calendario. Il file system è simulato e vive nel tuo browser.",
    },
    docs: {
      title: "Documentazione di Nuclo - Guida e riferimento API",
      description: "Tutto su Nuclo: installazione, builder dei tag, aggiornamenti espliciti con update(), when() e list(), eventi, ciclo di vita, SSR e idratazione, CSS-in-TS tipizzato e il riferimento API completo.",
      keywords: "documentazione nuclo, riferimento api, guida introduttiva, update, list, when, on",
    },
    examples: {
      title: "Esempi di Nuclo - Contatore, to-do list, ricerca e stili",
      description: "Esempi Nuclo dal vivo, con il sorgente a portata di mano: un contatore, una to-do list, un filtro di ricerca in tempo reale e stili CSS-in-TS tipizzati.",
      keywords: "esempi nuclo, contatore, todo, filtro di ricerca, css-in-ts, demo live",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Esempi di Nuclo`,
  exampleDescription: (desc: string) => `${desc} Un esempio Nuclo live, con tanto di codice sorgente.`,
  exampleKeywords: (title: string) => `esempio nuclo, ${title.toLowerCase()}, demo live, codice sorgente`,
};
