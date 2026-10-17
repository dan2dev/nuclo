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
      <p>Wandelt ein typisiertes Style-Objekt in generierte CSS-Klassen um. Übergib das Ergebnis an einen beliebigen Tag-Builder. Im Browser landen die Regeln in einem einzigen <code>&lt;style id="nuclo-styles"&gt;</code>-Element. Auf dem Server liefert <a href="#api-css-text"><code>getCssText()</code></a> sie zurück.</p>
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
        <li><code>css()</code> erzeugt eine Klasse für die Basisdeklarationen plus eine Klasse für jeden Pseudo-Key, Selektor und Media-Block. Die Card oben bekommt zwei Klassen.</li>
        <li>Klassennamen sind Hashes des Inhalts. Identische Styles teilen sich eine Klasse, und Server und Client erzeugen dieselben Namen.</li>
        <li>Definiere Styles einmal, auf Modulebene. <code>css()</code> cacht pro Objekt, ein neues Objekt bei jedem Aufruf wird also jedes Mal neu verarbeitet.</li>
        <li>Ein Style-Objekt nach der Übergabe an <code>css()</code> zu ändern, hat keine Wirkung.</li>
        <li>Jeder Style bleibt für die Lebensdauer der Seite oder des Serverprozesses registriert. Für Werte, die sich pro Element ändern, etwa eine Breite aus Daten, nimm das <a href="#attributes"><code>style</code>-Attribut</a>.</li>
      </ul>
      <h3>Benannte Styles</h3>
      <p>Übergib zuerst einen Namen, um einen lesbaren Klassennamen zu erhalten:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>Die Basisklasse ist genau der Name. Weitere Blöcke erhalten <code>name-&lt;hash&gt;</code>.</li>
        <li>Der Name muss ein gültiger Klassenname sein. Andernfalls warnt Nuclo und generiert einen.</li>
        <li>Namen sind global. Verwenden zwei unterschiedliche Styles denselben Namen, warnt Nuclo.</li>
      </ul>
      <h3>Das Ergebnis verwenden</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> und <code>card.className</code> liefern beide die Klassennamen.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Style-Objekte",
        content: `
      <p>Das Objekt, das du an <code>css()</code> übergibst, verwendet gängige CSS-Eigenschaften in camelCase, eine Reihe von Kurzformen und verschachtelte Keys für Pseudo-Zustände, Selektoren und Media Queries. TypeScript vervollständigt sie alle. Eigenschaften außerhalb der typisierten Menge, etwa <code>borderTopLeftRadius</code>, <code>fill</code> oder <code>paddingInline</code>, gehören in <code>raw</code> (siehe unten).</p>
      <h3>Werte</h3>
      <ul>
        <li>Zahlen werden zu <code>px</code>, außer <code>0</code> und einheitenlose Eigenschaften: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> und <code>gridRow</code>. In <code>raw</code> sind auch <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> und <code>animation-iteration-count</code> einheitenlos.</li>
        <li>Strings werden unverändert übernommen. <code>null</code>, <code>undefined</code> und <code>false</code> werden übersprungen.</li>
        <li><code>lineHeight</code> (und <code>leading</code>) ist einheitenlos, <code>leading: 24</code> bedeutet also das 24-Fache der Schriftgröße. Schreib <code>"24px"</code> für Pixel.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Kurzformen</h3>
      <table>
        <thead><tr><th>Key</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding für alle oder einzelne Seiten</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding links und rechts / oben und unten</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>dasselbe für margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height sowie deren min und max</td></tr>
          <tr><td><code>size</code></td><td>width und height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Diese Schlüssel akzeptieren <code>true</code>:</p>
      <table>
        <thead><tr><th>Key</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (setzt display nicht)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudo-Zustände</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> und <code>firstLetter</code>. Sie lassen sich verschachteln: <code>hover: { focus: {…} }</code> ergibt <code>:hover:focus</code>.</p>
      <h3>Selektoren und At-Rules</h3>
      <p>Ein Key, der mit <code>&amp;</code> beginnt, ist ein Selektor, und jedes <code>&amp;</code> wird zur Klasse. Ein Key, der mit <code>@</code> beginnt, ist eine At-Rule: <code>@media</code>, <code>@container</code> oder <code>@supports</code>.</p>
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
        <li>Der Key muss mit <code>&amp;</code> beginnen. Ein Key wie <code>".dark &amp;"</code> wird ignoriert, schreib also <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Zwei verschachtelte <code>@media</code>-Blöcke werden mit <code>and</code> kombiniert. Eine Query, die mit einem Medientyp beginnt (<code>print</code>, <code>only screen</code>), kommt an den Anfang, weil die Grammatik einen Typ nur dort erlaubt. Ein Paar, das sich nicht zusammenführen lässt — zwei Medientypen oder ein führendes <code>not</code> — erzeugt eine Warnung und verwendet nur die innere Query. Jede andere verschachtelte At-Rule ersetzt die äußere.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Nimm <code>raw</code> für jede beliebige Eigenschaft, mit dem Namen genau wie in CSS geschrieben. Zahlen bekommen weiterhin <code>px</code>, übergib also Strings:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Jeder andere flache Key wird in kebab-case umgewandelt und unverändert ausgegeben, ein Tippfehler wie <code>colr: 'red'</code> wird also zu einer Deklaration, die der Browser verwirft. Ein verschachteltes Objekt unter einem Key, der kein Pseudo-Zustand, kein Screen und kein <code>&amp;</code>- oder <code>@</code>-Key ist, wird ignoriert. TypeScript meldet beides.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Kombiniert Styles. Setzen zwei Eingaben dieselbe Eigenschaft, gewinnt die spätere.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Falsy-Eingaben werden übersprungen, Arrays werden abgeflacht, Strings werden aufgeteilt und dedupliziert.</li>
        <li>Generierte Klassen für denselben Block (Basis, derselbe Pseudo-Zustand, dieselbe Media Query) werden zu einer neuen Klasse zusammengeführt. Andere Klassennamen werden unverändert durchgereicht.</li>
        <li>Nur <code>cx()</code> kennt die Reihenfolge der Argumente. Bei <code>div(base, blue)</code> werden beide Klassen hinzugefügt, und die zuletzt erzeugte Regel gewinnt. Pack Styles, die sich gegenseitig überschreiben, in einen einzigen <code>cx()</code>-Aufruf.</li>
        <li>Wenn der Block eines benannten Styles mit dem Block einer anderen Eingabe zusammengeführt wird, heißt die zusammengeführte Klasse <code>name-&lt;hash&gt;</code>, nicht der bloße Name. Blöcke, die nicht zusammengeführt werden, behalten ihre Klasse, <code>cx(pageTitle, 'extra')</code> enthält also weiterhin <code>page-title</code>.</li>
      </ul>
      <h3>Dynamische Klassen</h3>
      <p>Übergib eine Funktion, die immer <code>cx(...)</code> zurückgibt:</p>
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
      <p>Die Funktion muss bei ihrem ersten Durchlauf ein Style-Ergebnis zurückgeben. <code>() =&gt; active &amp;&amp; activeButton</code> rendert den Text "false" statt einer Klasse.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Liefert eigene <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> und <code>globalStyle</code>, gebunden an ein Theme. Ein Theme gibt Werten Namen: Mit dem Theme unten schreibt <code>borderColor: 'border'</code> den Wert <code>#e5e7eb</code>, und TypeScript vervollständigt die Namen. Jeder Eintrag in <code>screens</code> wird zu einem Style-Key für eine Media Query, etwa <code>md: {…}</code>.</p>
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
        <thead><tr><th>Theme-Key</th><th>Verwendet von</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> und jede Seite, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>neue Style-Keys, etwa <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Ein Theme-Name wird nur aufgelöst, wenn er der gesamte Wert ist. <code>border: "1px solid primary"</code> wird nicht aufgelöst.</li>
        <li>Ein Screen-Wert ohne <code>@</code> wird zu <code>@media &lt;value&gt;</code>. Ein Wert, der mit <code>@</code> beginnt, wird unverändert übernommen, zum Beispiel <code>"@container (min-width: 400px)"</code>.</li>
        <li>Screens existieren nur auf Instanzen aus <code>createCss()</code>. Das globale <code>css()</code> hat keine, akzeptiert aber <code>@media</code>-Keys.</li>
        <li>Alle Instanzen und die globalen Helfer teilen sich ein Stylesheet. Screen-Media-Regeln werden in der Reihenfolge ausgegeben, in der die Screens deklariert sind, nicht in der Reihenfolge ihrer Verwendung, liste <code>min-width</code>-Screens also von klein nach groß. Verwende eine <code>createCss()</code>-Instanz pro App, damit diese Reihenfolge die aus deinem Theme ist.</li>
        <li><code>theme</code> auf dem Ergebnis ist das Theme, das du übergeben hast.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Baut eine Funktion, die für eine Menge von Optionen einen Style zurückgibt, etwa Intent und Größe eines Buttons.</p>
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
        <li>Styles werden in dieser Reihenfolge zusammengeführt: <code>base</code>, der gewählte Wert jeder Gruppe, dann jeder passende Compound. Spätere Styles gewinnen pro Eigenschaft.</li>
        <li>Eine fehlende, <code>undefined</code>- oder <code>null</code>-Option verwendet den Default. Eine Gruppe ohne Default wird übersprungen.</li>
        <li>Eine Gruppe mit nur <code>true</code>- und <code>false</code>-Keys nimmt einen Boolean.</li>
        <li>Ein Compound greift, wenn jede Gruppe, die er auflistet, passt, Defaults eingeschlossen.</li>
        <li>Jede Auswahl wird einmal gebaut und gecacht.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() & globalStyle()",
        content: `
      <p><code>keyframes()</code> registriert eine Animation und gibt ihren generierten Namen zurück. Frame-Keys sind <code>from</code>, <code>to</code> und Prozentwerte wie <code>"50%"</code> oder <code>"0%, 100%"</code>. Frames nehmen nur flache Eigenschaften. Identische Frames liefern denselben Namen.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> fügt eine Regel für einen beliebigen Selektor hinzu:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>Der Selektor wird genau so verwendet, wie er geschrieben ist.</li>
        <li>Nur flache Eigenschaften funktionieren. Pseudo-Keys, Screens und <code>@</code>-Keys werden ignoriert, <code>globalStyle()</code> kann also keine Media-Regeln schreiben.</li>
        <li>Dieselbe Regel wird einmal hinzugefügt. Ein anderer Style für denselben Selektor fügt eine zweite Regel hinzu, und die spätere gewinnt.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() & resetStyles()",
        content: `
      <p><code>getCssText()</code> liefert jede Regel, die <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> und <code>globalStyle()</code> in diesem Prozess erzeugt haben: zuerst die Basisregeln, dann die <code>@media</code>-, <code>@container</code>- und <code>@supports</code>-Blöcke. Nimm es für serverseitiges Rendering.</p>
      <ul>
        <li>Ruf es nach <code>renderToString()</code> auf. Regeln, die während des Renderns entstanden sind, sind enthalten.</li>
        <li>Es umfasst den gesamten Prozess, nicht eine Seite oder einen Request, und es wächst nur. Das ist sicher, weil Klassennamen Inhalts-Hashes sind.</li>
        <li>Pack es in <code>&lt;style id="nuclo-styles"&gt;</code>. Der Client verwendet dieses Element wieder und überspringt die Regeln, die bereits darin stehen. Mit einer anderen id, oder ohne, fügt der Client ein zweites Stylesheet mit jeder Regel noch einmal hinzu.</li>
        <li>Der Text wird nicht escaped, steck also niemals nicht vertrauenswürdige Eingaben in Style-Werte.</li>
      </ul>
      <p><code>resetStyles()</code> ist ein Test-Helfer. Es entfernt jede Regel und das <code>#nuclo-styles</code>-Element. Styles, die du zuvor erzeugt hast, behalten ihre Klassennamen, verlieren aber ihr CSS. Ruf es nicht in einer App oder auf einem Server auf.</p>
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
      <div class="docs-callout"><strong>Separates Paket:</strong> <code>nuclo-router</code> ist nicht Teil des Nuclo-Kernpakets. Installiere es neben <code>nuclo</code>. Es ist ein Preview-Release, die API kann sich also noch ändern.</div>
      <p>Routing für Nuclo: serverseitiges Rendering, Hydration, code-gesplittete Routen und Idle-Preloading, gebaut auf <code>list()</code> und <code>update()</code>. Etwa ${NUCLO_ROUTER_GZIP_KB} KB gzipped, ohne Abhängigkeiten außer Nuclo selbst und ohne Seiteneffekte, es wird also per Tree-Shaking entfernt, wenn es ungenutzt bleibt.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Oder nimm <code>pnpm add</code>, <code>yarn add</code> oder <code>bun add</code> mit denselben zwei Namen. Es braucht <code>nuclo</code> 0.3 oder neuer als Peer-Dependency.</p>
      <p>Der Router entscheidet, <em>was</em> geladen wird. Die App sagt mit <code>router.outlet()</code>, <em>wo</em>: eine <code>list()</code> über den Layer-Stack, eine Zeile pro Layer, eine gewöhnliche Seite ist also eine einzige Zeile. Server und Client bauen denselben Baum, <code>hydrate()</code> übernimmt also die Knoten des Servers, statt sie zu ersetzen. Alles Weitere ist <code>history</code>, ein delegierter <code>click</code>-Listener und <code>requestIdleCallback</code>.</p>
      <h3>Ein Import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> löst die Module der passenden Route auf, bevor es zurückkehrt, der erste Baum ist also auf Server und Client vollständig. Danach reicht der Router zur gestarteten Route durch: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
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
      <p>Das ist die gesamte Integration. Links funktionieren, weil ein <code>&lt;a href&gt;</code> einfach ein <code>&lt;a href&gt;</code> ist. Ein delegierter Listener auf <code>document</code> fängt die Links ab, die dem Router gehören, und überlässt jeden anderen Link dem Browser.</p>
      <p>Auf dem Server gibt <code>start()</code> pro Request eine <code>Route</code> zurück und lässt den Router in Ruhe, parallele Requests können also nicht die Route des anderen sehen. <code>route.run()</code> macht diese Route für die Dauer des Renderns zu derjenigen, die der Router, und damit das Outlet, liest. Im Browser gibt es eine Route pro Seitenaufruf, und <code>start()</code> macht sie zur eigenen des Routers. Kein <code>run()</code> nötig.</p>
      <p>Eine Seite erhält ihren <a href="#router-api"><code>RouteContext</code></a> und ihre <a href="#router-api"><code>PageProps</code></a> als <code>(ctx, { layer, data, outlet, beforeLeave })</code> und darf weniger Argumente annehmen. Sie gibt alles zurück, was <code>list()</code> akzeptiert. Um zusätzlich einen anderen Teil des Layouts zu füllen, gib aus der Seite heraus ein <code>into()</code> zurück, etwa <code>div(article(…), into('sidebar', nav(…)))</code>. Dieser Inhalt verschwindet mit der Seite. Siehe <a href="#router-regions">Seiten &amp; Regionen</a>.</p>
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
          <tr><td><code>*</code></td><td>alles, was sonst nicht passt, deine 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>Die Priorität ist: statisch, dann dynamisch in Deklarationsreihenfolge, dann Catch-all mit dem längsten Präfix zuerst. <code>'*'</code> passt also nur auf das, was sonst nichts trifft, und kann an beliebiger Stelle in der Tabelle stehen. Abschließende Slashes, doppelte Slashes und Prozent-Kodierung werden normalisiert, Param-Werte kommen dekodiert an. Das Matching ist ein Segmentvergleich pro Pattern. Es werden keine Regexes gebaut oder ausgeführt.</p>
      <h3>Relative Routen</h3>
      <p>Ein Pattern mit <code>./</code> ist relativ zum Parent, der es deklariert, und ein href mit <code>./</code> ist relativ zur aktiven Route. Zusammen ergeben sie einen wiederverwendbaren Abschnitt, der unter jedem Parent dasselbe bedeutet. Der Wert in einer Tabelle ist entweder ein Loader oder eine weitere Tabelle, deren Keys relativ zu ihr sind:</p>
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
      <p>Diese zwei Zeilen erzeugen alle sechs Patterns, ohne dass ein Pfad zweimal geschrieben wird. Beide Parents bekommen dieselben Loader-Objekte, sie teilen sich also einen Modul-Cache und ein <code>import()</code>.</p>
      <ul>
        <li>Innerhalb einer Kind-Tabelle bedeuten <code>'./x'</code>, <code>'/x'</code> und <code>'x'</code> alle dasselbe, <code>'/'</code> steht für den Parent-Pfad selbst, und <code>'*rest'</code> gibt dem Abschnitt sein eigenes Catch-all. Die Verschachtelung geht beliebig tief.</li>
        <li>Top-Level-Keys werden unverändert übernommen, <code>'*'</code> bleibt also <code>'*'</code>.</li>
        <li>Ein Kind unter einem <code>*catch-all</code>-Parent ist ein <code>createRouter()</code>-Fehler, da ein Catch-all sein Pattern beenden muss.</li>
      </ul>
      <h3>Parent-Seiten und <code>outlet()</code></h3>
      <p>Ein Parent und seine Kinder sind eine echte Hierarchie. Der Parent rendert, und sein Kind rendert in ihm, dort, wo er <code>outlet()</code> aufruft:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Die Navigation zwischen Kindern baut den Parent nicht neu. Sein DOM-Knoten bleibt derselbe Knoten, sein Fokus, seine Scrollposition, sein halb ausgefülltes Eingabefeld und jeder Zustand in seiner Closure überleben also.</p>
      <ul>
        <li>Eine Seite ohne Kind-Route rendert aus ihrem Outlet nichts, ein Layout kann es also bedingungslos aufrufen. Ein Parent, der ein Kind hat und <code>outlet()</code> nie aufruft, verschluckt es.</li>
        <li>Es gibt keine Index-Routen. <code>'/'</code> ist das Layout selbst, der Parent-Pfad rendert also das Layout mit leerem Outlet statt einer separaten Index-Seite darin. Pack den Landing-Inhalt ins Layout oder gib ihm einen echten Kind-Pfad.</li>
      </ul>
      <p>Derselbe Aufruf funktioniert dann von beiden Parents aus, und von einer Seite, die nicht weiß, in welchem sie steckt:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> und <code>..</code> werden gegen den Pfad der aktuellen Route aufgelöst, nicht gegen das "Verzeichnis" der URL. Von <code>/invoices/42</code> aus ist <code>./preview</code> gleich <code>/invoices/42/preview</code>, wo ein Browser <code>/invoices/preview</code> gesagt hätte, und ein abschließender Slash in der URL ändert nichts. <code>../</code> geht ein Segment nach oben und stoppt an der Wurzel. Query und Hash werden mitgenommen, <code>base</code> wird wieder vorangestellt, und der aufgelöste absolute Pfad ist das, was in die History geht. Das ist dieselbe Abweichung von der URL-Auflösung, die React Router für <code>&lt;Link to="./x"&gt;</code> macht.</p>
      <ul>
        <li>Nur <code>./</code> und <code>../</code> sind routen-relativ. Ein einfaches <code>preview</code> in einem href bleibt den gewöhnlichen Browserregeln überlassen.</li>
        <li>Baue relative Links mit <code>router.href('./preview')</code>, statt <code>href="./preview"</code> von Hand zu schreiben. <code>href()</code> löst zur Renderzeit auf, das ausgelieferte Markup ist also absolut und bleibt korrekt für einen Crawler, für einen Mittelklick und bei deaktiviertem JavaScript.</li>
      </ul>
      <h3>Was erhalten bleibt, und was neu gebaut wird</h3>
      <table>
        <thead><tr><th>Knoten</th><th>Bei Navigation</th></tr></thead>
        <tbody>
          <tr><td>ein Parent, dessen Pattern und Pfad unverändert sind</td><td><strong>erhalten</strong>: derselbe Knoten, und sein <code>load()</code> läuft nicht erneut</td></tr>
          <tr><td>die passende Seite</td><td><strong>erhalten</strong>, wenn Pattern und Pfad unverändert sind und sie kein <code>load()</code> hat, eine Query- oder Hash-Änderung behält sie also. Eine Route mit Loader wird bei jedem Besuch aufgefrischt.</td></tr>
          <tr><td>ein Parent, dessen Pfad sich geändert hat</td><td>neu gebaut, zusammen mit allem darunter</td></tr>
          <tr><td>ein gepushter Layer</td><td>rendert die passende Seite allein. Seine Parents sind bereits in der Zeile darunter gemountet.</td></tr>
        </tbody>
      </table>
      <p>Eine erhaltene Seite behält den <code>ctx</code>, mit dem sie gebaut wurde. Das ist die Bedeutung von <code>ctx</code> überall: Lies <code>router.*</code> für Live-Werte. Query-getriebener Zustand wie Filter, Paginierung und Tabs liest <code>router.search</code> in einem dynamischen Wert und schreibt mit <code>router.go('?page=2', { replace: true })</code>. Die Seite, ihr Fokus und ihr halb ausgefülltes Eingabefeld bleiben, wo sie sind.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Seiten & Regionen",
        content: `
      <p><code>router.outlet()</code> platziert die Seite an einer Stelle. Eine Seite, die außerdem eine Sidebar, eine Toolbar oder eine Überschrift an anderer Stelle im Layout braucht, füllt sie mit <a href="#api-region"><code>into()</code></a>. Das Layout markiert die Stelle mit <code>region()</code>, und die Seite gibt neben ihrem eigenen Inhalt ein <code>into()</code> zurück. Das Layout erhält nie Seiteninhalt als Prop, und die Navigation baut es nie neu.</p>
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
      <p>Der Inhalt der Seite ist eine Zeile der <code>list()</code> des Outlets, und ein <code>into()</code> lebt so lange wie die Zeile, die es enthält. Der Sidebar-Inhalt kommt also mit der Seite und geht mit ihr: Die Navigation zu einer Seite ohne <code>into('sidebar', …)</code> zeigt wieder den <code>empty</code>-Inhalt der Region. Die Seite kann ihren <code>ctx</code> und ihre <code>data</code> für beide Teile nutzen, da beide von derselben Funktion gebaut werden.</p>
      <h3>Was bei der Navigation passiert</h3>
      <ul>
        <li><strong>Eine erhaltene Seite behält ihre Regionen.</strong> Eine Query- oder Hash-Änderung, die <a href="#router-patterns">die Seite behält</a>, lässt auch den Regionsinhalt unangetastet. Lies <code>router.search</code> in einem dynamischen Wert, wenn die Sidebar davon abhängt.</li>
        <li><strong>Eine neu gebaute Seite füllt sie neu.</strong> Ändert sich die Route, wird die alte Zeile entfernt, und die <code>into()</code>-Views der neuen Seite übernehmen. Nichts bleibt zurück.</li>
        <li><strong>Ein gepushter Layer fügt eine View hinzu.</strong> Der Layer ist eine spätere Zeile des Outlets, sein <code>into()</code> ist also eine neuere View derselben Region. Mit dem Default <code>type: 'latest'</code> überdeckt sie die View der Seite, bis der Layer schließt, dann erscheint die View der Seite wieder. Mit <code>type: 'stack'</code> werden beide gezeigt.</li>
        <li><strong>Auch eine Parent-Seite kann Regionen füllen.</strong> Ihre Views bleiben, während ihre Kinder wechseln, weil der Parent nicht neu gebaut wird.</li>
        <li><strong>Serverseitiges Rendering funktioniert unverändert.</strong> Der Server baut die Seite innerhalb von <code>route.run()</code>, ihre <code>into()</code>-Views stehen also im HTML, und <code>hydrate()</code> übernimmt sie.</li>
      </ul>
      <h3>Mehrere Regionen aus einer Seite</h3>
      <p>Übergib ein Objekt, um mehrere Regionen auf einmal zu füllen. Der Hauptinhalt der Seite geht weiterhin durch das Outlet, gib ihn also neben dem <code>into()</code> zurück:</p>
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
      <h3>Welches Werkzeug für welche Aufgabe</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> ist für eine Kind-Route: Inhalt, den die URL bestimmt, gerendert innerhalb seiner Parent-Seite. Siehe <a href="#router-patterns">Verschachtelte Routen</a>.</li>
        <li><strong><code>into()</code></strong> ist dafür, dass sich die passende Seite über das Layout verteilt. Der Inhalt gehört zur Seite und nutzt ihre Daten.</li>
        <li><strong><code>matches()</code></strong> ist dafür, dass das Layout allein anhand der URL entscheidet, mit seiner eigenen kleinen Tabelle und ohne Beteiligung einer Seite. Siehe <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>All das gehört zu der einen passenden Route. Der Router steuert nicht zwei unabhängige Bereiche aus einer URL, eine Sidebar mit eigenen Routen ist also eine Region, die eine Seite füllt, kein zweites Outlet. Eine Sidebar, die wirklich einen eigenen Router, eigenes Laden und einen eigenen Fallback will, hält einen ungestarteten Router und löst mit <code>match()</code> auf — siehe <a href="#router-multi">Mehrere Router &amp; kombiniertes Laden</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Routen-Loader & Code-Splitting",
        content: `
      <p>Ein Seitenmodul kann eine <code>load</code>-Funktion exportieren. Sie läuft, bevor die Seite gebaut wird, bei jeder Navigation zu dieser Route, und was sie zurückgibt, wird der Seite als <code>data</code> übergeben:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>Die Routentabelle bleibt unverändert. Der Loader gehört zum Seitenmodul. Er erhält den passenden <code>RouteContext</code>, <code>params</code>, <code>search</code> und <code>path</code> stehen also alle zur Verfügung. Er kann synchron oder asynchron sein, und er läuft auch auf dem Server, eine servergerenderte Seite kommt also mit ihren Daten bereits im HTML, statt nach der Hydration zu fetchen.</p>
      <p><strong>Das Modul wird gecacht. Die Daten nicht.</strong> Der Chunk einer Route wird einmal geladen und wiederverwendet, ihr Loader läuft bei jeder Navigation erneut. Deshalb können <code>/blog/a</code> und <code>/blog/b</code> nicht verwechselt werden, und deshalb lässt sich ein fehlgeschlagener Loader einfach erneut versuchen.</p>
      <table>
        <thead><tr><th>Situation</th><th>Verhalten</th></tr></thead>
        <tbody>
          <tr><td>während er läuft</td><td><code>router.pending</code> ist true, und die Seite, auf der du warst, bleibt stehen</td></tr>
          <tr><td>er wirft einen Fehler oder sein Promise wird abgelehnt</td><td>der Fehler wird in <code>router.error</code> gespeichert. Das Promise von <code>go()</code> wird weiterhin nie abgelehnt, und die Navigation kann wiederholt werden.</td></tr>
          <tr><td>während <code>start()</code></td><td>die Rejection kommt aus <code>start()</code>. Es gibt noch keine Route, auf der sie landen könnte.</td></tr>
          <tr><td>ein gepushter Layer</td><td>führt seinen eigenen Loader aus, mit eigenen Daten</td></tr>
          <tr><td>der Idle-Preloader</td><td>lädt nur Module vorab. Er hat keinen Kontext zum Übergeben und würde Daten für eine Route holen, die du vielleicht nie öffnest.</td></tr>
          <tr><td>erneute Navigation zur selben URL</td><td>der Loader läuft erneut, und die Zeile wird neu gebaut. Eine Route ohne Loader behält ihre Zeile.</td></tr>
        </tbody>
      </table>
      <p>Zum Revalidieren navigierst du dorthin, wo du schon bist, ohne einen History-Eintrag hinzuzufügen:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Daten zusammen mit dem Chunk starten</h3>
      <p>Ein vom Seitenmodul exportiertes <code>load</code> kann erst laufen, wenn dieses Modul geladen ist, eine kalte Navigation holt also erst den Chunk, dann die Daten. Um beides gleichzeitig zu starten, deklariere den Loader in der Tabelle mit <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Es ersetzt das eigene <code>load</code> des Moduls und läuft wie dieses bei jedem Besuch. Eine Rejection, während der Chunk noch lädt, landet wie jede andere auf <code>router.error</code>.</p>
      <p>Es gibt absichtlich keine Serialisierung von Serverdaten ins HTML. Das <code>load</code> des Clients läuft bei der Hydration erneut. Wenn das wichtig ist, lass den Server <code>route.data</code> ausgeben, zum Beispiel als <code>window.__DATA__</code>, und den Loader es zuerst nehmen. <code>route.data</code> sind nur die Daten der passenden Seite. Das Ergebnis des <code>load()</code> eines Parents ist nicht enthalten.</p>
      <h3>Code-Splitting und Preloading</h3>
      <p>Der Wert einer Route ist immer eine Funktion, die die Seitenkomponente zurückgibt. Die Komponente wird also erst bei Bedarf geladen:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Nur die Varianten, die ein Modul zurückgeben, können einen <code>load</code>-Export bereitstellen. Eine benannte Komponente mit <code>.then(m =&gt; m.BPage)</code> auszuwählen, gibt dem Router nur die Funktion.</p>
      <p>Jedes Modul wird einmal importiert und gecacht. Parallele Navigationen zur selben Route teilen sich ein <code>import()</code>. Sobald der User die Seite <code>idleTimeout</code> lang in Ruhe gelassen hat (standardmäßig eine Sekunde; keine Taps, Tasten, Mausrad oder Scrollen), werden die restlichen Routen im Hintergrund geladen, eine pro Idle-Slice (<code>requestIdleCallback</code>). Jede Eingabe, oder eine Navigation, auf die der User wartet, pausiert das, bis die Seite wieder idle ist.</p>
      <p>Eine vorgeladene oder direkt verfügbare Route setzt <code>router.pending</code> nie auf true und wird vor dem nächsten Paint angezeigt: kein Spinner-Frame, kein Layout-Shift. <code>router.pending</code> ist nur true für ein Modul oder einen Loader, auf den gewartet werden muss, und die ausgehende Seite bleibt währenddessen auf dem Bildschirm. Ein Chunk, der nicht geladen werden kann, erscheint als <code>router.error</code>, nie als unbehandelte Rejection, und lässt sich einfach erneut versuchen.</p>
    `,
      },
      {
        id: "router-api",
        title: "Router-API",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> bildet ein Pattern auf einen Loader oder auf eine verschachtelte Tabelle ab. Optionen:</p>
      <table>
        <thead><tr><th>Option</th><th>Default</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL-Präfix, unter dem die App ausgeliefert wird, etwa <code>'/docs'</code>. Es passt nur an einer Segmentgrenze: <code>/docs/intro</code> liegt innerhalb von <code>'/docs'</code>, <code>/docsearch</code> nicht. URLs außerhalb passen auf nichts, das Promise von <code>start()</code> wird also abgelehnt (deine serverseitige 404), und Links dorthin bleiben dem Browser überlassen.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Die Module der restlichen Routen im Hintergrund laden, sobald die Seite idle ist. <code>false</code> schaltet es ab.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Millisekunden ohne Taps, Tasten, Mausrad oder Scrollen, bevor das Preloading startet oder nach User-Aktivität wieder aufgenommen wird.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, aufgerufen nach jeder aufgelösten Navigation im Browser, die erste eingeschlossen, sobald das DOM nachgezogen hat. <code>kind</code> ist <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Zurück, Vorwärts, <code>close()</code>) oder <code>'layer'</code>. Der Hook für <code>document.title</code>, Meta-Tags, Fokus, Scrollen und Analytics. Wird während SSR nie aufgerufen.</td></tr>
        </tbody>
      </table>
      <p>Gibt den Router zurück: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> und jedes <code>Route</code>-Member außer <code>run()</code>, durchgereicht zur aktiven Route. Das ist im Browser die, die das letzte <code>start()</code> zurückgegeben hat, oder auf dem Server die, deren <code>run()</code> gerade ausgeführt wird. Werden Member gelesen, ohne dass eine dieser Bedingungen erfüllt ist, wird ein Fehler geworfen. Die Routentabelle, der kompilierte Matcher und der Modul-Cache liegen auf dem Router und werden auf einem Server also über Requests hinweg geteilt.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Löst <code>url</code> (Default: <code>location.href</code> im Browser) zu ihren Seitenmodulen auf und gibt ein <code>Promise&lt;Route&gt;</code> zurück. Das Promise wird abgelehnt, wenn nichts passt und die Tabelle keine <code>'*'</code>-Route hat. Auf einem Server ist das deine 404. Im Browser macht es die Route außerdem zur aktiven des Routers, hängt die <code>popstate</code>- und delegierten <code>click</code>-Listener an und plant das Preloading. Ein zweites <code>start()</code> beendet die vorherige Route automatisch. Auf dem Server berührt es nichts Geteiltes, rendere also innerhalb von <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Löst eine URL gegen die Tabelle auf, ohne etwas zu laden: kein Import, keine History, keine Listener, keine Route. Gibt einen <code>RouteContext</code> zurück, oder <code>null</code>, wenn die URL außerhalb von <code>base</code> liegt, auf kein Pattern passt oder, im Browser, auf einem anderen Origin liegt. Nur absolute URLs, da die <code>./</code>-Auflösung eine aktive Route braucht.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Die Seiten der aktiven Route als <code>list()</code>. Platziere es einmal, dort, wo die Seiten hin sollen. Ein gepushter Layer ist eine spätere Zeile davon. Es ist leer, bevor <code>start()</code> aufgelöst ist, und nach <code>stop()</code>. Auf dem Server rendert es die Route, deren <code>run()</code> gerade ausgeführt wird.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Rendert die View einer zweiten Tabelle, auf die der Pfad der aktiven Route passt, als <code>list()</code>, die du beliebig platzierst. Siehe <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Jedes Member außer <code>run()</code> ist auch auf dem Router, wo eine App es liest.</p>
      <table>
        <thead><tr><th>Member</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>der aktive Match. <code>search</code> ist ein <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> und <code>url</code> sind live.</td></tr>
          <tr><td><code>pending</code></td><td>eine Navigation wartet auf ein Modul oder einen Loader</td></tr>
          <tr><td><code>error</code></td><td>der letzte fehlgeschlagene Ladevorgang, von der nächsten Navigation gelöscht</td></tr>
          <tr><td><code>data</code></td><td>was das <code>load()</code> der passenden Seite zurückgegeben hat, damit ein Server es serialisieren kann. Das eines Parents ist nicht enthalten.</td></tr>
          <tr><td><code>depth</code></td><td>wie viele Layer auf dem Stack liegen (1 für eine gewöhnliche Seite)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>navigieren und bei Bedarf das Modul laden. Das Promise wird nie abgelehnt: Schlägt das Laden eines Moduls durch eine Promise-Ablehnung oder einen geworfenen Fehler fehl, wird der Fehler in <code>error</code> gespeichert.</td></tr>
          <tr><td><code>push(href)</code></td><td>eine Route als neuen Layer obenauf öffnen; wird mit dem aufgelöst, womit er schließt. Akzeptiert <code>./</code>. Das Promise wird abgelehnt, wenn keine Route passt oder das Laden des Moduls fehlschlägt.</td></tr>
          <tr><td><code>href(path)</code></td><td>einen Pfad mit <code>base</code> präfixen, für <code>a({ href })</code>. Löst <code>./</code> und <code>../</code> gegen die aktive Route auf.</td></tr>
          <tr><td><code>stop()</code></td><td>jeden Listener lösen, offene Layer verwerfen, das Outlet leeren. Idempotent. Eine gestoppte Route antwortet weiterhin mit ihrem letzten Match, und <code>go()</code> tut nichts.</td></tr>
          <tr><td><code>run(fn)</code></td><td><code>fn</code> mit dieser Route als aktiver Route des Routers aufrufen und ihr Ergebnis zurückgeben: <code>route.run(() =&gt; renderToString(App))</code> auf dem Server. Nur synchron. Die Route ist nicht mehr aktiv, sobald <code>fn</code> zurückkehrt.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Das erste Argument einer Seite: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. Es ist der Kontext, mit dem die Seite gebaut wurde. Lies <code>router.*</code> für Live-Werte. Sie unterscheiden sich nur, wenn sich Query oder Hash ohne Neubau geändert haben.</p>
      <p><code>params</code> ist standardmäßig <code>{ [name]: string }</code>. Eine Seite kann es mit <code>Params</code> aus ihrem eigenen Pattern typisieren, das <code>'/blog/:slug'</code> zu <code>{ slug: string }</code> und <code>'/files/*rest'</code> zu <code>{ rest: string }</code> macht:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>Das zweite Argument einer Seite. Destrukturiere, was die Seite braucht.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>wo die Seite im Stack sitzt. Siehe <code>Layer</code> unten.</td></tr>
          <tr><td><code>data</code></td><td>was das <code>load()</code> der Route zurückgegeben hat, oder <code>undefined</code> ohne eines. Typisiert über <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>wo eine Parent-Seite ihre Kind-Route rendert. Siehe <a href="#router-patterns">Verschachtelte Routen</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>registriert einen Guard, der gefragt wird, bevor diese Seite verworfen wird. Siehe <a href="#router-layers">Leave-Guards</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Wo eine Seite im Stack sitzt, und ihr Weg hinaus.</p>
      <table>
        <thead><tr><th>Member</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 für die Basisseite, 1 und höher für gepushte Layer</td></tr>
          <tr><td><code>push(href)</code></td><td>einen weiteren Layer aus einer Seite heraus öffnen, wie <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>diesen Layer und alles darüber schließen und das <code>push()</code> auflösen, das ihn geöffnet hat. Ohne Argument heißt verworfen. Ein No-op bei Tiefe 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> und <code>withLoad()</code></h3>
      <p><code>DataLoader</code> ist <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, der optionale <code>load</code>-Export eines Seitenmoduls. <code>withLoad(loader, load)</code> erzeugt eine Route, deren <code>load</code> neben dem Import ihres Chunks startet statt danach. Siehe <a href="#router-loaders">Routen-Loader</a>.</p>
      <h3>Typen</h3>
      <p>Jeder Typ ist ein benannter Export von <code>nuclo-router</code>, eine Seite, ein Loader oder ein Guard lässt sich also typisieren, ohne von einem Pfad zu importieren.</p>
      <table>
        <thead><tr><th>Typ</th><th>Was es ist</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>das params-Objekt für ein Pattern. <code>RouteParams</code> ist die untypisierte Form, und <code>Match</code> ist das Ergebnis des Matchers.</td></tr>
          <tr><td><code>PageComponent</code></td><td>eine Seite: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>ein Seitenmodul: die Komponente selbst, oder <code>{ default, load? }</code>, wie <code>import()</code> es liefert</td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, optional mit einem <code>load</code> aus <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>die Tabelle, die <code>createRouter()</code> nimmt: Pattern auf Loader oder auf eine verschachtelte Tabelle</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, das zweite Argument von <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, das zweite Argument von <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>der Typ von <code>outlet()</code> aus <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, was <code>beforeLeave()</code> nimmt</td></tr>
          <tr><td><code>MatchView</code></td><td>was eine <code>matches()</code>-View ist: params rein, Inhalt oder <code>import()</code> einer Seite raus</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Layer & Leave-Guards",
        content: `
      <p><code>push()</code> öffnet eine Route über der aktuellen, statt sie zu ersetzen, und wird mit dem aufgelöst, womit dieser Layer schließt. Weil die Seiten eine einzige <code>list()</code> über den Stack sind, ist das Öffnen eines Layers ein Anhängen. Die Seite darunter wird nicht neu gerendert, ihr DOM, ihr Fokus und ihr halb ausgefülltes Formular sind also alle noch da, wenn der Layer schließt.</p>
      <p>Damit funktioniert der Ablauf "Ich brauche einen Datensatz, der noch nicht existiert", ohne das Formular wegzuwerfen, das der User gerade ausfüllt:</p>
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
      <p>Layer lassen sich verschachteln. Ein Dialog, der einen weiteren Dialog braucht, ruft <code>layer.push()</code> auf und wartet mit await auf das Ergebnis. Eine Referenz auf die Route ist dafür nicht nötig.</p>
      <ul>
        <li><strong>Die URL ist der oberste Layer.</strong> <code>push()</code> fügt einen History-Eintrag hinzu, ein Layer ist also verlinkbar, und Zurück schließt ihn und löst sein <code>push()</code> als verworfen auf, genau wie Abbrechen. Zurück und <code>close()</code> sind ein Codepfad: <code>close()</code> merkt sich sein Ergebnis und geht in der History zurück, und die Tiefe in <code>history.state</code> ist dabei maßgeblich. Browser behalten etwa 50 Einträge pro Tab, nach einem langen Weg durch Layer kann der Eintrag darunter also weg sein: Dann schließt <code>close()</code> die Layer an Ort und Stelle und überschreibt den aktuellen Eintrag mit der Seite, die sichtbar bleibt.</li>
        <li><strong>Eine gewöhnliche Navigation leert den Stack.</strong> Ein Link-Klick oder <code>go()</code> ist kein Layer. Es ersetzt alles und verwirft jeden offenen Layer, kein Aufrufer bleibt also wartend zurück.</li>
        <li><strong>Beim direkten Aufruf entsteht eine eigenständige Seite.</strong> Die URL benennt den obersten Layer, aber nicht den Stack darunter, das direkte Öffnen der URL eines Layers rendert ihn also bei Tiefe 1 mit <code>layer.depth === 0</code> und einem wirkungslosen <code>close()</code>. Eine gepushte Route muss für sich allein Sinn ergeben. Verzweige auf <code>layer.depth</code>, um einen Link hinaus anzubieten statt eines toten Abbrechen-Buttons.</li>
        <li><strong>Das Promise kann einen Reload nicht überleben</strong>, weil es in einer Closure lebt. Behandle das Ergebnis als Abkürzung durch einen Ablauf, der auch auf dem langen Weg funktioniert.</li>
        <li><strong>Nichts bleibt wartend zurück.</strong> <code>stop()</code> verwirft jeden offenen Layer, und ein von einer Navigation aufgegebener Layer wird mit <code>undefined</code> aufgelöst.</li>
      </ul>
      <h3>Leave-Guards</h3>
      <p>Eine Seite mit Daten, die erhalten bleiben sollen, etwa einem halb ausgefüllten Formular, registriert einen Guard. Er wird gefragt, bevor die Seite verworfen wird, und die Rückgabe von <code>false</code> (oder einem Promise darauf) behält die Seite:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Nur beim Verlassen der Seite.</strong> Eine Kind-Navigation unter einem Layout, oder eine Query- oder Hash-Änderung, die die Seite behält, fragt nicht. Ein Guard lebt und stirbt mit seiner Seite, es gibt also nichts abzumelden.</li>
        <li><strong>Jeder Weg hinaus.</strong> Ein Link, <code>go()</code>, Zurück und Vorwärts, das <code>close()</code> eines Layers, und <code>go()</code> zu einer URL, die dem Router nicht gehört (Verlassen der App, wobei <code>to</code> dann <code>null</code> ist). Ein abgelehntes Zurück oder Vorwärts wird rückgängig gemacht, die Adressleiste bleibt also auf der Seite. Das Schließen des Tabs oder ein Reload ist Sache von <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> ist der <code>RouteContext</code>, zu dem die Navigation führt. Guards laufen von innen nach außen und stoppen bei der ersten Ablehnung. Wirft ein Guard einen Fehler, bleibt die Seite erhalten. <code>close(result)</code> geht ebenfalls durch den Guard, setz dein Flag also zurück, bevor du mit einem Ergebnis schließt.</li>
        <li>Der Router kann nur History-Einträge zurückgehen, die er selbst geschrieben hat. Ein Zurück oder Vorwärts auf einen, den er nicht geschrieben hat, etwa einen nativen <code>#fragment</code>-Link oder das <code>pushState</code> eines anderen Skripts, wird nicht gefragt.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() & Sub-Router",
        content: `
      <p><code>router.outlet()</code> rendert die Seite. <code>router.matches(table)</code> rendert etwas anderes, das davon abhängt, wo du bist, etwa eine Sidebar, Breadcrumbs oder eine Toolbar, aus seiner eigenen kleinen Tabelle, ohne eine Route zu laden oder eine Seite hinzuzufügen:</p>
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
        <li><strong>Dasselbe Matching wie die Routentabelle.</strong> Patterns, Priorität, Raw-Path-Matching und das Entfernen von <code>base</code> sind die des Routers, eine View und eine Seite sind sich über die URL also immer einig. Es liest den Pfad des obersten Layers, wie <code>router.path</code>.</li>
        <li><strong>Eine View</strong> ist <code>(params, ctx) =&gt; content</code>, wobei <code>params</code> aus ihrem Pattern typisiert ist und <code>ctx</code> der <code>RouteContext</code> mit <code>pattern</code> und <code>params</code> der View. Sie kann stattdessen das <code>import()</code> eines Seitenmoduls zurückgeben, das mit <code>ctx</code> aufgerufen wird, sobald es ankommt.</li>
        <li><strong>Passt nichts, wird nichts gerendert.</strong> Füge eine <code>'*'</code>-View als Fallback hinzu. Es ist leer vor <code>start()</code> und nach <code>stop()</code>, wie das Outlet.</li>
        <li><strong>Es rendert nur neu, wenn sich die Route ändert</strong>, eine View behält ihr DOM also über alles hinweg, was die Seite behält.</li>
        <li><strong>Eine lazy View rendert nichts, bis ihr Modul ankommt.</strong> Ein fehlgeschlagenes <code>import()</code> wird mit <code>console.error</code> geloggt, setzt <code>router.error</code> nicht und wird bei der nächsten Navigation erneut versucht. Ein einfaches <code>update()</code> versucht es nicht erneut.</li>
        <li><strong>Auf dem Server</strong> liefert eine lazy View nichts, da ihr Modul erst auf dem Client ankommt. Nimm eine synchrone View für alles, was das erste HTML enthalten muss.</li>
      </ul>
      <h3>Sub-Router</h3>
      <p>Routen verschachteln sich, ein Sub-Router ist also meist einfach eine verschachtelte Tabelle. Ein Router: Die eigene <code>'/'</code>-Seite des Abschnitts ist sein Rahmen, und seine Kinder rendern im <code>outlet()</code> dieser Seite, der Rahmen überlebt also die Navigation innerhalb des Abschnitts:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Oder gib dem Feature einen eigenen Router, erzeugt, aber nie gestartet. Der Parent besitzt einen einzigen Catch-all-Eintrag, und das Kind löst den Rest gegen seine eigenen Patterns, Params und seinen Fallback auf:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Entscheidend ist, diesen Router nie zu starten. <code>start()</code> ist das, was die Listener anhängt, und zwei gestartete Router geraten in Konflikt. Der Preis ist, dass der untergeordnete Router die Auflösung übernimmt, Routen-Loader, die ein gestarteter Router ausführt, musst du also selbst aufrufen. Diese Form baut außerdem die Shell neu, wenn sich der Rest ändert, weil der Router eine Route sieht und die Shell den Rest selbst auflöst. Eine verschachtelte Tabelle ist das, was dir einen Parent verschafft, den der Router gemountet hält, bevorzuge sie also, sofern das Feature nicht wirklich einen eigenen Router, eine eigene base und einen eigenen Fallback braucht.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Mehrere Router & kombiniertes Laden",
        content: `
      <p>Eine App kann so viele Router haben, wie sie Bereiche hat. Die Regel, die das einfach hält: <strong>Starte genau einen pro Dokument</strong>, und lass jeden anderen Router ungestartet, der URLs mit <code>match()</code> auflöst. Nur der gestartete Router besitzt URL, History und den Click-Listener. Die übrigen sind Tabellen, die du befragst — und jeder Bereich kann unabhängig laden, mit eigenem Spinner.</p>
      <h3>Kombiniertes Laden: eine Kette von Loadern</h3>
      <p>Jede Seite auf einer passenden Kette darf <code>load()</code> exportieren. Bei einer kalten Navigation zu einer Kind-Route laufen der Loader des Layouts und der Loader der Seite <strong>parallel</strong>, und ein einziges <code>router.pending</code> deckt die ganze Kette ab: Die vorherige Seite bleibt auf dem Bildschirm, bis das Paar aufgelöst ist, ein halb geladener Baum wird also nie gezeichnet. Jede Komponente erhält ihre eigenen <code>data</code>:</p>
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
      <p>Beide Loader starten zusammen, nicht nacheinander. <code>router.pending</code> ist true, solange auf einen von beiden gewartet wird, und sonst false — eine vorgeladene oder direkt verfügbare Route setzt es nie auf true. Der Wechsel zwischen Sections behält das Layout, es läuft also nur der Loader der Section erneut; die Daten des Layouts, sein DOM und ein halb ausgefülltes Eingabefeld überleben alle. Die erneute Navigation zur selben URL führt den Loader des Blatts erneut aus und baut dessen Zeile neu, genau wie bei einer einzelnen Seite.</p>
      <h3>Mehrfaches Laden: ein zweiter Router mit eigenem Spinner</h3>
      <p>Ein unabhängiger Bereich — eine Sidebar, ein Tray, eine Live-Region — bekommt einen eigenen Router, erzeugt, aber nie gestartet, und sein eigenes Lade-Flag. <code>router.pending</code> gehört dem gestarteten Router und sagt nichts über diesen Bereich aus, die beiden können also nebeneinander laden, und jeder kann zuerst fertig werden:</p>
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
      <p>Der zweite Router wird gefragt, nie angewiesen: <code>match()</code> liest die URL und gibt einen Kontext zurück, und nichts über die Sidebar gelangt je in die Haupt-Routentabelle. <code>onNavigate</code> läuft nach jeder aufgelösten Navigation, die erste eingeschlossen, und ist damit die eine Stelle, die einen unabhängigen Bereich mit der URL synchron hält.</p>
      <ul>
        <li><strong><code>pending</code> gehört dem gestarteten Router.</strong> Ein nie gestarteter Router hat keine Route, kein <code>pending</code> und kein <code>error</code>. Der Bereich verfolgt seine eigenen Flags, und ein zweiter Spinner kann neben dem ersten sitzen. In der Demo lädt die Sidebar 800ms, während die Loader der Route 900ms laufen, die Seite kann also vor der Sidebar fertig sein oder umgekehrt.</li>
        <li><strong><code>match()</code> hängt nichts an.</strong> Beliebig viele ungestartete Router können sich das Dokument teilen; jeder hat seine eigene Tabelle, base und seinen eigenen Modul-Cache, und keiner berührt die History. Sie kosten eine Tabelle und einen Matcher.</li>
        <li><strong>Seine Loader laufen nie.</strong> Der gestartete Router führt das <code>load()</code> der Seiten aus, auf die er passt. Ein nie gestarteter Router löst nur auf, wenn seine Views also Daten brauchen, hol sie selbst — das <code>refreshSidebar()</code> der Demo. Wenn du Loader willst, behält eine <a href="#router-matches">verschachtelte Tabelle</a> oder eine <a href="#router-regions">Region, die eine Seite füllt</a>, diese Aufgabe beim gestarteten Router.</li>
        <li><strong>Schütze dich vor veralteten Antworten.</strong> Ein langsamer Sidebar-Fetch darf nicht auf der Section landen, von der du weg navigiert bist. Erhöhe pro Refresh einen Generationszähler und verwirf Antworten, die nicht mehr passen, so wie der Router selbst überholte Navigationen zurückzieht.</li>
        <li><strong>Eine lazy <code>matches()</code>-View hat ebenfalls kein <code>pending</code>.</strong> Sie rendert nichts, bis ihr Modul ankommt. Drei Ladesysteme, drei unabhängige Uhren: das <code>pending</code> der Route, deine eigenen Flags und eine lazy View, die einfach noch nicht da ist.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Link-Handling",
        content: `
      <p>Der delegierte Listener navigiert bei einem Linksklick auf ein <code>&lt;a href&gt;</code>, einschließlich eines SVG-<code>&lt;a&gt;</code> und Klicks auf alles, was darin verschachtelt ist, und hält sich bei allem anderen zurück: Klicks mit Modifier-Taste und Mittelklicks, ein <code>target</code> ungleich <code>_self</code>, <code>download</code>, <code>rel="external"</code>, Cross-Origin-hrefs, reine Hash-Links auf der aktuellen Seite, Pfade außerhalb von <code>base</code>, Pfade, auf die keine Route passt (eine servergerenderte 404 bleibt also erreichbar), und jedes Event, auf dem ein App-Handler bereits <code>preventDefault()</code> aufgerufen hat. Nimm einen Link explizit mit <code>data-nuclo-router="off"</code> heraus.</p>
      <h3>Scrollen</h3>
      <p>Eine gepushte Navigation behält die aktuelle Scrollposition. Hat die neue URL einen <code>#hash</code>, der auf ein Element der Seite passt, wird dieses Element in den sichtbaren Bereich gescrollt. <code>popstate</code> überlässt das Scrollen dem Browser. Um neue Seiten am Seitenanfang anzuzeigen, nutze <code>onNavigate</code>, das sagt, wie die Navigation zustande kam:</p>
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
        <li><strong>Nichts wird festgehalten.</strong> Die Route hält die Seitenfunktion und ihren Kontext, nie DOM. Wegnavigieren gibt die vorherige Seite frei. <code>stop()</code> gibt die Listener und jeden laufenden Ladevorgang frei und löscht <code>pending</code>, eine gestoppte Route lässt also nie einen Spinner hängen. Ein Modul, das nach <code>stop()</code> aufgelöst wird, wird stillschweigend verworfen.</li>
        <li><strong>Sicher bei parallelen Serveranfragen.</strong> <code>start()</code> gibt Zustand pro Request zurück, und <code>run()</code> begrenzt ihn auf einen synchronen Render, verschränkte Requests können also nicht die Route des anderen sehen. Nur der Modul-Cache wird geteilt. Der Scope endet, wenn die Funktion von <code>run()</code> zurückkehrt. <code>renderToString()</code> ist synchron, das reicht also. Ein asynchroner oder streamender Render müsste die Route über <code>await</code>s hinweg mitführen, was <code>run()</code> nicht tut.</li>
        <li><strong>Scroll-Wiederherstellung bei <code>popstate</code></strong> ist Sache des Browsers (<code>scrollRestoration</code>), nicht des Routers.</li>
        <li><strong>Starte einen Router pro Dokument.</strong> Jedes <code>start()</code> fügt seinen eigenen delegierten <code>click</code>-Listener hinzu, und das <code>start()</code> eines zweiten Routers stoppt den ersten nicht. Nur ein zweites <code>start()</code> auf demselben Router tut das. Um eine URL gegen eine andere Tabelle aufzulösen, erzeuge einen Router und rufe nur <code>match()</code> auf. Es hängt nichts an. Ein unabhängiger Bereich kann so sein eigenes Laden neben dem <code>pending</code> der Route betreiben. Siehe <a href="#router-multi">Mehrere Router &amp; kombiniertes Laden</a>.</li>
        <li><strong>Absichtlich nicht enthalten:</strong> Hash- und Memory-History, da die Route im Pathname lebt und ein Server jede Route ausliefern muss; zwei unabhängig geroutete Bereiche aus einer URL, da eine Seite mit <code>into()</code> zwar mehrere Regionen füllen kann, sie aber alle zu der einen passenden Route gehören — ein unabhängiger Bereich kann trotzdem seinen eigenen ungestarteten Router und sein eigenes Laden behalten, wie in <a href="#router-multi">Mehrere Router &amp; kombiniertes Laden</a>; und Hover-Preloading, das du bekommst, indem du den eigenen Loader der Route aus einem <code>mouseenter</code> aufrufst.</li>
      </ul>
      <h3>Beispiele</h3>
      <p>Zwei lauffähige Beispiele im Repository ergänzen sich, sodass jede Einstellung irgendwo beobachtbar ist:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: eine clientseitige Tour durch die ganze API. Jede Pattern-Form und Prioritätsregel, die Opt-outs des Link-Handlings, jedes Route-Member mit Live-Bedienelementen, ein Sub-Router, der Layer-Stack drei Ebenen tief, ein relativer Abschnitt unter zwei Parents und Routen-Loader mit <code>pending</code> und <code>error</code>. Setzt <code>preload: false</code>, damit diese Zustände sichtbar bleiben.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> pro Request, Hydration, die nachweislich die Knoten des Servers übernimmt, echte 404-Statuscodes, eine base ungleich Wurzel, Idle-Preloading, das du im Netzwerk-Panel beobachten kannst, und ein Loader, dessen Daten vom Server an den Client übergeben werden, damit die Hydration nicht erneut fetcht.</li>
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
      <p>Nuclo hat keine Computed-API. Nimm eine einfache Funktion und ruf sie aus dynamischen Werten auf:</p>
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
      <p>Nimm einfaches <code>async</code>/<code>await</code> und ruf jedes Mal <code>update()</code> auf, wenn sich der Zustand ändert. Bei einem Fetch heißt das: einmal vor dem <code>await</code> und einmal danach:</p>
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
        <li><strong>Änderungen bündeln.</strong> Ändere den gesamten nötigen Zustand, dann ruf <code>update()</code> einmal auf.</li>
        <li><strong>Dynamische Werte schnell und frei von Seiteneffekten halten.</strong> Sie laufen alle bei jedem <code>update()</code>.</li>
        <li><strong>Nimm <code>scope()</code></strong> für kleine, häufige Updates, etwa Tippen oder Timer.</li>
        <li><strong>Ins Dokument rendern.</strong> Knoten, die beim <code>update()</code> nicht im Dokument sind, hören auf, sich zu aktualisieren.</li>
        <li><strong>Nimm <code>when()</code> und <code>list()</code></strong> für Kinder, die sich ändern, nicht eine Funktion, die Knoten zurückgibt.</li>
        <li><strong>Nimm <code>className</code>, nicht <code>class</code></strong>, und <code>() =&gt; cx(...)</code> oder <code>{ className: () =&gt; … }</code> für dynamische Klassen.</li>
        <li><strong>Styles einmal definieren</strong>, auf Modulebene.</li>
        <li><strong>Serverseitiges Rendering:</strong> Erst rendern, dann <code>getCssText()</code> in <code>&lt;style id="nuclo-styles"&gt;</code> packen. Request-Daten als Argumente übergeben, und HTML-Kommentare in der Ausgabe behalten.</li>
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
      <p>Jede öffentliche Funktion, und woher sie kommt.</p>
      <h3><code>nuclo</code> (global und benannter Export)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: alle dynamischen Werte ausführen, oder die in den angegebenen Scopes.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: einem Element Scope-IDs für <code>update(id)</code> geben.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: bedingter Inhalt, mit <code>.when()</code> und <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: eine Zeile pro Element, zugeordnet über Identität.</li>
        <li><a href="#api-region"><code>region(options)</code></a> und <a href="#api-region"><code>into(id, ...content)</code></a>: eine benannte Stelle im Baum, und Inhalt, der sie von überall füllt.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: ein Event-Listener, oder <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: bauen und anhängen.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: Server-HTML übernehmen.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: Komponenten erneut aufrufen und das DOM patchen.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: generierte Klassen aus einem Style-Objekt.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: Styles kombinieren, später gewinnt.</li>
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
        <li><a href="#api-polyfill">Ein Side-Effect-Import</a>, plus <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> und die <code>Nuclo*</code>-Klassen.</li>
      </ul>
      <h3><code>nuclo-router</code> (separates Paket)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: der Router, mit <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> und <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: eine Route, deren Daten-Loader neben ihrem Chunk startet.</li>
        <li><a href="#router-api">Typen</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> und mehr.</li>
      </ul>
      <h3>Nur global</h3>
      <ul>
        <li><a href="#tag-builders">175 Tag-Builder</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, sowie <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Typen</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> und mehr. Styling-Typen wie <code>StyleResult</code> lassen sich auch aus <code>'nuclo'</code> importieren.</li>
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
      <h3>Aktualisiert eine Zustandsänderung die UI?</h3>
      <p>Nein. Das DOM bleibt, wie es ist, bis du <code>update()</code> aufrufst.</p>

      <h3>Verwendet Nuclo Signals, Proxies oder ein virtuelles DOM?</h3>
      <p>Nein. Zustand bleibt einfaches JavaScript. Wenn ein Baum gerendert wird, erzeugt Nuclo echte Elemente und Textknoten. <code>update()</code> führt jeden registrierten dynamischen Wert aus, oder die innerhalb der angegebenen Scopes, und patcht genau diese Knoten, wo sich ein Wert geändert hat. Es gibt keinen Abhängigkeitsgraphen und keinen virtuellen Baum.</p>

      <h3>Warum zeigt meine Seite "false"?</h3>
      <p>Booleans werden als Text gerendert. <code>div(ok &amp;&amp; span('Done'))</code> zeigt "false". Nimm <code>when(() =&gt; ok, span('Done'))</code> für Kinder und <code>ok ? 'Done' : ''</code> für Text.</p>

      <h3>Warum ändert sich meine Listenzeile nicht, wenn ich das Element bearbeite?</h3>
      <p>Zeilen für Elemente, die noch in der Liste sind, bleiben erhalten und werden nicht erneut gerendert. Nimm dynamische Werte wie <code>() =&gt; todo.text</code> für Felder, die sich ändern. Siehe <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Warum hört ein Teil meiner UI auf, sich zu aktualisieren?</h3>
      <p>Meist waren seine Knoten nicht im Dokument, als <code>update()</code> lief. Nuclo hört auf, diese Knoten zu verfolgen, auch nachdem du sie angehängt hast, rendere also in einen Container, der im Dokument ist. Zwei weitere Ursachen: Ein <code>when()</code>, dessen Bedingung wirft, hört auf, sich zu aktualisieren, und eine Textfunktion, die bei ihrem ersten Durchlauf wirft, bleibt leer. Siehe <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Wann sollte ich <code>forceUpdate()</code> verwenden?</h3>
      <p>Nur für seltene Änderungen an statischen Werten, etwa einen Sprachwechsel. Für alles andere nimm <code>update()</code>. Siehe <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Wie bringe ich eine Seite in ein Layout, ohne sie als Prop durchzureichen?</h3>
      <p>Markiere die Stelle mit <code>region({ id: 'main' })</code> und lass die Seite <code>into('main', …)</code> zurückgeben. Siehe <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Wie unmounte ich eine App?</h3>
      <p>Wickle sie in <code>when()</code> und schalte die Bedingung ab. Das DOM selbst zu entfernen, führt <code>onDestroy</code> nicht aus. Siehe <a href="#lifecycle">Lebenszyklus</a>.</p>

      <h3>Enthält Nuclo einen Router?</h3>
      <p>Nicht im Kernpaket. Routing wird separat als <code>nuclo-router</code> ausgeliefert, mit serverseitigem Rendering, Hydration, code-gesplitteten Routen und Idle-Preloading. Installiere es mit <code>npm install nuclo nuclo-router</code>. Siehe <a href="#router-overview">nuclo-router</a>.</p>

      <h3>Hat Nuclo Effects?</h3>
      <p>Nein. <code>onMount</code> und <code>onDestroy</code> laufen einmal pro Element, gebunden an Einfügen und Entfernen. Nichts läuft erneut, weil sich irgendein Zustand geändert hat.</p>
    `,
      },
    ],
  },

];
