import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "مقدمة",
    sections: [
      {
        id: "overview",
        title: "نظرة عامة",
        content: `
      <p>Nuclo مكتبة DOM صغيرة لـ TypeScript. تبني صفحتك بدوال عادية مثل <code>div()</code> و<code>button()</code>، وتحتفظ بالـ state في متغيرات عادية، وتستدعي <code>update()</code> في اللحظة التي تريد أن تتغير فيها الصفحة.</p>
      <p>لا virtual DOM هنا، ولا compiler، ولا proxies، ولا signals.</p>
      <p><strong>الحالة: ألفا.</strong> لم يصل Nuclo إلى الإصدار 1.0 بعد، لذلك قد تتغير الـ API بين إصدار وآخر. حدّد الإصدار الذي تستخدمه بدقة، واختبر تطبيقك قبل الترقية.</p>
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
      <h3>كيف تفكّر في Nuclo</h3>
      <ol>
        <li>ابنِ الواجهة بدوال بناء الوسوم.</li>
        <li>مرّر دالة بدل القيمة حيثما كانت القيمة تعتمد على الـ state.</li>
        <li>عدّل الـ state بـ JavaScript عادي.</li>
        <li>استدعِ <code>update()</code>، فيعيد Nuclo تشغيل تلك الدوال ويحدّث الـ DOM بما تغيّر.</li>
      </ol>
      <p>تعديل المتغير لا يمسّ الـ DOM. الصفحة لا تتغير إلا حين تستدعي <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "البدء السريع",
        content: `
      <p>أسرع بداية هي <code>create-nuclo</code>: يولّد لك مشروع Vite وTypeScript جاهزًا بـ Nuclo:</p>
    `,
        afterContent: `
      <p>سيسألك عن اسم المشروع. وإن أردت تخطي الأسئلة فمرّر الاسم مع الـ flags. مع npm ضع <code>--</code> قبل الـ flags:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>ثم ثبّت الحزم وشغّل خادم التطوير:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>الخيارات</h3>
      <ul>
        <li><code>[project-name]</code>: المجلد الذي سيُنشأ فيه المشروع، والافتراضي <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: القالب المطلوب. المتاح اليوم <code>basic</code> فقط.</li>
        <li><code>-y, --yes</code>: بلا أسئلة، مع استخدام القيم الافتراضية.</li>
        <li><code>-f, --force</code>: الكتابة داخل مجلد غير فارغ.</li>
        <li><code>-h, --help</code>: عرض المساعدة.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "التثبيت والاستيراد",
        content: `
      <p>لإضافة Nuclo إلى مشروع قائم:</p>
      ${sh("npm install nuclo")}
      <p>أو استخدم <code>pnpm add nuclo</code> أو <code>yarn add nuclo</code> أو <code>bun add nuclo</code>. وNuclo لا يعتمد على أي dependencies.</p>
      <p>الـ routing ليس جزءًا من الحزمة الأساسية، بل يأتي في حزمة منفصلة اسمها <a href="#router-overview"><code>nuclo-router</code></a>، تثبّتها بجانب <code>nuclo</code> متى احتجت إليها.</p>
      <h3>الأسماء العامة (globals)</h3>
      <p>سطر <code>import 'nuclo'</code> يضع هذه الأسماء على <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 دالة لبناء الوسوم</strong>: 112 لـ HTML (<code>div</code>، <code>span</code>، <code>button</code>، ...) و63 لـ SVG، بلاحقة <code>Svg</code> (<code>svgSvg</code>، <code>pathSvg</code>، ...). راجع <a href="#tag-builders">دوال بناء الوسوم</a>.</li>
        <li><strong>16 دالة مساعدة (helpers)</strong>: <code>update</code>، <code>scope</code>، <code>when</code>، <code>list</code>، <code>region</code>، <code>into</code>، <code>on</code>، <code>render</code>، <code>hydrate</code>، <code>forceUpdate</code>، <code>css</code>، <code>cx</code>، <code>createCss</code>، <code>variants</code>، <code>keyframes</code> و<code>globalStyle</code>.</li>
      </ul>
      <p>يجب أن يُنفَّذ هذا الاستيراد قبل أي كود يستدعي دالة بناء. وحدات ES تُنفَّذ بترتيب الاستيراد، ولذلك يفشل المثال التالي:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>اجعل <code>import 'nuclo'</code> أول سطر في ملف الدخول، أو استورده في كل ملف يستخدم هذه الأسماء العامة.</p>
      <h3>الاستيراد بالاسم (named imports)</h3>
      <p>الـ helpers متاحة أيضًا كـ named exports، وهي الدوال نفسها المسجّلة عامًا. أما <code>getCssText()</code> و<code>resetStyles()</code> فمتاحتان بالاسم فقط. وأما دوال بناء الوسوم فعامة فقط، لذا لن يعمل <code>import { div } from 'nuclo'</code>.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>نقاط الدخول (entry points)</h3>
      <ul>
        <li><code>nuclo</code>: يسجّل الأسماء العامة ويصدّر الـ helpers الستة عشر مع <code>getCssText</code> و<code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>، <code>renderManyToString</code>، <code>renderToStringWithContainer</code> و<code>getCssText</code>. راجع <a href="#api-ssr">الـ SSR</a>.</li>
        <li><code>nuclo/polyfill</code>: DOM مصغّر يعمل في Node وBun. انظر <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: تعريفات الأنواع فقط. انظر <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>تعريفات الأنواع مضمّنة في Nuclo، ولا تحتاج إلا إلى أمرين:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> و<code>nodenext</code> غير مدعومين حتى الآن.</li>
        <li>مكتبة <code>DOM</code>. يضمّنها TypeScript تلقائيًا ما دمت لم تضبط <code>lib</code>.</li>
      </ul>
      <p>إذا استورد أي ملف في المشروع <code>'nuclo'</code> فسيرى كل ملف الأنواع العامة، ولا شيء آخر مطلوب. أما إذا لم يستورده أي ملف، كأن يكون لديك tsconfig منفصل للاختبارات، فأضف الأنواع بنفسك:</p>
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
      <p>أو ضع <code>/// &lt;reference types="nuclo/types" /&gt;</code> في ملف <code>.d.ts</code>.</p>
      <h3>أنواع مفيدة</h3>
      <p>هذه الأنواع عامة، فتستخدمها بلا استيراد:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: نوع القيمة التي تُرجعها دالة بناء الوسوم. استخدمه نوعَ إرجاع للـ component.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: كل ما تقبله دالة بناء الوسوم كوسيط.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: نوع القيمة التي تُرجعها <code>render()</code> و<code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: أي اسم وسم HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: كائن الـ attributes الذي تقبله دالة بناء الوسوم، بما فيه معالجات <code>on*</code> و<code>onMount</code> و<code>onDestroy</code>. يفيدك في components تمرّر الـ attributes إلى عنصر داخلي.</li>
        <li><code>MountCallback</code> و<code>DestroyCallback</code>: معالجات <code>onMount</code> و<code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>، <code>ListModifier</code>: نوعا القيمتين اللتين تُرجعهما <code>when()</code> و<code>list()</code>.</li>
        <li><code>RegionOptions</code>، <code>RegionType</code>: الخيارات التي تقبلها <code>region()</code>.</li>
        <li><code>StyleResult</code>، <code>Style</code>، <code>ThemeConfig</code>، <code>CssInstance</code> وسائر أنواع التنسيق. ويمكنك استيرادها أيضًا: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p>يجعل <code>ExpandedElement&lt;Tag&gt;</code> كل عضو من أعضاء الـ DOM اختياريًا. إن احتجت نوع العنصر الكامل فاستخدم type assertion: <code>render(App, root) as HTMLDivElement</code>.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "بناء الواجهة",
    sections: [
      {
        id: "tag-builders",
        title: "دوال بناء الوسوم",
        content: `
      <p>لكل وسم HTML دالة عامة تحمل اسمه: <code>div</code>، <code>span</code>، <code>input</code>، ... والاستثناء الوحيد <code>&lt;var&gt;</code> الذي صار <code>var_</code> لأن <code>var</code> كلمة محجوزة. وكل وسم SVG له دالة تنتهي باللاحقة <code>Svg</code>: <code>svgSvg</code>، <code>pathSvg</code>، <code>circleSvg</code>، ...</p>
      <p>استدعاء دالة بناء الوسوم لا ينشئ عنصرًا في الحال. فـ <code>div('Hi')</code> تُرجع <strong>دالة بناء</strong>، أي دالة تنشئ العنصر لاحقًا. ويستدعيها Nuclo حين تضعها في الصفحة بـ <code>render()</code>، أو داخل دالة بناء أخرى أو <code>when()</code> أو <code>list()</code>. وكل استخدام ينتج عنصرًا جديدًا.</p>
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
      <h3>الوسائط (arguments)</h3>
      <p>تقبل دالة البناء أي عدد من الوسائط وتطبّقها من اليسار إلى اليمين:</p>
      <ul>
        <li><strong>string، number، bigint</strong>: تصير عقدة نصية.</li>
        <li><strong><code>() =&gt; value</code></strong>: نص يتغير مع كل <code>update()</code>. راجع <a href="#dynamic-functions">القيم الديناميكية</a>.</li>
        <li><strong><code>null</code>، <code>undefined</code></strong>: يُتجاهل.</li>
        <li><strong><code>true</code>، <code>false</code></strong>: تُعرض كنص "true" أو "false". استخدم <code>when()</code> للشروط.</li>
        <li><strong>كائن عادي</strong>: attributes. راجع <a href="#attributes">الـ attributes</a>.</li>
        <li><strong>نتيجة <code>css()</code> أو <code>cx()</code> أو <code>variants()</code></strong>: تضيف classes الخاصة بها.</li>
        <li><strong><code>on(...)</code></strong>: event listener أو hook من hooks دورة الحياة.</li>
        <li><strong>دالة بناء أخرى، أو <code>when()</code> أو <code>list()</code></strong>: عنصر فرعي (child).</li>
        <li><strong>عقدة DOM من نوع <code>Node</code></strong>: تُلحق كما هي.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: modifier مخصص. انظر أدناه.</li>
      </ul>
      <h3>مطبّات شائعة</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> يعرض النص "false". اكتب بدلًا منه <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>المصفوفة ليست child بذاتها، فانشر عناصرها بـ spread: <code>ul(...names.map((n) =&gt; li(n)))</code>. أما القوائم المتغيرة فاستخدم لها <code>list()</code>.</li>
        <li>أي متغير محلي يحمل اسم وسم يحجب دالة البناء. داخل <code>function Row(label: string)</code> لن تستطيع استدعاء <code>label(...)</code>. فتجنّب تسمية المتغيرات المحلية <code>label</code>، <code>title</code>، <code>data</code>، <code>p</code>، <code>a</code> و<code>i</code>.</li>
        <li>المتصفحات تكشف كل عنصر له <code>id</code> كمتغير عام. فإن كانت الصفحة تحوي <code>&lt;main id="main"&gt;</code> قبل تحميل Nuclo، فلن يستبدل Nuclo هذا المتغير، ولذلك سيرمي <code>main(...)</code> خطأ <code>TypeError</code>. اختر معرّفات أخرى.</li>
      </ul>
      <h3>Modifiers مخصصة</h3>
      <p>الدالة التي تعلن معاملًا واحدًا على الأقل تُنفَّذ مرة واحدة أثناء إنشاء العنصر، بترتيب الوسائط. أول وسيط لها هو العنصر نفسه، والثاني فهرس داخلي لا تعتمد عليه. فإن أعادت نصًا أو رقمًا صار نصًا في الصفحة، وإن أعادت <code>Node</code> أُلحقت العقدة، وإن أعادت كائنًا طُبّق كـ attributes.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>الوصول إلى العنصر</h3>
      <p>الدالة <code>render()</code> تُرجع العنصر الجذر. وداخل الشجرة استخدم <code>on("mount", (el) =&gt; …)</code> أو modifier مخصصًا. ويمكنك كذلك استدعاء دالة البناء بنفسك لتحصل على عنصر منفصل:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>أرفقه بالمستند قبل <code>update()</code> التالي؛ فالعقدة التي لا تكون في المستند وقت تشغيل <code>update()</code> تتوقف عن التحديث نهائيًا.</p>
      <h3>SVG</h3>
      <p>دوال بناء SVG تقبل الوسائط نفسها. ويضبط Nuclo كل attribute في SVG عبر <code>setAttribute</code>، فتعمل أسماء مثل <code>"stroke-width"</code> كما هي.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>قائمة كل دوال البناء</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "المكوّنات (Components)",
        content: `
      <p>الـ component دالة عادية تُرجع دالة بناء مثل <code>button(...)</code>. لا يوجد API خاص بالـ components، ولا يُنشأ شيء حتى تعرضه بـ render أو تضعه في شجرة.</p>
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
      <p>الـ state المعرّفة داخل الدالة تخص ذلك الـ instance وحده، أما المعرّفة خارجها فتتشاركها كل الـ instances. واستدعاء <code>forceUpdate()</code> يعيد تنفيذ الـ components، فتُهيَّأ من جديد الـ state المعرّفة بداخلها.</p>
      <p>الـ children ليست سوى وسائط عادية:</p>
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
        title: "السمات (Attributes)",
        content: `
      <p>مرّر كائنًا عاديًا لضبط الـ attributes، ويمكنك تمرير أكثر من كائن. إن تكرر المفتاح فالقيمة الأحدث تغلب، ما عدا <code>className</code> و<code>style</code> فيُدمجان. والقيمة إما ثابتة أو دالة بلا معاملات تُعاد عند كل <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>كيف تُضبط القيمة</h3>
      <ul>
        <li>إن كان لعنصر HTML خاصية (property) بهذا الاسم (<code>value</code>، <code>checked</code>، <code>disabled</code>، <code>htmlFor</code>، <code>tabIndex</code>، ...)، يعيّن Nuclo الخاصية. وإلا فإنه يستدعي <code>setAttribute(key, String(value))</code>، على سبيل المثال <code>"aria-*"</code> و<code>"data-*"</code>.</li>
        <li>في عناصر SVG، يستدعي Nuclo دائمًا <code>setAttribute</code>.</li>
        <li>تُتجاهل <code>null</code> و<code>undefined</code>. والقيمة الديناميكية التي تُرجع إحداهما تُبقي القيمة القديمة كما هي. ولمسح قيمة أرجِع <code>""</code>، أو <code>false</code> إن كانت الخاصية منطقية.</li>
        <li>تعمل القيم المنطقية مع خصائص DOM المنطقية، مثل <code>disabled</code> في الأزرار و<code>checked</code> و<code>hidden</code> و<code>required</code>. وفي غير ذلك، تُكتب <code>true</code> و<code>false</code> كسلسلتين نصيتين "true" و"false".</li>
        <li>استخدم مفاتيح <code>"data-*"</code> مباشرة؛ فـ <code>dataset</code> غير مدعوم.</li>
        <li>لا يُهرَّب محتوى <code>innerHTML</code> (escaping)، ولا يظهر في مخرجات الـ SSR. الأفضل ألا تستخدمه.</li>
      </ul>
      <h3>أسماء الـ classes</h3>
      <p>استخدم <code>className</code>. تُدمج الـ classes الثابتة مع نتائج <code>css()</code> ومع <code>className</code> الديناميكية، والديناميكية منها لا تمسّ الثابتة؛ فإذا أرجعت <code>""</code> بقيت الثابتة وحدها.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>لا تستخدم المفتاح <code>class</code> على عناصر HTML؛ فهو يضبط الـ attribute الخام ويستبدل كل class طُبّق قبله، ومنها classes الخاصة بـ <code>css()</code>.</p>
      <h3>التنسيق المضمّن (inline styles)</h3>
      <p>يقبل <code>style</code> كائنًا بمفاتيح camelCase، أو دالة تُرجع كائنًا كهذا.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo لا يضيف وحدات من عنده، فاكتب <code>"12px"</code> لا <code>12</code>. أما الخصائص بلا وحدة مثل <code>opacity</code> و<code>zIndex</code> فتقبل الأرقام.</li>
        <li>القيم <code>""</code> و<code>null</code> و<code>undefined</code> تمسح الخاصية.</li>
        <li>التنسيق الديناميكي يضبط المفاتيح التي يُرجعها فقط، والمفتاح الذي يتوقف عن الظهور يحتفظ بقيمته القديمة، فأرجِع <code>""</code> إن أردت مسحه.</li>
        <li>نصوص التنسيق (<code>"color: red"</code>) والخصائص المخصصة (<code>"--gap"</code>) غير مدعومة، فاستخدم <code>css()</code> بدلًا منها، فهو يقبل الخصائص المخصصة عبر <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "الأحداث",
        content: `
      <p>للاستماع إلى الأحداث طريقتان: attributes من نوع <code>on*</code>، أو الـ modifier المسمّى <code>on()</code>.</p>
      <h3>الـ attributes من نوع <code>on*</code></h3>
      <p>داخل كائن الـ attributes، الدالة التي تقع تحت مفتاح مثل <code>onClick</code> (<code>on</code> يتبعها حرف كبير) تُعدّ event handler لا قيمة ديناميكية.</p>
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
        <li>يستنتج TypeScript نوع الحدث من المفتاح والعنصر، و<code>e.currentTarget</code> و<code>this</code> كلاهما يشير إلى العنصر.</li>
        <li>يضبط Nuclo الخاصية الأصلية، فيصير <code>onClick</code> هو <code>el.onclick</code>. لكل حدث معالج واحد فقط: <code>onClick</code> الأحدث يحل محل السابق.</li>
        <li>كل من <code>onDoubleClick</code> و<code>onDblClick</code> يعني <code>dblclick</code>. أما المفاتيح بأحرف صغيرة مثل <code>onclick</code> فتُظهر خطأ في الأنواع.</li>
        <li>أي اسم ليس حدثًا معروفًا يستمع إلى صيغته بالأحرف الصغيرة: <code>onMyEvent</code> يستمع إلى <code>"myevent"</code>.</li>
        <li>الاستثناءات التي يرميها المعالج لا تُلتقط.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p>تُرجع <code>on()</code> modifier يستدعي <code>addEventListener</code> على العنصر.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>كل <code>on()</code> يضيف listener مستقلًا، وتُنفَّذ كلها بالترتيب.</li>
        <li>الـ <code>options</code> تُمرَّر كما هي إلى <code>addEventListener</code>: <code>capture</code>، <code>once</code>، <code>passive</code>، <code>signal</code>.</li>
        <li>مرّر <code>on()</code> مباشرة إلى دالة البناء ويُستنتج نوع العنصر: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>إن رمى listener استثناءً سجّل Nuclo الخطأ بـ <code>console.error</code> وواصل تنفيذ البقية.</li>
        <li>يزيل Nuclo الـ listener حين يزيل العنصر. وعلى الخادم لا يفعل <code>on()</code> شيئًا.</li>
        <li>يمكنك استخدام قيمة <code>on()</code> الواحدة نفسها على عدة عناصر.</li>
      </ul>
      <p>للأحداث المخصصة مرّر نوع الحدث كـ generic:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>أيهما أختار؟</h3>
      <p>الـ attributes من نوع <code>on*</code> تكفي في الحالات المعتادة. واستخدم <code>on()</code> حين تحتاج أكثر من listener لحدث واحد، أو خيارات للـ listener، أو اسم حدث مخصصًا مثل <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "دورة الحياة",
        content: `
      <p>يُنفَّذ <code>onMount</code> مرة واحدة بعد إدراج العنصر في الصفحة، ويُنفَّذ <code>onDestroy</code> مرة واحدة حين يزيله Nuclo. اكتبهما كـ attributes أو عبر <code>on()</code>؛ الصيغتان متكافئتان، ونوع العنصر يُستنتج من وسمه.</p>
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
      <h3>متى تُنفَّذ؟</h3>
      <ul>
        <li>يُنفَّذ <code>onMount</code> في نهاية استدعاء <code>render()</code> أو <code>hydrate()</code> أو <code>update()</code> أو <code>forceUpdate()</code> الذي أدرج العنصر، ولا يُنفَّذ أبدًا أثناء بناء الشجرة.</li>
        <li>إذا أرجع <code>onMount</code> دالة، فستُنفَّذ عند الإزالة، بعد دوال <code>onDestroy</code> الخاصة بالعنصر.</li>
        <li>يُنفَّذ <code>onDestroy</code> حين يزيل Nuclo العنصر: إذا أُزيل صف من <code>list()</code>، أو بدّله فرع في <code>when()</code>، أو غادر <code>into()</code> منطقته، أو أسقطه <code>forceUpdate()</code>. ويحدث ذلك قبل الإزالة مباشرة، فيبقى العنصر في المستند.</li>
      </ul>
      <h3>إزالة عناصر الـ DOM يدويًا</h3>
      <p>إن أزلت عنصرًا بنفسك عبر <code>node.remove()</code> أو <code>innerHTML = ''</code>، فلن يُنفَّذ <code>onDestroy</code> ولا دوال التنظيف أبدًا، وستبقى المؤقتات تعمل. ولا توجد في Nuclo دالة <code>unmount()</code>. وإن أردت إنهاء تطبيق مع تنظيفه كاملًا فضعه داخل <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>الترتيب والأخطاء</h3>
      <ul>
        <li>يمكنك تسجيل أي عدد من الـ hooks بأي من الشكلين، وتُنفَّذ بترتيب تسجيلها.</li>
        <li>تُنفَّذ hooks <code>onDestroy</code> للعناصر الفرعية أولًا، ثم للعنصر الأب.</li>
        <li>تُنفَّذ hooks <code>onMount</code> للعناصر بحسب ترتيب أول hook لكل عنصر، أي ترتيب الوسائط، وتُنفَّذ كل hooks العنصر الواحد معًا. فإن كانت الـ children تعتمد على الأب فمرّر hook الأب قبلها.</li>
        <li>إذا رمى hook استثناءً، يُسجَّل الخطأ باستخدام <code>console.error</code> ويستمر تنفيذ الـ hooks الأخرى.</li>
        <li>يجب ألا تُرجع الدالة شيئًا، أو أن تُرجع دالة تنظيف، فلا تجعلها <code>async</code>؛ إذ لا يُعامل الـ promise المُرجَع كدالة تنظيف أبدًا. ابدأ العمل غير المتزامن من داخلها: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>لا تُنفَّذ الـ hooks على الخادم مطلقًا. وعلى العميل تُنفَّذ بعد <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>ملاحظة:</strong> الـ hooks ليست effects. لا تُعاد عند تغيّر الـ state، وكل hook يُنفَّذ مرة واحدة على الأكثر لكل عنصر.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "التحديثات",
    sections: [
      {
        id: "explicit-updates",
        title: "التحديثات الصريحة",
        content: `
      <p>Nuclo لا يحدّث الصفحة من تلقاء نفسه أبدًا. عدّل الـ state ثم استدعِ <code>update()</code>.</p>
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
      <p>عدّل الـ state كما تشاء، ثم استدعِ <code>update()</code> مرة واحدة:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>استدعِ <code>update()</code> من معالجات الأحداث، أو المؤقتات، أو callbacks الخاصة بـ fetch، أو <code>onMount</code>. لكن لا تستدعها من داخل دالة قيمة ديناميكية.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "القيم الديناميكية",
        content: `
      <p>الدالة التي <strong>لا تقبل معاملات</strong> هي <strong>قيمة ديناميكية</strong>. ينفّذها Nuclo مرة عند بناء العنصر، ثم عند كل <code>update()</code>. استخدمها للنصوص وقيم الـ attributes و<code>style</code> و<code>className</code>. أما الـ children التي تظهر وتختفي وتتكرر فاستخدم لها <a href="#api-when"><code>when()</code></a> و<a href="#api-list"><code>list()</code></a>.</p>
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
      <p>يتحقق Nuclo من عدد المعاملات (<code>fn.length</code>). الدالة التي تعرّف معاملًا هي <a href="#tag-builders">modifier مخصص</a> وتُنفَّذ مرة واحدة فقط. تبلغ قيمة length للدالتين <code>(x = 0) =&gt; …</code> و<code>(...args) =&gt; …</code> 0، لذا فهما ديناميكيان.</p>
      <h3>النص الديناميكي</h3>
      <ul>
        <li>النص والرقم وbigint والقيمة المنطقية تُعرض كـ <code>String(value)</code>. فالدالة <code>() =&gt; ok &amp;&amp; 'Saved'</code> تعرض "false"، لذا اكتب <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li>تُعرض <code>null</code> و<code>undefined</code> كنص فارغ.</li>
        <li>إذا أعادت الدالة نتيجة <code>css()</code> أو <code>cx()</code> عند أول تشغيل، عُوملت كمصدر class ديناميكي بدل أن تكون نصًا. انظر <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>العقدة أو دالة البناء أو المصفوفة أو الكائن العادي لا تعرض شيئًا ولا تتحدّث أبدًا.</li>
      </ul>
      <h3>الـ attributes الديناميكية</h3>
      <ul>
        <li>لا يكتب Nuclo القيمة إلا إذا اختلفت عن آخر قيمة كتبها هو. فهو لا يقارنها بالـ DOM الحي، ولهذا إذا كتب المستخدم في حقل إدخال وأرجعت دالتك القيمة السابقة نفسها، بقي ما كتبه المستخدم كما هو.</li>
        <li>النتيجة <code>null</code> أو <code>undefined</code> لا تكتب شيئًا، فتبقى القيمة القديمة. و<code>className</code> استثناء: أي قيمة falsy تزيل الـ classes الديناميكية وتُبقي الثابتة.</li>
        <li>دالة <code>style</code> تطبّق الكائن الذي تُرجعه في كل تحديث.</li>
      </ul>
      <h3>الأخطاء</h3>
      <p>إذا رمت دالة قيمة ديناميكية استثناءً، يلتقط Nuclo الخطأ ويكمل بقية التحديث. يصير النص فارغًا أو يحتفظ بقيمته السابقة، وتحتفظ الـ attribute بقيمتها السابقة، ويعود كلاهما للعمل عند أول <code>update()</code> ناجح. والاستثناء الوحيد دالة النص التي ترمي عند تشغيلها <strong>لأول مرة</strong>، فيبقى نصها فارغًا إلى الأبد.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>تُجري مرورًا متزامنًا واحدًا على كل قيمة ديناميكية في الصفحة. وإذا مرّرت معرّفات فهي تحدّث فقط ما بداخل العناصر الموسومة بتلك المعرّفات عبر <a href="#api-scope"><code>scope()</code></a>. وكل مرور ينفّذ الخطوات التالية بالترتيب:</p>
      <ol>
        <li><code>list()</code>: يعيد قراءة العناصر ويضيف الصفوف أو ينقلها أو يزيلها.</li>
        <li><code>when()</code>: يعيد فحص الشروط، ولا يُعاد بناء الفرع إلا إذا صار فرع مختلف هو النشط.</li>
        <li>الـ attributes الديناميكية، ومنها <code>style</code> و<code>className</code>.</li>
        <li>النص الديناميكي.</li>
        <li><code>onMount</code> للعناصر التي أُدرجت في الخطوتين 1 و2.</li>
      </ol>
      <ul>
        <li><strong>تُنفَّذ كل الدوال.</strong> كل قيمة ديناميكية تُشغَّل في كل استدعاء حتى لو لم تتغير بياناتها؛ الذي يُتخطّى هو الكتابة في الـ DOM فقط. فاجعل القيم الديناميكية سريعة وخالية من الآثار الجانبية.</li>
        <li><strong>العقد الموجودة في المستند فقط.</strong> إذا لم تكن العقدة في المستند وقت تشغيل <code>update()</code> توقف Nuclo عن تتبعها وتحديثها نهائيًا، حتى لو أُلحقت بعد ذلك. وينطبق هذا على <code>list()</code> و<code>when()</code> أيضًا، لذا اعرض (render) داخل حاوية موجودة في المستند.</li>
        <li><strong>القيم الثابتة لا تتغير أبدًا.</strong> النصوص الثابتة وقيم الـ attributes تُحدَّد عند إنشاء العنصر. ولإعادة بنائها استخدم <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>الأخطاء.</strong> أخطاء النصوص والـ attributes تُلتقط ويكمل التحديث. وإذا رمى شرط <code>when()</code> استثناءً سُجّل الخطأ وتوقف ذلك <code>when()</code> عن التحديث. أما إذا رمت دالة <code>items</code> أو <code>renderItem</code> في <code>list()</code> فيخرج الخطأ من <code>update()</code> ولا تُنفَّذ الخطوات المتبقية.</li>
        <li><strong>على الخادم.</strong> <code>update()</code> لا تفعل شيئًا على الخادم.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>تمنح العنصر الذي تمرّره إليها معرّف scope واحدًا أو أكثر. بعدها لا يحدّث <code>update('id')</code> إلا ذلك العنصر ومحتواه، بما في ذلك attributes العنصر نفسه.</p>
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
        <li>يمكن أن يحمل العنصر عدة معرّفات: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> يحدّث كل ما داخل <code>a</code> أو <code>b</code>. وإذا استخدمت عدة عناصر المعرّف نفسه فكلها تتحدّث.</li>
        <li>مع الـ scopes المتداخلة، <code>update('outer')</code> يشمل الداخلي، أما <code>update('inner')</code> فلا يلمس الخارجي.</li>
        <li>إذا لم يحمل أي عنصر في المستند المعرّف المطلوب، فلن يُحدَّث <strong>أي شيء</strong> ولن يظهر خطأ، لذا تحقّق من كتابة المعرّف.</li>
        <li><code>scope()</code> لا تفعل شيئًا على الخادم.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>تعرض المحتوى بحسب شرط. يعيد Nuclo فحص الشروط عند كل <code>update()</code>، وأول شرط يتحقق هو الفائز. وإن لم يتحقق أي شرط عُرض محتوى <code>.else()</code>، وإن لم يوجد <code>.else()</code> فلا يُعرض شيء.</p>
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
      <h3>الشروط</h3>
      <ul>
        <li>مرّر دالة كشرط. القيمة المنطقية المجردة تُقرأ مرة واحدة فقط، فـ <code>when(open, …)</code> لا يتغير أبدًا.</li>
        <li>في TypeScript يجب أن تُرجع الدالة قيمة منطقية. اكتب <code>() =&gt; items.length &gt; 0</code> أو <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>ما الذي يُحدَّث؟</h3>
      <ul>
        <li>ما دام الفرع نفسه نشطًا تبقى عناصره كما هي، وتواصل القيم الديناميكية وقوائم <code>list()</code> وكتل <code>when()</code> بداخله التحديث.</li>
        <li>عندما يصبح فرع آخر هو النشط يُزال المحتوى القديم وتُنفَّذ hooks <code>onDestroy</code> الخاصة به، ثم يُبنى الفرع الجديد من الصفر وتُنفَّذ hooks <code>onMount</code> الخاصة به. وتضيع الـ state الموجودة في العناصر القديمة، مثل نص حقل الإدخال أو الـ focus.</li>
      </ul>
      <h3>محتوى الفرع</h3>
      <p>ضع الـ children داخل الفرع: نصًا، أو نصًا ديناميكيًا، أو دوال بناء، أو <code>list()</code> و<code>when()</code> متداخلة. مرّر دوال بناء العقد مثل <code>p('Hi')</code> لا عقد DOM جاهزة؛ فعقدة DOM الجاهزة تتوقف عن التحديث بعد أن يُخفى فرعها مرة واحدة.</p>
      <p>كائنات الـ attributes وقيم <code>on()</code> الموجودة داخل الفرع تُطبَّق على العنصر الأب، وتبقى حتى بعد إخفاء الفرع. ولضبط attribute بشرط معيّن استخدم attribute ديناميكية: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>ربط الشروط</h3>
      <p>كل من <code>.when()</code> و<code>.else()</code> تُرجع دالة بناء جديدة ولا تعدّل الأصلية. وإذا استدعيت <code>.else()</code> مرتين فالاستدعاء الأخير هو المعتمد.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>تعرض صفًا واحدًا لكل عنصر. عند كل <code>update()</code> يعيد Nuclo استدعاء <code>items()</code> ويطابق العناصر الجديدة بالصفوف الموجودة بحسب الهوية (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>كيف تُطابَق الصفوف</h3>
      <ul>
        <li>العنصر الذي ما زال موجودًا يحتفظ بصفه، وينقله Nuclo إلى موضعه إن لزم دون أن يستدعي <code>renderItem</code> من جديد.</li>
        <li>العنصر الجديد يحصل على صف جديد، والعنصر المحذوف يفقد صفه وتُنفَّذ hooks <code>onDestroy</code> الخاصة به.</li>
        <li>كل ظهور مكرر لنفس العنصر له صفه الخاص.</li>
        <li>يمكنك تعديل المصفوفة نفسها (<code>push</code>، <code>splice</code>، <code>sort</code>) أو إرجاع مصفوفة جديدة.</li>
      </ul>
      <p>الصف المحتفَظ به لا يُعاد بناؤه أبدًا، فاستخدم قيمًا ديناميكية للحقول التي تتغير:</p>
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
      <p>النسخ عناصر جديدة، لذا فاستبدال المصفوفة بـ <code>todos.map((t) =&gt; ({ ...t }))</code> يعيد بناء كل الصفوف.</p>
    `,
        afterContent: `
      <h3>ما تُرجعه <code>renderItem</code></h3>
      <ul>
        <li>أرجِع عنصرًا واحدًا، مثل <code>li(...)</code> أو <code>tr(...)</code> أو دالة بناء SVG، وأرجِع <code>null</code> أو <code>undefined</code> لتخطي عنصر. أما النصوص والعقد النصية والـ fragments فلا تُعرض.</li>
        <li>لا تُرجع <code>when()</code> أو <code>list()</code> مباشرة، بل ضعهما داخل عنصر الصف: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>لإخفاء عناصر معيّنة، صفِّها في <code>items()</code> لا في <code>renderItem</code>.</li>
        <li>اجعل <code>renderItem</code> خاليًا من الآثار الجانبية، فقد يستدعيه Nuclo أكثر من مرة للعنصر نفسه.</li>
      </ul>
      <h3>الفهرس</h3>
      <p>قيمة <code>index</code> هي موضع العنصر وقت إنشاء صفه، ولا تتحدّث حين تُنقل الصفوف. وللموضع الحالي استخدم قيمة ديناميكية: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>الـ iterables</h3>
      <p>يصلح أي iterable: المصفوفات، و<code>Set</code>، والـ generators، و<code>map.values()</code>. ويمكنك إرجاع المصفوفة أو الـ <code>Set</code> نفسها في كل مرة. أما الـ iterator مثل generator أو <code>map.values()</code> فيُستهلك بمرور واحد، لذا أنشئه داخل <code>items()</code> في كل استدعاء. وتكرار <code>Map</code> مباشرة ينتج مصفوفات <code>[key, value]</code> جديدة كل مرة فتُعاد بناء كل الصفوف، فاستخدم <code>map.values()</code> بدلًا منه.</p>
      <h3>موضع الصفوف</h3>
      <p>تظهر الصفوف في موضع <code>list()</code> بين العناصر المجاورة، بين علامتي تعليق، ولا تُمسّ بقية children العنصر الأب. وتعمل <code>list()</code> داخل دوال بناء SVG أيضًا.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() وinto()",
        content: `
      <p>تمثل <code>region()</code> مكانًا مسمّى في الشجرة، وتملؤه <code>into()</code> من أي موضع آخر وبأي عمق. فلا يحتاج الـ layout إلى استقبال المحتوى كـ prop، ولا يحتاج الـ component الذي يبني المحتوى إلى معرفة وجهته.</p>
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
      <h3>كيف تعمل</h3>
      <ul>
        <li><code>into()</code> لا يترك سوى تعليق في موضعه، ويُعرض محتواه بين علامتي المنطقة.</li>
        <li>ترتيب البناء لا يهم. فإذا بُني <code>into()</code> قبل منطقته انتظر، وظهر فور بناء المنطقة. وتظهر المحتويات بترتيب تعريفها.</li>
        <li>يبقى المحتوى ما دام <code>into()</code> الذي يحمله موجودًا. فإذا أُغلق <code>when()</code> الذي يحوي <code>into()</code>، أو أُزيل صف <code>list()</code> الذي يحويه، غادر المحتوى المنطقة. وعند فتحه من جديد تُضاف نسخة واحدة لا نسختان.</li>
        <li>عندما تختفي منطقة، كأن يُغلق <code>when()</code> الذي يحويها، يعود محتواها إلى الانتظار، وتعرضه أي منطقة تُنشأ لاحقًا بالمعرّف نفسه.</li>
        <li>إذا لم يطابق معرّف <code>into()</code> أي منطقة فلا يُعرض شيء ولا يظهر خطأ، فتحقق من الإملاء.</li>
        <li>المعرّفات فريدة في الشجرة، وإنشاء منطقة ثانية بمعرّف منطقة ما زالت موجودة يسجّل تحذيرًا.</li>
        <li>تعمل المناطق مع <a href="#api-ssr">الـ SSR</a>. وفي <code>hydrate()</code> يعيد كل محتوى استخدام HTML القادم من الخادم بدل إنشائه من جديد.</li>
      </ul>
      <h3>الخيارات</h3>
      <ul>
        <li><code>id</code>: الاسم الذي تستخدمه استدعاءات <code>into()</code> للوصول إلى المنطقة.</li>
        <li><code>type</code>: القيمة <code>'latest'</code> (الافتراضية) تعرض أحدث محتوى فقط، و<code>'stack'</code> تعرضها كلها بترتيب وصولها.</li>
        <li><code>empty</code>: المحتوى الذي يُعرض حين تكون المنطقة فارغة.</li>
      </ul>
      <h3>المناطق المكدّسة (stack)</h3>
      <p>مع <code>type: 'stack'</code> لا يؤدي فتح محتوى فوق آخر إلى إعادة بناء الذي تحته، فتبقى عناصر الـ DOM والـ focus وحالة النموذج كما هي. وهذا مناسب لطبقة تعلو الصفحة مثل نافذة حوار (dialog).</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>ملء عدة مناطق دفعة واحدة</h3>
      <p>مرّر كائنًا لتملأ أكثر من منطقة بـ <code>into()</code> واحد. القيمة قد تكون child واحدًا أو مجموعة children. والصيغتان تتداخلان: فـ <code>into()</code> الموجود داخل محتوى <code>into()</code> آخر يستهدف منطقته هو.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>فتح dialog من أعماق الشجرة</h3>
      <p>منطقة الـ overlay تقع عند الجذر، وأي component في أي عمق يستطيع فتح dialog بلفّ <code>into()</code> داخل <code>when()</code>. وعندما يُغلق <code>when()</code> يُزال الـ dialog من المنطقة.</p>
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
      <h3>إشعارات toast من صفوف القائمة</h3>
      <p>كل صف في <code>list()</code> يملأ المنطقة بمحتوى. والمنطقة المكدّسة تعرض الإشعارات بالترتيب، وحذف عنصر من المصفوفة يزيل إشعاره.</p>
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
      <h3>صفحة تحدد عنوانها بنفسها</h3>
      <p>مع <code>type: 'latest'</code> الافتراضي يفوز أحدث محتوى. الـ layout يحدد مكان العنوان، والصفحة المفتوحة تحدد نصه. وإن خلت صفحة من <code>into('title', …)</code> بقي نص <code>empty</code> ظاهرًا.</p>
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
      <h3>قيم ديناميكية داخل المحتوى</h3>
      <p>محتوى <code>into()</code> هو محتوى Nuclo عادي. فالدوال بداخله قيم تعتمد على الـ state وتتحدّث عند <code>update()</code> أينما وُجدت المنطقة.</p>
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
      <h3>منطقة تظهر وتختفي</h3>
      <p>يُعرَّف <code>into()</code> الخاص بلوحة المعلومات مرة واحدة. وما دام المستخدم لم يسجّل الدخول فلا توجد منطقة <code>main</code>، فينتظر المحتوى. عند تسجيل الدخول تُنشأ المنطقة ويظهر المحتوى، وعند تسجيل الخروج تُزال المنطقة ويعود المحتوى إلى الانتظار.</p>
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
      <h3>محتوى له منطقته الخاصة</h3>
      <p>قد يحوي المحتوى <code>region()</code> تستهدفها محتويات أخرى. هنا تحوي صفحة المحرر منطقة <code>tabs</code> تملؤها التبويبات، وعند إغلاق المحرر تُزال منطقته معه.</p>
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
      <h3>مثال حي</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p>الدالة <code>update()</code> تعيد تشغيل القيم الديناميكية فقط، أما القيم الثابتة مثل نص <code>h1(labels[lang].title)</code> فتُحسم عند بناء الشجرة. أما <code>forceUpdate()</code> فتعيد استدعاء الـ components وتعدّل شجرة الـ DOM الفعلية لتطابق الناتج، بما فيه القيم الثابتة. استخدمها للتغييرات النادرة على مستوى التطبيق كله، مثل تبديل اللغة، واستخدم <code>update()</code> في كل ما عدا ذلك.</p>
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
      <p>من دون وسائط، تعيد <code>forceUpdate()</code> بناء كل جذر عُرض بـ <code>render(App)</code> أو <code>hydrate(App)</code>، وتتخطى الجذور التي عُرضت بـ <code>render(App())</code>. وإذا رمى أحد الـ components استثناءً سُجّل الخطأ واحتفظ الجذر بشجرة الـ DOM السابقة. وكذلك يُسجَّل أي خطأ يقع أثناء تطبيق البنية الجديدة، مع بقاء ما طُبّق منها قبل الخطأ.</p>
      <h3>ما الذي يبقى وما الذي يتغير</h3>
      <ul>
        <li>تُطابَق الـ children بالترتيب بحسب الوسم. يُعاد استخدام العنصر المطابق، فيبقى الـ focus والنص المكتوب في الحقول، ولا تُنفَّذ hooks <code>onMount</code> الخاصة به مرة أخرى. وبمجرد أن يختلف وسم child واحد يُبنى هو وكل ما بعده من جديد.</li>
        <li>النصوص والـ attributes والـ classes والـ styles والـ listeners وفروع <code>when()</code> وصفوف <code>list()</code> كلها تتبع البنية الجديدة.</li>
        <li>تُنشأ العناصر الجديدة وتُنفَّذ hooks <code>onMount</code> الخاصة بها، أما العناصر التي لم يعد البناء الجديد ينتجها فتُزال وتُنفَّذ hooks <code>onDestroy</code> الخاصة بها.</li>
        <li>تُطابَق صفوف <code>list()</code> بحسب الموضع هنا، لا بحسب العنصر، فقد يظهر في الصف المُعاد استخدامه عنصر مختلف.</li>
        <li>الـ attributes التي لم تعد البنية الجديدة تضبطها لا تُزال.</li>
      </ul>
      <div class="docs-callout"><strong>انتبه:</strong> الـ state المعرّفة داخل دالة الـ component تُعاد تهيئتها لأن الدالة تعمل مرة أخرى. فاجعل الـ state التي يجب أن تبقى خارج الـ component.</div>
      <p><strong>الصيغة الصريحة.</strong> <code>forceUpdate(App(), parent)</code> تعيد بناء شجرة واحدة داخل <code>parent</code> وتُرجع جذرها، ولا تسجّل الجذر للاستدعاءات اللاحقة. وهي كـ <code>hydrate()</code> تتوقع أن يكون الجذر أول عقدة في <code>parent</code>، فإن كان وسم أول عقدة مختلفًا استُبدلت.</p>
      <p>على الخادم لا تفعل <code>forceUpdate()</code> شيئًا.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "العرض (Rendering)",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>تبني شجرتك وتُلحق عنصرها الجذر بـ <code>parent</code>، والافتراضي <code>document.body</code>، ثم تُرجع العنصر الجذر.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>يمكنك تمرير الـ component نفسه (<code>render(App)</code>) أو دالة البناء التي يُرجعها (<code>render(App())</code>)، والـ DOM الناتج واحد. لكن <code>render(App)</code> وحده يتيح لـ <a href="#api-force-update"><code>forceUpdate()</code></a> إعادة بناء الجذر لاحقًا، فهو الأفضل.</li>
        <li>تُلحق الشجرة بـ <code>parent</code> دون مسح محتواه، فاستدعاؤها مرتين يضيف نسختين.</li>
        <li>تكون كل hooks <code>onMount</code> في الشجرة قد نُفّذت عند عودة <code>render()</code>.</li>
        <li>اعرض داخل عنصر موجود في المستند. راجع <a href="#api-update"><code>update()</code></a>.</li>
        <li>يجب أن يكون الجذر عنصرًا مثل <code>div(...)</code>، لا <code>when()</code> ولا <code>list()</code>.</li>
        <li>الوسيط <code>index</code> داخلي ولا يحدد موضع إدراج العنصر، فاتركه.</li>
      </ul>
      <p>يجب ألا يقبل الـ component الممرَّر إلى <code>render(App)</code> أي معاملات. المعامل الإلزامي يسبب خطأ في الأنواع، أما الاختياري فيمرّ من فحص الأنواع لكن <code>render()</code> سترمي استثناءً وقت التشغيل. وإذا كان الـ component يقبل props فغلّفه بدالة:</p>
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
      <p>تجعل HTML الذي أنتجته <a href="#api-ssr"><code>renderToString()</code></a> تفاعليًا: تعيد استخدام العناصر الموجودة، وتربط الـ event listeners، وتربط القيم الديناميكية وكتل <code>when()</code> وقوائم <code>list()</code> بالصفحة، فيعمل <code>update()</code> بعد ذلك، ثم تنفّذ hooks <code>onMount</code>. والـ <code>parent</code> الافتراضي هو <code>document.body</code>، وتُرجع الدالة العنصر الجذر.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>استخدم الـ component نفسه والبيانات نفسها اللذين استخدمهما الخادم.</li>
        <li>نفّذ الـ hydration في حاوية مخصصة. يجب أن يكون جذر التطبيق أول عقدة فيها، ويُسمح بمسافات بيضاء قبله. فإن سبقته عقدة أخرى استبدلها Nuclo بجذر جديد وترك نسخة الخادم خلفها.</li>
        <li>كما في <code>render()</code>، مرّر <code>App</code> بدل <code>App()</code> لكي تتمكن <code>forceUpdate()</code> من إعادة بناء الجذر لاحقًا. ويجب ألا تقبل <code>App</code> أي معاملات؛ فإن قبلت معاملًا اختياريًا فلن تربط <code>hydrate()</code> شيئًا ولن تُظهر خطأ. وإذا كان الـ component يقبل props فغلّفه بدالة: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>وإن لم يكن هناك HTML جاء من الخادم فاستخدم <code>render()</code>.</li>
      </ul>
      <h3>حين يختلف الخادم عن العميل</h3>
      <p>بنية العميل هي المعتمدة:</p>
      <ul>
        <li>وسم جذر مختلف: تُستبدل تلك العقدة بالـ DOM الجديد. حاوية فارغة: يُلحق الـ DOM الجديد بها.</li>
        <li>النص المختلف يُعدَّل، وعناصر <code>list()</code> وفروع <code>when()</code> المختلفة تتبع العميل.</li>
        <li>الـ children الزائدة في نسخة الخادم تُزال، والناقصة فيها تُنشأ.</li>
        <li>الـ attributes التي كتبها الخادم ولم يضبطها العميل تُترك كما هي.</li>
      </ul>
      <p>تكتب <code>renderToString()</code> تعليقات HTML كعلامات، مثل <code>&lt;!-- text-0 --&gt;</code> قبل كل عقدة نصية، و<code>hydrate()</code> تحتاج إليها، فلا تحذف التعليقات من HTML الذي ولّده الخادم. وبدون هذه العلامات يحذف الـ hydration صفوف <code>list()</code> ويتوقف <code>list()</code> و<code>when()</code> عن التحديث.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "العرض على الخادم (SSR)",
        content: `
      <p>حوّل component إلى نص HTML على الخادم، وفي المتصفح استدعِ <a href="#api-hydrate"><code>hydrate()</code></a> بالـ component نفسه ليصير الـ HTML تفاعليًا. بيئات تشغيل الخادم لا تملك <code>document</code>، فاستورد <a href="#api-polyfill"><code>nuclo/polyfill</code></a> أولًا.</p>
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
      <p>أبقِ <code>id="nuclo-styles"</code> على وسم style؛ فالعميل يعيد استخدام هذا العنصر ولا يضيف إلا القواعد الجديدة. انظر <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>ما الذي يعمل على الخادم</h3>
      <ul>
        <li>كل استدعاء لـ <code>renderToString()</code> يبني الشجرة وينفّذ كل قيمة ديناميكية مرة واحدة.</li>
        <li>معالجات الأحداث و<code>onMount</code> و<code>onDestroy</code> لا تُنفَّذ أبدًا، ودوال <code>update()</code> و<code>scope()</code> و<code>forceUpdate()</code> لا تفعل شيئًا.</li>
        <li>العملية متزامنة، فحمّل بياناتك أولًا ثم اعرضها.</li>
        <li>لا يبقى شيء مسجَّلًا بعد الـ render، فيمكن لعملية واحدة أن تخدم طلبات كثيرة. مرّر بيانات الطلب كوسائط، مثل <code>renderToString(Page(user))</code>، وتذكّر أن متغيرات مستوى الـ module مشتركة بين كل الطلبات.</li>
        <li>لا تستدعِ <code>render()</code> على الخادم، فهي تُلحق الناتج بـ <code>document.body</code> المشترك.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>تقبل دالة بناء (<code>App()</code>) أو component (<code>App</code>) أو عقدة DOM. وتُرجع <code>""</code> مع <code>null</code> و<code>undefined</code>. ويجب أن يكون الجذر عنصرًا. والـ component الممرَّر كـ <code>renderToString(Page)</code> يجب ألا يأخذ معاملات، فإن كان يحتاج بيانات فمرّر <code>Page(user)</code>.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>تُهرَّب المحارف الخاصة في النصوص وقيم الـ attributes كـ HTML entities. أما النص داخل <code>script()</code> و<code>style()</code> فيُكتب كما هو مع تقسيم وسوم الإغلاق فقط، فلا تضع فيه مدخلات المستخدم أبدًا.</li>
        <li>لا ترمي استثناءات. فإذا رمى الـ component أو دالة <code>list()</code> أو شرط <code>when()</code>، أو غاب الـ polyfill، سُجّل الخطأ وعادت <code>""</code>؛ فتحقق من النتيجة الفارغة إن أردت اعتبار الطلب فاشلًا. أما دالة النص أو الـ attribute التي ترمي فتنتج قيمة فارغة لذلك الموضع وحده.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>مكافئة لـ <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>تغلّف الناتج بعنصر واحد. القيمة الافتراضية لـ <code>containerTag</code> هي <code>"div"</code> ولـ <code>containerAttrs</code> هي <code>{}</code>. تُهرَّب المحارف الخاصة في قيم الـ attributes، وتُكتب أسماؤها كما مرّرتها، فاستخدم أسماء HTML مثل <code>class</code>. ولا تستخدم مدخلات المستخدم اسمَ وسم أبدًا.</p>
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
      <p>DOM مصغّر يتيح لـ Nuclo بناء الأشجار في Node وBun. استورده مرة واحدة قبل أول render، ومعظم التطبيقات لا تحتاج إلا إلى هذا الاستيراد.</p>
      <ul>
        <li>إذا لم يوجد <code>window</code> فإنه يضبط <code>globalThis.document</code> و<code>Node</code> و<code>Element</code> و<code>HTMLElement</code>، المفقود منها فقط، ولا ينشئ <code>window</code>.</li>
        <li>في المتصفح أو داخل jsdom لا يفعل شيئًا.</li>
        <li>الـ <code>Event</code> و<code>CustomEvent</code> هما الـ constructors الأصليان في بيئة التشغيل، أما <code>Node</code> و<code>Element</code> و<code>HTMLElement</code> فهي aliases لـ classes الـ polyfill.</li>
      </ul>
      <p>إنه DOM لبناء الأشجار وليس متصفحًا: لا يملك <code>innerHTML</code> ولا <code>getElementById</code>، و<code>querySelector()</code> تُرجع <code>null</code>، والـ event listeners تُتجاهل. للحصول على HTML استخدم <code>renderToString()</code>.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
