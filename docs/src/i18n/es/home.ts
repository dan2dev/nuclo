// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · cero dependencias`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Interfaces que hacen", "justo lo que les pides,", "con *update()*."];

export const HERO_DESC =
  "Un framework DOM pequeño y con tipado estricto. Tu estado es JavaScript de toda la vida, mutable y sin envoltorios. Tú decides cuándo se actualiza la UI. Sin proxies, sin signals, sin virtual DOM.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dependencias" },
  { num: "175", sup: "",   label: "funciones HTML y SVG con tipos" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "de runtime base, con gzip" },
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
  "Mutar el estado no dispara nada. Llamas a update() y Nuclo hace exactamente lo que le pediste, ni una cosa más.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Mejor explícito que implícito",
    desc: "Aquí no hay un proxy espiando cada asignación. Mutas el estado, llamas a update() y listo: causa y efecto siempre a la vista, sin sorpresas.",
  },
  {
    num: "02",
    title: "Muta todo lo que quieras, actualiza una sola vez",
    desc: "Haz diez mutaciones y llama a update() una vez. El DOM solo ve el estado final, así que no hay renders de más.",
  },
  {
    num: "03",
    title: "Funciones, no componentes",
    desc: "Todo se arma con funciones JavaScript normales: sin clases, sin decoradores, sin sintaxis propia. Cada función devuelve nodos DOM, y si necesitas onMount u onDestroy los añades como un modificador más, solo cuando hagan falta.",
  },
];

export const FEATURES = [
  {
    num: "01 · Explícito",
    title: "El ciclo de actualización lo manejas tú",
    desc: "Muta con libertad y llama a update() una vez. Sin suscripciones, sin scheduler y sin diffs inesperados: el DOM se sincroniza cuando tú lo decides.",
  },
  {
    num: "02 · Ligero",
    title: "Cero dependencias",
    desc: `Unos ${NUCLO_GZIP_KB} KB con gzip para el runtime base. Sin compilador ni plugins de build: agrega un import y a programar.`,
  },
  {
    num: "03 · Tipado",
    title: "Diseñado para TypeScript",
    desc: "175 funciones constructoras de etiquetas HTML y SVG, con tipos completos, te dan autocompletado en cada atributo, propiedad de estilo y evento.",
  },
  {
    num: "04 · Preciso",
    title: "Parches precisos al DOM",
    desc: "Las expresiones dinámicas se reevalúan con cada update(), pero solo los valores que de verdad cambiaron llegan a tocar el DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Mutar",
    title: "Cambia tus datos",
    desc: "El estado es JavaScript plano: variables, arrays, objetos. Mútalo como quieras y las veces que quieras.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Confirmar",
    title: "Llama a update()",
    desc: "Una función global confirma los cambios. Junta una docena de mutaciones y confírmalas de una vez: nada se pinta hasta que tú lo digas.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Parchear",
    title: "Nuclo sincroniza el DOM",
    desc: "Se reevalúa cada expresión dinámica y Nuclo escribe en el DOM únicamente lo que cambió. Sin diffing, sin re-renders.",
    code: `<span class="cm">// 2 nodos parcheados,</span>
<span class="cm">// todo lo demás intacto</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Sin diffing, sin proxies, sin sorpresas.";
export const COMPARISON_SUB =
  "La interfaz se actualiza solo cuando llamas a update().";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "Virtual DOM",
    sub: "render → diff → commit",
    items: [
      { good: false, text: "Vuelve a renderizar árboles de componentes en cada cambio de estado" },
      { good: false, text: "Compara el árbol viejo con el nuevo para descubrir qué cambió" },
      { good: false, text: "Exige memoización para recuperar rendimiento" },
      { good: false, text: "Arrastra stale closures y arrays de dependencias" },
    ],
  },
  {
    name: "Signals y proxies",
    sub: "signals · stores · effects",
    items: [
      { good: false, text: "Envuelve tu estado en proxies y suscripciones" },
      { good: false, text: "Rastrea dependencias en silencio, en runtime" },
      { good: false, text: "Dispara actualizaciones en cascada con un timing que no controlas" },
      { good: false, text: "Cuesta seguirlo paso a paso en el debugger" },
    ],
  },
  {
    name: "Nuclo",
    sub: "mutar → update()",
    featured: true,
    items: [
      { good: true, text: "Estado mutable plano, sin envoltorios ni proxies" },
      { good: true, text: "Una sola llamada, update(), es todo el modelo mental" },
      { good: true, text: "Parchea solo lo que cambió" },
      { good: true, text: `Unos ${NUCLO_GZIP_KB} KB, cero dependencias, pensado para TypeScript` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Rápido donde cuenta.";
export const BENCHMARK_SUB =
  "Resultados independientes de js-framework-benchmark: crear, actualizar, intercambiar y vaciar miles de filas.";

export const BENCHMARK_NOTE =
  "El puntaje indica cuánto tarda cada implementación respecto a la más rápida de la medición. Es la media geométrica ponderada de todos los benchmarks keyed.";

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
export const CTA_TITLE = "Empieza cuando quieras.";
export const CTA_SUB =
  "Instala Nuclo, impórtalo una vez y lanza interfaces que se actualizan justo cuando tú lo dices. La API completa se aprende en una tarde.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALAR",
    title: "Instalar",
    desc: "Agrega Nuclo a tu proyecto con npm, pnpm, yarn o bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTAR",
    title: "Importar",
    desc: "Un solo import, por su efecto secundario, registra de forma global las 175 funciones constructoras de etiquetas.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - CONSTRUIR",
    title: "Construir",
    desc: "Escribe funciones simples que devuelvan nodos DOM y llama a update() cuando cambie el estado.",
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
  pipelineSub: "Valores que dependen del estado, sin grafo de dependencias ni scheduler. Tú decides cuándo se ejecutan: un único camino, predecible, de tus datos a la pantalla.",
  philosophy: "Filosofía",
  features: "Características",
  featuresTitle: "Pensado para que todo se entienda.",
  featuresSub: "Sin magia ni sorpresas: cada actualización es intencional.",
  comparison: "Comparación",
  theNucloWay: "a la manera de Nuclo",
  benchmarks: "Benchmarks",
  lowerIsBetter: "Menos es mejor",
  benchmarkSource: "Fuente: js-framework-benchmark",
  quickStart: "Inicio rápido",
  quickStartTitle: "Funcionando en minutos.",
  quickStartSub: "Tres pasos y ya estás armando interfaces de verdad.",
  readFullDocs: "Leer la documentación completa →",
  examples: "Ejemplos",
  examplesTitle: "Míralo funcionando.",
  examplesSub: "Demos interactivas, con el código de cada una a un clic.",
  viewAllExamples: "Ver todos los ejemplos →",
  readTheDocs: "Leer la documentación",
  addATask: "Agrega una tarea…",
  add: "Agregar",
  reset: "Reiniciar",
  // The hero card
  previousExample: "Ejemplo anterior",
  nextExample: "Siguiente ejemplo",
  closeCodeView: "Cerrar vista de código",
  example: (n: number, title: string) => `Ejemplo ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Pinta ahora, parchea después",
    note: "La cuadrícula de la izquierda es un simple array de booleanos: pintar es mutar, nada más. El DOM de la derecha no cambia hasta que corre update(), y entonces solo se parchean las celdas que cambiaron.",
  },
  Draw: {
    title: "Dibuja la marca",
    note: "El logo de Nuclo es un espirógrafo: una rueda que gira dentro de un anillo, con dos plumas. La rueda, los brazos, las plumas y las líneas son funciones de un solo número, t. El timeline y el loop de frames solo asignan t; update('draw') vuelve a ejecutar lo que lo lee.",
  },
  Fireworks: {
    title: "Enciende el cielo",
    note: "Cada chispa es un objeto plano dentro de un array. list() le da un <line> a cada una y lo retira en el frame en que su objeto sale del array. Un update() por frame y ninguna comparación.",
  },
  Waves: {
    title: "Dobla la onda",
    note: "El d de cada path es una función simple de tres números. Los sliders y el loop de frames solo cambian esos números; update('waves') vuelve a ejecutar las funciones que los leen.",
  },
  Sort: {
    title: "Se ordena, jamás se reconstruye",
    note: "El bubble sort intercambia objetos en un array plano. list() asocia cada barra con su objeto, así que update() reubica los nodos existentes en el nuevo orden. Mira el contador: ninguna barra se vuelve a crear.",
  },
  Chase: {
    title: "Guía la cuerda",
    note: "La tarjeta es un scope(). En cada frame se mueven 32 puntos planos y se llama a update('chase'): Nuclo recalcula los atributos de esta tarjeta y deja en paz al resto de la página.",
  },
  Reflex: {
    title: "Toca cuando se ponga verde",
    note: "Un único string decide qué muestra el escenario. Cada rama de when() se construye cuando su condición se cumple y se elimina cuando deja de cumplirse; la clase del escenario es una función de ese mismo string.",
  },
  Warp: {
    title: "Mantén presionado para saltar",
    note: "onMount arranca el loop de frames y devuelve una función de cleanup. Desmonta el campo y Nuclo la ejecuta: el loop se detiene y no queda nada corriendo.",
  },
  Life: {
    title: "Juego de la vida",
    note: "El tablero es un array plano de edades. En cada tick se calcula el siguiente estado y se llama a update(); la clase de cada celda es función de su edad, así que solo se parchean las que cambiaron.",
  },
};
