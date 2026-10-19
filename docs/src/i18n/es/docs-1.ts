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
      <p>Nuclo es una biblioteca DOM pequeña para TypeScript. Armas la página con funciones tan simples como <code>div()</code> y <code>button()</code>, guardas el estado en variables comunes y, cuando la página debe cambiar, llamas a <code>update()</code>.</p>
      <p>Sin virtual DOM, sin compilador, sin proxies y sin signals.</p>
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
        <li>Describe la UI con funciones constructoras de etiquetas.</li>
        <li>Donde un valor dependa del estado, pasa una función en lugar del valor.</li>
        <li>Modifica el estado con JavaScript normal y corriente.</li>
        <li>Llama a <code>update()</code>: Nuclo vuelve a ejecutar esas funciones y parchea el DOM.</li>
      </ol>
      <p>Asignar una variable no toca el DOM. La página solo cambia cuando llamas a <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Inicio rápido",
        content: `
      <p><code>create-nuclo</code> te deja un proyecto de Vite y TypeScript listo para usar con Nuclo:</p>
    `,
        afterContent: `
      <p>Te pregunta cómo se llamará el proyecto. Si prefieres saltarte la pregunta, pasa el nombre y las opciones directamente. Con npm, recuerda poner <code>--</code> antes de las opciones:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Luego instala las dependencias y levanta el servidor de desarrollo:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Opciones</h3>
      <ul>
        <li><code>[project-name]</code>: la carpeta donde se crea el proyecto. Por defecto, <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: la plantilla a copiar. Por ahora solo existe <code>basic</code>.</li>
        <li><code>-y, --yes</code>: no pregunta nada y acepta los valores por defecto.</li>
        <li><code>-f, --force</code>: escribe aunque la carpeta ya tenga contenido.</li>
        <li><code>-h, --help</code>: muestra la ayuda.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Instalación e importaciones",
        content: `
      <p>Para agregar Nuclo a un proyecto que ya tienes:</p>
      ${sh("npm install nuclo")}
      <p>También sirve <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> o <code>bun add nuclo</code>. Nuclo no trae dependencias.</p>
      <p>El enrutamiento no viene en el paquete principal: se publica aparte como <a href="#router-overview"><code>nuclo-router</code></a>, y lo instalas junto a <code>nuclo</code> solo cuando lo necesites.</p>
      <h3>Globales</h3>
      <p><code>import 'nuclo'</code> registra lo siguiente en <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 funciones constructoras de etiquetas</strong>: 112 de HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) y 63 de SVG, que llevan el sufijo <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). Consulta <a href="#tag-builders">Funciones constructoras de etiquetas</a>.</li>
        <li><strong>16 helpers</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> y <code>globalStyle</code>.</li>
      </ul>
      <p>La importación tiene que correr antes que cualquier código que llame a una función constructora. Los módulos ES se ejecutan en el orden en que se importan, así que esto falla:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Pon <code>import 'nuclo'</code> en la primera línea de tu archivo de entrada, o impórtalo en cada archivo que use los globales.</p>
      <h3>Importaciones con nombre</h3>
      <p>Los helpers también se exportan por nombre, y son exactamente las mismas funciones que los globales. <code>getCssText()</code> y <code>resetStyles()</code> solo existen como exportaciones con nombre. Las constructoras de etiquetas, en cambio, solo existen como globales, así que <code>import { div } from 'nuclo'</code> no funciona.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Puntos de entrada</h3>
      <ul>
        <li><code>nuclo</code>: registra los globales y exporta los 16 helpers, más <code>getCssText</code> y <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> y <code>getCssText</code>. Consulta <a href="#api-ssr">Renderizado en el servidor</a>.</li>
        <li><code>nuclo/polyfill</code>: un DOM mínimo para Node y Bun. Consulta <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: solo tipos. Consulta <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo trae sus propios tipos. Solo necesitas dos cosas:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> y <code>nodenext</code> aún no están soportados.</li>
        <li>La lib <code>DOM</code>. TypeScript ya la incluye si no defines <code>lib</code>.</li>
      </ul>
      <p>Basta con que un archivo del proyecto importe <code>'nuclo'</code> para que todos los demás vean los tipos globales, y no hace falta nada más. Si ninguno lo importa (por ejemplo, en un tsconfig aparte para los tests), declara los tipos a mano:</p>
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
      <p>O agrega <code>/// &lt;reference types="nuclo/types" /&gt;</code> a un archivo <code>.d.ts</code>.</p>
      <h3>Tipos útiles</h3>
      <p>Todos son globales, así que los usas sin importar nada:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: lo que devuelve una constructora de etiquetas. Úsalo como tipo de retorno de un componente.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: cualquier cosa que una constructora de etiquetas acepta como argumento.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: lo que devuelven <code>render()</code> y <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: cualquier nombre de etiqueta HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: el objeto de atributos que acepta una constructora, con los controladores <code>on*</code>, <code>onMount</code> y <code>onDestroy</code> incluidos. Úsalo en componentes que reenvían atributos.</li>
        <li><code>MountCallback</code> y <code>DestroyCallback</code>: los controladores de <code>onMount</code> y <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: lo que devuelven <code>when()</code> y <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: las opciones que recibe <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> y el resto de los tipos de estilos. También puedes importarlos: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> declara todos los miembros del DOM como opcionales. Cuando necesites el tipo completo del elemento, haz un cast: <code>render(App, root) as HTMLDivElement</code>.</p>
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
        title: "Funciones constructoras de etiquetas",
        content: `
      <p>Cada etiqueta HTML es una función global con su mismo nombre: <code>div</code>, <code>span</code>, <code>input</code>, … La única excepción es <code>&lt;var&gt;</code>, que se llama <code>var_</code> porque <code>var</code> es una palabra reservada. Las etiquetas SVG llevan todas el sufijo <code>Svg</code>: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Llamar a una constructora todavía no crea ningún elemento. <code>div('Hi')</code> devuelve un <strong>builder</strong>: una función que fabricará el elemento más adelante. Nuclo la invoca cuando la montas con <code>render()</code> o la colocas dentro de otro builder, de un <code>when()</code> o de un <code>list()</code>, y cada uso produce un elemento nuevo.</p>
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
      <p>Un builder acepta tantos argumentos como quieras y los aplica de izquierda a derecha:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: un nodo de texto.</li>
        <li><strong><code>() =&gt; value</code></strong>: texto que se refresca en cada <code>update()</code>. Consulta <a href="#dynamic-functions">Valores dinámicos</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: se ignoran.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: se renderizan como el texto "true" o "false". Para condiciones, usa <code>when()</code>.</li>
        <li><strong>Un objeto plano</strong>: atributos. Consulta <a href="#attributes">Atributos</a>.</li>
        <li><strong>Un resultado de <code>css()</code>, <code>cx()</code> o <code>variants()</code></strong>: suma sus clases.</li>
        <li><strong><code>on(...)</code></strong>: un listener de eventos o un hook de ciclo de vida.</li>
        <li><strong>Otro builder, <code>when()</code> o <code>list()</code></strong>: un hijo.</li>
        <li><strong>Un <code>Node</code> del DOM</strong>: se inserta tal cual.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: un modificador personalizado, más abajo lo vemos.</li>
      </ul>
      <h3>Trampas habituales</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> renderiza el texto "false". Lo correcto es <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Un array no cuenta como hijo: hay que expandirlo, así: <code>ul(...names.map((n) =&gt; li(n)))</code>. Si la lista va a cambiar, usa <code>list()</code>.</li>
        <li>Una variable local con el nombre de una etiqueta oculta a la constructora. Dentro de <code>function Row(label: string)</code>, <code>label(...)</code> ya no se puede llamar. Renombra variables locales como <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> o <code>i</code>.</li>
        <li>Los navegadores exponen como variable global cada elemento que tiene <code>id</code>. Si la página trae un <code>&lt;main id="main"&gt;</code> antes de que cargue Nuclo, Nuclo respeta ese global y <code>main(...)</code> lanza un <code>TypeError</code>. Elige otros ids.</li>
      </ul>
      <h3>Modificadores personalizados</h3>
      <p>Una función que declara al menos un parámetro se ejecuta una sola vez, en el orden de los argumentos, mientras se construye el elemento. El primer parámetro es el elemento. El segundo es un índice interno, así que no cuentes con él. Si devuelve un string o un número, se convierte en texto; un <code>Node</code> se agrega como hijo, y un objeto se aplica como atributos.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Cómo obtener el elemento</h3>
      <p><code>render()</code> te devuelve el elemento raíz. Dentro de un árbol, usa <code>on("mount", (el) =&gt; …)</code> o un modificador personalizado. También puedes ejecutar tú mismo el builder para crear un elemento suelto, sin conectar al documento:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Agrégalo al documento antes del próximo <code>update()</code>: un nodo que no esté en el documento cuando se ejecuta <code>update()</code> deja de actualizarse para siempre.</p>
      <h3>SVG</h3>
      <p>Las constructoras de SVG aceptan los mismos argumentos. Nuclo asigna cada atributo SVG con <code>setAttribute</code>, así que nombres como <code>"stroke-width"</code> funcionan exactamente como los escribes.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Todas las constructoras</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Componentes",
        content: `
      <p>Un componente es una función corriente que devuelve un builder, como <code>button(...)</code>. No hay una API de componentes que aprender, y no se crea nada hasta que lo renderizas o lo metes en un árbol.</p>
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
      <p>El estado que declaras dentro de la función es de esa instancia; el que declaras fuera lo comparten todas. <code>forceUpdate()</code> vuelve a llamar a los componentes, y con eso reinicia el estado declarado dentro de ellos.</p>
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
      <p>Para fijar atributos, pasa un objeto plano. Puedes pasar varios; si repiten una clave, gana el último, salvo <code>className</code> y <code>style</code>, que se combinan. Cada valor puede ser estático o una función sin parámetros que se vuelve a ejecutar en cada <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Cómo se asigna un valor</h3>
      <ul>
        <li>Si el elemento HTML tiene una propiedad con ese nombre (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo asigna la propiedad. Si no, llama a <code>setAttribute(key, String(value))</code>, que es lo que pasa con <code>"aria-*"</code> y <code>"data-*"</code>.</li>
        <li>En elementos SVG, Nuclo siempre usa <code>setAttribute</code>.</li>
        <li><code>null</code> y <code>undefined</code> se ignoran. Si un valor dinámico devuelve <code>null</code> o <code>undefined</code>, se queda el valor anterior. Para borrarlo, devuelve <code>""</code>, o <code>false</code> si es una propiedad booleana.</li>
        <li>Los booleanos funcionan con las propiedades booleanas del DOM, como <code>disabled</code> en un botón, <code>checked</code>, <code>hidden</code> y <code>required</code>. En cualquier otro caso, <code>true</code> y <code>false</code> se escriben como los strings "true" y "false".</li>
        <li>Usa claves <code>"data-*"</code>: <code>dataset</code> no está soportado.</li>
        <li><code>innerHTML</code> no se escapa y el renderizado en el servidor tampoco lo emite. Mejor evitarlo.</li>
      </ul>
      <h3>Clases</h3>
      <p>Usa <code>className</code>. Los strings estáticos de clases, los resultados de <code>css()</code> y un <code>className</code> dinámico se suman entre sí. El <code>className</code> dinámico respeta las clases estáticas, y cuando devuelve <code>""</code> solo quedan estas.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>En elementos HTML no uses la clave <code>class</code>: escribe el atributo en bruto y reemplaza todas las clases aplicadas antes, incluidas las de <code>css()</code>.</p>
      <h3>Estilos en línea</h3>
      <p><code>style</code> acepta un objeto con claves en camelCase, o una función que devuelve uno.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo no agrega unidades por ti: escribe <code>"12px"</code>, no <code>12</code>. Las propiedades sin unidad, como <code>opacity</code> y <code>zIndex</code>, sí aceptan números.</li>
        <li><code>""</code>, <code>null</code> y <code>undefined</code> limpian la propiedad.</li>
        <li>Un estilo dinámico solo asigna las claves que devuelve. Si una clave deja de aparecer, conserva su último valor; devuelve <code>""</code> para limpiarla.</li>
        <li>No se admiten strings de estilo (<code>"color: red"</code>) ni propiedades personalizadas (<code>"--gap"</code>). Para eso está <code>css()</code>, que acepta propiedades personalizadas mediante <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Eventos",
        content: `
      <p>Para escuchar eventos tienes dos caminos: los atributos <code>on*</code> y el modificador <code>on()</code>.</p>
      <h3>Atributos <code>on*</code></h3>
      <p>Dentro de un objeto de atributos, una función bajo una clave como <code>onClick</code> (<code>on</code> seguido de mayúscula) es un controlador de eventos, no un valor dinámico.</p>
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
        <li>TypeScript infiere el tipo del evento a partir de la clave y del elemento. Tanto <code>e.currentTarget</code> como <code>this</code> apuntan al elemento.</li>
        <li>Nuclo asigna la propiedad nativa, así que <code>onClick</code> acaba siendo <code>el.onclick</code>. Hay un solo controlador por evento: un <code>onClick</code> posterior reemplaza al anterior.</li>
        <li><code>onDoubleClick</code> y <code>onDblClick</code> significan lo mismo: <code>dblclick</code>. Las claves en minúsculas como <code>onclick</code> dan error de tipos.</li>
        <li>Un nombre que no corresponde a un evento conocido escucha su versión en minúsculas: <code>onMyEvent</code> escucha <code>"myevent"</code>.</li>
        <li>Si el controlador lanza un error, nadie lo captura.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> devuelve un modificador que llama a <code>addEventListener</code> sobre el elemento.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Cada <code>on()</code> suma un listener, y todos se ejecutan en orden.</li>
        <li><code>options</code> se pasa tal cual a <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Si pasas <code>on()</code> directo a un builder, el tipo del elemento se infiere: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Si un listener lanza un error, Nuclo lo registra con <code>console.error</code> y los demás listeners siguen ejecutándose.</li>
        <li>Cuando Nuclo quita el elemento, quita también el listener. En el servidor, <code>on()</code> no hace nada.</li>
        <li>Un mismo valor de <code>on()</code> se puede reutilizar en tantos elementos como quieras.</li>
      </ul>
      <p>Para un evento personalizado, pasa su tipo como genérico:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Cuál elegir</h3>
      <p>Para el caso habitual, usa los atributos <code>on*</code>. Recurre a <code>on()</code> cuando necesites más de un listener para el mismo evento, opciones de listener o un nombre de evento personalizado como <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Ciclo de vida",
        content: `
      <p><code>onMount</code> se ejecuta una vez, justo después de insertar el elemento. <code>onDestroy</code> se ejecuta una vez, cuando Nuclo lo quita. Puedes escribirlos como atributos o con <code>on()</code>: las dos formas se comportan igual, y el elemento se tipa según su etiqueta.</p>
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
        <li><code>onMount</code> corre al final de la llamada a <code>render()</code>, <code>hydrate()</code>, <code>update()</code> o <code>forceUpdate()</code> que insertó el elemento. Nunca durante la construcción del árbol.</li>
        <li>Si <code>onMount</code> devuelve una función, esa función corre al destruir el elemento, después de sus callbacks <code>onDestroy</code>.</li>
        <li><code>onDestroy</code> corre cuando Nuclo quita el elemento: se elimina una fila de <code>list()</code>, cambia una rama de <code>when()</code>, un <code>into()</code> sale de su región o <code>forceUpdate()</code> lo descarta. Se ejecuta justo antes de la eliminación, por lo que el elemento aún está en el documento.</li>
      </ul>
      <h3>Quitar nodos directamente del DOM</h3>
      <p>Si eres tú quien quita un elemento, con <code>node.remove()</code> o <code>innerHTML = ''</code>, su <code>onDestroy</code> y sus funciones de limpieza no se ejecutan jamás, y los temporizadores siguen corriendo. Nuclo no tiene <code>unmount()</code>. Para desmontar una app con limpieza incluida, envuélvela en un <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Orden y errores</h3>
      <ul>
        <li>Puedes registrar tantos hooks como quieras, de cualquiera de las dos formas, y se ejecutan en el orden en que los registraste.</li>
        <li><code>onDestroy</code> siempre ejecuta primero a los hijos y al final al padre.</li>
        <li>Los elementos se montan según el orden de su primer hook <code>onMount</code>, que sigue el orden de los argumentos, y cada elemento ejecuta todos sus hooks de una vez. Si los hijos dependen del hook de un padre, pásalo antes que a ellos.</li>
        <li>Si un hook lanza un error, se registra con <code>console.error</code> y los demás hooks se ejecutan igual.</li>
        <li>El callback no debe devolver nada, salvo una función de limpieza, así que no lo marques como <code>async</code>: una Promise devuelta jamás se usa como limpieza. Inicia el trabajo asíncrono desde dentro: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Los hooks nunca corren en el servidor. En el cliente, se ejecutan después de <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Nota:</strong> los hooks no son efectos. No se vuelven a ejecutar cuando cambia el estado: cada uno corre, como máximo, una vez por elemento.</div>
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
      <p>Nuclo nunca actualiza la página por su cuenta. Tú cambias el estado y luego llamas a <code>update()</code>.</p>
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
      <p>Puedes cambiar todo el estado que haga falta y llamar a <code>update()</code> una sola vez al final:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Llama a <code>update()</code> desde controladores de eventos, temporizadores, callbacks de fetch u <code>onMount</code>. Lo que no debes hacer es llamarlo desde dentro de un valor dinámico.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Valores dinámicos",
        content: `
      <p>Una función <strong>sin parámetros</strong> es un <strong>valor dinámico</strong>. Nuclo la ejecuta una vez al construir el elemento y otra vez en cada <code>update()</code>. Sirven para hijos de texto, valores de atributos, <code>style</code> y <code>className</code>. Para hijos que aparecen, desaparecen o se repiten, tienes <a href="#api-when"><code>when()</code></a> y <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo se fija en cuántos parámetros declara la función (<code>fn.length</code>). Si declara uno, es un <a href="#tag-builders">modificador personalizado</a> y se ejecuta una sola vez. <code>(x = 0) =&gt; …</code> y <code>(...args) =&gt; …</code> tienen longitud 0, así que cuentan como dinámicas.</p>
      <h3>Texto dinámico</h3>
      <ul>
        <li>Un string, number, bigint o boolean se renderiza como <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> muestra "false"; escríbelo mejor como <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> y <code>undefined</code> se renderizan como texto vacío.</li>
        <li>Si en la primera ejecución la función devuelve un resultado de <code>css()</code> o <code>cx()</code>, se trata como una clase dinámica y no como texto. Consulta <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Un nodo, builder, array u objeto plano no renderiza nada y nunca se actualiza.</li>
      </ul>
      <h3>Atributos dinámicos</h3>
      <ul>
        <li>Nuclo solo escribe un valor cuando es distinto del último que escribió. No lo compara con el DOM real, así que si el usuario teclea en un input y tu función devuelve lo mismo que antes, lo que escribió se queda.</li>
        <li>Un resultado <code>null</code> o <code>undefined</code> no escribe nada, y el valor anterior se mantiene. <code>className</code> es la excepción: cualquier resultado falsy quita las clases dinámicas y deja las estáticas.</li>
        <li>Una función <code>style</code> aplica el objeto que devuelve en cada actualización.</li>
      </ul>
      <h3>Errores</h3>
      <p>Si un valor dinámico lanza un error, Nuclo lo captura y el resto de la actualización sigue su curso. El texto queda vacío o conserva su valor anterior, y un atributo conserva el suyo; ambos se recuperan en el siguiente <code>update()</code> que salga bien. Hay una excepción: una función de texto que falla en su <strong>primera</strong> ejecución se queda vacía para siempre.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Hace una pasada sincrónica por todos los valores dinámicos de la página. Si le pasas ids, solo actualiza lo que está dentro de los elementos marcados con esos ids mediante <a href="#api-scope"><code>scope()</code></a>. Cada pasada sigue estos pasos, en orden:</p>
      <ol>
        <li><code>list()</code>: vuelve a leer los elementos y agrega, mueve o quita filas.</li>
        <li><code>when()</code>: reevalúa las condiciones. Una rama solo se reconstruye cuando pasa a estar activa una rama distinta.</li>
        <li>Atributos dinámicos, incluidos <code>style</code> y <code>className</code>.</li>
        <li>Texto dinámico.</li>
        <li><code>onMount</code> de los elementos que insertaron los pasos 1 y 2.</li>
      </ol>
      <ul>
        <li><strong>Lo ejecuta todo.</strong> Cada valor dinámico corre en cada llamada, aunque sus datos no hayan cambiado; lo único que se evita es la escritura en el DOM. Mantén los valores dinámicos rápidos y sin efectos secundarios.</li>
        <li><strong>Solo nodos que estén en el documento.</strong> Si un nodo no está en el documento cuando corre <code>update()</code>, Nuclo deja de seguirlo y ya no se actualiza más, ni siquiera si lo insertas después. Vale igual para <code>list()</code> y <code>when()</code>. Renderiza dentro de un contenedor que ya esté en el documento.</li>
        <li><strong>Los valores estáticos no cambian nunca.</strong> Los strings simples y los valores de atributos se fijan cuando se construye el elemento. Para reconstruirlos, usa <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Errores.</strong> Los errores de texto y atributos se capturan y la pasada continúa. Si falla la condición de un <code>when()</code>, el error se registra y ese <code>when()</code> deja de actualizarse. Si falla la función <code>items</code> o <code>renderItem</code> de un <code>list()</code>, el error sale de <code>update()</code> y los pasos que faltan no se ejecutan.</li>
        <li><strong>Servidor.</strong> <code>update()</code> no hace nada en el servidor.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Le pone uno o más ids de ámbito al elemento donde lo pasas. Después, <code>update('id')</code> actualiza solo lo que hay dentro de ese elemento, incluidos los atributos del propio elemento.</p>
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
        <li><code>update('a', 'b')</code> actualiza todo lo que esté dentro de <code>a</code> o de <code>b</code>. Si varios elementos comparten un id, se actualizan todos.</li>
        <li>Con ámbitos anidados, <code>update('outer')</code> abarca también el ámbito interior, pero <code>update('inner')</code> no toca el exterior.</li>
        <li>Si ningún elemento del documento tiene ese id, no se actualiza <strong>nada</strong> y tampoco se lanza ningún error, así que revisa bien cómo lo escribes.</li>
        <li><code>scope()</code> no hace nada en el servidor.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Renderiza contenido según una condición. Nuclo reevalúa las condiciones en cada <code>update()</code> y gana la primera que sea verdadera. Si ninguna lo es, se renderiza el contenido de <code>.else()</code>; si no hay <code>.else()</code>, no se renderiza nada.</p>
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
        <li>Si la condición depende del estado, pasa una función. Un booleano suelto se lee una sola vez, así que <code>when(open, …)</code> nunca cambia.</li>
        <li>En TypeScript la función debe devolver un booleano. Escribe <code>() =&gt; items.length &gt; 0</code> o <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Qué se actualiza</h3>
      <ul>
        <li>Mientras la misma rama siga activa, sus elementos se conservan, y los valores dinámicos, las listas y los bloques <code>when()</code> que contiene siguen actualizándose.</li>
        <li>Cuando otra rama toma el relevo, el contenido anterior se quita y corren sus hooks <code>onDestroy</code>. La rama nueva se construye desde cero y corren sus hooks <code>onMount</code>. El estado de los elementos anteriores, como el texto de un input o el foco, se pierde.</li>
      </ul>
      <h3>Qué cabe en una rama</h3>
      <p>Una rama admite hijos: texto, texto dinámico, builders y <code>list()</code> o <code>when()</code> anidados. Pasa builders como <code>p('Hi')</code>, no nodos del DOM, porque un nodo del DOM deja de actualizarse en cuanto su rama se oculta una vez.</p>
      <p>Los objetos de atributos y los <code>on()</code> dentro de una rama se aplican al elemento padre y siguen ahí aunque la rama se oculte. Para un atributo condicional, usa un atributo dinámico: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Encadenamiento</h3>
      <p><code>.when()</code> y <code>.else()</code> devuelven un builder nuevo sin modificar el original. Si llamas a <code>.else()</code> dos veces, vale la última.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Renderiza una fila por cada elemento. En cada <code>update()</code>, Nuclo vuelve a llamar a <code>items()</code> y empareja los elementos nuevos con las filas existentes por identidad (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Cómo se emparejan las filas</h3>
      <ul>
        <li>Un elemento que sigue ahí conserva su fila. Nuclo la mueve si hace falta y no vuelve a llamar a <code>renderItem</code>.</li>
        <li>Un elemento nuevo recibe una fila nueva. Un elemento que desaparece pierde la suya, y corren sus hooks <code>onDestroy</code>.</li>
        <li>Los elementos duplicados reciben cada uno su propia fila.</li>
        <li>Puedes mutar el array directamente (<code>push</code>, <code>splice</code>, <code>sort</code>) o devolver uno nuevo.</li>
      </ul>
      <p>Una fila conservada nunca se vuelve a renderizar, así que para los campos que cambian usa valores dinámicos:</p>
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
      <p>Las copias cuentan como elementos nuevos, así que reemplazar el array con <code>todos.map((t) =&gt; ({ ...t }))</code> reconstruye todas las filas.</p>
    `,
        afterContent: `
      <h3>Qué debe devolver <code>renderItem</code></h3>
      <ul>
        <li>Devuelve un elemento, como <code>li(...)</code>, <code>tr(...)</code> o un builder de SVG. Si devuelves <code>null</code> o <code>undefined</code>, ese elemento se omite. Los strings, los nodos de texto y los fragmentos no renderizan nada.</li>
        <li>No devuelvas <code>when()</code> ni <code>list()</code> directamente: ponlos dentro del elemento de la fila, por ejemplo <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Para ocultar elementos, filtra en <code>items()</code>, no en <code>renderItem</code>.</li>
        <li>Mantén <code>renderItem</code> libre de efectos secundarios: Nuclo puede llamarlo más de una vez para el mismo elemento.</li>
      </ul>
      <h3>El índice</h3>
      <p><code>index</code> es la posición del elemento en el momento en que se creó su fila, y no se actualiza cuando las filas se reordenan. Si necesitas la posición actual, usa un valor dinámico: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iterables</h3>
      <p>Sirve cualquier iterable: arrays, <code>Set</code>, generadores y <code>map.values()</code>. Devolver cada vez el mismo array o <code>Set</code> no da problemas. Un iterador, como un generador o <code>map.values()</code>, se agota después de una pasada, así que créalo dentro de <code>items()</code> en cada llamada. Iterar un <code>Map</code> directamente genera arrays <code>[key, value]</code> nuevos cada vez, y eso reconstruye todas las filas. Usa <code>map.values()</code> en su lugar.</p>
      <h3>Dónde se colocan</h3>
      <p>Las filas aparecen donde esté <code>list()</code> entre sus hermanos, encerradas entre dos marcadores de comentario. Los demás hijos del padre no se tocan. <code>list()</code> también funciona dentro de builders de SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() e into()",
        content: `
      <p><code>region()</code> marca un lugar con nombre en el árbol, y <code>into()</code> lo rellena desde cualquier otro punto, sin importar la profundidad. El layout no recibe el contenido como prop, y el componente que lo construye no tiene por qué saber dónde va a terminar.</p>
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
        <li><code>into()</code> solo deja un comentario en el lugar donde lo escribes. Su contenido se renderiza entre los marcadores de la región.</li>
        <li>El orden no importa. Un <code>into()</code> construido antes que su región queda esperando y aparece en cuanto la región se construye. Las vistas se muestran en el orden en que se escribieron.</li>
        <li>El contenido vive lo mismo que su vista. Cuando se cierra el <code>when()</code> que contiene un <code>into()</code>, o se quita su fila de <code>list()</code>, el contenido sale de la región. Si lo abres otra vez, se agrega una copia, no dos.</li>
        <li>Cuando una región desaparece (por ejemplo, porque se cierra su <code>when()</code>), sus vistas vuelven a quedar en espera, y una región construida después con el mismo id las muestra.</li>
        <li>Un <code>into()</code> cuyo id no coincide con ninguna región no renderiza nada ni lanza error, así que revisa bien cómo lo escribes.</li>
        <li>Los ids son únicos dentro del árbol. Si construyes una segunda región con un id que ya está activo, se registra una advertencia.</li>
        <li>Las regiones funcionan con el <a href="#api-ssr">renderizado en el servidor</a>. En <code>hydrate()</code>, cada vista reutiliza el HTML que renderizó el servidor en vez de construirlo de nuevo.</li>
      </ul>
      <h3>Opciones</h3>
      <ul>
        <li><code>id</code>: el nombre con el que las llamadas a <code>into()</code> encuentran la región.</li>
        <li><code>type</code>: <code>'latest'</code> (el valor por defecto) muestra solo la vista más reciente. <code>'stack'</code> muestra todas, en orden de llegada.</li>
        <li><code>empty</code>: lo que se renderiza mientras la región no tiene ninguna vista.</li>
      </ul>
      <h3>Regiones apiladas</h3>
      <p>Con <code>type: 'stack'</code>, una vista que se abre encima de otra no reconstruye la de abajo: su DOM, su foco y el estado de sus formularios se mantienen. Es ideal para capas, como un diálogo sobre una página.</p>
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
      <p>Pasa un objeto para rellenar más de una región con un único <code>into()</code>. Cada valor puede ser un hijo o un array de hijos. Ambas formas se pueden anidar: un <code>into()</code> dentro del contenido de otra vista apunta a su propia región.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Un diálogo que se abre desde lo más profundo del árbol</h3>
      <p>La región de overlay vive en la raíz. Cualquier componente, a la profundidad que sea, abre un diálogo envolviendo un <code>into()</code> en un <code>when()</code>. Al cerrarse el <code>when()</code>, el diálogo sale de la región.</p>
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
      <h3>Toasts a partir de las filas de una lista</h3>
      <p>Cada fila de un <code>list()</code> es una vista. Una región apilada las muestra en orden, y al quitar un elemento del array, desaparece su toast.</p>
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
      <h3>Que cada página ponga su propio título</h3>
      <p>Con el <code>type: 'latest'</code> por defecto, gana la vista más reciente. El layout define el encabezado y la página que está abierta aporta su título. Una página sin <code>into('title', …)</code> deja el texto de <code>empty</code>.</p>
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
      <p>El contenido de un <code>into()</code> es contenido Nuclo de toda la vida. Las funciones que lleva dentro son valores que dependen del estado y se refrescan en <code>update()</code>, esté donde esté la región.</p>
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
      <p>El <code>into()</code> del panel se escribe una sola vez. Mientras el usuario no ha iniciado sesión no existe la región <code>main</code>, así que la vista espera. Al iniciar sesión se construye la región y la vista aparece; al cerrarla, la región se va y la vista vuelve a esperar.</p>
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
      <p>Una vista puede contener un <code>region()</code>, y otras vistas pueden apuntar hacia él. Aquí la página del editor trae consigo una región <code>tabs</code>, y cada pestaña la rellena. Cuando el editor se cierra, su región se va con él.</p>
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
      <p><code>update()</code> solo ejecuta valores dinámicos. Los valores estáticos, como el texto de <code>h1(labels[lang].title)</code>, quedan fijados cuando se construye el árbol. <code>forceUpdate()</code> vuelve a llamar a tus componentes y parchea el DOM real para que coincida, valores estáticos incluidos. Resérvalo para cambios poco frecuentes que afectan a toda la app, como cambiar de idioma, y para todo lo demás usa <code>update()</code>.</p>
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
      <p>Sin argumentos, <code>forceUpdate()</code> reconstruye cada raíz renderizada con <code>render(App)</code> o <code>hydrate(App)</code>. Las raíces renderizadas con <code>render(App())</code> se saltan. Si un componente lanza un error, se registra y esa raíz conserva su DOM anterior. Un error que ocurra más tarde, mientras se aplica la nueva construcción, también se registra, pero lo que ya se había parcheado se queda parcheado.</p>
      <h3>Qué se conserva y qué cambia</h3>
      <ul>
        <li>Los hijos se emparejan en orden, por etiqueta. Un elemento que coincide se reutiliza: el foco y los valores escritos en los inputs se conservan, y sus hooks <code>onMount</code> no vuelven a correr. En cuanto la etiqueta de un hijo es distinta, ese hijo y todos los hermanos que le siguen se construyen desde cero.</li>
        <li>El texto, los atributos, las clases, los estilos, los listeners, las ramas de <code>when()</code> y las filas de <code>list()</code> siguen la nueva construcción.</li>
        <li>Los elementos nuevos se crean y corren sus hooks <code>onMount</code>. Los que la nueva construcción ya no genera se quitan y corren sus hooks <code>onDestroy</code>.</li>
        <li>Las filas de <code>list()</code> también se emparejan por posición y no por elemento, así que un elemento de fila reutilizado puede terminar mostrando un elemento distinto.</li>
        <li>Los atributos que la nueva construcción ya no establece no se quitan.</li>
      </ul>
      <div class="docs-callout"><strong>Cuidado:</strong> el estado declarado dentro de la función de un componente se reinicia, porque la función se ejecuta de nuevo. El estado que deba sobrevivir, mantenlo fuera del componente.</div>
      <p><strong>Forma explícita.</strong> <code>forceUpdate(App(), parent)</code> reconstruye un árbol dentro de <code>parent</code> y te devuelve su raíz. No registra esa raíz para llamadas posteriores. Igual que <code>hydrate()</code>, espera que la raíz sea el primer nodo de <code>parent</code>; si el primer nodo tiene otra etiqueta, lo reemplaza.</p>
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
      <p>Construye tu árbol y agrega su elemento raíz a <code>parent</code>, que por defecto es <code>document.body</code>. Te devuelve ese elemento raíz.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Puedes pasar el componente (<code>render(App)</code>) o el builder que devuelve (<code>render(App())</code>). El DOM resultante es el mismo, pero solo con <code>render(App)</code> puede <a href="#api-force-update"><code>forceUpdate()</code></a> reconstruir la raíz más adelante, por eso es la forma recomendada.</li>
        <li>Agrega al final y no vacía <code>parent</code>: si lo llamas dos veces, tendrás dos copias.</li>
        <li>Cuando <code>render()</code> retorna, ya se ejecutaron todos los <code>onMount</code> del árbol.</li>
        <li>Renderiza en un elemento que esté en el documento. Consulta <a href="#api-update"><code>update()</code></a>.</li>
        <li>La raíz tiene que ser un elemento, como <code>div(...)</code>, no un <code>when()</code> ni un <code>list()</code>.</li>
        <li><code>index</code> es interno y no decide dónde se inserta el elemento. Déjalo fuera.</li>
      </ul>
      <p>Un componente pasado como <code>render(App)</code> no puede recibir parámetros. Si uno es obligatorio, TypeScript lo marca como error; si es opcional, pasa la comprobación de tipos, pero <code>render()</code> lanza un error en tiempo de ejecución. Si el componente recibe props, envuélvelo:</p>
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
      <p>Toma el control del HTML generado por <a href="#api-ssr"><code>renderToString()</code></a>: reutiliza los elementos que ya existen, asocia los listeners de eventos y conecta los valores dinámicos, <code>when()</code> y <code>list()</code>, para que <code>update()</code> funcione a partir de ahí. Al final ejecuta los hooks <code>onMount</code>. <code>parent</code> es <code>document.body</code> por defecto, y te devuelve el elemento raíz.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Usa el mismo componente, con los mismos datos, que usó el servidor.</li>
        <li>Hidrata en un contenedor propio. La raíz de la app debe ser su primer nodo (los espacios en blanco no cuentan). Si hay otro nodo antes, Nuclo lo reemplaza y la copia del servidor se queda sin usar.</li>
        <li>Igual que con <code>render()</code>, pasa <code>App</code> y no <code>App()</code>, para que <code>forceUpdate()</code> pueda reconstruir la raíz después. <code>App</code> no debe recibir parámetros: con uno opcional, <code>hydrate()</code> no asocia nada y no avisa. Si el componente recibe props, envuélvelo: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Si no hay HTML del servidor, usa <code>render()</code>.</li>
      </ul>
      <h3>Cuando el servidor y el cliente no coinciden</h3>
      <p>Gana el cliente:</p>
      <ul>
        <li>Si la etiqueta raíz es distinta, ese nodo se reemplaza por DOM nuevo. Si el contenedor está vacío, se agrega DOM nuevo.</li>
        <li>El texto distinto se parchea. Los elementos de <code>list()</code> y las ramas de <code>when()</code> que difieren siguen al cliente.</li>
        <li>Los hijos que sobran del servidor se quitan, y los que faltan se crean.</li>
        <li>Los atributos que el servidor escribió y el cliente no define se dejan como están.</li>
      </ul>
      <p><code>renderToString()</code> escribe comentarios HTML como marcadores, por ejemplo <code>&lt;!-- text-0 --&gt;</code> antes de cada nodo de texto. <code>hydrate()</code> los necesita, así que no limpies los comentarios del HTML del servidor. Sin esos marcadores, la hidratación borra las filas de <code>list()</code>, y <code>list()</code> y <code>when()</code> dejan de actualizarse.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Renderizado en el servidor",
        content: `
      <p>Convierte un componente en un string HTML en el servidor. En el navegador, llama a <a href="#api-hydrate"><code>hydrate()</code></a> con el mismo componente para que ese HTML sea interactivo. Los runtimes de servidor no tienen <code>document</code>, así que primero importa <a href="#api-polyfill"><code>nuclo/polyfill</code></a>.</p>
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
      <p>Conserva <code>id="nuclo-styles"</code> en la etiqueta style: el cliente reutiliza ese elemento y solo agrega las reglas nuevas. Consulta <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Qué se ejecuta en el servidor</h3>
      <ul>
        <li>Cada llamada a <code>renderToString()</code> construye el árbol y ejecuta cada valor dinámico una sola vez.</li>
        <li>Los controladores de eventos, <code>onMount</code> y <code>onDestroy</code> nunca se ejecutan, y <code>update()</code>, <code>scope()</code> y <code>forceUpdate()</code> no hacen nada.</li>
        <li>El renderizado es sincrónico: carga primero tus datos y renderiza después.</li>
        <li>Después de renderizar no queda nada registrado, así que un mismo proceso puede atender muchas peticiones. Pasa los datos de cada petición como argumentos, por ejemplo <code>renderToString(Page(user))</code>. Las variables a nivel de módulo, en cambio, las comparten todas las peticiones.</li>
        <li>No llames a <code>render()</code> en el servidor: agrega contenido al <code>document.body</code> compartido.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Acepta un builder (<code>App()</code>), un componente (<code>App</code>) o un nodo del DOM. Con <code>null</code> y <code>undefined</code> devuelve <code>""</code>. La raíz debe ser un elemento. Un componente pasado como <code>renderToString(Page)</code> no puede recibir parámetros, así que si necesita datos, pasa <code>Page(user)</code>.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>El texto y los valores de atributos se escapan como HTML. El texto dentro de <code>script()</code> y <code>style()</code> se escribe tal cual, solo con las etiquetas de cierre partidas, así que jamás pongas ahí datos del usuario.</li>
        <li>No lanza errores. Si el componente, una función de <code>list()</code> o una condición de <code>when()</code> falla, o si falta el polyfill, registra el error y devuelve <code>""</code>. Si la petición debe fallar en ese caso, comprueba si el resultado viene vacío. Una función de texto o de atributo que falla simplemente se renderiza vacía.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Equivale a <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Envuelve el resultado en un elemento. <code>containerTag</code> es <code>"div"</code> por defecto y <code>containerAttrs</code> es <code>{}</code>. Los valores de atributos se escapan, pero los nombres se escriben tal como los das, así que usa nombres HTML como <code>class</code>. Nunca pases datos del usuario como etiqueta.</p>
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
      <p>Un DOM minúsculo para que Nuclo pueda construir árboles en Node y Bun. Impórtalo una vez, antes de tu primer renderizado. A la mayoría de las apps les basta con la importación simple.</p>
      <ul>
        <li>Si no existe <code>window</code>, define <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> y <code>HTMLElement</code>, pero solo los que falten. No crea <code>window</code>.</li>
        <li>En un navegador, o con jsdom, no hace nada.</li>
        <li><code>Event</code> y <code>CustomEvent</code> son los constructores propios del runtime. <code>Node</code>, <code>Element</code> y <code>HTMLElement</code> son alias de las clases del polyfill.</li>
      </ul>
      <p>Es un DOM pensado para construir árboles, no un navegador. No tiene <code>innerHTML</code> ni <code>getElementById</code>, <code>querySelector()</code> devuelve <code>null</code> y los listeners de eventos se ignoran. Para obtener el HTML, usa <code>renderToString()</code>.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
