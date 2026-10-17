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
      <p>Nuclo ist eine kleine DOM-Bibliothek für TypeScript. Du baust die Seite mit einfachen Funktionen wie <code>div()</code> und <code>button()</code>, hältst den State in gewöhnlichen Variablen und rufst <code>update()</code> auf, wenn sich die Seite ändern soll.</p>
      <p>Nuclo hat kein virtuelles DOM, keinen Compiler, keine Proxies und keine Signals.</p>
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
        <li>Baue die UI mit Tag-Buildern.</li>
        <li>Übergib eine Funktion für jeden Wert, der vom State abhängt.</li>
        <li>Ändere den State mit normalem JavaScript.</li>
        <li>Rufe <code>update()</code> auf. Nuclo führt die Funktionen erneut aus und patcht das DOM.</li>
      </ol>
      <p>Das Ändern einer Variable berührt das DOM nicht. Die Seite ändert sich nur, wenn du <code>update()</code> aufrufst.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Schnellstart",
        content: `
      <p><code>create-nuclo</code> erzeugt ein Vite- und TypeScript-Projekt, das für Nuclo bereit ist:</p>
    `,
        afterContent: `
      <p>Es fragt nach einem Projektnamen. Um die Abfrage zu überspringen, übergib den Namen und die Flags. Bei npm setzt du <code>--</code> vor die Flags:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Dann installieren und den Dev-Server starten:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Optionen</h3>
      <ul>
        <li><code>[project-name]</code>: der Zielordner. Der Standard ist <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: das zu kopierende Template. Derzeit existiert nur <code>basic</code>.</li>
        <li><code>-y, --yes</code>: nie nachfragen, die Standardwerte verwenden.</li>
        <li><code>-f, --force</code>: in einen Ordner schreiben, der nicht leer ist.</li>
        <li><code>-h, --help</code>: die Hilfe ausgeben.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Installation und Importe",
        content: `
      <p>So fügst du Nuclo einem bestehenden Projekt hinzu:</p>
      ${sh("npm install nuclo")}
      <p>Oder verwende <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> oder <code>bun add nuclo</code>. Nuclo hat keine Abhängigkeiten.</p>
      <p>Routing ist nicht Teil des Kernpakets. Es wird separat als <a href="#router-overview"><code>nuclo-router</code></a> ausgeliefert, das du neben <code>nuclo</code> installierst, wenn du es brauchst.</p>
      <h3>Globals</h3>
      <p><code>import 'nuclo'</code> legt Folgendes auf <code>globalThis</code> ab:</p>
      <ul>
        <li><strong>175 Tag-Builder</strong>: 112 für HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) und 63 für SVG, mit einem <code>Svg</code>-Suffix (<code>svgSvg</code>, <code>pathSvg</code>, …). Siehe <a href="#tag-builders">Tag-Builder</a>.</li>
        <li><strong>16 Helfer</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> und <code>globalStyle</code>.</li>
      </ul>
      <p>Der Import muss vor jedem Code laufen, der einen Builder aufruft. ES-Module werden in Import-Reihenfolge ausgeführt, deshalb schlägt das hier fehl:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Setze <code>import 'nuclo'</code> an den Anfang deiner Entry-Datei oder importiere es in jeder Datei, die die Globals verwendet.</p>
      <h3>Benannte Imports</h3>
      <p>Die Helfer sind auch als benannte Exports verfügbar. Es sind dieselben Funktionen wie die Globals. <code>getCssText()</code> und <code>resetStyles()</code> gibt es nur als benannte Exports. Tag-Builder gibt es nur als Globals, deshalb funktioniert <code>import { div } from 'nuclo'</code> nicht.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Entry Points</h3>
      <ul>
        <li><code>nuclo</code>: registriert die Globals und exportiert die 16 Helfer sowie <code>getCssText</code> und <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> und <code>getCssText</code>. Siehe <a href="#api-ssr">Serverseitiges Rendering</a>.</li>
        <li><code>nuclo/polyfill</code>: ein kleines DOM für Node und Bun. Siehe <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: nur Typen. Siehe <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo liefert seine eigenen Typen mit. Du brauchst zwei Dinge:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> und <code>nodenext</code> werden noch nicht unterstützt.</li>
        <li>Die <code>DOM</code>-Lib. TypeScript bindet sie standardmäßig ein, wenn du <code>lib</code> nicht setzt.</li>
      </ul>
      <p>Wenn irgendeine Datei im Projekt <code>'nuclo'</code> importiert, sieht jede Datei die globalen Typen. Mehr brauchst du nicht. Wenn keine Datei es importiert, zum Beispiel in einer separaten tsconfig für Tests, fügst du die Typen selbst hinzu:</p>
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
      <p>Oder füge <code>/// &lt;reference types="nuclo/types" /&gt;</code> in eine <code>.d.ts</code>-Datei ein.</p>
      <h3>Nützliche Typen</h3>
      <p>Diese Typen sind global, du verwendest sie also ohne Import:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: was ein Tag-Builder zurückgibt. Verwende ihn als Rückgabetyp einer Komponente.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: alles, was ein Tag-Builder als Argument akzeptiert.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: was <code>render()</code> und <code>hydrate()</code> zurückgeben.</li>
        <li><code>ElementTagName</code>: ein beliebiger HTML-Tag-Name.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: das Attribut-Objekt, das ein Tag-Builder akzeptiert, einschließlich <code>on*</code>-Handlern, <code>onMount</code> und <code>onDestroy</code>. Verwende ihn für Komponenten, die Attribute durchreichen.</li>
        <li><code>MountCallback</code> und <code>DestroyCallback</code>: <code>onMount</code>- und <code>onDestroy</code>-Handler.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: was <code>when()</code> und <code>list()</code> zurückgeben.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: die Optionen, die <code>region()</code> entgegennimmt.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> und die übrigen Styling-Typen. Diese kannst du auch importieren: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> markiert jedes DOM-Member als optional. Caste es, wenn du den vollständigen Elementtyp brauchst: <code>render(App, root) as HTMLDivElement</code>.</p>
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
      <p>Jeder HTML-Tag ist eine globale Funktion mit demselben Namen: <code>div</code>, <code>span</code>, <code>input</code>, … Die einzige Ausnahme ist <code>&lt;var&gt;</code>, das <code>var_</code> heißt, weil <code>var</code> ein reserviertes Wort ist. Jeder SVG-Tag hat ein <code>Svg</code>-Suffix: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Der Aufruf eines Tag-Builders erzeugt noch kein Element. <code>div('Hi')</code> gibt einen <strong>Builder</strong> zurück: eine Funktion, die das Element später erzeugt. Nuclo ruft sie auf, wenn du den Builder mit <code>render()</code> mountest oder ihn in einen anderen Builder, in <code>when()</code> oder <code>list()</code> einsetzt. Jede Verwendung erzeugt ein neues Element.</p>
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
      <p>Ein Builder nimmt beliebig viele Argumente entgegen und wendet sie von links nach rechts an:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: ein Textknoten.</li>
        <li><strong><code>() =&gt; value</code></strong>: Text, der sich bei <code>update()</code> ändert. Siehe <a href="#dynamic-functions">Dynamische Werte</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: wird übersprungen.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: wird als Text "true" oder "false" gerendert. Verwende <code>when()</code> für Bedingungen.</li>
        <li><strong>Ein einfaches Objekt</strong>: Attribute. Siehe <a href="#attributes">Attribute</a>.</li>
        <li><strong>Ein <code>css()</code>-, <code>cx()</code>- oder <code>variants()</code>-Ergebnis</strong>: fügt seine Klassen hinzu.</li>
        <li><strong><code>on(...)</code></strong>: ein Event-Listener oder Lifecycle-Hook.</li>
        <li><strong>Ein anderer Builder, <code>when()</code> oder <code>list()</code></strong>: ein Kind.</li>
        <li><strong>Ein DOM-<code>Node</code></strong>: wird unverändert angehängt.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: ein eigener Modifier. Siehe unten.</li>
      </ul>
      <h3>Stolperfallen</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> rendert den Text "false". Schreibe <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Arrays sind keine Kinder. Spreade sie: <code>ul(...names.map((n) =&gt; li(n)))</code>. Für Listen, die sich ändern, verwende <code>list()</code>.</li>
        <li>Eine lokale Variable mit einem Tag-Namen verdeckt den Builder. Innerhalb von <code>function Row(label: string)</code> ist <code>label(...)</code> nicht aufrufbar. Benenne lokale Variablen wie <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> und <code>i</code> um.</li>
        <li>Browser stellen jedes Element mit einer <code>id</code> als globale Variable bereit. Wenn die Seite <code>&lt;main id="main"&gt;</code> enthält, bevor Nuclo lädt, lässt Nuclo dieses Global unangetastet, sodass <code>main(...)</code> einen <code>TypeError</code> wirft. Verwende andere ids.</li>
      </ul>
      <h3>Eigene Modifier</h3>
      <p>Eine Funktion, die mindestens einen Parameter deklariert, läuft einmal, in Argument-Reihenfolge, während das Element gebaut wird. Ihr erstes Argument ist das Element. Das zweite ist ein interner Index, verlass dich also nicht darauf. Gibt sie einen String oder eine Zahl zurück, wird daraus Text. Ein <code>Node</code> wird angehängt. Ein Objekt wird als Attribute angewendet.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Das Element erhalten</h3>
      <p><code>render()</code> gibt das Wurzelelement zurück. Innerhalb eines Baums verwendest du <code>on("mount", (el) =&gt; …)</code> oder einen eigenen Modifier. Du kannst die Builder-Funktion auch selbst aufrufen, um ein losgelöstes Element zu erzeugen:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Hänge es vor dem nächsten <code>update()</code> ein. Ein Knoten, der beim Ausführen von <code>update()</code> nicht im Dokument ist, wird endgültig nicht mehr aktualisiert.</p>
      <h3>SVG</h3>
      <p>SVG-Builder nehmen dieselben Argumente entgegen. Nuclo setzt jedes SVG-Attribut mit <code>setAttribute</code>, sodass Namen wie <code>"stroke-width"</code> wie geschrieben funktionieren.</p>
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
      <p>Eine Komponente ist eine einfache Funktion, die einen Builder zurückgibt, etwa <code>button(...)</code>. Es gibt keine Komponenten-API. Nichts wird erzeugt, bis du es renderst oder in einen Baum einsetzt.</p>
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
      <p>State, der innerhalb der Funktion deklariert ist, gehört dieser Instanz. State, der außerhalb deklariert ist, wird von allen Instanzen geteilt. <code>forceUpdate()</code> ruft Komponenten erneut auf, was den innerhalb deklarierten State zurücksetzt.</p>
      <p>Kinder sind einfach Argumente:</p>
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
      <p>Übergib ein einfaches Objekt, um Attribute zu setzen. Du kannst mehrere Objekte übergeben. Bei gleichem Schlüssel gewinnt der spätere Wert, außer bei <code>className</code> und <code>style</code>, die zusammengeführt werden. Ein Wert kann statisch sein oder eine Funktion ohne Parameter, die bei jedem <code>update()</code> erneut läuft.</p>
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
        <li>Hat das HTML-Element eine Property mit diesem Namen (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), setzt Nuclo die Property. Andernfalls ruft es <code>setAttribute(key, String(value))</code> auf, zum Beispiel für <code>"aria-*"</code> und <code>"data-*"</code>.</li>
        <li>Bei SVG-Elementen ruft Nuclo immer <code>setAttribute</code> auf.</li>
        <li><code>null</code> und <code>undefined</code> werden übersprungen. Ein dynamischer Wert, der <code>null</code> oder <code>undefined</code> zurückgibt, behält den alten Wert. Um einen Wert zu löschen, gib <code>""</code> zurück, oder <code>false</code> für eine boolesche Property.</li>
        <li>Booleans funktionieren für boolesche DOM-Properties wie <code>disabled</code> an einem Button, <code>checked</code>, <code>hidden</code> und <code>required</code>. Überall sonst werden <code>true</code> und <code>false</code> als die Strings "true" und "false" geschrieben.</li>
        <li>Verwende <code>"data-*"</code>-Schlüssel. <code>dataset</code> wird nicht unterstützt.</li>
        <li><code>innerHTML</code> wird nicht escaped, und serverseitiges Rendering gibt es nicht aus. Vermeide es.</li>
      </ul>
      <h3>Klassen</h3>
      <p>Verwende <code>className</code>. Statische Klassen-Strings, <code>css()</code>-Ergebnisse und ein dynamisches <code>className</code> werden alle zusammengeführt. Ein dynamisches <code>className</code> behält die statischen Klassen, und wenn es <code>""</code> zurückgibt, bleiben nur die statischen Klassen übrig.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Verwende den Schlüssel <code>class</code> nicht bei HTML-Elementen. Er setzt das rohe Attribut und ersetzt jede zuvor angewendete Klasse, einschließlich der <code>css()</code>-Klassen.</p>
      <h3>Inline-Styles</h3>
      <p><code>style</code> nimmt ein Objekt mit camelCase-Schlüsseln entgegen oder eine Funktion, die eines zurückgibt.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo ergänzt keine Einheiten. Schreibe <code>"12px"</code>, nicht <code>12</code>. Einheitenlose Properties wie <code>opacity</code> und <code>zIndex</code> akzeptieren Zahlen.</li>
        <li><code>""</code>, <code>null</code> und <code>undefined</code> löschen eine Property.</li>
        <li>Ein dynamischer Style setzt nur die Schlüssel, die er zurückgibt. Ein Schlüssel, den er nicht mehr zurückgibt, behält seinen alten Wert, gib also <code>""</code> zurück, um ihn zu löschen.</li>
        <li>Style-Strings (<code>"color: red"</code>) und Custom Properties (<code>"--gap"</code>) werden nicht unterstützt. Verwende stattdessen <code>css()</code>. Es nimmt Custom Properties über <a href="#style-objects"><code>raw</code></a> entgegen.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Ereignisse",
        content: `
      <p>Es gibt zwei Wege, auf Events zu hören: <code>on*</code>-Attribute und den <code>on()</code>-Modifier.</p>
      <h3><code>on*</code>-Attribute</h3>
      <p>In einem Attribut-Objekt ist eine Funktion unter einem Schlüssel wie <code>onClick</code> (<code>on</code> gefolgt von einem Großbuchstaben) ein Event-Handler, kein dynamischer Wert.</p>
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
        <li>TypeScript leitet den Event-Typ aus dem Schlüssel und dem Element ab. <code>e.currentTarget</code> und <code>this</code> sind das Element.</li>
        <li>Nuclo setzt die native Property, sodass <code>onClick</code> zu <code>el.onclick</code> wird. Es gibt einen Handler pro Event: ein späteres <code>onClick</code> ersetzt ein früheres.</li>
        <li><code>onDoubleClick</code> und <code>onDblClick</code> bedeuten beide <code>dblclick</code>. Kleingeschriebene Schlüssel wie <code>onclick</code> sind Typfehler.</li>
        <li>Ein Name, der kein bekanntes Event ist, hört auf seine kleingeschriebene Form: <code>onMyEvent</code> hört auf <code>"myevent"</code>.</li>
        <li>Fehler, die der Handler wirft, werden nicht abgefangen.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> gibt einen Modifier zurück, der <code>addEventListener</code> auf dem Element aufruft.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Jedes <code>on()</code> fügt einen Listener hinzu. Alle laufen, in Reihenfolge.</li>
        <li><code>options</code> geht direkt an <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Übergib <code>on()</code> direkt an einen Builder, und der Elementtyp wird abgeleitet: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Wirft ein Listener, protokolliert Nuclo den Fehler mit <code>console.error</code>, und die anderen Listener laufen trotzdem.</li>
        <li>Nuclo entfernt den Listener, wenn es das Element entfernt. Auf dem Server tut <code>on()</code> nichts.</li>
        <li>Du kannst einen <code>on()</code>-Wert auf vielen Elementen wiederverwenden.</li>
      </ul>
      <p>Für ein eigenes Event übergibst du den Event-Typ als Generic:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Was wann verwenden</h3>
      <p>Verwende <code>on*</code>-Attribute für den Normalfall. Verwende <code>on()</code>, wenn du mehr als einen Listener für ein Event, Listener-Optionen oder einen eigenen Event-Namen wie <code>"my-event"</code> brauchst.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Lebenszyklus",
        content: `
      <p><code>onMount</code> läuft einmal, nachdem das Element eingefügt wurde. <code>onDestroy</code> läuft einmal, wenn Nuclo das Element entfernt. Schreibe sie als Attribute oder mit <code>on()</code>. Beide Formen verhalten sich gleich, und das Element ist anhand seines Tags typisiert.</p>
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
        <li><code>onMount</code> läuft am Ende des <code>render()</code>-, <code>hydrate()</code>-, <code>update()</code>- oder <code>forceUpdate()</code>-Aufrufs, der das Element eingefügt hat. Es läuft nie, während der Baum gebaut wird.</li>
        <li>Gibt <code>onMount</code> eine Funktion zurück, läuft diese beim Destroy, nach den <code>onDestroy</code>-Callbacks des Elements.</li>
        <li><code>onDestroy</code> läuft, wenn Nuclo das Element entfernt: eine <code>list()</code>-Zeile wird entfernt, ein <code>when()</code>-Zweig wechselt, ein <code>into()</code> verlässt seine Region, oder <code>forceUpdate()</code> verwirft es. Es läuft unmittelbar vor dem Entfernen, das Element ist also noch im Dokument.</li>
      </ul>
      <h3>Direktes Entfernen aus dem DOM</h3>
      <p>Wenn du ein Element selbst entfernst, mit <code>node.remove()</code> oder <code>innerHTML = ''</code>, laufen sein <code>onDestroy</code> und seine Cleanups nie, und Timer laufen weiter. Nuclo hat kein <code>unmount()</code>. Um eine App mit Cleanup abzubauen, wickle sie in <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Reihenfolge und Fehler</h3>
      <ul>
        <li>Du kannst beliebig viele Hooks registrieren, in beiden Formen. Sie laufen in Registrierungsreihenfolge.</li>
        <li><code>onDestroy</code> läuft immer zuerst für die Kinder, dann für den Elternknoten.</li>
        <li>Elemente mounten in der Reihenfolge ihres ersten <code>onMount</code>-Hooks, die der Argument-Reihenfolge folgt, und jedes Element führt alle seine Hooks zusammen aus. Übergib den Hook eines Elternknotens vor seinen Kindern, wenn diese davon abhängen.</li>
        <li>Ein Hook, der wirft, wird mit <code>console.error</code> protokolliert. Die anderen Hooks laufen trotzdem.</li>
        <li>Der Callback muss nichts oder eine Cleanup-Funktion zurückgeben, mache ihn also nicht <code>async</code>. Ein zurückgegebenes Promise wird nie als Cleanup verwendet. Starte asynchrone Arbeit darin: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Hooks laufen nie auf dem Server. Auf dem Client laufen sie nach <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Hinweis:</strong> Hooks sind keine Effects. Sie laufen nie erneut, wenn sich der State ändert. Jeder läuft höchstens einmal pro Element.</div>
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
      <p>Nuclo aktualisiert die Seite nie von selbst. Ändere deinen State, dann rufe <code>update()</code> auf.</p>
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
      <p>Ändere so viel State, wie du willst, dann rufe <code>update()</code> einmal auf:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Rufe <code>update()</code> aus Event-Handlern, Timern, Fetch-Callbacks oder <code>onMount</code> auf. Rufe es nicht aus einem dynamischen Wert heraus auf.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Dynamische Werte",
        content: `
      <p>Eine Funktion <strong>ohne Parameter</strong> ist ein <strong>dynamischer Wert</strong>. Nuclo führt sie einmal aus, wenn es das Element baut, und erneut bei jedem <code>update()</code>. Verwende dynamische Werte für Text-Kinder, Attributwerte, <code>style</code> und <code>className</code>. Für Kinder, die erscheinen, verschwinden oder sich wiederholen, verwende <a href="#api-when"><code>when()</code></a> und <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo prüft die Parameteranzahl (<code>fn.length</code>). Eine Funktion, die einen Parameter deklariert, ist ein <a href="#tag-builders">eigener Modifier</a> und läuft nur einmal. <code>(x = 0) =&gt; …</code> und <code>(...args) =&gt; …</code> haben eine Länge von 0 und sind daher dynamisch.</p>
      <h3>Dynamischer Text</h3>
      <ul>
        <li>Ein String, eine Zahl, ein bigint oder ein Boolean wird als <code>String(value)</code> gerendert. <code>() =&gt; ok &amp;&amp; 'Saved'</code> zeigt "false", schreibe also <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> und <code>undefined</code> werden als leerer Text gerendert.</li>
        <li>Ein <code>css()</code>- oder <code>cx()</code>-Ergebnis beim ersten Durchlauf macht die Funktion zu einer dynamischen Klasse, nicht zu Text. Siehe <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Ein Node, Builder, Array oder einfaches Objekt rendert nichts und wird nie aktualisiert.</li>
      </ul>
      <h3>Dynamische Attribute</h3>
      <ul>
        <li>Nuclo schreibt einen Wert nur, wenn er sich vom zuletzt von Nuclo geschriebenen Wert unterscheidet. Es vergleicht nicht mit dem Live-DOM. Wenn also ein Nutzer in ein Input tippt und deine Funktion denselben Wert wie zuvor zurückgibt, bleibt der getippte Text erhalten.</li>
        <li>Ein Ergebnis von <code>null</code> oder <code>undefined</code> schreibt nichts, der alte Wert bleibt also. <code>className</code> ist die Ausnahme: jedes falsy Ergebnis entfernt die dynamischen Klassen und behält die statischen.</li>
        <li>Eine <code>style</code>-Funktion wendet das zurückgegebene Objekt bei jedem Update an.</li>
      </ul>
      <h3>Fehler</h3>
      <p>Wirft ein dynamischer Wert, fängt Nuclo den Fehler ab, und der Rest des Updates läuft trotzdem. Text wird leer oder behält seinen alten Wert, und ein Attribut behält seinen alten Wert. Beide erholen sich beim nächsten erfolgreichen <code>update()</code>. Die Ausnahme: eine Textfunktion, die beim <strong>ersten</strong> Durchlauf wirft, bleibt endgültig leer.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Führt einen synchronen Durchlauf über jeden dynamischen Wert auf der Seite aus. Mit ids aktualisiert es nur, was sich innerhalb der mit diesen <a href="#api-scope"><code>scope()</code></a>-ids markierten Elemente befindet. Jeder Durchlauf führt diese Schritte in Reihenfolge aus:</p>
      <ol>
        <li><code>list()</code>: liest die Items erneut und fügt Zeilen hinzu, verschiebt oder entfernt sie.</li>
        <li><code>when()</code>: prüft die Bedingungen erneut. Ein Zweig wird nur neu gebaut, wenn ein anderer Zweig aktiv wird.</li>
        <li>Dynamische Attribute, einschließlich <code>style</code> und <code>className</code>.</li>
        <li>Dynamischer Text.</li>
        <li><code>onMount</code> für die Elemente, die die Schritte 1 und 2 eingefügt haben.</li>
      </ol>
      <ul>
        <li><strong>Es führt alles aus.</strong> Jeder dynamische Wert läuft bei jedem Aufruf, auch wenn sich seine Daten nicht geändert haben. Nur der DOM-Schreibvorgang wird übersprungen. Halte dynamische Werte schnell und frei von Seiteneffekten.</li>
        <li><strong>Nur Knoten im Dokument.</strong> Ist ein Knoten beim Ausführen von <code>update()</code> nicht im Dokument, hört Nuclo auf, ihn zu verfolgen. Er wird nie wieder aktualisiert, auch nicht, nachdem du ihn eingehängt hast. Das gilt auch für <code>list()</code> und <code>when()</code>. Rendere in einen Container, der im Dokument ist.</li>
        <li><strong>Statische Werte ändern sich nie.</strong> Einfache Strings und Attributwerte werden beim Bauen des Elements festgelegt. Um sie neu zu bauen, verwende <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Fehler.</strong> Text- und Attributfehler werden abgefangen, und der Durchlauf geht weiter. Wirft eine <code>when()</code>-Bedingung, wird der Fehler protokolliert und dieses <code>when()</code> hört auf, sich zu aktualisieren. Wirft eine <code>items</code>- oder <code>renderItem</code>-Funktion von <code>list()</code>, entkommt der Fehler aus <code>update()</code>, und die restlichen Schritte laufen nicht.</li>
        <li><strong>Server.</strong> <code>update()</code> tut auf dem Server nichts.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Gibt dem Element, an das es übergeben wird, eine oder mehrere Scope-ids. <code>update('id')</code> aktualisiert dann nur, was innerhalb dieses Elements liegt, einschließlich der Attribute des Elements selbst.</p>
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
        <li>Ein Element kann mehrere ids haben: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> aktualisiert alles innerhalb von <code>a</code> oder <code>b</code>. Verwenden mehrere Elemente dieselbe id, werden alle aktualisiert.</li>
        <li>Bei verschachtelten Scopes schließt <code>update('outer')</code> den inneren Scope ein. <code>update('inner')</code> berührt den äußeren nicht.</li>
        <li>Eine id, die kein Element im Dokument hat, aktualisiert <strong>nichts</strong> und löst keinen Fehler aus, prüfe also die Schreibweise.</li>
        <li><code>scope()</code> tut auf dem Server nichts.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Rendert Inhalt abhängig von einer Bedingung. Nuclo prüft die Bedingungen bei jedem <code>update()</code> erneut. Die erste wahre Bedingung gewinnt. Ist keine wahr, wird der <code>.else()</code>-Inhalt gerendert. Ohne <code>.else()</code> wird nichts gerendert.</p>
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
        <li>Für State übergibst du eine Funktion. Ein einfacher Boolean wird einmal gelesen: <code>when(open, …)</code> ändert sich nie.</li>
        <li>In TypeScript muss die Funktion einen Boolean zurückgeben. Schreibe <code>() =&gt; items.length &gt; 0</code> oder <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Was aktualisiert wird</h3>
      <ul>
        <li>Solange derselbe Zweig aktiv bleibt, werden seine Elemente behalten. Dynamische Werte, Listen und <code>when()</code>-Blöcke darin werden weiter aktualisiert.</li>
        <li>Wird ein anderer Zweig aktiv, wird der alte Inhalt entfernt und seine <code>onDestroy</code>-Hooks laufen. Der neue Zweig wird von Grund auf gebaut und seine <code>onMount</code>-Hooks laufen. State in den alten Elementen, etwa Input-Text oder Fokus, geht verloren.</li>
      </ul>
      <h3>Inhalt eines Zweigs</h3>
      <p>Setze Kinder in einen Zweig: Text, dynamischen Text, Builder, <code>list()</code> und verschachtelte <code>when()</code>. Übergib Builder wie <code>p('Hi')</code>, keine DOM-Knoten: ein DOM-Knoten hört auf, sich zu aktualisieren, nachdem sein Zweig einmal ausgeblendet wurde.</p>
      <p>Attribut-Objekte und <code>on()</code> in einem Zweig gelten für das Elternelement und bleiben, nachdem der Zweig ausgeblendet wurde. Für ein bedingtes Attribut verwende ein dynamisches Attribut: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Verkettung</h3>
      <p><code>.when()</code> und <code>.else()</code> geben einen neuen Builder zurück und ändern das Original nicht. Rufst du <code>.else()</code> zweimal auf, gewinnt der letzte Aufruf.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Rendert eine Zeile pro Item. Bei jedem <code>update()</code> ruft Nuclo <code>items()</code> erneut auf und ordnet die neuen Items den bestehenden Zeilen über Identität (<code>===</code>) zu.</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Wie Zeilen zugeordnet werden</h3>
      <ul>
        <li>Ein Item, das noch da ist, behält seine Zeile. Nuclo verschiebt die Zeile bei Bedarf und ruft <code>renderItem</code> nicht erneut auf.</li>
        <li>Ein neues Item bekommt eine neue Zeile. Ein entferntes Item verliert seine Zeile, und seine <code>onDestroy</code>-Hooks laufen.</li>
        <li>Doppelte Items bekommen jeweils ihre eigene Zeile.</li>
        <li>Du kannst das Array in place ändern (<code>push</code>, <code>splice</code>, <code>sort</code>) oder ein neues Array zurückgeben.</li>
      </ul>
      <p>Eine behaltene Zeile wird nie erneut gerendert, verwende also dynamische Werte für die Felder, die sich ändern:</p>
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
      <p>Kopien sind neue Items, deshalb baut das Ersetzen des Arrays durch <code>todos.map((t) =&gt; ({ ...t }))</code> jede Zeile neu.</p>
    `,
        afterContent: `
      <h3>Was <code>renderItem</code> zurückgibt</h3>
      <ul>
        <li>Gib ein Element zurück, etwa <code>li(...)</code>, <code>tr(...)</code> oder einen SVG-Builder. Gib <code>null</code> oder <code>undefined</code> zurück, um ein Item zu überspringen. Strings, Textknoten und Fragmente rendern nichts.</li>
        <li>Gib <code>when()</code> oder <code>list()</code> nicht direkt zurück. Setze sie in das Zeilenelement: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Um Items auszublenden, filtere in <code>items()</code>, nicht in <code>renderItem</code>.</li>
        <li>Halte <code>renderItem</code> frei von Seiteneffekten. Nuclo kann es für dasselbe Item mehr als einmal aufrufen.</li>
      </ul>
      <h3>Der Index</h3>
      <p><code>index</code> ist die Position des Items, als seine Zeile erzeugt wurde. Er wird nicht aktualisiert, wenn Zeilen verschoben werden. Für die aktuelle Position verwende einen dynamischen Wert: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iterables</h3>
      <p>Jedes Iterable funktioniert: Arrays, <code>Set</code>, Generatoren und <code>map.values()</code>. Jedes Mal dasselbe Array oder <code>Set</code> zurückzugeben ist in Ordnung. Ein Iterator, etwa ein Generator oder <code>map.values()</code>, ist nach einem Durchlauf aufgebraucht, erzeuge ihn also bei jedem Aufruf innerhalb von <code>items()</code>. Eine <code>Map</code> direkt zu iterieren erzeugt jedes Mal neue <code>[key, value]</code>-Arrays, sodass jede Zeile neu gebaut wird. Verwende stattdessen <code>map.values()</code>.</p>
      <h3>Platzierung</h3>
      <p>Zeilen erscheinen dort, wo <code>list()</code> unter seinen Geschwistern steht, zwischen zwei Kommentar-Markern. Andere Kinder des Elternelements werden nicht berührt. <code>list()</code> funktioniert auch innerhalb von SVG-Buildern.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() & into()",
        content: `
      <p><code>region()</code> markiert eine benannte Stelle im Baum. <code>into()</code> füllt sie von überall sonst, in beliebiger Tiefe. Das Layout bekommt den Inhalt nicht als Prop, und die Komponente, die den Inhalt baut, weiß nicht, wo er landet.</p>
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
      <h3>Wie es funktioniert</h3>
      <ul>
        <li><code>into()</code> hinterlässt an seiner Stelle nur einen Kommentar. Sein Inhalt wird zwischen den Markern der Region gerendert.</li>
        <li>Die Reihenfolge spielt keine Rolle. Ein <code>into()</code>, das vor seiner Region gebaut wird, wartet und erscheint in dem Moment, in dem die Region gebaut wird. Views erscheinen in der Reihenfolge, in der sie geschrieben wurden.</li>
        <li>Der Inhalt lebt so lange wie die View. Wenn das <code>when()</code>, das ein <code>into()</code> enthält, schließt, oder seine <code>list()</code>-Zeile entfernt wird, verlässt der Inhalt die Region. Erneutes Öffnen fügt eine Kopie hinzu, nicht zwei.</li>
        <li>Wenn eine Region verschwindet, zum Beispiel weil ihr <code>when()</code> schließt, warten ihre Views wieder. Eine später gebaute Region mit derselben id zeigt sie an.</li>
        <li>Ein <code>into()</code>, dessen id zu keiner Region passt, rendert nichts und löst keinen Fehler aus, prüfe also die Schreibweise.</li>
        <li>Ids sind im Baum eindeutig. Eine zweite Region, die unter einer aktiven id gebaut wird, protokolliert eine Warnung.</li>
        <li>Regionen funktionieren mit <a href="#api-ssr">serverseitigem Rendering</a>. Bei <code>hydrate()</code> übernimmt jede View das vom Server gerenderte HTML, statt es erneut zu bauen.</li>
      </ul>
      <h3>Optionen</h3>
      <ul>
        <li><code>id</code>: der Name, über den <code>into()</code>-Aufrufe die Region finden.</li>
        <li><code>type</code>: <code>'latest'</code> (der Standard) zeigt nur die neueste View. <code>'stack'</code> zeigt jede View, in Ankunftsreihenfolge.</li>
        <li><code>empty</code>: wird gerendert, solange die Region keine Views enthält.</li>
      </ul>
      <h3>Gestapelte Regionen</h3>
      <p>Mit <code>type: 'stack'</code> baut eine View, die sich über eine andere öffnet, die darunterliegende nicht neu. Deren DOM, Fokus und Formular-State bleiben erhalten. Verwende das für eine Ebene wie einen Dialog über einer Seite.</p>
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
      <p>Übergib ein Objekt, um mehr als eine Region aus einem einzigen <code>into()</code> zu füllen. Ein Wert kann ein Kind oder ein Array von Kindern sein. Beide Formen lassen sich verschachteln: ein <code>into()</code> innerhalb des Inhalts einer anderen View zielt auf seine eigene Region.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Ein Dialog, der tief im Baum geöffnet wird</h3>
      <p>Die Overlay-Region sitzt an der Wurzel. Jede Komponente, in beliebiger Tiefe, öffnet einen Dialog, indem sie ein <code>into()</code> in ein <code>when()</code> wickelt. Das Schließen des <code>when()</code> entfernt den Dialog aus der Region.</p>
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
      <p>Jede Zeile einer <code>list()</code> ist eine View. Eine gestapelte Region zeigt sie in Reihenfolge, und das Entfernen eines Items aus dem Array entfernt seinen Toast.</p>
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
      <h3>Ein Seitentitel, den die Seite setzt</h3>
      <p>Mit dem Standard <code>type: 'latest'</code> gewinnt die neueste View. Das Layout besitzt die Überschrift, und die jeweils offene Seite benennt sie. Eine Seite ohne <code>into('title', …)</code> lässt den <code>empty</code>-Text stehen.</p>
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
      <p>Der Inhalt eines <code>into()</code> ist gewöhnlicher Nuclo-Inhalt. Funktionen darin sind state-abhängige Werte und werden bei <code>update()</code> aktualisiert, wo immer die Region ist.</p>
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
      <p>Das <code>into()</code> des Dashboards wird einmal geschrieben. Solange der Nutzer abgemeldet ist, gibt es keine <code>main</code>-Region, die View wartet also. Das Anmelden baut die Region, und die View erscheint. Das Abmelden entfernt die Region, und die View wartet wieder.</p>
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
      <p>Eine View kann eine <code>region()</code> enthalten, und andere Views können darauf zielen. Hier bringt die Editor-Seite eine <code>tabs</code>-Region mit, und jeder Tab füllt sie. Wenn der Editor schließt, geht seine Region mit ihm.</p>
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
      <p><code>update()</code> führt nur dynamische Werte aus. Statische Werte, etwa der Text in <code>h1(labels[lang].title)</code>, werden beim Bauen des Baums festgelegt. <code>forceUpdate()</code> ruft deine Komponenten erneut auf und patcht das Live-DOM entsprechend, statische Werte eingeschlossen. Verwende es für seltene, app-weite Änderungen, etwa das Umschalten der Sprache. Für alles andere verwende <code>update()</code>.</p>
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
      <p>Ohne Argumente baut <code>forceUpdate()</code> jede Wurzel neu, die mit <code>render(App)</code> oder <code>hydrate(App)</code> gerendert wurde. Mit <code>render(App())</code> gerenderte Wurzeln werden übersprungen. Wirft eine Komponente, wird der Fehler protokolliert und diese Wurzel behält ihr altes DOM. Ein Fehler, der später beim Anwenden des neuen Builds geworfen wird, wird ebenfalls protokolliert, aber die bereits gepatchten Teile bleiben gepatcht.</p>
      <h3>Was bleibt und was sich ändert</h3>
      <ul>
        <li>Kinder werden in Reihenfolge nach Tag zugeordnet. Ein passendes Element wird wiederverwendet, sodass Fokus und getippte Input-Werte bleiben und seine <code>onMount</code>-Hooks nicht erneut laufen. Sobald sich der Tag eines Kindes unterscheidet, werden dieses Kind und jedes spätere Geschwister neu gebaut.</li>
        <li>Text, Attribute, Klassen, Styles, Listener, <code>when()</code>-Zweige und <code>list()</code>-Zeilen folgen dem neuen Build.</li>
        <li>Neue Elemente werden erzeugt, und ihre <code>onMount</code>-Hooks laufen. Elemente, die der neue Build nicht mehr erzeugt, werden entfernt, und ihre <code>onDestroy</code>-Hooks laufen.</li>
        <li><code>list()</code>-Zeilen werden ebenfalls nach Position zugeordnet, nicht nach Item, sodass ein wiederverwendetes Zeilenelement am Ende ein anderes Item zeigen kann.</li>
        <li>Attribute, die der neue Build nicht mehr setzt, werden nicht entfernt.</li>
      </ul>
      <div class="docs-callout"><strong>Achtung:</strong> State, der innerhalb einer Komponentenfunktion deklariert ist, wird zurückgesetzt, weil die Funktion erneut läuft. Halte State, der überleben muss, außerhalb der Komponente.</div>
      <p><strong>Explizite Form.</strong> <code>forceUpdate(App(), parent)</code> baut einen Baum in <code>parent</code> neu und gibt seine Wurzel zurück. Es registriert die Wurzel nicht für spätere Aufrufe. Wie <code>hydrate()</code> erwartet es, dass die Wurzel der erste Knoten in <code>parent</code> ist. Hat der erste Knoten einen anderen Tag, wird er ersetzt.</p>
      <p>Auf dem Server tut <code>forceUpdate()</code> nichts.</p>
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
      <p>Baut deinen Baum und hängt sein Wurzelelement an <code>parent</code> an. <code>parent</code> ist standardmäßig <code>document.body</code>. Es gibt das Wurzelelement zurück.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Du kannst die Komponente (<code>render(App)</code>) oder den Builder übergeben, den sie zurückgibt (<code>render(App())</code>). Das DOM ist dasselbe. Nur <code>render(App)</code> erlaubt <a href="#api-force-update"><code>forceUpdate()</code></a>, die Wurzel später neu zu bauen, bevorzuge es also.</li>
        <li>Es hängt an. Es leert <code>parent</code> nicht, ein zweifacher Aufruf fügt also zwei Kopien hinzu.</li>
        <li>Jedes <code>onMount</code> im Baum ist gelaufen, wenn <code>render()</code> zurückkehrt.</li>
        <li>Rendere in ein Element, das im Dokument ist. Siehe <a href="#api-update"><code>update()</code></a>.</li>
        <li>Die Wurzel muss ein Element sein, etwa <code>div(...)</code>, nicht <code>when()</code> oder <code>list()</code>.</li>
        <li><code>index</code> ist intern. Es bestimmt nicht, wo das Element eingefügt wird. Lass es weg.</li>
      </ul>
      <p>Eine als <code>render(App)</code> übergebene Komponente darf keine Parameter haben. Ein erforderlicher Parameter ist ein Typfehler. Ein optionaler besteht die Typprüfung, aber <code>render()</code> wirft zur Laufzeit. Wickle eine Komponente, die Props nimmt, ein:</p>
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
      <p>Übernimmt HTML, das <a href="#api-ssr"><code>renderToString()</code></a> erzeugt hat. Es verwendet die bestehenden Elemente wieder, hängt Event-Listener an und verbindet dynamische Werte, <code>when()</code> und <code>list()</code>, sodass <code>update()</code> danach funktioniert. Dann führt es die <code>onMount</code>-Hooks aus. <code>parent</code> ist standardmäßig <code>document.body</code>. Es gibt das Wurzelelement zurück.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Verwende dieselbe Komponente und dieselben Daten wie der Server.</li>
        <li>Hydriere in einen dedizierten Container. Die Wurzel der App muss sein erster Knoten sein, Whitespace ist aber in Ordnung. Kommt ein anderer Knoten zuerst, ersetzt Nuclo diesen Knoten und lässt die Server-Kopie zurück.</li>
        <li>Wie bei <code>render()</code> übergibst du <code>App</code>, nicht <code>App()</code>, damit <code>forceUpdate()</code> die Wurzel später neu bauen kann. <code>App</code> darf keine Parameter haben. Mit einem optionalen Parameter hängt <code>hydrate()</code> stillschweigend nichts an. Wickle eine Komponente, die Props nimmt, ein: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Gibt es kein Server-HTML, verwende <code>render()</code>.</li>
      </ul>
      <h3>Wenn Server und Client sich unterscheiden</h3>
      <p>Der Client gewinnt:</p>
      <ul>
        <li>Ein anderer Wurzel-Tag: dieser Knoten wird durch frisches DOM ersetzt. Ein leerer Container: frisches DOM wird angehängt.</li>
        <li>Unterschiedlicher Text wird gepatcht. Unterschiedliche <code>list()</code>-Items und <code>when()</code>-Zweige folgen dem Client.</li>
        <li>Überzählige Server-Kinder werden entfernt, fehlende werden erzeugt.</li>
        <li>Attribute, die der Server geschrieben hat, der Client aber nicht setzt, bleiben wie sie sind.</li>
      </ul>
      <p><code>renderToString()</code> schreibt HTML-Kommentare als Marker, etwa <code>&lt;!-- text-0 --&gt;</code> vor jedem Textknoten. <code>hydrate()</code> braucht sie, entferne also keine Kommentare aus dem Server-HTML. Ohne die Marker löscht die Hydration die <code>list()</code>-Zeilen, und <code>list()</code> und <code>when()</code> hören auf, sich zu aktualisieren.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Serverseitiges Rendering",
        content: `
      <p>Rendere eine Komponente auf dem Server zu einem HTML-String. Im Browser rufst du <a href="#api-hydrate"><code>hydrate()</code></a> mit derselben Komponente auf, um dieses HTML interaktiv zu machen. Server-Laufzeiten haben kein <code>document</code>, importiere also zuerst <a href="#api-polyfill"><code>nuclo/polyfill</code></a>.</p>
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
      <p>Behalte <code>id="nuclo-styles"</code> am Style-Tag. Der Client verwendet dieses Element wieder und fügt nur neue Regeln hinzu. Siehe <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Was auf dem Server läuft</h3>
      <ul>
        <li>Jeder <code>renderToString()</code>-Aufruf baut den Baum und führt jeden dynamischen Wert einmal aus.</li>
        <li>Event-Handler, <code>onMount</code> und <code>onDestroy</code> laufen nie. <code>update()</code>, <code>scope()</code> und <code>forceUpdate()</code> tun nichts.</li>
        <li>Das Rendering ist synchron. Lade zuerst deine Daten, dann rendere.</li>
        <li>Nach einem Render bleibt nichts registriert, ein Prozess kann also viele Requests bedienen. Übergib Request-Daten als Argumente, etwa <code>renderToString(Page(user))</code>. Variablen auf Modulebene werden von allen Requests geteilt.</li>
        <li>Rufe <code>render()</code> nicht auf dem Server auf. Es hängt an das geteilte <code>document.body</code> an.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Nimmt einen Builder (<code>App()</code>), eine Komponente (<code>App</code>) oder einen DOM-Knoten entgegen. <code>null</code> und <code>undefined</code> geben <code>""</code> zurück. Die Wurzel muss ein Element sein. Eine als <code>renderToString(Page)</code> übergebene Komponente darf keine Parameter haben, übergib also <code>Page(user)</code> für eine, die Daten nimmt.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Text- und Attributwerte werden HTML-escaped. Text innerhalb von <code>script()</code> und <code>style()</code> wird unverändert geschrieben, nur schließende Tags werden aufgebrochen, setze dort also nie Nutzereingaben ein.</li>
        <li>Es wirft nicht. Wirft die Komponente, eine <code>list()</code>-Funktion oder eine <code>when()</code>-Bedingung, oder fehlt der Polyfill, protokolliert es den Fehler und gibt <code>""</code> zurück. Prüfe auf ein leeres Ergebnis, wenn der Request fehlschlagen soll. Eine Text- oder Attributfunktion, die wirft, rendert nur leer.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Dasselbe wie <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Wickelt die Ausgabe in ein Element. <code>containerTag</code> ist standardmäßig <code>"div"</code>, <code>containerAttrs</code> standardmäßig <code>{}</code>. Attributwerte werden escaped. Attributnamen werden wie angegeben geschrieben, verwende also HTML-Namen wie <code>class</code>. Übergib nie Nutzereingaben als Tag.</p>
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
      <p>Ein kleines DOM, damit Nuclo in Node und Bun Bäume bauen kann. Importiere es einmal, vor deinem ersten Render. Die meisten Apps brauchen nur den einfachen Import.</p>
      <ul>
        <li>Wenn es kein <code>window</code> gibt, setzt es <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> und <code>HTMLElement</code>, aber nur die, die fehlen. Es erzeugt kein <code>window</code>.</li>
        <li>In einem Browser oder unter jsdom tut es nichts.</li>
        <li><code>Event</code> und <code>CustomEvent</code> sind die eigenen Konstruktoren der Laufzeit. <code>Node</code>, <code>Element</code> und <code>HTMLElement</code> sind Aliase der Polyfill-Klassen.</li>
      </ul>
      <p>Es ist ein DOM zum Bauen von Bäumen, kein Browser. Es hat kein <code>innerHTML</code> und kein <code>getElementById</code>, <code>querySelector()</code> gibt <code>null</code> zurück, und Event-Listener werden ignoriert. Verwende <code>renderToString()</code>, um das HTML zu erhalten.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
