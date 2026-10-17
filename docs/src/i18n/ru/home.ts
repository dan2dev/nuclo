// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · без зависимостей`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Создавайте интерфейсы", "с *явными* обновлениями", "на nuclo."];

export const HERO_DESC =
  "Небольшой типобезопасный DOM-фреймворк. Состояние остаётся обычным и изменяемым. Вы управляете каждым обновлением. Без прокси, сигналов и виртуального DOM.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "зависимостей" },
  { num: "175", sup: "",   label: "типизированных построителей HTML и SVG" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "ядро среды выполнения, gzip" },
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
  "Когда вы изменяете состояние, ничего не происходит. Вызовите update(), и Nuclo сделает ровно то, что вы попросили. Ни больше ни меньше.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Явное лучше неявного",
    desc: "Прокси не отслеживают каждый ваш шаг. Вы изменяете состояние, затем вызываете update(). Причина и следствие остаются ясными и предсказуемыми.",
  },
  {
    num: "02",
    title: "Меняйте свободно, обновляйте один раз",
    desc: "Внесите десять изменений, затем один раз вызовите update(). DOM увидит только итоговое состояние. Лишнего рендеринга нет.",
  },
  {
    num: "03",
    title: "Функции вместо компонентов",
    desc: "Используйте обычные функции JavaScript. Nuclo не требует классов, декораторов и специального синтаксиса. Каждая функция возвращает узлы DOM. Добавляйте onMount и onDestroy как обычные модификаторы, только когда они нужны.",
  },
];

export const FEATURES = [
  {
    num: "01 · Явность",
    title: "Вы управляете циклом обновления",
    desc: "Меняйте состояние свободно, затем один раз вызывайте update(). Nuclo не требует подписок и планировщиков и не удивляет неожиданным сравнением деревьев. DOM синхронизируется по вашему решению.",
  },
  {
    num: "02 · Лёгкость",
    title: "Без зависимостей",
    desc: `Ядро среды выполнения занимает около ${NUCLO_GZIP_KB} КБ в gzip. Nuclo не требует компилятора и плагинов сборки. Добавьте один импорт и начинайте.`,
  },
  {
    num: "03 · Типизация",
    title: "Создано для TypeScript",
    desc: "175 полностью типизированных построителей HTML и SVG дают автодополнение для каждого атрибута, свойства стиля и события.",
  },
  {
    num: "04 · Точность",
    title: "Точечные изменения",
    desc: "Динамические выражения вычисляются заново при update(). DOM затрагивают только действительно изменившиеся значения.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Изменение",
    title: "Измените данные",
    desc: "Состояние — обычный JavaScript: переменные, массивы, объекты. Меняйте его как угодно и сколько угодно раз.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Применение",
    title: "Вызовите update()",
    desc: "Одна глобальная функция применяет изменения. Внесите несколько изменений, затем примените их одним вызовом. До вашей команды ничего не рендерится.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Обновление",
    title: "Nuclo синхронизирует DOM",
    desc: "Каждое динамическое выражение вычисляется заново. Nuclo записывает в DOM только действительно изменившиеся значения. Без сравнения деревьев и повторного рендеринга.",
    code: `<span class="cm">// изменены 2 узла,</span>
<span class="cm">// всё остальное не затронуто</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Без сравнения деревьев. Без прокси. Без сюрпризов.";
export const COMPARISON_SUB =
  "Nuclo обновляет интерфейс, только когда вы вызываете update().";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "Виртуальный DOM",
    sub: "рендеринг → сравнение → применение",
    items: [
      { good: false, text: "Повторно рендерит деревья компонентов при каждом изменении состояния" },
      { good: false, text: "Сравнивает старое и новое деревья в поисках изменений" },
      { good: false, text: "Требует мемоизации, чтобы вернуть производительность" },
      { good: false, text: "Оставляет устаревшие замыкания и массивы зависимостей" },
    ],
  },
  {
    name: "Сигналы и прокси",
    sub: "сигналы · хранилища · эффекты",
    items: [
      { good: false, text: "Оборачивает состояние в прокси и подписки" },
      { good: false, text: "Незаметно отслеживает зависимости во время выполнения" },
      { good: false, text: "Запускает каскады обновлений по неподконтрольному вам расписанию" },
      { good: false, text: "Усложняет пошаговую отладку" },
    ],
  },
  {
    name: "Nuclo",
    sub: "изменение → update()",
    featured: true,
    items: [
      { good: true, text: "Обычное изменяемое состояние без обёрток и прокси" },
      { good: true, text: "Один вызов update() — вся модель работы" },
      { good: true, text: "Меняет только изменившиеся значения" },
      { good: true, text: `Около ${NUCLO_GZIP_KB} КБ, без зависимостей, создано для TypeScript` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Быстро там, где это важно.";
export const BENCHMARK_SUB =
  "Независимые результаты js-framework-benchmark: создание, обновление, перестановка и удаление тысяч строк.";

export const BENCHMARK_NOTE =
  "Оценка показывает замедление относительно самой быстрой измеренной реализации. Это взвешенное геометрическое среднее всех тестов с ключами.";

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
export const CTA_TITLE = "Начинайте, когда будете готовы.";
export const CTA_SUB =
  "Установите Nuclo, импортируйте один раз и создавайте UI, который обновляется ровно по вашей команде. Весь API можно изучить за полдня.";

export const QUICK_START_STEPS = [
  {
    num: "01 - УСТАНОВКА",
    title: "Установите",
    desc: "Добавьте Nuclo в проект с помощью npm, pnpm, yarn или bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - ИМПОРТ",
    title: "Импортируйте",
    desc: "Один импорт ради побочного эффекта регистрирует все 175 построителей тегов глобально.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - СОЗДАНИЕ",
    title: "Создавайте",
    desc: "Пишите обычные функции, возвращающие узлы DOM. Вызывайте update() при изменении состояния.",
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
  getStarted: "Начать",
  viewExamples: "Посмотреть примеры",
  copyInstall: "Копировать команду установки",
  howItWorks: "Как это работает",
  pipelineTitle: "Один явный цикл.",
  pipelineSub: "Значения зависят от состояния, но графа зависимостей и планировщика нет. Вы решаете, когда их вычислять: один предсказуемый путь от данных до экрана.",
  philosophy: "Философия",
  features: "Возможности",
  featuresTitle: "Создано для ясности.",
  featuresSub: "Без магии и сюрпризов. Каждое обновление намеренно.",
  comparison: "Сравнение",
  theNucloWay: "подход nuclo",
  benchmarks: "Тесты производительности",
  lowerIsBetter: "Меньше — лучше",
  benchmarkSource: "Источник: js-framework-benchmark",
  quickStart: "Быстрый старт",
  quickStartTitle: "Запуск за несколько минут.",
  quickStartSub: "Три шага — и вы создаёте настоящий UI.",
  readFullDocs: "Читать всю документацию →",
  examples: "Примеры",
  examplesTitle: "Посмотрите в действии.",
  examplesSub: "Интерактивные демонстрации. Изучите код каждой из них.",
  viewAllExamples: "Все примеры →",
  readTheDocs: "Читать документацию",
  addATask: "Добавить задачу…",
  add: "Добавить",
  reset: "Сбросить",
  // The hero card
  previousExample: "Предыдущий пример",
  nextExample: "Следующий пример",
  closeCodeView: "Закрыть просмотр кода",
  example: (n: number, title: string) => `Пример ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Нарисуйте, затем обновите",
    note: "Сетка слева — обычный массив логических значений: рисование лишь изменяет данные. DOM справа меняется только при update(), причём обновляются лишь изменившиеся ячейки.",
  },
  Draw: {
    title: "Нарисуйте знак",
    note: "Знак Nuclo — спирограф: колесо катится внутри кольца, на нём два пера. Колесо, рычаги, перья и линии зависят от одного числа t. Шкала времени и цикл кадров лишь задают t; update('draw') заново выполняет функции, которые его читают.",
  },
  Fireworks: {
    title: "Нажмите на небо",
    note: "Каждая искра — обычный объект в массиве. list() создаёт для него <line> и удаляет его в тот кадр, когда объект покидает массив. Один update() на кадр, без сравнения деревьев.",
  },
  Waves: {
    title: "Изогните волну",
    note: "Атрибут d каждого пути — обычная функция трёх чисел. Ползунки и цикл кадров меняют только числа; update('waves') заново выполняет читающие их функции.",
  },
  Sort: {
    title: "Сортировка без пересоздания",
    note: "Пузырьковая сортировка меняет местами объекты в обычном массиве. list() связывает каждый столбец с его объектом, поэтому update() перемещает существующие узлы в новый порядок. Следите за счётчиком: столбцы никогда не пересоздаются.",
  },
  Chase: {
    title: "Ведите верёвку",
    note: "Карточка — это scope(). Каждый кадр перемещает 32 обычные точки и вызывает update('chase'): Nuclo пересчитывает атрибуты этой карточки, не затрагивая остальную страницу.",
  },
  Reflex: {
    title: "Нажмите на зелёный",
    note: "Одна обычная строка определяет содержимое сцены. Ветвь when() создаётся, когда её условие становится истинным, и удаляется, когда оно перестаёт выполняться; класс сцены зависит от той же строки.",
  },
  Warp: {
    title: "Удерживайте для искривления",
    note: "onMount запускает цикл кадров и возвращает функцию очистки. При размонтировании поля Nuclo вызывает её: цикл останавливается, работающих задач не остаётся.",
  },
  Life: {
    title: "Игра «Жизнь»",
    note: "Поле — обычный массив возрастов. Каждый такт вычисляет следующий массив и вызывает update(); класс ячейки зависит от её возраста, поэтому меняются только изменившиеся ячейки.",
  },
};
