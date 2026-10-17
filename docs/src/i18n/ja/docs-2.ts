import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "スタイリング",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>型付きのスタイルオブジェクトを、生成された CSS クラスに変換します。結果は任意のタグビルダーに渡せます。ブラウザでは、ルールは 1 つの <code>&lt;style id="nuclo-styles"&gt;</code> 要素に書き込まれます。サーバーでは <a href="#api-css-text"><code>getCssText()</code></a> がそれらを返します。</p>
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
        <li><code>css()</code> は基本の宣言に対して 1 つのクラスを作り、さらに各疑似キー、セレクター、メディアブロックごとに 1 つずつクラスを作ります。上のカードは 2 つのクラスを得ます。</li>
        <li>クラス名は内容のハッシュです。同一のスタイルはクラスを共有し、サーバーとクライアントは同じ名前を生成します。</li>
        <li>スタイルはモジュールレベルで一度だけ定義してください。<code>css()</code> はオブジェクト単位でキャッシュするため、呼び出しごとに新しいオブジェクトを渡すと毎回処理し直されます。</li>
        <li><code>css()</code> に渡した後でスタイルオブジェクトを変更しても何も起こりません。</li>
        <li>すべてのスタイルは、ページまたはサーバープロセスの生存期間中ずっと登録されたままです。データ由来の幅など、項目ごとに変わる値には <a href="#attributes"><code>style</code> 属性</a>を使ってください。</li>
      </ul>
      <h3>名前付きスタイル</h3>
      <p>最初に名前を渡すと、読みやすいクラス名になります。</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>基本クラスは名前そのものです。他のブロックは <code>name-&lt;hash&gt;</code> になります。</li>
        <li>名前は有効なクラス名である必要があります。そうでない場合、Nuclo は警告を出して名前を生成します。</li>
        <li>名前はグローバルです。2 つの異なるスタイルが同じ名前を使うと、Nuclo は警告します。</li>
      </ul>
      <h3>結果の使い方</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> と <code>card.className</code> はどちらもクラス名を返します。</p>
    `,
      },
      {
        id: "style-objects",
        title: "スタイルオブジェクト",
        content: `
      <p><code>css()</code> に渡すオブジェクトでは、一般的な CSS プロパティを camelCase で書き、一連のショートハンドと、疑似状態・セレクター・メディアクエリ用のネストしたキーを使います。TypeScript がそのすべてを補完します。<code>borderTopLeftRadius</code>、<code>fill</code>、<code>paddingInline</code> など型付きセットの外にあるプロパティは <code>raw</code> に書きます（後述）。</p>
      <h3>値</h3>
      <ul>
        <li>数値は <code>px</code> になります。ただし <code>0</code> と単位なしプロパティは例外です: <code>zIndex</code>、<code>opacity</code>、<code>fontWeight</code>、<code>lineHeight</code>、<code>flex</code>、<code>flexGrow</code>、<code>flexShrink</code>、<code>order</code>、<code>aspectRatio</code>、<code>gridColumn</code>、<code>gridRow</code>。<code>raw</code> では <code>zoom</code>、<code>scale</code>、<code>column-count</code>、<code>orphans</code>、<code>widows</code>、<code>tab-size</code>、<code>animation-iteration-count</code> も単位なしです。</li>
        <li>文字列は書かれたとおりに使われます。<code>null</code>、<code>undefined</code>、<code>false</code> はスキップされます。</li>
        <li><code>lineHeight</code>（および <code>leading</code>）は単位なしなので、<code>leading: 24</code> はフォントサイズの 24 倍を意味します。ピクセルにしたい場合は <code>"24px"</code> と書いてください。</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>ショートハンド</h3>
      <table>
        <thead><tr><th>キー</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>、<code>pt</code>、<code>pr</code>、<code>pb</code>、<code>pl</code></td><td>padding と各辺</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>左右の padding / 上下の padding</td></tr>
          <tr><td><code>m</code>、<code>mt</code>、<code>mr</code>、<code>mb</code>、<code>ml</code>、<code>mx</code>、<code>my</code></td><td>margin についても同様</td></tr>
          <tr><td><code>w</code>、<code>h</code>、<code>minW</code>、<code>maxW</code>、<code>minH</code>、<code>maxH</code></td><td>width、height と、それぞれの min と max</td></tr>
          <tr><td><code>size</code></td><td>width と height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>次のキーは <code>true</code> を取ります。</p>
      <table>
        <thead><tr><th>キー</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center（display は設定しません）</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>疑似状態</h3>
      <p><code>hover</code>、<code>focus</code>、<code>focusVisible</code>、<code>focusWithin</code>、<code>active</code>、<code>visited</code>、<code>disabled</code>、<code>enabled</code>、<code>checked</code>、<code>required</code>、<code>invalid</code>、<code>valid</code>、<code>readOnly</code>、<code>first</code>（<code>:first-child</code>）、<code>last</code>（<code>:last-child</code>）、<code>only</code>（<code>:only-child</code>）、<code>odd</code>、<code>even</code>、<code>empty</code>、<code>placeholderShown</code>、<code>placeholder</code>、<code>before</code>、<code>after</code>、<code>selection</code>、<code>marker</code>、<code>firstLine</code>、<code>firstLetter</code>。これらはネストできます。<code>hover: { focus: {…} }</code> は <code>:hover:focus</code> になります。</p>
      <h3>セレクターと at 規則</h3>
      <p><code>&amp;</code> で始まるキーはセレクターで、各 <code>&amp;</code> がクラスに置き換わります。<code>@</code> で始まるキーは at 規則です: <code>@media</code>、<code>@container</code>、<code>@supports</code>。</p>
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
        <li>キーは <code>&amp;</code> で始まる必要があります。<code>".dark &amp;"</code> のようなキーは無視されるので、<code>"&amp;:is(.dark *)"</code> と書いてください。</li>
        <li>ネストした 2 つの <code>@media</code> ブロックは <code>and</code> で結合されます。メディアタイプ（<code>print</code>、<code>only screen</code>）で始まるクエリは先頭に置かれます。文法上、タイプは先頭にしか置けないためです。平坦化できない組み合わせ（2 つのメディアタイプ、または先頭の <code>not</code>）は警告を出し、内側のクエリだけを使います。その他のネストした at 規則は外側のものを置き換えます。</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>任意のプロパティには <code>raw</code> を使い、名前は CSS とまったく同じ表記で書きます。数値には引き続き <code>px</code> が付くので、文字列を渡してください。</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>その他のフラットなキーは kebab-case に変換されてそのまま出力されるため、<code>colr: 'red'</code> のようなタイプミスはブラウザが破棄する宣言になります。疑似状態、スクリーン、<code>&amp;</code> キー、<code>@</code> キーのいずれでもないキーの下にネストしたオブジェクトは無視されます。どちらも TypeScript が報告します。</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>スタイルを結合します。2 つの入力が同じプロパティを設定している場合、後の入力が優先されます。</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>偽値の入力はスキップされ、配列は平坦化され、文字列は分割されて重複が除かれます。</li>
        <li>同じブロック（基本、同じ疑似状態、同じメディアクエリ）に対する生成クラスは 1 つの新しいクラスにマージされます。その他のクラス名はそのまま通過します。</li>
        <li>引数の順序を知っているのは <code>cx()</code> だけです。<code>div(base, blue)</code> では両方のクラスが追加され、最後に作成されたルールが優先されます。互いに上書きし合うスタイルは 1 つの <code>cx()</code> 呼び出しにまとめてください。</li>
        <li>名前付きスタイルのブロックが別の入力のブロックとマージされた場合、マージ後のクラスは名前そのものではなく <code>name-&lt;hash&gt;</code> になります。マージされないブロックはクラスを保つので、<code>cx(pageTitle, 'extra')</code> には引き続き <code>page-title</code> が含まれます。</li>
      </ul>
      <h3>動的なクラス</h3>
      <p>常に <code>cx(...)</code> を返す関数を渡します。</p>
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
      <p>この関数は初回実行時にスタイル結果を返す必要があります。<code>() =&gt; active &amp;&amp; activeButton</code> はクラスではなく "false" というテキストを描画します。</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>テーマに結び付けられた独自の <code>css</code>、<code>cx</code>、<code>variants</code>、<code>keyframes</code>、<code>globalStyle</code> を返します。テーマは値に名前を与えます。下のテーマでは <code>borderColor: 'border'</code> が <code>#e5e7eb</code> を出力し、TypeScript がその名前を補完します。<code>screens</code> の各エントリは、<code>md: {…}</code> のようなメディアクエリ用のスタイルキーになります。</p>
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
        <thead><tr><th>テーマキー</th><th>使用するプロパティ</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>、<code>backgroundColor</code>、<code>color</code>、<code>borderColor</code> と各辺、<code>outlineColor</code>、<code>caretColor</code>、<code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>、<code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>、<code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>、<code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td><code>md: {…}</code> のような新しいスタイルキー</td></tr>
        </tbody>
      </table>
      <ul>
        <li>テーマ名は値全体がその名前であるときだけ解決されます。<code>border: "1px solid primary"</code> は解決されません。</li>
        <li><code>@</code> を含まないスクリーン値は <code>@media &lt;value&gt;</code> になります。<code>@</code> で始まる値は書かれたとおりに使われます。例: <code>"@container (min-width: 400px)"</code>。</li>
        <li>スクリーンは <code>createCss()</code> で作ったインスタンスにしか存在しません。グローバルな <code>css()</code> にはありませんが、<code>@media</code> キーは受け付けます。</li>
        <li>すべてのインスタンスとグローバルヘルパーは 1 つのスタイルシートを共有します。スクリーンのメディアルールは使用順ではなくスクリーンの宣言順に出力されるため、<code>min-width</code> のスクリーンは小さい順に並べてください。アプリごとに <code>createCss()</code> インスタンスを 1 つにすれば、その順序はテーマで書いた順序になります。</li>
        <li>結果の <code>theme</code> は渡したテーマそのものです。</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>ボタンの意図やサイズのような一連のオプションに対してスタイルを返す関数を構築します。</p>
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
        <li>スタイルは次の順でマージされます: <code>base</code>、各グループで選ばれた値、そして一致する各 compound。プロパティごとに後のスタイルが優先されます。</li>
        <li>未指定、<code>undefined</code>、<code>null</code> のオプションはデフォルトを使います。デフォルトのないグループはスキップされます。</li>
        <li><code>true</code> と <code>false</code> のキーだけを持つグループは boolean を取ります。</li>
        <li>compound は、列挙したすべてのグループが一致したとき（デフォルトを含む）に適用されます。</li>
        <li>各選択は一度だけ構築され、キャッシュされます。</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() と globalStyle()",
        content: `
      <p><code>keyframes()</code> はアニメーションを登録し、生成された名前を返します。フレームのキーは <code>from</code>、<code>to</code>、および <code>"50%"</code> や <code>"0%, 100%"</code> のようなパーセンテージです。フレームはフラットなプロパティのみを取ります。同一のフレームは同じ名前を返します。</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> は任意のセレクターに対するルールを追加します。</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>セレクターは書かれたとおりに使われます。</li>
        <li>フラットなプロパティだけが機能します。疑似キー、スクリーン、<code>@</code> キーは無視されるので、<code>globalStyle()</code> でメディアルールは書けません。</li>
        <li>同じルールは一度だけ追加されます。同じセレクターに対する別のスタイルは 2 つ目のルールを追加し、後のものが優先されます。</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() と resetStyles()",
        content: `
      <p><code>getCssText()</code> は、このプロセス内で <code>css()</code>、<code>cx()</code>、<code>variants()</code>、<code>keyframes()</code>、<code>globalStyle()</code> が作成したすべてのルールを返します。基本ルールが先、続いて <code>@media</code>、<code>@container</code>、<code>@supports</code> ブロックの順です。サーバーサイドレンダリングに使ってください。</p>
      <ul>
        <li><code>renderToString()</code> の後に呼び出してください。レンダリング中に作成されたルールも含まれます。</li>
        <li>対象は 1 ページや 1 リクエストではなくプロセス全体で、増える一方です。クラス名が内容のハッシュなので、これは安全です。</li>
        <li><code>&lt;style id="nuclo-styles"&gt;</code> に入れてください。クライアントはその要素を再利用し、すでに含まれているルールをスキップします。別の id の場合や id がない場合、クライアントはすべてのルールを含む 2 つ目のスタイルシートを追加します。</li>
        <li>テキストはエスケープされないので、信頼できない入力をスタイル値に入れてはいけません。</li>
      </ul>
      <p><code>resetStyles()</code> はテスト用ヘルパーです。すべてのルールと <code>#nuclo-styles</code> 要素を削除します。以前に作成したスタイルはクラス名を保ちますが CSS を失います。アプリやサーバーで呼び出してはいけません。</p>
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
    title: "ルーティング",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>別パッケージ:</strong> <code>nuclo-router</code> は Nuclo のコアパッケージには含まれません。<code>nuclo</code> と並べてインストールしてください。プレビューリリースのため、API は今後変わる可能性があります。</div>
      <p>Nuclo のためのルーティングです。サーバーサイドレンダリング、ハイドレーション、コード分割されたルート、アイドル時のプリロードを、<code>list()</code> と <code>update()</code> の上に構築しています。gzip 後で約 ${NUCLO_ROUTER_GZIP_KB} KB、Nuclo 自体以外の依存はなく副作用もないため、未使用ならツリーシェイクで消えます。</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>または、同じ 2 つの名前で <code>pnpm add</code>、<code>yarn add</code>、<code>bun add</code> を使ってください。peer dependency として <code>nuclo</code> 0.3 以降が必要です。</p>
      <p>ルーターは<em>何を</em>読み込むかを決めます。アプリは <code>router.outlet()</code> で<em>どこに</em>置くかを示します。これはレイヤースタック全体に対する 1 つの <code>list()</code> で、レイヤーごとに 1 行なので、通常のページは 1 行だけです。サーバーとクライアントは同じツリーを構築するため、<code>hydrate()</code> はサーバーのノードを置き換えるのではなく引き継ぎます。それ以外はすべて <code>history</code>、1 つの委譲された <code>click</code> リスナー、そして <code>requestIdleCallback</code> です。</p>
      <h3>1 つのインポート</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> は、一致したルートのモジュールを解決してから戻るため、最初のツリーはサーバーとクライアントの両方で完全です。その後、ルーターは開始したルートを読み通します: <code>router.path</code>、<code>router.pending</code>、<code>router.go()</code>。</p>
      <h3>アプリ全体</h3>
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
      <p>これが統合のすべてです。リンクが動くのは、<code>&lt;a href&gt;</code> が単なる <code>&lt;a href&gt;</code> だからです。<code>document</code> 上の 1 つの委譲リスナーが、ルーターが所有するリンクを捕まえ、それ以外のリンクはすべてブラウザに任せます。</p>
      <p>サーバーでは、<code>start()</code> はリクエストごとに <code>Route</code> を返し、ルーター自体には触れないため、同時リクエストが互いのルートを見ることはありません。<code>route.run()</code> は、レンダリングの間、その Route をルーター（つまりアウトレット）が読む対象にします。ブラウザではページ読み込みごとに 1 つの Route があり、<code>start()</code> がそれをルーター自身のものにします。<code>run()</code> は必要ありません。</p>
      <p>ページは <a href="#router-api"><code>RouteContext</code></a> と <a href="#router-api"><code>PageProps</code></a> を <code>(ctx, { layer, data, outlet, beforeLeave })</code> として受け取り、引数を減らしても構いません。戻り値は <code>list()</code> が受け付けるものなら何でもよいです。レイアウトの別の部分も埋めたい場合は、<code>div(article(…), into('sidebar', nav(…)))</code> のようにページ内から <code>into()</code> を返します。そのコンテンツはページとともに去ります。<a href="#router-regions">ページとリージョン</a>を参照してください。</p>
    `,
      },
      {
        id: "router-patterns",
        title: "パターンとネストしたルート",
        content: `
      <table>
        <thead><tr><th>パターン</th><th>一致するもの</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>、<code>/docs/intro</code></td><td>そのパスと完全一致</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>一致しなかったすべて。404 用</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>優先順位は、静的パターン、次に宣言順の動的パターン、最後に最長プレフィックス優先のキャッチオールです。したがって <code>'*'</code> は他に何も一致しないものだけに一致し、テーブル内のどこに置いても構いません。末尾のスラッシュ、重複したスラッシュ、パーセントエンコーディングは正規化され、パラメーター値はデコード済みで届きます。マッチングはパターンごとのセグメント比較です。正規表現は構築も実行もされません。</p>
      <h3>相対ルート</h3>
      <p><code>./</code> で書かれたパターンはそれを宣言した親に対して相対で、<code>./</code> で書かれた href はアクティブなルートに対して相対です。この 2 つを組み合わせると、どの親の下でも同じ意味になる再利用可能なセクションができます。テーブルの値はローダーか、別のテーブル（そのキーはそのテーブルに対して相対）のどちらかです。</p>
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
      <p>この 2 行で、パスを二度書くことなく 6 つのパターンすべてが生まれます。両方の親が同じローダーオブジェクトを受け取るので、モジュールキャッシュと <code>import()</code> を 1 つ共有します。</p>
      <ul>
        <li>子テーブルの中では、<code>'./x'</code>、<code>'/x'</code>、<code>'x'</code> はすべて同じ意味で、<code>'/'</code> は親パスそのものを意味し、<code>'*rest'</code> はそのセクション専用のキャッチオールになります。ネストは好きなだけ深くできます。</li>
        <li>トップレベルのキーは書かれたとおりに使われるので、<code>'*'</code> は <code>'*'</code> のままです。</li>
        <li><code>*catch-all</code> の親の下に子を置くと <code>createRouter()</code> のエラーになります。キャッチオールはパターンの末尾でなければならないためです。</li>
      </ul>
      <h3>親ページと <code>outlet()</code></h3>
      <p>親とその子は本物の階層です。親がレンダリングされ、子は親が <code>outlet()</code> を呼び出した場所の内側にレンダリングされます。</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>子の間を移動しても親は再構築されません。その DOM ノードは同じノードなので、フォーカス、スクロール位置、入力途中の値、クロージャ内の状態はすべて生き残ります。</p>
      <ul>
        <li>子ルートを持たないページはアウトレットから何も描画しないので、レイアウトは無条件に呼び出せます。子を持つ親が <code>outlet()</code> を呼ばない場合、その子は飲み込まれます。</li>
        <li>インデックスルートはありません。<code>'/'</code> はレイアウトそのものなので、親パスは、内側に別のインデックスページを置くのではなく、空のアウトレットでレイアウトを描画します。ランディングコンテンツはレイアウト内に置くか、実際の子パスを与えてください。</li>
      </ul>
      <p>同じ呼び出しが、どちらの親からでも、また自分がどの親の中にいるか知らないページからでも機能します。</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>、<code>../x</code>、<code>.</code>、<code>..</code> は、URL の「ディレクトリ」ではなく現在のルートのパスに対して解決されます。<code>/invoices/42</code> からの <code>./preview</code> は <code>/invoices/42/preview</code> になります（ブラウザなら <code>/invoices/preview</code> と解釈するところです）。URL 末尾のスラッシュは何も変えません。<code>../</code> は 1 セグメント上がり、ルートで止まります。クエリとハッシュは引き継がれ、<code>base</code> が再付与され、解決後の絶対パスが history に入ります。これは React Router が <code>&lt;Link to="./x"&gt;</code> で行っているのと同じ、URL 解決からの逸脱です。</p>
      <ul>
        <li>ルート相対になるのは <code>./</code> と <code>../</code> だけです。href 内の素の <code>preview</code> は通常のブラウザの規則に任されます。</li>
        <li>相対リンクは <code>href="./preview"</code> を手書きするのではなく <code>router.href('./preview')</code> で組み立ててください。<code>href()</code> はレンダリング時に解決するため、出力されるマークアップは絶対パスになり、クローラー、中クリック、JavaScript 無効の環境でも正しく動きます。</li>
      </ul>
      <h3>何が保持され、何が再構築されるか</h3>
      <table>
        <thead><tr><th>ノード</th><th>ナビゲーション時</th></tr></thead>
        <tbody>
          <tr><td>パターンとパスが変わらない親</td><td><strong>保持</strong>: 同じノードで、<code>load()</code> は再実行されません</td></tr>
          <tr><td>一致したページ</td><td>パターンとパスが変わらず、<code>load()</code> を持たない場合は<strong>保持</strong>されるので、クエリやハッシュの変更ではページが保たれます。ローダーを持つルートは訪問のたびに更新されます。</td></tr>
          <tr><td>パスが変わった親</td><td>その下のすべてとともに再構築</td></tr>
          <tr><td>プッシュされたレイヤー</td><td>一致したページだけを描画します。その親はすでに下の行にマウントされています。</td></tr>
        </tbody>
      </table>
      <p>保持されたページは、構築時の <code>ctx</code> を保ちます。これがあらゆる場所での <code>ctx</code> の意味です。ライブな値は <code>router.*</code> から読んでください。フィルター、ページネーション、タブのようなクエリ駆動の状態は、動的な値の中で <code>router.search</code> を読み、<code>router.go('?page=2', { replace: true })</code> で書き込みます。ページ、そのフォーカス、入力途中の値はそのまま残ります。</p>
    `,
      },
      {
        id: "router-regions",
        title: "ページとリージョン",
        content: `
      <p><code>router.outlet()</code> はページを 1 か所に置きます。レイアウトの別の場所にサイドバー、ツールバー、見出しも必要なページは、<a href="#api-region"><code>into()</code></a> でそこを埋めます。レイアウトは <code>region()</code> でその場所を示し、ページは自身のコンテンツの隣に <code>into()</code> を返します。レイアウトがページのコンテンツを prop として受け取ることはなく、ナビゲーションがレイアウトを再構築することもありません。</p>
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
      <p>ページのコンテンツはアウトレットの <code>list()</code> の 1 行であり、<code>into()</code> はそれを保持する行と同じ寿命を持ちます。したがってサイドバーのコンテンツはページとともに到着し、ページとともに去ります。<code>into('sidebar', …)</code> を持たないページに移動すると、リージョンの <code>empty</code> コンテンツが再び表示されます。両方の部分は同じ関数で構築されるので、ページは <code>ctx</code> と <code>data</code> をどちらにも使えます。</p>
      <h3>ナビゲーション時に起こること</h3>
      <ul>
        <li><strong>保持されたページはリージョンも保持します。</strong><a href="#router-patterns">ページを保持する</a>クエリやハッシュの変更は、リージョンのコンテンツにも触れません。サイドバーがクエリに依存する場合は、動的な値の中で <code>router.search</code> を読んでください。</li>
        <li><strong>再構築されたページはリージョンを埋め直します。</strong>ルートが変わると古い行が削除され、新しいページの <code>into()</code> ビューが引き継ぎます。何も残りません。</li>
        <li><strong>プッシュされたレイヤーはビューを追加します。</strong>レイヤーはアウトレットの後の行なので、その <code>into()</code> は同じリージョンのより新しいビューです。デフォルトの <code>type: 'latest'</code> では、レイヤーが閉じるまでページのビューを覆い、閉じるとページのビューが再び表示されます。<code>type: 'stack'</code> では両方が表示されます。</li>
        <li><strong>親ページもリージョンを埋められます。</strong>親は再構築されないため、子が変わってもそのビューは残ります。</li>
        <li><strong>サーバーサイドレンダリングはそのまま動きます。</strong>サーバーは <code>route.run()</code> の中でページを構築するので、その <code>into()</code> ビューは HTML に含まれ、<code>hydrate()</code> がそれらを引き継ぎます。</li>
      </ul>
      <h3>1 つのページから複数のリージョンへ</h3>
      <p>複数のリージョンを一度に埋めるにはオブジェクトを渡します。ページの主コンテンツは引き続きアウトレットを通るので、<code>into()</code> の隣に返してください。</p>
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
      <h3>どの仕事にどのツールを使うか</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> は子ルート用です。URL が決めるコンテンツを、親ページの内側に描画します。<a href="#router-patterns">ネストしたルート</a>を参照してください。</li>
        <li><strong><code>into()</code></strong> は、一致したページがレイアウト全体に自身を広げるためのものです。コンテンツはページに属し、ページのデータを使います。</li>
        <li><strong><code>matches()</code></strong> は、レイアウトが URL だけから判断するためのものです。独自の小さなテーブルを持ち、ページは関与しません。<a href="#router-matches"><code>matches()</code></a> を参照してください。</li>
      </ul>
      <p>これらはすべて、1 つの一致したルートに属します。ルーターは 1 つの URL から 2 つの独立した領域を駆動しないため、独自のルートを持つサイドバーは、2 つ目のアウトレットではなくページが埋めるリージョンです。本当に独自のルーター、ローディング、フォールバックを持ちたいサイドバーは、開始しないルーターを 1 つ保持して <code>match()</code> で解決します。<a href="#router-multi">複数のルーターと複合ローディング</a>を参照してください。</p>
    `,
      },
      {
        id: "router-loaders",
        title: "ルートローダーとコード分割",
        content: `
      <p>ページモジュールは <code>load</code> 関数をエクスポートできます。これはページが構築される前に、そのルートへのナビゲーションごとに実行され、戻り値は <code>data</code> としてページに渡されます。</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>ルートテーブルは変わりません。ローダーはページとともに移動します。一致した <code>RouteContext</code> を受け取るので、<code>params</code>、<code>search</code>、<code>path</code> がすべて使えます。同期でも非同期でもよく、サーバーでも実行されるため、サーバーレンダリングされたページは、ハイドレーション後にフェッチするのではなく、データを HTML に含めた状態で配信されます。</p>
      <p><strong>モジュールはキャッシュされます。データはキャッシュされません。</strong>ルートのチャンクは一度フェッチされて再利用され、そのローダーはナビゲーションごとに再実行されます。だからこそ <code>/blog/a</code> と <code>/blog/b</code> が混同されることはなく、失敗したローダーは単純に再試行できます。</p>
      <table>
        <thead><tr><th>状況</th><th>挙動</th></tr></thead>
        <tbody>
          <tr><td>実行中</td><td><code>router.pending</code> が true になり、現在のページは表示されたままです</td></tr>
          <tr><td>throw または reject した</td><td><code>router.error</code> に入ります。<code>go()</code> は引き続き決して reject せず、ナビゲーションは再試行できます。</td></tr>
          <tr><td><code>start()</code> の間</td><td>reject は <code>start()</code> から出てきます。それを載せる Route がまだないためです。</td></tr>
          <tr><td>プッシュされたレイヤー</td><td>独自のローダーを実行し、独自のデータを持ちます</td></tr>
          <tr><td>アイドル時のプリローダー</td><td>モジュールのみを温めます。渡すコンテキストがなく、開かれないかもしれないルートのデータをフェッチすることになるためです。</td></tr>
          <tr><td>同じ URL への再ナビゲーション</td><td>ローダーが再実行され、行が再構築されます。ローダーのないルートは行を保持します。</td></tr>
        </tbody>
      </table>
      <p>再検証するには、history エントリを追加せずに現在地へナビゲートします。</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>データをチャンクと同時に開始する</h3>
      <p>ページモジュールがエクスポートする <code>load</code> は、そのモジュールが届いてからしか実行できないため、コールドナビゲーションではチャンク、次にデータの順でフェッチします。両方を同時に開始するには、<code>withLoad()</code> でテーブル内にローダーを宣言します。</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>これはモジュール自身の <code>load</code> を置き換え、同様に訪問ごとに実行されます。チャンクの読み込み中の reject は、他と同様に <code>router.error</code> に入ります。</p>
      <p>サーバーデータの HTML へのシリアライズは、意図的に行いません。クライアントの <code>load</code> はハイドレーション時に再実行されます。それが問題になる場合は、サーバーに <code>route.data</code> を、たとえば <code>window.__DATA__</code> として出力させ、ローダーがそれを先に取るようにしてください。<code>route.data</code> は一致したページのデータだけです。親の <code>load()</code> の結果は含まれません。</p>
      <h3>コード分割とプリロード</h3>
      <p>ルートの値は常にページコンポーネントを返す関数なので、コンポーネントには遅延して到達します。</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>モジュール形式のものだけが <code>load</code> エクスポートを持てます。<code>.then(m =&gt; m.BPage)</code> で名前付きコンポーネントを選ぶと、ルーターには関数だけが渡されます。</p>
      <p>各モジュールは一度だけインポートされ、キャッシュされます。同じルートへの同時ナビゲーションは 1 つの <code>import()</code> を共有します。ユーザーがページを <code>idleTimeout</code>（デフォルトで 1 秒。タップ、キー、ホイール、スクロールがない状態）の間放置すると、残りのルートがバックグラウンドで、アイドルスライス（<code>requestIdleCallback</code>）ごとに 1 つずつ読み込まれます。何らかの入力や、ユーザーが待っているナビゲーションがあると、ページが再びアイドルになるまで一時停止します。</p>
      <p>プリロード済みまたは eager なルートは <code>router.pending</code> を決して切り替えず、次の描画の前に着地します。スピナーのフレームもレイアウトシフトもありません。<code>router.pending</code> は、待たなければならないモジュールやローダーがあるときだけ true になり、その間は離脱中のページが画面に残ります。読み込みに失敗したチャンクは、未処理の reject ではなく <code>router.error</code> として現れ、単純に再試行できます。</p>
    `,
      },
      {
        id: "router-api",
        title: "ルーター API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> はパターンをローダー、またはネストしたテーブルに対応付けます。オプション:</p>
      <table>
        <thead><tr><th>オプション</th><th>デフォルト</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>アプリが配信される URL プレフィックス。例: <code>'/docs'</code>。セグメント境界でのみ一致します: <code>/docs/intro</code> は <code>'/docs'</code> の内側ですが、<code>/docsearch</code> はそうではありません。その外側の URL は何にも一致しないため、<code>start()</code> は reject し（サーバー側の 404）、それらへのリンクはブラウザに任されます。</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>ページがアイドルになったら、残りのルートのモジュールをバックグラウンドで読み込みます。<code>false</code> で無効になります。</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>プリロードを開始する（またはユーザーの操作後に再開する）までの、タップ、キー、ホイール、スクロールのないミリ秒数。</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>。ブラウザで解決されたすべてのナビゲーション（最初のものを含む）の後、DOM が追いついた時点で呼ばれます。<code>kind</code> は <code>'start'</code>、<code>'push'</code>、<code>'replace'</code>、<code>'pop'</code>（戻る、進む、<code>close()</code>）、<code>'layer'</code> のいずれかです。<code>document.title</code>、メタタグ、フォーカス、スクロール、アナリティクスのためのフックです。SSR 中は呼ばれません。</td></tr>
        </tbody>
      </table>
      <p>ルーターを返します: <code>start()</code>、<code>match()</code>、<code>outlet()</code>、<code>matches()</code>、および <code>run()</code> を除くすべての <code>Route</code> メンバーで、これらはアクティブな Route を読み通します。アクティブな Route とは、ブラウザでは最後の <code>start()</code> が返したもの、サーバーでは <code>run()</code> が実行中のものです。どちらもない状態でメンバーを読むと throw します。ルートテーブル、コンパイル済みのマッチャー、モジュールキャッシュはルーター上にあるので、サーバーではリクエスト間で共有されます。</p>
      <h3><code>router.start(url?)</code></h3>
      <p><code>url</code>（デフォルト: ブラウザでは <code>location.href</code>）をページモジュールに解決し、<code>Promise&lt;Route&gt;</code> を返します。何にも一致せず、テーブルに <code>'*'</code> ルートがない場合は reject します。サーバーでは、それが 404 です。ブラウザではさらに、その Route をルーターのアクティブなものにし、<code>popstate</code> と委譲された <code>click</code> リスナーを取り付け、プリロードをスケジュールします。2 回目の <code>start()</code> は以前の Route を自動的に退役させます。サーバーでは共有されるものには何も触れないので、<code>route.run()</code> の中でレンダリングしてください。</p>
      <h3><code>router.match(url?)</code></h3>
      <p>何も読み込まずに URL をテーブルに対して解決します。インポートも、history も、リスナーも、Route もありません。<code>RouteContext</code> を返すか、URL が <code>base</code> の外、どのパターンにも一致しない、またはブラウザで別オリジンの場合は <code>null</code> を返します。<code>./</code> の解決にはアクティブなルートが必要なため、絶対 URL のみです。</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>アクティブなルートのページを <code>list()</code> として返します。ページを置きたい場所に一度だけ配置してください。プッシュされたレイヤーはその後の行です。<code>start()</code> が解決する前と <code>stop()</code> の後は空です。サーバーでは、<code>run()</code> が実行中の Route を描画します。</p>
      <h3><code>router.matches(table)</code></h3>
      <p>アクティブなルートのパスが一致する、2 つ目のテーブルのビューを、任意の場所に置ける <code>list()</code> として描画します。<a href="#router-matches"><code>matches()</code></a> を参照してください。</p>
      <h3><code>Route</code></h3>
      <p><code>run()</code> 以外のすべてのメンバーはルーター上にもあり、アプリはそこから読みます。</p>
      <table>
        <thead><tr><th>メンバー</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>、<code>pattern</code>、<code>params</code>、<code>search</code>、<code>hash</code>、<code>url</code></td><td>アクティブな一致。<code>search</code> は <code>URLSearchParams</code> です。<code>search</code>、<code>hash</code>、<code>url</code> はライブです。</td></tr>
          <tr><td><code>pending</code></td><td>ナビゲーションがモジュールまたはローダーを待っています</td></tr>
          <tr><td><code>error</code></td><td>最後に失敗した読み込み。次のナビゲーションでクリアされます</td></tr>
          <tr><td><code>data</code></td><td>一致したページの <code>load()</code> が返したもの。サーバーがシリアライズするためのものです。親のものは含まれません。</td></tr>
          <tr><td><code>depth</code></td><td>スタック上のレイヤー数（通常のページでは 1）</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>必要ならモジュールを読み込んでナビゲートします。決して reject しません。reject または throw で失敗したモジュールは <code>error</code> に入ります。</td></tr>
          <tr><td><code>push(href)</code></td><td>ルートを新しいレイヤーとして上に開き、そのレイヤーが閉じる際の値で解決します。<code>./</code> を受け付けます。一致なしやモジュールの失敗では reject します。</td></tr>
          <tr><td><code>href(path)</code></td><td><code>a({ href })</code> のために、パスに <code>base</code> を前置します。<code>./</code> と <code>../</code> をアクティブなルートに対して解決します。</td></tr>
          <tr><td><code>stop()</code></td><td>すべてのリスナーを外し、開いているレイヤーを閉じ、アウトレットを空にします。冪等です。停止した Route は最後の一致を引き続き返し、<code>go()</code> は何もしません。</td></tr>
          <tr><td><code>run(fn)</code></td><td>この Route をルーターのアクティブなものとして <code>fn</code> を呼び、その結果を返します: サーバーでの <code>route.run(() =&gt; renderToString(App))</code>。同期のみです。<code>fn</code> が戻ると Route はアクティブでなくなります。</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>ページの第 1 引数: <code>path</code>、<code>pattern</code>、<code>params</code>、<code>search</code>、<code>hash</code>、<code>url</code>。ページが構築されたときのコンテキストです。ライブな値は <code>router.*</code> から読んでください。両者が異なるのは、再構築なしにクエリやハッシュが変わった場合だけです。</p>
      <p><code>params</code> はデフォルトで <code>{ [name]: string }</code> です。ページは <code>Params</code> を使って自身のパターンから型付けできます。<code>'/blog/:slug'</code> は <code>{ slug: string }</code> に、<code>'/files/*rest'</code> は <code>{ rest: string }</code> になります。</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>ページの第 2 引数。ページに必要なものを分割代入してください。</p>
      <table>
        <thead><tr><th>プロパティ</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>スタック内でのページの位置。下の <code>Layer</code> を参照してください。</td></tr>
          <tr><td><code>data</code></td><td>ルートの <code>load()</code> が返したもの。ない場合は <code>undefined</code>。<code>PageProps&lt;TData&gt;</code> で型付けします。</td></tr>
          <tr><td><code>outlet</code></td><td>親ページが子ルートを描画する場所。<a href="#router-patterns">ネストしたルート</a>を参照してください。</td></tr>
          <tr><td><code>beforeLeave</code></td><td>このページが破棄される前に問い合わせられるガードを登録します。<a href="#router-layers">離脱ガード</a>を参照してください。</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>スタック内でのページの位置と、そこから出る方法。</p>
      <table>
        <thead><tr><th>メンバー</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>ベースページでは 0、プッシュされたレイヤーでは 1 以上</td></tr>
          <tr><td><code>push(href)</code></td><td>ページ内から別のレイヤーを開きます。<code>Route.push()</code> と同じです</td></tr>
          <tr><td><code>close(result?)</code></td><td>このレイヤーとその上のすべてを閉じ、開いた <code>push()</code> を解決します。引数なしは「閉じられた（dismissed）」を意味します。depth 0 では何もしません。</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> と <code>withLoad()</code></h3>
      <p><code>DataLoader</code> は <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code> で、ページモジュールの任意の <code>load</code> エクスポートです。<code>withLoad(loader, load)</code> は、チャンクのインポートの後ではなく、その隣で <code>load</code> を開始するルートを作ります。<a href="#router-loaders">ルートローダー</a>を参照してください。</p>
      <h3>型</h3>
      <p>すべての型は <code>nuclo-router</code> の名前付きエクスポートなので、ページ、ローダー、ガードはパスからインポートせずに型付けできます。</p>
      <table>
        <thead><tr><th>型</th><th>内容</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>パターンに対する params オブジェクト。<code>RouteParams</code> は型なしの形、<code>Match</code> はマッチャーの結果です。</td></tr>
          <tr><td><code>PageComponent</code></td><td>ページ: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>ページモジュール: コンポーネントそのもの、または <code>import()</code> が返す <code>{ default, load? }</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>。<code>withLoad()</code> 由来の <code>load</code> を持つこともあります</td></tr>
          <tr><td><code>RouteTable</code></td><td><code>createRouter()</code> が受け取るテーブル: パターンからローダー、またはネストしたテーブルへ</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>。<code>go()</code> の第 2 引数</td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>。<code>onNavigate</code> の第 2 引数</td></tr>
          <tr><td><code>Outlet</code></td><td><code>PageProps</code> の <code>outlet()</code> の型</td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>。<code>beforeLeave()</code> が受け取るもの</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code> のビュー: params を受け取り、コンテンツまたはページの <code>import()</code> を返します</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "レイヤーと離脱ガード",
        content: `
      <p><code>push()</code> は、現在のルートを置き換えるのではなくその上にルートを開き、そのレイヤーが閉じる際の値で解決します。ページはスタック全体に対する 1 つの <code>list()</code> なので、レイヤーを開くことは追加（append）です。下のページは再レンダリングされないため、その DOM、フォーカス、入力途中のフォームは、レイヤーが閉じたときにもすべてそこにあります。</p>
      <p>これにより、「まだ存在しないレコードが必要」というフローを、ユーザーが入力中のフォームを捨てることなく実現できます。</p>
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
      <p>レイヤーはネストします。独自のダイアログを必要とするダイアログは、Route を参照せずに <code>layer.push()</code> を呼んで await します。</p>
      <ul>
        <li><strong>URL は最上位のレイヤーです。</strong><code>push()</code> は history エントリを追加するので、レイヤーはリンク可能で、「戻る」で閉じられ、その <code>push()</code> は Cancel とまったく同じく「閉じられた」として解決します。「戻る」と <code>close()</code> は 1 つのコードパスです。<code>close()</code> は結果を記録して history を戻し、<code>history.state</code> 内の depth が正となります。ブラウザはタブごとに約 50 エントリしか保持しないため、レイヤーを長く辿った後には下のエントリが消えていることがあります。その場合 <code>close()</code> はレイヤーをその場で閉じ、現在のエントリを表示されたまま残るページに書き換えます。</li>
        <li><strong>通常のナビゲーションはスタックをクリアします。</strong>リンクのクリックや <code>go()</code> はレイヤーではありません。すべてを置き換え、開いているレイヤーをすべて閉じるので、await したまま取り残される呼び出し元はありません。</li>
        <li><strong>コールドロードは独立したページです。</strong>URL は最上位のレイヤーを示しますが、その下のスタックは示さないため、レイヤーの URL を直接開くと、depth 1 で、<code>layer.depth === 0</code> かつ無効な <code>close()</code> を持つ状態で描画されます。プッシュされるルートは単独でも意味を持つ必要があります。<code>layer.depth</code> で分岐して、機能しない Cancel ボタンの代わりに外へ出るリンクを用意してください。</li>
        <li><strong>Promise はリロードを生き延びられません。</strong>クロージャの中にあるためです。結果は、遠回りでも動くフローの近道として扱ってください。</li>
        <li><strong>何も await したまま取り残されません。</strong><code>stop()</code> は開いているレイヤーをすべて閉じ、ナビゲーションによって放棄されたレイヤーは <code>undefined</code> で解決します。</li>
      </ul>
      <h3>離脱ガード</h3>
      <p>入力途中のフォームのような、残しておく価値のあるものを持つページはガードを登録します。ガードはページが破棄される前に問い合わせられ、<code>false</code>（またはその Promise）を返すとページが保持されます。</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>ページが去るときだけ。</strong>レイアウト下での子のナビゲーションや、ページを保持するクエリやハッシュの変更では問い合わせられません。ガードはページとともに生まれ、ページとともに消えるので、解除するものはありません。</li>
        <li><strong>あらゆる出口で。</strong>リンク、<code>go()</code>、戻る・進む、レイヤーの <code>close()</code>、そしてルーターが所有しない URL への <code>go()</code>（アプリを離れる場合。<code>to</code> は <code>null</code>）。拒否された戻る・進むは巻き戻されるので、アドレスバーはそのページのままです。タブを閉じたりリロードしたりするのは <code>beforeunload</code> の仕事です。</li>
        <li><strong><code>to</code></strong> はナビゲーションの行き先の <code>RouteContext</code> です。ガードは最も内側から順に実行され、最初の拒否で止まります。throw したガードはページを保持します。<code>close(result)</code> もガードを通るので、結果を持って閉じる前にフラグをクリアしてください。</li>
        <li>ルーターは自身が書いた history エントリしか巻き戻せません。ネイティブの <code>#fragment</code> リンクや別のスクリプトの <code>pushState</code> のような、ルーターが書いていないエントリへの戻る・進むでは問い合わせられません。</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() とサブルーター",
        content: `
      <p><code>router.outlet()</code> はページを描画します。<code>router.matches(table)</code> は、サイドバー、パンくず、ツールバーのように現在地に依存する別のものを、独自の小さなテーブルから、ルートを読み込んだりページを追加したりせずに描画します。</p>
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
        <li><strong>ルートテーブルと同じマッチング。</strong>パターン、優先順位、生パスのマッチング、<code>base</code> の除去はルーター自身のものなので、ビューとページは URL について常に一致します。<code>router.path</code> と同様に、最上位レイヤーのパスを読みます。</li>
        <li><strong>ビュー</strong>は <code>(params, ctx) =&gt; content</code> です。<code>params</code> はそのパターンから型付けされ、<code>ctx</code> はビューの <code>pattern</code> と <code>params</code> を持つ <code>RouteContext</code> です。代わりにページモジュールの <code>import()</code> を返してもよく、その場合は到着後に <code>ctx</code> で呼び出されます。</li>
        <li><strong>何も一致しなければ何も描画されません。</strong>フォールバックには <code>'*'</code> ビューを追加してください。アウトレットと同様に、<code>start()</code> の前と <code>stop()</code> の後は空です。</li>
        <li><strong>再描画されるのはルートが変わったときだけ</strong>なので、ページを保持するあらゆる変更の間、ビューは DOM を保ちます。</li>
        <li><strong>遅延ビューはモジュールが届くまで何も描画しません。</strong>失敗した <code>import()</code> は <code>console.error</code> でログされ、<code>router.error</code> は設定せず、次のナビゲーションで再試行されます。単なる <code>update()</code> では再試行されません。</li>
        <li><strong>サーバーでは</strong>遅延ビューは何も出力しません。そのモジュールはクライアントで着地するためです。最初の HTML に含めなければならないものには同期ビューを使ってください。</li>
      </ul>
      <h3>サブルーター</h3>
      <p>ルートはネストするので、サブルーターは通常、単にネストしたテーブルです。ルーターは 1 つで、セクション自身の <code>'/'</code> ページがそのクロームとなり、子はそのページの <code>outlet()</code> に描画されるため、セクション内のナビゲーションの間クロームは生き残ります。</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>あるいは、その機能に専用のルーターを与えます。作成はするが決して開始しないルーターです。親は単一のキャッチオールエントリを所有し、子は残りのパスを自身のパターン、パラメーター、フォールバックに対して解決します。</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>決して開始しないことが要点です。<code>start()</code> がリスナーを取り付けるものであり、開始された 2 つのルーターは衝突します。その代償として、解決は子が所有するので、開始されたルーターが実行するルートローダーは自分で呼び出すことになります。またこの形では、ルーターはルートを 1 つしか見ておらず、残りはシェルが自ら解決するため、残りのパスが変わるとシェルが再構築されます。ルーターがマウントし続ける親を得られるのはネストしたテーブルなので、その機能が本当に独自のルーター、base、フォールバックを必要とするのでなければ、ネストしたテーブルを優先してください。</p>
    `,
      },
      {
        id: "router-multi",
        title: "複数のルーターと複合ローディング",
        content: `
      <p>アプリは領域の数だけルーターを持てます。これを単純に保つ規則は、<strong>ドキュメントごとにちょうど 1 つだけ開始する</strong>こと、そして他のすべてのルーターは開始せず、<code>match()</code> で URL を解決させることです。URL、history、クリックリスナーを所有するのは開始されたルーターだけです。残りは問い合わせるためのテーブルであり、各領域は独自のタイミングで、独自のスピナーとともに読み込めます。</p>
      <h3>複合ローディング: ローダーの連鎖</h3>
      <p>一致した連鎖上のすべてのページは <code>load()</code> をエクスポートできます。子ルートへのコールドナビゲーションでは、レイアウトのローダーとページのローダーが<strong>並行して</strong>実行され、1 つの <code>router.pending</code> が連鎖全体をカバーします。両方が解決するまで前のページが画面に残るので、半分だけ読み込まれたツリーが描画されることはありません。各コンポーネントは自身の <code>data</code> を受け取ります。</p>
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
      <p>両方のローダーは順番ではなく同時に開始します。<code>router.pending</code> はどちらかが await されている間 true で、それ以外は false です。プリロード済みまたは eager なルートは決してこれを切り替えません。セクション間の移動ではレイアウトが保持されるので、セクションのローダーだけが再実行されます。レイアウトのデータ、その DOM、入力途中の値はすべて生き残ります。同じ URL への再ナビゲーションは、単一ページの場合とまったく同様に、末端のローダーを再実行してその行を再構築します。</p>
      <h3>複数のローディング: 独自のスピナーを持つ 2 つ目のルーター</h3>
      <p>サイドバー、トレイ、ライブリージョンのような独立した領域には、作成はするが決して開始しない専用のルーターと、独自のローディングフラグを与えます。<code>router.pending</code> は開始されたルーターのものであり、この領域については何も語らないため、2 つは並んで読み込め、どちらが先に終わっても構いません。</p>
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
      <p>2 つ目のルーターは問い合わせられるだけで、指示されることはありません。<code>match()</code> は URL を読んでコンテキストを返し、サイドバーに関するものはメインのルートテーブルには一切入りません。<code>onNavigate</code> は解決されたすべてのナビゲーション（最初のものを含む）の後に実行されるので、独立した領域を URL と同期させる唯一の場所です。</p>
      <ul>
        <li><strong><code>pending</code> は開始されたルーターのものです。</strong>開始されていないルーターには Route も、<code>pending</code> も、<code>error</code> もありません。領域は独自のフラグを管理し、2 つ目のスピナーを最初のものの隣に置けます。デモではサイドバーが 800ms、ルートのローダーが 900ms かけて読み込むので、ページが先に終わることも、逆になることもあります。</li>
        <li><strong><code>match()</code> は何も取り付けません。</strong>開始されていないルーターはいくつでもドキュメントを共有できます。それぞれが独自のテーブル、base、モジュールキャッシュを持ち、どれも history には触れません。コストはテーブルとマッチャー 1 つ分です。</li>
        <li><strong>そのローダーは決して実行されません。</strong>開始されたルーターは、一致したページの <code>load()</code> を実行します。開始されていないルーターは解決するだけなので、そのビューにデータが必要なら自分でフェッチしてください。デモの <code>refreshSidebar()</code> がそれです。ローダーを使いたいなら、<a href="#router-matches">ネストしたテーブル</a>か<a href="#router-regions">ページが埋めるリージョン</a>にすれば、その仕事は開始されたルーターに残ります。</li>
        <li><strong>古い応答を防いでください。</strong>遅いサイドバーのフェッチが、すでに離れたセクションに着地してはいけません。更新ごとに世代カウンターを進め、一致しなくなった応答を捨ててください。ルーター自身が追い越されたナビゲーションを退役させるのと同じ方法です。</li>
        <li><strong>遅延 <code>matches()</code> ビューにも <code>pending</code> はありません。</strong>モジュールが着地するまで何も描画しません。3 つのローディングの仕組みに 3 つの独立したタイミングがあります: ルートの <code>pending</code>、自前のフラグ、そして単にまだ存在しない遅延ビューです。</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "リンクの処理",
        content: `
      <p>委譲リスナーは <code>&lt;a href&gt;</code> への左クリック（SVG の <code>&lt;a&gt;</code> や、その内側にネストした要素へのクリックを含む）をナビゲートし、それ以外のすべてには手を出しません: 修飾キー付きクリックと中クリック、<code>_self</code> 以外の <code>target</code>、<code>download</code>、<code>rel="external"</code>、クロスオリジンの href、現在のページ内のハッシュのみのリンク、<code>base</code> の外側のパス、どのルートにも一致しないパス（これによりサーバーレンダリングされた 404 にも到達できます）、そしてアプリのハンドラーがすでに <code>preventDefault()</code> を呼んだイベント。<code>data-nuclo-router="off"</code> でリンクを明示的に除外できます。</p>
      <h3>スクロール</h3>
      <p>プッシュによるナビゲーションは現在のスクロール位置を保ちます。新しい URL にページ内の要素と一致する <code>#hash</code> がある場合、その要素がスクロールして表示されます。<code>popstate</code> ではスクロールはブラウザに任せます。新しいページを先頭から表示したい場合は、ナビゲーションがどのように起きたかを教えてくれる <code>onNavigate</code> で行います。</p>
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
      <h3>補足</h3>
      <ul>
        <li><strong>何も保持しません。</strong>Route はページ関数とそのコンテキストを保持しますが、DOM は決して保持しません。離れると前のページは解放されます。<code>stop()</code> はリスナーと進行中の読み込みを解放し、<code>pending</code> をクリアするので、退役した Route がスピナーを取り残すことはありません。<code>stop()</code> の後に解決したモジュールは黙って破棄されます。</li>
        <li><strong>サーバーで並行安全です。</strong><code>start()</code> はリクエストごとの状態を返し、<code>run()</code> はそれを 1 回の同期レンダリングにスコープするので、交錯するリクエストが互いのルートを見ることはありません。共有されるのはモジュールキャッシュだけです。スコープは <code>run()</code> の関数が戻ると終わります。<code>renderToString()</code> は同期なので、それで十分です。非同期やストリーミングのレンダリングでは Route を <code>await</code> をまたいで運ぶ必要がありますが、<code>run()</code> はそれを行いません。</li>
        <li><strong><code>popstate</code> でのスクロール復元</strong>はブラウザのもの（<code>scrollRestoration</code>）であり、ルーターのものではありません。</li>
        <li><strong>ドキュメントごとに 1 つのルーターを開始してください。</strong>各 <code>start()</code> は独自の委譲 <code>click</code> リスナーを追加し、2 つ目のルーターの <code>start()</code> は最初のものを退役させません。退役させるのは同じルーターへの 2 回目の <code>start()</code> だけです。別のテーブルに対して URL を解決するには、ルーターを作成して <code>match()</code> だけを呼んでください。何も取り付けません。独立した領域は、その方法でルートの <code>pending</code> の隣に独自のローディングを持てます。<a href="#router-multi">複数のルーターと複合ローディング</a>を参照してください。</li>
        <li><strong>意図的に含めていないもの:</strong> ハッシュ history とメモリ history（ルートは pathname にあり、サーバーはすべてのルートを配信しなければならないため）。1 つの URL で駆動される 2 つの独立したルーティング領域（ページは <code>into()</code> で複数のリージョンを埋められますが、それらはすべて 1 つの一致したルートに属するため。独立した領域は、<a href="#router-multi">複数のルーターと複合ローディング</a>のように、開始しない独自のルーターとローディングを持つことはできます）。そしてホバー時のプリロード（<code>mouseenter</code> からルート自身のローダーを呼べば実現できます）。</li>
      </ul>
      <h3>サンプル</h3>
      <p>リポジトリ内の 2 つの実行可能なサンプルは互いを補完しており、すべての設定をどこかで観察できます。</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: API 全体のクライアントサイドツアー。すべてのパターン形式と優先順位の規則、リンク処理の除外方法、ライブなコントロール付きのすべての Route メンバー、サブルーター、3 段のレイヤースタック、2 つの親にマウントされた相対セクション、そして <code>pending</code> と <code>error</code> を伴うルートローダー。これらの状態が見えるように <code>preload: false</code> を設定しています。</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: リクエストごとの <code>renderToString()</code>、サーバーのノードを確実に引き継ぐハイドレーション、本物の 404 ステータスコード、ルート以外の <code>base</code>、ネットワークパネルで観察できるアイドル時のプリロード、そしてハイドレーションが再フェッチしないようにサーバーからクライアントへデータが渡されるローダー。</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "パターン",
    sections: [
      {
        id: "computed",
        title: "算出値",
        content: `
      <p>Nuclo には算出値（computed）の API はありません。通常の関数を使い、動的な値の中から呼び出してください。</p>
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
        title: "非同期処理とローディング",
        content: `
      <p>通常の <code>async</code>/<code>await</code> を使い、状態が変わるたびに <code>update()</code> を呼び出してください。フェッチの場合、<code>await</code> の前に一度、後に一度です。</p>
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
        title: "ベストプラクティス",
        content: `
      <ul>
        <li><strong>変更をまとめる。</strong>必要な状態をすべて変更してから、<code>update()</code> を一度だけ呼び出してください。</li>
        <li><strong>動的な値は速く、純粋に保つ。</strong>それらはすべて <code>update()</code> のたびに実行されます。</li>
        <li><strong><code>scope()</code> を使う。</strong>タイピングやタイマーのような、小さく頻繁な更新に向いています。</li>
        <li><strong>ドキュメント内にレンダリングする。</strong><code>update()</code> の実行時にドキュメント内にないノードは更新されなくなります。</li>
        <li><strong><code>when()</code> と <code>list()</code> を使う。</strong>変化する子には、ノードを返す関数ではなくこれらを使ってください。</li>
        <li><strong><code>class</code> ではなく <code>className</code> を使う。</strong>動的なクラスには <code>() =&gt; cx(...)</code> または <code>{ className: () =&gt; … }</code> を使ってください。</li>
        <li><strong>スタイルは一度だけ定義する。</strong>モジュールレベルで定義してください。</li>
        <li><strong>サーバーサイドレンダリング:</strong> 先にレンダリングし、その後 <code>getCssText()</code> を <code>&lt;style id="nuclo-styles"&gt;</code> に入れてください。リクエストのデータは引数として渡し、出力内の HTML コメントは残してください。</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "リファレンス",
    sections: [
      {
        id: "api-index",
        title: "API 一覧",
        content: `
      <p>すべての公開関数と、その提供元。</p>
      <h3><code>nuclo</code>（グローバルおよび名前付きエクスポート）</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: すべての動的な値、または指定したスコープ内の動的な値を実行します。</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: <code>update(id)</code> のために要素にスコープ id を与えます。</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: 条件付きコンテンツ。<code>.when()</code> と <code>.else()</code> を持ちます。</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: 項目ごとに 1 行。同一性で照合します。</li>
        <li><a href="#api-region"><code>region(options)</code></a> と <a href="#api-region"><code>into(id, ...content)</code></a>: ツリー内の名前付きの場所と、どこからでもそれを埋めるコンテンツ。</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: イベントリスナー、または <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>。</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: 構築して追加します。</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: サーバーの HTML を引き継ぎます。</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: コンポーネントを再度呼び出し、DOM にパッチを当てます。</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: スタイルオブジェクトから生成されたクラス。</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: スタイルを結合します。後のものが優先されます。</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: テーマ付きの <code>css</code>、<code>cx</code>、<code>variants</code>、<code>keyframes</code>、<code>globalStyle</code>。</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: オプションからスタイルを作ります。</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> と <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>。</li>
      </ul>
      <h3><code>nuclo</code>（名前付きエクスポートのみ）</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> と <a href="#api-css-text"><code>resetStyles()</code></a>。</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>、<code>renderManyToString(inputs)</code>、<code>renderToStringWithContainer(input, tag?, attrs?)</code>、<code>getCssText()</code>。</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">副作用のためのインポート</a>。加えて <code>document</code>、<code>Event</code>、<code>CustomEvent</code>、<code>Node</code>、<code>Element</code>、<code>HTMLElement</code>、および <code>Nuclo*</code> クラス。</li>
      </ul>
      <h3><code>nuclo-router</code>（別パッケージ）</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: ルーター。<code>start()</code>、<code>match()</code>、<code>outlet()</code>、<code>matches()</code>、<code>go()</code>、<code>push()</code>、<code>href()</code>、<code>stop()</code> を持ちます。</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: データローダーがチャンクと並行して開始するルート。</li>
        <li><a href="#router-api">型</a>: <code>RouteContext</code>、<code>PageProps</code>、<code>Params</code>、<code>DataLoader</code>、<code>RouteTable</code> など。</li>
      </ul>
      <h3>グローバルのみ</h3>
      <ul>
        <li><a href="#tag-builders">175 個のタグビルダー</a>: <code>div</code>、<code>span</code>、…、<code>var_</code>、および <code>svgSvg</code>、<code>pathSvg</code>、…。</li>
        <li><a href="#typescript-setup">型</a>: <code>NodeModFn</code>、<code>NodeModLike</code>、<code>ExpandedElement</code> など。<code>StyleResult</code> のようなスタイリング関連の型は <code>'nuclo'</code> からもインポートできます。</li>
      </ul>
      <h3>特別なキー</h3>
      <ul>
        <li><a href="#attributes">属性</a>: <code>className</code>、<code>style</code>、<a href="#events"><code>on*</code> ハンドラー</a>、<a href="#lifecycle"><code>onMount</code> と <code>onDestroy</code></a>。</li>
        <li><a href="#style-objects">スタイルオブジェクト</a>: ショートハンド、疑似状態、<code>&amp;</code> セレクター、<code>@</code> 規則、<code>raw</code>。</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "よくある質問",
        content: `
      <h3>状態を変更すると UI は更新されますか？</h3>
      <p>いいえ。<code>update()</code> を呼び出すまで DOM はそのままです。</p>

      <h3>Nuclo はシグナル、プロキシ、仮想 DOM を使っていますか？</h3>
      <p>いいえ。状態は普通の JavaScript のままです。ツリーがレンダリングされると、Nuclo は実際の要素とテキストノードを作成します。<code>update()</code> は登録されたすべての動的な値（または指定したスコープ内のもの）を実行し、値が変わった箇所で同じノードにパッチを当てます。依存グラフも仮想ツリーもありません。</p>

      <h3>ページに "false" が表示されるのはなぜですか？</h3>
      <p>boolean はテキストとして描画されます。<code>div(ok &amp;&amp; span('Done'))</code> は "false" を表示します。子には <code>when(() =&gt; ok, span('Done'))</code> を、テキストには <code>ok ? 'Done' : ''</code> を使ってください。</p>

      <h3>項目を編集してもリストの行が変わらないのはなぜですか？</h3>
      <p>リストに残っている項目の行は保持され、再レンダリングされません。変化するフィールドには <code>() =&gt; todo.text</code> のような動的な値を使ってください。<a href="#api-list"><code>list()</code></a> を参照してください。</p>

      <h3>UI の一部が更新されなくなるのはなぜですか？</h3>
      <p>多くの場合、<code>update()</code> の実行時にそのノードがドキュメント内になかったためです。Nuclo はそのようなノードの追跡を止め、後で取り付けても再開しないので、ドキュメント内にあるコンテナにレンダリングしてください。他に 2 つの原因があります: 条件が throw する <code>when()</code> は更新を止め、初回実行で throw するテキスト関数は空のままになります。<a href="#api-update"><code>update()</code></a> を参照してください。</p>

      <h3><code>forceUpdate()</code> はいつ使うべきですか？</h3>
      <p>言語の切り替えのような、静的な値のまれな変更にだけ使ってください。それ以外はすべて <code>update()</code> を使います。<a href="#api-force-update"><code>forceUpdate()</code></a> を参照してください。</p>

      <h3>prop として渡さずにページをレイアウトに入れるにはどうすればよいですか？</h3>
      <p><code>region({ id: 'main' })</code> で場所を示し、ページに <code>into('main', …)</code> を返させてください。<a href="#api-region"><code>region()</code> と <code>into()</code></a> を参照してください。</p>

      <h3>アプリをアンマウントするにはどうすればよいですか？</h3>
      <p><code>when()</code> で包み、条件をオフにしてください。DOM を自分で削除しても <code>onDestroy</code> は実行されません。<a href="#lifecycle">ライフサイクル</a>を参照してください。</p>

      <h3>Nuclo にはルーターが含まれていますか？</h3>
      <p>コアパッケージには含まれません。ルーティングは <code>nuclo-router</code> として別途提供され、サーバーサイドレンダリング、ハイドレーション、コード分割されたルート、アイドル時のプリロードを備えています。<code>npm install nuclo nuclo-router</code> でインストールしてください。<a href="#router-overview">nuclo-router</a> を参照してください。</p>

      <h3>Nuclo にはエフェクトがありますか？</h3>
      <p>いいえ。<code>onMount</code> と <code>onDestroy</code> は要素ごとに一度だけ、挿入と削除に結び付いて実行されます。状態が変わったからといって再実行されるものはありません。</p>
    `,
      },
    ],
  },

];
