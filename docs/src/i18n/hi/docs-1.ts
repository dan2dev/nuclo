import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "परिचय",
    sections: [
      {
        id: "overview",
        title: "अवलोकन",
        content: `
      <p>Nuclo TypeScript के लिए एक छोटी DOM लाइब्रेरी है। आप पृष्ठ को <code>div()</code> और <code>button()</code> जैसे साधारण फ़ंक्शन के साथ बनाते हैं, स्थिति को सामान्य चर में रखते हैं, और जब पृष्ठ बदलना चाहिए तो <code>update()</code> पर कॉल करते हैं।</p>
      <p>Nuclo में कोई वर्चुअल DOM, कोई कंपाइलर, कोई प्रॉक्सी और कोई सिग्नल नहीं है।</p>
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
      <h3>मानसिक मॉडल</h3>
      <ol>
        <li>टैग बिल्डरों के साथ UI बनाएं।</li>
        <li>स्टेट पर निर्भर प्रत्येक मान के लिए एक फ़ंक्शन पास करें।</li>
        <li>साधारण JavaScript के साथ स्थिति बदलें।</li>
        <li><code>update()</code> पर कॉल करें। Nuclo फिर से फ़ंक्शन चलाता है और DOM को पैच करता है।</li>
      </ol>
      <p>किसी वेरिएबल को बदलने से DOM पर असर नहीं पड़ता है। पेज तभी बदलता है जब आप <code>update()</code> पर कॉल करते हैं।</p>
    `,
      },
      {
        id: "quick-start",
        title: "त्वरित शुरुआत",
        content: `
      <p><code>create-nuclo</code> एक Vite और TypeScript प्रोजेक्ट तैयार करता है जो Nuclo के लिए तैयार है:</p>
    `,
        afterContent: `
      <p>यह प्रोजेक्ट का नाम पूछता है। प्रॉम्प्ट को छोड़ने के लिए, नाम और फ़्लैग पास करें। npm के साथ, फ़्लैग से पहले <code>--</code> लगाएं:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>फिर डेव सर्वर स्थापित करें और प्रारंभ करें:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>विकल्प</h3>
      <ul>
        <li><code>[project-name]</code>: लक्ष्य फ़ोल्डर. डिफ़ॉल्ट <code>nuclo-app</code> है.</li>
        <li><code>-t, --template &lt;name&gt;</code>: कॉपी करने के लिए टेम्पलेट। आज केवल <code>basic</code> मौजूद है।</li>
        <li><code>-y, --yes</code>: कभी संकेत न दें, डिफ़ॉल्ट का उपयोग करें।</li>
        <li><code>-f, --force</code>: ऐसे फ़ोल्डर में लिखें जो खाली न हो।</li>
        <li><code>-h, --help</code>: सहायता प्रिंट करें।</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "इंस्टॉलेशन और इम्पोर्ट",
        content: `
      <p>किसी मौजूदा प्रोजेक्ट में Nuclo जोड़ने के लिए:</p>
      ${sh("npm install nuclo")}
      <p>या <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> या <code>bun add nuclo</code> का उपयोग करें। Nuclo की कोई निर्भरता नहीं है।</p>
      <p>रूटिंग कोर पैकेज का हिस्सा नहीं है। इसे अलग से <a href="#router-overview"><code>nuclo-router</code></a> के रूप में भेजा जाता है, जिसे आप जरूरत पड़ने पर <code>nuclo</code> के बगल में स्थापित करते हैं।</p>
      <h3>ग्लोबल्स</h3>
      <p><code>import 'nuclo'</code> इन्हें <code>globalThis</code> पर रखता है:</p>
      <ul>
        <li><strong>175 टैग बिल्डर्स</strong>: HTML के लिए 112 (<code>div</code>, <code>span</code>, <code>button</code>, ...) और SVG के लिए 63, <code>Svg</code> के साथ प्रत्यय (<code>svgSvg</code>, <code>pathSvg</code>,…)। <a href="#tag-builders">टैग बिल्डर्स</a> देखें।</li>
        <li><strong>16 सहायक</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> और <code>globalStyle</code>।</li>
      </ul>
      <p>आयात किसी भी कोड से पहले चलना चाहिए जो बिल्डर को कॉल करता है। ईएस मॉड्यूल आयात क्रम में चलते हैं, इसलिए यह विफल रहता है:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>अपनी प्रविष्टि फ़ाइल में <code>import 'nuclo'</code> को पहले रखें, या इसे ग्लोबल्स का उपयोग करने वाली प्रत्येक फ़ाइल में आयात करें।</p>
      <h3>नामित आयात</h3>
      <p>सहायकों को निर्यात नाम भी दिया गया है। वे ग्लोबल्स के समान ही कार्य हैं। <code>getCssText()</code> और <code>resetStyles()</code> को केवल निर्यात नाम दिया गया है। टैग बिल्डर्स केवल ग्लोबल हैं, इसलिए <code>import { div } from 'nuclo'</code> काम नहीं करता है।</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>प्रवेश बिंदु</h3>
      <ul>
        <li><code>nuclo</code>: ग्लोबल्स को पंजीकृत करता है और 16 हेल्पर्स प्लस <code>getCssText</code> और <code>resetStyles</code> को निर्यात करता है।</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> और <code>getCssText</code>। <a href="#api-ssr">सर्वर रेंडरिंग</a> देखें।</li>
        <li><code>nuclo/polyfill</code>: नोड और बन के लिए एक छोटा DOM। <a href="#api-polyfill">nuclo/polyfill</a> देखें।</li>
        <li><code>nuclo/types</code>: केवल प्रकार। <a href="#typescript-setup">TypeScript</a> देखें।</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo अपने स्वयं के प्रकार शिप करता है। आपको दो चीज़ें चाहिए:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> और <code>nodenext</code> अभी समर्थित नहीं हैं।</li>
        <li><code>DOM</code> lib. जब आप <code>lib</code> सेट नहीं करते हैं तो TypeScript इसे डिफ़ॉल्ट रूप से शामिल करता है।</li>
      </ul>
      <p>यदि प्रोजेक्ट में कोई फ़ाइल <code>'nuclo'</code> आयात करती है, तो प्रत्येक फ़ाइल वैश्विक प्रकार देखती है। तुम्हें और कुछ नहीं चाहिए. यदि कोई फ़ाइल इसे आयात नहीं करती है, उदाहरण के लिए परीक्षणों के लिए एक अलग tsconfig में, प्रकार स्वयं जोड़ें:</p>
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
      <p>या <code>.d.ts</code> फ़ाइल में <code>/// &lt;reference types="nuclo/types" /&gt;</code> जोड़ें।</p>
      <h3>उपयोगी प्रकार</h3>
      <p>ये प्रकार वैश्विक हैं, इसलिए आप इन्हें आयात के बिना उपयोग करते हैं:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: टैग बिल्डर क्या रिटर्न देता है। इसे एक घटक के रिटर्न प्रकार के रूप में उपयोग करें।</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: टैग बिल्डर किसी भी चीज़ को तर्क के रूप में स्वीकार करता है।</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: <code>render()</code> और <code>hydrate()</code> क्या लौटाते हैं।</li>
        <li><code>ElementTagName</code>: कोई भी HTML टैग नाम।</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: वह विशेषता ऑब्जेक्ट जिसे टैग बिल्डर स्वीकार करता है, जिसमें <code>on*</code> हैंडलर, <code>onMount</code> और <code>onDestroy</code> शामिल हैं। इसका उपयोग उन घटकों के लिए करें जो विशेषताओं को पार करते हैं।</li>
        <li><code>MountCallback</code> और <code>DestroyCallback</code>: <code>onMount</code> और <code>onDestroy</code> हैंडलर।</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: <code>when()</code> और <code>list()</code> क्या रिटर्न देते हैं।</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: विकल्प <code>region()</code> लेता है।</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> और अन्य स्टाइल प्रकार। आप इन्हें भी आयात कर सकते हैं: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> प्रत्येक DOM सदस्य को वैकल्पिक के रूप में चिह्नित करता है। जब आपको पूर्ण तत्व प्रकार की आवश्यकता हो तो इसे कास्ट करें: <code>render(App, root) as HTMLDivElement</code>।</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "UI बनाना",
    sections: [
      {
        id: "tag-builders",
        title: "टैग बिल्डर",
        content: `
      <p>प्रत्येक HTML टैग एक ही नाम के साथ एक वैश्विक फ़ंक्शन है: <code>div</code>, <code>span</code>, <code>input</code>, ... एक अपवाद <code>&lt;var&gt;</code> है, जो <code>var_</code> है क्योंकि <code>var</code> एक आरक्षित शब्द है। प्रत्येक SVG टैग में एक <code>Svg</code> प्रत्यय होता है: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, ...</p>
      <p>टैग बिल्डर को कॉल करने से अभी तक कोई तत्व नहीं बना है। <code>div('Hi')</code> एक <strong>builder</strong> लौटाता है: एक फ़ंक्शन जो बाद में तत्व बनाता है। जब आप इसे <code>render()</code> के साथ माउंट करते हैं या किसी अन्य बिल्डर, <code>when()</code> या <code>list()</code> के अंदर रखते हैं तो Nuclo इसे कॉल करता है। प्रत्येक प्रयोग एक नया तत्व बनाता है।</p>
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
      <h3>तर्क</h3>
      <p>एक बिल्डर किसी भी संख्या में तर्क लेता है और उन्हें बाएं से दाएं लागू करता है:</p>
      <ul>
        <li><strong>string, संख्या, bigint</strong>: एक टेक्स्ट नोड।</li>
        <li><strong><code>() =&gt; value</code></strong>: टेक्स्ट जो <code>update()</code> पर बदलता है। <a href="#dynamic-functions">डायनामिक मान</a> देखें।</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: छोड़ दिया गया।</li>
        <li><strong><code>true</code>, <code>false</code></strong>: पाठ को "सही" या "false" के रूप में प्रस्तुत किया गया। शर्तों के लिए <code>when()</code> का उपयोग करें।</li>
        <li><strong>A साधारण ऑब्जेक्ट</strong>: विशेषताएँ। <a href="#attributes">Attributes</a> देखें।</li>
        <li><strong>A <code>css()</code>, <code>cx()</code> या <code>variants()</code> परिणाम</strong>: अपनी कक्षाएं जोड़ता है।</li>
        <li><strong><code>on(...)</code></strong>: एक इवेंट श्रोता या जीवनचक्र हुक।</li>
        <li><strong>एक अन्य बिल्डर, <code>when()</code> या <code>list()</code></strong>: एक बच्चा।</li>
        <li><strong>A DOM <code>Node</code></strong>: जैसा है वैसा ही जोड़ा गया।</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: एक कस्टम संशोधक। नीचे देखें।</li>
      </ul>
      <h3>गोचास</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> "false" टेक्स्ट प्रस्तुत करता है। <code>div(when(() =&gt; isAdmin, span('Admin')))</code> लिखें.</li>
        <li>ऐरे चाइल्ड नोड नहीं हैं। उन्हें फैलाएं: <code>ul(...names.map((n) =&gt; li(n)))</code>. बदलने वाली सूचियों के लिए, <code>list()</code> का उपयोग करें।</li>
        <li>टैग नाम वाला एक स्थानीय वैरिएबल बिल्डर को छुपाता है। <code>function Row(label: string)</code> के अंदर, <code>label(...)</code> कॉल करने योग्य नहीं है। <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> और <code>i</code> जैसे स्थानीय नाम बदलें।</li>
        <li>ब्राउज़र हर उस तत्व को उजागर करते हैं जिसमें <code>id</code> एक वैश्विक चर के रूप में होता है। यदि Nuclo लोड होने से पहले पृष्ठ में <code>&lt;main id="main"&gt;</code> शामिल है, तो Nuclo उस वैश्विक स्थान को छोड़ देता है, इसलिए <code>main(...)</code> एक <code>TypeError</code> फेंकता है। अन्य आईडी का प्रयोग करें.</li>
      </ul>
      <h3>कस्टम संशोधक</h3>
      <p>एक फ़ंक्शन जो कम से कम एक पैरामीटर घोषित करता है, तर्क क्रम में एक बार चलता है, जबकि तत्व बनाया जा रहा है। इसका पहला तर्क तत्व है। दूसरा एक आंतरिक सूचकांक है, इसलिए इस पर भरोसा न करें। यदि यह एक स्ट्रिंग या संख्या लौटाता है, तो वह टेक्स्ट बन जाता है। एक <code>Node</code> जोड़ा गया है। किसी ऑब्जेक्ट को विशेषताओं के रूप में लागू किया जाता है।</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>तत्व प्राप्त करना</h3>
      <p><code>render()</code> मूल तत्व लौटाता है। किसी ट्री के अंदर, <code>on("mount", (el) =&gt; …)</code> या एक कस्टम संशोधक का उपयोग करें। अलग तत्व बनाने के लिए आप बिल्डर फ़ंक्शन को स्वयं भी कॉल कर सकते हैं:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>इसे अगले <code>update()</code> से पहले संलग्न करें। एक नोड जो दस्तावेज़ में नहीं है जब <code>update()</code> चलता है तो हमेशा के लिए अपडेट होना बंद हो जाता है।</p>
      <h3>SVG</h3>
      <p>SVG बिल्डर्स भी यही तर्क देते हैं। Nuclo प्रत्येक SVG विशेषता को <code>setAttribute</code> के साथ सेट करता है, इसलिए <code>"stroke-width"</code> जैसे नाम लिखित रूप में काम करते हैं।</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>सभी बिल्डर्स</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "कंपोनेंट",
        content: `
      <p>एक घटक एक साधारण फ़ंक्शन है जो एक बिल्डर लौटाता है, जैसे <code>button(...)</code>। कोई घटक API नहीं है। जब तक आप इसे प्रस्तुत नहीं करते या इसे किसी ट्री पर नहीं रखते तब तक कुछ भी नहीं बनता है।</p>
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
      <p>स्थिति उस उदाहरण से संबंधित है। बाहर घोषित स्टेट हर उदाहरण द्वारा साझा किया जाता है। <code>forceUpdate()</code> घटकों को फिर से कॉल करता है, जो उनके अंदर घोषित स्थिति को रीसेट करता है।</p>
      <p>चाइल्ड नोड सिर्फ तर्क हैं:</p>
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
        title: "एट्रिब्यूट",
        content: `
      <p>विशेषताएँ सेट करने के लिए एक साधारण ऑब्जेक्ट पास करें। आप कई ऑब्जेक्ट पास कर सकते हैं. समान कुंजी के लिए, <code>className</code> और <code>style</code> को छोड़कर, बाद वाला मान जीतता है, जो विलीन हो जाते हैं। एक मान स्थिर हो सकता है, या बिना किसी पैरामीटर वाला एक फ़ंक्शन हो सकता है जो प्रत्येक <code>update()</code> पर फिर से चलता है।</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>कोई मान कैसे सेट किया जाता है</h3>
      <ul>
        <li>यदि HTML तत्व में उस नाम (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>,…) के साथ एक संपत्ति है, तो Nuclo संपत्ति सेट करता है। अन्यथा यह <code>setAttribute(key, String(value))</code> को कॉल करता है, उदाहरण के लिए <code>"aria-*"</code> और <code>"data-*"</code> के लिए।</li>
        <li>SVG तत्वों पर, Nuclo हमेशा <code>setAttribute</code> को कॉल करता है।</li>
        <li><code>null</code> और <code>undefined</code> को छोड़ दिया गया है। एक गतिशील मान जो <code>null</code> या <code>undefined</code> लौटाता है, पुराना मान रखता है। मान साफ़ करने के लिए, बूलियन प्रॉपर्टी के लिए <code>""</code>, या <code>false</code> लौटाएँ।</li>
        <li>बूलियन्स DOM बूलियन गुणों के लिए काम करते हैं, जैसे एक बटन पर <code>disabled</code>, <code>checked</code>, <code>hidden</code> और <code>required</code>। कहीं और, <code>true</code> और <code>false</code> को स्ट्रिंग "true" और "false" के रूप में लिखा गया है।</li>
        <li><code>"data-*"</code> कुंजियों का उपयोग करें। <code>dataset</code> समर्थित नहीं है.</li>
        <li><code>innerHTML</code> बच नहीं पाया है, और सर्वर रेंडरिंग इसे आउटपुट नहीं करता है। उससे बचिए।</li>
      </ul>
      <h3>कक्षाएं</h3>
      <p><code>className</code> का उपयोग करें। स्टेटिक क्लास स्ट्रिंग्स, <code>css()</code> परिणाम और एक गतिशील <code>className</code> सभी विलीन हो जाते हैं। एक गतिशील <code>className</code> स्थिर कक्षाएं रखता है, और जब यह <code>""</code> लौटाता है तो केवल स्थिर कक्षाएं ही रहती हैं।</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>HTML तत्वों पर <code>class</code> कुंजी का उपयोग न करें। यह कच्ची विशेषता सेट करता है और <code>css()</code> क्लास सहित, इससे पहले लागू प्रत्येक वर्ग को प्रतिस्थापित करता है।</p>
      <h3>इनलाइन शैलियाँ</h3>
      <p><code>style</code> camelCase कुंजियों के साथ एक ऑब्जेक्ट लेता है, या एक फ़ंक्शन जो एक लौटाता है।</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo कोई इकाई नहीं जोड़ता। <code>"12px"</code> लिखें, <code>12</code> नहीं। इकाई रहित गुण जैसे <code>opacity</code> और <code>zIndex</code> संख्याएँ स्वीकार करते हैं।</li>
        <li><code>""</code>, <code>null</code> और <code>undefined</code> एक संपत्ति साफ़ करें।</li>
        <li>एक गतिशील शैली केवल वही कुंजी सेट करती है जो वह लौटाती है। जिस कुंजी को वह लौटाना बंद कर देता है, उसका पुराना मान बना रहता है, इसलिए उसे साफ़ करने के लिए <code>""</code> लौटाएँ।</li>
        <li>स्टाइल स्ट्रिंग्स (<code>"color: red"</code>) और कस्टम गुण (<code>"--gap"</code>) समर्थित नहीं हैं। इसके बजाय <code>css()</code> का उपयोग करें। यह <a href="#style-objects"><code>raw</code></a> के माध्यम से कस्टम गुण लेता है।</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "इवेंट",
        content: `
      <p>घटनाओं को सुनने के दो तरीके हैं: <code>on*</code> विशेषताएँ और <code>on()</code> संशोधक।</p>
      <h3><code>on*</code> विशेषताएँ</h3>
      <p>एक विशेषता ऑब्जेक्ट में, <code>onClick</code> (<code>on</code> जिसके बाद एक बड़ा अक्षर होता है) जैसी कुंजी के तहत एक फ़ंक्शन एक ईवेंट हैंडलर है, गतिशील मान नहीं।</p>
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
        <li>TypeScript कुंजी और तत्व से ईवेंट प्रकार का अनुमान लगाता है। <code>e.currentTarget</code> और <code>this</code> तत्व हैं।</li>
        <li>Nuclo मूल संपत्ति सेट करता है, इसलिए <code>onClick</code> <code>el.onclick</code> बन जाता है। प्रति इवेंट एक हैंडलर होता है: बाद वाला <code>onClick</code> पहले वाले की जगह लेता है।</li>
        <li><code>onDoubleClick</code> और <code>onDblClick</code> दोनों का मतलब <code>dblclick</code> है। <code>onclick</code> जैसी लोअरकेस कुंजियाँ प्रकार की त्रुटियाँ हैं।</li>
        <li>एक नाम जो ज्ञात घटना नहीं है, उसके लोअरकेस रूप को सुनता है: <code>onMyEvent</code> <code>"myevent"</code> को सुनता है।</li>
        <li>हैंडलर द्वारा फेंकी गई त्रुटियाँ पकड़ में नहीं आतीं।</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> एक संशोधक लौटाता है जो तत्व पर <code>addEventListener</code> को कॉल करता है।</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>प्रत्येक <code>on()</code> एक श्रोता जोड़ता है। वे सभी क्रम से चलते हैं।</li>
        <li><code>options</code> सीधे <code>addEventListener</code> पर जाता है: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>।</li>
        <li>सीधे बिल्डर के पास <code>on()</code> पास करें और तत्व प्रकार का अनुमान लगाया जाता है: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>।</li>
        <li>यदि कोई श्रोता फेंकता है, तो Nuclo <code>console.error</code> के साथ त्रुटि लॉग करता है, और अन्य श्रोता अभी भी चलते हैं।</li>
        <li>Nuclo तत्व को हटाते समय श्रोता को हटा देता है। सर्वर पर, <code>on()</code> कुछ नहीं करता है।</li>
        <li>आप कई तत्वों पर एक <code>on()</code> मान का पुन: उपयोग कर सकते हैं।</li>
      </ul>
      <p>एक कस्टम इवेंट के लिए, इवेंट प्रकार को सामान्य के रूप में पास करें:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>कौन सा उपयोग करना है</h3>
      <p>सामान्य स्थिति के लिए <code>on*</code> विशेषताओं का उपयोग करें। जब आपको किसी इवेंट के लिए एक से अधिक श्रोता, श्रोता विकल्प, या <code>"my-event"</code> जैसे कस्टम इवेंट नाम की आवश्यकता हो तो <code>on()</code> का उपयोग करें।</p>
    `,
      },
      {
        id: "lifecycle",
        title: "लाइफ़साइकल",
        content: `
      <p><code>onMount</code> एक बार चलता है। <code>onDestroy</code> एक बार चलता है, जब Nuclo तत्व हटा देता है। उन्हें विशेषताओं के रूप में या <code>on()</code> के साथ लिखें। दोनों फॉर्म समान व्यवहार करते हैं, और तत्व उसके टैग से टाइप किया जाता है।</p>
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
      <h3>जब वे चलते हैं</h3>
      <ul>
        <li><code>onMount</code> उस <code>render()</code>, <code>hydrate()</code>, <code>update()</code> या <code>forceUpdate()</code> कॉल के अंत में चलता है जिसने तत्व डाला था। ट्री के निर्माण के दौरान यह कभी नहीं चलता।</li>
        <li>यदि <code>onMount</code> एक फ़ंक्शन लौटाता है, तो तत्व के <code>onDestroy</code> कॉलबैक के बाद, वह फ़ंक्शन नष्ट हो जाता है।</li>
        <li><code>onDestroy</code> तब चलता है जब Nuclo तत्व को हटा देता है: एक <code>list()</code> पंक्ति हटा दी जाती है, एक <code>when()</code> शाखा स्विच हो जाती है, एक <code>into()</code> अपना क्षेत्र छोड़ देता है, या <code>forceUpdate()</code> इसे छोड़ देता है। यह हटाने से ठीक पहले चलता है, इसलिए तत्व अभी भी दस्तावेज़ में है।</li>
      </ul>
      <h3>रॉ DOM हटाना</h3>
      <p>यदि आप <code>node.remove()</code> या <code>innerHTML = ''</code> के साथ किसी तत्व को स्वयं हटाते हैं, तो इसका <code>onDestroy</code> और क्लीनअप कभी नहीं चलता है, और टाइमर चलते रहते हैं। Nuclo में कोई <code>unmount()</code> नहीं है। किसी ऐप को क्लीनअप से हटाने के लिए, उसे <code>when()</code> में लपेटें:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>आदेश और त्रुटियाँ</h3>
      <ul>
        <li>आप किसी भी रूप में जितने चाहें उतने हुक पंजीकृत कर सकते हैं। वे पंजीकरण क्रम में चलते हैं।</li>
        <li><code>onDestroy</code> हमेशा पहले चाइल्ड नोड को चलाता है, फिर माता-पिता को।</li>
        <li>तत्व अपने पहले <code>onMount</code> हुक के क्रम में माउंट होते हैं, जो तर्क क्रम का पालन करता है, और प्रत्येक तत्व अपने सभी हुक को एक साथ चलाता है। यदि माता-पिता उन पर निर्भर हैं तो अपने चाइल्ड नोड से पहले माता-पिता की जिम्मेदारी छोड़ें।</li>
        <li>एक हुक जो फेंकता है उसे <code>console.error</code> के साथ लॉग किया जाता है। अन्य हुक अभी भी चल रहे हैं.</li>
        <li>कॉलबैक को कुछ भी नहीं या क्लीनअप फ़ंक्शन लौटाना चाहिए, इसलिए इसे <code>async</code> न बनाएं। लौटाए गए वादे को कभी भी सफाई के रूप में उपयोग नहीं किया जाता है। इसके अंदर async कार्य प्रारंभ करें: <code>{ onMount: (el) =&gt; { void load(el) } }</code>।</li>
        <li>हुक कभी भी सर्वर पर नहीं चलते। क्लाइंट पर, वे <code>hydrate()</code> के बाद चलते हैं।</li>
      </ul>
      <div class="docs-callout"><strong>नोट:</strong> हुक प्रभाव नहीं हैं। स्टेट बदलने पर वे फिर कभी नहीं भागते। प्रत्येक तत्व प्रति तत्व अधिकतम एक बार चलता है।</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "अपडेट",
    sections: [
      {
        id: "explicit-updates",
        title: "स्पष्ट अपडेट",
        content: `
      <p>Nuclo कभी भी पेज को अपने आप अपडेट नहीं करता है। अपना स्टेट बदलें, फिर <code>update()</code> पर कॉल करें।</p>
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
      <p>जितना चाहें उतना स्टेट बदलें, फिर एक बार <code>update()</code> पर कॉल करें:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>इवेंट हैंडलर, टाइमर, फ़ेच कॉलबैक या <code>onMount</code> से <code>update()</code> पर कॉल करें। इसे डायनामिक मान के अंदर से न बुलाएं।</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "डायनेमिक मान",
        content: `
      <p><strong>नो पैरामीटर</strong> वाला एक फ़ंक्शन एक <strong>डायनामिक मान</strong> है। Nuclo तत्व बनाते समय इसे एक बार चलाता है, और फिर प्रत्येक <code>update()</code> पर। टेक्स्ट चिल्ड्रेन, विशेषता मान, <code>style</code> और <code>className</code> के लिए गतिशील मानों का उपयोग करें। दिखाई देने वाले, गायब होने वाले या दोहराए जाने वाले चाइल्ड नोड के लिए, <a href="#api-when"><code>when()</code></a> और <a href="#api-list"><code>list()</code></a> का उपयोग करें।</p>
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
      <p>Nuclo पैरामीटर गिनती (<code>fn.length</code>) की जाँच करता है। एक फ़ंक्शन जो पैरामीटर घोषित करता है वह एक <a href="#tag-builders">कस्टम संशोधक</a> है और केवल एक बार चलता है। <code>(x = 0) =&gt; …</code> और <code>(...args) =&gt; …</code> की लंबाई 0 है, इसलिए वे गतिशील हैं।</p>
      <h3>गतिशील पाठ</h3>
      <ul>
        <li>एक स्ट्रिंग, संख्या, bigint या बूलियन <code>String(value)</code> के रूप में प्रस्तुत होता है। <code>() =&gt; ok &amp;&amp; 'Saved'</code> "false" दिखाता है, इसलिए <code>() =&gt; (ok ? 'Saved' : '')</code> लिखें।</li>
        <li><code>null</code> और <code>undefined</code> खाली टेक्स्ट के रूप में प्रस्तुत होते हैं।</li>
        <li>A <code>css()</code> या <code>cx()</code> परिणाम पहले रन पर फ़ंक्शन को एक गतिशील वर्ग बनाता है, टेक्स्ट नहीं। <a href="#api-cx"><code>cx()</code></a> देखें।</li>
        <li>एक नोड, बिल्डर, ऐरे या साधारण ऑब्जेक्ट कुछ भी प्रस्तुत नहीं करता है, और कभी अपडेट नहीं होता है।</li>
      </ul>
      <h3>गतिशील विशेषताएँ</h3>
      <ul>
        <li>Nuclo कोई मान तभी लिखता है जब वह Nuclo द्वारा लिखे गए अंतिम मान से भिन्न हो। इसकी तुलना लाइव DOM से नहीं की जाती है, इसलिए यदि कोई उपयोगकर्ता इनपुट टाइप करता है और आपका फ़ंक्शन पहले जैसा ही मान लौटाता है, तो उनके द्वारा टाइप किया गया टेक्स्ट बना रहता है।</li>
        <li><code>null</code> या <code>undefined</code> का परिणाम कुछ भी नहीं लिखता है, इसलिए पुराना मान बना रहता है। <code>className</code> अपवाद है: कोई भी गलत परिणाम गतिशील वर्गों को हटा देता है और स्थिर वर्गों को रखता है।</li>
        <li>एक <code>style</code> फ़ंक्शन प्रत्येक अपडेट पर लौटाए गए ऑब्जेक्ट को लागू करता है।</li>
      </ul>
      <h3>त्रुटियाँ</h3>
      <p>यदि कोई गतिशील मान फेंकता है, तो Nuclo त्रुटि पकड़ता है और शेष अद्यतन अभी भी चलता है। टेक्स्ट खाली हो जाता है या अपना पुराना मान रखता है, और एक विशेषता अपना पुराना मान रखता है। दोनों अगले <code>update()</code> पर ठीक हो जाते हैं जो सफल होता है। अपवाद: एक टेक्स्ट फ़ंक्शन जो अपने <strong>first</strong> रन पर फेंकता है वह हमेशा के लिए खाली रहता है।</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>पृष्ठ पर प्रत्येक गतिशील मान पर एक सिंक्रोनस पास चलाता है। आईडी के साथ, यह केवल उन <a href="#api-scope"><code>scope()</code></a> आईडी के साथ चिह्नित तत्वों के अंदर क्या अपडेट करता है। प्रत्येक पास इन चरणों को क्रम में चलाता है:</p>
      <ol>
        <li><code>list()</code>: आइटम को दोबारा पढ़ता है और पंक्तियों को जोड़ता, स्थानांतरित या हटाता है।</li>
        <li><code>when()</code>: शर्तों की दोबारा जाँच करता है। एक शाखा का पुनर्निर्माण तभी होता है जब कोई दूसरी शाखा सक्रिय हो जाती है।</li>
        <li>गतिशील विशेषताएँ, जिनमें <code>style</code> और <code>className</code> शामिल हैं।</li>
        <li>गतिशील पाठ.</li>
        <li><code>onMount</code>।</li>
      </ol>
      <ul>
        <li><strong>यह सब कुछ चलाता है।</strong> प्रत्येक डायनामिक मान प्रत्येक कॉल पर चलता है, भले ही उसका डेटा नहीं बदला हो। केवल DOM लिखना छोड़ दिया गया है। गतिशील मूल्यों को तेज़ और दुष्प्रभावों से मुक्त रखें।</li>
        <li><strong> दस्तावेज़ में केवल नोड्स.</strong> यदि <code>update()</code> चलने पर दस्तावेज़ में कोई नोड नहीं है, तो Nuclo इसे ट्रैक करना बंद कर देता है। आपके द्वारा इसे संलग्न करने के बाद भी यह कभी भी दोबारा अपडेट नहीं होता है। यह <code>list()</code> और <code>when()</code> पर भी लागू होता है। दस्तावेज़ में मौजूद कंटेनर में प्रस्तुत करें।</li>
        <li><strong>स्थैतिक मान कभी नहीं बदलते। </strong> तत्व निर्मित होने पर साधारण स्ट्रिंग और विशेषता मान तय हो जाते हैं। उन्हें फिर से बनाने के लिए, <a href="#api-force-update"><code>forceUpdate()</code></a> का उपयोग करें।</li>
        <li><strong>Errors.</strong> टेक्स्ट और विशेषता त्रुटियाँ पकड़ी जाती हैं, और पास जारी रहता है। यदि कोई <code>when()</code> स्थिति खराब हो जाती है, तो त्रुटि लॉग हो जाती है और <code>when()</code> अपडेट होना बंद हो जाता है। यदि कोई <code>list()</code> <code>items</code> या <code>renderItem</code> फ़ंक्शन फेंकता है, तो त्रुटि <code>update()</code> से बच जाती है और शेष चरण नहीं चलते हैं।</li>
        <li><strong>Server.</strong> <code>update()</code> सर्वर पर कुछ नहीं करता है।</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>तत्व देता है इसे एक या अधिक स्कोप आईडी में पास किया जाता है। <code>update('id')</code> तब केवल वही अपडेट करता है जो उस तत्व के अंदर है, जिसमें तत्व की अपनी विशेषताएं भी शामिल हैं।</p>
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
        <li>एक तत्व में कई आईडी हो सकती हैं: <code>scope('cart', 'sidebar')</code>।</li>
        <li><code>update('a', 'b')</code> <code>a</code> या <code>b</code> के अंदर सब कुछ अपडेट करता है। यदि कई तत्व एक ही आईडी का उपयोग करते हैं, तो वे सभी अपडेट हो जाते हैं।</li>
        <li>नेस्टेड स्कोप के साथ, <code>update('outer')</code> में आंतरिक स्कोप शामिल है। <code>update('inner')</code> बाहरी हिस्से को नहीं छूता है।</li>
        <li>एक आईडी जिसमें दस्तावेज़ के किसी भी तत्व को <strong>nothing</strong> अपडेट किया गया है और कोई त्रुटि नहीं है, इसलिए वर्तनी की जांच करें।</li>
        <li><code>scope()</code> सर्वर पर कुछ नहीं करता है।</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>एक शर्त के आधार पर सामग्री प्रस्तुत करता है। Nuclo प्रत्येक <code>update()</code> पर स्थितियों की दोबारा जाँच करता है। पहली सच्ची स्थिति जीतती है। यदि कोई भी सत्य नहीं है, तो <code>.else()</code> सामग्री प्रस्तुत होती है। <code>.else()</code> के बिना, कुछ भी प्रस्तुत नहीं होता।</p>
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
      <h3>शर्तें</h3>
      <ul>
        <li>स्टेट के लिए, एक फ़ंक्शन पास करें। एक साधारण बूलियन एक बार पढ़ा जाता है: <code>when(open, …)</code> कभी नहीं बदलता।</li>
        <li>TypeScript में फ़ंक्शन को एक बूलियन लौटाना होगा। <code>() =&gt; items.length &gt; 0</code> या <code>() =&gt; user != null</code> लिखें.</li>
      </ul>
      <h3>क्या अपडेट</h3>
      <ul>
        <li>जबकि एक ही शाखा सक्रिय रहती है, इसके तत्व बने रहते हैं। इसके अंदर गतिशील मान, सूचियाँ और <code>when()</code> ब्लॉक अपडेट होते रहते हैं।</li>
        <li>जब एक अलग शाखा सक्रिय हो जाती है, तो पुरानी सामग्री हटा दी जाती है और उसके <code>onDestroy</code> हुक चलते हैं। नई शाखा एकदम नए सिरे से बनाई गई है और इसके <code>onMount</code> हुक चलते हैं। पुराने तत्वों की स्थिति, जैसे इनपुट टेक्स्ट या फ़ोकस, खो जाती है।</li>
      </ul>
      <h3>शाखा सामग्री</h3>
      <p>चाइल्ड नोड को एक शाखा में रखें: टेक्स्ट, डायनेमिक टेक्स्ट, बिल्डर्स, <code>list()</code> और नेस्टेड <code>when()</code>। <code>p('Hi')</code> जैसे बिल्डरों को पास करें, DOM नोड्स को नहीं: एक DOM नोड अपनी शाखा के एक बार छिपने के बाद अपडेट होना बंद कर देता है।</p>
      <p>विशेषता ऑब्जेक्ट और <code>on()</code> मूल तत्व पर लागू होते हैं, और वे शाखा के छिपने के बाद भी बने रहते हैं। एक सशर्त विशेषता के लिए, एक गतिशील विशेषता का उपयोग करें: <code>{ className: () =&gt; (active ? 'active' : '') }</code>।</p>
      <h3>चेनिंग</h3>
      <p><code>.when()</code> और <code>.else()</code> एक नया बिल्डर लौटाते हैं और मूल को नहीं बदलते हैं। यदि आप <code>.else()</code> को दो बार कॉल करते हैं, तो अंतिम कॉल जीत जाती है।</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>प्रति आइटम एक पंक्ति प्रस्तुत करता है। प्रत्येक <code>update()</code> पर, Nuclo फिर से <code>items()</code> को कॉल करता है और पहचान के आधार पर नए आइटम को मौजूदा पंक्तियों से मिलाता है (<code>===</code>)।</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>पंक्तियों का मिलान कैसे किया जाता है</h3>
      <ul>
        <li>एक आइटम जो अभी भी वहां है, अपनी पंक्ति बनाए रखता है। यदि आवश्यक हो तो Nuclo पंक्ति को स्थानांतरित करता है, और <code>renderItem</code> को दोबारा कॉल नहीं करता है।</li>
        <li>एक नए आइटम को एक नई पंक्ति मिलती है। हटाया गया आइटम अपनी पंक्ति खो देता है, और उसके <code>onDestroy</code> हुक चलते हैं।</li>
        <li>डुप्लिकेट आइटमों में से प्रत्येक को अपनी पंक्ति मिलती है।</li>
        <li>आप सरणी को उसके स्थान पर बदल सकते हैं (<code>push</code>, <code>splice</code>, <code>sort</code>) या एक नई सरणी लौटा सकते हैं।</li>
      </ul>
      <p>एक रखी गई पंक्ति को दोबारा कभी प्रस्तुत नहीं किया जाता है, इसलिए बदलने वाले फ़ील्ड के लिए गतिशील मानों का उपयोग करें:</p>
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
      <p>प्रतियां नए आइटम हैं, इसलिए सरणी को <code>todos.map((t) =&gt; ({ ...t }))</code> से बदलने से प्रत्येक पंक्ति का पुनर्निर्माण होता है।</p>
    `,
        afterContent: `
      <h3><code>renderItem</code> क्या लौटाता है</h3>
      <ul>
        <li>एक तत्व लौटाएं, जैसे <code>li(...)</code>, <code>tr(...)</code> या SVG बिल्डर। किसी आइटम को छोड़ने के लिए <code>null</code> या <code>undefined</code> लौटें। स्ट्रिंग्स, टेक्स्ट नोड्स और टुकड़े कुछ भी प्रस्तुत नहीं करते हैं।</li>
        <li>सीधे <code>when()</code> या <code>list()</code> वापस न करें। उन्हें पंक्ति तत्व के अंदर रखें: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>।</li>
        <li>आइटम छिपाने के लिए, <code>items()</code> में फ़िल्टर करें, <code>renderItem</code> में नहीं।</li>
        <li><code>renderItem</code> को दुष्प्रभावों से मुक्त रखें। Nuclo एक ही आइटम के लिए इसे एक से अधिक बार कॉल कर सकता है।</li>
      </ul>
      <h3>सूचकांक</h3>
      <p><code>index</code> आइटम की वह स्थिति है जब उसकी पंक्ति बनाई गई थी। पंक्तियों के हिलने पर यह अद्यतन नहीं होता है। वर्तमान स्थिति के लिए, एक गतिशील मान का उपयोग करें: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>।</p>
      <h3>पुनरावर्तनीय</h3>
      <p>कोई भी पुनरावर्तनीय कार्य: सरणियाँ, <code>Set</code>, जनरेटर और <code>map.values()</code>। हर बार एक ही सरणी या <code>Set</code> लौटाना ठीक है। एक पुनरावर्तक, जैसे जनरेटर या <code>map.values()</code>, का उपयोग एक पास के बाद किया जाता है, इसलिए इसे प्रत्येक कॉल पर <code>items()</code> के अंदर बनाएं। <code>Map</code> को पुनरावृत्त करने से हर बार सीधे नए <code>[key, value]</code> सरणियाँ बनती हैं, इसलिए प्रत्येक पंक्ति का पुनर्निर्माण किया जाता है। इसके बजाय <code>map.values()</code> का उपयोग करें।</p>
      <h3>प्लेसमेंट</h3>
      <p>पंक्तियाँ वहाँ दिखाई देती हैं जहाँ <code>list()</code> दो टिप्पणी मार्करों के बीच अपने भाई-बहनों के बीच बैठता है। माता-पिता के अन्य चाइल्ड नोड को छुआ नहीं जाता है। <code>list()</code> SVG बिल्डर्स के अंदर भी काम करता है।</p>
    `,
      },
      {
        id: "api-region",
        title: "region() और into()",
        content: `
      <p><code>region()</code> ट्री में एक नामित स्थान को चिह्नित करता है। <code>into()</code> इसे कहीं और से, किसी भी गहराई से भर देता है। लेआउट सामग्री को प्रोप के रूप में प्राप्त नहीं करता है, और सामग्री बनाने वाले घटक को यह नहीं पता होता है कि वह कहां पहुंचती है।</p>
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
      <h3>यह कैसे काम करता है</h3>
      <ul>
        <li><code>into()</code> केवल एक टिप्पणी छोड़ता है जहां यह लिखा जाता है। इसकी सामग्री क्षेत्र के मार्करों के बीच प्रस्तुत होती है।</li>
        <li>ऑर्डर कोई मायने नहीं रखता। अपने क्षेत्र से पहले निर्मित एक <code>into()</code> प्रतीक्षा करता है और उस क्षण को दिखाता है जब क्षेत्र का निर्माण होता है। दृश्य उसी क्रम में दिखते हैं जिस क्रम में वे लिखे गए थे।</li>
        <li>सामग्री तब तक जीवित रहती है जब तक दृश्य रहता है। जब <code>into()</code> रखने वाला <code>when()</code> बंद हो जाता है, या इसकी <code>list()</code> पंक्ति हटा दी जाती है, तो सामग्री क्षेत्र छोड़ देती है। इसे दोबारा खोलने पर एक प्रति जुड़ती है, दो नहीं।</li>
        <li>जब कोई क्षेत्र चला जाता है, उदाहरण के लिए उसका <code>when()</code> बंद हो जाता है, तो उसके दृश्य फिर से प्रतीक्षा करते हैं। बाद में उसी आईडी से बनाया गया क्षेत्र उन्हें दिखाता है।</li>
        <li>एक <code>into()</code> जिसकी आईडी किसी भी क्षेत्र से मेल नहीं खाती है, कुछ भी प्रस्तुत नहीं करती है और कोई त्रुटि उत्पन्न नहीं करती है, इसलिए वर्तनी की जांच करें।</li>
        <li>आईडी ट्री में अद्वितीय हैं। लाइव आईडी के अंतर्गत निर्मित दूसरा क्षेत्र एक चेतावनी लॉग करता है।</li>
        <li>क्षेत्र <a href="#api-ssr">सर्वर रेंडरिंग</a> के साथ काम करते हैं। <code>hydrate()</code> पर, प्रत्येक दृश्य सर्वर द्वारा इसे दोबारा बनाने के बजाय प्रस्तुत किए गए HTML का दावा करता है।</li>
      </ul>
      <h3>विकल्प</h3>
      <ul>
        <li><code>id</code>: क्षेत्र को खोजने के लिए <code>into()</code> नाम का उपयोग किया जाता है।</li>
        <li><code>type</code>: <code>'latest'</code> (डिफ़ॉल्ट) केवल नवीनतम दृश्य दिखाता है। <code>'stack'</code> प्रत्येक दृश्य को आगमन क्रम में दिखाता है।</li>
        <li><code>empty</code>: उस समय प्रस्तुत किया गया जब इस क्षेत्र में कोई दृश्य नहीं है।</li>
      </ul>
      <h3>स्टैक्ड क्षेत्र</h3>
      <p><code>type: 'stack'</code> के साथ, एक दृश्य जो दूसरे के ऊपर खुलता है वह नीचे वाले का पुनर्निर्माण नहीं करता है। इसका DOM, फोकस और फॉर्म स्टेट स्टे है। किसी पृष्ठ पर संवाद जैसी परत के लिए इसका उपयोग करें।</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>एक साथ कई क्षेत्र</h3>
      <p>एक <code>into()</code> से एक से अधिक क्षेत्रों को भरने के लिए एक ऑब्जेक्ट पास करें। एक मान एक बच्चा या चाइल्ड नोड की एक श्रृंखला हो सकता है। कोई भी रूप घोंसला बनाता है: किसी अन्य दृश्य की सामग्री के अंदर एक <code>into()</code> अपने स्वयं के क्षेत्र को लक्षित करता है।</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>ट्री की गहराई से एक संवाद खुला</h3>
      <p>ओवरले क्षेत्र मूल पर बैठता है. कोई भी घटक, किसी भी गहराई पर, <code>into()</code> को <code>when()</code> में लपेटकर एक संवाद खोलता है। <code>when()</code> को बंद करने से क्षेत्र से संवाद हट जाता है।</p>
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
      <h3>टोस्ट</h3>
      <p><code>list()</code> की प्रत्येक पंक्ति एक दृश्य है। एक स्टैक्ड क्षेत्र उन्हें क्रम में दिखाता है, और सरणी से किसी आइटम को हटाने से उसका टोस्ट हट जाता है।</p>
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
      <h3>पृष्ठ द्वारा निर्धारित एक पृष्ठ शीर्षक</h3>
      <p>डिफ़ॉल्ट <code>type: 'latest'</code> के साथ, नवीनतम दृश्य जीतता है। लेआउट शीर्षक का स्वामी होता है, और जो भी पृष्ठ खुला होता है उसे नाम देता है। बिना <code>into('title', …)</code> वाला पेज <code>empty</code> टेक्स्ट छोड़ता है।</p>
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
      <h3>गतिशील मान</h3>
      <p><code>into()</code> की सामग्री सामान्य Nuclo सामग्री है। इसमें फ़ंक्शन स्टेट-निर्भर मान हैं और क्षेत्र जहां भी हो, <code>update()</code> पर ताज़ा होते हैं।</p>
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
      <h3>एक क्षेत्र जो आता और जाता है</h3>
      <p>डैशबोर्ड का <code>into()</code> एक बार लिखा है। जबकि उपयोगकर्ता साइन आउट है, कोई <code>main</code> क्षेत्र नहीं है, इसलिए दृश्य प्रतीक्षा करता है। साइन इन करने से क्षेत्र बनता है और दृश्य दिखता है। साइन आउट करने से क्षेत्र हट जाता है और दृश्य फिर से प्रतीक्षा करता है।</p>
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
      <h3>अपने क्षेत्र के साथ एक दृश्य</h3>
      <p>एक दृश्य में <code>region()</code> हो सकता है, और अन्य दृश्य इसे लक्षित कर सकते हैं। यहां संपादक पृष्ठ अपने साथ एक <code>tabs</code> क्षेत्र लाता है, और प्रत्येक टैब इसे भरता है। जब संपादक बंद हो जाता है, तो उसका क्षेत्र उसके साथ चला जाता है।</p>
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
      <h3>लाइव उदाहरण</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> केवल गतिशील मान चलाता है। स्थैतिक मान, जैसे कि <code>h1(labels[lang].title)</code> में पाठ, ट्री के निर्माण के समय तय किए जाते हैं। <code>forceUpdate()</code> आपके घटकों को फिर से कॉल करता है और लाइव DOM को मिलान करने के लिए पैच करता है, स्थिर मान शामिल हैं। भाषा बदलने जैसे दुर्लभ, ऐप-व्यापी परिवर्तनों के लिए इसका उपयोग करें। बाकी सभी चीज़ों के लिए <code>update()</code> का उपयोग करें।</p>
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
      <p>बिना किसी तर्क के, <code>forceUpdate()</code> <code>render(App)</code> या <code>hydrate(App)</code> के साथ रेंडर किए गए प्रत्येक रूट का पुनर्निर्माण करता है। <code>render(App())</code> के साथ रेंडर किए गए रूट छोड़ दिए गए हैं। यदि कोई घटक फेंकता है, तो त्रुटि लॉग हो जाती है और वह रूट अपना पुराना DOM रखता है। बाद में जब नई बिल्ड लागू की जाती है तो एक त्रुटि भी लॉग की जाती है, लेकिन पहले से पैच किए गए हिस्से पैच किए हुए रहते हैं।</p>
      <h3>क्या रहता है और क्या बदलता है</h3>
      <ul>
        <li>चाइल्ड नोड का मिलान क्रम से, टैग द्वारा किया जाता है। एक मिलान तत्व का पुन: उपयोग किया जाता है, इसलिए फोकस और टाइप किए गए इनपुट मान बने रहते हैं, और इसके <code>onMount</code> हुक दोबारा नहीं चलते हैं। एक बार जब एक चाइल्ड नोड का टैग अलग हो जाता है, तो उस चाइल्ड नोड और उसके बाद के प्रत्येक भाई-बहन का निर्माण नए सिरे से होता है।</li>
        <li>टेक्स्ट, विशेषताएँ, वर्ग, शैलियाँ, श्रोता, <code>when()</code> शाखाएँ और <code>list()</code> पंक्तियाँ नए निर्माण का अनुसरण करती हैं।</li>
        <li>नए तत्व बनाए जाते हैं, और उनके <code>onMount</code> हुक चलते हैं। जो तत्व नया निर्माण नहीं करता है उन्हें हटा दिया जाता है, और उनके <code>onDestroy</code> हुक चलते हैं।</li>
        <li><code>list()</code> पंक्तियों का मिलान स्थिति से भी किया जाता है, आइटम से नहीं, इसलिए पुन: उपयोग किया गया पंक्ति तत्व एक अलग आइटम दिखा सकता है।</li>
        <li>नई बिल्ड विशेषताएँ अब सेट नहीं हटाई जाती हैं।</li>
      </ul>
      <div class="docs-callout"><strong>देखें: </strong> घटक फ़ंक्शन के अंदर घोषित स्थिति रीसेट हो जाती है, क्योंकि फ़ंक्शन फिर से चलता है। ऐसी स्थिति रखें जो घटक के बाहर जीवित रहनी चाहिए।</div>
      <p><strong>स्पष्ट फॉर्म.</strong> <code>forceUpdate(App(), parent)</code> <code>parent</code> में एक ट्री का पुनर्निर्माण करता है और उसकी जड़ लौटाता है। यह बाद की कॉल के लिए रूट को पंजीकृत नहीं करता है। <code>hydrate()</code> की तरह, यह उम्मीद करता है कि रूट <code>parent</code> में पहला नोड होगा। यदि पहले नोड में एक अलग टैग है, तो उसे बदल दिया जाता है।</p>
      <p>सर्वर पर, <code>forceUpdate()</code> कुछ नहीं करता है।</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "रेंडरिंग",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>आपका ट्री बनाता है और उसके मूल तत्व को <code>parent</code> में जोड़ता है। <code>parent</code> डिफ़ॉल्ट रूप से <code>document.body</code> है। यह मूल तत्व लौटाता है।</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>आप घटक (<code>render(App)</code>) या इसे लौटाने वाले बिल्डर (<code>render(App())</code>) को पास कर सकते हैं। DOM वही है. केवल <code>render(App)</code> <a href="#api-force-update"><code>forceUpdate()</code></a> को बाद में रूट का पुनर्निर्माण करने देता है, इसलिए इसे प्राथमिकता दें।</li>
        <li>यह जुड़ता है। यह <code>parent</code> को साफ़ नहीं करता है, इसलिए इसे दो बार कॉल करने से दो प्रतियां जुड़ जाती हैं।</li>
        <li><code>render()</code> के वापस आने पर ट्री में प्रत्येक <code>onMount</code> चल चुका होता है।</li>
        <li>दस्तावेज़ में मौजूद तत्व में प्रस्तुत करें। <a href="#api-update"><code>update()</code></a> देखें।</li>
        <li>रूट एक तत्व होना चाहिए, जैसे <code>div(...)</code>, <code>when()</code> या <code>list()</code> नहीं।</li>
        <li><code>index</code> आंतरिक है। यह यह नहीं चुनता कि तत्व कहाँ डाला गया है। उसे छोड़ दो।</li>
      </ul>
      <p><code>render(App)</code> के रूप में पारित एक घटक को कोई पैरामीटर नहीं लेना चाहिए। एक आवश्यक पैरामीटर एक प्रकार की त्रुटि है. एक वैकल्पिक टाइप-चेक करता है, लेकिन <code>render()</code> रनटाइम पर थ्रो करता है। एक घटक लपेटें जो प्रॉप्स लेता है:</p>
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
      <p>ने <a href="#api-ssr"><code>renderToString()</code></a> द्वारा निर्मित HTML का अधिग्रहण किया। यह मौजूदा तत्वों का पुन: उपयोग करता है, ईवेंट श्रोताओं को जोड़ता है, और गतिशील मान, <code>when()</code> और <code>list()</code> को जोड़ता है, इसलिए <code>update()</code> बाद में काम करता है। फिर यह <code>onMount</code> हुक चलाता है। <code>parent</code> डिफ़ॉल्ट रूप से <code>document.body</code> है। यह मूल तत्व लौटाता है।</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>सर्वर के समान घटक और समान डेटा का उपयोग करें।</li>
        <li>एक समर्पित कंटेनर में हाइड्रेट करें। ऐप का रूट उसका पहला नोड होना चाहिए, हालांकि व्हाइटस्पेस ठीक है। यदि कोई अन्य नोड पहले आता है, तो Nuclo उस नोड को बदल देता है और सर्वर कॉपी को पीछे छोड़ देता है।</li>
        <li><code>render()</code> की तरह, <code>App</code> पास करें, <code>App()</code> नहीं, इसलिए <code>forceUpdate()</code> बाद में रूट को फिर से बना सकता है। <code>App</code> को कोई पैरामीटर नहीं लेना चाहिए। एक वैकल्पिक के साथ, <code>hydrate()</code> चुपचाप कुछ भी नहीं जोड़ता है। एक घटक लपेटें जो प्रॉप्स लेता है: <code>hydrate(() =&gt; Page(props), root)</code>।</li>
        <li>यदि कोई सर्वर HTML नहीं है, तो <code>render()</code> का उपयोग करें।</li>
      </ul>
      <h3>जब सर्वर और क्लाइंट भिन्न होते हैं</h3>
      <p>ग्राहक जीतता है:</p>
      <ul>
        <li>एक अलग रूट टैग: उस नोड को ताज़ा DOM से बदल दिया गया है। एक खाली कंटेनर: ताज़ा DOM जोड़ा गया है।</li>
        <li>अलग पाठ पैच किया गया है। विभिन्न <code>list()</code> आइटम और <code>when()</code> शाखाएँ ग्राहक का अनुसरण करती हैं।</li>
        <li>अतिरिक्त सर्वर चिल्ड्रेन हटा दिए जाते हैं, और गायब चिल्ड्रन बनाए जाते हैं।</li>
        <li>विशेषताएँ जो सर्वर ने लिखीं लेकिन क्लाइंट ने सेट नहीं कीं, उन्हें वैसे ही छोड़ दिया गया है।</li>
      </ul>
      <p><code>renderToString()</code> HTML टिप्पणियों को मार्कर के रूप में लिखता है, जैसे प्रत्येक टेक्स्ट नोड से पहले <code>&lt;!-- text-0 --&gt;</code>। <code>hydrate()</code> को उनकी आवश्यकता है, इसलिए सर्वर HTML से टिप्पणियाँ न हटाएँ। मार्करों के बिना, हाइड्रेशन <code>list()</code> पंक्तियों को हटा देता है, और <code>list()</code> और <code>when()</code> अपडेट करना बंद कर देते हैं।</p>
    `,
      },
      {
        id: "api-ssr",
        title: "सर्वर रेंडरिंग",
        content: `
      <p>सर्वर पर एक घटक को HTML स्ट्रिंग में प्रस्तुत करें। ब्राउज़र में, उस HTML को इंटरैक्टिव बनाने के लिए उसी घटक के साथ <a href="#api-hydrate"><code>hydrate()</code></a> पर कॉल करें। सर्वर रनटाइम में कोई <code>document</code> नहीं है, इसलिए पहले <a href="#api-polyfill"><code>nuclo/polyfill</code></a> आयात करें।</p>
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
      <p>स्टाइल टैग पर <code>id="nuclo-styles"</code> रखें। क्लाइंट उस तत्व का पुन: उपयोग करता है और केवल नए नियम जोड़ता है। <a href="#api-css-text"><code>getCssText()</code></a> देखें।</p>
      <h3>सर्वर पर क्या चलता है</h3>
      <ul>
        <li>प्रत्येक <code>renderToString()</code> कॉल ट्री बनाता है और प्रत्येक गतिशील मान को एक बार चलाता है।</li>
        <li>इवेंट हैंडलर, <code>onMount</code> और <code>onDestroy</code> कभी नहीं चलते। <code>update()</code>, <code>scope()</code> और <code>forceUpdate()</code> कुछ नहीं करते।</li>
        <li>रेंडरिंग सिंक्रोनस है। पहले अपना डेटा लोड करें, फिर रेंडर करें।</li>
        <li>रेंडर के बाद कुछ भी पंजीकृत नहीं रहता है, इसलिए एक प्रक्रिया कई अनुरोधों को पूरा कर सकती है। अनुरोध डेटा को तर्क के रूप में पास करें, जैसे <code>renderToString(Page(user))</code>। मॉड्यूल-स्तरीय चर सभी अनुरोधों द्वारा साझा किए जाते हैं।</li>
        <li>सर्वर पर <code>render()</code> को कॉल न करें। यह साझा <code>document.body</code> से जुड़ता है।</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>एक बिल्डर (<code>App()</code>), एक घटक (<code>App</code>) या एक DOM नोड लेता है। <code>null</code> और <code>undefined</code> <code>""</code> लौटाते हैं। जड़ एक तत्व होना चाहिए. <code>renderToString(Page)</code> के रूप में पारित घटक को कोई पैरामीटर नहीं लेना चाहिए, इसलिए डेटा लेने वाले घटक के लिए <code>Page(user)</code> पास करें।</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>टेक्स्ट और विशेषता मान HTML-एस्केप्ड हैं। <code>script()</code> और <code>style()</code> के अंदर टेक्स्ट वैसे ही लिखा गया है, केवल क्लोजिंग टैग टूटे हुए हैं, इसलिए वहां कभी भी यूजर इनपुट न डालें।</li>
        <li>यह फेंकता नहीं है। यदि घटक, एक <code>list()</code> फ़ंक्शन या एक <code>when()</code> स्थिति विफल हो जाती है, या पॉलीफ़िल गायब है, तो यह त्रुटि लॉग करता है और <code>""</code> लौटाता है। यदि अनुरोध विफल हो जाए तो खाली परिणाम की जाँच करें। एक टेक्स्ट या विशेषता फ़ंक्शन जो फेंकता है वह केवल खाली प्रस्तुत करता है।</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p><code>inputs.map(renderToString)</code> के समान।</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>आउटपुट को एक तत्व में लपेटता है। <code>containerTag</code> डिफ़ॉल्ट रूप से <code>"div"</code> पर और <code>containerAttrs</code> पर डिफ़ॉल्ट रूप से <code>{}</code> पर सेट होता है। विशेषता मान बच गए हैं. गुण नाम दिए गए अनुसार लिखे गए हैं, इसलिए <code>class</code> जैसे HTML नामों का उपयोग करें। उपयोगकर्ता इनपुट को कभी भी टैग के रूप में पास न करें.</p>
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
      <p>एक छोटा DOM ताकि Nuclo नोड और बन में ट्री बना सके। अपने पहले रेंडर से पहले इसे एक बार आयात करें। अधिकांश ऐप्स को केवल साधारण आयात की आवश्यकता होती है।</p>
      <ul>
        <li>जब कोई <code>window</code> नहीं होता है, तो यह <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> और <code>HTMLElement</code> सेट करता है, लेकिन केवल वे जो गायब हैं। यह <code>window</code> नहीं बनाता है.</li>
        <li>किसी ब्राउज़र में, या jsdom के अंतर्गत, यह कुछ नहीं करता है।</li>
        <li><code>Event</code> और <code>CustomEvent</code> रनटाइम के स्वयं के कंस्ट्रक्टर हैं। <code>Node</code>, <code>Element</code> और <code>HTMLElement</code> पॉलीफ़िल क्लास के उपनाम हैं।</li>
      </ul>
      <p>यह ट्री बनाने के लिए DOM है, ब्राउज़र नहीं। इसमें कोई <code>innerHTML</code> नहीं है और कोई <code>getElementById</code> नहीं है, <code>querySelector()</code> रिटर्न <code>null</code> है, और इवेंट श्रोताओं को नजरअंदाज कर दिया जाता है। HTML प्राप्त करने के लिए <code>renderToString()</code> का उपयोग करें।</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
