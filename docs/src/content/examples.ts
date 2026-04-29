export interface ExampleEntry {
  id: string;
  title: string;
  desc: string;
  code: string;
}

export const EXAMPLES: ExampleEntry[] = [
  {
    id: "counter",
    title: "Counter",
    desc: "Minimal counter demo — mutate state, call update(). The simplest possible Nuclo example.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>

<span class="kw">let</span> <span class="pr">count</span> <span class="pt">=</span> <span class="nm">0</span>

<span class="kw">export function</span> <span class="fn">Counter</span><span class="pt">() {</span>
  <span class="kw">return</span> <span class="fn">div</span><span class="pt">(</span>
    <span class="fn">div</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Count: </span><span class="pt">\${</span><span class="pr">count</span><span class="pt">}\`),</span>
    <span class="fn">button</span><span class="pt">(</span><span class="st">"−"</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span> <span class="pr">count</span><span class="pt">--;</span> <span class="fn">update</span><span class="pt">()</span> <span class="pt">})),</span>
    <span class="fn">button</span><span class="pt">(</span><span class="st">"Reset"</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span> <span class="pr">count</span> <span class="pt">=</span> <span class="nm">0</span><span class="pt">;</span> <span class="fn">update</span><span class="pt">()</span> <span class="pt">})),</span>
    <span class="fn">button</span><span class="pt">(</span><span class="st">"+"</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span> <span class="pr">count</span><span class="pt">++;</span> <span class="fn">update</span><span class="pt">()</span> <span class="pt">})),</span>
  <span class="pt">)</span>
<span class="pt">}</span>`,
  },
  {
    id: "todo",
    title: "Todo List",
    desc: "Add, complete, and delete tasks. Filter by all / active / done. Classic todo with Nuclo state.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>

<span class="kw">interface</span> <span class="ty">Todo</span> <span class="pt">{</span> <span class="pr">text</span><span class="pt">:</span> <span class="ty">string</span><span class="pt">;</span> <span class="pr">done</span><span class="pt">:</span> <span class="ty">boolean</span> <span class="pt">}</span>
<span class="kw">let</span> <span class="pr">todos</span><span class="pt">:</span> <span class="ty">Todo</span><span class="pt">[] =</span> <span class="pt">[]</span>
<span class="kw">let</span> <span class="pr">filter</span><span class="pt">:</span> <span class="st">'all'</span> <span class="pt">|</span> <span class="st">'active'</span> <span class="pt">|</span> <span class="st">'done'</span> <span class="pt">=</span> <span class="st">'all'</span>

<span class="kw">function</span> <span class="fn">visible</span><span class="pt">() {</span>
  <span class="kw">if</span> <span class="pt">(</span><span class="pr">filter</span> <span class="pt">===</span> <span class="st">'active'</span><span class="pt">)</span> <span class="kw">return</span> <span class="pr">todos</span><span class="pt">.</span><span class="fn">filter</span><span class="pt">(</span><span class="pr">t</span> <span class="pt">=></span> <span class="pt">!</span><span class="pr">t</span><span class="pt">.</span><span class="pr">done</span><span class="pt">)</span>
  <span class="kw">if</span> <span class="pt">(</span><span class="pr">filter</span> <span class="pt">===</span> <span class="st">'done'</span><span class="pt">)</span>   <span class="kw">return</span> <span class="pr">todos</span><span class="pt">.</span><span class="fn">filter</span><span class="pt">(</span><span class="pr">t</span> <span class="pt">=></span> <span class="pr">t</span><span class="pt">.</span><span class="pr">done</span><span class="pt">)</span>
  <span class="kw">return</span> <span class="pr">todos</span>
<span class="pt">}</span>

<span class="kw">export function</span> <span class="fn">TodoList</span><span class="pt">() {</span>
  <span class="kw">const</span> <span class="pr">inp</span> <span class="pt">=</span> <span class="fn">input</span><span class="pt">({</span> <span class="pr">type</span><span class="pt">:</span> <span class="st">'text'</span><span class="pt">,</span> <span class="pr">placeholder</span><span class="pt">:</span> <span class="st">'Add a task…'</span> <span class="pt">})</span>
  <span class="kw">function</span> <span class="fn">add</span><span class="pt">() {</span>
    <span class="kw">const</span> <span class="pr">v</span> <span class="pt">= (</span><span class="pr">inp</span> <span class="kw">as</span> <span class="ty">HTMLInputElement</span><span class="pt">).</span><span class="pr">value</span><span class="pt">.</span><span class="fn">trim</span><span class="pt">()</span>
    <span class="kw">if</span> <span class="pt">(!</span><span class="pr">v</span><span class="pt">)</span> <span class="kw">return</span>
    <span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">({</span> <span class="pr">text</span><span class="pt">:</span> <span class="pr">v</span><span class="pt">,</span> <span class="pr">done</span><span class="pt">:</span> <span class="kw">false</span> <span class="pt">})</span>
    <span class="pt">(</span><span class="pr">inp</span> <span class="kw">as</span> <span class="ty">HTMLInputElement</span><span class="pt">).</span><span class="pr">value</span> <span class="pt">=</span> <span class="st">''</span>
    <span class="fn">update</span><span class="pt">()</span>
  <span class="pt">}</span>
  <span class="kw">return</span> <span class="fn">div</span><span class="pt">(</span>
    <span class="fn">div</span><span class="pt">(</span><span class="pr">inp</span><span class="pt">,</span> <span class="fn">button</span><span class="pt">(</span><span class="st">"Add"</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pr">add</span><span class="pt">))),</span>
    <span class="fn">list</span><span class="pt">(()</span> <span class="pt">=></span> <span class="fn">visible</span><span class="pt">(),</span>
      <span class="pt">(</span><span class="pr">t</span><span class="pt">)</span> <span class="pt">=></span> <span class="fn">div</span><span class="pt">(</span><span class="pr">t</span><span class="pt">.</span><span class="pr">text</span><span class="pt">)</span>
    <span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">}</span>`,
  },
  {
    id: "search",
    title: "Search Filter",
    desc: "Live search that filters a list of users as you type. Zero libraries, just state and update().",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>

<span class="kw">const</span> <span class="pr">USERS</span> <span class="pt">= [</span>
  <span class="pt">{</span> <span class="pr">name</span><span class="pt">:</span> <span class="st">'Alice Chen'</span><span class="pt">,</span> <span class="pr">email</span><span class="pt">:</span> <span class="st">'alice@example.com'</span> <span class="pt">},</span>
  <span class="pt">{</span> <span class="pr">name</span><span class="pt">:</span> <span class="st">'Bob Smith'</span><span class="pt">,</span> <span class="pr">email</span><span class="pt">:</span> <span class="st">'bob@example.com'</span> <span class="pt">},</span>
  <span class="pt">{</span> <span class="pr">name</span><span class="pt">:</span> <span class="st">'Charlie Davis'</span><span class="pt">,</span> <span class="pr">email</span><span class="pt">:</span> <span class="st">'charlie@example.com'</span> <span class="pt">},</span>
<span class="pt">]</span>
<span class="kw">let</span> <span class="pr">query</span> <span class="pt">=</span> <span class="st">''</span>

<span class="kw">function</span> <span class="fn">results</span><span class="pt">() {</span>
  <span class="kw">const</span> <span class="pr">q</span> <span class="pt">=</span> <span class="pr">query</span><span class="pt">.</span><span class="fn">toLowerCase</span><span class="pt">()</span>
  <span class="kw">return</span> <span class="pr">USERS</span><span class="pt">.</span><span class="fn">filter</span><span class="pt">(</span><span class="pr">u</span> <span class="pt">=></span>
    <span class="pr">u</span><span class="pt">.</span><span class="pr">name</span><span class="pt">.</span><span class="fn">toLowerCase</span><span class="pt">().</span><span class="fn">includes</span><span class="pt">(</span><span class="pr">q</span><span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">}</span>

<span class="kw">export function</span> <span class="fn">SearchFilter</span><span class="pt">() {</span>
  <span class="kw">return</span> <span class="fn">div</span><span class="pt">(</span>
    <span class="fn">input</span><span class="pt">({</span>
      <span class="pr">placeholder</span><span class="pt">:</span> <span class="st">'Search users…'</span><span class="pt">,</span>
      <span class="fn">on</span><span class="pt">(</span><span class="st">'input'</span><span class="pt">,</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">)</span> <span class="pt">=></span> <span class="pt">{</span>
        <span class="pr">query</span> <span class="pt">=</span> <span class="pt">(</span><span class="pr">e</span><span class="pt">.</span><span class="pr">target</span> <span class="kw">as</span> <span class="ty">HTMLInputElement</span><span class="pt">).</span><span class="pr">value</span>
        <span class="fn">update</span><span class="pt">()</span>
      <span class="pt">})</span>
    <span class="pt">}),</span>
    <span class="fn">list</span><span class="pt">(()</span> <span class="pt">=></span> <span class="fn">results</span><span class="pt">(),</span>
      <span class="pt">(</span><span class="pr">u</span><span class="pt">)</span> <span class="pt">=></span> <span class="fn">div</span><span class="pt">(</span><span class="pr">u</span><span class="pt">.</span><span class="pr">name</span><span class="pt">)</span>
    <span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">}</span>`,
  },
  {
    id: "async",
    title: "Loading States",
    desc: "Async data fetching with idle / loading / success / error states. No special async API needed.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>

<span class="kw">type</span> <span class="ty">Status</span> <span class="pt">=</span> <span class="st">'idle'</span> <span class="pt">|</span> <span class="st">'loading'</span> <span class="pt">|</span> <span class="st">'success'</span> <span class="pt">|</span> <span class="st">'error'</span>
<span class="kw">let</span> <span class="pr">status</span><span class="pt">:</span> <span class="ty">Status</span> <span class="pt">=</span> <span class="st">'idle'</span>
<span class="kw">let</span> <span class="pr">products</span><span class="pt">:</span> <span class="pt">{</span><span class="pr">title</span><span class="pt">:</span><span class="ty">string</span><span class="pt">;</span><span class="pr">category</span><span class="pt">:</span><span class="ty">string</span><span class="pt">}[] =</span> <span class="pt">[]</span>

<span class="kw">async function</span> <span class="fn">load</span><span class="pt">() {</span>
  <span class="pr">status</span> <span class="pt">=</span> <span class="st">'loading'</span><span class="pt">;</span> <span class="fn">update</span><span class="pt">()</span>
  <span class="kw">try</span> <span class="pt">{</span>
    <span class="kw">const</span> <span class="pr">r</span> <span class="pt">=</span> <span class="kw">await</span> <span class="fn">fetch</span><span class="pt">(</span><span class="st">'https://dummyjson.com/products?limit=3'</span><span class="pt">)</span>
    <span class="kw">const</span> <span class="pr">d</span> <span class="pt">=</span> <span class="kw">await</span> <span class="pr">r</span><span class="pt">.</span><span class="fn">json</span><span class="pt">()</span>
    <span class="pr">products</span> <span class="pt">=</span> <span class="pr">d</span><span class="pt">.</span><span class="pr">products</span>
    <span class="pr">status</span> <span class="pt">=</span> <span class="st">'success'</span>
  <span class="pt">}</span> <span class="kw">catch</span> <span class="pt">{</span>
    <span class="pr">status</span> <span class="pt">=</span> <span class="st">'error'</span>
  <span class="pt">}</span>
  <span class="fn">update</span><span class="pt">()</span>
<span class="pt">}</span>

<span class="kw">export function</span> <span class="fn">AsyncExample</span><span class="pt">() {</span>
  <span class="kw">return</span> <span class="fn">div</span><span class="pt">(</span>
    <span class="fn">button</span><span class="pt">(</span><span class="st">"Fetch Data"</span><span class="pt">,</span> <span class="fn">on</span><span class="pt">(</span><span class="st">"click"</span><span class="pt">,</span> <span class="pr">load</span><span class="pt">)),</span>
    <span class="fn">when</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">status</span> <span class="pt">===</span> <span class="st">'loading'</span><span class="pt">,</span> <span class="fn">span</span><span class="pt">(</span><span class="st">"Loading…"</span><span class="pt">)),</span>
    <span class="fn">list</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pr">products</span><span class="pt">,</span>
      <span class="pt">(</span><span class="pr">p</span><span class="pt">)</span> <span class="pt">=></span> <span class="fn">div</span><span class="pt">(</span><span class="pr">p</span><span class="pt">.</span><span class="pr">title</span><span class="pt">)</span>
    <span class="pt">)</span>
  <span class="pt">)</span>
<span class="pt">}</span>`,
  },
];
