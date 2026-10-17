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
      <p>Nuclo 是一个面向 TypeScript 的小型 DOM 库。你用 <code>div()</code>、<code>button()</code> 这样的普通函数构建页面，把状态保存在普通变量中，并在页面需要变化时调用 <code>update()</code>。</p>
      <p>Nuclo 没有虚拟 DOM，没有编译器，没有代理（proxy），也没有信号（signal）。</p>
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
        <li>用标签构建器构建 UI。</li>
        <li>每个依赖状态的值都传一个函数。</li>
        <li>用普通 JavaScript 修改状态。</li>
        <li>调用 <code>update()</code>。Nuclo 重新运行这些函数并修补 DOM。</li>
      </ol>
      <p>修改变量不会触碰 DOM。只有在你调用 <code>update()</code> 时页面才会变化。</p>
    `,
      },
      {
        id: "quick-start",
        title: "快速开始",
        content: `
      <p><code>create-nuclo</code> 会搭建一个为 Nuclo 准备好的 Vite + TypeScript 项目：</p>
    `,
        afterContent: `
      <p>它会询问项目名称。要跳过提示，直接传入名称和参数。使用 npm 时，在参数前加上 <code>--</code>：</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>然后安装依赖并启动开发服务器：</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>选项</h3>
      <ul>
        <li><code>[project-name]</code>：目标文件夹。默认为 <code>nuclo-app</code>。</li>
        <li><code>-t, --template &lt;name&gt;</code>：要复制的模板。目前只有 <code>basic</code>。</li>
        <li><code>-y, --yes</code>：从不提示，使用默认值。</li>
        <li><code>-f, --force</code>：写入非空文件夹。</li>
        <li><code>-h, --help</code>：打印帮助。</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "安装与导入",
        content: `
      <p>在现有项目中添加 Nuclo：</p>
      ${sh("npm install nuclo")}
      <p>也可以使用 <code>pnpm add nuclo</code>、<code>yarn add nuclo</code> 或 <code>bun add nuclo</code>。Nuclo 没有任何依赖。</p>
      <p>路由不属于核心包。它作为 <a href="#router-overview"><code>nuclo-router</code></a> 单独发布，需要时与 <code>nuclo</code> 一起安装即可。</p>
      <h3>全局变量</h3>
      <p><code>import 'nuclo'</code> 会把以下内容挂到 <code>globalThis</code> 上：</p>
      <ul>
        <li><strong>175 个标签构建器</strong>：112 个用于 HTML（<code>div</code>、<code>span</code>、<code>button</code>……），63 个用于 SVG，带 <code>Svg</code> 后缀（<code>svgSvg</code>、<code>pathSvg</code>……）。参见<a href="#tag-builders">标签构建器</a>。</li>
        <li><strong>16 个辅助函数</strong>：<code>update</code>、<code>scope</code>、<code>when</code>、<code>list</code>、<code>region</code>、<code>into</code>、<code>on</code>、<code>render</code>、<code>hydrate</code>、<code>forceUpdate</code>、<code>css</code>、<code>cx</code>、<code>createCss</code>、<code>variants</code>、<code>keyframes</code> 和 <code>globalStyle</code>。</li>
      </ul>
      <p>这个导入必须在任何调用构建器的代码之前运行。ES 模块按导入顺序执行，所以下面的写法会失败：</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>把 <code>import 'nuclo'</code> 放在入口文件的最前面，或者在每个使用这些全局变量的文件中导入它。</p>
      <h3>命名导入</h3>
      <p>辅助函数同时也是命名导出，与全局变量是同一批函数。<code>getCssText()</code> 和 <code>resetStyles()</code> 只有命名导出。标签构建器只有全局形式，所以 <code>import { div } from 'nuclo'</code> 不可用。</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>入口点</h3>
      <ul>
        <li><code>nuclo</code>：注册全局变量，并导出 16 个辅助函数以及 <code>getCssText</code> 和 <code>resetStyles</code>。</li>
        <li><code>nuclo/ssr</code>：<code>renderToString</code>、<code>renderManyToString</code>、<code>renderToStringWithContainer</code> 和 <code>getCssText</code>。参见<a href="#api-ssr">服务端渲染</a>。</li>
        <li><code>nuclo/polyfill</code>：供 Node 和 Bun 使用的小型 DOM。参见 <a href="#api-polyfill">nuclo/polyfill</a>。</li>
        <li><code>nuclo/types</code>：仅类型。参见 <a href="#typescript-setup">TypeScript</a>。</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo 自带类型定义。你需要两样东西：</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>。目前尚不支持 <code>node16</code> 和 <code>nodenext</code>。</li>
        <li><code>DOM</code> lib。不设置 <code>lib</code> 时 TypeScript 默认包含它。</li>
      </ul>
      <p>只要项目中有任意一个文件导入了 <code>'nuclo'</code>，所有文件都能看到全局类型，无需其他配置。如果没有文件导入它，例如测试使用单独的 tsconfig，就需要自行添加类型：</p>
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
      <p>或者在某个 <code>.d.ts</code> 文件中加入 <code>/// &lt;reference types="nuclo/types" /&gt;</code>。</p>
      <h3>常用类型</h3>
      <p>这些类型是全局的，无需导入即可使用：</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>：标签构建器的返回值。可用作组件的返回类型。</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>：标签构建器可接受的任意参数。</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>：<code>render()</code> 和 <code>hydrate()</code> 的返回值。</li>
        <li><code>ElementTagName</code>：任意 HTML 标签名。</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>：标签构建器接受的属性对象，包括 <code>on*</code> 处理器、<code>onMount</code> 和 <code>onDestroy</code>。适用于透传属性的组件。</li>
        <li><code>MountCallback</code> 和 <code>DestroyCallback</code>：<code>onMount</code> 和 <code>onDestroy</code> 处理器。</li>
        <li><code>WhenBuilder</code>、<code>ListModifier</code>：<code>when()</code> 和 <code>list()</code> 的返回值。</li>
        <li><code>RegionOptions</code>、<code>RegionType</code>：<code>region()</code> 接受的选项。</li>
        <li><code>StyleResult</code>、<code>Style</code>、<code>ThemeConfig</code>、<code>CssInstance</code> 以及其他样式相关类型。这些也可以导入：<code>import type { StyleResult } from 'nuclo'</code>。</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> 把每个 DOM 成员都标记为可选。需要完整元素类型时进行类型断言：<code>render(App, root) as HTMLDivElement</code>。</p>
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
        title: "标签构建器",
        content: `
      <p>每个 HTML 标签都是一个同名的全局函数：<code>div</code>、<code>span</code>、<code>input</code>……唯一的例外是 <code>&lt;var&gt;</code>，因为 <code>var</code> 是保留字，所以它叫 <code>var_</code>。每个 SVG 标签都带 <code>Svg</code> 后缀：<code>svgSvg</code>、<code>pathSvg</code>、<code>circleSvg</code>……</p>
      <p>调用标签构建器并不会立刻创建元素。<code>div('Hi')</code> 返回一个<strong>构建器</strong>：一个稍后创建元素的函数。当你用 <code>render()</code> 挂载它，或把它放进另一个构建器、<code>when()</code> 或 <code>list()</code> 中时，Nuclo 才会调用它。每次使用都会创建一个新元素。</p>
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
      <p>构建器接受任意数量的参数，并从左到右依次应用：</p>
      <ul>
        <li><strong>string、number、bigint</strong>：一个文本节点。</li>
        <li><strong><code>() =&gt; value</code></strong>：在 <code>update()</code> 时变化的文本。参见<a href="#dynamic-functions">动态值</a>。</li>
        <li><strong><code>null</code>、<code>undefined</code></strong>：跳过。</li>
        <li><strong><code>true</code>、<code>false</code></strong>：渲染为文本 "true" 或 "false"。条件渲染请使用 <code>when()</code>。</li>
        <li><strong>普通对象</strong>：属性。参见<a href="#attributes">属性</a>。</li>
        <li><strong><code>css()</code>、<code>cx()</code> 或 <code>variants()</code> 的结果</strong>：添加其类名。</li>
        <li><strong><code>on(...)</code></strong>：事件监听器或生命周期钩子。</li>
        <li><strong>另一个构建器、<code>when()</code> 或 <code>list()</code></strong>：子节点。</li>
        <li><strong>DOM <code>Node</code></strong>：原样追加。</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>：自定义修饰器。见下文。</li>
      </ul>
      <h3>注意事项</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> 会渲染出文本 "false"。应写成 <code>div(when(() =&gt; isAdmin, span('Admin')))</code>。</li>
        <li>数组不是子节点。请展开它们：<code>ul(...names.map((n) =&gt; li(n)))</code>。对于会变化的列表，使用 <code>list()</code>。</li>
        <li>与标签同名的局部变量会遮蔽构建器。在 <code>function Row(label: string)</code> 内部，<code>label(...)</code> 不可调用。请给 <code>label</code>、<code>title</code>、<code>data</code>、<code>p</code>、<code>a</code>、<code>i</code> 这类局部变量改名。</li>
        <li>浏览器会把每个带 <code>id</code> 的元素暴露为全局变量。如果页面在 Nuclo 加载前就包含 <code>&lt;main id="main"&gt;</code>，Nuclo 会保留该全局变量，于是 <code>main(...)</code> 会抛出 <code>TypeError</code>。请使用其他 id。</li>
      </ul>
      <h3>自定义修饰器</h3>
      <p>声明了至少一个参数的函数会在元素构建期间按参数顺序运行一次。它的第一个参数是元素。第二个参数是内部索引，不要依赖它。如果它返回字符串或数字，该值会成为文本；返回 <code>Node</code> 会被追加；返回对象会被当作属性应用。</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>获取元素</h3>
      <p><code>render()</code> 返回根元素。在树内部，使用 <code>on("mount", (el) =&gt; …)</code> 或自定义修饰器。你也可以自己调用构建器函数来创建一个游离的元素：</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>请在下一次 <code>update()</code> 之前把它挂到文档中。<code>update()</code> 运行时不在文档中的节点会永久停止更新。</p>
      <h3>SVG</h3>
      <p>SVG 构建器接受相同的参数。Nuclo 用 <code>setAttribute</code> 设置所有 SVG 属性，所以像 <code>"stroke-width"</code> 这样的名称可以直接按原样书写。</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>全部构建器</h3>
      <p><strong>HTML：</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG：</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "组件",
        content: `
      <p>组件就是一个返回构建器（例如 <code>button(...)</code>）的普通函数。没有组件 API。在你渲染它或把它放进树之前，什么都不会被创建。</p>
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
      <p>在函数内部声明的状态属于该实例。在函数外部声明的状态由所有实例共享。<code>forceUpdate()</code> 会重新调用组件，这会重置在组件内部声明的状态。</p>
      <p>子节点就是普通参数：</p>
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
      <p>传入一个普通对象来设置属性。可以传入多个对象。同一个键以后面的值为准，但 <code>className</code> 和 <code>style</code> 例外，它们会合并。值可以是静态的，也可以是一个无参函数，后者会在每次 <code>update()</code> 时重新运行。</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>值是如何设置的</h3>
      <ul>
        <li>如果 HTML 元素有同名属性（<code>value</code>、<code>checked</code>、<code>disabled</code>、<code>htmlFor</code>、<code>tabIndex</code>……），Nuclo 设置该属性（property）。否则调用 <code>setAttribute(key, String(value))</code>，例如 <code>"aria-*"</code> 和 <code>"data-*"</code>。</li>
        <li>对于 SVG 元素，Nuclo 总是调用 <code>setAttribute</code>。</li>
        <li><code>null</code> 和 <code>undefined</code> 会被跳过。返回 <code>null</code> 或 <code>undefined</code> 的动态值会保留旧值。要清除一个值，返回 <code>""</code>；对布尔属性则返回 <code>false</code>。</li>
        <li>布尔值适用于 DOM 布尔属性，例如按钮的 <code>disabled</code>、<code>checked</code>、<code>hidden</code> 和 <code>required</code>。在其他地方，<code>true</code> 和 <code>false</code> 会被写成字符串 "true" 和 "false"。</li>
        <li>使用 <code>"data-*"</code> 键。不支持 <code>dataset</code>。</li>
        <li><code>innerHTML</code> 不会被转义，并且服务端渲染不会输出它。请避免使用。</li>
      </ul>
      <h3>类名</h3>
      <p>使用 <code>className</code>。静态类名字符串、<code>css()</code> 结果和动态 <code>className</code> 会全部合并。动态 <code>className</code> 保留静态类名；当它返回 <code>""</code> 时只剩静态类名。</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>不要在 HTML 元素上使用 <code>class</code> 键。它会设置原始属性，并替换掉之前应用的所有类名，包括 <code>css()</code> 的类名。</p>
      <h3>内联样式</h3>
      <p><code>style</code> 接受一个以 camelCase 为键的对象，或一个返回该对象的函数。</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo 不会补单位。请写 <code>"12px"</code>，而不是 <code>12</code>。<code>opacity</code>、<code>zIndex</code> 这类无单位属性可以接受数字。</li>
        <li><code>""</code>、<code>null</code> 和 <code>undefined</code> 会清除该属性。</li>
        <li>动态样式只设置它返回的键。不再返回的键保留旧值，所以要清除它请返回 <code>""</code>。</li>
        <li>不支持样式字符串（<code>"color: red"</code>）和自定义属性（<code>"--gap"</code>）。请改用 <code>css()</code>，它通过 <a href="#style-objects"><code>raw</code></a> 支持自定义属性。</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "事件",
        content: `
      <p>监听事件有两种方式：<code>on*</code> 属性和 <code>on()</code> 修饰器。</p>
      <h3><code>on*</code> 属性</h3>
      <p>在属性对象中，像 <code>onClick</code>（<code>on</code> 后跟大写字母）这样的键下的函数是事件处理器，而不是动态值。</p>
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
        <li>TypeScript 会根据键和元素推断事件类型。<code>e.currentTarget</code> 和 <code>this</code> 都是该元素。</li>
        <li>Nuclo 设置的是原生属性，所以 <code>onClick</code> 变成 <code>el.onclick</code>。每个事件只有一个处理器：后面的 <code>onClick</code> 会替换前面的。</li>
        <li><code>onDoubleClick</code> 和 <code>onDblClick</code> 都表示 <code>dblclick</code>。像 <code>onclick</code> 这样的小写键是类型错误。</li>
        <li>不是已知事件的名称会监听其小写形式：<code>onMyEvent</code> 监听 <code>"myevent"</code>。</li>
        <li>处理器抛出的错误不会被捕获。</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> 返回一个修饰器，它在元素上调用 <code>addEventListener</code>。</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>每个 <code>on()</code> 都会添加一个监听器。它们全部按顺序运行。</li>
        <li><code>options</code> 直接传给 <code>addEventListener</code>：<code>capture</code>、<code>once</code>、<code>passive</code>、<code>signal</code>。</li>
        <li>把 <code>on()</code> 直接传给构建器即可推断元素类型：<code>input(on('input', (e) =&gt; e.currentTarget.value))</code>。</li>
        <li>如果某个监听器抛出错误，Nuclo 用 <code>console.error</code> 记录该错误，其他监听器仍会运行。</li>
        <li>Nuclo 移除元素时会移除监听器。在服务端，<code>on()</code> 什么也不做。</li>
        <li>同一个 <code>on()</code> 值可以在多个元素上复用。</li>
      </ul>
      <p>对于自定义事件，把事件类型作为泛型传入：</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>如何选择</h3>
      <p>通常情况下使用 <code>on*</code> 属性。当你需要为同一事件注册多个监听器、需要监听器选项，或需要像 <code>"my-event"</code> 这样的自定义事件名时，使用 <code>on()</code>。</p>
    `,
      },
      {
        id: "lifecycle",
        title: "生命周期",
        content: `
      <p><code>onMount</code> 在元素插入后运行一次。<code>onDestroy</code> 在 Nuclo 移除元素时运行一次。可以写成属性，也可以用 <code>on()</code>。两种形式行为相同，元素类型都根据标签推断。</p>
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
      <h3>运行时机</h3>
      <ul>
        <li><code>onMount</code> 在插入该元素的那次 <code>render()</code>、<code>hydrate()</code>、<code>update()</code> 或 <code>forceUpdate()</code> 调用结束时运行。它从不在树构建过程中运行。</li>
        <li>如果 <code>onMount</code> 返回一个函数，该函数会在销毁时运行，位于该元素的 <code>onDestroy</code> 回调之后。</li>
        <li><code>onDestroy</code> 在 Nuclo 移除元素时运行：<code>list()</code> 的行被移除、<code>when()</code> 切换分支、<code>into()</code> 离开其区域，或 <code>forceUpdate()</code> 丢弃它。它在移除之前运行，所以此时元素仍在文档中。</li>
      </ul>
      <h3>直接操作 DOM 移除</h3>
      <p>如果你自己移除元素，例如用 <code>node.remove()</code> 或 <code>innerHTML = ''</code>，它的 <code>onDestroy</code> 和清理函数永远不会运行，定时器也会继续运行。Nuclo 没有 <code>unmount()</code>。要带清理地卸载整个应用，把它包进 <code>when()</code>：</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>顺序与错误</h3>
      <ul>
        <li>两种形式都可以注册任意数量的钩子。它们按注册顺序运行。</li>
        <li><code>onDestroy</code> 总是先运行子元素的，再运行父元素的。</li>
        <li>元素按其第一个 <code>onMount</code> 钩子的顺序挂载，该顺序即参数顺序，并且每个元素会一起运行它的所有钩子。如果子元素依赖父元素的钩子，请把父元素的钩子放在子元素之前。</li>
        <li>抛出错误的钩子会用 <code>console.error</code> 记录。其他钩子仍会运行。</li>
        <li>回调必须返回空或一个清理函数，所以不要把它写成 <code>async</code>。返回的 Promise 永远不会被当作清理函数。请在回调内部启动异步工作：<code>{ onMount: (el) =&gt; { void load(el) } }</code>。</li>
        <li>钩子从不在服务端运行。在客户端，它们在 <code>hydrate()</code> 之后运行。</li>
      </ul>
      <div class="docs-callout"><strong>注意：</strong>钩子不是 effect。状态变化时它们不会再次运行。每个钩子在每个元素上最多运行一次。</div>
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
      <p>Nuclo 从不自行更新页面。先修改状态，然后调用 <code>update()</code>。</p>
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
      <p>修改任意多的状态，然后只调用一次 <code>update()</code>：</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>在事件处理器、定时器、fetch 回调或 <code>onMount</code> 中调用 <code>update()</code>。不要在动态值内部调用它。</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "动态值",
        content: `
      <p><strong>无参数</strong>的函数就是<strong>动态值</strong>。Nuclo 在构建元素时运行它一次，之后每次 <code>update()</code> 再运行一次。动态值可用于文本子节点、属性值、<code>style</code> 和 <code>className</code>。对于会出现、消失或重复的子节点，使用 <a href="#api-when"><code>when()</code></a> 和 <a href="#api-list"><code>list()</code></a>。</p>
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
      <p>Nuclo 检查的是参数个数（<code>fn.length</code>）。声明了参数的函数是<a href="#tag-builders">自定义修饰器</a>，只运行一次。<code>(x = 0) =&gt; …</code> 和 <code>(...args) =&gt; …</code> 的 length 为 0，所以它们是动态值。</p>
      <h3>动态文本</h3>
      <ul>
        <li>string、number、bigint 或 boolean 渲染为 <code>String(value)</code>。<code>() =&gt; ok &amp;&amp; 'Saved'</code> 会显示 "false"，所以应写成 <code>() =&gt; (ok ? 'Saved' : '')</code>。</li>
        <li><code>null</code> 和 <code>undefined</code> 渲染为空文本。</li>
        <li>首次运行返回 <code>css()</code> 或 <code>cx()</code> 结果的函数会成为动态类名，而不是文本。参见 <a href="#api-cx"><code>cx()</code></a>。</li>
        <li>节点、构建器、数组或普通对象不渲染任何内容，并且永不更新。</li>
      </ul>
      <h3>动态属性</h3>
      <ul>
        <li>Nuclo 只在值与上次写入的值不同时才写入。它不与实际 DOM 比较，所以如果用户在输入框中输入了内容，而你的函数返回了与之前相同的值，用户输入的文本会保留。</li>
        <li>返回 <code>null</code> 或 <code>undefined</code> 不会写入任何内容，旧值保留。<code>className</code> 是例外：任何假值都会移除动态类名并保留静态类名。</li>
        <li><code>style</code> 函数在每次更新时应用返回的对象。</li>
      </ul>
      <h3>错误</h3>
      <p>如果动态值抛出错误，Nuclo 会捕获它，更新的其余部分继续运行。文本变为空或保留旧值，属性保留旧值。两者都会在下一次成功的 <code>update()</code> 中恢复。例外情况：在<strong>第一次</strong>运行时抛出错误的文本函数会永久保持为空。</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>对页面上所有动态值同步运行一遍。传入 id 时，只更新标记了这些 <a href="#api-scope"><code>scope()</code></a> id 的元素内部的内容。每一遍按顺序执行以下步骤：</p>
      <ol>
        <li><code>list()</code>：重新读取 items，并添加、移动或移除行。</li>
        <li><code>when()</code>：重新检查条件。只有当另一个分支变为活动时才会重建分支。</li>
        <li>动态属性，包括 <code>style</code> 和 <code>className</code>。</li>
        <li>动态文本。</li>
        <li>为步骤 1 和 2 插入的元素运行 <code>onMount</code>。</li>
      </ol>
      <ul>
        <li><strong>它会运行所有内容。</strong>每次调用时所有动态值都会运行，即使其数据没有变化。只有 DOM 写入会被跳过。请让动态值保持快速且无副作用。</li>
        <li><strong>只处理文档中的节点。</strong>如果 <code>update()</code> 运行时某个节点不在文档中，Nuclo 会停止追踪它。即使之后再挂上去，它也永不更新。这同样适用于 <code>list()</code> 和 <code>when()</code>。请渲染到位于文档中的容器。</li>
        <li><strong>静态值永不改变。</strong>普通字符串和属性值在元素构建时就固定了。要重建它们，使用 <a href="#api-force-update"><code>forceUpdate()</code></a>。</li>
        <li><strong>错误。</strong>文本和属性的错误会被捕获，更新继续进行。如果 <code>when()</code> 的条件抛出错误，错误会被记录，并且该 <code>when()</code> 停止更新。如果 <code>list()</code> 的 <code>items</code> 或 <code>renderItem</code> 函数抛出错误，错误会从 <code>update()</code> 中逃逸，剩余步骤不再运行。</li>
        <li><strong>服务端。</strong><code>update()</code> 在服务端什么也不做。</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>给它所传入的元素一个或多个作用域 id。之后 <code>update('id')</code> 只更新该元素内部的内容，包括该元素自身的属性。</p>
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
        <li>一个元素可以有多个 id：<code>scope('cart', 'sidebar')</code>。</li>
        <li><code>update('a', 'b')</code> 更新 <code>a</code> 或 <code>b</code> 内部的所有内容。如果多个元素使用同一个 id，它们全都会更新。</li>
        <li>对于嵌套作用域，<code>update('outer')</code> 包含内层作用域。<code>update('inner')</code> 不会触碰外层。</li>
        <li>文档中没有任何元素拥有的 id <strong>不会更新任何内容</strong>，也不会报错，所以请检查拼写。</li>
        <li><code>scope()</code> 在服务端什么也不做。</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>根据条件渲染内容。Nuclo 在每次 <code>update()</code> 时重新检查条件。第一个为真的条件生效。如果都不为真，则渲染 <code>.else()</code> 的内容。没有 <code>.else()</code> 时不渲染任何内容。</p>
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
        <li>对于状态，请传函数。普通布尔值只读取一次：<code>when(open, …)</code> 永远不会变化。</li>
        <li>在 TypeScript 中该函数必须返回布尔值。请写 <code>() =&gt; items.length &gt; 0</code> 或 <code>() =&gt; user != null</code>。</li>
      </ul>
      <h3>哪些内容会更新</h3>
      <ul>
        <li>只要同一分支保持活动，它的元素就会保留。其中的动态值、列表和 <code>when()</code> 块持续更新。</li>
        <li>当另一个分支变为活动时，旧内容被移除，其 <code>onDestroy</code> 钩子运行。新分支从头构建，其 <code>onMount</code> 钩子运行。旧元素中的状态（如输入文本或焦点）会丢失。</li>
      </ul>
      <h3>分支内容</h3>
      <p>把子节点放进分支：文本、动态文本、构建器、<code>list()</code> 和嵌套的 <code>when()</code>。请传入像 <code>p('Hi')</code> 这样的构建器，而不是 DOM 节点：DOM 节点在其分支隐藏一次之后就停止更新。</p>
      <p>分支中的属性对象和 <code>on()</code> 会应用到父元素，并且在分支隐藏后仍然保留。条件属性请使用动态属性：<code>{ className: () =&gt; (active ? 'active' : '') }</code>。</p>
      <h3>链式调用</h3>
      <p><code>.when()</code> 和 <code>.else()</code> 返回新的构建器，不会修改原来的。如果调用 <code>.else()</code> 两次，以最后一次为准。</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>为每个 item 渲染一行。每次 <code>update()</code> 时，Nuclo 重新调用 <code>items()</code>，并按同一性（<code>===</code>）把新 item 与现有行匹配。</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>行是如何匹配的</h3>
      <ul>
        <li>仍然存在的 item 保留它的行。Nuclo 会在需要时移动该行，并且不会再次调用 <code>renderItem</code>。</li>
        <li>新 item 得到新行。被移除的 item 失去它的行，其 <code>onDestroy</code> 钩子运行。</li>
        <li>重复的 item 各自拥有独立的行。</li>
        <li>可以原地修改数组（<code>push</code>、<code>splice</code>、<code>sort</code>），也可以返回新数组。</li>
      </ul>
      <p>保留的行不会被重新渲染，所以会变化的字段请使用动态值：</p>
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
      <p>副本是新的 item，所以用 <code>todos.map((t) =&gt; ({ ...t }))</code> 替换数组会重建所有行。</p>
    `,
        afterContent: `
      <h3><code>renderItem</code> 的返回值</h3>
      <ul>
        <li>返回一个元素，例如 <code>li(...)</code>、<code>tr(...)</code> 或某个 SVG 构建器。返回 <code>null</code> 或 <code>undefined</code> 可跳过某个 item。字符串、文本节点和 fragment 不渲染任何内容。</li>
        <li>不要直接返回 <code>when()</code> 或 <code>list()</code>。把它们放进行元素内部：<code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>。</li>
        <li>要隐藏 item，请在 <code>items()</code> 中过滤，而不是在 <code>renderItem</code> 中。</li>
        <li>保持 <code>renderItem</code> 无副作用。Nuclo 可能会对同一个 item 调用它多次。</li>
      </ul>
      <h3>索引</h3>
      <p><code>index</code> 是该行创建时 item 所在的位置。行移动时它不会更新。要获取当前位置，请使用动态值：<code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>。</p>
      <h3>可迭代对象</h3>
      <p>任何可迭代对象都可以：数组、<code>Set</code>、生成器和 <code>map.values()</code>。每次返回同一个数组或 <code>Set</code> 没有问题。迭代器（如生成器或 <code>map.values()</code>）遍历一遍后就会耗尽，所以请在每次调用 <code>items()</code> 时重新创建。直接迭代 <code>Map</code> 每次都会创建新的 <code>[key, value]</code> 数组，导致所有行被重建。请改用 <code>map.values()</code>。</p>
      <h3>位置</h3>
      <p>行出现在 <code>list()</code> 在其兄弟节点中所处的位置，位于两个注释标记之间。父元素的其他子节点不受影响。<code>list()</code> 在 SVG 构建器内部同样可用。</p>
    `,
      },
      {
        id: "api-region",
        title: "region() 与 into()",
        content: `
      <p><code>region()</code> 在树中标记一个命名的位置。<code>into()</code> 可以从任意其他地方、任意深度填充它。布局不会以 prop 的形式接收内容，构建内容的组件也不知道内容会落在哪里。</p>
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
      <h3>工作原理</h3>
      <ul>
        <li><code>into()</code> 在它所在的位置只留下一个注释。它的内容渲染在区域的标记之间。</li>
        <li>顺序无关。在区域之前构建的 <code>into()</code> 会等待，并在区域构建完成的那一刻显示。视图按书写顺序显示。</li>
        <li>内容的生命周期与视图一致。当持有 <code>into()</code> 的 <code>when()</code> 关闭，或其所在的 <code>list()</code> 行被移除时，内容离开区域。再次打开只会添加一份，不会有两份。</li>
        <li>当区域消失时（例如其 <code>when()</code> 关闭），它的视图会重新等待。之后以相同 id 构建的区域会显示它们。</li>
        <li>id 不匹配任何区域的 <code>into()</code> 不渲染任何内容，也不报错，所以请检查拼写。</li>
        <li>id 在树中唯一。在一个仍存活的 id 下再构建一个区域会记录一条警告。</li>
        <li>区域支持<a href="#api-ssr">服务端渲染</a>。<code>hydrate()</code> 时，每个视图会接管服务端渲染出的 HTML，而不是重新构建。</li>
      </ul>
      <h3>选项</h3>
      <ul>
        <li><code>id</code>：<code>into()</code> 调用用来查找区域的名称。</li>
        <li><code>type</code>：<code>'latest'</code>（默认）只显示最新的视图。<code>'stack'</code> 按到达顺序显示所有视图。</li>
        <li><code>empty</code>：区域中没有视图时渲染的内容。</li>
      </ul>
      <h3>堆叠区域</h3>
      <p>使用 <code>type: 'stack'</code> 时，在另一个视图之上打开的视图不会重建下面那个。它的 DOM、焦点和表单状态都会保留。适用于页面之上的对话框这类层叠场景。</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>同时填充多个区域</h3>
      <p>传入一个对象即可用单个 <code>into()</code> 填充多个区域。值可以是一个子节点或子节点数组。两种形式都可以嵌套：位于另一个视图内容中的 <code>into()</code> 指向它自己的区域。</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>从树的深处打开对话框</h3>
      <p>覆盖层区域位于根部。任意深度的任何组件都可以通过把 <code>into()</code> 包在 <code>when()</code> 中来打开对话框。关闭 <code>when()</code> 就会把对话框从区域中移除。</p>
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
      <h3>来自列表行的 toast</h3>
      <p><code>list()</code> 的每一行都是一个视图。堆叠区域按顺序显示它们，从数组中移除一个 item 就会移除对应的 toast。</p>
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
      <h3>由页面设置的页面标题</h3>
      <p>使用默认的 <code>type: 'latest'</code> 时，最新的视图生效。布局拥有标题，而当前打开的页面决定标题内容。没有 <code>into('title', …)</code> 的页面会留下 <code>empty</code> 文本。</p>
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
      <h3>视图中的动态值</h3>
      <p><code>into()</code> 的内容就是普通的 Nuclo 内容。其中的函数是依赖状态的值，无论区域在哪里，都会在 <code>update()</code> 时刷新。</p>
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
      <h3>时有时无的区域</h3>
      <p>仪表盘的 <code>into()</code> 只写一次。用户未登录时没有 <code>main</code> 区域，所以视图等待。登录后构建了区域，视图随即显示。登出会移除区域，视图再次等待。</p>
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
      <h3>自带区域的视图</h3>
      <p>视图可以包含 <code>region()</code>，其他视图可以指向它。这里编辑器页面自带一个 <code>tabs</code> 区域，每个标签页填充它。编辑器关闭时，它的区域也随之消失。</p>
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
      <p><code>update()</code> 只运行动态值。静态值（例如 <code>h1(labels[lang].title)</code> 中的文本）在树构建时就固定了。<code>forceUpdate()</code> 会重新调用你的组件，并修补实际 DOM 使其与之匹配，静态值也包括在内。它适用于罕见的、全应用范围的变化，例如切换语言。其他情况一律使用 <code>update()</code>。</p>
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
      <p>不带参数时，<code>forceUpdate()</code> 会重建所有通过 <code>render(App)</code> 或 <code>hydrate(App)</code> 渲染的根。通过 <code>render(App())</code> 渲染的根会被跳过。如果某个组件抛出错误，错误会被记录，该根保留旧 DOM。在应用新构建结果的过程中稍后抛出的错误同样会被记录，但已经修补的部分保持修补后的状态。</p>
      <h3>保留什么，改变什么</h3>
      <ul>
        <li>子节点按顺序、按标签匹配。匹配的元素会被复用，所以焦点和已输入的值得以保留，其 <code>onMount</code> 钩子也不会再次运行。一旦某个子节点的标签不同，该子节点及其后的所有兄弟节点都会重新构建。</li>
        <li>文本、属性、类名、样式、监听器、<code>when()</code> 分支和 <code>list()</code> 行都跟随新的构建结果。</li>
        <li>新元素会被创建，其 <code>onMount</code> 钩子运行。新构建中不再产生的元素会被移除，其 <code>onDestroy</code> 钩子运行。</li>
        <li><code>list()</code> 的行同样按位置匹配，而不是按 item，所以被复用的行元素可能最终显示另一个 item。</li>
        <li>新构建中不再设置的属性不会被移除。</li>
      </ul>
      <div class="docs-callout"><strong>注意：</strong>在组件函数内部声明的状态会被重置，因为函数会再次运行。需要保留的状态请放在组件外部。</div>
      <p><strong>显式形式。</strong><code>forceUpdate(App(), parent)</code> 重建 <code>parent</code> 中的一棵树并返回其根。它不会为后续调用注册该根。与 <code>hydrate()</code> 一样，它期望根是 <code>parent</code> 中的第一个节点。如果第一个节点的标签不同，它会被替换。</p>
      <p>在服务端，<code>forceUpdate()</code> 什么也不做。</p>
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
      <p>构建你的树并把根元素追加到 <code>parent</code> 中。<code>parent</code> 默认为 <code>document.body</code>。返回根元素。</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>可以传组件（<code>render(App)</code>）或它返回的构建器（<code>render(App())</code>）。生成的 DOM 相同。只有 <code>render(App)</code> 允许 <a href="#api-force-update"><code>forceUpdate()</code></a> 之后重建该根，所以优先使用它。</li>
        <li>它是追加操作。它不会清空 <code>parent</code>，所以调用两次会添加两份。</li>
        <li><code>render()</code> 返回时，树中所有的 <code>onMount</code> 都已运行。</li>
        <li>请渲染到位于文档中的元素。参见 <a href="#api-update"><code>update()</code></a>。</li>
        <li>根必须是一个元素，例如 <code>div(...)</code>，不能是 <code>when()</code> 或 <code>list()</code>。</li>
        <li><code>index</code> 是内部参数。它不决定元素插入的位置。请省略它。</li>
      </ul>
      <p>以 <code>render(App)</code> 形式传入的组件必须没有参数。必选参数是类型错误。可选参数能通过类型检查，但 <code>render()</code> 会在运行时抛出错误。接受 props 的组件请包一层：</p>
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
      <p>接管由 <a href="#api-ssr"><code>renderToString()</code></a> 生成的 HTML。它复用已有元素，附加事件监听器，并接通动态值、<code>when()</code> 和 <code>list()</code>，使之后的 <code>update()</code> 能正常工作。然后运行 <code>onMount</code> 钩子。<code>parent</code> 默认为 <code>document.body</code>。返回根元素。</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>使用与服务端相同的组件和相同的数据。</li>
        <li>水合到一个专用容器中。应用的根必须是容器的第一个节点，空白字符无妨。如果第一个节点是别的东西，Nuclo 会替换那个节点，并把服务端的副本留在原地。</li>
        <li>与 <code>render()</code> 一样，请传 <code>App</code> 而不是 <code>App()</code>，这样 <code>forceUpdate()</code> 之后才能重建该根。<code>App</code> 必须没有参数。带可选参数时，<code>hydrate()</code> 会静默地不附加任何东西。接受 props 的组件请包一层：<code>hydrate(() =&gt; Page(props), root)</code>。</li>
        <li>如果没有服务端 HTML，使用 <code>render()</code>。</li>
      </ul>
      <h3>服务端与客户端不一致时</h3>
      <p>以客户端为准：</p>
      <ul>
        <li>根标签不同：该节点被替换为新的 DOM。容器为空：追加新的 DOM。</li>
        <li>不同的文本会被修补。不同的 <code>list()</code> item 和 <code>when()</code> 分支跟随客户端。</li>
        <li>服务端多出的子节点会被移除，缺少的会被创建。</li>
        <li>服务端写入但客户端未设置的属性保持原样。</li>
      </ul>
      <p><code>renderToString()</code> 会写入 HTML 注释作为标记，例如每个文本节点前的 <code>&lt;!-- text-0 --&gt;</code>。<code>hydrate()</code> 需要它们，所以不要从服务端 HTML 中去掉注释。没有这些标记，水合会删除 <code>list()</code> 的行，并且 <code>list()</code> 和 <code>when()</code> 会停止更新。</p>
    `,
      },
      {
        id: "api-ssr",
        title: "服务端渲染",
        content: `
      <p>在服务端把组件渲染成 HTML 字符串。在浏览器中，用同一个组件调用 <a href="#api-hydrate"><code>hydrate()</code></a> 让这段 HTML 变得可交互。服务端运行时没有 <code>document</code>，所以请先导入 <a href="#api-polyfill"><code>nuclo/polyfill</code></a>。</p>
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
      <p>请保留 style 标签上的 <code>id="nuclo-styles"</code>。客户端会复用该元素，只添加新的规则。参见 <a href="#api-css-text"><code>getCssText()</code></a>。</p>
      <h3>服务端运行什么</h3>
      <ul>
        <li>每次 <code>renderToString()</code> 调用都会构建树，并把每个动态值运行一次。</li>
        <li>事件处理器、<code>onMount</code> 和 <code>onDestroy</code> 从不运行。<code>update()</code>、<code>scope()</code> 和 <code>forceUpdate()</code> 什么也不做。</li>
        <li>渲染是同步的。请先加载数据，再渲染。</li>
        <li>渲染之后不会留下任何注册状态，所以一个进程可以服务多个请求。请把请求数据作为参数传入，例如 <code>renderToString(Page(user))</code>。模块级变量由所有请求共享。</li>
        <li>不要在服务端调用 <code>render()</code>。它会追加到共享的 <code>document.body</code> 中。</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>接受构建器（<code>App()</code>）、组件（<code>App</code>）或 DOM 节点。<code>null</code> 和 <code>undefined</code> 返回 <code>""</code>。根必须是一个元素。以 <code>renderToString(Page)</code> 形式传入的组件必须没有参数，所以接受数据的组件请传 <code>Page(user)</code>。</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>文本和属性值会进行 HTML 转义。<code>script()</code> 和 <code>style()</code> 内部的文本按原样写出，只会拆开闭合标签，所以绝不要把用户输入放在那里。</li>
        <li>它不会抛出错误。如果组件、<code>list()</code> 函数或 <code>when()</code> 条件抛出错误，或者缺少 polyfill，它会记录错误并返回 <code>""</code>。如果请求应当失败，请检查结果是否为空。抛出错误的文本或属性函数只会渲染为空。</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>等同于 <code>inputs.map(renderToString)</code>。</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>把输出包在一个元素中。<code>containerTag</code> 默认为 <code>"div"</code>，<code>containerAttrs</code> 默认为 <code>{}</code>。属性值会被转义。属性名按给定的形式写出，所以请使用 <code>class</code> 这样的 HTML 名称。绝不要把用户输入作为标签名传入。</p>
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
      <p>一个小型 DOM，让 Nuclo 能在 Node 和 Bun 中构建树。在第一次渲染之前导入一次即可。大多数应用只需要这个普通导入。</p>
      <ul>
        <li>没有 <code>window</code> 时，它会设置 <code>globalThis.document</code>、<code>Node</code>、<code>Element</code> 和 <code>HTMLElement</code>，但只设置缺失的那些。它不会创建 <code>window</code>。</li>
        <li>在浏览器中，或在 jsdom 下，它什么也不做。</li>
        <li><code>Event</code> 和 <code>CustomEvent</code> 是运行时自带的构造函数。<code>Node</code>、<code>Element</code> 和 <code>HTMLElement</code> 是 polyfill 类的别名。</li>
      </ul>
      <p>它是一个用于构建树的 DOM，而不是浏览器。它没有 <code>innerHTML</code>，没有 <code>getElementById</code>，<code>querySelector()</code> 返回 <code>null</code>，事件监听器会被忽略。请使用 <code>renderToString()</code> 获取 HTML。</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
