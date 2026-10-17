import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "Dokumentation",
  title: "Nuclo-Dokumentation",
  lead: "Eine praktische Referenz: Nuclo installieren, mit expliziten Updates bauen, mit typisiertem CSS stylen und HTML serverseitig rendern.",
  quickStart: "Schnellstart",
  quickStartLink: "Schnellstart",
  nucloMark: "Nuclo-Logo",
  facts: { release: "Aktuelle Version", builders: "Tag-Builder", gzipped: "Kern, gzipped", model: "Runtime-Modell", modelValue: "Explizit" },
  filterSections: "Abschnitte filtern",
  filter: "Filter",
  closeNavigator: "Navigation schließen",
  docsSections: "Abschnitte der Dokumentation",
  docsNavigation: "Navigation der Dokumentation",
  onThisPage: "Auf dieser Seite",
  publicApi: "Öffentliche API",
  linkTo: (title: string) => `Link zu ${title}`,
  openExample: (title: string) => `Beispiel ${title} öffnen`,
  example: (title: string) => `Beispiel: ${title}`,
};
