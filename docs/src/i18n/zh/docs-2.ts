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
      <p>丢给它一个类型安全的样式对象，拿回一个 CSS 类，再把结果交给任意标签构建函数就行。浏览器里，规则会写进唯一的 <code>&lt;style id="nuclo-styles"&gt;</code> 元素；到了服务端，则由 <a href="#api-css-text"><code>getCssText()</code></a> 把它们吐出来。</p>
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
        <li>基础声明会生成一个类，每个伪类键、选择器和媒体块再各生成一个。上面的 card 最终就带着两个类。</li>
        <li>类名由内容哈希而来：样式一样，类就是同一个，服务端和客户端算出来的名字也完全一致。</li>
        <li>样式请在模块顶层定义，只定义一次。<code>css()</code> 是按对象缓存的，如果每次调用都塞进一个新对象，就等于每次都重新处理一遍。</li>
        <li>对象一旦传给 <code>css()</code>，之后再去改它是不会有任何效果的。</li>
        <li>所有样式在页面（或服务端进程）的整个生命周期里都会一直保持注册。如果某个值会随数据逐项变化，比如由数据算出来的宽度，请改用 <a href="#attributes"><code>style</code> 属性</a>。</li>
      </ul>
      <h3>命名样式</h3>
      <p>先传一个名字，就能拿到可读性更好的类名：</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>基础类名就是你给的这个名字，其余的块则命名为 <code>name-&lt;hash&gt;</code>。</li>
        <li>名字得是合法的类名，不合法的话 Nuclo 会给出警告，并自动生成一个替代。</li>
        <li>名字是全局唯一的，两个不同的样式撞了名，Nuclo 同样会警告你。</li>
      </ul>
      <h3>怎么用返回值</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> 和 <code>card.className</code> 返回的都是类名。</p>
    `,
      },
      {
        id: "style-objects",
        title: "样式对象",
        content: `
      <p>传给 <code>css()</code> 的对象，用的是 camelCase 的常见 CSS 属性，外加一批简写，以及用来表达伪类状态、选择器和媒体查询的嵌套键，TypeScript 会把它们全部自动补全。类型集合里没有的属性，比如 <code>borderTopLeftRadius</code>、<code>fill</code>、<code>paddingInline</code>，统统放进 <code>raw</code>（见下文）。</p>
      <h3>值</h3>
      <ul>
        <li>数字会自动补上 <code>px</code>，只有 <code>0</code> 和无单位属性例外：<code>zIndex</code>、<code>opacity</code>、<code>fontWeight</code>、<code>lineHeight</code>、<code>flex</code>、<code>flexGrow</code>、<code>flexShrink</code>、<code>order</code>、<code>aspectRatio</code>、<code>gridColumn</code>、<code>gridRow</code>。在 <code>raw</code> 里，<code>zoom</code>、<code>scale</code>、<code>column-count</code>、<code>orphans</code>、<code>widows</code>、<code>tab-size</code> 和 <code>animation-iteration-count</code> 同样不带单位。</li>
        <li>字符串原样输出，<code>null</code>、<code>undefined</code> 和 <code>false</code> 则直接跳过。</li>
        <li><code>lineHeight</code>（以及 <code>leading</code>）是无单位的，所以 <code>leading: 24</code> 的意思是字号的 24 倍。想用像素，请写成 <code>"24px"</code>。</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>简写</h3>
      <table>
        <thead><tr><th>键</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>、<code>pt</code>、<code>pr</code>、<code>pb</code>、<code>pl</code></td><td>padding，及其四个方向</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>左右 padding / 上下 padding</td></tr>
          <tr><td><code>m</code>、<code>mt</code>、<code>mr</code>、<code>mb</code>、<code>ml</code>、<code>mx</code>、<code>my</code></td><td>margin 的同样一套写法</td></tr>
          <tr><td><code>w</code>、<code>h</code>、<code>minW</code>、<code>maxW</code>、<code>minH</code>、<code>maxH</code></td><td>width、height 以及它们的 min / max</td></tr>
          <tr><td><code>size</code></td><td>同时设置 width 和 height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>下面这几个键只需要传 <code>true</code>：</p>
      <table>
        <thead><tr><th>键</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center（不会设置 display）</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>伪类状态</h3>
      <p><code>hover</code>、<code>focus</code>、<code>focusVisible</code>、<code>focusWithin</code>、<code>active</code>、<code>visited</code>、<code>disabled</code>、<code>enabled</code>、<code>checked</code>、<code>required</code>、<code>invalid</code>、<code>valid</code>、<code>readOnly</code>、<code>first</code>（<code>:first-child</code>）、<code>last</code>（<code>:last-child</code>）、<code>only</code>（<code>:only-child</code>）、<code>odd</code>、<code>even</code>、<code>empty</code>、<code>placeholderShown</code>、<code>placeholder</code>、<code>before</code>、<code>after</code>、<code>selection</code>、<code>marker</code>、<code>firstLine</code> 和 <code>firstLetter</code>。它们还能层层嵌套：<code>hover: { focus: {…} }</code> 会得到 <code>:hover:focus</code>。</p>
      <h3>选择器与 at 规则</h3>
      <p>以 <code>&amp;</code> 开头的键是选择器，里面每个 <code>&amp;</code> 都会换成当前这个类；以 <code>@</code> 开头的键则是 at 规则：<code>@media</code>、<code>@container</code> 或 <code>@supports</code>。</p>
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
        <li>键必须以 <code>&amp;</code> 开头。像 <code>".dark &amp;"</code> 这样的写法会被直接忽略，改成 <code>"&amp;:is(.dark *)"</code> 就行了。</li>
        <li>两个嵌套的 <code>@media</code> 块会用 <code>and</code> 合并。以媒体类型（<code>print</code>、<code>only screen</code>）开头的查询会被排到前面，因为语法规定类型只能出现在最前面。无法拍平的组合（两个媒体类型，或以 <code>not</code> 开头）会触发警告，并且只保留内层查询。至于其他嵌套的 at 规则，内层会直接替换外层。</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>任何属性都可以丢进 <code>raw</code>，名字照 CSS 原样写。数字依旧会被加上 <code>px</code>，所以这里请传字符串：</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>其他所有平铺的键都会被转成 kebab-case 原样输出，所以像 <code>colr: 'red'</code> 这样的手误，最后会变成一条被浏览器丢掉的声明。嵌套对象如果挂在非伪类状态、非 screen、也不是 <code>&amp;</code> 或 <code>@</code> 开头的键下面，同样会被忽略。这两种情况，TypeScript 都会替你报错。</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>把几份样式拼在一起。多个输入设置了同一属性时，后写的盖掉先写的。</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>假值输入直接跳过，数组会被展开，字符串会被拆开并去重。</li>
        <li>同一类块（基础块、同一伪类、同一媒体查询）里生成的类，会合并成一个新类，其余类名原样放行。</li>
        <li>参数顺序只有 <code>cx()</code> 看得懂。写成 <code>div(base, blue)</code> 的话，两个类都会挂上去，到底谁生效，要看哪条规则是最后创建的。需要互相覆盖的样式，请放进同一个 <code>cx()</code> 调用里。</li>
        <li>命名样式的某个块要是和别的输入合并了，合并出来的类叫 <code>name-&lt;hash&gt;</code>，不再是不带哈希的那个名字；没被合并的块则保留原来的类，所以 <code>cx(pageTitle, 'extra')</code> 依然带着 <code>page-title</code>。</li>
      </ul>
      <h3>动态类</h3>
      <p>传入一个始终返回 <code>cx(...)</code> 的函数：</p>
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
      <p>这个函数在第一次运行时就必须返回一个样式结果。如果写成 <code>() =&gt; active &amp;&amp; activeButton</code>，页面上出现的会是文本 "false"，而不是一个类。</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>它会返回一套绑定在主题上的专属 <code>css</code>、<code>cx</code>、<code>variants</code>、<code>keyframes</code> 和 <code>globalStyle</code>。主题的作用，是给各种值起名字：按下面这个主题，<code>borderColor: 'border'</code> 会写出 <code>#e5e7eb</code>，TypeScript 也会帮你补全这些名字。<code>screens</code> 里的每一项都会变成一个媒体查询样式键，比如 <code>md: {…}</code>。</p>
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
        <thead><tr><th>主题键</th><th>被谁使用</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>、<code>backgroundColor</code>、<code>color</code>、<code>borderColor</code> 及各方向的变体、<code>outlineColor</code>、<code>caretColor</code>、<code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>、<code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>、<code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>、<code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>新增的样式键，比如 <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>主题名只有作为完整的值出现时才会被解析，<code>border: "1px solid primary"</code> 这种写法不会生效。</li>
        <li>不带 <code>@</code> 的 screen 值会变成 <code>@media &lt;value&gt;</code>；以 <code>@</code> 开头的则原样使用，比如 <code>"@container (min-width: 400px)"</code>。</li>
        <li>screen 只存在于由 <code>createCss()</code> 创建的实例上。全局的 <code>css()</code> 没有 screen，不过它认 <code>@media</code> 键。</li>
        <li>所有实例和全局辅助函数共用同一张样式表。screen 的媒体规则按 screen 的声明顺序输出，而不是你使用它们的顺序，所以 <code>min-width</code> 类的 screen 要从小到大依次列出。建议每个应用只用一个 <code>createCss()</code> 实例，这样顺序就是你主题里写的顺序。</li>
        <li>返回结果上的 <code>theme</code>，就是你传进去的那份主题。</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>生成一个函数，按选项返回对应的样式，按钮的 intent 和 size 就是典型场景。</p>
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
        <li>合并顺序依次是：<code>base</code>、每个分组选中的值、每个命中的 compound。同一属性冲突时，后面的赢。</li>
        <li>某个选项缺省、为 <code>undefined</code> 或 <code>null</code> 时，用默认值；没有默认值的分组则跳过。</li>
        <li>只有 <code>true</code> 和 <code>false</code> 两个键的分组，才接受布尔值。</li>
        <li>compound 要等它列出的每个分组都匹配上（默认值也算）才会生效。</li>
        <li>每种选择组合只构建一次，然后缓存起来。</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() 与 globalStyle()",
        content: `
      <p><code>keyframes()</code> 负责注册一段动画，并返回生成的名字。帧的键可以是 <code>from</code>、<code>to</code> 和百分比，比如 <code>"50%"</code> 或 <code>"0%, 100%"</code>。每一帧里只能放平铺属性。帧内容相同，返回的名字就相同。</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> 可以给任意选择器加一条规则：</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>选择器原样使用，不做任何改写。</li>
        <li>只支持平铺属性。伪类键、screen 和 <code>@</code> 键都会被忽略，所以 <code>globalStyle()</code> 写不出媒体规则。</li>
        <li>同一条规则只会添加一次。同一个选择器如果换了样式，就会再追加一条规则，以后面的为准。</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() 与 resetStyles()",
        content: `
      <p><code>getCssText()</code> 会返回当前进程里 <code>css()</code>、<code>cx()</code>、<code>variants()</code>、<code>keyframes()</code> 和 <code>globalStyle()</code> 创建过的全部规则：先是基础规则，再是 <code>@media</code>、<code>@container</code> 和 <code>@supports</code> 块。它是为服务端渲染准备的。</p>
      <ul>
        <li>请在 <code>renderToString()</code> 之后调用，渲染过程中创建的规则也会一并包含进来。</li>
        <li>它的范围是整个进程，而不是某一个页面或某一次请求，而且只增不减。别担心，类名是内容哈希，这样做是安全的。</li>
        <li>把结果放进 <code>&lt;style id="nuclo-styles"&gt;</code> 里。客户端会复用这个元素，并跳过其中已有的规则。要是换了别的 id，或者干脆不带 id，客户端就会再追加一张包含所有规则的样式表。</li>
        <li>文本不会做转义，所以千万别把不可信的输入放进样式值。</li>
      </ul>
      <p><code>resetStyles()</code> 是专门给测试用的辅助函数，它会移除所有规则以及 <code>#nuclo-styles</code> 元素。之前创建的样式还留着类名，只是 CSS 没了。应用代码和服务端里不要调用它。</p>
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
      <div class="docs-callout"><strong>独立包：</strong><code>nuclo-router</code> 不在 Nuclo 核心包里，需要和 <code>nuclo</code> 一起安装。它目前还是预览版，API 仍有可能调整。</div>
      <p>这是 Nuclo 官方的路由方案，支持服务端渲染、hydration、按路由做代码分割，还会在空闲时预加载，底层建立在 <code>list()</code> 和 <code>update()</code> 之上。gzip 后只有约 ${NUCLO_ROUTER_GZIP_KB} KB，除了 Nuclo 本身再无其他依赖，也没有副作用，所以没用到的话会被 tree-shake 干净。</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>用 <code>pnpm add</code>、<code>yarn add</code> 或 <code>bun add</code> 装这两个包也一样。它把 <code>nuclo</code> 0.3 及以上版本作为 peer dependency。</p>
      <p>router 负责决定加载<em>什么</em>，应用则通过 <code>router.outlet()</code> 来说明放<em>在哪</em>：它就是一个遍历整个图层栈的 <code>list()</code>，每个图层占一行，所以普通页面只是其中单独的一行。服务端和客户端会构建出同一棵树，因此 <code>hydrate()</code> 接管的是服务端已有的节点，而不是把它们换掉。剩下的部分，无非是 <code>history</code>、一个委托的 <code>click</code> 监听器，以及 <code>requestIdleCallback</code>。</p>
      <h3>一次导入，到处使用</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> 会在返回之前把匹配路由的模块解析好，因此服务端和客户端的第一棵树都是完整的。此后，router 上的成员会转发给它启动的那个 Route：<code>router.path</code>、<code>router.pending</code>、<code>router.go()</code>。</p>
      <h3>完整的应用长什么样</h3>
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
      <p>集成工作到这里就做完了。链接能直接用，是因为 <code>&lt;a href&gt;</code> 本来就是普通的 <code>&lt;a href&gt;</code>：<code>document</code> 上挂着一个委托监听器，只拦截归 router 管的链接，其他的一律交还给浏览器。</p>
      <p>在服务端，<code>start()</code> 会为每个请求返回一个独立的 <code>Route</code>，完全不碰 router 本身，所以并发请求之间不会看到彼此的路由。<code>route.run()</code> 则让这个 Route 在整个渲染期间充当 router（也就是 outlet）读取的那一个。浏览器里每次页面加载只有一个 Route，<code>start()</code> 会把它设成 router 自己的，所以不用调用 <code>run()</code>。</p>
      <p>页面会以 <code>(ctx, { layer, data, outlet, beforeLeave })</code> 的形式拿到自己的 <a href="#router-api"><code>RouteContext</code></a> 和 <a href="#router-api"><code>PageProps</code></a>，用不上的参数完全可以不接。它可以返回 <code>list()</code> 能接受的任何内容。想顺便填充布局的其他位置，就在页面里再返回一个 <code>into()</code>，例如 <code>div(article(…), into('sidebar', nav(…)))</code>，这些内容会跟着页面一起离开。详见<a href="#router-regions">页面与区域</a>。</p>
    `,
      },
      {
        id: "router-patterns",
        title: "模式与嵌套路由",
        content: `
      <table>
        <thead><tr><th>模式</th><th>匹配</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>、<code>/docs/intro</code></td><td>精确匹配这条路径</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>其他一切没匹配上的路径，也就是你的 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>优先级是这样排的：先看静态模式，再按声明顺序看动态模式，最后才轮到 catch-all，其中前缀最长的优先。所以 <code>'*'</code> 只会兜住其他模式都没接住的路径，在路由表里放哪儿都行。末尾斜杠、重复斜杠和百分号编码都会被规范化，参数值拿到手时已经是解码后的。匹配是对每个模式做逐段比较，既不构建也不运行任何正则。</p>
      <h3>相对路由</h3>
      <p>写成 <code>./</code> 开头的模式，是相对于声明它的父级；写成 <code>./</code> 开头的 href，则相对于当前活动路由。两者一结合，就能得到一个挂在哪个父级下含义都不变的可复用分区。路由表的值要么是加载器，要么是另一张表，后者的键相对于它自己：</p>
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
      <p>这两行会展开成完整的六个模式，却没有一条路径需要写两遍。两个父级拿到的是同一批加载器对象，所以它们共用一份模块缓存，也只会触发一次 <code>import()</code>。</p>
      <ul>
        <li>在子表里，<code>'./x'</code>、<code>'/x'</code> 和 <code>'x'</code> 是一个意思；<code>'/'</code> 代表父级路径本身；<code>'*rest'</code> 则是这个分区自己的 catch-all。嵌套多少层都可以。</li>
        <li>顶层的键原样使用，所以 <code>'*'</code> 还是 <code>'*'</code>。</li>
        <li>在 <code>*catch-all</code> 父级下面再放子级，<code>createRouter()</code> 会直接报错，因为 catch-all 必须是模式的终点。</li>
      </ul>
      <h3>父页面与 <code>outlet()</code></h3>
      <p>父级和子级之间是真正的层级关系：父级先渲染，子级则渲染在父级内部调用 <code>outlet()</code> 的位置：</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>在子级之间来回导航，并不会重建父级，它的 DOM 节点始终是同一个。焦点、滚动位置、写到一半的输入，以及闭包里的任何状态，都会原样保留。</p>
      <ul>
        <li>没有子路由的页面，它的 outlet 什么都不会渲染，所以布局大可无条件调用它。反过来，有子级却不调用 <code>outlet()</code> 的父级，不会显示任何子级内容。</li>
        <li>这里没有索引路由的概念。<code>'/'</code> 本身就是布局，所以访问父级路径时，渲染的是带着空 outlet 的布局，而不是布局里再嵌一个单独的索引页。想要默认内容，就写进布局里，或者给它一个真正的子路径。</li>
      </ul>
      <p>这样一来，同一个调用在任何父级下都管用，哪怕页面自己并不知道它挂在哪个父级之下：</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>、<code>../x</code>、<code>.</code> 和 <code>..</code> 都是相对于当前路由的路径来解析的，而不是 URL 的“目录”。从 <code>/invoices/42</code> 出发，<code>./preview</code> 得到 <code>/invoices/42/preview</code>，换成浏览器自己解析的话则会是 <code>/invoices/preview</code>；URL 末尾有没有斜杠，结果都一样。<code>../</code> 往上走一段，最多走到根。查询串和哈希会被带上，<code>base</code> 会重新加回去，最终写进 history 的是解析后的绝对路径。这跟 React Router 处理 <code>&lt;Link to="./x"&gt;</code> 时对 URL 解析规则的偏离，是同一种做法。</p>
      <ul>
        <li>只有 <code>./</code> 和 <code>../</code> 是路由相对的。href 里光秃秃的 <code>preview</code>，仍然交给浏览器的常规规则处理。</li>
        <li>相对链接请用 <code>router.href('./preview')</code> 来构建，别手写 <code>href="./preview"</code>。<code>href()</code> 在渲染时就完成解析，输出的标记是绝对路径，所以对爬虫、中键点击和禁用 JavaScript 的场景依然正确。</li>
      </ul>
      <h3>哪些节点保留，哪些重建</h3>
      <table>
        <thead><tr><th>节点</th><th>导航时</th></tr></thead>
        <tbody>
          <tr><td>模式和路径都没变的父级</td><td><strong>保留</strong>：还是同一个节点，它的 <code>load()</code> 也不会重新运行</td></tr>
          <tr><td>匹配到的页面</td><td>模式和路径没变、且没有 <code>load()</code> 时<strong>保留</strong>，所以只改查询串或哈希，它依然还在。带加载器的路由，每次访问都会刷新。</td></tr>
          <tr><td>路径变了的父级</td><td>重建，连同它下面的一切</td></tr>
          <tr><td>推入的图层</td><td>只渲染匹配到的页面，它的父级已经挂载在下面那一行里了。</td></tr>
        </tbody>
      </table>
      <p>被保留下来的页面，用的还是构建时的那个 <code>ctx</code>。这正是 <code>ctx</code> 在所有场景下的含义：要读实时值，请读 <code>router.*</code>。由查询串驱动的状态（筛选、分页、选项卡之类），在动态值里读 <code>router.search</code>，再用 <code>router.go('?page=2', { replace: true })</code> 写回去。页面、焦点，还有写到一半的输入，全都纹丝不动。</p>
    `,
      },
      {
        id: "router-regions",
        title: "页面与区域",
        content: `
      <p><code>router.outlet()</code> 只管把页面放在一个位置上。要是页面还想在布局的别处放侧栏、工具栏或标题，就用 <a href="#api-region"><code>into()</code></a> 去填充：布局用 <code>region()</code> 标出位置，页面在自己的内容旁边顺手返回一个 <code>into()</code>。布局永远不会以 prop 的形式收到页面内容，导航也永远不会把它重建。</p>
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
      <p>页面内容是 outlet 那个 <code>list()</code> 里的一行，而 <code>into()</code> 的生命周期和承载它的那一行完全一致。于是侧栏内容跟着页面来，也跟着页面走：导航到一个没有 <code>into('sidebar', …)</code> 的页面时，区域会重新显示它的 <code>empty</code> 内容。两部分都由同一个函数构建，所以页面可以在这两处同时用上自己的 <code>ctx</code> 和 <code>data</code>。</p>
      <h3>导航时发生了什么</h3>
      <ul>
        <li><strong>被保留的页面，区域也保留。</strong><a href="#router-patterns">保留页面</a>时，查询串或哈希的变化同样不会动区域内容。如果侧栏依赖它们，请在动态值里读 <code>router.search</code>。</li>
        <li><strong>被重建的页面，区域重新填充。</strong>路由一变，旧的那一行被移除，新页面的 <code>into()</code> 视图接管，不会留下任何残余。</li>
        <li><strong>推入的图层会多出一个视图。</strong>图层是 outlet 里靠后的一行，所以它的 <code>into()</code> 就是同一区域的较新视图。默认的 <code>type: 'latest'</code> 下，它会盖过页面的视图，直到图层关闭，页面的视图才重新露面；<code>type: 'stack'</code> 下，两者会同时显示。</li>
        <li><strong>父页面也能填充区域。</strong>子级变化时，父级的视图不动，因为父级不会被重建。</li>
        <li><strong>服务端渲染开箱即用。</strong>服务端在 <code>route.run()</code> 里构建页面，所以它的 <code>into()</code> 视图已经在 HTML 里，<code>hydrate()</code> 会直接接管它们。</li>
      </ul>
      <h3>一个页面填多个区域</h3>
      <p>传一个对象，就能一次填充多个区域。页面的主内容依然走 outlet，所以把它和 <code>into()</code> 并排返回：</p>
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
      <h3>各个工具分别该用在哪</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> 用于子路由：内容由 URL 决定，渲染在父页面内部。见<a href="#router-patterns">嵌套路由</a>。</li>
        <li><strong><code>into()</code></strong> 用于让匹配到的页面把自己的内容铺到布局的各个角落。内容归页面所有，用的是页面自己的数据。</li>
        <li><strong><code>matches()</code></strong> 用于布局单凭 URL 就能自己做决定的场景，用它自己的小路由表，不涉及任何页面。见 <a href="#router-matches"><code>matches()</code></a>。</li>
      </ul>
      <p>这些能力都隶属于唯一匹配到的那条路由。router 不会用同一个 URL 去驱动两个互相独立的区域，所以带路由的侧栏，其实是页面填充的一个区域，而不是第二个 outlet。如果你确实想让侧栏拥有自己的 router、加载过程和回退，可以保留一个未启动的 router，再用 <code>match()</code> 去解析，见<a href="#router-multi">多 router 与组合加载</a>。</p>
    `,
      },
      {
        id: "router-loaders",
        title: "路由加载器与代码分割",
        content: `
      <p>页面模块可以导出一个 <code>load</code> 函数。它在页面构建之前运行，每次导航到该路由都会执行，返回的任何内容都会作为 <code>data</code> 交给页面：</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>路由表不用改，加载器跟着页面走。它会拿到匹配的 <code>RouteContext</code>，所以 <code>params</code>、<code>search</code> 和 <code>path</code> 都能用。它可以是同步的也可以是异步的，同样会在服务端运行，所以服务端渲染出来的页面，数据已经在 HTML 里了，不必等到 hydration 之后再去请求。</p>
      <p><strong>模块会被缓存，数据不会。</strong>路由的 chunk 只获取一次，之后复用，而它的加载器每次导航都会重新跑一遍。这就是为什么 <code>/blog/a</code> 和 <code>/blog/b</code> 不会串数据，也是失败的加载器可以直接重试的原因。</p>
      <table>
        <thead><tr><th>情形</th><th>行为</th></tr></thead>
        <tbody>
          <tr><td>运行期间</td><td><code>router.pending</code> 为 true，当前页面继续显示</td></tr>
          <tr><td>抛出异常或 reject</td><td>落到 <code>router.error</code> 上。<code>go()</code> 依然永不 reject，导航可以重试。</td></tr>
          <tr><td>在 <code>start()</code> 期间</td><td>rejection 会从 <code>start()</code> 抛出，因为此时还没有 Route 可以承载它。</td></tr>
          <tr><td>推入的图层</td><td>运行它自己的加载器，拥有自己的数据</td></tr>
          <tr><td>空闲预加载器</td><td>只预热模块。它没有上下文可传，否则就等于在为一个你可能永远不会打开的路由请求数据。</td></tr>
          <tr><td>重新导航到同一 URL</td><td>加载器再次运行，该行重建。没有加载器的路由则保留它的行。</td></tr>
        </tbody>
      </table>
      <p>想重新验证数据，就导航到当前所在位置，同时不新增 history 条目：</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>让数据和 chunk 同时开跑</h3>
      <p>页面模块导出的 <code>load</code> 必须等模块到手才能运行，所以冷导航是先拉 chunk，再拉数据。想让两者并行，就用 <code>withLoad()</code> 在路由表里声明加载器：</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>它会取代模块自己的 <code>load</code>，同样在每次访问时运行。chunk 还在加载时发生的 rejection，也和别的情形一样落到 <code>router.error</code> 上。</p>
      <p>设计上，服务端数据不会被序列化进 HTML，客户端的 <code>load</code> 会在 hydration 时再跑一次。如果这点对你很重要，就让服务端把 <code>route.data</code> 输出出来（比如放进 <code>window.__DATA__</code>），再让加载器优先读它。要注意，<code>route.data</code> 只包含匹配页面的数据，父级 <code>load()</code> 的结果不在其中。</p>
      <h3>代码分割与预加载</h3>
      <p>路由的值永远是一个返回页面组件的函数，所以组件是懒加载的：</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>只有模块形态的写法才能带上 <code>load</code> 导出。用 <code>.then(m =&gt; m.BPage)</code> 去挑命名组件时，交给 router 的就只有那一个函数。</p>
      <p>每个模块只会导入一次并缓存，对同一路由的并发导航共享同一次 <code>import()</code>。用户让页面空闲超过 <code>idleTimeout</code>（默认一秒，期间没有触摸、按键、滚轮或滚动）之后，其余路由就会在后台加载，每个空闲时间片加载一个（靠 <code>requestIdleCallback</code>）。一旦有任何输入，或者用户正在等一次导航，预加载就会暂停，等页面再次空闲才继续。</p>
      <p>已预加载或同步提供的路由，不会把 <code>router.pending</code> 设为 true，而且会在下一次绘制之前完成导航，没有一闪而过的加载指示器，也不会出现布局抖动。只有必须等待某个模块或加载器时，<code>router.pending</code> 才为 true，这时正在离开的页面会继续留在屏幕上。加载失败的 chunk 会以 <code>router.error</code> 的形式呈现，绝不会变成未处理的 rejection，直接重试就好。</p>
    `,
      },
      {
        id: "router-api",
        title: "router API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> 负责把模式映射到加载器或嵌套表。可用的选项如下：</p>
      <table>
        <thead><tr><th>选项</th><th>默认值</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>应用所在的 URL 前缀，比如 <code>'/docs'</code>。只在路径段的边界上匹配：<code>/docs/intro</code> 算在 <code>'/docs'</code> 之内，<code>/docsearch</code> 则不算。前缀之外的 URL 什么都匹配不到，所以 <code>start()</code> 会 reject（也就是你在服务端的 404），指向这些 URL 的链接则交给浏览器处理。</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>页面空闲后，在后台加载其余路由的模块。设为 <code>false</code> 即可关掉。</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>没有触摸、按键、滚轮或滚动多少毫秒之后开始预加载，或是在用户忙完之后恢复预加载。</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>，在浏览器中，每次导航解析完成、DOM 也跟上之后调用，首次导航也包括在内。<code>kind</code> 取值为 <code>'start'</code>、<code>'push'</code>、<code>'replace'</code>、<code>'pop'</code>（后退、前进、<code>close()</code>）或 <code>'layer'</code>。想处理 <code>document.title</code>、meta 标签、焦点、滚动和统计分析，就靠这个钩子。SSR 期间永远不会被调用。</td></tr>
        </tbody>
      </table>
      <p>返回值是 router：包含 <code>start()</code>、<code>match()</code>、<code>outlet()</code>、<code>matches()</code>，以及除 <code>run()</code> 之外的所有 <code>Route</code> 成员，这些成员都会转发给当前活动的 Route。浏览器里，活动 Route 是最后一次 <code>start()</code> 返回的那个；服务端则是其 <code>run()</code> 正在执行的那个。两者都没有时，读取成员会抛出错误。路由表、编译后的匹配器和模块缓存都挂在 router 上，因此在服务端会跨请求共享。</p>
      <h3><code>router.start(url?)</code></h3>
      <p>把 <code>url</code>（浏览器中默认取 <code>location.href</code>）解析到对应的页面模块，返回 <code>Promise&lt;Route&gt;</code>。如果没有任何匹配、路由表里又没有 <code>'*'</code> 路由，就会 reject，在服务端这就是你的 404。在浏览器里，它还会把这个 Route 设为 router 的活动 Route，挂上 <code>popstate</code> 和委托的 <code>click</code> 监听器，并安排预加载。第二次调用 <code>start()</code> 会停掉上一个 Route。在服务端它不会碰任何共享状态，所以请在 <code>route.run()</code> 里渲染。</p>
      <h3><code>router.match(url?)</code></h3>
      <p>拿路由表去解析一个 URL，但什么都不加载：没有 import，没有 history，没有监听器，也没有 Route。它返回 <code>RouteContext</code>；如果 URL 在 <code>base</code> 之外、不匹配任何模式，或者在浏览器里属于另一个源，就返回 <code>null</code>。只接受绝对 URL，因为解析 <code>./</code> 需要一个活动路由。</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>以 <code>list()</code> 的形式呈现活动路由的页面。只需放置一次，放在页面该出现的地方。推入的图层是它靠后的一行。在 <code>start()</code> 解析之前和 <code>stop()</code> 之后，它是空的。在服务端，它渲染的是 <code>run()</code> 正在执行的那个 Route。</p>
      <h3><code>router.matches(table)</code></h3>
      <p>渲染第二张表里与活动路由路径相匹配的视图，以 <code>list()</code> 的形式存在，可以放在任何地方。见 <a href="#router-matches"><code>matches()</code></a>。</p>
      <h3><code>Route</code></h3>
      <p>除 <code>run()</code> 之外，每个成员在 router 上也都有，应用通常直接从那里读取。</p>
      <table>
        <thead><tr><th>成员</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>、<code>pattern</code>、<code>params</code>、<code>search</code>、<code>hash</code>、<code>url</code></td><td>当前活动的匹配结果。<code>search</code> 是一个 <code>URLSearchParams</code>，<code>search</code>、<code>hash</code> 和 <code>url</code> 都是实时的。</td></tr>
          <tr><td><code>pending</code></td><td>有一次导航正在等待模块或加载器</td></tr>
          <tr><td><code>error</code></td><td>最近一次加载失败的错误，下一次导航会把它清掉</td></tr>
          <tr><td><code>data</code></td><td>匹配页面的 <code>load()</code> 返回的内容，供服务端序列化。父级的不包含在内。</td></tr>
          <tr><td><code>depth</code></td><td>栈上有几个图层（普通页面为 1）</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>执行导航，需要时加载模块。永不 reject：模块失败（无论 reject 还是抛出）都会落到 <code>error</code> 上。</td></tr>
          <tr><td><code>push(href)</code></td><td>把一条路由作为新图层打开在最上面，并以它关闭时的值 resolve。支持 <code>./</code>。没有匹配或模块失败时 reject。</td></tr>
          <tr><td><code>href(path)</code></td><td>给路径加上 <code>base</code> 前缀，用在 <code>a({ href })</code> 里。会相对于活动路由解析 <code>./</code> 和 <code>../</code>。</td></tr>
          <tr><td><code>stop()</code></td><td>卸掉所有监听器，关闭已打开的图层，清空 outlet。幂等。已停止的 Route 仍会返回最后一次匹配的结果，<code>go()</code> 则什么都不做。</td></tr>
          <tr><td><code>run(fn)</code></td><td>让这个 Route 充当 router 的活动 Route 来调用 <code>fn</code>，并返回它的结果，比如服务端上的 <code>route.run(() =&gt; renderToString(App))</code>。只支持同步。<code>fn</code> 返回之后，这个 Route 就不再是活动的了。</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>页面拿到的第一个参数，包含 <code>path</code>、<code>pattern</code>、<code>params</code>、<code>search</code>、<code>hash</code> 和 <code>url</code>。它记录的是页面构建那一刻的上下文，要读实时值请读 <code>router.*</code>。只有查询串或哈希发生变化而页面没有重建时，两者才会不一致。</p>
      <p><code>params</code> 默认是 <code>{ [name]: string }</code>。页面也可以用 <code>Params</code> 从自己的模式推导出类型，它会把 <code>'/blog/:slug'</code> 变成 <code>{ slug: string }</code>，把 <code>'/files/*rest'</code> 变成 <code>{ rest: string }</code>：</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>页面的第二个参数，按需解构即可。</p>
      <table>
        <thead><tr><th>属性</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>页面在栈里的位置。见下文的 <code>Layer</code>。</td></tr>
          <tr><td><code>data</code></td><td>路由的 <code>load()</code> 返回的内容，没有加载器时是 <code>undefined</code>。类型由 <code>PageProps&lt;TData&gt;</code> 指定。</td></tr>
          <tr><td><code>outlet</code></td><td>父页面渲染其子路由的位置。见<a href="#router-patterns">嵌套路由</a>。</td></tr>
          <tr><td><code>beforeLeave</code></td><td>注册一个守卫，在页面被丢弃之前先问它一声。见<a href="#router-layers">离开守卫</a>。</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>页面在栈里的位置，以及关闭该图层的办法。</p>
      <table>
        <thead><tr><th>成员</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>基础页面是 0，推入的图层从 1 开始</td></tr>
          <tr><td><code>push(href)</code></td><td>在页面内部再打开一个图层，和 <code>Route.push()</code> 一样</td></tr>
          <tr><td><code>close(result?)</code></td><td>关闭此图层以及它之上的所有图层，并 resolve 打开它的那个 <code>push()</code>。不带参数表示取消。在 depth 0 上不起作用。</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> 与 <code>withLoad()</code></h3>
      <p><code>DataLoader</code> 的类型是 <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>，也就是页面模块里可选的 <code>load</code> 导出。<code>withLoad(loader, load)</code> 会创建一条路由，它的 <code>load</code> 与 chunk 的 import 同时起步，而不是排在后面。见<a href="#router-loaders">路由加载器</a>。</p>
      <h3>类型</h3>
      <p>所有类型都由 <code>nuclo-router</code> 具名导出，直接从包入口导入，就能给页面、加载器或守卫加上类型标注。</p>
      <table>
        <thead><tr><th>类型</th><th>含义</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>某个模式对应的 params 对象。<code>RouteParams</code> 是无类型的形状，<code>Match</code> 是匹配器的结果。</td></tr>
          <tr><td><code>PageComponent</code></td><td>一个页面：<code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>一个页面模块：组件本身，或 <code>import()</code> 产出的 <code>{ default, load? }</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>，可以附带 <code>withLoad()</code> 提供的 <code>load</code></td></tr>
          <tr><td><code>RouteTable</code></td><td><code>createRouter()</code> 接受的表：模式对应加载器，或者对应嵌套表</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>，即 <code>go()</code> 的第二个参数</td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>，即 <code>onNavigate</code> 的第二个参数</td></tr>
          <tr><td><code>Outlet</code></td><td><code>PageProps</code> 里 <code>outlet()</code> 的类型</td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>，即 <code>beforeLeave()</code> 接受的类型</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code> 视图的类型：输入 params，输出内容或页面的 <code>import()</code></td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "图层与离开守卫",
        content: `
      <p><code>push()</code> 会把一条路由打开在当前路由之上，而不是替换它，并以该图层关闭时的值 resolve。页面本质上是一个遍历整个栈的 <code>list()</code>，所以打开图层不过是追加一行。下面的页面不会重新渲染，图层关闭之后，它的 DOM、焦点和填了一半的表单都还原样待在那里。</p>
      <p>有了它，“我需要一条还不存在的记录”这类流程就好办了：不必丢掉用户正在填的表单，就能先跳出去创建。</p>
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
      <p>图层可以层层嵌套。一个对话框里还要再弹一个对话框，只需调用 <code>layer.push()</code> 并 await 它，不用去引用 Route。</p>
      <ul>
        <li><strong>URL 就是最顶层的图层。</strong><code>push()</code> 会添加一条 history 条目，所以图层可以被链接，后退会把它关掉，并让它的 <code>push()</code> 以取消的方式 resolve，和点击取消完全一样。后退与 <code>close()</code> 走的是同一条代码路径：<code>close()</code> 记录结果并让 history 往回走，<code>history.state</code> 里的深度才是权威来源。浏览器每个标签页大约只保留 50 条条目，所以在图层之间走了很远之后，下面那条条目可能已经不在了：这时 <code>close()</code> 会就地关闭图层，并把当前条目改写成留下来显示的那个页面。</li>
        <li><strong>普通导航会清空栈。</strong>点链接或 <code>go()</code> 都不算图层，它们会替换一切，并关闭所有已打开的图层，所以不会有哪个调用方一直 await 下去。</li>
        <li><strong>冷加载得是个独立页面。</strong>URL 只说明最顶层的图层，并不记录它下面的栈，所以直接打开某个图层的 URL 时，它会以 depth 1 渲染，此时 <code>layer.depth === 0</code>，<code>close()</code> 不会起作用。被推入的路由必须能独立成立。请根据 <code>layer.depth</code> 分支处理，提供一个“离开”的链接，而不是一个失效的取消按钮。</li>
        <li><strong>Promise 撑不过页面刷新</strong>，因为它活在闭包里。靠返回结果能把交互流程写得简洁，但流程也应该考虑直接访问页面的情况。</li>
        <li><strong>不会有悬而未决的 await。</strong><code>stop()</code> 会关闭所有打开的图层，被导航抛弃的图层则以 <code>undefined</code> resolve。</li>
      </ul>
      <h3>离开守卫</h3>
      <p>如果页面里有值得保住的东西（比如填了一半的表单），就可以注册一个守卫。页面被丢弃之前会先问它，返回 <code>false</code>（或 resolve 为 false 的 promise）就能把页面留住：</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>只在页面离开时才询问。</strong>布局下子级之间的导航，或保留页面时查询串、哈希的变化，都不会触发。守卫的生命周期与页面一致，所以没有什么需要注销的。</li>
        <li><strong>所有离开页面的方式都在覆盖范围内。</strong>链接、<code>go()</code>、后退与前进、图层的 <code>close()</code>，还有 <code>go()</code> 到 router 不管的 URL（也就是离开应用，此时 <code>to</code> 为 <code>null</code>）。被守卫拦下的后退或前进会被撤销，地址栏仍停在当前页面。关闭标签页或刷新则是 <code>beforeunload</code> 的活儿。</li>
        <li><strong><code>to</code></strong> 是导航要前往的 <code>RouteContext</code>。守卫从最内层开始运行，遇到第一个拒绝就停下。守卫抛出异常时同样会留住页面。<code>close(result)</code> 同样要经过守卫，所以带着结果关闭之前，先把你的标记清掉。</li>
        <li>router 只能回到它自己写入的 history 条目。后退或前进到它没写过的条目（比如原生的 <code>#fragment</code> 链接，或其他脚本调用的 <code>pushState</code>）时，是不会询问的。</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() 与子 router",
        content: `
      <p><code>router.outlet()</code> 渲染页面，而 <code>router.matches(table)</code> 则按它自己的一张小表，渲染其他依赖当前位置的内容，比如侧栏、面包屑或工具栏，既不加载路由，也不增加页面：</p>
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
        <li><strong>匹配规则与路由表完全一致。</strong>模式、优先级、原始路径匹配和 <code>base</code> 剥离都是 router 自己的那一套，所以视图和页面对 URL 的理解永远一致。它读取最顶层图层的路径，和 <code>router.path</code> 一样。</li>
        <li><strong>视图</strong>是 <code>(params, ctx) =&gt; content</code>，<code>params</code> 的类型由模式推导而来，<code>ctx</code> 则是带着该视图 <code>pattern</code> 和 <code>params</code> 的 <code>RouteContext</code>。它也可以返回页面模块的 <code>import()</code>，模块到达后会以 <code>ctx</code> 去调用。</li>
        <li><strong>没有匹配就什么都不渲染。</strong>可以加一个 <code>'*'</code> 视图做兜底。和 outlet 一样，它在 <code>start()</code> 之前、<code>stop()</code> 之后都是空的。</li>
        <li><strong>只在路由变化时才重新渲染</strong>，所以凡是页面被保留的情况，视图也会保留它的 DOM。</li>
        <li><strong>惰性视图在模块到达之前什么也不渲染。</strong>失败的 <code>import()</code> 会用 <code>console.error</code> 记录，不会设置 <code>router.error</code>，并在下一次导航时重试；单纯的 <code>update()</code> 不会触发重试。</li>
        <li><strong>在服务端</strong>，惰性视图不会输出任何内容，因为它的模块是在客户端才到的。首屏 HTML 必须包含的内容，请使用同步视图。</li>
      </ul>
      <h3>子 router</h3>
      <p>路由本来就可以嵌套，所以子 router 通常就是一张嵌套表。其实只有一个 router：分区自己的 <code>'/'</code> 页面是它的外壳，子级渲染在这个页面的 <code>outlet()</code> 里，因此在分区内部导航时，外壳保持不变：</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>你也可以给这个功能配一个独立的 router，只创建，从不启动。父级只持有一条 catch-all，子级则用自己的模式、params 和回退去解析剩下的部分：</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>“从不启动”正是关键所在。<code>start()</code> 会挂上监听器，两个已启动的 router 会打架。代价是解析工作由子级自己负责，本该由已启动 router 来跑的路由加载器，也得你自己去调用。这种写法在路径尾部变化时同样会重建外壳，因为 router 只看到一条路由，其余部分都由外壳自行解析。只有嵌套表才能让 router 一直保持父级挂载，所以除非这个功能确实需要自己的 router、base 和回退，否则优先选嵌套表。</p>
    `,
      },
      {
        id: "router-multi",
        title: "多 router 与组合加载",
        content: `
      <p>应用里有多少个区域，就可以配多少个 router。想让这件事保持简单，只要守住一条规则：<strong>每个 document 只启动一个</strong>，其余的一律不启动，只用 <code>match()</code> 去解析 URL。只有已启动的 router 才拥有 URL、history 和点击监听器，其他的不过是供你查询的表，而且每个区域都能按自己的节奏加载，显示自己的加载指示器。</p>
      <h3>组合加载：一串加载器</h3>
      <p>匹配链上的每个页面都可以导出 <code>load()</code>。冷导航到子路由时，布局的加载器和页面的加载器会<strong>并行</strong>运行，由同一个 <code>router.pending</code> 覆盖整条链：在两者都 resolve 之前，前一个页面一直留在屏幕上，所以半加载的树永远不会被画出来。每个组件拿到的都是自己的 <code>data</code>：</p>
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
      <p>两个加载器是同时起跑的，而不是一个接一个。只要有一个还在等，<code>router.pending</code> 就是 true，其余时间为 false，已预加载或同步提供的路由不会把它设为 true。在 section 之间切换时布局会被保留，所以只有 section 的加载器会再跑一遍；布局的数据、它的 DOM 和写到一半的输入都原样保留。重新导航到同一个 URL，会重新运行叶子的加载器并重建它的那一行，和单页面的情况完全一样。</p>
      <h3>多重加载：带独立加载指示器的第二个 router</h3>
      <p>一个独立的区域，比如侧栏、托盘、实时面板，可以拥有自己的 router（只创建，从不启动）和自己的加载标记。<code>router.pending</code> 属于已启动的 router，与这个区域无关，所以两边可以并排加载，谁先完成都行：</p>
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
      <p>第二个 router 只管匹配，不做导航：<code>match()</code> 读取 URL 并返回一个上下文，与侧栏有关的东西都不会混进主路由表。<code>onNavigate</code> 会在每次导航解析完成后运行，首次导航也算，所以想让独立区域跟 URL 保持同步，这里是唯一该放的地方。</p>
      <ul>
        <li><strong><code>pending</code> 属于已启动的 router。</strong>从未启动的 router 没有 Route，也就没有 <code>pending</code> 和 <code>error</code>。区域自己维护标记，第二个加载指示器就能和第一个并排显示。演示里侧栏加载 800ms，而路由的加载器要跑 900ms，所以可能页面先好，也可能侧栏先好。</li>
        <li><strong><code>match()</code> 不会挂任何东西。</strong>同一个 document 里可以共存任意多个未启动的 router，每个都有自己的表、base 和模块缓存，没有一个会碰 history。它们的开销，只是一张表加一个匹配器。</li>
        <li><strong>它的加载器永远不会运行。</strong>已启动的 router 才会运行它所匹配页面的 <code>load()</code>，从未启动的 router 只负责解析。所以视图要是需要数据，就得自己去取，就像演示里的 <code>refreshSidebar()</code> 那样。如果你想要加载器，<a href="#router-matches">嵌套表</a>或<a href="#router-regions">由页面填充的区域</a>可以把这活儿留给已启动的 router。</li>
        <li><strong>当心过期的响应。</strong>慢吞吞的侧栏请求，不能落到你早已离开的 section 上。每次刷新都让请求序号计数器加一，丢掉不再匹配的响应，就像 router 会取消被后续导航取代的旧导航那样。</li>
        <li><strong>惰性的 <code>matches()</code> 视图同样没有 <code>pending</code>。</strong>模块到达之前，它什么也不渲染。三套加载机制，三块各自独立的“时钟”：路由的 <code>pending</code>、你自己的标记，以及一个尚未出现的惰性视图。</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "链接处理",
        content: `
      <p>委托监听器会处理 <code>&lt;a href&gt;</code> 上的左键点击（包括 SVG 的 <code>&lt;a&gt;</code>，以及点在其内部任意元素上的点击）并完成导航，其余情况一律让路：带修饰键的点击和中键点击、非 <code>_self</code> 的 <code>target</code>、<code>download</code>、<code>rel="external"</code>、跨源的 href、当前页面上只带哈希的链接、<code>base</code> 之外的路径、没有路由匹配的路径（这样服务端渲染的 404 依旧能访问到），以及应用的处理器已经调用过 <code>preventDefault()</code> 的任何事件。想让某个链接显式退出，加上 <code>data-nuclo-router="off"</code> 即可。</p>
      <h3>滚动</h3>
      <p>push 式导航会保留当前的滚动位置。如果新 URL 带着 <code>#hash</code>，且页面上有元素与之匹配，那个元素会被滚动到可见区域。<code>popstate</code> 则把滚动交给浏览器。想让新页面落在顶部，就在 <code>onNavigate</code> 里处理，它会告诉你导航是怎么发生的：</p>
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
      <h3>补充说明</h3>
      <ul>
        <li><strong>什么都不会残留。</strong>Route 持有的是页面函数和它的上下文，从不持有 DOM。导航离开，前一个页面就被释放。<code>stop()</code> 会释放监听器和进行中的加载，并清掉 <code>pending</code>，所以已停止的 Route 不会留下一个一直转圈的加载指示器。在 <code>stop()</code> 之后才 resolve 的模块，会被悄悄丢掉。</li>
        <li><strong>服务端并发安全。</strong><code>start()</code> 返回的是按请求隔离的状态，<code>run()</code> 又把它限定在一次同步渲染之内，所以交错的请求看不到彼此的路由，只有模块缓存是共享的。作用域在 <code>run()</code> 的函数返回时结束。<code>renderToString()</code> 是同步的，所以这样就够了。异步或流式渲染需要在 <code>await</code> 之间自己带着 Route，而 <code>run()</code> 不会替你做这件事。</li>
        <li><strong><code>popstate</code> 时的滚动恢复</strong>由浏览器负责（<code>scrollRestoration</code>），而不是 router。</li>
        <li><strong>每个 document 只启动一个 router。</strong>每次 <code>start()</code> 都会添加属于它自己的委托 <code>click</code> 监听器，第二个 router 的 <code>start()</code> 并不会停掉第一个，只有同一个 router 上的第二次 <code>start()</code> 才会。想用另一张表解析 URL，就创建一个 router，只调用 <code>match()</code>，它什么都不会挂。独立区域可以用这种方式，在路由的 <code>pending</code> 之外跑自己的加载。见<a href="#router-multi">多 router 与组合加载</a>。</li>
        <li><strong>有意不提供的功能：</strong>哈希 history 和内存 history，因为路由存在于 pathname 里，服务端必须能响应每一条路由；由同一个 URL 驱动的两个独立路由区域，因为页面可以用 <code>into()</code> 填充多个区域，但它们都隶属于唯一匹配到的那条路由，独立区域依然可以保留自己的未启动 router 和加载过程，见<a href="#router-multi">多 router 与组合加载</a>；还有悬停预加载，你可以在 <code>mouseenter</code> 里调用该路由自己的加载器来实现。</li>
      </ul>
      <h3>示例</h3>
      <p>仓库里有两个可运行的示例，互为补充，每一项设置都能在某处亲眼看到：</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>：对整套 API 的客户端巡礼。涵盖每种模式写法和优先级规则、链接处理的退出方式、带实时控件的每个 Route 成员、一个子 router、三层深的图层栈、挂在两个父级下的相对分区，以及带 <code>pending</code> 和 <code>error</code> 的路由加载器。它设置了 <code>preload: false</code>，好让这些状态保持可见。</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>：每个请求一次 <code>renderToString()</code>、可验证地接管服务端节点的 hydration、真实的 404 状态码、非根的 <code>base</code>、能在网络面板里观察到的空闲预加载，以及一个把数据从服务端交给客户端、让 hydration 不必再重新请求的加载器。</li>
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
      <p>Nuclo 没有专门的计算值 API，用一个普通函数，再在动态值里调用它就行：</p>
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
      <p>直接用 <code>async</code>/<code>await</code> 就好，状态每变一次，就调用一次 <code>update()</code>。拿一次 fetch 来说，就是 <code>await</code> 之前调一次，之后再调一次：</p>
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
        <li><strong>攒一批再更新。</strong>把要改的状态一次改完，最后只调用一次 <code>update()</code>。</li>
        <li><strong>动态值要算得快，也别带副作用。</strong>每次 <code>update()</code> 都会把它们全部跑一遍。</li>
        <li><strong>小而频繁的更新交给 <code>scope()</code></strong>，比如输入框或定时器。</li>
        <li><strong>渲染到 document 里。</strong><code>update()</code> 运行时不在 document 中的节点，会停止更新。</li>
        <li><strong>会变化的子节点用 <code>when()</code> 和 <code>list()</code></strong>，别用返回节点的函数。</li>
        <li><strong>用 <code>className</code>，别用 <code>class</code></strong>，动态类写成 <code>() =&gt; cx(...)</code> 或 <code>{ className: () =&gt; … }</code>。</li>
        <li><strong>样式在模块顶层定义</strong>，只定义一次。</li>
        <li><strong>服务端渲染：</strong>先渲染，再把 <code>getCssText()</code> 放进 <code>&lt;style id="nuclo-styles"&gt;</code>。请求数据以参数形式传入，输出里的 HTML 注释也要保留。</li>
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
      <p>所有公开函数，以及它们各自从哪里导入。</p>
      <h3><code>nuclo</code>（全局与命名导出）</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>：运行所有动态值，或只运行给定作用域内的。</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>：给元素指定作用域 id，供 <code>update(id)</code> 使用。</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>：条件内容，带 <code>.when()</code> 和 <code>.else()</code>。</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>：每项一行，按严格相等匹配。</li>
        <li><a href="#api-region"><code>region(options)</code></a> 和 <a href="#api-region"><code>into(id, ...content)</code></a>：在树里留一个命名的位置，再从任何地方往里填内容。</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>：事件监听器，也可以是 <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>。</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>：构建并追加。</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>：接管服务端 HTML。</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>：再次调用组件，并更新现有 DOM。</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>：由样式对象生成类。</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>：组合样式，后者优先。</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>：带主题的 <code>css</code>、<code>cx</code>、<code>variants</code>、<code>keyframes</code> 和 <code>globalStyle</code>。</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>：按选项生成样式。</li>
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
        <li><a href="#api-polyfill">一次副作用导入</a>，同时提供 <code>document</code>、<code>Event</code>、<code>CustomEvent</code>、<code>Node</code>、<code>Element</code>、<code>HTMLElement</code> 以及各个 <code>Nuclo*</code> 类。</li>
      </ul>
      <h3><code>nuclo-router</code>（独立包）</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>：router，带 <code>start()</code>、<code>match()</code>、<code>outlet()</code>、<code>matches()</code>、<code>go()</code>、<code>push()</code>、<code>href()</code> 和 <code>stop()</code>。</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>：让数据加载器与 chunk 同时起步的路由。</li>
        <li><a href="#router-api">类型</a>：<code>RouteContext</code>、<code>PageProps</code>、<code>Params</code>、<code>DataLoader</code>、<code>RouteTable</code> 等。</li>
      </ul>
      <h3>仅全局可用</h3>
      <ul>
        <li><a href="#tag-builders">175 个标签构建函数</a>：<code>div</code>、<code>span</code>、…、<code>var_</code>，以及 <code>svgSvg</code>、<code>pathSvg</code>、…。</li>
        <li><a href="#typescript-setup">类型</a>：<code>NodeModFn</code>、<code>NodeModLike</code>、<code>ExpandedElement</code> 等。<code>StyleResult</code> 之类的样式类型，也可以从 <code>'nuclo'</code> 导入。</li>
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
      <h3>改了状态，UI 就会更新吗？</h3>
      <p>不会。在你调用 <code>update()</code> 之前，DOM 会一直保持原样。</p>

      <h3>Nuclo 用了 signal、proxy 或虚拟 DOM 吗？</h3>
      <p>都没有。状态就是普通的 JavaScript。渲染一棵树时，Nuclo 创建的是真实的元素和文本节点；<code>update()</code> 会运行所有已注册的动态值（或者只运行给定作用域内的），值一变，就去更新现有节点。没有依赖图，也没有虚拟树。</p>

      <h3>页面上为什么显示了 "false"？</h3>
      <p>布尔值会被渲染成文本，所以 <code>div(ok &amp;&amp; span('Done'))</code> 会显示出 "false"。子节点请用 <code>when(() =&gt; ok, span('Done'))</code>，文本请写成 <code>ok ? 'Done' : ''</code>。</p>

      <h3>改了列表项，对应的行为什么没变？</h3>
      <p>仍在列表里的项，它的行会被保留，而不是重新渲染。会变的字段请用动态值，比如 <code>() =&gt; todo.text</code>。见 <a href="#api-list"><code>list()</code></a>。</p>

      <h3>UI 的一部分为什么不再更新了？</h3>
      <p>多半是因为 <code>update()</code> 运行时，这些节点不在 document 里。Nuclo 一旦停止跟踪它们，之后即使再挂回去也不会恢复，所以请渲染到一个已经位于 document 中的容器里。还有另外两个原因：条件抛出异常的 <code>when()</code> 会停止更新；第一次运行就抛出异常的文本函数，内容会一直为空。见 <a href="#api-update"><code>update()</code></a>。</p>

      <h3>什么时候该用 <code>forceUpdate()</code>？</h3>
      <p>只有静态值偶尔需要变化时才用，比如切换语言。其他情况一律用 <code>update()</code>。见 <a href="#api-force-update"><code>forceUpdate()</code></a>。</p>

      <h3>怎样把页面放进布局，又不用把它当 prop 一层层传下去？</h3>
      <p>用 <code>region({ id: 'main' })</code> 标出位置，再让页面返回 <code>into('main', …)</code>。见 <a href="#api-region"><code>region()</code> 与 <code>into()</code></a>。</p>

      <h3>怎么卸载一个应用？</h3>
      <p>把它包进 <code>when()</code>，再把条件关掉。自己手动移除 DOM 的话，<code>onDestroy</code> 是不会运行的。见<a href="#lifecycle">生命周期</a>。</p>

      <h3>Nuclo 自带 router 吗？</h3>
      <p>核心包里没有。路由单独以 <code>nuclo-router</code> 发布，支持服务端渲染、hydration、按路由代码分割和空闲预加载。用 <code>npm install nuclo nuclo-router</code> 安装即可。见 <a href="#router-overview">nuclo-router</a>。</p>

      <h3>Nuclo 有 effect 吗？</h3>
      <p>没有。<code>onMount</code> 和 <code>onDestroy</code> 对每个元素各运行一次，分别对应插入和移除，不会因为某个状态变了就再跑一遍。</p>
    `,
      },
    ],
  },

];
