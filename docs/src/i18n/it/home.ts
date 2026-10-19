// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · zero dipendenze`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Costruisci interfacce", "*esplicite* con", "nuclo."];

export const HERO_DESC =
  "Un framework DOM piccolo e type-safe. Lo stato resta semplice e mutabile, e a decidere quando aggiornare sei sempre tu. Niente proxy, niente signal, niente virtual DOM.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dipendenze" },
  { num: "175", sup: "",   label: "builder HTML e SVG tipizzati" },
  { num: `~${NUCLO_GZIP_KB.replace(".", ",")}`, sup: "KB", label: "gzip, runtime core" },
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
  "Muti lo stato e non succede niente. Chiami update() e Nuclo fa esattamente quello che gli hai chiesto. Né più, né meno.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Meglio esplicito che implicito",
    desc: "Nessun proxy ti spia a ogni mossa. Muti lo stato, poi chiami update(): causa ed effetto restano sempre chiari e prevedibili.",
  },
  {
    num: "02",
    title: "Muta quanto vuoi, aggiorna una volta sola",
    desc: "Dieci mutazioni, un solo update(). Il DOM vede soltanto lo stato finale, senza render sprecati.",
  },
  {
    num: "03",
    title: "Funzioni, non componenti",
    desc: "Costruisci con normali funzioni JavaScript: niente classi, decoratori o sintassi speciali. Ogni funzione restituisce nodi DOM, e onMount e onDestroy sono semplici modificatori da aggiungere solo quando servono.",
  },
];

export const FEATURES = [
  {
    num: "01 · Esplicito",
    title: "Il ciclo di aggiornamento è tuo",
    desc: "Muta in libertà, poi chiama update() una volta. Niente sottoscrizioni, niente scheduler, nessun diff a sorpresa: il DOM si sincronizza quando lo dici tu.",
  },
  {
    num: "02 · Leggero",
    title: "Zero dipendenze",
    desc: `Circa ${NUCLO_GZIP_KB.replace(".", ",")} KB gzip per il runtime core. Nessun compilatore, nessun plugin di build: aggiungi un import e parti.`,
  },
  {
    num: "03 · Tipizzato",
    title: "Nato per TypeScript",
    desc: "175 builder HTML e SVG completamente tipizzati: autocompletamento per ogni attributo, proprietà di stile ed evento.",
  },
  {
    num: "04 · Preciso",
    title: "Aggiornamenti mirati del DOM",
    desc: "A ogni update() le espressioni dinamiche vengono rivalutate, ma al DOM arrivano solo i valori davvero cambiati.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Muta",
    title: "Cambia i dati",
    desc: "Lo stato è JavaScript puro: variabili, array, oggetti. Mutalo come preferisci, tutte le volte che vuoi.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Conferma",
    title: "Chiama update()",
    desc: "Una sola funzione globale per confermare le modifiche. Accumula una dozzina di mutazioni, poi conferma. Finché non lo dici tu, nulla viene renderizzato.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Aggiorna",
    title: "Nuclo sincronizza il DOM",
    desc: "Ogni espressione dinamica viene rivalutata e Nuclo scrive nel DOM solo ciò che è cambiato. Niente diffing, niente re-render.",
    code: `<span class="cm">// 2 nodi aggiornati,</span>
<span class="cm">// tutto il resto intatto</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Niente diffing, niente proxy, niente sorprese.";
export const COMPARISON_SUB =
  "L'interfaccia cambia solo quando chiami update().";

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
      { good: false, text: "Esegue di nuovo il render di interi alberi di componenti a ogni cambio di stato" },
      { good: false, text: "Confronta il vecchio albero col nuovo per capire cosa è cambiato" },
      { good: false, text: "Richiede memoizzazione per recuperare prestazioni" },
      { good: false, text: "Si porta dietro closure obsolete e array di dipendenze" },
    ],
  },
  {
    name: "Signal e proxy",
    sub: "signal · store · effect",
    items: [
      { good: false, text: "Avvolge il tuo stato in proxy e sottoscrizioni" },
      { good: false, text: "Traccia le dipendenze di nascosto, a runtime" },
      { good: false, text: "Propaga gli aggiornamenti a cascata, con tempi che non controlli" },
      { good: false, text: "È difficile da seguire passo passo nel debugger" },
    ],
  },
  {
    name: "Nuclo",
    sub: "muta → update()",
    featured: true,
    items: [
      { good: true, text: "Stato mutabile semplice: niente wrapper, niente proxy" },
      { good: true, text: "Tutto il modello mentale sta in una chiamata: update()" },
      { good: true, text: "Aggiorna solo i valori cambiati" },
      { good: true, text: `Circa ${NUCLO_GZIP_KB.replace(".", ",")} KB, zero dipendenze, TypeScript-first` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Veloce dove serve.";
export const BENCHMARK_SUB =
  "I numeri di js-framework-benchmark, un progetto indipendente: creare, aggiornare, scambiare e cancellare migliaia di righe.";

export const BENCHMARK_NOTE =
  "Il punteggio dice quanto è lenta ogni implementazione rispetto alla più veloce tra quelle misurate: è la media geometrica ponderata di tutti i benchmark keyed.";

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
export const CTA_TITLE = "Parti quando vuoi.";
export const CTA_SUB =
  "Installa Nuclo, importalo una volta e pubblica interfacce che si aggiornano esattamente quando vuoi tu. L'intera API si impara in un pomeriggio.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALLA",
    title: "Installa",
    desc: "Aggiungi Nuclo al progetto con npm, pnpm, yarn o bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTA",
    title: "Importa",
    desc: "Un solo import con side effect e tutti i 175 builder dei tag diventano globali.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - COSTRUISCI",
    title: "Costruisci",
    desc: "Scrivi funzioni che restituiscono nodi DOM e chiama update() quando lo stato cambia.",
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
  pipelineSub: "Valori legati allo stato, nessun grafo di dipendenze, nessuno scheduler. Sei tu a decidere quando girano: un solo percorso, prevedibile, dai dati allo schermo.",
  philosophy: "Filosofia",
  features: "Funzionalità",
  featuresTitle: "Progettato per la chiarezza.",
  featuresSub: "Niente magia, niente sorprese. Ogni aggiornamento è voluto.",
  comparison: "Confronto",
  theNucloWay: "alla maniera di Nuclo",
  benchmarks: "Benchmark",
  lowerIsBetter: "Più basso è meglio",
  benchmarkSource: "Fonte: js-framework-benchmark",
  quickStart: "Quick start",
  quickStartTitle: "Operativo in pochi minuti.",
  quickStartSub: "Tre passi e stai già costruendo UI vere.",
  readFullDocs: "Leggi la documentazione completa →",
  examples: "Esempi",
  examplesTitle: "Vedilo all'opera.",
  examplesSub: "Demo interattive: dai un'occhiata al codice dietro ognuna.",
  viewAllExamples: "Vedi tutti gli esempi →",
  readTheDocs: "Leggi la documentazione",
  addATask: "Aggiungi un'attività…",
  add: "Aggiungi",
  reset: "Azzera",
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
    note: "La griglia a sinistra è un semplice array di booleani: dipingere significa solo mutarlo. Il DOM a destra cambia soltanto quando scatta update(), che ritocca solo le celle modificate.",
  },
  Draw: {
    title: "Disegna il logo",
    note: "Il logo di Nuclo è uno spirografo: una ruota che gira dentro un anello, con due penne. Ruota, bracci, penne e linee sono tutte funzioni di un unico numero, t. La timeline e il loop dei frame si limitano a impostare t; update('draw') riesegue ciò che lo legge.",
  },
  Fireworks: {
    title: "Tocca il cielo",
    note: "Ogni scintilla è un semplice oggetto in un array. list() le assegna una <line> e la rimuove nel frame in cui l'oggetto esce dall'array. Un update() per frame, nessun confronto.",
  },
  Waves: {
    title: "Piega l'onda",
    note: "L'attributo d di ogni path è una funzione di tre numeri. Slider e loop dei frame cambiano solo quei numeri; update('waves') riesegue le funzioni che li leggono.",
  },
  Sort: {
    title: "Ordina senza ricostruire",
    note: "Il bubble sort scambia gli oggetti di un semplice array. list() lega ogni barra al suo oggetto, quindi update() si limita a spostare i nodi esistenti. Guarda il contatore: nessuna barra viene mai ricreata.",
  },
  Chase: {
    title: "Guida la corda",
    note: "La card è uno scope(). A ogni frame si spostano 32 semplici punti e parte update('chase'): Nuclo ricalcola gli attributi dentro questa card e lascia in pace il resto della pagina.",
  },
  Reflex: {
    title: "Clicca sul verde",
    note: "Una semplice stringa decide cosa mostra la scena. Ogni ramo di when() viene costruito quando la sua condizione diventa vera e rimosso quando smette di esserlo; la classe della scena è funzione della stessa stringa.",
  },
  Warp: {
    title: "Tieni premuto per il salto a curvatura",
    note: "onMount avvia il loop dell'animazione e restituisce una funzione di cleanup. Quando il campo viene smontato, Nuclo la esegue: il loop si ferma e non resta nulla in esecuzione.",
  },
  Life: {
    title: "Il gioco della vita",
    note: "La griglia è un semplice array di età. A ogni tick si calcola la generazione successiva e si chiama update(); la classe di ogni cella dipende dalla sua età, quindi si aggiornano solo le celle cambiate.",
  },
};
