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
      <p>Nuclo هي مكتبة DOM صغيرة لـ TypeScript. يمكنك إنشاء الصفحة بدوال عادية مثل <code>div()</code> و<code>button()</code>، والحفاظ على الحالة في المتغيرات العادية، واستدعاء <code>update()</code> عندما يجب أن تتغير الصفحة.</p>
      <p>Nuclo ليس لديه DOM افتراضي، ولا مصرّف، ولا بروكسيات ولا إشارات.</p>
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
      <h3>النموذج الذهني</h3>
      <ol>
        <li>قم ببناء UI باستخدام منشئي العلامات.</li>
        <li>قم بتمرير دالة لكل قيمة تعتمد على الحالة.</li>
        <li>قم بتغيير الحالة باستخدام JavaScript العادي.</li>
        <li>اتصل بـ <code>update()</code>. يقوم Nuclo بتشغيل الدوال مرة أخرى ويقوم بتعديل DOM.</li>
      </ol>
      <p>تغيير المتغير لا يمس DOM. تتغير الصفحة فقط عند الاتصال بـ <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "البدء السريع",
        content: `
      <p><code>create-nuclo</code> تدعم مشروع Vite وTypeScript الجاهز لـ Nuclo:</p>
    `,
        afterContent: `
      <p>يطلب اسم المشروع. لتخطي المطالبة، قم بتمرير الاسم والأعلام. باستخدام npm، ضع <code>--</code> قبل الأعلام:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>ثم قم بتثبيت وبدء تشغيل خادم التطوير:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>الخيارات</h3>
      <ul>
        <li><code>[project-name]</code>: المجلد الهدف. الافتراضي هو <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: القالب المراد نسخه. فقط <code>basic</code> موجود اليوم.</li>
        <li><code>-y, --yes</code>: لا تطالب أبدًا، استخدم الإعدادات الافتراضية.</li>
        <li><code>-f, --force</code>: اكتب في مجلد غير فارغ.</li>
        <li><code>-h, --help</code>: اطبع المساعدة.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "التثبيت والاستيراد",
        content: `
      <p>لإضافة Nuclo إلى مشروع موجود:</p>
      ${sh("npm install nuclo")}
      <p>أو استخدم <code>pnpm add nuclo</code> أو <code>yarn add nuclo</code> أو <code>bun add nuclo</code>. Nuclo لا يوجد لديه تبعيات.</p>
      <p>جزءًا من الحزمة الأساسية. يتم شحنه بشكل منفصل باسم <a href="#router-overview"><code>nuclo-router</code></a>، والذي تقوم بتثبيته بجوار <code>nuclo</code> عندما تحتاج إليه.</p>
      <h3>الأسماء في النطاق العام</h3>
      <p><code>import 'nuclo'</code> يضع هذه على <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 أدوات إنشاء العلامات </strong>: 112 لـ HTML (<code>div</code>، <code>span</code>، <code>button</code>، ...) و63 لـ SVG، مع لاحقة <code>Svg</code> (<code>svgSvg</code>، <code>pathSvg</code>، ...). راجع منشئي العلامات <a href="#tag-builders"></a>.</li>
        <li><strong>16</strong>: <code>update</code>، <code>scope</code>، <code>when</code>، <code>list</code>، <code>region</code>، <code>into</code>، <code>on</code>، <code>render</code>، <code>hydrate</code>، <code>forceUpdate</code>، <code>css</code>، <code>cx</code>، <code>createCss</code>، <code>variants</code>، <code>keyframes</code> و<code>globalStyle</code>.</li>
      </ul>
      <p>يجب أن يتم تشغيل الاستيراد قبل أي تعليمات برمجية تستدعي المنشئ. تعمل وحدات ES بترتيب الاستيراد، لذلك يفشل هذا:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>ضع <code>import 'nuclo'</code> أولاً في ملف الإدخال الخاص بك، أو قم باستيراده في كل ملف يستخدم العناصر العالمية.</p>
      <h3>الاستيرادات المسماة</h3>
      <p>يتم تسمية المساعدين أيضًا بالصادرات. إنها نفس دوال العوالم. يتم تسمية <code>getCssText()</code> و<code>resetStyles()</code> بالصادرات فقط. منشئو العلامات هم عالميون فقط، لذا فإن <code>import { div } from 'nuclo'</code> لا يعمل.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>نقاط الدخول</h3>
      <ul>
        <li><code>nuclo</code>: يسجل العناصر العالمية ويصدر 16 مساعدًا بالإضافة إلى <code>getCssText</code> و<code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>، <code>renderManyToString</code>، <code>renderToStringWithContainer</code> و<code>getCssText</code>. راجع عرض <a href="#api-ssr">Server</a>.</li>
        <li><code>nuclo/polyfill</code>: DOM صغير للعقدة والكعكة. انظر <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: الأنواع فقط. انظر <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo يشحن أنواعه الخاصة. تحتاج إلى شيئين:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> و<code>nodenext</code> غير مدعومين حتى الآن.</li>
        <li>ليب <code>DOM</code>. يقوم TypeScript بتضمينه بشكل افتراضي عندما لا تقوم بضبط <code>lib</code>.</li>
      </ul>
      <p>إذا قام أي ملف في المشروع باستيراد <code>'nuclo'</code>، فسيرى كل ملف الأنواع العامة. لا تحتاج إلى أي شيء آخر. إذا لم يستورده أي ملف، على سبيل المثال في ملف tsconfig منفصل للاختبارات، فأضف الأنواع بنفسك:</p>
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
      <p>أو أضف <code>/// &lt;reference types="nuclo/types" /&gt;</code> إلى ملف <code>.d.ts</code>.</p>
      <h3>أنواع مفيدة</h3>
      <p>هذه الأنواع عالمية، لذا يمكنك استخدامها دون استيراد:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: ما يعود به منشئ العلامات. استخدمه كنوع إرجاع للمكون.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: أي شيء يقبله منشئ العلامات كوسيطة.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: ما يعود <code>render()</code> و <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: أي اسم علامة HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: كائن السمة الذي يقبله منشئ العلامات، بما في ذلك معالجات <code>on*</code> و<code>onMount</code> و<code>onDestroy</code>. استخدمه للمكونات التي تمرر السمات من خلالها.</li>
        <li><code>MountCallback</code> و<code>DestroyCallback</code>: معالجات <code>onMount</code> و<code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>، <code>ListModifier</code>: ما يعود به <code>when()</code> و<code>list()</code>.</li>
        <li><code>RegionOptions</code>، <code>RegionType</code>: الخيارات التي يتخذها <code>region()</code>.</li>
        <li><code>StyleResult</code>، <code>Style</code>، <code>ThemeConfig</code>، <code>CssInstance</code> وأنواع التصميم الأخرى. يمكنك أيضًا استيراد هذه: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p>يقوم <code>ExpandedElement&lt;Tag&gt;</code> بوضع علامة على كل عضو في DOM كاختياري. قم بإلقائها عندما تحتاج إلى نوع العنصر الكامل: <code>render(App, root) as HTMLDivElement</code>.</p>
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
        title: "بُناة الوسوم",
        content: `
      <p>كل علامة HTML هي دالة عامة بنفس الاسم: <code>div</code>، <code>span</code>، <code>input</code>، ... الاستثناء الوحيد هو <code>&lt;var&gt;</code>، وهو <code>var_</code> لأن <code>var</code> هي كلمة محجوزة. تحتوي كل علامة SVG على لاحقة <code>Svg</code>: <code>svgSvg</code>، <code>pathSvg</code>، <code>circleSvg</code>، ...</p>
      <p>لا يؤدي استدعاء منشئ العلامات إلى إنشاء عنصر بعد. تقوم <code>div('Hi')</code> بإرجاع <strong>builder</strong>: دالة تقوم بإنشاء العنصر لاحقًا. يستدعيه Nuclo عندما تقوم بتركيبه باستخدام <code>render()</code> أو وضعه داخل منشئ آخر، <code>when()</code> أو <code>list()</code>. كل استخدام يخلق عنصرا جديدا.</p>
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
      <h3>الوسائط</h3>
      <p>يأخذ المنشئ أي عدد من الوسائط ويطبقها من اليسار إلى اليمين:</p>
      <ul>
        <li><strong>string، number، bigint</strong>: عقدة نصية.</li>
        <li><strong><code>() =&gt; value</code></strong>: النص الذي يتغير على <code>update()</code>. راجع <a href="#dynamic-functions"> القيم الديناميكية </a>.</li>
        <li><strong><code>null</code>، <code>undefined</code></strong>: تم تخطيه.</li>
        <li><strong><code>true</code>، <code>false</code></strong>: يتم تقديمه كنص "صحيح" أو "false". استخدم <code>when()</code> للشروط.</li>
        <li><strong>A كائن عادي </strong>: السمات. راجع <a href="#attributes">Attributes</a>.</li>
        <li><strong>A <code>css()</code> أو <code>cx()</code> أو <code>variants()</code></strong>: تضيف فئاتها.</li>
        <li><strong><code>on(...)</code></strong>: مستمع الأحداث أو خطاف دورة الحياة.</li>
        <li><strong> منشئ آخر، <code>when()</code> أو <code>list()</code></strong>: طفل.</li>
        <li><strong>A DOM <code>Node</code></strong>: ملحق كما هو.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: معدل مخصص. انظر أدناه.</li>
      </ul>
      <h3>محاذير شائعة</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> يعرض النص "false". اكتب <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>ليست عناصر فرعيةًا. انشروها: <code>ul(...names.map((n) =&gt; li(n)))</code>. بالنسبة للقوائم التي تتغير، استخدم <code>list()</code>.</li>
        <li>يخفي المتغير المحلي الذي يحمل اسم العلامة المنشئ. داخل <code>function Row(label: string)</code>، <code>label(...)</code> غير قابل للاستدعاء. إعادة تسمية السكان المحليين مثل <code>label</code>، <code>title</code>، <code>data</code>، <code>p</code>، <code>a</code> و<code>i</code>.</li>
        <li>كل عنصر يحتوي على <code>id</code> كمتغير عام. إذا كانت الصفحة تحتوي على <code>&lt;main id="main"&gt;</code> قبل تحميل Nuclo، فإن Nuclo يترك ذلك العمومي في مكانه، لذلك يقوم <code>main(...)</code> بطرح <code>TypeError</code>. استخدم معرفات أخرى.</li>
      </ul>
      <h3>معدّلات مخصصة</h3>
      <p>يتم تشغيل الدالة التي تعلن عن معلمة واحدة على الأقل مرة واحدة، بترتيب الوسيطة، أثناء إنشاء العنصر. حجتها الأولى هي العنصر. والثاني هو فهرس داخلي فلا تعتمد عليه. إذا أعادت سلسلة أو رقمًا، فسيصبح ذلك نصًا. تم إلحاق <code>Node</code>. يتم تطبيق كائن كسمات.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>الحصول على العنصر</h3>
      <p><code>render()</code> ترجع العنصر الجذر. داخل الشجرة، استخدم <code>on("mount", (el) =&gt; …)</code> أو معدّل مخصص. يمكنك أيضًا استدعاء دالة الإنشاء بنفسك لإنشاء عنصر منفصل:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>قم بإرفاقه قبل <code>update()</code> التالي. العقدة غير الموجودة في المستند عند تشغيل <code>update()</code> تتوقف عن التحديث للأبد.</p>
      <h3>SVG</h3>
      <p>SVG نفس الحجج. يقوم Nuclo بتعيين كل سمة SVG مع <code>setAttribute</code>، لذلك تعمل الأسماء مثل <code>"stroke-width"</code> كما هو مكتوب.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>جميع البُناة</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "المكوّنات",
        content: `
      <p>المكون هو دالة بسيطة تقوم بإرجاع منشئ، مثل <code>button(...)</code>. لا يوجد مكون API. لا يتم خلق شيء حتى تصنعه أو تضعه في شجرة.</p>
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
      <p>المعلنة داخل الدالة إلى هذا المثيل. يتم مشاركة الدولة المعلنة بالخارج في كل حالة. يقوم <code>forceUpdate()</code> باستدعاء المكونات مرة أخرى، مما يؤدي إلى إعادة تعيين الحالة المعلنة بداخلها.</p>
      <p>العناصر الفرعية مجرد حجج:</p>
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
        title: "السمات",
        content: `
      <p>قم بتمرير كائن عادي لتعيين السمات. يمكنك تمرير عدة كائنات. لنفس المفتاح، تفوز القيمة الأحدث، باستثناء <code>className</code> و<code>style</code>، اللذين يتم دمجهما. يمكن أن تكون القيمة ثابتة، أو دالة بدون معلمات يتم تشغيلها مرة أخرى على كل <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>كيفية تعيين القيمة</h3>
      <ul>
        <li>اذا كان العنصر HTML يحتوي على خاصية بهذا الاسم (<code>value</code>، <code>checked</code>، <code>disabled</code>، <code>htmlFor</code>، <code>tabIndex</code>، ...)، يقوم Nuclo بتعيين الخاصية. وإلا فإنه يستدعي <code>setAttribute(key, String(value))</code>، على سبيل المثال <code>"aria-*"</code> و<code>"data-*"</code>.</li>
        <li>في عناصر SVG، يستدعي Nuclo دائمًا <code>setAttribute</code>.</li>
        <li>تم تخطي <code>null</code> و<code>undefined</code>. القيمة الديناميكية التي تُرجع <code>null</code> أو <code>undefined</code> تحافظ على القيمة القديمة. لمسح قيمة، قم بإرجاع <code>""</code> أو <code>false</code> لخاصية منطقية.</li>
        <li>على الخصائص المنطقية DOM، مثل <code>disabled</code> على زر، و<code>checked</code>، و<code>hidden</code>، و<code>required</code>. في أي مكان آخر، تتم كتابة <code>true</code> و<code>false</code> كالسلسلتين "true" و"false".</li>
        <li>استخدم مفاتيح <code>"data-*"</code>. <code>dataset</code> غير مدعوم.</li>
        <li>لم يتم الهروب من <code>innerHTML</code>، ولا يقوم عرض الخادم بإخراجه. تجنب ذلك.</li>
      </ul>
      <h3>أصناف CSS</h3>
      <p>استخدم <code>className</code>. يتم دمج سلاسل الفئات الثابتة ونتائج <code>css()</code> و<code>className</code> الديناميكية. تحافظ <code>className</code> الديناميكية على الفئات الثابتة، وعندما تقوم بإرجاع <code>""</code> تبقى الفئات الثابتة فقط.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>لا تستخدم مفتاح <code>class</code> على عناصر HTML. يقوم بتعيين السمة الأولية واستبدال كل فئة تم تطبيقها قبلها، بما في ذلك فئات <code>css()</code>.</p>
      <h3>التنسيقات المضمّنة</h3>
      <p><code>style</code> يأخذ كائنًا بمفاتيح camelCase، أو دالة تُرجع واحدًا.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo لا يضيف أي وحدات. اكتب <code>"12px"</code>، وليس <code>12</code>. الخصائص بدون وحدات مثل <code>opacity</code> و<code>zIndex</code> تقبل الأرقام.</li>
        <li><code>""</code> و<code>null</code> و<code>undefined</code> بمسح خاصية.</li>
        <li>يقوم النمط الديناميكي بتعيين المفاتيح التي يُرجعها فقط. المفتاح الذي يتوقف عن العودة يحتفظ بقيمته القديمة، لذا قم بإرجاع <code>""</code> لمسحه.</li>
        <li>سلاسل الأنماط (<code>"color: red"</code>) والخصائص المخصصة (<code>"--gap"</code>) غير مدعومة. استخدم <code>css()</code> بدلاً من ذلك. يستغرق خصائص مخصصة من خلال <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "الأحداث",
        content: `
      <p>هناك طريقتان للاستماع إلى الأحداث: سمات <code>on*</code> ومعدل <code>on()</code>.</p>
      <h3>سمات <code>on*</code></h3>
      <p>في كائن السمة، تعتبر الدالة الموجودة أسفل مفتاح مثل <code>onClick</code> (<code>on</code> متبوعًا بحرف كبير) معالج حدث، وليست قيمة ديناميكية.</p>
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
        <li>يستنتج TypeScript نوع الحدث من المفتاح والعنصر. <code>e.currentTarget</code> و <code>this</code> هما العنصر.</li>
        <li>Nuclo بتعيين الخاصية الأصلية، بحيث يصبح <code>onClick</code> <code>el.onclick</code>. يوجد معالج واحد لكل حدث: يحل <code>onClick</code> الأحدث محل معالج سابق.</li>
        <li><code>onDoubleClick</code> و<code>onDblClick</code> كلاهما يعني <code>dblclick</code>. المفاتيح الصغيرة مثل <code>onclick</code> هي أخطاء في الكتابة.</li>
        <li>الاسم الذي ليس حدثًا معروفًا يستمع إلى شكله الصغير: <code>onMyEvent</code> يستمع إلى <code>"myevent"</code>.</li>
        <li>لا يتم اكتشاف الأخطاء التي يلقيها المعالج.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p>تقوم <code>on()</code> بإرجاع مُعدِّل يستدعي <code>addEventListener</code> على العنصر.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>يضيف كل <code>on()</code> مستمعًا. كلهم يركضون بالترتيب.</li>
        <li><code>options</code> ينتقل مباشرة إلى <code>addEventListener</code>: <code>capture</code>، <code>once</code>، <code>passive</code>، <code>signal</code>.</li>
        <li>قم بتمرير <code>on()</code> مباشرة إلى المُنشئ ويتم استنتاج نوع العنصر: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>إذا قام المستمع بالرمي، يقوم Nuclo بتسجيل الخطأ باستخدام <code>console.error</code>، وتظل المستمعات الأخرى قيد التشغيل.</li>
        <li>Nuclo يزيل المستمع عندما يزيل العنصر. على الخادم، <code>on()</code> لا يفعل شيئًا.</li>
        <li>يمكنك إعادة استخدام قيمة <code>on()</code> واحدة على العديد من العناصر.</li>
      </ul>
      <p>بالنسبة لحدث مخصص، قم بتمرير نوع الحدث كنوع عام:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>أيهما تستخدم؟</h3>
      <p>استخدم سمات <code>on*</code> للحالة المعتادة. استخدم <code>on()</code> عندما تحتاج إلى أكثر من مستمع واحد لحدث ما، أو خيارات المستمع، أو اسم حدث مخصص مثل <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "دورة الحياة",
        content: `
      <p><code>onMount</code> مرة واحدة، بعد إدراج العنصر. يتم تشغيل <code>onDestroy</code> مرة واحدة، عندما يقوم Nuclo بإزالة العنصر. اكتبها كسمات أو باستخدام <code>on()</code>. يتصرف كلا النموذجين بنفس الطريقة، ويتم كتابة العنصر من علامته.</p>
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
        <li><code>onMount</code> في نهاية استدعاء <code>render()</code> أو <code>hydrate()</code> أو <code>update()</code> أو <code>forceUpdate()</code> الذي قام بإدراج العنصر. لا تعمل أبدًا أثناء بناء الشجرة.</li>
        <li>إذا قام <code>onMount</code> بإرجاع دالة، فسيتم تشغيل هذه الدالة عند التدمير، بعد عمليات الاسترجاعات <code>onDestroy</code> للعنصر.</li>
        <li>يتم تشغيل <code>onDestroy</code> عندما يقوم Nuclo بإزالة العنصر: تتم إزالة صف <code>list()</code>، أو يقوم فرع <code>when()</code> بتبديله، أو يترك <code>into()</code> منطقته، أو يقوم <code>forceUpdate()</code> بإسقاطه. يتم تشغيله قبل الإزالة مباشرةً، لذا يظل العنصر موجودًا في المستند.</li>
      </ul>
      <h3>إزالة عناصر DOM مباشرة</h3>
      <p>إذا قمت بإزالة عنصر بنفسك، باستخدام <code>node.remove()</code> أو <code>innerHTML = ''</code>، فلن يتم تشغيل <code>onDestroy</code> وعمليات التنظيف الخاصة به مطلقًا، وسيستمر تشغيل المؤقتات. Nuclo ليس لديه <code>unmount()</code>. لتدمير تطبيق ما بالتنظيف، قم بتغليفه في <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>الترتيب والأخطاء</h3>
      <ul>
        <li>يمكنك تسجيل أي عدد تريده من الخطافات، في أي من النموذجين. أنها تعمل في ترتيب التسجيل.</li>
        <li>يقوم <code>onDestroy</code> دائمًا بتشغيل العناصر الفرعية أولاً، ثم الوالدين.</li>
        <li>بترتيب خطاف <code>onMount</code> الأول، والذي يتبع ترتيب الوسيطة، ويقوم كل عنصر بتشغيل جميع خطافاته معًا. مرر خطاف الوالدين قبل أبنائه إذا كانوا يعتمدون عليه.</li>
        <li>يتم تسجيل الخطاف الذي يتم رميه باستخدام <code>console.error</code>. الخطافات الأخرى لا تزال تعمل.</li>
        <li>يجب أن لا يُرجع رد الاتصال شيئًا أو يُرجع دالة تنظيف، لذا لا تجعله <code>async</code>. لا يتم استخدام الوعد الذي تم إرجاعه أبدًا كتنظيف. ابدأ العمل غير المتزامن بداخله: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>مطلقًا على الخادم. على العميل، يتم تشغيلها بعد <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>ملاحظة: خطافات </strong> ليست تأثيرات. لا يركضون مرة أخرى أبدًا عندما تتغير الحالة. يتم تشغيل كل واحد مرة واحدة على الأكثر لكل عنصر.</div>
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
      <p>Nuclo لا يقوم أبدًا بتحديث الصفحة من تلقاء نفسه. قم بتغيير حالتك، ثم اتصل بـ <code>update()</code>.</p>
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
      <p>قم بتغيير الحالة كما تريد، ثم اتصل بـ <code>update()</code> مرة واحدة:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>اتصل بـ <code>update()</code> من معالجات الأحداث أو أجهزة ضبط الوقت أو جلب عمليات الاسترجاعات أو <code>onMount</code>. لا تسميها من داخل قيمة ديناميكية.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "القيم الديناميكية",
        content: `
      <p>دالة ذات <strong> لا توجد معلمات </strong> هي قيمة ديناميكية <strong></strong>. يقوم Nuclo بتشغيله مرة واحدة عندما يقوم ببناء العنصر، ومرة ​​أخرى على كل <code>update()</code>. استخدم القيم الديناميكية لأبناء النص وقيم السمات و<code>style</code> و<code>className</code>. بالنسبة للعناصر فرعية الذين يظهرون أو يختفون أو يتكررون، استخدم <a href="#api-when"><code>when()</code></a> و<a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo يتحقق من عدد المعلمات (<code>fn.length</code>). الدالة التي تعلن عن معلمة هي <a href="#tag-builders"> معدل مخصص </a> ويتم تشغيلها مرة واحدة فقط. يبلغ طول <code>(x = 0) =&gt; …</code> و<code>(...args) =&gt; …</code> 0، لذا فهما ديناميكيان.</p>
      <h3>النص الديناميكي</h3>
      <ul>
        <li>يتم عرض سلسلة أو رقم أو قيمة كبيرة أو منطقية على أنها <code>String(value)</code>. يعرض <code>() =&gt; ok &amp;&amp; 'Saved'</code> "false"، لذا اكتب <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> و<code>undefined</code> كنص فارغ.</li>
        <li>نتيجة <code>css()</code> أو <code>cx()</code> عند التشغيل الأول تجعل الدالة فئة ديناميكية، وليس نصًا. انظر <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>العقدة أو المنشئ أو المصفوفة أو الكائن العادي لا يعرض شيئًا ولا يتم تحديثه أبدًا.</li>
      </ul>
      <h3>السمات الديناميكية</h3>
      <ul>
        <li>Nuclo يكتب قيمة فقط عندما تختلف عن القيمة الأخيرة التي كتبها Nuclo. ولا تتم مقارنتها بـ DOM المباشر، لذلك إذا قام المستخدم بالكتابة في أحد المدخلات وأرجعت وظيفتك نفس القيمة كما كانت من قبل، فسيظل النص الذي كتبه موجودًا.</li>
        <li>نتيجة <code>null</code> أو <code>undefined</code> لا تكتب شيئًا، لذا تبقى القيمة القديمة. <code>className</code> هو الاستثناء: أي نتيجة خاطئة تزيل الفئات الديناميكية وتحتفظ بالفئات الثابتة.</li>
        <li>تقوم الدالة <code>style</code> بتطبيق الكائن الذي يتم إرجاعه في كل تحديث.</li>
      </ul>
      <h3>الأخطاء</h3>
      <p>إذا ظهرت قيمة ديناميكية، فسيكتشف Nuclo الخطأ وسيستمر تشغيل بقية التحديث. يصبح النص فارغًا أو يحتفظ بقيمته القديمة، وتحتفظ السمة بقيمتها القديمة. كلاهما يتعافى في <code>update()</code> التالي الذي ينجح. الاستثناء: دالة النص التي يتم طرحها عند تشغيل <strong>first</strong> تظل فارغة إلى الأبد.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>يقوم بتشغيل تمريرة متزامنة واحدة عبر كل قيمة ديناميكية في الصفحة. باستخدام المعرفات، فإنه يقوم فقط بتحديث ما هو موجود داخل العناصر المميزة بمعرفات <a href="#api-scope"><code>scope()</code></a>. يقوم كل تمرير بتنفيذ هذه الخطوات بالترتيب:</p>
      <ol>
        <li><code>list()</code>: يقرأ العناصر مرة أخرى ويضيف أو ينقل أو يزيل الصفوف.</li>
        <li><code>when()</code>: التحقق من الشروط مرة أخرى. تتم إعادة بناء الفرع فقط عندما يصبح فرع مختلف نشطًا.</li>
        <li>السمات الديناميكية، بما في ذلك <code>style</code> و<code>className</code>.</li>
        <li>نص ديناميكي.</li>
        <li><code>onMount</code> للعناصر التي تم إدراج الخطوتين 1 و2 فيها.</li>
      </ol>
      <ul>
        <li><strong> إنه يقوم بتشغيل كل شيء. </strong> يتم تشغيل كل قيمة ديناميكية في كل مكالمة، حتى عندما لا تتغير بياناتها. يتم تخطي الكتابة DOM فقط. حافظ على القيم الديناميكية سريعة وخالية من الآثار الجانبية.</li>
        <li><strong> العقد فقط في الوثيقة. </strong> إذا لم تكن العقدة موجودة في الوثيقة عند تشغيل <code>update()</code>، فسيتوقف Nuclo عن تتبعها. ولا يتم تحديثه مرة أخرى أبدًا، حتى بعد إرفاقه. وهذا ينطبق على <code>list()</code> و<code>when()</code> أيضًا. تقديم في حاوية موجودة في المستند.</li>
        <li><strong> القيم الثابتة لا تتغير أبدًا. </strong> يتم إصلاح السلاسل البسيطة وقيم السمات عند إنشاء العنصر. لإعادة بنائها، استخدم <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Errors.</strong> يتم اكتشاف أخطاء النص والسمات، ويستمر المرور. إذا ظهرت حالة <code>when()</code>، فسيتم تسجيل الخطأ ويتوقف <code>when()</code> عن التحديث. في حالة ظهور دالة <code>list()</code> <code>items</code> أو <code>renderItem</code>، يفلت الخطأ من <code>update()</code> ولا يتم تشغيل الخطوات المتبقية.</li>
        <li><strong>Server.</strong> <code>update()</code> لا يقوم بأي شيء على الخادم.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>يعطي العنصر الذي تم تمريره إلى معرف نطاق واحد أو أكثر. يقوم <code>update('id')</code> بعد ذلك بتحديث ما هو موجود داخل هذا العنصر فقط، بما في ذلك سمات العنصر الخاصة.</p>
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
        <li>يمكن أن يحتوي العنصر على عدة معرفات: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> بتحديث كل شيء داخل <code>a</code> أو <code>b</code>. إذا كانت عدة عناصر تستخدم نفس المعرف، فسيتم تحديثها جميعًا.</li>
        <li>مع النطاقات المتداخلة، يتضمن <code>update('outer')</code> النطاق الداخلي. <code>update('inner')</code> لا يلمس الجزء الخارجي.</li>
        <li>معرف عدم وجود أي عنصر في الوثيقة يحتوي على تحديثات <strong>nothing</strong> ولا يسبب أي خطأ، لذا قم بالتحقق من التهجئة.</li>
        <li><code>scope()</code> لا يفعل شيئًا على الخادم.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>يعرض المحتوى بناءً على شرط ما. يقوم Nuclo بالتحقق من الشروط مرة أخرى في كل <code>update()</code>. الشرط الحقيقي الأول يفوز. إذا لم يكن أي شيء صحيحًا، فسيتم عرض محتوى <code>.else()</code>. بدون <code>.else()</code>، لن يتم عرض أي شيء.</p>
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
        <li>بالنسبة للحالة، قم بتمرير دالة. تتم قراءة القيمة المنطقية البسيطة مرة واحدة: <code>when(open, …)</code> لا يتغير أبدًا.</li>
        <li>في TypeScript، يجب أن تقوم الدالة بإرجاع قيمة منطقية. اكتب <code>() =&gt; items.length &gt; 0</code> أو <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>ما الذي يُحدَّث؟</h3>
      <ul>
        <li>بينما يظل نفس الفرع نشطًا، يتم الاحتفاظ بعناصره. تستمر القيم الديناميكية والقوائم وكتل <code>when()</code> الموجودة داخلها في التحديث.</li>
        <li>عندما يصبح فرع مختلف نشطًا، تتم إزالة المحتوى القديم وتشغيل خطافات <code>onDestroy</code> الخاصة به. تم بناء الفرع الجديد من الصفر ويتم تشغيل خطافات <code>onMount</code> الخاصة به. يتم فقدان الحالة في العناصر القديمة، مثل نص الإدخال أو التركيز.</li>
      </ul>
      <h3>محتوى الفرع</h3>
      <p>ضع العناصر الفرعية في فرع: النص، والنص الديناميكي، والبناة، و<code>list()</code> و<code>when()</code> المتداخلة. تمرير منشئي العقد مثل <code>p('Hi')</code>، وليس عقد DOM: تتوقف عقدة DOM عن التحديث بعد إخفاء فرعها مرة واحدة.</p>
      <p>تنطبق كائنات السمات و<code>on()</code> الموجودة في الفرع على العنصر الأصلي، وتظل بعد إخفاء الفرع. بالنسبة للسمة الشرطية، استخدم سمة ديناميكية: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>ربط الشروط</h3>
      <p><code>.when()</code> و<code>.else()</code> بإرجاع منشئ جديد ولا يغيران الأصل. إذا اتصلت بـ <code>.else()</code> مرتين، فستفوز المكالمة الأخيرة.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>يعرض صفًا واحدًا لكل عنصر. في كل <code>update()</code>، يستدعي Nuclo <code>items()</code> مرة أخرى ويطابق العناصر الجديدة مع الصفوف الموجودة حسب الهوية (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>كيفية مطابقة الصفوف</h3>
      <ul>
        <li>العنصر الذي لا يزال موجودًا يحتفظ بصفه. يقوم Nuclo بنقل الصف إذا لزم الأمر، ولا يقوم باستدعاء <code>renderItem</code> مرة أخرى.</li>
        <li>عنصر جديد يحصل على صف جديد. يفقد العنصر الذي تمت إزالته صفه، ويتم تشغيل خطافات <code>onDestroy</code> الخاصة به.</li>
        <li>كل عنصر مكرر له صف خاص به.</li>
        <li>يمكنك تغيير المصفوفة الموجودة في مكانها (<code>push</code>، <code>splice</code>، <code>sort</code>) أو إرجاع مصفوفة جديدة.</li>
      </ul>
      <p>لن يتم عرض الصف المحفوظ مرة أخرى أبدًا، لذا استخدم القيم الديناميكية للحقول التي تتغير:</p>
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
      <p>عناصر جديدة، لذا فإن استبدال المصفوفة بـ <code>todos.map((t) =&gt; ({ ...t }))</code> يعيد بناء كل صف.</p>
    `,
        afterContent: `
      <h3>ما تُرجعه <code>renderItem</code></h3>
      <ul>
        <li>تقوم بإرجاع عنصر واحد، مثل <code>li(...)</code> أو <code>tr(...)</code> أو منشئ SVG. قم بإرجاع <code>null</code> أو <code>undefined</code> لتخطي أحد العناصر. السلاسل والعقد النصية والأجزاء لا تقدم شيئًا.</li>
        <li>لا تقم بإرجاع <code>when()</code> أو <code>list()</code> مباشرة. ضعهم داخل عنصر الصف: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>لإخفاء العناصر، قم بالتصفية في <code>items()</code>، وليس في <code>renderItem</code>.</li>
        <li>حافظ على <code>renderItem</code> خاليًا من الآثار الجانبية. Nuclo قد يستدعيه أكثر من مرة لنفس العنصر.</li>
      </ul>
      <h3>الفهرس</h3>
      <p><code>index</code> هو موضع العنصر عند إنشاء الصف الخاص به. ولا يتم تحديثه عند نقل الصفوف. بالنسبة للموضع الحالي، استخدم قيمة ديناميكية: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>الكائنات القابلة للتكرار</h3>
      <p>أي أعمال قابلة للتكرار: المصفوفات، <code>Set</code>، المولدات و<code>map.values()</code>. يعد إرجاع نفس المصفوفة أو <code>Set</code> في كل مرة أمرًا جيدًا. يتم استخدام المكرر، مثل المولد أو <code>map.values()</code>، بعد مرور واحد، لذا قم بإنشائه داخل <code>items()</code> في كل مكالمة. يؤدي تكرار <code>Map</code> مباشرة إلى إنشاء مصفوفات <code>[key, value]</code> جديدة في كل مرة، لذلك يتم إعادة بناء كل صف. استخدم <code>map.values()</code> بدلاً من ذلك.</p>
      <h3>موضع الصفوف</h3>
      <p>حيث يقع <code>list()</code> بين أشقائه، بين علامتي تعليق. لا يتم لمس العناصر الفرعية الآخرين من الوالدين. يعمل <code>list()</code> أيضًا داخل منشئي SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() وinto()",
        content: `
      <p><code>region()</code> يمثل مكانًا مسمىًا في الشجرة. <code>into()</code> يملأها من أي مكان آخر، وبأي عمق. لا يتلقى التخطيط المحتوى كدعم، ولا يعرف المكون الذي يبني المحتوى مكان وصوله.</p>
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
      <h3>كيف يعمل</h3>
      <ul>
        <li><code>into()</code> لا يترك سوى تعليق حيث تم كتابته. يتم عرض محتواه بين علامات المنطقة.</li>
        <li>لا يهم الطلب. تم بناء <code>into()</code> قبل أن تنتظر منطقتها وتظهر لحظة بناء المنطقة. تظهر المشاهدات بالترتيب الذي كتبت به.</li>
        <li>يبقى المحتوى طالما تم عرضه. عند إغلاق <code>when()</code> الذي يحتوي على <code>into()</code>، أو عند إزالة صف <code>list()</code> الخاص به، يغادر المحتوى المنطقة. يؤدي فتحه مرة أخرى إلى إضافة نسخة واحدة، وليس نسختين.</li>
        <li>عندما تختفي منطقة ما، على سبيل المثال يتم إغلاق <code>when()</code>، تنتظر عروضها مرة أخرى. تظهرهم المنطقة التي تم إنشاؤها لاحقًا بنفس المعرف.</li>
        <li><code>into()</code> الذي لا يتطابق معرفه مع أي منطقة لا يعرض شيئًا ولا يسبب أي خطأ، لذا تحقق من التهجئة.</li>
        <li>المعرفات فريدة في الشجرة. تقوم المنطقة الثانية التي تم إنشاؤها تحت معرف مباشر بتسجيل تحذير.</li>
        <li>تعمل المناطق مع عرض <a href="#api-ssr">server</a>. في <code>hydrate()</code>، تطالب كل طريقة عرض بـ HTML الذي قدمه الخادم بدلاً من إنشائه مرة أخرى.</li>
      </ul>
      <h3>الخيارات</h3>
      <ul>
        <li><code>id</code>: يستخدم الاسم <code>into()</code> للعثور على المنطقة.</li>
        <li><code>type</code>: يعرض <code>'latest'</code> (الافتراضي) العرض الأحدث فقط. يعرض <code>'stack'</code> كل طريقة عرض بترتيب الوصول.</li>
        <li><code>empty</code>: يتم عرضه بينما لا تحتوي المنطقة على أي مشاهدات.</li>
      </ul>
      <h3>المناطق المكدّسة</h3>
      <p>مع <code>type: 'stack'</code>، طريقة العرض التي يتم فتحها فوق طريقة عرض أخرى لا تؤدي إلى إعادة بناء الطريقة الموجودة أسفلها. DOM، التركيز وحالة الشكل ثابتة. استخدم هذا لطبقة مثل مربع حوار فوق الصفحة.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>عدة مناطق دفعة واحدة</h3>
      <p>قم بتمرير كائن لملء أكثر من منطقة من <code>into()</code> واحد. يمكن أن تكون القيمة طفلًا واحدًا أو مجموعة من العناصر الفرعية. يتداخل كلا النموذجين: يستهدف <code>into()</code> داخل محتوى طريقة عرض أخرى منطقته الخاصة.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>فتح حوار من عمق الشجرة</h3>
      <p>تقع منطقة التراكب في الجذر. أي مكون، بأي عمق، يفتح مربع حوار عن طريق تغليف <code>into()</code> في <code>when()</code>. يؤدي إغلاق <code>when()</code> إلى إزالة مربع الحوار من المنطقة.</p>
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
      <h3>إشعارات عابرة من صفوف القائمة</h3>
      <p>كل صف من <code>list()</code> هو عرض. تعرض المنطقة المكدسة العناصر بالترتيب، وإزالة عنصر من المصفوفة يؤدي إلى إزالة نخبه.</p>
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
      <h3>عنوان تحدده الصفحة لنفسها</h3>
      <p>باستخدام <code>type: 'latest'</code> الافتراضي، يفوز العرض الأحدث. يمتلك التخطيط العنوان، وأي صفحة مفتوحة تسميه. الصفحة التي لا تحتوي على <code>into('title', …)</code> تترك النص <code>empty</code>.</p>
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
      <h3>قيم ديناميكية داخل العرض</h3>
      <p>محتوى <code>into()</code> هو محتوى Nuclo عادي. الدوال فيه هي قيم تعتمد على الحالة ويتم تحديثها على <code>update()</code>، أينما كانت المنطقة.</p>
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
      <p>تتم كتابة <code>into()</code> للوحة القيادة مرة واحدة. أثناء قيام المستخدم بتسجيل الخروج، لا توجد منطقة <code>main</code>، لذا ينتظر العرض. يؤدي تسجيل الدخول إلى إنشاء المنطقة ويظهر العرض. يؤدي تسجيل الخروج إلى إزالة المنطقة وينتظر العرض مرة أخرى.</p>
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
      <h3>عرض بمنطقته الخاصة</h3>
      <p>يمكن أن تحتوي المشاهدة على <code>region()</code>، ويمكن أن تستهدفها المشاهدات الأخرى. هنا تقوم صفحة المحرر بإحضار منطقة <code>tabs</code> معها، وكل علامة تبويب تملأها. عندما يغلق المحرر، منطقته تذهب معه.</p>
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
      <h3>مثال مباشر</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> يقوم بتشغيل القيم الديناميكية فقط. يتم إصلاح القيم الثابتة، مثل النص الموجود في <code>h1(labels[lang].title)</code>، عند إنشاء الشجرة. يستدعي <code>forceUpdate()</code> مكوناتك مرة أخرى ويصحح DOM المباشر للمطابقة، مع تضمين القيم الثابتة. استخدمه لإجراء تغييرات نادرة على مستوى التطبيق، مثل تبديل اللغة. استخدم <code>update()</code> لكل شيء آخر.</p>
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
      <p>بدون وسائط، يقوم <code>forceUpdate()</code> بإعادة بناء كل جذر تم تقديمه باستخدام <code>render(App)</code> أو <code>hydrate(App)</code>. يتم تخطي الجذور المقدمة بـ <code>render(App())</code>. في حالة ظهور أحد المكونات، يتم تسجيل الخطأ ويحتفظ هذا الجذر برقم DOM القديم. يتم أيضًا تسجيل خطأ تم طرحه لاحقًا، أثناء تطبيق البنية الجديدة، ولكن الأجزاء التي تم تعديلها بالفعل تظل مصححة.</p>
      <h3>ما يبقى وما يتغير</h3>
      <ul>
        <li>تتم مطابقة العناصر الفرعية بالترتيب حسب العلامة. تتم إعادة استخدام العنصر المطابق، لذلك تظل قيم التركيز والإدخال المكتوبة، ولا تعمل خطافات <code>onMount</code> الخاصة به مرة أخرى. بمجرد اختلاف علامة طفل واحد، يتم بناء هذا الطفل وكل أخ لاحق من جديد.</li>
        <li>النص والسمات والفئات والأنماط والمستمعين وفروع <code>when()</code> وصفوف <code>list()</code> تتبع البنية الجديدة.</li>
        <li>يتم إنشاء عناصر جديدة وتشغيل خطافات <code>onMount</code> الخاصة بها. تتم إزالة العناصر التي لم يعد البناء الجديد يصنعها، ويتم تشغيل خطافات <code>onDestroy</code> الخاصة بها.</li>
        <li><code>list()</code> حسب الموضع أيضًا، وليس حسب العنصر، لذلك يمكن أن يؤدي عنصر الصف المُعاد استخدامه إلى إظهار عنصر مختلف.</li>
        <li>لم تعد يتم إزالة مجموعات سمات البنية الجديدة.</li>
      </ul>
      <div class="docs-callout"><strong> انتبه: تتم إعادة تعيين حالة </strong> المعلنة داخل دالة المكون، لأن الدالة تعمل مرة أخرى. احتفظ بالحالة التي يجب أن تبقى خارج المكون.</div>
      <p><strong> نموذج صريح. </strong> <code>forceUpdate(App(), parent)</code> يعيد بناء شجرة واحدة في <code>parent</code> ويعيد جذرها. ولا يسجل الجذر للمكالمات اللاحقة. مثل <code>hydrate()</code>، فإنه يتوقع أن يكون الجذر هو العقدة الأولى في <code>parent</code>. إذا كانت العقدة الأولى تحتوي على علامة مختلفة، فسيتم استبدالها.</p>
      <p>على الخادم، <code>forceUpdate()</code> لا يفعل شيئا.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "العرض",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>يبني شجرتك ويلحق عنصرها الجذري بـ <code>parent</code>. <code>parent</code> الافتراضي هو <code>document.body</code>. يقوم بإرجاع العنصر الجذر.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>يمكنك تمرير المكون (<code>render(App)</code>) أو المنشئ الذي يقوم بإرجاعه (<code>render(App())</code>). DOM هو نفسه. فقط <code>render(App)</code> يسمح لـ <a href="#api-force-update"><code>forceUpdate()</code></a> بإعادة بناء الجذر لاحقًا، لذا تفضل ذلك.</li>
        <li>يتم إلحاقه. لا يقوم بمسح <code>parent</code>، لذا فإن الاتصال به مرتين يضيف نسختين.</li>
        <li>تم تشغيل كل <code>onMount</code> في الشجرة عند إرجاع <code>render()</code>.</li>
        <li>يتم تحويله إلى عنصر موجود في الوثيقة. انظر <a href="#api-update"><code>update()</code></a>.</li>
        <li>يجب أن يكون الجذر عنصرًا، مثل <code>div(...)</code>، وليس <code>when()</code> أو <code>list()</code>.</li>
        <li><code>index</code> داخلي. لا يختار مكان إدراج العنصر. اتركه.</li>
      </ul>
      <p>يجب أن لا يأخذ المكون الذي تم تمريره كـ <code>render(App)</code> أي معلمات. المعلمة المطلوبة هي خطأ في النوع. نوع اختياري واحد، ولكن <code>render()</code> يرمي في وقت التشغيل. لف مكونًا يأخذ الدعائم:</p>
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
      <p>يستحوذ على HTML المصنوع بواسطة <a href="#api-ssr"><code>renderToString()</code></a>. فهو يعيد استخدام العناصر الموجودة، ويرفق مستمعي الأحداث، ويربط القيم الديناميكية <code>when()</code> و<code>list()</code>، لذلك يعمل <code>update()</code> بعد ذلك. ثم يقوم بتشغيل خطافات <code>onMount</code>. <code>parent</code> الافتراضي هو <code>document.body</code>. يقوم بإرجاع العنصر الجذر.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>استخدم نفس المكون ونفس البيانات مثل الخادم.</li>
        <li>قم بترطيبه في حاوية مخصصة. يجب أن يكون جذر التطبيق هو العقدة الأولى، على الرغم من أن المسافة البيضاء جيدة. إذا جاءت عقدة أخرى أولاً، فإن Nuclo تستبدل تلك العقدة وتترك نسخة الخادم خلفها.</li>
        <li>كما هو الحال مع <code>render()</code>، قم بتمرير <code>App</code>، وليس <code>App()</code>، حتى يتمكن <code>forceUpdate()</code> من إعادة بناء الجذر لاحقًا. يجب ألا يأخذ <code>App</code> أي معلمات. مع الخيار الاختياري، <code>hydrate()</code> لا يعلق أي شيء بصمت. لف مكونًا يأخذ الدعائم: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>إذا لم يكن هناك خادم HTML، استخدم <code>render()</code>.</li>
      </ul>
      <h3>عندما يختلف الخادم والعميل</h3>
      <p>العميل يفوز:</p>
      <ul>
        <li>علامة جذر مختلفة: يتم استبدال تلك العقدة بـ DOM الجديدة. حاوية فارغة: تم إلحاق DOM جديد.</li>
        <li>تم تعديل النص المختلف. تتبع عناصر <code>list()</code> المختلفة وفروع <code>when()</code> العميل.</li>
        <li>تتم إزالة أبناء الخادم الإضافيين، ويتم إنشاء أبناء الخادم المفقودين.</li>
        <li>يتم ترك السمات التي كتبها الخادم ولكن لم يقم العميل بتعيينها كما هي.</li>
      </ul>
      <p>يقوم <code>renderToString()</code> بكتابة تعليقات HTML كعلامات، مثل <code>&lt;!-- text-0 --&gt;</code> قبل كل عقدة نصية. <code>hydrate()</code> يحتاج إليها، لذا لا تقم بإزالة التعليقات من الخادم HTML. بدون العلامات، يؤدي الترطيب إلى حذف الصفوف <code>list()</code>، ويتوقف <code>list()</code> و<code>when()</code> عن التحديث.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "العرض على الخادم",
        content: `
      <p>قم بعرض مكون لسلسلة HTML على الخادم. في المتصفح، اتصل بـ <a href="#api-hydrate"><code>hydrate()</code></a> بنفس المكون لجعل HTML تفاعليًا. لا تحتوي أوقات تشغيل الخادم على <code>document</code>، لذا قم باستيراد <a href="#api-polyfill"><code>nuclo/polyfill</code></a> أولاً.</p>
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
      <p>احتفظ بـ <code>id="nuclo-styles"</code> على علامة النمط. يعيد العميل استخدام هذا العنصر ويضيف قواعد جديدة فقط. انظر <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>ما يعمل على الخادم</h3>
      <ul>
        <li>يقوم كل استدعاء <code>renderToString()</code> بإنشاء الشجرة وتشغيل كل قيمة ديناميكية مرة واحدة.</li>
        <li>لا يتم تشغيل معالجات الأحداث، <code>onMount</code> و<code>onDestroy</code> أبدًا. <code>update()</code> و<code>scope()</code> و<code>forceUpdate()</code> لا يفعلون شيئًا.</li>
        <li>متزامن. قم بتحميل بياناتك أولاً، ثم اعرضها.</li>
        <li>لا شيء يبقى مسجلاً بعد التصيير، لذلك يمكن لعملية واحدة أن تخدم العديد من الطلبات. تمرير بيانات الطلب كوسائط، مثل <code>renderToString(Page(user))</code>. تتم مشاركة المتغيرات على مستوى الوحدة النمطية بواسطة كافة الطلبات.</li>
        <li>لا تقم باستدعاء <code>render()</code> على الخادم. يتم إلحاقه بـ <code>document.body</code> المشترك.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>يأخذ منشئ (<code>App()</code>)، مكون (<code>App</code>) أو عقدة DOM. <code>null</code> و<code>undefined</code> يعيدان <code>""</code>. يجب أن يكون الجذر عنصرًا. يجب ألا يأخذ المكون الذي تم تمريره كـ <code>renderToString(Page)</code> أي معلمات، لذا قم بتمرير <code>Page(user)</code> للمكون الذي يأخذ البيانات.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>قيم النص والخصائص المميزة تم تخطيها بواسطة HTML. تتم كتابة النص الموجود داخل <code>script()</code> و<code>style()</code> كما هو، مع تقسيم علامات الإغلاق فقط، لذا لا تضع إدخالات المستخدم هناك أبدًا.</li>
        <li>لا يرمي. إذا تم طرح المكون، أو دالة <code>list()</code> أو شرط <code>when()</code>، أو كان polyfill مفقودًا، فإنه يسجل الخطأ ويعيد <code>""</code>. تحقق من وجود نتيجة فارغة في حالة فشل الطلب. دالة النص أو السمة التي يتم عرضها فارغة فقط.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>نفس <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>يقوم بتغليف المخرجات في عنصر واحد. يتم تعيين <code>containerTag</code> افتراضيًا على <code>"div"</code>، و<code>containerAttrs</code> على <code>{}</code>. يتم هروب قيم السمات. تتم كتابة أسماء السمات كما هو محدد، لذا استخدم أسماء HTML مثل <code>class</code>. لا تقم مطلقًا بتمرير إدخال المستخدم كعلامة.</p>
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
      <p>DOM صغير حتى يتمكن Nuclo من بناء الأشجار في Node وBun. قم باستيراده مرة واحدة، قبل العرض الأول. تحتاج معظم التطبيقات فقط إلى الاستيراد العادي.</p>
      <ul>
        <li>عندما لا يكون هناك <code>window</code>، فإنه يقوم بتعيين <code>globalThis.document</code> و<code>Node</code> و<code>Element</code> و<code>HTMLElement</code>، ولكن فقط تلك المفقودة. لا يقوم بإنشاء <code>window</code>.</li>
        <li>في المتصفح، أو ضمن jsdom، لا يفعل شيئًا.</li>
        <li><code>Event</code> و<code>CustomEvent</code> هما المنشئان الخاصان بوقت التشغيل. <code>Node</code>، <code>Element</code> و<code>HTMLElement</code> هي أسماء مستعارة لفئات polyfill.</li>
      </ul>
      <p>هو DOM لبناء الأشجار وليس متصفح. لا يحتوي على <code>innerHTML</code> ولا <code>getElementById</code>، <code>querySelector()</code> يُرجع <code>null</code>، ويتم تجاهل مستمعي الأحداث. استخدم <code>renderToString()</code> للحصول على HTML.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
