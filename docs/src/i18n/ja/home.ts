// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · 依存関係ゼロ`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["*明示的*な UI を", "nuclo で", "作ろう。"];

export const HERO_DESC =
  "小さくて型安全な DOM フレームワーク。state はふつうの変数やオブジェクトのまま、自由に書き換えられます。画面に反映するタイミングは、あなたが決めます。プロキシも、シグナルも、仮想 DOM もありません。";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "依存関係" },
  { num: "175", sup: "",   label: "型付き HTML & SVG ビルダー" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "コアランタイム (gzip 圧縮後)" },
];

export const COUNTER_TEASER_CODE = `import 'nuclo'

let count = 0

export function Counter() {
  return div(
    span(() => count),
    button("-", { onClick: () => { count--; update() } }),
    button("Reset", { onClick: () => { count = 0; update() } }),
    button("+", { onClick: () => { count++; update() } }),
  )
}`;

export const TODO_TEASER_CODE = `import 'nuclo'

interface Todo {
  text: string
  done: boolean
}

let todos: Todo[] = []
let text = ''

function addTodo() {
  if (!text.trim()) return
  todos.push({ text, done: false })
  text = ''
  update()
}

export function TodoList() {
  return div(
    input(
      { placeholder: 'Add a task…' },
      { onInput: (e) => { text = (e.target as HTMLInputElement).value } },
      { onKeyDown: (e) => { if (e.key === 'Enter') addTodo() } },
    ),
    button('Add', { onClick: addTodo }),
    list(
      () => todos,
      (todo) => div(
        input(
          { type: 'checkbox' },
          { checked: () => todo.done },
          { onChange: () => { todo.done = !todo.done; update() } },
        ),
        span(todo.text),
      ),
    ),
  )
}`;

export const PHILOSOPHY_QUOTE =
  "state を書き換えても、何も起きません。update() を呼んだそのときに、Nuclo は頼まれたことだけを、きっちりやります。";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "暗黙より明示",
    desc: "プロキシが裏で変更を見張ることはありません。state を書き換えて、update() を呼ぶ。原因と結果が一目でわかるので、挙動を予想しやすく保てます。",
  },
  {
    num: "02",
    title: "何度いじっても、更新は 1 回",
    desc: "10 回書き換えても、update() は 1 回でかまいません。DOM に反映されるのは最終的な状態だけなので、無駄な render が走りません。",
  },
  {
    num: "03",
    title: "コンポーネントより、ただの関数",
    desc: "UI はふつうの JavaScript の関数で組み立てます。クラスもデコレーターも独自構文も不要で、どの関数も DOM ノードを返すだけ。onMount と onDestroy は、必要になったときに通常のモディファイアとして足せば十分です。",
  },
];

export const FEATURES = [
  {
    num: "01 · 明示的",
    title: "更新のタイミングを自分で決める",
    desc: "好きなだけ書き換えて、update() を 1 回呼ぶ。購読もスケジューラーも、不意打ちの diff 処理もありません。DOM が同期されるのは、あなたが決めた瞬間だけです。",
  },
  {
    num: "02 · 軽量",
    title: "依存関係ゼロ",
    desc: `コアランタイムは gzip 後でわずか約 ${NUCLO_GZIP_KB} KB。コンパイラーもビルドプラグインも要りません。import を 1 行書けば、すぐに作り始められます。`,
  },
  {
    num: "03 · 型付き",
    title: "TypeScript ファースト",
    desc: "175 個の HTML / SVG ビルダーはすべて型付き。属性もスタイルプロパティもイベントも、エディターの補完がしっかり効きます。",
  },
  {
    num: "04 · 精密",
    title: "変わったところだけ、DOM に書く",
    desc: "動的な式は update() のたびに再評価され、実際に値が変わったものだけが DOM に書き込まれます。",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · 変更",
    title: "データを変える",
    desc: "state はただの JavaScript。変数、配列、オブジェクトを、好きなように好きなだけ書き換えてください。",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · コミット",
    title: "update() を呼び出す",
    desc: "変更を確定するのは、グローバル関数 1 つだけ。十数回の変更もまとめて 1 回でコミットします。呼ぶまで、画面は何も変わりません。",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · パッチ",
    title: "Nuclo が DOM を同期する",
    desc: "動的な式がすべて再評価され、変わった値だけが DOM に書き込まれます。diff も再 render もありません。",
    code: `<span class="cm">// パッチされるのは 2 ノードだけ。</span>
<span class="cm">// 残りには触れません。</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "diff なし。プロキシなし。不意打ちなし。";
export const COMPARISON_SUB =
  "Nuclo が UI を更新するのは、update() を呼んだときだけです。";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "仮想 DOM",
    sub: "render → diff → commit",
    items: [
      { good: false, text: "state が変わるたびに、コンポーネントツリーを丸ごと再 render する" },
      { good: false, text: "変更箇所を探すため、新旧のツリーを diff する" },
      { good: false, text: "速度を取り戻すには、メモ化が欠かせない" },
      { good: false, text: "古い値を掴んだクロージャーや依存配列と付き合う羽目になる" },
    ],
  },
  {
    name: "シグナルとプロキシ",
    sub: "シグナル · ストア · エフェクト",
    items: [
      { good: false, text: "state をプロキシとサブスクリプションで包む" },
      { good: false, text: "依存関係を、実行時に裏でこっそり追跡する" },
      { good: false, text: "自分では制御できないタイミングで、更新が連鎖する" },
      { good: false, text: "デバッガーでステップ実行しにくい" },
    ],
  },
  {
    name: "Nuclo",
    sub: "変更 → update()",
    featured: true,
    items: [
      { good: true, text: "ラッパーもプロキシもなし。普通の変数やオブジェクトを、そのまま書き換えられる state" },
      { good: true, text: "update() の呼び出しひとつが、メンタルモデルのすべて" },
      { good: true, text: "変わった値だけを DOM に反映" },
      { good: true, text: `約 ${NUCLO_GZIP_KB} KB、依存関係ゼロ、TypeScript ファースト` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "速さが問われる場面で、速い。";
export const BENCHMARK_SUB =
  "第三者の js-framework-benchmark による実測値。数千行の作成、更新、入れ替え、クリアにかかる時間を計測しています。";

export const BENCHMARK_NOTE =
  "スコアは、最速の実装を 1 としたときの所要時間の倍率で、すべての keyed ベンチマークの加重幾何平均です。";

export const BENCHMARK_SOURCE_URL =
  "https://krausest.github.io/js-framework-benchmark/2026/chrome152.html";

export const BENCHMARK_SOURCE_LABEL = "js-framework-benchmark · keyed";

/** Weighted geometric mean per framework (keyed implementations, lower is better). */
export const BENCHMARK_ENTRIES: {
  name: string;
  version: string;
  score: number;
  featured?: boolean;
}[] = [
  { name: "Nuclo",    version: "0.2.24", score: 1.12, featured: true },
  { name: "Solid",    version: "1.9.3",  score: 1.13 },
  { name: "Svelte",   version: "5.42.1", score: 1.17 },
  { name: "Vue",      version: "3.5.39", score: 1.31 },
  { name: "Riot",     version: "10.1.2", score: 1.54 },
  { name: "React",    version: "19.2.0", score: 1.58 },
  { name: "Angular",  version: "22.0.0", score: 1.58 },
  { name: "Stencil",  version: "4.23.0", score: 1.81 },
  { name: "Ember",    version: "7.3.0-alpha.5", score: 2.06 },
  { name: "Knockout", version: "3.5.1",  score: 2.26 },
  { name: "Qwik",     version: "1.11.0", score: 3.29 },
];

// ── CTA ─────────────────────────────────────────────────────────────────────
export const CTA_TITLE = "さあ、はじめましょう。";
export const CTA_SUB =
  "Nuclo をインストールして、import して、指示したタイミングでぴったり更新される UI を届けましょう。API の全体像も半日あれば把握できます。";

export const QUICK_START_STEPS = [
  {
    num: "01 - インストール",
    title: "インストール",
    desc: "npm、pnpm、yarn、bun のどれでも、Nuclo をプロジェクトに追加できます。",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - インポート",
    title: "インポート",
    desc: "side-effect import を 1 行書くだけで、175 個すべてのタグビルダーがグローバルに登録されます。",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - 作成",
    title: "作成",
    desc: "DOM ノードを返す関数を書いて、state が変わったら update() を呼ぶ。それだけです。",
    code: `<span class="kw">let</span> <span class="pr">name</span> <span class="pt">=</span> <span class="st">'World'</span>

<span class="kw">const</span> <span class="pr">app</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">h1</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Hello, </span><span class="pt">\${</span><span class="pr">name</span><span class="pt">}\`),</span>
  <span class="fn">button</span><span class="pt">(</span>
    <span class="st">"Change"</span><span class="pt">,</span>
    <span class="pt">{</span> <span class="pr">onClick</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span>
      <span class="pr">name</span> <span class="pt">=</span> <span class="st">'Nuclo'</span>
      <span class="fn">update</span><span class="pt">()</span>
    <span class="pt">} }</span>
  <span class="pt">)</span>
<span class="pt">)</span>`,
    lang: "app.ts",
  },
];

// ── Section chrome: headings, buttons and labels written inline in home/components.ts ──
export const LABELS = {
  getStarted: "はじめる",
  viewExamples: "サンプルを見る",
  copyInstall: "インストールコマンドをコピー",
  howItWorks: "仕組み",
  pipelineTitle: "明示的なサイクルは、たったの 1 つ。",
  pipelineSub: "依存グラフもスケジューラーもなく、動くタイミングは自分次第。データが画面に届くまでの流れは、シンプルで予測できます。",
  philosophy: "設計思想",
  features: "機能",
  featuresTitle: "わかりやすさを、最優先に。",
  featuresSub: "魔法も、不意打ちもなし。すべての更新は、意図したものです。",
  comparison: "比較",
  theNucloWay: "Nuclo のやり方",
  benchmarks: "ベンチマーク",
  lowerIsBetter: "低いほど良い",
  benchmarkSource: "出典: js-framework-benchmark",
  quickStart: "クイックスタート",
  quickStartTitle: "数分で、動き出す。",
  quickStartSub: "3 ステップで、本物の UI が動きます。",
  readFullDocs: "ドキュメント全体を読む →",
  examples: "サンプル",
  examplesTitle: "動かして、確かめる。",
  examplesSub: "触って試せるデモです。コードも一緒に見られます。",
  viewAllExamples: "すべてのサンプルを見る →",
  readTheDocs: "ドキュメントを読む",
  addATask: "タスクを追加…",
  add: "追加",
  reset: "リセット",
  // The hero card
  previousExample: "前のサンプル",
  nextExample: "次のサンプル",
  closeCodeView: "コード表示を閉じる",
  example: (n: number, title: string) => `サンプル ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "描いて、DOM に反映",
    note: "左のグリッドはただの boolean の配列で、塗る操作は配列の値を書き換えるだけ。右の DOM が更新されるのは update() が走ったときだけで、パッチされるのも変わったセルだけです。",
  },
  Draw: {
    title: "マークを描く",
    note: "Nuclo のロゴはスピログラフ。リングの内側を転がる 1 つの車輪と、その上に 2 本のペンがあります。車輪もアームもペンも線も、すべて 1 つの数値 t の関数です。タイムラインとフレームループは t を設定するだけ。update('draw') が、t を読む関数を再実行します。",
  },
  Fireworks: {
    title: "空をタップ",
    note: "火花は 1 つ残らず、配列の中のただのオブジェクトです。list() がそれぞれに <line> を割り当て、配列から消えたフレームでその要素を取り除きます。update() は 1 フレームに 1 回で、diff はありません。",
  },
  Waves: {
    title: "波を曲げる",
    note: "各 path の d は、3 つの数値から決まるただの関数です。スライダーとフレームループは数値を変えるだけ。update('waves') が、それを読む関数を再実行します。",
  },
  Sort: {
    title: "並び替えても、作り直さない",
    note: "バブルソートが、ふつうの配列の中のオブジェクトを入れ替えます。list() は各バーをオブジェクトに紐づけているので、update() は既存のノードを新しい順序へ動かすだけ。カウンターを見てください。バーが作り直されることは一度もありません。",
  },
  Chase: {
    title: "ロープを導く",
    note: "このカードは scope() です。毎フレーム 32 個の点を動かして update('chase') を呼ぶと、Nuclo が再計算するのはこのカード内の属性だけ。ページのほかの部分には触れません。",
  },
  Reflex: {
    title: "緑になったらタップ",
    note: "ステージに何を表示するかは、1 つの文字列で決まります。各 when() ブランチは条件が true になると作られ、false になると取り除かれます。ステージの class も、同じ文字列から導かれる関数です。",
  },
  Warp: {
    title: "長押しでワープ",
    note: "onMount がフレームループを開始し、そのクリーンアップ関数を返します。フィールドが unmount されると、Nuclo がクリーンアップを実行。ループは止まり、裏で動き続けるものは何も残りません。",
  },
  Life: {
    title: "ライフゲーム",
    note: "盤面は、各セルの生存期間を持つただの配列です。ティックごとに次の世代を計算して update() を呼びます。各セルの class は生存期間で決まるので、パッチされるのは変わったセルだけです。",
  },
};
