// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · cero dependencias`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Construye interfaces", "con actualizaciones", "*explícitas* en nuclo."];

export const HERO_DESC =
  "Un framework DOM pequeño y con tipado seguro. El estado se mantiene simple y mutable. Tú controlas cada actualización. Sin proxies, sin señales, sin DOM virtual.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dependencias" },
  { num: "175", sup: "",   label: "funciones HTML y SVG tipadas" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "runtime principal, con gzip" },
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
  "Cuando mutas el estado, no pasa nada. Llama a update() y Nuclo hace exactamente lo que le pediste. Ni más, ni menos.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Explícito es mejor que implícito",
    desc: "Ningún proxy sigue cada uno de tus movimientos. Mutas el estado y luego llamas a update(). Causa y efecto siguen siendo claros y predecibles.",
  },
  {
    num: "02",
    title: "Agrupa libremente, actualiza una vez",
    desc: "Haz diez mutaciones y luego llama a update() una sola vez. El DOM solo ve el estado final. Sin renderizados innecesarios.",
  },
  {
    num: "03",
    title: "Funciones, no componentes",
    desc: "Construye con funciones JavaScript simples. Nuclo no necesita clases, decoradores ni sintaxis especial. Cada función devuelve nodos DOM. Añade onMount y onDestroy como modificadores normales, solo cuando los necesites.",
  },
];

export const FEATURES = [
  {
    num: "01 · Explícito",
    title: "Tú controlas el ciclo de actualización",
    desc: "Muta libremente y luego llama a update() una vez. Nuclo no necesita suscripciones ni planificadores, y nunca te sorprende con un diff. El DOM se sincroniza cuando tú lo decides.",
  },
  {
    num: "02 · Ligero",
    title: "Cero dependencias",
    desc: `Unos ${NUCLO_GZIP_KB} KB con gzip para el runtime principal. Nuclo no necesita compilador ni plugins de build. Añade un import y empieza a construir.`,
  },
  {
    num: "03 · Tipado",
    title: "Diseñado para TypeScript",
    desc: "175 funciones constructoras de etiquetas HTML y SVG completamente tipadas te dan autocompletado para cada atributo, propiedad de estilo y evento.",
  },
  {
    num: "04 · Preciso",
    title: "Actualizaciones precisas del DOM",
    desc: "Las expresiones dinámicas se reevalúan en update(). Solo los valores que realmente cambiaron tocan el DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Mutar",
    title: "Cambia tus datos",
    desc: "El estado es JavaScript simple: variables, arrays, objetos. Mútalo como quieras, tantas veces como quieras.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Confirmar",
    title: "Llama a update()",
    desc: "Una función global confirma tus cambios. Agrupa una docena de mutaciones y confirma una sola vez. Nada se renderiza hasta que tú lo digas.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Parchear",
    title: "Nuclo sincroniza el DOM",
    desc: "Cada expresión dinámica se reevalúa. Nuclo escribe en el DOM solo los valores que realmente cambiaron. Sin diffing, sin re-renders.",
    code: `<span class="cm">// 2 nodos parcheados,</span>
<span class="cm">// todo lo demás intacto</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Sin diffing. Sin proxies. Sin sorpresas.";
export const COMPARISON_SUB =
  "Nuclo actualiza la interfaz solo cuando llamas a update().";

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
      { good: false, text: "Re-renderiza árboles de componentes en cada cambio de estado" },
      { good: false, text: "Compara el árbol viejo y el nuevo para hallar qué cambió" },
      { good: false, text: "Necesita memoización para recuperar rendimiento" },
      { good: false, text: "Deja closures obsoletos y arrays de dependencias" },
    ],
  },
  {
    name: "Señales y proxies",
    sub: "señales · stores · efectos",
    items: [
      { good: false, text: "Envuelve tu estado en proxies y suscripciones" },
      { good: false, text: "Rastrea dependencias de forma invisible, en tiempo de ejecución" },
      { good: false, text: "Encadena actualizaciones en cascada con tiempos que no controlas" },
      { good: false, text: "Es difícil de recorrer paso a paso en un depurador" },
    ],
  },
  {
    name: "Nuclo",
    sub: "mutar → update()",
    featured: true,
    items: [
      { good: true, text: "Estado mutable simple, sin envoltorios ni proxies" },
      { good: true, text: "Una sola llamada, update(), es todo el modelo mental" },
      { good: true, text: "Parchea solo los valores que cambiaron" },
      { good: true, text: `Unos ${NUCLO_GZIP_KB} KB, cero dependencias, Diseñado para TypeScript` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Rápido donde importa.";
export const BENCHMARK_SUB =
  "Estas son cifras independientes de js-framework-benchmark, para crear, actualizar, intercambiar y vaciar miles de filas.";

export const BENCHMARK_NOTE =
  "Esta puntuación indica cuánto tarda cada implementación en comparación con la más rápida de las medidas. Es una media geométrica ponderada de todos los benchmarks con claves (keyed).";

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
export const CTA_TITLE = "Listo cuando tú lo estés.";
export const CTA_SUB =
  "Instala Nuclo, impórtalo una vez y publica interfaces que se actualizan exactamente cuando tú lo dices. Puedes aprender toda la API en una tarde.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALAR",
    title: "Instalar",
    desc: "Añade Nuclo a tu proyecto con npm, pnpm, yarn o bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTAR",
    title: "Importar",
    desc: "Una sola importación por sus efectos secundarios registra globalmente las 175 funciones constructoras de etiquetas.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - CONSTRUIR",
    title: "Construir",
    desc: "Escribe funciones simples que devuelvan nodos DOM. Llama a update() cuando el estado cambie.",
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
  getStarted: "Empezar",
  viewExamples: "Ver ejemplos",
  copyInstall: "Copiar comando de instalación",
  howItWorks: "Cómo funciona",
  pipelineTitle: "Un ciclo explícito.",
  pipelineSub: "Valores dependientes del estado, sin grafo de dependencias, sin planificador. Tú decides cuándo se ejecutan: un único camino predecible desde tus datos hasta la pantalla.",
  philosophy: "Filosofía",
  features: "Características",
  featuresTitle: "Hecho para la claridad.",
  featuresSub: "Sin magia. Sin sorpresas. Cada actualización es intencional.",
  comparison: "Comparación",
  theNucloWay: "a la manera de nuclo",
  benchmarks: "Benchmarks",
  lowerIsBetter: "Cuanto menor, mejor",
  benchmarkSource: "Fuente: js-framework-benchmark",
  quickStart: "Inicio rápido",
  quickStartTitle: "En marcha en minutos.",
  quickStartSub: "Tres pasos y ya estás construyendo interfaces reales.",
  readFullDocs: "Leer la documentación completa →",
  examples: "Ejemplos",
  examplesTitle: "Míralo en acción.",
  examplesSub: "Demos interactivas. Explora el código detrás de cada una.",
  viewAllExamples: "Ver todos los ejemplos →",
  readTheDocs: "Leer la documentación",
  addATask: "Añadir una tarea…",
  add: "Añadir",
  reset: "Reiniciar",
  // The hero card
  previousExample: "Ejemplo anterior",
  nextExample: "Ejemplo siguiente",
  closeCodeView: "Cerrar vista de código",
  example: (n: number, title: string) => `Ejemplo ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Pinta y luego parchea",
    note: "La cuadrícula izquierda es un array simple de booleanos: pintarla es una mutación y nada más. El DOM de la derecha solo cambia cuando se ejecuta update(), y entonces solo se parchean las celdas que cambiaron.",
  },
  Draw: {
    title: "Dibuja la marca",
    note: "La marca de Nuclo es un espirógrafo: una rueda que gira dentro de un anillo, con dos plumas. La rueda, sus brazos, las plumas y las líneas son todas funciones de un solo número, t. La línea de tiempo y el bucle de frames solo asignan t; update('draw') vuelve a ejecutar lo que lo lee.",
  },
  Fireworks: {
    title: "Toca el cielo",
    note: "Cada chispa es un objeto simple en un array. list() le da a cada una un <line> y lo quita en el frame en que su objeto sale del array. Un update() por frame; nada se compara.",
  },
  Waves: {
    title: "Dobla la onda",
    note: "El d de cada path es una función simple de tres números. Los deslizadores y el bucle de frames solo cambian los números; update('waves') vuelve a ejecutar las funciones que los leen.",
  },
  Sort: {
    title: "Ordenado, nunca reconstruido",
    note: "El ordenamiento de burbuja intercambia objetos en un array simple. list() asocia cada barra a su objeto, así que update() mueve los nodos existentes al nuevo orden. Observa el contador: ninguna barra se recrea jamás.",
  },
  Chase: {
    title: "Guía la cuerda",
    note: "La tarjeta es un scope(). Cada frame mueve 32 puntos simples y llama a update('chase'): Nuclo recalcula los atributos de esta tarjeta y deja el resto de la página en paz.",
  },
  Reflex: {
    title: "Toca en verde",
    note: "Una sola cadena simple decide qué muestra el escenario. Cada rama de when() se construye cuando su condición se cumple y se elimina cuando deja de cumplirse; la clase del escenario es una función de la misma cadena.",
  },
  Warp: {
    title: "Mantén pulsado para saltar",
    note: "onMount inicia el bucle de frames y devuelve una función de limpieza. Desmonta el campo y Nuclo ejecuta esa limpieza: el bucle se detiene y nada queda en ejecución.",
  },
  Life: {
    title: "Juego de la vida",
    note: "El tablero es un array simple de edades. En cada tick se calcula el siguiente estado y se llama a update(); la clase de cada celda es una función de su edad, así que solo se parchean las celdas que cambiaron.",
  },
};
