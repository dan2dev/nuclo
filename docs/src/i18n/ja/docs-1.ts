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
      <p>Nuclo は TypeScript 向けの小さな DOM ライブラリです。<code>div()</code> や <code>button()</code> のようなプレーンな関数でページを構築し、状態は通常の変数に保持し、ページを変更したいときに <code>update()</code> を呼び出します。</p>
      <p>Nuclo には仮想 DOM、コンパイラ、プロキシ、シグナルのいずれもありません。</p>
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
        <li>タグビルダーで UI を構築します。</li>
        <li>状態に依存する値ごとに関数を渡します。</li>
        <li>プレーンな JavaScript で状態を変更します。</li>
        <li><code>update()</code> を呼び出します。Nuclo が関数を再実行し、DOM にパッチを当てます。</li>
      </ol>
      <p>変数を変更しても DOM には触れません。ページは <code>update()</code> を呼び出したときにだけ変わります。</p>
    `,
      },
      {
        id: "quick-start",
        title: "クイックスタート",
        content: `
      <p><code>create-nuclo</code> は、Nuclo を使う準備が整った Vite と TypeScript のプロジェクトを生成します。</p>
    `,
        afterContent: `
      <p>プロジェクト名を尋ねられます。プロンプトをスキップするには、名前とフラグを渡します。npm の場合は、フラグの前に <code>--</code> を置きます。</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>続いて依存関係をインストールし、開発サーバーを起動します。</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>オプション</h3>
      <ul>
        <li><code>[project-name]</code>: 出力先フォルダー。デフォルトは <code>nuclo-app</code> です。</li>
        <li><code>-t, --template &lt;name&gt;</code>: コピーするテンプレート。現在は <code>basic</code> のみ存在します。</li>
        <li><code>-y, --yes</code>: プロンプトを表示せず、デフォルト値を使います。</li>
        <li><code>-f, --force</code>: 空でないフォルダーに書き込みます。</li>
        <li><code>-h, --help</code>: ヘルプを表示します。</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "インストールとインポート",
        content: `
      <p>既存のプロジェクトに Nuclo を追加するには、次を実行します。</p>
      ${sh("npm install nuclo")}
      <p>または <code>pnpm add nuclo</code>、<code>yarn add nuclo</code>、<code>bun add nuclo</code> を使います。Nuclo に依存関係はありません。</p>
      <p>ルーティングはコアパッケージには含まれません。<a href="#router-overview"><code>nuclo-router</code></a> として別途提供されており、必要なときに <code>nuclo</code> と並べてインストールします。</p>
      <h3>グローバル</h3>
      <p><code>import 'nuclo'</code> は次のものを <code>globalThis</code> に登録します。</p>
      <ul>
        <li><strong>175 個のタグビルダー</strong>: HTML 用が 112 個（<code>div</code>、<code>span</code>、<code>button</code>、…）、SVG 用が 63 個で、SVG 用には <code>Svg</code> サフィックスが付きます（<code>svgSvg</code>、<code>pathSvg</code>、…）。<a href="#tag-builders">タグビルダー</a>を参照してください。</li>
        <li><strong>16 個のヘルパー</strong>: <code>update</code>、<code>scope</code>、<code>when</code>、<code>list</code>、<code>region</code>、<code>into</code>、<code>on</code>、<code>render</code>、<code>hydrate</code>、<code>forceUpdate</code>、<code>css</code>、<code>cx</code>、<code>createCss</code>、<code>variants</code>、<code>keyframes</code>、<code>globalStyle</code>。</li>
      </ul>
      <p>このインポートは、ビルダーを呼び出すどのコードよりも先に実行される必要があります。ES モジュールはインポート順に実行されるため、次のコードは失敗します。</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>エントリーファイルの先頭に <code>import 'nuclo'</code> を置くか、グローバルを使うすべてのファイルでインポートしてください。</p>
      <h3>名前付きインポート</h3>
      <p>ヘルパーは名前付きエクスポートとしても提供されます。グローバルと同じ関数です。<code>getCssText()</code> と <code>resetStyles()</code> は名前付きエクスポートのみです。タグビルダーはグローバルのみなので、<code>import { div } from 'nuclo'</code> は動作しません。</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>エントリーポイント</h3>
      <ul>
        <li><code>nuclo</code>: グローバルを登録し、16 個のヘルパーに加えて <code>getCssText</code> と <code>resetStyles</code> をエクスポートします。</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>、<code>renderManyToString</code>、<code>renderToStringWithContainer</code>、<code>getCssText</code>。<a href="#api-ssr">サーバーサイドレンダリング</a>を参照してください。</li>
        <li><code>nuclo/polyfill</code>: Node と Bun 向けの小さな DOM。<a href="#api-polyfill">nuclo/polyfill</a> を参照してください。</li>
        <li><code>nuclo/types</code>: 型のみ。<a href="#typescript-setup">TypeScript</a> を参照してください。</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo は独自の型定義を同梱しています。必要なのは次の 2 点です。</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>。<code>node16</code> と <code>nodenext</code> はまだサポートされていません。</li>
        <li><code>DOM</code> ライブラリ。<code>lib</code> を設定しない場合、TypeScript はデフォルトでこれを含めます。</li>
      </ul>
      <p>プロジェクト内のいずれかのファイルが <code>'nuclo'</code> をインポートしていれば、すべてのファイルからグローバル型が見えます。それ以外に必要なものはありません。どのファイルもインポートしていない場合、たとえばテスト用の別の tsconfig では、型を自分で追加します。</p>
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
      <p>または、<code>.d.ts</code> ファイルに <code>/// &lt;reference types="nuclo/types" /&gt;</code> を追加します。</p>
      <h3>便利な型</h3>
      <p>これらの型はグローバルなので、インポートせずに使えます。</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: タグビルダーの戻り値。コンポーネントの戻り値の型として使います。</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: タグビルダーが引数として受け取れるすべてのもの。</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: <code>render()</code> と <code>hydrate()</code> の戻り値。</li>
        <li><code>ElementTagName</code>: 任意の HTML タグ名。</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: タグビルダーが受け取る属性オブジェクト。<code>on*</code> ハンドラー、<code>onMount</code>、<code>onDestroy</code> を含みます。属性を透過的に渡すコンポーネントで使います。</li>
        <li><code>MountCallback</code> と <code>DestroyCallback</code>: <code>onMount</code> と <code>onDestroy</code> のハンドラー。</li>
        <li><code>WhenBuilder</code>、<code>ListModifier</code>: <code>when()</code> と <code>list()</code> の戻り値。</li>
        <li><code>RegionOptions</code>、<code>RegionType</code>: <code>region()</code> が受け取るオプション。</li>
        <li><code>StyleResult</code>、<code>Style</code>、<code>ThemeConfig</code>、<code>CssInstance</code> とその他のスタイリング関連の型。これらはインポートすることもできます: <code>import type { StyleResult } from 'nuclo'</code>。</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> はすべての DOM メンバーをオプショナルとしてマークします。完全な要素型が必要なときはキャストします: <code>render(App, root) as HTMLDivElement</code>。</p>
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
      <p>すべての HTML タグは、同じ名前のグローバル関数です: <code>div</code>、<code>span</code>、<code>input</code>、… 唯一の例外は <code>&lt;var&gt;</code> で、<code>var</code> が予約語のため <code>var_</code> になります。すべての SVG タグには <code>Svg</code> サフィックスが付きます: <code>svgSvg</code>、<code>pathSvg</code>、<code>circleSvg</code>、…</p>
      <p>タグビルダーを呼び出しても、その時点では要素は作られません。<code>div('Hi')</code> は<strong>ビルダー</strong>、つまり後で要素を作る関数を返します。Nuclo は、<code>render()</code> でマウントしたとき、または別のビルダー、<code>when()</code>、<code>list()</code> の中に置いたときにそれを呼び出します。使うたびに新しい要素が作られます。</p>
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
      <p>ビルダーは任意の数の引数を受け取り、左から右へ順に適用します。</p>
      <ul>
        <li><strong>string、number、bigint</strong>: テキストノード。</li>
        <li><strong><code>() =&gt; value</code></strong>: <code>update()</code> で変化するテキスト。<a href="#dynamic-functions">動的な値</a>を参照してください。</li>
        <li><strong><code>null</code>、<code>undefined</code></strong>: スキップされます。</li>
        <li><strong><code>true</code>、<code>false</code></strong>: テキスト "true" または "false" としてレンダリングされます。条件には <code>when()</code> を使ってください。</li>
        <li><strong>プレーンオブジェクト</strong>: 属性。<a href="#attributes">属性</a>を参照してください。</li>
        <li><strong><code>css()</code>、<code>cx()</code>、<code>variants()</code> の結果</strong>: そのクラスを追加します。</li>
        <li><strong><code>on(...)</code></strong>: イベントリスナーまたはライフサイクルフック。</li>
        <li><strong>別のビルダー、<code>when()</code>、<code>list()</code></strong>: 子要素。</li>
        <li><strong>DOM の <code>Node</code></strong>: そのまま追加されます。</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: カスタムモディファイア。後述します。</li>
      </ul>
      <h3>注意点</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> はテキスト "false" をレンダリングします。<code>div(when(() =&gt; isAdmin, span('Admin')))</code> と書いてください。</li>
        <li>配列は子要素になりません。スプレッドしてください: <code>ul(...names.map((n) =&gt; li(n)))</code>。変化するリストには <code>list()</code> を使います。</li>
        <li>タグ名と同じ名前のローカル変数はビルダーを隠します。<code>function Row(label: string)</code> の中では <code>label(...)</code> を呼び出せません。<code>label</code>、<code>title</code>、<code>data</code>、<code>p</code>、<code>a</code>、<code>i</code> のようなローカル変数はリネームしてください。</li>
        <li>ブラウザーは <code>id</code> を持つすべての要素をグローバル変数として公開します。Nuclo が読み込まれる前にページに <code>&lt;main id="main"&gt;</code> があると、Nuclo はそのグローバルをそのまま残すため、<code>main(...)</code> は <code>TypeError</code> を投げます。別の id を使ってください。</li>
      </ul>
      <h3>カスタムモディファイア</h3>
      <p>少なくとも 1 つのパラメーターを宣言した関数は、要素の構築中に引数の順序で 1 回だけ実行されます。第 1 引数は要素です。第 2 引数は内部的なインデックスなので、依存しないでください。文字列または数値を返すと、それがテキストになります。<code>Node</code> は追加されます。オブジェクトは属性として適用されます。</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>要素の取得</h3>
      <p><code>render()</code> はルート要素を返します。ツリーの中では、<code>on("mount", (el) =&gt; …)</code> またはカスタムモディファイアを使います。ビルダー関数を自分で呼び出して、切り離された要素を作ることもできます。</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>次の <code>update()</code> より前にドキュメントへ追加してください。<code>update()</code> の実行時にドキュメント内にないノードは、以後更新されなくなります。</p>
      <h3>SVG</h3>
      <p>SVG ビルダーも同じ引数を受け取ります。Nuclo はすべての SVG 属性を <code>setAttribute</code> で設定するため、<code>"stroke-width"</code> のような名前はそのまま書いて動作します。</p>
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
      <p>コンポーネントは、<code>button(...)</code> のようなビルダーを返すプレーンな関数です。コンポーネント API は存在しません。レンダリングするかツリーに配置するまで、何も作られません。</p>
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
      <p>関数の内側で宣言した状態はそのインスタンスに属します。外側で宣言した状態はすべてのインスタンスで共有されます。<code>forceUpdate()</code> はコンポーネントを再度呼び出すため、内側で宣言した状態はリセットされます。</p>
      <p>子要素は単なる引数です。</p>
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
      <p>属性を設定するには、プレーンオブジェクトを渡します。複数のオブジェクトを渡すこともできます。同じキーについては後の値が優先されますが、<code>className</code> と <code>style</code> はマージされます。値は静的な値か、<code>update()</code> ごとに再実行されるパラメーターなしの関数のどちらでも構いません。</p>
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
        <li>HTML 要素にその名前のプロパティがある場合（<code>value</code>、<code>checked</code>、<code>disabled</code>、<code>htmlFor</code>、<code>tabIndex</code>、…）、Nuclo はプロパティを設定します。それ以外の場合は <code>setAttribute(key, String(value))</code> を呼び出します。たとえば <code>"aria-*"</code> や <code>"data-*"</code> がこれに当たります。</li>
        <li>SVG 要素では、Nuclo は常に <code>setAttribute</code> を呼び出します。</li>
        <li><code>null</code> と <code>undefined</code> はスキップされます。<code>null</code> や <code>undefined</code> を返す動的な値は、以前の値を保持します。値をクリアするには <code>""</code> を返すか、ブーリアンプロパティの場合は <code>false</code> を返します。</li>
        <li>ブーリアンは DOM のブーリアンプロパティで機能します。たとえばボタンの <code>disabled</code>、<code>checked</code>、<code>hidden</code>、<code>required</code> です。それ以外の場所では、<code>true</code> と <code>false</code> は文字列 "true" と "false" として書き込まれます。</li>
        <li><code>"data-*"</code> キーを使ってください。<code>dataset</code> はサポートされていません。</li>
        <li><code>innerHTML</code> はエスケープされず、サーバーサイドレンダリングでは出力されません。使用は避けてください。</li>
      </ul>
      <h3>クラス</h3>
      <p><code>className</code> を使います。静的なクラス文字列、<code>css()</code> の結果、動的な <code>className</code> はすべてマージされます。動的な <code>className</code> は静的なクラスを保持し、<code>""</code> を返したときは静的なクラスだけが残ります。</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>HTML 要素では <code>class</code> キーを使わないでください。これは生の属性を設定し、<code>css()</code> のクラスを含め、それ以前に適用されたすべてのクラスを置き換えます。</p>
      <h3>インラインスタイル</h3>
      <p><code>style</code> は、camelCase のキーを持つオブジェクト、またはそれを返す関数を受け取ります。</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo は単位を付加しません。<code>12</code> ではなく <code>"12px"</code> と書いてください。<code>opacity</code> や <code>zIndex</code> のような単位なしのプロパティは数値を受け取ります。</li>
        <li><code>""</code>、<code>null</code>、<code>undefined</code> はプロパティをクリアします。</li>
        <li>動的なスタイルは、返したキーだけを設定します。返さなくなったキーは以前の値を保持するため、クリアするには <code>""</code> を返してください。</li>
        <li>スタイル文字列（<code>"color: red"</code>）とカスタムプロパティ（<code>"--gap"</code>）はサポートされていません。代わりに <code>css()</code> を使ってください。カスタムプロパティは <a href="#style-objects"><code>raw</code></a> 経由で受け付けます。</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "イベント",
        content: `
      <p>イベントをリッスンする方法は 2 つあります: <code>on*</code> 属性と <code>on()</code> モディファイアです。</p>
      <h3><code>on*</code> 属性</h3>
      <p>属性オブジェクトの中で、<code>onClick</code> のようなキー（<code>on</code> に大文字が続くもの）の下にある関数は、動的な値ではなくイベントハンドラーです。</p>
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
        <li>TypeScript はキーと要素からイベント型を推論します。<code>e.currentTarget</code> と <code>this</code> はその要素です。</li>
        <li>Nuclo はネイティブプロパティを設定するため、<code>onClick</code> は <code>el.onclick</code> になります。イベントごとにハンドラーは 1 つで、後の <code>onClick</code> は先のものを置き換えます。</li>
        <li><code>onDoubleClick</code> と <code>onDblClick</code> はどちらも <code>dblclick</code> を意味します。<code>onclick</code> のような小文字のキーは型エラーになります。</li>
        <li>既知のイベントでない名前は、その小文字形をリッスンします: <code>onMyEvent</code> は <code>"myevent"</code> をリッスンします。</li>
        <li>ハンドラーが投げたエラーはキャッチされません。</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> は、要素に対して <code>addEventListener</code> を呼び出すモディファイアを返します。</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li><code>on()</code> はそれぞれリスナーを追加します。すべてが順番に実行されます。</li>
        <li><code>options</code> はそのまま <code>addEventListener</code> に渡されます: <code>capture</code>、<code>once</code>、<code>passive</code>、<code>signal</code>。</li>
        <li><code>on()</code> をビルダーに直接渡すと、要素型が推論されます: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>。</li>
        <li>リスナーが例外を投げた場合、Nuclo は <code>console.error</code> でエラーをログに出力し、他のリスナーは引き続き実行されます。</li>
        <li>Nuclo は要素を削除するときにリスナーも削除します。サーバー上では <code>on()</code> は何もしません。</li>
        <li>1 つの <code>on()</code> の値を複数の要素で再利用できます。</li>
      </ul>
      <p>カスタムイベントの場合は、イベント型をジェネリクスで渡します。</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>使い分け</h3>
      <p>通常のケースでは <code>on*</code> 属性を使います。1 つのイベントに複数のリスナーが必要な場合、リスナーオプションが必要な場合、<code>"my-event"</code> のようなカスタムイベント名が必要な場合は <code>on()</code> を使います。</p>
    `,
      },
      {
        id: "lifecycle",
        title: "ライフサイクル",
        content: `
      <p><code>onMount</code> は要素が挿入された後に 1 回実行されます。<code>onDestroy</code> は Nuclo が要素を削除するときに 1 回実行されます。属性として書くか、<code>on()</code> で書きます。どちらの形式も同じように動作し、要素はそのタグから型付けされます。</p>
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
        <li><code>onMount</code> は、その要素を挿入した <code>render()</code>、<code>hydrate()</code>、<code>update()</code>、<code>forceUpdate()</code> の呼び出しの終わりに実行されます。ツリーの構築中に実行されることはありません。</li>
        <li><code>onMount</code> が関数を返した場合、その関数は破棄時に、要素の <code>onDestroy</code> コールバックの後に実行されます。</li>
        <li><code>onDestroy</code> は Nuclo が要素を削除するときに実行されます: <code>list()</code> の行が削除されたとき、<code>when()</code> のブランチが切り替わったとき、<code>into()</code> がリージョンから離れたとき、<code>forceUpdate()</code> が要素を破棄したときです。削除の直前に実行されるため、要素はまだドキュメント内にあります。</li>
      </ul>
      <h3>DOM を直接操作して削除する場合</h3>
      <p><code>node.remove()</code> や <code>innerHTML = ''</code> で要素を自分で削除した場合、その <code>onDestroy</code> とクリーンアップは実行されず、タイマーは動き続けます。Nuclo に <code>unmount()</code> はありません。クリーンアップを伴ってアプリを破棄するには、<code>when()</code> でラップします。</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>順序とエラー</h3>
      <ul>
        <li>どちらの形式でも、フックは好きなだけ登録できます。登録順に実行されます。</li>
        <li><code>onDestroy</code> は常に子を先に、その後で親を実行します。</li>
        <li>要素は最初の <code>onMount</code> フックの順序でマウントされます。これは引数の順序に従い、各要素はそのすべてのフックをまとめて実行します。子が親に依存する場合は、親のフックを子より前に渡してください。</li>
        <li>例外を投げたフックは <code>console.error</code> でログに出力されます。他のフックは引き続き実行されます。</li>
        <li>コールバックは何も返さないか、クリーンアップ関数を返す必要があるため、<code>async</code> にしないでください。返された Promise はクリーンアップとして使われることはありません。非同期処理はその内側で開始してください: <code>{ onMount: (el) =&gt; { void load(el) } }</code>。</li>
        <li>フックはサーバー上では実行されません。クライアント上では <code>hydrate()</code> の後に実行されます。</li>
      </ul>
      <div class="docs-callout"><strong>注:</strong> フックはエフェクトではありません。状態が変わっても再実行されることはありません。各フックは要素ごとに最大 1 回だけ実行されます。</div>
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
      <p>Nuclo が自動的にページを更新することはありません。状態を変更し、その後 <code>update()</code> を呼び出します。</p>
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
      <p>必要なだけ状態を変更し、その後 <code>update()</code> を 1 回呼び出します。</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p><code>update()</code> はイベントハンドラー、タイマー、fetch のコールバック、<code>onMount</code> から呼び出します。動的な値の内側からは呼び出さないでください。</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "動的な値",
        content: `
      <p><strong>パラメーターを持たない</strong>関数は<strong>動的な値</strong>です。Nuclo は要素の構築時に 1 回実行し、その後 <code>update()</code> ごとに再実行します。動的な値は、テキストの子要素、属性値、<code>style</code>、<code>className</code> に使います。表示の切り替えや繰り返しを伴う子要素には、<a href="#api-when"><code>when()</code></a> と <a href="#api-list"><code>list()</code></a> を使います。</p>
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
      <p>Nuclo はパラメーター数（<code>fn.length</code>）を確認します。パラメーターを宣言した関数は<a href="#tag-builders">カスタムモディファイア</a>であり、1 回だけ実行されます。<code>(x = 0) =&gt; …</code> と <code>(...args) =&gt; …</code> の length は 0 なので、動的な値になります。</p>
      <h3>動的なテキスト</h3>
      <ul>
        <li>string、number、bigint、boolean は <code>String(value)</code> としてレンダリングされます。<code>() =&gt; ok &amp;&amp; 'Saved'</code> は "false" を表示するので、<code>() =&gt; (ok ? 'Saved' : '')</code> と書いてください。</li>
        <li><code>null</code> と <code>undefined</code> は空のテキストとしてレンダリングされます。</li>
        <li>初回実行で <code>css()</code> または <code>cx()</code> の結果を返すと、その関数はテキストではなく動的なクラスになります。<a href="#api-cx"><code>cx()</code></a> を参照してください。</li>
        <li>ノード、ビルダー、配列、プレーンオブジェクトは何もレンダリングせず、更新もされません。</li>
      </ul>
      <h3>動的な属性</h3>
      <ul>
        <li>Nuclo は、最後に自身が書き込んだ値と異なる場合にだけ値を書き込みます。実際の DOM とは比較しないため、ユーザーが input に入力した後に関数が以前と同じ値を返した場合、入力されたテキストはそのまま残ります。</li>
        <li>結果が <code>null</code> または <code>undefined</code> の場合は何も書き込まれず、以前の値が残ります。<code>className</code> は例外で、falsy な結果はすべて動的なクラスを削除し、静的なクラスを保持します。</li>
        <li><code>style</code> 関数は、返されたオブジェクトを更新ごとに適用します。</li>
      </ul>
      <h3>エラー</h3>
      <p>動的な値が例外を投げた場合、Nuclo はエラーをキャッチし、残りの更新は引き続き実行されます。テキストは空になるか以前の値を保持し、属性は以前の値を保持します。どちらも、次に成功した <code>update()</code> で回復します。例外は、<strong>初回</strong>の実行で例外を投げたテキスト関数で、これは以後ずっと空のままになります。</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>ページ上のすべての動的な値を、同期的に 1 回ずつ評価します。id を渡した場合は、<a href="#api-scope"><code>scope()</code></a> でその id が付けられた要素の内側だけを更新します。1 回の更新では、次のステップを順に実行します。</p>
      <ol>
        <li><code>list()</code>: アイテムを再度読み取り、行を追加・移動・削除します。</li>
        <li><code>when()</code>: 条件を再度確認します。ブランチは、別のブランチがアクティブになったときにだけ再構築されます。</li>
        <li>動的な属性。<code>style</code> と <code>className</code> を含みます。</li>
        <li>動的なテキスト。</li>
        <li>ステップ 1 と 2 で挿入された要素の <code>onMount</code>。</li>
      </ol>
      <ul>
        <li><strong>すべてを実行します。</strong>データが変わっていなくても、呼び出しごとにすべての動的な値が実行されます。スキップされるのは DOM への書き込みだけです。動的な値は高速に、副作用のないものにしてください。</li>
        <li><strong>ドキュメント内のノードのみ。</strong><code>update()</code> の実行時にノードがドキュメント内にない場合、Nuclo はそのノードの追跡を停止します。後で追加しても、再び更新されることはありません。これは <code>list()</code> と <code>when()</code> にも当てはまります。ドキュメント内にあるコンテナーへレンダリングしてください。</li>
        <li><strong>静的な値は変化しません。</strong>プレーンな文字列と属性値は、要素の構築時に固定されます。それらを再構築するには、<a href="#api-force-update"><code>forceUpdate()</code></a> を使います。</li>
        <li><strong>エラー。</strong>テキストと属性のエラーはキャッチされ、更新処理は続行されます。<code>when()</code> の条件が例外を投げた場合、エラーはログに出力され、その <code>when()</code> は更新を停止します。<code>list()</code> の <code>items</code> または <code>renderItem</code> 関数が例外を投げた場合、エラーは <code>update()</code> の外へ伝播し、残りのステップは実行されません。</li>
        <li><strong>サーバー。</strong><code>update()</code> はサーバー上では何もしません。</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>渡された要素に 1 つ以上のスコープ id を付けます。すると <code>update('id')</code> は、その要素の内側だけを更新します。要素自身の属性も含まれます。</p>
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
        <li>1 つの要素に複数の id を付けられます: <code>scope('cart', 'sidebar')</code>。</li>
        <li><code>update('a', 'b')</code> は <code>a</code> または <code>b</code> の内側にあるすべてを更新します。複数の要素が同じ id を使っている場合、そのすべてが更新されます。</li>
        <li>スコープがネストしている場合、<code>update('outer')</code> は内側のスコープも含みます。<code>update('inner')</code> は外側には触れません。</li>
        <li>ドキュメント内のどの要素も持たない id は<strong>何も</strong>更新せず、エラーも発生しないため、スペルを確認してください。</li>
        <li><code>scope()</code> はサーバー上では何もしません。</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>条件に基づいてコンテンツをレンダリングします。Nuclo は <code>update()</code> ごとに条件を再確認します。最初に true になった条件が採用されます。どれも true でない場合は、<code>.else()</code> のコンテンツがレンダリングされます。<code>.else()</code> がなければ、何もレンダリングされません。</p>
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
        <li>状態を扱う場合は関数を渡します。プレーンなブーリアンは 1 回だけ読み取られます: <code>when(open, …)</code> は決して変化しません。</li>
        <li>TypeScript では、関数はブーリアンを返す必要があります。<code>() =&gt; items.length &gt; 0</code> や <code>() =&gt; user != null</code> のように書いてください。</li>
      </ul>
      <h3>更新されるもの</h3>
      <ul>
        <li>同じブランチがアクティブなままの間、その要素は保持されます。その内側の動的な値、リスト、<code>when()</code> ブロックは引き続き更新されます。</li>
        <li>別のブランチがアクティブになると、古いコンテンツは削除され、その <code>onDestroy</code> フックが実行されます。新しいブランチはゼロから構築され、その <code>onMount</code> フックが実行されます。入力テキストやフォーカスなど、古い要素の状態は失われます。</li>
      </ul>
      <h3>ブランチのコンテンツ</h3>
      <p>ブランチには子要素を置きます: テキスト、動的なテキスト、ビルダー、<code>list()</code>、ネストした <code>when()</code>。DOM ノードではなく、<code>p('Hi')</code> のようなビルダーを渡してください。DOM ノードは、そのブランチが一度非表示になると更新されなくなります。</p>
      <p>ブランチ内の属性オブジェクトと <code>on()</code> は親要素に適用され、ブランチが非表示になった後も残ります。条件付きの属性には、動的な属性を使ってください: <code>{ className: () =&gt; (active ? 'active' : '') }</code>。</p>
      <h3>チェーン</h3>
      <p><code>.when()</code> と <code>.else()</code> は新しいビルダーを返し、元のビルダーを変更しません。<code>.else()</code> を 2 回呼び出した場合、最後の呼び出しが優先されます。</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>アイテムごとに 1 行をレンダリングします。<code>update()</code> ごとに、Nuclo は <code>items()</code> を再度呼び出し、新しいアイテムを既存の行と同一性（<code>===</code>）で照合します。</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>行の照合方法</h3>
      <ul>
        <li>引き続き存在するアイテムは、その行を保持します。必要であれば Nuclo は行を移動しますが、<code>renderItem</code> を再度呼び出すことはありません。</li>
        <li>新しいアイテムには新しい行が作られます。削除されたアイテムは行を失い、その <code>onDestroy</code> フックが実行されます。</li>
        <li>重複したアイテムには、それぞれ独自の行が作られます。</li>
        <li>配列をその場で変更する（<code>push</code>、<code>splice</code>、<code>sort</code>）ことも、新しい配列を返すこともできます。</li>
      </ul>
      <p>保持された行は再レンダリングされることがないため、変化するフィールドには動的な値を使ってください。</p>
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
      <p>コピーは新しいアイテムなので、配列を <code>todos.map((t) =&gt; ({ ...t }))</code> で置き換えると、すべての行が再構築されます。</p>
    `,
        afterContent: `
      <h3><code>renderItem</code> の戻り値</h3>
      <ul>
        <li><code>li(...)</code>、<code>tr(...)</code>、SVG ビルダーなど、1 つの要素を返します。アイテムをスキップするには <code>null</code> または <code>undefined</code> を返します。文字列、テキストノード、フラグメントは何もレンダリングしません。</li>
        <li><code>when()</code> や <code>list()</code> を直接返さないでください。行要素の内側に置きます: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>。</li>
        <li>アイテムを非表示にするには、<code>renderItem</code> ではなく <code>items()</code> の中でフィルタリングしてください。</li>
        <li><code>renderItem</code> には副作用を持たせないでください。Nuclo は同じアイテムに対して複数回呼び出すことがあります。</li>
      </ul>
      <h3>インデックス</h3>
      <p><code>index</code> は、行が作成された時点のアイテムの位置です。行が移動しても更新されません。現在の位置が必要な場合は、動的な値を使います: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>。</p>
      <h3>イテラブル</h3>
      <p>任意のイテラブルが使えます: 配列、<code>Set</code>、ジェネレーター、<code>map.values()</code>。毎回同じ配列や <code>Set</code> を返しても問題ありません。ジェネレーターや <code>map.values()</code> のようなイテレーターは 1 回の更新で消費されるため、呼び出しごとに <code>items()</code> の内側で作成してください。<code>Map</code> を直接イテレートすると毎回新しい <code>[key, value]</code> 配列が作られ、すべての行が再構築されます。代わりに <code>map.values()</code> を使ってください。</p>
      <h3>配置</h3>
      <p>行は、兄弟要素の中で <code>list()</code> が置かれた位置に、2 つのコメントマーカーの間に現れます。親の他の子要素には触れません。<code>list()</code> は SVG ビルダーの内側でも動作します。</p>
    `,
      },
      {
        id: "api-region",
        title: "region() と into()",
        content: `
      <p><code>region()</code> はツリー内に名前付きの場所をマークします。<code>into()</code> は、ツリーの他のどこからでも、どの深さからでも、そこを埋めます。レイアウトはコンテンツを prop として受け取らず、コンテンツを構築するコンポーネントはそれがどこに配置されるかを知りません。</p>
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
        <li><code>into()</code> は、書かれた場所にはコメントだけを残します。そのコンテンツはリージョンのマーカーの間にレンダリングされます。</li>
        <li>順序は関係ありません。リージョンより前に構築された <code>into()</code> は待機し、リージョンが構築された瞬間に表示されます。ビューは書かれた順序で表示されます。</li>
        <li>コンテンツのライフサイクルはビューと同じです。<code>into()</code> を保持する <code>when()</code> が閉じたり、その <code>list()</code> の行が削除されたりすると、コンテンツはリージョンから離れます。再度開くと、2 つではなく 1 つのコピーが追加されます。</li>
        <li>リージョンがなくなると、たとえばその <code>when()</code> が閉じると、そのビューは再び待機します。後で同じ id で構築されたリージョンがそれらを表示します。</li>
        <li>どのリージョンにも一致しない id の <code>into()</code> は何もレンダリングせず、エラーも発生しないため、スペルを確認してください。</li>
        <li>id はツリー内で一意です。すでに存在するリージョンと同じ id で 2 つ目のリージョンを構築すると、警告がログに出力されます。</li>
        <li>リージョンは<a href="#api-ssr">サーバーサイドレンダリング</a>でも動作します。<code>hydrate()</code> では、各ビューは再構築する代わりに、サーバーがレンダリングした HTML を引き継ぎます。</li>
      </ul>
      <h3>オプション</h3>
      <ul>
        <li><code>id</code>: <code>into()</code> の呼び出しがリージョンを見つけるために使う名前。</li>
        <li><code>type</code>: <code>'latest'</code>（デフォルト）は最新のビューだけを表示します。<code>'stack'</code> はすべてのビューを到着順に表示します。</li>
        <li><code>empty</code>: リージョンがビューを持たない間にレンダリングされます。</li>
      </ul>
      <h3>スタック型のリージョン</h3>
      <p><code>type: 'stack'</code> では、別のビューの上に開いたビューが、その下のビューを再構築することはありません。下のビューの DOM、フォーカス、フォームの状態はそのまま残ります。ページの上に表示するダイアログのようなレイヤーに使ってください。</p>
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
      <p>1 つの <code>into()</code> から複数のリージョンを埋めるには、オブジェクトを渡します。値は 1 つの子要素でも、子要素の配列でも構いません。どちらの形式もネストできます。別のビューのコンテンツ内にある <code>into()</code> は、自身のリージョンを対象にします。</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>ツリーの深い場所から開くダイアログ</h3>
      <p>オーバーレイのリージョンはルートに置きます。どの深さのどのコンポーネントでも、<code>into()</code> を <code>when()</code> でラップすることでダイアログを開けます。<code>when()</code> を閉じると、ダイアログはリージョンから削除されます。</p>
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
      <p><code>list()</code> の各行はビューです。スタック型のリージョンはそれらを順番に表示し、配列からアイテムを削除するとそのトーストも削除されます。</p>
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
      <p>デフォルトの <code>type: 'latest'</code> では、最新のビューが優先されます。見出し要素はレイアウトに置き、そのテキストは開いているページが決めます。<code>into('title', …)</code> を持たないページでは <code>empty</code> のテキストが残ります。</p>
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
      <p><code>into()</code> のコンテンツは通常の Nuclo コンテンツです。その中の関数は状態に依存する値であり、リージョンがどこにあっても <code>update()</code> で更新されます。</p>
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
      <p>ダッシュボードの <code>into()</code> は 1 回だけ書かれています。ユーザーがサインアウトしている間は <code>main</code> リージョンが存在しないため、ビューは待機します。サインインするとリージョンが構築され、ビューが表示されます。サインアウトするとリージョンが削除され、ビューは再び待機します。</p>
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
      <p>ビューは <code>region()</code> を含むことができ、他のビューはそれを対象にできます。ここでは、エディターページが <code>tabs</code> リージョンを一緒に持ち込み、各タブがそれを埋めます。エディターが閉じると、そのリージョンも一緒に消えます。</p>
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
      <p><code>update()</code> は動的な値だけを実行します。<code>h1(labels[lang].title)</code> のテキストのような静的な値は、ツリーの構築時に固定されます。<code>forceUpdate()</code> はコンポーネントを再度呼び出し、静的な値を含めて、実際の DOM が一致するようにパッチを当てます。言語の切り替えのような、まれでアプリ全体にわたる変更に使ってください。それ以外のすべてには <code>update()</code> を使います。</p>
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
      <p>引数なしの <code>forceUpdate()</code> は、<code>render(App)</code> または <code>hydrate(App)</code> でレンダリングされたすべてのルートを再構築します。<code>render(App())</code> でレンダリングされたルートはスキップされます。コンポーネントが例外を投げた場合、エラーはログに出力され、そのルートは以前の DOM を保持します。新しいビルドの適用中に後から投げられたエラーもログに出力されますが、すでにパッチされた部分はそのまま残ります。</p>
      <h3>残るものと変わるもの</h3>
      <ul>
        <li>子要素はタグによって順番に照合されます。一致する要素は再利用されるため、フォーカスと入力済みの値は残り、その <code>onMount</code> フックは再実行されません。ある子要素のタグが異なった時点で、その子要素とそれ以降のすべての兄弟要素は新しく構築されます。</li>
        <li>テキスト、属性、クラス、スタイル、リスナー、<code>when()</code> のブランチ、<code>list()</code> の行は新しいビルドに従います。</li>
        <li>新しい要素が作成され、その <code>onMount</code> フックが実行されます。新しいビルドで作られなくなった要素は削除され、その <code>onDestroy</code> フックが実行されます。</li>
        <li><code>list()</code> の行もアイテムではなく位置で照合されるため、再利用された行要素が別のアイテムを表示することになる場合があります。</li>
        <li>新しいビルドで設定されなくなった属性は削除されません。</li>
      </ul>
      <div class="docs-callout"><strong>注意:</strong> コンポーネント関数の内側で宣言した状態は、関数が再実行されるためリセットされます。保持すべき状態はコンポーネントの外側に置いてください。</div>
      <p><strong>明示的な形式。</strong><code>forceUpdate(App(), parent)</code> は <code>parent</code> 内の 1 つのツリーを再構築し、そのルートを返します。後の呼び出しのためにルートを登録することはありません。<code>hydrate()</code> と同様に、ルートが <code>parent</code> の最初のノードであることを想定します。最初のノードのタグが異なる場合、そのノードは置き換えられます。</p>
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
      <p>ツリーを構築し、そのルート要素を <code>parent</code> に追加します。<code>parent</code> のデフォルトは <code>document.body</code> です。ルート要素を返します。</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>コンポーネント（<code>render(App)</code>）か、それが返すビルダー（<code>render(App())</code>）のどちらでも渡せます。DOM は同じです。<a href="#api-force-update"><code>forceUpdate()</code></a> が後でルートを再構築できるのは <code>render(App)</code> だけなので、こちらを推奨します。</li>
        <li>追加のみ行います。<code>parent</code> をクリアしないため、2 回呼び出すとコピーが 2 つ追加されます。</li>
        <li><code>render()</code> が戻った時点で、ツリー内のすべての <code>onMount</code> は実行済みです。</li>
        <li>ドキュメント内にある要素へレンダリングしてください。<a href="#api-update"><code>update()</code></a> を参照してください。</li>
        <li>ルートは <code>when()</code> や <code>list()</code> ではなく、<code>div(...)</code> のような要素でなければなりません。</li>
        <li><code>index</code> は内部用です。要素の挿入位置を決めるものではありません。省略してください。</li>
      </ul>
      <p><code>render(App)</code> として渡すコンポーネントは、パラメーターを取ってはいけません。必須パラメーターは型エラーになります。オプショナルなパラメーターは型チェックを通りますが、<code>render()</code> は実行時に例外を投げます。props を取るコンポーネントはラップしてください。</p>
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
      <p><a href="#api-ssr"><code>renderToString()</code></a> が生成した HTML を引き継ぎます。既存の要素を再利用し、イベントリスナーを取り付け、動的な値、<code>when()</code>、<code>list()</code> を接続するため、その後は <code>update()</code> が動作します。続いて <code>onMount</code> フックを実行します。<code>parent</code> のデフォルトは <code>document.body</code> です。ルート要素を返します。</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>サーバーと同じコンポーネント、同じデータを使ってください。</li>
        <li>専用のコンテナーへハイドレーションしてください。アプリのルートはその最初のノードでなければなりません。ただし空白は問題ありません。別のノードが先にある場合、Nuclo はそのノードを置き換え、サーバー側のコピーは残されます。</li>
        <li><code>render()</code> と同様に、<code>forceUpdate()</code> が後でルートを再構築できるよう、<code>App()</code> ではなく <code>App</code> を渡してください。<code>App</code> はパラメーターを取ってはいけません。オプショナルなパラメーターがある場合、<code>hydrate()</code> は何も取り付けず、エラーも出さずに終了します。props を取るコンポーネントはラップしてください: <code>hydrate(() =&gt; Page(props), root)</code>。</li>
        <li>サーバー側の HTML がない場合は、<code>render()</code> を使ってください。</li>
      </ul>
      <h3>サーバーとクライアントが異なる場合</h3>
      <p>クライアントが優先されます。</p>
      <ul>
        <li>ルートのタグが異なる場合、そのノードは新しい DOM に置き換えられます。コンテナーが空の場合、新しい DOM が追加されます。</li>
        <li>異なるテキストはパッチされます。異なる <code>list()</code> のアイテムと <code>when()</code> のブランチはクライアントに従います。</li>
        <li>サーバー側に余分な子要素があれば削除され、不足していれば作成されます。</li>
        <li>サーバーが書き込んだがクライアントが設定しない属性は、そのまま残されます。</li>
      </ul>
      <p><code>renderToString()</code> は、各テキストノードの前の <code>&lt;!-- text-0 --&gt;</code> のように、HTML コメントをマーカーとして書き込みます。<code>hydrate()</code> にはこれが必要なので、サーバー側の HTML からコメントを取り除かないでください。マーカーがないと、ハイドレーションは <code>list()</code> の行を削除し、<code>list()</code> と <code>when()</code> は更新されなくなります。</p>
    `,
      },
      {
        id: "api-ssr",
        title: "サーバーサイドレンダリング",
        content: `
      <p>サーバー上でコンポーネントを HTML 文字列にレンダリングします。ブラウザーでは、同じコンポーネントで <a href="#api-hydrate"><code>hydrate()</code></a> を呼び出し、その HTML をインタラクティブにします。サーバーランタイムには <code>document</code> がないため、まず <a href="#api-polyfill"><code>nuclo/polyfill</code></a> をインポートしてください。</p>
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
      <p>style タグの <code>id="nuclo-styles"</code> は残してください。クライアントはその要素を再利用し、新しいルールだけを追加します。<a href="#api-css-text"><code>getCssText()</code></a> を参照してください。</p>
      <h3>サーバー上で実行されるもの</h3>
      <ul>
        <li><code>renderToString()</code> の各呼び出しはツリーを構築し、各動的な値を 1 回実行します。</li>
        <li>イベントハンドラー、<code>onMount</code>、<code>onDestroy</code> は実行されません。<code>update()</code>、<code>scope()</code>、<code>forceUpdate()</code> は何もしません。</li>
        <li>レンダリングは同期的です。まずデータを読み込み、その後レンダリングしてください。</li>
        <li>レンダリング後には何も登録されたまま残らないため、1 つのプロセスで多数のリクエストを処理できます。リクエストデータは <code>renderToString(Page(user))</code> のように引数として渡してください。モジュールレベルの変数はすべてのリクエストで共有されます。</li>
        <li>サーバー上で <code>render()</code> を呼び出さないでください。共有の <code>document.body</code> に追加されてしまいます。</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>ビルダー（<code>App()</code>）、コンポーネント（<code>App</code>）、または DOM ノードを受け取ります。<code>null</code> と <code>undefined</code> は <code>""</code> を返します。ルートは要素でなければなりません。<code>renderToString(Page)</code> として渡すコンポーネントはパラメーターを取ってはいけないため、データを取るものには <code>Page(user)</code> を渡してください。</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>テキストと属性値は HTML エスケープされます。<code>script()</code> と <code>style()</code> の内側のテキストは、閉じタグだけを分断してそのまま書き出されるため、ユーザー入力を絶対に置かないでください。</li>
        <li>例外は投げません。コンポーネント、<code>list()</code> の関数、<code>when()</code> の条件が例外を投げた場合、またはポリフィルがない場合、エラーをログに出力して <code>""</code> を返します。リクエストを失敗させるべき場合は、結果が空かどうかを確認してください。例外を投げたテキストや属性の関数は、空としてレンダリングされるだけです。</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p><code>inputs.map(renderToString)</code> と同じです。</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>出力を 1 つの要素でラップします。<code>containerTag</code> のデフォルトは <code>"div"</code>、<code>containerAttrs</code> のデフォルトは <code>{}</code> です。属性値はエスケープされます。属性名は与えられたとおりに書き出されるため、<code>class</code> のような HTML の名前を使ってください。タグにユーザー入力を渡さないでください。</p>
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
      <p>Nuclo が Node と Bun でツリーを構築できるようにする小さな DOM です。最初のレンダリングの前に 1 回インポートしてください。ほとんどのアプリにはプレーンなインポートだけで十分です。</p>
      <ul>
        <li><code>window</code> がない場合、<code>globalThis.document</code>、<code>Node</code>、<code>Element</code>、<code>HTMLElement</code> を設定しますが、存在しないものだけを設定します。<code>window</code> は作成しません。</li>
        <li>ブラウザー内、または jsdom 上では何もしません。</li>
        <li><code>Event</code> と <code>CustomEvent</code> はランタイム自身のコンストラクターです。<code>Node</code>、<code>Element</code>、<code>HTMLElement</code> はポリフィルのクラスのエイリアスです。</li>
      </ul>
      <p>これはツリーを構築するための DOM であり、ブラウザーではありません。<code>innerHTML</code> も <code>getElementById</code> もなく、<code>querySelector()</code> は <code>null</code> を返し、イベントリスナーは無視されます。HTML を取得するには <code>renderToString()</code> を使ってください。</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
