import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "简介",
    sections: [
      {
        id: "overview",
        title: "概述",
        content: `
      <p>Nuclo 是一个轻量的 TypeScript DOM 库。<code>div()</code>、<code>button()</code> 这些再普通不过的函数就是你的积木，state 放在普通变量里，页面需要变化时调用 <code>update()</code> 即可。</p>
      <p>没有 virtual DOM，没有编译器，没有 Proxy，也没有 signal。</p>
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
      <h3>心智模型</h3>
      <ol>
        <li>用标签构建函数把 UI 搭起来。</li>
        <li>依赖 state 的值，一律包成函数传进去。</li>
        <li>用普通的 JavaScript 修改 state。</li>
        <li>调用 <code>update()</code>。Nuclo 会重新执行这些函数，并更新 DOM。</li>
      </ol>
      <p>光改变量，DOM 纹丝不动。页面什么时候变，完全由你调用 <code>update()</code> 的时机说了算。</p>
    `,
      },
      {
        id: "quick-start",
        title: "快速开始",
        content: `
      <p>想最快跑起来，用 <code>create-nuclo</code> 一键生成项目。它给你的是一个已经接好 Nuclo 的 Vite + TypeScript 工程：</p>
    `,
        afterContent: `
      <p>默认会先问你项目叫什么。如果不想被问，直接把名称和参数一起带上就行；用 npm 的话，参数前面记得加 <code>--</code>：</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>然后装依赖、起 dev server：</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>选项</h3>
      <ul>
        <li><code>[project-name]</code>：项目生成到哪个文件夹，默认是 <code>nuclo-app</code>。</li>
        <li><code>-t, --template &lt;name&gt;</code>：选用的模板，眼下只有 <code>basic</code> 一个。</li>
        <li><code>-y, --yes</code>：不再提问，全部走默认值。</li>
        <li><code>-f, --force</code>：目标文件夹不为空也照写不误。</li>
        <li><code>-h, --help</code>：打印帮助。</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "安装与导入",
        content: `
      <p>已有项目想接入 Nuclo，一条命令就行：</p>
      ${sh("npm install nuclo")}
      <p>换成 <code>pnpm add nuclo</code>、<code>yarn add nuclo</code> 或 <code>bun add nuclo</code> 也一样。Nuclo 本身零依赖。</p>
      <p>router 没有塞进核心包，而是独立发布为 <a href="#router-overview"><code>nuclo-router</code></a>，用到的时候和 <code>nuclo</code> 一起装上就好。</p>
      <h3>全局变量</h3>
      <p>一句 <code>import 'nuclo'</code>，下面这些东西就会被挂到 <code>globalThis</code> 上：</p>
      <ul>
        <li><strong>175 个标签构建函数</strong>：其中 112 个对应 HTML（<code>div</code>、<code>span</code>、<code>button</code>……），另外 63 个对应 SVG，名字带 <code>Svg</code> 后缀（<code>svgSvg</code>、<code>pathSvg</code>……）。详见<a href="#tag-builders">标签构建函数</a>。</li>
        <li><strong>16 个辅助函数</strong>：<code>update</code>、<code>scope</code>、<code>when</code>、<code>list</code>、<code>region</code>、<code>into</code>、<code>on</code>、<code>render</code>、<code>hydrate</code>、<code>forceUpdate</code>、<code>css</code>、<code>cx</code>、<code>createCss</code>、<code>variants</code>、<code>keyframes</code> 和 <code>globalStyle</code>。</li>
      </ul>
      <p>这行 import 必须赶在所有调用构建函数的代码之前执行。ES 模块是按 import 顺序求值的，所以下面这种写法会报错：</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>请把 <code>import 'nuclo'</code> 放在入口文件的第一行，或者在每个用到这些全局变量的文件里各 import 一次。</p>
      <h3>命名导入</h3>
      <p>辅助函数也提供具名导出，和全局变量指向的是同一批函数。<code>getCssText()</code> 与 <code>resetStyles()</code> 只能通过具名导出使用。至于标签构建函数，只有全局这一种形态，所以 <code>import { div } from 'nuclo'</code> 是行不通的。</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>入口</h3>
      <ul>
        <li><code>nuclo</code>：注册全局变量，同时导出 16 个辅助函数，外加 <code>getCssText</code> 和 <code>resetStyles</code>。</li>
        <li><code>nuclo/ssr</code>：<code>renderToString</code>、<code>renderManyToString</code>、<code>renderToStringWithContainer</code> 和 <code>getCssText</code>。详见<a href="#api-ssr">服务端渲染</a>。</li>
        <li><code>nuclo/polyfill</code>：给 Node 和 Bun 用的迷你 DOM，见 <a href="#api-polyfill">nuclo/polyfill</a>。</li>
        <li><code>nuclo/types</code>：只含类型定义，见 <a href="#typescript-setup">TypeScript</a>。</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>类型定义随包附带，不用另装，只要满足两个条件：</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>。<code>node16</code> 和 <code>nodenext</code> 暂时还不支持。</li>
        <li>启用 <code>DOM</code> lib。不手动设置 <code>lib</code> 的话，TypeScript 默认就带着。</li>
      </ul>
      <p>只要项目里有任何一个文件 import 了 <code>'nuclo'</code>，所有文件就都能看到这些全局类型，什么都不用配。但如果没有文件 import 它（比如测试用了单独的 tsconfig），就得自己把类型声明加进来：</p>
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
      <p>也可以在某个 <code>.d.ts</code> 文件里写一行 <code>/// &lt;reference types="nuclo/types" /&gt;</code>。</p>
      <h3>常用类型</h3>
      <p>下面这些类型都是全局的，拿来就能用：</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>：标签构建函数的返回类型，拿来标注组件的返回值正合适。</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>：标签构建函数能接收的任何参数。</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>：<code>render()</code> 和 <code>hydrate()</code> 返回的类型。</li>
        <li><code>ElementTagName</code>：所有 HTML 标签名的联合类型。</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>：标签构建函数接收的属性对象类型，涵盖 <code>on*</code> handler、<code>onMount</code> 和 <code>onDestroy</code>。写需要透传属性的组件时很好用。</li>
        <li><code>MountCallback</code> 和 <code>DestroyCallback</code>：分别对应 <code>onMount</code> 与 <code>onDestroy</code> 的 callback。</li>
        <li><code>WhenBuilder</code>、<code>ListModifier</code>：<code>when()</code> 与 <code>list()</code> 的返回类型。</li>
        <li><code>RegionOptions</code>、<code>RegionType</code>：<code>region()</code> 的选项类型。</li>
        <li><code>StyleResult</code>、<code>Style</code>、<code>ThemeConfig</code>、<code>CssInstance</code> 等样式相关类型。它们同样可以显式 import：<code>import type { StyleResult } from 'nuclo'</code>。</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p>注意，<code>ExpandedElement&lt;Tag&gt;</code> 会把 DOM 的每个成员都标成可选。如果需要完整的元素类型，做一次类型断言即可：<code>render(App, root) as HTMLDivElement</code>。</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "构建 UI",
    sections: [
      {
        id: "tag-builders",
        title: "标签构建函数",
        content: `
      <p>每个 HTML 标签都对应一个同名的全局函数：<code>div</code>、<code>span</code>、<code>input</code>……只有 <code>&lt;var&gt;</code> 是个例外，<code>var</code> 是保留字，所以它叫 <code>var_</code>。SVG 标签则统一加上 <code>Svg</code> 后缀：<code>svgSvg</code>、<code>pathSvg</code>、<code>circleSvg</code>……</p>
      <p>调用标签构建函数并不会立刻生出一个元素。<code>div('Hi')</code> 返回的是一个<strong>构建器</strong>，说白了就是一个“稍后再造元素”的函数。要等你用 <code>render()</code> 把它挂上去，或者把它放进另一个构建器、<code>when()</code>、<code>list()</code> 里，Nuclo 才会真正去调用它；每用一次，就造一个全新的元素。</p>
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
    `,
        afterContent: `
      <h3>参数</h3>
      <p>构建器可以接收任意多个参数，Nuclo 会从左到右逐个处理：</p>
      <ul>
        <li><strong>string、number、bigint</strong>：变成一个文本节点。</li>
        <li><strong><code>() =&gt; value</code></strong>：随 <code>update()</code> 变化的文本，见<a href="#dynamic-functions">动态值</a>。</li>
        <li><strong><code>null</code>、<code>undefined</code></strong>：直接忽略。</li>
        <li><strong><code>true</code>、<code>false</code></strong>：会被渲染成 "true" 或 "false" 这样的文本。要做条件渲染，请用 <code>when()</code>。</li>
        <li><strong>普通对象</strong>：当作属性处理，见<a href="#attributes">属性</a>。</li>
        <li><strong><code>css()</code>、<code>cx()</code> 或 <code>variants()</code> 的结果</strong>：把对应的 class 加到元素上。</li>
        <li><strong><code>on(...)</code></strong>：事件 listener 或生命周期 hook。</li>
        <li><strong>另一个构建器、<code>when()</code> 或 <code>list()</code></strong>：作为子节点。</li>
        <li><strong>DOM <code>Node</code></strong>：原封不动地 append 进去。</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>：自定义 modifier，后面会讲。</li>
      </ul>
      <h3>几个坑</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> 在条件为假时会渲染出 "false" 文本。正确的写法是 <code>div(when(() =&gt; isAdmin, span('Admin')))</code>。</li>
        <li>数组不能直接当子节点，得先展开：<code>ul(...names.map((n) =&gt; li(n)))</code>。如果列表会变，就交给 <code>list()</code>。</li>
        <li>和标签同名的局部变量会把构建函数 shadow 掉。比如在 <code>function Row(label: string)</code> 里，<code>label(...)</code> 就调用不了了。<code>label</code>、<code>title</code>、<code>data</code>、<code>p</code>、<code>a</code>、<code>i</code> 这类变量名，记得换个叫法。</li>
        <li>浏览器会把每个带 <code>id</code> 的元素自动暴露成全局变量。如果页面在 Nuclo 加载之前就已经有 <code>&lt;main id="main"&gt;</code>，Nuclo 不会覆盖这个全局变量，结果 <code>main(...)</code> 就会抛出 <code>TypeError</code>。换个 id 就能避开。</li>
      </ul>
      <h3>自定义 modifier</h3>
      <p>只要函数声明了至少一个参数，它就会在元素构建期间按参数出现的顺序执行一次。第一个参数是元素本身；第二个是内部索引，别去依赖它。返回字符串或数字时，结果会变成文本；返回 <code>Node</code> 就会被 append；返回对象则当作属性应用。</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>拿到元素</h3>
      <p><code>render()</code> 会把根元素返回给你。在树的内部，可以借助 <code>on("mount", (el) =&gt; …)</code> 或自定义 modifier 来拿元素。当然，也可以亲手调用构建器，得到一个还没挂载的元素：</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>记得在下一次 <code>update()</code> 之前把它挂进文档。<code>update()</code> 执行时如果节点还游离在文档之外，它就会永久停止更新。</p>
      <h3>SVG</h3>
      <p>SVG 构建器的参数规则完全一样。Nuclo 对 SVG 一律使用 <code>setAttribute</code>，所以 <code>"stroke-width"</code> 这样的属性名直接照写就行。</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>所有标签构建函数</h3>
      <p><strong>HTML：</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG：</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "组件",
        content: `
      <p>所谓组件，不过是一个返回构建器（比如 <code>button(...)</code>）的普通函数，背后没有任何组件 API。在你渲染它、或把它放进树里之前，什么都不会被创建。</p>
      ${code("counter.ts", `
function Counter(label: string) {
  let count = 0 // one per call
  return button(() => \`\${label}: \${count}\`, {
    onClick: () => { count++; update() },
  })
}

render(() => div(Counter('A'), Counter('B')))
`)}
    `,
        afterContent: `
      <p>声明在函数内部的 state 属于当前这个实例，声明在函数外部的则是所有实例共用的。要留意 <code>forceUpdate()</code> 会重新调用组件，所以组件内部的 state 会被重置。</p>
      <p>想要子节点？它们就是普通参数：</p>
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
        title: "属性",
        content: `
      <p>想设置属性，传一个普通对象进去就行，传多个也没问题。同一个键后面的值会覆盖前面的，只有 <code>className</code> 和 <code>style</code> 例外，它们会被合并。属性值可以是静态的，也可以是一个无参函数，后者每次 <code>update()</code> 都会重新执行。</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>值是怎么写进去的</h3>
      <ul>
        <li>如果 HTML 元素上存在同名的 property（<code>value</code>、<code>checked</code>、<code>disabled</code>、<code>htmlFor</code>、<code>tabIndex</code>……），Nuclo 就直接给 property 赋值；没有的话，则调用 <code>setAttribute(key, String(value))</code>，<code>"aria-*"</code> 和 <code>"data-*"</code> 走的就是这条路。</li>
        <li>SVG 元素则始终使用 <code>setAttribute</code>。</li>
        <li><code>null</code> 和 <code>undefined</code> 会被跳过，动态值返回它们时，旧值原样保留。想清掉某个值，就返回 <code>""</code>；如果是布尔属性，返回 <code>false</code>。</li>
        <li>布尔值只对 DOM 的布尔属性有意义，比如 <code>disabled</code>、<code>checked</code>、<code>hidden</code> 和 <code>required</code>。除此之外，<code>true</code> 和 <code>false</code> 只会被写成 "true" 和 "false" 字符串。</li>
        <li>自定义数据请用 <code>"data-*"</code> 形式的键，<code>dataset</code> 不被支持。</li>
        <li><code>innerHTML</code> 不做任何转义，而且 SSR 也不会输出它，能不用就不用。</li>
      </ul>
      <h3>类名</h3>
      <p>设置 class 请用 <code>className</code>。静态类名字符串、<code>css()</code> 的结果以及动态 <code>className</code> 会被合并到一起。动态 <code>className</code> 不会冲掉静态类名，它返回 <code>""</code> 时，元素上就只剩静态的那部分。</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>在 HTML 元素上别用 <code>class</code> 这个键。它写的是原始 attribute，会把先前应用的所有类名（包括 <code>css()</code> 生成的）一并覆盖掉。</p>
      <h3>内联样式</h3>
      <p><code>style</code> 接收一个 camelCase 键的对象，或者一个返回这种对象的函数。</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo 不会替你补单位，要写 <code>"12px"</code> 而不是 <code>12</code>。像 <code>opacity</code>、<code>zIndex</code> 这种本来就不带单位的属性，传数字即可。</li>
        <li>传 <code>""</code>、<code>null</code> 或 <code>undefined</code> 就会清除该样式。</li>
        <li>动态样式只会写入它这次返回的键；以前写过、这次不再返回的键，旧值会留着，所以想清除就明确返回 <code>""</code>。</li>
        <li>样式字符串（<code>"color: red"</code>）和 CSS 自定义属性（<code>"--gap"</code>）都不支持。需要的话改用 <code>css()</code>，它借助 <a href="#style-objects"><code>raw</code></a> 来支持自定义属性。</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "事件",
        content: `
      <p>监听事件有两条路：<code>on*</code> 属性，以及 <code>on()</code> modifier。</p>
      <h3><code>on*</code> 属性</h3>
      <p>在属性对象里，形如 <code>onClick</code>（<code>on</code> 加大写字母开头）的键，对应的函数会被当作事件 handler，而不是动态值。</p>
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
        <li>TypeScript 会根据键名和元素自动推断事件类型，<code>e.currentTarget</code> 和 <code>this</code> 指向的都是该元素。</li>
        <li>Nuclo 设置的是原生 property，<code>onClick</code> 实际就是 <code>el.onclick</code>。因此每种事件只能挂一个 handler，后写的 <code>onClick</code> 会顶掉前一个。</li>
        <li><code>onDoubleClick</code> 与 <code>onDblClick</code> 都对应 <code>dblclick</code>。小写的 <code>onclick</code> 这种写法会触发类型错误。</li>
        <li>不在已知事件列表里的名字，会按小写形式去监听：<code>onMyEvent</code> 监听的就是 <code>"myevent"</code>。</li>
        <li>handler 里抛出的错误不会被 Nuclo 捕获。</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> 返回一个 modifier，在元素上帮你调用 <code>addEventListener</code>。</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>每写一个 <code>on()</code> 就多一个 listener，它们会按顺序全部执行。</li>
        <li><code>options</code> 原样透传给 <code>addEventListener</code>：<code>capture</code>、<code>once</code>、<code>passive</code>、<code>signal</code>。</li>
        <li>把 <code>on()</code> 直接传给构建器，元素类型就能自动推断：<code>input(on('input', (e) =&gt; e.currentTarget.value))</code>。</li>
        <li>某个 listener 抛了错，Nuclo 会用 <code>console.error</code> 记录下来，其余 listener 照常执行。</li>
        <li>元素被 Nuclo 移除时，listener 也会一并清理。在服务端，<code>on()</code> 是空操作。</li>
        <li>同一个 <code>on()</code> 的返回值可以放心地在多个元素上复用。</li>
      </ul>
      <p>碰到自定义事件，把事件类型当泛型传进去：</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>怎么选</h3>
      <p>日常用 <code>on*</code> 属性就够了。需要给同一个事件挂多个 listener、要传 listener 选项，或者事件名是 <code>"my-event"</code> 这类自定义的，再换成 <code>on()</code>。</p>
    `,
      },
      {
        id: "lifecycle",
        title: "生命周期",
        content: `
      <p><code>onMount</code> 在元素插入之后执行一次，<code>onDestroy</code> 则在 Nuclo 移除元素时执行一次。既可以写成属性，也可以用 <code>on()</code>，两种写法效果一致，元素类型都会按标签自动推断。</p>
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
    `,
        afterContent: `
      <h3>何时触发</h3>
      <ul>
        <li><code>onMount</code> 会在把该元素插进页面的那次 <code>render()</code>、<code>hydrate()</code>、<code>update()</code> 或 <code>forceUpdate()</code> 调用收尾时触发，绝不会发生在树构建的过程中。</li>
        <li>如果 <code>onMount</code> 返回了一个函数，它会在销毁阶段执行，排在该元素 <code>onDestroy</code> callback 的后面。</li>
        <li><code>onDestroy</code> 在 Nuclo 移除元素时触发：<code>list()</code> 的某一行被删掉、<code>when()</code> 切换了分支、<code>into()</code> 离开了所在区域，或者被 <code>forceUpdate()</code> 丢弃。它发生在真正移除之前，所以此刻元素还留在文档里。</li>
      </ul>
      <h3>用原生 DOM API 移除元素</h3>
      <p>如果你自己动手移除元素，比如 <code>node.remove()</code> 或 <code>innerHTML = ''</code>，它的 <code>onDestroy</code> 和清理函数就永远不会执行，定时器也会一直转下去。Nuclo 没有 <code>unmount()</code>。想在卸载整个应用时做清理，把应用包进 <code>when()</code> 里：</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>顺序和错误处理</h3>
      <ul>
        <li>两种写法都能注册任意数量的 hook，按注册顺序依次执行。</li>
        <li><code>onDestroy</code> 永远是子元素先、父元素后。</li>
        <li>元素是按各自第一个 <code>onMount</code> hook 出现的顺序（也就是参数顺序）来挂载的，每个元素会一口气跑完它所有的 hook。如果子元素依赖父元素的 hook，就把父元素的 hook 写在子元素前面。</li>
        <li>hook 抛出的错误会通过 <code>console.error</code> 记录下来，不影响其他 hook 继续执行。</li>
        <li>callback 要么什么都不返回，要么返回一个清理函数，所以别把它声明成 <code>async</code>：返回的 Promise 永远不会被当成清理函数。异步的活请在 callback 内部发起：<code>{ onMount: (el) =&gt; { void load(el) } }</code>。</li>
        <li>hook 在服务端永远不会执行；到了客户端，则是在 <code>hydrate()</code> 之后触发。</li>
      </ul>
      <div class="docs-callout"><strong>注意：</strong>这些 hook 并不是 effect。state 变了它们也不会重新执行，每个 hook 在每个元素上至多跑一次。</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "更新",
    sections: [
      {
        id: "explicit-updates",
        title: "显式更新",
        content: `
      <p>Nuclo 从不自动更新页面。先修改 state，再调用 <code>update()</code>。</p>
      ${code("counter.ts", `
let count = 0

const Counter = () =>
  button(() => \`Clicked \${count} times\`, {
    onClick: () => { count++; update() },
  })

render(Counter)
`)}
    `,
        afterContent: `
      <p>state 想改几处就改几处，最后只需调用一次 <code>update()</code>：</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p><code>update()</code> 可以放在事件 handler、定时器、fetch callback 或 <code>onMount</code> 里调用，唯独不要在动态值内部调用它。</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "动态值",
        content: `
      <p><strong>不带参数</strong>的函数，就是<strong>动态值</strong>。Nuclo 构建元素时会先跑它一遍，此后每次 <code>update()</code> 再跑一遍。文本子节点、属性值、<code>style</code>、<code>className</code> 都可以是动态值。如果是要出现、消失或重复的子节点，请使用 <a href="#api-when"><code>when()</code></a> 和 <a href="#api-list"><code>list()</code></a>。</p>
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
    `,
        afterContent: `
      <p>Nuclo 靠参数个数（<code>fn.length</code>）来区分两者：声明了参数的函数是<a href="#tag-builders">自定义 modifier</a>，只执行一次；而 <code>(x = 0) =&gt; …</code> 和 <code>(...args) =&gt; …</code> 的 length 是 0，所以仍然算动态值。</p>
      <h3>动态文本</h3>
      <ul>
        <li>string、number、bigint 和 boolean 都按 <code>String(value)</code> 渲染。所以 <code>() =&gt; ok &amp;&amp; 'Saved'</code> 在条件为假时会显示 "false"，应该写成 <code>() =&gt; (ok ? 'Saved' : '')</code>。</li>
        <li><code>null</code> 与 <code>undefined</code> 渲染为空文本。</li>
        <li>如果函数第一次执行就返回 <code>css()</code> 或 <code>cx()</code> 的结果，它会变成动态 class 而不是文本，详见 <a href="#api-cx"><code>cx()</code></a>。</li>
        <li>返回节点、构建器、数组或普通对象时，什么也不会渲染，之后也不会再更新。</li>
      </ul>
      <h3>动态属性</h3>
      <ul>
        <li>只有当值和上一次写入的不同时，Nuclo 才会去写。它比较的是“上次写入的值”而不是真实 DOM，所以用户在输入框里敲了字、而你的函数返回值没变时，用户输入的内容不会被冲掉。</li>
        <li>返回 <code>null</code> 或 <code>undefined</code> 时什么都不写，旧值留着。<code>className</code> 是例外：任何 falsy 值都会撤掉动态 class，只保留静态的。</li>
        <li><code>style</code> 函数每次更新都会把返回的对象重新应用一遍。</li>
      </ul>
      <h3>错误</h3>
      <p>动态值抛出错误时，Nuclo 会捕获该错误，本轮更新的其他部分照常进行：文本会变空或保留旧值，属性则保留旧值，等下一次 <code>update()</code> 成功就恢复正常。唯一的例外是：文本函数如果在<strong>第一次</strong>执行时就抛错，它会一直保持为空。</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>同步地把页面上所有动态值重新跑一遍。如果传入 id，就只更新带有这些 <a href="#api-scope"><code>scope()</code></a> id 的元素内部。每一轮按下面的顺序执行：</p>
      <ol>
        <li><code>list()</code>：重新读取 items，新增、移动或删除对应的行。</li>
        <li><code>when()</code>：重新判断条件，只有切换到另一个分支时才会重建分支。</li>
        <li>动态属性，其中包括 <code>style</code> 和 <code>className</code>。</li>
        <li>动态文本。</li>
        <li>为第 1、2 步新插入的元素触发 <code>onMount</code>。</li>
      </ol>
      <ul>
        <li><strong>它是“全量重跑”。</strong>每次调用，所有动态值都会执行，哪怕它依赖的数据没变，被跳过的只是 DOM 写入。所以动态值要写得快，也不要带副作用。</li>
        <li><strong>只认文档里的节点。</strong><code>update()</code> 执行时，如果某个节点不在文档中，Nuclo 就不再追踪它，之后即使挂回去也不会再更新，<code>list()</code> 和 <code>when()</code> 同理。所以请渲染到文档内的容器里。</li>
        <li><strong>静态值不会变。</strong>普通字符串和属性值在元素构建那一刻就定下来了。想让它们重新生成，请用 <a href="#api-force-update"><code>forceUpdate()</code></a>。</li>
        <li><strong>错误处理。</strong>文本和属性里的错误会被捕获，更新继续。<code>when()</code> 的条件抛错时，错误会被记录，这个 <code>when()</code> 从此不再更新。<code>list()</code> 的 <code>items</code> 或 <code>renderItem</code> 抛错时，错误会直接从 <code>update()</code> 抛出来，后面的步骤也不会再执行。</li>
        <li><strong>服务端。</strong>在服务端，<code>update()</code> 是空操作。</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>给它所在的元素贴上一个或多个作用域 id。之后 <code>update('id')</code> 就只刷新这个元素内部，连同它自己的属性。</p>
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
    `,
        afterContent: `
      <ul>
        <li>一个元素可以同时带多个 id：<code>scope('cart', 'sidebar')</code>。</li>
        <li><code>update('a', 'b')</code> 会更新 <code>a</code> 和 <code>b</code> 内部的全部内容。多个元素共用同一个 id 时，它们都会被更新。</li>
        <li>作用域嵌套时，<code>update('outer')</code> 连内层一起刷新，而 <code>update('inner')</code> 不会波及外层。</li>
        <li>如果文档里没有任何元素拥有这个 id，<strong>就什么也不会更新</strong>，而且不会报错，所以请检查拼写。</li>
        <li><code>scope()</code> 在服务端是空操作。</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>按条件渲染内容。Nuclo 每次 <code>update()</code> 都会重新判断，第一个为真的条件胜出；全都不成立就渲染 <code>.else()</code> 的内容，没写 <code>.else()</code> 则什么也不渲染。</p>
      ${code("status.ts", `
let status: 'loading' | 'error' | 'ready' = 'loading'

const Status = () =>
  div(
    when(() => status === 'loading', p('Loading…'))
      .when(() => status === 'error', p('Something went wrong'))
      .else(p('Ready')),
  )
`)}
    `,
        afterContent: `
      <h3>条件</h3>
      <ul>
        <li>条件依赖 state 的话，要传函数。普通布尔值只会被读一次，<code>when(open, …)</code> 永远不会变。</li>
        <li>在 TypeScript 里，这个函数必须返回布尔值，像 <code>() =&gt; items.length &gt; 0</code> 或 <code>() =&gt; user != null</code> 这样写。</li>
      </ul>
      <h3>什么会更新，什么会重建</h3>
      <ul>
        <li>只要还在同一个分支里，它的元素就会一直保留，里面的动态值、列表和嵌套的 <code>when()</code> 都会继续更新。</li>
        <li>切到另一个分支时，旧内容被移除，触发它的 <code>onDestroy</code> hook；新分支从零开始构建，触发 <code>onMount</code> hook。旧元素里的输入文本、焦点之类的状态都会丢失。</li>
      </ul>
      <h3>分支内容</h3>
      <p>分支里可以放文本、动态文本、构建器、<code>list()</code> 和嵌套的 <code>when()</code>。请传 <code>p('Hi')</code> 这样的构建器，别传现成的 DOM 节点，因为 DOM 节点所在的分支一旦隐藏过一次，它就不再更新了。</p>
      <p>分支里的属性对象和 <code>on()</code> 作用的是父元素，而且分支隐藏后依然生效。要做条件属性，请用动态属性：<code>{ className: () =&gt; (active ? 'active' : '') }</code>。</p>
      <h3>链式写法</h3>
      <p><code>.when()</code> 和 <code>.else()</code> 都返回新的构建器，不会改动原来的那个。连着调两次 <code>.else()</code>，以最后一次为准。</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>每个 item 渲染成一行。每次 <code>update()</code>，Nuclo 都会重新调用 <code>items()</code>，再用严格相等（<code>===</code>）把新 item 和现有的行一一对上。</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>行是怎么对应的</h3>
      <ul>
        <li>还在列表里的 item 会保留它原来的行，必要时 Nuclo 只是把行挪个位置，不会再调用 <code>renderItem</code>。</li>
        <li>新增的 item 会得到新行；被移除的 item 会失去它的行，并触发 <code>onDestroy</code> hook。</li>
        <li>重复的 item 各有各的行。</li>
        <li>数组可以原地修改（<code>push</code>、<code>splice</code>、<code>sort</code>），也可以每次返回一个新数组，都没问题。</li>
      </ul>
      <p>被保留的行不会重新渲染，所以会变的字段要用动态值：</p>
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
      <p>拷贝出来的对象在 Nuclo 眼里是全新的 item，所以拿 <code>todos.map((t) =&gt; ({ ...t }))</code> 去替换数组，会让所有行都被重建。</p>
    `,
        afterContent: `
      <h3><code>renderItem</code> 的返回值</h3>
      <ul>
        <li>返回一个元素，比如 <code>li(...)</code>、<code>tr(...)</code> 或某个 SVG 构建器。返回 <code>null</code> 或 <code>undefined</code> 表示跳过这个 item。字符串、文本节点和 fragment 都不会渲染出任何东西。</li>
        <li>别直接返回 <code>when()</code> 或 <code>list()</code>，把它们放进行元素里面：<code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>。</li>
        <li>想隐藏某个 item，应该在 <code>items()</code> 里过滤掉，而不是在 <code>renderItem</code> 里处理。</li>
        <li><code>renderItem</code> 要保持没有副作用，Nuclo 可能会对同一个 item 调用它不止一次。</li>
      </ul>
      <h3>索引</h3>
      <p><code>index</code> 记录的是这一行创建时 item 所处的位置，行之后被移动它也不会跟着变。要拿到当前位置，请用动态值：<code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>。</p>
      <h3>可迭代对象</h3>
      <p>任何 iterable 都行：数组、<code>Set</code>、generator、<code>map.values()</code> 都可以。每次返回同一个数组或 <code>Set</code> 完全没问题。但迭代器（比如 generator 或 <code>map.values()</code>）遍历一遍就耗尽了，所以每次调用 <code>items()</code> 时都要重新创建。直接遍历 <code>Map</code> 的话，每次产生的 <code>[key, value]</code> 数组都是新对象，会导致所有行被重建，请改用 <code>map.values()</code>。</p>
      <h3>位置</h3>
      <p>这些行就出现在 <code>list()</code> 在兄弟节点中所处的位置，夹在两个注释标记之间，父元素的其他子节点不受影响。在 SVG 构建器内部，<code>list()</code> 同样可用。</p>
    `,
      },
      {
        id: "api-region",
        title: "region() 与 into()",
        content: `
      <p><code>region()</code> 在树里圈出一个有名字的“空位”，而 <code>into()</code> 可以在任何地方、任意深度把内容填进去。布局组件不必通过 props 去接收内容，生产内容的组件也不用关心它最终落在哪儿。</p>
      ${code("app.ts", `
const Layout = () =>
  div(
    aside(nav(a({ href: '/' }, 'Home'))),
    main(region({ id: 'main', empty: p('Nothing open.') })),
  )

// Anywhere in the tree, before or after the region
const Article = () => into('main', article(h1('Hello')))

render(() => div(Layout(), Article()))
`)}
      <h3>它是怎么工作的</h3>
      <ul>
        <li><code>into()</code> 在原地只留下一个注释，真正的内容渲染在 region 的标记之间。</li>
        <li>先后顺序无所谓。<code>into()</code> 比 region 先构建的话，会先等着，region 一构建完成就立刻显示出来。多个视图按书写顺序排列。</li>
        <li>内容的生命周期和视图同步：包着 <code>into()</code> 的 <code>when()</code> 关闭，或者它所在的 <code>list()</code> 行被删除，内容就会从 region 里撤走。再次打开时只会加回一份，不会重复。</li>
        <li>region 本身消失时（比如它外面的 <code>when()</code> 关了），视图会回到等待状态，之后只要用相同 id 重新构建 region，它们就会重新显示。</li>
        <li>如果 <code>into()</code> 的 id 对不上任何 region，它什么也不渲染，也不会报错，所以请检查拼写。</li>
        <li>id 在整棵树里应当唯一。如果在一个还活着的 id 下再建一个 region，会记录一条警告。</li>
        <li>region 支持<a href="#api-ssr">服务端渲染</a>。<code>hydrate()</code> 时，每个视图会直接接管服务端渲染出的 HTML，而不是重新构建。</li>
      </ul>
      <h3>选项</h3>
      <ul>
        <li><code>id</code>：<code>into()</code> 用来找到这个 region 的名字。</li>
        <li><code>type</code>：<code>'latest'</code>（默认）只显示最新的那个视图；<code>'stack'</code> 则按到达顺序把所有视图都显示出来。</li>
        <li><code>empty</code>：region 里没有任何视图时显示的内容。</li>
      </ul>
      <h3>堆叠 region</h3>
      <p>用了 <code>type: 'stack'</code>，在已有视图之上再打开一个视图时，下面那个不会被重建，它的 DOM、焦点和表单状态都原样保留。页面上叠一层对话框，用它再合适不过。</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>一次填多个 region</h3>
      <p>给 <code>into()</code> 传一个对象，就能一口气填充多个 region，值既可以是单个子节点，也可以是子节点数组。两种写法都能嵌套：写在某个视图内容里的 <code>into()</code>，指向的是它自己的 region。</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>在组件树深处弹出对话框</h3>
      <p>浮层 region 放在根部，树里任意深度的组件只要把 <code>into()</code> 包进 <code>when()</code>，就能把对话框弹出来；<code>when()</code> 一关，对话框也就从 region 里撤掉了。</p>
      ${code("dialog.ts", `
let confirming = false

const App = () =>
  div(
    Page(),
    div({ className: 'overlay' }, region({ id: 'overlay' })),
  )

// Deep inside Page()
const DeleteButton = () =>
  div(
    button('Delete', { onClick: () => { confirming = true; update() } }),
    when(() => confirming,
      into('overlay',
        dialog({ open: true },
          p('Delete this item?'),
          button('Cancel', { onClick: () => { confirming = false; update() } }),
        ),
      ),
    ),
  )
`)}
      <h3>由列表行驱动的 toast</h3>
      <p><code>list()</code> 的每一行就是一个视图。stack 类型的 region 会依次把它们显示出来，从数组里删掉一个 item，对应的 toast 也就消失了。</p>
      ${code("toasts.ts", `
const toasts: { text: string }[] = []

const notify = (text: string) => {
  toasts.push({ text })
  update()
}

const dismiss = (toast: { text: string }) => {
  toasts.splice(toasts.indexOf(toast), 1)
  update()
}

const App = () =>
  div(
    button('Save', { onClick: () => notify('Saved.') }),
    div({ className: 'toasts' }, region({ id: 'toasts', type: 'stack' })),
    list(() => toasts, (toast) =>
      into('toasts', div(toast.text, button('×', { onClick: () => dismiss(toast) }))),
    ),
  )
`)}
      <h3>让页面自己决定标题</h3>
      <p>默认的 <code>type: 'latest'</code> 下，最新的视图说了算：布局决定标题放在哪儿，当前打开的页面决定标题写什么。没有写 <code>into('title', …)</code> 的页面，就会显示 <code>empty</code> 里的文本。</p>
      ${code("title.ts", `
let page: 'home' | 'settings' = 'home'

const Layout = () =>
  div(
    h1(region({ id: 'title', empty: 'My app' })),
    when(() => page === 'home', Home()).else(Settings()),
  )

const Home = () => p('Welcome.')

const Settings = () =>
  div(
    into('title', 'Settings'),
    form(/* … */),
  )
`)}
      <h3>视图里的动态值</h3>
      <p><code>into()</code> 里的内容就是再普通不过的 Nuclo 内容，里面的函数同样是依赖 state 的值，不管 region 在哪儿，<code>update()</code> 时都会刷新。</p>
      ${code("status.ts", `
const selected = new Set<string>()

const Layout = () =>
  div(
    header(region({ id: 'status' })),
    Table(),
  )

const Table = () =>
  div(
    into('status', () => \`\${selected.size} selected\`),
    list(() => rows, (row) =>
      label(
        input({ type: 'checkbox', onChange: (e) => {
          e.currentTarget.checked ? selected.add(row.id) : selected.delete(row.id)
          update()
        } }),
        row.name,
      ),
    ),
  )
`)}
      <h3>时有时无的 region</h3>
      <p>仪表盘的 <code>into()</code> 只需要写一次。用户没登录时不存在 <code>main</code> region，视图就在一旁等着；登录之后 region 建好了，视图随即显示；登出时 region 被移除，视图又回到等待状态。</p>
      ${code("auth.ts", `
let user: { name: string } | null = null

const App = () =>
  div(
    when(() => user !== null,
      main(region({ id: 'main' })),
    ).else(
      LoginForm(),
    ),
    into('main', Dashboard()),
  )
`)}
      <h3>自带 region 的视图</h3>
      <p>视图里也可以包含 <code>region()</code>，供其他视图往里填内容。下面这个例子里，编辑器页面自带一个 <code>tabs</code> region，各个标签页往里填充；编辑器一关，这个 region 也跟着消失。</p>
      ${code("editor.ts", `
let tab: 'code' | 'preview' = 'code'

const Editor = () =>
  into('main',
    div(
      nav(
        button('Code', { onClick: () => { tab = 'code'; update() } }),
        button('Preview', { onClick: () => { tab = 'preview'; update() } }),
      ),
      section(region({ id: 'tabs' })),
    ),
    when(() => tab === 'code', into('tabs', textarea()))
      .else(into('tabs', iframe({ src: '/preview' }))),
  )
`)}
      <h3>在线示例</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> 只会重跑动态值，而静态值（比如 <code>h1(labels[lang].title)</code> 里的那段文本）在树构建时就已经定死了。<code>forceUpdate()</code> 会重新调用你的组件，再按新的构建结果去更新现有 DOM，连静态值也一并刷新。它适合偶尔发生的全局变化，比如切换语言，其余情况还是用 <code>update()</code>。</p>
      ${code("i18n.ts", `
const labels = { en: { title: 'Hello' }, pt: { title: 'Olá' } }
let lang: keyof typeof labels = 'en'

const App = () => div(h1(labels[lang].title))
render(App, root)

lang = 'pt'
forceUpdate() // same <h1> element, now "Olá"
`)}
    `,
        afterContent: `
      <p>不传参数时，<code>forceUpdate()</code> 会重建所有以 <code>render(App)</code> 或 <code>hydrate(App)</code> 渲染的根，而以 <code>render(App())</code> 渲染的根会被跳过。某个组件抛错时，错误会被记录，对应的根保留旧 DOM；如果是在应用新构建结果的途中才抛错，同样只记录，已经更新的部分不会回滚。</p>
      <h3>哪些保留，哪些改变</h3>
      <ul>
        <li>子节点按顺序、按标签一一对应。对上的元素会被复用，所以焦点和用户已输入的值都还在，<code>onMount</code> hook 也不会再跑一次。一旦某个子节点的标签对不上，它以及后面所有的兄弟节点都会重新构建。</li>
        <li>文本、属性、class、样式、listener、<code>when()</code> 分支以及 <code>list()</code> 的行，全都以新的构建结果为准。</li>
        <li>新增的元素会被创建，并触发 <code>onMount</code> hook；新构建里不再出现的元素会被移除，并触发 <code>onDestroy</code> hook。</li>
        <li><code>list()</code> 的行也是按位置而不是按 item 对应，所以被复用的行元素，最终显示的可能是另一个 item。</li>
        <li>新构建里不再设置的属性，不会被清除。</li>
      </ul>
      <div class="docs-callout"><strong>注意：</strong>声明在组件函数内部的 state 会被重置，因为函数会重新执行一遍。需要保留的 state，请放到组件外面。</div>
      <p><strong>显式写法。</strong><code>forceUpdate(App(), parent)</code> 会重建 <code>parent</code> 里的一棵树并返回它的根，但不会把这个根登记下来供以后的调用使用。和 <code>hydrate()</code> 一样，它要求根是 <code>parent</code> 的第一个节点；如果第一个节点的标签不一样，就直接替换掉。</p>
      <p>在服务端，<code>forceUpdate()</code> 是空操作。</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "渲染",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>构建整棵树，并把根元素 append 到 <code>parent</code> 里。<code>parent</code> 默认是 <code>document.body</code>，返回值就是根元素。</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>既可以传组件（<code>render(App)</code>），也可以传它返回的构建器（<code>render(App())</code>），生成的 DOM 是一样的。不过只有 <code>render(App)</code> 能让 <a href="#api-force-update"><code>forceUpdate()</code></a> 之后重建这个根，所以优先用它。</li>
        <li>它只会追加，不会清空 <code>parent</code>，所以调用两次就会出现两份。</li>
        <li><code>render()</code> 返回时，树里所有的 <code>onMount</code> 都已经执行完了。</li>
        <li>请渲染到已经在文档里的元素中，原因见 <a href="#api-update"><code>update()</code></a>。</li>
        <li>根必须是一个元素，比如 <code>div(...)</code>，不能是 <code>when()</code> 或 <code>list()</code>。</li>
        <li><code>index</code> 是内部参数，并不决定元素插入的位置，直接省略就好。</li>
      </ul>
      <p>以 <code>render(App)</code> 形式传入的组件必须没有参数：必选参数会报类型错误；可选参数虽然能通过类型检查，但 <code>render()</code> 在运行时会抛错。需要 props 的组件，请外面再包一层：</p>
      ${code("main.ts", `
const Page = (props: { name: string }) => div(h1('Hi ', props.name))

render(() => Page({ name: 'Ana' }), root)
`)}
    `,
      },
      {
        id: "api-hydrate",
        title: "hydrate()",
        content: `
      <p>接管由 <a href="#api-ssr"><code>renderToString()</code></a> 生成的 HTML：复用现成的元素，挂上事件 listener，并把动态值、<code>when()</code>、<code>list()</code> 登记好，让之后的 <code>update()</code> 能正常工作，最后触发 <code>onMount</code> hook。<code>parent</code> 默认是 <code>document.body</code>，返回根元素。</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>客户端要用和服务端同一个组件、同一份数据。</li>
        <li>hydrate 到一个专用容器里。应用的根必须是容器的第一个节点，前面有空白字符无妨。如果第一个节点是别的东西，Nuclo 会把它替换掉，而服务端渲染的那一份会原样留着。</li>
        <li>和 <code>render()</code> 一样，请传 <code>App</code> 而不是 <code>App()</code>，这样 <code>forceUpdate()</code> 之后才能重建这个根。<code>App</code> 必须没有参数；带可选参数的话，<code>hydrate()</code> 会悄无声息地什么都不挂。需要 props 的组件请外面包一层：<code>hydrate(() =&gt; Page(props), root)</code>。</li>
        <li>没有服务端 HTML 的话，就用 <code>render()</code>。</li>
      </ul>
      <h3>服务端和客户端对不上怎么办</h3>
      <p>一切以客户端为准：</p>
      <ul>
        <li>根标签不同，该节点会被替换成新的 DOM；容器是空的，就直接追加新的 DOM。</li>
        <li>文本不一致就更新文本，<code>list()</code> 的 item 和 <code>when()</code> 的分支也都跟随客户端。</li>
        <li>服务端多出来的子节点会被删掉，缺的会被补上。</li>
        <li>服务端写了、客户端没设置的属性，保持原样不动。</li>
      </ul>
      <p><code>renderToString()</code> 会写入一些 HTML 注释当作标记，比如每个文本节点前面的 <code>&lt;!-- text-0 --&gt;</code>。<code>hydrate()</code> 依赖它们，所以千万别把服务端 HTML 里的注释剥掉。没有这些标记，hydration 会删掉 <code>list()</code> 的行，<code>list()</code> 和 <code>when()</code> 也会不再更新。</p>
    `,
      },
      {
        id: "api-ssr",
        title: "服务端渲染",
        content: `
      <p>在服务端把组件渲染成 HTML 字符串，到了浏览器里再用同一个组件调用 <a href="#api-hydrate"><code>hydrate()</code></a>，这段 HTML 就具备了交互能力。服务端没有 <code>document</code>，所以要先 import <a href="#api-polyfill"><code>nuclo/polyfill</code></a>。</p>
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
      <p>style 标签上的 <code>id="nuclo-styles"</code> 请务必保留。客户端会复用这个元素，只往里追加新的规则，详见 <a href="#api-css-text"><code>getCssText()</code></a>。</p>
      <h3>服务端会执行什么</h3>
      <ul>
        <li>每次调用 <code>renderToString()</code> 都会构建一遍树，并让每个动态值执行一次。</li>
        <li>事件 handler、<code>onMount</code> 和 <code>onDestroy</code> 一概不执行，<code>update()</code>、<code>scope()</code>、<code>forceUpdate()</code> 都是空操作。</li>
        <li>渲染是同步的，数据要先加载好，再去渲染。</li>
        <li>渲染完不会留下任何注册状态，所以同一个进程可以放心地处理多个请求。请求相关的数据请当作参数传进去，例如 <code>renderToString(Page(user))</code>；模块级变量是所有请求共享的。</li>
        <li>服务端别调用 <code>render()</code>，它会往共享的 <code>document.body</code> 里追加内容。</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>可以接收构建器（<code>App()</code>）、组件（<code>App</code>）或 DOM 节点；<code>null</code> 和 <code>undefined</code> 返回 <code>""</code>。根必须是一个元素。以 <code>renderToString(Page)</code> 形式传入的组件必须没有参数，需要数据的组件请传 <code>Page(user)</code>。</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>文本和属性值都会做 HTML 转义。<code>script()</code> 和 <code>style()</code> 内部的文本则原样输出，只对结束标签做了拆分处理，所以永远不要把用户输入放在那里。</li>
        <li>它自己不会往外抛错。组件、<code>list()</code> 函数或 <code>when()</code> 条件出错，或者缺少 polyfill 时，它只会记录错误并返回 <code>""</code>。如果这种情况下请求应该失败，请自行检查结果是否为空。抛错的文本或属性函数只会渲染成空。</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>效果等同于 <code>inputs.map(renderToString)</code>。</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>把输出包进一个容器元素。<code>containerTag</code> 默认是 <code>"div"</code>，<code>containerAttrs</code> 默认是 <code>{}</code>。属性值会被转义，属性名则按你给的原样写出，所以要使用 <code>class</code> 这样的 HTML 名称。千万不要把用户输入当作标签名传进来。</p>
      ${code("example.ts", `
renderToStringWithContainer(p('Hi'), 'section', { id: 'main', class: 'page' })
// '<section id="main" class="page"><p><!-- text-0 -->Hi</p></section>'
`)}
    `,
      },
      {
        id: "api-polyfill",
        title: "nuclo/polyfill",
        content: `
      <p>一个迷你 DOM，让 Nuclo 在 Node 和 Bun 里也能构建树。首次渲染之前 import 一次就够了，大多数应用只要这样一行普通的 import。</p>
      <ul>
        <li>在没有 <code>window</code> 的环境里，它会补上 <code>globalThis.document</code>、<code>Node</code>、<code>Element</code> 和 <code>HTMLElement</code>，而且只补缺失的那几个，不会去创建 <code>window</code>。</li>
        <li>在浏览器或 jsdom 环境下，它什么都不做。</li>
        <li><code>Event</code> 和 <code>CustomEvent</code> 用的是 runtime 自带的构造函数，<code>Node</code>、<code>Element</code>、<code>HTMLElement</code> 则是 polyfill 类的别名。</li>
      </ul>
      <p>别把它当成浏览器，它只是一个够用来“搭树”的 DOM：没有 <code>innerHTML</code>，没有 <code>getElementById</code>，<code>querySelector()</code> 永远返回 <code>null</code>，事件 listener 会被直接忽略。要拿 HTML 请用 <code>renderToString()</code>。</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
