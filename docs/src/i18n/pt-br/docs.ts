import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "Documentação",
  title: "Documentação do Nuclo",
  lead: "Uma referência prática para instalar o Nuclo, construir com atualizações explícitas, estilizar com CSS tipado e renderizar HTML no servidor.",
  quickStart: "Início rápido",
  quickStartLink: "Início rápido",
  nucloMark: "Marca do Nuclo",
  facts: { release: "Versão atual", builders: "Construtores de tags", gzipped: "Núcleo, em gzip", model: "Modelo de runtime", modelValue: "Explícito" },
  filterSections: "Filtrar seções",
  filter: "Filtrar",
  closeNavigator: "Fechar navegador",
  docsSections: "Seções da documentação",
  docsNavigation: "Navegação da documentação",
  onThisPage: "Nesta página",
  publicApi: "API pública",
  linkTo: (title: string) => `Link para ${title}`,
  openExample: (title: string) => `Abrir o exemplo ${title}`,
  example: (title: string) => `Exemplo: ${title}`,
};
