import { code, sh } from "../../pages/docs/blocks.ts";
import { API_DEMOS } from "../../components/api-demos.ts";
import type { DocGroupText } from "../../pages/docs/content.ts";

export const GROUPS_1: DocGroupText[] = [
  // ── Introduction ─────────────────────────────────────────────────────────
  {
    title: "Введение",
    sections: [
      {
        id: "overview",
        title: "Обзор",
        content: `
      <p>Nuclo — крошечная DOM-библиотека для TypeScript. Интерфейс вы собираете из обычных функций вроде <code>div()</code> и <code>button()</code>, состояние хранится в самых обычных переменных, а когда пора перерисовать страницу, достаточно вызвать <code>update()</code>.</p>
      <p>В Nuclo нет virtual DOM, компилятора, proxy и signals.</p>
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
      <h3>Ментальная модель</h3>
      <ol>
        <li>Опишите интерфейс билдерами элементов.</li>
        <li>Всё, что зависит от состояния, заверните в функцию.</li>
        <li>Меняйте состояние как в обычном JavaScript.</li>
        <li>Вызовите <code>update()</code> — Nuclo перезапустит эти функции и поправит DOM.</li>
      </ol>
      <p>Изменение переменной DOM не затрагивает: страница меняется только после вызова <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Быстрый старт",
        content: `
      <p><code>create-nuclo</code> разворачивает стартовый проект на Vite и TypeScript, где Nuclo уже настроен и готов к работе:</p>
    `,
        afterContent: `
      <p>Команда спросит, как назвать проект. Если вопросы не нужны, сразу передайте имя и флаги (в npm перед флагами ставится <code>--</code>):</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Остаётся поставить зависимости и поднять dev-сервер:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Опции</h3>
      <ul>
        <li><code>[project-name]</code>: папка проекта. По умолчанию — <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: какой шаблон взять за основу. Пока он один — <code>basic</code>.</li>
        <li><code>-y, --yes</code>: не задавать вопросов и взять значения по умолчанию.</li>
        <li><code>-f, --force</code>: писать в папку, даже если в ней уже что-то лежит.</li>
        <li><code>-h, --help</code>: показать справку.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Установка и импорты",
        content: `
      <p>Чтобы добавить Nuclo в уже существующий проект:</p>
      ${sh("npm install nuclo")}
      <p>Подойдут и <code>pnpm add nuclo</code>, <code>yarn add nuclo</code>, <code>bun add nuclo</code>. Зависимостей у Nuclo нет.</p>
      <p>Роутинга в основном пакете нет — он вынесен в отдельный <a href="#router-overview"><code>nuclo-router</code></a>. Когда понадобится, поставьте его рядом с <code>nuclo</code>.</p>
      <h3>Глобальные функции</h3>
      <p><code>import 'nuclo'</code> кладёт их прямо в <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 билдеров элементов</strong>: 112 для HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) и 63 для SVG с суффиксом <code>Svg</code> (<code>svgSvg</code>, <code>pathSvg</code>, …). См. <a href="#tag-builders">Билдеры элементов</a>.</li>
        <li><strong>16 вспомогательных функций</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> и <code>globalStyle</code>.</li>
      </ul>
      <p>Импорт должен выполниться раньше любого кода, вызывающего билдеры. ES-модули исполняются в порядке импорта, так что вот такой код сломается:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Пишите <code>import 'nuclo'</code> первой строкой в точке входа — или импортируйте его в каждом файле, где используются глобальные функции.</p>
      <h3>Именованный импорт</h3>
      <p>Вспомогательные функции можно импортировать и по имени — это те же самые функции, что и глобальные. А вот <code>getCssText()</code> и <code>resetStyles()</code> существуют только как именованные экспорты, тогда как билдеры элементов — только как глобальные, поэтому <code>import { div } from 'nuclo'</code> не сработает.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Точки входа</h3>
      <ul>
        <li><code>nuclo</code>: регистрирует глобальные переменные и экспортирует 16 вспомогательных функций плюс <code>getCssText</code> и <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> и <code>getCssText</code>. См. <a href="#api-ssr">Серверный рендеринг</a>.</li>
        <li><code>nuclo/polyfill</code>: мини-DOM для Node и Bun. См. <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: только типы. См. <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Типы поставляются вместе с Nuclo. От вас нужны всего две вещи:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> и <code>nodenext</code> пока не поддерживаются.</li>
        <li>библиотека <code>DOM</code> в <code>lib</code>. TypeScript подключает её сам, пока вы не прописали <code>lib</code> руками.</li>
      </ul>
      <p>Если хотя бы один файл проекта импортирует <code>'nuclo'</code>, глобальные типы видны везде, и больше ничего настраивать не нужно. Если же ни один файл его не импортирует (например, в отдельном tsconfig для тестов), подключите типы вручную:</p>
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
      <p>Или добавьте <code>/// &lt;reference types="nuclo/types" /&gt;</code> в любой <code>.d.ts</code>-файл.</p>
      <h3>Полезные типы</h3>
      <p>Эти типы глобальные — импортировать их не нужно:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: то, что возвращает билдер. Удобно как возвращаемый тип компонента.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: всё, что билдер готов принять в аргументах.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: то, что возвращают <code>render()</code> и <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: любое имя HTML-тега.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: объект атрибутов, который принимает билдер, вместе с обработчиками <code>on*</code>, <code>onMount</code> и <code>onDestroy</code>. Пригодится компонентам, которые пробрасывают атрибуты дальше.</li>
        <li><code>MountCallback</code> и <code>DestroyCallback</code>: обработчики <code>onMount</code> и <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: то, что возвращают <code>when()</code> и <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: опции, которые принимает <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> и прочие типы стилей. Их можно и импортировать явно: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> делает все поля DOM необязательными. Если нужен полноценный тип элемента, приведите его явно: <code>render(App, root) as HTMLDivElement</code>.</p>
    `,
      },
    ],
  },

  // ── Building UI ──────────────────────────────────────────────────────────
  {
    title: "Создание UI",
    sections: [
      {
        id: "tag-builders",
        title: "Билдеры элементов",
        content: `
      <p>У каждого HTML-тега есть одноимённая глобальная функция: <code>div</code>, <code>span</code>, <code>input</code>, … Исключение всего одно — <code>&lt;var&gt;</code>: билдер называется <code>var_</code>, ведь <code>var</code> в JavaScript зарезервировано. SVG-теги получают суффикс <code>Svg</code>: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>, …</p>
      <p>Вызов <code>div('Hi')</code> сам по себе элемент не создаёт. Он возвращает <strong>билдер (builder)</strong> — функцию, которая построит элемент чуть позже. Nuclo запускает её при монтировании через <code>render()</code> или когда билдер вложен в другой билдер, <code>when()</code> или <code>list()</code>. Каждый запуск даёт новый элемент.</p>
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
      <h3>Аргументы</h3>
      <p>Билдер принимает сколько угодно аргументов и применяет их слева направо:</p>
      <ul>
        <li><strong>строка, число, bigint</strong>: превращаются в текстовый узел.</li>
        <li><strong><code>() =&gt; value</code></strong>: текст, который пересчитывается при каждом <code>update()</code>. См. <a href="#dynamic-functions">Динамические значения</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: пропускаются.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: выводятся текстом «true» или «false». Для условий есть <code>when()</code>.</li>
        <li><strong>Обычный объект</strong>: атрибуты. См. <a href="#attributes">Атрибуты</a>.</li>
        <li><strong>Результат <code>css()</code>, <code>cx()</code> или <code>variants()</code></strong>: добавляет свои классы к элементу.</li>
        <li><strong><code>on(...)</code></strong>: обработчик события или хук жизненного цикла.</li>
        <li><strong>Другой билдер, <code>when()</code> или <code>list()</code></strong>: дочерний узел.</li>
        <li><strong>Узел DOM (<code>Node</code>)</strong>: вставляется как есть.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: собственный модификатор (см. ниже).</li>
      </ul>
      <h3>Частые ошибки</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> выведет на странице слово «false». Правильно так: <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Массив как дочерний узел не принимается — разверните его через spread: <code>ul(...names.map((n) =&gt; li(n)))</code>. А если список меняется со временем, берите <code>list()</code>.</li>
        <li>Локальная переменная с именем тега затеняет билдер: внутри <code>function Row(label: string)</code> вызвать <code>label(...)</code> уже не выйдет. Не используйте такие имена для переменных: <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code>, <code>i</code>.</li>
        <li>Браузер превращает каждый элемент с <code>id</code> в глобальную переменную. Если до загрузки Nuclo в разметке уже есть <code>&lt;main id="main"&gt;</code>, Nuclo эту переменную не перезапишет, и <code>main(...)</code> бросит <code>TypeError</code>. Берите другие <code>id</code>.</li>
      </ul>
      <h3>Собственные модификаторы</h3>
      <p>Функция, у которой объявлен хотя бы один параметр, выполняется один раз при построении элемента — в порядке аргументов. Первым параметром приходит сам элемент, вторым — внутренний индекс (опираться на него не стоит). Вернёте строку или число — получите текст, вернёте <code>Node</code> — он добавится в элемент, вернёте объект — он применится как атрибуты.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Как получить элемент</h3>
      <p><code>render()</code> возвращает корневой элемент. Внутри дерева его можно получить через <code>on("mount", (el) =&gt; …)</code> или собственный модификатор. Ещё один способ — вызвать билдер самому и получить готовый элемент:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Прикрепите его к документу до ближайшего <code>update()</code>: узел, которого в момент <code>update()</code> нет в документе, Nuclo перестаёт обновлять навсегда.</p>
      <h3>SVG</h3>
      <p>SVG-билдеры принимают те же аргументы. Каждый SVG-атрибут Nuclo выставляет через <code>setAttribute</code>, поэтому имена вроде <code>"stroke-width"</code> работают как есть.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Полный список билдеров</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Компоненты",
        content: `
      <p>Компонент — это обычная функция, которая возвращает билдер, например <code>button(...)</code>. Никакого отдельного API для компонентов нет, и пока вы не отрендерите результат или не вставите его в дерево, ничего не создаётся.</p>
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
      <p>Состояние внутри функции принадлежит конкретному экземпляру, а состояние снаружи — общее для всех. <code>forceUpdate()</code> вызывает компоненты заново, так что всё, что объявлено внутри, обнуляется.</p>
      <p>Дочерние узлы — просто аргументы функции:</p>
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
        title: "Атрибуты",
        content: `
      <p>Атрибуты передаются обычным объектом. Таких объектов может быть несколько: при совпадении ключей побеждает последний, а <code>className</code> и <code>style</code> объединяются. Значение бывает статическим или функцией без параметров, которая вызывается заново при каждом <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Как значение попадает в DOM</h3>
      <ul>
        <li>Если у HTML-элемента есть свойство с таким именем (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo пишет значение прямо в него. Если нет — вызывает <code>setAttribute(key, String(value))</code>; так работают, например, <code>"aria-*"</code> и <code>"data-*"</code>.</li>
        <li>В SVG-элементах всегда используется <code>setAttribute</code>.</li>
        <li><code>null</code> и <code>undefined</code> пропускаются. Если динамическое значение вернуло <code>null</code> или <code>undefined</code>, остаётся прежнее. Чтобы сбросить значение, верните <code>""</code>, а для булева свойства — <code>false</code>.</li>
        <li>Булевы значения осмысленны только для булевых свойств DOM: <code>disabled</code> у кнопки, <code>checked</code>, <code>hidden</code>, <code>required</code>. В остальных случаях <code>true</code> и <code>false</code> запишутся как строки «true» и «false».</li>
        <li>Для data-атрибутов используйте ключи <code>"data-*"</code>; <code>dataset</code> не поддерживается.</li>
        <li><code>innerHTML</code> не экранируется, а серверный рендеринг его вообще не выводит. Лучше обойтись без него.</li>
      </ul>
      <h3>Классы</h3>
      <p>Для классов берите <code>className</code>. Статические строки, результаты <code>css()</code> и динамический <code>className</code> складываются вместе. Динамический <code>className</code> статические классы не трогает: если он вернул <code>""</code>, остаются только они.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Ключ <code>class</code> в HTML-элементах лучше не трогать: он ставит «сырой» атрибут и затирает все классы, применённые до него, в том числе из <code>css()</code>.</p>
      <h3>Инлайн-стили</h3>
      <p><code>style</code> принимает объект с ключами в camelCase или функцию, которая такой объект возвращает.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Единицы измерения Nuclo сам не добавляет: пишите <code>"12px"</code>, а не <code>12</code>. Безразмерные свойства вроде <code>opacity</code> и <code>zIndex</code> спокойно принимают числа.</li>
        <li><code>""</code>, <code>null</code> и <code>undefined</code> сбрасывают свойство.</li>
        <li>Динамический стиль выставляет только те ключи, которые вернул. Если ключ вдруг перестал приходить, его прежнее значение остаётся, поэтому для сброса возвращайте <code>""</code>.</li>
        <li>Строки со стилями (<code>"color: red"</code>) и custom properties (<code>"--gap"</code>) здесь не поддерживаются — для этого есть <code>css()</code>, который принимает custom properties через <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "События",
        content: `
      <p>На события можно подписаться двумя способами: через атрибуты <code>on*</code> или модификатором <code>on()</code>.</p>
      <h3>Атрибуты <code>on*</code></h3>
      <p>Если в объекте атрибутов ключ выглядит как <code>onClick</code> (<code>on</code> и заглавная буква), то функция под ним — обработчик события, а не динамическое значение.</p>
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
        <li>TypeScript сам выводит тип события из ключа и элемента. <code>e.currentTarget</code> и <code>this</code> указывают на сам элемент.</li>
        <li>Nuclo пишет обработчик в свойство элемента: <code>onClick</code> превращается в <code>el.onclick</code>. На событие приходится один обработчик, и более поздний <code>onClick</code> заменяет более ранний.</li>
        <li><code>onDoubleClick</code> и <code>onDblClick</code> соответствуют <code>dblclick</code>. Ключи в нижнем регистре, вроде <code>onclick</code>, TypeScript отклонит как ошибку типов.</li>
        <li>Если имя не совпадает ни с одним известным событием, Nuclo слушает его вариант в нижнем регистре: <code>onMyEvent</code> подписывается на <code>"myevent"</code>.</li>
        <li>Исключения из обработчика Nuclo не перехватывает.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> возвращает модификатор, который вешает на элемент слушатель через <code>addEventListener</code>.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Каждый <code>on()</code> добавляет ещё один обработчик, и вызываются они все — по порядку.</li>
        <li><code>options</code> уходят в <code>addEventListener</code> без изменений: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Передавайте <code>on()</code> прямо в билдер — тогда TypeScript выведет тип элемента: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Если обработчик бросил исключение, Nuclo пишет его в <code>console.error</code>, а остальные обработчики продолжают работать.</li>
        <li>Когда элемент удаляется, Nuclo сам снимает слушатель. На сервере <code>on()</code> ничего не делает.</li>
        <li>Один и тот же <code>on()</code> можно переиспользовать на нескольких элементах.</li>
      </ul>
      <p>Для кастомного события передайте его тип в параметре типа:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Что выбрать</h3>
      <p>В большинстве случаев хватает атрибутов <code>on*</code>. К <code>on()</code> стоит обращаться, когда нужно несколько обработчиков на одно событие, опции слушателя или нестандартное имя события вроде <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Жизненный цикл",
        content: `
      <p><code>onMount</code> вызывается один раз — после того как элемент вставлен, а <code>onDestroy</code> — один раз, когда Nuclo его удаляет. Задавать их можно и атрибутами, и через <code>on()</code>: обе формы работают одинаково, а тип элемента выводится из тега.</p>
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
      <h3>Когда срабатывают хуки</h3>
      <ul>
        <li><code>onMount</code> срабатывает в самом конце того вызова — <code>render()</code>, <code>hydrate()</code>, <code>update()</code> или <code>forceUpdate()</code>, — который вставил элемент. Пока дерево ещё строится, он не запускается.</li>
        <li>Если <code>onMount</code> вернул функцию, она вызовется при удалении элемента — уже после его обработчиков <code>onDestroy</code>.</li>
        <li><code>onDestroy</code> срабатывает, когда Nuclo удаляет элемент: исчезла строка <code>list()</code>, переключилась ветка <code>when()</code>, <code>into()</code> покинул свой регион или элемент убрал <code>forceUpdate()</code>. Это происходит прямо перед удалением, так что элемент ещё находится в документе.</li>
      </ul>
      <h3>Если удалять DOM руками</h3>
      <p>Если убрать элемент самому — через <code>node.remove()</code> или <code>innerHTML = ''</code>, — его <code>onDestroy</code> и функция очистки не вызовутся, а таймеры продолжат тикать. Метода <code>unmount()</code> в Nuclo нет. Чтобы снять приложение вместе со всей очисткой, оберните его в <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Порядок вызова и ошибки</h3>
      <ul>
        <li>Хуков можно навесить сколько угодно и в любой форме — выполняются они в порядке регистрации.</li>
        <li><code>onDestroy</code> вызывается сначала у дочерних элементов, затем у родителя.</li>
        <li>Хуки монтирования идут в порядке, в котором зарегистрирован первый <code>onMount</code> каждого элемента, а тот определяется порядком аргументов. Все хуки одного элемента выполняются подряд. Если дочерним элементам нужен хук родителя, передайте его раньше дочерних узлов.</li>
        <li>Если хук бросил исключение, ошибка уходит в <code>console.error</code>, а остальные хуки всё равно выполнятся.</li>
        <li>Обработчик должен возвращать функцию очистки или ничего, так что <code>async</code> здесь ни к чему: возвращённый промис функцией очистки не становится. Асинхронную работу запускайте внутри обработчика: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>На сервере хуки не запускаются вовсе, а на клиенте срабатывают после <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Примечание:</strong> Хуки — не эффекты. При изменении состояния они не перезапускаются: каждый срабатывает не больше одного раза на элемент.</div>
    `,
      },
    ],
  },

  // ── Updates ──────────────────────────────────────────────────────────────
  {
    title: "Обновления",
    sections: [
      {
        id: "explicit-updates",
        title: "Явные обновления",
        content: `
      <p>Nuclo никогда не обновляет страницу сам. Измените состояние и вызовите <code>update()</code>.</p>
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
      <p>Менять состояние можно сколько угодно раз, а <code>update()</code> достаточно вызвать один раз:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p><code>update()</code> можно звать из обработчиков событий, таймеров, колбэков после загрузки данных и из <code>onMount</code>. Единственное место, где этого делать нельзя, — внутри динамического значения.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Динамические значения",
        content: `
      <p>Функция <strong>без параметров</strong> — это <strong>динамическое значение</strong>. Nuclo вызывает её один раз при построении элемента и потом при каждом <code>update()</code>. Так задают текст, значения атрибутов, <code>style</code> и <code>className</code>. А для дочерних элементов, которые появляются, исчезают или повторяются, есть <a href="#api-when"><code>when()</code></a> и <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo смотрит на число параметров (<code>fn.length</code>). Функция с параметром — это <a href="#tag-builders">собственный модификатор</a>, и выполняется она лишь один раз. У <code>(x = 0) =&gt; …</code> и <code>(...args) =&gt; …</code> длина равна 0, поэтому они считаются динамическими.</p>
      <h3>Динамический текст</h3>
      <ul>
        <li>Строка, число, bigint или булево значение выводится как <code>String(value)</code>. Выражение <code>() =&gt; ok &amp;&amp; 'Saved'</code> покажет «false», так что пишите <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> и <code>undefined</code> превращаются в пустой текст.</li>
        <li>Если при первом вызове функция вернула результат <code>css()</code> или <code>cx()</code>, она становится динамическим классом, а не текстом. См. <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Узел, билдер, массив или обычный объект ничего не выведут и обновляться не будут.</li>
      </ul>
      <h3>Динамические атрибуты</h3>
      <ul>
        <li>Nuclo записывает значение, только если оно отличается от записанного в прошлый раз. С реальным DOM он значение не сверяет: если пользователь печатает в поле, а функция возвращает то же, что и раньше, набранный текст остаётся на месте.</li>
        <li>Если вернулся <code>null</code> или <code>undefined</code>, ничего не записывается, и прежнее значение остаётся. Исключение — <code>className</code>: любой ложный результат убирает динамические классы, а статические сохраняет.</li>
        <li>Функция <code>style</code> применяет возвращённый объект при каждом обновлении заново.</li>
      </ul>
      <h3>Ошибки</h3>
      <p>Если функция динамического значения бросила исключение, Nuclo его перехватывает, и остальное обновление продолжается. Текст при этом становится пустым или остаётся прежним, атрибут не меняется, а при следующем удачном <code>update()</code> оба восстановятся. Есть одно исключение: текстовая функция, которая упала уже на <strong>первом</strong> вызове, так и останется пустой.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Делает один синхронный проход по всем динамическим значениям на странице. Если передать идентификаторы, обновится только то, что лежит внутри элементов, помеченных ими через <a href="#api-scope"><code>scope()</code></a>. Шаги выполняются в таком порядке:</p>
      <ol>
        <li><code>list()</code>: заново читает элементы, добавляет, переставляет или удаляет строки.</li>
        <li><code>when()</code>: заново проверяет условия. Ветка пересоздаётся, только если активной стала другая.</li>
        <li>Динамические атрибуты, включая <code>style</code> и <code>className</code>.</li>
        <li>Динамический текст.</li>
        <li><code>onMount</code> у элементов, вставленных на шагах 1 и 2.</li>
      </ol>
      <ul>
        <li><strong>Пересчитывается всё.</strong> Каждое динамическое значение вычисляется при каждом вызове, даже если данные не менялись; пропускается лишь запись в DOM. Поэтому функции динамических значений должны быть быстрыми и без побочных эффектов.</li>
        <li><strong>Только узлы в документе.</strong> Если в момент <code>update()</code> узла нет в документе, Nuclo перестаёт за ним следить, и обновляться он больше не будет, даже если вы потом его прикрепите. Это касается и <code>list()</code> с <code>when()</code>. Рендерите в контейнер, который уже лежит в документе.</li>
        <li><strong>Статические значения не меняются.</strong> Обычные строки и значения атрибутов фиксируются при построении элемента. Чтобы пересобрать и их, вызовите <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Ошибки.</strong> Исключения в тексте и атрибутах перехватываются, проход продолжается. Если бросило условие <code>when()</code>, ошибка логируется, а этот <code>when()</code> больше не обновляется. Если бросила функция <code>items</code> или <code>renderItem</code> у <code>list()</code>, исключение вылетает из <code>update()</code>, и остальные шаги не выполняются.</li>
        <li><strong>На сервере.</strong> Там <code>update()</code> ничего не делает.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Присваивает элементу, в который его передали, один или несколько идентификаторов области. После этого <code>update('id')</code> обновляет только то, что находится внутри этого элемента, включая его собственные атрибуты.</p>
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
        <li>У элемента может быть несколько идентификаторов: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> обновляет всё внутри <code>a</code> и <code>b</code>. Если один идентификатор висит на нескольких элементах, обновятся все.</li>
        <li>Области можно вкладывать друг в друга: <code>update('outer')</code> заденет и внутреннюю область, а <code>update('inner')</code> внешнюю не тронет.</li>
        <li>Если такого идентификатора нет ни у одного элемента в документе, <strong>ничего</strong> не обновится — и без всяких ошибок, так что следите за опечатками.</li>
        <li>На сервере <code>scope()</code> ничего не делает.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Выводит содержимое по условию. Nuclo перепроверяет условия при каждом <code>update()</code>, и побеждает первое истинное. Если истинных нет, показывается <code>.else()</code>, а если и его нет — ничего.</p>
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
      <h3>Условия</h3>
      <ul>
        <li>Если условие зависит от состояния, передавайте функцию. Обычное булево значение читается один раз, и <code>when(open, …)</code> потом уже не изменится.</li>
        <li>В TypeScript функция должна возвращать boolean, поэтому пишите <code>() =&gt; items.length &gt; 0</code> или <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Что обновляется</h3>
      <ul>
        <li>Пока активна одна и та же ветка, её элементы сохраняются, а динамические значения, списки и вложенные <code>when()</code> внутри продолжают обновляться.</li>
        <li>Когда активной становится другая ветка, старое содержимое удаляется, и срабатывают его хуки <code>onDestroy</code>. Новая ветка строится с нуля, и выполняются её хуки <code>onMount</code>. Состояние старых элементов (введённый текст, фокус) пропадает.</li>
      </ul>
      <h3>Содержимое ветки</h3>
      <p>В ветку можно класть текст, динамический текст, билдеры, <code>list()</code> и вложенный <code>when()</code>. Передавайте именно билдеры, например <code>p('Hi')</code>, а не готовые узлы DOM: готовый узел перестаёт обновляться после первого же скрытия ветки.</p>
      <p>Объекты атрибутов и <code>on()</code> внутри ветки применяются к родительскому элементу и остаются, даже когда ветка скрыта. Для условного атрибута используйте динамический атрибут: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Цепочка</h3>
      <p><code>.when()</code> и <code>.else()</code> возвращают новый билдер, а оригинал не меняют. Если вызвать <code>.else()</code> дважды, сработает последний.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Выводит по одной строке на каждый элемент. При каждом <code>update()</code> Nuclo заново вызывает <code>items()</code> и сопоставляет элементы с уже существующими строками по идентичности (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Как сопоставляются строки</h3>
      <ul>
        <li>Элемент, оставшийся в массиве, сохраняет свою строку: Nuclo при необходимости просто переставляет её, а <code>renderItem</code> повторно не вызывает.</li>
        <li>Новый элемент получает новую строку. Если элемент пропал, его строка удаляется, и срабатывают её хуки <code>onDestroy</code>.</li>
        <li>У каждого дубликата своя строка.</li>
        <li>Массив можно менять на месте (<code>push</code>, <code>splice</code>, <code>sort</code>) или возвращать каждый раз новый.</li>
      </ul>
      <p>Сохранённая строка заново не строится, поэтому для изменяемых полей берите динамические значения:</p>
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
      <p>Копии — это уже другие элементы, поэтому если подменить массив на <code>todos.map((t) =&gt; ({ ...t }))</code>, каждая строка пересоздастся.</p>
    `,
        afterContent: `
      <h3>Что возвращает <code>renderItem</code></h3>
      <ul>
        <li>Верните один элемент — например, <code>li(...)</code>, <code>tr(...)</code> или SVG-билдер. Чтобы пропустить элемент, верните <code>null</code> или <code>undefined</code>. Строки, текстовые узлы и фрагменты ничего не выведут.</li>
        <li><code>when()</code> и <code>list()</code> напрямую не возвращайте — вкладывайте их в элемент строки: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Чтобы скрыть элементы, отфильтруйте их в <code>items()</code>, а не в <code>renderItem</code>.</li>
        <li>Не кладите в <code>renderItem</code> побочные эффекты: Nuclo может вызвать его для одного элемента не один раз.</li>
      </ul>
      <h3>Индекс</h3>
      <p><code>index</code> — позиция элемента на момент создания строки. Когда строки переставляются, он не обновляется. Актуальную позицию получайте динамическим значением: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Итерируемые объекты</h3>
      <p>Подойдёт любой итерируемый объект: массив, <code>Set</code>, генератор, <code>map.values()</code>. Возвращать каждый раз один и тот же массив или <code>Set</code> можно. А вот итератор вроде генератора или <code>map.values()</code> одноразовый, поэтому создавайте его внутри <code>items()</code> при каждом вызове. Если перебирать сам <code>Map</code>, на каждом проходе появятся новые пары <code>[key, value]</code>, и все строки пересоздадутся, так что берите <code>map.values()</code>.</p>
      <h3>Размещение</h3>
      <p>Строки появляются там, где <code>list()</code> стоит среди соседних элементов, — между двумя комментариями-маркерами. Остальные дочерние узлы родителя не затрагиваются. <code>list()</code> работает и внутри SVG-билдеров.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() и into()",
        content: `
      <p><code>region()</code> помечает в дереве именованное место, а <code>into()</code> наполняет его откуда угодно и с любой глубины. Макету не нужно получать контент через props, а компоненту, который его создаёт, — знать, где он окажется.</p>
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
      <h3>Как это работает</h3>
      <ul>
        <li><code>into()</code> оставляет на своём месте лишь комментарий, а само содержимое выводится между маркерами региона.</li>
        <li>Порядок не важен. Если <code>into()</code> создан раньше своего региона, он подождёт и покажется, как только регион появится. Представления выводятся в порядке создания.</li>
        <li>Содержимое живёт ровно столько же, сколько его представление. Когда закрывается <code>when()</code> с <code>into()</code> внутри или удаляется строка <code>list()</code>, содержимое уходит из региона. При повторном открытии добавится одна копия, а не две.</li>
        <li>Когда исчезает сам регион (скажем, закрылся <code>when()</code>), его представления снова ждут, и их покажет регион, созданный позже с тем же идентификатором.</li>
        <li><code>into()</code> с идентификатором, которому не соответствует ни один регион, молча ничего не выводит и ошибок не выдаёт, так что следите за опечатками.</li>
        <li>Идентификаторы в дереве должны быть уникальны. Если создать второй регион с уже занятым идентификатором, в консоль попадёт предупреждение.</li>
        <li>Регионы работают с <a href="#api-ssr">серверным рендерингом</a>. При <code>hydrate()</code> каждое представление подхватывает HTML, отрисованный сервером, а не создаёт его заново.</li>
      </ul>
      <h3>Опции</h3>
      <ul>
        <li><code>id</code>: имя, по которому <code>into()</code> находит нужный регион.</li>
        <li><code>type</code>: <code>'latest'</code> (по умолчанию) показывает только самое свежее представление, <code>'stack'</code> — все по очереди, в порядке поступления.</li>
        <li><code>empty</code>: что показывать, пока в регионе нет ни одного представления.</li>
      </ul>
      <h3>Регионы со стеком представлений</h3>
      <p>При <code>type: 'stack'</code> представление, открытое поверх другого, нижнее не пересоздаёт: его DOM, фокус и состояние формы сохраняются. Это удобно для слоёв вроде диалога поверх страницы.</p>
      ${code("layers.ts", `
let open = false

const App = () =>
  div(
    region({ id: 'main', type: 'stack' }),
    into('main', form(input({ placeholder: 'Keeps its text' }))),
    when(() => open, into('main', div('On top'))),
  )
`)}
      <h3>Сразу несколько регионов</h3>
      <p>Передайте объект, чтобы заполнить несколько регионов одним <code>into()</code>. Значение — один дочерний элемент или массив. Формы можно вкладывать: <code>into()</code> внутри содержимого другого представления адресует уже свой регион.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Диалог из глубины дерева</h3>
      <p>Регион оверлея лежит в корне. Любой компонент на любой глубине может открыть диалог: достаточно обернуть <code>into()</code> в <code>when()</code>. Когда <code>when()</code> закрывается, диалог пропадает из региона.</p>
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
      <h3>Тосты из строк списка</h3>
      <p>Каждая строка <code>list()</code> — отдельное представление. В регионе-стеке они выводятся по порядку, а когда элемент удаляют из массива, вместе с ним исчезает и его тост.</p>
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
      <h3>Заголовок, который задаёт страница</h3>
      <p>При <code>type: 'latest'</code> (по умолчанию) побеждает самое свежее представление. Заголовок принадлежит макету, а текст ему задаёт открытая страница. Если на странице нет <code>into('title', …)</code>, остаётся текст из <code>empty</code>.</p>
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
      <h3>Динамические значения внутри представления</h3>
      <p>Содержимое <code>into()</code> — самое обычное содержимое Nuclo. Функции внутри него остаются динамическими значениями и обновляются при <code>update()</code>, где бы ни находился регион.</p>
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
      <h3>Регион, который приходит и уходит</h3>
      <p><code>into()</code> для дашборда пишется один раз. Пока пользователь не вошёл, региона <code>main</code> нет, и представление ждёт. После входа регион создаётся, и представление появляется. После выхода регион удаляется, и представление снова уходит в ожидание.</p>
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
      <h3>Представление со своим регионом</h3>
      <p>Внутри представления может быть свой <code>region()</code>, и другие представления могут писать в него. Здесь страница редактора содержит регион <code>tabs</code>, а каждая вкладка его наполняет. Когда редактор закрывается, вместе с ним исчезает и этот регион.</p>
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
      <h3>Живой пример</h3>
      ${code("region-app.ts", API_DEMOS.find((d) => d.id === "api-region")!.code)}
    `,
      },
      {
        id: "api-force-update",
        title: "forceUpdate()",
        content: `
      <p><code>update()</code> трогает только динамические значения. Статические — например, текст в <code>h1(labels[lang].title)</code> — фиксируются при построении дерева. <code>forceUpdate()</code> заново вызывает ваши компоненты и приводит существующий DOM в соответствие с новым деревом, статические значения тоже. Приберегите его для редких глобальных изменений вроде смены языка, а в остальных случаях пользуйтесь <code>update()</code>.</p>
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
      <p>Без аргументов <code>forceUpdate()</code> перестраивает каждый корень, созданный через <code>render(App)</code> или <code>hydrate(App)</code>. Корни, созданные через <code>render(App())</code>, пропускаются. Если компонент бросил исключение, ошибка логируется, а корень сохраняет старый DOM. Ошибка, случившаяся позже, уже при применении нового дерева, тоже логируется, но изменения, которые успели применить, остаются.</p>
      <h3>Что остаётся, а что меняется</h3>
      <ul>
        <li>Дочерние элементы сопоставляются по порядку и по тегам. Подходящий элемент переиспользуется, поэтому фокус и введённые значения сохраняются, а его <code>onMount</code> повторно не вызывается. Как только тег очередного дочернего элемента не совпал, он и все следующие за ним соседи создаются заново.</li>
        <li>Текст, атрибуты, классы, стили, обработчики, ветки <code>when()</code> и строки <code>list()</code> подгоняются под новое дерево.</li>
        <li>Новые элементы создаются, и их <code>onMount</code> срабатывает. Элементы, которых в новом дереве больше нет, удаляются, и срабатывает их <code>onDestroy</code>.</li>
        <li>Строки <code>list()</code> здесь тоже сопоставляются по позиции, а не по идентичности элемента, поэтому переиспользованная строка вполне может показать уже другой элемент.</li>
        <li>Атрибуты, которые новое дерево больше не задаёт, не снимаются.</li>
      </ul>
      <div class="docs-callout"><strong>Осторожно:</strong> состояние, объявленное внутри функции компонента, сбрасывается: функция ведь выполняется заново. Всё, что должно пережить перерисовку, храните вне компонента.</div>
      <p><strong>Явная форма.</strong> <code>forceUpdate(App(), parent)</code> перестраивает одно дерево внутри <code>parent</code> и возвращает его корень. Для будущих вызовов этот корень не регистрируется. Как и <code>hydrate()</code>, он ожидает, что корень — первый узел в <code>parent</code>, а если у первого узла другой тег, заменяет его.</p>
      <p>На сервере <code>forceUpdate()</code> ничего не делает.</p>
    `,
      },
    ],
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  {
    title: "Рендеринг",
    sections: [
      {
        id: "api-render",
        title: "render()",
        content: `
      <p>Строит дерево и добавляет его корневой элемент в <code>parent</code> (по умолчанию <code>document.body</code>). Возвращает этот корневой элемент.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Можно передать компонент (<code>render(App)</code>) или билдер, который он возвращает (<code>render(App())</code>): DOM получится одинаковый. Но только <code>render(App)</code> позволяет <a href="#api-force-update"><code>forceUpdate()</code></a> позже пересобрать корень, так что лучше выбирать именно его.</li>
        <li>Элемент именно добавляется: <code>parent</code> не очищается, поэтому два вызова дадут две копии.</li>
        <li>К моменту, когда <code>render()</code> вернёт управление, все хуки <code>onMount</code> в дереве уже отработали.</li>
        <li>Рендерите в элемент, который уже есть в документе. См. <a href="#api-update"><code>update()</code></a>.</li>
        <li>Корнем должен быть элемент вроде <code>div(...)</code>, а не <code>when()</code> или <code>list()</code>.</li>
        <li>Параметр <code>index</code> внутренний и не определяет, куда вставлять элемент. Его не нужно передавать.</li>
      </ul>
      <p>Компонент, который вы передаёте как <code>render(App)</code>, не должен принимать параметры. Обязательный параметр — это ошибка типов; необязательный проходит проверку типов, но <code>render()</code> упадёт во время выполнения. Если компоненту нужны параметры, оберните его:</p>
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
      <p>Оживляет HTML, полученный из <a href="#api-ssr"><code>renderToString()</code></a>. Переиспользует существующие элементы, навешивает обработчики событий и регистрирует динамические значения, <code>when()</code> и <code>list()</code>, чтобы последующие <code>update()</code> работали, а затем запускает хуки <code>onMount</code>. <code>parent</code> по умолчанию — <code>document.body</code>. Возвращает корневой элемент.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Берите тот же компонент и те же данные, что и на сервере.</li>
        <li>Выполняйте гидратацию в отдельном контейнере: корень приложения должен быть его первым узлом (пробелы допустимы). Если первым идёт другой узел, Nuclo заменит его, а серверную копию не тронет.</li>
        <li>Как и в <code>render()</code>, передавайте <code>App</code>, а не <code>App()</code>, чтобы <code>forceUpdate()</code> мог потом пересобрать корень. <code>App</code> не должен принимать параметры: с необязательным <code>hydrate()</code> молча ничего не подключит. Если компоненту нужны параметры, оберните его: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Если серверного HTML нет, берите <code>render()</code>.</li>
      </ul>
      <h3>Если сервер и клиент расходятся</h3>
      <p>Побеждает клиент:</p>
      <ul>
        <li>Другой корневой тег: узел заменяется новым DOM. Пустой контейнер: новый DOM добавляется.</li>
        <li>Расходящийся текст исправляется, а отличающиеся элементы <code>list()</code> и ветки <code>when()</code> подстраиваются под клиент.</li>
        <li>Лишние дочерние узлы сервера удаляются, недостающие — создаются.</li>
        <li>Атрибуты, которые записал сервер, но клиент не задаёт, остаются как были.</li>
      </ul>
      <p><code>renderToString()</code> ставит перед каждым текстовым узлом HTML-комментарий-маркер, например <code>&lt;!-- text-0 --&gt;</code>. Они нужны <code>hydrate()</code>, поэтому не вырезайте комментарии из серверного HTML. Без маркеров гидратация удалит строки <code>list()</code>, а <code>list()</code> и <code>when()</code> перестанут обновляться.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Серверный рендеринг",
        content: `
      <p>На сервере превратите компонент в строку HTML, а в браузере вызовите <a href="#api-hydrate"><code>hydrate()</code></a> с тем же компонентом — и HTML оживёт. В серверном runtime нет <code>document</code>, поэтому сначала импортируйте <a href="#api-polyfill"><code>nuclo/polyfill</code></a>.</p>
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
      <p>Не убирайте <code>id="nuclo-styles"</code> из тега style: клиент переиспользует этот элемент и дописывает в него только новые правила. См. <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Как это работает на сервере</h3>
      <ul>
        <li>Каждый вызов <code>renderToString()</code> строит дерево и вычисляет каждое динамическое значение ровно один раз.</li>
        <li>Обработчики событий и хуки <code>onMount</code> и <code>onDestroy</code> не запускаются, а <code>update()</code>, <code>scope()</code> и <code>forceUpdate()</code> ничего не делают.</li>
        <li>Рендеринг синхронный: данные сначала загружайте, а уже потом рендерите.</li>
        <li>После рендеринга ничего не остаётся зарегистрированным, так что один процесс спокойно обслуживает много запросов. Данные запроса передавайте аргументами, например <code>renderToString(Page(user))</code>. Переменные уровня модуля общие для всех запросов.</li>
        <li><code>render()</code> на сервере не вызывайте: он дописывает в общий <code>document.body</code>.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Принимает билдер (<code>App()</code>), компонент (<code>App</code>) или узел DOM. Для <code>null</code> и <code>undefined</code> вернёт <code>""</code>. Корень должен быть элементом. Компонент, переданный как <code>renderToString(Page)</code>, не должен принимать параметры, поэтому если ему нужны данные, передавайте <code>Page(user)</code>.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Текст и значения атрибутов экранируются как HTML. Текст внутри <code>script()</code> и <code>style()</code> выводится как есть (разрываются только закрывающие теги), поэтому пользовательский ввод туда не кладите.</li>
        <li>Исключений не бросает. Если упал компонент, функция <code>list()</code> или условие <code>when()</code>, либо нет полифилла, ошибка логируется, а возвращается <code>""</code>. Проверяйте пустой результат, если сбой рендеринга должен превращаться в ошибку запроса. Если упала только функция текста или атрибута, это значение просто выводится пустым.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>То же, что <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Оборачивает результат в один элемент. По умолчанию <code>containerTag</code> — <code>"div"</code>, а <code>containerAttrs</code> — <code>{}</code>. Значения атрибутов экранируются, а имена пишутся как есть, поэтому используйте HTML-имена вроде <code>class</code>. Пользовательский ввод в качестве тега передавать нельзя.</p>
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
      <p>Мини-DOM, благодаря которому Nuclo умеет строить деревья в Node и Bun. Импортируйте его один раз, до первого рендера: в большинстве приложений хватает простого импорта.</p>
      <ul>
        <li>Если <code>window</code> нет, подставляет <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> и <code>HTMLElement</code> — только те, которых не хватает. Сам <code>window</code> он не создаёт.</li>
        <li>В браузере и под jsdom ничего не делает.</li>
        <li><code>Event</code> и <code>CustomEvent</code> — штатные конструкторы runtime, а <code>Node</code>, <code>Element</code> и <code>HTMLElement</code> — алиасы классов полифилла.</li>
      </ul>
      <p>Это DOM для построения деревьев, а не браузер: ни <code>innerHTML</code>, ни <code>getElementById</code> в нём нет, <code>querySelector()</code> возвращает <code>null</code>, а обработчики событий игнорируются. Чтобы получить HTML, берите <code>renderToString()</code>.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
