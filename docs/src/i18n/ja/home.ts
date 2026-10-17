// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · 依存関係ゼロ`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["更新を*明示する*", "インターフェースを", "nuclo で構築。"];

export const HERO_DESC =
  "小さく型安全な DOM フレームワーク。状態には通常の変数やオブジェクトを使い、そのまま変更できます。更新のタイミングは自分で制御します。プロキシも、シグナルも、仮想 DOM もありません。";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "依存関係" },
  { num: "175", sup: "",   label: "型付き HTML & SVG ビルダー" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzip 圧縮時、コアランタイム" },
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
  "状態を変更しても、何も起こりません。update() を呼び出すと、Nuclo は求められたことだけを正確に行います。それ以上でも、それ以下でもありません。";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "暗黙より明示",
    desc: "プロキシによる変更の追跡はありません。状態を変更し、それから update() を呼び出します。原因と結果が明確で予測可能なままです。",
  },
  {
    num: "02",
    title: "自由にまとめて、一度だけ更新",
    desc: "10 回変更してから、update() を一度だけ呼び出します。DOM に反映されるのは最終状態だけ。無駄なレンダリングはありません。",
  },
  {
    num: "03",
    title: "コンポーネントではなく関数",
    desc: "プレーンな JavaScript の関数で構築します。Nuclo にはクラスも、デコレーターも、特別な構文も必要ありません。各関数は DOM ノードを返します。onMount と onDestroy は、必要なときだけ通常のモディファイアとして追加します。",
  },
];

export const FEATURES = [
  {
    num: "01 · 明示的",
    title: "更新のタイミングを自分で決める",
    desc: "自由に変更し、それから update() を一度だけ呼び出します。Nuclo にはサブスクリプションもスケジューラーも必要なく、予期しない差分処理もありません。DOM はあなたが決めたときに同期します。",
  },
  {
    num: "02 · 軽量",
    title: "依存関係ゼロ",
    desc: `コアランタイムは gzip 圧縮時で約 ${NUCLO_GZIP_KB} KB。Nuclo にはコンパイラーもビルドプラグインも必要ありません。import を 1 行追加して構築を始めましょう。`,
  },
  {
    num: "03 · 型付き",
    title: "TypeScript ファースト",
    desc: "完全に型付けされた 175 個の HTML および SVG ビルダーが、すべての属性、スタイルプロパティ、イベントに自動補完を提供します。",
  },
  {
    num: "04 · 精密",
    title: "DOM の必要な箇所だけを更新",
    desc: "動的な式は update() 時に再評価されます。実際に変わった値だけが DOM に書き込まれます。",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · 変更",
    title: "データを変える",
    desc: "状態はプレーンな JavaScript です: 変数、配列、オブジェクト。好きなように、好きなだけ変更してください。",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · コミット",
    title: "update() を呼び出す",
    desc: "1 つのグローバル関数が変更をコミットします。十数回の変更をまとめて、一度だけコミットします。呼び出すまで画面は更新されません。",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · パッチ",
    title: "Nuclo が DOM を同期する",
    desc: "すべての動的な式が再評価されます。Nuclo は実際に変わった値だけを DOM に書き込みます。diff も再レンダリングもありません。",
    code: `<span class="cm">// 2 ノードがパッチされ、</span>
<span class="cm">// 残りはそのまま</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "diff なし。プロキシなし。驚きなし。";
export const COMPARISON_SUB =
  "Nuclo は update() を呼び出したときにだけインターフェースを更新します。";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "仮想 DOM",
    sub: "レンダー → diff → コミット",
    items: [
      { good: false, text: "状態が変わるたびにコンポーネントツリーを再レンダリングする" },
      { good: false, text: "変更箇所を見つけるために新旧のツリーを diff する" },
      { good: false, text: "パフォーマンスを取り戻すためにメモ化が必要" },
      { good: false, text: "古い値を参照するクロージャーや依存配列への対処が必要" },
    ],
  },
  {
    name: "シグナルとプロキシ",
    sub: "シグナル · ストア · エフェクト",
    items: [
      { good: false, text: "状態をプロキシとサブスクリプションでラップする" },
      { good: false, text: "実行時に依存関係を見えない形で追跡する" },
      { good: false, text: "制御できないスケジュールで更新を連鎖させる" },
      { good: false, text: "デバッガーでステップ実行しづらい" },
    ],
  },
  {
    name: "Nuclo",
    sub: "変更 → update()",
    featured: true,
    items: [
      { good: true, text: "ラッパーもプロキシもない、通常の変数やオブジェクトで管理する、変更可能な状態" },
      { good: true, text: "update() という 1 つの呼び出しがメンタルモデルのすべて" },
      { good: true, text: "変わった値だけを DOM に反映する" },
      { good: true, text: `約 ${NUCLO_GZIP_KB} KB、依存関係ゼロ、TypeScript ファースト` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "重要なところで速い。";
export const BENCHMARK_SUB =
  "これは js-framework-benchmark による独立した数値で、数千行の作成、更新、入れ替え、クリアを測定したものです。";

export const BENCHMARK_NOTE =
  "このスコアは、測定対象で最速の実装に対する所要時間の倍率を示します。すべての keyed ベンチマークの加重幾何平均です。";

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
export const CTA_TITLE = "準備ができたら、いつでも。";
export const CTA_SUB =
  "Nuclo をインストールし、一度 import して、意図したとおりに更新される UI を作りましょう。API 全体は半日で学べます。";

export const QUICK_START_STEPS = [
  {
    num: "01 - インストール",
    title: "インストール",
    desc: "npm、pnpm、yarn、bun のいずれかで Nuclo をプロジェクトに追加します。",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - インポート",
    title: "インポート",
    desc: "副作用インポートを 1 行書くだけで、175 個すべてのタグビルダーがグローバルに登録されます。",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - 構築",
    title: "構築",
    desc: "DOM ノードを返すプレーンな関数を書きます。状態が変わったら update() を呼び出します。",
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
  pipelineTitle: "1 つの明示的なサイクル。",
  pipelineSub: "状態依存の値。依存グラフもスケジューラーもありません。実行のタイミングは自分で決めます。データから画面までの流れはシンプルで予測可能です。",
  philosophy: "設計思想",
  features: "機能",
  featuresTitle: "明快さのために。",
  featuresSub: "魔法なし。驚きなし。すべての更新は意図的です。",
  comparison: "比較",
  theNucloWay: "nuclo のやり方",
  benchmarks: "ベンチマーク",
  lowerIsBetter: "低いほど良い",
  benchmarkSource: "出典: js-framework-benchmark",
  quickStart: "クイックスタート",
  quickStartTitle: "数分で動き出す。",
  quickStartSub: "3 ステップで本物の UI を構築できます。",
  readFullDocs: "ドキュメント全体を読む →",
  examples: "サンプル",
  examplesTitle: "実際に見てみる。",
  examplesSub: "インタラクティブなデモ。各デモのコードも確認できます。",
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
    note: "左のグリッドはプレーンな真偽値の配列です: 塗る操作は配列の値を変えるだけです。右の DOM は update() が実行されたときにだけ更新され、そのときも変わったセルだけがパッチされます。",
  },
  Draw: {
    title: "マークを描く",
    note: "Nuclo のマークはスピログラフです: リングの内側を転がる 1 つの車輪と、その上の 2 本のペン。車輪、そのアーム、ペン、線はすべて 1 つの数値 t の関数です。タイムラインとフレームループは t を設定するだけで、update('draw') がその値を参照する関数を再実行します。",
  },
  Fireworks: {
    title: "空をタップ",
    note: "すべての火花は配列内のプレーンなオブジェクトです。list() がそれぞれに <line> を与え、オブジェクトが配列から消えたフレームでそれを取り除きます。1 フレームに 1 回の update()。diff は行われません。",
  },
  Waves: {
    title: "波を曲げる",
    note: "各パスの d は 3 つの数値のプレーンな関数です。スライダーとフレームループは数値を変えるだけで、update('waves') がそれを読む関数を再実行します。",
  },
  Sort: {
    title: "並び替えても、作り直さない",
    note: "バブルソートがプレーンな配列内のオブジェクトを入れ替えます。list() は各バーをそのオブジェクトに紐づけるので、update() は既存のノードを新しい順序に移動させます。カウンターを見てください: バーが作り直されることは一度もありません。",
  },
  Chase: {
    title: "ロープを導く",
    note: "このカードは scope() です。毎フレーム 32 個のプレーンな点を動かして update('chase') を呼び出します: Nuclo はこのカード内の属性を再計算し、ページの残りには触れません。",
  },
  Reflex: {
    title: "緑になったらタップ",
    note: "1 つのプレーンな文字列がステージに何を表示するかを決めます。各 when() ブランチは条件が真になったときに構築され、偽になったときに取り除かれます。ステージのクラスは同じ文字列の関数です。",
  },
  Warp: {
    title: "長押しでワープ",
    note: "onMount がフレームループを開始し、そのクリーンアップを返します。フィールドをアンマウントすると Nuclo がそのクリーンアップを実行します: ループは止まり、動き続けるものは何も残りません。",
  },
  Life: {
    title: "ライフゲーム",
    note: "盤面は各セルの生存期間を表す通常の配列です。ティックごとに次の状態を計算して update() を呼び出します。各セルのクラスはその生存期間から決まるので、変わったセルだけがパッチされます。",
  },
};
