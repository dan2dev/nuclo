import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "Documentazione",
  title: "Documentazione di Nuclo",
  lead: "Una guida pratica per installare Nuclo, costruire UI con aggiornamenti espliciti, scrivere stili in CSS tipizzato e fare il render dell'HTML lato server.",
  quickStart: "Quick start",
  quickStartLink: "Quick start",
  nucloMark: "Marchio Nuclo",
  facts: { release: "Versione attuale", builders: "Builder di tag", gzipped: "Core, gzip", model: "Modello di runtime", modelValue: "Esplicito" },
  filterSections: "Filtra le sezioni",
  filter: "Filtra",
  closeNavigator: "Chiudi la navigazione",
  docsSections: "Sezioni della documentazione",
  docsNavigation: "Navigazione della documentazione",
  onThisPage: "In questa pagina",
  publicApi: "API pubblica",
  linkTo: (title: string) => `Link a ${title}`,
  openExample: (title: string) => `Apri l'esempio ${title}`,
  example: (title: string) => `Esempio: ${title}`,
};
