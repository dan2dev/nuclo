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
      <p>Nuclo est une petite bibliothèque DOM pour TypeScript. Vous construisez la page avec des fonctions ordinaires comme <code>div()</code> et <code>button()</code>, vous gardez l'état dans des variables classiques, et vous appelez <code>update()</code> quand la page doit changer.</p>
      <p>Nuclo n'a ni DOM virtuel, ni compilateur, ni proxies, ni signaux.</p>
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
        <li>Passez une fonction pour chaque valeur qui dépend de l'état.</li>
        <li>Modifiez l'état avec du JavaScript ordinaire.</li>
        <li>Appelez <code>update()</code>. Nuclo réexécute les fonctions et met à jour le DOM.</li>
      </ol>
      <p>Modifier une variable ne touche pas au DOM. La page ne change que lorsque vous appelez <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Démarrage rapide",
        content: `
      <p><code>create-nuclo</code> génère un projet Vite et TypeScript prêt pour Nuclo :</p>
    `,
        afterContent: `
      <p>Il demande un nom de projet. Pour éviter la question, passez le nom et les options. Avec npm, placez <code>--</code> avant les options :</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Installez ensuite les dépendances et lancez le serveur de développement :</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Options</h3>
      <ul>
        <li><code>[project-name]</code> : le dossier cible. La valeur par défaut est <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code> : le modèle à copier. Seul <code>basic</code> existe pour le moment.</li>
        <li><code>-y, --yes</code> : ne jamais poser de question, utiliser les valeurs par défaut.</li>
        <li><code>-f, --force</code> : écrire dans un dossier non vide.</li>
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
      <p>Ou utilisez <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> ou <code>bun add nuclo</code>. Nuclo n'a aucune dépendance.</p>
      <p>Le routage ne fait pas partie du paquet principal. Il est publié séparément sous le nom <a href="#router-overview"><code>nuclo-router</code></a>, que vous installez à côté de <code>nuclo</code> quand vous en avez besoin.</p>
      <h3>Fonctions globales</h3>
      <p><code>import 'nuclo'</code> place ces éléments sur <code>globalThis</code> :</p>
      <ul>
        <li><strong>175 constructeurs de balises</strong> : 112 pour HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) et 63 pour SVG, avec un suffixe <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). Voir <a href="#tag-builders">Constructeurs de balises</a>.</li>
        <li><strong>16 fonctions utilitaires</strong> : <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> et <code>globalStyle</code>.</li>
      </ul>
      <p>L'import doit s'exécuter avant tout code qui appelle un constructeur. Les modules ES s'exécutent dans l'ordre des imports, donc ceci échoue :</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Placez <code>import 'nuclo'</code> en premier dans votre fichier d'entrée, ou importez-le dans chaque fichier qui utilise les globales.</p>
      <h3>Imports nommés</h3>
      <p>Les fonctions utilitaires sont aussi des exports nommés. Ce sont les mêmes fonctions que les globales. <code>getCssText()</code> et <code>resetStyles()</code> sont uniquement des exports nommés. Les constructeurs de balises sont uniquement des globales, donc <code>import { div } from 'nuclo'</code> ne fonctionne pas.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Points d'entrée</h3>
      <ul>
        <li><code>nuclo</code> : enregistre les globales et exporte les 16 fonctions utilitaires plus <code>getCssText</code> et <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code> : <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> et <code>getCssText</code>. Voir <a href="#api-ssr">Rendu côté serveur</a>.</li>
        <li><code>nuclo/polyfill</code> : un petit DOM pour Node et Bun. Voir <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code> : types uniquement. Voir <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo fournit ses propres types. Il vous faut deux choses :</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> et <code>nodenext</code> ne sont pas encore pris en charge.</li>
        <li>La lib <code>DOM</code>. TypeScript l'inclut par défaut quand vous ne définissez pas <code>lib</code>.</li>
      </ul>
      <p>Si un fichier du projet importe <code>'nuclo'</code>, tous les fichiers voient les types globaux. Vous n'avez besoin de rien d'autre. Si aucun fichier ne l'importe, par exemple dans un tsconfig séparé pour les tests, ajoutez les types vous-même :</p>
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
      <h3>Types utiles</h3>
      <p>Ces types sont globaux, vous les utilisez donc sans import :</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code> : ce que renvoie un constructeur de balise. Utilisez-le comme type de retour d'un composant.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code> : tout ce qu'un constructeur de balise accepte comme argument.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code> : ce que renvoient <code>render()</code> et <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code> : n'importe quel nom de balise HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code> : l'objet d'attributs qu'un constructeur de balise accepte, y compris les gestionnaires <code>on*</code>, <code>onMount</code> et <code>onDestroy</code>. Utilisez-le pour les composants qui transmettent des attributs.</li>
        <li><code>MountCallback</code> et <code>DestroyCallback</code> : les gestionnaires <code>onMount</code> et <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code> : ce que renvoient <code>when()</code> et <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code> : les options acceptées par <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> et les autres types de style. Vous pouvez aussi les importer : <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> marque chaque membre du DOM comme optionnel. Faites un cast quand vous avez besoin du type complet de l'élément : <code>render(App, root) as HTMLDivElement</code>.</p>
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
      <p>Chaque balise HTML est une fonction globale du même nom : <code>div</code>, <code>span</code>, <code>input</code>, … La seule exception est <code>&lt;var&gt;</code>, qui s'écrit <code>var_</code> parce que <code>var</code> est un mot réservé. Chaque balise SVG porte un suffixe <code>Svg</code> : <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Appeler un constructeur de balise ne crée pas encore d'élément. <code>div('Hi')</code> renvoie un <strong>constructeur</strong> : une fonction qui créera l'élément plus tard. Nuclo l'appelle quand vous le montez avec <code>render()</code> ou le placez dans un autre constructeur, un <code>when()</code> ou un <code>list()</code>. Chaque utilisation crée un nouvel élément.</p>
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
      <h3>Arguments</h3>
      <p>Un constructeur accepte un nombre quelconque d'arguments et les applique de gauche à droite :</p>
      <ul>
        <li><strong>string, number, bigint</strong> : un nœud texte.</li>
        <li><strong><code>() =&gt; value</code></strong> : du texte qui change à chaque <code>update()</code>. Voir <a href="#dynamic-functions">Valeurs dynamiques</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong> : ignorés.</li>
        <li><strong><code>true</code>, <code>false</code></strong> : rendus comme le texte "true" ou "false". Utilisez <code>when()</code> pour les conditions.</li>
        <li><strong>Un objet simple</strong> : des attributs. Voir <a href="#attributes">Attributs</a>.</li>
        <li><strong>Un résultat de <code>css()</code>, <code>cx()</code> ou <code>variants()</code></strong> : ajoute ses classes.</li>
        <li><strong><code>on(...)</code></strong> : un écouteur d'événement ou un hook de cycle de vie.</li>
        <li><strong>Un autre constructeur, un <code>when()</code> ou un <code>list()</code></strong> : un enfant.</li>
        <li><strong>Un <code>Node</code> DOM</strong> : ajouté tel quel.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong> : un modificateur personnalisé. Voir ci-dessous.</li>
      </ul>
      <h3>Pièges</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> affiche le texte "false". Écrivez <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Les tableaux ne sont pas des enfants. Décomposez-les : <code>ul(...names.map((n) =&gt; li(n)))</code>. Pour les listes qui changent, utilisez <code>list()</code>.</li>
        <li>Une variable locale portant un nom de balise masque le constructeur. Dans <code>function Row(label: string)</code>, <code>label(...)</code> n'est pas appelable. Renommez les variables locales telles que <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> et <code>i</code>.</li>
        <li>Les navigateurs exposent chaque élément doté d'un <code>id</code> comme variable globale. Si la page contient <code>&lt;main id="main"&gt;</code> avant le chargement de Nuclo, Nuclo laisse cette globale en place, donc <code>main(...)</code> lève une <code>TypeError</code>. Utilisez d'autres ids.</li>
      </ul>
      <h3>Modificateurs personnalisés</h3>
      <p>Une fonction qui déclare au moins un paramètre s'exécute une fois, dans l'ordre des arguments, pendant la construction de l'élément. Son premier argument est l'élément. Le second est un index interne, ne vous y fiez pas. Si elle renvoie une chaîne ou un nombre, celui-ci devient du texte. Un <code>Node</code> est ajouté. Un objet est appliqué comme attributs.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Récupérer l'élément</h3>
      <p><code>render()</code> renvoie l'élément racine. Dans un arbre, utilisez <code>on("mount", (el) =&gt; …)</code> ou un modificateur personnalisé. Vous pouvez aussi appeler vous-même la fonction constructeur pour créer un élément détaché :</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Attachez-le avant le prochain <code>update()</code>. Un nœud qui n'est pas dans le document quand <code>update()</code> s'exécute cesse définitivement d'être mis à jour.</p>
      <h3>SVG</h3>
      <p>Les constructeurs SVG acceptent les mêmes arguments. Nuclo définit chaque attribut SVG avec <code>setAttribute</code>, donc des noms comme <code>"stroke-width"</code> fonctionnent tels quels.</p>
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
      <p>Un composant est une simple fonction qui renvoie un constructeur, comme <code>button(...)</code>. Il n'y a pas d'API de composant. Rien n'est créé tant que vous ne le rendez pas ou ne le placez pas dans un arbre.</p>
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
      <p>L'état déclaré à l'intérieur de la fonction appartient à cette instance. L'état déclaré à l'extérieur est partagé par toutes les instances. <code>forceUpdate()</code> appelle de nouveau les composants, ce qui réinitialise l'état déclaré à l'intérieur.</p>
      <p>Les enfants sont simplement des arguments :</p>
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
      <p>Passez un objet simple pour définir des attributs. Vous pouvez passer plusieurs objets. Pour une même clé, la dernière valeur l'emporte, sauf pour <code>className</code> et <code>style</code>, qui fusionnent. Une valeur peut être statique, ou une fonction sans paramètre réexécutée à chaque <code>update()</code>.</p>
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
        <li>Si l'élément HTML possède une propriété de ce nom (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo définit la propriété. Sinon, il appelle <code>setAttribute(key, String(value))</code>, par exemple pour <code>"aria-*"</code> et <code>"data-*"</code>.</li>
        <li>Sur les éléments SVG, Nuclo appelle toujours <code>setAttribute</code>.</li>
        <li><code>null</code> et <code>undefined</code> sont ignorés. Une valeur dynamique qui renvoie <code>null</code> ou <code>undefined</code> conserve l'ancienne valeur. Pour effacer une valeur, renvoyez <code>""</code>, ou <code>false</code> pour une propriété booléenne.</li>
        <li>Les booléens fonctionnent pour les propriétés DOM booléennes, telles que <code>disabled</code> sur un bouton, <code>checked</code>, <code>hidden</code> et <code>required</code>. Partout ailleurs, <code>true</code> et <code>false</code> sont écrits comme les chaînes "true" et "false".</li>
        <li>Utilisez des clés <code>"data-*"</code>. <code>dataset</code> n'est pas pris en charge.</li>
        <li><code>innerHTML</code> n'est pas échappé, et le rendu côté serveur ne le produit pas. Évitez-le.</li>
      </ul>
      <h3>Classes</h3>
      <p>Utilisez <code>className</code>. Les chaînes de classes statiques, les résultats de <code>css()</code> et un <code>className</code> dynamique fusionnent tous. Un <code>className</code> dynamique conserve les classes statiques, et quand il renvoie <code>""</code> seules les classes statiques restent.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>N'utilisez pas la clé <code>class</code> sur les éléments HTML. Elle définit l'attribut brut et remplace toutes les classes appliquées avant elle, y compris les classes <code>css()</code>.</p>
      <h3>Styles en ligne</h3>
      <p><code>style</code> accepte un objet avec des clés en camelCase, ou une fonction qui en renvoie un.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo n'ajoute aucune unité. Écrivez <code>"12px"</code>, pas <code>12</code>. Les propriétés sans unité comme <code>opacity</code> et <code>zIndex</code> acceptent des nombres.</li>
        <li><code>""</code>, <code>null</code> et <code>undefined</code> effacent une propriété.</li>
        <li>Un style dynamique ne définit que les clés qu'il renvoie. Une clé qu'il cesse de renvoyer conserve son ancienne valeur, donc renvoyez <code>""</code> pour l'effacer.</li>
        <li>Les chaînes de style (<code>"color: red"</code>) et les propriétés personnalisées (<code>"--gap"</code>) ne sont pas prises en charge. Utilisez <code>css()</code> à la place. Il accepte les propriétés personnalisées via <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Événements",
        content: `
      <p>Il existe deux façons d'écouter des événements : les attributs <code>on*</code> et le modificateur <code>on()</code>.</p>
      <h3>Attributs <code>on*</code></h3>
      <p>Dans un objet d'attributs, une fonction sous une clé telle que <code>onClick</code> (<code>on</code> suivi d'une majuscule) est un gestionnaire d'événement, pas une valeur dynamique.</p>
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
        <li>TypeScript déduit le type de l'événement à partir de la clé et de l'élément. <code>e.currentTarget</code> et <code>this</code> sont l'élément.</li>
        <li>Nuclo définit la propriété native, donc <code>onClick</code> devient <code>el.onclick</code>. Il y a un gestionnaire par événement : un <code>onClick</code> ultérieur remplace le précédent.</li>
        <li><code>onDoubleClick</code> et <code>onDblClick</code> désignent tous deux <code>dblclick</code>. Les clés en minuscules comme <code>onclick</code> sont des erreurs de type.</li>
        <li>Un nom qui n'est pas un événement connu écoute sa forme en minuscules : <code>onMyEvent</code> écoute <code>"myevent"</code>.</li>
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
        <li>Chaque <code>on()</code> ajoute un écouteur. Tous s'exécutent, dans l'ordre.</li>
        <li><code>options</code> est transmis directement à <code>addEventListener</code> : <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Passez <code>on()</code> directement à un constructeur et le type de l'élément est déduit : <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Si un écouteur lève une erreur, Nuclo la journalise avec <code>console.error</code>, et les autres écouteurs s'exécutent quand même.</li>
        <li>Nuclo retire l'écouteur quand il retire l'élément. Côté serveur, <code>on()</code> ne fait rien.</li>
        <li>Vous pouvez réutiliser une même valeur <code>on()</code> sur plusieurs éléments.</li>
      </ul>
      <p>Pour un événement personnalisé, passez le type de l'événement en générique :</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Lequel utiliser</h3>
      <p>Utilisez les attributs <code>on*</code> dans le cas général. Utilisez <code>on()</code> quand vous avez besoin de plusieurs écouteurs pour un événement, d'options d'écouteur, ou d'un nom d'événement personnalisé tel que <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Cycle de vie",
        content: `
      <p><code>onMount</code> s'exécute une fois, après l'insertion de l'élément. <code>onDestroy</code> s'exécute une fois, quand Nuclo retire l'élément. Écrivez-les comme attributs ou avec <code>on()</code>. Les deux formes se comportent de la même façon, et l'élément est typé d'après sa balise.</p>
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
      <h3>Quand ils s'exécutent</h3>
      <ul>
        <li><code>onMount</code> s'exécute à la fin de l'appel <code>render()</code>, <code>hydrate()</code>, <code>update()</code> ou <code>forceUpdate()</code> qui a inséré l'élément. Il ne s'exécute jamais pendant la construction de l'arbre.</li>
        <li>Si <code>onMount</code> renvoie une fonction, celle-ci s'exécute à la destruction, après les callbacks <code>onDestroy</code> de l'élément.</li>
        <li><code>onDestroy</code> s'exécute quand Nuclo retire l'élément : une ligne de <code>list()</code> est supprimée, une branche de <code>when()</code> change, un <code>into()</code> quitte sa région, ou <code>forceUpdate()</code> l'abandonne. Il s'exécute juste avant le retrait, l'élément est donc encore dans le document.</li>
      </ul>
      <h3>Retrait DOM manuel</h3>
      <p>Si vous retirez un élément vous-même, avec <code>node.remove()</code> ou <code>innerHTML = ''</code>, ses <code>onDestroy</code> et nettoyages ne s'exécutent jamais, et les timers continuent de tourner. Nuclo n'a pas de <code>unmount()</code>. Pour démonter une application avec nettoyage, enveloppez-la dans un <code>when()</code> :</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Ordre et erreurs</h3>
      <ul>
        <li>Vous pouvez enregistrer autant de hooks que vous voulez, sous l'une ou l'autre forme. Ils s'exécutent dans l'ordre d'enregistrement.</li>
        <li><code>onDestroy</code> exécute toujours les enfants d'abord, puis le parent.</li>
        <li>Les éléments sont montés dans l'ordre de leur premier hook <code>onMount</code>, qui suit l'ordre des arguments, et chaque élément exécute tous ses hooks ensemble. Passez le hook d'un parent avant ses enfants s'ils en dépendent.</li>
        <li>Une erreur levée par un hook est journalisée avec <code>console.error</code>. Les autres hooks s'exécutent quand même.</li>
        <li>Le callback doit renvoyer une fonction de nettoyage ou ne rien renvoyer ; ne le déclarez donc pas <code>async</code>. Une Promise renvoyée n'est jamais utilisée comme nettoyage. Démarrez le travail asynchrone à l'intérieur : <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Les hooks ne s'exécutent jamais côté serveur. Côté client, ils s'exécutent après <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Note :</strong> les hooks ne sont pas des effets. Ils ne se réexécutent jamais quand l'état change. Chacun s'exécute au plus une fois par élément.</div>
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
      <p>Nuclo ne met jamais la page à jour de lui-même. Modifiez votre état, puis appelez <code>update()</code>.</p>
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
      <p>Modifiez l'état autant que nécessaire, puis appelez <code>update()</code> une seule fois :</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Appelez <code>update()</code> depuis des gestionnaires d'événements, des timers, des callbacks de fetch ou <code>onMount</code>. Ne l'appelez pas depuis une valeur dynamique.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Valeurs dynamiques",
        content: `
      <p>Une fonction <strong>sans paramètre</strong> est une <strong>valeur dynamique</strong>. Nuclo l'exécute une fois à la construction de l'élément, puis à chaque <code>update()</code>. Utilisez les valeurs dynamiques pour les enfants texte, les valeurs d'attributs, <code>style</code> et <code>className</code>. Pour les enfants qui apparaissent, disparaissent ou se répètent, utilisez <a href="#api-when"><code>when()</code></a> et <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo vérifie le nombre de paramètres (<code>fn.length</code>). Une fonction qui déclare un paramètre est un <a href="#tag-builders">modificateur personnalisé</a> et ne s'exécute qu'une fois. <code>(x = 0) =&gt; …</code> et <code>(...args) =&gt; …</code> ont une longueur de 0, elles sont donc dynamiques.</p>
      <h3>Texte dynamique</h3>
      <ul>
        <li>Une chaîne, un nombre, un bigint ou un booléen est rendu comme <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> affiche "false", écrivez donc <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> et <code>undefined</code> sont rendus comme un texte vide.</li>
        <li>Un résultat de <code>css()</code> ou <code>cx()</code> à la première exécution fait de la fonction une classe dynamique, pas du texte. Voir <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Un nœud, un constructeur, un tableau ou un objet simple ne rend rien, et ne se met jamais à jour.</li>
      </ul>
      <h3>Attributs dynamiques</h3>
      <ul>
        <li>Nuclo n'écrit une valeur que si elle diffère de la dernière valeur qu'il a écrite. Il ne compare pas avec le DOM réel, donc si un utilisateur tape dans un champ et que votre fonction renvoie la même valeur qu'avant, le texte saisi reste.</li>
        <li>Un résultat <code>null</code> ou <code>undefined</code> n'écrit rien, l'ancienne valeur reste donc. <code>className</code> est l'exception : tout résultat falsy retire les classes dynamiques et conserve les statiques.</li>
        <li>Une fonction <code>style</code> applique l'objet renvoyé à chaque mise à jour.</li>
      </ul>
      <h3>Erreurs</h3>
      <p>Si une valeur dynamique lève une erreur, Nuclo l'intercepte et le reste de la mise à jour s'exécute quand même. Le texte devient vide ou conserve son ancienne valeur, et un attribut conserve son ancienne valeur. Les deux se rétablissent au prochain <code>update()</code> qui réussit. L'exception : une fonction texte qui lève une erreur à sa <strong>première</strong> exécution reste vide définitivement.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Exécute une passe synchrone sur chaque valeur dynamique de la page. Avec des ids, ne met à jour que ce qui se trouve dans les éléments marqués avec ces ids de <a href="#api-scope"><code>scope()</code></a>. Chaque passe exécute ces étapes dans l'ordre :</p>
      <ol>
        <li><code>list()</code> : relit les éléments et ajoute, déplace ou supprime des lignes.</li>
        <li><code>when()</code> : revérifie les conditions. Une branche n'est reconstruite que lorsqu'une autre branche devient active.</li>
        <li>Les attributs dynamiques, y compris <code>style</code> et <code>className</code>.</li>
        <li>Le texte dynamique.</li>
        <li><code>onMount</code> pour les éléments insérés par les étapes 1 et 2.</li>
      </ol>
      <ul>
        <li><strong>Tout est exécuté.</strong> Chaque valeur dynamique s'exécute à chaque appel, même si ses données n'ont pas changé. Seule l'écriture dans le DOM est évitée. Gardez les valeurs dynamiques rapides et sans effets de bord.</li>
        <li><strong>Seulement les nœuds du document.</strong> Si un nœud n'est pas dans le document quand <code>update()</code> s'exécute, Nuclo cesse de le suivre. Il ne se met plus jamais à jour, même après que vous l'avez attaché. Cela vaut aussi pour <code>list()</code> et <code>when()</code>. Rendez dans un conteneur qui est dans le document.</li>
        <li><strong>Les valeurs statiques ne changent jamais.</strong> Les chaînes et valeurs d'attributs simples sont fixées à la construction de l'élément. Pour les reconstruire, utilisez <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Erreurs.</strong> Les erreurs de texte et d'attributs sont interceptées, et la passe continue. Si une condition de <code>when()</code> lève une erreur, elle est journalisée et ce <code>when()</code> cesse de se mettre à jour. Si une fonction <code>items</code> ou <code>renderItem</code> d'un <code>list()</code> lève une erreur, celle-ci sort de <code>update()</code> et les étapes restantes ne s'exécutent pas.</li>
        <li><strong>Serveur.</strong> <code>update()</code> ne fait rien côté serveur.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Donne à l'élément auquel il est passé un ou plusieurs ids de portée. <code>update('id')</code> ne met alors à jour que ce qui se trouve dans cet élément, y compris ses propres attributs.</p>
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
        <li>Un élément peut avoir plusieurs ids : <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> met à jour tout ce qui se trouve dans <code>a</code> ou <code>b</code>. Si plusieurs éléments utilisent le même id, tous sont mis à jour.</li>
        <li>Avec des portées imbriquées, <code>update('outer')</code> inclut la portée interne. <code>update('inner')</code> ne touche pas à la portée externe.</li>
        <li>Un id qu'aucun élément du document ne possède ne met <strong>rien</strong> à jour et ne lève aucune erreur, vérifiez donc l'orthographe.</li>
        <li><code>scope()</code> ne fait rien côté serveur.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Rend du contenu selon une condition. Nuclo revérifie les conditions à chaque <code>update()</code>. La première condition vraie l'emporte. Si aucune n'est vraie, le contenu de <code>.else()</code> est rendu. Sans <code>.else()</code>, rien n'est rendu.</p>
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
      <h3>Conditions</h3>
      <ul>
        <li>Pour une condition qui dépend de l'état, passez une fonction. Un booléen simple est lu une seule fois : <code>when(open, …)</code> ne change jamais.</li>
        <li>En TypeScript, la fonction doit renvoyer un booléen. Écrivez <code>() =&gt; items.length &gt; 0</code> ou <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Ce qui est mis à jour</h3>
      <ul>
        <li>Tant que la même branche reste active, ses éléments sont conservés. Les valeurs dynamiques, les listes et les blocs <code>when()</code> qu'elle contient continuent de se mettre à jour.</li>
        <li>Quand une autre branche devient active, l'ancien contenu est retiré et ses hooks <code>onDestroy</code> s'exécutent. La nouvelle branche est construite de zéro et ses hooks <code>onMount</code> s'exécutent. L'état des anciens éléments, comme le texte d'un champ ou le focus, est perdu.</li>
      </ul>
      <h3>Contenu d'une branche</h3>
      <p>Placez des enfants dans une branche : du texte, du texte dynamique, des constructeurs, <code>list()</code> et des <code>when()</code> imbriqués. Passez des constructeurs comme <code>p('Hi')</code>, pas des nœuds DOM : un nœud DOM cesse de se mettre à jour dès que sa branche se cache une fois.</p>
      <p>Les objets d'attributs et <code>on()</code> dans une branche s'appliquent à l'élément parent, et restent après que la branche se cache. Pour un attribut conditionnel, utilisez un attribut dynamique : <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Chaînage</h3>
      <p><code>.when()</code> et <code>.else()</code> renvoient un nouveau constructeur et ne modifient pas l'original. Si vous appelez <code>.else()</code> deux fois, le dernier appel l'emporte.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Rend une ligne par élément. À chaque <code>update()</code>, Nuclo rappelle <code>items()</code> et fait correspondre les nouveaux éléments aux lignes existantes par identité (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Comment les lignes sont appariées</h3>
      <ul>
        <li>Un élément toujours présent conserve sa ligne. Nuclo déplace la ligne si nécessaire, et ne rappelle pas <code>renderItem</code>.</li>
        <li>Un nouvel élément reçoit une nouvelle ligne. Un élément supprimé perd sa ligne, et ses hooks <code>onDestroy</code> s'exécutent.</li>
        <li>Les éléments en double reçoivent chacun leur propre ligne.</li>
        <li>Vous pouvez modifier le tableau en place (<code>push</code>, <code>splice</code>, <code>sort</code>) ou renvoyer un nouveau tableau.</li>
      </ul>
      <p>Une ligne conservée n'est jamais rendue à nouveau, utilisez donc des valeurs dynamiques pour les champs qui changent :</p>
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
      <p>Les copies sont de nouveaux éléments, donc remplacer le tableau par <code>todos.map((t) =&gt; ({ ...t }))</code> reconstruit toutes les lignes.</p>
    `,
        afterContent: `
      <h3>Ce que renvoie <code>renderItem</code></h3>
      <ul>
        <li>Renvoyez un seul élément, tel que <code>li(...)</code>, <code>tr(...)</code> ou un constructeur SVG. Renvoyez <code>null</code> ou <code>undefined</code> pour ignorer un élément. Les chaînes, nœuds texte et fragments ne rendent rien.</li>
        <li>Ne renvoyez pas <code>when()</code> ou <code>list()</code> directement. Placez-les dans l'élément de ligne : <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Pour masquer des éléments, filtrez dans <code>items()</code>, pas dans <code>renderItem</code>.</li>
        <li>Gardez <code>renderItem</code> sans effets de bord. Nuclo peut l'appeler plusieurs fois pour le même élément.</li>
      </ul>
      <h3>L'index</h3>
      <p><code>index</code> est la position de l'élément au moment où sa ligne a été créée. Il n'est pas mis à jour quand les lignes se déplacent. Pour la position courante, utilisez une valeur dynamique : <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Itérables</h3>
      <p>Tout itérable fonctionne : tableaux, <code>Set</code>, générateurs et <code>map.values()</code>. Renvoyer le même tableau ou <code>Set</code> à chaque fois est correct. Un itérateur, comme un générateur ou <code>map.values()</code>, est épuisé après une passe, créez-le donc dans <code>items()</code> à chaque appel. Itérer directement une <code>Map</code> crée de nouveaux tableaux <code>[key, value]</code> à chaque fois, donc chaque ligne est reconstruite. Utilisez <code>map.values()</code> à la place.</p>
      <h3>Placement</h3>
      <p>Les lignes apparaissent à la position de <code>list()</code> parmi les éléments de même niveau, entre deux marqueurs de commentaire. Les autres enfants du parent ne sont pas touchés. <code>list()</code> fonctionne aussi dans les constructeurs SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() et into()",
        content: `
      <p><code>region()</code> marque un emplacement nommé dans l'arbre. <code>into()</code> le remplit depuis n'importe où ailleurs, à n'importe quelle profondeur. La mise en page ne reçoit pas le contenu en prop, et le composant qui construit le contenu ne sait pas où il atterrit.</p>
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
      <h3>Fonctionnement</h3>
      <ul>
        <li><code>into()</code> ne laisse qu'un commentaire à l'endroit où il est écrit. Son contenu est rendu entre les marqueurs de la région.</li>
        <li>L'ordre n'a pas d'importance. Un <code>into()</code> construit avant sa région attend et s'affiche dès que la région est construite. Les vues s'affichent dans l'ordre où elles ont été écrites.</li>
        <li>Le contenu vit aussi longtemps que la vue. Quand le <code>when()</code> qui contient un <code>into()</code> se ferme, ou que sa ligne de <code>list()</code> est supprimée, le contenu quitte la région. Le rouvrir ajoute une copie, pas deux.</li>
        <li>Quand une région disparaît, par exemple parce que son <code>when()</code> se ferme, ses vues se remettent en attente. Une région construite plus tard avec le même id les affiche.</li>
        <li>Un <code>into()</code> dont l'id ne correspond à aucune région ne rend rien et ne lève aucune erreur, vérifiez donc l'orthographe.</li>
        <li>Les ids sont uniques dans l'arbre. Une seconde région construite sous un id actif journalise un avertissement.</li>
        <li>Les régions fonctionnent avec le <a href="#api-ssr">rendu côté serveur</a>. Lors de <code>hydrate()</code>, chaque vue réutilise le HTML rendu par le serveur au lieu de le reconstruire.</li>
      </ul>
      <h3>Options</h3>
      <ul>
        <li><code>id</code> : le nom que les appels <code>into()</code> utilisent pour trouver la région.</li>
        <li><code>type</code> : <code>'latest'</code> (par défaut) n'affiche que la vue la plus récente. <code>'stack'</code> affiche toutes les vues, dans l'ordre d'arrivée.</li>
        <li><code>empty</code> : rendu tant que la région ne contient aucune vue.</li>
      </ul>
      <h3>Régions empilées</h3>
      <p>Avec <code>type: 'stack'</code>, une vue qui s'ouvre par-dessus une autre ne reconstruit pas celle du dessous. Son DOM, son focus et l'état de ses formulaires restent. Utilisez cela pour une couche telle qu'une boîte de dialogue au-dessus d'une page.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>Plusieurs régions à la fois</h3>
      <p>Passez un objet pour remplir plusieurs régions depuis un seul <code>into()</code>. Une valeur peut être un enfant ou un tableau d'enfants. Les deux formes s'imbriquent : un <code>into()</code> dans le contenu d'une autre vue cible sa propre région.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Une boîte de dialogue ouverte depuis le fond de l'arbre</h3>
      <p>La région de superposition se trouve à la racine. N'importe quel composant, à n'importe quelle profondeur, ouvre une boîte de dialogue en enveloppant un <code>into()</code> dans un <code>when()</code>. Fermer le <code>when()</code> retire la boîte de dialogue de la région.</p>
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
      <p>Chaque ligne d'un <code>list()</code> est une vue. Une région empilée les affiche dans l'ordre, et retirer un élément du tableau retire son toast.</p>
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
      <h3>Un titre de page défini par la page</h3>
      <p>Avec le <code>type: 'latest'</code> par défaut, la vue la plus récente l'emporte. La mise en page possède le titre, et la page ouverte le nomme. Une page sans <code>into('title', …)</code> laisse le texte <code>empty</code>.</p>
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
      <h3>Valeurs dynamiques dans une vue</h3>
      <p>Le contenu d'un <code>into()</code> est du contenu Nuclo ordinaire. Les fonctions qu'il contient sont des valeurs dépendant de l'état et se rafraîchissent à chaque <code>update()</code>, où que soit la région.</p>
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
      <p>Le <code>into()</code> du tableau de bord est écrit une seule fois. Tant que l'utilisateur est déconnecté, il n'y a pas de région <code>main</code>, la vue attend donc. La connexion construit la région et la vue s'affiche. La déconnexion retire la région et la vue se remet en attente.</p>
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
      <h3>Une vue avec sa propre région</h3>
      <p>Une vue peut contenir un <code>region()</code>, et d'autres vues peuvent le cibler. Ici, la page éditeur apporte avec elle une région <code>tabs</code>, et chaque onglet la remplit. Quand l'éditeur se ferme, sa région disparaît avec lui.</p>
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
      <h3>Exemple interactif</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> n'exécute que les valeurs dynamiques. Les valeurs statiques, comme le texte dans <code>h1(labels[lang].title)</code>, sont fixées à la construction de l'arbre. <code>forceUpdate()</code> rappelle vos composants et met à jour le DOM réel pour qu'il corresponde, valeurs statiques comprises. Utilisez-le pour des changements rares à l'échelle de l'application, comme le changement de langue. Utilisez <code>update()</code> pour tout le reste.</p>
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
      <p>Sans argument, <code>forceUpdate()</code> reconstruit chaque racine rendue avec <code>render(App)</code> ou <code>hydrate(App)</code>. Les racines rendues avec <code>render(App())</code> sont ignorées. Si un composant lève une erreur, elle est journalisée et cette racine conserve son ancien DOM. Une erreur levée plus tard, pendant l'application de la nouvelle construction, est aussi journalisée, mais les parties déjà mises à jour le restent.</p>
      <h3>Ce qui reste et ce qui change</h3>
      <ul>
        <li>Les enfants sont appariés dans l'ordre, par balise. Un élément correspondant est réutilisé, donc le focus et les valeurs saisies restent, et ses hooks <code>onMount</code> ne se réexécutent pas. Dès que la balise d'un enfant diffère, cet enfant et tous les éléments suivants de même niveau sont reconstruits.</li>
        <li>Le texte, les attributs, les classes, les styles, les écouteurs, les branches de <code>when()</code> et les lignes de <code>list()</code> suivent la nouvelle construction.</li>
        <li>Les nouveaux éléments sont créés, et leurs hooks <code>onMount</code> s'exécutent. Les éléments que la nouvelle construction ne produit plus sont retirés, et leurs hooks <code>onDestroy</code> s'exécutent.</li>
        <li>Les lignes de <code>list()</code> sont aussi appariées par position, pas par élément, donc un élément de ligne réutilisé peut finir par afficher un autre élément.</li>
        <li>Les attributs que la nouvelle construction ne définit plus ne sont pas retirés.</li>
      </ul>
      <div class="docs-callout"><strong>Attention :</strong> l'état déclaré dans une fonction composant est réinitialisé, parce que la fonction s'exécute à nouveau. Gardez l'état qui doit survivre en dehors du composant.</div>
      <p><strong>Forme explicite.</strong> <code>forceUpdate(App(), parent)</code> reconstruit un seul arbre dans <code>parent</code> et renvoie sa racine. Il n'enregistre pas la racine pour les appels suivants. Comme <code>hydrate()</code>, il attend que la racine soit le premier nœud de <code>parent</code>. Si le premier nœud a une balise différente, il est remplacé.</p>
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
      <p>Construit votre arbre et ajoute son élément racine à <code>parent</code>. <code>parent</code> vaut <code>document.body</code> par défaut. Renvoie l'élément racine.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Vous pouvez passer le composant (<code>render(App)</code>) ou le constructeur qu'il renvoie (<code>render(App())</code>). Le DOM est le même. Seul <code>render(App)</code> permet à <a href="#api-force-update"><code>forceUpdate()</code></a> de reconstruire la racine plus tard, préférez-le donc.</li>
        <li>Le contenu est ajouté sans vider <code>parent</code>. Deux appels ajoutent donc deux copies.</li>
        <li>Tous les <code>onMount</code> de l'arbre ont été exécutés quand <code>render()</code> rend la main.</li>
        <li>Rendez dans un élément qui est dans le document. Voir <a href="#api-update"><code>update()</code></a>.</li>
        <li>La racine doit être un élément, comme <code>div(...)</code>, pas un <code>when()</code> ou un <code>list()</code>.</li>
        <li><code>index</code> est interne. Il ne choisit pas où l'élément est inséré. Omettez-le.</li>
      </ul>
      <p>Un composant passé comme <code>render(App)</code> ne doit prendre aucun paramètre. Un paramètre obligatoire est une erreur de type. Un paramètre optionnel passe la vérification de types, mais <code>render()</code> lève une erreur à l'exécution. Enveloppez un composant qui prend des props :</p>
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
      <p>Prend en charge le HTML produit par <a href="#api-ssr"><code>renderToString()</code></a>. Réutilise les éléments existants, attache les écouteurs d'événements, et connecte les valeurs dynamiques, <code>when()</code> et <code>list()</code>, de sorte que <code>update()</code> fonctionne ensuite. Exécute ensuite les hooks <code>onMount</code>. <code>parent</code> vaut <code>document.body</code> par défaut. Renvoie l'élément racine.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Utilisez le même composant, et les mêmes données, que le serveur.</li>
        <li>Hydratez dans un conteneur dédié. La racine de l'application doit être son premier nœud, les espaces blancs étant tolérés. Si un autre nœud vient en premier, Nuclo remplace ce nœud et laisse la copie du serveur en place.</li>
        <li>Comme avec <code>render()</code>, passez <code>App</code>, pas <code>App()</code>, pour que <code>forceUpdate()</code> puisse reconstruire la racine plus tard. <code>App</code> ne doit prendre aucun paramètre. Avec un paramètre optionnel, <code>hydrate()</code> n'attache rien, silencieusement. Enveloppez un composant qui prend des props : <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>S'il n'y a pas de HTML serveur, utilisez <code>render()</code>.</li>
      </ul>
      <h3>Quand le serveur et le client diffèrent</h3>
      <p>Le client l'emporte :</p>
      <ul>
        <li>Une balise racine différente : ce nœud est remplacé par un DOM neuf. Un conteneur vide : un DOM neuf est ajouté.</li>
        <li>Un texte différent est corrigé. Les éléments de <code>list()</code> et les branches de <code>when()</code> différents suivent le client.</li>
        <li>Les enfants en trop côté serveur sont retirés, et ceux qui manquent sont créés.</li>
        <li>Les attributs écrits par le serveur mais non définis par le client sont laissés tels quels.</li>
      </ul>
      <p><code>renderToString()</code> écrit des commentaires HTML comme marqueurs, par exemple <code>&lt;!-- text-0 --&gt;</code> avant chaque nœud texte. <code>hydrate()</code> en a besoin, ne supprimez donc pas les commentaires du HTML serveur. Sans les marqueurs, l'hydratation supprime les lignes de <code>list()</code>, et <code>list()</code> et <code>when()</code> cessent de se mettre à jour.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Rendu côté serveur",
        content: `
      <p>Générez une chaîne HTML à partir d'un composant sur le serveur. Dans le navigateur, appelez <a href="#api-hydrate"><code>hydrate()</code></a> avec le même composant pour rendre ce HTML interactif. Les environnements serveur n'ont pas de <code>document</code>, importez donc <a href="#api-polyfill"><code>nuclo/polyfill</code></a> en premier.</p>
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
      <p>Conservez <code>id="nuclo-styles"</code> sur la balise style. Le client réutilise cet élément et n'ajoute que les nouvelles règles. Voir <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Ce qui s'exécute côté serveur</h3>
      <ul>
        <li>Chaque appel à <code>renderToString()</code> construit l'arbre et exécute chaque valeur dynamique une fois.</li>
        <li>Les gestionnaires d'événements, <code>onMount</code> et <code>onDestroy</code> ne s'exécutent jamais. <code>update()</code>, <code>scope()</code> et <code>forceUpdate()</code> ne font rien.</li>
        <li>Le rendu est synchrone. Chargez d'abord vos données, puis effectuez le rendu.</li>
        <li>Rien ne reste enregistré après un rendu, un même processus peut donc servir de nombreuses requêtes. Passez les données de la requête en arguments, par exemple <code>renderToString(Page(user))</code>. Les variables au niveau du module sont partagées par toutes les requêtes.</li>
        <li>N'appelez pas <code>render()</code> côté serveur. Il ajoute au <code>document.body</code> partagé.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Accepte un constructeur (<code>App()</code>), un composant (<code>App</code>) ou un nœud DOM. <code>null</code> et <code>undefined</code> renvoient <code>""</code>. La racine doit être un élément. Un composant passé comme <code>renderToString(Page)</code> ne doit prendre aucun paramètre, passez donc <code>Page(user)</code> pour un composant qui prend des données.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Le texte et les valeurs d'attributs sont échappés en HTML. Le texte dans <code>script()</code> et <code>style()</code> est écrit tel quel, seules les balises fermantes étant découpées, n'y placez donc jamais de saisie utilisateur.</li>
        <li>Il ne lève pas d'erreur. Si le composant, une fonction de <code>list()</code> ou une condition de <code>when()</code> lève une erreur, ou si le polyfill manque, il journalise l'erreur et renvoie <code>""</code>. Vérifiez si le résultat est vide lorsque la requête doit échouer. Une fonction de texte ou d'attribut qui lève une erreur ne rend qu'un contenu vide.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Équivalent à <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Enveloppe la sortie dans un élément. <code>containerTag</code> vaut <code>"div"</code> par défaut, et <code>containerAttrs</code> vaut <code>{}</code>. Les valeurs d'attributs sont échappées. Les noms d'attributs sont écrits tels quels, utilisez donc des noms HTML comme <code>class</code>. Ne passez jamais de saisie utilisateur comme balise.</p>
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
      <p>Un petit DOM pour que Nuclo puisse construire des arbres dans Node et Bun. Importez-le une fois, avant votre premier rendu. La plupart des applications n'ont besoin que de l'import simple.</p>
      <ul>
        <li>Quand il n'y a pas de <code>window</code>, il définit <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> et <code>HTMLElement</code>, mais seulement ceux qui manquent. Il ne crée pas <code>window</code>.</li>
        <li>Dans un navigateur, ou sous jsdom, il ne fait rien.</li>
        <li><code>Event</code> et <code>CustomEvent</code> sont les constructeurs propres à l'environnement. <code>Node</code>, <code>Element</code> et <code>HTMLElement</code> sont des alias des classes du polyfill.</li>
      </ul>
      <p>C'est un DOM pour construire des arbres, pas un navigateur. Il n'a ni <code>innerHTML</code> ni <code>getElementById</code>, <code>querySelector()</code> renvoie <code>null</code>, et les écouteurs d'événements sont ignorés. Utilisez <code>renderToString()</code> pour obtenir le HTML.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
