// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · null Abhängigkeiten`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Baue UIs mit", "*expliziten* Updates.", "Mit nuclo."];

export const HERO_DESC =
  "Ein kleines, typsicheres DOM-Framework. State bleibt einfach und veränderbar. Du steuerst jedes Update. Keine Proxies, keine Signals, kein virtuelles DOM.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "Abhängigkeiten" },
  { num: "175", sup: "",   label: "typisierte HTML- & SVG-Builder" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "Kern-Runtime, gzip-komprimiert" },
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
  "Wenn du State veränderst, passiert nichts. Rufe update() auf, und Nuclo tut genau das, was du verlangt hast. Nicht mehr, nicht weniger.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Explizit ist besser als implizit",
    desc: "Keine Proxies verfolgen jeden deiner Schritte. Du veränderst State, dann rufst du update() auf. Ursache und Wirkung bleiben klar und vorhersehbar.",
  },
  {
    num: "02",
    title: "Frei bündeln, einmal aktualisieren",
    desc: "Mache zehn Veränderungen, dann rufe einmal update() auf. Das DOM sieht nur den Endzustand. Keine unnötigen Renderdurchläufe.",
  },
  {
    num: "03",
    title: "Funktionen statt Komponenten",
    desc: "Baue mit einfachen JavaScript-Funktionen. Nuclo braucht keine Klassen, keine Decorators und keine Spezialsyntax. Jede Funktion gibt DOM-Knoten zurück. Füge onMount und onDestroy als gewöhnliche Modifier hinzu, nur wenn du sie brauchst.",
  },
];

export const FEATURES = [
  {
    num: "01 · Explizit",
    title: "Du steuerst den Update-Zyklus",
    desc: "Verändere frei, dann rufe einmal update() auf. Nuclo braucht keine Subscriptions und keine Scheduler, und es überrascht dich nie mit einem Diff. Das DOM wird synchronisiert, wenn du es entscheidest.",
  },
  {
    num: "02 · Leichtgewichtig",
    title: "Null Abhängigkeiten",
    desc: `Etwa ${NUCLO_GZIP_KB} KB für die gzip-komprimierte Kern-Runtime. Nuclo braucht keinen Compiler und keine Build-Plugins. Füge einen Import hinzu und fang an zu bauen.`,
  },
  {
    num: "03 · Typisiert",
    title: "Für TypeScript entwickelt",
    desc: "175 vollständig typisierte HTML- und SVG-Builder geben dir Autovervollständigung für jedes Attribut, jede Style-Eigenschaft und jedes Event.",
  },
  {
    num: "04 · Präzise",
    title: "Gezielte DOM-Updates",
    desc: "Dynamische Ausdrücke werden bei update() neu ausgewertet. Nur Werte, die sich tatsächlich geändert haben, werden ins DOM geschrieben.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Verändern",
    title: "Ändere deine Daten",
    desc: "State ist einfaches JavaScript: Variablen, Arrays, Objekte. Verändere ihn, wie du willst, so oft du willst.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Anwenden",
    title: "Rufe update() auf",
    desc: "Eine globale Funktion übernimmt deine Änderungen ins DOM. Bündle ein Dutzend Änderungen und wende sie mit einem einzigen Aufruf an. Gerendert wird erst, wenn du es entscheidest.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Patchen",
    title: "Nuclo synchronisiert das DOM",
    desc: "Jeder dynamische Ausdruck wird neu ausgewertet. Nuclo schreibt nur die Werte ins DOM, die sich tatsächlich geändert haben. Kein Diffing, keine Re-Renders.",
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
    name: "Virtuelles DOM",
    sub: "Rendern → Vergleichen → Anwenden",
    items: [
      { good: false, text: "Rendert Komponentenbäume bei jeder State-Änderung neu" },
      { good: false, text: "Vergleicht alte und neue Bäume, um Änderungen zu finden" },
      { good: false, text: "Braucht Memoization, um Performance zurückzugewinnen" },
      { good: false, text: "Hinterlässt veraltete Closures und Dependency-Arrays" },
    ],
  },
  {
    name: "Signals & Proxies",
    sub: "Signals · Stores · Effects",
    items: [
      { good: false, text: "Verpackt deinen State in Proxies und Subscriptions" },
      { good: false, text: "Verfolgt Abhängigkeiten unsichtbar, zur Laufzeit" },
      { good: false, text: "Löst Update-Kaskaden nach Zeitplänen aus, die du nicht steuerst" },
      { good: false, text: "Ist im Debugger schwer Schritt für Schritt zu verfolgen" },
    ],
  },
  {
    name: "Nuclo",
    sub: "ändern → update()",
    featured: true,
    items: [
      { good: true, text: "Einfacher veränderbarer State, ohne Wrapper und ohne Proxies" },
      { good: true, text: "Ein Aufruf, update(), ist das ganze mentale Modell" },
      { good: true, text: "Patcht nur die Werte, die sich geändert haben" },
      { good: true, text: `Etwa ${NUCLO_GZIP_KB} KB, null Abhängigkeiten, für TypeScript entwickelt` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Schnell, wo es zählt.";
export const BENCHMARK_SUB =
  "Das sind unabhängige Zahlen aus js-framework-benchmark für das Erstellen, Aktualisieren, Tauschen und Leeren tausender Zeilen.";

export const BENCHMARK_NOTE =
  "Dieser Wert ist die Verlangsamung gegenüber der schnellsten gemessenen Implementierung. Er ist ein gewichtetes geometrisches Mittel aller keyed Benchmarks.";

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
export const CTA_TITLE = "Bereit, wenn du es bist.";
export const CTA_SUB =
  "Installiere Nuclo, importiere es einmal und entwickle UIs, die genau dann aktualisiert werden, wenn du es entscheidest. Die ganze API lernst du an einem Nachmittag.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALLIEREN",
    title: "Installieren",
    desc: "Füge Nuclo mit npm, pnpm, yarn oder bun zu deinem Projekt hinzu.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTIEREN",
    title: "Importieren",
    desc: "Ein Import mit Seiteneffekt registriert alle 175 Tag-Builder global.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - BAUEN",
    title: "Bauen",
    desc: "Schreibe einfache Funktionen, die DOM-Knoten zurückgeben. Rufe update() auf, wenn sich State ändert.",
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
  getStarted: "Loslegen",
  viewExamples: "Beispiele ansehen",
  copyInstall: "Installationsbefehl kopieren",
  howItWorks: "So funktioniert es",
  pipelineTitle: "Ein expliziter Zyklus.",
  pipelineSub: "Zustandsabhängige Werte, kein Abhängigkeitsgraph, kein Scheduler. Du entscheidest, wann sie ausgewertet werden – ein einziger vorhersehbarer Weg von deinen Daten zum Bildschirm.",
  philosophy: "Philosophie",
  features: "Funktionen",
  featuresTitle: "Gebaut für Klarheit.",
  featuresSub: "Keine Magie. Keine Überraschungen. Jedes Update ist beabsichtigt.",
  comparison: "Vergleich",
  theNucloWay: "der nuclo-Weg",
  benchmarks: "Benchmarks",
  lowerIsBetter: "Niedriger ist besser",
  benchmarkSource: "Quelle: js-framework-benchmark",
  quickStart: "Schnellstart",
  quickStartTitle: "In Minuten einsatzbereit.",
  quickStartSub: "Drei Schritte und du baust echte UIs.",
  readFullDocs: "Zur vollständigen Dokumentation →",
  examples: "Beispiele",
  examplesTitle: "Sieh es in Aktion.",
  examplesSub: "Interaktive Demos. Erkunde den Code hinter jeder einzelnen.",
  viewAllExamples: "Alle Beispiele ansehen →",
  readTheDocs: "Zur Dokumentation",
  addATask: "Aufgabe hinzufügen…",
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
    title: "Malen, dann patchen",
    note: "Das linke Raster ist ein einfaches Array aus Booleans: es zu bemalen ist eine Veränderung und nichts weiter. Das DOM rechts bewegt sich erst, wenn update() läuft, und dann werden nur die Zellen gepatcht, die sich geändert haben.",
  },
  Draw: {
    title: "Zeichne das Logo",
    note: "Das Nuclo-Logo ist ein Spirograph: ein Rad, das in einem Ring rollt, mit zwei Stiften darauf. Das Rad, seine Arme, die Stifte und die Linien sind alle Funktionen einer Zahl, t. Die Zeitleiste und die Frame-Schleife setzen nur t; update('draw') führt erneut aus, was es liest.",
  },
  Fireworks: {
    title: "Tippe auf den Himmel",
    note: "Jeder Funke ist ein einfaches Objekt in einem Array. list() gibt jedem eine <line> und entfernt sie in dem Frame, in dem sein Objekt das Array verlässt. Ein update() pro Frame; nichts wird gedifft.",
  },
  Waves: {
    title: "Biege die Welle",
    note: "Das d jedes Pfads ist eine einfache Funktion dreier Zahlen. Die Schieberegler und die Frame-Schleife ändern nur die Zahlen; update('waves') führt die Funktionen erneut aus, die sie lesen.",
  },
  Sort: {
    title: "Sortiert, nie neu gebaut",
    note: "Bubble Sort tauscht Objekte in einem einfachen Array. list() bindet jeden Balken an sein Objekt, also verschiebt update() die vorhandenen Knoten in die neue Reihenfolge. Beobachte den Zähler: kein Balken wird je neu erstellt.",
  },
  Chase: {
    title: "Führe das Seil",
    note: "Die Karte ist ein scope(). Jeder Frame bewegt 32 einfache Punkte und ruft update('chase') auf: Nuclo berechnet die Attribute in dieser Karte neu und lässt den Rest der Seite in Ruhe.",
  },
  Reflex: {
    title: "Tippe bei Grün",
    note: "Ein einfacher String entscheidet, was die Bühne zeigt. Jeder when()-Zweig wird gebaut, wenn seine Bedingung wahr wird, und entfernt, wenn sie es nicht mehr ist; die Klasse der Bühne ist eine Funktion desselben Strings.",
  },
  Warp: {
    title: "Halten zum Warpen",
    note: "onMount startet die Frame-Schleife und gibt eine Aufräumfunktion zurück. Wenn das Feld ausgehängt wird, führt Nuclo diese Funktion aus: die Schleife stoppt und nichts läuft weiter.",
  },
  Life: {
    title: "Spiel des Lebens",
    note: "Das Spielfeld ist ein einfaches Array mit den Alterswerten der Zellen. Ein Tick berechnet die nächste Generation und ruft update() auf; die Klasse jeder Zelle ist eine Funktion ihres Alters, also werden nur die Zellen gepatcht, die sich geändert haben.",
  },
};
