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
      <p>型付きのスタイルオブジェクトを、CSS クラスに変えて返します。返り値はどのタグビルダーにもそのまま渡せます。ブラウザーでは、ルールはすべて <code>&lt;style id="nuclo-styles"&gt;</code> という 1 つの要素に書き込まれ、サーバーでは <a href="#api-css-text"><code>getCssText()</code></a> が同じルールを文字列で返します。</p>
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
        <li><code>css()</code> は、基本の宣言にクラスを 1 つ、さらに疑似キー・セレクター・メディアブロックごとにクラスを 1 つずつ作ります。上のカードなら、要素に付くクラスは 2 つです。</li>
        <li>クラス名は中身のハッシュです。同じスタイルならクラスも共有され、サーバーとクライアントで同じ名前が生成されます。</li>
        <li>スタイルはモジュールのトップレベルで 1 回だけ定義してください。<code>css()</code> はオブジェクト単位でキャッシュするので、呼ぶたびに新しいオブジェクトを渡すと、そのたびに一から処理し直すことになります。</li>
        <li><code>css()</code> に渡したあとでスタイルオブジェクトを書き換えても、何も起きません。</li>
        <li>登録したスタイルは、ページ（サーバーならプロセス）が生きている間ずっと残り続けます。データ由来の幅のように、項目ごとに変わる値は <a href="#attributes"><code>style</code> 属性</a>で渡してください。</li>
      </ul>
      <h3>名前付きスタイル</h3>
      <p>先頭に名前を渡すと、人が読みやすいクラス名になります。</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>基本クラスは名前そのままで、それ以外のブロックは <code>name-&lt;hash&gt;</code> という形になります。</li>
        <li>名前は有効なクラス名でなければなりません。そうでなければ、Nuclo は警告を出して代わりの名前を生成します。</li>
        <li>名前はグローバルに共有されます。別々のスタイルが同じ名前を使うと、Nuclo が警告します。</li>
      </ul>
      <h3>結果の使い方</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p>クラス名の文字列が欲しいときは、<code>String(card)</code> でも <code>card.className</code> でも取り出せます。</p>
    `,
      },
      {
        id: "style-objects",
        title: "スタイルオブジェクト",
        content: `
      <p><code>css()</code> に渡すオブジェクトには、おなじみの CSS プロパティを camelCase で書きます。加えて、ショートハンドのキーと、疑似状態・セレクター・メディアクエリ用のネストしたキーも使えて、どれも TypeScript が補完してくれます。<code>borderTopLeftRadius</code>、<code>fill</code>、<code>paddingInline</code> のように型定義にないプロパティは、<code>raw</code> に書いてください（あとで説明します）。</p>
      <h3>値</h3>
      <ul>
        <li>数値には <code>px</code> が付きます。例外は <code>0</code> と、そもそも単位を取らないプロパティです: <code>zIndex</code>、<code>opacity</code>、<code>fontWeight</code>、<code>lineHeight</code>、<code>flex</code>、<code>flexGrow</code>、<code>flexShrink</code>、<code>order</code>、<code>aspectRatio</code>、<code>gridColumn</code>、<code>gridRow</code>。<code>raw</code> では <code>zoom</code>、<code>scale</code>、<code>column-count</code>、<code>orphans</code>、<code>widows</code>、<code>tab-size</code>、<code>animation-iteration-count</code> も単位なしです。</li>
        <li>文字列はそのまま出力されます。<code>null</code>、<code>undefined</code>、<code>false</code> は読み飛ばされます。</li>
        <li><code>lineHeight</code>（と <code>leading</code>）は単位なしなので、<code>leading: 24</code> は「フォントサイズの 24 倍」の意味になります。ピクセルで指定したいなら <code>"24px"</code> と書きましょう。</li>
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
          <tr><td><code>m</code>、<code>mt</code>、<code>mr</code>、<code>mb</code>、<code>ml</code>、<code>mx</code>、<code>my</code></td><td>margin も同じ要領</td></tr>
          <tr><td><code>w</code>、<code>h</code>、<code>minW</code>、<code>maxW</code>、<code>minH</code>、<code>maxH</code></td><td>width と height、およびそれぞれの min / max</td></tr>
          <tr><td><code>size</code></td><td>width と height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>次のキーには <code>true</code> を渡します。</p>
      <table>
        <thead><tr><th>キー</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center（display は触りません）</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>疑似状態</h3>
      <p><code>hover</code>、<code>focus</code>、<code>focusVisible</code>、<code>focusWithin</code>、<code>active</code>、<code>visited</code>、<code>disabled</code>、<code>enabled</code>、<code>checked</code>、<code>required</code>、<code>invalid</code>、<code>valid</code>、<code>readOnly</code>、<code>first</code>（<code>:first-child</code>）、<code>last</code>（<code>:last-child</code>）、<code>only</code>（<code>:only-child</code>）、<code>odd</code>、<code>even</code>、<code>empty</code>、<code>placeholderShown</code>、<code>placeholder</code>、<code>before</code>、<code>after</code>、<code>selection</code>、<code>marker</code>、<code>firstLine</code>、<code>firstLetter</code>。これらはネストでき、<code>hover: { focus: {…} }</code> は <code>:hover:focus</code> になります。</p>
      <h3>セレクターと at 規則</h3>
      <p><code>&amp;</code> で始まるキーはセレクターとして扱われ、<code>&amp;</code> の部分が生成されたクラスに置き換わります。<code>@</code> で始まるキーは at 規則で、<code>@media</code>、<code>@container</code>、<code>@supports</code> が使えます。</p>
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
        <li>キーは必ず <code>&amp;</code> で始めてください。<code>".dark &amp;"</code> のようなキーは無視されるため、<code>"&amp;:is(.dark *)"</code> の形で書きます。</li>
        <li>ネストした 2 つの <code>@media</code> は <code>and</code> で結合されます。<code>print</code> や <code>only screen</code> のようなメディアタイプで始まるクエリは先頭に置かれます。文法上、タイプは先頭にしか書けないからです。1 本にまとめられない組み合わせ（メディアタイプが 2 つ、あるいは先頭に <code>not</code>）は警告を出し、内側のクエリだけが使われます。それ以外のネストした at 規則は、外側のものを上書きします。</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>どんなプロパティでも <code>raw</code> に書けます。名前は CSS とまったく同じ表記にしてください。数値にはここでも <code>px</code> が付くので、値は文字列で渡します。</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>その他のフラットなキーは kebab-case に変換され、そのまま出力されます。つまり <code>colr: 'red'</code> のようなタイプミスは、ブラウザーに捨てられる宣言になるだけです。疑似状態・スクリーン・<code>&amp;</code> キー・<code>@</code> キーのどれでもないキーの下にネストしたオブジェクトは、無視されます。どちらも TypeScript がエラーとして教えてくれます。</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>スタイルを合成します。同じプロパティを設定している入力が複数あれば、あとに渡したものが勝ちます。</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>falsy な入力は読み飛ばされ、配列は平坦化され、文字列は分割したうえで重複が取り除かれます。</li>
        <li>同じブロック（基本、同じ疑似状態、同じメディアクエリ）に属する生成クラスは、新しい 1 つのクラスにマージされます。それ以外のクラス名は、そのまま通り抜けます。</li>
        <li>引数の順番を理解しているのは <code>cx()</code> だけです。<code>div(base, blue)</code> と書くと両方のクラスが付き、最後に作られたルールが勝ちます。互いに上書きし合うスタイルは、1 つの <code>cx()</code> にまとめましょう。</li>
        <li>名前付きスタイルのブロックが別の入力のブロックとマージされると、できあがるクラスは名前そのものではなく <code>name-&lt;hash&gt;</code> になります。マージされなかったブロックは元のクラスを保つので、<code>cx(pageTitle, 'extra')</code> には今までどおり <code>page-title</code> が含まれます。</li>
      </ul>
      <h3>動的なクラス</h3>
      <p>常に <code>cx(...)</code> を返す関数を渡してください。</p>
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
      <p>この関数は、最初の実行でスタイル結果を返さなければなりません。<code>() =&gt; active &amp;&amp; activeButton</code> と書くと、クラスではなく "false" という文字がそのまま描画されてしまいます。</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>テーマに紐づいた <code>css</code>、<code>cx</code>、<code>variants</code>、<code>keyframes</code>、<code>globalStyle</code> を返します。テーマとは、値に名前を付けるものです。下の例なら <code>borderColor: 'border'</code> は <code>#e5e7eb</code> として出力され、その名前も TypeScript が補完してくれます。<code>screens</code> の各エントリは、<code>md: {…}</code> のようなメディアクエリ用のスタイルキーになります。</p>
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
        <li>テーマ名が解決されるのは、値全体がその名前のときだけです。<code>border: "1px solid primary"</code> のような書き方は解決されません。</li>
        <li><code>@</code> を含まないスクリーン値は <code>@media &lt;value&gt;</code> になります。<code>@</code> で始まる値はそのまま使われます（例: <code>"@container (min-width: 400px)"</code>）。</li>
        <li>スクリーンがあるのは <code>createCss()</code> で作ったインスタンスだけです。グローバルな <code>css()</code> には存在しませんが、<code>@media</code> キーなら受け付けます。</li>
        <li>すべてのインスタンスとグローバルのヘルパーは、1 つのスタイルシートを共有します。スクリーンのメディアルールは、使われた順ではなくスクリーンを宣言した順に出力されるので、<code>min-width</code> のスクリーンは小さいものから並べてください。アプリごとに <code>createCss()</code> のインスタンスを 1 つにしておけば、順序はテーマに書いたとおりになります。</li>
        <li>返り値の <code>theme</code> は、渡したテーマそのものです。</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>ボタンの用途やサイズのようなオプションの組み合わせに応じて、スタイルを返す関数を作ります。</p>
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
        <li>スタイルは <code>base</code>、各グループで選ばれた値、条件に合った compound の順にマージされ、プロパティごとにあとのものが優先されます。</li>
        <li>指定がない、または <code>undefined</code>・<code>null</code> のオプションにはデフォルトが使われます。デフォルトのないグループは読み飛ばされます。</li>
        <li>キーが <code>true</code> と <code>false</code> だけのグループは、boolean を受け取ります。</li>
        <li>compound が適用されるのは、列挙したすべてのグループが（デフォルトを含めて）一致したときです。</li>
        <li>選択の組み合わせごとに、構築は 1 回だけで、結果はキャッシュされます。</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() と globalStyle()",
        content: `
      <p><code>keyframes()</code> はアニメーションを登録し、生成された名前を返します。フレームのキーには <code>from</code>、<code>to</code>、そして <code>"50%"</code> や <code>"0%, 100%"</code> のようなパーセンテージを使います。各フレームに書けるのはフラットなプロパティだけで、同じ内容のフレームからは同じ名前が返ります。</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> は、好きなセレクターに対するルールを追加します。</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>セレクターは書いたとおりにそのまま使われます。</li>
        <li>効くのはフラットなプロパティだけです。疑似キー、スクリーン、<code>@</code> キーは無視されるため、<code>globalStyle()</code> でメディアルールは書けません。</li>
        <li>同じルールが追加されるのは 1 回だけです。同じセレクターに別のスタイルを渡すと 2 つ目のルールが加わり、あとのものが勝ちます。</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() と resetStyles()",
        content: `
      <p><code>getCssText()</code> は、このプロセスで <code>css()</code>、<code>cx()</code>、<code>variants()</code>、<code>keyframes()</code>、<code>globalStyle()</code> が作ったルールをすべて返します。順番は、基本ルールが先で、そのあとに <code>@media</code>、<code>@container</code>、<code>@supports</code> のブロックが続きます。サーバーサイドレンダリングで使うための関数です。</p>
      <ul>
        <li>呼ぶのは <code>renderToString()</code> のあとです。レンダリング中に作られたルールも含まれます。</li>
        <li>対象は 1 ページでも 1 リクエストでもなくプロセス全体で、ルールは増える一方です。クラス名が中身のハッシュなので、それで問題は起きません。</li>
        <li>出力は <code>&lt;style id="nuclo-styles"&gt;</code> に入れてください。クライアントはその要素を再利用し、含まれているルールの追加を省きます。id が違う、あるいは id がないと、クライアントは全ルールを入れた 2 つ目のスタイルシートを追加してしまいます。</li>
        <li>テキストはエスケープされません。信頼できない入力を、スタイルの値に入れてはいけません。</li>
      </ul>
      <p><code>resetStyles()</code> はテスト用のヘルパーで、すべてのルールと <code>#nuclo-styles</code> 要素を消し去ります。それまでに作ったスタイルはクラス名こそ残りますが、CSS は失われます。アプリやサーバーのコードでは呼ばないでください。</p>
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
      <div class="docs-callout"><strong>別パッケージです:</strong> <code>nuclo-router</code> は Nuclo 本体には含まれていません。<code>nuclo</code> と一緒にインストールしてください。プレビューリリースなので、API は今後変わるかもしれません。</div>
      <p>Nuclo のためのルーティングです。サーバーサイドレンダリング、ハイドレーション、コード分割されたルート、アイドル時のプリロードまで、すべて <code>list()</code> と <code>update()</code> の上に組み立てています。gzip 後で約 ${NUCLO_ROUTER_GZIP_KB} KB。Nuclo 以外に依存はなく、副作用もないので、使わなければツリーシェイクで消えます。</p>
      ${sh("npm install nuclo nuclo-router")}
      <p><code>pnpm add</code>、<code>yarn add</code>、<code>bun add</code> に同じ 2 つの名前を渡しても構いません。peer dependency として <code>nuclo</code> 0.3 以降が必要です。</p>
      <p>ルーターが決めるのは、<em>何を</em>読み込むかです。<em>どこに</em>置くかは、アプリが <code>router.outlet()</code> で示します。この outlet は、レイヤースタック全体を受け持つ 1 つの <code>list()</code> で、レイヤーごとに 1 行を持つので、ふつうのページなら行は 1 つだけです。サーバーとクライアントは同じツリーを組み立てるため、<code>hydrate()</code> はサーバーのノードを作り直さず、そのまま引き継ぎます。仕組みの材料は、<code>history</code>、委譲された 1 つの <code>click</code> リスナー、そして <code>requestIdleCallback</code> だけです。</p>
      <h3>1 つのインポート</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> は、一致したルートのモジュールを解決し終えてから戻ります。そのため最初のツリーは、サーバーでもクライアントでも欠けのない状態で作られます。以降は、開始した Route の値やメソッドに、ルーター経由でアクセスできます（<code>router.path</code>、<code>router.pending</code>、<code>router.go()</code> など）。</p>
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
      <p>組み込みに必要なのは、これだけです。リンクがそのまま動くのは、<code>&lt;a href&gt;</code> がただの <code>&lt;a href&gt;</code> だからです。<code>document</code> に付けた委譲リスナーが 1 つ、ルーターの管轄のリンクだけを拾い、あとはすべてブラウザーに任せます。</p>
      <p>サーバーでは、<code>start()</code> はリクエストごとに <code>Route</code> を返すだけで、ルーター自体には触れません。だから同時に来たリクエスト同士が、互いのルートを見ることはありません。<code>route.run()</code> は、レンダリングしている間だけ、その Route をルーター（つまり outlet）のアクティブな Route にします。ブラウザーの場合、Route はページの読み込みごとに 1 つで、<code>start()</code> がそれをそのままアクティブにするので、<code>run()</code> は要りません。</p>
      <p>ページは <a href="#router-api"><code>RouteContext</code></a> と <a href="#router-api"><code>PageProps</code></a> を <code>(ctx, { layer, data, outlet, beforeLeave })</code> の形で受け取ります。要らない引数は省いて構いません。戻り値は、<code>list()</code> が受け付けるものなら何でも返せます。レイアウトの別の場所も埋めたいときは、<code>div(article(…), into('sidebar', nav(…)))</code> のように、ページの中から <code>into()</code> を一緒に返してください。そのコンテンツは、ページが破棄されると一緒に消えます。詳しくは<a href="#router-regions">ページとリージョン</a>を参照してください。</p>
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
          <tr><td><code>*</code></td><td>どれにも一致しなかったもの全部。404 用</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>優先順位は、静的パターン、宣言順の動的パターン、最長プレフィックス優先のキャッチオールの順です。だから <code>'*'</code> は「ほかに何も一致しなかったもの」だけを受け止め、テーブルのどこに書いても構いません。末尾のスラッシュ、重複したスラッシュ、パーセントエンコーディングは正規化され、パラメーターの値はデコード済みで届きます。マッチングはパターンごとのセグメント比較で、正規表現は組み立てることも実行することもありません。</p>
      <h3>相対ルート</h3>
      <p><code>./</code> で始まるパターンは、それを宣言した親からの相対パスです。<code>./</code> で始まる href は、アクティブなルートからの相対パスです。この 2 つを組み合わせれば、どの親の下に置いても同じ意味で働く、再利用できるセクションが作れます。テーブルの値は、ローダーか、別のテーブル（そのキーは、そのテーブルからの相対）のどちらかです。</p>
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
      <p>たった 2 行で、パスを二度書かずに 6 つのパターンがそろいます。両方の親が同じローダーオブジェクトを受け取るので、モジュールキャッシュも <code>import()</code> も 1 つを共有します。</p>
      <ul>
        <li>子テーブルの中では、<code>'./x'</code>、<code>'/x'</code>、<code>'x'</code> はどれも同じ意味です。<code>'/'</code> は親パスそのもの、<code>'*rest'</code> はそのセクション専用のキャッチオールになります。ネストは好きなだけ深くできます。</li>
        <li>トップレベルのキーは書いたとおりに扱われるので、<code>'*'</code> は <code>'*'</code> のままです。</li>
        <li>キャッチオール（<code>*catch-all</code>）の親の下に子を置くと、<code>createRouter()</code> がエラーになります。キャッチオールはパターンの末尾にしか置けないからです。</li>
      </ul>
      <h3>親ページと <code>outlet()</code></h3>
      <p>親子のルートは、本物の階層構造になります。まず親が描画され、子は親が <code>outlet()</code> を呼んだ場所の内側に描画されます。</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>子から子へ移動しても、親は作り直されません。DOM ノードは同じままなので、フォーカスもスクロール位置も入力途中の値も、クロージャの中の state も、そっくり残ります。</p>
      <ul>
        <li>子ルートを持たないページでは、outlet は何も描画しません。だからレイアウトは、無条件に呼んで構いません。逆に、子を持つ親が <code>outlet()</code> を呼ばなければ、その子は表示されません。</li>
        <li>インデックスルートはありません。<code>'/'</code> はレイアウトそのものなので、親のパスは、内側に別のインデックスページを置くのではなく、空の outlet のままレイアウトを描画します。ランディング用のコンテンツはレイアウトの中に書くか、実在する子パスを割り当ててください。</li>
      </ul>
      <p>同じ呼び出しが、どちらの親の下でも、自分がどの親の中にいるのか知らないページからでも、そのまま機能します。</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>、<code>../x</code>、<code>.</code>、<code>..</code> は、URL の「ディレクトリ」ではなく、現在のルートのパスを基準に解決されます。<code>/invoices/42</code> にいるときの <code>./preview</code> は <code>/invoices/42/preview</code> になります（ブラウザーの素の解釈なら <code>/invoices/preview</code> です）。URL 末尾のスラッシュは結果を変えません。<code>../</code> は 1 セグメント上がり、ルートで止まります。クエリとハッシュは引き継がれ、<code>base</code> が付け直され、解決後の絶対パスが history に入ります。URL 解決の標準的な規則から外れる点は、React Router の <code>&lt;Link to="./x"&gt;</code> と同じです。</p>
      <ul>
        <li>ルート基準の相対パスになるのは、<code>./</code> と <code>../</code> だけです。href に素の <code>preview</code> と書いた場合は、ふつうのブラウザーの規則に従います。</li>
        <li>相対リンクは、<code>href="./preview"</code> と手書きせず、<code>router.href('./preview')</code> で組み立ててください。<code>href()</code> はレンダリング時に解決するので、出力されるマークアップは絶対パスになり、クローラーでも、中クリックでも、JavaScript が無効な環境でも正しく動きます。</li>
      </ul>
      <h3>何が保持され、何が再構築されるか</h3>
      <table>
        <thead><tr><th>ノード</th><th>ナビゲーション時</th></tr></thead>
        <tbody>
          <tr><td>パターンとパスが変わらない親</td><td><strong>保持</strong>: 同じノードのまま、<code>load()</code> も再実行されません</td></tr>
          <tr><td>一致したページ</td><td>パターンとパスが変わらず、<code>load()</code> もなければ<strong>保持</strong>されるので、クエリやハッシュが変わってもページは残ります。ローダーを持つルートは、訪問のたびに更新されます。</td></tr>
          <tr><td>パスが変わった親</td><td>その配下ごと再構築</td></tr>
          <tr><td>プッシュされたレイヤー</td><td>一致したページだけを描画します。親はすでに下の行にマウント済みです。</td></tr>
        </tbody>
      </table>
      <p>保持されたページは、構築時の <code>ctx</code> を持ち続けます。これはどの <code>ctx</code> にも当てはまります。最新の値が欲しいときは <code>router.*</code> から読んでください。フィルター、ページネーション、タブのようなクエリ駆動の state は、動的な値の中で <code>router.search</code> を読み、<code>router.go('?page=2', { replace: true })</code> で書き込みます。こうすれば、ページもフォーカスも入力途中の値も、そのまま残ります。</p>
    `,
      },
      {
        id: "router-regions",
        title: "ページとリージョン",
        content: `
      <p><code>router.outlet()</code> は、ページを 1 か所に置きます。サイドバーやツールバー、見出しのように、レイアウトの別の場所にも中身が必要なページは、<a href="#api-region"><code>into()</code></a> でそこを埋めます。レイアウトは <code>region()</code> で場所を示し、ページは自分のコンテンツの隣に <code>into()</code> を返す、という分担です。レイアウトがページの中身を prop で受け取ることはなく、ナビゲーションでレイアウトが作り直されることもありません。</p>
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
      <p>ページのコンテンツは outlet の <code>list()</code> の 1 行で、<code>into()</code> は、それを保持する行と同じライフサイクルを持ちます。つまりサイドバーの中身は、ページが表示されると現れ、ページが破棄されると消えます。<code>into('sidebar', …)</code> を持たないページへ移れば、リージョンの <code>empty</code> コンテンツがまた表示されます。両方の部分が同じ関数の中で作られるので、<code>ctx</code> も <code>data</code> も、どちらの側でも使えます。</p>
      <h3>ナビゲーション時に起こること</h3>
      <ul>
        <li><strong>保持されたページは、リージョンも保持します。</strong><a href="#router-patterns">ページが保持される</a>ようなクエリやハッシュの変更では、リージョンの中身にも手が付きません。サイドバーがクエリに依存するなら、動的な値の中で <code>router.search</code> を読んでください。</li>
        <li><strong>再構築されたページは、リージョンを埋め直します。</strong>ルートが変わると古い行が削除され、新しいページの <code>into()</code> ビューが入れ替わりに引き継ぎます。古い中身は何も残りません。</li>
        <li><strong>push されたレイヤーは、ビューを追加します。</strong>レイヤーは outlet の後ろの行なので、その <code>into()</code> は同じリージョンに加わる、より新しいビューです。デフォルトの <code>type: 'latest'</code> では、レイヤーが閉じるまでページのビューが覆い隠され、閉じるとまた表示されます。<code>type: 'stack'</code> なら、両方が表示されます。</li>
        <li><strong>親ページもリージョンを埋められます。</strong>親は作り直されないので、子が入れ替わってもそのビューは残ります。</li>
        <li><strong>サーバーサイドレンダリングも、そのまま動きます。</strong>サーバーは <code>route.run()</code> の中でページを組み立てるので、<code>into()</code> のビューも HTML に含まれ、<code>hydrate()</code> がそれらを引き継ぎます。</li>
      </ul>
      <h3>1 つのページから複数のリージョンへ</h3>
      <p>複数のリージョンをまとめて埋めるなら、オブジェクトを渡します。ページの本体は引き続き outlet を通るので、<code>into()</code> の隣に並べて返してください。</p>
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
      <h3>用途に応じた使い分け</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> は子ルートのためのものです。URL が決めるコンテンツを、親ページの内側に描画します。<a href="#router-patterns">ネストしたルート</a>を参照してください。</li>
        <li><strong><code>into()</code></strong> は、一致したページが自分の中身をレイアウト全体に広げるためのものです。コンテンツはページのもので、ページのデータを使います。</li>
        <li><strong><code>matches()</code></strong> は、レイアウトが URL だけを見て判断するためのものです。専用の小さなテーブルを持ち、ページは関わりません。<a href="#router-matches"><code>matches()</code></a> を参照してください。</li>
      </ul>
      <p>どれも、一致した 1 つのルートに属しています。ルーターは 1 つの URL から 2 つの独立した領域を動かすことはしません。そのため、ルートごとに中身が変わるサイドバーは、2 つ目の outlet ではなく、ページが埋めるリージョンとして作ります。サイドバーに本当に専用のルーター、ローディング、フォールバックが必要なら、開始しないルーターを 1 つ持たせて <code>match()</code> で解決します。<a href="#router-multi">複数のルーターと複合ローディング</a>を参照してください。</p>
    `,
      },
      {
        id: "router-loaders",
        title: "ルートローダーとコード分割",
        content: `
      <p>ページモジュールは <code>load</code> 関数をエクスポートできます。この関数は、そのルートへのナビゲーションのたびに、ページが組み立てられる前に実行され、戻り値は <code>data</code> としてページに渡されます。</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>ルートテーブルは今までどおりで、ローダーはページモジュール側に書きます。一致した <code>RouteContext</code> を受け取るので、<code>params</code>、<code>search</code>、<code>path</code> のどれも使えます。同期でも非同期でも構いません。サーバーでも実行されるため、サーバーレンダリングしたページは、ハイドレーション後にフェッチするのではなく、データを HTML に含んだ状態で届きます。</p>
      <p><strong>キャッシュされるのはモジュールで、データではありません。</strong>ルートのチャンクは一度だけフェッチして使い回し、ローダーはナビゲーションのたびに再実行します。だから <code>/blog/a</code> と <code>/blog/b</code> が混ざることはなく、失敗したローダーも、単純にもう一度試せます。</p>
      <table>
        <thead><tr><th>状況</th><th>挙動</th></tr></thead>
        <tbody>
          <tr><td>実行中</td><td><code>router.pending</code> が true になり、現在のページは表示されたままです</td></tr>
          <tr><td>throw または reject した</td><td><code>router.error</code> に入ります。<code>go()</code> はこの場合も reject せず、ナビゲーションは再試行できます。</td></tr>
          <tr><td><code>start()</code> の間</td><td>reject は <code>start()</code> から出てきます。エラーを載せる Route が、まだ存在しないからです。</td></tr>
          <tr><td>プッシュされたレイヤー</td><td>自分のローダーを実行し、自分のデータを持ちます</td></tr>
          <tr><td>アイドル時のプリローダー</td><td>モジュールだけを先読みします。渡せるコンテキストがなく、開かれないかもしれないルートのデータまでフェッチすることになってしまうためです。</td></tr>
          <tr><td>同じ URL への再ナビゲーション</td><td>ローダーが再実行され、行も再構築されます。ローダーのないルートは、行を保持します。</td></tr>
        </tbody>
      </table>
      <p>再検証したいときは、history エントリを増やさずに、現在地へナビゲートします。</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>データとチャンクの読み込みを同時に開始する</h3>
      <p>ページモジュールがエクスポートする <code>load</code> は、モジュールが届いてからでないと実行できません。そのためコールドナビゲーションでは、チャンク、そしてデータの順にフェッチすることになります。両方を同時に走らせたいなら、<code>withLoad()</code> でテーブルの中にローダーを宣言してください。</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>こう書くと、モジュール自身の <code>load</code> の代わりにこちらが使われ、同じように訪問のたびに実行されます。チャンクの読み込み中に reject されたものも、ほかと同じく <code>router.error</code> に入ります。</p>
      <p>サーバーのデータを HTML にシリアライズすることは、あえてしていません。クライアントの <code>load</code> は、ハイドレーション時にもう一度実行されます。それが困る場合は、サーバーに <code>route.data</code> を（たとえば <code>window.__DATA__</code> として）出力させ、ローダーがそれを先に参照するようにしてください。<code>route.data</code> に入るのは、一致したページのデータだけで、親の <code>load()</code> の結果は含まれません。</p>
      <h3>コード分割とプリロード</h3>
      <p>ルートの値は、ページコンポーネントを返す関数と決まっているので、コンポーネントは必要になった時点で読み込まれます。</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p><code>load</code> をエクスポートできるのは、モジュール形式のものだけです。<code>.then(m =&gt; m.BPage)</code> のように名前付きコンポーネントを取り出すと、ルーターに渡るのは関数だけになります。</p>
      <p>各モジュールのインポートは 1 回だけで、結果はキャッシュされます。同じルートへのナビゲーションが同時に起きても、<code>import()</code> は 1 つを共有します。ユーザーが <code>idleTimeout</code>（デフォルトは 1 秒。タップ、キー、ホイール、スクロールがない状態）のあいだ放置すると、残りのルートがバックグラウンドで、アイドルスライス（<code>requestIdleCallback</code>）ごとに 1 つずつ読み込まれます。何か入力があったり、ユーザーが待っているナビゲーションがあったりすると、ページがまたアイドルになるまで一時停止します。</p>
      <p>プリロード済みのルートや eager なルートは、<code>router.pending</code> を一度も切り替えず、次の描画までに読み込みが終わります。スピナーが一瞬映ることも、レイアウトシフトもありません。<code>router.pending</code> が true になるのは、待たなければならないモジュールやローダーがあるときだけで、そのあいだ離れようとしているページは画面に残ります。読み込みに失敗したチャンクは、未処理の reject ではなく <code>router.error</code> として現れ、単純に再試行できます。</p>
    `,
      },
      {
        id: "router-api",
        title: "ルーター API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> は、パターンをローダー（またはネストしたテーブル）に対応づけます。オプションは次のとおりです。</p>
      <table>
        <thead><tr><th>オプション</th><th>デフォルト</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>アプリを配信する URL のプレフィックス（例: <code>'/docs'</code>）。一致するのはセグメントの境界だけで、<code>/docs/intro</code> は <code>'/docs'</code> の内側ですが、<code>/docsearch</code> は外側です。外側の URL は何にも一致しないので、<code>start()</code> は reject し（サーバーなら 404）、そこへのリンクはブラウザーに任されます。</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>ページがアイドルになったら、残りのルートのモジュールをバックグラウンドで読み込みます。<code>false</code> にすると無効になります。</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>プリロードを始める（ユーザーの操作のあとで再開する）までに、タップ・キー・ホイール・スクロールがなくてもよいミリ秒数。</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>。ブラウザーで解決されたすべてのナビゲーション（最初の 1 回も含む）のあと、DOM が追いついた時点で呼ばれます。<code>kind</code> は <code>'start'</code>、<code>'push'</code>、<code>'replace'</code>、<code>'pop'</code>（戻る、進む、<code>close()</code>）、<code>'layer'</code> のいずれかです。<code>document.title</code>、メタタグ、フォーカス、スクロール、アナリティクスを扱うためのフックで、SSR 中には呼ばれません。</td></tr>
        </tbody>
      </table>
      <p>返ってくるルーターは、<code>start()</code>、<code>match()</code>、<code>outlet()</code>、<code>matches()</code> と、<code>run()</code> を除くすべての <code>Route</code> メンバーを持ちます。これらのメンバーは、アクティブな Route の値やメソッドを参照します。アクティブな Route とは、ブラウザーでは最後の <code>start()</code> が返したもの、サーバーでは <code>run()</code> の実行中のものです。どちらもない状態でメンバーを読むと throw します。ルートテーブル、コンパイル済みのマッチャー、モジュールキャッシュはルーターが持つので、サーバーではリクエスト間で共有されます。</p>
      <h3><code>router.start(url?)</code></h3>
      <p><code>url</code>（デフォルトは、ブラウザーなら <code>location.href</code>）をページモジュールに解決し、<code>Promise&lt;Route&gt;</code> を返します。何にも一致せず、テーブルに <code>'*'</code> ルートもなければ reject します。サーバーなら、それが 404 です。ブラウザーではさらに、その Route をルーターのアクティブなものにして、<code>popstate</code> と委譲 <code>click</code> のリスナーを取り付け、プリロードをスケジュールします。<code>start()</code> を 2 回呼ぶと、前の Route は自動的に停止します。サーバーでは共有物に一切触れないので、レンダリングは <code>route.run()</code> の中で行ってください。</p>
      <h3><code>router.match(url?)</code></h3>
      <p>何も読み込まずに、URL をテーブルに対して解決します。インポートも history もリスナーも Route も使いません。返り値は <code>RouteContext</code> で、URL が <code>base</code> の外にある、どのパターンにも一致しない、ブラウザーで別オリジンである、のいずれかなら <code>null</code> です。<code>./</code> の解決にはアクティブなルートが要るため、受け付けるのは絶対 URL だけです。</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>アクティブなルートのページを、<code>list()</code> として返します。ページを置きたい場所に、1 回だけ置いてください。push されたレイヤーは、その後ろの行になります。<code>start()</code> が解決する前と、<code>stop()</code> のあとは空です。サーバーでは、<code>run()</code> の実行中の Route を描画します。</p>
      <h3><code>router.matches(table)</code></h3>
      <p>アクティブなルートのパスに一致する、2 つ目のテーブルのビューを、好きな場所に置ける <code>list()</code> として描画します。<a href="#router-matches"><code>matches()</code></a> を参照してください。</p>
      <h3><code>Route</code></h3>
      <p><code>run()</code> 以外のメンバーはルーターにもあり、アプリはそちらから読みます。</p>
      <table>
        <thead><tr><th>メンバー</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>、<code>pattern</code>、<code>params</code>、<code>search</code>、<code>hash</code>、<code>url</code></td><td>アクティブな一致の内容。<code>search</code> は <code>URLSearchParams</code> です。<code>search</code>、<code>hash</code>、<code>url</code> は常に最新の値を返します。</td></tr>
          <tr><td><code>pending</code></td><td>ナビゲーションが、モジュールまたはローダーの完了を待っています</td></tr>
          <tr><td><code>error</code></td><td>直近で失敗した読み込み。次のナビゲーションでクリアされます</td></tr>
          <tr><td><code>data</code></td><td>一致したページの <code>load()</code> が返したもの。サーバーがシリアライズするためのもので、親の分は含まれません。</td></tr>
          <tr><td><code>depth</code></td><td>スタック上のレイヤーの数（ふつうのページなら 1）</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>必要ならモジュールを読み込んでから、ナビゲートします。reject することはなく、reject や throw で失敗したモジュールは <code>error</code> に入ります。</td></tr>
          <tr><td><code>push(href)</code></td><td>ルートを新しいレイヤーとして上に開き、そのレイヤーが閉じたときの値で解決します。<code>./</code> も使えます。一致するルートがない、またはモジュールの読み込みに失敗したときは reject します。</td></tr>
          <tr><td><code>href(path)</code></td><td><code>a({ href })</code> で使えるように、パスの先頭に <code>base</code> を付けます。<code>./</code> と <code>../</code> は、アクティブなルートを基準に解決します。</td></tr>
          <tr><td><code>stop()</code></td><td>すべてのリスナーを外し、開いているレイヤーを閉じ、outlet を空にします。何度呼んでも結果は同じです。停止した Route は最後の一致を返し続け、<code>go()</code> は何もしません。</td></tr>
          <tr><td><code>run(fn)</code></td><td>この Route をルーターのアクティブなものとして <code>fn</code> を呼び、その結果を返します。サーバーでの <code>route.run(() =&gt; renderToString(App))</code> がその使い方です。同期専用で、<code>fn</code> が戻ると Route はアクティブでなくなります。</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>ページの第 1 引数で、<code>path</code>、<code>pattern</code>、<code>params</code>、<code>search</code>、<code>hash</code>、<code>url</code> を持ちます。これはページが組み立てられた時点のコンテキストです。最新の値は <code>router.*</code> から読んでください。両者に差が出るのは、再構築なしでクエリやハッシュが変わったときだけです。</p>
      <p><code>params</code> の型は、デフォルトでは <code>{ [name]: string }</code> です。<code>Params</code> を使えば、ページが自分のパターンから型を導けます。<code>'/blog/:slug'</code> なら <code>{ slug: string }</code>、<code>'/files/*rest'</code> なら <code>{ rest: string }</code> になります。</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>ページの第 2 引数です。必要なものだけを分割代入して使ってください。</p>
      <table>
        <thead><tr><th>プロパティ</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>スタックの中でのページの位置。下の <code>Layer</code> を参照してください。</td></tr>
          <tr><td><code>data</code></td><td>ルートの <code>load()</code> が返したもの。なければ <code>undefined</code>。型は <code>PageProps&lt;TData&gt;</code> で付けます。</td></tr>
          <tr><td><code>outlet</code></td><td>親ページが子ルートを描画する場所です。<a href="#router-patterns">ネストしたルート</a>を参照してください。</td></tr>
          <tr><td><code>beforeLeave</code></td><td>このページが破棄される前に問い合わせを受けるガードを登録します。<a href="#router-layers">離脱ガード</a>を参照してください。</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>スタックの中でのページの位置と、そこから抜け出す方法です。</p>
      <table>
        <thead><tr><th>メンバー</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>ベースページなら 0、push されたレイヤーなら 1 以上</td></tr>
          <tr><td><code>push(href)</code></td><td>ページの中から、別のレイヤーを開きます。<code>Route.push()</code> と同じです</td></tr>
          <tr><td><code>close(result?)</code></td><td>このレイヤーとその上のすべてを閉じ、開いた側の <code>push()</code> を解決します。引数なしは「閉じられた（dismissed）」という意味です。depth 0 では何もしません。</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> と <code>withLoad()</code></h3>
      <p><code>DataLoader</code> は <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code> という型で、ページモジュールの任意の <code>load</code> エクスポートに使います。<code>withLoad(loader, load)</code> は、チャンクのインポートが終わるのを待たず、並行して <code>load</code> を始めるルートを作ります。<a href="#router-loaders">ルートローダー</a>を参照してください。</p>
      <h3>型</h3>
      <p>型はすべて <code>nuclo-router</code> の名前付きエクスポートです。ページ、ローダー、ガードの型付けに、深いパスからのインポートは要りません。</p>
      <table>
        <thead><tr><th>型</th><th>内容</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>パターンに対応する params オブジェクト。<code>RouteParams</code> は型を絞らない形で、<code>Match</code> はマッチャーの結果です。</td></tr>
          <tr><td><code>PageComponent</code></td><td>ページ: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>ページモジュール: コンポーネントそのもの、または <code>import()</code> が返す <code>{ default, load? }</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>。<code>withLoad()</code> 由来の <code>load</code> を持つこともあります</td></tr>
          <tr><td><code>RouteTable</code></td><td><code>createRouter()</code> が受け取るテーブル。パターンから、ローダーまたはネストしたテーブルへの対応</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>。<code>go()</code> の第 2 引数</td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>。<code>onNavigate</code> の第 2 引数</td></tr>
          <tr><td><code>Outlet</code></td><td><code>PageProps</code> にある <code>outlet()</code> の型</td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>。<code>beforeLeave()</code> が受け取るもの</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code> のビュー。params を受け取り、コンテンツか、ページの <code>import()</code> を返します</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "レイヤーと離脱ガード",
        content: `
      <p><code>push()</code> は、現在のルートを置き換えるのではなく、その上にルートを重ねて開き、そのレイヤーが閉じたときの値で解決します。ページはスタック全体に対する 1 つの <code>list()</code> なので、レイヤーを開くのは行を 1 つ足すだけです。下のページは再レンダリングされず、DOM もフォーカスも入力途中のフォームも、レイヤーを閉じたときにそっくりそこにあります。</p>
      <p>おかげで、「まだ存在しないレコードが必要」というフローを、ユーザーが入力中のフォームを捨てさせることなく実現できます。</p>
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
      <p>レイヤーはネストできます。さらに別のダイアログが必要なダイアログは、Route を持ち出さずに <code>layer.push()</code> を呼んで await すれば済みます。</p>
      <ul>
        <li><strong>URL は最上位のレイヤーを指します。</strong><code>push()</code> は history エントリを追加するので、レイヤーはリンクでき、「戻る」で閉じられ、その <code>push()</code> は Cancel とまったく同じく「閉じられた」として解決します。「戻る」と <code>close()</code> は、同じ 1 つのコードパスです。<code>close()</code> は結果を記録してから history を戻し、<code>history.state</code> に記録された depth が唯一の拠り所です。ブラウザーがタブごとに保持するエントリは約 50 個なので、レイヤーを深く辿ったあとは、下のエントリがすでに消えていることがあります。その場合 <code>close()</code> はレイヤーをその場で閉じ、現在のエントリを、表示され続けるページの内容に書き換えます。</li>
        <li><strong>通常のナビゲーションは、スタックをクリアします。</strong>リンクのクリックや <code>go()</code> はレイヤーではありません。すべてを置き換え、開いているレイヤーをすべて閉じるので、await したまま取り残される呼び出し元は出ません。</li>
        <li><strong>URL を直接開くと、独立したページになります。</strong>URL が示すのは最上位のレイヤーだけで、その下のスタックまでは示しません。そのため、レイヤーの URL を直接開くと、depth 1 で、<code>layer.depth === 0</code> かつ <code>close()</code> が無効な状態で描画されます。push されるルートは、単独でも意味が通るように作ってください。<code>layer.depth</code> を確認して、効かない Cancel ボタンの代わりに、外へ出るリンクを置くのがおすすめです。</li>
        <li><strong>Promise は、ページを再読み込みすると引き継がれません。</strong>クロージャの中にあるからです。結果は、遠回りの手順でも成り立つフローへの近道として扱ってください。</li>
        <li><strong>await したまま取り残されるものはありません。</strong><code>stop()</code> は開いているレイヤーをすべて閉じ、ナビゲーションで放棄されたレイヤーは <code>undefined</code> で解決します。</li>
      </ul>
      <h3>離脱ガード</h3>
      <p>入力途中のフォームなど、失いたくないものを抱えたページは、ガードを登録します。ガードはページが破棄される前に問い合わせを受け、<code>false</code>（またはその Promise）を返せばページは残ります。</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>問い合わせられるのは、ページが去るときだけです。</strong>レイアウトの下での子のナビゲーションや、ページが保持されるクエリ・ハッシュの変更では呼ばれません。ガードはページと一緒に生まれ、ページと一緒に消えるので、解除の手間はありません。</li>
        <li><strong>あらゆる出口が対象です。</strong>リンク、<code>go()</code>、戻る・進む、レイヤーの <code>close()</code>、そしてルーターの管轄外の URL への <code>go()</code>（アプリを離れる場合で、<code>to</code> は <code>null</code>）。拒否された戻る・進むは巻き戻されるので、アドレスバーはそのページのままです。タブを閉じる、リロードする、といった場面は <code>beforeunload</code> の担当です。</li>
        <li><strong><code>to</code></strong> は、ナビゲーションの行き先の <code>RouteContext</code> です。ガードは内側から順に実行され、最初に拒否した時点で止まります。throw したガードも、ページを保持します。<code>close(result)</code> もガードを通るので、結果つきで閉じる前にフラグをクリアしておいてください。</li>
        <li>ルーターが巻き戻せるのは、自分が書いた history エントリだけです。ネイティブの <code>#fragment</code> リンクや、別のスクリプトの <code>pushState</code> など、ルーターが書いていないエントリへの戻る・進むでは問い合わせされません。</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() とサブルーター",
        content: `
      <p><code>router.outlet()</code> がページを描画するのに対し、<code>router.matches(table)</code> は、サイドバー、パンくず、ツールバーなど、現在地に応じて変わる別の部品を、専用の小さなテーブルから描画します。ルートを読み込むことも、ページを追加することもありません。</p>
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
        <li><strong>ルートテーブルと同じマッチングです。</strong>パターン、優先順位、生パスの照合、<code>base</code> の除去はルーター自身のものなので、ビューとページが URL の解釈でずれることはありません。<code>router.path</code> と同じく、最上位レイヤーのパスを読みます。</li>
        <li><strong>ビュー</strong>は <code>(params, ctx) =&gt; content</code> の形です。<code>params</code> はそのパターンから型が付き、<code>ctx</code> は、ビューの <code>pattern</code> と <code>params</code> を持つ <code>RouteContext</code> です。代わりにページモジュールの <code>import()</code> を返すこともでき、その場合はモジュールが届いてから <code>ctx</code> つきで呼ばれます。</li>
        <li><strong>何にも一致しなければ、何も描画されません。</strong>フォールバックが必要なら、<code>'*'</code> ビューを追加してください。outlet と同じく、<code>start()</code> の前と <code>stop()</code> のあとは空です。</li>
        <li><strong>再描画されるのはルートが変わったときだけ</strong>なので、ページが保持される変更のあいだ、ビューも DOM を保ち続けます。</li>
        <li><strong>遅延ビューは、モジュールが届くまで何も描画しません。</strong>失敗した <code>import()</code> は <code>console.error</code> に記録されるだけで、<code>router.error</code> は設定されず、次のナビゲーションで再試行されます。ふつうの <code>update()</code> では再試行されません。</li>
        <li><strong>サーバーでは</strong>遅延ビューは何も出力しません。そのモジュールを読み込むのはクライアントだからです。最初の HTML に含めたいものには、同期ビューを使ってください。</li>
      </ul>
      <h3>サブルーター</h3>
      <p>ルートはネストできるので、サブルーターの正体は、たいていはただのネストしたテーブルです。ルーターは 1 つのまま、セクション自身の <code>'/'</code> ページが共通レイアウトになり、子はそのページの <code>outlet()</code> に描画されます。だからセクション内を移動しても、共通レイアウトは保持されます。</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>もうひとつの方法は、その機能に専用のルーターを与えることです。ただし、作るだけで、開始はしません。親は 1 つのキャッチオールのエントリだけを持ち、残りのパスは、子が自分のパターン、パラメーター、フォールバックに照らして解決します。</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>肝心なのは、開始しないことです。リスナーを取り付けるのは <code>start()</code> なので、開始したルーターが 2 つあると衝突します。代償として、ルートの解決は子ルーターの担当になり、開始されたルーターなら実行してくれるルートローダーを、自分で呼ぶ必要があります。しかもこの形では、ルーターから見えるルートは 1 つだけで、残りは共通レイアウトが自力で解決するため、残りのパスが変わると共通レイアウトが再構築されます。ルーターがマウントしたままの親を得られるのは、ネストしたテーブルのほうです。その機能が本当に専用のルーター、base、フォールバックを必要とするのでなければ、ネストしたテーブルを選んでください。</p>
    `,
      },
      {
        id: "router-multi",
        title: "複数のルーターと複合ローディング",
        content: `
      <p>アプリには、領域の数だけルーターを持たせられます。話を単純に保つルールは 2 つ。<strong>ドキュメントごとに開始するのはちょうど 1 つだけ</strong>にすること、そして、ほかのルーターは開始せず、<code>match()</code> で URL を解決させることです。URL、history、クリックリスナーを握るのは、開始したルーターだけ。残りは問い合わせ用のテーブルにすぎないので、各領域は自分のタイミングで、自分のスピナーを出しながら読み込めます。</p>
      <h3>複合ローディング: ローダーの連鎖</h3>
      <p>一致した連鎖の上にあるページは、どれも <code>load()</code> をエクスポートできます。子ルートへのコールドナビゲーションでは、レイアウトのローダーとページのローダーが<strong>並行して</strong>走り、1 つの <code>router.pending</code> が連鎖全体をカバーします。両方が解決するまで前のページが画面に残るので、読み込み途中の中途半端なツリーが描画されることはありません。各コンポーネントは、自分の <code>data</code> を受け取ります。</p>
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
      <p>2 つのローダーは、順番待ちではなく同時に始まります。<code>router.pending</code> は、どちらかを await している間は true、それ以外は false です。プリロード済みのルートや eager なルートでは、切り替わりません。セクション間を移動するときはレイアウトが保持されるので、再実行されるのはセクションのローダーだけです。レイアウトのデータも DOM も入力途中の値も、そのまま残ります。同じ URL に再ナビゲーションした場合は、単一ページのときと同じく、末端のローダーが再実行され、その行が再構築されます。</p>
      <h3>複数のローディング: 独自のスピナーを持つ 2 つ目のルーター</h3>
      <p>サイドバー、トレイ、ライブリージョンのような独立した領域には、作るだけで開始はしない専用のルーターと、専用のローディングフラグを持たせます。<code>router.pending</code> は開始したルーターのもので、この領域のことは何も語りません。だから 2 つの読み込みは並行して進められ、どちらが先に終わっても構いません。</p>
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
      <p>2 つ目のルーターは、問い合わせられるだけで、命令を出すことはありません。<code>match()</code> は URL を読んでコンテキストを返すだけで、サイドバーに関するものは、メインのルートテーブルに一切入りません。<code>onNavigate</code> は、解決されたすべてのナビゲーション（最初の 1 回も含む）のあとに実行されるので、独立した領域を URL と同期させるなら、ここが唯一の場所です。</p>
      <ul>
        <li><strong><code>pending</code> は、開始したルーターのものです。</strong>開始していないルーターには、Route も <code>pending</code> も <code>error</code> もありません。領域は自分のフラグを管理して、2 つ目のスピナーを最初のスピナーの隣に置けます。デモではサイドバーに 800ms、ルートのローダーに 900ms かかるので、ページが先に終わることもあれば、サイドバーが先になることもあります。</li>
        <li><strong><code>match()</code> は、何も取り付けません。</strong>開始していないルーターは、いくつでもドキュメントを共有できます。それぞれが自分のテーブル、base、モジュールキャッシュを持ち、history には一切触れません。コストは、テーブルとマッチャー 1 つ分だけです。</li>
        <li><strong>ローダーは一切実行されません。</strong>開始したルーターは、一致したページの <code>load()</code> を実行します。開始していないルーターは解決するだけなので、ビューにデータが必要なら、自分でフェッチしてください。デモの <code>refreshSidebar()</code> がまさにそれです。ローダーを使いたいなら、<a href="#router-matches">ネストしたテーブル</a>か、<a href="#router-regions">ページが埋めるリージョン</a>にすれば、その仕事は開始したルーターに任せられます。</li>
        <li><strong>古い応答には要注意です。</strong>サイドバーの取得が遅れても、すでに離れたセクションのデータを表示してはいけません。更新のたびに世代カウンターを進め、世代が合わなくなった応答は捨ててください。新しいナビゲーションが始まったときに、ルーターが古いナビゲーションを無効にするのと同じやり方です。</li>
        <li><strong>遅延 <code>matches()</code> ビューにも、<code>pending</code> はありません。</strong>モジュールの読み込みが終わるまで、何も描画しないだけです。ローディングの仕組みは 3 種類で、タイミングもそれぞれ独立しています。ルートの <code>pending</code>、自前のフラグ、そして「まだ存在していない」遅延ビューです。</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "リンクの処理",
        content: `
      <p>委譲リスナーがナビゲートするのは、<code>&lt;a href&gt;</code> への左クリック（SVG の <code>&lt;a&gt;</code> や、その内側にネストした要素へのクリックも含む）だけで、それ以外には一切手を出しません。具体的には、修飾キー付きクリックと中クリック、<code>_self</code> 以外の <code>target</code>、<code>download</code>、<code>rel="external"</code>、クロスオリジンの href、現在のページ内のハッシュだけのリンク、<code>base</code> の外のパス、どのルートにも一致しないパス（だからサーバーレンダリングされた 404 にも到達できます）、そしてアプリのハンドラーがすでに <code>preventDefault()</code> を呼んだイベントです。リンクを明示的に対象外にしたいときは、<code>data-nuclo-router="off"</code> を付けてください。</p>
      <h3>スクロール</h3>
      <p>push によるナビゲーションでは、現在のスクロール位置が保たれます。新しい URL に、ページ内の要素と一致する <code>#hash</code> があれば、その要素までスクロールします。<code>popstate</code> のときのスクロールは、ブラウザーに任せます。新しいページを先頭から見せたいなら、ナビゲーションの種類を教えてくれる <code>onNavigate</code> の中で行いましょう。</p>
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
        <li><strong>余計なものは抱え込みません。</strong>Route が持つのはページ関数とそのコンテキストだけで、DOM は決して持ちません。離れたページは解放されます。<code>stop()</code> はリスナーと進行中の読み込みを解放して <code>pending</code> をクリアするので、停止した Route がスピナーを出しっぱなしにすることはありません。<code>stop()</code> のあとに解決したモジュールは、エラーを出さずに破棄されます。</li>
        <li><strong>サーバーでは、複数のリクエストを安全に並行処理できます。</strong><code>start()</code> はリクエストごとの状態を返し、<code>run()</code> はそれを 1 回の同期レンダリングの範囲に閉じ込めるので、同時に走るリクエストが互いのルートを見ることはありません。共有されるのはモジュールキャッシュだけです。スコープは、<code>run()</code> に渡した関数が戻った時点で終わります。<code>renderToString()</code> は同期なので、それで十分です。非同期やストリーミングのレンダリングでは Route を <code>await</code> の向こうまで運ぶ必要がありますが、<code>run()</code> はそこまで面倒を見ません。</li>
        <li><strong><code>popstate</code> でのスクロール復元</strong>は、ルーターではなくブラウザーの仕事（<code>scrollRestoration</code>）です。</li>
        <li><strong>開始するルーターは、ドキュメントごとに 1 つにしてください。</strong><code>start()</code> のたびに専用の委譲 <code>click</code> リスナーが追加され、2 つ目のルーターの <code>start()</code> は、最初のルーターを止めてくれません。止まるのは、同じルーターに対して <code>start()</code> を 2 回呼んだときだけです。別のテーブルで URL を解決したいなら、ルーターを作って <code>match()</code> だけを呼んでください。何も取り付けません。独立した領域は、この方法で、ルートの <code>pending</code> の隣に自分専用のローディングを持てます。<a href="#router-multi">複数のルーターと複合ローディング</a>を参照してください。</li>
        <li><strong>あえて入れていないもの:</strong> ハッシュ history とメモリ history（ルートは pathname にあり、サーバーがすべてのルートを配信する必要があるため）。1 つの URL で動かす 2 つの独立したルーティング領域（ページは <code>into()</code> で複数のリージョンを埋められますが、それらはすべて 1 つの一致したルートに属します。独立した領域には、<a href="#router-multi">複数のルーターと複合ローディング</a>のように、開始しない専用のルーターとローディングを持たせられます）。そしてホバー時のプリロード（<code>mouseenter</code> からルート自身のローダーを呼べば実現できます）。</li>
      </ul>
      <h3>サンプル</h3>
      <p>リポジトリには、動かして確かめられるサンプルが 2 つあります。互いに補い合っていて、あらゆる設定をどちらかで観察できます。</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: API 全体を巡る、クライアントサイドのツアーです。すべてのパターン形式と優先順位の規則、リンク処理から除外する方法、操作できるコントロール付きのすべての Route メンバー、サブルーター、3 段のレイヤースタック、2 つの親にマウントした相対セクション、そして <code>pending</code> と <code>error</code> を伴うルートローダー。これらの状態が目で追えるよう、<code>preload: false</code> にしてあります。</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: リクエストごとの <code>renderToString()</code>、サーバーのノードを引き継いでいることを確かめられるハイドレーション、本物の 404 ステータスコード、ルート以外の <code>base</code>、ネットワークパネルで眺められるアイドル時のプリロード、そしてハイドレーションで再フェッチが起きないよう、サーバーからクライアントへデータを渡すローダーを扱います。</li>
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
      <p>Nuclo に、算出値（computed）のための API はありません。ふつうの関数を書いて、動的な値の中から呼べば十分です。</p>
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
      <p>書き方はふつうの <code>async</code>/<code>await</code> のまま、state が変わるたびに <code>update()</code> を呼ぶだけです。フェッチなら、<code>await</code> の前に 1 回、あとに 1 回になります。</p>
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
        <li><strong>変更はまとめる。</strong>必要な state をすべて書き換えてから、<code>update()</code> を 1 回だけ呼びましょう。</li>
        <li><strong>動的な値を返す関数は、速く、副作用なしに。</strong><code>update()</code> のたびに、すべて実行されます。</li>
        <li><strong><code>scope()</code> を活用する。</strong>タイピングやタイマーのような、小さくて頻繁な更新に向いています。</li>
        <li><strong>ドキュメントの中にレンダリングする。</strong><code>update()</code> の実行時にドキュメントの外にあるノードは、更新されなくなります。</li>
        <li><strong><code>when()</code> と <code>list()</code> を使う。</strong>変化する子要素には、ノードを返す関数ではなく、こちらを使ってください。</li>
        <li><strong><code>class</code> ではなく <code>className</code> を使う。</strong>動的なクラスは、<code>() =&gt; cx(...)</code> か <code>{ className: () =&gt; … }</code> で書きます。</li>
        <li><strong>スタイルの定義は 1 回だけ。</strong>モジュールのトップレベルに置きましょう。</li>
        <li><strong>サーバーサイドレンダリング:</strong> 先にレンダリングし、そのあと <code>getCssText()</code> の結果を <code>&lt;style id="nuclo-styles"&gt;</code> に入れます。リクエストのデータは引数で渡し、出力に含まれる HTML コメントは消さないでください。</li>
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
      <p>公開されているすべての関数と、その提供元の一覧です。</p>
      <h3><code>nuclo</code>（グローバルおよび名前付きエクスポート）</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: すべての動的な値（または指定した scope 内のもの）を実行します。</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: <code>update(id)</code> で狙えるよう、要素に scope の id を与えます。</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: 条件つきコンテンツ。<code>.when()</code> と <code>.else()</code> でつなげます。</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: 項目ごとに 1 行。同一性で突き合わせます。</li>
        <li><a href="#api-region"><code>region(options)</code></a> と <a href="#api-region"><code>into(id, ...content)</code></a>: ツリーの中の名前つきの場所と、どこからでもそこを埋められるコンテンツ。</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: イベントリスナー。または <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>。</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: 組み立てて、追加します。</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: サーバーが出力した HTML を引き継ぎます。</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: コンポーネントをもう一度呼び出し、DOM にパッチを当てます。</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: スタイルオブジェクトから生成するクラス。</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: スタイルを合成します。あとのものが勝ちます。</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: テーマに紐づいた <code>css</code>、<code>cx</code>、<code>variants</code>、<code>keyframes</code>、<code>globalStyle</code>。</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: オプションの組み合わせからスタイルを作ります。</li>
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
        <li><a href="#api-polyfill">副作用インポート</a>。ほかに <code>document</code>、<code>Event</code>、<code>CustomEvent</code>、<code>Node</code>、<code>Element</code>、<code>HTMLElement</code>、および <code>Nuclo*</code> クラス。</li>
      </ul>
      <h3><code>nuclo-router</code>（別パッケージ）</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: ルーター本体。<code>start()</code>、<code>match()</code>、<code>outlet()</code>、<code>matches()</code>、<code>go()</code>、<code>push()</code>、<code>href()</code>、<code>stop()</code> を備えています。</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: チャンクの読み込みと並行して、データローダーを開始するルート。</li>
        <li><a href="#router-api">型</a>: <code>RouteContext</code>、<code>PageProps</code>、<code>Params</code>、<code>DataLoader</code>、<code>RouteTable</code> ほか。</li>
      </ul>
      <h3>グローバルのみ</h3>
      <ul>
        <li><a href="#tag-builders">175 個のタグビルダー</a>: <code>div</code>、<code>span</code>、…、<code>var_</code>、および <code>svgSvg</code>、<code>pathSvg</code>、…。</li>
        <li><a href="#typescript-setup">型</a>: <code>NodeModFn</code>、<code>NodeModLike</code>、<code>ExpandedElement</code> など。<code>StyleResult</code> のようなスタイリング関連の型は、<code>'nuclo'</code> からもインポートできます。</li>
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
      <h3>state を書き換えると、UI は自動で更新されますか？</h3>
      <p>いいえ。<code>update()</code> を呼ぶまで、DOM はそのままです。</p>

      <h3>Nuclo はシグナル、プロキシ、仮想 DOM を使っていますか？</h3>
      <p>いいえ。state は素の JavaScript のままです。ツリーをレンダリングすると、Nuclo は本物の要素とテキストノードを作ります。<code>update()</code> は、登録されたすべての動的な値（または指定した scope 内のもの）を実行し、値が変わったところで、同じノードにパッチを当てます。依存グラフも、仮想ツリーもありません。</p>

      <h3>ページに "false" が表示されるのはなぜですか？</h3>
      <p>boolean はテキストとして描画されるからです。<code>div(ok &amp;&amp; span('Done'))</code> と書くと、"false" と表示されます。子要素には <code>when(() =&gt; ok, span('Done'))</code> を、テキストには <code>ok ? 'Done' : ''</code> を使いましょう。</p>

      <h3>項目を編集してもリストの行が変わらないのはなぜですか？</h3>
      <p>リストに残っている項目の行は保持され、再レンダリングされないからです。変化するフィールドには、<code>() =&gt; todo.text</code> のような動的な値を使ってください。詳しくは <a href="#api-list"><code>list()</code></a> を参照してください。</p>

      <h3>UI の一部が更新されなくなるのはなぜですか？</h3>
      <p>多くの場合は、<code>update()</code> が走った時点で、そのノードがドキュメントの中になかったことが原因です。Nuclo はそういうノードの追跡をやめ、あとから取り付けても再開しません。ドキュメントの中にあるコンテナーにレンダリングしてください。ほかにも原因が 2 つあります。条件が throw する <code>when()</code> は更新が止まり、最初の実行で throw するテキスト関数は、空のままになります。<a href="#api-update"><code>update()</code></a> を参照してください。</p>

      <h3><code>forceUpdate()</code> はいつ使うべきですか？</h3>
      <p>言語の切り替えのように、静的な値がまれに変わる場面だけで使ってください。それ以外は、すべて <code>update()</code> で済みます。<a href="#api-force-update"><code>forceUpdate()</code></a> を参照してください。</p>

      <h3>prop で渡さずに、ページをレイアウトにはめ込むには？</h3>
      <p><code>region({ id: 'main' })</code> で場所を示し、ページ側から <code>into('main', …)</code> を返してください。<a href="#api-region"><code>region()</code> と <code>into()</code></a> を参照してください。</p>

      <h3>アプリを unmount するにはどうすればよいですか？</h3>
      <p><code>when()</code> で包んで、条件をオフにしてください。DOM を自分で削除しても、<code>onDestroy</code> は実行されません。<a href="#lifecycle">ライフサイクル</a>を参照してください。</p>

      <h3>Nuclo にはルーターが含まれていますか？</h3>
      <p>本体には含まれていません。ルーティングは <code>nuclo-router</code> という別パッケージで、サーバーサイドレンダリング、ハイドレーション、コード分割されたルート、アイドル時のプリロードを備えています。<code>npm install nuclo nuclo-router</code> で入れてください。<a href="#router-overview">nuclo-router</a> を参照してください。</p>

      <h3>Nuclo に effect はありますか？</h3>
      <p>いいえ。<code>onMount</code> と <code>onDestroy</code> は、要素ごとに 1 回だけ、挿入と削除に合わせて実行されます。state が変わっても再実行されるものは、ひとつもありません。</p>
    `,
      },
    ],
  },

];
