import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "التنسيق",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>يحول كائن تنسيق محدد الأنواع إلى فئات CSS التي تم إنشاؤها. قم بتمرير النتيجة إلى أي دالة بناء الوسوم. في المتصفح، تنتقل القواعد إلى عنصر <code>&lt;style id="nuclo-styles"&gt;</code> واحد. على الخادم، يقوم <a href="#api-css-text"><code>getCssText()</code></a> بإرجاعها.</p>
      ${code("card.ts", `
const card = css({
  p: 16,
  rounded: 8,
  bg: '#fff7ed',
  hover: { bg: '#ffedd5' },
})

const Card = () => div(card, 'Simple card')
`)}
      <ul>
        <li>يقوم <code>css()</code> بإنشاء فئة واحدة لتصريحات CSS الأساسية، بالإضافة إلى فئة واحدة لكل مفتاح زائف ومحدد وكتلة وسائط. البطاقة أعلاه تحصل على فئتين.</li>
        <li>أسماء الأصناف مشتقة من تجزئة المحتوى. تشترك التنسيقات المتطابقة في الصنف نفسه، وينتج الخادم والعميل الأسماء نفسها.</li>
        <li>تعريف الأنماط مرة واحدة، على مستوى الوحدة. يقوم <code>css()</code> بالتخزين المؤقت حسب الكائن، لذلك تتم معالجة كائن جديد في كل استدعاء مرة أخرى في كل مرة.</li>
        <li>تغيير كائن النمط بعد تمريره إلى <code>css()</code> لا يؤدي إلى أي شيء.</li>
        <li>يظل كل نمط مسجلاً طوال عمر الصفحة أو عملية الخادم. بالنسبة للقيم التي تتغير لكل عنصر، مثل العرض من البيانات، استخدم السمة <a href="#attributes"><code>style</code></a>.</li>
      </ul>
      <h3>تنسيقات مسماة</h3>
      <p>قم بتمرير الاسم أولاً للحصول على اسم فئة قابل للقراءة:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>الفئة الأساسية هي الاسم بالضبط. الكتل الأخرى تحصل على <code>name-&lt;hash&gt;</code>.</li>
        <li>يجب أن يكون الاسم اسم فئة صالحًا. وإلا فإن Nuclo يحذر ويولد واحدًا.</li>
        <li>عالمية. إذا كان هناك نمطان مختلفان يستخدمان نفس الاسم، يحذر Nuclo.</li>
      </ul>
      <h3>استخدام النتيجة</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p>يقوم كل من <code>String(card)</code> و<code>card.className</code> بإرجاع أسماء الفئات.</p>
    `,
      },
      {
        id: "style-objects",
        title: "كائنات التنسيق",
        content: `
      <p>يستخدم الكائن الذي تمرره إلى <code>css()</code> خصائص CSS الشائعة في camelCase، ومجموعة من الاختصارات، والمفاتيح المتداخلة للحالات الزائفة، والمحددات، واستعلامات الوسائط. يقوم TypeScript بالإكمال التلقائي لكل منهم. الخصائص خارج مجموعة الخصائص المحددة الأنواع، مثل <code>borderTopLeftRadius</code> أو <code>fill</code> أو <code>paddingInline</code>، تنتقل إلى <code>raw</code> (انظر أدناه).</p>
      <h3>القيم</h3>
      <ul>
        <li>تصبح الأرقام <code>px</code>، باستثناء <code>0</code> والخصائص بدون وحدة: <code>zIndex</code>، <code>opacity</code>، <code>fontWeight</code>، <code>lineHeight</code>، <code>flex</code>، <code>flexGrow</code>، <code>flexShrink</code>، <code>order</code>، <code>aspectRatio</code>، <code>gridColumn</code> و<code>gridRow</code>. في <code>raw</code>، <code>zoom</code>، <code>scale</code>، <code>column-count</code>، <code>orphans</code>، <code>widows</code>، <code>tab-size</code> و<code>animation-iteration-count</code> هي أيضًا بدون وحدات.</li>
        <li>تُكتب السلاسل النصية كما هي. تُتخطى قيم <code>null</code> و<code>undefined</code> و<code>false</code>.</li>
        <li><code>lineHeight</code> (و <code>leading</code>) ليس له وحدة، لذا فإن <code>leading: 24</code> يعني 24 ضعف حجم الخط. اكتب <code>"24px"</code> للبكسل.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>الاختصارات</h3>
      <table>
        <thead><tr><th>المفتاح</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>، <code>pt</code>، <code>pr</code>، <code>pb</code>، <code>pl</code></td><td>padding، وكل منهما الجانب</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>الحشو اليسار واليمين / أعلى وأسفل</td></tr>
          <tr><td><code>m</code>، <code>mt</code>، <code>mr</code>، <code>mb</code>، <code>ml</code>، <code>mx</code>، <code>my</code></td><td>نفس الشيء بالنسبة للهامش</td></tr>
          <tr><td><code>w</code>، <code>h</code>، <code>minW</code>، <code>maxW</code>، <code>minH</code>، <code>maxH</code></td><td>العرض والارتفاع والحد الأدنى والحد الأقصى</td></tr>
          <tr><td><code>size</code></td><td>العرض والارتفاع</td></tr>
          <tr><td><code>bg</code></td><td>الخلفية</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>تأخذ هذه المفاتيح <code>true</code>:</p>
      <table>
        <thead><tr><th>المفتاح</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (لا يتم ضبط العرض)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>الحالات الزائفة</h3>
      <p><code>hover</code>، <code>focus</code>، <code>focusVisible</code>، <code>focusWithin</code>، <code>active</code>، <code>visited</code>، <code>disabled</code>، <code>enabled</code>، <code>checked</code>، <code>required</code>، <code>invalid</code>، <code>valid</code>، <code>readOnly</code>، <code>first</code> (<code>:first-child</code>)، <code>last</code> (<code>:last-child</code>)، <code>only</code> (<code>:only-child</code>)، <code>odd</code>، <code>even</code>، <code>empty</code>، <code>placeholderShown</code>، <code>placeholder</code>، <code>before</code>، <code>after</code>، <code>selection</code>، <code>marker</code>، <code>firstLine</code> و <code>firstLetter</code>. يمكن تداخلها: <code>hover: { focus: {…} }</code> يعطي <code>:hover:focus</code>.</p>
      <h3>المحددات وقواعد at</h3>
      <p>المفتاح الذي يبدأ بـ <code>&amp;</code> هو محدد، وكل <code>&amp;</code> يصبح الفئة. المفتاح الذي يبدأ بـ <code>@</code> هو قاعدة at: <code>@media</code> أو <code>@container</code> أو <code>@supports</code>.</p>
      ${code("menu.ts", `
const menu = css({
  p: 8,
  '& > li': { py: 4 },
  '& > li:hover': { color: 'red' },
  '&:is(.dark *)': { color: 'white' },
  '@media (min-width: 768px)': { p: 16 },
})
`)}
      <ul>
        <li>يجب أن يبدأ المفتاح بـ <code>&amp;</code>. يتم تجاهل مفتاح مثل <code>".dark &amp;"</code>، لذا اكتب <code>"&amp;:is(.dark *)"</code>.</li>
        <li>يتم دمج كتلتين <code>@media</code> المتداخلتين مع <code>and</code>. يتم وضع الاستعلام الذي يقوده نوع الوسائط (<code>print</code>، <code>only screen</code>) أولاً، لأن القواعد النحوية تسمح بالنوع فقط في البداية. الزوج الذي لا يمكن تسطيحه - نوعان من الوسائط، أو <code>not</code> البادئ - يحذر ويستخدم الاستعلام الداخلي وحده. أي قاعدة متداخلة أخرى تحل محل القاعدة الخارجية.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>استخدم <code>raw</code> لأي خاصية، مع كتابة الاسم تمامًا كما هو الحال في CSS. لا تزال الأرقام تحصل على <code>px</code>، لذا قم بتمرير السلاسل:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>يتم تحويل أي مفتاح مسطح آخر إلى صيغة kebab-case ويتم كتابته كما هو، لذا فإن الخطأ المطبعي مثل <code>colr: 'red'</code> يصبح إعلانًا يسقطه المتصفح. يتم تجاهل الكائن المتداخل ضمن مفتاح ليس حالة زائفة أو شاشة أو مفتاح <code>&amp;</code> أو <code>@</code>. يُبلغ TypeScript عن كليهما.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>يجمع بين الأنماط. عندما يقوم مدخلان بتعيين نفس الخاصية، يفوز الإدخال الأحدث.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>تُتخطى المدخلات ذات القيم falsy، ويتم تسوية المصفوفات، ويتم تقسيم السلاسل وإلغاء تكرارها.</li>
        <li>يتم دمج الفئات التي تم إنشاؤها لنفس الكتلة (القاعدة، نفس الزائفة، نفس استعلام الوسائط) في فئة واحدة جديدة. تمر أسماء الفئات الأخرى دون تغيير.</li>
        <li>فقط <code>cx()</code> يعرف ترتيب الوسيطة. باستخدام <code>div(base, blue)</code>، تتم إضافة كلا الفئتين، وتفوز القاعدة التي تم إنشاؤها مؤخرًا. ضع الأنماط التي تتجاوز بعضها البعض في استدعاء <code>cx()</code> واحدة.</li>
        <li>عندما يتم دمج كتلة نمط مسمى مع كتلة إدخال أخرى، تكون الفئة المدمجة هي <code>name-&lt;hash&gt;</code>، وليس الاسم المجرد. الكتل التي لا يتم دمجها تحتفظ بفئتها، لذا فإن <code>cx(pageTitle, 'extra')</code> لا يزال لديه <code>page-title</code>.</li>
      </ul>
      <h3>أصناف CSS الديناميكية</h3>
      <p>قم بتمرير دالة تُرجع <code>cx(...)</code> دائمًا:</p>
      ${code("toggle.ts", `
const baseButton = css({ px: 12, py: 8, border: '1px solid #ccc' })
const activeButton = css({ bg: '#ff3f00', color: 'white' })

let active = false

const Toggle = () =>
  button(
    () => cx(baseButton, active && activeButton),
    () => (active ? 'Active' : 'Inactive'),
    { onClick: () => { active = !active; update() } },
  )
`)}
      <p>يجب أن تقوم الدالة بإرجاع نتيجة النمط عند تشغيلها لأول مرة. يعرض <code>() =&gt; active &amp;&amp; activeButton</code> النص "false" بدلاً من فئة.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>تقوم بإرجاع <code>css</code> و<code>cx</code> و<code>variants</code> و<code>keyframes</code> و<code>globalStyle</code> الخاصة بها والمرتبطة بسمة. يعطي السمة أسماء للقيم: باستخدام السمة أدناه، يكتب <code>borderColor: 'border'</code> <code>#e5e7eb</code>، ويقوم TypeScript بإكمال الأسماء تلقائيًا. يصبح كل إدخال في <code>screens</code> مفتاح نمط لاستعلام الوسائط، مثل <code>md: {…}</code>.</p>
      ${code("theme.ts", `
export const { css, cx, variants } = createCss({
  colors: { primary: '#ff3f00', border: '#e5e7eb' },
  radii: { card: '12px' },
  screens: { md: '(min-width: 768px)' },
})

const panel = css({
  p: 12,
  rounded: 'card',
  border: '1px solid',
  borderColor: 'border',
  md: { p: 24 },
})
`)}
      <table>
        <thead><tr><th> مفتاح السمة</th><th>مستخدم بواسطة</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>، <code>backgroundColor</code>، <code>color</code>، <code>borderColor</code> وكل جانب، <code>outlineColor</code>، <code>caretColor</code>، <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td> مفاتيح النمط الجديدة، مثل <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>يتم حل اسم السمة فقط عندما يكون هو القيمة بأكملها. لم يتم حل <code>border: "1px solid primary"</code>.</li>
        <li>تصبح قيمة الشاشة بدون <code>@</code> <code>@media &lt;value&gt;</code>. يتم استخدام القيمة التي تبدأ بـ <code>@</code> كما هو مكتوب، على سبيل المثال <code>"@container (min-width: 400px)"</code>.</li>
        <li>مفاتيح الشاشات متاحة فقط في المثيلات التي تنشئها <code>createCss()</code>. لا تتوفر هذه المفاتيح في <code>css()</code> العامة، لكنها تقبل مفاتيح <code>@media</code>.</li>
        <li>تتشارك كافة المثيلات والمساعدين العموميين في ورقة أنماط واحدة. يتم إخراج قواعد وسائط الشاشة بالترتيب الذي تم به الإعلان عن الشاشات، وليس الترتيب الذي تستخدمها به، لذا قم بإدراج شاشات <code>min-width</code> من الصغيرة إلى الكبيرة. استخدم مثيل <code>createCss()</code> واحد لكل تطبيق، بحيث يكون هذا الترتيب هو الموجود في قالبك.</li>
        <li><code>theme</code> على النتيجة هو كائن السمة الذي مررته.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>ينشئ دالة تقوم بإرجاع نمط لمجموعة من الخيارات، مثل وظيفة الزر وحجمه.</p>
      ${code("button.ts", `
const buttonClass = variants({
  base: { px: 12, py: 8, rounded: 6 },
  variants: {
    intent: { primary: { bg: '#2563eb' }, danger: { bg: '#dc2626' } },
    size: { sm: { text: 12 }, lg: { text: 18 } },
    block: { true: { w: '100%' } },
  },
  defaultVariants: { intent: 'primary', size: 'sm' },
  compoundVariants: [{ intent: 'danger', size: 'lg', css: { weight: 700 } }],
})

button(buttonClass(), 'Save')                                                // primary, sm
button(buttonClass({ intent: 'danger', size: 'lg', block: true }), 'Delete') // bold, full width
`)}
      <ul>
        <li>يتم دمج الأنماط بهذا الترتيب: <code>base</code>، القيمة المختارة لكل مجموعة، ثم كل مركب مطابق. تفوز الأنماط اللاحقة لكل خاصية.</li>
        <li>يستخدم الخيار <code>undefined</code> أو <code>null</code> الخيار الافتراضي. يتم تخطي المجموعة التي ليس لها أي إعدادات افتراضية.</li>
        <li>المجموعة التي تحتوي على مفاتيح <code>true</code> و<code>false</code> فقط تأخذ قيمة منطقية.</li>
        <li>يتم تطبيق المركب عندما تتطابق كل مجموعة يدرجها، بما في ذلك الإعدادات الافتراضية.</li>
        <li>يتم إنشاء كل تحديد مرة واحدة وتخزينه مؤقتًا.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() وglobalStyle()",
        content: `
      <p><code>keyframes()</code> يسجل رسمًا متحركًا ويعيد اسمه الذي تم إنشاؤه. مفاتيح الإطار هي <code>from</code> و<code>to</code> والنسب المئوية، مثل <code>"50%"</code> أو <code>"0%, 100%"</code>. تأخذ الإطارات خصائص مسطحة فقط. الإطارات المتطابقة ترجع نفس الاسم.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> يضيف قاعدة لأي محدد:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>يتم استخدام المحدد تمامًا كما هو مكتوب.</li>
        <li>تعمل الخصائص المسطحة فقط. يتم تجاهل المفاتيح الزائفة والشاشات ومفاتيح <code>@</code>، لذا لا يمكن لـ <code>globalStyle()</code> كتابة قواعد الوسائط.</li>
        <li>تتم إضافة نفس القاعدة مرة واحدة. يضيف النمط المختلف لنفس المحدد قاعدة ثانية، وتفوز القاعدة اللاحقة.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() وresetStyles()",
        content: `
      <p><code>getCssText()</code> تقوم بإرجاع كل قاعدة أنشأتها <code>css()</code> و<code>cx()</code> و<code>variants()</code> و<code>keyframes()</code> و<code>globalStyle()</code> في هذه العملية: القواعد الأساسية أولاً، ثم <code>@media</code> و<code>@container</code> و كتل <code>@supports</code>. استخدمها للتصيير على الخادم.</p>
      <ul>
        <li>استدعها بعد <code>renderToString()</code>. يتم تضمين القواعد التي تم إنشاؤها أثناء العرض.</li>
        <li>يغطي العملية بأكملها، وليس صفحة واحدة أو طلبًا واحدًا، وينمو فقط. وهذا أمر آمن، لأن أسماء الفئات هي تجزئات للمحتوى.</li>
        <li>ضعه في <code>&lt;style id="nuclo-styles"&gt;</code>. يعيد العميل استخدام هذا العنصر ويتخطى القواعد الموجودة فيه بالفعل. باستخدام معرف آخر، أو لا شيء، يضيف العميل ورقة أنماط ثانية مع كل قاعدة مرة أخرى.</li>
        <li>لا تُحوَّل المحارف الخاصة في النص إلى كيانات HTML، لذلك لا تقم أبدًا بإدخال مدخلات غير موثوقة في قيم النمط.</li>
      </ul>
      <p><code>resetStyles()</code> هو مساعد اختبار. فهو يزيل كل قاعدة وعنصر <code>#nuclo-styles</code>. تحتفظ الأنماط التي قمت بإنشائها سابقًا بأسماء فئاتها ولكنها تفقد CSS الخاصة بها. لا تستدعها في التطبيق أو على الخادم.</p>
      ${code("setup.test.ts", `
import { resetStyles } from 'nuclo'

beforeEach(() => resetStyles())
`)}
    `,
      },
    ],
  },

  // ── Routing ──────────────────────────────────────────────────────────────
  {
    title: "التوجيه",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>حزمة منفصلة: </strong> <code>nuclo-router</code> ليست جزءًا من الحزمة الأساسية Nuclo. قم بتثبيته بجوار <code>nuclo</code>. إنه إصدار معاينة، لذلك قد يتغير API الخاص به.</div>
      <p>موجّه لـ Nuclo يدعم التصيير على الخادم والترطيب وتقسيم كود المسارات والتحميل المسبق وقت الخمول، ومبني على <code>list()</code> و<code>update()</code>. حجمه نحو ${NUCLO_ROUTER_GZIP_KB} كيلوبايت بعد ضغط gzip، ولا يعتمد إلا على Nuclo نفسه. وبفضل خلوّه من الآثار الجانبية، تستطيع أدوات البناء استبعاده عند عدم استخدامه.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>أو استخدم <code>pnpm add</code> أو <code>yarn add</code> أو <code>bun add</code> بنفس الاسمين. يحتاج إلى <code>nuclo</code> 0.3 أو أحدث باعتباره تبعية نظير.</p>
      <p>يحدد الموجّه <em>ما يُحمَّل</em>، ويحدد التطبيق <em>موضع عرضه</em> باستخدام <code>router.outlet()</code>: استدعاء <code>list()</code> واحد يعرض مكدس الطبقات، بصف لكل طبقة، فتكون الصفحة العادية صفًا واحدًا. يبني الخادم والعميل الشجرة نفسها، لذا يعيد <code>hydrate()</code> استخدام عقد الخادم. ويعتمد ما تبقّى على <code>history</code> ومستمع <code>click</code> مفوّض واحد و<code>requestIdleCallback</code>.</p>
      <h3>استيراد واحد</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p>ينتظر <code>start()</code> تحميل وحدات المسار المطابق قبل اكتماله، فتكون الشجرة الأولى مكتملة على الخادم والعميل. بعد ذلك، تقرأ خصائص الموجّه ودواله المسار الذي بدأه: <code>router.path</code> و<code>router.pending</code> و<code>router.go()</code>.</p>
      <h3>تطبيق كامل</h3>
      ${code("routes.ts", `
// isomorphic: imported by the browser and the server
import { createRouter } from 'nuclo-router'

export const router = createRouter({
  '/':           () => import('./pages/Home.ts'),
  '/docs':       () => import('./pages/Docs.ts'),
  '/blog/:slug': () => import('./pages/Post.ts'),
  '*':           () => import('./pages/NotFound.ts'),
})

export const App = () =>
  div(
    header(a({ href: router.href('/') }, 'Home'), a({ href: router.href('/docs') }, 'Docs')),
    main(
      when(() => router.pending, Spinner()),
      when(() => router.error !== null, ErrorView()),
      router.outlet(),   // where the pages land
    ),
    footer('© nuclo'),
  )
`)}
      ${code("pages/Post.ts", `
import type { RouteContext } from 'nuclo-router'
import { router } from '../routes.ts'

// A page is plain content
export default function Post(ctx: RouteContext) {
  // A query-only change keeps the page, so the query is read live.
  return article(h1(ctx.params.slug), p(() => (router.search.has('preview') ? 'draft' : '')))
}
`)}
      ${code("main.ts", `
import 'nuclo'
import { router, App } from './routes.ts'

await router.start()
hydrate(App, document.getElementById('app')!)   // or render() without SSR
`)}
      ${code("server.ts", `
import 'nuclo/polyfill'
import 'nuclo'
import { renderToString } from 'nuclo/ssr'
import { router, App } from './routes.ts'

// one Route per request
const route = await router.start(request.url)
const html = route.run(() => renderToString(App))
`)}
      <p>هذا هو التكامل بأكمله. تعمل الروابط لأن <code>&lt;a href&gt;</code> هو مجرد <code>&lt;a href&gt;</code>. يعترض مستمع واحد مفوض على <code>document</code> الروابط التي يمتلكها الموجّه ويترك كل الروابط الأخرى للمتصفح.</p>
      <p>على الخادم، تقوم <code>start()</code> بإرجاع <code>Route</code> لكل طلب وتترك الموجّه بمفرده، لذلك لا يمكن للطلبات المتزامنة رؤية مسار بعضها البعض. <code>route.run()</code> يجعل ذلك المسار هو الذي يقرأه الموجّه، وبالتالي المنفذ، طوال مدة العرض. يوجد في المتصفح مسار واحد لكل تحميل صفحة، ويجعله <code>start()</code> ملكًا للموجّه. ليست هناك حاجة إلى <code>run()</code>.</p>
      <p>تتلقى الصفحة <a href="#router-api"><code>RouteContext</code></a> و<a href="#router-api"><code>PageProps</code></a>، كـ <code>(ctx, { layer, data, outlet, beforeLeave })</code>، وقد تأخذ وسائط أقل. تقوم بإرجاع أي شيء يقبله <code>list()</code>. لملء جزء آخر من التخطيط أيضًا، قم بإرجاع <code>into()</code> من داخل الصفحة، مثل <code>div(article(…), into('sidebar', nav(…)))</code>. يغادر هذا المحتوى مع الصفحة. راجع <a href="#router-regions">الصفحات &amp; المناطق </a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "الأنماط والمسارات المتداخلة",
        content: `
      <table>
        <thead><tr><th>النمط</th><th>ما يطابقه</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>، <code>/docs/intro</code></td><td> بالضبط ذلك المسار</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>أي شيء لا مثيل له، ويعرض صفحة 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>تُفحص المسارات الثابتة أولًا، ثم الديناميكية بترتيب تعريفها، ثم المسارات الشاملة مع تقديم أطول بادئة. لذا فإن <code>'*'</code> يطابق فقط ما لم يطابقه أي مسار آخر ويمكن وضعه في أي موضع من الجدول. تتم تسوية الخطوط المائلة الزائدة والشرطة المائلة المكررة وترميز النسبة المئوية، ويتم فك تشفير القيم المعلمية. المطابقة هي مقارنة مقطعية لكل نمط. لم يتم إنشاء أو تشغيل أي تعبيرات عادية.</p>
      <h3>المسارات النسبية</h3>
      <p>النمط المكتوب بـ <code>./</code> يتعلق بالأصل الذي يعلن عنه، و href المكتوب بـ <code>./</code> يتعلق بالمسار النشط. يصنعون معًا قسمًا قابلاً لإعادة الاستخدام ويعني نفس الشيء تحت كل والد. قيمة الجدول هي إما محمل أو جدول آخر، مفاتيحه مرتبطة به:</p>
      ${code("records/routes.ts", `
import type { RouteTable } from 'nuclo-router'

// a section, with no idea where it lives
export const recordSection: RouteTable = {
  '/':             () => import('./Record.ts'),   // the parent path itself
  './preview':     () => import('./Preview.ts'),
  './preview/raw': () => import('./Raw.ts'),
}
`)}
      ${code("routes.ts", `
// declare it wherever it belongs
createRouter({
  '/': () => import('./pages/Home.ts'),
  '/invoices/:id':  recordSection,
  '/customers/:id': recordSection,
  '*': () => import('./pages/NotFound.ts'),
})
`)}
      <p>ينتج عن هذين السطرين جميع الأنماط الستة دون كتابة أي مسار مرتين. يحصل كلا العناصر الأبوية على نفس كائنات المُحمل، لذلك يتشاركان في وحدة تخزين مؤقت واحدة ووحدة <code>import()</code> واحدة.</p>
      <ul>
        <li>داخل الجدول الفرعي، <code>'./x'</code>، <code>'/x'</code> و<code>'x'</code> جميعها تعني نفس الشيء، <code>'/'</code> تعني المسار الأصلي نفسه، و<code>'*rest'</code> يعطي القسم خاصية التقاط الكل الخاصة به. التعشيش عميق كما تريد.</li>
        <li>يتم استخدام مفاتيح المستوى الأعلى كما هو مكتوب، لذا يبقى <code>'*'</code> <code>'*'</code>.</li>
        <li>تؤدي إضافة مسار فرعي تحت مسار أبوي من نوع <code>*catch-all</code> إلى خطأ في <code>createRouter()</code>، لأن الجزء الشامل يجب أن يكون في نهاية النمط.</li>
      </ul>
      <h3>الصفحات الأبوية و<code>outlet()</code></h3>
      <p>تشكّل الصفحة الأبوية وصفحاتها الفرعية تسلسلًا هرميًا حقيقيًا. تُصيَّر الصفحة الأبوية ويُصيَّر مسارها الفرعي داخلها في موضع استدعاء <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>التنقل بين العناصر الفرعية لا يؤدي إلى إعادة بناء الأصل. عقدة DOM الخاصة بها هي نفس العقدة، لذا فإن تركيزها وموضع التمرير الخاص بها والمدخلات نصف المكتوبة وأي حالة في إغلاقها كلها باقية.</p>
      <ul>
        <li>الصفحة التي لا تحتوي على مسار فرعي لا تعرض أي شيء من منفذها، لذلك يمكن للتخطيط استدعائها دون قيد أو شرط. إذا لم تستدعِ الصفحة الأبوية <code>outlet()</code>، فلن يظهر مسارها الفرعي.</li>
        <li>لا توجد مسارات فهرس. <code>'/'</code> هو التخطيط نفسه، لذا فإن المسار الأصلي يعرض التخطيط بمنفذ فارغ بدلاً من صفحة فهرس منفصلة بداخله. ضع المحتوى المقصود في التخطيط، أو أعطه مسارًا فرعيًا حقيقيًا.</li>
      </ul>
      <p>تعمل الاستدعاء نفسه من أي من العناصر الأبوية، ومن صفحة لا تعرف الصفحة الموجودة فيها:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>، <code>../x</code>، <code>.</code> و<code>..</code> يتم حلها وفقًا لمسار المسار الحالي، وليس "دليل" عنوان URL. من <code>/invoices/42</code>، <code>./preview</code> هو <code>/invoices/42/preview</code>، بينما يحلّها المتصفح إلى <code>/invoices/preview</code>، ولا تغير الشرطة المائلة اللاحقة على عنوان URL شيئًا. ينتقل <code>../</code> إلى أعلى المقطع ويتوقف عند الجذر. يُحتفَظ بالاستعلام والجزء #hash، وإعادة إضافة <code>base</code>، والمسار المطلق الذي تم حله هو ما يدخل في السجل. هذا هو نفس الانحراف عن حل عنوان URL الذي يقوم به React Router لـ <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>فقط <code>./</code> و<code>../</code> مرتبطان بالمسار. يتم ترك <code>preview</code> العاري في href لقواعد المتصفح العادية.</li>
        <li>أنشئ روابط نسبية باستخدام <code>router.href('./preview')</code> بدلاً من كتابة <code>href="./preview"</code> يدويًا. يتم حل <code>href()</code> في وقت العرض، وبالتالي فإن العلامات التي يتوفرها تكون مطلقة ولا تزال صحيحة للزاحف، وللنقرة بالزر الأوسط، وعند تعطيل JavaScript.</li>
      </ul>
      <h3>ما يُحتفَظ به وما يُعاد بناؤه</h3>
      <table>
        <thead><tr><th>العقدة</th><th>عند التنقل</th></tr></thead>
        <tbody>
          <tr><td>صفحة أبوية لم يتغير نمطها أو مسارها</td><td><strong>يُحتفَظ بها</strong>: العقدة نفسها، ولا تُشغَّل <code>load()</code> الخاصة بها مجددًا</td></tr>
          <tr><td>الصفحة المطابقة </td><td><strong>يُحتفَظ به</strong> عندما لا يتغير نمطها ومسارها ولا تحتوي على <code>load()</code>، لذلك يحتفظ بها الاستعلام أو تغيير التجزئة. يتم تحديث المسار المزود بالمحمل في كل زيارة.</td></tr>
          <tr><td>الوالد الذي تغير مساره</td><td>أعيد بناؤه، بالإضافة إلى كل شيء تحته</td></tr>
          <tr><td>الطبقة المضافة </td><td> تعرض الصفحة المطابقة وحدها. تم تثبيت أصولها بالفعل في الصف الموجود أسفلها.</td></tr>
        </tbody>
      </table>
      <p>تحافظ الصفحة المحفوظة على <code>ctx</code> التي تم إنشاؤها بها. هذا هو معنى <code>ctx</code> في كل مكان: اقرأ <code>router.*</code> للقيم الحية. الحالة المستندة إلى الاستعلام، مثل المرشحات وتقسيم الصفحات وعلامات التبويب، تقرأ <code>router.search</code> داخل قيمة ديناميكية وتكتب باستخدام <code>router.go('?page=2', { replace: true })</code>. تبقى الصفحة وتركيزها ومدخلاتها نصف المكتوبة في مكانها.</p>
    `,
      },
      {
        id: "router-regions",
        title: "الصفحات والمناطق",
        content: `
      <p><code>router.outlet()</code> يضع الصفحة في مكان واحد. الصفحة التي تحتاج أيضًا إلى شريط جانبي أو شريط أدوات أو عنوان في مكان آخر في التخطيط، تملأها بـ <a href="#api-region"><code>into()</code></a>. يحدد التخطيط المكان بـ <code>region()</code>، وتقوم الصفحة بإرجاع <code>into()</code> بجوار المحتوى الخاص بها. لا يتلقى التخطيط أبدًا محتوى الصفحة كخاصية، ولا يعيد التنقل بناءه أبدًا.</p>
      ${code("app.ts", `
export const App = () =>
  div(
    aside(
      input({ placeholder: 'Filter' }),   // keeps its text across navigations
      region({ id: 'sidebar', empty: p('Nothing to show.') }),
    ),
    main(router.outlet()),
  )
`)}
      ${code("pages/Post.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return div(
    article(h1(post.title), p(post.body)),
    into('sidebar', nav(h2('In this post'), ul(list(() => post.headings, (h) => li(h))))),
  )
}
`)}
      <p>محتوى الصفحة عبارة عن صف من <code>list()</code> الخاص بمنفذ العرض، ويعيش <code>into()</code> طالما أن الصف الذي يحمله. وبالتالي فإن محتوى الشريط الجانبي يصل مع الصفحة ويغادر معها: يؤدي الانتقال إلى صفحة بدون <code>into('sidebar', …)</code> إلى إظهار محتوى <code>empty</code> للمنطقة مرة أخرى. يمكن للصفحة استخدام <code>ctx</code> و<code>data</code> لكلا الجزأين، حيث تم إنشاء كليهما بنفس الدالة.</p>
      <h3>ما يحدث عند التنقل</h3>
      <ul>
        <li><strong>الصفحة المحفوظة تحافظ على مناطقها. </strong> استعلام أو تغيير تجزئة <a href="#router-patterns"> يحافظ على الصفحة </a> لا يمس محتوى المنطقة أيضًا. اقرأ <code>router.search</code> داخل قيمة ديناميكية إذا كان الشريط الجانبي يعتمد عليها.</li>
        <li>تقوم الصفحة المعاد بناؤها <strong>بإعادة ملئها. </strong> عندما يتغير المسار، تتم إزالة الصف القديم وتتولى طرق عرض <code>into()</code> للصفحة الجديدة. لم يبق شيء وراءهم.</li>
        <li><strong>تضيف الطبقة عرضًا جديدًا.</strong> الطبقة صف لاحق في منفذ العرض، لذا يمثل <code>into()</code> الخاص بها عرضًا أحدث للمنطقة نفسها. مع القيمة الافتراضية <code>type: 'latest'</code>، يحل محل عرض الصفحة حتى إغلاق الطبقة، ثم يظهر عرض الصفحة مجددًا. ومع <code>type: 'stack'</code> يظهر العرضان.</li>
        <li><strong>يمكن للصفحة الرئيسية أن تملأ المناطق أيضًا. </strong> تظل عروضها بينما تتغير فروعها، لأنه لم تتم إعادة بناء الصفحة الرئيسية.</li>
        <li><strong>يعمل التصيير على الخادم مباشرة. </strong> يقوم الخادم بإنشاء الصفحة داخل <code>route.run()</code>، لذا فإن عروض <code>into()</code> الخاصة به موجودة في HTML، ويعيد <code>hydrate()</code> استخدام عقدها.</li>
      </ul>
      <h3>عدة مناطق من صفحة واحدة</h3>
      <p>قم بتمرير كائن لملء أكثر من منطقة في وقت واحد. لا يزال المحتوى الرئيسي للصفحة يمر عبر المنفذ، لذا قم بإعادته بجانب <code>into()</code>:</p>
      ${code("pages/Report.ts", `
export default function Report(ctx: RouteContext) {
  return div(
    table(…),
    into({
      toolbar: [button('Export'), button('Print')],
      sidebar: nav(a({ href: router.href('./summary') }, 'Summary')),
    }),
  )
}
`)}
      <h3>اختيار الأداة المناسبة للمهمة</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> مخصص لمسار فرعي: المحتوى الذي يقرره عنوان URL، ويتم عرضه داخل صفحته الأصلية. راجع <a href="#router-patterns"> المسارات المتداخلة </a>.</li>
        <li><strong><code>into()</code></strong> مخصص للصفحة المطابقة التي تنشر نفسها عبر التخطيط. ينتمي المحتوى إلى الصفحة ويستخدم بياناتها.</li>
        <li><strong><code>matches()</code></strong> مخصص للتخطيط الذي يتم تحديده من خلال عنوان URL وحده، مع جدول صغير خاص به ولا يتضمن أي صفحة. انظر <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>تنتمي كل هذه العناصر إلى المسار المطابق الواحد. لا يقوم الموجّه بتوجيه منطقتين مستقلتين من عنوان URL واحد، لذا فإن الشريط الجانبي بمساراته الخاصة هو منطقة تملأها الصفحة، وليس منفذًا ثانيًا. الشريط الجانبي الذي يريد حقًا الموجّه الخاص به، والتحميل والرجوع، يبقيه غير قيد التشغيل ويتم حله باستخدام <code>match()</code> - راجع <a href="#router-multi">الموجّهات المتعددة &amp; التحميل المشترك</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "محمّلات المسارات وتقسيم الكود",
        content: `
      <p>قد تقوم وحدة الصفحة بتصدير دالة <code>load</code>. يتم تشغيله قبل إنشاء الصفحة، في كل تنقل إلى ذلك المسار، وأي شيء يتم إرجاعه يتم تسليمه إلى الصفحة باسم <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>جدول التوجيه لم يتغير. يتوفر المحمّل مع وحدة الصفحة. إنها تحصل على <code>RouteContext</code> المطابق، لذا فإن <code>params</code>، <code>search</code> و<code>path</code> كلها متاحة. قد تكون متزامنة أو غير متزامنة، ويتم تشغيلها على الخادم أيضًا، لذا يتوفر الصفحة المعروضة بواسطة الخادم مع بياناتها الموجودة بالفعل في HTML بدلاً من جلبها بعد الترطيب.</p>
      <p><strong> تم تخزين الوحدة مؤقتًا. البيانات ليست كذلك.</strong> يتم جلب قطعة المسار مرة واحدة وإعادة استخدامها، ويتم تشغيل المحمّل الخاصة بها مرة أخرى في كل تنقل. ولهذا السبب لا يمكن الخلط بين <code>/blog/a</code> و<code>/blog/b</code>، ولماذا يمكن ببساطة إعادة محاولة المحمّل الفاشلة.</p>
      <table>
        <thead><tr><th>الحالة</th><th>السلوك</th></tr></thead>
        <tbody>
          <tr><td>أثناء تشغيله</td><td><code>router.pending</code> بقيمة true والصفحة التي كنت عليها تبقى معروضة</td></tr>
          <tr><td>يرمي استثناءً أو يُرفض الوعد الذي يُرجعه</td><td>يُحفظ الخطأ في <code>router.error</code>. لا يُرفض وعد <code>go()</code>، ويمكن إعادة محاولة التنقل.</td></tr>
          <tr><td>أثناء <code>start()</code></td><td>يخرج الرفض من <code>start()</code>. لا يوجد طريق بعد لوضعه.</td></tr>
          <tr><td>الطبقة المضافة </td><td> تدير المُحمل الخاص بها، مع بياناتها الخاصة </td></tr>
          <tr><td>التحميل المسبق وقت الخمول</td><td>يحمّل الوحدات فقط، ولا يجلب البيانات: لا يملك سياقًا يمرّره للمحمّل، وقد لا يزور المستخدم ذلك المسار أبدًا.</td></tr>
          <tr><td> إعادة التنقل إلى نفس URL</td><td>يتم تشغيل المُحمل مرة أخرى وإعادة بناء الصف. المسار الذي لا يحتوي على محمّل يحتفظ بصفه.</td></tr>
        </tbody>
      </table>
      <p>لإعادة التحقق، انتقل إلى المكان الذي تتواجد فيه بالفعل دون إضافة إدخال سجل:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>بدء تحميل البيانات مع جزء الكود</h3>
      <p>يمكن تشغيل <code>load</code> الذي تم تصديره بواسطة وحدة الصفحة فقط بمجرد وصول هذه الوحدة، لذا فإن التنقل البارد يجلب القطعة، ثم البيانات. لبدء تشغيلهما معًا، قم بتعريف المُحمل في الجدول باستخدام <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>إنه يحل محل <code>load</code> الخاص بالوحدة ويعمل في كل زيارة مثلها. يحدث الرفض أثناء استمرار تحميل القطعة على <code>router.error</code> مثل أي قطعة أخرى.</p>
      <p>لا يوجد تسلسل لبيانات الخادم في HTML حسب التصميم. يعمل <code>load</code> الخاص بالعميل مرة أخرى على الترطيب. إذا كان ذلك مهمًا، فاطلب من الخادم إصدار <code>route.data</code>، على سبيل المثال <code>window.__DATA__</code>، وسيأخذه المُحمل أولاً. <code>route.data</code> هي بيانات الصفحة المطابقة فقط. نتيجة <code>load()</code> لأحد العناصر الأبوية ليست موجودة عليه.</p>
      <h3>تقسيم الكود والتحميل المسبق</h3>
      <p>قيمة المسار هي دائمًا دالة تُرجع مكون الصفحة، لذلك يتم الوصول إلى المكون بتكاسل:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>فقط الأشكال على شكل وحدة يمكن أن تحمل تصدير <code>load</code>. يؤدي اختيار مكون مسمى باستخدام <code>.then(m =&gt; m.BPage)</code> إلى تسليم الدالة للموجّه وحده.</p>
      <p>يتم استيراد كل وحدة مرة واحدة وتخزينها مؤقتًا. تشترك عمليات التنقل المتزامنة لنفس المسار في <code>import()</code> واحد. بمجرد أن يترك المستخدم الصفحة بمفردها لـ <code>idleTimeout</code> (ثانية افتراضيًا؛ بدون نقرات أو مفاتيح أو عجلة أو تمرير)، يتم تحميل المسارات المتبقية في الخلفية، مسار واحد لكل شريحة خاملة (<code>requestIdleCallback</code>). يؤدي أي إدخال أو تنقل ينتظره المستخدم إلى إيقافه مؤقتًا حتى تصبح الصفحة خاملة مرة أخرى.</p>
      <p>المسار المحمَّل مسبقًا أو المتاح مباشرة لا يغيّر <code>router.pending</code>، ويظهر قبل رسم الإطار التالي، فلا يظهر مؤشر تحميل عابر ولا يتغير التخطيط بسببه. تعبّر <code>router.pending</code> فقط عن انتظار وحدة أو محمّل، وتظل الصفحة السابقة معروضة خلال الانتظار. يُحفظ فشل تحميل جزء الكود في <code>router.error</code> بدلًا من رفض وعد غير معالج، ويمكن إعادة المحاولة.</p>
    `,
      },
      {
        id: "router-api",
        title: "واجهة API للموجّه",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> يقوم بتعيين نمط إلى محمّل، أو إلى جدول متداخل. الخيارات:</p>
      <table>
        <thead><tr><th>الخيار</th><th>القيمة الافتراضية</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL البادئة التي يتم تقديم التطبيق ضمنها، مثل <code>'/docs'</code>. إنه يتطابق فقط عند حدود المقطع: <code>/docs/intro</code> موجود داخل <code>'/docs'</code>، <code>/docsearch</code> ليس كذلك. عناوين URL الموجودة خارجه لا تتطابق مع أي شيء، لذلك يرفض <code>start()</code> (404 من جانب الخادم الخاص بك) ويتم ترك الروابط إليها في المتصفح.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td> قم بتحميل وحدات المسارات المتبقية في الخلفية بمجرد أن تكون الصفحة خاملة. <code>false</code> يقوم بإيقاف تشغيله.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td> ميلي ثانية بدون نقرات أو مفاتيح أو عجلة أو تمرير قبل بدء التحميل المسبق، أو استئنافه بعد أن كان المستخدم مشغول.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>، يتم استدعاؤه بعد كل تنقل تم حله في المتصفح، بما في ذلك التنقل الأولي، بعد مزامنة DOM. <code>kind</code> هو <code>'start'</code> أو <code>'push'</code> أو <code>'replace'</code> أو <code>'pop'</code> (للخلف أو للأمام أو <code>close()</code>) أو <code>'layer'</code>. الخطاف الخاص بـ <code>document.title</code> والعلامات الوصفية والتركيز والتمرير والتحليلات. لم يتم الاتصال مطلقًا أثناء SSR.</td></tr>
        </tbody>
      </table>
      <p>يوفر الموجّه <code>start()</code> و<code>match()</code> و<code>outlet()</code> و<code>matches()</code>، وجميع أعضاء <code>Route</code> باستثناء <code>run()</code>. تقرأ هذه الأعضاء المسار النشط: آخر مسار أعاده <code>start()</code> في المتصفح، أو المسار الذي يُنفَّذ <code>run()</code> له على الخادم. تؤدي قراءة عضو من دون مسار نشط إلى رمي استثناء. يحتفظ الموجّه بجدول المسارات والمطابِق المصرّف وذاكرة الوحدات المؤقتة، فتتشاركها الطلبات على الخادم.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>يحل <code>url</code> (الافتراضي: <code>location.href</code> في المستعرض) إلى وحدات الصفحة الخاصة به ويعيد <code>Promise&lt;Route&gt;</code>. يتم الرفض عندما لا يتطابق أي شيء ولا يحتوي الجدول على مسار <code>'*'</code>. على الخادم، هذا هو 404 الخاص بك. في المتصفح، يقوم أيضًا بجعل المسار نشطًا للموجّه، وإرفاق <code>popstate</code> ومستمعي <code>click</code> المفوضين وجدولة التحميل المسبق. يوقف استدعاء <code>start()</code> الثاني المسار السابق. على الخادم، لا يمس أي شيء مشترك، لذا يتم عرضه داخل <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>يحل عنوان URL مقابل الجدول دون تحميل أي شيء: لا يوجد استيراد، ولا سجل، ولا مستمعون، ولا مسار. تقوم بإرجاع <code>RouteContext</code>، أو <code>null</code> عندما يكون عنوان URL خارج <code>base</code>، أو لا يتطابق مع أي نمط، أو في المتصفح، يكون من أصل آخر. عناوين URL المطلقة فقط، نظرًا لأن حل <code>./</code> تحتاج إلى مسار نشط.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>صفحات المسار النشط كـ <code>list()</code>. ضعه مرة واحدة، أينما ذهبت الصفحات. الطبقة المضافة هي صف لاحق منها. وهو فارغ قبل حل <code>start()</code> وبعد <code>stop()</code>. يعرض على الخادم المسار الذي يتم تنفيذ <code>run()</code> الخاص به.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>يعرض عرض الجدول الثاني الذي يطابق المسار النشط، مثل <code>list()</code> الذي تضعه في أي مكان. انظر <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>كل عضو باستثناء <code>run()</code> موجود أيضًا على الموجّه، حيث يقرأه التطبيق.</p>
      <table>
        <thead><tr><th>عضو</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>المطابقة النشطة. <code>search</code> كائن <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> و<code>url</code> قيم حية.</td></tr>
          <tr><td><code>pending</code></td><td>التنقل في انتظار وحدة نمطية أو محمل</td></tr>
          <tr><td><code>error</code></td><td>آخر تحميل فاشل، تم مسحه بواسطة التنقل التالي</td></tr>
          <tr><td><code>data</code></td><td>نتيجة <code>load()</code> للصفحة المطابقة، لتمريرها من الخادم بعد تسلسلها. لا تتضمن بيانات الصفحات الأبوية.</td></tr>
          <tr><td><code>depth</code></td><td>عدد الطبقات الموجودة في المكدس (طبقة واحدة للصفحة العادية)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>ينتقل ويحمّل الوحدة عند الحاجة. لا يُرفض وعده مطلقًا: يُحفظ فشل الوحدة، سواء برفض الوعد أو رمي استثناء، في <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>يفتح المسار كطبقة جديدة في الأعلى، ويُرجع وعدًا يكتمل بنتيجة إغلاقها. يقبل <code>./</code>. يُرفض الوعد عند غياب تطابق أو فشل الوحدة.</td></tr>
          <tr><td><code>href(path)</code></td><td>يضيف بادئة <code>base</code> إلى المسار لاستخدامه في <code>a({ href })</code>. يحل <code>./</code> و<code>../</code> نسبةً إلى المسار النشط.</td></tr>
          <tr><td><code>stop()</code></td><td>يفصل المستمعات ويلغي الطبقات المفتوحة ويفرغ منفذ العرض. يمكن تكرار استدعائه بأمان. يحتفظ المسار المتوقف بآخر مطابقة، لكن <code>go()</code> لا يفعل شيئًا.</td></tr>
          <tr><td><code>run(fn)</code></td><td> استدعِ <code>fn</code> باستخدام هذا المسار باعتباره المسار النشط للموجّه وقم بإرجاع نتيجته: <code>route.run(() =&gt; renderToString(App))</code> على الخادم. متزامن فقط. يتوقف المسار عن النشاط عند عودة <code>fn</code>.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>الوسيطة الأولى للصفحة: <code>path</code>، <code>pattern</code>، <code>params</code>، <code>search</code>، <code>hash</code>، <code>url</code>. إنه السياق الذي تم إنشاء الصفحة به. اقرأ <code>router.*</code> لمعرفة القيم الحية. وهي تختلف فقط عندما يتغير الاستعلام أو التجزئة دون إعادة البناء.</p>
      <p><code>params</code> هو <code>{ [name]: string }</code> بشكل افتراضي. يمكن للصفحة استنتاج أنواعها من النمط الخاص بها باستخدام <code>Params</code>، والذي يحول <code>'/blog/:slug'</code> إلى <code>{ slug: string }</code> و<code>'/files/*rest'</code> إلى <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>الوسيطة الثانية للصفحة. استخدم تفكيك الكائن لاستخراج ما تحتاجه الصفحة.</p>
      <table>
        <thead><tr><th>الخاصية</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>حيث توجد الصفحة في المكدس. انظر <code>Layer</code> أدناه.</td></tr>
          <tr><td><code>data</code></td><td> ما عاد به المسار <code>load()</code>، أو <code>undefined</code> بدون واحد. يُحدَّد نوعها باستخدام <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>حيث تعرض الصفحة الرئيسية مسارها الفرعي. راجع <a href="#router-patterns"> المسارات المتداخلة</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>يسجّل دالة تحقق تُستدعى قبل مغادرة الصفحة. راجع <a href="#router-layers">حواجز المغادرة</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>حيث توجد الصفحة في المكدس، وطريقها للخروج.</p>
      <table>
        <thead><tr><th>عضو</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 للصفحة الأساسية، 1 وما فوق للطبقات المضافة</td></tr>
          <tr><td><code>push(href)</code></td><td>افتح طبقة أخرى من داخل الصفحة، مثل <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>يغلق هذه الطبقة وكل ما فوقها، ويُكمل وعد <code>push()</code> الذي فتحها. من دون وسيطة، تُعدّ الطبقة ملغاة وتكون النتيجة undefined. لا يفعل شيئًا عند العمق 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> و<code>withLoad()</code></h3>
      <p><code>DataLoader</code> هو <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>، وهو تصدير اختياري لوحدة الصفحة <code>load</code>. يقوم <code>withLoad(loader, load)</code> بإنشاء مسار يبدأ <code>load</code> بجانب استيراد جزء الكود الخاص به بدلاً من أن يبدأ بعده. راجع <a href="#router-loaders"> محمّلات المسارات </a>.</p>
      <h3>الأنواع</h3>
      <p>كل نوع هو تصدير مسمى لـ <code>nuclo-router</code>، لذلك يمكن كتابة صفحة أو مُحمل أو حاجز مغادرة دون الاستيراد من المسار.</p>
      <table>
        <thead><tr><th>النوع</th><th>ما هو</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td> كائن المعلمات للنمط. <code>RouteParams</code> هو الشكل العام دون استنتاج من النمط، و<code>Match</code> هي نتيجة المطابق.</td></tr>
          <tr><td><code>PageComponent</code></td><td>الصفحة: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>وحدة الصفحة: المكون نفسه، أو <code>{ default, load? }</code> كـ <code>import()</code> </td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>، يحمل بشكل اختياري <code>load</code> من <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td> يأخذ الجدول الذي يقبله <code>createRouter()</code>: النمط إلى المُحمل، أو إلى جدول متداخل </td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>، الوسيطة الثانية لـ <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>، الوسيطة الثانية لـ <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>نوع <code>outlet()</code> من <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>، ما يأخذ <code>beforeLeave()</code></td></tr>
          <tr><td><code>MatchView</code></td><td>عرض لـ <code>matches()</code>: يستقبل المعلمات ويُرجع المحتوى أو <code>import()</code> لوحدة صفحة</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "الطبقات وحواجز المغادرة",
        content: `
      <p><code>push()</code> يفتح مسارًا أعلى المسار الحالي بدلاً من استبداله، ويُرجع وعدًا يكتمل بالنتيجة التي تُغلق بها تلك الطبقة. نظرًا لأن الصفحات عبارة عن <code>list()</code> واحدة فوق المكدس، فإن فتح الطبقة يعد إلحاقًا. لم تتم إعادة عرض الصفحة الموجودة بالأسفل، لذا فإن DOM وتركيزها ونموذجها نصف المملوء كلها لا تزال موجودة عند إغلاق الطبقة.</p>
      <p>هذا يجعل تدفق "أحتاج إلى سجل غير موجود بعد" يعمل دون التخلص من النموذج الذي كان المستخدم يملؤه:</p>
      ${code("pages/Edit.ts", `
// the page underneath
const created = await layer.push<Option>('/options/new')
if (created) { options.push(created); selected = created.id; update() }
`)}
      ${code("pages/NewOption.ts", `
// the pushed page: (ctx, { layer })
layer.close(created)   // resolves the push() above with the new option
layer.close()          // dismissed: resolves with undefined
`)}
      <p>يمكن تداخل الطبقات. مربع الحوار الذي يحتاج إلى مربع حوار خاص به يستدعي <code>layer.push()</code> وينتظره، دون الإشارة إلى المسار.</p>
      <ul>
        <li><strong> عنوان URL يعبّر عن الطبقة العليا. </strong> تضيف <code>push()</code> إدخال سجل، لذا تكون الطبقة قابلة للربط ويغلقها زر الرجوع، مما يؤدي إلى حل <code>push()</code> الخاص بها بالقيمة undefined عند الإلغاء، تمامًا مثل الإلغاء. يعد Back و<code>close()</code> مسارًا برمجيًا واحدًا: يسجل <code>close()</code> نتائجه ويعود بالتاريخ، والعمق في <code>history.state</code> هو المرجع. تحتفظ المتصفحات بحوالي 50 إدخالًا في علامة تبويب، لذلك بعد السير لفترة طويلة عبر الطبقات، قد يختفي الإدخال الموجود أسفلها: ثم يغلق <code>close()</code> الطبقات الموجودة في مكانها ويعيد كتابة الإدخال الحالي إلى الصفحة التي تركت تظهر.</li>
        <li><strong> التنقل العادي يمسح المكدس. </strong> النقر على الرابط أو <code>go()</code> ليس طبقة. فهو يستبدل كل شيء ويستبعد كل طبقة مفتوحة، لذلك لا يبقى أي متصل في انتظاره.</li>
        <li><strong>فتح الرابط مباشرة يعرض صفحة مستقلة. </strong> يقوم عنوان URL بتسمية الطبقة العليا ولكن ليس المجموعة الموجودة أسفلها، لذا فإن فتح عنوان URL الخاص بالطبقة يعرضها مباشرة كصف واحد، مع <code>layer.depth === 0</code> و<code>close()</code> الخامل. يجب أن يعمل المسار المفتوح كطبقة عند فتحه مستقلًا أيضًا. استخدم شرطًا على <code>layer.depth</code> لعرض رابط بدلًا من زر إلغاء لا يعمل.</li>
        <li><strong> لا يبقى الوعد بعد إعادة تحميل الصفحة </strong>، لأنه يُحفظ في إغلاق برمجي (closure). تعامل مع النتيجة باعتبارها طريقًا مختصرًا عبر التدفق الذي يعمل أيضًا على طول الطريق.</li>
        <li><strong> لم يبق شيء في الانتظار. </strong> <code>stop()</code> يغلق كل طبقة مفتوحة من دون نتيجة، ويتم حل الطبقة المهجورة بواسطة التنقل باستخدام <code>undefined</code>.</li>
      </ul>
      <h3>حواجز المغادرة</h3>
      <p>الصفحة التي تحتوي على شيء يستحق الاحتفاظ به، مثل نموذج نصف مملوء، تقوم بتسجيل حاجز مغادرة. يتم طلبه قبل أن يتم تجاهل الصفحة، ويحتفظ إرجاع <code>false</code> (أو الوعد به) بالصفحة:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>عند مغادرة الصفحة فقط. </strong> لا يُسأل التنقل الفرعي ضمن التخطيط، أو الاستعلام أو تغيير التجزئة الذي يحافظ على الصفحة. يعيش حاجز المغادرة ويموت مع صفحته، لذلك لا يوجد شيء لإلغاء تسجيله.</li>
        <li><strong> كل مخرج. </strong> رابط، <code>go()</code>، للخلف وللأمام، <code>close()</code> للطبقة، و<code>go()</code> إلى عنوان URL لا يمتلكه الموجّه (مغادرة التطبيق، حيث <code>to</code> هو <code>null</code>). يتم الرجوع إلى الخلف أو الأمام المرفوضين، لذلك يبقى شريط العناوين على الصفحة. إغلاق علامة التبويب أو إعادة التحميل هي مهمة <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> هو <code>RouteContext</code> الذي يتجه إليه التنقل. تُنفّذ حواجز المغادرة بدءًا من الأعمق ويتوقفون عند الرفض الأول. إذا رمى أحدها استثناءً، تبقى الصفحة. يمر <code>close(result)</code> عبر حاجز المغادرة أيضًا، لذا قم بمسح علمك قبل الإغلاق بنتيجة.</li>
        <li>لا يستطيع الموجّه تطبيق حواجز المغادرة إلا على إدخالات السجل التي أنشأها. لا يُستدعى الحاجز عند الرجوع أو التقدم إلى إدخال أُنشئ خارجه، مثل رابط <code>#fragment</code> عادي أو استدعاء <code>pushState</code> من برنامج نصي آخر.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() والموجّهات الفرعية",
        content: `
      <p><code>router.outlet()</code> يعرض الصفحة. يعرض <code>router.matches(table)</code> شيئًا آخر يعتمد على مكان تواجدك، مثل الشريط الجانبي أو مسارات التنقل أو شريط الأدوات، من جدوله الصغير، دون تحميل مسار أو إضافة صفحة:</p>
      ${code("app.ts", `
div(
  aside(
    router.matches({
      '/':           () => nav('Home links'),
      '/blog/new':   () => nav('Drafting tips'),
      '/blog/:slug': ({ slug }) => nav(\`More like \${slug}\`),
      '*':           () => import('./Sidebar.ts'),   // code-split, rendered once loaded
    }),
  ),
  main(router.outlet()),
)
`)}
      <ul>
        <li><strong>نفس المطابقة لجدول التوجيه. </strong> الأنماط والأسبقية ومطابقة المسار الأولي وتجريد <code>base</code> هي خاصة بالموجّه، لذا فإن العرض والصفحة يتفقان دائمًا على عنوان URL. يقرأ مسار الطبقة العليا، مثل <code>router.path</code>.</li>
        <li><strong>العرض</strong> هو <code>(params, ctx) =&gt; content</code>، حيث تُستنتج أنواع <code>params</code> من النمط الخاص به و<code>ctx</code> هو <code>RouteContext</code> مع <code>pattern</code> و<code>params</code> للعرض. وقد يُرجع بدلاً من ذلك <code>import()</code> لوحدة الصفحة، والتي يتم استدعاؤها باستخدام <code>ctx</code> بمجرد وصولها.</li>
        <li><strong> لا يوجد شيء مطابق، لا شيء يتم عرضه. </strong> أضف طريقة عرض <code>'*'</code> للرجوع. إنه فارغ قبل <code>start()</code> وبعد <code>stop()</code>، مثل المنفذ.</li>
        <li><strong> يتم إعادة العرض فقط عندما يتغير المسار </strong>، لذلك يحتفظ العرض بـ DOM عبر أي شيء يحتفظ بالصفحة.</li>
        <li><strong>لا يعرض العرض المؤجل أي شيء حتى وصول الوحدة النمطية الخاصة به. </strong> تم تسجيل <code>import()</code> الفاشل مع <code>console.error</code>، ولم يتم تعيين <code>router.error</code>، وتمت إعادة محاولته في التنقل التالي. لا يقوم <code>update()</code> العادي بإعادة المحاولة.</li>
        <li><strong> على الخادم </strong>، لا تقدم العرض المؤجل شيئًا، نظرًا لأن الوحدة الخاصة بها تصل إلى العميل. استخدم عرضًا متزامنًا لأي شيء يجب أن يحتوي عليه HTML الأول.</li>
      </ul>
      <h3>الموجّهات الفرعية</h3>
      <p>تدعم المسارات التداخل، لذا يكفي عادةً جدول متداخل لإنشاء موجّه فرعي. يتولى موجّه واحد التنقل: تمثل صفحة <code>'/'</code> الخاصة بالقسم إطار واجهته، وتُعرض الصفحات الفرعية في <code>outlet()</code> الخاص بها، فيبقى الإطار عند التنقل داخل القسم:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>أو امنح الميزة موجّه خاصًا بها، تم إنشاؤه ولكن لم يتم تشغيله مطلقًا. يمتلك الوالد مُدخلًا واحدًا شاملاً، ويقوم الطفل بتحليل الذيل مقابل الأنماط والمعاملات والمسار الاحتياطي الخاصة به:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>يجب إبقاء هذا الموجّه من دون بدء تشغيله، لأن <code>start()</code> يربط مستمعي الأحداث، وتشغيل موجّهين يسبب تعارضًا. يتولى الموجّه الفرعي المطابقة فقط، فتستدعي أنت محمّلات البيانات. يُعاد بناء واجهة القسم عند تغير بقية المسار، لأن الموجّه الرئيسي يرى مسارًا واحدًا وتتولى واجهة القسم حل الباقي. يتيح الجدول المتداخل الاحتفاظ بالصفحة الأبوية مركّبة، لذا يُفضَّل إلا إذا احتاج القسم فعلًا إلى موجّه وbase ومسار احتياطي خاص به.</p>
    `,
      },
      {
        id: "router-multi",
        title: "موجّهات متعددة وتحميل مشترك",
        content: `
      <p>يمكن أن يحتوي التطبيق على عدد من الموجّهات بقدر ما يحتوي على مناطق. القاعدة التي تبقي هذا الأمر بسيطًا: <strong>ابدأ واحدًا بالضبط لكل مستند</strong>، واترك كل موجّه آخر يظل غير قيد التشغيل، وحل عناوين URL باستخدام <code>match()</code>. يمتلك الموجّه الذي تم تشغيله فقط عنوان URL والسجل ومستمع النقرات. أما الباقي فهو عبارة عن جداول تطرح أسئلة عليها - ويمكن لكل منطقة تحميلها وفق توقيتها الخاص، مع مؤشر تحميل مستقل.</p>
      <h3>تحميل مشترك: سلسلة من المحمّلات</h3>
      <p>قد تقوم كل صفحة في السلسلة المطابقة بتصدير <code>load()</code>. في التنقل البارد إلى مسار فرعي، يقوم محمل التخطيط ومحمل الصفحة بتشغيل <strong> بالتوازي</strong>، ويغطي <code>router.pending</code> السلسلة بأكملها: تظل الصفحة السابقة على الشاشة حتى يكتمل تحميل الاثنين، لذلك لا يتم رسم شجرة نصف محملة أبدًا. يتلقى كل مكون <code>data</code> الخاص به:</p>
      ${code("routes.ts", `
'/shop': {
  '/':          () => import('./pages/Shop.ts'),    // layout, has a load()
  './:section': () => import('./pages/Section.ts'), // page, has a load()
},
`)}
      ${code("pages/Shop.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<ShopData> = async () => {
  await wait(500)                              // a slow API
  return { sections: ['toys', 'books', 'music'] }
}

// the layout gets its own data, and its outlet for the child page
export default function Shop(_ctx: RouteContext, { data, outlet }: PageProps<ShopData>) {
  return div(
    h1('Shop'),
    nav(...data.sections.map((s) => a({ href: router.href(\`/shop/\${s}\`) }, s))),
    main(outlet()),
  )
}
`)}
      ${code("pages/Section.ts", `
export const load: DataLoader<SectionData> = async (ctx) => {
  await wait(900)                              // slower than the layout's
  return { section: ctx.params.section, items: catalog[ctx.params.section] }
}

// the page gets its own data: the two loaders ran beside each other
export default function Section(_ctx: RouteContext, { data }: PageProps<SectionData>) {
  return article(h2(data.section), ul(...data.items.map((i) => li(i))))
}
`)}
      <p>يبدأ كلا المحمّلين معًا، وليس واحدًا تلو الآخر. يكون <code>router.pending</code> صحيحًا أثناء انتظار أي منهما، وبقيمة false بقية الوقت - لا يغيّره المسار المحمَّل مسبقًا أو المتاح مباشرة. يؤدي التنقل بين الأقسام إلى الحفاظ على التخطيط، بحيث يعمل مُحمل القسم فقط مرة أخرى؛ تظل بيانات التخطيط وDOM والمدخلات نصف المكتوبة جميعها باقية. تؤدي إعادة التنقل إلى نفس عنوان URL إلى تشغيل مجددًا محمّل الصفحة الطرفية وإعادة بناء صفها، تمامًا كما هو الحال مع صفحة واحدة.</p>
      <h3>تحميل متعدد: موجّه ثانٍ بمؤشر تحميل مستقل</h3>
      <p>للمنطقة المستقلة، مثل الشريط الجانبي أو الدرج أو المنطقة الحية، موجّه خاص يُنشأ من دون تشغيله، ومؤشر تحميل خاص بها. تتبع <code>router.pending</code> الموجّه الرئيسي الذي بدأ تشغيله فقط، لذا يمكن تحميل المنطقتين بالتوازي، وقد تنتهي أي منهما أولًا:</p>
      ${code("sidebar.ts", `
import { createRouter } from 'nuclo-router'

// Created but never started: start() is what attaches the history and click
// listeners, and only the main router is started. match() attaches nothing.
const standIn = () => ({ default: () => div() })   // never rendered

const sidebarRouter = createRouter({
  '/shop':          standIn,
  '/shop/:section': standIn,
  '*':              standIn,
}, { base: '/docs' })              // the same base as the main router

export const sidebar = { loading: false, info: null as SidebarInfo | null }

export async function refreshSidebar(at: string) {
  const hit = sidebarRouter.match(at)          // the second router resolves
  if (!hit || (hit.pattern !== '/shop' && hit.pattern !== '/shop/:section')) {
    sidebar.info = null; update(); return
  }
  sidebar.loading = true                       // its own flag, its own spinner
  sidebar.info = null; update()
  const data = await fetchSidebar(hit.params.section)
  sidebar.loading = false; sidebar.info = data
  update()
}
`)}
      ${code("routes.ts", `
createRouter(routes, {
  onNavigate: (ctx, kind) => {
    announce(kind)
    refreshSidebar(ctx.url)   // every navigation re-resolves the sidebar
  },
})
`)}
      <p>يُستخدم الموجّه الثاني للمطابقة فقط: يقرأ <code>match()</code> عنوان URL ويُرجع السياق، من دون إضافة مسارات الشريط الجانبي إلى الجدول الرئيسي. تُنفَّذ <code>onNavigate</code> بعد اكتمال كل تنقل، بما فيه الأول، فتوفّر موضعًا واحدًا لمزامنة المنطقة المستقلة مع عنوان URL.</p>
      <ul>
        <li><strong><code>pending</code> إلى الموجّه الذي تم بدء تشغيله. </strong> لا يوجد مسار نشط للموجّه الذي لم يبدأ تشغيله، ولا توجد قيمتا <code>pending</code> ولا <code>error</code>. تتبع المنطقة أعلامها الخاصة، ويمكن أن يجلس الدوار الثاني بجوار الأول. في العرض التوضيحي، يتم تحميل الشريط الجانبي لمدة 800 مللي ثانية بينما تعمل محمّلات المسار لمدة 900 مللي ثانية، بحيث يمكن أن تنتهي الصفحة قبل الشريط الجانبي أو العكس.</li>
        <li><strong><code>match()</code> لا يربط مستمعي أحداث. </strong> يمكن لأي عدد من الموجّهات التي لم يتم تشغيلها مشاركة المستند؛ يحتوي كل منها على جدول خاص به وقاعدة ووحدة تخزين مؤقت خاصة به، ولا يلمس أي منها السجل. لا تحتاج سوى جدول ودالة مطابقة.</li>
        <li><strong> لا تُشغَّل محمّلاته تلقائيًا. </strong> يقوم الموجّه الذي تم تشغيله بتشغيل <code>load()</code> للصفحات التي تطابقها. يتم حل الموجّه الذي لم يبدأ مطلقًا، لذا إذا كانت عروضه بحاجة إلى بيانات، فاحضرها بنفسك - <code>refreshSidebar()</code> الخاص بالعرض التوضيحي. إذا كنت تريد المحمّلات، فإن جدول <a href="#router-matches"> المتداخل </a> أو منطقة <a href="#router-regions"> تملأ الصفحة </a> تحافظ على هذه المهمة مع الموجّه الذي تم تشغيله.</li>
        <li><strong>تجاهل الاستجابات القديمة. </strong> يجب ألا يصل طلب الشريط الجانبي البطيء إلى القسم الذي انتقلت بعيدًا عنه. قم بزيادة عداد جيل الطلب عند كل تحديث وإسقاط الردود التي لم تعد متطابقة، كما يتجاهل الموجّه نفسه عمليات التنقل التي حلّت محلها عمليات أحدث.</li>
        <li><strong>عرض <code>matches()</code> المؤجل لا يحتوي على <code>pending</code> أيضًا. </strong> فهو لا يعرض شيئًا حتى تصل الوحدة الخاصة به. ثلاثة أنظمة تحميل، وثلاث ساعات مستقلة: <code>pending</code> للمسار، ومؤشرات التحميل الخاصة بك، والعرض المؤجل الذي لم يتم الوصول إليه بعد.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "معالجة الروابط",
        content: `
      <p>يتنقل المستمع المفوض بالنقر بزر الماوس الأيسر على <code>&lt;a href&gt;</code>، بما في ذلك SVG <code>&lt;a&gt;</code> وينقر على أي شيء متداخل داخل واحد، ويتنحى جانبًا لكل شيء آخر: نقرات التعديل والنقرات الوسطى، <code>target</code> بخلاف <code>_self</code>، <code>download</code>، <code>rel="external"</code>، و روابط href إلى أصول أخرى، وروابط التجزئة فقط في الصفحة الحالية، والمسارات خارج <code>base</code>، والمسارات التي لا يتطابق أي مسار معها (لذلك لا يزال من الممكن الوصول إلى 404 الذي يعرضه الخادم)، وأي حدث يقوم معالج التطبيق بالفعل باستدعاء <code>preventDefault()</code> عليه. قم بإلغاء الاشتراك بشكل صريح مع <code>data-nuclo-router="off"</code>.</p>
      <h3>التمرير</h3>
      <p>يحافظ التنقل الذي يضيف إدخالًا إلى السجل على موضع التمرير الحالي. عندما يحتوي عنوان URL الجديد على <code>#hash</code> يطابق عنصرًا في الصفحة، يتم تمرير هذا العنصر إلى العرض. <code>popstate</code> يترك التمرير إلى المتصفح. للوصول إلى صفحات جديدة في الأعلى، قم بذلك في <code>onNavigate</code>، الذي يوضح كيفية حدوث التنقل:</p>
      ${code("routes.ts", `
let shown = ''
createRouter(routes, {
  onNavigate: (ctx, kind) => {
    // Not on Back/Forward (the browser restores those), nor for a query change on the same page.
    if (kind === 'push' && ctx.path !== shown && !ctx.hash) window.scrollTo(0, 0)
    shown = ctx.path
  },
})
`)}
      <h3>ملاحظات</h3>
      <ul>
        <li><strong>لا يحتفظ المسار بعناصر DOM.</strong> يحتفظ Route بدالة الصفحة وسياقها فقط. يحرر الانتقال إلى صفحة أخرى الصفحة السابقة. يزيل <code>stop()</code> المستمعات ويتخلى عن أي تحميل جارٍ ويمسح <code>pending</code>، فلا يبقى مؤشر تحميل عالقًا لمسار متوقف. تُتجاهل بصمت أي وحدة يكتمل تحميلها بعد <code>stop()</code>.</li>
        <li><strong>عزل آمن للطلبات المتزامنة على الخادم. </strong> تقوم <code>start()</code> بإرجاع حالة كل طلب وتقوم <code>run()</code> بنطاقها على عرض متزامن واحد، لذا لا يمكن للطلبات المتداخلة رؤية مسار بعضها البعض. تتم مشاركة ذاكرة التخزين المؤقت للوحدة فقط. ينتهي النطاق عندما ترجع الدالة <code>run()</code>. <code>renderToString()</code> متزامن، وهذا يكفي. سيحتاج العرض غير المتزامن أو المتدفق إلى المسار المنقول عبر <code>await</code>، وهو ما لا يفعله <code>run()</code>.</li>
        <li><strong>استعادة التمرير على <code>popstate</code></strong> هي عملية للمتصفح (<code>scrollRestoration</code>)، وليست للموجّه.</li>
        <li><strong> قم بتشغيل موجّه واحد لكل مستند. </strong> يضيف كل <code>start()</code> مستمع <code>click</code> المفوض الخاص به، ولا يقوم <code>start()</code> الخاص بالموجّه الثاني بسحب المستمع الأول. فقط <code>start()</code> ثانٍ على نفس الموجّه يفعل ذلك. لحل عنوان URL مقابل جدول آخر، قم بإنشاء موجّه واستدعِ <code>match()</code> فقط. لا يربط مستمعي أحداث. يمكن لمنطقة مستقلة تشغيل التحميل الخاص بها بجانب <code>pending</code> للمسار بهذه الطريقة. راجع <a href="#router-multi">الموجّهات المتعددة &amp; التحميل المشترك</a>.</li>
        <li><strong>غير مضمن، حسب التصميم: تجزئة </strong> وسجل الذاكرة، نظرًا لأن المسار موجود في اسم المسار ويجب أن يخدم الخادم كل مسار؛ منطقتان موجهتان بشكل مستقل يتم تشغيلهما بواسطة عنوان URL واحد، نظرًا لأن الصفحة يمكن أن تملأ عدة مناطق بـ <code>into()</code> ولكنها تنتمي جميعها إلى المسار المطابق الواحد - لا يزال بإمكان المنطقة المستقلة الاحتفاظ بالموجّه الخاص بها والتحميل غير المبدئي، كما هو الحال في <a href="#router-multi">الموجّهات المتعددة &amp; التحميل المشترك</a>؛ والتحويم المسبق، والذي تحصل عليه عن طريق استدعاء محمّل المسار الخاصة من <code>mouseenter</code>.</li>
      </ul>
      <h3>أمثلة</h3>
      <p>هناك مثالان قابلان للتشغيل في المستودع يكمل كل منهما الآخر، لذلك يمكن ملاحظة كل إعداد في مكان ما:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: جولة من جانب العميل في API بالكامل. كل نموذج نمط وقاعدة أسبقية، وإلغاء الاشتراك في معالجة الارتباط، وكل عضو في المسار مع عناصر تحكم مباشرة، وموجّه فرعي، وطبقة مكدسة ثلاثية عميقة، وقسم نسبي مثبت على العناصر الأبوية، ومحملات المسار مع <code>pending</code> و<code>error</code>. يضبط <code>preload: false</code> بحيث تظل هذه الحالات مرئية.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> لكل طلب، ترطيب يعيد استخدام عقد الخادم، رموز الحالة 404 الحقيقية، <code>base</code> غير الجذر، التحميل المسبق الخامل الذي يمكنك مشاهدته في لوحة الشبكة، والمحمل الذي يتم تسليم بياناته من الخادم إلى العميل حتى لا تُجلب البيانات مجددًا عند الترطيب.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "أنماط الاستخدام",
    sections: [
      {
        id: "computed",
        title: "القيم المحسوبة",
        content: `
      <p>لا يوفر Nuclo واجهة API خاصة بالقيم المحسوبة. استخدم دالة عادية واستدعها من دوال القيم الديناميكية:</p>
      ${code("example.ts", `
let items = ['apple', 'banana', 'cherry']
let filter = ''

const visible = () => items.filter((item) => item.includes(filter))

const Fruits = () =>
  div(
    p(() => \`Showing \${visible().length} of \${items.length}\`),
    ul(list(visible, (item) => li(item))),
  )

filter = 'an'
update()
`)}
    `,
      },
      {
        id: "async",
        title: "العمليات غير المتزامنة والتحميل",
        content: `
      <p>استخدم <code>async</code>/<code>await</code> العادي، واستدعِ <code>update()</code> في كل مرة تتغير فيها الحالة. بالنسبة للجلب، فهذا يعني مرة واحدة قبل <code>await</code> ومرة ​​واحدة بعد:</p>
      ${code("example.ts", `
let status: 'idle' | 'loading' | 'done' | 'error' = 'idle'
let result: unknown = null

async function loadData() {
  status = 'loading'
  update()
  try {
    result = await fetch('/api/data').then((r) => r.json())
    status = 'done'
  } catch {
    status = 'error'
  }
  update()
}
`)}
    `,
      },
      {
        id: "best-practices",
        title: "أفضل الممارسات",
        content: `
      <ul>
        <li><strong>جمّع التغييرات.</strong> قم بتغيير كل الحالة التي تحتاجها، ثم استدعِ <code>update()</code> مرة واحدة.</li>
        <li><strong> حافظ على القيم الديناميكية سريعة ونقية. </strong> تعمل جميعها على كل <code>update()</code>.</li>
        <li><strong> استخدم <code>scope()</code></strong> لإجراء التحديثات الصغيرة والمتكررة، مثل الكتابة أو المؤقتات.</li>
        <li><strong>صيّر داخل المستند. </strong> العقد غير الموجودة في المستند عند تشغيل <code>update()</code> تتوقف عن التحديث.</li>
        <li><strong> استخدم <code>when()</code> و<code>list()</code></strong> للعناصر الفرعية التي يتغيرون، وليس دالة تقوم بإرجاع العقد.</li>
        <li><strong> استخدم <code>className</code>، وليس <code>class</code></strong>، واستخدم <code>() =&gt; cx(...)</code> أو <code>{ className: () =&gt; … }</code> للفئات الديناميكية.</li>
        <li><strong> عرّف التنسيقات مرة واحدة </strong>، على مستوى الوحدة النمطية.</li>
        <li><strong>التصيير على الخادم:</strong> صيّر أولًا، ثم ضع ناتج <code>getCssText()</code> في <code>&lt;style id="nuclo-styles"&gt;</code>. مرّر بيانات الطلب كوسائط، واحتفظ بتعليقات HTML في المخرجات.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "المرجع",
    sections: [
      {
        id: "api-index",
        title: "فهرس API",
        content: `
      <p>كل دالة عامة ومن أين تأتي.</p>
      <h3><code>nuclo</code> (أسماء عامة وتصديرات مسماة)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: تشغيل كافة القيم الديناميكية، أو تلك الموجودة في النطاقات المحددة.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: قم بإعطاء معرفات نطاق العنصر لـ <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: المحتوى الشرطي، مع <code>.when()</code> و<code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: صف واحد لكل عنصر، تُطابق صفوفه بالهوية.</li>
        <li><a href="#api-region"><code>region(options)</code></a> و <a href="#api-region"><code>into(id, ...content)</code></a>: مكان مسمى في الشجرة، والمحتوى الذي يملأه من أي مكان.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: مستمع الأحداث، أو <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: البناء والإلحاق.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: تفعيل HTML المصيَّر على الخادم.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: استدعاء المكونات مرة أخرى وتعديل DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: الفئات التي تم إنشاؤها من كائن النمط.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: الجمع بين الأنماط، يفوز لاحقًا.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: نسخ مرتبطة بسمة من <code>css</code>، <code>cx</code>، <code>variants</code>، <code>keyframes</code> و<code>globalStyle</code>.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: الأنماط من الخيارات.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> و <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (تصديرات مسماة فقط)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> و <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>، <code>renderManyToString(inputs)</code>، <code>renderToStringWithContainer(input, tag?, attrs?)</code> و<code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">استيراد ذو أثر جانبي </a>، بالإضافة إلى <code>document</code>، <code>Event</code>، <code>CustomEvent</code>، <code>Node</code>، <code>Element</code>، <code>HTMLElement</code> والفئات <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (حزمة مستقلة)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: الموجّه، مع <code>start()</code>، <code>match()</code>، <code>outlet()</code>، <code>matches()</code>، <code>go()</code>، <code>push()</code>، <code>href()</code> و<code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: مسار يبدأ محمل البيانات الخاص به بجانب الجزء الكود الخاص به.</li>
        <li><a href="#router-api">الأنواع</a>: <code>RouteContext</code>، <code>PageProps</code>، <code>Params</code>، <code>DataLoader</code>، <code>RouteTable</code> والمزيد.</li>
      </ul>
      <h3>أسماء عامة فقط</h3>
      <ul>
        <li><a href="#tag-builders">175 دوال بناء الوسوم </a>: <code>div</code>، <code>span</code>، …، <code>var_</code>، و<code>svgSvg</code>، <code>pathSvg</code>، ….</li>
        <li><a href="#typescript-setup">الأنواع</a>: <code>NodeModFn</code>، <code>NodeModLike</code>، <code>ExpandedElement</code> والمزيد. يمكن أيضًا استيراد أنواع التنسيق مثل <code>StyleResult</code> من <code>'nuclo'</code>.</li>
      </ul>
      <h3>مفاتيح خاصة</h3>
      <ul>
        <li><a href="#attributes">السمات</a>: معالجات <code>className</code> و<code>style</code> و<a href="#events"><code>on*</code></a> و<a href="#lifecycle"><code>onMount</code> و <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">كائنات التنسيق</a>: الاختصارات والحالات الزائفة ومحددات <code>&amp;</code> وقواعد <code>@</code> و<code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "الأسئلة الشائعة",
        content: `
      <h3>هل يؤدي تغيير الحالة إلى تحديث الواجهة؟</h3>
      <p>لا. يظل DOM كما هو حتى تقوم باستدعاء <code>update()</code>.</p>

      <h3>هل يستخدم Nuclo إشارات أو بروكسيات أو DOM افتراضيًا؟</h3>
      <p>لا. تظل الحالة كائنات ومتغيرات JavaScript عادية. عندما يتم عرض شجرة، يقوم Nuclo بإنشاء عناصر حقيقية وعقد نصية. يقوم <code>update()</code> بتشغيل كل قيمة ديناميكية مسجلة، أو تلك الموجودة داخل النطاقات المحددة، ويقوم بتعديل نفس العقد التي تغيرت فيها القيمة. لا يوجد رسم بياني للتبعية ولا توجد شجرة افتراضية.</p>

      <h3>لماذا تعرض صفحتي "false"؟</h3>
      <p>يتم عرض القيم المنطقية كنص. يعرض <code>div(ok &amp;&amp; span('Done'))</code> "false". استخدم <code>when(() =&gt; ok, span('Done'))</code> للعناصر الفرعية، و<code>ok ? 'Done' : ''</code> للنص.</p>

      <h3>لماذا لا يتغير صف القائمة عندما أعدّل العنصر؟</h3>
      <p>يتم الاحتفاظ بصفوف العناصر التي لا تزال موجودة في القائمة، ولا يتم عرضها مرة أخرى. استخدم القيم الديناميكية مثل <code>() =&gt; todo.text</code> للحقول التي تتغير. انظر <a href="#api-list"><code>list()</code></a>.</p>

      <h3>لماذا يتوقف جزء من واجهتي عن التحديث؟</h3>
      <p>غالبًا لم تكن العقد موجودة في المستند عند تشغيل <code>update()</code>. يتوقف Nuclo عن تتبّعها حتى بعد إرفاقها لاحقًا، لذا صيّر داخل حاوية موجودة في المستند. وهناك سببان آخران: يتوقف <code>when()</code> عن التحديث إذا رمى شرطه استثناءً، وتبقى دالة النص فارغة إذا رمت استثناءً عند تشغيلها لأول مرة. راجع <a href="#api-update"><code>update()</code></a>.</p>

      <h3>متى أستخدم <code>forceUpdate()</code>؟</h3>
      <p>فقط للتغييرات النادرة للقيم الثابتة، مثل تبديل اللغة. لكل شيء آخر، استخدم <code>update()</code>. انظر <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>كيف أضع صفحة في تخطيط دون تمريرها كخاصية؟</h3>
      <p>حدد المكان بـ <code>region({ id: 'main' })</code> واطلب من الصفحة إرجاع <code>into('main', …)</code>. انظر <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>كيف ألغي تركيب تطبيق؟</h3>
      <p>غلّفه في <code>when()</code> واجعل الشرط غير متحقق. إزالة DOM يدويًا لا تشغّل <code>onDestroy</code>. راجع <a href="#lifecycle">دورة الحياة</a>.</p>

      <h3>هل يتضمن Nuclo موجّهًا؟</h3>
      <p>ليس في الحزمة الأساسية. يتوفر التوجيه بشكل منفصل كـ <code>nuclo-router</code>، مع عرض الخادم والترطيب ومسارات تقسيم التعليمات البرمجية والتحميل المسبق في وضع الخمول. قم بتثبيته باستخدام <code>npm install nuclo nuclo-router</code>. انظر <a href="#router-overview">nuclo-router</a>.</p>

      <h3>هل يتضمن Nuclo تأثيرات؟</h3>
      <p>لا. <code>onMount</code> و<code>onDestroy</code> يعملان مرة واحدة لكل عنصر، ويرتبطان بالإدراج والإزالة. لا شيء يعمل مرة أخرى لأن بعض الحالات تغيرت.</p>
    `,
      },
    ],
  },

];
