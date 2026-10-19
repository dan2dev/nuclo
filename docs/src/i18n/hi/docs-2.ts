import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "Styling",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>Typed style object को generated CSS class में बदलता है। जो result मिले, उसे किसी भी tag builder को दे दें। Browser में rules एक <code>&lt;style id="nuclo-styles"&gt;</code> element में जाते हैं। Server पर <a href="#api-css-text"><code>getCssText()</code></a> वही rules लौटा देता है।</p>
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
        <li><code>css()</code> base declarations के लिए एक class बनाता है, और हर pseudo key, selector और media block के लिए एक-एक class अलग से। ऊपर वाले card को दो class मिलती हैं।</li>
        <li>Class के नाम content के hash होते हैं। एक जैसी style एक ही class share करती हैं, और server व client पर नाम भी वही बनते हैं।</li>
        <li>Style को module level पर एक बार define करें। <code>css()</code> object के हिसाब से cache करता है, इसलिए हर call पर नया object बनाएँगे तो वह हर बार दोबारा process होगा।</li>
        <li>Style object को <code>css()</code> में देने के बाद बदलने का कोई असर नहीं होता।</li>
        <li>हर style page या server process की पूरी life तक registered रहती है। जो values हर item के साथ बदलती हैं, जैसे data से आने वाली width, उनके लिए <a href="#attributes"><code>style</code> attribute</a> इस्तेमाल करें।</li>
      </ul>
      <h3>Named style</h3>
      <p>Readable class name चाहिए तो पहले एक नाम पास करें:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>Base class ठीक वही नाम होती है जो आपने दिया। बाकी blocks को <code>name-&lt;hash&gt;</code> मिलता है।</li>
        <li>नाम valid class name होना चाहिए। नहीं हुआ तो Nuclo warning देता है और खुद एक नाम बना लेता है।</li>
        <li>नाम global होते हैं। दो अलग style एक ही नाम लें, तो Nuclo warning देता है।</li>
      </ul>
      <h3>Result का इस्तेमाल</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> और <code>card.className</code>, दोनों class name लौटाते हैं।</p>
    `,
      },
      {
        id: "style-objects",
        title: "Style objects",
        content: `
      <p><code>css()</code> को दिए गए object में camelCase CSS properties, shorthand, और pseudo state, selector व media query के लिए nested keys हो सकती हैं। इन सबके लिए TypeScript autocomplete देता है। जो property typed set में नहीं है, जैसे <code>borderTopLeftRadius</code>, <code>fill</code> या <code>paddingInline</code>, उसे <code>raw</code> में रखें (नीचे देखें)।</p>
      <h3>Values</h3>
      <ul>
        <li>Numbers में <code>px</code> अपने आप जुड़ जाता है, सिवाय <code>0</code> और unitless properties के: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> और <code>gridRow</code>। <code>raw</code> में <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> और <code>animation-iteration-count</code> भी unitless हैं।</li>
        <li>Strings जैसी लिखी हैं वैसी ही use होती हैं। <code>null</code>, <code>undefined</code> और <code>false</code> skip हो जाते हैं।</li>
        <li><code>lineHeight</code> (और <code>leading</code>) unitless है, इसलिए <code>leading: 24</code> का मतलब font size का 24 गुना है। Pixels चाहिए तो <code>"24px"</code> लिखें।</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Shorthand</h3>
      <table>
        <thead><tr><th>Key</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, और हर side का padding</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding बाएँ-दाएँ / ऊपर-नीचे</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>margin के लिए यही दिशाएँ</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height और उनके min/max</td></tr>
          <tr><td><code>size</code></td><td>width और height दोनों</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>ये keys <code>true</code> लेती हैं:</p>
      <table>
        <thead><tr><th>Key</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (display set नहीं होता)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudo state</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> और <code>firstLetter</code>। इन्हें nest भी कर सकते हैं: <code>hover: { focus: {…} }</code> से <code>:hover:focus</code> बनता है।</p>
      <h3>Selector और rules</h3>
      <p>जो key <code>&amp;</code> से शुरू होती है वह selector है, और हर <code>&amp;</code> की जगह class आ जाती है। जो key <code>@</code> से शुरू होती है वह at-rule है: <code>@media</code>, <code>@container</code> या <code>@supports</code>।</p>
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
        <li>Key <code>&amp;</code> से ही शुरू होनी चाहिए। <code>".dark &amp;"</code> जैसी key ignore हो जाती है, इसलिए <code>"&amp;:is(.dark *)"</code> लिखें।</li>
        <li>दो nested <code>@media</code> blocks <code>and</code> से जुड़ जाते हैं। जिस query में media type है (<code>print</code>, <code>only screen</code>), उसे सबसे पहले रखा जाता है, क्योंकि syntax में type सिर्फ शुरुआत में आ सकता है। अगर दोनों को एक query में नहीं जोड़ा जा सकता, यानी दो media type हैं या शुरुआत में <code>not</code> है, तो warning आती है और सिर्फ अंदर वाली query use होती है। इसके अलावा कोई भी दूसरा nested at-rule बाहर वाले को replace कर देता है।</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>किसी भी property के लिए <code>raw</code> use करें, नाम बिल्कुल CSS वाला लिखें। यहाँ भी numbers में <code>px</code> जुड़ता है, इसलिए string पास करें:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>कोई भी दूसरी flat key kebab-case में बदलकर जैसी है वैसी लिख दी जाती है। इसलिए <code>colr: 'red'</code> जैसा typo भी एक declaration बन जाता है, जिसे browser बस drop कर देता है। किसी key के नीचे जो nested object pseudo state, screen, या <code>&amp;</code>/<code>@</code> key नहीं है, वह ignore हो जाता है। दोनों गलतियाँ TypeScript पकड़ लेता है।</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Styles को merge करता है। दो inputs एक ही property set करें, तो बाद वाली value जीतती है।</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Falsy inputs skip हो जाते हैं। Arrays flatten होते हैं। String में दिए class names अलग किए जाते हैं और duplicate हटा दिए जाते हैं।</li>
        <li>एक ही block (base, एक ही pseudo, एक ही media query) की generated classes मिलकर एक नई class बन जाती हैं। बाकी class names जैसे हैं वैसे रहते हैं।</li>
        <li>Argument order सिर्फ <code>cx()</code> को पता होता है। <code>div(base, blue)</code> में दोनों classes जुड़ जाती हैं, और जो rule बाद में बना था वही जीतता है। जो styles एक-दूसरे को override करती हैं, उन्हें एक ही <code>cx()</code> call में डालें।</li>
        <li>जब किसी named style का block दूसरे input के block से merge होता है, तो merged class <code>name-&lt;hash&gt;</code> बन जाती है, original नाम नहीं रहता। जो blocks merge नहीं होते, वे अपनी class रखते हैं, इसलिए <code>cx(pageTitle, 'extra')</code> में <code>page-title</code> अब भी रहता है।</li>
      </ul>
      <h3>Dynamic class</h3>
      <p>ऐसा function पास करें जो हमेशा <code>cx(...)</code> लौटाए:</p>
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
      <p>Function को अपने पहले run में ही style result लौटाना होगा। <code>() =&gt; active &amp;&amp; activeButton</code> class की जगह "false" text render कर देगा।</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>एक theme से जुड़े अपने <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> और <code>globalStyle</code> लौटाता है। Theme values को नाम देती है: नीचे वाली theme के साथ <code>borderColor: 'border'</code> से <code>#e5e7eb</code> लिखा जाता है, और TypeScript नाम autocomplete करता है। <code>screens</code> की हर entry media query के लिए एक style key बन जाती है, जैसे <code>md: {…}</code>।</p>
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
        <thead><tr><th>Theme key</th><th>कहाँ use होती है</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> और हर side की border color, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>नई style keys, जैसे <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Theme का नाम तभी resolve होता है जब वह पूरी value हो। <code>border: "1px solid primary"</code> में नाम resolve नहीं होता।</li>
        <li>बिना <code>@</code> वाली screen value <code>@media &lt;value&gt;</code> बन जाती है। जो value <code>@</code> से शुरू होती है, वह जैसी है वैसी use होती है, जैसे <code>"@container (min-width: 400px)"</code>।</li>
        <li>Screens सिर्फ <code>createCss()</code> से बने instance पर होती हैं। Global <code>css()</code> में कोई screen नहीं होती, पर वह <code>@media</code> key accept करता है।</li>
        <li>सभी instances और global helpers एक ही stylesheet share करते हैं। Screens के media rules declaration के order में लिखे जाते हैं, use के order में नहीं। इसलिए <code>min-width</code> वाली screens छोटी से बड़ी के क्रम में लिखें। हर app में एक ही <code>createCss()</code> instance रखें, ताकि order आपकी theme के हिसाब से रहे।</li>
        <li><code>theme</code> वही theme है जो आपने पास की थी।</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>ऐसा function बनाता है जो options के किसी set के लिए एक style लौटाता है, जैसे button का intent और size।</p>
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
        <li>Styles इसी order में merge होती हैं: पहले <code>base</code>, फिर हर group की चुनी हुई value, फिर match होने वाला हर compound variant। हर property में बाद वाली value जीतती है।</li>
        <li>Missing, <code>undefined</code> या <code>null</code> option होने पर default use होता है। जिस group का default नहीं है, वह skip हो जाता है।</li>
        <li>जिस group में सिर्फ <code>true</code> और <code>false</code> keys हैं, वह boolean लेता है।</li>
        <li>Compound तब लागू होता है जब उसमें लिखा हर group match करे, defaults भी गिने जाते हैं।</li>
        <li>हर selection एक बार बनता है और cache हो जाता है।</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() और globalStyle()",
        content: `
      <p><code>keyframes()</code> एक animation register करता है और उसका generated नाम लौटाता है। Frame keys <code>from</code>, <code>to</code> और percentages होती हैं, जैसे <code>"50%"</code> या <code>"0%, 100%"</code>। Frames सिर्फ flat properties लेते हैं। एक जैसे frames से हमेशा एक ही नाम मिलता है।</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> किसी भी selector के लिए rule जोड़ता है:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>Selector बिल्कुल वैसे ही use होता है जैसा आपने लिखा।</li>
        <li>सिर्फ flat properties काम करती हैं। Pseudo keys, screens और <code>@</code> keys ignore हो जाती हैं, इसलिए <code>globalStyle()</code> से media rule नहीं लिख सकते।</li>
        <li>एक ही rule सिर्फ एक बार जुड़ता है। उसी selector के लिए अलग style दूसरा rule जोड़ देती है, और बाद वाला जीतता है।</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() और resetStyles()",
        content: `
      <p><code>getCssText()</code> इस process में <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> और <code>globalStyle()</code> ने जो भी rules बनाए हैं, वो सब लौटाता है: पहले base rules, फिर <code>@media</code>, <code>@container</code> और <code>@supports</code> blocks। Server rendering में इसे use करें।</p>
      <ul>
        <li>इसे <code>renderToString()</code> के बाद call करें। Render के दौरान बने rules भी इसमें आ जाते हैं।</li>
        <li>यह किसी एक page या request को नहीं, पूरे process को cover करता है, और सिर्फ बढ़ता रहता है। इसमें कोई दिक्कत नहीं, क्योंकि class names content hash हैं।</li>
        <li>इसे <code>&lt;style id="nuclo-styles"&gt;</code> में डालें। Client उसी element को reuse करता है और जो rules पहले से उसमें हैं उन्हें skip कर देता है। दूसरी id के साथ, या बिना id के, client हर rule के साथ एक नई stylesheet फिर से जोड़ देता है।</li>
        <li>Text escape नहीं होता, इसलिए style values में untrusted input कभी न डालें।</li>
      </ul>
      <p><code>resetStyles()</code> testing के लिए helper है। यह हर rule और <code>#nuclo-styles</code> element हटा देता है। पहले बनी styles के class names तो रहते हैं, पर उनका CSS चला जाता है। इसे app या server में call न करें।</p>
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
    title: "Routing",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>अलग package:</strong> <code>nuclo-router</code> Nuclo core package का हिस्सा नहीं है। इसे <code>nuclo</code> के साथ install करें। यह preview release है, इसलिए इसका API अभी बदल सकता है।</div>
      <p>Nuclo के लिए routing: server rendering, hydration, code-split routes और idle preloading, सब <code>list()</code> और <code>update()</code> के ऊपर बना है। gzip के बाद लगभग ${NUCLO_ROUTER_GZIP_KB} KB। Nuclo के अलावा कोई dependency नहीं और कोई side effect नहीं, इसलिए use न हो तो tree shaking इसे हटा देती है।</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>या यही दो नाम देकर <code>pnpm add</code>, <code>yarn add</code> या <code>bun add</code> use करें। Peer dependency के तौर पर इसे <code>nuclo</code> 0.3 या उससे नया version चाहिए।</p>
      <p>Router तय करता है कि <em>क्या</em> load होगा। App तय करता है कि वह <em>कहाँ</em> दिखेगा, <code>router.outlet()</code> से: layer stack पर एक <code>list()</code>, हर layer की एक row, इसलिए साधारण page बस एक row है। Server और client एक ही tree बनाते हैं, इसलिए <code>hydrate()</code> server के बनाए nodes को reuse कर लेता है। बाकी सब कुछ <code>history</code>, एक delegated <code>click</code> listener और <code>requestIdleCallback</code> है।</p>
      <h3>एक import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> लौटने से पहले matching route का module load कर लेता है, इसलिए पहली tree server और client, दोनों पर पूरी बनती है। उसके बाद router उसी route की state पढ़ता है जिसे उसने start किया: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>।</p>
      <h3>पूरी app</h3>
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
      <p>बस, इतना ही integration है। Links इसलिए काम करते हैं कि <code>&lt;a href&gt;</code> सिर्फ एक <code>&lt;a href&gt;</code> ही है। <code>document</code> पर लगा एक delegated listener router के अपने links को पकड़ लेता है, और बाकी हर link browser के हवाले छोड़ देता है।</p>
      <p>Server पर <code>start()</code> हर request के लिए एक <code>Route</code> लौटाता है और router को छेड़ता नहीं, इसलिए एक साथ चल रही requests एक-दूसरे का route नहीं देख सकतीं। <code>route.run()</code> render पूरा होने तक उस route को router का active route बना देता है, इसलिए outlet भी वही पढ़ता है। Browser में हर page load पर एक ही route होता है, और <code>start()</code> उसे सीधे active route बना देता है। वहाँ <code>run()</code> की ज़रूरत नहीं।</p>
      <p>Page को अपना <a href="#router-api"><code>RouteContext</code></a> और <a href="#router-api"><code>PageProps</code></a> मिलता है, यानी <code>(ctx, { layer, data, outlet, beforeLeave })</code>, और वह इनमें से कम arguments भी ले सकता है। वह <code>list()</code> जो भी accept करता है, वह लौटा सकता है। Layout के किसी और हिस्से को भरना हो, तो page के अंदर से <code>into()</code> लौटाएँ, जैसे <code>div(article(…), into('sidebar', nav(…)))</code>। वह content page के साथ ही आता-जाता है। <a href="#router-regions">Pages और regions</a> देखें।</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Patterns और nested routes",
        content: `
      <table>
        <thead><tr><th>Pattern</th><th>किससे match होता है</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>बिल्कुल वही path</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>बाकी सभी paths, यानी आपका 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>पहले static patterns देखे जाते हैं, फिर dynamic patterns declaration के order में, और आखिर में सबसे लंबे prefix वाला catch-all चुना जाता है। इसलिए <code>'*'</code> सिर्फ वही पकड़ता है जो कोई और नहीं पकड़ता, और table में कहीं भी रखा जा सकता है। Trailing slash, duplicate slash और percent-encoding normalize हो जाते हैं, और param values decode होकर मिलती हैं। Matching हर pattern के लिए segment-by-segment comparison है। कोई regex न बनता है, न चलता है।</p>
      <h3>Route के relative paths</h3>
      <p><code>./</code> से लिखा pattern उस parent के relative होता है जिसमें वह declare हुआ है, और <code>./</code> से लिखा href active route के relative होता है। दोनों मिलकर एक reusable section बनाते हैं, जिसका मतलब हर parent के लिए एक ही रहता है। Table की value या तो loader होती है या दूसरी table, जिसकी keys उसी से जुड़ी होती हैं:</p>
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
      <p>ये दो lines छहों patterns बना देती हैं, और कोई path दो बार नहीं लिखना पड़ता। दोनों parents को वही loader objects मिलते हैं, इसलिए वे एक module cache और एक <code>import()</code> share करते हैं।</p>
      <ul>
        <li>Child table के अंदर <code>'./x'</code>, <code>'/x'</code> और <code>'x'</code> का मतलब एक ही है, <code>'/'</code> का मतलब parent का अपना path है, और <code>'*rest'</code> section को उसका अपना catch-all देता है। इन्हें जितना चाहें उतना deep nest कर सकते हैं।</li>
        <li>Top-level keys जैसी लिखी हैं वैसी ही use होती हैं, इसलिए <code>'*'</code> <code>'*'</code> ही रहता है।</li>
        <li><code>*catch-all</code> के नीचे child route रखना <code>createRouter()</code> error है, क्योंकि catch-all को अपना pattern खुद खत्म करना होता है।</li>
      </ul>
      <h3>Parent page और <code>outlet()</code></h3>
      <p>Parent और उसके child routes एक असली hierarchy हैं। Parent render होता है और child उसके अंदर render होता है, जहाँ भी वह <code>outlet()</code> call करे:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Child route बदलने पर parent दोबारा नहीं बनता। उसका DOM node वही रहता है, इसलिए focus, scroll position, आधा लिखा input और closure की state बनी रहती है।</p>
      <ul>
        <li>Child route न हो, तो page का outlet कुछ render नहीं करता, इसलिए layout उसे बिना शर्त call कर सकता है। अगर parent के child routes हैं लेकिन वह <code>outlet()</code> call नहीं करता, तो children दिखेंगे नहीं।</li>
        <li>अलग से index route नहीं होते। <code>'/'</code> खुद layout है, इसलिए parent path पर layout खाली outlet के साथ दिखता है, कोई अलग index page नहीं। शुरुआती content layout में रखें, या उसके लिए child path बना लें।</li>
      </ul>
      <p>फिर वही call किसी भी parent के अंदर से काम करती है, और ऐसे page से भी जिसे पता ही नहीं कि वह किसके अंदर है:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> और <code>..</code> मौजूदा route के path के relative resolve होते हैं, URL की "directory" के नहीं। <code>/invoices/42</code> से <code>./preview</code> का मतलब <code>/invoices/42/preview</code> है, जबकि browser इसे <code>/invoices/preview</code> बनाता। URL के आखिर में slash हो या न हो, इससे फर्क नहीं पड़ता। <code>../</code> एक segment ऊपर जाता है और route की root पर रुक जाता है। Query और hash बचे रहते हैं, <code>base</code> दोबारा जुड़ता है और पूरा absolute path history में जाता है। URL resolution के आम नियम से हटकर यही तरीका React Router भी <code>&lt;Link to="./x"&gt;</code> के लिए अपनाता है।</p>
      <ul>
        <li>सिर्फ <code>./</code> और <code>../</code> route के relative हैं। href में बिना prefix वाला <code>preview</code> browser के आम नियमों से resolve होता है।</li>
        <li>हाथ से <code>href="./preview"</code> लिखने की जगह <code>router.href('./preview')</code> से relative link बनाएँ। <code>href()</code> render के समय resolve हो जाता है, इसलिए जो markup मिलता है वह crawler के लिए, middle click के लिए और JavaScript बंद होने पर भी पूरा और सही रहता है।</li>
      </ul>
      <h3>क्या बचता है और क्या दोबारा बनता है</h3>
      <table>
        <thead><tr><th>Node</th><th>Navigation पर</th></tr></thead>
        <tbody>
          <tr><td>Parent जिसका pattern और path नहीं बदला</td><td><strong>बना रहता है</strong>: वही node, और उसका <code>load()</code> दोबारा नहीं चलता</td></tr>
          <tr><td>Matched page</td><td><strong>बना रहता है</strong> अगर उसका pattern और path नहीं बदला और उसमें कोई <code>load()</code> नहीं है, यानी query या hash बदलने पर वह वहीं रहता है। Loader वाला route हर visit पर fresh हो जाता है।</td></tr>
          <tr><td>वह parent जिसका path बदल गया</td><td>अपने अंदर के सारे content के साथ दोबारा बनता है</td></tr>
          <tr><td>Push की गई layer</td><td>सिर्फ matched page render करती है। उसके parents पहले से नीचे वाली row में mounted हैं।</td></tr>
        </tbody>
      </table>
      <p>जो page बना रहता है, उसका <code>ctx</code> भी वही रहता है जिससे वह बना था। यह बात हर <code>ctx</code> पर लागू होती है। Live values के लिए <code>router.*</code> पढ़ें। Query पर निर्भर filters, pagination और tabs के लिए dynamic value में <code>router.search</code> पढ़ें और <code>router.go('?page=2', { replace: true })</code> से लिखें। Page, focus और आधा लिखा input बने रहते हैं।</p>
    `,
      },
      {
        id: "router-regions",
        title: "Pages और regions",
        content: `
      <p><code>router.outlet()</code> page को एक जगह रखता है। जिस page को layout में कहीं और भी कुछ चाहिए, जैसे sidebar, toolbar या title, उसे <a href="#api-region"><code>into()</code></a> से भरा जाता है। Layout <code>region()</code> से जगह mark करता है, और page अपने content के साथ एक <code>into()</code> लौटाता है। Layout को page का content कभी props के रूप में नहीं मिलता, और navigation उसे कभी दोबारा नहीं बनाता।</p>
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
      <p>Page का content outlet की <code>list()</code> की एक row है, और <code>into()</code> तब तक ज़िंदा रहता है जब तक वह row उसे पकड़े रखती है। इसलिए sidebar का content page के साथ आता है और उसी के साथ चला जाता है: जिस page में <code>into('sidebar', …)</code> नहीं है, उस पर जाते ही region का <code>empty</code> content फिर दिखने लगता है। Page दोनों हिस्सों के लिए अपना <code>ctx</code> और <code>data</code> use कर सकता है, क्योंकि दोनों एक ही function ने बनाए हैं।</p>
      <h3>Navigation पर क्या होता है</h3>
      <ul>
        <li><strong>जो page बना रहता है, उसके regions भी बने रहते हैं।</strong> जो <a href="#router-patterns">query या hash बदलाव</a> page को बचाए रखते हैं, वे region का content भी नहीं बदलते। Sidebar query पर निर्भर हो, तो dynamic value में <code>router.search</code> पढ़ें।</li>
        <li><strong>दोबारा बना page उन्हें फिर भर देता है।</strong> Route बदलता है तो पुरानी row हट जाती है और नए page के <code>into()</code> views आ जाते हैं। पीछे कुछ नहीं बचता।</li>
        <li><strong>Push की गई layer एक view जोड़ती है।</strong> Layer outlet की अगली row है, इसलिए उसका <code>into()</code> उसी region का नया view है। Default <code>type: 'latest'</code> में वह layer बंद होने तक page के view को ढक देता है, और फिर page का view वापस दिखता है। <code>type: 'stack'</code> में दोनों दिखते हैं।</li>
        <li><strong>Parent page भी regions भर सकता है।</strong> उसके views तब भी बने रहते हैं जब उसके child routes बदलते हैं, क्योंकि parent page दोबारा नहीं बनता।</li>
        <li><strong>Server rendering भी इसी तरह काम करती है।</strong> Server <code>route.run()</code> के अंदर page बनाता है, इसलिए उसके <code>into()</code> views HTML में होते हैं, और <code>hydrate()</code> उन्हें reuse करता है।</li>
      </ul>
      <h3>एक page से कई regions</h3>
      <p>एक साथ कई regions भरने हों तो object पास करें। Page का main content फिर भी outlet से ही जाता है, इसलिए उसे <code>into()</code> के साथ लौटाएँ:</p>
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
      <h3>कौन सा tool कब</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> child route के लिए है: URL से तय होने वाला content, जो उसके parent page के अंदर render होता है। <a href="#router-patterns">Nested routes</a> देखें।</li>
        <li><strong><code>into()</code></strong> matched page के लिए है जो पूरे layout में फैला है। Content page का ही है और उसी का data use करता है।</li>
        <li><strong><code>matches()</code></strong> उस layout के लिए है जो सिर्फ URL से तय होता है: उसकी अपनी छोटी table होती है और कोई page शामिल नहीं होता। <a href="#router-matches"><code>matches()</code></a> देखें।</li>
      </ul>
      <p>ये सब एक ही matched route के हिस्से हैं। Router एक URL से दो independent regions नहीं चलाता। इसलिए जिस sidebar के अपने paths हैं, वह page से भरा region है, कोई दूसरा outlet नहीं। Sidebar को अपना router, loading और fallback चाहिए, तो router start न करें और <code>match()</code> से match करें। <a href="#router-multi">कई routers और combined loading</a> देखें।</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Route loaders और code splitting",
        content: `
      <p>Page module एक <code>load</code> function export कर सकता है। यह page बनने से पहले, उस route की हर navigation पर चलता है, और जो भी लौटाता है वह <code>data</code> बनकर page को मिल जाता है:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>Route table वैसी की वैसी रहती है। Loader page के module में रहता है। उसे match का <code>RouteContext</code> मिलता है, इसलिए <code>params</code>, <code>search</code> और <code>path</code> मिल जाते हैं। यह sync या async हो सकता है और server पर भी चलता है। इसलिए server से आए HTML में data पहले से होता है, पहली बार दिखाने के लिए hydration के बाद data आने का इंतज़ार नहीं करना पड़ता।</p>
      <p><strong>Module cache होता है। Data नहीं।</strong> Route का chunk एक बार fetch होकर reuse होता है, और उसका loader हर navigation पर फिर चलता है। इसीलिए <code>/blog/a</code> और <code>/blog/b</code> आपस में गड़बड़ नहीं हो सकते, और fail हुए loader को आसानी से retry किया जा सकता है।</p>
      <table>
        <thead><tr><th>Situation</th><th>Behaviour</th></tr></thead>
        <tbody>
          <tr><td>Loader चल रहा है</td><td><code>router.pending</code> true रहता है और पिछला page screen पर बना रहता है</td></tr>
          <tr><td>Loader throw या reject करता है</td><td>Error <code>router.error</code> में मिलता है। <code>go()</code> reject नहीं होता और navigation दोबारा try की जा सकती है।</td></tr>
          <tr><td><code>start()</code> के दौरान</td><td>Rejection <code>start()</code> से मिलता है। Error रखने के लिए अभी कोई route बना ही नहीं है।</td></tr>
          <tr><td>Push की गई layer</td><td>अपने data के साथ अपना loader चलाती है</td></tr>
          <tr><td>Idle preloader</td><td>सिर्फ module load करता है। उसे देने के लिए कोई context नहीं होता, और data load करने से ऐसे route का data भी आ सकता है जिसे आप कभी खोलें ही नहीं।</td></tr>
          <tr><td>उसी URL पर दोबारा navigation</td><td>Loader फिर चलता है और row दोबारा बनती है। बिना loader वाला route अपनी row बनाए रखता है।</td></tr>
        </tbody>
      </table>
      <p>Revalidate करना हो, तो history entry जोड़े बिना उसी जगह navigate करें जहाँ आप पहले से हैं:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Chunk के साथ data load करना</h3>
      <p>Page module का export किया हुआ <code>load</code> उस module के आने के बाद ही चल सकता है, इसलिए cache खाली हो तो navigation पहले chunk load करता है और फिर data। दोनों को एक साथ शुरू करना हो, तो loader को table में <code>withLoad()</code> के साथ declare करें:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>यह module के अपने <code>load</code> की जगह ले लेता है और हर visit पर इसी तरह चलता है। Chunk load होते समय data loader reject हो जाए, तो error आम तरीके से <code>router.error</code> में मिलता है।</p>
      <p>Design के हिसाब से HTML में server का data serialize नहीं होता। Hydration पर client का <code>load</code> फिर चलता है। यह आपके लिए मायने रखता है, तो server को <code>route.data</code> output में लिखने दें, जैसे <code>window.__DATA__</code> के रूप में, और loader उसे पहले check करे। <code>route.data</code> सिर्फ matched page का data है। उसमें parent के <code>load()</code> का result नहीं होता।</p>
      <h3>Code splitting और preloading</h3>
      <p>Route की value हमेशा ऐसा function होती है जो page component लौटाता है, इसलिए component ज़रूरत पड़ने पर ही load होता है:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>सिर्फ module वाले forms ही <code>load</code> export कर सकते हैं। <code>.then(m =&gt; m.BPage)</code> से named component चुनने पर router को सिर्फ function मिलता है।</p>
      <p>हर module एक बार import होकर cache हो जाता है। एक ही route पर साथ चल रही navigations एक <code>import()</code> share करती हैं। Page पर <code>idleTimeout</code> तक कोई activity न हो (default एक second; कोई tap, key, wheel event या scroll नहीं), तो बाकी routes background में load होते हैं: हर idle period (<code>requestIdleCallback</code>) में एक। कोई भी input या pending navigation इसे तब तक रोक देता है जब तक page फिर idle न हो जाए।</p>
      <p>Preloaded या पहले से load हो चुका route कभी <code>router.pending</code> को नहीं बदलता और अगले paint से पहले आ जाता है: कोई spinner frame नहीं, कोई layout shift नहीं। <code>router.pending</code> सिर्फ तब true होता है जब किसी module या loader का इंतज़ार करना पड़े, और तब भी जाने वाला page screen पर रहता है। Chunk load fail हो तो error <code>router.error</code> में मिलता है। वह unhandled rejection नहीं बनता और दोबारा try किया जा सकता है।</p>
    `,
      },
      {
        id: "router-api",
        title: "Router API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> हर pattern को loader या nested table से map करती है। Options:</p>
      <table>
        <thead><tr><th>Option</th><th>Default</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>वह URL prefix जिसके नीचे app serve होती है, जैसे <code>'/docs'</code>। यह सिर्फ segment boundary पर match करता है: <code>/docs/intro</code> <code>'/docs'</code> के अंदर है, <code>/docsearch</code> नहीं। इसके बाहर के URLs किसी से match नहीं होते, इसलिए <code>start()</code> reject कर देता है (आपका server-side 404) और उनके links browser पर छोड़ दिए जाते हैं।</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Page idle होने पर बाकी routes के modules background में load करें। <code>false</code> इसे बंद कर देता है।</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>बिना tap, key, wheel event या scroll के कितना समय (milliseconds में) बीते, तब preloading शुरू होती है या activity के बाद फिर शुरू होती है।</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, browser में हर resolve हुई navigation के बाद call होता है, पहली navigation समेत, DOM update होने के बाद। <code>kind</code> <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (back, forward, <code>close()</code>) या <code>'layer'</code> होता है। <code>document.title</code>, meta tags, focus, scrolling और analytics के लिए hook। SSR के दौरान कभी call नहीं होता।</td></tr>
        </tbody>
      </table>
      <p>यह router लौटाता है: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, और <code>run()</code> को छोड़कर <code>Route</code> का हर member, जो active Route से पढ़े जाते हैं। Active Route वही है जो browser में आखिरी <code>start()</code> ने लौटाया, या server पर वह जिसका <code>run()</code> चल रहा है। Active route न हो तो member पढ़ने पर error throw होता है। Route table, compiled matcher और module cache router में रहते हैं, इसलिए server पर requests इन्हें share करती हैं।</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Page modules में <code>url</code> (browser में default: <code>location.href</code>) को resolve करता है और <code>Promise&lt;Route&gt;</code> लौटाता है। कुछ भी match न हो और table में <code>'*'</code> route न हो, तो reject कर देता है। Server पर वही आपका 404 है। Browser में यह उस Route को router का active route बना देता है, <code>popstate</code> और delegated <code>click</code> listeners जोड़ता है और preloading schedule करता है। दूसरा <code>start()</code> पिछले route को आपके लिए खत्म कर देता है। Server पर यह कुछ भी share की हुई चीज़ नहीं छूता, इसलिए <code>route.run()</code> के अंदर render करें।</p>
      <h3><code>router.match(url?)</code></h3>
      <p>कुछ भी load किए बिना URL को table से match करता है: न import होता है, न history बदलती है, न listener या route बनता है। Match होने पर <code>RouteContext</code> लौटाता है। URL <code>base</code> के बाहर हो, किसी pattern से न मिले, या browser में दूसरे origin का हो, तो <code>null</code> लौटाता है। सिर्फ absolute URL लेता है, क्योंकि <code>./</code> resolve करने के लिए active route चाहिए।</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Active route के pages को <code>list()</code> के रूप में लौटाता है। Pages जहाँ दिखाने हों, इसे वहाँ एक बार रखें। Push की गई layer इसमें अगली row होती है। <code>start()</code> पूरा होने से पहले और <code>stop()</code> के बाद यह खाली रहता है। Server पर यह वही route render करता है जिसका <code>run()</code> चल रहा है।</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Active route के path से match होने वाली दूसरी table का view render करता है, एक <code>list()</code> के रूप में जिसे आप कहीं भी रख सकते हैं। <a href="#router-matches"><code>matches()</code></a> देखें।</p>
      <h3><code>Route</code></h3>
      <p><code>run()</code> को छोड़कर हर member router पर भी मौजूद है, जहाँ से app उसे पढ़ती है।</p>
      <table>
        <thead><tr><th>Member</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>Active match। <code>search</code> एक <code>URLSearchParams</code> है। <code>search</code>, <code>hash</code> और <code>url</code> live values हैं।</td></tr>
          <tr><td><code>pending</code></td><td>कोई navigation किसी module या loader का इंतज़ार कर रही है</td></tr>
          <tr><td><code>error</code></td><td>आखिरी fail हुआ load, अगली navigation पर साफ़ हो जाता है</td></tr>
          <tr><td><code>data</code></td><td>Matched page का <code>load()</code> क्या लौटा, server पर serialize करने के लिए। इसमें parent का data नहीं होता।</td></tr>
          <tr><td><code>depth</code></td><td>Stack पर कितनी layers हैं (साधारण page के लिए 1)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>Navigate करता है और ज़रूरत हो तो modules load करता है। कभी reject नहीं होता: module reject या throw करे, तो error <code>error</code> में मिलता है।</td></tr>
          <tr><td><code>push(href)</code></td><td>Route को ऊपर नई layer में खोलता है। Layer बंद होने पर उसके result से resolve होता है। <code>./</code> accept करता है। Match न होने या module fail होने पर reject होता है।</td></tr>
          <tr><td><code>href(path)</code></td><td><code>a({ href })</code> के लिए path के आगे <code>base</code> जोड़ता है। <code>./</code> और <code>../</code> को active route के हिसाब से resolve करता है।</td></tr>
          <tr><td><code>stop()</code></td><td>हर listener हटाता है, खुली layers dismiss करता है, outlet खाली करता है। दोबारा call करने पर भी वही result रहता है। Stop हुआ route अपने आखिरी match के साथ अब भी जवाब देता है, और <code>go()</code> कुछ नहीं करता।</td></tr>
          <tr><td><code>run(fn)</code></td><td>इस route को router का active route बनाकर <code>fn</code> call करता है और उसका result लौटाता है। Server पर: <code>route.run(() =&gt; renderToString(App))</code>। सिर्फ synchronous। <code>fn</code> के लौटते ही route का active scope खत्म हो जाता है।</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Page का पहला argument: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>। यह वही context है जिसके साथ page बना था। Live values के लिए <code>router.*</code> पढ़ें। दोनों में फर्क सिर्फ तब आता है जब query या hash दोबारा बनाए बिना बदल जाए।</p>
      <p><code>params</code> default में <code>{ [name]: string }</code> होता है। Page इसे <code>Params</code> से अपने pattern के हिसाब से type कर सकता है, जो <code>'/blog/:slug'</code> को <code>{ slug: string }</code> में और <code>'/files/*rest'</code> को <code>{ rest: string }</code> में बदल देता है:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>Page का दूसरा argument। Page को जो चाहिए, बस उसे destructure कर लें।</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>Page stack में कहाँ बैठा है। नीचे <code>Layer</code> देखें।</td></tr>
          <tr><td><code>data</code></td><td>Route का <code>load()</code> क्या लौटा, या loader न हो तो <code>undefined</code>। <code>PageProps&lt;TData&gt;</code> से type होता है।</td></tr>
          <tr><td><code>outlet</code></td><td>वह जगह जहाँ parent page अपना child route render करता है। <a href="#router-patterns">Nested routes</a> देखें।</td></tr>
          <tr><td><code>beforeLeave</code></td><td>Guard register करता है, जिसे page हटाने से पहले call किया जाता है। <a href="#router-layers">Leave guards</a> देखें।</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Stack में page की जगह, और उससे बाहर निकलने का तरीका।</p>
      <table>
        <thead><tr><th>Member</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>Base page के लिए 0, push की गई layer के लिए 1 और उससे ऊपर</td></tr>
          <tr><td><code>push(href)</code></td><td><code>Route.push()</code> की तरह, page के अंदर से दूसरी layer खोलता है</td></tr>
          <tr><td><code>close(result?)</code></td><td>इस layer और इसके ऊपर की सब चीज़ें बंद करता है, और इसे खोलने वाले <code>push()</code> को resolve करता है। बिना argument के call करने का मतलब cancel है। Depth 0 पर यह कुछ नहीं करता।</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> और <code>withLoad()</code></h3>
      <p><code>DataLoader</code> यानी <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, जो page module का optional <code>load</code> export है। <code>withLoad(loader, load)</code> ऐसा route बनाता है जिसका <code>load</code> उसके chunk के import के बाद शुरू होने की जगह उसके साथ-साथ शुरू होता है। <a href="#router-loaders">Route loaders</a> देखें।</p>
      <h3>Types</h3>
      <p>हर type <code>nuclo-router</code> का named export है, इसलिए page, loader या guard को type करने के लिए path से import करने की ज़रूरत नहीं।</p>
      <table>
        <thead><tr><th>Type</th><th>यह क्या है</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>किसी pattern के लिए params object। <code>RouteParams</code> इसका बिना specific type वाला रूप है, और <code>Match</code> matcher का result है।</td></tr>
          <tr><td><code>PageComponent</code></td><td>Page: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>Page module: खुद component, या <code>import()</code> से मिलने वाला <code>{ default, load? }</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, optional तौर पर <code>withLoad()</code> से मिला <code>load</code> भी रखता है</td></tr>
          <tr><td><code>RouteTable</code></td><td><code>createRouter()</code> को दी जाने वाली table: pattern से loader या nested table का map</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, <code>go()</code> का दूसरा argument</td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, <code>onNavigate</code> का दूसरा argument</td></tr>
          <tr><td><code>Outlet</code></td><td><code>PageProps</code> में <code>outlet()</code> का type</td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, <code>beforeLeave()</code> जो लेता है</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code> का view: params लेकर content या page का <code>import()</code> लौटाता है</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Layers और leave guards",
        content: `
      <p><code>push()</code> मौजूदा route को बदलने की जगह उसके ऊपर नया route खोलता है। Layer बंद होने पर जो result दिया गया हो, उससे इसका Promise resolve होता है। Page stack में बस एक ही <code>list()</code> है, इसलिए layer खोलना यानी उसमें नई row जोड़ना। नीचे वाला page दोबारा render नहीं होता। Layer बंद होने पर उसका DOM, focus और आधा भरा form वैसा ही मिलता है।</p>
      <p>इससे user का आधा भरा form हटाए बिना नया record बनाया जा सकता है, जब ज़रूरी record अभी मौजूद न हो:</p>
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
      <p>Layers को nest भी कर सकते हैं। दूसरे dialog की ज़रूरत हो, तो dialog खुद <code>layer.push()</code> call करके उसका इंतज़ार कर सकता है। उसे route का reference नहीं चाहिए।</p>
      <ul>
        <li><strong>URL सबसे ऊपर वाली layer का होता है।</strong> <code>push()</code> history में entry जोड़ता है, इसलिए layer का link बन सकता है। Back उसे Cancel की तरह बंद करता है और उसका <code>push()</code> cancel वाले result से resolve होता है। Back और <code>close()</code> एक ही code path use करते हैं: <code>close()</code> result रखकर history में पीछे जाता है, और <code>history.state</code> की depth तय करती है कि क्या दिखेगा। Browsers हर tab में लगभग 50 entries रखते हैं। Layer में लंबी navigation हो, तो नीचे की entry हट सकती है। तब <code>close()</code> layer को वहीं बंद कर देता है और मौजूदा entry को दिख रहे page के URL से replace कर देता है।</li>
        <li><strong>साधारण navigation stack साफ़ कर देती है।</strong> Link click या <code>go()</code> layer नहीं है। यह सब कुछ replace कर देता है और हर खुली layer dismiss कर देता है, इसलिए किसी caller को इंतज़ार नहीं करना पड़ता।</li>
        <li><strong>सीधे URL खोलने पर layer अलग page होती है।</strong> URL सबसे ऊपर वाली layer बताता है, नीचे का stack नहीं। इसलिए उसका URL सीधे खोलने पर वह depth 1 पर render होती है, जहाँ <code>layer.depth === 0</code> है और <code>close()</code> कुछ नहीं करता। Push होने वाला route अपने आप में भी काम का होना चाहिए। <code>layer.depth</code> check करके Cancel button की जगह बाहर जाने का link दिखाएँ।</li>
        <li><strong>Promise reload के बाद नहीं बचता,</strong> क्योंकि वह closure की state में रहता है। Result लौटाना इस flow को छोटा करने का तरीका है; flow को सीधे खोलने पर भी काम करना चाहिए।</li>
        <li><strong>कोई भी इंतज़ार में अटका नहीं रहता।</strong> <code>stop()</code> हर खुली layer dismiss कर देता है, और navigation से छूटी हुई layer <code>undefined</code> के साथ resolve हो जाती है।</li>
      </ul>
      <h3>Leave guards</h3>
      <p>जिस page में बचाने लायक कुछ हो, जैसे आधा भरा form, वह guard register करता है। Page छोड़ने से पहले guard से पूछा जाता है, और <code>false</code> (या उसका Promise) लौटाने पर page वहीं रहता है:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>सिर्फ page हटने पर।</strong> Layout के child route बदलने पर, या page को बचाए रखने वाले query/hash बदलाव पर guard से नहीं पूछा जाता। Guard की life page से जुड़ी है, इसलिए उसे अलग से unregister नहीं करना पड़ता।</li>
        <li><strong>Page छोड़ने के सभी रास्तों पर।</strong> Links, <code>go()</code>, Back और Forward, layer का <code>close()</code> और router के बाहर के URL पर <code>go()</code>, यानी app छोड़ते समय <code>to</code> की value <code>null</code> होती है। Guard Back या Forward रोक दे, तो history वापस की जाती है ताकि address bar मौजूदा page से मेल खाए। Tab बंद करना या reload करना <code>beforeunload</code> से संभालें।</li>
        <li><strong><code>to</code></strong> destination का <code>RouteContext</code> है। Guards सबसे अंदर वाले page से शुरू होते हैं और पहले इनकार पर रुक जाते हैं। Guard error throw करे, तो page वहीं रहता है। <code>close(result)</code> भी guard से होकर जाता है, इसलिए result के साथ बंद करने से पहले अपना flag साफ़ कर लें।</li>
        <li>Router सिर्फ अपनी बनाई history entries की navigation वापस कर सकता है। Browser के आम <code>#fragment</code> links या किसी दूसरी script के <code>pushState</code> से बनी entry पर Back या Forward करने पर guard से नहीं पूछा जाता।</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() और sub-routers",
        content: `
      <p><code>router.outlet()</code> pages render करता है। <code>router.matches(table)</code> मौजूदा path के हिसाब से अपनी छोटी table से sidebar, breadcrumb या toolbar जैसा दूसरा content render करता है। इसके लिए routes load करने या pages जोड़ने की ज़रूरत नहीं:</p>
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
        <li><strong>Route table जैसा ही matching।</strong> Patterns, priority, raw-path matching और <code>base</code> stripping router के अपने हैं, इसलिए view और page URL को लेकर हमेशा एक ही बात कहते हैं। यह <code>router.path</code> की तरह सबसे ऊपर वाली layer का path पढ़ता है।</li>
        <li><strong>View</strong> यानी <code>(params, ctx) =&gt; content</code>, जहाँ <code>params</code> उसके pattern से type होता है और <code>ctx</code> view के <code>pattern</code> और <code>params</code> वाला <code>RouteContext</code> है। इसकी जगह यह page module का <code>import()</code> भी लौटा सकता है, जिसे land होने के बाद <code>ctx</code> के साथ call किया जाता है।</li>
        <li><strong>कुछ match न हो, तो कुछ render नहीं होता।</strong> Fallback के लिए <code>'*'</code> view जोड़ें। Outlet की तरह यह <code>start()</code> से पहले और <code>stop()</code> के बाद खाली रहता है।</li>
        <li><strong>यह सिर्फ route बदलने पर दोबारा render होता है</strong>, इसलिए जिन बदलावों पर page बना रहता है, उन पर view का DOM भी बना रहता है।</li>
        <li><strong>Lazy view तब तक कुछ render नहीं करता जब तक उसका module न आ जाए।</strong> Fail हुआ <code>import()</code> <code>console.error</code> के साथ log होता है, <code>router.error</code> set नहीं करता, और अगली navigation पर retry होता है। साधारण <code>update()</code> retry नहीं करता।</li>
        <li><strong>Server</strong> पर lazy view कुछ नहीं भेजता, क्योंकि उसका module client पर land होता है। जो चीज़ पहले HTML में चाहिए, उसके लिए synchronous view use करें।</li>
      </ul>
      <h3>Sub-routers</h3>
      <p>Routes nest होते हैं, इसलिए sub-router आमतौर पर बस एक nested table होती है। एक ही router: section का अपना <code>'/'</code> page उसका बाहरी UI है, और उसके child routes उस page के <code>outlet()</code> में render होते हैं, इसलिए section के अंदर navigate करने पर बाहरी UI बचा रहता है:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>या feature का अलग router बनाएँ और उसे start न करें। Parent में एक catch-all entry रखें, और child अपने pattern, params और fallback के हिसाब से बाकी path match करे:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>इसे start न करना ज़रूरी है। <code>start()</code> listeners जोड़ता है, और दो started routers आपस में टकराते हैं। इस रूप में child खुद route resolve करता है, इसलिए started router जिन route loaders को चलाता, उन्हें आपको खुद call करना होगा। बाकी path बदलने पर shell भी दोबारा बनता है: main router को सिर्फ एक route दिखता है और shell बाकी path खुद resolve करता है। Nested table parent page को mounted रखती है। इसलिए उसे ही प्राथमिकता दें, जब तक feature को अपना router, base और fallback चाहिए ही न हो।</p>
    `,
      },
      {
        id: "router-multi",
        title: "कई routers और combined loading",
        content: `
      <p>App में हर region का अपना router हो सकता है। नियम सीधा है: <strong>हर document में सिर्फ एक router start करें</strong>। बाकी routers start न करें, और उनसे <code>match()</code> के ज़रिए URL का match पूछें। सिर्फ started router URL, history और click listeners संभालता है। बाकी route tables हैं जिनसे match पूछा जा सकता है। हर region अपने spinner के साथ independently load हो सकता है।</p>
      <h3>Combined loading: loaders की एक chain</h3>
      <p>Match की chain का हर page <code>load()</code> export कर सकता है। Cache खाली हो और child route खोलें, तो layout और page के loaders <strong>parallel चलते हैं</strong>। एक <code>router.pending</code> पूरी chain की state बताता है। दोनों पूरे होने तक पिछला page screen पर रहता है, इसलिए अधूरी tree कभी दिखाई नहीं देती। हर component को अपना <code>data</code> मिलता है:</p>
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
      <p>दोनों loaders एक के बाद एक चलने की जगह साथ शुरू होते हैं। किसी का भी इंतज़ार हो, तो <code>router.pending</code> true होता है; बाकी समय false। पहले से available या preload हुए route पर यह नहीं बदलता। Section बदलने पर layout बना रहता है, इसलिए सिर्फ section का loader दोबारा चलता है। Layout का data, DOM और आधा लिखा input बचा रहता है। उसी URL पर दोबारा navigate करने पर आखिरी page का loader फिर चलता है और उसकी row फिर बनती है, जैसे अकेले page के साथ होता है।</p>
      <h3>Multiple loading: अपने spinner के साथ दूसरा router</h3>
      <p>Independent region, जैसे sidebar, tray या live region, को अपना router मिलता है, जो बनाया तो जाता है पर कभी start नहीं होता, और उसका अपना loading flag होता है। <code>router.pending</code> started router का है और इस region के बारे में कुछ नहीं कहता, इसलिए दोनों साथ-साथ load हो सकते हैं और कोई भी पहले खत्म हो सकता है:</p>
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
      <p>दूसरे router से सिर्फ match पूछा जाता है; उसे navigate करने को नहीं कहा जाता। <code>match()</code> URL पढ़कर context लौटाता है। Sidebar की कोई जानकारी main route table में नहीं जाती। <code>onNavigate</code> हर पूरी हुई navigation के बाद चलता है, पहली navigation समेत। इसलिए independent region को URL के साथ sync रखने के लिए बस यही एक जगह काफी है।</p>
      <ul>
        <li><strong><code>pending</code> started router का है।</strong> Unstarted router में कोई route, <code>pending</code> या <code>error</code> नहीं होता। Region अपने flags रखता है और उसका spinner main spinner के साथ दिख सकता है। Demo में sidebar 800 milliseconds लेता है और route के loaders 900 milliseconds, इसलिए page या sidebar में से कोई भी पहले पूरा हो सकता है।</li>
        <li><strong><code>match()</code> कुछ भी attach नहीं करता।</strong> जितने चाहें उतने unstarted routers document share कर सकते हैं; हर एक की अपनी table, base और module cache है, और उनमें से कोई history को नहीं छूता। उनकी कीमत बस एक table और एक matcher है।</li>
        <li><strong>इसके loaders कभी नहीं चलते।</strong> Started router matching pages के <code>load()</code> चलाता है। Unstarted router सिर्फ URL match करता है, इसलिए अगर उसके view को data चाहिए, तो उसे खुद fetch करें, जैसे demo का <code>refreshSidebar()</code>। Loaders चाहिए, तो <a href="#router-matches">nested table</a> या <a href="#router-regions">page से भरा जाने वाला region</a> वह काम started router के साथ ही रखता है।</li>
        <li><strong>पुराने responses से बचें।</strong> धीमे sidebar fetch का result उस section पर लागू न होने दें जहाँ से आप जा चुके हैं। हर refresh पर generation counter बढ़ाएँ और पुराने responses छोड़ दें। Router भी नई navigation के आगे निकलने पर पिछली navigation को इसी तरह बेअसर कर देता है।</li>
        <li><strong>Lazy <code>matches()</code> view में भी <code>pending</code> नहीं होता।</strong> यह तब तक कुछ render नहीं करता जब तक उसका module land न हो जाए। तीन loading systems, तीनों की अपनी अलग timing: route का <code>pending</code>, आपके अपने flags, और lazy view जो अभी तक आया नहीं।</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Links handle करना",
        content: `
      <p>Delegated listener <code>&lt;a href&gt;</code> या उसके अंदर के किसी element पर left click से navigate करता है, SVG <code>&lt;a&gt;</code> समेत। बाकी सब कुछ browser पर छोड़ देता है: modifier key के साथ click, middle click, <code>_self</code> से अलग <code>target</code>, <code>download</code>, <code>rel="external"</code>, दूसरे origin के href, मौजूदा page के सिर्फ hash वाले links, <code>base</code> के बाहर के paths, किसी route से न मिलने वाले paths (ताकि server का 404 खुल सके) और वे events जिन पर app का handler पहले ही <code>preventDefault()</code> call कर चुका हो। किसी link को इससे बाहर रखना हो तो <code>data-nuclo-router="off"</code> लगाएँ।</p>
      <h3>Scrolling</h3>
      <p>Push navigation मौजूदा scroll position बनाए रखता है। नए URL का <code>#hash</code> page के किसी element से मिले, तो वह element scroll करके दिखाया जाता है। <code>popstate</code> पर scroll browser संभालता है। नए page को ऊपर से दिखाना हो तो <code>onNavigate</code> use करें, जो navigation का तरीका बताता है:</p>
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
      <h3>ध्यान रखने वाली बातें</h3>
      <ul>
        <li><strong>पिछला page cache में नहीं रखा जाता।</strong> Route page का function और context रखता है, DOM नहीं। दूसरे page पर जाते ही पिछला page release हो जाता है। <code>stop()</code> listeners और चल रहे loads release करके <code>pending</code> साफ़ कर देता है, इसलिए inactive route spinner को अटका नहीं सकता। <code>stop()</code> के बाद load हुआ module चुपचाप छोड़ दिया जाता है।</li>
        <li><strong>Server पर एक साथ चलने वाली requests safe हैं।</strong> <code>start()</code> हर request की अलग state लौटाता है और <code>run()</code> उसे एक synchronous render तक सीमित रखता है, इसलिए बीच-बीच में चलने वाली requests एक-दूसरे का route नहीं पढ़ सकतीं। सिर्फ module cache share होता है। <code>run()</code> का function लौटते ही scope खत्म हो जाता है। <code>renderToString()</code> synchronous है, इसलिए इतना काफी है। Async या streaming render में route को <code>await</code> के पार भी बचाना पड़ता, जो <code>run()</code> नहीं करता।</li>
        <li><strong><code>popstate</code></strong> पर scroll restoration browser का (<code>scrollRestoration</code>) है, router का नहीं।</li>
        <li><strong>हर document में एक router start करें।</strong> हर <code>start()</code> अपना delegated <code>click</code> listener जोड़ता है। दूसरे router का <code>start()</code> पहले को नहीं रोकता; उसी router पर दूसरा <code>start()</code> ऐसा करता है। दूसरी table से URL match करना हो, तो router बनाकर सिर्फ <code>match()</code> call करें। यह कोई listener नहीं जोड़ता। Independent region इस तरह route के <code>pending</code> से अलग अपनी loading चला सकता है। <a href="#router-multi">कई routers और combined loading</a> देखें।</li>
        <li><strong>Design के कारण शामिल नहीं:</strong> hash और memory history, क्योंकि route pathname में होता है और server को हर route available कराना चाहिए; एक URL से दो independent regions की routing, क्योंकि page <code>into()</code> से कई regions भर सकता है लेकिन वे एक ही matched route के हिस्से होते हैं, और independent region फिर भी बिना start किए अपना router और loading रख सकता है, जैसा <a href="#router-multi">कई routers और combined loading</a> में है; और hover preloading, जिसे आप <code>mouseenter</code> से route का loader खुद call करके कर सकते हैं।</li>
      </ul>
      <h3>उदाहरण</h3>
      <p>Repository में दो चलने लायक examples एक-दूसरे के पूरक हैं, इसलिए हर setting कहीं न कहीं देखी जा सकती है:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: पूरे API का client-side tour। हर pattern form और priority rule, link-handling opt-out, live controls के साथ हर route member, एक sub-router, तीन गहरी layer stack, दो parents पर एक relative section, और <code>pending</code> व <code>error</code> के साथ route loaders। यह <code>preload: false</code> set करता है ताकि वे states दिखती रहें।</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: हर request पर <code>renderToString()</code>, server के nodes को सचमुच reuse करने वाला hydration (जिसे जाँचा जा सकता है), असली 404 status code, root के अलावा किसी और path पर <code>base</code>, network panel में दिखने वाली idle preloading, और ऐसा loader जिसका data server से client को मिलता है ताकि hydration उसे दोबारा fetch न करे।</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "Patterns",
    sections: [
      {
        id: "computed",
        title: "Computed values",
        content: `
      <p>Nuclo में computed API नहीं है। बस एक सादा function लिखें और उसे dynamic values से call करें:</p>
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
        title: "Async और loading",
        content: `
      <p>आम <code>async</code>/<code>await</code> use करें, और state बदलते ही हर बार <code>update()</code> call करें। एक fetch के लिए इसका मतलब है: <code>await</code> से पहले एक बार और बाद में एक बार:</p>
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
        title: "अच्छी आदतें",
        content: `
      <ul>
        <li><strong>बदलाव एक साथ करें।</strong> जितनी state बदलनी है सब बदलें, फिर एक बार <code>update()</code> call करें।</li>
        <li><strong>Dynamic values को तेज़ रखें और उनमें side effects न डालें।</strong> ये सभी हर <code>update()</code> पर चलते हैं।</li>
        <li><strong>छोटे और बार-बार होने वाले updates, जैसे typing या timer, के लिए <code>scope()</code></strong> use करें।</li>
        <li><strong>Document में render करें।</strong> <code>update()</code> चलते समय जो nodes document में नहीं हैं, वे आगे update होना बंद कर देते हैं।</li>
        <li><strong>बदलने वाले child nodes के लिए <code>when()</code> और <code>list()</code></strong> use करें, nodes लौटाने वाला function नहीं।</li>
        <li><strong><code>className</code> use करें, <code>class</code></strong> नहीं, और dynamic classes के लिए <code>() =&gt; cx(...)</code> या <code>{ className: () =&gt; … }</code> use करें।</li>
        <li><strong>Styles को module level पर एक बार define करें</strong>।</li>
        <li><strong>Server rendering:</strong> पहले render करें, फिर <code>getCssText()</code> को <code>&lt;style id="nuclo-styles"&gt;</code> में डालें। Request data को argument के रूप में पास करें, और output में HTML comments रहने दें।</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "संदर्भ",
    sections: [
      {
        id: "api-index",
        title: "API index",
        content: `
      <p>हर public function और वह कहाँ से मिलता है।</p>
      <h3><code>nuclo</code> (globals और named exports)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: सभी dynamic values चलाएँ, या दिए गए scopes में ही चलाएँ।</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: <code>update(id)</code> के लिए element को scope id दें।</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: conditional content, <code>.when()</code> और <code>.else()</code> के साथ।</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: हर item की एक row, identity से match होती है।</li>
        <li><a href="#api-region"><code>region(options)</code></a> और <a href="#api-region"><code>into(id, ...content)</code></a>: tree में एक named जगह, और वह content जो इसे कहीं से भी भरता है।</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: event listener, या <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>।</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: बनाएँ और जोड़ें।</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: server के HTML को client पर active करें।</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: component को फिर से call करें और DOM को patch करें।</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: style object से बनी class।</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: styles merge करें; बाद वाली values जीतती हैं।</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: theme वाले <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> और <code>globalStyle</code>।</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: options से बनने वाली styles।</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> और <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>।</li>
      </ul>
      <h3><code>nuclo</code> (सिर्फ named exports)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> और <a href="#api-css-text"><code>resetStyles()</code></a>।</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> और <code>getCssText()</code>।</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">Side-effect import</a>, साथ में <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> और <code>Nuclo*</code> classes।</li>
      </ul>
      <h3><code>nuclo-router</code> (अलग package)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: router, जिसमें <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> और <code>stop()</code> हैं।</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: ऐसा route जिसका data loader उसके chunk के साथ शुरू होता है।</li>
        <li><a href="#router-api">Types</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> और भी।</li>
      </ul>
      <h3>सिर्फ globals</h3>
      <ul>
        <li><a href="#tag-builders">175 tag builders</a>: <code>div</code>, <code>span</code>, ..., <code>var_</code>, और <code>svgSvg</code>, <code>pathSvg</code>, ....</li>
        <li><a href="#typescript-setup">Types</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> और भी। <code>StyleResult</code> जैसे styling types को <code>'nuclo'</code> से भी import किया जा सकता है।</li>
      </ul>
      <h3>Special keys</h3>
      <ul>
        <li><a href="#attributes">Attributes</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> handlers</a>, <a href="#lifecycle"><code>onMount</code> और <code>onDestroy</code></a>।</li>
        <li><a href="#style-objects">Style objects</a>: shorthand, pseudo state, <code>&amp;</code> selectors, <code>@</code> rules और <code>raw</code>।</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "अक्सर पूछे जाने वाले सवाल",
        content: `
      <h3>क्या state बदलने से UI अपने आप update हो जाता है?</h3>
      <p>नहीं। जब तक आप <code>update()</code> call नहीं करते, DOM वैसा ही रहता है।</p>

      <h3>क्या Nuclo signals, proxies या virtual DOM use करता है?</h3>
      <p>नहीं। State सादा JavaScript ही रहती है। Tree render होते समय Nuclo असली elements और text nodes बनाता है। <code>update()</code> हर registered dynamic value को चलाता है, या सिर्फ दिए गए scope के अंदर वालों को, और जहाँ value बदली हो वहीं के nodes को patch करता है। कोई dependency graph नहीं है और कोई virtual tree भी नहीं।</p>

      <h3>मेरा page "false" क्यों दिखा रहा है?</h3>
      <p>Boolean values text के रूप में render होती हैं। <code>div(ok &amp;&amp; span('Done'))</code> "false" दिखाएगा। Child nodes के लिए <code>when(() =&gt; ok, span('Done'))</code> और text के लिए <code>ok ? 'Done' : ''</code> use करें।</p>

      <h3>Items edit करने पर मेरी list row क्यों नहीं बदलती?</h3>
      <p>जो items अब भी list में हैं, उनकी rows रखी जाती हैं, दोबारा render नहीं होतीं। जो fields बदलते हैं, उनके लिए <code>() =&gt; todo.text</code> जैसी dynamic values use करें। <a href="#api-list"><code>list()</code></a> देखें।</p>

      <h3>मेरे UI का कुछ हिस्सा update होना क्यों बंद हो जाता है?</h3>
      <p>आमतौर पर इसकी वजह यह होती है कि <code>update()</code> चलते समय उसके nodes document में नहीं थे। Nuclo उन nodes को track करना छोड़ देता है, चाहे आप बाद में उन्हें attach कर लें, इसलिए ऐसे container में render करें जो document में मौजूद हो। दो और कारण: जिस <code>when()</code> की condition throw करे वह update होना बंद कर देता है, और जो text function अपने पहले run में throw करे वह खाली रहता है। <a href="#api-update"><code>update()</code></a> देखें।</p>

      <h3><code>forceUpdate()</code> कब use करना चाहिए?</h3>
      <p>सिर्फ static values में कभी-कभार होने वाले बदलाव के लिए, जैसे language बदलना। बाकी हर चीज़ के लिए <code>update()</code> use करें। <a href="#api-force-update"><code>forceUpdate()</code></a> देखें।</p>

      <h3>Page को props के रूप में पास किए बिना layout में कैसे डालूँ?</h3>
      <p><code>region({ id: 'main' })</code> से जगह mark करें और page से <code>into('main', …)</code> लौटाएँ। <a href="#api-region"><code>region()</code> और <code>into()</code></a> देखें।</p>

      <h3>App को unmount कैसे करूँ?</h3>
      <p>उसे <code>when()</code> में लपेटें और condition false कर दें। DOM को खुद हटाने से <code>onDestroy</code> नहीं चलता। <a href="#lifecycle">Lifecycle</a> देखें।</p>

      <h3>क्या Nuclo में router शामिल है?</h3>
      <p>Core package में नहीं। Routing अलग <code>nuclo-router</code> package में मिलती है, जिसमें server rendering, hydration, code-split routes और idle preloading हैं। इसे <code>npm install nuclo nuclo-router</code> से install करें। <a href="#router-overview">nuclo-router</a> देखें।</p>

      <h3>क्या Nuclo में effects हैं?</h3>
      <p>नहीं। <code>onMount</code> और <code>onDestroy</code> element जुड़ने और हटने पर हर element के लिए एक बार चलते हैं। सिर्फ state बदलने से कुछ भी दोबारा नहीं चलता।</p>
    `,
      },
    ],
  },

];
