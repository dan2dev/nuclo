// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · zero dependências`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Construa interfaces", "*explícitas*", "com o nuclo."];

export const HERO_DESC =
  "Um framework DOM pequeno e totalmente tipado. O estado continua sendo JavaScript puro e mutável, e cada atualização acontece quando você decide. Sem proxies, sem signals, sem DOM virtual.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dependências" },
  { num: "175", sup: "",   label: "builders HTML e SVG tipados" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzip, só o runtime" },
];

export const COUNTER_TEASER_CODE = `import 'nuclo'

let count = 0

export function Counter() {
  return div(
    span(() => count),
    button("-", { onClick: () => { count--; update() } }),
    button("Reset", { onClick: () => { count = 0; update() } }),
    button("+", { onClick: () => { count++; update() } }),
  )
}`;

export const TODO_TEASER_CODE = `import 'nuclo'

interface Todo {
  text: string
  done: boolean
}

let todos: Todo[] = []
let text = ''

function addTodo() {
  if (!text.trim()) return
  todos.push({ text, done: false })
  text = ''
  update()
}

export function TodoList() {
  return div(
    input(
      { placeholder: 'Add a task…' },
      { onInput: (e) => { text = (e.target as HTMLInputElement).value } },
      { onKeyDown: (e) => { if (e.key === 'Enter') addTodo() } },
    ),
    button('Add', { onClick: addTodo }),
    list(
      () => todos,
      (todo) => div(
        input(
          { type: 'checkbox' },
          { checked: () => todo.done },
          { onChange: () => { todo.done = !todo.done; update() } },
        ),
        span(todo.text),
      ),
    ),
  )
}`;

export const PHILOSOPHY_QUOTE =
  "Mudar o estado não faz nada acontecer. Chamou update(), o Nuclo faz exatamente o que você pediu. Nem mais, nem menos.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Explícito é melhor que implícito",
    desc: "Nenhum proxy vigiando cada passo seu. Você muda o estado e depois chama update(). Causa e efeito ficam à vista, sem mistério.",
  },
  {
    num: "02",
    title: "Mude à vontade, atualize uma vez",
    desc: "Faça dez mutações e chame update() uma vez só. O DOM enxerga apenas o resultado final, e nenhum render é desperdiçado.",
  },
  {
    num: "03",
    title: "Funções, não componentes",
    desc: "Escreva funções JavaScript comuns. Nada de classes, decorators ou sintaxe própria: cada função devolve nós do DOM. Precisou de onMount ou onDestroy? Entram como modificadores normais, só quando fizerem falta.",
  },
];

export const FEATURES = [
  {
    num: "01 · Explícito",
    title: "O ciclo de atualização é seu",
    desc: "Mude o estado à vontade e chame update() uma vez. Sem subscriptions e sem scheduler: o Nuclo nunca surpreende você com um diff. O DOM é sincronizado quando você decide.",
  },
  {
    num: "02 · Leve",
    title: "Zero dependências",
    desc: `Cerca de ${NUCLO_GZIP_KB} KB em gzip no runtime principal. Sem compilador, sem plugin de build: é só adicionar um import e começar.`,
  },
  {
    num: "03 · Tipado",
    title: "TypeScript em primeiro lugar",
    desc: "São 175 builders de HTML e SVG totalmente tipados, com autocomplete para cada atributo, propriedade de estilo e evento.",
  },
  {
    num: "04 · Preciso",
    title: "Atualizações cirúrgicas",
    desc: "As expressões dinâmicas são reavaliadas no update(), mas só o que de fato mudou chega ao DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Alterar",
    title: "Mude os seus dados",
    desc: "O estado é JavaScript puro: variáveis, arrays, objetos. Mude do jeito que quiser, quantas vezes quiser.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Confirmar",
    title: "Chame update()",
    desc: "Uma função global confirma as mudanças. Faça uma dúzia de mutações e confirme de uma vez. Nada é renderizado até você mandar.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Aplicar",
    title: "O Nuclo sincroniza o DOM",
    desc: "Cada expressão dinâmica é reavaliada e o Nuclo escreve no DOM só o que realmente mudou. Sem diffing, sem re-render.",
    code: `<span class="cm">// 2 nós atualizados,</span>
<span class="cm">// todo o resto intocado</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Sem diff. Sem proxy. Sem susto.";
export const COMPARISON_SUB =
  "A interface só muda quando você chama update().";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "DOM virtual",
    sub: "render → diff → commit",
    items: [
      { good: false, text: "Re-renderiza árvores de componentes a cada mudança de estado" },
      { good: false, text: "Compara a árvore antiga com a nova para descobrir o que mudou" },
      { good: false, text: "Pede memoização para recuperar a performance" },
      { good: false, text: "Obriga a lidar com stale closures e arrays de dependências" },
    ],
  },
  {
    name: "Signals e proxies",
    sub: "signals · stores · effects",
    items: [
      { good: false, text: "Envolve o seu estado em proxies e subscriptions" },
      { good: false, text: "Rastreia dependências por baixo dos panos, em runtime" },
      { good: false, text: "Dispara atualizações em cascata, em momentos que você não controla" },
      { good: false, text: "É difícil de depurar passo a passo" },
    ],
  },
  {
    name: "Nuclo",
    sub: "alterar → update()",
    featured: true,
    items: [
      { good: true, text: "Estado mutável puro, sem wrappers e sem proxies" },
      { good: true, text: "O modelo mental inteiro cabe em uma chamada: update()" },
      { good: true, text: "Aplica só o que mudou" },
      { good: true, text: `Cerca de ${NUCLO_GZIP_KB} KB, zero dependências, TypeScript em primeiro lugar` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Rápido onde importa.";
export const BENCHMARK_SUB =
  "Números do js-framework-benchmark, medidos por terceiros: criar, atualizar, trocar e limpar milhares de linhas.";

export const BENCHMARK_NOTE =
  "A nota mostra quanto cada implementação fica atrás da mais rápida medida. É a média geométrica ponderada de todos os benchmarks keyed.";

export const BENCHMARK_SOURCE_URL =
  "https://krausest.github.io/js-framework-benchmark/2026/chrome152.html";

export const BENCHMARK_SOURCE_LABEL = "js-framework-benchmark · keyed";

/** Weighted geometric mean per framework (keyed implementations, lower is better). */
export const BENCHMARK_ENTRIES: {
  name: string;
  version: string;
  score: number;
  featured?: boolean;
}[] = [
  { name: "Nuclo",    version: "0.2.24", score: 1.12, featured: true },
  { name: "Solid",    version: "1.9.3",  score: 1.13 },
  { name: "Svelte",   version: "5.42.1", score: 1.17 },
  { name: "Vue",      version: "3.5.39", score: 1.31 },
  { name: "Riot",     version: "10.1.2", score: 1.54 },
  { name: "React",    version: "19.2.0", score: 1.58 },
  { name: "Angular",  version: "22.0.0", score: 1.58 },
  { name: "Stencil",  version: "4.23.0", score: 1.81 },
  { name: "Ember",    version: "7.3.0-alpha.5", score: 2.06 },
  { name: "Knockout", version: "3.5.1",  score: 2.26 },
  { name: "Qwik",     version: "1.11.0", score: 3.29 },
];

// ── CTA ─────────────────────────────────────────────────────────────────────
export const CTA_TITLE = "Pronto quando você estiver.";
export const CTA_SUB =
  "Instale o Nuclo, importe uma vez e entregue UIs que atualizam exatamente quando você decide. A API inteira se aprende numa tarde.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALAR",
    title: "Instalar",
    desc: "Adicione o Nuclo ao projeto com npm, pnpm, yarn ou bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTAR",
    title: "Importar",
    desc: "Um único import com side effect registra os 175 builders de tags globalmente.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - CONSTRUIR",
    title: "Construir",
    desc: "Escreva funções simples que devolvem nós do DOM e chame update() quando o estado mudar.",
    code: `<span class="kw">let</span> <span class="pr">name</span> <span class="pt">=</span> <span class="st">'World'</span>

<span class="kw">const</span> <span class="pr">app</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">h1</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Hello, </span><span class="pt">\${</span><span class="pr">name</span><span class="pt">}\`),</span>
  <span class="fn">button</span><span class="pt">(</span>
    <span class="st">"Change"</span><span class="pt">,</span>
    <span class="pt">{</span> <span class="pr">onClick</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span>
      <span class="pr">name</span> <span class="pt">=</span> <span class="st">'Nuclo'</span>
      <span class="fn">update</span><span class="pt">()</span>
    <span class="pt">} }</span>
  <span class="pt">)</span>
<span class="pt">)</span>`,
    lang: "app.ts",
  },
];

// ── Section chrome: headings, buttons and labels written inline in home/components.ts ──
export const LABELS = {
  getStarted: "Começar",
  viewExamples: "Ver exemplos",
  copyInstall: "Copiar comando de instalação",
  howItWorks: "Como funciona",
  pipelineTitle: "Um único ciclo, explícito.",
  pipelineSub: "Valores que dependem do estado, sem grafo de dependências e sem scheduler. Você decide quando rodam: um caminho único e previsível dos seus dados até a tela.",
  philosophy: "Filosofia",
  features: "Recursos",
  featuresTitle: "Feito para ser claro.",
  featuresSub: "Sem mágica, sem surpresa. Cada atualização é intencional.",
  comparison: "Comparação",
  theNucloWay: "o jeito nuclo",
  benchmarks: "Benchmarks",
  lowerIsBetter: "Menor é melhor",
  benchmarkSource: "Fonte: js-framework-benchmark",
  quickStart: "Início rápido",
  quickStartTitle: "No ar em minutos.",
  quickStartSub: "Três passos e você já está montando UI de verdade.",
  readFullDocs: "Ler a documentação completa →",
  examples: "Exemplos",
  examplesTitle: "Veja funcionando.",
  examplesSub: "Demos interativas, com o código de cada uma à mostra.",
  viewAllExamples: "Ver todos os exemplos →",
  readTheDocs: "Ler a documentação",
  addATask: "Adicionar uma tarefa…",
  add: "Adicionar",
  reset: "Zerar",
  // The hero card
  previousExample: "Exemplo anterior",
  nextExample: "Próximo exemplo",
  closeCodeView: "Fechar o código",
  example: (n: number, title: string) => `Exemplo ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Pinte, depois aplique",
    note: "A grade da esquerda é um array de booleanos: pintar é só mutar o array, e pronto. O DOM da direita só muda quando update() roda, e aí só as células que mudaram são atualizadas.",
  },
  Draw: {
    title: "Desenhe a marca",
    note: "A marca do Nuclo é um espirógrafo: uma roda girando dentro de um anel, com duas canetas. Roda, braços, canetas e traços são funções de um único número, t. A timeline e o loop de frames só definem t; update('draw') reexecuta o que lê esse valor.",
  },
  Fireworks: {
    title: "Toque o céu",
    note: "Cada faísca é um objeto num array. O list() dá um <line> a cada uma e o descarta no frame em que o objeto sai do array. Um update() por frame, sem comparar nada.",
  },
  Waves: {
    title: "Dobre a onda",
    note: "O d de cada path é uma função de três números. Os sliders e o loop de frames só mexem nos números; update('waves') reexecuta as funções que os leem.",
  },
  Sort: {
    title: "Reordenado, nunca recriado",
    note: "O bubble sort troca objetos de lugar num array. O list() associa cada barra ao seu objeto, então o update() só move os nós existentes para a nova ordem. Olhe o contador: nenhuma barra é recriada.",
  },
  Chase: {
    title: "Conduza a corda",
    note: "O card é um scope(). A cada frame, 32 pontos se movem e update('chase') é chamado: o Nuclo recalcula os atributos desse card e deixa o resto da página em paz.",
  },
  Reflex: {
    title: "Toque no verde",
    note: "Uma única string decide o que o palco mostra. Cada ramo de when() é montado quando sua condição vira verdadeira e removido quando deixa de ser. A classe do palco é função da mesma string.",
  },
  Warp: {
    title: "Segure para entrar em warp",
    note: "onMount inicia o loop de frames e devolve uma função de cleanup. Desmontou o campo, o Nuclo roda o cleanup: o loop para e nada fica rodando por aí.",
  },
  Life: {
    title: "Jogo da Vida",
    note: "O tabuleiro é um array de idades. Um tick calcula o próximo estado e chama update(). A classe de cada célula é função da idade dela, então só as células que mudaram são atualizadas.",
  },
};
