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
    sections: ["api-update", "api-render", "api-on", "api-when", "api-list", "api-scope"],
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
      <p>Then import it once at your entry point. The import is a side-effect that globally registers 140+ tag builder functions:</p>
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
      <p>No special <code>tsconfig</code> changes are required. The globals are picked up automatically once you import <code>'nuclo'</code>.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">tsconfig.json</span></div><div class="code-block-body"><pre><span class="pt">{</span>
  <span class="pr">"compilerOptions"</span><span class="pt">:</span> <span class="pt">{</span>
    <span class="pr">"target"</span><span class="pt">:</span> <span class="st">"ES2020"</span><span class="pt">,</span>
    <span class="pr">"module"</span><span class="pt">:</span> <span class="st">"ESNext"</span><span class="pt">,</span>
    <span class="pr">"moduleResolution"</span><span class="pt">:</span> <span class="st">"bundler"</span><span class="pt">,</span>
    <span class="pr">"strict"</span><span class="pt">:</span> <span class="kw">true</span>
  <span class="pt">}</span>
<span class="pt">}</span></pre></div></div>
      <p>All 140+ tag builders accept typed attribute objects, dynamic functions, and class-name helpers. Your editor will autocomplete everything.</p>
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
      <p>Anywhere Nuclo accepts a value, you can pass a function that returns that value. On every <code>update()</code> call, Nuclo re-runs these functions and patches only the changed parts.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">name</span> <span class="pt">=</span> <span class="st">'Alice'</span>

<span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="cm">// Static string — never changes</span>
  <span class="fn">h1</span><span class="pt">(</span><span class="st">"Welcome"</span><span class="pt">),</span>
  <span class="cm">// Dynamic function — re-evaluated on update()</span>
  <span class="fn">p</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Hello, </span><span class="pt">\${</span><span class="pr">name</span><span class="pt">}\`),</span>
<span class="pt">)</span></pre></div></div>
      <p>Dynamic functions work for text content, attributes, styles, class names, and child elements. They are lightweight—just functions called on demand.</p>
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
        <li><strong>HTMLElement</strong> — child elements</li>
        <li><strong>Attribute objects</strong> — <code>{ id, class, href, ... }</code></li>
        <li><strong>Style helpers</strong> — from <code>createStyleQueries</code></li>
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
    apiSig: `<span class="kw">function</span> <span class="fn">update</span><span class="pt">():</span> <span class="ty">void</span>`,
    content: `
      <p>Triggers a synchronous DOM sync. Every dynamic function registered in the current tree is re-evaluated, and any changed values are patched into the DOM.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">x</span> <span class="pt">=</span> <span class="nm">1</span>
<span class="kw">let</span> <span class="pr">y</span> <span class="pt">=</span> <span class="nm">2</span>

<span class="fn">setTimeout</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">{</span>
  <span class="pr">x</span> <span class="pt">=</span> <span class="nm">10</span>
  <span class="pr">y</span> <span class="pt">=</span> <span class="nm">20</span>
  <span class="fn">update</span><span class="pt">()</span> <span class="cm">// DOM reflects x=10, y=20 in one pass</span>
<span class="pt">},</span> <span class="nm">1000</span><span class="pt">)</span></pre></div></div>
      <p><code>update()</code> is synchronous and fast. Call it as often as you need—it only visits nodes with dynamic functions.</p>
    `,
  },
  {
    id: "api-render",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "render()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">render</span><span class="pt">(</span><span class="pr">element</span><span class="pt">:</span> <span class="ty">HTMLElement</span><span class="pt">,</span> <span class="pr">target</span><span class="pt">:</span> <span class="ty">HTMLElement</span> <span class="pt">|</span> <span class="ty">string</span><span class="pt">):</span> <span class="ty">void</span>`,
    content: `
      <p>Mounts a Nuclo element into a container. The target can be an <code>HTMLElement</code> reference or a CSS selector string.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">main.ts</span></div><div class="code-block-body"><pre><span class="kw">import</span> <span class="st">'nuclo'</span>
<span class="kw">import</span> <span class="pt">{</span> <span class="pr">App</span> <span class="pt">}</span> <span class="kw">from</span> <span class="st">'./app.ts'</span>

<span class="fn">render</span><span class="pt">(</span><span class="fn">App</span><span class="pt">(),</span> <span class="st">'#root'</span><span class="pt">)</span></pre></div></div>
      <p>The container's existing children are replaced. Call <code>update()</code> after <code>render()</code> if you need to reflect initial state.</p>
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
    apiSig: `<span class="kw">function</span> <span class="fn">when</span><span class="pt">(</span><span class="pr">condition</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="ty">boolean</span><span class="pt">,</span> <span class="pr">content</span><span class="pt">:</span> <span class="ty">NucloChild</span><span class="pt">).</span><span class="fn">else</span><span class="pt">(</span><span class="pr">alt</span><span class="pt">:</span> <span class="ty">NucloChild</span><span class="pt">)</span>`,
    content: `
      <p>Conditionally renders content. The <code>condition</code> is a dynamic function re-evaluated on every <code>update()</code>. Chain <code>.else()</code> for the falsy branch.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">loggedIn</span> <span class="pt">=</span> <span class="kw">false</span>

<span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">when</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">loggedIn</span><span class="pt">,</span>
    <span class="fn">span</span><span class="pt">(</span><span class="st">"Welcome back!"</span><span class="pt">)</span>
  <span class="pt">).</span><span class="fn">else</span><span class="pt">(</span>
    <span class="fn">button</span><span class="pt">(</span><span class="st">"Log in"</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pr">login</span><span class="pt">))</span>
  <span class="pt">),</span>
<span class="pt">)</span></pre></div></div>
      <p>The content argument can be a static node, a dynamic function, or a string—the same types accepted by tag builders.</p>
    `,
  },
  {
    id: "api-list",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "list()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">list</span><span class="pt">&lt;</span><span class="ty">T</span><span class="pt">&gt;(</span><span class="pr">items</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="ty">T</span><span class="pt">[],</span> <span class="pr">render</span><span class="pt">:</span> <span class="pt">(</span><span class="pr">item</span><span class="pt">:</span> <span class="ty">T</span><span class="pt">,</span> <span class="pr">index</span><span class="pt">:</span> <span class="ty">number</span><span class="pt">)</span> <span class="pt">=></span> <span class="ty">HTMLElement</span><span class="pt">)</span>`,
    content: `
      <p>Renders a dynamic list. The <code>items</code> function is re-evaluated on every <code>update()</code>; Nuclo diffs the result and adds, removes, or reorders DOM nodes as needed.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">let</span> <span class="pr">items</span><span class="pt">:</span> <span class="ty">string</span><span class="pt">[] =</span> <span class="pt">[</span><span class="st">'Apple'</span><span class="pt">,</span> <span class="st">'Banana'</span><span class="pt">]</span>

<span class="kw">const</span> <span class="pr">listEl</span> <span class="pt">=</span> <span class="fn">ul</span><span class="pt">(</span>
  <span class="fn">list</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">items</span><span class="pt">,</span>
    <span class="pt">(</span><span class="pr">item</span><span class="pt">)</span> <span class="pt">=></span> <span class="fn">li</span><span class="pt">(</span><span class="pr">item</span><span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">)</span>

<span class="cm">// Later:</span>
<span class="pr">items</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="st">'Cherry'</span><span class="pt">)</span>
<span class="fn">update</span><span class="pt">()</span></pre></div></div>
      <p><code>list()</code> can also be used with a single slot function to swap out a single child — for example, in a router.</p>
    `,
  },
  {
    id: "api-scope",
    group: "API Reference",
    groupTitle: "API Reference",
    title: "scope()",
    apiTag: "fn",
    apiSig: `<span class="kw">function</span> <span class="fn">scope</span><span class="pt">(</span><span class="pr">fn</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="ty">HTMLElement</span><span class="pt">):</span> <span class="ty">HTMLElement</span>`,
    content: `
      <p><code>scope()</code> creates an isolated update boundary. Dynamic functions inside a scope only re-run when <code>update()</code> is called within that scope, not during global updates.</p>
      <div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">example.ts</span></div><div class="code-block-body"><pre><span class="kw">const</span> <span class="pr">el</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">scope</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">{</span>
    <span class="kw">let</span> <span class="pr">localCount</span> <span class="pt">=</span> <span class="nm">0</span>
    <span class="kw">return</span> <span class="fn">button</span><span class="pt">(</span>
      <span class="pt">()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Local: </span><span class="pt">\${</span><span class="pr">localCount</span><span class="pt">}\`,</span>
      <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span> <span class="pr">localCount</span><span class="pt">++;</span> <span class="fn">update</span><span class="pt">()</span> <span class="pt">})</span>
    <span class="pt">)</span>
  <span class="pt">})</span>
<span class="pt">)</span></pre></div></div>
      <p>Use scopes to prevent expensive subtrees from re-running during global updates.</p>
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
