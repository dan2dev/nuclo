// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Accueil",
  docs: "Docs",
  examples: "Exemples",
  getStarted: "Commencer",
  menu: "Menu",
  main: "Principal",
  openMenu: "Ouvrir le menu",
  closeMenu: "Fermer le menu",
  nucloHome: "Accueil de Nuclo",
  nucloOnGitHub: "Nuclo sur GitHub",
  opensInNewTab: " (s'ouvre dans un nouvel onglet)",
  switchTheme: "Changer le thème de couleurs",
  language: "Langue",
};

export const footer = {
  tagline: "Le runtime UI explicite. Des fonctions ordinaires, un état mutable et un seul appel entre vos données et le DOM.",
  builtWith: "Ce site est construit avec Nuclo.",
  explore: "Explorer",
  documentation: "Documentation",
  examples: "Exemples",
  readme: "README",
  project: "Projet",
  github: "GitHub",
  license: "Licence MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · MIT License",
};

export const app = {
  failedToLoad: "Échec du chargement de la page",
  loadingLanguage: "Chargement de la langue…",
  notFound: "Page introuvable",
  notFoundHint: "Il n'y a rien à cette adresse.",
  goHome: "Aller à la page d'accueil",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Aperçu",
  code: "Code",
  copy: "Copier",
  copied: "✓ Copié",
  copyToClipboard: "Copier dans le presse-papiers",
  live: "En direct",
  openFullScreen: "Ouvrir cet exemple en plein écran",
  open: "Ouvrir ↗",
  readTheDocs: "Lire la documentation →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Framework DOM léger à mises à jour explicites",
      description: "Nuclo est une bibliothèque DOM TypeScript légère et sans dépendance. Construisez l'interface avec des fonctions, mutez un état ordinaire, appelez update(). Ni DOM virtuel, ni proxies, ni signaux.",
      keywords: "nuclo, framework dom, valeurs dépendantes de l'état, mises à jour explicites, état mutable, javascript, typescript, framework ui, léger",
    },
    "apps/:id": {
      title: "Applications autonomes - Exemples Nuclo",
      description: "Exemples d'applications Nuclo interactives dans un espace de travail plein navigateur.",
    },
    desktop: {
      title: "Nuclo OS - Bureau",
      description: "Un bureau autonome avec des applications fonctionnelles — Fichiers, Notes, Terminal, Calculatrice, Minuteur, un tableau Kanban, Finances avec graphiques et tableur, et un Calendrier — et un système de fichiers simulé enregistré dans votre navigateur.",
    },
    docs: {
      title: "Documentation Nuclo - Guide et référence de l'API",
      description: "Documentation Nuclo : installation, constructeurs de balises, update() explicite, when() et list(), événements, cycle de vie, SSR et hydratation, CSS-in-TS typé et la référence complète de l'API.",
      keywords: "documentation nuclo, référence api, premiers pas, update, list, when, on",
    },
    examples: {
      title: "Exemples Nuclo - Compteur, liste de tâches, recherche et styles",
      description: "Exemples Nuclo en direct avec leur code source : un compteur, une liste de tâches, un filtre de recherche en temps réel et des styles CSS-in-TS typés.",
      keywords: "exemples nuclo, compteur, tâches, filtre de recherche, css-in-ts, démos en direct",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Exemples Nuclo`,
  exampleDescription: (desc: string) => `${desc} Un exemple Nuclo en direct avec son code source.`,
  exampleKeywords: (title: string) => `exemple nuclo, ${title.toLowerCase()}, démo en direct, code source`,
};
