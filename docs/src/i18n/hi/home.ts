// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · कोई बाहरी निर्भरता नहीं`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["*स्पष्ट* अपडेट वाले", "इंटरफ़ेस बनाएँ", "nuclo के साथ।"];

export const HERO_DESC =
  "एक छोटा, टाइप-सुरक्षित DOM फ़्रेमवर्क। स्टेट साधारण और परिवर्तनशील रहता है। हर अपडेट आपके नियंत्रण में है। कोई प्रॉक्सी, सिग्नल या वर्चुअल DOM नहीं।";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "निर्भरताएँ" },
  { num: "175", sup: "",   label: "टाइपयुक्त HTML और SVG बिल्डर" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzip संपीड़ित कोर रनटाइम" },
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
  "स्टेट बदलने पर कुछ नहीं होता। update() कॉल करें, और Nuclo ठीक वही करता है जो आपने कहा। न ज़्यादा, न कम।";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "अप्रत्यक्ष से बेहतर है स्पष्ट",
    desc: "कोई प्रॉक्सी आपकी हर गतिविधि को ट्रैक नहीं करती। आप स्टेट बदलते हैं, फिर update() कॉल करते हैं। कारण और परिणाम स्पष्ट और अनुमानित रहते हैं।",
  },
  {
    num: "02",
    title: "मनचाहे बदलाव करें, अपडेट एक बार",
    desc: "दस बदलाव करें, फिर update() एक बार कॉल करें। DOM को केवल अंतिम स्टेट दिखता है। कोई अनावश्यक रेंडरिंग नहीं होती।",
  },
  {
    num: "03",
    title: "कंपोनेंट के बजाय फ़ंक्शन",
    desc: "साधारण JavaScript फ़ंक्शन से बनाएँ। Nuclo को क्लास, डेकोरेटर या विशेष सिंटैक्स की ज़रूरत नहीं है। हर फ़ंक्शन DOM नोड लौटाता है। ज़रूरत होने पर ही onMount और onDestroy को सामान्य मॉडिफ़ायर के रूप में जोड़ें।",
  },
];

export const FEATURES = [
  {
    num: "01 · स्पष्ट",
    title: "अपडेट चक्र आपके नियंत्रण में है",
    desc: "मनचाहे बदलाव करें, फिर update() एक बार कॉल करें। Nuclo को सब्सक्रिप्शन या शेड्यूलर की ज़रूरत नहीं है और कोई अप्रत्याशित ट्री तुलना नहीं होती। DOM आपके तय किए समय पर सिंक होता है।",
  },
  {
    num: "02 · हल्का",
    title: "कोई बाहरी निर्भरता नहीं",
    desc: `कोर रनटाइम gzip संपीड़न के बाद लगभग ${NUCLO_GZIP_KB} KB है। कंपाइलर या बिल्ड प्लगइन की ज़रूरत नहीं है। एक import जोड़ें और बनाना शुरू करें।`,
  },
  {
    num: "03 · टाइपयुक्त",
    title: "TypeScript को ध्यान में रखकर बनाया गया",
    desc: "175 पूरी तरह टाइपयुक्त HTML और SVG बिल्डर हर एट्रिब्यूट, स्टाइल प्रॉपर्टी और इवेंट के लिए ऑटोकंप्लीट देते हैं।",
  },
  {
    num: "04 · सटीक",
    title: "सूक्ष्म पैचिंग",
    desc: "डायनेमिक एक्सप्रेशन update() पर दोबारा गणना करते हैं। केवल वास्तव में बदले हुए मान DOM को छूते हैं।",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · बदलाव",
    title: "अपना डेटा बदलें",
    desc: "स्टेट साधारण JavaScript है: वेरिएबल, ऐरे और ऑब्जेक्ट। इसे जैसे चाहें और जितनी बार चाहें बदलें।",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · लागू करें",
    title: "update() कॉल करें",
    desc: "एक ग्लोबल फ़ंक्शन आपके बदलाव लागू करता है। कई बदलाव करके उन्हें एक बार में लागू करें। आपके कहने तक कुछ भी रेंडर नहीं होता।",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · पैच",
    title: "Nuclo DOM को सिंक करता है",
    desc: "हर डायनेमिक एक्सप्रेशन की दोबारा गणना होती है। Nuclo केवल वास्तव में बदले मान DOM में लिखता है। न ट्री तुलना, न दोबारा रेंडरिंग।",
    code: `<span class="cm">// 2 नोड पैच हुए,</span>
<span class="cm">// बाकी सब जस का तस</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "न ट्री तुलना। न प्रॉक्सी। न अप्रत्याशित व्यवहार।";
export const COMPARISON_SUB =
  "Nuclo इंटरफ़ेस तभी अपडेट करता है जब आप update() कॉल करते हैं।";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "वर्चुअल DOM",
    sub: "रेंडर → तुलना → लागू करें",
    items: [
      { good: false, text: "हर स्टेट बदलाव पर कंपोनेंट ट्री दोबारा रेंडर करता है" },
      { good: false, text: "बदलाव खोजने के लिए पुराने और नए ट्री की तुलना करता है" },
      { good: false, text: "प्रदर्शन वापस पाने के लिए मेमोइज़ेशन चाहिए" },
      { good: false, text: "पुराने क्लोज़र और निर्भरता ऐरे छोड़ देता है" },
    ],
  },
  {
    name: "सिग्नल और प्रॉक्सी",
    sub: "सिग्नल · स्टोर · इफ़ेक्ट",
    items: [
      { good: false, text: "आपके स्टेट को प्रॉक्सी और सब्सक्रिप्शन में लपेटता है" },
      { good: false, text: "रनटाइम में निर्भरताओं को अदृश्य रूप से ट्रैक करता है" },
      { good: false, text: "आपके नियंत्रण से बाहर के समय पर लगातार अपडेट चलाता है" },
      { good: false, text: "डिबगर में चरण-दर-चरण समझना कठिन है" },
    ],
  },
  {
    name: "Nuclo",
    sub: "बदलाव → update()",
    featured: true,
    items: [
      { good: true, text: "बिना रैपर और प्रॉक्सी का साधारण परिवर्तनशील स्टेट" },
      { good: true, text: "एक update() कॉल ही पूरा मानसिक मॉडल है" },
      { good: true, text: "केवल बदले मानों को पैच करता है" },
      { good: true, text: `लगभग ${NUCLO_GZIP_KB} KB, कोई बाहरी निर्भरता नहीं, TypeScript केंद्रित` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "जहाँ ज़रूरी है, वहाँ तेज़।";
export const BENCHMARK_SUB =
  "ये js-framework-benchmark के स्वतंत्र परिणाम हैं: हज़ारों पंक्तियाँ बनाना, अपडेट करना, आपस में बदलना और हटाना।";

export const BENCHMARK_NOTE =
  "यह स्कोर सबसे तेज़ मापे गए कार्यान्वयन के मुकाबले लगने वाले समय का अनुपात है। यह सभी की-आधारित बेंचमार्क का भारित ज्यामितीय माध्य है।";

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
export const CTA_TITLE = "जब आप तैयार हों, शुरू करें।";
export const CTA_SUB =
  "Nuclo इंस्टॉल करें, एक बार import करें और ऐसे UI बनाएँ जो आपके कहने पर ही अपडेट हों। पूरा API एक दोपहर में सीखा जा सकता है।";

export const QUICK_START_STEPS = [
  {
    num: "01 - इंस्टॉल",
    title: "इंस्टॉल करें",
    desc: "npm, pnpm, yarn या bun से Nuclo अपने प्रोजेक्ट में जोड़ें।",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - इम्पोर्ट",
    title: "इम्पोर्ट करें",
    desc: "एक साइड-इफ़ेक्ट import सभी 175 टैग बिल्डर को ग्लोबल रूप से रजिस्टर करता है।",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - बनाएँ",
    title: "बनाएँ",
    desc: "DOM नोड लौटाने वाले साधारण फ़ंक्शन लिखें। स्टेट बदलने पर update() कॉल करें।",
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
  viewExamples: "उदाहरण देखें",
  copyInstall: "इंस्टॉल कमांड कॉपी करें",
  howItWorks: "यह कैसे काम करता है",
  pipelineTitle: "एक स्पष्ट चक्र।",
  pipelineSub: "स्टेट पर निर्भर मान, बिना निर्भरता ग्राफ़ या शेड्यूलर के। आप तय करते हैं कि वे कब चलें: डेटा से स्क्रीन तक एक अनुमानित रास्ता।",
  philosophy: "दृष्टिकोण",
  features: "विशेषताएँ",
  featuresTitle: "स्पष्टता के लिए बनाया गया।",
  featuresSub: "कोई जादू या अप्रत्याशित व्यवहार नहीं। हर अपडेट जानबूझकर होता है।",
  comparison: "तुलना",
  theNucloWay: "nuclo का तरीका",
  benchmarks: "बेंचमार्क",
  lowerIsBetter: "कम होना बेहतर है",
  benchmarkSource: "स्रोत: js-framework-benchmark",
  quickStart: "त्वरित शुरुआत",
  quickStartTitle: "कुछ मिनटों में चालू।",
  quickStartSub: "तीन चरणों में वास्तविक UI बनाना शुरू करें।",
  readFullDocs: "पूरे दस्तावेज़ पढ़ें →",
  examples: "उदाहरण",
  examplesTitle: "इसे काम करते देखें।",
  examplesSub: "इंटरैक्टिव डेमो। हर डेमो के पीछे का कोड देखें।",
  viewAllExamples: "सभी उदाहरण देखें →",
  readTheDocs: "दस्तावेज़ पढ़ें",
  addATask: "कार्य जोड़ें…",
  add: "जोड़ें",
  reset: "रीसेट",
  // The hero card
  previousExample: "पिछला उदाहरण",
  nextExample: "अगला उदाहरण",
  closeCodeView: "कोड दृश्य बंद करें",
  example: (n: number, title: string) => `उदाहरण ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "पहले रंगें, फिर पैच करें",
    note: "बाईं ग्रिड बूलियन मानों का साधारण ऐरे है: रंगना केवल डेटा बदलता है। दाईं ओर का DOM तभी बदलता है जब update() चलता है, और तब भी केवल बदले हुए सेल पैच होते हैं।",
  },
  Draw: {
    title: "चिह्न बनाएँ",
    note: "Nuclo का चिह्न एक स्पाइरोग्राफ़ है: एक छल्ले के अंदर घूमता पहिया, जिस पर दो पेन हैं। पहिया, उसकी भुजाएँ, पेन और रेखाएँ सभी एक संख्या t के फ़ंक्शन हैं। टाइमलाइन और फ़्रेम लूप केवल t सेट करते हैं; update('draw') उसे पढ़ने वाले फ़ंक्शन दोबारा चलाता है।",
  },
  Fireworks: {
    title: "आसमान पर टैप करें",
    note: "हर चिंगारी ऐरे में एक साधारण ऑब्जेक्ट है। list() हर चिंगारी को एक <line> देता है और जिस फ़्रेम में उसका ऑब्जेक्ट ऐरे से निकलता है, उसे हटा देता है। हर फ़्रेम में एक update(), कोई ट्री तुलना नहीं।",
  },
  Waves: {
    title: "लहर मोड़ें",
    note: "हर पाथ का d तीन संख्याओं का साधारण फ़ंक्शन है। स्लाइडर और फ़्रेम लूप केवल संख्याएँ बदलते हैं; update('waves') उन्हें पढ़ने वाले फ़ंक्शन दोबारा चलाता है।",
  },
  Sort: {
    title: "बिना दोबारा बनाए क्रमबद्ध करें",
    note: "बबल सॉर्ट साधारण ऐरे में ऑब्जेक्ट आपस में बदलता है। list() हर बार को उसके ऑब्जेक्ट से जोड़ता है, इसलिए update() मौजूदा नोड को नए क्रम में ले जाता है। काउंटर देखें: कोई बार दोबारा नहीं बनता।",
  },
  Chase: {
    title: "रस्सी को रास्ता दिखाएँ",
    note: "यह कार्ड एक scope() है। हर फ़्रेम 32 साधारण बिंदु खिसकाता है और update('chase') कॉल करता है: Nuclo केवल इस कार्ड के एट्रिब्यूट दोबारा गणना करता है, बाकी पेज जस का तस रहता है।",
  },
  Reflex: {
    title: "हरा होने पर टैप करें",
    note: "एक साधारण स्ट्रिंग तय करती है कि मंच पर क्या दिखे। हर when() शाखा उसकी शर्त सही होने पर बनती है और गलत होने पर हट जाती है; मंच की क्लास भी उसी स्ट्रिंग का फ़ंक्शन है।",
  },
  Warp: {
    title: "विकृत करने के लिए दबाए रखें",
    note: "onMount फ़्रेम लूप शुरू करता है और उसकी क्लीनअप फ़ंक्शन लौटाता है। फ़ील्ड अनमाउंट होने पर Nuclo वह क्लीनअप चलाता है: लूप रुक जाता है और कुछ भी चलता नहीं रहता।",
  },
  Life: {
    title: "जीवन का खेल",
    note: "बोर्ड उम्रों का साधारण ऐरे है। हर टिक अगला ऐरे गणना करता है और update() कॉल करता है; हर सेल की क्लास उसकी उम्र का फ़ंक्शन है, इसलिए केवल बदले हुए सेल पैच होते हैं।",
  },
};
