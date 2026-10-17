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
      <p>एक टाइप की गई स्टाइल ऑब्जेक्ट को जेनरेट किए गए CSS क्लास में बदल देता है। परिणाम को किसी भी टैग बिल्डर को भेजें। ब्राउज़र में, नियम एक <code>&lt;style id="nuclo-styles"&gt;</code> तत्व में जाते हैं। सर्वर पर, <a href="#api-css-text"><code>getCssText()</code></a> उन्हें लौटाता है।</p>
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
        <li><code>css()</code> आधार घोषणाओं के लिए एक वर्ग बनाता है, साथ ही प्रत्येक छद्म कुंजी, चयनकर्ता और मीडिया ब्लॉक के लिए एक वर्ग बनाता है। उपरोक्त कार्ड को दो वर्ग मिलते हैं।</li>
        <li>क्लास नाम सामग्री के हैश हैं। समान शैलियाँ एक वर्ग साझा करती हैं, और सर्वर और क्लाइंट समान नाम उत्पन्न करते हैं।</li>
        <li>मॉड्यूल स्तर पर एक बार शैलियों को परिभाषित करें। <code>css()</code> ऑब्जेक्ट द्वारा कैश होता है, इसलिए प्रत्येक कॉल पर एक नया ऑब्जेक्ट हर बार फिर से संसाधित होता है।</li>
        <li>किसी स्टाइल ऑब्जेक्ट को <code>css()</code> में पास करने के बाद उसे बदलने से कुछ नहीं होता है।</li>
        <li>प्रत्येक शैली पृष्ठ या सर्वर प्रक्रिया के जीवनकाल के लिए पंजीकृत रहती है। उन मानों के लिए जो प्रति आइटम बदलते हैं, जैसे डेटा से चौड़ाई, <a href="#attributes"><code>style</code> विशेषता</a> का उपयोग करें।</li>
      </ul>
      <h3>नामांकित शैलियाँ</h3>
      <p>पठनीय वर्ग नाम पाने के लिए पहले एक नाम पास करें:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>बेस क्लास बिल्कुल नाम है। अन्य ब्लॉकों को <code>name-&lt;hash&gt;</code> मिलता है।</li>
        <li>नाम एक वैध वर्ग नाम होना चाहिए। अन्यथा Nuclo चेतावनी देता है और एक उत्पन्न करता है।</li>
        <li>नाम वैश्विक हैं। यदि दो अलग-अलग शैलियाँ एक ही नाम का उपयोग करती हैं, तो Nuclo चेतावनी देता है।</li>
      </ul>
      <h3>परिणाम का उपयोग करना</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> और <code>card.className</code> दोनों वर्ग नाम लौटाते हैं।</p>
    `,
      },
      {
        id: "style-objects",
        title: "स्टाइल ऑब्जेक्ट",
        content: `
      <p>आप जिस ऑब्जेक्ट को <code>css()</code> पर पास करते हैं, वह camelCase में सामान्य CSS गुणों, शॉर्टहैंड का एक सेट और छद्म स्टेटों, चयनकर्ताओं और मीडिया प्रश्नों के लिए नेस्टेड कुंजियों का उपयोग करता है। TypeScript उन सभी को स्वत: पूर्ण करता है। टाइप किए गए सेट के बाहर की संपत्तियाँ, जैसे <code>borderTopLeftRadius</code>, <code>fill</code> या <code>paddingInline</code>, <code>raw</code> में जाती हैं (नीचे देखें)।</p>
      <h3>मान</h3>
      <ul>
        <li>संख्याएँ <code>0</code> और इकाई रहित संपत्तियों को छोड़कर <code>px</code> बन जाती हैं: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> और <code>gridRow</code>। <code>raw</code> में, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> और <code>animation-iteration-count</code> भी यूनिटलेस हैं।</li>
        <li>स्ट्रिंग्स का उपयोग लिखित रूप में किया जाता है। <code>null</code>, <code>undefined</code> और <code>false</code> को छोड़ दिया गया है।</li>
        <li><code>lineHeight</code> (और <code>leading</code>) इकाई रहित है, इसलिए <code>leading: 24</code> का अर्थ फ़ॉन्ट आकार का 24 गुना है। पिक्सेल के लिए <code>"24px"</code> लिखें.</li>
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
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>the मार्जिन</td></tr> के लिए भी यही बात लागू है
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
      <h3>छद्म स्टेट</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> और <code>firstLetter</code>। वे घोंसला बनाते हैं: <code>hover: { focus: {…} }</code> <code>:hover:focus</code> देता है।</p>
      <h3>चयनकर्ता और नियम</h3>
      <p>एक कुंजी जो <code>&amp;</code> से शुरू होती है वह एक चयनकर्ता है, और प्रत्येक <code>&amp;</code> वर्ग बन जाता है। एक कुंजी जो <code>@</code> से शुरू होती है वह एक नियम है: <code>@media</code>, <code>@container</code> या <code>@supports</code>।</p>
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
        <li>दो नेस्टेड <code>@media</code> ब्लॉक <code>and</code> के साथ संयोजित होते हैं। मीडिया प्रकार (<code>print</code>, <code>only screen</code>) के नेतृत्व वाली क्वेरी को पहले रखा जाता है, क्योंकि व्याकरण केवल शुरुआत में ही प्रकार की अनुमति देता है। एक जोड़ी जिसे समतल नहीं किया जा सकता - दो मीडिया प्रकार, या एक अग्रणी <code>not</code> - केवल आंतरिक क्वेरी को चेतावनी देता है और उसका उपयोग करता है। कोई भी अन्य नेस्टेड एट-रूल बाहरी को प्रतिस्थापित कर देता है।</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>किसी भी संपत्ति के लिए <code>raw</code> का उपयोग करें, नाम बिल्कुल CSS जैसा लिखा गया है। नंबर अभी भी <code>px</code> मिलते हैं, इसलिए स्ट्रिंग पास करें:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>किसी भी अन्य फ़्लैट कुंजी को कबाब-केस में बदल दिया जाता है और उसे वैसे ही लिखा जाता है, इसलिए <code>colr: 'red'</code> जैसी टाइपो एक घोषणा बन जाती है जिसे ब्राउज़र ड्रॉप कर देता है। किसी कुंजी के अंतर्गत एक नेस्टेड ऑब्जेक्ट जो एक छद्म स्थिति, एक स्क्रीन, या एक <code>&amp;</code> या <code>@</code> कुंजी नहीं है, को नजरअंदाज कर दिया जाता है। TypeScript दोनों की रिपोर्ट करता है।</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>शैलियों को जोड़ती है। जब दो इनपुट समान गुण सेट करते हैं, तो बाद वाला इनपुट जीत जाता है।</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>गलत इनपुट को छोड़ दिया जाता है, एरे को चपटा कर दिया जाता है, और स्ट्रिंग्स को विभाजित और डी-डुप्लिकेट कर दिया जाता है।</li>
        <li>एक ही ब्लॉक (आधार, एक ही छद्म, एक ही मीडिया क्वेरी) के लिए जेनरेट की गई कक्षाएं एक नई कक्षा में विलय हो जाती हैं। अन्य वर्ग के नाम अपरिवर्तित रहते हैं।</li>
        <li>केवल <code>cx()</code> तर्क क्रम जानता है। <code>div(base, blue)</code> के साथ, दोनों वर्ग जोड़े जाते हैं, और जो नियम पिछली बार बनाया गया था वह जीत जाता है। एक <code>cx()</code> कॉल में एक-दूसरे को ओवरराइड करने वाली शैलियाँ डालें।</li>
        <li>जब एक नामित शैली का ब्लॉक किसी अन्य इनपुट के ब्लॉक के साथ विलय हो जाता है, तो मर्ज किया गया वर्ग <code>name-&lt;hash&gt;</code> होता है, न कि मूल नाम। जो ब्लॉक मर्ज नहीं होते हैं वे अपनी कक्षा बनाए रखते हैं, इसलिए <code>cx(pageTitle, 'extra')</code> में अभी भी <code>page-title</code> है।</li>
      </ul>
      <h3>गतिशील कक्षाएं</h3>
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
      <p>फ़ंक्शन को अपने पहले रन पर एक स्टाइल परिणाम लौटाना होगा। <code>() =&gt; active &amp;&amp; activeButton</code> एक क्लास के बजाय "false" टेक्स्ट को प्रस्तुत करता है।</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>एक थीम से बंधे अपने स्वयं के <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> और <code>globalStyle</code> लौटाता है। एक थीम मानों को नाम देती है: नीचे दी गई थीम के साथ, <code>borderColor: 'border'</code> <code>#e5e7eb</code> लिखता है, और TypeScript नामों को स्वतः पूर्ण करता है। <code>screens</code> में प्रत्येक प्रविष्टि मीडिया क्वेरी के लिए एक शैली कुंजी बन जाती है, जैसे <code>md: {…}</code>।</p>
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
        <thead><tr><th>थीम कुंजी</th><th></th></tr></thead> द्वारा उपयोग किया गया
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> और प्रत्येक पक्ष, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>नई स्टाइल कुंजियाँ, जैसे <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>एक थीम नाम तभी हल होता है जब वह संपूर्ण मान हो। <code>border: "1px solid primary"</code> का समाधान नहीं हुआ।</li>
        <li><code>@</code> के बिना एक स्क्रीन मान <code>@media &lt;value&gt;</code> हो जाता है। <code>@</code> से शुरू होने वाला मान लिखित रूप में उपयोग किया जाता है, उदाहरण के लिए <code>"@container (min-width: 400px)"</code>।</li>
        <li>स्क्रीन केवल <code>createCss()</code> से बने इंस्टेंस पर मौजूद हैं। वैश्विक <code>css()</code> में कोई नहीं है, लेकिन यह <code>@media</code> कुंजी स्वीकार करता है।</li>
        <li>सभी उदाहरण और वैश्विक सहायक एक स्टाइलशीट साझा करते हैं। स्क्रीन मीडिया नियम स्क्रीन घोषित होने के क्रम में आउटपुट होते हैं, न कि उस क्रम में जिस क्रम में आप उनका उपयोग करते हैं, इसलिए <code>min-width</code> स्क्रीन को छोटे से बड़े तक सूचीबद्ध करें। प्रति ऐप एक <code>createCss()</code> इंस्टेंस का उपयोग करें, ताकि वह ऑर्डर आपकी थीम में से एक हो।</li>
        <li><code>theme</code> वह विषय है जिसे आपने उत्तीर्ण किया है।</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>एक फ़ंक्शन बनाता है जो विकल्पों के एक सेट के लिए एक शैली लौटाता है, जैसे कि बटन का इरादा और आकार।</p>
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
        <li>शैलियाँ इस क्रम में विलीन हो जाती हैं: <code>base</code>, प्रत्येक समूह का चुना हुआ मान, फिर प्रत्येक मिलान यौगिक। बाद की शैलियाँ प्रति संपत्ति जीतती हैं।</li>
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
      <p><code>keyframes()</code> एक एनीमेशन पंजीकृत करता है और उसका उत्पन्न नाम लौटाता है। फ़्रेम कुंजियाँ <code>from</code>, <code>to</code> और प्रतिशत हैं, जैसे <code>"50%"</code> या <code>"0%, 100%"</code>। फ़्रेम केवल समतल गुण लेते हैं. समान फ़्रेम समान नाम लौटाते हैं.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> किसी भी चयनकर्ता के लिए एक नियम जोड़ता है:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>चयनकर्ता का उपयोग बिल्कुल वैसे ही किया गया है जैसा लिखा गया है।</li>
        <li>केवल फ्लैट संपत्तियां ही काम करती हैं। छद्म कुंजियाँ, स्क्रीन और <code>@</code> कुंजियाँ नजरअंदाज कर दी जाती हैं, इसलिए <code>globalStyle()</code> मीडिया नियम नहीं लिख सकता।</li>
        <li>एक ही नियम एक बार जोड़ा जाता है। एक ही चयनकर्ता के लिए एक अलग शैली दूसरा नियम जोड़ती है, और बाद वाला जीतता है।</li>
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
        <li>यह एक पेज या अनुरोध को नहीं बल्कि पूरी प्रक्रिया को कवर करता है, और यह केवल बढ़ता है। यह सुरक्षित है, क्योंकि वर्ग के नाम सामग्री हैश हैं।</li>
        <li>इसे <code>&lt;style id="nuclo-styles"&gt;</code> में डालें। क्लाइंट उस तत्व का पुन: उपयोग करता है और उसमें पहले से मौजूद नियमों को छोड़ देता है। किसी अन्य आईडी के साथ, या किसी भी आईडी के साथ, क्लाइंट प्रत्येक नियम के साथ फिर से एक दूसरी स्टाइलशीट जोड़ता है।</li>
        <li>टेक्स्ट बच नहीं पाया है, इसलिए शैली मानों में कभी भी अविश्वसनीय इनपुट न डालें।</li>
      </ul>
      <p><code>resetStyles()</code> एक परीक्षण सहायक है। यह प्रत्येक नियम और <code>#nuclo-styles</code> तत्व को हटा देता है। आपके द्वारा पहले बनाई गई शैलियाँ अपने वर्ग के नाम तो रखती हैं लेकिन अपना CSS खो देती हैं। इसे किसी ऐप या सर्वर पर कॉल न करें.</p>
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
      <div class="docs-callout"><strong>अलग पैकेज: </strong> <code>nuclo-router</code> Nuclo कोर पैकेज का हिस्सा नहीं है। इसे <code>nuclo</code> के बगल में स्थापित करें। यह एक पूर्वावलोकन रिलीज़ है, इसलिए इसका API अभी भी बदल सकता है।</div>
      <p>Nuclo के लिए रूटिंग: सर्वर रेंडरिंग, हाइड्रेशन, कोड-स्प्लिट रूट और निष्क्रिय प्रीलोडिंग, <code>list()</code> और <code>update()</code> पर निर्मित। ${NUCLO_ROUTER_GZIP_KB} KB के बारे में gzipped, Nuclo से परे कोई निर्भरता नहीं है और कोई साइड इफेक्ट नहीं है, इसलिए अप्रयुक्त होने पर यह ट्री से हिल जाता है।</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>या समान दो नामों के साथ <code>pnpm add</code>, <code>yarn add</code> या <code>bun add</code> का उपयोग करें। इसे सहकर्मी निर्भरता के रूप में <code>nuclo</code> 0.3 या बाद के संस्करण की आवश्यकता है।</p>
      <p>राउटर <em>what</em> को लोड करने का निर्णय लेता है। ऐप कहता है <em>where</em> <code>router.outlet()</code> के साथ: परत स्टैक पर एक <code>list()</code>, प्रति परत एक पंक्ति, इसलिए एक साधारण पृष्ठ एक पंक्ति है। सर्वर और क्लाइंट एक ही ट्री बनाते हैं, इसलिए <code>hydrate()</code> सर्वर के नोड्स को बदलने के बजाय उन पर दावा करता है। बाकी सब कुछ <code>history</code> है, एक प्रत्यायोजित <code>click</code> श्रोता और <code>requestIdleCallback</code> है।</p>
      <h3>एक आयात</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> मिलान रूट के मॉड्यूल को वापस लौटने से पहले हल करता है, इसलिए पहला ट्री सर्वर और क्लाइंट दोनों पर पूरा हो जाता है। उसके बाद राउटर उस रूट को पढ़ता है जो उसने शुरू किया था: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>।</p>
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
      <p>यह संपूर्ण एकीकरण है। लिंक काम करते हैं क्योंकि <code>&lt;a href&gt;</code> सिर्फ एक <code>&lt;a href&gt;</code> है। <code>document</code> पर एक प्रत्यायोजित श्रोता राउटर के स्वामित्व वाले लिंक को रोकता है और ब्राउज़र पर हर दूसरे लिंक को छोड़ देता है।</p>
      <p>सर्वर पर, <code>start()</code> प्रति अनुरोध एक <code>Route</code> लौटाता है और राउटर को अकेला छोड़ देता है, इसलिए समवर्ती अनुरोध एक दूसरे का मार्ग नहीं देख सकते हैं। <code>route.run()</code> उस रूट को बनाता है जो राउटर, और इसलिए आउटलेट, रेंडर की लंबाई के लिए पढ़ता है। ब्राउज़र में प्रति पेज लोड एक रूट होता है, और <code>start()</code> इसे राउटर का अपना बनाता है। कोई <code>run()</code> की आवश्यकता नहीं है.</p>
      <p>एक पृष्ठ को इसका <a href="#router-api"><code>RouteContext</code></a> और इसका <a href="#router-api"><code>PageProps</code></a>, <code>(ctx, { layer, data, outlet, beforeLeave })</code> के रूप में प्राप्त होता है, और कम तर्क ले सकता है। यह <code>list()</code> द्वारा स्वीकार की गई कोई भी चीज़ लौटाता है। लेआउट के अन्य भाग को भी भरने के लिए, पृष्ठ के अंदर से एक <code>into()</code> लौटाएँ, जैसे <code>div(article(…), into('sidebar', nav(…)))</code>। वह सामग्री पृष्ठ के साथ चली जाती है। <a href="#router-regions">Pages &amp; क्षेत्र</a> देखें।</p>
    `,
      },
      {
        id: "router-patterns",
        title: "पैटर्न और नेस्टेड रूट",
        content: `
      <table>
        <thead><tr><th>नमूना</th><th>माचिस</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>बिल्कुल वही path</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>Zकुछ भी बेजोड़, आपका 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>प्राथमिकता स्थिर है, फिर घोषणा क्रम में गतिशील है, फिर पहले सबसे लंबे उपसर्ग के साथ सभी को पकड़ें। तो <code>'*'</code> केवल वही मेल खाता है जो कोई और नहीं करता है और तालिका में कहीं भी बैठ सकता है। ट्रेलिंग स्लैश, डुप्लिकेट स्लैश और प्रतिशत-एन्कोडिंग को सामान्यीकृत किया जाता है, और परम मान डिकोड किए जाते हैं। मिलान प्रति पैटर्न एक खंड तुलना है। कोई रेगेक्स नहीं बनाया या चलाया जाता है।</p>
      <h3>सापेक्ष मार्ग</h3>
      <p><code>./</code> के साथ लिखा गया एक पैटर्न इसे घोषित करने वाले माता-पिता के सापेक्ष है, और <code>./</code> के साथ लिखा गया href सक्रिय मार्ग के सापेक्ष है। वे मिलकर एक पुन: प्रयोज्य अनुभाग बनाते हैं जिसका अर्थ प्रत्येक माता-पिता के लिए समान होता है। किसी तालिका का मान या तो एक लोडर होता है या कोई अन्य तालिका, जिसकी कुंजियाँ उससे संबंधित होती हैं:</p>
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
      <p>वे दो पंक्तियाँ सभी छह पैटर्न उत्पन्न करती हैं जिनमें कोई पथ दो बार नहीं लिखा होता है। माता-पिता दोनों को समान लोडर ऑब्जेक्ट मिलते हैं, इसलिए वे एक मॉड्यूल कैश और एक <code>import()</code> साझा करते हैं।</p>
      <ul>
        <li>एक चाइल्ड टेबल के अंदर, <code>'./x'</code>, <code>'/x'</code> और <code>'x'</code> सभी का मतलब एक ही है, <code>'/'</code> का मतलब मूल पथ ही है, और <code>'*rest'</code> अनुभाग को अपना स्वयं का कैच-ऑल देता है। घोंसला बनाना आप जितना चाहें उतना गहरा हो जाता है।</li>
        <li>शीर्ष-स्तरीय कुंजियों का उपयोग लिखित रूप में किया जाता है, इसलिए <code>'*'</code> <code>'*'</code> रहता है।</li>
        <li><code>*catch-all</code> माता-पिता के अंतर्गत एक बच्चा एक <code>createRouter()</code> त्रुटि है, क्योंकि कैच-ऑल को अपना पैटर्न समाप्त करना होता है।</li>
      </ul>
      <h3>मूल पृष्ठ और <code>outlet()</code></h3>
      <p>एक माता-पिता और उसके चाइल्ड नोड एक वास्तविक पदानुक्रम हैं। पेरेंट रेंडर करता है, और उसका बच्चा इसके अंदर रेंडर करता है, जहां भी वह <code>outlet()</code> कहता है:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>चाइल्ड नोड के बीच नेविगेट करने से माता-पिता का पुनर्निर्माण नहीं होता है। इसका DOM नोड एक ही नोड है, इसलिए इसका फोकस, इसकी स्क्रॉल स्थिति, इसका आधा टाइप किया गया इनपुट और इसके बंद होने की कोई भी स्थिति सभी जीवित रहती है।</p>
      <ul>
        <li>बिना किसी चाइल्ड रूट वाला पेज अपने आउटलेट से कुछ भी प्रस्तुत नहीं करता है, इसलिए एक लेआउट इसे बिना शर्त कॉल कर सकता है। एक माता-पिता जिसके पास एक बच्चा है और वह कभी भी <code>outlet()</code> को नहीं बुलाता है, वह उसे निगल जाता है।</li>
        <li>कोई सूचकांक मार्ग नहीं हैं। <code>'/'</code> स्वयं लेआउट है, इसलिए मूल पथ लेआउट को उसके अंदर एक अलग इंडेक्स पेज के बजाय एक खाली आउटलेट के साथ प्रस्तुत करता है। लैंडिंग सामग्री को लेआउट में रखें, या इसे वास्तविक चाइल्ड पथ दें।</li>
      </ul>
      <p>फिर वही कॉल माता-पिता में से किसी एक से और एक ऐसे पेज से काम करती है जो यह नहीं जानता कि यह किसमें है:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> और <code>..</code> वर्तमान रूट के पथ के विरुद्ध समाधान करते हैं, URL की "निर्देशिका" के विरुद्ध नहीं। <code>/invoices/42</code> से, <code>./preview</code> <code>/invoices/42/preview</code> है, जहां एक ब्राउज़र ने <code>/invoices/preview</code> कहा होगा, और URL पर एक पिछला स्लैश कुछ भी नहीं बदलता है। <code>../</code> एक खंड तक चलता है और मूल पर रुकता है। क्वेरी और हैश को आगे बढ़ाया जाता है, <code>base</code> को फिर से जोड़ा जाता है, और हल किया गया निरपेक्ष पथ इतिहास में चला जाता है। यह URL रिज़ॉल्यूशन से वही विचलन है जो रिएक्ट राउटर <code>&lt;Link to="./x"&gt;</code> के लिए करता है।</p>
      <ul>
        <li>केवल <code>./</code> और <code>../</code> मार्ग-सापेक्ष हैं। एक href में एक नंगे <code>preview</code> को सामान्य ब्राउज़र नियमों के लिए छोड़ दिया गया है।</li>
        <li>हाथ से <code>href="./preview"</code> लिखने के बजाय <code>router.href('./preview')</code> के साथ सापेक्ष लिंक बनाएं। <code>href()</code> रेंडर समय पर हल हो जाता है, इसलिए जो मार्कअप भेजा जाता है वह क्रॉलर के लिए, मध्य-क्लिक के लिए और JavaScript अक्षम होने पर भी पूर्ण और सही होता है।</li>
      </ul>
      <h3>क्या रखा है, और क्या बनाया गया है</h3>
      <table>
        <thead><tr><th>नोड</th><th>नेविगेशन पर</th></tr></thead>
        <tbody>
          <tr><td>a पैरेंट जिसका पैटर्न और पथ अपरिवर्तित है</td><td><strong>kept</strong>: वही नोड, और इसका <code>load()</code> नहीं है </td></tr> को पुनः चलाएँ
          <tr><td> मिलान किया गया पृष्ठ</td><td><strong>kept</strong> जब इसका पैटर्न और पथ अपरिवर्तित होता है और इसमें कोई <code>load()</code> नहीं होता है, तो एक क्वेरी या हैश परिवर्तन इसे रखता है। प्रत्येक विज़िट पर लोडर वाला मार्ग ताज़ा हो जाता है।</td></tr>
          <tr><td>एक अभिभावक जिसका मार्ग बदल गया</td><td>, इसके तहत सब कुछ के साथ, फिर से बनाया गया</td></tr>
          <tr><td>a पुश लेयर</td><td> अकेले मिलान किए गए पृष्ठ को प्रस्तुत करता है। इसके माता-पिता पहले से ही इसके नीचे की पंक्ति में आरूढ़ हैं।</td></tr>
        </tbody>
      </table>
      <p>एक रखा हुआ पेज उस <code>ctx</code> को रखता है जिसके साथ इसे बनाया गया था। हर जगह <code>ctx</code> का यही अर्थ है: जीवंत मूल्यों के लिए <code>router.*</code> पढ़ें। क्वेरी-संचालित स्थिति, जैसे फ़िल्टर, पेजिनेशन और टैब, एक गतिशील मान के अंदर <code>router.search</code> को पढ़ता है और <code>router.go('?page=2', { replace: true })</code> के साथ लिखता है। पेज, उसका फोकस और उसका आधा-टाइप इनपुट यथावत रहता है।</p>
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
      <p>पृष्ठ की सामग्री आउटलेट के <code>list()</code> की एक पंक्ति है, और एक <code>into()</code> तब तक जीवित रहता है जब तक वह पंक्ति इसे धारण करती है। तो साइडबार सामग्री पृष्ठ के साथ आती है और उसके साथ चली जाती है: <code>into('sidebar', …)</code> के बिना किसी पृष्ठ पर नेविगेट करने से क्षेत्र की <code>empty</code> सामग्री फिर से दिखाई देती है। पेज दोनों भागों के लिए अपने <code>ctx</code> और <code>data</code> का उपयोग कर सकता है, क्योंकि दोनों एक ही फ़ंक्शन द्वारा बनाए गए हैं।</p>
      <h3>नेविगेशन पर क्या होता है</h3>
      <ul>
        <li><strong>A रखा गया पेज अपने क्षेत्रों को रखता है। </strong> एक क्वेरी या हैश परिवर्तन जो <a href="#router-patterns"> पेज को रखता है</a> क्षेत्र की सामग्री को भी नहीं छूता है। यदि साइडबार इस पर निर्भर करता है तो डायनामिक मान के अंदर <code>router.search</code> पढ़ें।</li>
        <li><strong>A पुनर्निर्मित पृष्ठ उन्हें पुनः भर देता है। </strong> जब मार्ग बदलता है, तो पुरानी पंक्ति हटा दी जाती है और नए पृष्ठ के <code>into()</code> दृश्य आ जाते हैं। कुछ भी पीछे नहीं छूटा.</li>
        <li><strong>A पुश की गई परत एक दृश्य जोड़ती है। </strong> परत आउटलेट की बाद की पंक्ति है, इसलिए इसका <code>into()</code> उसी क्षेत्र का एक नया दृश्य है। डिफ़ॉल्ट <code>type: 'latest'</code> के साथ यह परत बंद होने तक पृष्ठ के दृश्य को कवर करता है, और फिर पृष्ठ का दृश्य फिर से दिखाई देता है। <code>type: 'stack'</code> के साथ दोनों शो।</li>
        <li><strong>A मूल पृष्ठ क्षेत्रों को भी भर सकता है।</strong> इसके दृश्य तब भी बने रहते हैं जब इसके चाइल्ड नोड बदलते हैं, क्योंकि मूल पृष्ठ का पुनर्निर्माण नहीं किया जाता है।</li>
        <li><strong>सर्वर रेंडरिंग वैसे ही काम करता है जैसे </strong> सर्वर <code>route.run()</code> के अंदर पेज बनाता है, इसलिए इसके <code>into()</code> दृश्य HTML में हैं, और <code>hydrate()</code> उनका दावा करता है।</li>
      </ul>
      <h3>एक पृष्ठ से कई क्षेत्र</h3>
      <p>एक बार में एक से अधिक क्षेत्र भरने के लिए किसी ऑब्जेक्ट को पास करें। पृष्ठ की मुख्य सामग्री अभी भी आउटलेट के माध्यम से जाती है, इसलिए इसे <code>into()</code> के पास लौटा दें:</p>
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
        <li><strong><code>outlet()</code></strong> एक चाइल्ड रूट के लिए है: यूआरएल द्वारा तय की गई सामग्री, उसके मूल पृष्ठ के अंदर प्रस्तुत की गई है। <a href="#router-patterns">नेस्टेड रूट</a> देखें।</li>
        <li><strong><code>into()</code></strong> मिलान किए गए पेज के लिए है जो पूरे लेआउट में फैला हुआ है। सामग्री पृष्ठ से संबंधित है और उसके डेटा का उपयोग करती है।</li>
        <li><strong><code>matches()</code></strong> अकेले यूआरएल से लेआउट तय करने के लिए है, इसकी अपनी छोटी तालिका है और इसमें कोई पेज शामिल नहीं है। <a href="#router-matches"><code>matches()</code></a> देखें।</li>
      </ul>
      <p>ये सभी एक सुमेलित मार्ग से संबंधित हैं। राउटर एक यूआरएल से दो स्वतंत्र क्षेत्रों को नहीं चलाता है, इसलिए अपने स्वयं के मार्गों के साथ एक साइडबार वह क्षेत्र है जिसे एक पृष्ठ भरता है, दूसरा आउटलेट नहीं। एक साइडबार जो वास्तव में अपना स्वयं का राउटर चाहता है, लोडिंग और फ़ॉलबैक को अनस्टार्ट रखता है और <code>match()</code> के साथ हल करता है - <a href="#router-multi">मल्टीपल राउटर्स &amp; कंबाइंड लोडिंग</a> देखें।</p>
    `,
      },
      {
        id: "router-loaders",
        title: "रूट लोडर और कोड विभाजन",
        content: `
      <p>एक पेज मॉड्यूल एक <code>load</code> फ़ंक्शन निर्यात कर सकता है। यह पेज बनने से पहले, उस रूट के हर नेविगेशन पर चलता है, और जो कुछ भी लौटाता है उसे <code>data</code> के रूप में पेज पर भेज दिया जाता है:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>रूट तालिका अपरिवर्तित है। लोडर पेज के साथ यात्रा करता है। इसमें मिलान <code>RouteContext</code> मिलता है, इसलिए <code>params</code>, <code>search</code> और <code>path</code> सभी उपलब्ध हैं। यह सिंक या एसिंक हो सकता है, और यह सर्वर पर भी चलता है, इसलिए सर्वर-रेंडर पेज हाइड्रेशन के बाद लाने के बजाय पहले से ही HTML में अपना डेटा भेजता है।</p>
      <p><strong> मॉड्यूल कैश्ड है। डेटा नहीं है.</strong> एक रूट का हिस्सा एक बार लाया जाता है और पुन: उपयोग किया जाता है, और इसका लोडर हर नेविगेशन पर फिर से चलता है। यही कारण है कि <code>/blog/a</code> और <code>/blog/b</code> को भ्रमित नहीं किया जा सकता है, और एक असफल लोडर को आसानी से पुनः प्रयास किया जा सकता है।</p>
      <table>
        <thead><tr><th>स्थिति</th><th>व्यवहार</th></tr></thead>
        <tbody>
          <tr><td> चलता है</td><td><code>router.pending</code> सच है और जिस पेज पर आप थे वह चालू रहता है</td></tr>
          <tr><td>it </td><td> को <code>router.error</code> पर फेंकता या अस्वीकार करता है। <code>go()</code> अभी भी कभी भी अस्वीकार नहीं करता है, और नेविगेशन का पुनः प्रयास किया जा सकता है।</td></tr>
          <tr><td><code>start()</code></td><td> के दौरान अस्वीकृति <code>start()</code> से आती है। इसे लगाने के लिए अभी तक कोई रूट नहीं है.</td></tr>
          <tr><td>a पुश लेयर</td><td> अपने स्वयं के डेटा के साथ अपना स्वयं का लोडर चलाता है</td></tr>
          <tr><td>केवल निष्क्रिय प्रीलोडर</td><td>वार्म्स मॉड्यूल। इसमें पारित करने के लिए कोई संदर्भ नहीं है, और यह उस मार्ग के लिए डेटा लाएगा जिसे आप कभी नहीं खोल सकते।</td></tr>
          <tr><td> उसी URL</td><td> पर पुनः नेविगेट करने पर लोडर फिर से चलता है और पंक्ति फिर से बन जाती है। लोडर के बिना एक मार्ग अपनी पंक्ति रखता है।</td></tr>
        </tbody>
      </table>
      <p>पुनः सत्यापित करने के लिए, इतिहास प्रविष्टि जोड़े बिना उस स्थान पर नेविगेट करें जहां आप पहले से हैं:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>खंड के साथ डेटा प्रारंभ करना</h3>
      <p>पेज मॉड्यूल द्वारा निर्यात किया गया <code>load</code> केवल उस मॉड्यूल के आने के बाद ही चल सकता है, इसलिए एक ठंडा नेविगेशन खंड, फिर डेटा प्राप्त करता है। दोनों को एक साथ शुरू करने के लिए, लोडर को <code>withLoad()</code> के साथ तालिका में घोषित करें:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>यह मॉड्यूल के अपने <code>load</code> को प्रतिस्थापित करता है और हर विजिट पर इसी तरह चलता है। एक अस्वीकृति जबकि हिस्सा अभी भी किसी अन्य की तरह <code>router.error</code> पर लैंड लोड कर रहा है।</p>
      <p>डिज़ाइन के अनुसार, HTML में सर्वर डेटा का कोई क्रमांकन नहीं है। क्लाइंट का <code>load</code> फिर से हाइड्रेशन पर चलता है। यदि यह मायने रखता है, तो सर्वर को <code>route.data</code> उत्सर्जित करने दें, उदाहरण के लिए <code>window.__DATA__</code> के रूप में, और लोडर इसे पहले ले। <code>route.data</code> केवल मिलान किए गए पृष्ठ का डेटा है। माता-पिता का <code>load()</code> परिणाम इस पर नहीं है।</p>
      <h3>कोड विभाजन और प्रीलोडिंग</h3>
      <p>एक रूट का मान हमेशा एक फ़ंक्शन होता है जो पृष्ठ घटक लौटाता है, इसलिए घटक तक आलसी तरीके से पहुंचा जाता है:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>केवल मॉड्यूल-आकार वाले फॉर्म ही <code>load</code> निर्यात कर सकते हैं। <code>.then(m =&gt; m.BPage)</code> के साथ नामित घटक को चुनने से राउटर को अकेले ही फ़ंक्शन सौंप दिया जाता है।</p>
      <p>प्रत्येक मॉड्यूल को एक बार आयात किया जाता है और कैश किया जाता है। एक ही मार्ग पर समवर्ती नेविगेशन एक <code>import()</code> साझा करते हैं। एक बार जब उपयोगकर्ता ने पृष्ठ को <code>idleTimeout</code> (डिफ़ॉल्ट रूप से एक सेकंड; कोई टैप, कुंजी, पहिया या स्क्रॉल नहीं) के लिए अकेला छोड़ दिया है, तो शेष मार्ग पृष्ठभूमि में लोड हो जाते हैं, प्रति निष्क्रिय स्लाइस (<code>requestIdleCallback</code>)। उपयोगकर्ता जिस भी इनपुट, या नेविगेशन की प्रतीक्षा कर रहा है, उसे तब तक रोक देता है जब तक कि पृष्ठ फिर से निष्क्रिय न हो जाए।</p>
      <p>एक प्रीलोडेड या उत्सुक मार्ग कभी भी <code>router.pending</code> को फ्लिप नहीं करता है और अगले पेंट से पहले लैंड करता है: कोई स्पिनर फ्रेम नहीं, कोई लेआउट शिफ्ट नहीं। <code>router.pending</code> केवल एक मॉड्यूल या लोडर के लिए सही है जिसके लिए इंतजार करना पड़ता है, और आउटगोइंग पेज तब भी स्क्रीन पर रहता है। एक टुकड़ा जो सतहों को <code>router.error</code> के रूप में लोड करने में विफल रहता है, कभी भी एक अनचाहे अस्वीकृति के रूप में नहीं, और बस पुनः प्रयास किया जा सकता है।</p>
    `,
      },
      {
        id: "router-api",
        title: "राउटर API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> एक पैटर्न को लोडर, या नेस्टेड टेबल पर मैप करता है। विकल्प:</p>
      <table>
        <thead><tr><th>विकल्प</th><th>गलती करना</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL उपसर्ग के तहत ऐप परोसा जाता है, जैसे <code>'/docs'</code>। यह केवल खंड सीमा पर मेल खाता है: <code>/docs/intro</code> <code>'/docs'</code> के अंदर है, <code>/docsearch</code> नहीं है। इसके बाहर के यूआरएल किसी भी तरह से मेल नहीं खाते हैं, इसलिए <code>start()</code> अस्वीकार कर देता है (आपका सर्वर-साइड 404) और उनके लिंक ब्राउज़र पर छोड़ दिए जाते हैं।</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>पृष्ठ निष्क्रिय होने पर शेष मार्गों के मॉड्यूल को पृष्ठभूमि में लोड करें। <code>false</code> इसे बंद कर देता है.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>मिलीसेकंड प्रीलोडिंग शुरू होने से पहले, या उपयोगकर्ता के शुरू होने के बाद फिर से शुरू होता है व्यस्त.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, ब्राउज़र में प्रत्येक हल किए गए नेविगेशन के बाद कॉल किया जाता है, जिसमें शुरुआती नेविगेशन भी शामिल है, एक बार DOM पकड़ लिया है. <code>kind</code> <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (पीछे, आगे, <code>close()</code>) या <code>'layer'</code> है। <code>document.title</code>, मेटा टैग, फोकस, स्क्रॉलिंग और एनालिटिक्स के लिए हुक। SSR.</td></tr> के दौरान कभी कॉल नहीं किया गया
        </tbody>
      </table>
      <p>राउटर लौटाता है: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, और <code>run()</code> को छोड़कर प्रत्येक <code>Route</code> सदस्य, सक्रिय रूट को पढ़ता है। वह वह है जो ब्राउज़र में लौटाया गया अंतिम <code>start()</code> है, या वह जिसका <code>run()</code> सर्वर पर निष्पादित हो रहा है। किसी भी थ्रो के साथ एक सदस्य को पढ़ना। रूट तालिका, संकलित मिलानकर्ता और मॉड्यूल कैश राउटर पर रहते हैं, इसलिए उन्हें सर्वर पर अनुरोधों के बीच साझा किया जाता है।</p>
      <h3><code>router.start(url?)</code></h3>
      <p>अपने पेज मॉड्यूल में <code>url</code> (ब्राउज़र में डिफ़ॉल्ट: <code>location.href</code>) को हल करता है और एक <code>Promise&lt;Route&gt;</code> लौटाता है। जब कुछ भी मेल नहीं खाता और तालिका में कोई <code>'*'</code> रूट नहीं है तो अस्वीकार कर देता है। एक सर्वर पर, वह आपका 404 है। ब्राउज़र में यह रूटर को सक्रिय बनाता है, <code>popstate</code> और प्रत्यायोजित <code>click</code> श्रोताओं को जोड़ता है और प्रीलोडिंग शेड्यूल करता है। दूसरा <code>start()</code> आपके लिए पिछले रूट को समाप्त कर देता है। सर्वर पर यह साझा की गई किसी भी चीज़ को नहीं छूता है, इसलिए <code>route.run()</code> के अंदर प्रस्तुत करें।</p>
      <h3><code>router.match(url?)</code></h3>
      <p>कुछ भी लोड किए बिना तालिका के विरुद्ध एक यूआरएल का समाधान करता है: कोई आयात नहीं, कोई इतिहास नहीं, कोई श्रोता नहीं, कोई रूट नहीं। जब URL <code>base</code> के बाहर हो, किसी पैटर्न से मेल न खाता हो या ब्राउज़र में किसी अन्य मूल पर हो, तो <code>RouteContext</code>, या <code>null</code> लौटाता है। केवल पूर्ण URL, क्योंकि <code>./</code> रिज़ॉल्यूशन के लिए एक सक्रिय रूट की आवश्यकता होती है।</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>सक्रिय मार्ग के पृष्ठ <code>list()</code> के रूप में। जहाँ भी पन्ने जाते हैं, इसे एक बार रखें। एक धकेली गई परत इसकी एक बाद की पंक्ति है। यह <code>start()</code> के समाधान से पहले और <code>stop()</code> के बाद खाली है। सर्वर पर यह उस रूट को प्रस्तुत करता है जिसका <code>run()</code> निष्पादित हो रहा है।</p>
      <h3><code>router.matches(table)</code></h3>
      <p>एक दूसरी तालिका का दृश्य प्रस्तुत करता है जो सक्रिय मार्ग के पथ से मेल खाता है, <code>list()</code> के रूप में आप इसे कहीं भी रख सकते हैं। <a href="#router-matches"><code>matches()</code></a> देखें।</p>
      <h3><code>Route</code></h3>
      <p><code>run()</code> को छोड़कर प्रत्येक सदस्य राउटर पर भी है, जहां एक ऐप इसे पढ़ता है।</p>
      <table>
        <thead><tr><th>सदस्य</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>सक्रिय मैच.<code>search</code>एक है<code>URLSearchParams</code>. <code>search</code>, <code>hash</code>और<code>url</code>लाइव हैं.</td></tr>
          <tr><td><code>pending</code></td><td>a नेविगेशन एक मॉड्यूल या लोडर की प्रतीक्षा कर रहा है</td></tr>
          <tr><td><code>error</code></td><td>अंतिम विफल लोड, अगले नेविगेशन द्वारा साफ़ किया गया</td></tr>
          <tr><td><code>data</code></td><td> मिलान किए गए पृष्ठ का <code>load()</code> क्या लौटा, सर्वर को क्रमबद्ध करने के लिए। इस पर माता-पिता का नाम नहीं है.</td></tr>
          <tr><td><code>depth</code></td><td> स्टैक पर कितनी परतें हैं (एक सामान्य पृष्ठ के लिए 1)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>नेविगेट करें, यदि आवश्यक हो तो मॉड्यूल लोड करें। कभी अस्वीकार नहीं करता: एक मॉड्यूल जो विफल हो जाता है, अस्वीकार करके या फेंककर, <code>error</code>.</td></tr> पर लैंड करता है
          <tr><td><code>push(href)</code></td><td> एक रूट को शीर्ष पर एक नई परत के रूप में खोलें, जिस पर यह बंद होता है उसके साथ हल करें। <code>./</code> स्वीकार करता है। कोई मिलान नहीं होने या विफल मॉड्यूल पर अस्वीकार कर दिया गया।</td></tr>
          <tr><td><code>href(path)</code></td><td> <code>a({ href })</code> के लिए <code>base</code> के साथ एक पथ उपसर्ग करें। सक्रिय मार्ग के विरुद्ध <code>./</code> और <code>../</code> का समाधान करता है।</td></tr>
          <tr><td><code>stop()</code></td><td> प्रत्येक श्रोता को अलग करें, खुली परतों को खारिज करें, आउटलेट खाली करें। नपुंसक। रुका हुआ रूट अभी भी अपने अंतिम मैच के साथ उत्तर देता है, और <code>go()</code> कुछ नहीं करता है।</td></tr>
          <tr><td><code>run(fn)</code></td><td> को राउटर के सक्रिय रूट के रूप में इस रूट के साथ <code>fn</code> पर कॉल करें और इसका परिणाम लौटाएं: सर्वर पर <code>route.run(() =&gt; renderToString(App))</code>। केवल तुल्यकालिक. <code>fn</code> के वापस आने पर रूट सक्रिय होना बंद हो जाता है।</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>एक पृष्ठ का पहला तर्क: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>। यह वह संदर्भ है जिसके साथ पेज बनाया गया था। जीवंत मूल्यों के लिए <code>router.*</code> पढ़ें। वे केवल तभी भिन्न होते हैं जब क्वेरी या हैश पुनर्निर्माण के बिना बदल जाता है।</p>
      <p><code>params</code> डिफ़ॉल्ट रूप से <code>{ [name]: string }</code> है। एक पेज इसे <code>Params</code> के साथ अपने पैटर्न से टाइप कर सकता है, जो <code>'/blog/:slug'</code> को <code>{ slug: string }</code> में और <code>'/files/*rest'</code> को <code>{ rest: string }</code> में बदल देता है:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>एक पेज का दूसरा तर्क। पृष्ठ को जो चाहिए उसे नष्ट करें।</p>
      <table>
        <thead><tr><th>प्रॉप</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>जहां पेज स्टैक में बैठता है। नीचे <code>Layer</code> देखें।</td></tr>
          <tr><td><code>data</code></td><td>रूट का <code>load()</code> क्या लौटा, या <code>undefined</code> बिना किसी के। <code>PageProps&lt;TData&gt;</code>.</td></tr> द्वारा टाइप किया गया
          <tr><td><code>outlet</code></td><td> जहां एक मूल पृष्ठ अपने चाइल्ड रूट को प्रस्तुत करता है। <a href="#router-patterns">नेस्टेड रूट देखें</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td> इस पृष्ठ को खारिज करने से पहले एक गार्ड से पूछा गया पंजीकरण करता है। देखें <a href="#router-layers">गार्ड छोड़ें</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>जहां एक पेज स्टैक में बैठता है, और उसका रास्ता बाहर आता है।</p>
      <table>
        <thead><tr><th>सदस्य</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0, पुश लेयर्स के लिए 1 और ऊपर</td></tr>
          <tr><td><code>push(href)</code></td><td><code>Route.push()</code></td></tr> के समान, एक पृष्ठ के अंदर से एक और परत खोलें
          <tr><td><code>close(result?)</code></td><td>इस परत और इसके ऊपर की सभी चीज़ों को बंद करें, इसे खोलने वाले <code>push()</code> को हल करें। किसी भी तर्क का मतलब खारिज नहीं किया गया. गहराई पर एक नो-ऑप 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> और <code>withLoad()</code></h3>
      <p><code>DataLoader</code> <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code> है, जो एक पेज मॉड्यूल का वैकल्पिक <code>load</code> निर्यात है। <code>withLoad(loader, load)</code> एक मार्ग बनाता है जिसका <code>load</code> उसके हिस्से के आयात के बाद के बजाय उसके बगल से शुरू होता है। <a href="#router-loaders">रूट लोडर</a> देखें।</p>
      <h3>प्रकार</h3>
      <p>प्रत्येक प्रकार <code>nuclo-router</code> का नामित निर्यात है, इसलिए एक पेज, एक लोडर या एक गार्ड को पथ से आयात किए बिना टाइप किया जा सकता है।</p>
      <table>
        <thead><tr><th>टाइप</th><th>यह क्या है</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td> एक पैटर्न के लिए पैरामीटर ऑब्जेक्ट। <code>RouteParams</code> अलिखित आकार है, और <code>Match</code> मिलानकर्ता का परिणाम है।</td></tr>
          <tr><td><code>PageComponent</code></td><td>a पेज: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>a पेज मॉड्यूल: घटक स्वयं, या <code>import()</code> उपज के रूप में <code>{ default, load? }</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, वैकल्पिक रूप से एक ले जाना <code>load</code> से <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td> तालिका <code>createRouter()</code> लेती है: लोडर के लिए पैटर्न, या एक नेस्टेड तालिका </td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, <code>go()</code></td></tr> का दूसरा तर्क
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, <code>onNavigate</code></td></tr> का दूसरा तर्क
          <tr><td><code>Outlet</code></td><td>का प्रकार <code>outlet()</code> से <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, <code>beforeLeave()</code> क्या लेता है</td></tr>
          <tr><td><code>MatchView</code></td><td><code>matches()</code> दृश्य क्या है: किसी पृष्ठ के पैरामीटर, सामग्री या <code>import()</code></td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "लेयर और लीव गार्ड",
        content: `
      <p><code>push()</code> वर्तमान रूट को बदलने के बजाय उसके शीर्ष पर एक रूट खोलता है, और जो भी परत उसके साथ बंद होती है, उसके साथ उसका समाधान हो जाता है। क्योंकि पेज स्टैक के ऊपर एक एकल <code>list()</code> हैं, एक परत खोलना एक परिशिष्ट है। नीचे दिए गए पृष्ठ को दोबारा प्रस्तुत नहीं किया गया है, इसलिए परत बंद होने पर इसका DOM, इसका फोकस और इसका आधा-भरा फॉर्म सभी अभी भी वहीं हैं।</p>
      <p>यह "मुझे एक ऐसे रिकॉर्ड की आवश्यकता है जो अभी तक मौजूद नहीं है" प्रवाह को उस फॉर्म को हटाए बिना काम करता है जिसे उपयोगकर्ता भर रहा था:</p>
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
      <p>परतें घोंसला। एक संवाद जिसे अपने स्वयं के संवाद की आवश्यकता होती है वह <code>layer.push()</code> को कॉल करता है और रूट के संदर्भ के बिना, इसकी प्रतीक्षा करता है।</p>
      <ul>
        <li><strong>URL शीर्ष परत है। </strong> <code>push()</code> एक इतिहास प्रविष्टि जोड़ता है, इसलिए एक परत लिंक करने योग्य है और वापस इसे बंद कर देता है, इसके <code>push()</code> को खारिज कर दिया गया है, बिल्कुल रद्द की तरह। पीछे और <code>close()</code> एक कोड पथ हैं: <code>close()</code> अपना परिणाम रिकॉर्ड करता है और इतिहास को पीछे ले जाता है, और <code>history.state</code> में गहराई प्राधिकरण है। ब्राउज़र लगभग 50 प्रविष्टियों को एक टैब में रखते हैं, इसलिए परतों के माध्यम से लंबे समय तक चलने के बाद नीचे की प्रविष्टि गायब हो सकती है: फिर <code>close()</code> परतों को जगह में बंद कर देता है और वर्तमान प्रविष्टि को दिखाए जाने वाले पृष्ठ पर फिर से लिखता है।</li>
        <li><strong>एक साधारण नेविगेशन स्टैक को साफ़ करता है।</strong> एक लिंक क्लिक या <code>go()</code> एक परत नहीं है। यह सब कुछ बदल देता है और हर खुली परत को खारिज कर देता है, इसलिए किसी भी कॉल करने वाले को इंतजार नहीं करना पड़ता है।</li>
        <li><strong>A कोल्ड लोड एक स्टैंडअलोन पेज है। </strong> URL शीर्ष परत का नाम देता है, लेकिन उसके नीचे के स्टैक का नहीं, इसलिए एक परत का URL खोलने पर यह सीधे <code>layer.depth === 0</code> और एक निष्क्रिय <code>close()</code> के साथ गहराई 1 पर प्रस्तुत होता है। एक धकेले गए मार्ग को अपने आप में अर्थपूर्ण होना चाहिए। रद्द करें बटन के स्थान पर लिंक आउट की पेशकश करने के लिए <code>layer.depth</code> पर शाखा करें।</li>
        <li><strong>वादा पुनः लोड</strong> तक नहीं टिक सकता, क्योंकि यह एक समापन स्थिति में रहता है। परिणाम को प्रवाह के माध्यम से एक शॉर्टकट के रूप में मानें जो लंबे समय तक भी काम करता है।</li>
        <li><strong> प्रतीक्षा में कुछ भी नहीं बचा है। </strong> <code>stop()</code> प्रत्येक खुली परत को खारिज कर देता है, और नेविगेशन द्वारा छोड़ी गई परत <code>undefined</code> के साथ हल हो जाती है।</li>
      </ul>
      <h3>गार्ड छोड़ें</h3>
      <p>एक पृष्ठ जिसमें रखने योग्य कुछ चीज़ होती है, जैसे कि आधा भरा हुआ फॉर्म, एक गार्ड को पंजीकृत करता है। पृष्ठ को त्यागने से पहले यह पूछा जाता है, और <code>false</code> (या इसका वादा) लौटाने से पृष्ठ बना रहता है:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>केवल जब पेज जाता है।</strong> लेआउट के तहत एक चाइल्ड नेविगेशन, या एक क्वेरी या हैश परिवर्तन जो पेज रखता है, नहीं पूछता है। एक गार्ड अपने पेज के साथ जीता और मरता है, इसलिए अपंजीकृत करने जैसा कुछ भी नहीं है।</li>
        <li><strong>हर तरह से बाहर।</strong> एक लिंक, <code>go()</code>, पीछे और आगे, एक परत का <code>close()</code>, और <code>go()</code> एक यूआरएल पर जो राउटर के पास नहीं है (ऐप को छोड़कर, जहां <code>to</code> <code>null</code> है)। अस्वीकृत बैक या फ़ॉरवर्ड को वापस चला दिया जाता है, इसलिए पता बार पृष्ठ पर बना रहता है। टैब बंद करना या पुनः लोड करना <code>beforeunload</code> का काम है।</li>
        <li><strong><code>to</code></strong> वह <code>RouteContext</code> है जिस पर नेविगेशन जा रहा है। गार्ड सबसे पहले अंतरतम दौड़ते हैं और पहले इनकार पर रुक जाते हैं। जो फेंकता है वह पृष्ठ रखता है। <code>close(result)</code> गार्ड से भी गुजरता है, इसलिए परिणाम के साथ बंद करने से पहले अपना ध्वज साफ़ करें।</li>
        <li>राउटर केवल अपने द्वारा लिखी गई इतिहास प्रविष्टियों को वापस चला सकता है। जिस पर बैक या फॉरवर्ड नहीं किया गया, जैसे कि मूल <code>#fragment</code> लिंक या किसी अन्य स्क्रिप्ट का <code>pushState</code>, नहीं पूछा जाता है।</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() और सब-राउटर",
        content: `
      <p><code>router.outlet()</code> पृष्ठ प्रस्तुत करता है। <code>router.matches(table)</code> कुछ और प्रस्तुत करता है जो इस पर निर्भर करता है कि आप कहां हैं, जैसे साइडबार, ब्रेडक्रंब या टूलबार, अपनी छोटी तालिका से, बिना रूट लोड किए या पेज जोड़े:</p>
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
        <li><strong>रूट तालिका के समान मिलान।</strong> पैटर्न, प्राथमिकता, कच्चे-पथ मिलान और <code>base</code> स्ट्रिपिंग राउटर के स्वयं के हैं, इसलिए एक दृश्य और एक पृष्ठ हमेशा यूआरएल के बारे में सहमत होते हैं। यह <code>router.path</code> की तरह शीर्ष परत का पथ पढ़ता है।</li>
        <li><strong>A view</strong> <code>(params, ctx) =&gt; content</code> है, जहां <code>params</code> इसके पैटर्न से टाइप किया गया है और <code>ctx</code> व्यू के <code>pattern</code> और <code>params</code> के साथ <code>RouteContext</code> है। इसके बजाय यह पेज मॉड्यूल का <code>import()</code> लौटा सकता है, जिसे लैंड करने के बाद <code>ctx</code> के साथ कॉल किया जाता है।</li>
        <li><strong>कुछ भी मेल नहीं खाता, कुछ भी प्रस्तुत नहीं करता।</strong> फ़ॉलबैक के लिए एक <code>'*'</code> दृश्य जोड़ें। यह आउटलेट की तरह <code>start()</code> से पहले और <code>stop()</code> के बाद खाली है।</li>
        <li><strong>यह केवल तभी पुन: प्रस्तुत होता है जब मार्ग बदलता है</strong>, इसलिए एक दृश्य पृष्ठ को रखने वाली किसी भी चीज़ पर अपना DOM रखता है।</li>
        <li><strong>A आलसी दृश्य अपने मॉड्यूल आने तक कुछ भी प्रस्तुत नहीं करता है। </strong> एक विफल <code>import()</code> को <code>console.error</code> के साथ लॉग किया गया है, <code>router.error</code> सेट नहीं करता है, और अगले नेविगेशन पर पुनः प्रयास किया जाता है। एक साधारण <code>update()</code> पुनः प्रयास नहीं करता है।</li>
        <li><strong> सर्वर</strong> पर एक आलसी दृश्य कुछ भी नहीं भेजता है, क्योंकि इसका मॉड्यूल क्लाइंट पर लैंड करता है। पहले HTML में शामिल होने वाली किसी भी चीज़ के लिए एक समकालिक दृश्य का उपयोग करें।</li>
      </ul>
      <h3>सब-राउटर</h3>
      <p>रूट्स नेस्ट, इसलिए एक सब-राउटर आमतौर पर सिर्फ एक नेस्टेड टेबल होता है। एक राउटर: सेक्शन का अपना <code>'/'</code> पेज इसका क्रोम है, और इसके चाइल्ड नोड उस पेज के <code>outlet()</code> में रेंडर करते हैं, इसलिए क्रोम सेक्शन के भीतर नेविगेशन से बच जाता है:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>या फीचर को अपना स्वयं का राउटर दें, बनाया गया लेकिन कभी शुरू नहीं हुआ। माता-पिता के पास एकल कैच-ऑल प्रविष्टि होती है और बच्चा अपने स्वयं के पैटर्न, पैरामीटर और फ़ॉलबैक के अनुसार पूंछ का समाधान करता है:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>इसे कभी शुरू न करना ही मुद्दा है। <code>start()</code> वह है जो श्रोताओं को जोड़ता है, और दो शुरू किए गए राउटर संघर्ष करते हैं। व्यापार यह है कि चाइल्ड नोड के पास रिज़ॉल्यूशन होता है, इसलिए रूट लोडर, जो एक स्टार्टर राउटर चलाता है, आपको कॉल करना है। यह आकार पूंछ बदलने पर शेल का पुनर्निर्माण भी करता है, क्योंकि राउटर एक मार्ग देखता है और शेल बाकी को स्वयं ही हल कर लेता है। नेस्टेड टेबल वह है जो आपको माता-पिता बनाती है, राउटर माउंटेड रहता है, इसलिए इसे तब तक प्राथमिकता दें जब तक कि फीचर को वास्तव में अपने राउटर, बेस और फ़ॉलबैक की आवश्यकता न हो।</p>
    `,
      },
      {
        id: "router-multi",
        title: "कई राउटर और संयुक्त लोडिंग",
        content: `
      <p>एक ऐप में उतने ही राउटर हो सकते हैं जितने उसके क्षेत्र हैं। नियम जो इसे सरल रखता है: <strong>प्रति दस्तावेज़ </strong> बिल्कुल एक शुरू करें, और <code>match()</code> के साथ यूआरएल को हल करते हुए, हर दूसरे राउटर को अनस्टार्ट रहने दें। केवल प्रारंभ किया गया राउटर ही यूआरएल, इतिहास और क्लिक श्रोता का स्वामी होता है। बाकी टेबलें हैं जिनके बारे में आप प्रश्न पूछते हैं - और प्रत्येक क्षेत्र अपने स्वयं के स्पिनर के साथ अपनी घड़ी पर लोड कर सकता है।</p>
      <h3>संयुक्त लोडिंग: लोडर की एक श्रृंखला</h3>
      <p>मिलान श्रृंखला का प्रत्येक पृष्ठ निर्यात किया जा सकता है <code>load()</code>. चाइल्ड रूट के ठंडे नेविगेशन पर, लेआउट का लोडर और पेज का लोडर चलता है <strong>समानांतर में</strong>, और एक <code>router.pending</code> पूरी श्रृंखला को कवर करता है: पिछला पृष्ठ जोड़ी के सुलझने तक स्क्रीन पर रहता है, इसलिए आधा भरा हुआ ट्री कभी पेंट नहीं करता। प्रत्येक घटक को अपना स्वयं का प्राप्त होता है <code>data</code>:</p>
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
      <p>दोनों लोडर एक के बाद एक नहीं बल्कि एक साथ शुरू होते हैं। <code>router.pending</code> तब सत्य है जब इनमें से किसी एक का इंतजार किया जा रहा है, और false शेष समय में - एक प्रीलोडेड या उत्सुक मार्ग इसे कभी फ़्लिप नहीं करता है। अनुभागों के बीच जाने से लेआउट बना रहता है, इसलिए केवल अनुभाग का लोडर ही दोबारा चलता है; लेआउट का डेटा, इसका DOM और आधा टाइप किया गया इनपुट सभी जीवित हैं। उसी यूआरएल पर दोबारा नेविगेट करने से लीफ का लोडर फिर से चलता है और उसकी पंक्ति फिर से बन जाती है, बिल्कुल एक पेज की तरह।</p>
      <h3>एकाधिक लोडिंग: अपने स्वयं के स्पिनर के साथ एक दूसरा राउटर</h3>
      <p>एक स्वतंत्र क्षेत्र - एक साइडबार, एक ट्रे, एक लाइव क्षेत्र - को अपना स्वयं का राउटर मिलता है, बनाया गया लेकिन कभी शुरू नहीं हुआ, और इसका अपना लोडिंग फ़्लैग होता है। <code>router.pending</code> प्रारंभ किए गए राउटर से संबंधित है और इस क्षेत्र के बारे में कुछ नहीं कहता है, इसलिए दोनों साथ-साथ लोड हो सकते हैं और कोई भी पहले समाप्त कर सकता है:</p>
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
      <p>दूसरे राउटर के बारे में पूछा गया, लेकिन कभी नहीं बताया गया: <code>match()</code> यूआरएल पढ़ता है और एक संदर्भ देता है, और साइडबार के बारे में कुछ भी मुख्य रूट टेबल में प्रवेश नहीं करता है। <code>onNavigate</code> प्रत्येक हल किए गए नेविगेशन के बाद चलता है, जिसमें प्रारंभिक भी शामिल है, इसलिए यह एक ऐसा स्थान है जो यूआरएल के साथ एक स्वतंत्र क्षेत्र रखता है।</p>
      <ul>
        <li><strong><code>pending</code> प्रारंभ किए गए राउटर से संबंधित है। </strong> एक कभी प्रारंभ न होने वाले राउटर का कोई रूट नहीं है, कोई <code>pending</code> नहीं है और कोई <code>error</code> नहीं है। क्षेत्र अपने स्वयं के फ़्लैग ट्रैक करता है, और दूसरा स्पिनर पहले के बगल में बैठ सकता है। डेमो में साइडबार 800 एमएस के लिए लोड होता है जबकि रूट के लोडर 900 एमएस के लिए चलते हैं, इसलिए पेज साइडबार से पहले या दूसरे तरीके से खत्म हो सकता है।</li>
        <li><strong><code>match()</code> कुछ भी नहीं जोड़ता है। </strong> किसी भी संख्या में अनस्टार्ट राउटर दस्तावेज़ साझा कर सकते हैं; प्रत्येक की अपनी तालिका, आधार और मॉड्यूल कैश है, और उनमें से कोई भी इतिहास को नहीं छूता है। उनकी कीमत एक टेबल और एक मैचर है।</li>
        <li><strong>इसके लोडर कभी नहीं चलते हैं।</strong> प्रारंभ किया गया राउटर उससे मेल खाने वाले पृष्ठों के <code>load()</code> को चलाता है। कभी भी प्रारंभ न किया गया राउटर ही समस्या का समाधान करता है, इसलिए यदि इसके दृश्यों को डेटा की आवश्यकता है, तो इसे स्वयं प्राप्त करें - डेमो का <code>refreshSidebar()</code>। यदि आप लोडर चाहते हैं, तो एक <a href="#router-matches">नेस्टेड टेबल</a> या एक <a href="#router-regions">region एक पेज भरता है</a> उस काम को स्टार्ट किए गए राउटर के साथ रखता है।</li>
        <li><strong>Guard बासी उत्तर.</strong> धीमी साइडबार फ़ेच को उस अनुभाग पर नहीं उतरना चाहिए जहां से आपने नेविगेट किया था। प्रति रिफ्रेश एक जनरेशन काउंटर को टक्कर देता है और उन उत्तरों को छोड़ देता है जो अब मेल नहीं खाते हैं, जिस तरह राउटर खुद ही ओवरटेक किए गए नेविगेशन को रिटायर कर देता है।</li>
        <li><strong>A आलसी <code>matches()</code> दृश्य में कोई <code>pending</code> भी नहीं है। </strong> यह तब तक कुछ भी प्रस्तुत नहीं करता जब तक इसका मॉड्यूल लैंड नहीं हो जाता। तीन लोडिंग सिस्टम, तीन स्वतंत्र घड़ियाँ: मार्ग का <code>pending</code>, आपके अपने फ़्लैग, और एक आलसी दृश्य जो अभी तक वहाँ नहीं है।</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "लिंक संभालना",
        content: `
      <p>प्रत्यायोजित श्रोता एक SVG <code>&lt;a&gt;</code> सहित <code>&lt;a href&gt;</code> पर एक बायाँ-क्लिक नेविगेट करता है और एक के अंदर नेस्टेड किसी भी चीज़ पर क्लिक करता है, और बाकी सभी चीज़ों के लिए अलग हट जाता है: संशोधक-क्लिक और मध्य-क्लिक, <code>_self</code> के अलावा एक <code>target</code>, <code>download</code>, <code>rel="external"</code>, क्रॉस-ओरिजिन hrefs, वर्तमान पृष्ठ पर हैश-केवल लिंक, <code>base</code> के बाहर पथ, कोई रूट मेल नहीं खाने वाले पथ (इसलिए सर्वर-रेंडर 404 अभी भी पहुंच योग्य है), और किसी भी घटना पर ऐप हैंडलर ने पहले से ही <code>preventDefault()</code> पर कॉल किया है। <code>data-nuclo-router="off"</code> के साथ स्पष्ट रूप से एक लिंक ऑप्ट आउट करें।</p>
      <h3>स्क्रॉलिंग</h3>
      <p>एक पुश किया गया नेविगेशन वर्तमान स्क्रॉल स्थिति को सुरक्षित रखता है। जब नए URL में पृष्ठ पर किसी तत्व से मेल खाने वाला <code>#hash</code> होता है, तो वह तत्व दृश्य में स्क्रॉल हो जाता है। <code>popstate</code> ब्राउज़र पर स्क्रॉल करना छोड़ देता है। नए पृष्ठों को शीर्ष पर लाने के लिए, इसे <code>onNavigate</code> में करें, जो बताता है कि नेविगेशन कैसे हुआ:</p>
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
        <li><strong>कुछ भी बरकरार नहीं रखा गया है।</strong> रूट पेज फ़ंक्शन और उसके संदर्भ को रखता है, कभी DOM को नहीं। दूर नेविगेट करने से पिछला पृष्ठ रिलीज़ हो जाता है। <code>stop()</code> श्रोताओं और किसी भी इन-फ़्लाइट लोड को रिलीज़ करता है, और <code>pending</code> को साफ़ करता है, इसलिए एक सेवानिवृत्त रूट कभी भी स्पिनर को परेशान नहीं करता है। एक मॉड्यूल जो <code>stop()</code> के बाद हल हो जाता है चुपचाप हटा दिया जाता है।</li>
        <li><strong>सर्वर पर समवर्ती-सुरक्षित.</strong> <code>start()</code>प्रति-अनुरोध स्थिति लौटाता है और<code>run()</code>इसे एक सिंक्रोनस रेंडर तक सीमित करता है, इसलिए इंटरलीव्ड अनुरोध एक-दूसरे का रूट नहीं देख सकते हैं। केवल मॉड्यूल कैश साझा किया गया है। दायरा ख़त्म हो जाता है जब<code>run()</code>का फ़ंक्शन वापस आ जाता है.<code>renderToString()</code>समकालिक है, इसलिए यह पर्याप्त है। एक एसिंक्स या स्ट्रीमिंग रेंडर के लिए रूट को पार करने की आवश्यकता होगी<code>await</code>एस, जो<code>run()</code>ऐसा नहीं करते।</li>
        <li><strong><code>popstate</code></strong> पर स्क्रॉल पुनर्स्थापन ब्राउज़र का (<code>scrollRestoration</code>) है, राउटर का नहीं।</li>
        <li><strong>प्रति दस्तावेज़ एक राउटर प्रारंभ करें।</strong> प्रत्येक <code>start()</code> अपना स्वयं का प्रतिनिधि <code>click</code> श्रोता जोड़ता है, और दूसरे राउटर का <code>start()</code> पहले को रिटायर नहीं करता है। उसी राउटर पर केवल दूसरा <code>start()</code> काम करता है। किसी अन्य तालिका के विरुद्ध URL को हल करने के लिए, एक राउटर बनाएं और केवल <code>match()</code> पर कॉल करें। यह कुछ भी नहीं जोड़ता है. एक स्वतंत्र क्षेत्र इस तरह मार्ग के <code>pending</code> के बगल में अपनी लोडिंग चला सकता है। <a href="#router-multi">मल्टीपल राउटर्स &amp; कंबाइंड लोडिंग</a> देखें।</li>
        <li><strong> डिज़ाइन द्वारा शामिल नहीं है:</strong> हैश और मेमोरी इतिहास, क्योंकि रूट पथनाम में रहता है और एक सर्वर को हर रूट की सेवा करनी चाहिए; एक यूआरएल द्वारा संचालित दो स्वतंत्र रूप से रूट किए गए क्षेत्र, क्योंकि एक पेज कई क्षेत्रों को <code>into()</code> से भर सकता है, लेकिन वे सभी एक मिलान रूट से संबंधित हैं - एक स्वतंत्र क्षेत्र अभी भी अपना स्वयं का अनस्टार्ट राउटर और लोडिंग रख सकता है, जैसा कि <a href="#router-multi"> मल्टीपल राउटर्स &amp; कंबाइंड लोडिंग</a> में होता है; और होवर प्रीलोडिंग, जो आपको <code>mouseenter</code> से रूट के स्वयं के लोडर को कॉल करके मिलती है।</li>
      </ul>
      <h3>उदाहरण</h3>
      <p>रिपॉजिटरी में दो रन करने योग्य उदाहरण एक दूसरे के पूरक हैं, इसलिए हर सेटिंग कहीं न कहीं देखने योग्य है:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: संपूर्ण API का क्लाइंट-साइड टूर। प्रत्येक पैटर्न फॉर्म और प्राथमिकता नियम, लिंक-हैंडलिंग ऑप्ट-आउट, लाइव नियंत्रण के साथ प्रत्येक रूट सदस्य, एक उप-राउटर, लेयर स्टैक तीन गहरी, दो माता-पिता पर एक सापेक्ष अनुभाग, और <code>pending</code> और <code>error</code> के साथ रूट लोडर। <code>preload: false</code> सेट करता है ताकि वे स्थितियाँ दृश्यमान रहें।</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> प्रति अनुरोध, हाइड्रेशन जो सर्वर के नोड्स, वास्तविक 404 स्थिति कोड, एक गैर-रूट <code>base</code>, निष्क्रिय प्रीलोडिंग का दावा करता है जिसे आप नेटवर्क पैनल में देख सकते हैं, और एक लोडर जिसका डेटा सर्वर से दिया जाता है ग्राहक इसलिए हाइड्रेशन पुनः प्राप्त नहीं करता है।</li>
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
      <p>Nucloकोई गणना नहीं हैAPI. एक साधारण फ़ंक्शन का उपयोग करें, और इसे गतिशील मानों से कॉल करें:</p>
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
      <p>साधारण <code>async</code>/<code>await</code> का उपयोग करें, और हर बार स्थिति बदलने पर <code>update()</code> पर कॉल करें। एक फ़ेच के लिए, इसका मतलब है एक बार <code>await</code> से पहले और एक बार बाद में:</p>
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
        <li><strong>बैच परिवर्तन।</strong> आपको आवश्यक सभी स्थिति बदलें, फिर एक बार <code>update()</code> पर कॉल करें।</li>
        <li><strong> गतिशील मूल्यों को तेज और शुद्ध रखें। </strong> ये सभी प्रत्येक <code>update()</code> पर चलते हैं।</li>
        <li><strong>छोटे, लगातार अपडेट, जैसे टाइपिंग या टाइमर के लिए <code>scope()</code></strong> का उपयोग करें।</li>
        <li><strong> दस्तावेज़ में प्रस्तुत करें। </strong> नोड्स जो दस्तावेज़ में नहीं हैं जब <code>update()</code> चलता है तो अपडेट करना बंद कर देता है।</li>
        <li><strong>उन चाइल्ड नोड के लिए <code>when()</code> और <code>list()</code></strong> का उपयोग करें, न कि कोई फ़ंक्शन जो नोड्स लौटाता है।</li>
        <li><strong><code>className</code> का उपयोग करें, <code>class</code></strong> का नहीं, और गतिशील क्लास के लिए <code>() =&gt; cx(...)</code> या <code>{ className: () =&gt; … }</code> का उपयोग करें।</li>
        <li><strong>मॉड्यूल स्तर पर शैलियों को एक बार परिभाषित करें</strong>।</li>
        <li><strong> सर्वर रेंडरिंग: </strong> पहले रेंडर करें, फिर <code>&lt;style id="nuclo-styles"&gt;</code> में <code>getCssText()</code> डालें। अनुरोध डेटा को तर्क के रूप में पास करें, और आउटपुट में HTML टिप्पणियाँ रखें।</li>
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
        title: "API सूचकांक",
        content: `
      <p>प्रत्येक सार्वजनिक समारोह, और यह कहाँ से आता है।</p>
      <h3><code>nuclo</code> (वैश्विक और नामित निर्यात)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: सभी गतिशील मान, या दिए गए दायरे में चलाएं।</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: <code>update(id)</code> के लिए एक एलिमेंट स्कोप आईडी दें।</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: सशर्त सामग्री, <code>.when()</code> और <code>.else()</code> के साथ।</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: प्रति आइटम एक पंक्ति, पहचान से मेल खाती है।</li>
        <li><a href="#api-region"><code>region(options)</code></a> और <a href="#api-region"><code>into(id, ...content)</code></a>: ट्री में एक नामित स्थान, और सामग्री जो इसे कहीं से भी भरती है।</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: एक इवेंट श्रोता, या <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>।</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: बनाएं और जोड़ें।</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: सर्वर HTML पर कब्ज़ा करें।</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: घटकों को फिर से कॉल करें और DOM को पैच करें।</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: एक स्टाइल ऑब्जेक्ट से उत्पन्न कक्षाएं।</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: शैलियों को मिलाएं, बाद में जीतें।</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: थीम वाले <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> और <code>globalStyle</code>।</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: विकल्पों में से शैलियाँ।</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> और <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>।</li>
      </ul>
      <h3><code>nuclo</code> (केवल निर्यात नाम से)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> और <a href="#api-css-text"><code>resetStyles()</code></a>।</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> और <code>getCssText()</code>।</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">A साइड-इफेक्ट आयात</a>, प्लस <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> और <code>Nuclo*</code> कक्षाएं।</li>
      </ul>
      <h3><code>nuclo-router</code> (अलग पैकेज)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: राउटर, <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code> के साथ, <code>href()</code> और <code>stop()</code>।</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: एक मार्ग जिसका डेटा लोडर उसके हिस्से के बगल से शुरू होता है।</li>
        <li><a href="#router-api">Types</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> और अधिक।</li>
      </ul>
      <h3>ग्लोबल्स</h3>
      <ul>
        <li><a href="#tag-builders">175 टैग बिल्डर्स</a>: <code>div</code>, <code>span</code>, ..., <code>var_</code>, और <code>svgSvg</code>, <code>pathSvg</code>, ....</li>
        <li><a href="#typescript-setup">Types</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> और अधिक। <code>StyleResult</code> जैसे स्टाइलिंग प्रकार को <code>'nuclo'</code> से भी आयात किया जा सकता है।</li>
      </ul>
      <h3>विशेष कुंजी</h3>
      <ul>
        <li><a href="#attributes">विशेषताएं</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> हैंडलर</a>, <a href="#lifecycle"><code>onMount</code> और <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects"> स्टाइल ऑब्जेक्ट</a>: शॉर्टहैंड, छद्म स्टेट, <code>&amp;</code> चयनकर्ता, <code>@</code> नियम और <code>raw</code>।</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "अक्सर पूछे जाने वाले प्रश्न",
        content: `
      <h3>क्या स्थिति बदलने से UI अपडेट हो जाता है?</h3>
      <p>नंबर। DOM तब तक वैसा ही रहता है जब तक आप <code>update()</code> पर कॉल नहीं करते।</p>

      <h3>क्या Nuclo सिग्नल, प्रॉक्सी या वर्चुअल DOM का उपयोग करता है?</h3>
      <p>नंबर स्टेट साधारण JavaScript रहता है। जब एक ट्री प्रस्तुत किया जाता है, तो Nuclo वास्तविक तत्व और टेक्स्ट नोड बनाता है। <code>update()</code> प्रत्येक पंजीकृत गतिशील मान, या दिए गए दायरे के अंदर चलाता है, और उन्हीं नोड्स को पैच करता है जहां मान बदल गया है। कोई निर्भरता ग्राफ़ और कोई वर्चुअल ट्री नहीं है।</p>

      <h3>मेरा पेज "false" क्यों दिखाता है?</h3>
      <p>बूलियन्स पाठ के रूप में प्रस्तुत करते हैं। <code>div(ok &amp;&amp; span('Done'))</code> "false" दिखाता है। चाइल्ड नोड के लिए <code>when(() =&gt; ok, span('Done'))</code> और टेक्स्ट के लिए <code>ok ? 'Done' : ''</code> का उपयोग करें।</p>

      <h3>जब मैं आइटम संपादित करता हूं तो मेरी सूची पंक्ति क्यों नहीं बदलती?</h3>
      <p>उन आइटमों की पंक्तियाँ जो अभी भी सूची में हैं, रखी जाती हैं, दोबारा प्रस्तुत नहीं की जाती हैं। बदलने वाले फ़ील्ड के लिए <code>() =&gt; todo.text</code> जैसे गतिशील मानों का उपयोग करें। <a href="#api-list"><code>list()</code></a> देखें।</p>

      <h3>मेरे UI का हिस्सा अपडेट होना क्यों बंद हो जाता है?</h3>
      <p>आमतौर पर जब <code>update()</code> चलता था तो इसके नोड्स दस्तावेज़ में नहीं होते थे। Nuclo उन नोड्स को ट्रैक करना बंद कर देता है, भले ही आप उन्हें संलग्न कर लें, इसलिए दस्तावेज़ में मौजूद कंटेनर में प्रस्तुत करें। दो अन्य कारण: एक <code>when()</code> जिसकी स्थिति थ्रो अपडेट करना बंद कर देती है, और एक टेक्स्ट फ़ंक्शन जो अपने पहले रन पर थ्रो करता है वह खाली रहता है। <a href="#api-update"><code>update()</code></a> देखें।</p>

      <h3>मुझे <code>forceUpdate()</code> का उपयोग कब करना चाहिए?</h3>
      <p>केवल स्थिर मानों में दुर्लभ परिवर्तनों के लिए, जैसे भाषा बदलना। बाकी सभी चीज़ों के लिए, <code>update()</code> का उपयोग करें। <a href="#api-force-update"><code>forceUpdate()</code></a> देखें।</p>

      <h3>मैं किसी पेज को प्रोप के रूप में पास किए बिना लेआउट में कैसे डालूं?</h3>
      <p><code>region({ id: 'main' })</code> के साथ स्थान को चिह्नित करें और पृष्ठ को <code>into('main', …)</code> पर लौटाएं। <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a> देखें।</p>

      <h3>मैं किसी ऐप को कैसे अनमाउंट करूं?</h3>
      <p>इसे <code>when()</code> में लपेटें और स्थिति को बंद कर दें। DOM को स्वयं हटाने से <code>onDestroy</code> नहीं चलता है। <a href="#lifecycle">Lifecycle</a> देखें।</p>

      <h3>क्या Nuclo में राउटर शामिल है?</h3>
      <p>कोर पैकेज में नहीं है। सर्वर रेंडरिंग, हाइड्रेशन, कोड-स्प्लिट रूट और निष्क्रिय प्रीलोडिंग के साथ जहाजों को <code>nuclo-router</code> के रूप में अलग से रूट करना। इसे <code>npm install nuclo nuclo-router</code> के साथ इंस्टॉल करें। <a href="#router-overview">nuclo-router</a> देखें।</p>

      <h3>क्या Nuclo का प्रभाव है?</h3>
      <p>नंबर <code>onMount</code> और <code>onDestroy</code> प्रति तत्व एक बार चलते हैं, सम्मिलन और निष्कासन से बंधे होते हैं। कुछ भी दोबारा नहीं चलता क्योंकि कुछ स्टेट बदल गए।</p>
    `,
      },
    ],
  },

];
