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
      <p>Берёт типизированный объект стилей и превращает его в CSS-классы. Результат можно отдать любому билдеру элементов. В браузере все правила складываются в один элемент <code>&lt;style id="nuclo-styles"&gt;</code>, а на сервере их забирает <a href="#api-css-text"><code>getCssText()</code></a>.</p>
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
        <li><code>css()</code> делает один класс под базовые объявления и ещё по одному на каждое псевдосостояние, селектор и медиа-блок. Карточка выше получит два класса.</li>
        <li>Имена классов — хеши от содержимого. Одинаковые стили дают один и тот же класс, а сервер и клиент генерируют одни и те же имена.</li>
        <li>Объявляйте стили один раз, на уровне модуля. <code>css()</code> кеширует результат по объекту, так что новый объект на каждый вызов обрабатывается заново.</li>
        <li>Мутировать объект стилей после передачи в <code>css()</code> бессмысленно: изменения ни на что не повлияют.</li>
        <li>Каждый стиль остаётся в реестре, пока жива страница или серверный процесс. Если значение у каждого элемента своё (скажем, ширина из данных), берите атрибут <a href="#attributes"><code>style</code></a>.</li>
      </ul>
      <h3>Именованные стили</h3>
      <p>Передайте имя первым аргументом — и класс получит человекочитаемое имя:</p>
      ${code("title.ts", `
const pageTitle = css('page-title', { text: 24, hover: { color: 'red' } })

pageTitle.className // "page-title page-title-<hash>"
`)}
      <ul>
        <li>Базовый класс совпадает с именем один в один, остальные блоки получают <code>name-&lt;hash&gt;</code>.</li>
        <li>Имя должно быть валидным именем класса. Если нет, Nuclo предупредит в консоли и придумает имя сам.</li>
        <li>Имена глобальные: если два разных стиля назвать одинаково, Nuclo тоже предупредит.</li>
      </ul>
      <h3>Как использовать результат</h3>
      ${code("example.ts", `
const card = css({ p: 8 })

div(card)                           // best
div(card, { className: 'featured' }) // className merges
div(card, { class: 'featured' })     // replaces: only "featured" is left
`)}
      <p>И <code>String(card)</code>, и <code>card.className</code> вернут имена классов.</p>
    `,
      },
      {
        id: "style-objects",
        title: "Объекты стилей",
        content: `
      <p>Объект, который уходит в <code>css()</code>, собирается из привычных CSS-свойств в camelCase, набора коротких алиасов и вложенных ключей для псевдосостояний, селекторов и медиа-запросов. TypeScript подсказывает всё это автодополнением. Свойства за пределами типизированного набора — например <code>borderTopLeftRadius</code>, <code>fill</code> или <code>paddingInline</code> — кладите в <code>raw</code> (о нём ниже).</p>
      <h3>Значения</h3>
      <ul>
        <li>Число превращается в <code>px</code>, кроме <code>0</code> и безразмерных свойств: <code>zIndex</code>, <code>opacity</code>, <code>fontWeight</code>, <code>lineHeight</code>, <code>flex</code>, <code>flexGrow</code>, <code>flexShrink</code>, <code>order</code>, <code>aspectRatio</code>, <code>gridColumn</code> и <code>gridRow</code>. А в <code>raw</code> безразмерными считаются ещё <code>zoom</code>, <code>scale</code>, <code>column-count</code>, <code>orphans</code>, <code>widows</code>, <code>tab-size</code> и <code>animation-iteration-count</code>.</li>
        <li>Строки уходят в CSS как есть, а <code>null</code>, <code>undefined</code> и <code>false</code> просто пропускаются.</li>
        <li>У <code>lineHeight</code> (и <code>leading</code>) нет единиц, поэтому <code>leading: 24</code> значит «24 размера шрифта». Нужны пиксели — пишите <code>"24px"</code>.</li>
      </ul>
      ${code("example.ts", `
css({ p: 16, m: 0, opacity: 0.5, leading: 1.5, z: 10, w: '50%' })
// padding:16px; margin:0; opacity:0.5; line-height:1.5; z-index:10; width:50%
`)}
      <h3>Алиасы</h3>
      <table>
        <thead><tr><th>Ключ</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>p</code>, <code>pt</code>, <code>pr</code>, <code>pb</code>, <code>pl</code></td><td>padding: со всех сторон или с одной</td></tr>
          <tr><td><code>px</code> / <code>py</code></td><td>padding по горизонтали / по вертикали</td></tr>
          <tr><td><code>m</code>, <code>mt</code>, <code>mr</code>, <code>mb</code>, <code>ml</code>, <code>mx</code>, <code>my</code></td><td>то же самое для margin</td></tr>
          <tr><td><code>w</code>, <code>h</code>, <code>minW</code>, <code>maxW</code>, <code>minH</code>, <code>maxH</code></td><td>ширина, высота и их min/max</td></tr>
          <tr><td><code>size</code></td><td>ширина и высота разом</td></tr>
          <tr><td><code>bg</code></td><td>фон</td></tr>
          <tr><td><code>text</code> / <code>font</code> / <code>weight</code></td><td>font-size / font-family / font-weight</td></tr>
          <tr><td><code>leading</code> / <code>tracking</code></td><td>line-height / letter-spacing</td></tr>
          <tr><td><code>align</code> / <code>items</code> / <code>justify</code></td><td>text-align / align-items / justify-content</td></tr>
          <tr><td><code>z</code> / <code>rounded</code> / <code>shadow</code> / <code>select</code></td><td>z-index / border-radius / box-shadow / user-select</td></tr>
        </tbody>
      </table>
      <p>А эти ключи принимают <code>true</code>:</p>
      <table>
        <thead><tr><th>Ключ</th><th>CSS</th></tr></thead>
        <tbody>
          <tr><td><code>row</code></td><td>display: flex; flex-direction: row</td></tr>
          <tr><td><code>col</code></td><td>display: flex; flex-direction: column</td></tr>
          <tr><td><code>center</code></td><td>align-items: center; justify-content: center (display не трогает)</td></tr>
          <tr><td><code>truncate</code></td><td>overflow: hidden; text-overflow: ellipsis; white-space: nowrap</td></tr>
        </tbody>
      </table>
      <h3>Псевдосостояния</h3>
      <p><code>hover</code>, <code>focus</code>, <code>focusVisible</code>, <code>focusWithin</code>, <code>active</code>, <code>visited</code>, <code>disabled</code>, <code>enabled</code>, <code>checked</code>, <code>required</code>, <code>invalid</code>, <code>valid</code>, <code>readOnly</code>, <code>first</code> (<code>:first-child</code>), <code>last</code> (<code>:last-child</code>), <code>only</code> (<code>:only-child</code>), <code>odd</code>, <code>even</code>, <code>empty</code>, <code>placeholderShown</code>, <code>placeholder</code>, <code>before</code>, <code>after</code>, <code>selection</code>, <code>marker</code>, <code>firstLine</code> и <code>firstLetter</code>. Они вкладываются друг в друга: <code>hover: { focus: {…} }</code> превратится в <code>:hover:focus</code>.</p>
      <h3>Селекторы и правила</h3>
      <p>Ключ, начинающийся с <code>&amp;</code>, — селектор, и каждый <code>&amp;</code> заменяется на класс. Ключ, начинающийся с <code>@</code>, — at-правило: <code>@media</code>, <code>@container</code> или <code>@supports</code>.</p>
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
        <li>Ключ обязан начинаться с <code>&amp;</code>. Что-то вроде <code>".dark &amp;"</code> будет проигнорировано — пишите <code>"&amp;:is(.dark *)"</code>.</li>
        <li>Два вложенных <code>@media</code> склеиваются через <code>and</code>. Запрос с медиатипом (<code>print</code>, <code>only screen</code>) встаёт первым: грамматика допускает тип только в начале. Если запросы не сплющить (два медиатипа или ведущий <code>not</code>), Nuclo предупредит и оставит только внутренний. Любое другое вложенное at-правило просто заменяет внешнее.</li>
      </ul>
      <h3><code>raw</code></h3>
      <p>В <code>raw</code> можно положить любое свойство — с тем же именем, что и в CSS. Числам там по-прежнему дописывается <code>px</code>, так что передавайте строки:</p>
      ${code("example.ts", `
css({ raw: { '--gap': '8px', '-webkit-line-clamp': '2' } })
`)}
      <p>Любой другой плоский ключ переводится в kebab-case и пишется как есть, поэтому опечатка вроде <code>colr: 'red'</code> превратится в объявление, которое браузер молча выбросит. Вложенный объект под ключом, который не псевдосостояние, не экран и не ключ с <code>&amp;</code> или <code>@</code>, игнорируется. В обоих случаях TypeScript подсветит ошибку.</p>
    `,
      },
      {
        id: "api-cx",
        title: "cx()",
        content: `
      <p>Склеивает стили. Если два аргумента задают одно и то же свойство, выигрывает последний.</p>
      ${code("example.ts", `
const base = css({ p: 8, color: 'red' })
const blue = css({ color: 'blue' })

cx(base, blue)                  // padding: 8px; color: blue
cx(base, false, null, 'extra')  // base's classes plus "extra"
div(cx(base, blue), 'Blue text')
`)}
      <ul>
        <li>Ложные значения отбрасываются, вложенные массивы разворачиваются, строки режутся на имена классов, дубли убираются.</li>
        <li>Сгенерированные классы одного блока (базовые объявления, то же псевдосостояние, тот же медиазапрос) сливаются в один новый класс. Остальные имена проходят насквозь без изменений.</li>
        <li>Порядок аргументов известен только <code>cx()</code>. В <code>div(base, blue)</code> просто навесятся оба класса, и выиграет правило, созданное позже. Если стили должны перебивать друг друга, собирайте их в одном вызове <code>cx()</code>.</li>
        <li>Если блок именованного стиля сливается с блоком другого аргумента, итоговый класс будет <code>name-&lt;hash&gt;</code>, а не голое имя. Блоки, которым сливаться не с чем, сохраняют свой класс, поэтому у <code>cx(pageTitle, 'extra')</code> <code>page-title</code> остаётся.</li>
      </ul>
      <h3>Динамические классы</h3>
      <p>Передайте функцию, которая каждый раз возвращает <code>cx(...)</code>:</p>
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
      <p>Уже при первом вызове функция обязана вернуть результат стиля. Запись <code>() =&gt; active &amp;&amp; activeButton</code> выведет на страницу текст «false» вместо класса.</p>
    `,
      },
      {
        id: "api-create-css",
        title: "createCss()",
        content: `
      <p>Возвращает собственные <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> и <code>globalStyle</code>, привязанные к теме. Тема даёт значениям имена: с темой ниже <code>borderColor: 'border'</code> запишет <code>#e5e7eb</code>, а TypeScript подскажет эти имена в автодополнении. Каждая запись в <code>screens</code> становится ключом стилей для медиа-запроса — например, <code>md: {…}</code>.</p>
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
        <thead><tr><th>Ключ темы</th><th>Где используется</th></tr></thead>
        <tbody>
          <tr><td><code>colors</code></td><td><code>bg</code>, <code>backgroundColor</code>, <code>color</code>, <code>borderColor</code> (в том числе для отдельных сторон), <code>outlineColor</code>, <code>caretColor</code>, <code>textDecorationColor</code></td></tr>
          <tr><td><code>fonts</code></td><td><code>font</code>, <code>fontFamily</code></td></tr>
          <tr><td><code>shadows</code></td><td><code>shadow</code>, <code>boxShadow</code></td></tr>
          <tr><td><code>radii</code></td><td><code>rounded</code>, <code>borderRadius</code></td></tr>
          <tr><td><code>screens</code></td><td>новые ключи стилей, вроде <code>md: {…}</code></td></tr>
        </tbody>
      </table>
      <ul>
        <li>Имя из темы подставляется, только когда оно — значение целиком. В <code>border: "1px solid primary"</code> токен не заменится.</li>
        <li>Значение экрана без <code>@</code> превращается в <code>@media &lt;value&gt;</code>. Если значение начинается с <code>@</code>, оно берётся как есть, например <code>"@container (min-width: 400px)"</code>.</li>
        <li>Экраны бывают только у экземпляров из <code>createCss()</code>. У глобального <code>css()</code> их нет, зато ключи <code>@media</code> он принимает.</li>
        <li>Все экземпляры и глобальные функции пишут в одну общую таблицу стилей. Медиаправила из <code>screens</code> выводятся в порядке объявления экранов, а не использования, поэтому экраны с <code>min-width</code> перечисляйте от меньшего к большему. Заводите один экземпляр <code>createCss()</code> на приложение — тогда порядок будет именно тем, что задан в теме.</li>
        <li>В поле <code>theme</code> результата лежит та самая тема, которую вы передали.</li>
      </ul>
    `,
      },
      {
        id: "api-variants",
        title: "variants()",
        content: `
      <p>Собирает функцию, которая по набору опций (допустим, назначение и размер кнопки) выдаёт нужный стиль.</p>
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
        <li>Стили накладываются в таком порядке: <code>base</code>, выбранное значение каждой группы, затем каждый подходящий составной вариант. По каждому свойству выигрывает тот, что позже.</li>
        <li>Если опция не передана или равна <code>undefined</code> либо <code>null</code>, берётся значение по умолчанию. Группа без дефолта пропускается.</li>
        <li>Группа с одними только ключами <code>true</code> и <code>false</code> принимает булево значение.</li>
        <li>Составной вариант срабатывает, когда совпали все перечисленные в нём группы (значения по умолчанию тоже учитываются).</li>
        <li>Каждая комбинация опций собирается один раз и кешируется.</li>
      </ul>
    `,
      },
      {
        id: "api-keyframes",
        title: "keyframes() и globalStyle()",
        content: `
      <p><code>keyframes()</code> регистрирует анимацию и возвращает сгенерированное имя. Ключи кадров — <code>from</code>, <code>to</code> и проценты вроде <code>"50%"</code> или <code>"0%, 100%"</code>. В кадрах разрешены только плоские свойства. Одинаковые кадры дают одно и то же имя.</p>
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
        <li>Селектор используется в точности так, как вы его написали.</li>
        <li>Работают только плоские свойства. Ключи псевдосостояний, экраны и ключи с <code>@</code> игнорируются, так что медиа-правила через <code>globalStyle()</code> не напишешь.</li>
        <li>Одно и то же правило добавляется один раз. Другой стиль для того же селектора добавит второе правило, и победит более позднее.</li>
      </ul>
    `,
      },
      {
        id: "api-css-text",
        title: "getCssText() и resetStyles()",
        content: `
      <p><code>getCssText()</code> возвращает все правила, которые в этом процессе успели создать <code>css()</code>, <code>cx()</code>, <code>variants()</code>, <code>keyframes()</code> и <code>globalStyle()</code>: сначала базовые, затем блоки <code>@media</code>, <code>@container</code> и <code>@supports</code>. Пригодится для серверного рендера.</p>
      <ul>
        <li>Вызывайте его после <code>renderToString()</code> — тогда в результат попадут и правила, созданные по ходу рендера.</li>
        <li>Он смотрит на весь процесс, а не на одну страницу или запрос, и только растёт. Это безопасно: имена классов — хеши содержимого.</li>
        <li>Положите результат в <code>&lt;style id="nuclo-styles"&gt;</code>. Клиент подхватит этот элемент и пропустит правила, которые в нём уже есть. С другим id (или вообще без него) клиент заведёт вторую таблицу стилей и продублирует все правила.</li>
        <li>Текст не экранируется, поэтому не подставляйте в значения стилей непроверенный пользовательский ввод.</li>
      </ul>
      <p><code>resetStyles()</code> — хелпер для тестов. Он удаляет все правила и элемент <code>#nuclo-styles</code>. Ранее созданные стили сохраняют имена классов, но остаются без CSS. В приложении и на сервере его вызывать не нужно.</p>
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
      <div class="docs-callout"><strong>Отдельный пакет:</strong> <code>nuclo-router</code> не входит в ядро Nuclo, его ставят рядом с <code>nuclo</code>. Пока это preview-релиз, так что API ещё может поменяться.</div>
      <p>Роутер для Nuclo: серверный рендер, hydration, маршруты с code splitting и предзагрузка в моменты простоя — и всё это поверх <code>list()</code> и <code>update()</code>. Весит около ${NUCLO_ROUTER_GZIP_KB} КБ в gzip, ничего не тянет за собой, кроме самого Nuclo, и не оставляет побочных эффектов, так что неиспользуемый роутер сборщик спокойно вырежет tree shaking'ом.</p>
      ${sh("npm install nuclo nuclo-router")}
      <p>Подойдут и <code>pnpm add</code>, <code>yarn add</code>, <code>bun add</code> с теми же двумя именами. В качестве peer-зависимости нужен <code>nuclo</code> версии 0.3 или новее.</p>
      <p>Роутер решает, <em>что</em> загрузить, а приложение через <code>router.outlet()</code> указывает, <em>куда</em> это положить. Outlet — один <code>list()</code> поверх стека слоёв, по строке на слой, так что обычная страница занимает ровно одну строку. Сервер и клиент строят одно и то же дерево, поэтому <code>hydrate()</code> забирает серверные узлы, а не пересоздаёт их. Всё остальное — это <code>history</code>, один делегированный обработчик <code>click</code> и <code>requestIdleCallback</code>.</p>
      <h3>Один импорт</h3>
      ${code("main.ts", `
export const router = createRouter(routes)   // define once, import anywhere
await router.start()                          // resolve the current URL
render(App, document.getElementById('app')!) // App places router.outlet() and reads router.path, router.go(), …
`)}
      <p><code>start()</code> до возврата подгружает модули подходящего маршрута, поэтому первое дерево получается полным и на сервере, и на клиенте. Дальше роутер просто проксирует обращения к запущенному маршруту: <code>router.path</code>, <code>router.pending</code>, <code>router.go()</code>.</p>
      <h3>Приложение целиком</h3>
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
      <p>На этом интеграция закончена. Ссылки работают, потому что <code>&lt;a href&gt;</code> — это самый обычный <code>&lt;a href&gt;</code>: один делегированный обработчик на <code>document</code> перехватывает ссылки роутера, а все остальные оставляет браузеру.</p>
      <p>На сервере <code>start()</code> возвращает отдельный <code>Route</code> на каждый запрос и сам роутер не трогает, поэтому параллельные запросы не видят маршрутов друг друга. <code>route.run()</code> на время рендера делает этот маршрут тем, который читают роутер и outlet. В браузере на одну загрузку страницы приходится один маршрут, и <code>start()</code> сразу делает его активным, так что <code>run()</code> там не нужен.</p>
      <p>Страница получает <a href="#router-api"><code>RouteContext</code></a> и <a href="#router-api"><code>PageProps</code></a> в виде <code>(ctx, { layer, data, outlet, beforeLeave })</code>, и аргументов можно брать меньше. Вернуть из неё можно всё, что понимает <code>list()</code>. Хотите заполнить ещё и другой кусок макета — верните <code>into()</code> прямо из страницы, например <code>div(article(…), into('sidebar', nav(…)))</code>: этот контент уйдёт вместе со страницей. Подробности в <a href="#router-regions">Страницы и регионы</a>.</p>
    `,
      },
      {
        id: "router-patterns",
        title: "Шаблоны и вложенные маршруты",
        content: `
      <table>
        <thead><tr><th>Шаблон</th><th>Совпадения</th><th><code>params</code></th></tr></thead>
        <tbody>
          <tr><td><code>/</code>, <code>/docs/intro</code></td><td>ровно этот путь</td><td><code>{}</code></td></tr>
          <tr><td><code>/blog/:slug</code></td><td><code>/blog/hello</code></td><td><code>{ slug: 'hello' }</code></td></tr>
          <tr><td><code>/u/:id/edit</code></td><td><code>/u/7/edit</code></td><td><code>{ id: '7' }</code></td></tr>
          <tr><td><code>/files/*rest</code></td><td><code>/files/a/b.txt</code></td><td><code>{ rest: 'a/b.txt' }</code></td></tr>
          <tr><td><code>*</code></td><td>всё, что не подошло остальным маршрутам: ваша страница 404</td><td><code>{ '*': '…' }</code></td></tr>
        </tbody>
      </table>
      <p>Сначала проверяются статические маршруты, затем динамические — в порядке объявления, затем универсальные, где выигрывает самый длинный префикс. Поэтому <code>'*'</code> срабатывает только на то, что не подошло остальным, и в таблице его можно писать где угодно. Завершающие и повторяющиеся слеши, как и процентное кодирование, нормализуются, а значения параметров декодируются. Сопоставление идёт по сегментам шаблона, без регулярных выражений.</p>
      <h3>Относительные маршруты</h3>
      <p>Шаблон с <code>./</code> отсчитывается от родителя, который его объявил, а href с <code>./</code> — от активного маршрута. Вместе они позволяют сделать переиспользуемый раздел, который под любым родителем означает одно и то же. Значение в таблице — либо загрузчик, либо другая таблица, чьи ключи отсчитываются уже от неё:</p>
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
      <p>Эти две строки разворачиваются в шесть шаблонов, и путь не приходится писать дважды. Оба родителя получают одни и те же объекты-загрузчики, так что кеш модулей и <code>import()</code> у них общие.</p>
      <ul>
        <li>Внутри дочерней таблицы <code>'./x'</code>, <code>'/x'</code> и <code>'x'</code> — одно и то же, <code>'/'</code> — сам родительский путь, а <code>'*rest'</code> даёт разделу собственный универсальный маршрут. Глубина вложенности не ограничена.</li>
        <li>Ключи верхнего уровня берутся как написаны, так что <code>'*'</code> остаётся <code>'*'</code>.</li>
        <li>Дочерний маршрут внутри <code>*catch-all</code> приведёт к ошибке в <code>createRouter()</code>: универсальный параметр должен стоять в самом конце шаблона.</li>
      </ul>
      <h3>Родительские страницы и <code>outlet()</code></h3>
      <p>Родитель и его дочерние маршруты образуют настоящую иерархию: родитель рисуется сам, а дочерний — внутри него, в том месте, где родитель вызывает <code>outlet()</code>:</p>
      ${code("records/Record.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

// a parent page takes its outlet from (ctx, { outlet })
export default function Record(ctx: RouteContext, { outlet }: PageProps) {
  return div(Header(ctx), input({ id: 'notes' }), main(outlet()))
}
`)}
      <p>При переходах между дочерними маршрутами родитель не пересоздаётся. Это тот же самый узел DOM, поэтому фокус, позиция прокрутки, недописанный текст в полях и любое состояние в его замыканиях никуда не деваются.</p>
      <ul>
        <li>Если у страницы нет дочернего маршрута, outlet пуст, так что макет может вызывать его без всяких проверок. А если родитель <code>outlet()</code> не вызывает, дочерний маршрут просто не отобразится.</li>
        <li>Индексных маршрутов нет: <code>'/'</code> — это сам макет, поэтому на родительском пути вы увидите макет с пустым outlet, а не отдельную индексную страницу внутри него. Стартовый контент положите в сам макет или заведите ему полноценный дочерний путь.</li>
      </ul>
      <p>Тот же вызов сработает под любым родителем, в том числе на странице, которая понятия не имеет, под каким именно она лежит:</p>
      ${code("example.ts", `
router.href('./preview')      // '/invoices/42/preview' or '/customers/7/preview'
await router.go('./preview')
await layer.push('./preview') // the usual shape: a child layer
`)}
      <p><code>./x</code>, <code>../x</code>, <code>.</code> и <code>..</code> разрешаются относительно пути текущего маршрута, а не «каталога» URL. Для <code>/invoices/42</code> путь <code>./preview</code> даст <code>/invoices/42/preview</code>, хотя браузер вычислил бы <code>/invoices/preview</code>. Завершающий слеш ничего не меняет. <code>../</code> поднимается на сегмент выше и упирается в корень. Строка запроса и хеш сохраняются, <code>base</code> возвращается на место, а в историю попадает абсолютный путь. Тем же отступлением от правил разрешения URL пользуется React Router в <code>&lt;Link to="./x"&gt;</code>.</p>
      <ul>
        <li>Относительными по маршруту считаются только <code>./</code> и <code>../</code>. Голый <code>preview</code> в href остаётся на откуп обычным правилам браузера.</li>
        <li>Относительные ссылки стройте через <code>router.href('./preview')</code>, а не пишите <code>href="./preview"</code> руками. <code>href()</code> разрешается во время рендера, так что в разметке окажется абсолютный путь — и он останется рабочим для краулера, клика средней кнопкой и браузера с выключенным JavaScript.</li>
      </ul>
      <h3>Что переживает навигацию, а что пересоздаётся</h3>
      <table>
        <thead><tr><th>Узел</th><th>Навигация</th></tr></thead>
        <tbody>
          <tr><td>родительская страница, у которой не изменились шаблон и путь</td><td><strong>остаётся</strong>: тот же узел, а его <code>load()</code> повторно не запускается</td></tr>
          <tr><td>подходящая страница</td><td><strong>остаётся</strong>, если шаблон и путь те же и у неё нет <code>load()</code>: смена запроса или хеша её не трогает. Маршрут с загрузчиком обновляется при каждом заходе.</td></tr>
          <tr><td>родитель, у которого изменился путь</td><td>пересоздаётся вместе со всем, что лежит под ним</td></tr>
          <tr><td>добавленный слой</td><td>показывает только подходящую страницу; его родители уже стоят в строках ниже</td></tr>
        </tbody>
      </table>
      <p>Сохранённая страница держит тот <code>ctx</code>, с которым её создали. Это справедливо для <code>ctx</code> в любом месте, поэтому актуальные значения читайте из <code>router.*</code>. Фильтры, пагинация и вкладки, завязанные на query-строку, читают <code>router.search</code> внутри динамического значения и меняют URL через <code>router.go('?page=2', { replace: true })</code>. Страница, фокус и недописанный текст при этом остаются на месте.</p>
    `,
      },
      {
        id: "router-regions",
        title: "Страницы и регионы",
        content: `
      <p><code>router.outlet()</code> выводит страницу в одном месте. А если странице нужны ещё боковая панель, тулбар или заголовок где-то в другой части макета, она заполняет их через <a href="#api-region"><code>into()</code></a>: макет помечает место через <code>region()</code>, а страница возвращает <code>into()</code> рядом со своим содержимым. Содержимое страницы никогда не передаётся макету параметром, и навигация макет не пересоздаёт.</p>
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
      <p>Содержимое страницы — это строка <code>list()</code> в outlet, а <code>into()</code> живёт ровно столько, сколько живёт строка, в которой он лежит. Поэтому содержимое боковой панели приходит вместе со страницей и уходит вместе с ней: стоит перейти на страницу без <code>into('sidebar', …)</code>, и снова показывается <code>empty</code> региона. Обе части страница строит одной функцией, так что у них общие <code>ctx</code> и <code>data</code>.</p>
      <h3>Как это ведёт себя при навигации</h3>
      <ul>
        <li><strong>Сохранённая страница сохраняет и свои регионы.</strong> Смена запроса или хеша, при которой <a href="#router-patterns">страница остаётся на месте</a>, регионы тоже не трогает. Если боковая панель зависит от <code>router.search</code>, читайте его внутри динамического значения.</li>
        <li><strong>Пересозданная страница заполняет регионы заново.</strong> При смене маршрута старая строка удаляется, а её место занимают представления <code>into()</code> новой страницы. От прежнего содержимого ничего не остаётся.</li>
        <li><strong>Добавленный слой добавляет представление.</strong> Он занимает более позднюю строку outlet, поэтому его <code>into()</code> становится ещё одним представлением того же региона. При <code>type: 'latest'</code> (по умолчанию) оно перекрывает содержимое страницы, пока слой не закроют, после чего снова видно представление страницы, а при <code>type: 'stack'</code> видно оба.</li>
        <li><strong>Родительская страница тоже может заполнять регионы.</strong> Её представления остаются, пока меняются дочерние маршруты, ведь родитель не пересоздаётся.</li>
        <li><strong>SSR работает без доработок.</strong> Сервер строит страницу внутри <code>route.run()</code>, поэтому представления <code>into()</code> попадают в HTML, а <code>hydrate()</code> подхватывает уже существующие узлы.</li>
      </ul>
      <h3>Несколько регионов на одной странице</h3>
      <p>Чтобы заполнить сразу несколько регионов, передайте объект. Основное содержимое страницы по-прежнему идёт через outlet, поэтому верните его рядом с <code>into()</code>:</p>
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
      <h3>Что для чего</h3>
      <ul>
        <li><strong><code>outlet()</code></strong> — для дочернего маршрута: содержимого, которое выбирает URL и которое показывается внутри родительской страницы. См. <a href="#router-patterns">Вложенные маршруты</a>.</li>
        <li><strong><code>into()</code></strong> — чтобы страница могла раскидать свой контент по макету. Контент принадлежит странице и работает с её данными.</li>
        <li><strong><code>matches()</code></strong> — когда часть макета выбирается только по URL, по своей маленькой таблице и без участия страницы. См. <a href="#router-matches"><code>matches()</code></a>.</li>
      </ul>
      <p>Все эти способы относятся к одному совпавшему маршруту. Один URL не управляет двумя независимыми маршрутами: боковую панель наполняет страница, а не второй outlet. Если боковой панели нужны собственные роутер, загрузка и запасной маршрут, создайте роутер, но не запускайте его, а пользуйтесь <code>match()</code>. Подробнее — в разделе <a href="#router-multi">Несколько роутеров и общая загрузка</a>.</p>
    `,
      },
      {
        id: "router-loaders",
        title: "Загрузчики маршрутов и code splitting",
        content: `
      <p>Модуль страницы может экспортировать функцию <code>load</code>. Она запускается до создания страницы при каждом переходе на этот маршрут, а её результат приходит на страницу как <code>data</code>:</p>
      ${code("pages/Post.ts", `
import type { DataLoader, PageProps, RouteContext } from 'nuclo-router'

export const load: DataLoader<Post> = (ctx) => fetchPost(ctx.params.slug)

export default function Post(_ctx: RouteContext, { data: post }: PageProps<Post>) {
  return article(h1(post.title), p(post.body))
}
`)}
      <p>Таблица маршрутов остаётся прежней: загрузчик едет вместе со страницей. Ему достаётся свой <code>RouteContext</code>, так что <code>params</code>, <code>search</code> и <code>path</code> под рукой. Он может быть синхронным или асинхронным и работает на сервере тоже, поэтому страница с SSR приходит с данными сразу в HTML, а не догружает их после hydration.</p>
      <p><strong>Модуль кешируется, данные — нет.</strong> Чанк маршрута грузится один раз и переиспользуется, а загрузчик запускается заново на каждую навигацию. Благодаря этому <code>/blog/a</code> и <code>/blog/b</code> не путаются, а упавший загрузчик можно просто перезапустить.</p>
      <table>
        <thead><tr><th>Ситуация</th><th>Поведение</th></tr></thead>
        <tbody>
          <tr><td>пока он работает</td><td><code>router.pending</code> включён, а прежняя страница остаётся на экране</td></tr>
          <tr><td>загрузчик бросает исключение или возвращает отклонённый промис</td><td>ошибка попадает в <code>router.error</code>. <code>go()</code> по-прежнему не отклоняется, а навигацию можно повторить</td></tr>
          <tr><td>во время <code>start()</code></td><td>промис <code>start()</code> отклоняется: Route, в который можно записать ошибку, ещё нет</td></tr>
          <tr><td>добавленный слой</td><td>запускает собственный загрузчик и получает свои данные</td></tr>
          <tr><td>предзагрузка в простое</td><td>грузит только модули: контекста для загрузчика ещё нет, а данные запрашивались бы впустую — ради маршрута, который пользователь, возможно, так и не откроет</td></tr>
          <tr><td>повторный переход на тот же URL</td><td>загрузчик запускается снова, и строка пересоздаётся. Маршрут без загрузчика строку сохраняет</td></tr>
        </tbody>
      </table>
      <p>Чтобы перезапросить данные, перейдите туда, где вы уже стоите, не добавляя запись в историю:</p>
      ${code("example.ts", `
await router.go(router.url, { replace: true })   // runs load() again
`)}
      <h3>Данные параллельно с чанком</h3>
      <p>Экспортированный из модуля <code>load</code> можно запустить только после того, как загрузился сам модуль, поэтому «холодная» навигация сначала тянет чанк, а потом данные. Чтобы оба запроса ушли одновременно, объявите загрузчик прямо в таблице через <code>withLoad()</code>:</p>
      ${code("routes.ts", `
import { createRouter, withLoad } from 'nuclo-router'
import { loadPost } from './data.ts'   // small, in the main bundle

createRouter({
  '/blog/:slug': withLoad(() => import('./pages/Post.ts'), loadPost),
})
`)}
      <p>Такой загрузчик подменяет <code>load</code> из модуля страницы и вызывается при каждом переходе. Если он упадёт ещё до загрузки чанка, ошибка всё равно окажется в <code>router.error</code>.</p>
      <p>Серверные данные в HTML намеренно не сериализуются, и клиентский <code>load</code> при hydration вызывается заново. Если это важно, пусть сервер отдаст <code>route.data</code> (скажем, как <code>window.__DATA__</code>), а загрузчик сначала заглянет туда. <code>route.data</code> — это данные только подходящей страницы, результат <code>load()</code> родителя в него не входит.</p>
      <h3>Code splitting и предзагрузка</h3>
      <p>Значение маршрута — всегда функция, возвращающая компонент страницы, поэтому доступ к компоненту ленивый:</p>
      ${code("routes.ts", `
'/a': () => import('./A.ts'),                      // default export (+ optional load)
'/b': () => import('./B.ts').then(m => m.BPage),   // named export
'/c': () => CPage,                                 // eager, not split
'/d': () => ({ default: DPage, load: loadD }),     // eager, module-shaped
`)}
      <p>Экспорт <code>load</code> подхватывается только в «модульных» формах: выбрав именованный компонент через <code>.then(m =&gt; m.BPage)</code>, вы отдаёте роутеру одну лишь эту функцию.</p>
      <p>Каждый модуль импортируется один раз и кешируется, а параллельные переходы на один маршрут делят общий <code>import()</code>. Когда пользователь бездействует <code>idleTimeout</code> (по умолчанию секунду без кликов, клавиш, колеса и прокрутки), остальные маршруты подгружаются в фоне, по одному за свободный интервал <code>requestIdleCallback</code>. Любое действие пользователя или переход с ожиданием ставит предзагрузку на паузу до следующего простоя.</p>
      <p>Предзагруженный или синхронно доступный маршрут не трогает <code>router.pending</code> и появляется до следующей отрисовки: индикатор не мигает, макет не прыгает. <code>router.pending</code> включается только пока ждёт модуль или загрузчик, а прежняя страница до конца загрузки остаётся на экране. Ошибка загрузки чанка попадает в <code>router.error</code>, а не в необработанный reject промиса, и загрузку можно повторить.</p>
    `,
      },
      {
        id: "router-api",
        title: "API роутера",
        content: `
      <h3><code>createRouter(table, options?)</code></h3>
      <p><code>table</code> сопоставляет шаблон с загрузчиком или вложенной таблицей. Опции:</p>
      <table>
        <thead><tr><th>Параметр</th><th>По умолчанию</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>base</code></td><td><code>'/'</code></td><td>URL-префикс, под которым живёт приложение, например <code>'/docs'</code>. Совпадение идёт по границе сегмента: <code>/docs/intro</code> внутри <code>'/docs'</code> подходит, а <code>/docsearch</code> — нет. URL за пределами префикса ничему не соответствуют: <code>start()</code> отклоняется (на сервере это ваш 404), а ссылки на них достаются браузеру.</td></tr>
          <tr><td><code>preload</code></td><td><code>true</code></td><td>Подгружать модули остальных маршрутов в фоне, пока страница простаивает. <code>false</code> выключает предзагрузку.</td></tr>
          <tr><td><code>idleTimeout</code></td><td><code>1000</code></td><td>Сколько миллисекунд без кликов, клавиш, колеса и прокрутки должно пройти, чтобы началась предзагрузка (или возобновилась после активности пользователя).</td></tr>
          <tr><td><code>onNavigate</code></td><td></td><td><code>(ctx, kind) =&gt; void</code> вызывается в браузере после каждой завершённой навигации, включая первую, уже после обновления DOM. <code>kind</code> — одно из <code>'start'</code>, <code>'push'</code>, <code>'replace'</code>, <code>'pop'</code> (Назад, Вперёд, <code>close()</code>) или <code>'layer'</code>. Удобно для <code>document.title</code>, мета-тегов, фокуса, прокрутки и аналитики. При SSR не вызывается.</td></tr>
        </tbody>
      </table>
      <p>Возвращает роутер с методами <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code> и всеми членами <code>Route</code>, кроме <code>run()</code>. Обращения к членам Route перенаправляются активному маршруту: в браузере это результат последнего <code>start()</code>, на сервере — маршрут, чей <code>run()</code> сейчас выполняется. Без активного маршрута чтение бросает исключение. Таблица маршрутов, скомпилированный матчер и кеш модулей живут в роутере и общие для всех серверных запросов.</p>
      <h3><code>router.start(url?)</code></h3>
      <p>Загружает модули страниц для <code>url</code> (в браузере по умолчанию <code>location.href</code>) и возвращает <code>Promise&lt;Route&gt;</code>. Промис отклоняется, если совпадения нет и в таблице нет <code>'*'</code>; на сервере это сигнал отдать 404. В браузере метод делает Route активным, вешает обработчики <code>popstate</code> и делегированный <code>click</code> и планирует предзагрузку. Повторный <code>start()</code> останавливает предыдущий Route этого роутера. На сервере общее состояние не меняется, поэтому рендерите внутри <code>route.run()</code>.</p>
      <h3><code>router.match(url?)</code></h3>
      <p>Сопоставляет URL с таблицей: без загрузки модулей, без обращений к истории, без обработчиков и без создания Route. Возвращает <code>RouteContext</code> или <code>null</code>, если URL вне <code>base</code>, не подходит ни под один шаблон или (в браузере) ведёт на другой origin. Принимает только абсолютные URL: чтобы разрешить <code>./</code>, нужен активный маршрут.</p>
      ${code("example.ts", `
// 404 before importing a single chunk
if (!router.match(request.url)) return new Response(null, { status: 404 })

// "is this link ours?" for a custom link component or a prefetch rule
const owned = router.match(href) !== null
`)}
      <h3><code>router.outlet()</code></h3>
      <p>Страницы активного маршрута в виде <code>list()</code>. Разместите его один раз там, где должны появляться страницы. Открытый слой — это более поздняя строка этого списка. Пока <code>start()</code> не завершился и после <code>stop()</code> список пуст. На сервере он выводит тот маршрут, чей <code>run()</code> сейчас выполняется.</p>
      <h3><code>router.matches(table)</code></h3>
      <p>Показывает представление из второй таблицы, под которую подходит путь активного маршрута, — в виде <code>list()</code>, который можно поставить куда угодно. См. <a href="#router-matches"><code>matches()</code></a>.</p>
      <h3><code>Route</code></h3>
      <p>Все члены, кроме <code>run()</code>, есть и у роутера — приложение читает их оттуда.</p>
      <table>
        <thead><tr><th>Член</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code></td><td>текущее совпадение. <code>search</code> — это <code>URLSearchParams</code>; <code>search</code>, <code>hash</code> и <code>url</code> всегда актуальны</td></tr>
          <tr><td><code>pending</code></td><td>навигация ждёт модуль или загрузчик</td></tr>
          <tr><td><code>error</code></td><td>последняя неудачная загрузка; сбрасывается следующей навигацией</td></tr>
          <tr><td><code>data</code></td><td>результат <code>load()</code> подходящей страницы — чтобы сериализовать его на сервере. Данные родительской страницы сюда не входят.</td></tr>
          <tr><td><code>depth</code></td><td>сколько слоёв в стеке (1 для обычной страницы)</td></tr>
          <tr><td><code>go(href, { replace })</code></td><td>переходит по адресу, при необходимости загружая модуль. Промис не отклоняется: ошибки модуля (исключения и reject) записываются в <code>error</code>.</td></tr>
          <tr><td><code>push(href)</code></td><td>открывает маршрут новым верхним слоем. Промис завершается результатом, с которым закрыли слой. Понимает <code>./</code>. Отклоняется, если совпадения нет или модуль не загрузился.</td></tr>
          <tr><td><code>href(path)</code></td><td>добавляет к пути префикс <code>base</code> — для <code>a({ href })</code>. Разрешает <code>./</code> и <code>../</code> относительно активного маршрута.</td></tr>
          <tr><td><code>stop()</code></td><td>снимает обработчики, закрывает открытые слои без результата и очищает outlet. Повторный вызов ничего не меняет. Остановленный Route помнит последнее совпадение, а его <code>go()</code> ничего не делает.</td></tr>
          <tr><td><code>run(fn)</code></td><td>вызывает <code>fn</code>, на время делая этот Route активным для роутера, и возвращает результат. На сервере: <code>route.run(() =&gt; renderToString(App))</code>. Только синхронно: как только <code>fn</code> вернёт управление, маршрут перестаёт быть активным.</td></tr>
        </tbody>
      </table>
      <h3><code>RouteContext</code></h3>
      <p>Первый аргумент страницы: <code>path</code>, <code>pattern</code>, <code>params</code>, <code>search</code>, <code>hash</code>, <code>url</code>. Это контекст на момент создания страницы; свежие значения читайте из <code>router.*</code>. Расходятся они только тогда, когда запрос или хеш поменялись без пересоздания страницы.</p>
      <p>По умолчанию у <code>params</code> тип <code>{ [name]: string }</code>. Страница может сузить его под свой шаблон через <code>Params</code>: <code>'/blog/:slug'</code> превращается в <code>{ slug: string }</code>, а <code>'/files/*rest'</code> — в <code>{ rest: string }</code>:</p>
      ${code("pages/Post.ts", `
import type { Params, RouteContext } from 'nuclo-router'

export default function Post(ctx: RouteContext<Params<'/blog/:slug'>>) {
  return article(h1(ctx.params.slug))   // slug: string, nothing else exists
}
`)}
      <h3><code>PageProps</code></h3>
      <p>Второй аргумент страницы. Деструктурируйте только то, что действительно нужно.</p>
      <table>
        <thead><tr><th>Свойство</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>layer</code></td><td>положение страницы в стеке. См. <code>Layer</code> ниже.</td></tr>
          <tr><td><code>data</code></td><td>результат <code>load()</code> маршрута или <code>undefined</code>, если загрузчика нет. Тип задаётся через <code>PageProps&lt;TData&gt;</code>.</td></tr>
          <tr><td><code>outlet</code></td><td>место, где родительская страница выводит свой дочерний маршрут. См. <a href="#router-patterns">Вложенные маршруты</a>.</td></tr>
          <tr><td><code>beforeLeave</code></td><td>регистрирует проверку на момент, когда страницу собираются убрать. См. <a href="#router-layers">Проверки перед уходом со страницы</a>.</td></tr>
        </tbody>
      </table>
      <h3><code>Layer</code></h3>
      <p>Где страница стоит в стеке и как закрыть её слой.</p>
      <table>
        <thead><tr><th>Член</th><th></th></tr></thead>
        <tbody>
          <tr><td><code>depth</code></td><td>0 для базовой страницы, 1 и выше для добавленных слоёв</td></tr>
          <tr><td><code>push(href)</code></td><td>открывает ещё один слой изнутри страницы, как <code>Route.push()</code></td></tr>
          <tr><td><code>close(result?)</code></td><td>закрывает этот слой и всё, что над ним, и завершает <code>push()</code>, который его открыл. Без аргумента слой закрывается без результата. На глубине 0 ничего не делает.</td></tr>
        </tbody>
      </table>
      <h3><code>DataLoader</code> и <code>withLoad()</code></h3>
      <p><code>DataLoader</code> — это <code>(ctx: RouteContext) =&gt; TData | Promise&lt;TData&gt;</code>, необязательный экспорт <code>load</code> из модуля страницы. <code>withLoad(loader, load)</code> собирает маршрут, у которого <code>load</code> стартует параллельно с импортом чанка, а не после него. См. <a href="#router-loaders">Загрузчики маршрутов</a>.</p>
      <h3>Типы</h3>
      <p>Все типы доступны как именованные экспорты <code>nuclo-router</code>: типизируйте страницы, загрузчики и проверки, не залезая во внутренние пути пакета.</p>
      <table>
        <thead><tr><th>Тип</th><th>Что это такое</th></tr></thead>
        <tbody>
          <tr><td><code>Params&lt;'/blog/:slug'&gt;</code></td><td>объект параметров для шаблона. <code>RouteParams</code> — общая форма без конкретных имён, а <code>Match</code> — результат сопоставления.</td></tr>
          <tr><td><code>PageComponent</code></td><td>страница: <code>(ctx, { layer, data, outlet, beforeLeave }) =&gt; …</code></td></tr>
          <tr><td><code>RouteModule</code></td><td>модуль страницы: сам компонент или <code>{ default, load? }</code>, как результат <code>import()</code></td></tr>
          <tr><td><code>RouteLoader</code></td><td><code>() =&gt; RouteModule | Promise&lt;RouteModule&gt;</code>, дополнительно с <code>load</code> от <code>withLoad()</code></td></tr>
          <tr><td><code>RouteTable</code></td><td>таблица, которую принимает <code>createRouter()</code>: шаблон → загрузчик или вложенная таблица</td></tr>
          <tr><td><code>RouterOptions</code></td><td><code>{ base?, preload?, idleTimeout?, onNavigate? }</code></td></tr>
          <tr><td><code>NavigateOptions</code></td><td><code>{ replace? }</code>, второй аргумент <code>go()</code></td></tr>
          <tr><td><code>NavigationKind</code></td><td><code>'start' | 'push' | 'replace' | 'pop' | 'layer'</code>, второй аргумент <code>onNavigate</code></td></tr>
          <tr><td><code>Outlet</code></td><td>тип <code>outlet()</code> из <code>PageProps</code></td></tr>
          <tr><td><code>LeaveGuard</code></td><td><code>(to) =&gt; boolean | void | Promise&lt;…&gt;</code>, что принимает <code>beforeLeave()</code></td></tr>
          <tr><td><code>MatchView</code></td><td>представление для <code>matches()</code>: получает параметры и возвращает содержимое или <code>import()</code> модуля страницы</td></tr>
        </tbody>
      </table>
    `,
      },
      {
        id: "router-layers",
        title: "Слои и проверки перед уходом",
        content: `
      <p><code>push()</code> открывает маршрут поверх текущего, а не вместо него, и промис завершается тем, с чем закрыли слой. Страницы лежат в одном <code>list()</code>-стеке, поэтому открыть слой — значит просто добавить строку. Нижняя страница не перерисовывается: её DOM, фокус и наполовину заполненная форма ждут на месте, пока слой не закроют.</p>
      <p>Именно поэтому сценарий «нужна запись, которой ещё нет» работает и не губит форму, которую пользователь уже начал заполнять:</p>
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
      <p>Слои вкладываются друг в друга: диалогу, которому понадобился ещё один диалог, достаточно вызвать <code>layer.push()</code> и дождаться результата — обращаться к Route не нужно.</p>
      <ul>
        <li><strong>URL указывает на верхний слой.</strong> <code>push()</code> добавляет запись в историю: на слой можно дать ссылку, а кнопка «Назад» закрывает его, и <code>push()</code> завершается значением undefined — как при «Отмене». «Назад» и <code>close()</code> устроены одинаково: <code>close()</code> запоминает результат и откатывает историю назад, ориентируясь на глубину в <code>history.state</code>. Браузеры хранят около 50 записей на вкладку, и если после долгой навигации запись под слоем затерялась, <code>close()</code> закрывает слои на месте и подменяет текущую запись адресом оставшейся страницы.</li>
        <li><strong>Обычная навигация очищает стек.</strong> Клик по ссылке или <code>go()</code> слоем не является: он заменяет всё и закрывает каждый открытый слой, чтобы ни один вызывающий код не повис в ожидании.</li>
        <li><strong>Прямая загрузка открывает одну страницу.</strong> URL описывает верхний слой, но не стек под ним, поэтому при заходе по адресу вы увидите единственную страницу: глубина стека — 1, <code>layer.depth === 0</code>, а <code>close()</code> ничего не делает. Маршрут должен уметь жить сам по себе. Проверяйте <code>layer.depth</code> и вместо нерабочей кнопки «Отмена» показывайте ссылку для выхода.</li>
        <li><strong>Промис не переживёт перезагрузку:</strong> он живёт в замыкании. Результат слоя — всего лишь короткий путь для сценария, который должен работать и через обычную навигацию.</li>
        <li><strong>Никто не ждёт вечно.</strong> <code>stop()</code> закрывает каждый открытый слой, а слой, который сбросила навигация, завершается значением <code>undefined</code>.</li>
      </ul>
      <h3>Проверки перед уходом со страницы</h3>
      <p>Если на странице есть данные, которых жалко лишиться (например, недозаполненная форма), она регистрирует проверку перед уходом. Проверка вызывается перед тем, как страницу уберут, и если вернуть <code>false</code> (или промис с этим значением), переход отменяется, а страница остаётся на месте:</p>
      ${code("pages/Edit.ts", `
import type { PageProps, RouteContext } from 'nuclo-router'

export default function Edit(_ctx: RouteContext, { beforeLeave }: PageProps) {
  let dirty = false
  beforeLeave(() => !dirty || confirm('Discard your changes?'))
  return form(input({ onInput: () => (dirty = true) }), …)
}
`)}
      <ul>
        <li><strong>Только когда страницу действительно убирают.</strong> Переход на дочерний маршрут внутри макета или смена запроса либо хеша, при которой страница остаётся, проверку не вызывает. Проверка живёт вместе со страницей, так что снимать её вручную не нужно.</li>
        <li><strong>Любой выход.</strong> Ссылка, <code>go()</code>, «Назад» и «Вперёд», <code>close()</code> слоя и <code>go()</code> на URL, которым роутер не владеет (уход из приложения, при этом <code>to</code> равен <code>null</code>). Если проверка отказала, «Назад» или «Вперёд» откатываются обратно, и адресная строка остаётся на этой странице. Закрытие вкладки и перезагрузка — забота <code>beforeunload</code>.</li>
        <li><strong><code>to</code></strong> — это <code>RouteContext</code> пункта назначения. Проверки идут от самой глубокой страницы и останавливаются на первом отказе. Исключение тоже отменяет переход. <code>close(result)</code> проходит через проверку, поэтому перед закрытием с результатом сбросьте флаг несохранённых изменений.</li>
        <li>Роутер видит только те записи истории, которые создал сам. Если «Назад» или «Вперёд» ведёт на чужую запись (обычная ссылка <code>#fragment</code> или <code>pushState</code> из стороннего скрипта), проверка не вызывается.</li>
      </ul>
    `,
      },
      {
        id: "router-matches",
        title: "matches() и вложенные роутеры",
        content: `
      <p><code>router.outlet()</code> выводит страницу, а <code>router.matches(table)</code> — всё остальное, что зависит от текущего адреса (боковую панель, хлебные крошки, тулбар): по своей маленькой таблице, без загрузки маршрута и без лишней страницы:</p>
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
        <li><strong>Правила те же, что у таблицы маршрутов.</strong> Те же шаблоны, приоритеты, сопоставление исходного пути и отбрасывание префикса <code>base</code>, поэтому представление и страница понимают URL одинаково. Читается путь верхнего слоя — как и в <code>router.path</code>.</li>
        <li><strong>Представление</strong> — это <code>(params, ctx) =&gt; content</code>. Тип <code>params</code> выводится из шаблона, а <code>ctx</code> — <code>RouteContext</code> с <code>pattern</code> и <code>params</code> самого представления. Вместо содержимого можно вернуть <code>import()</code> модуля страницы: когда он загрузится, его компонент вызовется с <code>ctx</code>.</li>
        <li><strong>Нет совпадения — нет вывода.</strong> Добавьте представление <code>'*'</code> как запасной вариант. До <code>start()</code> и после <code>stop()</code> оно пусто, как и outlet.</li>
        <li><strong>Представление пересоздаётся только при смене маршрута.</strong> Любой переход, после которого страница остаётся, сохраняет и DOM представления.</li>
        <li><strong>Ленивое представление молчит, пока не загрузится его модуль.</strong> Упавший <code>import()</code> пишется в <code>console.error</code>, <code>router.error</code> не выставляет и повторяется при следующей навигации. Обычный <code>update()</code> повторную попытку не запускает.</li>
        <li><strong>На сервере</strong> ленивое представление ничего не выводит: его модуль подгрузится уже на клиенте. Контент, который должен попасть в исходный HTML, делайте синхронным представлением.</li>
      </ul>
      <h3>Вложенные роутеры</h3>
      <p>Маршруты и сами умеют вкладываться, так что вместо вложенного роутера обычно хватает вложенной таблицы. Роутер при этом один: страница <code>'/'</code> раздела задаёт его оболочку, а дочерние маршруты показываются в её <code>outlet()</code>. При переходах внутри раздела оболочка сохраняется:</p>
      ${code("routes.ts", `
createRouter({ '/': …, '/docs': docsRoutes, '*': … })
`)}
      <p>Либо дайте разделу собственный роутер — созданный, но так и не запущенный. Родителю принадлежит единственная универсальная запись, а дочерний роутер разбирает остаток пути по своим шаблонам, параметрам и запасным вариантам:</p>
      ${code("routes.ts", `
// parent table
'/docs/*rest': () => import('./docs/Shell.ts'),
`)}
      ${code("docs/Shell.ts", `
const docs = createRouter(docsRoutes, { base: '/docs' })
const hit = docs.match()                       // { pattern: '/:topic', … }
const page = await docsRoutes[hit.pattern]()   // the app's own lookup
`)}
      <p>Главное — не вызывать <code>start()</code>: именно он вешает обработчики, а два запущенных роутера конфликтуют. В таком варианте дочерний роутер только сопоставляет URL, поэтому загрузчики данных придётся вызывать самому. Когда меняется остаток пути, оболочка тоже пересоздаётся: основной роутер видит один маршрут, а остальное разбирает оболочка. Вложенная таблица оставляет родительскую страницу смонтированной, так что отдавайте ей предпочтение, если разделу не нужны свой роутер, свой base и запасной маршрут.</p>
    `,
      },
      {
        id: "router-multi",
        title: "Несколько роутеров и общая загрузка",
        content: `
      <p>В приложении может быть несколько роутеров — по одному на область. Правило простое: <strong>запускайте ровно один на документ</strong>, а остальные пусть только сопоставляют URL через <code>match()</code>. URL, историей и обработчиком кликов управляет лишь запущенный роутер. Независимые области могут загружаться каждая сама по себе, со своим индикатором.</p>
      <h3>Общая загрузка: цепочка загрузчиков</h3>
      <p>Любая страница в совпавшей цепочке может экспортировать <code>load()</code>. При «холодном» переходе на дочерний маршрут загрузчики макета и страницы стартуют <strong>параллельно</strong>, а один <code>router.pending</code> покрывает всю цепочку: прежняя страница остаётся на экране, пока не завершатся оба загрузчика, так что наполовину загруженное дерево не рисуется никогда. Каждый компонент получает свой <code>data</code>:</p>
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
      <p>Оба загрузчика стартуют одновременно. <code>router.pending</code> включён, пока ждёт хотя бы один из них, и выключен в остальное время. Предзагруженный или синхронно доступный маршрут флаг не трогает. При переходе между разделами макет остаётся, поэтому заново запускается только загрузчик раздела, а данные макета, его DOM и недописанный текст сохраняются. Повторный переход на тот же URL снова запускает загрузчик конечной страницы и пересоздаёт её строку.</p>
      <h3>Несколько загрузок: второй роутер со своим индикатором</h3>
      <p>Независимой области (боковая панель, лоток, отдельная зона) достаётся собственный роутер — созданный, но никогда не запускавшийся, — и собственный флаг загрузки. <code>router.pending</code> принадлежит запущенному роутеру и об этой области ничего не знает, поэтому обе загрузки идут параллельно, и любая может закончиться первой:</p>
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
      <p>Второй роутер лишь сопоставляет URL: <code>match()</code> возвращает контекст, а боковая панель в основную таблицу маршрутов не попадает. <code>onNavigate</code> вызывается после каждого завершённого перехода, включая первый, и как раз синхронизирует независимую область с URL.</p>
      <ul>
        <li><strong><code>pending</code> принадлежит запущенному роутеру.</strong> У роутера, который никогда не стартовал, нет ни маршрута, ни <code>pending</code>, ни <code>error</code>. Область ведёт собственные флаги, и второй спиннер мирно живёт рядом с первым. В демо боковая панель грузится 800 мс, а загрузчики маршрута — 900 мс, так что страница может закончить раньше панели, а может и наоборот.</li>
        <li><strong><code>match()</code> не вешает обработчики.</strong> Незапущенных роутеров в документе может быть сколько угодно. У каждого своя таблица, свой base и кеш модулей, и ни один не трогает историю: им нужны только таблица и матчер.</li>
        <li><strong>Загрузчики сами не запускаются.</strong> Запущенный роутер вызывает <code>load()</code> у совпавших страниц, а незапущенный только сопоставляет URL. Если представлению нужны данные, грузите их сами, как в <code>refreshSidebar()</code>. Чтобы переложить загрузку на основной роутер, используйте <a href="#router-matches">вложенную таблицу</a> или <a href="#router-regions">регион, который заполняет страница</a>.</li>
        <li><strong>Игнорируйте устаревшие ответы.</strong> Медленный ответ для боковой панели не должен применяться после перехода в другой раздел. Увеличивайте счётчик поколения при каждом обновлении и отбрасывайте ответы со старым значением — точно так же роутер отбрасывает результаты устаревших переходов.</li>
        <li><strong>У ленивого представления <code>matches()</code> тоже нет <code>pending</code>.</strong> Оно ничего не выводит, пока не загрузится его модуль. Получается три независимых механизма загрузки: <code>pending</code> маршрута, ваши собственные флаги и ленивое представление, которого пока просто нет.</li>
      </ul>
    `,
      },
      {
        id: "router-links",
        title: "Обработка ссылок",
        content: `
      <p>Делегированный обработчик перехватывает обычный клик левой кнопкой по <code>&lt;a href&gt;</code>, включая SVG-<code>&lt;a&gt;</code> и вложенные в ссылку элементы. Всё остальное отходит браузеру: клики с модификаторами или средней кнопкой, <code>target</code> кроме <code>_self</code>, <code>download</code>, <code>rel="external"</code>, ссылки на другой origin, ссылки только с хешем на текущей странице, пути вне <code>base</code>, пути без совпадения в таблице (чтобы работала серверная 404) и события, для которых приложение уже вызвало <code>preventDefault()</code>. Чтобы явно вывести ссылку из-под контроля роутера, добавьте <code>data-nuclo-router="off"</code>.</p>
      <h3>Прокрутка</h3>
      <p>При навигации через push текущая позиция прокрутки сохраняется. Если у нового URL есть <code>#hash</code>, совпадающий с элементом на странице, к нему и прокрутит. При <code>popstate</code> прокруткой занимается браузер. Чтобы новые страницы открывались сверху, сделайте это в <code>onNavigate</code> — там известно, как произошёл переход:</p>
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
        <li><strong>DOM не кешируется.</strong> Route хранит функцию страницы и контекст, а когда пользователь уходит со страницы, её DOM удаляется. <code>stop()</code> снимает обработчики, отменяет текущую загрузку и сбрасывает <code>pending</code>, так что остановленный Route не оставит индикатор загрузки включённым. Модуль, который дозагрузился уже после <code>stop()</code>, игнорируется.</li>
        <li><strong>Параллельные запросы на сервере изолированы.</strong> <code>start()</code> возвращает состояние конкретного запроса, а <code>run()</code> ограничивает его одним синхронным рендером, поэтому пересекающиеся запросы не видят маршрутов друг друга. Общий у них только кеш модулей. Область действия заканчивается, когда <code>run()</code> возвращает значение; <code>renderToString()</code> синхронный, так что этого хватает. Для асинхронного или потокового рендера маршрут пришлось бы протаскивать через <code>await</code>, а <code>run()</code> так не умеет.</li>
        <li><strong>Восстановлением прокрутки на <code>popstate</code></strong> занимается браузер (<code>scrollRestoration</code>), а не роутер.</li>
        <li><strong>Один запущенный роутер на документ.</strong> Каждый <code>start()</code> вешает свой делегированный обработчик <code>click</code>. Запуск второго роутера первый не останавливает, а повторный <code>start()</code> заменяет Route только внутри того же роутера. Чтобы сопоставить URL с другой таблицей, заведите отдельный роутер и вызывайте у него только <code>match()</code>: обработчиков он не вешает, поэтому независимая область может грузиться отдельно от <code>pending</code> основного маршрута. См. <a href="#router-multi">Несколько роутеров и общая загрузка</a>.</li>
        <li><strong>Сознательно не поддерживается:</strong> hash- и memory-history (маршрут задаётся путём URL, и сервер должен уметь отдать каждый путь), а также две независимые области роутинга под одним URL (страница может наполнять несколько регионов через <code>into()</code>, но все они принадлежат одному совпавшему маршруту). Независимая область может завести свой незапущенный роутер и свою загрузку — см. <a href="#router-multi">Несколько роутеров и общая загрузка</a>. Предзагрузки по наведению тоже нет: вызывайте загрузчик маршрута из <code>mouseenter</code>.</li>
      </ul>
      <h3>Примеры</h3>
      <p>В репозитории лежат два рабочих примера. Они дополняют друг друга, так что любую возможность можно где-нибудь увидеть вживую:</p>
      <ul>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router"><code>examples/router</code></a>: клиентский обзор всего API — все формы шаблонов и правила приоритета, отказ от обработки ссылок, каждый член Route с живыми контролами, вложенный роутер, стек из трёх слоёв, относительный раздел, смонтированный под двумя родителями, и загрузчики маршрутов с <code>pending</code> и <code>error</code>. Задаёт <code>preload: false</code>, чтобы эти состояния были заметны.</li>
        <li><a href="https://github.com/dan2dev/nuclo/tree/main/examples/router-ssr"><code>examples/router-ssr</code></a>: <code>renderToString()</code> на каждый запрос, hydration с проверкой, что серверные узлы переиспользуются, честные ответы 404, <code>base</code> не из корня, предзагрузка в простое (её видно на вкладке Network) и загрузчик, чьи данные переезжают с сервера на клиент, так что повторного запроса при hydration нет.</li>
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
      <p>Отдельного API для вычисляемых значений в Nuclo нет. Пишете обычную функцию и вызываете её из динамических значений:</p>
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
      <p>Берите обычный <code>async</code>/<code>await</code> и вызывайте <code>update()</code> каждый раз, когда меняется состояние. Для загрузки данных это значит: один раз до <code>await</code> и один раз после него:</p>
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
        <li><strong>Собирайте изменения в пачку.</strong> Сначала поменяйте всё нужное состояние, а <code>update()</code> вызовите один раз.</li>
        <li><strong>Функции динамических значений должны быть быстрыми и чистыми.</strong> Они все выполняются на каждый <code>update()</code>.</li>
        <li><strong>Берите <code>scope()</code></strong> для небольших и частых обновлений вроде ввода текста или таймеров.</li>
        <li><strong>Рендерьте прямо в документ.</strong> Узлы, которых нет в документе на момент <code>update()</code>, перестают обновляться.</li>
        <li><strong>Для меняющихся дочерних узлов берите <code>when()</code> и <code>list()</code></strong>, а не функцию, которая возвращает узлы.</li>
        <li><strong>Пишите <code>className</code>, а не <code>class</code></strong>, а для динамических классов — <code>() =&gt; cx(...)</code> или <code>{ className: () =&gt; … }</code>.</li>
        <li><strong>Объявляйте стили один раз</strong> — на уровне модуля.</li>
        <li><strong>SSR: сначала рендер</strong>, потом <code>getCssText()</code> в <code>&lt;style id="nuclo-styles"&gt;</code>. Данные запроса передавайте аргументами и не вырезайте HTML-комментарии из вывода.</li>
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
      <p>Все публичные функции и точки входа, из которых их можно импортировать.</p>
      <h3><code>nuclo</code> (глобальный и именованный экспорт)</h3>
      <ul>
        <li><a href="#api-update"><code>update(...scopeIds)</code></a>: пересчитать все динамические значения или только те, что лежат в указанных областях.</li>
        <li><a href="#api-scope"><code>scope(...ids)</code></a>: назначить элементу идентификаторы области для <code>update(id)</code>.</li>
        <li><a href="#api-when"><code>when(condition, ...content)</code></a>: условное содержимое с <code>.when()</code> и <code>.else()</code>.</li>
        <li><a href="#api-list"><code>list(items, renderItem)</code></a>: одна строка на элемент с сопоставлением по идентичности.</li>
        <li><a href="#api-region"><code>region(options)</code></a> и <a href="#api-region"><code>into(id, ...content)</code></a>: именованное место в дереве и контент, который заполняет его откуда угодно.</li>
        <li><a href="#events"><code>on(type, listener, options?)</code></a>: обработчик события или <a href="#lifecycle"><code>on('mount')</code> / <code>on('destroy')</code></a>.</li>
        <li><a href="#api-render"><code>render(App, parent?)</code></a>: построить дерево и вставить в страницу.</li>
        <li><a href="#api-hydrate"><code>hydrate(App, parent?)</code></a>: оживить серверный HTML.</li>
        <li><a href="#api-force-update"><code>forceUpdate()</code></a>: заново вызвать компоненты и обновить DOM.</li>
        <li><a href="#api-styling"><code>css(name?, style)</code></a>: получить классы из объекта стилей.</li>
        <li><a href="#api-cx"><code>cx(...inputs)</code></a>: склеить стили; у последних аргументов приоритет.</li>
        <li><a href="#api-create-css"><code>createCss(theme)</code></a>: привязанные к теме <code>css</code>, <code>cx</code>, <code>variants</code>, <code>keyframes</code> и <code>globalStyle</code>.</li>
        <li><a href="#api-variants"><code>variants(config)</code></a>: стили по набору опций.</li>
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
        <li><a href="#api-polyfill">Импорт ради побочного эффекта</a>, а также классы <code>document</code>, <code>Event</code>, <code>CustomEvent</code>, <code>Node</code>, <code>Element</code>, <code>HTMLElement</code> и <code>Nuclo*</code>.</li>
      </ul>
      <h3><code>nuclo-router</code> (отдельный пакет)</h3>
      <ul>
        <li><a href="#router-api"><code>createRouter(table, options?)</code></a>: роутер с <code>start()</code>, <code>match()</code>, <code>outlet()</code>, <code>matches()</code>, <code>go()</code>, <code>push()</code>, <code>href()</code> и <code>stop()</code>.</li>
        <li><a href="#router-loaders"><code>withLoad(loader, load)</code></a>: маршрут, чей загрузчик данных стартует параллельно с импортом чанка.</li>
        <li><a href="#router-api">Типы</a>: <code>RouteContext</code>, <code>PageProps</code>, <code>Params</code>, <code>DataLoader</code>, <code>RouteTable</code> и другие.</li>
      </ul>
      <h3>Только глобальные версии</h3>
      <ul>
        <li><a href="#tag-builders">175 билдеров элементов</a>: <code>div</code>, <code>span</code>, …, <code>var_</code> и <code>svgSvg</code>, <code>pathSvg</code>, ….</li>
        <li><a href="#typescript-setup">Типы</a>: <code>NodeModFn</code>, <code>NodeModLike</code>, <code>ExpandedElement</code> и другие. Типы стилей, такие как <code>StyleResult</code>, также можно импортировать из <code>'nuclo'</code>.</li>
      </ul>
      <h3>Специальные ключи</h3>
      <ul>
        <li><a href="#attributes">Атрибуты</a>: <code>className</code>, <code>style</code>, <a href="#events">обработчики <code>on*</code></a>, <a href="#lifecycle"><code>onMount</code> и <code>onDestroy</code></a>.</li>
        <li><a href="#style-objects">Объекты стилей</a>: алиасы, псевдосостояния, селекторы <code>&amp;</code>, правила <code>@</code> и <code>raw</code>.</li>
      </ul>
    `,
      },
      {
        id: "faq",
        title: "Частые вопросы",
        content: `
      <h3>Обновит ли UI изменение состояния?</h3>
      <p>Нет. DOM останется прежним, пока вы не вызовете <code>update()</code>.</p>

      <h3>Использует ли Nuclo сигналы, прокси или virtual DOM?</h3>
      <p>Нет. Состояние — это обычные изменяемые данные JavaScript. Когда дерево рендерится, Nuclo создаёт настоящие элементы и текстовые узлы, а <code>update()</code> прогоняет каждое зарегистрированное динамическое значение (или только те, что внутри указанных областей) и обновляет те же узлы, где значение изменилось. Ни графа зависимостей, ни виртуального дерева здесь нет.</p>

      <h3>Почему на странице появляется «false»?</h3>
      <p>Булевы значения выводятся как текст. <code>div(ok &amp;&amp; span('Done'))</code> покажет «false». Для дочерних узлов берите <code>when(() =&gt; ok, span('Done'))</code>, а для текста — <code>ok ? 'Done' : ''</code>.</p>

      <h3>Почему строка списка не меняется, когда я правлю элемент?</h3>
      <p>Строки для элементов, которые остались в списке, сохраняются и заново не строятся. Для полей, которые меняются, используйте динамические значения вроде <code>() =&gt; todo.text</code>. См. <a href="#api-list"><code>list()</code></a>.</p>

      <h3>Почему часть UI перестала обновляться?</h3>
      <p>Чаще всего узлов не было в документе в момент <code>update()</code>. Nuclo перестаёт следить за такими узлами навсегда, даже если вы потом их прикрепите, поэтому рендерьте в контейнер, который уже находится в документе. Есть ещё две причины: <code>when()</code>, условие которого бросило исключение, перестаёт обновляться, а текстовая функция, упавшая при первом вызове, так и остаётся пустой. См. <a href="#api-update"><code>update()</code></a>.</p>

      <h3>Когда нужен <code>forceUpdate()</code>?</h3>
      <p>Только для редких изменений статических значений — например, при смене языка. В остальных случаях хватает <code>update()</code>. См. <a href="#api-force-update"><code>forceUpdate()</code></a>.</p>

      <h3>Как вставить страницу в макет, не передавая её параметром?</h3>
      <p>Пометьте место через <code>region({ id: 'main' })</code> и возвращайте из страницы <code>into('main', …)</code>. См. <a href="#api-region"><code>region()</code> &amp; <code>into()</code></a>.</p>

      <h3>Как размонтировать приложение?</h3>
      <p>Оберните его в <code>when()</code> и выключите условие. Если удалить DOM руками, <code>onDestroy</code> не сработает. См. <a href="#lifecycle">Жизненный цикл</a>.</p>

      <h3>Есть ли в Nuclo роутер?</h3>
      <p>В основном пакете — нет. Роутинг вынесен в отдельный пакет <code>nuclo-router</code>: серверный рендер, hydration, code splitting и предзагрузка в простое. Ставится командой <code>npm install nuclo nuclo-router</code>. См. <a href="#router-overview">nuclo-router</a>.</p>

      <h3>Есть ли в Nuclo эффекты?</h3>
      <p>Нет. <code>onMount</code> и <code>onDestroy</code> вызываются по одному разу на элемент — при вставке и при удалении, — и изменения состояния их не перезапускают.</p>
    `,
      },
    ],
  },

];
