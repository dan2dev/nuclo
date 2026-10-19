import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "Introduzione",
    sections: [
      {
        id: "overview",
        title: "Panoramica",
        content: `
      <p>Nuclo è una piccola libreria DOM per TypeScript. Costruisci la pagina con semplici funzioni come <code>div()</code> e <code>button()</code>, tieni lo stato in normali variabili e chiami <code>update()</code> quando la pagina deve cambiare.</p>
      <p>Niente virtual DOM, niente compilatore, niente proxy, niente signal.</p>
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
      <h3>Il modello mentale</h3>
      <ol>
        <li>Descrivi la UI con i builder dei tag.</li>
        <li>Ogni valore che dipende dallo stato lo scrivi come funzione.</li>
        <li>Cambia lo stato con normale JavaScript.</li>
        <li>Poi chiami <code>update()</code>: Nuclo rilancia quelle funzioni e scrive nel DOM solo ciò che è davvero cambiato.</li>
      </ol>
      <p>Assegnare una variabile non tocca il DOM: la pagina cambia solo quando chiami <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Quick start",
        content: `
      <p>La via più veloce è <code>create-nuclo</code>, che ti genera un progetto Vite + TypeScript già pronto per Nuclo:</p>
    `,
        afterContent: `
      <p>Ti chiederà il nome del progetto. Se preferisci evitare le domande, passa nome e flag direttamente (con npm, ricorda il <code>--</code> prima dei flag):</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Poi installa le dipendenze e avvia il dev server:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Opzioni</h3>
      <ul>
        <li><code>[project-name]</code>: la cartella di destinazione, <code>nuclo-app</code> se non la specifichi.</li>
        <li><code>-t, --template &lt;name&gt;</code>: il template da copiare. Per ora c'è solo <code>basic</code>.</li>
        <li><code>-y, --yes</code>: salta le domande e usa i default.</li>
        <li><code>-f, --force</code>: scrive anche in una cartella non vuota.</li>
        <li><code>-h, --help</code>: mostra l'aiuto.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Installazione e import",
        content: `
      <p>Per aggiungere Nuclo a un progetto che esiste già:</p>
      ${sh("npm install nuclo")}
      <p>Va bene anche <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> o <code>bun add nuclo</code>. Nuclo non ha dipendenze.</p>
      <p>Il routing non sta nel pacchetto principale: viene distribuito a parte come <a href="#router-overview"><code>nuclo-router</code></a>, da installare accanto a <code>nuclo</code> quando ti serve.</p>
      <h3>Globali</h3>
      <p><code>import 'nuclo'</code> registra su <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 builder di tag</strong>: 112 HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) e 63 SVG, riconoscibili dal suffisso <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). Vedi <a href="#tag-builders">Builder di tag</a>.</li>
        <li><strong>16 helper</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code>.</li>
      </ul>
      <p>L'import deve girare prima di qualsiasi codice che chiami un builder. I moduli ES vengono eseguiti nell'ordine degli import, quindi questo si rompe:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Metti <code>import 'nuclo'</code> in cima al file di ingresso, oppure importalo in ogni file che usa i globali.</p>
      <h3>Import nominati</h3>
      <p>Gli helper sono disponibili anche come export nominati, e sono le stesse funzioni dei globali. <code>getCssText()</code> e <code>resetStyles()</code> esistono solo come export nominati. I builder di tag, invece, sono solo globali: <code>import { div } from 'nuclo'</code> non funziona.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Punti di ingresso</h3>
      <ul>
        <li><code>nuclo</code>: registra i globali ed esporta i 16 helper più <code>getCssText</code> e <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> e <code>getCssText</code>. Vedi <a href="#api-ssr">Rendering lato server</a>.</li>
        <li><code>nuclo/polyfill</code>: un mini DOM per Node e Bun. Vedi <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: solo tipi. Vedi <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo porta con sé i propri tipi. Bastano due cose:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> e <code>nodenext</code> non sono ancora supportati.</li>
        <li>La lib <code>DOM</code>, che TypeScript include già di default se non imposti <code>lib</code>.</li>
      </ul>
      <p>Se anche un solo file del progetto importa <code>'nuclo'</code>, tutti gli altri vedono i tipi globali e non serve altro. Se nessun file lo importa (per esempio in un tsconfig separato per i test), i tipi vanno aggiunti a mano:</p>
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
      <p>In alternativa, aggiungi <code>/// &lt;reference types="nuclo/types" /&gt;</code> a un file <code>.d.ts</code>.</p>
      <h3>Tipi utili</h3>
      <p>Sono tutti globali, quindi si usano senza import:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: ciò che restituisce un builder di tag. Usalo come tipo di ritorno di un componente.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: tutto ciò che un builder di tag accetta come argomento.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: ciò che restituiscono <code>render()</code> e <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: qualunque nome di tag HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: l'oggetto di attributi che un builder accetta, compresi gli handler <code>on*</code>, <code>onMount</code> e <code>onDestroy</code>. Ti serve per i componenti che passano gli attributi agli elementi al loro interno.</li>
        <li><code>MountCallback</code> e <code>DestroyCallback</code>: i tipi degli handler <code>onMount</code> e <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: ciò che restituiscono <code>when()</code> e <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: le opzioni di <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> e gli altri tipi dello styling. Si possono importare anche in modo esplicito: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> segna come opzionale ogni membro del DOM. Quando ti serve il tipo completo dell'elemento, fai un cast: <code>render(App, root) as HTMLDivElement</code>.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "Costruire la UI",
    sections: [
      {
        id: "tag-builders",
        title: "Builder di tag",
        content: `
      <p>Ogni tag HTML è una funzione globale con lo stesso nome: <code>div</code>, <code>span</code>, <code>input</code>, … L'unica eccezione è <code>&lt;var&gt;</code>, che diventa <code>var_</code> perché <code>var</code> è una parola riservata. I tag SVG hanno il suffisso <code>Svg</code>: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Chiamare un builder non crea ancora nessun elemento. <code>div('Hi')</code> restituisce un <strong>builder</strong>, cioè una funzione che costruirà l'elemento più tardi. Nuclo la invoca quando la monti con <code>render()</code> o la metti dentro un altro builder, un <code>when()</code> o un <code>list()</code>, e ogni utilizzo produce un elemento nuovo.</p>
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
      <h3>Argomenti</h3>
      <p>Un builder accetta quanti argomenti vuoi e li applica da sinistra a destra:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: diventano un nodo di testo.</li>
        <li><strong><code>() =&gt; value</code></strong>: testo che cambia a ogni <code>update()</code>. Vedi <a href="#dynamic-functions">Valori dinamici</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: vengono ignorati.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: finiscono nella pagina come testo "true" o "false". Per le condizioni usa <code>when()</code>.</li>
        <li><strong>Un oggetto semplice</strong>: gli attributi. Vedi <a href="#attributes">Attributi</a>.</li>
        <li><strong>Un risultato di <code>css()</code>, <code>cx()</code> o <code>variants()</code></strong>: aggiunge le sue classi.</li>
        <li><strong><code>on(...)</code></strong>: un listener di eventi o un hook del ciclo di vita.</li>
        <li><strong>Un altro builder, <code>when()</code> o <code>list()</code></strong>: diventa un figlio.</li>
        <li><strong>Un <code>Node</code> del DOM</strong>: aggiunto così com'è.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: un modificatore personalizzato, spiegato più sotto.</li>
      </ul>
      <h3>Insidie comuni</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> mostra il testo "false". Scrivi invece <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Gli array non sono figli: vanno espansi con <code>ul(...names.map((n) =&gt; li(n)))</code>. Per le liste che cambiano nel tempo, c'è <code>list()</code>.</li>
        <li>Una variabile locale con il nome di un tag oscura il builder: dentro <code>function Row(label: string)</code>, <code>label(...)</code> non si può chiamare. Evita per le variabili locali nomi come <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> e <code>i</code>.</li>
        <li>I browser espongono come variabile globale ogni elemento che ha un <code>id</code>. Se la pagina contiene <code>&lt;main id="main"&gt;</code> prima che Nuclo si carichi, Nuclo lascia intatto quel globale e <code>main(...)</code> lancia un <code>TypeError</code>. Scegli id diversi.</li>
      </ul>
      <h3>Modificatori personalizzati</h3>
      <p>Una funzione che dichiara almeno un parametro viene eseguita una sola volta, nell'ordine degli argomenti, mentre l'elemento viene costruito. Il primo argomento è l'elemento; il secondo è un indice interno, quindi non contarci. Se restituisce una stringa o un numero, diventa testo; un <code>Node</code> viene aggiunto come figlio; un oggetto viene applicato come attributi.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Mettere le mani sull'elemento</h3>
      <p><code>render()</code> restituisce l'elemento radice. Dentro un albero puoi usare <code>on("mount", (el) =&gt; …)</code> o un modificatore personalizzato. Oppure chiami tu stesso la funzione builder e ottieni un elemento staccato dal DOM:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Aggiungilo al documento prima del prossimo <code>update()</code>: un nodo che non è nel documento quando <code>update()</code> gira smette di aggiornarsi per sempre.</p>
      <h3>SVG</h3>
      <p>I builder SVG accettano gli stessi argomenti. Nuclo imposta ogni attributo SVG con <code>setAttribute</code>, quindi nomi come <code>"stroke-width"</code> funzionano esattamente come li scrivi.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>L'elenco completo dei builder</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Componenti",
        content: `
      <p>Un componente è una semplice funzione che restituisce un builder, per esempio <code>button(...)</code>. Non esiste un'API dedicata ai componenti, e non viene creato nulla finché non lo fai renderizzare o non lo inserisci in un albero.</p>
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
      <p>Lo stato dichiarato dentro la funzione appartiene a quella singola istanza; quello dichiarato fuori è condiviso da tutte. <code>forceUpdate()</code> richiama i componenti da capo, e così azzera lo stato che vive al loro interno.</p>
      <p>I figli sono semplici argomenti:</p>
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
        title: "Attributi",
        content: `
      <p>Per impostare gli attributi passa un oggetto semplice, o anche più di uno. Se la stessa chiave compare due volte vince l'ultimo valore, tranne che per <code>className</code> e <code>style</code>, che vengono uniti. Il valore può essere statico oppure una funzione senza parametri, rieseguita a ogni <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Come viene scritto un valore</h3>
      <ul>
        <li>Se l'elemento HTML ha una proprietà con quel nome (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo imposta la proprietà; altrimenti chiama <code>setAttribute(key, String(value))</code>, come succede per <code>"aria-*"</code> e <code>"data-*"</code>.</li>
        <li>Sugli elementi SVG usa sempre <code>setAttribute</code>.</li>
        <li><code>null</code> e <code>undefined</code> vengono ignorati. Un valore dinamico che restituisce <code>null</code> o <code>undefined</code> lascia quello precedente. Per azzerare, restituisci <code>""</code>, oppure <code>false</code> se è una proprietà booleana.</li>
        <li>I booleani funzionano con le proprietà booleane del DOM, come <code>disabled</code> su un pulsante, <code>checked</code>, <code>hidden</code> e <code>required</code>. Ovunque altro, <code>true</code> e <code>false</code> vengono scritti come le stringhe "true" e "false".</li>
        <li>Usa le chiavi <code>"data-*"</code>: <code>dataset</code> non è supportato.</li>
        <li><code>innerHTML</code> non viene escapato e il rendering lato server non lo emette. Evitalo.</li>
      </ul>
      <h3>Classi</h3>
      <p>Usa <code>className</code>. Stringhe di classi statiche, risultati di <code>css()</code> e un <code>className</code> dinamico si sommano. Il <code>className</code> dinamico mantiene le classi statiche: se restituisce <code>""</code>, restano solo quelle.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Non usare la chiave <code>class</code> sugli elementi HTML: imposta l'attributo grezzo e sostituisce ogni classe applicata prima, comprese quelle di <code>css()</code>.</p>
      <h3>Stili inline</h3>
      <p><code>style</code> accetta un oggetto con chiavi in camelCase, o una funzione che ne restituisce uno.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo non aggiunge unità: scrivi <code>"12px"</code>, non <code>12</code>. Le proprietà senza unità come <code>opacity</code> e <code>zIndex</code> accettano numeri.</li>
        <li><code>""</code>, <code>null</code> e <code>undefined</code> azzerano la proprietà.</li>
        <li>Uno stile dinamico imposta solo le chiavi che restituisce. Se una chiave sparisce dal risultato, il valore precedente resta, quindi restituisci <code>""</code> per azzerarla.</li>
        <li>Le stringhe di stile (<code>"color: red"</code>) e le custom property (<code>"--gap"</code>) non sono supportate: usa <code>css()</code>, che accetta le custom property tramite <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Eventi",
        content: `
      <p>Gli eventi si ascoltano in due modi: con gli attributi <code>on*</code> o con il modificatore <code>on()</code>.</p>
      <h3>Attributi <code>on*</code></h3>
      <p>In un oggetto di attributi, una funzione sotto una chiave come <code>onClick</code> (<code>on</code> seguito da una maiuscola) è un handler di eventi, non un valore dinamico.</p>
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
        <li>TypeScript deduce il tipo dell'evento dalla chiave e dall'elemento. <code>e.currentTarget</code> e <code>this</code> sono l'elemento.</li>
        <li>Nuclo imposta la proprietà nativa, quindi <code>onClick</code> diventa <code>el.onclick</code>. Per ogni evento c'è un solo handler: un <code>onClick</code> successivo sostituisce il precedente.</li>
        <li><code>onDoubleClick</code> e <code>onDblClick</code> corrispondono entrambi a <code>dblclick</code>. Le chiavi tutte minuscole come <code>onclick</code> sono errori di tipo.</li>
        <li>Un nome che non corrisponde a un evento noto ascolta la propria versione minuscola: <code>onMyEvent</code> ascolta <code>"myevent"</code>.</li>
        <li>Le eccezioni lanciate dall'handler non vengono intercettate.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> restituisce un modificatore che chiama <code>addEventListener</code> sull'elemento.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Ogni <code>on()</code> aggiunge un listener, e vengono eseguiti tutti, in ordine.</li>
        <li><code>options</code> arriva dritto a <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Se passi <code>on()</code> direttamente a un builder, il tipo dell'elemento viene dedotto: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Se un listener lancia un errore, Nuclo lo scrive con <code>console.error</code> e gli altri listener girano comunque.</li>
        <li>Nuclo toglie il listener quando rimuove l'elemento. Sul server <code>on()</code> non fa nulla.</li>
        <li>Lo stesso valore <code>on()</code> si può riusare su più elementi.</li>
      </ul>
      <p>Per un evento personalizzato, passa il tipo dell'evento come generico:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Quale scegliere</h3>
      <p>Per il caso comune bastano gli attributi <code>on*</code>. Passa a <code>on()</code> quando ti servono più listener per lo stesso evento, le opzioni del listener o un nome di evento personalizzato come <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Ciclo di vita",
        content: `
      <p><code>onMount</code> parte una volta sola, dopo che l'elemento è stato inserito; <code>onDestroy</code> parte una volta sola, quando Nuclo rimuove l'elemento. Li scrivi come attributi o con <code>on()</code>: le due forme sono equivalenti e l'elemento è tipizzato in base al suo tag.</p>
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
      <h3>Quando vengono eseguiti</h3>
      <ul>
        <li><code>onMount</code> gira alla fine della chiamata a <code>render()</code>, <code>hydrate()</code>, <code>update()</code> o <code>forceUpdate()</code> che ha inserito l'elemento, mai mentre l'albero è ancora in costruzione.</li>
        <li>Se <code>onMount</code> restituisce una funzione, quella viene eseguita alla distruzione, dopo le callback <code>onDestroy</code> dell'elemento.</li>
        <li><code>onDestroy</code> gira quando Nuclo rimuove l'elemento: la riga di un <code>list()</code> sparisce, un ramo di <code>when()</code> cambia, un <code>into()</code> lascia la sua regione o <code>forceUpdate()</code> lo scarta. Parte subito prima della rimozione, quindi l'elemento è ancora nel documento.</li>
      </ul>
      <h3>Rimozione diretta dal DOM</h3>
      <p>Se rimuovi un elemento a mano, con <code>node.remove()</code> o <code>innerHTML = ''</code>, i suoi <code>onDestroy</code> e i cleanup non vengono mai eseguiti e i timer continuano a girare. Nuclo non ha un <code>unmount()</code>: per smontare un'app facendo scattare i cleanup, avvolgila in un <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Ordine ed errori</h3>
      <ul>
        <li>Puoi registrare quanti hook vuoi, in entrambe le forme, e girano nell'ordine di registrazione.</li>
        <li><code>onDestroy</code> esegue prima i figli, poi il genitore.</li>
        <li>Gli elementi vengono montati nell'ordine del loro primo hook <code>onMount</code>, che segue l'ordine degli argomenti, e ogni elemento esegue tutti i suoi hook insieme. Se i figli dipendono dall'hook di un genitore, metti quell'hook prima dei figli.</li>
        <li>Un hook che lancia un errore viene registrato con <code>console.error</code>, e gli altri hook girano comunque.</li>
        <li>La callback non deve restituire nulla, a parte una funzione di cleanup, quindi non renderla <code>async</code>: una Promise restituita non viene mai usata come cleanup. Il lavoro asincrono avvialo al suo interno: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Gli hook non girano mai sul server. Sul client partono dopo <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Nota:</strong> gli hook non sono effect. Non si rieseguono quando lo stato cambia: ognuno gira al massimo una volta per elemento.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "Aggiornamenti",
    sections: [
      {
        id: "explicit-updates",
        title: "Aggiornamenti espliciti",
        content: `
      <p>Nuclo non aggiorna mai la pagina di sua iniziativa. Cambi lo stato, poi chiami <code>update()</code>.</p>
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
      <p>Cambia tutto lo stato che ti serve, poi chiama <code>update()</code> una volta sola:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Chiama <code>update()</code> da un handler di eventi, da un timer, da una callback di fetch o da <code>onMount</code>. Mai dall'interno di un valore dinamico.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Valori dinamici",
        content: `
      <p>Una funzione <strong>senza parametri</strong> è un <strong>valore dinamico</strong>. Nuclo la esegue una prima volta mentre costruisce l'elemento, e poi di nuovo a ogni <code>update()</code>. Vale per i figli di testo, i valori degli attributi, <code>style</code> e <code>className</code>. Per i figli che compaiono, scompaiono o si ripetono ci sono <a href="#api-when"><code>when()</code></a> e <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo guarda quanti parametri dichiara la funzione (<code>fn.length</code>). Se ne dichiara uno, è un <a href="#tag-builders">modificatore personalizzato</a> e gira una volta sola. <code>(x = 0) =&gt; …</code> e <code>(...args) =&gt; …</code> hanno length 0, quindi restano dinamiche.</p>
      <h3>Testo dinamico</h3>
      <ul>
        <li>Un valore string, number, bigint o boolean viene convertito con <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> mostrerebbe "false": scrivi <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> e <code>undefined</code> diventano testo vuoto.</li>
        <li>Se alla prima esecuzione la funzione restituisce un risultato di <code>css()</code> o <code>cx()</code>, diventa una classe dinamica e non testo. Vedi <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Un nodo, un builder, un array o un oggetto semplice non produce nulla e non si aggiorna mai.</li>
      </ul>
      <h3>Attributi dinamici</h3>
      <ul>
        <li>Nuclo scrive un valore solo se è diverso dall'ultimo che ha scritto lui stesso; non lo confronta con il DOM reale. Quindi se l'utente digita in un input e la tua funzione restituisce lo stesso valore di prima, il testo digitato resta lì.</li>
        <li>Un risultato <code>null</code> o <code>undefined</code> non scrive nulla, quindi il valore precedente rimane. L'eccezione è <code>className</code>: qualsiasi risultato falsy toglie le classi dinamiche e conserva quelle statiche.</li>
        <li>Una funzione <code>style</code> applica a ogni aggiornamento l'oggetto che restituisce.</li>
      </ul>
      <h3>Errori</h3>
      <p>Se un valore dinamico lancia un errore, Nuclo lo intercetta e il resto dell'aggiornamento va avanti. Il testo diventa vuoto o tiene il valore precedente, e un attributo tiene il valore precedente. Entrambi si riprendono al primo <code>update()</code> successivo che va a buon fine. Un'eccezione: una funzione di testo che fallisce alla <strong>prima</strong> esecuzione resta vuota per sempre.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Esegue un passaggio sincrono su ogni valore dinamico della pagina. Se gli passi degli id, aggiorna solo ciò che sta dentro gli elementi marcati con quegli id da <a href="#api-scope"><code>scope()</code></a>. Ogni passaggio segue questi passi, in ordine:</p>
      <ol>
        <li><code>list()</code>: rilegge gli elementi e aggiunge, sposta o rimuove righe.</li>
        <li><code>when()</code>: ricontrolla le condizioni. Un ramo viene ricostruito solo quando ne diventa attivo uno diverso.</li>
        <li>Attributi dinamici, compresi <code>style</code> e <code>className</code>.</li>
        <li>Testo dinamico.</li>
        <li><code>onMount</code> per gli elementi inseriti nei passi 1 e 2.</li>
      </ol>
      <ul>
        <li><strong>Esegue tutto.</strong> Ogni valore dinamico gira a ogni chiamata, anche se i suoi dati non sono cambiati; a essere saltata è solo la scrittura sul DOM. Tieni i valori dinamici veloci e senza effetti collaterali.</li>
        <li><strong>Solo i nodi nel documento.</strong> Se un nodo non è nel documento quando <code>update()</code> gira, Nuclo smette di tracciarlo, e non si aggiornerà più nemmeno se lo inserisci dopo. Vale anche per <code>list()</code> e <code>when()</code>: renderizza in un container che sia già nel documento.</li>
        <li><strong>I valori statici non cambiano mai.</strong> Stringhe semplici e valori degli attributi vengono fissati quando l'elemento viene costruito. Per ricostruirli c'è <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Errori.</strong> Gli errori nel testo e negli attributi vengono intercettati e il passaggio continua. Se la condizione di un <code>when()</code> lancia un errore, viene registrato e quel <code>when()</code> smette di aggiornarsi. Se invece a lanciare è la funzione <code>items</code> o <code>renderItem</code> di un <code>list()</code>, l'errore esce da <code>update()</code> e i passi rimanenti non vengono eseguiti.</li>
        <li><strong>Server.</strong> Sul server <code>update()</code> non fa nulla.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Assegna uno o più id di scope all'elemento a cui lo passi. A quel punto <code>update('id')</code> aggiorna solo ciò che sta dentro l'elemento, attributi dell'elemento stesso compresi.</p>
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
        <li>Un elemento può avere più id: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> aggiorna tutto ciò che sta dentro <code>a</code> o <code>b</code>. Se più elementi condividono un id, si aggiornano tutti.</li>
        <li>Con scope annidati, <code>update('outer')</code> include lo scope interno, mentre <code>update('inner')</code> non tocca quello esterno.</li>
        <li>Un id che nessun elemento nel documento possiede non aggiorna <strong>niente</strong> e non dà errori: controlla di averlo scritto giusto.</li>
        <li>Sul server <code>scope()</code> non fa nulla.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Renderizza contenuto in base a una condizione. Nuclo ricontrolla le condizioni a ogni <code>update()</code> e vince la prima vera. Se nessuna lo è, viene reso il contenuto di <code>.else()</code>; senza <code>.else()</code>, non viene reso nulla.</p>
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
      <h3>Condizioni</h3>
      <ul>
        <li>Per lo stato passa una funzione: un booleano semplice viene letto una volta sola, quindi <code>when(open, …)</code> non cambia mai.</li>
        <li>In TypeScript la funzione deve restituire un boolean: scrivi <code>() =&gt; items.length &gt; 0</code> oppure <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Cosa si aggiorna</h3>
      <ul>
        <li>Finché resta attivo lo stesso ramo, i suoi elementi vengono mantenuti, e i valori dinamici, le liste e i blocchi <code>when()</code> al suo interno continuano ad aggiornarsi.</li>
        <li>Quando diventa attivo un ramo diverso, il vecchio contenuto viene rimosso e i suoi hook <code>onDestroy</code> vengono eseguiti; il nuovo ramo viene costruito da zero e i suoi hook <code>onMount</code> partono. Lo stato dei vecchi elementi, come il testo di un input o il focus, va perso.</li>
      </ul>
      <h3>Contenuto dei rami</h3>
      <p>In un ramo puoi mettere dei figli: testo, testo dinamico, builder, <code>list()</code> e <code>when()</code> annidati. Passa builder come <code>p('Hi')</code>, non nodi DOM: un nodo DOM, una volta che il suo ramo è stato nascosto, non si aggiorna più.</p>
      <p>Gli oggetti di attributi e gli <code>on()</code> dentro un ramo si applicano all'elemento genitore e restano anche dopo che il ramo viene nascosto. Per un attributo condizionale usa un attributo dinamico: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Concatenamento</h3>
      <p><code>.when()</code> e <code>.else()</code> restituiscono un nuovo builder senza modificare quello di partenza. Se chiami <code>.else()</code> due volte, vince l'ultima.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Renderizza una riga per ogni elemento. A ogni <code>update()</code> Nuclo richiama <code>items()</code> e abbina i nuovi elementi alle righe esistenti per identità (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Come vengono abbinate le righe</h3>
      <ul>
        <li>Un elemento ancora presente tiene la sua riga: Nuclo la sposta se serve e non richiama <code>renderItem</code>.</li>
        <li>Un elemento nuovo ottiene una riga nuova; uno rimosso perde la sua e i suoi hook <code>onDestroy</code> vengono eseguiti.</li>
        <li>Gli elementi duplicati ottengono ciascuno una riga propria.</li>
        <li>Puoi modificare l'array sul posto (<code>push</code>, <code>splice</code>, <code>sort</code>) o restituirne uno nuovo.</li>
      </ul>
      <p>Una riga mantenuta non viene mai ri-renderizzata, quindi per i campi che cambiano usa valori dinamici:</p>
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
      <p>Le copie sono elementi nuovi: sostituire l'array con <code>todos.map((t) =&gt; ({ ...t }))</code> ricostruisce ogni riga.</p>
    `,
        afterContent: `
      <h3>Cosa restituisce <code>renderItem</code></h3>
      <ul>
        <li>Restituisci un solo elemento, come <code>li(...)</code>, <code>tr(...)</code> o un builder SVG, oppure <code>null</code> o <code>undefined</code> per saltare quell'elemento. Stringhe, nodi di testo e frammenti non producono nulla.</li>
        <li>Non restituire direttamente <code>when()</code> o <code>list()</code>: mettili dentro l'elemento della riga, come in <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Per nascondere elementi, filtra in <code>items()</code>, non in <code>renderItem</code>.</li>
        <li>Tieni <code>renderItem</code> privo di effetti collaterali: Nuclo può chiamarlo più volte per lo stesso elemento.</li>
      </ul>
      <h3>L'indice</h3>
      <p><code>index</code> è la posizione dell'elemento nel momento in cui la sua riga è stata creata, e non si aggiorna quando le righe si spostano. Per la posizione attuale usa un valore dinamico: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iterabili</h3>
      <p>Va bene qualsiasi iterabile: array, <code>Set</code>, generatori e <code>map.values()</code>. Restituire ogni volta lo stesso array o lo stesso <code>Set</code> non è un problema. Un iteratore come un generatore o <code>map.values()</code> si esaurisce dopo un passaggio, quindi crealo dentro <code>items()</code> a ogni chiamata. Iterare direttamente una <code>Map</code> produce ogni volta nuovi array <code>[key, value]</code>, e quindi ogni riga viene ricostruita: usa <code>map.values()</code>.</p>
      <h3>Posizionamento</h3>
      <p>Le righe compaiono nel punto in cui <code>list()</code> sta tra i suoi fratelli, tra due marcatori di commento, senza toccare gli altri figli del genitore. <code>list()</code> funziona anche dentro i builder SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() e into()",
        content: `
      <p><code>region()</code> segna un punto con nome nell'albero; <code>into()</code> lo riempie da qualsiasi altro punto, a qualunque profondità. Il layout non riceve il contenuto come prop, e il componente che lo costruisce non sa dove andrà a finire.</p>
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
      <h3>Come funziona</h3>
      <ul>
        <li><code>into()</code> lascia solo un commento nel punto in cui lo scrivi, e il suo contenuto viene reso tra i marcatori della regione.</li>
        <li>L'ordine non conta. Un <code>into()</code> costruito prima della propria regione aspetta e compare appena la regione viene costruita. Le viste appaiono nell'ordine in cui sono state scritte.</li>
        <li>Il contenuto vive quanto la vista. Quando il <code>when()</code> che contiene un <code>into()</code> si chiude, o la sua riga di <code>list()</code> viene rimossa, il contenuto lascia la regione; riaprirlo aggiunge una copia, non due.</li>
        <li>Quando una regione sparisce, per esempio perché il suo <code>when()</code> si chiude, le sue viste tornano in attesa, e una regione costruita più tardi con lo stesso id le mostra.</li>
        <li>Un <code>into()</code> con un id che non corrisponde a nessuna regione non rende nulla e non dà errori: controlla di averlo scritto giusto.</li>
        <li>Gli id sono unici nell'albero. Una seconda regione costruita con un id già attivo scrive un avviso in console.</li>
        <li>Le regioni funzionano con il <a href="#api-ssr">rendering lato server</a>. Con <code>hydrate()</code>, ogni vista riusa l'HTML prodotto dal server invece di costruirlo da capo.</li>
      </ul>
      <h3>Opzioni</h3>
      <ul>
        <li><code>id</code>: il nome con cui le chiamate a <code>into()</code> trovano la regione.</li>
        <li><code>type</code>: <code>'latest'</code> (il default) mostra solo la vista più recente; <code>'stack'</code> le mostra tutte, in ordine di arrivo.</li>
        <li><code>empty</code>: ciò che viene reso finché la regione non ha viste.</li>
      </ul>
      <h3>Regioni stack</h3>
      <p>Con <code>type: 'stack'</code>, una vista che si apre sopra un'altra non ricostruisce quella sotto: DOM, focus e stato del form restano al loro posto. Ideale per un layer come un dialog sopra una pagina.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>Più regioni in un colpo solo</h3>
      <p>Passa un oggetto per riempire più regioni con un singolo <code>into()</code>. Ogni valore può essere un solo figlio o un array di figli, e in entrambi i casi si può annidare: un <code>into()</code> dentro il contenuto di un'altra vista punta alla sua regione.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Un dialog aperto dal fondo dell'albero</h3>
      <p>La regione overlay sta alla radice. Qualsiasi componente, a qualsiasi profondità, apre un dialog avvolgendo un <code>into()</code> in un <code>when()</code>; chiudere il <code>when()</code> toglie il dialog dalla regione.</p>
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
      <h3>Toast generati dalle righe di una lista</h3>
      <p>Ogni riga di un <code>list()</code> è una vista. Una regione stack le mostra in ordine, e togliere un elemento dall'array fa sparire il suo toast.</p>
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
      <h3>Un titolo di pagina deciso dalla pagina</h3>
      <p>Con il default <code>type: 'latest'</code> vince la vista più recente. Il layout definisce l'intestazione, e la pagina aperta in quel momento le dà il nome; una pagina senza <code>into('title', …)</code> lascia il testo di <code>empty</code>.</p>
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
      <h3>Valori dinamici dentro una vista</h3>
      <p>Il contenuto di un <code>into()</code> è normale contenuto Nuclo: le funzioni al suo interno sono valori che dipendono dallo stato e si aggiornano a ogni <code>update()</code>, ovunque si trovi la regione.</p>
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
      <h3>Una regione che va e viene</h3>
      <p>L'<code>into()</code> della dashboard è scritto una volta sola. Finché l'utente è disconnesso non esiste nessuna regione <code>main</code>, quindi la vista aspetta; il login costruisce la regione e la vista compare; il logout rimuove la regione e la vista torna in attesa.</p>
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
      <h3>Una vista con la sua regione</h3>
      <p>Una vista può contenere una <code>region()</code>, e altre viste possono puntarci. Qui la pagina dell'editor si porta dietro una regione <code>tabs</code> che ogni tab riempie, e quando l'editor si chiude la regione se ne va con lui.</p>
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
      <h3>Esempio live</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> esegue solo i valori dinamici. I valori statici, come il testo in <code>h1(labels[lang].title)</code>, vengono fissati quando l'albero viene costruito. <code>forceUpdate()</code> richiama i tuoi componenti e riallinea il DOM reale al risultato, valori statici inclusi. Riservalo ai cambiamenti rari e globali, come il cambio di lingua, e per tutto il resto usa <code>update()</code>.</p>
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
      <p>Senza argomenti, <code>forceUpdate()</code> ricostruisce ogni radice renderizzata con <code>render(App)</code> o <code>hydrate(App)</code>, mentre le radici renderizzate con <code>render(App())</code> vengono saltate. Se un componente lancia un errore, l'errore viene registrato e quella radice conserva il vecchio DOM. Anche un errore lanciato più tardi, mentre la nuova costruzione viene applicata, viene registrato, ma le parti già modificate restano tali.</p>
      <h3>Cosa resta e cosa cambia</h3>
      <ul>
        <li>I figli vengono abbinati in ordine, per tag. Un elemento corrispondente viene riusato: il focus e i valori digitati negli input restano, e i suoi hook <code>onMount</code> non vengono rieseguiti. Dal primo figlio con un tag diverso in poi, quel figlio e tutti i fratelli successivi vengono costruiti da zero.</li>
        <li>Testo, attributi, classi, stili, listener, rami di <code>when()</code> e righe di <code>list()</code> seguono la nuova costruzione.</li>
        <li>I nuovi elementi vengono creati e i loro hook <code>onMount</code> partono; quelli che la nuova costruzione non produce più vengono rimossi, e i loro hook <code>onDestroy</code> partono.</li>
        <li>Anche le righe di <code>list()</code> vengono abbinate per posizione e non per elemento, quindi una riga riusata può finire per mostrare un elemento diverso.</li>
        <li>Gli attributi che la nuova costruzione non imposta più non vengono rimossi.</li>
      </ul>
      <div class="docs-callout"><strong>Attenzione:</strong> lo stato dichiarato dentro la funzione di un componente viene azzerato, perché la funzione gira di nuovo. Tieni fuori dal componente lo stato che deve sopravvivere.</div>
      <p><strong>Forma esplicita.</strong> <code>forceUpdate(App(), parent)</code> ricostruisce un solo albero dentro <code>parent</code> e ne restituisce la radice, senza registrarla per le chiamate successive. Come <code>hydrate()</code>, si aspetta che la radice sia il primo nodo di <code>parent</code>; se quel nodo ha un tag diverso, viene sostituito.</p>
      <p>Sul server, <code>forceUpdate()</code> non fa nulla.</p>
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
      <p>Costruisce l'albero e aggiunge il suo elemento radice a <code>parent</code>. <code>parent</code> è <code>document.body</code> di default. Restituisce l'elemento radice.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Puoi passare il componente (<code>render(App)</code>) o il builder che restituisce (<code>render(App())</code>): il DOM è identico. Solo <code>render(App)</code> permette a <a href="#api-force-update"><code>forceUpdate()</code></a> di ricostruire la radice più tardi, quindi è la forma da preferire.</li>
        <li>Aggiunge in coda e non svuota <code>parent</code>: chiamarlo due volte aggiunge due copie.</li>
        <li>Quando <code>render()</code> ritorna, ogni <code>onMount</code> dell'albero è già stato eseguito.</li>
        <li>Renderizza in un elemento che si trova nel documento. Vedi <a href="#api-update"><code>update()</code></a>.</li>
        <li>La radice deve essere un elemento, come <code>div(...)</code>, non un <code>when()</code> o un <code>list()</code>.</li>
        <li><code>index</code> è interno: non decide dove viene inserito l'elemento, quindi non passarlo.</li>
      </ul>
      <p>Un componente passato come <code>render(App)</code> non deve avere parametri. Uno obbligatorio è un errore di tipo; uno opzionale supera il controllo dei tipi, ma <code>render()</code> lancia un errore a runtime. Se il componente accetta props, avvolgilo:</p>
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
      <p>Prende in carico l'HTML prodotto da <a href="#api-ssr"><code>renderToString()</code></a>: riusa gli elementi esistenti, collega i listener di eventi e riconnette i valori dinamici, <code>when()</code> e <code>list()</code>, così che <code>update()</code> funzioni da lì in avanti. Poi esegue gli hook <code>onMount</code>. <code>parent</code> è <code>document.body</code> di default. Restituisce l'elemento radice.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Usa lo stesso componente, e gli stessi dati, del server.</li>
        <li>Fai l'idratazione in un container dedicato. La radice dell'app deve esserne il primo nodo, anche se gli spazi bianchi non danno problemi. Se un altro nodo viene prima, Nuclo sostituisce quel nodo e lascia lì la copia del server.</li>
        <li>Come con <code>render()</code>, passa <code>App</code> e non <code>App()</code>, così <code>forceUpdate()</code> potrà ricostruire la radice più tardi. <code>App</code> non deve avere parametri: con uno opzionale, <code>hydrate()</code> non collega nulla e non segnala errori. Se il componente accetta props, avvolgilo: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Se dal server non arriva HTML, usa <code>render()</code>.</li>
      </ul>
      <h3>Quando server e client divergono</h3>
      <p>Vince il client:</p>
      <ul>
        <li>Con un tag radice diverso, quel nodo viene sostituito da DOM nuovo; con un container vuoto, il DOM nuovo viene aggiunto.</li>
        <li>Il testo diverso viene corretto. Elementi di <code>list()</code> e rami di <code>when()</code> diversi seguono il client.</li>
        <li>I figli in più del server vengono rimossi, quelli che mancano vengono creati.</li>
        <li>Gli attributi scritti dal server ma non impostati dal client restano come sono.</li>
      </ul>
      <p><code>renderToString()</code> scrive commenti HTML come marcatori, per esempio <code>&lt;!-- text-0 --&gt;</code> prima di ogni nodo di testo, e <code>hydrate()</code> ne ha bisogno: non togliere i commenti dall'HTML del server. Senza i marcatori, l'idratazione elimina le righe di <code>list()</code> e sia <code>list()</code> che <code>when()</code> smettono di aggiornarsi.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Rendering lato server",
        content: `
      <p>Renderizza un componente in una stringa HTML sul server. Nel browser, chiami <a href="#api-hydrate"><code>hydrate()</code></a> con lo stesso componente per rendere interattivo quell'HTML. I runtime lato server non hanno <code>document</code>, quindi importa prima <a href="#api-polyfill"><code>nuclo/polyfill</code></a>.</p>
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
      <p>Lascia <code>id="nuclo-styles"</code> sul tag style: il client riusa quell'elemento e aggiunge solo le regole nuove. Vedi <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Cosa gira sul server</h3>
      <ul>
        <li>Ogni chiamata a <code>renderToString()</code> costruisce l'albero ed esegue ogni valore dinamico una volta.</li>
        <li>Gli handler di eventi, <code>onMount</code> e <code>onDestroy</code> non vengono mai eseguiti, mentre <code>update()</code>, <code>scope()</code> e <code>forceUpdate()</code> non fanno nulla.</li>
        <li>Il rendering è sincrono: carica prima i dati, poi renderizza.</li>
        <li>Dopo un render non resta nulla di registrato, quindi un singolo processo può servire molte richieste. Passa i dati della richiesta come argomenti, per esempio <code>renderToString(Page(user))</code>: le variabili a livello di modulo sono condivise da tutte le richieste.</li>
        <li>Non chiamare <code>render()</code> sul server: aggiunge contenuto al <code>document.body</code> condiviso.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Accetta un builder (<code>App()</code>), un componente (<code>App</code>) o un nodo DOM. Con <code>null</code> e <code>undefined</code> restituisce <code>""</code>. La radice deve essere un elemento. Un componente passato come <code>renderToString(Page)</code> non deve avere parametri, quindi per uno che accetta dati passa <code>Page(user)</code>.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Testo e valori degli attributi vengono escapati come HTML. Il testo dentro <code>script()</code> e <code>style()</code> viene scritto così com'è, spezzando solo i tag di chiusura, quindi non metterci mai input dell'utente.</li>
        <li>Non lancia errori. Se il componente, una funzione di <code>list()</code> o la condizione di un <code>when()</code> lancia un errore, o se manca il polyfill, registra l'errore e restituisce <code>""</code>: se la richiesta deve fallire, controlla che il risultato non sia vuoto. Una funzione di testo o di attributo che lancia un errore produce solo un valore vuoto.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Equivale a <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Avvolge l'output in un elemento. <code>containerTag</code> ha <code>"div"</code> come default e <code>containerAttrs</code> <code>{}</code>. I valori degli attributi vengono escapati, mentre i nomi vengono scritti così come li passi, quindi usa nomi HTML come <code>class</code>. Non passare mai input dell'utente come tag.</p>
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
      <p>Un mini DOM che permette a Nuclo di costruire alberi in Node e Bun. Importalo una volta, prima del primo render: nella maggior parte delle app basta il semplice import.</p>
      <ul>
        <li>Quando non c'è <code>window</code>, imposta <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> e <code>HTMLElement</code>, ma solo quelli che mancano. Non crea <code>window</code>.</li>
        <li>In un browser, o sotto jsdom, non fa nulla.</li>
        <li><code>Event</code> e <code>CustomEvent</code> sono i costruttori nativi del runtime; <code>Node</code>, <code>Element</code> e <code>HTMLElement</code> sono alias delle classi del polyfill.</li>
      </ul>
      <p>È un DOM per costruire alberi, non un browser: non ha <code>innerHTML</code> né <code>getElementById</code>, <code>querySelector()</code> restituisce <code>null</code> e i listener di eventi vengono ignorati. Per ottenere l'HTML usa <code>renderToString()</code>.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
