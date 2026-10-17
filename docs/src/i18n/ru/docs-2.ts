import { code, sh } from "../../pages/docs/blocks.ts";
import { NUCLO_ROUTER_GZIP_KB } from "../../generated/nuclo-stats.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_2: DocGroupText[] = [
  {
    title: "Стили",
    sections: [
      {
        id: "api-styling",
        title: "css()",
        content: `
      <p>Превращает типизированный объект стиля в сгенерированные классы CSS. Передайте результат любому конструктору тегов. В браузере правила объединены в один элемент <code>&lt;style id="nuclo-styles"&gt;</code>. На сервере их возвращает <a href="#api-css-text"><code>getCssText()</code></a>.</p>
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
        <li><code>css()</code> создает один класс для базовых объявлений, а также по одному классу для каждого псевдоключа, селектора и медиа-блока. Карта выше имеет два класса.</li>
        <li>Имена классов представляют собой хэши содержимого. Идентичные стили имеют общий класс, а сервер и клиент создают одинаковые имена.</li>
        <li>Определите стили один раз на уровне модуля. <code>css()</code> кэширует по объектам, поэтому каждый раз новый объект при каждом вызове обрабатывается заново.</li>
        <li>Изменение объекта стиля после его передачи в <code>css()</code> ничего не дает.</li>
        <li>Каждый стиль остается зарегистрированным на протяжении всего срока службы страницы или серверного процесса. Для значений, которые изменяются для каждого элемента, например ширины из данных, используйте атрибут <a href="#attributes"><code>style</code> </a>.</li>
      </ul>
      <h3>Именованные стили</h3>
      <p>Сначала передайте имя, чтобы получить читаемое имя класса:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>Базовый класс - это именно то имя. Остальные блоки получают <code>name-&lt;hash&gt;</code>.</li>
        <li>Имя должно быть допустимым именем класса. В противном случае Nuclo выдает предупреждение и генерирует его.</li>
        <li>Имена являются глобальными. Если два разных стиля используют одно и то же имя, Nuclo выдает предупреждение.</li>
      </ul>
      <h3>Использование результата</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p><code>String(card)</code> и <code>card.className</code> возвращают имена классов.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Объекты стилей",
        content: `
      <p>Объект, который вы передаете в <code>css()</code>, использует общие свойства CSS в camelCase, набор сокращений и вложенные ключи для псевдосостояний, селекторов и медиа-запросов. TypeScript автоматически заполняет все из них. Свойства вне типизированного набора, такие как <code>borderTopLeftRadius</code>, <code>fill</code> или <code>paddingInline</code>, помещаются в <code>raw</code> (см. ниже).</p>
      <h3>Значения</h3>
      <ul>
        <li>Номера становятся <code>px</code>, за исключением <code>0</code> и свойств без единиц измерения: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> и <code>gridRow</code>. В <code>raw</code>, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> и <code>animation-iteration-count</code> тоже безразмерные.</li>
        <li>Строки используются так, как написано. <code>null</code>, <code>undefined</code> и <code>false</code> пропускаются.</li>
        <li><code>lineHeight</code> (и <code>leading</code>) не имеет единиц измерения, поэтому <code>leading: 24</code> означает 24-кратный размер шрифта. Напишите <code>"24px"</code> для пикселей.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Сокращения</h3>
      <table>
        <thead><tr><th>Ключ</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding и каждый сторона</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>дополнение слева и справа/сверху и снизу</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>то же для маржи</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>Ширина, высота, а также их минимальное и максимальное значение</td></tr>
          <tr><td><code>size</code></td><td>ширина и высота</td></tr>
          <tr><td><code>bg</code></td><td>фон </td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>Эти ключи принимают <code>true</code>:</p>
      <table>
        <thead><tr><th>Ключ</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (дисплей не устанавливается)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Псевдосостояния</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> и <code>firstLetter</code>. Они гнездятся: <code>hover: { focus: {…} }</code> дает <code>:hover:focus</code>.</p>
      <h3>Селекторы и правила</h3>
      <p>Ключ, начинающийся с <code>&amp;</code>, является селектором, и каждый <code>&amp;</code> становится классом. Ключ, который начинается с <code>@</code>, является правилом: <code>@media</code>, <code>@container</code> или <code>@supports</code>.</p>
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
        <li>Ключ должен начинаться с <code>&amp;</code>. Такой ключ, как <code>".dark &amp;"</code>, игнорируется, поэтому напишите <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Два вложенных блока <code>@media</code> объединяются с <code>and</code>. Запрос, возглавляемый типом носителя (<code>print</code>, <code>only screen</code>), размещается первым, поскольку грамматика допускает тип только в начале. Пара, которую невозможно сгладить — два типа мультимедиа или ведущий <code>not</code> — предупреждает и использует только внутренний запрос. Любое другое вложенное правило заменяет внешнее.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>Используйте <code>raw</code> для любого свойства с именем, написанным точно так же, как в CSS. Числа по-прежнему получают <code>px</code>, поэтому передайте строки:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Любой другой плоский ключ преобразуется в kebab-case и записывается как есть, поэтому опечатка, такая как <code>colr: 'red'</code>, становится объявлением, которое браузер удаляет. Вложенный объект под ключом, который не является псевдосостоянием, экраном или ключом <code>&amp;</code> или <code>@</code>, игнорируется. TypeScript сообщает об обоих.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Сочетает стили. Когда два входа устанавливают одно и то же свойство, побеждает более поздний вход.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Ложные входные данные пропускаются, массивы выравниваются, а строки разбиваются и дедуплицируются.</li>
        <li>Созданные классы для одного и того же блока (базовый, тот же псевдо-, тот же медиа-запрос) объединяются в один новый класс. Другие имена классов проходят без изменений.</li>
        <li>Только <code>cx()</code> знает порядок аргументов. При использовании <code>div(base, blue)</code> добавляются оба класса, и побеждает правило, созданное последним. Поместите стили, которые переопределяют друг друга, в один вызов <code>cx()</code>.</li>
        <li>Когда блок именованного стиля объединяется с блоком другого входа, объединенным классом является <code>name-&lt;hash&gt;</code>, а не простое имя. Блоки, которые не объединяются, сохраняют свой класс, поэтому <code>cx(pageTitle, 'extra')</code> все еще имеет <code>page-title</code>.</li>
      </ul>
      <h3>Динамические классы</h3>
      <p>Передайте функцию, которая всегда возвращает <code>cx(...)</code>:</p>
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
      <p>Функция должна возвращать результат стиля при первом запуске. <code>() =&gt; active &amp;&amp; activeButton</code> отображает текст «false» вместо класса.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Возвращает свои собственные <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> и <code>globalStyle</code>, привязанные к теме. Тема дает имена значениям: в приведенной ниже теме <code>borderColor: 'border'</code> записывает <code>#e5e7eb</code>, а TypeScript автоматически дополняет имена. Каждая запись в <code>screens</code> становится ключом стиля для медиа-запроса, например <code>md: {…}</code>.</p>
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
        <thead><tr><th>Ключ темы</th><th>Используется </th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> и с каждой стороны, <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>Кнопки нового стиля, такие как <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Имя темы разрешается только в том случае, если оно является полным значением. <code>border: "1px solid primary"</code> не решен.</li>
        <li>Значение экрана без <code>@</code> становится <code>@media &lt;value&gt;</code>. Значение, начинающееся с <code>@</code>, используется в том виде, в котором оно записано, например <code>"@container (min-width: 400px)"</code>.</li>
        <li>Экраны существуют только на экземплярах, созданных с помощью <code>createCss()</code>. Глобальный <code>css()</code> не имеет их, но принимает ключи <code>@media</code>.</li>
        <li>Все экземпляры и глобальные помощники используют одну таблицу стилей. Правила мультимедиа на экране выводятся в том порядке, в котором экраны объявлены, а не в том порядке, в котором вы их используете, поэтому перечисляйте экраны <code>min-width</code> от меньшего к большему. Используйте один экземпляр <code>createCss()</code> для каждого приложения, чтобы порядок соответствовал вашей теме.</li>
        <li><code>theme</code> в результате тема, которую вы прошли.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Создает функцию, которая возвращает стиль для набора параметров, таких как назначение и размер кнопки.</p>
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
        <li>Стили объединяются в следующем порядке: <code>base</code>, выбранное значение каждой группы, затем каждое соответствующее соединение. Более поздние стили выигрывают по каждому свойству.</li>
        <li>Отсутствующий параметр <code>undefined</code> или <code>null</code> использует значение по умолчанию. Группа без значения по умолчанию пропускается.</li>
        <li>Группа, содержащая только ключи <code>true</code> и <code>false</code>, принимает логическое значение.</li>
        <li>Соединение применяется, когда каждая группа, указанная в нем, совпадает, включая значения по умолчанию.</li>
        <li>Каждая выборка создается один раз и кэшируется.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() и globalStyle()",
        content: `
      <p><code>keyframes()</code> регистрирует анимацию и возвращает ее сгенерированное имя. Ключами кадров являются <code>from</code>, <code>to</code> и проценты, например <code>"50%"</code> или <code>"0%, 100%"</code>. Фреймы принимают только плоские свойства. Идентичные кадры возвращают одно и то же имя.</p>
      ${code("fade.ts", `
const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const panel = css({ animation: \`\${fadeIn} 200ms ease-out\` })
`)}
      <p><code>globalStyle()</code> добавляет правило для любого селектора:</p>
      ${code("reset.ts", `
globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })
globalStyle('body', { m: 0, font: 'system-ui, sans-serif' })
`)}
      <ul>
        <li>Селектор используется точно так, как написано.</li>
        <li>Работают только плоские свойства. Псевдоклавиши, экраны и клавиши <code>@</code> игнорируются, поэтому <code>globalStyle()</code> не может записывать медиа-правила.</li>
        <li>Одно и то же правило добавляется один раз. Другой стиль для того же селектора добавляет второе правило, и побеждает более позднее.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() и resetStyles()",
        content: `
      <p><code>getCssText()</code> возвращает все правила, созданные <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> и <code>globalStyle()</code> в этом процессе: сначала базовые правила, затем <code>@media</code>, <code>@container</code> и Блоки <code>@supports</code>. Используйте его для серверного рендеринга.</p>
      <ul>
        <li>Назовите его после <code>renderToString()</code>. Включены правила, созданные во время рендеринга.</li>
        <li>Он охватывает весь процесс, а не одну страницу или запрос, и только растет. Это безопасно, поскольку имена классов представляют собой хеши контента.</li>
        <li>Поместите его в <code>&lt;style id="nuclo-styles"&gt;</code>. Клиент повторно использует этот элемент и пропускает уже содержащиеся в нем правила. С другим идентификатором или без него клиент снова добавляет вторую таблицу стилей к каждому правилу.</li>
        <li>Текст не экранируется, поэтому никогда не вводите ненадежные входные данные в значения стиля.</li>
      </ul>
      <p><code>resetStyles()</code> — помощник по тестированию. Он удаляет все правила и элемент <code>#nuclo-styles</code>. Созданные ранее стили сохраняют свои имена классов, но теряют свой CSS. Не вызывайте его в приложении или на сервере.</p>
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
    title: "Маршрутизация",
    sections: [
      {
        id: "router-overview",
        title: "nuclo-router",
        content: `
      <div class="docs-callout"><strong>Отдельный пакет: </strong> <code>nuclo-router</code> не является частью основного пакета Nuclo. Установите его рядом с <code>nuclo</code>. Это предварительная версия, поэтому ее API еще может измениться. </div>
      <p>Маршрутизация для Nuclo: серверный рендеринг, гидратация, маршруты с разделением кода и предварительная загрузка в режиме ожидания, построенные на <code>list()</code> и <code>update()</code>. О ${NUCLO_ROUTER_GZIP_KB} KB в сжатом виде, без каких-либо зависимостей, кроме самого Nuclo, и без побочных эффектов, поэтому, когда он не используется, он удаляется в виде дерева.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Или используйте <code>pnpm add</code>, <code>yarn add</code> или <code>bun add</code> с теми же двумя именами. В качестве одноранговой зависимости требуется <code>nuclo</code> 0.3 или новее.</p>
      <p>Маршрутизатор решает <em>what</em> загрузить. Приложение говорит <em>, где </em> с <code>router.outlet()</code>: один <code>list()</code> над стеком слоев, одна строка на каждый слой, поэтому обычная страница представляет собой одну строку. Сервер и клиент создают одно и то же дерево, поэтому <code>hydrate()</code> запрашивает узлы сервера, а не заменяет их. Все остальное — <code>history</code>, один делегированный прослушиватель <code>click</code> и <code>requestIdleCallback</code>.</p>
      <h3>Один импорт</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> разрешает модули соответствующего маршрута перед возвратом, поэтому первое дерево является полным как на сервере, так и на клиенте. После этого маршрутизатор считывает запущенный им маршрут: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
      <h3>Целое приложение</h3>
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
      <p>Вот и вся интеграция. Ссылки работают, потому что <code>&lt;a href&gt;</code> — это просто <code>&lt;a href&gt;</code>. Один делегированный прослушиватель на <code>document</code> перехватывает ссылки, принадлежащие маршрутизатору, и оставляет все остальные ссылки браузеру.</p>
      <p>На сервере <code>start()</code> возвращает <code>Route</code> для каждого запроса и оставляет маршрутизатор в покое, поэтому одновременные запросы не могут видеть маршрут друг друга. <code>route.run()</code> делает этот маршрут маршрутом, который маршрутизатор и, следовательно, розетка, считывает длину рендеринга. В браузере существует один маршрут для каждой загрузки страницы, и <code>start()</code> делает его собственным маршрутизатором. <code>run()</code> не требуется.</p>
      <p>Страница получает <a href="#router-api"><code>RouteContext</code></a> и <a href="#router-api"><code>PageProps</code></a> как <code>(ctx, { layer, data, outlet, beforeLeave })</code> и может принимать меньше аргументов. Он возвращает все, что принимает <code>list()</code>. Чтобы заполнить и другую часть макета, верните <code>into()</code> изнутри страницы, например <code>div(article(…), into('sidebar', nav(…)))</code>. Этот контент уходит вместе со страницей. См. <a href="#router-regions">Страницы &amp; Регионы</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Шаблоны и вложенные маршруты",
        content: `
      <table>
        <thead><tr><th>Шаблон</th><th>Совпадения</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td> именно это путь</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>ничего непревзойденного, вашего 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>Приоритет является статическим, затем динамическим в порядке объявления, а затем общим с самым длинным префиксом. Таким образом, <code>'*'</code> соответствует только тому, что не соответствует ничему другому, и может находиться в любом месте таблицы. Завершающие косые черты, повторяющиеся косые черты и процентное кодирование нормализуются, а значения параметров поступают в декодированном виде. Сопоставление — это сравнение сегментов по шаблону. Никакие регулярные выражения не создаются и не запускаются.</p>
      <h3>Относительные маршруты</h3>
      <p>Шаблон, записанный с помощью <code>./</code>, относится к родительскому элементу, который его объявляет, а href, записанный с помощью <code>./</code>, относится к активному маршруту. Вместе они образуют раздел многократного использования, который означает одно и то же для каждого родителя. Значением таблицы является либо загрузчик, либо другая таблица, ключи которой относятся к ней:</p>
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
      <p>Эти две строки создают все шесть шаблонов без двукратного написания пути. Оба родителя получают одни и те же объекты-загрузчики, поэтому они используют один кэш модулей и один <code>import()</code>.</p>
      <ul>
        <li>Внутри дочерней таблицы <code>'./x'</code>, <code>'/x'</code> и <code>'x'</code> означают одно и то же, <code>'/'</code> означает сам родительский путь, а <code>'*rest'</code> дает разделу свой собственный всеобъемлющий путь. Вложенность может быть настолько глубокой, насколько вам хочется.</li>
        <li>Ключи верхнего уровня используются в том виде, в котором они записаны, поэтому <code>'*'</code> остается <code>'*'</code>.</li>
        <li>Дочерний элемент родительского элемента <code>*catch-all</code> является ошибкой <code>createRouter()</code>, поскольку универсальный шаблон должен завершить свой шаблон.</li>
      </ul>
      <h3>Родительские страницы и <code>outlet()</code></h3>
      <p>Родитель и его дочерние элементы представляют собой настоящую иерархию. Родитель выполняет рендеринг, а его дочерний объект рендерится внутри него, где бы он ни вызывал <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>При переходе между дочерними элементами родительский элемент не перестраивается. Его узел DOM — тот же узел, поэтому его фокус, положение прокрутки, полутипизированный ввод и любое состояние его замыкания — все сохраняется.</p>
      <ul>
        <li>Страница без дочернего маршрута ничего не отображает из своего выхода, поэтому макет может вызывать ее безоговорочно. Родитель, у которого есть ребенок и который никогда не вызывает <code>outlet()</code>, проглатывает его.</li>
        <li>Индексных маршрутов нет. <code>'/'</code> — это сам макет, поэтому родительский путь отображает макет с пустым выходом, а не с отдельной индексной страницей внутри него. Поместите целевой контент в макет или дайте ему настоящий дочерний путь.</li>
      </ul>
      <p>Тот же вызов затем работает от любого родителя и от страницы, которая не знает, на какой из них она находится:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> и <code>..</code> разрешаются по пути текущего маршрута, а не по «каталогу» URL-адреса. Вместо <code>/invoices/42</code> <code>./preview</code> — это <code>/invoices/42/preview</code>, где браузер сказал бы <code>/invoices/preview</code>, а косая черта в конце URL-адреса ничего не меняет. <code>../</code> проходит сегмент вверх и останавливается в корне. Запрос и хеш выполняются, <code>base</code> добавляется повторно, а разрешенный абсолютный путь попадает в историю. Это то же отклонение от разрешения URL-адресов, которое React Router допускает для <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Только <code>./</code> и <code>../</code> являются относительными по маршруту. Голый <code>preview</code> в href оставлен обычным правилам браузера.</li>
        <li>Создавайте относительные ссылки с помощью <code>router.href('./preview')</code>, а не записывайте <code>href="./preview"</code> вручную. <code>href()</code> разрешается во время рендеринга, поэтому поставляемая разметка является абсолютной и по-прежнему корректной для сканера, для щелчка средней кнопкой мыши и с отключенным JavaScript.</li>
      </ul>
      <h3>Что сохраняется, а что перестраивается</h3>
      <table>
        <thead><tr><th>Узел</th><th>Навигация</th></tr></thead>
        <tbody>
          <tr><td>a родительский элемент, шаблон и путь которого не изменились.</td><td><strong>kept</strong>: тот же узел, а его <code>load()</code> - нет. повторный запуск</td></tr>
          <tr><td>соответствующая страница</td><td><strong>kept</strong>, когда ее шаблон и путь не изменились и у нее нет <code>load()</code>, поэтому запрос или изменение хэша сохраняют ее. Маршрут с загрузчиком обновляется при каждом посещении.</td></tr>
          <tr><td>родительский элемент, путь которого изменился</td><td>пересобран вместе со всем, что находится под ним</td></tr>
          <tr><td>a выдвинутый слой</td><td> отображает только соответствующую страницу. Его родители уже установлены в ряду под ним.</td></tr>
        </tbody>
      </table>
      <p>На сохраненной странице хранится <code>ctx</code>, с помощью которого она была создана. В этом везде смысл <code>ctx</code>: читайте <code>router.*</code>, чтобы узнать текущие значения. Состояние, управляемое запросом, такое как фильтры, нумерация страниц и вкладки, считывает <code>router.search</code> внутри динамического значения и записывает с помощью <code>router.go('?page=2', { replace: true })</code>. Страница, ее фокус и полунапечатанный ввод остаются на месте.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Страницы и регионы",
        content: `
      <p><code>router.outlet()</code> помещает страницу в одно место. Страница, которой также требуется боковая панель, панель инструментов или заголовок в другом месте макета, заполняется <a href="#api-region"><code>into()</code></a>. Макет отмечает это место с помощью <code>region()</code>, а страница возвращает <code>into()</code> рядом со своим собственным содержимым. Макет никогда не получает содержимое страницы в качестве опоры, а навигация никогда не перестраивает его.</p>
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
      <p>Содержимое страницы представляет собой строку <code>list()</code> торговой точки, а <code>into()</code> существует до тех пор, пока строка, в которой она содержится. Таким образом, содержимое боковой панели поступает вместе со страницей и удаляется вместе с ней: при переходе на страницу без <code>into('sidebar', …)</code> снова отображается содержимое региона <code>empty</code>. Страница может использовать свои <code>ctx</code> и <code>data</code> для обеих частей, поскольку обе они созданы с помощью одной и той же функции.</p>
      <h3>Что происходит с навигацией</h3>
      <ul>
        <li><strong>A сохраняет свои регионы. </strong> Запрос или изменение хеша, которые <a href="#router-patterns"> сохраняет страницу </a>, также не затрагивают содержимое региона. Прочитайте <code>router.search</code> внутри динамического значения, если от него зависит боковая панель.</li>
        <li><strong>A перестроенная страница заполняет их. </strong> При изменении маршрута старая строка удаляется, и представления <code>into()</code> новой страницы вступают во владение. Ничего не осталось позади.</li>
        <li><strong>A нажатый слой добавляет вид. </strong> Этот слой представляет собой более позднюю строку розетки, поэтому его <code>into()</code> представляет собой более новый вид той же области. При использовании <code>type: 'latest'</code> по умолчанию он закрывает вид страницы до тех пор, пока слой не закроется, а затем вид страницы отобразится снова. С <code>type: 'stack'</code> оба отображаются.</li>
        <li><strong>A родительская страница также может заполнять регионы. </strong> Ее представления остаются, пока изменяются ее дочерние элементы, поскольку родительский элемент не перестраивается.</li>
        <li><strong>Рендеринг сервера работает как есть. </strong> Сервер создает страницу внутри <code>route.run()</code>, поэтому его представления <code>into()</code> находятся в HTML, а <code>hydrate()</code> утверждает их.</li>
      </ul>
      <h3>Несколько регионов на одной странице</h3>
      <p>Передайте объект для одновременного заполнения нескольких регионов. Основной контент страницы по-прежнему проходит через выход, поэтому верните его рядом с <code>into()</code>:</p>
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
      <h3>Какой инструмент для какой работы</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> предназначен для дочернего маршрута: содержимого, определяемого URL-адресом, отображаемого внутри родительской страницы. См. <a href="#router-patterns">Вложенные маршруты</a>.</li>
        <li><strong><code>into()</code></strong> предназначен для распределения соответствующей страницы по макету. Контент принадлежит странице и использует ее данные.</li>
        <li><strong><code>matches()</code></strong> предназначен для выбора макета только на основе URL-адреса, с собственной небольшой таблицей и без участия страницы. См. <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Все они принадлежат одному сопоставленному маршруту. Маршрутизатор не управляет двумя независимыми областями с одного URL, поэтому боковая панель со своими маршрутами — это область, которую заполняет страница, а не второй выход. Боковая панель, которой действительно нужен собственный маршрутизатор, загрузка и возврат к резерву, не запускает один из них и разрешается с помощью <code>match()</code> — см. <a href="#router-multi">Несколько маршрутизаторов &amp; Комбинированная загрузка</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Загрузчики маршрутов и разделение кода",
        content: `
      <p>Модуль страницы может экспортировать функцию <code>load</code>. Он запускается до создания страницы, при каждом переходе по этому маршруту, и все, что он возвращает, передается на страницу как <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>Таблица маршрутов не изменяется. Загрузчик перемещается вместе со страницей. Он получает соответствующий <code>RouteContext</code>, поэтому доступны <code>params</code>, <code>search</code> и <code>path</code>. Он может быть синхронным или асинхронным, и он также работает на сервере, поэтому страница, отображаемая на сервере, поставляется с данными, уже находящимися в HTML, вместо извлечения после гидратации.</p>
      <p><strong> Модуль кэширован. Данные не такие. </strong> Фрагмент маршрута извлекается один раз и используется повторно, а его загрузчик запускается снова при каждой навигации. Именно поэтому <code>/blog/a</code> и <code>/blog/b</code> нельзя путать, и почему отказавший загрузчик можно просто перезапустить.</p>
      <table>
        <thead><tr><th>Ситуация</th><th>Поведение</th></tr></thead>
        <tbody>
          <tr><td>пока он работает</td><td><code>router.pending</code> верен, и страница, на которой вы были, остается активной</td></tr>
          <tr><td>он бросает или отклоняет </td><td> приземляется на <code>router.error</code>. <code>go()</code> по-прежнему никогда не отклоняется, и навигацию можно повторить. </td></tr>
          <tr><td>во время <code>start()</code></td><td> отклонение происходит из <code>start()</code>. Рута пока нет, чтобы его поставить. </td></tr>
          <tr><td>a выдвинутый слой</td><td> запускает собственный загрузчик со своими собственными данными</td></tr>
          <tr><td>неработающий прелоадер </td><td> прогревает только модули. У него нет контекста для передачи, и он будет получать данные для маршрута, который вы, возможно, никогда не откроете. </td></tr>
          <tr><td>повторный переход на тот же URL-адрес</td><td>, загрузчик запускается снова и строка перестраивается. Маршрут без погрузчика держит ряд.</td></tr>
        </tbody>
      </table>
      <p>Для повторной проверки перейдите туда, где вы уже находитесь, не добавляя запись в историю:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Запуск данных с чанка</h3>
      <p><code>load</code>, экспортированный модулем страницы, может быть запущен только после прибытия этого модуля, поэтому холодная навигация извлекает фрагмент, а затем данные. Чтобы запустить оба сразу, объявите загрузчик в таблице с <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Он заменяет собственный модуль <code>load</code> и запускается при каждом подобном посещении. Отказ, пока чанк все еще загружается, попадает на <code>router.error</code>, как и любой другой.</p>
      <p>Сериализация серверных данных в HTML не предусмотрена. <code>load</code> клиента снова работает на гидратации. Если это имеет значение, пусть сервер выдает <code>route.data</code>, например, как <code>window.__DATA__</code>, и загрузчик принимает его первым. <code>route.data</code> — это только данные соответствующей страницы. Результата родительского элемента <code>load()</code> на нем нет.</p>
      <h3>Разделение кода и предварительная загрузка</h3>
      <p>Значением маршрута всегда является функция, возвращающая компонент страницы, поэтому доступ к компоненту происходит лениво:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Экспорт <code>load</code> возможен только для модульных форм. Выбор именованного компонента с помощью <code>.then(m =&gt; m.BPage)</code> передает маршрутизатору только эту функцию.</p>
      <p>Каждый модуль импортируется один раз и кэшируется. Параллельная навигация по одному и тому же маршруту использует один <code>import()</code>. Как только пользователь оставляет страницу в покое для <code>idleTimeout</code> (по умолчанию секунда; никаких касаний, клавиш, колесика или прокрутки), остальные маршруты загружаются в фоновом режиме, по одному на каждый свободный фрагмент (<code>requestIdleCallback</code>). Любой ввод или навигация, которую ожидает пользователь, приостанавливает его до тех пор, пока страница снова не станет бездействующей.</p>
      <p>Предварительно загруженный или активный маршрут никогда не переворачивает <code>router.pending</code> и не приземляется до следующей отрисовки: нет вращающегося кадра, нет смещения макета. <code>router.pending</code> верно только для модуля или загрузчика, который нужно дождаться, и исходящая страница остается на экране, пока она есть. Чанк, который не может загрузить поверхности как <code>router.error</code>, а не как необработанный отказ, и его можно просто повторить.</p>
    `,
      },
      {
        id: "router-api",
        title: "API роутера",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> сопоставляет шаблон загрузчику или вложенной таблице. Опции:</p>
      <table>
        <thead><tr><th>Параметр</th><th>По умолчанию</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL префикс, под которым приложение обслуживается, например <code>'/docs'</code>. Оно совпадает только на границе сегмента: <code>/docs/intro</code> находится внутри <code>'/docs'</code>, <code>/docsearch</code> — нет. URL-адреса за его пределами ничему не соответствуют, поэтому <code>start()</code> отклоняет (ваш серверный код 404), а ссылки на них остаются на усмотрение браузера. </td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Загружайте модули остальных маршрутов в фоновом режиме, когда страница простаивает. <code>false</code> отключает его. </td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Миллисекунды без нажатий, клавиш, колесика или прокрутки перед началом предварительной загрузки или возобновлением после того, как пользователь был отключен занят.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, вызывается после каждой разрешенной навигации в браузере, включая начальную, после DOM догнал. <code>kind</code> — это <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Назад, Вперед, <code>close()</code>) или <code>'layer'</code>. Хук для <code>document.title</code>, метатегов, фокуса, прокрутки и аналитики. Никогда не звонил во время SSR.</td></tr>
        </tbody>
      </table>
      <p>Возвращает маршрутизатор: <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, и каждый член <code>Route</code>, кроме <code>run()</code>, считывается до активного маршрута. Это тот, который последний <code>start()</code> вернул в браузер, или тот, чей <code>run()</code> выполняется на сервере. Чтение члена ни с одним броском. Таблица маршрутов, скомпилированное средство сопоставления и кэш модулей находятся на маршрутизаторе, поэтому они используются совместно для всех запросов на сервере.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Разрешает <code>url</code> (по умолчанию: <code>location.href</code> в браузере) в модули страниц и возвращает <code>Promise&lt;Route&gt;</code>. Отклоняется, когда ничего не соответствует и в таблице нет маршрута <code>'*'</code>. На сервере это ваш 404. В браузере он также делает маршрут маршрутизатора активным, подключает <code>popstate</code> и делегированные прослушиватели <code>click</code> и планирует предварительную загрузку. Второй <code>start()</code> удаляет для вас предыдущий маршрут. На сервере он не затрагивает ничего общего, поэтому визуализируйте внутри <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Сопоставляет URL-адрес с таблицей, ничего не загружая: без импорта, без истории, без прослушивателей, без маршрутизации. Возвращает <code>RouteContext</code> или <code>null</code>, если URL-адрес находится за пределами <code>base</code>, не соответствует шаблону или в браузере находится в другом источнике. Только абсолютные URL-адреса, поскольку для разрешения <code>./</code> требуется активный маршрут.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Страницы активного маршрута в формате <code>list()</code>. Поместите его один раз, где бы ни находились страницы. Выдвинутый слой — это более поздняя его строка. Он пуст до разрешения <code>start()</code> и после <code>stop()</code>. На сервере он отображает маршрут, <code>run()</code> которого выполняется.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Отображает представление второй таблицы, которой соответствует путь активного маршрута, в виде <code>list()</code>, который вы размещаете где угодно. См. <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Все участники, кроме <code>run()</code>, также находятся на маршрутизаторе, где приложение их считывает.</p>
      <table>
        <thead><tr><th>Член</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>активный матч. <code>search</code> — это <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> и <code>url</code> активны. </td></tr>
          <tr><td><code>pending</code></td><td>а навигация ждет модуль или загрузчик </td></tr>
          <tr><td><code>error</code></td><td>последняя неудачная загрузка, очищается следующей навигацией</td></tr>
          <tr><td><code>data</code></td><td>, что вернул <code>load()</code> соответствующей страницы для сериализации на сервере. Родителя там нет.</td></tr>
          <tr><td><code>depth</code></td><td>сколько слоев в стеке (1 для обычной страницы)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td> Перейдите, загрузив модуль при необходимости. Никогда не отклоняется: модуль, который выходит из строя, отклоняя или выбрасывая, попадает на <code>error</code>.</td></tr>.
          <tr><td><code>push(href)</code></td><td>открывает маршрут как новый слой сверху, разрешая то, чем он закрывается. Принимает <code>./</code>. Отклоняет отсутствие соответствия или неисправный модуль.</td></tr>
          <tr><td><code>href(path)</code></td><td>префикс пути с <code>base</code> для <code>a({ href })</code>. Разрешает <code>./</code> и <code>../</code> для активного маршрута. </td></tr>
          <tr><td><code>stop()</code></td><td>отсоедините каждого слушателя, закройте открытые слои, опустошите выход. Идемпотент. Остановленный маршрут по-прежнему отвечает своим последним совпадением, а <code>go()</code> ничего не делает. </td></tr>
          <tr><td><code>run(fn)</code></td><td>Вызовите <code>fn</code> с этим маршрутом в качестве активного маршрутизатора и верните его результат: <code>route.run(() =&gt; renderToString(App))</code> на сервер. Только синхронно. Маршрут перестает быть активным, когда возвращается <code>fn</code>.</td></tr>.
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Первый аргумент страницы: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. Это контекст, в котором была создана страница. Прочтите <code>router.*</code> для получения текущих значений. Они различаются только в том случае, если запрос или хэш изменились без перестроения.</p>
      <p><code>params</code> по умолчанию — <code>{ [name]: string }</code>. Страница может ввести его по собственному шаблону с помощью <code>Params</code>, который преобразует <code>'/blog/:slug'</code> в <code>{ slug: string }</code>, а <code>'/files/*rest'</code> в <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>Второй аргумент страницы. Деструктурируйте то, что нужно странице.</p>
      <table>
        <thead><tr><th>Свойство</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>, где страница находится в стеке. См. <code>Layer</code> ниже. </td></tr>
          <tr><td><code>data</code></td><td>, что вернул <code>load()</code> маршрута, или <code>undefined</code> без него. Напечатано <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>, где родительская страница отображает свой дочерний маршрут. См. <a href="#router-patterns">Вложенные маршруты</a>.</td></tr>.
          <tr><td><code>beforeLeave</code></td><td>регистрирует запрос защиты перед удалением этой страницы. См. <a href="#router-layers">Оставить охрану</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Местонахождение страницы в стеке и ее выход.</p>
      <table>
        <thead><tr><th>Член</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 для базовой страницы, 1 и выше для добавленных слоев</td></tr>
          <tr><td><code>push(href)</code></td><td>открыть еще один слой изнутри страницы, так же, как <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>закройте этот слой и все, что находится над ним, разрешив <code>push()</code>, который его открыл. Отсутствие аргументов означает увольнение. Отсутствие операции на глубине 0.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> и <code>withLoad()</code></h3>
      <p><code>DataLoader</code> — это <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, дополнительный экспорт <code>load</code> страничного модуля. <code>withLoad(loader, load)</code> создает маршрут, <code>load</code> которого начинается рядом с импортируемым фрагментом, а не после него. См. <a href="#router-loaders">Маршрутные погрузчики </a>.</p>
      <h3>Типы</h3>
      <p>Каждый тип представляет собой именованный экспорт <code>nuclo-router</code>, поэтому страницу, загрузчик или защиту можно ввести без импорта по пути.</p>
      <table>
        <thead><tr><th>Тип</th><th>Что это такое</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td> — объект параметров для шаблона. <code>RouteParams</code> — это нетипизированная фигура, а <code>Match</code> — результат сопоставления. </td></tr>
          <tr><td><code>PageComponent</code></td><td>a страница: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>a модуль страницы: сам компонент или <code>{ default, load? }</code>, поскольку <code>import()</code> дает </td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, дополнительно с <code>load</code> от <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>таблица <code>createRouter()</code> переносит: шаблон в загрузчик или во вложенную таблицу</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, второй аргумент <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, второй аргумент <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>тип <code>outlet()</code> от <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, что принимает <code>beforeLeave()</code></td></tr>
          <tr><td><code>MatchView</code></td><td>Что такое представление <code>matches()</code>: входные параметры, содержимое или <code>import()</code> выходной страницы</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Слои и защита от ухода",
        content: `
      <p><code>push()</code> открывает маршрут поверх текущего, а не заменяет его, и разрешается с тем, чем этот слой закрывается. Поскольку страницы представляют собой один <code>list()</code> в стеке, открытие слоя представляет собой добавление. Страница внизу не перерисовывается, поэтому ее DOM, ее фокус и наполовину заполненная форма остаются на месте, когда слой закрывается.</p>
      <p>Благодаря этому поток «Мне нужна запись, которая еще не существует» работает без потери формы, которую заполнял пользователь:</p>
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
      <p>Размещение слоев. Диалог, которому нужен собственный диалог, вызывает <code>layer.push()</code> и ожидает его, без ссылки на Route.</p>
      <ul>
        <li><strong> URL-адрес является верхним слоем. </strong> <code>push()</code> добавляет запись истории, поэтому слой можно связать, а Back закрывает его, разрешая его <code>push()</code> как отклоненный, точно так же, как Отмена. Назад и <code>close()</code> представляют собой один путь кода: <code>close()</code> записывает свой результат и возвращает историю назад, а глубина в <code>history.state</code> является авторитетом. Браузеры хранят около 50 записей на вкладке, поэтому после долгого просмотра слоев запись под ней может исчезнуть: тогда <code>close()</code> закрывает слои на месте и перезаписывает текущую запись на оставшуюся страницу.</li>
        <li><strong>Обычная навигация очищает стек. </strong> Щелчок по ссылке или <code>go()</code> не является слоем. Он заменяет все и закрывает каждый открытый слой, поэтому ни один вызывающий абонент не остается в ожидании.</li>
        <li><strong>A холодная загрузка — это отдельная страница. </strong> URL-адрес называет верхний слой, но не стек под ним, поэтому открытие URL-адреса слоя напрямую отображает его на глубине 1 с помощью <code>layer.depth === 0</code> и инертного <code>close()</code>. Продвинутый маршрут должен иметь смысл сам по себе. Ветвь на <code>layer.depth</code>, чтобы предложить ссылку вместо неработающей кнопки «Отмена».</li>
        <li><strong>Промис не может пережить перезагрузку </strong>, поскольку он находится в замыкании. Рассматривайте результат как кратчайший путь к потоку, который работает и в обратном направлении.</li>
        <li><strong> Ничего не осталось в ожидании. </strong> <code>stop()</code> закрывает каждый открытый слой, а слой, оставленный в результате навигации, разрешается с помощью <code>undefined</code>.</li>
      </ul>
      <h3>Оставить охрану</h3>
      <p>Страница, содержащая что-то, что стоит сохранить, например наполовину заполненную форму, регистрирует защиту. Он запрашивается перед удалением страницы, и возврат <code>false</code> (или его обещание) сохраняет страницу:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Только при открытии страницы. </strong> Дочерняя навигация по макету, запрос или изменение хеша, сохраняющие страницу, не запрашиваются. Охранник живет и умирает вместе со своей страницей, поэтому отменять регистрацию нечего.</li>
        <li><strong>Каждый выход.</strong> Ссылка, <code>go()</code>, Назад и вперед, <code>close()</code> слоя и <code>go()</code> на URL-адрес, которым не владеет маршрутизатор (выход из приложения, где <code>to</code> – это <code>null</code>). При отказе «Назад» или «Вперед» выполняется возврат, поэтому адресная строка остается на странице. Закрытие вкладки или перезагрузка — задача <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> — это <code>RouteContext</code>, к которому движется навигация. Охранники первыми бегут внутрь и останавливаются при первом же отказе. Тот, который выбрасывает, сохраняет страницу. <code>close(result)</code> также проходит через защиту, поэтому снимите флажок перед закрытием с результатом.</li>
        <li>Маршрутизатор может просматривать только записанные им записи истории. Команда «Назад» или «Вперед» на ту, которая не была выполнена, например, на собственную ссылку <code>#fragment</code> или ссылку <code>pushState</code> другого скрипта, не запрашивается.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() и вложенные роутеры",
        content: `
      <p><code>router.outlet()</code> отображает страницу. <code>router.matches(table)</code> отображает что-то еще, что зависит от того, где вы находитесь, например боковую панель, хлебные крошки или панель инструментов, из своей маленькой таблицы, без загрузки маршрута или добавления страницы:</p>
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
        <li><strong>То же соответствие, что и в таблице маршрутов. </strong> Шаблоны, приоритет, сопоставление необработанных путей и разделение <code>base</code> являются собственными силами маршрутизатора, поэтому представление и страница всегда согласовывают URL-адрес. Он читает путь верхнего уровня, например <code>router.path</code>.</li>
        <li><strong>A view</strong> — это <code>(params, ctx) =&gt; content</code>, где <code>params</code> набирается по его шаблону, а <code>ctx</code> — это <code>RouteContext</code> с <code>pattern</code> и <code>params</code> представления. Вместо этого он может вернуть <code>import()</code> страничного модуля, который вызывается с помощью <code>ctx</code> после его прибытия.</li>
        <li><strong>Ничего не соответствует, ничего не отображается. </strong> Добавьте представление <code>'*'</code> в качестве запасного варианта. До <code>start()</code> и после <code>stop()</code> пусто, как и розетка.</li>
        <li><strong>Он выполняет повторную визуализацию только при изменении маршрута</strong>, поэтому представление сохраняет свой DOM для всего, что содержит страницу.</li>
        <li><strong>A отложенное представление ничего не отображает, пока не прибудет его модуль. </strong> Неудачный <code>import()</code> регистрируется с помощью <code>console.error</code>, не устанавливает <code>router.error</code> и повторяется при следующей навигации. Обычный <code>update()</code> не повторяет попытку.</li>
        <li><strong> На сервере </strong> ленивый просмотр ничего не доставляет, так как его модуль оказывается на клиенте. Используйте синхронное представление для всего, что должен содержать первый HTML.</li>
      </ul>
      <h3>Субмаршрутизаторы</h3>
      <p>Маршруты вложены, поэтому субмаршрутизатор обычно представляет собой просто вложенную таблицу. Один маршрутизатор: собственная страница <code>'/'</code> раздела является его chrome, а его дочерние элементы отображаются в <code>outlet()</code> этой страницы, поэтому chrome сохраняется при навигации внутри раздела:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Или дайте этой функции собственный маршрутизатор, созданный, но так и не запущенный. Родительский элемент владеет единственной всеобъемлющей записью, а дочерний элемент разрешает хвост по своим собственным шаблонам, параметрам и резервным вариантам:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Никогда не запускать - вот в чем суть. <code>start()</code> — это то, что привязывает слушателей, и два запущенных маршрутизатора конфликтуют. Сделка заключается в том, что разрешение принадлежит ребенку, поэтому загрузчики маршрутов, которые запускает запущенный маршрутизатор, могут быть вызваны вами. Эта форма также перестраивает оболочку при изменении хвоста, поскольку маршрутизатор видит один маршрут, а оставшуюся оболочку разрешает сама. Вложенная таблица — это то, что дает вам родительский маршрутизатор, который остается подключенным, поэтому предпочтите ее, если функция действительно не нуждается в собственном маршрутизаторе, базе и резервном варианте.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Несколько роутеров и общая загрузка",
        content: `
      <p>Приложение может иметь столько маршрутизаторов, сколько у него областей. Правило, которое делает это простым: <strong> запускает ровно один для каждого документа </strong>, и пусть все остальные маршрутизаторы остаются незапущенными, разрешая URL-адреса с помощью <code>match()</code>. Только запущенный маршрутизатор владеет URL-адресом, историей и прослушивателем кликов. Остальное — это таблицы, о которых вы задаете вопросы, и каждая область может загружаться по своим часам со своим счетчиком.</p>
      <h3>Комбинированная погрузка: цепочка погрузчиков</h3>
      <p>Каждая страница в сопоставленной цепочке может экспортировать <code>load()</code>. При холодной навигации к дочернему маршруту загрузчик макета и загрузчик страницы запускают <strong> параллельно </strong>, а один <code>router.pending</code> покрывает всю цепочку: предыдущая страница остается на экране до тех пор, пока пара не разрешится, поэтому наполовину загруженное дерево никогда не рисуется. Каждый компонент получает свой собственный <code>data</code>:</p>
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
      <p>Оба загрузчика запускаются вместе, а не один за другим. <code>router.pending</code> истинно, пока ожидается любой из них, и false в остальное время — предварительно загруженный или активный маршрут никогда не переворачивает его. При перемещении между разделами макет сохраняется, поэтому снова запускается только загрузчик раздела; данные макета, его DOM и наполовину набранный ввод сохраняются. Повторный переход по тому же URL-адресу повторно запускает загрузчик листа и перестраивает его строку точно так же, как и на одной странице.</p>
      <h3>Множественная загрузка: второй роутер со своим спиннером</h3>
      <p>Независимая область — боковая панель, лоток, активная область — получает собственный маршрутизатор, созданный, но никогда не запускавшийся, и собственный флаг загрузки. <code>router.pending</code> принадлежит запущенному маршрутизатору и ничего не говорит об этой области, поэтому оба могут загружаться параллельно, и любой из них может завершить работу первым:</p>
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
      <p>Второй маршрутизатор запрашивается, но никогда не сообщается: <code>match()</code> читает URL-адрес и возвращает контекст, и ничего из боковой панели никогда не попадает в основную таблицу маршрутизации. <code>onNavigate</code> запускается после каждой разрешенной навигации, включая начальную, поэтому это единственное место, которое поддерживает независимую область в соответствии с URL-адресом.</p>
      <ul>
        <li><strong><code>pending</code> принадлежит запущенному маршрутизатору. </strong> Никогда не запускавшийся маршрутизатор не имеет маршрута, <code>pending</code> и <code>error</code>. Область отслеживает свои собственные флаги, а второй спиннер может сидеть рядом с первым. В демо-версии боковая панель загружается 800 мс, а загрузчики маршрута работают 900 мс, поэтому страница может завершиться раньше боковой панели или наоборот.</li>
        <li><strong><code>match()</code> ничего не прикрепляет. </strong> Любое количество незапущенных маршрутизаторов может совместно использовать документ; у каждого есть свой собственный табличный, базовый и модульный кеш, и ни один из них не касается истории. Они стоят стола и спички.</li>
        <li><strong>Его загрузчики никогда не запускаются. </strong> Запущенный маршрутизатор запускает <code>load()</code> страниц, которым он соответствует. Никогда не запускаемый маршрутизатор только разрешает, поэтому, если его представлениям нужны данные, извлеките их самостоятельно — демо-версия <code>refreshSidebar()</code>. Если вам нужны загрузчики, вложенная таблица <a href="#router-matches"></a> или регион <a href="#router-regions">, заполняемый страницей, </a> сохраняет эту работу с запущенным маршрутизатором.</li>
        <li><strong>Защитить устаревшие ответы.</strong> Медленная загрузка боковой панели не должна приходить к разделу, из которого вы перешли. Увеличьте счетчик генерации за каждое обновление и отбросьте ответы, которые больше не совпадают, так же, как сам маршрутизатор удаляет устаревшую навигацию.</li>
        <li><strong>A ленивый вид <code>matches()</code> также не имеет <code>pending</code>. </strong> Он ничего не отображает, пока его модуль не приземлится. Три системы загрузки, три независимых часа: <code>pending</code> маршрута, свои флаги и ленивый вид, которого просто пока нет.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Обработка ссылок",
        content: `
      <p>Делегированный прослушиватель перемещается, щелкнув левой кнопкой мыши по <code>&lt;a href&gt;</code>, включая SVG <code>&lt;a&gt;</code>, и щелкает все, что вложено в него, и отходит в сторону для всего остального: щелчки модификатора и средние щелчки, <code>target</code>, отличный от <code>_self</code>, <code>download</code>, <code>rel="external"</code>, hrefs из разных источников, ссылки только для хеша на текущей странице, пути за пределами <code>base</code>, пути, для которых нет совпадений маршрутов (поэтому обработанный сервером код 404 все еще доступен), а также любое событие, для которого обработчик приложения уже вызвал <code>preventDefault()</code>. Откажитесь от ссылки явно с помощью <code>data-nuclo-router="off"</code>.</p>
      <h3>Прокрутка</h3>
      <p>Нажатая навигация сохраняет текущую позицию прокрутки. Когда новый URL-адрес имеет <code>#hash</code>, соответствующий элементу на странице, этот элемент прокручивается в поле зрения. <code>popstate</code> оставляет прокрутку в браузере. Чтобы разместить новые страницы вверху, сделайте это в <code>onNavigate</code>, в котором указано, как происходила навигация:</p>
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
      <h3>Примечания</h3>
      <ul>
        <li><strong> Ничего не сохраняется. </strong> Маршрут содержит функцию страницы и ее контекст, а не DOM. При переходе от экрана открывается предыдущая страница. <code>stop()</code> освобождает прослушиватели и любую текущую нагрузку, а также очищает <code>pending</code>, поэтому удаленный Route никогда не блокирует счетчик. Модуль, который разрешается после автоматического удаления <code>stop()</code>.</li>
        <li><strong>Concurrency-safe на сервере. </strong> <code>start()</code> возвращает состояние каждого запроса, а <code>run()</code> ограничивает его одним синхронным рендерингом, поэтому чередующиеся запросы не могут видеть маршрут друг друга. Общим является только кэш модуля. Область действия заканчивается, когда функция <code>run()</code> возвращает значение. <code>renderToString()</code> синхронен, так что этого достаточно. Для асинхронного или потокового рендеринга потребуется, чтобы маршрут передавался через <code>await</code>, чего <code>run()</code> не делает.</li>
        <li><strong>Восстановление прокрутки на <code>popstate</code></strong> осуществляется браузером (<code>scrollRestoration</code>), а не роутером.</li>
        <li><strong>Запускайте один маршрутизатор для каждого документа. </strong> Каждый <code>start()</code> добавляет свой собственный делегированный прослушиватель <code>click</code>, а <code>start()</code> второго маршрутизатора не выводит из эксплуатации первый. Только второй <code>start()</code> на том же маршрутизаторе работает. Чтобы разрешить URL-адрес другой таблицы, создайте маршрутизатор и вызовите только <code>match()</code>. Он ничего не прикрепляет. Таким образом, независимая зона может осуществлять собственную погрузку рядом с <code>pending</code> маршрута. См. <a href="#router-multi">Несколько маршрутизаторов &amp; Комбинированная загрузка</a>.</li>
        <li><strong> Не включен по замыслу: </strong> хэш и история памяти, поскольку маршрут находится в пути, и сервер должен обслуживать каждый маршрут; две независимо маршрутизируемые области, управляемые одним URL-адресом, поскольку страница может заполнить несколько регионов <code>into()</code>, но все они принадлежат одному согласованному маршруту — независимая область может по-прежнему сохранять свой собственный незапущенный маршрутизатор и загрузку, как в <a href="#router-multi">Несколько маршрутизаторов &amp; Комбинированная загрузка</a>; и предварительную загрузку при наведении, которую вы получаете, вызывая собственный загрузчик маршрута из <code>mouseenter</code>.</li>
      </ul>
      <h3>Примеры</h3>
      <p>Два работоспособных примера в репозитории дополняют друг друга, поэтому каждый параметр где-то можно наблюдать:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: обзор всего API на стороне клиента. Каждая форма шаблона и правило приоритета, отказ от обработки ссылок, каждый член Route с живыми элементами управления, подмаршрутизатор, стек слоев в три уровня, относительная секция, смонтированная на двух родительских элементах, и загрузчики маршрутов с <code>pending</code> и <code>error</code>. Устанавливает <code>preload: false</code>, чтобы эти состояния оставались видимыми.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> на запрос, гидратация, которая доказуемо запрашивает узлы сервера, настоящие коды состояния 404, <code>base</code> без полномочий root, предварительная загрузка в режиме ожидания, которую можно наблюдать на сетевой панели, и загрузчик, данные которого передаются с сервера на client, поэтому гидратация не обновляется.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Patterns ─────────────────────────────────────────────────────────────
  {
    title: "Приёмы",
    sections: [
      {
        id: "computed",
        title: "Вычисляемые значения",
        content: `
      <p>Nuclo не имеет вычисляемого API. Используйте простую функцию и вызывайте ее из динамических значений:</p>
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
        title: "Асинхронность и загрузка",
        content: `
      <p>Используйте простой <code>async</code>/<code>await</code> и вызывайте <code>update()</code> каждый раз при изменении состояния. Для выборки это означает один раз до <code>await</code> и один раз после:</p>
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
        title: "Рекомендации",
        content: `
      <ul>
        <li><strong>Пакетные изменения.</strong> Измените все необходимые состояния, затем один раз вызовите <code>update()</code>.</li>
        <li><strong> Сохраняйте динамические значения быстрыми и чистыми. </strong> Все они работают на каждом <code>update()</code>.</li>
        <li><strong>Используйте <code>scope()</code></strong> для небольших, частых обновлений, таких как ввод текста или таймеры.</li>
        <li><strong>Визуализация в документ.</strong> Узлы, которых нет в документе при запуске <code>update()</code>, перестают обновляться.</li>
        <li><strong>Используйте <code>when()</code> и <code>list()</code></strong> для дочерних элементов, которые изменяются, а не для функции, возвращающей узлы.</li>
        <li><strong>Используйте <code>className</code>, а не <code>class</code></strong>, и используйте <code>() =&gt; cx(...)</code> или <code>{ className: () =&gt; … }</code> для динамических классов.</li>
        <li><strong>Определите стили один раз</strong> на уровне модуля.</li>
        <li><strong>Серверный рендеринг: сначала рендеринг </strong>, затем поместите <code>getCssText()</code> в <code>&lt;style id="nuclo-styles"&gt;</code>. Передавайте данные запроса в качестве аргументов и сохраняйте комментарии HTML в выходных данных.</li>
      </ul>
    `,
      },
    ],
  },

  // ── Reference ────────────────────────────────────────────────────────────
  {
    title: "Справочник",
    sections: [
      {
        id: "api-index",
        title: "Указатель API",
        content: `
      <p>Каждая публичная функция и ее происхождение.</p>
      <h3><code>nuclo</code> (глобальный и именованный экспорт)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: выполнить все динамические значения или значения в заданных областях.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: укажите идентификаторы области элементов для <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: условное содержимое с <code>.when()</code> и <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: одна строка на элемент, соответствующий идентификатору.</li>
        <li><a href="#api-region"><code>region(options)</code></a> и <a href="#api-region"><code>into(id, ...content)</code></a>: именованное место в дереве и контент, заполняющий его откуда угодно.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: прослушиватель событий, или <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: построить и добавить.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: захватите сервер HTML.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: снова вызовите компоненты и исправьте DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: сгенерированные классы из объекта стиля.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: комбинируйте стили, позже победите.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: тематические <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> и <code>globalStyle</code>.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: стили из опций.</li>
        <li><a href="#api-keyframes"><code>keyframes(frames)</code></a> и <a href="#api-keyframes"><code>globalStyle(selector, style)</code></a>.</li>
      </ul>
      <h3><code>nuclo</code> (только именованный экспорт)</h3>
      <ul>
        <li><a href="#api-css-text"><code>getCssText()</code></a> и <a href="#api-css-text"><code>resetStyles()</code></a>.</li>
      </ul>
      <h3><code>nuclo/ssr</code></h3>
      <ul>
        <li><a href="#api-ssr"><code>renderToString(input)</code></a>, <code>renderManyToString(inputs)</code>, <code>renderToStringWithContainer(input, tag?, attrs?)</code> и <code>getCssText()</code>.</li>
      </ul>
      <h3><code>nuclo/polyfill</code></h3>
      <ul>
        <li><a href="#api-polyfill">A побочный эффект import</a>, а также классы <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> и <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (отдельная упаковка)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: маршрутизатор с <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> и <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: маршрут, загрузчик данных которого начинается рядом с его чанком.</li>
        <li><a href="#router-api">Типы </a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> и другие.</li>
      </ul>
      <h3>Только глобальные версии</h3>
      <ul>
        <li><a href="#tag-builders">175 создателей тегов</a>: <code>div</code>, <code>span</code>, …, <code>var_</code> и <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Типы</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> и другие. Типы стилей, такие как <code>StyleResult</code>, также можно импортировать из <code>'nuclo'</code>.</li>
      </ul>
      <h3>Специальные клавиши</h3>
      <ul>
        <li><a href="#attributes">Атрибуты</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> обработчики </a>, <a href="#lifecycle"><code>onMount</code> и <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Стильные объекты</a>: сокращения, псевдосостояния, селекторы <code>&amp;</code>, правила <code>@</code> и <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Частые вопросы",
        content: `
      <h3>Обновляет ли изменение состояния UI?</h3>
      <p>Нет. DOM остается неизменным до тех пор, пока вы не вызовете <code>update()</code>.</p>

      <h3>Использует ли Nuclo сигналы, прокси или виртуальный DOM?</h3>
      <p>№ Состояние остается неизменным JavaScript. При рендеринге дерева Nuclo создает реальные элементы и текстовые узлы. <code>update()</code> запускает каждое зарегистрированное динамическое значение или значение внутри заданных областей и исправляет те же самые узлы, где значение изменилось. Здесь нет графа зависимостей и виртуального дерева.</p>

      <h3>Почему на моей странице отображается «false»?</h3>
      <p>Логические значения отображаются как текст. <code>div(ok &amp;&amp; span('Done'))</code> показывает «false». Используйте <code>when(() =&gt; ok, span('Done'))</code> для детей и <code>ok ? 'Done' : ''</code> для текста.</p>

      <h3>Почему строка списка не меняется при редактировании элемента?</h3>
      <p>Строки для элементов, которые все еще находятся в списке, сохраняются и не отображаются повторно. Используйте динамические значения, такие как <code>() =&gt; todo.text</code>, для полей, которые изменяются. См. <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Почему часть моего UI перестает обновляться?</h3>
      <p>Обычно его узлы отсутствовали в документе при запуске <code>update()</code>. Nuclo перестает отслеживать эти узлы даже после того, как вы их прикрепите, поэтому визуализируйте их в контейнер, который находится в документе. Две другие причины: <code>when()</code>, условие которого выдает ошибку, прекращает обновление, а текстовая функция, которая выдает ошибку при первом запуске, остается пустой. См. <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Когда следует использовать <code>forceUpdate()</code>?</h3>
      <p>Только для редких изменений статических значений, например переключения языка. Для всего остального используйте <code>update()</code>. См. <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Как поместить страницу в макет, не передавая ее в качестве реквизита?</h3>
      <p>Отметьте это место <code>region({ id: 'main' })</code> и верните страницу <code>into('main', …)</code>. См. <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Как отключить приложение?</h3>
      <p>Заверните его в <code>when()</code> и отключите условие. Самостоятельное удаление DOM не запускает <code>onDestroy</code>. См. <a href="#lifecycle">Жизненный цикл</a>.</p>

      <h3>Включает ли Nuclo маршрутизатор?</h3>
      <p>Нет в основном пакете. Маршрутизация поставляется отдельно как <code>nuclo-router</code> с серверным рендерингом, гидратацией, маршрутами с разделением кода и предварительной загрузкой в ​​режиме ожидания. Установите его с помощью <code>npm install nuclo nuclo-router</code>. См. <a href="#router-overview">nuclo-router</a>.</p>

      <h3>Имеет ли Nuclo эффекты?</h3>
      <p>№ <code>onMount</code> и <code>onDestroy</code> запускаются один раз для каждого элемента, привязанного к вставке и удалению. Ничего не запускается снова, потому что какое-то состояние изменилось.</p>
    `,
      },
    ],
  },

];
