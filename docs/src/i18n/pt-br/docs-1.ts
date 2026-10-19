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
      <p>O Nuclo é uma biblioteca DOM enxuta para TypeScript. A página nasce de funções simples, como <code>div()</code> e <code>button()</code>. O estado fica em variáveis comuns, e você chama <code>update()</code> quando a página deve mudar.</p>
      <p>O Nuclo não tem DOM virtual, compilador, proxies nem signals.</p>
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
        <li>Monte a UI com os builders de tags.</li>
        <li>Onde um valor depende do estado, passe uma função no lugar dele.</li>
        <li>Altere o estado com JavaScript puro.</li>
        <li>Chame <code>update()</code>. O Nuclo executa as funções outra vez e atualiza o DOM.</li>
      </ol>
      <p>Trocar o valor de uma variável não mexe no DOM. A página só muda quando você chama <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Início rápido",
        content: `
      <p>O <code>create-nuclo</code> monta para você um projeto Vite + TypeScript que já sai pronto para usar o Nuclo:</p>
    `,
        afterContent: `
      <p>Ele começa perguntando o nome do projeto. Se preferir pular essa etapa, passe o nome e as flags já na linha de comando. No npm, lembre-se de colocar <code>--</code> antes das flags:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Agora é só instalar as dependências e subir o servidor de desenvolvimento:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Opções</h3>
      <ul>
        <li><code>[project-name]</code>: a pasta onde o projeto será criado. Se omitir, o padrão é <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: qual template copiar. Por enquanto, só existe o <code>basic</code>.</li>
        <li><code>-y, --yes</code>: aceita os valores padrão e não faz nenhuma pergunta.</li>
        <li><code>-f, --force</code>: escreve os arquivos mesmo que a pasta não esteja vazia.</li>
        <li><code>-h, --help</code>: exibe a ajuda.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Instalação e imports",
        content: `
      <p>Já tem um projeto rodando? Então é só adicionar o Nuclo:</p>
      ${sh("npm install nuclo")}
      <p>Se preferir, vale também <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> ou <code>bun add nuclo</code>. O Nuclo não depende de nenhum outro pacote.</p>
      <p>O roteamento fica de fora do pacote principal. Ele vive em um pacote separado, o <a href="#router-overview"><code>nuclo-router</code></a>, que você instala ao lado do <code>nuclo</code> só quando precisar.</p>
      <h3>Globais</h3>
      <p>O <code>import 'nuclo'</code> registra tudo isto em <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 builders de tags</strong>: 112 de HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) e 63 de SVG, que levam o sufixo <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). Mais detalhes em <a href="#tag-builders">Builders de tags</a>.</li>
        <li><strong>16 helpers</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code>.</li>
      </ul>
      <p>Esse import precisa acontecer antes de qualquer código que chame um builder. Módulos ES executam na ordem em que são importados, então o exemplo abaixo quebra:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>A regra prática: deixe o <code>import 'nuclo'</code> no topo do arquivo de entrada, ou repita o import em cada arquivo que usa os globais.</p>
      <h3>Imports nomeados</h3>
      <p>Os helpers também estão disponíveis como exports nomeados, e são exatamente as mesmas funções dos globais. Duas delas, <code>getCssText()</code> e <code>resetStyles()</code>, só existem assim. Já os builders de tags só existem como globais, então <code>import { div } from 'nuclo'</code> não funciona.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Pontos de entrada</h3>
      <ul>
        <li><code>nuclo</code>: registra os globais e exporta os 16 helpers, além de <code>getCssText</code> e <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: traz <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> e <code>getCssText</code>. Veja <a href="#api-ssr">Renderização no servidor (SSR)</a>.</li>
        <li><code>nuclo/polyfill</code>: um mini DOM para rodar em Node e Bun. Veja <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: só os tipos. Veja <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Os tipos já vêm dentro do pacote. Para tudo funcionar, bastam duas coisas:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. Os modos <code>node16</code> e <code>nodenext</code> ainda não têm suporte.</li>
        <li>A lib <code>DOM</code>, que o TypeScript já inclui por padrão quando você não define <code>lib</code>.</li>
      </ul>
      <p>Basta um arquivo do projeto importar <code>'nuclo'</code> para que todos os outros enxerguem os tipos globais, sem configuração extra. Se nenhum arquivo importa (num tsconfig separado para testes, por exemplo), declare os tipos na mão:</p>
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
      <p>Outra opção é colocar <code>/// &lt;reference types="nuclo/types" /&gt;</code> em um arquivo <code>.d.ts</code>.</p>
      <h3>Tipos úteis</h3>
      <p>Estes tipos são globais, então você os usa direto, sem import:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: o retorno de um builder de tag. Use-o como tipo de retorno dos seus componentes.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: tudo o que um builder de tag aceita como argumento.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: o que <code>render()</code> e <code>hydrate()</code> devolvem.</li>
        <li><code>ElementTagName</code>: o nome de qualquer tag HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: o objeto de atributos que um builder de tag aceita, com os handlers <code>on*</code>, <code>onMount</code> e <code>onDestroy</code> inclusos. Serve para componentes que repassam atributos adiante.</li>
        <li><code>MountCallback</code> e <code>DestroyCallback</code>: os tipos dos handlers de <code>onMount</code> e <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: o retorno de <code>when()</code> e <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: as opções recebidas por <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> e o resto dos tipos de estilização. Esses você também pode importar: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p>O <code>ExpandedElement&lt;Tag&gt;</code> deixa todos os membros do DOM como opcionais. Quando precisar do tipo completo do elemento, faça um cast: <code>render(App, root) as HTMLDivElement</code>.</p>
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
        title: "Builders de tags",
        content: `
      <p>Cada tag HTML vira uma função global com o mesmo nome: <code>div</code>, <code>span</code>, <code>input</code>, … Só uma foge à regra: <code>&lt;var&gt;</code> se chama <code>var_</code>, já que <code>var</code> é palavra reservada. As tags SVG seguem o mesmo princípio, mas com o sufixo <code>Svg</code>: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Chamar um builder ainda não cria nenhum elemento. <code>div('Hi')</code> devolve um <strong>builder</strong>: uma função que vai criar o elemento mais tarde. Quem a chama é o Nuclo, quando você a passa para <code>render()</code> ou a coloca dentro de outro builder, de um <code>when()</code> ou de um <code>list()</code>. A cada uso, nasce um elemento novo.</p>
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
      <p>Um builder aceita quantos argumentos você quiser e aplica todos da esquerda para a direita:</p>
      <ul>
        <li><strong>string, number, bigint</strong>: viram um nó de texto.</li>
        <li><strong><code>() =&gt; value</code></strong>: texto que se atualiza a cada <code>update()</code>. Veja <a href="#dynamic-functions">Valores dinâmicos</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: são ignorados.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: aparecem como o texto "true" ou "false". Para condições, use <code>when()</code>.</li>
        <li><strong>Um objeto simples</strong>: vira atributos. Veja <a href="#attributes">Atributos</a>.</li>
        <li><strong>O resultado de <code>css()</code>, <code>cx()</code> ou <code>variants()</code></strong>: soma as classes ao elemento.</li>
        <li><strong><code>on(...)</code></strong>: um listener de evento ou um hook de ciclo de vida.</li>
        <li><strong>Outro builder, <code>when()</code> ou <code>list()</code></strong>: entra como filho.</li>
        <li><strong>Um <code>Node</code> do DOM</strong>: é anexado do jeito que está.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: um modificador personalizado. Mais abaixo.</li>
      </ul>
      <h3>Pegadinhas</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> escreve o texto "false" na tela. O certo é <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Arrays não valem como filhos. Use o spread: <code>ul(...names.map((n) =&gt; li(n)))</code>. Se a lista muda com o tempo, use <code>list()</code>.</li>
        <li>Uma variável local com nome de tag esconde o builder. Dentro de <code>function Row(label: string)</code>, por exemplo, não dá para chamar <code>label(...)</code>. Fique de olho em nomes como <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> e <code>i</code> e renomeie essas variáveis.</li>
        <li>O navegador expõe todo elemento com <code>id</code> como variável global. Se a página já tiver um <code>&lt;main id="main"&gt;</code> antes de o Nuclo carregar, o Nuclo mantém essa global e <code>main(...)</code> lança um <code>TypeError</code>. Escolha outros ids.</li>
      </ul>
      <h3>Modificadores personalizados</h3>
      <p>Uma função que declara ao menos um parâmetro roda uma única vez, na ordem dos argumentos, durante a construção do elemento. O primeiro argumento é o próprio elemento. O segundo é um índice interno, então não conte com ele. Se a função devolver uma string ou um number, o valor vira texto. Se devolver um <code>Node</code>, ele é anexado. Se devolver um objeto, é aplicado como atributos.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Como pegar o elemento</h3>
      <p>O <code>render()</code> devolve o elemento raiz. Dentro da árvore, use <code>on("mount", (el) =&gt; …)</code> ou um modificador personalizado. Também dá para chamar a função do builder diretamente e criar um elemento fora do documento:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Anexe esse elemento antes do próximo <code>update()</code>. Um nó que está fora do documento quando o <code>update()</code> roda deixa de ser atualizado para sempre.</p>
      <h3>SVG</h3>
      <p>Os builders SVG aceitam os mesmos argumentos. O Nuclo escreve todo atributo SVG com <code>setAttribute</code>, então nomes como <code>"stroke-width"</code> funcionam exatamente como você os digitou.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Todos os builders</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Componentes",
        content: `
      <p>Componente, aqui, é só uma função que devolve um builder, como <code>button(...)</code>. Não existe uma API de componentes, e nada é criado até você renderizar o builder ou colocá-lo em uma árvore.</p>
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
      <p>O estado declarado dentro da função pertence àquela instância. O que fica fora é compartilhado por todas elas. Já o <code>forceUpdate()</code> chama os componentes de novo, e isso zera o estado declarado dentro deles.</p>
      <p>Filhos, por sua vez, são só argumentos:</p>
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
      <p>Para definir atributos, passe um objeto simples, e pode passar quantos quiser. Se uma mesma chave aparece mais de uma vez, vale o último valor, menos em <code>className</code> e <code>style</code>, que são mesclados. Cada valor pode ser estático ou uma função sem parâmetros, que roda de novo a cada <code>update()</code>.</p>
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
        <li>Se o elemento HTML tem uma propriedade com aquele nome (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), o Nuclo atribui a propriedade. Se não tem, ele cai em <code>setAttribute(key, String(value))</code>, que é o caso de <code>"aria-*"</code> e <code>"data-*"</code>.</li>
        <li>Em elementos SVG, é sempre <code>setAttribute</code>.</li>
        <li><code>null</code> e <code>undefined</code> são ignorados. Se um valor dinâmico retorna <code>null</code> ou <code>undefined</code>, o valor anterior fica como estava. Para limpar, retorne <code>""</code> (ou <code>false</code>, no caso de propriedades booleanas).</li>
        <li>Booleanos funcionam em propriedades booleanas do DOM, como <code>disabled</code> de um botão, <code>checked</code>, <code>hidden</code> e <code>required</code>. Em qualquer outro lugar, <code>true</code> e <code>false</code> viram as strings "true" e "false".</li>
        <li>Escreva as chaves como <code>"data-*"</code>. O <code>dataset</code> não é suportado.</li>
        <li>O <code>innerHTML</code> não passa por escape, e a renderização no servidor não o emite. Melhor evitar.</li>
      </ul>
      <h3>Classes</h3>
      <p>Use <code>className</code>. Classes estáticas em string, resultados de <code>css()</code> e um <code>className</code> dinâmico se combinam. O <code>className</code> dinâmico preserva as classes estáticas, e quando retorna <code>""</code> sobram só elas.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Evite a chave <code>class</code> em elementos HTML. Ela escreve o atributo bruto e atropela toda classe aplicada antes, inclusive as de <code>css()</code>.</p>
      <h3>Estilos inline</h3>
      <p>O <code>style</code> recebe um objeto com chaves em camelCase, ou uma função que devolve um.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>O Nuclo não acrescenta unidades. Escreva <code>"12px"</code>, e não <code>12</code>. Propriedades sem unidade, como <code>opacity</code> e <code>zIndex</code>, aceitam números normalmente.</li>
        <li><code>""</code>, <code>null</code> e <code>undefined</code> limpam a propriedade.</li>
        <li>Um style dinâmico só define as chaves que ele retorna. Se uma chave deixa de aparecer no retorno, o valor antigo continua lá, então devolva <code>""</code> para limpá-la.</li>
        <li>Strings de estilo (<code>"color: red"</code>) e propriedades personalizadas (<code>"--gap"</code>) não são suportadas. Use <code>css()</code>, que aceita propriedades personalizadas via <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "Eventos",
        content: `
      <p>Você tem dois caminhos para escutar eventos: os atributos <code>on*</code> e o modificador <code>on()</code>.</p>
      <h3>Atributos <code>on*</code></h3>
      <p>Num objeto de atributos, uma função sob uma chave como <code>onClick</code> (<code>on</code> seguido de letra maiúscula) é tratada como handler de evento, não como valor dinâmico.</p>
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
        <li>O TypeScript infere o tipo do evento a partir da chave e do elemento. Tanto <code>e.currentTarget</code> quanto <code>this</code> apontam para o elemento.</li>
        <li>O Nuclo atribui a propriedade nativa, então <code>onClick</code> vira <code>el.onclick</code>. Existe um handler por evento: um novo <code>onClick</code> substitui o anterior.</li>
        <li><code>onDoubleClick</code> e <code>onDblClick</code> querem dizer a mesma coisa, <code>dblclick</code>. Chaves em minúsculas, como <code>onclick</code>, dão erro de tipo.</li>
        <li>Um nome que não corresponde a um evento conhecido escuta a versão em minúsculas: <code>onMyEvent</code> escuta <code>"myevent"</code>.</li>
        <li>Erros lançados dentro do handler não são capturados.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p>O <code>on()</code> devolve um modificador que chama <code>addEventListener</code> no elemento.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Cada <code>on()</code> adiciona um listener, e todos rodam, na ordem em que foram escritos.</li>
        <li>As <code>options</code> seguem direto para o <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Se você passa o <code>on()</code> direto para um builder, o tipo do elemento é inferido: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Quando um listener lança um erro, o Nuclo registra com <code>console.error</code> e os demais listeners continuam rodando.</li>
        <li>Ao remover o elemento, o Nuclo remove o listener junto. No servidor, o <code>on()</code> não faz nada.</li>
        <li>Um mesmo valor de <code>on()</code> pode ser reaproveitado em vários elementos.</li>
      </ul>
      <p>Para eventos personalizados, passe o tipo do evento como genérico:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Qual usar</h3>
      <p>No dia a dia, fique com os atributos <code>on*</code>. Deixe o <code>on()</code> para quando você precisar de mais de um listener no mesmo evento, de opções de listener ou de um nome de evento personalizado, como <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Ciclo de vida",
        content: `
      <p>O <code>onMount</code> roda uma vez, logo depois que o elemento é inserido. O <code>onDestroy</code> também roda uma vez, quando o Nuclo remove o elemento. Você pode escrevê-los como atributos ou com <code>on()</code>: as duas formas se comportam igual, e o elemento chega tipado a partir da tag.</p>
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
      <h3>Quando cada um dispara</h3>
      <ul>
        <li>O <code>onMount</code> roda no final da chamada de <code>render()</code>, <code>hydrate()</code>, <code>update()</code> ou <code>forceUpdate()</code> que inseriu o elemento. Nunca durante a construção da árvore.</li>
        <li>Se o <code>onMount</code> retorna uma função, ela roda na destruição, depois dos callbacks de <code>onDestroy</code> do elemento.</li>
        <li>O <code>onDestroy</code> roda quando o Nuclo remove o elemento: uma linha de <code>list()</code> sai, um ramo de <code>when()</code> é trocado, um <code>into()</code> deixa sua região ou o <code>forceUpdate()</code> o descarta. Ele dispara um instante antes da remoção, então o elemento ainda está no documento.</li>
      </ul>
      <h3>Remoção direta do DOM</h3>
      <p>Se você remove o elemento por conta própria, com <code>node.remove()</code> ou <code>innerHTML = ''</code>, o <code>onDestroy</code> e as funções de cleanup nunca rodam, e os timers seguem ativos. O Nuclo não tem <code>unmount()</code>. Para desmontar um app com cleanup, envolva-o em um <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Ordem e erros</h3>
      <ul>
        <li>Dá para registrar quantos hooks quiser, de qualquer uma das duas formas, e eles rodam na ordem de registro.</li>
        <li>O <code>onDestroy</code> sempre roda primeiro nos filhos e só depois no pai.</li>
        <li>Os elementos montam na ordem do primeiro hook <code>onMount</code> de cada um, que segue a ordem dos argumentos, e cada elemento roda todos os seus hooks de uma vez. Se os filhos dependem do hook do pai, passe o do pai antes.</li>
        <li>Um hook que lança erro é registrado com <code>console.error</code>, e os outros hooks continuam rodando.</li>
        <li>O callback deve retornar uma função de cleanup ou nada, então não o transforme em <code>async</code>: uma Promise retornada nunca é usada como cleanup. Dispare o trabalho assíncrono lá dentro: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Hooks nunca rodam no servidor. No cliente, rodam depois do <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Nota:</strong> hooks não são effects. Eles não rodam de novo quando o estado muda: cada um dispara no máximo uma vez por elemento.</div>
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
      <p>O Nuclo nunca atualiza a página por conta própria. Mudou o estado? Chame <code>update()</code>.</p>
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
      <p>Pode mudar quanto estado quiser e chamar <code>update()</code> uma vez só no final:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Chame <code>update()</code> em handlers de eventos, timers, callbacks de fetch ou <code>onMount</code>, e nunca de dentro de um valor dinâmico.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Valores dinâmicos",
        content: `
      <p>Uma função <strong>sem parâmetros</strong> é um <strong>valor dinâmico</strong>. O Nuclo a executa uma vez quando constrói o elemento e de novo a cada <code>update()</code>. É o que você usa para texto, valores de atributos, <code>style</code> e <code>className</code>. Para filhos que aparecem, somem ou se repetem, o caminho é <a href="#api-when"><code>when()</code></a> e <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>O Nuclo olha o número de parâmetros (<code>fn.length</code>). Uma função com um parâmetro declarado é um <a href="#tag-builders">modificador personalizado</a> e roda só uma vez. Já <code>(x = 0) =&gt; …</code> e <code>(...args) =&gt; …</code> têm length 0, então contam como dinâmicas.</p>
      <h3>Texto dinâmico</h3>
      <ul>
        <li>Uma string, number, bigint ou boolean é renderizada como <code>String(value)</code>. O <code>() =&gt; ok &amp;&amp; 'Saved'</code> mostraria "false", então escreva <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> e <code>undefined</code> viram texto vazio.</li>
        <li>Se, na primeira execução, a função devolve o resultado de <code>css()</code> ou <code>cx()</code>, ela passa a ser uma classe dinâmica, e não texto. Veja <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Um nó, builder, array ou objeto simples não renderiza nada e nunca é atualizado.</li>
      </ul>
      <h3>Atributos dinâmicos</h3>
      <ul>
        <li>O Nuclo só escreve um valor quando ele é diferente do último que ele mesmo escreveu. Ele não compara com o estado atual do DOM: se o usuário digita em um input e a sua função devolve o mesmo valor de antes, o texto digitado fica.</li>
        <li>Um resultado <code>null</code> ou <code>undefined</code> não escreve nada, então o valor antigo permanece. A exceção é o <code>className</code>: qualquer resultado falsy remove as classes dinâmicas e mantém as estáticas.</li>
        <li>Uma função de <code>style</code> aplica o objeto retornado a cada atualização.</li>
      </ul>
      <h3>Erros</h3>
      <p>Se um valor dinâmico lança um erro, o Nuclo captura e o resto da atualização segue normalmente. O texto fica vazio (ou com o valor antigo), e o atributo mantém o valor antigo. Os dois se recuperam no próximo <code>update()</code> que funcionar. Só há uma exceção: uma função de texto que falha já na <strong>primeira</strong> execução fica vazia para sempre.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Faz uma passada síncrona por todos os valores dinâmicos da página. Se você passar ids, só é atualizado o que está dentro dos elementos marcados com esses ids via <a href="#api-scope"><code>scope()</code></a>. Cada passada segue estes passos, em ordem:</p>
      <ol>
        <li><code>list()</code>: lê os itens de novo e adiciona, move ou remove linhas.</li>
        <li><code>when()</code>: reavalia as condições. Um ramo só é reconstruído quando outro ramo passa a valer.</li>
        <li>Atributos dinâmicos, incluindo <code>style</code> e <code>className</code>.</li>
        <li>Texto dinâmico.</li>
        <li><code>onMount</code> dos elementos que os passos 1 e 2 inseriram.</li>
      </ol>
      <ul>
        <li><strong>Ele executa tudo.</strong> Todo valor dinâmico roda a cada chamada, mesmo que os dados não tenham mudado. O que se evita é só a escrita no DOM. Por isso, mantenha os valores dinâmicos rápidos e sem side effects.</li>
        <li><strong>Só nós que estão no documento.</strong> Se um nó está fora do documento quando o <code>update()</code> roda, o Nuclo para de acompanhá-lo, e ele nunca mais é atualizado, nem depois de anexado. Vale também para <code>list()</code> e <code>when()</code>. Renderize em um container que já esteja no documento.</li>
        <li><strong>Valores estáticos nunca mudam.</strong> Strings simples e valores de atributos são fixados na construção do elemento. Para reconstruí-los, use <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Erros.</strong> Erros em texto e atributos são capturados e a passada continua. Se a condição de um <code>when()</code> lança erro, ele é registrado e aquele <code>when()</code> para de atualizar. Se a função <code>items</code> ou <code>renderItem</code> de um <code>list()</code> lança erro, ele escapa do <code>update()</code> e os passos restantes não rodam.</li>
        <li><strong>Servidor.</strong> No servidor, o <code>update()</code> não faz nada.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Dá ao elemento um ou mais ids de escopo. Com isso, <code>update('id')</code> atualiza só o que está dentro daquele elemento, atributos do próprio elemento incluídos.</p>
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
        <li><code>update('a', 'b')</code> atualiza tudo que estiver dentro de <code>a</code> ou de <code>b</code>. Se vários elementos usam o mesmo id, todos são atualizados.</li>
        <li>Em escopos aninhados, <code>update('outer')</code> inclui o escopo interno, mas <code>update('inner')</code> não toca no externo.</li>
        <li>Um id que nenhum elemento do documento possui não atualiza <strong>nada</strong> e não gera erro, então confira a grafia.</li>
        <li>No servidor, o <code>scope()</code> não faz nada.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Renderiza conteúdo de acordo com uma condição. O Nuclo reavalia as condições a cada <code>update()</code>, e a primeira verdadeira vence. Se nenhuma for, entra o conteúdo do <code>.else()</code>. Sem <code>.else()</code>, nada é renderizado.</p>
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
        <li>Para depender de estado, passe uma função. Um booleano simples é lido uma única vez: <code>when(open, …)</code> nunca muda.</li>
        <li>Em TypeScript, a função precisa retornar um booleano. Escreva <code>() =&gt; items.length &gt; 0</code> ou <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>O que atualiza</h3>
      <ul>
        <li>Enquanto o mesmo ramo continua ativo, os elementos dele são mantidos, e os valores dinâmicos, listas e blocos <code>when()</code> lá dentro seguem se atualizando.</li>
        <li>Quando outro ramo passa a valer, o conteúdo antigo é removido e os hooks <code>onDestroy</code> rodam. O novo ramo é construído do zero, com seus hooks <code>onMount</code>. O estado dos elementos antigos, como o texto de um input ou o foco, se perde.</li>
      </ul>
      <h3>Conteúdo do ramo</h3>
      <p>Um ramo aceita filhos como texto, texto dinâmico, builders, e também <code>list()</code> e <code>when()</code> aninhados. Passe builders como <code>p('Hi')</code>, e não nós do DOM: um nó do DOM deixa de ser atualizado assim que seu ramo é escondido uma vez.</p>
      <p>Objetos de atributos e <code>on()</code> dentro de um ramo se aplicam ao elemento pai e continuam valendo depois que o ramo some. Para um atributo condicional, use um atributo dinâmico: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Encadeamento</h3>
      <p><code>.when()</code> e <code>.else()</code> devolvem um novo builder e não alteram o original. Se você chamar <code>.else()</code> duas vezes, vale a última.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Renderiza uma linha para cada item. A cada <code>update()</code>, o Nuclo chama <code>items()</code> de novo e associa os itens às linhas existentes por identidade (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Como os itens são associados às linhas</h3>
      <ul>
        <li>Um item que continua na lista mantém a sua linha. O Nuclo move a linha se for preciso, sem chamar <code>renderItem</code> outra vez.</li>
        <li>Um item novo ganha uma linha nova. Um item removido perde a linha, e seus hooks <code>onDestroy</code> rodam.</li>
        <li>Itens duplicados ganham, cada um, a própria linha.</li>
        <li>Vale mutar o array no lugar (<code>push</code>, <code>splice</code>, <code>sort</code>) ou retornar um array novo.</li>
      </ul>
      <p>Uma linha que foi mantida não é renderizada de novo, então use valores dinâmicos nos campos que mudam:</p>
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
      <p>Cópias contam como itens novos. Se você trocar o array por <code>todos.map((t) =&gt; ({ ...t }))</code>, todas as linhas são reconstruídas.</p>
    `,
        afterContent: `
      <h3>O que <code>renderItem</code> retorna</h3>
      <ul>
        <li>Devolva um elemento, como <code>li(...)</code>, <code>tr(...)</code> ou um builder SVG. Devolva <code>null</code> ou <code>undefined</code> para pular um item. Strings, nós de texto e fragments não renderizam nada.</li>
        <li>Não devolva <code>when()</code> ou <code>list()</code> diretamente. Coloque-os dentro do elemento da linha: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Para esconder itens, filtre dentro de <code>items()</code>, e não no <code>renderItem</code>.</li>
        <li>Mantenha o <code>renderItem</code> livre de side effects. O Nuclo pode chamá-lo mais de uma vez para o mesmo item.</li>
      </ul>
      <h3>O índice</h3>
      <p>O <code>index</code> é a posição do item no momento em que a linha foi criada, e não é atualizado quando as linhas se movem. Para saber a posição atual, use um valor dinâmico: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Iteráveis</h3>
      <p>Qualquer iterável serve: arrays, <code>Set</code>, generators e <code>map.values()</code>. Retornar o mesmo array ou <code>Set</code> toda vez não tem problema. Já um iterator, como um generator ou <code>map.values()</code>, se esgota depois de uma passada, então crie-o dentro de <code>items()</code>, a cada chamada. Iterar um <code>Map</code> diretamente cria arrays <code>[key, value]</code> novos a cada vez, e todas as linhas seriam reconstruídas. Prefira <code>map.values()</code>.</p>
      <h3>Posicionamento</h3>
      <p>As linhas aparecem no ponto onde o <code>list()</code> está entre os irmãos, entre dois marcadores de comentário. Os outros filhos do pai não são tocados. O <code>list()</code> também funciona dentro de builders SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() e into()",
        content: `
      <p>O <code>region()</code> marca um lugar com nome na árvore, e o <code>into()</code> o preenche de qualquer outro ponto, a qualquer profundidade. O layout não recebe o conteúdo como prop, e o componente que monta o conteúdo nem precisa saber onde ele vai parar.</p>
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
        <li>O <code>into()</code> deixa só um comentário no lugar onde foi escrito. O conteúdo em si é renderizado entre os marcadores da região.</li>
        <li>A ordem não importa. Um <code>into()</code> construído antes da sua região fica esperando e aparece assim que a região é construída. As views aparecem na ordem em que foram escritas.</li>
        <li>O conteúdo vive tanto quanto a view. Quando o <code>when()</code> que contém um <code>into()</code> fecha, ou a linha do <code>list()</code> é removida, o conteúdo sai da região. Abrir de novo adiciona uma cópia, não duas.</li>
        <li>Quando uma região desaparece, por exemplo porque o <code>when()</code> dela fechou, suas views voltam a esperar. Uma região criada depois com o mesmo id as exibe.</li>
        <li>Um <code>into()</code> cujo id não corresponde a nenhuma região não renderiza nada e não gera erro, então confira a grafia.</li>
        <li>Ids são únicos na árvore. Uma segunda região criada com um id já ativo registra um aviso.</li>
        <li>Regiões funcionam com <a href="#api-ssr">renderização no servidor</a>. No <code>hydrate()</code>, cada view reaproveita o HTML que o servidor renderizou, em vez de construí-lo de novo.</li>
      </ul>
      <h3>Opções</h3>
      <ul>
        <li><code>id</code>: o nome que as chamadas de <code>into()</code> usam para achar a região.</li>
        <li><code>type</code>: <code>'latest'</code> (o padrão) mostra só a view mais recente. <code>'stack'</code> mostra todas as views, na ordem de chegada.</li>
        <li><code>empty</code>: o que é renderizado enquanto a região não tem nenhuma view.</li>
      </ul>
      <h3>Regiões empilhadas</h3>
      <p>Com <code>type: 'stack'</code>, uma view que abre por cima de outra não reconstrói a de baixo: DOM, foco e estado de formulário continuam intactos. Use isso para uma camada, como um diálogo sobre uma página.</p>
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
      <p>Passe um objeto para preencher mais de uma região com um único <code>into()</code>. Cada valor pode ser um filho ou um array de filhos, e as duas formas podem ser aninhadas: um <code>into()</code> dentro do conteúdo de outra view aponta para a região dele.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Um diálogo aberto lá do fundo da árvore</h3>
      <p>A região de overlay fica na raiz. Qualquer componente, em qualquer profundidade, abre um diálogo ao envolver um <code>into()</code> em um <code>when()</code>. Quando o <code>when()</code> fecha, o diálogo sai da região.</p>
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
      <p>Cada linha de um <code>list()</code> é uma view. Uma região empilhada as exibe em ordem, e tirar um item do array tira o toast correspondente.</p>
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
      <p>No padrão <code>type: 'latest'</code>, a view mais recente vence. O layout é dono do título, e quem o nomeia é a página que estiver aberta. Uma página sem <code>into('title', …)</code> deixa o texto de <code>empty</code> aparecer.</p>
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
      <p>O conteúdo de um <code>into()</code> é conteúdo Nuclo como outro qualquer. As funções dentro dele são valores que dependem de estado e se atualizam no <code>update()</code>, esteja a região onde estiver.</p>
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
      <p>O <code>into()</code> do dashboard é escrito uma única vez. Com o usuário deslogado não existe região <code>main</code>, então a view fica esperando. No login, a região é construída e a view aparece. No logout, a região some e a view volta a esperar.</p>
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
      <p>Uma view pode conter um <code>region()</code>, e outras views podem mandar conteúdo para ele. Aqui, a página do editor traz sua própria região <code>tabs</code>, e cada aba a preenche. Quando o editor fecha, a região vai embora com ele.</p>
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
      <p>O <code>update()</code> só executa valores dinâmicos. Valores estáticos, como o texto em <code>h1(labels[lang].title)</code>, ficam fixos desde a construção da árvore. O <code>forceUpdate()</code> chama seus componentes de novo e ajusta o DOM existente à nova árvore, valores estáticos inclusos. Reserve-o para mudanças raras e globais no app, como a troca de idioma. Para todo o resto, <code>update()</code>.</p>
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
      <p>Sem argumentos, o <code>forceUpdate()</code> reconstrói toda raiz renderizada com <code>render(App)</code> ou <code>hydrate(App)</code>. Raízes renderizadas com <code>render(App())</code> são ignoradas. Se um componente lança erro, ele é registrado e aquela raiz fica com o DOM antigo. Um erro lançado mais tarde, enquanto a nova construção está sendo aplicada, também é registrado, mas as partes que já foram ajustadas continuam ajustadas.</p>
      <h3>O que permanece e o que muda</h3>
      <ul>
        <li>Os elementos filhos são pareados em ordem, por tag. Um elemento que combina é reaproveitado, então o foco e o que foi digitado nos inputs permanecem, e os hooks <code>onMount</code> dele não rodam de novo. Assim que a tag de um filho diverge, esse filho e todos os irmãos seguintes são construídos do zero.</li>
        <li>Texto, atributos, classes, estilos, listeners, ramos de <code>when()</code> e linhas de <code>list()</code> acompanham a nova construção.</li>
        <li>Elementos novos são criados, com seus hooks <code>onMount</code>. Elementos que a nova construção deixou de produzir são removidos, e os hooks <code>onDestroy</code> deles rodam.</li>
        <li>As linhas de <code>list()</code> também são pareadas por posição, e não por item, então uma linha reaproveitada pode acabar mostrando outro item.</li>
        <li>Atributos que a nova construção não define mais não são removidos.</li>
      </ul>
      <div class="docs-callout"><strong>Atenção:</strong> o estado declarado dentro de uma função de componente é reiniciado, porque a função roda de novo. O estado que precisa sobreviver deve ficar fora do componente.</div>
      <p><strong>Forma explícita.</strong> <code>forceUpdate(App(), parent)</code> reconstrói uma árvore dentro de <code>parent</code> e devolve a raiz. Ele não registra essa raiz para chamadas futuras. Assim como o <code>hydrate()</code>, espera que a raiz seja o primeiro nó de <code>parent</code>; se o primeiro nó tiver outra tag, ele é substituído.</p>
      <p>No servidor, o <code>forceUpdate()</code> não faz nada.</p>
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
      <p>Constrói a árvore e anexa o elemento raiz a <code>parent</code>, que por padrão é o <code>document.body</code>. Devolve o elemento raiz.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Você pode passar o componente (<code>render(App)</code>) ou o builder que ele devolve (<code>render(App())</code>). O DOM resultante é o mesmo. Só o <code>render(App)</code> permite que o <a href="#api-force-update"><code>forceUpdate()</code></a> reconstrua a raiz depois, então prefira essa forma.</li>
        <li>Ele anexa, não substitui. Não limpa <code>parent</code>, então chamá-lo duas vezes adiciona duas cópias.</li>
        <li>Quando o <code>render()</code> retorna, todos os <code>onMount</code> da árvore já rodaram.</li>
        <li>Renderize em um elemento que esteja no documento. Veja <a href="#api-update"><code>update()</code></a>.</li>
        <li>A raiz precisa ser um elemento, como <code>div(...)</code>, e não um <code>when()</code> ou <code>list()</code>.</li>
        <li>O <code>index</code> é interno e não define onde o elemento é inserido. Deixe-o de fora.</li>
      </ul>
      <p>Um componente passado como <code>render(App)</code> não pode ter parâmetros. Um parâmetro obrigatório é erro de tipo. Um opcional passa pelo type check, mas o <code>render()</code> lança um erro em runtime. Se o componente recebe props, envolva-o:</p>
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
      <p>Aproveita o HTML gerado por <a href="#api-ssr"><code>renderToString()</code></a>. Em vez de recriar o DOM, reutiliza os elementos existentes, anexa os listeners de eventos e liga os valores dinâmicos, os <code>when()</code> e os <code>list()</code>, para que o <code>update()</code> funcione dali em diante. Por fim, executa os hooks <code>onMount</code>. O <code>parent</code> é o <code>document.body</code> por padrão, e o retorno é o elemento raiz.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Use o mesmo componente, com os mesmos dados, que o servidor usou.</li>
        <li>Faça o hydrate em um container dedicado. A raiz do app deve ser o primeiro nó dele, e espaços em branco antes não atrapalham. Se outro nó vier primeiro, o Nuclo o substitui e deixa a cópia do servidor para trás.</li>
        <li>Como no <code>render()</code>, passe <code>App</code> e não <code>App()</code>, para que o <code>forceUpdate()</code> consiga reconstruir a raiz depois. <code>App</code> não pode ter parâmetros: com um opcional, o <code>hydrate()</code> não anexa nada, sem avisar. Se o componente recebe props, envolva-o: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Se não há HTML vindo do servidor, use o <code>render()</code>.</li>
      </ul>
      <h3>Quando o servidor e o cliente diferem</h3>
      <p>Quem manda é o cliente:</p>
      <ul>
        <li>Tag de raiz diferente: o nó é substituído por DOM novo. Container vazio: o DOM novo é anexado.</li>
        <li>Texto divergente é corrigido. Itens de <code>list()</code> e ramos de <code>when()</code> diferentes seguem o cliente.</li>
        <li>Filhos a mais vindos do servidor são removidos, e os que faltam são criados.</li>
        <li>Atributos que o servidor escreveu e o cliente não define ficam como estão.</li>
      </ul>
      <p>O <code>renderToString()</code> escreve comentários HTML como marcadores, como o <code>&lt;!-- text-0 --&gt;</code> antes de cada nó de texto. O <code>hydrate()</code> depende deles, então não remova os comentários do HTML do servidor. Sem os marcadores, a hydration apaga as linhas de <code>list()</code>, e tanto <code>list()</code> quanto <code>when()</code> deixam de atualizar.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Renderização no servidor (SSR)",
        content: `
      <p>Transforme um componente em uma string HTML no servidor. No navegador, chame <a href="#api-hydrate"><code>hydrate()</code></a> com o mesmo componente para tornar esse HTML interativo. Runtimes de servidor não têm <code>document</code>, então importe o <a href="#api-polyfill"><code>nuclo/polyfill</code></a> antes de tudo.</p>
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
      <p>Mantenha o <code>id="nuclo-styles"</code> na tag style. O cliente reaproveita esse elemento e acrescenta só as regras novas. Veja <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>O que roda no servidor</h3>
      <ul>
        <li>Cada chamada de <code>renderToString()</code> constrói a árvore e executa cada valor dinâmico uma vez.</li>
        <li>Handlers de eventos, <code>onMount</code> e <code>onDestroy</code> nunca rodam. <code>update()</code>, <code>scope()</code> e <code>forceUpdate()</code> não fazem nada.</li>
        <li>A renderização é síncrona: carregue os dados antes e só então renderize.</li>
        <li>Nada fica registrado entre uma renderização e outra, então um mesmo processo atende quantas requisições for preciso. Passe os dados da requisição como argumentos, como em <code>renderToString(Page(user))</code>. Variáveis no escopo do módulo são compartilhadas entre todas as requisições.</li>
        <li>Não chame <code>render()</code> no servidor, porque ele anexa ao <code>document.body</code> compartilhado.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Aceita um builder (<code>App()</code>), um componente (<code>App</code>) ou um nó do DOM. <code>null</code> e <code>undefined</code> resultam em <code>""</code>. A raiz precisa ser um elemento. Um componente passado como <code>renderToString(Page)</code> não pode ter parâmetros, então, se ele precisa de dados, passe <code>Page(user)</code>.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Texto e valores de atributos passam por escape de HTML. O texto dentro de <code>script()</code> e <code>style()</code> é escrito como está, só com as tags de fechamento quebradas, então nunca coloque entrada do usuário ali.</li>
        <li>Ele não lança erros. Se o componente, uma função de <code>list()</code> ou a condição de um <code>when()</code> falha, ou se o polyfill não foi importado, o erro é registrado e o retorno é <code>""</code>. Se a requisição deve falhar nesse caso, verifique se o resultado veio vazio. Uma função de texto ou atributo que lança erro simplesmente renderiza vazia.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>Equivale a <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Envolve a saída em um elemento. O <code>containerTag</code> é <code>"div"</code> por padrão, e o <code>containerAttrs</code>, <code>{}</code>. Os valores dos atributos passam por escape, mas os nomes são escritos exatamente como você os passa, então use nomes HTML, como <code>class</code>. Nunca passe entrada do usuário como a tag.</p>
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
      <p>Um mini DOM que permite ao Nuclo construir árvores em Node e Bun. Importe uma vez, antes da primeira renderização. Para a maioria dos apps, o import simples basta.</p>
      <ul>
        <li>Quando não existe <code>window</code>, ele define <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> e <code>HTMLElement</code>, mas só os que estiverem faltando. Ele não cria <code>window</code>.</li>
        <li>Em um navegador, ou sob jsdom, não faz nada.</li>
        <li><code>Event</code> e <code>CustomEvent</code> são os construtores do próprio runtime. <code>Node</code>, <code>Element</code> e <code>HTMLElement</code> são aliases das classes do polyfill.</li>
      </ul>
      <p>É um DOM para montar árvores, não um navegador. Não existem <code>innerHTML</code> nem <code>getElementById</code>, o <code>querySelector()</code> devolve <code>null</code> e os listeners de eventos são ignorados. Para obter o HTML, use <code>renderToString()</code>.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
