import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · zero dependencies`;

export const HERO_TITLE_LINES = ["Build explicit", "interfaces with", "nuclo."];

export const HERO_DESC =
  "A small, type-safe DOM framework. State stays plain and mutable. You control every update. No proxies, no signals, no virtual DOM.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dependencies" },
  { num: "175", sup: "",   label: "typed HTML & SVG builders" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzipped, entire runtime" },
];

export const HERO_CODE = `import 'nuclo'

let count = 0

export function Counter() {
  return div(
    p(() => count),
    button("-", { onClick: () => { count--; update() } }),
    button("+", { onClick: () => { count++; update() } }),
  )
}`;

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
  "When you mutate state, nothing happens. Call update(), and Nuclo does exactly what you asked. No more, no less.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Explicit is better than implicit",
    desc: "No proxies track your every move. You mutate state, then you call update(). Cause and effect stay clear and predictable.",
  },
  {
    num: "02",
    title: "Batch freely, update once",
    desc: "Make ten mutations, then call update() once. The DOM sees only the final state. No renders are wasted.",
  },
  {
    num: "03",
    title: "Functions, not components",
    desc: "Build with plain JavaScript functions. Nuclo needs no classes, no decorators, and no special syntax. Each function returns DOM nodes. Add onMount and onDestroy as ordinary modifiers, only when you need them.",
  },
];

export const FEATURES = [
  {
    num: "01 - EXPLICIT",
    icon: "zap",
    title: "You own the update cycle",
    desc: "Mutate freely, then call update() once. Nuclo needs no subscriptions and no schedulers, and it never surprises you with a diff. The DOM syncs when you decide.",
  },
  {
    num: "02 - LIGHTWEIGHT",
    icon: "feather",
    title: "Zero dependencies",
    desc: `About ${NUCLO_GZIP_KB} KB gzipped for the entire runtime. Nuclo needs no compiler and no build plugins. Add one import and start building.`,
  },
  {
    num: "03 - TYPED",
    icon: "braces",
    title: "TypeScript-first",
    desc: "175 fully-typed HTML and SVG builders give you autocomplete for every attribute, style property, and event.",
  },
  {
    num: "04 - PRECISE",
    icon: "target",
    title: "Fine-grained patching",
    desc: "Dynamic expressions re-evaluate on update(). Only the values that actually changed touch the DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Mutate",
    title: "Change your data",
    desc: "State is plain JavaScript: variables, arrays, objects. Mutate it however you like, as many times as you like.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Commit",
    title: "Call update()",
    desc: "One global function commits your changes. Batch a dozen mutations, then commit once. Nothing renders until you say so.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Patch",
    title: "Nuclo syncs the DOM",
    desc: "Every dynamic expression re-evaluates. Nuclo writes only the values that actually changed to the DOM. No diffing, no re-renders.",
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
      { good: false, text: "Needs memoization to win performance back" },
      { good: false, text: "Leaves stale closures and dependency arrays" },
    ],
  },
  {
    name: "Signals & proxies",
    sub: "signals · stores · effects",
    items: [
      { good: false, text: "Wraps your state in proxies and subscriptions" },
      { good: false, text: "Tracks dependencies invisibly, at runtime" },
      { good: false, text: "Cascades updates on schedules you do not control" },
      { good: false, text: "Is hard to step through in a debugger" },
    ],
  },
  {
    name: "Nuclo",
    sub: "mutate → update()",
    featured: true,
    items: [
      { good: true, text: "Plain mutable state, with no wrappers and no proxies" },
      { good: true, text: "One call, update(), is the whole mental model" },
      { good: true, text: "Patches only the values that changed" },
      { good: true, text: `About ${NUCLO_GZIP_KB} KB, zero dependencies, TypeScript-first` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Fast where it counts.";
export const BENCHMARK_SUB =
  "These are independent numbers from js-framework-benchmark, for creating, updating, swapping, and clearing thousands of rows.";

export const BENCHMARK_NOTE =
  "This score is the duration slowdown against the fastest measured implementation. It is a weighted geometric mean of all keyed benchmarks.";

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
export const CTA_TITLE = "Ready when you are.";
export const CTA_SUB =
  "Install Nuclo, import it once, and ship UIs that update exactly when you say. You can learn the whole API in an afternoon.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALL",
    title: "Install",
    desc: "Add Nuclo to your project with npm, pnpm, yarn, bun, or deno.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORT",
    title: "Import",
    desc: "One side-effect import registers all 175 tag builders globally.",
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
    <span class="pt">{</span> <span class="pr">onClick</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span>
      <span class="pr">name</span> <span class="pt">=</span> <span class="st">'Nuclo'</span>
      <span class="fn">update</span><span class="pt">()</span>
    <span class="pt">} }</span>
  <span class="pt">)</span>
<span class="pt">)</span>`,
    lang: "app.ts",
  },
];
