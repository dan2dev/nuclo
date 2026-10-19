// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · 零依赖`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["用 nuclo 构建", "*显式*更新的", "界面。"];

export const HERO_DESC =
  "轻巧、类型安全的 DOM 框架。状态就是普通的可变数据，每一次更新都由你亲手触发。没有 Proxy，没有信号，没有虚拟 DOM。";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "运行时依赖" },
  { num: "175", sup: "",   label: "类型安全的 HTML 与 SVG 构建函数" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "核心运行时，gzip 后" },
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
  "改状态，页面纹丝不动。直到你调用 update()，Nuclo 才动手，只做你交代的事，不多也不少。";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "显式优于隐式",
    desc: "没有 Proxy 在背后偷偷盯着状态。你改数据，再调用 update()，什么时候发生什么，一目了然。",
  },
  {
    num: "02",
    title: "改十次，刷新一次",
    desc: "连改十次，只需调用一次 update()。DOM 直接到位，中间那些多余的 render 一概省掉。",
  },
  {
    num: "03",
    title: "函数，不是组件",
    desc: "写的就是普通 JavaScript 函数，不用类，不用装饰器，也没有特殊语法，每个函数返回的就是 DOM 节点。onMount 和 onDestroy 只是普通的 modifier，用得上再加。",
  },
];

export const FEATURES = [
  {
    num: "01 · 显式",
    title: "更新节奏，你说了算",
    desc: "想怎么改就怎么改，最后调用一次 update()。没有订阅，没有调度器，也没有暗中进行的 diff。DOM 在你决定的那一刻同步。",
  },
  {
    num: "02 · 轻量",
    title: "零依赖",
    desc: `核心运行时 gzip 后只有约 ${NUCLO_GZIP_KB} KB。不需要编译器，也不需要构建插件，一行 import 就能开工。`,
  },
  {
    num: "03 · 类型安全",
    title: "TypeScript 优先",
    desc: "175 个带完整类型的 HTML 与 SVG 构建函数，属性、样式和事件都有自动补全。",
  },
  {
    num: "04 · 精确",
    title: "只动该动的 DOM",
    desc: "update() 时，动态表达式会重新求值，只有真正变了的值才会写进 DOM。",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · 修改",
    title: "改变你的数据",
    desc: "状态就是普通的 JavaScript：变量、数组、对象，想怎么改就怎么改，改几次都行。",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · 提交",
    title: "调用 update()",
    desc: "一个全局函数，把改动一次性应用到界面。哪怕攒了十几处修改，也只需调用一次；在此之前，DOM 不会有任何反应。",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · 更新",
    title: "Nuclo 同步 DOM",
    desc: "所有动态表达式重新求值，Nuclo 只把真正变化的值写入 DOM。没有 diff，没有重新 render。",
    code: `<span class="cm">// 只改了 2 个节点，</span>
<span class="cm">// 其余一切未被触碰</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "没有 diff，没有 Proxy，没有意外。";
export const COMPARISON_SUB =
  "界面只在你调用 update() 时才会更新。";

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
      { good: false, text: "状态一变，整棵组件树重新 render" },
      { good: false, text: "新旧两棵树逐个比对，才能找出差异" },
      { good: false, text: "还得靠 memo 之类的优化把性能补回来" },
      { good: false, text: "要和过期闭包、依赖数组纠缠不清" },
    ],
  },
  {
    name: "Signal 与 Proxy",
    sub: "signal · store · effect",
    items: [
      { good: false, text: "状态被层层包进 Proxy 和订阅里" },
      { good: false, text: "运行时偷偷追踪依赖关系" },
      { good: false, text: "更新一环扣一环，时机不由你定" },
      { good: false, text: "断点调试时很难一步步跟下来" },
    ],
  },
  {
    name: "Nuclo",
    sub: "修改 → update()",
    featured: true,
    items: [
      { good: true, text: "普通的可变状态，不包装，不代理" },
      { good: true, text: "一个 update()，就是全部心智模型" },
      { good: true, text: "只更新真正变化的值" },
      { good: true, text: `约 ${NUCLO_GZIP_KB} KB，零依赖，TypeScript 优先` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "关键之处，足够快。";
export const BENCHMARK_SUB =
  "数据来自 js-framework-benchmark 的独立测试：涵盖创建、更新、交换和清空数千行。";

export const BENCHMARK_NOTE =
  "分数是相对于最快实现的耗时倍数，取所有 keyed 基准的加权几何平均值。";

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
export const CTA_TITLE = "准备好了，就开始吧。";
export const CTA_SUB =
  "安装 Nuclo，import 一次，就能写出只在你指定时刻更新的 UI。整套 API，一个下午就能学完。";

export const QUICK_START_STEPS = [
  {
    num: "01 - 安装",
    title: "安装",
    desc: "用 npm、pnpm、yarn 或 bun 把 Nuclo 加进项目。",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - 导入",
    title: "导入",
    desc: "一条 side-effect import，全部 175 个标签构建函数就注册到全局了。",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - 构建",
    title: "构建",
    desc: "写几个返回 DOM 节点的普通函数，状态变了，就调用 update()。",
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
  pipelineTitle: "一个显式的更新循环。",
  pipelineSub: "依赖状态的值写成函数就行，没有依赖图，也没有调度器。何时运行，由你决定。数据到屏幕，只有一条看得见的路。",
  philosophy: "理念",
  features: "特性",
  featuresTitle: "一切清清楚楚。",
  featuresSub: "没有黑魔法，没有意外，每一次更新都是你有意为之。",
  comparison: "对比",
  theNucloWay: "Nuclo 的做法",
  benchmarks: "基准测试",
  lowerIsBetter: "越低越好",
  benchmarkSource: "来源：js-framework-benchmark",
  quickStart: "快速开始",
  quickStartTitle: "几分钟就能上手。",
  quickStartSub: "三步，就能开始写 UI。",
  readFullDocs: "阅读完整文档 →",
  examples: "示例",
  examplesTitle: "亲手试试看。",
  examplesSub: "可以直接操作的演示，每一个都附带源码。",
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
    title: "先涂，再更新",
    note: "左边的网格只是一个布尔数组，涂抹只改数组本身。右边的 DOM 要等到调用 update() 才会更新，而且只更新变了的格子。",
  },
  Draw: {
    title: "画出 Logo",
    note: "Nuclo 的 Logo 其实是个万花尺（spirograph）：一个轮子在圆环里滚动，轮上带着两支笔。轮子、连杆、笔尖和轨迹，全是同一个数 t 的函数。时间轴和帧循环只负责设置 t，update('draw') 重新运行读取它的那部分。",
  },
  Fireworks: {
    title: "点亮夜空",
    note: "每颗火花都是数组里的一个普通对象。list() 给每颗火花配一条 <line>，对象一离开数组，那条线在同一帧就被移除。每帧只调用一次 update()，没有任何 diff。",
  },
  Waves: {
    title: "拨动波浪",
    note: "每条 path 的 d 都只是三个数的函数。滑块和帧循环只改这三个数，update('waves') 再重新运行读取它们的函数。",
  },
  Sort: {
    title: "排序，但绝不重建",
    note: "冒泡排序在普通数组里交换对象。list() 把每根柱子绑定到它的对象上，所以 update() 只是按新顺序移动现有节点。盯着计数器看：没有一根柱子被重新创建。",
  },
  Chase: {
    title: "牵着绳子走",
    note: "这张卡片是一个 scope()。每一帧移动 32 个普通的点，然后调用 update('chase')：Nuclo 只重新计算这张卡片里的属性，页面其他部分原封不动。",
  },
  Reflex: {
    title: "变绿就点",
    note: "一个普通字符串决定显示区域里是什么。每个 when() 分支在条件成立时构建、失效时移除，显示区域的 class 则是同一个字符串的函数。",
  },
  Warp: {
    title: "按住，跃迁",
    note: "onMount 启动帧循环，并返回它的清理函数。星空一旦卸载，Nuclo 就会调用清理函数，把循环停掉。",
  },
  Life: {
    title: "生命游戏",
    note: "棋盘就是一个记录年龄的数组。每一拍算出下一代，再调用 update()。每个格子的 class 是它年龄的函数，所以只有变了的格子才会更新。",
  },
};
