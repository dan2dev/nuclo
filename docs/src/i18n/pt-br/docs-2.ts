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
      <p>Transforma um objeto de estilo tipado em classes CSS geradas. Passe o resultado a qualquer construtor de tag. No navegador, as regras vão para um único elemento <code>&lt;style id="nuclo-styles"&gt;</code>. No servidor, <a href="#api-css-text"><code>getCssText()</code></a> as retorna.</p>
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
        <li><code>css()</code> cria uma classe para as declarações base, mais uma classe para cada chave de pseudo-estado, seletor e bloco de media. O card acima recebe duas classes.</li>
        <li>Os nomes de classe são hashes do conteúdo. Estilos idênticos compartilham uma classe, e o servidor e o cliente produzem os mesmos nomes.</li>
        <li>Defina os estilos uma vez, no nível do módulo. <code>css()</code> faz cache por objeto, então um objeto novo a cada chamada é processado de novo toda vez.</li>
        <li>Alterar um objeto de estilo depois de passá-lo a <code>css()</code> não tem efeito.</li>
        <li>Todo estilo permanece registrado pela vida da página ou do processo do servidor. Para valores que mudam por item, como uma largura vinda de dados, use o <a href="#attributes">atributo <code>style</code></a>.</li>
      </ul>
      <h3>Estilos nomeados</h3>
      <p>Passe um nome primeiro para obter um nome de classe legível:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>A classe base é exatamente o nome. Os outros blocos recebem <code>name-&lt;hash&gt;</code>.</li>
        <li>O nome precisa ser um nome de classe válido. Caso contrário, o Nuclo avisa e gera um.</li>
        <li>Os nomes são globais. Se dois estilos diferentes usam o mesmo nome, o Nuclo avisa.</li>
      </ul>
      <h3>Usando o resultado</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> e <code>card.className</code> retornam ambos os nomes de classe.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Objetos de Estilo",
        content: `
      <p>O objeto que você passa a <code>css()</code> usa propriedades CSS comuns em camelCase, um conjunto de atalhos e chaves aninhadas para pseudo-estados, seletores e media queries. O TypeScript autocompleta todas elas. Propriedades fora do conjunto tipado, como <code>borderTopLeftRadius</code>, <code>fill</code> ou <code>paddingInline</code>, vão em <code>raw</code> (veja abaixo).</p>
      <h3>Valores</h3>
      <ul>
        <li>Números viram <code>px</code>, exceto <code>0</code> e propriedades sem unidade: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> e <code>gridRow</code>. Em <code>raw</code>, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> e <code>animation-iteration-count</code> também são sem unidade.</li>
        <li>Strings são usadas como escritas. <code>null</code>, <code>undefined</code> e <code>false</code> são ignorados.</li>
        <li><code>lineHeight</code> (e <code>leading</code>) é sem unidade, então <code>leading: 24</code> significa 24 vezes o tamanho da fonte. Escreva <code>"24px"</code> para pixels.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Atalhos</h3>
      <table>
        <thead><tr><th>Chave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding, e cada lado</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding esquerdo e direito / superior e inferior</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>o mesmo para margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>width, height, e seus min e max</td></tr>
          <tr><td><code>size</code></td><td>width e height</td></tr>
          <tr><td><code>bg</code></td><td>background</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Estas chaves recebem <code>true</code>:</p>
      <table>
        <thead><tr><th>Chave</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (não define display)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Pseudo-estados</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> e <code>firstLetter</code>. Eles aninham: <code>hover: { focus: {…} }</code> gera <code>:hover:focus</code>.</p>
      <h3>Seletores e at-rules</h3>
      <p>Uma chave que começa com <code>&amp;</code> é um seletor, e cada <code>&amp;</code> vira a classe. Uma chave que começa com <code>@</code> é uma at-rule: <code>@media</code>, <code>@container</code> ou <code>@supports</code>.</p>
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
        <li>A chave precisa começar com <code>&amp;</code>. Uma chave como <code>".dark &amp;"</code> é ignorada, então escreva <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Dois blocos <code>@media</code> aninhados combinam com <code>and</code>. Uma query iniciada por um tipo de mídia (<code>print</code>, <code>only screen</code>) é colocada primeiro, porque a gramática só permite um tipo no início. Um par que não pode ser achatado — dois tipos de mídia, ou um <code>not</code> inicial — avisa e usa apenas a query interna. Qualquer outra at-rule aninhada substitui a externa.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Use <code>raw</code> para qualquer propriedade, com o nome escrito exatamente como no CSS. Números ainda recebem <code>px</code>, então passe strings:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Qualquer outra chave plana é convertida para kebab-case e escrita como está, então um erro de digitação como <code>colr: 'red'</code> vira uma declaração que o navegador descarta. Um objeto aninhado sob uma chave que não é um pseudo-estado, um screen, ou uma chave <code>&amp;</code> ou <code>@</code> é ignorado. O TypeScript reporta ambos.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Combina estilos. Quando duas entradas definem a mesma propriedade, a entrada posterior vence.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Entradas falsy são ignoradas, arrays são achatados, e strings são divididas e deduplicadas.</li>
        <li>Classes geradas para o mesmo bloco (base, o mesmo pseudo-estado, a mesma media query) se fundem em uma nova classe. Outros nomes de classe passam inalterados.</li>
        <li>Apenas <code>cx()</code> conhece a ordem dos argumentos. Com <code>div(base, blue)</code>, ambas as classes são adicionadas, e a regra criada por último vence. Coloque estilos que se sobrescrevem em uma única chamada de <code>cx()</code>.</li>
        <li>Quando o bloco de um estilo nomeado se funde com o bloco de outra entrada, a classe resultante é <code>name-&lt;hash&gt;</code>, não o nome puro. Blocos que não se fundem mantêm sua classe, então <code>cx(pageTitle, 'extra')</code> ainda tem <code>page-title</code>.</li>
      </ul>
      <h3>Classes dinâmicas</h3>
      <p>Passe uma função que sempre retorna <code>cx(...)</code>:</p>
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
      <p>A função precisa retornar um resultado de estilo na primeira execução. <code>() =&gt; active &amp;&amp; activeButton</code> renderiza o texto "false" em vez de uma classe.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Retorna seus próprios <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code>, vinculados a um tema. Um tema dá nomes a valores: com o tema abaixo, <code>borderColor: 'border'</code> escreve <code>#e5e7eb</code>, e o TypeScript autocompleta os nomes. Cada entrada em <code>screens</code> vira uma chave de estilo para uma media query, como <code>md: {…}</code>.</p>
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
        <li>Um nome do tema só é resolvido quando é o valor inteiro. <code>border: "1px solid primary"</code> não é resolvido.</li>
        <li>Um valor de screen sem <code>@</code> vira <code>@media &lt;valor&gt;</code>. Um valor que começa com <code>@</code> é usado como escrito, por exemplo <code>"@container (min-width: 400px)"</code>.</li>
        <li>Screens existem apenas em instâncias criadas com <code>createCss()</code>. O <code>css()</code> global não tem nenhum, mas aceita chaves <code>@media</code>.</li>
        <li>Todas as instâncias e os helpers globais compartilham uma única folha de estilos. As regras de media dos screens são emitidas na ordem em que os screens são declarados, não na ordem em que você os usa, então liste screens <code>min-width</code> do menor para o maior. Use uma instância de <code>createCss()</code> por app, para que essa ordem seja a do seu tema.</li>
        <li><code>theme</code> no resultado é o tema que você passou.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Constrói uma função que retorna um estilo para um conjunto de opções, como a intenção e o tamanho de um botão.</p>
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
        <li>Os estilos se fundem nesta ordem: <code>base</code>, o valor escolhido de cada grupo, depois cada compound que corresponder. Estilos posteriores vencem por propriedade.</li>
        <li>Uma opção ausente, <code>undefined</code> ou <code>null</code> usa o padrão. Um grupo sem padrão é ignorado.</li>
        <li>Um grupo com apenas as chaves <code>true</code> e <code>false</code> recebe um booleano.</li>
        <li>Um compound se aplica quando todos os grupos que ele lista correspondem, incluindo os padrões.</li>
        <li>Cada seleção é construída uma vez e armazenada em cache.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() & globalStyle()",
        content: `
      <p><code>keyframes()</code> registra uma animação e retorna seu nome gerado. As chaves dos frames são <code>from</code>, <code>to</code> e porcentagens, como <code>"50%"</code> ou <code>"0%, 100%"</code>. Frames aceitam apenas propriedades planas. Frames idênticos retornam o mesmo nome.</p>
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
        <li>O seletor é usado exatamente como escrito.</li>
        <li>Apenas propriedades planas funcionam. Chaves de pseudo-estado, screens e chaves <code>@</code> são ignoradas, então <code>globalStyle()</code> não pode escrever regras de media.</li>
        <li>A mesma regra é adicionada uma vez. Um estilo diferente para o mesmo seletor adiciona uma segunda regra, e a posterior vence.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() & resetStyles()",
        content: `
      <p><code>getCssText()</code> retorna todas as regras que <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> e <code>globalStyle()</code> criaram neste processo: regras base primeiro, depois os blocos <code>@media</code>, <code>@container</code> e <code>@supports</code>. Use-a para renderização no servidor.</p>
      <ul>
        <li>Chame-a depois de <code>renderToString()</code>. Regras criadas durante a renderização são incluídas.</li>
        <li>Ela cobre o processo inteiro, não uma página ou requisição, e só cresce. Isso é seguro, porque os nomes de classe são hashes do conteúdo.</li>
        <li>Coloque-a em <code>&lt;style id="nuclo-styles"&gt;</code>. O cliente reutiliza esse elemento e pula as regras que já estão nele. Com outro id, ou nenhum, o cliente adiciona uma segunda folha de estilos com todas as regras de novo.</li>
        <li>O texto não é escapado, então nunca coloque entrada não confiável em valores de estilo.</li>
      </ul>
      <p><code>resetStyles()</code> é um helper de teste. Remove todas as regras e o elemento <code>#nuclo-styles</code>. Estilos criados antes mantêm seus nomes de classe mas perdem seu CSS. Não a chame em um app ou em um servidor.</p>
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
      <div class="docs-callout"><strong>Pacote separado:</strong> <code>nuclo-router</code> não faz parte do pacote principal do Nuclo. Instale-o junto com <code>nuclo</code>. É uma versão preview, então sua API ainda pode mudar.</div>
      <p>Roteamento para o Nuclo: renderização no servidor, hidratação, rotas com code splitting e pré-carregamento em idle, construído sobre <code>list()</code> e <code>update()</code>. Cerca de ${NUCLO_ROUTER_GZIP_KB} KB gzipado, sem dependências além do próprio Nuclo e sem efeitos colaterais, então é removido pelo tree-shaking quando não usado.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Ou use <code>pnpm add</code>, <code>yarn add</code> ou <code>bun add</code> com os mesmos dois nomes. Requer <code>nuclo</code> 0.3 ou posterior como peer dependency.</p>
      <p>O roteador decide <em>o que</em> carregar. O app diz <em>onde</em> com <code>router.outlet()</code>: um <code>list()</code> sobre a pilha de camadas, uma linha por camada, então uma página comum é uma única linha. O servidor e o cliente constroem a mesma árvore, então <code>hydrate()</code> reivindica os nós do servidor em vez de substituí-los. Todo o resto é <code>history</code>, um listener de <code>click</code> delegado e <code>requestIdleCallback</code>.</p>
      <h3>Um import</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> resolve os módulos da rota correspondente antes de retornar, então a primeira árvore está completa tanto no servidor quanto no cliente. Depois disso o roteador lê diretamente a rota que iniciou: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
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
      <p>Essa é toda a integração. Os links funcionam porque um <code>&lt;a href&gt;</code> é só um <code>&lt;a href&gt;</code>. Um listener delegado em <code>document</code> intercepta os links que o roteador possui e deixa todos os outros para o navegador.</p>
      <p>No servidor, <code>start()</code> retorna um <code>Route</code> por requisição e não mexe no roteador, então requisições concorrentes não conseguem ver a rota uma da outra. <code>route.run()</code> torna esse Route aquele que o roteador, e portanto o outlet, lê durante a renderização. No navegador há um Route por carregamento de página, e <code>start()</code> o torna o do próprio roteador. Nenhum <code>run()</code> é necessário.</p>
      <p>Uma página recebe seu <a href="#router-api"><code>RouteContext</code></a> e suas <a href="#router-api"><code>PageProps</code></a>, como <code>(ctx, { layer, data, outlet, beforeLeave })</code>, e pode receber menos argumentos. Ela retorna qualquer coisa que <code>list()</code> aceite. Para preencher também outra parte do layout, retorne um <code>into()</code> de dentro da página, como <code>div(article(…), into('sidebar', nav(…)))</code>. Esse conteúdo sai junto com a página. Veja <a href="#router-regions">Páginas &amp; Regiões</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Padrões & Rotas Aninhadas",
        content: `
      <table>
        <thead><tr><th>Padrão</th><th>Corresponde a</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>exatamente esse caminho</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>qualquer coisa sem correspondência, o seu 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>A precedência é: estáticos, depois dinâmicos em ordem de declaração, depois catch-all com o prefixo mais longo primeiro. Então <code>'*'</code> só corresponde ao que nada mais corresponde e pode ficar em qualquer lugar da tabela. Barras finais, barras duplicadas e percent-encoding são normalizados, e os valores dos params chegam decodificados. A correspondência é uma comparação de segmentos por padrão. Nenhuma regex é construída ou executada.</p>
      <h3>Rotas relativas</h3>
      <p>Um padrão escrito com <code>./</code> é relativo ao pai que o declara, e um href escrito com <code>./</code> é relativo à rota ativa. Juntos eles formam uma seção reutilizável que significa a mesma coisa sob qualquer pai. O valor de uma tabela é um carregador ou outra tabela, cujas chaves são relativas a ela:</p>
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
      <p>Essas duas linhas produzem todos os seis padrões sem nenhum caminho escrito duas vezes. Ambos os pais recebem os mesmos objetos de carregador, então compartilham um único cache de módulos e um único <code>import()</code>.</p>
      <ul>
        <li>Dentro de uma tabela filha, <code>'./x'</code>, <code>'/x'</code> e <code>'x'</code> significam a mesma coisa, <code>'/'</code> significa o próprio caminho do pai, e <code>'*rest'</code> dá à seção seu próprio catch-all. O aninhamento vai tão fundo quanto você quiser.</li>
        <li>Chaves de nível superior são usadas como escritas, então <code>'*'</code> continua <code>'*'</code>.</li>
        <li>Um filho sob um pai <code>*catch-all</code> é um erro de <code>createRouter()</code>, já que um catch-all precisa encerrar seu padrão.</li>
      </ul>
      <h3>Páginas pai e <code>outlet()</code></h3>
      <p>Um pai e seus filhos formam uma hierarquia real. O pai renderiza, e seu filho renderiza dentro dele, onde quer que ele chame <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>Navegar entre filhos não reconstrói o pai. Seu nó DOM é o mesmo nó, então seu foco, sua posição de scroll, seu input digitado pela metade e qualquer estado em sua closure sobrevivem.</p>
      <ul>
        <li>Uma página sem rota filha não renderiza nada do seu outlet, então um layout pode chamá-lo incondicionalmente. Um pai que tem um filho e nunca chama <code>outlet()</code> o engole.</li>
        <li>Não há rotas index. <code>'/'</code> é o próprio layout, então o caminho do pai renderiza o layout com um outlet vazio em vez de uma página index separada dentro dele. Coloque o conteúdo inicial no layout, ou dê a ele um caminho filho real.</li>
      </ul>
      <p>A mesma chamada então funciona a partir de qualquer dos pais, e a partir de uma página que não sabe em qual deles está:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> e <code>..</code> são resolvidos contra o caminho da rota atual, não contra o "diretório" da URL. A partir de <code>/invoices/42</code>, <code>./preview</code> é <code>/invoices/42/preview</code>, onde um navegador diria <code>/invoices/preview</code>, e uma barra final na URL não muda nada. <code>../</code> sobe um segmento e para na raiz. A query e o hash são preservados, <code>base</code> é adicionado de novo, e o caminho absoluto resolvido é o que entra no history. Este é o mesmo desvio da resolução de URL que o React Router faz para <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Apenas <code>./</code> e <code>../</code> são relativos à rota. Um <code>preview</code> puro em um href fica sujeito às regras comuns do navegador.</li>
        <li>Construa links relativos com <code>router.href('./preview')</code> em vez de escrever <code>href="./preview"</code> à mão. <code>href()</code> resolve no momento da renderização, então o markup entregue é absoluto e continua correto para um crawler, para um clique com o botão do meio e com JavaScript desabilitado.</li>
      </ul>
      <h3>O que é mantido, e o que é reconstruído</h3>
      <table>
        <thead><tr><th>Nó</th><th>Na navegação</th></tr></thead>
        <tbody>
          <tr><td>um pai cujo padrão e caminho não mudaram</td><td><strong>mantido</strong>: mesmo nó, e seu <code>load()</code> não é executado de novo</td></tr>
          <tr><td>a página correspondente</td><td><strong>mantida</strong> quando seu padrão e caminho não mudaram e ela não tem <code>load()</code>, então uma mudança de query ou hash a mantém. Uma rota com carregador é atualizada a cada visita.</td></tr>
          <tr><td>um pai cujo caminho mudou</td><td>reconstruído, junto com tudo abaixo dele</td></tr>
          <tr><td>uma camada empilhada</td><td>renderiza apenas a página correspondente. Seus pais já estão montados na linha abaixo dela.</td></tr>
        </tbody>
      </table>
      <p>Uma página mantida mantém o <code>ctx</code> com que foi construída. Esse é o significado de <code>ctx</code> em todo lugar: leia <code>router.*</code> para valores ao vivo. Estado dirigido pela query, como filtros, paginação e abas, lê <code>router.search</code> dentro de um valor dinâmico e escreve com <code>router.go('?page=2', { replace: true })</code>. A página, seu foco e seu input digitado pela metade ficam no lugar.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Páginas & Regiões",
        content: `
      <p><code>router.outlet()</code> coloca a página em um lugar. Uma página que também precisa de uma sidebar, uma barra de ferramentas ou um título em outro ponto do layout o preenche com <a href="#api-region"><code>into()</code></a>. O layout marca o lugar com <code>region()</code>, e a página retorna um <code>into()</code> ao lado do seu próprio conteúdo. O layout nunca recebe conteúdo de página como prop, e a navegação nunca o reconstrói.</p>
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
      <p>O conteúdo da página é uma linha do <code>list()</code> do outlet, e um <code>into()</code> vive enquanto a linha que o contém viver. Então o conteúdo da sidebar chega com a página e sai com ela: navegar para uma página sem um <code>into('sidebar', …)</code> mostra o conteúdo <code>empty</code> da região de novo. A página pode usar seu <code>ctx</code> e seu <code>data</code> para ambas as partes, já que ambas são construídas pela mesma função.</p>
      <h3>O que acontece na navegação</h3>
      <ul>
        <li><strong>Uma página mantida mantém suas regiões.</strong> Uma mudança de query ou hash que <a href="#router-patterns">mantém a página</a> também não toca no conteúdo da região. Leia <code>router.search</code> dentro de um valor dinâmico se a sidebar depender dele.</li>
        <li><strong>Uma página reconstruída as preenche de novo.</strong> Quando a rota muda, a linha antiga é removida e as views <code>into()</code> da nova página assumem. Nada fica para trás.</li>
        <li><strong>Uma camada empilhada adiciona uma view.</strong> A camada é uma linha posterior do outlet, então seu <code>into()</code> é uma view mais nova da mesma região. Com o padrão <code>type: 'latest'</code> ela cobre a view da página até a camada fechar, e então a view da página aparece de novo. Com <code>type: 'stack'</code> ambas aparecem.</li>
        <li><strong>Uma página pai também pode preencher regiões.</strong> Suas views permanecem enquanto seus filhos mudam, porque o pai não é reconstruído.</li>
        <li><strong>A renderização no servidor funciona como está.</strong> O servidor constrói a página dentro de <code>route.run()</code>, então suas views <code>into()</code> estão no HTML, e <code>hydrate()</code> as reivindica.</li>
      </ul>
      <h3>Várias regiões a partir de uma página</h3>
      <p>Passe um objeto para preencher mais de uma região de uma vez. O conteúdo principal da página continua passando pelo outlet, então retorne-o ao lado do <code>into()</code>:</p>
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
        <li><strong><code>outlet()</code></strong> é para uma rota filha: conteúdo que a URL decide, renderizado dentro de sua página pai. Veja <a href="#router-patterns">Rotas Aninhadas</a>.</li>
        <li><strong><code>into()</code></strong> é para a página correspondente se espalhar pelo layout. O conteúdo pertence à página e usa seus dados.</li>
        <li><strong><code>matches()</code></strong> é para o layout decidir apenas a partir da URL, com sua própria tabela pequena e sem página envolvida. Veja <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Tudo isso pertence à única rota correspondente. O roteador não dirige duas áreas independentes a partir de uma URL, então uma sidebar com suas próprias rotas é uma região que uma página preenche, não um segundo outlet. Uma sidebar que realmente quer seu próprio roteador, carregamento e fallback mantém um não iniciado e resolve com <code>match()</code> — veja <a href="#router-multi">Múltiplos Roteadores &amp; Carregamento Combinado</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Carregadores de Rota & Code Splitting",
        content: `
      <p>Um módulo de página pode exportar uma função <code>load</code>. Ela roda antes da página ser construída, em toda navegação para essa rota, e o que ela retorna é entregue à página como <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>A tabela de rotas não muda. O carregador viaja com a página. Ele recebe o <code>RouteContext</code> correspondente, então <code>params</code>, <code>search</code> e <code>path</code> estão todos disponíveis. Pode ser síncrono ou assíncrono, e roda também no servidor, então uma página renderizada no servidor é entregue com seus dados já no HTML em vez de buscá-los depois da hidratação.</p>
      <p><strong>O módulo é cacheado. Os dados não.</strong> O chunk de uma rota é buscado uma vez e reutilizado, e seu carregador roda de novo em toda navegação. É por isso que <code>/blog/a</code> e <code>/blog/b</code> não podem ser confundidos, e por que um carregador que falhou pode simplesmente ser tentado de novo.</p>
      <table>
        <thead><tr><th>Situação</th><th>Comportamento</th></tr></thead>
        <tbody>
          <tr><td>enquanto ele roda</td><td><code>router.pending</code> é true e a página em que você estava continua na tela</td></tr>
          <tr><td>ele lança ou rejeita</td><td>cai em <code>router.error</code>. <code>go()</code> continua nunca rejeitando, e a navegação pode ser tentada de novo.</td></tr>
          <tr><td>durante <code>start()</code></td><td>a rejeição sai de <code>start()</code>. Ainda não há Route onde colocá-la.</td></tr>
          <tr><td>uma camada empilhada</td><td>roda seu próprio carregador, com seus próprios dados</td></tr>
          <tr><td>o pré-carregador em idle</td><td>aquece apenas módulos. Não tem contexto para passar, e estaria buscando dados para uma rota que você talvez nunca abra.</td></tr>
          <tr><td>navegar de novo para a mesma URL</td><td>o carregador roda de novo e a linha é reconstruída. Uma rota sem carregador mantém sua linha.</td></tr>
        </tbody>
      </table>
      <p>Para revalidar, navegue para onde você já está sem adicionar uma entrada no history:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Iniciando os dados junto com o chunk</h3>
      <p>Um <code>load</code> exportado pelo módulo da página só pode rodar depois que esse módulo chegou, então uma navegação a frio busca o chunk e depois os dados. Para iniciar ambos de uma vez, declare o carregador na tabela com <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Ele substitui o <code>load</code> do próprio módulo e roda a cada visita como ele. Uma rejeição enquanto o chunk ainda está carregando cai em <code>router.error</code> como qualquer outra.</p>
      <p>Não há serialização dos dados do servidor no HTML, por design. O <code>load</code> do cliente roda de novo na hidratação. Se isso importar, faça o servidor emitir <code>route.data</code>, por exemplo como <code>window.__DATA__</code>, e o carregador usá-lo primeiro. <code>route.data</code> são apenas os dados da página correspondente. O resultado do <code>load()</code> de um pai não está nele.</p>
      <h3>Code splitting e pré-carregamento</h3>
      <p>O valor de uma rota é sempre uma função que retorna o componente da página, então o componente é alcançado de forma lazy:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Apenas as formas com formato de módulo podem carregar um export <code>load</code>. Escolher um componente nomeado com <code>.then(m =&gt; m.BPage)</code> entrega ao roteador apenas a função.</p>
      <p>Cada módulo é importado uma vez e cacheado. Navegações concorrentes para a mesma rota compartilham um único <code>import()</code>. Depois que o usuário deixa a página quieta por <code>idleTimeout</code> (um segundo por padrão; sem toques, teclas, roda do mouse ou scroll), as rotas restantes são carregadas em segundo plano, uma por fatia de idle (<code>requestIdleCallback</code>). Qualquer entrada, ou uma navegação pela qual o usuário está esperando, pausa isso até a página ficar idle de novo.</p>
      <p>Uma rota pré-carregada ou eager nunca liga <code>router.pending</code> e aparece antes do próximo paint: nenhum frame de spinner, nenhum layout shift. <code>router.pending</code> só é true para um módulo ou carregador que precisa ser aguardado, e a página de saída fica na tela enquanto isso. Um chunk que falha ao carregar aparece como <code>router.error</code>, nunca como uma rejeição não tratada, e pode simplesmente ser tentado de novo.</p>
    `,
      },
      {
        id: "router-api",
        title: "API do Roteador",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> mapeia um padrão a um carregador, ou a uma tabela aninhada. Opções:</p>
      <table>
        <thead><tr><th>Opção</th><th>Padrão</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>Prefixo de URL sob o qual o app é servido, como <code>'/docs'</code>. Só corresponde em um limite de segmento: <code>/docs/intro</code> está dentro de <code>'/docs'</code>, <code>/docsearch</code> não. URLs fora dele não correspondem a nada, então <code>start()</code> rejeita (seu 404 do lado do servidor) e links para elas ficam para o navegador.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Carregar os módulos das rotas restantes em segundo plano quando a página ficar idle. <code>false</code> desliga.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Milissegundos sem toques, teclas, roda do mouse ou scroll antes do pré-carregamento começar, ou retomar depois que o usuário esteve ocupado.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, chamado depois de toda navegação resolvida no navegador, incluindo a inicial, quando o DOM já foi atualizado. <code>kind</code> é <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Voltar, Avançar, <code>close()</code>) ou <code>'layer'</code>. O gancho para <code>document.title</code>, meta tags, foco, scroll e analytics. Nunca chamado durante SSR.</td></tr>
        </tbody>
      </table>
      <p>Retorna o roteador: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, e todos os membros de <code>Route</code> exceto <code>run()</code>, lidos diretamente do Route ativo. Esse é aquele que o último <code>start()</code> retornou no navegador, ou aquele cujo <code>run()</code> está executando no servidor. Ler um membro sem nenhum dos dois lança um erro. A tabela de rotas, o matcher compilado e o cache de módulos vivem no roteador, então são compartilhados entre requisições em um servidor.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Resolve <code>url</code> (padrão: <code>location.href</code> no navegador) para seus módulos de página e retorna uma <code>Promise&lt;Route&gt;</code>. Rejeita quando nada corresponde e a tabela não tem rota <code>'*'</code>. Em um servidor, esse é o seu 404. No navegador também torna o Route o ativo do roteador, anexa os listeners de <code>popstate</code> e de <code>click</code> delegado e agenda o pré-carregamento. Um segundo <code>start()</code> aposenta o Route anterior para você. No servidor não toca em nada compartilhado, então renderize dentro de <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Resolve uma URL contra a tabela sem carregar nada: sem import, sem history, sem listeners, sem Route. Retorna um <code>RouteContext</code>, ou <code>null</code> quando a URL está fora de <code>base</code>, não corresponde a nenhum padrão ou, no navegador, está em outra origem. Apenas URLs absolutas, já que a resolução de <code>./</code> precisa de uma rota ativa.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>As páginas da rota ativa como um <code>list()</code>. Coloque-o uma vez, onde as páginas devem ir. Uma camada empilhada é uma linha posterior dele. Está vazio antes de <code>start()</code> resolver e depois de <code>stop()</code>. No servidor renderiza o Route cujo <code>run()</code> está executando.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Renderiza a view de uma segunda tabela que o caminho da rota ativa corresponde, como um <code>list()</code> que você coloca em qualquer lugar. Veja <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Todos os membros exceto <code>run()</code> também estão no roteador, que é onde um app os lê.</p>
      <table>
        <thead><tr><th>Membro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>a correspondência ativa. <code>search</code> é um <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> e <code>url</code> são ao vivo.</td></tr>
          <tr><td><code>pending</code></td><td>uma navegação está esperando um módulo ou um carregador</td></tr>
          <tr><td><code>error</code></td><td>o último carregamento que falhou, limpo pela próxima navegação</td></tr>
          <tr><td><code>data</code></td><td>o que o <code>load()</code> da página correspondente retornou, para um servidor serializar. O de um pai não está nele.</td></tr>
          <tr><td><code>depth</code></td><td>quantas camadas estão na pilha (1 para uma página comum)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>navegar, carregando o módulo se necessário. Nunca rejeita: um módulo que falha, rejeitando ou lançando, cai em <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>abrir uma rota como uma nova camada por cima, resolvendo com o que ela fechar. Aceita <code>./</code>. Rejeita se não houver correspondência ou se o módulo falhar.</td></tr>
          <tr><td><code>href(path)</code></td><td>prefixar um caminho com <code>base</code>, para <code>a({ href })</code>. Resolve <code>./</code> e <code>../</code> contra a rota ativa.</td></tr>
          <tr><td><code>stop()</code></td><td>desanexar todos os listeners, descartar camadas abertas, esvaziar o outlet. Idempotente. Um Route parado ainda responde com sua última correspondência, e <code>go()</code> não faz nada.</td></tr>
          <tr><td><code>run(fn)</code></td><td>chamar <code>fn</code> com este Route como o ativo do roteador e retornar seu resultado: <code>route.run(() =&gt; renderToString(App))</code> no servidor. Apenas síncrono. O Route deixa de ser ativo quando <code>fn</code> retorna.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>O primeiro argumento de uma página: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. É o contexto com que a página foi construída. Leia <code>router.*</code> para valores ao vivo. Eles diferem apenas quando a query ou o hash mudou sem uma reconstrução.</p>
      <p><code>params</code> é <code>{ [name]: string }</code> por padrão. Uma página pode tipá-lo a partir do seu próprio padrão com <code>Params</code>, que transforma <code>'/blog/:slug'</code> em <code>{ slug: string }</code> e <code>'/files/*rest'</code> em <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>O segundo argumento de uma página. Desestruture o que a página precisar.</p>
      <table>
        <thead><tr><th>Prop</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>onde a página está na pilha. Veja <code>Layer</code> abaixo.</td></tr>
          <tr><td><code>data</code></td><td>o que o <code>load()</code> da rota retornou, ou <code>undefined</code> sem um. Tipado por <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>onde uma página pai renderiza sua rota filha. Veja <a href="#router-patterns">Rotas Aninhadas</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>registra um guard consultado antes desta página ser descartada. Veja <a href="#router-layers">Guards de saída</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Onde uma página está na pilha, e sua saída.</p>
      <table>
        <thead><tr><th>Membro</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 para a página base, 1 em diante para camadas empilhadas</td></tr>
          <tr><td><code>push(href)</code></td><td>abrir outra camada de dentro de uma página, igual a <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>fechar esta camada e tudo acima dela, resolvendo o <code>push()</code> que a abriu. Sem argumento significa descartada. Sem efeito na profundidade 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> e <code>withLoad()</code></h3>
      <p><code>DataLoader</code> é <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, o export opcional <code>load</code> de um módulo de página. <code>withLoad(loader, load)</code> cria uma rota cujo <code>load</code> começa junto com o import do seu chunk em vez de depois dele. Veja <a href="#router-loaders">Carregadores de Rota</a>.</p>
      <h3>Tipos</h3>
      <p>Todo tipo é um export nomeado de <code>nuclo-router</code>, então uma página, um carregador ou um guard pode ser tipado sem importar de um caminho.</p>
      <table>
        <thead><tr><th>Tipo</th><th>O que é</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>o objeto de params para um padrão. <code>RouteParams</code> é a forma não tipada, e <code>Match</code> é o resultado do matcher.</td></tr>
          <tr><td><code>PageComponent</code></td><td>uma página: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>um módulo de página: o próprio componente, ou <code>{ default, load? }</code> como <code>import()</code> produz</td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, opcionalmente carregando um <code>load</code> de <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>a tabela que <code>createRouter()</code> recebe: padrão para carregador, ou para uma tabela aninhada</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, o segundo argumento de <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, o segundo argumento de <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>o tipo de <code>outlet()</code> de <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, o que <code>beforeLeave()</code> recebe</td></tr>
          <tr><td><code>MatchView</code></td><td>o que uma view de <code>matches()</code> é: params entram, conteúdo ou <code>import()</code> de uma página sai</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Camadas & Guards de Saída",
        content: `
      <p><code>push()</code> abre uma rota por cima da atual em vez de substituí-la, e resolve com o que essa camada fechar. Como as páginas são um único <code>list()</code> sobre a pilha, abrir uma camada é um append. A página abaixo não é renderizada de novo, então seu DOM, seu foco e seu formulário preenchido pela metade continuam lá quando a camada fecha.</p>
      <p>Isso faz o fluxo "preciso de um registro que ainda não existe" funcionar sem jogar fora o formulário que o usuário estava preenchendo:</p>
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
      <p>Camadas aninham. Um diálogo que precisa do seu próprio diálogo chama <code>layer.push()</code> e o aguarda, sem nenhuma referência ao Route.</p>
      <ul>
        <li><strong>A URL é a camada do topo.</strong> <code>push()</code> adiciona uma entrada no history, então uma camada é linkável e Voltar a fecha, resolvendo seu <code>push()</code> como descartado, exatamente como Cancelar. Voltar e <code>close()</code> são um único caminho de código: <code>close()</code> registra seu resultado e volta no history, e a profundidade em <code>history.state</code> é a autoridade. Navegadores mantêm cerca de 50 entradas por aba, então depois de um longo passeio por camadas a entrada abaixo pode ter sumido: então <code>close()</code> fecha as camadas no lugar e reescreve a entrada atual para a página que ficou visível.</li>
        <li><strong>Uma navegação comum limpa a pilha.</strong> Um clique em link ou <code>go()</code> não é uma camada. Substitui tudo e descarta toda camada aberta, então nenhum chamador fica aguardando.</li>
        <li><strong>Um carregamento a frio é uma página independente.</strong> A URL nomeia a camada do topo mas não a pilha abaixo dela, então abrir a URL de uma camada diretamente a renderiza na profundidade 1 com <code>layer.depth === 0</code> e um <code>close()</code> inerte. Uma rota empilhada precisa fazer sentido sozinha. Ramifique em <code>layer.depth</code> para oferecer um link de saída em vez de um botão Cancelar morto.</li>
        <li><strong>A promise não sobrevive a um reload</strong>, porque vive em uma closure. Trate o resultado como um atalho por um fluxo que também funciona pelo caminho longo.</li>
        <li><strong>Nada fica aguardando.</strong> <code>stop()</code> descarta toda camada aberta, e uma camada abandonada por uma navegação resolve com <code>undefined</code>.</li>
      </ul>
      <h3>Guards de saída</h3>
      <p>Uma página que guarda algo que vale manter, como um formulário preenchido pela metade, registra um guard. Ele é consultado antes da página ser descartada, e retornar <code>false</code> (ou uma promise dele) mantém a página:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Só quando a página sai.</strong> Uma navegação filha sob um layout, ou uma mudança de query ou hash que mantém a página, não consulta. Um guard vive e morre com sua página, então não há nada para desregistrar.</li>
        <li><strong>Todas as saídas.</strong> Um link, <code>go()</code>, Voltar e Avançar, o <code>close()</code> de uma camada, e <code>go()</code> para uma URL que o roteador não possui (saindo do app, onde <code>to</code> é <code>null</code>). Um Voltar ou Avançar recusado é desfeito, então a barra de endereço fica na página. Fechar a aba ou recarregar é trabalho do <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> é o <code>RouteContext</code> para onde a navegação está indo. Guards rodam do mais interno primeiro e param na primeira recusa. Um que lança erro mantém a página. <code>close(result)</code> também passa pelo guard, então limpe sua flag antes de fechar com um resultado.</li>
        <li>O roteador só consegue desfazer entradas de history que ele mesmo escreveu. Um Voltar ou Avançar para uma que ele não escreveu, como um link <code>#fragment</code> nativo ou o <code>pushState</code> de outro script, não é consultado.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() & Sub-roteadores",
        content: `
      <p><code>router.outlet()</code> renderiza a página. <code>router.matches(table)</code> renderiza outra coisa que depende de onde você está, como uma sidebar, breadcrumbs ou uma barra de ferramentas, a partir da sua própria tabela pequena, sem carregar uma rota ou adicionar uma página:</p>
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
        <li><strong>Mesma correspondência da tabela de rotas.</strong> Os padrões, a precedência, a correspondência de caminho bruto e a remoção de <code>base</code> são os do próprio roteador, então uma view e uma página sempre concordam sobre a URL. Ele lê o caminho da camada do topo, como <code>router.path</code>.</li>
        <li><strong>Uma view</strong> é <code>(params, ctx) =&gt; conteúdo</code>, onde <code>params</code> é tipado a partir do seu padrão e <code>ctx</code> é o <code>RouteContext</code> com o <code>pattern</code> e os <code>params</code> da view. Ela pode, em vez disso, retornar o <code>import()</code> de um módulo de página, que é chamado com <code>ctx</code> quando chegar.</li>
        <li><strong>Nada corresponde, nada renderiza.</strong> Adicione uma view <code>'*'</code> como fallback. Está vazio antes de <code>start()</code> e depois de <code>stop()</code>, como o outlet.</li>
        <li><strong>Só renderiza de novo quando a rota muda</strong>, então uma view mantém seu DOM através de qualquer coisa que mantenha a página.</li>
        <li><strong>Uma view lazy não renderiza nada até seu módulo chegar.</strong> Um <code>import()</code> que falha é registrado com <code>console.error</code>, não define <code>router.error</code>, e é tentado de novo na próxima navegação. Um <code>update()</code> comum não tenta de novo.</li>
        <li><strong>No servidor</strong> uma view lazy não entrega nada, já que seu módulo chega no cliente. Use uma view síncrona para qualquer coisa que o primeiro HTML precise conter.</li>
      </ul>
      <h3>Sub-roteadores</h3>
      <p>Rotas aninham, então um sub-roteador normalmente é só uma tabela aninhada. Um roteador: a própria página <code>'/'</code> da seção é o seu chrome, e seus filhos renderizam no <code>outlet()</code> dessa página, então o chrome sobrevive à navegação dentro da seção:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Ou dê à funcionalidade um roteador próprio, criado mas nunca iniciado. O pai possui uma única entrada catch-all e o filho resolve o restante contra seus próprios padrões, params e fallback:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Nunca iniciá-lo é o ponto. <code>start()</code> é o que anexa os listeners, e dois roteadores iniciados entram em conflito. A troca é que o filho é dono da resolução, então os carregadores de rota, que um roteador iniciado executa, ficam por sua conta chamar. Esse formato também reconstrói o shell quando o restante muda, porque o roteador vê uma rota e o shell resolve o resto sozinho. Uma tabela aninhada é o que lhe dá um pai que o roteador mantém montado, então prefira-a a menos que a funcionalidade realmente precise do seu próprio roteador, base e fallback.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Múltiplos Roteadores & Carregamento Combinado",
        content: `
      <p>Um app pode ter tantos roteadores quantas áreas tiver. A regra que mantém isso simples: <strong>inicie exatamente um por documento</strong>, e deixe todos os outros roteadores não iniciados, resolvendo URLs com <code>match()</code>. Apenas o roteador iniciado possui a URL, o history e o listener de clique. Os outros são tabelas às quais você faz perguntas — e cada área pode carregar no seu próprio ritmo, com seu próprio spinner.</p>
      <h3>Carregamento combinado: uma cadeia de carregadores</h3>
      <p>Toda página em uma cadeia correspondente pode exportar <code>load()</code>. Em uma navegação a frio para uma rota filha, o carregador do layout e o carregador da página rodam <strong>em paralelo</strong>, e um único <code>router.pending</code> cobre a cadeia inteira: a página anterior fica na tela até o par resolver, então uma árvore carregada pela metade nunca é pintada. Cada componente recebe seu próprio <code>data</code>:</p>
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
      <p>Ambos os carregadores começam juntos, não um depois do outro. <code>router.pending</code> é true enquanto qualquer um dos dois é aguardado, e false no resto do tempo — uma rota pré-carregada ou eager nunca o liga. Mover-se entre seções mantém o layout, então apenas o carregador da seção roda de novo; os dados do layout, seu DOM e um input digitado pela metade sobrevivem. Navegar de novo para a mesma URL roda de novo o carregador da folha e reconstrói sua linha, exatamente como com uma única página.</p>
      <h3>Carregamento múltiplo: um segundo roteador com seu próprio spinner</h3>
      <p>Uma área independente — uma sidebar, uma bandeja, uma região ao vivo — recebe um roteador próprio, criado mas nunca iniciado, e sua própria flag de carregamento. <code>router.pending</code> pertence ao roteador iniciado e não diz nada sobre essa área, então as duas podem carregar lado a lado e qualquer uma pode terminar primeiro:</p>
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
      <p>O segundo roteador é consultado, nunca comandado: <code>match()</code> lê a URL e retorna um contexto, e nada sobre a sidebar jamais entra na tabela de rotas principal. <code>onNavigate</code> roda depois de toda navegação resolvida, incluindo a inicial, então é o único lugar que mantém uma área independente em sincronia com a URL.</p>
      <ul>
        <li><strong><code>pending</code> pertence ao roteador iniciado.</strong> Um roteador nunca iniciado não tem Route, nem <code>pending</code>, nem <code>error</code>. A área acompanha suas próprias flags, e um segundo spinner pode ficar ao lado do primeiro. Na demo a sidebar carrega por 800ms enquanto os carregadores da rota rodam por 900ms, então a página pode terminar antes da sidebar ou o contrário.</li>
        <li><strong><code>match()</code> não anexa nada.</strong> Qualquer número de roteadores não iniciados pode compartilhar o documento; cada um tem sua própria tabela, base e cache de módulos, e nenhum deles toca no history. Custam uma tabela e um matcher.</li>
        <li><strong>Seus carregadores nunca rodam.</strong> O roteador iniciado executa o <code>load()</code> das páginas que ele corresponde. Um roteador nunca iniciado apenas resolve, então se suas views precisam de dados, busque-os você mesmo — o <code>refreshSidebar()</code> da demo. Se você quer carregadores, uma <a href="#router-matches">tabela aninhada</a> ou uma <a href="#router-regions">região que uma página preenche</a> mantém esse trabalho com o roteador iniciado.</li>
        <li><strong>Proteja-se contra respostas obsoletas.</strong> Um fetch lento da sidebar não deve aterrissar na seção da qual você já saiu. Incremente um contador de geração por atualização e descarte respostas que não correspondem mais, do mesmo jeito que o próprio roteador aposenta navegações ultrapassadas.</li>
        <li><strong>Uma view lazy de <code>matches()</code> também não tem <code>pending</code>.</strong> Ela não renderiza nada até seu módulo chegar. Três sistemas de carregamento, três relógios independentes: o <code>pending</code> da rota, suas próprias flags, e uma view lazy que simplesmente ainda não está lá.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Tratamento de Links",
        content: `
      <p>O listener delegado navega em um clique esquerdo em um <code>&lt;a href&gt;</code>, incluindo um <code>&lt;a&gt;</code> SVG e cliques em qualquer coisa aninhada dentro de um, e sai do caminho para todo o resto: cliques com modificador e com o botão do meio, um <code>target</code> diferente de <code>_self</code>, <code>download</code>, <code>rel="external"</code>, hrefs de outra origem, links somente de hash na página atual, caminhos fora de <code>base</code>, caminhos que nenhuma rota corresponde (então um 404 renderizado no servidor continua alcançável), e qualquer evento em que um handler do app já chamou <code>preventDefault()</code>. Exclua um link explicitamente com <code>data-nuclo-router="off"</code>.</p>
      <h3>Scroll</h3>
      <p>Uma navegação por push preserva a posição de scroll atual. Quando a nova URL tem um <code>#hash</code> que corresponde a um elemento na página, esse elemento é rolado para a vista. <code>popstate</code> deixa o scroll para o navegador. Para novas páginas começarem no topo, faça isso em <code>onNavigate</code>, que diz como a navegação aconteceu:</p>
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
        <li><strong>Nada é retido.</strong> O Route guarda a função da página e seu contexto, nunca DOM. Navegar para fora libera a página anterior. <code>stop()</code> libera os listeners e qualquer carregamento em andamento, e limpa <code>pending</code>, então um Route aposentado nunca deixa um spinner preso. Um módulo que resolve depois de <code>stop()</code> é descartado silenciosamente.</li>
        <li><strong>Seguro para concorrência no servidor.</strong> <code>start()</code> retorna estado por requisição e <code>run()</code> o restringe a uma renderização síncrona, então requisições intercaladas não conseguem ver a rota uma da outra. Apenas o cache de módulos é compartilhado. O escopo termina quando a função de <code>run()</code> retorna. <code>renderToString()</code> é síncrono, então isso basta. Uma renderização assíncrona ou em streaming precisaria do Route carregado através de <code>await</code>s, o que <code>run()</code> não faz.</li>
        <li><strong>Restauração de scroll em <code>popstate</code></strong> é do navegador (<code>scrollRestoration</code>), não do roteador.</li>
        <li><strong>Inicie um roteador por documento.</strong> Cada <code>start()</code> adiciona seu próprio listener de <code>click</code> delegado, e o <code>start()</code> de um segundo roteador não aposenta o primeiro. Apenas um segundo <code>start()</code> no mesmo roteador faz isso. Para resolver uma URL contra outra tabela, crie um roteador e chame apenas <code>match()</code>. Ele não anexa nada. Uma área independente pode executar seu próprio carregamento ao lado do <code>pending</code> da rota dessa forma. Veja <a href="#router-multi">Múltiplos Roteadores &amp; Carregamento Combinado</a>.</li>
        <li><strong>Não incluído, por design:</strong> hash history e memory history, já que a rota vive no pathname e um servidor precisa servir toda rota; duas áreas roteadas independentemente dirigidas por uma URL, já que uma página pode preencher várias regiões com <code>into()</code> mas todas pertencem à única rota correspondente — uma área independente ainda pode manter seu próprio roteador não iniciado e carregamento, como em <a href="#router-multi">Múltiplos Roteadores &amp; Carregamento Combinado</a>; e pré-carregamento no hover, que você obtém chamando o próprio carregador da rota a partir de um <code>mouseenter</code>.</li>
      </ul>
      <h3>Exemplos</h3>
      <p>Dois exemplos executáveis no repositório se complementam, então toda configuração é observável em algum lugar:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: um tour pelo lado do cliente por toda a API. Toda forma de padrão e regra de precedência, as exclusões do tratamento de links, todo membro de Route com controles ao vivo, um sub-roteador, a pilha de camadas com três níveis, uma seção relativa montada em dois pais, e carregadores de rota com <code>pending</code> e <code>error</code>. Define <code>preload: false</code> para que esses estados fiquem visíveis.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> por requisição, hidratação que comprovadamente reivindica os nós do servidor, códigos de status 404 reais, um <code>base</code> fora da raiz, pré-carregamento em idle que você pode observar no painel de rede, e um carregador cujos dados são passados do servidor ao cliente para que a hidratação não busque de novo.</li>
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
        title: "Valores Computados",
        content: `
      <p>O Nuclo não tem uma API de valores computados. Use uma função comum, e chame-a a partir de valores dinâmicos:</p>
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
        title: "Assíncrono & Carregamento",
        content: `
      <p>Use <code>async</code>/<code>await</code> comuns, e chame <code>update()</code> cada vez que o estado mudar. Para um fetch, isso significa uma vez antes do <code>await</code> e uma vez depois:</p>
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
        title: "Boas Práticas",
        content: `
      <ul>
        <li><strong>Agrupe as mudanças.</strong> Altere todo o estado que precisar, depois chame <code>update()</code> uma vez.</li>
        <li><strong>Mantenha os valores dinâmicos rápidos e puros.</strong> Todos eles rodam em cada <code>update()</code>.</li>
        <li><strong>Use <code>scope()</code></strong> para atualizações pequenas e frequentes, como digitação ou timers.</li>
        <li><strong>Renderize dentro do documento.</strong> Nós que não estão no documento quando <code>update()</code> roda param de atualizar.</li>
        <li><strong>Use <code>when()</code> e <code>list()</code></strong> para filhos que mudam, não uma função que retorna nós.</li>
        <li><strong>Use <code>className</code>, não <code>class</code></strong>, e use <code>() =&gt; cx(...)</code> ou <code>{ className: () =&gt; … }</code> para classes dinâmicas.</li>
        <li><strong>Defina os estilos uma vez</strong>, no nível do módulo.</li>
        <li><strong>Renderização no servidor:</strong> renderize primeiro, depois coloque <code>getCssText()</code> em <code>&lt;style id="nuclo-styles"&gt;</code>. Passe os dados da requisição como argumentos, e mantenha os comentários HTML na saída.</li>
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
      <p>Toda função pública, e de onde ela vem.</p>
      <h3><code>nuclo</code> (global e export nomeado)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: executa todos os valores dinâmicos, ou os dos escopos indicados.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: dá a um elemento ids de escopo para <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: conteúdo condicional, com <code>.when()</code> e <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: uma linha por item, correspondidos por identidade.</li>
        <li><a href="#api-region"><code>region(options)</code></a> e <a href="#api-region"><code>into(id, ...content)</code></a>: um lugar nomeado na árvore, e conteúdo que o preenche de qualquer lugar.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: um listener de evento, ou <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: constrói e anexa.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: assume o HTML do servidor.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: chama os componentes de novo e aplica as mudanças no DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: classes geradas a partir de um objeto de estilo.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: combina estilos, o posterior vence.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> e <code>globalStyle</code> com tema.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: estilos a partir de opções.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> e <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (apenas export nomeado)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> e <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> e <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">Um import com efeito colateral</a>, mais <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> e as classes <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (pacote separado)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: o roteador, com <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> e <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: uma rota cujo carregador de dados começa junto com seu chunk.</li>
        <li><a href="#router-api">Tipos</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> e mais.</li>
      </ul>
      <h3>Apenas globais</h3>
      <ul>
        <li><a href="#tag-builders">175 construtores de tags</a>: <code>div</code>, <code>span</code>, …, <code>var_</code>, e <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Tipos</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> e mais. Tipos de estilização como <code>StyleResult</code> também podem ser importados de <code>'nuclo'</code>.</li>
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
        title: "Perguntas Frequentes",
        content: `
      <h3>Alterar o estado atualiza a interface?</h3>
      <p>Não. O DOM fica como está até você chamar <code>update()</code>.</p>

      <h3>O Nuclo usa signals, proxies ou um DOM virtual?</h3>
      <p>Não. O estado continua JavaScript puro. Quando uma árvore é renderizada, o Nuclo cria elementos e nós de texto reais. <code>update()</code> executa todo valor dinâmico registrado, ou os que estão dentro dos escopos indicados, e aplica as mudanças nesses mesmos nós onde um valor mudou. Não há grafo de dependências nem árvore virtual.</p>

      <h3>Por que minha página mostra "false"?</h3>
      <p>Booleanos são renderizados como texto. <code>div(ok &amp;&amp; span('Done'))</code> mostra "false". Use <code>when(() =&gt; ok, span('Done'))</code> para filhos, e <code>ok ? 'Done' : ''</code> para texto.</p>

      <h3>Por que a linha da minha lista não muda quando eu edito o item?</h3>
      <p>Linhas de itens que ainda estão na lista são mantidas, não renderizadas de novo. Use valores dinâmicos como <code>() =&gt; todo.text</code> para campos que mudam. Veja <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Por que parte da minha interface para de atualizar?</h3>
      <p>Normalmente seus nós não estavam no documento quando <code>update()</code> rodou. O Nuclo para de rastrear esses nós, mesmo depois que você os anexa, então renderize em um container que esteja no documento. Duas outras causas: um <code>when()</code> cuja condição lança erro para de atualizar, e uma função de texto que lança erro na primeira execução fica vazia. Veja <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Quando devo usar <code>forceUpdate()</code>?</h3>
      <p>Apenas para mudanças raras em valores estáticos, como trocar o idioma. Para todo o resto, use <code>update()</code>. Veja <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Como coloco uma página em um layout sem passá-la como prop?</h3>
      <p>Marque o lugar com <code>region({ id: 'main' })</code> e faça a página retornar <code>into('main', …)</code>. Veja <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Como desmonto um app?</h3>
      <p>Envolva-o em <code>when()</code> e desligue a condição. Remover o DOM por conta própria não executa <code>onDestroy</code>. Veja <a href="#lifecycle">Ciclo de Vida</a>.</p>

      <h3>O Nuclo inclui um roteador?</h3>
      <p>Não no pacote principal. O roteamento é distribuído separadamente como <code>nuclo-router</code>, com renderização no servidor, hidratação, rotas com code splitting e pré-carregamento em idle. Instale-o com <code>npm install nuclo nuclo-router</code>. Veja <a href="#router-overview">nuclo-router</a>.</p>

      <h3>O Nuclo tem effects?</h3>
      <p>Não. <code>onMount</code> e <code>onDestroy</code> rodam uma vez por elemento, atrelados à inserção e à remoção. Nada roda de novo porque algum estado mudou.</p>
    `,
      },
    ],
  },

];
