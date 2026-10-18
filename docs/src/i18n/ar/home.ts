// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · بلا أي dependencies`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["واجهات تتحدّث", "حين *تأمرها*", "مع nuclo."];

export const HERO_DESC =
  "مكتبة DOM صغيرة ومحكمة الأنواع. الـ state تبقى متغيرات عادية تعدّلها كما تشاء، وأنت وحدك من يقرر متى تظهر التغييرات. بلا proxies ولا signals ولا virtual DOM.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dependencies" },
  { num: "175", sup: "",   label: "دالة جاهزة لبناء عناصر HTML وSVG بأنواع كاملة" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "حجم النواة بعد gzip" },
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
  "غيّر الـ state وسيبقى كل شيء ساكنًا. استدعِ update() وسيفعل Nuclo ما طلبته منه، حرفيًا: لا أكثر ولا أقل.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "الصراحة تغلب السحر الخفي",
    desc: "لا proxies تتجسس على كل حركة. تعدّل الـ state ثم تستدعي update()، فيبقى السبب والنتيجة أمام عينيك دائمًا.",
  },
  {
    num: "02",
    title: "عدّل كما تشاء، وحدّث مرة واحدة",
    desc: "أجرِ عشرة تعديلات ثم استدعِ update() مرة واحدة. لا يرى الـ DOM إلا الحالة النهائية، فلا يضيع render واحد بلا داعٍ.",
  },
  {
    num: "03",
    title: "دوال عادية بدل components",
    desc: "ابنِ بدوال JavaScript عادية؛ لا classes ولا decorators ولا صياغة خاصة. كل دالة تُرجع عقد DOM، وما تحتاجه من onMount وonDestroy تضيفه كأي modifier آخر، وقت الحاجة فقط.",
  },
];

export const FEATURES = [
  {
    num: "01 · صريح",
    title: "دورة التحديث بيدك",
    desc: "عدّل بحرية ثم استدعِ update() مرة واحدة. لا subscriptions ولا schedulers ولا diffing يباغتك؛ والـ DOM يتزامن حين تقرر أنت.",
  },
  {
    num: "02 · خفيف",
    title: "صفر dependencies",
    desc: `النواة نحو ${NUCLO_GZIP_KB} كيلوبايت بعد gzip. لا compiler ولا build plugins: سطر import واحد وتبدأ.`,
  },
  {
    num: "03 · أنواع محكمة",
    title: "TypeScript أولًا",
    desc: "175 دالة لبناء HTML وSVG بأنواع كاملة، تمنحك autocomplete لكل attribute وخاصية style وحدث.",
  },
  {
    num: "04 · دقيق",
    title: "لا يلمس الـ DOM إلا ما تغيّر",
    desc: "تُعاد قراءة التعبيرات الديناميكية عند update()، ولا يُكتب في الـ DOM إلا ما تغيّرت قيمته فعلًا.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · عدّل",
    title: "عدّل بياناتك",
    desc: "الـ state مجرد JavaScript عادي: متغيرات ومصفوفات وكائنات. عدّلها كما تشاء وكم مرة تشاء.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · أنفِذ",
    title: "استدعِ update()",
    desc: "دالة عامة واحدة تُنفذ تعديلاتك. اجمع عشرات التعديلات ثم أنفِذها دفعة واحدة؛ ولن يُرسم شيء قبل أن تأمر.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · حدّث",
    title: "Nuclo يزامن الـ DOM",
    desc: "يُعاد تقييم كل تعبير ديناميكي، ولا يكتب Nuclo في الـ DOM إلا القيم التي تغيّرت فعلًا. لا diffing ولا re-render.",
    code: `<span class="cm">// تحدّثت عقدتان،</span>
<span class="cm">// وبقي الباقي على حاله</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "بلا diffing. بلا proxies. بلا مفاجآت.";
export const COMPARISON_SUB =
  "لا تتغير الواجهة إلا حين تستدعي update().";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "Virtual DOM",
    sub: "render ← diff ← patch",
    items: [
      { good: false, text: "يعيد render لشجرة الـ components عند كل تغيّر في الـ state" },
      { good: false, text: "يقارن الشجرة القديمة بالجديدة ليعرف ما تغيّر" },
      { good: false, text: "يضطرك إلى memoization لتستعيد الأداء" },
      { good: false, text: "يوقعك في closures بقيم قديمة وفي مصفوفات dependencies" },
    ],
  },
  {
    name: "Signals وProxies",
    sub: "signals · stores · effects",
    items: [
      { good: false, text: "يلفّ الـ state في proxies وsubscriptions" },
      { good: false, text: "يتتبع الـ dependencies في الخفاء أثناء التشغيل" },
      { good: false, text: "يطلق تحديثات متسلسلة بجدول لا سيطرة لك عليه" },
      { good: false, text: "يصعب تتبعه خطوة بخطوة في الـ debugger" },
    ],
  },
  {
    name: "Nuclo",
    sub: "عدّل ← update()",
    featured: true,
    items: [
      { good: true, text: "state عادية قابلة للتعديل، بلا wrappers ولا proxies" },
      { good: true, text: "استدعاء update() واحد هو النموذج الذهني كله" },
      { good: true, text: "لا يكتب إلا القيم التي تغيّرت" },
      { good: true, text: `نحو ${NUCLO_GZIP_KB} كيلوبايت، بلا dependencies، وبُني لـ TypeScript` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "سريع حيث يهمّ السريع.";
export const BENCHMARK_SUB =
  "أرقام مستقلة من js-framework-benchmark: إنشاء آلاف الصفوف وتحديثها وتبديلها وحذفها.";

export const BENCHMARK_NOTE =
  "الرقم هو نسبة زمن التنفيذ إلى أسرع تنفيذ قيس، وهو المتوسط الهندسي المرجّح لجميع اختبارات keyed.";

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
export const CTA_TITLE = "ابدأ متى شئت.";
export const CTA_SUB =
  "ثبّت Nuclo، واستورده مرة واحدة، وابنِ واجهات لا تتحدّث إلا حين تطلب. الـ API كله يُتقن في عصر يوم واحد.";

export const QUICK_START_STEPS = [
  {
    num: "01 - التثبيت",
    title: "ثبّت",
    desc: "أضف Nuclo إلى مشروعك عبر npm أو pnpm أو yarn أو bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - الاستيراد",
    title: "استورد",
    desc: "سطر import واحد (بأثر جانبي) يسجّل دوال بناء الوسوم الـ 175 كلها في النطاق العام.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - البناء",
    title: "ابنِ",
    desc: "اكتب دوالًا عادية تُرجع عقد DOM، واستدعِ update() كلما تغيّرت الـ state.",
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
  getStarted: "ابدأ الآن",
  viewExamples: "تصفّح الأمثلة",
  copyInstall: "نسخ أمر التثبيت",
  howItWorks: "كيف يعمل",
  pipelineTitle: "دورة واحدة، وكل شيء معلن.",
  pipelineSub: "قيم تعتمد على الـ state، بلا dependency graph ولا scheduler. أنت من يحدد متى تُعاد: مسار واحد متوقع من بياناتك إلى الشاشة.",
  philosophy: "الفلسفة",
  features: "المزايا",
  featuresTitle: "مبني على الوضوح.",
  featuresSub: "لا سحر ولا مفاجآت. كل تحديث وراءه قرار.",
  comparison: "مقارنة",
  theNucloWay: "طريقة nuclo",
  benchmarks: "Benchmarks",
  lowerIsBetter: "الأقل هو الأفضل",
  benchmarkSource: "المصدر: js-framework-benchmark",
  quickStart: "البدء السريع",
  quickStartTitle: "جاهز للانطلاق في دقائق.",
  quickStartSub: "ثلاث خطوات وتكون قد بدأت بناء واجهات حقيقية.",
  readFullDocs: "اقرأ التوثيق الكامل →",
  examples: "الأمثلة",
  examplesTitle: "شاهده وهو يعمل.",
  examplesSub: "عروض تفاعلية، وكود كل عرض متاح لتتصفحه.",
  viewAllExamples: "كل الأمثلة →",
  readTheDocs: "اقرأ التوثيق",
  addATask: "أضف مهمة…",
  add: "إضافة",
  reset: "تصفير",
  // The hero card
  previousExample: "المثال السابق",
  nextExample: "المثال التالي",
  closeCodeView: "إخفاء الكود",
  example: (n: number, title: string) => `المثال ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "ارسم، ثم حدّث",
    note: "الشبكة على اليسار مجرد مصفوفة من القيم المنطقية، والرسم عليها تعديل للبيانات لا أكثر. أما الـ DOM على اليمين فلا يتحرك إلا حين تستدعي update()، وحينها لا تتغير سوى الخلايا التي تغيّرت.",
  },
  Draw: {
    title: "شعار يرسم نفسه",
    note: "شعار Nuclo رسمة سبيروغراف: عجلة تدور داخل حلقة وتحمل قلمين. العجلة والأذرع والقلمان والخطوط كلها دوال لقيمة واحدة هي t. الـ timeline وحلقة الإطارات لا يغيّران سوى t، ثم يعيد update('draw') تشغيل كل ما يقرؤها.",
  },
  Fireworks: {
    title: "المس السماء",
    note: "كل شرارة كائن عادي في مصفوفة. تعطي list() كل شرارة عنصر <line>، وتزيله في الإطار الذي يخرج فيه كائنها من المصفوفة. استدعاء update() واحد لكل إطار، بلا diffing.",
  },
  Waves: {
    title: "موّج الخطوط",
    note: "قيمة d لكل مسار دالة عادية لثلاثة أرقام. أشرطة التمرير وحلقة الإطارات لا تغيّر غير هذه الأرقام، ثم يعيد update('waves') تشغيل الدوال التي تقرؤها.",
  },
  Sort: {
    title: "فرز بلا إعادة بناء",
    note: "خوارزمية الفرز الفقاعي تبدّل الكائنات داخل مصفوفة عادية. تربط list() كل عمود بكائنه، فينقل update() العقد الموجودة إلى ترتيبها الجديد. راقب العدّاد: لا يُنشأ أي عمود من جديد.",
  },
  Chase: {
    title: "اجرِ خلف الحبل",
    note: "البطاقة هنا scope(). في كل إطار تتحرك 32 نقطة عادية ثم يُستدعى update('chase')، فيعيد Nuclo حساب سمات هذه البطاقة وحدها ويترك بقية الصفحة وشأنها.",
  },
  Reflex: {
    title: "اضغط حين يخضرّ",
    note: "نص عادي واحد يحدد ما يعرضه المشهد. يُبنى كل فرع when() لحظة يتحقق شرطه ويُزال حين يزول، وclass الـ CSS الخاص بالمشهد دالة للنص نفسه.",
  },
  Warp: {
    title: "اضغط مطوّلًا لتلتوي",
    note: "يبدأ onMount حلقة الإطارات ويُرجع دالة تنظيفها. وحين يُزال الحقل من الصفحة ينفذ Nuclo هذه الدالة، فتتوقف الحلقة ولا يبقى شيء يعمل في الخلفية.",
  },
  Life: {
    title: "لعبة الحياة",
    note: "اللوحة مصفوفة عادية من الأعمار. كل نبضة تحسب المصفوفة التالية وتستدعي update()، وclass الـ CSS لكل خلية دالة لعمرها، فلا تتغير إلا الخلايا التي تغيّرت.",
  },
};
