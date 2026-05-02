export interface DocSection {
  id: string;
  group: string;
  groupTitle: string;
  title: string;
  apiTag?: 'fn' | 'type';
  apiSig?: string;
  content: string; // raw HTML inner content
}

export const DOC_GROUPS = [
  {
    title: "Introduction",
    sections: ["overview", "installation", "typescript-setup"],
  },
  {
    title: "Core Concepts",
    sections: ["explicit-updates", "dynamic-functions", "tag-builders", "attributes", "events"],
  },
  {
    title: "API Reference",
    sections: ["api-update", "api-render", "api-hydrate", "api-on", "api-when", "api-list", "api-scope", "api-styling", "api-ssr"],
  },
  {
    title: "Patterns",
    sections: ["components", "computed", "async", "best-practices"],
  },
];

export const DOC_SECTIONS: DocSection[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    id: "overview",
    group: "Introduction",
    groupTitle: "Introduction",
    title: "Overview",
    content: `
      <p>Nuclo is a lightweight imperative DOM framework. You write plain functions that build and return DOM nodes. When your state changes, you call <code>update()</code>—and Nuclo syncs only what needs to change.</p>
      <p>There are no proxies, no virtual DOM, no hidden subscriptions. You are always in control.</p>
      <h3>Core philosophy</h3>
      <p>Most frameworks try to hide state management from you. Nuclo does the opposite: it trusts you to know when something changed, and acts <em>only</em> when you say so.</p>
      <ul>
        <li><strong>Explicit updates</strong> — call <code>update()</code> after you mutate state.</li>
        <li><strong>Dynamic functions</strong> — pass <code>() =&gt; value</code> anywhere; Nuclo re-evaluates on each update.</li>
        <li><strong>Plain functions</strong> — components are just functions. No classes, no decorators, no lifecycle hooks.</li>
      </ul>
    `,
  },
  {
    id: "installation",
    group: "Introduction",
    groupTitle: "Introduction",
    title: "Installation",
    content: `
      <p>Install Nuclo via npm, pnpm, yarn, or bun:</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">terminal</span></div><div class="code-block-body"><pre><span class="pt">$</span> <span class="fn">npm</span> install nuclo</pre></div></div>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">terminal</span></div><div class="code-block-body"><pre><span class="pt">$</span> <span class="fn">pnpm</span> add nuclo</pre></div></div>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">terminal</span></div><div class="code-block-body"><pre><span class="pt">$</span> <span class="fn">bun</span> add nuclo</pre></div></div>
      <p>Then import it once at your entry point. The import is a side-effect that globally registers 175 tag builder functions:</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">main.ts</span></div><div class="code-block-body"><pre><span class="kw">import</span> <span class="st">'nuclo'</span>
<span class="cm">// div(), span(), button() ... are now available globally</span></pre></div></div>
    `,
  },
  {
    id: "typescript-setup",
    group: "Introduction",
    groupTitle: "Introduction",
    title: "TypeScript Setup",
    content: `
      <p>Nuclo is written in TypeScript and ships full type definitions. The global tag builders are typed via a <code>declare global</code> block included in the package.</p>
      <p>No special <code>tsconfig</code> changes are required when your app imports <code>'nuclo'</code>. If you want the globals available in files before the runtime import is seen by TypeScript, add a small env declaration:</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">vite-env.d.ts</span></div><div class="code-block-body"><pre><span class="cm">/// &lt;reference types="nuclo/types" /&gt;</span></pre></div></div>
      <p>A standard strict configuration is enough for most projects:</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">tsconfig.json</span></div><div class="code-block-body"><pre><span class="pt">{</span>
  <span class="pr">"compilerOptions"</span><span class="pt">:</span> <span class="pt">{</span>
    <span class="pr">"target"</span><span class="pt">:</span> <span class="st">"ES2020"</span><span class="pt">,</span>
    <span class="pr">"module"</span><span class="pt">:</span> <span class="st">"ESNext"</span><span class="pt">,</span>
    <span class="pr">"moduleResolution"</span><span class="pt">:</span> <span class="st">"bundler"</span><span class="pt">,</span>
    <span class="pr">"strict"</span><span class="pt">:</span> <span class="kw">true</span>
  <span class="pt">}</span>
<span class="pt">}</span></pre></div></div>
      <p>All 175 tag builders accept typed attribute objects, dynamic text functions, event descriptors, child builders, and class-name helpers. Your editor will autocomplete everything.</p>
    `,
  },

  // ── Core Concepts ─────────────────────────────────────────────────────────
  {
    id: "explicit-updates",
    group: "Core Concepts",
    groupTitle: "Core Concepts",
    title: "Explicit Updates",
    content: `
      <p>In Nuclo, <strong>nothing happens automatically</strong>. When you change a variable, the DOM stays unchanged until you call <code>update()</code>.</p>
      <p>This is intentional. It gives you complete control over render timing and lets you batch any number of mutations before syncing the DOM.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">count</span> <span class="pt">=</span> <span class="nm">0</span>
<span class="kw">let</span> <span class="pr">label</span> <span class="pt">=</span> <span class="st">'hello'</span>

<span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">button</span><span class="pt">(</span>
  <span class="st">"Click me"</span><span class="pt">,</span>
  <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span>
    <span class="cm">// Multiple mutations, single update</span>
    <span class="pr">count</span><span class="pt">++</span>
    <span class="pr">label</span> <span class="pt">=</span> <span class="st">'clicked'</span>
    <span class="fn">update</span><span class="pt">()</span>
  <span class="pt">})</span>
<span class="pt">)</span></pre></div></div>
      <div class="docs-callout"><strong>Tip:</strong> You can call <code>update()</code> from anywhere—event handlers, timers, fetch callbacks, anywhere.</div>
    `,
  },
  {
    id: "dynamic-functions",
    group: "Core Concepts",
    groupTitle: "Core Concepts",
    title: "Dynamic Functions",
    content: `
      <p>For text children and attribute values, you can pass a zero-argument function. On every <code>update()</code> call, Nuclo re-runs these functions and patches only changed values.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">name</span> <span class="pt">=</span> <span class="st">'Alice'</span>

<span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="cm">// Static string — never changes</span>
  <span class="fn">h1</span><span class="pt">(</span><span class="st">"Welcome"</span><span class="pt">),</span>
  <span class="cm">// Dynamic function — re-evaluated on update()</span>
  <span class="fn">p</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Hello, </span><span class="pt">\${</span><span class="pr">name</span><span class="pt">}\`),</span>
<span class="pt">)</span></pre></div></div>
      <p>Dynamic functions work for text content, attributes, styles, and class names. For dynamic branches or children, use <code>when()</code> and <code>list()</code>.</p>
    `,
  },
  {
    id: "tag-builders",
    group: "Core Concepts",
    groupTitle: "Core Concepts",
    title: "Tag Builders",
    content: `
      <p>After <code>import 'nuclo'</code>, every HTML and SVG tag is available as a global function. Tag builders accept any combination of:</p>
      <ul>
        <li><strong>Strings / numbers</strong> — text nodes</li>
        <li><strong>() =&gt; string</strong> — dynamic text nodes</li>
        <li><strong>HTMLElement / Node</strong> — child nodes</li>
        <li><strong>NodeModFn</strong> — child builders such as <code>div()</code>, <code>span()</code>, <code>when()</code>, and <code>list()</code></li>
        <li><strong>Attribute objects</strong> — <code>{ id, class, href, ... }</code></li>
        <li><strong>Style helpers</strong> — <code>cn(...)</code> results from <code>createStyleQueries</code></li>
      </ul>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">const</span> <span class="pr">card</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="pt">{</span> <span class="pr">id</span><span class="pt">:</span> <span class="st">"card-1"</span><span class="pt">,</span> <span class="pr">class</span><span class="pt">:</span> <span class="st">"card"</span> <span class="pt">},</span>
  <span class="fn">h2</span><span class="pt">(</span><span class="st">"Title"</span><span class="pt">),</span>
  <span class="fn">p</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">dynamicContent</span><span class="pt">),</span>
  <span class="fn">button</span><span class="pt">(</span><span class="st">"Click"</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pr">handler</span><span class="pt">)),</span>
<span class="pt">)</span></pre></div></div>
      <p>SVG tags are available as <code>svgSvg()</code>, <code>pathSvg()</code>, <code>circleSvg()</code>, etc. All accept the same argument patterns.</p>
    `,
  },
  {
    id: "attributes",
    group: "Core Concepts",
    groupTitle: "Core Concepts",
    title: "Attributes",
    content: `
      <p>Pass an object as the first argument (or any argument) to set attributes. Values can be static or dynamic functions:</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">disabled</span> <span class="pt">=</span> <span class="kw">false</span>
<span class="kw">let</span> <span class="pr">href</span> <span class="pt">=</span> <span class="st">'/page'</span>

<span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">a</span><span class="pt">(</span>
  <span class="pt">{</span>
    <span class="pr">href</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pr">href</span><span class="pt">,</span>
    <span class="pr">disabled</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pr">disabled</span><span class="pt">,</span>
    <span class="pr">class</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pr">disabled</span> <span class="pt">?</span> <span class="st">'link disabled'</span> <span class="pt">:</span> <span class="st">'link'</span><span class="pt">,</span>
  <span class="pt">},</span>
  <span class="st">"Click me"</span><span class="pt">,</span>
<span class="pt">)</span></pre></div></div>
      <p>Nuclo handles boolean attributes correctly: <code>disabled: true</code> sets the attribute, <code>disabled: false</code> removes it.</p>
    `,
  },
  {
    id: "events",
    group: "Core Concepts",
    groupTitle: "Core Concepts",
    title: "Events",
    content: `
      <p>Use the <code>on()</code> helper to attach event listeners. It returns an internal marker object that Nuclo processes during element creation.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">const</span> <span class="pr">btn</span> <span class="pt">=</span> <span class="fn">button</span><span class="pt">(</span>
  <span class="st">"Submit"</span><span class="pt">,</span>
  <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">)</span> <span class="pt">=></span> <span class="pt">{</span>
    <span class="pr">e</span><span class="pt">.</span><span class="fn">preventDefault</span><span class="pt">()</span>
    <span class="fn">submitForm</span><span class="pt">()</span>
  <span class="pt">}),</span>
  <span class="fn">on</span><span class="pt">(</span><span class="st">"keydown"</span><span class="pt">,</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">)</span> <span class="pt">=></span> <span class="pt">{</span>
    <span class="kw">if</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">.</span><span class="pr">key</span> <span class="pt">===</span> <span class="st">'Enter'</span><span class="pt">)</span> <span class="fn">submitForm</span><span class="pt">()</span>
  <span class="pt">}),</span>
<span class="pt">)</span></pre></div></div>
      <p>You can attach multiple <code>on()</code> calls to the same element. Event listeners are registered once and never re-attached.</p>
    `,
  },

  // ── API Reference ─────────────────────────────────────────────────────────
  {
    id: "api-update",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "update()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">update</span><span class="pt">(...</span><span class="pr">scopeIds</span><span class="pt">:</span> <span class="ty">string</span><span class="pt">[]):</span> <span class="ty">void</span>`,
    content: `
      <p>Triggers a synchronous DOM sync. Dynamic text, reactive attributes, <code>when()</code> branches, and <code>list()</code> runtimes are re-evaluated, and only changed values are patched into the DOM.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">x</span> <span class="pt">=</span> <span class="nm">1</span>
<span class="kw">let</span> <span class="pr">y</span> <span class="pt">=</span> <span class="nm">2</span>

<span class="fn">setTimeout</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">{</span>
  <span class="pr">x</span> <span class="pt">=</span> <span class="nm">10</span>
  <span class="pr">y</span> <span class="pt">=</span> <span class="nm">20</span>
  <span class="fn">update</span><span class="pt">()</span> <span class="cm">// DOM reflects x=10, y=20 in one pass</span>
<span class="pt">},</span> <span class="nm">1000</span><span class="pt">)</span></pre></div></div>
      <p><code>update()</code> is synchronous. With no arguments it updates every registered runtime; with scope IDs it updates only roots registered by <code>scope("id")</code>.</p>
    `,
  },
  {
    id: "api-render",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "render()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">render</span><span class="pt">(</span><span class="pr">nodeModFn</span><span class="pt">:</span> <span class="ty">NodeModFn</span><span class="pt">,</span> <span class="pr">parent</span><span class="pt">?:</span> <span class="ty">Element</span><span class="pt">,</span> <span class="pr">index</span><span class="pt">?:</span> <span class="ty">number</span><span class="pt">):</span> <span class="ty">ExpandedElement</span>`,
    content: `
      <p>Calls a Nuclo builder and appends the created element to a parent. The parent defaults to <code>document.body</code>; pass an <code>Element</code> reference when mounting into a specific container.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">main.ts</span></div><div class="code-block-body"><pre><span class="kw">import</span> <span class="st">'nuclo'</span>
<span class="kw">import</span> <span class="pt">{</span> <span class="pr">App</span> <span class="pt">}</span> <span class="kw">from</span> <span class="st">'./app.ts'</span>

<span class="kw">const</span> <span class="pr">root</span> <span class="pt">=</span> <span class="pr">document</span><span class="pt">.</span><span class="fn">getElementById</span><span class="pt">(</span><span class="st">'root'</span><span class="pt">)</span><span class="pt">!</span>
<span class="fn">render</span><span class="pt">(</span><span class="fn">App</span><span class="pt">(),</span> <span class="pr">root</span><span class="pt">)</span></pre></div></div>
      <p><code>render()</code> appends the element; it does not clear the parent first. Initial dynamic text and attributes are evaluated during creation.</p>
    `,
  },
  {
    id: "api-hydrate",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "hydrate()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">hydrate</span><span class="pt">(</span><span class="pr">nodeModFn</span><span class="pt">:</span> <span class="ty">NodeModFn</span><span class="pt">,</span> <span class="pr">parent</span><span class="pt">?:</span> <span class="ty">Element</span><span class="pt">):</span> <span class="ty">ExpandedElement</span>`,
    content: `
      <p>Hydrates existing SSR HTML by walking the DOM in parallel with the same Nuclo component tree. Existing elements are claimed and event listeners, reactive attributes, reactive text, <code>when()</code>, and <code>list()</code> runtimes are registered on them.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">main.ts</span></div><div class="code-block-body"><pre><span class="kw">import</span> <span class="st">'nuclo'</span>
<span class="kw">import</span> <span class="pt">{</span> <span class="pr">App</span> <span class="pt">}</span> <span class="kw">from</span> <span class="st">'./app.ts'</span>

<span class="kw">const</span> <span class="pr">root</span> <span class="pt">=</span> <span class="pr">document</span><span class="pt">.</span><span class="fn">getElementById</span><span class="pt">(</span><span class="st">'app'</span><span class="pt">)</span><span class="pt">!</span>
<span class="fn">hydrate</span><span class="pt">(</span><span class="fn">App</span><span class="pt">(),</span> <span class="pr">root</span><span class="pt">)</span></pre></div></div>
      <p>Use <code>hydrate()</code> for server-rendered markup. Use <code>render()</code> when the client should create and append fresh DOM.</p>
    `,
  },
  {
    id: "api-on",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "on()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">on</span><span class="pt">&lt;</span><span class="ty">K</span> <span class="kw">extends</span> <span class="kw">keyof</span> <span class="ty">HTMLElementEventMap</span><span class="pt">&gt;(</span>\n  <span class="pr">event</span><span class="pt">:</span> <span class="ty">K</span><span class="pt">,</span>\n  <span class="pr">handler</span><span class="pt">:</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">:</span> <span class="ty">HTMLElementEventMap</span><span class="pt">[</span><span class="ty">K</span><span class="pt">])</span> <span class="pt">=></span> <span class="ty">void</span>\n<span class="pt">)</span>`,
    content: `
      <p>Creates an event listener descriptor. Pass the result as an argument to any tag builder. The listener is attached once during element creation.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">input</span><span class="pt">(</span>
  <span class="fn">on</span><span class="pt">(</span><span class="st">"input"</span><span class="pt">,</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">)</span> <span class="pt">=></span> <span class="pt">{</span>
    <span class="pr">query</span> <span class="pt">=</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">.</span><span class="pr">target</span> <span class="kw">as</span> <span class="ty">HTMLInputElement</span><span class="pt">).</span><span class="pr">value</span>
    <span class="fn">update</span><span class="pt">()</span>
  <span class="pt">}),</span>
  <span class="fn">on</span><span class="pt">(</span><span class="st">"keydown"</span><span class="pt">,</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">)</span> <span class="pt">=></span> <span class="pt">{</span>
    <span class="kw">if</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">.</span><span class="pr">key</span> <span class="pt">===</span> <span class="st">'Escape'</span><span class="pt">)</span> <span class="pt">{</span> <span class="pr">query</span> <span class="pt">=</span> <span class="st">''</span><span class="pt">;</span> <span class="fn">update</span><span class="pt">()</span> <span class="pt">}</span>
  <span class="pt">}),</span>
<span class="pt">)</span></pre></div></div>
    `,
  },
  {
    id: "api-when",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "when()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">when</span><span class="pt">(</span><span class="pr">condition</span><span class="pt">:</span> <span class="ty">boolean</span> <span class="pt">|</span> <span class="pt">(()</span> <span class="pt">=></span> <span class="ty">boolean</span><span class="pt">),</span> <span class="pt">...</span><span class="pr">content</span><span class="pt">:</span> <span class="ty">WhenContent</span><span class="pt">[]):</span> <span class="ty">WhenBuilder</span>`,
    content: `
      <p>Conditionally renders content. Conditions may be booleans or dynamic functions re-evaluated on every <code>update()</code>. Chain <code>.when()</code> for additional branches and <code>.else()</code> for the fallback branch.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">loggedIn</span> <span class="pt">=</span> <span class="kw">false</span>

<span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">when</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">loggedIn</span><span class="pt">,</span>
    <span class="fn">span</span><span class="pt">(</span><span class="st">"Welcome back!"</span><span class="pt">)</span>
  <span class="pt">).</span><span class="fn">else</span><span class="pt">(</span>
    <span class="fn">button</span><span class="pt">(</span><span class="st">"Log in"</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pr">login</span><span class="pt">))</span>
  <span class="pt">),</span>
<span class="pt">)</span></pre></div></div>
      <p>Each branch accepts one or more tag-builder modifiers: strings, nodes, attribute objects, builders, <code>list()</code>, or nested <code>when()</code> calls.</p>
    `,
  },
  {
    id: "api-list",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "list()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">list</span><span class="pt">&lt;</span><span class="ty">T</span><span class="pt">&gt;(</span><span class="pr">items</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="kw">readonly</span> <span class="ty">T</span><span class="pt">[]</span> <span class="pt">|</span> <span class="ty">Iterable</span><span class="pt">&lt;</span><span class="ty">T</span><span class="pt">&gt;,</span> <span class="pr">render</span><span class="pt">:</span> <span class="pt">(</span><span class="pr">item</span><span class="pt">:</span> <span class="ty">T</span><span class="pt">,</span> <span class="pr">index</span><span class="pt">:</span> <span class="ty">number</span><span class="pt">)</span> <span class="pt">=></span> <span class="ty">ListRenderResult</span><span class="pt">)</span>`,
    content: `
      <p>Renders a dynamic list. The <code>items</code> function is re-evaluated on every <code>update()</code>; Nuclo compares item identity and adds, removes, or reorders DOM nodes as needed.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">items</span><span class="pt">:</span> <span class="ty">string</span><span class="pt">[] =</span> <span class="pt">[</span><span class="st">'Apple'</span><span class="pt">,</span> <span class="st">'Banana'</span><span class="pt">]</span>

<span class="kw">const</span> <span class="pr">listEl</span> <span class="pt">=</span> <span class="fn">ul</span><span class="pt">(</span>
  <span class="fn">list</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">items</span><span class="pt">,</span>
    <span class="pt">(</span><span class="pr">item</span><span class="pt">)</span> <span class="pt">=></span> <span class="fn">li</span><span class="pt">(</span><span class="pr">item</span><span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">)</span>

<span class="cm">// Later:</span>
<span class="pr">items</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="st">'Cherry'</span><span class="pt">)</span>
<span class="fn">update</span><span class="pt">()</span></pre></div></div>
      <p><code>list()</code> accepts arrays, readonly arrays, and any iterable. Elements are reused when the same item object or primitive value is still present.</p>
    `,
  },
  {
    id: "api-scope",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "scope()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">scope</span><span class="pt">(...</span><span class="pr">ids</span><span class="pt">:</span> <span class="ty">string</span><span class="pt">[]):</span> <span class="ty">NodeModFn</span>`,
    content: `
      <p><code>scope()</code> registers an element as a named update root. Later, <code>update("id")</code> updates only runtimes contained by matching connected roots.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">scope</span><span class="pt">(</span><span class="st">"cart"</span><span class="pt">),</span>
  <span class="fn">span</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Items: </span><span class="pt">\${</span><span class="pr">cartItems</span><span class="pt">.</span><span class="pr">length</span><span class="pt">}\`)</span>
<span class="pt">)</span>

<span class="pr">cartItems</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">nextItem</span><span class="pt">)</span>
<span class="fn">update</span><span class="pt">(</span><span class="st">"cart"</span><span class="pt">)</span></pre></div></div>
      <p>A plain <code>update()</code> is still global. Use scoped updates when you know exactly which named area changed.</p>
    `,
  },
  {
    id: "api-styling",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "Styling",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">createStyleQueries</span><span class="pt">(</span><span class="pr">queries</span><span class="pt">:</span> <span class="ty">Record</span><span class="pt">&lt;</span><span class="ty">string</span><span class="pt">,</span> <span class="ty">string</span><span class="pt">&gt;</span><span class="pt">):</span> <span class="ty">StyleQueryBuilder</span>`,
    content: `
      <p>Nuclo exports chainable style helpers such as <code>padding()</code>, <code>fontSize()</code>, <code>color()</code>, <code>display()</code>, and <code>border()</code>. A <code>StyleBuilder</code> becomes a generated CSS class, and <code>createStyleQueries()</code> adds media, container, supports, and pseudo-class rules.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">styles.ts</span></div><div class="code-block-body"><pre><span class="kw">import</span> <span class="st">'nuclo'</span>

<span class="kw">const</span> <span class="pr">cn</span> <span class="pt">=</span> <span class="fn">createStyleQueries</span><span class="pt">({</span>
  <span class="pr">medium</span><span class="pt">:</span> <span class="st">"@media (min-width: 768px)"</span><span class="pt">,</span>
<span class="pt">})</span>

<span class="kw">const</span> <span class="pr">cardClass</span> <span class="pt">=</span> <span class="fn">cn</span><span class="pt">(</span>
  <span class="fn">padding</span><span class="pt">(</span><span class="st">"16px"</span><span class="pt">).</span><span class="fn">border</span><span class="pt">(</span><span class="st">"1px solid #ddd"</span><span class="pt">),</span>
  <span class="pt">{</span>
    <span class="pr">medium</span><span class="pt">:</span> <span class="fn">padding</span><span class="pt">(</span><span class="st">"24px"</span><span class="pt">),</span>
    <span class="pr">hover</span><span class="pt">:</span> <span class="fn">borderColor</span><span class="pt">(</span><span class="st">"#3869ec"</span><span class="pt">),</span>
  <span class="pt">}</span>
<span class="pt">)</span>

<span class="kw">const</span> <span class="pr">card</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span><span class="pr">cardClass</span><span class="pt">,</span> <span class="st">"Responsive card"</span><span class="pt">)</span></pre></div></div>
      <p>The returned object has a single <code>className</code> key, so it can be passed directly to tag builders and merges with other class attributes.</p>
    `,
  },
  {
    id: "api-ssr",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "SSR",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">renderToString</span><span class="pt">(</span><span class="pr">input</span><span class="pt">:</span> <span class="ty">NodeModFn</span> <span class="pt">|</span> <span class="ty">Element</span> <span class="pt">|</span> <span class="ty">Node</span><span class="pt">):</span> <span class="ty">string</span>`,
    content: `
      <p>The <code>nuclo/ssr</code> entry exports <code>renderToString()</code>, <code>renderManyToString()</code>, <code>renderToStringWithContainer()</code>, and <code>setSSRCollector()</code>. In Node.js, load the Nuclo polyfill before creating DOM nodes.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">server.ts</span></div><div class="code-block-body"><pre><span class="kw">import</span> <span class="st">'nuclo/polyfill'</span>
<span class="kw">import</span> <span class="st">'nuclo'</span>
<span class="kw">import</span> <span class="pt">{</span> <span class="pr">renderToString</span> <span class="pt">}</span> <span class="kw">from</span> <span class="st">'nuclo/ssr'</span>

<span class="kw">const</span> <span class="pr">html</span> <span class="pt">=</span> <span class="fn">renderToString</span><span class="pt">(</span>
  <span class="fn">div</span><span class="pt">(</span><span class="pt">{</span> <span class="pr">id</span><span class="pt">:</span> <span class="st">"app"</span> <span class="pt">},</span> <span class="fn">h1</span><span class="pt">(</span><span class="st">"Hello from SSR"</span><span class="pt">))</span>
<span class="pt">)</span></pre></div></div>
      <p>SSR evaluates dynamic functions once for the current state. On the client, call <code>hydrate()</code> with the same component tree to attach Nuclo runtime behavior to the existing markup.</p>
    `,
  },

  // ── Patterns ──────────────────────────────────────────────────────────────
  {
    id: "components",
    group: "Patterns",
    groupTitle: "Patterns",
    title: "Component Functions",
    content: `
      <p>In Nuclo, "components" are just plain functions that return a DOM element. There is no special component API.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">Button.ts</span></div><div class="code-block-body"><pre><span class="kw">interface</span> <span class="ty">ButtonProps</span> <span class="pt">{</span>
  <span class="pr">label</span><span class="pt">:</span> <span class="ty">string</span>
  <span class="pr">onClick</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="ty">void</span>
<span class="pt">}</span>

<span class="kw">export function</span> <span class="fn">Button</span><span class="pt">({</span> <span class="pr">label</span><span class="pt">,</span> <span class="pr">onClick</span> <span class="pt">}:</span> <span class="ty">ButtonProps</span><span class="pt">) {</span>
  <span class="kw">return</span> <span class="fn">button</span><span class="pt">(</span><span class="pr">label</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pr">onClick</span><span class="pt">))</span>
<span class="pt">}</span></pre></div></div>
      <p>State lives in the enclosing scope. Multiple calls to the same function create independent instances with independent state.</p>
    `,
  },
  {
    id: "computed",
    group: "Patterns",
    groupTitle: "Patterns",
    title: "Computed Values",
    content: `
      <p>There is no special computed/derived-state API. Use plain JavaScript expressions or functions:</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">items</span> <span class="pt">=</span> <span class="pt">[</span><span class="st">'a'</span><span class="pt">,</span> <span class="st">'b'</span><span class="pt">,</span> <span class="st">'c'</span><span class="pt">]</span>
<span class="kw">let</span> <span class="pr">filter</span> <span class="pt">=</span> <span class="st">'all'</span>

<span class="cm">// Derived — recomputed inline in the dynamic function</span>
<span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">span</span><span class="pt">(()</span> <span class="pt">=></span>
  <span class="pt">\`</span><span class="st">Showing </span><span class="pt">\${</span><span class="pr">items</span><span class="pt">.</span><span class="pr">length</span><span class="pt">}</span><span class="st"> items</span><span class="pt">\`</span>
<span class="pt">)</span>

<span class="cm">// Or extract to a helper function</span>
<span class="kw">function</span> <span class="fn">visibleItems</span><span class="pt">() {</span>
  <span class="kw">return</span> <span class="pr">filter</span> <span class="pt">===</span> <span class="st">'all'</span> <span class="pt">?</span> <span class="pr">items</span> <span class="pt">:</span> <span class="pr">items</span><span class="pt">.</span><span class="fn">filter</span><span class="pt">(</span><span class="pr">i</span> <span class="pt">=></span> <span class="pr">i</span> <span class="pt">===</span> <span class="pr">filter</span><span class="pt">)</span>
<span class="pt">}</span></pre></div></div>
    `,
  },
  {
    id: "async",
    group: "Patterns",
    groupTitle: "Patterns",
    title: "Async & Loading",
    content: `
      <p>Handle async operations with plain <code>async/await</code> and call <code>update()</code> when state changes:</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">status</span><span class="pt">:</span> <span class="st">'idle'</span> <span class="pt">|</span> <span class="st">'loading'</span> <span class="pt">|</span> <span class="st">'done'</span> <span class="pt">|</span> <span class="st">'error'</span> <span class="pt">=</span> <span class="st">'idle'</span>
<span class="kw">let</span> <span class="pr">data</span><span class="pt">:</span> <span class="ty">unknown</span> <span class="pt">=</span> <span class="kw">null</span>

<span class="kw">async function</span> <span class="fn">loadData</span><span class="pt">() {</span>
  <span class="pr">status</span> <span class="pt">=</span> <span class="st">'loading'</span>
  <span class="fn">update</span><span class="pt">()</span>
  <span class="kw">try</span> <span class="pt">{</span>
    <span class="pr">data</span> <span class="pt">=</span> <span class="kw">await</span> <span class="fn">fetch</span><span class="pt">(</span><span class="st">'/api/data'</span><span class="pt">).</span><span class="fn">then</span><span class="pt">(</span><span class="pr">r</span> <span class="pt">=></span> <span class="pr">r</span><span class="pt">.</span><span class="fn">json</span><span class="pt">())</span>
    <span class="pr">status</span> <span class="pt">=</span> <span class="st">'done'</span>
  <span class="pt">}</span> <span class="kw">catch</span> <span class="pt">{</span>
    <span class="pr">status</span> <span class="pt">=</span> <span class="st">'error'</span>
  <span class="pt">}</span>
  <span class="fn">update</span><span class="pt">()</span>
<span class="pt">}</span></pre></div></div>
      <p>Call <code>update()</code> once before the await (to show loading state) and once after (to show results).</p>
    `,
  },
  {
    id: "best-practices",
    group: "Patterns",
    groupTitle: "Patterns",
    title: "Best Practices",
    content: `
      <ul>
        <li><strong>Batch mutations</strong> — change multiple variables, call <code>update()</code> once at the end.</li>
        <li><strong>Keep state flat</strong> — nested objects still work, but flat state is simpler to reason about.</li>
        <li><strong>Use functions for components</strong> — each call creates a new instance with its own closure state.</li>
        <li><strong>Avoid effects</strong> — Nuclo has no effect system. Use event handlers, timers, and fetch callbacks directly.</li>
        <li><strong>SSR warm-up</strong> — for SSR, call all pages once before serving to collect CSS class names.</li>
        <li><strong>Dynamic functions are cheap</strong> — don't over-optimize; only functions that actually changed will patch the DOM.</li>
      </ul>
      <div class="docs-callout">
        <strong>Tip:</strong> Treat <code>update()</code> like a commit. Batch all your mutations, then call it once to flush the DOM.
      </div>
    `,
  },
];

export const SECTION_MAP = new Map<string, DocSection>(
  DOC_SECTIONS.map(s => [s.id, s])
);
