import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "样式",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>根据类型安全的样式对象生成 CSS 类。把结果传给任意标签构建函数即可。在浏览器中，规则写入唯一的 <code>&lt;style id="nuclo-styles"&gt;</code> 元素；在服务端，由 <a href="#api-css-text"><code>getCssText()</code></a> 返回。</p>
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
        <li><code>css()</code> 为基础声明生成一个类，再为每个伪类键、选择器和媒体块各生成一个类。上面的 card 会得到两个类。</li>
        <li>类名是内容的哈希。相同的样式共享同一个类，服务端和客户端生成的名字也一致。</li>
        <li>在模块级别定义样式，只定义一次。<code>css()</code> 按对象缓存，所以每次调用都传新对象会被重复处理。</li>
        <li>把样式对象传给 <code>css()</code> 之后再修改它，不会有任何效果。</li>
        <li>所有样式在页面或服务端进程的整个生命周期内都保持注册。对于逐项变化的值（比如来自数据的宽度），请使用 <a href="#attributes"><code>style</code> 属性</a>。</li>
      </ul>
      <h3>命名样式</h3>
      <p>先传一个名字，就能得到可读的类名：</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>基础类名就是这个名字本身。其余块得到 <code>name-&lt;hash&gt;</code>。</li>
        <li>名字必须是合法的类名，否则 Nuclo 会发出警告并自动生成一个。</li>
        <li>名字是全局的。两个不同的样式使用同一个名字时，Nuclo 会发出警告。</li>
      </ul>
      <h3>使用结果</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> 和 <code>card.className</code> 都返回类名。</p>
    `,
      },
      {
        id: "style-objects",
        title: "样式对象",
        content: `
      <p>传给 <code>css()</code> 的对象使用 camelCase 的常见 CSS 属性、一组简写，以及用于伪类状态、选择器和媒体查询的嵌套键。TypeScript 会对它们全部自动补全。不在类型集合内的属性，比如 <code>borderTopLeftRadius</code>、<code>fill</code> 或 <code>paddingInline</code>，放在 <code>raw</code> 里（见下文）。</p>
      <h3>值</h3>
      <ul>
        <li>数字会加上 <code>px</code>，但 <code>0</code> 和无单位属性除外：<code>zIndex</code>、<code>opacity</code>、<code>fontWeight</code>、<code>lineHeight</code>、<code>flex</code>、<code>flexGrow</code>、<code>flexShrink</code>、<code>order</code>、<code>aspectRatio</code>、<code>gridColumn</code> 和 <code>gridRow</code>。在 <code>raw</code> 中，<code>zoom</code>、<code>scale</code>、<code>column-count</code>、<code>orphans</code>、<code>widows</code>、<code>tab-size</code> 和 <code>animation-iteration-count</code> 也是无单位的。</li>
        <li>字符串按原样使用。<code>null</code>、<code>undefined</code> 和 <code>false</code> 会被跳过。</li>
        <li><code>lineHeight</code>（以及 <code>leading</code>）是无单位的，所以 <code>leading: 24</code> 表示字号的 24 倍。要用像素请写 <code>"24px"</code>。</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>简写</h3>
      <table>
        <thead><tr><th>键</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>、<code>pt</code>、<code>pr</code>、<code>pb</code>、<code>pl</code></td><td>padding，以及各边</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>左右 padding / 上下 padding</td></tr>
          <tr><td><code>m</code>、<code>mt</code>、<code>mr</code>、<code>mb</code>、<code>ml</code>、<code>mx</code>、<code>my</code></td><td>margin 的对应写法</td></tr>
          <tr><td><code>w</code>、<code>h</code>、<code>minW</code>、<code>maxW</code>、<code>minH</code>、<code>maxH</code></td><td>width、height，以及它们的 min 和 max</td></tr>
          <tr><td><code>size</code></td><td>width 和 height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>以下键接受 <code>true</code>：</p>
      <table>
        <thead><tr><th>键</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center（不设置 display）</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>伪类状态</h3>
      <p><code>hover</code>、<code>focus</code>、<code>focusVisible</code>、<code>focusWithin</code>、<code>active</code>、<code>visited</code>、<code>disabled</code>、<code>enabled</code>、<code>checked</code>、<code>required</code>、<code>invalid</code>、<code>valid</code>、<code>readOnly</code>、<code>first</code>（<code>:first-child</code>）、<code>last</code>（<code>:last-child</code>）、<code>only</code>（<code>:only-child</code>）、<code>odd</code>、<code>even</code>、<code>empty</code>、<code>placeholderShown</code>、<code>placeholder</code>、<code>before</code>、<code>after</code>、<code>selection</code>、<code>marker</code>、<code>firstLine</code> 和 <code>firstLetter</code>。它们可以嵌套：<code>hover: { focus: {…} }</code> 得到 <code>:hover:focus</code>。</p>
      <h3>选择器与 at 规则</h3>
      <p>以 <code>&amp;</code> 开头的键是选择器，其中每个 <code>&amp;</code> 都会被替换为该类。以 <code>@</code> 开头的键是 at 规则：<code>@media</code>、<code>@container</code> 或 <code>@supports</code>。</p>
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
        <li>键必须以 <code>&amp;</code> 开头。像 <code>".dark &amp;"</code> 这样的键会被忽略，所以请写成 <code>"&amp;:is(.dark *)"</code>。</li>
        <li>两个嵌套的 <code>@media</code> 块用 <code>and</code> 合并。以媒体类型（<code>print</code>、<code>only screen</code>）开头的查询会被放在前面，因为语法只允许类型出现在开头。无法扁平化的组合（两个媒体类型，或以 <code>not</code> 开头）会发出警告并只使用内层查询。其他任何嵌套的 at 规则都会替换外层的。</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>任何属性都可以放在 <code>raw</code> 中，名字按 CSS 原样书写。数字仍会加上 <code>px</code>，所以请传字符串：</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>其他任何平铺的键都会被转换为 kebab-case 并原样输出，所以像 <code>colr: 'red'</code> 这样的拼写错误会变成一条被浏览器丢弃的声明。放在非伪类状态、非 screen、非 <code>&amp;</code> 或 <code>@</code> 键下的嵌套对象会被忽略。这两种情况 TypeScript 都会报错。</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>组合样式。多个输入设置同一属性时，以最后一个输入为准。</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>假值输入会被跳过，数组会被展开，字符串会被拆分并去重。</li>
        <li>同一个块（基础块、同一伪类、同一媒体查询）的生成类会合并为一个新类。其他类名原样通过。</li>
        <li>只有 <code>cx()</code> 知道参数顺序。写成 <code>div(base, blue)</code> 时两个类都会被加上，实际生效的是最后创建的规则。互相覆盖的样式应放在同一个 <code>cx()</code> 调用里。</li>
        <li>当命名样式的某个块与另一个输入的块合并时，合并后的类是 <code>name-&lt;hash&gt;</code>，而不是不带哈希的名称。没有合并的块保留原来的类，所以 <code>cx(pageTitle, 'extra')</code> 仍然带有 <code>page-title</code>。</li>
      </ul>
      <h3>动态类</h3>
      <p>传一个始终返回 <code>cx(...)</code> 的函数：</p>
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
      <p>这个函数第一次运行时必须返回样式结果。<code>() =&gt; active &amp;&amp; activeButton</code> 会把文本 "false" 渲染出来，而不是一个类。</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>返回绑定到某个主题的一组专属 <code>css</code>、<code>cx</code>、<code>variants</code>、<code>keyframes</code> 和 <code>globalStyle</code>。主题为值赋予名字：用下面的主题，<code>borderColor: 'border'</code> 会写出 <code>#e5e7eb</code>，并且 TypeScript 会自动补全这些名字。<code>screens</code> 中的每一项都会成为一个媒体查询的样式键，比如 <code>md: {…}</code>。</p>
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
        <thead><tr><th>主题键</th><th>使用方</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>、<code>backgroundColor</code>、<code>color</code>、<code>borderColor</code> 及各边、<code>outlineColor</code>、<code>caretColor</code>、<code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>、<code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>、<code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>、<code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>新的样式键，比如 <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>主题名只有作为完整的值时才会被解析。<code>border: "1px solid primary"</code> 不会被解析。</li>
        <li>不带 <code>@</code> 的 screen 值会变成 <code>@media &lt;value&gt;</code>。以 <code>@</code> 开头的值按原样使用，例如 <code>"@container (min-width: 400px)"</code>。</li>
        <li>screen 只存在于用 <code>createCss()</code> 创建的实例上。全局 <code>css()</code> 没有 screen，但接受 <code>@media</code> 键。</li>
        <li>所有实例和全局辅助函数共享同一张样式表。screen 的媒体规则按 screen 声明的顺序输出，而不是你使用它们的顺序，所以 <code>min-width</code> 的 screen 要从小到大列出。每个应用只用一个 <code>createCss()</code> 实例，这样顺序就是你主题里的顺序。</li>
        <li>结果上的 <code>theme</code> 就是你传入的主题。</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>构建一个函数，根据一组选项（比如按钮的 intent 和 size）返回样式。</p>
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
        <li>样式按此顺序合并：<code>base</code>，每个分组被选中的值，然后是每个匹配的 compound。同一属性以后面的样式为准。</li>
        <li>缺失、<code>undefined</code> 或 <code>null</code> 的选项使用默认值。没有默认值的分组会被跳过。</li>
        <li>只有 <code>true</code> 和 <code>false</code> 键的分组接受布尔值。</li>
        <li>当 compound 列出的每个分组都匹配时（包括默认值）才会应用。</li>
        <li>每种选择只构建一次并缓存。</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() 与 globalStyle()",
        content: `
      <p><code>keyframes()</code> 注册一个动画并返回生成的名字。帧的键是 <code>from</code>、<code>to</code> 和百分比，比如 <code>"50%"</code> 或 <code>"0%, 100%"</code>。帧只接受平铺属性。相同的帧返回相同的名字。</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> 为任意选择器添加一条规则：</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>选择器按原样使用。</li>
        <li>只支持平铺属性。伪类键、screen 和 <code>@</code> 键会被忽略，所以 <code>globalStyle()</code> 无法写出媒体规则。</li>
        <li>同一条规则只添加一次。同一选择器的不同样式会添加第二条规则，以后面的规则为准。</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() 与 resetStyles()",
        content: `
      <p><code>getCssText()</code> 返回本进程中 <code>css()</code>、<code>cx()</code>、<code>variants()</code>、<code>keyframes()</code> 和 <code>globalStyle()</code> 创建的所有规则：先是基础规则，然后是 <code>@media</code>、<code>@container</code> 和 <code>@supports</code> 块。用于服务端渲染。</p>
      <ul>
        <li>在 <code>renderToString()</code> 之后调用。渲染期间创建的规则也会包含在内。</li>
        <li>它覆盖整个进程，而不是某一页或某一次请求，并且只会增长。这是安全的，因为类名是内容哈希。</li>
        <li>把它放进 <code>&lt;style id="nuclo-styles"&gt;</code>。客户端会复用这个元素并跳过其中已有的规则。换成别的 id 或不带 id，客户端会再添加一张包含所有规则的样式表。</li>
        <li>文本未经转义，所以绝不要把不可信的输入放进样式值。</li>
      </ul>
      <p><code>resetStyles()</code> 是测试辅助函数。它移除所有规则和 <code>#nuclo-styles</code> 元素。之前创建的样式保留类名，但失去 CSS。不要在应用或服务端调用它。</p>
      ${code("setup.test.ts", `
import { resetStyles } from 'nuclo'

beforeEach(() => resetStyles())
`)}
    `,
      },
    ],
  },

  // ── Routing ──────────────────────────────────────────────────────────────
  {
    title: "路由",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>独立包：</strong><code>nuclo-router</code> 不属于 Nuclo 核心包。请与 <code>nuclo</code> 一起安装。它目前是预览版，API 仍可能变动。</div>
      <p>Nuclo 的路由方案：服务端渲染、水合、代码分割的路由和空闲预加载，构建在 <code>list()</code> 和 <code>update()</code> 之上。gzip 后约 ${NUCLO_ROUTER_GZIP_KB} KB，除 Nuclo 本身外没有任何依赖，也没有副作用，所以未使用时会被 tree-shake 掉。</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>也可以用 <code>pnpm add</code>、<code>yarn add</code> 或 <code>bun add</code> 安装同样的两个包。它需要 <code>nuclo</code> 0.3 或更高版本作为 peer dependency。</p>
      <p>路由器决定加载<em>什么</em>。应用通过 <code>router.outlet()</code> 说明放在<em>哪里</em>：一个遍历整个图层栈的 <code>list()</code>，每个图层一行，所以普通页面就是单独一行。服务端和客户端构建同一棵树，因此 <code>hydrate()</code> 会接管服务端的节点而不是替换它们。其余的就是 <code>history</code>、一个委托的 <code>click</code> 监听器和 <code>requestIdleCallback</code>。</p>
      <h3>一次导入</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> 在返回前解析匹配路由的模块，所以服务端和客户端的第一棵树都是完整的。之后，路由器的成员会转发到它启动的那个 Route：<code>router.path</code>、<code>router.pending</code>、<code>router.go()</code>。</p>
      <h3>一个完整的应用</h3>
      ${code("routes.ts", `
// isomorphic: imported by the browser and the server
import { createRouter } from 'nuclo-router'

export const router = createRouter({
  '/':           () => import('./pages/Home.ts'),
  '/docs':       () => import('./pages/Docs.ts'),
  '/blog/:slug': () => import('./pages/Post.ts'),
  '*':           () => import('./pages/NotFound.ts'),
})

export const App = () =>
  div(
    header(a({ href: router.href('/') }, 'Home'), a({ href: router.href('/docs') }, 'Docs')),
    main(
      when(() => router.pending, Spinner()),
      when(() => router.error !== null, ErrorView()),
      router.outlet(),   // where the pages land
    ),
    footer('© nuclo'),
  )
`)}
      ${code("pages/Post.ts", `
import type { RouteContext } from 'nuclo-router'
import { router } from '../routes.ts'

// A page is plain content
export default function Post(ctx: RouteContext) {
  // A query-only change keeps the page, so the query is read live.
  return article(h1(ctx.params.slug), p(() => (router.search.has('preview') ? 'draft' : '')))
}
`)}
      ${code("main.ts", `
import 'nuclo'
import { router, App } from './routes.ts'

await router.start()
hydrate(App, document.getElementById('app')!)   // or render() without SSR
`)}
      ${code("server.ts", `
import 'nuclo/polyfill'
import 'nuclo'
import { renderToString } from 'nuclo/ssr'
import { router, App } from './routes.ts'

// one Route per request
const route = await router.start(request.url)
const html = route.run(() => renderToString(App))
`)}
      <p>这就是全部的集成工作。链接之所以能用，是因为 <code>&lt;a href&gt;</code> 就是普通的 <code>&lt;a href&gt;</code>。<code>document</code> 上的一个委托监听器拦截由路由器处理的链接，其他链接全部交给浏览器。</p>
      <p>在服务端，<code>start()</code> 为每个请求返回一个 <code>Route</code>，不触碰路由器本身，所以并发请求看不到彼此的路由。<code>route.run()</code> 让这个 Route 在整个渲染期间成为路由器（也就是 outlet）读取的那一个。在浏览器中，每次页面加载只有一个 Route，<code>start()</code> 会把它设为路由器自己的，不需要 <code>run()</code>。</p>
      <p>页面以 <code>(ctx, { layer, data, outlet, beforeLeave })</code> 的形式接收它的 <a href="#router-api"><code>RouteContext</code></a> 和 <a href="#router-api"><code>PageProps</code></a>，可以只接收更少的参数。它返回 <code>list()</code> 接受的任何内容。若还要填充布局的其他部分，在页面内部返回一个 <code>into()</code>，比如 <code>div(article(…), into('sidebar', nav(…)))</code>。这些内容随页面一起离开。见<a href="#router-regions">页面与区域</a>。</p>
    `,
      },
      {
        id: "router-patterns",
        title: "模式与嵌套路由",
        content: `
      <table>
        <thead><tr><th>模式</th><th>匹配</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>、<code>/docs/intro</code></td><td>精确匹配该路径</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>所有未匹配的内容，即你的 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>优先级依次为：静态模式，然后按声明顺序的动态模式，最后是前缀最长者优先的 catch-all。所以 <code>'*'</code> 只匹配其他模式都不匹配的内容，可以放在路由表的任何位置。末尾斜杠、重复斜杠和百分号编码都会被规范化，参数值到达时已经解码。匹配是对每个模式做逐段比较，不构建也不运行任何正则。</p>
      <h3>相对路由</h3>
      <p>以 <code>./</code> 书写的模式相对于声明它的父级；以 <code>./</code> 书写的 href 相对于当前活动路由。两者结合，就得到一个在任何父级下含义都相同的可复用分区。路由表的值要么是加载器，要么是另一张表，后者的键相对于它自身：</p>
      ${code("records/routes.ts", `
import type { RouteTable } from 'nuclo-router'

// a section, with no idea where it lives
export const recordSection: RouteTable = {
  '/':             () => import('./Record.ts'),   // the parent path itself
  './preview':     () => import('./Preview.ts'),
  './preview/raw': () => import('./Raw.ts'),
}
`)}
      ${code("routes.ts", `
// declare it wherever it belongs
createRouter({
  '/': () => import('./pages/Home.ts'),
  '/invoices/:id':  recordSection,
  '/customers/:id': recordSection,
  '*': () => import('./pages/NotFound.ts'),
})
`)}
      <p>这两行产出全部六个模式，没有一条路径写两遍。两个父级拿到的是同一批加载器对象，所以它们共享一份模块缓存和一次 <code>import()</code>。</p>
      <ul>
        <li>在子表内部，<code>'./x'</code>、<code>'/x'</code> 和 <code>'x'</code> 含义相同，<code>'/'</code> 表示父级路径本身，<code>'*rest'</code> 给该分区自己的 catch-all。嵌套深度不限。</li>
        <li>顶层键按原样使用，所以 <code>'*'</code> 仍然是 <code>'*'</code>。</li>
        <li>在 <code>*catch-all</code> 父级之下放子级会导致 <code>createRouter()</code> 报错，因为 catch-all 必须结束它的模式。</li>
      </ul>
      <h3>父页面与 <code>outlet()</code></h3>
      <p>父级和它的子级是真正的层级关系。父级渲染，子级在父级调用 <code>outlet()</code> 的位置渲染在它内部：</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>在子级之间导航不会重建父级。它的 DOM 节点还是同一个节点，所以焦点、滚动位置、输入了一半的内容以及闭包里的任何状态都会保留。</p>
      <ul>
        <li>没有子路由的页面，其 outlet 不渲染任何内容，所以布局可以无条件调用它。有子级却不调用 <code>outlet()</code> 的父级不会显示子级内容。</li>
        <li>没有索引路由。<code>'/'</code> 就是布局本身，所以父级路径渲染的是带空 outlet 的布局，而不是布局内嵌一个独立的索引页。把默认页面内容放进布局，或者给它一个真实的子路径。</li>
      </ul>
      <p>于是同一个调用在任一父级下都能工作，在不知道自己处于哪个父级下的页面中也能工作：</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>、<code>../x</code>、<code>.</code> 和 <code>..</code> 相对于当前路由的路径解析，而不是 URL 的"目录"。从 <code>/invoices/42</code> 出发，<code>./preview</code> 是 <code>/invoices/42/preview</code>，而浏览器会得出 <code>/invoices/preview</code>；URL 末尾的斜杠不改变任何结果。<code>../</code> 向上走一段，到根为止。查询串和哈希会被带上，<code>base</code> 会被重新加上，解析后的绝对路径才是写入 history 的内容。这与 React Router 为 <code>&lt;Link to="./x"&gt;</code> 所做的、对 URL 解析规则的偏离是一样的。</p>
      <ul>
        <li>只有 <code>./</code> 和 <code>../</code> 是路由相对的。href 中的裸 <code>preview</code> 交给普通的浏览器规则。</li>
        <li>用 <code>router.href('./preview')</code> 构建相对链接，而不是手写 <code>href="./preview"</code>。<code>href()</code> 在渲染时解析，所以输出的标记是绝对路径，对爬虫、中键点击和禁用 JavaScript 的情况依然正确。</li>
      </ul>
      <h3>什么被保留，什么被重建</h3>
      <table>
        <thead><tr><th>节点</th><th>导航时</th></tr></thead>
        <tbody>
          <tr><td>模式和路径都未变的父级</td><td><strong>保留</strong>：同一个节点，且它的 <code>load()</code> 不会重新运行</td></tr>
          <tr><td>匹配到的页面</td><td>当模式和路径未变且没有 <code>load()</code> 时<strong>保留</strong>，所以查询串或哈希的变化会保留它。带加载器的路由每次访问都会刷新。</td></tr>
          <tr><td>路径变化的父级</td><td>重建，连同它下面的一切</td></tr>
          <tr><td>推入的图层</td><td>只渲染匹配到的页面。它的父级已经挂载在下面那一行中。</td></tr>
        </tbody>
      </table>
      <p>被保留的页面保留它构建时的 <code>ctx</code>。这就是 <code>ctx</code> 在各处的含义：实时值请读 <code>router.*</code>。由查询串驱动的状态（如筛选、分页和选项卡）在动态值中读 <code>router.search</code>，用 <code>router.go('?page=2', { replace: true })</code> 写入。页面、它的焦点和输入了一半的内容都保持原地不动。</p>
    `,
      },
      {
        id: "router-regions",
        title: "页面与区域",
        content: `
      <p><code>router.outlet()</code> 把页面放在一个位置。如果页面还需要在布局的其他地方放侧栏、工具栏或标题，用 <a href="#api-region"><code>into()</code></a> 来填充。布局用 <code>region()</code> 标记位置，页面在自己的内容旁边返回一个 <code>into()</code>。布局永远不会以 prop 的形式接收页面内容，导航也永远不会重建它。</p>
      ${code("app.ts", `
export const App = () =>
  div(
    aside(
      input({ placeholder: 'Filter' }),   // keeps its text across navigations
      region({ id: 'sidebar', empty: p('Nothing to show.') }),
    ),
    main(router.outlet()),
  )
`)}
      ${code("pages/Post.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return div(
    article(h1(post.title), p(post.body)),
    into('sidebar', nav(h2('In this post'), ul(list(() => post.headings, (h) => li(h))))),
  )
}
`)}
      <p>页面的内容是 outlet 那个 <code>list()</code> 的一行，而 <code>into()</code> 与承载它的那一行具有相同的生命周期。所以侧栏内容随页面到来，也随页面离开：导航到一个没有 <code>into('sidebar', …)</code> 的页面时，区域会重新显示它的 <code>empty</code> 内容。页面可以在两部分中同时使用它的 <code>ctx</code> 和 <code>data</code>，因为两者由同一个函数构建。</p>
      <h3>导航时会发生什么</h3>
      <ul>
        <li><strong>被保留的页面保留它的区域。</strong><a href="#router-patterns">保留页面</a>的查询串或哈希变化同样不会触碰区域内容。如果侧栏依赖它，请在动态值中读 <code>router.search</code>。</li>
        <li><strong>被重建的页面重新填充区域。</strong>路由变化时，旧行被移除，新页面的 <code>into()</code> 视图接管。不会有任何残留。</li>
        <li><strong>推入的图层添加一个视图。</strong>图层是 outlet 中较后的一行，所以它的 <code>into()</code> 是同一区域的更新视图。默认 <code>type: 'latest'</code> 下，它会覆盖页面的视图直到图层关闭，之后页面的视图重新显示。<code>type: 'stack'</code> 下两者同时显示。</li>
        <li><strong>父页面也可以填充区域。</strong>它的视图在子级变化时保持不变，因为父级不会被重建。</li>
        <li><strong>服务端渲染原样可用。</strong>服务端在 <code>route.run()</code> 内构建页面，所以它的 <code>into()</code> 视图就在 HTML 中，<code>hydrate()</code> 会接管它们。</li>
      </ul>
      <h3>一个页面填充多个区域</h3>
      <p>传一个对象即可同时填充多个区域。页面的主内容仍然经由 outlet，所以把它放在 <code>into()</code> 旁边返回：</p>
      ${code("pages/Report.ts", `
export default function Report(ctx: RouteContext) {
  return div(
    table(…),
    into({
      toolbar: [button('Export'), button('Print')],
      sidebar: nav(a({ href: router.href('./summary') }, 'Summary')),
    }),
  )
}
`)}
      <h3>各工具的适用场景</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> 用于子路由：由 URL 决定、渲染在父页面内部的内容。见<a href="#router-patterns">嵌套路由</a>。</li>
        <li><strong><code>into()</code></strong> 用于让匹配到的页面把自己铺到布局的各处。内容属于页面，使用页面的数据。</li>
        <li><strong><code>matches()</code></strong> 用于布局仅凭 URL 自行决定，使用它自己的小路由表，不涉及任何页面。见 <a href="#router-matches"><code>matches()</code></a>。</li>
      </ul>
      <p>这些都属于唯一匹配到的那条路由。路由器不会用一个 URL 驱动两个独立区域，所以带有自己路由的侧栏是页面填充的一个区域，而不是第二个 outlet。真正想要自己的路由器、加载和回退的侧栏，可以保留一个未启动的路由器并用 <code>match()</code> 解析——见<a href="#router-multi">多路由器与组合加载</a>。</p>
    `,
      },
      {
        id: "router-loaders",
        title: "路由加载器与代码分割",
        content: `
      <p>页面模块可以导出一个 <code>load</code> 函数。它在页面构建之前运行，每次导航到该路由都会运行，返回的任何内容都会作为 <code>data</code> 交给页面：</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>路由表不变。加载器随页面一起走。它拿到匹配的 <code>RouteContext</code>，所以 <code>params</code>、<code>search</code> 和 <code>path</code> 都可用。它可以是同步或异步的，也会在服务端运行，所以服务端渲染的页面带着数据一起出现在 HTML 中，而不是在水合之后再去获取。</p>
      <p><strong>模块会被缓存，数据不会。</strong>路由的 chunk 只获取一次并复用，而它的加载器每次导航都会再次运行。这就是 <code>/blog/a</code> 和 <code>/blog/b</code> 不会混淆的原因，也是失败的加载器可以直接重试的原因。</p>
      <table>
        <thead><tr><th>情形</th><th>行为</th></tr></thead>
        <tbody>
          <tr><td>运行期间</td><td><code>router.pending</code> 为 true，当前所在的页面保持显示</td></tr>
          <tr><td>抛出或 reject</td><td>落到 <code>router.error</code> 上。<code>go()</code> 仍然永不 reject，导航可以重试。</td></tr>
          <tr><td>在 <code>start()</code> 期间</td><td>rejection 从 <code>start()</code> 抛出。此时还没有 Route 可以承载它。</td></tr>
          <tr><td>推入的图层</td><td>运行它自己的加载器，拥有自己的数据</td></tr>
          <tr><td>空闲预加载器</td><td>只预热模块。它没有上下文可传，否则就是在为一个你可能永远不会打开的路由获取数据。</td></tr>
          <tr><td>重新导航到同一 URL</td><td>加载器再次运行，该行重建。没有加载器的路由保留它的行。</td></tr>
        </tbody>
      </table>
      <p>要重新验证数据，导航到当前所在位置且不新增 history 条目：</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>让数据与 chunk 同时开始</h3>
      <p>由页面模块导出的 <code>load</code> 只能在模块到达后才运行，所以冷导航先获取 chunk，再获取数据。要让两者同时开始，用 <code>withLoad()</code> 在路由表中声明加载器：</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>它替换模块自己的 <code>load</code>，并同样在每次访问时运行。chunk 仍在加载时发生的 rejection 和其他情况一样落到 <code>router.error</code> 上。</p>
      <p>按设计，不会把服务端数据序列化进 HTML。客户端的 <code>load</code> 在水合时会再次运行。如果这很重要，让服务端输出 <code>route.data</code>（例如作为 <code>window.__DATA__</code>），并让加载器优先读取它。<code>route.data</code> 只是匹配页面的数据，父级 <code>load()</code> 的结果不在其中。</p>
      <h3>代码分割与预加载</h3>
      <p>路由的值始终是一个返回页面组件的函数，所以组件是惰性获取的：</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>只有模块形态的写法才能携带 <code>load</code> 导出。用 <code>.then(m =&gt; m.BPage)</code> 挑选命名组件时，交给路由器的只有那个函数。</p>
      <p>每个模块只导入一次并缓存。对同一路由的并发导航共享一次 <code>import()</code>。用户让页面空闲超过 <code>idleTimeout</code>（默认一秒；没有触摸、按键、滚轮或滚动）后，其余路由会在后台加载，每个空闲时间片加载一个（<code>requestIdleCallback</code>）。任何输入，或用户正在等待的导航，都会暂停预加载，直到页面再次空闲。</p>
      <p>已预加载或同步提供的路由不会将 <code>router.pending</code> 设为 true，并且会在下一次绘制之前完成导航：不会短暂显示加载指示器，也不会发生布局抖动。<code>router.pending</code> 只在必须等待某个模块或加载器时为 true，此时离开中的页面保持在屏幕上。加载失败的 chunk 以 <code>router.error</code> 的形式呈现，绝不会成为未处理的 rejection，可以直接重试。</p>
    `,
      },
      {
        id: "router-api",
        title: "路由器 API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> 把模式映射到加载器或嵌套表。选项：</p>
      <table>
        <thead><tr><th>选项</th><th>默认值</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>应用所在的 URL 前缀，比如 <code>'/docs'</code>。只在段边界匹配：<code>/docs/intro</code> 在 <code>'/docs'</code> 之内，<code>/docsearch</code> 则不在。前缀之外的 URL 匹配不到任何内容，所以 <code>start()</code> 会 reject（即你的服务端 404），指向它们的链接交给浏览器。</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>页面空闲后在后台加载其余路由的模块。<code>false</code> 关闭它。</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>没有触摸、按键、滚轮或滚动多少毫秒后开始预加载，或在用户忙碌之后恢复预加载。</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>，在浏览器中每次导航解析完成且 DOM 跟上之后调用，包括首次导航。<code>kind</code> 为 <code>'start'</code>、<code>'push'</code>、<code>'replace'</code>、<code>'pop'</code>（后退、前进、<code>close()</code>）或 <code>'layer'</code>。这是处理 <code>document.title</code>、meta 标签、焦点、滚动和统计分析的钩子。SSR 期间绝不会被调用。</td></tr>
        </tbody>
      </table>
      <p>返回路由器：<code>start()</code>、<code>match()</code>、<code>outlet()</code>、<code>matches()</code>，以及除 <code>run()</code> 之外的所有 <code>Route</code> 成员，这些成员会转发到当前活动的 Route。活动 Route 在浏览器中是最后一次 <code>start()</code> 返回的那个，在服务端是其 <code>run()</code> 正在执行的那个。两者都没有时，读取成员会抛出错误。路由表、编译后的匹配器和模块缓存都放在路由器上，所以在服务端跨请求共享。</p>
      <h3><code>router.start(url?)</code></h3>
      <p>把 <code>url</code>（浏览器中默认为 <code>location.href</code>）解析到它的页面模块，返回 <code>Promise&lt;Route&gt;</code>。没有任何匹配且路由表没有 <code>'*'</code> 路由时 reject。在服务端，这就是你的 404。在浏览器中，它还会把这个 Route 设为路由器的活动 Route，挂上 <code>popstate</code> 和委托的 <code>click</code> 监听器，并安排预加载。第二次 <code>start()</code> 会停止上一个 Route。在服务端它不触碰任何共享状态，所以请在 <code>route.run()</code> 内渲染。</p>
      <h3><code>router.match(url?)</code></h3>
      <p>用路由表解析一个 URL，不加载任何东西：没有 import，没有 history，没有监听器，没有 Route。返回 <code>RouteContext</code>；当 URL 在 <code>base</code> 之外、不匹配任何模式，或在浏览器中属于另一个源时，返回 <code>null</code>。只接受绝对 URL，因为 <code>./</code> 解析需要一个活动路由。</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>以 <code>list()</code> 形式呈现活动路由的页面。放置一次即可，放在页面该出现的地方。推入的图层是它较后的一行。在 <code>start()</code> 解析之前和 <code>stop()</code> 之后它是空的。在服务端它渲染 <code>run()</code> 正在执行的那个 Route。</p>
      <h3><code>router.matches(table)</code></h3>
      <p>渲染第二张表中与活动路由路径匹配的视图，以 <code>list()</code> 的形式可以放在任何地方。见 <a href="#router-matches"><code>matches()</code></a>。</p>
      <h3><code>Route</code></h3>
      <p>除 <code>run()</code> 之外的每个成员也都在路由器上，应用通常从那里读取。</p>
      <table>
        <thead><tr><th>成员</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>、<code>pattern</code>、<code>params</code>、<code>search</code>、<code>hash</code>、<code>url</code></td><td>活动的匹配结果。<code>search</code> 是一个 <code>URLSearchParams</code>。<code>search</code>、<code>hash</code> 和 <code>url</code> 是实时的。</td></tr>
          <tr><td><code>pending</code></td><td>某次导航正在等待模块或加载器</td></tr>
          <tr><td><code>error</code></td><td>最近一次失败的加载，由下一次导航清除</td></tr>
          <tr><td><code>data</code></td><td>匹配页面的 <code>load()</code> 返回的内容，供服务端序列化。父级的不在其中。</td></tr>
          <tr><td><code>depth</code></td><td>栈上有多少个图层（普通页面为 1）</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>导航，需要时加载模块。永不 reject：模块失败（无论 reject 还是抛出）都落到 <code>error</code> 上。</td></tr>
          <tr><td><code>push(href)</code></td><td>把一条路由作为新图层打开在顶部，以它关闭时的值 resolve。接受 <code>./</code>。无匹配或模块失败时 reject。</td></tr>
          <tr><td><code>href(path)</code></td><td>给路径加上 <code>base</code> 前缀，用于 <code>a({ href })</code>。相对于活动路由解析 <code>./</code> 和 <code>../</code>。</td></tr>
          <tr><td><code>stop()</code></td><td>卸下所有监听器，关闭打开的图层，清空 outlet。幂等。已停止的 Route 仍返回最后一次匹配的结果，<code>go()</code> 不做任何事。</td></tr>
          <tr><td><code>run(fn)</code></td><td>以此 Route 作为路由器的活动 Route 调用 <code>fn</code> 并返回其结果：服务端上的 <code>route.run(() =&gt; renderToString(App))</code>。仅限同步。<code>fn</code> 返回后该 Route 不再是活动的。</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>页面的第一个参数：<code>path</code>、<code>pattern</code>、<code>params</code>、<code>search</code>、<code>hash</code>、<code>url</code>。这是页面构建时的上下文。实时值请读 <code>router.*</code>。只有在查询串或哈希变化而没有重建时，两者才会不同。</p>
      <p><code>params</code> 默认是 <code>{ [name]: string }</code>。页面可以用 <code>Params</code> 从自己的模式推导类型，它把 <code>'/blog/:slug'</code> 变成 <code>{ slug: string }</code>，把 <code>'/files/*rest'</code> 变成 <code>{ rest: string }</code>：</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>页面的第二个参数。按需解构。</p>
      <table>
        <thead><tr><th>属性</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>页面在栈中的位置。见下文 <code>Layer</code>。</td></tr>
          <tr><td><code>data</code></td><td>路由的 <code>load()</code> 返回的内容，没有加载器时为 <code>undefined</code>。由 <code>PageProps&lt;TData&gt;</code> 指定类型。</td></tr>
          <tr><td><code>outlet</code></td><td>父页面渲染其子路由的位置。见<a href="#router-patterns">嵌套路由</a>。</td></tr>
          <tr><td><code>beforeLeave</code></td><td>注册一个在丢弃此页面之前询问的守卫。见<a href="#router-layers">离开守卫</a>。</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>页面在栈中的位置，以及关闭该图层的方法。</p>
      <table>
        <thead><tr><th>成员</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>基础页面为 0，推入的图层从 1 起</td></tr>
          <tr><td><code>push(href)</code></td><td>从页面内部再打开一个图层，与 <code>Route.push()</code> 相同</td></tr>
          <tr><td><code>close(result?)</code></td><td>关闭此图层及其上的所有图层，resolve 打开它的那个 <code>push()</code>。不带参数表示取消。在 depth 0 时无操作。</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> 与 <code>withLoad()</code></h3>
      <p><code>DataLoader</code> 是 <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>，即页面模块可选的 <code>load</code> 导出。<code>withLoad(loader, load)</code> 创建一条路由，其 <code>load</code> 与 chunk 的 import 同时开始，而不是在其之后。见<a href="#router-loaders">路由加载器</a>。</p>
      <h3>类型</h3>
      <p>所有类型均由 <code>nuclo-router</code> 具名导出，因此可以直接从包入口导入，为页面、加载器或守卫标注类型。</p>
      <table>
        <thead><tr><th>类型</th><th>含义</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>某个模式的 params 对象。<code>RouteParams</code> 是无类型的形状，<code>Match</code> 是匹配器的结果。</td></tr>
          <tr><td><code>PageComponent</code></td><td>一个页面：<code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>一个页面模块：组件本身，或 <code>import()</code> 产出的 <code>{ default, load? }</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>，可选地携带来自 <code>withLoad()</code> 的 <code>load</code></td></tr>
          <tr><td><code>RouteTable</code></td><td><code>createRouter()</code> 接受的表：模式到加载器，或到嵌套表</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>，<code>go()</code> 的第二个参数</td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>，<code>onNavigate</code> 的第二个参数</td></tr>
          <tr><td><code>Outlet</code></td><td><code>PageProps</code> 中 <code>outlet()</code> 的类型</td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>，<code>beforeLeave()</code> 接受的类型</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code> 视图的类型：输入 params，输出内容或页面的 <code>import()</code></td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "图层与离开守卫",
        content: `
      <p><code>push()</code> 把一条路由打开在当前路由之上而不是替换它，并以该图层关闭时的值 resolve。因为页面是遍历整个栈的单个 <code>list()</code>，打开图层就是一次追加。下面的页面不会被重新渲染，所以图层关闭时它的 DOM、焦点和填了一半的表单都还在。</p>
      <p>这让"我需要一条还不存在的记录"这类流程得以实现，而不必丢掉用户正在填写的表单：</p>
      ${code("pages/Edit.ts", `
// the page underneath
const created = await layer.push<Option>('/options/new')
if (created) { options.push(created); selected = created.id; update() }
`)}
      ${code("pages/NewOption.ts", `
// the pushed page: (ctx, { layer })
layer.close(created)   // resolves the push() above with the new option
layer.close()          // dismissed: resolves with undefined
`)}
      <p>图层可以嵌套。需要再弹一个对话框的对话框调用 <code>layer.push()</code> 并 await 它，无需引用 Route。</p>
      <ul>
        <li><strong>URL 就是顶层图层。</strong><code>push()</code> 添加一条 history 条目，所以图层可以被链接，后退会关闭它，并把它的 <code>push()</code> 以取消的方式 resolve，和点击取消完全一样。后退和 <code>close()</code> 是同一条代码路径：<code>close()</code> 记录结果并把 history 往回走，<code>history.state</code> 中的深度是权威来源。浏览器每个标签页大约保留 50 条条目，所以在图层间走了很长一段之后，下面那条条目可能已经不在：此时 <code>close()</code> 就地关闭图层，并把当前条目重写为留下显示的那个页面。</li>
        <li><strong>普通导航会清空栈。</strong>链接点击或 <code>go()</code> 不是图层。它替换一切并关闭所有打开的图层，所以没有调用方会一直 await 下去。</li>
        <li><strong>冷加载是独立页面。</strong>URL 只指明顶层图层，不指明它下面的栈，所以直接打开某个图层的 URL 会以 depth 1 渲染它，此时 <code>layer.depth === 0</code>，<code>close()</code> 不起作用。被推入的路由必须能独立成立。根据 <code>layer.depth</code> 分支，提供一个离开的链接，而不是一个失效的取消按钮。</li>
        <li><strong>Promise 不会在页面重新加载后保留</strong>，因为它存在于闭包中。通过返回结果可以简化交互流程，但流程也应支持直接访问页面的情况。</li>
        <li><strong>不会有任何悬而未决的 await。</strong><code>stop()</code> 关闭所有打开的图层，被导航抛弃的图层以 <code>undefined</code> resolve。</li>
      </ul>
      <h3>离开守卫</h3>
      <p>持有值得保留的内容（比如填了一半的表单）的页面可以注册一个守卫。在页面被丢弃之前会询问它，返回 <code>false</code>（或 resolve 为 false 的 promise）会保留页面：</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>只在页面离开时。</strong>布局下的子级导航，或保留页面的查询串、哈希变化，都不会询问。守卫的生命周期与页面一致，所以没有什么需要注销。</li>
        <li><strong>覆盖所有离开页面的方式。</strong>链接、<code>go()</code>、后退与前进、图层的 <code>close()</code>，以及 <code>go()</code> 到路由器不拥有的 URL（离开应用，此时 <code>to</code> 为 <code>null</code>）。被守卫阻止的后退或前进会被撤销，所以地址栏停留在当前页面。关闭标签页或重新加载是 <code>beforeunload</code> 的工作。</li>
        <li><strong><code>to</code></strong> 是导航要前往的 <code>RouteContext</code>。守卫从最内层开始运行，在第一个拒绝处停止。抛出异常的守卫会保留页面。<code>close(result)</code> 同样经过守卫，所以带结果关闭之前先清掉你的标记。</li>
        <li>路由器只能走回它自己写入的 history 条目。后退或前进到它没有写入的条目（比如原生 <code>#fragment</code> 链接或其他脚本的 <code>pushState</code>）时不会询问。</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() 与子路由器",
        content: `
      <p><code>router.outlet()</code> 渲染页面。<code>router.matches(table)</code> 根据它自己的一张小表，渲染其他依赖当前位置的内容，比如侧栏、面包屑或工具栏，不加载路由也不添加页面：</p>
      ${code("app.ts", `
div(
  aside(
    router.matches({
      '/':           () => nav('Home links'),
      '/blog/new':   () => nav('Drafting tips'),
      '/blog/:slug': ({ slug }) => nav(\`More like \${slug}\`),
      '*':           () => import('./Sidebar.ts'),   // code-split, rendered once loaded
    }),
  ),
  main(router.outlet()),
)
`)}
      <ul>
        <li><strong>与路由表相同的匹配规则。</strong>模式、优先级、原始路径匹配和 <code>base</code> 剥离都是路由器自己的，所以视图和页面对 URL 的理解始终一致。它读取顶层图层的路径，和 <code>router.path</code> 一样。</li>
        <li><strong>视图</strong>是 <code>(params, ctx) =&gt; content</code>，其中 <code>params</code> 的类型由模式推导，<code>ctx</code> 是带有该视图 <code>pattern</code> 和 <code>params</code> 的 <code>RouteContext</code>。它也可以返回页面模块的 <code>import()</code>，模块到达后会以 <code>ctx</code> 调用。</li>
        <li><strong>没有匹配就不渲染。</strong>添加一个 <code>'*'</code> 视图作为回退。它在 <code>start()</code> 之前和 <code>stop()</code> 之后是空的，和 outlet 一样。</li>
        <li><strong>只在路由变化时重新渲染</strong>，所以凡是保留页面的情况，视图也保留它的 DOM。</li>
        <li><strong>惰性视图在模块到达前不渲染任何内容。</strong>失败的 <code>import()</code> 用 <code>console.error</code> 记录，不会设置 <code>router.error</code>，并在下一次导航时重试。单纯的 <code>update()</code> 不会重试。</li>
        <li><strong>在服务端</strong>惰性视图不输出任何内容，因为它的模块在客户端到达。首屏 HTML 必须包含的内容请使用同步视图。</li>
      </ul>
      <h3>子路由器</h3>
      <p>路由可以嵌套，所以子路由器通常就是一张嵌套表。只有一个路由器：分区自己的 <code>'/'</code> 页面是它的外壳，它的子级渲染在该页面的 <code>outlet()</code> 中，所以在分区内部导航时外壳保持不变：</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>或者给这个功能一个自己的路由器，只创建、永不启动。父级持有单独一条 catch-all，子级用自己的模式、params 和回退解析剩余部分：</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>永不启动正是关键。<code>start()</code> 才会挂上监听器，两个已启动的路由器会冲突。代价是解析由子级负责，所以本该由已启动路由器运行的路由加载器需要你自己调用。这种形态在尾部变化时也会重建外壳，因为路由器只看到一条路由，其余部分由外壳自己解析。嵌套表才能让路由器保持父级挂载，所以除非该功能确实需要自己的路由器、base 和回退，否则优先用嵌套表。</p>
    `,
      },
      {
        id: "router-multi",
        title: "多路由器与组合加载",
        content: `
      <p>应用有多少个区域，就可以有多少个路由器。让这一切保持简单的规则是：<strong>每个 document 只启动一个</strong>，其余路由器一律不启动，用 <code>match()</code> 解析 URL。只有已启动的路由器拥有 URL、history 和点击监听器。其余的只是供你查询的表——而且每个区域可以按自己的节奏加载，显示自己的加载指示器。</p>
      <h3>组合加载：一串加载器</h3>
      <p>匹配链上的每个页面都可以导出 <code>load()</code>。冷导航到子路由时，布局的加载器和页面的加载器<strong>并行</strong>运行，一个 <code>router.pending</code> 覆盖整条链：前一个页面保持在屏幕上直到两者都 resolve，所以半加载的树永远不会被绘制出来。每个组件接收它自己的 <code>data</code>：</p>
      ${code("routes.ts", `
'/shop': {
  '/':          () => import('./pages/Shop.ts'),    // layout, has a load()
  './:section': () => import('./pages/Section.ts'), // page, has a load()
},
`)}
      ${code("pages/Shop.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<ShopData> = async () => {
  await wait(500)                              // a slow API
  return { sections: ['toys', 'books', 'music'] }
}

// the layout gets its own data, and its outlet for the child page
export default function Shop(_ctx: RouteContext, { data, outlet }: PageProps<ShopData>) {
  return div(
    h1('Shop'),
    nav(...data.sections.map((s) => a({ href: router.href(\`/shop/\${s}\`) }, s))),
    main(outlet()),
  )
}
`)}
      ${code("pages/Section.ts", `
export const load: DataLoader<SectionData> = async (ctx) => {
  await wait(900)                              // slower than the layout's
  return { section: ctx.params.section, items: catalog[ctx.params.section] }
}

// the page gets its own data: the two loaders ran beside each other
export default function Section(_ctx: RouteContext, { data }: PageProps<SectionData>) {
  return article(h2(data.section), ul(...data.items.map((i) => li(i))))
}
`)}
      <p>两个加载器同时开始，而不是一个接一个。任一加载器仍在等待时 <code>router.pending</code> 为 true，其余时间为 false——已预加载或同步提供的路由不会将它设为 true。在 section 之间移动会保留布局，所以只有 section 的加载器再次运行；布局的数据、它的 DOM 和输入了一半的内容都会保留。重新导航到同一 URL 会重新运行叶子的加载器并重建它的行，和单页面时完全一样。</p>
      <h3>多重加载：有独立加载指示器的第二个路由器</h3>
      <p>一个独立区域——侧栏、托盘、实时区域——拥有自己的路由器（只创建、永不启动）和自己的加载标记。<code>router.pending</code> 属于已启动的路由器，与这个区域无关，所以两者可以并排加载，谁先完成都可以：</p>
      ${code("sidebar.ts", `
import { createRouter } from 'nuclo-router'

// Created but never started: start() is what attaches the history and click
// listeners, and only the main router is started. match() attaches nothing.
const standIn = () => ({ default: () => div() })   // never rendered

const sidebarRouter = createRouter({
  '/shop':          standIn,
  '/shop/:section': standIn,
  '*':              standIn,
}, { base: '/docs' })              // the same base as the main router

export const sidebar = { loading: false, info: null as SidebarInfo | null }

export async function refreshSidebar(at: string) {
  const hit = sidebarRouter.match(at)          // the second router resolves
  if (!hit || (hit.pattern !== '/shop' && hit.pattern !== '/shop/:section')) {
    sidebar.info = null; update(); return
  }
  sidebar.loading = true                       // its own flag, its own spinner
  sidebar.info = null; update()
  const data = await fetchSidebar(hit.params.section)
  sidebar.loading = false; sidebar.info = data
  update()
}
`)}
      ${code("routes.ts", `
createRouter(routes, {
  onNavigate: (ctx, kind) => {
    announce(kind)
    refreshSidebar(ctx.url)   // every navigation re-resolves the sidebar
  },
})
`)}
      <p>第二个路由器只负责匹配，不执行导航：<code>match()</code> 读取 URL 并返回一个上下文，关于侧栏的任何东西都不会进入主路由表。<code>onNavigate</code> 在每次导航解析完成后运行，包括首次导航，所以它是让独立区域与 URL 保持同步的唯一位置。</p>
      <ul>
        <li><strong><code>pending</code> 属于已启动的路由器。</strong>从未启动的路由器没有 Route，没有 <code>pending</code>，也没有 <code>error</code>。区域维护自己的标记，第二个加载指示器可以与第一个并排显示。在演示中，侧栏加载 800ms，而路由的加载器运行 900ms，所以页面可能先于侧栏完成，也可能反过来。</li>
        <li><strong><code>match()</code> 不挂任何东西。</strong>任意数量的未启动路由器可以共存于同一 document；每个都有自己的表、base 和模块缓存，没有一个会触碰 history。它们的开销只是一张表和一个匹配器。</li>
        <li><strong>它的加载器永远不会运行。</strong>已启动的路由器运行它匹配到的页面的 <code>load()</code>。从未启动的路由器只做解析，所以如果它的视图需要数据，请自己获取——就像演示中的 <code>refreshSidebar()</code>。如果你想要加载器，<a href="#router-matches">嵌套表</a>或<a href="#router-regions">由页面填充的区域</a>可以把这项工作留给已启动的路由器。</li>
        <li><strong>防范过期的响应。</strong>缓慢的侧栏请求不能落到你已经离开的 section 上。每次刷新递增一个请求序号计数器，丢弃不再匹配的响应，就像路由器会取消被后续导航取代的旧导航一样。</li>
        <li><strong>惰性的 <code>matches()</code> 视图同样没有 <code>pending</code>。</strong>模块到达之前它不渲染任何内容。三套加载系统，三个独立的时钟：路由的 <code>pending</code>、你自己的标记，以及一个还不存在的惰性视图。</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "链接处理",
        content: `
      <p>委托监听器会处理 <code>&lt;a href&gt;</code> 上的左键点击（包括 SVG 的 <code>&lt;a&gt;</code> 和嵌套在其中任何元素上的点击）并导航，其余情况一律让路：带修饰键的点击和中键点击、非 <code>_self</code> 的 <code>target</code>、<code>download</code>、<code>rel="external"</code>、跨源的 href、当前页面上仅含哈希的链接、<code>base</code> 之外的路径、没有路由匹配的路径（所以服务端渲染的 404 仍然可达），以及应用处理器已经调用过 <code>preventDefault()</code> 的任何事件。用 <code>data-nuclo-router="off"</code> 可以显式让某个链接退出。</p>
      <h3>滚动</h3>
      <p>push 式导航保留当前滚动位置。当新 URL 带有与页面上某个元素匹配的 <code>#hash</code> 时，该元素会被滚动到可见区域。<code>popstate</code> 把滚动交给浏览器。要让新页面落在顶部，在 <code>onNavigate</code> 中处理，它会告诉你导航是如何发生的：</p>
      ${code("routes.ts", `
let shown = ''
createRouter(routes, {
  onNavigate: (ctx, kind) => {
    // Not on Back/Forward (the browser restores those), nor for a query change on the same page.
    if (kind === 'push' && ctx.path !== shown && !ctx.hash) window.scrollTo(0, 0)
    shown = ctx.path
  },
})
`)}
      <h3>说明</h3>
      <ul>
        <li><strong>不保留任何东西。</strong>Route 持有页面函数和它的上下文，从不持有 DOM。导航离开会释放前一个页面。<code>stop()</code> 释放监听器和进行中的加载，并清除 <code>pending</code>，所以已停止的 Route 不会留下持续显示的加载指示器。在 <code>stop()</code> 之后才 resolve 的模块会被静默丢弃。</li>
        <li><strong>服务端并发安全。</strong><code>start()</code> 返回按请求隔离的状态，<code>run()</code> 把它限定在一次同步渲染内，所以交错的请求看不到彼此的路由。只有模块缓存是共享的。作用域在 <code>run()</code> 的函数返回时结束。<code>renderToString()</code> 是同步的，所以这已经足够。异步或流式渲染需要在 <code>await</code> 之间携带 Route，而 <code>run()</code> 不会这么做。</li>
        <li><strong><code>popstate</code> 时的滚动恢复</strong>由浏览器负责（<code>scrollRestoration</code>），而不是路由器。</li>
        <li><strong>每个 document 只启动一个路由器。</strong>每次 <code>start()</code> 都会添加它自己的委托 <code>click</code> 监听器，而第二个路由器的 <code>start()</code> 不会停止第一个。只有同一路由器上的第二次 <code>start()</code> 才会。要用另一张表解析 URL，创建一个路由器并只调用 <code>match()</code>，它不挂任何东西。独立区域可以用这种方式在路由的 <code>pending</code> 之外运行自己的加载。见<a href="#router-multi">多路由器与组合加载</a>。</li>
        <li><strong>按设计不包含：</strong>哈希和内存 history，因为路由存在于 pathname 中，服务端必须能服务每条路由；由一个 URL 驱动的两个独立路由区域，因为页面可以用 <code>into()</code> 填充多个区域，但它们都属于唯一匹配到的那条路由——独立区域仍然可以保留自己的未启动路由器和加载，如<a href="#router-multi">多路由器与组合加载</a>所述；以及悬停预加载，你可以在 <code>mouseenter</code> 中调用该路由自己的加载器来实现。</li>
      </ul>
      <h3>示例</h3>
      <p>仓库中有两个可运行的示例互为补充，所以每项设置都能在某处观察到：</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>：对整个 API 的客户端巡览。每种模式写法和优先级规则、链接处理的退出方式、带实时控件的每个 Route 成员、一个子路由器、三层深的图层栈、挂载在两个父级下的相对分区，以及带 <code>pending</code> 和 <code>error</code> 的路由加载器。设置了 <code>preload: false</code>，以便这些状态保持可见。</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>：每个请求一次 <code>renderToString()</code>、可验证地接管服务端节点的水合、真实的 404 状态码、非根 <code>base</code>、可以在网络面板中观察的空闲预加载，以及一个把数据从服务端交给客户端、让水合不再重新获取的加载器。</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "模式",
    sections: [
      {
        id: "computed",
        title: "计算值",
        content: `
      <p>Nuclo 没有计算值 API。使用普通函数，并在动态值中调用它：</p>
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
        title: "异步与加载",
        content: `
      <p>使用普通的 <code>async</code>/<code>await</code>，并在状态每次变化时调用 <code>update()</code>。对于一次 fetch，这意味着 <code>await</code> 之前调用一次，之后再调用一次：</p>
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
        title: "最佳实践",
        content: `
      <ul>
        <li><strong>批量修改。</strong>先改完所有需要的状态，再调用一次 <code>update()</code>。</li>
        <li><strong>确保动态值计算高效且无副作用。</strong>每次 <code>update()</code> 都会运行它们全部。</li>
        <li><strong>使用 <code>scope()</code></strong> 处理小而频繁的更新，比如输入或定时器。</li>
        <li><strong>渲染到 document 中。</strong><code>update()</code> 运行时不在 document 中的节点会停止更新。</li>
        <li><strong>使用 <code>when()</code> 和 <code>list()</code></strong> 处理会变化的子节点，而不是返回节点的函数。</li>
        <li><strong>使用 <code>className</code>，而不是 <code>class</code></strong>，动态类使用 <code>() =&gt; cx(...)</code> 或 <code>{ className: () =&gt; … }</code>。</li>
        <li><strong>在模块级别定义样式</strong>，只定义一次。</li>
        <li><strong>服务端渲染：</strong>先渲染，再把 <code>getCssText()</code> 放进 <code>&lt;style id="nuclo-styles"&gt;</code>。请求数据以参数形式传入，并保留输出中的 HTML 注释。</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "参考",
    sections: [
      {
        id: "api-index",
        title: "API 索引",
        content: `
      <p>所有公开函数，以及它们的来源。</p>
      <h3><code>nuclo</code>（全局与命名导出）</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>：运行所有动态值，或给定作用域内的动态值。</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>：为元素指定作用域 id，供 <code>update(id)</code> 使用。</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>：条件内容，带 <code>.when()</code> 和 <code>.else()</code>。</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>：每项一行，按严格相等匹配。</li>
        <li><a href="#api-region"><code>region(options)</code></a> 和 <a href="#api-region"><code>into(id, ...content)</code></a>：树中的一个命名位置，以及从任何地方填充它的内容。</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>：事件监听器，或 <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>。</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>：构建并追加。</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>：接管服务端 HTML。</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>：再次调用组件并更新现有 DOM。</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>：从样式对象生成类。</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>：组合样式，后者优先。</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>：带主题的 <code>css</code>、<code>cx</code>、<code>variants</code>、<code>keyframes</code> 和 <code>globalStyle</code>。</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>：由选项生成样式。</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> 和 <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>。</li>
      </ul>
      <h3><code>nuclo</code>（仅命名导出）</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> 和 <a href="#api-css-text"><code>resetStyles()</code></a>。</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>、<code>renderManyToString(inputs)</code>、<code>renderToStringWithContainer(input, tag?, attrs?)</code> 和 <code>getCssText()</code>。</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">一个副作用导入</a>，另有 <code>document</code>、<code>Event</code>、<code>CustomEvent</code>、<code>Node</code>、<code>Element</code>、<code>HTMLElement</code> 和各 <code>Nuclo*</code> 类。</li>
      </ul>
      <h3><code>nuclo-router</code>（独立包）</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>：路由器，带 <code>start()</code>、<code>match()</code>、<code>outlet()</code>、<code>matches()</code>、<code>go()</code>、<code>push()</code>、<code>href()</code> 和 <code>stop()</code>。</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>：数据加载器与 chunk 同时开始的路由。</li>
        <li><a href="#router-api">类型</a>：<code>RouteContext</code>、<code>PageProps</code>、<code>Params</code>、<code>DataLoader</code>、<code>RouteTable</code> 等。</li>
      </ul>
      <h3>仅全局</h3>
      <ul>
        <li><a href="#tag-builders">175 个标签构建函数</a>：<code>div</code>、<code>span</code>、…、<code>var_</code>，以及 <code>svgSvg</code>、<code>pathSvg</code>、…。</li>
        <li><a href="#typescript-setup">类型</a>：<code>NodeModFn</code>、<code>NodeModLike</code>、<code>ExpandedElement</code> 等。<code>StyleResult</code> 等样式类型也可以从 <code>'nuclo'</code> 导入。</li>
      </ul>
      <h3>特殊键</h3>
      <ul>
        <li><a href="#attributes">属性</a>：<code>className</code>、<code>style</code>、<a href="#events"><code>on*</code> 处理器</a>、<a href="#lifecycle"><code>onMount</code> 和 <code>onDestroy</code></a>。</li>
        <li><a href="#style-objects">样式对象</a>：简写、伪类状态、<code>&amp;</code> 选择器、<code>@</code> 规则和 <code>raw</code>。</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "常见问题",
        content: `
      <h3>修改状态会更新 UI 吗？</h3>
      <p>不会。在你调用 <code>update()</code> 之前，DOM 保持原样。</p>

      <h3>Nuclo 使用 signal、proxy 或虚拟 DOM 吗？</h3>
      <p>不。状态就是普通的 JavaScript。渲染一棵树时，Nuclo 创建真实的元素和文本节点。<code>update()</code> 运行所有已注册的动态值（或给定作用域内的动态值），并在值发生变化时更新现有节点。没有依赖图，也没有虚拟树。</p>

      <h3>为什么我的页面显示 "false"？</h3>
      <p>布尔值会被渲染为文本。<code>div(ok &amp;&amp; span('Done'))</code> 会显示 "false"。子节点请用 <code>when(() =&gt; ok, span('Done'))</code>，文本请用 <code>ok ? 'Done' : ''</code>。</p>

      <h3>为什么我编辑了列表项，对应的行却没有变化？</h3>
      <p>仍在列表中的项，其行会被保留，而不是重新渲染。对会变化的字段使用动态值，比如 <code>() =&gt; todo.text</code>。见 <a href="#api-list"><code>list()</code></a>。</p>

      <h3>为什么我的 UI 有一部分停止更新了？</h3>
      <p>通常是因为 <code>update()</code> 运行时这些节点不在 document 中。Nuclo 会停止跟踪这些节点，即使你之后再把它们挂上，所以请渲染到一个位于 document 中的容器。另外两个原因：条件抛出异常的 <code>when()</code> 会停止更新，第一次运行就抛出的文本函数会保持为空。见 <a href="#api-update"><code>update()</code></a>。</p>

      <h3>什么时候应该使用 <code>forceUpdate()</code>？</h3>
      <p>只用于静态值的罕见变化，比如切换语言。其他情况一律使用 <code>update()</code>。见 <a href="#api-force-update"><code>forceUpdate()</code></a>。</p>

      <h3>如何把页面放进布局，而不必把它作为 prop 向下传递？</h3>
      <p>用 <code>region({ id: 'main' })</code> 标记位置，让页面返回 <code>into('main', …)</code>。见 <a href="#api-region"><code>region()</code> 与 <code>into()</code></a>。</p>

      <h3>如何卸载一个应用？</h3>
      <p>把它包进 <code>when()</code>，然后把条件关掉。自己移除 DOM 不会运行 <code>onDestroy</code>。见<a href="#lifecycle">生命周期</a>。</p>

      <h3>Nuclo 包含路由器吗？</h3>
      <p>核心包里没有。路由以 <code>nuclo-router</code> 的形式单独发布，带服务端渲染、水合、代码分割的路由和空闲预加载。用 <code>npm install nuclo nuclo-router</code> 安装。见 <a href="#router-overview">nuclo-router</a>。</p>

      <h3>Nuclo 有 effect 吗？</h3>
      <p>没有。<code>onMount</code> 和 <code>onDestroy</code> 每个元素运行一次，分别对应插入和移除。不会因为某个状态变化而再次运行任何东西。</p>
    `,
      },
    ],
  },

];
