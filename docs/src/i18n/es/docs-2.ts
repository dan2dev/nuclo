import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "Estilos",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>Convierte un objeto de estilo tipado en clases CSS generadas, listas para pasarlas a cualquier función constructora de etiquetas. En el navegador, las reglas terminan en un único elemento <code>&lt;style id="nuclo-styles"&gt;</code>; en el servidor, <a href="#api-css-text"><code>getCssText()</code></a> te las entrega como texto.</p>
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
        <li><code>css()</code> genera una clase para las declaraciones base y otra por cada clave pseudo, selector o bloque media. La tarjeta de arriba termina con dos clases.</li>
        <li>Los nombres de clase son hashes del contenido: estilos idénticos comparten clase, y servidor y cliente generan exactamente los mismos nombres.</li>
        <li>Declara los estilos una sola vez, a nivel de módulo. <code>css()</code> cachea por objeto, así que si creas uno nuevo en cada llamada se vuelve a procesar cada vez.</li>
        <li>Mutar un objeto de estilo después de pasarlo a <code>css()</code> no surte efecto.</li>
        <li>Cada estilo se registra y vive tanto como la página o el proceso del servidor. Para valores que cambian por elemento, como un ancho que viene de los datos, es mejor usar el <a href="#attributes">atributo <code>style</code></a>.</li>
      </ul>
      <h3>Estilos con nombre</h3>
      <p>Dale un nombre primero y obtendrás una clase legible:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>La clase base es el nombre tal cual; los demás bloques reciben <code>name-&lt;hash&gt;</code>.</li>
        <li>El nombre tiene que ser un nombre de clase válido; si no lo es, Nuclo lo advierte y genera uno por su cuenta.</li>
        <li>Los nombres son globales: si dos estilos distintos comparten nombre, Nuclo te avisa.</li>
      </ul>
      <h3>Usar el resultado</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> y <code>card.className</code> devuelven los mismos nombres de clase.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Objetos de estilo",
        content: `
      <p>El objeto que le pasas a <code>css()</code> habla el CSS de siempre en camelCase, suma un puñado de atajos y admite claves anidadas para pseudoclases, pseudoelementos, selectores y media queries. TypeScript autocompleta todo. Lo que quede fuera del conjunto tipado, como <code>borderTopLeftRadius</code>, <code>fill</code> o <code>paddingInline</code>, va dentro de <code>raw</code> (más abajo).</p>
      <h3>Valores</h3>
      <ul>
        <li>Los números se convierten en <code>px</code>, salvo el <code>0</code> y las propiedades que no llevan unidad: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> y <code>gridRow</code>. Dentro de <code>raw</code>, tampoco la llevan <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> ni <code>animation-iteration-count</code>.</li>
        <li>Las cadenas pasan tal como las escribes. <code>null</code>, <code>undefined</code> y <code>false</code> se descartan.</li>
        <li><code>lineHeight</code> (y <code>leading</code>) no lleva unidad: <code>leading: 24</code> equivale a 24 veces el tamaño de fuente. Si quieres píxeles, escribe <code>"24px"</code>.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Atajos</h3>
      <table>
        <thead><tr><th>Clave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, en total y por cada lado</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding horizontal / vertical</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>lo mismo, pero para margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height y sus mínimos y máximos</td></tr>
          <tr><td><code>size</code></td><td>width y height a la vez</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Estas otras claves aceptan <code>true</code> como valor:</p>
      <table>
        <thead><tr><th>Clave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (no define display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudoclases y pseudoelementos</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> y <code>firstLetter</code>. Se pueden combinar: <code>hover: { focus: {…} }</code> produce <code>:hover:focus</code>.</p>
      <h3>Selectores y at-rules</h3>
      <p>Una clave que empieza por <code>&amp;</code> es un selector, y cada <code>&amp;</code> se reemplaza por la clase generada. Una clave que empieza por <code>@</code> es una at-rule: <code>@media</code>, <code>@container</code> o <code>@supports</code>.</p>
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
        <li>La clave tiene que empezar por <code>&amp;</code>. Algo como <code>".dark &amp;"</code> se ignora, así que escríbelo como <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Dos bloques <code>@media</code> anidados se unen con <code>and</code>. Si una query arranca con un tipo de medio (<code>print</code>, <code>only screen</code>), ese tipo va primero, porque la gramática solo admite uno al comienzo. Cuando la combinación no se puede aplanar (dos tipos de medio, o un <code>not</code> al inicio), Nuclo avisa y se queda solo con la query interna. Cualquier otra at-rule anidada sustituye a la externa.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Usa <code>raw</code> para cualquier propiedad, con el nombre escrito exactamente como en CSS. Los números siguen recibiendo <code>px</code>, así que pasa cadenas:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Cualquier otra clave plana se pasa a kebab-case y se escribe tal cual, de modo que un typo como <code>colr: 'red'</code> acaba como una declaración que el navegador descarta. Un objeto anidado bajo una clave que no sea pseudoclase, pseudoelemento, screen ni una clave <code>&amp;</code> o <code>@</code> se ignora. TypeScript marca ambos casos.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Combina estilos. Si dos entradas definen la misma propiedad, la que viene después se impone.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Las entradas falsy se descartan, los arrays se aplanan y las cadenas se separan y se deduplican.</li>
        <li>Las clases generadas para un mismo bloque (base, el mismo pseudo, la misma media query) se fusionan en una clase nueva. Los demás nombres de clase pasan intactos.</li>
        <li>Solo <code>cx()</code> conoce el orden de los argumentos. Con <code>div(base, blue)</code> se agregan las dos clases y gana la regla creada en último lugar. Si dos estilos se pisan entre sí, ponlos juntos en una sola llamada a <code>cx()</code>.</li>
        <li>Cuando el bloque de un estilo con nombre se fusiona con el de otra entrada, la clase resultante es <code>name-&lt;hash&gt;</code> y no el nombre a secas. Los bloques que no se fusionan conservan su clase, así que <code>cx(pageTitle, 'extra')</code> sigue incluyendo <code>page-title</code>.</li>
      </ul>
      <h3>Clases dinámicas</h3>
      <p>Pasa una función que devuelva siempre <code>cx(...)</code>:</p>
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
      <p>La función debe devolver un resultado de estilo ya en su primera ejecución. Con <code>() =&gt; active &amp;&amp; activeButton</code>, lo que se renderiza es el texto "false" en vez de una clase.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Devuelve sus propios <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> y <code>globalStyle</code>, atados a un tema. Un tema le pone nombre a los valores: con el de abajo, <code>borderColor: 'border'</code> escribe <code>#e5e7eb</code>, y TypeScript autocompleta los nombres. Cada entrada de <code>screens</code> se vuelve una clave de estilo para una media query, por ejemplo <code>md: {…}</code>.</p>
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
        <thead><tr><th>Clave del tema</th><th>La usan</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> y cada lado, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>claves de estilo nuevas, como <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Un nombre del tema solo se resuelve cuando es el valor completo: <code>border: "1px solid primary"</code> no se resuelve.</li>
        <li>Un valor de screen sin <code>@</code> se convierte en <code>@media &lt;value&gt;</code>. Si empieza por <code>@</code>, se usa tal cual, por ejemplo <code>"@container (min-width: 400px)"</code>.</li>
        <li>Los screens solo existen en las instancias creadas con <code>createCss()</code>. El <code>css()</code> global no tiene ninguno, aunque sí acepta claves <code>@media</code>.</li>
        <li>Todas las instancias y los helpers globales comparten una única hoja de estilos. Las reglas media de los screens salen en el orden en que declaras los screens, no en el que los usas, así que lista los <code>min-width</code> de menor a mayor. Mantén una sola instancia de <code>createCss()</code> por aplicación para que ese orden sea el de tu tema.</li>
        <li><code>theme</code>, en el resultado, es el tema que pasaste.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Construye una función que devuelve un estilo a partir de un conjunto de opciones, como la intención y el tamaño de un botón.</p>
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
        <li>Los estilos se fusionan en este orden: <code>base</code>, el valor elegido de cada grupo y, al final, cada compound que coincida. Los posteriores ganan propiedad por propiedad.</li>
        <li>Si falta una opción, o es <code>undefined</code> o <code>null</code>, se usa el valor por defecto. Un grupo sin valor por defecto se omite.</li>
        <li>Un grupo que solo tiene las claves <code>true</code> y <code>false</code> acepta un booleano.</li>
        <li>Un compound se aplica cuando coinciden todos los grupos que lista, valores por defecto incluidos.</li>
        <li>Cada selección se construye una sola vez y se cachea.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() y globalStyle()",
        content: `
      <p><code>keyframes()</code> registra una animación y te devuelve el nombre generado. Las claves de los frames son <code>from</code>, <code>to</code> y porcentajes, como <code>"50%"</code> o <code>"0%, 100%"</code>. Solo admiten propiedades planas, y frames idénticos devuelven el mismo nombre.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> agrega una regla para cualquier selector:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>El selector se usa exactamente como lo escribes.</li>
        <li>Solo funcionan las propiedades planas. Las claves pseudo, los screens y las claves <code>@</code> se ignoran, de modo que <code>globalStyle()</code> no puede escribir reglas media.</li>
        <li>La misma regla se agrega una sola vez. Un estilo distinto para el mismo selector suma una segunda regla, y la posterior gana.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() y resetStyles()",
        content: `
      <p><code>getCssText()</code> devuelve todas las reglas que <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> y <code>globalStyle()</code> han creado en este proceso: primero las reglas base y después los bloques <code>@media</code>, <code>@container</code> y <code>@supports</code>. Es lo que necesitas para el renderizado en el servidor.</p>
      <ul>
        <li>Llámalo después de <code>renderToString()</code>, para que entren también las reglas creadas durante el renderizado.</li>
        <li>Abarca todo el proceso, no una página ni una petición, y solo crece. No pasa nada: los nombres de clase son hashes del contenido.</li>
        <li>Inyéctalo en <code>&lt;style id="nuclo-styles"&gt;</code>. El cliente reutiliza ese elemento y se salta las reglas que ya trae. Con otro id, o sin ninguno, el cliente agrega una segunda hoja de estilos con todas las reglas otra vez.</li>
        <li>El texto no se escapa, así que jamás metas entrada no confiable en valores de estilo.</li>
      </ul>
      <p><code>resetStyles()</code> es un helper pensado para tests: borra todas las reglas y el elemento <code>#nuclo-styles</code>. Los estilos creados antes conservan sus nombres de clase, pero se quedan sin CSS. No lo uses en una aplicación ni en un servidor.</p>
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
    title: "Enrutamiento",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>Paquete independiente:</strong> <code>nuclo-router</code> no viene con el paquete principal de Nuclo; se instala aparte, junto a <code>nuclo</code>. Es una versión preliminar y su API todavía puede cambiar.</div>
      <p>Enrutamiento para Nuclo, con renderizado en el servidor, hidratación, rutas con code splitting y precarga en reposo, todo montado sobre <code>list()</code> y <code>update()</code>. Pesa unos ${NUCLO_ROUTER_GZIP_KB} KB con gzip, no depende de nada más que del propio Nuclo y no tiene efectos secundarios, así que el tree-shaking lo descarta cuando no lo usas.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>También sirve <code>pnpm add</code>, <code>yarn add</code> o <code>bun add</code> con los mismos dos nombres. Requiere <code>nuclo</code> 0.3 o posterior como peer dependency.</p>
      <p>El router decide <em>qué</em> cargar; la aplicación decide <em>dónde</em> con <code>router.outlet()</code>, un <code>list()</code> sobre la pila de capas con una fila por capa, de modo que una página normal es una sola fila. Servidor y cliente construyen el mismo árbol, así que <code>hydrate()</code> reutiliza los nodos del servidor en vez de reemplazarlos. El resto es <code>history</code>, un listener <code>click</code> delegado y <code>requestIdleCallback</code>.</p>
      <h3>Un solo import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> resuelve los módulos de la ruta coincidente antes de devolver, así que el primer árbol sale completo tanto en el servidor como en el cliente. A partir de ahí, el router lee de la ruta que inició: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
      <h3>Una aplicación de punta a punta</h3>
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
      <p>Eso es toda la integración. Los enlaces funcionan porque un <code>&lt;a href&gt;</code> es, sencillamente, un <code>&lt;a href&gt;</code>: un listener delegado en <code>document</code> intercepta los que pertenecen al router y deja el resto al navegador.</p>
      <p>En el servidor, <code>start()</code> devuelve un <code>Route</code> por petición y no toca el router, de modo que las peticiones concurrentes nunca ven la ruta de las demás. <code>route.run()</code> hace que ese Route sea el que el router (y por tanto el outlet) lee durante el renderizado. En el navegador hay un Route por carga de página y <code>start()</code> lo adopta como propio, así que no necesitas <code>run()</code>.</p>
      <p>Una página recibe su <a href="#router-api"><code>RouteContext</code></a> y sus <a href="#router-api"><code>PageProps</code></a>, como <code>(ctx, { layer, data, outlet, beforeLeave })</code>, y puede declarar menos argumentos. Devuelve cualquier cosa que <code>list()</code> acepte. Si además quiere rellenar otra parte del layout, devuelve un <code>into()</code> desde la propia página, como <code>div(article(…), into('sidebar', nav(…)))</code>; ese contenido se va con la página. Ver <a href="#router-regions">Páginas y regiones</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Patrones y rutas anidadas",
        content: `
      <table>
        <thead><tr><th>Patrón</th><th>Coincide con</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>exactamente esa ruta</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>todo lo que no coincida con nada más, tu 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>La precedencia es: primero las estáticas, luego las dinámicas en el orden en que las declaraste y, al final, los catch-all, empezando por el prefijo más largo. Por eso <code>'*'</code> solo atrapa lo que nada más reconoce y puede ir en cualquier parte de la tabla. Las barras finales, las barras duplicadas y la codificación porcentual se normalizan, y los parámetros llegan ya decodificados. Cada patrón se compara segmento a segmento: no se construye ni se ejecuta ninguna expresión regular.</p>
      <h3>Rutas relativas</h3>
      <p>Un patrón escrito con <code>./</code> es relativo al padre que lo declara, y un href con <code>./</code> es relativo a la ruta activa. Juntos permiten armar una sección reutilizable que significa lo mismo bajo cualquier padre. El valor de una tabla es un cargador o bien otra tabla, cuyas claves son relativas a ella:</p>
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
      <p>Esas dos líneas producen los seis patrones sin escribir ninguna ruta dos veces. Ambos padres reciben los mismos objetos cargadores, así que comparten caché de módulos y un único <code>import()</code>.</p>
      <ul>
        <li>Dentro de una tabla hija, <code>'./x'</code>, <code>'/x'</code> y <code>'x'</code> son lo mismo, <code>'/'</code> es la ruta del propio padre y <code>'*rest'</code> le da a la sección su propio catch-all. Puedes anidar tan hondo como quieras.</li>
        <li>Las claves de nivel superior se usan tal cual, así que <code>'*'</code> sigue siendo <code>'*'</code>.</li>
        <li>Un hijo bajo un padre <code>*catch-all</code> es un error de <code>createRouter()</code>: un catch-all tiene que cerrar su patrón.</li>
      </ul>
      <h3>Páginas padre y <code>outlet()</code></h3>
      <p>Un padre y sus hijos forman una jerarquía de verdad. El padre se renderiza y su hijo aparece dentro, justo donde llames a <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Navegar entre hijos no reconstruye el padre. Su nodo DOM sigue siendo el mismo, así que conserva el foco, la posición de scroll, el input a medio escribir y cualquier estado de su closure.</p>
      <ul>
        <li>Una página sin ruta hija no renderiza nada en su outlet, así que un layout puede llamarlo sin condiciones. En cambio, un padre que tiene un hijo y nunca llama a <code>outlet()</code> se lo traga.</li>
        <li>No hay rutas índice. <code>'/'</code> es el propio layout: la ruta del padre renderiza el layout con un outlet vacío, no una página índice aparte dentro de él. Pon el contenido inicial en el layout o dale una ruta hija real.</li>
      </ul>
      <p>Así, la misma llamada sirve desde cualquiera de los dos padres, e incluso desde una página que no sabe en cuál está:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> y <code>..</code> se resuelven contra la ruta actual, no contra el "directorio" de la URL. Desde <code>/invoices/42</code>, <code>./preview</code> es <code>/invoices/42/preview</code> (un navegador habría dicho <code>/invoices/preview</code>), y una barra final en la URL no cambia nada. <code>../</code> sube un segmento y se detiene en la raíz. La query y el hash se conservan, <code>base</code> se vuelve a agregar y lo que entra al historial es la ruta absoluta ya resuelta. Es la misma desviación respecto a la resolución de URLs que hace React Router con <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Solo <code>./</code> y <code>../</code> son relativos a la ruta. Un <code>preview</code> a secas en un href queda en manos de las reglas normales del navegador.</li>
        <li>Arma los enlaces relativos con <code>router.href('./preview')</code> y no escribas <code>href="./preview"</code> a mano. <code>href()</code> resuelve al renderizar, así que el marcado que se envía es absoluto y sigue siendo correcto para un crawler, para un clic con el botón central y con JavaScript desactivado.</li>
      </ul>
      <h3>Qué se conserva y qué se reconstruye</h3>
      <table>
        <thead><tr><th>Nodo</th><th>Al navegar</th></tr></thead>
        <tbody>
          <tr><td>un padre cuyo patrón y ruta no cambian</td><td><strong>se conserva</strong>: es el mismo nodo y su <code>load()</code> no vuelve a ejecutarse</td></tr>
          <tr><td>la página coincidente</td><td><strong>se conserva</strong> cuando su patrón y ruta no cambian y no tiene <code>load()</code>, así que un cambio de query o hash no la toca. Una ruta con cargador se refresca en cada visita.</td></tr>
          <tr><td>un padre cuya ruta cambió</td><td>se reconstruye, con todo lo que cuelga de él</td></tr>
          <tr><td>una capa apilada</td><td>renderiza solo la página coincidente; sus padres ya están montados en la fila de abajo</td></tr>
        </tbody>
      </table>
      <p>Una página conservada se queda con el <code>ctx</code> con el que se construyó, y ese es el sentido de <code>ctx</code> en todas partes: lee <code>router.*</code> para obtener valores en vivo. El estado que depende de la query (filtros, paginación, pestañas) lee <code>router.search</code> dentro de un valor dinámico y escribe con <code>router.go('?page=2', { replace: true })</code>. La página, su foco y su input a medio escribir se quedan exactamente donde estaban.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Páginas y regiones",
        content: `
      <p><code>router.outlet()</code> coloca la página en un lugar. Si la página también necesita una barra lateral, una barra de herramientas o un encabezado en otro punto del layout, los rellena con <a href="#api-region"><code>into()</code></a>: el layout marca el sitio con <code>region()</code> y la página devuelve un <code>into()</code> junto a su propio contenido. El layout nunca recibe contenido de página como prop, y la navegación nunca lo reconstruye.</p>
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
      <p>El contenido de la página es una fila del <code>list()</code> del outlet, y un <code>into()</code> vive lo que viva la fila que lo contiene. Por eso el contenido de la barra lateral llega con la página y se va con ella: al navegar a una página sin <code>into('sidebar', …)</code>, la región vuelve a mostrar su contenido <code>empty</code>. La página puede usar su <code>ctx</code> y su <code>data</code> para ambas partes, porque las construye la misma función.</p>
      <h3>Qué pasa al navegar</h3>
      <ul>
        <li><strong>Una página conservada conserva sus regiones.</strong> Un cambio de query o hash que <a href="#router-patterns">conserva la página</a> tampoco toca el contenido de la región. Si la barra lateral depende de eso, lee <code>router.search</code> dentro de un valor dinámico.</li>
        <li><strong>Una página reconstruida las vuelve a rellenar.</strong> Cuando la ruta cambia, la fila anterior se elimina y las vistas <code>into()</code> de la página nueva toman su lugar. No queda rastro de la anterior.</li>
        <li><strong>Una capa apilada agrega una vista.</strong> La capa es una fila posterior del outlet, así que su <code>into()</code> es una vista más reciente de la misma región. Con el <code>type: 'latest'</code> por defecto tapa la vista de la página hasta que la capa se cierra, y entonces la de la página reaparece. Con <code>type: 'stack'</code> se muestran las dos.</li>
        <li><strong>Una página padre también puede rellenar regiones.</strong> Sus vistas se mantienen mientras cambian los hijos, porque el padre no se reconstruye.</li>
        <li><strong>El renderizado en el servidor funciona sin cambios.</strong> El servidor construye la página dentro de <code>route.run()</code>, así que sus vistas <code>into()</code> ya vienen en el HTML y <code>hydrate()</code> las reutiliza.</li>
      </ul>
      <h3>Varias regiones desde una sola página</h3>
      <p>Pasa un objeto para rellenar varias regiones de una vez. El contenido principal de la página sigue saliendo por el outlet, así que devuélvelo junto al <code>into()</code>:</p>
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
      <h3>Cada herramienta en lo suyo</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> es para una ruta hija: contenido que decide la URL y que se renderiza dentro de su página padre. Ver <a href="#router-patterns">Rutas anidadas</a>.</li>
        <li><strong><code>into()</code></strong> sirve para que la página coincidente se extienda por el layout. El contenido es de la página y usa sus datos.</li>
        <li><strong><code>matches()</code></strong> es para que el layout decida solo a partir de la URL, con su propia tabla pequeña y sin ninguna página de por medio. Ver <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Todo esto pertenece a la única ruta coincidente. El router no maneja dos áreas independientes desde una sola URL, así que una barra lateral con sus propias rutas es una región que rellena una página, no un segundo outlet. Si una barra lateral de verdad quiere su propio router, su propia carga y su propio fallback, mantén uno sin iniciar y resuélvelo con <code>match()</code>; ver <a href="#router-multi">Varios routers y carga combinada</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Cargadores de ruta y code splitting",
        content: `
      <p>Un módulo de página puede exportar una función <code>load</code>. Se ejecuta antes de construir la página, en cada navegación a esa ruta, y lo que devuelve le llega a la página como <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>La tabla de rutas no cambia: el cargador viaja con la página. Recibe el <code>RouteContext</code> coincidente, así que tienes a mano <code>params</code>, <code>search</code> y <code>path</code>. Puede ser sincrónico o asíncrono y también corre en el servidor, de modo que una página renderizada allí llega con sus datos ya en el HTML, sin hacer fetch tras la hidratación.</p>
      <p><strong>El módulo se cachea; los datos no.</strong> El chunk de una ruta se descarga una vez y se reutiliza, pero su cargador se ejecuta de nuevo en cada navegación. Por eso <code>/blog/a</code> y <code>/blog/b</code> nunca se confunden, y por eso un cargador que falla se puede reintentar sin más.</p>
      <table>
        <thead><tr><th>Situación</th><th>Comportamiento</th></tr></thead>
        <tbody>
          <tr><td>mientras se ejecuta</td><td><code>router.pending</code> es true y sigue visible la página en la que estabas</td></tr>
          <tr><td>lanza o rechaza</td><td>el error termina en <code>router.error</code>. <code>go()</code> sigue sin rechazar nunca y puedes reintentar la navegación.</td></tr>
          <tr><td>durante <code>start()</code></td><td>el rechazo sale de <code>start()</code>, porque todavía no hay un Route donde guardarlo</td></tr>
          <tr><td>una capa apilada</td><td>ejecuta su propio cargador, con sus propios datos</td></tr>
          <tr><td>el precargador en reposo</td><td>solo precarga módulos: no tiene contexto que pasar, y traer datos de una ruta que quizá nunca abras sería un desperdicio</td></tr>
          <tr><td>volver a navegar a la misma URL</td><td>el cargador se ejecuta otra vez y la fila se reconstruye. Una ruta sin cargador conserva su fila.</td></tr>
        </tbody>
      </table>
      <p>Para revalidar, navega a donde ya estás sin sumar una entrada al historial:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Arrancar los datos junto con el chunk</h3>
      <p>Un <code>load</code> exportado por el módulo de la página solo puede correr cuando ese módulo ya se cargó, así que una navegación en frío descarga primero el chunk y después los datos. Para lanzar ambos a la vez, declara el cargador en la tabla con <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Reemplaza al <code>load</code> del propio módulo y se ejecuta en cada visita, igual que él. Si algo falla mientras el chunk aún se está cargando, el rechazo termina en <code>router.error</code> como cualquier otro.</p>
      <p>Los datos del servidor no se serializan en el HTML, y es a propósito: el <code>load</code> del cliente vuelve a ejecutarse al hidratar. Si eso te importa, haz que el servidor emita <code>route.data</code> (por ejemplo, como <code>window.__DATA__</code>) y que el cargador lo lea primero. Ojo: <code>route.data</code> son solo los datos de la página coincidente; el resultado del <code>load()</code> de un padre no está ahí.</p>
      <h3>Code splitting y precarga</h3>
      <p>El valor de una ruta siempre es una función que devuelve el componente de página, de modo que el componente se carga bajo demanda:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Solo los valores con forma de módulo pueden incluir una exportación <code>load</code>. Si eliges un componente con nombre mediante <code>.then(m =&gt; m.BPage)</code>, el router recibe únicamente la función.</p>
      <p>Cada módulo se importa una sola vez y se cachea, y las navegaciones concurrentes a la misma ruta comparten un único <code>import()</code>. Cuando el usuario deja la página quieta durante <code>idleTimeout</code> (un segundo por defecto, sin toques, teclas, rueda ni scroll), las rutas restantes se cargan en segundo plano, una por franja de reposo (<code>requestIdleCallback</code>). Cualquier interacción, o una navegación que el usuario está esperando, la pausa hasta que la página vuelva a quedar en reposo.</p>
      <p>Una ruta precargada o cargada de antemano nunca activa <code>router.pending</code> y aparece antes del siguiente repintado: ni un fotograma con spinner ni saltos de layout. <code>router.pending</code> solo es true cuando hay que esperar un módulo o un cargador, y mientras tanto la página saliente sigue en pantalla. Un chunk que no carga aparece como <code>router.error</code>, nunca como un rechazo sin manejar, y basta con reintentar.</p>
    `,
      },
      {
        id: "router-api",
        title: "API del router",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> asocia cada patrón con un cargador o con una tabla anidada. Opciones:</p>
      <table>
        <thead><tr><th>Opción</th><th>Por defecto</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>Prefijo de URL bajo el que se sirve la aplicación, como <code>'/docs'</code>. Solo coincide en el límite de un segmento: <code>/docs/intro</code> cae dentro de <code>'/docs'</code>, <code>/docsearch</code> no. Las URLs fuera de él no coinciden con nada: <code>start()</code> rechaza (tu 404 del lado del servidor) y los enlaces hacia ellas se dejan al navegador.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Carga en segundo plano los módulos de las demás rutas cuando la página está en reposo. Con <code>false</code> se desactiva.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Milisegundos sin toques, teclas, rueda ni scroll antes de que arranque la precarga, o de que se reanude tras un momento de actividad.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, se llama tras cada navegación resuelta en el navegador, la inicial incluida, cuando el DOM ya se actualizó. <code>kind</code> es <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Atrás, Adelante, <code>close()</code>) o <code>'layer'</code>. Es el hook para <code>document.title</code>, meta tags, foco, scroll y analítica. Nunca se llama durante el SSR.</td></tr>
        </tbody>
      </table>
      <p>Devuelve el router: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> y todos los miembros de <code>Route</code> salvo <code>run()</code>, leídos directamente del Route activo. Ese es el que devolvió el último <code>start()</code> en el navegador, o aquel cuyo <code>run()</code> se está ejecutando en el servidor. Leer un miembro sin ninguno de los dos lanza un error. La tabla de rutas, el matcher compilado y la caché de módulos viven en el router, así que en un servidor se comparten entre peticiones.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Resuelve <code>url</code> (por defecto, <code>location.href</code> en el navegador) hasta sus módulos de página y devuelve un <code>Promise&lt;Route&gt;</code>. Rechaza cuando nada coincide y la tabla no tiene una ruta <code>'*'</code>; en un servidor, ese es tu 404. En el navegador, además, convierte el Route en el activo del router, engancha los listeners <code>popstate</code> y <code>click</code> delegado y programa la precarga. Un segundo <code>start()</code> retira el Route anterior por ti. En el servidor no toca nada compartido, por eso se renderiza dentro de <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Resuelve una URL contra la tabla sin cargar nada: sin import, sin historial, sin listeners, sin Route. Devuelve un <code>RouteContext</code>, o <code>null</code> cuando la URL está fuera de <code>base</code>, no coincide con ningún patrón o, en el navegador, pertenece a otro origen. Solo acepta URLs absolutas, porque resolver <code>./</code> requiere una ruta activa.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Las páginas de la ruta activa, en forma de <code>list()</code>. Colócalo una vez, donde quieras que aparezcan las páginas; una capa apilada es una fila posterior de él. Está vacío antes de que <code>start()</code> se resuelva y después de <code>stop()</code>. En el servidor renderiza el Route cuyo <code>run()</code> se está ejecutando.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Renderiza la vista de una segunda tabla con la que coincida la ruta activa, como un <code>list()</code> que pones donde quieras. Ver <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Todos los miembros salvo <code>run()</code> también están en el router, que es donde una aplicación los lee.</p>
      <table>
        <thead><tr><th>Miembro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>la coincidencia activa. <code>search</code> es un <code>URLSearchParams</code>; <code>search</code>, <code>hash</code> y <code>url</code> reflejan siempre los valores actuales.</td></tr>
          <tr><td><code>pending</code></td><td>una navegación está esperando un módulo o un cargador</td></tr>
          <tr><td><code>error</code></td><td>la última carga fallida; la siguiente navegación la borra</td></tr>
          <tr><td><code>data</code></td><td>lo que devolvió el <code>load()</code> de la página coincidente, para que un servidor lo serialice. El de un padre no está aquí.</td></tr>
          <tr><td><code>depth</code></td><td>cuántas capas hay en la pila (1 en una página normal)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>navega y carga el módulo si hace falta. Nunca rechaza: un módulo que falla, ya sea rechazando o lanzando, termina en <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>abre una ruta como capa nueva encima y se resuelve con lo que se use para cerrarla. Acepta <code>./</code>. Rechaza si no hay coincidencia o si el módulo falla.</td></tr>
          <tr><td><code>href(path)</code></td><td>antepone <code>base</code> a una ruta, para usar en <code>a({ href })</code>. Resuelve <code>./</code> y <code>../</code> contra la ruta activa.</td></tr>
          <tr><td><code>stop()</code></td><td>desconecta todos los listeners, descarta las capas abiertas y vacía el outlet. Es idempotente. Un Route detenido sigue respondiendo con su última coincidencia, y <code>go()</code> no hace nada.</td></tr>
          <tr><td><code>run(fn)</code></td><td>llama a <code>fn</code> con este Route como el activo del router y devuelve su resultado: <code>route.run(() =&gt; renderToString(App))</code> en el servidor. Solo sincrónico; el Route deja de ser el activo en cuanto <code>fn</code> devuelve.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>El primer argumento de una página: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. Es el contexto con el que se construyó la página; lee <code>router.*</code> para obtener valores en vivo. Solo difieren cuando la query o el hash cambiaron sin una reconstrucción.</p>
      <p><code>params</code> es <code>{ [name]: string }</code> por defecto. Una página puede tiparlo a partir de su propio patrón con <code>Params</code>, que convierte <code>'/blog/:slug'</code> en <code>{ slug: string }</code> y <code>'/files/*rest'</code> en <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>El segundo argumento de una página. Desestructura solo lo que necesites.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>dónde está la página dentro de la pila. Ver <code>Layer</code> más abajo.</td></tr>
          <tr><td><code>data</code></td><td>lo que devolvió el <code>load()</code> de la ruta, o <code>undefined</code> si no tiene. Se tipa con <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>el lugar donde una página padre renderiza su ruta hija. Ver <a href="#router-patterns">Rutas anidadas</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>registra una guarda que se consulta antes de descartar esta página. Ver <a href="#router-layers">Guardas de salida</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Dónde está una página dentro de la pila, y cómo puede salir de ella.</p>
      <table>
        <thead><tr><th>Miembro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 para la página base; 1 en adelante para las capas apiladas</td></tr>
          <tr><td><code>push(href)</code></td><td>abre otra capa desde dentro de una página, igual que <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>cierra esta capa y todo lo que haya encima, y resuelve el <code>push()</code> que la abrió. Sin argumento, cuenta como descartada. En la profundidad 0 no hace nada.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> y <code>withLoad()</code></h3>
      <p><code>DataLoader</code> es <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, la exportación opcional <code>load</code> de un módulo de página. <code>withLoad(loader, load)</code> crea una ruta cuyo <code>load</code> arranca junto con el import de su chunk, no después. Ver <a href="#router-loaders">Cargadores de ruta</a>.</p>
      <h3>Tipos</h3>
      <p>Cada tipo es una exportación con nombre de <code>nuclo-router</code>, así que puedes tipar una página, un cargador o una guarda sin importar desde la ruta de un archivo.</p>
      <table>
        <thead><tr><th>Tipo</th><th>Qué es</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>el objeto de parámetros de un patrón. <code>RouteParams</code> es la forma sin tipar y <code>Match</code> es el resultado del matcher.</td></tr>
          <tr><td><code>PageComponent</code></td><td>una página: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>un módulo de página: el componente mismo, o <code>{ default, load? }</code> tal como lo produce <code>import()</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, que opcionalmente trae un <code>load</code> de <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>la tabla que acepta <code>createRouter()</code>: de patrón a cargador, o a una tabla anidada</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, el segundo argumento de <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, el segundo argumento de <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>el tipo de <code>outlet()</code> de <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, lo que acepta <code>beforeLeave()</code></td></tr>
          <tr><td><code>MatchView</code></td><td>lo que es una vista de <code>matches()</code>: recibe parámetros y devuelve contenido o un <code>import()</code> de una página</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Capas y guardas de salida",
        content: `
      <p><code>push()</code> abre una ruta encima de la actual en vez de reemplazarla, y se resuelve con lo que sea que cierre esa capa. Como las páginas son un único <code>list()</code> sobre la pila, abrir una capa es un simple append: la página de abajo no se vuelve a renderizar, así que su DOM, su foco y su formulario a medio rellenar siguen ahí cuando la capa se cierra.</p>
      <p>Así funciona el flujo de "necesito un registro que todavía no existe" sin descartar el formulario que el usuario estaba rellenando:</p>
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
      <p>Las capas se anidan: un diálogo que necesita su propio diálogo llama a <code>layer.push()</code> y lo espera con await, sin tener ninguna referencia al Route.</p>
      <ul>
        <li><strong>La URL es la capa superior.</strong> <code>push()</code> agrega una entrada al historial, así que una capa se puede enlazar y Atrás la cierra, resolviendo su <code>push()</code> como descartada, exactamente igual que Cancelar. Atrás y <code>close()</code> comparten un único camino de código: <code>close()</code> registra su resultado y retrocede en el historial, y la profundidad guardada en <code>history.state</code> manda. Los navegadores conservan unas 50 entradas por pestaña, así que tras un recorrido largo por capas la entrada de abajo puede haber desaparecido; en ese caso <code>close()</code> cierra las capas en el sitio y reescribe la entrada actual con la página que queda visible.</li>
        <li><strong>Una navegación normal vacía la pila.</strong> Un clic en un enlace o un <code>go()</code> no es una capa: reemplaza todo y descarta las capas abiertas, de modo que ningún llamador se queda esperando.</li>
        <li><strong>Una carga en frío es una página independiente.</strong> La URL nombra la capa superior pero no la pila que hay debajo, así que abrir directamente la URL de una capa la renderiza en la profundidad 1 con <code>layer.depth === 0</code> y un <code>close()</code> inerte. Una ruta apilada debe tener sentido por sí sola; ramifica según <code>layer.depth</code> para ofrecer un enlace de salida en vez de un botón Cancelar que no hace nada.</li>
        <li><strong>La promesa no puede sobrevivir a una recarga</strong>, porque vive en un closure. Piensa en el resultado como un atajo dentro de un flujo que también funciona por el camino largo.</li>
        <li><strong>Nadie se queda esperando.</strong> <code>stop()</code> descarta todas las capas abiertas, y una capa abandonada por una navegación se resuelve con <code>undefined</code>.</li>
      </ul>
      <h3>Guardas de salida</h3>
      <p>Una página que guarda algo valioso, como un formulario a medio rellenar, registra una guarda. El router la consulta antes de descartar la página, y si devuelve <code>false</code> (o una promesa de ello) la página se queda:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Solo cuando la página se va.</strong> Una navegación hija bajo un layout, o un cambio de query o hash que conserva la página, no pregunta nada. Una guarda vive y muere con su página, así que no hay nada que desregistrar.</li>
        <li><strong>Todas las salidas.</strong> Un enlace, <code>go()</code>, Atrás y Adelante, el <code>close()</code> de una capa y un <code>go()</code> hacia una URL que el router no posee (salir de la aplicación, donde <code>to</code> es <code>null</code>). Un Atrás o Adelante rechazado se deshace, de modo que la barra de direcciones se queda en la página. Cerrar la pestaña o recargar es trabajo de <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> es el <code>RouteContext</code> hacia el que va la navegación. Las guardas se ejecutan de la más interna hacia fuera y se detienen en el primer rechazo; una que lanza un error también conserva la página. <code>close(result)</code> pasa igualmente por la guarda, así que limpia tu flag antes de cerrar con un resultado.</li>
        <li>El router solo puede deshacer entradas del historial que él mismo escribió. Un Atrás o Adelante hacia una que no escribió, como un enlace nativo <code>#fragment</code> o el <code>pushState</code> de otro script, no se consulta.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() y sub-routers",
        content: `
      <p><code>router.outlet()</code> renderiza la página. <code>router.matches(table)</code> renderiza todo lo demás que depende de dónde estás (una barra lateral, migas de pan, una barra de herramientas) a partir de su propia tabla pequeña, sin cargar una ruta ni agregar una página:</p>
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
        <li><strong>La misma coincidencia que la tabla de rutas.</strong> Los patrones, la precedencia, la coincidencia sobre la ruta sin procesar y la eliminación de <code>base</code> son los del propio router, así que una vista y una página siempre coinciden en qué URL es. Lee la ruta de la capa superior, igual que <code>router.path</code>.</li>
        <li><strong>Una vista</strong> es <code>(params, ctx) =&gt; content</code>, donde <code>params</code> se tipa a partir de su patrón y <code>ctx</code> es el <code>RouteContext</code> con el <code>pattern</code> y los <code>params</code> de la vista. También puede devolver un <code>import()</code> de un módulo de página, que se llama con <code>ctx</code> cuando llega.</li>
        <li><strong>Si nada coincide, no se renderiza nada.</strong> Agrega una vista <code>'*'</code> como fallback. Como el outlet, está vacío antes de <code>start()</code> y después de <code>stop()</code>.</li>
        <li><strong>Solo se vuelve a renderizar cuando cambia la ruta</strong>, así que una vista conserva su DOM ante cualquier cosa que conserve la página.</li>
        <li><strong>Una vista con carga diferida no renderiza nada hasta que llega su módulo.</strong> Un <code>import()</code> fallido se registra con <code>console.error</code>, no establece <code>router.error</code> y se reintenta en la siguiente navegación; un <code>update()</code> normal no lo reintenta.</li>
        <li><strong>En el servidor</strong>, una vista con carga diferida no envía nada, porque su módulo llega en el cliente. Usa una vista sincrónica para todo lo que deba ir en el primer HTML.</li>
      </ul>
      <h3>Sub-routers</h3>
      <p>Las rutas se anidan, así que un sub-router suele ser simplemente una tabla anidada. Es un solo router: la página <code>'/'</code> de la sección es su shell y sus hijos se renderizan en el <code>outlet()</code> de esa página, de modo que el shell se conserva mientras navegas dentro de la sección:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>O puedes darle a la funcionalidad su propio router, creado pero nunca iniciado. El padre tiene una sola entrada catch-all y el hijo resuelve el resto con sus propios patrones, parámetros y fallback:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>La clave está en no iniciarlo jamás. <code>start()</code> es lo que engancha los listeners, y dos routers iniciados chocan entre sí. El precio es que la resolución queda en manos del hijo, así que los cargadores de ruta, que normalmente ejecuta un router iniciado, te toca llamarlos a ti. Esta forma también reconstruye el shell cuando cambia el resto de la ruta, porque el router ve una sola ruta y el shell resuelve el resto por su cuenta. Una tabla anidada es lo que te da un padre que el router mantiene montado, así que prefiérela salvo que la funcionalidad de verdad necesite su propio router, base y fallback.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Varios routers y carga combinada",
        content: `
      <p>Una aplicación puede tener tantos routers como áreas. La regla que lo mantiene simple: <strong>inicia exactamente uno por documento</strong> y deja todos los demás sin iniciar, resolviendo URLs con <code>match()</code>. Solo el router iniciado es dueño de la URL, el historial y el listener de clics; los demás son tablas a las que les haces preguntas, y cada área puede cargar a su propio ritmo, con su propio indicador de carga.</p>
      <h3>Carga combinada: una cadena de cargadores</h3>
      <p>Cada página de la cadena de rutas coincidentes puede exportar <code>load()</code>. En una navegación en frío a una ruta hija, el cargador del layout y el de la página se ejecutan <strong>en paralelo</strong>, y un único <code>router.pending</code> cubre toda la cadena: la página anterior sigue en pantalla hasta que el par se resuelve, de modo que nunca se pinta un árbol a medio cargar. Cada componente recibe su propio <code>data</code>:</p>
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
      <p>Los dos cargadores arrancan a la vez, no uno detrás del otro. <code>router.pending</code> es true mientras se espera cualquiera de ellos y false el resto del tiempo (una ruta precargada o cargada de antemano nunca lo activa). Moverse entre secciones conserva el layout, así que solo se vuelve a ejecutar el cargador de la sección; los datos del layout, su DOM y un input a medio escribir sobreviven. Volver a navegar a la misma URL vuelve a ejecutar el cargador de la ruta final y reconstruye su fila, igual que con una sola página.</p>
      <h3>Carga múltiple: un segundo router con su propio indicador de carga</h3>
      <p>Un área independiente (una barra lateral, una bandeja, una región en vivo) recibe su propio router, creado pero nunca iniciado, y su propio flag de carga. <code>router.pending</code> pertenece al router iniciado y no dice nada de esta área, así que las dos pueden cargar en paralelo y cualquiera puede terminar primero:</p>
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
      <p>Al segundo router se le pregunta, no se le ordena: <code>match()</code> lee la URL y devuelve un contexto, y nada de la barra lateral entra jamás en la tabla de rutas principal. <code>onNavigate</code> se ejecuta tras cada navegación resuelta, la inicial incluida, así que es el único lugar que mantiene un área independiente en sintonía con la URL.</p>
      <ul>
        <li><strong><code>pending</code> pertenece al router iniciado.</strong> Un router que nunca se inició no tiene Route, ni <code>pending</code>, ni <code>error</code>. El área lleva sus propios flags, y un segundo spinner puede convivir con el primero. En la demo, la barra lateral tarda 800 ms mientras los cargadores de la ruta tardan 900 ms, así que la página puede terminar antes que la barra lateral, o al revés.</li>
        <li><strong><code>match()</code> no engancha nada.</strong> Puede haber cualquier cantidad de routers sin iniciar en el documento; cada uno tiene su propia tabla, base y caché de módulos, y ninguno toca el historial. Te cuestan una tabla y un matcher.</li>
        <li><strong>Sus cargadores nunca se ejecutan.</strong> El router iniciado ejecuta el <code>load()</code> de las páginas con las que coincide; uno sin iniciar solo resuelve. Si sus vistas necesitan datos, tráelos tú mismo, como hace el <code>refreshSidebar()</code> de la demo. Y si quieres cargadores, una <a href="#router-matches">tabla anidada</a> o una <a href="#router-regions">región que rellena una página</a> mantiene ese trabajo dentro del router iniciado.</li>
        <li><strong>Protégete de respuestas obsoletas.</strong> La respuesta de una petición lenta de la barra lateral no debe aplicarse a una sección que ya dejaste atrás. Incrementa un contador de generación en cada refresco y descarta las respuestas que ya no correspondan, tal como el propio router descarta las navegaciones superadas.</li>
        <li><strong>Una vista con carga diferida de <code>matches()</code> tampoco tiene <code>pending</code>.</strong> No renderiza nada hasta que llega su módulo. Son tres sistemas de carga con tres relojes independientes: el <code>pending</code> de la ruta, tus propios flags y una vista diferida que simplemente todavía no llegó.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Manejo de enlaces",
        content: `
      <p>El listener delegado navega ante un clic izquierdo en un <code>&lt;a href&gt;</code>, incluido un <code>&lt;a&gt;</code> SVG y los clics sobre cualquier cosa anidada dentro de uno. Se hace a un lado en todo lo demás: clics con modificadores y con el botón central, un <code>target</code> distinto de <code>_self</code>, <code>download</code>, <code>rel="external"</code>, hrefs de otro origen, enlaces solo de hash en la página actual, rutas fuera de <code>base</code>, URLs que no coinciden con ninguna ruta (para que un 404 renderizado en el servidor siga siendo alcanzable) y cualquier evento en el que un handler de la aplicación ya haya llamado a <code>preventDefault()</code>. Para excluir un enlace de forma explícita, usa <code>data-nuclo-router="off"</code>.</p>
      <h3>Scroll</h3>
      <p>Una navegación con push conserva la posición de scroll actual. Si la nueva URL trae un <code>#hash</code> que coincide con un elemento de la página, ese elemento se desplaza a la vista, y <code>popstate</code> le deja el scroll al navegador. Si quieres que las páginas nuevas abran desde arriba, hazlo en <code>onNavigate</code>, que te dice cómo ocurrió la navegación:</p>
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
      <h3>Notas</h3>
      <ul>
        <li><strong>No se retiene nada.</strong> El Route guarda la función de página y su contexto, nunca DOM. Al navegar a otro lugar se libera la página anterior. <code>stop()</code> libera los listeners y cualquier carga en curso y limpia <code>pending</code>, así que un Route retirado jamás deja un indicador de carga atascado. Un módulo que se resuelve después de <code>stop()</code> se descarta en silencio.</li>
        <li><strong>Seguro ante la concurrencia en el servidor.</strong> <code>start()</code> devuelve estado por petición y <code>run()</code> lo limita a un renderizado sincrónico, así que las peticiones intercaladas no pueden ver la ruta de las demás. Lo único compartido es la caché de módulos. El ámbito termina cuando la función de <code>run()</code> devuelve; como <code>renderToString()</code> es sincrónico, alcanza. Un renderizado asíncrono o en streaming tendría que llevar el Route a través de los <code>await</code>, y <code>run()</code> no lo hace.</li>
        <li><strong>La restauración del scroll en <code>popstate</code></strong> corre por cuenta del navegador (<code>scrollRestoration</code>), no del router.</li>
        <li><strong>Inicia un router por documento.</strong> Cada <code>start()</code> agrega su propio listener <code>click</code> delegado, y el <code>start()</code> de un segundo router no retira al primero; solo lo hace un segundo <code>start()</code> sobre el mismo router. Para resolver una URL contra otra tabla, crea un router y llama únicamente a <code>match()</code>, que no engancha nada. Así, un área independiente puede llevar su propia carga junto al <code>pending</code> de la ruta. Ver <a href="#router-multi">Varios routers y carga combinada</a>.</li>
        <li><strong>Fuera del alcance, a propósito:</strong> el historial hash y el de memoria, porque la ruta vive en el pathname y un servidor debe servir todas las rutas; dos áreas enrutadas de forma independiente desde una misma URL, porque una página puede rellenar varias regiones con <code>into()</code> pero todas pertenecen a la única ruta coincidente (un área independiente aun así puede mantener su propio router sin iniciar y su propia carga, como en <a href="#router-multi">Varios routers y carga combinada</a>); y la precarga al pasar el ratón, que consigues llamando al cargador de la ruta desde un <code>mouseenter</code>.</li>
      </ul>
      <h3>Ejemplos</h3>
      <p>Hay dos ejemplos ejecutables en el repositorio que se complementan, de modo que cada ajuste se puede ver en acción en alguno de ellos:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: un recorrido del lado del cliente por toda la API. Cada forma de patrón y regla de precedencia, las exclusiones del manejo de enlaces, cada miembro de Route con controles en vivo, un sub-router, la pila de capas con tres niveles, una sección relativa montada bajo dos padres y cargadores de ruta con <code>pending</code> y <code>error</code>. Usa <code>preload: false</code> para que esos estados sigan a la vista.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> por petición, hidratación que demuestra la reutilización de los nodos del servidor, códigos de estado 404 reales, un <code>base</code> distinto de la raíz, precarga en reposo que puedes observar en el panel de red y un cargador cuyos datos pasan del servidor al cliente para que la hidratación no vuelva a hacer fetch.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "Patrones",
    sections: [
      {
        id: "computed",
        title: "Valores calculados",
        content: `
      <p>Nuclo no tiene una API para valores calculados, y no la necesita: usa una función normal y llámala desde los valores dinámicos:</p>
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
        title: "Asincronía y carga",
        content: `
      <p>Usa <code>async</code>/<code>await</code> de toda la vida y llama a <code>update()</code> cada vez que el estado cambie. En un fetch, eso es una vez antes del <code>await</code> y otra después:</p>
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
        title: "Buenas prácticas",
        content: `
      <ul>
        <li><strong>Agrupa los cambios.</strong> Modifica todo el estado que necesites y llama a <code>update()</code> una sola vez.</li>
        <li><strong>Mantén los valores dinámicos rápidos y puros.</strong> Todos se ejecutan en cada <code>update()</code>.</li>
        <li><strong>Usa <code>scope()</code></strong> para actualizaciones pequeñas y frecuentes, como escribir en un campo o un temporizador.</li>
        <li><strong>Renderiza dentro del documento.</strong> Los nodos que no están en el documento cuando corre <code>update()</code> dejan de actualizarse.</li>
        <li><strong>Usa <code>when()</code> y <code>list()</code></strong> para los hijos que cambian, no una función que devuelve nodos.</li>
        <li><strong>Usa <code>className</code>, no <code>class</code></strong>, y para clases dinámicas recurre a <code>() =&gt; cx(...)</code> o a <code>{ className: () =&gt; … }</code>.</li>
        <li><strong>Define los estilos una vez</strong>, a nivel de módulo.</li>
        <li><strong>Renderizado en el servidor:</strong> renderiza primero y después pon <code>getCssText()</code> en <code>&lt;style id="nuclo-styles"&gt;</code>. Pasa los datos de la petición como argumentos y conserva los comentarios HTML en la salida.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "Referencia",
    sections: [
      {
        id: "api-index",
        title: "Índice de la API",
        content: `
      <p>Todas las funciones públicas, y de dónde sale cada una.</p>
      <h3><code>nuclo</code> (globales y exportaciones con nombre)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: ejecuta todos los valores dinámicos, o solo los de los scopes indicados.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: le asigna a un elemento ids de scope para usar con <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: contenido condicional, con <code>.when()</code> y <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: una fila por elemento, emparejadas por identidad.</li>
        <li><a href="#api-region"><code>region(options)</code></a> e <a href="#api-region"><code>into(id, ...content)</code></a>: un lugar con nombre en el árbol y el contenido que lo rellena desde cualquier parte.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: un listener de eventos, o <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: construye el árbol y lo agrega al documento.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: toma el control del HTML que envió el servidor.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: vuelve a llamar a los componentes y parchea el DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: clases generadas a partir de un objeto de estilo.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: combina estilos; gana el último.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> y <code>globalStyle</code>, con tema.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: estilos a partir de opciones.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> y <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (solo exportaciones con nombre)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> y <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> y <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">Un import con efectos secundarios</a>, además de <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> y las clases <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (paquete independiente)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: el router, con <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> y <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: una ruta cuyo cargador de datos arranca junto con su chunk.</li>
        <li><a href="#router-api">Tipos</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> y más.</li>
      </ul>
      <h3>Solo globales</h3>
      <ul>
        <li><a href="#tag-builders">175 funciones constructoras de etiquetas</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, y <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Tipos</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> y más. Los tipos de estilos, como <code>StyleResult</code>, también se pueden importar desde <code>'nuclo'</code>.</li>
      </ul>
      <h3>Claves especiales</h3>
      <ul>
        <li><a href="#attributes">Atributos</a>: <code>className</code>, <code>style</code>, <a href="#events">handlers <code>on*</code></a>, <a href="#lifecycle"><code>onMount</code> y <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Objetos de estilo</a>: atajos, pseudoclases y pseudoelementos, selectores <code>&amp;</code>, reglas <code>@</code> y <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Preguntas frecuentes",
        content: `
      <h3>¿Cambiar el estado actualiza la interfaz?</h3>
      <p>No. El DOM se queda tal cual hasta que llamas a <code>update()</code>.</p>

      <h3>¿Nuclo usa signals, proxies o un virtual DOM?</h3>
      <p>No. El estado sigue siendo JavaScript plano. Al renderizar un árbol, Nuclo crea elementos y nodos de texto reales; después, <code>update()</code> ejecuta todos los valores dinámicos registrados (o solo los de los scopes indicados) y parchea esos mismos nodos donde algún valor cambió. No hay grafo de dependencias ni árbol virtual.</p>

      <h3>¿Por qué mi página muestra "false"?</h3>
      <p>Los booleanos se renderizan como texto: <code>div(ok &amp;&amp; span('Done'))</code> muestra "false". Para hijos usa <code>when(() =&gt; ok, span('Done'))</code>, y para texto, <code>ok ? 'Done' : ''</code>.</p>

      <h3>¿Por qué la fila de mi lista no cambia cuando edito el elemento?</h3>
      <p>Las filas de los elementos que siguen en la lista se conservan; no se vuelven a renderizar. Para los campos que cambian, usa valores dinámicos como <code>() =&gt; todo.text</code>. Ver <a href="#api-list"><code>list()</code></a>.</p>

      <h3>¿Por qué una parte de mi interfaz deja de actualizarse?</h3>
      <p>Lo más probable es que sus nodos no estuvieran en el documento cuando corrió <code>update()</code>. Nuclo deja de rastrearlos, aunque los agregues después, así que renderiza dentro de un contenedor que ya esté en el documento. Hay otras dos causas: un <code>when()</code> cuya condición lanza un error deja de actualizarse, y una función de texto que lanza un error en su primera ejecución se queda vacía. Ver <a href="#api-update"><code>update()</code></a>.</p>

      <h3>¿Cuándo debo usar <code>forceUpdate()</code>?</h3>
      <p>Solo para cambios poco frecuentes en valores estáticos, como cambiar el idioma. Para todo lo demás, usa <code>update()</code>. Ver <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>¿Cómo coloco una página en un layout sin pasarla como prop?</h3>
      <p>Marca el sitio con <code>region({ id: 'main' })</code> y haz que la página devuelva <code>into('main', …)</code>. Ver <a href="#api-region"><code>region()</code> e <code>into()</code></a>.</p>

      <h3>¿Cómo desmonto una aplicación?</h3>
      <p>Envuélvela en <code>when()</code> y apaga la condición. Si quitas el DOM por tu cuenta, <code>onDestroy</code> no se ejecuta. Ver <a href="#lifecycle">Ciclo de vida</a>.</p>

      <h3>¿Nuclo incluye un router?</h3>
      <p>No en el paquete principal. El enrutamiento se distribuye aparte, como <code>nuclo-router</code>, con renderizado en el servidor, hidratación, rutas con code splitting y precarga en reposo. Se instala con <code>npm install nuclo nuclo-router</code>. Ver <a href="#router-overview">nuclo-router</a>.</p>

      <h3>¿Nuclo tiene efectos?</h3>
      <p>No. <code>onMount</code> y <code>onDestroy</code> se ejecutan una vez por elemento, ligados a su inserción y a su eliminación; nada se vuelve a ejecutar solo porque cambió algún estado.</p>
    `,
      },
    ],
  },

];
