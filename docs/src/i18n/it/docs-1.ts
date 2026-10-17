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
      <p>Nuclo non ha DOM virtuale, compilatore, proxy né signal.</p>
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
        <li>Costruisci la UI con i builder di tag.</li>
        <li>Passa una funzione per ogni valore che dipende dallo stato.</li>
        <li>Cambia lo stato con JavaScript puro.</li>
        <li>Chiama <code>update()</code>. Nuclo esegue di nuovo le funzioni e applica le modifiche al DOM.</li>
      </ol>
      <p>Cambiare una variabile non tocca il DOM. La pagina cambia solo quando chiami <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Avvio rapido",
        content: `
      <p><code>create-nuclo</code> genera un progetto Vite e TypeScript pronto per Nuclo:</p>
    `,
        afterContent: `
      <p>Ti chiede il nome del progetto. Per saltare la domanda, passa il nome e i flag. Con npm, metti <code>--</code> prima dei flag:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Poi installa e avvia il server di sviluppo:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Opzioni</h3>
      <ul>
        <li><code>[project-name]</code>: la cartella di destinazione. Il valore predefinito è <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: il template da copiare. Oggi esiste solo <code>basic</code>.</li>
        <li><code>-y, --yes</code>: salta le domande e usa i valori predefiniti.</li>
        <li><code>-f, --force</code>: scrivi in una cartella non vuota.</li>
        <li><code>-h, --help</code>: mostra la guida.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Installazione e import",
        content: `
      <p>Per aggiungere Nuclo a un progetto esistente:</p>
      ${sh("npm install nuclo")}
      <p>Oppure usa <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> o <code>bun add nuclo</code>. Nuclo non ha dipendenze.</p>
      <p>Il routing non fa parte del pacchetto principale. Viene distribuito separatamente come <a href="#router-overview"><code>nuclo-router</code></a>, che installi accanto a <code>nuclo</code> quando ti serve.</p>
      <h3>Globali</h3>
      <p><code>import 'nuclo'</code> mette su <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 builder di tag</strong>: 112 per HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) e 63 per SVG, con il suffisso <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). Vedi <a href="#tag-builders">Builder di tag</a>.</li>
        <li><strong>16 helper</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code>.</li>
      </ul>
      <p>L'import deve essere eseguito prima di qualsiasi codice che chiama un builder. I moduli ES vengono eseguiti nell'ordine di import, quindi questo fallisce:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Metti <code>import 'nuclo'</code> per primo nel file di ingresso, oppure importalo in ogni file che usa i globali.</p>
      <h3>Import nominati</h3>
      <p>Gli helper sono anche export nominati. Sono le stesse funzioni dei globali. <code>getCssText()</code> e <code>resetStyles()</code> sono solo export nominati. I builder di tag sono solo globali, quindi <code>import { div } from 'nuclo'</code> non funziona.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Punti di ingresso</h3>
      <ul>
        <li><code>nuclo</code>: registra i globali ed esporta i 16 helper più <code>getCssText</code> e <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> e <code>getCssText</code>. Vedi <a href="#api-ssr">Rendering lato server</a>.</li>
        <li><code>nuclo/polyfill</code>: un piccolo DOM per Node e Bun. Vedi <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: solo tipi. Vedi <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo include i propri tipi. Ti servono due cose:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> e <code>nodenext</code> non sono ancora supportati.</li>
        <li>La lib <code>DOM</code>. TypeScript la include per impostazione predefinita quando non imposti <code>lib</code>.</li>
      </ul>
      <p>Se un qualsiasi file del progetto importa <code>'nuclo'</code>, tutti i file vedono i tipi globali. Non ti serve altro. Se nessun file lo importa, per esempio in un tsconfig separato per i test, aggiungi i tipi tu stesso:</p>
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
      <p>Oppure aggiungi <code>/// &lt;reference types="nuclo/types" /&gt;</code> a un file <code>.d.ts</code>.</p>
      <h3>Tipi utili</h3>
      <p>Questi tipi sono globali, quindi li usi senza import:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: ciò che restituisce un builder di tag. Usalo come tipo di ritorno di un componente.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: qualsiasi cosa un builder di tag accetti come argomento.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: ciò che restituiscono <code>render()</code> e <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: qualsiasi nome di tag HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: l'oggetto degli attributi che un builder di tag accetta, inclusi gli handler <code>on*</code>, <code>onMount</code> e <code>onDestroy</code>. Usalo per i componenti che inoltrano gli attributi agli elementi al loro interno.</li>
        <li><code>MountCallback</code> e <code>DestroyCallback</code>: gli handler <code>onMount</code> e <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: ciò che restituiscono <code>when()</code> e <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: le opzioni che accetta <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> e gli altri tipi di styling. Puoi anche importarli: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> marca ogni membro del DOM come opzionale. Fai un cast quando ti serve il tipo completo dell'elemento: <code>render(App, root) as HTMLDivElement</code>.</p>
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
      <p>Ogni tag HTML è una funzione globale con lo stesso nome: <code>div</code>, <code>span</code>, <code>input</code>, … L'unica eccezione è <code>&lt;var&gt;</code>, che è <code>var_</code> perché <code>var</code> è una parola riservata. Ogni tag SVG ha il suffisso <code>Svg</code>: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Chiamare un builder di tag non crea ancora un elemento. <code>div('Hi')</code> restituisce un <strong>builder</strong>: una funzione che crea l'elemento in seguito. Nuclo la chiama quando lo monti con <code>render()</code> o lo inserisci dentro un altro builder, <code>when()</code> o <code>list()</code>. Ogni uso crea un nuovo elemento.</p>
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
      <p>Un builder accetta un numero qualsiasi di argomenti e li applica da sinistra a destra:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: un nodo di testo.</li>
        <li><strong><code>() =&gt; value</code></strong>: testo che cambia a ogni <code>update()</code>. Vedi <a href="#dynamic-functions">Valori dinamici</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: ignorati.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: resi come testo "true" o "false". Usa <code>when()</code> per le condizioni.</li>
        <li><strong>Un oggetto semplice</strong>: attributi. Vedi <a href="#attributes">Attributi</a>.</li>
        <li><strong>Un risultato di <code>css()</code>, <code>cx()</code> o <code>variants()</code></strong>: aggiunge le sue classi.</li>
        <li><strong><code>on(...)</code></strong>: un listener di eventi o un hook del ciclo di vita.</li>
        <li><strong>Un altro builder, <code>when()</code> o <code>list()</code></strong>: un figlio.</li>
        <li><strong>Un <code>Node</code> del DOM</strong>: aggiunto così com'è.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: un modificatore personalizzato. Vedi sotto.</li>
      </ul>
      <h3>Insidie</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> rende il testo "false". Scrivi <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Gli array non sono figli. Espandili: <code>ul(...names.map((n) =&gt; li(n)))</code>. Per le liste che cambiano, usa <code>list()</code>.</li>
        <li>Una variabile locale con il nome di un tag nasconde il builder. Dentro <code>function Row(label: string)</code>, <code>label(...)</code> non è chiamabile. Cambia i nomi delle variabili locali come <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> e <code>i</code>.</li>
        <li>I browser espongono ogni elemento con un <code>id</code> come variabile globale. Se la pagina contiene <code>&lt;main id="main"&gt;</code> prima che Nuclo venga caricato, Nuclo lascia quel globale al suo posto, quindi <code>main(...)</code> lancia un <code>TypeError</code>. Usa altri id.</li>
      </ul>
      <h3>Modificatori personalizzati</h3>
      <p>Una funzione che dichiara almeno un parametro viene eseguita una volta, nell'ordine degli argomenti, mentre l'elemento viene costruito. Il primo argomento è l'elemento. Il secondo è un indice interno, quindi non farci affidamento. Se restituisce una stringa o un numero, quello diventa testo. Un <code>Node</code> viene aggiunto come figlio. Un oggetto viene applicato come attributi.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Ottenere l'elemento</h3>
      <p><code>render()</code> restituisce l'elemento radice. Dentro un albero, usa <code>on("mount", (el) =&gt; …)</code> o un modificatore personalizzato. Puoi anche chiamare tu stesso la funzione builder per creare un elemento scollegato dal DOM:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Inseriscilo nel documento prima del prossimo <code>update()</code>. Un nodo che non è nel documento quando <code>update()</code> viene eseguito smette di aggiornarsi per sempre.</p>
      <h3>SVG</h3>
      <p>I builder SVG accettano gli stessi argomenti. Nuclo imposta ogni attributo SVG con <code>setAttribute</code>, quindi nomi come <code>"stroke-width"</code> funzionano così come sono scritti.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Tutti i builder</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Componenti",
        content: `
      <p>Un componente è una semplice funzione che restituisce un builder, come <code>button(...)</code>. Non esiste un'API per i componenti. Nulla viene creato finché non lo renderizzi o lo inserisci in un albero.</p>
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
      <p>Lo stato dichiarato dentro la funzione appartiene a quell'istanza. Lo stato dichiarato fuori è condiviso da tutte le istanze. <code>forceUpdate()</code> chiama di nuovo i componenti, il che azzera lo stato dichiarato al loro interno.</p>
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
      <p>Passa un oggetto semplice per impostare gli attributi. Puoi passare più oggetti. Per la stessa chiave vince il valore successivo, tranne per <code>className</code> e <code>style</code>, che si uniscono. Un valore può essere statico, oppure una funzione senza parametri che viene eseguita di nuovo a ogni <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Come viene impostato un valore</h3>
      <ul>
        <li>Se l'elemento HTML ha una proprietà con quel nome (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo imposta la proprietà. Altrimenti chiama <code>setAttribute(key, String(value))</code>, per esempio per <code>"aria-*"</code> e <code>"data-*"</code>.</li>
        <li>Sugli elementi SVG, Nuclo chiama sempre <code>setAttribute</code>.</li>
        <li><code>null</code> e <code>undefined</code> vengono ignorati. Un valore dinamico che restituisce <code>null</code> o <code>undefined</code> mantiene il valore precedente. Per azzerare un valore, restituisci <code>""</code>, oppure <code>false</code> per una proprietà booleana.</li>
        <li>I booleani funzionano per le proprietà booleane del DOM, come <code>disabled</code> su un pulsante, <code>checked</code>, <code>hidden</code> e <code>required</code>. Ovunque altrove, <code>true</code> e <code>false</code> vengono scritti come stringhe "true" e "false".</li>
        <li>Usa chiavi <code>"data-*"</code>. <code>dataset</code> non è supportato.</li>
        <li><code>innerHTML</code> non viene escapato, e il rendering lato server non lo emette. Evitalo.</li>
      </ul>
      <h3>Classi</h3>
      <p>Usa <code>className</code>. Le stringhe di classi statiche, i risultati di <code>css()</code> e un <code>className</code> dinamico si uniscono tutti. Un <code>className</code> dinamico mantiene le classi statiche, e quando restituisce <code>""</code> restano solo le classi statiche.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Non usare la chiave <code>class</code> sugli elementi HTML. Imposta l'attributo grezzo e sostituisce ogni classe applicata prima, incluse le classi di <code>css()</code>.</p>
      <h3>Stili inline</h3>
      <p><code>style</code> accetta un oggetto con chiavi in camelCase, oppure una funzione che ne restituisce uno.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo non aggiunge unità. Scrivi <code>"12px"</code>, non <code>12</code>. Le proprietà senza unità come <code>opacity</code> e <code>zIndex</code> accettano numeri.</li>
        <li><code>""</code>, <code>null</code> e <code>undefined</code> azzerano una proprietà.</li>
        <li>Uno stile dinamico imposta solo le chiavi che restituisce. Una chiave che smette di restituire mantiene il valore precedente, quindi restituisci <code>""</code> per azzerarla.</li>
        <li>Le stringhe di stile (<code>"color: red"</code>) e le proprietà personalizzate (<code>"--gap"</code>) non sono supportate. Usa invece <code>css()</code>. Accetta le proprietà personalizzate tramite <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Eventi",
        content: `
      <p>Ci sono due modi per ascoltare gli eventi: gli attributi <code>on*</code> e il modificatore <code>on()</code>.</p>
      <h3>Attributi <code>on*</code></h3>
      <p>In un oggetto di attributi, una funzione sotto una chiave come <code>onClick</code> (<code>on</code> seguito da una lettera maiuscola) è un gestore di eventi, non un valore dinamico.</p>
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
        <li>Nuclo imposta la proprietà nativa, quindi <code>onClick</code> diventa <code>el.onclick</code>. C'è un solo handler per evento: un <code>onClick</code> successivo sostituisce quello precedente.</li>
        <li><code>onDoubleClick</code> e <code>onDblClick</code> indicano entrambi <code>dblclick</code>. Le chiavi in minuscolo come <code>onclick</code> sono errori di tipo.</li>
        <li>Un nome che non è un evento noto ascolta la sua forma in minuscolo: <code>onMyEvent</code> ascolta <code>"myevent"</code>.</li>
        <li>Gli errori lanciati dall'handler non vengono catturati.</li>
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
        <li>Ogni <code>on()</code> aggiunge un listener. Vengono eseguiti tutti, in ordine.</li>
        <li><code>options</code> va direttamente ad <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Passa <code>on()</code> direttamente a un builder e il tipo dell'elemento viene dedotto: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Se un listener lancia un errore, Nuclo lo registra con <code>console.error</code>, e gli altri listener vengono comunque eseguiti.</li>
        <li>Nuclo rimuove il listener quando rimuove l'elemento. Sul server, <code>on()</code> non fa nulla.</li>
        <li>Puoi riutilizzare un singolo valore <code>on()</code> su molti elementi.</li>
      </ul>
      <p>Per un evento personalizzato, passa il tipo dell'evento come generico:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Quale usare</h3>
      <p>Usa gli attributi <code>on*</code> per il caso comune. Usa <code>on()</code> quando ti servono più listener per un evento, opzioni del listener, oppure un nome di evento personalizzato come <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Ciclo di vita",
        content: `
      <p><code>onMount</code> viene eseguito una volta, dopo che l'elemento è stato inserito. <code>onDestroy</code> viene eseguito una volta, quando Nuclo rimuove l'elemento. Scrivili come attributi o con <code>on()</code>. Le due forme si comportano allo stesso modo, e l'elemento è tipizzato in base al suo tag.</p>
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
        <li><code>onMount</code> viene eseguito alla fine della chiamata a <code>render()</code>, <code>hydrate()</code>, <code>update()</code> o <code>forceUpdate()</code> che ha inserito l'elemento. Non viene mai eseguito mentre l'albero è in costruzione.</li>
        <li>Se <code>onMount</code> restituisce una funzione, quella funzione viene eseguita alla distruzione, dopo le callback <code>onDestroy</code> dell'elemento.</li>
        <li><code>onDestroy</code> viene eseguito quando Nuclo rimuove l'elemento: una riga di <code>list()</code> viene rimossa, un ramo di <code>when()</code> cambia, un <code>into()</code> lascia la sua regione, oppure <code>forceUpdate()</code> lo scarta. Viene eseguito subito prima della rimozione, quindi l'elemento è ancora nel documento.</li>
      </ul>
      <h3>Rimozione diretta dal DOM</h3>
      <p>Se rimuovi un elemento tu stesso, con <code>node.remove()</code> o <code>innerHTML = ''</code>, i suoi <code>onDestroy</code> e le pulizie non vengono mai eseguiti, e i timer continuano a girare. Nuclo non ha <code>unmount()</code>. Per smontare un'app con pulizia, avvolgila in un <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Ordine ed errori</h3>
      <ul>
        <li>Puoi registrare quanti hook vuoi, in entrambe le forme. Vengono eseguiti nell'ordine di registrazione.</li>
        <li><code>onDestroy</code> esegue sempre prima i figli, poi il genitore.</li>
        <li>Gli elementi vengono montati nell'ordine del loro primo hook <code>onMount</code>, che segue l'ordine degli argomenti, e ogni elemento esegue tutti i suoi hook insieme. Passa l'hook di un genitore prima dei suoi figli se questi dipendono da esso.</li>
        <li>Un hook che lancia un errore viene registrato con <code>console.error</code>. Gli altri hook vengono comunque eseguiti.</li>
        <li>La callback non deve restituire alcun valore, salvo una funzione di pulizia, quindi non renderla <code>async</code>. Una Promise restituita non viene mai usata come pulizia. Avvia il lavoro asincrono al suo interno: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Gli hook non vengono mai eseguiti sul server. Sul client, vengono eseguiti dopo <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Nota:</strong> gli hook non sono effetti. Non vengono mai eseguiti di nuovo quando lo stato cambia. Ognuno viene eseguito al massimo una volta per elemento.</div>
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
      <p>Nuclo non aggiorna mai la pagina da solo. Cambia il tuo stato, poi chiama <code>update()</code>.</p>
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
      <p>Cambia tutto lo stato che vuoi, poi chiama <code>update()</code> una sola volta:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Chiama <code>update()</code> dai gestori di eventi, dai timer, dalle callback di fetch o da <code>onMount</code>. Non chiamarlo dall'interno di un valore dinamico.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Valori dinamici",
        content: `
      <p>Una funzione <strong>senza parametri</strong> è un <strong>valore dinamico</strong>. Nuclo la esegue una volta quando costruisce l'elemento, e di nuovo a ogni <code>update()</code>. Usa i valori dinamici per i figli di testo, i valori degli attributi, <code>style</code> e <code>className</code>. Per i figli che compaiono, scompaiono o si ripetono, usa <a href="#api-when"><code>when()</code></a> e <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo controlla il numero di parametri (<code>fn.length</code>). Una funzione che dichiara un parametro è un <a href="#tag-builders">modificatore personalizzato</a> e viene eseguita una sola volta. <code>(x = 0) =&gt; …</code> e <code>(...args) =&gt; …</code> hanno length 0, quindi sono dinamiche.</p>
      <h3>Testo dinamico</h3>
      <ul>
        <li>Un valore di tipo string, number, bigint o boolean viene convertito con <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> mostra "false", quindi scrivi <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> e <code>undefined</code> vengono resi come testo vuoto.</li>
        <li>Un risultato di <code>css()</code> o <code>cx()</code> alla prima esecuzione rende la funzione una classe dinamica, non testo. Vedi <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Un nodo, un builder, un array o un oggetto semplice non rende nulla, e non si aggiorna mai.</li>
      </ul>
      <h3>Attributi dinamici</h3>
      <ul>
        <li>Nuclo scrive un valore solo quando è diverso dall'ultimo valore che Nuclo ha scritto. Non lo confronta con il DOM reale, quindi se un utente digita in un input e la tua funzione restituisce lo stesso valore di prima, il testo digitato resta.</li>
        <li>Un risultato <code>null</code> o <code>undefined</code> non scrive nulla, quindi il valore precedente resta. <code>className</code> è l'eccezione: qualsiasi risultato falsy rimuove le classi dinamiche e mantiene quelle statiche.</li>
        <li>Una funzione <code>style</code> applica l'oggetto restituito a ogni aggiornamento.</li>
      </ul>
      <h3>Errori</h3>
      <p>Se un valore dinamico lancia un errore, Nuclo lo cattura e il resto dell'aggiornamento prosegue. Il testo diventa vuoto o mantiene il valore precedente, e un attributo mantiene il valore precedente. Entrambi si ripristinano al prossimo <code>update()</code> che va a buon fine. L'eccezione: una funzione di testo che lancia un errore alla <strong>prima</strong> esecuzione resta vuota per sempre.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Esegue un passaggio sincrono su ogni valore dinamico della pagina. Con degli id, aggiorna solo ciò che si trova dentro gli elementi marcati con quegli id di <a href="#api-scope"><code>scope()</code></a>. Ogni passaggio esegue questi passi in ordine:</p>
      <ol>
        <li><code>list()</code>: rilegge gli elementi e aggiunge, sposta o rimuove righe.</li>
        <li><code>when()</code>: ricontrolla le condizioni. Un ramo viene ricostruito solo quando diventa attivo un ramo diverso.</li>
        <li>Attributi dinamici, inclusi <code>style</code> e <code>className</code>.</li>
        <li>Testo dinamico.</li>
        <li><code>onMount</code> per gli elementi inseriti dai passi 1 e 2.</li>
      </ol>
      <ul>
        <li><strong>Esegue tutto.</strong> Ogni valore dinamico viene eseguito a ogni chiamata, anche quando i suoi dati non sono cambiati. Viene saltata solo la scrittura sul DOM. Mantieni i valori dinamici veloci e privi di effetti collaterali.</li>
        <li><strong>Solo i nodi nel documento.</strong> Se un nodo non è nel documento quando <code>update()</code> viene eseguito, Nuclo smette di tracciarlo. Non si aggiorna mai più, anche dopo che lo inserisci. Questo vale anche per <code>list()</code> e <code>when()</code>. Renderizza in un contenitore che è nel documento.</li>
        <li><strong>I valori statici non cambiano mai.</strong> Le stringhe semplici e i valori degli attributi sono fissati quando l'elemento viene costruito. Per ricostruirli, usa <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Errori.</strong> Gli errori di testo e attributi vengono catturati, e il passaggio prosegue. Se una condizione di <code>when()</code> lancia un errore, l'errore viene registrato e quel <code>when()</code> smette di aggiornarsi. Se una funzione <code>items</code> o <code>renderItem</code> di <code>list()</code> lancia un errore, l'errore esce da <code>update()</code> e i passi rimanenti non vengono eseguiti.</li>
        <li><strong>Server.</strong> <code>update()</code> non fa nulla sul server.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Assegna all'elemento a cui viene passato uno o più id di scope. <code>update('id')</code> aggiorna poi solo ciò che si trova dentro quell'elemento, inclusi gli attributi dell'elemento stesso.</p>
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
        <li><code>update('a', 'b')</code> aggiorna tutto ciò che si trova dentro <code>a</code> o <code>b</code>. Se più elementi usano lo stesso id, si aggiornano tutti.</li>
        <li>Con scope annidati, <code>update('outer')</code> include lo scope interno. <code>update('inner')</code> non tocca quello esterno.</li>
        <li>Un id che nessun elemento nel documento possiede non aggiorna <strong>nulla</strong> e non genera errori, quindi controlla l'ortografia.</li>
        <li><code>scope()</code> non fa nulla sul server.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Renderizza contenuto in base a una condizione. Nuclo ricontrolla le condizioni a ogni <code>update()</code>. Vince la prima condizione vera. Se nessuna è vera, viene reso il contenuto di <code>.else()</code>. Senza <code>.else()</code>, non viene reso nulla.</p>
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
        <li>Per lo stato, passa una funzione. Un booleano semplice viene letto una sola volta: <code>when(open, …)</code> non cambia mai.</li>
        <li>In TypeScript la funzione deve restituire un boolean. Scrivi <code>() =&gt; items.length &gt; 0</code> oppure <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Cosa si aggiorna</h3>
      <ul>
        <li>Finché lo stesso ramo resta attivo, i suoi elementi vengono mantenuti. I valori dinamici, le liste e i blocchi <code>when()</code> al suo interno continuano ad aggiornarsi.</li>
        <li>Quando diventa attivo un ramo diverso, il vecchio contenuto viene rimosso e i suoi hook <code>onDestroy</code> vengono eseguiti. Il nuovo ramo viene costruito da zero e i suoi hook <code>onMount</code> vengono eseguiti. Lo stato nei vecchi elementi, come il testo di un input o il focus, va perso.</li>
      </ul>
      <h3>Contenuto dei rami</h3>
      <p>Metti dei figli in un ramo: testo, testo dinamico, builder, <code>list()</code> e <code>when()</code> annidati. Passa builder come <code>p('Hi')</code>, non nodi DOM: un nodo DOM smette di aggiornarsi dopo che il suo ramo viene nascosto una volta.</p>
      <p>Gli oggetti di attributi e gli <code>on()</code> in un ramo si applicano all'elemento genitore, e restano dopo che il ramo viene nascosto. Per un attributo condizionale, usa un attributo dinamico: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Concatenamento</h3>
      <p><code>.when()</code> e <code>.else()</code> restituiscono un nuovo builder e non modificano l'originale. Se chiami <code>.else()</code> due volte, vince l'ultima chiamata.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Renderizza una riga per elemento. A ogni <code>update()</code>, Nuclo chiama di nuovo <code>items()</code> e abbina i nuovi elementi alle righe esistenti per identità (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Come vengono abbinate le righe</h3>
      <ul>
        <li>Un elemento ancora presente mantiene la sua riga. Nuclo sposta la riga se necessario, e non chiama di nuovo <code>renderItem</code>.</li>
        <li>Un nuovo elemento riceve una nuova riga. Un elemento rimosso perde la sua riga, e i suoi hook <code>onDestroy</code> vengono eseguiti.</li>
        <li>Gli elementi duplicati ricevono ciascuno la propria riga.</li>
        <li>Puoi modificare l'array sul posto (<code>push</code>, <code>splice</code>, <code>sort</code>) oppure restituire un nuovo array.</li>
      </ul>
      <p>Una riga mantenuta non viene mai renderizzata di nuovo, quindi usa valori dinamici per i campi che cambiano:</p>
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
      <p>Le copie sono nuovi elementi, quindi sostituire l'array con <code>todos.map((t) =&gt; ({ ...t }))</code> ricostruisce ogni riga.</p>
    `,
        afterContent: `
      <h3>Cosa restituisce <code>renderItem</code></h3>
      <ul>
        <li>Restituisci un solo elemento, come <code>li(...)</code>, <code>tr(...)</code> o un builder SVG. Restituisci <code>null</code> o <code>undefined</code> per saltare un elemento. Stringhe, nodi di testo e frammenti non rendono nulla.</li>
        <li>Non restituire direttamente <code>when()</code> o <code>list()</code>. Mettili dentro l'elemento della riga: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Per nascondere elementi, filtra in <code>items()</code>, non in <code>renderItem</code>.</li>
        <li>Mantieni <code>renderItem</code> privo di effetti collaterali. Nuclo può chiamarlo più di una volta per lo stesso elemento.</li>
      </ul>
      <h3>L'indice</h3>
      <p><code>index</code> è la posizione dell'elemento quando la sua riga è stata creata. Non viene aggiornato quando le righe si spostano. Per la posizione corrente, usa un valore dinamico: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iterabili</h3>
      <p>Funziona qualsiasi iterabile: array, <code>Set</code>, generatori e <code>map.values()</code>. Restituire ogni volta lo stesso array o <code>Set</code> va bene. Un iteratore, come un generatore o <code>map.values()</code>, si esaurisce dopo un passaggio, quindi crealo dentro <code>items()</code> a ogni chiamata. Iterare direttamente una <code>Map</code> crea ogni volta nuovi array <code>[key, value]</code>, quindi ogni riga viene ricostruita. Usa invece <code>map.values()</code>.</p>
      <h3>Posizionamento</h3>
      <p>Le righe compaiono dove <code>list()</code> si trova tra i suoi fratelli, tra due marcatori di commento. Gli altri figli del genitore non vengono toccati. <code>list()</code> funziona anche dentro i builder SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() e into()",
        content: `
      <p><code>region()</code> marca un punto con nome nell'albero. <code>into()</code> lo riempie da qualsiasi altro punto, a qualsiasi profondità. Il layout non riceve il contenuto come prop, e il componente che costruisce il contenuto non sa dove finirà.</p>
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
        <li><code>into()</code> lascia solo un commento nel punto in cui è scritto. Il suo contenuto viene reso tra i marcatori della regione.</li>
        <li>L'ordine non conta. Un <code>into()</code> costruito prima della sua regione aspetta e appare nel momento in cui la regione viene costruita. Le viste appaiono nell'ordine in cui sono state scritte.</li>
        <li>Il contenuto vive quanto la vista. Quando il <code>when()</code> che contiene un <code>into()</code> si chiude, o la sua riga di <code>list()</code> viene rimossa, il contenuto lascia la regione. Riaprirlo aggiunge una copia, non due.</li>
        <li>Quando una regione scompare, per esempio perché il suo <code>when()</code> si chiude, le sue viste tornano in attesa. Una regione costruita in seguito con lo stesso id le mostra.</li>
        <li>Un <code>into()</code> il cui id non corrisponde a nessuna regione non rende nulla e non genera errori, quindi controlla l'ortografia.</li>
        <li>Gli id sono unici nell'albero. Una seconda regione costruita con un id già attivo registra un avviso.</li>
        <li>Le regioni funzionano con il <a href="#api-ssr">rendering lato server</a>. Con <code>hydrate()</code>, ogni vista riutilizza l'HTML prodotto dal server invece di costruirlo di nuovo.</li>
      </ul>
      <h3>Opzioni</h3>
      <ul>
        <li><code>id</code>: il nome che le chiamate a <code>into()</code> usano per trovare la regione.</li>
        <li><code>type</code>: <code>'latest'</code> (il predefinito) mostra solo la vista più recente. <code>'stack'</code> mostra tutte le viste, in ordine di arrivo.</li>
        <li><code>empty</code>: reso mentre la regione non contiene viste.</li>
      </ul>
      <h3>Regioni a pila</h3>
      <p>Con <code>type: 'stack'</code>, una vista che si apre sopra un'altra non ricostruisce quella sottostante. Il suo DOM, il focus e lo stato del form restano. Usalo per un livello come un dialog sopra una pagina.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>Più regioni contemporaneamente</h3>
      <p>Passa un oggetto per riempire più di una regione da un singolo <code>into()</code>. Un valore può essere un singolo figlio o un array di figli. Entrambe le forme si annidano: un <code>into()</code> dentro il contenuto di un'altra vista punta alla propria regione.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Un dialog aperto dal profondo dell'albero</h3>
      <p>La regione overlay si trova alla radice. Qualsiasi componente, a qualsiasi profondità, apre un dialog avvolgendo un <code>into()</code> in un <code>when()</code>. Chiudere il <code>when()</code> rimuove il dialog dalla regione.</p>
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
      <h3>Toast dalle righe di una lista</h3>
      <p>Ogni riga di un <code>list()</code> è una vista. Una regione a pila le mostra in ordine, e rimuovere un elemento dall'array rimuove il suo toast.</p>
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
      <h3>Un titolo di pagina impostato dalla pagina</h3>
      <p>Con il predefinito <code>type: 'latest'</code>, vince la vista più recente. Il layout definisce l'intestazione, e la pagina aperta in quel momento le dà il nome. Una pagina senza <code>into('title', …)</code> lascia il testo di <code>empty</code>.</p>
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
      <p>Il contenuto di un <code>into()</code> è normale contenuto Nuclo. Le funzioni al suo interno sono valori dipendenti dallo stato e si aggiornano a ogni <code>update()</code>, ovunque si trovi la regione.</p>
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
      <p>L'<code>into()</code> della dashboard è scritto una sola volta. Mentre l'utente è disconnesso non esiste una regione <code>main</code>, quindi la vista aspetta. L'accesso costruisce la regione e la vista appare. La disconnessione rimuove la regione e la vista torna in attesa.</p>
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
      <h3>Una vista con la propria regione</h3>
      <p>Una vista può contenere una <code>region()</code>, e altre viste possono puntarvi. Qui la pagina dell'editor porta con sé una regione <code>tabs</code>, e ogni tab la riempie. Quando l'editor si chiude, la sua regione se ne va con lui.</p>
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
      <h3>Esempio dal vivo</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> esegue solo i valori dinamici. I valori statici, come il testo in <code>h1(labels[lang].title)</code>, sono fissati quando l'albero viene costruito. <code>forceUpdate()</code> chiama di nuovo i tuoi componenti e applica le modifiche al DOM reale per farlo corrispondere, valori statici inclusi. Usalo per cambiamenti rari e globali all'app, come il cambio di lingua. Usa <code>update()</code> per tutto il resto.</p>
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
      <p>Senza argomenti, <code>forceUpdate()</code> ricostruisce ogni radice renderizzata con <code>render(App)</code> o <code>hydrate(App)</code>. Le radici renderizzate con <code>render(App())</code> vengono saltate. Se un componente lancia un errore, l'errore viene registrato e quella radice mantiene il vecchio DOM. Anche un errore lanciato in seguito, mentre la nuova costruzione viene applicata, viene registrato, ma le parti già modificate restano modificate.</p>
      <h3>Cosa resta e cosa cambia</h3>
      <ul>
        <li>I figli vengono abbinati in ordine, per tag. Un elemento corrispondente viene riutilizzato, quindi il focus e i valori digitati negli input restano, e i suoi hook <code>onMount</code> non vengono eseguiti di nuovo. Dal momento in cui il tag di un figlio differisce, quel figlio e tutti i fratelli successivi vengono costruiti da zero.</li>
        <li>Testo, attributi, classi, stili, listener, rami di <code>when()</code> e righe di <code>list()</code> seguono la nuova costruzione.</li>
        <li>I nuovi elementi vengono creati, e i loro hook <code>onMount</code> vengono eseguiti. Gli elementi che la nuova costruzione non produce più vengono rimossi, e i loro hook <code>onDestroy</code> vengono eseguiti.</li>
        <li>Anche le righe di <code>list()</code> vengono abbinate per posizione, non per elemento, quindi una riga riutilizzata può finire per mostrare un elemento diverso.</li>
        <li>Gli attributi che la nuova costruzione non imposta più non vengono rimossi.</li>
      </ul>
      <div class="docs-callout"><strong>Attenzione:</strong> lo stato dichiarato dentro la funzione di un componente viene azzerato, perché la funzione viene eseguita di nuovo. Tieni lo stato che deve sopravvivere fuori dal componente.</div>
      <p><strong>Forma esplicita.</strong> <code>forceUpdate(App(), parent)</code> ricostruisce un solo albero in <code>parent</code> e restituisce la sua radice. Non registra la radice per le chiamate successive. Come <code>hydrate()</code>, si aspetta che la radice sia il primo nodo di <code>parent</code>. Se il primo nodo ha un tag diverso, viene sostituito.</p>
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
      <p>Costruisce il tuo albero e aggiunge il suo elemento radice a <code>parent</code>. <code>parent</code> ha come valore predefinito <code>document.body</code>. Restituisce l'elemento radice.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Puoi passare il componente (<code>render(App)</code>) o il builder che restituisce (<code>render(App())</code>). Il DOM è lo stesso. Solo <code>render(App)</code> permette a <a href="#api-force-update"><code>forceUpdate()</code></a> di ricostruire la radice in seguito, quindi preferiscilo.</li>
        <li>Aggiunge in coda. Non svuota <code>parent</code>, quindi chiamarlo due volte aggiunge due copie.</li>
        <li>Ogni <code>onMount</code> nell'albero è stato eseguito quando <code>render()</code> ritorna.</li>
        <li>Renderizza in un elemento che è nel documento. Vedi <a href="#api-update"><code>update()</code></a>.</li>
        <li>La radice deve essere un elemento, come <code>div(...)</code>, non <code>when()</code> o <code>list()</code>.</li>
        <li><code>index</code> è interno. Non sceglie dove viene inserito l'elemento. Non passarlo.</li>
      </ul>
      <p>Un componente passato come <code>render(App)</code> non deve avere parametri. Un parametro obbligatorio è un errore di tipo. Uno opzionale supera il controllo dei tipi, ma <code>render()</code> lancia un errore a runtime. Avvolgi un componente che accetta props:</p>
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
      <p>Prende in carico l'HTML prodotto da <a href="#api-ssr"><code>renderToString()</code></a>. Riutilizza gli elementi esistenti, collega i listener di eventi e connette i valori dinamici, <code>when()</code> e <code>list()</code>, così che <code>update()</code> funzioni in seguito. Poi esegue gli hook <code>onMount</code>. <code>parent</code> ha come valore predefinito <code>document.body</code>. Restituisce l'elemento radice.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Usa lo stesso componente, e gli stessi dati, del server.</li>
        <li>Idrata in un contenitore dedicato. La radice dell'app deve essere il suo primo nodo, anche se gli spazi bianchi vanno bene. Se un altro nodo viene prima, Nuclo sostituisce quel nodo e lascia lì la copia del server.</li>
        <li>Come con <code>render()</code>, passa <code>App</code>, non <code>App()</code>, così che <code>forceUpdate()</code> possa ricostruire la radice in seguito. <code>App</code> non deve avere parametri. Con uno opzionale, <code>hydrate()</code> non collega nulla e non segnala errori. Avvolgi un componente che accetta props: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Se non c'è HTML dal server, usa <code>render()</code>.</li>
      </ul>
      <h3>Quando server e client differiscono</h3>
      <p>Vince il client:</p>
      <ul>
        <li>Un tag radice diverso: quel nodo viene sostituito con DOM nuovo. Un contenitore vuoto: viene aggiunto DOM nuovo.</li>
        <li>Il testo diverso viene corretto. Elementi di <code>list()</code> e rami di <code>when()</code> diversi seguono il client.</li>
        <li>I figli in eccesso del server vengono rimossi, e quelli mancanti vengono creati.</li>
        <li>Gli attributi che il server ha scritto ma che il client non imposta vengono lasciati così come sono.</li>
      </ul>
      <p><code>renderToString()</code> scrive commenti HTML come marcatori, per esempio <code>&lt;!-- text-0 --&gt;</code> prima di ogni nodo di testo. <code>hydrate()</code> ne ha bisogno, quindi non rimuovere i commenti dall'HTML del server. Senza i marcatori, l'idratazione elimina le righe di <code>list()</code>, e <code>list()</code> e <code>when()</code> smettono di aggiornarsi.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Rendering lato server",
        content: `
      <p>Renderizza un componente in una stringa HTML sul server. Nel browser, chiama <a href="#api-hydrate"><code>hydrate()</code></a> con lo stesso componente per rendere quell'HTML interattivo. I runtime server non hanno <code>document</code>, quindi importa prima <a href="#api-polyfill"><code>nuclo/polyfill</code></a>.</p>
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
      <p>Mantieni <code>id="nuclo-styles"</code> sul tag style. Il client riutilizza quell'elemento e aggiunge solo le nuove regole. Vedi <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Cosa viene eseguito sul server</h3>
      <ul>
        <li>Ogni chiamata a <code>renderToString()</code> costruisce l'albero ed esegue ogni valore dinamico una volta.</li>
        <li>I gestori di eventi, <code>onMount</code> e <code>onDestroy</code> non vengono mai eseguiti. <code>update()</code>, <code>scope()</code> e <code>forceUpdate()</code> non fanno nulla.</li>
        <li>Il rendering è sincrono. Carica prima i dati, poi renderizza.</li>
        <li>Nulla resta registrato dopo un render, quindi un singolo processo può servire molte richieste. Passa i dati della richiesta come argomenti, per esempio <code>renderToString(Page(user))</code>. Le variabili a livello di modulo sono condivise da tutte le richieste.</li>
        <li>Non chiamare <code>render()</code> sul server. Aggiunge contenuto al <code>document.body</code> condiviso.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Accetta un builder (<code>App()</code>), un componente (<code>App</code>) o un nodo DOM. <code>null</code> e <code>undefined</code> restituiscono <code>""</code>. La radice deve essere un elemento. Un componente passato come <code>renderToString(Page)</code> non deve avere parametri, quindi passa <code>Page(user)</code> per uno che accetta dati.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>I valori di testo e attributi vengono escapati come HTML. Il testo dentro <code>script()</code> e <code>style()</code> viene scritto così com'è, con solo i tag di chiusura spezzati, quindi non metterci mai input dell'utente.</li>
        <li>Non lancia errori. Se il componente, una funzione di <code>list()</code> o una condizione di <code>when()</code> lancia un errore, o il polyfill manca, registra l'errore e restituisce <code>""</code>. Controlla se il risultato è vuoto quando la richiesta deve fallire. Una funzione di testo o attributo che lancia un errore produce soltanto un valore vuoto.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Equivale a <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Avvolge l'output in un elemento. <code>containerTag</code> ha come valore predefinito <code>"div"</code>, e <code>containerAttrs</code> <code>{}</code>. I valori degli attributi vengono escapati. I nomi degli attributi vengono scritti come forniti, quindi usa nomi HTML come <code>class</code>. Non passare mai input dell'utente come tag.</p>
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
      <p>Un piccolo DOM che permette a Nuclo di costruire alberi in Node e Bun. Importalo una volta, prima del primo render. La maggior parte delle app ha bisogno solo del semplice import.</p>
      <ul>
        <li>Quando non c'è <code>window</code>, imposta <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> e <code>HTMLElement</code>, ma solo quelli mancanti. Non crea <code>window</code>.</li>
        <li>In un browser, o sotto jsdom, non fa nulla.</li>
        <li><code>Event</code> e <code>CustomEvent</code> sono i costruttori nativi del runtime. <code>Node</code>, <code>Element</code> e <code>HTMLElement</code> sono alias delle classi del polyfill.</li>
      </ul>
      <p>È un DOM per costruire alberi, non un browser. Non ha <code>innerHTML</code> né <code>getElementById</code>, <code>querySelector()</code> restituisce <code>null</code>, e i listener di eventi vengono ignorati. Usa <code>renderToString()</code> per ottenere l'HTML.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
