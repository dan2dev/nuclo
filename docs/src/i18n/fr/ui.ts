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
  switchTheme: "Basculer entre thème clair et sombre",
  language: "Langue",
};

export const footer = {
  tagline: "Le runtime UI qui joue cartes sur table : de simples fonctions, un état mutable, et un seul appel pour relier vos données au DOM.",
  builtWith: "Ce site est lui-même construit avec Nuclo.",
  explore: "Explorer",
  documentation: "Documentation",
  examples: "Exemples",
  readme: "README",
  project: "Projet",
  github: "GitHub",
  license: "Licence MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · Licence MIT",
};

export const app = {
  failedToLoad: "Impossible de charger la page",
  loadingLanguage: "Chargement de la langue…",
  notFound: "Page introuvable",
  notFoundHint: "Il n'y a rien à cette adresse.",
  goHome: "Retour à l'accueil",
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
  readTheDocs: "Lire la doc →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Un framework DOM léger, des mises à jour explicites",
      description: "Nuclo, c'est une bibliothèque DOM TypeScript légère, sans aucune dépendance. Vous écrivez l'UI avec des fonctions, vous modifiez un état tout simple, vous appelez update(). Pas de DOM virtuel, pas de proxies, pas de signaux.",
      keywords: "nuclo, framework dom, valeurs dépendantes de l'état, mises à jour explicites, état mutable, javascript, typescript, framework ui, léger",
    },
    "apps/:id": {
      title: "Applications standalone - Exemples Nuclo",
      description: "Des applications Nuclo interactives, dans un espace de travail qui prend toute la fenêtre du navigateur.",
    },
    desktop: {
      title: "Nuclo OS - Bureau",
      description: "Un bureau autonome et ses vraies applications : Fichiers, Notes, Terminal, Calculatrice, Minuteur, tableau Kanban, Finances (graphiques et tableur) et Calendrier, le tout sur un système de fichiers simulé, stocké dans votre navigateur.",
    },
    docs: {
      title: "Documentation Nuclo - Guide et référence API",
      description: "La doc de Nuclo : installation, constructeurs de balises, update() explicite, when() et list(), événements, cycle de vie, SSR et hydratation, CSS-in-TS typé, et la référence complète de l'API.",
      keywords: "documentation nuclo, référence api, premiers pas, update, list, when, on",
    },
    examples: {
      title: "Exemples Nuclo - Compteur, todo list, recherche et styles",
      description: "Des exemples Nuclo qui tournent en direct, code source à l'appui : un compteur, une todo list, une recherche filtrée en temps réel et du CSS-in-TS typé.",
      keywords: "exemples nuclo, compteur, todo list, filtre de recherche, css-in-ts, démos en direct",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Exemples Nuclo`,
  exampleDescription: (desc: string) => `${desc} Un exemple Nuclo à tester en direct, avec son code source.`,
  exampleKeywords: (title: string) => `exemple nuclo, ${title.toLowerCase()}, démo en direct, code source`,
};
