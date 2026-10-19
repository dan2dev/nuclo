// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · null Abhängigkeiten`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Baue *explizite*", "Interfaces mit", "nuclo."];

export const HERO_DESC =
  "Ein schlankes, durchgängig typisiertes DOM-Framework. Dein State bleibt schlicht und veränderlich, und du steuerst jedes Update. Ohne Proxies, ohne Signals, ohne Virtual DOM.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "Abhängigkeiten" },
  { num: "175", sup: "",   label: "typisierte HTML- und SVG-Builder" },
  { num: `~${NUCLO_GZIP_KB.replace(".", ",")}`, sup: "KB", label: "Kern-Runtime, gzip-komprimiert" },
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
  "Wenn du State veränderst, passiert erst einmal nichts. Rufst du update() auf, tut Nuclo genau das, was du verlangt hast. Nicht mehr, nicht weniger.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Explizit schlägt implizit",
    desc: "Kein Proxy schaut dir über die Schulter. Du änderst State und rufst update() auf. So bleibt jede Wirkung auf ihre Ursache zurückführbar.",
  },
  {
    num: "02",
    title: "Zehn Änderungen, ein Update",
    desc: "Ändere so viel du willst und rufe danach einmal update() auf. Das DOM bekommt nur den Endzustand zu sehen, ohne überflüssige Render-Durchläufe dazwischen.",
  },
  {
    num: "03",
    title: "Funktionen statt Komponenten",
    desc: "Du schreibst ganz normale JavaScript-Funktionen, die DOM-Knoten zurückgeben. Klassen, Decorators oder Spezialsyntax braucht Nuclo nicht. Brauchst du einen Lifecycle-Hook, hängst du onMount oder onDestroy einfach als Modifier an.",
  },
];

export const FEATURES = [
  {
    num: "01 · Explizit",
    title: "Den Update-Zyklus bestimmst du",
    desc: "Ändere, was du willst, und rufe dann einmal update() auf. Es gibt keine Subscriptions, keinen Scheduler und keinen Diff, der dich überrascht. Das DOM wird genau dann synchronisiert, wenn du es entscheidest.",
  },
  {
    num: "02 · Leichtgewichtig",
    title: "Null Abhängigkeiten",
    desc: `Die Kern-Runtime wiegt gzipped rund ${NUCLO_GZIP_KB.replace(".", ",")} KB. Compiler und Build-Plugins sind unnötig: ein Import, und du kannst loslegen.`,
  },
  {
    num: "03 · Typisiert",
    title: "TypeScript-first",
    desc: "175 voll typisierte HTML- und SVG-Builder liefern dir Autovervollständigung für jedes Attribut, jede Style-Eigenschaft und jedes Event.",
  },
  {
    num: "04 · Präzise",
    title: "Feingranulares Patching",
    desc: "Bei update() werden alle dynamischen Ausdrücke neu ausgewertet, aber nur Werte, die sich wirklich geändert haben, landen im DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Verändern",
    title: "Daten ändern",
    desc: "State ist schlichtes JavaScript: Variablen, Arrays, Objekte. Ändere ihn, wie und wie oft du willst.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Übernehmen",
    title: "update() aufrufen",
    desc: "Eine globale Funktion wendet deine Änderungen an. Bündle ein Dutzend Änderungen und wende sie mit einem einzigen Aufruf an. Gerendert wird erst, wenn du es sagst.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Patchen",
    title: "Nuclo patcht das DOM",
    desc: "Jeder dynamische Ausdruck wird neu ausgewertet, und nur geänderte Werte werden ins DOM geschrieben. Kein Diffing, keine Re-Renders.",
    code: `<span class="cm">// 2 Knoten gepatcht,</span>
<span class="cm">// alles andere unberührt</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Kein Diffing. Keine Proxies. Keine Überraschungen.";
export const COMPARISON_SUB =
  "Nuclo aktualisiert die Oberfläche nur, wenn du update() aufrufst.";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "Virtual DOM",
    sub: "Render → Diff → Commit",
    items: [
      { good: false, text: "Rendert bei jeder State-Änderung ganze Komponentenbäume neu" },
      { good: false, text: "Vergleicht alten und neuen Baum, um die Änderungen zu finden" },
      { good: false, text: "Braucht Memoization, um die verlorene Performance zurückzuholen" },
      { good: false, text: "Beschert dir Stale Closures und Dependency-Arrays" },
    ],
  },
  {
    name: "Signals & Proxies",
    sub: "Signals · Stores · Effects",
    items: [
      { good: false, text: "Packt deinen State in Proxies und Subscriptions" },
      { good: false, text: "Trackt Abhängigkeiten unsichtbar zur Laufzeit" },
      { good: false, text: "Löst Update-Kaskaden aus, auf deren Timing du keinen Einfluss hast" },
      { good: false, text: "Lässt sich im Debugger nur mühsam nachvollziehen" },
    ],
  },
  {
    name: "Nuclo",
    sub: "ändern → update()",
    featured: true,
    items: [
      { good: true, text: "Ganz normaler, veränderlicher State, ohne Wrapper und Proxies" },
      { good: true, text: "Ein einziger Aufruf, update(), ist das gesamte mentale Modell" },
      { good: true, text: "Patcht nur, was sich wirklich geändert hat" },
      { good: true, text: `Rund ${NUCLO_GZIP_KB.replace(".", ",")} KB, null Abhängigkeiten, TypeScript-first` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Schnell, wo es drauf ankommt.";
export const BENCHMARK_SUB =
  "Unabhängig gemessene Zahlen aus dem js-framework-benchmark: Tausende Zeilen erstellen, aktualisieren, tauschen und wieder leeren.";

export const BENCHMARK_NOTE =
  "Der Wert gibt an, um welchen Faktor eine Implementierung langsamer ist als die schnellste im Test. Grundlage ist das gewichtete geometrische Mittel aller keyed Benchmarks.";

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
export const CTA_TITLE = "Wir sind bereit, wenn du es bist.";
export const CTA_SUB =
  "Installieren, einmal importieren, loslegen: Deine UIs aktualisieren sich genau dann, wenn du es willst. Die komplette API hast du an einem Nachmittag drauf.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALLIEREN",
    title: "Installieren",
    desc: "Hol dir Nuclo per npm, pnpm, yarn oder bun ins Projekt.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTIEREN",
    title: "Importieren",
    desc: "Ein einziger Side-Effect-Import registriert alle 175 Tag-Builder global.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - BAUEN",
    title: "Bauen",
    desc: "Schreib einfache Funktionen, die DOM-Knoten zurückgeben, und ruf update() auf, sobald sich State ändert.",
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
  getStarted: "Erste Schritte",
  viewExamples: "Beispiele ansehen",
  copyInstall: "Installationsbefehl kopieren",
  howItWorks: "So funktioniert's",
  pipelineTitle: "Ein expliziter Zyklus.",
  pipelineSub: "Dynamische Werte, aber kein Abhängigkeitsgraph und kein Scheduler. Du bestimmst, wann sie ausgewertet werden: ein einziger, vorhersehbarer Weg von deinen Daten bis auf den Bildschirm.",
  philosophy: "Philosophie",
  features: "Features",
  featuresTitle: "Gebaut für Klarheit.",
  featuresSub: "Keine Magie, keine Überraschungen. Jedes Update ist gewollt.",
  comparison: "Vergleich",
  theNucloWay: "der nuclo-Weg",
  benchmarks: "Benchmarks",
  lowerIsBetter: "Niedriger ist besser",
  benchmarkSource: "Quelle: js-framework-benchmark",
  quickStart: "Schnellstart",
  quickStartTitle: "In Minuten startklar.",
  quickStartSub: "Drei Schritte, dann baust du echte UIs.",
  readFullDocs: "Zur vollständigen Dokumentation →",
  examples: "Beispiele",
  examplesTitle: "Sieh es in Aktion.",
  examplesSub: "Interaktive Demos zum Ausprobieren, mit dem Code gleich daneben.",
  viewAllExamples: "Alle Beispiele ansehen →",
  readTheDocs: "Zur Dokumentation",
  addATask: "Neue Aufgabe…",
  add: "Hinzufügen",
  reset: "Zurücksetzen",
  // The hero card
  previousExample: "Vorheriges Beispiel",
  nextExample: "Nächstes Beispiel",
  closeCodeView: "Code-Ansicht schließen",
  example: (n: number, title: string) => `Beispiel ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Erst malen, dann patchen",
    note: "Das linke Raster ist ein schlichtes Boolean-Array. Darauf zu malen ändert nur Daten, sonst nichts. Das DOM rechts rührt sich erst, wenn update() läuft, und dann werden nur die geänderten Zellen gepatcht.",
  },
  Draw: {
    title: "Zeichne das Logo",
    note: "Das Nuclo-Logo ist ein Spirograph: ein Rad, das in einem Ring abrollt, mit zwei Stiften darauf. Rad, Arme, Stifte und Linien sind allesamt Funktionen einer einzigen Zahl, t. Timeline und Frame-Loop setzen nur t, und update('draw') führt alles, was t liest, erneut aus.",
  },
  Fireworks: {
    title: "Tippe auf den Himmel",
    note: "Jeder Funke ist ein schlichtes Objekt in einem Array. list() gibt jedem eine <line> und entfernt sie in dem Frame, in dem das Objekt das Array verlässt. Ein update() pro Frame, und gedifft wird nichts.",
  },
  Waves: {
    title: "Verbieg die Welle",
    note: "Das d jedes Pfads ist eine simple Funktion dreier Zahlen. Slider und Frame-Loop ändern nur diese Zahlen, und update('waves') führt die Funktionen, die sie lesen, noch einmal aus.",
  },
  Sort: {
    title: "Sortiert, nie neu gebaut",
    note: "Bubble Sort vertauscht Objekte in einem schlichten Array. list() bindet jeden Balken an sein Objekt, deshalb schiebt update() die vorhandenen Knoten einfach in die neue Reihenfolge. Wirf einen Blick auf den Zähler: Kein einziger Balken wird neu erzeugt.",
  },
  Chase: {
    title: "Führe das Seil",
    note: "Die Karte ist ein scope(). Pro Frame bewegen sich 32 schlichte Punkte, dann folgt update('chase'): Nuclo berechnet nur die Attribute innerhalb dieser Karte neu und lässt den Rest der Seite in Ruhe.",
  },
  Reflex: {
    title: "Klick bei Grün",
    note: "Ein simpler String bestimmt, was die Bühne zeigt. Jeder when()-Zweig wird gebaut, sobald seine Bedingung wahr wird, und wieder entfernt, wenn sie es nicht mehr ist. Die Klasse der Bühne ist eine Funktion desselben Strings.",
  },
  Warp: {
    title: "Gedrückt halten für Warp",
    note: "onMount startet den Frame-Loop und gibt eine Cleanup-Funktion zurück. Wird das Feld entfernt, ruft Nuclo sie auf: Die Schleife stoppt, und nichts läuft im Hintergrund weiter.",
  },
  Life: {
    title: "Spiel des Lebens",
    note: "Das Spielfeld ist ein schlichtes Array mit dem Alter jeder Zelle. Ein Tick berechnet die nächste Generation und ruft update() auf. Die Klasse jeder Zelle ist eine Funktion ihres Alters, deshalb werden nur die Zellen gepatcht, die sich geändert haben.",
  },
};
