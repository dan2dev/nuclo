import type { DocGroupText } from "../../pages/docs/content.ts";
import { GROUPS_1 } from "./docs-1.ts";
import { GROUPS_2 } from "./docs-2.ts";

export const GROUPS: DocGroupText[] = [...GROUPS_1, ...GROUPS_2];

// ── The docs page's chrome ──
export const LABELS = {
  documentation: "Documentación",
  title: "Documentación de Nuclo",
  lead: "Una referencia práctica para instalar Nuclo, construir con actualizaciones explícitas, dar estilo con CSS tipado y renderizar HTML en el servidor.",
  quickStart: "Inicio rápido",
  quickStartLink: "Inicio rápido",
  nucloMark: "Marca de Nuclo",
  facts: { release: "Versión actual", builders: "Constructores de etiquetas", gzipped: "Núcleo, con gzip", model: "Modelo de runtime", modelValue: "Explícito" },
  filterSections: "Filtrar secciones",
  filter: "Filtrar",
  closeNavigator: "Cerrar navegador",
  docsSections: "Secciones de la documentación",
  docsNavigation: "Navegación de la documentación",
  onThisPage: "En esta página",
  publicApi: "API pública",
  linkTo: (title: string) => `Enlace a ${title}`,
  openExample: (title: string) => `Abrir el ejemplo ${title}`,
  example: (title: string) => `Ejemplo: ${title}`,
};
