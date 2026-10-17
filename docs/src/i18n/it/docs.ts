import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "Documentazione",
  title: "Documentazione di Nuclo",
  lead: "Un riferimento pratico per installare Nuclo, costruire con aggiornamenti espliciti, applicare stili con CSS tipizzato e renderizzare HTML lato server.",
  quickStart: "Avvio rapido",
  quickStartLink: "Avvio rapido",
  nucloMark: "Marchio Nuclo",
  facts: { release: "Versione attuale", builders: "Builder di tag", gzipped: "Core, gzip", model: "Modello di runtime", modelValue: "Esplicito" },
  filterSections: "Filtra le sezioni",
  filter: "Filtra",
  closeNavigator: "Chiudi il pannello di navigazione",
  docsSections: "Sezioni della documentazione",
  docsNavigation: "Navigazione della documentazione",
  onThisPage: "In questa pagina",
  publicApi: "API pubblica",
  linkTo: (title: string) => `Link a ${title}`,
  openExample: (title: string) => `Apri l'esempio ${title}`,
  example: (title: string) => `Esempio: ${title}`,
};
