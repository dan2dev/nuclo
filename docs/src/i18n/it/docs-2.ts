import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "Stili",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>Trasforma un oggetto di stile tipizzato in classi CSS generate. Passa il risultato a qualsiasi costruttore di tag. Nel browser, le regole finiscono in un unico elemento <code>&lt;style id="nuclo-styles"&gt;</code>. Sul server, le restituisce <a href="#api-css-text"><code>getCssText()</code></a>.</p>
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
        <li><code>css()</code> crea una classe per le dichiarazioni di base, più una classe per ogni chiave pseudo, selettore e blocco media. La card sopra ottiene due classi.</li>
        <li>I nomi delle classi sono hash del contenuto. Stili identici condividono una classe, e server e client producono gli stessi nomi.</li>
        <li>Definisci gli stili una sola volta, a livello di modulo. <code>css()</code> usa una cache per oggetto, quindi un oggetto nuovo a ogni chiamata viene rielaborato ogni volta.</li>
        <li>Modificare un oggetto di stile dopo averlo passato a <code>css()</code> non ha effetto.</li>
        <li>Ogni stile resta registrato per tutta la vita della pagina o del processo server. Per valori che cambiano per ogni elemento, come una larghezza che viene dai dati, usa l'<a href="#attributes">attributo <code>style</code></a>.</li>
      </ul>
      <h3>Stili con nome</h3>
      <p>Passa prima un nome per ottenere un nome di classe leggibile:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>La classe di base è esattamente il nome. Gli altri blocchi ottengono <code>name-&lt;hash&gt;</code>.</li>
        <li>Il nome deve essere un nome di classe valido. Altrimenti Nuclo avvisa e ne genera uno.</li>
        <li>I nomi sono globali. Se due stili diversi usano lo stesso nome, Nuclo avvisa.</li>
      </ul>
      <h3>Usare il risultato</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> e <code>card.className</code> restituiscono entrambi i nomi delle classi.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Oggetti di stile",
        content: `
      <p>L'oggetto che passi a <code>css()</code> usa le proprietà CSS comuni in camelCase, un insieme di abbreviazioni e chiavi annidate per pseudo stati, selettori e media query. TypeScript le completa tutte. Le proprietà fuori dall'insieme tipizzato, come <code>borderTopLeftRadius</code>, <code>fill</code> o <code>paddingInline</code>, vanno in <code>raw</code> (vedi sotto).</p>
      <h3>Valori</h3>
      <ul>
        <li>I numeri diventano <code>px</code>, tranne <code>0</code> e le proprietà senza unità: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> e <code>gridRow</code>. In <code>raw</code>, anche <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> e <code>animation-iteration-count</code> sono senza unità.</li>
        <li>Le stringhe sono usate così come sono scritte. <code>null</code>, <code>undefined</code> e <code>false</code> vengono saltati.</li>
        <li><code>lineHeight</code> (e <code>leading</code>) è senza unità, quindi <code>leading: 24</code> significa 24 volte la dimensione del font. Scrivi <code>"24px"</code> per i pixel.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Abbreviazioni</h3>
      <table>
        <thead><tr><th>Chiave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, e ciascun lato</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding sinistra e destra / sopra e sotto</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>lo stesso per margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height, e i rispettivi min e max</td></tr>
          <tr><td><code>size</code></td><td>width e height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Queste chiavi accettano <code>true</code>:</p>
      <table>
        <thead><tr><th>Chiave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (non imposta display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudo stati</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> e <code>firstLetter</code>. Si annidano: <code>hover: { focus: {…} }</code> produce <code>:hover:focus</code>.</p>
      <h3>Selettori e at-rule</h3>
      <p>Una chiave che inizia con <code>&amp;</code> è un selettore, e ogni <code>&amp;</code> diventa la classe. Una chiave che inizia con <code>@</code> è una at-rule: <code>@media</code>, <code>@container</code> o <code>@supports</code>.</p>
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
        <li>La chiave deve iniziare con <code>&amp;</code>. Una chiave come <code>".dark &amp;"</code> viene ignorata, quindi scrivi <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Due blocchi <code>@media</code> annidati si combinano con <code>and</code>. Una query che inizia con un tipo di media (<code>print</code>, <code>only screen</code>) viene messa per prima, perché la grammatica ammette un tipo solo all'inizio. Una coppia che non può essere appiattita — due tipi di media, o un <code>not</code> iniziale — produce un avviso e usa solo la query interna. Qualsiasi altra at-rule annidata sostituisce quella esterna.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Usa <code>raw</code> per qualsiasi proprietà, con il nome scritto esattamente come in CSS. I numeri ricevono comunque <code>px</code>, quindi passa stringhe:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Qualsiasi altra chiave piatta viene convertita in kebab-case e scritta così com'è, quindi un errore di battitura come <code>colr: 'red'</code> diventa una dichiarazione che il browser scarta. Un oggetto annidato sotto una chiave che non è uno pseudo stato, uno screen, o una chiave <code>&amp;</code> o <code>@</code> viene ignorato. TypeScript segnala entrambi i casi.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Combina stili. Quando due input impostano la stessa proprietà, vince l'input successivo.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Gli input falsy vengono saltati, gli array appiattiti, e le stringhe divise e deduplicate.</li>
        <li>Le classi generate per lo stesso blocco (base, stesso pseudo, stessa media query) si fondono in una nuova classe. Gli altri nomi di classe passano invariati.</li>
        <li>Solo <code>cx()</code> conosce l'ordine degli argomenti. Con <code>div(base, blue)</code> vengono aggiunte entrambe le classi, e vince la regola creata per ultima. Metti gli stili che si sovrascrivono a vicenda in un'unica chiamata a <code>cx()</code>.</li>
        <li>Quando il blocco di uno stile con nome si fonde con il blocco di un altro input, la classe risultante è <code>name-&lt;hash&gt;</code>, non il nome nudo. I blocchi che non si fondono mantengono la loro classe, quindi <code>cx(pageTitle, 'extra')</code> ha ancora <code>page-title</code>.</li>
      </ul>
      <h3>Classi dinamiche</h3>
      <p>Passa una funzione che restituisce sempre <code>cx(...)</code>:</p>
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
      <p>La funzione deve restituire un risultato di stile alla prima esecuzione. <code>() =&gt; active &amp;&amp; activeButton</code> renderizza il testo "false" invece di una classe.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Restituisce i propri <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code>, legati a un tema. Un tema dà un nome ai valori: con il tema qui sotto, <code>borderColor: 'border'</code> scrive <code>#e5e7eb</code>, e TypeScript completa i nomi. Ogni voce in <code>screens</code> diventa una chiave di stile per una media query, come <code>md: {…}</code>.</p>
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
        <thead><tr><th>Chiave del tema</th><th>Usata da</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> e ciascun lato, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>nuove chiavi di stile, come <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Un nome del tema viene risolto solo quando è l'intero valore. <code>border: "1px solid primary"</code> non viene risolto.</li>
        <li>Un valore di screen senza <code>@</code> diventa <code>@media &lt;valore&gt;</code>. Un valore che inizia con <code>@</code> è usato così come è scritto, per esempio <code>"@container (min-width: 400px)"</code>.</li>
        <li>Gli screen esistono solo sulle istanze create con <code>createCss()</code>. Il <code>css()</code> globale non ne ha, ma accetta chiavi <code>@media</code>.</li>
        <li>Tutte le istanze e gli helper globali condividono un unico foglio di stile. Le regole media degli screen vengono emesse nell'ordine in cui gli screen sono dichiarati, non nell'ordine in cui li usi, quindi elenca gli screen <code>min-width</code> dal più piccolo al più grande. Usa una sola istanza di <code>createCss()</code> per app, così quell'ordine è quello del tuo tema.</li>
        <li><code>theme</code> sul risultato è il tema che hai passato.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Costruisce una funzione che restituisce uno stile per un insieme di opzioni, come l'intento e la dimensione di un pulsante.</p>
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
        <li>Gli stili si fondono in quest'ordine: <code>base</code>, il valore scelto di ogni gruppo, poi ogni compound corrispondente. Per ogni proprietà vince lo stile successivo.</li>
        <li>Un'opzione mancante, <code>undefined</code> o <code>null</code> usa il default. Un gruppo senza default viene saltato.</li>
        <li>Un gruppo con solo le chiavi <code>true</code> e <code>false</code> accetta un booleano.</li>
        <li>Un compound si applica quando ogni gruppo che elenca corrisponde, default inclusi.</li>
        <li>Ogni selezione viene costruita una volta e messa in cache.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() & globalStyle()",
        content: `
      <p><code>keyframes()</code> registra un'animazione e restituisce il nome generato. Le chiavi dei frame sono <code>from</code>, <code>to</code> e percentuali, come <code>"50%"</code> o <code>"0%, 100%"</code>. I frame accettano solo proprietà piatte. Frame identici restituiscono lo stesso nome.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> aggiunge una regola per qualsiasi selettore:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>Il selettore è usato esattamente come è scritto.</li>
        <li>Funzionano solo le proprietà piatte. Chiavi pseudo, screen e chiavi <code>@</code> vengono ignorate, quindi <code>globalStyle()</code> non può scrivere regole media.</li>
        <li>La stessa regola viene aggiunta una sola volta. Uno stile diverso per lo stesso selettore aggiunge una seconda regola, e vince la successiva.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() & resetStyles()",
        content: `
      <p><code>getCssText()</code> restituisce ogni regola che <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> e <code>globalStyle()</code> hanno creato in questo processo: prima le regole di base, poi i blocchi <code>@media</code>, <code>@container</code> e <code>@supports</code>. Usala per il rendering lato server.</p>
      <ul>
        <li>Chiamala dopo <code>renderToString()</code>. Le regole create durante il render sono incluse.</li>
        <li>Copre l'intero processo, non una pagina o una richiesta, e cresce soltanto. È sicuro, perché i nomi delle classi sono hash del contenuto.</li>
        <li>Mettila in <code>&lt;style id="nuclo-styles"&gt;</code>. Il client riusa quell'elemento e salta le regole che già contiene. Con un altro id, o senza id, il client aggiunge un secondo foglio di stile con tutte le regole di nuovo.</li>
        <li>Il testo non viene escapato, quindi non mettere mai input non fidato nei valori di stile.</li>
      </ul>
      <p><code>resetStyles()</code> è un helper per i test. Rimuove ogni regola e l'elemento <code>#nuclo-styles</code>. Gli stili creati prima mantengono i nomi delle classi ma perdono il loro CSS. Non chiamarla in un'app o su un server.</p>
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
    title: "Instradamento",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>Pacchetto separato:</strong> <code>nuclo-router</code> non fa parte del pacchetto core di Nuclo. Installalo accanto a <code>nuclo</code>. È una release in anteprima, quindi la sua API può ancora cambiare.</div>
      <p>Routing per Nuclo: rendering lato server, idratazione, rotte con code splitting e precaricamento in idle, costruito su <code>list()</code> e <code>update()</code>. Circa ${NUCLO_ROUTER_GZIP_KB} KB gzip, senza dipendenze oltre a Nuclo stesso e senza side effect, quindi il tree-shaking lo elimina quando non è usato.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Oppure usa <code>pnpm add</code>, <code>yarn add</code> o <code>bun add</code> con gli stessi due nomi. Richiede <code>nuclo</code> 0.3 o successivo come peer dependency.</p>
      <p>Il router decide <em>cosa</em> caricare. L'app dice <em>dove</em> con <code>router.outlet()</code>: una <code>list()</code> sullo stack dei livelli, una riga per livello, quindi una pagina ordinaria è una sola riga. Server e client costruiscono lo stesso albero, così <code>hydrate()</code> reclama i nodi del server invece di sostituirli. Tutto il resto è <code>history</code>, un listener <code>click</code> delegato e <code>requestIdleCallback</code>.</p>
      <h3>Un solo import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> risolve i moduli della rotta corrispondente prima di restituire, quindi il primo albero è completo sia sul server sia sul client. Da lì in avanti il router legge attraverso la rotta che ha avviato: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
      <h3>Un'app completa</h3>
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
      <p>Questa è tutta l'integrazione. I link funzionano perché un <code>&lt;a href&gt;</code> è semplicemente un <code>&lt;a href&gt;</code>. Un listener delegato su <code>document</code> intercetta i link di cui il router è responsabile e lascia ogni altro link al browser.</p>
      <p>Sul server, <code>start()</code> restituisce una <code>Route</code> per richiesta e non tocca il router, quindi richieste concorrenti non possono vedere l'una la rotta dell'altra. <code>route.run()</code> rende quella Route quella letta dal router, e quindi dall'outlet, per la durata del render. Nel browser c'è una Route per caricamento di pagina, e <code>start()</code> la rende quella propria del router. Non serve alcun <code>run()</code>.</p>
      <p>Una pagina riceve il suo <a href="#router-api"><code>RouteContext</code></a> e le sue <a href="#router-api"><code>PageProps</code></a>, come <code>(ctx, { layer, data, outlet, beforeLeave })</code>, e può accettare meno argomenti. Restituisce qualsiasi cosa <code>list()</code> accetti. Per riempire anche un'altra parte del layout, restituisci un <code>into()</code> dall'interno della pagina, come <code>div(article(…), into('sidebar', nav(…)))</code>. Quel contenuto se ne va insieme alla pagina. Vedi <a href="#router-regions">Pagine e regioni</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Pattern e rotte annidate",
        content: `
      <table>
        <thead><tr><th>Pattern</th><th>Corrisponde a</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>esattamente quel percorso</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>tutto ciò che non corrisponde ad altro, la tua 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>La precedenza è: statici, poi dinamici in ordine di dichiarazione, poi catch-all con il prefisso più lungo per primo. Quindi <code>'*'</code> corrisponde solo a ciò che nient'altro intercetta e può stare in qualsiasi punto della tabella. Slash finali, slash duplicati e percent-encoding vengono normalizzati, e i valori dei parametri arrivano decodificati. Il matching è un confronto per segmento per ogni pattern. Non vengono costruite né eseguite regex.</p>
      <h3>Rotte relative</h3>
      <p>Un pattern scritto con <code>./</code> è relativo al genitore che lo dichiara, e un href scritto con <code>./</code> è relativo alla rotta attiva. Insieme formano una sezione riutilizzabile che significa la stessa cosa sotto ogni genitore. Il valore di una tabella è un loader oppure un'altra tabella, le cui chiavi sono relative a essa:</p>
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
      <p>Quelle due righe producono tutti e sei i pattern senza scrivere due volte alcun percorso. Entrambi i genitori ricevono gli stessi oggetti loader, quindi condividono una sola cache dei moduli e un solo <code>import()</code>.</p>
      <ul>
        <li>Dentro una tabella figlia, <code>'./x'</code>, <code>'/x'</code> e <code>'x'</code> significano tutti la stessa cosa, <code>'/'</code> indica il percorso del genitore stesso, e <code>'*rest'</code> dà alla sezione il proprio catch-all. L'annidamento può essere profondo quanto vuoi.</li>
        <li>Le chiavi di primo livello sono usate così come sono scritte, quindi <code>'*'</code> resta <code>'*'</code>.</li>
        <li>Un figlio sotto un genitore <code>*catch-all</code> è un errore di <code>createRouter()</code>, perché un catch-all deve chiudere il suo pattern.</li>
      </ul>
      <h3>Pagine genitore e <code>outlet()</code></h3>
      <p>Un genitore e i suoi figli sono una vera gerarchia. Il genitore renderizza, e il figlio renderizza al suo interno, nel punto in cui chiama <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Navigare tra i figli non ricostruisce il genitore. Il suo nodo DOM è lo stesso nodo, quindi il focus, la posizione di scroll, l'input digitato a metà e qualsiasi stato nella sua closure sopravvivono tutti.</p>
      <ul>
        <li>Una pagina senza rotta figlia non renderizza nulla dal suo outlet, quindi un layout può chiamarlo incondizionatamente. Un genitore che ha un figlio e non chiama mai <code>outlet()</code> lo inghiotte.</li>
        <li>Non esistono rotte index. <code>'/'</code> è il layout stesso, quindi il percorso del genitore renderizza il layout con un outlet vuoto invece di una pagina index separata al suo interno. Metti il contenuto di atterraggio nel layout, oppure dagli un vero percorso figlio.</li>
      </ul>
      <p>La stessa chiamata funziona poi da entrambi i genitori, e da una pagina che non sa in quale dei due si trova:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> e <code>..</code> si risolvono rispetto al percorso della rotta corrente, non alla "directory" dell'URL. Da <code>/invoices/42</code>, <code>./preview</code> è <code>/invoices/42/preview</code>, dove un browser avrebbe detto <code>/invoices/preview</code>, e uno slash finale nell'URL non cambia nulla. <code>../</code> sale di un segmento e si ferma alla radice. Query e hash vengono mantenuti, <code>base</code> viene riaggiunto, e il percorso assoluto risolto è ciò che finisce nella history. È la stessa deviazione dalla risoluzione degli URL che React Router adotta per <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Solo <code>./</code> e <code>../</code> sono relativi alla rotta. Un semplice <code>preview</code> in un href è lasciato alle normali regole del browser.</li>
        <li>Costruisci i link relativi con <code>router.href('./preview')</code> invece di scrivere <code>href="./preview"</code> a mano. <code>href()</code> risolve al momento del render, quindi il markup che viene inviato è assoluto e resta corretto per un crawler, per un click con il tasto centrale e con JavaScript disabilitato.</li>
      </ul>
      <h3>Cosa viene mantenuto, e cosa ricostruito</h3>
      <table>
        <thead><tr><th>Nodo</th><th>Alla navigazione</th></tr></thead>
        <tbody>
          <tr><td>un genitore il cui pattern e percorso non sono cambiati</td><td><strong>mantenuto</strong>: stesso nodo, e il suo <code>load()</code> non viene rieseguito</td></tr>
          <tr><td>la pagina corrispondente</td><td><strong>mantenuta</strong> quando pattern e percorso non sono cambiati e non ha un <code>load()</code>, quindi un cambio di query o hash la conserva. Una rotta con un loader si aggiorna a ogni visita.</td></tr>
          <tr><td>un genitore il cui percorso è cambiato</td><td>ricostruito, insieme a tutto ciò che sta sotto di lui</td></tr>
          <tr><td>un livello aperto con push</td><td>renderizza la sola pagina corrispondente. I suoi genitori sono già montati nella riga sottostante.</td></tr>
        </tbody>
      </table>
      <p>Una pagina mantenuta conserva il <code>ctx</code> con cui è stata costruita. Questo è il significato di <code>ctx</code> ovunque: leggi <code>router.*</code> per i valori live. Lo stato guidato dalla query, come filtri, paginazione e tab, legge <code>router.search</code> dentro un valore dinamico e scrive con <code>router.go('?page=2', { replace: true })</code>. La pagina, il suo focus e il suo input digitato a metà restano dove sono.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Pagine e regioni",
        content: `
      <p><code>router.outlet()</code> mette la pagina in un punto. Una pagina che ha bisogno anche di una sidebar, una toolbar o un'intestazione altrove nel layout la riempie con <a href="#api-region"><code>into()</code></a>. Il layout segna il punto con <code>region()</code>, e la pagina restituisce un <code>into()</code> accanto al proprio contenuto. Il layout non riceve mai contenuto di pagina come prop, e la navigazione non lo ricostruisce mai.</p>
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
      <p>Il contenuto della pagina è una riga della <code>list()</code> dell'outlet, e un <code>into()</code> vive quanto la riga che lo contiene. Quindi il contenuto della sidebar arriva con la pagina e se ne va con lei: navigare verso una pagina senza un <code>into('sidebar', …)</code> mostra di nuovo il contenuto <code>empty</code> della regione. La pagina può usare il suo <code>ctx</code> e i suoi <code>data</code> per entrambe le parti, perché entrambe sono costruite dalla stessa funzione.</p>
      <h3>Cosa succede alla navigazione</h3>
      <ul>
        <li><strong>Una pagina mantenuta conserva le sue regioni.</strong> Un cambio di query o hash che <a href="#router-patterns">mantiene la pagina</a> non tocca nemmeno il contenuto della regione. Leggi <code>router.search</code> dentro un valore dinamico se la sidebar dipende da esso.</li>
        <li><strong>Una pagina ricostruita le riempie di nuovo.</strong> Quando la rotta cambia, la vecchia riga viene rimossa e le viste <code>into()</code> della nuova pagina prendono il suo posto. Non resta nulla indietro.</li>
        <li><strong>Un livello aperto con push aggiunge una vista.</strong> Il livello è una riga successiva dell'outlet, quindi il suo <code>into()</code> è una vista più recente della stessa regione. Con il default <code>type: 'latest'</code> copre la vista della pagina finché il livello non si chiude, e poi la vista della pagina riappare. Con <code>type: 'stack'</code> si vedono entrambe.</li>
        <li><strong>Anche una pagina genitore può riempire regioni.</strong> Le sue viste restano mentre i figli cambiano, perché il genitore non viene ricostruito.</li>
        <li><strong>Il rendering lato server funziona così com'è.</strong> Il server costruisce la pagina dentro <code>route.run()</code>, quindi le sue viste <code>into()</code> sono nell'HTML, e <code>hydrate()</code> le reclama.</li>
      </ul>
      <h3>Più regioni da una sola pagina</h3>
      <p>Passa un oggetto per riempire più regioni insieme. Il contenuto principale della pagina passa comunque dall'outlet, quindi restituiscilo accanto all'<code>into()</code>:</p>
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
      <h3>Quale strumento per quale compito</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> è per una rotta figlia: contenuto deciso dall'URL, renderizzato dentro la sua pagina genitore. Vedi <a href="#router-patterns">Rotte annidate</a>.</li>
        <li><strong><code>into()</code></strong> è per la pagina corrispondente che si distribuisce nel layout. Il contenuto appartiene alla pagina e usa i suoi dati.</li>
        <li><strong><code>matches()</code></strong> è per il layout che decide dal solo URL, con la propria piccola tabella e senza alcuna pagina coinvolta. Vedi <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Tutti questi appartengono all'unica rotta corrispondente. Il router non guida due aree indipendenti da un solo URL, quindi una sidebar con le proprie rotte è una regione che una pagina riempie, non un secondo outlet. Una sidebar che vuole davvero un proprio router, caricamento e fallback ne tiene uno non avviato e risolve con <code>match()</code> — vedi <a href="#router-multi">Più router e caricamento combinato</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Loader di rotta e code splitting",
        content: `
      <p>Un modulo di pagina può esportare una funzione <code>load</code>. Viene eseguita prima che la pagina sia costruita, a ogni navigazione verso quella rotta, e ciò che restituisce viene passato alla pagina come <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>La tabella delle rotte non cambia. Il loader viaggia con la pagina. Riceve il <code>RouteContext</code> corrispondente, quindi <code>params</code>, <code>search</code> e <code>path</code> sono tutti disponibili. Può essere sincrono o asincrono, e viene eseguito anche sul server, quindi una pagina renderizzata lato server arriva con i suoi dati già nell'HTML invece di fare fetch dopo l'idratazione.</p>
      <p><strong>Il modulo è in cache. I dati no.</strong> Il chunk di una rotta viene scaricato una volta e riusato, e il suo loader viene rieseguito a ogni navigazione. Per questo <code>/blog/a</code> e <code>/blog/b</code> non possono essere confusi, e per questo un loader fallito può semplicemente essere ritentato.</p>
      <table>
        <thead><tr><th>Situazione</th><th>Comportamento</th></tr></thead>
        <tbody>
          <tr><td>mentre è in esecuzione</td><td><code>router.pending</code> è true e la pagina in cui ti trovavi resta visibile</td></tr>
          <tr><td>lancia un'eccezione o rifiuta</td><td>finisce in <code>router.error</code>. <code>go()</code> continua a non rifiutare mai, e la navigazione può essere ritentata.</td></tr>
          <tr><td>durante <code>start()</code></td><td>il rifiuto esce da <code>start()</code>. Non c'è ancora una Route su cui metterlo.</td></tr>
          <tr><td>un livello aperto con push</td><td>esegue il proprio loader, con i propri dati</td></tr>
          <tr><td>il precaricatore in idle</td><td>scalda solo i moduli. Non ha alcun contesto da passare, e scaricherebbe dati per una rotta che potresti non aprire mai.</td></tr>
          <tr><td>rinavigare allo stesso URL</td><td>il loader viene rieseguito e la riga ricostruita. Una rotta senza loader mantiene la sua riga.</td></tr>
        </tbody>
      </table>
      <p>Per rivalidare, naviga verso dove sei già senza aggiungere una voce alla history:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Avviare i dati insieme al chunk</h3>
      <p>Un <code>load</code> esportato dal modulo di pagina può partire solo quando quel modulo è arrivato, quindi una navigazione a freddo scarica il chunk, poi i dati. Per avviare entrambi insieme, dichiara il loader nella tabella con <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Sostituisce il <code>load</code> proprio del modulo e viene eseguito a ogni visita come quello. Un rifiuto mentre il chunk è ancora in caricamento finisce in <code>router.error</code> come qualsiasi altro.</p>
      <p>Non esiste alcuna serializzazione dei dati del server nell'HTML, per scelta. Il <code>load</code> del client viene rieseguito all'idratazione. Se la cosa è importante, fai emettere al server <code>route.data</code>, per esempio come <code>window.__DATA__</code>, e fai in modo che il loader lo prenda per primo. <code>route.data</code> sono solo i dati della pagina corrispondente. Il risultato del <code>load()</code> di un genitore non ci sta.</p>
      <h3>Code splitting e precaricamento</h3>
      <p>Il valore di una rotta è sempre una funzione che restituisce il componente di pagina, quindi il componente viene raggiunto in modo lazy:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Solo le forme a modulo possono portare un export <code>load</code>. Scegliere un componente con nome tramite <code>.then(m =&gt; m.BPage)</code> consegna al router la sola funzione.</p>
      <p>Ogni modulo viene importato una volta e messo in cache. Navigazioni concorrenti verso la stessa rotta condividono un solo <code>import()</code>. Una volta che l'utente ha lasciato la pagina in pace per <code>idleTimeout</code> (un secondo di default; nessun tocco, tasto, rotella o scroll), le rotte rimanenti vengono caricate in background, una per ogni intervallo idle (<code>requestIdleCallback</code>). Qualsiasi input, o una navigazione che l'utente sta aspettando, lo mette in pausa finché la pagina non torna idle.</p>
      <p>Una rotta precaricata o eager non attiva mai <code>router.pending</code> e atterra prima del paint successivo: nessun frame di spinner, nessun layout shift. <code>router.pending</code> è true solo per un modulo o un loader che va atteso, e la pagina in uscita resta sullo schermo nel frattempo. Un chunk che non riesce a caricarsi emerge come <code>router.error</code>, mai come un rifiuto non gestito, e può semplicemente essere ritentato.</p>
    `,
      },
      {
        id: "router-api",
        title: "API del router",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> associa un pattern a un loader, o a una tabella annidata. Opzioni:</p>
      <table>
        <thead><tr><th>Opzione</th><th>Default</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>Prefisso URL sotto cui è servita l'app, come <code>'/docs'</code>. Corrisponde solo al confine di un segmento: <code>/docs/intro</code> è dentro <code>'/docs'</code>, <code>/docsearch</code> no. Gli URL fuori da esso non corrispondono a nulla, quindi <code>start()</code> rifiuta (la tua 404 lato server) e i link verso di essi sono lasciati al browser.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Carica i moduli delle rotte rimanenti in background quando la pagina è idle. <code>false</code> lo disattiva.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Millisecondi senza tocchi, tasti, rotella o scroll prima che il precaricamento inizi, o riprenda dopo che l'utente era attivo.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, chiamata dopo ogni navigazione risolta nel browser, inclusa quella iniziale, una volta che il DOM si è aggiornato. <code>kind</code> è <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Indietro, Avanti, <code>close()</code>) o <code>'layer'</code>. L'hook per <code>document.title</code>, meta tag, focus, scroll e analytics. Mai chiamata durante la SSR.</td></tr>
        </tbody>
      </table>
      <p>Restituisce il router: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, e ogni membro di <code>Route</code> tranne <code>run()</code>, letti attraverso la Route attiva. Questa è quella restituita dall'ultimo <code>start()</code> nel browser, o quella il cui <code>run()</code> è in esecuzione sul server. Leggere un membro senza nessuna delle due lancia un'eccezione. La tabella delle rotte, il matcher compilato e la cache dei moduli vivono sul router, quindi sono condivisi tra le richieste su un server.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Risolve <code>url</code> (default: <code>location.href</code> nel browser) nei suoi moduli di pagina e restituisce una <code>Promise&lt;Route&gt;</code>. Rifiuta quando nulla corrisponde e la tabella non ha una rotta <code>'*'</code>. Su un server, questa è la tua 404. Nel browser rende anche la Route quella attiva del router, aggancia i listener <code>popstate</code> e <code>click</code> delegato e pianifica il precaricamento. Un secondo <code>start()</code> ritira la Route precedente per te. Sul server non tocca nulla di condiviso, quindi renderizza dentro <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Risolve un URL rispetto alla tabella senza caricare nulla: nessun import, nessuna history, nessun listener, nessuna Route. Restituisce un <code>RouteContext</code>, o <code>null</code> quando l'URL è fuori da <code>base</code>, non corrisponde a nessun pattern o, nel browser, è su un'altra origine. Solo URL assoluti, perché la risoluzione di <code>./</code> richiede una rotta attiva.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Le pagine della rotta attiva come <code>list()</code>. Posizionalo una volta, dove vanno le pagine. Un livello aperto con push è una sua riga successiva. È vuoto prima che <code>start()</code> si risolva e dopo <code>stop()</code>. Sul server renderizza la Route il cui <code>run()</code> è in esecuzione.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Renderizza la vista di una seconda tabella a cui corrisponde il percorso della rotta attiva, come una <code>list()</code> che posizioni ovunque. Vedi <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Ogni membro tranne <code>run()</code> è anche sul router, che è il punto da cui un'app lo legge.</p>
      <table>
        <thead><tr><th>Membro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>la corrispondenza attiva. <code>search</code> è un <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> e <code>url</code> sono live.</td></tr>
          <tr><td><code>pending</code></td><td>una navigazione sta aspettando un modulo o un loader</td></tr>
          <tr><td><code>error</code></td><td>l'ultimo caricamento fallito, azzerato dalla navigazione successiva</td></tr>
          <tr><td><code>data</code></td><td>ciò che il <code>load()</code> della pagina corrispondente ha restituito, perché un server lo serializzi. Quello di un genitore non ci sta.</td></tr>
          <tr><td><code>depth</code></td><td>quanti livelli ci sono nello stack (1 per una pagina ordinaria)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>naviga, caricando il modulo se serve. Non rifiuta mai: un modulo che fallisce, rifiutando o lanciando un'eccezione, finisce in <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>apre una rotta come nuovo livello in cima, risolvendosi con ciò con cui si chiude. Accetta <code>./</code>. Rifiuta se nulla corrisponde o il modulo fallisce.</td></tr>
          <tr><td><code>href(path)</code></td><td>prefissa un percorso con <code>base</code>, per <code>a({ href })</code>. Risolve <code>./</code> e <code>../</code> rispetto alla rotta attiva.</td></tr>
          <tr><td><code>stop()</code></td><td>stacca ogni listener, chiude i livelli aperti, svuota l'outlet. Idempotente. Una Route fermata risponde ancora con la sua ultima corrispondenza, e <code>go()</code> non fa nulla.</td></tr>
          <tr><td><code>run(fn)</code></td><td>chiama <code>fn</code> con questa Route come quella attiva del router e ne restituisce il risultato: <code>route.run(() =&gt; renderToString(App))</code> sul server. Solo sincrono. La Route smette di essere attiva quando <code>fn</code> ritorna.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Il primo argomento di una pagina: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. È il contesto con cui la pagina è stata costruita. Leggi <code>router.*</code> per i valori live. Differiscono solo quando query o hash sono cambiati senza una ricostruzione.</p>
      <p><code>params</code> è <code>{ [name]: string }</code> di default. Una pagina può tipizzarlo dal proprio pattern con <code>Params</code>, che trasforma <code>'/blog/:slug'</code> in <code>{ slug: string }</code> e <code>'/files/*rest'</code> in <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>Il secondo argomento di una pagina. Destruttura ciò di cui la pagina ha bisogno.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>dove si trova la pagina nello stack. Vedi <code>Layer</code> sotto.</td></tr>
          <tr><td><code>data</code></td><td>ciò che il <code>load()</code> della rotta ha restituito, o <code>undefined</code> se non ne ha uno. Tipizzato da <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>dove una pagina genitore renderizza la sua rotta figlia. Vedi <a href="#router-patterns">Rotte annidate</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>registra una guardia consultata prima che questa pagina venga scartata. Vedi <a href="#router-layers">Guardie di uscita</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Dove si trova una pagina nello stack, e la sua via d'uscita.</p>
      <table>
        <thead><tr><th>Membro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 per la pagina di base, 1 e oltre per i livelli aperti con push</td></tr>
          <tr><td><code>push(href)</code></td><td>apre un altro livello dall'interno di una pagina, come <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>chiude questo livello e tutto ciò che sta sopra, risolvendo il <code>push()</code> che lo ha aperto. Senza argomento significa chiuso senza risultato. Non fa nulla a profondità 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> e <code>withLoad()</code></h3>
      <p><code>DataLoader</code> è <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, l'export opzionale <code>load</code> di un modulo di pagina. <code>withLoad(loader, load)</code> crea una rotta il cui <code>load</code> parte accanto all'import del suo chunk invece che dopo. Vedi <a href="#router-loaders">Loader di rotta</a>.</p>
      <h3>Tipi</h3>
      <p>Ogni tipo è un export con nome di <code>nuclo-router</code>, quindi una pagina, un loader o una guardia possono essere tipizzati senza importare da un percorso.</p>
      <table>
        <thead><tr><th>Tipo</th><th>Cos'è</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>l'oggetto params per un pattern. <code>RouteParams</code> è la forma non tipizzata, e <code>Match</code> è il risultato del matcher.</td></tr>
          <tr><td><code>PageComponent</code></td><td>una pagina: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>un modulo di pagina: il componente stesso, o <code>{ default, load? }</code> come restituito da <code>import()</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, che può portare un <code>load</code> da <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>la tabella che <code>createRouter()</code> accetta: pattern verso loader, o verso una tabella annidata</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, il secondo argomento di <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, il secondo argomento di <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>il tipo di <code>outlet()</code> da <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, ciò che <code>beforeLeave()</code> accetta</td></tr>
          <tr><td><code>MatchView</code></td><td>cos'è una vista di <code>matches()</code>: params in ingresso, contenuto o <code>import()</code> di una pagina in uscita</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Livelli e guardie di uscita",
        content: `
      <p><code>push()</code> apre una rotta sopra quella corrente invece di sostituirla, e si risolve con ciò con cui quel livello si chiude. Poiché le pagine sono un'unica <code>list()</code> sullo stack, aprire un livello è un append. La pagina sottostante non viene rirenderizzata, quindi il suo DOM, il suo focus e il suo form compilato a metà sono ancora tutti lì quando il livello si chiude.</p>
      <p>Questo fa funzionare il flusso "mi serve un record che non esiste ancora" senza buttare via il form che l'utente stava compilando:</p>
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
      <p>I livelli si annidano. Un dialogo che ha bisogno di un proprio dialogo chiama <code>layer.push()</code> e lo attende, senza alcun riferimento alla Route.</p>
      <ul>
        <li><strong>L'URL è il livello in cima.</strong> <code>push()</code> aggiunge una voce alla history, quindi un livello è linkabile e Indietro lo chiude, risolvendo il suo <code>push()</code> come chiuso senza risultato, esattamente come Annulla. Indietro e <code>close()</code> sono un unico percorso di codice: <code>close()</code> registra il suo risultato e torna indietro nella history, e la profondità in <code>history.state</code> è l'autorità. I browser conservano circa 50 voci per tab, quindi dopo una lunga camminata tra i livelli la voce sottostante potrebbe essere sparita: in quel caso <code>close()</code> chiude i livelli sul posto e riscrive la voce corrente con la pagina rimasta visibile.</li>
        <li><strong>Una navigazione ordinaria svuota lo stack.</strong> Un click su un link o <code>go()</code> non è un livello. Sostituisce tutto e chiude ogni livello aperto, così nessun chiamante resta in attesa.</li>
        <li><strong>Un caricamento a freddo è una pagina autonoma.</strong> L'URL indica il livello in cima ma non lo stack sotto di esso, quindi aprire direttamente l'URL di un livello lo renderizza a profondità 1 con <code>layer.depth === 0</code> e un <code>close()</code> inerte. Una rotta aperta con push deve avere senso da sola. Diramati su <code>layer.depth</code> per offrire un link di uscita invece di un pulsante Annulla morto.</li>
        <li><strong>La promise non può sopravvivere a un ricaricamento</strong>, perché vive in una closure. Tratta il risultato come una scorciatoia attraverso un flusso che funziona anche per la strada lunga.</li>
        <li><strong>Nulla resta in attesa.</strong> <code>stop()</code> chiude ogni livello aperto, e un livello abbandonato da una navigazione si risolve con <code>undefined</code>.</li>
      </ul>
      <h3>Guardie di uscita</h3>
      <p>Una pagina che contiene qualcosa che vale la pena conservare, come un form compilato a metà, registra una guardia. Viene consultata prima che la pagina venga scartata, e restituire <code>false</code> (o una promise di esso) mantiene la pagina:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Solo quando la pagina se ne va.</strong> Una navigazione figlia sotto un layout, o un cambio di query o hash che mantiene la pagina, non la consulta. Una guardia vive e muore con la sua pagina, quindi non c'è nulla da deregistrare.</li>
        <li><strong>Ogni via d'uscita.</strong> Un link, <code>go()</code>, Indietro e Avanti, il <code>close()</code> di un livello, e <code>go()</code> verso un URL di cui il router non è responsabile (uscire dall'app, dove <code>to</code> è <code>null</code>). Un Indietro o Avanti rifiutato viene annullato, così la barra degli indirizzi resta sulla pagina. Chiudere la tab o ricaricare è compito di <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> è il <code>RouteContext</code> verso cui la navigazione si dirige. Le guardie vengono eseguite dalla più interna e si fermano al primo rifiuto. Una che lancia un'eccezione mantiene la pagina. Anche <code>close(result)</code> passa dalla guardia, quindi azzera il tuo flag prima di chiudere con un risultato.</li>
        <li>Il router può annullare solo le voci della history che ha scritto lui. Un Indietro o Avanti verso una voce che non ha scritto, come un link nativo <code>#fragment</code> o il <code>pushState</code> di un altro script, non viene sottoposto alla guardia.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() e sub-router",
        content: `
      <p><code>router.outlet()</code> renderizza la pagina. <code>router.matches(table)</code> renderizza qualcos'altro che dipende da dove ti trovi, come una sidebar, un breadcrumb o una toolbar, dalla propria piccola tabella, senza caricare una rotta né aggiungere una pagina:</p>
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
        <li><strong>Stesso matching della tabella delle rotte.</strong> I pattern, la precedenza, il matching sul percorso grezzo e la rimozione di <code>base</code> sono quelli del router, quindi una vista e una pagina sono sempre d'accordo sull'URL. Legge il percorso del livello in cima, come <code>router.path</code>.</li>
        <li><strong>Una vista</strong> è <code>(params, ctx) =&gt; content</code>, dove <code>params</code> è tipizzato dal suo pattern e <code>ctx</code> è il <code>RouteContext</code> con il <code>pattern</code> e i <code>params</code> della vista. Può invece restituire l'<code>import()</code> di un modulo di pagina, che viene chiamato con <code>ctx</code> quando arriva.</li>
        <li><strong>Nulla corrisponde, nulla viene renderizzato.</strong> Aggiungi una vista <code>'*'</code> come fallback. È vuoto prima di <code>start()</code> e dopo <code>stop()</code>, come l'outlet.</li>
        <li><strong>Viene rirenderizzato solo quando la rotta cambia</strong>, quindi una vista mantiene il suo DOM attraverso qualsiasi cosa mantenga la pagina.</li>
        <li><strong>Una vista lazy non renderizza nulla finché il suo modulo non arriva.</strong> Un <code>import()</code> fallito viene registrato con <code>console.error</code>, non imposta <code>router.error</code>, e viene ritentato alla navigazione successiva. Un semplice <code>update()</code> non ritenta.</li>
        <li><strong>Sul server</strong> una vista lazy non invia nulla, perché il suo modulo arriva sul client. Usa una vista sincrona per tutto ciò che il primo HTML deve contenere.</li>
      </ul>
      <h3>Sub-router</h3>
      <p>Le rotte si annidano, quindi un sub-router di solito è semplicemente una tabella annidata. Un solo router: la pagina <code>'/'</code> della sezione è la sua cornice, e i suoi figli renderizzano nell'<code>outlet()</code> di quella pagina, così la cornice sopravvive alla navigazione dentro la sezione:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Oppure dai alla funzionalità un router tutto suo, creato ma mai avviato. Il genitore possiede una sola voce catch-all e il figlio risolve la coda rispetto ai propri pattern, params e fallback:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Non avviarlo mai è il punto. <code>start()</code> è ciò che aggancia i listener, e due router avviati entrano in conflitto. Il compromesso è che il figlio possiede la risoluzione, quindi i loader di rotta, che un router avviato esegue, spetta a te chiamarli. Questa forma inoltre ricostruisce la shell quando la coda cambia, perché il router vede una sola rotta e la shell risolve il resto da sé. Una tabella annidata è ciò che ti dà un genitore che il router tiene montato, quindi preferiscila a meno che la funzionalità non abbia davvero bisogno di un proprio router, base e fallback.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Più router e caricamento combinato",
        content: `
      <p>Un'app può avere tanti router quante sono le sue aree. La regola che mantiene tutto semplice: <strong>avviane esattamente uno per documento</strong>, e lascia ogni altro router non avviato, a risolvere URL con <code>match()</code>. Solo il router avviato possiede l'URL, la history e il listener dei click. Gli altri sono tabelle a cui fai domande — e ogni area può caricare con il proprio ritmo, con il proprio spinner.</p>
      <h3>Caricamento combinato: una catena di loader</h3>
      <p>Ogni pagina di una catena corrispondente può esportare <code>load()</code>. In una navigazione a freddo verso una rotta figlia, il loader del layout e quello della pagina vengono eseguiti <strong>in parallelo</strong>, e un unico <code>router.pending</code> copre l'intera catena: la pagina precedente resta sullo schermo finché la coppia non si risolve, così un albero caricato a metà non viene mai dipinto. Ogni componente riceve i propri <code>data</code>:</p>
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
      <p>Entrambi i loader partono insieme, non uno dopo l'altro. <code>router.pending</code> è true mentre uno dei due è in attesa, e false il resto del tempo — una rotta precaricata o eager non lo attiva mai. Spostarsi tra le sezioni mantiene il layout, quindi viene rieseguito solo il loader della sezione; i dati del layout, il suo DOM e un input digitato a metà sopravvivono tutti. Rinavigare allo stesso URL riesegue il loader della foglia e ricostruisce la sua riga, esattamente come con una pagina singola.</p>
      <h3>Caricamento multiplo: un secondo router con il proprio spinner</h3>
      <p>Un'area indipendente — una sidebar, un tray, una live region — riceve un router tutto suo, creato ma mai avviato, e il proprio flag di caricamento. <code>router.pending</code> appartiene al router avviato e non dice nulla su quest'area, quindi le due possono caricare fianco a fianco e ciascuna può finire per prima:</p>
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
      <p>Al secondo router si chiede, non si comanda: <code>match()</code> legge l'URL e restituisce un contesto, e nulla della sidebar entra mai nella tabella delle rotte principale. <code>onNavigate</code> viene eseguito dopo ogni navigazione risolta, inclusa quella iniziale, quindi è l'unico punto che tiene un'area indipendente al passo con l'URL.</p>
      <ul>
        <li><strong><code>pending</code> appartiene al router avviato.</strong> Un router mai avviato non ha una Route, né <code>pending</code> né <code>error</code>. L'area traccia i propri flag, e un secondo spinner può stare accanto al primo. Nella demo la sidebar carica per 800ms mentre i loader della rotta girano per 900ms, quindi la pagina può finire prima della sidebar o viceversa.</li>
        <li><strong><code>match()</code> non aggancia nulla.</strong> Un numero qualsiasi di router non avviati può condividere il documento; ciascuno ha la propria tabella, base e cache dei moduli, e nessuno di essi tocca la history. Costano una tabella e un matcher.</li>
        <li><strong>I suoi loader non vengono mai eseguiti.</strong> Il router avviato esegue il <code>load()</code> delle pagine a cui corrisponde. Un router mai avviato risolve soltanto, quindi se le sue viste hanno bisogno di dati, recuperali tu — il <code>refreshSidebar()</code> della demo. Se vuoi i loader, una <a href="#router-matches">tabella annidata</a> o una <a href="#router-regions">regione riempita da una pagina</a> lascia quel compito al router avviato.</li>
        <li><strong>Proteggiti dalle risposte stantie.</strong> Un fetch lento della sidebar non deve atterrare sulla sezione da cui ti sei allontanato. Incrementa un contatore di generazione a ogni refresh e scarta le risposte che non corrispondono più, come fa il router stesso quando ritira le navigazioni superate.</li>
        <li><strong>Nemmeno una vista lazy di <code>matches()</code> ha un <code>pending</code>.</strong> Non renderizza nulla finché il suo modulo non arriva. Tre sistemi di caricamento, tre orologi indipendenti: il <code>pending</code> della rotta, i tuoi flag, e una vista lazy che semplicemente non c'è ancora.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Gestione dei link",
        content: `
      <p>Il listener delegato naviga un click sinistro su un <code>&lt;a href&gt;</code>, inclusi un <code>&lt;a&gt;</code> SVG e i click su qualsiasi cosa annidata al suo interno, e si fa da parte per tutto il resto: click con modificatori e con il tasto centrale, un <code>target</code> diverso da <code>_self</code>, <code>download</code>, <code>rel="external"</code>, href cross-origin, link con solo hash sulla pagina corrente, percorsi fuori da <code>base</code>, percorsi a cui nessuna rotta corrisponde (così una 404 renderizzata lato server resta raggiungibile), e qualsiasi evento su cui un handler dell'app ha già chiamato <code>preventDefault()</code>. Escludi un link esplicitamente con <code>data-nuclo-router="off"</code>.</p>
      <h3>Scroll</h3>
      <p>Una navigazione con push conserva la posizione di scroll corrente. Quando il nuovo URL ha un <code>#hash</code> che corrisponde a un elemento della pagina, quell'elemento viene portato in vista. <code>popstate</code> lascia lo scroll al browser. Per far atterrare le nuove pagine in cima, fallo in <code>onNavigate</code>, che dice come è avvenuta la navigazione:</p>
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
      <h3>Note</h3>
      <ul>
        <li><strong>Nulla viene trattenuto.</strong> La Route contiene la funzione della pagina e il suo contesto, mai il DOM. Navigare altrove rilascia la pagina precedente. <code>stop()</code> rilascia i listener e qualsiasi caricamento in corso, e azzera <code>pending</code>, così una Route ritirata non lascia mai uno spinner appeso. Un modulo che si risolve dopo <code>stop()</code> viene scartato silenziosamente.</li>
        <li><strong>Sicuro con la concorrenza sul server.</strong> <code>start()</code> restituisce uno stato per richiesta e <code>run()</code> lo delimita a un singolo render sincrono, quindi richieste interlacciate non possono vedere l'una la rotta dell'altra. Solo la cache dei moduli è condivisa. L'ambito termina quando la funzione di <code>run()</code> ritorna. <code>renderToString()</code> è sincrono, quindi basta. Un render asincrono o in streaming richiederebbe di trasportare la Route attraverso gli <code>await</code>, cosa che <code>run()</code> non fa.</li>
        <li><strong>Il ripristino dello scroll su <code>popstate</code></strong> è del browser (<code>scrollRestoration</code>), non del router.</li>
        <li><strong>Avvia un solo router per documento.</strong> Ogni <code>start()</code> aggiunge il proprio listener <code>click</code> delegato, e lo <code>start()</code> di un secondo router non ritira il primo. Solo un secondo <code>start()</code> sullo stesso router lo fa. Per risolvere un URL rispetto a un'altra tabella, crea un router e chiama solo <code>match()</code>. Non aggancia nulla. Un'area indipendente può così gestire il proprio caricamento accanto al <code>pending</code> della rotta. Vedi <a href="#router-multi">Più router e caricamento combinato</a>.</li>
        <li><strong>Non incluso, per scelta:</strong> hash history e memory history, perché la rotta vive nel pathname e un server deve servire ogni rotta; due aree con routing indipendente guidate da un solo URL, perché una pagina può riempire più regioni con <code>into()</code> ma appartengono tutte all'unica rotta corrispondente — un'area indipendente può comunque tenere il proprio router non avviato e il proprio caricamento, come in <a href="#router-multi">Più router e caricamento combinato</a>; e il precaricamento all'hover, che ottieni chiamando il loader della rotta da un <code>mouseenter</code>.</li>
      </ul>
      <h3>Esempi</h3>
      <p>Due esempi eseguibili nel repository si completano a vicenda, così ogni impostazione è osservabile da qualche parte:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: un tour lato client dell'intera API. Ogni forma di pattern e regola di precedenza, le esclusioni della gestione dei link, ogni membro di Route con controlli live, un sub-router, lo stack dei livelli profondo tre, una sezione relativa montata su due genitori, e loader di rotta con <code>pending</code> ed <code>error</code>. Imposta <code>preload: false</code> così quegli stati restano visibili.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> per richiesta, idratazione che reclama in modo dimostrabile i nodi del server, veri codici di stato 404, un <code>base</code> non radice, precaricamento in idle osservabile nel pannello di rete, e un loader i cui dati passano dal server al client così l'idratazione non rifà il fetch.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "Pattern",
    sections: [
      {
        id: "computed",
        title: "Valori calcolati",
        content: `
      <p>Nuclo non ha un'API per i valori calcolati. Usa una semplice funzione, e chiamala dai valori dinamici:</p>
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
        title: "Async e caricamento",
        content: `
      <p>Usa i normali <code>async</code>/<code>await</code>, e chiama <code>update()</code> ogni volta che lo stato cambia. Per un fetch, significa una volta prima dell'<code>await</code> e una volta dopo:</p>
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
        title: "Buone pratiche",
        content: `
      <ul>
        <li><strong>Raggruppa le modifiche.</strong> Cambia tutto lo stato che ti serve, poi chiama <code>update()</code> una volta sola.</li>
        <li><strong>Mantieni i valori dinamici veloci e puri.</strong> Vengono tutti eseguiti a ogni <code>update()</code>.</li>
        <li><strong>Usa <code>scope()</code></strong> per aggiornamenti piccoli e frequenti, come la digitazione o i timer.</li>
        <li><strong>Renderizza nel documento.</strong> I nodi che non sono nel documento quando <code>update()</code> viene eseguito smettono di aggiornarsi.</li>
        <li><strong>Usa <code>when()</code> e <code>list()</code></strong> per i figli che cambiano, non una funzione che restituisce nodi.</li>
        <li><strong>Usa <code>className</code>, non <code>class</code></strong>, e usa <code>() =&gt; cx(...)</code> o <code>{ className: () =&gt; … }</code> per le classi dinamiche.</li>
        <li><strong>Definisci gli stili una sola volta</strong>, a livello di modulo.</li>
        <li><strong>Rendering lato server:</strong> renderizza prima, poi metti <code>getCssText()</code> in <code>&lt;style id="nuclo-styles"&gt;</code>. Passa i dati della richiesta come argomenti, e mantieni i commenti HTML nell'output.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "Riferimento",
    sections: [
      {
        id: "api-index",
        title: "Indice delle API",
        content: `
      <p>Ogni funzione pubblica, e da dove proviene.</p>
      <h3><code>nuclo</code> (globale ed export con nome)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: esegue tutti i valori dinamici, o quelli negli scope indicati.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: assegna a un elemento gli id di scope per <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: contenuto condizionale, con <code>.when()</code> e <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: una riga per elemento, abbinata per identità.</li>
        <li><a href="#api-region"><code>region(options)</code></a> e <a href="#api-region"><code>into(id, ...content)</code></a>: un punto con nome nell'albero, e contenuto che lo riempie da qualsiasi parte.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: un listener di eventi, oppure <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: costruisce e aggiunge.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: prende in carico l'HTML del server.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: richiama i componenti e aggiorna il DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: classi generate da un oggetto di stile.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: combina stili, vince il successivo.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code> con tema.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: stili da opzioni.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> e <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (solo export con nome)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> e <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> e <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">Un import con side effect</a>, più <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> e le classi <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (pacchetto separato)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: il router, con <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> e <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: una rotta il cui loader di dati parte accanto al suo chunk.</li>
        <li><a href="#router-api">Tipi</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> e altri.</li>
      </ul>
      <h3>Solo globali</h3>
      <ul>
        <li><a href="#tag-builders">175 costruttori di tag</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, e <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Tipi</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> e altri. I tipi di stile come <code>StyleResult</code> possono anche essere importati da <code>'nuclo'</code>.</li>
      </ul>
      <h3>Chiavi speciali</h3>
      <ul>
        <li><a href="#attributes">Attributi</a>: <code>className</code>, <code>style</code>, <a href="#events">handler <code>on*</code></a>, <a href="#lifecycle"><code>onMount</code> e <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Oggetti di stile</a>: abbreviazioni, pseudo stati, selettori <code>&amp;</code>, regole <code>@</code> e <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Domande frequenti",
        content: `
      <h3>Cambiare lo stato aggiorna la UI?</h3>
      <p>No. Il DOM resta com'è finché non chiami <code>update()</code>.</p>

      <h3>Nuclo usa signal, proxy o un DOM virtuale?</h3>
      <p>No. Lo stato resta semplice JavaScript. Quando un albero viene renderizzato, Nuclo crea elementi e nodi di testo reali. <code>update()</code> esegue ogni valore dinamico registrato, o quelli dentro gli scope indicati, e aggiorna quegli stessi nodi dove un valore è cambiato. Non c'è alcun grafo delle dipendenze né alcun albero virtuale.</p>

      <h3>Perché la mia pagina mostra "false"?</h3>
      <p>I booleani vengono renderizzati come testo. <code>div(ok &amp;&amp; span('Done'))</code> mostra "false". Usa <code>when(() =&gt; ok, span('Done'))</code> per i figli, e <code>ok ? 'Done' : ''</code> per il testo.</p>

      <h3>Perché la riga della mia lista non cambia quando modifico l'elemento?</h3>
      <p>Le righe degli elementi ancora presenti nella lista vengono mantenute, non renderizzate di nuovo. Usa valori dinamici come <code>() =&gt; todo.text</code> per i campi che cambiano. Vedi <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Perché una parte della mia UI smette di aggiornarsi?</h3>
      <p>Di solito i suoi nodi non erano nel documento quando <code>update()</code> è stato eseguito. Nuclo smette di tracciare quei nodi, anche dopo che li hai collegati, quindi renderizza in un contenitore che è nel documento. Altre due cause: un <code>when()</code> la cui condizione lancia un'eccezione smette di aggiornarsi, e una funzione di testo che lancia un'eccezione alla prima esecuzione resta vuota. Vedi <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Quando dovrei usare <code>forceUpdate()</code>?</h3>
      <p>Solo per cambiamenti rari a valori statici, come il cambio di lingua. Per tutto il resto, usa <code>update()</code>. Vedi <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Come metto una pagina in un layout senza passarla come prop?</h3>
      <p>Segna il punto con <code>region({ id: 'main' })</code> e fai restituire alla pagina <code>into('main', …)</code>. Vedi <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Come smonto un'app?</h3>
      <p>Avvolgila in <code>when()</code> e disattiva la condizione. Rimuovere il DOM da solo non esegue <code>onDestroy</code>. Vedi <a href="#lifecycle">Ciclo di vita</a>.</p>

      <h3>Nuclo include un router?</h3>
      <p>Non nel pacchetto core. Il routing è distribuito separatamente come <code>nuclo-router</code>, con rendering lato server, idratazione, rotte con code splitting e precaricamento in idle. Installalo con <code>npm install nuclo nuclo-router</code>. Vedi <a href="#router-overview">nuclo-router</a>.</p>

      <h3>Nuclo ha gli effetti?</h3>
      <p>No. <code>onMount</code> e <code>onDestroy</code> vengono eseguiti una volta per elemento, legati all'inserimento e alla rimozione. Nulla viene rieseguito perché uno stato è cambiato.</p>
    `,
      },
    ],
  },

];
