// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · zero dependências`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Construa interfaces", "*explícitas* com", "nuclo."];

export const HERO_DESC =
  "Um framework DOM pequeno e type-safe. O estado permanece simples e mutável. Você controla cada atualização. Sem proxies, sem signals, sem DOM virtual.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dependências" },
  { num: "175", sup: "",   label: "construtores HTML e SVG tipados" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "em gzip, runtime principal" },
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
  "Quando você muta o estado, nada acontece. Chame update(), e o Nuclo faz exatamente o que você pediu. Nem mais, nem menos.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Explícito é melhor que implícito",
    desc: "Nenhum proxy rastreia cada passo seu. Você muta o estado e depois chama update(). Causa e efeito permanecem claros e previsíveis.",
  },
  {
    num: "02",
    title: "Agrupe à vontade, atualize uma vez",
    desc: "Faça dez mutações e chame update() uma vez. O DOM vê apenas o estado final. Nenhuma renderização é desperdiçada.",
  },
  {
    num: "03",
    title: "Funções, não componentes",
    desc: "Construa com funções JavaScript simples. O Nuclo não precisa de classes, decorators nem sintaxe especial. Cada função retorna nós do DOM. Adicione onMount e onDestroy como modificadores comuns, só quando precisar.",
  },
];

export const FEATURES = [
  {
    num: "01 · Explícito",
    title: "Você é dono do ciclo de atualização",
    desc: "Mute à vontade e chame update() uma vez. O Nuclo não precisa de assinaturas nem de agendadores, e nunca te surpreende com um diff. O DOM sincroniza quando você decide.",
  },
  {
    num: "02 · Leve",
    title: "Zero dependências",
    desc: `Cerca de ${NUCLO_GZIP_KB} KB em gzip para o runtime principal. O Nuclo não precisa de compilador nem de plugins de build. Adicione um import e comece a construir.`,
  },
  {
    num: "03 · Tipado",
    title: "TypeScript em primeiro lugar",
    desc: "175 construtores HTML e SVG totalmente tipados dão autocompletar para cada atributo, propriedade de estilo e evento.",
  },
  {
    num: "04 · Preciso",
    title: "Patching granular",
    desc: "Expressões dinâmicas são reavaliadas no update(). Só os valores que realmente mudaram tocam o DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Mutar",
    title: "Altere seus dados",
    desc: "O estado é JavaScript simples: variáveis, arrays, objetos. Mute-o como quiser, quantas vezes quiser.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Confirmar",
    title: "Chame update()",
    desc: "Uma função global confirma suas alterações. Agrupe uma dúzia de mutações e confirme uma vez. Nada renderiza até você mandar.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Aplicar",
    title: "O Nuclo sincroniza o DOM",
    desc: "Cada expressão dinâmica é reavaliada. O Nuclo escreve no DOM só os valores que realmente mudaram. Sem diffing, sem re-renderizações.",
    code: `<span class="cm">// 2 nós atualizados,</span>
<span class="cm">// todo o resto intocado</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Sem diffing. Sem proxies. Sem surpresas.";
export const COMPARISON_SUB =
  "O Nuclo atualiza a interface só quando você chama update().";

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
      { good: false, text: "Compara as árvores antiga e nova para achar o que mudou" },
      { good: false, text: "Precisa de memoização para recuperar o desempenho" },
      { good: false, text: "Deixa closures obsoletas e arrays de dependências" },
    ],
  },
  {
    name: "Signals e proxies",
    sub: "signals · stores · effects",
    items: [
      { good: false, text: "Envolve seu estado em proxies e assinaturas" },
      { good: false, text: "Rastreia dependências de forma invisível, em tempo de execução" },
      { good: false, text: "Dispara atualizações em cascata em momentos que você não controla" },
      { good: false, text: "É difícil de percorrer passo a passo em um depurador" },
    ],
  },
  {
    name: "Nuclo",
    sub: "mutar → update()",
    featured: true,
    items: [
      { good: true, text: "Estado mutável simples, sem wrappers e sem proxies" },
      { good: true, text: "Uma chamada, update(), é todo o modelo mental" },
      { good: true, text: "Aplica só os valores que mudaram" },
      { good: true, text: `Cerca de ${NUCLO_GZIP_KB} KB, zero dependências, TypeScript em primeiro lugar` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Rápido onde importa.";
export const BENCHMARK_SUB =
  "Estes são números independentes do js-framework-benchmark, para criar, atualizar, trocar e limpar milhares de linhas.";

export const BENCHMARK_NOTE =
  "Esta pontuação é a lentidão relativa à implementação mais rápida medida. É uma média geométrica ponderada de todos os benchmarks keyed.";

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
  "Instale o Nuclo, importe uma vez e entregue UIs que atualizam exatamente quando você manda. Dá para aprender toda a API em uma tarde.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALAR",
    title: "Instalar",
    desc: "Adicione o Nuclo ao seu projeto com npm, pnpm, yarn ou bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTAR",
    title: "Importar",
    desc: "Um único import de efeito colateral registra todos os 175 construtores de tags globalmente.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - CONSTRUIR",
    title: "Construir",
    desc: "Escreva funções simples que retornam nós do DOM. Chame update() quando o estado mudar.",
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
  pipelineTitle: "Um ciclo explícito.",
  pipelineSub: "Valores dependentes de estado, sem grafo de dependências, sem agendador. Você decide quando eles rodam - um único caminho previsível dos seus dados até a tela.",
  philosophy: "Filosofia",
  features: "Recursos",
  featuresTitle: "Feito para a clareza.",
  featuresSub: "Sem mágica. Sem surpresas. Cada atualização é intencional.",
  comparison: "Comparação",
  theNucloWay: "o jeito nuclo",
  benchmarks: "Benchmarks",
  lowerIsBetter: "Menor é melhor",
  benchmarkSource: "Fonte: js-framework-benchmark",
  quickStart: "Início rápido",
  quickStartTitle: "Funcionando em minutos.",
  quickStartSub: "Três passos e você já está construindo UIs de verdade.",
  readFullDocs: "Leia a documentação completa →",
  examples: "Exemplos",
  examplesTitle: "Veja em ação.",
  examplesSub: "Demos interativas. Explore o código por trás de cada uma.",
  viewAllExamples: "Ver todos os exemplos →",
  readTheDocs: "Leia a documentação",
  addATask: "Adicionar uma tarefa…",
  add: "Adicionar",
  reset: "Zerar",
  // The hero card
  previousExample: "Exemplo anterior",
  nextExample: "Próximo exemplo",
  closeCodeView: "Fechar visualização do código",
  example: (n: number, title: string) => `Exemplo ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Pinte, depois aplique",
    note: "A grade da esquerda é um array simples de booleanos: pintá-la é uma mutação e nada mais. O DOM da direita só se move quando update() roda, e então só as células que mudaram são atualizadas.",
  },
  Draw: {
    title: "Desenhe a marca",
    note: "A marca do Nuclo é um espirógrafo: uma roda girando dentro de um anel, com duas canetas. A roda, seus braços, as canetas e as linhas são todos funções de um só número, t. A linha do tempo e o loop de quadros só definem t; update('draw') reexecuta o que o lê.",
  },
  Fireworks: {
    title: "Toque o céu",
    note: "Cada faísca é um objeto simples em um array. list() dá a cada uma um <line> e o descarta no quadro em que seu objeto sai do array. Um update() por quadro; nada é comparado.",
  },
  Waves: {
    title: "Dobre a onda",
    note: "O d de cada path é uma função simples de três números. Os controles deslizantes e o loop de quadros só alteram os números; update('waves') reexecuta as funções que os leem.",
  },
  Sort: {
    title: "Ordenado, nunca reconstruído",
    note: "O bubble sort troca objetos em um array simples. list() associa cada barra ao seu objeto, então update() move os nós existentes para a nova ordem. Observe o contador: nenhuma barra é recriada.",
  },
  Chase: {
    title: "Guie a corda",
    note: "O cartão é um scope(). Cada quadro move 32 pontos simples e chama update('chase'): o Nuclo recalcula os atributos deste cartão e deixa o resto da página em paz.",
  },
  Reflex: {
    title: "Toque no verde",
    note: "Uma única string decide o que o palco mostra. Cada ramo de when() é construído quando sua condição se torna verdadeira e removido quando deixa de ser; a classe do palco é uma função da mesma string.",
  },
  Warp: {
    title: "Segure para distorcer",
    note: "onMount inicia o loop de quadros e retorna sua limpeza. Desmonte o campo e o Nuclo executa essa limpeza: o loop para e nada fica rodando.",
  },
  Life: {
    title: "Jogo da Vida",
    note: "O tabuleiro é um array simples de idades. Um tick calcula o próximo e chama update(); a classe de cada célula é uma função da sua idade, então só as células que mudaram são atualizadas.",
  },
};
