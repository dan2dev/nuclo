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
      <p>Превращает типизированный объект стиля в сгенерированные классы CSS. Передайте результат любой функции построения элементов. В браузере правила объединены в один элемент <code>&lt;style id="nuclo-styles"&gt;</code>. На сервере их возвращает <a href="#api-css-text"><code>getCssText()</code></a>.</p>
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
        <li><code>css()</code> создает один класс для базовых объявлений, а также по одному классу для каждого псевдоключа, селектора и медиа-блока. Карточка выше получает два класса.</li>
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
      <p>Объект, который вы передаете в <code>css()</code>, использует общие свойства CSS в camelCase, набор сокращений и вложенные ключи для псевдосостояний, селекторов и медиа-запросов. Для всех этих свойств доступно автодополнение TypeScript. Свойства вне типизированного набора, такие как <code>borderTopLeftRadius</code>, <code>fill</code> или <code>paddingInline</code>, помещаются в <code>raw</code> (см. ниже).</p>
      <h3>Значения</h3>
      <ul>
        <li>Числа получают единицы <code>px</code>, за исключением <code>0</code> и свойств без единиц измерения: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> и <code>gridRow</code>. В <code>raw</code>, <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> и <code>animation-iteration-count</code> тоже безразмерные.</li>
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
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>внутренние отступы со всех сторон или с отдельной стороны</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>внутренние отступы слева и справа / сверху и снизу</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>то же для внешних отступов</td></tr>
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
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (свойство display не задается)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Псевдосостояния</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> и <code>firstLetter</code>. Их можно вкладывать друг в друга: <code>hover: { focus: {…} }</code> дает <code>:hover:focus</code>.</p>
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
        <li>Два вложенных блока <code>@media</code> объединяются через <code>and</code>. Запрос с медиатипом (<code>print</code>, <code>only screen</code>) ставится первым, поскольку тип разрешен только в начале. Если запросы нельзя объединить из-за двух медиатипов или начального <code>not</code>, выводится предупреждение и используется только внутренний запрос. Любое другое вложенное правило заменяет внешнее.</li>
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
      <p>Сочетает стили. Когда два аргумента устанавливают одно и то же свойство, побеждает последний аргумент.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Ложные значения пропускаются, вложенные массивы разворачиваются, строки разбиваются на имена классов, а дубликаты удаляются.</li>
        <li>Созданные классы для одного и того же блока (базовые объявления, одинаковое псевдосостояние или одинаковый медиазапрос) объединяются в один новый класс. Другие имена классов проходят без изменений.</li>
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
          <tr><td><code>screens</code></td><td>Новые ключи стилей, такие как <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Имя темы разрешается только в том случае, если оно является полным значением. <code>border: "1px solid primary"</code> не подставляет значение токена.</li>
        <li>Значение экрана без <code>@</code> становится <code>@media &lt;value&gt;</code>. Значение, начинающееся с <code>@</code>, используется в том виде, в котором оно записано, например <code>"@container (min-width: 400px)"</code>.</li>
        <li>Экраны существуют только на экземплярах, созданных с помощью <code>createCss()</code>. Глобальный <code>css()</code> не имеет их, но принимает ключи <code>@media</code>.</li>
        <li>Все экземпляры и глобальные вспомогательные функции используют одну таблицу стилей. Медиаправила из screens выводятся в том порядке, в котором экраны объявлены, а не в том порядке, в котором вы их используете, поэтому перечисляйте экраны <code>min-width</code> от меньшего к большему. Используйте один экземпляр <code>createCss()</code> для каждого приложения, чтобы порядок соответствовал вашей теме.</li>
        <li>Поле <code>theme</code> в результате содержит переданную тему.</li>
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
        <li>Стили объединяются в следующем порядке: <code>base</code>, выбранное значение каждой группы, затем каждый подходящий составной вариант. Более поздние стили выигрывают по каждому свойству.</li>
        <li>Отсутствующий параметр <code>undefined</code> или <code>null</code> использует значение по умолчанию. Группа без значения по умолчанию пропускается.</li>
        <li>Группа, содержащая только ключи <code>true</code> и <code>false</code>, принимает логическое значение.</li>
        <li>Составной вариант применяется, когда каждая группа, указанная в нем, совпадает, включая значения по умолчанию.</li>
        <li>Каждое сочетание параметров обрабатывается один раз и кэшируется.</li>
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
        <li>Работают только плоские свойства. Ключи псевдосостояний, экраны и ключи <code>@</code> игнорируются, поэтому <code>globalStyle()</code> не может записывать медиа-правила.</li>
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
        <li>Вызывайте его после <code>renderToString()</code>. Включены правила, созданные во время рендеринга.</li>
        <li>Он охватывает весь процесс, а не одну страницу или запрос, и только растет. Это безопасно, поскольку имена классов представляют собой хеши контента.</li>
        <li>Поместите его в <code>&lt;style id="nuclo-styles"&gt;</code>. Клиент повторно использует этот элемент и пропускает уже содержащиеся в нем правила. С другим идентификатором или без него клиент снова добавляет вторую таблицу стилей со всеми правилами.</li>
        <li>Текст не экранируется, поэтому никогда не вводите ненадежные входные данные в значения стиля.</li>
      </ul>
      <p><code>resetStyles()</code> — вспомогательная функция для тестов. Он удаляет все правила и элемент <code>#nuclo-styles</code>. Созданные ранее стили сохраняют свои имена классов, но теряют свой CSS. Не вызывайте его в приложении или на сервере.</p>
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
      <p>Маршрутизация для Nuclo: серверный рендеринг, гидратация, маршруты с разделением кода и предварительная загрузка в режиме ожидания, построенные на <code>list()</code> и <code>update()</code>. Около ${NUCLO_ROUTER_GZIP_KB} КБ после gzip-сжатия, без каких-либо зависимостей, кроме самого Nuclo, и без побочных эффектов, поэтому, когда он не используется, сборщик удаляет его из неиспользуемого кода (tree shaking).</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Или используйте <code>pnpm add</code>, <code>yarn add</code> или <code>bun add</code> с теми же двумя именами. В качестве peer-зависимости требуется <code>nuclo</code> 0.3 или новее.</p>
      <p>Маршрутизатор решает, <em>что</em> загрузить. Приложение указывает, <em>где</em> отобразить результат, через <code>router.outlet()</code>: один <code>list()</code> для стека слоев, одна строка на слой. Обычная страница занимает одну строку. Сервер и клиент строят одинаковое дерево, поэтому <code>hydrate()</code> использует серверные узлы, а не заменяет их. Все остальное — <code>history</code>, один делегированный обработчик <code>click</code> и <code>requestIdleCallback</code>.</p>
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
      <p>Вот и вся интеграция. Ссылки работают, потому что <code>&lt;a href&gt;</code> — это просто <code>&lt;a href&gt;</code>. Один делегированный обработчик на <code>document</code> перехватывает ссылки, принадлежащие маршрутизатору, и оставляет все остальные ссылки браузеру.</p>
      <p>На сервере <code>start()</code> возвращает <code>Route</code> для каждого запроса и оставляет маршрутизатор в покое, поэтому одновременные запросы не могут видеть маршрут друг друга. <code>route.run()</code> делает этот маршрут маршрутом, который маршрутизатор и, следовательно, outlet считывают на протяжении рендеринга. В браузере существует один маршрут для каждой загрузки страницы, и <code>start()</code> делает его активным маршрутом маршрутизатора. <code>run()</code> не требуется.</p>
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
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td> именно этот путь</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>все, что не совпало с другими маршрутами: ваша страница 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>Сначала проверяются статические маршруты, затем динамические в порядке объявления, затем универсальные с приоритетом самого длинного префикса. Поэтому <code>'*'</code> совпадает только с тем, что не подошло другим маршрутам, и может находиться в любом месте таблицы. Завершающие и повторяющиеся слеши, а также процентное кодирование нормализуются. Значения параметров декодируются. Сопоставление сравнивает сегменты каждого шаблона, не создавая и не выполняя регулярных выражений.</p>
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
        <li>Дочерний маршрут внутри <code>*catch-all</code> вызывает ошибку <code>createRouter()</code>: универсальный параметр должен завершать шаблон.</li>
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
      <p>При переходе между дочерними элементами родительский элемент не перестраивается. Его узел DOM — тот же узел, поэтому его фокус, положение прокрутки, недописанный текст в полях и любое состояние его замыкания — все сохраняется.</p>
      <ul>
        <li>У страницы без дочернего маршрута outlet пуст, поэтому макет может вызывать его без проверки. Если родитель не вызывает <code>outlet()</code>, его дочерний маршрут не отображается.</li>
        <li>Индексных маршрутов нет. <code>'/'</code> — это сам макет, поэтому родительский путь отображает макет с пустым outlet, а не с отдельной индексной страницей внутри него. Поместите целевой контент в макет или дайте ему настоящий дочерний путь.</li>
      </ul>
      <p>Тот же вызов затем работает от любого родителя и от страницы, которая не знает, на какой из них она находится:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> и <code>..</code> разрешаются относительно пути текущего маршрута, а не каталога URL. Для <code>/invoices/42</code> путь <code>./preview</code> означает <code>/invoices/42/preview</code>, хотя браузер получил бы <code>/invoices/preview</code>. Завершающий слеш ничего не меняет. <code>../</code> поднимается на сегмент выше и останавливается в корне. Строка запроса и хеш сохраняются, <code>base</code> добавляется обратно, а в историю попадает абсолютный путь. Такое же отступление от правил разрешения URL использует React Router для <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Только <code>./</code> и <code>../</code> являются относительными по маршруту. Путь <code>preview</code> без префикса в href оставлен обычным правилам браузера.</li>
        <li>Создавайте относительные ссылки с помощью <code>router.href('./preview')</code>, а не записывайте <code>href="./preview"</code> вручную. <code>href()</code> разрешается во время рендеринга, поэтому поставляемая разметка является абсолютной и по-прежнему корректной для сканера, для щелчка средней кнопкой мыши и с отключенным JavaScript.</li>
      </ul>
      <h3>Что сохраняется, а что перестраивается</h3>
      <table>
        <thead><tr><th>Узел</th><th>Навигация</th></tr></thead>
        <tbody>
          <tr><td>родительская страница, шаблон и путь которого не изменились.</td><td><strong>сохраняется</strong>: тот же узел, а его <code>load()</code> не запускается повторно</td></tr>
          <tr><td>соответствующая страница</td><td><strong>сохраняется</strong>, когда ее шаблон и путь не изменились и у нее нет <code>load()</code>, поэтому запрос или изменение хэша сохраняют ее. Маршрут с загрузчиком обновляется при каждом посещении.</td></tr>
          <tr><td>родительский элемент, путь которого изменился</td><td>пересобран вместе со всем, что находится под ним</td></tr>
          <tr><td>добавленный слой</td><td> отображает только соответствующую страницу. Его родители уже установлены в ряду под ним.</td></tr>
        </tbody>
      </table>
      <p>Сохраненная страница хранит <code>ctx</code>, с которым была создана. Значение <code>ctx</code> всегда остается исходным контекстом: текущие значения читайте из <code>router.*</code>. Фильтры, пагинация и вкладки, зависящие от строки запроса, читают <code>router.search</code> внутри динамического значения и меняют URL через <code>router.go('?page=2', { replace: true })</code>. Страница, фокус и недописанный текст сохраняются.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Страницы и регионы",
        content: `
      <p><code>router.outlet()</code> помещает страницу в одно место. Страница, которой также требуется боковая панель, панель инструментов или заголовок в другом месте макета, заполняется <a href="#api-region"><code>into()</code></a>. Макет отмечает это место с помощью <code>region()</code>, а страница возвращает <code>into()</code> рядом со своим собственным содержимым. Макет никогда не получает содержимое страницы в качестве параметра, а навигация никогда не перестраивает его.</p>
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
      <p>Содержимое страницы представляет собой строку <code>list()</code> в outlet, а <code>into()</code> существует до тех пор, пока строка, в которой она содержится. Таким образом, содержимое боковой панели поступает вместе со страницей и удаляется вместе с ней: при переходе на страницу без <code>into('sidebar', …)</code> снова отображается содержимое региона <code>empty</code>. Страница может использовать свои <code>ctx</code> и <code>data</code> для обеих частей, поскольку обе они созданы с помощью одной и той же функции.</p>
      <h3>Что происходит при навигации</h3>
      <ul>
        <li><strong>Сохраненная страница сохраняет содержимое регионов. </strong> Запрос или изменение хеша, которые <a href="#router-patterns"> сохраняет страницу </a>, также не затрагивают содержимое региона. Прочитайте <code>router.search</code> внутри динамического значения, если от него зависит боковая панель.</li>
        <li><strong>Перестроенная страница заполняет регионы заново.</strong> При смене маршрута старая строка удаляется, а представления <code>into()</code> новой страницы занимают ее место. Старое содержимое не остается.</li>
        <li><strong>Добавленный слой добавляет представление.</strong> Он занимает более позднюю строку outlet, поэтому его <code>into()</code> становится новым представлением того же региона. При стандартном <code>type: 'latest'</code> оно скрывает содержимое страницы до закрытия слоя. При <code>type: 'stack'</code> оба представления видны одновременно.</li>
        <li><strong>Родительская страница также может заполнять регионы. </strong> Ее представления остаются, пока изменяются ее дочерние элементы, поскольку родительский элемент не перестраивается.</li>
        <li><strong>Серверный рендерингработает как есть. </strong> Сервер создает страницу внутри <code>route.run()</code>, поэтому его представления <code>into()</code> находятся в HTML, а <code>hydrate()</code> использует существующие узлы.</li>
      </ul>
      <h3>Несколько регионов на одной странице</h3>
      <p>Передайте объект для одновременного заполнения нескольких регионов. Основной контент страницы по-прежнему проходит через outlet, поэтому верните его рядом с <code>into()</code>:</p>
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
      <p>Все эти области относятся к одному совпавшему маршруту. Один URL не управляет двумя независимыми маршрутами: боковую панель заполняет страница, а не второй outlet. Если боковой панели нужны собственные маршрутизатор, загрузка и резервный маршрут, создайте маршрутизатор, но не запускайте его: используйте <code>match()</code>. См. <a href="#router-multi">Несколько маршрутизаторов и общая загрузка</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Загрузчики маршрутов и разделение кода",
        content: `
      <p>Модуль страницы может экспортировать функцию <code>load</code>. Она запускается до создания страницы, при каждом переходе по этому маршруту, и все, что она возвращает, передается на страницу как <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>Таблица маршрутов не изменяется. Загрузчик перемещается вместе со страницей. Он получает соответствующий <code>RouteContext</code>, поэтому доступны <code>params</code>, <code>search</code> и <code>path</code>. Он может быть синхронным или асинхронным, и он также работает на сервере, поэтому страница, отображаемая на сервере, поставляется с данными, уже находящимися в HTML, вместо извлечения после гидратации.</p>
      <p><strong> Модуль кэшируется. Данные — нет. </strong> Фрагмент маршрута извлекается один раз и используется повторно, а его загрузчик запускается снова при каждой навигации. Именно поэтому <code>/blog/a</code> и <code>/blog/b</code> нельзя путать, и почему отказавший загрузчик можно просто перезапустить.</p>
      <table>
        <thead><tr><th>Ситуация</th><th>Поведение</th></tr></thead>
        <tbody>
          <tr><td>пока он работает</td><td><code>router.pending</code> верен, и страница, на которой вы были, остается активной</td></tr>
          <tr><td>загрузчик выбрасывает исключение или возвращает отклоненный промис </td><td> ошибка записывается в <code>router.error</code>. <code>go()</code> по-прежнему никогда не отклоняется, и навигацию можно повторить. </td></tr>
          <tr><td>во время <code>start()</code></td><td> промис <code>start()</code> отклоняется. Объекта Route для записи ошибки пока нет. </td></tr>
          <tr><td>добавленный слой</td><td> запускает собственный загрузчик со своими собственными данными</td></tr>
          <tr><td>предварительная загрузка в режиме ожидания</td><td>загружает только модули: контекста для загрузчика пока нет, а данные могли бы запрашиваться для маршрута, который пользователь никогда не откроет.</td></tr>
          <tr><td>повторный переход на тот же URL-адрес</td><td>, загрузчик запускается снова и строка перестраивается. Маршрут без загрузчика сохраняет строку.</td></tr>
        </tbody>
      </table>
      <p>Для повторной проверки перейдите туда, где вы уже находитесь, не добавляя запись в историю:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Загрузка данных параллельно с чанком</h3>
      <p><code>load</code>, экспортированный модулем страницы, может быть запущен только после прибытия этого модуля, поэтому холодная навигация извлекает фрагмент, а затем данные. Чтобы запустить оба сразу, объявите загрузчик в таблице с <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Этот загрузчик заменяет <code>load</code> модуля страницы и вызывается при каждом переходе. Если он завершится с ошибкой еще до загрузки чанка, ошибка также попадет в <code>router.error</code>.</p>
      <p>Сериализация серверных данных в HTML не предусмотрена. Клиентский <code>load</code> повторно вызывается при гидратации. Если это имеет значение, пусть сервер выдает <code>route.data</code>, например, как <code>window.__DATA__</code>, и загрузчик принимает его первым. <code>route.data</code> — это только данные соответствующей страницы. Результат <code>load()</code> родительской страницы в него не входит.</p>
      <h3>Разделение кода и предварительная загрузка</h3>
      <p>Значением маршрута всегда является функция, возвращающая компонент страницы, поэтому доступ к компоненту происходит лениво:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Экспорт <code>load</code> возможен только для модульных форм. Выбор именованного компонента с помощью <code>.then(m =&gt; m.BPage)</code> передает маршрутизатору только эту функцию.</p>
      <p>Каждый модуль импортируется один раз и кэшируется. Одновременные переходы по одному маршруту используют общий <code>import()</code>. После <code>idleTimeout</code> бездействия (по умолчанию секунда без касаний, клавиш, колесика и прокрутки) остальные маршруты предварительно загружаются в фоне: по одному за свободный период <code>requestIdleCallback</code>. Ввод пользователя или переход с ожиданием приостанавливает предварительную загрузку до следующего периода бездействия.</p>
      <p>Предварительно загруженный или синхронно доступный маршрут не меняет <code>router.pending</code> и отображается до следующей отрисовки: без мигания индикатора и сдвига макета. <code>router.pending</code> имеет значение true только во время ожидания модуля или загрузчика; предыдущая страница остается на экране до завершения загрузки. Ошибка загрузки чанка попадает в <code>router.error</code>, а не в необработанное отклонение промиса. Загрузку можно повторить.</p>
    `,
      },
      {
        id: "router-api",
        title: "API маршрутизатора",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> сопоставляет шаблон загрузчику или вложенной таблице. Опции:</p>
      <table>
        <thead><tr><th>Параметр</th><th>По умолчанию</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL префикс, под которым приложение обслуживается, например <code>'/docs'</code>. Оно совпадает только на границе сегмента: <code>/docs/intro</code> находится внутри <code>'/docs'</code>, <code>/docsearch</code> — нет. URL-адреса за его пределами ничему не соответствуют, поэтому <code>start()</code> отклоняет (ваш серверный код 404), а ссылки на них остаются на усмотрение браузера. </td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Загружайте модули остальных маршрутов в фоновом режиме, когда страница простаивает. <code>false</code> отключает его. </td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Миллисекунды без нажатий, клавиш, колесика или прокрутки перед началом предварительной загрузки или возобновлением после периода активности пользователя.</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code>, вызывается после каждой разрешенной навигации в браузере, включая начальную, после обновления DOM. <code>kind</code> — это <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Назад, Вперед, <code>close()</code>) или <code>'layer'</code>. Хук для <code>document.title</code>, метатегов, фокуса, прокрутки и аналитики. Во время SSR не вызывается.</td></tr>
        </tbody>
      </table>
      <p>Возвращает маршрутизатор с <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> и всеми членами <code>Route</code>, кроме <code>run()</code>. Обращения к членам Route перенаправляются активному маршруту: результату последнего <code>start()</code> в браузере или маршруту, чей <code>run()</code> сейчас выполняется на сервере. Без активного маршрута чтение выбрасывает исключение. Таблица маршрутов, скомпилированный механизм сопоставления и кэш модулей хранятся в маршрутизаторе и используются всеми серверными запросами.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Загружает модули страниц для <code>url</code> (в браузере по умолчанию <code>location.href</code>) и возвращает <code>Promise&lt;Route&gt;</code>. Промис отклоняется, если совпадения нет и в таблице отсутствует <code>'*'</code>; на сервере это повод вернуть 404. В браузере метод делает Route активным, подключает обработчики <code>popstate</code> и делегированный <code>click</code>, планирует предварительную загрузку. Повторный <code>start()</code> останавливает предыдущий Route этого маршрутизатора. На сервере общее состояние не меняется: выполняйте рендеринг внутри <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Сопоставляет URL с таблицей без загрузки модулей, изменения истории, подключения обработчиков и создания Route. Возвращает <code>RouteContext</code> или <code>null</code>, если URL находится вне <code>base</code>, не соответствует шаблону или в браузере указывает на другой origin. Принимает только абсолютные URL: для разрешения <code>./</code> нужен активный маршрут.</p>
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
      <p>Все члены, кроме <code>run()</code>, также находятся на маршрутизаторе, где приложение их считывает.</p>
      <table>
        <thead><tr><th>Член</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>текущее совпадение. <code>search</code> — это <code>URLSearchParams</code>. <code>search</code>, <code>hash</code> и <code>url</code> содержат текущие значения. </td></tr>
          <tr><td><code>pending</code></td><td>навигация ожидает модуль или загрузчик </td></tr>
          <tr><td><code>error</code></td><td>последняя неудачная загрузка, очищается следующей навигацией</td></tr>
          <tr><td><code>data</code></td><td>результат, который вернул <code>load()</code> соответствующей страницы для сериализации на сервере. Данные родительской страницы сюда не входят.</td></tr>
          <tr><td><code>depth</code></td><td>сколько слоев в стеке (1 для обычной страницы)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>переходит по адресу, при необходимости загружая модуль. Промис не отклоняется: ошибки модуля, включая исключения и отклоненные промисы, записываются в <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>открывает маршрут новым верхним слоем. Промис завершается с результатом закрытия слоя. Принимает <code>./</code>. Отклоняется при отсутствии совпадения или ошибке модуля.</td></tr>
          <tr><td><code>href(path)</code></td><td>префикс пути с <code>base</code> для <code>a({ href })</code>. Разрешает <code>./</code> и <code>../</code> для активного маршрута. </td></tr>
          <tr><td><code>stop()</code></td><td>удаляет обработчики, закрывает открытые слои без результата и очищает outlet. Повторный вызов ничего не меняет. Остановленный Route сохраняет последнее совпадение, а <code>go()</code> ничего не делает.</td></tr>
          <tr><td><code>run(fn)</code></td><td>вызывает <code>fn</code>, временно делая этот Route активным для маршрутизатора, и возвращает результат. На сервере: <code>route.run(() =&gt; renderToString(App))</code>. Работает только синхронно; после возврата из <code>fn</code> маршрут перестает быть активным.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Первый аргумент страницы: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. Это контекст, в котором была создана страница. Прочтите <code>router.*</code> для получения текущих значений. Они различаются только в том случае, если запрос или хэш изменились без перестроения.</p>
      <p>По умолчанию <code>params</code> имеет тип <code>{ [name]: string }</code>. Страница может уточнить его по своему шаблону через <code>Params</code>: <code>'/blog/:slug'</code> превращается в <code>{ slug: string }</code>, а <code>'/files/*rest'</code> — в <code>{ rest: string }</code>:</p>
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
          <tr><td><code>layer</code></td><td>место, где страница находится в стеке. См. <code>Layer</code> ниже. </td></tr>
          <tr><td><code>data</code></td><td>результат, который вернул <code>load()</code> маршрута, или <code>undefined</code> без него. Тип задается через <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>место, где родительская страница отображает свой дочерний маршрут. См. <a href="#router-patterns">Вложенные маршруты</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>регистрирует проверку перед удалением страницы. См. <a href="#router-layers">Проверки перед уходом со страницы</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Положение страницы в стеке и способ закрыть ее слой.</p>
      <table>
        <thead><tr><th>Член</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 для базовой страницы, 1 и выше для добавленных слоев</td></tr>
          <tr><td><code>push(href)</code></td><td>открыть еще один слой изнутри страницы, так же, как <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>закройте этот слой и все, что находится над ним, разрешив <code>push()</code>, который его открыл. Без аргумента слой закрывается без результата. На глубине 0 ничего не делает.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> и <code>withLoad()</code></h3>
      <p><code>DataLoader</code> — это <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, дополнительный экспорт <code>load</code> страничного модуля. <code>withLoad(loader, load)</code> создает маршрут, <code>load</code> которого запускается параллельно с импортом чанка, а не после него. См. <a href="#router-loaders">Загрузчики данных маршрутов </a>.</p>
      <h3>Типы</h3>
      <p>Все типы доступны как именованные экспорты <code>nuclo-router</code>: типизируйте страницы, загрузчики и проверки без импорта из внутренних путей.</p>
      <table>
        <thead><tr><th>Тип</th><th>Что это такое</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td> — объект параметров для шаблона. <code>RouteParams</code> — это общая форма без конкретных имен параметров, а <code>Match</code> — результат сопоставления. </td></tr>
          <tr><td><code>PageComponent</code></td><td>страница: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>модуль страницы: сам компонент или <code>{ default, load? }</code>, как результат <code>import()</code> </td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, дополнительно с <code>load</code> от <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>таблица, которую принимает <code>createRouter()</code>: шаблон в загрузчик или во вложенную таблицу</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, второй аргумент <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, второй аргумент <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>тип <code>outlet()</code> от <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, что принимает <code>beforeLeave()</code></td></tr>
          <tr><td><code>MatchView</code></td><td>представление для <code>matches()</code>: принимает параметры и возвращает содержимое или <code>import()</code> модуля страницы</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Слои и проверки перед уходом",
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
      <p>Слои можно вкладывать друг в друга. Диалог, которому нужен еще один диалог, вызывает <code>layer.push()</code> и ожидает результат, не обращаясь к Route.</p>
      <ul>
        <li><strong>URL указывает на верхний слой.</strong> <code>push()</code> добавляет запись в историю: на слой можно сослаться, а кнопка «Назад» закрывает его, завершая <code>push()</code> со значением undefined, как «Отмена». «Назад» и <code>close()</code> используют один механизм: <code>close()</code> сохраняет результат и возвращает историю назад, опираясь на глубину из <code>history.state</code>. Браузеры хранят около 50 записей на вкладку. Если после долгой навигации запись под слоем потеряна, <code>close()</code> закрывает слои на месте и заменяет текущую запись адресом оставшейся страницы.</li>
        <li><strong>Обычная навигация очищает стек. </strong> Щелчок по ссылке или <code>go()</code> не является слоем. Он заменяет все и закрывает каждый открытый слой, поэтому ни один вызывающий код не остается в ожидании.</li>
        <li><strong>Прямая загрузка открывает отдельную страницу.</strong> URL описывает верхний слой, но не стек под ним. Поэтому прямое открытие адреса показывает единственную страницу: глубина стека — 1, <code>layer.depth === 0</code>, а <code>close()</code> ничего не делает. Маршрут должен работать самостоятельно. Проверяйте <code>layer.depth</code>, чтобы предложить ссылку для выхода вместо неработающей кнопки «Отмена».</li>
        <li><strong>Промис не переживает перезагрузку:</strong> он хранится в замыкании. Используйте результат слоя как сокращенный путь в сценарии, который работает и через обычную навигацию.</li>
        <li><strong> Ничего не осталось в ожидании. </strong> <code>stop()</code> закрывает каждый открытый слой, а слой, оставленный в результате навигации, разрешается с помощью <code>undefined</code>.</li>
      </ul>
      <h3>Проверки перед уходом со страницы</h3>
      <p>Страница с данными, которые стоит сохранить, например с незаполненной до конца формой, регистрирует проверку перед уходом. Она вызывается перед удалением страницы. Возврат <code>false</code> или промиса с этим значением отменяет переход и сохраняет страницу:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Только при удалении страницы.</strong> Переход к дочернему маршруту внутри макета или изменение строки запроса либо хеша, сохраняющее страницу, не вызывает проверку. Проверка существует вместе со страницей, поэтому снимать регистрацию вручную не нужно.</li>
        <li><strong>Каждый выход.</strong> Ссылка, <code>go()</code>, Назад и вперед, <code>close()</code> слоя и <code>go()</code> на URL-адрес, которым не владеет маршрутизатор (выход из приложения, где <code>to</code> – это <code>null</code>). При отказе «Назад» или «Вперед» выполняется возврат, поэтому адресная строка остается на странице. Закрытие вкладки или перезагрузка — задача <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> — <code>RouteContext</code> назначения. Проверки выполняются начиная с самой глубокой страницы и останавливаются при первом отказе. Исключение также отменяет переход. <code>close(result)</code> проходит через проверку, поэтому перед закрытием с результатом сбросьте флаг несохраненных изменений.</li>
        <li>Маршрутизатор может просматривать только записанные им записи истории. При переходе «Назад» или «Вперед» к записи, созданной вне маршрутизатора, например обычной ссылкой <code>#fragment</code> или вызовом <code>pushState</code> другого скрипта, проверка не вызывается.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() и вложенные маршрутизаторы",
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
        <li><strong>Те же правила, что у таблицы маршрутов.</strong> Используются те же шаблоны, приоритеты, сопоставление исходного пути и удаление префикса <code>base</code>. Поэтому представление и страница одинаково трактуют URL. Читается путь верхнего слоя, как в <code>router.path</code>.</li>
        <li><strong>Представление</strong> — <code>(params, ctx) =&gt; content</code>. Тип <code>params</code> выводится из шаблона, а <code>ctx</code> — <code>RouteContext</code> с <code>pattern</code> и <code>params</code> представления. Вместо содержимого можно вернуть <code>import()</code> модуля страницы. После загрузки его компонент вызывается с <code>ctx</code>.</li>
        <li><strong>Ничего не соответствует, ничего не отображается. </strong> Добавьте представление <code>'*'</code> в качестве запасного варианта. До <code>start()</code> и после <code>stop()</code> пусто, как и outlet.</li>
        <li><strong>Представление перестраивается только при смене маршрута.</strong> Любой переход, сохраняющий страницу, также сохраняет DOM представления.</li>
        <li><strong>Отложенное представление ничего не отображает, пока не прибудет его модуль. </strong> Неудачный <code>import()</code> регистрируется с помощью <code>console.error</code>, не устанавливает <code>router.error</code> и повторяется при следующей навигации. Обычный <code>update()</code> не повторяет попытку.</li>
        <li><strong>На сервере</strong> отложенное представление ничего не выводит: его модуль загрузится на клиенте. Для содержимого, которое должно присутствовать в исходном HTML, используйте синхронное представление.</li>
      </ul>
      <h3>Вложенные маршрутизаторы</h3>
      <p>Маршруты поддерживают вложенность, поэтому вложенный маршрутизатор обычно заменяет вложенная таблица. Маршрутизатор остается один: страница <code>'/'</code> раздела задает его оболочку, а дочерние маршруты отображаются в ее <code>outlet()</code>. Оболочка сохраняется при переходах внутри раздела:</p>
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
      <p>Главное — не вызывать <code>start()</code>: именно он подключает обработчики, а два запущенных маршрутизатора конфликтуют. В этом варианте дочерний маршрутизатор только сопоставляет URL, поэтому загрузчики данных нужно вызывать самостоятельно. При смене оставшейся части пути оболочка тоже перестраивается: основной маршрутизатор видит один маршрут, а остальное разрешает оболочка. Вложенная таблица сохраняет родительскую страницу смонтированной. Предпочитайте ее, если разделу не нужны отдельные маршрутизатор, base и резервный маршрут.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Несколько маршрутизаторов и общая загрузка",
        content: `
      <p>В приложении может быть несколько маршрутизаторов, по одному на область. Правило простое: <strong>запускайте ровно один на документ</strong>. Остальные только сопоставляют URL через <code>match()</code>. Только запущенный маршрутизатор управляет URL, историей и обработчиком кликов. Независимые области могут загружаться отдельно, каждая со своим индикатором.</p>
      <h3>Общая загрузка: цепочка загрузчиков</h3>
      <p>Каждая страница в сопоставленной цепочке может экспортировать <code>load()</code>. При холодной навигации к дочернему маршруту загрузчик макета и загрузчик страницы запускаются <strong> параллельно </strong>, а один <code>router.pending</code> покрывает всю цепочку: предыдущая страница остается на экране до завершения обоих загрузчиков, поэтому наполовину загруженное дерево никогда не рисуется. Каждый компонент получает свой собственный <code>data</code>:</p>
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
      <p>Оба загрузчика запускаются одновременно. <code>router.pending</code> имеет значение true, пока выполняется хотя бы один из них, и false в остальное время. Предварительно загруженный или синхронно доступный маршрут не меняет этот флаг. При переходе между разделами макет сохраняется, поэтому повторно запускается только загрузчик раздела. Данные макета, его DOM и недописанный текст сохраняются. Повторный переход на тот же URL заново запускает загрузчик конечной страницы и перестраивает ее строку.</p>
      <h3>Множественная загрузка: второй маршрутизатор со своим индикатором загрузки</h3>
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
      <p>Второй маршрутизатор только сопоставляет URL: <code>match()</code> возвращает контекст, а боковая панель не добавляется в основную таблицу маршрутов. <code>onNavigate</code> вызывается после каждого завершенного перехода, включая начальный, и позволяет синхронизировать независимую область с URL.</p>
      <ul>
        <li><strong><code>pending</code> принадлежит запущенному маршрутизатору. </strong> Никогда не запускавшийся маршрутизатор не имеет маршрута, <code>pending</code> и <code>error</code>. Область отслеживает свои собственные флаги, а второй спиннер может сидеть рядом с первым. В демо-версии боковая панель загружается 800 мс, а загрузчики маршрута работают 900 мс, поэтому страница может завершиться раньше боковой панели или наоборот.</li>
        <li><strong><code>match()</code> не подключает обработчики.</strong> Документ может использовать любое число незапущенных маршрутизаторов. У каждого своя таблица, base и кэш модулей, и ни один не меняет историю. Для них нужны только таблица и механизм сопоставления.</li>
        <li><strong>Его загрузчики не запускаются автоматически.</strong> Запущенный маршрутизатор вызывает <code>load()</code> совпавших страниц. Незапущенный лишь сопоставляет URL. Если представлению нужны данные, загружайте их самостоятельно, как в <code>refreshSidebar()</code>. Чтобы поручить загрузку основному маршрутизатору, используйте <a href="#router-matches">вложенную таблицу</a> или <a href="#router-regions">регион, заполняемый страницей</a>.</li>
        <li><strong>Игнорируйте устаревшие ответы.</strong> Медленный ответ для боковой панели не должен применяться после перехода в другой раздел. Увеличивайте счетчик поколения при каждом обновлении и отбрасывайте ответы с прежним значением — так же маршрутизатор отбрасывает результаты устаревших переходов.</li>
        <li><strong>Отложенное представление <code>matches()</code> также не имеет <code>pending</code>. </strong> Оно ничего не отображает, пока не загрузится его модуль. Три системы загрузки, три независимых часа: <code>pending</code> маршрута, свои флаги и ленивый вид, которого просто пока нет.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Обработка ссылок",
        content: `
      <p>Делегированный обработчик перехватывает обычный клик левой кнопкой по <code>&lt;a href&gt;</code>, включая SVG <code>&lt;a&gt;</code> и вложенные элементы. Остальное обрабатывает браузер: клики с клавишами-модификаторами или средней кнопкой, <code>target</code> кроме <code>_self</code>, <code>download</code>, <code>rel="external"</code>, ссылки на другой origin, ссылки только с хешем на текущей странице, пути вне <code>base</code>, пути без совпадения в таблице (чтобы работала серверная страница 404) и события, для которых приложение уже вызвало <code>preventDefault()</code>. Чтобы явно исключить ссылку из обработки, задайте <code>data-nuclo-router="off"</code>.</p>
      <h3>Прокрутка</h3>
      <p>Навигация через push сохраняет текущую позицию прокрутки. Когда новый URL-адрес имеет <code>#hash</code>, соответствующий элементу на странице, этот элемент прокручивается в поле зрения. <code>popstate</code> оставляет прокрутку в браузере. Чтобы разместить новые страницы вверху, сделайте это в <code>onNavigate</code>, в котором указано, как происходила навигация:</p>
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
        <li><strong>DOM не кэшируется.</strong> Route хранит функцию страницы и контекст. При уходе со страницы ее DOM удаляется. <code>stop()</code> освобождает обработчики, отменяет текущую загрузку и сбрасывает <code>pending</code>, поэтому остановленный Route не оставляет индикатор загрузки включенным. Результат модуля, загрузившегося после <code>stop()</code>, игнорируется.</li>
        <li><strong>Изоляция одновременных запросов на сервере. </strong> <code>start()</code> возвращает состояние каждого запроса, а <code>run()</code> ограничивает его одним синхронным рендерингом, поэтому чередующиеся запросы не могут видеть маршрут друг друга. Общим является только кэш модуля. Область действия заканчивается, когда функция <code>run()</code> возвращает значение. <code>renderToString()</code> синхронен, так что этого достаточно. Для асинхронного или потокового рендеринга потребуется, чтобы маршрут передавался через <code>await</code>, чего <code>run()</code> не делает.</li>
        <li><strong>Восстановление прокрутки на <code>popstate</code></strong> осуществляется браузером (<code>scrollRestoration</code>), а не маршрутизатором.</li>
        <li><strong>Запускайте один маршрутизатор на документ.</strong> Каждый <code>start()</code> подключает свой делегированный обработчик <code>click</code>. Вызов <code>start()</code> второго маршрутизатора не останавливает первый; повторный <code>start()</code> заменяет Route только в том же маршрутизаторе. Чтобы сопоставить URL с другой таблицей, создайте отдельный маршрутизатор и вызывайте только <code>match()</code>. Он не подключает обработчики, поэтому независимая область может загружаться отдельно от <code>pending</code> основного маршрута. См. <a href="#router-multi">Несколько маршрутизаторов и общая загрузка</a>.</li>
        <li><strong>Намеренно не поддерживаются:</strong> hash- и memory-history — маршрут задается путем URL, и сервер должен обслуживать каждый путь; две независимые области маршрутизации под одним URL — страница может заполнять несколько регионов через <code>into()</code>, но все они принадлежат одному совпавшему маршруту. Независимая область может иметь свой незапущенный маршрутизатор и загрузку, как в разделе <a href="#router-multi">Несколько маршрутизаторов и общая загрузка</a>. Предварительная загрузка по наведению также не встроена: вызывайте загрузчик маршрута из <code>mouseenter</code>.</li>
      </ul>
      <h3>Примеры</h3>
      <p>Два работоспособных примера в репозитории дополняют друг друга, поэтому каждый параметр где-то можно наблюдать:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: обзор всего API на стороне клиента. Каждая форма шаблона и правило приоритета, отказ от обработки ссылок, каждый член Route с живыми элементами управления, подмаршрутизатор, стек слоев в три уровня, относительная секция, смонтированная на двух родительских элементах, и загрузчики маршрутов с <code>pending</code> и <code>error</code>. Устанавливает <code>preload: false</code>, чтобы эти состояния оставались видимыми.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> на запрос, гидратация с проверкой повторного использования серверных узлов, настоящие коды состояния 404, <code>base</code> отличный от корневого пути, предварительная загрузка в режиме ожидания, которую можно наблюдать на сетевой панели, и загрузчик, данные которого передаются с сервера на клиент, поэтому при гидратации данные не запрашиваются повторно.</li>
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
      <p>В Nuclo нет специального API для вычисляемых значений. Используйте простую функцию и вызывайте ее из динамических значений:</p>
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
      <p>Используйте простой <code>async</code>/<code>await</code> и вызывайте <code>update()</code> каждый раз при изменении состояния. При загрузке данных это означает один раз до <code>await</code> и один раз после:</p>
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
        <li><strong> Функции динамических значений должны быть быстрыми и без побочных эффектов. </strong> Все они работают на каждом <code>update()</code>.</li>
        <li><strong>Используйте <code>scope()</code></strong> для небольших, частых обновлений, таких как ввод текста или таймеры.</li>
        <li><strong>Рендеринг в документ.</strong> Узлы, которых нет в документе при запуске <code>update()</code>, перестают обновляться.</li>
        <li><strong>Используйте <code>when()</code> и <code>list()</code></strong> для изменяющихся дочерних узлов вместо функции, возвращающей узлы.</li>
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
      <p>Все публичные функции и точки входа, из которых они доступны.</p>
      <h3><code>nuclo</code> (глобальный и именованный экспорт)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: выполнить все динамические значения или значения в заданных областях.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: укажите идентификаторы области элементов для <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: условное содержимое с <code>.when()</code> и <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: одна строка на элемент с сопоставлением по идентичности.</li>
        <li><a href="#api-region"><code>region(options)</code></a> и <a href="#api-region"><code>into(id, ...content)</code></a>: именованное место в дереве и контент, заполняющий его откуда угодно.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: обработчик событий, или <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: построить и добавить.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: подключить интерактивность к серверному HTML.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: снова вызовите компоненты и обновите DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: сгенерированные классы из объекта стиля.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: комбинируйте стили, приоритет у последних аргументов.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: привязанные к теме <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> и <code>globalStyle</code>.</li>
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
        <li><a href="#api-polyfill">Импорт для побочных эффектов</a>, а также классы <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> и <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (отдельный пакет)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: маршрутизатор с <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> и <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: маршрут, загрузчик данных которого запускается параллельно с импортом чанка.</li>
        <li><a href="#router-api">Типы </a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> и другие.</li>
      </ul>
      <h3>Только глобальные версии</h3>
      <ul>
        <li><a href="#tag-builders">175 функций построения элементов</a>: <code>div</code>, <code>span</code>, …, <code>var_</code> и <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Типы</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> и другие. Типы стилей, такие как <code>StyleResult</code>, также можно импортировать из <code>'nuclo'</code>.</li>
      </ul>
      <h3>Специальные ключи</h3>
      <ul>
        <li><a href="#attributes">Атрибуты</a>: <code>className</code>, <code>style</code>, <a href="#events"><code>on*</code> обработчики </a>, <a href="#lifecycle"><code>onMount</code> и <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Объекты стилей</a>: сокращения, псевдосостояния, селекторы <code>&amp;</code>, правила <code>@</code> и <code>raw</code>.</li>
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
      <p>Нет. Состояние остается обычными изменяемыми данными JavaScript. При рендеринге дерева Nuclo создает реальные элементы и текстовые узлы. <code>update()</code> запускает каждое зарегистрированное динамическое значение или значение внутри заданных областей и обновляет те же узлы, значения которых изменились. Здесь нет графа зависимостей и виртуального дерева.</p>

      <h3>Почему на моей странице отображается «false»?</h3>
      <p>Логические значения отображаются как текст. <code>div(ok &amp;&amp; span('Done'))</code> показывает «false». Используйте <code>when(() =&gt; ok, span('Done'))</code> для дочерних узлов и <code>ok ? 'Done' : ''</code> для текста.</p>

      <h3>Почему строка списка не меняется при редактировании элемента?</h3>
      <p>Строки для элементов, которые все еще находятся в списке, сохраняются и не отображаются повторно. Используйте динамические значения, такие как <code>() =&gt; todo.text</code>, для полей, которые изменяются. См. <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Почему часть моего UI перестает обновляться?</h3>
      <p>Обычно его узлы отсутствовали в документе при запуске <code>update()</code>. Nuclo перестает отслеживать эти узлы даже после того, как вы их прикрепите, поэтому визуализируйте их в контейнер, который находится в документе. Две другие причины: <code>when()</code>, условие которого выдает ошибку, прекращает обновление, а текстовая функция, которая выдает ошибку при первом запуске, остается пустой. См. <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Когда следует использовать <code>forceUpdate()</code>?</h3>
      <p>Только для редких изменений статических значений, например переключения языка. Для всего остального используйте <code>update()</code>. См. <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Как поместить страницу в макет, не передавая ее в качестве параметра?</h3>
      <p>Отметьте это место <code>region({ id: 'main' })</code> и возвращайте со страницы <code>into('main', …)</code>. См. <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Как отключить приложение?</h3>
      <p>Заверните его в <code>when()</code> и отключите условие. Самостоятельное удаление DOM не запускает <code>onDestroy</code>. См. <a href="#lifecycle">Жизненный цикл</a>.</p>

      <h3>Включает ли Nuclo маршрутизатор?</h3>
      <p>В основном пакете его нет. Маршрутизация поставляется отдельно в <code>nuclo-router</code>: серверный рендеринг, гидратация, разделение кода и предварительная загрузка в периоды бездействия. Установите пакет командой <code>npm install nuclo nuclo-router</code>. См. <a href="#router-overview">nuclo-router</a>.</p>

      <h3>Имеет ли Nuclo эффекты?</h3>
      <p>Нет. <code>onMount</code> и <code>onDestroy</code> вызываются один раз для каждого элемента при вставке и удалении. Изменение состояния не запускает их повторно.</p>
    `,
      },
    ],
  },

];
