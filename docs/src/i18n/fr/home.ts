// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · zéro dépendance`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Construisez des interfaces", "*explicites*", "avec nuclo."];

export const HERO_DESC =
  "Un petit framework DOM, typé de bout en bout. Votre état reste ordinaire et mutable, et c'est vous qui décidez quand l'écran se met à jour. Pas de proxies, pas de signaux, pas de DOM virtuel.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "dépendance" },
  { num: "175", sup: "",   label: "constructeurs HTML et SVG typés" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "Ko", label: "runtime principal, compressé avec gzip" },
];

export const COUNTER_TEASER_CODE = `import 'nuclo'

let count = 0

export function Counter() {
  return div(
    span(() => count),
    button("-", { onClick: () => { count--; update() } }),
    button("Reset", { onClick: () => { count = 0; update() } }),
    button("+", { onClick: () => { count++; update() } }),
  )
}`;

export const TODO_TEASER_CODE = `import 'nuclo'

interface Todo {
  text: string
  done: boolean
}

let todos: Todo[] = []
let text = ''

function addTodo() {
  if (!text.trim()) return
  todos.push({ text, done: false })
  text = ''
  update()
}

export function TodoList() {
  return div(
    input(
      { placeholder: 'Add a task…' },
      { onInput: (e) => { text = (e.target as HTMLInputElement).value } },
      { onKeyDown: (e) => { if (e.key === 'Enter') addTodo() } },
    ),
    button('Add', { onClick: addTodo }),
    list(
      () => todos,
      (todo) => div(
        input(
          { type: 'checkbox' },
          { checked: () => todo.done },
          { onChange: () => { todo.done = !todo.done; update() } },
        ),
        span(todo.text),
      ),
    ),
  )
}`;

export const PHILOSOPHY_QUOTE =
  "Vous modifiez l'état : rien ne bouge. Vous appelez update() : Nuclo fait exactement ce que vous lui demandez. Ni plus, ni moins.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "L'explicite vaut mieux que l'implicite",
    desc: "Aucun proxy ne guette vos moindres gestes. Vous changez l'état, puis vous appelez update(). Cause et effet restent lisibles, et le comportement prévisible.",
  },
  {
    num: "02",
    title: "Regroupez vos changements, puis mettez à jour",
    desc: "Dix modifications, un seul update(). Le DOM ne voit que l'état final, sans rendu intermédiaire inutile.",
  },
  {
    num: "03",
    title: "Des fonctions, pas des composants",
    desc: "Du JavaScript tout simple : ni classes, ni décorateurs, ni syntaxe maison. Chaque fonction retourne des nœuds DOM, et onMount et onDestroy s'ajoutent comme n'importe quel modificateur, seulement quand vous en avez besoin.",
  },
];

export const FEATURES = [
  {
    num: "01 · Explicite",
    title: "Vous contrôlez le cycle de mise à jour",
    desc: "Modifiez l'état à votre guise, puis appelez update() une fois. Pas d'abonnements, pas de scheduler, pas de diff qui vous surprend : le DOM se synchronise quand vous le décidez.",
  },
  {
    num: "02 · Léger",
    title: "Zéro dépendance",
    desc: `Environ ${NUCLO_GZIP_KB} Ko pour le runtime principal en gzip. Pas de compilateur, pas de plugin de build : un import, et vous écrivez votre interface.`,
  },
  {
    num: "03 · Typé",
    title: "Pensé pour TypeScript",
    desc: "175 constructeurs HTML et SVG entièrement typés : l'autocomplétion couvre chaque attribut, chaque propriété de style et chaque événement.",
  },
  {
    num: "04 · Précis",
    title: "Mises à jour ciblées du DOM",
    desc: "Les expressions dynamiques sont réévaluées à chaque update(), mais seules les valeurs qui ont réellement changé sont écrites dans le DOM.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Modifier",
    title: "Changez vos données",
    desc: "L'état, c'est du JavaScript tout bête : variables, tableaux, objets. Modifiez-le comme vous voulez, autant de fois qu'il le faut.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Valider",
    title: "Appelez update()",
    desc: "Une seule fonction globale pour valider vos changements. Enchaînez une douzaine de mutations, puis validez une fois. Rien n'est rendu tant que vous ne l'avez pas demandé.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Synchroniser",
    title: "Nuclo synchronise le DOM",
    desc: "Chaque expression dynamique est réévaluée, et Nuclo n'écrit dans le DOM que ce qui a vraiment changé. Pas de diff, pas de re-render.",
    code: `<span class="cm">// 2 nœuds patchés,</span>
<span class="cm">// tout le reste intact</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Pas de diff. Pas de proxies. Pas de surprises.";
export const COMPARISON_SUB =
  "Nuclo ne touche à l'interface que lorsque vous appelez update().";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "DOM virtuel",
    sub: "rendu → comparaison → application",
    items: [
      { good: false, text: "Effectue un nouveau rendu des arbres de composants à chaque changement d'état" },
      { good: false, text: "Compare l'ancien et le nouvel arbre pour trouver ce qui a changé" },
      { good: false, text: "A besoin de mémoïsation pour regagner en performance" },
      { good: false, text: "Impose de gérer les closures obsolètes et les tableaux de dépendances" },
    ],
  },
  {
    name: "Signaux et proxies",
    sub: "signaux · stores · effets",
    items: [
      { good: false, text: "Enveloppe votre état dans des proxies et des abonnements" },
      { good: false, text: "Suit les dépendances de façon invisible, à l'exécution" },
      { good: false, text: "Propage les mises à jour selon un ordonnancement que vous ne contrôlez pas" },
      { good: false, text: "Est difficile à parcourir pas à pas dans un débogueur" },
    ],
  },
  {
    name: "Nuclo",
    sub: "modifier → update()",
    featured: true,
    items: [
      { good: true, text: "Un état mutable ordinaire, sans enveloppe et sans proxies" },
      { good: true, text: "Tout le modèle mental tient dans un appel : update()" },
      { good: true, text: "Ne met à jour que les valeurs qui ont changé" },
      { good: true, text: `Environ ${NUCLO_GZIP_KB} Ko, zéro dépendance, pensé pour TypeScript` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Rapide là où ça compte vraiment.";
export const BENCHMARK_SUB =
  "Des mesures indépendantes issues de js-framework-benchmark : création, mise à jour, échange et suppression de milliers de lignes.";

export const BENCHMARK_NOTE =
  "Le score est un temps d'exécution rapporté à l'implémentation la plus rapide : une moyenne géométrique pondérée de tous les benchmarks keyed.";

export const BENCHMARK_SOURCE_URL =
  "https://krausest.github.io/js-framework-benchmark/2026/chrome152.html";

export const BENCHMARK_SOURCE_LABEL = "js-framework-benchmark · keyed";

/** Weighted geometric mean per framework (keyed implementations, lower is better). */
export const BENCHMARK_ENTRIES: {
  name: string;
  version: string;
  score: number;
  featured?: boolean;
}[] = [
  { name: "Nuclo",    version: "0.2.24", score: 1.12, featured: true },
  { name: "Solid",    version: "1.9.3",  score: 1.13 },
  { name: "Svelte",   version: "5.42.1", score: 1.17 },
  { name: "Vue",      version: "3.5.39", score: 1.31 },
  { name: "Riot",     version: "10.1.2", score: 1.54 },
  { name: "React",    version: "19.2.0", score: 1.58 },
  { name: "Angular",  version: "22.0.0", score: 1.58 },
  { name: "Stencil",  version: "4.23.0", score: 1.81 },
  { name: "Ember",    version: "7.3.0-alpha.5", score: 2.06 },
  { name: "Knockout", version: "3.5.1",  score: 2.26 },
  { name: "Qwik",     version: "1.11.0", score: 3.29 },
];

// ── CTA ─────────────────────────────────────────────────────────────────────
export const CTA_TITLE = "À vous de jouer.";
export const CTA_SUB =
  "Installez Nuclo, importez-le une fois, et livrez des interfaces qui se mettent à jour pile quand vous le voulez. Toute l'API s'apprend en un après-midi.";

export const QUICK_START_STEPS = [
  {
    num: "01 - INSTALLER",
    title: "Installer",
    desc: "Ajoutez Nuclo à votre projet avec npm, pnpm, yarn ou bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - IMPORTER",
    title: "Importer",
    desc: "Un seul import à effet de bord enregistre les 175 constructeurs de balises globalement.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - CONSTRUIRE",
    title: "Construire",
    desc: "Écrivez des fonctions ordinaires qui retournent des nœuds DOM. Appelez update() quand l'état change.",
    code: `<span class="kw">let</span> <span class="pr">name</span> <span class="pt">=</span> <span class="st">'World'</span>

<span class="kw">const</span> <span class="pr">app</span> <span class="pt">=</span> <span class="fn">div</span><span class="pt">(</span>
  <span class="fn">h1</span><span class="pt">(()</span> <span class="pt">=></span> <span class="pt">\`</span><span class="st">Hello, </span><span class="pt">\${</span><span class="pr">name</span><span class="pt">}\`),</span>
  <span class="fn">button</span><span class="pt">(</span>
    <span class="st">"Change"</span><span class="pt">,</span>
    <span class="pt">{</span> <span class="pr">onClick</span><span class="pt">:</span> <span class="pt">()</span> <span class="pt">=></span> <span class="pt">{</span>
      <span class="pr">name</span> <span class="pt">=</span> <span class="st">'Nuclo'</span>
      <span class="fn">update</span><span class="pt">()</span>
    <span class="pt">} }</span>
  <span class="pt">)</span>
<span class="pt">)</span>`,
    lang: "app.ts",
  },
];

// ── Section chrome: headings, buttons and labels written inline in home/components.ts ──
export const LABELS = {
  getStarted: "Commencer",
  viewExamples: "Voir les exemples",
  copyInstall: "Copier la commande d'installation",
  howItWorks: "Comment ça marche",
  pipelineTitle: "Un seul cycle explicite.",
  pipelineSub: "Des valeurs liées à l'état, sans graphe de dépendances ni scheduler. C'est vous qui décidez quand elles sont évaluées : un seul chemin, prévisible, de vos données jusqu'à l'écran.",
  philosophy: "Philosophie",
  features: "Fonctionnalités",
  featuresTitle: "Pensé pour y voir clair.",
  featuresSub: "Pas de magie, pas de surprises. Chaque mise à jour est voulue.",
  comparison: "Comparaison",
  theNucloWay: "la méthode nuclo",
  benchmarks: "Benchmarks",
  lowerIsBetter: "Plus bas, c'est mieux",
  benchmarkSource: "Source : js-framework-benchmark",
  quickStart: "Démarrage rapide",
  quickStartTitle: "Prêt en quelques minutes.",
  quickStartSub: "Trois étapes, et vous construisez déjà de vraies interfaces.",
  readFullDocs: "Lire la documentation complète →",
  examples: "Exemples",
  examplesTitle: "Voyez-le tourner.",
  examplesSub: "Des démos interactives, avec le code de chacune à portée de clic.",
  viewAllExamples: "Voir tous les exemples →",
  readTheDocs: "Lire la documentation",
  addATask: "Ajouter une tâche…",
  add: "Ajouter",
  reset: "Réinitialiser",
  // The hero card
  previousExample: "Exemple précédent",
  nextExample: "Exemple suivant",
  closeCodeView: "Fermer la vue du code",
  example: (n: number, title: string) => `Exemple ${n} : ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Peignez, puis update()",
    note: "La grille de gauche est un simple tableau de booléens : la peindre ne fait que modifier ce tableau. Le DOM à droite ne bouge que quand update() s'exécute, et alors seules les cellules qui ont changé sont mises à jour.",
  },
  Draw: {
    title: "Dessinez le logo",
    note: "Le logo Nuclo est un spirographe : une roue qui roule à l'intérieur d'un anneau, deux stylos dessus. La roue, ses bras, les stylos et les lignes sont tous des fonctions d'un seul nombre, t. La timeline et la boucle d'animation ne font que fixer t ; update('draw') réexécute ce qui le lit.",
  },
  Fireworks: {
    title: "Touchez le ciel",
    note: "Chaque étincelle est un objet ordinaire dans un tableau. list() donne à chacune une <line>, et la retire à l'image où son objet quitte le tableau. Un update() par image ; rien n'est comparé.",
  },
  Waves: {
    title: "Courbez la vague",
    note: "Le d de chaque path est une simple fonction de trois nombres. Les curseurs et la boucle d'animation ne changent que les nombres ; update('waves') réexécute les fonctions qui les lisent.",
  },
  Sort: {
    title: "Trié, jamais reconstruit",
    note: "Le tri à bulles échange des objets dans un tableau ordinaire. list() associe chaque barre à son objet, update() déplace donc les nœuds existants dans le nouvel ordre. Regardez le compteur : aucune barre n'est jamais recréée.",
  },
  Chase: {
    title: "Guidez la corde",
    note: "La carte est un scope(). Chaque image déplace 32 points ordinaires et appelle update('chase') : Nuclo recalcule les attributs de cette carte et laisse le reste de la page tranquille.",
  },
  Reflex: {
    title: "Appuyez sur le vert",
    note: "Une simple chaîne de caractères détermine ce que la scène affiche. Chaque branche when() est construite quand sa condition devient vraie et retirée quand elle cesse de l'être ; la classe de la scène est une fonction de la même chaîne.",
  },
  Warp: {
    title: "Maintenez pour accélérer",
    note: "onMount démarre la boucle d'animation et renvoie une fonction de nettoyage. Démontez le champ et Nuclo exécute ce nettoyage : la boucle s'arrête et rien ne reste en cours.",
  },
  Life: {
    title: "Jeu de la vie",
    note: "Le plateau est un simple tableau d'âges. Chaque pas calcule le tableau suivant et appelle update() ; la classe de chaque cellule est une fonction de son âge, seules les cellules qui ont changé sont donc patchées.",
  },
};
