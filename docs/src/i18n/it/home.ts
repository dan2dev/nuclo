// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · zero dipendenze`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Con nuclo,", "ogni aggiornamento", "è *esplicito*."];

export const HERO_DESC =
  "Un framework DOM piccolo e type-safe. Lo stato resta semplice e mutabile. Controlli tu ogni aggiornamento. Niente proxy, niente signal, niente DOM virtuale.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dipendenze" },
  { num: "175", sup: "",   label: "builder HTML e SVG tipizzati" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzip, runtime core" },
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
  "Quando muti lo stato, non succede nulla. Chiama update(), e Nuclo fa esattamente ciò che hai chiesto. Niente di più, niente di meno.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Esplicito è meglio di implicito",
    desc: "Nessun proxy traccia ogni tua mossa. Muti lo stato, poi chiami update(). Causa ed effetto restano chiari e prevedibili.",
  },
  {
    num: "02",
    title: "Raggruppa liberamente, aggiorna una volta",
    desc: "Fai dieci mutazioni, poi chiama update() una volta. Il DOM vede solo lo stato finale. Nessun render sprecato.",
  },
  {
    num: "03",
    title: "Funzioni, non componenti",
    desc: "Costruisci con semplici funzioni JavaScript. Nuclo non richiede classi, decoratori né sintassi speciali. Ogni funzione restituisce nodi DOM. Aggiungi onMount e onDestroy come normali modificatori, solo quando ti servono.",
  },
];

export const FEATURES = [
  {
    num: "01 · Esplicito",
    title: "Controlli tu il ciclo di aggiornamento",
    desc: "Muta liberamente, poi chiama update() una volta. Nuclo non richiede sottoscrizioni né scheduler, e non ti sorprende mai con un diff. Il DOM si sincronizza quando lo decidi tu.",
  },
  {
    num: "02 · Leggero",
    title: "Zero dipendenze",
    desc: `Circa ${NUCLO_GZIP_KB} KB gzip per il runtime core. Nuclo non richiede compilatori né plugin di build. Aggiungi un import e inizia a costruire.`,
  },
  {
    num: "03 · Tipizzato",
    title: "Pensato per TypeScript",
    desc: "175 builder HTML e SVG completamente tipizzati ti danno l'autocompletamento per ogni attributo, proprietà di stile ed evento.",
  },
  {
    num: "04 · Preciso",
    title: "Aggiornamenti mirati del DOM",
    desc: "Le espressioni dinamiche vengono rivalutate a ogni update(). Solo i valori effettivamente cambiati toccano il DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Muta",
    title: "Cambia i tuoi dati",
    desc: "Lo stato è JavaScript semplice: variabili, array, oggetti. Mutalo come vuoi, quante volte vuoi.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Conferma",
    title: "Chiama update()",
    desc: "Una sola funzione globale conferma le tue modifiche. Raggruppa una dozzina di mutazioni, poi conferma una volta. Nulla viene renderizzato finché non lo dici tu.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Aggiorna",
    title: "Nuclo sincronizza il DOM",
    desc: "Ogni espressione dinamica viene rivalutata. Nuclo scrive nel DOM solo i valori effettivamente cambiati. Niente diffing, niente re-render.",
    code: `<span class="cm">// 2 nodi patchati,</span>
<span class="cm">// tutto il resto intatto</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Niente diffing. Niente proxy. Niente sorprese.";
export const COMPARISON_SUB =
  "Nuclo aggiorna l'interfaccia solo quando chiami update().";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "DOM virtuale",
    sub: "rendering → confronto → applicazione",
    items: [
      { good: false, text: "Ri-renderizza alberi di componenti a ogni cambio di stato" },
      { good: false, text: "Confronta l'albero vecchio e quello nuovo per trovare cosa è cambiato" },
      { good: false, text: "Richiede memoizzazione per recuperare le prestazioni" },
      { good: false, text: "Lascia closure obsolete e array di dipendenze" },
    ],
  },
  {
    name: "Signal e proxy",
    sub: "signal · store · effect",
    items: [
      { good: false, text: "Avvolge il tuo stato in proxy e sottoscrizioni" },
      { good: false, text: "Traccia le dipendenze in modo invisibile, a runtime" },
      { good: false, text: "Propaga aggiornamenti a cascata con tempi che non controlli" },
      { good: false, text: "È difficile da seguire passo-passo in un debugger" },
    ],
  },
  {
    name: "Nuclo",
    sub: "muta → update()",
    featured: true,
    items: [
      { good: true, text: "Stato mutabile semplice, senza wrapper e senza proxy" },
      { good: true, text: "Una sola chiamata, update(), è l'intero modello mentale" },
      { good: true, text: "Aggiorna solo i valori che sono cambiati" },
      { good: true, text: `Circa ${NUCLO_GZIP_KB} KB, zero dipendenze, TypeScript-first` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Veloce dove conta.";
export const BENCHMARK_SUB =
  "Numeri indipendenti da js-framework-benchmark, per creare, aggiornare, scambiare e cancellare migliaia di righe.";

export const BENCHMARK_NOTE =
  "Questo punteggio indica quanto tempo impiega ogni implementazione rispetto alla più veloce tra quelle misurate. È una media geometrica ponderata di tutti i benchmark keyed.";

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
export const CTA_TITLE = "Pronto quando lo sei tu.";
export const CTA_SUB =
  "Installa Nuclo, importalo una volta e rilascia UI che si aggiornano esattamente quando lo dici tu. Puoi imparare l'intera API in un pomeriggio.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALLA",
    title: "Installa",
    desc: "Aggiungi Nuclo al tuo progetto con npm, pnpm, yarn o bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTA",
    title: "Importa",
    desc: "Un solo import con side effect registra globalmente tutti i 175 builder di tag.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - COSTRUISCI",
    title: "Costruisci",
    desc: "Scrivi semplici funzioni che restituiscono nodi DOM. Chiama update() quando lo stato cambia.",
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
  getStarted: "Inizia",
  viewExamples: "Vedi gli esempi",
  copyInstall: "Copia il comando di installazione",
  howItWorks: "Come funziona",
  pipelineTitle: "Un unico ciclo esplicito.",
  pipelineSub: "Valori dipendenti dallo stato, nessun grafo di dipendenze, nessuno scheduler. Decidi tu quando vengono eseguiti - un solo percorso prevedibile dai tuoi dati allo schermo.",
  philosophy: "Filosofia",
  features: "Caratteristiche",
  featuresTitle: "Costruito per la chiarezza.",
  featuresSub: "Niente magia. Niente sorprese. Ogni aggiornamento è intenzionale.",
  comparison: "Confronto",
  theNucloWay: "alla maniera di nuclo",
  benchmarks: "Benchmark",
  lowerIsBetter: "Più basso è meglio",
  benchmarkSource: "Fonte: js-framework-benchmark",
  quickStart: "Avvio rapido",
  quickStartTitle: "Operativo in pochi minuti.",
  quickStartSub: "Tre passaggi e stai già costruendo UI reali.",
  readFullDocs: "Leggi la documentazione completa →",
  examples: "Esempi",
  examplesTitle: "Guardalo in azione.",
  examplesSub: "Demo interattive. Esplora il codice dietro ciascuna.",
  viewAllExamples: "Vedi tutti gli esempi →",
  readTheDocs: "Leggi la documentazione",
  addATask: "Aggiungi un'attività…",
  add: "Aggiungi",
  reset: "Reimposta",
  // The hero card
  previousExample: "Esempio precedente",
  nextExample: "Esempio successivo",
  closeCodeView: "Chiudi la vista codice",
  example: (n: number, title: string) => `Esempio ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Dipingi, poi aggiorna",
    note: "La griglia a sinistra è un semplice array di booleani: dipingerla è una mutazione e niente più. Il DOM a destra cambia solo quando viene eseguito update(), che aggiorna soltanto le celle modificate.",
  },
  Draw: {
    title: "Disegna il marchio",
    note: "Il marchio Nuclo è uno spirografo: una ruota che rotola dentro un anello, con due penne. La ruota, i suoi bracci, le penne e le linee sono tutte funzioni di un solo numero, t. La timeline e il ciclo dei frame impostano solo t; update('draw') riesegue ciò che lo legge.",
  },
  Fireworks: {
    title: "Tocca il cielo",
    note: "Ogni scintilla è un oggetto semplice in un array. list() dà a ciascuna una <line> e la elimina nel frame in cui il suo oggetto lascia l'array. Un update() per frame; nulla viene confrontato.",
  },
  Waves: {
    title: "Piega l'onda",
    note: "Il d di ogni path è una semplice funzione di tre numeri. Gli slider e il ciclo dei frame cambiano solo i numeri; update('waves') riesegue le funzioni che li leggono.",
  },
  Sort: {
    title: "Ordinato, mai ricostruito",
    note: "Il bubble sort scambia oggetti in un array semplice. list() lega ogni barra al suo oggetto, così update() sposta i nodi esistenti nel nuovo ordine. Guarda il contatore: nessuna barra viene mai ricreata.",
  },
  Chase: {
    title: "Guida la corda",
    note: "La scheda è uno scope(). Ogni frame muove 32 punti semplici e chiama update('chase'): Nuclo ricalcola gli attributi in questa scheda e lascia in pace il resto della pagina.",
  },
  Reflex: {
    title: "Tocca sul verde",
    note: "Una semplice stringa decide cosa mostra il palco. Ogni ramo when() viene costruito quando la sua condizione diventa vera e rimosso quando smette di esserlo; la classe del palco è una funzione della stessa stringa.",
  },
  Warp: {
    title: "Tieni premuto per il warp",
    note: "onMount avvia il ciclo di animazione e restituisce una funzione di pulizia. Smonta il campo e Nuclo esegue quella funzione: il ciclo si ferma e nulla resta in esecuzione.",
  },
  Life: {
    title: "Gioco della vita",
    note: "La griglia è un semplice array di età. Un tick calcola la generazione successiva e chiama update(); la classe di ogni cella è una funzione della sua età, così vengono aggiornate solo le celle modificate.",
  },
};
