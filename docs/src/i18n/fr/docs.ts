import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "Documentation",
  title: "Documentation Nuclo",
  lead: "De l'installation de Nuclo à la référence complète : mises à jour explicites, styles CSS typés, génération de HTML côté serveur. Tout ce qu'il faut pour se lancer.",
  quickStart: "Démarrage rapide",
  quickStartLink: "Démarrage rapide",
  nucloMark: "Logo Nuclo",
  facts: { release: "Version actuelle", builders: "Constructeurs de balises", gzipped: "Runtime principal, gzippé", model: "Modèle d'exécution", modelValue: "Explicite" },
  filterSections: "Chercher dans les sections",
  filter: "Filtrer",
  closeNavigator: "Fermer la navigation",
  docsSections: "Sections de la documentation",
  docsNavigation: "Navigation de la documentation",
  onThisPage: "Dans cette page",
  publicApi: "API publique",
  linkTo: (title: string) => `Lien vers ${title}`,
  openExample: (title: string) => `Ouvrir l'exemple ${title}`,
  example: (title: string) => `Exemple : ${title}`,
};
