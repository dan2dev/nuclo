// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · 외부 의존성 없음`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["nuclo로 *명시적*인", "인터페이스를", "만드세요."];

export const HERO_DESC =
  "작고 타입 안전한 DOM 프레임워크. 상태는 그냥 평범하고 변경 가능한 데이터이고, 업데이트 시점은 직접 정합니다. 프록시도, 시그널도, 가상 DOM도 없습니다.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "외부 의존성" },
  { num: "175", sup: "",   label: "타입이 보장되는 HTML·SVG 빌더" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzip 기준 코어 런타임" },
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
  "상태를 바꿔도 아무 일도 일어나지 않습니다. update()를 부르는 순간, Nuclo는 시킨 일만 정확히 합니다. 더하지도 덜하지도 않고요.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "암묵적인 것보다 명시적인 것이 낫습니다",
    desc: "프록시가 뒤에서 모든 걸 지켜보지 않습니다. 상태를 바꾸고, update()를 호출하면 끝. 원인과 결과가 한눈에 보입니다.",
  },
  {
    num: "02",
    title: "마음껏 바꾸고, 업데이트는 한 번만",
    desc: "값을 열 번 바꿔도 update()는 한 번이면 충분합니다. DOM에는 최종 상태만 반영되니 쓸데없는 렌더링이 생기지 않습니다.",
  },
  {
    num: "03",
    title: "컴포넌트 말고, 그냥 함수",
    desc: "평범한 JavaScript 함수만 있으면 됩니다. 클래스도, 데코레이터도, 별도 문법도 필요 없습니다. 함수는 DOM 노드를 반환할 뿐이고, onMount와 onDestroy는 필요할 때만 modifier처럼 붙이면 됩니다.",
  },
];

export const FEATURES = [
  {
    num: "01 · 명시적",
    title: "업데이트 주기는 내 손에",
    desc: "마음껏 바꾼 뒤 update()를 한 번 호출하세요. 구독도, 스케줄러도 없고, 예기치 못한 diff도 없습니다. DOM은 내가 정한 순간에 맞춰집니다.",
  },
  {
    num: "02 · 경량",
    title: "외부 의존성 없음",
    desc: `코어 런타임은 gzip 기준 약 ${NUCLO_GZIP_KB} KB. 컴파일러도 빌드 플러그인도 필요 없습니다. import 한 줄이면 시작할 수 있습니다.`,
  },
  {
    num: "03 · 타입 안전",
    title: "TypeScript 중심 설계",
    desc: "타입이 빈틈없이 지정된 175개의 HTML·SVG 빌더 덕분에 속성, 스타일, 이벤트까지 전부 자동 완성됩니다.",
  },
  {
    num: "04 · 정밀함",
    title: "바뀐 곳만 정확히 패치",
    desc: "동적 표현식은 update()가 호출될 때 다시 평가되고, 실제로 달라진 값만 DOM에 반영됩니다.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · 변경",
    title: "데이터를 변경합니다",
    desc: "상태는 그냥 JavaScript 변수, 배열, 객체입니다. 원하는 방식으로, 원하는 만큼 바꾸세요.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · 적용",
    title: "update()를 호출합니다",
    desc: "전역 함수 하나로 변경 사항을 반영합니다. 여러 번 바꾼 뒤 한 번만 호출하면 됩니다. 호출하기 전에는 아무것도 렌더링되지 않습니다.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · 패치",
    title: "Nuclo가 DOM을 동기화합니다",
    desc: "동적 표현식이 모두 다시 평가되고, 달라진 값만 DOM에 기록됩니다. 트리 diff도, 리렌더링도 없습니다.",
    code: `<span class="cm">// 노드 2개 패치,</span>
<span class="cm">// 나머지는 그대로 유지</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "트리 diff도, 프록시도, 예기치 못한 동작도 없습니다.";
export const COMPARISON_SUB =
  "Nuclo의 UI는 update()를 호출할 때만 바뀝니다.";

export const COMPARISON_COLS: {
  name: string;
  sub: string;
  featured?: boolean;
  items: { good: boolean; text: string }[];
}[] = [
  {
    name: "가상 DOM",
    sub: "렌더링 → 비교 → 적용",
    items: [
      { good: false, text: "상태가 바뀔 때마다 컴포넌트 트리를 다시 렌더링합니다" },
      { good: false, text: "이전 트리와 새 트리를 diff해서 바뀐 곳을 찾습니다" },
      { good: false, text: "성능을 되찾으려면 메모이제이션이 필수입니다" },
      { good: false, text: "stale closure와 의존성 배열이 따라옵니다" },
    ],
  },
  {
    name: "시그널과 프록시",
    sub: "시그널 · 스토어 · 이펙트",
    items: [
      { good: false, text: "상태를 프록시와 구독으로 감싸야 합니다" },
      { good: false, text: "의존성을 런타임에 몰래 추적합니다" },
      { good: false, text: "업데이트가 내가 모르는 시점에 줄줄이 일어납니다" },
      { good: false, text: "디버거로 한 단계씩 따라가기 어렵습니다" },
    ],
  },
  {
    name: "Nuclo",
    sub: "변경 → update()",
    featured: true,
    items: [
      { good: true, text: "래퍼도 프록시도 없는 평범한 mutable 상태" },
      { good: true, text: "update() 호출 하나가 동작 모델의 전부입니다" },
      { good: true, text: "바뀐 값만 패치합니다" },
      { good: true, text: `약 ${NUCLO_GZIP_KB} KB, 의존성 0개, TypeScript 중심` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "정말 필요한 순간에 빠릅니다.";
export const BENCHMARK_SUB =
  "수천 개 행을 만들고, 고치고, 맞바꾸고, 지우는 과정을 측정한 js-framework-benchmark의 독립 결과입니다.";

export const BENCHMARK_NOTE =
  "점수는 가장 빠른 구현 대비 실행 시간의 배수이며, keyed 벤치마크 전체의 가중 기하 평균입니다.";

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
export const CTA_TITLE = "지금 바로 시작해 보세요.";
export const CTA_SUB =
  "Nuclo를 설치하고 한 번 import하면, 내가 원하는 순간에 정확히 바뀌는 UI를 만들 수 있습니다. API 전체를 반나절이면 익힐 수 있습니다.";

export const QUICK_START_STEPS = [
  {
    num: "01 - 설치",
    title: "설치",
    desc: "npm, pnpm, yarn, bun 중 편한 도구로 프로젝트에 Nuclo를 추가하세요.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - 임포트",
    title: "Import",
    desc: "side-effect import 한 줄이면 175개 태그 빌더가 전역에 등록됩니다.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - 만들기",
    title: "만들기",
    desc: "DOM 노드를 반환하는 평범한 함수를 작성하세요. 상태가 바뀌면 update()를 호출하면 됩니다.",
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
  getStarted: "시작하기",
  viewExamples: "예제 보기",
  copyInstall: "설치 명령 복사",
  howItWorks: "동작 방식",
  pipelineTitle: "명시적인 업데이트 주기, 단 하나.",
  pipelineSub: "상태에 따라 달라지는 값만 있을 뿐, 의존성 그래프도 스케줄러도 없습니다. 언제 실행할지는 내가 정하고, 데이터가 화면에 반영되는 경로는 하나뿐이라 언제나 예측할 수 있습니다.",
  philosophy: "철학",
  features: "특징",
  featuresTitle: "명료함을 위해 설계했습니다.",
  featuresSub: "마법도, 예상 밖의 동작도 없습니다. 모든 업데이트에는 이유가 있습니다.",
  comparison: "비교",
  theNucloWay: "nuclo 방식",
  benchmarks: "벤치마크",
  lowerIsBetter: "낮을수록 좋습니다",
  benchmarkSource: "출처: js-framework-benchmark",
  quickStart: "빠른 시작",
  quickStartTitle: "몇 분이면 첫 화면이 뜹니다.",
  quickStartSub: "단 세 단계로 진짜 UI를 만들어 보세요.",
  readFullDocs: "전체 문서 읽기 →",
  examples: "예제",
  examplesTitle: "눈으로 직접 확인하세요.",
  examplesSub: "바로 만져 볼 수 있는 데모와 그 코드를 함께 둘러보세요.",
  viewAllExamples: "모든 예제 보기 →",
  readTheDocs: "문서 읽기",
  addATask: "할 일 추가…",
  add: "추가",
  reset: "초기화",
  // The hero card
  previousExample: "이전 예제",
  nextExample: "다음 예제",
  closeCodeView: "코드 보기 닫기",
  example: (n: number, title: string) => `예제 ${n}: ${title}`,
};

// ── The hero card's examples, keyed by their export in home/examples.ts and home/playground.ts ──
export const HERO_EXAMPLES: Record<string, { title: string; note: string }> = {
  Paint: {
    title: "칠하고, 반영하기",
    note: "왼쪽 격자는 boolean 값의 평범한 배열입니다. 칠한다는 건 데이터를 바꾼다는 뜻일 뿐이고, 오른쪽 DOM은 update()가 실행될 때만 바뀝니다. 그때도 달라진 셀만 패치됩니다.",
  },
  Draw: {
    title: "로고 그리기",
    note: "Nuclo 로고는 스피로그래프입니다. 고리 안에서 구르는 바퀴에 펜 두 개가 달려 있죠. 바퀴, 팔, 펜, 선 모두 숫자 t 하나로 정해지는 함수입니다. 타임라인과 프레임 루프가 하는 일은 t를 바꾸는 것뿐이고, update('draw')가 그 값을 읽는 함수들을 다시 실행합니다.",
  },
  Fireworks: {
    title: "하늘을 눌러 보세요",
    note: "불꽃 하나하나가 배열 속 평범한 객체입니다. list()는 객체마다 <line>을 만들고, 객체가 배열에서 빠지는 프레임에 지웁니다. 프레임당 update()는 한 번, 트리 diff는 없습니다.",
  },
  Waves: {
    title: "파도를 휘어 보세요",
    note: "각 경로의 d는 숫자 세 개를 쓰는 평범한 함수입니다. 슬라이더와 프레임 루프는 숫자만 바꾸고, update('waves')가 그 값을 읽는 함수들을 다시 실행합니다.",
  },
  Sort: {
    title: "다시 만들지 않는 정렬",
    note: "버블 정렬이 평범한 배열 안에서 객체를 맞바꿉니다. list()가 막대마다 해당 객체를 연결해 두기 때문에, update()는 기존 노드를 새 순서로 옮기기만 합니다. 카운터를 보세요. 막대는 한 번도 다시 만들어지지 않습니다.",
  },
  Chase: {
    title: "줄을 이끌어 보세요",
    note: "이 카드는 scope()입니다. 프레임마다 평범한 점 32개를 옮기고 update('chase')를 호출하면, Nuclo는 이 카드의 속성만 다시 계산하고 나머지 페이지는 건드리지 않습니다.",
  },
  Reflex: {
    title: "초록색일 때 누르세요",
    note: "문자열 하나가 지금 무엇을 보여 줄지 정합니다. when() 분기는 조건이 참이 되면 만들어지고 거짓이 되면 사라지며, 화면의 클래스 역시 같은 문자열을 읽는 함수일 뿐입니다.",
  },
  Warp: {
    title: "길게 눌러 워프하세요",
    note: "onMount가 프레임 루프를 시작하고 cleanup 함수를 반환합니다. 별 영역이 언마운트되면 Nuclo가 cleanup을 실행해 루프를 멈추므로, 백그라운드에 남는 작업이 없습니다.",
  },
  Life: {
    title: "라이프 게임",
    note: "보드는 각 셀의 나이를 담은 평범한 배열입니다. 틱마다 다음 배열을 계산해 update()를 호출하고, 셀의 클래스는 나이에 따라 정해지는 함수라서 바뀐 셀만 패치됩니다.",
  },
};
