import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "Introducción",
    sections: [
      {
        id: "overview",
        title: "Visión general",
        content: `
      <p>Nuclo es una pequeña biblioteca DOM para TypeScript. Construyes la página con funciones simples como <code>div()</code> y <code>button()</code>, guardas el estado en variables ordinarias y llamas a <code>update()</code> cuando la página debe cambiar.</p>
      <p>Nuclo no tiene DOM virtual, ni compilador, ni proxies, ni signals.</p>
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
      <h3>El modelo mental</h3>
      <ol>
        <li>Construye la UI con constructores de etiquetas.</li>
        <li>Pasa una función por cada valor que dependa del estado.</li>
        <li>Cambia el estado con JavaScript normal.</li>
        <li>Llama a <code>update()</code>. Nuclo ejecuta las funciones de nuevo y parchea el DOM.</li>
      </ol>
      <p>Cambiar una variable no toca el DOM. La página solo cambia cuando llamas a <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Inicio rápido",
        content: `
      <p><code>create-nuclo</code> genera un proyecto de Vite y TypeScript listo para Nuclo:</p>
    `,
        afterContent: `
      <p>Pide un nombre de proyecto. Para saltarte la pregunta, pasa el nombre y las opciones. Con npm, pon <code>--</code> antes de las opciones:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Después instala y arranca el servidor de desarrollo:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Opciones</h3>
      <ul>
        <li><code>[project-name]</code>: la carpeta de destino. El valor por defecto es <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: la plantilla que se copia. Hoy solo existe <code>basic</code>.</li>
        <li><code>-y, --yes</code>: nunca pregunta, usa los valores por defecto.</li>
        <li><code>-f, --force</code>: escribe en una carpeta que no está vacía.</li>
        <li><code>-h, --help</code>: muestra la ayuda.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Instalación e importaciones",
        content: `
      <p>Para añadir Nuclo a un proyecto existente:</p>
      ${sh("npm install nuclo")}
      <p>O usa <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> o <code>bun add nuclo</code>. Nuclo no tiene dependencias.</p>
      <p>El enrutamiento no forma parte del paquete principal. Se distribuye por separado como <a href="#router-overview"><code>nuclo-router</code></a>, que instalas junto a <code>nuclo</code> cuando lo necesites.</p>
      <h3>Globales</h3>
      <p><code>import 'nuclo'</code> registra esto en <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 constructores de etiquetas</strong>: 112 para HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) y 63 para SVG, con el sufijo <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). Consulta <a href="#tag-builders">Constructores de etiquetas</a>.</li>
        <li><strong>16 helpers</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> y <code>globalStyle</code>.</li>
      </ul>
      <p>La importación debe ejecutarse antes que cualquier código que llame a un constructor. Los módulos ES se ejecutan en orden de importación, así que esto falla:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Pon <code>import 'nuclo'</code> al principio de tu archivo de entrada, o impórtalo en cada archivo que use los globales.</p>
      <h3>Importaciones con nombre</h3>
      <p>Los helpers también son exportaciones con nombre. Son las mismas funciones que los globales. <code>getCssText()</code> y <code>resetStyles()</code> solo existen como exportaciones con nombre. Los constructores de etiquetas solo existen como globales, así que <code>import { div } from 'nuclo'</code> no funciona.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Puntos de entrada</h3>
      <ul>
        <li><code>nuclo</code>: registra los globales y exporta los 16 helpers más <code>getCssText</code> y <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> y <code>getCssText</code>. Consulta <a href="#api-ssr">Renderizado en el servidor</a>.</li>
        <li><code>nuclo/polyfill</code>: un DOM pequeño para Node y Bun. Consulta <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: solo tipos. Consulta <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo incluye sus propios tipos. Necesitas dos cosas:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> y <code>nodenext</code> todavía no están soportados.</li>
        <li>La lib <code>DOM</code>. TypeScript la incluye por defecto cuando no defines <code>lib</code>.</li>
      </ul>
      <p>Si cualquier archivo del proyecto importa <code>'nuclo'</code>, todos los archivos ven los tipos globales. No necesitas nada más. Si ningún archivo lo importa, por ejemplo en un tsconfig separado para tests, añade los tipos tú mismo:</p>
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
      <p>O añade <code>/// &lt;reference types="nuclo/types" /&gt;</code> a un archivo <code>.d.ts</code>.</p>
      <h3>Tipos útiles</h3>
      <p>Estos tipos son globales, así que los usas sin importarlos:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: lo que devuelve un constructor de etiquetas. Úsalo como tipo de retorno de un componente.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: cualquier cosa que un constructor de etiquetas acepta como argumento.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: lo que devuelven <code>render()</code> y <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: cualquier nombre de etiqueta HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: el objeto de atributos que acepta un constructor de etiquetas, incluidos los manejadores <code>on*</code>, <code>onMount</code> y <code>onDestroy</code>. Úsalo en componentes que reenvían atributos.</li>
        <li><code>MountCallback</code> y <code>DestroyCallback</code>: manejadores de <code>onMount</code> y <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: lo que devuelven <code>when()</code> y <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: las opciones que recibe <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> y los demás tipos de estilos. También puedes importarlos: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> marca cada miembro del DOM como opcional. Haz un cast cuando necesites el tipo completo del elemento: <code>render(App, root) as HTMLDivElement</code>.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "Construir la UI",
    sections: [
      {
        id: "tag-builders",
        title: "Constructores de etiquetas",
        content: `
      <p>Cada etiqueta HTML es una función global con el mismo nombre: <code>div</code>, <code>span</code>, <code>input</code>, … La única excepción es <code>&lt;var&gt;</code>, que es <code>var_</code> porque <code>var</code> es una palabra reservada. Cada etiqueta SVG lleva el sufijo <code>Svg</code>: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Llamar a un constructor de etiquetas todavía no crea un elemento. <code>div('Hi')</code> devuelve un <strong>builder</strong>: una función que crea el elemento más tarde. Nuclo la llama cuando lo montas con <code>render()</code> o lo colocas dentro de otro builder, <code>when()</code> o <code>list()</code>. Cada uso crea un elemento nuevo.</p>
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
      <h3>Argumentos</h3>
      <p>Un builder acepta cualquier número de argumentos y los aplica de izquierda a derecha:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: un nodo de texto.</li>
        <li><strong><code>() =&gt; value</code></strong>: texto que cambia en <code>update()</code>. Consulta <a href="#dynamic-functions">Valores dinámicos</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: se omiten.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: se renderizan como el texto "true" o "false". Usa <code>when()</code> para condiciones.</li>
        <li><strong>Un objeto plano</strong>: atributos. Consulta <a href="#attributes">Atributos</a>.</li>
        <li><strong>Un resultado de <code>css()</code>, <code>cx()</code> o <code>variants()</code></strong>: añade sus clases.</li>
        <li><strong><code>on(...)</code></strong>: un listener de eventos o un hook de ciclo de vida.</li>
        <li><strong>Otro builder, <code>when()</code> o <code>list()</code></strong>: un hijo.</li>
        <li><strong>Un <code>Node</code> del DOM</strong>: se añade tal cual.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: un modificador personalizado. Ver más abajo.</li>
      </ul>
      <h3>Trampas habituales</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> renderiza el texto "false". Escribe <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Los arrays no son hijos. Expándelos: <code>ul(...names.map((n) =&gt; li(n)))</code>. Para listas que cambian, usa <code>list()</code>.</li>
        <li>Una variable local con el nombre de una etiqueta oculta el constructor. Dentro de <code>function Row(label: string)</code>, <code>label(...)</code> no se puede llamar. Renombra las locales como <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> e <code>i</code>.</li>
        <li>Los navegadores exponen cada elemento con <code>id</code> como una variable global. Si la página contiene <code>&lt;main id="main"&gt;</code> antes de que Nuclo cargue, Nuclo deja ese global en su sitio, así que <code>main(...)</code> lanza un <code>TypeError</code>. Usa otros ids.</li>
      </ul>
      <h3>Modificadores personalizados</h3>
      <p>Una función que declara al menos un parámetro se ejecuta una vez, en orden de argumentos, mientras se construye el elemento. Su primer argumento es el elemento. El segundo es un índice interno, así que no dependas de él. Si devuelve un string o un número, se convierte en texto. Un <code>Node</code> se añade como hijo. Un objeto se aplica como atributos.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Obtener el elemento</h3>
      <p><code>render()</code> devuelve el elemento raíz. Dentro de un árbol, usa <code>on("mount", (el) =&gt; …)</code> o un modificador personalizado. También puedes llamar tú mismo a la función builder para crear un elemento desconectado:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Insértalo antes del siguiente <code>update()</code>. Un nodo que no está en el documento cuando se ejecuta <code>update()</code> deja de actualizarse para siempre.</p>
      <h3>SVG</h3>
      <p>Los constructores SVG aceptan los mismos argumentos. Nuclo establece cada atributo SVG con <code>setAttribute</code>, así que nombres como <code>"stroke-width"</code> funcionan tal como se escriben.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Todos los constructores</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Componentes",
        content: `
      <p>Un componente es una función simple que devuelve un builder, como <code>button(...)</code>. No hay una API de componentes. No se crea nada hasta que lo renderizas o lo colocas en un árbol.</p>
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
      <p>El estado declarado dentro de la función pertenece a esa instancia. El estado declarado fuera lo comparten todas las instancias. <code>forceUpdate()</code> llama a los componentes de nuevo, lo que reinicia el estado declarado dentro de ellos.</p>
      <p>Los hijos son simplemente argumentos:</p>
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
        title: "Atributos",
        content: `
      <p>Pasa un objeto plano para establecer atributos. Puedes pasar varios objetos. Para la misma clave, gana el último valor, salvo <code>className</code> y <code>style</code>, que se combinan. Un valor puede ser estático, o una función sin parámetros que se ejecuta de nuevo en cada <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Cómo se establece un valor</h3>
      <ul>
        <li>Si el elemento HTML tiene una propiedad con ese nombre (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo establece la propiedad. De lo contrario llama a <code>setAttribute(key, String(value))</code>, por ejemplo para <code>"aria-*"</code> y <code>"data-*"</code>.</li>
        <li>En elementos SVG, Nuclo siempre llama a <code>setAttribute</code>.</li>
        <li><code>null</code> y <code>undefined</code> se omiten. Un valor dinámico que devuelve <code>null</code> o <code>undefined</code> conserva el valor anterior. Para limpiar un valor, devuelve <code>""</code>, o <code>false</code> para una propiedad booleana.</li>
        <li>Los booleanos funcionan para propiedades booleanas del DOM, como <code>disabled</code> en un botón, <code>checked</code>, <code>hidden</code> y <code>required</code>. En cualquier otro lugar, <code>true</code> y <code>false</code> se escriben como los strings "true" y "false".</li>
        <li>Usa claves <code>"data-*"</code>. <code>dataset</code> no está soportado.</li>
        <li><code>innerHTML</code> no se escapa, y el renderizado en el servidor no lo emite. Evítalo.</li>
      </ul>
      <h3>Clases</h3>
      <p>Usa <code>className</code>. Los strings de clases estáticos, los resultados de <code>css()</code> y un <code>className</code> dinámico se combinan. Un <code>className</code> dinámico conserva las clases estáticas, y cuando devuelve <code>""</code> solo quedan las clases estáticas.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>No uses la clave <code>class</code> en elementos HTML. Establece el atributo en bruto y reemplaza todas las clases aplicadas antes, incluidas las de <code>css()</code>.</p>
      <h3>Estilos en línea</h3>
      <p><code>style</code> acepta un objeto con claves en camelCase, o una función que devuelve uno.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo no añade unidades. Escribe <code>"12px"</code>, no <code>12</code>. Las propiedades sin unidad, como <code>opacity</code> y <code>zIndex</code>, aceptan números.</li>
        <li><code>""</code>, <code>null</code> y <code>undefined</code> limpian una propiedad.</li>
        <li>Un estilo dinámico solo establece las claves que devuelve. Una clave que deja de devolver conserva su valor anterior, así que devuelve <code>""</code> para limpiarla.</li>
        <li>Los strings de estilo (<code>"color: red"</code>) y las propiedades personalizadas (<code>"--gap"</code>) no están soportados. Usa <code>css()</code> en su lugar. Acepta propiedades personalizadas a través de <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Eventos",
        content: `
      <p>Hay dos formas de escuchar eventos: los atributos <code>on*</code> y el modificador <code>on()</code>.</p>
      <h3>Atributos <code>on*</code></h3>
      <p>En un objeto de atributos, una función bajo una clave como <code>onClick</code> (<code>on</code> seguido de una mayúscula) es un manejador de eventos, no un valor dinámico.</p>
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
        <li>TypeScript infiere el tipo del evento a partir de la clave y del elemento. <code>e.currentTarget</code> y <code>this</code> son el elemento.</li>
        <li>Nuclo establece la propiedad nativa, así que <code>onClick</code> se convierte en <code>el.onclick</code>. Hay un manejador por evento: un <code>onClick</code> posterior reemplaza al anterior.</li>
        <li><code>onDoubleClick</code> y <code>onDblClick</code> significan ambos <code>dblclick</code>. Las claves en minúsculas como <code>onclick</code> son errores de tipo.</li>
        <li>Un nombre que no es un evento conocido escucha su forma en minúsculas: <code>onMyEvent</code> escucha <code>"myevent"</code>.</li>
        <li>Los errores que lanza el manejador no se capturan.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> devuelve un modificador que llama a <code>addEventListener</code> en el elemento.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Cada <code>on()</code> añade un listener. Todos se ejecutan, en orden.</li>
        <li><code>options</code> va directo a <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Pasa <code>on()</code> directamente a un builder y el tipo del elemento se infiere: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Si un listener lanza un error, Nuclo lo registra con <code>console.error</code>, y los demás listeners se ejecutan igualmente.</li>
        <li>Nuclo quita el listener cuando quita el elemento. En el servidor, <code>on()</code> no hace nada.</li>
        <li>Puedes reutilizar un mismo valor de <code>on()</code> en muchos elementos.</li>
      </ul>
      <p>Para un evento personalizado, pasa el tipo del evento como genérico:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Cuál usar</h3>
      <p>Usa los atributos <code>on*</code> para el caso habitual. Usa <code>on()</code> cuando necesites más de un listener para un evento, opciones de listener, o un nombre de evento personalizado como <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Ciclo de vida",
        content: `
      <p><code>onMount</code> se ejecuta una vez, después de insertar el elemento. <code>onDestroy</code> se ejecuta una vez, cuando Nuclo quita el elemento. Escríbelos como atributos o con <code>on()</code>. Ambas formas se comportan igual, y el elemento se tipa según su etiqueta.</p>
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
      <h3>Cuándo se ejecutan</h3>
      <ul>
        <li><code>onMount</code> se ejecuta al final de la llamada a <code>render()</code>, <code>hydrate()</code>, <code>update()</code> o <code>forceUpdate()</code> que insertó el elemento. Nunca se ejecuta mientras se construye el árbol.</li>
        <li>Si <code>onMount</code> devuelve una función, esa función se ejecuta al destruir, después de los callbacks <code>onDestroy</code> del elemento.</li>
        <li><code>onDestroy</code> se ejecuta cuando Nuclo quita el elemento: se elimina una fila de <code>list()</code>, cambia una rama de <code>when()</code>, un <code>into()</code> abandona su región, o <code>forceUpdate()</code> lo descarta. Se ejecuta justo antes de la eliminación, así que el elemento todavía está en el documento.</li>
      </ul>
      <h3>Eliminación directa del DOM</h3>
      <p>Si quitas un elemento tú mismo, con <code>node.remove()</code> o <code>innerHTML = ''</code>, su <code>onDestroy</code> y sus limpiezas nunca se ejecutan, y los temporizadores siguen corriendo. Nuclo no tiene <code>unmount()</code>. Para desmontar una app con limpieza, envuélvela en <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Orden y errores</h3>
      <ul>
        <li>Puedes registrar tantos hooks como quieras, en cualquiera de las dos formas. Se ejecutan en orden de registro.</li>
        <li><code>onDestroy</code> siempre ejecuta primero los hijos y después el padre.</li>
        <li>Los elementos se montan en el orden de su primer hook <code>onMount</code>, que sigue el orden de los argumentos, y cada elemento ejecuta todos sus hooks juntos. Pasa el hook de un padre antes que sus hijos si estos dependen de él.</li>
        <li>Un hook que lanza un error se registra con <code>console.error</code>. Los demás hooks se ejecutan igualmente.</li>
        <li>El callback debe devolver nada o una función de limpieza, así que no lo hagas <code>async</code>. Una Promise devuelta nunca se usa como limpieza. Inicia el trabajo asíncrono dentro: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Los hooks nunca se ejecutan en el servidor. En el cliente, se ejecutan después de <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Nota:</strong> los hooks no son efectos. Nunca se ejecutan de nuevo cuando cambia el estado. Cada uno se ejecuta como máximo una vez por elemento.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "Actualizaciones",
    sections: [
      {
        id: "explicit-updates",
        title: "Actualizaciones explícitas",
        content: `
      <p>Nuclo nunca actualiza la página por su cuenta. Cambia tu estado y después llama a <code>update()</code>.</p>
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
      <p>Cambia todo el estado que quieras y después llama a <code>update()</code> una sola vez:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Llama a <code>update()</code> desde manejadores de eventos, temporizadores, callbacks de fetch u <code>onMount</code>. No lo llames desde dentro de un valor dinámico.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Valores dinámicos",
        content: `
      <p>Una función <strong>sin parámetros</strong> es un <strong>valor dinámico</strong>. Nuclo la ejecuta una vez cuando construye el elemento, y de nuevo en cada <code>update()</code>. Usa valores dinámicos para hijos de texto, valores de atributos, <code>style</code> y <code>className</code>. Para hijos que aparecen, desaparecen o se repiten, usa <a href="#api-when"><code>when()</code></a> y <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo comprueba el número de parámetros (<code>fn.length</code>). Una función que declara un parámetro es un <a href="#tag-builders">modificador personalizado</a> y se ejecuta solo una vez. <code>(x = 0) =&gt; …</code> y <code>(...args) =&gt; …</code> tienen una longitud de 0, así que son dinámicas.</p>
      <h3>Texto dinámico</h3>
      <ul>
        <li>Un string, number, bigint o boolean se renderiza como <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> muestra "false", así que escribe <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> y <code>undefined</code> se renderizan como texto vacío.</li>
        <li>Un resultado de <code>css()</code> o <code>cx()</code> en la primera ejecución convierte la función en una clase dinámica, no en texto. Consulta <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Un nodo, builder, array u objeto plano no renderiza nada, y nunca se actualiza.</li>
      </ul>
      <h3>Atributos dinámicos</h3>
      <ul>
        <li>Nuclo escribe un valor solo cuando difiere del último valor que escribió. No lo compara con el DOM real, así que si un usuario escribe en un input y tu función devuelve el mismo valor que antes, el texto que escribió se conserva.</li>
        <li>Un resultado de <code>null</code> o <code>undefined</code> no escribe nada, así que el valor anterior se conserva. <code>className</code> es la excepción: cualquier resultado falsy quita las clases dinámicas y conserva las estáticas.</li>
        <li>Una función <code>style</code> aplica el objeto devuelto en cada actualización.</li>
      </ul>
      <h3>Errores</h3>
      <p>Si un valor dinámico lanza un error, Nuclo lo captura y el resto de la actualización se ejecuta igualmente. El texto queda vacío o conserva su valor anterior, y un atributo conserva su valor anterior. Ambos se recuperan en el siguiente <code>update()</code> que tenga éxito. La excepción: una función de texto que lanza un error en su <strong>primera</strong> ejecución queda vacía para siempre.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Ejecuta una pasada sincrónica sobre cada valor dinámico de la página. Con ids, solo actualiza lo que está dentro de los elementos marcados con esos ids de <a href="#api-scope"><code>scope()</code></a>. Cada pasada ejecuta estos pasos en orden:</p>
      <ol>
        <li><code>list()</code>: lee los elementos de nuevo y añade, mueve o quita filas.</li>
        <li><code>when()</code>: comprueba las condiciones de nuevo. Una rama se reconstruye solo cuando otra rama distinta pasa a estar activa.</li>
        <li>Atributos dinámicos, incluidos <code>style</code> y <code>className</code>.</li>
        <li>Texto dinámico.</li>
        <li><code>onMount</code> para los elementos que insertaron los pasos 1 y 2.</li>
      </ol>
      <ul>
        <li><strong>Ejecuta todo.</strong> Cada valor dinámico se ejecuta en cada llamada, incluso cuando sus datos no cambiaron. Solo se omite la escritura en el DOM. Mantén los valores dinámicos rápidos y sin efectos secundarios.</li>
        <li><strong>Solo nodos en el documento.</strong> Si un nodo no está en el documento cuando se ejecuta <code>update()</code>, Nuclo deja de seguirlo. Nunca vuelve a actualizarse, ni siquiera después de insertarlo. Esto también aplica a <code>list()</code> y <code>when()</code>. Renderiza en un contenedor que esté en el documento.</li>
        <li><strong>Los valores estáticos nunca cambian.</strong> Los strings simples y los valores de atributos quedan fijados cuando se construye el elemento. Para reconstruirlos, usa <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Errores.</strong> Los errores de texto y atributos se capturan, y la pasada continúa. Si una condición de <code>when()</code> lanza un error, el error se registra y ese <code>when()</code> deja de actualizarse. Si una función <code>items</code> o <code>renderItem</code> de <code>list()</code> lanza un error, el error escapa de <code>update()</code> y los pasos restantes no se ejecutan.</li>
        <li><strong>Servidor.</strong> <code>update()</code> no hace nada en el servidor.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Da uno o más ids de ámbito al elemento al que se pasa. <code>update('id')</code> entonces actualiza solo lo que está dentro de ese elemento, incluidos los atributos del propio elemento.</p>
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
        <li>Un elemento puede tener varios ids: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> actualiza todo lo que está dentro de <code>a</code> o <code>b</code>. Si varios elementos usan el mismo id, todos se actualizan.</li>
        <li>Con ámbitos anidados, <code>update('outer')</code> incluye el ámbito interior. <code>update('inner')</code> no toca el exterior.</li>
        <li>Un id que ningún elemento del documento tiene no actualiza <strong>nada</strong> y no lanza ningún error, así que revisa la ortografía.</li>
        <li><code>scope()</code> no hace nada en el servidor.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Renderiza contenido según una condición. Nuclo comprueba las condiciones de nuevo en cada <code>update()</code>. Gana la primera condición verdadera. Si ninguna es verdadera, se renderiza el contenido de <code>.else()</code>. Sin <code>.else()</code>, no se renderiza nada.</p>
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
      <h3>Condiciones</h3>
      <ul>
        <li>Para estado, pasa una función. Un booleano simple se lee una sola vez: <code>when(open, …)</code> nunca cambia.</li>
        <li>En TypeScript la función debe devolver un booleano. Escribe <code>() =&gt; items.length &gt; 0</code> o <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Qué se actualiza</h3>
      <ul>
        <li>Mientras la misma rama sigue activa, sus elementos se conservan. Los valores dinámicos, las listas y los bloques <code>when()</code> dentro de ella siguen actualizándose.</li>
        <li>Cuando otra rama pasa a estar activa, el contenido anterior se quita y se ejecutan sus hooks <code>onDestroy</code>. La nueva rama se construye desde cero y se ejecutan sus hooks <code>onMount</code>. El estado de los elementos anteriores, como el texto de un input o el foco, se pierde.</li>
      </ul>
      <h3>Contenido de una rama</h3>
      <p>Pon hijos en una rama: texto, texto dinámico, builders, <code>list()</code> y <code>when()</code> anidados. Pasa builders como <code>p('Hi')</code>, no nodos del DOM: un nodo del DOM deja de actualizarse después de que su rama se oculte una vez.</p>
      <p>Los objetos de atributos y <code>on()</code> en una rama se aplican al elemento padre, y permanecen después de que la rama se oculte. Para un atributo condicional, usa un atributo dinámico: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Encadenamiento</h3>
      <p><code>.when()</code> y <code>.else()</code> devuelven un builder nuevo y no cambian el original. Si llamas a <code>.else()</code> dos veces, gana la última llamada.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Renderiza una fila por elemento. En cada <code>update()</code>, Nuclo llama a <code>items()</code> de nuevo y empareja los nuevos elementos con las filas existentes por identidad (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Cómo se emparejan las filas</h3>
      <ul>
        <li>Un elemento que sigue presente conserva su fila. Nuclo mueve la fila si hace falta, y no llama a <code>renderItem</code> de nuevo.</li>
        <li>Un elemento nuevo recibe una fila nueva. Un elemento eliminado pierde su fila, y se ejecutan sus hooks <code>onDestroy</code>.</li>
        <li>Los elementos duplicados reciben cada uno su propia fila.</li>
        <li>Puedes modificar el array en el sitio (<code>push</code>, <code>splice</code>, <code>sort</code>) o devolver un array nuevo.</li>
      </ul>
      <p>Una fila conservada nunca se renderiza de nuevo, así que usa valores dinámicos para los campos que cambian:</p>
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
      <p>Las copias son elementos nuevos, así que reemplazar el array con <code>todos.map((t) =&gt; ({ ...t }))</code> reconstruye todas las filas.</p>
    `,
        afterContent: `
      <h3>Qué devuelve <code>renderItem</code></h3>
      <ul>
        <li>Devuelve un elemento, como <code>li(...)</code>, <code>tr(...)</code> o un builder SVG. Devuelve <code>null</code> o <code>undefined</code> para omitir un elemento. Los strings, los nodos de texto y los fragmentos no renderizan nada.</li>
        <li>No devuelvas <code>when()</code> ni <code>list()</code> directamente. Ponlos dentro del elemento de la fila: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Para ocultar elementos, filtra en <code>items()</code>, no en <code>renderItem</code>.</li>
        <li>Mantén <code>renderItem</code> sin efectos secundarios. Nuclo puede llamarlo más de una vez para el mismo elemento.</li>
      </ul>
      <h3>El índice</h3>
      <p><code>index</code> es la posición del elemento cuando se creó su fila. No se actualiza cuando las filas se mueven. Para la posición actual, usa un valor dinámico: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iterables</h3>
      <p>Cualquier iterable funciona: arrays, <code>Set</code>, generadores y <code>map.values()</code>. Devolver el mismo array o <code>Set</code> cada vez está bien. Un iterador, como un generador o <code>map.values()</code>, se agota tras una pasada, así que créalo dentro de <code>items()</code> en cada llamada. Iterar un <code>Map</code> directamente crea arrays <code>[key, value]</code> nuevos cada vez, así que todas las filas se reconstruyen. Usa <code>map.values()</code> en su lugar.</p>
      <h3>Ubicación</h3>
      <p>Las filas aparecen donde <code>list()</code> está entre sus hermanos, entre dos marcadores de comentario. Los demás hijos del padre no se tocan. <code>list()</code> también funciona dentro de builders SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() e into()",
        content: `
      <p><code>region()</code> marca un lugar con nombre en el árbol. <code>into()</code> lo rellena desde cualquier otro sitio, a cualquier profundidad. El layout no recibe el contenido como prop, y el componente que construye el contenido no sabe dónde acaba.</p>
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
      <h3>Cómo funciona</h3>
      <ul>
        <li><code>into()</code> deja solo un comentario donde se escribe. Su contenido se renderiza entre los marcadores de la región.</li>
        <li>El orden no importa. Un <code>into()</code> construido antes que su región espera y se muestra en el momento en que se construye la región. Las vistas se muestran en el orden en que se escribieron.</li>
        <li>El contenido vive tanto como la vista. Cuando el <code>when()</code> que contiene un <code>into()</code> se cierra, o se quita su fila de <code>list()</code>, el contenido abandona la región. Abrirlo de nuevo añade una copia, no dos.</li>
        <li>Cuando una región desaparece, por ejemplo porque su <code>when()</code> se cierra, sus vistas vuelven a esperar. Una región construida más tarde con el mismo id las muestra.</li>
        <li>Un <code>into()</code> cuyo id no coincide con ninguna región no renderiza nada y no lanza ningún error, así que revisa la ortografía.</li>
        <li>Los ids son únicos en el árbol. Una segunda región construida con un id ya activo registra una advertencia.</li>
        <li>Las regiones funcionan con el <a href="#api-ssr">renderizado en el servidor</a>. En <code>hydrate()</code>, cada vista reclama el HTML que el servidor renderizó en lugar de construirlo de nuevo.</li>
      </ul>
      <h3>Opciones</h3>
      <ul>
        <li><code>id</code>: el nombre que las llamadas a <code>into()</code> usan para encontrar la región.</li>
        <li><code>type</code>: <code>'latest'</code> (el valor por defecto) muestra solo la vista más reciente. <code>'stack'</code> muestra todas las vistas, en orden de llegada.</li>
        <li><code>empty</code>: se renderiza mientras la región no contiene ninguna vista.</li>
      </ul>
      <h3>Regiones apiladas</h3>
      <p>Con <code>type: 'stack'</code>, una vista que se abre sobre otra no reconstruye la que está debajo. Su DOM, su foco y el estado de sus formularios se conservan. Úsalo para una capa como un diálogo sobre una página.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>Varias regiones a la vez</h3>
      <p>Pasa un objeto para rellenar más de una región desde un único <code>into()</code>. Un valor puede ser un hijo o un array de hijos. Ambas formas se anidan: un <code>into()</code> dentro del contenido de otra vista apunta a su propia región.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Un diálogo abierto desde lo profundo del árbol</h3>
      <p>La región de overlay está en la raíz. Cualquier componente, a cualquier profundidad, abre un diálogo envolviendo un <code>into()</code> en un <code>when()</code>. Cerrar el <code>when()</code> quita el diálogo de la región.</p>
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
      <h3>Toasts desde filas de una lista</h3>
      <p>Cada fila de un <code>list()</code> es una vista. Una región apilada las muestra en orden, y quitar un elemento del array quita su toast.</p>
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
      <h3>Un título de página definido por la propia página</h3>
      <p>Con el <code>type: 'latest'</code> por defecto, gana la vista más reciente. El layout es dueño del encabezado, y la página que esté abierta le pone nombre. Una página sin <code>into('title', …)</code> deja el texto de <code>empty</code>.</p>
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
      <h3>Valores dinámicos dentro de una vista</h3>
      <p>El contenido de un <code>into()</code> es contenido Nuclo ordinario. Las funciones dentro de él son valores que dependen del estado y se refrescan en <code>update()</code>, esté donde esté la región.</p>
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
      <h3>Una región que aparece y desaparece</h3>
      <p>El <code>into()</code> del panel se escribe una sola vez. Mientras el usuario no ha iniciado sesión no hay región <code>main</code>, así que la vista espera. Iniciar sesión construye la región y la vista se muestra. Cerrar sesión quita la región y la vista vuelve a esperar.</p>
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
      <h3>Una vista con su propia región</h3>
      <p>Una vista puede contener un <code>region()</code>, y otras vistas pueden apuntar a él. Aquí la página del editor trae consigo una región <code>tabs</code>, y cada pestaña la rellena. Cuando el editor se cierra, su región se va con él.</p>
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
      <h3>Ejemplo en vivo</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> solo ejecuta valores dinámicos. Los valores estáticos, como el texto en <code>h1(labels[lang].title)</code>, quedan fijados cuando se construye el árbol. <code>forceUpdate()</code> llama a tus componentes de nuevo y parchea el DOM real para que coincida, valores estáticos incluidos. Úsalo para cambios poco frecuentes que afectan a toda la app, como cambiar el idioma. Usa <code>update()</code> para todo lo demás.</p>
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
      <p>Sin argumentos, <code>forceUpdate()</code> reconstruye cada raíz renderizada con <code>render(App)</code> o <code>hydrate(App)</code>. Las raíces renderizadas con <code>render(App())</code> se omiten. Si un componente lanza un error, el error se registra y esa raíz conserva su DOM anterior. Un error lanzado más tarde, mientras se aplica la nueva construcción, también se registra, pero las partes ya parcheadas siguen parcheadas.</p>
      <h3>Qué se conserva y qué cambia</h3>
      <ul>
        <li>Los hijos se emparejan en orden, por etiqueta. Un elemento que coincide se reutiliza, así que el foco y los valores escritos en los inputs se conservan, y sus hooks <code>onMount</code> no se ejecutan de nuevo. En cuanto la etiqueta de un hijo difiere, ese hijo y todos los hermanos posteriores se construyen desde cero.</li>
        <li>El texto, los atributos, las clases, los estilos, los listeners, las ramas de <code>when()</code> y las filas de <code>list()</code> siguen la nueva construcción.</li>
        <li>Los elementos nuevos se crean, y se ejecutan sus hooks <code>onMount</code>. Los elementos que la nueva construcción ya no genera se quitan, y se ejecutan sus hooks <code>onDestroy</code>.</li>
        <li>Las filas de <code>list()</code> también se emparejan por posición, no por elemento, así que un elemento de fila reutilizado puede acabar mostrando un elemento distinto.</li>
        <li>Los atributos que la nueva construcción ya no establece no se quitan.</li>
      </ul>
      <div class="docs-callout"><strong>Cuidado:</strong> el estado declarado dentro de una función de componente se reinicia, porque la función se ejecuta de nuevo. Mantén fuera del componente el estado que deba sobrevivir.</div>
      <p><strong>Forma explícita.</strong> <code>forceUpdate(App(), parent)</code> reconstruye un árbol en <code>parent</code> y devuelve su raíz. No registra la raíz para llamadas posteriores. Como <code>hydrate()</code>, espera que la raíz sea el primer nodo de <code>parent</code>. Si el primer nodo tiene otra etiqueta, se reemplaza.</p>
      <p>En el servidor, <code>forceUpdate()</code> no hace nada.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "Renderizado",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>Construye tu árbol y añade su elemento raíz a <code>parent</code>. <code>parent</code> es <code>document.body</code> por defecto. Devuelve el elemento raíz.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Puedes pasar el componente (<code>render(App)</code>) o el builder que devuelve (<code>render(App())</code>). El DOM es el mismo. Solo <code>render(App)</code> permite que <a href="#api-force-update"><code>forceUpdate()</code></a> reconstruya la raíz más tarde, así que es la forma preferible.</li>
        <li>Añade al final. No vacía <code>parent</code>, así que llamarlo dos veces añade dos copias.</li>
        <li>Todos los <code>onMount</code> del árbol se han ejecutado cuando <code>render()</code> devuelve.</li>
        <li>Renderiza en un elemento que esté en el documento. Consulta <a href="#api-update"><code>update()</code></a>.</li>
        <li>La raíz debe ser un elemento, como <code>div(...)</code>, no <code>when()</code> ni <code>list()</code>.</li>
        <li><code>index</code> es interno. No decide dónde se inserta el elemento. Omítelo.</li>
      </ul>
      <p>Un componente pasado como <code>render(App)</code> no debe recibir parámetros. Un parámetro obligatorio es un error de tipo. Uno opcional pasa la comprobación de tipos, pero <code>render()</code> lanza un error en tiempo de ejecución. Envuelve un componente que recibe props:</p>
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
      <p>Toma el control del HTML generado por <a href="#api-ssr"><code>renderToString()</code></a>. Reutiliza los elementos existentes, adjunta los listeners de eventos y conecta los valores dinámicos, <code>when()</code> y <code>list()</code>, para que <code>update()</code> funcione después. Luego ejecuta los hooks <code>onMount</code>. <code>parent</code> es <code>document.body</code> por defecto. Devuelve el elemento raíz.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Usa el mismo componente, y los mismos datos, que el servidor.</li>
        <li>Hidrata en un contenedor dedicado. La raíz de la app debe ser su primer nodo, aunque los espacios en blanco no importan. Si otro nodo va primero, Nuclo reemplaza ese nodo y deja atrás la copia del servidor.</li>
        <li>Como con <code>render()</code>, pasa <code>App</code>, no <code>App()</code>, para que <code>forceUpdate()</code> pueda reconstruir la raíz más tarde. <code>App</code> no debe recibir parámetros. Con uno opcional, <code>hydrate()</code> no adjunta nada y no avisa. Envuelve un componente que recibe props: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Si no hay HTML del servidor, usa <code>render()</code>.</li>
      </ul>
      <h3>Cuando el servidor y el cliente difieren</h3>
      <p>Gana el cliente:</p>
      <ul>
        <li>Una etiqueta raíz distinta: ese nodo se reemplaza con DOM nuevo. Un contenedor vacío: se añade DOM nuevo.</li>
        <li>El texto distinto se parchea. Los elementos de <code>list()</code> y las ramas de <code>when()</code> distintos siguen al cliente.</li>
        <li>Los hijos sobrantes del servidor se quitan, y los que faltan se crean.</li>
        <li>Los atributos que el servidor escribió pero el cliente no establece se dejan como están.</li>
      </ul>
      <p><code>renderToString()</code> escribe comentarios HTML como marcadores, por ejemplo <code>&lt;!-- text-0 --&gt;</code> antes de cada nodo de texto. <code>hydrate()</code> los necesita, así que no elimines los comentarios del HTML del servidor. Sin los marcadores, la hidratación borra las filas de <code>list()</code>, y <code>list()</code> y <code>when()</code> dejan de actualizarse.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Renderizado en el servidor",
        content: `
      <p>Renderiza un componente a un string HTML en el servidor. En el navegador, llama a <a href="#api-hydrate"><code>hydrate()</code></a> con el mismo componente para hacer ese HTML interactivo. Los runtimes de servidor no tienen <code>document</code>, así que importa primero <a href="#api-polyfill"><code>nuclo/polyfill</code></a>.</p>
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
      <p>Mantén <code>id="nuclo-styles"</code> en la etiqueta style. El cliente reutiliza ese elemento y añade solo las reglas nuevas. Consulta <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Qué se ejecuta en el servidor</h3>
      <ul>
        <li>Cada llamada a <code>renderToString()</code> construye el árbol y ejecuta cada valor dinámico una vez.</li>
        <li>Los manejadores de eventos, <code>onMount</code> y <code>onDestroy</code> nunca se ejecutan. <code>update()</code>, <code>scope()</code> y <code>forceUpdate()</code> no hacen nada.</li>
        <li>El renderizado es sincrónico. Carga primero tus datos y después renderiza.</li>
        <li>Nada queda registrado después de un renderizado, así que un proceso puede servir muchas peticiones. Pasa los datos de la petición como argumentos, por ejemplo <code>renderToString(Page(user))</code>. Las variables a nivel de módulo las comparten todas las peticiones.</li>
        <li>No llames a <code>render()</code> en el servidor. Añade contenido al <code>document.body</code> compartido.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Acepta un builder (<code>App()</code>), un componente (<code>App</code>) o un nodo del DOM. <code>null</code> y <code>undefined</code> devuelven <code>""</code>. La raíz debe ser un elemento. Un componente pasado como <code>renderToString(Page)</code> no debe recibir parámetros, así que pasa <code>Page(user)</code> para uno que recibe datos.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>El texto y los valores de atributos se escapan como HTML. El texto dentro de <code>script()</code> y <code>style()</code> se escribe tal cual, solo con las etiquetas de cierre partidas, así que nunca pongas ahí entrada del usuario.</li>
        <li>No lanza errores. Si el componente, una función de <code>list()</code> o una condición de <code>when()</code> lanza un error, o falta el polyfill, registra el error y devuelve <code>""</code>. Comprueba si el resultado está vacío cuando la petición deba fallar. Una función de texto o de atributo que lanza un error solo se renderiza vacía.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Lo mismo que <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Envuelve la salida en un elemento. <code>containerTag</code> es <code>"div"</code> por defecto, y <code>containerAttrs</code> es <code>{}</code>. Los valores de atributos se escapan. Los nombres de atributos se escriben tal como se dan, así que usa nombres HTML como <code>class</code>. Nunca pases entrada del usuario como etiqueta.</p>
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
      <p>Un DOM pequeño para que Nuclo pueda construir árboles en Node y Bun. Impórtalo una vez, antes de tu primer renderizado. La mayoría de las apps solo necesitan la importación simple.</p>
      <ul>
        <li>Cuando no hay <code>window</code>, define <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> y <code>HTMLElement</code>, pero solo los que faltan. No crea <code>window</code>.</li>
        <li>En un navegador, o bajo jsdom, no hace nada.</li>
        <li><code>Event</code> y <code>CustomEvent</code> son los constructores propios del runtime. <code>Node</code>, <code>Element</code> y <code>HTMLElement</code> son alias de las clases del polyfill.</li>
      </ul>
      <p>Es un DOM para construir árboles, no un navegador. No tiene <code>innerHTML</code> ni <code>getElementById</code>, <code>querySelector()</code> devuelve <code>null</code>, y los listeners de eventos se ignoran. Usa <code>renderToString()</code> para obtener el HTML.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
