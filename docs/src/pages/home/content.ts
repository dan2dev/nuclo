import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · zero dependencies`;

export const HERO_TITLE_LINES = ["Build explicit", "interfaces with", "nuclo."];

export const HERO_DESC =
  "Nuclo is a tiny imperative DOM framework. Build interfaces from plain functions and mutable state. No proxies, no virtual DOM, no hidden re-renders.";

export const INSTALL_CMD = "npm install nuclo";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dependencies" },
  { num: "175", sup: "",   label: "typed HTML & SVG builders" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzipped, entire runtime" },
];

export const HERO_CODE = `import 'nuclo'

let count = 0

const counter = div(
  span(() => \`Count: \${count}\`),
  button(
    "Increment",
    on("click", () => {
      count++
      update()
    })
  )
)`;

export const COUNTER_TEASER_CODE = `<span class="kw">import</span> <span class="st">'nuclo'</span>

<span class="kw">let</span> <span class="pr">count</span> <span class="pt">=</span> <span class="nm">0</span>

<span class="kw">export function</span> <span class="fn">Counter</span><span class="pt">() {</span>
  <span class="kw">return</span> <span class="fn">div</span><span class="pt">(</span>
    <span class="fn">span</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">count</span><span class="pt">),</span>
    <span class="fn">button</span><span class="pt">(</span>
      <span class="st">"+"</span><span class="pt">,</span>
      <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span>
        <span class="pr">count</span><span class="pt">++</span>
        <span class="fn">update</span><span class="pt">()</span>
      <span class="pt">})</span>
    <span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">}</span>`;

export const TODO_TEASER_CODE = `<span class="kw">import</span> <span class="st">'nuclo'</span>

<span class="kw">let</span> <span class="pr">todos</span><span class="pt">:</span> <span class="ty">string</span><span class="pt">[] =</span> <span class="pt">[]</span>
<span class="kw">let</span> <span class="pr">input</span> <span class="pt">=</span> <span class="st">''</span>

<span class="kw">export function</span> <span class="fn">TodoList</span><span class="pt">() {</span>
  <span class="kw">return</span> <span class="fn">div</span><span class="pt">(</span>
    <span class="fn">input</span><span class="pt">(</span>
      <span class="pt">{</span> <span class="pr">value</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pr">input</span> <span class="pt">},</span>
      <span class="fn">on</span><span class="pt">(</span><span class="st">"input"</span><span class="pt">,</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">)</span> <span class="pt">=></span> <span class="pt">{</span>
        <span class="pr">input</span> <span class="pt">=</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">.</span><span class="pr">target</span> <span class="kw">as</span> <span class="ty">HTMLInputElement</span><span class="pt">).</span><span class="pr">value</span>
        <span class="fn">update</span><span class="pt">()</span>
      <span class="pt">})</span>
    <span class="pt">),</span>
    <span class="fn">list</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">todos</span><span class="pt">,</span>
      <span class="pt">(</span><span class="pr">t</span><span class="pt">)</span> <span class="pt">=></span> <span class="fn">div</span><span class="pt">(</span><span class="pr">t</span><span class="pt">)</span>
    <span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">}</span>`;

export const PHILOSOPHY_QUOTE =
  "When you mutate state, nothing happens. Call update() and Nuclo does exactly what you asked-no more, no less.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Explicit is better than implicit",
    desc: "No reactive proxies tracking your every move. You mutate, you call update(). Clear causality, predictable behaviour.",
  },
  {
    num: "02",
    title: "Batch freely, update once",
    desc: "Make 10 mutations before calling update() once. The DOM sees only the final state-no wasted renders.",
  },
  {
    num: "03",
    title: "Functions, not components",
    desc: "Build with plain JavaScript functions. No lifecycle hooks, no class magic, no special syntax-just functions that return DOM nodes.",
  },
];

export const FEATURES = [
  {
    num: "01 - EXPLICIT",
    icon: "zap",
    title: "You own the update cycle",
    desc: "Mutate freely, then call update() once. No subscriptions, no schedulers, no diffing surprises - the DOM syncs when you decide.",
  },
  {
    num: "02 - LIGHTWEIGHT",
    icon: "feather",
    title: "Zero dependencies",
    desc: `About ${NUCLO_GZIP_KB} KB gzipped for the entire runtime. No compiler, no build plugins - add one import and start building.`,
  },
  {
    num: "03 - TYPED",
    icon: "braces",
    title: "TypeScript-first",
    desc: "175 fully-typed HTML & SVG builders, with autocomplete for every attribute, style property, and event.",
  },
  {
    num: "04 - PRECISE",
    icon: "target",
    title: "Fine-grained patching",
    desc: "Dynamic expressions re-evaluate on update(), and only the values that actually changed touch the DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Mutate",
    title: "Change your data",
    desc: "State is plain JavaScript - variables, arrays, objects. Mutate it however you like, as many times as you like.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Commit",
    title: "Call update()",
    desc: "One global function commits your changes. Batch a dozen mutations and commit once - nothing renders until you say so.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Patch",
    title: "Nuclo syncs the DOM",
    desc: "Every dynamic expression re-evaluates, and only values that actually changed are written to the DOM. No diffing, no re-renders.",
    code: `<span class="cm">// 2 nodes patched,</span>
<span class="cm">// everything else untouched</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "No diffing. No proxies. No surprises.";
export const COMPARISON_SUB =
  "Nuclo updates the interface only when you call update().";

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
      { good: false, text: "Re-renders component trees on every state change" },
      { good: false, text: "Diffs old and new trees to find what changed" },
      { good: false, text: "Needs memoization to claw performance back" },
      { good: false, text: "Stale closures and dependency arrays" },
    ],
  },
  {
    name: "Reactive proxies",
    sub: "signals · stores · effects",
    items: [
      { good: false, text: "Wraps your state in proxies and subscriptions" },
      { good: false, text: "Tracks dependencies invisibly at runtime" },
      { good: false, text: "Updates cascade on schedules you don't control" },
      { good: false, text: "Magic that's hard to step through in a debugger" },
    ],
  },
  {
    name: "Nuclo",
    sub: "mutate → update()",
    featured: true,
    items: [
      { good: true, text: "Plain mutable state - no wrappers, no proxies" },
      { good: true, text: "One call, update(), is the whole mental model" },
      { good: true, text: "Patches only the values that changed" },
      { good: true, text: `~${NUCLO_GZIP_KB} KB, zero dependencies, TypeScript-first` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Fast where it counts.";
export const BENCHMARK_SUB =
  "Independent numbers from js-framework-benchmark - creating, updating, swapping, and clearing thousands of rows.";

export const BENCHMARK_NOTE =
  "Duration slowdown vs. the fastest measured implementation - weighted geometric mean of all keyed benchmarks.";

export const BENCHMARK_SOURCE_URL =
  "https://krausest.github.io/js-framework-benchmark/";

export const BENCHMARK_SOURCE_LABEL = "js-framework-benchmark · keyed";

/** Weighted geometric mean per framework (keyed implementations, lower is better). */
export const BENCHMARK_ENTRIES: {
  name: string;
  version: string;
  score: number;
  featured?: boolean;
}[] = [
  { name: "Solid",    version: "1.9.3",  score: 1.12 },
  { name: "Svelte",   version: "5.42.1", score: 1.15 },
  { name: "Vue",      version: "3.6.0",  score: 1.28 },
  { name: "Nuclo",    version: "0.2.6",  score: 1.36, featured: true },
  { name: "Riot",     version: "10.1.2", score: 1.54 },
  { name: "React",    version: "19.2.0", score: 1.57 },
  { name: "Angular",  version: "22.0.0", score: 1.64 },
  { name: "Stencil",  version: "4.23.0", score: 1.79 },
  { name: "Ember",    version: "6.12.0", score: 2.28 },
  { name: "Knockout", version: "3.5.1",  score: 2.34 },
  { name: "Qwik",     version: "1.11.0", score: 3.44 },
];

// ── CTA ─────────────────────────────────────────────────────────────────────
export const CTA_TITLE = "Ready when you are.";
export const CTA_SUB =
  "Install Nuclo, import it once, and ship UIs that update exactly when you say. The whole API fits in an afternoon.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALL",
    title: "Install",
    desc: "Add Nuclo to your project with your favourite package manager.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> install nuclo<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORT",
    title: "Import",
    desc: "A single side-effect import globally injects all 175 tag builders.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - BUILD",
    title: "Build",
    desc: "Write plain functions that return DOM nodes. Call update() when state changes.",
    code: `<span class="kw">let</span> <span class="pr">name</span> <span class="pt">=</span> <span class="st">'World'</span>

<span class="kw">const</span> <span class="pr">app</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">h1</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Hello, </span><span class="pt">\${</span><span class="pr">name</span><span class="pt">}\`),</span>
  <span class="fn">button</span><span class="pt">(</span>
    <span class="st">"Change"</span><span class="pt">,</span>
    <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span>
      <span class="pr">name</span> <span class="pt">=</span> <span class="st">'Nuclo'</span>
      <span class="fn">update</span><span class="pt">()</span>
    <span class="pt">})</span>
  <span class="pt">)</span>
<span class="pt">)</span>`,
    lang: "app.ts",
  },
];
