// home.ts: the home page's text. The constants are read when a section is built (never at
// module level), so a locale switch rebuilds them. pt/home.ts and es/home.ts mirror it.
import { NUCLO_VERSION, NUCLO_GZIP_KB } from "../../generated/nuclo-stats.ts";

export const HERO_BADGE = `Nuclo v${NUCLO_VERSION} · 외부 의존성 없음`;

// A *word* is marked: the hero draws a highlight behind it.
export const HERO_TITLE_LINES = ["*명시적인* UI를", "만들어 보세요", "nuclo로."];

export const HERO_DESC =
  "작고 타입 안전한 DOM 프레임워크입니다. 상태는 일반적인 변경 가능한 데이터로 유지됩니다. 모든 업데이트를 직접 제어합니다. 프록시, 시그널, 가상 DOM이 없습니다.";

export const INSTALL_CMD = "npm create nuclo@latest";

export const HERO_STATS = [
  { num: "0",   sup: "",   label: "외부 의존성" },
  { num: "175", sup: "",   label: "타입이 지정된 HTML 및 SVG 빌더" },
  { num: `~${NUCLO_GZIP_KB}`, sup: "KB", label: "gzip으로 압축한 코어 런타임" },
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
  "상태를 변경해도 아무 일도 일어나지 않습니다. update()를 호출하면 Nuclo가 요청한 작업만 정확히 수행합니다. 그 이상도, 이하도 아닙니다.";

export const PHILOSOPHY_POINTS = [
  {
    num: "01",
    title: "암묵적인 것보다 명시적인 것이 낫습니다",
    desc: "프록시가 모든 동작을 추적하지 않습니다. 상태를 변경한 다음 update()를 호출합니다. 원인과 결과가 명확하고 예측 가능합니다.",
  },
  {
    num: "02",
    title: "자유롭게 변경하고, 한 번만 업데이트합니다",
    desc: "열 번 변경한 다음 update()를 한 번 호출합니다. DOM에는 최종 상태만 반영되므로 불필요한 렌더링이 없습니다.",
  },
  {
    num: "03",
    title: "컴포넌트 대신 함수",
    desc: "일반 JavaScript 함수로 만듭니다. 클래스, 데코레이터, 특수 문법이 필요하지 않습니다. 각 함수는 DOM 노드를 반환합니다. 필요한 경우에만 onMount와 onDestroy를 일반 수정자로 추가합니다.",
  },
];

export const FEATURES = [
  {
    num: "01 · 명시적",
    title: "업데이트 주기를 직접 제어합니다",
    desc: "자유롭게 변경한 다음 update()를 한 번 호출합니다. 구독이나 스케줄러가 필요하지 않으며 예상하지 못한 비교 작업도 없습니다. DOM은 결정한 시점에 동기화됩니다.",
  },
  {
    num: "02 · 경량",
    title: "외부 의존성 없음",
    desc: `코어 런타임은 gzip 압축 시 약 ${NUCLO_GZIP_KB} KB입니다. 컴파일러나 빌드 플러그인이 필요하지 않습니다. import 하나를 추가하고 바로 시작하세요.`,
  },
  {
    num: "03 · 타입 지정",
    title: "TypeScript 중심 설계",
    desc: "타입이 완전히 지정된 175개의 HTML 및 SVG 빌더가 모든 속성, 스타일 속성, 이벤트에 자동 완성을 제공합니다.",
  },
  {
    num: "04 · 정밀함",
    title: "세밀한 패치",
    desc: "동적 표현식은 update()에서 다시 평가됩니다. 실제로 변경된 값만 DOM에 반영됩니다.",
  },
];

// ── "How update() works" pipeline ──────────────────────────────────────────
export const PIPELINE_STEPS = [
  {
    kicker: "01 · 변경",
    title: "데이터를 변경합니다",
    desc: "상태는 일반 JavaScript 변수, 배열, 객체입니다. 원하는 방식으로 원하는 만큼 변경할 수 있습니다.",
    code: `<span class="pr">todos</span><span class="pt">.</span><span class="fn">push</span><span class="pt">(</span><span class="pr">newTodo</span><span class="pt">)</span>
<span class="pr">user</span><span class="pt">.</span><span class="pr">name</span> <span class="pt">=</span> <span class="st">'Ada'</span>`,
  },
  {
    kicker: "02 · 적용",
    title: "update()를 호출합니다",
    desc: "전역 함수 하나로 변경 사항을 적용합니다. 여러 번 변경한 다음 한 번만 적용하세요. 직접 요청하기 전에는 아무것도 렌더링되지 않습니다.",
    code: `<span class="fn">update</span><span class="pt">()</span>`,
  },
  {
    kicker: "03 · 패치",
    title: "Nuclo가 DOM을 동기화합니다",
    desc: "모든 동적 표현식이 다시 평가됩니다. 실제로 변경된 값만 DOM에 기록합니다. 트리 비교나 재렌더링은 없습니다.",
    code: `<span class="cm">// 노드 2개 패치,</span>
<span class="cm">// 나머지는 그대로 유지</span>`,
  },
];

// ── Comparison ──────────────────────────────────────────────────────────────
export const COMPARISON_TITLE = "트리 비교도, 프록시도, 예상 밖의 동작도 없습니다.";
export const COMPARISON_SUB =
  "Nuclo는 update()를 호출할 때만 인터페이스를 업데이트합니다.";

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
      { good: false, text: "이전 트리와 새 트리를 비교해 변경 사항을 찾습니다" },
      { good: false, text: "성능을 되찾기 위해 메모이제이션이 필요합니다" },
      { good: false, text: "오래된 클로저와 의존성 배열이 남습니다" },
    ],
  },
  {
    name: "시그널과 프록시",
    sub: "시그널 · 스토어 · 이펙트",
    items: [
      { good: false, text: "상태를 프록시와 구독으로 감쌉니다" },
      { good: false, text: "런타임에 의존성을 보이지 않게 추적합니다" },
      { good: false, text: "제어할 수 없는 일정에 따라 업데이트가 연쇄적으로 발생합니다" },
      { good: false, text: "디버거에서 단계별로 따라가기 어렵습니다" },
    ],
  },
  {
    name: "Nuclo",
    sub: "변경 → update()",
    featured: true,
    items: [
      { good: true, text: "래퍼와 프록시가 없는 일반적인 변경 가능한 상태" },
      { good: true, text: "update() 한 번의 호출이 전체 동작 모델입니다" },
      { good: true, text: "변경된 값만 패치합니다" },
      { good: true, text: `약 ${NUCLO_GZIP_KB} KB, 외부 의존성 없음, TypeScript 중심` },
    ],
  },
];

// ── Benchmarks ──────────────────────────────────────────────────────────────
export const BENCHMARK_TITLE = "중요한 작업에서 빠르게.";
export const BENCHMARK_SUB =
  "수천 개 행의 생성, 업데이트, 교환, 삭제를 측정한 js-framework-benchmark의 독립적인 결과입니다.";

export const BENCHMARK_NOTE =
  "이 점수는 측정된 가장 빠른 구현 대비 실행 시간의 배수입니다. 키 기반 벤치마크 전체의 가중 기하 평균입니다.";

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
export const CTA_TITLE = "준비되면 바로 시작하세요.";
export const CTA_SUB =
  "Nuclo를 설치하고 한 번 import하면, 원하는 시점에 정확히 업데이트되는 UI를 만들 수 있습니다. API 전체를 오후 한나절에 배울 수 있습니다.";

export const QUICK_START_STEPS = [
  {
    num: "01 - 설치",
    title: "설치",
    desc: "npm, pnpm, yarn 또는 bun으로 프로젝트에 Nuclo를 추가합니다.",
    code: `<span class="pt">$</span> <span class="fn">npm</span> create nuclo@latest<span class="tcaret"></span>`,
    lang: "terminal",
  },
  {
    num: "02 - 가져오기",
    title: "가져오기",
    desc: "부수 효과 import 하나로 175개 태그 빌더를 모두 전역에 등록합니다.",
    code: `<span class="kw">import</span> <span class="st">'nuclo'</span>`,
    lang: "main.ts",
  },
  {
    num: "03 - 만들기",
    title: "만들기",
    desc: "DOM 노드를 반환하는 일반 함수를 작성합니다. 상태가 변경되면 update()를 호출합니다.",
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
  pipelineTitle: "하나의 명시적인 주기.",
  pipelineSub: "상태 의존 값만 있습니다. 의존성 그래프나 스케줄러는 없습니다. 실행 시점을 직접 결정하며, 데이터에서 화면까지의 경로를 예측할 수 있습니다.",
  philosophy: "철학",
  features: "특징",
  featuresTitle: "명확함을 위한 설계.",
  featuresSub: "마법도 예상 밖의 동작도 없습니다. 모든 업데이트는 의도적입니다.",
  comparison: "비교",
  theNucloWay: "nuclo 방식",
  benchmarks: "벤치마크",
  lowerIsBetter: "낮을수록 좋습니다",
  benchmarkSource: "출처: js-framework-benchmark",
  quickStart: "빠른 시작",
  quickStartTitle: "몇 분 만에 실행합니다.",
  quickStartSub: "세 단계면 실제 UI를 만들 수 있습니다.",
  readFullDocs: "전체 문서 읽기 →",
  examples: "예제",
  examplesTitle: "직접 동작을 확인하세요.",
  examplesSub: "대화형 데모와 각 데모의 코드를 살펴보세요.",
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
    title: "칠한 다음 패치하기",
    note: "왼쪽 격자는 불리언 값의 일반 배열입니다. 칠하기는 데이터를 변경할 뿐입니다. 오른쪽 DOM은 update()가 실행될 때만 바뀌며, 변경된 셀만 패치됩니다.",
  },
  Draw: {
    title: "로고 그리기",
    note: "Nuclo 로고는 스피로그래프입니다. 고리 안에서 도는 바퀴에 펜 두 개가 달려 있습니다. 바퀴, 팔, 펜, 선은 모두 숫자 t 하나의 함수입니다. 타임라인과 프레임 루프는 t만 설정하며, update('draw')가 그 값을 읽는 함수를 다시 실행합니다.",
  },
  Fireworks: {
    title: "하늘을 누르세요",
    note: "각 불꽃은 배열의 일반 객체입니다. list()는 각 객체에 <line>을 만들고, 객체가 배열에서 빠지는 프레임에 제거합니다. 프레임당 update() 한 번이며 트리 비교는 없습니다.",
  },
  Waves: {
    title: "파도 구부리기",
    note: "각 경로의 d는 숫자 세 개를 사용하는 일반 함수입니다. 슬라이더와 프레임 루프는 숫자만 변경하며, update('waves')가 그 값을 읽는 함수를 다시 실행합니다.",
  },
  Sort: {
    title: "다시 만들지 않고 정렬하기",
    note: "버블 정렬은 일반 배열의 객체를 교환합니다. list()가 각 막대를 해당 객체와 연결하므로 update()는 기존 노드를 새 순서로 이동합니다. 카운터를 확인하세요. 막대를 다시 만드는 일은 없습니다.",
  },
  Chase: {
    title: "줄 이끌기",
    note: "카드는 scope()입니다. 프레임마다 32개의 일반 점을 이동하고 update('chase')를 호출합니다. Nuclo는 이 카드의 속성만 다시 계산하며 나머지 페이지는 그대로 둡니다.",
  },
  Reflex: {
    title: "초록색일 때 누르세요",
    note: "일반 문자열 하나가 화면에 표시할 내용을 결정합니다. 각 when() 분기는 조건이 참이 되면 만들어지고 거짓이 되면 제거됩니다. 화면의 클래스도 같은 문자열을 사용하는 함수입니다.",
  },
  Warp: {
    title: "길게 눌러 공간 왜곡하기",
    note: "onMount는 프레임 루프를 시작하고 정리 함수를 반환합니다. 필드를 마운트 해제하면 Nuclo가 정리 함수를 실행해 루프를 멈추고 실행 중인 작업을 남기지 않습니다.",
  },
  Life: {
    title: "생명 게임",
    note: "보드는 나이를 담은 일반 배열입니다. 매 틱마다 다음 배열을 계산하고 update()를 호출합니다. 각 셀의 클래스는 나이의 함수이므로 변경된 셀만 패치됩니다.",
  },
};
