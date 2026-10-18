import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "Documentation",
  title: "Nuclo Docs",
  lead: "Nuclo install करने से लेकर explicit updates के साथ UI बनाने, typed CSS से styling करने और server पर HTML render करने तक, सब कुछ एक जगह।",
  quickStart: "Quick start",
  quickStartLink: "Quick start",
  nucloMark: "Nuclo logo",
  facts: { release: "Latest release", builders: "Tag builders", gzipped: "Core, gzipped", model: "Runtime model", modelValue: "Explicit" },
  filterSections: "Sections filter करें",
  filter: "Filter",
  closeNavigator: "Navigator बंद करें",
  docsSections: "Docs के sections",
  docsNavigation: "Docs navigation",
  onThisPage: "इस पेज पर",
  publicApi: "Public API",
  linkTo: (title: string) => `${title} का link`,
  openExample: (title: string) => `${title} example खोलें`,
  example: (title: string) => `Example: ${title}`,
};
