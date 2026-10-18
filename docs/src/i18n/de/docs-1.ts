import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "Einführung",
    sections: [
      {
        id: "overview",
        title: "Überblick",
        content: `
      <p>Nuclo ist eine kleine DOM-Bibliothek für TypeScript. Du baust deine Seite aus ganz normalen Funktionen wie <code>div()</code> und <code>button()</code>, hältst den State in schlichten Variablen und sagst Nuclo mit <code>update()</code> Bescheid, sobald sich etwas ändern soll.</p>
      <p>Dafür braucht es weder Virtual DOM noch Compiler, weder Proxies noch Signals.</p>
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
      <h3>Das mentale Modell</h3>
      <ol>
        <li>Du baust die UI aus Tag-Buildern.</li>
        <li>Alles, was vom State abhängt, gibst du als Funktion mit.</li>
        <li>Den State änderst du mit ganz normalem JavaScript.</li>
        <li>Dann rufst du <code>update()</code> auf. Nuclo führt die Funktionen noch einmal aus und patcht das DOM.</li>
      </ol>
      <p>Eine Variable zu ändern, lässt das DOM kalt. Die Seite bewegt sich erst, wenn du <code>update()</code> aufrufst.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Schnellstart",
        content: `
      <p><code>create-nuclo</code> richtet dir in einem Rutsch ein Vite- und TypeScript-Projekt ein, das sofort mit Nuclo loslegen kann:</p>
    `,
        afterContent: `
      <p>Das Tool fragt dich nach einem Projektnamen. Willst du die Rückfrage umgehen, gib den Namen samt Flags direkt mit. Bei npm gehört dafür ein <code>--</code> vor die Flags:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Danach Abhängigkeiten installieren und den Dev-Server starten:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Optionen</h3>
      <ul>
        <li><code>[project-name]</code>: Name des Zielordners, Standard ist <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: welches Template kopiert wird. Aktuell gibt es nur <code>basic</code>.</li>
        <li><code>-y, --yes</code>: keine Rückfragen, es gelten die Standardwerte.</li>
        <li><code>-f, --force</code>: schreibt auch in einen Ordner, der nicht leer ist.</li>
        <li><code>-h, --help</code>: zeigt die Hilfe an.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Installation und Importe",
        content: `
      <p>In ein bestehendes Projekt kommt Nuclo so:</p>
      ${sh("npm install nuclo")}
      <p>Genauso gut klappen <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> und <code>bun add nuclo</code>. Nuclo bringt keine Abhängigkeiten mit.</p>
      <p>Routing steckt nicht im Kernpaket. Das gibt es separat als <a href="#router-overview"><code>nuclo-router</code></a>, das du bei Bedarf einfach neben <code>nuclo</code> installierst.</p>
      <h3>Globals</h3>
      <p>Mit <code>import 'nuclo'</code> landet Folgendes auf <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 Tag-Builder</strong>: 112 für HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) und 63 für SVG, die ein <code>Svg</code>-Suffix tragen (<code>svgSvg</code>, <code>pathSvg</code>, …). Mehr dazu unter <a href="#tag-builders">Tag-Builder</a>.</li>
        <li><strong>16 Helfer</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> und <code>globalStyle</code>.</li>
      </ul>
      <p>Der Import muss laufen, bevor irgendein Code einen Builder aufruft. ES-Module werden in Import-Reihenfolge ausgeführt, deshalb knallt es hier:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Am sichersten steht <code>import 'nuclo'</code> ganz oben in deiner Entry-Datei, oder du importierst es in jeder Datei, die die Globals nutzt.</p>
      <h3>Benannte Imports</h3>
      <p>Die Helfer gibt es auch als benannte Exports, und zwar als genau dieselben Funktionen wie die Globals. Nur <code>getCssText()</code> und <code>resetStyles()</code> existieren ausschließlich als benannte Exports. Tag-Builder wiederum gibt es nur als Globals, <code>import { div } from 'nuclo'</code> funktioniert also nicht.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Entry Points</h3>
      <ul>
        <li><code>nuclo</code>: registriert die Globals und exportiert die 16 Helfer plus <code>getCssText</code> und <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> und <code>getCssText</code>. Siehe <a href="#api-ssr">Serverseitiges Rendering</a>.</li>
        <li><code>nuclo/polyfill</code>: ein winziges DOM für Node und Bun. Siehe <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: reine Typen. Siehe <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo bringt seine Typen selbst mit. Du musst nur zwei Dinge sicherstellen:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> und <code>nodenext</code> werden bisher nicht unterstützt.</li>
        <li>Die <code>DOM</code>-Lib. Die ist bei TypeScript von Haus aus dabei, solange du <code>lib</code> nicht überschreibst.</li>
      </ul>
      <p>Sobald irgendeine Datei im Projekt <code>'nuclo'</code> importiert, kennen alle Dateien die globalen Typen. Mehr ist nicht nötig. Importiert dagegen keine Datei Nuclo, etwa in einer separaten tsconfig für Tests, bindest du die Typen von Hand ein:</p>
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
      <p>Alternativ trägst du <code>/// &lt;reference types="nuclo/types" /&gt;</code> in eine <code>.d.ts</code>-Datei ein.</p>
      <h3>Nützliche Typen</h3>
      <p>Diese Typen sind global, du kannst sie also ohne Import verwenden:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: das, was ein Tag-Builder zurückgibt. Taugt als Rückgabetyp für Komponenten.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: alles, was ein Tag-Builder als Argument schluckt.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: der Rückgabetyp von <code>render()</code> und <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: ein beliebiger HTML-Tag-Name.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: das Attribut-Objekt eines Tag-Builders, samt <code>on*</code>-Handlern, <code>onMount</code> und <code>onDestroy</code>. Nimm diesen Typ für Komponenten, die Attribute weiterreichen.</li>
        <li><code>MountCallback</code> und <code>DestroyCallback</code>: die Handler für <code>onMount</code> und <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: die Rückgabetypen von <code>when()</code> und <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: die Optionen, die <code>region()</code> kennt.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> und die übrigen Styling-Typen. Die lassen sich auch importieren: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> macht jedes DOM-Member optional. Brauchst du den vollen Elementtyp, hilft ein Cast: <code>render(App, root) as HTMLDivElement</code>.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "UI bauen",
    sections: [
      {
        id: "tag-builders",
        title: "Tag-Builder",
        content: `
      <p>Jeder HTML-Tag existiert als globale Funktion gleichen Namens: <code>div</code>, <code>span</code>, <code>input</code>, … Eine Ausnahme gibt es: <code>&lt;var&gt;</code> heißt <code>var_</code>, weil <code>var</code> ein reserviertes Wort ist. Bei SVG-Tags hängt hinten immer ein <code>Svg</code> dran: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Ein Tag-Builder aufzurufen, erzeugt noch kein Element. <code>div('Hi')</code> liefert einen <strong>Builder</strong>, also eine Funktion, die das Element erst später baut. Nuclo ruft sie auf, wenn du den Builder per <code>render()</code> mountest oder in einen anderen Builder, in <code>when()</code> oder <code>list()</code> einsetzt. Jede Verwendung ergibt ein frisches Element.</p>
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
      <h3>Argumente</h3>
      <p>Ein Builder nimmt beliebig viele Argumente und arbeitet sie von links nach rechts ab:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: werden zu einem Textknoten.</li>
        <li><strong><code>() =&gt; value</code></strong>: Text, der sich bei <code>update()</code> mitbewegt. Siehe <a href="#dynamic-functions">Dynamische Werte</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: werden ignoriert.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: erscheinen als Text "true" bzw. "false". Für Bedingungen nimmst du <code>when()</code>.</li>
        <li><strong>Ein einfaches Objekt</strong>: Attribute. Siehe <a href="#attributes">Attribute</a>.</li>
        <li><strong>Ein <code>css()</code>-, <code>cx()</code>- oder <code>variants()</code>-Ergebnis</strong>: steuert seine Klassen bei.</li>
        <li><strong><code>on(...)</code></strong>: ein Event-Listener oder Lifecycle-Hook.</li>
        <li><strong>Ein anderer Builder, <code>when()</code> oder <code>list()</code></strong>: ein Kind.</li>
        <li><strong>Ein DOM-<code>Node</code></strong>: wird unverändert angehängt.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: ein eigener Modifier, dazu gleich mehr.</li>
      </ul>
      <h3>Typische Stolperfallen</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> zeigt dir den Text "false". Besser: <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Arrays zählen nicht als Kinder, du musst sie spreaden: <code>ul(...names.map((n) =&gt; li(n)))</code>. Bei Listen, die sich verändern, nimmst du <code>list()</code>.</li>
        <li>Eine lokale Variable mit Tag-Namen überdeckt den Builder. In <code>function Row(label: string)</code> lässt sich <code>label(...)</code> nicht mehr aufrufen. Benenne lokale Variablen wie <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> und <code>i</code> also lieber um.</li>
        <li>Browser machen jedes Element mit einer <code>id</code> zur globalen Variable. Steht <code>&lt;main id="main"&gt;</code> schon auf der Seite, bevor Nuclo lädt, lässt Nuclo dieses Global in Ruhe, und <code>main(...)</code> wirft einen <code>TypeError</code>. Wähle deshalb andere IDs.</li>
      </ul>
      <h3>Eigene Modifier</h3>
      <p>Eine Funktion, die mindestens einen Parameter deklariert, läuft beim Bauen des Elements genau einmal, und zwar in der Reihenfolge der Argumente. Ihr erstes Argument ist das Element. Das zweite ist ein interner Index, darauf solltest du dich nicht verlassen. Gibt die Funktion einen String oder eine Zahl zurück, wird daraus Text, ein <code>Node</code> wird angehängt, und bei einem Objekt setzt Nuclo dessen Einträge als Attribute.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>An das Element kommen</h3>
      <p><code>render()</code> gibt dir das Wurzelelement zurück. Mitten im Baum greifst du mit <code>on("mount", (el) =&gt; …)</code> oder einem eigenen Modifier darauf zu. Du kannst die Builder-Funktion auch selbst aufrufen und bekommst ein losgelöstes Element:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Häng es ein, bevor das nächste <code>update()</code> läuft. Ein Knoten, der beim Ausführen von <code>update()</code> nicht im Dokument steckt, fällt dauerhaft aus der Aktualisierung heraus.</p>
      <h3>SVG</h3>
      <p>SVG-Builder nehmen dieselben Argumente. Nuclo setzt jedes SVG-Attribut per <code>setAttribute</code>, Namen wie <code>"stroke-width"</code> funktionieren deshalb genau so, wie du sie schreibst.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Alle Builder</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Komponenten",
        content: `
      <p>Eine Komponente ist schlicht eine Funktion, die einen Builder wie <code>button(...)</code> zurückgibt. Eine eigene Komponenten-API gibt es nicht. Und es entsteht nichts, bevor du die Komponente renderst oder in einen Baum hängst.</p>
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
      <p>State, den du innerhalb der Funktion anlegst, gehört genau dieser Instanz. State außerhalb teilen sich alle Instanzen. <code>forceUpdate()</code> ruft die Komponenten neu auf und setzt damit den State zurück, der innen deklariert ist.</p>
      <p>Kinder sind ganz einfach Argumente:</p>
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
        title: "Attribute",
        content: `
      <p>Mit einem einfachen Objekt setzt du Attribute. Du darfst auch mehrere Objekte übergeben: Bei gleichem Schlüssel gewinnt der spätere Wert, nur <code>className</code> und <code>style</code> werden zusammengeführt. Ein Wert ist entweder statisch oder eine Funktion ohne Parameter, die bei jedem <code>update()</code> neu läuft.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Wie ein Wert gesetzt wird</h3>
      <ul>
        <li>Hat das HTML-Element eine Property dieses Namens (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), setzt Nuclo diese Property. Gibt es keine, ruft es <code>setAttribute(key, String(value))</code> auf, etwa bei <code>"aria-*"</code> und <code>"data-*"</code>.</li>
        <li>Bei SVG-Elementen läuft immer <code>setAttribute</code>.</li>
        <li><code>null</code> und <code>undefined</code> werden ignoriert. Liefert ein dynamischer Wert <code>null</code> oder <code>undefined</code>, bleibt der alte Wert stehen. Zum Löschen gibst du <code>""</code> zurück, bei booleschen Properties <code>false</code>.</li>
        <li>Booleans funktionieren bei booleschen DOM-Properties wie <code>disabled</code> an einem Button, <code>checked</code>, <code>hidden</code> und <code>required</code>. Überall sonst landen <code>true</code> und <code>false</code> als die Strings "true" und "false" im Attribut.</li>
        <li>Nimm <code>"data-*"</code>-Schlüssel. <code>dataset</code> wird nicht unterstützt.</li>
        <li><code>innerHTML</code> wird nicht escaped und beim serverseitigen Rendering nicht ausgegeben. Lass lieber die Finger davon.</li>
      </ul>
      <h3>Klassen</h3>
      <p>Setz <code>className</code> ein. Statische Klassen-Strings, <code>css()</code>-Ergebnisse und ein dynamisches <code>className</code> werden alle zusammengeführt. Ein dynamisches <code>className</code> lässt die statischen Klassen unangetastet, und liefert es <code>""</code>, bleiben genau diese übrig.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Verwende bei HTML-Elementen nicht den Schlüssel <code>class</code>. Er schreibt das rohe Attribut und überschreibt damit alle Klassen, die vorher gesetzt wurden, auch die aus <code>css()</code>.</p>
      <h3>Inline-Styles</h3>
      <p><code>style</code> erwartet ein Objekt mit camelCase-Schlüsseln oder eine Funktion, die ein solches Objekt liefert.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Einheiten ergänzt Nuclo nicht. Schreib <code>"12px"</code>, nicht <code>12</code>. Nur einheitenlose Properties wie <code>opacity</code> und <code>zIndex</code> nehmen Zahlen.</li>
        <li><code>""</code>, <code>null</code> und <code>undefined</code> löschen eine Property.</li>
        <li>Ein dynamischer Style setzt nur die Schlüssel, die er gerade zurückgibt. Fällt ein Schlüssel weg, behält er seinen alten Wert. Zum Löschen musst du also <code>""</code> liefern.</li>
        <li>Style-Strings (<code>"color: red"</code>) und Custom Properties (<code>"--gap"</code>) werden nicht unterstützt. Greif dafür zu <code>css()</code>, das Custom Properties über <a href="#style-objects"><code>raw</code></a> annimmt.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Events",
        content: `
      <p>Auf Events hörst du auf zwei Arten: mit <code>on*</code>-Attributen oder mit dem <code>on()</code>-Modifier.</p>
      <h3><code>on*</code>-Attribute</h3>
      <p>Steht in einem Attribut-Objekt unter einem Schlüssel wie <code>onClick</code> (<code>on</code> plus Großbuchstabe) eine Funktion, behandelt Nuclo sie als Event-Handler und nicht als dynamischen Wert.</p>
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
        <li>TypeScript leitet den Event-Typ aus Schlüssel und Element ab. <code>e.currentTarget</code> und <code>this</code> zeigen auf das Element.</li>
        <li>Nuclo setzt die native Property, aus <code>onClick</code> wird also <code>el.onclick</code>. Pro Event gibt es genau einen Handler: Ein späteres <code>onClick</code> überschreibt ein früheres.</li>
        <li><code>onDoubleClick</code> und <code>onDblClick</code> meinen beide <code>dblclick</code>. Schlüssel in Kleinbuchstaben wie <code>onclick</code> sind ein Typfehler.</li>
        <li>Ein Name, der kein bekanntes Event ist, hört auf seine kleingeschriebene Form: <code>onMyEvent</code> lauscht auf <code>"myevent"</code>.</li>
        <li>Wirft der Handler einen Fehler, fängt Nuclo ihn nicht ab.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> liefert einen Modifier, der auf dem Element <code>addEventListener</code> aufruft.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Jedes <code>on()</code> registriert einen weiteren Listener. Alle laufen nacheinander.</li>
        <li><code>options</code> geht unverändert an <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Gibst du <code>on()</code> direkt an einen Builder, wird der Elementtyp mitgeführt: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Wirft ein Listener, loggt Nuclo den Fehler per <code>console.error</code>, und die übrigen Listener laufen trotzdem.</li>
        <li>Entfernt Nuclo das Element, räumt es den Listener gleich mit weg. Auf dem Server macht <code>on()</code> nichts.</li>
        <li>Einen <code>on()</code>-Wert kannst du auf beliebig vielen Elementen wiederverwenden.</li>
      </ul>
      <p>Für ein eigenes Event gibst du den Event-Typ als Generic mit:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Was wann?</h3>
      <p>Im Alltag reichen <code>on*</code>-Attribute. Zu <code>on()</code> greifst du, wenn du mehrere Listener für ein Event, Listener-Optionen oder einen eigenen Event-Namen wie <code>"my-event"</code> brauchst.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Lifecycle",
        content: `
      <p><code>onMount</code> läuft einmal, sobald das Element eingefügt ist. <code>onDestroy</code> läuft einmal, wenn Nuclo das Element entfernt. Du schreibst beide als Attribut oder mit <code>on()</code>. Beide Varianten verhalten sich gleich, und das Element ist über seinen Tag typisiert.</p>
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
      <h3>Wann sie laufen</h3>
      <ul>
        <li><code>onMount</code> läuft am Ende des Aufrufs von <code>render()</code>, <code>hydrate()</code>, <code>update()</code> oder <code>forceUpdate()</code>, der das Element eingefügt hat. Während der Baum noch gebaut wird, läuft es nie.</li>
        <li>Gibt <code>onMount</code> eine Funktion zurück, führt Nuclo sie beim Destroy aus, nach den <code>onDestroy</code>-Callbacks des Elements.</li>
        <li><code>onDestroy</code> läuft, sobald Nuclo das Element entfernt: wenn eine <code>list()</code>-Zeile wegfällt, ein <code>when()</code>-Zweig wechselt, ein <code>into()</code> seine Region verlässt oder <code>forceUpdate()</code> das Element verwirft. Das passiert unmittelbar vor dem Entfernen, das Element hängt also noch im Dokument.</li>
      </ul>
      <h3>Direkt aus dem DOM entfernen</h3>
      <p>Entfernst du ein Element selbst, mit <code>node.remove()</code> oder <code>innerHTML = ''</code>, laufen sein <code>onDestroy</code> und seine Cleanups nie, und Timer ticken munter weiter. Ein <code>unmount()</code> kennt Nuclo nicht. Willst du eine App sauber mit Cleanup abbauen, häng sie in ein <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Reihenfolge und Fehler</h3>
      <ul>
        <li>Du kannst beliebig viele Hooks registrieren, in beiden Schreibweisen. Sie laufen in der Reihenfolge, in der du sie angelegt hast.</li>
        <li><code>onDestroy</code> trifft immer zuerst die Kinder, dann den Elternknoten.</li>
        <li>Elemente mounten in der Reihenfolge ihres jeweils ersten <code>onMount</code>-Hooks, die wiederum der Argument-Reihenfolge folgt, und jedes Element führt alle seine Hooks am Stück aus. Hängt ein Kind vom Hook seines Elternknotens ab, übergib diesen also vor dem Kind.</li>
        <li>Wirft ein Hook, wird der Fehler per <code>console.error</code> geloggt. Die anderen Hooks laufen weiter.</li>
        <li>Der Callback darf nichts oder eine Cleanup-Funktion zurückgeben, mach ihn deshalb nicht <code>async</code>. Ein zurückgegebenes Promise wird nie als Cleanup benutzt. Asynchrone Arbeit stößt du stattdessen im Callback an: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Auf dem Server laufen Hooks nie. Im Client laufen sie nach <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Gut zu wissen:</strong> Hooks sind keine Effects. Sie laufen nicht erneut, wenn sich der State ändert, sondern pro Element höchstens einmal.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "Aktualisierungen",
    sections: [
      {
        id: "explicit-updates",
        title: "Explizite Updates",
        content: `
      <p>Nuclo aktualisiert die Seite nie auf eigene Faust. Du änderst den State und rufst dann <code>update()</code> auf. Fertig.</p>
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
      <p>Du darfst so viel State ändern, wie du willst, und rufst <code>update()</code> trotzdem nur einmal auf:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Ruf <code>update()</code> aus Event-Handlern, Timern, Fetch-Callbacks oder <code>onMount</code> heraus auf, aber nicht innerhalb eines dynamischen Werts.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Dynamische Werte",
        content: `
      <p>Eine Funktion <strong>ohne Parameter</strong> ist ein <strong>dynamischer Wert</strong>. Nuclo führt sie einmal aus, wenn es das Element baut, und danach bei jedem <code>update()</code> wieder. Dynamische Werte passen zu Text-Kindern, Attributwerten, <code>style</code> und <code>className</code>. Für Kinder, die auftauchen, verschwinden oder sich wiederholen, gibt es <a href="#api-when"><code>when()</code></a> und <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo schaut dafür auf die Parameteranzahl (<code>fn.length</code>). Eine Funktion mit einem Parameter ist ein <a href="#tag-builders">eigener Modifier</a> und läuft nur einmal. <code>(x = 0) =&gt; …</code> und <code>(...args) =&gt; …</code> haben die Länge 0 und gelten daher als dynamisch.</p>
      <h3>Dynamischer Text</h3>
      <ul>
        <li>Ein String, eine Zahl, ein bigint oder ein Boolean wird als <code>String(value)</code> gerendert. <code>() =&gt; ok &amp;&amp; 'Saved'</code> würde "false" anzeigen, schreib deshalb <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> und <code>undefined</code> ergeben leeren Text.</li>
        <li>Liefert die Funktion im ersten Durchlauf ein <code>css()</code>- oder <code>cx()</code>-Ergebnis, wird sie zur dynamischen Klasse statt zu Text. Siehe <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Ein Node, Builder, Array oder einfaches Objekt rendert nichts und wird nie aktualisiert.</li>
      </ul>
      <h3>Dynamische Attribute</h3>
      <ul>
        <li>Nuclo schreibt einen Wert nur, wenn er sich vom zuletzt von Nuclo geschriebenen unterscheidet. Das Live-DOM wird dabei nicht verglichen. Tippt jemand in ein Input und deine Funktion liefert denselben Wert wie zuvor, bleibt der getippte Text also stehen.</li>
        <li>Bei <code>null</code> oder <code>undefined</code> schreibt Nuclo nichts, der alte Wert bleibt. Nur <code>className</code> macht eine Ausnahme: Jedes falsy Ergebnis entfernt die dynamischen Klassen, die statischen bleiben.</li>
        <li>Eine <code>style</code>-Funktion wendet das zurückgegebene Objekt bei jedem Update an.</li>
      </ul>
      <h3>Fehler</h3>
      <p>Wirft die Funktion eines dynamischen Werts, fängt Nuclo den Fehler ab, und der Rest des Updates läuft normal weiter. Text bleibt dann leer oder behält seinen alten Wert, ein Attribut ebenso. Beim nächsten erfolgreichen <code>update()</code> fangen sich beide wieder. Einzige Ausnahme: Eine Textfunktion, die gleich im <strong>ersten</strong> Durchlauf wirft, bleibt für immer leer.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Geht synchron über jeden dynamischen Wert auf der Seite. Übergibst du IDs, aktualisiert es nur, was innerhalb der Elemente liegt, die mit diesen <a href="#api-scope"><code>scope()</code></a>-IDs markiert sind. Ein Durchlauf arbeitet diese Schritte der Reihe nach ab:</p>
      <ol>
        <li><code>list()</code>: liest die Items neu ein und fügt Zeilen hinzu, verschiebt oder entfernt sie.</li>
        <li><code>when()</code>: wertet die Bedingungen erneut aus. Ein Zweig wird nur dann neu gebaut, wenn ein anderer Zweig aktiv wird.</li>
        <li>Dynamische Attribute, auch <code>style</code> und <code>className</code>.</li>
        <li>Dynamischer Text.</li>
        <li><code>onMount</code> für die Elemente, die in Schritt 1 und 2 eingefügt wurden.</li>
      </ol>
      <ul>
        <li><strong>Es läuft alles.</strong> Jeder dynamische Wert wird bei jedem Aufruf ausgeführt, auch wenn sich seine Daten nicht geändert haben. Nur der Schreibzugriff aufs DOM entfällt. Halte dynamische Werte deshalb schnell und frei von Seiteneffekten.</li>
        <li><strong>Nur Knoten im Dokument.</strong> Steckt ein Knoten beim Ausführen von <code>update()</code> nicht im Dokument, verliert Nuclo ihn aus den Augen. Er wird nie wieder aktualisiert, auch dann nicht, wenn du ihn später einhängst. Das gilt genauso für <code>list()</code> und <code>when()</code>. Rendere in einen Container, der im Dokument liegt.</li>
        <li><strong>Statische Werte bleiben, wie sie sind.</strong> Einfache Strings und Attributwerte werden beim Bauen des Elements festgelegt. Willst du sie neu bauen lassen, nimm <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Fehler.</strong> Fehler in Text und Attributen werden abgefangen, der Durchlauf geht weiter. Wirft eine <code>when()</code>-Bedingung, wird der Fehler geloggt, und dieses <code>when()</code> aktualisiert sich nicht mehr. Wirft die <code>items</code>- oder <code>renderItem</code>-Funktion eines <code>list()</code>, reicht Nuclo den Fehler aus <code>update()</code> nach außen, und die restlichen Schritte entfallen.</li>
        <li><strong>Server.</strong> Auf dem Server macht <code>update()</code> nichts.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Gibt dem Element, an das du es übergibst, eine oder mehrere Scope-IDs. Danach aktualisiert <code>update('id')</code> nur noch, was in diesem Element liegt, einschließlich der Attribute des Elements selbst.</p>
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
        <li>Ein Element darf mehrere IDs haben: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> aktualisiert alles innerhalb von <code>a</code> oder <code>b</code>. Teilen sich mehrere Elemente dieselbe id, werden alle aktualisiert.</li>
        <li>Bei verschachtelten Scopes schließt <code>update('outer')</code> den inneren Scope mit ein, <code>update('inner')</code> berührt den äußeren dagegen nicht.</li>
        <li>Gehört zu einer ID kein Element im Dokument, wird <strong>nichts</strong> aktualisiert, und es gibt auch keinen Fehler. Achte also auf die Schreibweise.</li>
        <li>Auf dem Server macht <code>scope()</code> nichts.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Rendert Inhalt abhängig von einer Bedingung. Bei jedem <code>update()</code> wertet Nuclo die Bedingungen neu aus, und die erste wahre gewinnt. Trifft keine zu, kommt der <code>.else()</code>-Inhalt zum Zug. Ohne <code>.else()</code> bleibt die Stelle leer.</p>
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
      <h3>Bedingungen</h3>
      <ul>
        <li>Für State übergibst du eine Funktion. Ein einfacher Boolean wird nur einmal gelesen: <code>when(open, …)</code> ändert sich nie.</li>
        <li>In TypeScript muss die Funktion einen Boolean liefern. Schreib <code>() =&gt; items.length &gt; 0</code> oder <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Was aktualisiert wird</h3>
      <ul>
        <li>Solange derselbe Zweig aktiv bleibt, behält Nuclo seine Elemente. Dynamische Werte, Listen und <code>when()</code>-Blöcke darin werden weiter aktualisiert.</li>
        <li>Wird ein anderer Zweig aktiv, fliegt der alte Inhalt raus, und seine <code>onDestroy</code>-Hooks laufen. Der neue Zweig entsteht komplett frisch, samt seiner <code>onMount</code>-Hooks. State in den alten Elementen, etwa Input-Text oder Fokus, ist damit weg.</li>
      </ul>
      <h3>Was in einen Zweig gehört</h3>
      <p>In einen Zweig setzt du Kinder: Text, dynamischen Text, Builder, <code>list()</code> und verschachtelte <code>when()</code>. Gib Builder wie <code>p('Hi')</code> mit und keine DOM-Knoten. Ein DOM-Knoten wird nicht mehr aktualisiert, sobald sein Zweig einmal ausgeblendet war.</p>
      <p>Attribut-Objekte und <code>on()</code> innerhalb eines Zweigs gelten für das Elternelement und bleiben auch nach dem Ausblenden des Zweigs bestehen. Für ein bedingtes Attribut nimmst du ein dynamisches Attribut: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Verketten</h3>
      <p><code>.when()</code> und <code>.else()</code> liefern jeweils einen neuen Builder und lassen das Original unverändert. Rufst du <code>.else()</code> zweimal auf, setzt sich der letzte Aufruf durch.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Rendert pro Item eine Zeile. Bei jedem <code>update()</code> ruft Nuclo <code>items()</code> neu auf und ordnet die neuen Items den vorhandenen Zeilen über ihre Identität (<code>===</code>) zu.</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Wie Zeilen zugeordnet werden</h3>
      <ul>
        <li>Ein Item, das noch vorhanden ist, behält seine Zeile. Nuclo verschiebt sie bei Bedarf, ruft <code>renderItem</code> aber nicht noch einmal auf.</li>
        <li>Ein neues Item bekommt eine neue Zeile. Fällt ein Item weg, verschwindet auch seine Zeile, und seine <code>onDestroy</code>-Hooks laufen.</li>
        <li>Doppelte Items bekommen jeweils eine eigene Zeile.</li>
        <li>Das Array darfst du direkt verändern (<code>push</code>, <code>splice</code>, <code>sort</code>) oder ein neues zurückgeben.</li>
      </ul>
      <p>Eine übernommene Zeile wird nie neu gerendert. Für Felder, die sich ändern können, brauchst du deshalb dynamische Werte:</p>
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
      <p>Kopien zählen als neue Items. Ersetzt du das Array durch <code>todos.map((t) =&gt; ({ ...t }))</code>, wird deshalb jede Zeile neu gebaut.</p>
    `,
        afterContent: `
      <h3>Was <code>renderItem</code> zurückgibt</h3>
      <ul>
        <li>Gib ein Element zurück, zum Beispiel <code>li(...)</code>, <code>tr(...)</code> oder einen SVG-Builder. Mit <code>null</code> oder <code>undefined</code> überspringst du ein Item. Strings, Textknoten und Fragmente rendern nichts.</li>
        <li>Gib <code>when()</code> oder <code>list()</code> nicht direkt zurück. Pack sie ins Zeilenelement: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Willst du Items ausblenden, filtere in <code>items()</code> und nicht in <code>renderItem</code>.</li>
        <li>Halte <code>renderItem</code> frei von Seiteneffekten. Nuclo kann es für dasselbe Item auch mehrfach aufrufen.</li>
      </ul>
      <h3>Der Index</h3>
      <p><code>index</code> ist die Position, die das Item hatte, als seine Zeile entstand. Beim Verschieben von Zeilen wird er nicht nachgeführt. Die aktuelle Position holst du dir über einen dynamischen Wert: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iterables</h3>
      <p>Jedes Iterable ist erlaubt: Arrays, <code>Set</code>, Generatoren und <code>map.values()</code>. Jedes Mal dasselbe Array oder <code>Set</code> zurückzugeben, ist völlig in Ordnung. Ein Iterator wie ein Generator oder <code>map.values()</code> ist nach einem Durchlauf aufgebraucht, erzeuge ihn also bei jedem Aufruf innerhalb von <code>items()</code> neu. Eine <code>Map</code> direkt zu iterieren liefert jedes Mal neue <code>[key, value]</code>-Arrays, wodurch jede Zeile neu gebaut wird. Nimm stattdessen <code>map.values()</code>.</p>
      <h3>Platzierung</h3>
      <p>Die Zeilen landen dort, wo <code>list()</code> unter seinen Geschwistern steht, eingerahmt von zwei Kommentar-Markern. Andere Kinder desselben Elternelements bleiben unberührt. <code>list()</code> funktioniert auch innerhalb von SVG-Buildern.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() & into()",
        content: `
      <p><code>region()</code> markiert im Baum eine benannte Stelle, und <code>into()</code> füllt sie von beliebiger Stelle aus, egal wie tief. Das Layout bekommt den Inhalt nicht als Prop gereicht, und die Komponente, die den Inhalt baut, muss nicht wissen, wo er am Ende landet.</p>
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
      <h3>So funktioniert es</h3>
      <ul>
        <li><code>into()</code> lässt an seiner Stelle nur einen Kommentar zurück. Der eigentliche Inhalt wird zwischen den Markern der Region gerendert.</li>
        <li>Die Reihenfolge spielt keine Rolle. Ein <code>into()</code>, das vor seiner Region gebaut wird, wartet einfach und taucht in dem Moment auf, in dem die Region entsteht. Views erscheinen in der Reihenfolge, in der sie geschrieben wurden.</li>
        <li>Der Inhalt lebt so lange wie die View. Schließt das <code>when()</code> um ein <code>into()</code> oder verschwindet dessen <code>list()</code>-Zeile, verlässt der Inhalt die Region. Öffnest du es erneut, kommt eine Kopie dazu, nicht zwei.</li>
        <li>Verschwindet eine Region, etwa weil ihr <code>when()</code> schließt, warten ihre Views wieder. Baust du später eine Region mit derselben id, zeigt sie diese Views an.</li>
        <li>Passt die id eines <code>into()</code> zu keiner Region, rendert es nichts und wirft auch keinen Fehler. Prüfe also die Schreibweise.</li>
        <li>Ids sind im Baum eindeutig. Baust du eine zweite Region unter einer aktiven id, loggt Nuclo eine Warnung.</li>
        <li>Regionen arbeiten mit <a href="#api-ssr">serverseitigem Rendering</a> zusammen. Bei <code>hydrate()</code> übernimmt jede View das serverseitig gerenderte HTML, statt es neu zu bauen.</li>
      </ul>
      <h3>Optionen</h3>
      <ul>
        <li><code>id</code>: der Name, unter dem <code>into()</code>-Aufrufe die Region finden.</li>
        <li><code>type</code>: <code>'latest'</code> (Standard) zeigt nur die neueste View, <code>'stack'</code> zeigt alle Views in der Reihenfolge ihres Eintreffens.</li>
        <li><code>empty</code>: wird gerendert, solange die Region keine Views enthält.</li>
      </ul>
      <h3>Gestapelte Regionen</h3>
      <p>Mit <code>type: 'stack'</code> baut eine View, die sich über einer anderen öffnet, die darunterliegende nicht neu. DOM, Fokus und Formular-State bleiben erhalten. Das ist ideal für eine Ebene wie einen Dialog über einer Seite.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>Mehrere Regionen auf einmal</h3>
      <p>Mit einem Objekt füllst du aus einem einzigen <code>into()</code> gleich mehrere Regionen. Ein Wert kann ein einzelnes Kind oder ein Array von Kindern sein. Beides lässt sich verschachteln: Ein <code>into()</code> im Inhalt einer anderen View zielt auf seine eigene Region.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Ein Dialog, der tief im Baum aufgeht</h3>
      <p>Die Overlay-Region sitzt ganz oben an der Wurzel. Jede Komponente, in beliebiger Tiefe, öffnet einen Dialog, indem sie ein <code>into()</code> in ein <code>when()</code> packt. Schließt das <code>when()</code>, verschwindet der Dialog wieder aus der Region.</p>
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
      <h3>Toasts aus Listenzeilen</h3>
      <p>Jede Zeile einer <code>list()</code> ist eine View. Eine gestapelte Region zeigt sie der Reihe nach an, und wer ein Item aus dem Array nimmt, nimmt damit auch seinen Toast weg.</p>
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
      <h3>Ein Seitentitel, den die Seite selbst setzt</h3>
      <p>Beim Standard <code>type: 'latest'</code> gewinnt die neueste View. Das Layout besitzt die Überschrift, und die gerade offene Seite gibt ihr ihren Namen. Eine Seite ohne <code>into('title', …)</code> lässt den <code>empty</code>-Text stehen.</p>
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
      <h3>Dynamische Werte innerhalb einer View</h3>
      <p>Der Inhalt eines <code>into()</code> ist ganz gewöhnlicher Nuclo-Inhalt. Funktionen darin sind stateabhängige Werte und werden bei <code>update()</code> aktualisiert, egal wo die Region sitzt.</p>
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
      <h3>Eine Region, die kommt und geht</h3>
      <p>Das <code>into()</code> des Dashboards schreibst du nur einmal. Solange der Nutzer abgemeldet ist, gibt es keine <code>main</code>-Region, die View wartet also. Beim Anmelden entsteht die Region, und die View taucht auf. Beim Abmelden verschwindet die Region, und die View wartet wieder.</p>
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
      <h3>Eine View mit eigener Region</h3>
      <p>Eine View kann selbst eine <code>region()</code> enthalten, auf die andere Views zielen. Hier bringt die Editor-Seite eine <code>tabs</code>-Region mit, und jeder Tab füllt sie. Schließt der Editor, geht seine Region mit.</p>
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
      <h3>Live-Beispiel</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> führt nur dynamische Werte aus. Statische Werte, etwa der Text in <code>h1(labels[lang].title)</code>, stehen schon beim Bauen des Baums fest. <code>forceUpdate()</code> ruft deine Komponenten noch einmal auf und gleicht das Live-DOM mit dem Ergebnis ab, statische Werte eingeschlossen. Das lohnt sich bei seltenen, app-weiten Änderungen wie dem Sprachwechsel. Für alles andere bleibst du bei <code>update()</code>.</p>
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
      <p>Ohne Argumente baut <code>forceUpdate()</code> jede Wurzel neu, die mit <code>render(App)</code> oder <code>hydrate(App)</code> gerendert wurde. Wurzeln aus <code>render(App())</code> überspringt es. Wirft eine Komponente, wird der Fehler geloggt, und diese Wurzel behält ihr altes DOM. Auch ein Fehler, der erst später beim Anwenden des neuen Builds auftritt, wird geloggt, nur bleiben die bereits gepatchten Teile gepatcht.</p>
      <h3>Was bleibt und was sich ändert</h3>
      <ul>
        <li>Kinder werden der Reihe nach über ihren Tag zugeordnet. Ein passendes Element wird wiederverwendet, Fokus und getippte Input-Werte bleiben also erhalten, und seine <code>onMount</code>-Hooks laufen nicht noch einmal. Sobald sich der Tag eines Kindes unterscheidet, wird dieses Kind samt allen folgenden Geschwistern neu gebaut.</li>
        <li>Text, Attribute, Klassen, Styles, Listener, <code>when()</code>-Zweige und <code>list()</code>-Zeilen richten sich nach dem neuen Build.</li>
        <li>Neue Elemente werden erzeugt, und ihre <code>onMount</code>-Hooks laufen. Elemente, die der neue Build nicht mehr hervorbringt, werden entfernt, und ihre <code>onDestroy</code>-Hooks laufen.</li>
        <li>Auch <code>list()</code>-Zeilen werden nach Position zugeordnet, nicht nach Item. Ein wiederverwendetes Zeilenelement kann am Ende deshalb ein anderes Item zeigen.</li>
        <li>Attribute, die der neue Build nicht mehr setzt, werden nicht entfernt.</li>
      </ul>
      <div class="docs-callout"><strong>Achtung:</strong> State, der innerhalb einer Komponentenfunktion deklariert ist, wird zurückgesetzt, weil die Funktion erneut läuft. Was überleben soll, gehört außerhalb der Komponente.</div>
      <p><strong>Explizite Form.</strong> <code>forceUpdate(App(), parent)</code> baut einen Baum in <code>parent</code> neu auf und gibt seine Wurzel zurück. Die Wurzel wird dabei nicht für spätere Aufrufe registriert. Wie <code>hydrate()</code> erwartet es, dass die Wurzel der erste Knoten in <code>parent</code> ist. Hat der erste Knoten einen anderen Tag, wird er ersetzt.</p>
      <p>Auf dem Server macht <code>forceUpdate()</code> nichts.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "Rendern",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>Baut deinen Baum und hängt dessen Wurzelelement an <code>parent</code> an. Standardmäßig ist <code>parent</code> der <code>document.body</code>. Zurück kommt das Wurzelelement.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Du kannst die Komponente (<code>render(App)</code>) oder den Builder übergeben, den sie liefert (<code>render(App())</code>). Das DOM sieht in beiden Fällen gleich aus. Nur bei <code>render(App)</code> kann <a href="#api-force-update"><code>forceUpdate()</code></a> die Wurzel später neu bauen, bevorzuge diese Variante also.</li>
        <li>Das Element wird nur angehängt, <code>parent</code> wird nicht geleert. Zweimal aufgerufen, landen also zwei Kopien im DOM.</li>
        <li>Wenn <code>render()</code> zurückkehrt, ist jedes <code>onMount</code> im Baum bereits gelaufen.</li>
        <li>Rendere in ein Element, das im Dokument hängt. Siehe <a href="#api-update"><code>update()</code></a>.</li>
        <li>Die Wurzel muss ein Element sein, etwa <code>div(...)</code>, nicht <code>when()</code> oder <code>list()</code>.</li>
        <li><code>index</code> ist intern und bestimmt nicht, wo das Element eingefügt wird. Lass es einfach weg.</li>
      </ul>
      <p>Eine Komponente, die du als <code>render(App)</code> übergibst, darf keine Parameter haben. Ein Pflichtparameter ist ein Typfehler. Ein optionaler Parameter besteht die Typprüfung, aber <code>render()</code> wirft dann zur Laufzeit. Eine Komponente mit Props verpackst du in eine Funktion:</p>
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
      <p>Übernimmt HTML, das <a href="#api-ssr"><code>renderToString()</code></a> erzeugt hat. Es verwendet die vorhandenen Elemente weiter, hängt Event-Listener an und verdrahtet dynamische Werte, <code>when()</code> und <code>list()</code>, damit <code>update()</code> danach funktioniert. Zum Schluss laufen die <code>onMount</code>-Hooks. <code>parent</code> ist standardmäßig <code>document.body</code>, zurück kommt das Wurzelelement.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Nimm dieselbe Komponente und dieselben Daten wie auf dem Server.</li>
        <li>Hydriere in einen eigenen Container. Die Wurzel der App muss dessen erster Knoten sein, Whitespace davor ist aber okay. Steht ein anderer Knoten vorn, ersetzt Nuclo genau diesen Knoten und lässt die Server-Kopie zurück.</li>
        <li>Wie bei <code>render()</code> übergibst du <code>App</code> und nicht <code>App()</code>, damit <code>forceUpdate()</code> die Wurzel später neu bauen kann. <code>App</code> darf keine Parameter haben. Bei einem optionalen Parameter hängt <code>hydrate()</code> stillschweigend nichts an. Eine Komponente mit Props verpackst du in eine Funktion: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Gibt es kein Server-HTML, nimm <code>render()</code>.</li>
      </ul>
      <h3>Wenn Server und Client auseinanderlaufen</h3>
      <p>Der Client hat das letzte Wort:</p>
      <ul>
        <li>Anderer Wurzel-Tag: Dieser Knoten wird durch frisches DOM ersetzt. Leerer Container: Frisches DOM wird angehängt.</li>
        <li>Abweichender Text wird gepatcht. Unterschiedliche <code>list()</code>-Items und <code>when()</code>-Zweige richten sich nach dem Client.</li>
        <li>Überzählige Server-Kinder werden entfernt, fehlende neu erzeugt.</li>
        <li>Attribute, die der Server geschrieben hat, der Client aber nicht setzt, bleiben unverändert.</li>
      </ul>
      <p><code>renderToString()</code> schreibt HTML-Kommentare als Marker, etwa <code>&lt;!-- text-0 --&gt;</code> vor jedem Textknoten. <code>hydrate()</code> ist auf sie angewiesen, entferne also keine Kommentare aus dem Server-HTML. Fehlen die Marker, löscht die Hydration die <code>list()</code>-Zeilen, und <code>list()</code> und <code>when()</code> aktualisieren sich nicht mehr.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Serverseitiges Rendering",
        content: `
      <p>Rendert eine Komponente auf dem Server zu einem HTML-String. Im Browser ruft dann <a href="#api-hydrate"><code>hydrate()</code></a> mit derselben Komponente auf, um dieses HTML zum Leben zu erwecken. Server-Runtimes haben kein <code>document</code>, importiere deshalb zuerst <a href="#api-polyfill"><code>nuclo/polyfill</code></a>.</p>
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
      <p>Lass <code>id="nuclo-styles"</code> am Style-Tag stehen. Der Client übernimmt dieses Element und ergänzt nur neue Regeln. Siehe <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Was auf dem Server läuft</h3>
      <ul>
        <li>Jeder Aufruf von <code>renderToString()</code> baut den Baum und führt jeden dynamischen Wert einmal aus.</li>
        <li>Event-Handler, <code>onMount</code> und <code>onDestroy</code> laufen nie. <code>update()</code>, <code>scope()</code> und <code>forceUpdate()</code> sind wirkungslos.</li>
        <li>Das Rendering ist synchron. Lade deine Daten also zuerst und rendere danach.</li>
        <li>Nach einem Render bleibt nichts registriert, ein Prozess kann daher beliebig viele Requests bedienen. Request-Daten reichst du als Argumente durch, etwa <code>renderToString(Page(user))</code>. Variablen auf Modulebene teilen sich alle Requests.</li>
        <li>Ruf <code>render()</code> nicht auf dem Server auf. Es hängt an den geteilten <code>document.body</code> an.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Nimmt einen Builder (<code>App()</code>), eine Komponente (<code>App</code>) oder einen DOM-Knoten. Bei <code>null</code> und <code>undefined</code> kommt <code>""</code> zurück. Die Wurzel muss ein Element sein. Eine Komponente, die du als <code>renderToString(Page)</code> übergibst, darf keine Parameter haben. Braucht sie Daten, übergib also <code>Page(user)</code>.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Text- und Attributwerte werden HTML-escaped. Text innerhalb von <code>script()</code> und <code>style()</code> wird unverändert ausgegeben, lediglich schließende Tags werden aufgebrochen. Setz dort also nie Nutzereingaben ein.</li>
        <li>Fehler reicht es nicht an den Aufrufer weiter. Wirft die Komponente, eine <code>list()</code>-Funktion oder eine <code>when()</code>-Bedingung, oder fehlt der Polyfill, loggt es den Fehler und gibt <code>""</code> zurück. Soll der Request in dem Fall fehlschlagen, prüfe auf ein leeres Ergebnis. Wirft eine Text- oder Attributfunktion, entsteht lediglich ein leerer Wert.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Entspricht <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Verpackt die Ausgabe in ein Container-Element. <code>containerTag</code> ist standardmäßig <code>"div"</code>, <code>containerAttrs</code> standardmäßig <code>{}</code>. Attributwerte werden escaped, Attributnamen dagegen unverändert geschrieben, nimm also HTML-Namen wie <code>class</code>. Nutzereingaben gehören nie in den Tag.</p>
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
      <p>Ein kleines DOM, mit dem Nuclo auch in Node und Bun Bäume bauen kann. Importiere es einmal, vor dem ersten Render. Die meisten Apps kommen mit dem simplen Import aus.</p>
      <ul>
        <li>Gibt es kein <code>window</code>, setzt es <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> und <code>HTMLElement</code>, aber nur, was noch fehlt. Ein <code>window</code> erzeugt es nicht.</li>
        <li>Im Browser oder unter jsdom macht es nichts.</li>
        <li><code>Event</code> und <code>CustomEvent</code> sind die eigenen Konstruktoren der Runtime. <code>Node</code>, <code>Element</code> und <code>HTMLElement</code> sind Aliase auf die Polyfill-Klassen.</li>
      </ul>
      <p>Es ist ein DOM zum Bauen von Bäumen, kein Browser. Es hat weder <code>innerHTML</code> noch <code>getElementById</code>, <code>querySelector()</code> liefert <code>null</code>, und Event-Listener werden ignoriert. Das HTML holst du dir mit <code>renderToString()</code>.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
