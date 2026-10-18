import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "Estilização",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>Pega um objeto de estilo tipado e devolve classes CSS geradas. É só passar o resultado para qualquer builder de tag. No navegador, as regras caem num único elemento <code>&lt;style id="nuclo-styles"&gt;</code>. No servidor, quem entrega essas regras é o <a href="#api-css-text"><code>getCssText()</code></a>.</p>
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
        <li><code>css()</code> gera uma classe para as declarações base e mais uma para cada pseudo-estado, seletor ou bloco de media. O card acima, por exemplo, termina com duas classes.</li>
        <li>Os nomes de classe são hashes do conteúdo: estilos idênticos dividem a mesma classe, e servidor e cliente chegam exatamente aos mesmos nomes.</li>
        <li>Declare os estilos uma vez só, no nível do módulo. O <code>css()</code> usa o objeto como chave de cache, então criar um objeto novo a cada chamada obriga o Nuclo a reprocessar tudo toda vez.</li>
        <li>Alterar um objeto de estilo depois de entregá-lo ao <code>css()</code> não surte efeito nenhum.</li>
        <li>Todo estilo continua registrado enquanto a página (ou o processo do servidor) estiver de pé. Para valores que variam por item, como uma largura vinda de dados, use o <a href="#attributes">atributo <code>style</code></a>.</li>
      </ul>
      <h3>Estilos nomeados</h3>
      <p>Se quiser uma classe legível, passe um nome como primeiro argumento:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>A classe base é o nome, sem enfeite. Os demais blocos ganham <code>name-&lt;hash&gt;</code>.</li>
        <li>O nome precisa ser um nome de classe válido. Se não for, o Nuclo emite um aviso e gera um por conta própria.</li>
        <li>Os nomes são globais. Dois estilos diferentes com o mesmo nome fazem o Nuclo avisar.</li>
      </ul>
      <h3>Como usar o resultado</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p>Tanto <code>String(card)</code> quanto <code>card.className</code> devolvem os nomes de classe.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Objetos de Estilo",
        content: `
      <p>O objeto que você passa para o <code>css()</code> aceita as propriedades CSS de sempre em camelCase, um punhado de atalhos e chaves aninhadas para pseudo-estados, seletores e media queries. O TypeScript autocompleta tudo isso. O que ficar fora do conjunto tipado, como <code>borderTopLeftRadius</code>, <code>fill</code> ou <code>paddingInline</code>, vai dentro de <code>raw</code> (mais abaixo).</p>
      <h3>Valores</h3>
      <ul>
        <li>Números viram <code>px</code>, menos o <code>0</code> e as propriedades sem unidade: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> e <code>gridRow</code>. Dentro de <code>raw</code>, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> e <code>animation-iteration-count</code> também dispensam unidade.</li>
        <li>Strings entram do jeito que você escreveu. <code>null</code>, <code>undefined</code> e <code>false</code> são simplesmente pulados.</li>
        <li><code>lineHeight</code> (e <code>leading</code>) não tem unidade, então <code>leading: 24</code> quer dizer 24 vezes o tamanho da fonte. Para pixels, escreva <code>"24px"</code>.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Atalhos</h3>
      <table>
        <thead><tr><th>Chave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, geral e por lado</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding horizontal (esquerda e direita) / vertical (topo e base)</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>o mesmo, só que para margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height e seus limites mínimo e máximo</td></tr>
          <tr><td><code>size</code></td><td>width e height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Estas chaves aceitam <code>true</code>:</p>
      <table>
        <thead><tr><th>Chave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (não mexe no display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudo-estados</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> e <code>firstLetter</code>. Todos podem ser aninhados: <code>hover: { focus: {…} }</code> vira <code>:hover:focus</code>.</p>
      <h3>Seletores e at-rules</h3>
      <p>Uma chave que começa com <code>&amp;</code> é um seletor, e cada <code>&amp;</code> é trocado pela classe. Uma chave que começa com <code>@</code> é uma at-rule: <code>@media</code>, <code>@container</code> ou <code>@supports</code>.</p>
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
        <li>A chave tem que começar com <code>&amp;</code>. Algo como <code>".dark &amp;"</code> é ignorado; o jeito certo é <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Dois blocos <code>@media</code> aninhados são combinados com <code>and</code>. Se uma das queries começa com um tipo de mídia (<code>print</code>, <code>only screen</code>), ela vai para a frente, já que a gramática só aceita o tipo logo no início. Quando o par não dá para achatar (dois tipos de mídia, ou um <code>not</code> na frente), o Nuclo avisa e fica só com a query interna. Qualquer outra at-rule aninhada simplesmente substitui a externa.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Use <code>raw</code> para qualquer propriedade, com o nome escrito exatamente como no CSS. Números continuam ganhando <code>px</code>, então passe strings:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Qualquer outra chave plana é convertida para kebab-case e escrita como veio, então um typo como <code>colr: 'red'</code> vira uma declaração que o navegador joga fora. Um objeto aninhado sob uma chave que não seja pseudo-estado, screen, nem uma chave com <code>&amp;</code> ou <code>@</code> é ignorado. O TypeScript acusa os dois casos.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Combina estilos. Se duas entradas definem a mesma propriedade, a última ganha.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Entradas falsy são descartadas, arrays são achatados, e strings são separadas e deduplicadas.</li>
        <li>Classes geradas para o mesmo bloco (base, o mesmo pseudo-estado, a mesma media query) são fundidas numa classe nova. Qualquer outro nome de classe passa direto, intacto.</li>
        <li>Só o <code>cx()</code> conhece a ordem dos argumentos. Com <code>div(base, blue)</code>, as duas classes são adicionadas, e quem vence é a regra criada por último. Estilos que se sobrescrevem devem ficar juntos numa mesma chamada de <code>cx()</code>.</li>
        <li>Quando o bloco de um estilo nomeado é fundido com o de outra entrada, a classe resultante é <code>name-&lt;hash&gt;</code>, e não o nome puro. Blocos que não se fundem mantêm a classe original, então <code>cx(pageTitle, 'extra')</code> continua com <code>page-title</code>.</li>
      </ul>
      <h3>Classes dinâmicas</h3>
      <p>Passe uma função que sempre devolva <code>cx(...)</code>:</p>
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
      <p>Na primeira execução, a função precisa retornar um resultado de estilo. Com <code>() =&gt; active &amp;&amp; activeButton</code>, o que aparece na tela é o texto "false", e não uma classe.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Devolve seus próprios <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code>, já amarrados a um tema. Um tema dá nome aos valores: com o tema abaixo, <code>borderColor: 'border'</code> escreve <code>#e5e7eb</code>, e o TypeScript autocompleta esses nomes. Cada entrada de <code>screens</code> vira uma chave de estilo para uma media query, como <code>md: {…}</code>.</p>
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
        <thead><tr><th>Chave do tema</th><th>Usada por</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> e cada lado, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>novas chaves de estilo, como <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Um nome do tema só é resolvido quando ocupa o valor inteiro. <code>border: "1px solid primary"</code> não é resolvido.</li>
        <li>Um valor de screen sem <code>@</code> vira <code>@media &lt;value&gt;</code>. Se começar com <code>@</code>, é usado exatamente como está, por exemplo <code>"@container (min-width: 400px)"</code>.</li>
        <li>Screens só existem em instâncias criadas com <code>createCss()</code>. O <code>css()</code> global não tem nenhum, mas aceita chaves <code>@media</code>.</li>
        <li>Todas as instâncias e os helpers globais dividem uma única folha de estilos. As regras de media dos screens saem na ordem em que os screens foram declarados, e não na ordem em que você os usa, então liste os screens de <code>min-width</code> do menor para o maior. Use uma única instância de <code>createCss()</code> por app, para que essa ordem seja sempre a do seu tema.</li>
        <li><code>theme</code>, no resultado, é o tema que você passou.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Monta uma função que devolve um estilo a partir de um conjunto de opções, como a intenção e o tamanho de um botão.</p>
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
        <li>Os estilos são fundidos nesta ordem: <code>base</code>, o valor escolhido em cada grupo e, por fim, cada variante composta que bater. Em cada propriedade, o estilo mais tardio vence.</li>
        <li>Uma opção ausente, <code>undefined</code> ou <code>null</code> cai no padrão. Grupo sem padrão é pulado.</li>
        <li>Um grupo que só tem as chaves <code>true</code> e <code>false</code> recebe um booleano.</li>
        <li>Uma variante composta vale quando todos os grupos que ela lista batem, contando os padrões.</li>
        <li>Cada seleção é construída uma única vez e fica em cache.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() e globalStyle()",
        content: `
      <p><code>keyframes()</code> registra uma animação e devolve o nome gerado para ela. As chaves dos frames são <code>from</code>, <code>to</code> e porcentagens, como <code>"50%"</code> ou <code>"0%, 100%"</code>. Os frames só aceitam propriedades planas, e frames idênticos devolvem o mesmo nome.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> adiciona uma regra para qualquer seletor:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>O seletor é usado exatamente como você escreveu.</li>
        <li>Só propriedades planas funcionam. Pseudo-estados, screens e chaves <code>@</code> são ignorados, então o <code>globalStyle()</code> não consegue escrever regras de media.</li>
        <li>A mesma regra é adicionada uma vez só. Um estilo diferente para o mesmo seletor gera uma segunda regra, e a mais recente vence.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() e resetStyles()",
        content: `
      <p><code>getCssText()</code> devolve todas as regras que <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> e <code>globalStyle()</code> criaram neste processo: primeiro as regras base, depois os blocos <code>@media</code>, <code>@container</code> e <code>@supports</code>. É a peça que você usa no SSR.</p>
      <ul>
        <li>Chame-a depois do <code>renderToString()</code>. As regras criadas durante o render entram no resultado.</li>
        <li>O conjunto vale para o processo inteiro, não para uma página ou requisição, e só cresce. Isso é seguro, porque os nomes de classe são hashes do conteúdo.</li>
        <li>Coloque o CSS retornado em <code>&lt;style id="nuclo-styles"&gt;</code>. O cliente reaproveita esse elemento e pula as regras que já estão lá. Com outro id, ou sem id, o cliente cria uma segunda folha de estilos e repete todas as regras.</li>
        <li>O texto não é escapado, então jamais coloque entrada não confiável em valores de estilo.</li>
      </ul>
      <p><code>resetStyles()</code> é um helper de teste. Ele apaga todas as regras e o elemento <code>#nuclo-styles</code>. Os estilos criados antes continuam com seus nomes de classe, mas ficam sem CSS. Não use em um app nem em um servidor.</p>
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
    title: "Roteamento",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>Pacote separado:</strong> o <code>nuclo-router</code> não faz parte do pacote principal do Nuclo. Instale-o ao lado do <code>nuclo</code>. Ele ainda está em preview, então a API pode mudar.</div>
      <p>Roteamento para o Nuclo: SSR, hydration, rotas com code splitting e preload em idle, tudo construído em cima de <code>list()</code> e <code>update()</code>. Pesa cerca de ${NUCLO_ROUTER_GZIP_KB} KB com gzip, não depende de nada além do próprio Nuclo e não tem side effects, então o tree-shaking o remove do bundle quando você não o usa.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Se preferir, use <code>pnpm add</code>, <code>yarn add</code> ou <code>bun add</code> com os mesmos dois nomes. É preciso ter o <code>nuclo</code> 0.3 ou superior como peer dependency.</p>
      <p>O router decide <em>o que</em> carregar; o app diz <em>onde</em>, com <code>router.outlet()</code>. Por baixo é um único <code>list()</code> sobre a pilha de camadas, com uma linha por camada, então uma página comum ocupa uma linha só. Servidor e cliente montam a mesma árvore, e por isso o <code>hydrate()</code> aproveita os nós que vieram do servidor em vez de trocá-los. O resto é <code>history</code>, um listener de <code>click</code> delegado e <code>requestIdleCallback</code>.</p>
      <h3>Um único import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p>O <code>start()</code> resolve os módulos da rota correspondente antes de retornar, então a primeira árvore já nasce completa, tanto no servidor quanto no cliente. Daí em diante o router lê direto da rota que ele iniciou: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
      <h3>Um app completo</h3>
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
      <p>Pronto, essa é a integração inteira. Os links funcionam porque um <code>&lt;a href&gt;</code> é só um <code>&lt;a href&gt;</code>: um listener delegado no <code>document</code> intercepta os links que pertencem ao router e deixa todos os outros com o navegador.</p>
      <p>No servidor, o <code>start()</code> devolve um <code>Route</code> por requisição e não toca no router, então requisições concorrentes nunca enxergam a rota umas das outras. O <code>route.run()</code> faz desse Route o que o router (e, portanto, o outlet) lê enquanto durar o render. No navegador existe um Route por carregamento de página, e o <code>start()</code> o torna o do próprio router. Aqui não precisa de <code>run()</code>.</p>
      <p>Uma página recebe seu <a href="#router-api"><code>RouteContext</code></a> e suas <a href="#router-api"><code>PageProps</code></a>, no formato <code>(ctx, { layer, data, outlet, beforeLeave })</code>, e pode declarar menos argumentos. O retorno é qualquer coisa que o <code>list()</code> aceite. Para preencher também outro pedaço do layout, devolva um <code>into()</code> de dentro da página, como <code>div(article(…), into('sidebar', nav(…)))</code>. Esse conteúdo vai embora junto com a página. Veja <a href="#router-regions">Páginas e regiões</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Padrões e rotas aninhadas",
        content: `
      <table>
        <thead><tr><th>Padrão</th><th>Casa com</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>exatamente esse caminho</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>qualquer coisa que não casou com nada, o seu 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>A precedência é: estáticos primeiro, depois os dinâmicos na ordem de declaração e, por último, os catch-all, do prefixo mais longo para o mais curto. Por isso o <code>'*'</code> só pega o que nenhuma outra rota pegou e pode ficar em qualquer posição da tabela. Barras no fim, barras duplicadas e percent-encoding são normalizados, e os params chegam já decodificados. O matching é uma comparação de segmentos por padrão; nenhuma regex é construída ou executada.</p>
      <h3>Rotas relativas</h3>
      <p>Um padrão escrito com <code>./</code> é relativo ao pai que o declara, e um href escrito com <code>./</code> é relativo à rota ativa. Juntos, formam uma seção reutilizável que significa a mesma coisa debaixo de qualquer pai. O valor de uma tabela é um loader ou outra tabela, cujas chaves são relativas a ela:</p>
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
      <p>Essas duas linhas geram os seis padrões, sem repetir caminho nenhum. Os dois pais recebem os mesmos objetos de loader, então dividem um único cache de módulos e um único <code>import()</code>.</p>
      <ul>
        <li>Dentro de uma tabela filha, <code>'./x'</code>, <code>'/x'</code> e <code>'x'</code> querem dizer a mesma coisa, <code>'/'</code> é o próprio caminho do pai, e <code>'*rest'</code> dá à seção o seu próprio catch-all. O aninhamento pode ir tão fundo quanto você quiser.</li>
        <li>As chaves do nível superior valem como foram escritas, então <code>'*'</code> continua sendo <code>'*'</code>.</li>
        <li>Um filho sob um pai <code>*catch-all</code> dá erro no <code>createRouter()</code>, porque o catch-all precisa fechar o padrão.</li>
      </ul>
      <h3>Páginas pai e <code>outlet()</code></h3>
      <p>Pai e filhos formam uma hierarquia de verdade. O pai renderiza, e o filho renderiza dentro dele, no ponto em que ele chama <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Navegar entre filhos não reconstrói o pai. O nó DOM dele é o mesmo, então foco, posição de scroll, input pela metade e qualquer state guardado na closure continuam intactos.</p>
      <ul>
        <li>Uma página sem rota filha não renderiza nada no outlet, então o layout pode chamá-lo sem condição. Já um pai que tem uma rota filha e nunca chama <code>outlet()</code> engole essa rota.</li>
        <li>Não existem rotas index. O <code>'/'</code> é o próprio layout, então o caminho do pai renderiza o layout com o outlet vazio, e não uma página index separada lá dentro. Ponha o conteúdo de entrada no layout ou dê a ele um caminho filho de verdade.</li>
      </ul>
      <p>A mesma chamada funciona a partir de qualquer um dos pais, e também numa página que não sabe em qual deles está:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> e <code>..</code> são resolvidos a partir do caminho da rota atual, e não do "diretório" da URL. Partindo de <code>/invoices/42</code>, <code>./preview</code> é <code>/invoices/42/preview</code> (o navegador diria <code>/invoices/preview</code>), e uma barra no fim da URL não muda nada. O <code>../</code> sobe um segmento e para na raiz. Query e hash seguem junto, o <code>base</code> é reaplicado, e o caminho absoluto resolvido é o que vai para o history. É o mesmo desvio da resolução de URL que o React Router adota no <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Só <code>./</code> e <code>../</code> são relativos à rota. Um <code>preview</code> solto em um href segue as regras normais do navegador.</li>
        <li>Monte links relativos com <code>router.href('./preview')</code> em vez de escrever <code>href="./preview"</code> na mão. O <code>href()</code> resolve na hora do render, então o markup que vai para o cliente é absoluto e continua correto para um crawler, para um clique com o botão do meio e com o JavaScript desligado.</li>
      </ul>
      <h3>O que fica, e o que é refeito</h3>
      <table>
        <thead><tr><th>Nó</th><th>Na navegação</th></tr></thead>
        <tbody>
          <tr><td>um pai cujo padrão e caminho não mudaram</td><td><strong>mantido</strong>: o mesmo nó, e o <code>load()</code> dele não roda de novo</td></tr>
          <tr><td>a página correspondente</td><td><strong>mantida</strong> quando padrão e caminho são os mesmos e ela não tem <code>load()</code>, então uma mudança de query ou hash a preserva. Uma rota com loader é atualizada a cada visita.</td></tr>
          <tr><td>um pai cujo caminho mudou</td><td>reconstruído, junto com tudo que está debaixo dele</td></tr>
          <tr><td>uma camada empilhada</td><td>renderiza só a página correspondente. Os pais dela já estão montados na linha de baixo.</td></tr>
        </tbody>
      </table>
      <p>Uma página preservada fica com o <code>ctx</code> com que foi construída. É esse o sentido de <code>ctx</code> em qualquer lugar: para valores atuais, leia <code>router.*</code>. State guiado pela query, como filtros, paginação e abas, lê <code>router.search</code> dentro de um valor dinâmico e escreve com <code>router.go('?page=2', { replace: true })</code>. A página, o foco e o input pela metade ficam exatamente onde estavam.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Páginas e regiões",
        content: `
      <p>O <code>router.outlet()</code> põe a página em um lugar só. Quando ela também precisa de uma sidebar, de uma toolbar ou de um título em outro ponto do layout, ela os preenche com <a href="#api-region"><code>into()</code></a>. O layout marca o ponto com <code>region()</code>, e a página devolve um <code>into()</code> ao lado do seu próprio conteúdo. O layout nunca recebe conteúdo de página como prop, e a navegação nunca o reconstrói.</p>
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
      <p>O conteúdo da página é uma linha do <code>list()</code> do outlet, e um <code>into()</code> vive tanto quanto a linha que o contém. Por isso o conteúdo da sidebar chega junto com a página e sai junto com ela: navegar para uma página sem <code>into('sidebar', …)</code> faz a região voltar a exibir o conteúdo de <code>empty</code>. A página pode usar <code>ctx</code> e <code>data</code> nas duas partes, já que ambas são montadas pela mesma função.</p>
      <h3>O que acontece na navegação</h3>
      <ul>
        <li><strong>Página preservada, regiões preservadas.</strong> Uma mudança de query ou hash que <a href="#router-patterns">mantém a página</a> também deixa o conteúdo das regiões em paz. Se a sidebar depende disso, leia <code>router.search</code> dentro de um valor dinâmico.</li>
        <li><strong>Página reconstruída, regiões preenchidas de novo.</strong> Quando a rota muda, a linha antiga sai e as views <code>into()</code> da nova página assumem. Nada fica para trás.</li>
        <li><strong>Uma camada empilhada acrescenta uma view.</strong> A camada é uma linha posterior do outlet, então o <code>into()</code> dela é uma view mais nova da mesma região. Com o <code>type: 'latest'</code> padrão, ela cobre a view da página até a camada fechar, e aí a da página volta a aparecer. Com <code>type: 'stack'</code>, as duas aparecem.</li>
        <li><strong>Uma página pai também pode preencher regiões.</strong> As views dela permanecem enquanto os filhos mudam, porque o pai não é reconstruído.</li>
        <li><strong>O SSR funciona sem ajuste.</strong> O servidor monta a página dentro de <code>route.run()</code>, então as views <code>into()</code> já vão no HTML, e o <code>hydrate()</code> as aproveita.</li>
      </ul>
      <h3>Várias regiões a partir de uma página</h3>
      <p>Passe um objeto para preencher mais de uma região de uma vez. O conteúdo principal da página continua passando pelo outlet, então devolva-o ao lado do <code>into()</code>:</p>
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
      <h3>Qual ferramenta para qual trabalho</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> serve para uma rota filha: conteúdo que a URL decide, renderizado dentro da página pai. Veja <a href="#router-patterns">Rotas aninhadas</a>.</li>
        <li><strong><code>into()</code></strong> serve para a página correspondente se espalhar pelo layout. O conteúdo é da página e usa os dados dela.</li>
        <li><strong><code>matches()</code></strong> serve para o layout decidir só pela URL, com uma tabelinha própria e sem nenhuma página no meio. Veja <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Tudo isso pertence à única rota correspondente. O router não conduz duas áreas independentes a partir de uma URL: uma sidebar com rotas próprias é uma região que a página preenche, e não um segundo outlet. Se a sidebar realmente quer router, loading e fallback só dela, mantenha um router sem iniciar e resolva com <code>match()</code> — veja <a href="#router-multi">Múltiplos routers e loading combinado</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Loaders de rota e code splitting",
        content: `
      <p>Um módulo de página pode exportar uma função <code>load</code>. Ela roda antes de a página ser construída, a cada navegação para aquela rota, e o que ela retornar chega à página como <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>A tabela de rotas não muda: o loader viaja com a página. Ele recebe o <code>RouteContext</code> correspondente, então <code>params</code>, <code>search</code> e <code>path</code> estão todos à mão. Pode ser síncrono ou assíncrono e roda também no servidor, de modo que uma página renderizada no servidor já sai com os dados no HTML, em vez de buscá-los depois da hydration.</p>
      <p><strong>O módulo fica em cache. Os dados, não.</strong> O chunk de uma rota é buscado uma vez e reaproveitado, mas o loader roda de novo a cada navegação. É por isso que <code>/blog/a</code> e <code>/blog/b</code> nunca se confundem, e que um loader que falhou pode simplesmente ser tentado outra vez.</p>
      <table>
        <thead><tr><th>Situação</th><th>Comportamento</th></tr></thead>
        <tbody>
          <tr><td>enquanto ele roda</td><td><code>router.pending</code> fica true e a página em que você estava continua na tela</td></tr>
          <tr><td>ele lança erro ou rejeita</td><td>cai em <code>router.error</code>. O <code>go()</code> continua sem nunca rejeitar, e a navegação pode ser repetida.</td></tr>
          <tr><td>durante o <code>start()</code></td><td>a rejeição sai do próprio <code>start()</code>. Ainda não existe um Route para recebê-la.</td></tr>
          <tr><td>uma camada empilhada</td><td>roda o próprio loader, com os próprios dados</td></tr>
          <tr><td>o preloader em idle</td><td>só esquenta módulos. Não tem contexto para passar, e acabaria buscando dados de uma rota que você talvez nunca abra.</td></tr>
          <tr><td>navegar de novo para a mesma URL</td><td>o loader roda outra vez e a linha é reconstruída. Uma rota sem loader mantém a linha.</td></tr>
        </tbody>
      </table>
      <p>Para revalidar, navegue para onde você já está, sem criar uma nova entrada no history:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Começando os dados junto com o chunk</h3>
      <p>Um <code>load</code> exportado pelo módulo da página só pode rodar depois que o módulo chegou, então numa navegação a frio o chunk vem primeiro e os dados depois. Para disparar os dois ao mesmo tempo, declare o loader na tabela com <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Ele substitui o <code>load</code> do próprio módulo e, como ele, roda a cada visita. Se algo rejeitar enquanto o chunk ainda carrega, o erro cai em <code>router.error</code> como qualquer outro.</p>
      <p>Por decisão de design, os dados do servidor não são serializados no HTML: o <code>load</code> do cliente roda de novo na hydration. Se isso pesar, faça o servidor emitir <code>route.data</code>, por exemplo como <code>window.__DATA__</code>, e o loader consultá-lo primeiro. O <code>route.data</code> traz só os dados da página correspondente; o resultado do <code>load()</code> de um pai não está nele.</p>
      <h3>Code splitting e preload</h3>
      <p>O valor de uma rota é sempre uma função que retorna o componente da página, então o componente só é buscado quando precisa:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Só as formas no formato de módulo podem carregar um export <code>load</code>. Se você escolhe um componente nomeado com <code>.then(m =&gt; m.BPage)</code>, o router recebe apenas a função.</p>
      <p>Cada módulo é importado uma vez e fica em cache. Navegações concorrentes para a mesma rota compartilham um único <code>import()</code>. Depois que o usuário deixa a página quieta por <code>idleTimeout</code> (um segundo por padrão, sem toques, teclas, roda do mouse ou scroll), as rotas restantes são carregadas em segundo plano, uma por fatia de idle (<code>requestIdleCallback</code>). Qualquer interação, ou uma navegação que o usuário esteja esperando, pausa o processo até a página ficar ociosa de novo.</p>
      <p>Uma rota pré-carregada ou eager nunca liga o <code>router.pending</code> e aparece antes do próximo paint: sem frame de spinner, sem layout shift. O <code>router.pending</code> só fica true para um módulo ou loader que precisa ser esperado, e a página de saída permanece na tela enquanto isso. Um chunk que falha ao carregar aparece como <code>router.error</code>, nunca como rejeição não tratada, e pode ser tentado outra vez.</p>
    `,
      },
      {
        id: "router-api",
        title: "API do router",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p>A <code>table</code> mapeia um padrão para um loader ou para uma tabela aninhada. Opções:</p>
      <table>
        <thead><tr><th>Opção</th><th>Padrão</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>Prefixo de URL sob o qual o app é servido, como <code>'/docs'</code>. Só casa em fronteira de segmento: <code>/docs/intro</code> está dentro de <code>'/docs'</code>, <code>/docsearch</code> não. URLs fora do prefixo não casam com nada, então o <code>start()</code> rejeita (o seu 404 no servidor) e os links para elas ficam com o navegador.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Carrega em segundo plano os módulos das demais rotas assim que a página fica ociosa. <code>false</code> desliga.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Milissegundos sem toques, teclas, roda do mouse ou scroll antes de o preload começar, ou de retomar depois que o usuário esteve ocupado.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, chamado depois de toda navegação resolvida no navegador, a inicial inclusive, quando o DOM já está em dia. <code>kind</code> é <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Voltar, Avançar, <code>close()</code>) ou <code>'layer'</code>. É o hook para <code>document.title</code>, meta tags, foco, scroll e analytics. Nunca é chamado durante o SSR.</td></tr>
        </tbody>
      </table>
      <p>Devolve o router: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> e todos os membros de <code>Route</code>, exceto <code>run()</code>, lidos diretamente do Route ativo. O ativo é o que o último <code>start()</code> retornou no navegador ou aquele cujo <code>run()</code> está em execução no servidor. Ler um membro sem nenhum dos dois lança erro. A tabela de rotas, o matcher compilado e o cache de módulos moram no router, então no servidor são compartilhados entre requisições.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Resolve a <code>url</code> (padrão: <code>location.href</code> no navegador) para os módulos de página e retorna uma <code>Promise&lt;Route&gt;</code>. Rejeita quando nada casa e a tabela não tem rota <code>'*'</code>; no servidor, esse é o seu 404. No navegador, também torna o Route o ativo do router, anexa os listeners de <code>popstate</code> e de <code>click</code> delegado e agenda o preload. Um segundo <code>start()</code> aposenta o Route anterior por você. No servidor, não toca em nada compartilhado, então renderize dentro de <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Resolve uma URL contra a tabela sem carregar nada: sem import, sem history, sem listeners, sem Route. Retorna um <code>RouteContext</code>, ou <code>null</code> quando a URL está fora do <code>base</code>, não casa com nenhum padrão ou, no navegador, é de outra origem. Aceita só URLs absolutas, já que a resolução de <code>./</code> depende de uma rota ativa.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>As páginas da rota ativa, como um <code>list()</code>. Coloque-o uma vez, onde as páginas devem aparecer. Uma camada empilhada é uma linha posterior dele. Fica vazio antes de o <code>start()</code> resolver e depois do <code>stop()</code>. No servidor, renderiza o Route cujo <code>run()</code> está em execução.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Renderiza a view de uma segunda tabela com a qual o caminho da rota ativa casa, como um <code>list()</code> que você posiciona onde quiser. Veja <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Todos os membros, menos o <code>run()</code>, também existem no router, que é de onde o app os lê.</p>
      <table>
        <thead><tr><th>Membro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>a correspondência ativa. <code>search</code> é um <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> e <code>url</code> refletem sempre o valor atual.</td></tr>
          <tr><td><code>pending</code></td><td>uma navegação está esperando por um módulo ou um loader</td></tr>
          <tr><td><code>error</code></td><td>o último carregamento que falhou, limpo pela navegação seguinte</td></tr>
          <tr><td><code>data</code></td><td>o que o <code>load()</code> da página correspondente retornou, para o servidor serializar. O de um pai não entra aqui.</td></tr>
          <tr><td><code>depth</code></td><td>quantas camadas há na pilha (1 numa página comum)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>navega, carregando o módulo se preciso. Nunca rejeita: um módulo que falha, seja rejeitando ou lançando erro, cai em <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>abre uma rota como uma nova camada por cima e resolve com o valor com que ela for fechada. Aceita <code>./</code>. Rejeita se nada casar ou se o módulo falhar.</td></tr>
          <tr><td><code>href(path)</code></td><td>prefixa um caminho com o <code>base</code>, para usar em <code>a({ href })</code>. Resolve <code>./</code> e <code>../</code> a partir da rota ativa.</td></tr>
          <tr><td><code>stop()</code></td><td>desconecta todos os listeners, dispensa as camadas abertas e esvazia o outlet. É idempotente. Um Route parado ainda responde com a última correspondência, e o <code>go()</code> não faz nada.</td></tr>
          <tr><td><code>run(fn)</code></td><td>chama <code>fn</code> com este Route como o ativo do router e retorna o resultado: <code>route.run(() =&gt; renderToString(App))</code> no servidor. Só síncrono. O Route deixa de ser o ativo quando <code>fn</code> retorna.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>O primeiro argumento de uma página: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. É o contexto com o qual a página foi construída; para valores atuais, leia <code>router.*</code>. Os dois só divergem quando a query ou o hash mudou sem que houvesse rebuild.</p>
      <p>Por padrão, <code>params</code> é <code>{ [name]: string }</code>. A página pode tipá-lo a partir do próprio padrão com <code>Params</code>, que transforma <code>'/blog/:slug'</code> em <code>{ slug: string }</code> e <code>'/files/*rest'</code> em <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>O segundo argumento de uma página. Desestruture só o que ela precisa.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>onde a página está na pilha. Veja <code>Layer</code> abaixo.</td></tr>
          <tr><td><code>data</code></td><td>o que o <code>load()</code> da rota retornou, ou <code>undefined</code> se não houver um. Tipado por <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>onde uma página pai renderiza a rota filha. Veja <a href="#router-patterns">Rotas aninhadas</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>registra um guard consultado antes de esta página ser descartada. Veja <a href="#router-layers">Guards de saída</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Onde a página está na pilha, e como ela sai de lá.</p>
      <table>
        <thead><tr><th>Membro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 para a página base, 1 em diante para as camadas empilhadas</td></tr>
          <tr><td><code>push(href)</code></td><td>abre outra camada de dentro de uma página, igual ao <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>fecha esta camada e tudo que está acima dela, resolvendo o <code>push()</code> que a abriu. Sem argumento, conta como dispensada. Não faz nada na profundidade 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> e <code>withLoad()</code></h3>
      <p><code>DataLoader</code> é <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, o export opcional <code>load</code> de um módulo de página. O <code>withLoad(loader, load)</code> cria uma rota cujo <code>load</code> começa ao lado do import do chunk, e não depois dele. Veja <a href="#router-loaders">Loaders de rota</a>.</p>
      <h3>Tipos</h3>
      <p>Todo tipo é um export nomeado de <code>nuclo-router</code>, então dá para tipar uma página, um loader ou um guard sem importar por caminho.</p>
      <table>
        <thead><tr><th>Tipo</th><th>O que é</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>o objeto de params de um padrão. <code>RouteParams</code> é a forma sem tipagem, e <code>Match</code> é o resultado do matcher.</td></tr>
          <tr><td><code>PageComponent</code></td><td>uma página: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>um módulo de página: o próprio componente, ou <code>{ default, load? }</code>, como o <code>import()</code> entrega</td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, podendo carregar um <code>load</code> vindo do <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>a tabela que o <code>createRouter()</code> recebe: padrão para loader, ou para uma tabela aninhada</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, o segundo argumento do <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, o segundo argumento do <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>o tipo do <code>outlet()</code> que vem em <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, o que o <code>beforeLeave()</code> recebe</td></tr>
          <tr><td><code>MatchView</code></td><td>o que é uma view de <code>matches()</code>: entram params, sai conteúdo ou o <code>import()</code> de uma página</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Camadas e guards de saída",
        content: `
      <p>O <code>push()</code> abre uma rota por cima da atual, sem substituí-la, e resolve com o valor com que essa camada for fechada. Como as páginas formam um único <code>list()</code> sobre a pilha, abrir uma camada é só um append. A página de baixo não é renderizada de novo, então DOM, foco e formulário preenchido pela metade continuam lá quando a camada fecha.</p>
      <p>É isso que faz o fluxo "preciso de um registro que ainda não existe" funcionar sem jogar fora o formulário que o usuário estava preenchendo:</p>
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
      <p>Camadas se aninham. Um diálogo que precisa de outro diálogo chama <code>layer.push()</code> e aguarda, sem referência alguma ao Route.</p>
      <ul>
        <li><strong>A URL é a camada do topo.</strong> O <code>push()</code> adiciona uma entrada no history, então a camada pode ser linkada e o Voltar a fecha, resolvendo o <code>push()</code> como dispensado, igualzinho ao Cancelar. Voltar e <code>close()</code> seguem o mesmo caminho de código: o <code>close()</code> registra o resultado e volta no history, e a profundidade em <code>history.state</code> é quem manda. Os navegadores guardam cerca de 50 entradas por aba, então, depois de uma longa caminhada por camadas, a entrada de baixo pode ter sumido. Nesse caso o <code>close()</code> fecha as camadas ali mesmo e reescreve a entrada atual para a página que ficou visível.</li>
        <li><strong>Uma navegação comum zera a pilha.</strong> Um clique em link ou um <code>go()</code> não é uma camada: substitui tudo e dispensa todas as camadas abertas, então ninguém fica pendurado num await.</li>
        <li><strong>Um carregamento a frio é uma página independente.</strong> A URL nomeia a camada do topo, mas não a pilha embaixo dela, então abrir a URL de uma camada diretamente a renderiza na profundidade 1, com <code>layer.depth === 0</code> e um <code>close()</code> inerte. Uma rota empilhada precisa fazer sentido sozinha. Ramifique em <code>layer.depth</code> para oferecer um link de saída em vez de um botão Cancelar que não faz nada.</li>
        <li><strong>A promise não sobrevive a um reload</strong>, porque mora numa closure. Trate o resultado como um atalho dentro de um fluxo que também funciona pelo caminho mais longo.</li>
        <li><strong>Ninguém fica esperando.</strong> O <code>stop()</code> dispensa todas as camadas abertas, e uma camada abandonada por uma navegação resolve com <code>undefined</code>.</li>
      </ul>
      <h3>Guards de saída</h3>
      <p>Uma página que guarda algo que vale proteger, como um formulário preenchido pela metade, registra um guard. Ele é consultado antes de a página ser descartada, e retornar <code>false</code> (ou uma promise dele) mantém a página:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Só quando a página sai.</strong> Uma navegação filha sob um layout, ou uma mudança de query ou hash que preserva a página, não dispara a consulta. O guard vive e morre com a página, então não há nada para desregistrar.</li>
        <li><strong>Qualquer saída.</strong> Um link, o <code>go()</code>, Voltar e Avançar, o <code>close()</code> de uma camada e um <code>go()</code> para uma URL que o router não controla (sair do app, caso em que <code>to</code> é <code>null</code>). Um Voltar ou Avançar recusado é desfeito, para que a barra de endereço continue na página. Fechar a aba ou recarregar é trabalho do <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> é o <code>RouteContext</code> para onde a navegação está indo. Os guards rodam do mais interno para o mais externo e param na primeira recusa. Um guard que lança erro mantém a página. O <code>close(result)</code> também passa pelo guard, então limpe sua flag antes de fechar com um resultado.</li>
        <li>O router só consegue desfazer entradas de history que ele mesmo escreveu. Um Voltar ou Avançar para uma entrada que não é dele, como um link <code>#fragment</code> nativo ou o <code>pushState</code> de outro script, não consulta ninguém.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() e sub-routers",
        content: `
      <p>O <code>router.outlet()</code> renderiza a página. O <code>router.matches(table)</code> renderiza outra coisa que depende de onde você está, como uma sidebar, breadcrumbs ou uma toolbar, a partir de uma tabelinha própria, sem carregar rota nem acrescentar página:</p>
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
        <li><strong>O mesmo matching da tabela de rotas.</strong> Padrões, precedência, matching do caminho bruto e remoção do <code>base</code> são os do próprio router, então view e página sempre concordam sobre a URL. Ele lê o caminho da camada do topo, como o <code>router.path</code>.</li>
        <li><strong>Uma view</strong> é <code>(params, ctx) =&gt; content</code>, onde <code>params</code> é tipado a partir do padrão e <code>ctx</code> é o <code>RouteContext</code> com o <code>pattern</code> e os <code>params</code> da view. Ela também pode retornar o <code>import()</code> de um módulo de página, que é chamado com <code>ctx</code> assim que chega.</li>
        <li><strong>Sem correspondência, sem render.</strong> Acrescente uma view <code>'*'</code> como fallback. Como o outlet, fica vazio antes do <code>start()</code> e depois do <code>stop()</code>.</li>
        <li><strong>Só renderiza de novo quando a rota muda</strong>, então a view mantém o DOM diante de qualquer coisa que preserve a página.</li>
        <li><strong>Uma view lazy não renderiza nada até o módulo chegar.</strong> Um <code>import()</code> que falha é registrado com <code>console.error</code>, não preenche <code>router.error</code> e é tentado de novo na próxima navegação. Um <code>update()</code> comum não tenta de novo.</li>
        <li><strong>No servidor</strong>, uma view lazy não entrega nada, já que o módulo chega no cliente. Use uma view síncrona para tudo que o primeiro HTML precisa conter.</li>
      </ul>
      <h3>Sub-routers</h3>
      <p>Rotas se aninham, então um sub-router costuma ser só uma tabela aninhada. Fica um router só: a página <code>'/'</code> da própria seção é o seu chrome, e os filhos renderizam no <code>outlet()</code> dessa página, de modo que o chrome sobrevive à navegação dentro da seção:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Ou então dê à feature um router próprio, criado mas nunca iniciado. O pai fica com uma única entrada catch-all e o filho resolve o restante contra os próprios padrões, params e fallback:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Nunca iniciá-lo é justamente o ponto. É o <code>start()</code> que anexa os listeners, e dois routers iniciados entram em conflito. O preço é que o filho assume a resolução, então os loaders de rota, que um router iniciado executaria, ficam por sua conta. Esse formato também reconstrói o shell quando o restante muda, porque o router enxerga uma rota só e o shell resolve o resto por conta própria. Uma tabela aninhada é o que dá a você um pai que o router mantém montado; prefira-a, a menos que a feature realmente precise de router, base e fallback próprios.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Múltiplos routers e loading combinado",
        content: `
      <p>Um app pode ter tantos routers quantas áreas tiver. A regra que mantém isso simples é: <strong>inicie exatamente um por documento</strong> e deixe todos os outros sem iniciar, resolvendo URLs com <code>match()</code>. Só o router iniciado controla a URL, o history e o listener de clique. Os demais são tabelas que você consulta, e cada área pode carregar no seu próprio ritmo, com o seu próprio spinner.</p>
      <h3>Loading combinado: uma cadeia de loaders</h3>
      <p>Toda página de uma cadeia correspondente pode exportar <code>load()</code>. Numa navegação a frio para uma rota filha, o loader do layout e o da página rodam <strong>em paralelo</strong>, e um único <code>router.pending</code> cobre a cadeia toda: a página anterior fica na tela até o par resolver, então uma árvore carregada pela metade nunca é pintada. Cada componente recebe o seu próprio <code>data</code>:</p>
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
      <p>Os dois loaders começam juntos, e não um depois do outro. O <code>router.pending</code> fica true enquanto qualquer um deles está sendo esperado e false o resto do tempo; uma rota pré-carregada ou eager nunca o liga. Trocar de seção mantém o layout, então só o loader da seção roda de novo, e os dados do layout, o DOM dele e um input pela metade sobrevivem. Navegar outra vez para a mesma URL roda de novo o loader da folha e reconstrói a linha, exatamente como numa página única.</p>
      <h3>Loading múltiplo: um segundo router com spinner próprio</h3>
      <p>Uma área independente (uma sidebar, uma bandeja, uma região ao vivo) ganha um router só dela, criado mas nunca iniciado, e a sua própria flag de loading. O <code>router.pending</code> pertence ao router iniciado e não diz nada sobre essa área, então as duas podem carregar lado a lado e qualquer uma pode terminar primeiro:</p>
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
      <p>O segundo router é consultado, nunca comandado: o <code>match()</code> lê a URL e devolve um contexto, e nada sobre a sidebar entra na tabela de rotas principal. O <code>onNavigate</code> roda depois de toda navegação resolvida, a inicial inclusive, então é o ponto único que mantém uma área independente em sincronia com a URL.</p>
      <ul>
        <li><strong>O <code>pending</code> pertence ao router iniciado.</strong> Um router que nunca foi iniciado não tem Route, nem <code>pending</code>, nem <code>error</code>. A área cuida das próprias flags, e um segundo spinner pode ficar ao lado do primeiro. Na demo, a sidebar carrega por 800ms enquanto os loaders da rota levam 900ms, então a página pode terminar antes da sidebar ou o contrário.</li>
        <li><strong>O <code>match()</code> não anexa nada.</strong> Qualquer quantidade de routers sem iniciar pode dividir o documento: cada um tem tabela, base e cache de módulos próprios, e nenhum encosta no history. O custo é uma tabela e um matcher.</li>
        <li><strong>Os loaders dele nunca rodam.</strong> Quem executa o <code>load()</code> das páginas que casam é o router iniciado. Um router sem iniciar só resolve, então, se as views precisam de dados, busque-os você mesmo, como faz o <code>refreshSidebar()</code> da demo. Se você quer loaders, uma <a href="#router-matches">tabela aninhada</a> ou uma <a href="#router-regions">região que a página preenche</a> deixa esse trabalho com o router iniciado.</li>
        <li><strong>Proteja-se de respostas atrasadas.</strong> O fetch lento de uma sidebar não pode aterrissar numa seção da qual você já saiu. Incremente um contador de geração a cada refresh e descarte as respostas que não correspondem mais, do mesmo jeito que o próprio router aposenta navegações ultrapassadas.</li>
        <li><strong>Uma view lazy do <code>matches()</code> também não tem <code>pending</code>.</strong> Ela não renderiza nada até o módulo chegar. São três sistemas de loading e três relógios independentes: o <code>pending</code> da rota, as suas flags e uma view lazy que simplesmente ainda não está lá.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Tratamento de links",
        content: `
      <p>O listener delegado navega num clique esquerdo em um <code>&lt;a href&gt;</code>, inclusive um <code>&lt;a&gt;</code> de SVG e cliques em qualquer coisa aninhada dentro de um, e sai da frente em todo o resto: cliques com modificador ou com o botão do meio, um <code>target</code> diferente de <code>_self</code>, <code>download</code>, <code>rel="external"</code>, hrefs de outra origem, links só de hash na página atual, caminhos fora do <code>base</code>, caminhos que nenhuma rota casa (assim, um 404 renderizado no servidor continua acessível) e qualquer evento em que um handler do app já tenha chamado <code>preventDefault()</code>. Para tirar um link do controle do router de forma explícita, use <code>data-nuclo-router="off"</code>.</p>
      <h3>Scroll</h3>
      <p>Uma navegação por push preserva a posição atual do scroll. Quando a nova URL tem um <code>#hash</code> que corresponde a um elemento da página, o scroll leva até ele. No <code>popstate</code>, o scroll fica por conta do navegador. Para que as páginas novas comecem no topo, faça isso no <code>onNavigate</code>, que informa como a navegação aconteceu:</p>
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
      <h3>Observações</h3>
      <ul>
        <li><strong>Nada é retido.</strong> O Route guarda a função da página e o contexto, nunca DOM. Navegar para outra página libera a anterior. O <code>stop()</code> libera os listeners e qualquer carregamento em andamento e limpa o <code>pending</code>, então um Route aposentado nunca deixa um spinner preso. Um módulo que resolve depois do <code>stop()</code> é descartado em silêncio.</li>
        <li><strong>Seguro contra concorrência no servidor.</strong> O <code>start()</code> devolve state por requisição e o <code>run()</code> o limita a um render síncrono, então requisições intercaladas nunca enxergam a rota umas das outras. Só o cache de módulos é compartilhado. O escopo termina quando a função do <code>run()</code> retorna. Como o <code>renderToString()</code> é síncrono, isso basta. Um render assíncrono ou em streaming exigiria carregar o Route através de <code>await</code>s, o que o <code>run()</code> não faz.</li>
        <li><strong>A restauração de scroll no <code>popstate</code></strong> é do navegador (<code>scrollRestoration</code>), não do router.</li>
        <li><strong>Inicie um router por documento.</strong> Cada <code>start()</code> adiciona o seu próprio listener de <code>click</code> delegado, e o <code>start()</code> de um segundo router não aposenta o primeiro; só um segundo <code>start()</code> no mesmo router faz isso. Para resolver uma URL contra outra tabela, crie um router e chame apenas o <code>match()</code>, que não anexa nada. Assim, uma área independente pode ter seu próprio loading ao lado do <code>pending</code> da rota. Veja <a href="#router-multi">Múltiplos routers e loading combinado</a>.</li>
        <li><strong>Fica de fora, de propósito:</strong> hash history e memory history, já que a rota vive no pathname e o servidor precisa servir todas as rotas; duas áreas com roteamento independente guiadas por uma só URL, já que uma página pode preencher várias regiões com <code>into()</code>, mas todas pertencem à mesma rota correspondente (uma área independente ainda pode manter um router próprio sem iniciar e o seu loading, como em <a href="#router-multi">Múltiplos routers e loading combinado</a>); e preload no hover, que você consegue chamando o loader da própria rota a partir de um <code>mouseenter</code>.</li>
      </ul>
      <h3>Exemplos</h3>
      <p>Dois exemplos executáveis no repositório se complementam, de modo que cada configuração fica observável em algum lugar:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: um tour client-side por toda a API. Todas as formas de padrão e regras de precedência, as exceções do tratamento de links, cada membro de Route com controles ao vivo, um sub-router, a pilha de camadas três níveis abaixo, uma seção relativa montada em dois pais e loaders de rota com <code>pending</code> e <code>error</code>. Define <code>preload: false</code> para que esses estados fiquem visíveis.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> por requisição, hydration que comprovadamente aproveita os nós do servidor, status 404 de verdade, um <code>base</code> fora da raiz, preload em idle que dá para acompanhar no painel de rede e um loader cujos dados passam do servidor para o cliente, para que a hydration não busque tudo de novo.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "Padrões",
    sections: [
      {
        id: "computed",
        title: "Valores computados",
        content: `
      <p>O Nuclo não tem uma API de computed. Use uma função comum e chame-a a partir de valores dinâmicos:</p>
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
        title: "Assíncrono e loading",
        content: `
      <p>Use <code>async</code>/<code>await</code> puro e chame <code>update()</code> a cada mudança de state. Num fetch, isso significa uma vez antes do <code>await</code> e outra depois:</p>
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
        title: "Boas práticas",
        content: `
      <ul>
        <li><strong>Agrupe as mudanças.</strong> Altere todo o state necessário e só então chame <code>update()</code>, uma única vez.</li>
        <li><strong>Mantenha os valores dinâmicos rápidos e puros.</strong> Todos eles rodam a cada <code>update()</code>.</li>
        <li><strong>Use <code>scope()</code></strong> para atualizações pequenas e frequentes, como digitação ou timers.</li>
        <li><strong>Renderize dentro do documento.</strong> Nós que não estão no documento quando o <code>update()</code> roda deixam de ser atualizados.</li>
        <li><strong>Use <code>when()</code> e <code>list()</code></strong> para filhos que mudam, e não uma função que retorna nós.</li>
        <li><strong>Use <code>className</code>, não <code>class</code></strong>, e <code>() =&gt; cx(...)</code> ou <code>{ className: () =&gt; … }</code> para classes dinâmicas.</li>
        <li><strong>Declare os estilos uma vez</strong>, no nível do módulo.</li>
        <li><strong>SSR:</strong> renderize primeiro e só depois coloque o <code>getCssText()</code> em <code>&lt;style id="nuclo-styles"&gt;</code>. Passe os dados da requisição como argumentos e mantenha os comentários HTML na saída.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "Referência",
    sections: [
      {
        id: "api-index",
        title: "Índice da API",
        content: `
      <p>Toda função pública e de onde ela vem.</p>
      <h3><code>nuclo</code> (global e export nomeado)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: executa todos os valores dinâmicos, ou só os dos scopes indicados.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: dá a um elemento ids de scope para o <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: conteúdo condicional, com <code>.when()</code> e <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: uma linha por item, associada pela identidade.</li>
        <li><a href="#api-region"><code>region(options)</code></a> e <a href="#api-region"><code>into(id, ...content)</code></a>: um ponto nomeado da árvore e o conteúdo que o preenche de qualquer lugar.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: um listener de evento, ou <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: monta e anexa.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: assume o HTML do servidor.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: chama os componentes de novo e aplica o patch no DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: classes geradas a partir de um objeto de estilo.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: combina estilos, o último vence.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code> com tema.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: estilos a partir de opções.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> e <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (só export nomeado)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> e <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> e <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">Um import só pelo side effect</a>, mais <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> e as classes <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (pacote separado)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: o router, com <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> e <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: uma rota cujo loader de dados começa junto com o chunk.</li>
        <li><a href="#router-api">Tipos</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> e outros.</li>
      </ul>
      <h3>Só globais</h3>
      <ul>
        <li><a href="#tag-builders">175 builders de tag</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, e <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Tipos</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> e outros. Tipos de estilo, como o <code>StyleResult</code>, também podem ser importados de <code>'nuclo'</code>.</li>
      </ul>
      <h3>Chaves especiais</h3>
      <ul>
        <li><a href="#attributes">Atributos</a>: <code>className</code>, <code>style</code>, <a href="#events">handlers <code>on*</code></a>, <a href="#lifecycle"><code>onMount</code> e <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Objetos de estilo</a>: atalhos, pseudo-estados, seletores <code>&amp;</code>, regras <code>@</code> e <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Perguntas frequentes",
        content: `
      <h3>Mudar o state atualiza a UI?</h3>
      <p>Não. O DOM fica como está até você chamar <code>update()</code>.</p>

      <h3>O Nuclo usa signals, proxies ou DOM virtual?</h3>
      <p>Não. O state continua sendo JavaScript puro. Quando uma árvore é renderizada, o Nuclo cria elementos e nós de texto de verdade. O <code>update()</code> executa todos os valores dinâmicos registrados, ou só os que estão nos scopes indicados, e aplica o patch nesses mesmos nós onde algum valor mudou. Não há grafo de dependências nem árvore virtual.</p>

      <h3>Por que minha página mostra "false"?</h3>
      <p>Booleanos são renderizados como texto. <code>div(ok &amp;&amp; span('Done'))</code> mostra "false". Para filhos, use <code>when(() =&gt; ok, span('Done'))</code>; para texto, <code>ok ? 'Done' : ''</code>.</p>

      <h3>Por que a linha da minha lista não muda quando edito o item?</h3>
      <p>As linhas de itens que continuam na lista são preservadas, e não renderizadas de novo. Para campos que mudam, use valores dinâmicos como <code>() =&gt; todo.text</code>. Veja <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Por que parte da minha UI parou de atualizar?</h3>
      <p>Em geral, os nós dela não estavam no documento quando o <code>update()</code> rodou. O Nuclo para de rastrear esses nós, mesmo que você os anexe depois, então renderize dentro de um container que já esteja no documento. Há outras duas causas: um <code>when()</code> cuja condição lança erro para de atualizar, e uma função de texto que lança erro na primeira execução fica vazia. Veja <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Quando devo usar o <code>forceUpdate()</code>?</h3>
      <p>Só para mudanças raras em valores estáticos, como trocar o idioma. Para todo o resto, use <code>update()</code>. Veja <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Como encaixo uma página num layout sem passá-la como prop?</h3>
      <p>Marque o ponto com <code>region({ id: 'main' })</code> e faça a página retornar <code>into('main', …)</code>. Veja <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Como desmonto um app?</h3>
      <p>Envolva-o em um <code>when()</code> e desligue a condição. Remover o DOM por conta própria não executa o <code>onDestroy</code>. Veja <a href="#lifecycle">Ciclo de vida</a>.</p>

      <h3>O Nuclo inclui um router?</h3>
      <p>No pacote principal, não. O roteamento vem separado, como <code>nuclo-router</code>, com SSR, hydration, rotas com code splitting e preload em idle. Instale com <code>npm install nuclo nuclo-router</code>. Veja <a href="#router-overview">nuclo-router</a>.</p>

      <h3>O Nuclo tem effects?</h3>
      <p>Não. <code>onMount</code> e <code>onDestroy</code> rodam uma vez por elemento, atrelados à inserção e à remoção. Nada roda de novo só porque algum state mudou.</p>
    `,
      },
    ],
  },

];
