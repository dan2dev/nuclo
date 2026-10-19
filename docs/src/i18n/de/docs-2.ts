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
      <p>Macht aus einem typisierten Style-Objekt fertige CSS-Klassen. Das Ergebnis reichst du einfach an einen beliebigen Tag-Builder weiter. Im Browser sammeln sich die Regeln in einem einzigen <code>&lt;style id="nuclo-styles"&gt;</code>-Element, auf dem Server holst du sie dir mit <a href="#api-css-text"><code>getCssText()</code></a> ab.</p>
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
        <li>Für die Basisdeklarationen entsteht eine Klasse, dazu je eine weitere pro Pseudo-Key, Selektor und Media-Block. Die Card oben kommt deshalb auf zwei Klassen.</li>
        <li>Klassennamen sind Hashes des Inhalts: Gleiche Styles teilen sich eine Klasse, und Server und Client kommen auf dieselben Namen.</li>
        <li>Definiere Styles am besten einmal auf Modulebene. <code>css()</code> cacht pro Objekt. Wer bei jedem Aufruf ein frisches Objekt baut, zahlt jedes Mal für die Verarbeitung.</li>
        <li>Ein Style-Objekt nachträglich zu ändern, bringt nichts. <code>css()</code> hat es dann längst gelesen.</li>
        <li>Jeder Style bleibt registriert, solange die Seite oder der Serverprozess lebt. Für Werte, die pro Element variieren, etwa eine Breite aus Daten, ist das <a href="#attributes"><code>style</code>-Attribut</a> die bessere Wahl.</li>
      </ul>
      <h3>Benannte Styles</h3>
      <p>Willst du lesbare Klassennamen, stell einfach einen Namen voran:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>Die Basisklasse heißt exakt so wie der Name, alle weiteren Blöcke bekommen <code>name-&lt;hash&gt;</code>.</li>
        <li>Der Name muss als Klassenname taugen. Tut er das nicht, gibt Nuclo eine Warnung aus und denkt sich selbst einen aus.</li>
        <li>Namen gelten global. Nehmen zwei verschiedene Styles denselben Namen, warnt Nuclo.</li>
      </ul>
      <h3>Das Ergebnis verwenden</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p>Die Klassennamen bekommst du über <code>String(card)</code> genauso wie über <code>card.className</code>.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Style-Objekte",
        content: `
      <p>Das Objekt für <code>css()</code> besteht aus den gängigen CSS-Eigenschaften in camelCase, ein paar Kurzformen und verschachtelten Keys für Pseudo-Zustände, Selektoren und Media Queries. TypeScript vervollständigt alles davon. Was nicht zur typisierten Menge gehört, etwa <code>borderTopLeftRadius</code>, <code>fill</code> oder <code>paddingInline</code>, wandert in <code>raw</code> (dazu gleich mehr).</p>
      <h3>Werte</h3>
      <ul>
        <li>Zahlen werden zu <code>px</code>. Ausnahmen sind <code>0</code> und Eigenschaften ohne Einheit: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> und <code>gridRow</code>. In <code>raw</code> kommen <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> und <code>animation-iteration-count</code> ebenfalls ohne Einheit aus.</li>
        <li>Strings gehen unverändert durch. <code>null</code>, <code>undefined</code> und <code>false</code> fallen einfach weg.</li>
        <li><code>lineHeight</code> (und <code>leading</code>) kennt keine Einheit: <code>leading: 24</code> heißt also das 24-Fache der Schriftgröße. Für Pixel schreibst du <code>"24px"</code>.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Kurzformen</h3>
      <table>
        <thead><tr><th>Key</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, rundum oder pro Seite</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding horizontal / vertikal</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>das Gleiche für margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width und height samt Minimal- und Maximalwerten</td></tr>
          <tr><td><code>size</code></td><td>width und height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Diese Keys nehmen <code>true</code> als Wert:</p>
      <table>
        <thead><tr><th>Key</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (display bleibt unangetastet)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudo-Zustände</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> und <code>firstLetter</code>. Du kannst sie ineinander verschachteln: <code>hover: { focus: {…} }</code> wird zu <code>:hover:focus</code>.</p>
      <h3>Selektoren und At-Rules</h3>
      <p>Beginnt ein Key mit <code>&amp;</code>, behandelt Nuclo ihn als Selektor und ersetzt jedes <code>&amp;</code> durch die Klasse. Beginnt er mit <code>@</code>, ist es eine At-Rule: <code>@media</code>, <code>@container</code> oder <code>@supports</code>.</p>
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
        <li>Der Key muss mit <code>&amp;</code> anfangen. Etwas wie <code>".dark &amp;"</code> wird ignoriert, nimm stattdessen <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Zwei ineinander verschachtelte <code>@media</code>-Blöcke verknüpft Nuclo mit <code>and</code>. Beginnt eine Query mit einem Medientyp (<code>print</code>, <code>only screen</code>), rückt sie an den Anfang, denn die Grammatik erlaubt einen Typ nur dort. Lässt sich ein Paar nicht zusammenführen, etwa bei zwei Medientypen oder einem führenden <code>not</code>, gibt es eine Warnung, und nur die innere Query bleibt übrig. Jede andere verschachtelte At-Rule ersetzt die äußere.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Mit <code>raw</code> setzt du jede beliebige Eigenschaft, und zwar mit dem Namen, wie er in CSS steht. Zahlen bekommen auch hier <code>px</code>, greif also zu Strings:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Jeder andere flache Key landet in kebab-case und sonst unverändert im CSS. Ein Tippfehler wie <code>colr: 'red'</code> wird so zu einer Deklaration, die der Browser stillschweigend verwirft. Ein verschachteltes Objekt unter einem Key, der weder Pseudo-Zustand noch Screen noch <code>&amp;</code>- oder <code>@</code>-Key ist, wird ignoriert. Beides bemängelt TypeScript.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Führt Styles zusammen. Setzen zwei Eingaben dieselbe Eigenschaft, hat die spätere das letzte Wort.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Falsy-Werte fallen raus, Arrays werden flachgezogen, Strings gesplittet und dedupliziert.</li>
        <li>Generierte Klassen für denselben Block (Basis, gleicher Pseudo-Zustand, gleiche Media Query) verschmelzen zu einer neuen Klasse. Alle anderen Klassennamen reicht <code>cx()</code> unverändert durch.</li>
        <li>Die Reihenfolge der Argumente kennt nur <code>cx()</code>. Bei <code>div(base, blue)</code> hängen beide Klassen am Element, und die zuletzt erzeugte Regel setzt sich durch. Styles, die sich gegenseitig überschreiben sollen, gehören deshalb in einen einzigen <code>cx()</code>-Aufruf.</li>
        <li>Wird der Block eines benannten Styles mit dem einer anderen Eingabe verschmolzen, heißt die neue Klasse <code>name-&lt;hash&gt;</code> und nicht mehr nur so wie der Name. Blöcke, die unberührt bleiben, behalten ihre Klasse: <code>cx(pageTitle, 'extra')</code> enthält weiterhin <code>page-title</code>.</li>
      </ul>
      <h3>Dynamische Klassen</h3>
      <p>Gib eine Funktion mit, die stets <code>cx(...)</code> zurückliefert:</p>
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
      <p>Schon beim ersten Durchlauf muss die Funktion ein Style-Ergebnis liefern. Mit <code>() =&gt; active &amp;&amp; activeButton</code> bekommst du statt einer Klasse den Text „false“ auf die Seite.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Gibt dir eigene Versionen von <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> und <code>globalStyle</code> zurück, fest an ein Theme gebunden. Ein Theme gibt Werten sprechende Namen: Mit dem Theme unten steht hinter <code>borderColor: 'border'</code> der Wert <code>#e5e7eb</code>, und TypeScript vervollständigt die Namen. Jeder Eintrag in <code>screens</code> wird zu einem Style-Key für eine Media Query, etwa <code>md: {…}</code>.</p>
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
        <thead><tr><th>Theme-Key</th><th>Wirkt auf</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> samt aller Seiten, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>zusätzliche Style-Keys, etwa <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Ein Theme-Name wird nur dann aufgelöst, wenn er der ganze Wert ist. <code>border: "1px solid primary"</code> bleibt, wie es ist.</li>
        <li>Ein Screen-Wert ohne <code>@</code> wird zu <code>@media &lt;value&gt;</code>. Beginnt er mit <code>@</code>, übernimmt Nuclo ihn unverändert, zum Beispiel <code>"@container (min-width: 400px)"</code>.</li>
        <li>Screens gibt es nur auf Instanzen aus <code>createCss()</code>. Das globale <code>css()</code> kennt keine, versteht aber <code>@media</code>-Keys.</li>
        <li>Alle Instanzen und die globalen Helper schreiben in dasselbe Stylesheet. Die Media-Regeln der Screens erscheinen in der Reihenfolge, in der du die Screens deklariert hast, nicht in der Reihenfolge ihrer Verwendung. Liste <code>min-width</code>-Screens daher von klein nach groß. Und nimm pro App nur eine <code>createCss()</code>-Instanz, dann gilt auch wirklich die Reihenfolge aus deinem Theme.</li>
        <li>Die Eigenschaft <code>theme</code> am Ergebnis ist genau das Theme, das du übergeben hast.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Baut dir eine Funktion, die zu einer Auswahl von Optionen den passenden Style liefert, zum Beispiel für Intent und Größe eines Buttons.</p>
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
        <li>Die Styles werden in dieser Reihenfolge verschmolzen: zuerst <code>base</code>, dann der gewählte Wert jeder Gruppe, zuletzt jeder passende Compound. Pro Eigenschaft gewinnt, was später kommt.</li>
        <li>Fehlt eine Option oder ist sie <code>undefined</code> oder <code>null</code>, greift der Default. Eine Gruppe ohne Default bleibt außen vor.</li>
        <li>Besteht eine Gruppe nur aus den Keys <code>true</code> und <code>false</code>, übergibst du einen Boolean.</li>
        <li>Ein Compound greift, sobald alle Gruppen, die er aufführt, passen, Defaults eingeschlossen.</li>
        <li>Jede Kombination wird nur einmal gebaut und danach gecacht.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() & globalStyle()",
        content: `
      <p><code>keyframes()</code> registriert eine Animation und liefert ihren generierten Namen. Als Frame-Keys dienen <code>from</code>, <code>to</code> und Prozentwerte wie <code>"50%"</code> oder <code>"0%, 100%"</code>. In den Frames sind nur flache Eigenschaften erlaubt, und identische Frames führen zum selben Namen.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p>Mit <code>globalStyle()</code> hängst du eine Regel an einen beliebigen Selektor:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>Der Selektor wird wörtlich übernommen.</li>
        <li>Es funktionieren nur flache Eigenschaften. Pseudo-Keys, Screens und <code>@</code>-Keys werden ignoriert, Media-Regeln kann <code>globalStyle()</code> also nicht schreiben.</li>
        <li>Eine identische Regel kommt nur einmal ins Stylesheet. Ein abweichender Style für denselben Selektor ergibt eine zweite Regel, und die spätere setzt sich durch.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() & resetStyles()",
        content: `
      <p><code>getCssText()</code> gibt dir alle Regeln zurück, die <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> und <code>globalStyle()</code> in diesem Prozess erzeugt haben: erst die Basisregeln, danach die <code>@media</code>-, <code>@container</code>- und <code>@supports</code>-Blöcke. Gedacht ist es fürs serverseitige Rendering.</p>
      <ul>
        <li>Ruf es nach <code>renderToString()</code> auf, dann sind auch die Regeln dabei, die erst beim Rendern entstanden sind.</li>
        <li>Es deckt den ganzen Prozess ab, nicht nur eine Seite oder einen Request, und es wächst nur. Das ist unkritisch, denn Klassennamen sind Inhalts-Hashes.</li>
        <li>Steck den Text in <code>&lt;style id="nuclo-styles"&gt;</code>. Der Client übernimmt dieses Element und überspringt, was schon drinsteht. Bei einer anderen id oder ganz ohne legt er ein zweites Stylesheet an und schreibt jede Regel noch einmal hinein.</li>
        <li>Der Text wird nicht escaped. Gib also niemals unvertrauenswürdige Eingaben als Style-Werte weiter.</li>
      </ul>
      <p><code>resetStyles()</code> ist ein Helper für Tests. Er entfernt alle Regeln und das <code>#nuclo-styles</code>-Element. Bereits erzeugte Styles behalten ihre Klassennamen, verlieren aber ihr CSS. In einer App oder auf einem Server hat der Aufruf nichts verloren.</p>
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
      <div class="docs-callout"><strong>Eigenes Paket:</strong> <code>nuclo-router</code> gehört nicht zum Nuclo-Kern. Du installierst es zusätzlich zu <code>nuclo</code>. Es ist ein Preview-Release, die API kann sich also noch ändern.</div>
      <p>Routing für Nuclo, mit serverseitigem Rendering, Hydration, Code-Splitting pro Route und Preloading in Leerlaufzeiten. Unter der Haube arbeiten <code>list()</code> und <code>update()</code>. Das Ganze wiegt etwa ${NUCLO_ROUTER_GZIP_KB.replace(".", ",")} KB gzipped, hängt von nichts außer Nuclo ab und hat keine Seiteneffekte. Bleibt es ungenutzt, fliegt es beim Tree-Shaking einfach raus.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Genauso gut geht <code>pnpm add</code>, <code>yarn add</code> oder <code>bun add</code> mit denselben zwei Namen. Als Peer-Dependency braucht der Router <code>nuclo</code> ab Version 0.3.</p>
      <p>Der Router entscheidet, <em>was</em> geladen wird. <em>Wo</em> es erscheint, bestimmt deine App mit <code>router.outlet()</code>: eine <code>list()</code> über den Layer-Stack, eine Zeile pro Layer. Eine gewöhnliche Seite ist damit genau eine Zeile. Server und Client bauen denselben Baum, deshalb übernimmt <code>hydrate()</code> die Knoten vom Server, statt sie zu ersetzen. Mehr steckt nicht dahinter als <code>history</code>, ein delegierter <code>click</code>-Listener und <code>requestIdleCallback</code>.</p>
      <h3>Ein Import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> lädt die Module der passenden Route, bevor es zurückkehrt. Der erste Baum ist daher auf Server und Client von Anfang an vollständig. Danach greift der Router auf die gestartete Route durch: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
      <h3>Eine ganze App</h3>
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
      <p>Mehr Integration gibt es nicht. Links funktionieren, weil ein <code>&lt;a href&gt;</code> einfach ein <code>&lt;a href&gt;</code> bleibt. Ein delegierter Listener auf <code>document</code> fängt die Links ab, die dem Router gehören, alle anderen überlässt er dem Browser.</p>
      <p>Auf dem Server liefert <code>start()</code> pro Request eine eigene <code>Route</code> und fasst den Router selbst nicht an, parallele Requests sehen also nie die Route des jeweils anderen. <code>route.run()</code> macht diese Route für die Dauer des Renderns zu der, die der Router und damit das Outlet liest. Im Browser gibt es pro Seitenaufruf genau eine Route, und <code>start()</code> setzt sie als die des Routers. Ein <code>run()</code> ist dort nicht nötig.</p>
      <p>Eine Seite bekommt ihren <a href="#router-api"><code>RouteContext</code></a> und ihre <a href="#router-api"><code>PageProps</code></a> als <code>(ctx, { layer, data, outlet, beforeLeave })</code> übergeben, und sie darf auch mit weniger Argumenten auskommen. Zurückgeben kann sie alles, was <code>list()</code> versteht. Soll sie nebenbei einen anderen Teil des Layouts füllen, liefert sie zusätzlich ein <code>into()</code>, etwa <code>div(article(…), into('sidebar', nav(…)))</code>. Dieser Inhalt verschwindet zusammen mit der Seite. Mehr dazu unter <a href="#router-regions">Seiten &amp; Regionen</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Patterns & verschachtelte Routen",
        content: `
      <table>
        <thead><tr><th>Pattern</th><th>Passt auf</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>genau diesen Pfad</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>alles, was sonst nirgends passt, also deine 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>Die Rangfolge lautet: erst statische Patterns, dann dynamische in der Reihenfolge ihrer Deklaration, zuletzt Catch-alls, wobei der längste Präfix zuerst drankommt. <code>'*'</code> greift also nur bei dem, was sonst niemand abfängt, und darf an beliebiger Stelle in der Tabelle stehen. Abschließende und doppelte Slashes sowie Prozent-Kodierung werden normalisiert, Param-Werte kommen dekodiert an. Gematcht wird segmentweise pro Pattern, Regexes werden weder gebaut noch ausgeführt.</p>
      <h3>Relative Routen</h3>
      <p>Ein Pattern mit <code>./</code> bezieht sich auf den Parent, der es deklariert, ein href mit <code>./</code> auf die aktive Route. Zusammen ergeben sie einen wiederverwendbaren Abschnitt, der unter jedem Parent dasselbe bedeutet. Der Wert in einer Tabelle ist entweder ein Loader oder eine weitere Tabelle, deren Keys relativ zu ihr gelten:</p>
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
      <p>Diese zwei Zeilen erzeugen alle sechs Patterns, und kein Pfad muss doppelt geschrieben werden. Beide Parents bekommen dieselben Loader-Objekte, teilen sich also einen Modul-Cache und ein <code>import()</code>.</p>
      <ul>
        <li>In einer Kind-Tabelle meinen <code>'./x'</code>, <code>'/x'</code> und <code>'x'</code> alle dasselbe. <code>'/'</code> steht für den Parent-Pfad selbst, und mit <code>'*rest'</code> bekommt der Abschnitt sein eigenes Catch-all. Verschachteln kannst du beliebig tief.</li>
        <li>Top-Level-Keys bleiben, wie sie sind, <code>'*'</code> also <code>'*'</code>.</li>
        <li>Ein Kind unter einem <code>*catch-all</code>-Parent führt zu einem <code>createRouter()</code>-Fehler, denn ein Catch-all muss sein Pattern abschließen.</li>
      </ul>
      <h3>Parent-Seiten und <code>outlet()</code></h3>
      <p>Ein Parent und seine Kinder bilden eine echte Hierarchie: Der Parent rendert, und sein Kind erscheint in ihm, genau dort, wo er <code>outlet()</code> aufruft:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Navigierst du zwischen Kindern, wird der Parent nicht neu gebaut. Sein DOM-Knoten bleibt derselbe, und damit überleben Fokus, Scrollposition, ein halb ausgefülltes Eingabefeld und aller State in seiner Closure.</p>
      <ul>
        <li>Hat eine Seite keine Kind-Route, rendert ihr Outlet einfach nichts, ein Layout kann es also bedenkenlos immer aufrufen. Ein Parent mit Kind, der <code>outlet()</code> nie aufruft, verschluckt das Kind.</li>
        <li>Index-Routen gibt es nicht. <code>'/'</code> ist das Layout selbst: Der Parent-Pfad rendert das Layout mit leerem Outlet, nicht eine eigene Index-Seite darin. Setz den Landing-Inhalt deshalb ins Layout oder gib ihm einen richtigen Kind-Pfad.</li>
      </ul>
      <p>Derselbe Aufruf funktioniert dann unter beiden Parents, auch aus einer Seite heraus, die gar nicht weiß, unter welchem sie hängt:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> und <code>..</code> werden gegen den Pfad der aktuellen Route aufgelöst, nicht gegen das „Verzeichnis“ der URL. Von <code>/invoices/42</code> aus ergibt <code>./preview</code> also <code>/invoices/42/preview</code>, während ein Browser daraus <code>/invoices/preview</code> gemacht hätte. Ein abschließender Slash in der URL ändert daran nichts. <code>../</code> geht ein Segment nach oben und hält an der Wurzel an. Query und Hash reisen mit, <code>base</code> wird wieder vorangestellt, und in die History wandert der aufgelöste absolute Pfad. Diese Abweichung von der normalen URL-Auflösung kennst du von React Router und <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Nur <code>./</code> und <code>../</code> sind routen-relativ. Ein schlichtes <code>preview</code> im href folgt weiterhin den normalen Browserregeln.</li>
        <li>Bau relative Links mit <code>router.href('./preview')</code>, statt <code>href="./preview"</code> von Hand zu schreiben. <code>href()</code> löst beim Rendern auf, das ausgelieferte Markup ist also absolut und bleibt für Crawler, Mittelklick und deaktiviertes JavaScript korrekt.</li>
      </ul>
      <h3>Was bleibt, was neu gebaut wird</h3>
      <table>
        <thead><tr><th>Knoten</th><th>Bei Navigation</th></tr></thead>
        <tbody>
          <tr><td>ein Parent mit unverändertem Pattern und Pfad</td><td><strong>bleibt erhalten</strong>: derselbe Knoten, und sein <code>load()</code> läuft nicht noch einmal</td></tr>
          <tr><td>die passende Seite</td><td><strong>bleibt erhalten</strong>, wenn Pattern und Pfad gleich sind und sie kein <code>load()</code> hat, eine Änderung an Query oder Hash überlebt sie also. Eine Route mit Loader wird bei jedem Besuch aufgefrischt.</td></tr>
          <tr><td>ein Parent, dessen Pfad sich geändert hat</td><td>wird neu gebaut, samt allem darunter</td></tr>
          <tr><td>ein gepushter Layer</td><td>rendert nur die passende Seite. Seine Parents sind in der Zeile darunter ja schon gemountet.</td></tr>
        </tbody>
      </table>
      <p>Eine erhaltene Seite behält den <code>ctx</code>, mit dem sie gebaut wurde. So verhält sich <code>ctx</code> überall: Für Live-Werte liest du <code>router.*</code>. State, der an der Query hängt, etwa Filter, Paginierung und Tabs, liest <code>router.search</code> in einem dynamischen Wert und schreibt mit <code>router.go('?page=2', { replace: true })</code>. Die Seite, ihr Fokus und das halb ausgefüllte Eingabefeld bleiben dabei, wo sie sind.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Seiten & Regionen",
        content: `
      <p><code>router.outlet()</code> setzt die Seite an eine Stelle. Braucht eine Seite zusätzlich eine Sidebar, eine Toolbar oder eine Überschrift woanders im Layout, füllt sie diese Plätze mit <a href="#api-region"><code>into()</code></a>. Das Layout markiert die Stelle mit <code>region()</code>, und die Seite liefert neben ihrem eigenen Inhalt ein <code>into()</code> zurück. Seiteninhalt wird dem Layout also nie als Prop durchgereicht, und eine Navigation baut es nie neu.</p>
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
      <p>Der Seiteninhalt ist eine Zeile in der <code>list()</code> des Outlets, und ein <code>into()</code> lebt genauso lange wie die Zeile, in der es steckt. Der Sidebar-Inhalt kommt also mit der Seite und geht mit ihr: Wer zu einer Seite ohne <code>into('sidebar', …)</code> navigiert, sieht in der Region wieder deren <code>empty</code>-Inhalt. Beide Teile entstehen in derselben Funktion, die Seite kann <code>ctx</code> und <code>data</code> also für beide nutzen.</p>
      <h3>Was bei der Navigation passiert</h3>
      <ul>
        <li><strong>Eine erhaltene Seite behält ihre Regionen.</strong> Ändert sich nur Query oder Hash und <a href="#router-patterns">die Seite bleibt bestehen</a>, bleibt auch der Regionsinhalt unberührt. Hängt die Sidebar davon ab, lies <code>router.search</code> in einem dynamischen Wert.</li>
        <li><strong>Eine neu gebaute Seite füllt sie neu.</strong> Wechselt die Route, verschwindet die alte Zeile, und die <code>into()</code>-Views der neuen Seite rücken nach. Nichts bleibt liegen.</li>
        <li><strong>Ein gepushter Layer legt eine View obenauf.</strong> Der Layer ist eine spätere Zeile des Outlets, sein <code>into()</code> also eine neuere View derselben Region. Mit dem Default <code>type: 'latest'</code> verdeckt sie die View der Seite, bis der Layer schließt, dann taucht die der Seite wieder auf. Mit <code>type: 'stack'</code> sind beide zu sehen.</li>
        <li><strong>Auch eine Parent-Seite kann Regionen füllen.</strong> Ihre Views bleiben stehen, während die Kinder wechseln, denn der Parent wird nicht neu gebaut.</li>
        <li><strong>Serverseitiges Rendering funktioniert ohne Zutun.</strong> Der Server baut die Seite innerhalb von <code>route.run()</code>, ihre <code>into()</code>-Views stehen also im HTML, und <code>hydrate()</code> übernimmt sie.</li>
      </ul>
      <h3>Mehrere Regionen aus einer Seite</h3>
      <p>Mit einem Objekt füllst du mehrere Regionen auf einen Schlag. Der Hauptinhalt der Seite läuft weiter durchs Outlet, gib ihn also zusammen mit dem <code>into()</code> zurück:</p>
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
      <h3>Welches Werkzeug wofür</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> gehört zur Kind-Route: Inhalt, den die URL bestimmt und der innerhalb seiner Parent-Seite gerendert wird. Siehe <a href="#router-patterns">Verschachtelte Routen</a>.</li>
        <li><strong><code>into()</code></strong> ist für die passende Seite, die sich über das Layout verteilt. Der Inhalt gehört zur Seite und nutzt deren Daten.</li>
        <li><strong><code>matches()</code></strong> ist für das Layout, das allein anhand der URL entscheidet, mit einer eigenen kleinen Tabelle und ganz ohne Seite. Siehe <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Das alles hängt an der einen passenden Route. Der Router steuert nicht zwei unabhängige Bereiche aus einer einzigen URL. Eine Sidebar mit eigenen Routen ist darum eine Region, die eine Seite füllt, und kein zweites Outlet. Wer für die Sidebar wirklich einen eigenen Router mit eigenem Laden und eigenem Fallback will, hält einen ungestarteten Router bereit und löst mit <code>match()</code> auf, mehr dazu unter <a href="#router-multi">Mehrere Router &amp; kombiniertes Laden</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Routen-Loader & Code-Splitting",
        content: `
      <p>Ein Seitenmodul kann eine <code>load</code>-Funktion exportieren. Sie läuft bei jeder Navigation zu dieser Route, noch bevor die Seite gebaut wird, und ihr Rückgabewert landet als <code>data</code> bei der Seite:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>An der Routentabelle ändert sich nichts, der Loader gehört zum Seitenmodul. Er bekommt den passenden <code>RouteContext</code>, hat also Zugriff auf <code>params</code>, <code>search</code> und <code>path</code>. Er darf synchron oder asynchron sein und läuft auch auf dem Server. Eine serverseitig gerenderte Seite hat ihre Daten daher schon im HTML und muss nicht erst nach der Hydration fetchen.</p>
      <p><strong>Das Modul wird gecacht, die Daten nicht.</strong> Der Chunk einer Route wird einmal geladen und wiederverwendet, ihr Loader läuft dagegen bei jeder Navigation neu. Darum kann man <code>/blog/a</code> und <code>/blog/b</code> nicht verwechseln, und darum lässt sich ein fehlgeschlagener Loader einfach noch einmal versuchen.</p>
      <table>
        <thead><tr><th>Situation</th><th>Verhalten</th></tr></thead>
        <tbody>
          <tr><td>solange er läuft</td><td><code>router.pending</code> ist true, und die aktuelle Seite bleibt stehen</td></tr>
          <tr><td>er wirft oder sein Promise wird abgelehnt</td><td>der Fehler landet in <code>router.error</code>. Das Promise von <code>go()</code> wird trotzdem nie abgelehnt, und die Navigation lässt sich wiederholen.</td></tr>
          <tr><td>während <code>start()</code></td><td>die Rejection kommt aus <code>start()</code> heraus. Es gibt ja noch keine Route, an der sie hängen könnte.</td></tr>
          <tr><td>ein gepushter Layer</td><td>führt seinen eigenen Loader aus, mit eigenen Daten</td></tr>
          <tr><td>der Idle-Preloader</td><td>lädt nur Module vor. Er hat keinen Kontext, den er übergeben könnte, und würde sonst Daten für eine Route holen, die du womöglich nie öffnest.</td></tr>
          <tr><td>erneute Navigation zur selben URL</td><td>der Loader läuft noch einmal, und die Zeile wird neu gebaut. Eine Route ohne Loader behält ihre Zeile.</td></tr>
        </tbody>
      </table>
      <p>Zum Revalidieren navigierst du einfach dorthin, wo du schon bist, ohne einen neuen History-Eintrag anzulegen:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Daten zusammen mit dem Chunk starten</h3>
      <p>Ein <code>load</code>-Export des Seitenmoduls kann erst laufen, wenn das Modul da ist. Eine kalte Navigation holt also zuerst den Chunk und danach die Daten. Willst du beides parallel anstoßen, deklariere den Loader direkt in der Tabelle mit <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Diese Variante ersetzt das eigene <code>load</code> des Moduls und läuft wie dieses bei jedem Besuch. Eine Rejection, während der Chunk noch lädt, landet wie jede andere in <code>router.error</code>.</p>
      <p>Serverdaten werden bewusst nicht ins HTML serialisiert. Das <code>load</code> des Clients läuft bei der Hydration also noch einmal. Wenn dich das stört, lass den Server <code>route.data</code> ausgeben, zum Beispiel als <code>window.__DATA__</code>, und den Loader diese Daten zuerst verwenden. <code>route.data</code> enthält nur die Daten der passenden Seite, das Ergebnis eines Parent-<code>load()</code> ist nicht dabei.</p>
      <h3>Code-Splitting und Preloading</h3>
      <p>Der Wert einer Route ist immer eine Funktion, die die Seitenkomponente liefert. Geladen wird sie dadurch erst, wenn sie gebraucht wird:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Einen <code>load</code>-Export kann nur eine Variante bereitstellen, die ein Modul zurückgibt. Wer die benannte Komponente mit <code>.then(m =&gt; m.BPage)</code> herauspickt, reicht dem Router nur die Funktion.</p>
      <p>Jedes Modul wird nur einmal importiert und dann gecacht, parallele Navigationen zur selben Route teilen sich ein <code>import()</code>. Lässt der User die Seite <code>idleTimeout</code> lang in Ruhe (standardmäßig eine Sekunde, ohne Taps, Tasten, Mausrad oder Scrollen), lädt der Router die übrigen Routen im Hintergrund nach, eine pro Idle-Slice (<code>requestIdleCallback</code>). Sobald der User wieder etwas eingibt oder auf eine Navigation wartet, pausiert das, bis die Seite erneut zur Ruhe kommt.</p>
      <p>Eine vorgeladene oder direkt verfügbare Route setzt <code>router.pending</code> nie auf true und steht noch vor dem nächsten Paint: kein Spinner-Frame, kein Layout-Shift. <code>router.pending</code> ist nur true, solange ein Modul oder ein Loader wirklich warten muss, und die alte Seite bleibt in dieser Zeit sichtbar. Ein Chunk, der sich nicht laden lässt, taucht als <code>router.error</code> auf und nie als unbehandelte Rejection, und ein neuer Versuch ist jederzeit möglich.</p>
    `,
      },
      {
        id: "router-api",
        title: "Router-API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> ordnet jedem Pattern einen Loader oder eine verschachtelte Tabelle zu. Die Optionen:</p>
      <table>
        <thead><tr><th>Option</th><th>Default</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL-Präfix, unter dem die App ausgeliefert wird, etwa <code>'/docs'</code>. Es greift nur an einer Segmentgrenze: <code>/docs/intro</code> liegt innerhalb von <code>'/docs'</code>, <code>/docsearch</code> nicht. URLs außerhalb passen auf nichts, das Promise von <code>start()</code> wird also abgelehnt (deine serverseitige 404), und Links dorthin überlässt der Router dem Browser.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Lädt die Module der übrigen Routen im Hintergrund, sobald die Seite zur Ruhe kommt. Mit <code>false</code> schaltest du das ab.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Millisekunden ohne Taps, Tasten, Mausrad oder Scrollen, bevor das Preloading startet oder nach User-Aktivität weiterläuft.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, wird im Browser nach jeder abgeschlossenen Navigation aufgerufen, auch nach der ersten, sobald das DOM nachgezogen hat. <code>kind</code> ist <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Zurück, Vorwärts, <code>close()</code>) oder <code>'layer'</code>. Der richtige Ort für <code>document.title</code>, Meta-Tags, Fokus, Scrollen und Analytics. Bei SSR wird er nie aufgerufen.</td></tr>
        </tbody>
      </table>
      <p>Zurückgegeben wird der Router: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> und jedes <code>Route</code>-Member außer <code>run()</code>, durchgereicht an die aktive Route. Im Browser ist das die Route, die das letzte <code>start()</code> geliefert hat, auf dem Server die, deren <code>run()</code> gerade läuft. Liest du Member, ohne dass eine der beiden Bedingungen zutrifft, wird ein Fehler geworfen. Routentabelle, kompilierter Matcher und Modul-Cache hängen am Router und werden auf einem Server deshalb über Requests hinweg geteilt.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Löst <code>url</code> (Default: <code>location.href</code> im Browser) zu den passenden Seitenmodulen auf und liefert ein <code>Promise&lt;Route&gt;</code>. Das Promise wird abgelehnt, wenn nichts passt und die Tabelle keine <code>'*'</code>-Route hat, auf dem Server ist das deine 404. Im Browser macht <code>start()</code> die Route außerdem zur aktiven des Routers, hängt die <code>popstate</code>- und delegierten <code>click</code>-Listener ein und plant das Preloading. Ein zweites <code>start()</code> beendet die vorherige Route von selbst. Auf dem Server fasst es nichts Geteiltes an, rendere also innerhalb von <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Löst eine URL gegen die Tabelle auf, ohne etwas zu laden: kein Import, keine History, keine Listener, keine Route. Zurück kommt ein <code>RouteContext</code> oder <code>null</code>, wenn die URL außerhalb von <code>base</code> liegt, auf kein Pattern passt oder im Browser von einem anderen Origin stammt. Es funktionieren nur absolute URLs, denn für die <code>./</code>-Auflösung braucht es eine aktive Route.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Die Seiten der aktiven Route als <code>list()</code>. Setz es einmal dorthin, wo die Seiten erscheinen sollen. Ein gepushter Layer ist eine spätere Zeile darin. Vor dem Abschluss von <code>start()</code> und nach <code>stop()</code> ist es leer. Auf dem Server rendert es die Route, deren <code>run()</code> gerade läuft.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Rendert die View einer zweiten Tabelle, auf die der Pfad der aktiven Route passt, als <code>list()</code>, die du frei platzieren kannst. Siehe <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Jedes Member außer <code>run()</code> gibt es auch direkt am Router, wo eine App es ausliest.</p>
      <table>
        <thead><tr><th>Member</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>der aktive Match. <code>search</code> ist ein <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> und <code>url</code> sind live.</td></tr>
          <tr><td><code>pending</code></td><td>eine Navigation wartet noch auf ein Modul oder einen Loader</td></tr>
          <tr><td><code>error</code></td><td>der letzte gescheiterte Ladevorgang, die nächste Navigation löscht ihn</td></tr>
          <tr><td><code>data</code></td><td>der Rückgabewert des <code>load()</code> der passenden Seite, damit ein Server ihn serialisieren kann. Der eines Parents gehört nicht dazu.</td></tr>
          <tr><td><code>depth</code></td><td>wie viele Layer auf dem Stack liegen (1 bei einer gewöhnlichen Seite)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>navigiert und lädt bei Bedarf das Modul. Das Promise wird nie abgelehnt: Scheitert das Laden eines Moduls an einer Promise-Ablehnung oder einem geworfenen Fehler, landet der Fehler in <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>öffnet eine Route als neuen Layer obenauf und löst mit dem auf, womit er schließt. Versteht <code>./</code>. Das Promise wird abgelehnt, wenn keine Route passt oder das Laden des Moduls scheitert.</td></tr>
          <tr><td><code>href(path)</code></td><td>stellt einem Pfad <code>base</code> voran, gedacht für <code>a({ href })</code>. Löst <code>./</code> und <code>../</code> gegen die aktive Route auf.</td></tr>
          <tr><td><code>stop()</code></td><td>löst jeden Listener, verwirft offene Layer und leert das Outlet. Idempotent. Eine gestoppte Route antwortet weiter mit ihrem letzten Match, und <code>go()</code> tut nichts.</td></tr>
          <tr><td><code>run(fn)</code></td><td>ruft <code>fn</code> auf, während diese Route die aktive des Routers ist, und gibt das Ergebnis zurück: auf dem Server <code>route.run(() =&gt; renderToString(App))</code>. Nur synchron. Sobald <code>fn</code> zurückkehrt, ist die Route nicht mehr aktiv.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Das erste Argument einer Seite: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. Es ist der Kontext, mit dem die Seite gebaut wurde. Live-Werte liest du über <code>router.*</code>. Die beiden weichen nur voneinander ab, wenn sich Query oder Hash geändert haben, ohne dass die Seite neu gebaut wurde.</p>
      <p><code>params</code> ist standardmäßig <code>{ [name]: string }</code>. Eine Seite kann es mit <code>Params</code> aus ihrem eigenen Pattern typisieren, das aus <code>'/blog/:slug'</code> ein <code>{ slug: string }</code> macht und aus <code>'/files/*rest'</code> ein <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>Das zweite Argument einer Seite. Destrukturiere einfach, was die Seite braucht.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>an welcher Stelle im Stack die Seite sitzt. Siehe <code>Layer</code> unten.</td></tr>
          <tr><td><code>data</code></td><td>der Rückgabewert des <code>load()</code> der Route, oder <code>undefined</code>, wenn es keines gibt. Typisiert über <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>die Stelle, an der eine Parent-Seite ihre Kind-Route rendert. Siehe <a href="#router-patterns">Verschachtelte Routen</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>registriert einen Guard, der gefragt wird, bevor die Seite verworfen wird. Siehe <a href="#router-layers">Leave-Guards</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Wo eine Seite im Stack sitzt und wie sie wieder rauskommt.</p>
      <table>
        <thead><tr><th>Member</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 für die Basisseite, 1 und mehr für gepushte Layer</td></tr>
          <tr><td><code>push(href)</code></td><td>öffnet aus einer Seite heraus einen weiteren Layer, genau wie <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>schließt diesen Layer samt allem darüber und löst das <code>push()</code> auf, das ihn geöffnet hat. Ohne Argument gilt er als verworfen. Bei Tiefe 0 ein No-op.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> und <code>withLoad()</code></h3>
      <p><code>DataLoader</code> ist <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, der optionale <code>load</code>-Export eines Seitenmoduls. <code>withLoad(loader, load)</code> baut eine Route, deren <code>load</code> parallel zum Import ihres Chunks startet statt erst danach. Siehe <a href="#router-loaders">Routen-Loader</a>.</p>
      <h3>Typen</h3>
      <p>Jeder Typ ist ein benannter Export von <code>nuclo-router</code>. Seiten, Loader und Guards lassen sich also typisieren, ohne dass du irgendwo über einen Pfad importieren musst.</p>
      <table>
        <thead><tr><th>Typ</th><th>Was es ist</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>das params-Objekt zu einem Pattern. <code>RouteParams</code> ist die untypisierte Variante, <code>Match</code> das Ergebnis des Matchers.</td></tr>
          <tr><td><code>PageComponent</code></td><td>eine Seite: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>ein Seitenmodul: entweder die Komponente selbst oder <code>{ default, load? }</code>, so wie <code>import()</code> es liefert</td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, optional mit einem <code>load</code> aus <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>die Tabelle, die <code>createRouter()</code> erwartet: Patterns, zugeordnet zu Loadern oder zu einer verschachtelten Tabelle</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, das zweite Argument von <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, das zweite Argument von <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>der Typ von <code>outlet()</code> aus <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, das, was <code>beforeLeave()</code> entgegennimmt</td></tr>
          <tr><td><code>MatchView</code></td><td>die Form einer <code>matches()</code>-View: params rein, Inhalt oder <code>import()</code> einer Seite raus</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Layer & Leave-Guards",
        content: `
      <p><code>push()</code> öffnet eine Route über der aktuellen, statt sie zu ersetzen, und löst mit dem auf, womit der Layer schließt. Die Seiten sind eine einzige <code>list()</code> über den Stack, einen Layer zu öffnen heißt also schlicht, eine Zeile anzuhängen. Die Seite darunter wird nicht neu gerendert: DOM, Fokus und das halb ausgefüllte Formular sind noch da, wenn der Layer wieder zugeht.</p>
      <p>So klappt der Ablauf „Ich brauche einen Datensatz, den es noch nicht gibt“, ohne dass das Formular verloren geht, das der User gerade ausfüllt:</p>
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
      <p>Layer lassen sich verschachteln. Braucht ein Dialog einen weiteren Dialog, ruft er <code>layer.push()</code> auf und wartet per await aufs Ergebnis. Eine Referenz auf die Route ist dafür nicht nötig.</p>
      <ul>
        <li><strong>Die URL ist der oberste Layer.</strong> <code>push()</code> legt einen History-Eintrag an, ein Layer ist also verlinkbar. Zurück schließt ihn und löst sein <code>push()</code> als verworfen auf, genau wie Abbrechen. Zurück und <code>close()</code> laufen über denselben Codepfad: <code>close()</code> merkt sich sein Ergebnis und geht in der History zurück, maßgeblich ist dabei die Tiefe in <code>history.state</code>. Browser behalten etwa 50 Einträge pro Tab, nach einem langen Weg durch Layer kann der Eintrag darunter also fehlen. Dann schließt <code>close()</code> die Layer an Ort und Stelle und überschreibt den aktuellen Eintrag mit der Seite, die sichtbar bleibt.</li>
        <li><strong>Eine gewöhnliche Navigation leert den Stack.</strong> Ein Link-Klick oder <code>go()</code> ist kein Layer. Er ersetzt alles und verwirft jeden offenen Layer, kein Aufrufer bleibt also ewig im Warten hängen.</li>
        <li><strong>Beim direkten Aufruf entsteht eine eigenständige Seite.</strong> Die URL benennt den obersten Layer, nicht den Stack darunter. Öffnest du die URL eines Layers direkt, wird er bei Tiefe 1 mit <code>layer.depth === 0</code> und einem wirkungslosen <code>close()</code> gerendert. Eine gepushte Route muss deshalb auch für sich allein Sinn ergeben. Prüfe <code>layer.depth</code>, um statt eines toten Abbrechen-Buttons einen Link nach draußen anzubieten.</li>
        <li><strong>Das Promise überlebt keinen Reload</strong>, denn es lebt in einer Closure. Behandle das Ergebnis als Abkürzung durch einen Ablauf, der auch auf dem langen Weg funktioniert.</li>
        <li><strong>Nichts bleibt hängen.</strong> <code>stop()</code> verwirft jeden offenen Layer, und ein Layer, den eine Navigation aufgibt, wird mit <code>undefined</code> aufgelöst.</li>
      </ul>
      <h3>Leave-Guards</h3>
      <p>Eine Seite mit Daten, die nicht verloren gehen sollen, etwa einem halb ausgefüllten Formular, registriert einen Guard. Er wird gefragt, bevor die Seite verworfen wird, und mit <code>false</code> (oder einem Promise darauf) bleibt die Seite stehen:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Nur beim Verlassen der Seite.</strong> Eine Kind-Navigation unter einem Layout oder eine Änderung an Query oder Hash, bei der die Seite bleibt, löst keine Rückfrage aus. Ein Guard lebt und stirbt mit seiner Seite, abmelden musst du ihn also nie.</li>
        <li><strong>Jeder Weg hinaus.</strong> Ein Link, <code>go()</code>, Zurück und Vorwärts, das <code>close()</code> eines Layers und <code>go()</code> zu einer URL, die dem Router nicht gehört (die App verlassen, <code>to</code> ist dann <code>null</code>). Ein abgelehntes Zurück oder Vorwärts wird rückgängig gemacht, die Adressleiste bleibt also bei der Seite. Tab schließen oder Reload ist Sache von <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> ist der <code>RouteContext</code>, zu dem die Navigation führt. Guards laufen von innen nach außen und stoppen bei der ersten Ablehnung. Wirft ein Guard einen Fehler, bleibt die Seite stehen. Auch <code>close(result)</code> läuft durch den Guard, setz dein Flag also zurück, bevor du mit einem Ergebnis schließt.</li>
        <li>Der Router kann nur in History-Einträge zurückgehen, die er selbst geschrieben hat. Bei einem Zurück oder Vorwärts auf einen fremden Eintrag, etwa einen nativen <code>#fragment</code>-Link oder das <code>pushState</code> eines anderen Skripts, fragt er nicht nach.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() & Sub-Router",
        content: `
      <p><code>router.outlet()</code> rendert die Seite. <code>router.matches(table)</code> rendert dagegen alles, was davon abhängt, wo du gerade bist, etwa eine Sidebar, Breadcrumbs oder eine Toolbar. Es nutzt dafür eine eigene kleine Tabelle, lädt keine Route und fügt keine Seite hinzu:</p>
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
        <li><strong>Dasselbe Matching wie die Routentabelle.</strong> Patterns, Priorität, Raw-Path-Matching und das Entfernen von <code>base</code> stammen vom Router, View und Seite sind sich über die URL also immer einig. Gelesen wird der Pfad des obersten Layers, genau wie bei <code>router.path</code>.</li>
        <li><strong>Eine View</strong> ist <code>(params, ctx) =&gt; content</code>. Dabei ist <code>params</code> aus ihrem Pattern typisiert, und <code>ctx</code> ist der <code>RouteContext</code> mit <code>pattern</code> und <code>params</code> der View. Statt Inhalt darf sie auch das <code>import()</code> eines Seitenmoduls zurückgeben, das mit <code>ctx</code> aufgerufen wird, sobald es da ist.</li>
        <li><strong>Passt nichts, wird nichts gerendert.</strong> Ergänze eine <code>'*'</code>-View als Fallback. Vor <code>start()</code> und nach <code>stop()</code> ist es leer, wie das Outlet.</li>
        <li><strong>Neu gerendert wird nur, wenn sich die Route ändert.</strong> Eine View behält ihr DOM also über alles hinweg, was auch die Seite behält.</li>
        <li><strong>Eine lazy View rendert nichts, bis ihr Modul angekommen ist.</strong> Ein fehlgeschlagenes <code>import()</code> landet in <code>console.error</code>, setzt <code>router.error</code> nicht und wird bei der nächsten Navigation noch einmal versucht. Ein bloßes <code>update()</code> löst keinen neuen Versuch aus.</li>
        <li><strong>Auf dem Server</strong> liefert eine lazy View nichts, denn ihr Modul trifft erst auf dem Client ein. Alles, was schon im ersten HTML stehen muss, gehört in eine synchrone View.</li>
      </ul>
      <h3>Sub-Router</h3>
      <p>Routen lassen sich verschachteln, ein Sub-Router ist daher meist schlicht eine verschachtelte Tabelle. Dann gibt es nur einen Router: Die <code>'/'</code>-Seite des Abschnitts ist sein Rahmen, und seine Kinder rendern im <code>outlet()</code> dieser Seite. Der Rahmen übersteht damit jede Navigation innerhalb des Abschnitts:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Alternativ bekommt das Feature einen eigenen Router, der erzeugt, aber nie gestartet wird. Der Parent hält nur einen einzigen Catch-all-Eintrag, und das Kind löst den Rest gegen seine eigenen Patterns, Params und seinen eigenen Fallback auf:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Entscheidend ist, diesen Router nie zu starten. <code>start()</code> hängt die Listener ein, und zwei gestartete Router kommen sich in die Quere. Der Preis: Der untergeordnete Router übernimmt nur die Auflösung, Routen-Loader, die ein gestarteter Router ausführen würde, musst du selbst aufrufen. Außerdem baut diese Variante die Shell neu, sobald sich der Rest ändert, denn der Router sieht nur eine Route, und die Shell löst den Rest selbst auf. Nur eine verschachtelte Tabelle gibt dir einen Parent, den der Router gemountet hält. Zieh sie deshalb vor, es sei denn, das Feature braucht wirklich einen eigenen Router mit eigener base und eigenem Fallback.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Mehrere Router & kombiniertes Laden",
        content: `
      <p>Eine App darf so viele Router haben, wie sie Bereiche hat. Die Regel, die das einfach hält: <strong>Starte pro Dokument genau einen</strong> und lass jeden weiteren Router, der URLs per <code>match()</code> auflöst, ungestartet. Nur der gestartete Router besitzt URL, History und den Click-Listener. Die anderen sind Tabellen, die du bei Bedarf befragst, und jeder Bereich kann unabhängig laden, mit eigenem Spinner.</p>
      <h3>Kombiniertes Laden: eine Kette von Loadern</h3>
      <p>Jede Seite in einer passenden Kette darf <code>load()</code> exportieren. Bei einer kalten Navigation zu einer Kind-Route laufen der Loader des Layouts und der Loader der Seite <strong>parallel</strong>, und ein einziges <code>router.pending</code> deckt die ganze Kette ab. Die vorherige Seite bleibt sichtbar, bis beide fertig sind, ein halb geladener Baum wird also nie gezeichnet. Jede Komponente bekommt ihre eigenen <code>data</code>:</p>
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
      <p>Beide Loader starten gemeinsam und nicht nacheinander. <code>router.pending</code> ist true, solange noch einer von beiden läuft, und sonst false. Eine vorgeladene oder direkt verfügbare Route setzt es nie auf true. Beim Wechsel zwischen Sections bleibt das Layout bestehen, es läuft also nur der Loader der Section noch einmal. Die Daten des Layouts, sein DOM und ein halb ausgefülltes Eingabefeld überleben. Navigierst du erneut zur selben URL, läuft der Loader des Blatts wieder, und dessen Zeile wird neu gebaut, genau wie bei einer einzelnen Seite.</p>
      <h3>Mehrfaches Laden: ein zweiter Router mit eigenem Spinner</h3>
      <p>Ein unabhängiger Bereich, etwa eine Sidebar, ein Tray oder eine Live-Region, bekommt einen eigenen Router, der erzeugt, aber nie gestartet wird, plus ein eigenes Lade-Flag. <code>router.pending</code> gehört dem gestarteten Router und sagt nichts über diesen Bereich aus. Beide können also nebeneinander laden, und jeder darf zuerst fertig sein:</p>
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
      <p>Der zweite Router wird nur gefragt und bekommt nie Anweisungen: <code>match()</code> liest die URL und liefert einen Kontext, und nichts über die Sidebar landet je in der Haupt-Routentabelle. <code>onNavigate</code> läuft nach jeder abgeschlossenen Navigation, auch nach der ersten, und ist damit die eine Stelle, an der ein unabhängiger Bereich mit der URL synchron bleibt.</p>
      <ul>
        <li><strong><code>pending</code> gehört dem gestarteten Router.</strong> Ein nie gestarteter Router hat keine Route, kein <code>pending</code> und kein <code>error</code>. Der Bereich führt seine eigenen Flags, und ein zweiter Spinner kann neben dem ersten sitzen. In der Demo lädt die Sidebar 800 ms, während die Loader der Route 900 ms brauchen. Die Seite kann also vor der Sidebar fertig sein oder umgekehrt.</li>
        <li><strong><code>match()</code> hängt nichts ein.</strong> Beliebig viele ungestartete Router können sich ein Dokument teilen, jeder mit eigener Tabelle, eigener base und eigenem Modul-Cache, und keiner fasst die History an. Sie kosten eine Tabelle und einen Matcher.</li>
        <li><strong>Seine Loader laufen nie.</strong> Der gestartete Router führt das <code>load()</code> der Seiten aus, auf die er passt. Ein nie gestarteter Router löst nur auf. Brauchen seine Views Daten, holst du sie selbst, so wie das <code>refreshSidebar()</code> der Demo. Willst du Loader, nimm eine <a href="#router-matches">verschachtelte Tabelle</a> oder eine <a href="#router-regions">Region, die eine Seite füllt</a>: Dann bleibt diese Aufgabe beim gestarteten Router.</li>
        <li><strong>Schütz dich vor veralteten Antworten.</strong> Ein langsamer Sidebar-Fetch darf nicht auf der Section landen, von der du längst weg navigiert bist. Zähl pro Refresh einen Generationszähler hoch und verwirf Antworten, die nicht mehr passen, so wie der Router selbst überholte Navigationen zurückzieht.</li>
        <li><strong>Auch eine lazy <code>matches()</code>-View hat kein <code>pending</code>.</strong> Sie rendert nichts, bis ihr Modul eintrifft. Das ergibt drei Ladesysteme mit drei unabhängigen Uhren: das <code>pending</code> der Route, deine eigenen Flags und eine lazy View, die schlicht noch nicht da ist.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Link-Handling",
        content: `
      <p>Der delegierte Listener navigiert bei einem Linksklick auf ein <code>&lt;a href&gt;</code>, auch auf ein SVG-<code>&lt;a&gt;</code> oder auf alles, was darin steckt. Bei allem anderen hält er sich raus: Klicks mit Modifier-Taste und Mittelklicks, ein <code>target</code> ungleich <code>_self</code>, <code>download</code>, <code>rel="external"</code>, Cross-Origin-hrefs, reine Hash-Links auf der aktuellen Seite, Pfade außerhalb von <code>base</code>, Pfade ohne passende Route (eine servergerenderte 404 bleibt also erreichbar) und jedes Event, bei dem ein App-Handler schon <code>preventDefault()</code> aufgerufen hat. Einen einzelnen Link nimmst du explizit mit <code>data-nuclo-router="off"</code> aus.</p>
      <h3>Scrollen</h3>
      <p>Eine gepushte Navigation behält die aktuelle Scrollposition. Hat die neue URL einen <code>#hash</code>, der zu einem Element der Seite passt, scrollt der Router dieses Element in den sichtbaren Bereich. Bei <code>popstate</code> übernimmt der Browser das Scrollen. Sollen neue Seiten oben beginnen, nimm <code>onNavigate</code>, denn es verrät dir, wie die Navigation zustande kam:</p>
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
      <h3>Hinweise</h3>
      <ul>
        <li><strong>Nichts wird festgehalten.</strong> Die Route hält die Seitenfunktion und ihren Kontext, nie DOM. Wer wegnavigiert, gibt die vorherige Seite frei. <code>stop()</code> löst die Listener, bricht jeden laufenden Ladevorgang ab und setzt <code>pending</code> zurück, eine gestoppte Route lässt also nie einen Spinner hängen. Ein Modul, das erst nach <code>stop()</code> eintrifft, wird stillschweigend verworfen.</li>
        <li><strong>Sicher bei parallelen Serveranfragen.</strong> <code>start()</code> liefert State pro Request, und <code>run()</code> beschränkt ihn auf einen synchronen Render. Verschränkte Requests sehen also nie die Route des jeweils anderen, geteilt wird nur der Modul-Cache. Der Scope endet, sobald die Funktion in <code>run()</code> zurückkehrt. <code>renderToString()</code> ist synchron, das reicht also. Ein asynchroner oder streamender Render müsste die Route über <code>await</code>s hinweg mitführen, und das tut <code>run()</code> nicht.</li>
        <li><strong>Die Scroll-Wiederherstellung bei <code>popstate</code></strong> übernimmt der Browser (<code>scrollRestoration</code>), nicht der Router.</li>
        <li><strong>Starte einen Router pro Dokument.</strong> Jedes <code>start()</code> hängt einen eigenen delegierten <code>click</code>-Listener ein, und das <code>start()</code> eines zweiten Routers stoppt den ersten nicht. Das tut nur ein zweites <code>start()</code> auf demselben Router. Willst du eine URL gegen eine andere Tabelle auflösen, erzeuge einen Router und ruf nur <code>match()</code> auf. Das hängt nichts ein. So kann ein unabhängiger Bereich sein eigenes Laden neben dem <code>pending</code> der Route betreiben. Siehe <a href="#router-multi">Mehrere Router &amp; kombiniertes Laden</a>.</li>
        <li><strong>Bewusst nicht enthalten:</strong> Hash- und Memory-History, weil die Route im Pathname lebt und ein Server jede Route ausliefern muss. Ebenso zwei unabhängig geroutete Bereiche aus einer URL: Eine Seite kann mit <code>into()</code> zwar mehrere Regionen füllen, aber alle gehören zu der einen passenden Route. Ein unabhängiger Bereich darf trotzdem seinen eigenen ungestarteten Router und sein eigenes Laden behalten, wie in <a href="#router-multi">Mehrere Router &amp; kombiniertes Laden</a> beschrieben. Und schließlich Hover-Preloading, das du bekommst, indem du den Loader der Route aus einem <code>mouseenter</code> heraus aufrufst.</li>
      </ul>
      <h3>Beispiele</h3>
      <p>Zwei lauffähige Beispiele im Repository ergänzen sich so, dass sich jede Einstellung irgendwo beobachten lässt:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: eine clientseitige Tour durch die gesamte API. Jede Pattern-Form und Prioritätsregel, die Opt-outs des Link-Handlings, jedes Route-Member mit Live-Bedienelementen, ein Sub-Router, ein Layer-Stack mit drei Ebenen, ein relativer Abschnitt unter zwei Parents und Routen-Loader mit <code>pending</code> und <code>error</code>. Mit <code>preload: false</code>, damit diese Zustände sichtbar bleiben.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> pro Request, Hydration, die nachweislich die Knoten des Servers übernimmt, echte 404-Statuscodes, eine base ungleich Wurzel, Idle-Preloading, das du im Netzwerk-Panel verfolgen kannst, und ein Loader, dessen Daten vom Server zum Client wandern, damit die Hydration nicht noch einmal fetcht.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "Muster",
    sections: [
      {
        id: "computed",
        title: "Berechnete Werte",
        content: `
      <p>Eine Computed-API gibt es in Nuclo nicht, und du brauchst auch keine. Eine ganz normale Funktion, aus dynamischen Werten aufgerufen, erledigt den Job:</p>
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
        title: "Async & Laden",
        content: `
      <p>Schreib einfach <code>async</code>/<code>await</code> und ruf <code>update()</code> auf, sobald sich der State ändert. Bei einem Fetch heißt das: einmal vor dem <code>await</code> und einmal danach:</p>
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
        title: "Bewährte Vorgehensweisen",
        content: `
      <ul>
        <li><strong>Änderungen bündeln.</strong> Setz erst den ganzen nötigen State und ruf dann <code>update()</code> nur einmal auf.</li>
        <li><strong>Dynamische Werte schlank und seiteneffektfrei halten.</strong> Sie laufen bei jedem <code>update()</code> allesamt durch.</li>
        <li><strong>Greif zu <code>scope()</code></strong> bei kleinen, häufigen Updates, etwa beim Tippen oder bei Timern.</li>
        <li><strong>Ins Dokument rendern.</strong> Knoten, die beim <code>update()</code> nicht im Dokument hängen, werden nicht mehr aktualisiert.</li>
        <li><strong>Für Kinder, die sich ändern, nimm <code>when()</code> und <code>list()</code></strong> statt einer Funktion, die Knoten zurückgibt.</li>
        <li><strong>Schreib <code>className</code>, nicht <code>class</code></strong>, und nutze <code>() =&gt; cx(...)</code> oder <code>{ className: () =&gt; … }</code> für dynamische Klassen.</li>
        <li><strong>Styles nur einmal definieren</strong>, auf Modulebene.</li>
        <li><strong>Serverseitiges Rendering:</strong> erst rendern, dann <code>getCssText()</code> in <code>&lt;style id="nuclo-styles"&gt;</code> packen. Request-Daten als Argumente durchreichen und die HTML-Kommentare in der Ausgabe stehen lassen.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "Referenz",
    sections: [
      {
        id: "api-index",
        title: "API-Index",
        content: `
      <p>Jede öffentliche Funktion und wo sie herkommt, auf einen Blick.</p>
      <h3><code>nuclo</code> (global und benannter Export)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: führt alle dynamischen Werte aus, oder nur die in den angegebenen Scopes.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: gibt einem Element Scope-IDs für <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: bedingter Inhalt, mit <code>.when()</code> und <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: eine Zeile pro Element, zugeordnet über Identität.</li>
        <li><a href="#api-region"><code>region(options)</code></a> und <a href="#api-region"><code>into(id, ...content)</code></a>: eine benannte Stelle im Baum und Inhalt, der sie von überall aus füllt.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: ein Event-Listener, oder <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: baut den Baum und hängt ihn ein.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: übernimmt das HTML vom Server.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: ruft Komponenten erneut auf und patcht das DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: generierte Klassen aus einem Style-Objekt.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: führt Styles zusammen, der spätere gewinnt.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: an ein Theme gebundene Versionen von <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> und <code>globalStyle</code>.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: Styles aus Optionen.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> und <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (nur benannter Export)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> und <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> und <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">Ein reiner Side-Effect-Import</a>, dazu <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> und die <code>Nuclo*</code>-Klassen.</li>
      </ul>
      <h3><code>nuclo-router</code> (eigenes Paket)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: der Router, mit <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> und <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: eine Route, deren Daten-Loader parallel zu ihrem Chunk startet.</li>
        <li><a href="#router-api">Typen</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> und mehr.</li>
      </ul>
      <h3>Nur global</h3>
      <ul>
        <li><a href="#tag-builders">175 Tag-Builder</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, sowie <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Typen</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> und mehr. Styling-Typen wie <code>StyleResult</code> kannst du auch aus <code>'nuclo'</code> importieren.</li>
      </ul>
      <h3>Spezielle Keys</h3>
      <ul>
        <li><a href="#attributes">Attribute</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code>-Handler</a>, <a href="#lifecycle"><code>onMount</code> und <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Style-Objekte</a>: Kurzformen, Pseudo-Zustände, <code>&amp;</code>-Selektoren, <code>@</code>-Regeln und <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Häufig gestellte Fragen",
        content: `
      <h3>Aktualisiert sich die UI, wenn ich State ändere?</h3>
      <p>Nein. Das DOM bleibt, wie es ist, bis du <code>update()</code> aufrufst.</p>

      <h3>Setzt Nuclo auf Signals, Proxies oder ein Virtual DOM?</h3>
      <p>Nein. State bleibt ganz normales JavaScript. Beim Rendern eines Baums erzeugt Nuclo echte Elemente und Textknoten. <code>update()</code> führt jeden registrierten dynamischen Wert aus, oder nur die innerhalb der angegebenen Scopes, und patcht genau die Knoten, deren Wert sich geändert hat. Es gibt keinen Abhängigkeitsgraphen und keinen virtuellen Baum.</p>

      <h3>Warum steht auf meiner Seite „false“?</h3>
      <p>Booleans werden als Text gerendert. <code>div(ok &amp;&amp; span('Done'))</code> zeigt deshalb „false“. Für Kinder nimmst du <code>when(() =&gt; ok, span('Done'))</code>, für Text <code>ok ? 'Done' : ''</code>.</p>

      <h3>Warum ändert sich meine Listenzeile nicht, wenn ich den Eintrag bearbeite?</h3>
      <p>Zeilen zu Einträgen, die noch in der Liste sind, bleiben bestehen und werden nicht neu gerendert. Für Felder, die sich ändern, brauchst du dynamische Werte wie <code>() =&gt; todo.text</code>. Siehe <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Warum aktualisiert sich ein Teil meiner UI nicht mehr?</h3>
      <p>Meistens hing er beim <code>update()</code> nicht im Dokument. Nuclo hört dann auf, diese Knoten zu verfolgen, selbst wenn du sie später anhängst. Rendere deshalb in einen Container, der schon im Dokument steckt. Zwei weitere Ursachen: Ein <code>when()</code>, dessen Bedingung wirft, aktualisiert sich nicht mehr, und eine Textfunktion, die gleich beim ersten Durchlauf wirft, bleibt leer. Siehe <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Wann brauche ich <code>forceUpdate()</code>?</h3>
      <p>Nur für seltene Änderungen an statischen Werten, etwa bei einem Sprachwechsel. Für alles andere ist <code>update()</code> das Richtige. Siehe <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Wie bekomme ich eine Seite in ein Layout, ohne sie als Prop durchzureichen?</h3>
      <p>Markiere die Stelle mit <code>region({ id: 'main' })</code> und lass die Seite <code>into('main', …)</code> zurückgeben. Siehe <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Wie unmounte ich eine App?</h3>
      <p>Pack sie in ein <code>when()</code> und schalte die Bedingung aus. Entfernst du das DOM selbst, läuft <code>onDestroy</code> nicht. Siehe <a href="#lifecycle">Lifecycle</a>.</p>

      <h3>Hat Nuclo einen Router?</h3>
      <p>Nicht im Kernpaket. Routing gibt es separat als <code>nuclo-router</code>, mit serverseitigem Rendering, Hydration, Code-Splitting pro Route und Idle-Preloading. Installieren kannst du es mit <code>npm install nuclo nuclo-router</code>. Siehe <a href="#router-overview">nuclo-router</a>.</p>

      <h3>Gibt es Effects in Nuclo?</h3>
      <p>Nein. <code>onMount</code> und <code>onDestroy</code> laufen einmal pro Element, gekoppelt ans Einfügen und Entfernen. Dass sich irgendein State geändert hat, löst nichts erneut aus.</p>
    `,
      },
    ],
  },

];
