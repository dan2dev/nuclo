import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "Styles",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>Transforme un objet de style typé en classes CSS générées. Passez le résultat à n'importe quel constructeur de balise. Dans le navigateur, les règles vont dans un seul élément <code>&lt;style id="nuclo-styles"&gt;</code>. Sur le serveur, <a href="#api-css-text"><code>getCssText()</code></a> les renvoie.</p>
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
        <li><code>css()</code> crée une classe pour les déclarations de base, plus une classe pour chaque clé pseudo, sélecteur et bloc media. La carte ci-dessus reçoit deux classes.</li>
        <li>Les noms de classe sont des hachages du contenu. Des styles identiques partagent une classe, et le serveur et le client produisent les mêmes noms.</li>
        <li>Définissez les styles une seule fois, au niveau du module. <code>css()</code> met en cache par objet, donc un nouvel objet à chaque appel est retraité chaque fois.</li>
        <li>Modifier un objet de style après l'avoir passé à <code>css()</code> n'a aucun effet.</li>
        <li>Chaque style reste enregistré pendant toute la vie de la page ou du processus serveur. Pour des valeurs qui changent par élément, comme une largeur issue de données, utilisez l'<a href="#attributes">attribut <code>style</code></a>.</li>
      </ul>
      <h3>Styles nommés</h3>
      <p>Passez un nom en premier pour obtenir un nom de classe lisible :</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>La classe de base est exactement le nom. Les autres blocs reçoivent <code>name-&lt;hash&gt;</code>.</li>
        <li>Le nom doit être un nom de classe valide. Sinon, Nuclo avertit et en génère un.</li>
        <li>Les noms sont globaux. Si deux styles différents utilisent le même nom, Nuclo avertit.</li>
      </ul>
      <h3>Utiliser le résultat</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> et <code>card.className</code> renvoient tous deux les noms de classe.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Objets de style",
        content: `
      <p>L'objet que vous passez à <code>css()</code> utilise les propriétés CSS courantes en camelCase, un ensemble de raccourcis, et des clés imbriquées pour les pseudo-états, les sélecteurs et les media queries. TypeScript les complète toutes. Les propriétés hors de l'ensemble typé, comme <code>borderTopLeftRadius</code>, <code>fill</code> ou <code>paddingInline</code>, vont dans <code>raw</code> (voir ci-dessous).</p>
      <h3>Valeurs</h3>
      <ul>
        <li>Les nombres deviennent des <code>px</code>, sauf <code>0</code> et les propriétés sans unité : <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> et <code>gridRow</code>. Dans <code>raw</code>, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> et <code>animation-iteration-count</code> sont aussi sans unité.</li>
        <li>Les chaînes sont utilisées telles quelles. <code>null</code>, <code>undefined</code> et <code>false</code> sont ignorés.</li>
        <li><code>lineHeight</code> (et <code>leading</code>) est sans unité, donc <code>leading: 24</code> signifie 24 fois la taille de police. Écrivez <code>"24px"</code> pour des pixels.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Raccourcis</h3>
      <table>
        <thead><tr><th>Clé</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, et chaque côté</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding gauche et droit / haut et bas</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>la même chose pour margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height, et leurs min et max</td></tr>
          <tr><td><code>size</code></td><td>width et height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Ces clés prennent <code>true</code> :</p>
      <table>
        <thead><tr><th>Clé</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (ne définit pas display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudo-états</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> et <code>firstLetter</code>. Ils s'imbriquent : <code>hover: { focus: {…} }</code> donne <code>:hover:focus</code>.</p>
      <h3>Sélecteurs et at-rules</h3>
      <p>Une clé qui commence par <code>&amp;</code> est un sélecteur, et chaque <code>&amp;</code> devient la classe. Une clé qui commence par <code>@</code> est une at-rule : <code>@media</code>, <code>@container</code> ou <code>@supports</code>.</p>
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
        <li>La clé doit commencer par <code>&amp;</code>. Une clé comme <code>".dark &amp;"</code> est ignorée, écrivez donc <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Deux blocs <code>@media</code> imbriqués se combinent avec <code>and</code>. Une requête menée par un type de média (<code>print</code>, <code>only screen</code>) est placée en premier, car la grammaire n'autorise un type qu'au début. Une paire qui ne peut pas être aplatie — deux types de média, ou un <code>not</code> en tête — avertit et utilise la requête interne seule. Toute autre at-rule imbriquée remplace l'externe.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Utilisez <code>raw</code> pour n'importe quelle propriété, avec le nom écrit exactement comme en CSS. Les nombres reçoivent toujours <code>px</code>, passez donc des chaînes :</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Toute autre clé plate est convertie en kebab-case et écrite telle quelle, donc une faute de frappe comme <code>colr: 'red'</code> devient une déclaration que le navigateur rejette. Un objet imbriqué sous une clé qui n'est ni un pseudo-état, ni un écran, ni une clé <code>&amp;</code> ou <code>@</code> est ignoré. TypeScript signale les deux cas.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Combine des styles. Quand deux entrées définissent la même propriété, la dernière l'emporte.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Les entrées falsy sont ignorées, les tableaux sont aplatis, et les chaînes sont découpées et dédoublonnées.</li>
        <li>Les classes générées pour le même bloc (base, même pseudo, même media query) fusionnent en une nouvelle classe. Les autres noms de classe passent inchangés.</li>
        <li>Seul <code>cx()</code> connaît l'ordre des arguments. Avec <code>div(base, blue)</code>, les deux classes sont ajoutées, et la règle créée en dernier l'emporte. Mettez les styles qui se surchargent dans un seul appel <code>cx()</code>.</li>
        <li>Quand le bloc d'un style nommé fusionne avec le bloc d'une autre entrée, la classe fusionnée est <code>name-&lt;hash&gt;</code>, pas le nom seul. Les blocs qui ne fusionnent pas gardent leur classe, donc <code>cx(pageTitle, 'extra')</code> contient toujours <code>page-title</code>.</li>
      </ul>
      <h3>Classes dynamiques</h3>
      <p>Passez une fonction qui renvoie toujours <code>cx(...)</code> :</p>
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
      <p>La fonction doit renvoyer un résultat de style dès sa première exécution. <code>() =&gt; active &amp;&amp; activeButton</code> affiche le texte "false" au lieu d'une classe.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Renvoie ses propres <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> et <code>globalStyle</code>, liés à un thème. Un thème donne des noms aux valeurs : avec le thème ci-dessous, <code>borderColor: 'border'</code> écrit <code>#e5e7eb</code>, et TypeScript complète les noms. Chaque entrée de <code>screens</code> devient une clé de style pour une media query, comme <code>md: {…}</code>.</p>
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
        <thead><tr><th>Clé du thème</th><th>Utilisée par</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> et chaque côté, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>de nouvelles clés de style, comme <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Un nom de thème n'est résolu que lorsqu'il constitue toute la valeur. <code>border: "1px solid primary"</code> n'est pas résolu.</li>
        <li>Une valeur d'écran sans <code>@</code> devient <code>@media &lt;value&gt;</code>. Une valeur qui commence par <code>@</code> est utilisée telle quelle, par exemple <code>"@container (min-width: 400px)"</code>.</li>
        <li>Les écrans n'existent que sur les instances créées avec <code>createCss()</code>. Le <code>css()</code> global n'en a pas, mais il accepte les clés <code>@media</code>.</li>
        <li>Toutes les instances et les helpers globaux partagent une seule feuille de style. Les règles media des écrans sont émises dans l'ordre de déclaration des écrans, pas dans l'ordre où vous les utilisez, listez donc les écrans <code>min-width</code> du plus petit au plus grand. Utilisez une seule instance <code>createCss()</code> par application, pour que cet ordre soit celui de votre thème.</li>
        <li><code>theme</code> sur le résultat est le thème que vous avez passé.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Construit une fonction qui renvoie un style pour un ensemble d'options, comme l'intention et la taille d'un bouton.</p>
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
        <li>Les styles fusionnent dans cet ordre : <code>base</code>, la valeur choisie de chaque groupe, puis chaque compound correspondant. Les styles suivants l'emportent propriété par propriété.</li>
        <li>Une option absente, <code>undefined</code> ou <code>null</code> utilise la valeur par défaut. Un groupe sans valeur par défaut est ignoré.</li>
        <li>Un groupe dont les seules clés sont <code>true</code> et <code>false</code> prend un booléen.</li>
        <li>Un compound s'applique quand chaque groupe qu'il liste correspond, valeurs par défaut incluses.</li>
        <li>Chaque sélection est construite une fois et mise en cache.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() & globalStyle()",
        content: `
      <p><code>keyframes()</code> enregistre une animation et renvoie son nom généré. Les clés d'étapes sont <code>from</code>, <code>to</code> et des pourcentages, comme <code>"50%"</code> ou <code>"0%, 100%"</code>. Les étapes n'acceptent que des propriétés plates. Des étapes identiques renvoient le même nom.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> ajoute une règle pour n'importe quel sélecteur :</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>Le sélecteur est utilisé exactement tel qu'écrit.</li>
        <li>Seules les propriétés plates fonctionnent. Les clés pseudo, les écrans et les clés <code>@</code> sont ignorés, donc <code>globalStyle()</code> ne peut pas écrire de règles media.</li>
        <li>La même règle n'est ajoutée qu'une fois. Un style différent pour le même sélecteur ajoute une seconde règle, et la dernière l'emporte.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() & resetStyles()",
        content: `
      <p><code>getCssText()</code> renvoie toutes les règles que <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> et <code>globalStyle()</code> ont créées dans ce processus : d'abord les règles de base, puis les blocs <code>@media</code>, <code>@container</code> et <code>@supports</code>. Utilisez-le pour le rendu côté serveur.</p>
      <ul>
        <li>Appelez-le après <code>renderToString()</code>. Les règles créées pendant le rendu sont incluses.</li>
        <li>Il couvre tout le processus, pas une page ou une requête, et il ne fait que grandir. C'est sans risque, car les noms de classe sont des hachages de contenu.</li>
        <li>Placez-le dans <code>&lt;style id="nuclo-styles"&gt;</code>. Le client réutilise cet élément et saute les règles qui s'y trouvent déjà. Avec un autre id, ou sans id, le client ajoute une seconde feuille de style avec toutes les règles à nouveau.</li>
        <li>Le texte n'est pas échappé, ne mettez donc jamais d'entrée non fiable dans des valeurs de style.</li>
      </ul>
      <p><code>resetStyles()</code> est un utilitaire de test. Il supprime toutes les règles et l'élément <code>#nuclo-styles</code>. Les styles créés auparavant gardent leurs noms de classe mais perdent leur CSS. Ne l'appelez pas dans une application ni sur un serveur.</p>
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
    title: "Routage",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>Paquet séparé :</strong> <code>nuclo-router</code> ne fait pas partie du paquet Nuclo de base. Installez-le à côté de <code>nuclo</code>. C'est une version preview, son API peut donc encore changer.</div>
      <p>Le routage pour Nuclo : rendu côté serveur, hydratation, routes découpées en chunks et préchargement à l'inactivité, construit sur <code>list()</code> et <code>update()</code>. Environ ${NUCLO_ROUTER_GZIP_KB} Ko gzippés, sans dépendance au-delà de Nuclo lui-même et sans effets de bord, donc il disparaît au tree-shaking quand il n'est pas utilisé.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Ou utilisez <code>pnpm add</code>, <code>yarn add</code> ou <code>bun add</code> avec les deux mêmes noms. Il requiert <code>nuclo</code> 0.3 ou plus récent comme peer dependency.</p>
      <p>Le routeur décide <em>quoi</em> charger. L'application dit <em>où</em> avec <code>router.outlet()</code> : un seul <code>list()</code> sur la pile de couches, une ligne par couche, donc une page ordinaire est une seule ligne. Le serveur et le client construisent le même arbre, donc <code>hydrate()</code> réclame les nœuds du serveur au lieu de les remplacer. Tout le reste, c'est <code>history</code>, un seul écouteur <code>click</code> délégué et <code>requestIdleCallback</code>.</p>
      <h3>Un seul import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> résout les modules de la route correspondante avant de rendre la main, donc le premier arbre est complet à la fois sur le serveur et sur le client. Ensuite, le routeur lit à travers la route qu'il a démarrée : <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
      <h3>Une application complète</h3>
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
      <p>C'est toute l'intégration. Les liens fonctionnent parce qu'un <code>&lt;a href&gt;</code> n'est qu'un <code>&lt;a href&gt;</code>. Un seul écouteur délégué sur <code>document</code> intercepte les liens que le routeur possède et laisse tous les autres au navigateur.</p>
      <p>Sur le serveur, <code>start()</code> renvoie une <code>Route</code> par requête et ne touche pas au routeur, donc des requêtes concurrentes ne peuvent pas voir la route l'une de l'autre. <code>route.run()</code> fait de cette Route celle que le routeur, et donc l'outlet, lit pendant toute la durée du rendu. Dans le navigateur, il y a une Route par chargement de page, et <code>start()</code> en fait celle du routeur. Aucun <code>run()</code> n'est nécessaire.</p>
      <p>Une page reçoit son <a href="#router-api"><code>RouteContext</code></a> et ses <a href="#router-api"><code>PageProps</code></a>, sous la forme <code>(ctx, { layer, data, outlet, beforeLeave })</code>, et peut prendre moins d'arguments. Elle renvoie tout ce que <code>list()</code> accepte. Pour remplir aussi une autre partie de la mise en page, renvoyez un <code>into()</code> depuis la page, par exemple <code>div(article(…), into('sidebar', nav(…)))</code>. Ce contenu part avec la page. Voir <a href="#router-regions">Pages &amp; Régions</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Motifs & Routes imbriquées",
        content: `
      <table>
        <thead><tr><th>Motif</th><th>Correspond à</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>exactement ce chemin</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>tout ce qui ne correspond à rien d'autre, votre 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>La priorité va aux motifs statiques, puis aux dynamiques dans l'ordre de déclaration, puis aux catch-all avec le préfixe le plus long en premier. Ainsi <code>'*'</code> ne correspond qu'à ce que rien d'autre ne capture et peut se trouver n'importe où dans la table. Les barres obliques finales, les barres obliques dupliquées et l'encodage pourcent sont normalisés, et les valeurs des paramètres arrivent décodées. La correspondance est une comparaison segment par segment pour chaque motif. Aucune expression régulière n'est construite ni exécutée.</p>
      <h3>Routes relatives</h3>
      <p>Un motif écrit avec <code>./</code> est relatif au parent qui le déclare, et un href écrit avec <code>./</code> est relatif à la route active. Ensemble, ils forment une section réutilisable qui signifie la même chose sous chaque parent. La valeur d'une table est soit un chargeur, soit une autre table, dont les clés lui sont relatives :</p>
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
      <p>Ces deux lignes produisent les six motifs sans écrire deux fois un chemin. Les deux parents reçoivent les mêmes objets chargeurs, donc ils partagent un seul cache de modules et un seul <code>import()</code>.</p>
      <ul>
        <li>Dans une table enfant, <code>'./x'</code>, <code>'/x'</code> et <code>'x'</code> signifient tous la même chose, <code>'/'</code> désigne le chemin du parent lui-même, et <code>'*rest'</code> donne à la section son propre catch-all. L'imbrication va aussi profond que vous le souhaitez.</li>
        <li>Les clés de premier niveau sont utilisées telles qu'écrites, donc <code>'*'</code> reste <code>'*'</code>.</li>
        <li>Un enfant sous un parent <code>*catch-all</code> est une erreur de <code>createRouter()</code>, puisqu'un catch-all doit terminer son motif.</li>
      </ul>
      <h3>Pages parentes et <code>outlet()</code></h3>
      <p>Un parent et ses enfants forment une vraie hiérarchie. Le parent est rendu, et son enfant est rendu à l'intérieur, à l'endroit où il appelle <code>outlet()</code> :</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Naviguer entre les enfants ne reconstruit pas le parent. Son nœud DOM est le même nœud, donc son focus, sa position de défilement, son champ à moitié saisi et tout état dans sa closure survivent.</p>
      <ul>
        <li>Une page sans route enfant ne rend rien depuis son outlet, donc une mise en page peut l'appeler sans condition. Un parent qui a un enfant et n'appelle jamais <code>outlet()</code> l'avale.</li>
        <li>Il n'y a pas de routes index. <code>'/'</code> est la mise en page elle-même, donc le chemin du parent rend la mise en page avec un outlet vide plutôt qu'une page index séparée à l'intérieur. Placez le contenu d'accueil dans la mise en page, ou donnez-lui un vrai chemin enfant.</li>
      </ul>
      <p>Le même appel fonctionne alors depuis l'un ou l'autre parent, et depuis une page qui ne sait pas dans lequel elle se trouve :</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> et <code>..</code> se résolvent par rapport au chemin de la route courante, pas au "répertoire" de l'URL. Depuis <code>/invoices/42</code>, <code>./preview</code> est <code>/invoices/42/preview</code>, là où un navigateur aurait dit <code>/invoices/preview</code>, et une barre oblique finale sur l'URL ne change rien. <code>../</code> remonte d'un segment et s'arrête à la racine. La query et le hash sont conservés, <code>base</code> est réajouté, et le chemin absolu résolu est ce qui entre dans l'historique. C'est la même déviation par rapport à la résolution d'URL que fait React Router pour <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Seuls <code>./</code> et <code>../</code> sont relatifs à la route. Un simple <code>preview</code> dans un href est laissé aux règles ordinaires du navigateur.</li>
        <li>Construisez les liens relatifs avec <code>router.href('./preview')</code> plutôt qu'en écrivant <code>href="./preview"</code> à la main. <code>href()</code> résout au moment du rendu, donc le balisage livré est absolu et reste correct pour un robot d'indexation, pour un clic du milieu et avec JavaScript désactivé.</li>
      </ul>
      <h3>Ce qui est conservé, et ce qui est reconstruit</h3>
      <table>
        <thead><tr><th>Nœud</th><th>À la navigation</th></tr></thead>
        <tbody>
          <tr><td>un parent dont le motif et le chemin sont inchangés</td><td><strong>conservé</strong> : même nœud, et son <code>load()</code> n'est pas relancé</td></tr>
          <tr><td>la page correspondante</td><td><strong>conservée</strong> quand son motif et son chemin sont inchangés et qu'elle n'a pas de <code>load()</code>, donc un changement de query ou de hash la garde. Une route avec un chargeur se rafraîchit à chaque visite.</td></tr>
          <tr><td>un parent dont le chemin a changé</td><td>reconstruit, avec tout ce qui se trouve en dessous</td></tr>
          <tr><td>une couche empilée</td><td>rend la page correspondante seule. Ses parents sont déjà montés dans la ligne en dessous.</td></tr>
        </tbody>
      </table>
      <p>Une page conservée garde le <code>ctx</code> avec lequel elle a été construite. C'est le sens de <code>ctx</code> partout : lisez <code>router.*</code> pour les valeurs en direct. L'état piloté par la query, comme les filtres, la pagination et les onglets, lit <code>router.search</code> dans une valeur dynamique et écrit avec <code>router.go('?page=2', { replace: true })</code>. La page, son focus et son champ à moitié saisi restent en place.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Pages & Régions",
        content: `
      <p><code>router.outlet()</code> place la page à un endroit. Une page qui a aussi besoin d'une barre latérale, d'une barre d'outils ou d'un titre ailleurs dans la mise en page le remplit avec <a href="#api-region"><code>into()</code></a>. La mise en page marque l'emplacement avec <code>region()</code>, et la page renvoie un <code>into()</code> à côté de son propre contenu. La mise en page ne reçoit jamais le contenu de la page en prop, et la navigation ne la reconstruit jamais.</p>
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
      <p>Le contenu de la page est une ligne du <code>list()</code> de l'outlet, et un <code>into()</code> vit aussi longtemps que la ligne qui le contient. Le contenu de la barre latérale arrive donc avec la page et part avec elle : naviguer vers une page sans <code>into('sidebar', …)</code> réaffiche le contenu <code>empty</code> de la région. La page peut utiliser son <code>ctx</code> et ses <code>data</code> pour les deux parties, puisque les deux sont construites par la même fonction.</p>
      <h3>Ce qui se passe à la navigation</h3>
      <ul>
        <li><strong>Une page conservée garde ses régions.</strong> Un changement de query ou de hash qui <a href="#router-patterns">garde la page</a> ne touche pas non plus au contenu des régions. Lisez <code>router.search</code> dans une valeur dynamique si la barre latérale en dépend.</li>
        <li><strong>Une page reconstruite les remplit à nouveau.</strong> Quand la route change, l'ancienne ligne est retirée et les vues <code>into()</code> de la nouvelle page prennent le relais. Rien ne reste derrière.</li>
        <li><strong>Une couche empilée ajoute une vue.</strong> La couche est une ligne ultérieure de l'outlet, donc son <code>into()</code> est une vue plus récente de la même région. Avec le <code>type: 'latest'</code> par défaut, elle recouvre la vue de la page jusqu'à la fermeture de la couche, puis la vue de la page réapparaît. Avec <code>type: 'stack'</code>, les deux s'affichent.</li>
        <li><strong>Une page parente peut aussi remplir des régions.</strong> Ses vues restent pendant que ses enfants changent, car le parent n'est pas reconstruit.</li>
        <li><strong>Le rendu côté serveur fonctionne tel quel.</strong> Le serveur construit la page dans <code>route.run()</code>, donc ses vues <code>into()</code> sont dans le HTML, et <code>hydrate()</code> les réclame.</li>
      </ul>
      <h3>Plusieurs régions depuis une page</h3>
      <p>Passez un objet pour remplir plusieurs régions à la fois. Le contenu principal de la page passe toujours par l'outlet, renvoyez-le donc à côté du <code>into()</code> :</p>
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
      <h3>Quel outil pour quelle tâche</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> est pour une route enfant : du contenu décidé par l'URL, rendu dans sa page parente. Voir <a href="#router-patterns">Routes imbriquées</a>.</li>
        <li><strong><code>into()</code></strong> est pour la page correspondante qui se déploie dans la mise en page. Le contenu appartient à la page et utilise ses données.</li>
        <li><strong><code>matches()</code></strong> est pour la mise en page qui décide à partir de l'URL seule, avec sa propre petite table et sans page impliquée. Voir <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Tout cela appartient à l'unique route correspondante. Le routeur ne pilote pas deux zones indépendantes depuis une seule URL, donc une barre latérale avec ses propres routes est une région qu'une page remplit, pas un second outlet. Une barre latérale qui veut vraiment son propre routeur, son chargement et son fallback en garde un non démarré et résout avec <code>match()</code> — voir <a href="#router-multi">Routeurs multiples &amp; Chargement combiné</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Chargeurs de route & Découpage du code",
        content: `
      <p>Un module de page peut exporter une fonction <code>load</code>. Elle s'exécute avant la construction de la page, à chaque navigation vers cette route, et ce qu'elle renvoie est transmis à la page en tant que <code>data</code> :</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>La table de routes est inchangée. Le chargeur voyage avec la page. Il reçoit le <code>RouteContext</code> correspondant, donc <code>params</code>, <code>search</code> et <code>path</code> sont tous disponibles. Il peut être synchrone ou asynchrone, et il s'exécute aussi sur le serveur, donc une page rendue côté serveur est livrée avec ses données déjà dans le HTML au lieu de les récupérer après l'hydratation.</p>
      <p><strong>Le module est mis en cache. Les données ne le sont pas.</strong> Le chunk d'une route est récupéré une fois et réutilisé, et son chargeur s'exécute à nouveau à chaque navigation. C'est pourquoi <code>/blog/a</code> et <code>/blog/b</code> ne peuvent pas être confondus, et pourquoi un chargeur en échec peut simplement être réessayé.</p>
      <table>
        <thead><tr><th>Situation</th><th>Comportement</th></tr></thead>
        <tbody>
          <tr><td>pendant son exécution</td><td><code>router.pending</code> est true et la page où vous étiez reste affichée</td></tr>
          <tr><td>il lève une exception ou rejette</td><td>atterrit dans <code>router.error</code>. <code>go()</code> ne rejette toujours jamais, et la navigation peut être réessayée.</td></tr>
          <tr><td>pendant <code>start()</code></td><td>le rejet sort de <code>start()</code>. Il n'y a pas encore de Route où le placer.</td></tr>
          <tr><td>une couche empilée</td><td>exécute son propre chargeur, avec ses propres données</td></tr>
          <tr><td>le préchargeur à l'inactivité</td><td>ne préchauffe que les modules. Il n'a pas de contexte à transmettre, et récupérerait des données pour une route que vous n'ouvrirez peut-être jamais.</td></tr>
          <tr><td>renaviguer vers la même URL</td><td>le chargeur s'exécute à nouveau et la ligne est reconstruite. Une route sans chargeur garde sa ligne.</td></tr>
        </tbody>
      </table>
      <p>Pour revalider, naviguez là où vous êtes déjà sans ajouter d'entrée d'historique :</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Démarrer les données avec le chunk</h3>
      <p>Un <code>load</code> exporté par le module de page ne peut s'exécuter qu'une fois ce module arrivé, donc une navigation à froid récupère le chunk, puis les données. Pour lancer les deux en même temps, déclarez le chargeur dans la table avec <code>withLoad()</code> :</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Il remplace le <code>load</code> propre au module et s'exécute à chaque visite comme lui. Un rejet pendant que le chunk est encore en cours de chargement atterrit dans <code>router.error</code> comme n'importe quel autre.</p>
      <p>Il n'y a pas de sérialisation des données serveur dans le HTML, par conception. Le <code>load</code> du client s'exécute à nouveau à l'hydratation. Si cela compte, faites émettre <code>route.data</code> par le serveur, par exemple sous la forme <code>window.__DATA__</code>, et faites-le lire en premier par le chargeur. <code>route.data</code> ne contient que les données de la page correspondante. Le résultat du <code>load()</code> d'un parent n'y figure pas.</p>
      <h3>Découpage du code et préchargement</h3>
      <p>La valeur d'une route est toujours une fonction qui renvoie le composant de page, donc le composant est atteint paresseusement :</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Seules les formes en module peuvent porter un export <code>load</code>. Choisir un composant nommé avec <code>.then(m =&gt; m.BPage)</code> ne remet au routeur que la fonction.</p>
      <p>Chaque module est importé une fois et mis en cache. Des navigations concurrentes vers la même route partagent un seul <code>import()</code>. Une fois que l'utilisateur a laissé la page tranquille pendant <code>idleTimeout</code> (une seconde par défaut ; ni tap, ni touche, ni molette, ni défilement), les routes restantes sont chargées en arrière-plan, une par tranche d'inactivité (<code>requestIdleCallback</code>). Toute saisie, ou une navigation que l'utilisateur attend, le met en pause jusqu'à ce que la page soit de nouveau inactive.</p>
      <p>Une route préchargée ou eager ne bascule jamais <code>router.pending</code> et atterrit avant la prochaine peinture : pas d'image de spinner, pas de décalage de mise en page. <code>router.pending</code> n'est true que pour un module ou un chargeur qu'il faut attendre, et la page sortante reste à l'écran pendant ce temps. Un chunk qui échoue au chargement apparaît dans <code>router.error</code>, jamais comme un rejet non géré, et peut simplement être réessayé.</p>
    `,
      },
      {
        id: "router-api",
        title: "API du routeur",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> associe un motif à un chargeur, ou à une table imbriquée. Options :</p>
      <table>
        <thead><tr><th>Option</th><th>Défaut</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>Préfixe d'URL sous lequel l'application est servie, comme <code>'/docs'</code>. Il ne correspond qu'à une frontière de segment : <code>/docs/intro</code> est dans <code>'/docs'</code>, <code>/docsearch</code> ne l'est pas. Les URL en dehors ne correspondent à rien, donc <code>start()</code> rejette (votre 404 côté serveur) et les liens vers elles sont laissés au navigateur.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Charger les modules des routes restantes en arrière-plan une fois la page inactive. <code>false</code> le désactive.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Millisecondes sans tap, touche, molette ni défilement avant que le préchargement démarre, ou reprenne après une activité de l'utilisateur.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, appelé après chaque navigation résolue dans le navigateur, y compris la première, une fois le DOM à jour. <code>kind</code> vaut <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Précédent, Suivant, <code>close()</code>) ou <code>'layer'</code>. Le point d'accroche pour <code>document.title</code>, les balises meta, le focus, le défilement et l'analytique. Jamais appelé pendant le SSR.</td></tr>
        </tbody>
      </table>
      <p>Renvoie le routeur : <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, et chaque membre de <code>Route</code> sauf <code>run()</code>, lus à travers la Route active. C'est celle que le dernier <code>start()</code> a renvoyée dans le navigateur, ou celle dont le <code>run()</code> s'exécute sur le serveur. Lire un membre sans l'une ni l'autre lève une exception. La table de routes, le matcher compilé et le cache de modules vivent sur le routeur, donc ils sont partagés entre les requêtes sur un serveur.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Résout <code>url</code> (par défaut : <code>location.href</code> dans le navigateur) vers ses modules de page et renvoie une <code>Promise&lt;Route&gt;</code>. Rejette quand rien ne correspond et que la table n'a pas de route <code>'*'</code>. Sur un serveur, c'est votre 404. Dans le navigateur, il fait aussi de la Route celle active du routeur, attache les écouteurs <code>popstate</code> et <code>click</code> délégué et planifie le préchargement. Un second <code>start()</code> retire la Route précédente pour vous. Sur le serveur, il ne touche à rien de partagé, rendez donc dans <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Résout une URL contre la table sans rien charger : pas d'import, pas d'historique, pas d'écouteurs, pas de Route. Renvoie un <code>RouteContext</code>, ou <code>null</code> quand l'URL est en dehors de <code>base</code>, ne correspond à aucun motif ou, dans le navigateur, est sur une autre origine. URL absolues seulement, puisque la résolution de <code>./</code> nécessite une route active.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Les pages de la route active sous forme de <code>list()</code>. Placez-le une fois, là où vont les pages. Une couche empilée en est une ligne ultérieure. Il est vide avant que <code>start()</code> se résolve et après <code>stop()</code>. Sur le serveur, il rend la Route dont le <code>run()</code> s'exécute.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Rend la vue d'une seconde table à laquelle correspond le chemin de la route active, sous forme de <code>list()</code> que vous placez n'importe où. Voir <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Chaque membre sauf <code>run()</code> est aussi sur le routeur, qui est là où une application le lit.</p>
      <table>
        <thead><tr><th>Membre</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>la correspondance active. <code>search</code> est un <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> et <code>url</code> sont en direct.</td></tr>
          <tr><td><code>pending</code></td><td>une navigation attend un module ou un chargeur</td></tr>
          <tr><td><code>error</code></td><td>le dernier chargement en échec, effacé par la navigation suivante</td></tr>
          <tr><td><code>data</code></td><td>ce que le <code>load()</code> de la page correspondante a renvoyé, pour qu'un serveur le sérialise. Celui d'un parent n'y figure pas.</td></tr>
          <tr><td><code>depth</code></td><td>le nombre de couches sur la pile (1 pour une page ordinaire)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>naviguer, en chargeant le module si nécessaire. Ne rejette jamais : un module qui échoue, en rejetant ou en levant une exception, atterrit dans <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>ouvrir une route comme nouvelle couche au-dessus, résolue avec ce avec quoi elle se ferme. Accepte <code>./</code>. Rejette en l'absence de correspondance ou si le module échoue.</td></tr>
          <tr><td><code>href(path)</code></td><td>préfixer un chemin avec <code>base</code>, pour <code>a({ href })</code>. Résout <code>./</code> et <code>../</code> par rapport à la route active.</td></tr>
          <tr><td><code>stop()</code></td><td>détacher tous les écouteurs, fermer les couches ouvertes, vider l'outlet. Idempotent. Une Route arrêtée répond toujours avec sa dernière correspondance, et <code>go()</code> ne fait rien.</td></tr>
          <tr><td><code>run(fn)</code></td><td>appeler <code>fn</code> avec cette Route comme Route active du routeur et renvoyer son résultat : <code>route.run(() =&gt; renderToString(App))</code> sur le serveur. Synchrone seulement. La Route cesse d'être active quand <code>fn</code> rend la main.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Le premier argument d'une page : <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. C'est le contexte avec lequel la page a été construite. Lisez <code>router.*</code> pour les valeurs en direct. Ils ne diffèrent que lorsque la query ou le hash a changé sans reconstruction.</p>
      <p><code>params</code> est <code>{ [name]: string }</code> par défaut. Une page peut le typer à partir de son propre motif avec <code>Params</code>, qui transforme <code>'/blog/:slug'</code> en <code>{ slug: string }</code> et <code>'/files/*rest'</code> en <code>{ rest: string }</code> :</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>Le second argument d'une page. Déstructurez ce dont la page a besoin.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>où la page se situe dans la pile. Voir <code>Layer</code> ci-dessous.</td></tr>
          <tr><td><code>data</code></td><td>ce que le <code>load()</code> de la route a renvoyé, ou <code>undefined</code> sans chargeur. Typé par <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>où une page parente rend sa route enfant. Voir <a href="#router-patterns">Routes imbriquées</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>enregistre une garde consultée avant que cette page soit abandonnée. Voir <a href="#router-layers">Gardes de sortie</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Où une page se situe dans la pile, et sa porte de sortie.</p>
      <table>
        <thead><tr><th>Membre</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 pour la page de base, 1 et plus pour les couches empilées</td></tr>
          <tr><td><code>push(href)</code></td><td>ouvrir une autre couche depuis une page, comme <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>fermer cette couche et tout ce qui est au-dessus, en résolvant le <code>push()</code> qui l'a ouverte. Sans argument, elle est considérée comme annulée. Sans effet à la profondeur 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> et <code>withLoad()</code></h3>
      <p><code>DataLoader</code> est <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, l'export <code>load</code> optionnel d'un module de page. <code>withLoad(loader, load)</code> crée une route dont le <code>load</code> démarre en même temps que l'import de son chunk plutôt qu'après. Voir <a href="#router-loaders">Chargeurs de route</a>.</p>
      <h3>Types</h3>
      <p>Chaque type est un export nommé de <code>nuclo-router</code>, donc une page, un chargeur ou une garde peuvent être typés sans importer depuis un chemin.</p>
      <table>
        <thead><tr><th>Type</th><th>Ce que c'est</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>l'objet params pour un motif. <code>RouteParams</code> est la forme non typée, et <code>Match</code> est le résultat du matcher.</td></tr>
          <tr><td><code>PageComponent</code></td><td>une page : <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>un module de page : le composant lui-même, ou <code>{ default, load? }</code> tel que <code>import()</code> le produit</td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, portant éventuellement un <code>load</code> issu de <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>la table que <code>createRouter()</code> prend : motif vers chargeur, ou vers une table imbriquée</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, le second argument de <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, le second argument de <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>le type de <code>outlet()</code> dans <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, ce que <code>beforeLeave()</code> prend</td></tr>
          <tr><td><code>MatchView</code></td><td>ce qu'est une vue de <code>matches()</code> : des params en entrée, du contenu ou l'<code>import()</code> d'une page en sortie</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Couches & Gardes de sortie",
        content: `
      <p><code>push()</code> ouvre une route au-dessus de la route courante au lieu de la remplacer, et se résout avec ce avec quoi cette couche se ferme. Comme les pages sont un seul <code>list()</code> sur la pile, ouvrir une couche est un ajout en fin de liste. La page en dessous n'est pas rendue à nouveau, donc son DOM, son focus et son formulaire à moitié rempli sont toujours là quand la couche se ferme.</p>
      <p>Cela fait fonctionner le flux "j'ai besoin d'un enregistrement qui n'existe pas encore" sans jeter le formulaire que l'utilisateur remplissait :</p>
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
      <p>Les couches s'imbriquent. Une boîte de dialogue qui a besoin de sa propre boîte de dialogue appelle <code>layer.push()</code> et l'attend, sans référence à la Route.</p>
      <ul>
        <li><strong>L'URL est la couche du dessus.</strong> <code>push()</code> ajoute une entrée d'historique, donc une couche est liable et Précédent la ferme, en résolvant son <code>push()</code> comme annulé, exactement comme Annuler. Précédent et <code>close()</code> suivent un seul chemin de code : <code>close()</code> enregistre son résultat et recule dans l'historique, et la profondeur dans <code>history.state</code> fait autorité. Les navigateurs gardent environ 50 entrées par onglet, donc après un long parcours à travers des couches, l'entrée en dessous peut avoir disparu : <code>close()</code> ferme alors les couches sur place et réécrit l'entrée courante vers la page restée affichée.</li>
        <li><strong>Une navigation ordinaire vide la pile.</strong> Un clic sur un lien ou <code>go()</code> n'est pas une couche. Il remplace tout et annule toutes les couches ouvertes, donc aucun appelant ne reste en attente.</li>
        <li><strong>Un chargement à froid est une page autonome.</strong> L'URL nomme la couche du dessus mais pas la pile en dessous, donc ouvrir directement l'URL d'une couche la rend à la profondeur 1 avec <code>layer.depth === 0</code> et un <code>close()</code> inerte. Une route empilée doit avoir un sens par elle-même. Testez <code>layer.depth</code> pour proposer un lien de sortie plutôt qu'un bouton Annuler mort.</li>
        <li><strong>La promesse ne peut pas survivre à un rechargement</strong>, car elle vit dans une closure. Traitez le résultat comme un raccourci à travers un flux qui fonctionne aussi par le chemin long.</li>
        <li><strong>Rien ne reste en attente.</strong> <code>stop()</code> annule toutes les couches ouvertes, et une couche abandonnée par une navigation se résout avec <code>undefined</code>.</li>
      </ul>
      <h3>Gardes de sortie</h3>
      <p>Une page qui détient quelque chose qui mérite d'être conservé, comme un formulaire à moitié rempli, enregistre une garde. Elle est consultée avant que la page soit abandonnée, et renvoyer <code>false</code> (ou une promesse de <code>false</code>) garde la page :</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Seulement quand la page part.</strong> Une navigation enfant sous une mise en page, ou un changement de query ou de hash qui garde la page, ne consulte pas la garde. Une garde vit et meurt avec sa page, il n'y a donc rien à désenregistrer.</li>
        <li><strong>Toutes les sorties.</strong> Un lien, <code>go()</code>, Précédent et Suivant, le <code>close()</code> d'une couche, et <code>go()</code> vers une URL que le routeur ne possède pas (quitter l'application, où <code>to</code> vaut <code>null</code>). Un Précédent ou Suivant refusé est annulé, donc la barre d'adresse reste sur la page. Fermer l'onglet ou recharger est le travail de <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> est le <code>RouteContext</code> vers lequel la navigation se dirige. Les gardes s'exécutent de la plus interne à la plus externe et s'arrêtent au premier refus. Une garde qui lève une exception garde la page. <code>close(result)</code> passe aussi par la garde, remettez donc votre indicateur à zéro avant de fermer avec un résultat.</li>
        <li>Le routeur ne peut reculer que sur les entrées d'historique qu'il a écrites. Un Précédent ou Suivant vers une entrée qu'il n'a pas écrite, comme un lien <code>#fragment</code> natif ou le <code>pushState</code> d'un autre script, n'est pas soumis à la garde.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() & Sous-routeurs",
        content: `
      <p><code>router.outlet()</code> rend la page. <code>router.matches(table)</code> rend autre chose qui dépend de l'endroit où vous êtes, comme une barre latérale, un fil d'Ariane ou une barre d'outils, à partir de sa propre petite table, sans charger de route ni ajouter de page :</p>
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
        <li><strong>Même correspondance que la table de routes.</strong> Les motifs, la priorité, la correspondance sur le chemin brut et le retrait de <code>base</code> sont ceux du routeur, donc une vue et une page sont toujours d'accord sur l'URL. Elle lit le chemin de la couche du dessus, comme <code>router.path</code>.</li>
        <li><strong>Une vue</strong> est <code>(params, ctx) =&gt; content</code>, où <code>params</code> est typé à partir de son motif et <code>ctx</code> est le <code>RouteContext</code> avec le <code>pattern</code> et les <code>params</code> de la vue. Elle peut à la place renvoyer l'<code>import()</code> d'un module de page, qui est appelé avec <code>ctx</code> une fois arrivé.</li>
        <li><strong>Rien ne correspond, rien n'est rendu.</strong> Ajoutez une vue <code>'*'</code> comme fallback. Elle est vide avant <code>start()</code> et après <code>stop()</code>, comme l'outlet.</li>
        <li><strong>Elle n'est rendue à nouveau que lorsque la route change</strong>, donc une vue garde son DOM à travers tout ce qui garde la page.</li>
        <li><strong>Une vue paresseuse ne rend rien tant que son module n'est pas arrivé.</strong> Un <code>import()</code> en échec est journalisé avec <code>console.error</code>, ne définit pas <code>router.error</code>, et est réessayé à la navigation suivante. Un simple <code>update()</code> ne réessaie pas.</li>
        <li><strong>Sur le serveur</strong>, une vue paresseuse n'envoie rien, puisque son module arrive côté client. Utilisez une vue synchrone pour tout ce que le premier HTML doit contenir.</li>
      </ul>
      <h3>Sous-routeurs</h3>
      <p>Les routes s'imbriquent, donc un sous-routeur n'est en général qu'une table imbriquée. Un seul routeur : la page <code>'/'</code> propre à la section est son habillage, et ses enfants sont rendus dans le <code>outlet()</code> de cette page, donc l'habillage survit à la navigation à l'intérieur de la section :</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Ou donnez à la fonctionnalité un routeur à elle, créé mais jamais démarré. Le parent possède une seule entrée catch-all et l'enfant résout la fin du chemin contre ses propres motifs, params et fallback :</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Ne jamais le démarrer est tout l'intérêt. C'est <code>start()</code> qui attache les écouteurs, et deux routeurs démarrés entrent en conflit. La contrepartie est que l'enfant possède la résolution, donc les chargeurs de route, qu'un routeur démarré exécute, sont à vous d'appeler. Cette forme reconstruit aussi l'habillage quand la fin du chemin change, car le routeur voit une seule route et l'habillage résout le reste lui-même. Une table imbriquée est ce qui vous donne un parent que le routeur garde monté, préférez-la donc à moins que la fonctionnalité ait vraiment besoin de son propre routeur, de sa base et de son fallback.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Routeurs multiples & Chargement combiné",
        content: `
      <p>Une application peut avoir autant de routeurs que de zones. La règle qui garde cela simple : <strong>démarrez-en exactement un par document</strong>, et laissez tous les autres routeurs non démarrés, en résolvant les URL avec <code>match()</code>. Seul le routeur démarré possède l'URL, l'historique et l'écouteur de clic. Les autres sont des tables que vous interrogez — et chaque zone peut charger à son propre rythme, avec son propre spinner.</p>
      <h3>Chargement combiné : une chaîne de chargeurs</h3>
      <p>Chaque page d'une chaîne correspondante peut exporter <code>load()</code>. Lors d'une navigation à froid vers une route enfant, le chargeur de la mise en page et celui de la page s'exécutent <strong>en parallèle</strong>, et un seul <code>router.pending</code> couvre toute la chaîne : la page précédente reste à l'écran jusqu'à ce que les deux se résolvent, donc un arbre à moitié chargé n'est jamais peint. Chaque composant reçoit ses propres <code>data</code> :</p>
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
      <p>Les deux chargeurs démarrent ensemble, pas l'un après l'autre. <code>router.pending</code> est true tant que l'un des deux est attendu, et false le reste du temps — une route préchargée ou eager ne le bascule jamais. Passer d'une section à l'autre garde la mise en page, donc seul le chargeur de la section s'exécute à nouveau ; les données de la mise en page, son DOM et un champ à moitié saisi survivent tous. Renaviguer vers la même URL relance le chargeur de la feuille et reconstruit sa ligne, exactement comme avec une page seule.</p>
      <h3>Chargement multiple : un second routeur avec son propre spinner</h3>
      <p>Une zone indépendante — une barre latérale, un tiroir, une région live — reçoit son propre routeur, créé mais jamais démarré, et son propre indicateur de chargement. <code>router.pending</code> appartient au routeur démarré et ne dit rien de cette zone, donc les deux peuvent charger côte à côte et l'un ou l'autre peut finir en premier :</p>
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
      <p>Le second routeur est interrogé, jamais commandé : <code>match()</code> lit l'URL et renvoie un contexte, et rien concernant la barre latérale n'entre jamais dans la table de routes principale. <code>onNavigate</code> s'exécute après chaque navigation résolue, la première incluse, c'est donc l'endroit unique qui garde une zone indépendante en phase avec l'URL.</p>
      <ul>
        <li><strong><code>pending</code> appartient au routeur démarré.</strong> Un routeur jamais démarré n'a ni Route, ni <code>pending</code>, ni <code>error</code>. La zone suit ses propres indicateurs, et un second spinner peut se placer à côté du premier. Dans la démo, la barre latérale charge pendant 800 ms tandis que les chargeurs de la route tournent pendant 900 ms, donc la page peut finir avant la barre latérale ou l'inverse.</li>
        <li><strong><code>match()</code> n'attache rien.</strong> N'importe quel nombre de routeurs non démarrés peuvent partager le document ; chacun a sa propre table, sa base et son cache de modules, et aucun ne touche à l'historique. Ils coûtent une table et un matcher.</li>
        <li><strong>Ses chargeurs ne s'exécutent jamais.</strong> Le routeur démarré exécute le <code>load()</code> des pages qu'il fait correspondre. Un routeur jamais démarré ne fait que résoudre, donc si ses vues ont besoin de données, récupérez-les vous-même — le <code>refreshSidebar()</code> de la démo. Si vous voulez des chargeurs, une <a href="#router-matches">table imbriquée</a> ou une <a href="#router-regions">région qu'une page remplit</a> laisse ce travail au routeur démarré.</li>
        <li><strong>Protégez-vous des réponses obsolètes.</strong> Une récupération lente de la barre latérale ne doit pas atterrir sur la section que vous avez quittée. Incrémentez un compteur de génération à chaque rafraîchissement et ignorez les réponses qui ne correspondent plus, comme le routeur lui-même retire les navigations dépassées.</li>
        <li><strong>Une vue <code>matches()</code> paresseuse n'a pas de <code>pending</code> non plus.</strong> Elle ne rend rien tant que son module n'est pas arrivé. Trois systèmes de chargement, trois horloges indépendantes : le <code>pending</code> de la route, vos propres indicateurs, et une vue paresseuse qui n'est simplement pas encore là.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Gestion des liens",
        content: `
      <p>L'écouteur délégué navigue sur un clic gauche sur un <code>&lt;a href&gt;</code>, y compris un <code>&lt;a&gt;</code> SVG et les clics sur tout ce qui est imbriqué dedans, et s'efface pour tout le reste : clics avec modificateur et clics du milieu, un <code>target</code> autre que <code>_self</code>, <code>download</code>, <code>rel="external"</code>, les hrefs d'une autre origine, les liens vers un simple hash sur la page courante, les chemins hors de <code>base</code>, les chemins qu'aucune route ne fait correspondre (donc une 404 rendue côté serveur reste accessible), et tout événement sur lequel un gestionnaire de l'application a déjà appelé <code>preventDefault()</code>. Excluez explicitement un lien avec <code>data-nuclo-router="off"</code>.</p>
      <h3>Défilement</h3>
      <p>Une navigation par push préserve la position de défilement courante. Quand la nouvelle URL a un <code>#hash</code> correspondant à un élément de la page, cet élément est amené dans la zone visible. <code>popstate</code> laisse le défilement au navigateur. Pour faire atterrir les nouvelles pages en haut, faites-le dans <code>onNavigate</code>, qui indique comment la navigation s'est produite :</p>
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
      <h3>Notes</h3>
      <ul>
        <li><strong>Rien n'est retenu.</strong> La Route détient la fonction de page et son contexte, jamais de DOM. Naviguer ailleurs libère la page précédente. <code>stop()</code> libère les écouteurs et tout chargement en cours, et efface <code>pending</code>, donc une Route retirée ne laisse jamais un spinner orphelin. Un module qui se résout après <code>stop()</code> est ignoré silencieusement.</li>
        <li><strong>Sûr en concurrence sur le serveur.</strong> <code>start()</code> renvoie un état par requête et <code>run()</code> le limite à un rendu synchrone, donc des requêtes entrelacées ne peuvent pas voir la route l'une de l'autre. Seul le cache de modules est partagé. La portée se termine quand la fonction de <code>run()</code> rend la main. <code>renderToString()</code> est synchrone, donc cela suffit. Un rendu asynchrone ou en streaming devrait transporter la Route à travers les <code>await</code>, ce que <code>run()</code> ne fait pas.</li>
        <li><strong>La restauration du défilement sur <code>popstate</code></strong> est celle du navigateur (<code>scrollRestoration</code>), pas celle du routeur.</li>
        <li><strong>Démarrez un routeur par document.</strong> Chaque <code>start()</code> ajoute son propre écouteur <code>click</code> délégué, et le <code>start()</code> d'un second routeur ne retire pas le premier. Seul un second <code>start()</code> sur le même routeur le fait. Pour résoudre une URL contre une autre table, créez un routeur et n'appelez que <code>match()</code>. Il n'attache rien. Une zone indépendante peut ainsi mener son propre chargement à côté du <code>pending</code> de la route. Voir <a href="#router-multi">Routeurs multiples &amp; Chargement combiné</a>.</li>
        <li><strong>Non inclus, par conception :</strong> l'historique par hash et en mémoire, puisque la route vit dans le pathname et qu'un serveur doit servir chaque route ; deux zones routées indépendamment pilotées par une seule URL, puisqu'une page peut remplir plusieurs régions avec <code>into()</code> mais qu'elles appartiennent toutes à l'unique route correspondante — une zone indépendante peut toujours garder son propre routeur non démarré et son chargement, comme dans <a href="#router-multi">Routeurs multiples &amp; Chargement combiné</a> ; et le préchargement au survol, que vous obtenez en appelant le chargeur de la route depuis un <code>mouseenter</code>.</li>
      </ul>
      <h3>Exemples</h3>
      <p>Deux exemples exécutables dans le dépôt se complètent, de sorte que chaque réglage est observable quelque part :</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a> : un tour côté client de toute l'API. Chaque forme de motif et règle de priorité, les exclusions de la gestion des liens, chaque membre de Route avec des contrôles en direct, un sous-routeur, la pile de couches sur trois niveaux, une section relative montée sous deux parents, et des chargeurs de route avec <code>pending</code> et <code>error</code>. Définit <code>preload: false</code> pour que ces états restent visibles.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a> : <code>renderToString()</code> par requête, une hydratation qui réclame de manière vérifiable les nœuds du serveur, de vrais codes de statut 404, une <code>base</code> non racine, un préchargement à l'inactivité observable dans le panneau réseau, et un chargeur dont les données passent du serveur au client pour que l'hydratation ne refasse pas la requête.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "Modèles",
    sections: [
      {
        id: "computed",
        title: "Valeurs calculées",
        content: `
      <p>Nuclo n'a pas d'API de valeurs calculées. Utilisez une simple fonction, et appelez-la depuis les valeurs dynamiques :</p>
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
        title: "Asynchrone & Chargement",
        content: `
      <p>Utilisez simplement <code>async</code>/<code>await</code>, et appelez <code>update()</code> chaque fois que l'état change. Pour un fetch, cela signifie une fois avant l'<code>await</code> et une fois après :</p>
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
        title: "Bonnes pratiques",
        content: `
      <ul>
        <li><strong>Regroupez les changements.</strong> Modifiez tout l'état nécessaire, puis appelez <code>update()</code> une seule fois.</li>
        <li><strong>Gardez les valeurs dynamiques rapides et pures.</strong> Elles s'exécutent toutes à chaque <code>update()</code>.</li>
        <li><strong>Utilisez <code>scope()</code></strong> pour les petites mises à jour fréquentes, comme la saisie ou les minuteurs.</li>
        <li><strong>Rendez dans le document.</strong> Les nœuds qui ne sont pas dans le document quand <code>update()</code> s'exécute cessent d'être mis à jour.</li>
        <li><strong>Utilisez <code>when()</code> et <code>list()</code></strong> pour les enfants qui changent, pas une fonction qui renvoie des nœuds.</li>
        <li><strong>Utilisez <code>className</code>, pas <code>class</code></strong>, et utilisez <code>() =&gt; cx(...)</code> ou <code>{ className: () =&gt; … }</code> pour les classes dynamiques.</li>
        <li><strong>Définissez les styles une seule fois</strong>, au niveau du module.</li>
        <li><strong>Rendu côté serveur :</strong> rendez d'abord, puis placez <code>getCssText()</code> dans <code>&lt;style id="nuclo-styles"&gt;</code>. Passez les données de la requête en arguments, et conservez les commentaires HTML dans la sortie.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "Référence",
    sections: [
      {
        id: "api-index",
        title: "Index de l'API",
        content: `
      <p>Chaque fonction publique, et d'où elle vient.</p>
      <h3><code>nuclo</code> (global et export nommé)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a> : exécuter toutes les valeurs dynamiques, ou celles des scopes donnés.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a> : donner à un élément des ids de scope pour <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a> : contenu conditionnel, avec <code>.when()</code> et <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a> : une ligne par élément, appariée par identité.</li>
        <li><a href="#api-region"><code>region(options)</code></a> et <a href="#api-region"><code>into(id, ...content)</code></a> : un emplacement nommé dans l'arbre, et du contenu qui le remplit depuis n'importe où.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a> : un écouteur d'événement, ou <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a> : construire et ajouter.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a> : reprendre le HTML du serveur.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a> : appeler à nouveau les composants et corriger le DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a> : classes générées à partir d'un objet de style.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a> : combiner des styles, le dernier l'emporte.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a> : <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> et <code>globalStyle</code> liés à un thème.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a> : des styles à partir d'options.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> et <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (export nommé seulement)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> et <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> et <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">Un import à effet de bord</a>, plus <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> et les classes <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (paquet séparé)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a> : le routeur, avec <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> et <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a> : une route dont le chargeur de données démarre en même temps que son chunk.</li>
        <li><a href="#router-api">Types</a> : <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> et plus.</li>
      </ul>
      <h3>Globaux seulement</h3>
      <ul>
        <li><a href="#tag-builders">175 constructeurs de balises</a> : <code>div</code>, <code>span</code>, …, <code>var_</code>, et <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Types</a> : <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> et plus. Les types de style comme <code>StyleResult</code> peuvent aussi être importés depuis <code>'nuclo'</code>.</li>
      </ul>
      <h3>Clés spéciales</h3>
      <ul>
        <li><a href="#attributes">Attributs</a> : <code>className</code>, <code>style</code>, <a href="#events">gestionnaires <code>on*</code></a>, <a href="#lifecycle"><code>onMount</code> et <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Objets de style</a> : raccourcis, pseudo-états, sélecteurs <code>&amp;</code>, règles <code>@</code> et <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Questions fréquentes",
        content: `
      <h3>Changer l'état met-il à jour l'interface ?</h3>
      <p>Non. Le DOM reste tel qu'il est jusqu'à ce que vous appeliez <code>update()</code>.</p>

      <h3>Nuclo utilise-t-il des signaux, des proxies ou un DOM virtuel ?</h3>
      <p>Non. L'état reste du JavaScript ordinaire. Quand un arbre est rendu, Nuclo crée de vrais éléments et nœuds texte. <code>update()</code> exécute chaque valeur dynamique enregistrée, ou celles des scopes donnés, et corrige ces mêmes nœuds là où une valeur a changé. Il n'y a ni graphe de dépendances ni arbre virtuel.</p>

      <h3>Pourquoi ma page affiche-t-elle "false" ?</h3>
      <p>Les booléens sont rendus comme du texte. <code>div(ok &amp;&amp; span('Done'))</code> affiche "false". Utilisez <code>when(() =&gt; ok, span('Done'))</code> pour les enfants, et <code>ok ? 'Done' : ''</code> pour le texte.</p>

      <h3>Pourquoi ma ligne de liste ne change-t-elle pas quand je modifie l'élément ?</h3>
      <p>Les lignes des éléments encore présents dans la liste sont conservées, pas rendues à nouveau. Utilisez des valeurs dynamiques comme <code>() =&gt; todo.text</code> pour les champs qui changent. Voir <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Pourquoi une partie de mon interface cesse-t-elle de se mettre à jour ?</h3>
      <p>En général, ses nœuds n'étaient pas dans le document quand <code>update()</code> s'est exécuté. Nuclo cesse de suivre ces nœuds, même après que vous les avez attachés, rendez donc dans un conteneur qui est dans le document. Deux autres causes : un <code>when()</code> dont la condition lève une exception cesse de se mettre à jour, et une fonction texte qui lève une exception à sa première exécution reste vide. Voir <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Quand utiliser <code>forceUpdate()</code> ?</h3>
      <p>Seulement pour des changements rares de valeurs statiques, comme changer de langue. Pour tout le reste, utilisez <code>update()</code>. Voir <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Comment placer une page dans une mise en page sans la passer en prop ?</h3>
      <p>Marquez l'emplacement avec <code>region({ id: 'main' })</code> et faites renvoyer <code>into('main', …)</code> par la page. Voir <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Comment démonter une application ?</h3>
      <p>Enveloppez-la dans <code>when()</code> et passez la condition à faux. Retirer le DOM vous-même n'exécute pas <code>onDestroy</code>. Voir <a href="#lifecycle">Cycle de vie</a>.</p>

      <h3>Nuclo inclut-il un routeur ?</h3>
      <p>Pas dans le paquet de base. Le routage est livré séparément sous le nom <code>nuclo-router</code>, avec rendu côté serveur, hydratation, routes découpées en chunks et préchargement à l'inactivité. Installez-le avec <code>npm install nuclo nuclo-router</code>. Voir <a href="#router-overview">nuclo-router</a>.</p>

      <h3>Nuclo a-t-il des effets ?</h3>
      <p>Non. <code>onMount</code> et <code>onDestroy</code> s'exécutent une fois par élément, liés à l'insertion et au retrait. Rien ne s'exécute à nouveau parce qu'un état a changé.</p>
    `,
      },
    ],
  },

];
