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
      <p>Convierte un objeto de estilo tipado en clases CSS generadas. Pasa el resultado a cualquier función constructora de etiquetas. En el navegador, las reglas van a un único elemento <code>&lt;style id="nuclo-styles"&gt;</code>. En el servidor, <a href="#api-css-text"><code>getCssText()</code></a> las devuelve.</p>
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
        <li><code>css()</code> crea una clase para las declaraciones base, más una clase por cada clave pseudo, selector y bloque media. La tarjeta de arriba recibe dos clases.</li>
        <li>Los nombres de clase son hashes del contenido. Estilos idénticos comparten clase, y el servidor y el cliente producen los mismos nombres.</li>
        <li>Define los estilos una vez, a nivel de módulo. <code>css()</code> cachea por objeto, así que un objeto nuevo en cada llamada se procesa de nuevo cada vez.</li>
        <li>Cambiar un objeto de estilo después de pasarlo a <code>css()</code> no tiene efecto.</li>
        <li>Cada estilo queda registrado durante toda la vida de la página o del proceso del servidor. Para valores que cambian por elemento, como un ancho que viene de los datos, usa el <a href="#attributes">atributo <code>style</code></a>.</li>
      </ul>
      <h3>Estilos con nombre</h3>
      <p>Pasa primero un nombre para obtener un nombre de clase legible:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>La clase base es exactamente el nombre. Los demás bloques reciben <code>name-&lt;hash&gt;</code>.</li>
        <li>El nombre debe ser un nombre de clase válido. Si no, Nuclo avisa y genera uno.</li>
        <li>Los nombres son globales. Si dos estilos distintos usan el mismo nombre, Nuclo avisa.</li>
      </ul>
      <h3>Usar el resultado</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> y <code>card.className</code> devuelven ambos los nombres de clase.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Objetos de estilo",
        content: `
      <p>El objeto que pasas a <code>css()</code> usa propiedades CSS comunes en camelCase, un conjunto de atajos y claves anidadas para pseudoclases y pseudoelementos, selectores y media queries. TypeScript autocompleta todas ellas. Las propiedades fuera del conjunto tipado, como <code>borderTopLeftRadius</code>, <code>fill</code> o <code>paddingInline</code>, van en <code>raw</code> (ver más abajo).</p>
      <h3>Valores</h3>
      <ul>
        <li>Los números se convierten en <code>px</code>, excepto <code>0</code> y las propiedades sin unidad: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> y <code>gridRow</code>. En <code>raw</code>, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> y <code>animation-iteration-count</code> tampoco llevan unidad.</li>
        <li>Las cadenas se usan tal como están escritas. <code>null</code>, <code>undefined</code> y <code>false</code> se omiten.</li>
        <li><code>lineHeight</code> (y <code>leading</code>) no lleva unidad, así que <code>leading: 24</code> significa 24 veces el tamaño de fuente. Escribe <code>"24px"</code> para píxeles.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Atajos</h3>
      <table>
        <thead><tr><th>Clave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, y cada lado</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding izquierdo y derecho / superior e inferior</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>lo mismo para margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height, y sus mínimos y máximos</td></tr>
          <tr><td><code>size</code></td><td>width y height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Estas claves aceptan <code>true</code>:</p>
      <table>
        <thead><tr><th>Clave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (no establece display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudoclases y pseudoelementos</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> y <code>firstLetter</code>. Se anidan: <code>hover: { focus: {…} }</code> produce <code>:hover:focus</code>.</p>
      <h3>Selectores y at-rules</h3>
      <p>Una clave que empieza por <code>&amp;</code> es un selector, y cada <code>&amp;</code> se convierte en la clase. Una clave que empieza por <code>@</code> es una at-rule: <code>@media</code>, <code>@container</code> o <code>@supports</code>.</p>
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
        <li>La clave debe empezar por <code>&amp;</code>. Una clave como <code>".dark &amp;"</code> se ignora, así que escribe <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Dos bloques <code>@media</code> anidados se combinan con <code>and</code>. Una query que empieza por un tipo de medio (<code>print</code>, <code>only screen</code>) se coloca primero, porque la gramática solo permite un tipo al principio. Una combinación que no se puede aplanar — dos tipos de medio, o un <code>not</code> inicial — avisa y usa solo la query interna. Cualquier otra at-rule anidada reemplaza a la externa.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Usa <code>raw</code> para cualquier propiedad, con el nombre escrito exactamente como en CSS. Los números siguen recibiendo <code>px</code>, así que pasa cadenas:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Cualquier otra clave plana se convierte a kebab-case y se escribe tal cual, así que una errata como <code>colr: 'red'</code> se convierte en una declaración que el navegador descarta. Un objeto anidado bajo una clave que no es una pseudoclase, un pseudoelemento ni un screen, ni una clave <code>&amp;</code> o <code>@</code> se ignora. TypeScript señala ambos casos.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Combina estilos. Cuando dos entradas establecen la misma propiedad, gana la entrada posterior.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Las entradas falsy se omiten, los arrays se aplanan y las cadenas se separan y se deduplican.</li>
        <li>Las clases generadas para el mismo bloque (base, el mismo pseudo, la misma media query) se fusionan en una nueva clase. Los demás nombres de clase pasan sin cambios.</li>
        <li>Solo <code>cx()</code> conoce el orden de los argumentos. Con <code>div(base, blue)</code> se añaden ambas clases, y gana la regla que se creó la última. Pon los estilos que se sobrescriben entre sí en una sola llamada a <code>cx()</code>.</li>
        <li>Cuando el bloque de un estilo con nombre se fusiona con el bloque de otra entrada, la clase fusionada es <code>name-&lt;hash&gt;</code>, no el nombre a secas. Los bloques que no se fusionan conservan su clase, así que <code>cx(pageTitle, 'extra')</code> sigue teniendo <code>page-title</code>.</li>
      </ul>
      <h3>Clases dinámicas</h3>
      <p>Pasa una función que siempre devuelva <code>cx(...)</code>:</p>
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
      <p>La función debe devolver un resultado de estilo en su primera ejecución. <code>() =&gt; active &amp;&amp; activeButton</code> renderiza el texto "false" en lugar de una clase.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Devuelve sus propios <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> y <code>globalStyle</code>, vinculados a un tema. Un tema da nombres a valores: con el tema de abajo, <code>borderColor: 'border'</code> escribe <code>#e5e7eb</code>, y TypeScript autocompleta los nombres. Cada entrada de <code>screens</code> se convierte en una clave de estilo para una media query, como <code>md: {…}</code>.</p>
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
        <thead><tr><th>Clave del tema</th><th>Usada por</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> y cada lado, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>nuevas claves de estilo, como <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Un nombre del tema solo se resuelve cuando es el valor completo. <code>border: "1px solid primary"</code> no se resuelve.</li>
        <li>Un valor de screen sin <code>@</code> se convierte en <code>@media &lt;value&gt;</code>. Un valor que empieza por <code>@</code> se usa tal como está escrito, por ejemplo <code>"@container (min-width: 400px)"</code>.</li>
        <li>Los screens solo existen en las instancias creadas con <code>createCss()</code>. El <code>css()</code> global no tiene ninguno, pero acepta claves <code>@media</code>.</li>
        <li>Todas las instancias y los helpers globales comparten una sola hoja de estilos. Las reglas media de los screens se emiten en el orden en que se declaran los screens, no en el orden en que los usas, así que lista los screens <code>min-width</code> de menor a mayor. Usa una sola instancia de <code>createCss()</code> por aplicación, para que ese orden sea el de tu tema.</li>
        <li><code>theme</code> en el resultado es el tema que pasaste.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Construye una función que devuelve un estilo para un conjunto de opciones, como la intención y el tamaño de un botón.</p>
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
        <li>Los estilos se fusionan en este orden: <code>base</code>, el valor elegido de cada grupo y luego cada compound que coincida. Los estilos posteriores ganan por propiedad.</li>
        <li>Una opción ausente, <code>undefined</code> o <code>null</code> usa el valor por defecto. Un grupo sin valor por defecto se omite.</li>
        <li>Un grupo con solo las claves <code>true</code> y <code>false</code> acepta un booleano.</li>
        <li>Un compound se aplica cuando coincide cada grupo que lista, incluidos los valores por defecto.</li>
        <li>Cada selección se construye una vez y se cachea.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() y globalStyle()",
        content: `
      <p><code>keyframes()</code> registra una animación y devuelve su nombre generado. Las claves de los frames son <code>from</code>, <code>to</code> y porcentajes, como <code>"50%"</code> o <code>"0%, 100%"</code>. Los frames solo aceptan propiedades planas. Frames idénticos devuelven el mismo nombre.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> añade una regla para cualquier selector:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>El selector se usa exactamente como está escrito.</li>
        <li>Solo funcionan las propiedades planas. Las claves pseudo, los screens y las claves <code>@</code> se ignoran, así que <code>globalStyle()</code> no puede escribir reglas media.</li>
        <li>La misma regla se añade una sola vez. Un estilo distinto para el mismo selector añade una segunda regla, y gana la posterior.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() y resetStyles()",
        content: `
      <p><code>getCssText()</code> devuelve todas las reglas que <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> y <code>globalStyle()</code> han creado en este proceso: primero las reglas base, luego los bloques <code>@media</code>, <code>@container</code> y <code>@supports</code>. Úsalo para el renderizado en el servidor.</p>
      <ul>
        <li>Llámalo después de <code>renderToString()</code>. Las reglas creadas durante el renderizado quedan incluidas.</li>
        <li>Cubre todo el proceso, no una página o una petición, y solo crece. Eso es seguro, porque los nombres de clase son hashes del contenido.</li>
        <li>Ponlo en <code>&lt;style id="nuclo-styles"&gt;</code>. El cliente reutiliza ese elemento y omite las reglas que ya contiene. Con otro id, o sin ninguno, el cliente añade una segunda hoja de estilos con todas las reglas de nuevo.</li>
        <li>El texto no se escapa, así que nunca pongas entrada no confiable en valores de estilo.</li>
      </ul>
      <p><code>resetStyles()</code> es un helper para tests. Elimina todas las reglas y el elemento <code>#nuclo-styles</code>. Los estilos que creaste antes conservan sus nombres de clase pero pierden su CSS. No lo llames en una aplicación ni en un servidor.</p>
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
      <div class="docs-callout"><strong>Paquete independiente:</strong> <code>nuclo-router</code> no forma parte del paquete principal de Nuclo. Instálalo junto a <code>nuclo</code>. Es una versión preliminar, así que su API aún puede cambiar.</div>
      <p>Enrutamiento para Nuclo: renderizado en el servidor, hidratación, rutas con code splitting y precarga en reposo, construido sobre <code>list()</code> y <code>update()</code>. Unos ${NUCLO_ROUTER_GZIP_KB} KB comprimido con gzip, sin dependencias más allá del propio Nuclo y sin efectos secundarios, así que el tree-shaking lo elimina cuando no se usa.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>O usa <code>pnpm add</code>, <code>yarn add</code> o <code>bun add</code> con los mismos dos nombres. Necesita <code>nuclo</code> 0.3 o posterior como peer dependency.</p>
      <p>El router decide <em>qué</em> cargar. La aplicación dice <em>dónde</em> con <code>router.outlet()</code>: un <code>list()</code> sobre la pila de capas, una fila por capa, así que una página normal es una sola fila. El servidor y el cliente construyen el mismo árbol, así que <code>hydrate()</code> reutiliza los nodos del servidor en lugar de reemplazarlos. Todo lo demás es <code>history</code>, un listener <code>click</code> delegado y <code>requestIdleCallback</code>.</p>
      <h3>Un solo import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> resuelve los módulos de la ruta coincidente antes de devolver, así que el primer árbol está completo tanto en el servidor como en el cliente. Después, el router lee directamente de la ruta que inició: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
      <h3>Una aplicación completa</h3>
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
      <p>Esa es toda la integración. Los enlaces funcionan porque un <code>&lt;a href&gt;</code> es simplemente un <code>&lt;a href&gt;</code>. Un listener delegado en <code>document</code> intercepta los enlaces que el router posee y deja todos los demás al navegador.</p>
      <p>En el servidor, <code>start()</code> devuelve un <code>Route</code> por petición y no toca el router, así que las peticiones concurrentes no pueden ver la ruta de las otras. <code>route.run()</code> hace que ese Route sea el que el router, y por tanto el outlet, lee durante el renderizado. En el navegador hay un Route por carga de página, y <code>start()</code> lo convierte en el propio del router. No hace falta <code>run()</code>.</p>
      <p>Una página recibe su <a href="#router-api"><code>RouteContext</code></a> y sus <a href="#router-api"><code>PageProps</code></a>, como <code>(ctx, { layer, data, outlet, beforeLeave })</code>, y puede aceptar menos argumentos. Devuelve cualquier cosa que <code>list()</code> acepte. Para rellenar también otra parte del layout, devuelve un <code>into()</code> desde dentro de la página, como <code>div(article(…), into('sidebar', nav(…)))</code>. Ese contenido se va con la página. Ver <a href="#router-regions">Páginas y regiones</a>.</p>
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
      <p>La precedencia es: estáticas, luego dinámicas en orden de declaración, luego catch-all con el prefijo más largo primero. Así, <code>'*'</code> solo coincide con lo que nada más coincide y puede estar en cualquier lugar de la tabla. Las barras finales, las barras duplicadas y la codificación porcentual se normalizan, y los valores de los parámetros llegan decodificados. La coincidencia es una comparación por segmentos por cada patrón. No se construyen ni ejecutan expresiones regulares.</p>
      <h3>Rutas relativas</h3>
      <p>Un patrón escrito con <code>./</code> es relativo al padre que lo declara, y un href escrito con <code>./</code> es relativo a la ruta activa. Juntos forman una sección reutilizable que significa lo mismo bajo cualquier padre. El valor de una tabla es o bien un cargador o bien otra tabla, cuyas claves son relativas a ella:</p>
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
      <p>Esas dos líneas producen los seis patrones sin escribir ninguna ruta dos veces. Ambos padres reciben los mismos objetos cargadores, así que comparten una caché de módulos y un solo <code>import()</code>.</p>
      <ul>
        <li>Dentro de una tabla hija, <code>'./x'</code>, <code>'/x'</code> y <code>'x'</code> significan lo mismo, <code>'/'</code> significa la ruta del padre en sí, y <code>'*rest'</code> da a la sección su propio catch-all. El anidamiento llega tan profundo como quieras.</li>
        <li>Las claves de nivel superior se usan tal como están escritas, así que <code>'*'</code> sigue siendo <code>'*'</code>.</li>
        <li>Un hijo bajo un padre <code>*catch-all</code> es un error de <code>createRouter()</code>, ya que un catch-all tiene que terminar su patrón.</li>
      </ul>
      <h3>Páginas padre y <code>outlet()</code></h3>
      <p>Un padre y sus hijos son una jerarquía real. El padre se renderiza, y su hijo se renderiza dentro de él, allí donde llame a <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Navegar entre hijos no reconstruye el padre. Su nodo DOM es el mismo nodo, así que su foco, su posición de scroll, su input a medio escribir y cualquier estado de su closure sobreviven.</p>
      <ul>
        <li>Una página sin ruta hija no renderiza nada desde su outlet, así que un layout puede llamarlo sin condición. Un padre que tiene un hijo y nunca llama a <code>outlet()</code> se lo traga.</li>
        <li>No hay rutas índice. <code>'/'</code> es el layout en sí, así que la ruta del padre renderiza el layout con un outlet vacío en lugar de una página índice separada dentro de él. Pon el contenido inicial en el layout, o dale una ruta hija real.</li>
      </ul>
      <p>La misma llamada funciona entonces desde cualquiera de los dos padres, y desde una página que no sabe en cuál está:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> y <code>..</code> se resuelven contra la ruta actual, no contra el "directorio" de la URL. Desde <code>/invoices/42</code>, <code>./preview</code> es <code>/invoices/42/preview</code>, donde un navegador habría dicho <code>/invoices/preview</code>, y una barra final en la URL no cambia nada. <code>../</code> sube un segmento y se detiene en la raíz. La query y el hash se conservan, <code>base</code> se vuelve a añadir, y la ruta absoluta resuelta es lo que entra en el historial. Es la misma desviación de la resolución de URLs que hace React Router para <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Solo <code>./</code> y <code>../</code> son relativos a la ruta. Un <code>preview</code> a secas en un href se deja a las reglas normales del navegador.</li>
        <li>Construye los enlaces relativos con <code>router.href('./preview')</code> en lugar de escribir <code>href="./preview"</code> a mano. <code>href()</code> resuelve en tiempo de renderizado, así que el marcado que se envía es absoluto y sigue siendo correcto para un crawler, para un clic con el botón central y con JavaScript desactivado.</li>
      </ul>
      <h3>Qué se conserva y qué se reconstruye</h3>
      <table>
        <thead><tr><th>Nodo</th><th>Al navegar</th></tr></thead>
        <tbody>
          <tr><td>un padre cuyo patrón y ruta no cambian</td><td><strong>se conserva</strong>: el mismo nodo, y su <code>load()</code> no se vuelve a ejecutar</td></tr>
          <tr><td>la página coincidente</td><td><strong>se conserva</strong> cuando su patrón y ruta no cambian y no tiene <code>load()</code>, así que un cambio de query o hash la mantiene. Una ruta con cargador se refresca en cada visita.</td></tr>
          <tr><td>un padre cuya ruta cambió</td><td>se reconstruye, junto con todo lo que hay debajo</td></tr>
          <tr><td>una capa apilada</td><td>renderiza solo la página coincidente. Sus padres ya están montados en la fila de debajo.</td></tr>
        </tbody>
      </table>
      <p>Una página conservada conserva el <code>ctx</code> con el que se construyó. Ese es el significado de <code>ctx</code> en todas partes: lee <code>router.*</code> para obtener valores en vivo. El estado dirigido por la query, como filtros, paginación y pestañas, lee <code>router.search</code> dentro de un valor dinámico y escribe con <code>router.go('?page=2', { replace: true })</code>. La página, su foco y su input a medio escribir se quedan donde están.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Páginas y regiones",
        content: `
      <p><code>router.outlet()</code> coloca la página en un sitio. Una página que además necesita una barra lateral, una barra de herramientas o un encabezado en otro lugar del layout lo rellena con <a href="#api-region"><code>into()</code></a>. El layout marca el lugar con <code>region()</code>, y la página devuelve un <code>into()</code> junto a su propio contenido. El layout nunca recibe contenido de página como prop, y la navegación nunca lo reconstruye.</p>
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
      <p>El contenido de la página es una fila del <code>list()</code> del outlet, y un <code>into()</code> vive tanto como la fila que lo contiene. Así que el contenido de la barra lateral llega con la página y se va con ella: navegar a una página sin un <code>into('sidebar', …)</code> muestra de nuevo el contenido <code>empty</code> de la región. La página puede usar su <code>ctx</code> y su <code>data</code> para ambas partes, ya que ambas las construye la misma función.</p>
      <h3>Qué ocurre al navegar</h3>
      <ul>
        <li><strong>Una página conservada conserva sus regiones.</strong> Un cambio de query o hash que <a href="#router-patterns">conserva la página</a> tampoco toca el contenido de la región. Lee <code>router.search</code> dentro de un valor dinámico si la barra lateral depende de ello.</li>
        <li><strong>Una página reconstruida las vuelve a rellenar.</strong> Cuando la ruta cambia, la fila antigua se elimina y las vistas <code>into()</code> de la nueva página toman el relevo. No queda nada atrás.</li>
        <li><strong>Una capa apilada añade una vista.</strong> La capa es una fila posterior del outlet, así que su <code>into()</code> es una vista más reciente de la misma región. Con el <code>type: 'latest'</code> por defecto cubre la vista de la página hasta que la capa se cierra, y entonces la vista de la página se muestra de nuevo. Con <code>type: 'stack'</code> se muestran ambas.</li>
        <li><strong>Una página padre también puede rellenar regiones.</strong> Sus vistas permanecen mientras sus hijos cambian, porque el padre no se reconstruye.</li>
        <li><strong>El renderizado en el servidor funciona tal cual.</strong> El servidor construye la página dentro de <code>route.run()</code>, así que sus vistas <code>into()</code> están en el HTML, y <code>hydrate()</code> las reutiliza.</li>
      </ul>
      <h3>Varias regiones desde una página</h3>
      <p>Pasa un objeto para rellenar más de una región a la vez. El contenido principal de la página sigue pasando por el outlet, así que devuélvelo junto al <code>into()</code>:</p>
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
      <h3>Qué herramienta para cada tarea</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> es para una ruta hija: contenido que decide la URL, renderizado dentro de su página padre. Ver <a href="#router-patterns">Rutas anidadas</a>.</li>
        <li><strong><code>into()</code></strong> es para que la página coincidente se extienda por el layout. El contenido pertenece a la página y usa sus datos.</li>
        <li><strong><code>matches()</code></strong> es para que el layout decida solo a partir de la URL, con su propia tabla pequeña y sin ninguna página involucrada. Ver <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Todo esto pertenece a la única ruta coincidente. El router no dirige dos áreas independientes desde una URL, así que una barra lateral con sus propias rutas es una región que una página rellena, no un segundo outlet. Una barra lateral que realmente quiere su propio router, carga y fallback mantiene uno sin iniciar y resuelve con <code>match()</code> — ver <a href="#router-multi">Varios routers y carga combinada</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Cargadores de ruta y code splitting",
        content: `
      <p>Un módulo de página puede exportar una función <code>load</code>. Se ejecuta antes de construir la página, en cada navegación a esa ruta, y lo que devuelve se entrega a la página como <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>La tabla de rutas no cambia. El cargador viaja con la página. Recibe el <code>RouteContext</code> coincidente, así que <code>params</code>, <code>search</code> y <code>path</code> están disponibles. Puede ser sincrónico o asíncrono, y también se ejecuta en el servidor, así que una página renderizada en el servidor llega con sus datos ya en el HTML en lugar de hacer fetch después de la hidratación.</p>
      <p><strong>El módulo se cachea. Los datos no.</strong> El chunk de una ruta se descarga una vez y se reutiliza, y su cargador se ejecuta de nuevo en cada navegación. Por eso <code>/blog/a</code> y <code>/blog/b</code> no pueden confundirse, y por eso un cargador que falla simplemente se puede reintentar.</p>
      <table>
        <thead><tr><th>Situación</th><th>Comportamiento</th></tr></thead>
        <tbody>
          <tr><td>mientras se ejecuta</td><td><code>router.pending</code> es true y la página en la que estabas sigue visible</td></tr>
          <tr><td>lanza o rechaza</td><td>acaba en <code>router.error</code>. <code>go()</code> sigue sin rechazar nunca, y la navegación se puede reintentar.</td></tr>
          <tr><td>durante <code>start()</code></td><td>el rechazo sale de <code>start()</code>. Aún no hay ningún Route donde ponerlo.</td></tr>
          <tr><td>una capa apilada</td><td>ejecuta su propio cargador, con sus propios datos</td></tr>
          <tr><td>el precargador en reposo</td><td>solo precarga módulos. No tiene contexto que pasar, y estaría obteniendo datos para una ruta que quizá nunca abras.</td></tr>
          <tr><td>volver a navegar a la misma URL</td><td>el cargador se ejecuta de nuevo y la fila se reconstruye. Una ruta sin cargador conserva su fila.</td></tr>
        </tbody>
      </table>
      <p>Para revalidar, navega a donde ya estás sin añadir una entrada al historial:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Iniciar los datos junto con el chunk</h3>
      <p>Un <code>load</code> exportado por el módulo de la página solo puede ejecutarse una vez que ese módulo se ha cargado, así que una navegación en frío descarga el chunk y luego los datos. Para iniciar ambos a la vez, declara el cargador en la tabla con <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Reemplaza el <code>load</code> propio del módulo y se ejecuta en cada visita igual que él. Un rechazo mientras el chunk todavía se está cargando acaba en <code>router.error</code> como cualquier otro.</p>
      <p>No hay serialización de los datos del servidor en el HTML, por diseño. El <code>load</code> del cliente se ejecuta de nuevo en la hidratación. Si eso importa, haz que el servidor emita <code>route.data</code>, por ejemplo como <code>window.__DATA__</code>, y que el cargador lo tome primero. <code>route.data</code> son solo los datos de la página coincidente. El resultado del <code>load()</code> de un padre no está ahí.</p>
      <h3>Code splitting y precarga</h3>
      <p>El valor de una ruta es siempre una función que devuelve el componente de página, así que el componente se carga bajo demanda:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Solo los valores con estructura de módulo pueden incluir una exportación <code>load</code>. Elegir un componente con nombre con <code>.then(m =&gt; m.BPage)</code> entrega al router solo la función.</p>
      <p>Cada módulo se importa una vez y se cachea. Las navegaciones concurrentes a la misma ruta comparten un solo <code>import()</code>. Una vez que el usuario ha dejado la página en reposo durante <code>idleTimeout</code> (un segundo por defecto; sin toques, teclas, rueda ni scroll), las rutas restantes se cargan en segundo plano, una por cada franja de reposo (<code>requestIdleCallback</code>). Cualquier entrada, o una navegación que el usuario está esperando, lo pausa hasta que la página vuelve a estar en reposo.</p>
      <p>Una ruta precargada o cargada de antemano nunca activa <code>router.pending</code> y se muestra antes del siguiente repintado: sin un fotograma con indicador de carga ni saltos de diseño. <code>router.pending</code> solo es true para un módulo o cargador que hay que esperar, y la página saliente permanece en pantalla mientras tanto. Un chunk que no se carga aparece como <code>router.error</code>, nunca como un rechazo no gestionado, y simplemente se puede reintentar.</p>
    `,
      },
      {
        id: "router-api",
        title: "API del router",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> asocia un patrón a un cargador, o a una tabla anidada. Opciones:</p>
      <table>
        <thead><tr><th>Opción</th><th>Por defecto</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>Prefijo de URL bajo el que se sirve la aplicación, como <code>'/docs'</code>. Solo coincide en un límite de segmento: <code>/docs/intro</code> está dentro de <code>'/docs'</code>, <code>/docsearch</code> no. Las URLs fuera de él no coinciden con nada, así que <code>start()</code> rechaza (tu 404 del lado del servidor) y los enlaces hacia ellas se dejan al navegador.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Carga los módulos de las rutas restantes en segundo plano una vez que la página está en reposo. <code>false</code> lo desactiva.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Milisegundos sin toques, teclas, rueda ni scroll antes de que empiece la precarga, o se reanude después de que el usuario estuviera activo.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, llamado después de cada navegación resuelta en el navegador, incluida la inicial, una vez que el DOM se ha puesto al día. <code>kind</code> es <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Atrás, Adelante, <code>close()</code>) o <code>'layer'</code>. El hook para <code>document.title</code>, meta tags, foco, scroll y analítica. Nunca se llama durante el SSR.</td></tr>
        </tbody>
      </table>
      <p>Devuelve el router: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, y cada miembro de <code>Route</code> excepto <code>run()</code>, leídos directamente del Route activo. Ese es el que devolvió el último <code>start()</code> en el navegador, o aquel cuyo <code>run()</code> se está ejecutando en el servidor. Leer un miembro sin ninguno de los dos lanza un error. La tabla de rutas, el matcher compilado y la caché de módulos viven en el router, así que se comparten entre peticiones en un servidor.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Resuelve <code>url</code> (por defecto: <code>location.href</code> en el navegador) a sus módulos de página y devuelve un <code>Promise&lt;Route&gt;</code>. Rechaza cuando nada coincide y la tabla no tiene ruta <code>'*'</code>. En un servidor, ese es tu 404. En el navegador también convierte el Route en el activo del router, adjunta los listeners <code>popstate</code> y <code>click</code> delegado y programa la precarga. Un segundo <code>start()</code> retira el Route anterior por ti. En el servidor no toca nada compartido, así que renderiza dentro de <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Resuelve una URL contra la tabla sin cargar nada: sin import, sin historial, sin listeners, sin Route. Devuelve un <code>RouteContext</code>, o <code>null</code> cuando la URL está fuera de <code>base</code>, no coincide con ningún patrón o, en el navegador, está en otro origen. Solo URLs absolutas, ya que la resolución de <code>./</code> necesita una ruta activa.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Las páginas de la ruta activa como un <code>list()</code>. Colócalo una vez, donde vayan las páginas. Una capa apilada es una fila posterior de él. Está vacío antes de que <code>start()</code> se resuelva y después de <code>stop()</code>. En el servidor renderiza el Route cuyo <code>run()</code> se está ejecutando.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Renderiza la vista de una segunda tabla con la que coincide la ruta activa, como un <code>list()</code> que colocas donde quieras. Ver <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Todos los miembros salvo <code>run()</code> están también en el router, que es donde una aplicación los lee.</p>
      <table>
        <thead><tr><th>Miembro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>la coincidencia activa. <code>search</code> es un <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> y <code>url</code> reflejan los valores actuales.</td></tr>
          <tr><td><code>pending</code></td><td>una navegación está esperando un módulo o un cargador</td></tr>
          <tr><td><code>error</code></td><td>la última carga fallida, borrada por la siguiente navegación</td></tr>
          <tr><td><code>data</code></td><td>lo que devolvió el <code>load()</code> de la página coincidente, para que un servidor lo serialice. El de un padre no está ahí.</td></tr>
          <tr><td><code>depth</code></td><td>cuántas capas hay en la pila (1 para una página normal)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>navega, cargando el módulo si hace falta. Nunca rechaza: un módulo que falla, rechazando o lanzando, acaba en <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>abre una ruta como una nueva capa encima, resolviéndose con aquello con lo que se cierra. Acepta <code>./</code>. Rechaza si no hay coincidencia o el módulo falla.</td></tr>
          <tr><td><code>href(path)</code></td><td>antepone <code>base</code> a una ruta, para <code>a({ href })</code>. Resuelve <code>./</code> y <code>../</code> contra la ruta activa.</td></tr>
          <tr><td><code>stop()</code></td><td>desconecta todos los listeners, descarta las capas abiertas, vacía el outlet. Idempotente. Un Route detenido sigue respondiendo con su última coincidencia, y <code>go()</code> no hace nada.</td></tr>
          <tr><td><code>run(fn)</code></td><td>llama a <code>fn</code> con este Route como el activo del router y devuelve su resultado: <code>route.run(() =&gt; renderToString(App))</code> en el servidor. Solo sincrónico. El Route deja de estar activo cuando <code>fn</code> devuelve.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>El primer argumento de una página: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. Es el contexto con el que se construyó la página. Lee <code>router.*</code> para obtener valores en vivo. Solo difieren cuando la query o el hash cambiaron sin una reconstrucción.</p>
      <p><code>params</code> es <code>{ [name]: string }</code> por defecto. Una página puede tiparlo a partir de su propio patrón con <code>Params</code>, que convierte <code>'/blog/:slug'</code> en <code>{ slug: string }</code> y <code>'/files/*rest'</code> en <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>El segundo argumento de una página. Desestructura lo que la página necesite.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>dónde está la página en la pila. Ver <code>Layer</code> más abajo.</td></tr>
          <tr><td><code>data</code></td><td>lo que devolvió el <code>load()</code> de la ruta, o <code>undefined</code> si no hay ninguno. Tipado con <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>dónde una página padre renderiza su ruta hija. Ver <a href="#router-patterns">Rutas anidadas</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>registra una guarda que se consulta antes de descartar esta página. Ver <a href="#router-layers">Guardas de salida</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Dónde está una página en la pila, y su forma de salir.</p>
      <table>
        <thead><tr><th>Miembro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 para la página base, 1 en adelante para las capas apiladas</td></tr>
          <tr><td><code>push(href)</code></td><td>abre otra capa desde dentro de una página, igual que <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>cierra esta capa y todo lo que hay encima, resolviendo el <code>push()</code> que la abrió. Sin argumento significa descartada. No hace nada en la profundidad 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> y <code>withLoad()</code></h3>
      <p><code>DataLoader</code> es <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, la exportación opcional <code>load</code> de un módulo de página. <code>withLoad(loader, load)</code> crea una ruta cuyo <code>load</code> empieza junto al import de su chunk en lugar de después. Ver <a href="#router-loaders">Cargadores de ruta</a>.</p>
      <h3>Tipos</h3>
      <p>Cada tipo es una exportación con nombre de <code>nuclo-router</code>, así que una página, un cargador o una guarda se pueden tipar sin importar desde una ruta de archivo.</p>
      <table>
        <thead><tr><th>Tipo</th><th>Qué es</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>el objeto de parámetros de un patrón. <code>RouteParams</code> es la forma sin tipar, y <code>Match</code> es el resultado del matcher.</td></tr>
          <tr><td><code>PageComponent</code></td><td>una página: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>un módulo de página: el componente en sí, o <code>{ default, load? }</code> tal como lo produce <code>import()</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, que opcionalmente lleva un <code>load</code> de <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>la tabla que acepta <code>createRouter()</code>: patrón a cargador, o a una tabla anidada</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, el segundo argumento de <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, el segundo argumento de <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>el tipo de <code>outlet()</code> de <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, lo que acepta <code>beforeLeave()</code></td></tr>
          <tr><td><code>MatchView</code></td><td>lo que es una vista de <code>matches()</code>: entran parámetros, sale contenido o un <code>import()</code> de una página</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Capas y guardas de salida",
        content: `
      <p><code>push()</code> abre una ruta encima de la actual en lugar de reemplazarla, y se resuelve con aquello con lo que esa capa se cierre. Como las páginas son un único <code>list()</code> sobre la pila, abrir una capa es un append. La página de debajo no se vuelve a renderizar, así que su DOM, su foco y su formulario a medio rellenar siguen ahí cuando la capa se cierra.</p>
      <p>Eso hace que el flujo de "necesito un registro que aún no existe" funcione sin tirar el formulario que el usuario estaba rellenando:</p>
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
      <p>Las capas se anidan. Un diálogo que necesita su propio diálogo llama a <code>layer.push()</code> y lo espera con await, sin ninguna referencia al Route.</p>
      <ul>
        <li><strong>La URL es la capa superior.</strong> <code>push()</code> añade una entrada al historial, así que una capa es enlazable y Atrás la cierra, resolviendo su <code>push()</code> como descartada, exactamente igual que Cancelar. Atrás y <code>close()</code> son un único camino de código: <code>close()</code> registra su resultado y retrocede en el historial, y la profundidad en <code>history.state</code> es la autoridad. Los navegadores conservan unas 50 entradas por pestaña, así que tras un largo recorrido por capas la entrada de debajo puede haber desaparecido: entonces <code>close()</code> cierra las capas en el sitio y reescribe la entrada actual con la página que queda visible.</li>
        <li><strong>Una navegación normal vacía la pila.</strong> Un clic en un enlace o un <code>go()</code> no es una capa. Reemplaza todo y descarta todas las capas abiertas, así que ningún llamador se queda esperando.</li>
        <li><strong>Una carga en frío es una página independiente.</strong> La URL nombra la capa superior pero no la pila de debajo, así que abrir directamente la URL de una capa la renderiza en la profundidad 1 con <code>layer.depth === 0</code> y un <code>close()</code> inerte. Una ruta apilada tiene que tener sentido por sí sola. Ramifica según <code>layer.depth</code> para ofrecer un enlace de salida en lugar de un botón Cancelar muerto.</li>
        <li><strong>La promesa no puede sobrevivir a una recarga</strong>, porque vive en un closure. Trata el resultado como un atajo dentro de un flujo que también funciona por el camino largo.</li>
        <li><strong>Nadie se queda esperando.</strong> <code>stop()</code> descarta todas las capas abiertas, y una capa abandonada por una navegación se resuelve con <code>undefined</code>.</li>
      </ul>
      <h3>Guardas de salida</h3>
      <p>Una página que contiene algo que vale la pena conservar, como un formulario a medio rellenar, registra una guarda. Se le pregunta antes de descartar la página, y devolver <code>false</code> (o una promesa de ello) conserva la página:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Solo cuando la página se va.</strong> Una navegación hija bajo un layout, o un cambio de query o hash que conserva la página, no pregunta. Una guarda vive y muere con su página, así que no hay nada que desregistrar.</li>
        <li><strong>Todas las salidas.</strong> Un enlace, <code>go()</code>, Atrás y Adelante, el <code>close()</code> de una capa, y <code>go()</code> hacia una URL que el router no posee (salir de la aplicación, donde <code>to</code> es <code>null</code>). Un Atrás o Adelante rechazado se deshace, así que la barra de direcciones se queda en la página. Cerrar la pestaña o recargar es trabajo de <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> es el <code>RouteContext</code> hacia el que se dirige la navegación. Las guardas se ejecutan de la más interna hacia fuera y se detienen en el primer rechazo. Una que lanza un error conserva la página. <code>close(result)</code> también pasa por la guarda, así que limpia tu flag antes de cerrar con un resultado.</li>
        <li>El router solo puede deshacer entradas del historial que él mismo escribió. Un Atrás o Adelante hacia una que no escribió, como un enlace nativo <code>#fragment</code> o el <code>pushState</code> de otro script, no se consulta.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() y sub-routers",
        content: `
      <p><code>router.outlet()</code> renderiza la página. <code>router.matches(table)</code> renderiza otra cosa que depende de dónde estás, como una barra lateral, migas de pan o una barra de herramientas, a partir de su propia tabla pequeña, sin cargar una ruta ni añadir una página:</p>
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
        <li><strong>La misma coincidencia que la tabla de rutas.</strong> Los patrones, la precedencia, la coincidencia sobre la ruta sin procesar y la eliminación de <code>base</code> son los propios del router, así que una vista y una página siempre están de acuerdo sobre la URL. Lee la ruta de la capa superior, como <code>router.path</code>.</li>
        <li><strong>Una vista</strong> es <code>(params, ctx) =&gt; content</code>, donde <code>params</code> está tipado a partir de su patrón y <code>ctx</code> es el <code>RouteContext</code> con el <code>pattern</code> y los <code>params</code> de la vista. En su lugar puede devolver un <code>import()</code> de un módulo de página, que se llama con <code>ctx</code> una vez que llega.</li>
        <li><strong>Si nada coincide, nada se renderiza.</strong> Añade una vista <code>'*'</code> como fallback. Está vacío antes de <code>start()</code> y después de <code>stop()</code>, como el outlet.</li>
        <li><strong>Solo se vuelve a renderizar cuando la ruta cambia</strong>, así que una vista conserva su DOM a través de cualquier cosa que conserve la página.</li>
        <li><strong>Una vista con carga diferida no renderiza nada hasta que llega su módulo.</strong> Un <code>import()</code> fallido se registra con <code>console.error</code>, no establece <code>router.error</code>, y se reintenta en la siguiente navegación. Un <code>update()</code> normal no reintenta.</li>
        <li><strong>En el servidor</strong> una vista con carga diferida no envía nada, ya que su módulo llega en el cliente. Usa una vista sincrónica para todo lo que deba contener el primer HTML.</li>
      </ul>
      <h3>Sub-routers</h3>
      <p>Las rutas se anidan, así que un sub-router suele ser simplemente una tabla anidada. Un solo router: la página <code>'/'</code> propia de la sección es su estructura de interfaz, y sus hijos se renderizan en el <code>outlet()</code> de esa página, así que la estructura se conserva al navegar dentro de la sección:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>O dale a la funcionalidad un router propio, creado pero nunca iniciado. El padre posee una única entrada catch-all y el hijo resuelve el resto contra sus propios patrones, parámetros y fallback:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>No iniciarlo nunca es la clave. <code>start()</code> es lo que adjunta los listeners, y dos routers iniciados entran en conflicto. El precio es que el hijo posee la resolución, así que los cargadores de ruta, que ejecuta un router iniciado, te toca llamarlos a ti. Esta forma también reconstruye el shell cuando cambia el resto de la ruta, porque el router ve una sola ruta y el shell resuelve el resto por sí mismo. Una tabla anidada es lo que te da un padre que el router mantiene montado, así que prefiérela a menos que la funcionalidad realmente necesite su propio router, base y fallback.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Varios routers y carga combinada",
        content: `
      <p>Una aplicación puede tener tantos routers como áreas. La regla que lo mantiene simple: <strong>inicia exactamente uno por documento</strong>, y deja todos los demás routers sin iniciar, resolviendo URLs con <code>match()</code>. Solo el router iniciado posee la URL, el historial y el listener de clics. El resto son tablas a las que haces preguntas — y cada área puede cargar a su propio ritmo, con su propio indicador de carga.</p>
      <h3>Carga combinada: una cadena de cargadores</h3>
      <p>Cada página de la cadena de rutas coincidentes puede exportar <code>load()</code>. En una navegación en frío a una ruta hija, el cargador del layout y el cargador de la página se ejecutan <strong>en paralelo</strong>, y un solo <code>router.pending</code> cubre toda la cadena: la página anterior permanece en pantalla hasta que el par se resuelve, así que un árbol a medio cargar nunca se pinta. Cada componente recibe su propio <code>data</code>:</p>
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
      <p>Ambos cargadores empiezan juntos, no uno tras otro. <code>router.pending</code> es true mientras se espera cualquiera de los dos, y false el resto del tiempo — una ruta precargada o cargada de antemano nunca lo activa. Moverse entre secciones conserva el layout, así que solo el cargador de la sección se ejecuta de nuevo; los datos del layout, su DOM y un input a medio escribir sobreviven. Volver a navegar a la misma URL vuelve a ejecutar el cargador de la ruta final y reconstruye su fila, exactamente igual que con una sola página.</p>
      <h3>Carga múltiple: un segundo router con su propio indicador de carga</h3>
      <p>Un área independiente — una barra lateral, una bandeja, una región en vivo — recibe un router propio, creado pero nunca iniciado, y su propio flag de carga. <code>router.pending</code> pertenece al router iniciado y no dice nada sobre esta área, así que las dos pueden cargar en paralelo y cualquiera puede terminar primero:</p>
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
      <p>Al segundo router se le pregunta, nunca se le ordena: <code>match()</code> lee la URL y devuelve un contexto, y nada sobre la barra lateral entra jamás en la tabla de rutas principal. <code>onNavigate</code> se ejecuta después de cada navegación resuelta, incluida la inicial, así que es el único lugar que mantiene un área independiente en sintonía con la URL.</p>
      <ul>
        <li><strong><code>pending</code> pertenece al router iniciado.</strong> Un router nunca iniciado no tiene Route, ni <code>pending</code>, ni <code>error</code>. El área lleva sus propios flags, y un segundo spinner puede ir junto al primero. En la demo, la barra lateral carga durante 800 ms mientras los cargadores de la ruta se ejecutan durante 900 ms, así que la página puede terminar antes que la barra lateral o al revés.</li>
        <li><strong><code>match()</code> no adjunta nada.</strong> Cualquier número de routers sin iniciar puede compartir el documento; cada uno tiene su propia tabla, base y caché de módulos, y ninguno toca el historial. Cuestan una tabla y un matcher.</li>
        <li><strong>Sus cargadores nunca se ejecutan.</strong> El router iniciado ejecuta el <code>load()</code> de las páginas con las que coincide. Un router nunca iniciado solo resuelve, así que si sus vistas necesitan datos, obtenlos tú mismo — el <code>refreshSidebar()</code> de la demo. Si quieres cargadores, una <a href="#router-matches">tabla anidada</a> o una <a href="#router-regions">región que una página rellena</a> mantiene ese trabajo en el router iniciado.</li>
        <li><strong>Protégete de respuestas obsoletas.</strong> La respuesta de una petición lenta de la barra lateral no debe aplicarse a una sección que ya has abandonado. Incrementa un contador de generación por cada refresco y descarta las respuestas que ya no coincidan, igual que el propio router retira las navegaciones superadas.</li>
        <li><strong>Una vista con carga diferida de <code>matches()</code> tampoco tiene <code>pending</code>.</strong> No renderiza nada hasta que llega su módulo. Tres sistemas de carga, tres relojes independientes: el <code>pending</code> de la ruta, tus propios flags, y una vista con carga diferida que simplemente aún no está.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Manejo de enlaces",
        content: `
      <p>El listener delegado navega ante un clic izquierdo en un <code>&lt;a href&gt;</code>, incluido un <code>&lt;a&gt;</code> SVG y los clics en cualquier cosa anidada dentro de uno, y se aparta para todo lo demás: clics con modificadores y clics con el botón central, un <code>target</code> distinto de <code>_self</code>, <code>download</code>, <code>rel="external"</code>, hrefs de otro origen, enlaces solo de hash en la página actual, rutas fuera de <code>base</code>, URLs que no coinciden con ninguna ruta (así que un 404 renderizado en el servidor sigue siendo alcanzable), y cualquier evento en el que un handler de la aplicación ya haya llamado a <code>preventDefault()</code>. Excluye un enlace explícitamente con <code>data-nuclo-router="off"</code>.</p>
      <h3>Scroll</h3>
      <p>Una navegación con push conserva la posición de scroll actual. Cuando la nueva URL tiene un <code>#hash</code> que coincide con un elemento de la página, ese elemento se desplaza a la vista. <code>popstate</code> deja el scroll al navegador. Para que las páginas nuevas se abran al principio, hazlo en <code>onNavigate</code>, que indica cómo ocurrió la navegación:</p>
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
        <li><strong>No se retiene nada.</strong> El Route guarda la función de página y su contexto, nunca DOM. Navegar a otro lugar libera la página anterior. <code>stop()</code> libera los listeners y cualquier carga en curso, y limpia <code>pending</code>, así que un Route retirado nunca deja un indicador de carga atascado. Un módulo que se resuelve después de <code>stop()</code> se descarta en silencio.</li>
        <li><strong>Seguro ante la concurrencia en el servidor.</strong> <code>start()</code> devuelve estado por petición y <code>run()</code> lo acota a un renderizado sincrónico, así que las peticiones intercaladas no pueden ver la ruta de las otras. Solo la caché de módulos se comparte. El ámbito termina cuando la función de <code>run()</code> devuelve. <code>renderToString()</code> es sincrónico, así que eso basta. Un renderizado asíncrono o en streaming necesitaría llevar el Route a través de los <code>await</code>, cosa que <code>run()</code> no hace.</li>
        <li><strong>La restauración del scroll en <code>popstate</code></strong> es del navegador (<code>scrollRestoration</code>), no del router.</li>
        <li><strong>Inicia un router por documento.</strong> Cada <code>start()</code> añade su propio listener <code>click</code> delegado, y el <code>start()</code> de un segundo router no retira al primero. Solo lo hace un segundo <code>start()</code> en el mismo router. Para resolver una URL contra otra tabla, crea un router y llama solo a <code>match()</code>. No adjunta nada. Un área independiente puede llevar su propia carga junto al <code>pending</code> de la ruta de esa manera. Ver <a href="#router-multi">Varios routers y carga combinada</a>.</li>
        <li><strong>No incluido, por diseño:</strong> historial hash y en memoria, ya que la ruta vive en el pathname y un servidor debe servir todas las rutas; dos áreas enrutadas de forma independiente dirigidas por una URL, ya que una página puede rellenar varias regiones con <code>into()</code> pero todas pertenecen a la única ruta coincidente — un área independiente puede aun así mantener su propio router sin iniciar y su propia carga, como en <a href="#router-multi">Varios routers y carga combinada</a>; y la precarga al pasar el ratón, que obtienes llamando al propio cargador de la ruta desde un <code>mouseenter</code>.</li>
      </ul>
      <h3>Ejemplos</h3>
      <p>Dos ejemplos ejecutables en el repositorio se complementan, así que cada ajuste se puede observar en alguna parte:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: un recorrido del lado del cliente por toda la API. Cada forma de patrón y regla de precedencia, las exclusiones del manejo de enlaces, cada miembro de Route con controles en vivo, un sub-router, la pila de capas con tres niveles, una sección relativa montada en dos padres, y cargadores de ruta con <code>pending</code> y <code>error</code>. Establece <code>preload: false</code> para que esos estados sigan siendo visibles.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> por petición, hidratación que demuestra la reutilización de los nodos del servidor, códigos de estado 404 reales, un <code>base</code> distinto de la raíz, precarga en reposo que puedes observar en el panel de red, y un cargador cuyos datos se pasan del servidor al cliente para que la hidratación no vuelva a hacer fetch.</li>
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
      <p>Nuclo no tiene una API de valores calculados. Usa una función normal y llámala desde los valores dinámicos:</p>
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
      <p>Usa <code>async</code>/<code>await</code> normales, y llama a <code>update()</code> cada vez que el estado cambie. Para un fetch, eso significa una vez antes del <code>await</code> y otra después:</p>
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
        <li><strong>Agrupa los cambios.</strong> Cambia todo el estado que necesites y luego llama a <code>update()</code> una vez.</li>
        <li><strong>Mantén los valores dinámicos rápidos y puros.</strong> Todos se ejecutan en cada <code>update()</code>.</li>
        <li><strong>Usa <code>scope()</code></strong> para actualizaciones pequeñas y frecuentes, como la escritura o los temporizadores.</li>
        <li><strong>Renderiza dentro del documento.</strong> Los nodos que no están en el documento cuando se ejecuta <code>update()</code> dejan de actualizarse.</li>
        <li><strong>Usa <code>when()</code> y <code>list()</code></strong> para hijos que cambian, no una función que devuelve nodos.</li>
        <li><strong>Usa <code>className</code>, no <code>class</code></strong>, y usa <code>() =&gt; cx(...)</code> o <code>{ className: () =&gt; … }</code> para clases dinámicas.</li>
        <li><strong>Define los estilos una vez</strong>, a nivel de módulo.</li>
        <li><strong>Renderizado en el servidor:</strong> renderiza primero y luego pon <code>getCssText()</code> en <code>&lt;style id="nuclo-styles"&gt;</code>. Pasa los datos de la petición como argumentos, y conserva los comentarios HTML en la salida.</li>
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
      <p>Cada función pública, y de dónde viene.</p>
      <h3><code>nuclo</code> (globales y exportaciones con nombre)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: ejecuta todos los valores dinámicos, o los de los scopes indicados.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: da a un elemento ids de scope para <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: contenido condicional, con <code>.when()</code> y <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: una fila por elemento, emparejadas por identidad.</li>
        <li><a href="#api-region"><code>region(options)</code></a> e <a href="#api-region"><code>into(id, ...content)</code></a>: un lugar con nombre en el árbol, y contenido que lo rellena desde cualquier parte.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: un listener de eventos, o <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: construye y añade.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: toma el control del HTML del servidor.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: vuelve a llamar a los componentes y parchea el DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: clases generadas a partir de un objeto de estilo.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: combina estilos, gana el posterior.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> y <code>globalStyle</code> con tema.</li>
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
        <li><a href="#api-polyfill">Un import con efectos secundarios</a>, más <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> y las clases <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (paquete independiente)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: el router, con <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> y <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: una ruta cuyo cargador de datos empieza junto a su chunk.</li>
        <li><a href="#router-api">Tipos</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> y más.</li>
      </ul>
      <h3>Solo globales</h3>
      <ul>
        <li><a href="#tag-builders">175 funciones constructoras de etiquetas</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, y <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Tipos</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> y más. Los tipos de estilos como <code>StyleResult</code> también se pueden importar desde <code>'nuclo'</code>.</li>
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
      <p>No. El DOM se queda como está hasta que llamas a <code>update()</code>.</p>

      <h3>¿Nuclo usa señales, proxies o un DOM virtual?</h3>
      <p>No. El estado sigue siendo JavaScript plano. Cuando se renderiza un árbol, Nuclo crea elementos y nodos de texto reales. <code>update()</code> ejecuta todos los valores dinámicos registrados, o los que están dentro de los scopes indicados, y parchea esos mismos nodos donde un valor cambió. No hay grafo de dependencias ni árbol virtual.</p>

      <h3>¿Por qué mi página muestra "false"?</h3>
      <p>Los booleanos se renderizan como texto. <code>div(ok &amp;&amp; span('Done'))</code> muestra "false". Usa <code>when(() =&gt; ok, span('Done'))</code> para hijos, y <code>ok ? 'Done' : ''</code> para texto.</p>

      <h3>¿Por qué la fila de mi lista no cambia cuando edito el elemento?</h3>
      <p>Las filas de los elementos que siguen en la lista se conservan, no se renderizan de nuevo. Usa valores dinámicos como <code>() =&gt; todo.text</code> para los campos que cambian. Ver <a href="#api-list"><code>list()</code></a>.</p>

      <h3>¿Por qué una parte de mi interfaz deja de actualizarse?</h3>
      <p>Normalmente sus nodos no estaban en el documento cuando se ejecutó <code>update()</code>. Nuclo deja de rastrear esos nodos, incluso después de que los adjuntes, así que renderiza en un contenedor que esté en el documento. Otras dos causas: un <code>when()</code> cuya condición lanza un error deja de actualizarse, y una función de texto que lanza un error en su primera ejecución se queda vacía. Ver <a href="#api-update"><code>update()</code></a>.</p>

      <h3>¿Cuándo debo usar <code>forceUpdate()</code>?</h3>
      <p>Solo para cambios poco frecuentes en valores estáticos, como cambiar el idioma. Para todo lo demás, usa <code>update()</code>. Ver <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>¿Cómo coloco una página en un layout sin pasarla como prop?</h3>
      <p>Marca el lugar con <code>region({ id: 'main' })</code> y haz que la página devuelva <code>into('main', …)</code>. Ver <a href="#api-region"><code>region()</code> e <code>into()</code></a>.</p>

      <h3>¿Cómo desmonto una aplicación?</h3>
      <p>Envuélvela en <code>when()</code> y desactiva la condición. Eliminar el DOM por tu cuenta no ejecuta <code>onDestroy</code>. Ver <a href="#lifecycle">Ciclo de vida</a>.</p>

      <h3>¿Nuclo incluye un router?</h3>
      <p>No en el paquete principal. El enrutamiento se distribuye por separado como <code>nuclo-router</code>, con renderizado en el servidor, hidratación, rutas con code splitting y precarga en reposo. Instálalo con <code>npm install nuclo nuclo-router</code>. Ver <a href="#router-overview">nuclo-router</a>.</p>

      <h3>¿Nuclo tiene efectos?</h3>
      <p>No. <code>onMount</code> y <code>onDestroy</code> se ejecutan una vez por elemento, ligados a la inserción y la eliminación. Nada se vuelve a ejecutar porque haya cambiado algún estado.</p>
    `,
      },
    ],
  },

];
