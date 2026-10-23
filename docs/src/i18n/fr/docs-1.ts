import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "Introduction",
    sections: [
      {
        id: "overview",
        title: "Vue d'ensemble",
        content: `
      <p>Nuclo est une petite bibliothèque DOM pour TypeScript. Vous construisez la page avec de simples fonctions comme <code>div()</code> ou <code>button()</code>, vous gardez votre état dans des variables ordinaires, et vous appelez <code>update()</code> dès que la page doit changer.</p>
      <p>Nuclo n'a ni DOM virtuel, ni compilateur, ni proxies, ni signaux.</p>
      <p><strong>Statut : alpha.</strong> Nuclo n'a pas encore atteint la version 1.0, son API peut donc encore changer d'une version à l'autre. Fixez la version que vous installez et testez votre application avant de mettre à jour.</p>
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
      <h3>Le modèle mental</h3>
      <ol>
        <li>Construisez l'interface avec des constructeurs de balises.</li>
        <li>Pour chaque valeur qui dépend de l'état, passez une fonction.</li>
        <li>Modifiez l'état en JavaScript pur.</li>
        <li>Appelez <code>update()</code> : Nuclo réexécute les fonctions et met le DOM à jour.</li>
      </ol>
      <p>Changer une variable ne touche pas au DOM. La page ne change que lorsque vous appelez <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Démarrage rapide",
        content: `
      <p><code>create-nuclo</code> génère un projet Vite + TypeScript prêt à accueillir Nuclo :</p>
    `,
        afterContent: `
      <p>L'outil vous demande un nom de projet. Pour couper court, passez le nom et les options directement. Avec npm, glissez un <code>--</code> avant les options :</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Il ne reste plus qu'à installer les dépendances et à lancer le serveur de développement :</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Options</h3>
      <ul>
        <li><code>[project-name]</code> : le dossier de destination. Par défaut, <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code> : le template à copier. Pour l'instant, seul <code>basic</code> existe.</li>
        <li><code>-y, --yes</code> : ne rien demander, prendre les valeurs par défaut.</li>
        <li><code>-f, --force</code> : écrire dans un dossier qui n'est pas vide.</li>
        <li><code>-h, --help</code> : afficher l'aide.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Installation et imports",
        content: `
      <p>Pour ajouter Nuclo à un projet existant :</p>
      ${sh("npm install nuclo")}
      <p>Vous pouvez aussi passer par <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> ou <code>bun add nuclo</code>. Nuclo n'a aucune dépendance.</p>
      <p>Le routage ne fait pas partie du package principal : il est publié à part sous le nom <a href="#router-overview"><code>nuclo-router</code></a>, à installer à côté de <code>nuclo</code> le jour où vous en avez besoin.</p>
      <h3>Les fonctions globales</h3>
      <p><code>import 'nuclo'</code> dépose ceci sur <code>globalThis</code> :</p>
      <ul>
        <li><strong>175 constructeurs de balises</strong> : 112 pour HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) et 63 pour SVG, reconnaissables à leur suffixe <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). Voir <a href="#tag-builders">Constructeurs de balises</a>.</li>
        <li><strong>16 fonctions utilitaires</strong> : <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> et <code>globalStyle</code>.</li>
      </ul>
      <p>Cet import doit s'exécuter avant tout code qui appelle un constructeur. Les modules ES s'exécutent dans l'ordre des imports : l'exemple suivant échoue donc.</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Mettez <code>import 'nuclo'</code> tout en haut de votre point d'entrée, ou importez-le dans chaque fichier qui utilise les globales.</p>
      <h3>Les imports nommés</h3>
      <p>Les fonctions utilitaires existent aussi en exports nommés : ce sont exactement les mêmes que les globales. <code>getCssText()</code> et <code>resetStyles()</code>, elles, ne sont disponibles qu'en exports nommés. À l'inverse, les constructeurs de balises n'existent que sous forme de globales : <code>import { div } from 'nuclo'</code> ne fonctionnera donc pas.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Les points d'entrée</h3>
      <ul>
        <li><code>nuclo</code> : enregistre les globales et exporte les 16 fonctions utilitaires, plus <code>getCssText</code> et <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code> : <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> et <code>getCssText</code>. Voir <a href="#api-ssr">Rendu côté serveur</a>.</li>
        <li><code>nuclo/polyfill</code> : un mini DOM pour Node et Bun. Voir <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code> : les types, et rien d'autre. Voir <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo embarque ses propres types. Deux conditions suffisent :</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> et <code>nodenext</code> ne sont pas encore pris en charge.</li>
        <li>La lib <code>DOM</code>, que TypeScript inclut d'office tant que vous ne définissez pas <code>lib</code>.</li>
      </ul>
      <p>Dès qu'un fichier du projet importe <code>'nuclo'</code>, tous les autres voient les types globaux : rien de plus à faire. Si aucun fichier ne l'importe (un tsconfig séparé pour les tests, par exemple), déclarez les types vous-même :</p>
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
      <p>Ou ajoutez <code>/// &lt;reference types="nuclo/types" /&gt;</code> dans un fichier <code>.d.ts</code>.</p>
      <h3>Les types utiles</h3>
      <p>Ces types sont globaux : aucun import n'est nécessaire.</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code> : ce que renvoie un constructeur de balise. Utilisez-le comme type de retour d'un composant.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code> : tout ce qu'un constructeur de balise accepte en argument.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code> : ce que renvoient <code>render()</code> et <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code> : n'importe quel nom de balise HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code> : l'objet d'attributs qu'accepte un constructeur de balise, gestionnaires <code>on*</code>, <code>onMount</code> et <code>onDestroy</code> compris. Pratique pour les composants qui relaient des attributs.</li>
        <li><code>MountCallback</code> et <code>DestroyCallback</code> : les types des gestionnaires <code>onMount</code> et <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code> : ce que renvoient <code>when()</code> et <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code> : les options de <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> et les autres types liés aux styles. Ils s'importent aussi : <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> rend optionnel chaque membre du DOM. Faites un cast quand il vous faut le type complet de l'élément : <code>render(App, root) as HTMLDivElement</code>.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "Construire l'interface",
    sections: [
      {
        id: "tag-builders",
        title: "Constructeurs de balises",
        content: `
      <p>Chaque balise HTML correspond à une fonction globale du même nom : <code>div</code>, <code>span</code>, <code>input</code>, … Seule exception, <code>&lt;var&gt;</code>, qui devient <code>var_</code> puisque <code>var</code> est un mot réservé. Les balises SVG portent toutes le suffixe <code>Svg</code> : <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Appeler un constructeur de balise ne crée pas encore d'élément. <code>div('Hi')</code> renvoie un <strong>constructeur</strong>, c'est-à-dire une fonction qui fabriquera l'élément plus tard. Nuclo l'appelle quand vous le montez avec <code>render()</code> ou que vous le placez dans un autre constructeur, un <code>when()</code> ou un <code>list()</code>. Chaque utilisation crée un nouvel élément.</p>
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
      <h3>Les arguments</h3>
      <p>Un constructeur accepte autant d'arguments que vous voulez et les applique de gauche à droite :</p>
      <ul>
        <li><strong>string, number, bigint</strong> : un nœud texte.</li>
        <li><strong><code>() =&gt; value</code></strong> : un texte qui change à chaque <code>update()</code>. Voir <a href="#dynamic-functions">Valeurs dynamiques</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong> : ignorés.</li>
        <li><strong><code>true</code>, <code>false</code></strong> : affichés comme le texte « true » ou « false ». Pour une condition, utilisez <code>when()</code>.</li>
        <li><strong>Un objet simple</strong> : des attributs. Voir <a href="#attributes">Attributs</a>.</li>
        <li><strong>Un résultat de <code>css()</code>, <code>cx()</code> ou <code>variants()</code></strong> : ajoute ses classes.</li>
        <li><strong><code>on(...)</code></strong> : un écouteur d'événement ou un hook de cycle de vie.</li>
        <li><strong>Un autre constructeur, un <code>when()</code> ou un <code>list()</code></strong> : un enfant.</li>
        <li><strong>Un <code>Node</code> du DOM</strong> : ajouté tel quel.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong> : un modificateur personnalisé, détaillé plus bas.</li>
      </ul>
      <h3>Les pièges</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> affiche le texte « false ». Écrivez plutôt <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Un tableau n'est pas un enfant : décomposez-le avec un spread, <code>ul(...names.map((n) =&gt; li(n)))</code>. Et pour une liste qui évolue, passez par <code>list()</code>.</li>
        <li>Une variable locale qui porte un nom de balise masque le constructeur. Dans <code>function Row(label: string)</code>, impossible d'appeler <code>label(...)</code>. Renommez les locales comme <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> ou <code>i</code>.</li>
        <li>Les navigateurs exposent en variable globale tout élément doté d'un <code>id</code>. Si la page contient <code>&lt;main id="main"&gt;</code> avant le chargement de Nuclo, celui-ci laisse cette globale en place, et <code>main(...)</code> lève alors une <code>TypeError</code>. Choisissez d'autres ids.</li>
      </ul>
      <h3>Les modificateurs personnalisés</h3>
      <p>Une fonction qui déclare au moins un paramètre s'exécute une seule fois, dans l'ordre des arguments, pendant la construction de l'élément. Son premier argument est l'élément ; le second est un index interne, mieux vaut ne pas s'y fier. Si elle renvoie une chaîne ou un nombre, cela devient du texte ; un <code>Node</code> est ajouté ; un objet est appliqué comme attributs.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Mettre la main sur l'élément</h3>
      <p><code>render()</code> renvoie l'élément racine. Au sein d'un arbre, passez par <code>on("mount", (el) =&gt; …)</code> ou par un modificateur personnalisé. Vous pouvez aussi appeler vous-même la fonction constructeur pour obtenir un élément détaché :</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Rattachez-le avant le prochain <code>update()</code> : un nœud absent du document au moment où <code>update()</code> s'exécute n'est plus jamais mis à jour.</p>
      <h3>SVG</h3>
      <p>Les constructeurs SVG acceptent les mêmes arguments. Nuclo applique chaque attribut SVG avec <code>setAttribute</code> : des noms comme <code>"stroke-width"</code> fonctionnent donc tels quels.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Tous les constructeurs</h3>
      <p><strong>HTML :</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG :</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Composants",
        content: `
      <p>Un composant, c'est simplement une fonction qui renvoie un constructeur, comme <code>button(...)</code>. Il n'existe pas d'API de composant, et rien n'est créé tant que vous ne le rendez pas ou ne l'insérez pas dans un arbre.</p>
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
      <p>L'état déclaré dans la fonction appartient à son instance. Celui déclaré à l'extérieur est partagé par toutes les instances. <code>forceUpdate()</code> rappelle les composants, ce qui réinitialise l'état déclaré à l'intérieur.</p>
      <p>Les enfants ne sont que des arguments :</p>
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
        title: "Attributs",
        content: `
      <p>Pour définir des attributs, passez un objet simple, ou plusieurs. Sur une même clé, la dernière valeur l'emporte, sauf pour <code>className</code> et <code>style</code>, qui sont fusionnés. Une valeur peut être statique, ou bien une fonction sans paramètre qui se réexécute à chaque <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Comment une valeur est appliquée</h3>
      <ul>
        <li>Si l'élément HTML possède une propriété de ce nom (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo affecte la propriété. Sinon, il appelle <code>setAttribute(key, String(value))</code>, notamment pour <code>"aria-*"</code> et <code>"data-*"</code>.</li>
        <li>Sur les éléments SVG, Nuclo appelle toujours <code>setAttribute</code>.</li>
        <li><code>null</code> et <code>undefined</code> sont ignorés. Une valeur dynamique qui renvoie <code>null</code> ou <code>undefined</code> laisse l'ancienne valeur en place. Pour vider une valeur, renvoyez <code>""</code>, ou <code>false</code> s'il s'agit d'une propriété booléenne.</li>
        <li>Les booléens fonctionnent avec les propriétés booléennes du DOM, comme <code>disabled</code> sur un bouton, <code>checked</code>, <code>hidden</code> ou <code>required</code>. Partout ailleurs, <code>true</code> et <code>false</code> sont écrits sous forme de chaînes, « true » et « false ».</li>
        <li>Utilisez des clés <code>"data-*"</code> : <code>dataset</code> n'est pas pris en charge.</li>
        <li><code>innerHTML</code> n'est pas échappé, et le rendu côté serveur ne le produit pas. Mieux vaut l'éviter.</li>
      </ul>
      <h3>Les classes</h3>
      <p>Passez par <code>className</code>. Les chaînes de classes statiques, les résultats de <code>css()</code> et un <code>className</code> dynamique se fusionnent tous. Un <code>className</code> dynamique préserve les classes statiques : s'il renvoie <code>""</code>, il ne reste que celles-ci.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Évitez la clé <code>class</code> sur les éléments HTML : elle écrit l'attribut brut et écrase toutes les classes appliquées avant elle, celles de <code>css()</code> comprises.</p>
      <h3>Les styles en ligne</h3>
      <p><code>style</code> prend un objet dont les clés sont en camelCase, ou une fonction qui en renvoie un.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo n'ajoute aucune unité : écrivez <code>"12px"</code>, pas <code>12</code>. Les propriétés sans unité, comme <code>opacity</code> et <code>zIndex</code>, acceptent des nombres.</li>
        <li><code>""</code>, <code>null</code> et <code>undefined</code> vident une propriété.</li>
        <li>Un style dynamique ne définit que les clés qu'il renvoie. Une clé qu'il cesse de renvoyer garde son ancienne valeur : renvoyez <code>""</code> pour la vider.</li>
        <li>Les chaînes de style (<code>"color: red"</code>) et les propriétés personnalisées (<code>"--gap"</code>) ne sont pas prises en charge. Utilisez plutôt <code>css()</code>, qui accepte les propriétés personnalisées via <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Événements",
        content: `
      <p>Deux façons d'écouter les événements : les attributs <code>on*</code> et le modificateur <code>on()</code>.</p>
      <h3>Les attributs <code>on*</code></h3>
      <p>Dans un objet d'attributs, une fonction rangée sous une clé comme <code>onClick</code> (<code>on</code> suivi d'une majuscule) est un gestionnaire d'événement, pas une valeur dynamique.</p>
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
        <li>TypeScript déduit le type de l'événement à partir de la clé et de l'élément. <code>e.currentTarget</code> et <code>this</code> désignent l'élément.</li>
        <li>Nuclo affecte la propriété native : <code>onClick</code> devient <code>el.onclick</code>. Un seul gestionnaire par événement, donc un <code>onClick</code> placé plus loin remplace le précédent.</li>
        <li><code>onDoubleClick</code> et <code>onDblClick</code> désignent tous deux <code>dblclick</code>. Les clés en minuscules comme <code>onclick</code> sont des erreurs de type.</li>
        <li>Un nom qui ne correspond à aucun événement connu écoute sa version en minuscules : <code>onMyEvent</code> écoute <code>"myevent"</code>.</li>
        <li>Les erreurs levées par le gestionnaire ne sont pas interceptées.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> renvoie un modificateur qui appelle <code>addEventListener</code> sur l'élément.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Chaque <code>on()</code> ajoute un écouteur, et tous s'exécutent, dans l'ordre.</li>
        <li><code>options</code> est transmis tel quel à <code>addEventListener</code> : <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Passez <code>on()</code> directement à un constructeur, et le type de l'élément est déduit : <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Si un écouteur lève une erreur, Nuclo la consigne avec <code>console.error</code> et laisse les autres écouteurs s'exécuter.</li>
        <li>Nuclo retire l'écouteur en même temps que l'élément. Côté serveur, <code>on()</code> ne fait rien.</li>
        <li>Une même valeur <code>on()</code> peut être réutilisée sur plusieurs éléments.</li>
      </ul>
      <p>Pour un événement personnalisé, indiquez son type en générique :</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Lequel choisir ?</h3>
      <p>Dans la plupart des cas, les attributs <code>on*</code> suffisent. Réservez <code>on()</code> aux situations où il vous faut plusieurs écouteurs pour un même événement, des options d'écouteur, ou un nom d'événement personnalisé comme <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Cycle de vie",
        content: `
      <p><code>onMount</code> s'exécute une fois, après l'insertion de l'élément ; <code>onDestroy</code> s'exécute une fois, quand Nuclo retire l'élément. On les écrit comme attributs ou avec <code>on()</code> : les deux formes se comportent de la même façon, et l'élément est typé d'après sa balise.</p>
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
      <h3>À quel moment ils s'exécutent</h3>
      <ul>
        <li><code>onMount</code> s'exécute à la fin de l'appel à <code>render()</code>, <code>hydrate()</code>, <code>update()</code> ou <code>forceUpdate()</code> qui a inséré l'élément, mais jamais pendant la construction de l'arbre.</li>
        <li>Si <code>onMount</code> renvoie une fonction, celle-ci s'exécute à la destruction, après les fonctions de rappel <code>onDestroy</code> de l'élément.</li>
        <li><code>onDestroy</code> s'exécute quand Nuclo retire l'élément : une ligne de <code>list()</code> disparaît, une branche de <code>when()</code> change, un <code>into()</code> quitte sa région, ou <code>forceUpdate()</code> l'abandonne. Il passe juste avant le retrait, l'élément est donc encore dans le document.</li>
      </ul>
      <h3>Quand vous retirez le DOM à la main</h3>
      <p>Si vous retirez un élément vous-même, avec <code>node.remove()</code> ou <code>innerHTML = ''</code>, ses <code>onDestroy</code> et ses nettoyages ne tournent jamais, et les timers continuent. Nuclo n'a pas de <code>unmount()</code>. Pour démonter une application proprement, enveloppez-la dans un <code>when()</code> :</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Ordre d'exécution et erreurs</h3>
      <ul>
        <li>Vous pouvez enregistrer autant de hooks que vous voulez, sous l'une ou l'autre forme ; ils s'exécutent dans l'ordre d'enregistrement.</li>
        <li><code>onDestroy</code> traite toujours les enfants d'abord, puis le parent.</li>
        <li>Les éléments sont montés dans l'ordre de leur premier hook <code>onMount</code>, lequel suit l'ordre des arguments, et chaque élément exécute tous ses hooks d'un coup. Si les enfants dépendent du hook d'un parent, passez celui-ci avant eux.</li>
        <li>Une erreur levée par un hook est consignée avec <code>console.error</code>, et les autres hooks s'exécutent malgré tout.</li>
        <li>La fonction de rappel doit renvoyer une fonction de nettoyage ou rien du tout : ne la déclarez donc pas <code>async</code>. Une Promise renvoyée n'est jamais utilisée comme nettoyage. Lancez plutôt le travail asynchrone à l'intérieur : <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Les hooks ne s'exécutent jamais côté serveur. Côté client, ils tournent après <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>À noter :</strong> les hooks ne sont pas des effets. Ils ne se relancent jamais quand l'état change, et chacun s'exécute au plus une fois par élément.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "Mises à jour",
    sections: [
      {
        id: "explicit-updates",
        title: "Mises à jour explicites",
        content: `
      <p>Nuclo ne met jamais la page à jour de son propre chef. Modifiez votre état, puis appelez <code>update()</code>.</p>
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
      <p>Changez l'état autant de fois que nécessaire, puis appelez <code>update()</code> une seule fois :</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Appelez <code>update()</code> depuis des gestionnaires d'événements, des minuteurs, des fonctions de rappel de fetch ou <code>onMount</code>, mais jamais depuis une valeur dynamique.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Valeurs dynamiques",
        content: `
      <p>Une fonction <strong>sans paramètre</strong> est une <strong>valeur dynamique</strong>. Nuclo l'exécute une fois à la construction de l'élément, puis à chaque <code>update()</code>. Servez-vous-en pour les enfants texte, les valeurs d'attributs, <code>style</code> et <code>className</code>. Pour les enfants qui apparaissent, disparaissent ou se répètent, tournez-vous vers <a href="#api-when"><code>when()</code></a> et <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo regarde le nombre de paramètres (<code>fn.length</code>). Une fonction qui en déclare un est un <a href="#tag-builders">modificateur personnalisé</a>, exécuté une seule fois. <code>(x = 0) =&gt; …</code> et <code>(...args) =&gt; …</code> ont une longueur de 0 : elles sont donc dynamiques.</p>
      <h3>Le texte dynamique</h3>
      <ul>
        <li>Une chaîne, un nombre, un bigint ou un booléen est rendu comme <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> affiche « false » : écrivez plutôt <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> et <code>undefined</code> donnent un texte vide.</li>
        <li>Si la fonction renvoie un résultat de <code>css()</code> ou de <code>cx()</code> dès sa première exécution, elle devient une classe dynamique, pas du texte. Voir <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Un nœud, un constructeur, un tableau ou un objet simple ne rend rien et ne se met jamais à jour.</li>
      </ul>
      <h3>Les attributs dynamiques</h3>
      <ul>
        <li>Nuclo n'écrit une valeur que si elle diffère de la dernière qu'il a écrite. Il ne compare pas avec le DOM réel : si un utilisateur tape dans un champ et que votre fonction renvoie la même valeur qu'avant, sa saisie reste intacte.</li>
        <li>Un résultat <code>null</code> ou <code>undefined</code> n'écrit rien, l'ancienne valeur reste donc en place. <code>className</code> fait exception : tout résultat falsy retire les classes dynamiques et garde les statiques.</li>
        <li>Une fonction <code>style</code> applique l'objet renvoyé à chaque mise à jour.</li>
      </ul>
      <h3>Les erreurs</h3>
      <p>Quand une valeur dynamique lève une erreur, Nuclo l'intercepte et le reste de la mise à jour se poursuit. Le texte devient vide ou garde sa valeur précédente, et un attribut conserve la sienne ; tout rentre dans l'ordre au prochain <code>update()</code> réussi. Seule exception : une fonction texte qui échoue dès sa <strong>première</strong> exécution reste vide pour de bon.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Lance une passe synchrone sur chaque valeur dynamique de la page. Avec des ids, elle se limite aux éléments marqués par ces ids de <a href="#api-scope"><code>scope()</code></a>. Chaque passe enchaîne ces étapes, dans l'ordre :</p>
      <ol>
        <li><code>list()</code> : relit les éléments, puis ajoute, déplace ou supprime des lignes.</li>
        <li><code>when()</code> : revérifie les conditions. Une branche n'est reconstruite que lorsqu'une autre branche devient active.</li>
        <li>Les attributs dynamiques, <code>style</code> et <code>className</code> compris.</li>
        <li>Le texte dynamique.</li>
        <li><code>onMount</code> pour les éléments insérés aux étapes 1 et 2.</li>
      </ol>
      <ul>
        <li><strong>Tout est réexécuté.</strong> Chaque valeur dynamique tourne à chaque appel, même quand ses données n'ont pas bougé : seule l'écriture dans le DOM est épargnée. Gardez donc vos valeurs dynamiques rapides et sans effet de bord.</li>
        <li><strong>Seuls les nœuds du document comptent.</strong> Si un nœud n'est pas dans le document quand <code>update()</code> s'exécute, Nuclo cesse de le suivre : il ne sera plus jamais mis à jour, même une fois rattaché. Cela vaut aussi pour <code>list()</code> et <code>when()</code>. Rendez donc dans un conteneur déjà présent dans le document.</li>
        <li><strong>Les valeurs statiques ne changent jamais.</strong> Les chaînes et valeurs d'attributs simples sont figées à la construction de l'élément. Pour les reconstruire, utilisez <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Erreurs.</strong> Les erreurs de texte et d'attributs sont interceptées, et la passe continue. Si la condition d'un <code>when()</code> lève une erreur, elle est consignée et ce <code>when()</code> cesse de se mettre à jour. Si c'est la fonction <code>items</code> ou <code>renderItem</code> d'un <code>list()</code> qui échoue, l'erreur remonte hors de <code>update()</code> et les étapes restantes ne s'exécutent pas.</li>
        <li><strong>Serveur.</strong> Côté serveur, <code>update()</code> ne fait rien.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Attribue un ou plusieurs ids de scope à l'élément auquel il est passé. <code>update('id')</code> ne met alors à jour que le contenu de cet élément, attributs de l'élément compris.</p>
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
        <li>Un élément peut porter plusieurs ids : <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> met à jour tout ce qui se trouve dans <code>a</code> ou dans <code>b</code>. Si plusieurs éléments partagent le même id, tous sont mis à jour.</li>
        <li>Avec des scopes imbriqués, <code>update('outer')</code> englobe le scope interne, alors que <code>update('inner')</code> laisse le scope externe tranquille.</li>
        <li>Un id qu'aucun élément du document ne porte ne met <strong>rien</strong> à jour, sans la moindre erreur : vérifiez bien l'orthographe.</li>
        <li><code>scope()</code> ne fait rien côté serveur.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Affiche du contenu selon une condition. Nuclo revérifie les conditions à chaque <code>update()</code> ; la première qui est vraie l'emporte. Si aucune ne l'est, c'est le contenu de <code>.else()</code> qui s'affiche, et sans <code>.else()</code>, rien du tout.</p>
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
      <h3>Les conditions</h3>
      <ul>
        <li>Pour une condition qui dépend de l'état, passez une fonction. Un booléen brut n'est lu qu'une fois : <code>when(open, …)</code> ne changera jamais.</li>
        <li>En TypeScript, la fonction doit renvoyer un booléen. Écrivez <code>() =&gt; items.length &gt; 0</code> ou <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Ce qui est mis à jour</h3>
      <ul>
        <li>Tant que la même branche reste active, ses éléments sont conservés, et les valeurs dynamiques, listes et <code>when()</code> qu'elle contient continuent de se mettre à jour.</li>
        <li>Quand une autre branche prend le relais, l'ancien contenu est retiré et ses hooks <code>onDestroy</code> s'exécutent ; la nouvelle branche est construite de zéro et ses hooks <code>onMount</code> s'exécutent. L'état des anciens éléments, comme le texte d'un champ ou le focus, est perdu.</li>
      </ul>
      <h3>Le contenu d'une branche</h3>
      <p>Une branche accepte des enfants : du texte, du texte dynamique, des constructeurs, des <code>list()</code> et des <code>when()</code> imbriqués. Passez des constructeurs comme <code>p('Hi')</code>, pas des nœuds DOM : un nœud DOM cesse de se mettre à jour dès que sa branche a été masquée une fois.</p>
      <p>Les objets d'attributs et les <code>on()</code> placés dans une branche s'appliquent à l'élément parent, et y restent même quand la branche se cache. Pour un attribut conditionnel, passez par un attribut dynamique : <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Le chaînage</h3>
      <p><code>.when()</code> et <code>.else()</code> renvoient un nouveau constructeur sans toucher à l'original. Si vous appelez <code>.else()</code> deux fois, le dernier appel gagne.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Rend une ligne par élément. À chaque <code>update()</code>, Nuclo rappelle <code>items()</code> et rapproche les nouveaux éléments des lignes existantes par identité (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Comment les lignes sont appariées</h3>
      <ul>
        <li>Un élément toujours présent garde sa ligne : Nuclo la déplace si besoin, sans rappeler <code>renderItem</code>.</li>
        <li>Un nouvel élément reçoit une nouvelle ligne ; un élément supprimé perd la sienne, et ses hooks <code>onDestroy</code> s'exécutent.</li>
        <li>Les doublons ont chacun leur propre ligne.</li>
        <li>Vous pouvez muter le tableau sur place (<code>push</code>, <code>splice</code>, <code>sort</code>) ou en renvoyer un nouveau.</li>
      </ul>
      <p>Une ligne conservée n'est jamais rendue de nouveau : pour les champs qui changent, servez-vous donc de valeurs dynamiques.</p>
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
      <p>Les copies sont de nouveaux éléments : remplacer le tableau par <code>todos.map((t) =&gt; ({ ...t }))</code> reconstruit donc toutes les lignes.</p>
    `,
        afterContent: `
      <h3>Ce que doit renvoyer <code>renderItem</code></h3>
      <ul>
        <li>Renvoyez un seul élément, par exemple <code>li(...)</code>, <code>tr(...)</code> ou un constructeur SVG. <code>null</code> ou <code>undefined</code> permet d'ignorer un élément. Les chaînes, nœuds texte et fragments ne rendent rien.</li>
        <li>Ne renvoyez pas <code>when()</code> ni <code>list()</code> directement : glissez-les dans l'élément de ligne, comme dans <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Pour masquer des éléments, filtrez dans <code>items()</code>, pas dans <code>renderItem</code>.</li>
        <li>Évitez les effets de bord dans <code>renderItem</code> : Nuclo peut l'appeler plusieurs fois pour le même élément.</li>
      </ul>
      <h3>L'index</h3>
      <p><code>index</code> est la position de l'élément au moment où sa ligne a été créée, et elle ne suit pas les déplacements de lignes. Pour obtenir la position courante, utilisez une valeur dynamique : <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Les itérables</h3>
      <p>Tout itérable fait l'affaire : tableaux, <code>Set</code>, générateurs, <code>map.values()</code>. Renvoyer à chaque fois le même tableau ou le même <code>Set</code> ne pose aucun problème. Un itérateur, tel qu'un générateur ou <code>map.values()</code>, est épuisé après une passe : créez-le donc dans <code>items()</code>, à chaque appel. Itérer directement une <code>Map</code> fabrique de nouveaux tableaux <code>[key, value]</code> à chaque fois, et chaque ligne est alors reconstruite ; préférez <code>map.values()</code>.</p>
      <h3>L'emplacement</h3>
      <p>Les lignes s'insèrent à la place de <code>list()</code> parmi ses voisins, entre deux marqueurs de commentaire, et les autres enfants du parent ne sont pas touchés. <code>list()</code> fonctionne aussi dans les constructeurs SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() et into()",
        content: `
      <p><code>region()</code> balise un emplacement nommé dans l'arbre, et <code>into()</code> le remplit depuis n'importe où ailleurs, à n'importe quelle profondeur. Le layout ne reçoit pas son contenu en prop, et le composant qui fabrique ce contenu ignore où il va atterrir.</p>
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
      <h3>Comment ça marche</h3>
      <ul>
        <li><code>into()</code> ne laisse qu'un commentaire à l'endroit où il est écrit ; son contenu est rendu entre les marqueurs de la région.</li>
        <li>L'ordre n'a aucune importance. Un <code>into()</code> construit avant sa région patiente et s'affiche dès que la région existe. Les vues s'affichent dans l'ordre où elles ont été écrites.</li>
        <li>Le contenu vit aussi longtemps que sa vue. Quand le <code>when()</code> qui enveloppe un <code>into()</code> se referme, ou que sa ligne de <code>list()</code> est supprimée, le contenu quitte la région ; le rouvrir en ajoute une copie, pas deux.</li>
        <li>Quand une région disparaît, parce que son <code>when()</code> se referme par exemple, ses vues repassent en attente. Une région construite plus tard avec le même id les affichera.</li>
        <li>Un <code>into()</code> dont l'id ne correspond à aucune région ne rend rien et ne lève aucune erreur : vérifiez bien l'orthographe.</li>
        <li>Les ids sont uniques dans l'arbre : une seconde région construite sous un id déjà actif déclenche un avertissement dans la console.</li>
        <li>Les régions fonctionnent avec le <a href="#api-ssr">rendu côté serveur</a>. Pendant <code>hydrate()</code>, chaque vue réutilise le HTML rendu par le serveur au lieu de le reconstruire.</li>
      </ul>
      <h3>Les options</h3>
      <ul>
        <li><code>id</code> : le nom que les appels à <code>into()</code> utilisent pour retrouver la région.</li>
        <li><code>type</code> : <code>'latest'</code> (par défaut) n'affiche que la vue la plus récente, tandis que <code>'stack'</code> les affiche toutes, dans l'ordre d'arrivée.</li>
        <li><code>empty</code> : ce qui est rendu tant que la région ne contient aucune vue.</li>
      </ul>
      <h3>Les régions empilées</h3>
      <p>Avec <code>type: 'stack'</code>, une vue qui s'ouvre par-dessus une autre ne reconstruit pas celle du dessous : son DOM, son focus et l'état de ses formulaires restent intacts. C'est idéal pour une couche, comme une boîte de dialogue posée sur une page.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>Remplir plusieurs régions d'un coup</h3>
      <p>Passez un objet pour alimenter plusieurs régions avec un seul <code>into()</code>. Chaque valeur est un enfant ou un tableau d'enfants. Les deux formes s'imbriquent : un <code>into()</code> placé dans le contenu d'une autre vue cible sa propre région.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Ouvrir une boîte de dialogue depuis le fond de l'arbre</h3>
      <p>La région de superposition est à la racine. N'importe quel composant, à n'importe quelle profondeur, peut ouvrir une boîte de dialogue en enveloppant un <code>into()</code> dans un <code>when()</code> ; refermer le <code>when()</code> retire la boîte de la région.</p>
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
      <h3>Des toasts depuis les lignes d'une liste</h3>
      <p>Chaque ligne d'un <code>list()</code> est une vue. Une région empilée les affiche dans l'ordre, et retirer un élément du tableau fait disparaître son toast.</p>
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
      <h3>Un titre de page choisi par la page</h3>
      <p>Avec le <code>type: 'latest'</code> par défaut, la vue la plus récente l'emporte : le layout possède le titre, et la page ouverte le nomme. Une page sans <code>into('title', …)</code> laisse le texte <code>empty</code>.</p>
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
      <h3>Des valeurs dynamiques dans une vue</h3>
      <p>Le contenu d'un <code>into()</code> est du contenu Nuclo comme un autre. Les fonctions qu'il contient sont des valeurs dépendant de l'état et se rafraîchissent à chaque <code>update()</code>, où que se trouve la région.</p>
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
      <h3>Une région qui va et vient</h3>
      <p>Le <code>into()</code> du tableau de bord n'est écrit qu'une fois. Tant que l'utilisateur est déconnecté, la région <code>main</code> n'existe pas et la vue attend. À la connexion, la région est construite et la vue s'affiche ; à la déconnexion, la région est retirée et la vue repasse en attente.</p>
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
      <h3>Une vue qui apporte sa propre région</h3>
      <p>Une vue peut contenir un <code>region()</code>, que d'autres vues peuvent cibler. Ici, la page éditeur embarque une région <code>tabs</code> que chaque onglet vient remplir ; quand l'éditeur se ferme, sa région disparaît avec lui.</p>
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
      <h3>Essayez vous-même</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> n'exécute que les valeurs dynamiques. Les valeurs statiques, comme le texte dans <code>h1(labels[lang].title)</code>, sont figées à la construction de l'arbre. <code>forceUpdate()</code> rappelle vos composants et ajuste le vrai DOM en conséquence, statique compris. Gardez-le pour les changements rares qui touchent toute l'application, comme un changement de langue, et utilisez <code>update()</code> pour tout le reste.</p>
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
      <p>Sans argument, <code>forceUpdate()</code> reconstruit chaque racine rendue avec <code>render(App)</code> ou <code>hydrate(App)</code>. Les racines rendues avec <code>render(App())</code> sont ignorées. Si un composant lève une erreur, elle est consignée et cette racine garde son ancien DOM. Une erreur levée plus tard, pendant l'application de la nouvelle construction, est consignée elle aussi, mais ce qui a déjà été mis à jour le reste.</p>
      <h3>Ce qui reste, ce qui change</h3>
      <ul>
        <li>Les enfants sont appariés dans l'ordre, balise par balise. Un élément qui correspond est réutilisé : le focus et les valeurs saisies sont préservés, et ses hooks <code>onMount</code> ne se relancent pas. Dès que la balise d'un enfant diffère, cet enfant et tous les suivants de même niveau sont reconstruits.</li>
        <li>Le texte, les attributs, les classes, les styles, les écouteurs, les branches de <code>when()</code> et les lignes de <code>list()</code> suivent la nouvelle construction.</li>
        <li>Les nouveaux éléments sont créés et leurs hooks <code>onMount</code> s'exécutent ; ceux que la nouvelle construction ne produit plus sont retirés, et leurs hooks <code>onDestroy</code> s'exécutent.</li>
        <li>Les lignes de <code>list()</code> sont aussi appariées par position plutôt que par élément : un élément de ligne réutilisé peut donc se retrouver à afficher un autre élément.</li>
        <li>Les attributs que la nouvelle construction ne définit plus ne sont pas retirés.</li>
      </ul>
      <div class="docs-callout"><strong>Attention :</strong> l'état déclaré dans une fonction composant est réinitialisé, puisque la fonction se réexécute. Gardez hors du composant tout état qui doit survivre.</div>
      <p><strong>Forme explicite.</strong> <code>forceUpdate(App(), parent)</code> reconstruit un seul arbre dans <code>parent</code> et renvoie sa racine, sans l'enregistrer pour les appels suivants. Comme <code>hydrate()</code>, il attend que la racine soit le premier nœud de <code>parent</code> ; si ce premier nœud a une autre balise, il est remplacé.</p>
      <p>Côté serveur, <code>forceUpdate()</code> ne fait rien.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "Rendu",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>Construit votre arbre et ajoute son élément racine à <code>parent</code> (par défaut <code>document.body</code>). Renvoie l'élément racine.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Vous pouvez passer le composant (<code>render(App)</code>) ou le constructeur qu'il renvoie (<code>render(App())</code>) : le DOM obtenu est identique. Seul <code>render(App)</code> permet toutefois à <a href="#api-force-update"><code>forceUpdate()</code></a> de reconstruire la racine plus tard, alors autant le préférer.</li>
        <li>Le contenu est ajouté sans vider <code>parent</code> : deux appels, deux copies.</li>
        <li>Quand <code>render()</code> rend la main, tous les <code>onMount</code> de l'arbre ont déjà été exécutés.</li>
        <li>Rendez dans un élément présent dans le document. Voir <a href="#api-update"><code>update()</code></a>.</li>
        <li>La racine doit être un élément, comme <code>div(...)</code>, pas un <code>when()</code> ni un <code>list()</code>.</li>
        <li><code>index</code> est interne : il ne détermine pas où l'élément est inséré. Ne l'utilisez pas.</li>
      </ul>
      <p>Un composant passé sous la forme <code>render(App)</code> ne doit prendre aucun paramètre. Un paramètre obligatoire est une erreur de type ; un paramètre optionnel passe la vérification des types, mais <code>render()</code> lève alors une erreur à l'exécution. Pour un composant qui prend des props, enveloppez-le :</p>
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
      <p>Reprend la main sur le HTML produit par <a href="#api-ssr"><code>renderToString()</code></a> : il réutilise les éléments existants, attache les écouteurs d'événements et reconnecte les valeurs dynamiques, <code>when()</code> et <code>list()</code>, pour que <code>update()</code> fonctionne ensuite. Les hooks <code>onMount</code> s'exécutent à la fin. <code>parent</code> vaut <code>document.body</code> par défaut, et la fonction renvoie l'élément racine.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Utilisez le même composant, avec les mêmes données, que côté serveur.</li>
        <li>Hydratez dans un conteneur dédié. La racine de l'application doit en être le premier nœud, les espaces blancs étant tolérés. Si un autre nœud passe en premier, Nuclo le remplace et laisse en place la copie du serveur.</li>
        <li>Comme avec <code>render()</code>, passez <code>App</code> et non <code>App()</code>, pour que <code>forceUpdate()</code> puisse reconstruire la racine plus tard. <code>App</code> ne doit prendre aucun paramètre : avec un paramètre optionnel, <code>hydrate()</code> n'attache rien, et ce en silence. Pour un composant qui prend des props, enveloppez-le : <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Sans HTML serveur, utilisez <code>render()</code>.</li>
      </ul>
      <h3>Quand le serveur et le client divergent</h3>
      <p>C'est le client qui gagne :</p>
      <ul>
        <li>Une balise racine différente : ce nœud est remplacé par un DOM neuf. Un conteneur vide : un DOM neuf y est ajouté.</li>
        <li>Un texte différent est corrigé, et les éléments de <code>list()</code> comme les branches de <code>when()</code> qui diffèrent suivent le client.</li>
        <li>Les enfants en trop côté serveur sont retirés, et ceux qui manquent sont créés.</li>
        <li>Les attributs écrits par le serveur mais que le client ne définit pas sont laissés tels quels.</li>
      </ul>
      <p><code>renderToString()</code> écrit des commentaires HTML en guise de marqueurs, par exemple <code>&lt;!-- text-0 --&gt;</code> avant chaque nœud texte. <code>hydrate()</code> en a besoin : ne supprimez donc pas les commentaires du HTML serveur. Sans ces marqueurs, l'hydratation supprime les lignes de <code>list()</code>, et <code>list()</code> comme <code>when()</code> cessent de se mettre à jour.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Rendu côté serveur",
        content: `
      <p>Générez une chaîne HTML à partir d'un composant, côté serveur. Dans le navigateur, appelez <a href="#api-hydrate"><code>hydrate()</code></a> avec le même composant pour rendre ce HTML interactif. Un environnement serveur n'a pas de <code>document</code> : importez donc <a href="#api-polyfill"><code>nuclo/polyfill</code></a> en premier.</p>
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
      <p>Gardez <code>id="nuclo-styles"</code> sur la balise style : le client réutilise cet élément et n'y ajoute que les nouvelles règles. Voir <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Ce qui s'exécute côté serveur</h3>
      <ul>
        <li>Chaque appel à <code>renderToString()</code> construit l'arbre et exécute chaque valeur dynamique une fois.</li>
        <li>Les gestionnaires d'événements, <code>onMount</code> et <code>onDestroy</code> ne s'exécutent jamais, et <code>update()</code>, <code>scope()</code> et <code>forceUpdate()</code> ne font rien.</li>
        <li>Le rendu est synchrone : chargez vos données d'abord, rendez ensuite.</li>
        <li>Rien ne reste enregistré après un rendu, si bien qu'un même processus peut servir de nombreuses requêtes. Passez les données de la requête en arguments, par exemple <code>renderToString(Page(user))</code> : les variables de niveau module, elles, sont partagées par toutes les requêtes.</li>
        <li>N'appelez pas <code>render()</code> côté serveur, car il ajoute au <code>document.body</code> partagé.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Accepte un constructeur (<code>App()</code>), un composant (<code>App</code>) ou un nœud DOM. <code>null</code> et <code>undefined</code> renvoient <code>""</code>. La racine doit être un élément. Un composant passé sous la forme <code>renderToString(Page)</code> ne doit prendre aucun paramètre : pour un composant qui a besoin de données, passez <code>Page(user)</code>.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Le texte et les valeurs d'attributs sont échappés en HTML. Le texte d'un <code>script()</code> ou d'un <code>style()</code> est écrit tel quel (seules les balises fermantes sont découpées) : n'y placez donc jamais de saisie utilisateur.</li>
        <li>La fonction ne lève jamais d'erreur. Si le composant, une fonction de <code>list()</code> ou une condition de <code>when()</code> échoue, ou si le polyfill manque, elle consigne l'erreur et renvoie <code>""</code> : testez donc un résultat vide quand la requête doit échouer. Une fonction de texte ou d'attribut qui lève une erreur ne produit que du contenu vide.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Revient à écrire <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Enveloppe la sortie dans un élément. <code>containerTag</code> vaut <code>"div"</code> par défaut et <code>containerAttrs</code> <code>{}</code>. Les valeurs d'attributs sont échappées, mais pas les noms, qui sont écrits tels quels : utilisez des noms HTML comme <code>class</code>. Ne passez jamais de saisie utilisateur comme balise.</p>
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
      <p>Un petit DOM qui permet à Nuclo de construire des arbres sous Node et Bun. Importez-le une fois, avant votre premier rendu ; la plupart des applications se contentent de l'import simple.</p>
      <ul>
        <li>En l'absence de <code>window</code>, il définit <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> et <code>HTMLElement</code>, mais seulement ceux qui manquent. Il ne crée pas <code>window</code>.</li>
        <li>Dans un navigateur, ou sous jsdom, il ne fait rien.</li>
        <li><code>Event</code> et <code>CustomEvent</code> sont les constructeurs propres à l'environnement ; <code>Node</code>, <code>Element</code> et <code>HTMLElement</code> sont des alias des classes du polyfill.</li>
      </ul>
      <p>C'est un DOM pour construire des arbres, pas un navigateur : pas d'<code>innerHTML</code> ni de <code>getElementById</code>, un <code>querySelector()</code> qui renvoie <code>null</code>, et des écouteurs d'événements ignorés. Pour obtenir le HTML, utilisez <code>renderToString()</code>.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
