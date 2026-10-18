import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "はじめに",
    sections: [
      {
        id: "overview",
        title: "概要",
        content: `
      <p>Nuclo は、TypeScript のための小さな DOM ライブラリです。<code>div()</code> や <code>button()</code> といった素の関数で UI を組み、state は普通の変数に置いておく。画面を変えたくなったら <code>update()</code> を呼ぶ。Nuclo の使い方は、本当にこれだけです。</p>
      <p>仮想 DOM もコンパイラも、Proxy もシグナルもありません。</p>
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
      <h3>メンタルモデル</h3>
      <ol>
        <li>タグビルダーで UI を組みます。</li>
        <li>state に依存する値は、関数にして渡します。</li>
        <li>state は素の JavaScript でそのまま書き換えます。</li>
        <li>最後に <code>update()</code> を呼びます。Nuclo が関数を再実行し、差分だけ DOM に反映します。</li>
      </ol>
      <p>変数を書き換えただけでは、DOM は何も変わりません。画面が動くのは、<code>update()</code> を呼んだ瞬間だけです。</p>
    `,
      },
      {
        id: "quick-start",
        title: "クイックスタート",
        content: `
      <p><code>create-nuclo</code> を使うと、Nuclo がすぐ動く Vite + TypeScript のプロジェクトが一発でできあがります。</p>
    `,
        afterContent: `
      <p>実行するとプロジェクト名を聞かれます。対話を飛ばしたいときは、名前とフラグを直接渡してください。npm の場合、フラグの前に <code>--</code> が必要です。</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>あとは依存関係をインストールして、開発サーバーを立ち上げるだけです。</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>オプション</h3>
      <ul>
        <li><code>[project-name]</code>: 生成先のフォルダー。省略すると <code>nuclo-app</code> になります。</li>
        <li><code>-t, --template &lt;name&gt;</code>: 使うテンプレート。今のところ <code>basic</code> だけです。</li>
        <li><code>-y, --yes</code>: 対話をスキップして、デフォルト値で進めます。</li>
        <li><code>-f, --force</code>: 空でないフォルダーにも書き込みます。</li>
        <li><code>-h, --help</code>: ヘルプを表示します。</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "インストールとインポート",
        content: `
      <p>既存のプロジェクトに足すなら、これだけです。</p>
      ${sh("npm install nuclo")}
      <p><code>pnpm add nuclo</code>、<code>yarn add nuclo</code>、<code>bun add nuclo</code> でも OK です。Nuclo 自体は依存パッケージを一切持ちません。</p>
      <p>ルーティングはコアには入っていません。<a href="#router-overview"><code>nuclo-router</code></a> という別パッケージなので、必要になったときに <code>nuclo</code> と一緒に追加してください。</p>
      <h3>グローバル</h3>
      <p><code>import 'nuclo'</code> すると、次のものが <code>globalThis</code> に登録されます。</p>
      <ul>
        <li><strong>175 個のタグビルダー</strong>: HTML 用が 112 個（<code>div</code>、<code>span</code>、<code>button</code>、…）、SVG 用が 63 個で、こちらは <code>Svg</code> サフィックス付きです（<code>svgSvg</code>、<code>pathSvg</code>、…）。<a href="#tag-builders">タグビルダー</a>を参照してください。</li>
        <li><strong>16 個のヘルパー</strong>: <code>update</code>、<code>scope</code>、<code>when</code>、<code>list</code>、<code>region</code>、<code>into</code>、<code>on</code>、<code>render</code>、<code>hydrate</code>、<code>forceUpdate</code>、<code>css</code>、<code>cx</code>、<code>createCss</code>、<code>variants</code>、<code>keyframes</code>、<code>globalStyle</code>。</li>
      </ul>
      <p>この import は、ビルダーを呼ぶどのコードよりも先に評価されている必要があります。ES モジュールは import の順に実行されるので、次のように書くと落ちます。</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>エントリーファイルの一番上に <code>import 'nuclo'</code> を置くか、グローバルを使う各ファイルで import しておきましょう。</p>
      <h3>名前付きインポート</h3>
      <p>ヘルパーは named export としても使えます（中身はグローバルと同じ関数です）。<code>getCssText()</code> と <code>resetStyles()</code> は named export 専用です。一方タグビルダーはグローバルだけなので、<code>import { div } from 'nuclo'</code> は動きません。</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>エントリーポイント</h3>
      <ul>
        <li><code>nuclo</code>: グローバルを登録し、16 個のヘルパーに加えて <code>getCssText</code> と <code>resetStyles</code> を export します。</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>、<code>renderManyToString</code>、<code>renderToStringWithContainer</code>、<code>getCssText</code>。<a href="#api-ssr">サーバーサイドレンダリング</a>を参照してください。</li>
        <li><code>nuclo/polyfill</code>: Node / Bun 用のミニ DOM。<a href="#api-polyfill">nuclo/polyfill</a> を参照してください。</li>
        <li><code>nuclo/types</code>: 型定義だけ。<a href="#typescript-setup">TypeScript</a> を参照してください。</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>型定義は Nuclo に同梱されています。必要な設定は次の 2 つだけです。</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>。<code>node16</code> と <code>nodenext</code> は未対応です。</li>
        <li><code>DOM</code> lib。<code>lib</code> を指定していなければ、TypeScript が最初から含めてくれます。</li>
      </ul>
      <p>プロジェクト内のどこか 1 ファイルでも <code>'nuclo'</code> を import していれば、グローバルの型はすべてのファイルから見えます。追加の設定は不要です。どのファイルも import していないケース（たとえばテスト用に別の tsconfig を切っている場合など）だけ、型を自分で足してください。</p>
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
      <p><code>.d.ts</code> に <code>/// &lt;reference types="nuclo/types" /&gt;</code> を書く方法でも構いません。</p>
      <h3>便利な型</h3>
      <p>これらの型はグローバルなので、import なしで使えます。</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: タグビルダーの戻り値の型。コンポーネントの戻り値に付けるのが定番です。</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: タグビルダーが引数に取れるものすべて。</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: <code>render()</code> と <code>hydrate()</code> が返す型。</li>
        <li><code>ElementTagName</code>: 任意の HTML タグ名。</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: タグビルダーが受け取る属性オブジェクト。<code>on*</code> ハンドラーや <code>onMount</code>、<code>onDestroy</code> も含みます。属性をそのまま下に流すコンポーネントで重宝します。</li>
        <li><code>MountCallback</code> と <code>DestroyCallback</code>: <code>onMount</code> / <code>onDestroy</code> のハンドラー型。</li>
        <li><code>WhenBuilder</code>、<code>ListModifier</code>: <code>when()</code> と <code>list()</code> が返す型。</li>
        <li><code>RegionOptions</code>、<code>RegionType</code>: <code>region()</code> に渡すオプションの型。</li>
        <li><code>StyleResult</code>、<code>Style</code>、<code>ThemeConfig</code>、<code>CssInstance</code> 、そのほかスタイリング関連の型。こちらは明示的に import することもできます: <code>import type { StyleResult } from 'nuclo'</code>。</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> はは DOM のメンバーをすべて optional として扱います。フルの要素型がほしいときはキャストしましょう: <code>render(App, root) as HTMLDivElement</code>。</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "UI の構築",
    sections: [
      {
        id: "tag-builders",
        title: "タグビルダー",
        content: `
      <p>HTML のタグは、どれも同名のグローバル関数として用意されています。<code>div</code>、<code>span</code>、<code>input</code>、… 例外は <code>&lt;var&gt;</code> だけで、<code>var</code> が予約語なので <code>var_</code> になります。SVG のタグにはすべて <code>Svg</code> サフィックスが付きます: <code>svgSvg</code>、<code>pathSvg</code>、<code>circleSvg</code>、…</p>
      <p>タグビルダーを呼んでも、その場で要素ができるわけではありません。<code>div('Hi')</code> が返すのは<strong>ビルダー</strong>、つまり「あとで要素を作る関数」です。Nuclo がそれを呼び出すのは、<code>render()</code> でマウントしたときや、別のビルダー・<code>when()</code>・<code>list()</code> の中に置かれたとき。呼ばれるたびに、新しい要素が作られます。</p>
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
      <h3>引数</h3>
      <p>ビルダーは引数をいくつでも受け取り、左から右へ順に適用していきます。</p>
      <ul>
        <li><strong>string、number、bigint</strong>: テキストノードになります。</li>
        <li><strong><code>() =&gt; value</code></strong>: <code>update()</code> のたびに変わるテキスト。詳しくは<a href="#dynamic-functions">動的な値</a>へ。</li>
        <li><strong><code>null</code>、<code>undefined</code></strong>: 無視されます。</li>
        <li><strong><code>true</code>、<code>false</code></strong>: "true" / "false" という文字列として表示されます。条件分岐には <code>when()</code> を使ってください。</li>
        <li><strong>プレーンオブジェクト</strong>: 属性として扱われます。<a href="#attributes">属性</a>を参照。</li>
        <li><strong><code>css()</code>、<code>cx()</code>、<code>variants()</code> の結果</strong>: そのクラスが付与されます。</li>
        <li><strong><code>on(...)</code></strong>: イベントリスナー、またはライフサイクルフック。</li>
        <li><strong>別のビルダー、<code>when()</code>、<code>list()</code></strong>: 子要素として追加されます。</li>
        <li><strong>DOM の <code>Node</code></strong>: そのまま追加されます。</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: カスタムモディファイア。下で説明します。</li>
      </ul>
      <h3>ハマりどころ</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> は "false" という文字が画面に出てしまいます。<code>div(when(() =&gt; isAdmin, span('Admin')))</code> と書きましょう。</li>
        <li>配列はそのままでは子要素になりません。スプレッドして渡します: <code>ul(...names.map((n) =&gt; li(n)))</code>。中身が変わるリストには <code>list()</code> を使います。</li>
        <li>タグ名と同じ名前のローカル変数は、ビルダーをシャドウイングします。たとえば <code>function Row(label: string)</code> の中では <code>label(...)</code> を呼べません。<code>label</code>、<code>title</code>、<code>data</code>、<code>p</code>、<code>a</code>、<code>i</code> といった名前の変数は、別名にしておきましょう。</li>
        <li>ブラウザーは <code>id</code> を持つ要素を、すべてグローバル変数として露出します。Nuclo が読み込まれる時点で、ページ上にすでに <code>&lt;main id="main"&gt;</code> があると、Nuclo はそのグローバルを上書きしません。結果、<code>main(...)</code> が <code>TypeError</code> になります。id は別の名前にしてください。</li>
      </ul>
      <h3>カスタムモディファイア</h3>
      <p>パラメーターを 1 つ以上宣言した関数は、要素の構築中に、引数の並び順どおり 1 回だけ実行されます。第 1 引数は要素です。第 2 引数は内部用のインデックスなので、アテにしないでください。戻り値が文字列か数値ならテキストに、<code>Node</code> なら子として追加され、オブジェクトなら属性として適用されます。</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>要素の取得</h3>
      <p>ルート要素は <code>render()</code> の戻り値で手に入ります。ツリーの途中の要素がほしいときは、<code>on("mount", (el) =&gt; …)</code> かカスタムモディファイアを使います。ビルダー関数を自分で呼び出せば、ドキュメントに繋がっていない要素を作ることもできます。</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>次の <code>update()</code> が走る前に、ドキュメントへ追加しておいてください。<code>update()</code> の時点でドキュメントに繋がっていないノードは、それ以降ずっと更新されなくなります。</p>
      <h3>SVG</h3>
      <p>SVG ビルダーも、受け取る引数は同じです。Nuclo は SVG の属性をすべて <code>setAttribute</code> で設定するので、<code>"stroke-width"</code> のような名前もそのまま書けます。</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>すべてのビルダー</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "コンポーネント",
        content: `
      <p>コンポーネントとは、<code>button(...)</code> のようなビルダーを返すだけの関数です。コンポーネント専用の API は存在しません。render するか、ツリーに置かれるまでは、何も作られません。</p>
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
      <p>関数の中で宣言した state は、そのインスタンス専用です。外側で宣言した state は、全インスタンスで共有されます。なお <code>forceUpdate()</code> はコンポーネントをもう一度呼び直すため、内側の state はリセットされます。</p>
      <p>children は、ただの引数です。</p>
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
      <p>属性は、プレーンオブジェクトで渡します。オブジェクトは複数渡してもよく、同じキーは後のものが勝ちます。ただし <code>className</code> と <code>style</code> はマージされます。値は静的な値でも、<code>update()</code> のたびに再実行される引数なしの関数でも構いません。</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>値の設定方法</h3>
      <ul>
        <li>HTML 要素に同名のプロパティがあれば（<code>value</code>、<code>checked</code>、<code>disabled</code>、<code>htmlFor</code>、<code>tabIndex</code>、…）、Nuclo はそのプロパティに代入します。なければ <code>setAttribute(key, String(value))</code> を呼びます。<code>"aria-*"</code> や <code>"data-*"</code> はこちらです。</li>
        <li>SVG 要素では、常に <code>setAttribute</code> が使われます。</li>
        <li><code>null</code> と <code>undefined</code> は無視されます。動的な値が <code>null</code> や <code>undefined</code> を返した場合も、前の値が残ります。値を消したいときは <code>""</code> を、boolean プロパティなら <code>false</code> を返してください。</li>
        <li>boolean が意味を持つのは、DOM の boolean プロパティ（ボタンの <code>disabled</code>、<code>checked</code>、<code>hidden</code>、<code>required</code> など）に対してです。それ以外では、<code>true</code> / <code>false</code> は "true" / "false" という文字列として書き込まれます。</li>
        <li><code>"data-*"</code> のキーで書いてください。<code>dataset</code> には対応していません。</li>
        <li><code>innerHTML</code> はエスケープされませんし、SSR でも出力されません。使わないのが無難です。</li>
      </ul>
      <h3>クラス</h3>
      <p>クラスは <code>className</code> で指定します。静的なクラス文字列、<code>css()</code> の結果、動的な <code>className</code> は、すべてマージされます。動的な <code>className</code> が <code>""</code> を返したときも、静的なクラスはそのまま残ります。</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>HTML 要素では、<code>class</code> キーは使わないでください。生の属性をそのまま書き込むため、<code>css()</code> のクラスを含め、それまでに付いたクラスがすべて上書きされてしまいます。</p>
      <h3>インラインスタイル</h3>
      <p><code>style</code> には、camelCase のキーを持つオブジェクトか、それを返す関数を渡します。</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>単位は自動では付きません。<code>12</code> ではなく <code>"12px"</code> と書きます。<code>opacity</code> や <code>zIndex</code> のように単位を持たないプロパティは、数値で渡せます。</li>
        <li><code>""</code>、<code>null</code>、<code>undefined</code> を渡すと、そのプロパティはクリアされます。</li>
        <li>動的なスタイルが設定するのは、返したキーだけです。返さなくなったキーには前の値が残るので、消したいときは <code>""</code> を返してください。</li>
        <li>スタイル文字列（<code>"color: red"</code>）とカスタムプロパティ（<code>"--gap"</code>）は使えません。代わりに <code>css()</code> を使いましょう。カスタムプロパティは <a href="#style-objects"><code>raw</code></a> 経由で渡せます。</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "イベント",
        content: `
      <p>イベントを購読する方法は 2 つ。<code>on*</code> 属性と、<code>on()</code> モディファイアです。</p>
      <h3><code>on*</code> 属性</h3>
      <p>属性オブジェクトの中で、<code>onClick</code> のように <code>on</code> + 大文字で始まるキーに置いた関数は、動的な値ではなくイベントハンドラーとして扱われます。</p>
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
        <li>イベントの型は、キーと要素から TypeScript が推論してくれます。<code>e.currentTarget</code> も <code>this</code> も、その要素を指します。</li>
        <li>裏ではネイティブのプロパティに代入しているので、<code>onClick</code> は <code>el.onclick</code> になります。つまりイベントごとにハンドラーは 1 つだけで、後から書いた <code>onClick</code> が先のものを置き換えます。</li>
        <li><code>onDoubleClick</code> と <code>onDblClick</code> は、どちらも <code>dblclick</code> のことです。<code>onclick</code> のような小文字のキーは型エラーになります。</li>
        <li>既知のイベントでなければ、小文字にした名前で購読します: <code>onMyEvent</code> は <code>"myevent"</code> をリッスンします。</li>
        <li>ハンドラー内で投げられたエラーは、Nuclo ではキャッチされません。</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> は、要素に <code>addEventListener</code> するモディファイアを返します。</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li><code>on()</code> は呼ぶたびにリスナーを追加し、登録順にすべて実行されます。</li>
        <li><code>options</code> は、そのまま <code>addEventListener</code> に渡されます: <code>capture</code>、<code>once</code>、<code>passive</code>、<code>signal</code>。</li>
        <li><code>on()</code> をビルダーに直接渡すと、要素の型が推論されます: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>。</li>
        <li>リスナーが例外を投げても、Nuclo が <code>console.error</code> に出力するだけで、ほかのリスナーは続けて実行されます。</li>
        <li>要素が削除されるときには、リスナーも外されます。サーバー上では <code>on()</code> は何もしません。</li>
        <li>1 つの <code>on()</code> の値は、複数の要素で使い回せます。</li>
      </ul>
      <p>カスタムイベントは、イベント型をジェネリクスで渡します。</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>使い分け</h3>
      <p>基本は <code>on*</code> 属性で十分です。1 つのイベントに複数のリスナーを付けたいとき、リスナーオプションが必要なとき、<code>"my-event"</code> のようなカスタムイベント名を使いたいときは、<code>on()</code> の出番です。</p>
    `,
      },
      {
        id: "lifecycle",
        title: "ライフサイクル",
        content: `
      <p><code>onMount</code> は、要素が挿入されたあとに 1 回だけ呼ばれます。<code>onDestroy</code> は、Nuclo が要素を取り除くときに 1 回だけ呼ばれます。書き方は属性でも <code>on()</code> でも OK で、どちらも挙動は同じ。要素の型はタグから推論されます。</p>
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
      <h3>実行タイミング</h3>
      <ul>
        <li><code>onMount</code> が走るのは、その要素を挿入した <code>render()</code>、<code>hydrate()</code>、<code>update()</code>、<code>forceUpdate()</code> の呼び出しが終わる間際です。ツリーを構築している最中に呼ばれることはありません。</li>
        <li><code>onMount</code> が関数を返すと、それは破棄時に、要素の <code>onDestroy</code> コールバックのあとで実行されます。</li>
        <li><code>onDestroy</code> は、Nuclo が要素を取り除くときに呼ばれます。具体的には、<code>list()</code> の行が消えたとき、<code>when()</code> のブランチが切り替わったとき、<code>into()</code> がリージョンから抜けたとき、<code>forceUpdate()</code> が要素を捨てたときです。削除の直前に実行されるので、その時点で要素はまだドキュメント内にあります。</li>
      </ul>
      <h3>DOM を直接いじって消した場合</h3>
      <p><code>node.remove()</code> や <code>innerHTML = ''</code> で自分で要素を消してしまうと、その要素の <code>onDestroy</code> もクリーンアップも実行されず、タイマーは動き続けます。Nuclo に <code>unmount()</code> はありません。クリーンアップ込みでアプリごと破棄したいときは、<code>when()</code> で包みましょう。</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>順序とエラー</h3>
      <ul>
        <li>どちらの書き方でも、フックはいくつでも登録できます。実行は登録順です。</li>
        <li><code>onDestroy</code> は、常に子が先、親があとです。</li>
        <li>マウントの順番は、各要素の最初の <code>onMount</code> フックで決まります。これは引数の並び順に従い、1 つの要素のフックはまとめて実行されます。子が親に依存しているなら、親のフックを子より前に渡してください。</li>
        <li>フックが例外を投げても <code>console.error</code> に出るだけで、ほかのフックは実行されます。</li>
        <li>コールバックは「何も返さない」か「クリーンアップ関数を返す」かのどちらかなので、<code>async</code> にはしないでください。返された Promise がクリーンアップとして使われることはありません。非同期の処理は、中で起動する形にします: <code>{ onMount: (el) =&gt; { void load(el) } }</code>。</li>
        <li>フックはサーバーでは実行されません。クライアントでは <code>hydrate()</code> のあとに実行されます。</li>
      </ul>
      <div class="docs-callout"><strong>注:</strong> これらのフックは effect ではありません。state が変わっても再実行されず、要素ごとに多くても 1 回しか実行されません。</div>
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
        title: "明示的な更新",
        content: `
      <p>Nuclo が、勝手に画面を更新することはありません。state を書き換えたら、<code>update()</code> を呼んでください。</p>
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
      <p>state は何度書き換えても構いません。そのあと <code>update()</code> を 1 回呼べば、それで十分です。</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p><code>update()</code> を呼ぶ場所は、イベントハンドラー、タイマー、fetch の callback、<code>onMount</code> などです。動的な値の中から呼ぶのはやめてください。</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "動的な値",
        content: `
      <p><strong>引数を取らない</strong>関数は、<strong>動的な値</strong>として扱われます。Nuclo は要素の構築時に 1 回実行し、あとは <code>update()</code> のたびに再実行します。使える場所は、テキストの子要素、属性値、<code>style</code>、<code>className</code>。表示の出し分けや繰り返しが絡む子要素には、<a href="#api-when"><code>when()</code></a> と <a href="#api-list"><code>list()</code></a> を使ってください。</p>
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
      <p>Nuclo は関数の引数の数（<code>fn.length</code>）を見て判別します。引数を宣言した関数は<a href="#tag-builders">カスタムモディファイア</a>とみなされ、実行は 1 回きり。<code>(x = 0) =&gt; …</code> や <code>(...args) =&gt; …</code> は length が 0 になるので、動的な値の側に入ります。</p>
      <h3>動的なテキスト</h3>
      <ul>
        <li>string、number、bigint、boolean は <code>String(value)</code> で表示されます。<code>() =&gt; ok &amp;&amp; 'Saved'</code> だと "false" が出てしまうので、<code>() =&gt; (ok ? 'Saved' : '')</code> と書きましょう。</li>
        <li><code>null</code> と <code>undefined</code> は、空のテキストになります。</li>
        <li>初回の実行で <code>css()</code> や <code>cx()</code> の結果を返した関数は、テキストではなく動的なクラスとして扱われます。<a href="#api-cx"><code>cx()</code></a> を参照。</li>
        <li>ノード、ビルダー、配列、プレーンオブジェクトを返しても、何も表示されず、更新もされません。</li>
      </ul>
      <h3>動的な属性</h3>
      <ul>
        <li>Nuclo が DOM に書き込むのは、自分が最後に書いた値と変わったときだけです。実際の DOM の値とは比較しません。そのため、ユーザーが input に打ち込んだあとで関数が前回と同じ値を返しても、入力されたテキストは上書きされません。</li>
        <li>結果が <code>null</code> / <code>undefined</code> なら何も書き込まれず、前の値が残ります。例外は <code>className</code> で、falsy な結果が返ると動的なクラスだけが外れ、静的なクラスは残ります。</li>
        <li><code>style</code> の関数は、返したオブジェクトを更新のたびに適用します。</li>
      </ul>
      <h3>エラー</h3>
      <p>動的な値が例外を投げても、Nuclo はそれをキャッチして、残りの更新を続けます。テキストは空になるか前の値のまま、属性は前の値のままになり、次に成功した <code>update()</code> で元に戻ります。唯一の例外は、<strong>初回</strong>の実行で投げたテキスト関数で、こちらは以後ずっと空のままです。</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>ページ上の動的な値を、すべて同期的に 1 回ずつ評価します。id を渡すと、<a href="#api-scope"><code>scope()</code></a> でその id を付けた要素の内側だけが対象になります。1 回の更新は、次の順で進みます。</p>
      <ol>
        <li><code>list()</code>: アイテムを読み直し、行を追加・移動・削除します。</li>
        <li><code>when()</code>: 条件を再評価します。ブランチが作り直されるのは、別のブランチに切り替わったときだけです。</li>
        <li>動的な属性（<code>style</code> と <code>className</code> を含む）。</li>
        <li>動的なテキスト。</li>
        <li>1 と 2 で挿入された要素の <code>onMount</code>。</li>
      </ol>
      <ul>
        <li><strong>毎回すべて実行されます。</strong>データが変わっていなくても、呼ぶたびに全部の動的な値が走ります。省略されるのは DOM への書き込みだけ。動的な値は、軽く、副作用なしに保ってください。</li>
        <li><strong>対象はドキュメント内のノードだけ。</strong><code>update()</code> の時点でドキュメントに繋がっていないノードは、Nuclo が追跡をやめます。あとから追加しても、二度と更新されません。<code>list()</code> や <code>when()</code> も同様です。レンダリング先は、ドキュメント内にあるコンテナーにしてください。</li>
        <li><strong>静的な値は変わりません。</strong>ただの文字列や属性値は、要素を作った時点で確定します。作り直したいときは、<a href="#api-force-update"><code>forceUpdate()</code></a> を使います。</li>
        <li><strong>エラー。</strong>テキストと属性のエラーはキャッチされ、更新は続行します。<code>when()</code> の条件が例外を投げた場合は、ログに出力されたうえで、その <code>when()</code> の更新が止まります。<code>list()</code> の <code>items</code> や <code>renderItem</code> が例外を投げると、エラーは <code>update()</code> の外まで伝播し、残りのステップは実行されません。</li>
        <li><strong>サーバー。</strong><code>update()</code> はサーバー上では何もしません。</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>要素に、1 つ以上のスコープ id を付けます。すると <code>update('id')</code> で、その要素の内側だけを更新できます（要素自身の属性も対象です）。</p>
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
        <li>1 つの要素に、複数の id を付けられます: <code>scope('cart', 'sidebar')</code>。</li>
        <li><code>update('a', 'b')</code> は、<code>a</code> か <code>b</code> の内側をすべて更新します。同じ id の要素が複数あれば、そのすべてが対象です。</li>
        <li>スコープがネストしていれば、<code>update('outer')</code> は内側のスコープも含みます。<code>update('inner')</code> が外側に触れることはありません。</li>
        <li>ドキュメント内のどの要素にも付いていない id を渡すと、<strong>何も</strong>更新されず、エラーも出ません。スペルミスには気をつけてください。</li>
        <li><code>scope()</code> はサーバー上では何もしません。</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>条件に応じて、表示する中身を切り替えます。Nuclo は <code>update()</code> のたびに条件を評価し直し、最初に true になったものが採用されます。どれも true でなければ <code>.else()</code> の中身が表示され、<code>.else()</code> がなければ何も表示されません。</p>
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
        <li>state を扱うなら、関数を渡してください。boolean をそのまま渡すと一度しか読まれず、<code>when(open, …)</code> は永遠に変わりません。</li>
        <li>TypeScript では、関数は boolean を返す必要があります。<code>() =&gt; items.length &gt; 0</code> や <code>() =&gt; user != null</code> のように書きます。</li>
      </ul>
      <h3>更新されるもの</h3>
      <ul>
        <li>同じブランチが選ばれ続けている間は、その要素は保持されます。中の動的な値、リスト、<code>when()</code> も、引き続き更新されます。</li>
        <li>別のブランチに切り替わると、古い中身は取り除かれ、<code>onDestroy</code> フックが走ります。新しいブランチはゼロから作られ、<code>onMount</code> フックが走ります。入力途中のテキストやフォーカスなど、古い要素が持っていた状態は失われます。</li>
      </ul>
      <h3>ブランチのコンテンツ</h3>
      <p>ブランチに置けるのは子要素です。テキスト、動的なテキスト、ビルダー、<code>list()</code>、ネストした <code>when()</code> など。DOM ノードではなく、<code>p('Hi')</code> のようなビルダーを渡してください。DOM ノードは、そのブランチが一度でも非表示になると更新されなくなります。</p>
      <p>ブランチの中に書いた属性オブジェクトや <code>on()</code> は親要素に適用され、ブランチが非表示になったあとも残ります。条件付きの属性には、動的な属性を使いましょう: <code>{ className: () =&gt; (active ? 'active' : '') }</code>。</p>
      <h3>チェーン</h3>
      <p><code>.when()</code> と <code>.else()</code> は新しいビルダーを返し、元のビルダーは変更しません。<code>.else()</code> を 2 回呼んだ場合は、最後のものが有効です。</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>アイテム 1 つにつき 1 行を描画します。<code>update()</code> のたびに <code>items()</code> が呼び直され、新しいアイテムは既存の行と同一性（<code>===</code>）で突き合わされます。</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>行の照合方法</h3>
      <ul>
        <li>残っているアイテムの行は、そのまま保持されます。必要なら行は移動されますが、<code>renderItem</code> が再び呼ばれることはありません。</li>
        <li>新しいアイテムには新しい行が作られます。なくなったアイテムの行は削除され、<code>onDestroy</code> フックが実行されます。</li>
        <li>同じアイテムが重複していれば、それぞれに別の行ができます。</li>
        <li>配列は、その場で変更しても（<code>push</code>、<code>splice</code>、<code>sort</code>）、新しい配列を返しても構いません。</li>
      </ul>
      <p>保持された行は再レンダリングされないので、変わる可能性のあるフィールドには動的な値を使ってください。</p>
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
      <p>コピーは「新しいアイテム」とみなされるので、配列を <code>todos.map((t) =&gt; ({ ...t }))</code> で置き換えると、全行が作り直されます。</p>
    `,
        afterContent: `
      <h3><code>renderItem</code> の戻り値</h3>
      <ul>
        <li><code>li(...)</code>、<code>tr(...)</code>、SVG ビルダーなど、要素を 1 つ返します。アイテムを飛ばしたいときは <code>null</code> か <code>undefined</code> を返します。文字列、テキストノード、フラグメントを返しても何も表示されません。</li>
        <li><code>when()</code> や <code>list()</code> をそのまま返すのは NG です。行の要素の内側に置いてください: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>。</li>
        <li>アイテムを隠したいなら、<code>renderItem</code> ではなく <code>items()</code> の中でフィルタリングします。</li>
        <li><code>renderItem</code> に副作用を持たせないでください。同じアイテムに対して、複数回呼ばれることがあります。</li>
      </ul>
      <h3>インデックス</h3>
      <p><code>index</code> は、行が作られた時点でのアイテムの位置です。行が移動しても更新されません。今の位置がほしいときは、動的な値を使います: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>。</p>
      <h3>イテラブル</h3>
      <p>イテラブルなら何でも渡せます。配列、<code>Set</code>、ジェネレーター、<code>map.values()</code> など。毎回同じ配列や <code>Set</code> を返しても問題ありません。ただしジェネレーターや <code>map.values()</code> のようなイテレーターは 1 回の更新で使い切られるので、<code>items()</code> の中で呼び出しごとに作ってください。<code>Map</code> をそのままイテレートすると、毎回新しい <code>[key, value]</code> 配列が生まれ、全行が作り直されます。<code>map.values()</code> を使いましょう。</p>
      <h3>配置</h3>
      <p>行は、兄弟要素の中で <code>list()</code> を置いた位置に、2 つのコメントマーカーに挟まれて並びます。親の他の子要素には干渉しません。SVG ビルダーの中でも使えます。</p>
    `,
      },
      {
        id: "api-region",
        title: "region() と into()",
        content: `
      <p><code>region()</code> は、ツリーの中に「名前付きの置き場所」を作ります。<code>into()</code> は、ツリーのどこから、どれだけ深い場所からでも、そこに中身を流し込めます。レイアウトが中身を props で受け取る必要はなく、中身を作るコンポーネントも、それがどこに表示されるのかを知らなくて済みます。</p>
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
      <h3>仕組み</h3>
      <ul>
        <li><code>into()</code> を書いた場所に残るのはコメントだけ。中身そのものは、リージョンのマーカーの間に描画されます。</li>
        <li>順序は問いません。リージョンより先に作られた <code>into()</code> は待機し、リージョンが構築された瞬間に表示されます。複数のビューは、書かれた順に並びます。</li>
        <li>中身のライフサイクルは、ビューに従います。<code>into()</code> を抱えた <code>when()</code> が閉じたり、その <code>list()</code> の行が消えたりすれば、中身もリージョンから外れます。再び開いたときに追加されるのは 1 つだけで、二重にはなりません。</li>
        <li>リージョン側が消えた場合（たとえばそれを含む <code>when()</code> が閉じたとき）、ビューは再び待機状態に戻ります。のちに同じ id のリージョンが構築されれば、そこに表示されます。</li>
        <li>どのリージョンにも一致しない id の <code>into()</code> は、何も表示されず、エラーも出ません。スペルミスにご注意ください。</li>
        <li>id はツリー内で一意にします。すでにあるリージョンと同じ id で 2 つ目を構築すると、警告がログに出ます。</li>
        <li>リージョンは<a href="#api-ssr">サーバーサイドレンダリング</a>でも動きます。<code>hydrate()</code> では、各ビューは作り直されず、サーバーが出力した HTML がそのまま引き継がれます。</li>
      </ul>
      <h3>オプション</h3>
      <ul>
        <li><code>id</code>: <code>into()</code> がリージョンを探すときの名前。</li>
        <li><code>type</code>: <code>'latest'</code>（デフォルト）は最新のビューだけを表示します。<code>'stack'</code> は、すべてのビューを届いた順に積み重ねます。</li>
        <li><code>empty</code>: リージョンにビューがない間だけ表示される中身です。</li>
      </ul>
      <h3>スタック型のリージョン</h3>
      <p><code>type: 'stack'</code> なら、ビューの上に別のビューを開いても、下のビューは作り直されません。下の DOM もフォーカスもフォームの入力内容も、そのまま残ります。ページの上にかぶせるダイアログのようなレイヤーに向いています。</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>複数のリージョンを一度に</h3>
      <p>1 回の <code>into()</code> で複数のリージョンを埋めたいときは、オブジェクトを渡します。値は子要素 1 つでも、子要素の配列でも構いません。どちらの形もネスト可能です。別のビューの中に書かれた <code>into()</code> は、そのビュー自身のリージョンを対象にします。</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>ツリーの深い場所から開くダイアログ</h3>
      <p>オーバーレイ用のリージョンは、ルートに置いておきます。あとは、どんなに深いコンポーネントからでも、<code>into()</code> を <code>when()</code> で包めばダイアログを開けます。<code>when()</code> が閉じれば、ダイアログもリージョンから消えます。</p>
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
      <h3>リストの行からのトースト</h3>
      <p><code>list()</code> の各行は、それぞれ 1 つのビューです。stack 型のリージョンがそれらを順に積み、配列からアイテムを消せば、そのトーストも消えます。</p>
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
      <h3>ページ側でタイトルを設定する</h3>
      <p>デフォルトの <code>type: 'latest'</code> では、最新のビューが優先されます。見出し要素はレイアウトに置き、テキストは今開いているページが決める、という分担です。<code>into('title', …)</code> を持たないページでは、<code>empty</code> のテキストがそのまま出ます。</p>
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
      <h3>ビュー内の動的な値</h3>
      <p><code>into()</code> の中身は、普通の Nuclo のコンテンツです。中に書いた関数は state に依存する値として扱われ、リージョンがどこにあっても <code>update()</code> で更新されます。</p>
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
      <h3>現れたり消えたりするリージョン</h3>
      <p>ダッシュボードの <code>into()</code> は、1 箇所に書いてあるだけです。サインアウト中は <code>main</code> リージョン自体が存在しないので、ビューは待機します。サインインするとリージョンが作られ、ビューが表示されます。サインアウトすればリージョンが消え、ビューはまた待機状態に戻ります。</p>
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
      <h3>独自のリージョンを持つビュー</h3>
      <p>ビューの中に <code>region()</code> を含めることもでき、ほかのビューからそこへ流し込めます。この例では、エディターページが <code>tabs</code> リージョンを自前で持っていて、各タブがそこを埋めます。エディターを閉じれば、リージョンも一緒に消えます。</p>
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
      <h3>ライブサンプル</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> が実行するのは動的な値だけです。<code>h1(labels[lang].title)</code> のテキストのような静的な値は、ツリーを構築した時点で固定されています。<code>forceUpdate()</code> はコンポーネントをもう一度呼び直し、静的な値も含めて、実際の DOM が新しい結果に一致するようパッチを当てます。出番は、言語切り替えのような「まれに起きる、アプリ全体に及ぶ変更」だけ。それ以外はすべて <code>update()</code> で足ります。</p>
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
      <p>引数なしの <code>forceUpdate()</code> は、<code>render(App)</code> や <code>hydrate(App)</code> で描画したルートをすべて再構築します。<code>render(App())</code> で描画したルートは対象外です。コンポーネントが例外を投げた場合は、エラーがログに出て、そのルートは以前の DOM のままになります。新しいビルドを適用している途中で例外が出たときもログには出ますが、すでにパッチ済みの部分は戻りません。</p>
      <h3>残るものと変わるもの</h3>
      <ul>
        <li>子要素は、先頭から順にタグで突き合わされます。一致した要素は再利用されるので、フォーカスや入力済みの値は残り、<code>onMount</code> フックも再実行されません。タグが食い違った子要素が出た時点で、その要素とそれ以降の兄弟はすべて新しく作り直されます。</li>
        <li>テキスト、属性、クラス、スタイル、リスナー、<code>when()</code> のブランチ、<code>list()</code> の行は、新しいビルドの内容に揃えられます。</li>
        <li>新しく作られた要素では <code>onMount</code> フックが走ります。新しいビルドで作られなくなった要素は取り除かれ、<code>onDestroy</code> フックが走ります。</li>
        <li><code>list()</code> の行もアイテムではなく位置で突き合わされるため、再利用された行の要素が別のアイテムを表示することがあります。</li>
        <li>新しいビルドで設定されなくなった属性は、取り除かれません。</li>
      </ul>
      <div class="docs-callout"><strong>注意:</strong> コンポーネント関数の内側で宣言した state は、関数が再実行されるたびにリセットされます。残したい state は、コンポーネントの外に置いてください。</div>
      <p><strong>明示的な形式。</strong><code>forceUpdate(App(), parent)</code> は、<code>parent</code> の中にある 1 つのツリーを再構築して、そのルートを返します。次回以降の呼び出しのためにルートが登録されることはありません。<code>hydrate()</code> と同じく、ルートは <code>parent</code> の最初のノードである前提です。最初のノードのタグが違えば、そのノードごと置き換えられます。</p>
      <p>サーバー上では、<code>forceUpdate()</code> は何もしません。</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "レンダリング",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>ツリーを構築して、そのルート要素を <code>parent</code> に追加します。<code>parent</code> を省略すると <code>document.body</code> になります。戻り値はルート要素です。</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>渡せるのは、コンポーネント（<code>render(App)</code>）でも、それが返すビルダー（<code>render(App())</code>）でも構いません。できあがる DOM は同じです。ただ、あとから <a href="#api-force-update"><code>forceUpdate()</code></a> でルートを再構築できるのは <code>render(App)</code> だけなので、こちらをおすすめします。</li>
        <li>やるのは追加だけです。<code>parent</code> の中身はクリアされないので、2 回呼ぶとコピーが 2 つ並びます。</li>
        <li><code>render()</code> が返ってきた時点で、ツリー内の <code>onMount</code> はすべて実行済みです。</li>
        <li>ドキュメント内にある要素に対して描画してください。<a href="#api-update"><code>update()</code></a> を参照。</li>
        <li>ルートは <code>div(...)</code> のような要素でなければならず、<code>when()</code> や <code>list()</code> は使えません。</li>
        <li><code>index</code> は内部用で、要素の挿入位置を指定するものではありません。渡さないでください。</li>
      </ul>
      <p><code>render(App)</code> に渡すコンポーネントは、引数を取れません。必須の引数があれば型エラーになります。optional な引数は型チェックを通りますが、実行時に <code>render()</code> が例外を投げます。props を取るコンポーネントは、ラップして渡しましょう。</p>
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
      <p><a href="#api-ssr"><code>renderToString()</code></a> が出力した HTML を引き継ぎます。既存の要素を再利用してイベントリスナーを取り付け、動的な値・<code>when()</code>・<code>list()</code> を繋ぎ直すので、以降は <code>update()</code> が普通に効きます。最後に <code>onMount</code> フックを実行します。<code>parent</code> を省略すると <code>document.body</code> で、戻り値はルート要素です。</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>サーバーと同じコンポーネント、同じデータを使ってください。</li>
        <li>専用のコンテナーに対して hydration してください。アプリのルートは、そのコンテナーの最初のノードである必要があります（空白は無視されます）。別のノードが先頭にあると、Nuclo はそのノードを置き換え、サーバー側のコピーは取り残されます。</li>
        <li><code>render()</code> と同じく、<code>App()</code> ではなく <code>App</code> を渡してください。そうすれば、あとから <code>forceUpdate()</code> でルートを再構築できます。<code>App</code> は引数を取れません。optional な引数があると、<code>hydrate()</code> は何も取り付けず、エラーも出さずに終わります。props を取るコンポーネントはラップしましょう: <code>hydrate(() =&gt; Page(props), root)</code>。</li>
        <li>サーバー側の HTML がないなら、<code>render()</code> を使います。</li>
      </ul>
      <h3>サーバーとクライアントが異なる場合</h3>
      <p>食い違った場合は、クライアントが優先されます。</p>
      <ul>
        <li>ルートのタグが違えば、そのノードは新しい DOM に置き換えられます。コンテナーが空なら、新しい DOM が追加されます。</li>
        <li>テキストが違えばパッチされ、<code>list()</code> のアイテムや <code>when()</code> のブランチが違えば、クライアント側の結果に合わせられます。</li>
        <li>サーバー側に余分な子要素があれば削除、足りなければ作成されます。</li>
        <li>サーバーが書き出したのにクライアントが設定しない属性は、そのまま残ります。</li>
      </ul>
      <p><code>renderToString()</code> は、各テキストノードの前に <code>&lt;!-- text-0 --&gt;</code> のような HTML コメントをマーカーとして出力します。<code>hydrate()</code> はこれを頼りにしているので、サーバー側の HTML からコメントを削らないでください。マーカーがないと、hydration で <code>list()</code> の行が消え、<code>list()</code> も <code>when()</code> も更新されなくなります。</p>
    `,
      },
      {
        id: "api-ssr",
        title: "サーバーサイドレンダリング",
        content: `
      <p>サーバー上でコンポーネントを HTML 文字列にレンダリングします。ブラウザー側では、同じコンポーネントで <a href="#api-hydrate"><code>hydrate()</code></a> を呼び、その HTML をインタラクティブにします。サーバーのランタイムには <code>document</code> がないので、先に <a href="#api-polyfill"><code>nuclo/polyfill</code></a> を import してください。</p>
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
      <p>style タグの <code>id="nuclo-styles"</code> は、必ず残してください。クライアントはこの要素を再利用して、新しいルールだけを追記します。<a href="#api-css-text"><code>getCssText()</code></a> を参照してください。</p>
      <h3>サーバー上で実行されるもの</h3>
      <ul>
        <li><code>renderToString()</code> は呼ぶたびにツリーを構築し、動的な値を 1 回ずつ実行します。</li>
        <li>イベントハンドラー、<code>onMount</code>、<code>onDestroy</code> は動きません。<code>update()</code>、<code>scope()</code>、<code>forceUpdate()</code> は何もしません。</li>
        <li>レンダリングは同期処理です。データは先に読み込んでから、レンダリングしてください。</li>
        <li>レンダリングが終わったあとに登録済みの状態は何も残らないので、1 つのプロセスで多数のリクエストをさばけます。リクエスト固有のデータは、<code>renderToString(Page(user))</code> のように引数で渡してください。モジュールレベルの変数は、全リクエストで共有されます。</li>
        <li>サーバーで <code>render()</code> を呼ぶのはやめてください。共有の <code>document.body</code> に追加されてしまいます。</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>ビルダー（<code>App()</code>）、コンポーネント（<code>App</code>）、DOM ノードのいずれかを受け取ります。<code>null</code> と <code>undefined</code> は <code>""</code> を返します。ルートは要素でなければなりません。<code>renderToString(Page)</code> のように渡すコンポーネントは引数を取れないので、データが必要なものは <code>Page(user)</code> の形で渡してください。</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>テキストと属性値は HTML エスケープされます。<code>script()</code> と <code>style()</code> の中のテキストは、閉じタグを分断するだけでそのまま出力されるので、ユーザー入力は絶対に置かないでください。</li>
        <li>例外は投げません。コンポーネントや <code>list()</code> の関数、<code>when()</code> の条件が例外を投げたとき、あるいは polyfill がないときは、エラーをログに出して <code>""</code> を返します。リクエストを失敗扱いにしたい場合は、結果が空でないかを確認してください。テキストや属性の関数が投げた場合は、その部分が空になるだけです。</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p><code>inputs.map(renderToString)</code> と同じです。</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>出力を 1 つの要素で包みます。<code>containerTag</code> のデフォルトは <code>"div"</code>、<code>containerAttrs</code> のデフォルトは <code>{}</code> です。属性値はエスケープされますが、属性名は渡した文字列のまま出力されるので、<code>class</code> のように HTML 側の名前で書いてください。タグ名にユーザー入力を渡すのは避けてください。</p>
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
      <p>Node や Bun の上でも Nuclo がツリーを組み立てられるようにする、小さな DOM です。最初のレンダリングより前に、1 回 import してください。たいていのアプリは、それだけで足ります。</p>
      <ul>
        <li><code>window</code> がない環境では、<code>globalThis.document</code>、<code>Node</code>、<code>Element</code>、<code>HTMLElement</code> を設定します。すでに存在するものは上書きしません。<code>window</code> は作りません。</li>
        <li>ブラウザーや jsdom 上では、何もしません。</li>
        <li><code>Event</code> と <code>CustomEvent</code> は、ランタイム自身のコンストラクターです。<code>Node</code>、<code>Element</code>、<code>HTMLElement</code> は、polyfill のクラスへのエイリアスです。</li>
      </ul>
      <p>あくまでツリーを組むための DOM であって、ブラウザーの代わりにはなりません。<code>innerHTML</code> も <code>getElementById</code> もなく、<code>querySelector()</code> は <code>null</code> を返し、イベントリスナーは無視されます。HTML がほしいときは <code>renderToString()</code> を使ってください。</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
