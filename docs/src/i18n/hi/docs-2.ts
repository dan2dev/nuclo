import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "स्टाइलिंग",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>टाइपयुक्त स्टाइल ऑब्जेक्ट को जेनरेट किए गए CSS क्लास में बदल देता है। परिणाम को किसी भी टैग बिल्डर को भेजें। ब्राउज़र में, नियम एक <code>&lt;style id="nuclo-styles"&gt;</code> एलिमेंट में जाते हैं। सर्वर पर, <a href="#api-css-text"><code>getCssText()</code></a> उन्हें लौटाता है।</p>
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
        <li><code>css()</code> आधार घोषणाओं के लिए एक क्लास बनाता है, साथ ही प्रत्येक स्यूडो कुंजी, सेलेक्टर और मीडिया ब्लॉक के लिए एक क्लास बनाता है। उपरोक्त कार्ड को दो क्लास मिलते हैं।</li>
        <li>क्लास नाम सामग्री के हैश हैं। समान स्टाइल एक क्लास साझा करती हैं, और सर्वर और क्लाइंट समान नाम उत्पन्न करते हैं।</li>
        <li>मॉड्यूल स्तर पर एक बार स्टाइल को परिभाषित करें। <code>css()</code> ऑब्जेक्ट द्वारा कैश होता है, इसलिए प्रत्येक कॉल पर एक नया ऑब्जेक्ट हर बार फिर से संसाधित होता है।</li>
        <li>किसी स्टाइल ऑब्जेक्ट को <code>css()</code> में पास करने के बाद उसे बदलने से कुछ नहीं होता है।</li>
        <li>प्रत्येक स्टाइल पृष्ठ या सर्वर प्रक्रिया के जीवनकाल के लिए पंजीकृत रहती है। उन मानों के लिए जो प्रति आइटम बदलते हैं, जैसे डेटा से चौड़ाई, <a href="#attributes"><code>style</code> एट्रिब्यूट</a> का उपयोग करें।</li>
      </ul>
      <h3>नाम वाली स्टाइल</h3>
      <p>पठनीय क्लास नाम पाने के लिए पहले एक नाम पास करें:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>बेस क्लास बिल्कुल नाम है। अन्य ब्लॉकों को <code>name-&lt;hash&gt;</code> मिलता है।</li>
        <li>नाम एक वैध क्लास नाम होना चाहिए। अन्यथा Nuclo चेतावनी देता है और एक उत्पन्न करता है।</li>
        <li>नाम ग्लोबल हैं। यदि दो अलग-अलग स्टाइल एक ही नाम का उपयोग करती हैं, तो Nuclo चेतावनी देता है।</li>
      </ul>
      <h3>परिणाम का उपयोग करना</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> और <code>card.className</code> दोनों क्लास नाम लौटाते हैं।</p>
    `,
      },
      {
        id: "style-objects",
        title: "स्टाइल ऑब्जेक्ट",
        content: `
      <p><code>css()</code> को दिए ऑब्जेक्ट में camelCase CSS प्रॉपर्टी, शॉर्टहैंड और स्यूडो स्टेट, सेलेक्टर व मीडिया क्वेरी के लिए नेस्टेड कुंजियाँ होती हैं। TypeScript इन सभी के लिए ऑटोकंप्लीट देता है। टाइपयुक्त सेट से बाहर की प्रॉपर्टी, जैसे <code>borderTopLeftRadius</code>, <code>fill</code> या <code>paddingInline</code>, <code>raw</code> में रखें (नीचे देखें)।</p>
      <h3>मान</h3>
      <ul>
        <li>संख्याएँ <code>0</code> और इकाई रहित प्रॉपर्टी को छोड़कर <code>px</code> बन जाती हैं: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> और <code>gridRow</code>। <code>raw</code> में, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> और <code>animation-iteration-count</code> भी यूनिटलेस हैं।</li>
        <li>स्ट्रिंग्स का उपयोग लिखित रूप में किया जाता है। <code>null</code>, <code>undefined</code> और <code>false</code> को छोड़ दिया गया है।</li>
        <li><code>lineHeight</code> (और <code>leading</code>) इकाई रहित है, इसलिए <code>leading: 24</code> का अर्थ फ़ॉन्ट आकार का 24 गुना है। पिक्सेल के लिए <code>"24px"</code> लिखें।</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>शॉर्टहैंड</h3>
      <table>
        <thead><tr><th>कुंजी</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>पैडिंग, और प्रत्येक साइड</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>पैडिंग बाएँ और दाएँ / ऊपर और नीचे</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>मार्जिन के लिए वही दिशाएँ</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>चौड़ाई, ऊंचाई और उनकी न्यूनतम और अधिकतम</td></tr>
          <tr><td><code>size</code></td><td>चौड़ाई और ऊंचाई</td></tr>
          <tr><td><code>bg</code></td><td>पृष्ठभूमि</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>ये कुंजियाँ <code>true</code> लेती हैं:</p>
      <table>
        <thead><tr><th>कुंजी</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (डिस्प्ले सेट नहीं है)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>स्यूडो स्टेट</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> और <code>firstLetter</code>। इन्हें नेस्ट कर सकते हैं: <code>hover: { focus: {…} }</code> <code>:hover:focus</code> देता है।</p>
      <h3>सेलेक्टर और नियम</h3>
      <p>एक कुंजी जो <code>&amp;</code> से शुरू होती है वह एक सेलेक्टर है, और प्रत्येक <code>&amp;</code> क्लास बन जाता है। एक कुंजी जो <code>@</code> से शुरू होती है वह एक नियम है: <code>@media</code>, <code>@container</code> या <code>@supports</code>।</p>
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
        <li>कुंजी <code>&amp;</code> से शुरू होनी चाहिए। <code>".dark &amp;"</code> जैसी कुंजी को नजरअंदाज कर दिया जाता है, इसलिए <code>"&amp;:is(.dark *)"</code> लिखें।</li>
        <li>दो नेस्टेड <code>@media</code> ब्लॉक <code>and</code> से जुड़ते हैं। मीडिया टाइप (<code>print</code>, <code>only screen</code>) से शुरू होने वाली क्वेरी पहले रखी जाती है, क्योंकि सिंटैक्स में टाइप केवल शुरुआत में आ सकता है। यदि दोनों को एक क्वेरी में नहीं बदल सकते—दो मीडिया टाइप हों या शुरुआत में <code>not</code> हो—तो चेतावनी के साथ केवल अंदर वाली क्वेरी इस्तेमाल होती है। कोई भी दूसरा नेस्टेड एट-रूल बाहर वाले को बदल देता है।</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>किसी भी प्रॉपर्टी के लिए <code>raw</code> का उपयोग करें, नाम बिल्कुल CSS जैसा लिखा गया है। संख्याओं में यहाँ भी <code>px</code> जुड़ता है, इसलिए स्ट्रिंग पास करें:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>किसी भी अन्य फ़्लैट कुंजी को कबाब-केस में बदल दिया जाता है और उसे वैसे ही लिखा जाता है, इसलिए <code>colr: 'red'</code> जैसी टाइपो एक घोषणा बन जाती है जिसे ब्राउज़र ड्रॉप कर देता है। किसी कुंजी के अंतर्गत एक नेस्टेड ऑब्जेक्ट जो एक स्यूडो स्थिति, एक स्क्रीन, या एक <code>&amp;</code> या <code>@</code> कुंजी नहीं है, को नजरअंदाज कर दिया जाता है। TypeScript दोनों की रिपोर्ट करता है।</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>स्टाइल मर्ज करता है। दो इनपुट एक ही प्रॉपर्टी सेट करें, तो बाद वाले मान को प्राथमिकता मिलती है।</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>falsy इनपुट छोड़ दिए जाते हैं। ऐरे फ़्लैट किए जाते हैं। स्ट्रिंग में दिए क्लास नाम अलग किए जाते हैं और दोहराए गए नाम हटा दिए जाते हैं।</li>
        <li>एक ही ब्लॉक (आधार, एक ही स्यूडो, एक ही मीडिया क्वेरी) के लिए जेनरेट की गई क्लास एक नई क्लास में विलय हो जाती हैं। अन्य क्लास के नाम अपरिवर्तित रहते हैं।</li>
        <li>केवल <code>cx()</code> आर्ग्युमेंट क्रम जानता है। <code>div(base, blue)</code> के साथ, दोनों क्लास जोड़े जाते हैं, और जो नियम सबसे बाद में बना था उसे प्राथमिकता मिलती है। एक <code>cx()</code> कॉल में एक-दूसरे को ओवरराइड करने वाली स्टाइल डालें।</li>
        <li>जब एक नामित स्टाइल का ब्लॉक किसी अन्य इनपुट के ब्लॉक के साथ विलय हो जाता है, तो मर्ज की गई क्लास <code>name-&lt;hash&gt;</code> होता है, न कि मूल नाम। जो ब्लॉक मर्ज नहीं होते हैं वे अपनी क्लास बनाए रखते हैं, इसलिए <code>cx(pageTitle, 'extra')</code> में अभी भी <code>page-title</code> है।</li>
      </ul>
      <h3>डायनेमिक क्लास</h3>
      <p>एक फ़ंक्शन पास करें जो हमेशा <code>cx(...)</code> लौटाता है:</p>
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
      <p>फ़ंक्शन को अपने पहले रन पर एक स्टाइल परिणाम लौटाना होगा। <code>() =&gt; active &amp;&amp; activeButton</code> एक क्लास के बजाय "false" टेक्स्ट को रेंडर करता है।</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>एक थीम से बंधे अपने स्वयं के <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> और <code>globalStyle</code> लौटाता है। एक थीम मानों को नाम देती है: नीचे दी गई थीम के साथ, <code>borderColor: 'border'</code> <code>#e5e7eb</code> लिखता है, और TypeScript नामों को स्वतः पूर्ण करता है। <code>screens</code> में प्रत्येक प्रविष्टि मीडिया क्वेरी के लिए एक स्टाइल कुंजी बन जाती है, जैसे <code>md: {…}</code>।</p>
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
        <thead><tr><th>थीम कुंजी</th><th>कहाँ उपयोग होती है</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> और प्रत्येक पक्ष, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>नई स्टाइल कुंजियाँ, जैसे <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>एक थीम नाम तभी हल होता है जब वह संपूर्ण मान हो। <code>border: "1px solid primary"</code> में नाम हल नहीं होता।</li>
        <li><code>@</code> के बिना एक स्क्रीन मान <code>@media &lt;value&gt;</code> हो जाता है। <code>@</code> से शुरू होने वाला मान लिखित रूप में उपयोग किया जाता है, उदाहरण के लिए <code>"@container (min-width: 400px)"</code>।</li>
        <li>स्क्रीन केवल <code>createCss()</code> से बने इंस्टेंस पर मौजूद हैं। ग्लोबल <code>css()</code> में कोई नहीं है, लेकिन यह <code>@media</code> कुंजी स्वीकार करता है।</li>
        <li>सभी इंस्टेंस और ग्लोबल हेल्पर एक स्टाइलशीट साझा करते हैं। स्क्रीन के मीडिया नियम घोषणा के क्रम में लिखे जाते हैं, उपयोग के क्रम में नहीं। इसलिए <code>min-width</code> स्क्रीन छोटे से बड़े क्रम में लिखें। हर ऐप में एक <code>createCss()</code> इंस्टेंस रखें ताकि क्रम आपकी थीम के अनुसार हो।</li>
        <li><code>theme</code> वही थीम है जो आपने पास की थी।</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>एक फ़ंक्शन बनाता है जो विकल्पों के एक सेट के लिए एक स्टाइल लौटाता है, जैसे कि बटन का उद्देश्य और आकार।</p>
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
        <li>स्टाइल इस क्रम में मर्ज होते हैं: <code>base</code>, हर समूह का चुना मान और फिर हर मिलता कंपाउंड वैरिएंट। हर प्रॉपर्टी के लिए बाद वाले मान को प्राथमिकता मिलती है।</li>
        <li>एक अनुपलब्ध, <code>undefined</code> या <code>null</code> विकल्प डिफ़ॉल्ट का उपयोग करता है। बिना किसी डिफ़ॉल्ट वाले समूह को छोड़ दिया जाता है।</li>
        <li>केवल <code>true</code> और <code>false</code> कुंजियों वाला एक समूह एक बूलियन लेता है।</li>
        <li>एक कंपाउंड तब लागू होता है जब इसमें सूचीबद्ध प्रत्येक समूह मेल खाता है, डिफ़ॉल्ट शामिल हैं।</li>
        <li>प्रत्येक चयन एक बार बनाया जाता है और कैश किया जाता है।</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() और globalStyle()",
        content: `
      <p><code>keyframes()</code> एक एनीमेशन पंजीकृत करता है और उसका उत्पन्न नाम लौटाता है। फ़्रेम कुंजियाँ <code>from</code>, <code>to</code> और प्रतिशत हैं, जैसे <code>"50%"</code> या <code>"0%, 100%"</code>। फ़्रेम केवल फ़्लैट प्रॉपर्टी लेते हैं. समान फ़्रेम समान नाम लौटाते हैं.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> किसी भी सेलेक्टर के लिए एक नियम जोड़ता है:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>सेलेक्टर का उपयोग बिल्कुल वैसे ही किया गया है जैसा लिखा गया है।</li>
        <li>केवल फ्लैट प्रॉपर्टी ही काम करती हैं। स्यूडो कुंजियाँ, स्क्रीन और <code>@</code> कुंजियाँ नजरअंदाज कर दी जाती हैं, इसलिए <code>globalStyle()</code> मीडिया नियम नहीं लिख सकता।</li>
        <li>एक ही नियम एक बार जोड़ा जाता है। एक ही सेलेक्टर के लिए एक अलग स्टाइल दूसरा नियम जोड़ती है, और बाद वाला जीतता है।</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() और resetStyles()",
        content: `
      <p><code>getCssText()</code> हर नियम लौटाता है जो <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> और <code>globalStyle()</code> ने इस प्रक्रिया में बनाया है: पहले आधार नियम, फिर <code>@media</code>, <code>@container</code> और <code>@supports</code> ब्लॉक। सर्वर रेंडरिंग के लिए इसका उपयोग करें।</p>
      <ul>
        <li>इसे <code>renderToString()</code> के बाद कॉल करें। रेंडर के दौरान बनाए गए नियम शामिल हैं।</li>
        <li>यह एक पेज या अनुरोध को नहीं बल्कि पूरी प्रक्रिया को कवर करता है, और यह केवल बढ़ता है। यह सुरक्षित है, क्योंकि क्लास के नाम सामग्री हैश हैं।</li>
        <li>इसे <code>&lt;style id="nuclo-styles"&gt;</code> में डालें। क्लाइंट उस एलिमेंट का पुन: उपयोग करता है और उसमें पहले से मौजूद नियमों को छोड़ देता है। किसी दूसरी आईडी के साथ, या बिना आईडी के, क्लाइंट प्रत्येक नियम के साथ फिर से एक दूसरी स्टाइलशीट जोड़ता है।</li>
        <li>टेक्स्ट एस्केप नहीं होता, इसलिए स्टाइल मानों में कभी भी अविश्वसनीय इनपुट न डालें।</li>
      </ul>
      <p><code>resetStyles()</code> एक परीक्षण हेल्पर है। यह प्रत्येक नियम और <code>#nuclo-styles</code> एलिमेंट को हटा देता है। आपके द्वारा पहले बनाई गई स्टाइल अपने क्लास के नाम तो रखती हैं लेकिन अपना CSS खो देती हैं। इसे किसी ऐप या सर्वर पर कॉल न करें।</p>
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
    title: "रूटिंग",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>अलग पैकेज: </strong> <code>nuclo-router</code> Nuclo कोर पैकेज का हिस्सा नहीं है। इसे <code>nuclo</code> के साथ इंस्टॉल करें। यह एक प्रीव्यू रिलीज़ है, इसलिए इसका API अभी भी बदल सकता है।</div>
      <p>Nuclo के लिए रूटिंग: सर्वर रेंडरिंग, हाइड्रेशन, कोड-स्प्लिट रूट और आइडल प्रीलोडिंग, <code>list()</code> और <code>update()</code> पर निर्मित। gzip के बाद लगभग ${NUCLO_ROUTER_GZIP_KB} KB। Nuclo के अलावा कोई डिपेंडेंसी नहीं और कोई साइड इफ़ेक्ट नहीं, इसलिए इस्तेमाल न होने पर ट्री शेकिंग इसे हटा देती है।</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>या समान दो नामों के साथ <code>pnpm add</code>, <code>yarn add</code> या <code>bun add</code> का उपयोग करें। इसे पीयर डिपेंडेंसी के रूप में <code>nuclo</code> 0.3 या उससे नया संस्करण चाहिए।</p>
      <p>राउटर तय करता है कि <em>क्या</em> लोड होगा। ऐप बताता है कि <em>कहाँ</em> दिखेगा <code>router.outlet()</code> के साथ: लेयर स्टैक पर एक <code>list()</code>, प्रति लेयर एक पंक्ति, इसलिए एक साधारण पृष्ठ एक पंक्ति है। सर्वर और क्लाइंट एक ही ट्री बनाते हैं, इसलिए <code>hydrate()</code> सर्वर के मौजूदा नोड का पुनः उपयोग करता है। बाकी सब कुछ <code>history</code> है, एक डेलिगेटेड <code>click</code> लिसनर और <code>requestIdleCallback</code> है।</p>
      <h3>एक इम्पोर्ट</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> लौटने से पहले मिलते रूट का मॉड्यूल लोड कर लेता है, इसलिए पहला ट्री सर्वर और क्लाइंट दोनों पर पूरा हो जाता है। उसके बाद राउटर उस रूट का स्टेट पढ़ता है जिसे उसने शुरू किया: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>।</p>
      <h3>एक संपूर्ण ऐप</h3>
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
      <p>यह संपूर्ण एकीकरण है। लिंक काम करते हैं क्योंकि <code>&lt;a href&gt;</code> सिर्फ एक <code>&lt;a href&gt;</code> है। <code>document</code> पर एक डेलिगेटेड लिसनर राउटर के स्वामित्व वाले लिंक को रोकता है और ब्राउज़र पर हर दूसरे लिंक को छोड़ देता है।</p>
      <p>सर्वर पर, <code>start()</code> प्रति अनुरोध एक <code>Route</code> लौटाता है और राउटर को अकेला छोड़ देता है, इसलिए एक साथ चलने वाले अनुरोध एक-दूसरे का रूट नहीं देख सकते। <code>route.run()</code> रेंडर पूरा होने तक उस रूट को राउटर का सक्रिय रूट बनाता है, इसलिए आउटलेट भी उसी को पढ़ता है। ब्राउज़र में प्रति पेज लोड एक रूट होता है, और <code>start()</code> इसे राउटर का अपना बनाता है। <code>run()</code> की ज़रूरत नहीं होती।</p>
      <p>एक पृष्ठ को इसका <a href="#router-api"><code>RouteContext</code></a> और इसका <a href="#router-api"><code>PageProps</code></a>, <code>(ctx, { layer, data, outlet, beforeLeave })</code> के रूप में प्राप्त होता है, और कम आर्ग्युमेंट ले सकता है। यह <code>list()</code> द्वारा स्वीकार की गई कोई भी चीज़ लौटाता है। लेआउट के अन्य भाग को भी भरने के लिए, पृष्ठ के अंदर से एक <code>into()</code> लौटाएँ, जैसे <code>div(article(…), into('sidebar', nav(…)))</code>। वह सामग्री पृष्ठ के साथ चली जाती है। <a href="#router-regions">पेज और रीजन</a> देखें।</p>
    `,
      },
      {
        id: "router-patterns",
        title: "पैटर्न और नेस्टेड रूट",
        content: `
      <table>
        <thead><tr><th>पैटर्न</th><th>किससे मेल खाता है</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>बिल्कुल वही path</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>बाकी सभी पथ, यानी आपका 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>पहले स्टैटिक पैटर्न, फिर घोषणा के क्रम में डायनेमिक पैटर्न और अंत में सबसे लंबे प्रीफ़िक्स वाला कैच-ऑल चुना जाता है। तो <code>'*'</code> केवल वही मेल खाता है जो कोई और नहीं करता है और तालिका में कहीं भी बैठ सकता है। ट्रेलिंग स्लैश, डुप्लिकेट स्लैश और प्रतिशत-एन्कोडिंग को सामान्यीकृत किया जाता है, और पैरामीटर के मान डिकोड किए जाते हैं। मिलान प्रति पैटर्न एक सेगमेंट की तुलना है। कोई रेगेक्स नहीं बनाया या चलाया जाता है।</p>
      <h3>रूट के सापेक्ष पथ</h3>
      <p><code>./</code> के साथ लिखा गया एक पैटर्न इसे घोषित करने वाले पैरेंट के सापेक्ष है, और <code>./</code> के साथ लिखा गया href सक्रिय रूट के सापेक्ष है। वे मिलकर एक पुन: प्रयोज्य अनुभाग बनाते हैं जिसका अर्थ प्रत्येक पैरेंट के लिए समान होता है। किसी तालिका का मान या तो एक लोडर होता है या कोई अन्य तालिका, जिसकी कुंजियाँ उससे संबंधित होती हैं:</p>
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
      <p>वे दो पंक्तियाँ सभी छह पैटर्न उत्पन्न करती हैं जिनमें कोई पथ दो बार नहीं लिखा होता है। पैरेंट दोनों को समान लोडर ऑब्जेक्ट मिलते हैं, इसलिए वे एक मॉड्यूल कैश और एक <code>import()</code> साझा करते हैं।</p>
      <ul>
        <li>एक चाइल्ड टेबल के अंदर, <code>'./x'</code>, <code>'/x'</code> और <code>'x'</code> सभी का मतलब एक ही है, <code>'/'</code> का मतलब मूल पथ ही है, और <code>'*rest'</code> अनुभाग को अपना स्वयं का कैच-ऑल देता है। इन्हें जितनी चाहें उतनी गहराई तक नेस्ट कर सकते हैं।</li>
        <li>शीर्ष-स्तरीय कुंजियों का उपयोग लिखित रूप में किया जाता है, इसलिए <code>'*'</code> <code>'*'</code> रहता है।</li>
        <li><code>*catch-all</code> पैरेंट के अंतर्गत एक चाइल्ड नोड एक <code>createRouter()</code> त्रुटि है, क्योंकि कैच-ऑल को अपना पैटर्न समाप्त करना होता है।</li>
      </ul>
      <h3>पैरेंट पेज और <code>outlet()</code></h3>
      <p>एक पैरेंट और उसके चाइल्ड नोड एक वास्तविक हायरार्की हैं। पैरेंट रेंडर होता है और चाइल्ड उसके अंदर रेंडर होता है, जहां भी वह <code>outlet()</code> कहता है:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>चाइल्ड रूट बदलने पर पैरेंट दोबारा नहीं बनता। उसका DOM नोड वही रहता है, इसलिए फ़ोकस, स्क्रॉल स्थिति, आधा लिखा इनपुट और क्लोज़र का स्टेट बने रहते हैं।</p>
      <ul>
        <li>चाइल्ड रूट न हो, तो पेज का आउटलेट कुछ रेंडर नहीं करता, इसलिए लेआउट उसे बिना शर्त कॉल कर सकता है। यदि पैरेंट के चाइल्ड रूट हों लेकिन वह <code>outlet()</code> कॉल न करे, तो चाइल्ड दिखाई नहीं देंगे।</li>
        <li>अलग इंडेक्स रूट नहीं होते। <code>'/'</code> खुद लेआउट है, इसलिए पैरेंट पथ पर लेआउट खाली आउटलेट के साथ दिखता है, अलग इंडेक्स पेज के साथ नहीं। शुरुआती सामग्री लेआउट में रखें या उसके लिए चाइल्ड पथ बनाएँ।</li>
      </ul>
      <p>फिर वही कॉल पैरेंट में से किसी एक से और एक ऐसे पेज से काम करती है जो यह नहीं जानता कि यह किसमें है:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> और <code>..</code> मौजूदा रूट के पथ के सापेक्ष हल होते हैं, URL की "डायरेक्टरी" के नहीं। <code>/invoices/42</code> से <code>./preview</code> का अर्थ <code>/invoices/42/preview</code> है, जबकि ब्राउज़र इसे <code>/invoices/preview</code> बनाता। URL के अंत में स्लैश से यह व्यवहार नहीं बदलता। <code>../</code> एक सेगमेंट ऊपर जाता है और रूट पर रुक जाता है। क्वेरी और हैश बचाए जाते हैं, <code>base</code> फिर जुड़ता है और पूरा एब्सोल्यूट पथ हिस्ट्री में जाता है। React Router भी <code>&lt;Link to="./x"&gt;</code> के लिए सामान्य URL रिज़ॉल्यूशन से यही बदलाव करता है।</p>
      <ul>
        <li>केवल <code>./</code> और <code>../</code> रूट के सापेक्ष हैं। href में बिना प्रीफ़िक्स वाले <code>preview</code> को ब्राउज़र के सामान्य नियमों से हल किया जाता है।</li>
        <li>हाथ से <code>href="./preview"</code> लिखने के बजाय <code>router.href('./preview')</code> के साथ सापेक्ष लिंक बनाएँ। <code>href()</code> रेंडर समय पर हल हो जाता है, इसलिए जो मार्कअप उपलब्ध है वह क्रॉलर के लिए, मध्य-क्लिक के लिए और JavaScript अक्षम होने पर भी पूर्ण और सही होता है।</li>
      </ul>
      <h3>क्या बचता है और क्या दोबारा बनता है</h3>
      <table>
        <thead><tr><th>नोड</th><th>नेविगेशन पर</th></tr></thead>
        <tbody>
          <tr><td>पैरेंट जिसका पैटर्न और पथ अपरिवर्तित है</td><td><strong>बना रहता है</strong>: वही नोड, और इसका <code>load()</code> दोबारा नहीं चलता</td></tr>
          <tr><td> मिलान किया गया पृष्ठ</td><td><strong>बना रहता है</strong> जब इसका पैटर्न और पथ अपरिवर्तित होता है और इसमें कोई <code>load()</code> नहीं होता है, तो एक क्वेरी या हैश परिवर्तन इसे रखता है। प्रत्येक विज़िट पर लोडर वाला मार्ग ताज़ा हो जाता है।</td></tr>
          <tr><td>वह पैरेंट जिसका पथ बदल गया</td><td>अपने अंदर की सारी सामग्री के साथ दोबारा बनता है</td></tr>
          <tr><td>पुश की गई लेयर</td><td> अकेले मिलान किए गए पृष्ठ को रेंडर करता है। इसके पैरेंट पहले से ही इसके नीचे की पंक्ति में माउंट हैं।</td></tr>
        </tbody>
      </table>
      <p>जो पेज बना रहता है, उसका <code>ctx</code> भी वही रहता है जिससे वह बना था। हर जगह <code>ctx</code> का यही अर्थ है। लाइव मानों के लिए <code>router.*</code> पढ़ें। क्वेरी पर निर्भर फ़िल्टर, पेजिनेशन और टैब के लिए डायनेमिक मान में <code>router.search</code> पढ़ें और <code>router.go('?page=2', { replace: true })</code> से लिखें। पेज, फ़ोकस और आधा लिखा इनपुट बने रहते हैं।</p>
    `,
      },
      {
        id: "router-regions",
        title: "पेज और रीजन",
        content: `
      <p><code>router.outlet()</code> पेज को एक स्थान पर रखता है। जिस पृष्ठ को लेआउट में कहीं और साइडबार, टूलबार या शीर्षक की भी आवश्यकता होती है, उसे <a href="#api-region"><code>into()</code></a> से भर दिया जाता है। लेआउट <code>region()</code> के साथ स्थान को चिह्नित करता है, और पृष्ठ अपनी सामग्री के आगे एक <code>into()</code> लौटाता है। लेआउट कभी भी पृष्ठ सामग्री को प्रोप के रूप में प्राप्त नहीं करता है, और नेविगेशन कभी भी इसका पुनर्निर्माण नहीं करता है।</p>
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
      <p>पृष्ठ की सामग्री आउटलेट के <code>list()</code> की एक पंक्ति है, और एक <code>into()</code> तब तक जीवित रहता है जब तक वह पंक्ति इसे धारण करती है। तो साइडबार सामग्री पृष्ठ के साथ आती है और उसके साथ चली जाती है: <code>into('sidebar', …)</code> के बिना किसी पृष्ठ पर नेविगेट करने से रीजन की <code>empty</code> सामग्री फिर से दिखाई देती है। पेज दोनों भागों के लिए अपने <code>ctx</code> और <code>data</code> का उपयोग कर सकता है, क्योंकि दोनों एक ही फ़ंक्शन द्वारा बनाए गए हैं।</p>
      <h3>नेविगेशन पर क्या होता है</h3>
      <ul>
        <li><strong>जो पेज बना रहता है, उसके रीजन भी बने रहते हैं।</strong> पेज बचाए रखने वाले <a href="#router-patterns">क्वेरी या हैश बदलाव</a> रीजन की सामग्री भी नहीं बदलते। साइडबार क्वेरी पर निर्भर हो, तो डायनेमिक मान में <code>router.search</code> पढ़ें।</li>
        <li><strong>दोबारा बना पेज उन्हें पुनः भर देता है। </strong> जब मार्ग बदलता है, तो पुरानी पंक्ति हटा दी जाती है और नए पृष्ठ के <code>into()</code> व्यू आ जाते हैं। कुछ भी पीछे नहीं छूटा.</li>
        <li><strong>पुश की गई लेयर एक व्यू जोड़ती है। </strong> लेयर आउटलेट की बाद की पंक्ति है, इसलिए इसका <code>into()</code> उसी रीजन का एक नया व्यू है। डिफ़ॉल्ट <code>type: 'latest'</code> के साथ यह लेयर बंद होने तक पृष्ठ के व्यू को कवर करता है, और फिर पृष्ठ का व्यू फिर से दिखाई देता है। <code>type: 'stack'</code> के साथ दोनों दिखाई देते हैं।</li>
        <li><strong>पैरेंट पेज रीजनों को भी भर सकता है।</strong> इसके व्यू तब भी बने रहते हैं जब इसके चाइल्ड नोड बदलते हैं, क्योंकि पैरेंट पेज का पुनर्निर्माण नहीं किया जाता है।</li>
        <li><strong>सर्वर रेंडरिंग भी इसी तरह काम करती है। </strong> सर्वर <code>route.run()</code> के अंदर पेज बनाता है, इसलिए इसके <code>into()</code> व्यू HTML में हैं, और <code>hydrate()</code> उन्हें पुनः उपयोग करता है।</li>
      </ul>
      <h3>एक पृष्ठ से कई रीजन</h3>
      <p>एक बार में एक से अधिक रीजन भरने के लिए किसी ऑब्जेक्ट को पास करें। पृष्ठ की मुख्य सामग्री अभी भी आउटलेट के माध्यम से जाती है, इसलिए इसे <code>into()</code> के पास लौटा दें:</p>
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
      <h3>किस काम के लिए कौन सा टूल</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> एक चाइल्ड रूट के लिए है: यूआरएल द्वारा तय की गई सामग्री, उसके पैरेंट पेज के अंदर रेंडर की गई है। <a href="#router-patterns">नेस्टेड रूट</a> देखें।</li>
        <li><strong><code>into()</code></strong> मिलान किए गए पेज के लिए है जो पूरे लेआउट में फैला हुआ है। सामग्री पृष्ठ से संबंधित है और उसके डेटा का उपयोग करती है।</li>
        <li><strong><code>matches()</code></strong> अकेले यूआरएल से लेआउट तय करने के लिए है, इसकी अपनी छोटी तालिका है और इसमें कोई पेज शामिल नहीं है। <a href="#router-matches"><code>matches()</code></a> देखें।</li>
      </ul>
      <p>ये सभी एक ही मिलते रूट के हिस्से हैं। राउटर एक URL से दो स्वतंत्र रीजन नहीं चलाता। इसलिए अपने पथों वाला साइडबार पेज से भरा रीजन है, दूसरा आउटलेट नहीं। साइडबार को अपना राउटर, लोडिंग और फ़ॉलबैक चाहिए, तो राउटर शुरू न करें और <code>match()</code> से मिलान करें। <a href="#router-multi">कई राउटर और संयुक्त लोडिंग</a> देखें।</p>
    `,
      },
      {
        id: "router-loaders",
        title: "रूट लोडर और कोड स्प्लिटिंग",
        content: `
      <p>एक पेज मॉड्यूल एक <code>load</code> फ़ंक्शन एक्सपोर्ट कर सकता है। यह पेज बनने से पहले, उस रूट के हर नेविगेशन पर चलता है, और जो कुछ भी लौटाता है उसे <code>data</code> के रूप में पेज पर भेज दिया जाता है:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>रूट टेबल वही रहती है। लोडर पेज के मॉड्यूल में रहता है। उसे मिलान का <code>RouteContext</code> मिलता है, इसलिए <code>params</code>, <code>search</code> और <code>path</code> उपलब्ध हैं। यह सिंक या एसिंक हो सकता है और सर्वर पर भी चलता है। इसलिए सर्वर से भेजे HTML में डेटा पहले से होता है, उसे पहली बार दिखाने के लिए हाइड्रेशन के बाद डेटा आने का इंतज़ार नहीं करना पड़ता।</p>
      <p><strong> मॉड्यूल कैश्ड है। डेटा नहीं है.</strong> एक रूट का चंक एक बार लाया जाता है और पुन: उपयोग किया जाता है, और इसका लोडर हर नेविगेशन पर फिर से चलता है। यही कारण है कि <code>/blog/a</code> और <code>/blog/b</code> को भ्रमित नहीं किया जा सकता है, और एक असफल लोडर को आसानी से पुनः प्रयास किया जा सकता है।</p>
      <table>
        <thead><tr><th>स्थिति</th><th>व्यवहार</th></tr></thead>
        <tbody>
          <tr><td>लोडर चल रहा है</td><td><code>router.pending</code> true रहता है और पिछला पेज स्क्रीन पर बना रहता है</td></tr>
          <tr><td>लोडर थ्रो या रिजेक्ट करता है</td><td>त्रुटि <code>router.error</code> में मिलती है। <code>go()</code> रिजेक्ट नहीं होता और नेविगेशन दोबारा आज़माया जा सकता है।</td></tr>
          <tr><td><code>start()</code> के दौरान</td><td>रिजेक्शन <code>start()</code> से मिलता है। त्रुटि रखने के लिए अभी कोई रूट नहीं बना है।</td></tr>
          <tr><td>पुश की गई लेयर</td><td> अपने स्वयं के डेटा के साथ अपना स्वयं का लोडर चलाता है</td></tr>
          <tr><td>आइडल प्रीलोडर</td><td>केवल मॉड्यूल लोड करता है। इसे देने के लिए कोई कॉन्टेक्स्ट नहीं होता और डेटा लोड करने से ऐसे रूट का डेटा भी आ सकता है जिसे आप कभी खोलें ही नहीं।</td></tr>
          <tr><td>उसी URL पर दोबारा नेविगेशन</td><td>लोडर फिर चलता है और पंक्ति दोबारा बनती है। बिना लोडर वाला रूट अपनी पंक्ति बनाए रखता है।</td></tr>
        </tbody>
      </table>
      <p>पुनः सत्यापित करने के लिए, इतिहास प्रविष्टि जोड़े बिना उस स्थान पर नेविगेट करें जहां आप पहले से हैं:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>चंक के साथ डेटा लोड करना</h3>
      <p>पेज मॉड्यूल द्वारा एक्सपोर्ट किया गया <code>load</code> केवल उस मॉड्यूल के आने के बाद ही चल सकता है, इसलिए कैश खाली होने पर नेविगेशन पहले चंक और फिर डेटा लोड करता है। दोनों को एक साथ शुरू करने के लिए, लोडर को <code>withLoad()</code> के साथ तालिका में घोषित करें:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>यह मॉड्यूल के अपने <code>load</code> की जगह लेता है और हर विजिट पर इसी तरह चलता है। चंक लोड होने के दौरान डेटा लोडर रिजेक्ट हो, तो त्रुटि सामान्य रूप से <code>router.error</code> में मिलती है।</p>
      <p>डिज़ाइन के अनुसार, HTML में सर्वर डेटा का सीरियलाइज़ेशन नहीं है। क्लाइंट का <code>load</code> फिर से हाइड्रेशन पर चलता है। यदि यह मायने रखता है, तो सर्वर को <code>route.data</code> आउटपुट में लिखने दें, उदाहरण के लिए <code>window.__DATA__</code> के रूप में, और लोडर इसे पहले ले। <code>route.data</code> केवल मिलान किए गए पृष्ठ का डेटा है। इसमें पैरेंट के <code>load()</code> का परिणाम नहीं होता।</p>
      <h3>कोड स्प्लिटिंग और प्रीलोडिंग</h3>
      <p>एक रूट का मान हमेशा एक फ़ंक्शन होता है जो पृष्ठ कंपोनेंट लौटाता है, इसलिए कंपोनेंट ज़रूरत पड़ने पर ही लोड होता है:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>केवल मॉड्यूल के रूप वाले विकल्प ही <code>load</code> एक्सपोर्ट कर सकते हैं। <code>.then(m =&gt; m.BPage)</code> के साथ नामित कंपोनेंट को चुनने से राउटर को अकेले ही फ़ंक्शन सौंप दिया जाता है।</p>
      <p>हर मॉड्यूल एक बार इम्पोर्ट होकर कैश होता है। एक ही रूट पर साथ चल रहे नेविगेशन एक <code>import()</code> साझा करते हैं। पेज पर <code>idleTimeout</code> तक कोई गतिविधि न हो (डिफ़ॉल्ट एक सेकंड; कोई टैप, कुंजी, व्हील इवेंट या स्क्रॉल नहीं), तो बाकी रूट पृष्ठभूमि में लोड होते हैं: हर आइडल अवधि (<code>requestIdleCallback</code>) में एक। कोई भी इनपुट या प्रतीक्षारत नेविगेशन इसे पेज के फिर आइडल होने तक रोक देता है।</p>
      <p>एक प्रीलोडेड या पहले से लोड रूट कभी भी <code>router.pending</code> को फ्लिप नहीं करता है और अगले पेंट से पहले लैंड करता है: कोई स्पिनर फ्रेम नहीं, कोई लेआउट शिफ्ट नहीं। <code>router.pending</code> केवल एक मॉड्यूल या लोडर के लिए सही है जिसके लिए इंतजार करना पड़ता है, और आउटगोइंग पेज तब भी स्क्रीन पर रहता है। चंक लोड होने में विफलता <code>router.error</code> में मिलती है। यह अनहैंडल्ड रिजेक्शन नहीं बनती और दोबारा कोशिश की जा सकती है।</p>
    `,
      },
      {
        id: "router-api",
        title: "राउटर API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> एक पैटर्न को लोडर, या नेस्टेड टेबल पर मैप करता है। विकल्प:</p>
      <table>
        <thead><tr><th>विकल्प</th><th>डिफ़ॉल्ट</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL उपसर्ग के तहत ऐप परोसा जाता है, जैसे <code>'/docs'</code>। यह केवल खंड सीमा पर मेल खाता है: <code>/docs/intro</code> <code>'/docs'</code> के अंदर है, <code>/docsearch</code> नहीं है। इसके बाहर के यूआरएल किसी भी तरह से मेल नहीं खाते हैं, इसलिए <code>start()</code> अस्वीकार कर देता है (आपका सर्वर-साइड 404) और उनके लिंक ब्राउज़र पर छोड़ दिए जाते हैं।</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>पृष्ठ निष्क्रिय होने पर शेष मार्गों के मॉड्यूल को पृष्ठभूमि में लोड करें। <code>false</code> इसे बंद कर देता है.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>टैप, कुंजी, व्हील इवेंट या स्क्रॉल के बिना बीतने वाला समय, मिलीसेकंड में, जिसके बाद प्रीलोडिंग शुरू होती है या गतिविधि के बाद फिर शुरू होती है।</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, ब्राउज़र में प्रत्येक हल किए गए नेविगेशन के बाद कॉल किया जाता है, जिसमें शुरुआती नेविगेशन भी शामिल है, DOM अपडेट होने के बाद. <code>kind</code> <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (पीछे, आगे, <code>close()</code>) या <code>'layer'</code> है। <code>document.title</code>, मेटा टैग, फोकस, स्क्रॉलिंग और एनालिटिक्स के लिए हुक। SSR के दौरान कभी कॉल नहीं होता।</td></tr>
        </tbody>
      </table>
      <p>यह एक राउटर लौटाता है: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> और <code>run()</code> को छोड़कर <code>Route</code> के सभी सदस्य। ये सदस्य सक्रिय रूट पढ़ते हैं: ब्राउज़र में आखिरी पूरे हुए <code>start()</code> का रूट, या सर्वर पर वह रूट जिसका <code>run()</code> चल रहा है। कोई सक्रिय रूट न होने पर सदस्य पढ़ने से त्रुटि थ्रो होती है। रूट टेबल, कंपाइल किया गया मैचर और मॉड्यूल कैश राउटर में रहते हैं, इसलिए सर्वर पर अनुरोध इन्हें साझा करते हैं।</p>
      <h3><code>router.start(url?)</code></h3>
      <p>अपने पेज मॉड्यूल में <code>url</code> (ब्राउज़र में डिफ़ॉल्ट: <code>location.href</code>) को हल करता है और एक <code>Promise&lt;Route&gt;</code> लौटाता है। जब कुछ भी मेल नहीं खाता और तालिका में कोई <code>'*'</code> रूट नहीं है तो अस्वीकार कर देता है। एक सर्वर पर, वह आपका 404 है। ब्राउज़र में यह उस Route को राउटर का सक्रिय रूट बनाता है, <code>popstate</code> और डेलिगेटेड <code>click</code> लिसनर को जोड़ता है और प्रीलोडिंग शेड्यूल करता है। दूसरा <code>start()</code> आपके लिए पिछले रूट को समाप्त कर देता है। सर्वर पर यह साझा की गई किसी भी चीज़ को नहीं छूता है, इसलिए <code>route.run()</code> के अंदर रेंडर करें।</p>
      <h3><code>router.match(url?)</code></h3>
      <p>बिना कुछ लोड किए टेबल से URL का मिलान करता है: कोई इम्पोर्ट, हिस्ट्री बदलाव, लिसनर या रूट नहीं बनता। मिलान होने पर <code>RouteContext</code> लौटाता है। URL <code>base</code> के बाहर हो, किसी पैटर्न से न मिले या ब्राउज़र में दूसरे ओरिजिन का हो, तो <code>null</code> लौटाता है। केवल एब्सोल्यूट URL लेता है, क्योंकि <code>./</code> रिज़ॉल्यूशन के लिए सक्रिय रूट चाहिए।</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>सक्रिय रूट के पेज एक <code>list()</code> के रूप में लौटाता है। पेज जहाँ दिखाने हों, वहाँ इसे एक बार रखें। पुश की गई लेयर इसमें बाद की पंक्ति होती है। <code>start()</code> पूरा होने से पहले और <code>stop()</code> के बाद यह खाली रहता है। सर्वर पर यह उसी रूट को रेंडर करता है जिसका <code>run()</code> चल रहा है।</p>
      <h3><code>router.matches(table)</code></h3>
      <p>एक दूसरी तालिका का व्यू रेंडर करता है जो सक्रिय रूट के पथ से मेल खाता है, <code>list()</code> के रूप में आप इसे कहीं भी रख सकते हैं। <a href="#router-matches"><code>matches()</code></a> देखें।</p>
      <h3><code>Route</code></h3>
      <p><code>run()</code> को छोड़कर प्रत्येक सदस्य राउटर पर भी है, जहां एक ऐप इसे पढ़ता है।</p>
      <table>
        <thead><tr><th>सदस्य</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>सक्रिय मिलान। <code>search</code> एक <code>URLSearchParams</code> है। <code>search</code>, <code>hash</code> और <code>url</code> लाइव मान हैं।</td></tr>
          <tr><td><code>pending</code></td><td>कोई नेविगेशन एक मॉड्यूल या लोडर की प्रतीक्षा कर रहा है</td></tr>
          <tr><td><code>error</code></td><td>अंतिम विफल लोड, अगले नेविगेशन द्वारा साफ़ किया गया</td></tr>
          <tr><td><code>data</code></td><td> मिलान किए गए पृष्ठ का <code>load()</code> क्या लौटा, सर्वर पर सीरियलाइज़ करने के लिए। इसमें पैरेंट का डेटा नहीं है.</td></tr>
          <tr><td><code>depth</code></td><td> स्टैक पर कितनी लेयर हैं (एक सामान्य पृष्ठ के लिए 1)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>नेविगेट करता है और ज़रूरत हो तो मॉड्यूल लोड करता है। कभी रिजेक्ट नहीं होता: मॉड्यूल रिजेक्ट या थ्रो करे, तो त्रुटि <code>error</code> में मिलती है।</td></tr>
          <tr><td><code>push(href)</code></td><td>रूट को ऊपर नई लेयर में खोलता है। लेयर बंद होने पर उसके परिणाम से रिज़ॉल्व होता है। <code>./</code> स्वीकार करता है। मिलान न होने या मॉड्यूल विफल होने पर रिजेक्ट होता है।</td></tr>
          <tr><td><code>href(path)</code></td><td> <code>a({ href })</code> के लिए <code>base</code> के साथ एक पथ उपसर्ग करें। सक्रिय रूट के विरुद्ध <code>./</code> और <code>../</code> का समाधान करता है।</td></tr>
          <tr><td><code>stop()</code></td><td> प्रत्येक लिसनर को अलग करें, खुली लेयरों को खारिज करें, आउटलेट खाली करें। दोबारा कॉल करने पर भी वही परिणाम रहता है। रुका हुआ रूट अभी भी अपने अंतिम मैच के साथ उत्तर देता है, और <code>go()</code> कुछ नहीं करता है।</td></tr>
          <tr><td><code>run(fn)</code></td><td>इस रूट को राउटर का सक्रिय रूट बनाकर <code>fn</code> कॉल करता है और उसका परिणाम लौटाता है। सर्वर पर: <code>route.run(() =&gt; renderToString(App))</code>। केवल सिंक्रोनस। <code>fn</code> लौटते ही रूट का सक्रिय स्कोप खत्म हो जाता है।</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>एक पृष्ठ का पहला आर्ग्युमेंट: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>। यह वह संदर्भ है जिसके साथ पेज बनाया गया था। जीवंत मानों के लिए <code>router.*</code> पढ़ें। वे केवल तभी भिन्न होते हैं जब क्वेरी या हैश पुनर्निर्माण के बिना बदल जाता है।</p>
      <p><code>params</code> डिफ़ॉल्ट रूप से <code>{ [name]: string }</code> है। एक पेज इसे <code>Params</code> के साथ अपने पैटर्न से टाइप कर सकता है, जो <code>'/blog/:slug'</code> को <code>{ slug: string }</code> में और <code>'/files/*rest'</code> को <code>{ rest: string }</code> में बदल देता है:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>एक पेज का दूसरा आर्ग्युमेंट। पेज को जो चाहिए, उसे डीस्ट्रक्चर करके लें।</p>
      <table>
        <thead><tr><th>प्रॉप</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>जहां पेज स्टैक में बैठता है। नीचे <code>Layer</code> देखें।</td></tr>
          <tr><td><code>data</code></td><td>रूट का <code>load()</code> क्या लौटा, या <code>undefined</code> जब लोडर न हो। <code>PageProps&lt;TData&gt;</code> से टाइप किया जाता है।</td></tr>
          <tr><td><code>outlet</code></td><td> जहां एक पैरेंट पेज अपने चाइल्ड रूट को रेंडर करता है। <a href="#router-patterns">नेस्टेड रूट देखें</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>एक गार्ड रजिस्टर करता है जिसे पेज हटाने से पहले कॉल किया जाता है। <a href="#router-layers">लीव गार्ड</a> देखें।</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>स्टैक में पेज की जगह और उससे बाहर निकलने का तरीका।</p>
      <table>
        <thead><tr><th>सदस्य</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>बेस पेज के लिए 0, पुश की गई लेयर के लिए 1 और उससे ऊपर</td></tr>
          <tr><td><code>push(href)</code></td><td><code>Route.push()</code> की तरह, पेज के अंदर से दूसरी लेयर खोलता है</td></tr>
          <tr><td><code>close(result?)</code></td><td>इस लेयर और इसके ऊपर की सभी चीज़ों को बंद करें, इसे खोलने वाले <code>push()</code> को हल करें। बिना आर्ग्युमेंट के कॉल करने का मतलब रद्द करना है। गहराई 0 पर यह कुछ नहीं करता।</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> और <code>withLoad()</code></h3>
      <p><code>DataLoader</code> <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code> है, जो एक पेज मॉड्यूल का वैकल्पिक <code>load</code> एक्सपोर्ट है। <code>withLoad(loader, load)</code> एक मार्ग बनाता है जिसका <code>load</code> उसके चंक के इम्पोर्ट के बाद शुरू होने के बजाय उसके साथ-साथ शुरू होता है। <a href="#router-loaders">रूट लोडर</a> देखें।</p>
      <h3>टाइप</h3>
      <p>हर टाइप <code>nuclo-router</code> का नेम्ड एक्सपोर्ट है, इसलिए एक पेज, एक लोडर या एक गार्ड को पथ से इम्पोर्ट किए बिना टाइप किया जा सकता है।</p>
      <table>
        <thead><tr><th>टाइप</th><th>यह क्या है</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td> एक पैटर्न के लिए पैरामीटर ऑब्जेक्ट। <code>RouteParams</code> बिना विशेष टाइप वाला रूप है, और <code>Match</code> मिलानकर्ता का परिणाम है।</td></tr>
          <tr><td><code>PageComponent</code></td><td>पेज: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>पेज मॉड्यूल: खुद कंपोनेंट, या <code>import()</code> से मिलने वाला <code>{ default, load? }</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, वैकल्पिक रूप से <code>withLoad()</code> से मिला <code>load</code> भी रखता है</td></tr>
          <tr><td><code>RouteTable</code></td><td><code>createRouter()</code> को दी जाने वाली टेबल: पैटर्न से लोडर या नेस्टेड टेबल का मैप</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, <code>go()</code> का दूसरा आर्ग्युमेंट</td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, <code>onNavigate</code> का दूसरा आर्ग्युमेंट</td></tr>
          <tr><td><code>Outlet</code></td><td><code>PageProps</code> में <code>outlet()</code> का टाइप</td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, <code>beforeLeave()</code> क्या लेता है</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code> का व्यू: पैरामीटर लेकर सामग्री या पेज का <code>import()</code> लौटाता है</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "लेयर और लीव गार्ड",
        content: `
      <p><code>push()</code> मौजूदा रूट को बदलने के बजाय उसके ऊपर नया रूट खोलता है। लेयर बंद होने पर दिए परिणाम से इसका Promise रिज़ॉल्व होता है। पेज स्टैक पर एक ही <code>list()</code> है, इसलिए लेयर खोलना उसमें नई पंक्ति जोड़ना है। नीचे का पेज दोबारा रेंडर नहीं होता। लेयर बंद होने पर उसका DOM, फ़ोकस और आधा भरा फ़ॉर्म बना रहता है।</p>
      <p>इससे उपयोगकर्ता का आधा भरा फ़ॉर्म हटाए बिना नया रिकॉर्ड बनाया जा सकता है, जब ज़रूरी रिकॉर्ड अभी मौजूद न हो:</p>
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
      <p>लेयर को नेस्ट कर सकते हैं। दूसरे डायलॉग की ज़रूरत हो, तो डायलॉग <code>layer.push()</code> कॉल करके उसका इंतज़ार कर सकता है। उसे रूट का रेफ़रेंस नहीं चाहिए।</p>
      <ul>
        <li><strong>URL सबसे ऊपर की लेयर का होता है।</strong> <code>push()</code> हिस्ट्री में एंट्री जोड़ता है, इसलिए लेयर का लिंक बनाया जा सकता है। Back उसे Cancel की तरह बंद करता है और उसका <code>push()</code> रद्द होने के परिणाम से रिज़ॉल्व होता है। Back और <code>close()</code> एक ही कोड पथ इस्तेमाल करते हैं: <code>close()</code> परिणाम रखकर हिस्ट्री में पीछे जाता है और <code>history.state</code> की गहराई तय करती है कि क्या दिखेगा। ब्राउज़र हर टैब में लगभग 50 एंट्री रखते हैं। लेयर में लंबा नेविगेशन होने पर नीचे की एंट्री हट सकती है। तब <code>close()</code> लेयर को वहीं बंद करता है और मौजूदा एंट्री को दिख रहे पेज के URL से बदल देता है।</li>
        <li><strong>एक साधारण नेविगेशन स्टैक को साफ़ करता है।</strong> एक लिंक क्लिक या <code>go()</code> एक लेयर नहीं है। यह सब कुछ बदल देता है और हर खुली लेयर को खारिज कर देता है, इसलिए किसी भी कॉल करने वाले को इंतजार नहीं करना पड़ता है।</li>
        <li><strong>सीधे URL खोलने पर लेयर अलग पेज होती है।</strong> URL सबसे ऊपर की लेयर बताता है, नीचे का स्टैक नहीं। इसलिए उसका URL सीधे खोलने पर वह गहराई 1 पर रेंडर होती है, जहाँ <code>layer.depth === 0</code> है और <code>close()</code> कुछ नहीं करता। पुश किया जाने वाला रूट अपने आप में भी उपयोगी होना चाहिए। <code>layer.depth</code> जाँचकर Cancel बटन की जगह बाहर जाने का लिंक दिखाएँ।</li>
        <li><strong>Promise रीलोड के बाद नहीं बच सकता,</strong> क्योंकि वह क्लोज़र के स्टेट में रहता है। परिणाम लौटाना इस प्रक्रिया को छोटा करने का तरीका है; प्रक्रिया को सीधे खोलने पर भी काम करना चाहिए।</li>
        <li><strong> प्रतीक्षा में कुछ भी नहीं बचा है। </strong> <code>stop()</code> प्रत्येक खुली लेयर को खारिज कर देता है, और नेविगेशन द्वारा छोड़ी गई लेयर <code>undefined</code> के साथ हल हो जाती है।</li>
      </ul>
      <h3>लीव गार्ड</h3>
      <p>एक पृष्ठ जिसमें रखने योग्य कुछ चीज़ होती है, जैसे कि आधा भरा हुआ फॉर्म, एक गार्ड को पंजीकृत करता है। पृष्ठ को त्यागने से पहले यह पूछा जाता है, और <code>false</code> (या इसका Promise) लौटाने से पृष्ठ बना रहता है:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>केवल पेज हटने पर।</strong> लेआउट के चाइल्ड रूट बदलने या पेज बचाए रखने वाले क्वेरी/हैश बदलाव पर गार्ड नहीं पूछा जाता। गार्ड का जीवनकाल पेज से जुड़ा है, इसलिए उसे अलग से अनरजिस्टर नहीं करना पड़ता।</li>
        <li><strong>पेज छोड़ने के सभी रास्तों पर।</strong> लिंक, <code>go()</code>, Back और Forward, लेयर का <code>close()</code> और राउटर के बाहर के URL पर <code>go()</code>—ऐप छोड़ते समय <code>to</code> का मान <code>null</code> होता है। गार्ड Back या Forward रोके, तो हिस्ट्री वापस की जाती है ताकि एड्रेस बार मौजूदा पेज से मेल खाए। टैब बंद करना या रीलोड करना <code>beforeunload</code> के ज़रिए संभालें।</li>
        <li><strong><code>to</code></strong> गंतव्य का <code>RouteContext</code> है। गार्ड सबसे अंदर वाले पेज से शुरू होते हैं और पहले इनकार पर रुक जाते हैं। गार्ड त्रुटि थ्रो करे, तो पेज बना रहता है। <code>close(result)</code> भी गार्ड से होकर जाता है, इसलिए परिणाम के साथ बंद करने से पहले अपना फ़्लैग साफ़ करें।</li>
        <li>राउटर केवल अपनी बनाई हिस्ट्री एंट्री का नेविगेशन वापस कर सकता है। ब्राउज़र के सामान्य <code>#fragment</code> लिंक या दूसरी स्क्रिप्ट के <code>pushState</code> से बनी एंट्री पर Back या Forward करने पर गार्ड नहीं पूछा जाता।</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() और सब-राउटर",
        content: `
      <p><code>router.outlet()</code> पेज रेंडर करता है। <code>router.matches(table)</code> मौजूदा पथ के अनुसार अपनी छोटी टेबल से साइडबार, ब्रेडक्रंब या टूलबार जैसी दूसरी सामग्री रेंडर करता है। इसके लिए रूट लोड करने या पेज जोड़ने की ज़रूरत नहीं:</p>
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
        <li><strong>रूट टेबल के समान मिलान।</strong> पैटर्न, प्राथमिकता, कच्चे-पथ मिलान और <code>base</code> स्ट्रिपिंग राउटर के स्वयं के हैं, इसलिए एक व्यू और एक पृष्ठ हमेशा यूआरएल के बारे में सहमत होते हैं। यह <code>router.path</code> की तरह शीर्ष लेयर का पथ पढ़ता है।</li>
        <li><strong>व्यू</strong> <code>(params, ctx) =&gt; content</code> है, जहां <code>params</code> इसके पैटर्न से टाइप किया गया है और <code>ctx</code> व्यू के <code>pattern</code> और <code>params</code> के साथ <code>RouteContext</code> है। इसके बजाय यह पेज मॉड्यूल का <code>import()</code> लौटा सकता है, जिसे लैंड करने के बाद <code>ctx</code> के साथ कॉल किया जाता है।</li>
        <li><strong>कुछ भी मेल नहीं खाता, कुछ भी रेंडर नहीं करता।</strong> फ़ॉलबैक के लिए एक <code>'*'</code> व्यू जोड़ें। यह आउटलेट की तरह <code>start()</code> से पहले और <code>stop()</code> के बाद खाली है।</li>
        <li><strong>यह केवल रूट बदलने पर दोबारा रेंडर होता है</strong>, इसलिए जिन बदलावों पर पेज बना रहता है, उन पर व्यू का DOM भी बना रहता है।</li>
        <li><strong>लेज़ी व्यू अपने मॉड्यूल आने तक कुछ भी रेंडर नहीं करता है। </strong> एक विफल <code>import()</code> को <code>console.error</code> के साथ लॉग किया गया है, <code>router.error</code> सेट नहीं करता है, और अगले नेविगेशन पर पुनः प्रयास किया जाता है। एक साधारण <code>update()</code> पुनः प्रयास नहीं करता है।</li>
        <li><strong> सर्वर</strong> पर लेज़ी व्यू कुछ भी नहीं भेजता है, क्योंकि इसका मॉड्यूल क्लाइंट पर लैंड करता है। पहले HTML में शामिल होने वाली किसी भी चीज़ के लिए एक सिंक्रोनस व्यू का उपयोग करें।</li>
      </ul>
      <h3>सब-राउटर</h3>
      <p>रूट नेस्ट होते हैं, इसलिए एक सब-राउटर आमतौर पर सिर्फ एक नेस्टेड टेबल होता है। एक राउटर: सेक्शन का अपना <code>'/'</code> पेज इसका बाहरी UI है, और इसके चाइल्ड नोड उस पेज के <code>outlet()</code> में रेंडर करते हैं, इसलिए बाहरी UI सेक्शन के भीतर नेविगेशन से बच जाता है:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>या फ़ीचर का अलग राउटर बनाएँ और उसे शुरू न करें। पैरेंट में एक कैच-ऑल एंट्री हो और चाइल्ड अपने पैटर्न, पैरामीटर व फ़ॉलबैक के अनुसार बाकी पथ का मिलान करे:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>इसे शुरू न करना ज़रूरी है। <code>start()</code> लिसनर जोड़ता है और दो शुरू किए गए राउटर आपस में टकराते हैं। इस रूप में चाइल्ड खुद रूट हल करता है, इसलिए शुरू किया गया राउटर जिन रूट लोडर को चलाता, उन्हें आपको कॉल करना होगा। शेष पथ बदलने पर शेल भी दोबारा बनता है: मुख्य राउटर को एक ही रूट दिखता है और शेल बाकी पथ खुद हल करता है। नेस्टेड टेबल पैरेंट पेज को माउंट रखती है। इसलिए उसे प्राथमिकता दें, जब तक फ़ीचर को अपना राउटर, बेस और फ़ॉलबैक चाहिए ही न हो।</p>
    `,
      },
      {
        id: "router-multi",
        title: "कई राउटर और संयुक्त लोडिंग",
        content: `
      <p>ऐप में हर रीजन का अपना राउटर हो सकता है। नियम सरल है: <strong>हर document में एक ही राउटर शुरू करें</strong>। बाकी राउटर शुरू न करें और उनसे <code>match()</code> के ज़रिए URL का मिलान पूछें। केवल शुरू किया राउटर URL, हिस्ट्री और क्लिक लिसनर संभालता है। बाकी रूट टेबल हैं जिनसे मिलान पूछ सकते हैं। हर रीजन अपने स्पिनर के साथ स्वतंत्र रूप से लोड हो सकता है।</p>
      <h3>संयुक्त लोडिंग: लोडर की एक श्रृंखला</h3>
      <p>मिलान की श्रृंखला का हर पेज <code>load()</code> एक्सपोर्ट कर सकता है। कैश खाली होने पर चाइल्ड रूट खोलें, तो लेआउट और पेज के लोडर <strong>समानांतर चलते हैं</strong>। एक <code>router.pending</code> पूरी श्रृंखला की स्थिति बताता है। दोनों पूरे होने तक पिछला पेज स्क्रीन पर रहता है, इसलिए अधूरा ट्री कभी दिखाई नहीं देता। हर कंपोनेंट को अपना <code>data</code> मिलता है:</p>
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
      <p>दोनों लोडर एक के बाद एक चलने के बजाय साथ शुरू होते हैं। किसी का भी इंतज़ार हो, तो <code>router.pending</code> true होता है; बाकी समय false। पहले से उपलब्ध या प्रीलोड हुए रूट पर यह नहीं बदलता। सेक्शन बदलने पर लेआउट बना रहता है, इसलिए केवल सेक्शन का लोडर दोबारा चलता है। लेआउट का डेटा, DOM और आधा लिखा इनपुट बचा रहता है। उसी URL पर दोबारा नेविगेट करने पर अंतिम पेज का लोडर फिर चलता है और उसकी पंक्ति फिर बनती है, जैसे अकेले पेज के लिए होता है।</p>
      <h3>एकाधिक लोडिंग: अपने स्वयं के स्पिनर के साथ एक दूसरा राउटर</h3>
      <p>एक स्वतंत्र रीजन - एक साइडबार, एक ट्रे, एक लाइव रीजन - को अपना स्वयं का राउटर मिलता है, बनाया गया लेकिन कभी शुरू नहीं हुआ, और इसका अपना लोडिंग फ़्लैग होता है। <code>router.pending</code> प्रारंभ किए गए राउटर से संबंधित है और इस रीजन के बारे में कुछ नहीं कहता है, इसलिए दोनों साथ-साथ लोड हो सकते हैं और कोई भी पहले समाप्त कर सकता है:</p>
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
      <p>दूसरे राउटर से केवल मिलान पूछा जाता है; उसे नेविगेट करने को नहीं कहा जाता। <code>match()</code> URL पढ़कर कॉन्टेक्स्ट लौटाता है। साइडबार की कोई जानकारी मुख्य रूट टेबल में नहीं जाती। <code>onNavigate</code> हर पूरा हुए नेविगेशन के बाद चलता है, शुरुआती नेविगेशन सहित। इसलिए स्वतंत्र रीजन को URL के साथ सिंक रखने के लिए यही एक जगह पर्याप्त है।</p>
      <ul>
        <li><strong><code>pending</code> शुरू किए गए राउटर का है।</strong> बिना शुरू किए राउटर में कोई रूट, <code>pending</code> या <code>error</code> नहीं होता। रीजन अपने फ़्लैग रखता है और उसका स्पिनर मुख्य स्पिनर के साथ दिख सकता है। डेमो में साइडबार 800 मिलीसेकंड लेता है और रूट के लोडर 900 मिलीसेकंड, इसलिए पेज या साइडबार में से कोई भी पहले पूरा हो सकता है।</li>
        <li><strong><code>match()</code> कुछ भी नहीं जोड़ता है। </strong> किसी भी संख्या में अनस्टार्ट राउटर दस्तावेज़ साझा कर सकते हैं; प्रत्येक की अपनी तालिका, आधार और मॉड्यूल कैश है, और उनमें से कोई भी इतिहास को नहीं छूता है। उनकी कीमत एक टेबल और एक मैचर है।</li>
        <li><strong>इसके लोडर कभी नहीं चलते हैं।</strong> प्रारंभ किया गया राउटर उससे मेल खाने वाले पृष्ठों के <code>load()</code> को चलाता है। बिना शुरू किया गया राउटर केवल URL का मिलान करता है, इसलिए यदि इसके व्यू को डेटा की आवश्यकता है, तो इसे स्वयं प्राप्त करें - डेमो का <code>refreshSidebar()</code>। यदि आप लोडर चाहते हैं, तो एक <a href="#router-matches">नेस्टेड टेबल</a> या एक <a href="#router-regions">पेज से भरा जाने वाला रीजन</a> उस काम को स्टार्ट किए गए राउटर के साथ रखता है।</li>
        <li><strong>पुराने जवाबों से बचें।</strong> धीमे साइडबार फ़ेच का परिणाम उस सेक्शन पर लागू न हो जहाँ से आप जा चुके हैं। हर रीफ़्रेश पर जनरेशन काउंटर बढ़ाएँ और पुराने जवाब छोड़ दें। राउटर भी नए नेविगेशन के आगे निकलने पर पिछले नेविगेशन को इसी तरह निष्क्रिय कर देता है।</li>
        <li><strong>लेज़ी <code>matches()</code> व्यू में कोई <code>pending</code> भी नहीं है। </strong> यह तब तक कुछ भी रेंडर नहीं करता जब तक इसका मॉड्यूल लैंड नहीं हो जाता। तीन लोडिंग सिस्टम, तीन स्वतंत्र घड़ियाँ: मार्ग का <code>pending</code>, आपके अपने फ़्लैग, और लेज़ी व्यू जो अभी तक वहाँ नहीं है।</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "लिंक संभालना",
        content: `
      <p>डेलिगेटेड लिसनर <code>&lt;a href&gt;</code> या उसके अंदर के किसी एलिमेंट पर बाएँ क्लिक से नेविगेट करता है, SVG <code>&lt;a&gt;</code> सहित। बाकी मामलों को ब्राउज़र पर छोड़ देता है: मॉडिफ़ायर कुंजी के साथ क्लिक, मध्य क्लिक, <code>_self</code> से अलग <code>target</code>, <code>download</code>, <code>rel="external"</code>, दूसरे ओरिजिन के href, मौजूदा पेज के केवल हैश वाले लिंक, <code>base</code> के बाहर के पथ, किसी रूट से न मिलते पथ (ताकि सर्वर का 404 खुल सके) और वे इवेंट जिन पर ऐप का हैंडलर पहले ही <code>preventDefault()</code> कॉल कर चुका हो। किसी लिंक को इससे बाहर रखने के लिए <code>data-nuclo-router="off"</code> लगाएँ।</p>
      <h3>स्क्रॉलिंग</h3>
      <p>पुश नेविगेशन मौजूदा स्क्रॉल स्थिति बनाए रखता है। नए URL का <code>#hash</code> पेज के एलिमेंट से मिले, तो वह एलिमेंट स्क्रॉल करके दिखाया जाता है। <code>popstate</code> पर स्क्रॉल ब्राउज़र संभालता है। नए पेज को ऊपर से दिखाने के लिए <code>onNavigate</code> उपयोग करें, जो नेविगेशन का तरीका बताता है:</p>
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
      <h3>नोट्स</h3>
      <ul>
        <li><strong>पिछले पेज को कैश में नहीं रखा जाता।</strong> रूट पेज का फ़ंक्शन और कॉन्टेक्स्ट रखता है, DOM नहीं। दूसरे पेज पर जाने पर पिछला पेज रिलीज़ होता है। <code>stop()</code> लिसनर और चल रहे लोड रिलीज़ करके <code>pending</code> साफ़ करता है, इसलिए निष्क्रिय रूट स्पिनर को अटका नहीं सकता। <code>stop()</code> के बाद लोड हुआ मॉड्यूल चुपचाप छोड़ दिया जाता है।</li>
        <li><strong>सर्वर पर एक साथ चलने वाले अनुरोध सुरक्षित हैं।</strong> <code>start()</code> हर अनुरोध का अलग स्टेट लौटाता है और <code>run()</code> उसे एक सिंक्रोनस रेंडर तक सीमित रखता है, इसलिए बीच-बीच में चलने वाले अनुरोध एक-दूसरे का रूट नहीं पढ़ सकते। केवल मॉड्यूल कैश साझा होता है। <code>run()</code> का फ़ंक्शन लौटते ही स्कोप खत्म हो जाता है। <code>renderToString()</code> सिंक्रोनस है, इसलिए इतना पर्याप्त है। एसिंक या स्ट्रीमिंग रेंडर में रूट को <code>await</code> के पार भी बचाना पड़ता, जो <code>run()</code> नहीं करता।</li>
        <li><strong><code>popstate</code></strong> पर स्क्रॉल पुनर्स्थापन ब्राउज़र का (<code>scrollRestoration</code>) है, राउटर का नहीं।</li>
        <li><strong>हर document में एक राउटर शुरू करें।</strong> हर <code>start()</code> अपना डेलिगेटेड <code>click</code> लिसनर जोड़ता है। दूसरे राउटर का <code>start()</code> पहले को नहीं रोकता; उसी राउटर पर दूसरा <code>start()</code> ऐसा करता है। दूसरी टेबल से URL मिलाना हो, तो राउटर बनाकर केवल <code>match()</code> कॉल करें। यह कोई लिसनर नहीं जोड़ता। स्वतंत्र रीजन इस तरह रूट के <code>pending</code> से अलग अपनी लोडिंग चला सकता है। <a href="#router-multi">कई राउटर और संयुक्त लोडिंग</a> देखें।</li>
        <li><strong>डिज़ाइन के कारण शामिल नहीं:</strong> हैश और मेमोरी हिस्ट्री, क्योंकि रूट pathname में होता है और सर्वर को हर रूट उपलब्ध कराना चाहिए; एक URL से दो स्वतंत्र रीजन की रूटिंग, क्योंकि पेज <code>into()</code> से कई रीजन भर सकता है लेकिन वे एक ही मिलते रूट के हिस्से होते हैं—स्वतंत्र रीजन फिर भी बिना शुरू किए अपना राउटर और लोडिंग रख सकता है, जैसा <a href="#router-multi">कई राउटर और संयुक्त लोडिंग</a> में है; और होवर प्रीलोडिंग, जिसे आप <code>mouseenter</code> से रूट का लोडर खुद कॉल करके कर सकते हैं।</li>
      </ul>
      <h3>उदाहरण</h3>
      <p>रिपॉजिटरी में दो रन करने योग्य उदाहरण एक दूसरे के पूरक हैं, इसलिए हर सेटिंग कहीं न कहीं देखने योग्य है:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: संपूर्ण API का क्लाइंट-साइड टूर। प्रत्येक पैटर्न फॉर्म और प्राथमिकता नियम, लिंक-हैंडलिंग ऑप्ट-आउट, लाइव नियंत्रण के साथ प्रत्येक रूट सदस्य, एक उप-राउटर, लेयर स्टैक तीन गहरी, दो पैरेंट पर एक सापेक्ष अनुभाग, और <code>pending</code> और <code>error</code> के साथ रूट लोडर। <code>preload: false</code> सेट करता है ताकि वे स्थितियाँ दिखाई रहें।</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: हर अनुरोध पर <code>renderToString()</code>, सर्वर के नोड दोबारा इस्तेमाल करने वाला हाइड्रेशन, वास्तविक 404 स्टेटस कोड, रूट से अलग <code>base</code>, नेटवर्क पैनल में दिखने वाली आइडल प्रीलोडिंग और ऐसा लोडर जिसका डेटा सर्वर से क्लाइंट को मिलता है ताकि हाइड्रेशन उसे दोबारा न लाए।</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "पैटर्न",
    sections: [
      {
        id: "computed",
        title: "गणना किए गए मान",
        content: `
      <p>Nuclo में computed API नहीं है। एक साधारण फ़ंक्शन लिखें और उसे डायनेमिक मानों से कॉल करें:</p>
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
        title: "एसिंक और लोडिंग",
        content: `
      <p>साधारण <code>async</code>/<code>await</code> का उपयोग करें, और हर बार स्टेट बदलने पर <code>update()</code> कॉल करें। एक फ़ेच के लिए, इसका मतलब है एक बार <code>await</code> से पहले और एक बार बाद में:</p>
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
        title: "सुझाए गए तरीके",
        content: `
      <ul>
        <li><strong>बदलाव एक साथ करें।</strong> ज़रूरी सभी स्टेट बदलें, फिर एक बार <code>update()</code> कॉल करें।</li>
        <li><strong> डायनेमिक मानों को तेज़ और साइड इफ़ेक्ट से मुक्त रखें। </strong> ये सभी प्रत्येक <code>update()</code> पर चलते हैं।</li>
        <li><strong>छोटे, लगातार अपडेट, जैसे टाइपिंग या टाइमर के लिए <code>scope()</code></strong> का उपयोग करें।</li>
        <li><strong>document में रेंडर करें।</strong> <code>update()</code> चलते समय जो नोड document में नहीं हैं, वे आगे अपडेट होना बंद कर देते हैं।</li>
        <li><strong>बदलने वाले चाइल्ड नोड के लिए <code>when()</code> और <code>list()</code></strong> उपयोग करें, नोड लौटाने वाला फ़ंक्शन नहीं।</li>
        <li><strong><code>className</code> का उपयोग करें, <code>class</code></strong> का नहीं, और डायनेमिक क्लास के लिए <code>() =&gt; cx(...)</code> या <code>{ className: () =&gt; … }</code> का उपयोग करें।</li>
        <li><strong>मॉड्यूल स्तर पर स्टाइल को एक बार परिभाषित करें</strong>।</li>
        <li><strong> सर्वर रेंडरिंग: </strong> पहले रेंडर करें, फिर <code>&lt;style id="nuclo-styles"&gt;</code> में <code>getCssText()</code> डालें। अनुरोध डेटा को आर्ग्युमेंट के रूप में पास करें, और आउटपुट में HTML टिप्पणियाँ रखें।</li>
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
        title: "API इंडेक्स",
        content: `
      <p>हर सार्वजनिक फ़ंक्शन और वह कहाँ से मिलता है।</p>
      <h3><code>nuclo</code> (ग्लोबल और नेम्ड एक्सपोर्ट)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: सभी डायनेमिक मान, या दिए गए दायरे में चलाएँ।</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: <code>update(id)</code> के लिए एक एलिमेंट स्कोप आईडी दें।</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: सशर्त सामग्री, <code>.when()</code> और <code>.else()</code> के साथ।</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: प्रति आइटम एक पंक्ति, पहचान से मेल खाती है।</li>
        <li><a href="#api-region"><code>region(options)</code></a> और <a href="#api-region"><code>into(id, ...content)</code></a>: ट्री में एक नामित स्थान, और सामग्री जो इसे कहीं से भी भरती है।</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: एक इवेंट लिसनर, या <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>।</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: बनाएँ और जोड़ें।</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: सर्वर के HTML को क्लाइंट पर सक्रिय करें।</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: कंपोनेंट को फिर से कॉल करें और DOM को पैच करें।</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: एक स्टाइल ऑब्जेक्ट से उत्पन्न क्लास।</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: स्टाइल मर्ज करें; बाद वाले मानों को प्राथमिकता मिलती है।</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: थीम वाले <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> और <code>globalStyle</code>।</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: विकल्पों में से स्टाइल।</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> और <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>।</li>
      </ul>
      <h3><code>nuclo</code> (केवल नेम्ड एक्सपोर्ट)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> और <a href="#api-css-text"><code>resetStyles()</code></a>।</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> और <code>getCssText()</code>।</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">साइड-इफ़ेक्ट इम्पोर्ट</a>, प्लस <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> और <code>Nuclo*</code> क्लास।</li>
      </ul>
      <h3><code>nuclo-router</code> (अलग पैकेज)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: राउटर, <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code> के साथ, <code>href()</code> और <code>stop()</code>।</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: ऐसा रूट जिसका डेटा लोडर उसके चंक के साथ शुरू होता है।</li>
        <li><a href="#router-api">टाइप</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> और अधिक।</li>
      </ul>
      <h3>ग्लोबल्स</h3>
      <ul>
        <li><a href="#tag-builders">175 टैग बिल्डर</a>: <code>div</code>, <code>span</code>, ..., <code>var_</code>, और <code>svgSvg</code>, <code>pathSvg</code>, ....</li>
        <li><a href="#typescript-setup">टाइप</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> और अधिक। <code>StyleResult</code> जैसे स्टाइलिंग टाइप को <code>'nuclo'</code> से भी इम्पोर्ट किया जा सकता है।</li>
      </ul>
      <h3>विशेष कुंजी</h3>
      <ul>
        <li><a href="#attributes">एट्रिब्यूट</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> हैंडलर</a>, <a href="#lifecycle"><code>onMount</code> और <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects"> स्टाइल ऑब्जेक्ट</a>: शॉर्टहैंड, स्यूडो स्टेट, <code>&amp;</code> सेलेक्टर, <code>@</code> नियम और <code>raw</code>।</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "अक्सर पूछे जाने वाले प्रश्न",
        content: `
      <h3>क्या स्टेट बदलने से UI अपडेट हो जाता है?</h3>
      <p>नहीं। DOM तब तक वैसा ही रहता है जब तक आप <code>update()</code> कॉल नहीं करते।</p>

      <h3>क्या Nuclo सिग्नल, प्रॉक्सी या वर्चुअल DOM का उपयोग करता है?</h3>
      <p>नहीं। स्टेट साधारण JavaScript रहता है। जब एक ट्री रेंडर किया जाता है, तो Nuclo वास्तविक एलिमेंट और टेक्स्ट नोड बनाता है। <code>update()</code> प्रत्येक पंजीकृत डायनेमिक मान, या दिए गए दायरे के अंदर चलाता है, और उन्हीं नोड्स को पैच करता है जहां मान बदल गया है। कोई निर्भरता ग्राफ़ और कोई वर्चुअल ट्री नहीं है।</p>

      <h3>मेरा पेज "false" क्यों दिखाता है?</h3>
      <p>बूलियन मान टेक्स्ट के रूप में रेंडर करते हैं। <code>div(ok &amp;&amp; span('Done'))</code> "false" दिखाता है। चाइल्ड नोड के लिए <code>when(() =&gt; ok, span('Done'))</code> और टेक्स्ट के लिए <code>ok ? 'Done' : ''</code> का उपयोग करें।</p>

      <h3>जब मैं आइटम संपादित करता हूं तो मेरी सूची पंक्ति क्यों नहीं बदलती?</h3>
      <p>उन आइटमों की पंक्तियाँ जो अभी भी सूची में हैं, रखी जाती हैं, दोबारा रेंडर नहीं की जाती हैं। बदलने वाले फ़ील्ड के लिए <code>() =&gt; todo.text</code> जैसे डायनेमिक मानों का उपयोग करें। <a href="#api-list"><code>list()</code></a> देखें।</p>

      <h3>मेरे UI का हिस्सा अपडेट होना क्यों बंद हो जाता है?</h3>
      <p>आमतौर पर जब <code>update()</code> चलता था तो इसके नोड्स दस्तावेज़ में नहीं होते थे। Nuclo उन नोड्स को ट्रैक करना बंद कर देता है, भले ही आप उन्हें संलग्न कर लें, इसलिए दस्तावेज़ में मौजूद कंटेनर में रेंडर करें। दो अन्य कारण: एक <code>when()</code> जिसकी शर्त थ्रो करे तो अपडेट होना बंद हो जाता है, और एक टेक्स्ट फ़ंक्शन जो अपने पहले रन पर थ्रो करता है वह खाली रहता है। <a href="#api-update"><code>update()</code></a> देखें।</p>

      <h3>मुझे <code>forceUpdate()</code> का उपयोग कब करना चाहिए?</h3>
      <p>केवल स्टैटिक मानों में दुर्लभ परिवर्तनों के लिए, जैसे भाषा बदलना। बाकी सभी चीज़ों के लिए, <code>update()</code> का उपयोग करें। <a href="#api-force-update"><code>forceUpdate()</code></a> देखें।</p>

      <h3>मैं किसी पेज को प्रोप के रूप में पास किए बिना लेआउट में कैसे डालूं?</h3>
      <p><code>region({ id: 'main' })</code> से जगह चिह्नित करें और पेज से <code>into('main', …)</code> लौटाएँ। <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a> देखें।</p>

      <h3>मैं किसी ऐप को कैसे अनमाउंट करूं?</h3>
      <p>इसे <code>when()</code> में लपेटें और शर्त false कर दें। DOM को स्वयं हटाने से <code>onDestroy</code> नहीं चलता है। <a href="#lifecycle">लाइफ़साइकल</a> देखें।</p>

      <h3>क्या Nuclo में राउटर शामिल है?</h3>
      <p>कोर पैकेज में नहीं। रूटिंग अलग <code>nuclo-router</code> पैकेज में मिलती है, जिसमें सर्वर रेंडरिंग, हाइड्रेशन, कोड-स्प्लिट रूट और आइडल प्रीलोडिंग हैं। इसे <code>npm install nuclo nuclo-router</code> से इंस्टॉल करें। <a href="#router-overview">nuclo-router</a> देखें।</p>

      <h3>क्या Nuclo में इफ़ेक्ट हैं?</h3>
      <p>नहीं। <code>onMount</code> और <code>onDestroy</code> एलिमेंट जुड़ने और हटने पर प्रति एलिमेंट एक बार चलते हैं। केवल स्टेट बदलने से कुछ भी दोबारा नहीं चलता।</p>
    `,
      },
    ],
  },

];
