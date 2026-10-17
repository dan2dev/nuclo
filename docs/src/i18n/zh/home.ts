// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · 零依赖`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["用 nuclo", "构建*显式*", "的界面。"];

export const HERO_DESC =
  "一个小而类型安全的 DOM 框架。状态保持普通且可变。每一次更新都由你掌控。没有代理，没有信号，没有虚拟 DOM。";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "依赖" },
  { num: "175", sup: "",   label: "类型化 HTML 与 SVG 构建器" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzip 压缩后，核心运行时" },
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
  "修改状态时，什么都不会发生。调用 update()，Nuclo 就精确地做你要求的事。不多，不少。";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "显式优于隐式",
    desc: "没有代理追踪你的每一步。你修改状态，然后调用 update()。因果关系始终清晰可预期。",
  },
  {
    num: "02",
    title: "随意批量修改，只更新一次",
    desc: "做十次修改，然后调用一次 update()。DOM 只看到最终状态。没有渲染被浪费。",
  },
  {
    num: "03",
    title: "函数，而非组件",
    desc: "用普通的 JavaScript 函数构建。Nuclo 不需要类、装饰器或特殊语法。每个函数返回 DOM 节点。onMount 和 onDestroy 是普通的修饰器，只在需要时添加。",
  },
];

export const FEATURES = [
  {
    num: "01 · 显式",
    title: "更新周期由你掌控",
    desc: "随意修改，然后调用一次 update()。Nuclo 不需要订阅，不需要调度器，也绝不会用一次 diff 让你意外。DOM 在你决定的时刻同步。",
  },
  {
    num: "02 · 轻量",
    title: "零依赖",
    desc: `核心运行时 gzip 压缩后约 ${NUCLO_GZIP_KB} KB。Nuclo 不需要编译器，也不需要构建插件。加一行 import 就开始构建。`,
  },
  {
    num: "03 · 类型化",
    title: "TypeScript 优先",
    desc: "175 个完整类型化的 HTML 与 SVG 构建器，为每个属性、样式属性和事件提供自动补全。",
  },
  {
    num: "04 · 精确",
    title: "细粒度修补",
    desc: "动态表达式在 update() 时重新求值。只有真正改变的值才会触碰 DOM。",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · 修改",
    title: "改变你的数据",
    desc: "状态就是普通的 JavaScript：变量、数组、对象。想怎么改就怎么改，改多少次都可以。",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · 提交",
    title: "调用 update()",
    desc: "一个全局函数提交你的更改。批量做十几次修改，然后提交一次。在你说之前，什么都不会渲染。",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · 修补",
    title: "Nuclo 同步 DOM",
    desc: "每个动态表达式重新求值。Nuclo 只把真正改变的值写入 DOM。没有 diff，没有重新渲染。",
    code: `<span class="cm">// 修补了 2 个节点，</span>
<span class="cm">// 其余一切未被触碰</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "没有 diff。没有代理。没有意外。";
export const COMPARISON_SUB =
  "Nuclo 只在你调用 update() 时更新界面。";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "虚拟 DOM",
    sub: "渲染 → 比较 → 提交",
    items: [
      { good: false, text: "每次状态变化都重新渲染组件树" },
      { good: false, text: "对比新旧两棵树来找出变化" },
      { good: false, text: "需要记忆化才能把性能赢回来" },
      { good: false, text: "留下过期闭包和依赖数组" },
    ],
  },
  {
    name: "信号与代理",
    sub: "信号 · 状态存储 · 副作用",
    items: [
      { good: false, text: "把你的状态包进代理和订阅里" },
      { good: false, text: "在运行时不可见地追踪依赖" },
      { good: false, text: "按你无法控制的时机级联更新" },
      { good: false, text: "很难在调试器中逐步跟踪" },
    ],
  },
  {
    name: "Nuclo",
    sub: "修改 → update()",
    featured: true,
    items: [
      { good: true, text: "普通的可变状态，没有包装，没有代理" },
      { good: true, text: "一次调用 update()，就是全部的心智模型" },
      { good: true, text: "只修补改变了的值" },
      { good: true, text: `约 ${NUCLO_GZIP_KB} KB，零依赖，TypeScript 优先` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "在关键之处足够快。";
export const BENCHMARK_SUB =
  "这些是来自 js-framework-benchmark 的独立数据，涵盖创建、更新、交换和清除数千行。";

export const BENCHMARK_NOTE =
  "该分数是相对于测得最快实现的耗时放慢倍数，为所有 keyed 基准的加权几何平均值。";

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
export const CTA_TITLE = "随时准备就绪。";
export const CTA_SUB =
  "安装 Nuclo，导入一次，交付在你指定的时刻精确更新的 UI。一个下午就能学完整个 API。";

export const QUICK_START_STEPS = [
  {
    num: "01 - 安装",
    title: "安装",
    desc: "用 npm、pnpm、yarn 或 bun 把 Nuclo 添加到你的项目。",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - 导入",
    title: "导入",
    desc: "一个副作用导入即可全局注册全部 175 个标签构建器。",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - 构建",
    title: "构建",
    desc: "编写返回 DOM 节点的普通函数。状态变化时调用 update()。",
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
  getStarted: "开始使用",
  viewExamples: "查看示例",
  copyInstall: "复制安装命令",
  howItWorks: "工作原理",
  pipelineTitle: "一个显式的周期。",
  pipelineSub: "状态依赖值，没有依赖图，没有调度器。何时运行由你决定——从数据到屏幕只有一条可预期的路径。",
  philosophy: "理念",
  features: "特性",
  featuresTitle: "为清晰而生。",
  featuresSub: "没有魔法。没有意外。每一次更新都是有意为之。",
  comparison: "对比",
  theNucloWay: "nuclo 之道",
  benchmarks: "基准测试",
  lowerIsBetter: "越低越好",
  benchmarkSource: "来源：js-framework-benchmark",
  quickStart: "快速开始",
  quickStartTitle: "几分钟即可上手。",
  quickStartSub: "三步之后，你就在构建真正的 UI。",
  readFullDocs: "阅读完整文档 →",
  examples: "示例",
  examplesTitle: "实际看看。",
  examplesSub: "交互式演示。探索每一个背后的代码。",
  viewAllExamples: "查看全部示例 →",
  readTheDocs: "阅读文档",
  addATask: "添加任务…",
  add: "添加",
  reset: "重置",
  // The hero card
  previousExample: "上一个示例",
  nextExample: "下一个示例",
  closeCodeView: "关闭代码视图",
  example: (n: number, title: string) => `示例 ${n}：${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "先涂画，再修补",
    note: "左侧网格是一个普通的布尔数组：涂画它只是一次修改，仅此而已。右侧的 DOM 只在 update() 运行时才动，而且只修补改变了的格子。",
  },
  Draw: {
    title: "画出标志",
    note: "Nuclo 的标志是一个万花尺：一个轮子在环内滚动，上面有两支笔。轮子、臂、笔和线条都是同一个数 t 的函数。时间轴和帧循环只设置 t；update('draw') 重新运行读取它的部分。",
  },
  Fireworks: {
    title: "点一下天空",
    note: "每个火花都是数组中的一个普通对象。list() 给每个火花一个 <line>，并在其对象离开数组的那一帧把它移除。每帧一次 update()；没有任何 diff。",
  },
  Waves: {
    title: "弯折波浪",
    note: "每条 path 的 d 都是三个数的普通函数。滑块和帧循环只改变这些数；update('waves') 重新运行读取它们的函数。",
  },
  Sort: {
    title: "排好序，从不重建",
    note: "冒泡排序在普通数组中交换对象。list() 把每个柱子绑定到它的对象，所以 update() 把现有节点移到新的顺序。看看计数器：没有任何柱子被重新创建。",
  },
  Chase: {
    title: "牵引绳索",
    note: "这张卡片是一个 scope()。每一帧移动 32 个普通的点并调用 update('chase')：Nuclo 重新计算这张卡片里的属性，页面其余部分保持不动。",
  },
  Reflex: {
    title: "变绿时点击",
    note: "一个普通字符串决定舞台显示什么。每个 when() 分支在条件成立时构建，在条件失效时移除；舞台的 class 是同一个字符串的函数。",
  },
  Warp: {
    title: "按住曲速",
    note: "onMount 启动帧循环并返回其清理函数。卸载这片星域，Nuclo 就运行该清理：循环停止，没有任何东西还在运行。",
  },
  Life: {
    title: "生命游戏",
    note: "棋盘是一个普通的年龄数组。每一拍计算下一代并调用 update()；每个格子的 class 是其年龄的函数，所以只有改变了的格子被修补。",
  },
};
