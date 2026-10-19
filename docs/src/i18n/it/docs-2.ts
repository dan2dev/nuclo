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
      <p>Trasforma un oggetto di stile tipizzato in classi CSS generate, da passare a qualsiasi builder di tag. Nel browser le regole finiscono in un unico elemento <code>&lt;style id="nuclo-styles"&gt;</code>; sul server te le restituisce <a href="#api-css-text"><code>getCssText()</code></a>.</p>
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
        <li><code>css()</code> genera una classe per le dichiarazioni di base e una in più per ogni chiave pseudo, selettore o blocco media. La card qui sopra ne produce due.</li>
        <li>I nomi delle classi sono hash del contenuto: stili identici condividono la stessa classe, e server e client arrivano sempre agli stessi nomi.</li>
        <li>Definisci gli stili una volta sola, a livello di modulo. <code>css()</code> tiene una cache per oggetto, quindi se ne passi uno nuovo a ogni chiamata, il lavoro si rifà ogni volta.</li>
        <li>Modificare un oggetto di stile dopo averlo passato a <code>css()</code> non cambia nulla.</li>
        <li>Ogni stile resta registrato finché vive la pagina o il processo server. Per i valori che cambiano da elemento a elemento, come una larghezza che arriva dai dati, meglio l'<a href="#attributes">attributo <code>style</code></a>.</li>
      </ul>
      <h3>Stili con nome</h3>
      <p>Se vuoi una classe leggibile, passa prima un nome:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>La classe di base è esattamente il nome; gli altri blocchi diventano <code>name-&lt;hash&gt;</code>.</li>
        <li>Il nome deve essere un nome di classe valido, altrimenti Nuclo ti avvisa e ne genera uno al posto tuo.</li>
        <li>I nomi sono globali: se due stili diversi ne usano uno uguale, Nuclo ti avvisa.</li>
      </ul>
      <h3>Come usare il risultato</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p>Sia <code>String(card)</code> sia <code>card.className</code> restituiscono i nomi delle classi.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Oggetti di stile",
        content: `
      <p>L'oggetto che passi a <code>css()</code> parla il CSS di sempre, in camelCase, con in più un po' di abbreviazioni e chiavi annidate per pseudoclassi, pseudoelementi, selettori e media query. TypeScript completa tutto. Le proprietà che non rientrano nell'insieme tipizzato, come <code>borderTopLeftRadius</code>, <code>fill</code> o <code>paddingInline</code>, vanno in <code>raw</code> (ne parliamo più sotto).</p>
      <h3>Valori</h3>
      <ul>
        <li>I numeri diventano <code>px</code>, a parte <code>0</code> e le proprietà senza unità: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> e <code>gridRow</code>. In <code>raw</code> restano senza unità anche <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> e <code>animation-iteration-count</code>.</li>
        <li>Le stringhe passano così come le scrivi. <code>null</code>, <code>undefined</code> e <code>false</code> vengono ignorati.</li>
        <li><code>lineHeight</code> (e <code>leading</code>) non ha unità: <code>leading: 24</code> vuol dire 24 volte la dimensione del font. Per i pixel scrivi <code>"24px"</code>.</li>
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
          <tr><td><code>px</code> / <code>py</code></td><td>padding orizzontale / verticale</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>lo stesso, ma per il margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height e relativi min e max</td></tr>
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
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (senza toccare display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudoclassi e pseudoelementi</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> e <code>firstLetter</code>. Si annidano: <code>hover: { focus: {…} }</code> produce <code>:hover:focus</code>.</p>
      <h3>Selettori e at-rule</h3>
      <p>Una chiave che inizia con <code>&amp;</code> è un selettore, e ogni <code>&amp;</code> viene sostituito dalla classe. Una chiave che inizia con <code>@</code> è una at-rule: <code>@media</code>, <code>@container</code> o <code>@supports</code>.</p>
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
        <li>La chiave deve iniziare con <code>&amp;</code>: una chiave come <code>".dark &amp;"</code> viene ignorata, quindi scrivi <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Due blocchi <code>@media</code> annidati si combinano con <code>and</code>. Se una query comincia con un tipo di media (<code>print</code>, <code>only screen</code>), finisce per prima, perché la grammatica ammette un tipo solo in apertura. Una coppia impossibile da appiattire (due tipi di media, o un <code>not</code> iniziale) genera un avviso e vale solo la query interna. Con qualsiasi altra at-rule annidata, quella interna sostituisce l'esterna.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Con <code>raw</code> puoi usare qualsiasi proprietà, scritta esattamente come in CSS. I numeri ricevono comunque <code>px</code>, quindi passa delle stringhe:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Ogni altra chiave piatta viene convertita in kebab-case e scritta così com'è: un refuso come <code>colr: 'red'</code> diventa una dichiarazione che il browser scarta. Un oggetto annidato sotto una chiave che non sia una pseudoclasse, uno pseudoelemento, uno screen, o una chiave <code>&amp;</code> o <code>@</code> viene ignorato. In entrambi i casi TypeScript ti segnala l'errore.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Combina più stili. Se due input impostano la stessa proprietà, vince l'ultimo.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Gli input falsy vengono scartati, gli array appiattiti, le stringhe spezzate e deduplicate.</li>
        <li>Le classi generate per lo stesso blocco (base, stesso pseudo, stessa media query) si fondono in una classe nuova. Tutti gli altri nomi passano così come sono.</li>
        <li>Solo <code>cx()</code> conosce l'ordine degli argomenti. Con <code>div(base, blue)</code> vengono aggiunte entrambe le classi e vince la regola creata per ultima. Quando due stili si sovrascrivono a vicenda, mettili nella stessa chiamata a <code>cx()</code>.</li>
        <li>Quando il blocco di uno stile con nome si fonde con quello di un altro input, la classe che ne esce è <code>name-&lt;hash&gt;</code>, non il solo nome. I blocchi che non si fondono tengono la loro classe, quindi <code>cx(pageTitle, 'extra')</code> ha ancora <code>page-title</code>.</li>
      </ul>
      <h3>Classi dinamiche</h3>
      <p>Passa una funzione che restituisca sempre <code>cx(...)</code>:</p>
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
      <p>Alla prima esecuzione la funzione deve restituire un risultato di stile. Con <code>() =&gt; active &amp;&amp; activeButton</code> a schermo comparirebbe il testo "false" al posto di una classe.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Restituisce la tua versione di <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code>, legata a un tema. Il tema dà un nome ai valori: con quello qui sotto, <code>borderColor: 'border'</code> scrive <code>#e5e7eb</code> e TypeScript ti suggerisce i nomi. Ogni voce di <code>screens</code> diventa una chiave di stile per una media query, per esempio <code>md: {…}</code>.</p>
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
        <thead><tr><th>Chiave del tema</th><th>Dove viene usata</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> e ciascun lato, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>nuove chiavi di stile, come <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Un nome del tema viene risolto solo se è l'intero valore: <code>border: "1px solid primary"</code> non funziona.</li>
        <li>Uno screen scritto senza <code>@</code> diventa <code>@media &lt;value&gt;</code>. Se il valore inizia con <code>@</code>, viene usato così com'è, per esempio <code>"@container (min-width: 400px)"</code>.</li>
        <li>Gli screen esistono solo nelle istanze create con <code>createCss()</code>. Il <code>css()</code> globale non ne ha, ma accetta chiavi <code>@media</code>.</li>
        <li>Tutte le istanze e gli helper globali condividono un unico foglio di stile. Le regole media degli screen escono nell'ordine in cui li dichiari, non in quello in cui li usi: elenca quindi gli screen <code>min-width</code> dal più piccolo al più grande. Usa una sola istanza di <code>createCss()</code> per app, così l'ordine è sempre quello del tuo tema.</li>
        <li><code>theme</code> sul risultato è il tema che hai passato.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Costruisce una funzione che, date alcune opzioni (l'intento e la dimensione di un pulsante, per dire), restituisce lo stile giusto.</p>
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
        <li>Gli stili si fondono in quest'ordine: <code>base</code>, il valore scelto per ogni gruppo, poi ogni compound che corrisponde. Per ogni proprietà vince l'ultimo.</li>
        <li>Un'opzione mancante, <code>undefined</code> o <code>null</code> ripiega sul default; un gruppo senza default viene saltato.</li>
        <li>Un gruppo con le sole chiavi <code>true</code> e <code>false</code> accetta un booleano.</li>
        <li>Un compound si applica quando corrispondono tutti i gruppi che elenca, default compresi.</li>
        <li>Ogni selezione viene costruita una volta sola e poi messa in cache.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() & globalStyle()",
        content: `
      <p><code>keyframes()</code> registra un'animazione e restituisce il nome generato. Le chiavi dei frame sono <code>from</code>, <code>to</code> e le percentuali, come <code>"50%"</code> o <code>"0%, 100%"</code>. Nei frame sono ammesse solo proprietà piatte, e frame identici restituiscono lo stesso nome.</p>
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
        <li>Il selettore viene usato esattamente come l'hai scritto.</li>
        <li>Funzionano solo le proprietà piatte. Chiavi pseudo, screen e chiavi <code>@</code> vengono ignorate, quindi <code>globalStyle()</code> non può scrivere regole media.</li>
        <li>La stessa regola viene aggiunta una volta sola. Con uno stile diverso per lo stesso selettore si aggiunge una seconda regola, e vince l'ultima.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() & resetStyles()",
        content: `
      <p><code>getCssText()</code> restituisce ogni regola creata in questo processo da <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> e <code>globalStyle()</code>: prima le regole di base, poi i blocchi <code>@media</code>, <code>@container</code> e <code>@supports</code>. Ti serve per il rendering lato server.</p>
      <ul>
        <li>Chiamala dopo <code>renderToString()</code>: includerà anche le regole create durante il render.</li>
        <li>Copre l'intero processo, non una singola pagina o richiesta, e può solo crescere. Non è un problema, perché i nomi delle classi sono hash del contenuto.</li>
        <li>Mettila in <code>&lt;style id="nuclo-styles"&gt;</code>: il client riusa quell'elemento e salta le regole che contiene già. Con un altro id, o senza, il client aggiunge un secondo foglio di stile e riscrive tutte le regole da capo.</li>
        <li>Il testo non viene escapato: non mettere mai input non attendibile nei valori di stile.</li>
      </ul>
      <p><code>resetStyles()</code> è un helper pensato per i test. Rimuove tutte le regole e l'elemento <code>#nuclo-styles</code>; gli stili creati prima conservano i nomi delle classi, ma perdono il loro CSS. Non chiamarla in un'app o su un server.</p>
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
      <div class="docs-callout"><strong>Pacchetto separato:</strong> <code>nuclo-router</code> non fa parte del core di Nuclo, quindi va installato accanto a <code>nuclo</code>. È una release in anteprima e la sua API può ancora cambiare.</div>
      <p>Il routing per Nuclo: rendering lato server, idratazione, rotte con suddivisione del codice e precaricamento in idle, il tutto costruito su <code>list()</code> e <code>update()</code>. Circa ${NUCLO_ROUTER_GZIP_KB.replace(".", ",")} KB gzip, nessuna dipendenza oltre a Nuclo e nessun side effect, quindi il tree-shaking lo elimina se non lo usi.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Va bene anche <code>pnpm add</code>, <code>yarn add</code> o <code>bun add</code> con gli stessi due nomi. Come peer dependency richiede <code>nuclo</code> 0.3 o successivo.</p>
      <p>Il router decide <em>cosa</em> caricare; sei tu a dire <em>dove</em> con <code>router.outlet()</code>: una <code>list()</code> sullo stack dei layer, una riga per layer, quindi una pagina normale è una riga sola. Server e client costruiscono lo stesso albero, così <code>hydrate()</code> riutilizza i nodi arrivati dal server invece di rimpiazzarli. Il resto è <code>history</code>, un listener <code>click</code> delegato e <code>requestIdleCallback</code>.</p>
      <h3>Un solo import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> risolve i moduli della rotta corrispondente prima di restituire, quindi il primo albero è completo sia sul server sia sul client. Da lì in poi il router espone valori e metodi della rotta che ha avviato: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
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
      <p>E questa è tutta l'integrazione. I link funzionano perché un <code>&lt;a href&gt;</code> resta un semplice <code>&lt;a href&gt;</code>: un listener delegato su <code>document</code> intercetta i link di cui il router è responsabile e lascia tutti gli altri al browser.</p>
      <p>Sul server <code>start()</code> restituisce una <code>Route</code> per ogni richiesta senza toccare il router, quindi richieste concorrenti non vedono mai le rotte l'una dell'altra. <code>route.run()</code> fa di quella Route la rotta letta dal router (e quindi dall'outlet) per tutta la durata del render. Nel browser c'è una Route per ogni caricamento di pagina e <code>start()</code> la rende quella del router: non serve nessun <code>run()</code>.</p>
      <p>Una pagina riceve il suo <a href="#router-api"><code>RouteContext</code></a> e le sue <a href="#router-api"><code>PageProps</code></a>, nella forma <code>(ctx, { layer, data, outlet, beforeLeave })</code>, e può accettarne anche meno. Restituisce qualsiasi cosa <code>list()</code> sappia digerire. Se la pagina deve riempire anche un'altra zona del layout, restituisci un <code>into()</code> dal suo interno, per esempio <code>div(article(…), into('sidebar', nav(…)))</code>: quel contenuto se ne va insieme alla pagina. Ne parliamo in <a href="#router-regions">Pagine e regioni</a>.</p>
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
          <tr><td><code>*</code></td><td>tutto ciò che non corrisponde a nient'altro: la tua 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>L'ordine di precedenza è: statici, poi dinamici nell'ordine in cui li dichiari, poi catch-all, prima quello col prefisso più lungo. Per questo <code>'*'</code> intercetta solo ciò che nient'altro riconosce e può stare ovunque nella tabella. Slash finali, slash doppi e percent-encoding vengono normalizzati, e i valori dei parametri arrivano già decodificati. Il matching è un semplice confronto segmento per segmento per ogni pattern: nessuna regex viene costruita o eseguita.</p>
      <h3>Rotte relative</h3>
      <p>Un pattern che comincia con <code>./</code> è relativo al genitore che lo dichiara, e un href che comincia con <code>./</code> è relativo alla rotta attiva. Insieme danno vita a una sezione riutilizzabile che ha lo stesso significato sotto qualsiasi genitore. Il valore di una tabella è un loader oppure un'altra tabella, le cui chiavi sono relative a essa:</p>
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
      <p>Queste due righe producono tutti e sei i pattern senza scrivere due volte nessun percorso. Entrambi i genitori ricevono gli stessi oggetti loader, quindi condividono un'unica cache dei moduli e un solo <code>import()</code>.</p>
      <ul>
        <li>In una tabella figlia, <code>'./x'</code>, <code>'/x'</code> e <code>'x'</code> sono equivalenti, <code>'/'</code> indica il percorso del genitore stesso e <code>'*rest'</code> dà alla sezione un catch-all tutto suo. L'annidamento può andare in profondità quanto serve.</li>
        <li>Le chiavi di primo livello valgono così come sono scritte: <code>'*'</code> resta <code>'*'</code>.</li>
        <li>Un figlio sotto un genitore <code>*catch-all</code> fa fallire <code>createRouter()</code>, perché un catch-all deve chiudere il suo pattern.</li>
      </ul>
      <h3>Pagine genitore e <code>outlet()</code></h3>
      <p>Genitore e figli formano una vera gerarchia: il genitore viene renderizzato e il figlio finisce al suo interno, nel punto in cui chiami <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Navigare tra i figli non ricostruisce il genitore: il suo nodo DOM è sempre lo stesso, quindi focus, posizione di scroll, un input scritto a metà e qualsiasi stato nella sua closure sopravvivono.</p>
      <ul>
        <li>Una pagina senza rotta figlia non renderizza nulla dal suo outlet, quindi un layout può chiamarlo senza condizioni. Se invece un genitore ha un figlio e non chiama mai <code>outlet()</code>, lo inghiotte.</li>
        <li>Non esistono rotte index. <code>'/'</code> è il layout stesso: il percorso del genitore renderizza il layout con un outlet vuoto, senza una pagina index separata al suo interno. Metti il contenuto iniziale nel layout, oppure dagli un vero percorso figlio.</li>
      </ul>
      <p>La stessa chiamata funziona da entrambi i genitori, e anche da una pagina che non sa in quale dei due si trova:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> e <code>..</code> si risolvono rispetto al percorso della rotta corrente, non alla "directory" dell'URL. Da <code>/invoices/42</code>, <code>./preview</code> è <code>/invoices/42/preview</code>, mentre un browser avrebbe detto <code>/invoices/preview</code>; e uno slash finale nell'URL non cambia nulla. <code>../</code> risale di un segmento e si ferma alla radice. Query e hash vengono mantenuti, <code>base</code> viene rimesso davanti e nella history finisce il percorso assoluto già risolto. È la stessa deviazione dalla risoluzione degli URL che React Router adotta per <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Sono relativi alla rotta solo <code>./</code> e <code>../</code>. Un semplice <code>preview</code> in un href segue le normali regole del browser.</li>
        <li>Per i link relativi usa <code>router.href('./preview')</code> invece di scrivere a mano <code>href="./preview"</code>. <code>href()</code> risolve al momento del render, quindi il markup inviato è assoluto e funziona per i crawler, per il click con il tasto centrale e con JavaScript disattivato.</li>
      </ul>
      <h3>Cosa si mantiene e cosa si ricostruisce</h3>
      <table>
        <thead><tr><th>Nodo</th><th>Quando navighi</th></tr></thead>
        <tbody>
          <tr><td>un genitore con pattern e percorso invariati</td><td><strong>mantenuto</strong>: stesso nodo, e il suo <code>load()</code> non viene rieseguito</td></tr>
          <tr><td>la pagina corrispondente</td><td><strong>mantenuta</strong> se pattern e percorso non sono cambiati e non ha un <code>load()</code>: un cambio di query o hash non la tocca. Una rotta con un loader si aggiorna a ogni visita.</td></tr>
          <tr><td>un genitore il cui percorso è cambiato</td><td>ricostruito, insieme a tutto ciò che ha sotto</td></tr>
          <tr><td>un layer aperto con push</td><td>renderizza solo la pagina corrispondente, perché i suoi genitori sono già montati nella riga sottostante</td></tr>
        </tbody>
      </table>
      <p>Una pagina mantenuta conserva il <code>ctx</code> con cui è stata costruita. È questo il senso di <code>ctx</code> ovunque: per i valori live leggi <code>router.*</code>. Lo stato guidato dalla query (filtri, paginazione, tab) legge <code>router.search</code> dentro un valore dinamico e scrive con <code>router.go('?page=2', { replace: true })</code>. La pagina, il suo focus e l'input scritto a metà restano dove sono.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Pagine e regioni",
        content: `
      <p><code>router.outlet()</code> mette la pagina in un punto. Se una pagina ha bisogno anche di una sidebar, una toolbar o un'intestazione altrove nel layout, la riempie con <a href="#api-region"><code>into()</code></a>: il layout segna il punto con <code>region()</code> e la pagina restituisce un <code>into()</code> accanto al proprio contenuto. Il layout non riceve mai contenuto di pagina come prop, e navigare non lo ricostruisce mai.</p>
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
      <p>Il contenuto della pagina è una riga della <code>list()</code> dell'outlet, e un <code>into()</code> vive finché vive la riga che lo contiene. Così il contenuto della sidebar arriva con la pagina e se ne va con lei: se navighi verso una pagina senza <code>into('sidebar', …)</code>, la regione torna a mostrare il suo contenuto <code>empty</code>. La pagina può usare il suo <code>ctx</code> e i suoi <code>data</code> per entrambe le parti, perché sono costruite dalla stessa funzione.</p>
      <h3>Cosa succede quando navighi</h3>
      <ul>
        <li><strong>Una pagina mantenuta conserva le sue regioni.</strong> Un cambio di query o hash che <a href="#router-patterns">mantiene la pagina</a> non tocca nemmeno il contenuto della regione. Se la sidebar ne dipende, leggi <code>router.search</code> dentro un valore dinamico.</li>
        <li><strong>Una pagina ricostruita le riempie da capo.</strong> Quando la rotta cambia, la vecchia riga sparisce e le viste <code>into()</code> della nuova pagina prendono il suo posto: non resta niente del passato.</li>
        <li><strong>Un layer aperto con push aggiunge una vista.</strong> Il layer è una riga successiva dell'outlet, quindi il suo <code>into()</code> è una vista più recente della stessa regione. Con il default <code>type: 'latest'</code> copre la vista della pagina finché il layer non si chiude, e a quel punto la vista della pagina riappare. Con <code>type: 'stack'</code> si vedono entrambe.</li>
        <li><strong>Anche una pagina genitore può riempire regioni.</strong> Le sue viste restano mentre i figli cambiano, perché il genitore non viene ricostruito.</li>
        <li><strong>Il rendering lato server funziona così com'è.</strong> Il server costruisce la pagina dentro <code>route.run()</code>, quindi le sue viste <code>into()</code> sono già nell'HTML e <code>hydrate()</code> le riutilizza.</li>
      </ul>
      <h3>Più regioni da una sola pagina</h3>
      <p>Passa un oggetto per riempire più regioni in un colpo solo. Il contenuto principale della pagina passa comunque dall'outlet, quindi restituiscilo accanto all'<code>into()</code>:</p>
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
      <h3>Quale strumento per quale lavoro</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> serve per una rotta figlia: il contenuto lo decide l'URL e viene renderizzato dentro la pagina genitore. Vedi <a href="#router-patterns">Rotte annidate</a>.</li>
        <li><strong><code>into()</code></strong> serve quando la pagina corrispondente si distribuisce nel layout: il contenuto appartiene alla pagina e usa i suoi dati.</li>
        <li><strong><code>matches()</code></strong> serve quando è il layout a decidere, guardando solo l'URL, con una sua piccola tabella e senza nessuna pagina di mezzo. Vedi <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Tutti e tre appartengono all'unica rotta corrispondente. Il router non pilota due aree indipendenti con un solo URL: una sidebar con le sue rotte è quindi una regione che una pagina riempie, non un secondo outlet. Se invece una sidebar vuole davvero un proprio router, un proprio caricamento e un proprio fallback, tieni un router non avviato e risolvi con <code>match()</code>: vedi <a href="#router-multi">Più router e caricamento combinato</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Loader di rotta e suddivisione del codice",
        content: `
      <p>Un modulo di pagina può esportare una funzione <code>load</code>. Gira prima che la pagina venga costruita, a ogni navigazione verso quella rotta, e ciò che restituisce arriva alla pagina come <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>La tabella delle rotte non cambia: il loader viaggia insieme alla pagina. Riceve il <code>RouteContext</code> corrispondente, quindi <code>params</code>, <code>search</code> e <code>path</code> sono tutti a disposizione. Può essere sincrono o asincrono e gira anche sul server, quindi una pagina renderizzata lato server arriva con i suoi dati già nell'HTML, invece di fare fetch dopo l'idratazione.</p>
      <p><strong>Il modulo finisce in cache, i dati no.</strong> Il chunk di una rotta si scarica una volta e viene riusato, mentre il suo loader gira di nuovo a ogni navigazione. Per questo <code>/blog/a</code> e <code>/blog/b</code> non si possono confondere, e per questo un loader fallito si può semplicemente ritentare.</p>
      <table>
        <thead><tr><th>Situazione</th><th>Cosa succede</th></tr></thead>
        <tbody>
          <tr><td>mentre è in esecuzione</td><td><code>router.pending</code> è true e la pagina in cui ti trovavi resta visibile</td></tr>
          <tr><td>lancia un'eccezione o rifiuta</td><td>l'errore finisce in <code>router.error</code>. <code>go()</code> continua a non rifiutare mai, e puoi ritentare la navigazione.</td></tr>
          <tr><td>durante <code>start()</code></td><td>il rifiuto esce da <code>start()</code>, perché non c'è ancora una Route su cui appoggiarlo</td></tr>
          <tr><td>un layer aperto con push</td><td>esegue il proprio loader, con i propri dati</td></tr>
          <tr><td>il precaricamento in idle</td><td>precarica solo i moduli: non ha un contesto da passare, e scaricherebbe dati per una rotta che magari non aprirai mai</td></tr>
          <tr><td>navigare di nuovo verso lo stesso URL</td><td>il loader gira di nuovo e la riga viene ricostruita. Una rotta senza loader mantiene la sua riga.</td></tr>
        </tbody>
      </table>
      <p>Per rivalidare, naviga verso dove ti trovi già, senza aggiungere una voce alla history:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Caricare i dati insieme al chunk</h3>
      <p>Un <code>load</code> esportato dal modulo di pagina parte solo quando quel modulo è arrivato, quindi a freddo si scarica prima il chunk e poi i dati. Per avviare le due cose insieme, dichiara il loader nella tabella con <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Prende il posto del <code>load</code> del modulo e, come lui, gira a ogni visita. Un rifiuto mentre il chunk è ancora in caricamento finisce in <code>router.error</code>, come tutti gli altri.</p>
      <p>I dati del server non vengono serializzati nell'HTML: è una scelta voluta. Il <code>load</code> del client gira di nuovo durante l'idratazione. Se ti interessa evitarlo, fai emettere al server <code>route.data</code>, per esempio come <code>window.__DATA__</code>, e fai in modo che il loader lo legga per primo. <code>route.data</code> contiene solo i dati della pagina corrispondente: il risultato del <code>load()</code> di un genitore non c'è.</p>
      <h3>Suddivisione del codice e precaricamento</h3>
      <p>Il valore di una rotta è sempre una funzione che restituisce il componente di pagina, così il componente si raggiunge in modo lazy:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Solo i valori con la forma di un modulo possono includere un export <code>load</code>. Se scegli un componente con nome tramite <code>.then(m =&gt; m.BPage)</code>, al router arriva soltanto la funzione.</p>
      <p>Ogni modulo viene importato una volta e messo in cache; navigazioni concorrenti verso la stessa rotta condividono un solo <code>import()</code>. Quando l'utente non interagisce con la pagina per <code>idleTimeout</code> (un secondo di default, senza tocchi, tasti, rotella o scroll), le rotte rimanenti si caricano in background, una per ogni intervallo idle (<code>requestIdleCallback</code>). Qualsiasi input, o una navigazione che l'utente sta aspettando, mette tutto in pausa finché la pagina non torna idle.</p>
      <p>Una rotta precaricata o eager non attiva mai <code>router.pending</code> e appare prima del prossimo aggiornamento dello schermo: nessun frame con lo spinner, nessun salto del layout. <code>router.pending</code> è true solo per un modulo o un loader che va aspettato, e nel frattempo la pagina in uscita resta sullo schermo. Un chunk che non si carica viene segnalato in <code>router.error</code>, mai come un rifiuto non gestito, e si può semplicemente ritentare.</p>
    `,
      },
      {
        id: "router-api",
        title: "API del router",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> associa un pattern a un loader, oppure a una tabella annidata. Le opzioni:</p>
      <table>
        <thead><tr><th>Opzione</th><th>Default</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>Il prefisso URL sotto cui viene servita l'app, per esempio <code>'/docs'</code>. Combacia solo al confine di un segmento: <code>/docs/intro</code> è dentro <code>'/docs'</code>, <code>/docsearch</code> no. Gli URL fuori da <code>base</code> non corrispondono a nulla, quindi <code>start()</code> rifiuta (la tua 404 lato server) e i link che li puntano vengono lasciati al browser.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Carica in background i moduli delle rotte rimanenti quando la pagina è idle. Con <code>false</code> si disattiva.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>I millisecondi senza tocchi, tasti, rotella o scroll prima che il precaricamento parta, o riparta dopo un momento di attività.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, chiamata dopo ogni navigazione risolta nel browser, quella iniziale compresa, quando il DOM si è già aggiornato. <code>kind</code> è <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Indietro, Avanti, <code>close()</code>) o <code>'layer'</code>. È l'hook giusto per <code>document.title</code>, meta tag, focus, scroll e analytics. Non viene mai chiamata durante la SSR.</td></tr>
        </tbody>
      </table>
      <p>Restituisce il router, con <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> e ogni membro di <code>Route</code> tranne <code>run()</code>, letti attraverso la Route attiva: quella restituita dall'ultimo <code>start()</code> nel browser, oppure quella il cui <code>run()</code> è in esecuzione sul server. Leggere un membro in assenza di entrambe lancia un'eccezione. La tabella delle rotte, il matcher compilato e la cache dei moduli vivono sul router, quindi su un server sono condivisi tra le richieste.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Risolve <code>url</code> (di default <code>location.href</code> nel browser) nei suoi moduli di pagina e restituisce una <code>Promise&lt;Route&gt;</code>. Rifiuta quando nulla corrisponde e la tabella non ha una rotta <code>'*'</code>; sul server, quella è la tua 404. Nel browser, inoltre, rende la Route quella attiva del router, aggancia i listener <code>popstate</code> e <code>click</code> delegato e pianifica il precaricamento. Un secondo <code>start()</code> ritira da solo la Route precedente. Sul server non tocca nulla di condiviso, quindi fai il render dentro <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Risolve un URL rispetto alla tabella senza caricare niente: nessun import, nessuna history, nessun listener, nessuna Route. Restituisce un <code>RouteContext</code>, oppure <code>null</code> se l'URL è fuori da <code>base</code>, non corrisponde a nessun pattern o, nel browser, appartiene a un'altra origine. Accetta solo URL assoluti, perché risolvere <code>./</code> richiede una rotta attiva.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Le pagine della rotta attiva come <code>list()</code>. Mettilo una volta sola, dove devono andare le pagine; un layer aperto con push ne è una riga successiva. È vuoto prima che <code>start()</code> si risolva e dopo <code>stop()</code>. Sul server renderizza la Route il cui <code>run()</code> è in esecuzione.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Renderizza la vista di una seconda tabella corrispondente al percorso della rotta attiva, come una <code>list()</code> che puoi mettere dove vuoi. Vedi <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Ogni membro tranne <code>run()</code> è disponibile anche sul router, che è il posto da cui un'app lo legge.</p>
      <table>
        <thead><tr><th>Membro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>la corrispondenza attiva. <code>search</code> è un <code>URLSearchParams</code>; <code>search</code>, <code>hash</code> e <code>url</code> sono live.</td></tr>
          <tr><td><code>pending</code></td><td>una navigazione sta aspettando un modulo o un loader</td></tr>
          <tr><td><code>error</code></td><td>l'ultimo caricamento fallito, azzerato dalla navigazione successiva</td></tr>
          <tr><td><code>data</code></td><td>ciò che ha restituito il <code>load()</code> della pagina corrispondente, pronto per essere serializzato da un server. Quello di un genitore non è incluso.</td></tr>
          <tr><td><code>depth</code></td><td>quanti layer ci sono nello stack (1 per una pagina normale)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>naviga, caricando il modulo se serve. Non rifiuta mai: un modulo che fallisce, sia rifiutando sia lanciando un'eccezione, finisce in <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>apre una rotta come nuovo layer in cima e si risolve con il valore con cui il layer si chiude. Accetta <code>./</code>. Rifiuta se nulla corrisponde o se il modulo fallisce.</td></tr>
          <tr><td><code>href(path)</code></td><td>mette <code>base</code> davanti a un percorso, per <code>a({ href })</code>. Risolve <code>./</code> e <code>../</code> rispetto alla rotta attiva.</td></tr>
          <tr><td><code>stop()</code></td><td>stacca ogni listener, chiude i layer aperti, svuota l'outlet. È idempotente. Una Route fermata risponde ancora con l'ultima corrispondenza, e <code>go()</code> non fa nulla.</td></tr>
          <tr><td><code>run(fn)</code></td><td>chiama <code>fn</code> con questa Route come quella attiva del router e ne restituisce il risultato: <code>route.run(() =&gt; renderToString(App))</code> sul server. Solo sincrono. La Route smette di essere attiva quando <code>fn</code> ritorna.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Il primo argomento di una pagina: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. È il contesto con cui la pagina è stata costruita; per i valori live leggi <code>router.*</code>. I due differiscono solo quando query o hash sono cambiati senza una ricostruzione.</p>
      <p>Di default <code>params</code> è <code>{ [name]: string }</code>. Una pagina può tipizzarlo a partire dal proprio pattern con <code>Params</code>, che trasforma <code>'/blog/:slug'</code> in <code>{ slug: string }</code> e <code>'/files/*rest'</code> in <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>Il secondo argomento di una pagina. Destruttura solo ciò che ti serve.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>dove si trova la pagina nello stack. Vedi <code>Layer</code> qui sotto.</td></tr>
          <tr><td><code>data</code></td><td>ciò che ha restituito il <code>load()</code> della rotta, oppure <code>undefined</code> se non ne ha uno. Il tipo viene da <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>il punto in cui una pagina genitore renderizza la sua rotta figlia. Vedi <a href="#router-patterns">Rotte annidate</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>registra una guardia che viene consultata prima che la pagina venga scartata. Vedi <a href="#router-layers">Guardie di uscita</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Dove si trova una pagina nello stack, e come ne esce.</p>
      <table>
        <thead><tr><th>Membro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 per la pagina di base, 1 e oltre per i layer aperti con push</td></tr>
          <tr><td><code>push(href)</code></td><td>apre un altro layer dall'interno di una pagina, come <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>chiude questo layer e tutto ciò che ha sopra, risolvendo il <code>push()</code> che lo aveva aperto. Senza argomento significa "chiuso senza risultato". A profondità 0 non fa nulla.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> e <code>withLoad()</code></h3>
      <p><code>DataLoader</code> è <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, l'export opzionale <code>load</code> di un modulo di pagina. <code>withLoad(loader, load)</code> crea una rotta il cui <code>load</code> parte insieme all'import del suo chunk, invece che dopo. Vedi <a href="#router-loaders">Loader di rotta</a>.</p>
      <h3>Tipi</h3>
      <p>Ogni tipo è un export con nome di <code>nuclo-router</code>, quindi puoi tipizzare una pagina, un loader o una guardia senza importare da un percorso interno.</p>
      <table>
        <thead><tr><th>Tipo</th><th>Cos'è</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>l'oggetto params di un pattern. <code>RouteParams</code> è la forma non tipizzata, e <code>Match</code> è il risultato del matcher.</td></tr>
          <tr><td><code>PageComponent</code></td><td>una pagina: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>un modulo di pagina: il componente stesso, oppure <code>{ default, load? }</code> come lo restituisce <code>import()</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, che può portare con sé un <code>load</code> da <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>la tabella che accetta <code>createRouter()</code>: pattern verso loader, o verso una tabella annidata</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, il secondo argomento di <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, il secondo argomento di <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>il tipo di <code>outlet()</code> da <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, ciò che <code>beforeLeave()</code> accetta</td></tr>
          <tr><td><code>MatchView</code></td><td>che cos'è una vista di <code>matches()</code>: params in ingresso, contenuto o <code>import()</code> di una pagina in uscita</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Layer e guardie di uscita",
        content: `
      <p><code>push()</code> apre una rotta sopra quella corrente invece di sostituirla, e si risolve con il valore con cui quel layer si chiude. Poiché le pagine sono un'unica <code>list()</code> sullo stack, aprire un layer equivale a un append. La pagina sotto non viene renderizzata di nuovo, quindi il suo DOM, il suo focus e il form compilato a metà sono ancora lì quando il layer si chiude.</p>
      <p>È così che funziona il flusso "mi serve un record che non esiste ancora", senza buttare via il form che l'utente stava compilando:</p>
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
      <p>I layer si annidano: un dialog che ha bisogno di un altro dialog chiama <code>layer.push()</code> e lo attende, senza alcun riferimento alla Route.</p>
      <ul>
        <li><strong>L'URL è il layer in cima.</strong> <code>push()</code> aggiunge una voce alla history, quindi un layer è raggiungibile con un link e Indietro lo chiude, risolvendo il suo <code>push()</code> come chiuso senza risultato, esattamente come Annulla. Indietro e <code>close()</code> seguono lo stesso percorso di codice: <code>close()</code> registra il suo risultato e fa tornare indietro la history, e a fare fede è la profondità in <code>history.state</code>. I browser conservano circa 50 voci per tab, quindi dopo una lunga serie di navigazioni tra i layer la voce sottostante potrebbe non esserci più: in quel caso <code>close()</code> chiude i layer sul posto e riscrive la voce corrente con la pagina rimasta visibile.</li>
        <li><strong>Una navigazione normale svuota lo stack.</strong> Un click su un link o un <code>go()</code> non è un layer: sostituisce tutto e chiude ogni layer aperto, così nessun chiamante resta in attesa.</li>
        <li><strong>Un caricamento a freddo è una pagina a sé.</strong> L'URL indica il layer in cima ma non lo stack sotto di esso, quindi aprendo direttamente l'URL di un layer lo vedi a profondità 1, con <code>layer.depth === 0</code> e un <code>close()</code> inerte. Una rotta aperta con push deve avere senso anche da sola. Controlla <code>layer.depth</code> per offrire un link di uscita al posto di un pulsante Annulla che non fa nulla.</li>
        <li><strong>La promise non sopravvive a un ricaricamento</strong>, perché vive in una closure. Considera il risultato una scorciatoia dentro un flusso che funziona anche per la strada lunga.</li>
        <li><strong>Nessuno resta in attesa.</strong> <code>stop()</code> chiude ogni layer aperto, e un layer abbandonato da una navigazione si risolve con <code>undefined</code>.</li>
      </ul>
      <h3>Guardie di uscita</h3>
      <p>Una pagina che contiene qualcosa che vale la pena conservare, come un form compilato a metà, registra una guardia. La guardia viene consultata prima che la pagina venga scartata, e restituire <code>false</code> (o una promise che si risolve con quel valore) la mantiene al suo posto:</p>
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
        <li><strong>Qualsiasi via d'uscita.</strong> Un link, <code>go()</code>, Indietro e Avanti, il <code>close()</code> di un layer e <code>go()</code> verso un URL di cui il router non è responsabile (cioè uscire dall'app, dove <code>to</code> è <code>null</code>). Un Indietro o Avanti rifiutato viene annullato, così la barra degli indirizzi resta sulla pagina. Chiudere la tab o ricaricare spetta a <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> è il <code>RouteContext</code> verso cui sta andando la navigazione. Le guardie partono dalla più interna e si fermano al primo rifiuto; se una lancia un'eccezione, la pagina resta. Anche <code>close(result)</code> passa dalla guardia, quindi azzera il tuo flag prima di chiudere con un risultato.</li>
        <li>Il router può annullare solo le voci della history che ha scritto lui. Un Indietro o Avanti verso una voce che non è sua, come un link nativo <code>#fragment</code> o il <code>pushState</code> di un altro script, non passa dalla guardia.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() e sub-router",
        content: `
      <p><code>router.outlet()</code> renderizza la pagina. <code>router.matches(table)</code> renderizza qualcos'altro che dipende da dove ti trovi (una sidebar, un breadcrumb, una toolbar) a partire da una sua piccola tabella, senza caricare una rotta né aggiungere una pagina:</p>
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
        <li><strong>Stesso matching della tabella delle rotte.</strong> Pattern, precedenza, matching sul percorso grezzo e rimozione di <code>base</code> sono quelli del router, quindi vista e pagina sono sempre d'accordo sull'URL. Legge il percorso del layer in cima, come <code>router.path</code>.</li>
        <li><strong>Una vista</strong> è <code>(params, ctx) =&gt; content</code>, dove <code>params</code> prende il tipo dal suo pattern e <code>ctx</code> è il <code>RouteContext</code> con il <code>pattern</code> e i <code>params</code> della vista. Può restituire anche l'<code>import()</code> di un modulo di pagina, che viene chiamato con <code>ctx</code> appena arriva.</li>
        <li><strong>Se nulla corrisponde, non viene renderizzato nulla.</strong> Aggiungi una vista <code>'*'</code> come fallback. Come l'outlet, è vuoto prima di <code>start()</code> e dopo <code>stop()</code>.</li>
        <li><strong>Viene renderizzata di nuovo solo quando cambia la rotta</strong>, quindi una vista conserva il suo DOM in tutto ciò che mantiene la pagina.</li>
        <li><strong>Una vista lazy non renderizza nulla finché il suo modulo non arriva.</strong> Un <code>import()</code> fallito viene registrato con <code>console.error</code>, non imposta <code>router.error</code> e viene ritentato alla navigazione successiva. Un semplice <code>update()</code> non ritenta.</li>
        <li><strong>Sul server</strong> una vista lazy non emette nulla, perché il suo modulo arriva sul client. Per tutto ciò che deve stare già nel primo HTML usa una vista sincrona.</li>
      </ul>
      <h3>Sub-router</h3>
      <p>Le rotte si annidano, quindi un sub-router è di solito una semplice tabella annidata. Un solo router: la pagina <code>'/'</code> della sezione è la sua cornice, e i suoi figli vengono renderizzati nell'<code>outlet()</code> di quella pagina, così la cornice sopravvive alla navigazione dentro la sezione:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Oppure puoi dare alla funzionalità un router tutto suo, creato ma mai avviato. Il genitore possiede una sola voce catch-all, e il figlio risolve la coda rispetto ai propri pattern, params e fallback:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Non avviarlo è proprio il punto: <code>start()</code> è ciò che aggancia i listener, e due router avviati entrano in conflitto. Il prezzo da pagare è che la risoluzione resta al figlio, quindi i loader di rotta, che un router avviato eseguirebbe da sé, devi chiamarli tu. Con questa forma, inoltre, la shell viene ricostruita quando la coda cambia, perché il router vede una sola rotta e la shell risolve il resto per conto suo. Una tabella annidata ti dà invece un genitore che il router tiene montato: preferiscila, a meno che la funzionalità non abbia davvero bisogno di un proprio router, base e fallback.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Più router e caricamento combinato",
        content: `
      <p>Un'app può avere tanti router quante sono le sue aree. La regola che tiene tutto semplice: <strong>avviane esattamente uno per documento</strong> e lascia tutti gli altri non avviati, a risolvere URL con <code>match()</code>. Solo il router avviato possiede l'URL, la history e il listener dei click; gli altri sono tabelle a cui fai domande, e ogni area può caricare con il proprio ritmo e il proprio spinner.</p>
      <h3>Caricamento combinato: una catena di loader</h3>
      <p>Ogni pagina di una catena corrispondente può esportare <code>load()</code>. In una navigazione a freddo verso una rotta figlia, il loader del layout e quello della pagina girano <strong>in parallelo</strong>, e un unico <code>router.pending</code> copre l'intera catena: la pagina precedente resta sullo schermo finché la coppia non si risolve, così non viene mai mostrato un albero caricato a metà. Ogni componente riceve i propri <code>data</code>:</p>
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
      <p>I due loader partono insieme, non uno dopo l'altro. <code>router.pending</code> è true finché uno dei due è in attesa, e false per il resto del tempo (una rotta precaricata o eager non lo attiva mai). Spostarsi tra le sezioni mantiene il layout, quindi gira di nuovo solo il loader della sezione: i dati del layout, il suo DOM e un input scritto a metà sopravvivono tutti. Navigare di nuovo verso lo stesso URL fa ripartire il loader della foglia e ricostruisce la sua riga, esattamente come per una pagina singola.</p>
      <h3>Caricamento multiplo: un secondo router con il suo spinner</h3>
      <p>Un'area indipendente (una sidebar, un tray, una live region) riceve un router tutto suo, creato ma mai avviato, e un proprio flag di caricamento. <code>router.pending</code> appartiene al router avviato e non dice nulla su quest'area, quindi i due caricamenti possono procedere fianco a fianco e ciascuno può finire per primo:</p>
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
      <p>Al secondo router si fanno domande, non gli si danno ordini: <code>match()</code> legge l'URL e restituisce un contesto, e nulla della sidebar entra mai nella tabella delle rotte principale. <code>onNavigate</code> gira dopo ogni navigazione risolta, quella iniziale compresa, ed è quindi l'unico punto in cui un'area indipendente resta al passo con l'URL.</p>
      <ul>
        <li><strong><code>pending</code> appartiene al router avviato.</strong> Un router mai avviato non ha una Route, né <code>pending</code> né <code>error</code>. L'area tiene traccia dei propri flag, e un secondo spinner può convivere con il primo. Nella demo la sidebar carica per 800ms mentre i loader della rotta ne impiegano 900, quindi la pagina può finire prima della sidebar o viceversa.</li>
        <li><strong><code>match()</code> non aggancia nulla.</strong> Un numero qualsiasi di router non avviati può convivere nello stesso documento: ciascuno ha la propria tabella, base e cache dei moduli, e nessuno tocca la history. Costano una tabella e un matcher.</li>
        <li><strong>I suoi loader non girano mai.</strong> Il router avviato esegue il <code>load()</code> delle pagine a cui corrisponde, mentre uno mai avviato si limita a risolvere: se le sue viste hanno bisogno di dati, vai a prenderteli tu, come fa il <code>refreshSidebar()</code> della demo. Se vuoi i loader, una <a href="#router-matches">tabella annidata</a> o una <a href="#router-regions">regione riempita da una pagina</a> lasciano quel compito al router avviato.</li>
        <li><strong>Attenzione alle risposte obsolete.</strong> Una risposta lenta della sidebar non deve aggiornare una sezione che hai già lasciato. Incrementa un contatore di generazione a ogni refresh e scarta le risposte che non corrispondono più, come fa il router stesso quando ritira le navigazioni superate.</li>
        <li><strong>Nemmeno una vista lazy di <code>matches()</code> ha un <code>pending</code>.</strong> Non renderizza nulla finché il suo modulo non arriva. Tre sistemi di caricamento, tre orologi indipendenti: il <code>pending</code> della rotta, i tuoi flag e una vista lazy che semplicemente non c'è ancora.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Gestione dei link",
        content: `
      <p>Il listener delegato gestisce la navigazione quando fai click con il tasto sinistro su un <code>&lt;a href&gt;</code>, anche un <code>&lt;a&gt;</code> SVG o un click su qualcosa di annidato al suo interno, e si fa da parte in tutti gli altri casi: click con modificatori o con il tasto centrale, un <code>target</code> diverso da <code>_self</code>, <code>download</code>, <code>rel="external"</code>, href cross-origin, link con solo hash sulla pagina corrente, percorsi fuori da <code>base</code>, percorsi a cui nessuna rotta corrisponde (così una 404 renderizzata lato server resta raggiungibile) e qualsiasi evento su cui un handler dell'app abbia già chiamato <code>preventDefault()</code>. Per escludere un link in modo esplicito usa <code>data-nuclo-router="off"</code>.</p>
      <h3>Scroll</h3>
      <p>Una navigazione con push conserva la posizione di scroll corrente. Se il nuovo URL ha un <code>#hash</code> che corrisponde a un elemento della pagina, quell'elemento viene portato in vista. Con <code>popstate</code> lo scroll resta al browser. Se vuoi aprire le nuove pagine dall'alto, fallo in <code>onNavigate</code>, che ti dice come è avvenuta la navigazione:</p>
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
        <li><strong>Nulla viene trattenuto.</strong> La Route contiene la funzione della pagina e il suo contesto, mai il DOM. Navigare altrove rilascia la pagina precedente. <code>stop()</code> rilascia i listener e qualsiasi caricamento in corso e azzera <code>pending</code>, così una Route ritirata non lascia mai uno spinner appeso. Un modulo che si risolve dopo <code>stop()</code> viene scartato in silenzio.</li>
        <li><strong>Sicuro anche con la concorrenza sul server.</strong> <code>start()</code> restituisce uno stato per ogni richiesta e <code>run()</code> lo limita a un singolo render sincrono, quindi richieste interlacciate non vedono mai le rotte l'una dell'altra. Solo la cache dei moduli è condivisa. L'ambito termina quando la funzione di <code>run()</code> ritorna: <code>renderToString()</code> è sincrono, quindi basta. Un render asincrono o in streaming richiederebbe di portarsi dietro la Route attraverso gli <code>await</code>, cosa che <code>run()</code> non fa.</li>
        <li><strong>Il ripristino dello scroll su <code>popstate</code></strong> spetta al browser (<code>scrollRestoration</code>), non al router.</li>
        <li><strong>Avvia un solo router per documento.</strong> Ogni <code>start()</code> aggiunge il proprio listener <code>click</code> delegato, e lo <code>start()</code> di un secondo router non ritira il primo: lo fa solo un secondo <code>start()</code> sullo stesso router. Per risolvere un URL rispetto a un'altra tabella, crea un router e chiama solo <code>match()</code>, che non aggancia nulla. Così un'area indipendente può gestire il proprio caricamento accanto al <code>pending</code> della rotta. Vedi <a href="#router-multi">Più router e caricamento combinato</a>.</li>
        <li><strong>Non incluso, per scelta:</strong> hash history e memory history, perché la rotta vive nel pathname e un server deve servire ogni rotta; due aree con routing indipendente guidate da un solo URL, perché una pagina può riempire più regioni con <code>into()</code> ma tutte appartengono all'unica rotta corrispondente (un'area indipendente può comunque tenere il proprio router non avviato e il proprio caricamento, come in <a href="#router-multi">Più router e caricamento combinato</a>); e il precaricamento all'hover, che si ottiene chiamando il loader della rotta da un <code>mouseenter</code>.</li>
      </ul>
      <h3>Esempi</h3>
      <p>Nel repository ci sono due esempi eseguibili che si completano a vicenda, così ogni impostazione si può osservare da qualche parte:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: un tour lato client dell'intera API. Ogni forma di pattern e regola di precedenza, le esclusioni della gestione dei link, ogni membro di Route con controlli live, un sub-router, lo stack di layer profondo tre, una sezione relativa montata su due genitori e loader di rotta con <code>pending</code> ed <code>error</code>. Imposta <code>preload: false</code>, così quegli stati restano visibili.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> per ogni richiesta, idratazione che riutilizza in modo dimostrabile i nodi del server, veri codici di stato 404, un <code>base</code> non radice, precaricamento in idle osservabile nel pannello di rete e un loader i cui dati passano dal server al client, così l'idratazione non rifà il fetch.</li>
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
      <p>Nuclo non ha un'API per i valori calcolati: usa una semplice funzione e chiamala dai valori dinamici.</p>
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
      <p>Usa i normali <code>async</code>/<code>await</code> e chiama <code>update()</code> ogni volta che lo stato cambia. Per un fetch significa una volta prima dell'<code>await</code> e una dopo:</p>
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
        <li><strong>Tieni i valori dinamici veloci e puri.</strong> Vengono eseguiti tutti a ogni <code>update()</code>.</li>
        <li><strong>Usa <code>scope()</code></strong> per gli aggiornamenti piccoli e frequenti, come la digitazione o i timer.</li>
        <li><strong>Fai il render dentro il documento.</strong> I nodi che non sono nel documento quando gira <code>update()</code> smettono di aggiornarsi.</li>
        <li><strong>Usa <code>when()</code> e <code>list()</code></strong> per i figli che cambiano, non una funzione che restituisce nodi.</li>
        <li><strong>Usa <code>className</code>, non <code>class</code></strong>, e per le classi dinamiche scegli <code>() =&gt; cx(...)</code> oppure <code>{ className: () =&gt; … }</code>.</li>
        <li><strong>Definisci gli stili una volta sola</strong>, a livello di modulo.</li>
        <li><strong>Rendering lato server:</strong> fai prima il render, poi metti <code>getCssText()</code> in <code>&lt;style id="nuclo-styles"&gt;</code>. Passa i dati della richiesta come argomenti e conserva i commenti HTML nell'output.</li>
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
      <p>Tutte le funzioni pubbliche, e da dove arrivano.</p>
      <h3><code>nuclo</code> (globale ed export con nome)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: esegue tutti i valori dinamici, o solo quelli negli scope indicati.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: assegna a un elemento degli id di scope, da usare con <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: contenuto condizionale, con <code>.when()</code> e <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: una riga per elemento, abbinata per identità.</li>
        <li><a href="#api-region"><code>region(options)</code></a> e <a href="#api-region"><code>into(id, ...content)</code></a>: un punto con nome nell'albero, e il contenuto che lo riempie da qualsiasi parte.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: un listener di eventi, oppure <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: costruisce e aggiunge al DOM.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: prende in carico l'HTML arrivato dal server.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: richiama i componenti e aggiorna il DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: classi generate a partire da un oggetto di stile.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: combina gli stili, vince l'ultimo.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code> legati a un tema.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: stili a partire da opzioni.</li>
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
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: una rotta il cui loader di dati parte insieme al suo chunk.</li>
        <li><a href="#router-api">Tipi</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> e altri ancora.</li>
      </ul>
      <h3>Solo globali</h3>
      <ul>
        <li><a href="#tag-builders">175 builder di tag</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, e <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Tipi</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> e altri. I tipi di stile come <code>StyleResult</code> si possono importare anche da <code>'nuclo'</code>.</li>
      </ul>
      <h3>Chiavi speciali</h3>
      <ul>
        <li><a href="#attributes">Attributi</a>: <code>className</code>, <code>style</code>, gli <a href="#events">handler <code>on*</code></a>, <a href="#lifecycle"><code>onMount</code> e <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Oggetti di stile</a>: abbreviazioni, pseudoclassi e pseudoelementi, selettori <code>&amp;</code>, regole <code>@</code> e <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Domande frequenti",
        content: `
      <h3>Cambiare lo stato aggiorna la UI?</h3>
      <p>No. Il DOM resta com'è finché non chiami <code>update()</code>.</p>

      <h3>Nuclo usa signal, proxy o un virtual DOM?</h3>
      <p>No. Lo stato resta semplice JavaScript. Quando un albero viene renderizzato, Nuclo crea elementi e nodi di testo veri. <code>update()</code> esegue ogni valore dinamico registrato, o solo quelli dentro gli scope indicati, e aggiorna quegli stessi nodi dove un valore è cambiato. Non esiste nessun grafo delle dipendenze, né un albero virtuale.</p>

      <h3>Perché la mia pagina mostra "false"?</h3>
      <p>I booleani vengono renderizzati come testo: <code>div(ok &amp;&amp; span('Done'))</code> mostra "false". Per i figli usa <code>when(() =&gt; ok, span('Done'))</code>, per il testo <code>ok ? 'Done' : ''</code>.</p>

      <h3>Perché la riga della mia lista non cambia quando modifico l'elemento?</h3>
      <p>Le righe degli elementi ancora presenti nella lista vengono mantenute, non rifatte da zero. Per i campi che cambiano usa valori dinamici come <code>() =&gt; todo.text</code>. Vedi <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Perché una parte della mia UI smette di aggiornarsi?</h3>
      <p>Di solito i suoi nodi non erano nel documento quando è girato <code>update()</code>. Nuclo smette di tracciare quei nodi anche dopo che li hai collegati, quindi fai il render in un container che sia già nel documento. Altre due cause: un <code>when()</code> la cui condizione lancia un'eccezione smette di aggiornarsi, e una funzione di testo che lancia un'eccezione alla prima esecuzione resta vuota. Vedi <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Quando dovrei usare <code>forceUpdate()</code>?</h3>
      <p>Solo per cambiamenti rari ai valori statici, come il cambio di lingua. Per tutto il resto c'è <code>update()</code>. Vedi <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Come metto una pagina in un layout senza passarla come prop?</h3>
      <p>Segna il punto con <code>region({ id: 'main' })</code> e fai restituire alla pagina <code>into('main', …)</code>. Vedi <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Come smonto un'app?</h3>
      <p>Avvolgila in <code>when()</code> e spegni la condizione. Rimuovere il DOM da solo non esegue <code>onDestroy</code>. Vedi <a href="#lifecycle">Ciclo di vita</a>.</p>

      <h3>Nuclo include un router?</h3>
      <p>Non nel core: il routing è distribuito a parte come <code>nuclo-router</code>, con rendering lato server, idratazione, rotte con suddivisione del codice e precaricamento in idle. Si installa con <code>npm install nuclo nuclo-router</code>. Vedi <a href="#router-overview">nuclo-router</a>.</p>

      <h3>Nuclo ha gli effetti?</h3>
      <p>No. <code>onMount</code> e <code>onDestroy</code> girano una volta per elemento, legati al suo inserimento e alla sua rimozione. Nulla viene rieseguito solo perché uno stato è cambiato.</p>
    `,
      },
    ],
  },

];
