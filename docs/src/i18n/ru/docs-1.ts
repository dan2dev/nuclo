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
      <p>Nuclo — небольшая библиотека DOM для TypeScript. Вы создаете страницу с помощью простых функций, таких как <code>div()</code> и <code>button()</code>, сохраняете состояние в обычных переменных и вызываете <code>update()</code>, когда страница должна измениться.</p>
      <p>Nuclo не имеет виртуального DOM, компилятора, прокси и сигналов.</p>
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
        <li>Создайте UI с помощью конструкторов тегов.</li>
        <li>Передайте функцию для каждого значения, которое зависит от состояния.</li>
        <li>Измените состояние с помощью простого JavaScript.</li>
        <li>Вызовите <code>update()</code>. Nuclo снова запускает функции и исправляет DOM.</li>
      </ol>
      <p>Изменение переменной не затрагивает DOM. Страница меняется только при вызове <code>update()</code>.</p>
    `,
      },
      {
        id: "quick-start",
        title: "Быстрый старт",
        content: `
      <p><code>create-nuclo</code> формирует проект Vite и TypeScript, готовый для Nuclo:</p>
    `,
        afterContent: `
      <p>Запрашивает имя проекта. Чтобы пропустить запрос, передайте имя и флаги. Для npm поставьте <code>--</code> перед флагами:</p>
      ${sh("npm create nuclo@latest my-app -- --template basic --yes")}
      <p>Затем установите и запустите сервер разработки:</p>
      ${sh("cd my-app", "npm install", "npm run dev")}
      <h3>Опции</h3>
      <ul>
        <li><code>[project-name]</code>: целевая папка. По умолчанию — <code>nuclo-app</code>.</li>
        <li><code>-t, --template &lt;name&gt;</code>: шаблон для копирования. Сегодня существует только <code>basic</code>.</li>
        <li><code>-y, --yes</code>: никогда не запрашивать, используйте значения по умолчанию.</li>
        <li><code>-f, --force</code>: запись в папку, которая не пуста.</li>
        <li><code>-h, --help</code>: распечатать справку.</li>
      </ul>
    `,
      },
      {
        id: "installation",
        title: "Установка и импорты",
        content: `
      <p>Чтобы добавить Nuclo в существующий проект:</p>
      ${sh("npm install nuclo")}
      <p>Или используйте <code>pnpm add nuclo</code>, <code>yarn add nuclo</code> или <code>bun add nuclo</code>. Nuclo не имеет зависимостей.</p>
      <p>Маршрутизация не является частью основного пакета. Он поставляется отдельно как <a href="#router-overview"><code>nuclo-router</code></a>, который вы устанавливаете рядом с <code>nuclo</code>, когда он вам нужен.</p>
      <h3>Глобальные данные</h3>
      <p><code>import 'nuclo'</code> помещает их на <code>globalThis</code>:</p>
      <ul>
        <li><strong>175 конструкторов тегов</strong>: 112 для HTML (<code>div</code>, <code>span</code>, <code>button</code>, …) и 63 для SVG, с <code>Svg</code> суффикс (<code>svgSvg</code>, <code>pathSvg</code>, …). См. <a href="#tag-builders">Tag Builders</a>.</li>
        <li><strong>16 помощников</strong>: <code>update</code>, <code>scope</code>, <code>when</code>, <code>list</code>, <code>region</code>, <code>into</code>, <code>on</code>, <code>render</code>, <code>hydrate</code>, <code>forceUpdate</code>, <code>css</code>, <code>cx</code>, <code>createCss</code>, <code>variants</code>, <code>keyframes</code> и <code>globalStyle</code>.</li>
      </ul>
      <p>Импорт должен выполняться перед любым кодом, вызывающим построитель. Модули ES запускаются в порядке импорта, поэтому это не удается:</p>
      ${code("main.ts", `
import { App } from './app' // app.ts calls div() → ReferenceError: div is not defined
import 'nuclo'
`)}
      <p>Поместите <code>import 'nuclo'</code> первым в файле ввода или импортируйте его в каждый файл, использующий глобальные переменные.</p>
      <h3>Именованный импорт</h3>
      <p>Помощники также называются экспортами. Это те же функции, что и глобальные переменные. <code>getCssText()</code> и <code>resetStyles()</code> являются только именованными экспортами. Компоновщики тегов являются только глобальными, поэтому <code>import { div } from 'nuclo'</code> не работает.</p>
      ${code("main.ts", `
import { render, update, getCssText } from 'nuclo'
`)}
      <h3>Точки входа</h3>
      <ul>
        <li><code>nuclo</code>: регистрирует глобальные переменные и экспортирует 16 помощников, а также <code>getCssText</code> и <code>resetStyles</code>.</li>
        <li><code>nuclo/ssr</code>: <code>renderToString</code>, <code>renderManyToString</code>, <code>renderToStringWithContainer</code> и <code>getCssText</code>. См. <a href="#api-ssr">Рендеринг сервера </a>.</li>
        <li><code>nuclo/polyfill</code>: небольшой DOM для Node и Bun. См. <a href="#api-polyfill">nuclo/polyfill</a>.</li>
        <li><code>nuclo/types</code>: только типы. См. <a href="#typescript-setup">TypeScript</a>.</li>
      </ul>
    `,
      },
      {
        id: "typescript-setup",
        title: "TypeScript",
        content: `
      <p>Nuclo поставляет свои собственные типы. Вам нужны две вещи:</p>
      <ul>
        <li><code>"moduleResolution": "bundler"</code>. <code>node16</code> и <code>nodenext</code> пока не поддерживаются.</li>
        <li><code>DOM</code> lib. TypeScript включает его по умолчанию, если вы не установили <code>lib</code>.</li>
      </ul>
      <p>Если какой-либо файл в проекте импортирует <code>'nuclo'</code>, каждый файл видит глобальные типы. Вам больше ничего не нужно. Если ни один файл его не импортирует, например в отдельный tsconfig для тестов, добавьте типы самостоятельно:</p>
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
      <p>Или добавьте <code>/// &lt;reference types="nuclo/types" /&gt;</code> в файл <code>.d.ts</code>.</p>
      <h3>Полезные типы</h3>
      <p>Эти типы являются глобальными, поэтому их можно использовать без импорта:</p>
      <ul>
        <li><code>NodeModFn&lt;Tag&gt;</code>: что возвращает построитель тегов. Используйте его как возвращаемый тип компонента.</li>
        <li><code>NodeModLike&lt;Tag&gt;</code>: все, что конструктор тегов принимает в качестве аргумента.</li>
        <li><code>ExpandedElement&lt;Tag&gt;</code>: что возвращают <code>render()</code> и <code>hydrate()</code>.</li>
        <li><code>ElementTagName</code>: любое имя тега HTML.</li>
        <li><code>ExpandedElementAttributes&lt;Tag&gt;</code>: объект атрибута, который принимает построитель тегов, включая обработчики <code>on*</code>, <code>onMount</code> и <code>onDestroy</code>. Используйте его для компонентов, которые передают атрибуты.</li>
        <li><code>MountCallback</code> и <code>DestroyCallback</code>: обработчики <code>onMount</code> и <code>onDestroy</code>.</li>
        <li><code>WhenBuilder</code>, <code>ListModifier</code>: что возвращают <code>when()</code> и <code>list()</code>.</li>
        <li><code>RegionOptions</code>, <code>RegionType</code>: параметры, которые принимает <code>region()</code>.</li>
        <li><code>StyleResult</code>, <code>Style</code>, <code>ThemeConfig</code>, <code>CssInstance</code> и другие типы стилей. Вы также можете импортировать их: <code>import type { StyleResult } from 'nuclo'</code>.</li>
      </ul>
      ${code("badge.ts", `
function Badge(text: string): NodeModFn<'span'> {
  return span(text)
}
`)}
      <p><code>ExpandedElement&lt;Tag&gt;</code> помечает каждого члена DOM как необязательного. Используйте его, когда вам нужен полный тип элемента: <code>render(App, root) as HTMLDivElement</code>.</p>
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
        title: "Построители тегов",
        content: `
      <p>Каждый тег HTML представляет собой глобальную функцию с одинаковым именем: <code>div</code>, <code>span</code>, <code>input</code>,… Единственным исключением является <code>&lt;var&gt;</code>, который называется <code>var_</code>, поскольку <code>var</code> — зарезервированное слово. Каждый тег SVG имеет суффикс <code>Svg</code>: <code>svgSvg</code>, <code>pathSvg</code>, <code>circleSvg</code>,…</p>
      <p>Вызов построителя тегов еще не создает элемент. <code>div('Hi')</code> возвращает <strong>builder</strong>: функцию, которая создает элемент позже. Nuclo вызывает его, когда вы монтируете его с помощью <code>render()</code> или помещаете в другой сборщик, <code>when()</code> или <code>list()</code>. Каждое использование создает новый элемент.</p>
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
      <p>Сборщик принимает любое количество аргументов и применяет их слева направо:</p>
      <ul>
        <li><strong>строка, число, bigint</strong>: текстовый узел.</li>
        <li><strong><code>() =&gt; value</code></strong>: текст, который меняется на <code>update()</code>. См. <a href="#dynamic-functions">Динамические значения</a>.</li>
        <li><strong><code>null</code>, <code>undefined</code></strong>: пропущено.</li>
        <li><strong><code>true</code>, <code>false</code></strong>: отображается как текст «true» или «false». Используйте <code>when()</code> для условий.</li>
        <li><strong>A простой объект</strong>: атрибуты. См. <a href="#attributes">Attributes</a>.</li>
        <li><strong>A <code>css()</code>, <code>cx()</code> или <code>variants()</code> result</strong>: добавляет свои классы.</li>
        <li><strong><code>on(...)</code></strong>: прослушиватель событий или перехватчик жизненного цикла.</li>
        <li><strong>Другой строитель, <code>when()</code> или <code>list()</code></strong>: ребенок.</li>
        <li><strong>A DOM <code>Node</code></strong>: добавлено как есть.</li>
        <li><strong><code>(el, index) =&gt; …</code></strong>: пользовательский модификатор. См. ниже.</li>
      </ul>
      <h3>Есть ошибки</h3>
      <ul>
        <li><code>div(isAdmin &amp;&amp; span('Admin'))</code> отображает текст «false». Напишите <code>div(when(() =&gt; isAdmin, span('Admin')))</code>.</li>
        <li>Массивы не являются дочерними. Распространите их: <code>ul(...names.map((n) =&gt; li(n)))</code>. Для списков, которые изменяются, используйте <code>list()</code>.</li>
        <li>Локальная переменная с именем тега скрывает построитель. Внутри <code>function Row(label: string)</code> <code>label(...)</code> не может быть вызван. Переименуйте локальные объекты, такие как <code>label</code>, <code>title</code>, <code>data</code>, <code>p</code>, <code>a</code> и <code>i</code>.</li>
        <li>Браузеры предоставляют каждый элемент, имеющий <code>id</code>, как глобальную переменную. Если страница содержит <code>&lt;main id="main"&gt;</code> до загрузки Nuclo, Nuclo оставляет этот глобальный объект на месте, поэтому <code>main(...)</code> выдает <code>TypeError</code>. Используйте другие идентификаторы.</li>
      </ul>
      <h3>Пользовательские модификаторы</h3>
      <p>Функция, объявляющая хотя бы один параметр, выполняется один раз в порядке аргументов во время построения элемента. Его первый аргумент — это элемент. Второй — внутренний индекс, поэтому не полагайтесь на него. Если он возвращает строку или число, оно становится текстом. Добавляется <code>Node</code>. Объект применяется как атрибуты.</p>
      ${code("example.ts", `
const field = input((el) => {
  el.autocomplete = 'off'
})
`)}
      <h3>Получение элемента</h3>
      <p><code>render()</code> возвращает корневой элемент. Внутри дерева используйте <code>on("mount", (el) =&gt; …)</code> или собственный модификатор. Вы также можете самостоятельно вызвать функцию builder, чтобы создать отдельный элемент:</p>
      ${code("example.ts", `
const el = div('Hello')() as HTMLDivElement
document.body.append(el)
`)}
      <p>Прикрепите его перед следующим <code>update()</code>. Узел, которого нет в документе при запуске <code>update()</code>, перестает обновляться навсегда.</p>
      <h3>SVG</h3>
      <p>SVG придерживаются тех же аргументов. Nuclo устанавливает для каждого атрибута SVG значение <code>setAttribute</code>, поэтому такие имена, как <code>"stroke-width"</code>, работают так, как написано.</p>
      ${code("icon.ts", `
const Icon = () =>
  svgSvg(
    { viewBox: '0 0 24 24', width: 24, height: 24, className: 'icon' },
    circleSvg({ cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
  )
`)}
      <h3>Все строители</h3>
      <p><strong>HTML:</strong> a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre progress q rp rt ruby s samp script search section select slot small source span strong style sub summary sup table tbody td template textarea tfoot th thead time title tr track u ul var_ video wbr</p>
      <p><strong>SVG:</strong> aSvg animateSvg animateMotionSvg animateTransformSvg circleSvg clipPathSvg defsSvg descSvg ellipseSvg feBlendSvg feColorMatrixSvg feComponentTransferSvg feCompositeSvg feConvolveMatrixSvg feDiffuseLightingSvg feDisplacementMapSvg feDistantLightSvg feDropShadowSvg feFloodSvg feFuncASvg feFuncBSvg feFuncGSvg feFuncRSvg feGaussianBlurSvg feImageSvg feMergeSvg feMergeNodeSvg feMorphologySvg feOffsetSvg fePointLightSvg feSpecularLightingSvg feSpotLightSvg feTileSvg feTurbulenceSvg filterSvg foreignObjectSvg gSvg imageSvg lineSvg linearGradientSvg markerSvg maskSvg metadataSvg mpathSvg pathSvg patternSvg polygonSvg polylineSvg radialGradientSvg rectSvg scriptSvg setSvg stopSvg styleSvg svgSvg switchSvg symbolSvg textSvg textPathSvg titleSvg tspanSvg useSvg viewSvg</p>
    `,
      },
      {
        id: "components",
        title: "Компоненты",
        content: `
      <p>Компонент — это простая функция, возвращающая построитель, например <code>button(...)</code>. Компонента API нет. Ничто не создается до тех пор, пока вы не отрендерите его или не поместите в дерево.</p>
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
      <p>Состояние, объявленное внутри функции, принадлежит этому экземпляру. Состояние, объявленное снаружи, используется всеми экземплярами. <code>forceUpdate()</code> снова вызывает компоненты, что сбрасывает состояние, объявленное внутри них.</p>
      <p>Дети — это всего лишь аргументы:</p>
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
      <p>Передайте простой объект для установки атрибутов. Вы можете передать несколько объектов. Для того же ключа побеждает более позднее значение, за исключением <code>className</code> и <code>style</code>, которые объединяются. Значение может быть статическим или функцией без параметров, которая запускается снова при каждом <code>update()</code>.</p>
      ${code("example.ts", `
let busy = false

const save = button(
  { type: 'submit', disabled: () => busy, 'aria-busy': () => String(busy), 'data-id': 42 },
  'Save',
)
`)}
    `,
        afterContent: `
      <h3>Как устанавливается значение</h3>
      <ul>
        <li>Если элемент HTML имеет свойство с таким именем (<code>value</code>, <code>checked</code>, <code>disabled</code>, <code>htmlFor</code>, <code>tabIndex</code>, …), Nuclo устанавливает это свойство. В противном случае он вызывает <code>setAttribute(key, String(value))</code>, например для <code>"aria-*"</code> и <code>"data-*"</code>.</li>
        <li>В элементах SVG Nuclo всегда вызывает <code>setAttribute</code>.</li>
        <li><code>null</code> и <code>undefined</code> пропускаются. Динамическое значение, возвращающее <code>null</code> или <code>undefined</code>, сохраняет старое значение. Чтобы очистить значение, верните <code>""</code> или <code>false</code> для логического свойства.</li>
        <li>работают с логическими свойствами DOM, такими как <code>disabled</code> на кнопке, <code>checked</code>, <code>hidden</code> и <code>required</code>. В других местах <code>true</code> и <code>false</code> записываются как строки «true» и «false».</li>
        <li>Используйте ключи <code>"data-*"</code>. <code>dataset</code> не поддерживается.</li>
        <li><code>innerHTML</code> не экранирован, и серверный рендеринг не выводит его. Избегайте этого.</li>
      </ul>
      <h3>Классы</h3>
      <p>Используйте <code>className</code>. Строки статического класса, результаты <code>css()</code> и динамический <code>className</code> объединяются. Динамический <code>className</code> сохраняет статические классы, а когда он возвращает <code>""</code>, остаются только статические классы.</p>
      ${code("example.ts", `
let active = false
const base = css({ p: 8 })

const item = li(base, { className: 'item' }, { className: () => (active ? 'active' : '') }, 'Home')
// class="<base> item", then "<base> item active" after active = true; update()
`)}
      <p>Не используйте ключ <code>class</code> для элементов HTML. Он устанавливает необработанный атрибут и заменяет каждый примененный до него класс, включая классы <code>css()</code>.</p>
      <h3>Встроенные стили</h3>
      <p><code>style</code> принимает объект с ключами camelCase или функцию, которая его возвращает.</p>
      ${code("example.ts", `
let progress = 30

const bar = div({ style: () => ({ width: \`\${progress}%\`, backgroundColor: 'teal' }) })
`)}
      <ul>
        <li>Nuclo не добавляет юнитов. Пишите <code>"12px"</code>, а не <code>12</code>. Свойства без единиц измерения, такие как <code>opacity</code> и <code>zIndex</code>, принимают числа.</li>
        <li><code>""</code>, <code>null</code> и <code>undefined</code> очищают свойство.</li>
        <li>Динамический стиль устанавливает только те ключи, которые он возвращает. Ключ, который он перестает возвращать, сохраняет свое старое значение, поэтому верните <code>""</code>, чтобы очистить его.</li>
        <li>Строки стиля (<code>"color: red"</code>) и пользовательские свойства (<code>"--gap"</code>) не поддерживаются. Вместо этого используйте <code>css()</code>. Он принимает пользовательские свойства через <a href="#style-objects"><code>raw</code></a>.</li>
      </ul>
    `,
      },
      {
        id: "events",
        title: "События",
        content: `
      <p>Существует два способа прослушивания событий: атрибуты <code>on*</code> и модификатор <code>on()</code>.</p>
      <h3><code>on*</code> атрибуты</h3>
      <p>В объекте атрибута функция под ключом, например <code>onClick</code> (<code>on</code>, за которым следует заглавная буква), является обработчиком событий, а не динамическим значением.</p>
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
        <li>TypeScript определяет тип события на основе ключа и элемента. <code>e.currentTarget</code> и <code>this</code> — это элемент.</li>
        <li>Nuclo устанавливает собственное свойство, поэтому <code>onClick</code> становится <code>el.onclick</code>. Для каждого события существует один обработчик: более поздний <code>onClick</code> заменяет более ранний.</li>
        <li><code>onDoubleClick</code> и <code>onDblClick</code> означают <code>dblclick</code>. Ключи нижнего регистра, такие как <code>onclick</code>, являются ошибками типа.</li>
        <li>Имя, которое не является известным событием, прослушивает его строчную форму: <code>onMyEvent</code> прослушивает <code>"myevent"</code>.</li>
        <li>Ошибки, выдаваемые обработчиком, не перехватываются.</li>
      </ul>
    `,
        afterContent: `
      <h3><code>on()</code></h3>
      <p><code>on()</code> возвращает модификатор, который вызывает <code>addEventListener</code> для элемента.</p>
      ${code("panel.ts", `
const panel = div(
  on('scroll', onScroll, { passive: true }),
  on('click', logClick),
  on('click', closeMenu),
)
`)}
      <ul>
        <li>Каждый <code>on()</code> добавляет прослушиватель. Все бегут по порядку.</li>
        <li><code>options</code> переходит прямо к <code>addEventListener</code>: <code>capture</code>, <code>once</code>, <code>passive</code>, <code>signal</code>.</li>
        <li>Передайте <code>on()</code> непосредственно разработчику, и будет выведен тип элемента: <code>input(on('input', (e) =&gt; e.currentTarget.value))</code>.</li>
        <li>Если прослушиватель выдает ошибку, Nuclo регистрирует ошибку с помощью <code>console.error</code>, а другие прослушиватели продолжают работать.</li>
        <li>Nuclo удаляет прослушиватель при удалении элемента. На сервере <code>on()</code> ничего не делает.</li>
        <li>Одно значение <code>on()</code> можно повторно использовать во многих элементах.</li>
      </ul>
      <p>Для пользовательского события передайте тип события как общий:</p>
      ${code("picker.ts", `
type PickEvent = CustomEvent<{ id: number }>

const picker = ul(on<'pick', PickEvent>('pick', (e) => choose(e.detail.id)))
`)}
      <h3>Какой использовать</h3>
      <p>В обычном случае используйте атрибуты <code>on*</code>. Используйте <code>on()</code>, если вам нужно несколько прослушивателей для события, параметров прослушивателя или пользовательского имени события, например <code>"my-event"</code>.</p>
    `,
      },
      {
        id: "lifecycle",
        title: "Жизненный цикл",
        content: `
      <p><code>onMount</code> запускается один раз, после вставки элемента. <code>onDestroy</code> запускается один раз, когда Nuclo удаляет элемент. Запишите их как атрибуты или с помощью <code>on()</code>. Обе формы ведут себя одинаково, и элемент набирается из его тега.</p>
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
      <h3>Когда они бегут</h3>
      <ul>
        <li><code>onMount</code> выполняется в конце вызова <code>render()</code>, <code>hydrate()</code>, <code>update()</code> или <code>forceUpdate()</code>, который вставил элемент. Он никогда не запускается, пока строится дерево.</li>
        <li>Если <code>onMount</code> возвращает функцию, эта функция запускается при уничтожении после обратных вызовов элемента <code>onDestroy</code>.</li>
        <li><code>onDestroy</code> запускается, когда Nuclo удаляет элемент: строка <code>list()</code> удаляется, ветвь <code>when()</code> переключается, <code>into()</code> покидает свой регион или <code>forceUpdate()</code> удаляет его. Он запускается непосредственно перед удалением, поэтому элемент все еще находится в документе.</li>
      </ul>
      <h3>Удаление необработанного DOM</h3>
      <p>Если вы удаляете элемент самостоятельно с помощью <code>node.remove()</code> или <code>innerHTML = ''</code>, его <code>onDestroy</code> и очистка никогда не запускаются, а таймеры продолжают работать. Nuclo не имеет <code>unmount()</code>. Чтобы удалить приложение с помощью очистки, оберните его в <code>when()</code>:</p>
      ${code("main.ts", `
let mounted = true
render(() => div(when(() => mounted, App())), root)

mounted = false
update() // App's onDestroy hooks and cleanups run
`)}
      <h3>Порядок и ошибки</h3>
      <ul>
        <li>Вы можете зарегистрировать любое количество перехватчиков в любой форме. Они выполняются в порядке регистрации.</li>
        <li><code>onDestroy</code> всегда сначала запускает дочерние элементы, а затем родительский.</li>
        <li>монтируются в порядке их первого перехватчика <code>onMount</code>, который соответствует порядку аргументов, и каждый элемент запускает все свои перехватчики вместе. Передайте родительский хук перед его дочерними элементами, если они от него зависят.</li>
        <li>Крюк, который бросает, регистрируется с помощью <code>console.error</code>. Остальные крючки все еще работают.</li>
        <li>Обратный вызов не должен возвращать ничего или функцию очистки, поэтому не делайте его <code>async</code>. Возвращенное обещание никогда не используется для очистки. Запустите асинхронную работу внутри него: <code>{ onMount: (el) =&gt; { void load(el) } }</code>.</li>
        <li>Хуки никогда не запускаются на сервере. На клиенте они запускаются после <code>hydrate()</code>.</li>
      </ul>
      <div class="docs-callout"><strong>Примечание: </strong> Хуки не являются эффектами. Они никогда не запускаются снова, когда состояние меняется. Каждый из них запускается не более одного раза для каждого элемента.</div>
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
      <p>Nuclo никогда не обновляет страницу самостоятельно. Измените свой статус, а затем позвоните по <code>update()</code>.</p>
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
      <p>Измените столько состояний, сколько захотите, затем один раз вызовите <code>update()</code>:</p>
      ${code("example.ts", `
let first = 'Ada'
let last = 'Lovelace'

render(() => p(() => \`\${first} \${last}\`))

first = 'Grace'
last = 'Hopper'
update() // one pass, both changes
`)}
      <p>Вызовите <code>update()</code> из обработчиков событий, таймеров, обратных вызовов выборки или <code>onMount</code>. Не вызывайте его изнутри динамического значения.</p>
    `,
      },
      {
        id: "dynamic-functions",
        title: "Динамические значения",
        content: `
      <p>Функция с <strong>без параметров</strong> представляет собой динамическое значение <strong></strong>. Nuclo запускает его один раз при построении элемента и еще раз при каждом <code>update()</code>. Используйте динамические значения для дочерних элементов текста, значений атрибутов <code>style</code> и <code>className</code>. Для дочерних элементов, которые появляются, исчезают или повторяются, используйте <a href="#api-when"><code>when()</code></a> и <a href="#api-list"><code>list()</code></a>.</p>
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
      <p>Nuclo проверяет количество параметров (<code>fn.length</code>). Функция, объявляющая параметр, является пользовательским модификатором <a href="#tag-builders"></a> и выполняется только один раз. <code>(x = 0) =&gt; …</code> и <code>(...args) =&gt; …</code> имеют длину 0, поэтому они динамические.</p>
      <h3>Динамический текст</h3>
      <ul>
        <li>Строка, число, bigint или логическое значение отображается как <code>String(value)</code>. <code>() =&gt; ok &amp;&amp; 'Saved'</code> показывает «false», поэтому напишите <code>() =&gt; (ok ? 'Saved' : '')</code>.</li>
        <li><code>null</code> и <code>undefined</code> отображаются как пустой текст.</li>
        <li>Результат <code>css()</code> или <code>cx()</code> при первом запуске делает функцию динамическим классом, а не текстовым. См. <a href="#api-cx"><code>cx()</code></a>.</li>
        <li>Узел, построитель, массив или простой объект ничего не визуализирует и никогда не обновляет.</li>
      </ul>
      <h3>Динамические атрибуты</h3>
      <ul>
        <li>Nuclo записывает значение только в том случае, если оно отличается от последнего записанного Nuclo значения. Он не сравнивается с действующим DOM, поэтому, если пользователь вводит ввод, а ваша функция возвращает то же значение, что и раньше, введенный им текст остается.</li>
        <li>Результат <code>null</code> или <code>undefined</code> ничего не записывает, поэтому старое значение остается. <code>className</code> является исключением: любой ложный результат удаляет динамические классы и сохраняет статические.</li>
        <li>Функция <code>style</code> применяет возвращаемый объект при каждом обновлении.</li>
      </ul>
      <h3>Ошибки</h3>
      <p>Если выдается динамическое значение, Nuclo улавливает ошибку, и остальная часть обновления продолжает выполняться. Текст становится пустым или сохраняет свое старое значение, а атрибут сохраняет свое старое значение. Оба восстанавливаются при следующем успешном <code>update()</code>. Исключение: текстовая функция, которая выдает при запуске <strong>first</strong>, навсегда остается пустой.</p>
    `,
      },
      {
        id: "api-update",
        title: "update()",
        content: `
      <p>Выполняет один синхронный проход для каждого динамического значения на странице. При использовании идентификаторов обновляется только то, что находится внутри элементов, отмеченных этими идентификаторами <a href="#api-scope"><code>scope()</code></a>. Каждый проход выполняет эти шаги по порядку:</p>
      <ol>
        <li><code>list()</code>: снова считывает элементы и добавляет, перемещает или удаляет строки.</li>
        <li><code>when()</code>: снова проверяет условия. Ветка перестраивается только тогда, когда другая ветка становится активной.</li>
        <li>Динамические атрибуты, включая <code>style</code> и <code>className</code>.</li>
        <li>Динамический текст.</li>
        <li><code>onMount</code> для элементов, вставленных на шагах 1 и 2.</li>
      </ol>
      <ul>
        <li><strong>Он запускает все. </strong> Каждое динамическое значение выполняется при каждом вызове, даже если его данные не изменились. Пропускается только запись DOM. Сохраняйте динамические значения быстро и без побочных эффектов.</li>
        <li><strong>Только узлы в документе. </strong> Если во время запуска <code>update()</code> узла нет в документе, Nuclo прекращает его отслеживание. Он больше никогда не обновляется, даже после того, как вы его прикрепите. Это относится и к <code>list()</code> и <code>when()</code>. Выполните рендеринг в контейнер, который находится в документе.</li>
        <li><strong>Статические значения никогда не меняются. </strong> Простые строки и значения атрибутов фиксируются при построении элемента. Чтобы их пересобрать, используйте <a href="#api-force-update"><code>forceUpdate()</code></a>.</li>
        <li><strong>Errors.</strong> Ошибки текста и атрибутов перехватываются, и передача продолжается. Если возникает условие <code>when()</code>, ошибка регистрируется и <code>when()</code> прекращает обновление. Если функция <code>list()</code> <code>items</code> или <code>renderItem</code> выдает ошибку, ошибка переходит в <code>update()</code>, а остальные шаги не выполняются.</li>
        <li><strong>Server.</strong> <code>update()</code> ничего не делает на сервере.</li>
      </ul>
    `,
      },
      {
        id: "api-scope",
        title: "scope()",
        content: `
      <p>Предоставляет элементу, которому он передается, один или несколько идентификаторов области. <code>update('id')</code> затем обновляет только то, что находится внутри этого элемента, включая собственные атрибуты элемента.</p>
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
        <li>Элемент может иметь несколько идентификаторов: <code>scope('cart', 'sidebar')</code>.</li>
        <li><code>update('a', 'b')</code> обновляет все внутри <code>a</code> или <code>b</code>. Если несколько элементов используют один и тот же идентификатор, все они обновляются.</li>
        <li>При использовании вложенных областей <code>update('outer')</code> включает внутреннюю область. <code>update('inner')</code> не касается внешнего.</li>
        <li>Идентификатор того, что ни один элемент в документе не имеет обновлений <strong>nothing</strong> и не вызывает ошибок, поэтому проверьте написание.</li>
        <li><code>scope()</code> ничего не делает на сервере.</li>
      </ul>
    `,
      },
      {
        id: "api-when",
        title: "when()",
        content: `
      <p>Отрисовывает содержимое на основе условия. Nuclo снова проверяет условия на каждом <code>update()</code>. Первое истинное условие побеждает. Если ни одно из них не соответствует действительности, отображается содержимое <code>.else()</code>. Без <code>.else()</code> ничего не рендерится.</p>
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
        <li>Для состояния передайте функцию. Простое логическое значение считывается один раз: <code>when(open, …)</code> никогда не изменяется.</li>
        <li>В TypeScript функция должна возвращать логическое значение. Напишите <code>() =&gt; items.length &gt; 0</code> или <code>() =&gt; user != null</code>.</li>
      </ul>
      <h3>Какие обновления</h3>
      <ul>
        <li>Пока одна и та же ветка остается активной, ее элементы сохраняются. Динамические значения, списки и блоки <code>when()</code> внутри него постоянно обновляются.</li>
        <li>Когда другая ветка становится активной, старое содержимое удаляется и запускаются ее перехватчики <code>onDestroy</code>. Новая ветка создается с нуля, и ее перехватчики <code>onMount</code> работают. Состояние старых элементов, таких как вводимый текст или фокус, теряется.</li>
      </ul>
      <h3>Содержимое ветки</h3>
      <p>Поместите дочерние элементы в ветку: текст, динамический текст, строители, <code>list()</code> и вложенный <code>when()</code>. Передайте сборщики, такие как <code>p('Hi')</code>, а не узлы DOM: узел DOM перестает обновляться после того, как его ветвь скрывается один раз.</p>
      <p>и <code>on()</code> в ветке применяются к родительскому элементу и остаются после скрытия ветки. В качестве условного атрибута используйте динамический атрибут: <code>{ className: () =&gt; (active ? 'active' : '') }</code>.</p>
      <h3>Цепочка</h3>
      <p><code>.when()</code> и <code>.else()</code> возвращают новую сборку и не меняют оригинал. Если вы вызовете <code>.else()</code> дважды, победит последний вызов.</p>
    `,
      },
      {
        id: "api-list",
        title: "list()",
        content: `
      <p>Отрисовывает одну строку для каждого элемента. В каждом <code>update()</code> Nuclo снова вызывает <code>items()</code> и сопоставляет новые элементы с существующими строками по идентификатору (<code>===</code>).</p>
      ${code("fruits.ts", `
let fruits = ['Apple', 'Banana']

const Fruits = () => ul(list(() => fruits, (fruit) => li(fruit)))

render(Fruits)

fruits.push('Cherry')
update()
`)}
      <h3>Как сопоставляются строки</h3>
      <ul>
        <li>Элемент, который все еще существует, сохраняет свою строку. Nuclo перемещает строку, если это необходимо, и больше не вызывает <code>renderItem</code>.</li>
        <li>Новый элемент получает новую строку. Удаленный элемент теряет свою строку, и его перехватчики <code>onDestroy</code> выполняются.</li>
        <li>Каждому повторяющемуся элементу присваивается отдельная строка.</li>
        <li>Вы можете изменить массив на месте (<code>push</code>, <code>splice</code>, <code>sort</code>) или вернуть новый массив.</li>
      </ul>
      <p>Сохраненная строка никогда не отображается повторно, поэтому используйте динамические значения для изменяющихся полей:</p>
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
      <p>Копии — это новые элементы, поэтому замена массива на <code>todos.map((t) =&gt; ({ ...t }))</code> перестраивает каждую строку.</p>
    `,
        afterContent: `
      <h3>Что возвращает <code>renderItem</code></h3>
      <ul>
        <li>Возвращает один элемент, например <code>li(...)</code>, <code>tr(...)</code> или построитель SVG. Верните <code>null</code> или <code>undefined</code>, чтобы пропустить элемент. Строки, текстовые узлы и фрагменты ничего не отображают.</li>
        <li>Не возвращайте <code>when()</code> или <code>list()</code> напрямую. Поместите их внутри элемента строки: <code>li(todo.text, when(() =&gt; todo.done, ' ✓'))</code>.</li>
        <li>Чтобы скрыть элементы, фильтруйте по <code>items()</code>, а не по <code>renderItem</code>.</li>
        <li>Берегите <code>renderItem</code> от побочных эффектов. Nuclo может вызывать его несколько раз для одного и того же элемента.</li>
      </ul>
      <h3>Индекс</h3>
      <p><code>index</code> — это позиция элемента на момент создания его строки. Он не обновляется при перемещении строк. Для текущей позиции используйте динамическое значение: <code>li(() =&gt; \`\${names.indexOf(name) + 1}. \${name}\`)</code>.</p>
      <h3>Итерации</h3>
      <p>Работает любая итерация: массивы, <code>Set</code>, генераторы и <code>map.values()</code>. Возврат одного и того же массива или <code>Set</code> каждый раз — это нормально. Итератор, такой как генератор или <code>map.values()</code>, используется за один проход, поэтому создавайте его внутри <code>items()</code> при каждом вызове. Итерация <code>Map</code> каждый раз напрямую создает новые массивы <code>[key, value]</code>, поэтому каждая строка перестраивается. Вместо этого используйте <code>map.values()</code>.</p>
      <h3>Размещение</h3>
      <p>Строки появляются там, где <code>list()</code> находится среди своих одноуровневых элементов, между двумя маркерами комментариев. Других детей родителя не трогают. <code>list()</code> также работает внутри сборщиков SVG.</p>
    `,
      },
      {
        id: "api-region",
        title: "region() и into()",
        content: `
      <p><code>region()</code> отмечает именованное место в дереве. <code>into()</code> заполняет его откуда угодно, на любой глубине. Макет не получает контент в качестве реквизита, а компонент, создающий контент, не знает, где он находится.</p>
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
        <li><code>into()</code> оставляет только комментарий там, где это написано. Его содержимое отображается между маркерами региона.</li>
        <li>Порядок не имеет значения. <code>into()</code>, созданный до того, как его регион, ждет и показывает момент создания региона. Просмотры отображаются в том порядке, в котором они были написаны.</li>
        <li>Содержимое существует до тех пор, пока отображается изображение. Когда <code>when()</code>, содержащий <code>into()</code>, закрывается или его строка <code>list()</code> удаляется, содержимое покидает регион. При повторном открытии добавляется одна копия, а не две.</li>
        <li>Когда регион исчезает, например закрывается <code>when()</code>, его представления снова ждут. Их показывает регион, созданный позже с тем же идентификатором.</li>
        <li><code>into()</code>, идентификатор которого не соответствует ни одному региону, ничего не отображает и не выдает ошибок, поэтому проверьте правильность написания.</li>
        <li>Идентификаторы уникальны в дереве. Второй регион, созданный под живым идентификатором, регистрирует предупреждение.</li>
        <li>работают с сервером рендеринга <a href="#api-ssr"></a>. В <code>hydrate()</code> каждое представление требует HTML, который сервер визуализировал, вместо того, чтобы создавать его заново.</li>
      </ul>
      <h3>Опции</h3>
      <ul>
        <li><code>id</code>: имя, которое вызывает <code>into()</code>, используется для поиска региона.</li>
        <li><code>type</code>: <code>'latest'</code> (по умолчанию) показывает только самое новое представление. <code>'stack'</code> показывает все представления в порядке поступления.</li>
        <li><code>empty</code>: отображается, когда в регионе нет представлений.</li>
      </ul>
      <h3>Сложные регионы</h3>
      <p>При использовании <code>type: 'stack'</code> вид, открывающийся поверх другого, не перестраивает вид, расположенный под ним. Его DOM, фокус и форма пребывания в штате. Используйте это для такого слоя, как диалог на странице.</p>
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
      <p>Передайте объект для заполнения более чем одной области из одного <code>into()</code>. Значением может быть один дочерний элемент или массив дочерних элементов. Любая форма вложена: <code>into()</code> внутри содержимого другого представления нацелен на свой собственный регион.</p>
      ${code("page.ts", `
const Page = () =>
  into({
    main: article(h1('Eager route')),
    sidebar: [h2('Related'), ul(li('One'), li('Two'))],
  })
`)}
      <h3>Диалоговое окно, открытое из глубины дерева.</h3>
      <p>Область наложения находится в корне. Любой компонент на любой глубине открывает диалоговое окно, заключая <code>into()</code> в <code>when()</code>. Закрытие <code>when()</code> удаляет диалоговое окно из региона.</p>
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
      <p>Каждая строка <code>list()</code> представляет собой представление. В составной области они отображаются по порядку, а удаление элемента из массива удаляет его всплывающее уведомление.</p>
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
      <h3>Заголовок страницы, заданный страницей.</h3>
      <p>При использовании <code>type: 'latest'</code> по умолчанию побеждает новейшее представление. Макету принадлежит заголовок, и какая бы страница ни была открыта, он получает имя. На странице без <code>into('title', …)</code> остается текст <code>empty</code>.</p>
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
      <p>Содержимое <code>into()</code> является обычным содержимым Nuclo. Функции в нем представляют собой значения, зависящие от состояния, и обновляются на <code>update()</code>, где бы ни находился регион.</p>
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
      <p><code>into()</code> приборной панели записывается один раз. Пока пользователь вышел из системы, региона <code>main</code> нет, поэтому представление ожидает. При входе в систему создается регион, и отображается представление. При выходе из системы регион удаляется, и представление снова ожидает.</p>
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
      <h3>Вид со своим регионом</h3>
      <p>Представление может содержать <code>region()</code>, и другие представления могут нацеливаться на него. Здесь страница редактора содержит регион <code>tabs</code>, и каждая вкладка заполняет его. Когда редактор закрывается, его регион закрывается вместе с ним.</p>
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
      <p><code>update()</code> обрабатывает только динамические значения. Статические значения, такие как текст в <code>h1(labels[lang].title)</code>, фиксируются при построении дерева. <code>forceUpdate()</code> снова вызывает ваши компоненты и исправляет работающий DOM, чтобы он соответствовал, включая статические значения. Используйте его для редких изменений всего приложения, таких как переключение языка. Для всего остального используйте <code>update()</code>.</p>
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
      <p>Без аргументов <code>forceUpdate()</code> перестраивает каждый корень, отображаемый с помощью <code>render(App)</code> или <code>hydrate(App)</code>. Корни, визуализированные с помощью <code>render(App())</code>, пропускаются. Если компонент выдает ошибку, ошибка регистрируется, и этот корень сохраняет свой старый DOM. Ошибка, возникающая позже, при применении новой сборки, также регистрируется, но уже исправленные части остаются исправленными.</p>
      <h3>Что остается, а что меняется</h3>
      <ul>
        <li>Дочерние элементы сопоставляются по порядку, по тегам. Соответствующий элемент используется повторно, поэтому фокус и введенные входные значения остаются, а его перехватчики <code>onMount</code> больше не запускаются. Как только тег одного дочернего элемента отличается, этот дочерний элемент и все последующие братья и сестры создаются заново.</li>
        <li>Текст, атрибуты, классы, стили, прослушиватели, ветки <code>when()</code> и строки <code>list()</code> соответствуют новой сборке.</li>
        <li>Создаются новые элементы и запускаются их перехватчики <code>onMount</code>. Элементы, которые новая сборка больше не создает, удаляются, и их перехватчики <code>onDestroy</code> запускаются.</li>
        <li><code>list()</code> также сопоставляются по положению, а не по элементу, поэтому повторно используемый элемент строки может в конечном итоге отображать другой элемент.</li>
        <li>Атрибуты новой сборки больше не устанавливаются и не удаляются.</li>
      </ul>
      <div class="docs-callout"><strong>Осторожно: состояние </strong>, объявленное внутри функции компонента, сбрасывается, поскольку функция запускается снова. Сохранять состояние, которое должно сохраняться вне компонента.</div>
      <p><strong>Явная форма.</strong> <code>forceUpdate(App(), parent)</code> перестраивает одно дерево в <code>parent</code> и возвращает его корень. Он не прописывает рут для последующих вызовов. Как и <code>hydrate()</code>, он ожидает, что корнем будет первый узел в <code>parent</code>. Если первый узел имеет другой тег, он заменяется.</p>
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
      <p>Строит дерево и добавляет его корневой элемент в <code>parent</code>. <code>parent</code> по умолчанию равен <code>document.body</code>. Он возвращает корневой элемент.</p>
      ${code("main.ts", `
import 'nuclo'
import { App } from './app.ts'

render(App, document.getElementById('app')!)
`)}
      <ul>
        <li>Вы можете передать компонент (<code>render(App)</code>) или возвращаемый им построитель (<code>render(App())</code>). DOM то же самое. Только <code>render(App)</code> позволяет <a href="#api-force-update"><code>forceUpdate()</code></a> позже пересобрать корень, поэтому предпочтите его.</li>
        <li>Добавляет. Он не очищает <code>parent</code>, поэтому его двойной вызов добавляет две копии.</li>
        <li>Каждый <code>onMount</code> в дереве был запущен, когда <code>render()</code> вернулся.</li>
        <li>Рендеринг в элемент, который находится в документе. См. <a href="#api-update"><code>update()</code></a>.</li>
        <li>Корнем должен быть элемент, например <code>div(...)</code>, а не <code>when()</code> или <code>list()</code>.</li>
        <li><code>index</code> является внутренним. Он не выбирает, куда вставлять элемент. Оставьте это.</li>
      </ul>
      <p>Компонент, передаваемый как <code>render(App)</code>, не должен принимать никаких параметров. Обязательный параметр является ошибкой типа. Необязательный проверяет тип, но <code>render()</code> выдает ошибку во время выполнения. Оберните компонент, который принимает реквизит:</p>
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
      <p>заменяет HTML, созданный <a href="#api-ssr"><code>renderToString()</code></a>. Он повторно использует существующие элементы, подключает прослушиватели событий и подключает динамические значения <code>when()</code> и <code>list()</code>, поэтому <code>update()</code> работает позже. Затем он запускает перехватчики <code>onMount</code>. <code>parent</code> по умолчанию равен <code>document.body</code>. Он возвращает корневой элемент.</p>
      ${code("client.ts", `
import 'nuclo'
import { App } from './app.ts'

hydrate(App, document.getElementById('root')!)
`)}
      <ul>
        <li>Используйте тот же компонент и те же данные, что и сервер.</li>
        <li>Гидратируйте в специальный контейнер. Корнем приложения должен быть его первый узел, хотя пробелы допустимы. Если первым появляется другой узел, Nuclo заменяет этот узел и оставляет копию сервера.</li>
        <li>Как и в случае с <code>render()</code>, передайте <code>App</code>, а не <code>App()</code>, чтобы <code>forceUpdate()</code> мог позже пересобрать корень. <code>App</code> не должен принимать никаких параметров. С дополнительным <code>hydrate()</code> ничего не прикрепляет. Оберните компонент, который принимает реквизиты: <code>hydrate(() =&gt; Page(props), root)</code>.</li>
        <li>Если сервера HTML нет, используйте <code>render()</code>.</li>
      </ul>
      <h3>Когда сервер и клиент различаются</h3>
      <p>Клиент выигрывает:</p>
      <ul>
        <li>Другой корневой тег: этот узел заменяется новым DOM. Пустой контейнер: добавлен свежий DOM.</li>
        <li>Исправлен другой текст. Различные элементы <code>list()</code> и ветки <code>when()</code> следуют за клиентом.</li>
        <li>Дополнительные дочерние серверы удаляются и создаются недостающие.</li>
        <li>Атрибуты, которые записал сервер, но не установил клиент, остаются без изменений.</li>
      </ul>
      <p><code>renderToString()</code> записывает комментарии HTML в качестве маркеров, например <code>&lt;!-- text-0 --&gt;</code>, перед каждым текстовым узлом. Они нужны <code>hydrate()</code>, поэтому не удаляйте комментарии с сервера HTML. Без маркеров гидратация удаляет строки <code>list()</code>, а <code>list()</code> и <code>when()</code> прекращают обновление.</p>
    `,
      },
      {
        id: "api-ssr",
        title: "Серверный рендеринг",
        content: `
      <p>Преобразуйте компонент в строку HTML на сервере. В браузере вызовите <a href="#api-hydrate"><code>hydrate()</code></a> с тем же компонентом, чтобы сделать HTML интерактивным. Среды выполнения сервера не имеют <code>document</code>, поэтому сначала импортируйте <a href="#api-polyfill"><code>nuclo/polyfill</code></a>.</p>
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
      <p>Оставьте <code>id="nuclo-styles"</code> в теге стиля. Клиент повторно использует этот элемент и добавляет только новые правила. См. <a href="#api-css-text"><code>getCssText()</code></a>.</p>
      <h3>Что работает на сервере</h3>
      <ul>
        <li>Каждый вызов <code>renderToString()</code> строит дерево и запускает каждое динамическое значение один раз.</li>
        <li>Обработчики событий <code>onMount</code> и <code>onDestroy</code> никогда не запускаются. <code>update()</code>, <code>scope()</code> и <code>forceUpdate()</code> ничего не делают.</li>
        <li>Рендеринг синхронный. Сначала загрузите данные, затем выполните рендеринг.</li>
        <li>После рендеринга ничего не остается зарегистрированным, поэтому один процесс может обслуживать множество запросов. Передавайте данные запроса в качестве аргументов, например <code>renderToString(Page(user))</code>. Переменные уровня модуля используются всеми запросами.</li>
        <li>Не вызывайте <code>render()</code> на сервере. Он добавляется к общему <code>document.body</code>.</li>
      </ul>
      <h3><code>renderToString()</code></h3>
      <p>Принимает построитель (<code>App()</code>), компонент (<code>App</code>) или узел DOM. <code>null</code> и <code>undefined</code> возвращают <code>""</code>. Корень должен быть элементом. Компонент, передаваемый как <code>renderToString(Page)</code>, не должен принимать никаких параметров, поэтому передайте <code>Page(user)</code> для компонента, который принимает данные.</p>
      ${code("example.ts", `
renderToString(p('Hello'))
// '<p><!-- text-0 -->Hello</p>'
`)}
      <ul>
        <li>Значения текста и атрибутов экранируются HTML. Текст внутри <code>script()</code> и <code>style()</code> записывается как есть, с разбитыми только закрывающими тегами, поэтому никогда не помещайте туда пользовательский ввод.</li>
        <li>Не кидает. Если компонент, функция <code>list()</code> или условие <code>when()</code> выдает ошибку или полифилл отсутствует, он регистрирует ошибку и возвращает <code>""</code>. Проверьте пустой результат, если запрос не будет выполнен. Текстовая или атрибутивная функция, которая выдает только результат, отображается пустой.</li>
      </ul>
      <h3><code>renderManyToString()</code></h3>
      <p>То же, что <code>inputs.map(renderToString)</code>.</p>
      <h3><code>renderToStringWithContainer()</code></h3>
      <p>Заключает вывод в один элемент. Для <code>containerTag</code> по умолчанию используется <code>"div"</code>, а для <code>containerAttrs</code> — <code>{}</code>. Значения атрибутов экранируются. Имена атрибутов записываются как задано, поэтому используйте имена HTML, например <code>class</code>. Никогда не передавайте пользовательский ввод в качестве тега.</p>
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
      <p>Небольшой DOM, поэтому Nuclo может строить деревья в Node и Bun. Импортируйте его один раз, перед первым рендерингом. Большинству приложений требуется только простой импорт.</p>
      <ul>
        <li>При отсутствии <code>window</code> устанавливаются <code>globalThis.document</code>, <code>Node</code>, <code>Element</code> и <code>HTMLElement</code>, но только те, которые отсутствуют. Он не создает <code>window</code>.</li>
        <li>В браузере или под jsdom ничего не делает.</li>
        <li><code>Event</code> и <code>CustomEvent</code> — собственные конструкторы среды выполнения. <code>Node</code>, <code>Element</code> и <code>HTMLElement</code> — это псевдонимы классов полифиллов.</li>
      </ul>
      <p>Это DOM для построения деревьев, а не браузер. У него нет <code>innerHTML</code> и <code>getElementById</code>, <code>querySelector()</code> возвращает <code>null</code>, а прослушиватели событий игнорируются. Используйте <code>renderToString()</code>, чтобы получить HTML.</p>
    `,
      },
    ],
  },

  // ── Styling ──────────────────────────────────────────────────────────────
];
