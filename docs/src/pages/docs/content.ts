import { css, colors, s } from "../../styles.ts";
import { TabBlock } from "../../components/TabBlock.ts";
import { CopyIcon, CheckIcon } from "../../components/icons.ts";
import { copyText } from "../../components/clipboard.ts";
import { highlightCode } from "../../components/CodeBlock.ts";

function TerminalCommand(command: string) {
  let copied = false;

  function handleCopy() {
    copyText(command).then((ok) => {
      if (!ok) return;
      copied = true;
      update();
      setTimeout(() => { copied = false; update(); }, 1800);
    });
  }

  return div(
    s.installCmd,
    span(css("docs-terminal-prompt", { color: colors.textMuted, fontFamily: "ui-monospace, monospace" }), "$"),
    span(command),
    button(
      css("docs-terminal-copy-button", { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "26px", height: "26px", borderRadius: "6px", color: colors.textMuted, backgroundColor: "transparent", border: "none", cursor: "pointer", hover: { color: colors.primary, backgroundColor: colors.primaryAlpha08 } }),
      { title: "Copy to clipboard", "aria-label": "Copy command" },
      when(() => copied, CheckIcon({ size: 14 })).else(CopyIcon({ size: 14 })),
      { onClick: handleCopy },
    ),
  );
}

const quickStartTabsWrap = css("quickStartTabsWrap", { margin: "22px 0" });

function QuickStartTabs() {
  return div(
    quickStartTabsWrap,
    TabBlock({
      tabs: [
        { id: "npm", label: "npm", content: TerminalCommand("npm create nuclo@latest") },
        { id: "bun", label: "bun", content: TerminalCommand("bun create nuclo") },
        { id: "pnpm", label: "pnpm", content: TerminalCommand("pnpm create nuclo") },
        { id: "deno", label: "deno", content: TerminalCommand("deno run -A npm:create-nuclo") },
      ],
    }),
  );
}

// ── HTML helpers for section content ─────────────────────────────────────
function frame(file: string, body: string): string {
  return `<div class="code-block-frame"><div class="code-block-header"><span class="code-block-filename">${file}</span></div><div class="code-block-body"><pre>${body}</pre></div></div>`;
}

/** A syntax-highlighted code block. */
const code = (file: string, src: string) => frame(file, highlightCode(src.trim()));

/** A terminal block, one command per argument. */
const sh = (...commands: string[]) =>
  frame("terminal", commands.map((c) => {
    const [bin, ...rest] = c.split(" ");
    return `<span class="pt">$</span> <span class="fn">${bin}</span> ${rest.join(" ")}`;
  }).join("\n"));

/** A syntax-highlighted signature for `apiSig`. */
const sig = (src: string) => highlightCode(src.trim());

export interface DocSection {
  id: string;
  groupTitle: string;
  title: string;
  apiTag?: 'fn' | 'type';
  apiSig?: string;
  content: string; // raw HTML inner content, rendered first
  render?: () => NodeModLike<any>; // optional live component, rendered after `content`
  afterContent?: string; // raw HTML, rendered after `render`
}

type SectionInput = Omit<DocSection, "groupTitle">;

const GROUPS: { title: string; sections: SectionInput[] }[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "Introduction",
    sections: [
      {
        id: "overview",
        title: "Overview",
        content: `
      <p>Nuclo is a small DOM library for TypeScript. You build the page with plain functions such as <code>div()</code> and <code>button()</code>, keep state in ordinary variables, and call <code>update()</code> when the page should change.</p>
      <p>Nuclo has no virtual DOM, no compiler, no proxies and no signals.</p>
      ${code("main.ts", `
import 'nuclo'

let count = 0

const App = () =>
  div(
    h1(() => \`Count: \${count}\`),
    button('Add one', { onClick: () => { count++; update() } }),
  )

render(App, document.getElementById('app')!)
`)}
      <h3>The mental model</h3>
      <ol>
        <li>Build the UI with tag builders.</li>
        <li>Pass a function for every value that depends on state.</li>
        <li>Change state with plain JavaScript.</li>
        <li>Call <code>update()</code>. Nuclo runs the functions again and patches the DOM.</li>
      </ol>
      <p>Changing a variable does not touch the DOM. The page changes only when you call <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Quick Start",
        content: `
      <p><code>create-nuclo</code> scaffolds a Vite and TypeScript project that is ready for Nuclo:</p>
    `,
        render: QuickStartTabs,
        afterContent: `
      <p>It asks for a project name. To skip the prompt, pass the name and flags. With npm, put <code>--</code> before the flags:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Then install and start the dev server:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Options</h3>
      <ul>
        <li><code>[project-name]</code>: the target folder. The default is <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: the template to copy. Only <code>basic</code> exists today.</li>
        <li><code>-y, --yes</code>: never prompt, use the defaults.</li>
        <li><code>-f, --force</code>: write into a folder that is not empty.</li>
        <li><code>-h, --help</code>: print the help.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Installation & Imports",
        content: `
      <p>To add Nuclo to an existing project:</p>
      ${sh("npm install nuclo")}
      <p>Or use <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> or <code>bun add nuclo</code>. Nuclo has no dependencies.</p>
      <h3>Globals</h3>
      <p><code>import 'nuclo'</code> puts these on <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 tag builders</strong>: 112 for HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) and 63 for SVG, with an <code>Svg</code> suffix (<code>svgSvg</code>, <code>pathSvg</code>, …). See <a href="#tag-builders">Tag Builders</a>.</li>
        <li><strong>14 helpers</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> and <code>globalStyle</code>.</li>
      </ul>
      <p>The import must run before any code that calls a builder. ES modules run in import order, so this fails:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Put <code>import 'nuclo'</code> first in your entry file, or import it in every file that uses the globals.</p>
      <h3>Named imports</h3>
      <p>The helpers are also named exports. They are the same functions as the globals. <code>getCssText()</code> and <code>resetStyles()</code> are named exports only. Tag builders are globals only, so <code>import { div } from 'nuclo'</code> does not work.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Entry points</h3>
      <ul>
        <li><code>nuclo</code>: registers the globals and exports the 14 helpers plus <code>getCssText</code> and <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> and <code>getCssText</code>. See <a href="#api-ssr">Server Rendering</a>.</li>
        <li><code>nuclo/polyfill</code>: a small DOM for Node, Bun and Deno. See <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: types only. See <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo ships its own types. You need two things:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> and <code>nodenext</code> are not supported yet.</li>
        <li>The <code>DOM</code> lib. TypeScript includes it by default when you do not set <code>lib</code>.</li>
      </ul>
      <p>If any file in the project imports <code>'nuclo'</code>, every file sees the global types. You need nothing else. If no file imports it, for example in a separate tsconfig for tests, add the types yourself:</p>
      ${code("tsconfig.json", `
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["nuclo/types"]
  }
}
`)}
      <p>Or add <code>/// &lt;reference types="nuclo/types" /&gt;</code> to a <code>.d.ts</code> file.</p>
      <h3>Useful types</h3>
      <p>These types are global, so you use them without an import:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: what a tag builder returns. Use it as a component's return type.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: anything a tag builder accepts as an argument.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: what <code>render()</code> and <code>hydrate()</code> return.</li>
        <li><code>ElementTagName</code>: any HTML tag name.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: the attribute object a tag builder accepts, including <code>on*</code> handlers, <code>onMount</code> and <code>onDestroy</code>. Use it for components that pass attributes through.</li>
        <li><code>MountCallback</code> and <code>DestroyCallback</code>: <code>onMount</code> and <code>onDestroy</code> handlers.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: what <code>when()</code> and <code>list()</code> return.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> and the other styling types. You can also import these: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> marks every DOM member as optional. Cast it when you need the full element type: <code>render(App, root) as HTMLDivElement</code>.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "Building UI",
    sections: [
      {
        id: "tag-builders",
        title: "Tag Builders",
        content: `
      <p>Every HTML tag is a global function with the same name: <code>div</code>, <code>span</code>, <code>input</code>, … The one exception is <code>&lt;var&gt;</code>, which is <code>var_</code> because <code>var</code> is a reserved word. Every SVG tag has an <code>Svg</code> suffix: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Calling a tag builder does not create an element yet. <code>div('Hi')</code> returns a <strong>builder</strong>: a function that creates the element later. Nuclo calls it when you mount it with <code>render()</code> or place it inside another builder, <code>when()</code> or <code>list()</code>. Each use creates a new element.</p>
      ${code("card.ts", `
let name = 'Ada'

const Card = () =>
  div(
    { id: 'card', className: 'card' },
    h2('Profile'),
    p(() => \`Hello, \${name}\`),
    button('Rename', { onClick: () => { name = 'Grace'; update() } }),
  )

render(Card, document.body)
`)}
      <h3>Arguments</h3>
      <p>A builder takes any number of arguments and applies them from left to right:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: a text node.</li>
        <li><strong><code>() =&gt; value</code></strong>: text that changes on <code>update()</code>. See <a href="#dynamic-functions">Dynamic Values</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: skipped.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: rendered as the text "true" or "false". Use <code>when()</code> for conditions.</li>
        <li><strong>A plain object</strong>: attributes. See <a href="#attributes">Attributes</a>.</li>
        <li><strong>A <code>css()</code>, <code>cx()</code> or <code>variants()</code> result</strong>: adds its classes.</li>
        <li><strong><code>on(...)</code></strong>: an event listener or lifecycle hook.</li>
        <li><strong>Another builder, <code>when()</code> or <code>list()</code></strong>: a child.</li>
        <li><strong>A DOM <code>Node</code></strong>: appended as it is.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: a custom modifier. See below.</li>
      </ul>
      <h3>Gotchas</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> renders the text "false". Write <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Arrays are not children. Spread them: <code>ul(...names.map((n) =&gt; li(n)))</code>. For lists that change, use <code>list()</code>.</li>
        <li>A local variable with a tag name hides the builder. Inside <code>function Row(label: string)</code>, <code>label(...)</code> is not callable. Rename locals such as <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> and <code>i</code>.</li>
        <li>Browsers expose every element that has an <code>id</code> as a global variable. If the page contains <code>&lt;main id="main"&gt;</code> before Nuclo loads, Nuclo leaves that global in place, so <code>main(...)</code> throws a <code>TypeError</code>. Use other ids.</li>
      </ul>
      <h3>Custom modifiers</h3>
      <p>A function that declares at least one parameter runs once, in argument order, while the element is being built. Its first argument is the element. The second is an internal index, so do not rely on it. If it returns a string or number, that becomes text. A <code>Node</code> is appended. An object is applied as attributes.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Getting the element</h3>
      <p><code>render()</code> returns the root element. Inside a tree, use <code>on("mount", (el) =&gt; …)</code> or a custom modifier. You can also call the builder function yourself to create a detached element:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Attach it before the next <code>update()</code>. A node that is not in the document when <code>update()</code> runs stops updating for good.</p>
      <h3>SVG</h3>
      <p>SVG builders take the same arguments. Nuclo sets every SVG attribute with <code>setAttribute</code>, so names such as <code>"stroke-width"</code> work as written.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>All builders</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Components",
        content: `
      <p>A component is a plain function that returns a builder, such as <code>button(...)</code>. There is no component API. Nothing is created until you render it or place it in a tree.</p>
      ${code("counter.ts", `
function Counter(label: string) {
  let count = 0 // one per call
  return button(() => \`\${label}: \${count}\`, {
    onClick: () => { count++; update() },
  })
}

render(() => div(Counter('A'), Counter('B')))
`)}
      <p>State declared inside the function belongs to that instance. State declared outside is shared by every instance. <code>forceUpdate()</code> calls components again, which resets the state declared inside them.</p>
      <p>Children are just arguments:</p>
      ${code("card.ts", `
function Card(heading: string, ...children: NodeModLike<'div'>[]) {
  return div({ className: 'card' }, h2(heading), ...children)
}

render(() => Card('Hi', p('one'), p('two')))
`)}
    `,
      },
      {
        id: "attributes",
        title: "Attributes",
        content: `
      <p>Pass a plain object to set attributes. You can pass several objects. For the same key, the later value wins, except <code>className</code> and <code>style</code>, which merge. A value can be static, or a function with no parameters that runs again on every <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
      <h3>How a value is set</h3>
      <ul>
        <li>If the HTML element has a property with that name (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo sets the property. Otherwise it calls <code>setAttribute(key, String(value))</code>, for example for <code>"aria-*"</code> and <code>"data-*"</code>.</li>
        <li>On SVG elements, Nuclo always calls <code>setAttribute</code>.</li>
        <li><code>null</code> and <code>undefined</code> are skipped. A dynamic value that returns <code>null</code> or <code>undefined</code> keeps the old value. To clear a value, return <code>""</code>, or <code>false</code> for a boolean property.</li>
        <li>Booleans work for DOM boolean properties, such as <code>disabled</code> on a button, <code>checked</code>, <code>hidden</code> and <code>required</code>. Anywhere else, <code>true</code> and <code>false</code> are written as the strings "true" and "false".</li>
        <li>Use <code>"data-*"</code> keys. <code>dataset</code> is not supported.</li>
        <li><code>innerHTML</code> is not escaped, and server rendering does not output it. Avoid it.</li>
      </ul>
      <h3>Classes</h3>
      <p>Use <code>className</code>. Static class strings, <code>css()</code> results and a dynamic <code>className</code> all merge. A dynamic <code>className</code> keeps the static classes, and when it returns <code>""</code> only the static classes remain.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Do not use the <code>class</code> key on HTML elements. It sets the raw attribute and replaces every class applied before it, including <code>css()</code> classes.</p>
      <h3>Inline styles</h3>
      <p><code>style</code> takes an object with camelCase keys, or a function that returns one.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo adds no units. Write <code>"12px"</code>, not <code>12</code>. Unitless properties such as <code>opacity</code> and <code>zIndex</code> accept numbers.</li>
        <li><code>""</code>, <code>null</code> and <code>undefined</code> clear a property.</li>
        <li>A dynamic style sets only the keys it returns. A key it stops returning keeps its old value, so return <code>""</code> to clear it.</li>
        <li>Style strings (<code>"color: red"</code>) and custom properties (<code>"--gap"</code>) are not supported. Use <code>css()</code> instead. It takes custom properties through <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Events",
        apiTag: "fn",
        apiSig: sig(`
// DOM events such as "click". El and Ev are inferred from the tag and the event name.
function on(type: DOMEventName, listener: (this: El, e: Ev) => unknown, options?: boolean | AddEventListenerOptions): NodeModFn
// Custom events
function on<K extends string, E extends Event = Event>(type: K, listener: (this: El, e: E) => unknown, options?: boolean | AddEventListenerOptions): NodeModFn
// Lifecycle, see Lifecycle
function on(type: "mount", listener: MountCallback): NodeModFn
function on(type: "destroy", listener: DestroyCallback): NodeModFn
`),
        content: `
      <p>There are two ways to listen to events: <code>on*</code> attributes and the <code>on()</code> modifier.</p>
      <h3><code>on*</code> attributes</h3>
      <p>In an attribute object, a function under a key such as <code>onClick</code> (<code>on</code> followed by a capital letter) is an event handler, not a dynamic value.</p>
      ${code("search.ts", `
let query = ''

const search = input({
  placeholder: 'Search',
  value: () => query,
  onInput: (e) => { query = e.currentTarget.value; update() },
  onKeyDown: (e) => { if (e.key === 'Escape') { query = ''; update() } },
})
`)}
      <ul>
        <li>TypeScript infers the event type from the key and the element. <code>e.currentTarget</code> and <code>this</code> are the element.</li>
        <li>Nuclo sets the native property, so <code>onClick</code> becomes <code>el.onclick</code>. There is one handler per event: a later <code>onClick</code> replaces an earlier one.</li>
        <li><code>onDoubleClick</code> and <code>onDblClick</code> both mean <code>dblclick</code>. Lowercase keys such as <code>onclick</code> are type errors.</li>
        <li>A name that is not a known event listens to its lowercase form: <code>onMyEvent</code> listens to <code>"myevent"</code>.</li>
        <li>Errors thrown by the handler are not caught.</li>
      </ul>
      <h3><code>on()</code></h3>
      <p><code>on()</code> returns a modifier that calls <code>addEventListener</code> on the element.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Every <code>on()</code> adds a listener. All of them run, in order.</li>
        <li><code>options</code> goes straight to <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Pass <code>on()</code> straight to a builder and the element type is inferred: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>If a listener throws, Nuclo logs the error with <code>console.error</code>, and the other listeners still run.</li>
        <li>Nuclo removes the listener when it removes the element. On the server, <code>on()</code> does nothing.</li>
        <li>You can reuse one <code>on()</code> value on many elements.</li>
      </ul>
      <p>For a custom event, pass the event type as a generic:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Which to use</h3>
      <p>Use <code>on*</code> attributes for the usual case. Use <code>on()</code> when you need more than one listener for an event, listener options, or a custom event name such as <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Lifecycle",
        apiTag: "fn",
        apiSig: sig(`
// As attributes
{ onMount?: (el: El) => void | (() => void), onDestroy?: (el: El) => void }
// Or with on()
function on(type: "mount", listener: (el: El) => void | (() => void)): NodeModFn
function on(type: "destroy", listener: (el: El) => void): NodeModFn
`),
        content: `
      <p><code>onMount</code> runs once, after the element is inserted. <code>onDestroy</code> runs once, when Nuclo removes the element. Write them as attributes or with <code>on()</code>. Both forms behave the same, and the element is typed from its tag.</p>
      ${code("timer.ts", `
let seconds = 0

const Timer = () =>
  span(
    {
      onMount: () => {
        const id = setInterval(() => { seconds++; update() }, 1000)
        return () => clearInterval(id) // runs when the span is removed
      },
    },
    () => \`\${seconds}s\`,
  )

const search = input(on('mount', (el) => el.focus()))
`)}
      <h3>When they run</h3>
      <ul>
        <li><code>onMount</code> runs at the end of the <code>render()</code>, <code>hydrate()</code>, <code>update()</code> or <code>forceUpdate()</code> call that inserted the element. It never runs while the tree is being built.</li>
        <li>If <code>onMount</code> returns a function, that function runs on destroy, after the element's <code>onDestroy</code> callbacks.</li>
        <li><code>onDestroy</code> runs when Nuclo removes the element: a <code>list()</code> row is removed, a <code>when()</code> branch switches, or <code>forceUpdate()</code> drops it. It runs just before removal, so the element is still in the document.</li>
      </ul>
      <h3>Raw DOM removal</h3>
      <p>If you remove an element yourself, with <code>node.remove()</code> or <code>innerHTML = ''</code>, its <code>onDestroy</code> and cleanups never run, and timers keep running. Nuclo has no <code>unmount()</code>. To tear down an app with cleanup, wrap it in <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Order and errors</h3>
      <ul>
        <li>You can register as many hooks as you like, in either form. They run in registration order.</li>
        <li><code>onDestroy</code> always runs children first, then the parent.</li>
        <li>Elements mount in the order of their first <code>onMount</code> hook, which follows argument order, and each element runs all its hooks together. Pass a parent's hook before its children if they depend on it.</li>
        <li>A hook that throws is logged with <code>console.error</code>. The other hooks still run.</li>
        <li>The callback must return nothing or a cleanup function, so do not make it <code>async</code>. A returned Promise is never used as a cleanup. Start async work inside it: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Hooks never run on the server. On the client, they run after <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Note:</strong> Hooks are not effects. They never run again when state changes. Each one runs at most once per element.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "Updates",
    sections: [
      {
        id: "explicit-updates",
        title: "Explicit Updates",
        content: `
      <p>Nuclo never updates the page on its own. Change your state, then call <code>update()</code>.</p>
      ${code("counter.ts", `
let count = 0

const Counter = () =>
  button(() => \`Clicked \${count} times\`, {
    onClick: () => { count++; update() },
  })

render(Counter)
`)}
      <p>Change as much state as you like, then call <code>update()</code> once:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Call <code>update()</code> from event handlers, timers, fetch callbacks or <code>onMount</code>. Do not call it from inside a dynamic value.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Dynamic Values",
        content: `
      <p>A function with <strong>no parameters</strong> is a <strong>dynamic value</strong>. Nuclo runs it once when it builds the element, and again on every <code>update()</code>. Use dynamic values for text children, attribute values, <code>style</code> and <code>className</code>. For children that appear, disappear or repeat, use <a href="#api-when"><code>when()</code></a> and <a href="#api-list"><code>list()</code></a>.</p>
      ${code("example.ts", `
let name = 'Alice'
let busy = false

const Profile = () =>
  div(
    h1('Welcome'),              // static
    p(() => \`Hello, \${name}\`),  // dynamic text
    button({ disabled: () => busy }, 'Save'),
  )
`)}
      <p>Nuclo checks the parameter count (<code>fn.length</code>). A function that declares a parameter is a <a href="#tag-builders">custom modifier</a> and runs only once. <code>(x = 0) =&gt; …</code> and <code>(...args) =&gt; …</code> have a length of 0, so they are dynamic.</p>
      <h3>Dynamic text</h3>
      <ul>
        <li>A string, number, bigint or boolean renders as <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> shows "false", so write <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> and <code>undefined</code> render as empty text.</li>
        <li>A <code>css()</code> or <code>cx()</code> result on the first run makes the function a dynamic class, not text. See <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>A node, builder, array or plain object renders nothing, and never updates.</li>
      </ul>
      <h3>Dynamic attributes</h3>
      <ul>
        <li>Nuclo writes a value only when it differs from the last value Nuclo wrote. It does not compare against the live DOM, so if a user types into an input and your function returns the same value as before, the text they typed stays.</li>
        <li>A result of <code>null</code> or <code>undefined</code> writes nothing, so the old value stays. <code>className</code> is the exception: any falsy result removes the dynamic classes and keeps the static ones.</li>
        <li>A <code>style</code> function applies the returned object on every update.</li>
      </ul>
      <h3>Errors</h3>
      <p>If a dynamic value throws, Nuclo catches the error and the rest of the update still runs. Text becomes empty or keeps its old value, and an attribute keeps its old value. Both recover on the next <code>update()</code> that succeeds. The exception: a text function that throws on its <strong>first</strong> run stays empty for good.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        apiTag: "fn",
        apiSig: sig(`function update(...scopeIds: string[]): void`),
        content: `
      <p>Runs one synchronous pass over every dynamic value on the page. With ids, it only updates what is inside the elements marked with those <a href="#api-scope"><code>scope()</code></a> ids. Each pass runs these steps in order:</p>
      <ol>
        <li><code>list()</code>: reads the items again and adds, moves or removes rows.</li>
        <li><code>when()</code>: checks the conditions again. A branch is rebuilt only when a different branch becomes active.</li>
        <li>Dynamic attributes, including <code>style</code> and <code>className</code>.</li>
        <li>Dynamic text.</li>
        <li><code>onMount</code> for the elements that steps 1 and 2 inserted.</li>
      </ol>
      <ul>
        <li><strong>It runs everything.</strong> Every dynamic value runs on every call, even when its data did not change. Only the DOM write is skipped. Keep dynamic values fast and free of side effects.</li>
        <li><strong>Only nodes in the document.</strong> If a node is not in the document when <code>update()</code> runs, Nuclo stops tracking it. It never updates again, even after you attach it. This applies to <code>list()</code> and <code>when()</code> too. Render into a container that is in the document.</li>
        <li><strong>Static values never change.</strong> Plain strings and attribute values are fixed when the element is built. To rebuild them, use <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Errors.</strong> Text and attribute errors are caught, and the pass continues. If a <code>when()</code> condition throws, the error is logged and that <code>when()</code> stops updating. If a <code>list()</code> <code>items</code> or <code>renderItem</code> function throws, the error escapes <code>update()</code> and the remaining steps do not run.</li>
        <li><strong>Server.</strong> <code>update()</code> does nothing on the server.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        apiTag: "fn",
        apiSig: sig(`function scope(...ids: string[]): NodeModFn`),
        content: `
      <p>Gives the element it is passed to one or more scope ids. <code>update('id')</code> then updates only what is inside that element, including the element's own attributes.</p>
      ${code("example.ts", `
let cartItems: string[] = []
let user = 'Ada'

const App = () =>
  div(
    header(() => \`Hi, \${user}\`),
    aside(scope('cart'), span(() => \`Items: \${cartItems.length}\`)),
  )

render(App)

cartItems.push('apple')
user = 'Grace'
update('cart') // "Items: 1", the header still says "Hi, Ada"
update()       // everything, the header now says "Hi, Grace"
`)}
      <ul>
        <li>An element can have several ids: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> updates everything inside <code>a</code> or <code>b</code>. If several elements use the same id, all of them update.</li>
        <li>With nested scopes, <code>update('outer')</code> includes the inner scope. <code>update('inner')</code> does not touch the outer one.</li>
        <li>An id that no element in the document has updates <strong>nothing</strong> and raises no error, so check the spelling.</li>
        <li><code>scope()</code> does nothing on the server.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        apiTag: "fn",
        apiSig: sig(`
function when(condition: boolean | (() => boolean), ...content: NodeModLike[]): WhenBuilder

interface WhenBuilder {
  when(condition: boolean | (() => boolean), ...content: NodeModLike[]): WhenBuilder
  else(...content: NodeModLike[]): WhenBuilder
}
`),
        content: `
      <p>Renders content based on a condition. Nuclo checks the conditions again on every <code>update()</code>. The first true condition wins. If none is true, the <code>.else()</code> content renders. Without <code>.else()</code>, nothing renders.</p>
      ${code("status.ts", `
let status: 'loading' | 'error' | 'ready' = 'loading'

const Status = () =>
  div(
    when(() => status === 'loading', p('Loading…'))
      .when(() => status === 'error', p('Something went wrong'))
      .else(p('Ready')),
  )
`)}
      <h3>Conditions</h3>
      <ul>
        <li>For state, pass a function. A plain boolean is read once: <code>when(open, …)</code> never changes.</li>
        <li>In TypeScript the function must return a boolean. Write <code>() =&gt; items.length &gt; 0</code> or <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>What updates</h3>
      <ul>
        <li>While the same branch stays active, its elements are kept. Dynamic values, lists and <code>when()</code> blocks inside it keep updating.</li>
        <li>When a different branch becomes active, the old content is removed and its <code>onDestroy</code> hooks run. The new branch is built from scratch and its <code>onMount</code> hooks run. State in the old elements, such as input text or focus, is lost.</li>
      </ul>
      <h3>Branch content</h3>
      <p>Put children in a branch: text, dynamic text, builders, <code>list()</code> and nested <code>when()</code>. Pass builders such as <code>p('Hi')</code>, not DOM nodes: a DOM node stops updating after its branch hides once.</p>
      <p>Attribute objects and <code>on()</code> in a branch apply to the parent element, and they stay after the branch hides. For a conditional attribute, use a dynamic attribute: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Chaining</h3>
      <p><code>.when()</code> and <code>.else()</code> return a new builder and do not change the original. If you call <code>.else()</code> twice, the last call wins.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        apiTag: "fn",
        apiSig: sig(`
function list<T>(
  items: () => readonly T[] | Iterable<T>,
  renderItem: (item: T, index: number) => ListRenderResult,
): ListModifier
`),
        content: `
      <p>Renders one row per item. On every <code>update()</code>, Nuclo calls <code>items()</code> again and matches the new items to the existing rows by identity (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>How rows are matched</h3>
      <ul>
        <li>An item that is still there keeps its row. Nuclo moves the row if needed, and does not call <code>renderItem</code> again.</li>
        <li>A new item gets a new row. A removed item loses its row, and its <code>onDestroy</code> hooks run.</li>
        <li>Duplicate items each get their own row.</li>
        <li>You can change the array in place (<code>push</code>, <code>splice</code>, <code>sort</code>) or return a new array.</li>
      </ul>
      <p>A kept row is never rendered again, so use dynamic values for the fields that change:</p>
      ${code("todos.ts", `
const todos = [{ text: 'Write docs', done: false }]

const Todos = () =>
  ul(
    list(() => todos, (todo) =>
      li({ className: () => (todo.done ? 'done' : '') }, () => todo.text),
    ),
  )

render(Todos)

todos[0].done = true
update() // same <li>, its class is now "done"
`)}
      <p>Copies are new items, so replacing the array with <code>todos.map((t) =&gt; ({ ...t }))</code> rebuilds every row.</p>
      <h3>What <code>renderItem</code> returns</h3>
      <ul>
        <li>Return one element, such as <code>li(...)</code>, <code>tr(...)</code> or an SVG builder. Return <code>null</code> or <code>undefined</code> to skip an item. Strings, text nodes and fragments render nothing.</li>
        <li>Do not return <code>when()</code> or <code>list()</code> directly. Put them inside the row element: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>To hide items, filter in <code>items()</code>, not in <code>renderItem</code>.</li>
        <li>Keep <code>renderItem</code> free of side effects. Nuclo may call it more than once for the same item.</li>
      </ul>
      <h3>The index</h3>
      <p><code>index</code> is the item's position when its row was created. It is not updated when rows move. For the current position, use a dynamic value: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iterables</h3>
      <p>Any iterable works: arrays, <code>Set</code>, generators and <code>map.values()</code>. Returning the same array or <code>Set</code> each time is fine. An iterator, such as a generator or <code>map.values()</code>, is used up after one pass, so create it inside <code>items()</code> on every call. Iterating a <code>Map</code> directly creates new <code>[key, value]</code> arrays each time, so every row is rebuilt. Use <code>map.values()</code> instead.</p>
      <h3>Placement</h3>
      <p>Rows appear where <code>list()</code> sits among its siblings, between two comment markers. Other children of the parent are not touched. <code>list()</code> also works inside SVG builders.</p>
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        apiTag: "fn",
        apiSig: sig(`
function forceUpdate(): void
function forceUpdate(nodeModFn: NodeModFn | (() => NodeModFn), parent?: Element): ExpandedElement
`),
        content: `
      <p><code>update()</code> only runs dynamic values. Static values, such as the text in <code>h1(labels[lang].title)</code>, are fixed when the tree is built. <code>forceUpdate()</code> calls your components again and patches the live DOM to match, static values included. Use it for rare, app-wide changes, such as switching the language. Use <code>update()</code> for everything else.</p>
      ${code("i18n.ts", `
const labels = { en: { title: 'Hello' }, pt: { title: 'Olá' } }
let lang: keyof typeof labels = 'en'

const App = () => div(h1(labels[lang].title))
render(App, root)

lang = 'pt'
forceUpdate() // same <h1> element, now "Olá"
`)}
      <p>With no arguments, <code>forceUpdate()</code> rebuilds every root rendered with <code>render(App)</code> or <code>hydrate(App)</code>. Roots rendered with <code>render(App())</code> are skipped. If a component throws, the error is logged and that root keeps its old DOM. An error thrown later, while the new build is applied, is logged too, but the parts already patched stay patched.</p>
      <h3>What stays and what changes</h3>
      <ul>
        <li>Children are matched in order, by tag. A matching element is reused, so focus and typed input values stay, and its <code>onMount</code> hooks do not run again. Once one child's tag differs, that child and every later sibling are built fresh.</li>
        <li>Text, attributes, classes, styles, listeners, <code>when()</code> branches and <code>list()</code> rows follow the new build.</li>
        <li>New elements are created, and their <code>onMount</code> hooks run. Elements the new build no longer makes are removed, and their <code>onDestroy</code> hooks run.</li>
        <li><code>list()</code> rows are matched by position too, not by item, so a reused row element can end up showing a different item.</li>
        <li>Attributes the new build no longer sets are not removed.</li>
      </ul>
      <div class="docs-callout"><strong>Watch out:</strong> state declared inside a component function is reset, because the function runs again. Keep state that must survive outside the component.</div>
      <p><strong>Explicit form.</strong> <code>forceUpdate(App(), parent)</code> rebuilds one tree in <code>parent</code> and returns its root. It does not register the root for later calls. Like <code>hydrate()</code>, it expects the root to be the first node in <code>parent</code>. If the first node has a different tag, it is replaced.</p>
      <p>On the server, <code>forceUpdate()</code> does nothing.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "Rendering",
    sections: [
      {
        id: "api-render",
        title: "render()",
        apiTag: "fn",
        apiSig: sig(`function render(nodeModFn: NodeModFn | (() => NodeModFn), parent?: Element, index?: number): ExpandedElement`),
        content: `
      <p>Builds your tree and appends its root element to <code>parent</code>. <code>parent</code> defaults to <code>document.body</code>. It returns the root element.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>You can pass the component (<code>render(App)</code>) or the builder it returns (<code>render(App())</code>). The DOM is the same. Only <code>render(App)</code> lets <a href="#api-force-update"><code>forceUpdate()</code></a> rebuild the root later, so prefer it.</li>
        <li>It appends. It does not clear <code>parent</code>, so calling it twice adds two copies.</li>
        <li>Every <code>onMount</code> in the tree has run when <code>render()</code> returns.</li>
        <li>Render into an element that is in the document. See <a href="#api-update"><code>update()</code></a>.</li>
        <li>The root must be an element, such as <code>div(...)</code>, not <code>when()</code> or <code>list()</code>.</li>
        <li><code>index</code> is internal. It does not choose where the element is inserted. Leave it out.</li>
      </ul>
      <p>A component passed as <code>render(App)</code> must take no parameters. A required parameter is a type error. An optional one type-checks, but <code>render()</code> throws at runtime. Wrap a component that takes props:</p>
      ${code("main.ts", `
const Page = (props: { name: string }) => div(h1('Hi ', props.name))

render(() => Page({ name: 'Ana' }), root)
`)}
    `,
      },
      {
        id: "api-hydrate",
        title: "hydrate()",
        apiTag: "fn",
        apiSig: sig(`function hydrate(nodeModFn: NodeModFn | (() => NodeModFn), parent?: Element): ExpandedElement`),
        content: `
      <p>Takes over HTML made by <a href="#api-ssr"><code>renderToString()</code></a>. It reuses the existing elements, attaches event listeners, and connects dynamic values, <code>when()</code> and <code>list()</code>, so <code>update()</code> works afterward. Then it runs the <code>onMount</code> hooks. <code>parent</code> defaults to <code>document.body</code>. It returns the root element.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Use the same component, and the same data, as the server.</li>
        <li>Hydrate into a dedicated container. The app's root must be its first node, although whitespace is fine. If another node comes first, Nuclo replaces that node and leaves the server copy behind.</li>
        <li>As with <code>render()</code>, pass <code>App</code>, not <code>App()</code>, so <code>forceUpdate()</code> can rebuild the root later. <code>App</code> must take no parameters. With an optional one, <code>hydrate()</code> silently attaches nothing. Wrap a component that takes props: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>If there is no server HTML, use <code>render()</code>.</li>
      </ul>
      <h3>When the server and the client differ</h3>
      <p>The client wins:</p>
      <ul>
        <li>A different root tag: that node is replaced with fresh DOM. An empty container: fresh DOM is appended.</li>
        <li>Different text is patched. Different <code>list()</code> items and <code>when()</code> branches follow the client.</li>
        <li>Extra server children are removed, and missing ones are created.</li>
        <li>Attributes that the server wrote but the client does not set are left as they are.</li>
      </ul>
      <p><code>renderToString()</code> writes HTML comments as markers, such as <code>&lt;!-- text-0 --&gt;</code> before each text node. <code>hydrate()</code> needs them, so do not strip comments from the server HTML. Without the markers, hydration deletes the <code>list()</code> rows, and <code>list()</code> and <code>when()</code> stop updating.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Server Rendering",
        apiTag: "fn",
        apiSig: sig(`
// import { ... } from 'nuclo/ssr'
function renderToString(input: RenderableInput): string
function renderManyToString(inputs: RenderableInput[]): string[]
function renderToStringWithContainer(input: RenderableInput, containerTag?: string, containerAttrs?: Record<string, string>): string
function getCssText(): string

type RenderableInput = NodeModFn | (() => NodeModFn) | Element | Node | null | undefined
`),
        content: `
      <p>Render a component to an HTML string on the server. In the browser, call <a href="#api-hydrate"><code>hydrate()</code></a> with the same component to make that HTML interactive. Server runtimes have no <code>document</code>, so import <a href="#api-polyfill"><code>nuclo/polyfill</code></a> first.</p>
      ${code("app.ts", `
let count = 0
const heading = css({ color: 'red' })

export const App = () =>
  main(
    h1(heading, () => \`Count: \${count}\`),
    button({ onClick: () => { count++; update() } }, '+1'),
  )
`)}
      ${code("server.ts", `
import 'nuclo/polyfill'
import 'nuclo'
import { renderToString, getCssText } from 'nuclo/ssr'
import { App } from './app.ts'

const html = renderToString(App)
const page = \`<!doctype html>
<html>
  <head><style id="nuclo-styles">\${getCssText()}</style></head>
  <body>
    <div id="root">\${html}</div>
    <script type="module" src="/client.js"></script>
  </body>
</html>\`
`)}
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <p>Keep <code>id="nuclo-styles"</code> on the style tag. The client reuses that element and adds only new rules. See <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>What runs on the server</h3>
      <ul>
        <li>Each <code>renderToString()</code> call builds the tree and runs each dynamic value once.</li>
        <li>Event handlers, <code>onMount</code> and <code>onDestroy</code> never run. <code>update()</code>, <code>scope()</code> and <code>forceUpdate()</code> do nothing.</li>
        <li>Rendering is synchronous. Load your data first, then render.</li>
        <li>Nothing stays registered after a render, so one process can serve many requests. Pass request data as arguments, such as <code>renderToString(Page(user))</code>. Module-level variables are shared by all requests.</li>
        <li>Do not call <code>render()</code> on the server. It appends to the shared <code>document.body</code>.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Takes a builder (<code>App()</code>), a component (<code>App</code>) or a DOM node. <code>null</code> and <code>undefined</code> return <code>""</code>. The root must be an element. A component passed as <code>renderToString(Page)</code> must take no parameters, so pass <code>Page(user)</code> for one that takes data.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Text and attribute values are HTML-escaped. Text inside <code>script()</code> and <code>style()</code> is written as is, with only closing tags broken up, so never put user input there.</li>
        <li>It does not throw. If the component, a <code>list()</code> function or a <code>when()</code> condition throws, or the polyfill is missing, it logs the error and returns <code>""</code>. Check for an empty result if the request should fail. A text or attribute function that throws only renders empty.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>The same as <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Wraps the output in one element. <code>containerTag</code> defaults to <code>"div"</code>, and <code>containerAttrs</code> to <code>{}</code>. Attribute values are escaped. Attribute names are written as given, so use HTML names such as <code>class</code>. Never pass user input as the tag.</p>
      ${code("example.ts", `
renderToStringWithContainer(p('Hi'), 'section', { id: 'main', class: 'page' })
// '<section id="main" class="page"><p><!-- text-0 -->Hi</p></section>'
`)}
    `,
      },
      {
        id: "api-polyfill",
        title: "nuclo/polyfill",
        apiSig: sig(`
import 'nuclo/polyfill'
// Named exports:
// document, Event, CustomEvent, Node, Element, HTMLElement,
// NucloDocument, NucloElement, NucloText, NucloNode
`),
        content: `
      <p>A small DOM so Nuclo can build trees in Node, Bun and Deno. Import it once, before your first render. Most apps only need the plain import.</p>
      <ul>
        <li>When there is no <code>window</code>, it sets <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> and <code>HTMLElement</code>, but only the ones that are missing. It does not create <code>window</code>.</li>
        <li>In a browser, or under jsdom, it does nothing.</li>
        <li><code>Event</code> and <code>CustomEvent</code> are the runtime's own constructors. <code>Node</code>, <code>Element</code> and <code>HTMLElement</code> are aliases of the polyfill classes.</li>
      </ul>
      <p>It is a DOM for building trees, not a browser. It has no <code>innerHTML</code> and no <code>getElementById</code>, <code>querySelector()</code> returns <code>null</code>, and event listeners are ignored. Use <code>renderToString()</code> to get the HTML.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
  {
    title: "Styling",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        apiTag: "fn",
        apiSig: sig(`
function css(style: Style): StyleResult
function css(name: string, style: Style): StyleResult

type StyleResult = { className: string }
`),
        content: `
      <p>Turns a typed style object into generated CSS classes. Pass the result to any tag builder. In the browser, the rules go into one <code>&lt;style id="nuclo-styles"&gt;</code> element. On the server, <a href="#api-css-text"><code>getCssText()</code></a> returns them.</p>
      ${code("card.ts", `
const card = css({
  p: 16,
  rounded: 8,
  bg: '#fff7ed',
  hover: { bg: '#ffedd5' },
})

const Card = () => div(card, 'Simple card')
`)}
      <ul>
        <li><code>css()</code> makes one class for the base declarations, plus one class for each pseudo key, selector and media block. The card above gets two classes.</li>
        <li>Class names are hashes of the content. Identical styles share a class, and the server and the client produce the same names.</li>
        <li>Define styles once, at module level. <code>css()</code> caches by object, so a new object on every call is processed again each time.</li>
        <li>Changing a style object after passing it to <code>css()</code> does nothing.</li>
        <li>Every style stays registered for the life of the page or server process. For values that change per item, such as a width from data, use the <a href="#attributes"><code>style</code> attribute</a>.</li>
      </ul>
      <h3>Named styles</h3>
      <p>Pass a name first to get a readable class name:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>The base class is exactly the name. Other blocks get <code>name-&lt;hash&gt;</code>.</li>
        <li>The name must be a valid class name. Otherwise Nuclo warns and generates one.</li>
        <li>Names are global. If two different styles use the same name, Nuclo warns.</li>
      </ul>
      <h3>Using the result</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> and <code>card.className</code> both return the class names.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Style Objects",
        content: `
      <p>The object you pass to <code>css()</code> uses common CSS properties in camelCase, a set of shorthands, and nested keys for pseudo states, selectors and media queries. TypeScript autocompletes all of them. Properties outside the typed set, such as <code>borderTopLeftRadius</code>, <code>fill</code> or <code>paddingInline</code>, go in <code>raw</code> (see below).</p>
      <h3>Values</h3>
      <ul>
        <li>Numbers become <code>px</code>, except <code>0</code> and unitless properties: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> and <code>gridRow</code>. In <code>raw</code>, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> and <code>animation-iteration-count</code> are unitless too.</li>
        <li>Strings are used as written. <code>null</code>, <code>undefined</code> and <code>false</code> are skipped.</li>
        <li><code>lineHeight</code> (and <code>leading</code>) is unitless, so <code>leading: 24</code> means 24 times the font size. Write <code>"24px"</code> for pixels.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Shorthands</h3>
      <table>
        <thead><tr><th>Key</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, and each side</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding left and right / top and bottom</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>the same for margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height, and their min and max</td></tr>
          <tr><td><code>size</code></td><td>width and height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>These keys take <code>true</code>:</p>
      <table>
        <thead><tr><th>Key</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (does not set display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudo states</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> and <code>firstLetter</code>. They nest: <code>hover: { focus: {…} }</code> gives <code>:hover:focus</code>.</p>
      <h3>Selectors and at-rules</h3>
      <p>A key that starts with <code>&amp;</code> is a selector, and each <code>&amp;</code> becomes the class. A key that starts with <code>@</code> is an at-rule: <code>@media</code>, <code>@container</code> or <code>@supports</code>.</p>
      ${code("menu.ts", `
const menu = css({
  p: 8,
  '& > li': { py: 4 },
  '& > li:hover': { color: 'red' },
  '&:is(.dark *)': { color: 'white' },
  '@media (min-width: 768px)': { p: 16 },
})
`)}
      <ul>
        <li>The key must start with <code>&amp;</code>. A key such as <code>".dark &amp;"</code> is ignored, so write <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Two nested <code>@media</code> blocks combine with <code>and</code>. Any other nested at-rule replaces the outer one.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Use <code>raw</code> for any property, with the name written exactly as in CSS. Numbers still get <code>px</code>, so pass strings:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Any other flat key is converted to kebab-case and written out as is, so a typo such as <code>colr: 'red'</code> becomes a declaration the browser drops. A nested object under a key that is not a pseudo state, a screen, or an <code>&amp;</code> or <code>@</code> key is ignored. TypeScript reports both.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        apiTag: "fn",
        apiSig: sig(`
function cx(...inputs: ClassInput[]): StyleResult

type ClassInput = StyleResult | string | false | null | undefined | ClassInput[]
`),
        content: `
      <p>Combines styles. When two inputs set the same property, the later input wins.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Falsy inputs are skipped, arrays are flattened, and strings are split and de-duplicated.</li>
        <li>Generated classes for the same block (base, the same pseudo, the same media query) merge into one new class. Other class names pass through unchanged.</li>
        <li>Only <code>cx()</code> knows argument order. With <code>div(base, blue)</code>, both classes are added, and the rule that was created last wins. Put styles that override each other in one <code>cx()</code> call.</li>
        <li>When a named style's block merges with another input's block, the merged class is <code>name-&lt;hash&gt;</code>, not the bare name. Blocks that do not merge keep their class, so <code>cx(pageTitle, 'extra')</code> still has <code>page-title</code>.</li>
      </ul>
      <h3>Dynamic classes</h3>
      <p>Pass a function that always returns <code>cx(...)</code>:</p>
      ${code("toggle.ts", `
const baseButton = css({ px: 12, py: 8, border: '1px solid #ccc' })
const activeButton = css({ bg: '#ff3f00', color: 'white' })

let active = false

const Toggle = () =>
  button(
    () => cx(baseButton, active && activeButton),
    () => (active ? 'Active' : 'Inactive'),
    { onClick: () => { active = !active; update() } },
  )
`)}
      <p>The function must return a style result on its first run. <code>() =&gt; active &amp;&amp; activeButton</code> renders the text "false" instead of a class.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        apiTag: "fn",
        apiSig: sig(`
function createCss<const T extends ThemeConfig>(theme?: T): CssInstance<T>

// CssInstance<T> = { css, cx, variants, keyframes, globalStyle, theme }
`),
        content: `
      <p>Returns its own <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> and <code>globalStyle</code>, bound to a theme. A theme gives names to values: with the theme below, <code>borderColor: 'border'</code> writes <code>#e5e7eb</code>, and TypeScript autocompletes the names. Each entry in <code>screens</code> becomes a style key for a media query, such as <code>md: {…}</code>.</p>
      ${code("theme.ts", `
export const { css, cx, variants } = createCss({
  colors: { primary: '#ff3f00', border: '#e5e7eb' },
  radii: { card: '12px' },
  screens: { md: '(min-width: 768px)' },
})

const panel = css({
  p: 12,
  rounded: 'card',
  border: '1px solid',
  borderColor: 'border',
  md: { p: 24 },
})
`)}
      <table>
        <thead><tr><th>Theme key</th><th>Used by</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> and each side, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>new style keys, such as <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>A theme name resolves only when it is the whole value. <code>border: "1px solid primary"</code> is not resolved.</li>
        <li>A screen value without <code>@</code> becomes <code>@media &lt;value&gt;</code>. A value that starts with <code>@</code> is used as written, for example <code>"@container (min-width: 400px)"</code>.</li>
        <li>Screens exist only on instances made with <code>createCss()</code>. The global <code>css()</code> has none, but it accepts <code>@media</code> keys.</li>
        <li>All instances and the global helpers share one stylesheet. Screen media rules are output in the order the screens are declared, not the order you use them, so list <code>min-width</code> screens from small to large. Use one <code>createCss()</code> instance per app, so that order is the one in your theme.</li>
        <li><code>theme</code> on the result is the theme you passed.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        apiTag: "fn",
        apiSig: sig(`
function variants(config: {
  base?: Style
  variants?: { [group: string]: { [value: string]: Style } }
  defaultVariants?: { [group: string]: value }
  compoundVariants?: ({ [group: string]: value } & { css: Style })[]
}): (props?: { [group: string]: value }) => StyleResult
`),
        content: `
      <p>Builds a function that returns a style for a set of options, such as a button's intent and size.</p>
      ${code("button.ts", `
const buttonClass = variants({
  base: { px: 12, py: 8, rounded: 6 },
  variants: {
    intent: { primary: { bg: '#2563eb' }, danger: { bg: '#dc2626' } },
    size: { sm: { text: 12 }, lg: { text: 18 } },
    block: { true: { w: '100%' } },
  },
  defaultVariants: { intent: 'primary', size: 'sm' },
  compoundVariants: [{ intent: 'danger', size: 'lg', css: { weight: 700 } }],
})

button(buttonClass(), 'Save')                                                // primary, sm
button(buttonClass({ intent: 'danger', size: 'lg', block: true }), 'Delete') // bold, full width
`)}
      <ul>
        <li>Styles merge in this order: <code>base</code>, the chosen value of each group, then each matching compound. Later styles win per property.</li>
        <li>A missing, <code>undefined</code> or <code>null</code> option uses the default. A group with no default is skipped.</li>
        <li>A group with only <code>true</code> and <code>false</code> keys takes a boolean.</li>
        <li>A compound applies when every group it lists matches, defaults included.</li>
        <li>Each selection is built once and cached.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() & globalStyle()",
        apiTag: "fn",
        apiSig: sig(`
function keyframes(frames: KeyframeFrames): string
function globalStyle(selector: string, style: FlatStyle): void
`),
        content: `
      <p><code>keyframes()</code> registers an animation and returns its generated name. Frame keys are <code>from</code>, <code>to</code> and percentages, such as <code>"50%"</code> or <code>"0%, 100%"</code>. Frames take flat properties only. Identical frames return the same name.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> adds a rule for any selector:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>The selector is used exactly as written.</li>
        <li>Only flat properties work. Pseudo keys, screens and <code>@</code> keys are ignored, so <code>globalStyle()</code> cannot write media rules.</li>
        <li>The same rule is added once. A different style for the same selector adds a second rule, and the later one wins.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() & resetStyles()",
        apiTag: "fn",
        apiSig: sig(`
function getCssText(): string   // from 'nuclo/ssr' or 'nuclo'
function resetStyles(): void    // from 'nuclo'
`),
        content: `
      <p><code>getCssText()</code> returns every rule that <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> and <code>globalStyle()</code> have created in this process: base rules first, then the <code>@media</code>, <code>@container</code> and <code>@supports</code> blocks. Use it for server rendering.</p>
      <ul>
        <li>Call it after <code>renderToString()</code>. Rules created during the render are included.</li>
        <li>It covers the whole process, not one page or request, and it only grows. That is safe, because class names are content hashes.</li>
        <li>Put it in <code>&lt;style id="nuclo-styles"&gt;</code>. The client reuses that element and skips the rules already in it. With another id, or none, the client adds a second stylesheet with every rule again.</li>
        <li>The text is not escaped, so never put untrusted input into style values.</li>
      </ul>
      <p><code>resetStyles()</code> is a test helper. It removes every rule and the <code>#nuclo-styles</code> element. Styles you created earlier keep their class names but lose their CSS. Do not call it in an app or on a server.</p>
      ${code("setup.test.ts", `
import { resetStyles } from 'nuclo'

beforeEach(() => resetStyles())
`)}
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "Patterns",
    sections: [
      {
        id: "computed",
        title: "Computed Values",
        content: `
      <p>Nuclo has no computed API. Use a plain function, and call it from dynamic values:</p>
      ${code("example.ts", `
let items = ['apple', 'banana', 'cherry']
let filter = ''

const visible = () => items.filter((item) => item.includes(filter))

const Fruits = () =>
  div(
    p(() => \`Showing \${visible().length} of \${items.length}\`),
    ul(list(visible, (item) => li(item))),
  )

filter = 'an'
update()
`)}
    `,
      },
      {
        id: "async",
        title: "Async & Loading",
        content: `
      <p>Use plain <code>async</code>/<code>await</code>, and call <code>update()</code> each time the state changes. For a fetch, that means once before the <code>await</code> and once after:</p>
      ${code("example.ts", `
let status: 'idle' | 'loading' | 'done' | 'error' = 'idle'
let result: unknown = null

async function loadData() {
  status = 'loading'
  update()
  try {
    result = await fetch('/api/data').then((r) => r.json())
    status = 'done'
  } catch {
    status = 'error'
  }
  update()
}
`)}
    `,
      },
      {
        id: "best-practices",
        title: "Best Practices",
        content: `
      <ul>
        <li><strong>Batch changes.</strong> Change all the state you need, then call <code>update()</code> once.</li>
        <li><strong>Keep dynamic values fast and pure.</strong> All of them run on every <code>update()</code>.</li>
        <li><strong>Use <code>scope()</code></strong> for small, frequent updates, such as typing or timers.</li>
        <li><strong>Render into the document.</strong> Nodes that are not in the document when <code>update()</code> runs stop updating.</li>
        <li><strong>Use <code>when()</code> and <code>list()</code></strong> for children that change, not a function that returns nodes.</li>
        <li><strong>Use <code>className</code>, not <code>class</code></strong>, and use <code>() =&gt; cx(...)</code> or <code>{ className: () =&gt; … }</code> for dynamic classes.</li>
        <li><strong>Define styles once</strong>, at module level.</li>
        <li><strong>Server rendering:</strong> render first, then put <code>getCssText()</code> in <code>&lt;style id="nuclo-styles"&gt;</code>. Pass request data as arguments, and keep HTML comments in the output.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "Reference",
    sections: [
      {
        id: "api-index",
        title: "API Index",
        content: `
      <p>Every public function, and where it comes from.</p>
      <h3><code>nuclo</code> (global and named export)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: run all dynamic values, or those in the given scopes.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: give an element scope ids for <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: conditional content, with <code>.when()</code> and <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: one row per item, matched by identity.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: an event listener, or <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: build and append.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: take over server HTML.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: call components again and patch the DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: generated classes from a style object.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: combine styles, later wins.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: themed <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> and <code>globalStyle</code>.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: styles from options.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> and <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (named export only)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> and <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> and <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">A side-effect import</a>, plus <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> and the <code>Nuclo*</code> classes.</li>
      </ul>
      <h3>Globals only</h3>
      <ul>
        <li><a href="#tag-builders">175 tag builders</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, and <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Types</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> and more. Styling types such as <code>StyleResult</code> can also be imported from <code>'nuclo'</code>.</li>
      </ul>
      <h3>Special keys</h3>
      <ul>
        <li><a href="#attributes">Attributes</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> handlers</a>, <a href="#lifecycle"><code>onMount</code> and <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Style objects</a>: shorthands, pseudo states, <code>&amp;</code> selectors, <code>@</code> rules and <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Frequently Asked Questions",
        content: `
      <h3>Does changing state update the UI?</h3>
      <p>No. The DOM stays as it is until you call <code>update()</code>.</p>

      <h3>Does Nuclo use signals, proxies or a virtual DOM?</h3>
      <p>No. State stays plain JavaScript. When a tree is rendered, Nuclo creates real elements and text nodes. <code>update()</code> runs every registered dynamic value, or those inside the given scopes, and patches those same nodes where a value changed. There is no dependency graph and no virtual tree.</p>

      <h3>Why does my page show "false"?</h3>
      <p>Booleans render as text. <code>div(ok &amp;&amp; span('Done'))</code> shows "false". Use <code>when(() =&gt; ok, span('Done'))</code> for children, and <code>ok ? 'Done' : ''</code> for text.</p>

      <h3>Why doesn't my list row change when I edit the item?</h3>
      <p>Rows for items that are still in the list are kept, not rendered again. Use dynamic values such as <code>() =&gt; todo.text</code> for fields that change. See <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Why does part of my UI stop updating?</h3>
      <p>Usually its nodes were not in the document when <code>update()</code> ran. Nuclo stops tracking those nodes, even after you attach them, so render into a container that is in the document. Two other causes: a <code>when()</code> whose condition throws stops updating, and a text function that throws on its first run stays empty. See <a href="#api-update"><code>update()</code></a>.</p>

      <h3>When should I use <code>forceUpdate()</code>?</h3>
      <p>Only for rare changes to static values, such as switching the language. For everything else, use <code>update()</code>. See <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>How do I unmount an app?</h3>
      <p>Wrap it in <code>when()</code> and switch the condition off. Removing the DOM yourself does not run <code>onDestroy</code>. See <a href="#lifecycle">Lifecycle</a>.</p>

      <h3>Does Nuclo have effects?</h3>
      <p>No. <code>onMount</code> and <code>onDestroy</code> run once per element, tied to insertion and removal. Nothing runs again because some state changed.</p>
    `,
      },
    ],
  },
];

export const DOC_GROUPS = GROUPS.map((g) => ({ title: g.title, sections: g.sections.map((sec) => sec.id) }));

export const DOC_SECTIONS: DocSection[] = GROUPS.flatMap((g) =>
  g.sections.map((sec) => ({ ...sec, groupTitle: g.title })),
);

export const SECTION_MAP = new Map<string, DocSection>(
  DOC_SECTIONS.map(s => [s.id, s])
);
