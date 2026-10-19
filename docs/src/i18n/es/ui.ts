// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Inicio",
  docs: "Documentación",
  examples: "Ejemplos",
  getStarted: "Empezar",
  menu: "Menú",
  main: "Principal",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  nucloHome: "Inicio de Nuclo",
  nucloOnGitHub: "Nuclo en GitHub",
  opensInNewTab: " (se abre en una pestaña nueva)",
  switchTheme: "Cambiar tema de color",
  language: "Idioma",
};

export const footer = {
  tagline: "El runtime de interfaces con actualizaciones explícitas: funciones simples, estado mutable y una sola llamada entre tus datos y el DOM.",
  builtWith: "Este sitio está hecho con Nuclo.",
  explore: "Explorar",
  documentation: "Documentación",
  examples: "Ejemplos",
  readme: "README",
  project: "Proyecto",
  github: "GitHub",
  license: "Licencia MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · Licencia MIT",
};

export const app = {
  failedToLoad: "No se pudo cargar la página",
  notFound: "Página no encontrada",
  notFoundHint: "No hay nada en esta dirección.",
  goHome: "Volver al inicio",
  loadingLanguage: "Cargando idioma…",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Vista previa",
  code: "Código",
  copy: "Copiar",
  copied: "✓ Copiado",
  copyToClipboard: "Copiar al portapapeles",
  live: "En vivo",
  openFullScreen: "Abrir este ejemplo a pantalla completa",
  open: "Abrir ↗",
  readTheDocs: "Leer la documentación →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Framework DOM ligero con actualizaciones explícitas",
      description: "Nuclo es una biblioteca DOM ligera y sin dependencias, escrita en TypeScript. Construye la UI con funciones, modifica el estado y llama a update(). Sin virtual DOM, sin proxies, sin signals.",
      keywords: "nuclo, framework dom, valores dependientes del estado, actualizaciones explícitas, estado mutable, javascript, typescript, framework ui, ligero",
    },
    "apps/:id": {
      title: "Apps independientes - Ejemplos de Nuclo",
      description: "Apps de Nuclo interactivas, listas para explorar en un espacio de trabajo a pantalla completa del navegador.",
    },
    desktop: {
      title: "Nuclo OS - Escritorio",
      description: "Un escritorio independiente con apps que funcionan de verdad (Archivos, Notas, Terminal, Calculadora, Temporizador, un tablero Kanban, Finanzas con gráficos y hoja de cálculo, y un Calendario) sobre un sistema de archivos simulado que se guarda en tu navegador.",
    },
    docs: {
      title: "Documentación de Nuclo - Guía y referencia de API",
      description: "La documentación de Nuclo: instalación, funciones constructoras de etiquetas, llamadas explícitas a update(), when() y list(), eventos, ciclo de vida, SSR e hidratación, CSS-in-TS tipado y la referencia completa de la API.",
      keywords: "documentación nuclo, referencia de api, primeros pasos, update, list, when, on",
    },
    examples: {
      title: "Ejemplos de Nuclo - Contador, lista de tareas, búsqueda y estilos",
      description: "Ejemplos de Nuclo en vivo, con su código fuente: un contador, una lista de tareas, un filtro de búsqueda en tiempo real y estilos con CSS-in-TS tipado.",
      keywords: "ejemplos nuclo, contador, tareas, filtro de búsqueda, css-in-ts, demos en vivo",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Ejemplos de Nuclo`,
  exampleDescription: (desc: string) => `${desc} Ejemplo de Nuclo en vivo, con su código fuente.`,
  exampleKeywords: (title: string) => `ejemplo nuclo, ${title.toLowerCase()}, demo en vivo, código fuente`,
};
