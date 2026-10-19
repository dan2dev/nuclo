// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · zero dependencies`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Nuclo से बनाइए", "*explicit*", "interfaces।"];

export const HERO_DESC =
  "छोटा सा, type-safe DOM framework। State बस एक plain variable है, जिसे आप सीधे बदल सकते हैं, और DOM तभी बदलता है जब आप कहें। न proxy, न signals, न virtual DOM।";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "Dependencies" },
  { num: "175", sup: "",   label: "Typed HTML और SVG builders" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "Core runtime, gzipped" },
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
  "State बदलने से कुछ नहीं होता। update() call कीजिए, और Nuclo ठीक वही करेगा जो आपने कहा। न कम, न ज़्यादा।";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Implicit से बेहतर है explicit",
    desc: "कोई proxy पर्दे के पीछे आपकी हर हरकत track नहीं करती। आप state बदलते हैं, फिर update() call करते हैं। Cause और effect साफ़ दिखते हैं, और behavior predictable रहता है।",
  },
  {
    num: "02",
    title: "जितने चाहें changes, update बस एक बार",
    desc: "दस changes कीजिए, फिर update() एक बार चलाइए। DOM सिर्फ़ final state देखता है, इसलिए बेकार के re-renders नहीं होते।",
  },
  {
    num: "03",
    title: "Components नहीं, बस functions",
    desc: "Plain JavaScript functions से बनाइए। Nuclo को classes, decorators या कोई special syntax नहीं चाहिए। हर function एक DOM node return करता है, और ज़रूरत पड़ने पर ही onMount और onDestroy को आम modifiers की तरह जोड़ दीजिए।",
  },
];

export const FEATURES = [
  {
    num: "01 · Explicit",
    title: "Update cycle आपके हाथ में",
    desc: "जितने चाहें changes कीजिए, फिर update() एक बार call कीजिए। न subscriptions, न schedulers, और tree diff का कोई surprise भी नहीं। DOM उसी वक़्त sync होता है जब आप तय करते हैं।",
  },
  {
    num: "02 · Lightweight",
    title: "Zero dependencies",
    desc: `Core runtime gzip के बाद करीब ${NUCLO_GZIP_KB} KB का है। न compiler चाहिए, न build plugin। बस एक import और आप शुरू।`,
  },
  {
    num: "03 · Typed",
    title: "TypeScript-first",
    desc: "175 fully typed HTML और SVG builders, हर attribute, style property और event के लिए autocomplete के साथ।",
  },
  {
    num: "04 · Precise",
    title: "DOM में सिर्फ़ वही बदलता है जो बदला",
    desc: "update() पर हर dynamic expression दोबारा evaluate होता है, और DOM को सिर्फ़ वही values छूती हैं जो सच में बदली हैं।",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Mutate",
    title: "अपना data बदलिए",
    desc: "State बस plain JavaScript है: variables, arrays, objects। जैसे चाहें, जितनी बार चाहें बदलिए।",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Apply",
    title: "update() call कीजिए",
    desc: "एक global function आपके changes apply करता है। कई changes करके सबको एक साथ apply कीजिए। जब तक आप न कहें, कुछ render नहीं होता।",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Patch",
    title: "Nuclo DOM को sync करता है",
    desc: "हर dynamic expression दोबारा चलता है, और Nuclo DOM में सिर्फ़ बदली हुई values लिखता है। न tree diff, न re-render।",
    code: `<span class="cm">// 2 nodes patch हुए,</span>
<span class="cm">// बाकी सब जैसा था वैसा</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "न diffing, न proxy, न कोई surprise।";
export const COMPARISON_SUB =
  "Nuclo UI तभी update करता है जब आप update() call करते हैं। बस इतना ही।";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "Virtual DOM",
    sub: "render → diff → apply",
    items: [
      { good: false, text: "हर state change पर पूरा component tree दोबारा render होता है" },
      { good: false, text: "changes ढूँढने के लिए पुराने और नए tree को diff करता है" },
      { good: false, text: "performance वापस पाने के लिए memoization लगानी पड़ती है" },
      { good: false, text: "stale closures और dependency arrays की गड़बड़ छोड़ जाता है" },
    ],
  },
  {
    name: "Signals और proxies",
    sub: "signals · stores · effects",
    items: [
      { good: false, text: "आपके state को proxies और subscriptions में लपेट देता है" },
      { good: false, text: "runtime पर dependencies को चुपचाप track करता है" },
      { good: false, text: "updates ऐसे समय चलते हैं जो आपके कंट्रोल में नहीं" },
      { good: false, text: "debugger में step-by-step समझना मुश्किल" },
    ],
  },
  {
    name: "Nuclo",
    sub: "mutate → update()",
    featured: true,
    items: [
      { good: true, text: "plain mutable state, बिना wrappers और proxies के" },
      { good: true, text: "बस एक update() call ही पूरा mental model है" },
      { good: true, text: "सिर्फ़ बदली हुई values को patch करता है" },
      { good: true, text: `करीब ${NUCLO_GZIP_KB} KB, zero dependencies, TypeScript-first` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "जहाँ speed मायने रखती है, वहाँ तेज़।";
export const BENCHMARK_SUB =
  "ये js-framework-benchmark के independent results हैं: हज़ारों rows को create, update, swap और remove करना।";

export const BENCHMARK_NOTE =
  "Score यानी सबसे तेज़ implementation की तुलना में कितना धीमा (duration slowdown)। ये सभी keyed benchmarks का weighted geometric mean है।";

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
export const CTA_TITLE = "तैयार हैं? शुरू करते हैं।";
export const CTA_SUB =
  "Nuclo install कीजिए, एक बार import कीजिए और ऐसा UI बनाइए जो आपके कहने पर ही update हो। पूरा API एक दोपहर में सीखा जा सकता है।";

export const QUICK_START_STEPS = [
  {
    num: "01 - Install",
    title: "Install करें",
    desc: "npm, pnpm, yarn या bun से Nuclo को अपने project में जोड़िए।",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - Import",
    title: "Import करें",
    desc: "एक side-effect import सभी 175 tag builders को globally register कर देता है।",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - Build",
    title: "Build करें",
    desc: "DOM nodes return करने वाले plain functions लिखिए। State बदले तो update() call कीजिए।",
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
  getStarted: "शुरू करें",
  viewExamples: "Examples देखें",
  copyInstall: "Install command कॉपी करें",
  howItWorks: "ये कैसे काम करता है",
  pipelineTitle: "एक साफ़, explicit cycle।",
  pipelineSub: "State पर निर्भर values, बिना dependency graph या scheduler के। वे कब चलें, ये आप तय करते हैं: data से screen तक एक predictable रास्ता।",
  philosophy: "Philosophy",
  features: "Features",
  featuresTitle: "Clarity के लिए बना।",
  featuresSub: "न कोई magic, न surprises। हर update सोच-समझकर होता है।",
  comparison: "Comparison",
  theNucloWay: "The Nuclo way",
  benchmarks: "Benchmarks",
  lowerIsBetter: "जितना कम, उतना बेहतर",
  benchmarkSource: "Source: js-framework-benchmark",
  quickStart: "Quick start",
  quickStartTitle: "कुछ ही मिनटों में up and running।",
  quickStartSub: "तीन steps में असली UI बनाना शुरू कीजिए।",
  readFullDocs: "पूरे Docs पढ़ें →",
  examples: "Examples",
  examplesTitle: "खुद चलते हुए देखिए।",
  examplesSub: "Interactive demos, और हर demo के पीछे का code भी।",
  viewAllExamples: "सारे examples देखें →",
  readTheDocs: "Docs पढ़ें",
  addATask: "Task जोड़ें…",
  add: "Add",
  reset: "Reset",
  // The hero card
  previousExample: "पिछला example",
  nextExample: "अगला example",
  closeCodeView: "Code view बंद करें",
  example: (n: number, title: string) => `Example ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "पहले रंगिए, फिर patch कीजिए",
    note: "बाईं grid बस booleans का एक plain array है: रंगने से सिर्फ़ data बदलता है। दाईं तरफ़ का DOM तभी बदलता है जब update() चले, और तब भी सिर्फ़ बदले हुए cells patch होते हैं।",
  },
  Draw: {
    title: "Logo खुद बनाइए",
    note: "Nuclo का logo एक spirograph है: एक ring के अंदर घूमता पहिया, जिस पर दो pens लगे हैं। पहिया, उसकी arms, pens और lines, सब एक number t के functions हैं। Timeline और frame loop बस t set करते हैं; update('draw') उसे पढ़ने वाले functions दोबारा चला देता है।",
  },
  Fireworks: {
    title: "आसमान पर tap कीजिए",
    note: "हर चिंगारी array में बस एक plain object है। list() हर spark को एक <line> देता है, और जिस frame में उसका object array से निकलता है, उसी frame में line हटा देता है। हर frame में एक update(), कोई tree diff नहीं।",
  },
  Waves: {
    title: "लहरों को मोड़िए",
    note: "हर path का d तीन numbers का एक plain function है। Sliders और frame loop सिर्फ़ numbers बदलते हैं; update('waves') उन्हें पढ़ने वाले functions दोबारा चला देता है।",
  },
  Sort: {
    title: "बिना दोबारा बनाए sort कीजिए",
    note: "Bubble sort plain array में objects की अदला-बदली करता है। list() हर bar को उसके object से जोड़कर रखता है, इसलिए update() मौजूदा nodes को ही नए order में खिसका देता है। counter देखिए: कोई bar दोबारा नहीं बनता।",
  },
  Chase: {
    title: "रस्सी को अपने पीछे चलाइए",
    note: "ये card एक scope() है। हर frame 32 plain points खिसकाता है और update('chase') call करता है: Nuclo सिर्फ़ इस card के attributes दोबारा evaluate करता है, बाकी पेज को हाथ भी नहीं लगाता।",
  },
  Reflex: {
    title: "हरा होते ही tap कीजिए",
    note: "एक plain string तय करती है कि stage पर क्या दिखेगा। हर when() branch condition true होने पर बनती है और false होने पर हट जाती है; stage की class भी उसी string का function है।",
  },
  Warp: {
    title: "दबाए रखिए और warp कीजिए",
    note: "onMount frame loop शुरू करता है और उसका cleanup function return करता है। Field unmount होते ही Nuclo वो cleanup चला देता है: loop रुक जाता है, और पीछे कुछ चलता नहीं रहता।",
  },
  Life: {
    title: "Game of Life",
    note: "Board उम्रों का एक plain array है। हर tick अगला array बनाता है और update() call करता है; हर cell की class उसकी age का function है, इसलिए सिर्फ़ बदले हुए cells patch होते हैं।",
  },
};
