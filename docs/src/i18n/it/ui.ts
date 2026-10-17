// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Pagina iniziale",
  docs: "Documentazione",
  examples: "Esempi",
  getStarted: "Inizia",
  menu: "Menu",
  main: "Principale",
  openMenu: "Apri il menu",
  closeMenu: "Chiudi il menu",
  nucloHome: "Home di Nuclo",
  nucloOnGitHub: "Nuclo su GitHub",
  opensInNewTab: " (si apre in una nuova scheda)",
  switchTheme: "Cambia il tema colore",
  language: "Lingua",
};

export const footer = {
  tagline: "Il runtime UI esplicito. Funzioni semplici, stato mutabile e una sola chiamata tra i tuoi dati e il DOM.",
  builtWith: "Questo sito è costruito con Nuclo.",
  explore: "Esplora",
  documentation: "Documentazione",
  examples: "Esempi",
  readme: "README",
  project: "Progetto",
  github: "GitHub",
  license: "Licenza MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "Impossibile caricare la pagina",
  loadingLanguage: "Caricamento della lingua…",
  notFound: "Pagina non trovata",
  notFoundHint: "Non c'è nulla a questo indirizzo.",
  goHome: "Vai alla home",
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
      title: "Nuclo - Framework DOM leggero con aggiornamenti espliciti",
      description: "Nuclo è una libreria DOM TypeScript leggera e senza dipendenze. Costruisci la UI con funzioni, muta uno stato semplice, chiama update(). Niente DOM virtuale, proxy o signal.",
      keywords: "nuclo, framework dom, valori dipendenti dallo stato, aggiornamenti espliciti, stato mutabile, javascript, typescript, framework ui, leggero",
    },
    "apps/:id": {
      title: "App standalone - Esempi Nuclo",
      description: "Esempi interattivi di app Nuclo in uno spazio di lavoro a tutto browser.",
    },
    desktop: {
      title: "Nuclo OS - Desktop",
      description: "Un desktop standalone con app funzionanti — File, Note, Terminale, Calcolatrice, Timer, una board Kanban, Finanze con grafici e un foglio di calcolo, e un Calendario — e un file system simulato salvato nel tuo browser.",
    },
    docs: {
      title: "Documentazione Nuclo - Guida e riferimento API",
      description: "Documentazione Nuclo: installazione, tag builder, update() esplicito, when() e list(), eventi, ciclo di vita, SSR e idratazione, CSS-in-TS tipizzato e il riferimento API completo.",
      keywords: "documentazione nuclo, riferimento api, primi passi, update, list, when, on",
    },
    examples: {
      title: "Esempi Nuclo - Contatore, lista di cose da fare, ricerca e stili",
      description: "Esempi Nuclo dal vivo con codice sorgente: un contatore, una lista di cose da fare, un filtro di ricerca in tempo reale e stili CSS-in-TS tipizzati.",
      keywords: "esempi nuclo, contatore, todo, filtro di ricerca, css-in-ts, demo dal vivo",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Esempi Nuclo`,
  exampleDescription: (desc: string) => `${desc} Un esempio Nuclo dal vivo con il suo codice sorgente.`,
  exampleKeywords: (title: string) => `esempio nuclo, ${title.toLowerCase()}, demo dal vivo, codice sorgente`,
};
