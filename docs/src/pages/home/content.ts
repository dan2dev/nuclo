export const HERO_BADGE = "v0.1 · Zero Dependencies";

export const HERO_TITLE_LINES = ["Mutate.", "Call update().", "Done."];

export const HERO_DESC =
  "A lightweight imperative DOM framework. Build UIs with plain functions and mutable state—no proxies, no virtual DOM, no hidden re-renders. You decide when the DOM updates.";

export const INSTALL_CMD = "npm install nuclo";

export const HERO_STATS = [
  { num: "0",   sup: "deps", label: "Zero dependencies" },
  { num: "140", sup: "+",    label: "HTML & SVG tags" },
  { num: "~3",  sup: "kb",   label: "Gzipped bundle" },
];

export const HERO_CODE = `<span class="kw">import</span> <span class="st">'nuclo'</span>

<span class="kw">let</span> <span class="pr">count</span> <span class="pt">=</span> <span class="nm">0</span>

<span class="kw">const</span> <span class="pr">counter</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">span</span><span class="pt">(()</span> <span class="pt">=&gt;</span> \`<span class="st">Count: </span>\${<span class="pr">count</span>}\`<span class="pt">),</span>
  <span class="fn">button</span><span class="pt">(</span>
    <span class="st">"Increment"</span><span class="pt">,</span>
    <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">()</span> <span class="pt">=&gt;</span> <span class="pt">{</span>
      <span class="pr">count</span><span class="pt">++</span>
      <span class="fn">update</span><span class="pt">()</span>
    <span class="pt">})</span>
  <span class="pt">)</span>
<span class="pt">)</span>`;

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
    <span class="fn">input</span><span class="pt">({</span>
      <span class="pr">value</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pr">input</span><span class="pt">,</span>
      <span class="pr">onInput</span><span class="pt">:</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">)</span> <span class="pt">=></span> <span class="pt">{</span>
        <span class="pr">input</span> <span class="pt">=</span> <span class="pr">e</span><span class="pt">.</span><span class="pr">target</span><span class="pt">.</span><span class="pr">value</span>
        <span class="fn">update</span><span class="pt">()</span>
      <span class="pt">}</span>
    <span class="pt">}),</span>
    <span class="fn">list</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">todos</span><span class="pt">,</span>
      <span class="pt">(</span><span class="pr">t</span><span class="pt">)</span> <span class="pt">=></span> <span class="fn">div</span><span class="pt">(</span><span class="pr">t</span><span class="pt">)</span>
    <span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">}</span>`;

export const PHILOSOPHY_QUOTE =
  "When you mutate state, nothing happens. Call update() and Nuclo does exactly what you asked—no more, no less.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Explicit is better than implicit",
    desc: "No reactive proxies tracking your every move. You mutate, you call update(). Clear causality, predictable behaviour.",
  },
  {
    num: "02",
    title: "Batch freely, update once",
    desc: "Make 10 mutations before calling update() once. The DOM sees only the final state—no wasted renders.",
  },
  {
    num: "03",
    title: "Functions, not components",
    desc: "Build with plain JavaScript functions. No lifecycle hooks, no class magic, no special syntax—just functions that return DOM nodes.",
  },
];

export const FEATURES = [
  {
    num: "01 — EXPLICIT",
    title: "You control updates",
    desc: "Call update() when you want the DOM to sync. Nuclo does exactly that—no subscriptions, no diffing surprises.",
  },
  {
    num: "02 — LIGHTWEIGHT",
    title: "Zero dependencies",
    desc: "~3kb gzipped, zero runtime dependencies. Ships nothing you don't use.",
  },
  {
    num: "03 — TYPED",
    title: "TypeScript-first",
    desc: "Full TypeScript types for 140+ HTML & SVG tags. Autocomplete everything.",
  },
  {
    num: "04 — SMART",
    title: "Fine-grained sync",
    desc: "Dynamic functions run only when needed. Pass () => value and Nuclo updates only that node.",
  },
];

export const QUICK_START_STEPS = [
  {
    num: "01 — INSTALL",
    title: "Install",
    desc: "Add Nuclo to your project with your favourite package manager.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> install nuclo`,
    lang: "terminal",
  },
  {
    num: "02 — IMPORT",
    title: "Import",
    desc: "A single side-effect import globally injects all 140+ tag builders.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 — BUILD",
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
