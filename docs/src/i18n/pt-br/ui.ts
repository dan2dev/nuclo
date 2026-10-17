// ui.ts: the chrome's text, in the main bundle. Header, footer, app shell, SEO
// meta and the labels shared by every page. pt/ui.ts and es/ui.ts mirror it.

export const nav = {
  home: "Início",
  docs: "Documentação",
  examples: "Exemplos",
  getStarted: "Começar",
  menu: "Menu",
  main: "Principal",
  openMenu: "Abrir menu",
  closeMenu: "Fechar menu",
  nucloHome: "Página inicial do Nuclo",
  nucloOnGitHub: "Nuclo no GitHub",
  opensInNewTab: " (abre em uma nova aba)",
  switchTheme: "Alternar tema de cores",
  theme: "Tema",
  themes: { light: "Claro", dark: "Escuro", system: "Sistema" },
  language: "Idioma",
};

export const footer = {
  tagline: "O runtime de UI explícito. Funções simples, estado mutável e uma chamada entre seus dados e o DOM.",
  builtWith: "Este site é construído com Nuclo.",
  explore: "Explorar",
  documentation: "Documentação",
  examples: "Exemplos",
  readme: "README",
  project: "Projeto",
  github: "GitHub",
  license: "Licença MIT",
  fineprint: "© 2026 Danilo Castro (@dan2dev) · Licença MIT",
};

export const app = {
  failedToLoad: "Falha ao carregar a página",
  notFound: "Página não encontrada",
  notFoundHint: "Não há nada neste endereço.",
  goHome: "Ir para a página inicial",
  loadingLanguage: "Carregando idioma…",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Pré-visualização",
  code: "Código",
  copy: "Copiar",
  copied: "✓ Copiado",
  copyToClipboard: "Copiar para a área de transferência",
  live: "Ao vivo",
  openFullScreen: "Abrir este exemplo em tela cheia",
  open: "Abrir ↗",
  readTheDocs: "Leia a documentação →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Framework DOM leve com atualizações explícitas",
      description: "Nuclo é uma biblioteca DOM em TypeScript, leve e sem dependências. Construa a UI com funções, mute o estado simples e chame update(). Sem DOM virtual, proxies ou signals.",
      keywords: "nuclo, framework dom, valores dependentes de estado, atualizações explícitas, estado mutável, javascript, typescript, framework de ui, leve",
    },
    "apps/:id": {
      title: "Apps independentes - Exemplos do Nuclo",
      description: "Exemplos interativos de apps Nuclo em um espaço de trabalho de navegador inteiro.",
    },
    desktop: {
      title: "Nuclo OS - Desktop",
      description: "Um desktop independente com apps funcionais — Arquivos, Notas, Terminal, Calculadora, Timer, um quadro Kanban, Finanças com gráficos e uma planilha, e um Calendário — e um sistema de arquivos simulado salvo no seu navegador.",
    },
    docs: {
      title: "Documentação do Nuclo - Guia e referência da API",
      description: "Documentação do Nuclo: instalação, construtores de tags, update() explícito, when() e list(), eventos, ciclo de vida, SSR e hidratação, CSS-in-TS tipado e a referência completa da API.",
      keywords: "documentação nuclo, referência da api, primeiros passos, update, list, when, on",
    },
    examples: {
      title: "Exemplos do Nuclo - Contador, Lista de Tarefas, Busca e Estilização",
      description: "Exemplos ao vivo do Nuclo com código-fonte: um contador, uma lista de tarefas, um filtro de busca em tempo real e estilização com CSS-in-TS tipado.",
      keywords: "exemplos nuclo, contador, tarefas, filtro de busca, css-in-ts, demos ao vivo",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Exemplos do Nuclo`,
  exampleDescription: (desc: string) => `${desc} Um exemplo ao vivo do Nuclo com seu código-fonte.`,
  exampleKeywords: (title: string) => `exemplo nuclo, ${title.toLowerCase()}, demo ao vivo, código-fonte`,
};
