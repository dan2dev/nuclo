import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "التنسيق (Styling)",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>تحوّل كائن تنسيق محكم الأنواع إلى CSS classes مولَّدة، وتمرّر نتيجتها إلى أي دالة بناء. في المتصفح تذهب القواعد إلى عنصر واحد هو <code>&lt;style id="nuclo-styles"&gt;</code>، وعلى الخادم تُرجعها <a href="#api-css-text"><code>getCssText()</code></a>.</p>
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
        <li>تنشئ <code>css()</code> class واحدًا للتصريحات الأساسية، وclass إضافيًا لكل pseudo key أو selector أو كتلة media. فالبطاقة أعلاه تحصل على classين.</li>
        <li>أسماء الـ classes مشتقة من hash للمحتوى، فالتنسيقات المتطابقة تتشارك الـ class نفسه، وينتج الخادم والعميل الأسماء نفسها.</li>
        <li>عرّف الأنماط مرة واحدة على مستوى الـ module. فـ <code>css()</code> تخزّن النتيجة مؤقتًا (cache) بحسب الكائن نفسه، لذلك يُعالَج أي كائن جديد من الصفر في كل استدعاء.</li>
        <li>تعديل كائن النمط بعد تمريره إلى <code>css()</code> لا يغيّر شيئًا.</li>
        <li>يبقى كل نمط مسجَّلًا ما دامت الصفحة أو عملية الخادم حية. أما القيم التي تتغير من عنصر لآخر، كعرض مأخوذ من البيانات، فاستخدم attribute الـ <a href="#attributes"><code>style</code></a>.</li>
      </ul>
      <h3>أنماط مسمّاة</h3>
      <p>مرّر الاسم أولًا لتحصل على اسم class مقروء:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>الـ class الأساسي هو الاسم نفسه حرفيًا، وبقية الكتل تأخذ <code>name-&lt;hash&gt;</code>.</li>
        <li>يجب أن يكون الاسم صالحًا كاسم class، وإلا حذّر Nuclo وولّد اسمًا بديلًا.</li>
        <li>الأسماء عامة؛ فإذا استخدم نمطان مختلفان الاسم نفسه حذّر Nuclo.</li>
      </ul>
      <h3>استخدام الناتج</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p>كل من <code>String(card)</code> و<code>card.className</code> يُرجع أسماء الـ classes.</p>
    `,
      },
      {
        id: "style-objects",
        title: "كائنات التنسيق",
        content: `
      <p>الكائن الذي تمرره إلى <code>css()</code> يستخدم خصائص CSS الشائعة بصيغة camelCase، ومعها مجموعة اختصارات، ومفاتيح متداخلة للـ pseudo states والـ selectors والـ media queries، وكلها يكملها TypeScript تلقائيًا. أما الخصائص الخارجة عن المجموعة المضبوطة الأنواع، مثل <code>borderTopLeftRadius</code> أو <code>fill</code> أو <code>paddingInline</code>، فمكانها <code>raw</code> (انظر أدناه).</p>
      <h3>القيم</h3>
      <ul>
        <li>الأرقام تصير <code>px</code>، إلا <code>0</code> والخصائص التي لا تأخذ وحدة: <code>zIndex</code>، <code>opacity</code>، <code>fontWeight</code>، <code>lineHeight</code>، <code>flex</code>، <code>flexGrow</code>، <code>flexShrink</code>، <code>order</code>، <code>aspectRatio</code>، <code>gridColumn</code> و<code>gridRow</code>. وداخل <code>raw</code> تبقى <code>zoom</code> و<code>scale</code> و<code>column-count</code> و<code>orphans</code> و<code>widows</code> و<code>tab-size</code> و<code>animation-iteration-count</code> بلا وحدة أيضًا.</li>
        <li>النصوص تُكتب كما هي، وتُتجاهل القيم <code>null</code> و<code>undefined</code> و<code>false</code>.</li>
        <li>الخاصية <code>lineHeight</code> (ومثلها <code>leading</code>) بلا وحدة، فـ <code>leading: 24</code> تعني 24 ضعف حجم الخط. اكتب <code>"24px"</code> إن أردت بكسلات.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>الاختصارات</h3>
      <table>
        <thead><tr><th>المفتاح</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>، <code>pt</code>، <code>pr</code>، <code>pb</code>، <code>pl</code></td><td>padding، ثم كل جانب على حدة</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>الـ padding أفقيًا (يسار ويمين) / رأسيًا (أعلى وأسفل)</td></tr>
          <tr><td><code>m</code>، <code>mt</code>، <code>mr</code>، <code>mb</code>، <code>ml</code>، <code>mx</code>، <code>my</code></td><td>الأمر نفسه للـ margin</td></tr>
          <tr><td><code>w</code>، <code>h</code>، <code>minW</code>، <code>maxW</code>، <code>minH</code>، <code>maxH</code></td><td>العرض والارتفاع وحدّاهما الأدنى والأقصى</td></tr>
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
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (دون ضبط display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>الـ pseudo states</h3>
      <p><code>hover</code>، <code>focus</code>، <code>focusVisible</code>، <code>focusWithin</code>، <code>active</code>، <code>visited</code>، <code>disabled</code>، <code>enabled</code>، <code>checked</code>، <code>required</code>، <code>invalid</code>، <code>valid</code>، <code>readOnly</code>، <code>first</code> (<code>:first-child</code>)، <code>last</code> (<code>:last-child</code>)، <code>only</code> (<code>:only-child</code>)، <code>odd</code>، <code>even</code>، <code>empty</code>، <code>placeholderShown</code>، <code>placeholder</code>، <code>before</code>، <code>after</code>، <code>selection</code>، <code>marker</code>، <code>firstLine</code> و <code>firstLetter</code>. ويمكن تداخلها: <code>hover: { focus: {…} }</code> ينتج <code>:hover:focus</code>.</p>
      <h3>الـ selectors والـ at-rules</h3>
      <p>المفتاح الذي يبدأ بـ <code>&amp;</code> هو selector، وكل <code>&amp;</code> فيه يتحول إلى اسم الـ class. والمفتاح الذي يبدأ بـ <code>@</code> هو at-rule: <code>@media</code> أو <code>@container</code> أو <code>@supports</code>.</p>
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
        <li>يجب أن يبدأ المفتاح بـ <code>&amp;</code>؛ فمفتاح مثل <code>".dark &amp;"</code> يُتجاهل، واكتب بدلًا منه <code>"&amp;:is(.dark *)"</code>.</li>
        <li>كتلتا <code>@media</code> المتداخلتان تُدمجان بـ <code>and</code>. والاستعلام الذي يبدأ بنوع media (<code>print</code>، <code>only screen</code>) يوضع أولًا لأن صياغة CSS لا تسمح بالنوع إلا في البداية. أما الزوج الذي يتعذر دمجه، كنوعي media أو <code>not</code> في المقدمة، فيحذّر Nuclo ويكتفي بالاستعلام الداخلي. وأي at-rule متداخلة أخرى تحل محل الخارجية.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>استخدم <code>raw</code> لأي خاصية، واكتب اسمها كما هو في CSS تمامًا. ولأن الأرقام تأخذ <code>px</code> هنا أيضًا، فمرّر القيم كنصوص:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>أي مفتاح مسطّح آخر يُحوَّل إلى kebab-case ويُكتب كما هو، فخطأ إملائي مثل <code>colr: 'red'</code> يصبح تصريحًا يتجاهله المتصفح. وأي كائن متداخل تحت مفتاح ليس pseudo state ولا screen ولا مفتاح <code>&amp;</code> أو <code>@</code> يُتجاهل. وفي الحالتين سيبلغك TypeScript بالخطأ.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>تدمج الأنماط معًا. وإذا ضبط مُدخلان الخاصية نفسها فالأحدث منهما يفوز.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>المُدخلات الـ falsy تُتجاهل، والمصفوفات تُسطَّح، والنصوص تُقسَّم وتُزال منها التكرارات.</li>
        <li>الـ classes المولَّدة للكتلة نفسها (الأساس، أو الـ pseudo نفسه، أو الـ media query نفسه) تُدمج في class جديد واحد، أما بقية أسماء الـ classes فتمرّ كما هي.</li>
        <li>الدالة <code>cx()</code> وحدها تعرف ترتيب الوسائط. مع <code>div(base, blue)</code> تُضاف الـ classes الاثنتان معًا، وتفوز القاعدة التي وُلّدت آخرًا. فضع الأنماط التي يتجاوز بعضها بعضًا في استدعاء <code>cx()</code> واحد.</li>
        <li>حين تُدمج كتلة نمط مسمّى مع كتلة من مُدخل آخر يكون الـ class الناتج <code>name-&lt;hash&gt;</code> لا الاسم المجرد. أما الكتل التي لا تُدمج فتحتفظ بـ class الخاص بها، لذا يبقى <code>page-title</code> في <code>cx(pageTitle, 'extra')</code>.</li>
      </ul>
      <h3>CSS classes ديناميكية</h3>
      <p>مرّر دالة تُرجع <code>cx(...)</code> دائمًا:</p>
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
      <p>يجب أن تُرجع الدالة ناتج نمط عند أول تشغيل لها. أما <code>() =&gt; active &amp;&amp; activeButton</code> فتعرض النص "false" بدل أن تضيف class.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>تُرجع نسخها الخاصة من <code>css</code> و<code>cx</code> و<code>variants</code> و<code>keyframes</code> و<code>globalStyle</code> مرتبطةً بـ theme. والـ theme يمنح القيم أسماء: ففي الـ theme أدناه تكتب <code>borderColor: 'border'</code> فتصير <code>#e5e7eb</code>، ويكمل TypeScript الأسماء تلقائيًا. وكل مدخل في <code>screens</code> يصبح مفتاح نمط لـ media query، مثل <code>md: {…}</code>.</p>
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
        <thead><tr><th>مفتاح الـ theme</th><th>تستخدمه</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>، <code>backgroundColor</code>، <code>color</code>، <code>borderColor</code> وكل جانب منها، <code>outlineColor</code>، <code>caretColor</code>، <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>، <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>، <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>، <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>مفاتيح نمط جديدة، مثل <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>يُحَلّ اسم الـ theme فقط حين يكون هو القيمة كلها، أما <code>border: "1px solid primary"</code> فلا يُحَلّ.</li>
        <li>قيمة الـ screen التي لا تبدأ بـ <code>@</code> تصير <code>@media &lt;value&gt;</code>، والتي تبدأ بـ <code>@</code> تُستخدم كما كُتبت، مثل <code>"@container (min-width: 400px)"</code>.</li>
        <li>مفاتيح الـ screens متاحة فقط في النسخ التي تنشئها <code>createCss()</code>، وليست في <code>css()</code> العامة، لكن الأخيرة تقبل مفاتيح <code>@media</code>.</li>
        <li>كل النسخ والـ helpers العامة تتشارك stylesheet واحدة. وتُخرَج قواعد media الخاصة بالـ screens بترتيب إعلانها لا بترتيب استخدامها، فرتّب شاشات <code>min-width</code> من الأصغر إلى الأكبر. واستخدم نسخة <code>createCss()</code> واحدة لكل تطبيق ليكون هذا الترتيب هو الذي في الـ theme.</li>
        <li>الخاصية <code>theme</code> في الناتج هي كائن الـ theme الذي مرّرته.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>تنشئ دالة تُرجع نمطًا بحسب مجموعة خيارات، كنوع الزر وحجمه.</p>
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
        <li>تُدمج الأنماط بهذا الترتيب: <code>base</code>، ثم القيمة المختارة من كل مجموعة، ثم كل compound مطابق. ويفوز اللاحق في كل خاصية.</li>
        <li>الخيار المفقود أو <code>undefined</code> أو <code>null</code> يستخدم القيمة الافتراضية، والمجموعة التي لا قيمة افتراضية لها تُتخطى.</li>
        <li>المجموعة التي ليس فيها إلا المفتاحان <code>true</code> و<code>false</code> تقبل قيمة منطقية.</li>
        <li>يُطبَّق الـ compound حين تتطابق كل مجموعة يذكرها، بما فيها القيم الافتراضية.</li>
        <li>كل اختيار يُنشأ مرة واحدة ثم يُخزَّن مؤقتًا.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() وglobalStyle()",
        content: `
      <p>تسجّل <code>keyframes()</code> رسمًا متحركًا (animation) وتُرجع اسمه المولَّد. مفاتيح الإطارات هي <code>from</code> و<code>to</code> والنسب المئوية مثل <code>"50%"</code> أو <code>"0%, 100%"</code>، وتقبل الإطارات خصائص مسطحة فقط. والإطارات المتطابقة تُرجع الاسم نفسه.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p>أما <code>globalStyle()</code> فتضيف قاعدة لأي selector:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>يُستخدم الـ selector كما كُتب تمامًا.</li>
        <li>الخصائص المسطحة وحدها تعمل؛ أما الـ pseudo keys والـ screens ومفاتيح <code>@</code> فتُتجاهل، ولذلك لا تستطيع <code>globalStyle()</code> كتابة قواعد media.</li>
        <li>القاعدة نفسها لا تُضاف إلا مرة واحدة، أما نمط مختلف لنفس الـ selector فيضيف قاعدة ثانية وتفوز اللاحقة.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() وresetStyles()",
        content: `
      <p>تُرجع <code>getCssText()</code> كل قاعدة أنشأتها <code>css()</code> و<code>cx()</code> و<code>variants()</code> و<code>keyframes()</code> و<code>globalStyle()</code> في هذه العملية: القواعد الأساسية أولًا ثم كتل <code>@media</code> و<code>@container</code> و<code>@supports</code>. وهي مخصصة للـ SSR.</p>
      <ul>
        <li>استدعِها بعد <code>renderToString()</code> لتشمل القواعد التي وُلّدت أثناء الـ render.</li>
        <li>نطاقها العملية كلها لا صفحة واحدة ولا طلبًا واحدًا، وهي تنمو ولا تتقلص. وهذا آمن لأن أسماء الـ classes مشتقة من hash المحتوى.</li>
        <li>ضعها في <code>&lt;style id="nuclo-styles"&gt;</code>؛ فالعميل يعيد استخدام هذا العنصر ويتخطى القواعد الموجودة فيه. أما مع معرّف آخر أو بدونه فسيضيف العميل stylesheet ثانية ويكتب كل القواعد من جديد.</li>
        <li>لا يُجرى escaping للنص، فلا تضع أبدًا مُدخلات غير موثوقة في قيم الأنماط.</li>
      </ul>
      <p><code>resetStyles()</code> أداة للاختبارات: تزيل كل القواعد وعنصر <code>#nuclo-styles</code>. والأنماط التي أنشأتها سابقًا تحتفظ بأسماء classes لكنها تفقد CSS الخاص بها. فلا تستدعِها في التطبيق ولا على الخادم.</p>
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
    title: "التوجيه (Routing)",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>حزمة منفصلة:</strong> <code>nuclo-router</code> ليس جزءًا من حزمة Nuclo الأساسية، ثبّته بجانب <code>nuclo</code>. وهو إصدار تجريبي (preview) فقد يتغير الـ API الخاص به.</div>
      <p>router لـ Nuclo يدعم الـ SSR والـ hydration والـ code splitting للمسارات والتحميل المسبق وقت الخمول، ومبني على <code>list()</code> و<code>update()</code>. حجمه نحو ${NUCLO_ROUTER_GZIP_KB} كيلوبايت بعد gzip، ولا يعتمد إلا على Nuclo نفسه. ولأنه بلا آثار جانبية تستطيع أدوات البناء حذفه (tree-shaking) إن لم تستخدمه.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>أو استخدم <code>pnpm add</code> أو <code>yarn add</code> أو <code>bun add</code> بالاسمين نفسيهما. ويحتاج إلى <code>nuclo</code> بإصدار 0.3 أو أحدث كـ peer dependency.</p>
      <p>يحدد الـ router <em>ما يُحمَّل</em>، ويحدد التطبيق <em>موضع عرضه</em> باستخدام <code>router.outlet()</code>: استدعاء <code>list()</code> واحد يعرض مكدس الـ layers، بصف لكل layer، فتكون الصفحة العادية صفًا واحدًا. يبني الخادم والعميل الشجرة نفسها، لذا يعيد <code>hydrate()</code> استخدام عقد الخادم. ويعتمد ما تبقّى على <code>history</code> وlistener <code>click</code> مفوّض واحد و<code>requestIdleCallback</code>.</p>
      <h3>استيراد واحد</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p>تنتظر <code>start()</code> تحميل modules المسار المطابق قبل أن تكتمل، فتخرج الشجرة الأولى كاملة على الخادم والعميل. وبعدها تقرأ خصائص الـ router ودوالّه المسار الذي بدأ منه: <code>router.path</code> و<code>router.pending</code> و<code>router.go()</code>.</p>
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
      <p>هذا هو التكامل كله. الروابط تعمل لأن <code>&lt;a href&gt;</code> ليس إلا <code>&lt;a href&gt;</code> عاديًا؛ ومستمع واحد مفوَّض على <code>document</code> يلتقط الروابط التي يملكها الـ router ويترك كل ما عداها للمتصفح.</p>
      <p>على الخادم تُرجع <code>start()</code> كائن <code>Route</code> لكل طلب ولا تمس الـ router نفسه، فلا ترى الطلبات المتزامنة مسارات بعضها. وتجعل <code>route.run()</code> ذلك المسار هو المسار النشط للـ router، ومعه الـ outlet، طوال مدة الـ render. أما في المتصفح فهناك مسار واحد لكل تحميل صفحة، و<code>start()</code> تجعله النشط مباشرة، فلا حاجة إلى <code>run()</code>.</p>
      <p>تستقبل الصفحة <a href="#router-api"><code>RouteContext</code></a> و<a href="#router-api"><code>PageProps</code></a>، على الشكل <code>(ctx, { layer, data, outlet, beforeLeave })</code>، ويمكنها أن تستقبل وسائط أقل من ذلك. وتُرجع أي شيء تقبله <code>list()</code>. ولكي تملأ جزءًا آخر من الـ layout أيضًا، أرجِع <code>into()</code> من داخل الصفحة، مثل <code>div(article(…), into('sidebar', nav(…)))</code>، ويغادر هذا المحتوى مع الصفحة. راجع <a href="#router-regions">الصفحات والمناطق</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "الأنماط والمسارات المتداخلة",
        content: `
      <table>
        <thead><tr><th>النمط</th><th>ما يطابقه</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>، <code>/docs/intro</code></td><td>ذلك المسار بالضبط</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>أي مسار لم يطابقه شيء آخر، أي صفحة الـ 404 عندك</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>تُفحص المسارات الثابتة أولًا، ثم الديناميكية بترتيب تعريفها، ثم الشاملة (catch-all) مع تقديم الأطول بادئةً. لذلك لا يطابق <code>'*'</code> إلا ما لم يطابقه أي مسار آخر، ويمكن وضعه في أي موضع من الجدول. تُطبَّع الشرطات المائلة الزائدة والمكررة والترميز بالنسبة المئوية، وتصل قيم المعاملات مفكوكة الترميز. والمطابقة مقارنة مقطع بمقطع لكل نمط، دون إنشاء أي تعبيرات نمطية (regular expressions) أو تشغيلها.</p>
      <h3>المسارات النسبية</h3>
      <p>النمط المكتوب بـ <code>./</code> يُحسب نسبةً إلى الأب الذي أعلن عنه، وأي href مكتوب بـ <code>./</code> يُحسب نسبةً إلى المسار النشط. وبالجمع بينهما تحصل على قسم قابل لإعادة الاستخدام يعني الشيء نفسه تحت أي أب. قيمة الجدول إما loader وإما جدول آخر تُحسب مفاتيحه نسبةً إليه:</p>
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
      <p>هذان السطران ينتجان الأنماط الستة كلها دون أن تكتب أي مسار مرتين. وكلا الأبوين يأخذ كائنات الـ loader نفسها، فيتشاركان cache واحدًا واستيراد <code>import()</code> واحدًا.</p>
      <ul>
        <li>داخل الجدول الفرعي تعني <code>'./x'</code> و<code>'/x'</code> و<code>'x'</code> الشيء نفسه، وتعني <code>'/'</code> المسار الأب نفسه، و<code>'*rest'</code> يمنح القسم catch-all خاصًا به. ويمكنك التداخل إلى أي عمق.</li>
        <li>مفاتيح المستوى الأعلى تُستخدم كما كُتبت، فيبقى <code>'*'</code> هو <code>'*'</code>.</li>
        <li>إضافة مسار فرعي تحت أب من نوع <code>*catch-all</code> تسبب خطأ في <code>createRouter()</code>، لأن الجزء الشامل يجب أن يكون في نهاية النمط.</li>
      </ul>
      <h3>الصفحات الأبوية و<code>outlet()</code></h3>
      <p>الصفحة الأب وصفحاتها الفرعية تشكل تسلسلًا هرميًا حقيقيًا. تُعرض الصفحة الأب، ويُعرض مسارها الفرعي بداخلها في موضع استدعاء <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>التنقل بين الأبناء لا يعيد بناء الأب. فعقدة الـ DOM هي نفسها، ولذلك يبقى الـ focus وموضع التمرير والمدخلات نصف المكتوبة وأي state محفوظة في closures.</p>
      <ul>
        <li>الصفحة التي ليس لها مسار فرعي لا تعرض شيئًا من الـ outlet، فيمكن للـ layout استدعاؤه دون شرط. وإذا لم تستدعِ الصفحة الأب <code>outlet()</code> فلن يظهر مسارها الفرعي.</li>
        <li>لا توجد index routes. فـ <code>'/'</code> هو الـ layout نفسه، ولذلك يعرض المسار الأب الـ layout بـ outlet فارغ بدل صفحة index منفصلة بداخله. ضع المحتوى المطلوب في الـ layout، أو امنحه مسارًا فرعيًا حقيقيًا.</li>
      </ul>
      <p>الاستدعاء نفسه يعمل من أي أب، ومن صفحة لا تعرف تحت أي أب تقع:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p>الصيغ <code>./x</code> و<code>../x</code> و<code>.</code> و<code>..</code> تُحَلّ نسبةً إلى مسار الـ route الحالي، لا إلى "المجلد" في عنوان URL. فمن <code>/invoices/42</code> تصير <code>./preview</code> هي <code>/invoices/42/preview</code>، بينما يحلّها المتصفح إلى <code>/invoices/preview</code>، والشرطة المائلة الأخيرة في العنوان لا تغيّر شيئًا. وتصعد <code>../</code> مقطعًا واحدًا وتتوقف عند الجذر. ويُحتفَظ بالـ query والـ #hash، وتُضاف <code>base</code> من جديد، ويدخل المسار المطلق المحلول في سجل التصفح (history). وهذا هو الاختلاف نفسه عن حلّ الـ URL الذي يعتمده React Router في <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>فقط <code>./</code> و<code>../</code> نسبيتان إلى المسار؛ أما <code>preview</code> المجردة في href فتبقى لقواعد المتصفح المعتادة.</li>
        <li>أنشئ الروابط النسبية بـ <code>router.href('./preview')</code> بدل كتابة <code>href="./preview"</code> يدويًا. فـ <code>href()</code> تُحَلّ وقت الـ render، فيكون الـ markup الصادر مطلقًا وتبقى صحيحة للـ crawler وللنقر بالزر الأوسط وعند تعطيل JavaScript.</li>
      </ul>
      <h3>ما يُحتفَظ به وما يُعاد بناؤه</h3>
      <table>
        <thead><tr><th>العقدة</th><th>عند التنقل</th></tr></thead>
        <tbody>
          <tr><td>صفحة أب لم يتغير نمطها ولا مسارها</td><td><strong>يُحتفَظ بها</strong>: العقدة نفسها، ولا تُنفَّذ <code>load()</code> الخاصة بها مجددًا</td></tr>
          <tr><td>الصفحة المطابقة</td><td><strong>يُحتفَظ بها</strong> إذا لم يتغير نمطها ومسارها ولم يكن لها <code>load()</code>، فتبقى عند تغيير الـ query أو الـ hash. أما المسار الذي له loader فيُحدَّث في كل زيارة.</td></tr>
          <tr><td>الأب الذي تغير مساره</td><td>يُعاد بناؤه، ومعه كل ما تحته</td></tr>
          <tr><td>الـ layer المضافة</td><td>تعرض الصفحة المطابقة وحدها، أما صفحاتها الأب فمركَّبة أصلًا في الصف الذي تحتها.</td></tr>
        </tbody>
      </table>
      <p>الصفحة المحفوظة تبقى بالـ <code>ctx</code> الذي أُنشئت به، وهذا ينطبق على أي <code>ctx</code>: اقرأ <code>router.*</code> للقيم الحية. والـ state المبنية على الـ query، كالمرشحات وترقيم الصفحات والتبويبات، تقرأ <code>router.search</code> داخل قيمة ديناميكية وتكتب بـ <code>router.go('?page=2', { replace: true })</code>. فتبقى الصفحة في مكانها بما فيها الـ focus والمدخلات نصف المكتوبة.</p>
    `,
      },
      {
        id: "router-regions",
        title: "الصفحات والمناطق",
        content: `
      <p>تضع <code>router.outlet()</code> الصفحة في مكان واحد. أما الصفحة التي تحتاج أيضًا إلى شريط جانبي أو شريط أدوات أو عنوان في موضع آخر من الـ layout فتملؤه بـ <a href="#api-region"><code>into()</code></a>: يحدد الـ layout المكان بـ <code>region()</code>، وتُرجع الصفحة <code>into()</code> بجانب محتواها. فلا يستقبل الـ layout محتوى الصفحة كـ prop أبدًا، ولا يعيد التنقل بناءه.</p>
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
      <p>محتوى الصفحة هو صف في <code>list()</code> الخاصة بـ outlet، و<code>into()</code> يعيش ما دام الصف الذي يحمله حيًّا. فمحتوى الشريط الجانبي يصل مع الصفحة ويغادر معها: الانتقال إلى صفحة بلا <code>into('sidebar', …)</code> يُظهر محتوى <code>empty</code> للمنطقة من جديد. ويمكن للصفحة استخدام <code>ctx</code> و<code>data</code> في الجزأين معًا لأنهما يُبنيان بالدالة نفسها.</p>
      <h3>ما يحدث عند التنقل</h3>
      <ul>
        <li><strong>الصفحة المحفوظة تحتفظ بمناطقها.</strong> تغيير الـ query أو الـ hash <a href="#router-patterns">يُبقي الصفحة</a>، فلا يمس محتوى المنطقة أيضًا. اقرأ <code>router.search</code> داخل قيمة ديناميكية إن كان الشريط الجانبي يعتمد عليها.</li>
        <li><strong>الصفحة المُعاد بناؤها تعيد الملء.</strong> حين يتغير المسار يُزال الصف القديم، وتتولى محتويات <code>into()</code> في الصفحة الجديدة الأمر. ولا يبقى شيء من القديم.</li>
        <li><strong>الـ layer تضيف محتوى جديدًا.</strong> الـ layer صف لاحق في الـ outlet، فيكون <code>into()</code> الخاص بها أحدث محتوى للمنطقة نفسها. ومع <code>type: 'latest'</code> الافتراضي يحل محل محتوى الصفحة حتى تُغلق الـ layer، ثم يعود محتوى الصفحة. ومع <code>type: 'stack'</code> يظهر الاثنان معًا.</li>
        <li><strong>الصفحة الأب تستطيع ملء المناطق أيضًا.</strong> يبقى محتواها بينما تتبدل الصفحات الفرعية، لأن الأب لا يُعاد بناؤه.</li>
        <li><strong>الـ SSR يعمل مباشرة.</strong> يبني الخادم الصفحة داخل <code>route.run()</code>، فيكون محتوى <code>into()</code> موجودًا في الـ HTML، وتعيد <code>hydrate()</code> استخدام عقده.</li>
      </ul>
      <h3>عدة مناطق من صفحة واحدة</h3>
      <p>مرّر كائنًا لتملأ أكثر من منطقة معًا. يبقى المحتوى الرئيسي للصفحة يمر عبر الـ outlet، فأرجعه بجانب <code>into()</code>:</p>
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
        <li><strong><code>outlet()</code></strong> للمسار الفرعي: المحتوى الذي يقرره عنوان URL ويُعرض داخل صفحته الأب. راجع <a href="#router-patterns">المسارات المتداخلة</a>.</li>
        <li><strong><code>into()</code></strong> للصفحة المطابقة التي تنتشر عبر الـ layout. المحتوى يخص الصفحة ويستخدم بياناتها.</li>
        <li><strong><code>matches()</code></strong> لجزء من الـ layout يحدده عنوان URL وحده، بجدول صغير خاص به ودون صفحة. انظر <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>كل هذه الأدوات تنتمي إلى المسار المطابق الواحد. فالـ router لا يوجّه منطقتين مستقلتين من عنوان URL واحد، ولذلك فالشريط الجانبي بمساراته الخاصة هو منطقة تملؤها الصفحة لا outlet ثانيًا. أما الشريط الجانبي الذي يريد فعلًا router وتحميلًا ومسارًا احتياطيًا خاصة به فيُبقي الـ router غير مشغَّل ويحلّ مساراته بـ <code>match()</code>، وراجع <a href="#router-multi">الـ routers المتعددة والتحميل المشترك</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "محمّلات المسارات وتقسيم الكود",
        content: `
      <p>يمكن لـ module الصفحة تصدير دالة <code>load</code>. تُنفَّذ قبل بناء الصفحة عند كل انتقال إلى مسارها، وتُمرَّر نتيجتها إلى الصفحة باسم <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>جدول المسارات لا يتغير؛ فالـ loader يبقى مع module الصفحة. يستقبل <code>RouteContext</code> المطابق فتتوفر له <code>params</code> و<code>search</code> و<code>path</code>، ويمكن أن يكون متزامنًا أو غير متزامن. ويعمل على الخادم أيضًا، فيحمل الـ HTML الناتج بيانات الصفحة بدل أن تُجلب بعد الـ hydration.</p>
      <p><strong>الـ module يُخزَّن مؤقتًا، أما البيانات فلا.</strong> يُحمَّل chunk المسار مرة واحدة ويُعاد استخدامه، بينما يُنفَّذ loader البيانات عند كل انتقال. ولذلك لا تختلط بيانات <code>/blog/a</code> و<code>/blog/b</code>، ويمكن إعادة محاولة الـ loader ببساطة إن فشل.</p>
      <table>
        <thead><tr><th>الحالة</th><th>السلوك</th></tr></thead>
        <tbody>
          <tr><td>أثناء تشغيله</td><td><code>router.pending</code> تساوي true وتبقى الصفحة التي كنت عليها معروضة</td></tr>
          <tr><td>يرمي استثناءً أو يُرفض الـ promise الذي يُرجعه</td><td>يُحفظ الخطأ في <code>router.error</code>. لا يُرفض الـ promise الذي تُرجعه <code>go()</code>، ويمكن إعادة محاولة التنقل.</td></tr>
          <tr><td>أثناء <code>start()</code></td><td>يُرفض الـ promise الذي تُرجعه <code>start()</code> نفسها؛ إذ لا يوجد كائن Route بعد لحفظ الخطأ فيه.</td></tr>
          <tr><td>الـ layer المضافة</td><td>تشغّل الـ loader الخاص بها، ببياناتها الخاصة</td></tr>
          <tr><td>التحميل المسبق وقت الخمول</td><td>يحمّل الـ modules فقط ولا يجلب البيانات: فلا سياق لديه يمرره للـ loader، وقد لا يزور المستخدم ذلك المسار أصلًا.</td></tr>
          <tr><td>إعادة التنقل إلى العنوان نفسه</td><td>يُشغَّل الـ loader من جديد ويُعاد بناء الصف. أما المسار الذي لا loader له فيحتفظ بصفه.</td></tr>
        </tbody>
      </table>
      <p>وللتحقق من جديد (revalidate) انتقل إلى المكان الذي أنت فيه أصلًا دون إضافة إدخال إلى السجل:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>بدء تحميل البيانات مع الـ chunk</h3>
      <p>الـ <code>load</code> المُصدَّر من module الصفحة لا يعمل إلا بعد وصول هذا الـ module، فالتنقل البارد يجلب الـ chunk ثم البيانات. ولتشغيلهما معًا عرّف الـ loader في الجدول بـ <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>هذا الـ loader يحل محل <code>load</code> الخاص بالـ module ويعمل عند كل زيارة. وإذا فشل بينما ما زال الـ chunk يُحمَّل، يُحفظ الخطأ في <code>router.error</code> كأي خطأ تحميل آخر.</p>
      <p>بيانات الخادم لا تُدرج تلقائيًا في الـ HTML بعد تسلسلها، وهذا مقصود. فـ <code>load</code> على العميل يعمل مرة أخرى عند الـ hydration. وإذا كان ذلك مهمًا فاطلب من الخادم أن يُخرج <code>route.data</code>، مثلًا في <code>window.__DATA__</code>، وسيأخذه الـ loader أولًا. و<code>route.data</code> هي بيانات الصفحة المطابقة فقط، أما نتيجة <code>load()</code> لصفحة أب فليست فيه.</p>
      <h3>تقسيم الكود والتحميل المسبق</h3>
      <p>قيمة المسار دائمًا دالة تُرجع الـ component الخاص بالصفحة، فيُحمَّل الـ component عند الحاجة فقط:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>الأشكال التي على هيئة module وحدها تستطيع حمل تصدير <code>load</code>. أما اختيار component مسمّى بـ <code>.then(m =&gt; m.BPage)</code> فيسلّم الدالة وحدها للـ router.</p>
      <p>كل module يُستورد مرة واحدة ويُخزَّن مؤقتًا، والتنقلات المتزامنة إلى المسار نفسه تتشارك <code>import()</code> واحدًا. وبمجرد أن تُترك الصفحة وشأنها مدة <code>idleTimeout</code> (ثانية افتراضيًا، بلا نقرات أو مفاتيح أو عجلة أو تمرير) تُحمَّل بقية المسارات في الخلفية، مسار واحد في كل فترة خمول (<code>requestIdleCallback</code>). وأي إدخال أو تنقل ينتظره المستخدم يوقفها مؤقتًا حتى تخمل الصفحة مجددًا.</p>
      <p>المسار المحمَّل مسبقًا أو المتاح مباشرة لا يغيّر <code>router.pending</code> ويظهر قبل رسم الإطار التالي، فلا يومض مؤشر تحميل ولا يتحرك الـ layout. فـ <code>router.pending</code> تعبّر فقط عن انتظار module أو loader، وتبقى الصفحة السابقة معروضة أثناء الانتظار. وفشل تحميل الـ chunk يُحفظ في <code>router.error</code> بدل رفض promise غير معالج، ويمكن إعادة المحاولة.</p>
    `,
      },
      {
        id: "router-api",
        title: "واجهة API للـ router",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p>الـ <code>table</code> يربط كل نمط بـ loader أو بجدول متداخل. أما الخيارات فهي:</p>
      <table>
        <thead><tr><th>الخيار</th><th>القيمة الافتراضية</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>بادئة الـ URL التي يُخدَم التطبيق تحتها، مثل <code>'/docs'</code>. وهي تطابق عند حدود المقاطع فقط: <code>/docs/intro</code> داخل <code>'/docs'</code> أما <code>/docsearch</code> فلا. والعناوين خارجها لا تطابق شيئًا، فترفضها <code>start()</code> (وهو الـ 404 من جهة الخادم عندك) وتُترك الروابط إليها للمتصفح.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>تحميل modules بقية المسارات في الخلفية متى خمدت الصفحة. والقيمة <code>false</code> توقفه.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>عدد المللي ثانية بلا نقرات أو مفاتيح أو عجلة أو تمرير قبل بدء التحميل المسبق، أو استئنافه بعد انشغال المستخدم.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>، تُستدعى بعد كل تنقل يكتمل في المتصفح، ومنه التنقل الأول، وبعد مزامنة الـ DOM. و<code>kind</code> هو <code>'start'</code> أو <code>'push'</code> أو <code>'replace'</code> أو <code>'pop'</code> (رجوع أو تقدم أو <code>close()</code>) أو <code>'layer'</code>. وهي الـ hook المناسبة لـ <code>document.title</code> والـ meta tags والـ focus والتمرير والتحليلات (analytics). ولا تُستدعى أبدًا أثناء الـ SSR.</td></tr>
        </tbody>
      </table>
      <p>يوفر الـ router الدوال <code>start()</code> و<code>match()</code> و<code>outlet()</code> و<code>matches()</code>، وكل أعضاء <code>Route</code> عدا <code>run()</code>. وتقرأ هذه الأعضاء المسار النشط: آخر مسار أرجعته <code>start()</code> في المتصفح، أو المسار الذي تُنفَّذ <code>run()</code> من أجله على الخادم. وقراءة عضو بلا مسار نشط ترمي استثناءً. ويحتفظ الـ router بجدول المسارات والـ matcher المُجمَّع وذاكرة الـ modules المؤقتة، فتتشاركها الطلبات على الخادم.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>تحلّ <code>url</code> (الافتراضي: <code>location.href</code> في المتصفح) إلى modules الصفحة الخاصة بها وتُرجع <code>Promise&lt;Route&gt;</code>. ويُرفض الـ promise إذا لم يطابق شيء ولم يكن في الجدول مسار <code>'*'</code>، وهذا هو الـ 404 عندك على الخادم. وفي المتصفح تجعل المسار هو النشط للـ router، وتربط مستمعي <code>popstate</code> و<code>click</code> المفوَّضين، وتجدول التحميل المسبق. واستدعاء <code>start()</code> ثانية يوقف المسار السابق. وعلى الخادم لا تمس أي شيء مشترك، ولذلك يجري الـ render داخل <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>تحلّ عنوان URL مقابل الجدول دون تحميل أي شيء: لا import ولا history ولا listeners ولا مسار. وتُرجع <code>RouteContext</code>، أو <code>null</code> إذا كان العنوان خارج <code>base</code> أو لا يطابق أي نمط، أو كان من origin آخر في المتصفح. العناوين المطلقة فقط، لأن حل <code>./</code> يحتاج إلى مسار نشط.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>صفحات المسار النشط على هيئة <code>list()</code>. ضعها مرة واحدة حيث تريد أن تظهر الصفحات. والـ layer المضافة صف لاحق فيها. وهي فارغة قبل أن تُحلّ <code>start()</code> وبعد <code>stop()</code>. وعلى الخادم تعرض المسار الذي تُنفَّذ <code>run()</code> من أجله.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>تعرض العرض المطابق للمسار النشط من جدول ثانٍ، وهي <code>list()</code> تضعها في أي مكان. انظر <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>كل عضو عدا <code>run()</code> موجود أيضًا على الـ router، ومنه يقرؤه التطبيق.</p>
      <table>
        <thead><tr><th>عضو</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>، <code>pattern</code>، <code>params</code>، <code>search</code>، <code>hash</code>، <code>url</code></td><td>المطابقة النشطة. و<code>search</code> كائن <code>URLSearchParams</code>. أما <code>search</code> و<code>hash</code> و<code>url</code> فقيم حية.</td></tr>
          <tr><td><code>pending</code></td><td>تنقل ينتظر module أو loader</td></tr>
          <tr><td><code>error</code></td><td>آخر تحميل فاشل، ويمسحه التنقل التالي</td></tr>
          <tr><td><code>data</code></td><td>نتيجة <code>load()</code> للصفحة المطابقة، لتمريرها من الخادم بعد تسلسلها. ولا تشمل بيانات الصفحات الأب.</td></tr>
          <tr><td><code>depth</code></td><td>عدد الـ layers في المكدس (layer واحدة للصفحة العادية)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>تنتقل وتحمّل الـ module عند الحاجة. ولا يُرفض الـ promise الذي تُرجعه أبدًا: فشل الـ module، سواء برفض الـ promise أو برمي استثناء، يُحفظ في <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>تفتح المسار كـ layer جديدة في الأعلى وتُرجع promise يكتمل بنتيجة إغلاقها. تقبل <code>./</code>. ويُرفض الـ promise إن لم يوجد تطابق أو فشل الـ module.</td></tr>
          <tr><td><code>href(path)</code></td><td>تضيف بادئة <code>base</code> إلى المسار لاستخدامه في <code>a({ href })</code>. وتحل <code>./</code> و<code>../</code> نسبةً إلى المسار النشط.</td></tr>
          <tr><td><code>stop()</code></td><td>تفصل الـ listeners وتلغي الـ layers المفتوحة وتفرّغ الـ outlet. ويمكن استدعاؤها مرارًا بأمان. والمسار المتوقف يحتفظ بآخر مطابقة لكن <code>go()</code> لا تفعل شيئًا.</td></tr>
          <tr><td><code>run(fn)</code></td><td>تستدعي <code>fn</code> وهذا المسار هو النشط للـ router، وتُرجع نتيجتها: <code>route.run(() =&gt; renderToString(App))</code> على الخادم. متزامنة فقط. ويتوقف المسار عن كونه نشطًا حين تعود <code>fn</code>.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>الوسيط الأول للصفحة: <code>path</code> و<code>pattern</code> و<code>params</code> و<code>search</code> و<code>hash</code> و<code>url</code>. وهو السياق الذي بُنيت به الصفحة؛ فاقرأ <code>router.*</code> للقيم الحية، فهما تختلفان فقط حين يتغير الـ query أو الـ hash دون إعادة بناء.</p>
      <p>الـ <code>params</code> افتراضيًا <code>{ [name]: string }</code>. ويمكن للصفحة أن تستنتج أنواعها من نمطها بـ <code>Params</code> الذي يحوّل <code>'/blog/:slug'</code> إلى <code>{ slug: string }</code> و<code>'/files/*rest'</code> إلى <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>الوسيط الثاني للصفحة. استخدم الـ destructuring لتأخذ ما تحتاجه الصفحة فقط.</p>
      <table>
        <thead><tr><th>الخاصية</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>موضع الصفحة في المكدس. انظر <code>Layer</code> أدناه.</td></tr>
          <tr><td><code>data</code></td><td>ما أرجعته <code>load()</code> للمسار، أو <code>undefined</code> إن لم يكن له. ويُحدَّد نوعه بـ <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>المكان الذي تعرض فيه الصفحة الأب مسارها الفرعي. راجع <a href="#router-patterns">المسارات المتداخلة</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>تسجّل دالة تحقق تُستدعى قبل مغادرة الصفحة. راجع <a href="#router-layers">حواجز المغادرة</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>موضع الصفحة في المكدس، ومخرجها منه.</p>
      <table>
        <thead><tr><th>عضو</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 للصفحة الأساسية، و1 فما فوق للـ layers المضافة</td></tr>
          <tr><td><code>push(href)</code></td><td>تفتح layer أخرى من داخل الصفحة، مثل <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>تغلق هذه الـ layer وكل ما فوقها، وتُكمل الـ promise الخاص بـ <code>push()</code> التي فتحتها. وبلا وسيط تُعدّ الـ layer ملغاة وتكون النتيجة undefined. ولا تفعل شيئًا عند العمق 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> و<code>withLoad()</code></h3>
      <p>الـ <code>DataLoader</code> هو <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>، وهو تصدير <code>load</code> الاختياري في module الصفحة. أما <code>withLoad(loader, load)</code> فتنشئ مسارًا يبدأ <code>load</code> بجانب استيراد الـ chunk بدل أن يبدأ بعده. راجع <a href="#router-loaders">الـ loaders</a>.</p>
      <h3>الأنواع</h3>
      <p>كل نوع هو named export من <code>nuclo-router</code>، فيمكنك تحديد أنواع صفحة أو loader أو حاجز مغادرة دون الاستيراد من مسار ملف.</p>
      <table>
        <thead><tr><th>النوع</th><th>ما هو</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>كائن المعاملات للنمط. و<code>RouteParams</code> هو الشكل العام دون استنتاج من النمط، و<code>Match</code> هي نتيجة الـ matcher.</td></tr>
          <tr><td><code>PageComponent</code></td><td>الصفحة: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>module الصفحة: الـ component نفسه، أو <code>{ default, load? }</code> كما يأتي من <code>import()</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>، وقد يحمل <code>load</code> من <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>الجدول الذي تقبله <code>createRouter()</code>: نمط إلى loader أو إلى جدول متداخل</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>، الوسيطة الثانية لـ <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>، الوسيطة الثانية لـ <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>نوع <code>outlet()</code> في <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>، وهو ما تأخذه <code>beforeLeave()</code></td></tr>
          <tr><td><code>MatchView</code></td><td>عرض لـ <code>matches()</code>: يستقبل المعاملات ويُرجع المحتوى أو <code>import()</code> لـ module صفحة</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "الـ layers وحواجز المغادرة",
        content: `
      <p>تفتح <code>push()</code> مسارًا فوق الحالي بدل أن تستبدله، وتُرجع promise يكتمل بالنتيجة التي تُغلق بها تلك الـ layer. وبما أن الصفحات كلها <code>list()</code> واحدة فوق المكدس، فإن فتح layer لا يعدو إضافة صف جديد. فلا يُعاد render للصفحة التي تحتها، ويبقى الـ DOM والـ focus والنموذج نصف المملوء كما هي عند إغلاق الـ layer.</p>
      <p>وهذا يجعل سيناريو "أحتاج إلى عنصر غير موجود بعد" يعمل دون التخلص من النموذج الذي كان المستخدم يملؤه:</p>
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
      <p>يمكن تداخل الـ layers. فالـ dialog الذي يحتاج dialog آخر يستدعي <code>layer.push()</code> وينتظره، دون الرجوع إلى كائن Route.</p>
      <ul>
        <li><strong>عنوان URL يعبّر عن الـ layer العليا.</strong> تضيف <code>push()</code> إدخالًا إلى السجل، فيمكن فتح الـ layer برابط مباشر ويغلقها زر الرجوع، فيُحَلّ <code>push()</code> الخاص بها بـ undefined كما في الإلغاء. فالرجوع و<code>close()</code> مسار برمجي واحد: <code>close()</code> تسجّل نتيجتها وترجع في السجل، والعمق في <code>history.state</code> هو المرجع. والمتصفحات تحتفظ بنحو 50 إدخالًا في التبويب، فبعد تنقّل طويل عبر الـ layers قد يختفي الإدخال الذي تحتها؛ عندها تغلق <code>close()</code> الـ layers في مكانها وتعيد كتابة الإدخال الحالي ليطابق الصفحة التي بقيت معروضة.</li>
        <li><strong>التنقل العادي يمسح المكدس.</strong> النقر على رابط أو <code>go()</code> ليس layer؛ فهو يستبدل كل شيء ويُسقط كل layer مفتوحة، فلا يبقى مستدعٍ ينتظر.</li>
        <li><strong>فتح الرابط مباشرة يعرض صفحة قائمة بذاتها.</strong> العنوان يسمّي الـ layer العليا لا المكدس الذي تحتها، فيعرضها فتحُه مباشرة صفًّا واحدًا، مع <code>layer.depth === 0</code> و<code>close()</code> خاملة. ويجب أن يكون للمسار المفتوح كـ layer معنى بمفرده أيضًا؛ فاستخدم شرطًا على <code>layer.depth</code> لعرض رابط بدل زر إلغاء لا يعمل.</li>
        <li><strong>الـ promise لا يصمد بعد إعادة تحميل الصفحة</strong> لأنه محفوظ في closure. فاعتبر النتيجة اختصارًا لتدفق يعمل أيضًا بالطريق الطويل.</li>
        <li><strong>لا شيء يبقى معلقًا.</strong> <code>stop()</code> تغلق كل layer مفتوحة دون نتيجة، وتُحَلّ الـ layer المهجورة بسبب التنقل بـ <code>undefined</code>.</li>
      </ul>
      <h3>حواجز المغادرة</h3>
      <p>الصفحة التي فيها ما يستحق الحفظ، كنموذج نصف مملوء، تسجّل حاجز مغادرة. يُستدعى الحاجز قبل التخلي عن الصفحة، وإرجاع <code>false</code> (أو promise يحلّ إليها) يُبقي المستخدم فيها:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>عند مغادرة الصفحة فقط.</strong> لا يُسأل الحاجز عن تنقل فرعي داخل الـ layout، ولا عن تغيير الـ query أو الـ hash الذي يُبقي الصفحة. ويعيش الحاجز ويموت مع صفحته، فلا يلزم إلغاء تسجيله.</li>
        <li><strong>كل طريق للخروج.</strong> رابط، و<code>go()</code>، والرجوع والتقدم، و<code>close()</code> للـ layer، و<code>go()</code> إلى URL لا يملكه الـ router (مغادرة التطبيق، حيث <code>to</code> تساوي <code>null</code>). والرجوع أو التقدم المرفوضان يُتراجَع عنهما فيبقى شريط العنوان على الصفحة. أما إغلاق التبويب أو إعادة التحميل فمهمة <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> هو <code>RouteContext</code> الذي يتجه إليه التنقل. وتُنفَّذ الحواجز بدءًا من الأعمق وتتوقف عند أول رفض. وإذا رمى أحدها استثناءً بقيت الصفحة. و<code>close(result)</code> يمر عبر الحاجز أيضًا، فامسح الـ flag الخاص بك قبل الإغلاق بنتيجة.</li>
        <li>لا يستطيع الـ router تطبيق الحواجز إلا على إدخالات السجل التي أنشأها. فلا يُستدعى الحاجز عند الرجوع أو التقدم إلى إدخال أُنشئ خارجه، مثل رابط <code>#fragment</code> عادي أو استدعاء <code>pushState</code> من script آخر.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() والـ routers الفرعية",
        content: `
      <p>تعرض <code>router.outlet()</code> الصفحة. أما <code>router.matches(table)</code> فتعرض شيئًا آخر يتبع مكانك الحالي، كشريط جانبي أو breadcrumbs أو شريط أدوات، من جدول صغير خاص به، دون أن تحمّل مسارًا أو تضيف صفحة:</p>
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
        <li><strong>المطابقة نفسها كجدول المسارات.</strong> الأنماط والأسبقية ومطابقة المسار الخام وتجريد <code>base</code> كلها من الـ router، فيتفق العرض والصفحة دائمًا على عنوان URL. وهي تقرأ مسار الـ layer العليا، مثل <code>router.path</code>.</li>
        <li><strong>العرض</strong> هو <code>(params, ctx) =&gt; content</code>، وتُستنتج أنواع <code>params</code> من نمطه، و<code>ctx</code> هو <code>RouteContext</code> مع <code>pattern</code> و<code>params</code> الخاصين بالعرض. وقد يُرجع بدل ذلك <code>import()</code> لـ module صفحة، فتُستدعى الصفحة بـ <code>ctx</code> حين يصل الـ module.</li>
        <li><strong>إن لم يطابق شيء لم يُعرض شيء.</strong> أضف عرض <code>'*'</code> كاحتياط. وهي فارغة قبل <code>start()</code> وبعد <code>stop()</code> كالـ outlet.</li>
        <li><strong>لا يُعاد العرض إلا حين يتغير المسار</strong>، ففي كل تنقل تبقى فيه الصفحة يحتفظ العرض أيضًا بالـ DOM الخاص به.</li>
        <li><strong>العرض المؤجل لا يعرض شيئًا حتى يصل الـ module الخاص به.</strong> وفشل <code>import()</code> يُسجَّل بـ <code>console.error</code> ولا يضبط <code>router.error</code>، وتُعاد محاولته في التنقل التالي. أما <code>update()</code> العادية فلا تعيد المحاولة.</li>
        <li><strong>على الخادم</strong> لا يعرض العرض المؤجل شيئًا لأن الـ module الخاص به يُحمَّل على العميل. استخدم عرضًا متزامنًا لكل ما يجب أن يحويه أول HTML.</li>
      </ul>
      <h3>الـ routers الفرعية</h3>
      <p>المسارات تدعم التداخل، فيكفي عادةً جدول متداخل لتكوين router فرعي. يتولى router واحد التنقل: صفحة <code>'/'</code> للقسم هي إطار واجهته، وتُعرض صفحاته الفرعية في <code>outlet()</code> الخاص بها، فيبقى الإطار قائمًا أثناء التنقل داخل القسم:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>أو امنح الميزة router خاصًا بها، يُنشأ ولا يُشغَّل أبدًا. يملك الأب مدخلًا شاملًا واحدًا، ويحلّ الابن الجزء المتبقي من المسار مقابل أنماطه ومعاملاته ومساره الاحتياطي:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>يجب إبقاء هذا الـ router غير مشغَّل، لأن <code>start()</code> تربط الـ listeners، وتشغيل أكثر من router يسبب تعارضًا. يتولى الـ router الفرعي المطابقة فقط، وأنت من تستدعي الـ loaders. ويُعاد بناء واجهة القسم عند تغيّر بقية المسار، لأن الـ router الرئيسي يرى مسارًا واحدًا وواجهة القسم هي التي تحل الباقي. أما الجدول المتداخل فيُبقي الصفحة الأب مركّبة، فهو الأفضل إلا إذا احتاج القسم فعلًا إلى router وbase ومسار احتياطي خاص به.</p>
    `,
      },
      {
        id: "router-multi",
        title: "routers متعددة وتحميل مشترك",
        content: `
      <p>يمكن أن يضم التطبيق من الـ routers بقدر ما فيه من المناطق. والقاعدة التي تُبسّط الأمر: <strong>شغّل router واحدًا بالضبط لكل مستند</strong>، واترك كل router آخر غير مشغَّل، وحلّ العناوين بـ <code>match()</code>. فالـ router المشغَّل وحده يملك الـ URL والسجل ومستمع النقرات، وما سواه جداول تسألها وتجيبك، وتستطيع كل منطقة أن تحمّل نفسها في توقيتها مع مؤشر تحميل مستقل.</p>
      <h3>تحميل مشترك: سلسلة من المحمّلات</h3>
      <p>قد تصدّر كل صفحة في السلسلة المطابقة <code>load()</code>. في التنقل البارد إلى مسار فرعي يعمل loader الـ layout وloader الصفحة <strong>بالتوازي</strong>، وتغطي <code>router.pending</code> السلسلة كلها: تبقى الصفحة السابقة على الشاشة حتى يكتمل الاثنان، فلا تُرسم أبدًا شجرة نصف محمّلة. ويتلقى كل component الـ <code>data</code> الخاصة به:</p>
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
      <p>يبدأ الـ loaderان معًا لا واحدًا بعد الآخر. و<code>router.pending</code> تكون true ما دام أيٌّ منهما ينتظر، وfalse فيما عدا ذلك، فلا يغيّرها مسار محمّل مسبقًا أو متاح مباشرة. والتنقل بين الأقسام يُبقي الـ layout، فلا يعمل إلا loader القسم من جديد؛ وتبقى بيانات الـ layout والـ DOM والمدخلات نصف المكتوبة كما هي. وإعادة التنقل إلى العنوان نفسه تعيد تشغيل loader الصفحة الطرفية وتبني صفها من جديد، كما في الصفحة الواحدة.</p>
      <h3>تحميل متعدد: router ثانٍ بمؤشر تحميل مستقل</h3>
      <p>للمنطقة المستقلة، كشريط جانبي أو drawer أو منطقة حية، router خاص يُنشأ دون تشغيل، ومؤشر تحميل خاص بها. فـ <code>router.pending</code> تتبع الـ router الرئيسي المشغَّل وحده، ولذلك يمكن تحميل المنطقتين بالتوازي وقد تنتهي أيٌّ منهما أولًا:</p>
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
      <p>الـ router الثاني للمطابقة فقط: تقرأ <code>match()</code> عنوان URL وتُرجع السياق دون أن تضيف مسارات الشريط الجانبي إلى الجدول الرئيسي. وتُنفَّذ <code>onNavigate</code> بعد اكتمال كل تنقل، ومنه الأول، فتعطيك موضعًا واحدًا لمزامنة المنطقة المستقلة مع عنوان URL.</p>
      <ul>
        <li><strong><code>pending</code> تتبع الـ router المشغَّل.</strong> الـ router غير المشغَّل ليس له مسار نشط ولا <code>pending</code> ولا <code>error</code>. فتتتبع المنطقة حالتها بنفسها، ويمكن عرض مؤشر تحميلها بجانب مؤشر المسار. وفي العرض التوضيحي يستغرق تحميل الشريط الجانبي 800 مللي ثانية بينما تعمل loaders المسار 900 مللي ثانية، فقد تنتهي الصفحة قبل الشريط الجانبي أو العكس.</li>
        <li><strong><code>match()</code> لا تربط أي listeners.</strong> يمكن لأي عدد من الـ routers غير المشغَّلة أن يتشارك المستند؛ لكل منها جدوله وbase وcache خاص به، ولا يلمس أي منها السجل. وكلفتها جدول ودالة مطابقة فقط.</li>
        <li><strong>لا تُشغَّل loaders هذا الـ router تلقائيًا.</strong> الـ router المشغَّل هو الذي ينفّذ <code>load()</code> للصفحات التي يطابقها. أما غير المشغَّل فيكتفي بمطابقة المسار؛ فإن احتاجت عروضه إلى بيانات فاجلبها بنفسك كما في <code>refreshSidebar()</code> بالعرض التوضيحي. ولإبقاء مسؤولية التحميل لدى الـ router الرئيسي استخدم جدولًا <a href="#router-matches">متداخلًا</a> أو منطقة <a href="#router-regions">تملؤها الصفحة</a>.</li>
        <li><strong>تجاهل الاستجابات القديمة.</strong> يجب ألا يصل رد طلب الشريط الجانبي البطيء إلى قسم انتقلت بعيدًا عنه. زِد عداد "جيل" الطلب عند كل تحديث وأسقط الردود التي لم تعد مطابقة، كما يتجاهل الـ router نفسه التنقلات التي حلّت محلها تنقلات أحدث.</li>
        <li><strong>عرض <code>matches()</code> المؤجل لا يُحتسب في <code>pending</code> كذلك.</strong> فهو لا يعرض شيئًا حتى يصل الـ module الخاص به. فهناك إذن ثلاثة أنظمة تحميل بثلاثة توقيتات مستقلة: <code>pending</code> للمسار، ومؤشرات التحميل التي تضعها أنت، والعرض المؤجل الذي لم يصل بعد.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "معالجة الروابط",
        content: `
      <p>المستمع المفوَّض يتولى النقر بالزر الأيسر على <code>&lt;a href&gt;</code>، ومنها <code>&lt;a&gt;</code> في SVG، والنقر على أي شيء داخلها، ويتنحّى جانبًا في كل ما عدا ذلك: النقر مع مفتاح معدِّل والنقر الأوسط، و<code>target</code> غير <code>_self</code>، و<code>download</code>، و<code>rel="external"</code>، وروابط href إلى origins أخرى، وروابط الـ hash وحدها في الصفحة الحالية، والمسارات خارج <code>base</code>، والمسارات التي لا يطابقها أي مسار (فيمكن أن يصل إليها الـ 404 الذي يعرضه الخادم)، وأي حدث استدعى معالج التطبيق عليه <code>preventDefault()</code> بالفعل. وللانسحاب صراحةً استخدم <code>data-nuclo-router="off"</code>.</p>
      <h3>التمرير</h3>
      <p>التنقل الذي يضيف إدخالًا إلى السجل يحافظ على موضع التمرير الحالي. وحين يحتوي العنوان الجديد على <code>#hash</code> يطابق عنصرًا في الصفحة يُمرَّر ذلك العنصر إلى منطقة الرؤية. أما <code>popstate</code> فيترك التمرير للمتصفح. وللوصول إلى أعلى الصفحات الجديدة افعل ذلك في <code>onNavigate</code> التي تخبرك بطريقة حدوث التنقل:</p>
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
        <li><strong>الـ Route لا يحتفظ بعناصر الـ DOM.</strong> يحتفظ فقط بدالة الصفحة وسياقها، والانتقال إلى صفحة أخرى يحرّر الصفحة السابقة. وتزيل <code>stop()</code> الـ listeners وتتخلى عن أي تحميل جارٍ وتمسح <code>pending</code>، فلا يبقى مؤشر تحميل عالقًا لمسار متوقف. وأي module يكتمل تحميله بعد <code>stop()</code> يُتجاهل بصمت.</li>
        <li><strong>عزل آمن للطلبات المتزامنة على الخادم.</strong> تُرجع <code>start()</code> حالة كل طلب، وتحصر <code>run()</code> نطاقها في render متزامن واحد، فلا ترى الطلبات المتداخلة مسارات بعضها. والمشترك الوحيد هو cache الـ modules. وينتهي النطاق حين تعود الدالة <code>run()</code>. والـ <code>renderToString()</code> متزامنة، وهذا يكفي؛ أما الـ render غير المتزامن أو المتدفق (streaming) فسيحتاج إلى تمرير المسار عبر <code>await</code>، وهو ما لا تفعله <code>run()</code>.</li>
        <li><strong>استعادة التمرير عند <code>popstate</code></strong> يتولاها المتصفح (<code>scrollRestoration</code>) لا الـ router.</li>
        <li><strong>شغّل router واحدًا لكل مستند.</strong> كل <code>start()</code> تضيف مستمع <code>click</code> المفوَّض الخاص بها، و<code>start()</code> لـ router ثانٍ لا تسحب مستمع الأول؛ وحدها <code>start()</code> ثانية على الـ router نفسه تفعل ذلك. ولحل عنوان URL مقابل جدول آخر أنشئ router واستدعِ <code>match()</code> فقط، فهي لا تربط أي listeners. وبهذا تستطيع منطقة مستقلة تشغيل تحميلها بجانب <code>pending</code> للمسار. راجع <a href="#router-multi">الـ routers المتعددة والتحميل المشترك</a>.</li>
        <li><strong>غير مضمَّن بحكم التصميم:</strong> الـ history من نوع hash ومن نوع memory، لأن المسار موجود في pathname ويجب أن يخدم الخادم كل مسار؛ ومنطقتان مستقلتان يوجّههما عنوان URL واحد، لأن الصفحة تملأ مناطق كثيرة بـ <code>into()</code> لكنها كلها تنتمي إلى المسار المطابق الواحد، ولا يزال بإمكان المنطقة المستقلة أن تحتفظ بـ router غير مشغَّل وبتحميل خاص بها كما في <a href="#router-multi">الـ routers المتعددة والتحميل المشترك</a>؛ والتحميل المسبق عند hover، وتحصل عليه باستدعاء loader المسار من <code>mouseenter</code>.</li>
      </ul>
      <h3>أمثلة</h3>
      <p>في المستودع مثالان قابلان للتشغيل يكمّل أحدهما الآخر، فتجد كل إعداد ظاهرًا في أحدهما:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: جولة من جهة العميل في الـ API كله. كل نمط وقاعدة أسبقية، والانسحاب من معالجة الروابط، وكل عضو في الـ Route مع عناصر تحكم مباشرة، وrouter فرعي، وثلاث layers متراكبة، وقسم نسبي مركَّب تحت أبوين، وloaders المسار مع <code>pending</code> و<code>error</code>. ويضبط <code>preload: false</code> لتبقى هذه الحالات مرئية.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> لكل طلب، وhydration يعيد استخدام عقد الخادم، ورموز حالة 404 حقيقية، و<code>base</code> غير الجذر، وتحميل مسبق وقت الخمول تشاهده في لوحة Network، وloader تُسلَّم بياناته من الخادم إلى العميل فلا تُجلب مرة ثانية عند الـ hydration.</li>
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
      <p>لا يوفر Nuclo API خاصًا بالقيم المحسوبة (computed). استخدم دالة عادية واستدعِها من دوال القيم الديناميكية:</p>
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
      <p>استخدم <code>async</code>/<code>await</code> العادي، واستدعِ <code>update()</code> كلما تغيّرت الـ state. وفي حالة الجلب (fetch) يعني ذلك مرة قبل <code>await</code> ومرة بعده:</p>
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
        <li><strong>اجمع التعديلات.</strong> عدّل كل الـ state التي تحتاجها، ثم استدعِ <code>update()</code> مرة واحدة.</li>
        <li><strong>اجعل القيم الديناميكية سريعة ونقية.</strong> فهي كلها تعمل عند كل <code>update()</code>.</li>
        <li><strong>استخدم <code>scope()</code></strong> للتحديثات الصغيرة المتكررة، مثل الكتابة أو المؤقتات.</li>
        <li><strong>اعرض داخل المستند.</strong> العقد غير الموجودة في المستند وقت تشغيل <code>update()</code> تتوقف عن التحديث.</li>
        <li><strong>استخدم <code>when()</code> و<code>list()</code></strong> للـ children المتغيرة، لا دالة تُرجع عقدًا.</li>
        <li><strong>استخدم <code>className</code> لا <code>class</code></strong>، واستخدم <code>() =&gt; cx(...)</code> أو <code>{ className: () =&gt; … }</code> للـ classes الديناميكية.</li>
        <li><strong>عرّف الأنماط مرة واحدة</strong> على مستوى الـ module.</li>
        <li><strong>الـ SSR:</strong> اعرض (render) أولًا، ثم ضع ناتج <code>getCssText()</code> في <code>&lt;style id="nuclo-styles"&gt;</code>. ومرّر بيانات الطلب كوسائط، وأبقِ تعليقات HTML في الناتج.</li>
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
      <p>كل دالة عامة ومصدرها.</p>
      <h3><code>nuclo</code> (أسماء عامة وnamed exports)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: تشغّل كل القيم الديناميكية، أو التي داخل الـ scopes المحددة.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: تمنح العنصر معرّفات scope لتستخدمها <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: محتوى شرطي، مع <code>.when()</code> و<code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: صف لكل عنصر، وتُطابَق صفوفه بالهوية.</li>
        <li><a href="#api-region"><code>region(options)</code></a> و<a href="#api-region"><code>into(id, ...content)</code></a>: مكان مسمّى في الشجرة، والمحتوى الذي يملؤه من أي موضع.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: event listener، أو <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: البناء والإلحاق.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: تفعيل HTML الذي أنتجه الخادم.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: إعادة استدعاء الـ components وتعديل الـ DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: classes مولَّدة من كائن النمط.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: دمج الأنماط، واللاحق يفوز.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: نسخ من <code>css</code> و<code>cx</code> و<code>variants</code> و<code>keyframes</code> و<code>globalStyle</code> مرتبطة بـ theme.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: أنماط من خيارات.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> و<a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (named exports فقط)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> و<a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>، <code>renderManyToString(inputs)</code>، <code>renderToStringWithContainer(input, tag?, attrs?)</code> و<code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">استيراد بأثر جانبي</a>، يضيف <code>document</code> و<code>Event</code> و<code>CustomEvent</code> و<code>Node</code> و<code>Element</code> و<code>HTMLElement</code> وclasses <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (حزمة منفصلة)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: الـ router، مع <code>start()</code> و<code>match()</code> و<code>outlet()</code> و<code>matches()</code> و<code>go()</code> و<code>push()</code> و<code>href()</code> و<code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: مسار يبدأ تحميل بياناته بالتوازي مع استيراد الـ chunk الخاص به.</li>
        <li><a href="#router-api">الأنواع</a>: <code>RouteContext</code> و<code>PageProps</code> و<code>Params</code> و<code>DataLoader</code> و<code>RouteTable</code> وغيرها.</li>
      </ul>
      <h3>أسماء عامة فقط</h3>
      <ul>
        <li><a href="#tag-builders">دوال بناء الوسوم الـ 175</a>: <code>div</code> و<code>span</code> و… و<code>var_</code>، و<code>svgSvg</code> و<code>pathSvg</code> و….</li>
        <li><a href="#typescript-setup">الأنواع</a>: <code>NodeModFn</code> و<code>NodeModLike</code> و<code>ExpandedElement</code> وغيرها. ويمكن أيضًا استيراد أنواع التنسيق مثل <code>StyleResult</code> من <code>'nuclo'</code>.</li>
      </ul>
      <h3>مفاتيح خاصة</h3>
      <ul>
        <li><a href="#attributes">الـ attributes</a>: <code>className</code> و<code>style</code> ومعالجات <a href="#events"><code>on*</code></a> و<a href="#lifecycle"><code>onMount</code> و<code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">كائنات التنسيق</a>: الاختصارات والـ pseudo states ومحددات <code>&amp;</code> وقواعد <code>@</code> و<code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "الأسئلة الشائعة",
        content: `
      <h3>هل تعديل الـ state يحدّث الواجهة؟</h3>
      <p>لا. يبقى الـ DOM كما هو حتى تستدعي <code>update()</code>.</p>

      <h3>هل يستخدم Nuclo signals أو proxies أو virtual DOM؟</h3>
      <p>لا. الـ state تبقى متغيرات وكائنات JavaScript عادية. وعندما تُعرض شجرة ينشئ Nuclo عناصر وعقدًا نصية حقيقية. وتنفّذ <code>update()</code> كل قيمة ديناميكية مسجلة، أو التي داخل الـ scopes المحددة، وتعدّل العقد نفسها التي تغيرت قيمتها. لا يوجد dependency graph ولا شجرة افتراضية.</p>

      <h3>لماذا تعرض صفحتي "false"؟</h3>
      <p>القيم المنطقية تُعرض كنص. فـ <code>div(ok &amp;&amp; span('Done'))</code> تعرض "false". استخدم <code>when(() =&gt; ok, span('Done'))</code> للـ children، و<code>ok ? 'Done' : ''</code> للنص.</p>

      <h3>لماذا لا يتغير صف القائمة عندما أعدّل العنصر؟</h3>
      <p>صفوف العناصر التي ما زالت في القائمة تُحفَظ ولا يُعاد render لها. فاستخدم قيمًا ديناميكية مثل <code>() =&gt; todo.text</code> للحقول التي تتغير. انظر <a href="#api-list"><code>list()</code></a>.</p>

      <h3>لماذا يتوقف جزء من واجهتي عن التحديث؟</h3>
      <p>الغالب أن العقد لم تكن في المستند وقت تشغيل <code>update()</code>؛ فيتوقف Nuclo عن تتبعها حتى لو أُلحقت لاحقًا، لذا اعرض داخل حاوية موجودة في المستند. وهناك سببان آخران: يتوقف <code>when()</code> عن التحديث إذا رمى شرطه استثناءً، وتبقى دالة النص فارغة إذا رمت عند أول تشغيل. راجع <a href="#api-update"><code>update()</code></a>.</p>

      <h3>متى أستخدم <code>forceUpdate()</code>؟</h3>
      <p>للتغييرات النادرة في القيم الثابتة فقط، مثل تبديل اللغة. وفيما عدا ذلك استخدم <code>update()</code>. انظر <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>كيف أضع صفحة داخل layout دون تمريرها كـ prop؟</h3>
      <p>حدد المكان بـ <code>region({ id: 'main' })</code> واطلب من الصفحة إرجاع <code>into('main', …)</code>. انظر <a href="#api-region"><code>region()</code> و<code>into()</code></a>.</p>

      <h3>كيف أفكّ تركيب (unmount) تطبيق؟</h3>
      <p>لفّه في <code>when()</code> واجعل شرطه غير متحقق. فإزالة الـ DOM يدويًا لا تُشغّل <code>onDestroy</code>. راجع <a href="#lifecycle">دورة الحياة</a>.</p>

      <h3>هل يتضمن Nuclo router؟</h3>
      <p>ليس في الحزمة الأساسية، لكنه متاح منفصلًا باسم <code>nuclo-router</code>، مع SSR وhydration وcode splitting للمسارات وتحميل مسبق وقت الخمول. ثبّته بـ <code>npm install nuclo nuclo-router</code>. انظر <a href="#router-overview">nuclo-router</a>.</p>

      <h3>هل لدى Nuclo effects؟</h3>
      <p>لا. <code>onMount</code> و<code>onDestroy</code> يعملان مرة واحدة لكل عنصر، ويرتبطان بالإدراج والإزالة. ولا شيء يُعاد تشغيله لمجرد أن بعض الـ state تغيّر.</p>
    `,
      },
    ],
  },

];
