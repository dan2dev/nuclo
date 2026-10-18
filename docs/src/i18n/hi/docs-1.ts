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
        title: "Overview",
        content: `
      <p>Nuclo TypeScript के लिए एक छोटी DOM library है। आप <code>div()</code> और <code>button()</code> जैसे आम functions से पेज बनाते हैं, state को सादे variables में रखते हैं, और पेज बदलना हो तो <code>update()</code> कॉल कर देते हैं।</p>
      <p>Nuclo में न virtual DOM है, न compiler, न proxy और न signals।</p>
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
      <h3>Mental model</h3>
      <ol>
        <li>Tag builders से UI बनाइए।</li>
        <li>जो भी value state पर निर्भर है, उसके लिए एक function पास कीजिए।</li>
        <li>State को सादे JavaScript से बदलिए।</li>
        <li><code>update()</code> कॉल कीजिए। Nuclo functions को दोबारा चलाता है और DOM को patch कर देता है।</li>
      </ol>
      <p>सिर्फ़ variable बदलने से DOM पर कोई असर नहीं पड़ता। पेज तभी बदलता है जब आप <code>update()</code> कॉल करते हैं।</p>
    `,
      },
      {
        id: "quick-start",
        title: "Quick start",
        content: `
      <p><code>create-nuclo</code> एक Vite + TypeScript project बना देता है जो Nuclo के लिए पहले से सेट है:</p>
    `,
        afterContent: `
      <p>यह आपसे project का नाम पूछता है। prompt skip करना हो तो नाम और flags सीधे दे दीजिए। npm में flags से पहले <code>--</code> लगाना पड़ता है:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>फिर dependencies install कीजिए और dev server चालू कीजिए:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Options</h3>
      <ul>
        <li><code>[project-name]</code>: project का folder। default <code>nuclo-app</code> है।</li>
        <li><code>-t, --template &lt;name&gt;</code>: कौन सा template कॉपी करना है। अभी सिर्फ़ <code>basic</code> है।</li>
        <li><code>-y, --yes</code>: कोई prompt नहीं दिखाता, defaults इस्तेमाल करता है।</li>
        <li><code>-f, --force</code>: खाली न होने पर भी उसी folder में लिख देता है।</li>
        <li><code>-h, --help</code>: help दिखाता है।</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Installation और imports",
        content: `
      <p>पहले से बने project में Nuclo जोड़ने के लिए:</p>
      ${sh("npm install nuclo")}
      <p>चाहें तो <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> या <code>bun add nuclo</code> भी चलेगा। Nuclo की कोई dependency नहीं है।</p>
      <p>Routing core package में नहीं आती। वह अलग package <a href="#router-overview"><code>nuclo-router</code></a> में है, जिसे ज़रूरत हो तो <code>nuclo</code> के साथ install कर लीजिए।</p>
      <h3>Globals</h3>
      <p><code>import 'nuclo'</code> ये सब <code>globalThis</code> पर रख देता है:</p>
      <ul>
        <li><strong>175 tag builders</strong>: HTML के 112 (<code>div</code>, <code>span</code>, <code>button</code>, ...) और SVG के 63, जिनके नाम में <code>Svg</code> suffix लगता है (<code>svgSvg</code>, <code>pathSvg</code>,…)। <a href="#tag-builders">Tag builders</a> देखिए।</li>
        <li><strong>16 helpers</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> और <code>globalStyle</code>।</li>
      </ul>
      <p>यह import उस हर कोड से पहले चलना चाहिए जो builders को कॉल करता है। ES modules import के क्रम में चलते हैं, इसलिए नीचे वाला कोड फ़ेल हो जाएगा:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>अपनी entry file में <code>import 'nuclo'</code> सबसे ऊपर रखिए, या जिस भी file में globals इस्तेमाल हों, उसमें इसे import कर लीजिए।</p>
      <h3>Named imports</h3>
      <p>Helpers को named exports की तरह भी import किया जा सकता है। ये वही functions हैं जो globals में हैं। <code>getCssText()</code> और <code>resetStyles()</code> सिर्फ़ named exports के रूप में मिलते हैं। Tag builders सिर्फ़ global हैं, इसलिए <code>import { div } from 'nuclo'</code> काम नहीं करेगा।</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Entry points</h3>
      <ul>
        <li><code>nuclo</code>: globals register करता है और 16 helpers के साथ <code>getCssText</code> और <code>resetStyles</code> भी export करता है।</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> और <code>getCssText</code>। <a href="#api-ssr">Server rendering</a> देखिए।</li>
        <li><code>nuclo/polyfill</code>: Node और Bun के लिए एक छोटा DOM। <a href="#api-polyfill">nuclo/polyfill</a> देखिए।</li>
        <li><code>nuclo/types</code>: सिर्फ़ types। <a href="#typescript-setup">TypeScript</a> देखिए।</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo अपने types के साथ आता है। आपको बस दो चीज़ें चाहिए:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>। <code>node16</code> और <code>nodenext</code> अभी supported नहीं हैं।</li>
        <li><code>DOM</code> lib। अगर आपने <code>lib</code> सेट नहीं किया है, तो TypeScript इसे अपने आप शामिल कर लेता है।</li>
      </ul>
      <p>अगर project की कोई भी file <code>'nuclo'</code> import करती है, तो हर file को global types दिखने लगते हैं। इसके अलावा कुछ और नहीं चाहिए। अगर कोई file इसे import नहीं करती (जैसे tests के लिए अलग tsconfig में), तो types खुद जोड़ दीजिए:</p>
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
      <p>या किसी <code>.d.ts</code> file में <code>/// &lt;reference types="nuclo/types" /&gt;</code> डाल दीजिए।</p>
      <h3>काम के types</h3>
      <p>ये types global हैं, इसलिए इन्हें बिना import किए इस्तेमाल कर सकते हैं:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: tag builder का return type। component का return type लिखने में इसे इस्तेमाल कीजिए।</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: tag builder के argument के रूप में जो कुछ भी चल सकता है।</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: <code>render()</code> और <code>hydrate()</code> जो लौटाते हैं।</li>
        <li><code>ElementTagName</code>: कोई भी HTML tag name।</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: वह attributes object जो tag builder लेता है, जिसमें <code>on*</code> handlers, <code>onMount</code> और <code>onDestroy</code> भी आते हैं। जो components attributes आगे pass करते हैं, उनमें इसका इस्तेमाल कीजिए।</li>
        <li><code>MountCallback</code> और <code>DestroyCallback</code>: <code>onMount</code> और <code>onDestroy</code> handlers।</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: <code>when()</code> और <code>list()</code> जो लौटाते हैं।</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: <code>region()</code> के options।</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> और बाकी style types। इन्हें आप import भी कर सकते हैं: <code>import type { StyleResult } from 'nuclo'</code>।</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> में DOM के सारे members optional होते हैं। पूरा element type चाहिए तो cast कर लीजिए: <code>render(App, root) as HTMLDivElement</code>।</p>
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
        title: "Tag builders",
        content: `
      <p>हर HTML tag एक global function है, जिसका नाम tag जैसा ही है: <code>div</code>, <code>span</code>, <code>input</code>, ... बस एक अपवाद है: <code>&lt;var&gt;</code> का function <code>var_</code> है, क्योंकि <code>var</code> reserved word है। हर SVG tag के नाम के आखिर में <code>Svg</code> लगता है: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, ...</p>
      <p>Tag builder कॉल करते ही element नहीं बनता। <code>div('Hi')</code> एक <strong>builder</strong> लौटाता है, यानी ऐसा function जो element बाद में बनाएगा। Nuclo इसे तब कॉल करता है जब आप इसे <code>render()</code> से mount करते हैं, या किसी दूसरे builder, <code>when()</code> या <code>list()</code> के अंदर रखते हैं। हर बार इस्तेमाल पर नया element बनता है।</p>
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
      <h3>Arguments</h3>
      <p>Builder कितने भी arguments ले सकता है और उन्हें बाएँ से दाएँ apply करता है:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: एक text node।</li>
        <li><strong><code>() =&gt; value</code></strong>: ऐसा text जो <code>update()</code> पर बदलता है। <a href="#dynamic-functions">Dynamic values</a> देखिए।</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: ignore हो जाते हैं।</li>
        <li><strong><code>true</code>, <code>false</code></strong>: "true" या "false" text की तरह render होते हैं। Conditions के लिए <code>when()</code> इस्तेमाल कीजिए।</li>
        <li><strong>सादा object</strong>: attributes। <a href="#attributes">Attributes</a> देखिए।</li>
        <li><strong><code>css()</code>, <code>cx()</code> या <code>variants()</code> का result</strong>: अपनी class जोड़ देता है।</li>
        <li><strong><code>on(...)</code></strong>: event listener या lifecycle hook।</li>
        <li><strong>कोई दूसरा builder, <code>when()</code> या <code>list()</code></strong>: child node।</li>
        <li><strong>DOM <code>Node</code></strong>: जैसा है वैसा ही जुड़ जाता है।</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: custom modifier। नीचे देखिए।</li>
      </ul>
      <h3>इन बातों का ध्यान रखिए</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> "false" text render कर देता है। इसकी जगह <code>div(when(() =&gt; isAdmin, span('Admin')))</code> लिखिए।</li>
        <li>Arrays child node नहीं होते। उन्हें spread कीजिए: <code>ul(...names.map((n) =&gt; li(n)))</code>। जो lists बदलती रहती हैं, उनके लिए <code>list()</code> इस्तेमाल कीजिए।</li>
        <li>tag के नाम वाला local variable builder को shadow कर देता है। <code>function Row(label: string)</code> के अंदर <code>label(...)</code> कॉल नहीं हो सकता। <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> और <code>i</code> जैसे local नाम बदल दीजिए।</li>
        <li>Browsers हर <code>id</code> वाले element को global variable की तरह भी expose करते हैं। Nuclo load होने से पहले पेज में <code>&lt;main id="main"&gt;</code> मौजूद है, तो Nuclo उस global को वैसा ही छोड़ देता है, और <code>main(...)</code> कॉल करने पर <code>TypeError</code> आता है। कोई और id रखिए।</li>
      </ul>
      <h3>Custom modifiers</h3>
      <p>जो function कम से कम एक parameter declare करता है, वह element बनते समय arguments के क्रम में एक बार चलता है। पहला argument element होता है। दूसरा internal index है, इसलिए उस पर भरोसा मत कीजिए। string या number लौटाने पर वह text बन जाता है। <code>Node</code> लौटाने पर वह जुड़ जाता है। object लौटाने पर उसे attributes की तरह apply किया जाता है।</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Element तक पहुँचना</h3>
      <p><code>render()</code> root element लौटाता है। tree के अंदर <code>on("mount", (el) =&gt; …)</code> या custom modifier इस्तेमाल कीजिए। चाहें तो document से अलग (detached) element बनाने के लिए builder function को खुद भी कॉल कर सकते हैं:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>इसे अगले <code>update()</code> से पहले document में जोड़ दीजिए। <code>update()</code> चलते समय जो node document में नहीं है, वह हमेशा के लिए update होना बंद कर देता है।</p>
      <h3>SVG</h3>
      <p>SVG builders भी यही arguments लेते हैं। Nuclo हर SVG attribute <code>setAttribute</code> से सेट करता है, इसलिए <code>"stroke-width"</code> जैसे नाम ज्यों के त्यों काम करते हैं।</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>सारे builders</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Components",
        content: `
      <p>Component बस एक आम function है जो builder लौटाता है, जैसे <code>button(...)</code>। कोई अलग component API नहीं है। जब तक आप इसे render नहीं करते या tree में नहीं रखते, कुछ नहीं बनता।</p>
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
      <p>Function के अंदर declare किया गया state उसी instance का अपना होता है। बाहर declare किया गया state सब instances में shared रहता है। <code>forceUpdate()</code> components को दोबारा कॉल करता है, इसलिए उनके अंदर declare किया गया state reset हो जाता है।</p>
      <p>Children सिर्फ़ arguments होते हैं:</p>
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
        title: "Attributes",
        content: `
      <p>Attributes सेट करने के लिए एक सादा object पास कीजिए। एक से ज़्यादा objects भी पास हो सकते हैं। एक ही key पर बाद वाली value जीतती है। <code>className</code> और <code>style</code> अपवाद हैं: इनकी values merge होती हैं। Value static हो सकती है, या बिना parameter वाला function, जो हर <code>update()</code> पर दोबारा चलता है।</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Value कैसे सेट होती है</h3>
      <ul>
        <li>HTML element में उस नाम की property है (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>,…) तो Nuclo property सेट करता है। नहीं तो वह <code>setAttribute(key, String(value))</code> कॉल करता है, जैसे <code>"aria-*"</code> और <code>"data-*"</code> के लिए।</li>
        <li>SVG elements पर Nuclo हमेशा <code>setAttribute</code> कॉल करता है।</li>
        <li><code>null</code> और <code>undefined</code> ignore होते हैं। जो dynamic value <code>null</code> या <code>undefined</code> लौटाती है, उसकी पुरानी value बनी रहती है। value साफ़ करने के लिए <code>""</code> लौटाइए, या boolean property के लिए <code>false</code>।</li>
        <li>Boolean values DOM की boolean properties पर काम करती हैं, जैसे button पर <code>disabled</code>, <code>checked</code>, <code>hidden</code> और <code>required</code>। बाकी जगह <code>true</code> और <code>false</code> string "true" और "false" बनकर लिखे जाते हैं।</li>
        <li><code>"data-*"</code> keys इस्तेमाल कीजिए। <code>dataset</code> supported नहीं है।</li>
        <li><code>innerHTML</code> escape नहीं होता, और server rendering इसे output भी नहीं करती। इससे बचिए।</li>
      </ul>
      <h3>Classes</h3>
      <p><code>className</code> इस्तेमाल कीजिए। Static class strings, <code>css()</code> के results और dynamic <code>className</code>, सब merge हो जाते हैं। Dynamic <code>className</code> static classes को रखता है, और <code>""</code> लौटाने पर सिर्फ़ static classes बचती हैं।</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>HTML elements पर <code>class</code> key इस्तेमाल मत कीजिए। यह attribute सीधे सेट करती है और पहले से लगी सारी classes बदल देती है, <code>css()</code> की class भी।</p>
      <h3>Inline styles</h3>
      <p><code>style</code> camelCase keys वाला object लेता है, या ऐसा function जो object लौटाए।</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo कोई unit नहीं जोड़ता। <code>"12px"</code> लिखिए, <code>12</code> नहीं। <code>opacity</code> और <code>zIndex</code> जैसी unitless properties numbers ले लेती हैं।</li>
        <li><code>""</code>, <code>null</code> और <code>undefined</code> property को साफ़ कर देते हैं।</li>
        <li>Dynamic style सिर्फ़ वही keys सेट करती है जो वह लौटाती है। जो key लौटना बंद कर दे, उसकी पुरानी value बनी रहती है, इसलिए उसे साफ़ करने के लिए <code>""</code> लौटाइए।</li>
        <li>Style strings (<code>"color: red"</code>) और custom properties (<code>"--gap"</code>) supported नहीं हैं। इनके लिए <code>css()</code> इस्तेमाल कीजिए। यह custom properties <a href="#style-objects"><code>raw</code></a> से लेता है।</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Events",
        content: `
      <p>Events सुनने के दो तरीके हैं: <code>on*</code> attributes और <code>on()</code> modifier।</p>
      <h3><code>on*</code> attributes</h3>
      <p>Attributes object में <code>onClick</code> जैसी key (<code>on</code> के बाद capital letter) पर रखा function event handler होता है, dynamic value नहीं।</p>
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
        <li>TypeScript key और element से event type खुद समझ लेता है। <code>e.currentTarget</code> और <code>this</code> दोनों element हैं।</li>
        <li>Nuclo native property सेट करता है, इसलिए <code>onClick</code> असल में <code>el.onclick</code> बन जाता है। हर event पर एक ही handler रहता है: बाद वाला <code>onClick</code> पहले वाले की जगह ले लेता है।</li>
        <li><code>onDoubleClick</code> और <code>onDblClick</code> दोनों का मतलब <code>dblclick</code> है। <code>onclick</code> जैसी lowercase keys type error देती हैं।</li>
        <li>जो नाम जाना-पहचाना event नहीं है, उसका lowercase रूप सुना जाता है: <code>onMyEvent</code> <code>"myevent"</code> को सुनता है।</li>
        <li>Handler के throw किए errors catch नहीं होते।</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> एक modifier लौटाता है जो element पर <code>addEventListener</code> कॉल करता है।</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>हर <code>on()</code> एक listener जोड़ता है। सब क्रम से चलते हैं।</li>
        <li><code>options</code> सीधे <code>addEventListener</code> को जाता है: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>।</li>
        <li><code>on()</code> को सीधे builder में पास कीजिए तो element type अपने आप पता चल जाता है: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>।</li>
        <li>कोई listener error throw करे तो Nuclo उसे <code>console.error</code> से log करता है, और बाकी listeners फिर भी चलते हैं।</li>
        <li>Element हटते समय Nuclo listener भी हटा देता है। Server पर <code>on()</code> कुछ नहीं करता।</li>
        <li>एक <code>on()</code> value को आप कई elements पर दोबारा इस्तेमाल कर सकते हैं।</li>
      </ul>
      <p>Custom event के लिए event type को generic parameter में पास कीजिए:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>कौन सा इस्तेमाल करें</h3>
      <p>आम मामलों में <code>on*</code> attributes ठीक हैं। एक event पर कई listeners चाहिए, listener options चाहिए, या <code>"my-event"</code> जैसा custom event name चाहिए, तो <code>on()</code> इस्तेमाल कीजिए।</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Lifecycle",
        content: `
      <p><code>onMount</code> element जुड़ने के बाद एक बार चलता है। <code>onDestroy</code> तब एक बार चलता है जब Nuclo element को हटाता है। इन्हें attributes की तरह लिखिए या <code>on()</code> से। दोनों तरीके एक जैसे चलते हैं, और element का type उसके tag से तय होता है।</p>
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
      <h3>ये कब चलते हैं</h3>
      <ul>
        <li><code>onMount</code> उस <code>render()</code>, <code>hydrate()</code>, <code>update()</code> या <code>forceUpdate()</code> call के आख़िर में चलता है जिसने element डाला था। Tree बनने के दौरान यह कभी नहीं चलता।</li>
        <li><code>onMount</code> कोई function लौटाए, तो वह element हटने पर उसके <code>onDestroy</code> callbacks के बाद चलता है।</li>
        <li><code>onDestroy</code> तब चलता है जब Nuclo element हटाता है: <code>list()</code> की कोई row हट जाए, <code>when()</code> की branch बदल जाए, <code>into()</code> अपना region छोड़ दे, या <code>forceUpdate()</code> उसे छोड़ दे। यह हटाने से ठीक पहले चलता है, इसलिए element तब भी document में होता है।</li>
      </ul>
      <h3>DOM सीधे हटाना</h3>
      <p>आप <code>node.remove()</code> या <code>innerHTML = ''</code> से खुद element हटाएँगे, तो उसका <code>onDestroy</code> और cleanup कभी नहीं चलेंगे, और timers चलते रहेंगे। Nuclo में <code>unmount()</code> नहीं है। Cleanup चलाते हुए app हटाना हो तो उसे <code>when()</code> में लपेट दीजिए:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Order और errors</h3>
      <ul>
        <li>जितने चाहें उतने hooks register कर सकते हैं, किसी भी तरीके से। वे register होने के क्रम में चलते हैं।</li>
        <li><code>onDestroy</code> hooks हमेशा पहले children पर चलते हैं, फिर parent पर।</li>
        <li>Elements अपने पहले <code>onMount</code> hook के क्रम में mount होते हैं, जो arguments के क्रम पर चलता है, और हर element अपने सारे hooks एक साथ चलाता है। Children parent पर निर्भर हों, तो parent का modifier children से पहले लिखिए।</li>
        <li>Hook error throw करे तो उसे <code>console.error</code> से log किया जाता है। बाकी hooks फिर भी चलते हैं।</li>
        <li>Callback को कुछ नहीं, या cleanup function लौटाना चाहिए, इसलिए इसे <code>async</code> मत बनाइए। लौटाया गया Promise cleanup की तरह इस्तेमाल नहीं होता। Async काम इसके अंदर शुरू कीजिए: <code>{ onMount: (el) =&gt; { void load(el) } }</code>।</li>
        <li>Hooks server पर कभी नहीं चलते। Client पर वे <code>hydrate()</code> के बाद चलते हैं।</li>
      </ul>
      <div class="docs-callout"><strong>ध्यान दीजिए:</strong> Hooks effects नहीं हैं। State बदलने पर वे दोबारा नहीं चलते। हर hook हर element के लिए ज़्यादा से ज़्यादा एक बार चलता है।</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "Updates",
    sections: [
      {
        id: "explicit-updates",
        title: "Explicit updates",
        content: `
      <p>Nuclo पेज को कभी अपने आप update नहीं करता। अपना state बदलिए, फिर <code>update()</code> कॉल कीजिए।</p>
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
      <p>जितना चाहें state बदलिए, फिर एक बार <code>update()</code> कॉल कर दीजिए:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p><code>update()</code> को event handler, timer, fetch callback या <code>onMount</code> से कॉल कीजिए। dynamic value के अंदर से इसे कॉल मत कीजिए।</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Dynamic values",
        content: `
      <p><strong>बिना parameter</strong> वाला function एक <strong>dynamic value</strong> होता है। Nuclo element बनाते समय इसे एक बार चलाता है, और फिर हर <code>update()</code> पर। Text children, attribute values, <code>style</code> और <code>className</code> के लिए dynamic values इस्तेमाल कीजिए। जो children दिखते, गायब होते या दोहराए जाते हैं, उनके लिए <a href="#api-when"><code>when()</code></a> और <a href="#api-list"><code>list()</code></a> हैं।</p>
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
      <p>Nuclo parameters की गिनती (<code>fn.length</code>) देखता है। जो function parameter declare करता है, वह <a href="#tag-builders">custom modifier</a> है और सिर्फ़ एक बार चलता है। <code>(x = 0) =&gt; …</code> और <code>(...args) =&gt; …</code> की length 0 होती है, इसलिए ये dynamic माने जाते हैं।</p>
      <h3>Dynamic text</h3>
      <ul>
        <li>string, number, bigint या boolean <code>String(value)</code> बनकर render होता है। <code>() =&gt; ok &amp;&amp; 'Saved'</code> "false" दिखा देगा, इसलिए <code>() =&gt; (ok ? 'Saved' : '')</code> लिखिए।</li>
        <li><code>null</code> और <code>undefined</code> खाली text की तरह render होते हैं।</li>
        <li>पहली बार चलने पर जो function <code>css()</code> या <code>cx()</code> का result लौटाए, वह text नहीं बल्कि dynamic class बन जाता है। <a href="#api-cx"><code>cx()</code></a> देखिए।</li>
        <li>node, builder, array या सादा object कुछ भी render नहीं करता, और कभी update भी नहीं होता।</li>
      </ul>
      <h3>Dynamic attributes</h3>
      <ul>
        <li>Nuclo value तभी लिखता है जब वह उसकी पिछली लिखी value से अलग हो। तुलना मौजूदा DOM से नहीं होती। इसलिए user input में कुछ टाइप करे और function पहले वाली ही value लौटाए, तो टाइप किया text बना रहता है।</li>
        <li><code>null</code> या <code>undefined</code> का result कुछ नहीं लिखता, इसलिए पुरानी value बनी रहती है। <code>className</code> अपवाद है: कोई भी falsy result dynamic class हटा देता है और static classes रखता है।</li>
        <li><code>style</code> function हर update पर लौटाया हुआ object apply करता है।</li>
      </ul>
      <h3>Errors</h3>
      <p>Dynamic value error throw करे, तो Nuclo उसे पकड़ लेता है और बाकी update चलता रहता है। Text खाली हो जाता है या पिछली value रखता है। Attribute पिछली value रखता है। अगला सफल <code>update()</code> दोनों को ठीक कर देता है। एक अपवाद: text function अपने <strong>पहले</strong> run में throw करे, तो वह हमेशा खाली रहता है।</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>पेज की हर dynamic value पर एक synchronous pass चलाता है। id देने पर यह सिर्फ़ उन elements के अंदर की values update करता है जिन्हें <a href="#api-scope"><code>scope()</code></a> id से mark किया गया है। हर pass ये steps क्रम से चलाता है:</p>
      <ol>
        <li><code>list()</code>: items दोबारा पढ़ता है और rows जोड़ता, खिसकाता या हटाता है।</li>
        <li><code>when()</code>: conditions फिर से जाँचता है। Branch तभी दोबारा बनती है जब कोई दूसरी branch active हो जाए।</li>
        <li>Dynamic attributes, जिनमें <code>style</code> और <code>className</code> भी हैं।</li>
        <li>Dynamic text।</li>
        <li>Step 1 और 2 में जुड़े elements के <code>onMount</code> hooks।</li>
      </ol>
      <ul>
        <li><strong>यह सब कुछ चलाता है।</strong> हर dynamic value हर call पर चलती है, चाहे उसका data बदला हो या नहीं। जिन values में बदलाव नहीं होता, वे DOM में दोबारा नहीं लिखी जातीं। Dynamic values को तेज़ रखिए और उनमें side effects मत रखिए।</li>
        <li><strong>सिर्फ़ document में मौजूद nodes।</strong> <code>update()</code> चलते समय कोई node document में नहीं है, तो Nuclo उसे track करना बंद कर देता है। बाद में आप उसे जोड़ भी दें, तब भी वह दोबारा update नहीं होता। यह <code>list()</code> और <code>when()</code> पर भी लागू होता है। इसलिए ऐसे container में render कीजिए जो document में हो।</li>
        <li><strong>Static values कभी नहीं बदलतीं।</strong> Element बनते ही सादे strings और attribute values तय हो जाते हैं। उन्हें दोबारा बनाना हो तो <a href="#api-force-update"><code>forceUpdate()</code></a> इस्तेमाल कीजिए।</li>
        <li><strong>Errors।</strong> Text और attribute के errors पकड़ लिए जाते हैं, और pass चलता रहता है। किसी <code>when()</code> की condition error throw करे, तो error log होता है और वह <code>when()</code> update होना बंद कर देता है। <code>list()</code> का <code>items</code> या <code>renderItem</code> function error throw करे, तो वह <code>update()</code> से बाहर निकल जाता है और बाकी steps नहीं चलते।</li>
        <li><strong>Server।</strong> <code>update()</code> server पर कुछ नहीं करता।</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>जिस element को यह पास किया जाए, उसे एक या ज़्यादा scope ids देता है। फिर <code>update('id')</code> सिर्फ़ उसी element के अंदर का हिस्सा update करता है, element के अपने attributes समेत।</p>
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
        <li>एक element की कई ids हो सकती हैं: <code>scope('cart', 'sidebar')</code>।</li>
        <li><code>update('a', 'b')</code> <code>a</code> या <code>b</code> के अंदर का सब कुछ update करता है। कई elements की id एक ही हो, तो वे सब update होते हैं।</li>
        <li>Nested scopes में <code>update('outer')</code> अंदर वाले scope को भी शामिल करता है। <code>update('inner')</code> बाहर वाले हिस्से को नहीं छूता।</li>
        <li>id किसी भी element पर नहीं है, तो <strong>कुछ भी</strong> update नहीं होता और कोई error भी नहीं आता। इसलिए id की spelling दोबारा जाँच लीजिए।</li>
        <li><code>scope()</code> server पर कुछ नहीं करता।</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>किसी condition के आधार पर content render करता है। Nuclo हर <code>update()</code> पर conditions दोबारा जाँचता है। पहली सही condition चुनी जाती है। कोई भी सही न हो, तो <code>.else()</code> का content render होता है। <code>.else()</code> न हो तो कुछ render नहीं होता।</p>
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
      <h3>Conditions</h3>
      <ul>
        <li>State के लिए function पास कीजिए। सादा boolean सिर्फ़ एक बार पढ़ा जाता है: <code>when(open, …)</code> कभी नहीं बदलेगा।</li>
        <li>TypeScript में function को boolean लौटाना होगा। <code>() =&gt; items.length &gt; 0</code> या <code>() =&gt; user != null</code> लिखिए।</li>
      </ul>
      <h3>क्या update होता है</h3>
      <ul>
        <li>जब तक एक ही branch active रहती है, उसके elements बने रहते हैं। उसके अंदर की dynamic values, lists और <code>when()</code> blocks update होते रहते हैं।</li>
        <li>दूसरी branch active होते ही पुराना content हट जाता है और उसके <code>onDestroy</code> hooks चलते हैं। नई branch शुरू से बनती है और उसके <code>onMount</code> hooks चलते हैं। पुराने elements का state, जैसे input का text या focus, चला जाता है।</li>
      </ul>
      <h3>Branch का content</h3>
      <p>Branch में children रखिए: text, dynamic text, builders, <code>list()</code> और nested <code>when()</code>। <code>p('Hi')</code> जैसे builders पास कीजिए, DOM nodes नहीं: DOM node अपनी branch एक बार छिपने के बाद update होना बंद कर देता है।</p>
      <p>Attributes objects और <code>on()</code> parent element पर लगते हैं, और branch छिपने के बाद भी बने रहते हैं। Conditional attribute के लिए dynamic attribute इस्तेमाल कीजिए: <code>{ className: () =&gt; (active ? 'active' : '') }</code>।</p>
      <h3>Chaining</h3>
      <p><code>.when()</code> और <code>.else()</code> नया builder लौटाते हैं और original को नहीं बदलते। <code>.else()</code> को दो बार कॉल करें, तो आख़िरी call जीतती है।</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>हर item के लिए एक row render करता है। हर <code>update()</code> पर Nuclo <code>items()</code> को फिर से कॉल करता है और identity (<code>===</code>) के आधार पर नए items को मौजूदा rows से मिलाता है।</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Rows का मिलान कैसे होता है</h3>
      <ul>
        <li>जो item अब भी मौजूद है, उसकी row बनी रहती है। ज़रूरत हो तो Nuclo row को खिसका देता है, और <code>renderItem</code> दोबारा कॉल नहीं करता।</li>
        <li>नए item को नई row मिलती है। हटाए गए item की row चली जाती है, और उसके <code>onDestroy</code> hooks चलते हैं।</li>
        <li>duplicate items में से हर एक को अपनी row मिलती है।</li>
        <li>आप array को वहीं बदल सकते हैं (<code>push</code>, <code>splice</code>, <code>sort</code>) या नया array लौटा सकते हैं।</li>
      </ul>
      <p>जो row बनी रहती है, वह दोबारा render नहीं होती, इसलिए जो fields बदलते हैं उनके लिए dynamic values इस्तेमाल कीजिए:</p>
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
      <p>Copies नए items होते हैं, इसलिए array को <code>todos.map((t) =&gt; ({ ...t }))</code> से बदलने पर हर row दोबारा बनती है।</p>
    `,
        afterContent: `
      <h3><code>renderItem</code> क्या लौटाए</h3>
      <ul>
        <li>कोई element लौटाइए, जैसे <code>li(...)</code>, <code>tr(...)</code> या SVG builder। किसी item को छोड़ना हो तो <code>null</code> या <code>undefined</code> लौटाइए। Strings, text nodes और fragments कुछ render नहीं करते।</li>
        <li><code>when()</code> या <code>list()</code> सीधे return मत कीजिए। उन्हें row element के अंदर रखिए: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>।</li>
        <li>Items छिपाने हों तो <code>items()</code> में filter कीजिए, <code>renderItem</code> में नहीं।</li>
        <li><code>renderItem</code> में side effects मत रखिए। Nuclo एक ही item के लिए इसे एक से ज़्यादा बार कॉल कर सकता है।</li>
      </ul>
      <h3>Index</h3>
      <p><code>index</code> उस समय की position है जब item की row बनी थी। Rows खिसकने पर यह update नहीं होता। मौजूदा position चाहिए तो dynamic value इस्तेमाल कीजिए: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>।</p>
      <h3>Iterables</h3>
      <p>कोई भी iterable चलता है: arrays, <code>Set</code>, generators और <code>map.values()</code>। हर बार वही array या <code>Set</code> लौटाना ठीक है। Iterator, जैसे generator या <code>map.values()</code>, एक pass के बाद ख़त्म हो जाता है, इसलिए इसे हर call पर <code>items()</code> के अंदर बनाइए। <code>Map</code> को सीधे iterate करने पर हर बार नए <code>[key, value]</code> arrays बनते हैं, इसलिए हर row दोबारा बनती है। इसकी जगह <code>map.values()</code> इस्तेमाल कीजिए।</p>
      <h3>Placement</h3>
      <p><code>list()</code> जहाँ लिखा है, उसकी rows वहीं दो comment markers के बीच दिखती हैं। Parent के बाकी children जैसे हैं वैसे रहते हैं। <code>list()</code> SVG builders के अंदर भी चलता है।</p>
    `,
      },
      {
        id: "api-region",
        title: "region() और into()",
        content: `
      <p><code>region()</code> tree में एक named जगह mark करता है। <code>into()</code> उसे कहीं और से, किसी भी depth से भर देता है। Layout को content prop के रूप में नहीं मिलता, और content बनाने वाले component को पता नहीं होता कि वह कहाँ पहुँचेगा।</p>
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
        <li><code>into()</code> जहाँ लिखा है वहाँ सिर्फ़ एक comment छोड़ता है। इसका content region के markers के बीच render होता है।</li>
        <li>क्रम मायने नहीं रखता। region से पहले बना <code>into()</code> इंतज़ार करता है और region बनते ही दिख जाता है। Views उसी क्रम में दिखते हैं जिस क्रम में लिखे गए हैं।</li>
        <li>Content तब तक रहता है जब तक view रहता है। <code>into()</code> रखने वाला <code>when()</code> बंद हो जाए, या उसकी <code>list()</code> row हट जाए, तो content region छोड़ देता है। उसे दोबारा खोलने पर एक copy जुड़ती है, दो नहीं।</li>
        <li>कोई region चला जाए, जैसे उसका <code>when()</code> बंद हो जाए, तो उसके views फिर इंतज़ार में चले जाते हैं। बाद में उसी id से बना region उन्हें दिखा देता है।</li>
        <li>जिस <code>into()</code> की id किसी region से नहीं मिलती, वह कुछ render नहीं करता और error भी नहीं देता। इसलिए id की spelling जाँच लीजिए।</li>
        <li>Ids पूरे tree में unique होती हैं। जिस id का region पहले से live है, उसी id का दूसरा region बनाने पर warning log होती है।</li>
        <li>Regions <a href="#api-ssr">server rendering</a> के साथ चलते हैं। <code>hydrate()</code> पर हर view server से आए HTML को ही इस्तेमाल करता है, उसे दोबारा नहीं बनाता।</li>
      </ul>
      <h3>Options</h3>
      <ul>
        <li><code>id</code>: वह नाम जिससे <code>into()</code> region को ढूँढता है।</li>
        <li><code>type</code>: <code>'latest'</code> (default) सिर्फ़ सबसे नया view दिखाता है। <code>'stack'</code> हर view को आने के क्रम में दिखाता है।</li>
        <li><code>empty</code>: जब इस region में कोई view नहीं होता, तब यह render होता है।</li>
      </ul>
      <h3>Stacked regions</h3>
      <p><code>type: 'stack'</code> में ऊपर नया view खुलने पर नीचे वाला view दोबारा नहीं बनता। उसका DOM, focus और form state बना रहता है। पेज के ऊपर dialog जैसी layers के लिए इसे इस्तेमाल कीजिए।</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>एक साथ कई regions</h3>
      <p>एक <code>into()</code> से कई regions भरने के लिए object पास कीजिए। हर value एक child हो सकती है या children का array। दोनों रूप nest हो सकते हैं: किसी दूसरे view के content के अंदर का <code>into()</code> अपने ही region को target करता है।</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Tree में गहराई से dialog खोलना</h3>
      <p>Overlay region tree की root पर रहता है। कोई भी component, किसी भी depth पर, <code>into()</code> को <code>when()</code> में लपेटकर dialog खोल सकता है। <code>when()</code> बंद करते ही dialog region से हट जाता है।</p>
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
      <h3>list की rows से Toasts</h3>
      <p><code>list()</code> की हर row एक view है। Stacked region उन्हें क्रम से दिखाता है, और array से कोई item हटाते ही उसका toast हट जाता है।</p>
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
      <h3>Page से title सेट करना</h3>
      <p>Default <code>type: 'latest'</code> में सबसे नया view दिखता है। Layout तय करता है कि title कहाँ होगा, और जो page खुला है वही उसका text देता है। जिस page में <code>into('title', …)</code> नहीं है, वहाँ <code>empty</code> का text दिख जाता है।</p>
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
      <h3>View के अंदर dynamic values</h3>
      <p><code>into()</code> का content आम Nuclo content ही है। उसमें जो functions state पर निर्भर हैं, वे region कहीं भी हो, <code>update()</code> पर refresh होते हैं।</p>
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
      <h3>ऐसा region जो आता-जाता है</h3>
      <p>Dashboard का <code>into()</code> सिर्फ़ एक बार लिखा गया है। User sign out हो, तो <code>main</code> region होता ही नहीं और view इंतज़ार करता है। Sign in करते ही region बनता है और view दिख जाता है। Sign out करने पर region हट जाता है और view फिर इंतज़ार करने लगता है।</p>
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
      <h3>अपने region वाला view</h3>
      <p>View में अपना <code>region()</code> भी हो सकता है, और दूसरे views उसे target कर सकते हैं। यहाँ editor page अपने साथ <code>tabs</code> region लाता है, और हर tab उसे भरता है। Editor बंद होते ही उसका region भी उसके साथ चला जाता है।</p>
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
      <h3>Live example</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> सिर्फ़ dynamic values चलाता है। Static values, जैसे <code>h1(labels[lang].title)</code> का text, tree बनते समय ही तय हो जाते हैं। <code>forceUpdate()</code> components को दोबारा कॉल करके live DOM को नए result के हिसाब से patch करता है, static values समेत। भाषा बदलने जैसे कभी-कभार होने वाले, पूरे app पर असर डालने वाले बदलावों के लिए इसे इस्तेमाल कीजिए। बाकी बदलावों के लिए <code>update()</code> ही रखिए।</p>
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
      <p>बिना arguments के <code>forceUpdate()</code> उन सभी roots को दोबारा बनाता है जो <code>render(App)</code> या <code>hydrate(App)</code> से render हुए थे। <code>render(App())</code> से बने roots छोड़ दिए जाते हैं। Component throw करे, तो error log होता है और उस root का पुराना DOM वैसा ही रहता है। नया build apply करते समय error आए, तो वह भी log होता है, लेकिन जो हिस्से पहले patch हो चुके हैं वे वैसे ही रहते हैं।</p>
      <h3>क्या रहता है और क्या बदलता है</h3>
      <ul>
        <li>Children का मिलान क्रम से, tag के हिसाब से होता है। मिलने वाला element दोबारा इस्तेमाल होता है, इसलिए focus और टाइप की हुई input values बनी रहती हैं, और उसके <code>onMount</code> hooks दोबारा नहीं चलते। जैसे ही किसी child का tag अलग निकलता है, उस child और उसके बाद के हर sibling को नए सिरे से बनाया जाता है।</li>
        <li>Text, attributes, classes, styles, listeners, <code>when()</code> की branches और <code>list()</code> की rows नए build के हिसाब से update होती हैं।</li>
        <li>नए elements बनते हैं और उनके <code>onMount</code> hooks चलते हैं। जो elements नए build में नहीं आते, वे हट जाते हैं और उनके <code>onDestroy</code> hooks चलते हैं।</li>
        <li><code>list()</code> rows का मिलान position से भी होता है, item से नहीं, इसलिए दोबारा इस्तेमाल हुआ row element कोई अलग item दिखा सकता है।</li>
        <li>जो attributes नए build में सेट नहीं हैं, वे हटाए नहीं जाते।</li>
      </ul>
      <div class="docs-callout"><strong>ध्यान दीजिए:</strong> Component function के अंदर declare किया गया state reset हो जाता है, क्योंकि function फिर से चलता है। जिस state को बचाकर रखना है, उसे component के बाहर रखिए।</div>
      <p><strong>Arguments वाला रूप।</strong> <code>forceUpdate(App(), parent)</code> <code>parent</code> में एक tree को दोबारा बनाता है और उसकी root लौटाता है। यह root को आगे की calls के लिए register नहीं करता। <code>hydrate()</code> की तरह यह मानकर चलता है कि root <code>parent</code> का पहला node है। पहले node का tag अलग हो, तो उसे बदल दिया जाता है।</p>
      <p>Server पर <code>forceUpdate()</code> कुछ नहीं करता।</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "Rendering",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>आपका tree बनाता है और उसकी root element को <code>parent</code> में जोड़ देता है। <code>parent</code> का default <code>document.body</code> है। यह root element लौटाता है।</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>आप component (<code>render(App)</code>) पास कर सकते हैं या उसका लौटाया builder (<code>render(App())</code>)। DOM वही बनता है। बस <code>render(App)</code> से <a href="#api-force-update"><code>forceUpdate()</code></a> बाद में root को दोबारा बना पाता है, इसलिए इसी का इस्तेमाल कीजिए।</li>
        <li>यह जोड़ता है। <code>parent</code> को साफ़ नहीं करता, इसलिए इसे दो बार कॉल करने पर दो copies जुड़ जाती हैं।</li>
        <li><code>render()</code> के लौटने तक tree के हर <code>onMount</code> चल चुका होता है।</li>
        <li>ऐसे element में render कीजिए जो document में हो। <a href="#api-update"><code>update()</code></a> देखिए।</li>
        <li>Root कोई element होना चाहिए, जैसे <code>div(...)</code>। <code>when()</code> या <code>list()</code> नहीं चलेगा।</li>
        <li><code>index</code> internal है। यह तय नहीं करता कि element कहाँ डलेगा। इसे छोड़ दीजिए।</li>
      </ul>
      <p><code>render(App)</code> की तरह पास किया गया component कोई parameter नहीं लेना चाहिए। Required parameter पर type error आता है। Optional parameter type check पास कर लेता है, लेकिन <code>render()</code> runtime पर throw करता है। जो component props लेता है, उसे एक function में लपेट दीजिए:</p>
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
      <p><a href="#api-ssr"><code>renderToString()</code></a> से बने HTML को client पर चालू कर देता है। यह मौजूदा elements को दोबारा इस्तेमाल करता है, event listeners जोड़ता है, और dynamic values, <code>when()</code> और <code>list()</code> को attach करता है, ताकि बाद में <code>update()</code> काम करे। फिर यह <code>onMount</code> hooks चलाता है। <code>parent</code> का default <code>document.body</code> है। यह root element लौटाता है।</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Server वाला ही component और वही data इस्तेमाल कीजिए।</li>
        <li>अलग container में hydrate कीजिए। App की root उसका पहला node होनी चाहिए, whitespace चलेगा। उससे पहले कोई और node आए, तो Nuclo उसे बदल देता है और server वाली copy पीछे छोड़ देता है।</li>
        <li><code>render()</code> की तरह <code>App</code> पास कीजिए, <code>App()</code> नहीं, ताकि <code>forceUpdate()</code> बाद में root को दोबारा बना सके। <code>App</code> कोई parameter नहीं ले सकता। Optional parameter हो तो <code>hydrate()</code> चुपचाप कुछ भी attach नहीं करता। जो component props लेता है, उसे function में लपेटिए: <code>hydrate(() =&gt; Page(props), root)</code>।</li>
        <li>Server HTML नहीं है, तो <code>render()</code> इस्तेमाल कीजिए।</li>
      </ul>
      <h3>जब server और client अलग हों</h3>
      <p>Client की values लागू होती हैं:</p>
      <ul>
        <li>अलग root tag: उस node की जगह नया DOM आ जाता है। खाली container: नया DOM जोड़ दिया जाता है।</li>
        <li>अलग text patch हो जाता है। अलग <code>list()</code> items और <code>when()</code> branches client के हिसाब से बदल जाते हैं।</li>
        <li>Server के फ़ालतू children हट जाते हैं, और जो children नहीं हैं वे बन जाते हैं।</li>
        <li>जो attributes server ने लिखीं लेकिन client ने सेट नहीं कीं, वे जैसी हैं वैसी रहती हैं।</li>
      </ul>
      <p><code>renderToString()</code> HTML comments को markers की तरह लिखता है, जैसे हर text node से पहले <code>&lt;!-- text-0 --&gt;</code>। <code>hydrate()</code> को इनकी ज़रूरत होती है, इसलिए server HTML से comments मत हटाइए। Markers न हों, तो hydration <code>list()</code> की rows हटा देता है, और <code>list()</code> व <code>when()</code> update होना बंद कर देते हैं।</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Server rendering",
        content: `
      <p>Server पर किसी component को HTML string में render कीजिए। Browser में उसी component के साथ <a href="#api-hydrate"><code>hydrate()</code></a> कॉल कीजिए, ताकि वह HTML interactive हो जाए। Server runtime में <code>document</code> नहीं होता, इसलिए पहले <a href="#api-polyfill"><code>nuclo/polyfill</code></a> import कीजिए।</p>
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
      <p>Style tag पर <code>id="nuclo-styles"</code> रखिए। Client उसी element को दोबारा इस्तेमाल करता है और सिर्फ़ नई rules जोड़ता है। <a href="#api-css-text"><code>getCssText()</code></a> देखिए।</p>
      <h3>Server पर क्या चलता है</h3>
      <ul>
        <li>हर <code>renderToString()</code> call tree बनाता है और हर dynamic value को एक बार चलाता है।</li>
        <li>Event handlers, <code>onMount</code> और <code>onDestroy</code> कभी नहीं चलते। <code>update()</code>, <code>scope()</code> और <code>forceUpdate()</code> कुछ नहीं करते।</li>
        <li>Rendering synchronous है। पहले अपना data load कीजिए, फिर render कीजिए।</li>
        <li>Render के बाद कुछ भी register नहीं रहता, इसलिए एक process कई requests संभाल सकता है। Request का data arguments में पास कीजिए, जैसे <code>renderToString(Page(user))</code>। Module-level variables सारी requests में shared होते हैं।</li>
        <li>Server पर <code>render()</code> कॉल मत कीजिए। यह shared <code>document.body</code> से जुड़ता है।</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Builder (<code>App()</code>), component (<code>App</code>) या DOM node लेता है। <code>null</code> और <code>undefined</code> पर <code>""</code> लौटता है। Root कोई element होना चाहिए। <code>renderToString(Page)</code> की तरह पास किया गया component कोई parameter नहीं ले सकता, इसलिए जो component data लेता है उसके लिए <code>Page(user)</code> पास कीजिए।</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Text और attribute values HTML-escape होती हैं। <code>script()</code> और <code>style()</code> के अंदर का text जैसा है वैसा लिखा जाता है, बस closing tag तोड़ दिया जाता है, इसलिए वहाँ user input कभी मत डालिए।</li>
        <li>यह error बाहर throw नहीं करता। Component, <code>list()</code> का function या <code>when()</code> की condition fail हो, या polyfill न मिले, तो यह error log करके <code>""</code> लौटा देता है। ऐसे में request fail करनी हो, तो खाली result चेक कीजिए। Text या attribute function throw करे, तो सिर्फ़ उसकी value खाली render होती है।</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p><code>inputs.map(renderToString)</code> जैसा ही।</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Output को एक element में लपेट देता है। <code>containerTag</code> का default <code>"div"</code> है और <code>containerAttrs</code> का <code>{}</code>। Attribute values escape होती हैं। Attribute names जैसे दिए जाते हैं वैसे ही लिखे जाते हैं, इसलिए <code>class</code> जैसे HTML names इस्तेमाल कीजिए। User input को tag के रूप में कभी पास मत कीजिए।</p>
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
      <p>एक छोटा DOM, ताकि Nuclo Node और Bun में tree बना सके। अपने पहले render से पहले इसे एक बार import कर लीजिए। ज़्यादातर apps को बस सादा import चाहिए।</p>
      <ul>
        <li>जब <code>window</code> नहीं होता, तब यह <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> और <code>HTMLElement</code> सेट करता है, लेकिन सिर्फ़ वही जो मौजूद नहीं हैं। यह <code>window</code> नहीं बनाता।</li>
        <li>Browser में, या jsdom के अंदर, यह कुछ नहीं करता।</li>
        <li><code>Event</code> और <code>CustomEvent</code> runtime के अपने constructors हैं। <code>Node</code>, <code>Element</code> और <code>HTMLElement</code> polyfill classes के aliases हैं।</li>
      </ul>
      <p>यह tree बनाने के लिए DOM है, browser नहीं। इसमें न <code>innerHTML</code> है और न <code>getElementById</code>, <code>querySelector()</code> हमेशा <code>null</code> लौटाता है, और event listeners ignore हो जाते हैं। HTML चाहिए तो <code>renderToString()</code> इस्तेमाल कीजिए।</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
