import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "Introdução",
    sections: [
      {
        id: "overview",
        title: "Visão geral",
        content: `
      <p>Nuclo é uma pequena biblioteca DOM para TypeScript. Você constrói a página com funções simples como <code>div()</code> e <code>button()</code>, mantém o estado em variáveis comuns e chama <code>update()</code> quando a página deve mudar.</p>
      <p>Nuclo não tem DOM virtual, compilador, proxies nem signals.</p>
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
      <h3>O modelo mental</h3>
      <ol>
        <li>Construa a UI com construtores de tags.</li>
        <li>Passe uma função para cada valor que depende do estado.</li>
        <li>Altere o estado com JavaScript comum.</li>
        <li>Chame <code>update()</code>. Nuclo executa as funções de novo e aplica as mudanças no DOM.</li>
      </ol>
      <p>Alterar uma variável não toca o DOM. A página só muda quando você chama <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Início rápido",
        content: `
      <p><code>create-nuclo</code> gera um projeto Vite e TypeScript pronto para o Nuclo:</p>
    `,
        afterContent: `
      <p>Ele pede o nome do projeto. Para pular a pergunta, passe o nome e as flags. Com npm, coloque <code>--</code> antes das flags:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Depois instale e inicie o servidor de desenvolvimento:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Opções</h3>
      <ul>
        <li><code>[project-name]</code>: a pasta de destino. O padrão é <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: o template a copiar. Hoje só existe <code>basic</code>.</li>
        <li><code>-y, --yes</code>: usar os valores padrão sem fazer perguntas.</li>
        <li><code>-f, --force</code>: escrever em uma pasta que não está vazia.</li>
        <li><code>-h, --help</code>: exibir a ajuda.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Instalação e imports",
        content: `
      <p>Para adicionar o Nuclo a um projeto existente:</p>
      ${sh("npm install nuclo")}
      <p>Ou use <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> ou <code>bun add nuclo</code>. Nuclo não tem dependências.</p>
      <p>Roteamento não faz parte do pacote principal. Ele é distribuído separadamente como <a href="#router-overview"><code>nuclo-router</code></a>, que você instala ao lado de <code>nuclo</code> quando precisar.</p>
      <h3>Globais</h3>
      <p><code>import 'nuclo'</code> coloca o seguinte em <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 construtores de tags</strong>: 112 para HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) e 63 para SVG, com o sufixo <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). Veja <a href="#tag-builders">Construtores de tags</a>.</li>
        <li><strong>16 helpers</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code>.</li>
      </ul>
      <p>O import precisa rodar antes de qualquer código que chame um construtor. Módulos ES executam na ordem dos imports, então isto falha:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Coloque <code>import 'nuclo'</code> primeiro no seu arquivo de entrada, ou importe-o em cada arquivo que usa os globais.</p>
      <h3>Imports nomeados</h3>
      <p>Os helpers também são exports nomeados. São as mesmas funções dos globais. <code>getCssText()</code> e <code>resetStyles()</code> existem apenas como exports nomeados. Construtores de tags existem apenas como globais, então <code>import { div } from 'nuclo'</code> não funciona.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Pontos de entrada</h3>
      <ul>
        <li><code>nuclo</code>: registra os globais e exporta os 16 helpers mais <code>getCssText</code> e <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> e <code>getCssText</code>. Veja <a href="#api-ssr">Renderização no servidor</a>.</li>
        <li><code>nuclo/polyfill</code>: um DOM pequeno para Node e Bun. Veja <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: apenas tipos. Veja <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo traz seus próprios tipos. Você precisa de duas coisas:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> e <code>nodenext</code> ainda não são suportados.</li>
        <li>A lib <code>DOM</code>. O TypeScript a inclui por padrão quando você não define <code>lib</code>.</li>
      </ul>
      <p>Se qualquer arquivo do projeto importa <code>'nuclo'</code>, todos os arquivos veem os tipos globais. Você não precisa de mais nada. Se nenhum arquivo o importa, por exemplo em um tsconfig separado para testes, adicione os tipos você mesmo:</p>
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
      <p>Ou adicione <code>/// &lt;reference types="nuclo/types" /&gt;</code> a um arquivo <code>.d.ts</code>.</p>
      <h3>Tipos úteis</h3>
      <p>Estes tipos são globais, então você os usa sem import:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: o que um construtor de tag retorna. Use como tipo de retorno de um componente.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: qualquer coisa que um construtor de tag aceita como argumento.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: o que <code>render()</code> e <code>hydrate()</code> retornam.</li>
        <li><code>ElementTagName</code>: qualquer nome de tag HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: o objeto de atributos que um construtor de tag aceita, incluindo handlers <code>on*</code>, <code>onMount</code> e <code>onDestroy</code>. Use em componentes que repassam atributos.</li>
        <li><code>MountCallback</code> e <code>DestroyCallback</code>: handlers de <code>onMount</code> e <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: o que <code>when()</code> e <code>list()</code> retornam.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: as opções que <code>region()</code> recebe.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> e os demais tipos de estilização. Estes também podem ser importados: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> marca todos os membros do DOM como opcionais. Faça um cast quando precisar do tipo completo do elemento: <code>render(App, root) as HTMLDivElement</code>.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "Construindo a UI",
    sections: [
      {
        id: "tag-builders",
        title: "Construtores de tags",
        content: `
      <p>Toda tag HTML é uma função global com o mesmo nome: <code>div</code>, <code>span</code>, <code>input</code>, … A única exceção é <code>&lt;var&gt;</code>, que é <code>var_</code> porque <code>var</code> é uma palavra reservada. Toda tag SVG tem o sufixo <code>Svg</code>: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Chamar um construtor de tag ainda não cria um elemento. <code>div('Hi')</code> retorna um <strong>builder</strong>: uma função que cria o elemento depois. Nuclo o chama quando você o monta com <code>render()</code> ou o coloca dentro de outro builder, <code>when()</code> ou <code>list()</code>. Cada uso cria um elemento novo.</p>
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
      <p>Um builder recebe qualquer número de argumentos e os aplica da esquerda para a direita:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: um nó de texto.</li>
        <li><strong><code>() =&gt; value</code></strong>: texto que muda em <code>update()</code>. Veja <a href="#dynamic-functions">Valores dinâmicos</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: ignorados.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: renderizados como o texto "true" ou "false". Use <code>when()</code> para condições.</li>
        <li><strong>Um objeto simples</strong>: atributos. Veja <a href="#attributes">Atributos</a>.</li>
        <li><strong>Um resultado de <code>css()</code>, <code>cx()</code> ou <code>variants()</code></strong>: adiciona suas classes.</li>
        <li><strong><code>on(...)</code></strong>: um listener de evento ou hook de ciclo de vida.</li>
        <li><strong>Outro builder, <code>when()</code> ou <code>list()</code></strong>: um filho.</li>
        <li><strong>Um <code>Node</code> do DOM</strong>: anexado como está.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: um modificador personalizado. Veja abaixo.</li>
      </ul>
      <h3>Armadilhas</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> renderiza o texto "false". Escreva <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Arrays não são aceitos como filhos. Use o operador spread: <code>ul(...names.map((n) =&gt; li(n)))</code>. Para listas que mudam, use <code>list()</code>.</li>
        <li>Uma variável local com nome de tag esconde o construtor. Dentro de <code>function Row(label: string)</code>, <code>label(...)</code> não é chamável. Renomeie variáveis locais como <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> e <code>i</code>.</li>
        <li>Navegadores expõem todo elemento com <code>id</code> como uma variável global. Se a página contém <code>&lt;main id="main"&gt;</code> antes do Nuclo carregar, Nuclo preserva essa variável global, então <code>main(...)</code> lança um <code>TypeError</code>. Use outros ids.</li>
      </ul>
      <h3>Modificadores personalizados</h3>
      <p>Uma função que declara pelo menos um parâmetro roda uma vez, na ordem dos argumentos, enquanto o elemento é construído. Seu primeiro argumento é o elemento. O segundo é um índice interno, então não dependa dele. Se ela retorna uma string ou number, isso vira texto. Um <code>Node</code> é anexado. Um objeto é aplicado como atributos.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Obtendo o elemento</h3>
      <p><code>render()</code> retorna o elemento raiz. Dentro de uma árvore, use <code>on("mount", (el) =&gt; …)</code> ou um modificador personalizado. Você também pode chamar a função builder você mesmo para criar um elemento fora do documento:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Anexe-o antes do próximo <code>update()</code>. Um nó que não está no documento quando <code>update()</code> roda deixa de ser atualizado permanentemente.</p>
      <h3>SVG</h3>
      <p>Construtores SVG recebem os mesmos argumentos. Nuclo define todo atributo SVG com <code>setAttribute</code>, então nomes como <code>"stroke-width"</code> funcionam exatamente como foram escritos.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Todos os construtores</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Componentes",
        content: `
      <p>Um componente é uma função simples que retorna um builder, como <code>button(...)</code>. Não há API de componentes. Nada é criado até você renderizá-lo ou colocá-lo em uma árvore.</p>
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
      <p>Estado declarado dentro da função pertence àquela instância. Estado declarado fora é compartilhado por todas as instâncias. <code>forceUpdate()</code> chama os componentes de novo, o que reinicia o estado declarado dentro deles.</p>
      <p>Filhos são apenas argumentos:</p>
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
      <p>Passe um objeto simples para definir atributos. Você pode passar vários objetos. Para a mesma chave, o último valor vence, exceto <code>className</code> e <code>style</code>, que são mesclados. Um valor pode ser estático, ou uma função sem parâmetros que roda de novo em cada <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Como um valor é definido</h3>
      <ul>
        <li>Se o elemento HTML tem uma propriedade com aquele nome (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo define a propriedade. Caso contrário, chama <code>setAttribute(key, String(value))</code>, por exemplo para <code>"aria-*"</code> e <code>"data-*"</code>.</li>
        <li>Em elementos SVG, Nuclo sempre chama <code>setAttribute</code>.</li>
        <li><code>null</code> e <code>undefined</code> são ignorados. Um valor dinâmico que retorna <code>null</code> ou <code>undefined</code> mantém o valor antigo. Para limpar um valor, retorne <code>""</code>, ou <code>false</code> para uma propriedade booleana.</li>
        <li>Booleanos funcionam para propriedades booleanas do DOM, como <code>disabled</code> em um botão, <code>checked</code>, <code>hidden</code> e <code>required</code>. Em qualquer outro lugar, <code>true</code> e <code>false</code> são escritos como as strings "true" e "false".</li>
        <li>Use chaves <code>"data-*"</code>. <code>dataset</code> não é suportado.</li>
        <li><code>innerHTML</code> não é escapado, e a renderização no servidor não o emite. Evite-o.</li>
      </ul>
      <h3>Classes</h3>
      <p>Use <code>className</code>. Strings de classe estáticas, resultados de <code>css()</code> e um <code>className</code> dinâmico são todos mesclados. Um <code>className</code> dinâmico mantém as classes estáticas, e quando retorna <code>""</code> só as classes estáticas permanecem.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Não use a chave <code>class</code> em elementos HTML. Ela define o atributo bruto e substitui toda classe aplicada antes dela, incluindo classes de <code>css()</code>.</p>
      <h3>Estilos inline</h3>
      <p><code>style</code> recebe um objeto com chaves em camelCase, ou uma função que retorna um.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo não adiciona unidades. Escreva <code>"12px"</code>, não <code>12</code>. Propriedades sem unidade, como <code>opacity</code> e <code>zIndex</code>, aceitam números.</li>
        <li><code>""</code>, <code>null</code> e <code>undefined</code> limpam uma propriedade.</li>
        <li>Um style dinâmico define apenas as chaves que retorna. Uma chave que ele deixa de retornar mantém o valor antigo, então retorne <code>""</code> para limpá-la.</li>
        <li>Strings de estilo (<code>"color: red"</code>) e propriedades personalizadas (<code>"--gap"</code>) não são suportadas. Use <code>css()</code> em vez disso. Ele aceita propriedades personalizadas via <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Eventos",
        content: `
      <p>Há duas formas de ouvir eventos: atributos <code>on*</code> e o modificador <code>on()</code>.</p>
      <h3>Atributos <code>on*</code></h3>
      <p>Em um objeto de atributos, uma função sob uma chave como <code>onClick</code> (<code>on</code> seguido de letra maiúscula) é um handler de evento, não um valor dinâmico.</p>
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
        <li>O TypeScript infere o tipo do evento a partir da chave e do elemento. <code>e.currentTarget</code> e <code>this</code> são o elemento.</li>
        <li>Nuclo define a propriedade nativa, então <code>onClick</code> vira <code>el.onclick</code>. Há um handler por evento: um <code>onClick</code> posterior substitui um anterior.</li>
        <li><code>onDoubleClick</code> e <code>onDblClick</code> significam ambos <code>dblclick</code>. Chaves em minúsculas, como <code>onclick</code>, são erros de tipo.</li>
        <li>Um nome que não é um evento conhecido escuta sua forma em minúsculas: <code>onMyEvent</code> escuta <code>"myevent"</code>.</li>
        <li>Erros lançados pelo handler não são capturados.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> retorna um modificador que chama <code>addEventListener</code> no elemento.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Cada <code>on()</code> adiciona um listener. Todos rodam, em ordem.</li>
        <li><code>options</code> vai direto para <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Passe <code>on()</code> diretamente a um builder e o tipo do elemento é inferido: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Se um listener lança um erro, Nuclo o registra com <code>console.error</code>, e os outros listeners ainda rodam.</li>
        <li>Nuclo remove o listener quando remove o elemento. No servidor, <code>on()</code> não faz nada.</li>
        <li>Você pode reutilizar um mesmo valor de <code>on()</code> em vários elementos.</li>
      </ul>
      <p>Para um evento personalizado, passe o tipo do evento como genérico:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Qual usar</h3>
      <p>Use atributos <code>on*</code> no caso comum. Use <code>on()</code> quando precisar de mais de um listener para um evento, de opções de listener, ou de um nome de evento personalizado como <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Ciclo de vida",
        content: `
      <p><code>onMount</code> roda uma vez, depois que o elemento é inserido. <code>onDestroy</code> roda uma vez, quando Nuclo remove o elemento. Escreva-os como atributos ou com <code>on()</code>. As duas formas se comportam igual, e o elemento é tipado a partir da sua tag.</p>
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
      <h3>Quando eles rodam</h3>
      <ul>
        <li><code>onMount</code> roda no fim da chamada de <code>render()</code>, <code>hydrate()</code>, <code>update()</code> ou <code>forceUpdate()</code> que inseriu o elemento. Nunca roda enquanto a árvore está sendo construída.</li>
        <li>Se <code>onMount</code> retorna uma função, essa função roda na destruição, depois dos callbacks <code>onDestroy</code> do elemento.</li>
        <li><code>onDestroy</code> roda quando Nuclo remove o elemento: uma linha de <code>list()</code> é removida, um ramo de <code>when()</code> troca, um <code>into()</code> sai de sua região, ou <code>forceUpdate()</code> o descarta. Roda logo antes da remoção, então o elemento ainda está no documento.</li>
      </ul>
      <h3>Remoção direta do DOM</h3>
      <p>Se você remove um elemento por conta própria, com <code>node.remove()</code> ou <code>innerHTML = ''</code>, seu <code>onDestroy</code> e suas funções de limpeza nunca rodam, e timers continuam rodando. Nuclo não tem <code>unmount()</code>. Para desmontar um app com limpeza, envolva-o em <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Ordem e erros</h3>
      <ul>
        <li>Você pode registrar quantos hooks quiser, em qualquer das formas. Eles rodam na ordem de registro.</li>
        <li><code>onDestroy</code> sempre roda primeiro nos filhos, depois no pai.</li>
        <li>Elementos montam na ordem do seu primeiro hook <code>onMount</code>, que segue a ordem dos argumentos, e cada elemento roda todos os seus hooks juntos. Passe o hook do pai antes dos filhos se eles dependerem dele.</li>
        <li>Um hook que lança um erro é registrado com <code>console.error</code>. Os outros hooks ainda rodam.</li>
        <li>O callback deve retornar uma função de limpeza ou não retornar nada, então não o torne <code>async</code>. Uma Promise retornada nunca é usada como função de limpeza. Inicie trabalho assíncrono dentro dele: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Hooks nunca rodam no servidor. No cliente, rodam depois de <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Nota:</strong> hooks não são effects. Eles nunca rodam de novo quando o estado muda. Cada um roda no máximo uma vez por elemento.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "Atualizações",
    sections: [
      {
        id: "explicit-updates",
        title: "Atualizações explícitas",
        content: `
      <p>Nuclo nunca atualiza a página por conta própria. Altere seu estado e então chame <code>update()</code>.</p>
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
      <p>Altere quanto estado quiser e então chame <code>update()</code> uma vez:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Chame <code>update()</code> a partir de handlers de eventos, timers, callbacks de fetch ou <code>onMount</code>. Não o chame de dentro de um valor dinâmico.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Valores dinâmicos",
        content: `
      <p>Uma função <strong>sem parâmetros</strong> é um <strong>valor dinâmico</strong>. Nuclo a executa uma vez ao construir o elemento, e de novo em cada <code>update()</code>. Use valores dinâmicos para filhos de texto, valores de atributos, <code>style</code> e <code>className</code>. Para filhos que aparecem, desaparecem ou se repetem, use <a href="#api-when"><code>when()</code></a> e <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo verifica a quantidade de parâmetros (<code>fn.length</code>). Uma função que declara um parâmetro é um <a href="#tag-builders">modificador personalizado</a> e roda apenas uma vez. <code>(x = 0) =&gt; …</code> e <code>(...args) =&gt; …</code> têm length 0, então são dinâmicas.</p>
      <h3>Texto dinâmico</h3>
      <ul>
        <li>Uma string, number, bigint ou boolean renderiza como <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> mostra "false", então escreva <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> e <code>undefined</code> renderizam como texto vazio.</li>
        <li>Um resultado de <code>css()</code> ou <code>cx()</code> na primeira execução torna a função uma classe dinâmica, não texto. Veja <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Um nó, builder, array ou objeto simples não renderiza nada, e nunca atualiza.</li>
      </ul>
      <h3>Atributos dinâmicos</h3>
      <ul>
        <li>Nuclo escreve um valor apenas quando ele difere do último valor que Nuclo escreveu. Ele não compara com o estado atual do DOM, então se um usuário digita em um input e sua função retorna o mesmo valor de antes, o texto digitado permanece.</li>
        <li>Um resultado <code>null</code> ou <code>undefined</code> não escreve nada, então o valor antigo permanece. <code>className</code> é a exceção: qualquer resultado falsy remove as classes dinâmicas e mantém as estáticas.</li>
        <li>Uma função de <code>style</code> aplica o objeto retornado em cada atualização.</li>
      </ul>
      <h3>Erros</h3>
      <p>Se um valor dinâmico lança um erro, Nuclo o captura e o resto da atualização ainda roda. O texto fica vazio ou mantém o valor antigo, e um atributo mantém o valor antigo. Ambos se recuperam no próximo <code>update()</code> bem-sucedido. A exceção: uma função de texto que lança um erro na <strong>primeira</strong> execução fica vazia para sempre.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Executa uma passagem síncrona sobre todos os valores dinâmicos da página. Com ids, atualiza apenas o que está dentro dos elementos marcados com esses ids de <a href="#api-scope"><code>scope()</code></a>. Cada passagem executa estes passos em ordem:</p>
      <ol>
        <li><code>list()</code>: lê os itens de novo e adiciona, move ou remove linhas.</li>
        <li><code>when()</code>: verifica as condições de novo. Um ramo só é reconstruído quando um ramo diferente se torna ativo.</li>
        <li>Atributos dinâmicos, incluindo <code>style</code> e <code>className</code>.</li>
        <li>Texto dinâmico.</li>
        <li><code>onMount</code> para os elementos que os passos 1 e 2 inseriram.</li>
      </ol>
      <ul>
        <li><strong>Ele executa tudo.</strong> Todo valor dinâmico roda em cada chamada, mesmo quando seus dados não mudaram. Apenas a escrita no DOM é pulada. Mantenha valores dinâmicos rápidos e sem efeitos colaterais.</li>
        <li><strong>Apenas nós no documento.</strong> Se um nó não está no documento quando <code>update()</code> roda, Nuclo para de rastreá-lo. Ele nunca mais atualiza, mesmo depois que você o anexa. Isso vale para <code>list()</code> e <code>when()</code> também. Renderize em um contêiner que está no documento.</li>
        <li><strong>Valores estáticos nunca mudam.</strong> Strings simples e valores de atributos são fixados quando o elemento é construído. Para reconstruí-los, use <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Erros.</strong> Erros de texto e atributos são capturados, e a passagem continua. Se uma condição de <code>when()</code> lança um erro, o erro é registrado e aquele <code>when()</code> para de atualizar. Se uma função <code>items</code> ou <code>renderItem</code> de <code>list()</code> lança um erro, o erro escapa de <code>update()</code> e os passos restantes não rodam.</li>
        <li><strong>Servidor.</strong> <code>update()</code> não faz nada no servidor.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Dá ao elemento que o recebe um ou mais ids de escopo. <code>update('id')</code> então atualiza apenas o que está dentro daquele elemento, incluindo os atributos do próprio elemento.</p>
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
        <li>Um elemento pode ter vários ids: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> atualiza tudo dentro de <code>a</code> ou <code>b</code>. Se vários elementos usam o mesmo id, todos eles atualizam.</li>
        <li>Com escopos aninhados, <code>update('outer')</code> inclui o escopo interno. <code>update('inner')</code> não toca o externo.</li>
        <li>Um id que nenhum elemento no documento possui não atualiza <strong>nada</strong> e não gera erro, então verifique a grafia.</li>
        <li><code>scope()</code> não faz nada no servidor.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Renderiza conteúdo com base em uma condição. Nuclo verifica as condições de novo em cada <code>update()</code>. A primeira condição verdadeira vence. Se nenhuma for verdadeira, o conteúdo de <code>.else()</code> é renderizado. Sem <code>.else()</code>, nada é renderizado.</p>
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
      <h3>Condições</h3>
      <ul>
        <li>Para estado, passe uma função. Um booleano simples é lido uma vez: <code>when(open, …)</code> nunca muda.</li>
        <li>Em TypeScript a função deve retornar um booleano. Escreva <code>() =&gt; items.length &gt; 0</code> ou <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>O que atualiza</h3>
      <ul>
        <li>Enquanto o mesmo ramo permanece ativo, seus elementos são mantidos. Valores dinâmicos, listas e blocos <code>when()</code> dentro dele continuam atualizando.</li>
        <li>Quando um ramo diferente se torna ativo, o conteúdo antigo é removido e seus hooks <code>onDestroy</code> rodam. O novo ramo é construído do zero e seus hooks <code>onMount</code> rodam. O estado dos elementos antigos, como texto de input ou foco, é perdido.</li>
      </ul>
      <h3>Conteúdo do ramo</h3>
      <p>Coloque filhos em um ramo: texto, texto dinâmico, builders, <code>list()</code> e <code>when()</code> aninhados. Passe builders como <code>p('Hi')</code>, não nós do DOM: um nó do DOM para de atualizar depois que seu ramo se esconde uma vez.</p>
      <p>Objetos de atributos e <code>on()</code> em um ramo se aplicam ao elemento pai, e permanecem depois que o ramo se esconde. Para um atributo condicional, use um atributo dinâmico: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Encadeamento</h3>
      <p><code>.when()</code> e <code>.else()</code> retornam um novo builder e não alteram o original. Se você chamar <code>.else()</code> duas vezes, a última chamada vence.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Renderiza uma linha por item. Em cada <code>update()</code>, Nuclo chama <code>items()</code> de novo e associa os novos itens às linhas existentes por identidade (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Como os itens são associados às linhas</h3>
      <ul>
        <li>Um item que ainda está lá mantém sua linha. Nuclo move a linha se necessário, e não chama <code>renderItem</code> de novo.</li>
        <li>Um item novo recebe uma linha nova. Um item removido perde sua linha, e seus hooks <code>onDestroy</code> rodam.</li>
        <li>Itens duplicados recebem cada um a sua própria linha.</li>
        <li>Você pode alterar o array no lugar (<code>push</code>, <code>splice</code>, <code>sort</code>) ou retornar um novo array.</li>
      </ul>
      <p>Uma linha mantida nunca é renderizada de novo, então use valores dinâmicos para os campos que mudam:</p>
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
      <p>Cópias são itens novos, então substituir o array por <code>todos.map((t) =&gt; ({ ...t }))</code> reconstrói todas as linhas.</p>
    `,
        afterContent: `
      <h3>O que <code>renderItem</code> retorna</h3>
      <ul>
        <li>Retorne um elemento, como <code>li(...)</code>, <code>tr(...)</code> ou um builder SVG. Retorne <code>null</code> ou <code>undefined</code> para pular um item. Strings, nós de texto e fragments não renderizam nada.</li>
        <li>Não retorne <code>when()</code> ou <code>list()</code> diretamente. Coloque-os dentro do elemento da linha: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Para esconder itens, filtre em <code>items()</code>, não em <code>renderItem</code>.</li>
        <li>Mantenha <code>renderItem</code> sem efeitos colaterais. Nuclo pode chamá-lo mais de uma vez para o mesmo item.</li>
      </ul>
      <h3>O índice</h3>
      <p><code>index</code> é a posição do item quando sua linha foi criada. Ele não é atualizado quando as linhas se movem. Para a posição atual, use um valor dinâmico: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iteráveis</h3>
      <p>Qualquer iterável funciona: arrays, <code>Set</code>, generators e <code>map.values()</code>. Retornar o mesmo array ou <code>Set</code> a cada vez é aceitável. Um iterator, como um generator ou <code>map.values()</code>, se esgota depois de uma passagem, então crie-o dentro de <code>items()</code> em cada chamada. Iterar um <code>Map</code> diretamente cria novos arrays <code>[key, value]</code> a cada vez, então todas as linhas são reconstruídas. Use <code>map.values()</code> em vez disso.</p>
      <h3>Posicionamento</h3>
      <p>As linhas aparecem onde <code>list()</code> está entre seus irmãos, entre dois marcadores de comentário. Os outros filhos do pai não são tocados. <code>list()</code> também funciona dentro de builders SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() e into()",
        content: `
      <p><code>region()</code> marca um lugar nomeado na árvore. <code>into()</code> o preenche de qualquer outro lugar, em qualquer profundidade. O layout não recebe o conteúdo como prop, e o componente que constrói o conteúdo não sabe onde ele vai parar.</p>
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
      <h3>Como funciona</h3>
      <ul>
        <li><code>into()</code> deixa apenas um comentário onde é escrito. Seu conteúdo é renderizado entre os marcadores da região.</li>
        <li>A ordem não importa. Um <code>into()</code> construído antes da sua região espera e aparece no momento em que a região é construída. As views aparecem na ordem em que foram escritas.</li>
        <li>O conteúdo vive enquanto a view viver. Quando o <code>when()</code> que contém um <code>into()</code> fecha, ou sua linha de <code>list()</code> é removida, o conteúdo sai da região. Abri-lo de novo adiciona uma cópia, não duas.</li>
        <li>Quando uma região desaparece, por exemplo quando seu <code>when()</code> fecha, suas views voltam a esperar. Uma região construída depois com o mesmo id as mostra.</li>
        <li>Um <code>into()</code> cujo id não corresponde a nenhuma região não renderiza nada e não gera erro, então verifique a grafia.</li>
        <li>Ids são únicos na árvore. Uma segunda região construída sob um id ativo registra um aviso.</li>
        <li>Regiões funcionam com <a href="#api-ssr">renderização no servidor</a>. Em <code>hydrate()</code>, cada view reutiliza o HTML que o servidor renderizou em vez de construí-lo de novo.</li>
      </ul>
      <h3>Opções</h3>
      <ul>
        <li><code>id</code>: o nome que as chamadas de <code>into()</code> usam para encontrar a região.</li>
        <li><code>type</code>: <code>'latest'</code> (o padrão) mostra apenas a view mais recente. <code>'stack'</code> mostra todas as views, em ordem de chegada.</li>
        <li><code>empty</code>: renderizado enquanto a região não contém views.</li>
      </ul>
      <h3>Regiões empilhadas</h3>
      <p>Com <code>type: 'stack'</code>, uma view que abre sobre outra não reconstrói a que está embaixo. Seu DOM, foco e estado de formulário permanecem. Use isso para uma camada como um diálogo sobre uma página.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>Várias regiões de uma vez</h3>
      <p>Passe um objeto para preencher mais de uma região a partir de um único <code>into()</code>. Um valor pode ser um filho ou um array de filhos. Ambas as formas podem ser aninhadas: um <code>into()</code> dentro do conteúdo de outra view aponta para sua própria região.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Um diálogo aberto do fundo da árvore</h3>
      <p>A região de overlay fica na raiz. Qualquer componente, em qualquer profundidade, abre um diálogo envolvendo um <code>into()</code> em um <code>when()</code>. Fechar o <code>when()</code> remove o diálogo da região.</p>
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
      <h3>Toasts a partir de linhas de lista</h3>
      <p>Cada linha de um <code>list()</code> é uma view. Uma região empilhada as mostra em ordem, e remover um item do array remove seu toast.</p>
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
      <h3>Um título de página definido pela página</h3>
      <p>Com o padrão <code>type: 'latest'</code>, a view mais recente vence. O layout é dono do título, e a página que estiver aberta o nomeia. Uma página sem <code>into('title', …)</code> deixa o texto de <code>empty</code>.</p>
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
      <h3>Valores dinâmicos dentro de uma view</h3>
      <p>O conteúdo de um <code>into()</code> é conteúdo Nuclo comum. Funções nele são valores dependentes de estado e se atualizam em <code>update()</code>, onde quer que a região esteja.</p>
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
      <h3>Uma região que vai e volta</h3>
      <p>O <code>into()</code> do dashboard é escrito uma vez. Enquanto o usuário está deslogado não há região <code>main</code>, então a view espera. Fazer login constrói a região e a view aparece. Fazer logout remove a região e a view volta a esperar.</p>
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
      <h3>Uma view com sua própria região</h3>
      <p>Uma view pode conter um <code>region()</code>, e outras views podem direcionar conteúdo para ele. Aqui a página do editor traz consigo uma região <code>tabs</code>, e cada aba a preenche. Quando o editor fecha, sua região vai junto.</p>
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
      <h3>Exemplo ao vivo</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> só executa valores dinâmicos. Valores estáticos, como o texto em <code>h1(labels[lang].title)</code>, são fixados quando a árvore é construída. <code>forceUpdate()</code> chama seus componentes de novo e ajusta o DOM existente à nova árvore, incluindo os valores estáticos. Use-o para mudanças raras e globais no app, como trocar o idioma. Use <code>update()</code> para todo o resto.</p>
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
      <p>Sem argumentos, <code>forceUpdate()</code> reconstrói toda raiz renderizada com <code>render(App)</code> ou <code>hydrate(App)</code>. Raízes renderizadas com <code>render(App())</code> são puladas. Se um componente lança um erro, o erro é registrado e aquela raiz mantém seu DOM antigo. Um erro lançado depois, enquanto a nova construção é aplicada, também é registrado, mas as partes já ajustadas permanecem ajustadas.</p>
      <h3>O que permanece e o que muda</h3>
      <ul>
        <li>Os elementos filhos são associados em ordem, por tag. Um elemento correspondente é reutilizado, então o foco e os valores digitados em inputs permanecem, e seus hooks <code>onMount</code> não rodam de novo. Assim que a tag de um filho difere, esse filho e todos os irmãos seguintes são construídos do zero.</li>
        <li>Texto, atributos, classes, estilos, listeners, ramos de <code>when()</code> e linhas de <code>list()</code> seguem a nova construção.</li>
        <li>Novos elementos são criados, e seus hooks <code>onMount</code> rodam. Elementos que a nova construção não produz mais são removidos, e seus hooks <code>onDestroy</code> rodam.</li>
        <li>Linhas de <code>list()</code> também são associadas por posição, não por item, então um elemento de linha reutilizado pode acabar mostrando um item diferente.</li>
        <li>Atributos que a nova construção não define mais não são removidos.</li>
      </ul>
      <div class="docs-callout"><strong>Atenção:</strong> estado declarado dentro de uma função de componente é reiniciado, porque a função roda de novo. Mantenha fora do componente o estado que precisa sobreviver.</div>
      <p><strong>Forma explícita.</strong> <code>forceUpdate(App(), parent)</code> reconstrói uma árvore em <code>parent</code> e retorna sua raiz. Ele não registra a raiz para chamadas futuras. Como <code>hydrate()</code>, espera que a raiz seja o primeiro nó em <code>parent</code>. Se o primeiro nó tem uma tag diferente, ele é substituído.</p>
      <p>No servidor, <code>forceUpdate()</code> não faz nada.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "Renderização",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>Constrói sua árvore e anexa seu elemento raiz a <code>parent</code>. <code>parent</code> tem como padrão <code>document.body</code>. Retorna o elemento raiz.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Você pode passar o componente (<code>render(App)</code>) ou o builder que ele retorna (<code>render(App())</code>). O DOM é o mesmo. Apenas <code>render(App)</code> permite que <a href="#api-force-update"><code>forceUpdate()</code></a> reconstrua a raiz depois, então prefira essa forma.</li>
        <li>Ele anexa. Não limpa <code>parent</code>, então chamá-lo duas vezes adiciona duas cópias.</li>
        <li>Todo <code>onMount</code> da árvore já rodou quando <code>render()</code> retorna.</li>
        <li>Renderize em um elemento que está no documento. Veja <a href="#api-update"><code>update()</code></a>.</li>
        <li>A raiz deve ser um elemento, como <code>div(...)</code>, não <code>when()</code> ou <code>list()</code>.</li>
        <li><code>index</code> é interno. Ele não escolhe onde o elemento é inserido. Deixe-o de fora.</li>
      </ul>
      <p>Um componente passado como <code>render(App)</code> não deve ter parâmetros. Um parâmetro obrigatório é um erro de tipo. Um opcional passa na checagem de tipos, mas <code>render()</code> lança um erro em tempo de execução. Envolva um componente que recebe props:</p>
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
      <p>Reutiliza o HTML produzido por <a href="#api-ssr"><code>renderToString()</code></a>. Ele reutiliza os elementos existentes, anexa listeners de eventos e conecta valores dinâmicos, <code>when()</code> e <code>list()</code>, para que <code>update()</code> funcione depois. Então executa os hooks <code>onMount</code>. <code>parent</code> tem como padrão <code>document.body</code>. Retorna o elemento raiz.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Use o mesmo componente, e os mesmos dados, que o servidor.</li>
        <li>Hidrate em um contêiner dedicado. A raiz do app deve ser seu primeiro nó, embora espaços em branco sejam aceitáveis. Se outro nó vem primeiro, Nuclo substitui esse nó e deixa a cópia do servidor para trás.</li>
        <li>Como em <code>render()</code>, passe <code>App</code>, não <code>App()</code>, para que <code>forceUpdate()</code> possa reconstruir a raiz depois. <code>App</code> não deve ter parâmetros. Com um opcional, <code>hydrate()</code> silenciosamente não anexa nada. Envolva um componente que recebe props: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Se não há HTML do servidor, use <code>render()</code>.</li>
      </ul>
      <h3>Quando o servidor e o cliente diferem</h3>
      <p>O cliente vence:</p>
      <ul>
        <li>Uma tag de raiz diferente: esse nó é substituído por DOM novo. Um contêiner vazio: DOM novo é anexado.</li>
        <li>Texto diferente é corrigido. Itens de <code>list()</code> e ramos de <code>when()</code> diferentes seguem o cliente.</li>
        <li>Filhos extras do servidor são removidos, e os que faltam são criados.</li>
        <li>Atributos que o servidor escreveu mas o cliente não define são deixados como estão.</li>
      </ul>
      <p><code>renderToString()</code> escreve comentários HTML como marcadores, como <code>&lt;!-- text-0 --&gt;</code> antes de cada nó de texto. <code>hydrate()</code> precisa deles, então não remova os comentários do HTML do servidor. Sem os marcadores, a hidratação apaga as linhas de <code>list()</code>, e <code>list()</code> e <code>when()</code> param de atualizar.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Renderização no servidor",
        content: `
      <p>Renderize um componente em uma string HTML no servidor. No navegador, chame <a href="#api-hydrate"><code>hydrate()</code></a> com o mesmo componente para tornar esse HTML interativo. Runtimes de servidor não têm <code>document</code>, então importe <a href="#api-polyfill"><code>nuclo/polyfill</code></a> primeiro.</p>
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
      <p>Mantenha <code>id="nuclo-styles"</code> na tag style. O cliente reutiliza esse elemento e adiciona apenas regras novas. Veja <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>O que roda no servidor</h3>
      <ul>
        <li>Cada chamada de <code>renderToString()</code> constrói a árvore e executa cada valor dinâmico uma vez.</li>
        <li>Handlers de eventos, <code>onMount</code> e <code>onDestroy</code> nunca rodam. <code>update()</code>, <code>scope()</code> e <code>forceUpdate()</code> não fazem nada.</li>
        <li>A renderização é síncrona. Carregue seus dados primeiro, depois renderize.</li>
        <li>Nada permanece registrado depois de uma renderização, então um processo pode atender muitas requisições. Passe os dados da requisição como argumentos, como <code>renderToString(Page(user))</code>. Variáveis no nível do módulo são compartilhadas por todas as requisições.</li>
        <li>Não chame <code>render()</code> no servidor. Ele anexa ao <code>document.body</code> compartilhado.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Recebe um builder (<code>App()</code>), um componente (<code>App</code>) ou um nó do DOM. <code>null</code> e <code>undefined</code> retornam <code>""</code>. A raiz deve ser um elemento. Um componente passado como <code>renderToString(Page)</code> não deve ter parâmetros, então passe <code>Page(user)</code> para um que recebe dados.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Texto e valores de atributos são escapados como HTML. Texto dentro de <code>script()</code> e <code>style()</code> é escrito como está, apenas com as tags de fechamento quebradas, então nunca coloque entrada do usuário ali.</li>
        <li>Ele não lança erros. Se o componente, uma função de <code>list()</code> ou uma condição de <code>when()</code> lança um erro, ou o polyfill está ausente, ele registra o erro e retorna <code>""</code>. Verifique se o resultado está vazio caso a requisição deva falhar. Uma função de texto ou atributo que lança um erro apenas renderiza vazio.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>O mesmo que <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Envolve a saída em um elemento. <code>containerTag</code> tem como padrão <code>"div"</code>, e <code>containerAttrs</code>, <code>{}</code>. Valores de atributos são escapados. Nomes de atributos são escritos como fornecidos, então use nomes HTML como <code>class</code>. Nunca passe entrada do usuário como a tag.</p>
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
      <p>Um DOM pequeno para que o Nuclo possa construir árvores em Node e Bun. Importe-o uma vez, antes da sua primeira renderização. A maioria dos apps só precisa do import simples.</p>
      <ul>
        <li>Quando não há <code>window</code>, ele define <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> e <code>HTMLElement</code>, mas apenas os que estão faltando. Ele não cria <code>window</code>.</li>
        <li>Em um navegador, ou sob jsdom, não faz nada.</li>
        <li><code>Event</code> e <code>CustomEvent</code> são os construtores do próprio runtime. <code>Node</code>, <code>Element</code> e <code>HTMLElement</code> são aliases das classes do polyfill.</li>
      </ul>
      <p>É um DOM para construir árvores, não um navegador. Não tem <code>innerHTML</code> nem <code>getElementById</code>, <code>querySelector()</code> retorna <code>null</code>, e listeners de eventos são ignorados. Use <code>renderToString()</code> para obter o HTML.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
