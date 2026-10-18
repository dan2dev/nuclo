// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · без зависимостей`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["Создавайте *явные*", "интерфейсы", "на nuclo."];

export const HERO_DESC =
  "Компактный DOM-фреймворк с полной типизацией. Состояние — обычные изменяемые переменные, а когда обновлять экран, решаете вы. Никаких прокси, сигналов и virtual DOM.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "зависимостей" },
  { num: "175", sup: "",   label: "типизированных билдеров для HTML и SVG" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "ядро в gzip" },
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
  "Поменяли состояние — ничего не произошло. Вызвали update() — и Nuclo сделал ровно то, о чём вы просили. Не больше и не меньше.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "Явное лучше неявного",
    desc: "Никаких прокси, которые следят за каждым вашим движением. Вы меняете состояние, затем вызываете update(). Причина и следствие понятны и предсказуемы.",
  },
  {
    num: "02",
    title: "Меняйте сколько угодно, обновляйте один раз",
    desc: "Десять правок подряд, а потом один update(). DOM увидит только итог, и ни одного лишнего рендера.",
  },
  {
    num: "03",
    title: "Функции, а не компоненты",
    desc: "Обычные функции JavaScript — без классов, декораторов и особого синтаксиса. Каждая возвращает узлы DOM. А onMount и onDestroy подключаются как обычные модификаторы, только когда действительно нужны.",
  },
];

export const FEATURES = [
  {
    num: "01 · Явность",
    title: "Цикл обновления — в ваших руках",
    desc: "Меняйте состояние как удобно и вызывайте update() один раз. Ни подписок, ни планировщика, ни внезапного сравнения деревьев: DOM синхронизируется тогда, когда решите вы.",
  },
  {
    num: "02 · Лёгкость",
    title: "Ноль зависимостей",
    desc: `Ядро весит около ${NUCLO_GZIP_KB} КБ в gzip. Ни компилятора, ни плагинов для сборки: один импорт — и можно писать.`,
  },
  {
    num: "03 · Типизация",
    title: "Родной TypeScript",
    desc: "175 полностью типизированных билдеров HTML- и SVG-элементов: автодополнение для каждого атрибута, CSS-свойства и события.",
  },
  {
    num: "04 · Точность",
    title: "Точечные правки",
    desc: "При update() динамические выражения пересчитываются, но в DOM попадают только те значения, которые действительно изменились.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · Изменение",
    title: "Измените данные",
    desc: "Состояние — это обычный JavaScript: переменные, массивы, объекты. Меняйте его как угодно и сколько угодно раз.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · Применение",
    title: "Вызовите update()",
    desc: "Одна глобальная функция применяет всё накопленное. Сделайте сколько нужно правок, затем один вызов. Пока вы не скомандуете, ничего не перерисовывается.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · Обновление",
    title: "Nuclo синхронизирует DOM",
    desc: "Каждое динамическое выражение вычисляется заново, а в DOM записывается только то, что изменилось. Без diff деревьев и без повторного рендера.",
    code: `<span class="cm">// изменены 2 узла,</span>
<span class="cm">// всё остальное не затронуто</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "Без diff деревьев. Без прокси. Без сюрпризов.";
export const COMPARISON_SUB =
  "Интерфейс меняется только тогда, когда вы вызываете update().";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "Virtual DOM",
    sub: "рендер → сравнение → применение",
    items: [
      { good: false, text: "Перерисовывает деревья компонентов при каждом изменении состояния" },
      { good: false, text: "Сравнивает старое и новое деревья, чтобы найти отличия" },
      { good: false, text: "Требует мемоизации, чтобы вернуть скорость" },
      { good: false, text: "Порождает устаревшие замыкания и массивы зависимостей" },
    ],
  },
  {
    name: "Сигналы и прокси",
    sub: "сигналы · хранилища · эффекты",
    items: [
      { good: false, text: "Оборачивает состояние в прокси и подписки" },
      { good: false, text: "Незаметно отслеживает зависимости во время выполнения" },
      { good: false, text: "Запускает каскады обновлений в моменты, которыми вы не управляете" },
      { good: false, text: "Трудно проходить по шагам в отладчике" },
    ],
  },
  {
    name: "Nuclo",
    sub: "изменение → update()",
    featured: true,
    items: [
      { good: true, text: "Обычное изменяемое состояние: без обёрток и прокси" },
      { good: true, text: "Вся модель работы — один вызов update()" },
      { good: true, text: "Трогает только изменившиеся значения" },
      { good: true, text: `~${NUCLO_GZIP_KB} КБ, ноль зависимостей, родной TypeScript` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "Быстро там, где это нужно.";
export const BENCHMARK_SUB =
  "Независимые замеры js-framework-benchmark: создание, обновление, перестановка и удаление тысяч строк.";

export const BENCHMARK_NOTE =
  "Оценка показывает, во сколько раз реализация медленнее самой быстрой из измеренных. Это взвешенное геометрическое среднее по всем keyed-тестам.";

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
export const CTA_TITLE = "Начните, когда будете готовы.";
export const CTA_SUB =
  "Установите Nuclo, добавьте один импорт и создавайте UI, который обновляется строго по вашей команде. Весь API осваивается за полдня.";

export const QUICK_START_STEPS = [
  {
    num: "01 - УСТАНОВКА",
    title: "Установите",
    desc: "Подключите Nuclo к проекту через npm, pnpm, yarn или bun.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - ИМПОРТ",
    title: "Импортируйте",
    desc: "Один side-effect импорт — и все 175 билдеров элементов доступны глобально.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - СОЗДАНИЕ",
    title: "Создавайте",
    desc: "Пишите обычные функции, которые возвращают узлы DOM, и вызывайте update() после изменения состояния.",
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
  copyInstall: "Скопировать команду установки",
  howItWorks: "Как это работает",
  pipelineTitle: "Один явный цикл.",
  pipelineSub: "Значения зависят от состояния, но ни графа зависимостей, ни планировщика здесь нет. Когда пересчитывать, решаете вы: один предсказуемый путь от данных до экрана.",
  philosophy: "Философия",
  features: "Возможности",
  featuresTitle: "Создан для ясности.",
  featuresSub: "Никакой магии и сюрпризов: каждое обновление — осознанное.",
  comparison: "Сравнение",
  theNucloWay: "путь nuclo",
  benchmarks: "Бенчмарки",
  lowerIsBetter: "Чем меньше, тем лучше",
  benchmarkSource: "Источник: js-framework-benchmark",
  quickStart: "Быстрый старт",
  quickStartTitle: "Старт за пару минут.",
  quickStartSub: "Три шага — и вы уже пишете настоящий UI.",
  readFullDocs: "Читать всю документацию →",
  examples: "Примеры",
  examplesTitle: "Посмотрите в деле.",
  examplesSub: "Живые демо, к каждому — исходный код.",
  viewAllExamples: "Все примеры →",
  readTheDocs: "Читать документацию",
  addATask: "Добавить задачу…",
  add: "Добавить",
  reset: "Сбросить",
  // The hero card
  previousExample: "Предыдущий пример",
  nextExample: "Следующий пример",
  closeCodeView: "Скрыть код",
  example: (n: number, title: string) => `Пример ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "Нарисуйте — затем обновите",
    note: "Сетка слева — обычный массив булевых значений: рисуя, вы лишь меняете данные. DOM справа обновится только по update(), и то лишь в изменившихся ячейках.",
  },
  Draw: {
    title: "Нарисуйте логотип",
    note: "Логотип Nuclo — спирограф: колесо катится внутри кольца, на нём два пера. Колесо, рычаги, перья и линии зависят от одного числа t. Таймлайн и цикл кадров лишь задают t, а update('draw') заново вызывает функции, которые его читают.",
  },
  Fireworks: {
    title: "Кликните по небу",
    note: "Каждая искра — обычный объект в массиве. list() создаёт для неё <line> и убирает в тот самый кадр, когда объект покидает массив. Один update() на кадр, без diff деревьев.",
  },
  Waves: {
    title: "Изогните волну",
    note: "Атрибут d каждого path — обычная функция от трёх чисел. Ползунки и цикл кадров меняют только числа, а update('waves') перезапускает функции, которые их читают.",
  },
  Sort: {
    title: "Сортировка без пересборки",
    note: "Пузырьковая сортировка переставляет объекты в обычном массиве. list() привязывает каждый столбец к его объекту, поэтому update() просто переставляет существующие узлы. Следите за счётчиком: столбцы не создаются заново.",
  },
  Chase: {
    title: "Потяните за верёвку",
    note: "Карточка — это scope(). Каждый кадр сдвигает 32 обычные точки и вызывает update('chase'): Nuclo пересчитывает атрибуты только этой карточки, остальную страницу не трогая.",
  },
  Reflex: {
    title: "Нажмите на зелёный",
    note: "Содержимое сцены определяет одна обычная строка. Ветка when() появляется, когда её условие становится истинным, и исчезает, когда оно перестаёт выполняться; класс сцены зависит от той же строки.",
  },
  Warp: {
    title: "Зажмите — и пространство изогнётся",
    note: "onMount запускает цикл кадров и возвращает функцию очистки. Когда поле размонтируется, Nuclo вызывает её: цикл останавливается, и ничего не продолжает работать в фоне.",
  },
  Life: {
    title: "Игра «Жизнь»",
    note: "Поле — обычный массив возрастов. Каждый такт вычисляет следующий массив и вызывает update(); класс ячейки зависит от её возраста, поэтому обновляются только те ячейки, что изменились.",
  },
};
