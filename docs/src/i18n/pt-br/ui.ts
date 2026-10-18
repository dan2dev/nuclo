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
  opensInNewTab: " (abre em nova aba)",
  switchTheme: "Alternar entre tema claro e escuro",
  language: "Idioma",
};

export const footer = {
  tagline: "Runtime de UI com atualizações explícitas. Funções simples, estado mutável e uma única chamada entre os seus dados e o DOM.",
  builtWith: "Este site foi feito com Nuclo.",
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
  failedToLoad: "Não foi possível carregar a página",
  notFound: "Página não encontrada",
  notFoundHint: "Aqui não tem nada.",
  goHome: "Voltar para o início",
  loadingLanguage: "Carregando o idioma…",
};

// Shared by the docs' live frames, the examples and the home teasers.
export const common = {
  preview: "Pré-visualização",
  code: "Código",
  copy: "Copiar",
  copied: "✓ Copiado",
  copyToClipboard: "Copiar para a área de transferência",
  live: "Ao vivo",
  openFullScreen: "Abrir em tela cheia",
  open: "Abrir ↗",
  readTheDocs: "Leia a documentação →",
};

export const seo = {
  routes: {
    home: {
      title: "Nuclo - Framework DOM leve, com atualizações explícitas",
      description: "Nuclo é uma lib de DOM em TypeScript, leve e sem dependências. Monte a UI com funções, mude o estado como quiser e chame update(). Sem DOM virtual, sem proxies, sem signals.",
      keywords: "nuclo, framework dom, valores dependentes de estado, atualizações explícitas, estado mutável, javascript, typescript, framework de ui, leve",
    },
    "apps/:id": {
      title: "Apps standalone - Exemplos do Nuclo",
      description: "Apps Nuclo interativos, rodando em um workspace que ocupa a janela inteira do navegador.",
    },
    desktop: {
      title: "Nuclo OS - Desktop",
      description: "Um desktop standalone com apps que funcionam de verdade: Arquivos, Notas, Terminal, Calculadora, Timer, quadro Kanban, Finanças com gráficos e planilha, e Calendário. Tudo sobre um sistema de arquivos simulado, salvo no seu navegador.",
    },
    docs: {
      title: "Documentação do Nuclo - Guia e referência da API",
      description: "Documentação do Nuclo: instalação, construtores de tags, update() explícito, when() e list(), eventos, ciclo de vida, SSR e hydration, CSS-in-TS tipado e a referência completa da API.",
      keywords: "documentação nuclo, referência da api, primeiros passos, update, list, when, on",
    },
    examples: {
      title: "Exemplos do Nuclo - Contador, Lista de Tarefas, Busca e Estilização",
      description: "Exemplos do Nuclo rodando ao vivo, com o código-fonte ao lado: contador, lista de tarefas, filtro de busca em tempo real e estilização com CSS-in-TS tipado.",
      keywords: "exemplos nuclo, contador, tarefas, filtro de busca, css-in-ts, demos ao vivo",
    },
  } as Record<string, { title: string; description: string; keywords?: string }>,
  exampleTitle: (title: string) => `${title} - Exemplos do Nuclo`,
  exampleDescription: (desc: string) => `${desc} Exemplo do Nuclo rodando ao vivo, com o código-fonte.`,
  exampleKeywords: (title: string) => `exemplo nuclo, ${title.toLowerCase()}, demo ao vivo, código-fonte`,
};
