// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · بلا اعتماديات خارجية`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["ابنِ واجهات", "بتحديثات *صريحة*", "باستخدام nuclo."];

export const HERO_DESC =
  "إطار DOM صغير وآمن من حيث الأنواع. تظل الحالة عادية وقابلة للتغيير. أنت تتحكم في كل تحديث. بلا بروكسيات أو إشارات أو DOM افتراضي.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "اعتماديات" },
  { num: "175", sup: "",   label: "دالة لبناء HTML وSVG مع تعريفات أنواع" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "النواة مضغوطة بـ gzip" },
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
  "عندما تغيّر الحالة، لا يحدث شيء. استدعِ update()، وسينفذ Nuclo ما طلبته بالضبط، لا أكثر ولا أقل.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "الصريح أفضل من الضمني",
    desc: "لا توجد بروكسيات تتعقب كل تحركاتك. تغيّر الحالة ثم تستدعي update(). تظل العلاقة بين السبب والنتيجة واضحة ومتوقعة.",
  },
  {
    num: "02",
    title: "غيّر بحرية، وحدّث مرة واحدة",
    desc: "أجرِ عشرة تغييرات ثم استدعِ update() مرة واحدة. لا يرى DOM سوى الحالة النهائية، فتتجنب عمليات التصيير غير الضرورية.",
  },
  {
    num: "03",
    title: "دوال بدلًا من مكوّنات",
    desc: "ابنِ باستخدام دوال JavaScript عادية. لا يحتاج Nuclo إلى أصناف أو مزخرفات أو صياغة خاصة. تُرجع كل دالة عقد DOM. أضف onMount وonDestroy كمعدّلات عادية عند الحاجة فقط.",
  },
];

export const FEATURES = [
  {
    num: "01 · صريح",
    title: "أنت تتحكم في دورة التحديث",
    desc: "غيّر بحرية ثم استدعِ update() مرة واحدة. لا يحتاج Nuclo إلى اشتراكات أو مجدولات، ولا يفاجئك بمقارنة أشجار. تُزامَن شجرة DOM عندما تقرر أنت.",
  },
  {
    num: "02 · خفيف",
    title: "بلا اعتماديات خارجية",
    desc: `تبلغ النواة نحو ${NUCLO_GZIP_KB} كيلوبايت بعد ضغط gzip. لا يحتاج Nuclo إلى مصرّف أو إضافات بناء. أضف استيرادًا واحدًا وابدأ البناء.`,
  },
  {
    num: "03 · محدد الأنواع",
    title: "مصمم لـ TypeScript",
    desc: "يوفر 175 دالة لبناء HTML وSVG بأنواع مكتملة تدعم الإكمال التلقائي لكل سمة وخاصية تنسيق وحدث.",
  },
  {
    num: "04 · دقيق",
    title: "تحديث الأجزاء المتغيرة من DOM",
    desc: "تُعاد حسابات التعبيرات الديناميكية عند update(). لا تُعدّل في DOM إلا القيم التي تغيرت بالفعل.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · غيّر",
    title: "غيّر بياناتك",
    desc: "الحالة متغيرات وكائنات JavaScript عادية: متغيرات ومصفوفات وكائنات. غيّرها كما تشاء وبالقدر الذي تريده.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · طبّق",
    title: "استدعِ update()",
    desc: "تُطبّق دالة عامة واحدة تغييراتك. اجمع عدة تغييرات ثم طبّقها مرة واحدة. لا يُعرض شيء حتى تطلب ذلك.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · عدّل",
    title: "يزامن Nuclo شجرة DOM",
    desc: "يُعاد حساب كل تعبير ديناميكي. يكتب Nuclo في DOM القيم التي تغيرت بالفعل فقط. بلا مقارنة أشجار أو إعادة عرض.",
    code: `<span class="cm">// عُدّلت عقدتان،</span>
<span class="cm">// وبقي كل شيء آخر كما هو</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "بلا مقارنة أشجار. بلا بروكسيات. بلا مفاجآت.";
export const COMPARISON_SUB =
  "يحدّث Nuclo الواجهة فقط عندما تستدعي update().";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "DOM افتراضي",
    sub: "عرض → مقارنة → تطبيق",
    items: [
      { good: false, text: "يعيد عرض أشجار المكوّنات عند كل تغيير في الحالة" },
      { good: false, text: "يقارن الشجرتين القديمة والجديدة لتحديد التغييرات" },
      { good: false, text: "يحتاج إلى حفظ نتائج الحساب مؤقتًا (memoization) لاستعادة الأداء" },
      { good: false, text: "يعرّضك لإغلاقات تحتفظ بقيم قديمة ومصفوفات اعتماديات" },
    ],
  },
  {
    name: "الإشارات والبروكسيات",
    sub: "إشارات · مخازن · تأثيرات",
    items: [
      { good: false, text: "يغلّف الحالة ببروكسيات واشتراكات" },
      { good: false, text: "يتعقب الاعتماديات بصورة خفية أثناء التشغيل" },
      { good: false, text: "يطلق تحديثات متتالية وفق جدول لا تتحكم فيه" },
      { good: false, text: "يصعب تتبّعه خطوة بخطوة في مصحح الأخطاء" },
    ],
  },
  {
    name: "Nuclo",
    sub: "تغيير → update()",
    featured: true,
    items: [
      { good: true, text: "حالة عادية قابلة للتغيير بلا أغلفة أو بروكسيات" },
      { good: true, text: "استدعاء update() واحد هو النموذج الذهني بأكمله" },
      { good: true, text: "يعدّل القيم التي تغيرت فقط" },
      { good: true, text: `نحو ${NUCLO_GZIP_KB} كيلوبايت، بلا اعتماديات، ومصمم لـ TypeScript` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "سريع حيث تهم السرعة.";
export const BENCHMARK_SUB =
  "هذه نتائج مستقلة من js-framework-benchmark لإنشاء آلاف الصفوف وتحديثها وتبديلها وحذفها.";

export const BENCHMARK_NOTE =
  "تعبّر هذه النتيجة عن نسبة زمن التنفيذ إلى أسرع تنفيذ جرى قياسه. وهي المتوسط الهندسي المرجّح لجميع الاختبارات ذات المفاتيح.";

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
export const CTA_TITLE = "ابدأ عندما تكون جاهزًا.";
export const CTA_SUB =
  "ثبّت Nuclo، واستورده مرة واحدة، وابنِ واجهات تُحدَّث عندما تطلب بالضبط. يمكنك تعلّم API بالكامل في بضع ساعات.";

export const QUICK_START_STEPS = [
  {
    num: "01 - التثبيت",
    title: "ثبّت",
    desc: "أضف Nuclo إلى مشروعك باستخدام npm أو pnpm أو yarn أو bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - الاستيراد",
    title: "استورد",
    desc: "يسجّل استيراد واحد ذو أثر جانبي جميع دوال بناء الوسوم البالغ عددها 175 في النطاق العام.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - البناء",
    title: "ابنِ",
    desc: "اكتب دوال عادية تُرجع عقد DOM. استدعِ update() عندما تتغير الحالة.",
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
  viewExamples: "شاهد الأمثلة",
  copyInstall: "نسخ أمر التثبيت",
  howItWorks: "كيف يعمل",
  pipelineTitle: "دورة واحدة صريحة.",
  pipelineSub: "قيم تعتمد على الحالة، بلا رسم بياني للاعتماديات أو مجدول. أنت تحدد وقت تشغيلها: مسار واحد متوقع من بياناتك إلى الشاشة.",
  philosophy: "الفلسفة",
  features: "المزايا",
  featuresTitle: "مصمم للوضوح.",
  featuresSub: "بلا سحر أو مفاجآت. كل تحديث مقصود.",
  comparison: "مقارنة",
  theNucloWay: "نهج nuclo",
  benchmarks: "اختبارات الأداء",
  lowerIsBetter: "الأقل أفضل",
  benchmarkSource: "المصدر: js-framework-benchmark",
  quickStart: "البدء السريع",
  quickStartTitle: "ابدأ التشغيل خلال دقائق.",
  quickStartSub: "ثلاث خطوات وتبدأ ببناء واجهات فعلية.",
  readFullDocs: "اقرأ التوثيق الكامل →",
  examples: "الأمثلة",
  examplesTitle: "شاهده أثناء العمل.",
  examplesSub: "عروض تفاعلية. استكشف الكود الخاص بـ كل عرض.",
  viewAllExamples: "شاهد جميع الأمثلة →",
  readTheDocs: "اقرأ التوثيق",
  addATask: "أضف مهمة…",
  add: "إضافة",
  reset: "إعادة ضبط",
  // The hero card
  previousExample: "المثال السابق",
  nextExample: "المثال التالي",
  closeCodeView: "إغلاق عرض الكود",
  example: (n: number, title: string) => `المثال ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "ارسم ثم عدّل",
    note: "الشبكة اليسرى مصفوفة عادية من القيم المنطقية؛ الرسم عليها ليس إلا تغييرًا للبيانات. لا يتحرك DOM على اليمين إلا عند تشغيل update()، وعندها لا تُعدّل إلا الخلايا التي تغيرت.",
  },
  Draw: {
    title: "ارسم الشعار",
    note: "شعار Nuclo رسم سبيروغراف: عجلة تدور داخل حلقة وتحمل قلمين. العجلة وأذرعها والقلمان والخطوط كلها دوال لعدد واحد هو t. يضبط الخط الزمني وحلقة الإطارات قيمة t فقط؛ ويعيد update('draw') تشغيل ما يقرأها.",
  },
  Fireworks: {
    title: "انقر السماء",
    note: "كل شرارة كائن عادي في مصفوفة. تمنح list() كل شرارة عنصر <line>، وتحذفه في الإطار الذي يغادر فيه كائنها المصفوفة. استدعاء update() واحد لكل إطار، بلا مقارنة أشجار.",
  },
  Waves: {
    title: "اثنِ الموجة",
    note: "قيمة d لكل مسار دالة عادية لثلاثة أعداد. لا تغيّر أشرطة التمرير وحلقة الإطارات إلا هذه الأعداد؛ ويعيد update('waves') تشغيل الدوال التي تقرأها.",
  },
  Sort: {
    title: "ترتيب بلا إعادة بناء",
    note: "تبدّل خوارزمية الفرز الفقاعي الكائنات في مصفوفة عادية. تربط list() كل عمود بكائنه، لذا ينقل update() العقد الموجودة إلى الترتيب الجديد. راقب العدّاد: لا يُعاد إنشاء أي عمود.",
  },
  Chase: {
    title: "حرّك الحبل",
    note: "البطاقة هي scope(). ينقل كل إطار 32 نقطة عادية ويستدعي update('chase'): يعيد Nuclo حساب سمات هذه البطاقة ويترك بقية الصفحة كما هي.",
  },
  Reflex: {
    title: "انقر عند ظهور الأخضر",
    note: "تحدد سلسلة نصية عادية واحدة ما يعرضه المشهد. يُبنى كل فرع when() عندما يتحقق شرطه ويُزال عندما لا يعود متحققًا؛ وصنف CSS الخاص بالمشهد دالة للسلسلة نفسها.",
  },
  Warp: {
    title: "اضغط مطولًا للتشويه",
    note: "يبدأ onMount حلقة الإطارات ويُرجع دالة تنظيفها. عند إلغاء تركيب الحقل، ينفذ Nuclo هذه الدالة: تتوقف الحلقة ولا يبقى شيء قيد التشغيل.",
  },
  Life: {
    title: "لعبة الحياة",
    note: "اللوحة مصفوفة عادية من الأعمار. تحسب كل نبضة المصفوفة التالية وتستدعي update()؛ وصنف CSS الخاص بكل خلية دالة لعمرها، لذا لا تُعدّل إلا الخلايا التي تغيرت.",
  },
};
